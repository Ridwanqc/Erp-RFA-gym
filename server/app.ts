import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import {
  helmetMiddleware,
  corsMiddleware,
  allowedMethodsMiddleware,
  antiPathTraversalMiddleware,
  xssSanitizeMiddleware
} from './middleware/security';
import { generalApiRateLimiter } from './middleware/rateLimiter';
import { authRouter } from './routes/authRoutes';
import { memberRouter } from './routes/memberRoutes';
import { transactionRouter } from './routes/transactionRoutes';
import { securityRouter } from './routes/securityRoutes';
import { uploadRouter } from './routes/uploadRoutes';
import { expenseRouter } from './routes/expenseRoutes';
import { AuditService } from './services/auditService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In compiled bundle, __dirname may point to root; check for dist relative to root
const rootDir = process.cwd();
const distPath = path.resolve(rootDir, 'dist');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// 1. Layered HTTP Security Headers (Helmet, CSP, HSTS, Frame Protection)
app.use(helmetMiddleware);

// 2. Strict CORS Whitelist (Never '*' in Production)
app.use(corsMiddleware);

// 3. Request Body Limit Protection (Max 2MB to prevent DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// 4. Allowed HTTP Methods Filter
app.use(allowedMethodsMiddleware);

// 5. Anti Path Traversal Protection
app.use(antiPathTraversalMiddleware);

// 6. XSS Input Sanitization
app.use(xssSanitizeMiddleware);

// 7. General API Rate Limiting
app.use('/api', generalApiRateLimiter);

import pg from 'pg';

// Initialize PostgreSQL Connection Pool if DATABASE_URL is provided (Dokploy / Production)
export let pgPool: pg.Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    const isSsl = process.env.DATABASE_URL.includes('sslmode=require') || process.env.DB_SSL === 'true';
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined
    });

    pgPool.query('SELECT 1').then(() => {
      console.log('[PostgreSQL] Connected successfully to database');
    }).catch((err) => {
      console.warn('[PostgreSQL] Database initial ping failed (will retry on requests):', err.message);
    });
  } catch (err: any) {
    console.warn('[PostgreSQL] Pool initialization error:', err?.message);
  }
}

// 7. Cloud Run, Dokploy & Kubernetes Health Check Probes
app.get(['/health', '/healthz', '/_healthz', '/api/health'], async (_req: Request, res: Response) => {
  let dbStatus = 'not_configured';
  if (pgPool) {
    try {
      await pgPool.query('SELECT 1');
      dbStatus = 'connected';
    } catch (e: any) {
      dbStatus = `disconnected (${e.message})`;
    }
  } else {
    dbStatus = 'in_memory_fallback';
  }

  res.status(200).json({
    status: 'ok',
    service: 'RFA GYM ERP Enterprise',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      configured: Boolean(process.env.DATABASE_URL)
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Dedicated DB probe for Dokploy / DevOps verification
app.get('/api/health/db', async (_req: Request, res: Response) => {
  if (!pgPool) {
    return res.status(200).json({
      success: true,
      mode: 'in_memory_fallback',
      message: 'DATABASE_URL belum dikonfigurasi. Server berjalan dengan in-memory store.'
    });
  }

  try {
    const start = Date.now();
    const result = await pgPool.query('SELECT current_database(), current_user, version()');
    const latencyMs = Date.now() - start;

    return res.status(200).json({
      success: true,
      connected: true,
      latencyMs,
      database: result.rows[0]?.current_database,
      user: result.rows[0]?.current_user,
      postgresVersion: result.rows[0]?.version?.split(' ')?.[0] + ' ' + result.rows[0]?.version?.split(' ')?.[1]
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      connected: false,
      error: error.message,
      hint: 'Periksa DATABASE_URL di Environment Variables Dokploy. Pastikan host dan password benar.'
    });
  }
});

// 8. Mount Secure REST API Routes
app.use('/api/auth', authRouter);
app.use('/api/members', memberRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/admin/security', securityRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/expenses', expenseRouter);

// 9. Static Assets & Frontend Integration
if (isProduction || fs.existsSync(distPath)) {
  // Serve optimized build bundle from dist
  app.use(
    express.static(distPath, {
      maxAge: '1d',
      setHeaders: (response, filePath) => {
        if (filePath.endsWith('.html')) {
          response.setHeader('Cache-Control', 'no-cache');
        }
      }
    })
  );

  // SPA Fallback: serve index.html for all non-API client routes
  app.get('*', (_req: Request, res: Response) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(indexPath);
    }
    return res.status(200).send('GymPro ERP Enterprise is running.');
  });
} else {
  // Development Mode: Mount Vite middlewares dynamically on Express
  (async () => {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('[GymPro Server] Vite middleware initialization skipped:', err);
    }
  })();
}

// 10. Global Secure Error Handler (Never leak stack traces, database credentials, or file paths)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[GymPro Security Alert] Uncaught Error:', err);

  AuditService.recordSecurityEvent({
    eventType: 'UNCAUGHT_SERVER_EXCEPTION',
    severity: 'MEDIUM',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details: `Error pada ${req.method} ${req.originalUrl}: ${err.message}`
  });

  return res.status(err.status || 500).json({
    success: false,
    message: isProduction
      ? 'Terjadi kesalahan pada server. Tim teknis telah menerima log insiden ini.'
      : err.message || 'Terjadi kesalahan pada server.'
  });
});

// 11. Port Binding for Cloud Run & AI Studio Environments
const host = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

app.listen(port, host, () => {
  console.log(`[GymPro Enterprise] Security Shield successfully active on http://${host}:${port}`);
});

export default app;

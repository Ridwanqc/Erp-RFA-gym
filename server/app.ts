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
  antiPathTraversalMiddleware
} from './middleware/security';
import { generalApiRateLimiter } from './middleware/rateLimiter';
import { authRouter } from './routes/authRoutes';
import { memberRouter } from './routes/memberRoutes';
import { transactionRouter } from './routes/transactionRoutes';
import { securityRouter } from './routes/securityRoutes';
import { uploadRouter } from './routes/uploadRoutes';
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

// 6. General API Rate Limiting
app.use('/api', generalApiRateLimiter);

// 7. Cloud Run & Kubernetes Health Check Probes
app.get(['/health', '/healthz', '/_healthz', '/api/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'GymPro ERP Enterprise Security Shield',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 8. Mount Secure REST API Routes
app.use('/api/auth', authRouter);
app.use('/api/members', memberRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/admin/security', securityRouter);
app.use('/api/upload', uploadRouter);

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

// 11. Multi-Port Binding for Cloud Run & AI Studio Environments
const host = '0.0.0.0';
const primaryPort = parseInt(process.env.PORT || '8080', 10);
const portsToListen = Array.from(new Set([primaryPort, 3000, 8080]));

for (const port of portsToListen) {
  try {
    const srv = app.listen(port, host, () => {
      console.log(`[GymPro Enterprise] Security Shield successfully active on http://${host}:${port}`);
    });

    srv.on('error', (err: any) => {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`[GymPro Enterprise] Port ${port} is occupied by reverse-proxy / container process.`);
      } else {
        console.error(`[GymPro Enterprise] Listener error on port ${port}:`, err);
      }
    });
  } catch (err) {
    console.warn(`[GymPro Enterprise] Could not initialize listener on port ${port}:`, err);
  }
}

export default app;

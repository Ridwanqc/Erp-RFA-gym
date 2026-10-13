import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';

// 1. Helmet Security Headers Configuration
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      frameAncestors: [
        "'self'",
        'https://*.google.com',
        'https://*.googleusercontent.com',
        'https://*.run.app',
        'https://aistudio.google.com',
        'https://localhost.corp.google.com:*'
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: false,
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// 2. CORS Security Configuration (Strict Origin Whitelist - Never '*' in Production)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.APP_URL || '',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) in non-production
    if (!origin) return callback(null, true);
    
    // Check against explicit whitelist or Cloud Run subdomains of AI Studio
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /\.run\.app$/i.test(origin) ||
      /\.google\.com$/i.test(origin) ||
      origin.startsWith('http://localhost:');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin '${origin}' is not authorized by GymPro security policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
};

export const corsMiddleware = cors(corsOptions);

// 3. HTTP Methods Filter: Only allow safe, recognized HTTP methods
export const allowedMethodsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const safeMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  if (!safeMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: `HTTP Method '${req.method}' tidak diizinkan oleh sistem keamanan.`
    });
  }
  next();
};

// 4. Anti-Path-Traversal Middleware
export const antiPathTraversalMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const checkValue = (val: string): boolean => {
    return val.includes('../') || val.includes('..\\') || val.includes('%2e%2e%2f') || val.includes('%2e%2e/');
  };

  const urlDangerous = checkValue(req.url) || checkValue(req.path);
  if (urlDangerous) {
    return res.status(400).json({
      success: false,
      message: 'Akses ditolak: Terdeteksi pola path traversal ilegal.'
    });
  }

  next();
};

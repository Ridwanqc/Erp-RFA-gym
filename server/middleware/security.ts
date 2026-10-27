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

const isProd = process.env.NODE_ENV === 'production';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests without origin (mobile apps, internal curl, health probes)
    if (!origin) return callback(null, true);

    const isExplicit = allowedOrigins.includes(origin);
    const isRfagymDomain = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?rfagym\.com(?::\d+)?$/i.test(origin);
    const isGoogleCloudRun = /\.run\.app$/i.test(origin) || /\.google\.com$/i.test(origin);
    const isLocalDev = !isProd && origin.startsWith('http://localhost:');

    if (isExplicit || isRfagymDomain || isGoogleCloudRun || isLocalDev) {
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

// 4. Anti-Path-Traversal & Null-Byte Protection Middleware
export const antiPathTraversalMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const checkValue = (val: string): boolean => {
    if (!val) return false;
    // Check for null bytes or null byte URL encoding
    if (val.indexOf('\0') !== -1 || val.includes('%00') || val.includes('\\0')) {
      return true;
    }

    // Decode multiple levels to catch double and multi-encoded payloads (e.g. %252e%252e%252f)
    let decoded = val;
    for (let i = 0; i < 3; i++) {
      try {
        const nextDecoded = decodeURIComponent(decoded);
        if (nextDecoded === decoded) break;
        decoded = nextDecoded;
      } catch {
        // Malformed URI sequence is treated as malicious
        return true;
      }
    }

    const lower = decoded.toLowerCase();
    if (
      lower.includes('../') ||
      lower.includes('..\\') ||
      lower.includes('..%2f') ||
      lower.includes('..%5c') ||
      /\.\.[/\\]/.test(decoded)
    ) {
      return true;
    }

    return false;
  };

  const urlDangerous =
    checkValue(req.url) ||
    checkValue(req.path) ||
    (req.originalUrl && checkValue(req.originalUrl));

  if (urlDangerous) {
    return res.status(400).json({
      success: false,
      message: 'Akses ditolak: Terdeteksi pola path traversal atau manipulasi encoding ilegal.'
    });
  }

  next();
};

// 5. XSS Sanitization Helpers & Middleware
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val;
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '');
}

export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') return sanitizeString(obj) as any;
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as any;
  }
  const result: any = {};
  for (const key of Object.keys(obj as any)) {
    const val = (obj as any)[key];
    if (typeof val === 'string') {
      result[key] = sanitizeString(val);
    } else if (typeof val === 'object' && val !== null) {
      result[key] = sanitizeObject(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export const xssSanitizeMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
};

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// 1. Strict Auth Rate Limiter (5 requests / 15 minutes / IP)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan autentikasi dari alamat ini. Silakan coba kembali setelah 15 menit.',
      retryAfterMinutes: 15
    });
  }
});

// 2. Sensitive Actions Rate Limiter (Void, Refund, Password Reset)
export const sensitiveActionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    return res.status(429).json({
      success: false,
      message: 'Batas frekuensi aksi sensitif tercapai. Demi keamanan, aksi ditunda sementara.',
      retryAfterMinutes: 15
    });
  }
});

// 3. General API Rate Limiter (150 requests / 1 minute)
export const generalApiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak permintaan ke server. Mohon perlambat laju akses Anda.'
    });
  }
});

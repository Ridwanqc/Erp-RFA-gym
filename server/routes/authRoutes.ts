import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { authMiddleware } from '../middleware/auth';
import { authRateLimiter, sensitiveActionRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validator';

export const authRouter = Router();

// Validation Schemas
const loginSchema = z.object({
  identifier: z.string().min(1, 'Username atau email wajib diisi.').max(100),
  password: z.string().min(1, 'Password wajib diisi.').max(128)
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Password lama wajib diisi.'),
  newPassword: z
    .string()
    .min(8, 'Password baru minimal 8 karakter.')
    .regex(/[A-Za-z]/, 'Password harus mengandung huruf.')
    .regex(/[0-9]/, 'Password harus mengandung angka.')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid.')
});

// 1. POST /api/auth/login
authRouter.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      const tokens = await AuthService.login(
        identifier,
        password,
        req.ip || req.socket.remoteAddress,
        req.headers['user-agent']
      );

      // Set HttpOnly Secure Cookie
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 mins
      });

      return res.status(200).json({
        success: true,
        message: 'Login berhasil.',
        ...tokens
      });
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: err.message || 'Username atau password salah.'
      });
    }
  }
);

// 2. POST /api/auth/refresh (Refresh Token Rotation)
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token tidak disertakan.'
      });
    }

    const rotatedTokens = await AuthService.refreshTokens(
      refreshToken,
      req.ip || req.socket.remoteAddress,
      req.headers['user-agent']
    );

    res.cookie('accessToken', rotatedTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Token berhasil diperbarui.',
      ...rotatedTokens
    });
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: err.message || 'Sesi tidak valid.'
    });
  }
});

// 3. POST /api/auth/logout
authRouter.post('/logout', authMiddleware, (req: Request, res: Response) => {
  const sessionId = req.user?.sessionId;
  const userId = req.user?.userId;

  AuthService.logout(sessionId, userId, req.ip);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return res.status(200).json({
    success: true,
    message: 'Logout berhasil. Sesi telah dicabut.'
  });
});

// 4. GET /api/auth/me (Safe DTO - never returns password hash)
authRouter.get('/me', authMiddleware, (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

// 5. POST /api/auth/change-password
authRouter.post(
  '/change-password',
  authMiddleware,
  sensitiveActionRateLimiter,
  validateRequest({ body: changePasswordSchema }),
  async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user!.userId;

      await AuthService.changePassword(
        userId,
        oldPassword,
        newPassword,
        req.ip || req.socket.remoteAddress,
        req.headers['user-agent']
      );

      return res.status(200).json({
        success: true,
        message: 'Password berhasil diubah. Sesi perangkat lain telah dicabut demi keamanan.'
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);

// 6. POST /api/auth/forgot-password (Never leaks email existence)
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: 'Jika email terdaftar pada sistem GymPro, instruksi pemulihan telah dikirimkan ke kotak masuk Anda.'
    });
  }
);

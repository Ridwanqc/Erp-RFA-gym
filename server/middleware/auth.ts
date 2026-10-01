import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserEntity } from '../database/db';
import { AuditService } from '../services/auditService';

export const JWT_SECRET = process.env.JWT_SECRET || 'gympro-enterprise-jwt-secret-key-32-chars-min-xyz';
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'gympro-enterprise-refresh-secret-key-32-chars-xyz';

export interface AuthenticatedUserPayload {
  userId: string;
  username: string;
  email: string;
  role: UserEntity['role'];
  branchId?: string;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
      token?: string;
    }
  }
}

/**
 * Authentication Middleware: Validates Bearer token or HttpOnly Cookie,
 * checks expiry, verifies user account status, and ensures user is not locked or suspended.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check cookies fallback
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Token autentikasi tidak ditemukan. Silakan login kembali.'
      });
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload & { exp: number };

    // 4. Verify user exists in database and is active
    const user = db.users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Pengguna tidak lagi terdaftar.'
      });
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Status akun Anda adalah '${user.status}'. Hubungi administrator.`
      });
    }

    // Check temporary account lock
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Akun terkunci sementara demi keamanan. Coba kembali dalam ${remainingMinutes} menit.`
      });
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      sessionId: decoded.sessionId
    };
    req.token = token;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Sesi token telah kedaluwarsa. Silakan perbarui sesi menggunakan refresh token.'
      });
    }

    // Log suspicious invalid token attempt
    AuditService.recordSecurityEvent({
      eventType: 'INVALID_TOKEN_ATTEMPT',
      severity: 'MEDIUM',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      details: `Percobaan akses dengan token tidak sah: ${err.message}`
    });

    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau telah dirusak.'
    });
  }
};

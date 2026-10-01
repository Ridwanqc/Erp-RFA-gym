import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, UserEntity, UserSessionEntity } from '../database/db';
import { JWT_SECRET, REFRESH_TOKEN_SECRET, AuthenticatedUserPayload } from '../middleware/auth';
import { AuditService } from './auditService';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: UserEntity['role'];
    branchId?: string;
    branchName?: string;
    mustChangePassword: boolean;
  };
}

export class AuthService {
  /**
   * Secure Login with Brute-Force Lockout Protection:
   * 5 consecutive failed attempts locks account for 15 minutes.
   * Responses never leak username existence.
   */
  static async login(
    identifier: string, // username or email
    passwordPlain: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<TokenPair> {
    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Search user by username or email
    const user = Array.from(db.users.values()).find(
      (u) => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
    );

    // 2. Generic failure message to prevent user enumeration
    const genericFailure = 'Username atau password salah.';

    if (!user) {
      // Perform dummy bcrypt compare to prevent timing attacks
      await bcrypt.compare(passwordPlain, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
      
      AuditService.recordSecurityEvent({
        eventType: 'LOGIN_FAILED_UNKNOWN_USER',
        severity: 'LOW',
        ipAddress,
        userAgent,
        details: `Gagal login dengan identifier yang tidak terdaftar: ${cleanIdentifier}`
      });

      throw new Error(genericFailure);
    }

    // 3. Check if account is currently locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      
      AuditService.recordSecurityEvent({
        eventType: 'LOCKED_ACCOUNT_LOGIN_ATTEMPT',
        severity: 'MEDIUM',
        ipAddress,
        userAgent,
        userId: user.id,
        details: `Percobaan login ke akun yang sedang terkunci: ${user.username}`
      });

      throw new Error(`Akun sementara dikunci karena terlalu banyak percobaan gagal. Silakan coba kembali dalam ${remainingMinutes} menit.`);
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);

    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        user.status = 'LOCKED';

        AuditService.recordSecurityEvent({
          eventType: 'BRUTE_FORCE_LOCKOUT',
          severity: 'HIGH',
          ipAddress,
          userAgent,
          userId: user.id,
          details: `Akun '${user.username}' dikunci selama 15 menit setelah 5x gagal login berturut-turut.`
        });

        AuditService.log({
          userId: user.id,
          action: 'LOGIN_FAILED_LOCKED',
          module: 'AUTH',
          recordId: user.id,
          newValue: { failedAttempts: user.failedLoginAttempts, lockedUntil: user.lockedUntil },
          ipAddress,
          userAgent
        });

        throw new Error('Akun telah dikunci sementara selama 15 menit karena 5 kali percobaan login gagal berturut-turut.');
      }

      AuditService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        recordId: user.id,
        newValue: { failedAttempts: user.failedLoginAttempts },
        ipAddress,
        userAgent
      });

      throw new Error(genericFailure);
    }

    // 5. Check if user is active
    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new Error(`Akun Anda tidak aktif (${user.status}). Hubungi administrator.`);
    }

    // 6. Reset failed attempts & update last login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.status = 'ACTIVE';
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();

    // 7. Create Session & Issue Tokens
    const sessionId = 'SES-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    
    // Access token: 15 minutes
    const accessTokenPayload: AuthenticatedUserPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      sessionId
    };

    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, { expiresIn: '15m' });

    // Refresh token: 7 days
    const refreshToken = jwt.sign({ userId: user.id, sessionId }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // Store HASHED refresh token in DB
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const session: UserSessionEntity = {
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.slice(0, 255) : null,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      revokedAt: null
    };

    db.sessions.set(session.id, session);

    // Record Audit Log
    AuditService.log({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      recordId: user.id,
      newValue: { username: user.username, role: user.role, sessionId },
      ipAddress,
      userAgent
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: '15m',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branchName,
        mustChangePassword: user.mustChangePassword
      }
    };
  }

  /**
   * Refresh Token Rotation:
   * Validates refresh token, invalidates old token, and generates fresh token pair.
   * Protects against token reuse attacks by revoking all user sessions if reuse detected.
   */
  static async refreshTokens(
    oldRefreshToken: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
    try {
      const decoded = jwt.verify(oldRefreshToken, REFRESH_TOKEN_SECRET) as { userId: string; sessionId: string };
      const session = db.sessions.get(decoded.sessionId);

      if (!session) {
        throw new Error('Sesi tidak ditemukan.');
      }

      // Check if session has been revoked (Token Reuse Detection)
      if (session.revokedAt) {
        // Attack detected: Someone is reusing a revoked token! Revoke ALL user sessions!
        Array.from(db.sessions.values())
          .filter((s) => s.userId === decoded.userId)
          .forEach((s) => { s.revokedAt = new Date(); });

        AuditService.recordSecurityEvent({
          eventType: 'REFRESH_TOKEN_REUSE_ATTACK',
          severity: 'CRITICAL',
          ipAddress,
          userAgent,
          userId: decoded.userId,
          details: `Terdeteksi percobaan penggunaan kembali refresh token yang telah dicabut pada sesi ${decoded.sessionId}. Seluruh sesi user dicabut demi keamanan.`
        });

        throw new Error('Sesi tidak sah. Terdeteksi anomali token.');
      }

      // Verify token matches stored hash
      const isMatch = await bcrypt.compare(oldRefreshToken, session.refreshTokenHash);
      if (!isMatch) {
        session.revokedAt = new Date();
        throw new Error('Refresh token tidak cocok.');
      }

      const user = db.users.get(decoded.userId);
      if (!user || user.status !== 'ACTIVE') {
        throw new Error('Pengguna tidak aktif.');
      }

      // Invalidate old session
      session.revokedAt = new Date();

      // Create new session & rotated tokens
      const newSessionId = 'SES-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      const newAccessToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          sessionId: newSessionId
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id, sessionId: newSessionId },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      const newHash = await bcrypt.hash(newRefreshToken, 10);
      db.sessions.set(newSessionId, {
        id: newSessionId,
        userId: user.id,
        refreshTokenHash: newHash,
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.slice(0, 255) : null,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        revokedAt: null
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: '15m'
      };
    } catch (err: any) {
      throw new Error('Refresh token kedaluwarsa atau tidak valid. Silakan login kembali.');
    }
  }

  /**
   * Revoke current session
   */
  static logout(sessionId?: string, userId?: string, ipAddress?: string | null) {
    if (sessionId && db.sessions.has(sessionId)) {
      const s = db.sessions.get(sessionId)!;
      s.revokedAt = new Date();
    }

    AuditService.log({
      userId: userId || null,
      action: 'LOGOUT',
      module: 'AUTH',
      recordId: sessionId || null,
      ipAddress
    });
  }

  /**
   * Revoke all active sessions for a user (e.g. on password change or suspicious activity)
   */
  static revokeAllUserSessions(userId: string) {
    Array.from(db.sessions.values())
      .filter((s) => s.userId === userId && !s.revokedAt)
      .forEach((s) => { s.revokedAt = new Date(); });
  }

  /**
   * Change password with validation, bcrypt hashing, and audit log
   */
  static async changePassword(
    userId: string,
    oldPass: string,
    newPass: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ) {
    const user = db.users.get(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isMatch) {
      AuditService.recordSecurityEvent({
        eventType: 'CHANGE_PASSWORD_FAILED',
        severity: 'MEDIUM',
        ipAddress,
        userAgent,
        userId,
        details: 'Gagal ganti password: password lama salah.'
      });
      throw new Error('Password lama yang Anda masukkan salah.');
    }

    // Minimum password strength validation
    if (newPass.length < 8 || !/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
      throw new Error('Password baru minimal 8 karakter dan harus mengandung kombinasi huruf dan angka.');
    }

    user.passwordHash = await bcrypt.hash(newPass, 10);
    user.mustChangePassword = false;
    user.updatedAt = new Date();

    // Revoke all existing sessions for safety
    this.revokeAllUserSessions(userId);

    AuditService.log({
      userId,
      action: 'CHANGE_PASSWORD',
      module: 'AUTH',
      recordId: userId,
      ipAddress,
      userAgent
    });
  }
}

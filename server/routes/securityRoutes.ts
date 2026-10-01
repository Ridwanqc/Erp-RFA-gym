import { Router, Request, Response } from 'express';
import { db } from '../database/db';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { SecurityHealthService } from '../services/securityHealthService';
import { AuditService } from '../services/auditService';

export const securityRouter = Router();

// All security routes require ADMIN role
securityRouter.use(authMiddleware, requireRoles(['ADMIN']));

// 1. GET /api/admin/security/health
securityRouter.get('/health', (req: Request, res: Response) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const report = SecurityHealthService.getHealthReport(isSecure);

  return res.status(200).json({
    success: true,
    report
  });
});

// 2. GET /api/admin/security/events
securityRouter.get('/events', (req: Request, res: Response) => {
  const { severity, unresolvedOnly } = req.query;
  let events = [...db.securityEvents];

  if (severity && typeof severity === 'string') {
    events = events.filter((e) => e.severity === severity.toUpperCase());
  }

  if (unresolvedOnly === 'true') {
    events = events.filter((e) => !e.resolved);
  }

  return res.status(200).json({
    success: true,
    count: events.length,
    events
  });
});

// 3. POST /api/admin/security/events/:id/resolve
securityRouter.post('/events/:id/resolve', (req: Request, res: Response) => {
  const event = db.securityEvents.find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event keamanan tidak ditemukan.' });
  }

  event.resolved = true;
  AuditService.log({
    userId: req.user?.userId,
    action: 'RESOLVE_SECURITY_EVENT',
    module: 'SECURITY',
    recordId: event.id,
    ipAddress: req.ip
  });

  return res.status(200).json({
    success: true,
    message: 'Event keamanan berhasil ditandai selesai.'
  });
});

// 4. GET /api/admin/security/sessions
securityRouter.get('/sessions', (_req: Request, res: Response) => {
  const sessions = Array.from(db.sessions.values()).map((s) => {
    const user = db.users.get(s.userId);
    return {
      id: s.id,
      userId: s.userId,
      username: user?.username || 'Unknown',
      role: user?.role || 'KARYAWAN',
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isRevoked: Boolean(s.revokedAt)
    };
  });

  return res.status(200).json({
    success: true,
    count: sessions.length,
    sessions
  });
});

// 5. DELETE /api/admin/security/sessions/:id (Revoke Session)
securityRouter.delete('/sessions/:id', (req: Request, res: Response) => {
  const session = db.sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan.' });
  }

  session.revokedAt = new Date();
  AuditService.log({
    userId: req.user?.userId,
    action: 'REVOKE_USER_SESSION',
    module: 'SECURITY',
    recordId: session.id,
    ipAddress: req.ip
  });

  return res.status(200).json({
    success: true,
    message: `Sesi '${session.id}' berhasil dicabut.`
  });
});

// 6. POST /api/admin/security/unlock-user/:id (Unlock Locked Account)
securityRouter.post('/unlock-user/:id', (req: Request, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.status = 'ACTIVE';

  AuditService.log({
    userId: req.user?.userId,
    action: 'UNLOCK_USER_ACCOUNT',
    module: 'SECURITY',
    recordId: user.id,
    ipAddress: req.ip
  });

  return res.status(200).json({
    success: true,
    message: `Akun '${user.username}' berhasil dibuka kembali (unlocked).`
  });
});

// 7. GET /api/admin/security/audit-logs
securityRouter.get('/audit-logs', (req: Request, res: Response) => {
  const { module, action, limit = 100 } = req.query;
  let logs = [...db.auditLogs];

  if (module && typeof module === 'string') {
    logs = logs.filter((l) => l.module === module.toUpperCase());
  }

  if (action && typeof action === 'string') {
    logs = logs.filter((l) => l.action === action.toUpperCase());
  }

  const parsedLimit = Math.min(Number(limit) || 100, 200);

  return res.status(200).json({
    success: true,
    count: logs.length,
    logs: logs.slice(0, parsedLimit)
  });
});

// 8. POST /api/admin/security/backup (Trigger new database backup)
securityRouter.post('/backup', (req: Request, res: Response) => {
  const backup = SecurityHealthService.triggerBackup();

  AuditService.log({
    userId: req.user?.userId,
    action: 'CREATE_BACKUP',
    module: 'SECURITY',
    recordId: backup.id,
    newValue: { filename: backup.filename, size: backup.sizeBytes, checksum: backup.checksum },
    ipAddress: req.ip
  });

  return res.status(201).json({
    success: true,
    message: 'Backup database berhasil dibuat dengan checksum SHA-256.',
    backup
  });
});

// 9. GET /api/admin/security/backups
securityRouter.get('/backups', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    count: db.backups.length,
    backups: db.backups
  });
});

import { Request, Response, NextFunction } from 'express';
import { UserEntity, db } from '../database/db';
import { AuditService } from '../services/auditService';

/**
 * Role-Based Access Control (RBAC) Middleware:
 * Enforces role authorization strictly on the backend. Never trusts role claims from frontend.
 */
export const requireRoles = (allowedRoles: UserEntity['role'][]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Autentikasi diperlukan.'
      });
    }

    const userRole = req.user.role;

    // ADMIN always has full permission
    if (userRole === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      AuditService.recordSecurityEvent({
        eventType: 'UNAUTHORIZED_ROLE_ACCESS',
        severity: 'HIGH',
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers?.['user-agent'],
        userId: req.user.userId,
        details: `User '${req.user.username}' dengan role '${userRole}' mencoba mengakses endpoint terlarang: ${req.method} ${req.originalUrl}`
      });

      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Peran '${userRole}' tidak memiliki izin untuk tindakan ini.`
      });
    }

    next();
  };
};

/**
 * Object-Level Authorization (Anti-IDOR) Middleware for Member data:
 * Ensures Member users can ONLY view/edit their own data.
 * Trainers can only view members assigned to them.
 * Staff/Cashier/Leader/Admin can view members within their branch/permission.
 */
export const requireMemberOwnershipOrStaff = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
  }

  const requestedMemberId = req.params.id || req.params.memberId || req.body.memberId;
  const user = req.user;

  // 1. Admin and Leader have global/branch-wide access
  if (user.role === 'ADMIN' || user.role === 'LEADER' || user.role === 'KARYAWAN' || user.role === 'KASIR') {
    return next();
  }

  // 2. Trainer: Can only view members assigned to them
  if (user.role === 'TRAINER') {
    const member = db.members.get(requestedMemberId);
    if (!member || member.assignedTrainerId !== user.userId) {
      AuditService.recordSecurityEvent({
        eventType: 'IDOR_TRAINER_VIOLATION',
        severity: 'MEDIUM',
        ipAddress: req.ip,
        userId: user.userId,
        details: `Trainer '${user.username}' mencoba mengakses member yang tidak ditugaskan kepadanya: ${requestedMemberId}`
      });
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda hanya berwenang mengakses data member yang ditugaskan kepada Anda.'
      });
    }
    return next();
  }

  // 3. Member: MUST match their own record
  if (user.role === 'MEMBER') {
    // Check if the requested memberId corresponds to this user
    const member = db.members.get(requestedMemberId);
    const isOwner = member && (member.email === user.email || member.id === user.userId);

    if (!isOwner) {
      AuditService.recordSecurityEvent({
        eventType: 'IDOR_MEMBER_BREACH_ATTEMPT',
        severity: 'CRITICAL',
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers?.['user-agent'],
        userId: user.userId,
        details: `Member '${user.username}' (ID: ${user.userId}) mencoba mengakses data member lain: ${requestedMemberId}`
      });

      return res.status(403).json({
        success: false,
        message: 'Akses ditolak (IDOR Protection): Anda tidak memiliki izin mengakses data profil member lain.'
      });
    }

    return next();
  }

  return res.status(403).json({ success: false, message: 'Izin akses tidak mencukupi.' });
};

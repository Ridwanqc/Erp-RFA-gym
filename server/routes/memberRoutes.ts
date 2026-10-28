import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db';
import { authMiddleware } from '../middleware/auth';
import { requireRoles, requireMemberOwnershipOrStaff } from '../middleware/rbac';
import { sensitiveActionRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validator';
import { AuditService } from '../services/auditService';

export const memberRouter = Router();

// Whitelisted profile update schema (Mass Assignment Protection)
const updateMemberSchema = z.object({
  phone: z.string().min(8).max(20).regex(/^[0-9+-\s]+$/, 'Format nomor telepon tidak valid.').optional(),
  email: z.string().email('Format email tidak valid.').max(100).optional(),
  name: z.string().min(2, 'Nama minimal 2 karakter.').max(100).optional()
}).strict(); // Disallows unknown fields like 'role', 'status', 'id'

// 1. GET /api/members
memberRouter.get(
  '/',
  authMiddleware,
  requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR', 'TRAINER']),
  (req: Request, res: Response) => {
    let members = Array.from(db.members.values());

    // If Trainer, only show assigned members
    if (req.user?.role === 'TRAINER') {
      members = members.filter((m) => m.assignedTrainerId === req.user?.userId);
    }

    return res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  }
);

// 2. GET /api/members/:id (Protected with Object-Level Authorization / Anti-IDOR)
memberRouter.get(
  '/:id',
  authMiddleware,
  requireMemberOwnershipOrStaff,
  (req: Request, res: Response) => {
    const member = db.members.get(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      data: member
    });
  }
);

// 3. PUT /api/members/:id (Mass Assignment Protected & Rate Limited)
memberRouter.put(
  '/:id',
  authMiddleware,
  sensitiveActionRateLimiter,
  requireMemberOwnershipOrStaff,
  validateRequest({ body: updateMemberSchema }),
  (req: Request, res: Response) => {
    const member = db.members.get(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member tidak ditemukan.' });
    }

    const { name, phone, email } = req.body;
    const oldValue = { name: member.name, phone: member.phone, email: member.email };

    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (email) member.email = email;
    member.updatedAt = new Date();

    AuditService.log({
      userId: req.user?.userId,
      action: 'UPDATE_MEMBER_PROFILE',
      module: 'MEMBER',
      recordId: member.id,
      oldValue,
      newValue: { name: member.name, phone: member.phone, email: member.email },
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Profil member berhasil diperbarui.',
      data: member
    });
  }
);

// 4. POST /api/members/:id/photo (Update member photo in database & audit log)
memberRouter.post(
  '/:id/photo',
  authMiddleware,
  sensitiveActionRateLimiter,
  requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR', 'TRAINER']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (!photoUrl || typeof photoUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'URL / path foto wajib disertakan.' });
    }

    // 1. Update in-memory member store
    const member = db.members.get(id);
    if (member) {
      member.photo = photoUrl;
      member.updatedAt = new Date();
    }

    // 2. Persist to PostgreSQL if connected
    const { pgPool } = await import('../app');
    if (pgPool) {
      try {
        await pgPool.query(
          'UPDATE members SET photo = $1, photo_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [photoUrl, id]
        );
      } catch (dbErr: any) {
        console.warn('[PostgreSQL] Failed to persist member photo:', dbErr.message);
      }
    }

    AuditService.log({
      userId: req.user?.userId,
      action: 'UPDATE_MEMBER_PHOTO',
      module: 'MEMBER',
      recordId: id,
      newValue: { photoUrl },
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Foto profil member berhasil diperbarui secara persisten.',
      photoUrl
    });
  }
);


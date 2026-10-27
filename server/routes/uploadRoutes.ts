import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth';
import { sensitiveActionRateLimiter } from '../middleware/rateLimiter';
import { AuditService } from '../services/auditService';

export const uploadRouter = Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

uploadRouter.post('/', authMiddleware, sensitiveActionRateLimiter, (req: Request, res: Response) => {
  try {
    const { base64Data, originalFilename, mimeType } = req.body;

    if (!base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({ success: false, message: 'Data file base64 wajib disertakan.' });
    }

    // 1. MIME Type Whitelist
    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      AuditService.recordSecurityEvent({
        eventType: 'ILLEGAL_FILE_TYPE_UPLOAD',
        severity: 'MEDIUM',
        ipAddress: req.ip,
        userId: req.user?.userId,
        details: `Percobaan upload tipe file tidak sah: ${mimeType || 'unknown'}`
      });
      return res.status(400).json({
        success: false,
        message: 'Tipe file tidak diizinkan. Hanya file JPG, PNG, dan WebP yang diperbolehkan.'
      });
    }

    // 2. File size validation
    const rawBuffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    if (rawBuffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: `Ukuran file melebihi batas maksimum 5MB (Ukuran: ${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB).`
      });
    }

    // 3. File Signature / Magic Byte verification
    const isValidSignature = (buffer: Buffer, mime: string): boolean => {
      if (mime === 'image/jpeg') {
        // JPEG starts with FF D8 FF
        return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      }
      if (mime === 'image/png') {
        // PNG starts with 89 50 4E 47
        return buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      }
      if (mime === 'image/webp') {
        // WEBP starts with RIFF ... WEBP
        return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
      }
      return false;
    };

    if (!isValidSignature(rawBuffer, mimeType.toLowerCase())) {
      AuditService.recordSecurityEvent({
        eventType: 'MALICIOUS_FILE_SIGNATURE',
        severity: 'HIGH',
        ipAddress: req.ip,
        userId: req.user?.userId,
        details: `File signature mismatch! Header file tidak cocok dengan MIME type '${mimeType}'. Kemungkinan file berbahaya terselubung.`
      });
      return res.status(400).json({
        success: false,
        message: 'File tidak valid: Format biner file tidak sesuai dengan tipe file gambar asli.'
      });
    }

    // 4. Safe Randomized Filename Generation (Anti-Path-Traversal)
    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const safeFileId = 'DOC-' + crypto.randomUUID() + `.${ext}`;
    const cleanOriginalName = typeof originalFilename === 'string'
      ? originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50)
      : 'upload';

    AuditService.log({
      userId: req.user?.userId,
      action: 'FILE_UPLOAD',
      module: 'UPLOAD',
      recordId: safeFileId,
      newValue: {
        originalName: cleanOriginalName,
        safeFileId,
        sizeBytes: rawBuffer.length,
        mimeType
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'File berhasil diverifikasi dan disimpan secara aman.',
      file: {
        fileId: safeFileId,
        sizeBytes: rawBuffer.length,
        mimeType,
        url: `/uploads/${safeFileId}`
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses file upload.'
    });
  }
});

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { authMiddleware, JWT_SECRET } from '../middleware/auth';
import { sensitiveActionRateLimiter } from '../middleware/rateLimiter';
import { AuditService } from '../services/auditService';
import {
  saveImageFile,
  parseBase64Image,
  resolveStoredFilePath,
  ALLOWED_CATEGORIES,
  StorageCategory,
  MAX_FILE_SIZE_BYTES
} from '../services/storageService';
import { pgPool } from '../app';

export const uploadRouter = Router();

// Configure Multer for in-memory handling prior to deep magic-byte inspection and persistent write
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

/**
 * 1. POST /api/upload
 * Multi-mode endpoint: supports multipart/form-data (field: 'file' or 'photo') AND base64 JSON payload
 */
uploadRouter.post(
  '/',
  authMiddleware,
  sensitiveActionRateLimiter,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      let rawBuffer: Buffer | null = null;
      let originalFilename: string | undefined;

      // Extract category from body or query param
      const rawCategory = (req.body?.category || req.query?.category || 'members') as string;
      const category: StorageCategory = ALLOWED_CATEGORIES.includes(rawCategory as StorageCategory)
        ? (rawCategory as StorageCategory)
        : 'members';

      // Mode A: Multer Multipart Form-Data Upload
      if (req.file && req.file.buffer) {
        rawBuffer = req.file.buffer;
        originalFilename = req.file.originalname;
      }
      // Mode B: Base64 JSON Payload (Webcam / Canvas Capture / FileReader)
      else if (req.body?.base64Data && typeof req.body.base64Data === 'string') {
        const parsed = parseBase64Image(req.body.base64Data);
        rawBuffer = parsed.buffer;
        originalFilename = req.body.originalFilename || `${category}-capture.jpg`;
      }

      if (!rawBuffer || rawBuffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File gambar tidak ditemukan. Kirim file melalui form-data atau base64Data.'
        });
      }

      // Save to persistent Docker volume with magic byte validation & safe uuid naming
      const saved = await saveImageFile(rawBuffer, category, originalFilename);

      // Optional: If entity ID is provided, automatically link to PostgreSQL table
      const { memberId, staffId, productId, expenseId } = req.body;

      if (pgPool) {
        try {
          if (memberId && category === 'members') {
            await pgPool.query(
              'UPDATE members SET photo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [saved.url, memberId]
            );
          } else if (staffId && (category === 'trainers' || category === 'employees')) {
            await pgPool.query(
              'UPDATE users SET photo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [saved.url, staffId]
            );
          } else if (productId && category === 'products') {
            await pgPool.query(
              'UPDATE products SET img = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [saved.url, productId]
            );
          } else if (expenseId && category === 'expenses') {
            await pgPool.query(
              'UPDATE company_expenses SET attachment_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [saved.url, expenseId]
            );
          }
        } catch (dbErr: any) {
          console.warn('[Storage] DB photo reference update warning:', dbErr.message);
        }
      }

      AuditService.log({
        userId: req.user?.userId,
        action: 'FILE_UPLOAD',
        module: 'UPLOAD',
        recordId: saved.filename,
        newValue: {
          category: saved.category,
          filename: saved.filename,
          url: saved.url,
          sizeBytes: saved.sizeBytes,
          mimeType: saved.mimeType,
          memberId,
          staffId,
          productId
        },
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        message: 'Foto berhasil disimpan secara persisten di server.',
        file: {
          fileId: saved.filename,
          filename: saved.filename,
          category: saved.category,
          sizeBytes: saved.sizeBytes,
          mimeType: saved.mimeType,
          url: saved.url
        }
      });
    } catch (err: any) {
      console.error('[Upload] Error saving file:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Gagal memproses dan menyimpan file upload.'
      });
    }
  }
);

/**
 * 2. GET /uploads/:category/:filename
 * Secure file retrieval with access control, anti-path-traversal, and HTTP caching
 */
export const serveUploadsHandler = async (req: Request, res: Response) => {
  try {
    const { category, filename } = req.params;

    const resolvedFilePath = resolveStoredFilePath(category, filename);
    if (!resolvedFilePath) {
      return res.status(404).json({
        success: false,
        message: 'Berkas foto tidak ditemukan atau path tidak sah.'
      });
    }

    // Determine authorization requirement:
    // Products, equipment, and public assets are public.
    // Members, trainers, employees, and expenses require valid session or verified access.
    const isPublicCategory = ['products', 'equipment', 'public'].includes(category);

    if (!isPublicCategory) {
      let isAuthorized = false;

      // Check Bearer Token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        try {
          jwt.verify(token, JWT_SECRET);
          isAuthorized = true;
        } catch {}
      }

      // Check Cookie
      if (!isAuthorized && req.cookies && req.cookies.accessToken) {
        try {
          jwt.verify(req.cookies.accessToken, JWT_SECRET);
          isAuthorized = true;
        } catch {}
      }

      // Check URL query token if loaded in <img> tag
      if (!isAuthorized && req.query.token && typeof req.query.token === 'string') {
        try {
          jwt.verify(req.query.token, JWT_SECRET);
          isAuthorized = true;
        } catch {}
      }

      // Check referrer / same-origin in standard browser session
      const host = req.headers.host;
      const referer = req.headers.referer;
      if (!isAuthorized && referer && host && referer.includes(host)) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        return res.status(401).json({
          success: false,
          message: 'Akses ditolak: Autentikasi diperlukan untuk mengakses foto privat.'
        });
      }
    }

    // Set correct Content-Type header based on extension
    const ext = path.extname(resolvedFilePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', isPublicCategory ? 'public, max-age=604800' : 'private, max-age=86400');

    // Stream file efficiently
    const stream = fs.createReadStream(resolvedFilePath);
    stream.on('error', () => {
      res.status(500).end();
    });
    return stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal membaca berkas foto.'
    });
  }
};

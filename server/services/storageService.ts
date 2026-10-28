import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const ALLOWED_CATEGORIES = [
  'members',
  'trainers',
  'employees',
  'products',
  'equipment',
  'member-cards',
  'expenses'
] as const;

export type StorageCategory = (typeof ALLOWED_CATEGORIES)[number];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Resolve persistent upload root directory (defaults to /app/uploads in Docker or ./uploads in local)
export const UPLOAD_ROOT_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), 'uploads');

/**
 * Initializes persistent folder structure on server boot
 */
export function initStorageDirectories(): void {
  try {
    if (!fs.existsSync(UPLOAD_ROOT_DIR)) {
      fs.mkdirSync(UPLOAD_ROOT_DIR, { recursive: true, mode: 0o755 });
    }

    for (const cat of ALLOWED_CATEGORIES) {
      const catPath = path.join(UPLOAD_ROOT_DIR, cat);
      if (!fs.existsSync(catPath)) {
        fs.mkdirSync(catPath, { recursive: true, mode: 0o755 });
      }
    }
    console.log(`[Storage] Persistent upload directory ready at: ${UPLOAD_ROOT_DIR}`);
  } catch (err: any) {
    console.error(`[Storage] Failed to initialize upload directories at ${UPLOAD_ROOT_DIR}:`, err.message);
  }
}

/**
 * Deep Binary Magic Bytes Inspection to verify real image contents
 */
export function verifyImageMagicBytes(buffer: Buffer): { isValid: boolean; mimeType: string | null } {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, mimeType: null };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mimeType: 'image/png' };
  }

  // 3. WebP: RIFF ... WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { isValid: true, mimeType: 'image/webp' };
  }

  return { isValid: false, mimeType: null };
}

/**
 * Maps MIME type to safe file extension
 */
export function getExtensionFromMime(mime: string): string {
  switch (mime.toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

export interface SaveFileResult {
  filename: string;
  category: StorageCategory;
  filePath: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Writes an image buffer securely to the persistent named volume
 */
export async function saveImageFile(
  buffer: Buffer,
  category: StorageCategory,
  _originalFilename?: string
): Promise<SaveFileResult> {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error(`Kategori penyimpanan tidak valid: ${category}`);
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Ukuran file melebihi batas 5MB (${(buffer.length / 1024 / 1024).toFixed(2)}MB).`);
  }

  // Deep inspection
  const { isValid, mimeType } = verifyImageMagicBytes(buffer);
  if (!isValid || !mimeType) {
    throw new Error('Format file tidak valid. Hanya gambar asli (JPG, PNG, WebP) yang diizinkan.');
  }

  const ext = getExtensionFromMime(mimeType);
  const randomId = crypto.randomUUID();
  const safeFilename = `${category}-${randomId}.${ext}`;

  const targetCategoryDir = path.join(UPLOAD_ROOT_DIR, category);
  if (!fs.existsSync(targetCategoryDir)) {
    fs.mkdirSync(targetCategoryDir, { recursive: true, mode: 0o755 });
  }

  const targetFilePath = path.join(targetCategoryDir, safeFilename);

  // Path Traversal Security check
  const resolvedPath = path.resolve(targetFilePath);
  if (!resolvedPath.startsWith(path.resolve(UPLOAD_ROOT_DIR))) {
    throw new Error('Terdeteksi percobaan Path Traversal.');
  }

  // Write file securely
  await fs.promises.writeFile(resolvedPath, buffer, { mode: 0o644 });

  return {
    filename: safeFilename,
    category,
    filePath: resolvedPath,
    url: `/uploads/${category}/${safeFilename}`,
    sizeBytes: buffer.length,
    mimeType
  };
}

/**
 * Parses Base64 dataURL into raw binary Buffer
 */
export function parseBase64Image(dataUrlOrBase64: string): { buffer: Buffer; mimeType: string } {
  const matches = dataUrlOrBase64.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
  if (matches) {
    return {
      mimeType: matches[1].toLowerCase(),
      buffer: Buffer.from(matches[2], 'base64')
    };
  }
  // Raw base64 string
  return {
    mimeType: 'image/jpeg',
    buffer: Buffer.from(dataUrlOrBase64.trim(), 'base64')
  };
}

/**
 * Safely resolves and reads a stored file, preventing directory traversal
 */
export function resolveStoredFilePath(category: string, filename: string): string | null {
  if (!ALLOWED_CATEGORIES.includes(category as StorageCategory)) {
    return null;
  }

  // Reject any filename containing path separators or traversal patterns
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return null;
  }

  const candidatePath = path.join(UPLOAD_ROOT_DIR, category, filename);
  const resolvedPath = path.resolve(candidatePath);

  const allowedDir = path.resolve(path.join(UPLOAD_ROOT_DIR, category));
  if (!resolvedPath.startsWith(allowedDir)) {
    return null;
  }

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  return resolvedPath;
}

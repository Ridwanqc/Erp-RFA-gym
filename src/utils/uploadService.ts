/**
 * Persistent Upload Client Service for RFA GYM ERP
 * Uploads photos to the backend Node.js server mounted on Docker Named Volume (/app/uploads)
 * and updates references in PostgreSQL (database-rfa).
 */

export type UploadCategory =
  | 'members'
  | 'trainers'
  | 'employees'
  | 'products'
  | 'equipment'
  | 'member-cards'
  | 'expenses';

export interface UploadOptions {
  category?: UploadCategory;
  memberId?: string;
  staffId?: string;
  productId?: string;
  expenseId?: string;
  originalFilename?: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  filename?: string;
  sizeBytes?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Gets authentication token from cookie or local storage if available
 */
function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem('rfa_access_token') ||
      localStorage.getItem('gympro_token') ||
      sessionStorage.getItem('rfa_access_token') ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Uploads an image (File, Blob, or Base64 Data URL) to the persistent storage endpoint
 */
export async function uploadPhotoToServer(
  source: File | Blob | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const category = options.category || 'members';
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response: Response;

    // 1. If File or Blob: Use multipart/form-data
    if (source instanceof Blob || source instanceof File) {
      const formData = new FormData();
      const filename =
        options.originalFilename ||
        (source instanceof File ? source.name : `${category}-upload.jpg`);

      formData.append('file', source, filename);
      formData.append('category', category);
      if (options.memberId) formData.append('memberId', options.memberId);
      if (options.staffId) formData.append('staffId', options.staffId);
      if (options.productId) formData.append('productId', options.productId);
      if (options.expenseId) formData.append('expenseId', options.expenseId);

      response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      });
    }
    // 2. If Base64 string: Use JSON payload
    else if (typeof source === 'string') {
      // If it's already a server upload path, return directly
      if (source.startsWith('/uploads/') || source.startsWith('http')) {
        return { success: true, url: source };
      }

      const payload = {
        base64Data: source,
        category,
        memberId: options.memberId,
        staffId: options.staffId,
        productId: options.productId,
        expenseId: options.expenseId,
        originalFilename: options.originalFilename || `${category}-capture.jpg`
      };

      headers['Content-Type'] = 'application/json';
      response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } else {
      throw new Error('Format sumber foto tidak valid.');
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `Upload server gagal (${response.status})`);
    }

    const data = await response.json();
    if (!data.success || !data.file?.url) {
      throw new Error(data.message || 'Respons server tidak valid.');
    }

    return {
      success: true,
      url: data.file.url,
      filename: data.file.filename,
      sizeBytes: data.file.sizeBytes,
      mimeType: data.file.mimeType
    };
  } catch (err: any) {
    console.warn('[UploadService] Server upload fallback notice:', err.message);

    // Fallback: If network or server upload fails in offline mode, return source as data URL
    // so user flow is not abruptly broken
    const fallbackUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
    return {
      success: false,
      url: fallbackUrl,
      error: err.message
    };
  }
}

/**
 * Uploads member profile photo to persistent volume and updates PostgreSQL
 */
export async function uploadMemberPhoto(
  memberId: string,
  photoSource: File | Blob | string
): Promise<string> {
  const result = await uploadPhotoToServer(photoSource, {
    category: 'members',
    memberId
  });

  // Call PostgreSQL member photo update endpoint
  if (result.success && result.url.startsWith('/uploads/')) {
    try {
      const token = getAuthToken();
      await fetch(`/api/members/${encodeURIComponent(memberId)}/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ photoUrl: result.url })
      });
    } catch (e: any) {
      console.warn('[UploadService] Member photo DB sync notice:', e.message);
    }
  }

  return result.url;
}

/**
 * Uploads product image to persistent volume
 */
export async function uploadProductImage(
  productId: string,
  imageSource: File | Blob | string
): Promise<string> {
  const result = await uploadPhotoToServer(imageSource, {
    category: 'products',
    productId
  });
  return result.url;
}

/**
 * Utility to process, resize and compress product photos for POS & Inventory.
 * Converts high-resolution camera / gallery images to optimized JPEG base64 (~25-50KB)
 * to ensure blazing-fast UI rendering and safe localStorage persistence without quota errors.
 */

export const PRESET_PRODUCT_IMAGES = [
  {
    label: 'Air Mineral 600ml',
    category: 'Mineral',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'Minuman Isotonik / Elektrolit',
    category: 'Mineral',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'Whey Protein Powder Sachet',
    category: 'Supplement',
    url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'BCAA & Pre-Workout Energy Drink',
    category: 'Supplement',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'Protein Bar Cokelat Almond',
    category: 'Snack',
    url: 'https://images.unsplash.com/photo-1622484212850-cab596d66e74?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'Oatmeal & Granola Energy Cookie',
    category: 'Snack',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'Shaker Bottle GymPro 700ml',
    category: 'Merchandise',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'Gym Lifting Gloves / Hand Grip',
    category: 'Apparel',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'Handuk Gym Cepat Kering',
    category: 'Merchandise',
    url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=400&auto=format&fit=crop'
  },
  {
    label: 'Creatine Monohydrate Unflavored',
    category: 'Supplement',
    url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=400&auto=format&fit=crop'
  }
];

/**
 * Resizes an uploaded image file into an optimized JPEG Data URL.
 * Automatically handles dimensions (max 500px) and quality compression (~80%).
 */
export function resizeImageFile(file: File, maxDimension = 500, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Format file bukan gambar yang didukung (gunakan JPG, PNG, atau WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('File kosong'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk kompresi.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result); // Fallback to raw base64 if canvas context is unavailable
          return;
        }

        // Fill background with white for transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

// Utility to format Indonesian mobile numbers for wa.me links
export function formatIndonesianWhatsAppNumber(phone: string): string {
  if (!phone) return '628123456789';
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}

/**
 * Mengambil tanggal nyata hari ini dalam format YYYY-MM-DD sesuai tanggal lokal perangkat.
 * Dijamin selalu akurat mengikuti tanggal real time sistem.
 */
export function getRealTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const APP_TODAY = getRealTodayIso();

/**
 * Mendeteksi label zona waktu lokal (WIB / WITA / WIT / GMT+X)
 */
export function getSystemTimezoneLabel(): string {
  try {
    const offsetMinutes = -new Date().getTimezoneOffset();
    if (offsetMinutes === 420) return 'WIB';
    if (offsetMinutes === 480) return 'WITA';
    if (offsetMinutes === 540) return 'WIT';
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    return `GMT${sign}${hours}`;
  } catch {
    return 'WIB';
  }
}

export function formatRp(n: number | string | undefined | null): string {
  const val = typeof n === 'string' ? parseFloat(n) : (n || 0);
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

/**
 * Mengambil timestamp waktu nyata (HH:mm[:ss] ZONA)
 */
export function getTimestamp(withSeconds = false): string {
  const now = new Date();
  const tz = getSystemTimezoneLabel();
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false
  });
  return `${timeStr} ${tz}`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
    const d = new Date(cleanStr + 'T00:00:00');
    if (isNaN(d.getTime())) {
      const fallback = new Date(dateStr);
      if (isNaN(fallback.getTime())) return dateStr;
      return fallback.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatFullDateIndo(date: Date = new Date()): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getDayDiff(targetDateStr: string, baseDateStr: string = APP_TODAY): number {
  if (!targetDateStr) return 999;
  const cleanTarget = targetDateStr.includes('T') ? targetDateStr.split('T')[0] : targetDateStr.trim();
  const cleanBase = baseDateStr.includes('T') ? baseDateStr.split('T')[0] : baseDateStr.trim();
  const t = new Date(cleanTarget + 'T00:00:00').getTime();
  const b = new Date(cleanBase + 'T00:00:00').getTime();
  if (isNaN(t) || isNaN(b)) return 0;
  return Math.ceil((t - b) / (1000 * 60 * 60 * 24));
}

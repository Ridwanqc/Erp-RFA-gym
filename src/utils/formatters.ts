export const APP_TODAY = '2026-09-18';

export function formatRp(n: number | string | undefined | null): string {
  const val = typeof n === 'string' ? parseFloat(n) : (n || 0);
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

export function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function getDayDiff(targetDateStr: string, baseDateStr: string = APP_TODAY): number {
  if (!targetDateStr) return 999;
  const t = new Date(targetDateStr + 'T00:00:00').getTime();
  const b = new Date(baseDateStr + 'T00:00:00').getTime();
  return Math.ceil((t - b) / (1000 * 60 * 60 * 24));
}

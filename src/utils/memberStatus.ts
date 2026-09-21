import { Member, MembershipStatus } from '../types';
import { APP_TODAY, getDayDiff } from './formatters';

/**
 * Menambahkan sejumlah hari ke format tanggal YYYY-MM-DD
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return APP_TODAY;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

/**
 * Menghitung selisih hari antara dua tanggal (inklusif secara default: tgl 10 s/d 20 = 11 hari)
 */
export function getDaysBetween(startStr: string, endStr: string, inclusive: boolean = true): number {
  if (!startStr || !endStr) return 0;
  try {
    const s = new Date(startStr + 'T00:00:00').getTime();
    const e = new Date(endStr + 'T00:00:00').getTime();
    const diffTime = e - s;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return inclusive ? Math.max(diffDays + 1, 1) : Math.max(diffDays, 0);
  } catch {
    return 0;
  }
}

/**
 * Evaluasi status komprehensif dari seorang member:
 * 🟢 AKTIF
 * 🟠 MASA TENGGANG (H-7 s/d Hari H)
 * 🔴 EXPIRED (Sudah lewat masa aktif)
 * 🔵 FREEZE (Sedang dibekukan sementara)
 * ⚪ VISIT (Member tamu harian/non-membership bulanan)
 */
export function getMemberStatus(member: Member): {
  status: MembershipStatus;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  dotColor: string;
  iconColor: string;
  diffDays: number;
} {
  // 1. Visit / Day Pass
  if (member.membershipType === 'VISIT') {
    return {
      status: 'VISIT',
      badgeLabel: 'VISIT',
      badgeColor: 'text-zinc-300',
      badgeBg: 'bg-zinc-800/80',
      badgeBorder: 'border-zinc-700',
      dotColor: 'bg-zinc-400',
      iconColor: 'text-zinc-400',
      diffDays: 0
    };
  }

  // 2. Freeze Status (Member dibekukan)
  if (member.isFrozen || member.status === 'FREEZE') {
    return {
      status: 'FREEZE',
      badgeLabel: 'FREEZE',
      badgeColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/20',
      badgeBorder: 'border-sky-500/30',
      dotColor: 'bg-sky-400',
      iconColor: 'text-sky-400',
      diffDays: getDayDiff(member.expired, APP_TODAY)
    };
  }

  // 3. Status berdasarkan tanggal expired
  const diff = getDayDiff(member.expired, APP_TODAY);

  if (diff < 0) {
    return {
      status: 'EXPIRED',
      badgeLabel: 'EXPIRED',
      badgeColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/20',
      badgeBorder: 'border-rose-500/30',
      dotColor: 'bg-rose-400',
      iconColor: 'text-rose-400',
      diffDays: diff
    };
  }

  if (diff <= 7) {
    return {
      status: 'MASA TENGGANG',
      badgeLabel: 'MASA TENGGANG',
      badgeColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20',
      badgeBorder: 'border-amber-500/30',
      dotColor: 'bg-amber-400',
      iconColor: 'text-amber-400',
      diffDays: diff
    };
  }

  return {
    status: 'AKTIF',
    badgeLabel: 'AKTIF',
    badgeColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    iconColor: 'text-emerald-400',
    diffDays: diff
  };
}

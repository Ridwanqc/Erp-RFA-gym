import { LockerSlot } from '../types';

export const INITIAL_LOCKERS: LockerSlot[] = [
  // LOKER PRIA (#01 - #15)
  { number: 1, label: 'P-01', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 2, label: 'P-02', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  {
    number: 3,
    label: 'P-03',
    gender: 'Pria',
    isOccupied: true,
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    timeIn: '07:15 WIB',
    hasTowel: true,
    status: 'Terpakai'
  },
  { number: 4, label: 'P-04', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 5, label: 'P-05', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 6, label: 'P-06', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  {
    number: 7,
    label: 'P-07',
    gender: 'Pria',
    isOccupied: true,
    memberId: 'M003',
    memberName: 'Doni Firmansyah',
    timeIn: '08:30 WIB',
    hasTowel: true,
    status: 'Terpakai'
  },
  { number: 8, label: 'P-08', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 9, label: 'P-09', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 10, label: 'P-10', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 11, label: 'P-11', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 12, label: 'P-12', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 13, label: 'P-13', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 14, label: 'P-14', gender: 'Pria', isOccupied: false, status: 'Tersedia' },
  { number: 15, label: 'P-15', gender: 'Pria', isOccupied: false, status: 'Tersedia' },

  // LOKER WANITA (#16 - #30)
  {
    number: 16,
    label: 'W-16',
    gender: 'Wanita',
    isOccupied: true,
    memberId: 'M004',
    memberName: 'Maya Indah',
    timeIn: '08:45 WIB',
    hasTowel: true,
    status: 'Terpakai'
  },
  { number: 17, label: 'W-17', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 18, label: 'W-18', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 19, label: 'W-19', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 20, label: 'W-20', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 21, label: 'W-21', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 22, label: 'W-22', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 23, label: 'W-23', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 24, label: 'W-24', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 25, label: 'W-25', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 26, label: 'W-26', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 27, label: 'W-27', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 28, label: 'W-28', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 29, label: 'W-29', gender: 'Wanita', isOccupied: false, status: 'Tersedia' },
  { number: 30, label: 'W-30', gender: 'Wanita', isOccupied: false, status: 'Tersedia' }
];

// Helper: Cari rekomendasi loker terbaik yang kosong berdasarkan gender member
export function getRecommendedLocker(lockers: LockerSlot[], gender?: 'L' | 'P' | string): LockerSlot | null {
  const targetGender = gender === 'P' || gender === 'Wanita' ? 'Wanita' : 'Pria';
  const available = lockers.find((l) => !l.isOccupied && l.status !== 'Perbaikan' && l.gender === targetGender);
  return available || lockers.find((l) => !l.isOccupied && l.status !== 'Perbaikan') || null;
}

// Helper: Statistik Papan Loker
export function getLockerStats(lockers: LockerSlot[]) {
  const total = lockers.length;
  const occupied = lockers.filter((l) => l.isOccupied).length;
  const available = lockers.filter((l) => !l.isOccupied && l.status !== 'Perbaikan').length;
  const maintenance = lockers.filter((l) => l.status === 'Perbaikan').length;
  const vip = lockers.filter((l) => l.status === 'VIP').length;

  const priaTotal = lockers.filter((l) => l.gender === 'Pria').length;
  const priaOccupied = lockers.filter((l) => l.gender === 'Pria' && l.isOccupied).length;
  const priaAvailable = lockers.filter((l) => l.gender === 'Pria' && !l.isOccupied && l.status !== 'Perbaikan').length;

  const wanitaTotal = lockers.filter((l) => l.gender === 'Wanita').length;
  const wanitaOccupied = lockers.filter((l) => l.gender === 'Wanita' && l.isOccupied).length;
  const wanitaAvailable = lockers.filter((l) => l.gender === 'Wanita' && !l.isOccupied && l.status !== 'Perbaikan').length;

  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return {
    total,
    occupied,
    available,
    maintenance,
    vip,
    occupancyRate,
    priaTotal,
    priaOccupied,
    priaAvailable,
    wanitaTotal,
    wanitaOccupied,
    wanitaAvailable
  };
}

// Helper: Cari nomor loker berikutnya yang belum terpakai
export function getNextAvailableLockerNumber(lockers: LockerSlot[]): number {
  if (lockers.length === 0) return 1;
  const existingNumbers = new Set(lockers.map((l) => l.number));
  let candidate = 1;
  while (existingNumbers.has(candidate)) {
    candidate++;
  }
  return candidate;
}

// Helper: Validasi nomor loker unik
export function validateLockerNumber(
  lockers: LockerSlot[],
  candidateNumber: number,
  currentNumber?: number
): { isValid: boolean; message?: string } {
  if (isNaN(candidateNumber) || candidateNumber <= 0) {
    return { isValid: false, message: 'Nomor loker harus berupa angka positif lebih dari 0.' };
  }
  if (candidateNumber === currentNumber) {
    return { isValid: true };
  }
  const exists = lockers.some((l) => l.number === candidateNumber);
  if (exists) {
    return { isValid: false, message: `Loker dengan nomor #${candidateNumber} sudah terdaftar di sistem.` };
  }
  return { isValid: true };
}

// Helper: Batch generate loker baru
export function generateBatchLockers(params: {
  startNumber: number;
  count: number;
  gender: 'Pria' | 'Wanita' | 'Semua';
  prefix?: string;
  padZero?: boolean;
  location?: string;
  status?: 'Tersedia' | 'VIP';
  overwriteExisting?: boolean;
  currentLockers: LockerSlot[];
}): { newLockers: LockerSlot[]; skippedCount: number } {
  const {
    startNumber,
    count,
    gender,
    prefix = gender === 'Wanita' ? 'W-' : 'P-',
    padZero = true,
    location,
    status = 'Tersedia',
    overwriteExisting = false,
    currentLockers
  } = params;

  const existingMap = new Map<number, LockerSlot>();
  currentLockers.forEach((l) => existingMap.set(l.number, l));

  const generated: LockerSlot[] = [];
  let skipped = 0;

  for (let i = 0; i < count; i++) {
    const num = startNumber + i;
    const numStr = padZero && num < 100 ? String(num).padStart(2, '0') : String(num);
    const label = `${prefix}${numStr}`;

    if (existingMap.has(num) && !overwriteExisting) {
      skipped++;
      continue;
    }

    generated.push({
      number: num,
      label,
      gender,
      isOccupied: false,
      status: status,
      location: location || (gender === 'Pria' ? 'Ruang Loker Pria' : gender === 'Wanita' ? 'Ruang Loker Wanita' : 'Area Umum'),
      notes: ''
    });
  }

  return { newLockers: generated, skippedCount: skipped };
}

// Helper: Ambil daftar loker kosong terdekat berdasarkan gender (untuk tombol cepat front desk)
export function getAvailableLockersByGender(
  lockers: LockerSlot[],
  gender?: 'L' | 'P' | 'Pria' | 'Wanita' | string,
  limit = 6
): LockerSlot[] {
  const targetGender = gender === 'P' || gender === 'Wanita' ? 'Wanita' : 'Pria';
  return lockers
    .filter((l) => !l.isOccupied && l.status !== 'Perbaikan' && l.gender === targetGender)
    .slice(0, limit);
}

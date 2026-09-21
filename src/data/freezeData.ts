import { MemberFreezeRecord } from '../types';

export const INITIAL_FREEZE_RECORDS: MemberFreezeRecord[] = [
  {
    id: 'FRZ-202609-001',
    memberId: 'M021',
    memberName: 'Andi Pratama',
    memberPhone: '081288990011',
    memberPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
    startDate: '2026-09-10',
    plannedEndDate: '2026-09-20',
    actualEndDate: '2026-09-20',
    plannedDays: 11,
    actualDays: 11,
    previousStatus: 'AKTIF',
    previousExpiredDate: '2026-09-30',
    newAdjustedExpiredDate: '2026-10-11',
    reason: 'Tugas Ke Luar Kota',
    notes: 'Dinas kantor ke Balikpapan selama 11 hari. Masa aktif otomatis diperpanjang 11 hari.',
    staffId: 'S01',
    staffName: 'Budi Santoso',
    unfreezeStaffId: 'S01',
    unfreezeStaffName: 'Budi Santoso',
    unfreezeNotes: 'Member telah kembali ke Jakarta dan masa aktif disesuaikan ke 11 Okt 2026.',
    status: 'SELESAI',
    adminFee: 0,
    createdAt: '2026-09-10 09:30',
    unfrozenAt: '2026-09-20 08:15'
  },
  {
    id: 'FRZ-202609-002',
    memberId: 'M022',
    memberName: 'Budi Setiawan',
    memberPhone: '081377665544',
    memberPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    startDate: '2026-09-15',
    plannedEndDate: '2026-09-30',
    plannedDays: 16,
    previousStatus: 'AKTIF',
    previousExpiredDate: '2026-10-15',
    newAdjustedExpiredDate: '2026-10-31',
    reason: 'Sakit / Cedera',
    notes: 'Cedera pergelangan tangan kiri butuh istirahat latihan beban 16 hari.',
    staffId: 'S02',
    staffName: 'Siti Kasir',
    status: 'FREEZE',
    adminFee: 0,
    createdAt: '2026-09-15 14:20'
  }
];

export const FREEZE_REASONS = [
  'Sakit / Cedera / Pemulihan Medis',
  'Tugas Ke Luar Kota / Dinas',
  'Hamil / Melahirkan',
  'Liburan Panjang / Studi',
  'Ibadah Umroh / Haji',
  'Lainnya'
] as const;

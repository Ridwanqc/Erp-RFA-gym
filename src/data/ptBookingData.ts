import { PTBooking, PTBookingHistory, TrainerChangeRequest, PTBackofficeNotification, Schedule, PTPurchaseRecord, Member } from '../types';
import { APP_TODAY } from '../utils/formatters';

export const DEFAULT_PT_TIME_SLOTS = [
  { startTime: '06:00', endTime: '07:00', label: '06:00 - 07:00' },
  { startTime: '07:00', endTime: '08:00', label: '07:00 - 08:00' },
  { startTime: '08:00', endTime: '09:00', label: '08:00 - 09:00' },
  { startTime: '09:00', endTime: '10:00', label: '09:00 - 10:00' },
  { startTime: '10:00', endTime: '11:00', label: '10:00 - 11:00' },
  { startTime: '11:00', endTime: '12:00', label: '11:00 - 12:00' },
  { startTime: '14:00', endTime: '15:00', label: '14:00 - 15:00' },
  { startTime: '15:00', endTime: '16:00', label: '15:00 - 16:00' },
  { startTime: '16:00', endTime: '17:00', label: '16:00 - 17:00' },
  { startTime: '17:00', endTime: '18:00', label: '17:00 - 18:00' },
  { startTime: '18:00', endTime: '19:00', label: '18:00 - 19:00' },
  { startTime: '19:00', endTime: '20:00', label: '19:00 - 20:00' },
  { startTime: '20:00', endTime: '21:00', label: '20:00 - 21:00' }
];

export const INITIAL_PT_BOOKINGS: PTBooking[] = [
  {
    id: 'PTB-2026-0001',
    bookingCode: 'BK-PT-1001',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    memberPhone: '081234567890',
    memberPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    ptPackageId: 'PUR-AKBAR-10',
    packageName: 'PT Personal 12 Session Hypertrophy',
    totalSessions: 12,
    sessionNumber: 4,
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    bookingDate: '2026-10-06',
    startTime: '18:00',
    endTime: '19:00',
    status: 'COMPLETED',
    source: 'PORTAL_MEMBER',
    notes: 'Sesi Back & Biceps PR pull-up 12 reps',
    workoutFocus: 'Back & Biceps Hypertrophy',
    scheduleId: 'SCH-01',
    createdAt: '2026-10-04 14:20 WIB',
    updatedAt: '2026-10-06 19:05 WIB',
    createdBy: 'Akbar Hanif (Portal Member)',
    history: [
      {
        id: 'PTH-001',
        bookingId: 'PTB-2026-0001',
        action: 'BOOKING_CREATED',
        newValue: 'Sesi 4 (18:00 - 19:00)',
        changedBy: 'Akbar Hanif',
        changedRole: 'MEMBER',
        source: 'PORTAL_MEMBER',
        createdAt: '2026-10-04 14:20 WIB',
        notes: 'Booking dibuat secara mandiri dari Portal Member'
      },
      {
        id: 'PTH-002',
        bookingId: 'PTB-2026-0001',
        action: 'STATUS_COMPLETED',
        oldValue: 'CONFIRMED',
        newValue: 'COMPLETED',
        changedBy: 'Reza Pratama',
        changedRole: 'TRAINER',
        source: 'BACKOFFICE',
        createdAt: '2026-10-06 19:05 WIB',
        notes: 'Sesi latihan selesai dan tervalidasi'
      }
    ]
  },
  {
    id: 'PTB-2026-0002',
    bookingCode: 'BK-PT-1002',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    memberPhone: '081234567890',
    memberPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    ptPackageId: 'PUR-AKBAR-10',
    packageName: 'PT Personal 12 Session Hypertrophy',
    totalSessions: 12,
    sessionNumber: 5,
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    bookingDate: APP_TODAY,
    startTime: '18:00',
    endTime: '19:00',
    status: 'CONFIRMED',
    source: 'PORTAL_MEMBER',
    notes: 'Chest & Deltoid Strength progression',
    workoutFocus: 'Chest & Deltoid',
    scheduleId: 'SCH-09',
    createdAt: `${APP_TODAY} 08:30 WIB`,
    updatedAt: `${APP_TODAY} 08:30 WIB`,
    createdBy: 'Akbar Hanif (Portal Member)',
    history: [
      {
        id: 'PTH-003',
        bookingId: 'PTB-2026-0002',
        action: 'BOOKING_CREATED',
        newValue: 'Sesi 5 (18:00 - 19:00)',
        changedBy: 'Akbar Hanif',
        changedRole: 'MEMBER',
        source: 'PORTAL_MEMBER',
        createdAt: `${APP_TODAY} 08:30 WIB`,
        notes: 'Booking baru dari Portal Member, slot trainer otomatis terkunci'
      }
    ]
  },
  {
    id: 'PTB-2026-0003',
    bookingCode: 'BK-PT-1003',
    memberId: 'M005',
    memberName: 'Hendro Prasetyo',
    memberPhone: '081734567894',
    ptPackageId: 'PUR-HENDRO-10',
    packageName: 'PT Personal 10 Session',
    totalSessions: 10,
    sessionNumber: 3,
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    bookingDate: APP_TODAY,
    startTime: '16:00',
    endTime: '17:00',
    status: 'CONFIRMED',
    source: 'PORTAL_MEMBER',
    notes: 'Lower body mobility & deadlift technique',
    workoutFocus: 'Legs & Core',
    scheduleId: 'SCH-05',
    createdAt: `${APP_TODAY} 07:15 WIB`,
    updatedAt: `${APP_TODAY} 07:15 WIB`,
    createdBy: 'Hendro Prasetyo (Portal Member)',
    history: [
      {
        id: 'PTH-004',
        bookingId: 'PTB-2026-0003',
        action: 'BOOKING_CREATED',
        newValue: 'Sesi 3 (16:00 - 17:00)',
        changedBy: 'Hendro Prasetyo',
        changedRole: 'MEMBER',
        source: 'PORTAL_MEMBER',
        createdAt: `${APP_TODAY} 07:15 WIB`,
        notes: 'Booking melalui Portal Member'
      }
    ]
  },
  {
    id: 'PTB-2026-0004',
    bookingCode: 'BK-PT-1004',
    memberId: 'M004',
    memberName: 'Maya Indah',
    memberPhone: '081698765432',
    ptPackageId: 'PUR-MAYA-10',
    packageName: 'PT Personal 10 Session',
    totalSessions: 10,
    sessionNumber: 6,
    trainerId: 'S03',
    trainerName: 'Citra Lestari',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    bookingDate: APP_TODAY,
    startTime: '16:00',
    endTime: '17:00',
    status: 'CONFIRMED',
    source: 'BACKOFFICE',
    notes: 'Functional core & posture realignment',
    workoutFocus: 'Posture & Core',
    scheduleId: 'SCH-02',
    createdAt: `${APP_TODAY} 09:00 WIB`,
    updatedAt: `${APP_TODAY} 09:00 WIB`,
    createdBy: 'Citra Lestari (Leader PT)',
    history: [
      {
        id: 'PTH-005',
        bookingId: 'PTB-2026-0004',
        action: 'BOOKING_CREATED',
        newValue: 'Sesi 6 (16:00 - 17:00)',
        changedBy: 'Citra Lestari',
        changedRole: 'LEADER_PT',
        source: 'BACKOFFICE',
        createdAt: `${APP_TODAY} 09:00 WIB`,
        notes: 'Dibuat oleh Leader PT di Backoffice'
      }
    ]
  }
];

export const INITIAL_TRAINER_CHANGE_REQUESTS: TrainerChangeRequest[] = [
  {
    id: 'TCR-2026-001',
    memberId: 'M007',
    memberName: 'Kevin Wijaya',
    memberPhone: '081299887711',
    ptPackageId: 'PUR-KEVIN-10',
    packageName: 'PT Personal 10 Session',
    currentTrainerId: 'S05',
    currentTrainerName: 'David Chen',
    preferredTrainerId: 'S04',
    preferredTrainerName: 'Reza Pratama',
    reason: 'Ingin menyesuaikan jadwal ke sesi sore/malam hari dan program fokus powerlifting.',
    status: 'PENDING',
    requestedAt: `${APP_TODAY} 10:30 WIB`
  }
];

export const INITIAL_PT_NOTIFICATIONS: PTBackofficeNotification[] = [
  {
    id: 'PTN-001',
    bookingId: 'PTB-2026-0002',
    title: 'Booking PT Baru (Portal Member)',
    message: 'Member Akbar Hanif melakukan booking PT sesi 5/12 dengan Coach Reza Pratama pada ' + APP_TODAY + ' pukul 18:00 - 19:00.',
    targetRole: 'ALL',
    trainerId: 'S04',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    bookingDate: APP_TODAY,
    timeSlot: '18:00 - 19:00',
    createdAt: `${APP_TODAY} 08:30 WIB`,
    isRead: false
  },
  {
    id: 'PTN-002',
    bookingId: 'PTB-2026-0003',
    title: 'Booking PT Baru (Portal Member)',
    message: 'Member Hendro Prasetyo melakukan booking PT sesi 3/10 dengan Coach Reza Pratama pada ' + APP_TODAY + ' pukul 16:00 - 17:00.',
    targetRole: 'ALL',
    trainerId: 'S04',
    memberId: 'M005',
    memberName: 'Hendro Prasetyo',
    bookingDate: APP_TODAY,
    timeSlot: '16:00 - 17:00',
    createdAt: `${APP_TODAY} 07:15 WIB`,
    isRead: true
  }
];

/**
 * Cek ketersediaan slot trainer pada tanggal tertentu
 */
export function getTrainerSlotAvailability(
  trainerId: string,
  date: string,
  bookings: PTBooking[],
  schedules: Schedule[],
  currentBookingId?: string
) {
  return DEFAULT_PT_TIME_SLOTS.map((slot) => {
    // 1. Cek apakah ada booking aktif pada jam ini untuk trainer tersebut
    const clashingBooking = bookings.find((b) => {
      if (b.id === currentBookingId) return false;
      if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
      if (b.trainerId !== trainerId) return false;
      if (b.bookingDate !== date) return false;
      return b.startTime === slot.startTime;
    });

    // 2. Cek apakah ada schedule ERP pada jam ini untuk trainer tersebut
    const clashingSchedule = schedules.find((s) => {
      if (s.id === currentBookingId || s.bookingId === currentBookingId) return false;
      if (s.status === 'Batal' || s.status === 'Hangus') return false;
      const isSameTrainer = (s.trainerId && s.trainerId === trainerId) || (!s.trainerId && s.trainer);
      if (!isSameTrainer) return false;
      if (s.date !== date) return false;
      return s.time === slot.startTime;
    });

    const isOccupied = Boolean(clashingBooking || clashingSchedule);
    const occupant = clashingBooking?.memberName || clashingSchedule?.memberName;

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label,
      isAvailable: !isOccupied,
      occupant: isOccupied ? occupant : undefined,
      clashId: clashingBooking?.id || clashingSchedule?.id
    };
  });
}

/**
 * Validasi Double Booking:
 * - Trainer tidak boleh punya 2 member di jam sama
 * - Member tidak boleh punya 2 sesi di jam sama
 */
export function validatePTDoubleBooking(params: {
  memberId: string;
  trainerId: string;
  date: string;
  startTime: string;
  currentBookingId?: string;
  bookings: PTBooking[];
  schedules: Schedule[];
}): { isValid: boolean; error?: string } {
  const { memberId, trainerId, date, startTime, currentBookingId, bookings, schedules } = params;

  // 1. Cek apakah trainer sudah ada janji di jam tersebut
  const trainerClashBooking = bookings.find((b) => {
    if (b.id === currentBookingId) return false;
    if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
    return b.trainerId === trainerId && b.bookingDate === date && b.startTime === startTime;
  });

  const trainerClashSchedule = schedules.find((s) => {
    if (s.id === currentBookingId || s.bookingId === currentBookingId) return false;
    if (s.status === 'Batal' || s.status === 'Hangus') return false;
    const isTrainerMatch = (s.trainerId && s.trainerId === trainerId) || (!s.trainerId && s.trainer);
    return isTrainerMatch && s.date === date && s.time === startTime;
  });

  if (trainerClashBooking || trainerClashSchedule) {
    return {
      isValid: false,
      error: `Slot jam ${startTime} pada tanggal ${date} sudah terisi oleh member lain. Silakan pilih slot jam lain.`
    };
  }

  // 2. Cek apakah member sudah ada sesi lain di jam tersebut
  const memberClashBooking = bookings.find((b) => {
    if (b.id === currentBookingId) return false;
    if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
    return b.memberId === memberId && b.bookingDate === date && b.startTime === startTime;
  });

  const memberClashSchedule = schedules.find((s) => {
    if (s.id === currentBookingId || s.bookingId === currentBookingId) return false;
    if (s.status === 'Batal' || s.status === 'Hangus') return false;
    return s.memberId === memberId && s.date === date && s.time === startTime;
  });

  if (memberClashBooking || memberClashSchedule) {
    return {
      isValid: false,
      error: `Anda sudah memiliki jadwal latihan lain pada ${date} pukul ${startTime}.`
    };
  }

  return { isValid: true };
}

/**
 * Aturan Reschedule:
 * - Reschedule maksimal H-4 jam sebelum sesi
 * - Tidak boleh reschedule jika sesi sudah dimulai atau sudah lewat
 * - Tidak boleh reschedule jika status COMPLETED atau CANCELLED
 */
export function checkRescheduleEligibility(booking: PTBooking): {
  allowed: boolean;
  reason?: string;
  hoursRemaining?: number;
} {
  if (booking.status === 'COMPLETED') {
    return { allowed: false, reason: 'Sesi latihan sudah selesai (COMPLETED) dan tidak dapat di-reschedule.' };
  }
  if (booking.status === 'CANCELLED') {
    return { allowed: false, reason: 'Sesi latihan sudah dibatalkan.' };
  }

  // Parse waktu sesi: bookingDate + startTime
  try {
    const sessionDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
    const now = new Date();
    const diffMs = sessionDateTime.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);

    if (diffMs <= 0) {
      return {
        allowed: false,
        reason: 'Sesi latihan sudah dimulai atau telah lewat waktu jadwal.',
        hoursRemaining: 0
      };
    }

    if (hoursRemaining < 4) {
      return {
        allowed: false,
        reason: `Reschedule minimal H-4 jam sebelum sesi dimulai. Sisa waktu saat ini: ${hoursRemaining.toFixed(1)} jam.`,
        hoursRemaining
      };
    }

    return { allowed: true, hoursRemaining };
  } catch {
    return { allowed: true };
  }
}

/**
 * Menghitung rekap sesi PT untuk akun member yang login
 */
export function calculateMemberPTSummary(
  member: Member,
  ptPurchases: PTPurchaseRecord[],
  bookings: PTBooking[]
) {
  // Cari paket PT aktif yang dimiliki member
  const memberPurchases = ptPurchases.filter(
    (p) =>
      (p.memberId === member.id || p.memberIds?.includes(member.id) || p.memberName.toLowerCase().includes(member.name.toLowerCase())) &&
      p.status !== 'CANCELLED' &&
      p.status !== 'REFUND' &&
      p.status !== 'EXPIRED'
  );

  // Ambil paket yang paling relevan (prioritas paket aktif / in_progress / assigned)
  const activePurchase = memberPurchases.find((p) => p.status === 'IN_PROGRESS' || p.status === 'ASSIGNED' || p.status === 'SCHEDULED' || p.status === 'Active') || memberPurchases[0];

  // Bookings member ini
  const memberBookings = bookings.filter((b) => b.memberId === member.id);
  const completedBookings = memberBookings.filter((b) => b.status === 'COMPLETED');
  const activeScheduledBookings = memberBookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'RESCHEDULED'
  );

  const totalSessions = activePurchase?.totalSessions || Math.max(member.ptQuota || 0, 10);
  const completedSessions = activePurchase ? activePurchase.completedSessions : completedBookings.length;
  const scheduledCount = activeScheduledBookings.length;
  // Sisa sesi tersedia untuk di-booking = Total - Completed - Scheduled
  const remainingAvailable = Math.max(0, totalSessions - completedSessions - scheduledCount);

  // Trainer yang ditugaskan
  const assignedTrainer = activePurchase?.trainerId && activePurchase.trainerId !== '-'
    ? { id: activePurchase.trainerId, name: activePurchase.trainerName }
    : member.picId
    ? { id: member.picId, name: member.picName || 'Coach GymPro' }
    : null;

  return {
    hasActivePackage: Boolean(activePurchase || (member.ptQuota && member.ptQuota > 0)),
    activePurchase,
    packageName: activePurchase?.packageName || 'PT Personal Transformation',
    totalSessions,
    completedSessions,
    scheduledSessions: scheduledCount,
    remainingAvailable,
    assignedTrainer,
    expiryDate: activePurchase?.expiryDate || member.expired || '2026-12-31'
  };
}

/**
 * Pola jadwal sebelumnya untuk fitur "Gunakan Jadwal Sebelumnya" dan "Booking Ulang"
 */
export function getPreviousBookingPatterns(
  memberId: string,
  bookings: PTBooking[],
  schedules: Schedule[]
) {
  const memberBookings = bookings.filter((b) => b.memberId === memberId);
  const memberSchedules = schedules.filter((s) => s.memberId === memberId);

  // Booking terakhir
  const lastBooking = [...memberBookings].sort(
    (a, b) => new Date(`${b.bookingDate}T${b.startTime}`).getTime() - new Date(`${a.bookingDate}T${a.startTime}`).getTime()
  )[0];

  // Ambil pola waktu yang sering digunakan
  const patterns: { dayName: string; time: string; trainer: string; count: number }[] = [];
  const mapKey = new Map<string, { dayName: string; time: string; trainer: string; count: number }>();

  const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  [...memberBookings, ...memberSchedules].forEach((item) => {
    const dStr = 'bookingDate' in item ? item.bookingDate : item.date;
    const tStr = 'startTime' in item ? item.startTime : item.time;
    const trainerName = 'trainerName' in item ? item.trainerName : item.trainer;

    try {
      const d = new Date(dStr + 'T00:00:00');
      const dayName = dayNamesIndo[d.getDay()] || 'Senin';
      const key = `${dayName}_${tStr}_${trainerName}`;
      if (mapKey.has(key)) {
        mapKey.get(key)!.count += 1;
      } else {
        mapKey.set(key, { dayName, time: tStr, trainer: trainerName, count: 1 });
      }
    } catch {}
  });

  const sortedPatterns = Array.from(mapKey.values()).sort((a, b) => b.count - a.count);

  return {
    lastBooking,
    frequentPatterns: sortedPatterns.slice(0, 4)
  };
}

import {
  PTBooking,
  PTBookingHistory,
  TrainerChangeRequest,
  PTBackofficeNotification,
  Schedule,
  PTPurchaseRecord,
  Member,
  WorkSchedule,
  StaffAttendance,
  LeaveRequest,
  TrainerWorkingRule,
  TrainerDutyStatus,
  User,
  StudioClass
} from '../types';
export type { TrainerWorkingRule };
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
 * Aturan Default Jam & Jadwal Kerja Trainer (Roster Melatih Resmi)
 */
export const DEFAULT_TRAINER_WORKING_RULES: TrainerWorkingRule[] = [
  {
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    isTeachingActive: true,
    teachingDays: [1, 2, 3, 4, 5, 6], // Senin s/d Sabtu, Minggu Off
    defaultShift: 'Malam',
    startTime: '14:00',
    endTime: '22:00',
    maxSessionsPerDay: 8,
    breakStartTime: '18:00',
    breakEndTime: '18:30',
    notes: 'Pelatih PT Spesialis Hypertrophy & Fat Loss'
  },
  {
    trainerId: 'S05',
    trainerName: 'David Chen',
    isTeachingActive: true,
    teachingDays: [1, 2, 3, 4, 5], // Senin s/d Jumat, Sabtu & Minggu Off
    defaultShift: 'Pagi',
    startTime: '06:00',
    endTime: '14:00',
    maxSessionsPerDay: 8,
    breakStartTime: '11:00',
    breakEndTime: '12:00',
    notes: 'Pelatih PT Senior Spesialis Biomechanics'
  },
  {
    trainerId: 'S06',
    trainerName: 'Sarah Wijaya',
    isTeachingActive: true,
    teachingDays: [2, 3, 4, 5, 6, 0], // Selasa s/d Minggu, Senin Off
    defaultShift: 'Siang',
    startTime: '10:00',
    endTime: '18:00',
    maxSessionsPerDay: 7,
    breakStartTime: '12:30',
    breakEndTime: '13:30',
    notes: 'Pelatih PT Rehab & Posture Correction'
  },
  {
    trainerId: 'S07',
    trainerName: 'Andi Saputra',
    isTeachingActive: true,
    teachingDays: [1, 2, 3, 4, 5, 6], // Senin s/d Sabtu, Minggu Off
    defaultShift: 'Pagi',
    startTime: '06:00',
    endTime: '14:00',
    maxSessionsPerDay: 8,
    breakStartTime: '10:00',
    breakEndTime: '11:00',
    notes: 'Pelatih PT Master Powerlifting'
  },
  {
    trainerId: 'S03',
    trainerName: 'Citra Lestari',
    isTeachingActive: true,
    teachingDays: [1, 2, 3, 4, 5], // Senin s/d Jumat, Sabtu & Minggu Off
    defaultShift: 'Pagi',
    startTime: '06:00',
    endTime: '14:00',
    maxSessionsPerDay: 6,
    breakStartTime: '11:00',
    breakEndTime: '12:00',
    notes: 'Leader PT / Head Coach Functional'
  }
];

/**
 * Cek status kehadiran, shift kerja, dan kelayakan melatih trainer pada tanggal tertentu
 */
export function getTrainerDutyStatusOnDate(params: {
  trainerId: string;
  trainerName?: string;
  date: string; // YYYY-MM-DD
  workSchedules?: WorkSchedule[];
  staffAttendances?: StaffAttendance[];
  leaveRequests?: LeaveRequest[];
  trainerUser?: User;
  rules?: TrainerWorkingRule[];
}): TrainerDutyStatus {
  const {
    trainerId,
    trainerName,
    date,
    workSchedules = [],
    staffAttendances = [],
    leaveRequests = [],
    trainerUser,
    rules = DEFAULT_TRAINER_WORKING_RULES
  } = params;

  // 1. Cek aturan khusus trainer
  const matchedRule = rules.find(
    (r) =>
      r.trainerId === trainerId ||
      (trainerName && r.trainerName.toLowerCase().trim() === trainerName.toLowerCase().trim())
  );

  // A. Cek Status Nonaktif / Tidak Mengajar
  if (matchedRule && matchedRule.isTeachingActive === false) {
    return {
      isAvailableForDate: false,
      isDayOff: false,
      isAbsent: false,
      isLeave: false,
      isNotTeaching: true,
      statusLabel: 'Tidak Mengajar (Nonaktif)',
      reason: 'Trainer sedang dinonaktifkan sementara dari jadwal melatih oleh manajemen.',
      badgeColor: 'rose'
    };
  }

  if (trainerUser && (trainerUser.status === 'Nonaktif' || (trainerUser as any).status === 'Cuti')) {
    return {
      isAvailableForDate: false,
      isDayOff: false,
      isAbsent: false,
      isLeave: true,
      isNotTeaching: true,
      statusLabel: `Trainer ${trainerUser.status}`,
      reason: `Trainer berstatus ${trainerUser.status} pada data kepegawaian.`,
      badgeColor: 'rose'
    };
  }

  // B. Cek Pengajuan Cuti / Izin Resmi (Leave Requests)
  const approvedLeave = leaveRequests.find((l) => {
    const isTrainer =
      l.staffId === trainerId ||
      (trainerName && l.staffName.toLowerCase().trim() === trainerName.toLowerCase().trim());
    if (!isTrainer) return false;
    const isApproved = l.status === 'Approved' || (l.status as any) === 'Disetujui';
    if (!isApproved) return false;
    return date >= l.start && date <= l.end;
  });

  if (approvedLeave) {
    const isOffType =
      approvedLeave.type.toLowerCase().includes('off') || approvedLeave.type.toLowerCase().includes('libur');
    return {
      isAvailableForDate: false,
      isDayOff: isOffType,
      isAbsent: true,
      isLeave: true,
      isNotTeaching: false,
      statusLabel: isOffType ? 'Day Off (Libur Rutin)' : `Sedang Cuti (${approvedLeave.type})`,
      reason: `Trainer tidak dapat mengambil jadwal karena sedang ${approvedLeave.type} (${approvedLeave.reason || 'Izin resmi disetujui'}).`,
      badgeColor: isOffType ? 'rose' : 'amber'
    };
  }

  // C. Cek Presensi Harian (Staff Attendance Log pada tanggal ini)
  const attendanceLog = staffAttendances.find((att) => {
    const isTrainer =
      (att.staffId && att.staffId === trainerId) ||
      (trainerName && att.staffName.toLowerCase().trim() === trainerName.toLowerCase().trim());
    return isTrainer && att.date === date;
  });

  if (attendanceLog) {
    const absentStatuses = ['Izin', 'Sakit', 'Cuti', 'Alpa'];
    if (attendanceLog.status && absentStatuses.includes(attendanceLog.status)) {
      return {
        isAvailableForDate: false,
        isDayOff: false,
        isAbsent: true,
        isLeave: attendanceLog.status === 'Cuti',
        isNotTeaching: false,
        statusLabel: `Tidak Hadir (${attendanceLog.status})`,
        reason: `Trainer berhalangan hadir pada presensi hari ini (Status: ${attendanceLog.status}${
          attendanceLog.notes ? ' - ' + attendanceLog.notes : ''
        }).`,
        badgeColor: 'rose'
      };
    }
  }

  // D. Cek Jadwal Kerja Shift Terjadwal (Work Schedules)
  const workSchedule = workSchedules.find((ws) => {
    const isTrainer =
      ws.staffId === trainerId ||
      (trainerName && ws.staffName.toLowerCase().trim() === trainerName.toLowerCase().trim());
    return isTrainer && ws.date === date;
  });

  if (workSchedule) {
    if (workSchedule.shift === 'Off' || workSchedule.status === 'Off') {
      return {
        isAvailableForDate: false,
        isDayOff: true,
        isAbsent: false,
        isLeave: false,
        isNotTeaching: false,
        shiftName: 'Off',
        statusLabel: 'Sedang Libur (Day Off)',
        reason: 'Trainer memiliki jadwal libur rutin (Day Off) pada tanggal ini.',
        badgeColor: 'rose'
      };
    }

    const startTime =
      workSchedule.startTime && workSchedule.startTime !== '-'
        ? workSchedule.startTime
        : matchedRule?.startTime || '08:00';
    const endTime =
      workSchedule.endTime && workSchedule.endTime !== '-'
        ? workSchedule.endTime
        : matchedRule?.endTime || '17:00';

    return {
      isAvailableForDate: true,
      isDayOff: false,
      isAbsent: false,
      isLeave: false,
      isNotTeaching: false,
      shiftName: workSchedule.shift,
      dutyStartTime: startTime,
      dutyEndTime: endTime,
      statusLabel: `Bertugas (Shift ${workSchedule.shift} ${startTime} - ${endTime})`,
      reason: undefined,
      badgeColor: 'emerald'
    };
  }

  // E. Fallback ke Aturan Hari Mengajar Mingguan (Weekly Roster Rule)
  try {
    const dayOfWeek = new Date(date + 'T00:00:00').getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    const teachingDays = matchedRule ? matchedRule.teachingDays : [1, 2, 3, 4, 5, 6];

    if (!teachingDays.includes(dayOfWeek)) {
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return {
        isAvailableForDate: false,
        isDayOff: true,
        isAbsent: false,
        isLeave: false,
        isNotTeaching: false,
        shiftName: 'Off',
        statusLabel: `Libur Mingguan (${dayNames[dayOfWeek]})`,
        reason: `Hari ${dayNames[dayOfWeek]} adalah jadwal libur rutin mingguan pelatih.`,
        badgeColor: 'rose'
      };
    }
  } catch {}

  const defaultShift = matchedRule?.defaultShift || (trainerUser?.shift as any) || 'Siang';
  const defStartTime =
    matchedRule?.startTime ||
    (defaultShift === 'Pagi' ? '06:00' : defaultShift === 'Malam' ? '14:00' : '10:00');
  const defEndTime =
    matchedRule?.endTime ||
    (defaultShift === 'Pagi' ? '14:00' : defaultShift === 'Malam' ? '22:00' : '18:00');

  return {
    isAvailableForDate: true,
    isDayOff: false,
    isAbsent: false,
    isLeave: false,
    isNotTeaching: false,
    shiftName: defaultShift,
    dutyStartTime: defStartTime,
    dutyEndTime: defEndTime,
    statusLabel: `Bertugas (Shift ${defaultShift} ${defStartTime} - ${defEndTime})`,
    reason: undefined,
    badgeColor: 'emerald'
  };
}

/**
 * Helper untuk memeriksa apakah waktu kelas studio cocok atau overlap dengan waktu slot
 */
export function isTimeMatchingStudioClass(classTime: string, targetTime: string): boolean {
  if (!classTime || !targetTime) return false;
  const cleanClass = classTime.trim();
  const cleanTarget = targetTime.trim();
  if (cleanClass === cleanTarget) return true;
  if (cleanClass.includes('-')) {
    const parts = cleanClass.split('-').map((s) => s.trim());
    const start = parts[0];
    const end = parts[1];
    if (start === cleanTarget) return true;
    if (cleanTarget >= start && cleanTarget < end) return true;
  }
  if (cleanClass.startsWith(cleanTarget)) return true;
  return false;
}

/**
 * Cek ketersediaan slot trainer pada tanggal tertentu
 * Memperhitungkan aturan jadwal kerja shift, libur (day off), presensi tidak hadir, cuti, sesi PT, dan jadwal kelas studio.
 */
export function getTrainerSlotAvailability(
  trainerId: string,
  date: string,
  bookings: PTBooking[],
  schedules: Schedule[],
  currentBookingId?: string,
  options?: {
    trainerName?: string;
    workSchedules?: WorkSchedule[];
    staffAttendances?: StaffAttendance[];
    leaveRequests?: LeaveRequest[];
    trainerUser?: User;
    rules?: TrainerWorkingRule[];
    studioClasses?: StudioClass[];
  }
) {
  const dutyStatus = getTrainerDutyStatusOnDate({
    trainerId,
    trainerName: options?.trainerName,
    date,
    workSchedules: options?.workSchedules,
    staffAttendances: options?.staffAttendances,
    leaveRequests: options?.leaveRequests,
    trainerUser: options?.trainerUser,
    rules: options?.rules
  });

  return DEFAULT_PT_TIME_SLOTS.map((slot) => {
    // 1. Cek apakah trainer libur / tidak hadir / tidak mengajar pada hari tersebut
    if (!dutyStatus.isAvailableForDate) {
      const reason = dutyStatus.isDayOff
        ? 'Trainer Sedang Libur (Day Off)'
        : dutyStatus.isLeave || dutyStatus.isAbsent
        ? dutyStatus.reason || 'Trainer Berhalangan Hadir'
        : dutyStatus.reason || 'Trainer Sedang Tidak Mengajar';

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
        isAvailable: false,
        reasonDisabled: reason,
        occupant: undefined,
        clashId: undefined,
        statusType: dutyStatus.isDayOff
          ? ('DAY_OFF' as const)
          : dutyStatus.isAbsent
          ? ('ABSENT' as const)
          : ('NOT_TEACHING' as const),
        dutyStatus
      };
    }

    // 2. Cek apakah jam slot berada di luar jam kerja mengajar trainer
    if (dutyStatus.dutyStartTime && dutyStatus.dutyEndTime) {
      if (slot.startTime < dutyStatus.dutyStartTime || slot.endTime > dutyStatus.dutyEndTime) {
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          label: slot.label,
          isAvailable: false,
          reasonDisabled: `Di Luar Jam Kerja Trainer (${dutyStatus.dutyStartTime} - ${dutyStatus.dutyEndTime})`,
          occupant: undefined,
          clashId: undefined,
          statusType: 'OUTSIDE_HOURS' as const,
          dutyStatus
        };
      }
    }

    // 3. Cek apakah ada booking aktif pada jam ini untuk trainer tersebut
    const clashingBooking = bookings.find((b) => {
      if (b.id === currentBookingId) return false;
      if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
      if (b.trainerId !== trainerId) return false;
      if (b.bookingDate !== date) return false;
      return b.startTime === slot.startTime;
    });

    // 4. Cek apakah ada schedule ERP pada jam ini untuk trainer tersebut
    const clashingSchedule = schedules.find((s) => {
      if (s.id === currentBookingId || s.bookingId === currentBookingId) return false;
      if (s.status === 'Batal' || s.status === 'Hangus') return false;
      const isSameTrainer =
        (s.trainerId && s.trainerId === trainerId) || (!s.trainerId && s.trainer);
      if (!isSameTrainer) return false;
      if (s.date !== date) return false;
      return s.time === slot.startTime;
    });

    // 5. Cek apakah ada Studio Class yang diajar trainer pada jam ini
    const clashingStudioClass = (options?.studioClasses || []).find((c) => {
      if (c.date !== date) return false;
      const isInstructor =
        (c.trainerId && c.trainerId === trainerId) ||
        (options?.trainerName &&
          (c.trainerName || c.trainer || '').toLowerCase().trim() ===
            options.trainerName.toLowerCase().trim());
      if (!isInstructor) return false;
      return isTimeMatchingStudioClass(c.time, slot.startTime);
    });

    if (clashingStudioClass) {
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
        isAvailable: false,
        reasonDisabled: `Mengajar Kelas Studio: ${clashingStudioClass.name} (${clashingStudioClass.room || 'Studio'})`,
        occupant: `Kelas: ${clashingStudioClass.name}`,
        clashId: clashingStudioClass.id,
        statusType: 'STUDIO_CLASS' as any,
        dutyStatus
      };
    }

    const isOccupied = Boolean(clashingBooking || clashingSchedule);
    const occupant = clashingBooking?.memberName || clashingSchedule?.memberName;

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label,
      isAvailable: !isOccupied,
      reasonDisabled: isOccupied ? `Terisi oleh ${occupant}` : undefined,
      occupant: isOccupied ? occupant : undefined,
      clashId: clashingBooking?.id || clashingSchedule?.id,
      statusType: isOccupied ? ('OCCUPIED' as const) : ('AVAILABLE' as const),
      dutyStatus
    };
  });
}

/**
 * Validasi Double Booking & Kelayakan Jam Kerja:
 * - Trainer tidak boleh sedang libur (Day Off)
 * - Trainer tidak boleh berhalangan hadir / cuti / tidak mengajar
 * - Waktu booking harus berada di dalam jam kerja / shift mengajar trainer
 * - Trainer tidak boleh punya 2 member di jam sama
 * - Trainer tidak boleh sedang mengajar kelas studio di jam sama
 * - Member tidak boleh punya 2 sesi di jam sama
 */
export function validatePTDoubleBooking(params: {
  memberId: string;
  trainerId: string;
  trainerName?: string;
  date: string;
  startTime: string;
  currentBookingId?: string;
  bookings: PTBooking[];
  schedules: Schedule[];
  workSchedules?: WorkSchedule[];
  staffAttendances?: StaffAttendance[];
  leaveRequests?: LeaveRequest[];
  trainerUser?: User;
  rules?: TrainerWorkingRule[];
  studioClasses?: StudioClass[];
}): { isValid: boolean; error?: string } {
  const {
    memberId,
    trainerId,
    trainerName,
    date,
    startTime,
    currentBookingId,
    bookings,
    schedules,
    workSchedules,
    staffAttendances,
    leaveRequests,
    trainerUser,
    rules,
    studioClasses
  } = params;

  // 1. Cek status kehadiran dan jam kerja trainer
  const duty = getTrainerDutyStatusOnDate({
    trainerId,
    trainerName,
    date,
    workSchedules,
    staffAttendances,
    leaveRequests,
    trainerUser,
    rules
  });

  if (!duty.isAvailableForDate) {
    return {
      isValid: false,
      error:
        duty.reason ||
        'Trainer tidak dapat mengambil jadwal melatih pada tanggal ini (Sedang Libur / Berhalangan Hadir / Tidak Mengajar).'
    };
  }

  // 2. Cek apakah slot jam berada di luar jam kerja trainer
  if (duty.dutyStartTime && duty.dutyEndTime) {
    if (startTime < duty.dutyStartTime || startTime >= duty.dutyEndTime) {
      return {
        isValid: false,
        error: `Jam ${startTime} berada di luar jam kerja mengajar trainer (${duty.dutyStartTime} - ${duty.dutyEndTime}). Silakan pilih slot di dalam jam kerja trainer.`
      };
    }
  }

  // 3. Cek apakah trainer sudah ada janji di jam tersebut
  const trainerClashBooking = bookings.find((b) => {
    if (b.id === currentBookingId) return false;
    if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
    return b.trainerId === trainerId && b.bookingDate === date && b.startTime === startTime;
  });

  const trainerClashSchedule = schedules.find((s) => {
    if (s.id === currentBookingId || s.bookingId === currentBookingId) return false;
    if (s.status === 'Batal' || s.status === 'Hangus') return false;
    const isTrainerMatch =
      (s.trainerId && s.trainerId === trainerId) || (!s.trainerId && s.trainer);
    return isTrainerMatch && s.date === date && s.time === startTime;
  });

  if (trainerClashBooking || trainerClashSchedule) {
    return {
      isValid: false,
      error: `Slot jam ${startTime} pada tanggal ${date} sudah terisi oleh member lain. Silakan pilih slot jam lain.`
    };
  }

  // 3.b Cek apakah trainer sedang mengajar Kelas Studio pada jam tersebut
  if (studioClasses && studioClasses.length > 0) {
    const clashClass = studioClasses.find((c) => {
      if (c.date !== date) return false;
      const isTrainerMatch =
        (c.trainerId && c.trainerId === trainerId) ||
        (trainerName &&
          (c.trainerName || c.trainer || '').toLowerCase().trim() === trainerName.toLowerCase().trim());
      if (!isTrainerMatch) return false;
      return isTimeMatchingStudioClass(c.time, startTime);
    });

    if (clashClass) {
      return {
        isValid: false,
        error: `Pelatih ${trainerName || 'ini'} sudah terjadwal mengajar kelas studio "${clashClass.name}" pada tanggal ${date} (${clashClass.time} di ${clashClass.room || 'Studio'}). Silakan pilih slot jam lain.`
      };
    }
  }

  // 4. Cek apakah member sudah ada sesi lain di jam tersebut
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
 * Menghitung Total Jam Mengajar & Rekap Sesi Terpadu Pelatih:
 * - Jam Sesi PT Selesai (1 sesi = 1 jam)
 * - Jam Kelas Studio yang Diampu (1 kelas = 1 jam)
 * - Sesi Berjalan / Terjadwal Hari Ini
 * - Sinkronisasi Shift & Kuota Maksimal Harian
 */
export function calculateTrainerTeachingHours(params: {
  trainerId: string;
  trainerName?: string;
  date?: string; // default APP_TODAY
  schedules?: Schedule[];
  ptBookings?: PTBooking[];
  studioClasses?: StudioClass[];
  workSchedules?: WorkSchedule[];
  staffAttendances?: StaffAttendance[];
  leaveRequests?: LeaveRequest[];
  rules?: TrainerWorkingRule[];
  trainerUser?: User;
}) {
  const {
    trainerId,
    trainerName = '',
    date = APP_TODAY,
    schedules = [],
    ptBookings = [],
    studioClasses = [],
    workSchedules = [],
    staffAttendances = [],
    leaveRequests = [],
    rules = DEFAULT_TRAINER_WORKING_RULES,
    trainerUser
  } = params;

  const currentMonth = date.slice(0, 7); // YYYY-MM
  const cleanName = trainerName.toLowerCase().trim();

  const isTrainerMatch = (tId?: string, tName?: string) => {
    if (tId && tId === trainerId) return true;
    if (cleanName && tName && tName.toLowerCase().trim() === cleanName) return true;
    return false;
  };

  // 1. Sesi PT Selesai Bulan Ini & Hari Ini
  const completedScheduleIds = new Set<string>();
  let ptCompletedMonthCount = 0;
  let ptCompletedTodayCount = 0;
  let ptUpcomingTodayCount = 0;

  schedules.forEach((s) => {
    if (!isTrainerMatch(s.trainerId, s.trainer)) return;
    if (s.status === 'Selesai') {
      completedScheduleIds.add(s.id);
      if (s.bookingId) completedScheduleIds.add(s.bookingId);
      if (s.date.startsWith(currentMonth)) ptCompletedMonthCount++;
      if (s.date === date) ptCompletedTodayCount++;
    } else if (s.date === date && (s.status === 'Menunggu' || s.status === 'Reschedule')) {
      ptUpcomingTodayCount++;
    }
  });

  ptBookings.forEach((b) => {
    if (!isTrainerMatch(b.trainerId, b.trainerName)) return;
    if (completedScheduleIds.has(b.id) || (b.scheduleId && completedScheduleIds.has(b.scheduleId))) {
      return;
    }
    if (b.status === 'COMPLETED') {
      if (b.bookingDate.startsWith(currentMonth)) ptCompletedMonthCount++;
      if (b.bookingDate === date) ptCompletedTodayCount++;
    } else if (
      b.bookingDate === date &&
      (b.status === 'CONFIRMED' || b.status === 'RESCHEDULED' || b.status === 'PENDING')
    ) {
      ptUpcomingTodayCount++;
    }
  });

  // 2. Kelas Studio yang Diampu Bulan Ini & Hari Ini
  let studioMonthCount = 0;
  let studioTodayCount = 0;
  let studioUpcomingTodayCount = 0;

  studioClasses.forEach((c) => {
    if (!isTrainerMatch(c.trainerId, c.trainerName || c.trainer)) return;
    const isPast = c.date < date || (c.date === date && (c.checkedInMembers?.length || 0) > 0);
    if (c.date.startsWith(currentMonth)) {
      studioMonthCount++;
    }
    if (c.date === date) {
      if (isPast) {
        studioTodayCount++;
      } else {
        studioUpcomingTodayCount++;
      }
    }
  });

  // Total jam mengajar (1 sesi PT = 1 jam, 1 kelas Studio = 1 jam)
  const totalCompletedHoursMonth = ptCompletedMonthCount + studioMonthCount;
  const totalCompletedHoursToday = ptCompletedTodayCount + studioTodayCount;
  const totalActiveSessionsToday = ptUpcomingTodayCount + studioUpcomingTodayCount;

  // Duty status hari ini
  const dutyToday = getTrainerDutyStatusOnDate({
    trainerId,
    trainerName,
    date,
    workSchedules,
    staffAttendances,
    leaveRequests,
    trainerUser,
    rules
  });

  const matchedRule = rules.find((r) => isTrainerMatch(r.trainerId, r.trainerName));
  const maxSessionsPerDay = matchedRule?.maxSessionsPerDay || 8;
  const totalTodayLoad = totalCompletedHoursToday + totalActiveSessionsToday;
  const remainingSlotsToday = Math.max(0, maxSessionsPerDay - totalTodayLoad);

  return {
    ptCompletedMonthCount,
    studioMonthCount,
    totalCompletedHoursMonth,
    ptCompletedTodayCount,
    studioTodayCount,
    totalCompletedHoursToday,
    ptUpcomingTodayCount,
    studioUpcomingTodayCount,
    totalActiveSessionsToday,
    totalTodayLoad,
    maxSessionsPerDay,
    remainingSlotsToday,
    dutyToday,
    rule: matchedRule
  };
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
  const memberPurchases = ptPurchases.filter((p) => {
    const isInactive = p.status === 'CANCELLED' || p.status === 'REFUND' || p.status === 'EXPIRED';
    if (isInactive) return false;

    // Direct ID match with name verification to prevent cross-contamination
    if (p.memberId === member.id) {
      if (
        p.memberName &&
        !p.memberName.toLowerCase().includes(member.name.toLowerCase()) &&
        !member.name.toLowerCase().includes(p.memberName.toLowerCase())
      ) {
        return false;
      }
      return true;
    }
    // Name match
    if (p.memberName && p.memberName.toLowerCase().trim() === member.name.toLowerCase().trim()) {
      return true;
    }
    // Group / couple memberIds
    if (p.memberIds && p.memberIds.includes(member.id)) {
      return true;
    }
    return false;
  });

  // Ambil paket yang paling relevan (prioritas paket aktif / in_progress / assigned yang masih punya sisa sesi)
  const activePurchase =
    memberPurchases.find(
      (p) =>
        (p.status === 'IN_PROGRESS' || p.status === 'ASSIGNED' || p.status === 'SCHEDULED' || p.status === 'Active') &&
        ((p.remainingSessions ?? (p.totalSessions - p.completedSessions)) > 0)
    ) ||
    memberPurchases.find(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'ASSIGNED' || p.status === 'SCHEDULED' || p.status === 'Active'
    ) ||
    memberPurchases[0];

  // Bookings member ini
  const memberBookings = bookings.filter((b) => b.memberId === member.id);
  const completedBookings = memberBookings.filter((b) => b.status === 'COMPLETED');
  const activeScheduledBookings = memberBookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'RESCHEDULED'
  );

  const totalSessions = activePurchase
    ? activePurchase.totalSessions
    : (member.ptQuota || 0);

  const completedSessions = activePurchase
    ? activePurchase.completedSessions
    : completedBookings.length;

  const scheduledCount = activeScheduledBookings.length;

  // Sisa sesi tersedia untuk di-booking = Sisa kuota paket - Booking aktif terjadwal
  const baseRemaining = activePurchase
    ? (activePurchase.remainingSessions !== undefined
        ? activePurchase.remainingSessions
        : Math.max(0, totalSessions - completedSessions))
    : Math.max(0, (member.ptQuota || 0));

  const remainingAvailable = Math.max(0, baseRemaining - scheduledCount);

  // Trainer yang ditugaskan
  const assignedTrainer =
    activePurchase?.trainerId && activePurchase.trainerId !== '-' && activePurchase.trainerId !== ''
      ? { id: activePurchase.trainerId, name: activePurchase.trainerName }
      : member.picId && member.picName
      ? { id: member.picId, name: member.picName }
      : null;

  const hasActivePackage = Boolean(
    (activePurchase &&
      (activePurchase.status === 'Active' ||
        activePurchase.status === 'IN_PROGRESS' ||
        activePurchase.status === 'ASSIGNED' ||
        activePurchase.status === 'SCHEDULED' ||
        activePurchase.status === 'WAITING_ASSIGNMENT')) ||
      (member.ptQuota && member.ptQuota > 0)
  );

  return {
    hasActivePackage,
    activePurchase,
    packageName: activePurchase?.packageName || (member.ptQuota && member.ptQuota > 0 ? `Paket PT Mandiri (${member.ptQuota} Sesi)` : 'Belum Ada Paket PT Aktif'),
    totalSessions,
    completedSessions,
    scheduledSessions: scheduledCount,
    remainingAvailable,
    assignedTrainer,
    expiryDate: activePurchase?.expiryDate || member.expired || APP_TODAY
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

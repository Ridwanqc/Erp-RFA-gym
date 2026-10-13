import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  CalendarDays,
  X,
  History,
  Phone,
  Building2,
  FileText,
  BadgeAlert,
  Send,
  UserCheck,
  RefreshCw,
  Info,
  Layers,
  Award
} from 'lucide-react';
import {
  Member,
  PTPurchaseRecord,
  PTBooking,
  Schedule,
  User as UserType,
  TrainerChangeRequest,
  PTBackofficeNotification
} from '../../types';
import { APP_TODAY, formatDateIndo } from '../../utils/formatters';
import {
  DEFAULT_PT_TIME_SLOTS,
  getTrainerSlotAvailability,
  validatePTDoubleBooking,
  checkRescheduleEligibility,
  calculateMemberPTSummary,
  getPreviousBookingPatterns
} from '../../data/ptBookingData';

interface MemberPTBookingSectionProps {
  loggedInMember: Member;
  ptPurchases: PTPurchaseRecord[];
  bookings: PTBooking[];
  schedules: Schedule[];
  trainers: UserType[];
  trainerChangeRequests: TrainerChangeRequest[];
  onAddBooking: (booking: PTBooking, notification: PTBackofficeNotification) => void;
  onRescheduleBooking: (
    bookingId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    notes?: string
  ) => void;
  onCancelBooking: (bookingId: string, reason?: string) => void;
  onRequestChangeTrainer: (request: TrainerChangeRequest) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenNewReservation?: () => void;
}

export const MemberPTBookingSection: React.FC<MemberPTBookingSectionProps> = ({
  loggedInMember,
  ptPurchases,
  bookings,
  schedules,
  trainers,
  trainerChangeRequests,
  onAddBooking,
  onRescheduleBooking,
  onCancelBooking,
  onRequestChangeTrainer,
  showToast,
  onOpenNewReservation
}) => {
  // 1. Calculate active PT status for this member
  const ptSummary = useMemo(() => {
    return calculateMemberPTSummary(loggedInMember, ptPurchases, bookings);
  }, [loggedInMember, ptPurchases, bookings]);

  // Member's bookings history (merges PTBookings and ERP Schedules so no session is missed)
  const memberBookings = useMemo(() => {
    const directBookings = bookings.filter(
      (b) =>
        b.memberId === loggedInMember.id ||
        (b.memberName && b.memberName.toLowerCase().trim() === loggedInMember.name.toLowerCase().trim())
    );
    const bookingIds = new Set(directBookings.map((b) => b.id));
    const bookingScheduleIds = new Set(directBookings.map((b) => b.scheduleId).filter(Boolean));

    // Also include any PT schedules directly created by staff/coach in ERP calendar
    const erpPTSchedules: PTBooking[] = schedules
      .filter(
        (s) =>
          (s.memberId === loggedInMember.id ||
            (s.memberName && s.memberName.toLowerCase().trim() === loggedInMember.name.toLowerCase().trim())) &&
          !bookingIds.has(s.id) &&
          (!s.bookingId || !bookingIds.has(s.bookingId)) &&
          !bookingScheduleIds.has(s.id)
      )
      .map((s, idx) => ({
        id: s.bookingId || s.id,
        bookingCode: s.bookingCode || `BK-${s.id}`,
        scheduleId: s.id,
        ptPackageId: s.purchaseId || ptSummary.activePurchase?.id || 'ERP-SCH',
        packageName: ptSummary.activePurchase?.packageName || 'Sesi Personal Trainer (ERP)',
        totalSessions: ptSummary.totalSessions || 10,
        sessionNumber: s.sessionNumber || idx + 1,
        memberId: s.memberId,
        memberName: s.memberName,
        memberPhone: loggedInMember.phone,
        trainerId: s.trainerId || 'S04',
        trainerName: s.trainer || 'Coach RFA',
        bookingDate: s.date,
        startTime: s.time,
        endTime:
          s.endTime ||
          (s.time.includes(':')
            ? `${(parseInt(s.time.split(':')[0]) + 1).toString().padStart(2, '0')}:${s.time.split(':')[1]}`
            : '19:00'),
        workoutFocus: s.workoutFocus || 'Personal Training (ERP)',
        status:
          s.status === 'Selesai'
            ? ('COMPLETED' as const)
            : s.status === 'Batal' || s.status === 'Hangus'
            ? ('CANCELLED' as const)
            : s.status === 'Reschedule'
            ? ('RESCHEDULED' as const)
            : ('CONFIRMED' as const),
        source: (s.source as any) || 'ERP_ADMIN',
        notes: s.note || 'Dijadwalkan via Ruang Kerja ERP',
        createdAt: s.date,
        updatedAt: s.date,
        createdBy: 'Admin / Coach ERP'
      }));

    return [...directBookings, ...erpPTSchedules].sort(
      (a, b) =>
        new Date(`${b.bookingDate}T${b.startTime}`).getTime() -
        new Date(`${a.bookingDate}T${a.startTime}`).getTime()
    );
  }, [bookings, schedules, loggedInMember, ptSummary.activePurchase?.id]);

  // Previous patterns for "Gunakan Jadwal Sebelumnya" & "Booking Ulang"
  const patterns = useMemo(() => {
    return getPreviousBookingPatterns(loggedInMember.id, bookings, schedules);
  }, [loggedInMember.id, bookings, schedules]);

  // Active filter for my schedules
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'upcoming' | 'today' | 'completed' | 'cancelled' | 'rescheduled'>('all');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to tomorrow or today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('18:00');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [workoutFocus, setWorkoutFocus] = useState<string>('General Strength & Hypertrophy');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<PTBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<string>('18:00');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Detail / Audit Trail Modal State
  const [detailTarget, setDetailTarget] = useState<PTBooking | null>(null);

  // Request Trainer Change Modal State
  const [isChangeTrainerModalOpen, setIsChangeTrainerModalOpen] = useState(false);
  const [changeTrainerReason, setChangeTrainerReason] = useState('');
  const [preferredTrainerId, setPreferredTrainerId] = useState('');

  // Pending change requests for this member
  const pendingChangeRequest = useMemo(() => {
    return trainerChangeRequests.find(
      (r) => r.memberId === loggedInMember.id && r.status === 'PENDING'
    );
  }, [trainerChangeRequests, loggedInMember.id]);

  // Assigned Trainer object
  const activeTrainer = useMemo(() => {
    if (!ptSummary.assignedTrainer?.id) {
      // Fallback: match by name from trainers list
      const byName = trainers.find((t) => t.name === ptSummary.assignedTrainer?.name);
      return byName || null;
    }
    return trainers.find((t) => t.id === ptSummary.assignedTrainer?.id) || null;
  }, [trainers, ptSummary.assignedTrainer]);

  const trainerIdToUse = activeTrainer?.id || ptSummary.assignedTrainer?.id || 'S04';
  const trainerNameToUse = activeTrainer?.name || ptSummary.assignedTrainer?.name || 'Reza Pratama';

  // Real-time slot availability for selected date
  const slotAvailabilities = useMemo(() => {
    return getTrainerSlotAvailability(
      trainerIdToUse,
      selectedDate,
      bookings,
      schedules
    );
  }, [trainerIdToUse, selectedDate, bookings, schedules]);

  // Real-time slot availability for reschedule modal
  const rescheduleSlotAvailabilities = useMemo(() => {
    if (!rescheduleTarget) return [];
    return getTrainerSlotAvailability(
      rescheduleTarget.trainerId,
      rescheduleDate,
      bookings,
      schedules,
      rescheduleTarget.id
    );
  }, [rescheduleTarget, rescheduleDate, bookings, schedules]);

  // Filtered booking list
  const filteredBookings = useMemo(() => {
    return memberBookings.filter((b) => {
      if (scheduleFilter === 'all') return true;
      if (scheduleFilter === 'today') return b.bookingDate === APP_TODAY;
      if (scheduleFilter === 'upcoming') {
        return (b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'RESCHEDULED') && b.bookingDate >= APP_TODAY;
      }
      if (scheduleFilter === 'completed') return b.status === 'COMPLETED';
      if (scheduleFilter === 'cancelled') return b.status === 'CANCELLED';
      if (scheduleFilter === 'rescheduled') return b.status === 'RESCHEDULED';
      return true;
    });
  }, [memberBookings, scheduleFilter]);

  // Quick Book / Rebook from last session
  const handleQuickRebook = () => {
    if (ptSummary.remainingAvailable <= 0) {
      showToast(
        'Sisa Kuota Habis',
        'Anda tidak memiliki sisa sesi PT yang tersedia. Silakan lakukan perpanjangan paket PT.',
        'warning'
      );
      return;
    }

    if (patterns.lastBooking) {
      // Prefill with typical parameters
      setSelectedTimeSlot(patterns.lastBooking.startTime);
      setWorkoutFocus(patterns.lastBooking.workoutFocus || 'General Conditioning');
    }

    // Default to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setBookingError(null);
    setIsBookingModalOpen(true);
  };

  // Use Previous Schedule Pattern
  const handleUsePattern = (pattern: { dayName: string; time: string; trainer: string }) => {
    setSelectedTimeSlot(pattern.time);
    // Find next matching date for that day of the week
    const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const targetDayIndex = dayNamesIndo.indexOf(pattern.dayName);

    if (targetDayIndex >= 0) {
      const today = new Date();
      let daysAhead = (targetDayIndex - today.getDay() + 7) % 7;
      if (daysAhead === 0) daysAhead = 7; // Next week's same day
      const targetDateObj = new Date();
      targetDateObj.setDate(today.getDate() + daysAhead);
      setSelectedDate(targetDateObj.toISOString().split('T')[0]);
    }

    setBookingError(null);
    setIsBookingModalOpen(true);
  };

  // Submit New Booking
  const handleCreateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    // 1. Validasi kuota
    if (ptSummary.remainingAvailable <= 0) {
      setBookingError('Sisa kuota sesi PT Anda sudah habis. Silakan perpanjang paket.');
      return;
    }

    // 2. Validasi slot dipilih
    const slotObj = DEFAULT_PT_TIME_SLOTS.find((s) => s.startTime === selectedTimeSlot);
    if (!slotObj) {
      setBookingError('Slot waktu tidak valid.');
      return;
    }

    // 3. Validasi double booking
    const doubleCheck = validatePTDoubleBooking({
      memberId: loggedInMember.id,
      trainerId: trainerIdToUse,
      date: selectedDate,
      startTime: slotObj.startTime,
      bookings,
      schedules
    });

    if (!doubleCheck.isValid) {
      setBookingError(doubleCheck.error || 'Slot waktu tidak tersedia.');
      return;
    }

    // Generate Session Number (Completed + Active Bookings + 1)
    const nextSessionNum = ptSummary.completedSessions + ptSummary.scheduledSessions + 1;
    const bookingCode = 'BK-PT-' + Math.floor(1000 + Math.random() * 9000);
    const newBookingId = 'PTB-' + Date.now();
    const createdTimestamp = `${APP_TODAY} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    const newBooking: PTBooking = {
      id: newBookingId,
      bookingCode,
      memberId: loggedInMember.id,
      memberName: loggedInMember.name,
      memberPhone: loggedInMember.phone,
      memberPhoto: loggedInMember.photo,
      ptPackageId: ptSummary.activePurchase?.id || 'PUR-MANUAL',
      packageName: ptSummary.packageName,
      totalSessions: ptSummary.totalSessions,
      sessionNumber: nextSessionNum,
      trainerId: trainerIdToUse,
      trainerName: trainerNameToUse,
      branchId: loggedInMember.branchId || 'BR-001',
      branchName: loggedInMember.branchName || 'GymPro Flagship Kelapa Gading',
      bookingDate: selectedDate,
      startTime: slotObj.startTime,
      endTime: slotObj.endTime,
      status: 'CONFIRMED', // Auto-confirmed because slot has been validated
      source: 'PORTAL_MEMBER',
      notes: bookingNotes || `Booking mandiri via Portal Member [${workoutFocus}]`,
      workoutFocus,
      createdAt: createdTimestamp,
      updatedAt: createdTimestamp,
      createdBy: `${loggedInMember.name} (Portal Member)`,
      history: [
        {
          id: 'PTH-' + Date.now(),
          bookingId: newBookingId,
          action: 'BOOKING_CREATED',
          newValue: `Sesi ${nextSessionNum} (${selectedDate} ${slotObj.label})`,
          changedBy: loggedInMember.name,
          changedRole: 'MEMBER',
          source: 'PORTAL_MEMBER',
          createdAt: createdTimestamp,
          notes: `Member melakukan booking mandiri. Coach: ${trainerNameToUse}.`
        }
      ]
    };

    // Buat notifikasi resmi ke Backoffice
    const notification: PTBackofficeNotification = {
      id: 'PTN-' + Date.now(),
      bookingId: newBookingId,
      title: '🔔 Booking PT Baru (Portal Member)',
      message: `Member ${loggedInMember.name} melakukan booking PT Sesi ${nextSessionNum}/${ptSummary.totalSessions}. Trainer: ${trainerNameToUse}, Tanggal: ${selectedDate}, Jam: ${slotObj.label}.`,
      targetRole: 'ALL',
      trainerId: trainerIdToUse,
      memberId: loggedInMember.id,
      memberName: loggedInMember.name,
      bookingDate: selectedDate,
      timeSlot: slotObj.label,
      createdAt: createdTimestamp,
      isRead: false
    };

    onAddBooking(newBooking, notification);

    setIsBookingModalOpen(false);
    setBookingNotes('');
    showToast(
      'Booking PT Berhasil Disimpan',
      `Jadwal latihan Sesi ${nextSessionNum} bersama Coach ${trainerNameToUse} pada ${selectedDate} (${slotObj.label}) berhasil dikonfirmasi. Notifikasi otomatis dikirim ke Backoffice.`,
      'success'
    );
  };

  // Open Reschedule Modal with validation
  const handleOpenReschedule = (booking: PTBooking) => {
    const check = checkRescheduleEligibility(booking);
    if (!check.allowed) {
      showToast('Tidak Dapat Reschedule', check.reason || 'Aturan reschedule tidak terpenuhi.', 'warning');
      return;
    }

    setRescheduleTarget(booking);
    // Default to tomorrow or next date
    const tom = new Date(booking.bookingDate + 'T00:00:00');
    tom.setDate(tom.getDate() + 1);
    setRescheduleDate(tom.toISOString().split('T')[0]);
    setRescheduleTimeSlot(booking.startTime);
    setRescheduleReason('');
    setRescheduleError(null);
  };

  // Submit Reschedule
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;

    setRescheduleError(null);

    const slotObj = DEFAULT_PT_TIME_SLOTS.find((s) => s.startTime === rescheduleTimeSlot);
    if (!slotObj) {
      setRescheduleError('Slot waktu tidak valid.');
      return;
    }

    // Double check availability
    const doubleCheck = validatePTDoubleBooking({
      memberId: loggedInMember.id,
      trainerId: rescheduleTarget.trainerId,
      date: rescheduleDate,
      startTime: slotObj.startTime,
      currentBookingId: rescheduleTarget.id,
      bookings,
      schedules
    });

    if (!doubleCheck.isValid) {
      setRescheduleError(doubleCheck.error || 'Slot waktu baru tidak tersedia.');
      return;
    }

    onRescheduleBooking(
      rescheduleTarget.id,
      rescheduleDate,
      slotObj.startTime,
      slotObj.endTime,
      rescheduleReason || 'Reschedule mandiri oleh member via Portal Member'
    );

    setRescheduleTarget(null);
    showToast(
      'Reschedule Berhasil',
      `Jadwal latihan berhasil dipindahkan ke ${rescheduleDate} pukul ${slotObj.label}. Coach ${rescheduleTarget.trainerName} & Leader PT telah diberitahu.`,
      'success'
    );
  };

  // Submit Request Change Trainer
  const handleTrainerChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeTrainerReason.trim()) {
      showToast('Alasan Diperlukan', 'Harap tuliskan alasan permohonan pergantian pelatih.', 'warning');
      return;
    }

    const preferredTrainer = trainers.find((t) => t.id === preferredTrainerId);

    const newRequest: TrainerChangeRequest = {
      id: 'TCR-' + Date.now(),
      memberId: loggedInMember.id,
      memberName: loggedInMember.name,
      memberPhone: loggedInMember.phone,
      ptPackageId: ptSummary.activePurchase?.id || 'PUR-MANUAL',
      packageName: ptSummary.packageName,
      currentTrainerId: trainerIdToUse,
      currentTrainerName: trainerNameToUse,
      preferredTrainerId: preferredTrainer?.id,
      preferredTrainerName: preferredTrainer?.name,
      reason: changeTrainerReason,
      status: 'PENDING',
      requestedAt: `${APP_TODAY} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
    };

    onRequestChangeTrainer(newRequest);
    setIsChangeTrainerModalOpen(false);
    setChangeTrainerReason('');
    setPreferredTrainerId('');
    showToast(
      'Permohonan Terkirim',
      'Permintaan pergantian trainer telah diajukan ke Leader PT untuk dievaluasi.',
      'info'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Header Information & Member Snapshot */}
      <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={
                loggedInMember.photo ||
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
              }
              alt={loggedInMember.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-500/40"
            />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black text-black">
              AKTIF
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-white">{loggedInMember.name}</h4>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-orange-400 font-mono text-[10px] font-bold">
                {loggedInMember.id}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>{loggedInMember.phone || '-'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-zinc-500" />
                {loggedInMember.branchName || 'RFA Gym Central'}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {ptSummary.hasActivePackage && ptSummary.remainingAvailable > 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedTimeSlot('18:00');
                  setBookingError(null);
                  setIsBookingModalOpen(true);
                }}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Booking Jadwal</span>
              </button>

              <button
                type="button"
                onClick={handleQuickRebook}
                className="px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-orange-400 hover:text-orange-300 font-bold text-xs flex items-center gap-1.5 border border-zinc-700 active:scale-95 transition-all"
                title="Booking Ulang berdasarkan sesi latihan terakhir"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Booking Ulang</span>
              </button>
            </>
          )}

          {ptSummary.hasActivePackage && (
            <button
              type="button"
              onClick={() => setIsChangeTrainerModalOpen(true)}
              className="p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs transition"
              title="Ajukan Pergantian Trainer ke Leader PT"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. CARD: PAKET PT AKTIF ATAU PERINGATAN BELUM ADA PAKET */}
      {!ptSummary.hasActivePackage ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/30 text-center space-y-4 relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
              Personal Trainer (PT)
            </span>
            <h4 className="text-lg font-black text-white pt-1">
              Anda Belum Memiliki Paket Personal Trainer Aktif
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dapatkan bimbingan latihan 1-on-1 eksklusif bersama pelatih bersertifikat kami untuk mencapai target body transformation, fat loss, atau hipertrofi otot lebih cepat dan aman.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenNewReservation && (
              <button
                type="button"
                onClick={onOpenNewReservation}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Lihat & Pilih Paket PT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20RFA%20Gym,%20saya%20ingin%20konsultasi%20paket%20Personal%20Trainer"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 flex items-center gap-2 transition"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Konsultasi via WhatsApp</span>
            </a>
          </div>
        </div>
      ) : (
        /* PAKET PT AKTIF CARD */
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-orange-500/30 relative overflow-hidden shadow-xl">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Package Title & Trainer Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/30">
                  PAKET PT AKTIF
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Berlaku s/d: <strong className="text-zinc-200">{ptSummary.expiryDate}</strong>
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                {ptSummary.packageName}
              </h3>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-zinc-400 font-medium">Pelatih:</span>
                  <span className="font-extrabold text-white">{trainerNameToUse}</span>
                </div>

                {pendingChangeRequest && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Permohonan Ganti Trainer Sedang Ditinjau Leader PT</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Sesi Stats (Completed, Scheduled, Available) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto">
              {/* Completed */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-center min-w-[90px] sm:min-w-[110px]">
                <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">{ptSummary.completedSessions}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Completed</div>
              </div>

              {/* Scheduled */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-center min-w-[90px] sm:min-w-[110px]">
                <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Terjadwal</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400">{ptSummary.scheduledSessions}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Scheduled</div>
              </div>

              {/* Available */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/70 border border-orange-500/30 text-center min-w-[90px] sm:min-w-[110px]">
                <div className="flex items-center justify-center gap-1 text-orange-400 text-xs font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sisa Sesi</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-orange-400">{ptSummary.remainingAvailable}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Available</div>
              </div>
            </div>
          </div>

          {/* Progress Bar of Sessions */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400 font-medium">
                Kemajuan Sesi: <strong className="text-white">{ptSummary.completedSessions + ptSummary.scheduledSessions}</strong> dari <strong className="text-white">{ptSummary.totalSessions} Sesi Total</strong>
              </span>
              <span className="text-xs font-bold text-orange-400">
                {Math.round(((ptSummary.completedSessions + ptSummary.scheduledSessions) / (ptSummary.totalSessions || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden flex">
              <div
                style={{
                  width: `${(ptSummary.completedSessions / (ptSummary.totalSessions || 1)) * 100}%`
                }}
                className="bg-emerald-500 transition-all duration-500"
                title={`${ptSummary.completedSessions} Selesai`}
              />
              <div
                style={{
                  width: `${(ptSummary.scheduledSessions / (ptSummary.totalSessions || 1)) * 100}%`
                }}
                className="bg-amber-500 transition-all duration-500"
                title={`${ptSummary.scheduledSessions} Terjadwal`}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Selesai ({ptSummary.completedSessions})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Terjadwal ({ptSummary.scheduledSessions})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-700" /> Belum Dijadwalkan ({ptSummary.remainingAvailable})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. POLA JADWAL SEBELUMNYA & QUICK BOOKING SECTION */}
      {ptSummary.hasActivePackage && patterns.frequentPatterns.length > 0 && (
        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-orange-400" />
              <h5 className="text-xs sm:text-sm font-black text-white">
                Pola Jadwal Latihan Sebelumnya Anda
              </h5>
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              Klik pola untuk booking instan pada hari & jam favorit Anda
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {patterns.frequentPatterns.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUsePattern(p)}
                className="p-3 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500/40 text-left transition group active:scale-95"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-orange-400 group-hover:text-orange-300">
                    {p.dayName}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold bg-zinc-800 px-1.5 py-0.5 rounded">
                    {p.count}x Sesi
                  </span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{p.time}</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 truncate">Coach {p.trainer}</div>
                <div className="text-[10px] text-orange-400 font-bold mt-2 flex items-center gap-1 group-hover:underline">
                  <span>Gunakan Jadwal Ini</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. RIWAYAT & JADWAL SAYA (UPCOMING, TODAY, COMPLETED, CANCELLED) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-400" />
              <span>Jadwal Latihan Personal Trainer Saya</span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Kelola sesi mendatang, lakukan reschedule (minimal H-4 jam), atau pantau riwayat evaluasi.
            </p>
          </div>

          {/* Sub-Tabs Filter */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: `Semua (${memberBookings.length})` },
              { id: 'upcoming', label: 'Mendatang' },
              { id: 'today', label: 'Hari Ini' },
              { id: 'completed', label: 'Selesai' },
              { id: 'rescheduled', label: 'Reschedule' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScheduleFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  scheduleFilter === tab.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredBookings.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
            <h5 className="text-sm font-bold text-zinc-300">Belum Ada Sesi PT pada Kategori Ini</h5>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Tidak ada jadwal latihan yang cocok dengan filter yang dipilih. Silakan klik tombol di bawah untuk membuat jadwal baru.
            </p>
            {ptSummary.hasActivePackage && ptSummary.remainingAvailable > 0 && (
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition"
              >
                Pilih Slot Latihan Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredBookings.map((b) => {
              const resCheck = checkRescheduleEligibility(b);
              const isToday = b.bookingDate === APP_TODAY;

              return (
                <div
                  key={b.id}
                  className={`p-4 sm:p-5 rounded-3xl bg-zinc-900 border transition-all flex flex-col justify-between gap-4 ${
                    isToday
                      ? 'border-orange-500/50 shadow-lg shadow-orange-500/5 bg-zinc-900/95'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Date & Status Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-orange-400">{b.bookingCode}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                            HARI INI
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-semibold">
                          {b.source === 'PORTAL_MEMBER' ? 'Portal Member' : 'Backoffice'}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : b.status === 'CONFIRMED'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : b.status === 'RESCHEDULED'
                            ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    {/* Schedule Time & Date */}
                    <div>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                        <span>{formatDateIndo(b.bookingDate)}</span>
                      </h4>
                      <p className="text-xs text-orange-300 font-bold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        <span>{b.startTime} - {b.endTime} WIB</span>
                      </p>
                    </div>

                    {/* Coach & Session Details */}
                    <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-medium">Coach / Trainer:</span>
                        <span className="font-bold text-white">{b.trainerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-medium">Nomor Sesi:</span>
                        <span className="font-bold text-orange-400">
                          Sesi ke-{b.sessionNumber} dari {b.totalSessions}
                        </span>
                      </div>
                      {b.workoutFocus && (
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[11px]">
                          <span className="text-zinc-500">Fokus Latihan:</span>
                          <span className="text-zinc-300 font-medium truncate max-w-[180px]">{b.workoutFocus}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => setDetailTarget(b)}
                      className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1 hover:bg-zinc-800 transition"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Histori & Detail</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Reschedule Button */}
                      {(b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'RESCHEDULED') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenReschedule(b)}
                            disabled={!resCheck.allowed}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                              resCheck.allowed
                                ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                            }`}
                            title={resCheck.allowed ? 'Pindahkan jadwal (minimal H-4 jam)' : resCheck.reason}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Reschedule</span>
                          </button>

                          {/* Cancel Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Batalkan booking sesi ${b.sessionNumber} pada ${b.bookingDate} (${b.startTime})? Sesi akan dikembalikan ke saldo kuota Anda.`)) {
                                onCancelBooking(b.id, 'Dibatalkan oleh member dari Portal Member');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold border border-rose-500/30 transition"
                            title="Batalkan Booking"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL 1: BOOKING JADWAL PT BARU                            */}
      {/* ========================================================== */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Booking Jadwal Personal Trainer</h4>
                  <p className="text-xs text-zinc-400">
                    Pilih tanggal dan slot waktu latihan bersama Coach {trainerNameToUse}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert */}
            {bookingError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Read-only Auto-Filled Member & Package Data */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">
                DATA MEMBER OTOMATIS (TERVERIFIKASI)
              </span>
              <div className="grid grid-cols-2 gap-2 text-zinc-300">
                <div>
                  Member: <strong className="text-white">{loggedInMember.name}</strong> ({loggedInMember.id})
                </div>
                <div>
                  Cabang: <strong className="text-white">{loggedInMember.branchName || 'Kelapa Gading'}</strong>
                </div>
                <div>
                  Paket: <strong className="text-orange-400">{ptSummary.packageName}</strong>
                </div>
                <div>
                  Sisa Kuota: <strong className="text-emerald-400">{ptSummary.remainingAvailable} Sesi Tersedia</strong>
                </div>
                <div className="col-span-2 pt-1 border-t border-zinc-800/80 flex items-center gap-1.5 text-zinc-400">
                  <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                  <span>
                    Pelatih Ditugaskan: <strong className="text-white">{trainerNameToUse}</strong> (Official Coach)
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateBookingSubmit} className="space-y-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">Pilih Tanggal Latihan:</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    min={APP_TODAY}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-orange-500"
                    required
                  />

                  {/* Quick Date Shortcuts */}
                  <button
                    type="button"
                    onClick={() => setSelectedDate(APP_TODAY)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedDate === APP_TODAY
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white transition"
                  >
                    Besok
                  </button>
                </div>
              </div>

              {/* Slot Availability Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-zinc-300">
                    Pilih Jam Slot Pelatih ({trainerNameToUse}):
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    {slotAvailabilities.filter((s) => s.isAvailable).length} Slot Tersedia
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1 border border-zinc-800 rounded-2xl bg-zinc-950/50">
                  {slotAvailabilities.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.startTime && slot.isAvailable;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedTimeSlot(slot.startTime)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-left transition flex flex-col justify-between ${
                          !slot.isAvailable
                            ? 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-500 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-orange-500 text-white shadow-md border border-orange-400 ring-2 ring-orange-500/40'
                            : 'bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700 border border-zinc-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{slot.label}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              slot.isAvailable ? (isSelected ? 'bg-white' : 'bg-emerald-400') : 'bg-rose-500'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[9px] uppercase font-black mt-1 ${
                            slot.isAvailable
                              ? isSelected
                                ? 'text-white'
                                : 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {slot.isAvailable ? 'Tersedia' : 'Terisi (Full)'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workout Focus / Goal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Fokus Latihan Sesi Ini:</label>
                <select
                  value={workoutFocus}
                  onChange={(e) => setWorkoutFocus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-orange-500"
                >
                  <option value="General Strength & Hypertrophy">Strength & Hipertrofi Otot</option>
                  <option value="Chest & Triceps Focus">Dada & Trisep (Push Day)</option>
                  <option value="Back & Biceps Focus">Punggung & Bisep (Pull Day)</option>
                  <option value="Leg Day & Lower Body Power">Kaki & Lower Body Power</option>
                  <option value="Core & Functional Movement">Core & Functional Mobility</option>
                  <option value="Fat Loss & HIIT Conditioning">Fat Loss & HIIT Conditioning</option>
                  <option value="Evaluasi Form & Screening">Evaluasi Teknik Form & Postur</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Catatan untuk Coach (Opsional):
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Misal: Ingin fokus teknik barbell squat atau target tes PR 70kg..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Actions Bottom */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold shadow-lg shadow-orange-500/25 active:scale-95 transition"
                >
                  Konfirmasi Booking Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: RESCHEDULE JADWAL PT                              */}
      {/* ========================================================== */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Reschedule Sesi Latihan</h4>
                  <p className="text-xs text-zinc-400">
                    Pindahkan jadwal sesi ke tanggal & jam baru (aturan min. H-4 jam).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            {/* Current Schedule Summary */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black block">JADWAL SAAT INI</span>
              <div className="text-white font-bold">
                {formatDateIndo(rescheduleTarget.bookingDate)} • {rescheduleTarget.startTime} - {rescheduleTarget.endTime} WIB
              </div>
              <div className="text-zinc-400">
                Coach: <strong className="text-zinc-200">{rescheduleTarget.trainerName}</strong> • Sesi {rescheduleTarget.sessionNumber}/{rescheduleTarget.totalSessions}
              </div>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Tanggal Baru:</label>
                <input
                  type="date"
                  min={APP_TODAY}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Pilih Jam Slot Baru:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-zinc-800 rounded-2xl bg-zinc-950/50">
                  {rescheduleSlotAvailabilities.map((slot) => {
                    const isSelected = rescheduleTimeSlot === slot.startTime && slot.isAvailable;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setRescheduleTimeSlot(slot.startTime)}
                        className={`p-2 rounded-xl text-xs font-bold text-left transition flex flex-col justify-between ${
                          !slot.isAvailable
                            ? 'bg-zinc-900/60 border border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-sky-500 text-white shadow-md border border-sky-400 ring-2 ring-sky-500/40'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                        }`}
                      >
                        <span className="truncate">{slot.label}</span>
                        <span className={`text-[9px] uppercase font-black mt-1 ${slot.isAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {slot.isAvailable ? 'Tersedia' : 'Terisi'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Alasan Reschedule (Opsional):</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Misal: Ada urusan pekerjaan mendadak di kantor..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold shadow-lg shadow-sky-500/25 active:scale-95 transition"
                >
                  Simpan Jadwal Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3: PERMINTAAN PERGANTIAN TRAINER KE LEADER PT        */}
      {/* ========================================================== */}
      {isChangeTrainerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Ajukan Pergantian Personal Trainer</h4>
                  <p className="text-xs text-zinc-400">
                    Permohonan akan diteruskan ke Leader PT untuk dievaluasi dan disetujui.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeTrainerModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black block">PELATIH SAAT INI</span>
              <div className="text-white font-bold text-sm">{trainerNameToUse}</div>
              <div className="text-zinc-400">
                Paket: {ptSummary.packageName} ({ptSummary.remainingAvailable} Sesi Tersedia)
              </div>
            </div>

            <form onSubmit={handleTrainerChangeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Pilihan Pelatih yang Diharapkan (Opsional):
                </label>
                <select
                  value={preferredTrainerId}
                  onChange={(e) => setPreferredTrainerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="">Serahkan penentuan kepada Leader PT (Rekomendasi Terbaik)</option>
                  {trainers
                    .filter((t) => t.id !== trainerIdToUse)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.roleName || 'Pelatih PT'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Alasan Permohonan Pergantian <span className="text-rose-400">*</span>:
                </label>
                <textarea
                  value={changeTrainerReason}
                  onChange={(e) => setChangeTrainerReason(e.target.value)}
                  placeholder="Misal: Penyesuaian jam kerja kantor ke shift malam, preferensi metode latihan spesifik..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsChangeTrainerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold shadow-lg shadow-amber-500/25 active:scale-95 transition"
                >
                  Kirim Permohonan ke Leader PT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 4: DETAIL & AUDIT TRAIL BOOKING                       */}
      {/* ========================================================== */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <h4 className="text-base font-black text-white">
                  Audit Trail & Detail Booking #{detailTarget.bookingCode}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Status Sesi:</span>
                <span className="font-bold text-orange-400">{detailTarget.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Jadwal Sesi:</span>
                <span className="font-bold text-white">
                  {formatDateIndo(detailTarget.bookingDate)} ({detailTarget.startTime} - {detailTarget.endTime})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pelatih:</span>
                <span className="font-bold text-white">{detailTarget.trainerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Sumber Booking:</span>
                <span className="font-bold text-zinc-200">{detailTarget.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Dibuat Oleh:</span>
                <span className="font-bold text-zinc-200">{detailTarget.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Waktu Dibuat:</span>
                <span className="font-bold text-zinc-400">{detailTarget.createdAt}</span>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div className="space-y-2">
              <h5 className="text-xs font-black text-zinc-300 uppercase tracking-wider">Histori Perubahan (Audit Trail):</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                {(detailTarget.history || []).map((h, i) => (
                  <div key={h.id || i} className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-400">{h.action}</span>
                      <span className="text-[10px] text-zinc-400">{h.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-zinc-200">{h.notes || h.newValue}</p>
                    <div className="text-[10px] text-zinc-400">
                      Oleh: <strong>{h.changedBy}</strong> ({h.changedRole}) • {h.source}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

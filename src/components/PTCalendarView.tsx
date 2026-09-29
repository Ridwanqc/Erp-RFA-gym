import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  User,
  Users,
  Clock,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  X,
  Plus,
  Phone,
  MessageCircle,
  Sparkles,
  RotateCcw,
  Check,
  Layers,
  Eye,
  Grid,
  Info,
  Printer
} from 'lucide-react';
import { Schedule, Member, User as UserType } from '../types';
import { APP_TODAY, formatDateIndo } from '../utils/formatters';
import { PTSchedulePrintModal } from './PTSchedulePrintModal';
import { PTSessionSlipModal } from './PTSessionSlipModal';

export type CalendarViewMode = 'month' | 'week' | 'day';
export type PTSessionFilterStatus = 'all' | 'confirmed' | 'pending' | 'completed';

export interface PTCalendarViewProps {
  schedules: Schedule[];
  trainers: UserType[];
  members: Member[];
  onAddSchedule?: (schedule: Schedule) => void;
  onUpdateSchedule?: (schedule: Schedule) => void;
  onOpenSignature?: (scheduleId: string, targetRole: 'valStaf' | 'valTrainer' | 'valMember') => void;
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenAddModal?: () => void;
}

export function getSessionStatusInfo(schedule: Schedule) {
  if (schedule.status === 'Selesai' || schedule.sessionStatus === 'COMPLETED') {
    return {
      category: 'completed' as const,
      label: 'Selesai (Completed)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      dotClass: 'bg-emerald-400',
      cardClass: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/50',
      chipClass: 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/40',
      borderLeft: 'border-l-emerald-500'
    };
  }
  if (schedule.status === 'Batal' || schedule.sessionStatus === 'CANCELLED') {
    return {
      category: 'cancelled' as const,
      label: 'Dibatalkan (Cancelled)',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30 line-through',
      dotClass: 'bg-rose-500',
      cardClass: 'bg-rose-950/30 border-rose-500/30 text-rose-300 opacity-60',
      chipClass: 'bg-rose-500/20 text-rose-300 line-through border border-rose-500/30',
      borderLeft: 'border-l-rose-500'
    };
  }
  // Confirmed if validated by trainer or staff or marked confirmed
  if (
    schedule.valTrainer ||
    schedule.valStaf ||
    (schedule as any).status === 'Terkonfirmasi' ||
    schedule.status === 'Reschedule'
  ) {
    return {
      category: 'confirmed' as const,
      label: 'Terkonfirmasi (Confirmed)',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      dotClass: 'bg-blue-400',
      cardClass: 'bg-blue-950/40 border-blue-500/40 text-blue-200 hover:bg-blue-900/50',
      chipClass: 'bg-blue-500/25 hover:bg-blue-500/35 text-blue-200 border border-blue-500/40',
      borderLeft: 'border-l-blue-500'
    };
  }
  return {
    category: 'pending' as const,
    label: 'Menunggu (Pending)',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dotClass: 'bg-amber-400',
    cardClass: 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:bg-amber-900/50',
    chipClass: 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40',
    borderLeft: 'border-l-amber-500'
  };
}

export const PTCalendarView: React.FC<PTCalendarViewProps> = ({
  schedules,
  trainers,
  members,
  onAddSchedule,
  onUpdateSchedule,
  onOpenSignature,
  showToast,
  onOpenAddModal
}) => {
  // View mode: month, week, day
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filter States
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<PTSessionFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected date for calendar navigation (default: APP_TODAY)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    try {
      const parts = APP_TODAY.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    } catch {}
    return new Date();
  });

  // Selected specific date for daily inspection
  const [selectedDayDate, setSelectedDayDate] = useState<string>(APP_TODAY);

  // Selected schedule for details modal
  const [inspectSchedule, setInspectSchedule] = useState<Schedule | null>(null);

  // Printing Modals State (Thermal & Standard Printers)
  const [isPrintScheduleModalOpen, setIsPrintScheduleModalOpen] = useState(false);
  const [slipTargetSchedule, setSlipTargetSchedule] = useState<Schedule | null>(null);

  // Helper date conversions
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Format month title
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  const monthYearLabel = `${monthNames[currentMonth]} ${currentYear}`;

  // Navigate functions
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
      setSelectedDayDate(formatDateToIso(d));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
      setSelectedDayDate(formatDateToIso(d));
    }
  };

  const handleToday = () => {
    try {
      const parts = APP_TODAY.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      setCurrentDate(d);
      setSelectedDayDate(APP_TODAY);
    } catch {
      setCurrentDate(new Date());
    }
  };

  function formatDateToIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Filtered schedules according to trainer, status, and search query
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      // 1. Trainer filter
      if (selectedTrainer !== 'all') {
        const matchesTrainerName = s.trainer === selectedTrainer;
        const matchesTrainerId = s.trainerId === selectedTrainer;
        if (!matchesTrainerName && !matchesTrainerId) return false;
      }

      // 2. Status filter
      if (selectedStatus !== 'all') {
        const info = getSessionStatusInfo(s);
        if (info.category !== selectedStatus) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMember = s.memberName.toLowerCase().includes(q);
        const matchesTrainer = s.trainer.toLowerCase().includes(q);
        const matchesNote = (s.note || '').toLowerCase().includes(q);
        if (!matchesMember && !matchesTrainer && !matchesNote) return false;
      }

      return true;
    });
  }, [schedules, selectedTrainer, selectedStatus, searchQuery]);

  // Overall Statistics for status badges
  const stats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let completed = 0;
    let cancelled = 0;

    // Filter by trainer if trainer selected
    const baseList = selectedTrainer === 'all'
      ? schedules
      : schedules.filter((s) => s.trainer === selectedTrainer || s.trainerId === selectedTrainer);

    baseList.forEach((s) => {
      const info = getSessionStatusInfo(s);
      if (info.category === 'completed') completed++;
      else if (info.category === 'confirmed') confirmed++;
      else if (info.category === 'pending') pending++;
      else if (info.category === 'cancelled') cancelled++;
    });

    const total = baseList.length;
    const todaySessions = baseList.filter((s) => s.date === APP_TODAY).length;

    return { total, confirmed, pending, completed, cancelled, todaySessions };
  }, [schedules, selectedTrainer]);

  // Generate Month Grid Days
  const monthGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Day of week: 0 = Sun, 1 = Mon ... We want Monday as index 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes index 6

    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayOfWeek: number;
    }[] = [];

    // Add padding from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = formatDateToIso(prevDate);
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === APP_TODAY,
        dayOfWeek: prevDate.getDay() === 0 ? 6 : prevDate.getDay() - 1
      });
    }

    // Add days of current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateStr = formatDateToIso(d);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === APP_TODAY,
        dayOfWeek: d.getDay() === 0 ? 6 : d.getDay() - 1
      });
    }

    // Add padding for next month to complete 35 or 42 cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const dateStr = formatDateToIso(nextDate);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === APP_TODAY,
        dayOfWeek: nextDate.getDay() === 0 ? 6 : nextDate.getDay() - 1
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Generate Week Days (Monday to Sunday around currentDate)
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(d);
    monday.setDate(diff);

    const days = [];
    const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const dateStr = formatDateToIso(current);
      days.push({
        label: dayLabels[i],
        dateStr,
        dayNumber: current.getDate(),
        isToday: dateStr === APP_TODAY
      });
    }

    return days;
  }, [currentDate]);

  // Hours array for time-grid (06:00 to 21:00)
  const hours = [
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00'
  ];

  // Selected Day Sessions (for agenda view and day breakdown)
  const selectedDaySessions = useMemo(() => {
    return filteredSchedules
      .filter((s) => s.date === selectedDayDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredSchedules, selectedDayDate]);

  // Interactive Quick Action: Mark session as Completed or Confirmed
  const handleToggleStatus = (schedule: Schedule, targetStatus: 'Selesai' | 'Menunggu') => {
    if (!onUpdateSchedule) return;
    const updated: Schedule = {
      ...schedule,
      status: targetStatus,
      sessionStatus: targetStatus === 'Selesai' ? 'COMPLETED' : 'BOOKED',
      valTrainer: targetStatus === 'Selesai' ? true : schedule.valTrainer,
      valStaf: targetStatus === 'Selesai' ? true : schedule.valStaf
    };
    onUpdateSchedule(updated);
    setInspectSchedule(updated);
    if (showToast) {
      showToast(
        'Status Sesi Diperbarui',
        `Sesi ${schedule.memberName} diubah menjadi "${targetStatus}".`,
        'success'
      );
    }
  };

  // Quick Action: Send WhatsApp reminder to member
  const handleSendWhatsAppReminder = (schedule: Schedule) => {
    const member = members.find((m) => m.id === schedule.memberId);
    const phone = member?.phone || '6281234567890';
    const cleanDigits = phone.replace(/\D/g, '');
    let intPhone = cleanDigits;
    if (cleanDigits.startsWith('0')) intPhone = '62' + cleanDigits.slice(1);
    else if (!cleanDigits.startsWith('62')) intPhone = '62' + cleanDigits;

    const message = encodeURIComponent(
      `Halo Kak *${schedule.memberName}*, ini pengingat sesi Personal Training RFA Gym bersama Coach *${schedule.trainer}*:\n\n` +
      `📅 *Tanggal:* ${formatDateIndo(schedule.date)}\n` +
      `⏰ *Waktu:* ${schedule.time} WIB\n` +
      `📌 *Status:* ${schedule.status}\n\n` +
      `Mohon hadir 10 menit sebelum sesi dimulai. Jangan lupa membawa botol minum & handuk olahraga. Salam bugar! 💪🏋️`
    );

    window.open(`https://wa.me/${intPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & SUMMARY STATS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Kalender Jadwal Personal Trainer
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Interactive Calendar View
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Visualisasikan seluruh jadwal sesi PT dengan kode warna status: 🔵 Terkonfirmasi (Confirmed), 🟡 Menunggu (Pending), dan 🟢 Selesai (Completed).
              </p>
            </div>
          </div>

          {/* Action Buttons: Cetak Jadwal & Buat Jadwal Baru */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setIsPrintScheduleModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 hover:border-orange-500/50 shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              title="Cetak agenda jadwal PT ke printer thermal (58mm/80mm) atau standar (A4/Letter)"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Cetak Jadwal PT</span>
            </button>

            {onOpenAddModal && (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Jadwal Sesi PT</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-zinc-800/90 border-zinc-600 shadow-md ring-1 ring-zinc-500'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Sesi</span>
              <Layers className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{stats.total}</div>
            <span className="text-[10px] text-zinc-500">{stats.todaySessions} sesi hari ini</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === 'confirmed' ? 'all' : 'confirmed')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              selectedStatus === 'confirmed'
                ? 'bg-blue-950/70 border-blue-500 shadow-md ring-1 ring-blue-500'
                : 'bg-blue-950/30 border-blue-500/30 hover:bg-blue-950/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Confirmed</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-300 mt-1">{stats.confirmed}</div>
            <span className="text-[10px] text-blue-400/80">Terkonfirmasi & Siap</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              selectedStatus === 'pending'
                ? 'bg-amber-950/70 border-amber-500 shadow-md ring-1 ring-amber-500'
                : 'bg-amber-950/30 border-amber-500/30 hover:bg-amber-950/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">{stats.pending}</div>
            <span className="text-[10px] text-amber-400/80">Menunggu Pelaksanaan</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === 'completed' ? 'all' : 'completed')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              selectedStatus === 'completed'
                ? 'bg-emerald-950/70 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                : 'bg-emerald-950/30 border-emerald-500/30 hover:bg-emerald-950/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">{stats.completed}</div>
            <span className="text-[10px] text-emerald-400/80">Selesai Berlangsung</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & TOOLBAR CONTROLS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Date Navigation & Mode Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs font-black text-white flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-orange-500" />
            <span>
              {viewMode === 'month'
                ? monthYearLabel
                : viewMode === 'week'
                ? `${weekDays[0].dateStr} s/d ${weekDays[6].dateStr}`
                : formatDateIndo(selectedDayDate)}
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-1">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                  viewMode === mode
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode === 'month' ? 'Bulan' : mode === 'week' ? 'Minggu' : 'Hari'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Trainer Filter & Search Box */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Trainer Filter Dropdown */}
          <div className="relative min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <User className="w-4 h-4 text-orange-400" />
            </div>
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-9 pr-8 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
            >
              <option value="all">Semua Trainer ({trainers.length})</option>
              {trainers.map((t) => {
                const count = schedules.filter((s) => s.trainer === t.name || s.trainerId === t.id).length;
                return (
                  <option key={t.id} value={t.name}>
                    {t.name} ({count} sesi)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Query */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari member, trainer, catatan..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Legend Pill Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-zinc-900/60 border border-zinc-800 px-4 py-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 text-zinc-400 font-semibold">
          <Info className="w-3.5 h-3.5 text-zinc-500" />
          <span>Indikator Warna Status:</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap text-xs">
          <span className="flex items-center gap-1.5 text-blue-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span>Confirmed (Terkonfirmasi)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span>Pending (Menunggu)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Completed (Selesai)</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span>Cancelled (Batal)</span>
          </span>
        </div>
      </div>

      {/* 3. CALENDAR CONTENT VIEWS */}

      {/* VIEW A: MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-950 text-center">
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d) => (
              <div key={d} className="py-3 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                {d}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-800/80 bg-zinc-950/20">
            {monthGridDays.map((day) => {
              const daySessions = filteredSchedules.filter((s) => s.date === day.dateStr);
              const isSelectedDay = selectedDayDate === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDayDate(day.dateStr)}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    day.isCurrentMonth ? 'bg-zinc-900/60' : 'bg-zinc-950/80 opacity-40'
                  } ${day.isToday ? 'ring-1 ring-inset ring-orange-500/60' : ''} ${
                    isSelectedDay ? 'bg-zinc-800/80 ring-2 ring-orange-500 z-10' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                        day.isToday
                          ? 'bg-orange-500 text-white font-black'
                          : day.isCurrentMonth
                          ? 'text-zinc-200'
                          : 'text-zinc-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {daySessions.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950/80 px-1.5 py-0.5 rounded-md border border-zinc-800">
                        {daySessions.length} sesi
                      </span>
                    )}
                  </div>

                  {/* Sessions Chips */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {daySessions.slice(0, 3).map((session) => {
                      const info = getSessionStatusInfo(session);
                      return (
                        <div
                          key={session.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectSchedule(session);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition truncate flex items-center justify-between gap-1 shadow-xs border ${info.chipClass} cursor-pointer active:scale-95`}
                          title={`${session.time} WIB - ${session.memberName} (${session.trainer}) - Status: ${session.status}`}
                        >
                          <span className="truncate flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${info.dotClass} shrink-0`} />
                            <span className="font-mono text-[9px]">{session.time}</span>
                            <span className="truncate">{session.memberName}</span>
                          </span>
                          <span className="text-[9px] opacity-75 font-normal shrink-0 truncate max-w-[50px]">
                            {session.trainer.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}

                    {daySessions.length > 3 && (
                      <div className="text-[10px] text-zinc-400 font-bold px-1 hover:text-white transition">
                        +{daySessions.length - 3} sesi lainnya...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW B: WEEK TIME-GRID VIEW */}
      {viewMode === 'week' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 max-h-[640px] overflow-y-auto">
            <div className="min-w-[950px]">
              {/* Header row: Days of week */}
              <div className="grid grid-cols-8 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20">
                <div className="p-3 text-center text-[10px] font-bold text-zinc-500 uppercase border-r border-zinc-800">
                  Waktu
                </div>
                {weekDays.map((d) => (
                  <div
                    key={d.dateStr}
                    onClick={() => setSelectedDayDate(d.dateStr)}
                    className={`p-3 text-center border-r border-zinc-800 transition cursor-pointer ${
                      d.isToday
                        ? 'bg-orange-500/15 text-orange-400 font-bold'
                        : selectedDayDate === d.dateStr
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <p className="text-xs font-bold">{d.label}</p>
                    <p className="text-[10px] mt-0.5">{d.dateStr.substring(5)}</p>
                  </div>
                ))}
              </div>

              {/* Time rows (06:00 to 21:00) */}
              {hours.map((hour) => {
                const hourPrefix = hour.substring(0, 2);
                return (
                  <div key={hour} className="grid grid-cols-8 border-b border-zinc-800/60 min-h-[58px] hover:bg-zinc-800/20">
                    <div className="p-2 text-center text-[11px] font-mono font-bold text-zinc-500 border-r border-zinc-800 bg-zinc-950/60 flex items-center justify-center">
                      {hour}
                    </div>

                    {weekDays.map((d) => {
                      const slotSessions = filteredSchedules.filter(
                        (s) => s.date === d.dateStr && s.time.startsWith(hourPrefix)
                      );

                      return (
                        <div
                          key={d.dateStr}
                          onClick={() => setSelectedDayDate(d.dateStr)}
                          className="p-1 border-r border-zinc-800/60 space-y-1"
                        >
                          {slotSessions.map((session) => {
                            const info = getSessionStatusInfo(session);
                            return (
                              <div
                                key={session.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectSchedule(session);
                                }}
                                className={`p-1.5 rounded-xl border text-[10px] font-bold shadow-xs transition cursor-pointer ${info.chipClass} active:scale-95`}
                                title={`${session.time} WIB - ${session.memberName} (PT: ${session.trainer})`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono text-[9px]">{session.time}</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${info.dotClass}`} />
                                </div>
                                <p className="truncate text-white font-bold mt-0.5">{session.memberName}</p>
                                <p className="text-[9px] opacity-80 truncate font-normal">PT: {session.trainer}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: DAY / AGENDA VIEW */}
      {viewMode === 'day' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white">
                Agenda Sesi PT: {formatDateIndo(selectedDayDate)}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Menampilkan {selectedDaySessions.length} sesi personal trainer untuk tanggal ini.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDayDate}
                onChange={(e) => setSelectedDayDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {selectedDaySessions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-2">
              <CalendarIcon className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-bold text-zinc-400">Tidak ada jadwal sesi PT untuk tanggal ini.</p>
              <p className="text-xs text-zinc-500">Pilih tanggal lain atau klik "Buat Jadwal Sesi PT" di atas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDaySessions.map((session) => {
                const info = getSessionStatusInfo(session);
                const member = members.find((m) => m.id === session.memberId);

                return (
                  <div
                    key={session.id}
                    onClick={() => setInspectSchedule(session)}
                    className={`p-4 rounded-2xl border ${info.cardClass} transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center font-mono shrink-0">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 mb-0.5" />
                        <span className="text-xs font-bold text-white">{session.time}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{session.memberName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${info.badgeClass}`}>
                            {info.label}
                          </span>
                          {member?.ptQuota !== undefined && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              (Sisa Kuota: {member.ptQuota} sesi)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <User className="w-3.5 h-3.5 text-orange-400" />
                            <span>Trainer: {session.trainer}</span>
                          </span>
                          {session.note && (
                            <span className="truncate max-w-xs text-zinc-400">• {session.note}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Signature badges & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-lg border ${
                            session.valTrainer
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          TTD PT
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg border ${
                            session.valStaf
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          TTD Staf
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg border ${
                            session.valMember
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          TTD Member
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectSchedule(session);
                        }}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Lihat Detail & Tindakan"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. SELECTED DAY AGENDA DRAWER (Under Month View for quick context) */}
      {viewMode === 'month' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <h3 className="text-sm sm:text-base font-black text-white">
                Rincian Sesi PT Tanggal: {formatDateIndo(selectedDayDate)}
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-bold">
              {selectedDaySessions.length} Sesi Terjadwal
            </span>
          </div>

          {selectedDaySessions.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              Tidak ada sesi PT pada tanggal {formatDateIndo(selectedDayDate)}. Klik tanggal lain di kalender atas untuk melihat rincian.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
              {selectedDaySessions.map((session) => {
                const info = getSessionStatusInfo(session);
                return (
                  <div
                    key={session.id}
                    onClick={() => setInspectSchedule(session)}
                    className={`p-3.5 rounded-2xl border ${info.cardClass} transition cursor-pointer flex flex-col justify-between space-y-2`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-bold text-white">{session.time} WIB</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${info.badgeClass}`}>
                          {info.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{session.memberName}</h4>
                      <p className="text-xs text-zinc-400">Coach: {session.trainer}</p>
                      {session.note && (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 italic">"{session.note}"</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500">Klik untuk kelola & TTD</span>
                      <span className="text-orange-400 font-bold flex items-center gap-1">
                        Detail <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. SESSION DETAIL & QUICK ACTION MODAL */}
      {inspectSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-5 p-6 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      getSessionStatusInfo(inspectSchedule).badgeClass
                    }`}
                  >
                    {getSessionStatusInfo(inspectSchedule).label}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">ID: {inspectSchedule.id}</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1.5">{inspectSchedule.memberName}</h3>
                <p className="text-xs text-zinc-400">Personal Trainer: {inspectSchedule.trainer}</p>
              </div>

              <button
                type="button"
                onClick={() => setInspectSchedule(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Info Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px] font-bold uppercase">Tanggal Sesi</span>
                <span className="font-bold text-white">{formatDateIndo(inspectSchedule.date)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-bold uppercase">Waktu / Slot</span>
                <span className="font-bold text-white">{inspectSchedule.time} WIB</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-zinc-800">
                <span className="text-zinc-500 block text-[10px] font-bold uppercase">Catatan / Target</span>
                <span className="text-zinc-300 italic">{inspectSchedule.note || 'Tidak ada catatan latihan khusus.'}</span>
              </div>
            </div>

            {/* 3-Way Digital Signature Status */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Validasi Tanda Tangan Digital (3 Pihak)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`p-2.5 rounded-xl border text-center ${
                    inspectSchedule.valTrainer
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <p className="text-[10px] font-bold">Trainer</p>
                  <p className="text-xs font-black mt-0.5">
                    {inspectSchedule.valTrainer ? '✓ Tervalidasi' : 'Belum'}
                  </p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border text-center ${
                    inspectSchedule.valStaf
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <p className="text-[10px] font-bold">Staf Kasir</p>
                  <p className="text-xs font-black mt-0.5">
                    {inspectSchedule.valStaf ? '✓ Tervalidasi' : 'Belum'}
                  </p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border text-center ${
                    inspectSchedule.valMember
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <p className="text-[10px] font-bold">Member</p>
                  <p className="text-xs font-black mt-0.5">
                    {inspectSchedule.valMember ? '✓ Tervalidasi' : 'Belum'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              {/* Primary Actions: Print Slip & WA Reminder */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSlipTargetSchedule(inspectSchedule)}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-orange-500/20"
                  title="Cetak slip sesi PT ke printer thermal atau voucher A4"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Slip Sesi PT</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReminder(inspectSchedule)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim WA Pengingat</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {onOpenSignature && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSignature(inspectSchedule.id, 'valTrainer');
                      setInspectSchedule(null);
                    }}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-zinc-700"
                  >
                    <span>Buka Tanda Tangan Digital</span>
                  </button>
                )}
              </div>

              {onUpdateSchedule && (
                <div className="flex items-center gap-2">
                  {inspectSchedule.status !== 'Selesai' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(inspectSchedule, 'Selesai')}
                      className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-emerald-950 hover:text-emerald-300 text-zinc-300 font-bold text-xs border border-zinc-700 hover:border-emerald-500/40 transition cursor-pointer"
                    >
                      ✓ Tandai Selesai (Completed)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(inspectSchedule, 'Menunggu')}
                      className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-amber-950 hover:text-amber-300 text-zinc-300 font-bold text-xs border border-zinc-700 hover:border-amber-500/40 transition cursor-pointer"
                    >
                      Kembalikan ke Pending
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL PRINT MODALS: THERMAL & STANDARD PRINTERS */}
      <PTSchedulePrintModal
        isOpen={isPrintScheduleModalOpen}
        onClose={() => setIsPrintScheduleModalOpen(false)}
        schedules={filteredSchedules}
        trainers={trainers}
        currentTrainerFilter={selectedTrainer}
        currentPeriodLabel={
          viewMode === 'month'
            ? monthYearLabel
            : viewMode === 'week'
            ? `${weekDays[0].dateStr} s/d ${weekDays[6].dateStr}`
            : formatDateIndo(selectedDayDate)
        }
      />

      <PTSessionSlipModal
        isOpen={Boolean(slipTargetSchedule)}
        onClose={() => setSlipTargetSchedule(null)}
        schedule={slipTargetSchedule}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Search,
  Filter,
  Plus,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  User,
  Activity,
  MapPin,
  Check,
  X,
  Timer,
  ShieldCheck,
  CalendarDays,
  Flame,
  Info
} from 'lucide-react';
import { TrainerAttendanceLog, Schedule, Member, User as UserType } from '../types';
import { formatRp, formatDateIndo, APP_TODAY, getTimestamp } from '../utils/formatters';

interface TrainerAttendanceLogViewProps {
  attendanceList: TrainerAttendanceLog[];
  onUpdateAttendanceList: (newList: TrainerAttendanceLog[]) => void;
  activeTrainer: UserType;
  schedules: Schedule[];
  members: Member[];
  onUpdateSchedule?: (updatedSchedule: Schedule) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const TRAINING_ZONES = [
  'Zona Free Weight',
  'Studio PT Private',
  'Functional Area',
  'Cardio Deck',
  'Resistance Machines'
];

const COMMON_FOCUS_AREAS = [
  'Chest & Triceps Hypertrophy',
  'Back & Biceps Pull Day',
  'Leg Day & Core Strength',
  'Shoulder & Arm Isolation',
  'HIIT Conditioning & Fat Burn',
  'Posture Alignment & Back Rehab',
  'Full Body Conditioning',
  'Glute & Hamstring Focus'
];

export const TrainerAttendanceLogView: React.FC<TrainerAttendanceLogViewProps> = ({
  attendanceList,
  onUpdateAttendanceList,
  activeTrainer,
  schedules,
  members,
  onUpdateSchedule,
  showToast
}) => {
  // Active trainer details
  const trainerId = activeTrainer?.id || 'S04';
  const trainerName = activeTrainer?.name || 'Reza Pratama';

  // Date controls: default to current mock app month (September 2026)
  const defaultYear = parseInt(APP_TODAY.split('-')[0], 10) || 2026;
  const defaultMonth = parseInt(APP_TODAY.split('-')[1], 10) - 1 || 8; // 8 = September (0-indexed)

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);

  // View Mode: Table or Calendar
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Selesai' | 'Checked In' | 'Tepat Waktu' | 'Terlambat'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [selectedDateInCalendar, setSelectedDateInCalendar] = useState<string | null>(null);

  // Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [activeSessionToCheckOut, setActiveSessionToCheckOut] = useState<TrainerAttendanceLog | null>(null);
  const [selectedLogDetail, setSelectedLogDetail] = useState<TrainerAttendanceLog | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Check-In Form State
  const [checkInMode, setCheckInMode] = useState<'schedule' | 'manual'>('schedule');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [manualMemberId, setManualMemberId] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(APP_TODAY);
  const [checkInTime, setCheckInTime] = useState<string>('09:00');
  const [checkInZone, setCheckInZone] = useState<string>('Zona Free Weight');
  const [checkInFocus, setCheckInFocus] = useState<string>('Chest & Triceps Hypertrophy');
  const [checkInNotes, setCheckInNotes] = useState<string>('');

  // Check-Out Form State
  const [checkOutTime, setCheckOutTime] = useState<string>('10:15');
  const [checkOutRPE, setCheckOutRPE] = useState<number>(8);
  const [checkOutNotes, setCheckOutNotes] = useState<string>('');
  const [isMemberConfirmed, setIsMemberConfirmed] = useState<boolean>(true);

  // Filter attendance list for active trainer only
  const trainerAllLogs = useMemo(() => {
    return attendanceList.filter(
      (log) => log.trainerId === trainerId || log.trainerName === trainerName
    );
  }, [attendanceList, trainerId, trainerName]);

  // Find currently active session (Checked In but not yet Checked Out)
  const activeCurrentSession = useMemo(() => {
    return trainerAllLogs.find((log) => log.status === 'Checked In');
  }, [trainerAllLogs]);

  // Filter logs for selected month and year
  const monthlyLogs = useMemo(() => {
    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const prefix = `${selectedYear}-${monthStr}`;
    return trainerAllLogs.filter((log) => log.date.startsWith(prefix));
  }, [trainerAllLogs, selectedYear, selectedMonth]);

  // Filtered logs based on search, status, and zone
  const filteredMonthlyLogs = useMemo(() => {
    return monthlyLogs.filter((log) => {
      // Date filter from calendar click
      if (selectedDateInCalendar && log.date !== selectedDateInCalendar) {
        return false;
      }
      // Status filter
      if (statusFilter === 'Selesai' && log.status !== 'Selesai') return false;
      if (statusFilter === 'Checked In' && log.status !== 'Checked In') return false;
      if (statusFilter === 'Tepat Waktu' && log.punctuality !== 'Tepat Waktu' && log.punctuality !== 'Lebih Awal') return false;
      if (statusFilter === 'Terlambat' && log.punctuality !== 'Terlambat') return false;

      // Zone filter
      if (zoneFilter !== 'all' && log.roomOrArea !== zoneFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = log.memberName.toLowerCase().includes(q);
        const matchId = log.memberId.toLowerCase().includes(q);
        const matchFocus = log.trainingFocus.toLowerCase().includes(q);
        const matchNotes = (log.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchFocus && !matchNotes) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort newest date and time first
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      return (b.checkInTime || '').localeCompare(a.checkInTime || '');
    });
  }, [monthlyLogs, selectedDateInCalendar, statusFilter, zoneFilter, searchQuery]);

  // Today's schedules for this trainer that are still waiting or today
  const todayTrainerSchedules = useMemo(() => {
    return schedules.filter(
      (s) => (s.trainer === trainerName || s.trainer === activeTrainer?.name) && s.date === APP_TODAY
    );
  }, [schedules, trainerName, activeTrainer]);

  // Monthly KPIs & Statistics
  const monthlyStats = useMemo(() => {
    const totalSessions = monthlyLogs.filter((l) => l.status === 'Selesai').length;
    const totalActive = monthlyLogs.filter((l) => l.status === 'Checked In').length;

    const totalMinutes = monthlyLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const onTimeCount = monthlyLogs.filter(
      (l) => l.punctuality === 'Tepat Waktu' || l.punctuality === 'Lebih Awal'
    ).length;
    const punctualityRate = totalSessions > 0 ? Math.round((onTimeCount / totalSessions) * 100) : 100;

    const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    const totalEarnings = monthlyLogs.reduce((acc, curr) => acc + (curr.sessionFee || 50000), 0);

    return {
      totalSessions,
      totalActive,
      totalHours,
      remainingMinutes,
      punctualityRate,
      avgMinutes,
      totalEarnings
    };
  }, [monthlyLogs]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    setSelectedDateInCalendar(null);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setSelectedDateInCalendar(null);
  };

  const handleResetToCurrentMonth = () => {
    setSelectedYear(defaultYear);
    setSelectedMonth(defaultMonth);
    setSelectedDateInCalendar(null);
  };

  // Open Check-In Modal with presets
  const handleOpenCheckIn = (prefSchedule?: Schedule) => {
    setCheckInDate(APP_TODAY);
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setCheckInTime(timeStr || '09:00');

    if (prefSchedule) {
      setCheckInMode('schedule');
      setSelectedScheduleId(prefSchedule.id);
      setCheckInFocus(prefSchedule.note || 'Chest & Triceps Hypertrophy');
    } else if (todayTrainerSchedules.length > 0) {
      setCheckInMode('schedule');
      setSelectedScheduleId(todayTrainerSchedules[0].id);
      setCheckInFocus(todayTrainerSchedules[0].note || 'Chest & Triceps Hypertrophy');
    } else {
      setCheckInMode('manual');
      if (members.length > 0) {
        setManualMemberId(members[0].id);
      }
    }
    setIsCheckInModalOpen(true);
  };

  // Submit Check-In
  const handleConfirmCheckIn = (e: React.FormEvent) => {
    e.preventDefault();

    let targetMemberId = '';
    let targetMemberName = '';
    let linkedScheduleId: string | undefined = undefined;
    let scheduledTimeStr = checkInTime;

    if (checkInMode === 'schedule') {
      const sch = todayTrainerSchedules.find((s) => s.id === selectedScheduleId);
      if (!sch) {
        showToast('Jadwal Tidak Ditemukan', 'Silakan pilih jadwal yang valid atau gunakan mode mandiri.', 'warning');
        return;
      }
      targetMemberId = sch.memberId;
      targetMemberName = sch.memberName;
      linkedScheduleId = sch.id;
      scheduledTimeStr = sch.time;
    } else {
      const mem = members.find((m) => m.id === manualMemberId);
      if (!mem) {
        showToast('Pilih Member', 'Silakan pilih member yang akan dilatih.', 'warning');
        return;
      }
      targetMemberId = mem.id;
      targetMemberName = mem.name;
    }

    // Determine punctuality
    let punctuality: 'Tepat Waktu' | 'Terlambat' | 'Lebih Awal' = 'Tepat Waktu';
    try {
      const [inH, inM] = checkInTime.split(':').map(Number);
      const [schH, schM] = scheduledTimeStr.split(':').map(Number);
      const diffMin = (inH * 60 + inM) - (schH * 60 + schM);
      if (diffMin > 10) punctuality = 'Terlambat';
      else if (diffMin < -5) punctuality = 'Lebih Awal';
      else punctuality = 'Tepat Waktu';
    } catch {
      punctuality = 'Tepat Waktu';
    }

    const newLog: TrainerAttendanceLog = {
      id: `TAL-${checkInDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      trainerId,
      trainerName,
      scheduleId: linkedScheduleId,
      memberId: targetMemberId,
      memberName: targetMemberName,
      date: checkInDate,
      scheduledTime: scheduledTimeStr,
      checkInTime,
      status: 'Checked In',
      punctuality,
      trainingFocus: checkInFocus,
      roomOrArea: checkInZone,
      notes: checkInNotes.trim(),
      valTrainer: true,
      valMember: false,
      sessionFee: 50000
    };

    onUpdateAttendanceList([newLog, ...attendanceList]);

    // If linked to a schedule, update its status or valTrainer
    if (linkedScheduleId && onUpdateSchedule) {
      const sch = schedules.find((s) => s.id === linkedScheduleId);
      if (sch) {
        onUpdateSchedule({
          ...sch,
          valTrainer: true,
          note: sch.note || checkInFocus
        });
      }
    }

    showToast(
      'Check-In Berhasil!',
      `Sesi latihan bersama ${targetMemberName} telah dimulai pada ${checkInTime} WIB.`,
      'success'
    );

    setIsCheckInModalOpen(false);
    setCheckInNotes('');
  };

  // Open Check-Out Modal
  const handleOpenCheckOut = (session: TrainerAttendanceLog) => {
    setActiveSessionToCheckOut(session);

    // Auto calculate tentative checkout time (approx 60-75 mins from check-in or current time)
    const now = new Date();
    const currentClock = now.toTimeString().slice(0, 5);
    setCheckOutTime(currentClock || '10:15');
    setCheckOutRPE(8);
    setCheckOutNotes(session.notes || '');
    setIsMemberConfirmed(true);
    setIsCheckOutModalOpen(true);
  };

  // Submit Check-Out
  const handleConfirmCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionToCheckOut) return;

    // Calculate duration in minutes
    let durationMinutes = 60;
    try {
      const [inH, inM] = activeSessionToCheckOut.checkInTime.split(':').map(Number);
      const [outH, outM] = checkOutTime.split(':').map(Number);
      let diff = (outH * 60 + outM) - (inH * 60 + inM);
      if (diff <= 0) diff += 24 * 60; // handle overnight edge case
      durationMinutes = Math.max(15, diff);
    } catch {
      durationMinutes = 60;
    }

    const updatedList = attendanceList.map((log) => {
      if (log.id === activeSessionToCheckOut.id) {
        return {
          ...log,
          checkOutTime,
          durationMinutes,
          status: 'Selesai' as const,
          intensityRPE: checkOutRPE,
          notes: checkOutNotes.trim() || log.notes,
          valMember: isMemberConfirmed,
          valTrainer: true
        };
      }
      return log;
    });

    onUpdateAttendanceList(updatedList);

    // Update schedule to 'Selesai' if linked
    if (activeSessionToCheckOut.scheduleId && onUpdateSchedule) {
      const sch = schedules.find((s) => s.id === activeSessionToCheckOut.scheduleId);
      if (sch) {
        onUpdateSchedule({
          ...sch,
          status: 'Selesai',
          valTrainer: true,
          valMember: isMemberConfirmed
        });
      }
    }

    showToast(
      'Check-Out Selesai!',
      `Sesi latihan bersama ${activeSessionToCheckOut.memberName} tuntas. Total durasi: ${durationMinutes} Menit.`,
      'success'
    );

    setIsCheckOutModalOpen(false);
    setActiveSessionToCheckOut(null);
  };

  // Helper for Calendar Grid Generation
  const calendarDays = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    // Convert to Monday-start (0 = Mon, ..., 6 = Sun)
    const startOffset = (firstDayIndex + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      sessionCount: number;
      totalMinutes: number;
    }> = [];

    // Empty lead cells
    for (let i = 0; i < startOffset; i++) {
      days.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        isToday: false,
        sessionCount: 0,
        totalMinutes: 0
      });
    }

    // Actual month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = String(d).padStart(2, '0');
      const mStr = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;

      const dayLogs = monthlyLogs.filter((l) => l.date === dateStr);
      const sessionCount = dayLogs.length;
      const totalMinutes = dayLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === APP_TODAY,
        sessionCount,
        totalMinutes
      });
    }

    return days;
  }, [selectedYear, selectedMonth, monthlyLogs]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER & ACTIVE SESSION HIGHLIGHT                                      */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Portal Pelatih
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-zinc-400 text-xs flex items-center gap-1 font-semibold">
                <Timer className="w-3.5 h-3.5 text-orange-400" />
                Sistem Presensi & Log Jam Mengajar
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Trainer Attendance Log</span>
              <span className="text-sm font-bold text-orange-400 font-mono">
                ({MONTH_NAMES[selectedMonth]} {selectedYear})
              </span>
            </h2>

            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Pencatatan waktu check-in dan check-out mandiri untuk setiap sesi latihan klien, validasi jam melatih,
              serta pemantauan riwayat kehadiran dan estimasi insentif bulanan.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
              title="Cetak Rekapitulasi Presensi Bulanan"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              <span>Cetak Rekap Bulanan</span>
            </button>

            <button
              onClick={() => handleOpenCheckIn()}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Check-In Sesi Latihan</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ACTIVE SESSION PULSING BANNER (IF CURRENTLY CHECKED IN)                   */}
        {/* ========================================================================= */}
        {activeCurrentSession && (
          <div className="mt-5 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/40 relative overflow-hidden animate-pulse-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-zinc-950 flex items-center justify-center font-black shrink-0 shadow-md">
                  <Flame className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500 text-zinc-950">
                      Sesi Sedang Berlangsung
                    </span>
                    <span className="text-xs font-bold text-orange-400">
                      Check-In: {activeCurrentSession.checkInTime} WIB
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mt-0.5">
                    {activeCurrentSession.memberName}
                    <span className="text-xs font-semibold text-zinc-400 font-mono ml-2">
                      ({activeCurrentSession.memberId})
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-300 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>{activeCurrentSession.roomOrArea}</span>
                    <span className="text-zinc-600">•</span>
                    <span>🎯 {activeCurrentSession.trainingFocus}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleOpenCheckOut(activeCurrentSession)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Selesaikan & Check-Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MONTH SELECTOR & SUMMARY KPI CARDS                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl">
        {/* Month Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setSelectedDateInCalendar(null);
              }}
              className="bg-zinc-950 border border-zinc-700 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-orange-500 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setSelectedDateInCalendar(null);
              }}
              className="bg-zinc-950 border border-zinc-700 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {(selectedMonth !== defaultMonth || selectedYear !== defaultYear) && (
            <button
              onClick={handleResetToCurrentMonth}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline ml-2"
            >
              Bulan Ini ({MONTH_NAMES[defaultMonth]})
            </button>
          )}
        </div>

        {/* View Mode Toggle: Table or Calendar */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-orange-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tabel Rinci</span>
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-orange-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Kalender Bulanan</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Sesi Hadir */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Sesi Hadir</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{monthlyStats.totalSessions}</span>
            <span className="text-xs text-zinc-400 font-semibold">Sesi Tuntas</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            {monthlyStats.totalActive > 0 ? `${monthlyStats.totalActive} sesi sedang aktif` : 'Semua sesi tercatat valid'}
          </p>
        </div>

        {/* 2. Total Jam Melatih */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Jam Melatih</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{monthlyStats.totalHours}</span>
            <span className="text-xs text-zinc-300 font-bold">Jam</span>
            <span className="text-lg font-black text-zinc-400">{monthlyStats.remainingMinutes}</span>
            <span className="text-[10px] text-zinc-400 font-semibold">Mnt</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Rata-rata {monthlyStats.avgMinutes} menit per sesi
          </p>
        </div>

        {/* 3. Tingkat Ketepatan Waktu */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Ketepatan Waktu</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {monthlyStats.punctualityRate}%
            </span>
            <span className="text-xs text-zinc-400 font-semibold">On-Time</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${monthlyStats.punctualityRate}%` }}
            />
          </div>
        </div>

        {/* 4. Estimasi Insentif Presensi */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Estimasi Fee Sesi</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl sm:text-2xl font-black text-white">
              {formatRp(monthlyStats.totalEarnings)}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Rp 50.000 / sesi kehadiran valid
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT: TABLE OR CALENDAR VIEW                                   */}
      {/* ========================================================================= */}
      {viewMode === 'calendar' ? (
        /* CALENDAR VIEW */
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span>Kalender Kehadiran: {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Klik tanggal untuk melihat rincian sesi latihan yang diselesaikan pada hari tersebut.
              </p>
            </div>

            {selectedDateInCalendar && (
              <button
                onClick={() => setSelectedDateInCalendar(null)}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 self-start sm:self-auto bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tampilkan Semua Hari ({MONTH_NAMES[selectedMonth]})</span>
              </button>
            )}
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span className="text-orange-400">Sab</span>
            <span className="text-rose-400">Min</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={idx}
                    className="min-h-[72px] sm:min-h-[90px] rounded-xl bg-zinc-950/30 border border-zinc-900/40 p-2 opacity-30"
                  />
                );
              }

              const isSelected = selectedDateInCalendar === cell.dateStr;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (cell.sessionCount > 0) {
                      setSelectedDateInCalendar(cell.dateStr === selectedDateInCalendar ? null : cell.dateStr);
                    }
                  }}
                  className={`min-h-[72px] sm:min-h-[90px] rounded-2xl p-2 text-left transition flex flex-col justify-between relative ${
                    cell.isToday
                      ? 'border-2 border-orange-500 bg-orange-500/5'
                      : isSelected
                      ? 'border-2 border-cyan-400 bg-cyan-500/10'
                      : cell.sessionCount > 0
                      ? 'bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                      : 'bg-zinc-950/40 border border-zinc-900 hover:bg-zinc-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        cell.isToday
                          ? 'text-orange-400'
                          : isSelected
                          ? 'text-cyan-400'
                          : 'text-zinc-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Hari Ini" />
                    )}
                  </div>

                  {cell.sessionCount > 0 ? (
                    <div className="space-y-1 mt-1">
                      <span className="block px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-black leading-none truncate">
                        {cell.sessionCount} Sesi
                      </span>
                      <span className="block text-[9px] text-zinc-400 font-semibold truncate">
                        {Math.round(cell.totalMinutes / 60 * 10) / 10} Jam
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-zinc-600 block mt-auto">-</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateInCalendar && (
            <div className="mt-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                <span>
                  Sesi Latihan pada: <strong className="text-orange-400">{formatDateIndo(selectedDateInCalendar)}</strong>
                </span>
                <span className="text-zinc-400 text-[11px]">
                  {filteredMonthlyLogs.length} Sesi
                </span>
              </h4>
            </div>
          )}
        </div>
      ) : null}

      {/* DETAILED TABLE VIEW */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama member, ID, atau fokus..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-white placeholder-zinc-500 outline-none focus:border-orange-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 font-bold outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="Selesai">Selesai (Checked Out)</option>
              <option value="Checked In">Sedang Aktif (Checked In)</option>
              <option value="Tepat Waktu">Tepat Waktu / Lebih Awal</option>
              <option value="Terlambat">Terlambat</option>
            </select>

            {/* Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 font-bold outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">Semua Zona Latihan</option>
              {TRAINING_ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div className="text-zinc-400 font-semibold text-right">
            Menampilkan <strong className="text-white">{filteredMonthlyLogs.length}</strong> dari {monthlyLogs.length} rekaman presensi
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 rounded-2xl border border-zinc-800/80">
          <table className="w-full text-left whitespace-nowrap min-w-[760px]">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Klien / Member</th>
                <th className="py-3 px-4">Zona & Fokus Latihan</th>
                <th className="py-3 px-4 text-center">Durasi</th>
                <th className="py-3 px-4 text-center">Status Kehadiran</th>
                <th className="py-3 px-4 text-center">Paraf</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40 text-xs">
              {filteredMonthlyLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">Belum ada riwayat kehadiran sesi latihan pada filter ini.</p>
                    <button
                      onClick={() => handleOpenCheckIn()}
                      className="mt-3 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Check-In Sesi Sekarang
                    </button>
                  </td>
                </tr>
              ) : (
                filteredMonthlyLogs.map((log) => {
                  const isCheckedIn = log.status === 'Checked In';

                  return (
                    <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                      {/* Tanggal & Waktu */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{formatDateIndo(log.date)}</span>
                          {log.date === APP_TODAY && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-400" />
                          <span>{log.checkInTime} WIB</span>
                          <span>→</span>
                          <span>{log.checkOutTime ? `${log.checkOutTime} WIB` : 'Sedang Berjalan'}</span>
                        </div>
                      </td>

                      {/* Member */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-orange-400 shrink-0">
                            {log.memberName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{log.memberName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{log.memberId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Zona & Fokus */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-200 block text-xs">
                          {log.trainingFocus}
                        </span>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-orange-400" />
                          {log.roomOrArea}
                        </span>
                      </td>

                      {/* Durasi */}
                      <td className="py-3 px-4 text-center">
                        {log.durationMinutes ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-zinc-800 text-white font-mono border border-zinc-700">
                            {log.durationMinutes} mnt
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 animate-pulse">
                            Aktif...
                          </span>
                        )}
                      </td>

                      {/* Status Kehadiran */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isCheckedIn ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500 text-zinc-950 shadow-sm animate-pulse">
                              Sedang Latihan
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Selesai
                            </span>
                          )}

                          <span
                            className={`text-[9px] font-bold ${
                              log.punctuality === 'Terlambat'
                                ? 'text-rose-400'
                                : log.punctuality === 'Lebih Awal'
                                ? 'text-cyan-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            {log.punctuality}
                          </span>
                        </div>
                      </td>

                      {/* Paraf */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              log.valTrainer
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                            title="Paraf Pelatih PT"
                          >
                            PT
                          </span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              log.valMember
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                            title="Paraf Member"
                          >
                            M
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isCheckedIn ? (
                            <button
                              onClick={() => handleOpenCheckOut(log)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition shadow-sm flex items-center gap-1"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Check-Out</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedLogDetail(log)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1 border border-zinc-700"
                            >
                              <FileText className="w-3.5 h-3.5 text-orange-400" />
                              <span>Detail</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: CHECK-IN SESI LATIHAN                                           */}
      {/* ========================================================================= */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Check-In Sesi Latihan Baru</h3>
                  <p className="text-xs text-zinc-400">Trainer: <strong className="text-orange-400">{trainerName}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckInModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckIn} className="space-y-4 pt-4">
              {/* Mode Selection */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Sumber Sesi Latihan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckInMode('schedule')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      checkInMode === 'schedule'
                        ? 'bg-orange-500 text-zinc-950 shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Dari Jadwal Hari Ini ({todayTrainerSchedules.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckInMode('manual')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      checkInMode === 'manual'
                        ? 'bg-orange-500 text-zinc-950 shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sesi Mandiri / Tambahan</span>
                  </button>
                </div>
              </div>

              {/* Schedule or Member Select */}
              {checkInMode === 'schedule' ? (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Pilih Jadwal Sesi Hari Ini
                  </label>
                  {todayTrainerSchedules.length === 0 ? (
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-amber-400">
                      Tidak ada jadwal sesi yang terdaftar untuk hari ini. Silakan gunakan opsi 'Sesi Mandiri / Tambahan' untuk check-in.
                    </div>
                  ) : (
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => {
                        setSelectedScheduleId(e.target.value);
                        const s = todayTrainerSchedules.find((item) => item.id === e.target.value);
                        if (s) {
                          setCheckInFocus(s.note || 'Chest & Triceps Hypertrophy');
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    >
                      {todayTrainerSchedules.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.time} WIB - {s.memberName} ({s.memberId}) • {s.note || 'Sesi PT'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Pilih Klien / Member
                  </label>
                  <select
                    value={manualMemberId}
                    onChange={(e) => setManualMemberId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) - Kuota PT: {m.ptQuota} Sesi
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tanggal & Jam Check-In */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tanggal Check-In
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Jam Check-In (WIB)
                  </label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Zona & Ruangan */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Zona / Area Latihan Gym
                </label>
                <select
                  value={checkInZone}
                  onChange={(e) => setCheckInZone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  {TRAINING_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fokus Latihan */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Fokus Program Sesi Ini
                </label>
                <input
                  type="text"
                  value={checkInFocus}
                  onChange={(e) => setCheckInFocus(e.target.value)}
                  placeholder="Cth: Chest & Triceps Hypertrophy"
                  required
                  list="focus-options"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
                <datalist id="focus-options">
                  {COMMON_FOCUS_AREAS.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              {/* Catatan Sesi */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Catatan Awal / Target Latihan (Opsional)
                </label>
                <textarea
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  placeholder="Cth: Target peningkatan repetisi bench press dan pemanasan bahu..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Mulai Sesi (Konfirmasi Check-In)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: CHECK-OUT SESI LATIHAN                                          */}
      {/* ========================================================================= */}
      {isCheckOutModalOpen && activeSessionToCheckOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Square className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Check-Out & Selesaikan Sesi</h3>
                  <p className="text-xs text-zinc-400">
                    Klien: <strong className="text-white">{activeSessionToCheckOut.memberName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckOutModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckOut} className="space-y-4 pt-4">
              {/* Info Sesi Aktif */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Waktu Masuk</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {activeSessionToCheckOut.checkInTime} WIB
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Zona</span>
                  <span className="font-semibold text-orange-400">
                    {activeSessionToCheckOut.roomOrArea}
                  </span>
                </div>
              </div>

              {/* Jam Check-Out */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Jam Check-Out (WIB)
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-mono"
                />
              </div>

              {/* RPE Rating / Intensitas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Tingkat Beban Latihan (RPE Rate: 1 - 10)
                  </label>
                  <span className="text-xs font-black text-orange-400">
                    Skor: {checkOutRPE} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={checkOutRPE}
                  onChange={(e) => setCheckOutRPE(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>1 (Sangat Ringan)</span>
                  <span>5 (Sedang)</span>
                  <span>8 (Intensif)</span>
                  <span>10 (Maksimal)</span>
                </div>
              </div>

              {/* Catatan Selesai */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Evaluasi Hasil Latihan / Catatan Coach
                </label>
                <textarea
                  value={checkOutNotes}
                  onChange={(e) => setCheckOutNotes(e.target.value)}
                  placeholder="Cth: Sesi berjalan optimal, form bench press stabil, repetisi ditingkatkan..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Konfirmasi Paraf */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="confirm-member"
                  checked={isMemberConfirmed}
                  onChange={(e) => setIsMemberConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 bg-zinc-900 border-zinc-700 accent-orange-500"
                />
                <label htmlFor="confirm-member" className="text-xs text-zinc-300 font-semibold cursor-pointer">
                  Konfirmasi sesi telah selesai dan disetujui bersama member
                </label>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCheckOutModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Selesaikan & Check-Out</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: DETAIL TIKET PRESENSI SESI                                      */}
      {/* ========================================================================= */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Tiket Presensi Sesi Latihan</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">{selectedLogDetail.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Nama Pelatih:</span>
                  <span className="font-bold text-white">{selectedLogDetail.trainerName}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Klien / Member:</span>
                  <span className="font-bold text-orange-400">
                    {selectedLogDetail.memberName} ({selectedLogDetail.memberId})
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Tanggal:</span>
                  <span className="font-bold text-white">{formatDateIndo(selectedLogDetail.date)}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Waktu Check-In:</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedLogDetail.checkInTime} WIB</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Waktu Check-Out:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedLogDetail.checkOutTime ? `${selectedLogDetail.checkOutTime} WIB` : 'Sedang Berjalan'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Total Durasi:</span>
                  <span className="font-bold text-white font-mono">
                    {selectedLogDetail.durationMinutes ? `${selectedLogDetail.durationMinutes} Menit` : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Zona / Area:</span>
                  <span className="font-semibold text-zinc-300">{selectedLogDetail.roomOrArea}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Program / Fokus:</span>
                  <span className="font-semibold text-zinc-300">{selectedLogDetail.trainingFocus}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Ketepatan Waktu:</span>
                  <span className="font-bold text-cyan-400">{selectedLogDetail.punctuality}</span>
                </div>
              </div>

              {selectedLogDetail.notes && (
                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">
                    Catatan Pelatih & Evaluasi
                  </span>
                  <p className="text-zinc-300 leading-relaxed italic">"{selectedLogDetail.notes}"</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedLogDetail(null)}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: CETAK / EKSPOR REKAPITULASI PRESENSI BULANAN                     */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black">
                  RFA
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">REKAPITULASI PRESENSI TRAINER (BULANAN)</h3>
                  <p className="text-xs text-zinc-500">RFA GYM Fitness & Health Center</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <div>
                  <p><span className="text-zinc-500">Nama Pelatih:</span> <strong>{trainerName}</strong></p>
                  <p><span className="text-zinc-500">ID / NIK:</span> <strong>{trainerId}</strong></p>
                  <p><span className="text-zinc-500">Shift Kerja:</span> <strong>{activeTrainer?.shift || 'Siang'}</strong></p>
                </div>
                <div className="text-right">
                  <p><span className="text-zinc-500">Periode:</span> <strong>{MONTH_NAMES[selectedMonth]} {selectedYear}</strong></p>
                  <p><span className="text-zinc-500">Total Sesi Hadir:</span> <strong>{monthlyStats.totalSessions} Sesi</strong></p>
                  <p><span className="text-zinc-500">Akumulasi Jam:</span> <strong>{monthlyStats.totalHours} Jam {monthlyStats.remainingMinutes} Mnt</strong></p>
                </div>
              </div>

              {/* Table of Sessions */}
              <div className="overflow-x-auto max-h-72 overflow-y-auto border border-zinc-200 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                    <tr>
                      <th className="p-2">Tgl</th>
                      <th className="p-2">Klien / Member</th>
                      <th className="p-2">In - Out</th>
                      <th className="p-2 text-center">Durasi</th>
                      <th className="p-2">Fokus / Zona</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {monthlyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-zinc-400">
                          Tidak ada sesi di periode ini.
                        </td>
                      </tr>
                    ) : (
                      monthlyLogs.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono">{item.date.slice(-2)}/{item.date.slice(5, 7)}</td>
                          <td className="p-2 font-bold">{item.memberName}</td>
                          <td className="p-2 font-mono">{item.checkInTime} - {item.checkOutTime || 'Aktif'}</td>
                          <td className="p-2 text-center font-mono">{item.durationMinutes || '-'} mnt</td>
                          <td className="p-2">{item.trainingFocus}</td>
                          <td className="p-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px] border-t border-zinc-200">
                <div>
                  <p className="text-zinc-500">Personal Trainer</p>
                  <div className="h-14 flex items-end justify-center font-bold underline">
                    {trainerName}
                  </div>
                </div>
                <div>
                  <p className="text-zinc-500">Leader PT</p>
                  <div className="h-14 flex items-end justify-center font-bold underline">
                    Farhan Gym Master
                  </div>
                </div>
                <div>
                  <p className="text-zinc-500">Operasional / HR</p>
                  <div className="h-14 flex items-end justify-center font-bold underline">
                    Rico Staff Kasir
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

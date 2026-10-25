import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Edit3,
  CalendarX,
  Coffee,
  Save,
  X,
  Plus,
  ShieldCheck,
  Sparkles,
  Info,
  BadgeAlert,
  ChevronRight,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import {
  User as UserType,
  WorkSchedule,
  StaffAttendance,
  LeaveRequest,
  TrainerWorkingRule,
  ShiftType
} from '../types';
import { APP_TODAY, formatDateIndo } from '../utils/formatters';
import { DEFAULT_SHIFTS } from '../data/initialData';
import { DEFAULT_TRAINER_WORKING_RULES, getTrainerDutyStatusOnDate } from '../data/ptBookingData';

interface LeaderPTTrainerWorkingRulesTabProps {
  trainers: UserType[];
  trainerWorkingRules: TrainerWorkingRule[];
  onSaveTrainerWorkingRule: (rule: TrainerWorkingRule) => void;
  workSchedules: WorkSchedule[];
  onSaveWorkSchedule: (schedule: WorkSchedule, isNew: boolean) => void;
  staffAttendances: StaffAttendance[];
  leaveRequests: LeaveRequest[];
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const DAY_LABELS = [
  { dayIndex: 1, label: 'Senin', short: 'Sen' },
  { dayIndex: 2, label: 'Selasa', short: 'Sel' },
  { dayIndex: 3, label: 'Rabu', short: 'Rab' },
  { dayIndex: 4, label: 'Kamis', short: 'Kam' },
  { dayIndex: 5, label: 'Jumat', short: 'Jum' },
  { dayIndex: 6, label: 'Sabtu', short: 'Sab' },
  { dayIndex: 0, label: 'Minggu', short: 'Min' }
];

export const LeaderPTTrainerWorkingRulesTab: React.FC<LeaderPTTrainerWorkingRulesTabProps> = ({
  trainers,
  trainerWorkingRules,
  onSaveTrainerWorkingRule,
  workSchedules,
  onSaveWorkSchedule,
  staffAttendances,
  leaveRequests,
  showToast
}) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TrainerWorkingRule | null>(null);

  // Quick Day Off Modal State
  const [isDayOffModalOpen, setIsDayOffModalOpen] = useState(false);
  const [targetTrainerForOff, setTargetTrainerForOff] = useState<UserType | null>(null);
  const [offDate, setOffDate] = useState<string>(APP_TODAY);
  const [offReason, setOffReason] = useState<string>('Jadwal Libur Rutin Mingguan / Day Off');

  // Form states for Editing Rule
  const [formTrainerId, setFormTrainerId] = useState('');
  const [formTrainerName, setFormTrainerName] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formTeachingDays, setFormTeachingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [formDefaultShift, setFormDefaultShift] = useState<ShiftType>('Siang');
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formEndTime, setFormEndTime] = useState('18:00');
  const [formMaxSessions, setFormMaxSessions] = useState(8);
  const [formBreakStart, setFormBreakStart] = useState('12:00');
  const [formBreakEnd, setFormBreakEnd] = useState('13:00');
  const [formNotes, setFormNotes] = useState('');

  // Map trainers with merged rules
  const mergedTrainerList = useMemo(() => {
    return trainers.map((t) => {
      const existingRule =
        trainerWorkingRules.find((r) => r.trainerId === t.id) ||
        DEFAULT_TRAINER_WORKING_RULES.find((r) => r.trainerId === t.id) || {
          trainerId: t.id,
          trainerName: t.name,
          isTeachingActive: t.status !== 'Nonaktif',
          teachingDays: [1, 2, 3, 4, 5, 6],
          defaultShift: (t.shift as ShiftType) || 'Siang',
          startTime: t.shift === 'Pagi' ? '06:00' : t.shift === 'Malam' ? '14:00' : '10:00',
          endTime: t.shift === 'Pagi' ? '14:00' : t.shift === 'Malam' ? '22:00' : '18:00',
          maxSessionsPerDay: 8,
          notes: t.roleName || 'Pelatih Personal Trainer'
        };

      // Check duty status today
      const dutyToday = getTrainerDutyStatusOnDate({
        trainerId: t.id,
        trainerName: t.name,
        date: APP_TODAY,
        workSchedules,
        staffAttendances,
        leaveRequests,
        trainerUser: t,
        rules: trainerWorkingRules
      });

      return {
        trainer: t,
        rule: existingRule,
        dutyToday
      };
    });
  }, [trainers, trainerWorkingRules, workSchedules, staffAttendances, leaveRequests]);

  const filteredTrainers = useMemo(() => {
    if (selectedTrainerId === 'all') return mergedTrainerList;
    return mergedTrainerList.filter((item) => item.trainer.id === selectedTrainerId);
  }, [mergedTrainerList, selectedTrainerId]);

  // Open Edit Rule Modal
  const handleOpenEdit = (rule: TrainerWorkingRule, trainer: UserType) => {
    setEditingRule(rule);
    setFormTrainerId(rule.trainerId);
    setFormTrainerName(trainer.name);
    setFormIsActive(rule.isTeachingActive !== false);
    setFormTeachingDays(rule.teachingDays || [1, 2, 3, 4, 5, 6]);
    setFormDefaultShift(rule.defaultShift || 'Siang');
    setFormStartTime(rule.startTime || '10:00');
    setFormEndTime(rule.endTime || '18:00');
    setFormMaxSessions(rule.maxSessionsPerDay || 8);
    setFormBreakStart(rule.breakStartTime || '12:00');
    setFormBreakEnd(rule.breakEndTime || '13:00');
    setFormNotes(rule.notes || '');
    setIsEditModalOpen(true);
  };

  // Toggle Day in teaching days array
  const handleToggleDay = (dayIndex: number) => {
    setFormTeachingDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length <= 1) {
          showToast('Peringatan', 'Minimal harus ada 1 hari mengajar aktif.', 'warning');
          return prev;
        }
        return prev.filter((d) => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  // Handle Preset Shift Selection
  const handleSelectShiftPreset = (shiftId: ShiftType) => {
    setFormDefaultShift(shiftId);
    if (shiftId === 'Pagi') {
      setFormStartTime('06:00');
      setFormEndTime('14:00');
    } else if (shiftId === 'Siang') {
      setFormStartTime('10:00');
      setFormEndTime('18:00');
    } else if (shiftId === 'Malam') {
      setFormStartTime('14:00');
      setFormEndTime('22:00');
    }
  };

  // Save Rule Submit
  const handleSaveRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStartTime || !formEndTime) {
      showToast('Error', 'Jam mulai dan selesai wajib diisi.', 'error');
      return;
    }

    const updatedRule: TrainerWorkingRule = {
      trainerId: formTrainerId,
      trainerName: formTrainerName,
      isTeachingActive: formIsActive,
      teachingDays: formTeachingDays,
      defaultShift: formDefaultShift,
      startTime: formStartTime,
      endTime: formEndTime,
      maxSessionsPerDay: Number(formMaxSessions) || 8,
      breakStartTime: formBreakStart,
      breakEndTime: formBreakEnd,
      notes: formNotes,
      updatedAt: `${APP_TODAY} (Leader PT)`
    };

    onSaveTrainerWorkingRule(updatedRule);
    setIsEditModalOpen(false);
    showToast(
      'Aturan Jam Kerja Disimpan',
      `Aturan jam melatih Coach ${formTrainerName} berhasil diperbarui (${formStartTime} - ${formEndTime}, Shift: ${formDefaultShift}).`,
      'success'
    );
  };

  // Open Quick Day Off Modal
  const handleOpenQuickDayOff = (trainer: UserType) => {
    setTargetTrainerForOff(trainer);
    setOffDate(APP_TODAY);
    setOffReason('Jadwal Libur Rutin Mingguan (Day Off)');
    setIsDayOffModalOpen(true);
  };

  // Submit Quick Day Off
  const handleSubmitQuickDayOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTrainerForOff) return;

    // Create or update workSchedule with Shift 'Off'
    const existingWs = workSchedules.find(
      (ws) => ws.staffId === targetTrainerForOff.id && ws.date === offDate
    );

    const offSchedule: WorkSchedule = {
      id: existingWs ? existingWs.id : `WS-OFF-${Date.now().toString().slice(-6)}`,
      staffId: targetTrainerForOff.id,
      staffName: targetTrainerForOff.name,
      role: targetTrainerForOff.roleName || 'Pelatih PT',
      date: offDate,
      shift: 'Off',
      startTime: '-',
      endTime: '-',
      status: 'Off',
      notes: offReason
    };

    onSaveWorkSchedule(offSchedule, !existingWs);
    setIsDayOffModalOpen(false);
    showToast(
      'Jadwal Libur Ditetapkan',
      `Coach ${targetTrainerForOff.name} berhasil ditetapkan LIBUR (Day Off) pada ${formatDateIndo(offDate)}. Member tidak akan dapat memilih jadwal pada tanggal ini.`,
      'info'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Aturan Jam & Jadwal Kerja Trainer (Roster Mengajar)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Proteksi Kehadiran Aktif 🛡️
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Atur jam kerja shift mengajar dan hari libur pelatih. Sistem secara otomatis <strong>memblokir member</strong> agar tidak dapat memesan sesi jika trainer sedang <strong>Libur (Day Off)</strong>, <strong>Cuti / Tidak Hadir</strong>, atau di luar jam kerja mengajar.
              </p>
            </div>
          </div>

          {/* Filter Trainer */}
          <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-2xl border border-zinc-800 shrink-0">
            <span className="text-xs font-bold text-zinc-400 pl-2">Filter Pelatih:</span>
            <select
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Pelatih ({trainers.length})</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.shift})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Rules Legend */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span><strong>Bertugas:</strong> Slot jam mengajar terbuka bagi member</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span><strong>Libur (Day Off):</strong> Seluruh slot terkunci (Member tidak bisa ambil)</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span><strong>Cuti / Tidak Hadir:</strong> Jadwal otomatis ditangguhkan demi proteksi</span>
          </div>
        </div>
      </div>

      {/* Trainers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTrainers.map(({ trainer, rule, dutyToday }) => {
          const shiftColor =
            rule.defaultShift === 'Pagi'
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : rule.defaultShift === 'Siang'
              ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
              : rule.defaultShift === 'Malam'
              ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
              : 'text-zinc-400 bg-zinc-800 border-zinc-700';

          return (
            <div
              key={trainer.id}
              className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 shadow-lg hover:border-zinc-700 transition flex flex-col justify-between space-y-4 group relative overflow-hidden"
            >
              {/* Top Row: Avatar & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0 relative">
                    <img
                      src={trainer.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'}
                      alt={trainer.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                        dutyToday.isAvailableForDate ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-orange-400 transition">
                      {trainer.name}
                    </h4>
                    <span className="text-[11px] text-zinc-400 block">{trainer.roleName || 'Coach PT'}</span>
                    <span className="text-[10px] text-zinc-500">Cabang: {trainer.branchName || 'Kelapa Gading'}</span>
                  </div>
                </div>

                {/* Shift Badge */}
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase ${shiftColor}`}>
                  Shift {rule.defaultShift}
                </span>
              </div>

              {/* Status Hari Ini Banner */}
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                  dutyToday.isAvailableForDate
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : dutyToday.isDayOff
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {dutyToday.isAvailableForDate ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : dutyToday.isDayOff ? (
                    <Coffee className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block">Status Hari Ini:</span>
                    <span className="text-[11px] opacity-90">{dutyToday.statusLabel}</span>
                  </div>
                </div>

                {!dutyToday.isAvailableForDate && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-black text-[9px] uppercase tracking-wider shrink-0">
                    Terkunci
                  </span>
                )}
              </div>

              {/* Teaching Hours & Rules Detail */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" /> Jam Mengajar:
                  </span>
                  <strong className="text-white font-mono">
                    {rule.startTime} - {rule.endTime}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Sesi Maks/Hari:
                  </span>
                  <strong className="text-orange-400">{rule.maxSessionsPerDay} Sesi</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Izin Mengajar:
                  </span>
                  <strong className={rule.isTeachingActive ? 'text-emerald-400' : 'text-rose-400'}>
                    {rule.isTeachingActive ? 'Aktif Melatih ✅' : 'Nonaktif Melatih ❌'}
                  </strong>
                </div>

                {/* Teaching Days Indicators */}
                <div className="pt-2 border-t border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-black block mb-1.5">
                    HARI MENGAJAR RESMI:
                  </span>
                  <div className="flex gap-1">
                    {DAY_LABELS.map(({ dayIndex, short }) => {
                      const isActive = rule.teachingDays?.includes(dayIndex);
                      return (
                        <span
                          key={dayIndex}
                          className={`flex-1 text-center py-1 rounded-lg text-[9px] font-black uppercase ${
                            isActive
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                          }`}
                          title={isActive ? `${short}: Aktif Melatih` : `${short}: Libur Rutin`}
                        >
                          {short}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(rule, trainer)}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Atur Jam Kerja</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenQuickDayOff(trainer)}
                  className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition flex items-center gap-1 cursor-pointer"
                  title="Tetapkan Libur (Day Off) pada tanggal tertentu"
                >
                  <CalendarX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Set Libur</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================== */}
      {/* MODAL 1: EDIT ATURAN JAM & JADWAL KERJA TRAINER            */}
      {/* ========================================================== */}
      {isEditModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Atur Jam & Jadwal Kerja Trainer</h4>
                  <p className="text-xs text-zinc-400">Konfigurasi roster jam melatih resmi Coach {formTrainerName}.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRuleSubmit} className="space-y-4">
              {/* Teaching Active Toggle */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Status Izin Mengajar (Aktif Melatih)</span>
                  <span className="text-[11px] text-zinc-400">
                    Jika dinonaktifkan, seluruh booking member ke trainer ini akan ditutup sementara.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formIsActive ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Shift Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">Pilihan Preset Shift Melatih:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectShiftPreset('Pagi')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                      formDefaultShift === 'Pagi'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span>Pagi (06:00-14:00)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectShiftPreset('Siang')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                      formDefaultShift === 'Siang'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    <Sunset className="w-4 h-4 mx-auto mb-1 text-sky-400" />
                    <span>Siang (10:00-18:00)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectShiftPreset('Malam')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                      formDefaultShift === 'Malam'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                    <span>Malam (14:00-22:00)</span>
                  </button>
                </div>
              </div>

              {/* Custom Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Jam Mulai Mengajar:</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Jam Selesai Mengajar:</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Teaching Days Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-zinc-300">Hari Mengajar Aktif (Pilih Hari Kerja):</label>
                  <span className="text-orange-400 text-[11px] font-semibold">
                    {formTeachingDays.length} Hari Aktif ({7 - formTeachingDays.length} Libur)
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_LABELS.map(({ dayIndex, short, label }) => {
                    const isSelected = formTeachingDays.includes(dayIndex);
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        onClick={() => handleToggleDay(dayIndex)}
                        className={`p-2 rounded-xl text-center text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                            : 'bg-zinc-800/80 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                        }`}
                        title={isSelected ? `${label}: Aktif` : `${label}: Libur`}
                      >
                        <span className="block text-[11px]">{short}</span>
                        <span className="text-[9px] block uppercase mt-0.5">
                          {isSelected ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-500 italic">
                  *Hari yang tidak dicentang (OFF) akan otomatis dijadikan Libur Rutin mingguan trainer.
                </p>
              </div>

              {/* Max Sessions Cap */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Batas Maksimal Sesi/Hari:</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={formMaxSessions}
                    onChange={(e) => setFormMaxSessions(parseInt(e.target.value) || 8)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Istirahat / Break Jam:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={formBreakStart}
                      onChange={(e) => setFormBreakStart(e.target.value)}
                      className="w-1/2 px-2 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-[11px] focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                      type="time"
                      value={formBreakEnd}
                      onChange={(e) => setFormBreakEnd(e.target.value)}
                      className="w-1/2 px-2 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-[11px] focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Catatan Khusus / Spesialisasi:</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Misal: Spesialis Rehab Postur, Libur rutin hari Senin..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-lg shadow-orange-500/25 active:scale-95 transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Aturan Roster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: TETAPKAN LIBUR / DAY OFF KHUSUS                   */}
      {/* ========================================================== */}
      {isDayOffModalOpen && targetTrainerForOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <CalendarX className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Tetapkan Libur (Day Off)</h4>
                  <p className="text-xs text-zinc-400">Kunci seluruh jadwal Coach {targetTrainerForOff.name}.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDayOffModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuickDayOff} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-black">PELATIH YANG DILIBURKAN:</span>
                <div className="text-white font-bold text-sm">{targetTrainerForOff.name}</div>
                <div className="text-zinc-400">{targetTrainerForOff.roleName || 'Pelatih PT'}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Pilih Tanggal Libur:</label>
                <input
                  type="date"
                  required
                  value={offDate}
                  onChange={(e) => setOffDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Alasan Libur / Keterangan:</label>
                <input
                  type="text"
                  required
                  value={offReason}
                  onChange={(e) => setOffReason(e.target.value)}
                  placeholder="Misal: Libur Rutin Mingguan / Izin Khusus..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-start gap-2">
                <BadgeAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  Member pada portal tidak akan dapat memilih atau memesan sesi pada tanggal <strong>{formatDateIndo(offDate)}</strong> untuk trainer ini.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDayOffModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-lg shadow-rose-500/25 active:scale-95 transition flex items-center gap-1.5"
                >
                  <CalendarX className="w-4 h-4" />
                  <span>Kunci Jadwal Libur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

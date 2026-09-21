import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  PenTool,
  Clock,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar as CalendarIcon,
  Filter
} from 'lucide-react';
import { Schedule, StudioClass, Member, User as UserType } from '../types';
import { APP_TODAY } from '../utils/formatters';

interface JadwalPTViewProps {
  schedules: Schedule[];
  studioClasses: StudioClass[];
  members: Member[];
  trainers: UserType[];
  currentUser: UserType | null;
  onAddSchedule: (schedule: Schedule) => void;
  onUpdateSchedule: (schedule: Schedule) => void;
  onAddStudioClass: (newClass: StudioClass) => void;
  onBookStudioClass: (classId: string, memberName: string) => void;
  onOpenSignature: (scheduleId: string, targetRole: 'valStaf' | 'valTrainer' | 'valMember') => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onNavigateTab?: (tab: any) => void;
}

export const JadwalPTView: React.FC<JadwalPTViewProps> = ({
  schedules,
  studioClasses,
  members,
  trainers,
  currentUser,
  onAddSchedule,
  onUpdateSchedule,
  onAddStudioClass,
  onBookStudioClass,
  onOpenSignature,
  showToast,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pt' | 'class' | 'calendar'>('pt');
  const [filterTrainer, setFilterTrainer] = useState<string>('all');

  // New Schedule Modal state
  const [isAddSchModalOpen, setIsAddSchModalOpen] = useState(false);
  const [schMemberId, setSchMemberId] = useState('');
  const [schTrainer, setSchTrainer] = useState('');
  const [schDate, setSchDate] = useState(APP_TODAY);
  const [schTime, setSchTime] = useState('09:00');

  // Reschedule Modal state
  const [rescheduleTarget, setRescheduleTarget] = useState<Schedule | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // New Studio Class Modal
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [classTrainer, setClassTrainer] = useState('');
  const [classCapacity, setClassCapacity] = useState(15);
  const [classDate, setClassDate] = useState(APP_TODAY);
  const [classTime, setClassTime] = useState('07:30');

  // Book Class Modal
  const [bookingClassTarget, setBookingClassTarget] = useState<StudioClass | null>(null);
  const [bookingMemberId, setBookingMemberId] = useState('');

  // Calendar Week Offset
  const [weekOffset, setWeekOffset] = useState(0);

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    if (currentUser?.role === 'pt' && s.trainer !== currentUser.name) return false;
    if (filterTrainer !== 'all' && s.trainer !== filterTrainer) return false;
    return true;
  });

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === schMemberId);
    if (!member || !schTrainer) {
      showToast('Peringatan', 'Lengkapi data jadwal sesi PT.', 'warning');
      return;
    }

    const newSch: Schedule = {
      id: 'SCH-' + Date.now(),
      memberName: member.name,
      memberId: member.id,
      trainer: schTrainer,
      date: schDate,
      time: schTime,
      status: 'Menunggu',
      valStaf: false,
      valTrainer: false,
      valMember: false
    };

    onAddSchedule(newSch);
    showToast('Jadwal Dibuat', `Jadwal sesi PT ${member.name} bersama ${schTrainer} berhasil disimpan.`, 'success');
    setIsAddSchModalOpen(false);
    setSchMemberId('');
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !newDate || !newTime) return;

    const updated: Schedule = {
      ...rescheduleTarget,
      date: newDate,
      time: newTime,
      status: 'Reschedule'
    };

    onUpdateSchedule(updated);
    showToast('Reschedule Berhasil', `Jadwal diubah ke ${newDate} jam ${newTime} WIB.`, 'info');
    setRescheduleTarget(null);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !classTrainer) {
      showToast('Peringatan', 'Isi nama kelas dan instruktur.', 'warning');
      return;
    }

    const newClass: StudioClass = {
      id: 'C-' + Date.now(),
      name: className,
      trainer: classTrainer,
      date: classDate,
      time: classTime,
      capacity: Number(classCapacity),
      booked: []
    };

    onAddStudioClass(newClass);
    showToast('Kelas Dibuat', `Kelas ${className} berhasil ditambahkan ke jadwal studio.`, 'success');
    setIsAddClassModalOpen(false);
    setClassName('');
  };

  const handleBookClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingClassTarget || !bookingMemberId) return;

    const member = members.find((m) => m.id === bookingMemberId);
    if (!member) return;

    if (bookingClassTarget.booked.includes(member.name)) {
      showToast('Sudah Terdaftar', `Member ${member.name} sudah terdaftar di kelas ini.`, 'warning');
      return;
    }

    if (bookingClassTarget.booked.length >= bookingClassTarget.capacity) {
      showToast('Kelas Penuh', 'Kapasitas kelas studio sudah mencapai batas maksimal.', 'error');
      return;
    }

    onBookStudioClass(bookingClassTarget.id, member.name);
    showToast('Registrasi Berhasil', `${member.name} berhasil didaftarkan ke kelas ${bookingClassTarget.name}.`, 'success');
    setBookingClassTarget(null);
    setBookingMemberId('');
  };

  // Build Calendar grid
  const getWeekDates = () => {
    const base = new Date(APP_TODAY + 'T00:00:00');
    base.setDate(base.getDate() + weekOffset * 7);
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(base.setDate(diff));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Sub-tab Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Jadwal Sesi PT & Studio Class</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Validasi tanda tangan 3-pihak (Staf, Trainer, Member) dan kalender latihan mingguan</p>
        </div>
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('pt')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'pt' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Validasi TTD Sesi PT
          </button>
          <button
            onClick={() => setActiveSubTab('class')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'class' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Kelas Studio ({studioClasses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'calendar' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Kalender Grid
          </button>
        </div>
      </div>

      {/* Banner Shortcut to Trainer Portal */}
      {onNavigateTab && (
        <div className="bg-gradient-to-r from-orange-950/40 via-zinc-900 to-zinc-900 border border-orange-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-base">
              🏋️
            </div>
            <div>
              <p className="font-bold text-white text-sm">Mode Fokus Khusus Pelatih (Trainer View)</p>
              <p className="text-zinc-400">
                Akses agenda harian pribadi, reminder WhatsApp 1-klik, log latihan, dan estimasi fee sesi di Portal Fokus Trainer.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('trainer-portal')}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black whitespace-nowrap transition shadow-md shadow-orange-500/20 self-start sm:self-center"
          >
            Buka Portal Fokus Trainer →
          </button>
        </div>
      )}

      {/* VIEW 1: PT SCHEDULES & 3-PARTY VALIDATION */}
      {activeSubTab === 'pt' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-3 bg-zinc-950/40">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter Trainer:
              </span>
              <select
                value={filterTrainer}
                onChange={(e) => setFilterTrainer(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs font-semibold rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
              >
                <option value="all">Semua Pelatih</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddSchModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Buat Jadwal PT Baru
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <table className="w-full text-left whitespace-nowrap min-w-[750px]">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Waktu & Tanggal</th>
                  <th className="py-3 px-4">Member & Pelatih</th>
                  <th className="py-3 px-4 text-center">Status Sesi</th>
                  <th className="py-3 px-4 text-center">Validasi 3 Pihak (Staf / PT / Member)</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Tidak ada jadwal sesi PT yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((s) => {
                    const isCompleted = s.status === 'Selesai';
                    return (
                      <tr key={s.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{s.date}</p>
                          <p className="text-[11px] text-orange-400 font-semibold">{s.time} WIB</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-zinc-200">{s.memberName}</p>
                            {(s.bundleName || s.bundleId) && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                🎁 {s.bundleName || 'Bundling'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 font-medium">
                            Trainer: <span className="text-orange-400 font-bold">{s.trainer}</span>
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              s.status === 'Selesai'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : s.status === 'Batal'
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 line-through'
                                : s.status === 'Reschedule'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Staf validation button */}
                            <button
                              disabled={isCompleted || s.valStaf}
                              onClick={() => onOpenSignature(s.id, 'valStaf')}
                              title="Tanda Tangan Staf"
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                                s.valStaf
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-orange-500'
                              }`}
                            >
                              <PenTool className="w-3 h-3" /> Staf
                            </button>

                            {/* Trainer validation button */}
                            <button
                              disabled={isCompleted || s.valTrainer}
                              onClick={() => onOpenSignature(s.id, 'valTrainer')}
                              title="Tanda Tangan Trainer"
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                                s.valTrainer
                                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-orange-500'
                              }`}
                            >
                              <PenTool className="w-3 h-3" /> Trainer
                            </button>

                            {/* Member validation button */}
                            <button
                              disabled={isCompleted || s.valMember}
                              onClick={() => onOpenSignature(s.id, 'valMember')}
                              title="Tanda Tangan Member"
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                                s.valMember
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-orange-500'
                              }`}
                            >
                              <PenTool className="w-3 h-3" /> Member
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!isCompleted && s.status !== 'Batal' ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setRescheduleTarget(s);
                                  setNewDate(s.date);
                                  setNewTime(s.time);
                                }}
                                className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] font-bold transition"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Batalkan sesi latihan ${s.memberName}?`)) {
                                    onUpdateSchedule({ ...s, status: 'Batal' });
                                    showToast('Sesi Dibatalkan', 'Jadwal ditandai Batal.', 'info');
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-bold transition"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-bold">Terkunci</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: STUDIO CLASSES */}
      {activeSubTab === 'class' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-zinc-400">Jadwal kelas studio zumba, yoga, dan aerobik.</p>
            <button
              onClick={() => setIsAddClassModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Buat Kelas Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studioClasses.map((cls) => {
              const isFull = cls.booked.length >= cls.capacity;
              const fillPercent = (cls.booked.length / cls.capacity) * 100;

              return (
                <div
                  key={cls.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-base font-bold text-white tracking-tight">{cls.name}</h4>
                      <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                        {cls.date}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-4 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>{cls.time} WIB</span>
                      <span>•</span>
                      <span>Instruktur: <strong className="text-white">{cls.trainer}</strong></span>
                    </p>

                    {/* Capacity Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-zinc-400 uppercase text-[10px]">Kuota Peserta:</span>
                        <span className={isFull ? 'text-rose-400' : 'text-blue-400'}>
                          {cls.booked.length} / {cls.capacity} Orang
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full transition-all ${isFull ? 'bg-rose-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(fillPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Participant Names List */}
                    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3 mb-4 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 text-xs">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">
                        Peserta Terdaftar ({cls.booked.length}):
                      </span>
                      {cls.booked.length === 0 ? (
                        <p className="text-zinc-600 italic text-[11px]">Belum ada peserta terdaftar.</p>
                      ) : (
                        <div className="space-y-1">
                          {cls.booked.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
                              <span className="w-4 h-4 rounded-full bg-zinc-800 text-[9px] flex items-center justify-center font-bold text-zinc-400">
                                {idx + 1}
                              </span>
                              <span>{name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={isFull}
                    onClick={() => {
                      setBookingClassTarget(cls);
                      setBookingMemberId('');
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      isFull
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                    }`}
                  >
                    {isFull ? 'Kelas Sudah Penuh' : '+ Daftarkan Member'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: INTERACTIVE WEEKLY CALENDAR GRID (06:00 - 21:00) */}
      {activeSubTab === 'calendar' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          {/* Calendar top controls */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>
                  {weekDates[0]} s/d {weekDates[6]}
                </span>
              </div>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Sesi PT
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Kelas Studio
              </span>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 max-h-[600px] overflow-y-auto">
            <div className="min-w-[900px]">
              {/* Header row */}
              <div className="grid grid-cols-8 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
                <div className="p-2.5 text-center text-[10px] font-bold text-zinc-500 uppercase border-r border-zinc-800">
                  Waktu
                </div>
                {weekDates.map((date, idx) => {
                  const isToday = date === APP_TODAY;
                  return (
                    <div
                      key={date}
                      className={`p-2 text-center border-r border-zinc-800 ${
                        isToday ? 'bg-orange-500/10 text-orange-400 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      <p className="text-xs font-bold">{dayNames[idx]}</p>
                      <p className="text-[10px]">{date.substring(5)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Time Rows */}
              {hours.map((hour) => {
                const hourNum = hour.substring(0, 2);
                return (
                  <div key={hour} className="grid grid-cols-8 border-b border-zinc-800/60 min-h-[50px] hover:bg-zinc-800/20">
                    <div className="p-2 text-center text-[10px] font-bold text-zinc-500 border-r border-zinc-800 bg-zinc-950/60 flex items-center justify-center">
                      {hour}
                    </div>
                    {weekDates.map((date) => {
                      // Find PT and Studio classes at this hour & date
                      const ptItems = schedules.filter(
                        (s) => s.date === date && s.time.startsWith(hourNum) && s.status !== 'Batal'
                      );
                      const classItems = studioClasses.filter(
                        (c) => c.date === date && c.time.startsWith(hourNum)
                      );

                      return (
                        <div key={date} className="p-1 border-r border-zinc-800/60 space-y-1">
                          {ptItems.map((pt) => (
                            <div
                              key={pt.id}
                              className="p-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-[10px] font-bold shadow-xs truncate cursor-pointer"
                              title={`Sesi PT: ${pt.memberName} bersama ${pt.trainer}`}
                            >
                              <p className="truncate">{pt.memberName}</p>
                              <p className="text-[9px] text-purple-200 truncate font-normal">PT: {pt.trainer}</p>
                            </div>
                          ))}
                          {classItems.map((cls) => (
                            <div
                              key={cls.id}
                              className="p-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-bold shadow-xs truncate cursor-pointer"
                              title={`Kelas: ${cls.name} (${cls.booked.length}/${cls.capacity})`}
                            >
                              <p className="truncate">{cls.name}</p>
                              <p className="text-[9px] text-blue-200 truncate font-normal">
                                {cls.booked.length}/{cls.capacity} Org
                              </p>
                            </div>
                          ))}
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

      {/* MODAL 1: ADD NEW SCHEDULE */}
      {isAddSchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Buat Jadwal Sesi PT</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Member
                </label>
                <select
                  value={schMemberId}
                  onChange={(e) => setSchMemberId(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs font-semibold text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Sisa Kuota PT: {m.ptQuota})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Pelatih (Trainer)
                </label>
                <select
                  value={schTrainer}
                  onChange={(e) => setSchTrainer(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs font-semibold text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Pelatih --</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={schDate}
                    onChange={(e) => setSchDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Waktu (WIB)
                  </label>
                  <input
                    type="time"
                    value={schTime}
                    onChange={(e) => setSchTime(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSchModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESCHEDULE */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">Reschedule Sesi PT</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Member: <strong className="text-white">{rescheduleTarget.memberName}</strong>
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tanggal Baru
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Jam Baru
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Jadwal Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE STUDIO CLASS */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Buat Kelas Studio Baru</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Cth: Zumba Fitness, Yoga Flow"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Instruktur
                  </label>
                  <select
                    value={classTrainer}
                    onChange={(e) => setClassTrainer(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="">-- Pilih --</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Kapasitas (Org)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={classCapacity}
                    onChange={(e) => setClassCapacity(Number(e.target.value))}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Waktu Mulai
                  </label>
                  <input
                    type="time"
                    value={classTime}
                    onChange={(e) => setClassTime(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BOOK CLASS FOR MEMBER */}
      {bookingClassTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">Daftarkan Member ke Kelas</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Kelas: <strong className="text-white">{bookingClassTarget.name}</strong> ({bookingClassTarget.time} WIB)
            </p>

            <form onSubmit={handleBookClassSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Pilih Member
                </label>
                <select
                  value={bookingMemberId}
                  onChange={(e) => setBookingMemberId(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs font-semibold text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingClassTarget(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Daftarkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

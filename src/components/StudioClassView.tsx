import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Users,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  Printer,
  Trash2,
  Search,
  Filter,
  UserCheck,
  UserX,
  X,
  FileText,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import {
  StudioClass,
  Member,
  User,
  PackageItem,
  Transaction,
  Schedule,
  PTBooking,
  WorkSchedule,
  StaffAttendance,
  LeaveRequest,
  TrainerWorkingRule
} from '../types';
import { APP_TODAY, formatDateIndo } from '../utils/formatters';
import { getTrainerDutyStatusOnDate, isTimeMatchingStudioClass } from '../data/ptBookingData';
import { ClassPaymentModal } from './ClassPaymentModal';
import { useSettings } from '../context/SettingsContext';

interface StudioClassViewProps {
  studioClasses: StudioClass[];
  members: Member[];
  staffUsers: User[];
  packages?: PackageItem[];
  currentUser?: User | null;
  schedules?: Schedule[];
  ptBookings?: PTBooking[];
  workSchedules?: WorkSchedule[];
  staffAttendances?: StaffAttendance[];
  leaveRequests?: LeaveRequest[];
  trainerWorkingRules?: TrainerWorkingRule[];
  onPurchasePackage?: (trx: Transaction, updatedMembers: Member[]) => void;
  onBookClass: (classId: string, memberId: string) => void;
  onUnbookClass?: (classId: string, memberId: string) => void;
  onToggleCheckInMember?: (classId: string, memberId: string) => void;
  onAddClass: (newClass: StudioClass) => void;
  onDeleteClass?: (classId: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const StudioClassView: React.FC<StudioClassViewProps> = ({
  studioClasses,
  members,
  staffUsers,
  packages = [],
  currentUser = null,
  schedules = [],
  ptBookings = [],
  workSchedules = [],
  staffAttendances = [],
  leaveRequests = [],
  trainerWorkingRules = [],
  onPurchasePackage,
  onBookClass,
  onUnbookClass,
  onToggleCheckInMember,
  onAddClass,
  onDeleteClass,
  showToast
}) => {
  const { settings } = useSettings();
  const gymName = settings?.profile?.gymName || 'GYMPRO FITNESS & STUDIO';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedClassForBooking, setSelectedClassForBooking] = useState<StudioClass | null>(null);
  const [bookingMemberId, setBookingMemberId] = useState('');

  // Class Payment Modal State
  const [isClassPaymentModalOpen, setIsClassPaymentModalOpen] = useState(false);
  const [classPaymentPreselectedMemberId, setClassPaymentPreselectedMemberId] = useState<string>('');
  const [classPaymentTargetClass, setClassPaymentTargetClass] = useState<StudioClass | null>(null);

  // Attendance Sheet Modal State
  const [viewingAttendanceClass, setViewingAttendanceClass] = useState<StudioClass | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Class form state
  const [name, setName] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [date, setDate] = useState(APP_TODAY);
  const [time, setTime] = useState('18:00 - 19:00');
  const [capacity, setCapacity] = useState('20');
  const [room, setRoom] = useState('Studio Utama A');
  const [category, setCategory] = useState('Zumba & Dance');
  const [description, setDescription] = useState('');

  // Categories
  const categories = [
    'Semua',
    'Zumba & Dance',
    'Yoga & Pilates',
    'Combat & Martial',
    'RPM / Cycling',
    'Strength & Conditioning'
  ];

  const filteredClasses = useMemo(() => {
    return studioClasses.filter((sc) => {
      // Category filter
      if (selectedCategory !== 'Semua') {
        const clsCat = sc.category || (
          sc.name.toLowerCase().includes('zumba') ? 'Zumba & Dance' :
          sc.name.toLowerCase().includes('yoga') || sc.name.toLowerCase().includes('pilates') ? 'Yoga & Pilates' :
          sc.name.toLowerCase().includes('combat') ? 'Combat & Martial' :
          sc.name.toLowerCase().includes('spin') || sc.name.toLowerCase().includes('rpm') ? 'RPM / Cycling' :
          'Strength & Conditioning'
        );
        if (clsCat !== selectedCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sc.name.toLowerCase().includes(q);
        const matchTrainer = (sc.trainerName || sc.trainer || '').toLowerCase().includes(q);
        const matchRoom = (sc.room || '').toLowerCase().includes(q);
        if (!matchName && !matchTrainer && !matchRoom) return false;
      }

      return true;
    });
  }, [studioClasses, selectedCategory, searchQuery]);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForBooking || !bookingMemberId) return;

    const currentBooked = selectedClassForBooking.bookedMembers || selectedClassForBooking.booked || [];
    if (currentBooked.includes(bookingMemberId)) {
      showToast('Sudah Terdaftar', 'Member ini sudah memesan tempat di kelas ini.', 'warning');
      return;
    }

    if (currentBooked.length >= selectedClassForBooking.capacity) {
      showToast('Kelas Penuh', 'Kapasitas kelas studio telah terisi penuh.', 'error');
      return;
    }

    onBookClass(selectedClassForBooking.id, bookingMemberId);
    showToast('Booking Berhasil', 'Member berhasil didaftarkan ke sesi kelas studio.', 'success');
    setSelectedClassForBooking(null);
    setBookingMemberId('');
  };

  // Duty status of instructor selected in Add Class Modal
  const selectedInstructorUser = useMemo(() => {
    return staffUsers.find((s) => s.id === trainerId);
  }, [staffUsers, trainerId]);

  const selectedInstructorDuty = useMemo(() => {
    if (!trainerId || !date) return null;
    return getTrainerDutyStatusOnDate({
      trainerId,
      trainerName: selectedInstructorUser?.name,
      date,
      workSchedules,
      staffAttendances,
      leaveRequests,
      trainerUser: selectedInstructorUser,
      rules: trainerWorkingRules
    });
  }, [trainerId, date, selectedInstructorUser, workSchedules, staffAttendances, leaveRequests, trainerWorkingRules]);

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !trainerId) return;

    const tr = staffUsers.find((s) => s.id === trainerId);
    const trainerLabel = tr ? tr.name : 'Instruktur';

    // 1. Cek Duty Status (Day off, Cuti, Presensi tidak hadir)
    if (selectedInstructorDuty && !selectedInstructorDuty.isAvailableForDate) {
      showToast(
        'Instruktur Berhalangan',
        `Coach ${trainerLabel} sedang ${selectedInstructorDuty.statusLabel} pada ${formatDateIndo(date)}. ${selectedInstructorDuty.reason || 'Tidak dapat dijadwalkan mengajar kelas.'}`,
        'error'
      );
      return;
    }

    // 2. Cek apakah jam kelas berada di luar jam kerja instruktur
    const startTimeClass = time.includes('-') ? time.split('-')[0].trim() : time.trim();
    if (selectedInstructorDuty?.dutyStartTime && selectedInstructorDuty?.dutyEndTime) {
      if (startTimeClass < selectedInstructorDuty.dutyStartTime || startTimeClass >= selectedInstructorDuty.dutyEndTime) {
        showToast(
          'Di Luar Jam Kerja',
          `Jam kelas ${time} berada di luar jam kerja mengajar Coach ${trainerLabel} (${selectedInstructorDuty.dutyStartTime} - ${selectedInstructorDuty.dutyEndTime}).`,
          'warning'
        );
      }
    }

    // 3. Cek Bentrok dengan Sesi PT (Schedules & PT Bookings)
    const clashingPTSchedule = (schedules || []).find((s) => {
      if (s.date !== date) return false;
      if (s.status === 'Batal' || s.status === 'Hangus') return false;
      const isTrainer =
        (s.trainerId && s.trainerId === trainerId) ||
        (s.trainer && s.trainer.toLowerCase().trim() === trainerLabel.toLowerCase().trim());
      if (!isTrainer) return false;
      return isTimeMatchingStudioClass(time, s.time);
    });

    const clashingPTBooking = (ptBookings || []).find((b) => {
      if (b.bookingDate !== date) return false;
      if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
      if (b.trainerId !== trainerId) return false;
      return isTimeMatchingStudioClass(time, b.startTime);
    });

    if (clashingPTSchedule || clashingPTBooking) {
      const memberName = clashingPTSchedule?.memberName || clashingPTBooking?.memberName || 'Member PT';
      showToast(
        'Instruktur Bentrok PT',
        `Coach ${trainerLabel} sudah memiliki jadwal sesi PT dengan ${memberName} pada jam ${time}. Silakan pilih instruktur atau jam lain.`,
        'error'
      );
      return;
    }

    // 4. Cek Bentrok dengan Kelas Studio Lain (Instruktur sama atau Ruangan sama)
    const clashingClass = studioClasses.find((sc) => {
      if (sc.date !== date) return false;
      const isSameTrainer =
        (sc.trainerId && sc.trainerId === trainerId) ||
        ((sc.trainerName || sc.trainer) === trainerLabel);
      const isSameRoom = (sc.room || '').toLowerCase().trim() === (room || '').toLowerCase().trim();
      if (isSameTrainer && isTimeMatchingStudioClass(time, sc.time)) return true;
      if (isSameRoom && isTimeMatchingStudioClass(time, sc.time)) return true;
      return false;
    });

    if (clashingClass) {
      const isSameTrainer =
        (clashingClass.trainerId && clashingClass.trainerId === trainerId) ||
        ((clashingClass.trainerName || clashingClass.trainer) === trainerLabel);
      showToast(
        'Jadwal Bentrok',
        isSameTrainer
          ? `Coach ${trainerLabel} sudah dijadwalkan mengajar kelas "${clashingClass.name}" pada jam tersebut.`
          : `Ruangan "${room}" sudah digunakan untuk kelas "${clashingClass.name}" pada jam tersebut.`,
        'error'
      );
      return;
    }

    const newClass: StudioClass = {
      id: 'CLS-' + Date.now(),
      name: name.trim(),
      trainer: trainerLabel,
      trainerId,
      trainerName: trainerLabel,
      date,
      time,
      capacity: Number(capacity) || 20,
      booked: [],
      bookedMembers: [],
      checkedInMembers: [],
      room: room || 'Studio Utama A',
      category: category as any,
      description: description.trim() || undefined
    };

    onAddClass(newClass);
    showToast('Kelas Dibuat', `Kelas studio ${name} berhasil dijadwalkan.`, 'success');
    setIsAddOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" /> Jadwal & Booking Studio Class
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase tracking-wider">
              {filteredClasses.length} Sesi
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manajemen kelas studio kebugaran (Zumba, Yoga, Body Combat, Spinning, Pilates) & kuota reservasi member
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onPurchasePackage && (
            <button
              type="button"
              onClick={() => {
                setClassPaymentPreselectedMemberId('');
                setClassPaymentTargetClass(null);
                setIsClassPaymentModalOpen(true);
              }}
              className="bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 font-bold px-3.5 py-2.5 rounded-xl text-xs border border-orange-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-orange-400" /> Beli Paket Kelas
            </button>
          )}

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Buka Jadwal Kelas Baru
          </button>
        </div>
      </div>

      {/* FILTER & CATEGORY TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kelas, instruktur, studio..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-orange-500"
          />
        </div>
      </div>

      {/* CLASSES GRID */}
      {filteredClasses.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
          <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-400">Tidak ada jadwal kelas yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Semua');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-orange-400 font-bold hover:underline"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((sc) => {
            const bookedList = sc.bookedMembers || sc.booked || [];
            const bookedCount = bookedList.length;
            const isFull = bookedCount >= sc.capacity;
            const percentFilled = Math.min(100, Math.round((bookedCount / sc.capacity) * 100));

            return (
              <div
                key={sc.id}
                className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-orange-500/50 transition relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                      {sc.room || 'Studio Utama'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isFull ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {isFull ? 'PENUH' : `${sc.capacity - bookedCount} SLOT SISA`}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white mb-1">{sc.name}</h3>
                  <p className="text-xs text-zinc-400 font-medium">Instruktur: {sc.trainerName || sc.trainer}</p>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>
                        {formatDateIndo(sc.date)} ({sc.time})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>Kapasitas: {bookedCount} / {sc.capacity}</span>
                      </div>
                      <span className="text-[11px] font-bold text-orange-400 font-mono">{percentFilled}%</span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentFilled >= 100
                            ? 'bg-rose-500'
                            : percentFilled >= 75
                            ? 'bg-amber-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedClassForBooking(sc)}
                      disabled={isFull}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                        isFull
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                      }`}
                    >
                      {isFull ? 'Slot Penuh' : 'Daftarkan Member'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingAttendanceClass(sc)}
                      title="Lihat Peserta & Cetak Presensi"
                      className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                    >
                      <Users className="w-4 h-4 text-orange-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: DAFTARKAN MEMBER KE KELAS */}
      {selectedClassForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">Booking Studio Class</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Kelas: <strong className="text-white">{selectedClassForBooking.name}</strong> ({selectedClassForBooking.time})
            </p>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Pilih Member
                </label>
                <select
                  value={bookingMemberId}
                  onChange={(e) => setBookingMemberId(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-orange-500"
                >
                  <option value="">-- Pilih Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} - {m.name} {m.classQuota && m.classQuota > 0 ? `• [${m.classQuota} Sesi]` : '• [0 Sesi]'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Kuota Kelas Member & Opsi Beli Langsung */}
              {(() => {
                const targetMember = members.find((m) => m.id === bookingMemberId);
                if (!targetMember) return null;

                const hasQuota = targetMember.classQuota && targetMember.classQuota > 0;
                return (
                  <div className="space-y-2">
                    {hasQuota ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                        <div className="flex items-center justify-between font-bold">
                          <span>✓ Kuota Tersedia: {targetMember.classQuota} Sesi</span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            Exp: {targetMember.classPackageExpired || '-'}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400/80 mt-0.5 block">
                          Paket: {targetMember.classPackageName || 'Studio Pass'} • 1 sesi akan dipotong saat booking.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                        <div className="flex items-start gap-1.5 text-amber-300">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-white">Member Belum Memiliki Kuota Kelas</strong>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Sisa kuota: 0 sesi. Member dapat membeli Single Pass Drop-In atau Paket Kelas Studio dengan skema Lunas, DP Cicilan, atau Split Payment.
                            </p>
                          </div>
                        </div>
                        {onPurchasePackage && (
                          <button
                            type="button"
                            onClick={() => {
                              setClassPaymentPreselectedMemberId(targetMember.id);
                              setClassPaymentTargetClass(selectedClassForBooking);
                              setSelectedClassForBooking(null);
                              setIsClassPaymentModalOpen(true);
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Beli Paket Kelas / Drop-In Sekarang
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClassForBooking(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Konfirmasi Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DAFTAR PESERTA & CETAK PRESENSI KELAS */}
      {viewingAttendanceClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  Daftar Peserta & Presensi Kelas
                </h3>
                <p className="text-xs text-zinc-400">
                  {viewingAttendanceClass.name} • {viewingAttendanceClass.date} ({viewingAttendanceClass.time})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAttendanceClass(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Class Summary */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 grid grid-cols-2 gap-2 text-xs mb-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Instruktur</span>
                <strong className="text-white">{viewingAttendanceClass.trainerName || viewingAttendanceClass.trainer}</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Ruang & Kuota</span>
                <strong className="text-white">
                  {viewingAttendanceClass.room || 'Studio Utama'} • {(viewingAttendanceClass.bookedMembers || viewingAttendanceClass.booked || []).length} / {viewingAttendanceClass.capacity}
                </strong>
              </div>
            </div>

            {/* Participants list */}
            <div className="space-y-2 mb-4">
              <span className="text-xs font-bold text-zinc-300 block">
                Peserta Terdaftar ({(viewingAttendanceClass.bookedMembers || viewingAttendanceClass.booked || []).length}):
              </span>

              {(() => {
                const bookedMembersRaw = viewingAttendanceClass.bookedMembers || viewingAttendanceClass.booked || [];
                if (bookedMembersRaw.length === 0) {
                  return (
                    <div className="p-6 text-center text-zinc-500 text-xs bg-zinc-950 rounded-xl border border-zinc-800">
                      Belum ada member yang mendaftar di kelas ini.
                    </div>
                  );
                }

                return bookedMembersRaw.map((idOrName, idx) => {
                  const memberObj = members.find((m) => m.id === idOrName || m.name === idOrName);
                  const displayName = memberObj ? memberObj.name : idOrName;
                  const displayId = memberObj ? memberObj.id : '-';
                  const isCheckedIn = (viewingAttendanceClass.checkedInMembers || []).includes(memberObj?.id || idOrName);

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-center text-xs font-mono text-zinc-500">{idx + 1}.</span>
                        <div>
                          <strong className="text-xs text-white block">{displayName}</strong>
                          <span className="text-[10px] text-zinc-500 font-mono">{displayId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onToggleCheckInMember && memberObj && (
                          <button
                            type="button"
                            onClick={() => onToggleCheckInMember(viewingAttendanceClass.id, memberObj.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                              isCheckedIn
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <UserCheck className="w-3 h-3" />
                            {isCheckedIn ? 'Hadir' : 'Absen'}
                          </button>
                        )}

                        {onUnbookClass && memberObj && (
                          <button
                            type="button"
                            onClick={() => {
                              onUnbookClass(viewingAttendanceClass.id, memberObj.id);
                              showToast('Booking Dibatalkan', `Pendaftaran ${memberObj.name} telah dibatalkan.`, 'info');
                            }}
                            title="Batalkan Booking"
                            className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4 text-orange-400" /> Cetak Absensi Kelas
              </button>
              <button
                type="button"
                onClick={() => setViewingAttendanceClass(null)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT JADWAL KELAS BARU */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Buat Jadwal Kelas Studio</h3>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Cth: Power Yoga Sunset"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-orange-500"
                  >
                    <option value="Zumba & Dance">Zumba & Dance</option>
                    <option value="Yoga & Pilates">Yoga & Pilates</option>
                    <option value="Combat & Martial">Combat & Martial</option>
                    <option value="RPM / Cycling">RPM / Cycling</option>
                    <option value="Strength & Conditioning">Strength & Cond.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Instruktur
                  </label>
                  <select
                    value={trainerId}
                    onChange={(e) => setTrainerId(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-orange-500"
                  >
                    <option value="">Pilih...</option>
                    {staffUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.shift || 'Pagi'})
                      </option>
                    ))}
                  </select>
                  {selectedInstructorDuty && (
                    <div
                      className={`mt-1.5 p-1.5 rounded-lg border text-[10px] flex items-center gap-1.5 ${
                        selectedInstructorDuty.isAvailableForDate
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300 font-bold'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>{selectedInstructorDuty.statusLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Jam Sesi
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    placeholder="18:00 - 19:00"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Kapasitas (Orang)
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Ruang Studio
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
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

      {/* Class Payment Modal */}
      {isClassPaymentModalOpen && (
        <ClassPaymentModal
          isOpen={isClassPaymentModalOpen}
          onClose={() => setIsClassPaymentModalOpen(false)}
          members={members}
          packages={packages}
          staffUsers={staffUsers}
          currentUser={currentUser}
          preselectedMemberId={classPaymentPreselectedMemberId}
          classTargetForAutoBook={classPaymentTargetClass}
          onPurchasePackage={(trx: Transaction, updatedMembers: Member[]) => {
            if (onPurchasePackage) {
              onPurchasePackage(trx, updatedMembers);
            }
            showToast('Paket Kelas Berhasil Diaktifkan', `Transaksi ${trx.id} berhasil dicatat.`, 'success');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

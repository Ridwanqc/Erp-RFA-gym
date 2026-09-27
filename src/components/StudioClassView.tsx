import React, { useState } from 'react';
import { Calendar, Users, Plus, CheckCircle2, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { StudioClass, Member, User, PackageItem, Transaction } from '../types';
import { APP_TODAY } from '../utils/formatters';
import { ClassPaymentModal } from './ClassPaymentModal';

interface StudioClassViewProps {
  studioClasses: StudioClass[];
  members: Member[];
  staffUsers: User[];
  packages?: PackageItem[];
  currentUser?: User | null;
  onPurchasePackage?: (trx: Transaction, updatedMembers: Member[]) => void;
  onBookClass: (classId: string, memberId: string) => void;
  onAddClass: (newClass: StudioClass) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const StudioClassView: React.FC<StudioClassViewProps> = ({
  studioClasses,
  members,
  staffUsers,
  packages = [],
  currentUser = null,
  onPurchasePackage,
  onBookClass,
  onAddClass,
  showToast
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedClassForBooking, setSelectedClassForBooking] = useState<StudioClass | null>(null);
  const [bookingMemberId, setBookingMemberId] = useState('');

  // Class Payment Modal State
  const [isClassPaymentModalOpen, setIsClassPaymentModalOpen] = useState(false);
  const [classPaymentPreselectedMemberId, setClassPaymentPreselectedMemberId] = useState<string>('');
  const [classPaymentTargetClass, setClassPaymentTargetClass] = useState<StudioClass | null>(null);

  // Add Class form state
  const [name, setName] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [date, setDate] = useState(APP_TODAY);
  const [time, setTime] = useState('18:00 - 19:00');
  const [capacity, setCapacity] = useState('20');
  const [room, setRoom] = useState('Studio Utama A');

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

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !trainerId) return;

    const tr = staffUsers.find((s) => s.id === trainerId);
    const trainerLabel = tr ? tr.name : 'Instruktur';
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
      room: room || 'Studio Utama A'
    };

    onAddClass(newClass);
    showToast('Kelas Dibuat', `Kelas studio ${name} berhasil dijadwalkan.`, 'success');
    setIsAddOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" /> Jadwal & Booking Studio Class
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manajemen kelas studio kebugaran (Zumba, Yoga, Body Combat, Spinning) & pendaftaran member
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onPurchasePackage && (
            <button
              type="button"
              onClick={() => {
                setClassPaymentPreselectedMemberId('');
                setClassPaymentTargetClass(null);
                setIsClassPaymentModalOpen(true);
              }}
              className="bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 font-bold px-3.5 py-2.5 rounded-xl text-xs border border-orange-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-orange-400" /> Beli Paket Kelas
            </button>
          )}

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Buka Jadwal Kelas Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {studioClasses.map((sc) => {
          const bookedCount = (sc.bookedMembers || sc.booked || []).length;
          const isFull = bookedCount >= sc.capacity;
          return (
            <div
              key={sc.id}
              className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-orange-500/50 transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                    {sc.room || 'Studio Utama'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isFull ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isFull ? 'PENUH' : 'TERSEDIA'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{sc.name}</h3>
                <p className="text-xs text-zinc-400 font-medium">Instruktur: {sc.trainerName || sc.trainer}</p>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span>
                      {sc.date} ({sc.time})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span>
                      Kapasitas: {bookedCount} / {sc.capacity} Peserta
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setSelectedClassForBooking(sc)}
                  disabled={isFull}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                    isFull
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                  }`}
                >
                  {isFull ? 'Slot Penuh' : 'Daftarkan Member'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
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
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Instruktur / Trainer
                </label>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Trainer --</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roleName})
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
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Kapasitas
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Ruang
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
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
    </div>
  );
};

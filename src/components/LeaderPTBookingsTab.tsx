import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  FileText,
  Phone,
  Building2,
  ChevronRight,
  Info,
  ShieldCheck,
  Globe,
  Dumbbell,
  ArrowRight,
  X
} from 'lucide-react';
import {
  PTBooking,
  PTBookingSource,
  PTBookingStatus,
  User as UserType,
  Schedule
} from '../types';
import { APP_TODAY, formatDateIndo } from '../utils/formatters';

interface LeaderPTBookingsTabProps {
  bookings: PTBooking[];
  trainers: UserType[];
  onUpdateBookingStatus?: (bookingId: string, newStatus: PTBookingStatus, notes?: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LeaderPTBookingsTab: React.FC<LeaderPTBookingsTabProps> = ({
  bookings = [],
  trainers = [],
  onUpdateBookingStatus,
  showToast
}) => {
  // Filter States
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterTrainer, setFilterTrainer] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDateMode, setFilterDateMode] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [searchMember, setSearchMember] = useState<string>('');

  // Audit Trail Modal State
  const [selectedAuditBooking, setSelectedAuditBooking] = useState<PTBooking | null>(null);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Source Filter
      if (filterSource !== 'ALL' && b.source !== filterSource) return false;

      // 2. Trainer Filter
      if (filterTrainer !== 'ALL' && b.trainerId !== filterTrainer && b.trainerName !== filterTrainer) {
        return false;
      }

      // 3. Status Filter
      if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;

      // 4. Date Mode Filter
      if (filterDateMode === 'TODAY' && b.bookingDate !== APP_TODAY) return false;
      if (filterDateMode === 'WEEK') {
        const bDate = new Date(b.bookingDate);
        const today = new Date(APP_TODAY);
        const diffDays = (bDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      // 5. Search Member
      if (searchMember.trim()) {
        const q = searchMember.toLowerCase();
        const matchName = b.memberName.toLowerCase().includes(q);
        const matchId = b.memberId.toLowerCase().includes(q);
        const matchCode = b.bookingCode.toLowerCase().includes(q);
        const matchTrainer = b.trainerName.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCode && !matchTrainer) return false;
      }

      return true;
    });
  }, [bookings, filterSource, filterTrainer, filterStatus, filterDateMode, searchMember]);

  // Key Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const fromPortal = bookings.filter((b) => b.source === 'PORTAL_MEMBER').length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    const scheduled = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING').length;
    const today = bookings.filter((b) => b.bookingDate === APP_TODAY).length;
    return { total, fromPortal, completed, scheduled, today };
  }, [bookings]);

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <span>PT Management — Seluruh Booking Personal Trainer</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase">
              Real-time Sync
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Monitoring seluruh jadwal sesi yang dibuat langsung oleh Member via Portal Member maupun dibuat dari Backoffice/Kasir.
          </p>
        </div>

        {/* Source Filter Quick Toggle */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 self-stretch sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterSource('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              filterSource === 'ALL'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Semua Sumber ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterSource('PORTAL_MEMBER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterSource === 'PORTAL_MEMBER'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-orange-400 hover:text-orange-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Portal Member ({metrics.fromPortal})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterSource('BACKOFFICE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              filterSource === 'BACKOFFICE'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Backoffice ({metrics.total - metrics.fromPortal})
          </button>
        </div>
      </div>

      {/* 2. Key Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Booking</span>
          <div className="text-2xl font-black text-white mt-1">{metrics.total}</div>
          <span className="text-[10px] text-zinc-500">Semua riwayat sesi</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-orange-500/30">
          <span className="text-[10px] text-orange-400 uppercase font-bold block">Dari Portal Member</span>
          <div className="text-2xl font-black text-orange-400 mt-1">{metrics.fromPortal}</div>
          <span className="text-[10px] text-orange-300/80">Booking mandiri member</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-500/30">
          <span className="text-[10px] text-amber-400 uppercase font-bold block">Hari Ini</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{metrics.today}</div>
          <span className="text-[10px] text-zinc-400">Jadwal {APP_TODAY}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-sky-400 uppercase font-bold block">Terjadwal / Menunggu</span>
          <div className="text-2xl font-black text-sky-400 mt-1">{metrics.scheduled}</div>
          <span className="text-[10px] text-zinc-500">Confirmed / Pending</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/30">
          <span className="text-[10px] text-emerald-400 uppercase font-bold block">Sesi Selesai</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{metrics.completed}</div>
          <span className="text-[10px] text-emerald-400/80">Completed (Sah)</span>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Trainer Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 font-semibold">Trainer:</span>
            <select
              value={filterTrainer}
              onChange={(e) => setFilterTrainer(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-semibold outline-none"
            >
              <option value="ALL">Semua Trainer</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-semibold outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PENDING">PENDING</option>
              <option value="RESCHEDULED">RESCHEDULED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 font-semibold">Periode:</span>
            <div className="flex gap-1 bg-zinc-800 p-0.5 rounded-xl border border-zinc-700">
              <button
                type="button"
                onClick={() => setFilterDateMode('ALL')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  filterDateMode === 'ALL' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterDateMode('TODAY')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  filterDateMode === 'TODAY' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setFilterDateMode('WEEK')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  filterDateMode === 'WEEK' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                7 Hari
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            placeholder="Cari member, booking ID, trainer..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* 4. Table of Bookings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-4">Booking ID / Code</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Trainer (Coach)</th>
                <th className="py-3 px-4">Paket PT & Sesi</th>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dibuat Oleh</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="font-semibold">Tidak ada booking PT yang sesuai dengan kriteria filter.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isToday = b.bookingDate === APP_TODAY;
                  const isFromPortal = b.source === 'PORTAL_MEMBER';

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-zinc-800/50 transition ${
                        isToday ? 'bg-orange-500/5' : ''
                      }`}
                    >
                      {/* Booking Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-400">
                        <div>{b.bookingCode}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">{b.id}</div>
                      </td>

                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              b.memberPhoto ||
                              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
                            }
                            alt={b.memberName}
                            className="w-8 h-8 rounded-xl object-cover border border-zinc-700"
                          />
                          <div>
                            <div className="font-extrabold text-white">{b.memberName}</div>
                            <div className="text-[10px] text-zinc-400">
                              {b.memberId} • {b.memberPhone || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trainer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-orange-400" />
                          <span>{b.trainerName}</span>
                        </div>
                      </td>

                      {/* Package & Session Number */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-200">{b.packageName}</div>
                        <div className="text-[11px] font-extrabold text-orange-400 mt-0.5">
                          Sesi ke-{b.sessionNumber} dari {b.totalSessions}
                        </div>
                      </td>

                      {/* Schedule Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{formatDateIndo(b.bookingDate)}</div>
                        <div className="text-[11px] text-orange-300 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-400" />
                          <span>{b.startTime} - {b.endTime} WIB</span>
                        </div>
                      </td>

                      {/* Source Badge */}
                      <td className="py-3.5 px-4">
                        {isFromPortal ? (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span>Portal Member</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold w-fit block">
                            {b.source}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            b.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : b.status === 'CONFIRMED'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : b.status === 'RESCHEDULED'
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                              : b.status === 'CANCELLED'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Created By & Timestamp */}
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        <div className="font-semibold text-zinc-200">{b.createdBy}</div>
                        <div className="text-[10px] text-zinc-500">{b.createdAt}</div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Complete Session Button */}
                          {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && onUpdateBookingStatus && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Konfirmasi sesi ${b.sessionNumber} untuk ${b.memberName} telah SELESAI (COMPLETED)?`)) {
                                  onUpdateBookingStatus(b.id, 'COMPLETED', 'Sesi diselesaikan oleh Leader PT');
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 transition"
                              title="Tandai Selesai (COMPLETED)"
                            >
                              Selesai
                            </button>
                          )}

                          {/* Audit Trail Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedAuditBooking(b)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                            title="Lihat Histori Audit Trail"
                          >
                            <FileText className="w-3.5 h-3.5 text-orange-400" />
                          </button>
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

      {/* AUDIT TRAIL MODAL POPUP */}
      {selectedAuditBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <h4 className="text-base font-black text-white">
                  Audit Trail Booking #{selectedAuditBooking.bookingCode}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditBooking(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">Member:</span>
                <span className="font-bold text-white">{selectedAuditBooking.memberName} ({selectedAuditBooking.memberId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Trainer:</span>
                <span className="font-bold text-white">{selectedAuditBooking.trainerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Jadwal Sesi:</span>
                <span className="font-bold text-orange-400">
                  {selectedAuditBooking.bookingDate} ({selectedAuditBooking.startTime} - {selectedAuditBooking.endTime})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Sumber Booking:</span>
                <span className="font-bold text-zinc-200">{selectedAuditBooking.source}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-black text-zinc-300 uppercase tracking-wider">Histori Perubahan:</h5>
              <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                {(selectedAuditBooking.history || []).map((h, i) => (
                  <div key={h.id || i} className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-400">{h.action}</span>
                      <span className="text-[10px] text-zinc-400">{h.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-zinc-200">{h.notes || h.newValue}</p>
                    <div className="text-[10px] text-zinc-400">
                      Oleh: <strong>{h.changedBy}</strong> ({h.changedRole}) • Sumber: {h.source}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedAuditBooking(null)}
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

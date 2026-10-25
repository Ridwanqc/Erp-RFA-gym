import React, { useState, useMemo } from 'react';
import {
  Snowflake,
  PlayCircle,
  Search,
  Filter,
  Calendar,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Member, MemberFreezeRecord, User as StaffUser } from '../types';
import { APP_TODAY, formatDateIndo, formatRp } from '../utils/formatters';
import { getMemberStatus } from '../utils/memberStatus';
import { FREEZE_REASONS } from '../data/freezeData';

interface MembershipFreezeViewProps {
  members: Member[];
  freezeRecords: MemberFreezeRecord[];
  currentUser: StaffUser | null;
  staffUsers: StaffUser[];
  onOpenFreezeModal: (member?: Member) => void;
  onOpenUnfreezeModal: (member: Member, record: MemberFreezeRecord) => void;
  onSelectMember: (member: Member) => void;
}

export const MembershipFreezeView: React.FC<MembershipFreezeViewProps> = ({
  members,
  freezeRecords,
  currentUser,
  staffUsers,
  onOpenFreezeModal,
  onOpenUnfreezeModal,
  onSelectMember
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FREEZE' | 'SELESAI'>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');

  // KPI Computations
  const activeFreezeRecords = useMemo(() => {
    return freezeRecords.filter((r) => r.status === 'FREEZE');
  }, [freezeRecords]);

  const totalAccumulatedDays = useMemo(() => {
    return freezeRecords.reduce((acc, r) => acc + (r.actualDays || r.plannedDays || 0), 0);
  }, [freezeRecords]);

  const totalAdminFees = useMemo(() => {
    return freezeRecords.reduce((acc, r) => acc + (r.adminFee || 0), 0);
  }, [freezeRecords]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return freezeRecords.filter((record) => {
      const matchSearch =
        record.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.memberPhone && record.memberPhone.includes(searchQuery)) ||
        record.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.notes && record.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || record.status === statusFilter;
      const matchReason = reasonFilter === 'ALL' || record.reason.includes(reasonFilter);

      return matchSearch && matchStatus && matchReason;
    });
  }, [freezeRecords, searchQuery, statusFilter, reasonFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-950/40 via-zinc-900 to-zinc-900 border border-sky-500/20 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
            <Snowflake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-wide">
                Membership Freeze & Extension
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
                MODUL RESMI ERP
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Penghentian sementara masa aktif member tanpa menghapus riwayat transaksi. Masa aktif otomatis disesuaikan secara akurat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-ajukan-freeze-member"
            onClick={() => onOpenFreezeModal()}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-black shadow-lg shadow-sky-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Freeze Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-semibold">Sedang Freeze (Aktif)</span>
            <span className="text-2xl font-black text-sky-400 tracking-tight">
              {activeFreezeRecords.length} <span className="text-xs font-normal text-zinc-400">Member</span>
            </span>
            <span className="text-[10px] text-sky-300 block mt-1">Masa aktif sedang dihentikan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Snowflake className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-semibold">Total Pengajuan Freeze</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {freezeRecords.length} <span className="text-xs font-normal text-zinc-400">Record</span>
            </span>
            <span className="text-[10px] text-zinc-500 block mt-1">Seluruh riwayat tercatat aman</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-semibold">Akumulasi Hari Freeze</span>
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {totalAccumulatedDays} <span className="text-xs font-normal text-zinc-400">Hari</span>
            </span>
            <span className="text-[10px] text-zinc-500 block mt-1">Total durasi perpanjangan aktif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-semibold">Biaya Admin Freeze</span>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              {formatRp(totalAdminFees)}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-1">Penerimaan kas administrasi</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Info Banner per User Advice */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 space-y-1">
          <p className="font-bold text-white">
            Aturan & Mekanisme Perpanjangan Otomatis (Extension Adjustment)
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Freeze keanggotaan <strong>tidak menghapus atau mengubah transaksi membership asli</strong> di kasir ataupun kuota sesi PT.
            Sistem secara transparan mencatat riwayat adjustment masa aktif, menghitung durasi beku aktual, dan memperpanjang masa aktif baru member sesuai jumlah hari freeze.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nama member, ID, staff, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua ({freezeRecords.length})
            </button>
            <button
              onClick={() => setStatusFilter('FREEZE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'FREEZE'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Snowflake className="w-3 h-3" />
              <span>Sedang Freeze ({activeFreezeRecords.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('SELESAI')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === 'SELESAI'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Selesai / Aktif ({freezeRecords.filter((r) => r.status === 'SELESAI').length})
            </button>
          </div>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500"
          >
            <option value="ALL">Semua Alasan</option>
            {FREEZE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Mobile Swipe Cue */}
        <div className="md:hidden bg-zinc-950/80 border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>Geser tabel ke samping untuk melihat detail tanggal & aksi</span>
          </span>
          <span className="text-zinc-500 font-mono text-[10px]">↔ Scroll</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 min-w-[850px]">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-bold">Member</th>
                <th className="py-3.5 px-4 font-bold">Status Freeze</th>
                <th className="py-3.5 px-4 font-bold">Mulai Freeze</th>
                <th className="py-3.5 px-4 font-bold">Selesai Freeze</th>
                <th className="py-3.5 px-4 font-bold text-center">Hari</th>
                <th className="py-3.5 px-4 font-bold">Penyesuaian Masa Aktif</th>
                <th className="py-3.5 px-4 font-bold">Alasan & Petugas</th>
                <th className="py-3.5 px-4 font-bold">Status Sekarang</th>
                <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <Snowflake className="w-8 h-8 mx-auto mb-2 opacity-30 text-sky-400" />
                    <p className="text-sm font-semibold">Tidak ada riwayat freeze yang cocok</p>
                    <p className="text-xs text-zinc-600 mt-0.5 mb-3">
                      Gunakan tombol "Ajukan Freeze Member" untuk menangguhkan keanggotaan.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenFreezeModal()}
                      className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajukan Freeze Member Sekarang</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const memberObj = members.find((m) => m.id === record.memberId);
                  const currentStatus = memberObj ? getMemberStatus(memberObj) : null;
                  const isCurrentFreeze = record.status === 'FREEZE';
                  const displayDays = record.actualDays || record.plannedDays;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-zinc-800/40 transition group"
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              record.memberPhoto ||
                              memberObj?.photo ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
                            }
                            alt={record.memberName}
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-sky-400 transition">
                                {record.memberName}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-orange-400">
                              {record.memberId}
                              {record.memberPhone && (
                                <span className="text-zinc-500 ml-1.5">({record.memberPhone})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Freeze */}
                      <td className="py-3.5 px-4">
                        {isCurrentFreeze ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                            <Snowflake className="w-3 h-3" />
                            FREEZE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            SELESAI
                          </span>
                        )}
                      </td>

                      {/* Mulai Freeze */}
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">
                        {formatDateIndo(record.startDate)}
                      </td>

                      {/* Selesai Freeze */}
                      <td className="py-3.5 px-4 font-mono">
                        {record.actualEndDate ? (
                          <div>
                            <span className="font-bold text-emerald-400">
                              {formatDateIndo(record.actualEndDate)}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              (Aktual Selesai)
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-sky-300">
                              {formatDateIndo(record.plannedEndDate)}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              (Rencana Selesai)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Hari */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 font-black text-amber-400 text-xs">
                          {displayDays} Hari
                        </span>
                      </td>

                      {/* Adjustment Masa Aktif */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <span className="text-zinc-500 line-through">
                            {formatDateIndo(record.previousExpiredDate)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-sky-400" />
                          <span className="font-bold text-emerald-400">
                            {formatDateIndo(record.newAdjustedExpiredDate)}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          Perpanjangan otomatis (+{displayDays} hari)
                        </span>
                      </td>

                      {/* Alasan & Staff */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-200 block text-xs">
                          {record.reason}
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                          <span>Staff:</span>
                          <span className="text-zinc-300 font-medium">{record.staffName}</span>
                        </div>
                        {record.notes && (
                          <p className="text-[10px] text-zinc-500 italic mt-0.5 line-clamp-1">
                            "{record.notes}"
                          </p>
                        )}
                      </td>

                      {/* Status Member Sekarang */}
                      <td className="py-3.5 px-4">
                        {currentStatus ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${currentStatus.badgeBg} ${currentStatus.badgeColor} border ${currentStatus.badgeBorder}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotColor}`} />
                            {currentStatus.status}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {isCurrentFreeze && memberObj && (
                          <button
                            onClick={() => onOpenUnfreezeModal(memberObj, record)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Aktifkan Kembali</span>
                          </button>
                        )}

                        {memberObj && (
                          <button
                            onClick={() => onSelectMember(memberObj)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                            title="Lihat Detail Member"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
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
    </div>
  );
};

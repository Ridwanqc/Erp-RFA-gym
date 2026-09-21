import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Snowflake,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  Search,
  ArrowRight,
  Sparkles,
  Phone,
  ShieldAlert
} from 'lucide-react';
import { Member, User as StaffUser, MemberFreezeRecord } from '../types';
import { APP_TODAY, formatDateIndo, formatRp } from '../utils/formatters';
import { addDaysToDate, getDaysBetween } from '../utils/memberStatus';
import { FREEZE_REASONS } from '../data/freezeData';

interface FreezeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  allMembers?: Member[];
  currentUser: StaffUser | null;
  staffUsers: StaffUser[];
  onConfirmFreeze: (freezeRecord: MemberFreezeRecord, updatedMember: Member) => void;
}

export const FreezeMemberModal: React.FC<FreezeMemberModalProps> = ({
  isOpen,
  onClose,
  member: initialMember,
  allMembers = [],
  currentUser,
  staffUsers,
  onConfirmFreeze
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(APP_TODAY);
  const [plannedEndDate, setPlannedEndDate] = useState<string>(() => addDaysToDate(APP_TODAY, 14));
  const [reason, setReason] = useState<string>(FREEZE_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [staffId, setStaffId] = useState<string>(currentUser?.id || 'S01');
  const [adminFee, setAdminFee] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter members eligible for freeze: not already frozen & not single-day visit passes
  const eligibleMembers = useMemo(() => {
    return allMembers.filter((m) => !m.isFrozen && m.status !== 'FREEZE' && m.membershipType !== 'VISIT');
  }, [allMembers]);

  // Filter eligible members by search query (name, id, phone)
  const filteredEligibleMembers = useMemo(() => {
    if (!searchQuery.trim()) return eligibleMembers;
    const q = searchQuery.toLowerCase().trim();
    return eligibleMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))
    );
  }, [eligibleMembers, searchQuery]);

  // Reset and synchronize fields when modal opens or initialMember changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSearchQuery('');
      setStartDate(APP_TODAY);
      setPlannedEndDate(addDaysToDate(APP_TODAY, 14));
      setReason(FREEZE_REASONS[0]);
      setCustomReason('');
      setNotes('');
      setAdminFee('0');
      setStaffId(currentUser?.id || staffUsers[0]?.id || 'S01');

      if (initialMember) {
        setSelectedMemberId(initialMember.id);
      } else {
        // Pick first eligible member or maintain current if still eligible
        const exists = eligibleMembers.some((m) => m.id === selectedMemberId);
        if (!exists) {
          setSelectedMemberId(eligibleMembers[0]?.id || '');
        }
      }
    }
  }, [isOpen, initialMember, eligibleMembers, currentUser, staffUsers]);

  // Find the currently selected member object
  const currentMember = useMemo(() => {
    if (initialMember) return initialMember;
    return allMembers.find((m) => m.id === selectedMemberId) || null;
  }, [initialMember, allMembers, selectedMemberId]);

  // Compute duration in days (inclusive)
  const freezeDays = useMemo(() => {
    return Math.max(1, getDaysBetween(startDate, plannedEndDate, true));
  }, [startDate, plannedEndDate]);

  // Compute new adjusted expiry date
  const newAdjustedExpiry = useMemo(() => {
    if (!currentMember?.expired) return '';
    return addDaysToDate(currentMember.expired, freezeDays);
  }, [currentMember, freezeDays]);

  if (!isOpen) return null;

  const handleQuickPreset = (days: number) => {
    const end = addDaysToDate(startDate, days - 1);
    setPlannedEndDate(end);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMember) {
      setErrorMsg('Silakan pilih member terlebih dahulu untuk mengajukan freeze.');
      return;
    }

    if (new Date(plannedEndDate + 'T00:00:00') < new Date(startDate + 'T00:00:00')) {
      setErrorMsg('Tanggal selesai freeze tidak boleh mendahului tanggal mulai freeze!');
      return;
    }

    const staffObj = staffUsers.find((s) => s.id === staffId) || currentUser;
    const finalReason = reason === 'Lainnya' && customReason.trim() ? customReason.trim() : reason;
    const numericFee = Math.max(0, parseInt(adminFee) || 0);

    const recordId =
      'FRZ-' +
      new Date().getFullYear() +
      String(new Date().getMonth() + 1).padStart(2, '0') +
      '-' +
      Math.floor(1000 + Math.random() * 9000);

    const freezeRecord: MemberFreezeRecord = {
      id: recordId,
      memberId: currentMember.id,
      memberName: currentMember.name,
      memberPhone: currentMember.phone,
      memberPhoto: currentMember.photo,
      startDate,
      plannedEndDate,
      plannedDays: freezeDays,
      freezeDays: freezeDays,
      previousStatus: currentMember.status || 'AKTIF',
      previousExpiredDate: currentMember.expired,
      newAdjustedExpiredDate: newAdjustedExpiry,
      adjustedExpiryDate: newAdjustedExpiry,
      reason: finalReason,
      notes: notes.trim() || undefined,
      staffId: staffObj?.id || 'S01',
      staffName: staffObj?.name || 'Staf Admin',
      status: 'FREEZE',
      adminFee: numericFee,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedMember: Member = {
      ...currentMember,
      isFrozen: true,
      status: 'FREEZE',
      activeFreezeId: recordId,
      lastFreezeRecordId: recordId,
      freezeStartDate: startDate,
      freezeEndDate: plannedEndDate,
      freezePlannedEndDate: plannedEndDate,
      freezeDays: freezeDays,
      freezeReason: finalReason,
      freezeStaffName: staffObj?.name || 'Staf Admin',
      freezeNotes: notes.trim() || undefined,
      previousStatus: (currentMember.status as any) || 'AKTIF',
      expired: newAdjustedExpiry
    };

    onConfirmFreeze(freezeRecord, updatedMember);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-sky-500/30 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-sky-950/40 via-zinc-950 to-zinc-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
              <Snowflake className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Ajukan Freeze Member
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
                  SUSPENSI AKTIF
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Tangguhkan masa aktif member sementara dan perpanjang expired otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member Selection / Search */}
          {!initialMember ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Pilih Member Yang Akan Di-Freeze</span>
                </label>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {filteredEligibleMembers.length} member aktif
                </span>
              </div>

              {eligibleMembers.length === 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-300">Tidak Ada Member Aktif</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Semua member di database saat ini berstatus FREEZE atau bertipe tiket harian.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama, ID, atau no HP member..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-sky-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2 text-zinc-500 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Selector */}
                  <select
                    value={selectedMemberId}
                    onChange={(e) => {
                      setSelectedMemberId(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                    required
                  >
                    {filteredEligibleMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) • Exp: {formatDateIndo(m.expired)}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* Live Preview Card of Selected Member */}
              {currentMember && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 mt-1.5">
                  <div className="relative">
                    {currentMember.photo ? (
                      <img
                        src={currentMember.photo}
                        alt={currentMember.name}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sky-400 font-bold shrink-0">
                        {currentMember.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{currentMember.name}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-sky-400 font-bold">
                        {currentMember.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        {currentMember.phone || '-'}
                      </span>
                      <span>•</span>
                      <span>
                        Expired Saat Ini:{' '}
                        <strong className="text-emerald-400 font-mono font-bold">
                          {formatDateIndo(currentMember.expired)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Locked Single Member Card (when opened with pre-selected member) */
            <div className="bg-zinc-950 border border-sky-500/30 rounded-2xl p-3.5 flex items-center gap-3">
              {currentMember?.photo ? (
                <img
                  src={currentMember.photo}
                  alt={currentMember.name}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sky-400 font-bold shrink-0">
                  {currentMember?.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{currentMember?.name}</h4>
                  <span className="text-[10px] font-mono font-bold text-sky-400 px-2 py-0.5 rounded-md bg-sky-950/50 border border-sky-800/40">
                    {currentMember?.id}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span>Masa Aktif Sekarang:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatDateIndo(currentMember?.expired || '')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tanggal Mulai & Tanggal Rencana Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Tanggal Mulai Freeze
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Tanggal Rencana Selesai Freeze
              </label>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => {
                  setPlannedEndDate(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500"
                required
              />
            </div>
          </div>

          {/* Presets Durasi */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Preset Durasi Cepat:
            </span>
            {[
              { label: '7 Hari', days: 7 },
              { label: '11 Hari', days: 11 },
              { label: '14 Hari', days: 14 },
              { label: '16 Hari', days: 16 },
              { label: '30 Hari', days: 30 }
            ].map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => handleQuickPreset(preset.days)}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-sky-500/20 hover:text-sky-400 hover:border-sky-500/40 border border-zinc-800 text-[11px] font-bold text-zinc-300 transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* SIMULASI PENYESUAIAN MASA AKTIF (Visual preview per user requirement) */}
          <div className="bg-gradient-to-br from-sky-950/30 via-zinc-950 to-zinc-950 border border-sky-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Kalkulasi Otomatis Masa Aktif
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono text-xs font-black">
                {freezeDays} Hari Freeze
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-center">
              <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block mb-0.5">Expired Sebelumnya</span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  {formatDateIndo(currentMember?.expired || '')}
                </span>
              </div>

              <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800 flex flex-col justify-center items-center">
                <span className="text-[10px] text-zinc-400 block mb-0.5">Penambahan Hari</span>
                <span className="font-mono text-xs font-black text-sky-400">
                  + {freezeDays} Hari
                </span>
              </div>

              <div className="bg-sky-500/10 rounded-xl p-2.5 border border-sky-500/30">
                <span className="text-[10px] text-sky-300 block mb-0.5">Masa Aktif Baru</span>
                <span className="font-mono text-xs font-black text-emerald-400">
                  {formatDateIndo(newAdjustedExpiry)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 pt-1 leading-relaxed">
              💡 <em>Contoh:</em> Member di-freeze {freezeDays} hari (
              {formatDateIndo(startDate)} s/d {formatDateIndo(plannedEndDate)}). Masa aktif otomatis diperpanjang {freezeDays} hari ke <strong className="text-emerald-300 font-semibold">{formatDateIndo(newAdjustedExpiry)}</strong>.
            </p>
          </div>

          {/* Alasan Freeze */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">Alasan Freeze</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
            >
              {FREEZE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Lainnya' && (
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Tuliskan Alasan Lainnya</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Contoh: Menjalani pemulihan pasca operasi..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500"
                required
              />
            </div>
          )}

          {/* Petugas & Biaya Admin Opsional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Staff Penanggung Jawab
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
              >
                {staffUsers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roleName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Biaya Administrasi (Opsional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-zinc-400">Rp</span>
                <input
                  type="number"
                  value={adminFee}
                  onChange={(e) => setAdminFee(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">Catatan Tambahan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan dari member atau instruksi khusus..."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!currentMember}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 text-xs font-black shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Snowflake className="w-4 h-4" />
              <span>Konfirmasi Freeze Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

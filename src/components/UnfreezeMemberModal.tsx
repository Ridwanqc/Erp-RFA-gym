import React, { useState, useMemo } from 'react';
import { X, PlayCircle, Calendar, CheckCircle2, AlertCircle, Clock, ShieldCheck, User, ArrowRight } from 'lucide-react';
import { Member, User as StaffUser, MemberFreezeRecord } from '../types';
import { APP_TODAY, formatDateIndo } from '../utils/formatters';
import { addDaysToDate, getDaysBetween } from '../utils/memberStatus';

interface UnfreezeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  freezeRecord: MemberFreezeRecord | null;
  currentUser: StaffUser | null;
  staffUsers: StaffUser[];
  onConfirmUnfreeze: (recordId: string, updatedRecord: MemberFreezeRecord, updatedMember: Member) => void;
}

export const UnfreezeMemberModal: React.FC<UnfreezeMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  freezeRecord,
  currentUser,
  staffUsers,
  onConfirmUnfreeze
}) => {
  const [unfreezeDate, setUnfreezeDate] = useState<string>(APP_TODAY);
  const [staffId, setStaffId] = useState<string>(currentUser?.id || 'S01');
  const [unfreezeNotes, setUnfreezeNotes] = useState<string>('Member telah siap berolahraga kembali.');

  if (!isOpen || !member || !freezeRecord) return null;

  // Actual days between freeze start date and unfreeze date (inclusive)
  const actualDays = useMemo(() => {
    return getDaysBetween(freezeRecord.startDate, unfreezeDate, true);
  }, [freezeRecord.startDate, unfreezeDate]);

  // Recalculate expiry based on actual freeze duration
  const finalAdjustedExpiry = useMemo(() => {
    return addDaysToDate(freezeRecord.previousExpiredDate, actualDays);
  }, [freezeRecord.previousExpiredDate, actualDays]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const staffObj = staffUsers.find((s) => s.id === staffId) || currentUser;

    const updatedRecord: MemberFreezeRecord = {
      ...freezeRecord,
      actualEndDate: unfreezeDate,
      actualDays,
      newAdjustedExpiredDate: finalAdjustedExpiry,
      status: 'SELESAI',
      unfreezeStaffId: staffObj?.id || 'S01',
      unfreezeStaffName: staffObj?.name || 'Staf Admin',
      unfreezeNotes: unfreezeNotes.trim() || undefined,
      unfrozenAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedMember: Member = {
      ...member,
      isFrozen: false,
      status: 'AKTIF',
      activeFreezeId: undefined,
      freezeStartDate: undefined,
      freezeEndDate: undefined,
      freezeReason: undefined,
      freezeStaffName: undefined,
      freezeNotes: undefined,
      expired: finalAdjustedExpiry
    };

    onConfirmUnfreeze(freezeRecord.id, updatedRecord, updatedMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <PlayCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Aktifkan Kembali (Unfreeze)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  KEMBALI AKTIF
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Pulihkan akses keanggotaan dan sesuaikan tanggal masa aktif aktual.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Member Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 flex items-center gap-3">
            <img
              src={member.photo}
              alt={member.name}
              className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                <span className="text-[10px] font-mono font-bold text-orange-400">{member.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  FREEZE
                </span>
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                <span>Alasan:</span>
                <span className="font-semibold text-zinc-200">{freezeRecord.reason}</span>
              </div>
            </div>
          </div>

          {/* Freeze Schedule & Actual Unfreeze Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3">
              <span className="text-[10px] text-zinc-400 block mb-0.5">Tanggal Mulai Freeze</span>
              <span className="font-mono text-xs font-bold text-zinc-200">
                {formatDateIndo(freezeRecord.startDate)}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">
                Rencana Selesai: {formatDateIndo(freezeRecord.plannedEndDate)} ({freezeRecord.plannedDays} hari)
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Tanggal Unfreeze (Hari Ini)
              </label>
              <input
                type="date"
                value={unfreezeDate}
                onChange={(e) => setUnfreezeDate(e.target.value)}
                min={freezeRecord.startDate}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* KALKULASI REKONSILIASI PENYESUAIAN MASA AKTIF */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-zinc-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Penyesuaian Durasi Aktual
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-black">
                {actualDays} Hari Aktual
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-center">
              <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block mb-0.5">Expired Asli (Pra-Freeze)</span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  {formatDateIndo(freezeRecord.previousExpiredDate)}
                </span>
              </div>

              <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800 flex flex-col justify-center items-center">
                <span className="text-[10px] text-zinc-400 block mb-0.5">Perpanjangan Aktual</span>
                <span className="font-mono text-xs font-black text-emerald-400">
                  + {actualDays} Hari
                </span>
              </div>

              <div className="bg-emerald-500/10 rounded-xl p-2.5 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 block mb-0.5">Expired Baru Disesuaikan</span>
                <span className="font-mono text-xs font-black text-emerald-300">
                  {formatDateIndo(finalAdjustedExpiry)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 pt-1 leading-relaxed">
              Status member akan langsung kembali menjadi <strong>AKTIF</strong> dan dapat check-in fasilitas gym mulai hari ini.
            </p>
          </div>

          {/* Staff & Catatan */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Staff Yang Memproses Unfreeze
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              >
                {staffUsers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roleName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Catatan Unfreeze</label>
              <textarea
                value={unfreezeNotes}
                onChange={(e) => setUnfreezeNotes(e.target.value)}
                rows={2}
                placeholder="Alasan aktivasi kembali atau kondisi terkini..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Konfirmasi & Aktifkan Kembali</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

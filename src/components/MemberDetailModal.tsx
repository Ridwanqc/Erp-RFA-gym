import React, { useState } from 'react';
import { X, Calendar, CreditCard, Dumbbell, History, Phone, ShieldCheck, AlertCircle, Clock, UserCheck, IdCard, Crown, Sparkles, CheckCircle2, Snowflake, PlayCircle, ArrowRight } from 'lucide-react';
import { Member, Attendance, Transaction, Schedule, FollowUpLog, MemberMembershipRecord, PTPurchaseRecord, MemberFreezeRecord } from '../types';
import { formatRp, APP_TODAY, formatDateIndo } from '../utils/formatters';
import { getMemberStatus } from '../utils/memberStatus';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  attendanceList: Attendance[];
  transactionList: Transaction[];
  scheduleList: Schedule[];
  followUpList: FollowUpLog[];
  memberMemberships?: MemberMembershipRecord[];
  ptPurchases?: PTPurchaseRecord[];
  freezeRecords?: MemberFreezeRecord[];
  onOpenPayPiutang?: (trx: Transaction) => void;
  onOpenIDCard?: (member: Member) => void;
  onOpenFreeze?: (member: Member) => void;
  onOpenUnfreeze?: (member: Member, record?: MemberFreezeRecord) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  attendanceList,
  transactionList,
  scheduleList,
  followUpList,
  memberMemberships = [],
  ptPurchases = [],
  freezeRecords = [],
  onOpenPayPiutang,
  onOpenIDCard,
  onOpenFreeze,
  onOpenUnfreeze
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'absen' | 'trx' | 'pt' | 'fu' | 'freeze'>('info');

  if (!isOpen || !member) return null;

  const currentStatus = getMemberStatus(member);
  const isExpired = currentStatus.status === 'EXPIRED';

  // Filter specific member data
  const memberAttendances = attendanceList.filter((a) => a.memberName === member.name || a.memberId === member.id);
  const memberTransactions = transactionList.filter((t) => t.customer.includes(member.name));
  const memberSchedules = scheduleList.filter((s) => s.memberId === member.id || s.memberName === member.name);
  const memberFollowUps = followUpList.filter((f) => f.memberId === member.id);
  const memberFreezeRecords = freezeRecords.filter((fr) => fr.memberId === member.id);
  const activeFreezeRecord = memberFreezeRecords.find((fr) => fr.status === 'FREEZE') || null;

  // Active membership record (from Bundling or Regular)
  const activeMembership = memberMemberships.find((m) => m.memberId === member.id && m.status === 'AKTIF');
  // PT Purchase record (from Bundling or Regular)
  const activePtPurchase = ptPurchases.find((p) => p.memberId === member.id);

  const ptCompleted = memberSchedules.filter((s) => s.status === 'Selesai').length;
  const ptTotal = activePtPurchase ? activePtPurchase.totalSessions : Math.max(member.ptQuota + ptCompleted, 2);
  const ptRemaining = member.ptQuota;
  const ptPercent = ptTotal > 0 ? Math.min(Math.round((ptCompleted / ptTotal) * 100), 100) : 0;

  const totalSpent = memberTransactions
    .filter((t) => t.status === 'Paid' || t.status === 'DP 50%')
    .reduce((sum, t) => sum + (t.amountPaid || t.amount), 0);

  const totalDebt = memberTransactions
    .filter((t) => t.status !== 'VOID')
    .reduce((sum, t) => sum + (t.amountRemaining || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Top Profile Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-950 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={member.photo}
              alt={member.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-zinc-700 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{member.name}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${currentStatus.badgeBg} ${currentStatus.badgeColor} ${currentStatus.badgeBorder}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotColor}`} />
                  {currentStatus.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="font-mono text-orange-400 font-bold">{member.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" /> {member.phone}
                </span>
                <span>•</span>
                <span>PIC: <strong className="text-zinc-200">{member.picName}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Action Button: Freeze / Unfreeze Member */}
            {member.isFrozen && onOpenUnfreeze && (
              <button
                onClick={() => onOpenUnfreeze(member, activeFreezeRecord || undefined)}
                className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Aktifkan Kembali Masa Aktif Member"
              >
                <PlayCircle className="w-4 h-4" />
                <span>AKTIFKAN KEMBALI</span>
              </button>
            )}

            {!member.isFrozen && member.membershipType !== 'VISIT' && onOpenFreeze && (
              <button
                onClick={() => onOpenFreeze(member)}
                className="px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Bekukan Sementara Keanggotaan Member"
              >
                <Snowflake className="w-4 h-4" />
                <span>FREEZE MEMBER</span>
              </button>
            )}

            {onOpenIDCard && (
              <button
                onClick={() => onOpenIDCard(member)}
                className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="Buka Digital Member Pass RFA GYM"
              >
                <IdCard className="w-4 h-4" />
                <span className="hidden sm:inline">Digital Pass</span>
              </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex bg-zinc-950/80 border-b border-zinc-800 px-4 py-2 gap-2 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'info', label: 'Ringkasan 360', icon: ShieldCheck },
            { id: 'freeze', label: `Riwayat Freeze (${memberFreezeRecords.length})`, icon: Snowflake },
            { id: 'absen', label: `Riwayat Visit (${memberAttendances.length})`, icon: UserCheck },
            { id: 'trx', label: `Transaksi & Piutang (${memberTransactions.length})`, icon: CreditCard },
            { id: 'pt', label: `Sesi PT (${memberSchedules.length})`, icon: Dumbbell },
            { id: 'fu', label: `Follow Up (${memberFollowUps.length})`, icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-orange-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
          {/* TAB 1: INFO RINGKASAN */}
          {activeSubTab === 'info' && (
            <div className="space-y-4">
              {/* Banner jika Member Sedang Freeze */}
              {member.isFrozen && (
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
                      <Snowflake className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-sky-400 uppercase tracking-wider">
                          STATUS KEANGGOTAAN SEDANG DIBEKUKAN (FREEZE)
                        </span>
                        {activeFreezeRecord && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/30">
                            {activeFreezeRecord.plannedDays} Hari
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        {activeFreezeRecord ? (
                          <>
                            Periode: <strong>{formatDateIndo(activeFreezeRecord.startDate)}</strong> s/d{' '}
                            <strong>{formatDateIndo(activeFreezeRecord.plannedEndDate)}</strong>. Alasan: {activeFreezeRecord.reason}
                          </>
                        ) : (
                          <>Masa aktif keanggotaan sedang dihentikan sementara.</>
                        )}
                      </p>
                    </div>
                  </div>
                  {onOpenUnfreeze && (
                    <button
                      onClick={() => onOpenUnfreeze(member, activeFreezeRecord || undefined)}
                      className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Aktifkan Sekarang</span>
                    </button>
                  )}
                </div>
              )}

              {/* Top 2 Cards: ACTIVE MEMBERSHIP & PT PACKAGE (Bundling integrated) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CARD 1: ACTIVE MEMBERSHIP */}
                <div className="bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/20 border border-amber-500/30 p-4 sm:p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Crown className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                          ACTIVE MEMBERSHIP
                        </span>
                        <h4 className="text-base font-black text-white">
                          {activeMembership?.packageName || 'VIP PLUS (Membership)'}
                        </h4>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        isExpired
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {isExpired ? 'EXPIRED' : 'AKTIF'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs pt-1 border-t border-zinc-800/80">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Durasi Paket:</span>
                      <span className="font-bold text-zinc-200">{activeMembership?.durationLabel || '1 Bulan'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Periode Akses:</span>
                      <span className="font-semibold text-white">
                        {activeMembership?.startDate || '2026-09-01'} s/d {member.expired}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Sumber Paket:</span>
                      <span className="font-semibold text-amber-400">
                        {activeMembership?.source === 'BUNDLING' || member.name === 'Akbar Hanif'
                          ? '⭐ Paket Bundling Gym'
                          : 'Membership Reguler'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: PT PACKAGE WITH PROGRESS BAR */}
                <div className="bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/20 border border-purple-500/30 p-4 sm:p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Dumbbell className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
                          PT PACKAGE
                        </span>
                        <h4 className="text-base font-black text-white">
                          {activePtPurchase?.packageName || 'VIP PLUS (Personal Training)'}
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                      {ptRemaining} Sisa Sesi
                    </span>
                  </div>

                  {/* Sesi Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-zinc-800/80">
                    <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Total Sesi</span>
                      <span className="font-black text-white text-xs">{ptTotal} Sesi</span>
                    </div>
                    <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Selesai</span>
                      <span className="font-black text-emerald-400 text-xs">{ptCompleted} Sesi</span>
                    </div>
                    <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Sisa Kuota</span>
                      <span className="font-black text-amber-400 text-xs">{ptRemaining} Sesi</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Progres Sesi Selesai:</span>
                      <span className="font-mono font-bold text-purple-400">{ptPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${ptPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower 2 Cards: Finansial & CRM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-zinc-800 p-4 sm:p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Keanggotaan & Kuota</h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between border-b border-zinc-800/70 pb-2">
                      <span className="text-zinc-400">Mulai Bergabung:</span>
                      <span className="font-semibold text-white">{member.joinDate || '2026-01-01'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/70 pb-2">
                      <span className="text-zinc-400">Batas Kedaluwarsa:</span>
                      <span className={`font-bold ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {member.expired}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/70 pb-2">
                      <span className="text-zinc-400">Sisa Kuota Sesi PT:</span>
                      <span className="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        {member.ptQuota} Sesi
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Status Follow Up CRM:</span>
                      <span className="font-bold text-orange-400">{member.followUpStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 sm:p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Finansial & Kehadiran</h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between border-b border-zinc-800/70 pb-2">
                      <span className="text-zinc-400">Total Belanja / Omset:</span>
                      <span className="font-extrabold text-white">{formatRp(totalSpent)}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/70 pb-2">
                      <span className="text-zinc-400">Sisa Piutang / Kasbon:</span>
                      <span className={`font-extrabold ${totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatRp(totalDebt)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/70 pb-2">
                      <span className="text-zinc-400">Total Kunjungan Gym:</span>
                      <span className="font-bold text-white">{memberAttendances.length} Hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Sesi PT Terlaksana:</span>
                      <span className="font-bold text-purple-400">
                        {ptCompleted} Sesi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Dokumen Kartu Identitas Resmi */}
              <div className="sm:col-span-2 bg-zinc-950/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Data Dokumen Kartu Identitas ({member.idType || 'KTP'})
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold">
                    {member.idNumber ? 'TERVERIFIKASI' : 'BELUM DILENGKAPI'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500">Jenis Dokumen:</span>
                      <span className="font-bold text-white">{member.idType || 'KTP'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500">Nomor {member.idType || 'KTP'} / NIK:</span>
                      <span className="font-mono font-bold text-orange-400">{member.idNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500">Tanggal Lahir:</span>
                      <span className="font-medium text-white">{member.birthDate || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Kontak Darurat:</span>
                      <span className="font-medium text-emerald-400">{member.emergencyContact || '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-zinc-500 block mb-1">Alamat Sesuai Identitas:</span>
                      <p className="text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/60 leading-relaxed min-h-[48px]">
                        {member.address || <span className="text-zinc-500 italic">Alamat belum diinput.</span>}
                      </p>
                    </div>

                    {member.idPhoto && (
                      <div className="flex items-center gap-2 pt-1">
                        <img
                          src={member.idPhoto}
                          alt="Foto KTP"
                          className="w-16 h-10 object-cover rounded-lg border border-zinc-700 shadow-sm"
                        />
                        <span className="text-[11px] text-zinc-400 font-medium">Scan kartu identitas terlampir</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {member.notes && (
                <div className="sm:col-span-2 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Catatan Member:</span>
                  <p className="text-zinc-200 leading-relaxed italic">"{member.notes}"</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: RIWAYAT FREEZE */}
          {activeSubTab === 'freeze' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-sky-400" />
                    Histori Freeze & Penyesuaian Masa Aktif
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Catatan lengkap penangguhan keanggotaan dan kalkulasi penambahan hari masa aktif.
                  </p>
                </div>
                {!member.isFrozen && member.membershipType !== 'VISIT' && onOpenFreeze && (
                  <button
                    onClick={() => onOpenFreeze(member)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>+ Freeze Baru</span>
                  </button>
                )}
              </div>

              {memberFreezeRecords.length === 0 ? (
                <div className="text-center py-12 bg-zinc-950/40 border border-zinc-800 rounded-2xl">
                  <Snowflake className="w-8 h-8 mx-auto mb-2 text-sky-400/40" />
                  <p className="text-zinc-400 text-xs font-bold">Belum pernah melakukan freeze</p>
                  <p className="text-zinc-600 text-[11px] mt-0.5">
                    Member ini belum memiliki riwayat penghentian sementara keanggotaan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberFreezeRecords.map((fr) => {
                    const isRecFreeze = fr.status === 'FREEZE';
                    const days = fr.actualDays || fr.plannedDays;
                    return (
                      <div
                        key={fr.id}
                        className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-xs space-y-3 transition"
                      >
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                                isRecFreeze
                                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {fr.status}
                            </span>
                            <span className="font-mono text-zinc-500 text-[10px]">{fr.id}</span>
                            <span className="text-zinc-500 text-[10px]">• Diinput: {fr.createdAt}</span>
                          </div>

                          {isRecFreeze && onOpenUnfreeze && (
                            <button
                              onClick={() => onOpenUnfreeze(member, fr)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Aktifkan Kembali</span>
                            </button>
                          )}
                        </div>

                        {/* Periode & Kalkulasi Adjustment */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80">
                          <div>
                            <span className="text-[10px] text-zinc-500 block mb-0.5">Periode Freeze</span>
                            <span className="font-mono font-bold text-zinc-200">
                              {formatDateIndo(fr.startDate)} s/d {formatDateIndo(fr.actualEndDate || fr.plannedEndDate)}
                            </span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              Durasi: <strong className="text-amber-400 font-mono">{days} Hari</strong>
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-zinc-500 block mb-0.5">Penyesuaian Masa Aktif</span>
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <span className="text-zinc-400 line-through">
                                {formatDateIndo(fr.previousExpiredDate)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="font-bold text-emerald-400">
                                {formatDateIndo(fr.newAdjustedExpiredDate)}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              Otomatis diperpanjang {days} hari
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-zinc-500 block mb-0.5">Staff & Biaya</span>
                            <span className="text-zinc-200 font-semibold block">{fr.staffName}</span>
                            <span className="text-[10px] text-zinc-400 block">
                              Biaya Admin: <strong className="text-white font-mono">{formatRp(fr.adminFee || 0)}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Alasan & Catatan */}
                        <div className="text-xs space-y-1 pt-1 border-t border-zinc-900">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-[11px]">Alasan:</span>
                            <span className="font-bold text-zinc-200">{fr.reason}</span>
                          </div>
                          {fr.notes && (
                            <p className="text-zinc-400 italic text-[11px]">"{fr.notes}"</p>
                          )}
                          {fr.unfreezeNotes && (
                            <p className="text-emerald-400/90 text-[11px] pt-1">
                              <strong>Catatan Aktivasi Kembali:</strong> "{fr.unfreezeNotes}" (oleh {fr.unfreezeStaffName || 'Admin'} tgl {fr.unfrozenAt})
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ABSENSI */}
          {activeSubTab === 'absen' && (
            <div className="space-y-2">
              {memberAttendances.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-8">Belum ada riwayat check-in tercatat.</p>
              ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold">Tanggal</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold">Jam Masuk</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold">Jam Keluar</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold">Tujuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                      {memberAttendances.map((att) => (
                        <tr key={att.id} className="hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 text-white font-medium">{att.date}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">{att.timeIn}</td>
                          <td className="py-2.5 px-3 text-zinc-400">{att.timeOut || <span className="text-orange-400 font-bold">Di Dalam</span>}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                              {att.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSAKSI & PIUTANG */}
          {activeSubTab === 'trx' && (
            <div className="space-y-3">
              {memberTransactions.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-8">Belum ada transaksi.</p>
              ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold">ID / Tgl</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold">Deskripsi</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold text-right">Nilai Transaksi</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold text-right">Sisa Piutang</th>
                        <th className="py-2.5 px-3 uppercase text-[10px] font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                      {memberTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-white block">{trx.id}</span>
                            <span className="text-[10px] text-zinc-500">{trx.date}</span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300 max-w-[200px] truncate">{trx.desc}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-white">{formatRp(trx.amount)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-400">
                            {trx.amountRemaining > 0 ? formatRp(trx.amountRemaining) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                trx.status === 'Paid'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : trx.status === 'DP 50%'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : trx.status === 'BELUM LUNAS'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-zinc-800 text-zinc-400 line-through'
                              }`}
                            >
                              {trx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PT SESI */}
          {activeSubTab === 'pt' && (
            <div className="space-y-2">
              {memberSchedules.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-8">Belum ada sesi latihan PT terdaftar.</p>
              ) : (
                <div className="space-y-2">
                  {memberSchedules.map((sch) => (
                    <div
                      key={sch.id}
                      className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{sch.date}</span>
                          <span className="text-zinc-500">|</span>
                          <span className="text-orange-400 font-semibold">{sch.time} WIB</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-0.5">Trainer: <strong className="text-zinc-200">{sch.trainer}</strong></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${sch.valStaf ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-600 bg-zinc-900'}`}>Staf</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${sch.valTrainer ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-600 bg-zinc-900'}`}>Trainer</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${sch.valMember ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-600 bg-zinc-900'}`}>Member</span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sch.status === 'Selesai'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : sch.status === 'Batal'
                              ? 'bg-rose-500/20 text-rose-400 line-through'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {sch.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FOLLOW UP CRM */}
          {activeSubTab === 'fu' && (
            <div className="space-y-3">
              {memberFollowUps.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-8">Belum ada catatan interaksi follow-up.</p>
              ) : (
                memberFollowUps.map((fu, idx) => (
                  <div key={idx} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-orange-400 text-[10px] uppercase bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                        {fu.status}
                      </span>
                      <span className="text-zinc-500 text-[10px]">{fu.date}</span>
                    </div>
                    <p className="text-zinc-200 leading-relaxed italic">"{fu.notes}"</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

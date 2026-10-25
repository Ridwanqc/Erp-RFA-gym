import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Wallet,
  Building2,
  QrCode,
  CreditCard,
  Percent,
  CalendarClock,
  Calendar,
  Users,
  Check,
  AlertCircle,
  HelpCircle,
  Clock,
  Crown
} from 'lucide-react';
import { Member, PackageItem, User, Transaction, StudioClass } from '../types';
import { formatRp, getTimestamp, APP_TODAY } from '../utils/formatters';
import { SearchableMemberSelect } from './SearchableMemberSelect';

interface ClassPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  packages: PackageItem[];
  staffUsers: User[];
  currentUser: User | null;
  preselectedMemberId?: string;
  classTargetForAutoBook?: StudioClass | null;
  onPurchasePackage: (trx: Transaction, updatedMembers: Member[]) => void;
  onSuccessBooking?: (classId: string, memberName: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  isStoreClosed?: boolean;
}

export const ClassPaymentModal: React.FC<ClassPaymentModalProps> = ({
  isOpen,
  onClose,
  members,
  packages,
  staffUsers,
  currentUser,
  preselectedMemberId,
  classTargetForAutoBook,
  onPurchasePackage,
  onSuccessBooking,
  showToast,
  isStoreClosed
}) => {
  // Filter class packages
  const classPackages = useMemo(() => {
    return packages.filter((p) => p.cat === 'Class');
  }, [packages]);

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMemberId || '');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(classPackages[0]?.id || 'CLS01');
  const [autoBookAfterPurchase, setAutoBookAfterPurchase] = useState<boolean>(Boolean(classTargetForAutoBook));

  // Skema Pembayaran: 'Lunas' | 'Cicilan' | 'Split'
  const [paymentType, setPaymentType] = useState<'Lunas' | 'Cicilan' | 'Split'>('Lunas');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'QRIS' | 'EDC'>('Tunai');

  // Opsi DP Cicilan
  const [dpPercent, setDpPercent] = useState<number>(50);
  const [customDpAmount, setCustomDpAmount] = useState<string>('');
  // Kebijakan Aktivasi Sesi saat DP: 'proportional' vs 'full'
  const [classDpPolicy, setClassDpPolicy] = useState<'proportional' | 'full'>('proportional');

  // Skema Split Payment (Campuran Tunai & Nontunai)
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitNonCashAmount, setSplitNonCashAmount] = useState<string>('');
  const [splitNonCashMethod, setSplitNonCashMethod] = useState<'Transfer' | 'QRIS' | 'EDC'>('Transfer');

  // Diskon Tambahan
  const [manualDiscount, setManualDiscount] = useState<string>('0');
  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState<boolean>(false);

  // Kasir / PIC Closing & Kalkulator Uang Tunai
  const [picStaffId, setPicStaffId] = useState<string>(currentUser?.id || 'S01');
  const [cashGiven, setCashGiven] = useState<string>('');

  // Update preselected member when modal opens
  useEffect(() => {
    if (preselectedMemberId) {
      setSelectedMemberId(preselectedMemberId);
    }
    if (classTargetForAutoBook) {
      setAutoBookAfterPurchase(true);
    }
  }, [preselectedMemberId, classTargetForAutoBook, isOpen]);

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  const selectedPackage = useMemo(() => {
    return classPackages.find((p) => p.id === selectedPackageId) || classPackages[0];
  }, [classPackages, selectedPackageId]);

  // Deteksi Member Gym Aktif
  const isMemberActiveGym = useMemo(() => {
    if (!selectedMember?.expired) return false;
    return selectedMember.expired >= APP_TODAY;
  }, [selectedMember]);

  // Pricing calculations
  const rawPrice = selectedPackage ? selectedPackage.price : 0;
  const loyaltyDiscAmt = (applyLoyaltyDiscount && isMemberActiveGym) ? Math.round(rawPrice * 0.1) : 0;
  const manualDiscAmt = Number(manualDiscount) || 0;
  const totalDiscount = loyaltyDiscAmt + manualDiscAmt;
  const netTotal = Math.max(0, rawPrice - totalDiscount);

  // Down Payment calculation
  const isCicilan = paymentType === 'Cicilan';
  const isSplit = paymentType === 'Split';

  let downPayment = netTotal;
  if (isCicilan) {
    if (customDpAmount !== '' && Number(customDpAmount) >= 0) {
      downPayment = Math.min(Number(customDpAmount), netTotal);
    } else {
      downPayment = Math.round((netTotal * dpPercent) / 100);
    }
  } else if (isSplit) {
    downPayment = netTotal;
  }
  const sisaCicilan = isCicilan ? Math.max(netTotal - downPayment, 0) : 0;

  // Sesi yang dibuka saat ini
  const totalSessions = selectedPackage ? (selectedPackage.sessionCount || selectedPackage.value || 1) : 1;
  const sessionsActivatedNow = isCicilan && classDpPolicy === 'proportional'
    ? Math.max(1, Math.round((totalSessions * downPayment) / (netTotal || 1)))
    : totalSessions;
  const sessionsHeldUntilPaid = Math.max(0, totalSessions - sessionsActivatedNow);

  // Kalkulator Kasir Uang Tunai
  const cashGivenNum = Number(cashGiven) || 0;
  const effectiveCashToPay = isSplit ? Number(splitCashAmount) || 0 : downPayment;
  const cashChange = Math.max(0, cashGivenNum - effectiveCashToPay);
  const cashShortage = Math.max(0, effectiveCashToPay - cashGivenNum);

  // Auto-set 50:50 for split payment when switching
  const handleSelectSplit = () => {
    setPaymentType('Split');
    const half = Math.round(netTotal / 2);
    setSplitCashAmount(String(half));
    setSplitNonCashAmount(String(netTotal - half));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isStoreClosed) {
      showToast('Toko Ditutup', 'Closing harian kasir telah dilakukan. Transaksi tidak dapat diproses.', 'error');
      return;
    }

    if (!selectedMember) {
      showToast('Peringatan', 'Silakan pilih member terlebih dahulu.', 'warning');
      return;
    }

    if (!selectedPackage) {
      showToast('Peringatan', 'Silakan pilih paket kelas studio.', 'warning');
      return;
    }

    if (isCicilan && downPayment <= 0 && netTotal > 0) {
      showToast('Peringatan', 'Nominal DP cicilan harus lebih dari Rp 0.', 'warning');
      return;
    }

    if (isSplit) {
      const c = Number(splitCashAmount) || 0;
      const n = Number(splitNonCashAmount) || 0;
      if (c + n !== netTotal) {
        showToast(
          'Split Payment Tidak Seimbang',
          `Total Tunai (${formatRp(c)}) + Nontunai (${formatRp(n)}) harus tepat sama dengan tagihan (${formatRp(netTotal)}).`,
          'warning'
        );
        return;
      }
    }

    // Hitung tanggal kadaluarsa paket kelas
    const currentClassExp = selectedMember.classPackageExpired
      ? new Date(selectedMember.classPackageExpired + 'T00:00:00')
      : null;
    const todayDate = new Date(APP_TODAY + 'T00:00:00');
    const baseDate = (currentClassExp && currentClassExp > todayDate) ? currentClassExp : todayDate;
    const daysToAdd = selectedPackage.validityDays || 30;
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newClassExp = baseDate.toISOString().split('T')[0];

    // Update profil member
    const updatedMember: Member = {
      ...selectedMember,
      classQuota: (selectedMember.classQuota || 0) + sessionsActivatedNow,
      classPackageName: selectedPackage.name,
      classPackageExpired: newClassExp,
      classCategoryAllowed: selectedPackage.classCategory || 'Semua Kelas',
      followUpStatus: 'AKTIF KELAS'
    };

    // Label skema pembayaran
    const schemeLabel = isCicilan
      ? `Cicilan DP ${formatRp(downPayment)} [${classDpPolicy === 'proportional' ? `${sessionsActivatedNow} Sesi Aktif` : 'Semua Sesi Aktif'}] (Sisa Piutang ${formatRp(sisaCicilan)})`
      : isSplit
      ? `Split Payment (Tunai ${formatRp(Number(splitCashAmount))} + ${splitNonCashMethod} ${formatRp(Number(splitNonCashAmount))})`
      : `Lunas via ${paymentMethod}`;

    const effectiveMethod = isSplit ? 'Split Payment' : paymentMethod;
    const effectiveStatus: Transaction['status'] = isCicilan ? (dpPercent === 50 ? 'DP 50%' : 'BELUM LUNAS') : 'Paid';

    const dueDateDate = new Date(APP_TODAY + 'T00:00:00');
    dueDateDate.setDate(dueDateDate.getDate() + 40);
    const dueDateStr = dueDateDate.toISOString().split('T')[0];

    const staffObj = staffUsers.find((s) => s.id === picStaffId) || currentUser;

    const newTrx: Transaction = {
      id: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
      date: APP_TODAY,
      time: getTimestamp(),
      type: 'Class',
      desc: `Paket Kelas Studio ${selectedPackage.name} (${selectedPackage.value} Sesi) [${schemeLabel}]`,
      customer: selectedMember.name,
      memberId: selectedMember.id,
      amount: netTotal,
      amountPaid: downPayment,
      amountRemaining: sisaCicilan,
      dueDate: isCicilan ? dueDateStr : '-',
      cogs: 0,
      profit: downPayment,
      method: effectiveMethod,
      status: effectiveStatus,
      cashier: staffObj?.name || currentUser?.name || 'Kasir',
      bankDest: paymentMethod === 'Transfer' || (isSplit && splitNonCashMethod === 'Transfer') ? 'Mandiri' : undefined,
      classPackageId: selectedPackage.id,
      classSessionsGranted: sessionsActivatedNow,
      classValidityDays: selectedPackage.validityDays || 30,
      paymentScheme: isCicilan ? 'DP_CICILAN' : isSplit ? 'SPLIT_PAYMENT' : 'LUNAS',
      splitCashAmount: isSplit ? Number(splitCashAmount) : undefined,
      splitNonCashAmount: isSplit ? Number(splitNonCashAmount) : undefined,
      splitNonCashMethod: isSplit ? splitNonCashMethod : undefined,
      itemsJSON: JSON.stringify([
        {
          name: selectedPackage.name,
          category: 'Class',
          price: selectedPackage.price,
          sessions: selectedPackage.value,
          validityDays: selectedPackage.validityDays || 30,
          qty: 1,
          participants: [
            {
              memberId: selectedMember.id,
              memberName: selectedMember.name,
              picId: picStaffId,
              picName: staffObj?.name || 'Staff'
            }
          ]
        }
      ]),
      picId: picStaffId,
      picIds: [picStaffId],
      picNames: staffObj?.name || 'Staff Kasir',
      trxCategory: 'STUDIO CLASS',
      initialCashPaid: downPayment
    };

    onPurchasePackage(newTrx, [updatedMember]);

    showToast(
      'Pembelian Paket Kelas Berhasil',
      `${selectedPackage.name} untuk ${selectedMember.name} berhasil diproses (${schemeLabel}). Kuota +${sessionsActivatedNow} sesi aktif!`,
      'success'
    );

    // Auto-book into class if requested
    if (autoBookAfterPurchase && classTargetForAutoBook && onSuccessBooking) {
      onSuccessBooking(classTargetForAutoBook.id, selectedMember.name);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl my-auto max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400">
                <Crown className="w-5 h-5 text-orange-400" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Skema Pembayaran Paket Kelas Studio
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Pilihan skema Lunas 100%, Fasilitas Cicilan/DP bertahap, Split Payment & Loyalty Diskon Member
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
          <form onSubmit={handleSubmit} id="class-payment-form" className="space-y-5">
            {/* 1. Pilih Member */}
            <div>
              <SearchableMemberSelect
                id="class-modal-member-select"
                label="Pilih Member Peserta Kelas"
                required
                placeholder="Ketik nama member, ID (M001), atau nomor telepon..."
                members={members}
                selectedMemberId={selectedMemberId}
                onSelectMember={(mId) => setSelectedMemberId(mId)}
              />

              {/* Status Kuota & Membership Member Terpilih */}
              {selectedMember && (
                <div className="mt-2 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    {selectedMember.photo && selectedMember.photo.trim() ? (
                      <img
                        src={selectedMember.photo.trim()}
                        alt={selectedMember.name}
                        className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold text-xs shrink-0">
                        {selectedMember.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-xs">{selectedMember.name}</strong>
                        <span className="text-[10px] text-zinc-400">({selectedMember.id})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                        <span>
                          Sisa Kuota Kelas:{' '}
                          <strong className={selectedMember.classQuota && selectedMember.classQuota > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                            {selectedMember.classQuota || 0} Sesi
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Gym:{' '}
                          <strong className={isMemberActiveGym ? 'text-emerald-400' : 'text-rose-400'}>
                            {isMemberActiveGym ? 'Member Aktif' : 'Non-Aktif / Expired'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {isMemberActiveGym && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 self-start sm:self-center">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Berhak Diskon Loyalty 10%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Pilih Paket Kelas Studio */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                Pilih Paket Kelas Studio
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {classPackages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const isDropIn = pkg.id === 'CLS01';
                  const isBestSeller = pkg.id === 'CLS03';
                  const isCicilanEligible = pkg.id === 'CLS04' || pkg.id === 'CLS06';

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500 text-white shadow-md ring-1 ring-orange-500/40'
                          : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {isBestSeller && (
                        <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-zinc-950 shadow-sm">
                          POPULER
                        </span>
                      )}
                      {isCicilanEligible && (
                        <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                          BISA CICILAN
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">
                            {pkg.sessionCount || pkg.value} SESI
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {pkg.validityDays || 30} Hari
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{pkg.name}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                          {pkg.classCategory || 'Semua Kelas'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-baseline justify-between">
                        <span className="text-sm font-black text-orange-400">
                          {formatRp(pkg.price)}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-orange-500 text-zinc-950 font-bold' : 'border border-zinc-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Diskon Loyalty & Diskon Khusus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              {/* Checkbox Diskon Loyalty */}
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="modal-loyalty-check"
                  disabled={!isMemberActiveGym}
                  checked={applyLoyaltyDiscount && isMemberActiveGym}
                  onChange={(e) => setApplyLoyaltyDiscount(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-orange-500 bg-zinc-900 border-zinc-700 focus:ring-orange-500 accent-orange-500 cursor-pointer disabled:opacity-40"
                />
                <div>
                  <label
                    htmlFor="modal-loyalty-check"
                    className={`text-xs font-bold block cursor-pointer ${
                      isMemberActiveGym ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    💎 Promo Loyalty Member Gym (-10%)
                  </label>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {isMemberActiveGym
                      ? `Potongan 10% sebesar -${formatRp(Math.round(rawPrice * 0.1))}`
                      : 'Hanya berlaku untuk member dengan membership aktif'}
                  </p>
                </div>
              </div>

              {/* Potongan Tambahan Manual */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Diskon Kasir Manual (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualDiscount}
                  onChange={(e) => setManualDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* 4. Skema Pembayaran: Lunas, Cicilan DP, Split Payment */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                Pilih Skema Pembayaran
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Skema 1: Lunas 100% */}
                <button
                  type="button"
                  onClick={() => setPaymentType('Lunas')}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                    paymentType === 'Lunas'
                      ? 'bg-orange-500/15 border-orange-500 text-white shadow-sm ring-1 ring-orange-500/40'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl shrink-0 ${
                      paymentType === 'Lunas' ? 'bg-orange-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">1. Bayar Lunas</span>
                    <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                      100% lunas langsung. Semua sesi aktif seketika.
                    </span>
                  </div>
                </button>

                {/* Skema 2: Fasilitas Cicilan & DP */}
                <button
                  type="button"
                  onClick={() => setPaymentType('Cicilan')}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                    paymentType === 'Cicilan'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl shrink-0 ${
                      paymentType === 'Cicilan' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">2. Cicilan & DP</span>
                    <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                      Bayar DP sekarang, sisa piutang dicatat di sistem.
                    </span>
                  </div>
                </button>

                {/* Skema 3: Split Payment */}
                <button
                  type="button"
                  onClick={handleSelectSplit}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                    paymentType === 'Split'
                      ? 'bg-blue-500/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/40'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl shrink-0 ${
                      paymentType === 'Split' ? 'bg-blue-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">3. Split Payment</span>
                    <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                      Campuran Cash + Nontunai (QRIS / Transfer).
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Skema Konfigurasi Khusus: CICILAN */}
            {isCicilan && (
              <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Atur Uang Muka (DP) & Kebijakan Sesi
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Total Tagihan: <strong className="text-white">{formatRp(netTotal)}</strong>
                  </span>
                </div>

                {/* Pilihan DP Preset */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'DP 50% (Standar)', pct: 50 },
                    { label: 'DP 30%', pct: 30 },
                    { label: 'DP 70%', pct: 70 },
                    { label: 'Nominal Kustom', pct: 0 }
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.pct > 0) {
                          setDpPercent(item.pct);
                          setCustomDpAmount('');
                        } else {
                          setDpPercent(0);
                          if (!customDpAmount) setCustomDpAmount(String(Math.round(netTotal / 2)));
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        (item.pct > 0 && dpPercent === item.pct && !customDpAmount) ||
                        (item.pct === 0 && customDpAmount !== '')
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {customDpAmount !== '' && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Nominal DP Kustom (Rp)
                    </label>
                    <input
                      type="number"
                      value={customDpAmount}
                      onChange={(e) => setCustomDpAmount(e.target.value)}
                      max={netTotal}
                      min="0"
                      className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {/* Kebijakan Kuota Sesi Kelas saat Cicilan */}
                <div className="pt-2 border-t border-amber-500/20 space-y-2">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                    Kebijakan Kuota Sesi Kelas saat Cicilan:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setClassDpPolicy('proportional')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        classDpPolicy === 'proportional'
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="block text-xs font-bold text-white">
                        ✓ Proporsional Sesuai DP (Aman)
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">
                        Buka {sessionsActivatedNow} sesi hari ini, sisa {sessionsHeldUntilPaid} sesi dibuka setelah piutang lunas.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassDpPolicy('full')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        classDpPolicy === 'full'
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="block text-xs font-bold text-white">
                        Buka Semua ({totalSessions} Sesi Penuh)
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">
                        Semua sesi langsung bisa dipakai, sisa piutang ditagih maks 40 hari.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Ringkasan DP & Piutang */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-2.5">
                    <span className="text-[10px] text-zinc-400 block font-semibold">DP Bayar Hari Ini:</span>
                    <span className="text-sm font-black text-amber-400">{formatRp(downPayment)}</span>
                  </div>
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-2.5">
                    <span className="text-[10px] text-zinc-400 block font-semibold">Sisa Tagihan (Piutang):</span>
                    <span className="text-sm font-black text-rose-400">{formatRp(sisaCicilan)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Skema Konfigurasi Khusus: SPLIT PAYMENT */}
            {isSplit && (
              <div className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Percent className="w-4 h-4" /> Alokasi Split Payment (Campuran Bayar)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Total Tagihan: <strong className="text-white">{formatRp(netTotal)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Nominal Uang Tunai (Cash)
                    </label>
                    <input
                      type="number"
                      value={splitCashAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSplitCashAmount(val);
                        const c = Number(val) || 0;
                        setSplitNonCashAmount(String(Math.max(0, netTotal - c)));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Nominal Non-Tunai
                      </label>
                      <div className="flex gap-1 text-[10px]">
                        {(['QRIS', 'Transfer', 'EDC'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSplitNonCashMethod(m)}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${
                              splitNonCashMethod === m
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      value={splitNonCashAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSplitNonCashAmount(val);
                        const n = Number(val) || 0;
                        setSplitCashAmount(String(Math.max(0, netTotal - n)));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Balance validation */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-400">Total Terbagi:</span>
                  <span
                    className={`font-black ${
                      Number(splitCashAmount) + Number(splitNonCashAmount) === netTotal
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {formatRp(Number(splitCashAmount) + Number(splitNonCashAmount))} / {formatRp(netTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Metode Bayar (Jika Lunas atau Cicilan DP) */}
            {!isSplit && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  Pilih Saluran / Metode Pembayaran {isCicilan ? 'Uang Muka (DP)' : ''}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Tunai', label: 'Cash / Tunai', icon: Wallet },
                    { id: 'Transfer', label: 'Transfer Bank', icon: Building2 },
                    { id: 'QRIS', label: 'QRIS Instant', icon: QrCode },
                    { id: 'EDC', label: 'Kartu EDC', icon: CreditCard }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = paymentMethod === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPaymentMethod(item.id as any)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow-sm ring-1 ring-orange-500/40'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-400' : 'text-zinc-400'}`} />
                          <span className="text-xs font-bold">{item.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Kalkulator Kasir Uang Tunai & Kembalian Cepat */}
            {(paymentMethod === 'Tunai' || (isSplit && Number(splitCashAmount) > 0)) && (
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-orange-400" /> Kalkulator Uang Kasir & Kembalian
                  </span>
                  <span className="text-zinc-400">
                    Kas Diterima Harus: <strong className="text-white">{formatRp(effectiveCashToPay)}</strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="Uang tunai diterima (Rp)..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-1 overflow-x-auto">
                    {[
                      { label: 'Uang Pas', amt: effectiveCashToPay },
                      { label: '70k', amt: 70000 },
                      { label: '100k', amt: 100000 },
                      { label: '200k', amt: 200000 },
                      { label: '500k', amt: 500000 }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setCashGiven(String(preset.amt))}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {cashGivenNum > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400">Status Pembayaran Tunai:</span>
                    {cashGivenNum >= effectiveCashToPay ? (
                      <span className="font-bold text-emerald-400">
                        Kembalian: {formatRp(cashChange)}
                      </span>
                    ) : (
                      <span className="font-bold text-rose-400">
                        Kurang: -{formatRp(cashShortage)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Opsi Langsung Daftarkan ke Kelas Studio Sekarang */}
            {classTargetForAutoBook && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs">
                <input
                  type="checkbox"
                  id="auto-book-class"
                  checked={autoBookAfterPurchase}
                  onChange={(e) => setAutoBookAfterPurchase(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 bg-zinc-950 border-zinc-700 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                />
                <label htmlFor="auto-book-class" className="text-orange-200 font-medium cursor-pointer">
                  Langsung daftarkan member ke sesi <strong>{classTargetForAutoBook.name}</strong> ({classTargetForAutoBook.time} WIB) setelah pembayaran selesai
                </label>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer Summary & Submit */}
        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total Bayar Hari Ini:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-orange-400">
                {formatRp(downPayment)}
              </span>
              <span className="text-xs text-zinc-400">
                {isCicilan ? `(DP ${dpPercent}% / Sisa Piutang ${formatRp(sisaCicilan)})` : isSplit ? '(Split Payment)' : '(Lunas 100%)'}
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
              +{sessionsActivatedNow} Sesi Kelas Studio Langsung Aktif
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="class-payment-form"
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              Konfirmasi Pembayaran
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

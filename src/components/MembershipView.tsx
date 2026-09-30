import React, { useState, useMemo } from 'react';
import { Crown, Sparkles, Check, AlertCircle, Plus, DollarSign, Info, CreditCard, Wallet, QrCode, Building2, CheckCircle2, CalendarClock, Users, UserCheck, Copy, Gift, Layers, BarChart3, Settings, Percent, TrendingUp, Dumbbell, Search, Trash2, Edit3, HelpCircle, Lightbulb, Zap, ArrowRight, ShieldCheck, Lock, Unlock } from 'lucide-react';
import { PackageItem, Member, User, Transaction, BundlePackage } from '../types';
import { formatRp, getTimestamp, APP_TODAY } from '../utils/formatters';
import { SearchableMemberSelect } from './SearchableMemberSelect';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_PIC_PROTECTION } from '../data/settingsData';
import { PicPasswordModal } from './PicPasswordModal';

interface MembershipViewProps {
  packages: PackageItem[];
  members: Member[];
  staffUsers: User[];
  currentUser: User | null;
  bundlePackages?: BundlePackage[];
  onOpenBundlingManager?: () => void;
  onOpenBundlingReports?: () => void;
  onPurchasePackage: (trx: Transaction, updatedMembers: Member[]) => void;
  onAddPackage: (pkg: PackageItem) => void;
  onUpdatePackage?: (pkg: PackageItem) => void;
  onDeletePackage?: (id: string) => void;
  isStoreClosed?: boolean;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MembershipView: React.FC<MembershipViewProps> = ({
  packages,
  members,
  staffUsers,
  currentUser,
  bundlePackages = [],
  onOpenBundlingManager,
  onOpenBundlingReports,
  onPurchasePackage,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  isStoreClosed,
  showToast
}) => {
  const [cat, setCat] = useState<'Membership' | 'PT' | 'Class' | 'Bundling'>('Membership');
  const [type, setType] = useState<'Personal' | 'Couple' | 'Trio'>('Personal');
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [selectedBundleId, setSelectedBundleId] = useState<string>('');

  // Participants
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [p3Id, setP3Id] = useState('');

  // Dedicated PIC per Participant (1 PIC per member for dedicated focus)
  const [p1PicId, setP1PicId] = useState('');
  const [p2PicId, setP2PicId] = useState('');
  const [p3PicId, setP3PicId] = useState('');
  const [isP1PicLocked, setIsP1PicLocked] = useState<boolean>(true);
  const [isP2PicLocked, setIsP2PicLocked] = useState<boolean>(true);
  const [isP3PicLocked, setIsP3PicLocked] = useState<boolean>(true);

  // PIC Password Protection from Settings
  const { settings } = useSettings();
  const picProtection = settings?.picProtection || DEFAULT_PIC_PROTECTION;
  const [isPicPasswordModalOpen, setIsPicPasswordModalOpen] = useState(false);
  const [unlockPicTarget, setUnlockPicTarget] = useState<'p1' | 'p2' | 'p3' | 'closing' | null>(null);

  const handleRequestUnlockPic = (target: 'p1' | 'p2' | 'p3' | 'closing') => {
    const isProtected = picProtection.requirePasswordToChangePic && (picProtection.requirePasswordOnTransaction !== false);
    const canBypass = (currentUser?.role === 'admin' || currentUser?.role === 'manager') && picProtection.allowAdminBypass;

    if (isProtected && !canBypass) {
      setUnlockPicTarget(target);
      setIsPicPasswordModalOpen(true);
    } else {
      if (target === 'p1' || target === 'closing') setIsP1PicLocked(false);
      if (target === 'p2') setIsP2PicLocked(false);
      if (target === 'p3') setIsP3PicLocked(false);
      showToast('Kunci PIC Dibuka 🔓', 'Anda dapat memilih atau mengganti staf PIC.', 'info');
    }
  };

  const handleUnlockPicSuccess = () => {
    if (unlockPicTarget === 'p1' || unlockPicTarget === 'closing') setIsP1PicLocked(false);
    if (unlockPicTarget === 'p2') setIsP2PicLocked(false);
    if (unlockPicTarget === 'p3') setIsP3PicLocked(false);
    setUnlockPicTarget(null);
  };

  // Transaction settings
  const [trxType, setTrxType] = useState<'NEW MEMBERSHIP' | 'RENEWAL' | 'UPGRADE'>('NEW MEMBERSHIP');
  const [picSalesId, setPicSalesId] = useState('');
  const [customClosingPicId, setCustomClosingPicId] = useState<string>('combined');
  const [syncMemberPic, setSyncMemberPic] = useState<boolean>(true);
  const [discount, setDiscount] = useState('0');

  // Skema Pembayaran: 'Lunas' (Penuh 100%) vs 'Cicilan' (DP & Piutang) vs 'Split' (Campuran Tunai & Nontunai)
  const [paymentType, setPaymentType] = useState<'Lunas' | 'Cicilan' | 'Split'>('Lunas');
  // Metode Bayar: Tunai / Cash, Transfer Mandiri, QRIS / QR, Kartu EDC
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'QRIS' | 'EDC'>('Tunai');
  // Opsi DP Cicilan
  const [dpPercent, setDpPercent] = useState<number>(50);
  const [customDpAmount, setCustomDpAmount] = useState<string>('');
  // Kebijakan Aktivasi Sesi Kelas jika Cicilan: 'proportional' (sesi sesuai DP) vs 'full' (buka semua kuota, sisa piutang)
  const [classDpPolicy, setClassDpPolicy] = useState<'proportional' | 'full'>('proportional');

  // Skema Split Payment (Campuran Tunai & Nontunai)
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitNonCashAmount, setSplitNonCashAmount] = useState<string>('');
  const [splitNonCashMethod, setSplitNonCashMethod] = useState<'Transfer' | 'QRIS' | 'EDC'>('Transfer');

  // Kalkulator Kasir Uang Tunai & Kembalian
  const [cashGiven, setCashGiven] = useState<string>('');

  // Promo Diskon Loyalty Member Aktif (10%)
  const [applyMemberDiscount, setApplyMemberDiscount] = useState<boolean>(false);

  // Master package modal & commission state
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [pkgModalTab, setPkgModalTab] = useState<'form' | 'list'>('form');
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgSearch, setPkgSearch] = useState('');
  const [pkgFilterCat, setPkgFilterCat] = useState<'ALL' | 'Membership' | 'PT' | 'Class'>('ALL');

  // Form Fields
  const [newPkgCat, setNewPkgCat] = useState<'Membership' | 'PT' | 'Class'>('Membership');
  const [newPkgType, setNewPkgType] = useState<'Personal' | 'Couple' | 'Trio'>('Personal');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgValue, setNewPkgValue] = useState('');
  const [newPkgValidityDays, setNewPkgValidityDays] = useState('30');
  const [newPkgClassCategory, setNewPkgClassCategory] = useState('Semua Kelas');

  // Commission configurations
  const [commissionType, setCommissionType] = useState<'PERCENT' | 'NOMINAL'>('PERCENT');
  const [salesCommissionRate, setSalesCommissionRate] = useState<string>('4');
  const [salesCommissionNominal, setSalesCommissionNominal] = useState<string>('20000');
  const [trainerCommissionRate, setTrainerCommissionRate] = useState<string>('40');
  const [trainerCommissionNominal, setTrainerCommissionNominal] = useState<string>('160000');
  const [trainerCommissionPerSession, setTrainerCommissionPerSession] = useState<string>('40000');
  const [productBonusNominal, setProductBonusNominal] = useState<string>('0');
  const [commissionNotes, setCommissionNotes] = useState<string>('');

  const filteredPackages = useMemo(() => {
    const matched = packages.filter((p) => p.cat === cat && p.type === type);
    if (matched.length === 0 && cat === 'Class') {
      return packages.filter((p) => p.cat === 'Class');
    }
    return matched;
  }, [packages, cat, type]);

  const currentPackage = filteredPackages[selectedPkgIndex] || filteredPackages[0];

  // Bundling packages
  const activeBundles = bundlePackages.filter((b) => b.status === 'ACTIVE');
  const currentBundle = activeBundles.find((b) => b.bundleId === selectedBundleId) || activeBundles[0];

  // Auto-sync PIC when Member 1 is selected
  const handleP1Change = (memberId: string) => {
    setP1Id(memberId);
    const m = members.find((x) => x.id === memberId);
    if (m && m.picId) {
      setP1PicId(m.picId);
      setPicSalesId(m.picId);
      setIsP1PicLocked(true);
    }
  };

  // Auto-sync PIC when Member 2 is selected
  const handleP2Change = (memberId: string) => {
    setP2Id(memberId);
    const m = members.find((x) => x.id === memberId);
    if (m && m.picId) {
      setP2PicId(m.picId);
      setIsP2PicLocked(true);
    } else if (p1PicId && !p2PicId) {
      setP2PicId(p1PicId);
      setIsP2PicLocked(true);
    }
  };

  // Auto-sync PIC when Member 3 is selected
  const handleP3Change = (memberId: string) => {
    setP3Id(memberId);
    const m = members.find((x) => x.id === memberId);
    if (m && m.picId) {
      setP3PicId(m.picId);
      setIsP3PicLocked(true);
    } else if (p1PicId && !p3PicId) {
      setP3PicId(p1PicId);
      setIsP3PicLocked(true);
    }
  };

  // Quick action: copy P1's PIC to all participants
  const copyP1PicToAll = () => {
    if (!p1PicId) {
      showToast('Peringatan', 'Pilih PIC untuk Peserta 1 terlebih dahulu.', 'warning');
      return;
    }
    setP2PicId(p1PicId);
    setP3PicId(p1PicId);
    const staff = staffUsers.find((s) => s.id === p1PicId);
    showToast('PIC Diselaraskan', `PIC semua peserta disamakan dengan ${staff?.name || 'PIC Peserta 1'}.`, 'success');
  };

  // Active member detection for participant 1
  const selectedMember1 = useMemo(() => members.find((m) => m.id === p1Id), [members, p1Id]);
  const isMember1Active = useMemo(() => {
    if (!selectedMember1?.expired) return false;
    return selectedMember1.expired >= APP_TODAY;
  }, [selectedMember1]);

  // Price calculations
  const rawPrice = cat === 'Bundling' ? (currentBundle ? currentBundle.price : 0) : (currentPackage ? currentPackage.price : 0);
  const loyaltyDiscAmount = (cat === 'Class' && applyMemberDiscount && isMember1Active) ? Math.round(rawPrice * 0.1) : 0;
  const manualDiscValue = Number(discount) || 0;
  const discValue = manualDiscValue + loyaltyDiscAmount;
  const netTotal = Math.max(rawPrice - discValue, 0);

  const isCicilan = paymentType === 'Cicilan';
  const isSplit = paymentType === 'Split';

  // Calculate downPayment
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

  // Cash change calculation
  const cashNum = Number(cashGiven) || 0;
  const cashChange = Math.max(0, cashNum - downPayment);
  const cashShortage = Math.max(0, downPayment - cashNum);

  // Real-time Commission Estimates for Checkout Review
  const salesCommEstimate = useMemo(() => {
    if (cat === 'Bundling' && currentBundle) {
      if (currentBundle.salesCommissionNominal) return currentBundle.salesCommissionNominal;
      const rate = currentBundle.salesCommissionRate || 4;
      return Math.round((netTotal * rate) / 100);
    }
    if (currentPackage) {
      if (currentPackage.salesCommissionNominal) return currentPackage.salesCommissionNominal;
      const rate = currentPackage.salesCommissionRate || (currentPackage.cat === 'Membership' ? 4 : currentPackage.cat === 'Class' ? 4 : 3);
      return Math.round((netTotal * rate) / 100);
    }
    return 0;
  }, [cat, currentBundle, currentPackage, netTotal]);

  const trainerCommEstimate = useMemo(() => {
    if (cat === 'Bundling' && currentBundle) {
      const ptVal = currentBundle.ptComponentValue || 0;
      const rate = currentBundle.commissionRate || currentBundle.trainerCommissionRate || 20;
      return Math.round((ptVal * rate) / 100);
    }
    if (currentPackage && (currentPackage.cat === 'PT' || currentPackage.cat === 'Class')) {
      if (currentPackage.trainerCommissionNominal) return currentPackage.trainerCommissionNominal;
      const rate = currentPackage.trainerCommissionRate || (currentPackage.cat === 'Class' ? 35 : 40);
      return Math.round((netTotal * rate) / 100);
    }
    return 0;
  }, [cat, currentBundle, currentPackage, netTotal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isStoreClosed) {
      showToast('Toko Ditutup', 'Daily closing telah dijalankan hari ini. Pembelian dikunci sementara.', 'error');
      return;
    }

    if (cat === 'Bundling' && !currentBundle) {
      showToast('Peringatan', 'Pilih paket bundling yang tersedia.', 'warning');
      return;
    }

    if (cat !== 'Bundling' && !currentPackage) {
      showToast('Peringatan', 'Pilih paket yang akan dibeli.', 'warning');
      return;
    }

    if (!p1Id) {
      showToast('Peringatan', 'Pilih peserta utama (Peserta 1).', 'warning');
      return;
    }

    if (isCicilan && downPayment <= 0 && netTotal > 0) {
      showToast('Peringatan', 'Nominal DP cicilan harus lebih besar dari Rp 0.', 'warning');
      return;
    }

    if (isSplit) {
      const cAmt = Number(splitCashAmount) || 0;
      const nAmt = Number(splitNonCashAmount) || 0;
      if (cAmt + nAmt !== netTotal) {
        showToast(
          'Split Payment Tidak Sesuai',
          `Total split (${formatRp(cAmt + nAmt)}) harus sama persis dengan total tagihan (${formatRp(netTotal)}).`,
          'warning'
        );
        return;
      }
    }

    if (type === 'Couple' && !p2Id) {
      showToast('Peringatan', 'Paket Couple membutuhkan Peserta 2.', 'warning');
      return;
    }

    if (type === 'Trio' && (!p2Id || !p3Id)) {
      showToast('Peringatan', 'Paket Trio membutuhkan Peserta 2 dan Peserta 3.', 'warning');
      return;
    }

    // Effective PIC assignments per participant (honors explicitly chosen/edited PIC)
    const effectiveP1Pic = picSalesId || p1PicId || currentUser?.id || 'S01';
    const effectiveP2Pic = p2PicId || effectiveP1Pic;
    const effectiveP3Pic = p3PicId || effectiveP1Pic;

    // Check unique participants
    const chosenIds = [p1Id, p2Id, p3Id].filter(Boolean);
    if (new Set(chosenIds).size !== chosenIds.length) {
      showToast('Duplikasi Peserta', 'Peserta 1, 2, dan 3 tidak boleh orang yang sama.', 'error');
      return;
    }

    // Prepare updated members with dedicated PICs
    const updatedMembersList: Member[] = [];
    chosenIds.forEach((mId) => {
      const existing = members.find((m) => m.id === mId);
      if (existing) {
        // Dedicated PIC for this participant
        const assignedPicId = mId === p1Id ? effectiveP1Pic : mId === p2Id ? effectiveP2Pic : effectiveP3Pic;
        const assignedStaff = staffUsers.find((s) => s.id === assignedPicId);

        let updatedMember: Member = {
          ...existing,
          picId: syncMemberPic ? (assignedPicId || existing.picId) : existing.picId,
          picName: syncMemberPic ? (assignedStaff ? assignedStaff.name : (existing.picName || '')) : (existing.picName || ''),
          isPicLocked: true
        };

        if (cat === 'Bundling') {
          // Extend membership and add PT sessions automatically
          const currentExp = new Date(existing.expired + 'T00:00:00');
          const todayDate = new Date(APP_TODAY + 'T00:00:00');
          const baseDate = currentExp > todayDate ? currentExp : todayDate;
          const memItem = currentBundle.items.find((i) => i.itemType === 'MEMBERSHIP');
          const durationDays = currentBundle.durationDays || memItem?.duration || 30;
          baseDate.setDate(baseDate.getDate() + durationDays);
          const newExp = baseDate.toISOString().split('T')[0];

          const ptItem = currentBundle.items.find((i) => i.itemType === 'PT');
          const addPt = ptItem?.sessionCount || 2;

          updatedMember = {
            ...updatedMember,
            expired: newExp,
            ptQuota: (existing.ptQuota || 0) + addPt,
            followUpStatus: 'SUDAH RENEWAL'
          };
        } else if (cat === 'Membership') {
          // Extend membership
          const currentExp = new Date(existing.expired + 'T00:00:00');
          const todayDate = new Date(APP_TODAY + 'T00:00:00');
          const baseDate = currentExp > todayDate ? currentExp : todayDate;
          baseDate.setDate(baseDate.getDate() + currentPackage.value);
          const newExp = baseDate.toISOString().split('T')[0];

          updatedMember = {
            ...updatedMember,
            expired: newExp,
            followUpStatus: 'SUDAH RENEWAL'
          };
        } else if (cat === 'Class') {
          // Add Studio Class Quota & validity
          const totalSessions = currentPackage.sessionCount || currentPackage.value || 1;
          const sessionsToAdd = isCicilan && classDpPolicy === 'proportional'
            ? Math.max(1, Math.round((totalSessions * downPayment) / (netTotal || 1)))
            : totalSessions;

          const currentClassExp = existing.classPackageExpired
            ? new Date(existing.classPackageExpired + 'T00:00:00')
            : null;
          const todayDate = new Date(APP_TODAY + 'T00:00:00');
          const baseDate = (currentClassExp && currentClassExp > todayDate) ? currentClassExp : todayDate;
          const daysToAdd = currentPackage.validityDays || 30;
          baseDate.setDate(baseDate.getDate() + daysToAdd);
          const newClassExp = baseDate.toISOString().split('T')[0];

          updatedMember = {
            ...updatedMember,
            classQuota: (existing.classQuota || 0) + sessionsToAdd,
            classPackageName: currentPackage.name,
            classPackageExpired: newClassExp,
            classCategoryAllowed: currentPackage.classCategory || 'Semua Kelas',
            followUpStatus: 'AKTIF KELAS'
          };
        } else {
          // Add PT Quota
          updatedMember = {
            ...updatedMember,
            ptQuota: (existing.ptQuota || 0) + currentPackage.value
          };
        }
        updatedMembersList.push(updatedMember);
      }
    });

    // Create Transaction
    const dueDateDate = new Date(APP_TODAY + 'T00:00:00');
    dueDateDate.setDate(dueDateDate.getDate() + 40);
    const dueDateStr = dueDateDate.toISOString().split('T')[0];

    const customerNames = updatedMembersList.map((m) => m.name).join(', ');

    // Participant-PIC pairing summary
    const participantsDetail = updatedMembersList.map((m) => {
      const staff = staffUsers.find((s) => s.id === m.picId);
      return {
        memberId: m.id,
        memberName: m.name,
        picId: m.picId,
        picName: staff?.name || m.picName || '-'
      };
    });

    // Determine closing PICs for sales lead attribution
    let closingPicIds: string[] = [];
    if (type === 'Personal') {
      closingPicIds = [effectiveP1Pic].filter(Boolean);
    } else if (customClosingPicId && customClosingPicId !== 'combined') {
      closingPicIds = [customClosingPicId];
    } else if (type === 'Couple') {
      closingPicIds = [effectiveP1Pic, effectiveP2Pic].filter(Boolean);
    } else {
      closingPicIds = [effectiveP1Pic, effectiveP2Pic, effectiveP3Pic].filter(Boolean);
    }

    if (closingPicIds.length === 0) {
      closingPicIds = [currentUser?.id || 'S01'];
    }

    const closingPicNames = closingPicIds
      .map((pid) => staffUsers.find((s) => s.id === pid)?.name || pid)
      .join(', ');

    const schemeLabel = isCicilan
      ? `Cicilan DP ${formatRp(downPayment)} (Sisa Piutang ${formatRp(sisaCicilan)})`
      : isSplit
      ? `Split Payment (Tunai ${formatRp(Number(splitCashAmount))} + ${splitNonCashMethod} ${formatRp(Number(splitNonCashAmount))})`
      : `Lunas via ${paymentMethod}`;

    const effectiveMethod = isSplit ? 'Split Payment' : paymentMethod;
    const effectiveStatus: Transaction['status'] = isCicilan ? (dpPercent === 50 ? 'DP 50%' : 'BELUM LUNAS') : 'Paid';

    const newTrx: Transaction = {
      id: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
      date: APP_TODAY,
      time: getTimestamp(),
      type: cat,
      bundleId: cat === 'Bundling' && currentBundle ? currentBundle.bundleId : undefined,
      bundleCode: cat === 'Bundling' && currentBundle ? currentBundle.bundleCode : undefined,
      desc: cat === 'Bundling' && currentBundle
        ? `Paket Bundling ${currentBundle.bundleName} (${currentBundle.bundleCode}) [${schemeLabel}]`
        : cat === 'Class' && currentPackage
        ? `Paket Kelas Studio ${currentPackage.name} (${currentPackage.value} Sesi) [${schemeLabel}]`
        : `Paket ${currentPackage ? currentPackage.name : ''} [${schemeLabel}]`,
      customer: customerNames,
      amount: netTotal,
      amountPaid: downPayment,
      amountRemaining: sisaCicilan,
      dueDate: isCicilan ? dueDateStr : '-',
      cogs: 0,
      profit: downPayment,
      method: effectiveMethod,
      status: effectiveStatus,
      cashier: currentUser?.name || 'Kasir',
      bankDest: paymentMethod === 'Transfer' || (isSplit && splitNonCashMethod === 'Transfer') ? 'Mandiri' : undefined,
      classPackageId: cat === 'Class' && currentPackage ? currentPackage.id : undefined,
      classSessionsGranted: cat === 'Class' && currentPackage ? (isCicilan && classDpPolicy === 'proportional' ? Math.max(1, Math.round(((currentPackage.sessionCount || currentPackage.value) * downPayment) / (netTotal || 1))) : (currentPackage.sessionCount || currentPackage.value)) : undefined,
      classValidityDays: cat === 'Class' && currentPackage ? (currentPackage.validityDays || 30) : undefined,
      paymentScheme: isCicilan ? 'DP_CICILAN' : isSplit ? 'SPLIT_PAYMENT' : 'LUNAS',
      splitCashAmount: isSplit ? Number(splitCashAmount) : undefined,
      splitNonCashAmount: isSplit ? Number(splitNonCashAmount) : undefined,
      splitNonCashMethod: isSplit ? splitNonCashMethod : undefined,
      itemsJSON: JSON.stringify([
        cat === 'Bundling' && currentBundle
          ? {
              name: currentBundle.bundleName,
              code: currentBundle.bundleCode,
              bundleId: currentBundle.bundleId,
              bundleType: currentBundle.bundleType,
              price: currentBundle.price,
              qty: 1,
              items: currentBundle.items,
              participants: participantsDetail
            }
          : {
              name: currentPackage ? currentPackage.name : '',
              category: cat,
              price: currentPackage ? currentPackage.price : 0,
              sessions: currentPackage?.value,
              validityDays: currentPackage?.validityDays || 30,
              qty: 1,
              participants: participantsDetail
            }
      ]),
      picId: closingPicIds.join(', '),
      picIds: closingPicIds,
      picNames: closingPicNames,
      trxCategory: trxType,
      initialCashPaid: downPayment
    };

    onPurchasePackage(newTrx, updatedMembersList);
    const targetName = cat === 'Bundling' ? (currentBundle?.bundleName || 'Bundling') : (currentPackage?.name || 'Paket');
    showToast(
      'Pembelian Berhasil',
      `Paket ${targetName} untuk ${customerNames} berhasil diproses [${schemeLabel}].`,
      'success'
    );

    // Reset form
    setP1Id('');
    setP2Id('');
    setP3Id('');
    setP1PicId('');
    setP2PicId('');
    setP3PicId('');
    setPicSalesId('');
    setDiscount('0');
    setPaymentType('Lunas');
    setPaymentMethod('Tunai');
    setDpPercent(50);
    setCustomDpAmount('');
    setSplitCashAmount('');
    setSplitNonCashAmount('');
    setCashGiven('');
    setApplyMemberDiscount(false);
  };

  const handleEditPackage = (pkg: PackageItem) => {
    setEditingPkgId(pkg.id);
    setNewPkgCat(pkg.cat);
    setNewPkgType(pkg.type);
    setNewPkgName(pkg.name);
    setNewPkgPrice(String(pkg.price));
    setNewPkgValue(String(pkg.value));
    setCommissionType(pkg.commissionType || 'PERCENT');
    setSalesCommissionRate(String(pkg.salesCommissionRate ?? (pkg.cat === 'Membership' ? 4 : 3)));
    setSalesCommissionNominal(String(pkg.salesCommissionNominal ?? (pkg.cat === 'Membership' ? Math.round(pkg.price * 0.04) : Math.round(pkg.price * 0.03))));
    setTrainerCommissionRate(String(pkg.trainerCommissionRate ?? (pkg.cat === 'PT' ? 40 : 0)));
    setTrainerCommissionNominal(String(pkg.trainerCommissionNominal ?? (pkg.cat === 'PT' ? Math.round(pkg.price * 0.4) : 0)));
    setTrainerCommissionPerSession(String(pkg.trainerCommissionPerSession ?? (pkg.cat === 'PT' && pkg.value ? Math.round((pkg.price * 0.4) / pkg.value) : 0)));
    setProductBonusNominal(String(pkg.productBonusNominal || 0));
    setCommissionNotes(pkg.commissionNotes || '');
    setPkgModalTab('form');
  };

  const handleResetPackageForm = () => {
    setEditingPkgId(null);
    setNewPkgCat('Membership');
    setNewPkgType('Personal');
    setNewPkgName('');
    setNewPkgPrice('');
    setNewPkgValue('');
    setCommissionType('PERCENT');
    setSalesCommissionRate('4');
    setSalesCommissionNominal('20000');
    setTrainerCommissionRate('0');
    setTrainerCommissionNominal('0');
    setTrainerCommissionPerSession('0');
    setProductBonusNominal('0');
    setCommissionNotes('');
  };

  // Smart Commission Advisor Presets
  const applyCommissionPreset = (presetKey: 'industry' | 'high_incentive' | 'flat_session' | 'member_only' | 'low_margin') => {
    const priceNum = Number(newPkgPrice) || 600000;
    const valueNum = Number(newPkgValue) || 10;
    const isPT = newPkgCat === 'PT';

    if (presetKey === 'industry') {
      if (isPT) {
        setCommissionType('PERCENT');
        setTrainerCommissionRate('40');
        const totalTrainer = Math.round(priceNum * 0.4);
        setTrainerCommissionNominal(String(totalTrainer));
        setTrainerCommissionPerSession(String(Math.round(totalTrainer / (valueNum || 1))));
        setSalesCommissionRate('3');
        setSalesCommissionNominal(String(Math.round(priceNum * 0.03)));
        setCommissionNotes('Standar Industri: Trainer 40% (fee sesi), Sales 3% (closing deal), Margin Gym 57%');
      } else {
        setCommissionType('PERCENT');
        setTrainerCommissionRate('0');
        setTrainerCommissionNominal('0');
        setTrainerCommissionPerSession('0');
        setSalesCommissionRate('4');
        setSalesCommissionNominal(String(Math.round(priceNum * 0.04)));
        setCommissionNotes('Standar Industri Membership: Sales 4% per closing, Trainer 0%, Margin Gym 96%');
      }
      showToast('Saran Diterapkan', 'Preset Rekomendasi Standar Industri berhasil diterapkan.', 'info');
    } else if (presetKey === 'high_incentive') {
      if (isPT) {
        setCommissionType('PERCENT');
        setTrainerCommissionRate('45');
        const totalTrainer = Math.round(priceNum * 0.45);
        setTrainerCommissionNominal(String(totalTrainer));
        setTrainerCommissionPerSession(String(Math.round(totalTrainer / (valueNum || 1))));
        setSalesCommissionRate('5');
        setSalesCommissionNominal(String(Math.round(priceNum * 0.05)));
        setCommissionNotes('Insentif Booster: Trainer 45%, Sales 5%, Margin Gym 50% (Sangat memacu closing agresif)');
      } else {
        setCommissionType('PERCENT');
        setTrainerCommissionRate('0');
        setTrainerCommissionNominal('0');
        setTrainerCommissionPerSession('0');
        setSalesCommissionRate('6');
        setSalesCommissionNominal(String(Math.round(priceNum * 0.06)));
        setCommissionNotes('Insentif Booster: Sales 6% per closing untuk memacu akuisisi member baru');
      }
      showToast('Saran Diterapkan', 'Preset Insentif Tinggi / Booster berhasil diterapkan.', 'info');
    } else if (presetKey === 'flat_session') {
      if (isPT) {
        setCommissionType('NOMINAL');
        const perSess = 45000;
        const totalTrainer = perSess * valueNum;
        setTrainerCommissionPerSession(String(perSess));
        setTrainerCommissionNominal(String(totalTrainer));
        setTrainerCommissionRate(String(Math.round((totalTrainer / (priceNum || 1)) * 100)));
        setSalesCommissionNominal('25000');
        setSalesCommissionRate(String(Math.round((25000 / (priceNum || 1)) * 100)));
        setCommissionNotes('Flat Per Sesi: Trainer Rp 45.000 / sesi, Sales Rp 25.000 flat per paket');
      } else {
        setCommissionType('NOMINAL');
        setTrainerCommissionRate('0');
        setTrainerCommissionNominal('0');
        setTrainerCommissionPerSession('0');
        setSalesCommissionNominal('30000');
        setSalesCommissionRate(String(Math.round((30000 / (priceNum || 1)) * 100)));
        setCommissionNotes('Flat Membership: Kasir/Sales Rp 30.000 pasti per transaksi');
      }
      showToast('Saran Diterapkan', 'Preset Komisi Flat Sederhana berhasil diterapkan.', 'info');
    } else if (presetKey === 'low_margin') {
      if (isPT) {
        setCommissionType('PERCENT');
        setTrainerCommissionRate('30');
        const totalTrainer = Math.round(priceNum * 0.3);
        setTrainerCommissionNominal(String(totalTrainer));
        setTrainerCommissionPerSession(String(Math.round(totalTrainer / (valueNum || 1))));
        setSalesCommissionRate('2');
        setSalesCommissionNominal(String(Math.round(priceNum * 0.02)));
        setCommissionNotes('Paket Promo / Low Margin: Trainer 30%, Sales 2%, Margin Gym 68%');
      } else {
        setCommissionType('PERCENT');
        setTrainerCommissionRate('0');
        setTrainerCommissionNominal('0');
        setTrainerCommissionPerSession('0');
        setSalesCommissionRate('2');
        setSalesCommissionNominal(String(Math.round(priceNum * 0.02)));
        setCommissionNotes('Paket Promo Diskon: Sales 2% per closing');
      }
      showToast('Saran Diterapkan', 'Preset Paket Promo / Low Margin berhasil diterapkan.', 'info');
    } else if (presetKey === 'member_only') {
      setNewPkgCat('Membership');
      setCommissionType('PERCENT');
      setTrainerCommissionRate('0');
      setTrainerCommissionNominal('0');
      setTrainerCommissionPerSession('0');
      setSalesCommissionRate('5');
      setSalesCommissionNominal(String(Math.round(priceNum * 0.05)));
      setCommissionNotes('Akses Mandiri: Komisi Sales 5%, Tanpa Komisi Trainer (Margin Gym 95%)');
      showToast('Saran Diterapkan', 'Preset Khusus Membership Mandiri berhasil diterapkan.', 'info');
    }
  };

  const handleSaveMasterPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName || !newPkgPrice || !newPkgValue) {
      showToast('Data Tidak Lengkap', 'Mohon lengkapi Nama Paket, Harga, dan Value.', 'warning');
      return;
    }

    const priceNum = Number(newPkgPrice);
    const valueNum = Number(newPkgValue);
    const sRate = Number(salesCommissionRate) || 0;
    const sNom = Number(salesCommissionNominal) || Math.round((priceNum * sRate) / 100);
    const tRate = Number(trainerCommissionRate) || 0;
    const tNom = Number(trainerCommissionNominal) || Math.round((priceNum * tRate) / 100);
    const tPerSess = Number(trainerCommissionPerSession) || (newPkgCat === 'PT' && valueNum ? Math.round(tNom / valueNum) : 0);

    const savedPkg: PackageItem = {
      id: editingPkgId || ('PKG-' + Date.now()),
      cat: newPkgCat,
      type: newPkgType,
      name: newPkgName.trim(),
      price: priceNum,
      value: valueNum,
      commissionType,
      salesCommissionRate: sRate,
      salesCommissionNominal: sNom,
      trainerCommissionRate: tRate,
      trainerCommissionNominal: tNom,
      trainerCommissionPerSession: tPerSess,
      productBonusNominal: Number(productBonusNominal) || 0,
      commissionNotes: commissionNotes.trim()
    };

    if (editingPkgId && onUpdatePackage) {
      onUpdatePackage(savedPkg);
      showToast('Paket Diperbarui', `Master paket ${savedPkg.name} berhasil diperbarui beserta skema komisinya.`, 'success');
    } else {
      onAddPackage(savedPkg);
      showToast('Paket Dibuat', `Master paket ${savedPkg.name} berhasil ditambahkan dengan skema komisi.`, 'success');
    }

    handleResetPackageForm();
    setIsPkgModalOpen(false);
  };

  const handleDeletePackageConfirm = (pkg: PackageItem) => {
    if (packages.length <= 1) {
      showToast('Gagal Menghapus', 'Minimal harus ada 1 paket master dalam sistem.', 'warning');
      return;
    }
    if (confirm(`Yakin ingin menghapus master paket "${pkg.name}"?`)) {
      if (onDeletePackage) {
        onDeletePackage(pkg.id);
        showToast('Paket Dihapus', `Paket ${pkg.name} berhasil dihapus.`, 'info');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Crown className="w-5 h-5 text-orange-500" /> Pembelian Paket Membership, PT & Bundling
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dukungan paket Solo / Couple / Trio, Paket Bundling (VIP PLUS), serta fasilitas cicilan 2x (DP 50%).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenBundlingManager && (
            <button
              type="button"
              onClick={onOpenBundlingManager}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 shadow-sm"
            >
              <Gift className="w-4 h-4 text-amber-400" /> Master Bundling
            </button>
          )}
          {onOpenBundlingReports && (
            <button
              type="button"
              onClick={onOpenBundlingReports}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-500/30 transition flex items-center gap-1.5 shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Laporan & Komisi
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              handleResetPackageForm();
              setPkgModalTab('form');
              setIsPkgModalOpen(true);
            }}
            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-orange-500/30 transition flex items-center gap-1.5 shadow-sm"
          >
            <Settings className="w-4 h-4 text-orange-400" /> Master Paket & Komisi
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category & Type Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                  Kategori Layanan
                </label>
                <select
                  value={cat}
                  onChange={(e) => {
                    setCat(e.target.value as any);
                    setSelectedPkgIndex(0);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
                >
                  <option value="Membership">Akses Gym (Membership)</option>
                  <option value="PT">Sesi Personal Trainer (PT)</option>
                  <option value="Class">🧘 Paket Kelas Studio (Zumba, Yoga, Pilates, Drop-In)</option>
                  <option value="Bundling">🎁 Paket Bundling (VIP PLUS, Gold, dll)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                  Tipe Peserta
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as any);
                    setSelectedPkgIndex(0);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
                >
                  <option value="Personal">Solo / Personal (1 Orang)</option>
                  <option value="Couple">Couple / Duo (2 Orang)</option>
                  <option value="Trio">Trio / Squad (3 Orang)</option>
                </select>
              </div>
            </div>

            {/* Package Choice */}
            {cat === 'Bundling' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                    Pilih Paket Bundling Aktif
                  </label>
                  {onOpenBundlingManager && (
                    <button
                      type="button"
                      onClick={onOpenBundlingManager}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
                    >
                      <Settings className="w-3.5 h-3.5" /> Kelola Bundling
                    </button>
                  )}
                </div>
                <select
                  value={currentBundle?.bundleId || ''}
                  onChange={(e) => setSelectedBundleId(e.target.value)}
                  className="w-full bg-zinc-950 border border-amber-500/70 rounded-xl px-4 py-3.5 text-sm font-black text-amber-400 outline-none shadow-inner"
                >
                  {activeBundles.map((b) => (
                    <option key={b.bundleId} value={b.bundleId}>
                      {b.bundleName} ({b.bundleCode}) — {formatRp(b.price)} [{b.bundleType.replace(/_/g, ' ')}]
                    </option>
                  ))}
                </select>

                {/* Preview Bundle Components Card */}
                {currentBundle && (
                  <div className="bg-gradient-to-br from-amber-950/30 to-zinc-950 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-400" /> Benefit Termasuk dalam {currentBundle.bundleName}:
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                        {currentBundle.bundleCode}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs">{currentBundle.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Membership Gym</span>
                        <span className="text-xs font-bold text-white">
                          {(() => {
                            const mem = currentBundle.items.find((i) => i.itemType === 'MEMBERSHIP');
                            const days = currentBundle.durationDays || mem?.duration;
                            return days ? `${days} Hari (${mem?.durationLabel || Math.round(days / 30) + ' Bln'})` : 'Tidak Ada';
                          })()}
                        </span>
                      </div>
                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Personal Training</span>
                        <span className="text-xs font-bold text-white">
                          {(() => {
                            const pt = currentBundle.items.find((i) => i.itemType === 'PT');
                            return pt ? `${pt.sessionCount} Sesi PT` : 'Tidak Ada';
                          })()}
                        </span>
                      </div>
                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Basis Komisi PT</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {formatRp(currentBundle.ptComponentValue || 0)} ({currentBundle.commissionRate || currentBundle.trainerCommissionRate || 20}%)
                        </span>
                      </div>
                    </div>
                    {currentBundle.items.some((i) => i.itemType === 'PRODUCT') && (
                      <div className="text-[11px] text-zinc-300 bg-zinc-900/60 rounded-xl px-3 py-1.5 border border-zinc-800/80 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Bonus Produk:{' '}
                          {currentBundle.items
                            .filter((i) => i.itemType === 'PRODUCT')
                            .map((i) => `${i.productName || i.name || 'Produk'} (${i.productQty || i.quantity || 1} pcs)`)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                    Pilih Paket
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentPackage) {
                        handleEditPackage(currentPackage);
                      } else {
                        handleResetPackageForm();
                      }
                      setIsPkgModalOpen(true);
                    }}
                    className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 transition"
                  >
                    <Settings className="w-3.5 h-3.5" /> Atur Komisi Paket
                  </button>
                </div>
                <select
                  value={selectedPkgIndex}
                  onChange={(e) => {
                    setSelectedPkgIndex(Number(e.target.value));
                  }}
                  className="w-full bg-zinc-950 border border-orange-500/70 rounded-xl px-4 py-3.5 text-sm font-black text-orange-400 outline-none shadow-inner"
                >
                  {filteredPackages.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.name} — {formatRp(p.price)} ({p.value} {p.cat === 'Membership' ? 'Hari' : 'Sesi'})
                    </option>
                  ))}
                </select>

                {/* Live Commission Breakdown for selected package */}
                {currentPackage && (
                  <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200 flex items-center gap-1.5 text-[11px]">
                        <Percent className="w-3.5 h-3.5 text-orange-400" />
                        Alokasi Komisi: <strong className="text-white">{currentPackage.name}</strong>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                        {currentPackage.cat === 'PT'
                          ? `${currentPackage.value} Sesi PT`
                          : currentPackage.cat === 'Class'
                          ? `${currentPackage.sessionCount || currentPackage.value} Sesi Kelas (${currentPackage.validityDays || 30} Hari)`
                          : `${currentPackage.value} Hari Akses`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" /> Komisi Sales Kasir
                        </span>
                        <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                          {currentPackage.salesCommissionNominal
                            ? formatRp(currentPackage.salesCommissionNominal)
                            : `${currentPackage.salesCommissionRate || (currentPackage.cat === 'Membership' ? 4 : 3)}% (${formatRp(Math.round(currentPackage.price * ((currentPackage.salesCommissionRate || (currentPackage.cat === 'Membership' ? 4 : 3)) / 100)))})`}
                        </span>
                        <span className="text-[9px] text-zinc-500">Closing sales reward</span>
                      </div>

                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold flex items-center gap-1">
                          <Dumbbell className="w-3 h-3 text-orange-400" /> {currentPackage.cat === 'Class' ? 'Komisi Instruktur Kelas' : 'Komisi Trainer (PT)'}
                        </span>
                        <span className="text-xs font-bold text-orange-400 mt-0.5 block">
                          {currentPackage.cat === 'PT'
                            ? currentPackage.trainerCommissionNominal
                              ? `${formatRp(currentPackage.trainerCommissionNominal)} (${formatRp(currentPackage.trainerCommissionPerSession || Math.round(currentPackage.trainerCommissionNominal / (currentPackage.value || 1)))}/sesi)`
                              : `${currentPackage.trainerCommissionRate || 40}% (${formatRp(Math.round(currentPackage.price * ((currentPackage.trainerCommissionRate || 40) / 100)))})`
                            : currentPackage.cat === 'Class'
                            ? currentPackage.trainerCommissionNominal
                              ? `${formatRp(currentPackage.trainerCommissionNominal)} (${formatRp(currentPackage.trainerCommissionPerSession || Math.round(currentPackage.trainerCommissionNominal / (currentPackage.value || 1)))}/sesi)`
                              : `${currentPackage.trainerCommissionRate || 35}% (${formatRp(Math.round(currentPackage.price * ((currentPackage.trainerCommissionRate || 35) / 100)))})`
                            : '0% (Akses Mandiri)'}
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          {currentPackage.cat === 'PT'
                            ? 'Fee sesi pelatih'
                            : currentPackage.cat === 'Class'
                            ? `Fee kelas studio (${currentPackage.classCategory || 'Semua Kelas'})`
                            : 'Tanpa trainer'}
                        </span>
                      </div>

                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-sky-400" /> Estimasi Margin Gym
                        </span>
                        <span className="text-xs font-bold text-sky-400 mt-0.5 block">
                          {(() => {
                            const sComm = currentPackage.salesCommissionNominal || Math.round(currentPackage.price * ((currentPackage.salesCommissionRate || (currentPackage.cat === 'Membership' ? 4 : 3)) / 100));
                            const tComm = currentPackage.cat === 'PT' ? (currentPackage.trainerCommissionNominal || Math.round(currentPackage.price * ((currentPackage.trainerCommissionRate || 40) / 100))) : 0;
                            const netGym = Math.max(0, currentPackage.price - sComm - tComm);
                            const netPct = Math.round((netGym / currentPackage.price) * 100);
                            return `${formatRp(netGym)} (${netPct}%)`;
                          })()}
                        </span>
                        <span className="text-[9px] text-zinc-500">Margin operasional gym</span>
                      </div>
                    </div>

                    {currentPackage.commissionNotes && (
                      <p className="text-[10px] text-zinc-400 italic bg-zinc-900/50 rounded-lg p-2 border border-zinc-800/60">
                        💡 Catatan: {currentPackage.commissionNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Participants & Dedicated PIC Section */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Pendaftaran Peserta & Alokasi PIC ({cat === 'PT' ? 'Sesi PT' : 'Akses Gym'})
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {type === 'Personal'
                      ? '1 peserta didampingi 1 PIC/Trainer khusus.'
                      : `Paket ${type}: 1 PIC untuk setiap peserta agar pendampingan latihan dan evaluasi lebih fokus.`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                    {type === 'Personal' ? '1 Peserta • 1 PIC' : type === 'Couple' ? '2 Peserta • 2 PIC' : '3 Peserta • 3 PIC'}
                  </span>
                  {(type === 'Couple' || type === 'Trio') && p1PicId && (
                    <button
                      type="button"
                      onClick={copyP1PicToAll}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-orange-500/60 text-zinc-300 hover:text-white transition flex items-center gap-1.5 shadow-sm"
                      title="Salin PIC Peserta 1 ke Peserta 2 & 3"
                    >
                      <Copy className="w-3 h-3 text-orange-400" /> Samakan PIC
                    </button>
                  )}
                </div>
              </div>

              {/* Pemisahan Pembelian PT & Penugasan Trainer Notice */}
              {cat === 'PT' && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="leading-snug">
                    <p className="font-bold text-amber-200">SOP Pemisahan Tugas PT & Assignment Trainer:</p>
                    <p className="text-[11px] text-amber-300/90 mt-0.5">
                      Kasir/Sales hanya mencatat penjualan & pembayaran paket PT. Paket yang dibeli akan otomatis berstatus <strong>WAITING_ASSIGNMENT</strong> dan masuk ke <strong>Antrian PT Leader</strong> untuk penugasan pelatih resmi.
                    </p>
                  </div>
                </div>
              )}

              {/* Multi-Participant Notice */}
              {(type === 'Couple' || type === 'Trio') && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                  <Users className="w-4 h-4 text-orange-400 shrink-0" />
                  <p className="leading-snug">
                    <strong>Paket {type}:</strong> {type === 'Couple' ? '2' : '3'} peserta terdaftar dalam 1 paket PT bersama. Leader PT nantinya dapat menugaskan pelatih khusus yang menangani peserta paket ini.
                  </p>
                </div>
              )}

              {/* Peserta 1 (Utama) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-zinc-950 font-black text-[10px] flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-white">Peserta 1 (Utama)</span>
                  </div>
                  <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    Wajib
                  </span>
                </div>

                <SearchableMemberSelect
                  id="searchable-p1-select"
                  label="Pilih Member Peserta 1"
                  required
                  placeholder="Ketik nama, ID member (contoh: M001), atau nomor HP..."
                  members={members}
                  selectedMemberId={p1Id}
                  onSelectMember={handleP1Change}
                  excludeMemberIds={[p2Id, p3Id].filter(Boolean)}
                />

                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between mb-1.5 ml-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      {cat === 'Membership'
                        ? 'PIC Penanggung Jawab Member (Front Desk / Sales)'
                        : cat === 'PT'
                        ? 'PIC Sales / Consultant Closing (Kasir/Sales)'
                        : 'PIC Penanggung Jawab & Trainer Peserta 1'}{' '}
                      <span className="text-orange-400">*</span>
                    </label>
                    {p1PicId && (
                      <div className="flex items-center gap-1.5">
                        {isP1PicLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Lock className="w-3 h-3 text-amber-400" /> Terkunci
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Unlock className="w-3 h-3 text-emerald-400" /> Terbuka
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isP1PicLocked) {
                              handleRequestUnlockPic('p1');
                            } else {
                              setIsP1PicLocked(true);
                              showToast('PIC Dikunci 🔒', 'Pilihan PIC Peserta 1 dikunci.', 'info');
                            }
                          }}
                          className="text-[10px] text-zinc-400 hover:text-amber-400 font-semibold underline transition ml-1"
                        >
                          {isP1PicLocked ? 'Buka Kunci' : 'Kunci PIC'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={p1PicId}
                      disabled={isP1PicLocked && Boolean(p1PicId)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setP1PicId(val);
                        setPicSalesId(val);
                        if (val) {
                          setIsP1PicLocked(true);
                          const chosen = staffUsers.find((s) => s.id === val);
                          showToast('PIC Terpilih & Terkunci 🔒', `${chosen?.name || 'Staff'} telah dipilih dan otomatis dikunci.`, 'success');
                        }
                      }}
                      required
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition border ${
                        isP1PicLocked && p1PicId
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 cursor-not-allowed opacity-95'
                          : 'bg-zinc-950 border-zinc-700 text-white focus:border-orange-500'
                      }`}
                    >
                      <option value="">-- Pilih PIC Penanggung Jawab --</option>
                      {staffUsers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleName} - Shift {s.shift})
                        </option>
                      ))}
                    </select>
                    {isP1PicLocked && p1PicId && (
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  {isP1PicLocked && p1PicId && (
                    <p className="text-[10px] text-amber-400/90 flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      PIC telah dikunci saat member dipilih agar atribusi aman. Klik <em>Buka Kunci</em> jika ingin mengganti.
                    </p>
                  )}
                </div>
              </div>

              {/* Peserta 2 (Couple & Trio) */}
              {(type === 'Couple' || type === 'Trio') && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-zinc-950 font-black text-[10px] flex items-center justify-center">
                        2
                      </span>
                      <span className="text-xs font-bold text-white">Peserta 2</span>
                    </div>
                    <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      Wajib
                    </span>
                  </div>

                  <SearchableMemberSelect
                    id="searchable-p2-select"
                    label="Pilih Member Peserta 2"
                    required
                    placeholder="Ketik nama, ID member, atau nomor HP Peserta 2..."
                    members={members}
                    selectedMemberId={p2Id}
                    onSelectMember={handleP2Change}
                    excludeMemberIds={[p1Id, p3Id].filter(Boolean)}
                  />

                  <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        {cat === 'PT' ? 'PIC Sales Closing Peserta 2' : 'PIC / Trainer Khusus Peserta 2'} <span className="text-orange-400">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {p1PicId && p2PicId !== p1PicId && (
                          <button
                            type="button"
                            onClick={() => {
                              setP2PicId(p1PicId);
                              setIsP2PicLocked(true);
                            }}
                            className="text-[10px] text-orange-400 hover:text-orange-300 font-bold"
                          >
                            Samakan dg PIC Peserta 1
                          </button>
                        )}
                        {p2PicId && (
                          <div className="flex items-center gap-1.5">
                            {isP2PicLocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Lock className="w-3 h-3 text-amber-400" /> Terkunci
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <Unlock className="w-3 h-3 text-emerald-400" /> Terbuka
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isP2PicLocked) {
                                  handleRequestUnlockPic('p2');
                                } else {
                                  setIsP2PicLocked(true);
                                  showToast('PIC Dikunci 🔒', 'Pilihan PIC Peserta 2 dikunci.', 'info');
                                }
                              }}
                              className="text-[10px] text-zinc-400 hover:text-amber-400 font-semibold underline transition ml-1"
                            >
                              {isP2PicLocked ? 'Buka Kunci' : 'Kunci PIC'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={p2PicId}
                        disabled={isP2PicLocked && Boolean(p2PicId)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setP2PicId(val);
                          if (val) {
                            setIsP2PicLocked(true);
                            const chosen = staffUsers.find((s) => s.id === val);
                            showToast('PIC Terpilih & Terkunci 🔒', `${chosen?.name || 'Staff'} telah dipilih dan otomatis dikunci.`, 'success');
                          }
                        }}
                        required
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition border ${
                          isP2PicLocked && p2PicId
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 cursor-not-allowed opacity-95'
                            : 'bg-zinc-950 border-zinc-700 text-white focus:border-orange-500'
                        }`}
                      >
                        <option value="">-- Pilih PIC / Trainer Peserta 2 --</option>
                        {staffUsers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.roleName} - Shift {s.shift})
                          </option>
                        ))}
                      </select>
                      {isP2PicLocked && p2PicId && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Peserta 3 (Trio) */}
              {type === 'Trio' && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-zinc-950 font-black text-[10px] flex items-center justify-center">
                        3
                      </span>
                      <span className="text-xs font-bold text-white">Peserta 3</span>
                    </div>
                    <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      Wajib
                    </span>
                  </div>

                  <SearchableMemberSelect
                    id="searchable-p3-select"
                    label="Pilih Member Peserta 3"
                    required
                    placeholder="Ketik nama, ID member, atau nomor HP Peserta 3..."
                    members={members}
                    selectedMemberId={p3Id}
                    onSelectMember={handleP3Change}
                    excludeMemberIds={[p1Id, p2Id].filter(Boolean)}
                  />

                  <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        {cat === 'PT' ? 'PIC Sales Closing Peserta 3' : 'PIC / Trainer Khusus Peserta 3'} <span className="text-orange-400">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {p1PicId && p3PicId !== p1PicId && (
                          <button
                            type="button"
                            onClick={() => {
                              setP3PicId(p1PicId);
                              setIsP3PicLocked(true);
                            }}
                            className="text-[10px] text-orange-400 hover:text-orange-300 font-bold"
                          >
                            Samakan dg PIC Peserta 1
                          </button>
                        )}
                        {p3PicId && (
                          <div className="flex items-center gap-1.5">
                            {isP3PicLocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Lock className="w-3 h-3 text-amber-400" /> Terkunci
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <Unlock className="w-3 h-3 text-emerald-400" /> Terbuka
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isP3PicLocked) {
                                  handleRequestUnlockPic('p3');
                                } else {
                                  setIsP3PicLocked(true);
                                  showToast('PIC Dikunci 🔒', 'Pilihan PIC Peserta 3 dikunci.', 'info');
                                }
                              }}
                              className="text-[10px] text-zinc-400 hover:text-amber-400 font-semibold underline transition ml-1"
                            >
                              {isP3PicLocked ? 'Buka Kunci' : 'Kunci PIC'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={p3PicId}
                        disabled={isP3PicLocked && Boolean(p3PicId)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setP3PicId(val);
                          if (val) {
                            setIsP3PicLocked(true);
                            const chosen = staffUsers.find((s) => s.id === val);
                            showToast('PIC Terpilih & Terkunci 🔒', `${chosen?.name || 'Staff'} telah dipilih dan otomatis dikunci.`, 'success');
                          }
                        }}
                        required
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition border ${
                          isP3PicLocked && p3PicId
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 cursor-not-allowed opacity-95'
                            : 'bg-zinc-950 border-zinc-700 text-white focus:border-orange-500'
                        }`}
                      >
                        <option value="">-- Pilih PIC / Trainer Peserta 3 --</option>
                        {staffUsers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.roleName} - Shift {s.shift})
                          </option>
                        ))}
                      </select>
                      {isP3PicLocked && p3PicId && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sales PIC and Transaction Type */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                    Tipe Transaksi
                  </label>
                  <select
                    value={trxType}
                    onChange={(e) => setTrxType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                  >
                    <option value="NEW MEMBERSHIP">New Membership (Member Baru)</option>
                    <option value="RENEWAL">Renewal (Perpanjangan)</option>
                    <option value="UPGRADE">Upgrade Paket</option>
                  </select>
                </div>

                {type === 'Personal' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        PIC Penanggung Jawab / Closing Penjualan <span className="text-orange-400">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {isP1PicLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Lock className="w-3 h-3 text-amber-400" /> Terkunci
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Unlock className="w-3 h-3 text-emerald-400" /> Terbuka
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isP1PicLocked) {
                              handleRequestUnlockPic('closing');
                            } else {
                              setIsP1PicLocked(true);
                              showToast('PIC Dikunci 🔒', 'Pilihan PIC dikunci.', 'info');
                            }
                          }}
                          className="text-[10px] text-zinc-400 hover:text-amber-400 font-semibold underline transition ml-1"
                        >
                          {isP1PicLocked ? 'Buka Kunci' : 'Kunci PIC'}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={picSalesId || p1PicId || ''}
                        disabled={isP1PicLocked && Boolean(picSalesId || p1PicId)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPicSalesId(val);
                          setP1PicId(val);
                          if (val) {
                            setIsP1PicLocked(true);
                          }
                        }}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition ${
                          isP1PicLocked && Boolean(picSalesId || p1PicId)
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 cursor-not-allowed opacity-95'
                            : 'bg-zinc-950 border-zinc-700 text-white focus:border-orange-500'
                        }`}
                      >
                        <option value="">-- Pilih PIC Penanggung Jawab / Closing --</option>
                        {staffUsers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.roleName} - Shift {s.shift})
                          </option>
                        ))}
                      </select>
                      {isP1PicLocked && Boolean(picSalesId || p1PicId) && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PIC Closing Penjualan untuk Peserta > 1 (Couple & Trio) - Fleksibel Gabung atau Pilih PIC Tertentu */}
              {type !== 'Personal' && (
                <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">
                        PIC Penanggung Jawab / Closing Penjualan
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {customClosingPicId === 'combined'
                          ? `Gabung Semua PIC Peserta (${type === 'Couple' ? '2' : '3'} Orang)`
                          : 'PIC Khusus Dipilih'}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      Dapat diedit atau digabung otomatis
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 ml-1">
                      Pilihan PIC Closing Transaksi
                    </label>
                    <select
                      value={customClosingPicId}
                      onChange={(e) => setCustomClosingPicId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="combined">
                        ⚡ Gabung Seluruh PIC Peserta (Komisi & Evaluasi Dibagi Rata)
                      </option>
                      <optgroup label="Atau Pilih PIC Tunggal Tertentu:">
                        {staffUsers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.roleName} - Shift {s.shift})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {/* PIC Peserta 1 */}
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[9px] text-zinc-400 block uppercase font-bold">Slot Peserta 1</span>
                        <span className="text-xs font-bold text-white truncate block">
                          {staffUsers.find((s) => s.id === p1PicId)?.name || (
                            <span className="text-amber-400/90 text-[11px] font-normal italic">Belum dipilih di slot 1</span>
                          )}
                        </span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">
                        1
                      </span>
                    </div>

                    {/* PIC Peserta 2 */}
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[9px] text-zinc-400 block uppercase font-bold">Slot Peserta 2</span>
                        <span className="text-xs font-bold text-white truncate block">
                          {staffUsers.find((s) => s.id === p2PicId)?.name || (
                            <span className="text-amber-400/90 text-[11px] font-normal italic">Belum dipilih di slot 2</span>
                          )}
                        </span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">
                        2
                      </span>
                    </div>

                    {/* PIC Peserta 3 (if Trio) */}
                    {type === 'Trio' && (
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-[9px] text-zinc-400 block uppercase font-bold">Slot Peserta 3</span>
                          <span className="text-xs font-bold text-white truncate block">
                            {staffUsers.find((s) => s.id === p3PicId)?.name || (
                              <span className="text-amber-400/90 text-[11px] font-normal italic">Belum dipilih di slot 3</span>
                            )}
                          </span>
                        </div>
                        <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">
                          3
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="leading-snug">
                      <span className="font-bold text-white">
                        Penanggung Jawab Closing Tercatat:{' '}
                      </span>
                      <span>
                        {customClosingPicId && customClosingPicId !== 'combined'
                          ? staffUsers.find((s) => s.id === customClosingPicId)?.name || customClosingPicId
                          : [p1PicId, p2PicId, type === 'Trio' ? p3PicId : null]
                              .filter(Boolean)
                              .map((pid) => staffUsers.find((s) => s.id === pid)?.name)
                              .filter(Boolean)
                              .join(' + ') || 'Semua PIC peserta yang dipilih'}
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {customClosingPicId && customClosingPicId !== 'combined'
                          ? 'Closing transaksi dialokasikan ke staf khusus yang dipilih di atas.'
                          : 'Closing transaksi akan tercatat untuk seluruh PIC yang mendampingi peserta, dengan atribusi dan evaluasi komisi yang terbagi rata.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sync Member PIC Option */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
                <input
                  type="checkbox"
                  id="syncMemberPic"
                  checked={syncMemberPic}
                  onChange={(e) => setSyncMemberPic(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 bg-zinc-950 border-zinc-700 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                />
                <label htmlFor="syncMemberPic" className="text-zinc-300 font-medium cursor-pointer">
                  Perbarui PIC penanggung jawab di profil member sesuai pilihan di formulir ini
                </label>
              </div>
            </div>

            {/* Discount Section */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Diskon Pembelian Khusus (Rp)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                />
                {discValue > 0 && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-400">
                    Potongan: -{formatRp(discValue)}
                  </span>
                )}
              </div>
            </div>

            {/* Tipe Bayar (Skema Pembayaran): Lunas vs Cicilan vs Split */}
            <div className="space-y-2 pt-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                Tipe Bayar (Skema Pembayaran)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('Lunas')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    paymentType === 'Lunas'
                      ? 'bg-orange-500/10 border-orange-500 text-white shadow-sm ring-1 ring-orange-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      paymentType === 'Lunas'
                        ? 'bg-orange-500 text-zinc-950 font-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white">Bayar Lunas</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        100% Penuh
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Pelunasan langsung tanpa sisa piutang. Paket & kuota aktif penuh.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('Cicilan')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    paymentType === 'Cicilan'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      paymentType === 'Cicilan'
                        ? 'bg-amber-500 text-zinc-950 font-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white">Fasilitas Cicilan</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Uang Muka (DP)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Bayar DP hari ini, sisa tagihan dicatat di Buku Piutang (40 hari).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('Split');
                    const half = Math.round(netTotal / 2);
                    setSplitCashAmount(String(half));
                    setSplitNonCashAmount(String(netTotal - half));
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    paymentType === 'Split'
                      ? 'bg-blue-500/10 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      paymentType === 'Split'
                        ? 'bg-blue-500 text-zinc-950 font-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white">Split Payment</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Campuran
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Kombinasi Tunai Cash + Nontunai (QRIS / Transfer Mandiri / EDC).
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Cicilan DP Configuration Box */}
            {isCicilan && (
              <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Atur Pilihan Uang Muka (DP)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Total Tagihan: <strong className="text-white">{formatRp(netTotal)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'DP 50% (Standar)', percent: 50 },
                    { label: 'DP 30%', percent: 30 },
                    { label: 'DP 70%', percent: 70 },
                    { label: 'Nominal Kustom', percent: 0 }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        if (opt.percent > 0) {
                          setDpPercent(opt.percent);
                          setCustomDpAmount('');
                        } else {
                          setDpPercent(0);
                          if (!customDpAmount) setCustomDpAmount(String(Math.round(netTotal / 2)));
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                        (opt.percent > 0 && dpPercent === opt.percent && !customDpAmount) ||
                        (opt.percent === 0 && customDpAmount !== '')
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {customDpAmount !== '' && (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Nominal DP Kustom (Rp)
                    </label>
                    <input
                      type="number"
                      value={customDpAmount}
                      onChange={(e) => setCustomDpAmount(e.target.value)}
                      placeholder="Masukkan nominal DP..."
                      max={netTotal}
                      min="0"
                      className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {/* Kebijakan Kuota Sesi Kelas saat Cicilan (Class Quota DP Policy) */}
                {cat === 'Class' && currentPackage && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-2">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                      Kebijakan Aktivasi Sesi Kelas saat Cicilan:
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
                          ✓ Proporsional Sesuai DP (Rekomendasi Aman Gym)
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-0.5 block">
                          Buka {Math.max(1, Math.round(((currentPackage.sessionCount || currentPackage.value) * downPayment) / (netTotal || 1)))} sesi hari ini, sisa {Math.max(0, (currentPackage.sessionCount || currentPackage.value) - Math.max(1, Math.round(((currentPackage.sessionCount || currentPackage.value) * downPayment) / (netTotal || 1))))} sesi dibuka setelah piutang lunas.
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
                          Buka Semua ({currentPackage.sessionCount || currentPackage.value} Sesi Penuh)
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-0.5 block">
                          Semua sesi langsung bisa dibooking member, sisa piutang jatuh tempo 40 hari.
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-zinc-400">DP Dibayar Hari Ini:</span>
                    <span className="font-black text-amber-400 text-sm">{formatRp(downPayment)}</span>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-zinc-400">Sisa Tagihan (Piutang):</span>
                    <span className="font-black text-rose-400 text-sm">{formatRp(sisaCicilan)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Split Payment Configuration Box */}
            {isSplit && (
              <div className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Percent className="w-4 h-4" /> Alokasi Split Payment (Campuran Tunai & Nontunai)
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

                {/* Quick presets */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[10px] uppercase font-bold">Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const half = Math.round(netTotal / 2);
                        setSplitCashAmount(String(half));
                        setSplitNonCashAmount(String(netTotal - half));
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold"
                    >
                      50% : 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitCashAmount('50000');
                        setSplitNonCashAmount(String(Math.max(0, netTotal - 50000)));
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold"
                    >
                      Cash 50k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitCashAmount('100000');
                        setSplitNonCashAmount(String(Math.max(0, netTotal - 100000)));
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold"
                    >
                      Cash 100k
                    </button>
                  </div>

                  <span
                    className={`font-black ${
                      Number(splitCashAmount) + Number(splitNonCashAmount) === netTotal
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    Total: {formatRp(Number(splitCashAmount) + Number(splitNonCashAmount))} / {formatRp(netTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Skema Promo Loyalty Khusus Member Gym Aktif saat Beli Paket Kelas */}
            {cat === 'Class' && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <input
                  type="checkbox"
                  id="applyMemberDiscount"
                  disabled={!isMember1Active}
                  checked={applyMemberDiscount && isMember1Active}
                  onChange={(e) => setApplyMemberDiscount(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-orange-500 bg-zinc-950 border-zinc-700 focus:ring-orange-500 accent-orange-500 cursor-pointer disabled:opacity-40"
                />
                <div>
                  <label
                    htmlFor="applyMemberDiscount"
                    className={`font-bold block cursor-pointer ${
                      isMember1Active ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    💎 Promo Loyalty Member Gym Aktif (Diskon 10% Paket Kelas)
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isMember1Active
                      ? `Member memiliki akses gym aktif (s/d ${selectedMember1?.expired || '-'}). Dapatkan potongan loyalty sebesar -${formatRp(Math.round(rawPrice * 0.1))}.`
                      : 'Hanya dapat diterapkan jika Peserta 1 terdaftar sebagai Member Gym Aktif.'}
                  </p>
                </div>
              </div>
            )}

            {/* Metode Pembayaran (Cash, Transfer, QRIS, EDC) */}
            {!isSplit && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 ml-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {isCicilan
                      ? 'Pilih Metode Pembayaran Uang Muka (DP Hari Ini)'
                      : 'Pilih Metode Pembayaran (Pelunasan Penuh)'}
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Nominal Dibayar:{' '}
                    <strong className="text-orange-400 font-bold">{formatRp(downPayment)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'Tunai', label: 'Cash / Tunai', desc: 'Kas Laci Kasir', icon: Wallet },
                    { id: 'Transfer', label: 'Transfer Bank', desc: 'Rek. Mandiri', icon: Building2 },
                    { id: 'QRIS', label: 'QRIS / QR Code', desc: 'Scan QR Code', icon: QrCode },
                    { id: 'EDC', label: 'Debit / EDC', desc: 'Mesin Kartu', icon: CreditCard }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow-md ring-1 ring-orange-500/50'
                            : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div
                            className={`p-2 rounded-xl ${
                              isSelected ? 'bg-orange-500 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                            {m.label}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Kalkulator Kasir Cepat & Kembalian Uang Tunai */}
            {(paymentMethod === 'Tunai' || (isSplit && Number(splitCashAmount) > 0)) && (
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-orange-400" /> Kalkulator Kasir Uang Tunai & Kembalian
                  </span>
                  <span className="text-zinc-400">
                    Kas Diterima Harus: <strong className="text-white">{formatRp(isSplit ? Number(splitCashAmount) || 0 : downPayment)}</strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="Uang tunai diserahkan (Rp)..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-1 overflow-x-auto">
                    {[
                      { label: 'Uang Pas', amt: isSplit ? Number(splitCashAmount) || 0 : downPayment },
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

                {cashNum > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400">Status Pembayaran Tunai:</span>
                    {cashNum >= (isSplit ? Number(splitCashAmount) || 0 : downPayment) ? (
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

            {/* Total and Submit */}
            <div className="pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-t border-zinc-800">
              <div>
                <span className="text-xs font-bold text-zinc-400 block">Total Yang Dibayar Sekarang:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-orange-400">
                    {formatRp(downPayment)}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    via {paymentMethod === 'Tunai' ? 'Cash / Tunai' : paymentMethod === 'Transfer' ? 'Transfer Mandiri' : paymentMethod === 'QRIS' ? 'QRIS' : 'EDC'}
                  </span>
                </div>
                {isCicilan && (
                  <span className="text-xs text-amber-400 font-semibold block mt-0.5">
                    Sisa piutang: {formatRp(sisaCicilan)} (Jatuh tempo 40 hari)
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Proses Pembayaran & Aktifkan Paket
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Box */}
        <div className="space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-orange-500" /> Ringkasan Paket Terpilih
            </h3>
            {cat === 'Bundling' && currentBundle ? (
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Nama Bundling:</span>
                  <span className="font-bold text-amber-300">{currentBundle.bundleName}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Kode & Tipe:</span>
                  <span className="font-semibold text-white">{currentBundle.bundleCode} ({currentBundle.bundleType.replace(/_/g, ' ')})</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Tipe Peserta:</span>
                  <span className="font-semibold text-white">{type}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Durasi Membership:</span>
                  <span className="font-bold text-white">
                    {(() => {
                      const mem = currentBundle.items.find((i) => i.itemType === 'MEMBERSHIP');
                      const dur = currentBundle.durationDays || mem?.duration;
                      return dur ? `${dur} Hari (${mem?.durationLabel || Math.round(dur / 30) + ' Bulan'})` : '-';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Sesi PT:</span>
                  <span className="font-bold text-white">
                    {(() => {
                      const pt = currentBundle.items.find((i) => i.itemType === 'PT');
                      return pt ? `${pt.sessionCount} Sesi PT` : '-';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Komponen PT:</span>
                  <span className="font-bold text-emerald-400">{formatRp(currentBundle.ptComponentValue || 0)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Harga Paket:</span>
                  <span className="font-bold text-zinc-300">{formatRp(currentBundle.price)}</span>
                </div>
                {discValue > 0 && (
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Diskon:</span>
                    <span className="font-bold text-rose-400">- {formatRp(discValue)}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Total Netto:</span>
                  <span className="font-black text-white">{formatRp(netTotal)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Tipe Bayar:</span>
                  <span className={`font-bold ${isCicilan ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isCicilan ? `Cicilan (DP ${formatRp(downPayment)})` : 'Lunas (100%)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Metode Bayar:</span>
                  <span className="font-bold text-sky-400">
                    {paymentMethod === 'Tunai'
                      ? 'Cash / Tunai'
                      : paymentMethod === 'Transfer'
                      ? 'Transfer Mandiri'
                      : paymentMethod === 'QRIS'
                      ? 'QRIS / QR Code'
                      : 'Debit / EDC'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-300 font-bold">Bayar Kasir Sekarang:</span>
                  <span className="font-black text-orange-400 text-sm">{formatRp(downPayment)}</span>
                </div>
                {isCicilan && (
                  <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-dashed border-zinc-800">
                    <span>Sisa Piutang (40 hari):</span>
                    <span className="font-bold text-rose-400">{formatRp(sisaCicilan)}</span>
                  </div>
                )}
              </div>
            ) : currentPackage ? (
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Nama Paket:</span>
                  <span className="font-bold text-white">{currentPackage.name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Kategori:</span>
                  <span className="font-semibold text-orange-400">{currentPackage.cat}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Tipe Peserta:</span>
                  <span className="font-semibold text-white">{currentPackage.type}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Masa / Sesi:</span>
                  <span className="font-bold text-white">
                    {currentPackage.value} {currentPackage.cat === 'Membership' ? 'Hari' : 'Sesi'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Harga Normal:</span>
                  <span className="font-bold text-zinc-300">{formatRp(currentPackage.price)}</span>
                </div>
                {discValue > 0 && (
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Diskon:</span>
                    <span className="font-bold text-rose-400">- {formatRp(discValue)}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Total Netto:</span>
                  <span className="font-black text-white">{formatRp(netTotal)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Tipe Bayar:</span>
                  <span className={`font-bold ${isCicilan ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isCicilan ? `Cicilan (DP ${formatRp(downPayment)})` : 'Lunas (100%)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Metode Bayar:</span>
                  <span className="font-bold text-sky-400">
                    {paymentMethod === 'Tunai'
                      ? 'Cash / Tunai'
                      : paymentMethod === 'Transfer'
                      ? 'Transfer Mandiri'
                      : paymentMethod === 'QRIS'
                      ? 'QRIS / QR Code'
                      : 'Debit / EDC'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-300 font-bold">Bayar Kasir Sekarang:</span>
                  <span className="font-black text-orange-400 text-sm">{formatRp(downPayment)}</span>
                </div>
                {isCicilan && (
                  <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-dashed border-zinc-800">
                    <span>Sisa Piutang (40 hari):</span>
                    <span className="font-bold text-rose-400">{formatRp(sisaCicilan)}</span>
                  </div>
                )}

                {/* Participant & Dedicated PIC Allocation Breakdown */}
                <div className="border-t border-zinc-800 pt-3 mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Alokasi PIC Peserta ({type}):
                    </span>
                    <span className="text-[10px] text-orange-400 font-semibold">
                      {type === 'Personal' ? '1 Peserta : 1 PIC' : type === 'Couple' ? '2 Peserta : 2 PIC' : '3 Peserta : 3 PIC'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Peserta 1 */}
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                          1
                        </span>
                        <span className="text-zinc-200 font-medium truncate">
                          {members.find((m) => m.id === p1Id)?.name || 'Peserta 1'}
                        </span>
                      </div>
                      <span className="font-bold text-orange-400 text-right shrink-0 truncate max-w-[130px]">
                        PIC: {staffUsers.find((s) => s.id === p1PicId)?.name || (p1Id ? 'Belum pilih' : '-')}
                      </span>
                    </div>

                    {/* Peserta 2 */}
                    {(type === 'Couple' || type === 'Trio') && (
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                            2
                          </span>
                          <span className="text-zinc-200 font-medium truncate">
                            {members.find((m) => m.id === p2Id)?.name || 'Peserta 2'}
                          </span>
                        </div>
                        <span className="font-bold text-orange-400 text-right shrink-0 truncate max-w-[130px]">
                          PIC: {staffUsers.find((s) => s.id === p2PicId)?.name || (p2Id ? 'Belum pilih' : '-')}
                        </span>
                      </div>
                    )}

                    {/* Peserta 3 */}
                    {type === 'Trio' && (
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                            3
                          </span>
                          <span className="text-zinc-200 font-medium truncate">
                            {members.find((m) => m.id === p3Id)?.name || 'Peserta 3'}
                          </span>
                        </div>
                        <span className="font-bold text-orange-400 text-right shrink-0 truncate max-w-[130px]">
                          PIC: {staffUsers.find((s) => s.id === p3PicId)?.name || (p3Id ? 'Belum pilih' : '-')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Joined Closing PICs in Summary */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider">PIC Closing Penjualan:</span>
                      <span className="font-bold text-orange-400">
                        {type === 'Personal' ? '1 PIC' : `Gabungan ${type === 'Couple' ? '2' : '3'} PIC`}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      {type === 'Personal'
                        ? staffUsers.find((s) => s.id === (picSalesId || p1PicId))?.name || (p1Id ? 'Belum pilih' : '-')
                        : [p1PicId, p2PicId, type === 'Trio' ? p3PicId : null]
                            .filter(Boolean)
                            .map((pid) => staffUsers.find((s) => s.id === pid)?.name)
                            .filter(Boolean)
                            .join(' + ') || (p1Id ? 'Sedang memilih PIC...' : '-')}
                    </p>
                  </div>

                  {/* Alokasi Komisi Transaksi */}
                  <div className="mt-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-orange-400" /> Alokasi Komisi Transaksi Ini
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        Otomatis ke Payroll
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-zinc-900 rounded-xl p-2 border border-zinc-800/80">
                        <span className="text-[9px] font-bold text-emerald-400 block uppercase">Komisi Kasir / Sales</span>
                        <span className="text-xs font-black text-emerald-300">
                          {formatRp(salesCommEstimate)}
                        </span>
                        <span className="text-[9px] text-zinc-500 block truncate">
                          {type === 'Personal'
                            ? (staffUsers.find((s) => s.id === (picSalesId || p1PicId))?.name || 'Kasir/Staff')
                            : `${[p1PicId, p2PicId, type === 'Trio' ? p3PicId : null].filter(Boolean).length} Staff Penjual`}
                        </span>
                      </div>

                      <div className="bg-zinc-900 rounded-xl p-2 border border-zinc-800/80">
                        <span className="text-[9px] font-bold text-orange-400 block uppercase">Komisi Trainer (PT)</span>
                        <span className="text-xs font-black text-orange-300">
                          {cat === 'PT' || (cat === 'Bundling' && currentBundle?.ptComponentValue)
                            ? formatRp(trainerCommEstimate)
                            : 'Rp 0 (Mandiri)'}
                        </span>
                        <span className="text-[9px] text-zinc-500 block truncate">
                          {cat === 'PT'
                            ? `${currentPackage?.value || 0} Sesi Pelatih`
                            : cat === 'Bundling'
                            ? `${currentBundle?.items.find((i) => i.itemType === 'PT')?.sessionCount || 0} Sesi Bundling`
                            : 'Akses Gym Mandiri'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 text-xs text-zinc-400 space-y-2">
            <h4 className="font-bold text-zinc-300 uppercase text-[10px] tracking-wider">Aturan Sistem Keuangan</h4>
            <p className="leading-relaxed">
              1. Rekening penerimaan non-tunai diarahkan ke <strong>Bank Mandiri</strong>, sedangkan pembayaran tunai masuk ke kas laci.
            </p>
            <p className="leading-relaxed">
              2. Pada transaksi cicilan, member dapat memilih metode bayar <strong>Cash, Transfer Mandiri, QRIS, atau Kartu EDC</strong> untuk membayar DP hari ini. Kas riil hanya mencatat DP yang diterima, sisa tagihan tercatat di Buku Piutang tanpa risiko duplikasi.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: MASTER PAKET & PENGATURAN KOMISI (DENGAN SMART ADVISOR & SIMULATOR) */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl p-5 sm:p-7 my-auto max-h-[94vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Master Paket & Pengaturan Komisi
                    {editingPkgId && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase font-black">
                        Mode Edit
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Konfigurasi harga, durasi, dan skema komisi otomatis untuk penjualan member dan pelatih personal trainer.
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPkgModalTab('form')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    pkgModalTab === 'form'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" /> Form Pengaturan
                </button>
                <button
                  type="button"
                  onClick={() => setPkgModalTab('list')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    pkgModalTab === 'list'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Daftar Paket ({packages.length})
                </button>
              </div>
            </div>

            {pkgModalTab === 'form' ? (
              <form onSubmit={handleSaveMasterPackage} className="mt-5 space-y-6">
                {/* Editing Notification Banner */}
                {editingPkgId && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                      Sedang mengubah data master paket: <strong>{newPkgName || editingPkgId}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetPackageForm}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold text-[11px] transition"
                    >
                      Batal Edit / Buat Baru
                    </button>
                  </div>
                )}

                {/* Section 1: Data Pokok Paket */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-orange-400" /> 1. Data Pokok Paket
                    </span>
                    <span className="text-[10px] text-zinc-500">Kategori, tipe peserta, harga & kuota</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Kategori Paket
                      </label>
                      <select
                        value={newPkgCat}
                        onChange={(e) => {
                          const nextCat = e.target.value as any;
                          setNewPkgCat(nextCat);
                          if (nextCat === 'PT') {
                            setTrainerCommissionRate('40');
                            setSalesCommissionRate('3');
                          } else {
                            setTrainerCommissionRate('0');
                            setSalesCommissionRate('4');
                          }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-orange-500"
                      >
                        <option value="Membership">Membership (Akses Gym Mandiri)</option>
                        <option value="PT">Personal Trainer (Pendampingan Sesi PT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Tipe Peserta
                      </label>
                      <select
                        value={newPkgType}
                        onChange={(e) => setNewPkgType(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-orange-500"
                      >
                        <option value="Personal">Personal (1 Orang)</option>
                        <option value="Couple">Couple (2 Orang)</option>
                        <option value="Trio">Trio (3 Orang)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Nama Paket
                    </label>
                    <input
                      type="text"
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      placeholder="Cth: Paket PT 12 Sesi Intensive atau 1 Bulan Solo Unlimited"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Harga Jual Paket (Rp)
                      </label>
                      <input
                        type="number"
                        value={newPkgPrice}
                        onChange={(e) => {
                          const pVal = e.target.value;
                          setNewPkgPrice(pVal);
                          // Auto update nominal if in PERCENT mode
                          const pNum = Number(pVal) || 0;
                          const sR = Number(salesCommissionRate) || 0;
                          const tR = Number(trainerCommissionRate) || 0;
                          const vN = Number(newPkgValue) || 1;
                          setSalesCommissionNominal(String(Math.round((pNum * sR) / 100)));
                          const tNom = Math.round((pNum * tR) / 100);
                          setTrainerCommissionNominal(String(tNom));
                          setTrainerCommissionPerSession(String(Math.round(tNom / vN)));
                        }}
                        placeholder="Cth: 1500000"
                        required
                        min="0"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Kuota Value ({newPkgCat === 'Membership' ? 'Durasi Hari Akses' : 'Jumlah Sesi PT'})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newPkgValue}
                          onChange={(e) => {
                            const vVal = e.target.value;
                            setNewPkgValue(vVal);
                            const vNum = Number(vVal) || 1;
                            const tNom = Number(trainerCommissionNominal) || 0;
                            setTrainerCommissionPerSession(String(Math.round(tNom / vNum)));
                          }}
                          placeholder={newPkgCat === 'Membership' ? 'Cth: 30 (hari)' : 'Cth: 12 (sesi)'}
                          required
                          min="1"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                        />
                        <span className="absolute right-3.5 top-2.5 text-[10px] font-bold text-zinc-500 uppercase">
                          {newPkgCat === 'Membership' ? 'Hari' : 'Sesi'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Konfigurasi Komisi Penjualan Member & Trainer */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-emerald-400" /> 2. Skema Komisi Produk Member & Trainer
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Tentukan pembagian komisi untuk staf kasir/sales dan instruktur personal trainer.
                      </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-700/80 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setCommissionType('PERCENT')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          commissionType === 'PERCENT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Persentase (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommissionType('NOMINAL')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          commissionType === 'NOMINAL'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Nominal Flat (Rp)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Komisi Sales / Kasir */}
                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4" /> Komisi Sales / Kasir
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold">Reward Closing Transaksi</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Diberikan kepada kasir atau sales consult yang berhasil melayani dan menyelesaikan transaksi member ini.
                      </p>

                      {commissionType === 'PERCENT' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            Persentase Komisi Sales (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={salesCommissionRate}
                              onChange={(e) => {
                                setSalesCommissionRate(e.target.value);
                                const p = Number(newPkgPrice) || 0;
                                const r = Number(e.target.value) || 0;
                                setSalesCommissionNominal(String(Math.round((p * r) / 100)));
                              }}
                              min="0"
                              max="100"
                              step="0.5"
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                            />
                            <span className="absolute right-3.5 top-2 text-xs font-bold text-zinc-500">%</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            Nominal Komisi Sales Flat (Rp)
                          </label>
                          <input
                            type="number"
                            value={salesCommissionNominal}
                            onChange={(e) => {
                              setSalesCommissionNominal(e.target.value);
                              const p = Number(newPkgPrice) || 0;
                              const nom = Number(e.target.value) || 0;
                              setSalesCommissionRate(String(p > 0 ? Math.round((nom / p) * 100) : 0));
                            }}
                            min="0"
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] flex justify-between items-center">
                        <span className="text-zinc-400 font-medium">Estimasi Kasir Terima:</span>
                        <strong className="text-emerald-300 font-bold">
                          {formatRp(
                            commissionType === 'PERCENT'
                              ? Math.round(((Number(newPkgPrice) || 0) * (Number(salesCommissionRate) || 0)) / 100)
                              : Number(salesCommissionNominal) || 0
                          )}
                          <span className="text-[10px] text-zinc-400 font-normal ml-1">/ transaksi</span>
                        </strong>
                      </div>
                    </div>

                    {/* Komisi Personal Trainer */}
                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                          <Dumbbell className="w-4 h-4" /> Komisi Personal Trainer (PT)
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold">Fee Sesi Pendampingan</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {newPkgCat === 'PT'
                          ? 'Diberikan kepada pelatih yang ditugaskan membimbing latihan member sampai sesi selesai.'
                          : 'Paket Membership akses gym mandiri (tanpa instruktur). Komisi trainer disarankan 0%.'}
                      </p>

                      {newPkgCat === 'PT' ? (
                        <>
                          {commissionType === 'PERCENT' ? (
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                Persentase Komisi Trainer (%)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={trainerCommissionRate}
                                  onChange={(e) => {
                                    setTrainerCommissionRate(e.target.value);
                                    const p = Number(newPkgPrice) || 0;
                                    const r = Number(e.target.value) || 0;
                                    const v = Number(newPkgValue) || 1;
                                    const nom = Math.round((p * r) / 100);
                                    setTrainerCommissionNominal(String(nom));
                                    setTrainerCommissionPerSession(String(Math.round(nom / v)));
                                  }}
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-bold text-orange-400 outline-none focus:border-orange-500"
                                />
                                <span className="absolute right-3.5 top-2 text-xs font-bold text-zinc-500">%</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                  Fee Per Sesi (Rp)
                                </label>
                                <input
                                  type="number"
                                  value={trainerCommissionPerSession}
                                  onChange={(e) => {
                                    const perSess = Number(e.target.value) || 0;
                                    setTrainerCommissionPerSession(e.target.value);
                                    const v = Number(newPkgValue) || 1;
                                    const total = perSess * v;
                                    setTrainerCommissionNominal(String(total));
                                    const p = Number(newPkgPrice) || 0;
                                    setTrainerCommissionRate(String(p > 0 ? Math.round((total / p) * 100) : 0));
                                  }}
                                  min="0"
                                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs font-bold text-orange-400 outline-none focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                  Total Fee Paket (Rp)
                                </label>
                                <input
                                  type="number"
                                  value={trainerCommissionNominal}
                                  onChange={(e) => {
                                    const total = Number(e.target.value) || 0;
                                    setTrainerCommissionNominal(e.target.value);
                                    const v = Number(newPkgValue) || 1;
                                    setTrainerCommissionPerSession(String(Math.round(total / v)));
                                    const p = Number(newPkgPrice) || 0;
                                    setTrainerCommissionRate(String(p > 0 ? Math.round((total / p) * 100) : 0));
                                  }}
                                  min="0"
                                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs font-bold text-orange-400 outline-none focus:border-orange-500"
                                />
                              </div>
                            </div>
                          )}

                          <div className="p-2.5 rounded-xl bg-orange-950/30 border border-orange-800/40 text-[11px] flex justify-between items-center">
                            <span className="text-zinc-400 font-medium">Estimasi Fee Trainer:</span>
                            <div className="text-right">
                              <strong className="text-orange-300 font-bold block">
                                {formatRp(
                                  commissionType === 'PERCENT'
                                    ? Math.round(((Number(newPkgPrice) || 0) * (Number(trainerCommissionRate) || 0)) / 100)
                                    : Number(trainerCommissionNominal) || 0
                                )}
                              </strong>
                              <span className="text-[10px] text-zinc-400 font-normal">
                                (~{formatRp(
                                  Math.round(
                                    (commissionType === 'PERCENT'
                                      ? Math.round(((Number(newPkgPrice) || 0) * (Number(trainerCommissionRate) || 0)) / 100)
                                      : Number(trainerCommissionNominal) || 0) / (Number(newPkgValue) || 1)
                                  )
                                )} / sesi)
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            Paket Membership mandiri dialokasikan 100% untuk fasilitas gym (Komisi Trainer = Rp 0).
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bonus Retail / Produk Tambahan */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Bonus Penjualan Suplemen / FnB / Merchandise (Opsional Rp)
                    </label>
                    <input
                      type="number"
                      value={productBonusNominal}
                      onChange={(e) => setProductBonusNominal(e.target.value)}
                      placeholder="Cth: 10000 jika paket menyertakan bonus suplemen/minuman"
                      min="0"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Section 3: PANEL SARAN & REKOMENDASI CERDAS (SMART COMMISSION ADVISOR) */}
                <div className="bg-gradient-to-br from-amber-950/30 via-zinc-950 to-orange-950/30 border border-orange-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider">
                          Saran & Rekomendasi Cerdas Pengaturan Komisi
                        </h4>
                        <span className="text-[11px] text-zinc-400">
                          Panduan acuan standar industri kebugaran Indonesia untuk menjaga profitabilitas gym & motivasi tim
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dinamis Advice Card */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="text-white block font-bold">
                          {newPkgCat === 'PT'
                            ? 'Rekomendasi Paket PT: Komisi Trainer 35% - 45% & Komisi Sales 2% - 4%'
                            : 'Rekomendasi Paket Membership: Komisi Sales 3% - 5% & Trainer 0%'}
                        </strong>
                        <p className="text-zinc-400 leading-relaxed text-[11px]">
                          {newPkgCat === 'PT'
                            ? 'Pada paket PT, pelatih adalah penentu utama retensi & kepuasan member. Fee Rp 35.000 - Rp 65.000 / sesi (35-45% dari harga jual) memastikan pelatih berdedikasi tinggi, sementara alokasi 2-4% memacu kasir/sales untuk aktif closing member gym ke program PT. Margin gym tetap terjaga sehat di kisaran 50% - 60%.'
                            : 'Pada membership fasilitas, member menikmati gym secara mandiri. Berikan komisi 3-5% (atau flat Rp 20.000 - Rp 50.000) bagi staf penjualan/kasir untuk mendorong renewal tepat waktu dan akuisisi member baru. Margin operasional gym terjaga maksimal di atas 95%.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Presets */}
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                      ⚡ Terapkan Saran Cepat (1-Klik Presets):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => applyCommissionPreset('industry')}
                        className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition hover:border-orange-500/50 group"
                      >
                        <span className="font-bold text-white text-[11px] block group-hover:text-orange-400 flex items-center gap-1">
                          🎯 Standar Industri
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {newPkgCat === 'PT' ? 'Trainer 40%, Sales 3%' : 'Sales 4%, Gym 96%'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyCommissionPreset('high_incentive')}
                        className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition hover:border-emerald-500/50 group"
                      >
                        <span className="font-bold text-white text-[11px] block group-hover:text-emerald-400 flex items-center gap-1">
                          🚀 Insentif Booster
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {newPkgCat === 'PT' ? 'Trainer 45%, Sales 5%' : 'Sales 6% (Target Cepat)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyCommissionPreset('flat_session')}
                        className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition hover:border-amber-500/50 group"
                      >
                        <span className="font-bold text-white text-[11px] block group-hover:text-amber-400 flex items-center gap-1">
                          💵 Flat Fee Sesi
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {newPkgCat === 'PT' ? 'Rp 45.000 / sesi PT' : 'Sales Rp 30.000 flat'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyCommissionPreset('low_margin')}
                        className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition hover:border-sky-500/50 group"
                      >
                        <span className="font-bold text-white text-[11px] block group-hover:text-sky-400 flex items-center gap-1">
                          ⚖️ Paket Promo
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {newPkgCat === 'PT' ? 'Trainer 30%, Sales 2%' : 'Sales 2% (Promo Murah)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Simulator Margin Keuntungan Gym */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Simulator Pembagian & Margin Bersih Gym
                      </span>
                      {(() => {
                        const pNum = Number(newPkgPrice) || 0;
                        const sComm = commissionType === 'PERCENT'
                          ? Math.round((pNum * (Number(salesCommissionRate) || 0)) / 100)
                          : Number(salesCommissionNominal) || 0;
                        const tComm = newPkgCat === 'PT'
                          ? commissionType === 'PERCENT'
                            ? Math.round((pNum * (Number(trainerCommissionRate) || 0)) / 100)
                            : Number(trainerCommissionNominal) || 0
                          : 0;
                        const netGym = Math.max(0, pNum - sComm - tComm);
                        const netPct = pNum > 0 ? Math.round((netGym / pNum) * 100) : 100;

                        if (netPct >= 50) {
                          return (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              🟢 Margin Gym Sangat Sehat ({netPct}%)
                            </span>
                          );
                        } else if (netPct >= 35) {
                          return (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              🟡 Margin Operasional Standar ({netPct}%)
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                              🔴 Perhatian: Margin Terlalu Tipis ({netPct}%)
                            </span>
                          );
                        }
                      })()}
                    </div>

                    {/* Progress Bar 3 Segmen */}
                    {(() => {
                      const pNum = Number(newPkgPrice) || 0;
                      const sComm = commissionType === 'PERCENT'
                        ? Math.round((pNum * (Number(salesCommissionRate) || 0)) / 100)
                        : Number(salesCommissionNominal) || 0;
                      const tComm = newPkgCat === 'PT'
                        ? commissionType === 'PERCENT'
                          ? Math.round((pNum * (Number(trainerCommissionRate) || 0)) / 100)
                          : Number(trainerCommissionNominal) || 0
                        : 0;
                      const netGym = Math.max(0, pNum - sComm - tComm);
                      const sPct = pNum > 0 ? Math.round((sComm / pNum) * 100) : 0;
                      const tPct = pNum > 0 ? Math.round((tComm / pNum) * 100) : 0;
                      const gPct = pNum > 0 ? Math.max(0, 100 - sPct - tPct) : 100;

                      return (
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                            {tPct > 0 && (
                              <div
                                style={{ width: `${tPct}%` }}
                                className="bg-orange-500 transition-all duration-300"
                                title={`Trainer: ${tPct}%`}
                              />
                            )}
                            {sPct > 0 && (
                              <div
                                style={{ width: `${sPct}%` }}
                                className="bg-emerald-500 transition-all duration-300"
                                title={`Sales: ${sPct}%`}
                              />
                            )}
                            <div
                              style={{ width: `${gPct}%` }}
                              className="bg-sky-500 transition-all duration-300"
                              title={`Margin Gym: ${gPct}%`}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                              <span className="text-[10px] text-orange-400 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Trainer PT
                              </span>
                              <strong className="text-white block mt-0.5">{formatRp(tComm)}</strong>
                              <span className="text-[9px] text-zinc-500">Porsi {tPct}%</span>
                            </div>

                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Sales Kasir
                              </span>
                              <strong className="text-white block mt-0.5">{formatRp(sComm)}</strong>
                              <span className="text-[9px] text-zinc-500">Porsi {sPct}%</span>
                            </div>

                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                              <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Net Margin Gym
                              </span>
                              <strong className="text-white block mt-0.5">{formatRp(netGym)}</strong>
                              <span className="text-[9px] text-zinc-500">Porsi {gPct}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Catatan Kebijakan Komisi */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Catatan Kebijakan Komisi (Opsional)
                    </label>
                    <input
                      type="text"
                      value={commissionNotes}
                      onChange={(e) => setCommissionNotes(e.target.value)}
                      placeholder="Cth: Komisi PT dicairkan setelah member menandatangani validasi sesi latihan"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetPackageForm();
                      setIsPkgModalOpen(false);
                    }}
                    className="sm:w-1/3 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPackageForm}
                    className="sm:w-1/3 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                  >
                    Reset Form
                  </button>

                  <button
                    type="submit"
                    className="sm:w-1/3 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {editingPkgId ? 'Perbarui Paket & Komisi' : 'Simpan Master Paket Baru'}
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: DAFTAR MASTER PAKET & KOMISI */
              <div className="mt-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={pkgSearch}
                      onChange={(e) => setPkgSearch(e.target.value)}
                      placeholder="Cari master paket atau kode..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                      {(['ALL', 'Membership', 'PT'] as const).map((cKey) => (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => setPkgFilterCat(cKey)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition ${
                            pkgFilterCat === cKey
                              ? 'bg-orange-500 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {cKey === 'ALL' ? 'Semua' : cKey}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleResetPackageForm();
                        setPkgModalTab('form');
                      }}
                      className="px-3.5 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30 text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Paket Baru
                    </button>
                  </div>
                </div>

                {/* Table of Master Packages */}
                <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/70">
                  <div className="overflow-x-auto max-h-[55vh]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-zinc-900/90 text-zinc-400 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-800 sticky top-0 z-10 backdrop-blur-xs">
                        <tr>
                          <th className="py-3 px-3.5">Paket</th>
                          <th className="py-3 px-3">Kategori</th>
                          <th className="py-3 px-3">Harga</th>
                          <th className="py-3 px-3">Kuota</th>
                          <th className="py-3 px-3">Komisi Sales</th>
                          <th className="py-3 px-3">Komisi Trainer (PT)</th>
                          <th className="py-3 px-3">Margin Gym</th>
                          <th className="py-3 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {packages
                          .filter((p) => {
                            const matchCat = pkgFilterCat === 'ALL' || p.cat === pkgFilterCat;
                            const matchSearch =
                              !pkgSearch ||
                              p.name.toLowerCase().includes(pkgSearch.toLowerCase()) ||
                              p.id.toLowerCase().includes(pkgSearch.toLowerCase());
                            return matchCat && matchSearch;
                          })
                          .map((pkg) => {
                            const sComm = pkg.salesCommissionNominal ?? Math.round((pkg.price * (pkg.salesCommissionRate ?? (pkg.cat === 'Membership' ? 4 : 3))) / 100);
                            const tComm = pkg.cat === 'PT'
                              ? (pkg.trainerCommissionNominal ?? Math.round((pkg.price * (pkg.trainerCommissionRate ?? 40)) / 100))
                              : 0;
                            const netMargin = Math.max(0, pkg.price - sComm - tComm);
                            const marginPct = pkg.price > 0 ? Math.round((netMargin / pkg.price) * 100) : 0;

                            return (
                              <tr key={pkg.id} className="hover:bg-zinc-900/50 transition">
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-white">{pkg.name}</div>
                                  <span className="text-[10px] text-zinc-500 font-mono">{pkg.id} • {pkg.type}</span>
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      pkg.cat === 'PT'
                                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}
                                  >
                                    {pkg.cat}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-bold text-zinc-100">
                                  {formatRp(pkg.price)}
                                </td>
                                <td className="py-3 px-3 font-semibold text-zinc-400">
                                  {pkg.value} {pkg.cat === 'Membership' ? 'Hari' : 'Sesi'}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-emerald-400">{formatRp(sComm)}</div>
                                  <span className="text-[10px] text-zinc-500">
                                    {pkg.salesCommissionRate ?? (pkg.cat === 'Membership' ? 4 : 3)}% closing
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  {pkg.cat === 'PT' ? (
                                    <>
                                      <div className="font-bold text-orange-400">{formatRp(tComm)}</div>
                                      <span className="text-[10px] text-zinc-500">
                                        ~{formatRp(pkg.trainerCommissionPerSession || Math.round(tComm / (pkg.value || 1)))}/sesi
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-zinc-500 text-[11px]">- (Mandiri)</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-sky-400">{formatRp(netMargin)}</div>
                                  <span className="text-[10px] text-zinc-500 font-semibold">{marginPct}%</span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleEditPackage(pkg)}
                                      title="Edit Paket & Komisi"
                                      className="p-1.5 bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-300 rounded-lg transition"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePackageConfirm(pkg)}
                                      title="Hapus Master Paket"
                                      className="p-1.5 bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-400 rounded-lg transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPkgModalOpen(false)}
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Authorization Modal to Unlock / Change PIC */}
      <PicPasswordModal
        isOpen={isPicPasswordModalOpen}
        onClose={() => {
          setIsPicPasswordModalOpen(false);
          setUnlockPicTarget(null);
        }}
        onSuccess={handleUnlockPicSuccess}
        currentUser={currentUser}
        showToast={showToast}
        title="Otorisasi Ganti PIC Member"
        description="Masukkan password otorisasi keamanan untuk membuka kunci dan mengganti staf PIC pada transaksi paket ini."
      />
    </div>
  );
};

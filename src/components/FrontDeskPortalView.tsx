import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Snowflake,
  CreditCard,
  Crown,
  Dumbbell,
  Sparkles,
  QrCode,
  IdCard,
  User,
  Users,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Key,
  ExternalLink,
  Flame,
  Award,
  Gift,
  HelpCircle,
  Check,
  Send,
  SlidersHorizontal,
  X,
  Printer,
  ShoppingBag,
  Archive,
  Package,
  Tag,
  ClipboardList,
  Wallet,
  DollarSign,
  CheckSquare,
  Trash2,
  History,
  FileCheck,
  RotateCcw,
  Receipt,
  Coffee,
  BellRing,
  Lock,
  Unlock
} from 'lucide-react';
import {
  Member,
  Attendance,
  PackageItem,
  BundlePackage,
  Transaction,
  User as StaffUser,
  Schedule,
  MemberFreezeRecord,
  LockerSlot
} from '../types';
import { formatRp, formatDateIndo, getDayDiff, APP_TODAY, getTimestamp } from '../utils/formatters';
import {
  getRecommendedLocker,
  getLockerStats,
  getAvailableLockersByGender,
  INITIAL_LOCKERS
} from '../data/lockerData';
import { LockerManagementView } from './LockerManagementView';
import { PicPasswordModal } from './PicPasswordModal';
import { ReceiptModal } from './ReceiptModal';
import { RealTimeClock } from './RealTimeClock';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_PIC_PROTECTION } from '../data/settingsData';
import { OnlineReservation } from '../types/landingTypes';

interface FrontDeskPortalViewProps {
  members: Member[];
  attendances: Attendance[];
  lockers?: LockerSlot[];
  onUpdateLockers?: React.Dispatch<React.SetStateAction<LockerSlot[]>>;
  onReleaseLocker?: (num: number) => void;
  onSwapLocker?: (oldNum: number, newNum: number) => void;
  onAddAttendance: (newAtt: Attendance, updatedMember?: Member) => void;
  onCheckoutMember: (attId: string) => void;
  onUpdateMember: (member: Member) => void;
  onAddMember: (member: Member) => void;
  packages: PackageItem[];
  bundlePackages?: BundlePackage[];
  transactions: Transaction[];
  onAddTransaction: (trx: Transaction) => void;
  currentUser: StaffUser | null;
  staffUsers: StaffUser[];
  schedules?: Schedule[];
  freezeRecords?: MemberFreezeRecord[];
  onOpenFreezeModal: (member: Member) => void;
  onOpenUnfreezeModal: (member: Member) => void;
  onOpenMemberDetail: (member: Member) => void;
  onOpenIDCard: (member: Member) => void;
  onOpenQRCode?: (member: Member) => void;
  onNavigateTab: (tab: any) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  isStoreClosed?: boolean;
  onlineReservations?: OnlineReservation[];
  onCheckinReservation?: (resId: string) => void;
  onCancelReservation?: (resId: string) => void;
}

// Quick Desk POS Catalog Item
export interface QuickDeskProduct {
  id: string;
  name: string;
  category: 'Layanan Member' | 'Fasilitas & Denda' | 'Minuman & Suplemen';
  price: number;
  description: string;
  badge?: string;
}

export const INITIAL_DESK_PRODUCTS: QuickDeskProduct[] = [
  { id: 'DP-01', name: 'Ganti Kartu Fisik / RFID Rusak', category: 'Layanan Member', price: 25000, description: 'Pencetakan ulang kartu barcode / chip RFID member baru', badge: 'Kartu' },
  { id: 'DP-02', name: 'Sewa Loker Eksklusif (1 Bulan)', category: 'Fasilitas & Denda', price: 100000, description: 'Loker pribadi khusus dengan gembok master 30 hari', badge: 'Populer' },
  { id: 'DP-03', name: 'Sewa Handuk Bersih Ekstra', category: 'Fasilitas & Denda', price: 10000, description: 'Handuk mandi microfiber higienis steril gym', badge: 'Harian' },
  { id: 'DP-04', name: 'Denda Ganti Kunci Loker Hilang', category: 'Fasilitas & Denda', price: 50000, description: 'Biaya penggantian silinder & duplikasi kunci loker', badge: 'Denda' },
  { id: 'DP-05', name: 'Tiket Tamu Walk-in Gym Pass', category: 'Layanan Member', price: 50000, description: 'Akses 1 hari penuh seluruh fasilitas fitness + loker harian', badge: 'Visit' },
  { id: 'DP-06', name: 'Administrasi Mutasi / Ganti Nama', category: 'Layanan Member', price: 50000, description: 'Transfer sisa keanggotaan ke orang lain resmi', badge: 'Admin' },
  { id: 'DP-07', name: 'Whey Protein Shake Ice Cold (Cup)', category: 'Minuman & Suplemen', price: 35000, description: '25g Protein murni blended with ice & susu skim', badge: 'Best Seller' },
  { id: 'DP-08', name: 'Minuman Isotonik Dingin 500ml', category: 'Minuman & Suplemen', price: 10000, description: 'Elektrolit cepat serap untuk hidrasi optimal', badge: 'Dingin' },
  { id: 'DP-09', name: 'Air Mineral Prima 600ml', category: 'Minuman & Suplemen', price: 5000, description: 'Air mineral murni higienis dingin segar', badge: 'Es' },
  { id: 'DP-10', name: 'Nutri Protein Bar Cokelat', category: 'Minuman & Suplemen', price: 25000, description: '20g protein snack bar praktis sebelum/sesudah gym', badge: 'Snack' },
  { id: 'DP-11', name: 'Pre-Workout Booster Shot 60ml', category: 'Minuman & Suplemen', price: 20000, description: 'Tinggi kafein & citrulline penambah fokus latihan', badge: 'Energi' }
];

// Lost & Found Items for Front Desk
export interface LostFoundItem {
  id: string;
  itemName: string;
  category: 'Botol/Tumbler' | 'Aksesoris/Gym' | 'Elektronik' | 'Pakaian/Sepatu' | 'Kunci/Dompet' | 'Lainnya';
  foundLocation: string;
  foundDate: string;
  foundTime: string;
  finderStaffName: string;
  status: 'STORED' | 'CLAIMED';
  claimedByMemberName?: string;
  claimedByMemberId?: string;
  claimedDate?: string;
  notes?: string;
}

export const INITIAL_LOST_FOUND: LostFoundItem[] = [
  {
    id: 'LF-01',
    itemName: 'Tumbler Hydro Flask 32oz Hitam',
    category: 'Botol/Tumbler',
    foundLocation: 'Area Treadmill 03',
    foundDate: APP_TODAY,
    foundTime: '08:45 WIB',
    finderStaffName: 'Budi Cleaning',
    status: 'STORED',
    notes: 'Ada stiker logo gym di bagian bawah botol.'
  },
  {
    id: 'LF-02',
    itemName: 'Sabuk Angkat Beban Kulit Rogue (Size M)',
    category: 'Aksesoris/Gym',
    foundLocation: 'Power Rack Zona Beban Bebas',
    foundDate: APP_TODAY,
    foundTime: '09:20 WIB',
    finderStaffName: 'Coach Andre',
    status: 'STORED',
    notes: 'Kondisi baik, tertinggal di samping barbel.'
  },
  {
    id: 'LF-03',
    itemName: 'Kunci Motor Honda Vario Hitam + Gantungan Kulit',
    category: 'Kunci/Dompet',
    foundLocation: 'Meja Kasir Gate Masuk',
    foundDate: APP_TODAY,
    foundTime: '10:05 WIB',
    finderStaffName: 'Siti Kasir',
    status: 'STORED',
    notes: 'Tertinggal saat member scan barcode check-in.'
  },
  {
    id: 'LF-04',
    itemName: 'Earbuds TWS Wireless Putih Case',
    category: 'Elektronik',
    foundLocation: 'Loker Pria No. 05',
    foundDate: '2026-09-20',
    foundTime: '17:30 WIB',
    finderStaffName: 'Rian Front Desk',
    status: 'CLAIMED',
    claimedByMemberName: 'Akbar Hanif (M001)',
    claimedByMemberId: 'M001',
    claimedDate: '2026-09-21 10:15 WIB',
    notes: 'Telah diverifikasi dengan kode pairing bluetooth handphone.'
  }
];

// Shift Handover Note for Front Desk Staff
export interface ShiftHandoverNote {
  id: string;
  timestamp: string;
  authorStaffName: string;
  shift: 'Pagi (06:00 - 14:00)' | 'Sore/Malam (14:00 - 22:00)' | string;
  cashDrawerActual: number;
  notes: string;
  isImportant: boolean;
}

export const INITIAL_HANDOVER_NOTES: ShiftHandoverNote[] = [
  {
    id: 'SH-01',
    timestamp: `${APP_TODAY} 06:15 WIB`,
    authorStaffName: 'Siti Kasir',
    shift: 'Pagi (06:00 - 14:00)',
    cashDrawerActual: 500000,
    notes: 'Uang modal awal laci kasir Rp 500.000 lengkap (pecahan 50rb & 20rb). Stok handuk bersih di rak 45 pcs.',
    isImportant: false
  },
  {
    id: 'SH-02',
    timestamp: `${APP_TODAY} 09:30 WIB`,
    authorStaffName: 'Rian Front Desk',
    shift: 'Pagi (06:00 - 14:00)',
    cashDrawerActual: 625000,
    notes: 'Loker Pria No 12 kunci silindernya agak seret, sudah disemprot pelumas oleh maintenance.',
    isImportant: true
  }
];

export const FrontDeskPortalView: React.FC<FrontDeskPortalViewProps> = ({
  members,
  attendances,
  lockers: propLockers = [],
  onUpdateLockers,
  onReleaseLocker,
  onSwapLocker,
  onAddAttendance,
  onCheckoutMember,
  onUpdateMember,
  onAddMember,
  packages,
  bundlePackages = [],
  transactions,
  onAddTransaction,
  currentUser,
  staffUsers,
  schedules = [],
  freezeRecords = [],
  onOpenFreezeModal,
  onOpenUnfreezeModal,
  onOpenMemberDetail,
  onOpenIDCard,
  onOpenQRCode,
  onNavigateTab,
  showToast,
  isStoreClosed = false,
  onlineReservations = [],
  onCheckinReservation,
  onCancelReservation
}) => {
  // Main Sub-Tab Mode
  const [activeTab, setActiveTab] = useState<'radar' | 'checkin' | 'members' | 'lockers' | 'pos_desk' | 'helpdesk' | 'suggestions' | 'reservations'>('radar');

  // Online Reservation Search & Status Filter
  const [reservationSearchQuery, setReservationSearchQuery] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'FREEZE' | 'PT'>('ALL');

  // Universal 360 Quick Search & Profile Modal
  const [quick360Member, setQuick360Member] = useState<Member | null>(null);
  const [universalSearchQuery, setUniversalSearchQuery] = useState('');
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState(false);

  // Settings & PIC Password Protection
  const { settings } = useSettings();
  const picProtection = settings?.picProtection || DEFAULT_PIC_PROTECTION;
  const [isPicPasswordModalOpen, setIsPicPasswordModalOpen] = useState(false);
  const [passwordUnlockTarget, setPasswordUnlockTarget] = useState<'reg' | 'renewal'>('reg');

  // Fast-Track Registration Modal State
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isRegPicLocked, setIsRegPicLocked] = useState<boolean>(true);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    phone: '',
    gender: 'L' as 'L' | 'P',
    packageId: '',
    paymentMethod: 'QRIS' as 'Cash' | 'QRIS' | 'Transfer' | 'Debit',
    notes: '',
    assignedStaffId: currentUser?.id || 'S01'
  });

  // Fast-Track Renewal Modal State
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [selectedMemberForRenewal, setSelectedMemberForRenewal] = useState<Member | null>(null);
  const [renewalPackageId, setRenewalPackageId] = useState('');
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState<'Cash' | 'QRIS' | 'Transfer' | 'Debit'>('QRIS');
  const [renewalStaffId, setRenewalStaffId] = useState(currentUser?.id || 'S01');
  const [renewalPicId, setRenewalPicId] = useState(currentUser?.id || 'S01');
  const [isRenewalPicLocked, setIsRenewalPicLocked] = useState<boolean>(true);

  const handleOpenRenewalModal = (member: Member) => {
    setSelectedMemberForRenewal(member);
    setRenewalPackageId('');
    setRenewalPicId(member.picId || currentUser?.id || 'S01');
    setIsRenewalPicLocked(Boolean(member.picId));
    setRenewalStaffId(currentUser?.id || 'S01');
    setIsRenewalModalOpen(true);
  };

  // Walk-In Guest Pass Modal State
  const [isGuestPassModalOpen, setIsGuestPassModalOpen] = useState(false);
  const [guestPassForm, setGuestPassForm] = useState({
    name: '',
    phone: '',
    paymentMethod: 'Cash' as 'Cash' | 'QRIS' | 'Transfer' | 'Debit',
    price: 50000,
    hasTowel: true,
    lockerNum: '01'
  });

  // ---------------------------------------------------------------------------
  // DESK POS & BILLING STATE
  // ---------------------------------------------------------------------------
  const [deskProducts] = useState<QuickDeskProduct[]>(INITIAL_DESK_PRODUCTS);
  const [deskCategoryFilter, setDeskCategoryFilter] = useState<'ALL' | 'Layanan Member' | 'Fasilitas & Denda' | 'Minuman & Suplemen'>('ALL');
  const [deskProductSearch, setDeskProductSearch] = useState('');
  const [quickCart, setQuickCart] = useState<{ product: QuickDeskProduct; qty: number }[]>([]);
  const [deskCustomerType, setDeskCustomerType] = useState<'member' | 'guest'>('member');
  const [selectedDeskMemberId, setSelectedDeskMemberId] = useState<string>('');
  const [deskGuestName, setDeskGuestName] = useState<string>('');
  const [deskPaymentMethod, setDeskPaymentMethod] = useState<'Cash' | 'QRIS' | 'Transfer' | 'Debit'>('Cash');
  const [deskCashGiven, setDeskCashGiven] = useState<number>(0);
  const [receiptModalData, setReceiptModalData] = useState<{
    trxId: string;
    date: string;
    time: string;
    customerName: string;
    memberId?: string;
    cashierName: string;
    items: { name: string; price: number; qty: number; total: number }[];
    total: number;
    paymentMethod: string;
    cashGiven?: number;
    changeGiven?: number;
  } | null>(null);
  const [isShiftClosingModalOpen, setIsShiftClosingModalOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // HELPDESK & LOST-AND-FOUND STATE
  // ---------------------------------------------------------------------------
  const [lostFoundList, setLostFoundList] = useState<LostFoundItem[]>(() => {
    try {
      const saved = localStorage.getItem('gympro_lost_found');
      return saved ? JSON.parse(saved) : INITIAL_LOST_FOUND;
    } catch {
      return INITIAL_LOST_FOUND;
    }
  });

  const [lostFoundFilter, setLostFoundFilter] = useState<'ALL' | 'STORED' | 'CLAIMED'>('ALL');
  const [lostFoundSearch, setLostFoundSearch] = useState('');
  const [isAddLostFoundOpen, setIsAddLostFoundOpen] = useState(false);
  const [newLostFoundForm, setNewLostFoundForm] = useState({
    itemName: '',
    category: 'Botol/Tumbler' as LostFoundItem['category'],
    foundLocation: '',
    finderStaffName: currentUser?.name || 'Staf Front Desk',
    notes: ''
  });
  const [targetLostFoundForClaim, setTargetLostFoundForClaim] = useState<LostFoundItem | null>(null);
  const [claimForm, setClaimForm] = useState({
    memberId: '',
    claimantName: '',
    notes: ''
  });

  // Shift Handover Notes
  const [handoverNotes, setHandoverNotes] = useState<ShiftHandoverNote[]>(() => {
    try {
      const saved = localStorage.getItem('gympro_shift_handovers');
      return saved ? JSON.parse(saved) : INITIAL_HANDOVER_NOTES;
    } catch {
      return INITIAL_HANDOVER_NOTES;
    }
  });
  const [isAddHandoverOpen, setIsAddHandoverOpen] = useState(false);
  const [newHandoverForm, setNewHandoverForm] = useState({
    shift: 'Pagi (06:00 - 14:00)' as ShiftHandoverNote['shift'],
    cashDrawerActual: 500000,
    notes: '',
    isImportant: false
  });

  // Sync to localStorage
  const saveLostFoundToStorage = (newList: LostFoundItem[]) => {
    setLostFoundList(newList);
    try {
      localStorage.setItem('gympro_lost_found', JSON.stringify(newList));
    } catch (err) {
      console.warn('Failed to save lost & found to storage:', err);
    }
  };

  const saveHandoversToStorage = (newNotes: ShiftHandoverNote[]) => {
    setHandoverNotes(newNotes);
    try {
      localStorage.setItem('gympro_shift_handovers', JSON.stringify(newNotes));
    } catch (err) {
      console.warn('Failed to save handovers to storage:', err);
    }
  };

  // Interactive Locker Grid State (connected to shared App state or fallback to initial)
  const [internalLockers, setInternalLockers] = useState<LockerSlot[]>(() => INITIAL_LOCKERS);
  const lockers = propLockers && propLockers.length > 0 ? propLockers : internalLockers;
  const setLockers = onUpdateLockers || setInternalLockers;

  // Check-In & Locker Assignment Modal State (Pas absen sekalian berikan kunci loker + saran front desk)
  const [checkInModal, setCheckInModal] = useState<{
    isOpen: boolean;
    member: Member | null;
    selectedLockerNumber: number | null;
    withoutLocker: boolean;
    hasTowel: boolean;
    visitType: 'Reguler' | 'PT';
  }>({
    isOpen: false,
    member: null,
    selectedLockerNumber: null,
    withoutLocker: false,
    hasTowel: true,
    visitType: 'Reguler'
  });

  // Locker assignment modal (for manual locker board view)
  const [selectedLockerNumber, setSelectedLockerNumber] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // ATTENDANCES & LIVE FLOOR LIST (TODAY)
  // ---------------------------------------------------------------------------
  const todayAttendances = useMemo(() => {
    return attendances.filter((a) => a.date === APP_TODAY);
  }, [attendances]);

  // Members currently inside the gym (no timeOut)
  const currentlyInGymAttendances = useMemo(() => {
    return todayAttendances.filter((a) => !a.timeOut);
  }, [todayAttendances]);

  // Set of member IDs currently in gym
  const activeInGymMemberIds = useMemo(() => {
    return new Set(currentlyInGymAttendances.map((a) => a.memberId).filter(Boolean));
  }, [currentlyInGymAttendances]);

  // ---------------------------------------------------------------------------
  // SMART RADAR & ASSISTANT METRICS
  // ---------------------------------------------------------------------------
  const {
    expiringMembers,
    expiredMembers,
    lowPTMembers,
    inactiveMembers,
    birthdayMembers,
    frozenMembers
  } = useMemo(() => {
    const expiring: { member: Member; daysLeft: number }[] = [];
    const expired: { member: Member; daysAgo: number }[] = [];
    const lowPT: Member[] = [];
    const inactive: { member: Member; daysSinceLastSeen: number }[] = [];
    const birthday: Member[] = [];
    const frozen: Member[] = [];

    // Parse today's month/day for birthday
    const todayMonthDay = APP_TODAY.slice(5); // e.g. "09-18"

    members.forEach((m) => {
      // 1. Freeze status
      if (m.isFrozen || m.status === 'FREEZE') {
        frozen.push(m);
      }

      // 2. Expiration check
      const diff = getDayDiff(m.expired, APP_TODAY);
      if (diff >= 0 && diff <= 7) {
        expiring.push({ member: m, daysLeft: diff });
      } else if (diff < 0) {
        expired.push({ member: m, daysAgo: Math.abs(diff) });
      }

      // 3. PT Quota check (has active PT package but 1 or 2 sessions left)
      if (m.ptQuota > 0 && m.ptQuota <= 2) {
        lowPT.push(m);
      }

      // 4. Inactive check (has not visited gym for > 14 days)
      const memberAtts = attendances.filter((a) => a.memberId === m.id || a.memberName === m.name);
      if (memberAtts.length > 0) {
        const lastAtt = memberAtts.sort((a, b) => b.date.localeCompare(a.date))[0];
        const daysAgo = getDayDiff(APP_TODAY, lastAtt.date);
        if (daysAgo > 14 && diff >= 0) {
          inactive.push({ member: m, daysSinceLastSeen: daysAgo });
        }
      } else if (diff >= 0) {
        inactive.push({ member: m, daysSinceLastSeen: 30 });
      }

      // 5. Birthday check
      if (m.birthDate) {
        const bMonthDay = m.birthDate.slice(5);
        if (bMonthDay.slice(0, 2) === todayMonthDay.slice(0, 2)) {
          birthday.push(m);
        }
      }
    });

    return {
      expiringMembers: expiring.sort((a, b) => a.daysLeft - b.daysLeft),
      expiredMembers: expired.sort((a, b) => a.daysAgo - b.daysAgo),
      lowPTMembers: lowPT,
      inactiveMembers: inactive.sort((a, b) => b.daysSinceLastSeen - a.daysSinceLastSeen),
      birthdayMembers: birthday,
      frozenMembers: frozen
    };
  }, [members, attendances]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchId = m.id.toLowerCase().includes(q);
        const matchPhone = m.phone.includes(q);
        if (!matchName && !matchId && !matchPhone) return false;
      }

      // Status filter
      if (memberFilter === 'ACTIVE') {
        return !m.isFrozen && getDayDiff(m.expired, APP_TODAY) >= 0;
      }
      if (memberFilter === 'EXPIRING') {
        const d = getDayDiff(m.expired, APP_TODAY);
        return d >= 0 && d <= 7;
      }
      if (memberFilter === 'EXPIRED') {
        return getDayDiff(m.expired, APP_TODAY) < 0;
      }
      if (memberFilter === 'FREEZE') {
        return m.isFrozen || m.status === 'FREEZE';
      }
      if (memberFilter === 'PT') {
        return m.ptQuota > 0;
      }
      return true;
    });
  }, [members, searchQuery, memberFilter]);

  // ---------------------------------------------------------------------------
  // FAST-TRACK CHECK-IN / GATE VALIDATION & LOCKER ASSIGNMENT
  // ---------------------------------------------------------------------------
  const handlePerformCheckIn = (member: Member) => {
    // 1. Check if member is already checked in and hasn't checked out
    const existing = todayAttendances.find((a) => (a.memberId === member.id || a.memberName === member.name) && !a.timeOut);
    if (existing) {
      showToast('Sudah Berada di Gym', `${member.name} sudah berada di dalam gym sejak ${existing.timeIn}. Lakukan checkout saat selesai latihan.`, 'warning');
      return;
    }

    // 2. Check if member is frozen
    if (member.isFrozen || member.status === 'FREEZE') {
      showToast(
        'Keanggotaan Sedang Cuti (Freeze)',
        `Member ${member.name} sedang dalam periode cuti. Buka menu Cuti untuk melakukan unfreeze sebelum check-in.`,
        'error'
      );
      return;
    }

    // 3. Check if member expired
    const daysLeft = getDayDiff(member.expired, APP_TODAY);
    if (daysLeft < 0) {
      showToast(
        'Masa Aktif Expired',
        `Membership ${member.name} telah berakhir pada ${formatDateIndo(member.expired)}. Lakukan perpanjangan paket terlebih dahulu.`,
        'error'
      );
      handleOpenRenewalModal(member);
      return;
    }

    // 4. Auto assign recommended locker based on member's gender
    const recLocker = getRecommendedLocker(lockers, member.gender);

    setCheckInModal({
      isOpen: true,
      member,
      selectedLockerNumber: recLocker ? recLocker.number : null,
      withoutLocker: false,
      hasTowel: true,
      visitType: (member.ptQuota || 0) > 0 ? 'PT' : 'Reguler'
    });
  };

  const handleConfirmModalCheckIn = () => {
    if (!checkInModal.member) return;
    const member = checkInModal.member;

    let updatedMember: Member | undefined = undefined;
    if (checkInModal.visitType === 'PT') {
      if ((member.ptQuota || 0) <= 0) {
        showToast('Kuota Habis', `Member ${member.name} tidak memiliki sisa sesi PT. Silakan beli paket PT.`, 'warning');
        return;
      }
      updatedMember = { ...member, ptQuota: (member.ptQuota || 0) - 1 };
    }

    const assignedLocker = checkInModal.withoutLocker ? undefined : checkInModal.selectedLockerNumber;

    if (assignedLocker) {
      setLockers((prev) =>
        prev.map((l) =>
          l.number === assignedLocker
            ? {
                ...l,
                isOccupied: true,
                memberId: member.id,
                memberName: member.name,
                timeIn: getTimestamp(),
                hasTowel: checkInModal.hasTowel,
                status: 'Terpakai'
              }
            : l
        )
      );
    }

    const newAtt: Attendance = {
      id: `ATT-${Date.now().toString().slice(-6)}`,
      date: APP_TODAY,
      timeIn: getTimestamp(),
      timeOut: '',
      memberId: member.id,
      memberName: member.name,
      type: checkInModal.visitType,
      badge: checkInModal.visitType === 'PT' ? 'Sesi PT' : 'Gym Reguler',
      lockerNumber: assignedLocker || undefined,
      lockerGender: member.gender === 'P' ? 'Wanita' : 'Pria',
      hasTowel: assignedLocker ? checkInModal.hasTowel : false,
      lockerReturned: false
    };

    onAddAttendance(newAtt, updatedMember);
    showToast(
      'Check-In Berhasil! ✅',
      `${member.name} berhasil masuk. ${assignedLocker ? `Kunci Loker #${assignedLocker} (${member.gender === 'P' ? 'Wanita' : 'Pria'}) diserahkan.` : '(Tanpa Loker)'}`,
      'success'
    );

    setCheckInModal({
      isOpen: false,
      member: null,
      selectedLockerNumber: null,
      withoutLocker: false,
      hasTowel: true,
      visitType: 'Reguler'
    });
  };

  // ---------------------------------------------------------------------------
  // FAST-TRACK CHECKOUT
  // ---------------------------------------------------------------------------
  const handlePerformCheckOut = (attId: string, memberName?: string, memberId?: string) => {
    onCheckoutMember(attId);

    // Release locker
    if (memberId || memberName) {
      setLockers((prev) =>
        prev.map((l) =>
          (l.memberId === memberId || l.memberName === memberName)
            ? {
                ...l,
                isOccupied: false,
                memberId: undefined,
                memberName: undefined,
                timeIn: undefined
              }
            : l
        )
      );
    }
  };

  // ---------------------------------------------------------------------------
  // FAST-TRACK RENEWAL SUBMISSION
  // ---------------------------------------------------------------------------
  const handleSaveRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForRenewal || !renewalPackageId) {
      showToast('Pilih Paket', 'Harap pilih paket perpanjangan membership.', 'warning');
      return;
    }

    const pkg = packages.find((p) => p.id === renewalPackageId);
    if (!pkg) {
      showToast('Paket Tidak Ditemukan', 'Data paket tidak valid.', 'error');
      return;
    }

    // Calculate new expiration date
    // If currently still active, extend from current expired date. If already expired, start from APP_TODAY
    const baseDate = getDayDiff(selectedMemberForRenewal.expired, APP_TODAY) >= 0
      ? selectedMemberForRenewal.expired
      : APP_TODAY;

    const baseD = new Date(baseDate + 'T00:00:00');
    const addedDays = pkg.cat === 'Membership' ? (pkg.value || 30) : 30;
    baseD.setDate(baseD.getDate() + addedDays);
    const newExpiredDate = baseD.toISOString().split('T')[0];

    // Additional PT Quota if package is PT
    const additionalPT = pkg.cat === 'PT' ? pkg.value : 0;

    const assignedPic = staffUsers.find((s) => s.id === renewalPicId) || staffUsers.find((s) => s.id === renewalStaffId);

    const updatedMember: Member = {
      ...selectedMemberForRenewal,
      expired: newExpiredDate,
      ptQuota: (selectedMemberForRenewal.ptQuota || 0) + additionalPT,
      picId: assignedPic?.id || selectedMemberForRenewal.picId,
      picName: assignedPic?.name || selectedMemberForRenewal.picName,
      status: 'AKTIF',
      isFrozen: false
    };

    onUpdateMember(updatedMember);

    // Record Transaction
    const newTrx: Transaction = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: APP_TODAY,
      time: getTimestamp(),
      desc: `Perpanjangan ${pkg.name} (${selectedMemberForRenewal.name})`,
      amount: pkg.price,
      amountPaid: pkg.price,
      amountRemaining: 0,
      type: pkg.cat === 'PT' ? 'PT' : 'Membership',
      method: renewalPaymentMethod,
      customer: selectedMemberForRenewal.name,
      memberId: selectedMemberForRenewal.id,
      cashier: currentUser?.name || 'Kasir Front Desk',
      status: 'Paid',
      picId: assignedPic?.id || renewalStaffId,
      picIds: [assignedPic?.id || renewalStaffId],
      picNames: assignedPic?.name || 'Staf Kasir'
    };

    onAddTransaction(newTrx);
    setIsRenewalModalOpen(false);
    setSelectedMemberForRenewal(null);
    setRenewalPackageId('');

    showToast(
      'Perpanjangan Berhasil! 🎉',
      `Masa aktif ${selectedMemberForRenewal.name} diperpanjang hingga ${formatDateIndo(newExpiredDate)}.`,
      'success'
    );
  };

  // ---------------------------------------------------------------------------
  // FAST-TRACK NEW MEMBER REGISTRATION
  // ---------------------------------------------------------------------------
  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name.trim() || !newMemberForm.phone.trim()) {
      showToast('Data Tidak Lengkap', 'Nama dan nomor telepon wajib diisi.', 'warning');
      return;
    }

    const pkg = packages.find((p) => p.id === newMemberForm.packageId) || packages[0];
    const durationDays = pkg ? (pkg.value || 30) : 30;

    const expD = new Date(APP_TODAY + 'T00:00:00');
    expD.setDate(expD.getDate() + durationDays);
    const expiredDate = expD.toISOString().split('T')[0];

    const newMemberId = `M${(members.length + 1).toString().padStart(3, '0')}`;
    const staffObj = staffUsers.find((s) => s.id === newMemberForm.assignedStaffId) || currentUser;

    const newMember: Member = {
      id: newMemberId,
      name: newMemberForm.name.trim(),
      phone: newMemberForm.phone.trim(),
      gender: newMemberForm.gender,
      expired: expiredDate,
      ptQuota: pkg?.cat === 'PT' ? pkg.value : 0,
      picId: staffObj?.id || 'S01',
      picName: staffObj?.name || 'Staf Kasir',
      isPicLocked: true,
      followUpStatus: 'Member Baru',
      photo: newMemberForm.gender === 'P'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      joinDate: APP_TODAY,
      notes: newMemberForm.notes || 'Registrasi meja front desk.',
      status: 'AKTIF',
      isFrozen: false
    };

    onAddMember(newMember);

    // Record payment transaction
    if (pkg && pkg.price > 0) {
      const trx: Transaction = {
        id: `TRX-REG-${Date.now().toString().slice(-5)}`,
        date: APP_TODAY,
        time: getTimestamp(),
        desc: `Pendaftaran Member Baru + ${pkg.name}`,
        amount: pkg.price,
        amountPaid: pkg.price,
        amountRemaining: 0,
        type: 'Membership',
        method: newMemberForm.paymentMethod,
        customer: newMember.name,
        memberId: newMember.id,
        cashier: currentUser?.name || 'Kasir Front Desk',
        status: 'Paid',
        picId: newMember.picId,
        picNames: newMember.picName
      };
      onAddTransaction(trx);
    }

    setIsNewMemberModalOpen(false);
    setNewMemberForm({
      name: '',
      phone: '',
      gender: 'L',
      packageId: '',
      paymentMethod: 'QRIS',
      notes: '',
      assignedStaffId: currentUser?.id || 'S01'
    });

    showToast(
      'Member Baru Terdaftar! 🌟',
      `${newMember.name} (${newMember.id}) berhasil didaftarkan dan dapat langsung check-in.`,
      'success'
    );
  };

  // ---------------------------------------------------------------------------
  // GENERATE WHATSAPP MESSAGE LINK
  // ---------------------------------------------------------------------------
  const getWhatsAppRenewalUrl = (member: Member, daysLeft: number) => {
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const greeting = `Halo Kak ${member.name}! 👋\n\nKami dari *GymPro Fitness & Wellness* ingin menginformasikan bahwa keanggotaan gym Kakak akan berakhir ${daysLeft <= 0 ? 'hari ini' : 'dalam ' + daysLeft + ' hari lagi'} (${formatDateIndo(member.expired)}).\n\n🔥 *Promo Spesial Front Desk*: Perpanjang membership hari ini dan nikmati voucher potongan 10% atau bonus 1 sesi Personal Trainer gratis!\n\nApakah ingin kami bantu amankan perpanjangannya sekarang, Kak? Terima kasih banyak! 💪✨`;
    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(greeting)}`;
  };

  const getWhatsAppMissYouUrl = (member: Member, daysAgo: number) => {
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const msg = `Halo Kak ${member.name}! Kami merindukan semangat latihan Kakak di GymPro! 💪✨ Sudah sekitar ${daysAgo} hari Kakak belum mampir ke gym. Jika ada kendala program latihan atau jadwal, tim kami siap membantu ya Kak. Sampai jumpa di gym! 🏋️`;
    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;
  };

  // ---------------------------------------------------------------------------
  // DESK POS FINANCIALS & CART CALCULATIONS
  // ---------------------------------------------------------------------------
  const todayDeskTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === APP_TODAY);
  }, [transactions]);

  const todayCashTotal = useMemo(() => {
    return todayDeskTransactions
      .filter((t) => t.method === 'Cash' && t.status === 'Paid')
      .reduce((sum, t) => sum + (t.amountPaid || t.amount || 0), 0);
  }, [todayDeskTransactions]);

  const todayNonCashTotal = useMemo(() => {
    return todayDeskTransactions
      .filter((t) => t.method !== 'Cash' && t.status === 'Paid')
      .reduce((sum, t) => sum + (t.amountPaid || t.amount || 0), 0);
  }, [todayDeskTransactions]);

  const todayDeskTotalRevenue = useMemo(() => {
    return todayCashTotal + todayNonCashTotal;
  }, [todayCashTotal, todayNonCashTotal]);

  const storedLostFoundCount = useMemo(() => {
    return lostFoundList.filter((l) => l.status === 'STORED').length;
  }, [lostFoundList]);

  // Cart operations
  const handleAddToCart = (product: QuickDeskProduct) => {
    setQuickCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    showToast('Item Ditambahkan 🛒', `${product.name} dimasukkan ke keranjang kasir.`, 'info');
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setQuickCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: QuickDeskProduct; qty: number }[];
    });
  };

  const handleClearCart = () => {
    setQuickCart([]);
  };

  const cartSubtotal = useMemo(() => {
    return quickCart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  }, [quickCart]);

  const activeMemberSelected = useMemo(() => {
    return members.find((m) => m.id === selectedDeskMemberId);
  }, [members, selectedDeskMemberId]);

  // 5% discount for active gym members on items
  const cartDiscount = useMemo(() => {
    if (deskCustomerType === 'member' && activeMemberSelected && activeMemberSelected.status === 'AKTIF') {
      return Math.round(cartSubtotal * 0.05);
    }
    return 0;
  }, [cartSubtotal, deskCustomerType, activeMemberSelected]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - cartDiscount);
  }, [cartSubtotal, cartDiscount]);

  const changeAmount = useMemo(() => {
    if (deskPaymentMethod === 'Cash') {
      return Math.max(0, (deskCashGiven || 0) - cartTotal);
    }
    return 0;
  }, [deskPaymentMethod, deskCashGiven, cartTotal]);

  const handleProcessDeskCheckout = () => {
    if (quickCart.length === 0) {
      showToast('Keranjang Kosong', 'Pilih minimal 1 item layanan atau produk.', 'warning');
      return;
    }

    const customerName = deskCustomerType === 'member'
      ? (activeMemberSelected?.name || 'Member Terdaftar')
      : (deskGuestName.trim() || 'Tamu Walk-in');

    if (deskCustomerType === 'member' && !selectedDeskMemberId) {
      showToast('Pilih Member', 'Silakan tentukan member yang melakukan transaksi.', 'warning');
      return;
    }

    if (deskPaymentMethod === 'Cash' && deskCashGiven < cartTotal) {
      showToast('Uang Pembayaran Kurang', `Total tagihan ${formatRp(cartTotal)}, uang tunai yang diterima kurang.`, 'warning');
      return;
    }

    const trxId = `TRX-DESK-${Date.now().toString().slice(-6)}`;
    const itemSummary = quickCart.map((i) => `${i.product.name} (x${i.qty})`).join(', ');

    const newTrx: Transaction = {
      id: trxId,
      date: APP_TODAY,
      time: getTimestamp(),
      desc: `Kasir Front Desk: ${itemSummary}`,
      amount: cartTotal,
      amountPaid: cartTotal,
      amountRemaining: 0,
      type: 'POS',
      method: deskPaymentMethod,
      customer: customerName,
      memberId: deskCustomerType === 'member' ? selectedDeskMemberId : undefined,
      cashier: currentUser?.name || 'Kasir Front Desk',
      status: 'Paid',
      picId: currentUser?.id || 'S01',
      picNames: currentUser?.name || 'Staf Kasir'
    };

    onAddTransaction(newTrx);

    // Set receipt modal data
    setReceiptModalData({
      trxId,
      date: APP_TODAY,
      time: getTimestamp(),
      customerName,
      memberId: deskCustomerType === 'member' ? selectedDeskMemberId : undefined,
      cashierName: currentUser?.name || 'Kasir Front Desk',
      items: quickCart.map((i) => ({
        name: i.product.name,
        price: i.product.price,
        qty: i.qty,
        total: i.product.price * i.qty
      })),
      total: cartTotal,
      paymentMethod: deskPaymentMethod,
      cashGiven: deskPaymentMethod === 'Cash' ? deskCashGiven : undefined,
      changeGiven: deskPaymentMethod === 'Cash' ? changeAmount : undefined
    });

    // If replacement card was purchased, auto-annotate member
    if (quickCart.some((i) => i.product.id === 'DP-01') && activeMemberSelected) {
      onUpdateMember({
        ...activeMemberSelected,
        notes: `${activeMemberSelected.notes || ''} [Ganti kartu RFID ${APP_TODAY}]`.trim()
      });
    }

    // Reset Cart
    setQuickCart([]);
    setDeskCashGiven(0);
    if (deskCustomerType === 'guest') setDeskGuestName('');

    showToast('Transaksi Selesai! 🧾', `Pembayaran sebesar ${formatRp(cartTotal)} berhasil diproses.`, 'success');
  };

  // ---------------------------------------------------------------------------
  // LOST & FOUND ACTIONS
  // ---------------------------------------------------------------------------
  const handleSaveNewLostFound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLostFoundForm.itemName.trim() || !newLostFoundForm.foundLocation.trim()) {
      showToast('Data Tidak Lengkap', 'Nama barang dan lokasi penemuan wajib diisi.', 'warning');
      return;
    }

    const newItem: LostFoundItem = {
      id: `LF-${Date.now().toString().slice(-5)}`,
      itemName: newLostFoundForm.itemName.trim(),
      category: newLostFoundForm.category,
      foundLocation: newLostFoundForm.foundLocation.trim(),
      foundDate: APP_TODAY,
      foundTime: getTimestamp(),
      finderStaffName: newLostFoundForm.finderStaffName.trim() || (currentUser?.name || 'Staf Front Desk'),
      status: 'STORED',
      notes: newLostFoundForm.notes.trim()
    };

    const updated = [newItem, ...lostFoundList];
    saveLostFoundToStorage(updated);
    setIsAddLostFoundOpen(false);
    setNewLostFoundForm({
      itemName: '',
      category: 'Botol/Tumbler',
      foundLocation: '',
      finderStaffName: currentUser?.name || 'Staf Front Desk',
      notes: ''
    });

    showToast('Barang Dicatat! 📦', `Barang "${newItem.itemName}" berhasil disimpan di brankas/laci kasir.`, 'success');
  };

  const handleClaimLostFound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLostFoundForClaim) return;

    const claimant = claimForm.memberId
      ? members.find((m) => m.id === claimForm.memberId)?.name || claimForm.claimantName
      : claimForm.claimantName;

    if (!claimant.trim()) {
      showToast('Nama Pengambil Diperlukan', 'Isi nama atau pilih member yang mengambil barang.', 'warning');
      return;
    }

    const updated = lostFoundList.map((item) => {
      if (item.id === targetLostFoundForClaim.id) {
        return {
          ...item,
          status: 'CLAIMED' as const,
          claimedByMemberId: claimForm.memberId || undefined,
          claimedByMemberName: claimant,
          claimedDate: `${APP_TODAY} ${getTimestamp()}`,
          notes: claimForm.notes ? `${item.notes ? item.notes + ' | ' : ''}Klaim: ${claimForm.notes}` : item.notes
        };
      }
      return item;
    });

    saveLostFoundToStorage(updated);
    setTargetLostFoundForClaim(null);
    setClaimForm({ memberId: '', claimantName: '', notes: '' });

    showToast('Barang Diserahkan! 🤝', `Barang berhasil diserahkan kepada ${claimant}.`, 'success');
  };

  // ---------------------------------------------------------------------------
  // SHIFT HANDOVER LOG ACTIONS
  // ---------------------------------------------------------------------------
  const handleSaveHandoverNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandoverForm.notes.trim()) {
      showToast('Catatan Kosong', 'Isi keterangan pesan serah terima shift.', 'warning');
      return;
    }

    const newNote: ShiftHandoverNote = {
      id: `SH-${Date.now().toString().slice(-5)}`,
      timestamp: `${APP_TODAY} ${getTimestamp()}`,
      authorStaffName: currentUser?.name || 'Staf Kasir',
      shift: newHandoverForm.shift,
      cashDrawerActual: newHandoverForm.cashDrawerActual,
      notes: newHandoverForm.notes.trim(),
      isImportant: newHandoverForm.isImportant
    };

    const updated = [newNote, ...handoverNotes];
    saveHandoversToStorage(updated);
    setIsAddHandoverOpen(false);
    setNewHandoverForm({
      shift: 'Pagi (06:00 - 14:00)',
      cashDrawerActual: todayCashTotal + 500000,
      notes: '',
      isImportant: false
    });

    showToast('Catatan Shift Tersimpan 📋', 'Pesan serah terima telah ditambahkan ke buku log shift kasir.', 'success');
  };

  // ---------------------------------------------------------------------------
  // UNIVERSAL 360 SEARCH RESULTS
  // ---------------------------------------------------------------------------
  const universalSearchResults = useMemo(() => {
    if (!universalSearchQuery.trim()) return [];
    const q = universalSearchQuery.toLowerCase();
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.phone.includes(q)
      )
      .slice(0, 6);
  }, [members, universalSearchQuery]);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. FRONT DESK COMMAND & STATUS HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Portal Front Desk & Kasir
              </span>
              <span className="text-zinc-500 text-xs">·</span>
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Shift: <strong className="text-white">{currentUser?.shift || 'Pagi'}</strong>
              </span>
              <span className="text-zinc-500 text-xs">·</span>
              <RealTimeClock variant="badge" />
              <span className="text-zinc-500 text-xs">·</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${isStoreClosed ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                {isStoreClosed ? 'Kasir Tutup' : 'Kasir Buka'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pusat Pelayanan Member & Asisten Cerdas Kasir
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Fasilitasi seluruh alur hidup member: check-in presensi gate, perpanjangan instan, registrasi kilat, manajemen loker, kasir tagihan desk, lost & found, dan rekomendasi churn.
            </p>

            {/* Quick 360 Universal Member Search Bar */}
            <div className="mt-4 relative max-w-xl">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari Cepat 360: Ketik Nama, ID Member (M001), atau No WhatsApp..."
                  value={universalSearchQuery}
                  onChange={(e) => {
                    setUniversalSearchQuery(e.target.value);
                    setIsUniversalSearchOpen(true);
                  }}
                  onFocus={() => setIsUniversalSearchOpen(true)}
                  className="w-full pl-10 pr-24 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-inner"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 font-mono">
                  360 View
                </span>
              </div>

              {/* Instant Dropdown Preview */}
              {isUniversalSearchOpen && universalSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-800">
                  <div className="p-2 bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-400 px-3">
                    <span className="font-bold text-zinc-300">Hasil Pencarian Kilat ({universalSearchResults.length})</span>
                    <button
                      type="button"
                      onClick={() => setIsUniversalSearchOpen(false)}
                      className="hover:text-white"
                    >
                      Tutup
                    </button>
                  </div>
                  {universalSearchResults.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setQuick360Member(m);
                        setIsUniversalSearchOpen(false);
                      }}
                      className="p-3 hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={m.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                          alt={m.name}
                          className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs group-hover:text-orange-400 transition">{m.name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700">{m.id}</span>
                          </div>
                          <span className="text-[11px] text-zinc-400">{m.phone} · Exp: {formatDateIndo(m.expired)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          m.status === 'AKTIF' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {m.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewMemberModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-500/20 flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Member Baru
            </button>

            <button
              type="button"
              onClick={() => setIsGuestPassModalOpen(true)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center gap-2 active:scale-95"
            >
              <TicketIcon className="w-4 h-4 text-amber-400" />
              Guest Pass / Visit
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pos_desk')}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center gap-2 active:scale-95"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              Kasir Meja
              {quickCart.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[10px] font-black">
                  {quickCart.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('helpdesk')}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center gap-2 active:scale-95"
            >
              <Archive className="w-4 h-4 text-sky-400" />
              Lost & Found
              {storedLostFoundCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black">
                  {storedLostFoundCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('pos')}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              Kasir POS FnB
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Sedang di Gym
            </span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {currentlyInGymAttendances.length}
            </span>
            <span className="text-[10px] text-zinc-500">Live di lantai gym</span>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Total Check-In
            </span>
            <span className="text-xl font-black text-white mt-0.5 block">
              {todayAttendances.length}
            </span>
            <span className="text-[10px] text-zinc-500">Hari ini ({APP_TODAY})</span>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Hampir Habis
            </span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">
              {expiringMembers.length}
            </span>
            <span className="text-[10px] text-zinc-500">≤ 7 hari lagi</span>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
              Expired
            </span>
            <span className="text-xl font-black text-red-400 mt-0.5 block">
              {expiredMembers.length}
            </span>
            <span className="text-[10px] text-zinc-500">Perlu re-aktivasi</span>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
              Sesi PT Kritis
            </span>
            <span className="text-xl font-black text-sky-400 mt-0.5 block">
              {lowPTMembers.length}
            </span>
            <span className="text-[10px] text-zinc-500">Tersisa 1-2 sesi</span>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider block flex items-center gap-1">
              <Snowflake className="w-3 h-3" /> Sedang Cuti
            </span>
            <span className="text-xl font-black text-violet-400 mt-0.5 block">
              {frozenMembers.length}
            </span>
            <span className="text-[10px] text-zinc-500">Membership freeze</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SUB-TABS NAVIGATION CONTROLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 w-fit overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'radar'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Radar & Asisten Cerdas
          {(expiringMembers.length > 0 || lowPTMembers.length > 0) && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-[10px] text-white font-black">
              {expiringMembers.length + lowPTMembers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checkin')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'checkin'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          Presensi & Live Lantai Gym
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            {currentlyInGymAttendances.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'members'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          Operasional Member ({members.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lockers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'lockers'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Key className="w-4 h-4 text-amber-400" />
          Titipan Loker & Handuk
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'reservations'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          Tiket Reservasi Online
          {onlineReservations.filter((r) => r.status === 'CONFIRMED').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-black animate-pulse">
              {onlineReservations.filter((r) => r.status === 'CONFIRMED').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pos_desk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'pos_desk'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          Kasir & Tagihan Member
          {quickCart.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[10px] font-black">
              {quickCart.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('helpdesk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'helpdesk'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Archive className="w-4 h-4 text-sky-400" />
          Layanan & Lost-Found
          {storedLostFoundCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black">
              {storedLostFoundCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'suggestions'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-violet-400" />
          Saran Fitur & SOP Kasir
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SUB-VIEW: RADAR & ASISTEN PINTAR (SARAN & REKOMENDASI FITUR) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Recommendation Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-4 sm:p-5 rounded-3xl border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Radar Retensi & Peluang Renewal Member Hari Ini
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sistem mendeteksi <strong>{expiringMembers.length} member</strong> yang masa aktifnya habis dalam 7 hari ke depan dan <strong>{lowPTMembers.length} member</strong> dengan kuota sesi bimbingan kritis. Gunakan template WhatsApp instan untuk mengamankan renewal sebelum mereka churn.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition shrink-0 flex items-center gap-1.5 self-start md:self-auto"
            >
              Lihat Seluruh Member
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Radar Grid: 3 Main Pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pillar 1: Churn Warning (Expiring <= 7 Days) */}
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Hampir Expired (≤ 7 Hari)
                  </h4>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {expiringMembers.length} Member
                </span>
              </div>

              {expiringMembers.length > 0 ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {expiringMembers.map(({ member, daysLeft }) => (
                    <div
                      key={member.id}
                      className="p-3 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 hover:border-amber-500/40 transition space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-8 h-8 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs block truncate">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              {member.id} · {member.phone}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ${daysLeft === 0 ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                          {daysLeft === 0 ? 'Hari Ini!' : `${daysLeft} hari lagi`}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
                        <span>Expired: {formatDateIndo(member.expired)}</span>
                        <span>PIC: {member.picName}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={getWhatsAppRenewalUrl(member, daysLeft)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat WhatsApp
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenRenewalModal(member)}
                          className="flex-1 py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Perpanjang
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs italic bg-zinc-950/40 rounded-2xl border border-zinc-800">
                  Tidak ada member yang akan kedaluwarsa dalam 7 hari ini. Semua aman! 👍
                </div>
              )}
            </div>

            {/* Pillar 2: PT Session Depletion Warning (<= 2 Sessions Left) */}
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Sisa Kuota PT Menipis (≤ 2 Sesi)
                  </h4>
                </div>
                <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                  {lowPTMembers.length} Klien
                </span>
              </div>

              {lowPTMembers.length > 0 ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {lowPTMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 hover:border-sky-500/40 transition space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-8 h-8 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs block truncate">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              Pelatih: {member.picName}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
                          Sisa {member.ptQuota} Sesi
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded-xl">
                        💡 <strong>Saran Kasir:</strong> Tawarkan promo renewal paket PT 10 sesi dengan cashback suplemen sebelum kuota habis total.
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenRenewalModal(member)}
                          className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Top Up Sesi PT Baru
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs italic bg-zinc-950/40 rounded-2xl border border-zinc-800">
                  Tidak ada klien PT dengan sisa kuota kritis saat ini.
                </div>
              )}
            </div>

            {/* Pillar 3: Inactive At-Risk Members (> 14 Days Absent) */}
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400"></div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Member Pasif (Lama Tidak Hadir)
                  </h4>
                </div>
                <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                  {inactiveMembers.length} Member
                </span>
              </div>

              {inactiveMembers.length > 0 ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {inactiveMembers.slice(0, 8).map(({ member, daysSinceLastSeen }) => (
                    <div
                      key={member.id}
                      className="p-3 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 hover:border-violet-500/40 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-8 h-8 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs block truncate">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              {member.phone}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                          {daysSinceLastSeen} Hari Absen
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={getWhatsAppMissYouUrl(member, daysSinceLastSeen)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 px-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Kirim Sapaan Kangen
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs italic bg-zinc-950/40 rounded-2xl border border-zinc-800">
                  Seluruh member aktif rutin berlatih ke gym dalam 2 pekan terakhir! ✨
                </div>
              )}
            </div>
          </div>

          {/* Birthday Celebration Card */}
          {birthdayMembers.length > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-zinc-900 border border-pink-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-500/20 text-pink-400 rounded-2xl border border-pink-500/30 shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Klub Ulang Tahun Member ({birthdayMembers.length} Orang Bulan Ini) 🎂
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Member berulang tahun: <strong>{birthdayMembers.map((m) => m.name).join(', ')}</strong>. Berikan ucapan selamat langsung saat tap kartu atau tawarkan free shake protein di kasir!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('pos')}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-md"
              >
                Klaim Voucher Minuman POS
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. SUB-VIEW: CHECK-IN GATE & LIVE FLOOR ATTENDANCE */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'checkin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Quick Tap Check-In Terminal (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Terminal Gate Presensi</h3>
                    <p className="text-[11px] text-zinc-400">Scan barcode atau ketik nama/ID member</p>
                  </div>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Ketik nama, ID (M001), atau nomor HP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              {/* Quick Results List for Check-In */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredMembers.slice(0, 10).map((member) => {
                  const isInGym = activeInGymMemberIds.has(member.id);
                  const isExp = getDayDiff(member.expired, APP_TODAY) < 0;
                  const isFrz = member.isFrozen || member.status === 'FREEZE';

                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isInGym
                          ? 'bg-emerald-950/20 border-emerald-800/40'
                          : isExp
                          ? 'bg-red-950/20 border-red-800/40'
                          : isFrz
                          ? 'bg-purple-950/20 border-purple-800/40'
                          : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-9 h-9 rounded-xl object-cover border border-zinc-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs truncate">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({member.id})
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {isExp ? (
                              <strong className="text-red-400">Expired ({formatDateIndo(member.expired)})</strong>
                            ) : isFrz ? (
                              <strong className="text-purple-400">Freeze / Cuti</strong>
                            ) : (
                              <span>Aktif s/d {formatDateIndo(member.expired)}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {isInGym ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Di Gym
                          </span>
                        ) : isExp ? (
                          <button
                            type="button"
                            onClick={() => handleOpenRenewalModal(member)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-bold transition shadow-xs"
                          >
                            Perpanjang
                          </button>
                        ) : isFrz ? (
                          <button
                            type="button"
                            onClick={() => onOpenUnfreezeModal(member)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold transition shadow-xs"
                          >
                            Unfreeze
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePerformCheckIn(member)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Tap In
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Live Floor List - Currently In Facility (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Member Sedang Berada di Gym Saat Ini
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Total {currentlyInGymAttendances.length} member belum check-out
                  </p>
                </div>

                <span className="text-[11px] font-bold text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                  Tanggal: {formatDateIndo(APP_TODAY)}
                </span>
              </div>

              {currentlyInGymAttendances.length > 0 ? (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {currentlyInGymAttendances.map((att) => {
                    const memberObj = members.find((m) => m.id === att.memberId || m.name === att.memberName);
                    const occupiedLocker = lockers.find((l) => l.memberId === att.memberId || l.memberName === att.memberName);

                    return (
                      <div
                        key={att.id}
                        className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {memberObj?.photo ? (
                            <img
                              src={memberObj.photo}
                              alt={att.memberName}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0">
                              {att.memberName.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs truncate">
                                {att.memberName}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ({att.memberId || 'VISIT'})
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {att.badge}
                              </span>
                            </div>

                            <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1 text-zinc-400">
                                <Clock className="w-3 h-3 text-zinc-500" />
                                Masuk: <strong className="text-zinc-300">{att.timeIn}</strong>
                              </span>
                              {occupiedLocker && (
                                <span className="flex items-center gap-1 text-amber-400 font-bold">
                                  <Key className="w-3 h-3" />
                                  Loker #{occupiedLocker.number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Check-Out Button */}
                        <button
                          type="button"
                          onClick={() => handlePerformCheckOut(att.id, att.memberName, att.memberId)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300 border border-zinc-700 hover:border-red-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                          Tap Out
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500 text-xs italic bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800 space-y-2">
                  <UserCheck className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p>Belum ada member yang check-in atau semua sudah check-out hari ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. SUB-VIEW: OPERASIONAL & DIREKTORI MEMBER LENGKAP */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'members' && (
        <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-5">
          {/* Controls Bar: Search & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari nama, ID member, nomor WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px] overflow-x-auto">
              <button
                type="button"
                onClick={() => setMemberFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                  memberFilter === 'ALL'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                  memberFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('EXPIRING')}
                className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                  memberFilter === 'EXPIRING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hampir Habis ({expiringMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('EXPIRED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                  memberFilter === 'EXPIRED'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Expired ({expiredMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('FREEZE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                  memberFilter === 'FREEZE'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Cuti ({frozenMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('PT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                  memberFilter === 'PT'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Member PT
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800 text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-bold pl-2">Member</th>
                  <th className="pb-3 font-bold">Status & Expired</th>
                  <th className="pb-3 font-bold">Sesi PT</th>
                  <th className="pb-3 font-bold">PIC Staf</th>
                  <th className="pb-3 font-bold text-center">Presensi Hari Ini</th>
                  <th className="pb-3 font-bold text-right pr-2">Aksi Meja Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredMembers.map((member) => {
                  const isInGym = activeInGymMemberIds.has(member.id);
                  const daysLeft = getDayDiff(member.expired, APP_TODAY);
                  const isExp = daysLeft < 0;
                  const isNearExp = daysLeft >= 0 && daysLeft <= 7;
                  const isFrz = member.isFrozen || member.status === 'FREEZE';

                  return (
                    <tr key={member.id} className="hover:bg-zinc-800/30 transition">
                      {/* Member Info */}
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate leading-tight">
                              {member.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                              <span className="font-mono text-zinc-500">{member.id}</span>
                              <span>·</span>
                              <span>{member.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Expiry */}
                      <td className="py-3">
                        {isFrz ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30 inline-block">
                              Cuti / Freeze
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              Masa aktif ditangguhkan
                            </span>
                          </div>
                        ) : isExp ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 inline-block">
                              Expired {Math.abs(daysLeft)} hari lalu
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              {formatDateIndo(member.expired)}
                            </span>
                          </div>
                        ) : isNearExp ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-block">
                              {daysLeft === 0 ? 'Habis Hari Ini!' : `${daysLeft} hari lagi`}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              {formatDateIndo(member.expired)}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-block">
                              Aktif ({daysLeft} hari)
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              s/d {formatDateIndo(member.expired)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* PT Sessions */}
                      <td className="py-3">
                        {member.ptQuota > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-white text-xs block">
                              {member.ptQuota} Sesi
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              Coach: {member.picName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* PIC Staff */}
                      <td className="py-3 text-zinc-300 font-medium">
                        {member.picName || 'Front Desk'}
                      </td>

                      {/* Live Gym Status */}
                      <td className="py-3 text-center">
                        {isInGym ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Di Lantai Gym
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">Belum Hadir</span>
                        )}
                      </td>

                      {/* Cashier Actions */}
                      <td className="py-3 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Check-In / Check-Out */}
                          {!isInGym && !isExp && !isFrz && (
                            <button
                              type="button"
                              onClick={() => handlePerformCheckIn(member)}
                              title="Check-in Kunjungan"
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Renewal */}
                          <button
                            type="button"
                            onClick={() => handleOpenRenewalModal(member)}
                            title="Perpanjang / Beli Paket"
                            className="p-1.5 bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 rounded-lg text-xs font-bold transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Freeze / Unfreeze */}
                          {isFrz ? (
                            <button
                              type="button"
                              onClick={() => onOpenUnfreezeModal(member)}
                              title="Buka Cuti (Unfreeze)"
                              className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition"
                            >
                              <Snowflake className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenFreezeModal(member)}
                              title="Ajukan Cuti (Freeze)"
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition"
                            >
                              <Snowflake className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* ID Card */}
                          <button
                            type="button"
                            onClick={() => onOpenIDCard(member)}
                            title="Cetak ID Card Digital"
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition"
                          >
                            <IdCard className="w-3.5 h-3.5" />
                          </button>

                          {/* 360 Detail Modal */}
                          <button
                            type="button"
                            onClick={() => onOpenMemberDetail(member)}
                            title="Profil 360 & Riwayat"
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
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
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. SUB-VIEW: TITIPAN LOKER & HANDUK DIGITAL (MASTER & PENGATURAN LOKER) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'lockers' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <LockerManagementView
            lockers={lockers}
            onUpdateLockers={onUpdateLockers || setLockers}
            members={members}
            attendances={attendances}
            onAddAttendance={onAddAttendance}
            onCheckoutMember={onCheckoutMember}
            onReleaseLocker={onReleaseLocker}
            onSwapLocker={onSwapLocker}
            showToast={showToast}
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. SUB-VIEW: PUSAT SARAN FITUR & SOP KASIR FRONT DESK */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-400" />
              Rekomendasi Fitur Cerdas & Standar Pelayanan Kasir Front Desk
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Panduan operasional dan fitur interaktif yang dirancang untuk mempercepat kerja staf resepsionis dan meningkatkan kepuasan member.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature Suggestion 1 */}
            <div className="bg-zinc-950/80 p-5 rounded-3xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Mode Barcode & RFID Gate Cepat</h4>
                  <span className="text-[10px] text-emerald-400 font-bold">Fitur Direkomendasikan</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Staf kasir dapat menggunakan alat barcode scanner USB atau kamera webcam untuk memindai kartu fisik member tanpa perlu mengetik manual. Mengurangi antrean saat jam sibuk (*rush hour* 17.00 - 20.00).
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('checkin')}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                Buka Terminal Gate
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature Suggestion 2 */}
            <div className="bg-zinc-950/80 p-5 rounded-3xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Walk-in Daily Pass (Visit Harian)</h4>
                  <span className="text-[10px] text-amber-400 font-bold">Monetisasi Tamu Spontan</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Bagi tamu non-member yang ingin mencoba fasilitas fitness selama 1 hari, cetak tiket harian Rp 50.000 dengan nomor loker otomatis dan log kunjungan langsung tanpa perlu registrasi panjang.
              </p>
              <button
                type="button"
                onClick={() => setIsGuestPassModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                Cetak Tiket Visit
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature Suggestion 3 */}
            <div className="bg-zinc-950/80 p-5 rounded-3xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Freeze & Cuti Instan Meja Front Desk</h4>
                  <span className="text-[10px] text-sky-400 font-bold">Mencegah Komplain Kedaluwarsa</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Saat member memberi kabar akan pergi dinas atau sakit, kasir dapat langsung membekukan keanggotaan dalam 1 klik tanpa perlu menunggu approval bertingkat, dengan penyesuaian otomatis tanggal expired.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('freeze')}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                Buka Modul Freeze
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature Suggestion 4 */}
            <div className="bg-zinc-950/80 p-5 rounded-3xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-500/20 text-violet-400 rounded-xl border border-violet-500/30">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">WhatsApp Web One-Click Blast</h4>
                  <span className="text-[10px] text-violet-400 font-bold">Automasi Sapaan Ramah</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Menghubungkan kasir langsung ke WhatsApp Web tanpa harus menyimpan nomor telepon member terlebih dahulu di smartphone meja kasir. Menghemat 70% waktu follow up harian.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('radar')}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                Lihat Radar WhatsApp
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 5-Step Customer Service Excellence SOP */}
          <div className="p-6 bg-zinc-950/90 rounded-3xl border border-zinc-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-400" />
              Standar Operasional Prosedur (SOP) Pelayanan Front Desk Bintang 5
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">1</span>
                <span className="font-bold text-white block pt-1">Senyum & Sapa 3S</span>
                <p className="text-[11px] text-zinc-400">Sapa nama member saat mereka mendekat ke meja gate.</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">2</span>
                <span className="font-bold text-white block pt-1">Verifikasi & Loker</span>
                <p className="text-[11px] text-zinc-400">Pastikan kartu aktif dan berikan kunci loker bersih.</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">3</span>
                <span className="font-bold text-white block pt-1">Ingatkan Sesi PT</span>
                <p className="text-[11px] text-zinc-400">Beri info jika coach trainer mereka sudah menunggu di gym.</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">4</span>
                <span className="font-bold text-white block pt-1">Renewal Reminder</span>
                <p className="text-[11px] text-zinc-400">Sampaikan promo jika masa berlaku sisa ≤ 7 hari.</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">5</span>
                <span className="font-bold text-white block pt-1">Salam Semangat</span>
                <p className="text-[11px] text-zinc-400">Ucapkan "Selamat berlatih, semoga sehat selalu!"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6.5 SUB-VIEW: TIKET RESERVASI ONLINE RFA GYM (RESERVATIONS) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'reservations' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Header Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/15 text-orange-400 rounded-2xl border border-orange-500/30">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tiket Reservasi Online RFA Gym Platform</h3>
                  <p className="text-xs text-zinc-400">
                    Verifikasi tiket booking online, scan passcode turnstile, dan check-in kedatangan tamu/member secara terpadu.
                  </p>
                </div>
              </div>

              {/* Fast Lookup Input */}
              <div className="relative min-w-[260px] sm:min-w-[320px]">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Scan / Cari No. Booking, Nama, No. HP..."
                  value={reservationSearchQuery}
                  onChange={(e) => setReservationSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                {reservationSearchQuery && (
                  <button
                    onClick={() => setReservationSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Reservasi</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {onlineReservations.length}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Menunggu Hadir</span>
                <span className="text-xl font-black text-orange-400 mt-1 block">
                  {onlineReservations.filter((r) => r.status === 'CONFIRMED').length}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sudah Check-In</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">
                  {onlineReservations.filter((r) => r.status === 'COMPLETED').length}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Dibatalkan</span>
                <span className="text-xl font-black text-zinc-400 mt-1 block">
                  {onlineReservations.filter((r) => r.status === 'CANCELLED').length}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: `Semua (${onlineReservations.length})` },
              { id: 'CONFIRMED', label: `Terkonfirmasi (${onlineReservations.filter((r) => r.status === 'CONFIRMED').length})` },
              { id: 'COMPLETED', label: `Selesai (${onlineReservations.filter((r) => r.status === 'COMPLETED').length})` },
              { id: 'CANCELLED', label: `Dibatalkan (${onlineReservations.filter((r) => r.status === 'CANCELLED').length})` }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setReservationStatusFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  reservationStatusFilter === f.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reservations List */}
          <div className="space-y-3">
            {onlineReservations
              .filter((res) => {
                if (reservationStatusFilter !== 'ALL' && res.status !== reservationStatusFilter) {
                  return false;
                }
                if (reservationSearchQuery.trim()) {
                  const q = reservationSearchQuery.toLowerCase();
                  const matchId = res.id.toLowerCase().includes(q);
                  const matchName = res.customerName.toLowerCase().includes(q);
                  const matchPhone = res.customerPhone.includes(q);
                  const matchCode = res.ticketPassCode.toLowerCase().includes(q);
                  const matchProgram = res.programName.toLowerCase().includes(q);
                  return matchId || matchName || matchPhone || matchCode || matchProgram;
                }
                return true;
              })
              .map((res) => {
                const isConfirmed = res.status === 'CONFIRMED';
                const isCompleted = res.status === 'COMPLETED';
                const isCancelled = res.status === 'CANCELLED';

                return (
                  <div
                    key={res.id}
                    className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-orange-400">
                          {res.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-300 border border-zinc-700">
                          PASS: {res.ticketPassCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isConfirmed
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : isCompleted
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {res.status}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {res.programCategory}
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-white">
                        {res.programName}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-300 pt-1">
                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">Pemesan:</span>
                          <span className="font-semibold text-white">{res.customerName}</span>{' '}
                          {res.memberId && <span className="text-zinc-400 font-mono">({res.memberId})</span>}
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">Waktu Latihan:</span>
                          <span>{res.targetDate} ({res.timeSlot})</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold">Lokasi / Trainer:</span>
                          <span>{res.branchName} {res.trainerName ? `• Coach ${res.trainerName}` : ''}</span>
                        </div>
                      </div>

                      {res.notes && (
                        <p className="text-[11px] text-zinc-400 italic pt-1">
                          Catatan: "{res.notes}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0">
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onCheckinReservation) {
                              onCheckinReservation(res.id);
                            }
                            const matchedMember = members.find(
                              (m) =>
                                m.id.toLowerCase() === (res.memberId || '').toLowerCase() ||
                                m.phone.replace(/[^0-9]/g, '') === res.customerPhone.replace(/[^0-9]/g, '') ||
                                m.name.toLowerCase() === res.customerName.toLowerCase()
                            );
                            const now = new Date();
                            const timeNow = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;
                            const newAtt: Attendance = {
                              id: `ATT-RES-${Date.now()}`,
                              date: APP_TODAY,
                              timeIn: timeNow,
                              timeOut: '',
                              memberId: matchedMember?.id || 'GUEST-ONLINE',
                              memberName: res.customerName,
                              type: res.type === 'pt' ? 'PT' : res.type === 'daypass' ? 'Reguler' : 'Studio Class',
                              badge: res.programName || 'Online Booking',
                              lockerNumber: 'Loker Harian'
                            };
                            onAddAttendance(newAtt, matchedMember);
                            showToast('Check-In Berhasil', `Tiket ${res.id} (${res.customerName}) telah diverifikasi & check-in masuk gym.`, 'success');
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Check-In Tamu</span>
                        </button>
                      )}

                      {/* WhatsApp CS Chat */}
                      <a
                        href={`https://wa.me/${res.customerPhone.replace(/[^0-9]/g, '').startsWith('0') ? '62' + res.customerPhone.replace(/[^0-9]/g, '').slice(1) : res.customerPhone.replace(/[^0-9]/g, '')}?text=Halo%20Kak%20${encodeURIComponent(res.customerName)},%20kami%20dari%20Front%20Desk%20RFA%20Gym%20mengonfirmasi%20reservasi%20${encodeURIComponent(res.programName)}%20(${res.id})`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 transition"
                        title="Chat Tamu via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {isConfirmed && onCancelReservation && (
                        <button
                          type="button"
                          onClick={() => {
                            onCancelReservation(res.id);
                            showToast('Reservasi Dibatalkan', `Tiket ${res.id} berhasil dibatalkan.`, 'info');
                          }}
                          className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition"
                          title="Batalkan Tiket Ini"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {onlineReservations.length === 0 && (
              <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-500 text-xs">
                Belum ada tiket reservasi online yang masuk hari ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. SUB-VIEW: KASIR MEJA FRONT DESK & TAGIHAN MEMBER (POS_DESK) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'pos_desk' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Cash Drawer & Shift Summary Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Kasir Cepat & Tagihan Meja Front Desk</h3>
                  <p className="text-xs text-zinc-400">
                    Proses transaksi langsung: ganti kartu RFID, sewa loker/handuk, denda, walk-in pass, dan suplemen gym.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftClosingModalOpen(true)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center gap-1.5 active:scale-95"
                >
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  Rekonsiliasi Laci Shift
                </button>
              </div>
            </div>

            {/* Shift Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Total Omset Kasir Hari Ini
                </span>
                <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                  {formatRp(todayDeskTotalRevenue)}
                </span>
                <span className="text-[10px] text-zinc-500">{todayDeskTransactions.length} transaksi selesai</span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Tunai di Laci Kasir (Cash)
                </span>
                <span className="text-lg font-black text-amber-400 mt-0.5 block">
                  {formatRp(todayCashTotal)}
                </span>
                <span className="text-[10px] text-zinc-500">Uang fisik laci kasir</span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Non-Tunai (QRIS / EDC)
                </span>
                <span className="text-lg font-black text-sky-400 mt-0.5 block">
                  {formatRp(todayNonCashTotal)}
                </span>
                <span className="text-[10px] text-zinc-500">Rekening terverifikasi</span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Kasir Bertugas
                </span>
                <span className="text-sm font-bold text-white mt-1 block truncate">
                  {currentUser?.name || 'Kasir Front Desk'}
                </span>
                <span className="text-[10px] text-zinc-500">Shift {currentUser?.shift || 'Pagi'}</span>
              </div>
            </div>
          </div>

          {/* POS 2-Column Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Product & Service Catalog (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {(['ALL', 'Layanan Member', 'Fasilitas & Denda', 'Minuman & Suplemen'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDeskCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                          deskCategoryFilter === cat
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                      >
                        {cat === 'ALL' ? 'Semua Katalog' : cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari item kasir..."
                      value={deskProductSearch}
                      onChange={(e) => setDeskProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                  {deskProducts
                    .filter((p) => {
                      if (deskCategoryFilter !== 'ALL' && p.category !== deskCategoryFilter) return false;
                      if (deskProductSearch.trim() && !p.name.toLowerCase().includes(deskProductSearch.toLowerCase())) return false;
                      return true;
                    })
                    .map((product) => {
                      const inCart = quickCart.find((i) => i.product.id === product.id);
                      return (
                        <div
                          key={product.id}
                          className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition flex flex-col justify-between group relative overflow-hidden"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {product.badge || product.category}
                              </span>
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {formatRp(product.price)}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition leading-snug">
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                            {inCart ? (
                              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(product.id, -1)}
                                  className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center justify-center font-bold text-xs"
                                >
                                  -
                                </button>
                                <span className="font-bold text-xs text-white px-2">
                                  {inCart.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(product.id, 1)}
                                  className="w-5 h-5 rounded bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center font-bold text-xs"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product)}
                                className="w-full py-1.5 bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Tambah ke Kasir
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Right: Checkout Terminal & Cart (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">Keranjang Tagihan Kasir</h3>
                  </div>
                  {quickCart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-xs text-zinc-400 hover:text-red-400 transition"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {/* Customer Assignment */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-300 block">Tipe Pembeli:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeskCustomerType('member')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                        deskCustomerType === 'member'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/40'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      Member Terdaftar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeskCustomerType('guest')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                        deskCustomerType === 'guest'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/40'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      Tamu Walk-in
                    </button>
                  </div>

                  {deskCustomerType === 'member' ? (
                    <div className="pt-1">
                      <select
                        value={selectedDeskMemberId}
                        onChange={(e) => setSelectedDeskMemberId(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Pilih Member...</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.id}) - {m.status}
                          </option>
                        ))}
                      </select>
                      {activeMemberSelected && (
                        <div className="mt-1.5 p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] flex items-center justify-between text-zinc-400">
                          <span>Status: <strong className={activeMemberSelected.status === 'AKTIF' ? 'text-emerald-400' : 'text-red-400'}>{activeMemberSelected.status}</strong></span>
                          <span>Diskon Member: <strong className="text-emerald-400">{activeMemberSelected.status === 'AKTIF' ? '5% Aktif' : '0%'}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Nama Tamu Walk-in / Pengunjung..."
                        value={deskGuestName}
                        onChange={(e) => setDeskGuestName(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="space-y-2 min-h-[140px] max-h-[220px] overflow-y-auto pr-1 border-t border-b border-zinc-800 py-2">
                  {quickCart.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Belum ada item yang dipilih.<br />
                      Klik item di katalog samping untuk menambahkan.
                    </div>
                  ) : (
                    quickCart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 pr-2">
                          <span className="font-bold text-white block truncate">{item.product.name}</span>
                          <span className="text-[11px] text-zinc-400">{formatRp(item.product.price)} x {item.qty}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.product.id, -1)}
                              className="text-zinc-400 hover:text-white px-1"
                            >
                              -
                            </button>
                            <span className="font-bold text-white text-[11px] px-1">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.product.id, 1)}
                              className="text-zinc-400 hover:text-white px-1"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-white text-xs min-w-[70px] text-right">
                            {formatRp(item.product.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals & Discounts */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-zinc-200">{formatRp(cartSubtotal)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Diskon Member Aktif (5%):</span>
                      <span className="font-mono">-{formatRp(cartDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-black pt-2 border-t border-zinc-800 text-white">
                    <span>Total Tagihan:</span>
                    <span className="text-base text-emerald-400 font-mono">{formatRp(cartTotal)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs">
                  <label className="font-bold text-zinc-300 block">Metode Pembayaran:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Cash', 'QRIS', 'Transfer', 'Debit'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setDeskPaymentMethod(method)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold transition border text-center ${
                          deskPaymentMethod === method
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {method === 'Cash' ? '💵 Tunai' : method === 'QRIS' ? '📱 QRIS' : method === 'Transfer' ? '🏦 Bank' : '💳 Debit'}
                      </button>
                    ))}
                  </div>

                  {/* Cash Change Calculator */}
                  {deskPaymentMethod === 'Cash' && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Uang Diterima:</span>
                        <input
                          type="number"
                          value={deskCashGiven || ''}
                          placeholder={cartTotal.toString()}
                          onChange={(e) => setDeskCashGiven(Number(e.target.value))}
                          className="w-32 px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-right font-bold text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDeskCashGiven(cartTotal)}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 hover:bg-zinc-700"
                        >
                          Uang Pas
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeskCashGiven(50000)}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 hover:bg-zinc-700"
                        >
                          50rb
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeskCashGiven(100000)}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 hover:bg-zinc-700"
                        >
                          100rb
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
                        <span className="text-zinc-400">Kembalian:</span>
                        <span className="font-bold text-amber-400 font-mono text-sm">
                          {formatRp(changeAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Process Checkout Button */}
                <button
                  type="button"
                  onClick={handleProcessDeskCheckout}
                  disabled={quickCart.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 disabled:pointer-events-none text-zinc-950 font-black rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Selesaikan Pembayaran & Cetak Nota ({formatRp(cartTotal)})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 8. SUB-VIEW: PUSAT LAYANAN, KENDALA & LOST AND FOUND (HELPDESK) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'helpdesk' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Header Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Layanan Bantuan, Kendala & Lost and Found</h3>
                  <p className="text-xs text-zinc-400">
                    Pusat penanganan barang tertinggal milik member dan buku log serah terima pesan shift kasir front desk.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddLostFoundOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-500/20 flex items-center gap-2 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Catat Barang Ditemukan
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddHandoverOpen(true)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center gap-2 active:scale-95"
                >
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  Tulis Pesan Shift
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-800">
              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Tersimpan di Laci Kasir
                </span>
                <span className="text-xl font-black text-amber-400 mt-0.5 block">
                  {storedLostFoundCount}
                </span>
                <span className="text-[10px] text-zinc-500">Menunggu pemilik klaim</span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Telah Dikembalikan
                </span>
                <span className="text-xl font-black text-emerald-400 mt-0.5 block">
                  {lostFoundList.filter((l) => l.status === 'CLAIMED').length}
                </span>
                <span className="text-[10px] text-zinc-500">Diserahkan ke member</span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Buku Catatan Shift
                </span>
                <span className="text-xl font-black text-white mt-0.5 block">
                  {handoverNotes.length}
                </span>
                <span className="text-[10px] text-zinc-500">Log operasional front desk</span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Status Kunci Loker
                </span>
                <span className="text-xl font-black text-sky-400 mt-0.5 block">
                  24 / 24
                </span>
                <span className="text-[10px] text-zinc-500">Semua loker terdata</span>
              </div>
            </div>
          </div>

          {/* Section 1: Lost & Found Member Grid */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Barang Tertinggal di Area Gym (Lost & Found)</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  {(['ALL', 'STORED', 'CLAIMED'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setLostFoundFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        lostFoundFilter === filter
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {filter === 'ALL' ? 'Semua' : filter === 'STORED' ? 'Tersimpan' : 'Diserahkan'}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari barang..."
                    value={lostFoundSearch}
                    onChange={(e) => setLostFoundSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lostFoundList
                .filter((item) => {
                  if (lostFoundFilter !== 'ALL' && item.status !== lostFoundFilter) return false;
                  if (lostFoundSearch.trim() && !item.itemName.toLowerCase().includes(lostFoundSearch.toLowerCase()) && !item.foundLocation.toLowerCase().includes(lostFoundSearch.toLowerCase())) return false;
                  return true;
                })
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {item.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'STORED'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {item.status === 'STORED' ? 'Tersimpan di Kasir' : 'Sudah Diambil'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-tight">
                        {item.itemName}
                      </h4>

                      <div className="mt-2 space-y-1 text-xs text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Ditemukan: {item.foundDate} · {item.foundTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Lokasi: <strong className="text-zinc-300">{item.foundLocation}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Penemu: {item.finderStaffName}</span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-zinc-500 italic pt-1 border-t border-zinc-800/80">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800">
                      {item.status === 'STORED' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetLostFoundForClaim(item);
                            setClaimForm({ memberId: '', claimantName: '', notes: '' });
                          }}
                          className="w-full py-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Klaim & Serahkan ke Member
                        </button>
                      ) : (
                        <div className="p-2 bg-zinc-900 rounded-xl text-[11px] text-emerald-400 space-y-0.5">
                          <span className="font-bold block">Telah Diserahkan:</span>
                          <span className="text-zinc-400 block">{item.claimedByMemberName}</span>
                          <span className="text-zinc-500 block text-[10px]">{item.claimedDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 2: Shift Handover & Operational Notes Log */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Buku Log Serah Terima Shift Front Desk</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddHandoverOpen(true)}
                className="text-xs text-orange-400 hover:underline font-bold"
              >
                + Tulis Catatan Baru
              </button>
            </div>

            <div className="space-y-3">
              {handoverNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-2xl border transition ${
                    note.isImportant
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{note.authorStaffName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-300 font-mono">
                        {note.shift}
                      </span>
                      {note.isImportant && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                          Penting
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>Kas Fisik Laci: <strong className="text-emerald-400">{formatRp(note.cashDrawerActual)}</strong></span>
                      <span>{note.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {note.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: FAST-TRACK REGISTRATION (MEMBER BARU MEJA KASIR) */}
      {/* ------------------------------------------------------------------ */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrasi Member Baru Meja Kasir</h3>
                  <p className="text-xs text-zinc-400">Pendaftaran cepat langsung dari loket front desk</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMemberModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMember} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="08123456789"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Jenis Kelamin</label>
                  <select
                    value={newMemberForm.gender}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Pilihan Paket Awal</label>
                <select
                  value={newMemberForm.packageId}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, packageId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Pilih Paket Membership / PT...</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.cat === 'Membership' ? `${pkg.value} Hari` : `${pkg.value} Sesi`}) - {formatRp(pkg.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Metode Pembayaran</label>
                  <select
                    value={newMemberForm.paymentMethod}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="QRIS">QRIS Statis/Dinamis</option>
                    <option value="Cash">Tunai / Cash</option>
                    <option value="Transfer">Transfer Bank</option>
                    <option value="Debit">Kartu Debit / EDC</option>
                  </select>
                </div>

                <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-300 font-bold block text-xs">
                      PIC Penanggung Jawab Member (Front Desk / Sales) <span className="text-orange-400">*</span>
                    </label>
                    {newMemberForm.assignedStaffId && (
                      <div className="flex items-center gap-1.5">
                        {isRegPicLocked ? (
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
                            if (isRegPicLocked) {
                              const isProtected = picProtection.requirePasswordToChangePic && (picProtection.requirePasswordOnMemberForm !== false);
                              const canBypass = (currentUser?.role === 'admin' || currentUser?.role === 'manager') && picProtection.allowAdminBypass;

                              if (isProtected && !canBypass) {
                                setPasswordUnlockTarget('reg');
                                setIsPicPasswordModalOpen(true);
                              } else {
                                setIsRegPicLocked(false);
                                showToast('Kunci PIC Dibuka 🔓', 'Anda dapat memilih staf PIC lain.', 'info');
                              }
                            } else {
                              setIsRegPicLocked(true);
                              showToast('PIC Dikunci 🔒', 'Pilihan PIC berhasil dikunci.', 'info');
                            }
                          }}
                          className="text-[10px] text-zinc-400 hover:text-amber-400 font-semibold underline transition ml-1"
                        >
                          {isRegPicLocked ? 'Buka Kunci' : 'Kunci PIC'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={newMemberForm.assignedStaffId}
                      disabled={isRegPicLocked && Boolean(newMemberForm.assignedStaffId)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewMemberForm({ ...newMemberForm, assignedStaffId: val });
                        if (val) {
                          setIsRegPicLocked(true);
                          const chosen = staffUsers.find((s) => s.id === val);
                          showToast('PIC Terpilih & Terkunci 🔒', `${chosen?.name || 'Staff'} telah dipilih dan otomatis dikunci.`, 'success');
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border transition ${
                        isRegPicLocked && newMemberForm.assignedStaffId
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 cursor-not-allowed opacity-95'
                          : 'bg-zinc-950 border-zinc-800 text-white focus:outline-none focus:border-orange-500'
                      }`}
                    >
                      <option value="">-- Pilih PIC Penanggung Jawab --</option>
                      {staffUsers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleName}) {s.shift ? `• Shift ${s.shift}` : ''}
                        </option>
                      ))}
                    </select>
                    {isRegPicLocked && newMemberForm.assignedStaffId && (
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  {isRegPicLocked && newMemberForm.assignedStaffId ? (
                    <p className="text-[10px] text-amber-400/90 flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      PIC telah dikunci saat input member. Klik <em>Buka Kunci</em> jika ingin mengganti.
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-500">
                      Pilih staf PIC penanggung jawab member. Pilihan akan otomatis dikunci.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Catatan Front Desk</label>
                <input
                  type="text"
                  placeholder="Opsional, misal: titip handuk / info alergi"
                  value={newMemberForm.notes}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Daftarkan & Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: FAST-TRACK RENEWAL (PERPANJANG PAKET DI KASIR) */}
      {/* ------------------------------------------------------------------ */}
      {isRenewalModalOpen && selectedMemberForRenewal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Perpanjangan Paket Member</h3>
                  <p className="text-xs text-zinc-400">
                    Memperpanjang keanggotaan untuk <strong>{selectedMemberForRenewal.name}</strong> ({selectedMemberForRenewal.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRenewalModalOpen(false);
                  setSelectedMemberForRenewal(null);
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Expired Saat Ini:</span>
                <strong className={getDayDiff(selectedMemberForRenewal.expired, APP_TODAY) < 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {formatDateIndo(selectedMemberForRenewal.expired)} ({getDayDiff(selectedMemberForRenewal.expired, APP_TODAY) < 0 ? 'Sudah Lewat' : `${getDayDiff(selectedMemberForRenewal.expired, APP_TODAY)} hari lagi`})
                </strong>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Sisa Kuota PT:</span>
                <span className="text-white font-bold">{selectedMemberForRenewal.ptQuota} Sesi</span>
              </div>
            </div>

            <form onSubmit={handleSaveRenewal} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Pilih Paket Perpanjangan *</label>
                <select
                  required
                  value={renewalPackageId}
                  onChange={(e) => setRenewalPackageId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Pilih Paket Membership / PT...</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.cat === 'Membership' ? `${pkg.value} Hari` : `${pkg.value} Sesi`}) - {formatRp(pkg.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Metode Bayar</label>
                  <select
                    value={renewalPaymentMethod}
                    onChange={(e) => setRenewalPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="QRIS">QRIS</option>
                    <option value="Cash">Tunai</option>
                    <option value="Transfer">Transfer Bank</option>
                    <option value="Debit">Kartu Debit</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Kasir Bertugas</label>
                  <select
                    value={renewalStaffId}
                    onChange={(e) => setRenewalStaffId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    {staffUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* EDITABLE PIC PENANGGUNG JAWAB MEMBER */}
              <div className="p-3 bg-zinc-950 border border-orange-500/40 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-orange-400 font-bold block text-xs">
                    PIC Penanggung Jawab Member (Front Desk / Sales) *
                  </label>
                  {renewalPicId && (
                    <div className="flex items-center gap-1.5">
                      {isRenewalPicLocked ? (
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
                          if (isRenewalPicLocked) {
                            const isProtected = picProtection.requirePasswordToChangePic && (picProtection.requirePasswordOnRenewal !== false);
                            const canBypass = (currentUser?.role === 'admin' || currentUser?.role === 'manager') && picProtection.allowAdminBypass;

                            if (isProtected && !canBypass) {
                              setPasswordUnlockTarget('renewal');
                              setIsPicPasswordModalOpen(true);
                            } else {
                              setIsRenewalPicLocked(false);
                              showToast('Kunci PIC Dibuka 🔓', 'Anda dapat memilih staf PIC lain.', 'info');
                            }
                          } else {
                            setIsRenewalPicLocked(true);
                            showToast('PIC Renewal Dikunci 🔒', 'Pilihan PIC perpanjangan dikunci.', 'info');
                          }
                        }}
                        className="text-[10px] text-zinc-400 hover:text-amber-400 font-semibold underline transition ml-1"
                      >
                        {isRenewalPicLocked ? 'Buka Kunci' : 'Kunci PIC'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={renewalPicId}
                    disabled={isRenewalPicLocked && Boolean(renewalPicId)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRenewalPicId(val);
                      if (val) {
                        setIsRenewalPicLocked(true);
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                      isRenewalPicLocked && renewalPicId
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 cursor-not-allowed opacity-95'
                        : 'bg-zinc-900 border-zinc-700 text-white focus:outline-none focus:border-orange-500'
                    }`}
                  >
                    {staffUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roleName || 'Front Desk'} - Shift {s.shift || '-'})
                      </option>
                    ))}
                  </select>
                  {isRenewalPicLocked && renewalPicId && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500">
                  {isRenewalPicLocked
                    ? '🔒 PIC terkunci sesuai profil member untuk integritas komisi. Klik Buka Kunci jika perlu mengalihkan.'
                    : 'Pilih staf penanggung jawab member untuk perpanjangan ini.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsRenewalModalOpen(false);
                    setSelectedMemberForRenewal(null);
                  }}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Konfirmasi Perpanjangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: WALK-IN GUEST PASS / VISIT HARIAN */}
      {/* ------------------------------------------------------------------ */}
      {isGuestPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <TicketIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tiket Visit Harian (Guest Pass)</h3>
                  <p className="text-xs text-zinc-400">Akses latihan 1 hari untuk tamu non-member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestPassModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!guestPassForm.name.trim()) {
                  showToast('Nama Wajib Diisi', 'Harap isi nama tamu.', 'warning');
                  return;
                }

                // 1. Record attendance
                const newAtt: Attendance = {
                  id: `VISIT-${Date.now().toString().slice(-5)}`,
                  date: APP_TODAY,
                  timeIn: getTimestamp(),
                  memberName: `${guestPassForm.name.trim()} (Tamu)`,
                  type: 'Reguler',
                  badge: 'Guest Pass Harian'
                };
                onAddAttendance(newAtt);

                // 2. Record transaction
                const trx: Transaction = {
                  id: `TRX-VISIT-${Date.now().toString().slice(-5)}`,
                  date: APP_TODAY,
                  time: getTimestamp(),
                  desc: `Tiket Visit Harian (Tamu: ${guestPassForm.name})`,
                  amount: guestPassForm.price,
                  amountPaid: guestPassForm.price,
                  amountRemaining: 0,
                  type: 'Membership',
                  method: guestPassForm.paymentMethod,
                  customer: guestPassForm.name,
                  cashier: currentUser?.name || 'Kasir Front Desk',
                  status: 'Paid',
                  picId: currentUser?.id || 'S01',
                  picNames: currentUser?.name || 'Staf Kasir'
                };
                onAddTransaction(trx);

                setIsGuestPassModalOpen(false);
                setGuestPassForm({
                  name: '',
                  phone: '',
                  paymentMethod: 'Cash',
                  price: 50000,
                  hasTowel: true,
                  lockerNum: '01'
                });

                showToast('Tiket Visit Dicetak! 🎟️', `${newAtt.memberName} berhasil check-in dengan tiket harian.`, 'success');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Nama Tamu / Pengunjung *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Permana"
                  value={guestPassForm.name}
                  onChange={(e) => setGuestPassForm({ ...guestPassForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Nomor WhatsApp / Kontak</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxxxx (untuk follow-up jadi member)"
                  value={guestPassForm.phone}
                  onChange={(e) => setGuestPassForm({ ...guestPassForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Tarif Tiket</label>
                  <input
                    type="number"
                    value={guestPassForm.price}
                    onChange={(e) => setGuestPassForm({ ...guestPassForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500 font-bold text-amber-400"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Metode Bayar</label>
                  <select
                    value={guestPassForm.paymentMethod}
                    onChange={(e) => setGuestPassForm({ ...guestPassForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Cash">Tunai / Cash</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Debit">Debit EDC</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsGuestPassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl font-bold transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak & Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: UNIVERSAL 360 DEGREE MEMBER PROFILE VIEW */}
      {/* ------------------------------------------------------------------ */}
      {quick360Member && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <img
                  src={quick360Member.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                  alt={quick360Member.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-500 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{quick360Member.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-700">
                      {quick360Member.id}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {quick360Member.phone} · Terdaftar sejak {quick360Member.joinDate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQuick360Member(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 360 Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Status Member</span>
                <span className={`text-xs font-black mt-1 inline-block px-2 py-0.5 rounded-full border ${
                  quick360Member.status === 'AKTIF'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {quick360Member.status}
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Masa Aktif</span>
                <span className="font-bold text-white mt-1 block">
                  {formatDateIndo(quick360Member.expired)}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {getDayDiff(quick360Member.expired, APP_TODAY) < 0
                    ? 'Sudah expired'
                    : `${getDayDiff(quick360Member.expired, APP_TODAY)} hari lagi`}
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sisa Kuota PT</span>
                <span className="text-sm font-black text-sky-400 mt-1 block">
                  {quick360Member.ptQuota} Sesi
                </span>
                <span className="text-[10px] text-zinc-500">Coach: {quick360Member.picName || 'Belum ada'}</span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">PIC Front Desk</span>
                <span className="font-bold text-amber-400 mt-1 block truncate">
                  {quick360Member.picName || 'Kasir Gym'}
                </span>
                <span className="text-[10px] text-zinc-500">Staff Penanggung Jawab</span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold text-zinc-300 block">Tindakan Kilat Front Desk:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePerformCheckIn(quick360Member);
                    setQuick360Member(null);
                  }}
                  className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <UserCheck className="w-4 h-4" />
                  Presensi Gate
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenRenewalModal(quick360Member);
                    setQuick360Member(null);
                  }}
                  className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Perpanjang
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeskMemberId(quick360Member.id);
                    setDeskCustomerType('member');
                    setActiveTab('pos_desk');
                    setQuick360Member(null);
                  }}
                  className="p-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <Wallet className="w-4 h-4" />
                  Buka Kasir Meja
                </button>

                <a
                  href={`https://wa.me/${quick360Member.phone.replace(/[^0-9]/g, '').startsWith('0') ? '62' + quick360Member.phone.replace(/[^0-9]/g, '').slice(1) : quick360Member.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Notes & Extra Info */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <span className="font-bold text-zinc-300 block">Catatan Front Desk:</span>
              <p className="italic">
                {quick360Member.notes || 'Tidak ada catatan khusus untuk member ini.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CASHIER RECEIPT / STRUK TRANSAKSI MEJA DESK */}
      {/* ------------------------------------------------------------------ */}
      {receiptModalData && (
        <ReceiptModal
          isOpen={Boolean(receiptModalData)}
          onClose={() => setReceiptModalData(null)}
          transaction={{
            id: receiptModalData.trxId,
            date: receiptModalData.date,
            time: receiptModalData.time,
            type: 'POS',
            desc: receiptModalData.items.map((i) => `${i.qty}x ${i.name}`).join(', '),
            customer: receiptModalData.customerName,
            memberId: receiptModalData.memberId,
            amount: receiptModalData.total,
            amountPaid: receiptModalData.total,
            amountRemaining: 0,
            method: receiptModalData.paymentMethod,
            status: 'Paid',
            cashier: receiptModalData.cashierName,
            itemsJSON: JSON.stringify(receiptModalData.items)
          }}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD NEW LOST & FOUND ITEM */}
      {/* ------------------------------------------------------------------ */}
      {isAddLostFoundOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Catat Barang Ditemukan (Lost & Found)</h3>
                  <p className="text-xs text-zinc-400">Simpan info barang tertinggal di laci kasir</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLostFoundOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewLostFound} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Nama / Deskripsi Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tumbler Corkcicle Putih 500ml"
                  value={newLostFoundForm.itemName}
                  onChange={(e) => setNewLostFoundForm({ ...newLostFoundForm, itemName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Kategori Barang</label>
                  <select
                    value={newLostFoundForm.category}
                    onChange={(e) => setNewLostFoundForm({ ...newLostFoundForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Botol/Tumbler">Botol / Tumbler</option>
                    <option value="Earphone/TWS">Earphone / TWS</option>
                    <option value="Pakaian/Sepatu">Pakaian / Sepatu</option>
                    <option value="Jam/Aksesoris">Jam / Aksesoris</option>
                    <option value="Kunci">Kunci Loker / Kendaraan</option>
                    <option value="Dompet/ID Card">Dompet / Kartu</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Lokasi Ditemukan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Loker Pria No 12"
                    value={newLostFoundForm.foundLocation}
                    onChange={(e) => setNewLostFoundForm({ ...newLostFoundForm, foundLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Staf / Penemu</label>
                <input
                  type="text"
                  value={newLostFoundForm.finderStaffName}
                  onChange={(e) => setNewLostFoundForm({ ...newLostFoundForm, finderStaffName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Catatan Tambahan / Ciri Khusus</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Ada stiker nama 'Andi', tutup agak lecet"
                  value={newLostFoundForm.notes}
                  onChange={(e) => setNewLostFoundForm({ ...newLostFoundForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddLostFoundOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition shadow-lg shadow-sky-500/20 active:scale-95"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CLAIM LOST & FOUND ITEM */}
      {/* ------------------------------------------------------------------ */}
      {targetLostFoundForClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white">Serahkan Barang ke Pemilik</h3>
                <p className="text-xs text-zinc-400">Verifikasi identitas sebelum menyerahkan barang</p>
              </div>
              <button
                type="button"
                onClick={() => setTargetLostFoundForClaim(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs space-y-1">
              <span className="font-bold text-white block">{targetLostFoundForClaim.itemName}</span>
              <span className="text-zinc-400 block">Ditemukan di: {targetLostFoundForClaim.foundLocation}</span>
            </div>

            <form onSubmit={handleClaimLostFound} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Pilih Member Terdaftar (Opsional)</label>
                <select
                  value={claimForm.memberId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    const m = members.find((x) => x.id === mId);
                    setClaimForm({
                      ...claimForm,
                      memberId: mId,
                      claimantName: m ? m.name : claimForm.claimantName
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">Pilih Member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Atau Masukkan Nama Pengambil *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap pengambil barang..."
                  value={claimForm.claimantName}
                  onChange={(e) => setClaimForm({ ...claimForm, claimantName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Catatan Verifikasi / No HP</label>
                <input
                  type="text"
                  placeholder="Contoh: Member menunjukkan foto tumbler serupa di galeri HP"
                  value={claimForm.notes}
                  onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTargetLostFoundForClaim(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-xl font-bold transition shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Konfirmasi Penyerahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD SHIFT HANDOVER NOTE */}
      {/* ------------------------------------------------------------------ */}
      {isAddHandoverOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Catatan Serah Terima Shift</h3>
                  <p className="text-xs text-zinc-400">Pesan dan rekonsiliasi kas untuk kasir berikutnya</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddHandoverOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHandoverNote} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Shift Kasir</label>
                  <select
                    value={newHandoverForm.shift}
                    onChange={(e) => setNewHandoverForm({ ...newHandoverForm, shift: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pagi (06:00 - 14:00)">Pagi (06:00 - 14:00)</option>
                    <option value="Siang (14:00 - 22:00)">Siang (14:00 - 22:00)</option>
                    <option value="Weekend / Full">Weekend / Full</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Kas Laci Fisik (Rp)</label>
                  <input
                    type="number"
                    value={newHandoverForm.cashDrawerActual}
                    onChange={(e) => setNewHandoverForm({ ...newHandoverForm, cashDrawerActual: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Pesan / Handover Operasional *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Contoh: Kunci loker no 15 macet, sisa struk thermal tinggal 1 roll di lemari, member M003 titip pembayaran sore ini."
                  value={newHandoverForm.notes}
                  onChange={(e) => setNewHandoverForm({ ...newHandoverForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="handoverImportant"
                  checked={newHandoverForm.isImportant}
                  onChange={(e) => setNewHandoverForm({ ...newHandoverForm, isImportant: e.target.checked })}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-orange-500 focus:ring-0"
                />
                <label htmlFor="handoverImportant" className="text-zinc-300 font-bold cursor-pointer">
                  Tandai sebagai catatan penting / darurat
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddHandoverOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl font-bold transition shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  Simpan Pesan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: SHIFT CLOSING & RECONCILIATION */}
      {/* ------------------------------------------------------------------ */}
      {isShiftClosingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Rekonsiliasi & Tutup Shift Meja Kasir</h3>
                  <p className="text-xs text-zinc-400">Verifikasi saldo kas laci dan omset harian</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftClosingModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-zinc-400 block">Total Omset Kasir:</span>
                <span className="text-base font-black text-white mt-1 block">
                  {formatRp(todayDeskTotalRevenue)}
                </span>
                <span className="text-[10px] text-zinc-500">{todayDeskTransactions.length} transaksi</span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-zinc-400 block">Tunai di Laci Kas:</span>
                <span className="text-base font-black text-amber-400 mt-1 block">
                  {formatRp(todayCashTotal)}
                </span>
                <span className="text-[10px] text-zinc-500">Saldo sistem kas</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <span className="font-bold text-zinc-300 block">Rincian Non-Tunai / EDC:</span>
              <div className="flex justify-between text-zinc-400">
                <span>QRIS & EDC Pembayaran:</span>
                <span className="font-mono text-white">{formatRp(todayNonCashTotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Modal Awal Kasir (Kasbon):</span>
                <span className="font-mono text-zinc-400">Rp 500.000</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-zinc-800">
                <span>Uang Fisik Seharusnya di Laci:</span>
                <span className="font-mono text-sm">{formatRp(todayCashTotal + 500000)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsShiftClosingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-bold"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsShiftClosingModalOpen(false);
                  showToast('Shift Kasir Ditutup 🏁', 'Rekonsiliasi laci kasir berhasil dicatat dan diverifikasi.', 'success');
                }}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Konfirmasi Tutup Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CHECK-IN & PENYERAHAN KUNCI LOKER + SARAN PINTAR FRONT DESK */}
      {/* ------------------------------------------------------------------ */}
      {checkInModal.isOpen && checkInModal.member && (() => {
        const m = checkInModal.member;
        const daysLeft = getDayDiff(m.expired, APP_TODAY);
        const isExp = daysLeft < 0;
        const isNearExp = daysLeft >= 0 && daysLeft <= 7;
        const isBdayToday = m.birthDate ? m.birthDate.slice(5) === APP_TODAY.slice(5) : false;
        const memberDebts = transactions.filter(
          (t) =>
            (t.memberId === m.id || t.customer.toLowerCase().trim() === m.name.toLowerCase().trim()) &&
            t.status !== 'Paid' &&
            t.status !== 'VOID' &&
            (t.amountRemaining || 0) > 0
        );
        const totalDebt = memberDebts.reduce((acc, t) => acc + (t.amountRemaining || 0), 0);
        const recLocker = getRecommendedLocker(lockers, m.gender);
        const quickLockers = getAvailableLockersByGender(lockers, m.gender, 6);
        const currentMonth = APP_TODAY.slice(0, 7);
        const monthlyVisits = attendances.filter(
          (a) => (a.memberId === m.id || a.memberName === m.name) && a.date.startsWith(currentMonth)
        ).length;

        const currentHour = new Date().getHours();
        const timeGreeting = currentHour < 11 ? 'Selamat Pagi' : currentHour < 15 ? 'Selamat Siang' : currentHour < 18 ? 'Selamat Sore' : 'Selamat Malam';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>Presensi Masuk & Serahkan Kunci Loker</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">Alokasikan kunci loker & panduan operasional kasir</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckInModal((prev) => ({ ...prev, isOpen: false }))}
                  className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Member ID Badge Card */}
                <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm truncate">{m.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          m.gender === 'P' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {m.gender === 'P' ? 'Wanita' : 'Pria'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="font-mono text-zinc-500">{m.id}</span>
                        <span>•</span>
                        <span>{m.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[11px] px-2.5 py-1 rounded-xl font-bold shrink-0 border ${
                    isNearExp
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {daysLeft} Hari Lagi
                  </span>
                </div>

                {/* FRONT DESK SMART CO-PILOT (SARAN YANG TEPAT UNTUK MEMPERMUDAH FRONT DESK) */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      <span>Saran Operasional Front Desk</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      Kunjungan ke-{monthlyVisits + 1} bulan ini
                    </span>
                  </div>

                  {/* 1. Sapaan Ramah */}
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-start gap-2.5 text-xs">
                    <UserCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-300 text-[11px] uppercase tracking-wider block">Sapaan Ramah:</span>
                      <p className="text-zinc-200 mt-0.5">
                        "{timeGreeting} Kak {m.name}! Selamat datang kembali di GymPro. Selamat berlatih!"
                      </p>
                    </div>
                  </div>

                  {/* 2. Ulang Tahun */}
                  {isBdayToday && (
                    <div className="p-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs">
                      <Gift className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <p className="font-black text-amber-300">HARI INI ULANG TAHUN MEMBER! 🎉</p>
                        <p className="text-[11px] text-zinc-300 mt-0.5">
                          Ucapkan: <em>"Selamat Ulang Tahun Kak {m.name}!"</em> dan berikan 1 minuman sehat gratis di meja kasir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. Status Expired / Mendekati Expired */}
                  {isNearExp && (
                    <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-start gap-2 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-300">Peluang Perpanjangan ({daysLeft} Hari Lagi Expired)</p>
                        <p className="text-[11px] text-zinc-300 mt-0.5">
                          Saran Kasir: <em>"Kak {m.name}, masa aktif tersisa {daysLeft} hari lagi s/d {formatDateIndo(m.expired)}. Mau sekalian diperpanjang hari ini?"</em>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4. Sesi Personal Trainer */}
                  {m.ptQuota > 0 && (
                    <div className="p-2.5 bg-purple-500/15 border border-purple-500/40 rounded-xl flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Dumbbell className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-purple-300">
                            Memiliki {m.ptQuota} Sesi PT Aktif {m.ptQuota <= 2 && '(Sisa Kritis)'}
                          </p>
                          <p className="text-[11px] text-zinc-300 mt-0.5">
                            Coach PIC: <strong>{m.picName || 'Trainer Tim'}</strong>. Konfirmasi apakah hari ini akan latihan dengan PT?
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCheckInModal((prev) => ({ ...prev, visitType: prev.visitType === 'PT' ? 'Reguler' : 'PT' }))}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                            checkInModal.visitType === 'PT'
                              ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                          }`}
                        >
                          {checkInModal.visitType === 'PT' ? '✓ Mode Sesi PT' : 'Set Sesi PT'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Tagihan Cicilan Tertunda */}
                  {totalDebt > 0 && (
                    <div className="p-2.5 bg-red-950/30 border border-red-800/40 rounded-xl flex items-start gap-2 text-xs">
                      <CreditCard className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-300">Ada Cicilan Belum Lunas: {formatRp(totalDebt)}</p>
                        <p className="text-[11px] text-zinc-300 mt-0.5">
                          Ingatkan member secara ramah untuk menyelesaikan tagihan di kasir saat checkout.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* LOCKER KEY ASSIGNMENT SECTION (PAS SEDANG ABSEN SEKALIAN BERIKAN KUNCI LOKER) */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">Penyerahan Kunci Loker</h4>
                        <p className="text-[10px] text-zinc-400">Alokasikan kunci loker fisik & handuk bersih</p>
                      </div>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-zinc-400 hover:text-white">
                      <input
                        type="checkbox"
                        checked={checkInModal.withoutLocker}
                        onChange={(e) => setCheckInModal((prev) => ({ ...prev, withoutLocker: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded accent-orange-500"
                      />
                      <span>Tanpa Loker</span>
                    </label>
                  </div>

                  {!checkInModal.withoutLocker ? (
                    <div className="space-y-3 pt-1">
                      {/* Active Chosen Locker Highlight */}
                      {checkInModal.selectedLockerNumber ? (
                        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                              #{checkInModal.selectedLockerNumber < 10 ? '0' + checkInModal.selectedLockerNumber : checkInModal.selectedLockerNumber}
                            </div>
                            <div>
                              <p className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>Kunci Loker #{checkInModal.selectedLockerNumber < 10 ? '0' + checkInModal.selectedLockerNumber : checkInModal.selectedLockerNumber} Siap Diserahkan</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                                  m.gender === 'P' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'
                                }`}>
                                  Area {m.gender === 'P' ? 'Wanita' : 'Pria'}
                                </span>
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">
                                {checkInModal.selectedLockerNumber === recLocker?.number
                                  ? '⭐ Rekomendasi otomatis sistem (loker terdekat & steril)'
                                  : 'Dipilih manual oleh front desk'}
                              </p>
                            </div>
                          </div>

                          {recLocker && checkInModal.selectedLockerNumber !== recLocker.number && (
                            <button
                              type="button"
                              onClick={() => setCheckInModal((prev) => ({ ...prev, selectedLockerNumber: recLocker.number }))}
                              className="text-[10px] font-black px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition shrink-0"
                            >
                              Gunakan Rekomendasi (#{recLocker.number})
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                          Pilih nomor kunci loker di bawah ini untuk diserahkan ke member.
                        </div>
                      )}

                      {/* Quick 1-Tap Locker Chips */}
                      {quickLockers.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            <span>Pilih Cepat Kunci ({m.gender === 'P' ? 'Wanita' : 'Pria'}):</span>
                            <span className="text-emerald-400 font-semibold lowercase">
                              {quickLockers.length} loker siap pakai
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {quickLockers.map((l) => {
                              const isSel = checkInModal.selectedLockerNumber === l.number;
                              return (
                                <button
                                  key={l.number}
                                  type="button"
                                  onClick={() => setCheckInModal((prev) => ({ ...prev, selectedLockerNumber: l.number, withoutLocker: false }))}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 border ${
                                    isSel
                                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-105 ring-2 ring-emerald-400/50'
                                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700/80 hover:border-emerald-500/50'
                                  }`}
                                >
                                  <Key className="w-3 h-3" />
                                  <span>#{l.number < 10 ? '0' + l.number : l.number}</span>
                                  {l.label && <span className="text-[10px] opacity-75">({l.label})</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Full Dropdown */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Atau Pilih dari Seluruh Daftar Loker:
                        </label>
                        <select
                          value={checkInModal.selectedLockerNumber || ''}
                          onChange={(e) => setCheckInModal((prev) => ({ ...prev, selectedLockerNumber: e.target.value ? Number(e.target.value) : null }))}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-semibold"
                        >
                          <option value="">-- Pilih Nomor Kunci Loker --</option>
                          <optgroup label="Loker Pria (#01 - #15)">
                            {lockers
                              .filter((l) => l.gender === 'Pria')
                              .map((l) => (
                                <option
                                  key={l.number}
                                  value={l.number}
                                  disabled={l.isOccupied}
                                  className={l.isOccupied ? 'text-zinc-600 bg-zinc-950' : 'text-white bg-zinc-900'}
                                >
                                  Loker #{l.number < 10 ? '0' + l.number : l.number} ({l.label || `P-${l.number}`}) - {l.isOccupied ? `Terpakai (${l.memberName || 'Member'})` : 'TERSEDIA ✓'}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Loker Wanita (#16 - #30)">
                            {lockers
                              .filter((l) => l.gender === 'Wanita')
                              .map((l) => (
                                <option
                                  key={l.number}
                                  value={l.number}
                                  disabled={l.isOccupied}
                                  className={l.isOccupied ? 'text-zinc-600 bg-zinc-950' : 'text-white bg-zinc-900'}
                                >
                                  Loker #{l.number < 10 ? '0' + l.number : l.number} ({l.label || `W-${l.number}`}) - {l.isOccupied ? `Terpakai (${l.memberName || 'Member'})` : 'TERSEDIA ✓'}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Towel Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 pt-1">
                        <input
                          type="checkbox"
                          checked={checkInModal.hasTowel}
                          onChange={(e) => setCheckInModal((prev) => ({ ...prev, hasTowel: e.target.checked }))}
                          className="w-4 h-4 rounded accent-orange-500"
                        />
                        <span>Sertakan Handuk Gym Bersih Higienis (1 Pcs)</span>
                      </label>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">
                      Member check-in tanpa menggunakan kunci loker fasilitas.
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCheckInModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleConfirmModalCheckIn}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {checkInModal.withoutLocker
                      ? 'Check-In Sekarang (Tanpa Loker)'
                      : checkInModal.selectedLockerNumber
                      ? `Konfirmasi Check-In & Berikan Kunci Loker #${checkInModal.selectedLockerNumber < 10 ? '0' + checkInModal.selectedLockerNumber : checkInModal.selectedLockerNumber}`
                      : 'Konfirmasi Check-In'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Password Authorization Modal to Unlock PIC in Fast-Track & Renewal */}
      <PicPasswordModal
        isOpen={isPicPasswordModalOpen}
        onClose={() => setIsPicPasswordModalOpen(false)}
        onSuccess={() => {
          if (passwordUnlockTarget === 'reg') {
            setIsRegPicLocked(false);
          } else {
            setIsRenewalPicLocked(false);
          }
          setIsPicPasswordModalOpen(false);
          showToast('Kunci PIC Dibuka 🔓', 'Password otorisasi terverifikasi. Silakan pilih staf PIC baru.', 'success');
        }}
        currentStaffName={
          passwordUnlockTarget === 'reg'
            ? staffUsers.find((s) => s.id === newMemberForm.assignedStaffId)?.name
            : staffUsers.find((s) => s.id === renewalPicId)?.name || selectedMemberForRenewal?.picName
        }
        currentUser={currentUser}
        showToast={showToast}
        title="Otorisasi Ganti PIC Front Desk"
        description="Masukkan password otorisasi keamanan untuk membuka kunci dan mengganti staf PIC penanggung jawab."
      />
    </div>
  );
};

// Simple Ticket Icon helper
function TicketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

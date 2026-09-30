import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Clock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Camera,
  Key,
  Lock,
  Unlock,
  AlertTriangle,
  Gift,
  CreditCard,
  Dumbbell,
  FileText,
  Printer,
  X,
  ArrowRightLeft,
  Check,
  Search,
  Filter,
  RefreshCw,
  Info,
  Settings,
  Wrench,
  Crown,
  Building2
} from 'lucide-react';
import { Member, User, Attendance, StaffAttendance, LockerSlot, Transaction } from '../types';
import { getTimestamp, APP_TODAY, formatRp, formatDateIndo, getDayDiff } from '../utils/formatters';
import { SearchableMemberSelect } from './SearchableMemberSelect';
import { SearchableStaffSelect } from './SearchableStaffSelect';
import { QRCodeScannerModal } from './QRCodeScannerModal';
import { LockerManagementModal } from './LockerManagementModal';
import { RealTimeClock } from './RealTimeClock';
import { getRecommendedLocker, getLockerStats, getAvailableLockersByGender, sortAttendancesByNewest } from '../data/lockerData';
import { useSettings } from '../context/SettingsContext';
import { printViaHiddenIframe, generateLockerSlipHtml, PrintPaperSize } from '../utils/printEngine';

interface AttendanceViewProps {
  members: Member[];
  staffUsers: User[];
  attendances: Attendance[];
  staffAttendances: StaffAttendance[];
  lockers?: LockerSlot[];
  onUpdateLockers?: React.Dispatch<React.SetStateAction<LockerSlot[]>>;
  onReleaseLocker?: (lockerNum: number) => void;
  onSwapLocker?: (oldLockerNum: number, newLockerNum: number) => void;
  onAddAttendance: (newAtt: Attendance, memberToUpdate?: Member) => void;
  onCheckoutMember: (attId: string) => void;
  onStaffClock: (record: StaffAttendance) => void;
  transactions?: Transaction[];
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  members,
  staffUsers,
  attendances,
  staffAttendances,
  lockers = [],
  onUpdateLockers,
  onReleaseLocker,
  onSwapLocker,
  onAddAttendance,
  onCheckoutMember,
  onStaffClock,
  transactions = [],
  showToast
}) => {
  const { settings, activeBranch, isAllBranches } = useSettings();
  const [activeTab, setActiveTab] = useState<'member' | 'staff'>('member');
  const [activeMemberSubTab, setActiveMemberSubTab] = useState<'attendance-list' | 'locker-board'>('attendance-list');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Member form state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [visitType, setVisitType] = useState<'Reguler' | 'PT'>('Reguler');

  // Locker assignment state
  const [selectedLockerNumber, setSelectedLockerNumber] = useState<number | null>(null);
  const [withoutLocker, setWithoutLocker] = useState(false);
  const [hasTowel, setHasTowel] = useState(true);

  // Staff form state
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Modals state
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isLockerManagementOpen, setIsLockerManagementOpen] = useState(false);
  const [lastCheckInSlip, setLastCheckInSlip] = useState<{
    member: Member;
    lockerNumber: number | null;
    lockerLabel?: string;
    gender: string;
    timeIn: string;
    type: string;
    hasTowel: boolean;
  } | null>(null);

  const [swapModal, setSwapModal] = useState<{
    isOpen: boolean;
    currentLocker: LockerSlot | null;
    targetNumber: number | null;
  }>({
    isOpen: false,
    currentLocker: null,
    targetNumber: null
  });

  // Locker board filters
  const [lockerBoardFilter, setLockerBoardFilter] = useState<'all' | 'Pria' | 'Wanita' | 'occupied' | 'available'>('all');
  const [lockerSearch, setLockerSearch] = useState('');

  const selectedMemberObj = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  const activeSelectedMemberSession = useMemo(() => {
    if (!selectedMemberObj) return null;
    return attendances.find(
      (a) =>
        (a.memberId === selectedMemberObj.id || a.memberName === selectedMemberObj.name) &&
        a.date === APP_TODAY &&
        !a.timeOut
    );
  }, [selectedMemberObj, attendances]);

  // Locker stats
  const lockerStats = useMemo(() => {
    return getLockerStats(lockers);
  }, [lockers]);

  // Auto-suggest locker when member is selected
  useEffect(() => {
    if (selectedMemberObj && !activeSelectedMemberSession) {
      const rec = getRecommendedLocker(lockers, selectedMemberObj.gender);
      if (rec) {
        setSelectedLockerNumber(rec.number);
        setWithoutLocker(false);
      } else {
        setSelectedLockerNumber(null);
      }
    } else {
      setSelectedLockerNumber(null);
    }
  }, [selectedMemberObj, activeSelectedMemberSession, lockers]);

  // FRONT DESK SMART CO-PILOT ANALYSIS (Saran yang tepat untuk mempermudah front desk)
  const deskCoPilot = useMemo(() => {
    if (!selectedMemberObj) return null;

    const m = selectedMemberObj;
    const daysLeft = getDayDiff(m.expired, APP_TODAY);
    const isExpired = daysLeft < 0;
    const isExpiringSoon = daysLeft >= 0 && daysLeft <= 7;

    // Time-based greeting for front desk
    const currentHour = new Date().getHours();
    const timeGreeting =
      currentHour < 11
        ? 'Selamat Pagi'
        : currentHour < 15
        ? 'Selamat Siang'
        : currentHour < 18
        ? 'Selamat Sore'
        : 'Selamat Malam';

    // Monthly attendance count & loyalty streak
    const currentMonth = APP_TODAY.slice(0, 7);
    const monthlyVisits = attendances.filter(
      (a) => (a.memberId === m.id || a.memberName === m.name) && a.date.startsWith(currentMonth)
    ).length;

    // Birthday detection (checks MM-DD)
    const isBirthdayToday = m.birthDate ? m.birthDate.slice(5) === APP_TODAY.slice(5) : false;

    // Unpaid debt check
    const memberDebts = transactions.filter(
      (t) =>
        (t.memberId === m.id || t.customer.toLowerCase().trim() === m.name.toLowerCase().trim()) &&
        t.status !== 'Paid' &&
        t.status !== 'VOID' &&
        (t.amountRemaining || 0) > 0
    );
    const totalDebt = memberDebts.reduce((acc, t) => acc + (t.amountRemaining || 0), 0);

    // PT Quota
    const ptQuota = m.ptQuota || 0;
    const hasPT = ptQuota > 0;
    const isLastPT = ptQuota === 1;

    // Recommended locker & available locker chips
    const recLocker = getRecommendedLocker(lockers, m.gender);
    const availableGenderLockers = getAvailableLockersByGender(lockers, m.gender, 8);

    // Conversational scripts for front desk staff
    const greetingScript = `${timeGreeting} Kak ${m.name}! Selamat datang kembali di GymPro.`;
    const renewalScript = isExpired
      ? `Kak ${m.name}, masa aktif membership sudah selesai per ${formatDateIndo(m.expired)}. Mau kita perpanjang paket hari ini agar latihan tetap lancar?`
      : isExpiringSoon
      ? `Kak ${m.name}, masa aktif tersisa ${daysLeft} hari lagi (s/d ${formatDateIndo(m.expired)}). Mau sekalian diperpanjang sekarang?`
      : '';
    const ptScript = hasPT
      ? `Kak ${m.name} ada ${ptQuota} sesi PT bersama Coach ${m.picName || 'Trainer'}. Apakah hari ini latihan bersama pelatih?`
      : '';
    const debtScript = totalDebt > 0
      ? `Kak ${m.name}, ada tagihan tertunda sebesar ${formatRp(totalDebt)}. Bisa dibantu pelunasan di kasir saat checkout ya Kak.`
      : '';

    return {
      daysLeft,
      isExpired,
      isExpiringSoon,
      isBirthdayToday,
      totalDebt,
      hasPT,
      isLastPT,
      ptQuota,
      picName: m.picName || 'Trainer Tim',
      recLocker,
      availableGenderLockers,
      genderLabel: m.gender === 'P' ? 'Wanita (Perempuan)' : 'Pria (Laki-laki)',
      timeGreeting,
      monthlyVisits,
      greetingScript,
      renewalScript,
      ptScript,
      debtScript
    };
  }, [selectedMemberObj, transactions, lockers, attendances]);

  // Handle member check-in with automatic IN / OUT toggle logic & Locker Assignment
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      showToast('Peringatan', 'Pilih member terlebih dahulu.', 'warning');
      return;
    }

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) {
      showToast('Error', 'Data member tidak ditemukan.', 'error');
      return;
    }

    // Check freeze status (Membership Freeze blocks access to gym)
    if (member.isFrozen || member.status === 'FREEZE') {
      showToast(
        'Akses Ditolak (Membership Freeze)',
        `Keanggotaan ${member.name} saat ini berstatus FREEZE / DIBEKUKAN (Alasan: ${member.freezeReason || 'Cuti'}). Masa aktif sedang ditangguhkan, silakan unfreeze terlebih dahulu.`,
        'error'
      );
      return;
    }

    // Check expiry
    const isExpired = new Date(member.expired + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');
    if (isExpired) {
      showToast('Akses Ditolak', `Membership ${member.name} telah kadaluarsa (${member.expired})! Silakan renewal terlebih dahulu.`, 'error');
      return;
    }

    // Check if member already checked-in today and hasn't checked out yet (Toggle logic!)
    const activeSession = attendances.find(
      (a) => (a.memberId === member.id || a.memberName === member.name) && a.date === APP_TODAY && !a.timeOut
    );

    if (activeSession) {
      // Auto Checkout & Release Locker
      onCheckoutMember(activeSession.id);
      setSelectedMemberId('');
      return;
    }

    // Check PT Quota if visitType === 'PT'
    let updatedMember = undefined;
    if (visitType === 'PT') {
      if ((member.ptQuota || 0) <= 0) {
        showToast('Kuota Habis', `Member ${member.name} tidak memiliki sisa kuota sesi PT. Silakan beli paket PT terlebih dahulu.`, 'warning');
        return;
      }
      // Deduct quota
      updatedMember = { ...member, ptQuota: member.ptQuota - 1 };
    }

    const assignedLocker = withoutLocker ? null : selectedLockerNumber;
    const timeInStr = getTimestamp();

    const branchIdToTag = member.branchId || (isAllBranches ? 'BR-001' : activeBranch?.id);
    const branchNameToTag = member.branchName || (isAllBranches ? 'Cabang Utama' : activeBranch?.name);

    const newAttendance: Attendance = {
      id: 'ATT-' + Date.now(),
      branchId: branchIdToTag,
      branchName: branchNameToTag,
      date: APP_TODAY,
      timeIn: timeInStr,
      timeOut: '',
      memberId: member.id,
      memberName: member.name,
      type: visitType,
      badge: visitType === 'PT' ? 'Sesi PT' : 'Gym Reguler',
      lockerNumber: assignedLocker || undefined,
      lockerGender: member.gender === 'P' ? 'Wanita' : 'Pria',
      hasTowel: assignedLocker ? hasTowel : false,
      lockerReturned: false
    };

    onAddAttendance(newAttendance, updatedMember);

    // Prepare check-in slip for display / thermal print
    if (assignedLocker) {
      const lockerSlotObj = lockers.find((l) => l.number === assignedLocker);
      setLastCheckInSlip({
        member,
        lockerNumber: assignedLocker,
        lockerLabel: lockerSlotObj?.label || `#${assignedLocker}`,
        gender: member.gender === 'P' ? 'Wanita' : 'Pria',
        timeIn: timeInStr,
        type: visitType === 'PT' ? 'Sesi Personal Trainer' : 'Gym Reguler',
        hasTowel
      });
      setIsSlipModalOpen(true);
    } else {
      showToast('Check-In Berhasil', `Selamat berlatih, ${member.name}! (Tanpa Kunci Loker)`, 'success');
    }

    setSelectedMemberId('');
  };

  // Handle staff clock in / out
  const handleStaffClockAction = (action: 'IN' | 'OUT') => {
    if (!selectedStaffId) {
      showToast('Peringatan', 'Pilih staf terlebih dahulu.', 'warning');
      return;
    }

    const staff = staffUsers.find((s) => s.id === selectedStaffId);
    if (!staff) {
      showToast('Error', 'Data staf tidak ditemukan.', 'error');
      return;
    }

    const existingActive = staffAttendances.find(
      (s) => (s.staffId === staff.id || s.staffName === staff.name) && s.date === APP_TODAY && !s.timeOut
    );

    if (action === 'IN') {
      if (existingActive) {
        showToast('Peringatan', `Staf ${staff.name} sudah melakukan Clock IN sebelumnya.`, 'warning');
        return;
      }

      const staffBranchId = staff.branchId || (isAllBranches ? 'BR-001' : activeBranch?.id);
      const staffBranchName = staff.branchName || (isAllBranches ? 'Cabang Utama' : activeBranch?.name);

      const newClock: StaffAttendance = {
        id: 'SA-' + Date.now(),
        branchId: staffBranchId,
        branchName: staffBranchName,
        date: APP_TODAY,
        timeIn: getTimestamp(),
        timeOut: '',
        staffId: staff.id,
        staffName: staff.name,
        shift: staff.shift || 'Pagi'
      };
      onStaffClock(newClock);
      showToast('Clock IN Berhasil', `Selamat bertugas, ${staff.name}! Shift ${staff.shift}.`, 'success');
      setSelectedStaffId('');
    } else {
      if (!existingActive) {
        showToast('Peringatan', `Tidak ditemukan sesi Clock IN aktif untuk ${staff.name} hari ini.`, 'warning');
        return;
      }

      const updated = { ...existingActive, timeOut: getTimestamp() };
      onStaffClock(updated);
      showToast('Clock OUT Berhasil', `Terima kasih atas kerja kerasnya, ${staff.name}!`, 'success');
      setSelectedStaffId('');
    }
  };

  const todayMemberAttendances = useMemo(() => {
    const list = attendances.filter((a) => a.date === APP_TODAY);
    return sortAttendancesByNewest(list);
  }, [attendances]);
  const activeInGymCount = todayMemberAttendances.filter((a) => !a.timeOut).length;
  const todayStaffAttendances = staffAttendances.filter((s) => s.date === APP_TODAY);

  // Filtered lockers for the visual Locker Board
  const filteredLockers = useMemo(() => {
    return lockers.filter((l) => {
      if (lockerBoardFilter === 'Pria' && l.gender !== 'Pria') return false;
      if (lockerBoardFilter === 'Wanita' && l.gender !== 'Wanita') return false;
      if (lockerBoardFilter === 'occupied' && !l.isOccupied) return false;
      if (lockerBoardFilter === 'available' && l.isOccupied) return false;

      if (lockerSearch.trim()) {
        const q = lockerSearch.toLowerCase();
        const matchNum = String(l.number).includes(q);
        const matchLabel = (l.label || '').toLowerCase().includes(q);
        const matchMember = (l.memberName || '').toLowerCase().includes(q);
        const matchId = (l.memberId || '').toLowerCase().includes(q);
        if (!matchNum && !matchLabel && !matchMember && !matchId) return false;
      }
      return true;
    });
  }, [lockers, lockerBoardFilter, lockerSearch]);

  // Execute Swap Locker
  const handleConfirmSwapLocker = () => {
    if (!swapModal.currentLocker || !swapModal.targetNumber) {
      showToast('Peringatan', 'Pilih nomor loker tujuan yang kosong.', 'warning');
      return;
    }

    if (onSwapLocker) {
      onSwapLocker(swapModal.currentLocker.number, swapModal.targetNumber);
    } else if (onUpdateLockers) {
      const oldNum = swapModal.currentLocker.number;
      const newNum = swapModal.targetNumber;
      onUpdateLockers((prev) => {
        const oldSlot = prev.find((l) => l.number === oldNum);
        if (!oldSlot) return prev;
        return prev.map((l) => {
          if (l.number === oldNum) {
            return {
              ...l,
              isOccupied: false,
              memberId: undefined,
              memberName: undefined,
              timeIn: undefined,
              hasTowel: false,
              status: 'Tersedia'
            };
          }
          if (l.number === newNum) {
            return {
              ...l,
              isOccupied: true,
              memberId: oldSlot.memberId,
              memberName: oldSlot.memberName,
              timeIn: oldSlot.timeIn,
              hasTowel: oldSlot.hasTowel,
              status: 'Terpakai'
            };
          }
          return l;
        });
      });
      showToast('Tukar Loker Berhasil', `Kunci dipindahkan dari Loker #${oldNum} ke #${newNum}.`, 'success');
    }

    setSwapModal({ isOpen: false, currentLocker: null, targetNumber: null });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Tab switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-orange-500" />
              Presensi Member, Absensi & Manajemen Kunci Loker
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
              isAllBranches
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Resepsionis: {isAllBranches ? 'Konsolidasi Seluruh Cabang' : activeBranch?.name}</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sistem check-in terpadu front desk: rekomendasi otomatis kunci loker, panduan operasional pintar, dan monitoring kehadiran real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RealTimeClock variant="badge" />

          {activeTab === 'member' && (
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-orange-500/25 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" /> Scan QR Card Member
            </button>
          )}

          <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('member')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'member' ? 'bg-orange-500 text-zinc-950 font-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Presensi Member ({activeInGymCount} Aktif)
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'staff' ? 'bg-orange-500 text-zinc-950 font-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Clock In Staf ({todayStaffAttendances.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MEMBER ATTENDANCE & LOCKER MANAGEMENT */}
      {activeTab === 'member' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: SCANNER, FAST CHECK-IN & DESK SMART CO-PILOT (5 COLS) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* CHECK-IN FORM CARD */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Fast-Track Check-In</h3>
                    <p className="text-[11px] text-zinc-400">Tap / Cari member dan serahkan kunci loker</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-xl border border-orange-500/30 transition shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" /> Kamera QR
                </button>
              </div>

              <form onSubmit={handleMemberSubmit} className="space-y-4">
                {/* Member Search Selector */}
                <div>
                  <SearchableMemberSelect
                    members={members}
                    selectedMemberId={selectedMemberId}
                    onSelectMember={(id) => setSelectedMemberId(id)}
                    attendances={attendances}
                    placeholder="Ketik nama, no. HP, atau ID member (M001)..."
                    label="Pilih / Scan Kartu Member"
                  />
                </div>

                {/* FRONT DESK CO-PILOT / SMART OPERATIONAL GUIDANCE BOX */}
                {selectedMemberObj && deskCoPilot && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-black text-white">Asisten & Panduan Front Desk</span>
                          <span className="text-[10px] text-zinc-400 block font-normal">Saran interaksi & SOP layanan member</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-lg font-bold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {deskCoPilot.genderLabel}
                      </span>
                    </div>

                    {/* 0. FRIENDLY GREETING & VISIT STATS CUE */}
                    <div className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-start gap-2.5 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-blue-300 text-[11px] uppercase tracking-wider">
                            Sapaan Ramah Kasir
                          </p>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Kunjungan ke-{deskCoPilot.monthlyVisits + 1} bulan ini
                          </span>
                        </div>
                        <p className="text-zinc-200 font-medium text-xs mt-0.5">
                          "{deskCoPilot.greetingScript}"
                        </p>
                      </div>
                    </div>

                    {/* 1. BIRTHDAY ALERT */}
                    {deskCoPilot.isBirthdayToday && (
                      <div className="p-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs shadow-sm">
                        <Gift className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                        <div className="flex-1">
                          <p className="font-black text-amber-300 flex items-center gap-1.5">
                            <span>HARI INI ULANG TAHUN MEMBER! 🎉</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/30 text-amber-200 rounded font-black">Spesial</span>
                          </p>
                          <p className="text-[11px] text-zinc-300 mt-0.5">
                            Ucapkan: <em>"Selamat Ulang Tahun dari keluarga GymPro, Kak {selectedMemberObj.name}!"</em>
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                              🎁 Hak Member: 1x Complimentary Healthy Shake / Air Minum
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. MEMBERSHIP EXPIRY CUES */}
                    {deskCoPilot.isExpired ? (
                      <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-300">Masa Aktif Telah Expired ({formatDateIndo(selectedMemberObj.expired)})</p>
                          <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                            Akses gate masuk tertahan. Saran Kasir: <em>"{deskCoPilot.renewalScript}"</em>
                          </p>
                        </div>
                      </div>
                    ) : deskCoPilot.isExpiringSoon ? (
                      <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-start gap-2 text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-300 flex items-center gap-1.5">
                            <span>Peluang Perpanjangan ({deskCoPilot.daysLeft} Hari Lagi Expired)</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black">Follow Up</span>
                          </p>
                          <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                            Sapa ramah: <em>"{deskCoPilot.renewalScript}"</em>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-950/20 border border-emerald-800/30 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-zinc-300 flex items-center gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Masa Aktif Normal: s.d. {formatDateIndo(selectedMemberObj.expired)}
                        </span>
                        <span className="text-emerald-400 font-bold text-[10px]">{deskCoPilot.daysLeft} Hari Lagi</span>
                      </div>
                    )}

                    {/* 3. PT SESSIONS OPPORTUNITY */}
                    {deskCoPilot.hasPT && (
                      <div className="p-2.5 bg-purple-500/15 border border-purple-500/40 rounded-xl flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2">
                          <Dumbbell className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-purple-300 flex items-center gap-1.5">
                              <span>Memiliki {deskCoPilot.ptQuota} Sesi PT Aktif</span>
                              {deskCoPilot.isLastPT ? (
                                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded font-black">Sesi Terakhir!</span>
                              ) : deskCoPilot.ptQuota <= 2 ? (
                                <span className="bg-amber-500 text-zinc-950 text-[9px] px-1.5 py-0.2 rounded font-black">Sisa Kritis</span>
                              ) : null}
                            </p>
                            <p className="text-[11px] text-zinc-300 mt-0.5">
                              Trainer PIC: <strong>{deskCoPilot.picName}</strong>. <em>{deskCoPilot.ptScript}</em>
                            </p>
                          </div>
                        </div>

                        {visitType !== 'PT' && (
                          <button
                            type="button"
                            onClick={() => setVisitType('PT')}
                            className="px-2.5 py-1 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg text-[10px] shrink-0 transition shadow-sm"
                          >
                            Set Sesi PT
                          </button>
                        )}
                      </div>
                    )}

                    {/* 4. UNPAID DEBT / INSTALLMENT ALERT */}
                    {deskCoPilot.totalDebt > 0 && (
                      <div className="p-2.5 bg-red-950/30 border border-red-800/40 rounded-xl flex items-start gap-2 text-xs">
                        <CreditCard className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-300">Ada Cicilan Belum Lunas: {formatRp(deskCoPilot.totalDebt)}</p>
                          <p className="text-[11px] text-zinc-300 mt-0.5">
                            {deskCoPilot.debtScript}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 5. MEMBER NOTES */}
                    {selectedMemberObj.notes && (
                      <div className="text-[11px] text-zinc-400 flex items-start gap-1.5 pt-1 border-t border-zinc-800/60">
                        <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                        <span>Catatan Khusus: <em className="text-zinc-300">{selectedMemberObj.notes}</em></span>
                      </div>
                    )}
                  </div>
                )}

                {/* VISIT TYPE SELECTOR */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                    Tipe Kunjungan Latihan
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <label
                      className={`cursor-pointer text-center p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        visitType === 'Reguler'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-sm'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 bg-zinc-950/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visitType"
                        value="Reguler"
                        checked={visitType === 'Reguler'}
                        onChange={() => setVisitType('Reguler')}
                        className="sr-only"
                      />
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" /> Gym Reguler
                      </span>
                      <span className="text-[10px] font-normal text-zinc-500">Akses fasilitas fitness</span>
                    </label>

                    <label
                      className={`cursor-pointer text-center p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        visitType === 'PT'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-sm'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 bg-zinc-950/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visitType"
                        value="PT"
                        checked={visitType === 'PT'}
                        onChange={() => setVisitType('PT')}
                        className="sr-only"
                      />
                      <span className="flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5" /> Sesi PT (-1 Kuota)
                      </span>
                      <span className="text-[10px] font-normal text-zinc-500">Bersama Personal Trainer</span>
                    </label>
                  </div>
                </div>

                {/* LOCKER KEY ASSIGNMENT SECTION (PAS SEDANG ABSEN SEKALIAN BERIKAN KUNCI LOKER) */}
                {!activeSelectedMemberSession && (
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>Penyerahan Kunci Loker</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                              Otomatis
                            </span>
                          </p>
                          <p className="text-[10px] text-zinc-400">Alokasikan loker sesuai gender member</p>
                        </div>
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-zinc-400 hover:text-white">
                        <input
                          type="checkbox"
                          checked={withoutLocker}
                          onChange={(e) => setWithoutLocker(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-orange-500"
                        />
                        <span>Tanpa Loker</span>
                      </label>
                    </div>

                    {!withoutLocker ? (
                      <div className="space-y-3 pt-1">
                        {/* Currently Selected Locker Banner */}
                        {selectedLockerNumber ? (
                          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2 animate-in fade-in">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                                #{selectedLockerNumber < 10 ? '0' + selectedLockerNumber : selectedLockerNumber}
                              </div>
                              <div>
                                <p className="text-xs font-black text-white flex items-center gap-1.5">
                                  <span>Kunci Loker #{selectedLockerNumber < 10 ? '0' + selectedLockerNumber : selectedLockerNumber} Siap Diserahkan</span>
                                  {selectedMemberObj?.gender && (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                                      selectedMemberObj.gender === 'P' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'
                                    }`}>
                                      Area {selectedMemberObj.gender === 'P' ? 'Wanita' : 'Pria'}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  {selectedLockerNumber === deskCoPilot?.recLocker?.number
                                    ? '⭐ Rekomendasi otomatis sistem (loker terdekat & steril)'
                                    : 'Dipilih manual oleh front desk'}
                                </p>
                              </div>
                            </div>

                            {deskCoPilot?.recLocker && selectedLockerNumber !== deskCoPilot.recLocker.number && (
                              <button
                                type="button"
                                onClick={() => setSelectedLockerNumber(deskCoPilot.recLocker?.number || null)}
                                className="text-[10px] font-black px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition shrink-0"
                              >
                                Gunakan Rekomendasi (#{deskCoPilot.recLocker.number})
                              </button>
                            )}
                          </div>
                        ) : deskCoPilot?.recLocker ? (
                          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span className="text-zinc-300 text-[11px]">
                                Rekomendasi: <strong className="text-white">Loker {deskCoPilot.recLocker.gender} #{deskCoPilot.recLocker.number}</strong> ({deskCoPilot.recLocker.label})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedLockerNumber(deskCoPilot.recLocker?.number || null)}
                              className="text-[10px] font-black px-2 py-0.5 bg-emerald-500 text-zinc-950 rounded-lg hover:bg-emerald-400 transition"
                            >
                              Gunakan Rekomendasi
                            </button>
                          </div>
                        ) : null}

                        {/* Quick 1-Tap Locker Chips */}
                        {deskCoPilot?.availableGenderLockers && deskCoPilot.availableGenderLockers.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              <span>Pilih Cepat Kunci ({selectedMemberObj?.gender === 'P' ? 'Wanita' : 'Pria'}):</span>
                              <span className="text-emerald-400 font-semibold lowercase">
                                {deskCoPilot.availableGenderLockers.length} loker siap pakai
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {deskCoPilot.availableGenderLockers.map((l) => {
                                const isSel = selectedLockerNumber === l.number;
                                return (
                                  <button
                                    key={l.number}
                                    type="button"
                                    onClick={() => {
                                      setSelectedLockerNumber(l.number);
                                      setWithoutLocker(false);
                                    }}
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

                        {/* Full Locker selection dropdown */}
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            Atau Pilih dari Seluruh Daftar Loker:
                          </label>
                          <select
                            value={selectedLockerNumber || ''}
                            onChange={(e) => setSelectedLockerNumber(e.target.value ? Number(e.target.value) : null)}
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
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={hasTowel}
                              onChange={(e) => setHasTowel(e.target.checked)}
                              className="w-4 h-4 rounded accent-orange-500"
                            />
                            <span>Sertakan Handuk Gym Bersih Higienis (1 Pcs)</span>
                          </label>

                          <div className="text-[10px] text-zinc-500">
                            Pria: <strong className="text-blue-400">{lockerStats.priaAvailable}</strong> • Wanita: <strong className="text-pink-400">{lockerStats.wanitaAvailable}</strong> Kosong
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">
                        Member check-in tanpa menggunakan kunci loker fasilitas.
                      </p>
                    )}
                  </div>
                )}

                {/* FREEZE ALERT */}
                {selectedMemberObj && (selectedMemberObj.isFrozen || selectedMemberObj.status === 'FREEZE') && (
                  <div className="p-3 bg-sky-950/40 border border-sky-500/40 rounded-2xl flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 shrink-0 animate-pulse" />
                    <div className="text-xs">
                      <p className="font-bold text-sky-300">Status Member: FREEZE (Dibekukan)</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Alasan: <strong className="text-white">{selectedMemberObj.freezeReason || 'Cuti'}</strong>. Akses gate masuk gym ditolak sampai member di-unfreeze.
                      </p>
                    </div>
                  </div>
                )}

                {/* SUBMIT BUTTON WITH CLEAR CONTEXT */}
                {activeSelectedMemberSession ? (
                  <button
                    type="submit"
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-rose-500/20 transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Proses Checkout & Terima Kunci Loker ({selectedMemberObj?.name || 'Keluar'})
                  </button>
                ) : selectedMemberObj && (selectedMemberObj.isFrozen || selectedMemberObj.status === 'FREEZE') ? (
                  <button
                    type="submit"
                    className="w-full bg-sky-900/60 border border-sky-500/50 text-sky-300 font-black py-3.5 rounded-2xl shadow-lg shadow-sky-500/10 transition text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-sky-400" /> Akses Ditolak (Member Freeze)
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!selectedMemberId}
                    className={`w-full py-3.5 rounded-2xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${
                      selectedMemberId
                        ? 'bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black shadow-lg shadow-orange-500/20 cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    {selectedMemberObj
                      ? withoutLocker
                        ? `Check-In Sekarang (Tanpa Kunci Loker)`
                        : selectedLockerNumber
                        ? `Check-In & Serahkan Kunci Loker #${selectedLockerNumber < 10 ? '0' + selectedLockerNumber : selectedLockerNumber} (${selectedMemberObj.gender === 'P' ? 'Wanita' : 'Pria'})`
                        : `Check-In Sekarang (Pilih Loker)`
                      : 'Pilih Member Dahulu'}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: ATTENDANCE LOG OR VISUAL LOCKER BOARD (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* SUB-TAB TOGGLE: DAFTAR PRESENSI VS PAPAN KUNCI LOKER */}
            <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 p-2 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveMemberSubTab('attendance-list')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeMemberSubTab === 'attendance-list'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Log Presensi Hari Ini</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                    {activeInGymCount} Latihan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMemberSubTab('locker-board')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeMemberSubTab === 'locker-board'
                      ? 'bg-orange-500 text-zinc-950 font-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Papan Kunci Loker (30 Loker)</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    activeMemberSubTab === 'locker-board' ? 'bg-zinc-950 text-white' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {lockerStats.occupied} Terpakai
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 hidden sm:block pr-2">
                Loker Kosong: <strong className="text-emerald-400">{lockerStats.available}</strong>
              </div>
            </div>

            {/* VIEW 1: LIVE ATTENDANCE LOG LIST */}
            {activeMemberSubTab === 'attendance-list' && (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl flex flex-col h-[560px] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40 shrink-0">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" /> Log Kunjungan Member Hari Ini ({todayMemberAttendances.length})
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span>{activeInGymCount} Sedang Di Gym</span>
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
                  {todayMemberAttendances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs py-10">
                      <UserCheck className="w-8 h-8 opacity-20 mb-2" />
                      <p>Belum ada member yang check-in hari ini.</p>
                    </div>
                  ) : (
                    todayMemberAttendances.map((att) => (
                      <div
                        key={att.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl hover:border-zinc-700 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-white text-xs border border-zinc-700 shrink-0">
                            {att.memberName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white leading-tight truncate">{att.memberName}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  att.type === 'PT'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {att.badge}
                              </span>

                              {att.lockerNumber ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  att.timeOut || att.lockerReturned
                                    ? 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                }`}>
                                  <Key className="w-3 h-3" />
                                  <span>Loker #{att.lockerNumber} {att.lockerGender ? `(${att.lockerGender})` : ''}</span>
                                  {att.hasTowel && <span title="Handuk">+Handuk</span>}
                                  {(att.timeOut || att.lockerReturned) ? (
                                    <span className="text-emerald-400 font-bold">✓ Kunci Kembali</span>
                                  ) : (
                                    <span className="text-amber-400 text-[9px] font-medium">(Kunci Dipegang)</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">Tanpa Loker</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/70">
                          <div className="text-left sm:text-right">
                            <p className="text-xs font-bold text-white">Masuk: {att.timeIn}</p>
                            <p className={`text-[10px] font-semibold mt-0.5 ${att.timeOut ? 'text-zinc-500' : 'text-emerald-400 animate-pulse'}`}>
                              {att.timeOut ? `Keluar: ${att.timeOut}` : 'Masih Di Dalam Gym'}
                            </p>
                          </div>

                          {!att.timeOut ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {att.lockerNumber && !att.lockerReturned && onReleaseLocker && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const num =
                                      typeof att.lockerNumber === 'string'
                                        ? parseInt(att.lockerNumber.replace(/\D/g, ''), 10)
                                        : att.lockerNumber;
                                    if (num) onReleaseLocker(num);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1"
                                  title="Terima kembali kunci loker saja tanpa checkout member"
                                >
                                  <Key className="w-3.5 h-3.5" /> Terima Kunci
                                </button>
                              )}
                              <button
                                onClick={() => onCheckoutMember(att.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition flex items-center gap-1 shrink-0"
                              >
                                <LogOut className="w-3.5 h-3.5" /> {att.lockerNumber && !att.lockerReturned ? 'Checkout & Terima Kunci' : 'Checkout Member'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-500 px-2.5 py-1 bg-zinc-900 rounded-lg shrink-0">
                              SELESAI
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: VISUAL LOCKER BOARD (PAPAN KUNCI LOKER REAL-TIME) */}
            {activeMemberSubTab === 'locker-board' && (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl flex flex-col h-[560px] overflow-hidden shadow-sm">
                
                {/* Header with Stats & Filter */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 space-y-3 shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <h3 className="text-xs font-black text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-orange-400" />
                        Papan Kontrol & Status Kunci Loker
                      </h3>
                      <p className="text-[11px] text-zinc-400">Total {lockers.length} Loker: {lockerStats.priaTotal} Pria & {lockerStats.wanitaTotal} Wanita {lockerStats.maintenance > 0 ? `(${lockerStats.maintenance} Rusak)` : ''}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLockerManagementOpen(true)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Input & Atur Loker
                      </button>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={lockerSearch}
                          onChange={(e) => setLockerSearch(e.target.value)}
                          placeholder="Cari loker / nama..."
                          className="bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 outline-none w-32 sm:w-40 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setLockerBoardFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        lockerBoardFilter === 'all'
                          ? 'bg-zinc-200 text-black'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      Semua ({lockers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLockerBoardFilter('Pria')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        lockerBoardFilter === 'Pria'
                          ? 'bg-blue-500 text-white font-black'
                          : 'bg-zinc-950 text-blue-400 hover:text-blue-300 border border-zinc-800'
                      }`}
                    >
                      Loker Pria ({lockerStats.priaOccupied}/{lockerStats.priaTotal})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLockerBoardFilter('Wanita')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        lockerBoardFilter === 'Wanita'
                          ? 'bg-pink-500 text-white font-black'
                          : 'bg-zinc-950 text-pink-400 hover:text-pink-300 border border-zinc-800'
                      }`}
                    >
                      Loker Wanita ({lockerStats.wanitaOccupied}/{lockerStats.wanitaTotal})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLockerBoardFilter('occupied')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        lockerBoardFilter === 'occupied'
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : 'bg-zinc-950 text-amber-400 hover:text-amber-300 border border-zinc-800'
                      }`}
                    >
                      Sedang Dipakai ({lockerStats.occupied})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLockerBoardFilter('available')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        lockerBoardFilter === 'available'
                          ? 'bg-emerald-500 text-zinc-950 font-black'
                          : 'bg-zinc-950 text-emerald-400 hover:text-emerald-300 border border-zinc-800'
                      }`}
                    >
                      Tersedia ({lockerStats.available})
                    </button>
                  </div>
                </div>

                {/* Locker Grid */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800">
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                    {filteredLockers.map((locker) => {
                      const isMale = locker.gender === 'Pria';
                      const isMaint = locker.status === 'Perbaikan';
                      const isVip = locker.status === 'VIP';

                      return (
                        <div
                          key={locker.number}
                          className={`rounded-2xl p-3 border transition flex flex-col justify-between ${
                            isMaint
                              ? 'bg-rose-950/20 border-rose-800/40'
                              : locker.isOccupied
                              ? 'bg-amber-950/20 border-amber-600/40 shadow-sm'
                              : isVip
                              ? 'bg-purple-950/20 border-purple-800/40'
                              : 'bg-zinc-950/60 border-zinc-800 hover:border-emerald-500/50'
                          }`}
                        >
                          <div>
                            {/* Top row */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                  isMale ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                                }`}
                              >
                                {locker.label || `#${locker.number}`}
                              </span>

                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                  isMaint
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                    : isVip
                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                    : locker.isOccupied
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {isMaint ? 'Rusak' : isVip ? 'VIP' : locker.isOccupied ? 'Terpakai' : 'Kosong'}
                              </span>
                            </div>

                            {/* Main Locker Number */}
                            <div className="text-center py-1">
                              <div className="inline-flex items-center justify-center gap-1">
                                {isMaint ? (
                                  <Wrench className="w-4 h-4 text-rose-400" />
                                ) : locker.isOccupied ? (
                                  <Lock className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <Unlock className="w-4 h-4 text-emerald-400" />
                                )}
                                <span className="text-base font-black text-white">#{locker.number < 10 ? '0' + locker.number : locker.number}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500">Loker {locker.gender}</p>
                            </div>

                            {/* Occupant Details if occupied */}
                            {locker.isOccupied && (
                              <div className="mt-2 pt-2 border-t border-zinc-800/80 text-[10px] space-y-0.5">
                                <p className="font-bold text-white truncate" title={locker.memberName}>
                                  {locker.memberName || 'Member'}
                                </p>
                                <p className="text-zinc-400 font-mono">{locker.memberId}</p>
                                <p className="text-zinc-500">{locker.timeIn || '-'}</p>
                                {locker.hasTowel && (
                                  <span className="inline-block text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                    +Handuk
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex flex-col gap-1">
                            {isMaint ? (
                              <button
                                type="button"
                                onClick={() => setIsLockerManagementOpen(true)}
                                className="w-full py-1 px-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-[10px] transition text-center"
                              >
                                Perbaikan (Atur Loker)
                              </button>
                            ) : locker.isOccupied ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Find ongoing attendance session by lockerNumber, memberId, or memberName
                                    const ongoing = attendances.find(
                                      (a) =>
                                        ((typeof a.lockerNumber === 'string'
                                          ? parseInt(a.lockerNumber.replace(/\D/g, ''), 10) === locker.number
                                          : a.lockerNumber === locker.number) ||
                                          (locker.memberId && a.memberId === locker.memberId) ||
                                          (locker.memberName && a.memberName === locker.memberName)) &&
                                        !a.timeOut
                                    );
                                    if (ongoing) {
                                      onCheckoutMember(ongoing.id);
                                    } else if (onReleaseLocker) {
                                      onReleaseLocker(locker.number);
                                    }
                                  }}
                                  className="w-full py-1 px-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-[10px] transition text-center"
                                >
                                  Checkout & Bebaskan
                                </button>
                                {onReleaseLocker && (
                                  <button
                                    type="button"
                                    onClick={() => onReleaseLocker(locker.number)}
                                    className="w-full py-0.5 px-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold rounded text-[9px] transition text-center"
                                    title="Terima kunci ke meja resepsionis tanpa checkout member"
                                  >
                                    Terima Kunci Saja
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const availableTargets = lockers.filter((l) => !l.isOccupied && l.status !== 'Perbaikan');
                                    setSwapModal({
                                      isOpen: true,
                                      currentLocker: locker,
                                      targetNumber: availableTargets[0]?.number || null
                                    });
                                  }}
                                  className="w-full py-0.5 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded text-[9px] transition flex items-center justify-center gap-1"
                                >
                                  <ArrowRightLeft className="w-2.5 h-2.5" /> Tukar Kunci
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLockerNumber(locker.number);
                                  setWithoutLocker(false);
                                  setActiveMemberSubTab('attendance-list');
                                  showToast('Loker Dipilih', `Loker #${locker.number} disiapkan untuk form check-in.`, 'info');
                                }}
                                className="w-full py-1 px-1.5 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 font-bold rounded-lg text-[10px] transition text-center"
                              >
                                Pilih Loker Ini
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STAFF CLOCK IN / OUT */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm h-fit">
            <h3 className="text-base font-bold text-white mb-2">Presensi Shift Staf</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Catat waktu masuk (Clock IN) dan waktu selesai kerja (Clock OUT) staf dan trainer gym.
            </p>

            {/* Live Real-Time Precision Clock */}
            <RealTimeClock variant="card" className="mb-4" />

            <div className="space-y-4">
              <div>
                <SearchableStaffSelect
                  staffUsers={staffUsers}
                  selectedStaffId={selectedStaffId}
                  onSelectStaff={(id) => setSelectedStaffId(id)}
                  staffAttendances={staffAttendances}
                  placeholder="Ketik nama, role, atau shift staf..."
                  label="Pilih Staf"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStaffClockAction('IN')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Clock IN
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffClockAction('OUT')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Clock OUT
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl lg:col-span-2 flex flex-col h-[520px] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40 shrink-0">
              <h3 className="text-sm font-bold text-white">Log Kehadiran Staf Hari Ini</h3>
              <span className="text-xs text-zinc-400 font-medium">Shift Pagi / Siang</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {todayStaffAttendances.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs py-10">
                  <p>Belum ada staf yang Clock IN hari ini.</p>
                </div>
              ) : (
                todayStaffAttendances.map((sAtt) => (
                  <div
                    key={sAtt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white text-xs border border-zinc-700 shrink-0">
                        {sAtt.staffName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{sAtt.staffName}</h4>
                        <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Shift {sAtt.shift}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-zinc-800/70">
                      <p className="text-xs font-bold text-emerald-400">IN: {sAtt.timeIn}</p>
                      <p className={`text-xs font-semibold ${sAtt.timeOut ? 'text-rose-400' : 'text-zinc-500'}`}>
                        OUT: {sAtt.timeOut || 'Aktif Bekerja'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR CODE SCANNER OVERLAY MODAL */}
      <QRCodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        members={members}
        attendances={attendances}
        lockers={lockers}
        onAddAttendance={onAddAttendance}
        onCheckoutMember={onCheckoutMember}
        showToast={showToast}
      />

      {/* MODAL: SLIP PENYERAHAN KUNCI LOKER (PRINT & DISPLAY) */}
      {isSlipModalOpen && lastCheckInSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Tiket Penyerahan Kunci Loker</h3>
                  <p className="text-[10px] text-zinc-400">Slip konfirmasi check-in member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slip Content */}
            <div className="p-6 space-y-4">
              <div className="text-center py-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  GymPro Enterprise ERP
                </span>
                <p className="text-xs text-zinc-400 mt-2">Nomor Kunci Loker Diberikan:</p>
                <div className="mt-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-zinc-950 border-2 border-orange-500/60 shadow-inner">
                  <Key className="w-6 h-6 text-orange-400" />
                  <span className="text-2xl font-black text-white tracking-wide">
                    {lastCheckInSlip.lockerLabel || `#${lastCheckInSlip.lockerNumber}`}
                  </span>
                  <span className="text-xs text-zinc-400 font-semibold">({lastCheckInSlip.gender})</span>
                </div>
              </div>

              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Nama Member:</span>
                  <span className="font-bold text-white">{lastCheckInSlip.member.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">ID Member:</span>
                  <span className="font-mono text-zinc-300 font-bold">{lastCheckInSlip.member.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Waktu Masuk:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{lastCheckInSlip.timeIn}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Tipe Kunjungan:</span>
                  <span className="font-semibold text-white">{lastCheckInSlip.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Cabang / Outlet:</span>
                  <span className="font-semibold text-amber-300">
                    {lastCheckInSlip.member.branchName || activeBranch?.name || 'Cabang Utama'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Fasilitas Handuk:</span>
                  <span className="font-semibold text-emerald-400">
                    {lastCheckInSlip.hasTowel ? '1 Pcs Diberikan ✓' : 'Tidak Ambil'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 text-center space-y-0.5">
                <p className="font-bold text-zinc-300">Pemberitahuan Front Desk:</p>
                <p>Harap kembalikan kunci loker ke resepsionis saat selesai berlatih.</p>
              </div>
            </div>

            {/* Slip Footer with Universal Printer Support */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Target Format:</span>
                </span>
                <div className="flex items-center gap-1">
                  {(['58mm', '80mm', 'a4'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={async () => {
                        const html = generateLockerSlipHtml(
                          lastCheckInSlip,
                          activeBranch,
                          sz,
                          { gymName: settings?.profile?.gymName || 'GYMPRO FITNESS' }
                        );
                        await printViaHiddenIframe(html, {
                          title: `Slip_Loker_${lastCheckInSlip.lockerNumber}_${sz}`,
                          paperSize: sz
                        });
                        showToast('Cetak Struk', `Slip dicetak ke printer ${sz === 'a4' ? 'Standar A4' : 'Thermal ' + sz}.`, 'info');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-300 border border-zinc-800 text-[10px] font-bold transition cursor-pointer"
                    >
                      {sz === '58mm' ? 'Thermal 58' : sz === '80mm' ? 'Thermal 80' : 'A4'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    const chosenSize = (settings?.printer?.paperWidth as PrintPaperSize) || '80mm';
                    const html = generateLockerSlipHtml(
                      lastCheckInSlip,
                      activeBranch,
                      chosenSize,
                      { gymName: settings?.profile?.gymName || 'GYMPRO FITNESS' }
                    );
                    await printViaHiddenIframe(html, {
                      title: `Slip_Loker_${lastCheckInSlip.lockerNumber}`,
                      paperSize: chosenSize
                    });
                    showToast('Cetak Struk', `Mencetak slip loker ke printer (${chosenSize})...`, 'info');
                  }}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700 hover:border-orange-500/40"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-400" /> Cetak Slip ({settings?.printer?.paperWidth || '80mm'})
                </button>
                <button
                  type="button"
                  onClick={() => setIsSlipModalOpen(false)}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SWAP LOCKER */}
      {swapModal.isOpen && swapModal.currentLocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Tukar Kunci Loker Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setSwapModal({ isOpen: false, currentLocker: null, targetNumber: null })}
                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <p className="text-zinc-400 text-[11px]">Member Saat Ini:</p>
                <p className="font-bold text-white text-sm">{swapModal.currentLocker.memberName}</p>
                <p className="text-[11px] text-zinc-400">
                  Loker Saat Ini: <strong className="text-orange-400">#{swapModal.currentLocker.number} ({swapModal.currentLocker.gender})</strong>
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Pilih Loker Baru yang Kosong:</label>
                <select
                  value={swapModal.targetNumber || ''}
                  onChange={(e) => setSwapModal({ ...swapModal, targetNumber: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-semibold"
                >
                  <option value="">-- Pilih Loker Tujuan --</option>
                  {lockers
                    .filter((l) => !l.isOccupied && l.gender === swapModal.currentLocker?.gender)
                    .map((l) => (
                      <option key={l.number} value={l.number} className="bg-zinc-900 text-white">
                        Loker #{l.number} ({l.label}) - {l.gender} (Tersedia)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSwapModal({ isOpen: false, currentLocker: null, targetNumber: null })}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSwapLocker}
                disabled={!swapModal.targetNumber}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl disabled:opacity-50"
              >
                Konfirmasi Tukar Kunci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INPUT & MANAJEMEN LOKER LENGKAP */}
      <LockerManagementModal
        isOpen={isLockerManagementOpen}
        onClose={() => setIsLockerManagementOpen(false)}
        lockers={lockers}
        onUpdateLockers={onUpdateLockers || (() => {})}
        members={members}
        attendances={attendances}
        onAddAttendance={onAddAttendance}
        onCheckoutMember={onCheckoutMember}
        onReleaseLocker={onReleaseLocker}
        onSwapLocker={onSwapLocker}
        showToast={showToast}
      />
    </div>
  );
};

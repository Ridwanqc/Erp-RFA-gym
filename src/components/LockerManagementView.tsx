import React, { useState, useMemo } from 'react';
import {
  Key,
  Plus,
  Wrench,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Printer,
  X,
  User,
  Crown,
  MapPin,
  Tag,
  ShieldCheck,
  Check,
  ArrowRightLeft,
  Calendar,
  Clock
} from 'lucide-react';
import { LockerSlot, Member, Attendance } from '../types';
import {
  getLockerStats,
  getNextAvailableLockerNumber,
  validateLockerNumber,
  generateBatchLockers,
  INITIAL_LOCKERS
} from '../data/lockerData';
import { getTimestamp, APP_TODAY } from '../utils/formatters';

interface LockerManagementViewProps {
  lockers: LockerSlot[];
  onUpdateLockers: React.Dispatch<React.SetStateAction<LockerSlot[]>>;
  members: Member[];
  attendances?: Attendance[];
  onAddAttendance?: (att: Attendance, member?: Member) => void;
  onCheckoutMember?: (attId: string) => void;
  onReleaseLocker?: (lockerNum: number) => void;
  onSwapLocker?: (oldNum: number, newNum: number) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const LockerManagementView: React.FC<LockerManagementViewProps> = ({
  lockers,
  onUpdateLockers,
  members,
  attendances = [],
  onAddAttendance,
  onCheckoutMember,
  onReleaseLocker,
  onSwapLocker,
  showToast,
  isModal = false,
  onClose
}) => {
  // Main view tabs: 'list' | 'add-single' | 'batch-generate' | 'assign-manual'
  const [activeTab, setActiveTab] = useState<'list' | 'add-single' | 'batch-generate' | 'assign-manual'>('list');

  // Search & Filter state for 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Pria' | 'Wanita' | 'Semua'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Tersedia' | 'Terpakai' | 'Perbaikan' | 'VIP'>('all');

  // Single Locker Form state
  const [singleForm, setSingleForm] = useState<{
    number: number;
    label: string;
    gender: 'Pria' | 'Wanita' | 'Semua';
    status: 'Tersedia' | 'Perbaikan' | 'VIP';
    location: string;
    notes: string;
  }>(() => {
    const nextNum = getNextAvailableLockerNumber(lockers);
    return {
      number: nextNum,
      label: `L-${nextNum < 10 ? '0' + nextNum : nextNum}`,
      gender: 'Pria',
      status: 'Tersedia',
      location: 'Ruang Loker Pria - Lantai 1',
      notes: ''
    };
  });

  // Batch Generation Form state
  const [batchForm, setBatchForm] = useState<{
    startNumber: number;
    count: number;
    gender: 'Pria' | 'Wanita' | 'Semua';
    prefix: string;
    padZero: boolean;
    location: string;
    status: 'Tersedia' | 'VIP';
    overwriteExisting: boolean;
  }>(() => {
    const nextNum = getNextAvailableLockerNumber(lockers);
    return {
      startNumber: nextNum,
      count: 10,
      gender: 'Pria',
      prefix: 'P-',
      padZero: true,
      location: 'Ruang Loker Pria',
      status: 'Tersedia',
      overwriteExisting: false
    };
  });

  // Edit Modal State
  const [editingLocker, setEditingLocker] = useState<LockerSlot | null>(null);

  // Manual Assign Modal State
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    locker: LockerSlot | null;
    selectedMemberId: string;
    hasTowel: boolean;
    depositItem: string;
    notes: string;
  }>({
    isOpen: false,
    locker: null,
    selectedMemberId: '',
    hasTowel: true,
    depositItem: 'KTP',
    notes: ''
  });

  // Delete Confirmation State
  const [deletingLockerNumber, setDeletingLockerNumber] = useState<number | null>(null);

  // Statistics
  const stats = useMemo(() => getLockerStats(lockers), [lockers]);

  // Filtered lockers for list
  const filteredLockers = useMemo(() => {
    return lockers
      .filter((l) => {
        // Gender filter
        if (genderFilter !== 'all' && l.gender !== genderFilter) {
          return false;
        }
        // Status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'Terpakai' && !l.isOccupied) return false;
          if (statusFilter === 'Tersedia' && (l.isOccupied || l.status === 'Perbaikan')) return false;
          if (statusFilter === 'Perbaikan' && l.status !== 'Perbaikan') return false;
          if (statusFilter === 'VIP' && l.status !== 'VIP') return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNum = String(l.number).includes(q);
          const matchLabel = l.label?.toLowerCase().includes(q);
          const matchMember = l.memberName?.toLowerCase().includes(q);
          const matchMemberId = l.memberId?.toLowerCase().includes(q);
          const matchLoc = l.location?.toLowerCase().includes(q);
          return matchNum || matchLabel || matchMember || matchMemberId || matchLoc;
        }
        return true;
      })
      .sort((a, b) => a.number - b.number);
  }, [lockers, genderFilter, statusFilter, searchQuery]);

  // Handle auto-update label in single add when number changes
  const handleSingleNumberChange = (num: number) => {
    const prefix = singleForm.gender === 'Wanita' ? 'W-' : singleForm.gender === 'Pria' ? 'P-' : 'L-';
    const numStr = num < 100 ? String(num).padStart(2, '0') : String(num);
    setSingleForm((prev) => ({
      ...prev,
      number: num,
      label: `${prefix}${numStr}`
    }));
  };

  // Handle single gender change
  const handleSingleGenderChange = (g: 'Pria' | 'Wanita' | 'Semua') => {
    const prefix = g === 'Wanita' ? 'W-' : g === 'Pria' ? 'P-' : 'L-';
    const numStr = singleForm.number < 100 ? String(singleForm.number).padStart(2, '0') : String(singleForm.number);
    const loc = g === 'Wanita' ? 'Ruang Loker Wanita - Lantai 1' : g === 'Pria' ? 'Ruang Loker Pria - Lantai 1' : 'Area Umum';
    setSingleForm((prev) => ({
      ...prev,
      gender: g,
      label: `${prefix}${numStr}`,
      location: loc
    }));
  };

  // Save New Single Locker
  const handleSaveSingleLocker = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateLockerNumber(lockers, singleForm.number);
    if (!val.isValid) {
      showToast('Gagal Menambahkan Loker', val.message || 'Nomor tidak valid.', 'error');
      return;
    }

    const newSlot: LockerSlot = {
      number: singleForm.number,
      label: singleForm.label || `#${singleForm.number}`,
      gender: singleForm.gender,
      isOccupied: false,
      status: singleForm.status,
      location: singleForm.location,
      notes: singleForm.notes
    };

    onUpdateLockers((prev) => [...prev, newSlot].sort((a, b) => a.number - b.number));
    showToast('Loker Ditambahkan', `Loker #${newSlot.number} (${newSlot.label}) berhasil didaftarkan.`, 'success');

    // Reset single form to next candidate
    const updatedPool = [...lockers, newSlot];
    const nextCandidate = getNextAvailableLockerNumber(updatedPool);
    const prefix = singleForm.gender === 'Wanita' ? 'W-' : singleForm.gender === 'Pria' ? 'P-' : 'L-';
    setSingleForm({
      number: nextCandidate,
      label: `${prefix}${nextCandidate < 10 ? '0' + nextCandidate : nextCandidate}`,
      gender: singleForm.gender,
      status: 'Tersedia',
      location: singleForm.location,
      notes: ''
    });

    setActiveTab('list');
  };

  // Execute Batch Generator
  const handleExecuteBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchForm.count <= 0 || batchForm.count > 100) {
      showToast('Jumlah Tidak Valid', 'Jumlah loker batch harus antara 1 sampai 100.', 'error');
      return;
    }

    const { newLockers, skippedCount } = generateBatchLockers({
      startNumber: batchForm.startNumber,
      count: batchForm.count,
      gender: batchForm.gender,
      prefix: batchForm.prefix,
      padZero: batchForm.padZero,
      location: batchForm.location,
      status: batchForm.status,
      overwriteExisting: batchForm.overwriteExisting,
      currentLockers: lockers
    });

    if (newLockers.length === 0) {
      showToast('Tidak Ada Loker Dibuat', 'Semua nomor dalam rentang tersebut sudah ada. Aktifkan opsi "Timpa" jika ingin mengganti.', 'warning');
      return;
    }

    onUpdateLockers((prev) => {
      const existingMap = new Map<number, LockerSlot>();
      prev.forEach((l) => existingMap.set(l.number, l));

      newLockers.forEach((l) => {
        existingMap.set(l.number, l);
      });

      return Array.from(existingMap.values()).sort((a, b) => a.number - b.number);
    });

    showToast(
      'Batch Loker Berhasil Dibuat',
      `${newLockers.length} loker baru berhasil digenerate.${skippedCount > 0 ? ` (${skippedCount} nomor dilewati karena sudah ada)` : ''}`,
      'success'
    );

    setActiveTab('list');
  };

  // Save Edited Locker
  const handleSaveEditLocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocker) return;

    // Validate number if changed
    const original = lockers.find((l) => l.number === editingLocker.number);
    if (!original) {
      showToast('Error', 'Data loker tidak ditemukan.', 'error');
      return;
    }

    onUpdateLockers((prev) =>
      prev.map((l) => (l.number === editingLocker.number ? editingLocker : l)).sort((a, b) => a.number - b.number)
    );

    showToast('Loker Diperbarui', `Perubahan data Loker #${editingLocker.number} berhasil disimpan.`, 'success');
    setEditingLocker(null);
  };

  // Quick Toggle Maintenance
  const handleToggleMaintenance = (lockerNumber: number) => {
    onUpdateLockers((prev) =>
      prev.map((l) => {
        if (l.number === lockerNumber) {
          const isMaint = l.status === 'Perbaikan';
          return {
            ...l,
            status: isMaint ? 'Tersedia' : 'Perbaikan',
            isOccupied: isMaint ? l.isOccupied : false // release occupancy if put into maintenance
          };
        }
        return l;
      })
    );

    const target = lockers.find((l) => l.number === lockerNumber);
    const isNowMaint = target?.status !== 'Perbaikan';
    showToast(
      isNowMaint ? 'Status: Perbaikan / Rusak' : 'Status: Tersedia Kembali',
      `Loker #${lockerNumber} ${isNowMaint ? 'ditandai sedang perbaikan dan dinonaktifkan dari pemilihan.' : 'siap digunakan kembali.'}`,
      isNowMaint ? 'warning' : 'success'
    );
  };

  // Delete Locker
  const handleConfirmDelete = (lockerNumber: number) => {
    onUpdateLockers((prev) => prev.filter((l) => l.number !== lockerNumber));
    showToast('Loker Dihapus', `Loker #${lockerNumber} telah dihapus dari sistem.`, 'info');
    setDeletingLockerNumber(null);
  };

  // Force Release / Clear Locker
  const handleForceRelease = (lockerNumber: number) => {
    if (onReleaseLocker) {
      onReleaseLocker(lockerNumber);
    } else {
      onUpdateLockers((prev) =>
        prev.map((l) =>
          l.number === lockerNumber
            ? {
                ...l,
                isOccupied: false,
                memberId: undefined,
                memberName: undefined,
                timeIn: undefined,
                hasTowel: false,
                status: 'Tersedia'
              }
            : l
        )
      );
      showToast('Kunci Dikembalikan', `Loker #${lockerNumber} telah dikosongkan.`, 'success');
    }
  };

  // Manual Assign Key Submit
  const handleAssignKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal.locker || !assignModal.selectedMemberId) {
      showToast('Pilih Member', 'Silakan pilih member yang akan menerima kunci loker.', 'warning');
      return;
    }

    const selectedMember = members.find((m) => m.id === assignModal.selectedMemberId);
    if (!selectedMember) return;

    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    // Update locker slot
    onUpdateLockers((prev) =>
      prev.map((l) =>
        l.number === assignModal.locker?.number
          ? {
              ...l,
              isOccupied: true,
              memberId: selectedMember.id,
              memberName: selectedMember.name,
              timeIn: timeNow,
              hasTowel: assignModal.hasTowel,
              status: 'Terpakai',
              depositItem: assignModal.depositItem,
              notes: assignModal.notes
            }
          : l
      )
    );

    // If attendance callback available, record attendance entry if needed
    if (onAddAttendance) {
      const newAtt: Attendance = {
        id: 'ATT-' + Date.now(),
        date: APP_TODAY,
        timeIn: timeNow,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        type: 'Reguler',
        badge: selectedMember.membershipType || 'Member',
        lockerNumber: assignModal.locker.number,
        lockerGender: assignModal.locker.gender === 'Wanita' ? 'Wanita' : 'Pria',
        hasTowel: assignModal.hasTowel,
        notes: `Penyerahan kunci manual meja front desk (${assignModal.depositItem ? `Jaminan: ${assignModal.depositItem}` : ''})`
      };
      onAddAttendance(newAtt);
    }

    showToast(
      'Kunci Loker Diserahkan',
      `Loker #${assignModal.locker.number} (${assignModal.locker.label || ''}) diserahkan kepada ${selectedMember.name}.`,
      'success'
    );

    setAssignModal({
      isOpen: false,
      locker: null,
      selectedMemberId: '',
      hasTowel: true,
      depositItem: 'KTP',
      notes: ''
    });
  };

  // Reset to default 30 lockers
  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin me-reset daftar loker ke 30 loker standar gym (15 Pria & 15 Wanita)?')) {
      onUpdateLockers(INITIAL_LOCKERS);
      showToast('Reset Berhasil', 'Daftar loker telah di-reset ke konfigurasi default 30 slot.', 'info');
    }
  };

  return (
    <div className={`space-y-6 ${isModal ? 'p-1' : ''}`}>
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & ACTION BANNER */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Master & Pengaturan Loker Gym
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {lockers.length} Loker Terdaftar
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Input loker baru, buat banyak nomor sekaligus (batch generator), atur zona pria/wanita, dan kelola pemeliharaan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('add-single')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeTab === 'add-single'
                  ? 'bg-amber-500 text-zinc-950 font-black ring-2 ring-amber-400'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Input Loker Baru
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('batch-generate')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeTab === 'batch-generate'
                  ? 'bg-amber-500 text-zinc-950 font-black ring-2 ring-amber-400'
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Batch Generator (+Banyak)
            </button>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5 mt-5 border-t border-zinc-800/80">
          <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Total Kapasitas
            </span>
            <span className="text-xl font-black text-white mt-0.5 block">
              {stats.total}
            </span>
            <span className="text-[10px] text-zinc-500">Unit Loker Fisik</span>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              Tersedia Kosong
            </span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {stats.available}
            </span>
            <span className="text-[10px] text-zinc-500">Siap diberikan ke member</span>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Sedang Terpakai
            </span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">
              {stats.occupied}
            </span>
            <span className="text-[10px] text-zinc-500">Okupansi: {stats.occupancyRate}%</span>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
              Zona Pria
            </span>
            <span className="text-xl font-black text-sky-400 mt-0.5 block">
              {stats.priaOccupied}/{stats.priaTotal}
            </span>
            <span className="text-[10px] text-zinc-500">Sisa {stats.priaAvailable} kosong</span>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider block">
              Zona Wanita
            </span>
            <span className="text-xl font-black text-pink-400 mt-0.5 block">
              {stats.wanitaOccupied}/{stats.wanitaTotal}
            </span>
            <span className="text-[10px] text-zinc-500">Sisa {stats.wanitaAvailable} kosong</span>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
              Dalam Perbaikan
            </span>
            <span className="text-xl font-black text-rose-400 mt-0.5 block">
              {stats.maintenance}
            </span>
            <span className="text-[10px] text-zinc-500">{stats.vip > 0 ? `${stats.vip} VIP` : 'Kunci/Gembok rusak'}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION PILLS (SUB-TABS) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-zinc-200 text-zinc-950 font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Matriks & Daftar Loker ({lockers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add-single')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'add-single'
                ? 'bg-amber-500 text-zinc-950 font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Input Loker Satuan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batch-generate')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'batch-generate'
                ? 'bg-amber-500 text-zinc-950 font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generator Banyak Loker
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Reset ke konfigurasi default 30 loker"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Default (30 Loker)
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Cetak matriks loker"
          >
            <Printer className="w-3 h-3" />
            Cetak Rekap
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: DAFTAR & MATRIKS LOKER LENGKAP */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor loker, label (e.g. P-01), nama member, lokasi..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Gender Filter */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                {(['all', 'Pria', 'Wanita'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderFilter(g)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      genderFilter === g
                        ? g === 'Pria'
                          ? 'bg-sky-500 text-white'
                          : g === 'Wanita'
                          ? 'bg-pink-500 text-white'
                          : 'bg-zinc-200 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {g === 'all' ? 'Semua Zona' : g}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                {(['all', 'Tersedia', 'Terpakai', 'Perbaikan', 'VIP'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      statusFilter === s
                        ? s === 'Terpakai'
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : s === 'Tersedia'
                          ? 'bg-emerald-500 text-zinc-950 font-black'
                          : s === 'Perbaikan'
                          ? 'bg-rose-500 text-white font-black'
                          : 'bg-purple-500 text-white font-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s === 'all' ? 'Semua Status' : s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GRID OF LOCKER CARDS */}
          {filteredLockers.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-3">
              <Key className="w-10 h-10 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">Tidak Ada Loker Sesuai Filter</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau bersihkan filter gender & status.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setGenderFilter('all');
                  setStatusFilter('all');
                }}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredLockers.map((locker) => {
                const isMale = locker.gender === 'Pria';
                const isFemale = locker.gender === 'Wanita';
                const isMaintenance = locker.status === 'Perbaikan';
                const isVip = locker.status === 'VIP';

                return (
                  <div
                    key={locker.number}
                    className={`rounded-2xl p-3.5 border transition flex flex-col justify-between relative group ${
                      isMaintenance
                        ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-600/60'
                        : locker.isOccupied
                        ? 'bg-amber-950/20 border-amber-600/40 shadow-xs'
                        : isVip
                        ? 'bg-purple-950/20 border-purple-800/40'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-emerald-500/50'
                    }`}
                  >
                    <div>
                      {/* Top Header: Label & Status Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isMale
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : isFemale
                              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {locker.label || `#${locker.number}`}
                        </span>

                        <div className="flex items-center gap-1">
                          {isMaintenance ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
                              <Wrench className="w-2.5 h-2.5" /> Rusak
                            </span>
                          ) : isVip ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> VIP
                            </span>
                          ) : locker.isOccupied ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Terpakai
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Tersedia
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main Locker Number Display */}
                      <div className="text-center py-1.5">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {isMaintenance ? (
                            <Wrench className="w-4 h-4 text-rose-400" />
                          ) : locker.isOccupied ? (
                            <Lock className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Unlock className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className="text-lg font-black text-white tracking-wide">
                            #{locker.number < 100 ? String(locker.number).padStart(2, '0') : locker.number}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Zona {locker.gender} {locker.location ? `• ${locker.location}` : ''}
                        </p>
                      </div>

                      {/* Occupant Details if Occupied */}
                      {locker.isOccupied && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/80 text-[10px] space-y-0.5 bg-zinc-900/60 p-2 rounded-xl">
                          <p className="font-bold text-white truncate" title={locker.memberName}>
                            {locker.memberName || 'Member'}
                          </p>
                          {locker.memberId && <p className="text-zinc-400 font-mono">{locker.memberId}</p>}
                          {locker.timeIn && (
                            <p className="text-zinc-500 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {locker.timeIn}
                            </p>
                          )}
                          {locker.hasTowel && (
                            <span className="inline-block text-[9px] text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded font-semibold">
                              +Handuk
                            </span>
                          )}
                          {locker.depositItem && (
                            <span className="inline-block text-[9px] text-sky-400 bg-sky-500/10 px-1 py-0.2 rounded font-semibold ml-1">
                              Jaminan: {locker.depositItem}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes / Special warning */}
                      {locker.notes && !locker.isOccupied && (
                        <div className="mt-2 text-[9px] text-zinc-400 italic line-clamp-1">
                          "{locker.notes}"
                        </div>
                      )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col gap-1.5">
                      {locker.isOccupied ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleForceRelease(locker.number)}
                            className="w-full py-1 px-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold rounded-lg text-[10px] transition text-center border border-rose-500/30"
                          >
                            Bebaskan / Terima Kunci
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isMaintenance}
                          onClick={() => {
                            setAssignModal({
                              isOpen: true,
                              locker,
                              selectedMemberId: members[0]?.id || '',
                              hasTowel: true,
                              depositItem: 'KTP',
                              notes: ''
                            });
                          }}
                          className={`w-full py-1 px-2 font-bold rounded-lg text-[10px] transition text-center ${
                            isMaintenance
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                          }`}
                        >
                          Serahkan Kunci
                        </button>
                      )}

                      <div className="grid grid-cols-3 gap-1">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingLocker({ ...locker })}
                          className="py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[9px] font-semibold transition flex items-center justify-center gap-0.5"
                          title="Edit Nomor, Label & Pengaturan"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Edit
                        </button>

                        {/* Toggle Maintenance Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleMaintenance(locker.number)}
                          className={`py-1 px-1 rounded text-[9px] font-semibold transition flex items-center justify-center gap-0.5 ${
                            isMaintenance
                              ? 'bg-rose-600 text-white font-bold'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                          title={isMaintenance ? 'Tandai Selesai Servis' : 'Tandai Rusak/Perbaikan'}
                        >
                          <Wrench className="w-2.5 h-2.5" /> {isMaintenance ? 'Beres' : 'Servis'}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeletingLockerNumber(locker.number)}
                          className="py-1 px-1 bg-zinc-800 hover:bg-rose-500/30 text-zinc-400 hover:text-rose-300 rounded text-[9px] font-semibold transition flex items-center justify-center gap-0.5"
                          title="Hapus Loker Ini"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: INPUT LOKER SATUAN */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'add-single' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto space-y-6 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Input Loker Baru (Satuan)</h3>
                <p className="text-xs text-zinc-400">Tambahkan 1 unit loker fisik ke database gym.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
            >
              Kembali ke Daftar
            </button>
          </div>

          <form onSubmit={handleSaveSingleLocker} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Nomor Loker Fisik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={singleForm.number}
                  onChange={(e) => handleSingleNumberChange(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold outline-none focus:border-amber-500"
                  placeholder="e.g. 31"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Nomor unik identitas lemari loker.
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Label / Kode Kunci Loker
                </label>
                <input
                  type="text"
                  required
                  value={singleForm.label}
                  onChange={(e) => setSingleForm({ ...singleForm, label: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none focus:border-amber-500"
                  placeholder="e.g. P-31, W-16, VIP-01"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Teks yang tertera pada gantungan kunci loker.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Zona / Gender Kamar Ganti <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pria', 'Wanita', 'Semua'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleSingleGenderChange(g)}
                      className={`py-2 px-3 rounded-xl font-bold text-center border transition ${
                        singleForm.gender === g
                          ? g === 'Pria'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                            : g === 'Wanita'
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-sm'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Status Operasional Awal
                </label>
                <select
                  value={singleForm.status}
                  onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="Tersedia">Tersedia (Siap Digunakan)</option>
                  <option value="Perbaikan">Perbaikan / Rusak (Tidak Aktif)</option>
                  <option value="VIP">VIP (Khusus Member Tertentu)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1.5">
                Lokasi / Zona Penempatan
              </label>
              <input
                type="text"
                value={singleForm.location}
                onChange={(e) => setSingleForm({ ...singleForm, location: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                placeholder="e.g. Ruang Loker Pria - Lantai 1 Dekat Shower"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1.5">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                rows={2}
                value={singleForm.notes}
                onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-amber-500 resize-none"
                placeholder="Catatan gembok, duplikat kunci, atau info khusus lainnya..."
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Check className="w-4 h-4" />
                Simpan Loker Baru
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: BATCH GENERATOR (INPUT BANYAK LOKER) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'batch-generate' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto space-y-6 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Batch Generator Loker Sekaligus</h3>
                <p className="text-xs text-zinc-400">
                  Otomatis buat 10, 20, hingga 50 loker baru dalam sekali klik tanpa input manual satu per satu.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
            >
              Kembali ke Daftar
            </button>
          </div>

          <form onSubmit={handleExecuteBatch} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Mulai Dari Nomor Loker <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={batchForm.startNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, startNumber: parseInt(e.target.value) || 1 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Jumlah Loker Yang Dibuat (Count) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={batchForm.count}
                  onChange={(e) => setBatchForm({ ...batchForm, count: parseInt(e.target.value) || 1 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Rentang nomor yang akan dibuat: #{batchForm.startNumber} s/d #{batchForm.startNumber + batchForm.count - 1}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Awalan Label (Prefix)
                </label>
                <input
                  type="text"
                  value={batchForm.prefix}
                  onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none focus:border-amber-500"
                  placeholder="e.g. P-, W-, LK-, VIP-"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Zona Gender
                </label>
                <select
                  value={batchForm.gender}
                  onChange={(e) => {
                    const g = e.target.value as any;
                    const pfx = g === 'Wanita' ? 'W-' : g === 'Pria' ? 'P-' : 'L-';
                    setBatchForm({ ...batchForm, gender: g, prefix: pfx });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="Pria">Pria (Male)</option>
                  <option value="Wanita">Wanita (Female)</option>
                  <option value="Semua">Semua / Unisex</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Status Default
                </label>
                <select
                  value={batchForm.status}
                  onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1.5">
                Lokasi Default
              </label>
              <input
                type="text"
                value={batchForm.location}
                onChange={(e) => setBatchForm({ ...batchForm, location: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                placeholder="e.g. Ruang Ganti Pria Lantai 1"
              />
            </div>

            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchForm.padZero}
                  onChange={(e) => setBatchForm({ ...batchForm, padZero: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                />
                <span className="text-zinc-300 font-semibold">Format 2 Digit Angka (e.g. 01, 02, ... 15)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchForm.overwriteExisting}
                  onChange={(e) => setBatchForm({ ...batchForm, overwriteExisting: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                />
                <span className="text-zinc-300 font-semibold">
                  Timpa jika nomor sudah ada sebelumnya (Skip jika tidak dicentang)
                </span>
              </label>
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-amber-500/20 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Contoh Pratinjau Loker Yang Akan Dihasilkan:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.from({ length: Math.min(batchForm.count, 8) }).map((_, i) => {
                  const num = batchForm.startNumber + i;
                  const numStr = batchForm.padZero && num < 100 ? String(num).padStart(2, '0') : String(num);
                  return (
                    <span
                      key={num}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-[11px]"
                    >
                      #{num} ({batchForm.prefix}{numStr})
                    </span>
                  );
                })}
                {batchForm.count > 8 && (
                  <span className="px-2 py-1 text-zinc-500 text-[11px] font-mono">
                    ... dan {batchForm.count - 8} lainnya
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Generate {batchForm.count} Loker Sekarang
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT DETAIL LOKER */}
      {/* ------------------------------------------------------------- */}
      {editingLocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Loker #{editingLocker.number}</h3>
                  <p className="text-xs text-zinc-400">Perbarui label, lokasi, atau status ketersediaan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLocker(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLocker} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Nomor Loker</label>
                  <input
                    type="number"
                    disabled
                    value={editingLocker.number}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-400 font-mono font-bold cursor-not-allowed"
                  />
                  <span className="text-[10px] text-zinc-500">Nomor ID fisik permanen</span>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Label / Kode Kunci</label>
                  <input
                    type="text"
                    required
                    value={editingLocker.label || ''}
                    onChange={(e) => setEditingLocker({ ...editingLocker, label: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Zona Gender</label>
                  <select
                    value={editingLocker.gender}
                    onChange={(e) => setEditingLocker({ ...editingLocker, gender: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                    <option value="Semua">Semua / Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Status Operasional</label>
                  <select
                    value={editingLocker.status || (editingLocker.isOccupied ? 'Terpakai' : 'Tersedia')}
                    onChange={(e) => {
                      const st = e.target.value as any;
                      setEditingLocker({
                        ...editingLocker,
                        status: st,
                        isOccupied: st === 'Terpakai' ? editingLocker.isOccupied : st === 'Perbaikan' ? false : editingLocker.isOccupied
                      });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="Tersedia">Tersedia (Kosong)</option>
                    <option value="Terpakai">Sedang Terpakai</option>
                    <option value="Perbaikan">Dalam Perbaikan / Rusak</option>
                    <option value="VIP">VIP Khusus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Lokasi / Penempatan</label>
                <input
                  type="text"
                  value={editingLocker.location || ''}
                  onChange={(e) => setEditingLocker({ ...editingLocker, location: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  placeholder="e.g. Lantai 1 Dekat Pintu Masuk"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Catatan Khusus</label>
                <textarea
                  rows={2}
                  value={editingLocker.notes || ''}
                  onChange={(e) => setEditingLocker({ ...editingLocker, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 resize-none"
                  placeholder="Catatan gembok atau kondisi..."
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingLocker(null)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PENYERAHAN KUNCI MANUAL (ASSIGN KEY) */}
      {/* ------------------------------------------------------------- */}
      {assignModal.isOpen && assignModal.locker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Serahkan Kunci Loker #{assignModal.locker.number}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Zona {assignModal.locker.gender} ({assignModal.locker.label})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModal({ ...assignModal, isOpen: false, locker: null })}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignKeySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Pilih Member Penerima Kunci <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignModal.selectedMemberId}
                  onChange={(e) => setAssignModal({ ...assignModal, selectedMemberId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="">-- Pilih Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id}) {m.gender ? `• ${m.gender === 'P' ? 'Wanita' : 'Pria'}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  Jaminan Kunci (Titipan)
                </label>
                <select
                  value={assignModal.depositItem}
                  onChange={(e) => setAssignModal({ ...assignModal, depositItem: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="KTP">KTP Asli</option>
                  <option value="SIM">SIM Asli</option>
                  <option value="Kartu Member">Kartu Fisik Member</option>
                  <option value="Kunci Motor / Mobil">Kunci Kendaraan</option>
                  <option value="Tanpa Jaminan">Tanpa Jaminan (Member Regular Terpercaya)</option>
                </select>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignModal.hasTowel}
                    onChange={(e) => setAssignModal({ ...assignModal, hasTowel: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <span className="text-zinc-200 font-bold">Sertakan Peminjaman Handuk Bersih (+Handuk)</span>
                </label>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={assignModal.notes}
                  onChange={(e) => setAssignModal({ ...assignModal, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  placeholder="e.g. Member menitipkan helm di resepsionis"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAssignModal({ ...assignModal, isOpen: false, locker: null })}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Serahkan Kunci Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI HAPUS LOKER */}
      {/* ------------------------------------------------------------- */}
      {deletingLockerNumber !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hapus Loker #{deletingLockerNumber}?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Loker ini akan dihapus dari sistem. Pastikan loker dalam keadaan kosong dan kunci fisik sudah diamankan.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingLockerNumber(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deletingLockerNumber)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
              >
                Ya, Hapus Loker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

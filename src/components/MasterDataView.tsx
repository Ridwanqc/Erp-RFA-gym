import React, { useState, useMemo } from 'react';
import { Users, Plus, IdCard, Eye, PenTool, Trash2, Camera, ShieldCheck, FileText, CheckCircle2, Upload, Download, X, Search, Filter, ArrowUpDown, RotateCcw, FileSpreadsheet, Lock, Unlock, Building2 } from 'lucide-react';
import { Member, User, UserRole, ALL_BRANCHES_ID } from '../types';
import { APP_TODAY } from '../utils/formatters';
import { IdentityCardModal } from './IdentityCardModal';
import { DataImportModal } from './DataImportModal';
import { DataExportModal } from './DataExportModal';
import { PicPasswordModal } from './PicPasswordModal';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_PIC_PROTECTION } from '../data/settingsData';
import { OfficialIdCardSection } from './OfficialIdCardSection';

interface MasterDataViewProps {
  members: Member[];
  staffUsers: User[];
  currentUser?: User | null;
  onOpenMemberDetail: (member: Member) => void;
  onOpenIDCard: (member: Member) => void;
  onSaveMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onSaveStaff: (staff: User) => void;
  onDeleteStaff: (staffId: string) => void;
  onImportMembers?: (members: Member[], mode: 'merge' | 'skip_existing' | 'generate_new') => void;
  onImportStaff?: (staff: User[], mode: 'merge' | 'skip_existing' | 'generate_new') => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  members,
  staffUsers,
  currentUser,
  onOpenMemberDetail,
  onOpenIDCard,
  onSaveMember,
  onDeleteMember,
  onSaveStaff,
  onDeleteStaff,
  onImportMembers,
  onImportStaff,
  showToast
}) => {
  const { settings, branches, activeBranchId, isAllBranches } = useSettings();
  const defaultBranchId = activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.id || 'BR-001') : activeBranchId;
  const [personBranchId, setPersonBranchId] = useState<string>(defaultBranchId);
  const [allowedBranchIds, setAllowedBranchIds] = useState<string[]>([defaultBranchId]);
  const picProtection = settings?.picProtection || DEFAULT_PIC_PROTECTION;
  const [isPicPasswordModalOpen, setIsPicPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'member' | 'staff'>('member');

  // Import & Export Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [importExportTarget, setImportExportTarget] = useState<'member' | 'staff'>('member');

  // Search & Filter State
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [memberSortBy, setMemberSortBy] = useState<'name-asc' | 'name-desc' | 'id-asc' | 'expired-asc' | 'expired-desc'>('name-asc');

  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('all');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState('');

  // Common fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [photoUrl, setPhotoUrl] = useState('');

  // Identity Card fields
  const [idType, setIdType] = useState<'KTP' | 'SIM' | 'Paspor' | 'Kartu Pelajar'>('KTP');
  const [idNumber, setIdNumber] = useState('');
  const [idPhoto, setIdPhoto] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Identity card inspector modal
  const [selectedIdPerson, setSelectedIdPerson] = useState<(Member | User) | null>(null);
  const [idPersonType, setIdPersonType] = useState<'member' | 'staff'>('member');
  const [isIdCardViewerOpen, setIsIdCardViewerOpen] = useState(false);

  // Staff specific
  const [accId, setAccId] = useState('');
  const [password, setPassword] = useState('123');
  const [staffRole, setStaffRole] = useState<UserRole>('kasir');

  // Member specific
  const [memberPicId, setMemberPicId] = useState('');
  const [isPicLocked, setIsPicLocked] = useState(false);

  const openAddModal = () => {
    setIsEditMode(false);
    setTargetId((activeTab === 'member' ? 'M' : 'S') + String(Math.floor(100 + Math.random() * 900)));
    setName('');
    setPhone('');
    setGender('L');
    setPhotoUrl('');
    setIdType('KTP');
    setIdNumber('');
    setIdPhoto('');
    setAddress('');
    setBirthDate('');
    setEmergencyContact('');
    setAccId('');
    setPassword('123');
    setStaffRole('kasir');
    setMemberPicId('');
    setIsPicLocked(false);
    const defBranch = currentUser?.role === 'admin_cabang' && currentUser.branchId
      ? currentUser.branchId
      : (activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.id || 'BR-001') : activeBranchId);
    setPersonBranchId(defBranch);
    setAllowedBranchIds([defBranch]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Member | User) => {
    setIsEditMode(true);
    setTargetId(item.id);
    setName(item.name);
    setPhone(item.phone || '');
    setGender(item.gender || 'L');
    setPhotoUrl(item.photo || '');
    setIdType(item.idType || 'KTP');
    setIdNumber(item.idNumber || '');
    setIdPhoto(item.idPhoto || '');
    setAddress(item.address || '');
    setBirthDate(item.birthDate || '');
    setEmergencyContact(item.emergencyContact || '');

    const defBranch = item.branchId || (branches[0]?.id || 'BR-001');
    setPersonBranchId(defBranch);
    if ('allowedBranchIds' in item && item.allowedBranchIds && item.allowedBranchIds.length > 0) {
      setAllowedBranchIds(item.allowedBranchIds);
    } else {
      setAllowedBranchIds([defBranch]);
    }

    if ('role' in item) {
      // Staff
      setAccId(item.accId);
      setPassword(item.password);
      setStaffRole(item.role);
    } else {
      // Member
      setMemberPicId(item.picId);
      setIsPicLocked(Boolean(item.picId));
    }
    setIsModalOpen(true);
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhotoUrl(url);
    }
  };

  const handleIdPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setIdPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalPhoto =
      photoUrl ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop`;

    if (activeTab === 'member') {
      if (!memberPicId) {
        showToast('Peringatan', 'Silakan pilih staf PIC penanggung jawab member terlebih dahulu.', 'warning');
        return;
      }
      const picObj = staffUsers.find((s) => s.id === memberPicId);
      const targetBranch = branches.find((b) => b.id === personBranchId) || branches[0];
      const memberData: Member = {
        id: targetId,
        name: name.trim(),
        phone: phone.trim(),
        gender,
        photo: finalPhoto,
        branchId: targetBranch?.id || 'BR-001',
        branchName: targetBranch?.name || 'Cabang Utama',
        expired: isEditMode
          ? members.find((m) => m.id === targetId)?.expired || APP_TODAY
          : APP_TODAY,
        ptQuota: isEditMode ? members.find((m) => m.id === targetId)?.ptQuota || 0 : 0,
        picId: picObj ? picObj.id : 'S01',
        picName: picObj ? picObj.name : 'Admin',
        isPicLocked: true,
        followUpStatus: isEditMode
          ? members.find((m) => m.id === targetId)?.followUpStatus || 'BELUM DIHUBUNGI'
          : 'BELUM DIHUBUNGI',
        joinDate: isEditMode ? members.find((m) => m.id === targetId)?.joinDate || APP_TODAY : APP_TODAY,
        idType,
        idNumber: idNumber.trim() || undefined,
        idPhoto: idPhoto || undefined,
        address: address.trim() || undefined,
        birthDate: birthDate || undefined,
        emergencyContact: emergencyContact.trim() || undefined
      };

      onSaveMember(memberData);
      showToast('Data Member Disimpan', `Member ${name} (${targetBranch?.name}) berhasil ${isEditMode ? 'diperbarui' : 'didaftarkan'} lengkap dengan data identitas.`, 'success');
    } else {
      const roleName =
        staffRole === 'admin'
          ? 'System Admin (HQ)'
          : staffRole === 'admin_cabang'
          ? 'Admin Unit Cabang'
          : staffRole === 'kasir'
          ? 'Kasir & Front Desk'
          : staffRole === 'leader_pt'
          ? 'Leader PT'
          : 'Pelatih PT';

      const targetBranch = branches.find((b) => b.id === personBranchId) || branches[0];
      const staffData: User = {
        id: targetId,
        accId: accId || name.toLowerCase().replace(/\s+/g, '_'),
        name: name.trim(),
        phone: phone.trim(),
        gender,
        password: password || '123',
        photo: finalPhoto,
        role: staffRole,
        roleName,
        shift: 'Pagi',
        baseSalary: staffRole === 'kasir' ? 3500000 : 5000000,
        branchId: targetBranch?.id || 'BR-001',
        branchName: targetBranch?.name || 'Cabang Utama',
        allowedBranchIds: allowedBranchIds.length > 0 ? allowedBranchIds : [targetBranch?.id || 'BR-001'],
        idType,
        idNumber: idNumber.trim() || undefined,
        idPhoto: idPhoto || undefined,
        address: address.trim() || undefined,
        birthDate: birthDate || undefined,
        emergencyContact: emergencyContact.trim() || undefined
      };

      onSaveStaff(staffData);
      showToast('Data Staf Disimpan', `Karyawan ${name} (${targetBranch?.name}) berhasil ${isEditMode ? 'diperbarui' : 'didaftarkan'} lengkap dengan data identitas.`, 'success');
    }

    setIsModalOpen(false);
  };

  // Computed Member metrics & filtering
  const activeMembersCount = useMemo(() => {
    return members.filter((m) => new Date(m.expired + 'T00:00:00') >= new Date(APP_TODAY + 'T00:00:00')).length;
  }, [members]);

  const expiredMembersCount = useMemo(() => {
    return members.filter((m) => new Date(m.expired + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00')).length;
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const isExpired = new Date(m.expired + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');

        // Status Filter
        if (memberStatusFilter === 'active' && isExpired) return false;
        if (memberStatusFilter === 'expired' && !isExpired) return false;

        // Search Query
        if (memberSearchQuery.trim()) {
          const q = memberSearchQuery.toLowerCase().trim();
          const matchName = m.name.toLowerCase().includes(q);
          const matchId = m.id.toLowerCase().includes(q);
          const matchPhone = (m.phone || '').toLowerCase().includes(q);
          const matchIdNumber = (m.idNumber || '').toLowerCase().includes(q);
          const matchPic = (m.picId || '').toLowerCase().includes(q);
          const matchPicName = (m.picName || '').toLowerCase().includes(q);
          const matchNotes = (m.notes || '').toLowerCase().includes(q);
          const matchAddress = (m.address || '').toLowerCase().includes(q);

          if (!matchName && !matchId && !matchPhone && !matchIdNumber && !matchPic && !matchPicName && !matchNotes && !matchAddress) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        switch (memberSortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'id-asc':
            return a.id.localeCompare(b.id);
          case 'expired-asc':
            return a.expired.localeCompare(b.expired);
          case 'expired-desc':
            return b.expired.localeCompare(a.expired);
          default:
            return 0;
        }
      });
  }, [members, memberSearchQuery, memberStatusFilter, memberSortBy]);

  const filteredStaff = useMemo(() => {
    return staffUsers.filter((s) => {
      if (staffRoleFilter !== 'all' && s.role !== staffRoleFilter) return false;
      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        const matchRole = (s.roleName || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q);
        const matchIdNumber = (s.idNumber || '').toLowerCase().includes(q);
        const matchAcc = (s.accId || '').toLowerCase().includes(q);

        if (!matchName && !matchId && !matchRole && !matchPhone && !matchIdNumber && !matchAcc) {
          return false;
        }
      }
      return true;
    });
  }, [staffUsers, staffSearchQuery, staffRoleFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" /> Direktori Master Member & Staf
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manajemen Member 360, pencarian cepat, cetak digital ID pass card, dan database karyawan internal
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('member')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'member' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Member ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'staff' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Staf Internal ({staffUsers.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setImportExportTarget(activeTab);
                setIsExportModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 border border-zinc-700/80 shadow-sm"
              title={`Export Data ${activeTab === 'member' ? 'Member' : 'Karyawan'} (Excel / CSV)`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Export {activeTab === 'member' ? 'Member' : 'Karyawan'}
            </button>
            <button
              onClick={() => {
                setImportExportTarget(activeTab);
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 border border-zinc-700/80 shadow-sm"
              title={`Import Data ${activeTab === 'member' ? 'Member' : 'Karyawan'} (Excel / CSV)`}
            >
              <Upload className="w-3.5 h-3.5 text-orange-400" /> Import {activeTab === 'member' ? 'Member' : 'Karyawan'}
            </button>
            <button
              onClick={openAddModal}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Registrasi {activeTab === 'member' ? 'Member' : 'Staf'}
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR UNTUK MEMBER */}
      {activeTab === 'member' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-md">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Cari member: nama lengkap, ID (M..), no. HP/WhatsApp, no. KTP, paket gym..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-orange-500 transition"
              />
              {memberSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMemberSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center bg-zinc-950 border border-zinc-700/80 rounded-2xl px-3 py-2 text-xs text-white">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
              <select
                value={memberSortBy}
                onChange={(e: any) => setMemberSortBy(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer pr-2 text-xs font-semibold"
              >
                <option value="name-asc" className="bg-zinc-900 text-white">Nama: A - Z</option>
                <option value="name-desc" className="bg-zinc-900 text-white">Nama: Z - A</option>
                <option value="id-asc" className="bg-zinc-900 text-white">ID Member (M...)</option>
                <option value="expired-asc" className="bg-zinc-900 text-white">Expired Terdekat</option>
                <option value="expired-desc" className="bg-zinc-900 text-white">Expired Terjauh</option>
              </select>
            </div>
          </div>

          {/* Filter Pills & Result Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-800 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[11px] font-bold text-zinc-500 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" /> Status:
              </span>
              <button
                type="button"
                onClick={() => setMemberStatusFilter('all')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                  memberStatusFilter === 'all'
                    ? 'bg-zinc-200 text-black shadow-sm font-black'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Semua ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setMemberStatusFilter('active')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                  memberStatusFilter === 'active'
                    ? 'bg-emerald-500 text-white shadow-sm font-black'
                    : 'bg-zinc-950 text-emerald-400/80 hover:text-emerald-300 border border-zinc-800'
                }`}
              >
                Aktif ({activeMembersCount})
              </button>
              <button
                type="button"
                onClick={() => setMemberStatusFilter('expired')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                  memberStatusFilter === 'expired'
                    ? 'bg-rose-500 text-white shadow-sm font-black'
                    : 'bg-zinc-950 text-rose-400/80 hover:text-rose-300 border border-zinc-800'
                }`}
              >
                Expired ({expiredMembersCount})
              </button>
            </div>

            <div className="text-[11px] text-zinc-400">
              Menampilkan <strong className="text-white font-bold">{filteredMembers.length}</strong> dari <strong className="text-zinc-300">{members.length}</strong> member
              {memberSearchQuery && (
                <span className="ml-1 text-orange-400">
                  untuk kata kunci &ldquo;{memberSearchQuery}&rdquo;
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR UNTUK STAF */}
      {activeTab === 'staff' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="Cari staf: nama karyawan, ID staf, role/jabatan, username akun..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-orange-500 transition"
              />
              {staffSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStaffSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-400">Posisi:</span>
              <select
                value={staffRoleFilter}
                onChange={(e) => setStaffRoleFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-700/80 rounded-2xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="all">Semua Posisi ({staffUsers.length})</option>
                <option value="admin">Administrator</option>
                <option value="kasir">Kasir</option>
                <option value="leader_pt">Leader PT</option>
                <option value="pt">Personal Trainer (PT)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: MEMBER 360 CARDS GRID */}
      {activeTab === 'member' && (
        filteredMembers.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Tidak ada member ditemukan</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md">
                {memberSearchQuery
                  ? `Tidak ada member yang cocok dengan kata kunci pencarian "${memberSearchQuery}".`
                  : 'Tidak ada member yang cocok dengan filter status yang dipilih.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMemberSearchQuery('');
                setMemberStatusFilter('all');
              }}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 mt-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((m) => {
            const isExpired = new Date(m.expired + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');

            return (
              <div
                key={m.id}
                className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:border-orange-500/50 transition group flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`h-16 ${
                      isExpired
                        ? 'bg-gradient-to-r from-rose-600/30 to-zinc-900'
                        : 'bg-gradient-to-r from-emerald-600/30 to-zinc-900'
                    } p-3 flex justify-end`}
                  >
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border h-fit ${
                        isExpired
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {isExpired ? 'EXPIRED' : 'AKTIF'}
                    </span>
                  </div>

                  <div className="px-5 pb-4 -mt-8 relative">
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="w-16 h-16 rounded-2xl object-cover border-4 border-zinc-900 shadow-md mb-3"
                    />

                    <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition truncate">
                      {m.name}
                    </h4>
                    <p className="text-[10px] font-mono text-orange-400 font-bold tracking-wider mt-0.5">{m.id}</p>

                    <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1.5 text-xs">
                      {/* Identity Card Badge */}
                      <div className="flex items-center justify-between text-[11px] bg-zinc-950/70 px-2.5 py-1.5 rounded-xl border border-zinc-800/70">
                        <span className="text-zinc-400 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-orange-400" />
                          {m.idType || 'KTP'}:
                        </span>
                        <span className="font-mono font-bold text-zinc-200 truncate max-w-[120px]" title={m.idNumber || 'Belum diinput'}>
                          {m.idNumber || <span className="text-zinc-500 font-normal italic">Belum diinput</span>}
                        </span>
                      </div>

                      {/* Branch Badge */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-orange-400" />
                          <span>Cabang:</span>
                        </span>
                        <span className="font-semibold text-zinc-300 truncate max-w-[130px]" title={m.branchName || 'Cabang Utama'}>
                          {m.branchName || 'Cabang Utama'}
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Exp Date:</span>
                        <span className={`font-semibold ${isExpired ? 'text-rose-400' : 'text-zinc-300'}`}>
                          {m.expired}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Sisa Kuota PT:</span>
                        <span className="font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded">
                          {m.ptQuota} Sesi
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => onOpenMemberDetail(m)}
                    className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Detail 360
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIdPerson(m);
                      setIdPersonType('member');
                      setIsIdCardViewerOpen(true);
                    }}
                    title="Lihat Dokumen Kartu Identitas Resmi"
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-xl transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenIDCard(m)}
                    title="Cetak ID Pass Member"
                    className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl transition"
                  >
                    <IdCard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(m)}
                    title="Edit Data"
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus data member ${m.name}?`)) {
                        onDeleteMember(m.id);
                        showToast('Member Dihapus', `Data ${m.name} telah dihapus.`, 'info');
                      }
                    }}
                    title="Hapus"
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* VIEW 2: STAFF TABLE */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER BAR UNTUK STAF */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-md">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  placeholder="Cari karyawan: nama lengkap, ID (S..), role, no. HP/WhatsApp, username..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-orange-500 transition"
                />
                {staffSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStaffSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Role Dropdown Filter */}
              <div className="flex items-center bg-zinc-950 border border-zinc-700/80 rounded-2xl px-3 py-2 text-xs text-white">
                <Filter className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="bg-transparent text-white outline-none cursor-pointer pr-2 text-xs font-semibold"
                >
                  <option value="all" className="bg-zinc-900 text-white">Semua Posisi ({staffUsers.length})</option>
                  <option value="admin" className="bg-zinc-900 text-white">System Admin</option>
                  <option value="kasir" className="bg-zinc-900 text-white">Kasir & Front Desk</option>
                  <option value="leader_pt" className="bg-zinc-900 text-white">Leader PT</option>
                  <option value="pt" className="bg-zinc-900 text-white">Pelatih PT</option>
                  <option value="teknisi" className="bg-zinc-900 text-white">Teknisi</option>
                </select>
              </div>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                <span className="text-[11px] font-bold text-zinc-500 mr-1 shrink-0">Filter Posisi:</span>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('all')}
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition shrink-0 ${
                    staffRoleFilter === 'all'
                      ? 'bg-zinc-200 text-black shadow-sm font-black'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Semua ({staffUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('pt')}
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition shrink-0 ${
                    staffRoleFilter === 'pt'
                      ? 'bg-orange-500 text-white shadow-sm font-black'
                      : 'bg-zinc-950 text-orange-400 hover:text-orange-300 border border-zinc-800'
                  }`}
                >
                  Pelatih PT ({staffUsers.filter((s) => s.role === 'pt').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('kasir')}
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition shrink-0 ${
                    staffRoleFilter === 'kasir'
                      ? 'bg-emerald-500 text-white shadow-sm font-black'
                      : 'bg-zinc-950 text-emerald-400 hover:text-emerald-300 border border-zinc-800'
                  }`}
                >
                  Kasir / Front Desk ({staffUsers.filter((s) => s.role === 'kasir').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('admin_cabang')}
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition shrink-0 ${
                    staffRoleFilter === 'admin_cabang'
                      ? 'bg-teal-500 text-white shadow-sm font-black'
                      : 'bg-zinc-950 text-teal-400 hover:text-teal-300 border border-zinc-800'
                  }`}
                >
                  Admin Cabang ({staffUsers.filter((s) => s.role === 'admin_cabang').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('admin')}
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition shrink-0 ${
                    staffRoleFilter === 'admin'
                      ? 'bg-purple-500 text-white shadow-sm font-black'
                      : 'bg-zinc-950 text-purple-400 hover:text-purple-300 border border-zinc-800'
                  }`}
                >
                  Super Admin HQ ({staffUsers.filter((s) => s.role === 'admin').length})
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 font-medium">
                Menampilkan <strong className="text-white">{filteredStaff.length}</strong> dari {staffUsers.length} karyawan
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <table className="w-full text-left whitespace-nowrap min-w-[760px]">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Foto</th>
                  <th className="py-3 px-4">Nama Staf & ID</th>
                  <th className="py-3 px-4">Role & Posisi</th>
                  <th className="py-3 px-4">Cabang Penugasan</th>
                  <th className="py-3 px-4">Kartu Identitas (KTP)</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Search className="w-6 h-6 text-zinc-600" />
                        <p className="font-semibold text-zinc-400">Tidak ada staf ditemukan</p>
                        <p className="text-[11px] text-zinc-500">
                          {staffSearchQuery
                            ? `Tidak ada data staf yang cocok dengan pencarian "${staffSearchQuery}".`
                            : 'Tidak ada data staf untuk filter posisi ini.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-4 text-center">
                      <img
                        src={s.photo}
                        alt={s.name}
                        className="w-10 h-10 rounded-xl object-cover mx-auto border border-zinc-700 shadow-sm"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white text-sm">{s.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{s.id}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                        {s.roleName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{s.branchName || 'Cabang Utama'}</span>
                        </div>
                        {s.allowedBranchIds && s.allowedBranchIds.length > 1 && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded font-mono">
                            Akses: {s.allowedBranchIds.length} Outlet
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-zinc-950/80 border border-zinc-800 px-2.5 py-1 rounded-xl font-mono text-[11px] font-semibold text-zinc-300">
                          {s.idNumber || <span className="text-zinc-500 italic">Belum diisi</span>}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedIdPerson(s);
                            setIdPersonType('staff');
                            setIsIdCardViewerOpen(true);
                          }}
                          title="Lihat Berkas Identitas Karyawan"
                          className="p-1.5 text-zinc-400 hover:text-orange-400 rounded-lg hover:bg-zinc-800 transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-zinc-800 px-2.5 py-1 rounded-xl text-zinc-300 font-semibold text-xs">
                        Shift {s.shift}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {currentUser?.role === 'admin_cabang' && s.role === 'admin' ? (
                        <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg font-bold inline-block">
                          🔒 Akun HQ
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(s)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus staf ${s.name}?`)) {
                                onDeleteStaff(s.id);
                                showToast('Staf Dihapus', `Data ${s.name} telah dihapus.`, 'info');
                              }
                            }}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT DATA MASTER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 my-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                {isEditMode ? 'Edit' : 'Registrasi'} {activeTab === 'member' ? 'Member Baru' : 'Staf Internal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo selector */}
              <div className="flex justify-center mb-2">
                <div className="text-center">
                  <label className="cursor-pointer relative group inline-block">
                    <img
                      src={photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                      alt="Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-zinc-700 shadow-md group-hover:border-orange-500 transition"
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">
                      <Camera className="w-5 h-5" />
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
                  </label>
                  <span className="block text-[10px] text-zinc-400 mt-1 font-medium">Foto Profil / Wajah</span>
                </div>
              </div>

              {/* Data Utama */}
              <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-2xl space-y-3">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Informasi Akun & Kontak
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      ID
                    </label>
                    <input
                      type="text"
                      value={targetId}
                      readOnly
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 font-mono font-bold text-center outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Nama lengkap sesuai identitas..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      No WhatsApp / Telepon *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="0812xxxx"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    >
                      <option value="L">Laki-Laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* Branch Selection (Multi-Branch ERP) */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>{activeTab === 'member' ? 'Cabang / Home Outlet Member *' : 'Penugasan Cabang Utama *'}</span>
                  </label>
                  {currentUser?.role !== 'admin' ? (
                    <div className="w-full bg-zinc-950/80 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                          {branches.find((b) => b.id === (currentUser?.branchId || personBranchId))?.code || 'CAB'}
                        </span>
                        <span className="font-bold">
                          {branches.find((b) => b.id === (currentUser?.branchId || personBranchId))?.name || 'Unit Cabang Anda'}
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/40">
                        🔒 Terkunci Unit
                      </span>
                    </div>
                  ) : (
                    <select
                      value={personBranchId}
                      onChange={(e) => setPersonBranchId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-medium"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          [{b.code}] {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {activeTab === 'member' ? (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        PIC Sales (Penanggung Jawab Member) <span className="text-orange-400">*</span>
                      </label>
                      {memberPicId && (
                        <div className="flex items-center gap-1.5">
                          {isPicLocked ? (
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
                              if (isPicLocked) {
                                const isProtected = picProtection.requirePasswordToChangePic && (picProtection.requirePasswordOnMemberForm !== false);
                                const canBypass = (currentUser?.role === 'admin' || currentUser?.role === 'manager') && picProtection.allowAdminBypass;

                                if (isProtected && !canBypass) {
                                  setIsPicPasswordModalOpen(true);
                                } else {
                                  setIsPicLocked(false);
                                  showToast('Kunci PIC Dibuka 🔓', 'Anda sekarang dapat memilih atau mengganti staf PIC.', 'info');
                                }
                              } else {
                                setIsPicLocked(true);
                                showToast('PIC Dikunci 🔒', 'Pilihan PIC berhasil dikunci.', 'info');
                              }
                            }}
                            className="text-[10px] text-zinc-400 hover:text-amber-400 font-semibold underline transition ml-1"
                            title={isPicLocked ? 'Buka kunci untuk mengganti PIC' : 'Kunci pilihan PIC'}
                          >
                            {isPicLocked ? 'Buka Kunci' : 'Kunci PIC'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        value={memberPicId}
                        disabled={isPicLocked && Boolean(memberPicId)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMemberPicId(val);
                          if (val) {
                            setIsPicLocked(true);
                            const chosen = staffUsers.find((s) => s.id === val);
                            showToast('PIC Terpilih & Terkunci 🔒', `${chosen?.name || 'Staff'} telah dipilih dan otomatis dikunci.`, 'success');
                          }
                        }}
                        required
                        className={`w-full border rounded-xl px-3 py-2 text-xs outline-none transition ${
                          isPicLocked && memberPicId
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 cursor-not-allowed opacity-95 font-medium'
                            : 'bg-zinc-900 border-zinc-700 text-white focus:border-orange-500'
                        }`}
                      >
                        <option value="">-- Pilih PIC Penanggung Jawab --</option>
                        {staffUsers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.roleName}) {s.shift ? `• Shift ${s.shift}` : ''}
                          </option>
                        ))}
                      </select>
                      {isPicLocked && memberPicId && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {isPicLocked && memberPicId ? (
                      <p className="text-[10px] text-amber-400/90 flex items-center gap-1.5 pt-0.5">
                        <Lock className="w-3 h-3 shrink-0 text-amber-400" />
                        <span>PIC <strong>{staffUsers.find((s) => s.id === memberPicId)?.name}</strong> telah dikunci saat input member agar tidak berubah. Klik <em>Buka Kunci</em> jika ingin mengganti.</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-500 pt-0.5">
                        Pilih staf penanggung jawab member. Pilihan PIC otomatis dikunci saat dipilih.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Role / Posisi
                      </label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                      >
                        {currentUser?.role !== 'admin_cabang' && (
                          <option value="admin">System Admin (HQ Pusat)</option>
                        )}
                        <option value="admin_cabang">Admin Unit Cabang</option>
                        <option value="kasir">Kasir & Front Desk</option>
                        <option value="leader_pt">Leader PT</option>
                        <option value="pt">Pelatih PT</option>
                        <option value="teknisi">Teknisi & Maintenance</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Username Login
                        </label>
                        <input
                          type="text"
                          value={accId}
                          onChange={(e) => setAccId(e.target.value)}
                          placeholder="Cth: admin_2"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Sandi Login
                        </label>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Default 123"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      {currentUser?.role === 'admin_cabang' ? (
                        <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                            <span className="font-bold text-xs">Penugasan Unit Kerja:</span>
                            <span className="text-white font-extrabold">{branches.find((b) => b.id === (currentUser.branchId || personBranchId))?.name || 'Unit Cabang Anda'}</span>
                          </div>
                          <p className="text-[10px] text-teal-400/80">
                            Sebagai Admin Cabang, wewenang Anda dikunci khusus untuk mendaftarkan dan mengelola staf di unit Anda sendiri.
                          </p>
                        </div>
                      ) : (
                        <>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Hak Akses Cabang (Multi-Branch Permission)</span>
                            <span className="text-[10px] text-orange-400 font-normal">
                              {allowedBranchIds.length === branches.length ? 'Semua Cabang' : `${allowedBranchIds.length} Cabang`}
                            </span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            {branches.map((b) => {
                              const isChecked = allowedBranchIds.includes(b.id);
                              return (
                                <label
                                  key={b.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition text-xs ${
                                    isChecked
                                      ? 'bg-orange-500/10 border border-orange-500/30 text-white font-medium'
                                      : 'hover:bg-zinc-800 text-zinc-400 border border-transparent'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setAllowedBranchIds([...allowedBranchIds, b.id]);
                                      } else {
                                        if (allowedBranchIds.length > 1) {
                                          setAllowedBranchIds(allowedBranchIds.filter((id) => id !== b.id));
                                        } else {
                                          showToast('Peringatan', 'Minimal harus memilih satu cabang yang diizinkan.', 'warning');
                                        }
                                      }
                                    }}
                                    className="accent-orange-500 rounded"
                                  />
                                  <span className="truncate">[{b.code}] {b.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* SEKSI KHUSUS: DATA KARTU IDENTITAS RESMI DENGAN CLIENT-SIDE OCR (TESSERACT.JS) */}
              <OfficialIdCardSection
                value={{
                  jenisIdentitas: idType,
                  nomorIdentitas: idNumber,
                  tanggalLahir: birthDate,
                  kontakDarurat: emergencyContact,
                  alamatDomisili: address,
                  fotoIdentitas: idPhoto
                }}
                onChange={(updated) => {
                  setIdType(updated.jenisIdentitas);
                  setIdNumber(updated.nomorIdentitas);
                  setBirthDate(updated.tanggalLahir);
                  setEmergencyContact(updated.kontakDarurat);
                  setAddress(updated.alamatDomisili);
                  setIdPhoto(updated.fotoIdentitas || '');
                }}
                onAutoFillName={(detectedName) => {
                  if (!name.trim()) {
                    setName(detectedName);
                  }
                }}
                showToast={showToast}
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IDENTITY CARD VIEWER & PRINT */}
      <IdentityCardModal
        isOpen={isIdCardViewerOpen}
        onClose={() => setIsIdCardViewerOpen(false)}
        person={selectedIdPerson}
        type={idPersonType}
        onEdit={(person) => {
          setIsIdCardViewerOpen(false);
          openEditModal(person);
        }}
      />

      {/* MODAL: IMPORT DATA (EXCEL & CSV) */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type={importExportTarget}
        existingMembers={members}
        existingStaff={staffUsers}
        onImportComplete={(importedItems, mode) => {
          if (importExportTarget === 'member') {
            if (onImportMembers) {
              onImportMembers(importedItems as Member[], mode);
            } else {
              (importedItems as Member[]).forEach((m) => onSaveMember(m));
              showToast('Import Selesai', `Berhasil mengimpor ${importedItems.length} data member.`, 'success');
            }
          } else {
            if (onImportStaff) {
              onImportStaff(importedItems as User[], mode);
            } else {
              (importedItems as User[]).forEach((s) => onSaveStaff(s));
              showToast('Import Selesai', `Berhasil mengimpor ${importedItems.length} data karyawan.`, 'success');
            }
          }
        }}
        showToast={showToast}
      />

      {/* MODAL: EXPORT DATA (EXCEL & CSV) */}
      <DataExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type={importExportTarget}
        allItems={importExportTarget === 'member' ? members : staffUsers}
        filteredItems={importExportTarget === 'member' ? filteredMembers : filteredStaff}
        filterLabel={
          importExportTarget === 'member'
            ? `${memberStatusFilter !== 'all' ? `Status: ${memberStatusFilter.toUpperCase()} ` : ''}${memberSearchQuery ? `Pencarian: "${memberSearchQuery}"` : ''}`
            : `${staffRoleFilter !== 'all' ? `Posisi: ${staffRoleFilter} ` : ''}${staffSearchQuery ? `Pencarian: "${staffSearchQuery}"` : ''}`
        }
        showToast={showToast}
      />

      {/* MODAL: VERIFIKASI PASSWORD OTORISASI GANTI PIC */}
      <PicPasswordModal
        isOpen={isPicPasswordModalOpen}
        onClose={() => setIsPicPasswordModalOpen(false)}
        onSuccess={() => {
          setIsPicLocked(false);
          showToast('Kunci PIC Dibuka 🔓', 'Otorisasi berhasil. Anda sekarang dapat memilih atau mengganti staf PIC.', 'success');
        }}
        currentStaffName={staffUsers.find((s) => s.id === memberPicId)?.name}
        currentUser={currentUser}
        showToast={showToast}
      />
    </div>
  );
};

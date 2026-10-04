import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  Calendar,
  Briefcase,
  ShieldCheck,
  Building,
  UserCheck,
  CheckCircle2,
  Eye,
  Mail,
  MapPin,
  Download,
  Upload
} from 'lucide-react';
import { User, ShiftType, getStaffDivision } from '../../types';
import { formatRp, APP_TODAY } from '../../utils/formatters';
import { DataImportModal } from '../DataImportModal';
import { DataExportModal } from '../DataExportModal';

interface StaffDirectoryTabProps {
  staffUsers: User[];
  onSaveStaff: (user: User, isNew: boolean) => void;
  onDeleteStaff: (id: string) => void;
  onImportStaff?: (staff: User[], mode: 'merge' | 'skip_existing' | 'generate_new') => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const StaffDirectoryTab: React.FC<StaffDirectoryTabProps> = ({
  staffUsers,
  onSaveStaff,
  onDeleteStaff,
  onImportStaff,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Form states
  const [formId, setFormId] = useState('');
  const [formAccId, setFormAccId] = useState('');
  const [formPassword, setFormPassword] = useState('123');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'kasir' | 'pt' | 'leader_pt'>('pt');
  const [formRoleName, setFormRoleName] = useState('Pelatih PT');
  const [formDivision, setFormDivision] = useState('Pelatihan');
  const [formShift, setFormShift] = useState<ShiftType>('Pagi');
  const [formBaseSalary, setFormBaseSalary] = useState<number>(3500000);
  const [formAllowance, setFormAllowance] = useState<number>(500000);
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formPhone, setFormPhone] = useState('');
  const [formIdType, setFormIdType] = useState<'KTP' | 'SIM' | 'Paspor' | 'Kartu Pelajar'>('KTP');
  const [formIdNumber, setFormIdNumber] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('1995-01-01');
  const [formAddress, setFormAddress] = useState('');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formEmploymentStatus, setFormEmploymentStatus] = useState<'Tetap' | 'Kontrak' | 'Part-time' | 'Probation'>('Tetap');
  const [formJoinDate, setFormJoinDate] = useState(APP_TODAY);
  const [formLeaveQuota, setFormLeaveQuota] = useState<number>(12);
  const [formBankName, setFormBankName] = useState('BCA');
  const [formBankAccount, setFormBankAccount] = useState('');

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffUsers.filter((s) => {
      if (filterRole !== 'all' && s.role !== filterRole) return false;
      if (filterDivision !== 'all' && getStaffDivision(s) !== filterDivision) return false;
      if (filterStatus !== 'all' && (s.employmentStatus || 'Tetap') !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchRole = s.roleName.toLowerCase().includes(q);
        const matchDiv = getStaffDivision(s).toLowerCase().includes(q);
        const matchPhone = (s.phone || '').includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchDiv && !matchPhone && !matchId) return false;
      }
      return true;
    });
  }, [staffUsers, filterRole, filterDivision, filterStatus, searchQuery]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    const nextNum = staffUsers.length + 1;
    const nextId = `S${nextNum < 10 ? '0' + nextNum : nextNum}`;
    setFormId(nextId);
    setFormAccId(`staff_${nextNum}`);
    setFormPassword('123');
    setFormName('');
    setFormRole('pt');
    setFormRoleName('Pelatih PT');
    setFormDivision('Pelatihan');
    setFormShift('Pagi');
    setFormBaseSalary(3500000);
    setFormAllowance(500000);
    setFormGender('L');
    setFormPhone('');
    setFormIdType('KTP');
    setFormIdNumber('');
    setFormBirthDate('1995-01-01');
    setFormAddress('');
    setFormEmergencyContact('');
    setFormPhoto('');
    setFormEmploymentStatus('Tetap');
    setFormJoinDate(APP_TODAY);
    setFormLeaveQuota(12);
    setFormBankName('BCA');
    setFormBankAccount('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: User) => {
    setEditingStaff(staff);
    setFormId(staff.id);
    setFormAccId(staff.accId);
    setFormPassword(staff.password || '123');
    setFormName(staff.name);
    setFormRole(staff.role as any);
    setFormRoleName(staff.roleName);
    setFormDivision(staff.division || getStaffDivision(staff));
    setFormShift((staff.shift as ShiftType) || 'Pagi');
    setFormBaseSalary(staff.baseSalary || 3500000);
    setFormAllowance(staff.allowance || 500000);
    setFormGender(staff.gender || 'L');
    setFormPhone(staff.phone || '');
    setFormIdType(staff.idType || 'KTP');
    setFormIdNumber(staff.idNumber || '');
    setFormBirthDate(staff.birthDate || '1995-01-01');
    setFormAddress(staff.address || '');
    setFormEmergencyContact(staff.emergencyContact || '');
    setFormPhoto(staff.photo || '');
    setFormEmploymentStatus(staff.employmentStatus || 'Tetap');
    setFormJoinDate(staff.joinDate || APP_TODAY);
    setFormLeaveQuota(staff.leaveQuota ?? 12);
    setFormBankName(staff.bankName || 'BCA');
    setFormBankAccount(staff.bankAccount || '');
    setIsModalOpen(true);
  };

  const handleRoleSelect = (role: 'admin' | 'kasir' | 'pt' | 'leader_pt') => {
    setFormRole(role);
    switch (role) {
      case 'admin':
        setFormRoleName('System Admin / Manager');
        setFormDivision('Manajemen');
        setFormBaseSalary(5000000);
        break;
      case 'kasir':
        setFormRoleName('Kasir & Front Desk');
        setFormDivision('Kasir & Front Desk');
        setFormBaseSalary(3500000);
        break;
      case 'leader_pt':
        setFormRoleName('Leader PT');
        setFormDivision('Pelatihan');
        setFormBaseSalary(4500000);
        break;
      case 'pt':
      default:
        setFormRoleName('Pelatih PT');
        setFormDivision('Pelatihan');
        setFormBaseSalary(3000000);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Peringatan', 'Nama karyawan wajib diisi.', 'warning');
      return;
    }

    const updatedUser: User = {
      id: formId,
      accId: formAccId,
      name: formName,
      role: formRole,
      roleName: formRoleName,
      division: formDivision,
      shift: formShift,
      baseSalary: Number(formBaseSalary) || 0,
      allowance: Number(formAllowance) || 0,
      password: formPassword,
      photo:
        formPhoto ||
        (formGender === 'L'
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'),
      gender: formGender,
      phone: formPhone,
      idType: formIdType,
      idNumber: formIdNumber,
      birthDate: formBirthDate,
      address: formAddress,
      emergencyContact: formEmergencyContact,
      employmentStatus: formEmploymentStatus,
      joinDate: formJoinDate,
      leaveQuota: Number(formLeaveQuota) || 12,
      bankName: formBankName,
      bankAccount: formBankAccount
    };

    onSaveStaff(updatedUser, !editingStaff);
    showToast(
      'Berhasil',
      `Data profil karyawan ${formName} berhasil ${editingStaff ? 'diperbarui' : 'ditambahkan'}.`,
      'success'
    );
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. FILTER & ACTION BAR */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, NIK, ID atau nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Filters and New Staff Button */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="all">Semua Posisi ({staffUsers.length})</option>
            <option value="admin">Admin / Manager</option>
            <option value="kasir">Kasir & Front Desk</option>
            <option value="leader_pt">Leader PT</option>
            <option value="pt">Pelatih PT</option>
          </select>

          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 font-medium"
          >
            <option value="all">Semua Devisi</option>
            <option value="Kasir & Front Desk">Devisi Kasir & Front Desk</option>
            <option value="Pelatihan">Devisi Pelatihan (PT & Coach)</option>
            <option value="Manajemen">Devisi Manajemen</option>
            <option value="Teknisi">Devisi Teknisi</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="all">Semua Status</option>
            <option value="Tetap">Karyawan Tetap</option>
            <option value="Kontrak">Kontrak</option>
            <option value="Part-time">Part-time</option>
          </select>

          {/* View toggle */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-zinc-800 shadow-sm"
            title="Export Data Karyawan (Excel / CSV)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Karyawan
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-zinc-800 shadow-sm"
            title="Import Data Karyawan (Excel / CSV)"
          >
            <Upload className="w-3.5 h-3.5 text-orange-400" /> Import Karyawan
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Karyawan Baru
          </button>
        </div>
      </div>

      {/* 2. DIRECTORY VIEW: GRID MODE */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-5 relative overflow-hidden transition group shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Header: Photo & Role Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="relative">
                    <img
                      src={staff.photo}
                      alt={staff.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-800 shadow"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-zinc-950 text-orange-400 border border-zinc-800 rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold">
                      {staff.id}
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-block bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {staff.roleName}
                    </span>
                    <div>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md ${
                        getStaffDivision(staff) === 'Kasir & Front Desk'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : getStaffDivision(staff) === 'Pelatihan'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      }`}>
                        Devisi: {getStaffDivision(staff)}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      Status: <strong className="text-zinc-300">{staff.employmentStatus || 'Tetap'}</strong>
                    </p>
                  </div>
                </div>

                {/* Name & Contact */}
                <div className="mt-3.5">
                  <h4 className="text-sm font-black text-white">{staff.name}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-zinc-500" />
                    {staff.phone ? (
                      <a
                        href={`https://wa.me/${staff.phone.replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-emerald-400 transition"
                      >
                        {staff.phone}
                      </a>
                    ) : (
                      'Belum terdaftar'
                    )}
                  </p>
                </div>

                {/* Details Pill grid */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Shift Utama</span>
                    <span className="font-bold text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded">
                      Shift {staff.shift || 'Pagi'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Gaji Pokok</span>
                    <span className="font-bold text-white font-mono">{formatRp(staff.baseSalary || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Sisa Cuti Tahunan</span>
                    <span className="font-bold text-emerald-400 font-mono">{staff.leaveQuota ?? 12} Hari</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Bank Transfer</span>
                    <span className="text-zinc-300 font-mono text-[10px]">
                      {staff.bankName || 'BCA'} {staff.bankAccount ? `(${staff.bankAccount})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(staff)}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3 h-3" /> Edit Profil
                </button>
                {staff.id !== 'S01' && (
                  <button
                    onClick={() => {
                      if (confirm(`Yakin ingin menonaktifkan atau menghapus karyawan ${staff.name}?`)) {
                        onDeleteStaff(staff.id);
                      }
                    }}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition"
                    title="Hapus Karyawan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 3. DIRECTORY VIEW: TABLE LIST MODE */
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <table className="w-full text-left whitespace-nowrap min-w-[900px]">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Karyawan</th>
                  <th className="py-3 px-4">Posisi / Role</th>
                  <th className="py-3 px-4">Kontak (WhatsApp)</th>
                  <th className="py-3 px-4">Shift Utama</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Gaji Pokok</th>
                  <th className="py-3 px-4 text-center">Sisa Cuti</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={staff.photo}
                          alt={staff.name}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{staff.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">ID: {staff.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-zinc-200">{staff.roleName}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                        getStaffDivision(staff) === 'Kasir & Front Desk'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : getStaffDivision(staff) === 'Pelatihan'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      }`}>
                        {getStaffDivision(staff)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">{staff.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        Shift {staff.shift || 'Pagi'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px]">
                        {staff.employmentStatus || 'Tetap'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{formatRp(staff.baseSalary || 0)}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      {staff.leaveQuota ?? 12} Hari
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
                          title="Edit Karyawan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {staff.id !== 'S01' && (
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus ${staff.name}?`)) {
                                onDeleteStaff(staff.id);
                              }
                            }}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL: ADD / EDIT STAFF PROFILE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl p-6 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                {editingStaff ? `Edit Profil Karyawan: ${editingStaff.name}` : 'Tambah Karyawan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              {/* Posisi & ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">ID Karyawan</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Username Login</label>
                  <input
                    type="text"
                    value={formAccId}
                    onChange={(e) => setFormAccId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Password</label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Nama Lengkap & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-bold mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              {/* Role, Devisi & Posisi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Role Sistem</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleSelect(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="kasir">Kasir & Front Desk</option>
                    <option value="pt">Pelatih PT</option>
                    <option value="leader_pt">Leader PT</option>
                    <option value="admin">System Admin / Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5 flex items-center justify-between">
                    <span>Devisi Organisasi</span>
                    <span className="text-[9px] text-orange-400 font-normal">Tupoksi Resmi</span>
                  </label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="Kasir & Front Desk">Devisi Kasir & Front Desk (Layanan & POS)</option>
                    <option value="Pelatihan">Devisi Pelatihan (PT & Coach)</option>
                    <option value="Manajemen">Devisi Manajemen & Operasional</option>
                    <option value="Teknisi">Devisi Teknisi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Nama Jabatan Resmi</label>
                  <input
                    type="text"
                    value={formRoleName}
                    onChange={(e) => setFormRoleName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Status Kepegawaian & Shift Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Status Kepegawaian</label>
                  <select
                    value={formEmploymentStatus}
                    onChange={(e) => setFormEmploymentStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs"
                  >
                    <option value="Tetap">Karyawan Tetap</option>
                    <option value="Kontrak">Kontrak (PKWT)</option>
                    <option value="Part-time">Part-time / Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Shift Utama Default</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="Pagi">Shift Pagi (06:00 - 14:00)</option>
                    <option value="Siang">Shift Siang (10:00 - 18:00)</option>
                    <option value="Malam">Shift Malam (14:00 - 22:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Tanggal Bergabung</label>
                  <input
                    type="date"
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Finansial: Gaji Pokok & Tunjangan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Gaji Pokok Bulanan (Rp)</label>
                  <input
                    type="number"
                    value={formBaseSalary}
                    onChange={(e) => setFormBaseSalary(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Tunjangan Transport & Makan (Rp)</label>
                  <input
                    type="number"
                    value={formAllowance}
                    onChange={(e) => setFormAllowance(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Hak Cuti Tahunan (Hari)</label>
                  <input
                    type="number"
                    value={formLeaveQuota}
                    onChange={(e) => setFormLeaveQuota(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Data Rekening Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Nama Bank</label>
                  <input
                    type="text"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    placeholder="BCA / Mandiri / BNI"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Nomor Rekening</label>
                  <input
                    type="text"
                    value={formBankAccount}
                    onChange={(e) => setFormBankAccount(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Kontak & Identitas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">NIK / No. KTP</label>
                  <input
                    type="text"
                    value={formIdNumber}
                    onChange={(e) => setFormIdNumber(e.target.value)}
                    placeholder="317101..."
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Alamat & Kontak Darurat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Alamat domisili staf"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Kontak Darurat (Nama & No HP)</label>
                  <input
                    type="text"
                    value={formEmergencyContact}
                    onChange={(e) => setFormEmergencyContact(e.target.value)}
                    placeholder="Contoh: Dewi (Istri) - 081211112222"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              {/* Foto Profil URL */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">URL Foto Profil</label>
                <input
                  type="text"
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl shadow-md transition"
                >
                  {editingStaff ? 'Simpan Perubahan Karyawan' : 'Daftarkan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: IMPORT KARYAWAN (EXCEL & CSV) */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="staff"
        existingMembers={[]}
        existingStaff={staffUsers}
        onImportComplete={(importedItems, mode) => {
          if (onImportStaff) {
            onImportStaff(importedItems as User[], mode);
          } else {
            (importedItems as User[]).forEach((s) => onSaveStaff(s, true));
            showToast('Import Selesai', `Berhasil mengimpor ${importedItems.length} data karyawan.`, 'success');
          }
        }}
        showToast={showToast}
      />

      {/* MODAL: EXPORT KARYAWAN (EXCEL & CSV) */}
      <DataExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="staff"
        allItems={staffUsers}
        filteredItems={filteredStaff}
        filterLabel={`${filterRole !== 'all' ? `Role: ${filterRole} ` : ''}${searchQuery ? `Pencarian: "${searchQuery}"` : ''}`}
        showToast={showToast}
      />
    </div>
  );
};

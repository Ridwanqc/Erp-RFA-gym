import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Edit2,
  Trash2,
  Star,
  ExternalLink,
  Users,
  Layers,
  Info,
  Check,
  Building,
  ArrowRight,
  MessageCircle,
  FileSpreadsheet
} from 'lucide-react';
import { GymBranch, User as AppUser } from '../types';
import { useSettings } from '../context/SettingsContext';
import { AddBranchModal } from './AddBranchModal';
import {
  BranchWhatsAppVerificationModal,
  validateIndonesianWhatsApp
} from './BranchWhatsAppVerificationModal';

interface BranchManagementViewProps {
  currentUser: AppUser | null;
  showToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const BranchManagementView: React.FC<BranchManagementViewProps> = ({
  currentUser,
  showToast
}) => {
  const {
    branches,
    activeBranchId,
    activeBranch,
    addBranch,
    updateBranch,
    deleteBranch,
    setActiveBranchId,
    setMainBranch
  } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Aktif' | 'Renovasi' | 'Nonaktif'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<GymBranch | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Filtered branches
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.managerName && b.managerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (branch: GymBranch) => {
    setEditingBranch(branch);
    setIsAddModalOpen(true);
  };

  const handleSaveBranch = (data: Omit<GymBranch, 'id' | 'createdAt'> & { id?: string }) => {
    if (editingBranch) {
      updateBranch(editingBranch.id, data);
      if (showToast) {
        showToast('Cabang Diperbarui', `Informasi cabang ${data.name} berhasil diperbarui.`, 'success');
      }
    } else {
      const created = addBranch(data);
      if (showToast) {
        showToast(
          'Cabang Baru Ditambahkan',
          `Cabang ${created.name} (${created.code}) telah terdaftar dalam sistem.`,
          'success'
        );
      }
    }
  };

  const handleSwitchActive = (branch: GymBranch) => {
    setActiveBranchId(branch.id);
    if (showToast) {
      showToast(
        'Sesi Cabang Diubah',
        `Sistem kini beroperasi di bawah profil cabang "${branch.name}". Struk kasir & kop dokumen otomatis disesuaikan.`,
        'info'
      );
    }
  };

  const handleSetMain = (branch: GymBranch) => {
    setMainBranch(branch.id);
    if (showToast) {
      showToast(
        'Cabang Utama Ditetapkan',
        `"${branch.name}" sekarang menjadi Kantor Pusat (HQ) resmi.`,
        'success'
      );
    }
  };

  const handleDelete = (id: string) => {
    const result = deleteBranch(id);
    setDeleteConfirmId(null);
    if (showToast) {
      showToast(
        result.success ? 'Berhasil Dihapus' : 'Gagal Menghapus',
        result.message,
        result.success ? 'success' : 'warning'
      );
    }
  };

  // Stats calculation
  const totalBranches = branches.length;
  const activeCount = branches.filter((b) => b.status === 'Aktif').length;
  const totalCapacity = branches.reduce((sum, b) => sum + (b.capacity || 0), 0);
  const mainBranch = branches.find((b) => b.isMainBranch) || branches[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-2xl shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Manajemen Cabang & Outlet
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Multi-Branch ERP
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Kelola seluruh outlet gym, tetapkan kantor pusat (HQ), konfigurasi jam operasional, kontak kasir, serta ganti cabang operasional aktif dengan mudah.
              </p>
            </div>
          </div>

          {/* Action Buttons: Verifikasi WA & Tambah Cabang */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs border border-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
              title="Verifikasi keabsahan nomor WhatsApp resmi unit cabang dan ekspor ke CSV / Clipboard"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Verifikasi & Ekspor Kontak WA</span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 shrink-0 cursor-pointer justify-center active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Cabang Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Cabang</span>
          </p>
          <p className="text-2xl font-black text-white tracking-tight">{totalBranches} Outlet</p>
          <p className="text-[11px] text-zinc-500">{activeCount} beroperasi aktif</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Kantor Pusat (HQ)</span>
          </p>
          <p className="text-sm font-bold text-white truncate">{mainBranch?.name || 'Cabang Utama'}</p>
          <p className="text-[11px] text-amber-400 font-mono">Kode: {mainBranch?.code || 'KGD'}</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Kapasitas Simultan</span>
          </p>
          <p className="text-2xl font-black text-white tracking-tight">{totalCapacity} Member</p>
          <p className="text-[11px] text-zinc-500">Kapasitas total semua outlet</p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sesi Aktif Saat Ini</span>
          </p>
          <p className="text-sm font-black text-white truncate">{activeBranch?.name}</p>
          <p className="text-[10px] text-emerald-300 font-medium">Struk & transaksi mencatat outlet ini</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama cabang, kode, kota, manager..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['All', 'Aktif', 'Renovasi', 'Nonaktif'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {st === 'All' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBranches.map((branch) => {
          const isActiveSession = branch.id === activeBranchId;
          return (
            <div
              key={branch.id}
              className={`rounded-3xl border overflow-hidden flex flex-col transition-all duration-200 bg-zinc-900/90 ${
                isActiveSession
                  ? 'border-emerald-500 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                  : 'border-zinc-800 hover:border-zinc-700 shadow-sm'
              }`}
            >
              {/* Photo Banner */}
              <div className="h-40 relative overflow-hidden bg-zinc-950">
                <img
                  src={
                    branch.photo ||
                    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80'
                  }
                  alt={branch.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                        branch.status === 'Aktif'
                          ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                          : branch.status === 'Renovasi'
                          ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                          : 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                      }`}
                    >
                      {branch.status}
                    </span>

                    {/* Main Branch Flag */}
                    {branch.isMainBranch && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center gap-1 backdrop-blur-md">
                        <Star className="w-2.5 h-2.5 fill-amber-300" />
                        <span>KANTOR PUSAT</span>
                      </span>
                    )}
                  </div>

                  {/* Branch Code */}
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-950/80 text-white font-mono text-[10px] font-bold border border-zinc-700">
                    {branch.code}
                  </span>
                </div>

                {/* Active Session Badge (Bottom right of image) */}
                {isActiveSession && (
                  <div className="absolute bottom-2.5 right-3 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>SESI AKTIF SAAT INI</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-start justify-between gap-2">
                    <span>{branch.name}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                    <span>
                      {branch.address}, <strong className="text-zinc-300">{branch.city}</strong>
                    </span>
                  </p>
                </div>

                {/* Info List */}
                <div className="space-y-2 text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      <span>Telepon / WA</span>
                    </span>
                    <span className="font-semibold text-zinc-200">{branch.whatsapp || branch.phone}</span>
                  </div>

                  {branch.managerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        <span>Branch Manager</span>
                      </span>
                      <span className="font-semibold text-emerald-400">{branch.managerName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Jam Buka Weekday</span>
                    </span>
                    <span className="text-zinc-300 font-mono text-[11px]">{branch.openHoursWeekday}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      <span>Kapasitas Member</span>
                    </span>
                    <span className="text-zinc-200 font-bold">{branch.capacity || 150} Member</span>
                  </div>
                </div>

                {/* Facilities Tags */}
                {branch.facilities && branch.facilities.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Fasilitas Unggulan:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {branch.facilities.slice(0, 4).map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-[10px] text-zinc-300"
                        >
                          {fac}
                        </span>
                      ))}
                      {branch.facilities.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-lg bg-zinc-800/50 text-[10px] text-zinc-400">
                          +{branch.facilities.length - 4} lagi
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Switch session button */}
                    {!isActiveSession ? (
                      <button
                        type="button"
                        onClick={() => handleSwitchActive(branch)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Jadikan Cabang Aktif</span>
                      </button>
                    ) : (
                      <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cabang Terpilih</span>
                      </div>
                    )}

                    {/* Edit Button */}
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(branch)}
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition border border-zinc-700 cursor-pointer"
                        title="Edit Informasi Cabang"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete button or Set HQ */}
                    {isSuperAdmin && !branch.isMainBranch && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(branch.id)}
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition border border-zinc-700 hover:border-rose-500/30 cursor-pointer"
                        title="Hapus Cabang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Set as HQ button if not yet */}
                  {isSuperAdmin && !branch.isMainBranch && (
                    <button
                      type="button"
                      onClick={() => handleSetMain(branch)}
                      className="w-full py-1.5 text-[11px] text-zinc-400 hover:text-amber-400 font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3 h-3" />
                      <span>Tetapkan sebagai Kantor Pusat (HQ)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBranches.length === 0 && (
        <div className="p-12 text-center bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-3">
          <Building2 className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">Tidak Ada Cabang Ditemukan</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Tidak ada cabang yang cocok dengan kata kunci pencarian atau filter status yang dipilih.
          </p>
        </div>
      )}

      {/* Info Guidelines */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-2.5 text-xs">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Panduan Operasional Multi-Cabang GymPro Enterprise</span>
        </h4>
        <ul className="space-y-1.5 text-zinc-400 leading-relaxed pl-5 list-disc">
          <li>
            <strong className="text-zinc-200">Kop Struk POS & Invoice:</strong> Mengubah cabang aktif akan secara otomatis menyesuaikan nama outlet, alamat, kota, dan nomor telepon yang tercetak pada struk thermal kasir.
          </li>
          <li>
            <strong className="text-zinc-200">Hak Akses Role:</strong> Super Administrator dan Manager dapat menambah atau mengedit profil cabang. Kasir dapat memilih cabang aktif sesuai penugasan shift kerja harian.
          </li>
          <li>
            <strong className="text-zinc-200">Kantor Pusat (HQ):</strong> Cabang yang ditandai sebagai Kantor Pusat menjadi acuan default legalitas NPWP, registrasi Google Sheets, dan akun perbankan utama.
          </li>
        </ul>
      </div>

      {/* Add / Edit Branch Modal */}
      <AddBranchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveBranch}
        initialData={editingBranch}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Hapus Cabang?</h4>
                <p className="text-xs text-zinc-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus outlet cabang ini dari sistem? Pastikan tidak ada transaksi kasir yang sedang berjalan di cabang ini.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                Ya, Hapus Cabang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Verifikasi & Ekspor Kontak WhatsApp Cabang */}
      <BranchWhatsAppVerificationModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        branches={branches}
        onUpdateBranch={updateBranch}
        showToast={showToast}
      />
    </div>
  );
};

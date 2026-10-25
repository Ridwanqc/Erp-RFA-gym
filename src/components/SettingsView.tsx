import React, { useState, useRef } from 'react';
import {
  Printer,
  ShieldCheck,
  Building2,
  CreditCard,
  MessageSquare,
  Database,
  Save,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Wifi,
  Bluetooth,
  Usb,
  FileText,
  Sliders,
  Users,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Info,
  ChevronRight,
  UserCheck,
  PhoneCall,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Lock,
  Unlock,
  Key,
  KeyRound,
  ShieldAlert,
  Palette,
  Moon,
  Sun,
  Monitor,
  Grid,
  CircleDot,
  Layers,
  Copy,
  Receipt,
  Image as ImageIcon,
  Flame,
  Crown,
  Globe
} from 'lucide-react';
import {
  User,
  UserRole,
  PrinterPaperWidth,
  PrinterConnectionType,
  BankAccountConfig,
  RoleActionPermissions,
  Transaction
} from '../types';
import { useSettings } from '../context/SettingsContext';
import { ReceiptModal } from './ReceiptModal';
import {
  useTheme,
  THEME_MODE_OPTIONS,
  ACCENT_OPTIONS,
  THEME_PRESETS,
  ThemeMode,
  AccentColor,
  ContentDensity,
  BackgroundPattern
} from '../context/ThemeContext';
import { SYSTEM_MODULES, DEFAULT_PIC_PROTECTION, DEFAULT_GYM_PROFILE, DEFAULT_PRINTER_CONFIG } from '../data/settingsData';
import { formatRp, APP_TODAY } from '../utils/formatters';
import { BranchManagementView } from './BranchManagementView';
import {
  BranchWhatsAppVerificationModal,
  validateIndonesianWhatsApp
} from './BranchWhatsAppVerificationModal';
import { LandingSettingsView } from './landing/LandingSettingsView';

interface SettingsViewProps {
  currentUser: User | null;
  staffUsers: User[];
  onUpdateStaffRole?: (staffId: string, newRole: UserRole) => void;
  allSystemData?: any;
  onRestoreSystemData?: (data: any) => void;
  showToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  initialSubTab?: 'printer' | 'theme' | 'roles' | 'security' | 'profile' | 'branches' | 'finance' | 'templates' | 'backup' | 'landing';
  onNavigateToGoogleSheets?: () => void;
  onPreviewLanding?: () => void;
  onSubTabChange?: (subTab: SettingsSubTab) => void;
}

type SettingsSubTab = 'printer' | 'theme' | 'roles' | 'security' | 'profile' | 'branches' | 'finance' | 'templates' | 'backup' | 'landing';

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  staffUsers,
  onUpdateStaffRole,
  allSystemData,
  onRestoreSystemData,
  showToast,
  initialSubTab = 'printer',
  onNavigateToGoogleSheets,
  onPreviewLanding,
  onSubTabChange
}) => {
  const {
    settings,
    roles,
    branches,
    activeBranchId,
    activeBranch,
    updatePrinterConfig,
    updateProfileConfig,
    updatePaymentAndTaxConfig,
    updateTemplatesConfig,
    updatePicProtectionConfig,
    verifyPicPassword,
    updateRolePermission,
    saveRolePermissions,
    resetRolePermissionsToDefault,
    resetSettingsToDefault,
    executeTestPrint,
    updateBranch
  } = useSettings();

  const {
    theme,
    setMode,
    setAccent,
    setDensity,
    setPattern,
    applyPreset,
    resetTheme,
    currentAccent,
    openThemeModal
  } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsSubTab>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSelectTab = (tabId: SettingsSubTab) => {
    setActiveTab(tabId);
    if (onSubTabChange) {
      onSubTabChange(tabId);
    }
  };

  const [isBranchWaModalOpen, setIsBranchWaModalOpen] = useState(false);
  const [testReceiptTrx, setTestReceiptTrx] = useState<Transaction | null>(null);

  // PIC Security Password Form State
  const picProtection = settings.picProtection || DEFAULT_PIC_PROTECTION;
  const [newPicPassword, setNewPicPassword] = useState('');
  const [confirmPicPassword, setConfirmPicPassword] = useState('');
  const [showCurrentPicPass, setShowCurrentPicPass] = useState(false);
  const [showNewPicPass, setShowNewPicPass] = useState(false);

  // Test Password state
  const [testPasswordInput, setTestPasswordInput] = useState('');
  const [testPasswordResult, setTestPasswordResult] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Selected Role for Role Matrix Tab
  const [selectedRoleKey, setSelectedRoleKey] = useState<UserRole>('kasir');

  // Local state for adding bank account
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBank, setNewBank] = useState<BankAccountConfig>({
    id: '',
    bankName: 'Bank BCA',
    accountNumber: '',
    accountHolder: '',
    isDefault: false,
    notes: ''
  });

  // Search filter for modules in Role tab
  const [moduleSearch, setModuleSearch] = useState('');

  // Selected staff for role change
  const [staffRoleUpdates, setStaffRoleUpdates] = useState<Record<string, UserRole>>({});

  // Bluetooth / USB Connection Simulation Status
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(
    settings.printer.bluetoothDeviceName || 'POS-80-Thermal'
  );

  const isSuperAdmin = currentUser?.role === 'admin';

  // Logo Settings Form State & File Upload
  const [logoInputUrl, setLogoInputUrl] = useState(settings.profile.logoUrl || '');
  const [logoPreviewTab, setLogoPreviewTab] = useState<'card' | 'landing' | 'receipt'>('card');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Format File Tidak Sesuai', 'Harap unggah file gambar (PNG, JPG, SVG, atau WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('Ukuran File Melebihi Batas', 'Maksimal ukuran file logo adalah 5MB.', 'error');
      return;
    }

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateProfileConfig({ logoUrl: dataUrl });
        setLogoInputUrl(dataUrl);
        notifySuccess('Logo Berhasil Diterapkan', 'Logo perusahaan berhasil diunggah dan disimpan ke sistem.');
      }
      setIsUploadingLogo(false);
    };
    reader.onerror = () => {
      setIsUploadingLogo(false);
      if (showToast) showToast('Gagal Membaca File', 'Terjadi kesalahan teknis saat membaca file logo.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyLogoUrl = () => {
    const trimmed = logoInputUrl.trim();
    updateProfileConfig({ logoUrl: trimmed });
    if (trimmed) {
      notifySuccess('Logo Diperbarui', 'Tautan logo perusahaan berhasil disimpan dan disinkronkan.');
    } else {
      notifySuccess('Logo Dikosongkan', 'Logo direset ke ikon & brand standar.');
    }
  };

  const handleRemoveLogo = () => {
    updateProfileConfig({ logoUrl: '' });
    setLogoInputUrl('');
    notifySuccess('Logo Dihapus', 'Sistem kembali menggunakan logo bawaan resmi RFA GYM.');
  };

  const handleApplyPresetLogo = (presetUrl: string, name: string) => {
    updateProfileConfig({ logoUrl: presetUrl });
    setLogoInputUrl(presetUrl);
    notifySuccess('Preset Logo Diterapkan', `Logo berhasil diubah menjadi preset ${name}.`);
  };

  // Handle Save Feedback
  const notifySuccess = (title: string, msg: string) => {
    if (showToast) showToast(title, msg, 'success');
  };

  // -------------------------------------------------------------
  // PRINTER SETTING HANDLERS
  // -------------------------------------------------------------
  const handlePaperWidthChange = (width: PrinterPaperWidth) => {
    updatePrinterConfig({ paperWidth: width });
    notifySuccess('Ukuran Kertas Diperbarui', `Format struk diubah ke ${width.toUpperCase()}.`);
  };

  const handleConnectionTypeChange = (conn: PrinterConnectionType) => {
    updatePrinterConfig({ connectionType: conn });
    notifySuccess('Koneksi Printer Diperbarui', `Mode diubah ke ${conn.toUpperCase()}.`);
  };

  const handleScanDevices = () => {
    setIsScanningDevices(true);
    setTimeout(() => {
      setIsScanningDevices(false);
      setConnectedDevice('POS-Thermal-BT (Ready)');
      notifySuccess('Perangkat Ditemukan', 'Berhasil mendeteksi printer thermal terdekat.');
    }, 1500);
  };

  const handleOpenReceiptSimulation = () => {
    const mockTrx: Transaction = {
      id: `TRX-SIM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: APP_TODAY,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      customer: 'Akbar Hanif (Member VIP)',
      amount: 420000,
      amountPaid: 420000,
      amountRemaining: 0,
      type: 'POS',
      status: 'Paid',
      method: 'QRIS',
      cashier: 'Siti Kasir (Front Desk)',
      branchId: activeBranch?.id || 'BR-001',
      branchName: activeBranch?.name || settings.profile.branchName || 'Cabang Utama Flagship',
      desc: 'Penjualan Produk Fitness & Kafe POS',
      itemsJSON: JSON.stringify([
        { name: '1x Whey Protein Isolate RTD (Cokelat)', price: 70000, qty: 1, category: 'Supplement' },
        { name: '2x Pocari Sweat 500ml Can', price: 15000, qty: 2, category: 'Beverage' },
        { name: '1x Handuk Gym Microfiber Premium', price: 70000, qty: 1, category: 'Merchandise' },
        { name: '1x Daily Gym Visitor Pass', price: 250000, qty: 1, category: 'Access' }
      ])
    };
    setTestReceiptTrx(mockTrx);
    notifySuccess('Pratinjau Struk Kasir Dibuka', `Memuat ReceiptModal dengan format ${settings.printer.paperWidth.toUpperCase()}`);
  };

  // -------------------------------------------------------------
  // ROLE MATRIX HANDLERS
  // -------------------------------------------------------------
  const handleTogglePerm = (
    role: UserRole,
    moduleId: string,
    action: keyof RoleActionPermissions,
    currentVal: boolean
  ) => {
    updateRolePermission(role, moduleId, action, !currentVal);
  };

  const handleGrantAll = (role: UserRole) => {
    SYSTEM_MODULES.forEach((m) => {
      (['view', 'create', 'edit', 'delete', 'voidRefund', 'export'] as (keyof RoleActionPermissions)[]).forEach(
        (act) => {
          updateRolePermission(role, m.id, act, true);
        }
      );
    });
    notifySuccess('Hak Akses Diperbarui', `Semua izin diaktifkan untuk role ${role.toUpperCase()}.`);
  };

  const handleRevokeAll = (role: UserRole) => {
    SYSTEM_MODULES.forEach((m) => {
      (['view', 'create', 'edit', 'delete', 'voidRefund', 'export'] as (keyof RoleActionPermissions)[]).forEach(
        (act) => {
          updateRolePermission(role, m.id, act, false);
        }
      );
    });
    notifySuccess('Hak Akses Dibatasi', `Semua izin dinonaktifkan untuk role ${role.toUpperCase()}.`);
  };

  const handleResetRole = (role: UserRole) => {
    resetRolePermissionsToDefault(role);
    notifySuccess('Reset Role', `Hak akses ${role.toUpperCase()} dikembalikan ke standar bawaan.`);
  };

  const handleSaveRolePermissions = (role?: UserRole) => {
    saveRolePermissions(role);
    const targetRoleName = role ? roles[role]?.roleName || role.toUpperCase() : 'Semua Role';
    notifySuccess('Pengaturan Hak Akses Tersimpan', `Matriks hak akses untuk ${targetRoleName} berhasil disimpan.`);
  };

  const handleSaveStaffRole = (staffId: string) => {
    const newRole = staffRoleUpdates[staffId];
    if (newRole && onUpdateStaffRole) {
      onUpdateStaffRole(staffId, newRole);
      notifySuccess('Role Staf Diperbarui', `Role staf berhasil diubah ke ${newRole.toUpperCase()}.`);
    }
  };

  // -------------------------------------------------------------
  // BANK ACCOUNT HANDLERS
  // -------------------------------------------------------------
  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.accountNumber || !newBank.accountHolder) {
      if (showToast) showToast('Data Belum Lengkap', 'Nomor rekening dan pemilik wajib diisi.', 'warning');
      return;
    }
    const bankItem: BankAccountConfig = {
      ...newBank,
      id: 'BANK-' + Date.now().toString().slice(-4)
    };
    const updated = [...settings.paymentAndTax.bankAccounts, bankItem];
    updatePaymentAndTaxConfig({ bankAccounts: updated });
    setIsAddingBank(false);
    setNewBank({
      id: '',
      bankName: 'Bank BCA',
      accountNumber: '',
      accountHolder: '',
      isDefault: false,
      notes: ''
    });
    notifySuccess('Rekening Ditambahkan', `Rekening ${bankItem.bankName} berhasil disimpan.`);
  };

  const handleDeleteBank = (bankId: string) => {
    const updated = settings.paymentAndTax.bankAccounts.filter((b) => b.id !== bankId);
    updatePaymentAndTaxConfig({ bankAccounts: updated });
    notifySuccess('Rekening Dihapus', 'Rekening berhasil dihapus dari daftar transfer.');
  };

  const handleSetDefaultBank = (bankId: string) => {
    const updated = settings.paymentAndTax.bankAccounts.map((b) => ({
      ...b,
      isDefault: b.id === bankId
    }));
    updatePaymentAndTaxConfig({ bankAccounts: updated });
    notifySuccess('Rekening Utama', 'Rekening default transfer telah diperbarui.');
  };

  // -------------------------------------------------------------
  // PIC SECURITY & AUTHORIZATION PASSWORD HANDLERS
  // -------------------------------------------------------------
  const handleSaveNewPicPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPicPassword.trim()) {
      if (showToast) showToast('Password Kosong', 'Password otorisasi tidak boleh kosong.', 'warning');
      return;
    }
    if (newPicPassword !== confirmPicPassword) {
      if (showToast) showToast('Password Tidak Cocok', 'Konfirmasi password tidak sesuai dengan password baru.', 'error');
      return;
    }
    updatePicProtectionConfig({ picChangePassword: newPicPassword.trim() });
    setNewPicPassword('');
    setConfirmPicPassword('');
    notifySuccess('Password Otorisasi Disimpan 🔒', 'Password untuk otorisasi ganti PIC berhasil diperbarui.');
  };

  const handleResetPicPassword = () => {
    updatePicProtectionConfig({ picChangePassword: '123' });
    setNewPicPassword('');
    setConfirmPicPassword('');
    notifySuccess('Password Di-reset 🔄', 'Password otorisasi PIC dikembalikan ke default bawaan: 123');
  };

  const handleTestPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPasswordInput.trim()) return;
    const isValid = verifyPicPassword(testPasswordInput);
    setTestPasswordResult(isValid ? 'valid' : 'invalid');
  };

  // -------------------------------------------------------------
  // BACKUP & RESTORE HANDLERS
  // -------------------------------------------------------------
  const handleExportBackup = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      appName: 'GymPro Enterprise ERP',
      version: '2.5.0',
      settings,
      roles,
      appData: allSystemData || {}
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `GymPro_Backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    notifySuccess('Backup Berhasil Diunduh', 'File backup JSON berhasil disimpan ke komputer Anda.');
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.settings) {
          updatePrinterConfig(parsed.settings.printer || {});
          updateProfileConfig(parsed.settings.profile || {});
          updatePaymentAndTaxConfig(parsed.settings.paymentAndTax || {});
          updateTemplatesConfig(parsed.settings.templates || {});
          if (parsed.settings.picProtection) {
            updatePicProtectionConfig(parsed.settings.picProtection);
          }
        }
        if (parsed.appData && onRestoreSystemData) {
          onRestoreSystemData(parsed.appData);
        }
        notifySuccess('Data Berhasil Dipulihkan', 'Pengaturan dan database sistem berhasil dimuat dari backup.');
      } catch (err) {
        if (showToast) showToast('Gagal Membaca File', 'Format file backup JSON tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleCopyBranchWaSummary = () => {
    const lines = [
      `*DAFTAR KONTAK WHATSAPP RESMI UNIT CABANG RFA GYM*`,
      `Tanggal Pembaruan: ${APP_TODAY}`,
      `Total Cabang: ${branches.length} Outlet`,
      `--------------------------------------------------`,
      ...branches.map((b, idx) => {
        const val = validateIndonesianWhatsApp(b.whatsapp);
        return (
          `${idx + 1}. *${b.name}* [${b.code}]\n` +
          `   • Status: ${b.status} ${b.isMainBranch ? '(KANTOR PUSAT)' : ''}\n` +
          `   • No. WhatsApp Resmi: ${val.displayFormatted} (+${val.internationalNumber})\n` +
          `   • Link Chat Langsung: https://wa.me/${val.internationalNumber}\n` +
          `   • Alamat: ${b.address}, ${b.city}`
        );
      }),
      `--------------------------------------------------`,
      `Nomor WhatsApp di atas terintegrasi langsung dengan landing page reservasi online & pendaftaran calon member.`
    ];
    navigator.clipboard.writeText(lines.join('\n\n'));
    if (showToast) {
      showToast('Kontak Disalin', 'Seluruh kontak WhatsApp cabang berhasil disalin ke clipboard!', 'success');
    }
  };

  const handleExportBranchWaCsv = () => {
    const headers = [
      'ID Cabang',
      'Kode Cabang',
      'Nama Cabang',
      'Status Operasional',
      'Kantor Pusat',
      'Nomor WhatsApp Resmi',
      'Format WA Internasional',
      'Link Direct Chat WA',
      'Telepon Kantor',
      'Alamat Lengkap',
      'Kota',
      'Status Validasi WA'
    ];

    const rows = branches.map((b) => {
      const val = validateIndonesianWhatsApp(b.whatsapp);
      return [
        `"${b.id}"`,
        `"${b.code}"`,
        `"${b.name.replace(/"/g, '""')}"`,
        `"${b.status}"`,
        `"${b.isMainBranch ? 'Ya (HQ)' : 'Tidak'}"`,
        `"${b.whatsapp}"`,
        `"+${val.internationalNumber}"`,
        `"https://wa.me/${val.internationalNumber}"`,
        `"${b.phone || ''}"`,
        `"${b.address.replace(/"/g, '""')}"`,
        `"${b.city.replace(/"/g, '""')}"`,
        `"${val.isValid ? 'Terverifikasi' : 'Perlu Koreksi'}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kontak_WhatsApp_Resmi_Cabang_RFA_Gym_${APP_TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) {
      showToast('Export CSV Berhasil', `File CSV kontak WhatsApp cabang berhasil diunduh.`, 'success');
    }
  };

  // Filter modules
  const filteredModules = SYSTEM_MODULES.filter(
    (m) =>
      m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.desc.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const currentRoleDef = roles[selectedRoleKey] || roles.kasir;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Sliders className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Pengaturan Sistem & Konfigurasi
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  GymPro Admin Center
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Kelola printer thermal kasir, matriks hak akses role pengguna, profil cabang, pajak, dan data sistem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsBranchWaModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
              title="Verifikasi validitas nomor WhatsApp seluruh unit cabang dan ekspor ke CSV / Clipboard"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Verifikasi WA Cabang</span>
            </button>
            <button
              type="button"
              onClick={executeTestPrint}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-zinc-700 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Test Print Cepat</span>
            </button>
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Backup Data</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-zinc-800/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'printer', label: 'Printer & Struk POS', icon: Printer, badge: settings.printer.paperWidth },
            { id: 'landing', label: 'Landing Page (CMS)', icon: Globe, badge: 'Visual & Foto' },
            { id: 'theme', label: 'Tema & Tampilan', icon: Palette, badge: `${theme.mode}` },
            ...(!isSuperAdmin ? [] : [{ id: 'roles', label: 'Manajemen Role & Akses', icon: ShieldCheck, badge: 'RBAC' }]),
            { id: 'security', label: 'Keamanan & Password PIC', icon: KeyRound, badge: picProtection.requirePasswordToChangePic ? 'Aktif 🔒' : 'Off' },
            { id: 'branches', label: currentUser?.role === 'admin_cabang' ? 'Profil Unit Cabang' : 'Kelola Cabang & Outlet', icon: Building2, badge: currentUser?.role === 'admin_cabang' ? 'Unit Anda' : `${branches.length} Outlet` },
            ...(!isSuperAdmin ? [] : [{ id: 'profile', label: 'Profil Usaha HQ', icon: Sliders }]),
            { id: 'finance', label: 'Pajak & Rekening Kas', icon: CreditCard },
            { id: 'templates', label: 'Template Pesan WA', icon: MessageSquare },
            ...(!isSuperAdmin ? [] : [{ id: 'backup', label: 'Backup & Database', icon: Database }])
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`btn-settings-subtab-${tab.id}`}
                onClick={() => handleSelectTab(tab.id as SettingsSubTab)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-zinc-950/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-black/20 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB: PRINTER & STRUK KASIR                                        */}
      {/* ========================================================================= */}
      {activeTab === 'printer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Configurations */}
          <div className="lg:col-span-7 space-y-6">
            {/* Connection & Hardware Status */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Printer className="w-4 h-4 text-orange-400" />
                    1. Hardware & Antarmuka Printer
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Pilih metode komunikasi antara komputer kasir dan printer thermal.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Driver Aktif
                  </span>
                </div>
              </div>

              {/* Mode Selection Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    id: 'browser',
                    name: 'Browser Print',
                    desc: 'Standar Dialog OS',
                    icon: Printer
                  },
                  {
                    id: 'bluetooth',
                    name: 'Bluetooth',
                    desc: 'Thermal Nirkabel',
                    icon: Bluetooth
                  },
                  {
                    id: 'usb',
                    name: 'USB Direct',
                    desc: 'Kabel WebUSB POS',
                    icon: Usb
                  },
                  {
                    id: 'network',
                    name: 'LAN / WiFi',
                    desc: 'IP Ethernet ESC/POS',
                    icon: Wifi
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = settings.printer.connectionType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleConnectionTypeChange(item.id as PrinterConnectionType)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSel
                          ? 'bg-zinc-800 border-orange-500 ring-2 ring-orange-500/30'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isSel ? 'text-orange-400' : 'text-zinc-400'}`} />
                        {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detail fields based on connection */}
              {settings.printer.connectionType === 'network' && (
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">IP Address Printer</label>
                    <input
                      type="text"
                      value={settings.printer.printerIpAddress || ''}
                      onChange={(e) => updatePrinterConfig({ printerIpAddress: e.target.value })}
                      placeholder="Contoh: 192.168.1.200"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Port ESC/POS (Default: 9100)</label>
                    <input
                      type="number"
                      value={settings.printer.printerPort || 9100}
                      onChange={(e) => updatePrinterConfig({ printerPort: parseInt(e.target.value) || 9100 })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {settings.printer.connectionType === 'bluetooth' && (
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Bluetooth className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Perangkat Terpaut: {connectedDevice || 'Belum Terhubung'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Pastikan Bluetooth printer menyala dalam jarak &lt; 5 meter.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleScanDevices}
                    disabled={isScanningDevices}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningDevices ? 'animate-spin' : ''}`} />
                    <span>{isScanningDevices ? 'Memindai...' : 'Pindai Ulang'}</span>
                  </button>
                </div>
              )}

              {/* Format & Ukuran Kertas Thermal / Standar */}
              <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-200 block">
                      Format Kertas Printer & Struk Kasir
                    </label>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Pilih format roll thermal (58mm/80mm) atau kertas standar A4 untuk struk POS & invoice resmi.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Aktif: {settings.printer.paperWidth.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: '58mm',
                      name: '58 mm Thermal',
                      badge: '32 Kolom (Mini POS)',
                      desc: 'Printer Bluetooth / Mobile Kasir',
                      widthSpec: 'Lebar Kertas: 58mm • Area Cetak: 48mm',
                      icon: Receipt,
                      note: 'Hemat kertas roll mini, ringkas untuk booth/event.'
                    },
                    {
                      id: '80mm',
                      name: '80 mm Thermal',
                      badge: '48 Kolom (Standar POS)',
                      desc: 'Printer Desktop Kasir Gym Utama',
                      widthSpec: 'Lebar Kertas: 80mm • Area Cetak: 72mm',
                      icon: Printer,
                      note: 'Standar resmi POS kasir Epson TM-T82, Xprinter, Panda.'
                    },
                    {
                      id: 'a4',
                      name: 'A4 / Invoice',
                      badge: 'Lembar Penuh (Formal)',
                      desc: 'Printer Standar Inkjet/Laser & PDF',
                      widthSpec: 'Dimensi: 210 x 297 mm • Margin 12mm',
                      icon: FileText,
                      note: 'Kwitansi membership & faktur resmi bertanda tangan.'
                    }
                  ].map((size) => {
                    const isSel = settings.printer.paperWidth === size.id;
                    const Icon = size.icon;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => handlePaperWidthChange(size.id as PrinterPaperWidth)}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                          isSel
                            ? 'bg-zinc-800 border-orange-500 ring-2 ring-orange-500/40 shadow-lg shadow-orange-500/10'
                            : 'bg-zinc-950/70 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="p-2 rounded-xl bg-orange-500/15 text-orange-400">
                              <Icon className="w-4 h-4" />
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                isSel
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {size.badge}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-white">{size.name}</p>
                          <p className="text-[11px] text-orange-400 font-semibold mt-0.5">{size.desc}</p>
                          <p className="text-[10px] text-zinc-400 mt-1 leading-tight">{size.note}</p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-zinc-800/80 text-[9.5px] text-zinc-500 font-mono">
                          {size.widthSpec}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Proportional Width Visual Indicator */}
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">Perbandingan Skala Fisik Kertas:</span>
                    <span className="text-zinc-300 font-bold">
                      {settings.printer.paperWidth === '58mm'
                        ? 'Lebar Efektif: 48 mm (384 dots)'
                        : settings.printer.paperWidth === '80mm'
                        ? 'Lebar Efektif: 72 mm (576 dots)'
                        : 'Lebar Efektif: 185 mm (A4 Full Width)'}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden flex border border-zinc-800 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        settings.printer.paperWidth === '58mm'
                          ? 'w-[28%] bg-amber-500'
                          : settings.printer.paperWidth === '80mm'
                          ? 'w-[45%] bg-orange-500'
                          : 'w-full bg-blue-500'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-zinc-500 px-0.5 font-mono">
                    <span>58mm (Mobile POS)</span>
                    <span>80mm (Desktop Kasir)</span>
                    <span>A4 (Lembar Penuh)</span>
                  </div>
                </div>

                {/* Integration Status Callout */}
                <div className="bg-orange-500/10 border border-orange-500/25 rounded-2xl p-3 flex items-start gap-2.5 text-xs">
                  <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div className="text-zinc-300 leading-relaxed text-[11px]">
                    <strong className="text-white">Sinkronisasi Penuh Kasir POS & ReceiptModal:</strong> Format{' '}
                    <span className="text-orange-400 font-bold uppercase">{settings.printer.paperWidth}</span>{' '}
                    yang dipilih otomatis diterapkan pada seluruh struk penjualan POS kafe, faktur membership,
                    slip check-in loker, dan tiket sesi Personal Trainer tanpa perlu konfigurasi ulang.
                  </div>
                </div>
              </div>
            </div>

            {/* Header & Footer Customization */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                2. Teks Header & Footer Struk
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Nama Toko di Struk</label>
                  <input
                    type="text"
                    value={settings.printer.storeName}
                    onChange={(e) => updatePrinterConfig({ storeName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Slogan / Sub-Header</label>
                  <input
                    type="text"
                    value={settings.printer.storeTagline}
                    onChange={(e) => updatePrinterConfig({ storeTagline: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Alamat Cabang</label>
                  <input
                    type="text"
                    value={settings.printer.storeAddress}
                    onChange={(e) => updatePrinterConfig({ storeAddress: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Kota & Telepon Kasir</label>
                  <input
                    type="text"
                    value={settings.printer.storePhone}
                    onChange={(e) => updatePrinterConfig({ storePhone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Catatan Kaki (Footer Struk)</label>
                <textarea
                  rows={2}
                  value={settings.printer.footerNote}
                  onChange={(e) => updatePrinterConfig({ footerNote: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                  <span className="text-xs font-bold text-zinc-200">Tampilkan Logo Gym</span>
                  <input
                    type="checkbox"
                    checked={settings.printer.showLogo}
                    onChange={(e) => updatePrinterConfig({ showLogo: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                  <span className="text-xs font-bold text-zinc-200">Tampilkan Barcode Struk</span>
                  <input
                    type="checkbox"
                    checked={settings.printer.showBarcode}
                    onChange={(e) => updatePrinterConfig({ showBarcode: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                  <span className="text-xs font-bold text-zinc-200">Tampilkan Nama Kasir</span>
                  <input
                    type="checkbox"
                    checked={settings.printer.showCashierName}
                    onChange={(e) => updatePrinterConfig({ showCashierName: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">Auto-Print Saat Transaksi</span>
                    <span className="text-[10px] text-zinc-500">Cetak otomatis saat bayar lunas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.printer.autoPrintOnPayment}
                    onChange={(e) => updatePrinterConfig({ autoPrintOnPayment: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Live Preview: Thermal Receipt & A4 Invoice */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-orange-400" />
                  <span>Pratinjau Hasil Cetak Kasir</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {settings.printer.paperWidth === 'a4' ? 'A4 INVOICE (210mm)' : `THERMAL ${settings.printer.paperWidth.toUpperCase()}`}
                </span>
              </div>

              {/* Realistic Paper Mockup Container */}
              <div className="bg-zinc-950 p-4 sm:p-6 rounded-2xl flex justify-center border border-zinc-800 shadow-inner max-h-[480px] overflow-y-auto">
                {settings.printer.paperWidth === 'a4' ? (
                  /* Formal A4 / Letter Mockup */
                  <div className="bg-white text-zinc-900 rounded-lg p-5 font-sans shadow-2xl border-t-4 border-blue-500 w-full max-w-[400px] text-xs transition-all select-none">
                    {/* A4 Header Letterhead */}
                    <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-3 mb-3">
                      <div>
                        {settings.printer.showLogo && (
                          <div className="w-7 h-7 rounded bg-orange-600 text-white font-black italic flex items-center justify-center mb-1 text-sm shadow-sm">
                            R
                          </div>
                        )}
                        <h4 className="font-black text-sm uppercase tracking-tight text-zinc-900">
                          {settings.printer.storeName}
                        </h4>
                        <p className="text-[9px] text-zinc-600">{settings.printer.storeTagline}</p>
                        <p className="text-[9px] text-zinc-600">{settings.printer.storeAddress}</p>
                        <p className="text-[9px] text-zinc-600">Telp: {settings.printer.storePhone}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          FAKTUR PENJUALAN RESMI
                        </span>
                        <p className="text-[10px] font-mono font-bold mt-1 text-zinc-800">TRX-202609-088</p>
                        <p className="text-[9px] text-zinc-500">22/09/2026 14:30 WIB</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-50 rounded border border-zinc-200 text-[10px] mb-3">
                      <div>
                        <span className="text-zinc-500 block">Diterbitkan Untuk:</span>
                        <strong className="text-zinc-800">Akbar Hanif (VIP Member)</strong>
                        <span className="text-zinc-500 block text-[9px]">ID: MBR-2026-0042</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 block">Kasir / Front Desk:</span>
                        <strong className="text-zinc-800">Siti Kasir</strong>
                        <span className="text-zinc-500 block text-[9px]">Status: LUNAS (QRIS)</span>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-[10px] border-collapse mb-3">
                      <thead>
                        <tr className="border-b border-t border-zinc-300 bg-zinc-100 text-zinc-700">
                          <th className="py-1 px-1 text-left">Deskripsi Produk/Layanan</th>
                          <th className="py-1 px-1 text-center">Qty</th>
                          <th className="py-1 px-1 text-right">Harga</th>
                          <th className="py-1 px-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        <tr>
                          <td className="py-1 px-1 font-medium">1x Membership Gold (1 Bln)</td>
                          <td className="py-1 px-1 text-center">1</td>
                          <td className="py-1 px-1 text-right">Rp 350.000</td>
                          <td className="py-1 px-1 text-right font-bold">Rp 350.000</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-1 font-medium">2x Pocari Sweat 500ml</td>
                          <td className="py-1 px-1 text-center">2</td>
                          <td className="py-1 px-1 text-right">Rp 10.000</td>
                          <td className="py-1 px-1 text-right font-bold">Rp 20.000</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Summary Totals */}
                    <div className="border-t-2 border-zinc-900 pt-2 text-[10px] space-y-0.5">
                      <div className="flex justify-between text-zinc-600">
                        <span>Subtotal Transaksi:</span>
                        <span>Rp 370.000</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs text-zinc-900 pt-0.5 border-t border-zinc-200">
                        <span>TOTAL AKHIR:</span>
                        <span className="text-blue-700">Rp 370.000</span>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-2 border-t border-dashed border-zinc-300 text-center text-[9px]">
                      <div>
                        <span className="text-zinc-500">Petugas Kasir</span>
                        <div className="mt-5 border-t border-zinc-400 font-bold">( Siti Kasir )</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Member Penerima</span>
                        <div className="mt-5 border-t border-zinc-400 font-bold">( Akbar Hanif )</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 text-center text-[8.5px] text-zinc-500 border-t border-zinc-200 pt-1">
                      {settings.printer.footerNote}
                    </div>
                  </div>
                ) : (
                  /* Thermal Roll Realistic Mockup (58mm or 80mm) */
                  <div
                    className={`bg-white text-zinc-900 rounded-lg p-4 font-mono shadow-2xl border-t-4 border-orange-500 transition-all select-none ${
                      settings.printer.paperWidth === '58mm'
                        ? 'w-full max-w-[250px] text-[10.5px] leading-tight'
                        : 'w-full max-w-[340px] text-xs leading-normal'
                    }`}
                  >
                    {/* Header */}
                    <div className="text-center pb-2 border-b border-dashed border-zinc-400">
                      {settings.printer.showLogo && (
                        <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-black italic flex items-center justify-center mx-auto mb-1.5 text-base shadow-sm">
                          R
                        </div>
                      )}
                      <p className="font-black text-sm tracking-tight">{settings.printer.storeName}</p>
                      <p className="text-[9px] text-zinc-600">{settings.printer.storeTagline}</p>
                      <p className="text-[9px] text-zinc-600 mt-1">{settings.printer.storeAddress}</p>
                      <p className="text-[9px] text-zinc-600">{settings.printer.storeCity}</p>
                      <p className="text-[9px] text-zinc-600">Telp: {settings.printer.storePhone}</p>
                    </div>

                    <div className="py-2 text-center text-[10px] font-bold text-orange-600 uppercase border-b border-dashed border-zinc-400">
                      {settings.printer.headerNote}
                    </div>

                    {/* Metadata */}
                    <div className="py-2 space-y-0.5 border-b border-dashed border-zinc-400 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Waktu:</span>
                        <span className="font-semibold">22/09/2026 14:30 WIB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">No. Nota:</span>
                        <span className="font-bold">TRX-202609-088</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Member:</span>
                        <span className="font-semibold truncate max-w-[140px]">Akbar Hanif (VIP)</span>
                      </div>
                      {settings.printer.showCashierName && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Kasir:</span>
                          <span className="font-medium">Siti Kasir</span>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="py-2 space-y-1.5 border-b border-dashed border-zinc-400 text-[11px]">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">1x Membership Gold (1 Bln)</span>
                        <span className="font-bold">Rp 350.000</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="font-medium">2x Pocari Sweat 500ml</span>
                        <span className="font-bold">Rp 20.000</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="py-2 space-y-1 border-b border-dashed border-zinc-400 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Subtotal:</span>
                        <span>Rp 370.000</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs pt-1">
                        <span>TOTAL BAYAR:</span>
                        <span className="text-orange-600">Rp 370.000</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-600">Metode:</span>
                        <span className="font-bold">QRIS MANDIRI (LUNAS)</span>
                      </div>
                    </div>

                    {/* Barcode */}
                    {settings.printer.showBarcode && (
                      <div className="py-2 text-center">
                        <div className="text-[13px] tracking-widest font-black">||||| | |||| || ||| | |||</div>
                        <span className="text-[9px] text-zinc-500">*TRX-202609-088*</span>
                      </div>
                    )}

                    {/* Footer Note */}
                    <div className="pt-2 text-center text-[9px] text-zinc-500 leading-tight">
                      {settings.printer.footerNote}
                    </div>

                    {settings.printer.autoCutPaper && (
                      <div className="mt-3 text-center text-[8px] text-zinc-400 border-t border-dashed border-zinc-300 pt-1">
                        -- [Potong Kertas Disini] --
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Test Print & Open ReceiptModal Simulation */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={executeTestPrint}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
                  title="Kirim cetakan struk langsung ke printer fisik yang terhubung"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk Uji Coba Fisik (Print)</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenReceiptSimulation}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 hover:border-orange-500/40 cursor-pointer active:scale-95"
                  title="Buka dialog ReceiptModal lengkap dengan transaksi contoh kasir"
                >
                  <Receipt className="w-4 h-4 text-orange-400" />
                  <span>Pratinjau Format Struk Kasir (ReceiptModal)</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <div className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Status Integrasi POS & ReceiptModal: Siap</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  Format <strong className="text-orange-400 uppercase">{settings.printer.paperWidth}</strong> aktif{' '}
                  akan langsung dipakai oleh dialog ReceiptModal saat kasir menyelesaikan transaksi POS, reprint struk,
                  atau mengirim via WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: TEMA & TAMPILAN SISTEM (ERP THEMING)                         */}
      {/* ========================================================================= */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Pengaturan Tema & Desain Antarmuka</span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: currentAccent.hex }}
                      title={`Aksen Aktif: ${currentAccent.name}`}
                    />
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Kustomisasi suasana mode gelap/terang, palet warna brand GymPro, kepadatan layout, dan pola latar khusus ruang kerja Backoffice ERP.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[11px] text-orange-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>Tema ini diterapkan khusus pada Backoffice ERP. Halaman publik Landing Page tetap terjaga dalam desain resmi RFA Gym.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    resetTheme();
                    notifySuccess('Tema Direset', 'Tema dikembalikan ke pengaturan default GymPro.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition flex items-center gap-2 border border-zinc-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
                <button
                  type="button"
                  onClick={openThemeModal}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buka Dialog Lengkap</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Theme Modes & Accents */}
            <div className="lg:col-span-8 space-y-6">
              {/* 0. Preset Instan Cepat */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: currentAccent.hex }} />
                    <span>Preset Desain Siap Pakai (1-Klik)</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">Kombinasi tema & aksen instan</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {THEME_PRESETS.map((p) => {
                    const isPresetActive =
                      theme.mode === p.config.mode &&
                      theme.accent === p.config.accent &&
                      theme.density === p.config.density &&
                      theme.pattern === p.config.pattern;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          applyPreset(p.config);
                          notifySuccess('Preset Tema Diterapkan', `Preset ${p.name} berhasil diaktifkan.`);
                        }}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                          isPresetActive
                            ? 'bg-zinc-800/90 shadow-md ring-1'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                        style={{
                          borderColor: isPresetActive ? currentAccent.hex : undefined,
                          boxShadow: isPresetActive ? `0 0 12px rgba(${currentAccent.rgb}, 0.25)` : undefined
                        }}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-white truncate">{p.name}</span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0"
                            style={{
                              backgroundColor: isPresetActive ? currentAccent.hex : '#27272a',
                              color: isPresetActive ? '#ffffff' : '#a1a1aa'
                            }}
                          >
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. Mode Tampilan */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-orange-400" />
                    <span>Mode Tampilan Sistem</span>
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Aktif: <strong className="text-orange-400 uppercase">{theme.mode}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {THEME_MODE_OPTIONS.map((opt) => {
                    const isSelected = theme.mode === opt.id;
                    const ModeIcon =
                      opt.iconType === 'moon'
                        ? Moon
                        : opt.iconType === 'sparkles'
                        ? Sparkles
                        : opt.iconType === 'monitor'
                        ? Monitor
                        : opt.iconType === 'layers'
                        ? Layers
                        : Sun;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setMode(opt.id);
                          notifySuccess('Mode Tampilan Diubah', `Tema diatur ke ${opt.name}.`);
                        }}
                        className={`p-4 rounded-2xl text-left border transition relative cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800/90 border-orange-500/80 shadow-lg ring-1 ring-orange-500/30'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 text-zinc-400'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 text-black flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div
                            className={`p-2 rounded-xl ${
                              isSelected ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <ModeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-white">{opt.name}</h5>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">{opt.id}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Palet Warna Aksen */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-orange-400" />
                    <span>Warna Aksen & Identitas Brand</span>
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Aksen: <strong className="text-white">{currentAccent.name}</strong> ({currentAccent.hex})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ACCENT_OPTIONS.map((acc) => {
                    const isSelected = theme.accent === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setAccent(acc.id);
                          notifySuccess('Aksen Warna Diperbarui', `Aksen diubah ke ${acc.name}.`);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800/90 border-white/40 shadow-md ring-1'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                        style={{
                          borderColor: isSelected ? acc.hex : undefined
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-7 h-7 rounded-xl shadow-inner flex items-center justify-center"
                            style={{ backgroundColor: acc.hex }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                            {acc.hex}
                          </span>
                        </div>
                        <p className="text-xs font-black text-white">{acc.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{acc.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Kepadatan Layout & Pola Latar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Density */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-400" />
                    <span>Kepadatan Tampilan (Density)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDensity('comfortable');
                        notifySuccess('Kepadatan Diubah', 'Layout diatur ke Mode Luas & Nyaman.');
                      }}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        theme.density === 'comfortable'
                          ? 'bg-orange-500/15 border-orange-500/60 text-white'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      <span className="text-xs font-bold block">Luas & Nyaman</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">Padding standar lega</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDensity('compact');
                        notifySuccess('Kepadatan Diubah', 'Layout diatur ke Mode Ringkas & Padat.');
                      }}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        theme.density === 'compact'
                          ? 'bg-orange-500/15 border-orange-500/60 text-white'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      <span className="text-xs font-bold block">Ringkas & Padat</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">Muat lebih banyak data</span>
                    </button>
                  </div>
                </div>

                {/* Background Pattern */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-orange-400" />
                    <span>Pola Latar Belakang</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'none', label: 'Polos' },
                        { id: 'grid', label: 'Grid Kotak' },
                        { id: 'dots', label: 'Dot Matrix' }
                      ] as { id: BackgroundPattern; label: string }[]
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPattern(p.id);
                          notifySuccess('Pola Diperbarui', `Latar belakang diubah ke ${p.label}.`);
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                          theme.pattern === p.id
                            ? 'bg-orange-500/15 border-orange-500/60 text-white'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                        }`}
                      >
                        <span className="text-[11px] font-bold block">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4 sticky top-20">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-orange-400" />
                    <span>Live Pratinjau Desain</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-mono">
                    Real-time
                  </span>
                </div>

                {/* Simulated UI Card */}
                <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950 p-4 space-y-3 shadow-xl relative overflow-hidden">
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
                    style={{ backgroundColor: currentAccent.hex }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-black text-xs"
                        style={{ backgroundColor: currentAccent.hex }}
                      >
                        GP
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">GymPro POS Enterprise</p>
                        <p className="text-[10px] text-zinc-400">Cabang {activeBranch?.name}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `rgba(${currentAccent.rgb}, 0.15)`,
                        borderColor: `rgba(${currentAccent.rgb}, 0.35)`,
                        color: currentAccent.hex
                      }}
                    >
                      Aktif
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Total Transaksi Hari Ini</span>
                      <span className="font-bold text-white">Rp 2.450.000</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Aksen Warna</span>
                      <span className="font-mono text-[11px]" style={{ color: currentAccent.hex }}>
                        {currentAccent.name}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl text-xs font-black text-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    style={{ backgroundColor: currentAccent.hex }}
                  >
                    <span>Tombol Aksi Utama</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Mode: <strong className="text-zinc-200">{theme.mode}</strong></span>
                    <span>Pola: <strong className="text-zinc-200">{theme.pattern}</strong></span>
                    <span>Kepadatan: <strong className="text-zinc-200">{theme.density}</strong></span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                  <p className="font-bold text-zinc-300">💡 Informasi Penataan:</p>
                  <p>
                    Pengaturan tema dan printer kini terpusat rapi di halaman Pengaturan ini untuk memberikan ruang kerja Header yang lebih lega dan nyaman di tablet maupun desktop.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: MANAJEMEN ROLE & HAK AKSES (RBAC)                            */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Role Picker & Explanation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  Pilih Role Pengguna untuk Dikonfigurasi
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tentukan otorisasi akses menu dan tindakan (Lihat, Tambah, Edit, Hapus, Void, Export) untuk setiap peran.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleResetRole(selectedRoleKey)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Kembalikan izin role ini ke standar bawaan"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Reset Bawaan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGrantAll(selectedRoleKey)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold transition cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleRevokeAll(selectedRoleKey)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-bold transition cursor-pointer"
                >
                  Cabut Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRolePermissions(selectedRoleKey)}
                  className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                  title="Simpan perubahan matriks hak akses role ini"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Role {currentRoleDef.roleName}</span>
                </button>
              </div>
            </div>

            {/* Role Tab Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {(Object.keys(roles) as UserRole[]).map((rKey) => {
                const rDef = roles[rKey];
                const isSelected = selectedRoleKey === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => setSelectedRoleKey(rKey)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 border-orange-500 ring-2 ring-orange-500/30'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${rDef.badgeColor}`}>
                        {rKey.toUpperCase()}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{rDef.roleName}</p>
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{rDef.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Permission Matrix Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Matriks Otorisasi Modul:</span>
                  <span className="text-orange-400 font-black">{currentRoleDef.roleName}</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Centang kotak aksi yang diizinkan untuk dikerjakan oleh pemegang peran ini.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari modul sistem..."
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 min-w-[220px]">Modul & Fitur Sistem</th>
                    <th className="p-3.5 text-center min-w-[80px]">Lihat (View)</th>
                    <th className="p-3.5 text-center min-w-[80px]">Tambah (Create)</th>
                    <th className="p-3.5 text-center min-w-[80px]">Ubah (Edit)</th>
                    <th className="p-3.5 text-center min-w-[80px]">Hapus (Delete)</th>
                    <th className="p-3.5 text-center min-w-[90px]">Void / Batal</th>
                    <th className="p-3.5 text-center min-w-[80px]">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
                  {filteredModules.map((m) => {
                    const perm = currentRoleDef.permissions[m.id] || {
                      view: false,
                      create: false,
                      edit: false,
                      delete: false,
                      voidRefund: false,
                      export: false
                    };

                    const isFinanceModule = ['pos', 'laporan', 'tutup-toko', 'piutang'].includes(m.id);

                    return (
                      <tr key={m.id} className="hover:bg-zinc-800/40 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{m.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                              {m.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{m.desc}</p>
                        </td>

                        {/* View */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.view}
                            onChange={() => handleTogglePerm(selectedRoleKey, m.id, 'view', perm.view)}
                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                          />
                        </td>

                        {/* Create */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.create}
                            onChange={() => handleTogglePerm(selectedRoleKey, m.id, 'create', perm.create)}
                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                          />
                        </td>

                        {/* Edit */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.edit}
                            onChange={() => handleTogglePerm(selectedRoleKey, m.id, 'edit', perm.edit)}
                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                          />
                        </td>

                        {/* Delete */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.delete}
                            onChange={() => handleTogglePerm(selectedRoleKey, m.id, 'delete', perm.delete)}
                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                          />
                        </td>

                        {/* Void / Refund */}
                        <td className="p-3.5 text-center">
                          {isFinanceModule ? (
                            <input
                              type="checkbox"
                              checked={perm.voidRefund || false}
                              onChange={() =>
                                handleTogglePerm(selectedRoleKey, m.id, 'voidRefund', perm.voidRefund || false)
                              }
                              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>

                        {/* Export */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.export || false}
                            onChange={() =>
                              handleTogglePerm(selectedRoleKey, m.id, 'export', perm.export || false)
                            }
                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix Action & Save Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                <span>
                  Mengatur <strong>{filteredModules.length}</strong> modul untuk <strong>{currentRoleDef.roleName}</strong>.
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleResetRole(selectedRoleKey)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Reset Bawaan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRolePermissions(selectedRoleKey)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 active:scale-95 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer flex-1 sm:flex-initial"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Hak Akses</span>
                </button>
              </div>
            </div>
          </div>

          {/* Staf Penugasan Role (Staff Assignment) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                Daftar Karyawan & Penugasan Role Aktif
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ubah penugasan role staf operasional secara instan sesuai tanggung jawab kerja.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staffUsers.map((staff) => {
                const assignedRole = staffRoleUpdates[staff.id] || staff.role;
                const hasPendingChange = assignedRole !== staff.role;

                return (
                  <div
                    key={staff.id}
                    className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-300">
                            {staff.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{staff.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">ID: {staff.accId} • Shift {staff.shift}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={assignedRole}
                        onChange={(e) =>
                          setStaffRoleUpdates((prev) => ({
                            ...prev,
                            [staff.id]: e.target.value as UserRole
                          }))
                        }
                        className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-orange-500"
                      >
                        <option value="admin">Super Admin (HQ)</option>
                        <option value="admin_cabang">Admin Unit Cabang</option>
                        <option value="manager">Manager</option>
                        <option value="kasir">Kasir & Front Desk</option>
                        <option value="leader_pt">Leader PT</option>
                        <option value="pt">Pelatih PT</option>
                        <option value="teknisi">Teknisi</option>
                      </select>

                      {hasPendingChange && (
                        <button
                          type="button"
                          onClick={() => handleSaveStaffRole(staff.id)}
                          className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition"
                          title="Simpan perubahan role"
                        >
                          <Save className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* 2.2 SUB-TAB: KEAMANAN & PASSWORD GANTI PIC                                */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Main Status & Hero Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <KeyRound className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Otorisasi & Password Ganti PIC Member
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                        picProtection.requirePasswordToChangePic
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {picProtection.requirePasswordToChangePic ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" /> Proteksi Aktif (Wajib Password)
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Proteksi Nonaktif (Bebas)
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                    Atur password otorisasi keamanan yang wajib dimasukkan staf atau kasir saat ingin membuka kunci dan mengubah PIC (Person In Charge / Sales / Trainer) yang telah dipilih pada form pendaftaran member.
                  </p>
                </div>
              </div>

              {/* Master Switch Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 shrink-0">
                <div>
                  <span className="text-xs font-bold text-white block">Proteksi Password PIC</span>
                  <span className="text-[11px] text-zinc-400">
                    {picProtection.requirePasswordToChangePic ? 'Wajib password' : 'Bebas ganti'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !picProtection.requirePasswordToChangePic;
                    updatePicProtectionConfig({ requirePasswordToChangePic: nextVal });
                    notifySuccess(
                      nextVal ? 'Proteksi PIC Diaktifkan 🔒' : 'Proteksi PIC Dinonaktifkan 🔓',
                      nextVal
                        ? 'Penggantian PIC sekarang mewajibkan input password otorisasi.'
                        : 'Kunci PIC kini dapat dibuka tanpa perlu memasukkan password.'
                    );
                  }}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    picProtection.requirePasswordToChangePic ? 'bg-amber-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      picProtection.requirePasswordToChangePic ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Password Configuration Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Box 1: Ubah Password Otorisasi */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <Key className="w-5 h-5 text-orange-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Konfigurasi Password Otorisasi</h3>
                      <p className="text-xs text-zinc-400">Kelola password kunci untuk staf front desk & kasir</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPicPassword}
                    className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition underline cursor-pointer"
                    title="Kembalikan password ke default (123)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ke '123'</span>
                  </button>
                </div>

                {/* Status Password Saat Ini */}
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-900 rounded-xl text-zinc-400 border border-zinc-800">
                      <Lock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                        Password Otorisasi Saat Ini
                      </span>
                      <div className="font-mono text-sm font-bold text-white tracking-widest mt-0.5">
                        {showCurrentPicPass ? picProtection.picChangePassword : '••••••••'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPicPass(!showCurrentPicPass)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition border border-zinc-800 cursor-pointer flex items-center gap-1.5 text-xs"
                  >
                    {showCurrentPicPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showCurrentPicPass ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>

                {/* Form Ubah Password Baru */}
                <form onSubmit={handleSaveNewPicPassword} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Password Baru <span className="text-orange-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPicPass ? 'text' : 'password'}
                          required
                          value={newPicPassword}
                          onChange={(e) => setNewPicPassword(e.target.value)}
                          placeholder="Masukkan password baru..."
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPicPass(!showNewPicPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-1"
                        >
                          {showNewPicPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Konfirmasi Password Baru <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type={showNewPicPass ? 'text' : 'password'}
                        required
                        value={confirmPicPassword}
                        onChange={(e) => setConfirmPicPassword(e.target.value)}
                        placeholder="Ulangi password baru..."
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-zinc-500">
                      Gunakan kombinasi minimal 3-6 karakter yang mudah diingat oleh Manager / Supervisor.
                    </p>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Password Baru</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Box 2: Uji Coba Password (Live Test Simulator) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Uji Coba Password Otorisasi (Live Test)</h3>
                    <p className="text-xs text-zinc-400">Verifikasi apakah password yang telah diatur berjalan dengan baik</p>
                  </div>
                </div>

                <form onSubmit={handleTestPassword} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={testPasswordInput}
                      onChange={(e) => {
                        setTestPasswordInput(e.target.value);
                        setTestPasswordResult('idle');
                      }}
                      placeholder="Ketik password untuk menguji..."
                      className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Cek Validitas</span>
                    </button>
                  </div>

                  {testPasswordResult === 'valid' && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in-50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Password Valid!</strong> Password cocok dan siap digunakan untuk membuka kunci PIC.</span>
                    </div>
                  )}

                  {testPasswordResult === 'invalid' && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in-50">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span><strong>Password Salah!</strong> Password yang Anda ketikkan tidak sesuai dengan konfigurasi sistem.</span>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Right Column (5 cols): Rules & Scope Settings */}
            <div className="lg:col-span-5 space-y-6">
              {/* Box 3: Kebijakan Otorisasi & Hak Akses Role */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Kebijakan Hak Akses & Cakupan</h3>
                    <p className="text-xs text-zinc-400">Aturan pembatasan dan bypass role sistem</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Bypass Admin Option */}
                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white block">
                        Bypass Otorisasi Administrator & Manager
                      </label>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Pengguna yang sedang login sebagai <strong>System Admin</strong> atau <strong>Manager</strong> dapat langsung membuka kunci PIC tanpa perlu mengetikkan password.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(picProtection.allowAdminBypass)}
                      onChange={(e) => {
                        updatePicProtectionConfig({ allowAdminBypass: e.target.checked });
                        notifySuccess('Kebijakan Diperbarui', `Bypass admin ${e.target.checked ? 'diaktifkan' : 'dinonaktifkan'}.`);
                      }}
                      className="w-4 h-4 mt-1 accent-orange-500 rounded cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Scope 1: Form Input Member Master Data */}
                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white block">
                        Proteksi Form Master Data Member
                      </label>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Wajibkan password saat staf mengubah PIC di form <em>Tambah Member</em> atau <em>Edit Member</em> di Master Data.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={picProtection.requirePasswordOnMemberForm !== false}
                      onChange={(e) => {
                        updatePicProtectionConfig({ requirePasswordOnMemberForm: e.target.checked });
                        notifySuccess('Cakupan Diperbarui', 'Pengaturan form member diperbarui.');
                      }}
                      className="w-4 h-4 mt-1 accent-orange-500 rounded cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Scope 2: Form Front Desk Quick Reg & Renewal */}
                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white block">
                        Proteksi Front Desk Meja Kasir
                      </label>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Wajibkan password saat kasir membuka kunci PIC pada modal <em>Registrasi Cepat</em> dan <em>Perpanjangan (Renewal)</em>.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={picProtection.requirePasswordOnRenewal !== false}
                      onChange={(e) => {
                        updatePicProtectionConfig({ requirePasswordOnRenewal: e.target.checked });
                        notifySuccess('Cakupan Diperbarui', 'Pengaturan meja kasir diperbarui.');
                      }}
                      className="w-4 h-4 mt-1 accent-orange-500 rounded cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Scope 3: Form Transaksi Membership & PT */}
                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white block">
                        Proteksi Form Membership & PT
                      </label>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Wajibkan password saat memilih peserta & pelatih personal trainer di menu <em>Membership & Paket PT</em>.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={picProtection.requirePasswordOnTransaction !== false}
                      onChange={(e) => {
                        updatePicProtectionConfig({ requirePasswordOnTransaction: e.target.checked });
                        notifySuccess('Cakupan Diperbarui', 'Pengaturan form membership diperbarui.');
                      }}
                      className="w-4 h-4 mt-1 accent-orange-500 rounded cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Scope 4: Oper Alih Prospek Calon Member (CRM Leads) */}
                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white block">
                        Proteksi Oper Alih Prospek CRM Leads
                      </label>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Wajibkan sandi otorisasi saat staf melakukan serah terima atau oper alih (handover) prospek calon member di menu <em>Pipeline Prospek Calon Member (CRM Leads)</em>.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={picProtection.requirePasswordOnLeadHandover !== false}
                      onChange={(e) => {
                        updatePicProtectionConfig({ requirePasswordOnLeadHandover: e.target.checked });
                        notifySuccess('Cakupan Diperbarui', 'Pengaturan oper alih CRM Leads diperbarui.');
                      }}
                      className="w-4 h-4 mt-1 accent-orange-500 rounded cursor-pointer shrink-0"
                    />
                  </div>
                </div>
              </div>

              {/* Box 4: Edukasi & SOP Bisnis Gym */}
              <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-xs text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Info className="w-4 h-4" />
                  <span>Mengapa Proteksi PIC Diperlukan?</span>
                </div>
                <p className="leading-relaxed text-amber-200/90 text-[11px]">
                  Di industri fitness center, setiap member baru dan perpanjangan paket menghasilkan <strong>komisi closing sales</strong> dan <strong>komisi sesi personal trainer (PT)</strong>.
                </p>
                <p className="leading-relaxed text-amber-200/90 text-[11px]">
                  Mengunci PIC dengan password otorisasi manajer mencegah staf kasir nakal mengalihkan atribusi member kepada teman staf lain atau mengambil alih klien PT tanpa persetujuan resmi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5 SUB-TAB: KELOLA CABANG & OUTLET MULTI-BRANCH                         */}
      {/* ========================================================================= */}
      {activeTab === 'branches' && (
        <BranchManagementView currentUser={currentUser} showToast={showToast} />
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: PROFIL USAHA & CABANG                                         */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Active Branch Callout Banner */}
          <div className="p-4.5 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Cabang Aktif Saat Ini:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {activeBranch?.code || 'PST'}
                  </span>
                </div>
                <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                  {activeBranch?.name || 'Cabang Utama'} • {activeBranch?.city || 'Jakarta'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('branches')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
            >
              <span>Kelola & Tambah Cabang Lain →</span>
            </button>
          </div>

          {/* RFA GYM Google Business Profile Sync Card */}
          <div className="p-4.5 rounded-3xl bg-gradient-to-r from-orange-950/40 via-zinc-900 to-zinc-900 border border-orange-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">Sumber Data Resmi:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    RFA GYM (Google Business Profile)
                  </span>
                  <span className="text-[11px] text-zinc-400">• Cibubur, Bekasi</span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Jl. Kranggan Permai, Jl. Wijaya Kusuma Blok AS 48 No. 25–26, Jatisampurna, Bekasi • WA: 0857-7218-5973
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 flex-wrap">
              <a
                href={settings.profile.googleMapsUrl || 'https://share.google/SILNZrwYoRcIyYjRo'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700"
                title="Buka profil bisnis RFA GYM di Google Maps"
              >
                <span>Buka Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>

              <button
                type="button"
                onClick={() => {
                  updateProfileConfig(DEFAULT_GYM_PROFILE);
                  updatePrinterConfig({
                    storeName: DEFAULT_PRINTER_CONFIG.storeName,
                    storeTagline: DEFAULT_PRINTER_CONFIG.storeTagline,
                    storeAddress: DEFAULT_PRINTER_CONFIG.storeAddress,
                    storeCity: DEFAULT_PRINTER_CONFIG.storeCity,
                    storePhone: DEFAULT_PRINTER_CONFIG.storePhone
                  });
                  notifySuccess('Profil RFA GYM Diterapkan', 'Data profil usaha dan struk diperbarui sesuai Profil Bisnis Google RFA GYM.');
                }}
                className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                title="Terapkan data alamat, telepon, dan jam buka resmi RFA GYM"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Terapkan Profil RFA GYM</span>
              </button>
            </div>
          </div>

          {/* DEDICATED COMPANY LOGO MANAGEMENT SECTION (MEMBER PASS & LANDING PAGE) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      Logo Perusahaan & Kartu Member
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Atur logo brand gym untuk ditampilkan otomatis di Kartu Member Digital (VIP Pass), Landing Page, dan Struk POS.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 ${
                  settings.profile.logoUrl
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${settings.profile.logoUrl ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                  {settings.profile.logoUrl ? 'Logo Kustom Aktif' : 'Logo Default RFA'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Upload Controls & Inputs */}
              <div className="lg:col-span-6 space-y-4">
                {/* File Upload Box */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      Unggah File Logo (PNG, JPG, SVG, WebP)
                    </label>
                    <span className="text-[10px] text-zinc-500">Maks. 5 MB</span>
                  </div>

                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingLogo ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Pilih File dari Komputer / HP</span>
                        </>
                      )}
                    </button>

                    {settings.profile.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Hapus logo dan gunakan logo default RFA"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Logo</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    💡 <strong>Tips:</strong> Gunakan logo dengan latar belakang transparan (format .PNG atau .SVG) agar terlihat mewah dan pas di kartu gelap maupun terang.
                  </p>
                </div>

                {/* Direct Image URL Input */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2.5">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                    Atau Masukkan Tautan / URL Gambar Logo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/logo-gym.png"
                      value={logoInputUrl}
                      onChange={(e) => setLogoInputUrl(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyLogoUrl}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-bold text-xs rounded-xl border border-orange-500/30 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan</span>
                    </button>
                  </div>
                </div>

                {/* Preset Fast Picks */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Pilihan Preset Logo Resmi RFA:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLogo('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80', 'RFA Titan Strength')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Titan Flame</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLogo('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=200&auto=format&fit=crop&q=80', '24K Gold VIP')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Royal Gold</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLogo('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80', 'Cyber Arena')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Cyber Arena</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Default Asli</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Format Live Preview */}
              <div className="lg:col-span-6 bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Pratinjau Tampilan Logo
                    </span>
                  </div>

                  {/* Subtabs for Preview */}
                  <div className="flex items-center bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setLogoPreviewTab('card')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        logoPreviewTab === 'card'
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Kartu Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoPreviewTab('landing')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        logoPreviewTab === 'landing'
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Landing Page
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoPreviewTab('receipt')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        logoPreviewTab === 'receipt'
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Struk Kasir
                    </button>
                  </div>
                </div>

                {/* PREVIEW 1: KARTU MEMBER DIGITAL PASS */}
                {logoPreviewTab === 'card' && (
                  <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                    <div className="w-[280px] h-[190px] rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-orange-500/40 p-3.5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      {/* Ambient metallic glow */}
                      <div className="absolute -top-10 -right-10 w-28 h-28 bg-orange-500/20 rounded-full blur-xl pointer-events-none" />
                      
                      {/* Card Header with Logo */}
                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-zinc-700/80 p-1 flex items-center justify-center shadow-md overflow-hidden">
                            {settings.profile.logoUrl && settings.profile.logoUrl.trim() ? (
                              <img
                                src={settings.profile.logoUrl.trim()}
                                alt="Logo Gym"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-orange-600 to-amber-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
                                R
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-black tracking-wider text-white">
                              {settings.profile.gymName || 'RFA GYM'}
                            </div>
                            <div className="text-[9px] font-bold tracking-widest text-orange-400 uppercase">
                              VIP PASS • CENTRAL
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          ACTIVE
                        </span>
                      </div>

                      {/* Mock Member Data */}
                      <div className="z-10 space-y-0.5">
                        <div className="text-[10px] text-zinc-400 uppercase font-medium">Nama Member</div>
                        <div className="text-sm font-black text-white tracking-wide">ALEXANDER PRATAMA</div>
                        <div className="text-[9px] font-mono text-zinc-400">ID: RFA-M001 • PASS: #88219</div>
                      </div>

                      {/* Mock Barcode Line */}
                      <div className="pt-1 border-t border-zinc-800 flex items-center justify-between z-10">
                        <div className="flex items-center gap-0.5 h-4 opacity-80">
                          <div className="w-1 h-full bg-white" />
                          <div className="w-0.5 h-full bg-white" />
                          <div className="w-1.5 h-full bg-white" />
                          <div className="w-0.5 h-full bg-white" />
                          <div className="w-2 h-full bg-white" />
                          <div className="w-1 h-full bg-white" />
                          <div className="w-0.5 h-full bg-white" />
                        </div>
                        <span className="text-[9px] font-mono text-orange-400">Presensi & Akses Pintu</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-2">
                      Logo otomatis tertampil di header kartu pass member fisik & digital.
                    </span>
                  </div>
                )}

                {/* PREVIEW 2: LANDING PAGE HEADER */}
                {logoPreviewTab === 'landing' && (
                  <div className="space-y-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                    <div className="w-full bg-zinc-950/95 border border-zinc-800 rounded-xl p-3 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 p-0.5 flex items-center justify-center overflow-hidden">
                          {settings.profile.logoUrl && settings.profile.logoUrl.trim() ? (
                            <img
                              src={settings.profile.logoUrl.trim()}
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-orange-600 to-amber-500 rounded flex items-center justify-center text-white font-black text-xs">
                              <Flame className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-black text-white tracking-wider">
                          {settings.profile.gymName || 'RFA GYM'}{' '}
                          <span className="text-orange-500 font-extrabold text-[9px] px-1 py-0.5 rounded bg-orange-500/20">
                            PLATFORM
                          </span>
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-400">
                        <span className="text-orange-400 font-bold">Beranda</span>
                        <span>Program</span>
                        <span>Jadwal</span>
                        <span>Kontak</span>
                      </div>

                      <span className="px-2 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-bold">
                        Gabung Member
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block text-center">
                      Logo otomatis muncul pada navigasi bar atas landing page publik.
                    </span>
                  </div>
                )}

                {/* PREVIEW 3: STRUK KASIR POS */}
                {logoPreviewTab === 'receipt' && (
                  <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                    <div className="w-[230px] bg-white text-zinc-950 rounded-lg p-3 shadow-md font-mono text-[10px] leading-tight space-y-1.5 text-center">
                      {settings.profile.logoUrl && settings.profile.logoUrl.trim() ? (
                        <div className="w-8 h-8 mx-auto overflow-hidden rounded">
                          <img
                            src={settings.profile.logoUrl.trim()}
                            alt="Logo"
                            className="w-full h-full object-contain mx-auto filter grayscale contrast-125"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 mx-auto bg-black text-white font-black rounded flex items-center justify-center text-xs">
                          R
                        </div>
                      )}
                      <div className="font-black text-xs">{settings.profile.gymName || 'RFA GYM'}</div>
                      <div className="text-[9px] text-zinc-600">{settings.profile.address || 'Kranggan Permai, Bekasi'}</div>
                      <div className="border-b border-dashed border-zinc-400 my-1" />
                      <div className="flex justify-between text-[9px]">
                        <span>Membership 1 Bulan</span>
                        <span>Rp 350.000</span>
                      </div>
                      <div className="flex justify-between font-bold text-[9px]">
                        <span>TOTAL</span>
                        <span>Rp 350.000</span>
                      </div>
                      <div className="border-b border-dashed border-zinc-400 my-1" />
                      <div className="text-[8px] text-zinc-500">Terima kasih atas kunjungan Anda</div>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-2">
                      Logo dapat disertakan pada cetakan struk thermal 58mm / 80mm.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  Identitas Pusat Kebugaran & Profil Legal
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Informasi ini digunakan pada kartu digital member, invoice bukti bayar, dan laporan manajerial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => notifySuccess('Profil Disimpan', 'Data profil usaha dan cabang berhasil disimpan.')}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Profil</span>
              </button>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Nama Gym / Fitness Center</label>
              <input
                type="text"
                value={settings.profile.gymName}
                onChange={(e) => updateProfileConfig({ gymName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={settings.profile.tagline}
                onChange={(e) => updateProfileConfig({ tagline: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Nama Cabang / Unit</label>
              <input
                type="text"
                value={settings.profile.branchName}
                onChange={(e) => updateProfileConfig({ branchName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-300 block mb-1">Alamat Lengkap Outlet</label>
              <input
                type="text"
                value={settings.profile.address}
                onChange={(e) => updateProfileConfig({ address: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Kota & Kode Pos</label>
              <input
                type="text"
                value={settings.profile.city}
                onChange={(e) => updateProfileConfig({ city: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">WhatsApp Customer Service</label>
              <input
                type="text"
                value={settings.profile.whatsapp}
                onChange={(e) => updateProfileConfig({ whatsapp: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Telepon Kantor</label>
              <input
                type="text"
                value={settings.profile.phone}
                onChange={(e) => updateProfileConfig({ phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Email Resmi</label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => updateProfileConfig({ email: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Akun Instagram</label>
              <input
                type="text"
                value={settings.profile.instagram}
                onChange={(e) => updateProfileConfig({ instagram: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Website Resmi</label>
              <input
                type="text"
                value={settings.profile.website}
                onChange={(e) => updateProfileConfig({ website: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Tautan Google Maps / Profil Bisnis</label>
              <input
                type="text"
                placeholder="https://share.google/..."
                value={settings.profile.googleMapsUrl || ''}
                onChange={(e) => updateProfileConfig({ googleMapsUrl: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">NPWP / Izin Badan Usaha</label>
              <input
                type="text"
                value={settings.profile.npwp}
                onChange={(e) => updateProfileConfig({ npwp: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Jam Buka Hari Kerja (Senin - Jumat)</label>
              <input
                type="text"
                value={settings.profile.openHoursWeekday}
                onChange={(e) => updateProfileConfig({ openHoursWeekday: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Jam Buka Akhir Pekan (Sabtu - Minggu)</label>
              <input
                type="text"
                value={settings.profile.openHoursWeekend}
                onChange={(e) => updateProfileConfig({ openHoursWeekend: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: PAJAK & REKENING PEMBAYARAN                                    */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Tax & Charges */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-400" />
              1. Tarif Pajak, Layanan & Biaya Administrasi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pajak PPN / PB1 */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Pajak Pertambahan Nilai (PPN)</span>
                  <input
                    type="checkbox"
                    checked={settings.paymentAndTax.taxEnabled}
                    onChange={(e) => updatePaymentAndTaxConfig({ taxEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Persentase Pajak (%)</label>
                  <input
                    type="number"
                    value={settings.paymentAndTax.taxRate}
                    disabled={!settings.paymentAndTax.taxEnabled}
                    onChange={(e) => updatePaymentAndTaxConfig({ taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Service Charge */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Biaya Layanan (Service Charge)</span>
                  <input
                    type="checkbox"
                    checked={settings.paymentAndTax.serviceChargeEnabled}
                    onChange={(e) => updatePaymentAndTaxConfig({ serviceChargeEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Persentase Service (%)</label>
                  <input
                    type="number"
                    value={settings.paymentAndTax.serviceChargeRate}
                    disabled={!settings.paymentAndTax.serviceChargeEnabled}
                    onChange={(e) =>
                      updatePaymentAndTaxConfig({ serviceChargeRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Default Freeze Fee */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div>
                  <span className="text-xs font-bold text-white block">Biaya Standar Freeze Member</span>
                  <span className="text-[10px] text-zinc-400">Tarif admin otomatis saat freeze</span>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Nominal Biaya (Rp)</label>
                  <input
                    type="number"
                    step={5000}
                    value={settings.paymentAndTax.defaultFreezeFee}
                    onChange={(e) =>
                      updatePaymentAndTaxConfig({ defaultFreezeFee: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                  />
                </div>
              </div>

              {/* Default Jatuh Tempo Cicilan */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Default Jatuh Tempo Cicilan</span>
                    <span className="text-[10px] text-zinc-400">Tenor pelunasan piutang paket</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {settings.paymentAndTax.defaultPaymentDueDays || 30} Hari
                  </span>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Durasi Hari Tenor</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={settings.paymentAndTax.defaultPaymentDueDays || 30}
                      onChange={(e) =>
                        updatePaymentAndTaxConfig({
                          defaultPaymentDueDays: Math.max(1, parseInt(e.target.value) || 1)
                        })
                      }
                      className="w-20 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold text-center"
                    />
                    <div className="flex gap-1 overflow-x-auto">
                      {[7, 14, 30, 40, 60].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => updatePaymentAndTaxConfig({ defaultPaymentDueDays: days })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            (settings.paymentAndTax.defaultPaymentDueDays || 30) === days
                              ? 'bg-amber-500 text-zinc-950 border-amber-400'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {days}H
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Accounts & QRIS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-400" />
                  2. Rekening Bank Penerimaan Transfer & QRIS
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Daftar rekening yang muncul pada struk, invoice tagihan cicilan, dan formulir bayar kasir.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingBank(true)}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Tambah Rekening</span>
              </button>
            </div>

            {/* QRIS Config Row */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Nama Merchant QRIS Dinamis</label>
                <input
                  type="text"
                  value={settings.paymentAndTax.qrisMerchantName}
                  onChange={(e) => updatePaymentAndTaxConfig({ qrisMerchantName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">NMID QRIS (National Merchant ID)</label>
                <input
                  type="text"
                  value={settings.paymentAndTax.qrisNmid}
                  onChange={(e) => updatePaymentAndTaxConfig({ qrisNmid: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Bank Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {settings.paymentAndTax.bankAccounts.map((bank) => (
                <div
                  key={bank.id}
                  className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                    bank.isDefault
                      ? 'bg-zinc-800/80 border-orange-500 ring-2 ring-orange-500/30'
                      : 'bg-zinc-950/60 border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm text-white">{bank.bankName}</span>
                      {bank.isDefault ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Rekening Utama
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultBank(bank.id)}
                          className="text-[10px] text-zinc-400 hover:text-white"
                        >
                          Set Utama
                        </button>
                      )}
                    </div>
                    <p className="font-mono text-base font-black text-orange-400 tracking-wider">
                      {bank.accountNumber}
                    </p>
                    <p className="text-xs text-zinc-300 mt-1 uppercase font-bold">a.n. {bank.accountHolder}</p>
                    {bank.notes && <p className="text-[10px] text-zinc-500 mt-1">{bank.notes}</p>}
                  </div>

                  <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteBank(bank.id)}
                      className="text-zinc-500 hover:text-rose-400 text-xs flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Add Bank */}
            {isAddingBank && (
              <form onSubmit={handleAddBank} className="p-4 rounded-2xl bg-zinc-950 border border-orange-500/40 space-y-3 animate-in fade-in">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Form Rekening Baru</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <select
                    value={newBank.bankName}
                    onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Bank BCA">Bank BCA</option>
                    <option value="Bank Mandiri">Bank Mandiri</option>
                    <option value="Bank BNI">Bank BNI</option>
                    <option value="Bank BRI">Bank BRI</option>
                    <option value="Bank Artha Graha">Bank Artha Graha</option>
                    <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
                    <option value="Bank Permata">Bank Permata</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Nomor Rekening..."
                    value={newBank.accountNumber}
                    onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
                  />

                  <input
                    type="text"
                    placeholder="Atas Nama Pemilik..."
                    value={newBank.accountHolder}
                    onChange={(e) => setNewBank({ ...newBank, accountHolder: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs"
                  />

                  <input
                    type="text"
                    placeholder="Catatan (opsional)..."
                    value={newBank.notes || ''}
                    onChange={(e) => setNewBank({ ...newBank, notes: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingBank(false)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                  >
                    Simpan Rekening
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB: TEMPLATE PESAN WHATSAPP                                       */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-400" />
                Template Notifikasi WhatsApp Otomatis
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kustomisasi teks pesan yang dikirimkan ke pelanggan saat bertransaksi, registrasi, atau pengingat jatuh tempo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => notifySuccess('Template Disimpan', 'Template pesan WhatsApp berhasil diperbarui.')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Template</span>
            </button>
          </div>

          {/* Operational WhatsApp Sync Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">Kontak WhatsApp Resmi Unit Cabang & Landing Page</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {branches.filter((b) => validateIndonesianWhatsApp(b.whatsapp).isValid).length} / {branches.length} Terverifikasi
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Seluruh pesan WhatsApp calon member dari pendaftaran landing page langsung terhubung ke nomor unit cabang masing-masing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopyBranchWaSummary}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 active:scale-95 cursor-pointer"
                title="Salin rekapitulasi kontak seluruh cabang ke clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Salin Clipboard</span>
              </button>

              <button
                type="button"
                onClick={handleExportBranchWaCsv}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 active:scale-95 cursor-pointer"
                title="Unduh daftar kontak WhatsApp cabang format CSV"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Unduh CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBranchWaModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verifikasi & Edit</span>
              </button>
            </div>
          </div>

          {/* Quick Variable Reference */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-bold text-zinc-300">Variabel Tersedia:</span>
            {['[CUSTOMER_NAME]', '[MEMBER_NAME]', '[MEMBER_ID]', '[STORE_NAME]', '[INVOICE_NO]', '[AMOUNT]', '[EXPIRY_DATE]', '[REMAINING_AMOUNT]'].map((v) => (
              <code key={v} className="px-2 py-0.5 rounded-md bg-zinc-900 text-orange-400 border border-zinc-800 font-mono">
                {v}
              </code>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. Struk Pembayaran POS */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>1. Struk Transaksi POS / Retail</span>
                <span className="text-[10px] text-zinc-400">Kasir POS</span>
              </label>
              <textarea
                rows={7}
                value={settings.templates.posReceiptTemplate}
                onChange={(e) => updateTemplatesConfig({ posReceiptTemplate: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* 2. Sambutan Member Baru */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>2. Sambutan Member Baru & Pass Card</span>
                <span className="text-[10px] text-zinc-400">Front Desk</span>
              </label>
              <textarea
                rows={7}
                value={settings.templates.memberWelcomeTemplate}
                onChange={(e) => updateTemplatesConfig({ memberWelcomeTemplate: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* 3. Pengingat Piutang */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>3. Pengingat Tagihan Cicilan Piutang</span>
                <span className="text-[10px] text-zinc-400">Buku Piutang</span>
              </label>
              <textarea
                rows={7}
                value={settings.templates.piutangReminderTemplate}
                onChange={(e) => updateTemplatesConfig({ piutangReminderTemplate: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* 4. Pengingat Expired Membership */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>4. Pengingat Masa Aktif Habis (Renewal)</span>
                <span className="text-[10px] text-zinc-400">CRM & Leads</span>
              </label>
              <textarea
                rows={7}
                value={settings.templates.expiryReminderTemplate}
                onChange={(e) => updateTemplatesConfig({ expiryReminderTemplate: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-TAB: BACKUP, RESTORE & DATA RESET                                  */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Backup Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ekspor & Backup Seluruh Data</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Unduh salinan cadangan lengkap mencakup data member, transaksi kasir, inventaris mesin, jadwal staf, dan seluruh konfigurasi printer dalam file JSON aman.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan (.JSON)</span>
              </button>
            </div>

            {/* Restore Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Impor & Pulihkan Data (Restore)</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Unggah file backup JSON dari komputer lain untuk memulihkan seluruh data dan pengaturan secara instan tanpa mengulang input manual.
                  </p>
                </div>
              </div>

              <label className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer text-center">
                <Upload className="w-4 h-4 text-orange-400" />
                <span>Pilih File Backup (.JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Google Sheets Cloud Sync Card */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Sinkronisasi Cloud ke Google Sheets & Drive</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Workspace Ready
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  Ekspor database member, presensi sesi PT, transaksi POS, dan stok produk langsung ke spreadsheet di Google Drive Anda secara aman.
                </p>
              </div>
            </div>

            {onNavigateToGoogleSheets && (
              <button
                type="button"
                onClick={onNavigateToGoogleSheets}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-md flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Buka Google Sheets Sync</span>
              </button>
            )}
          </div>

          {/* Reset Factory Settings */}
          <div className="bg-zinc-900 border border-rose-900/40 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Kembalikan Pengaturan ke Bawaan (Factory Reset)</h4>
                <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
                  Tindakan ini akan mengembalikan konfigurasi printer, matriks role, dan identitas toko ke nilai standar GymPro Enterprise. Data transaksi penjualan dan member tetap aman.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin mereset seluruh konfigurasi ke nilai bawaan?')) {
                  resetSettingsToDefault();
                  resetRolePermissionsToDefault();
                  notifySuccess('Sistem Direset', 'Semua pengaturan telah dikembalikan ke default.');
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition shrink-0 cursor-pointer"
            >
              Reset Pengaturan Bawaan
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB: LANDING PAGE CMS & VISUAL                                       */}
      {/* ========================================================================= */}
      {activeTab === 'landing' && (
        <LandingSettingsView
          showToast={showToast}
          onPreviewLanding={onPreviewLanding}
        />
      )}

      {/* Modal Verifikasi & Ekspor Kontak WhatsApp Cabang */}
      <BranchWhatsAppVerificationModal
        isOpen={isBranchWaModalOpen}
        onClose={() => setIsBranchWaModalOpen(false)}
        branches={branches}
        onUpdateBranch={updateBranch}
        showToast={showToast}
      />

      {/* Modal Pratinjau Struk POS & ReceiptModal */}
      {testReceiptTrx && (
        <ReceiptModal
          isOpen={Boolean(testReceiptTrx)}
          transaction={testReceiptTrx}
          onClose={() => setTestReceiptTrx(null)}
        />
      )}
    </div>
  );
};

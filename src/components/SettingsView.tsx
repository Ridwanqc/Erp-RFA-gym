import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import {
  User,
  UserRole,
  PrinterPaperWidth,
  PrinterConnectionType,
  BankAccountConfig,
  RoleActionPermissions
} from '../types';
import { useSettings } from '../context/SettingsContext';
import { SYSTEM_MODULES } from '../data/settingsData';
import { formatRp } from '../utils/formatters';

interface SettingsViewProps {
  currentUser: User | null;
  staffUsers: User[];
  onUpdateStaffRole?: (staffId: string, newRole: UserRole) => void;
  allSystemData?: any;
  onRestoreSystemData?: (data: any) => void;
  showToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  initialSubTab?: 'printer' | 'roles' | 'profile' | 'finance' | 'templates' | 'backup';
}

type SettingsSubTab = 'printer' | 'roles' | 'profile' | 'finance' | 'templates' | 'backup';

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  staffUsers,
  onUpdateStaffRole,
  allSystemData,
  onRestoreSystemData,
  showToast,
  initialSubTab = 'printer'
}) => {
  const {
    settings,
    roles,
    updatePrinterConfig,
    updateProfileConfig,
    updatePaymentAndTaxConfig,
    updateTemplatesConfig,
    updateRolePermission,
    resetRolePermissionsToDefault,
    resetSettingsToDefault,
    executeTestPrint
  } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsSubTab>(initialSubTab);

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

          <div className="flex items-center gap-2 shrink-0">
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
            { id: 'roles', label: 'Manajemen Role & Akses', icon: ShieldCheck, badge: 'RBAC' },
            { id: 'profile', label: 'Profil Usaha & Cabang', icon: Building2 },
            { id: 'finance', label: 'Pajak & Rekening Kas', icon: CreditCard },
            { id: 'templates', label: 'Template Pesan WA', icon: MessageSquare },
            { id: 'backup', label: 'Backup & Database', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsSubTab)}
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

              {/* Ukuran Kertas Thermal */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">
                  Lebar Kertas Struk Thermal
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: '58mm', name: '58 mm', desc: 'Mini / Kasir Mobile (32 Col)' },
                    { id: '80mm', name: '80 mm', desc: 'Standar POS Kasir (48 Col)' },
                    { id: 'a4', name: 'A4 / Invoice', desc: 'Faktur Lembar Penuh' }
                  ].map((size) => {
                    const isSel = settings.printer.paperWidth === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => handlePaperWidthChange(size.id as PrinterPaperWidth)}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                          isSel
                            ? 'bg-zinc-800 border-orange-500 ring-2 ring-orange-500/30'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <p className="text-xs font-bold text-white">{size.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{size.desc}</p>
                      </button>
                    );
                  })}
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

          {/* Right Live Preview: Thermal Receipt */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-orange-400" />
                  Pratinjau Struk Thermal Nyata
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  {settings.printer.paperWidth.toUpperCase()}
                </span>
              </div>

              {/* Thermal Paper Realistic Mockup */}
              <div className="bg-zinc-950 p-4 sm:p-6 rounded-2xl flex justify-center border border-zinc-800 shadow-inner">
                <div
                  className={`bg-white text-zinc-900 rounded-lg p-4 font-mono shadow-2xl border-t-4 border-orange-500 transition-all ${
                    settings.printer.paperWidth === '58mm' ? 'w-full max-w-[260px] text-[11px]' : 'w-full max-w-[340px] text-xs'
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
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={executeTestPrint}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk Uji Coba</span>
                </button>
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetRole(selectedRoleKey)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5"
                  title="Kembalikan izin role ini ke standar bawaan"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Reset Bawaan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGrantAll(selectedRoleKey)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold transition"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleRevokeAll(selectedRoleKey)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-bold transition"
                >
                  Cabut Semua
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
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="kasir">Kasir</option>
                        <option value="leader_pt">Leader PT</option>
                        <option value="pt">PT</option>
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
      {/* 3. SUB-TAB: PROFIL USAHA & CABANG                                         */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-400" />
                Identitas Pusat Kebugaran & Outlet Cabang
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    </div>
  );
};

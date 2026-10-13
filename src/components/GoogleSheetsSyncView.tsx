import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Layers,
  Copy,
  FolderOpen,
  Calendar,
  Users,
  CreditCard,
  Package,
  Dumbbell,
  Clock,
  Sparkles,
  LogOut,
  Info,
  Briefcase,
  Receipt,
  CalendarCheck,
  Crown
} from 'lucide-react';
import { Member, Transaction, Product, Schedule, User as AppUser, CompanyExpense, Attendance, PackageItem } from '../types';
import {
  auth,
  signInWithGoogle,
  logOutFirebase,
  getAccessToken,
  setCachedAccessToken
} from '../lib/firebase';
import {
  createGymSpreadsheet,
  listUserSpreadsheets,
  readSpreadsheetRange,
  appendSpreadsheetRows,
  syncOverwriteSheet,
  syncAllGymDataToSpreadsheet,
  GoogleSpreadsheetItem
} from '../lib/googleSheetsService';
import { formatRp, formatDateIndo, APP_TODAY } from '../utils/formatters';

interface GoogleSheetsSyncViewProps {
  currentUser: AppUser | null;
  members: Member[];
  transactions: Transaction[];
  products: Product[];
  schedules: Schedule[];
  staffUsers?: AppUser[];
  expenses?: CompanyExpense[];
  attendances?: Attendance[];
  packages?: PackageItem[];
  onImportMembers?: (newMembers: Member[]) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  activeSpreadsheetId?: string;
  onSetActiveSpreadsheetId?: (id: string) => void;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: (enabled: boolean) => void;
  lastSyncTime?: string | null;
  isAutoSyncing?: boolean;
  onTriggerInstantSync?: () => Promise<void>;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({
  currentUser,
  members,
  transactions,
  products,
  schedules,
  staffUsers = [],
  expenses = [],
  attendances = [],
  packages = [],
  onImportMembers,
  showToast,
  activeSpreadsheetId,
  onSetActiveSpreadsheetId,
  autoSyncEnabled = true,
  onToggleAutoSync,
  lastSyncTime,
  isAutoSyncing = false,
  onTriggerInstantSync
}) => {
  const [googleUser, setGoogleUser] = useState<any>(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active subtab: 'create' | 'sync-existing' | 'import'
  const [activeTab, setActiveTab] = useState<'create' | 'sync-existing' | 'import'>('create');

  // New spreadsheet form
  const [spreadsheetTitle, setSpreadsheetTitle] = useState(
    `GymPro ERP Database - ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`
  );
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeMembers, setIncludeMembers] = useState(true);
  const [includeStaff, setIncludeStaff] = useState(true);
  const [includeSchedules, setIncludeSchedules] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeAttendances, setIncludeAttendances] = useState(true);
  const [includePackages, setIncludePackages] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [lastCreatedSheet, setLastCreatedSheet] = useState<{ id: string; url: string } | null>(
    null
  );

  // User drive sheets
  const [driveSheets, setDriveSheets] = useState<GoogleSpreadsheetItem[]>([]);
  const [isLoadingDriveSheets, setIsLoadingDriveSheets] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [customExistingUrl, setCustomExistingUrl] = useState('');

  // Sync / Overwrite Confirmation Modal State (Mandatory per Skill)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingSyncAction, setPendingSyncAction] = useState<'append' | 'overwrite' | null>(null);
  const [isSyncingExisting, setIsSyncingExisting] = useState(false);

  // Import states
  const [importSheetId, setImportSheetId] = useState('');
  const [importRange, setImportRange] = useState("'Database Member'!A1:H50");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);

  // Init auth token on mount
  useEffect(() => {
    getAccessToken().then((cached) => {
      if (cached) {
        setToken(cached);
      }
    });

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setGoogleUser(user);
      const currentToken = await getAccessToken();
      setToken(currentToken);
      if (user && currentToken) {
        loadUserDriveFiles(currentToken);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserDriveFiles = async (authToken: string) => {
    try {
      setIsLoadingDriveSheets(true);
      const list = await listUserSpreadsheets(authToken);
      setDriveSheets(list);
      if (list.length > 0 && !selectedExistingId) {
        setSelectedExistingId(list[0].id);
      }
    } catch (err: any) {
      console.warn('Could not auto-load Google Drive sheets:', err.message);
    } finally {
      setIsLoadingDriveSheets(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      const result = await signInWithGoogle();
      if (result) {
        setGoogleUser(result.user);
        setToken(result.accessToken);
        showToast(
          'Terhubung ke Google',
          `Berhasil login sebagai ${result.user.displayName || result.user.email} dengan akses Google Sheets.`,
          'success'
        );
        loadUserDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      showToast(
        'Gagal Login Google',
        err.message || 'Izin Google Workspace diperlukan untuk menggunakan Google Sheets.',
        'error'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    await logOutFirebase();
    setGoogleUser(null);
    setToken(null);
    setDriveSheets([]);
    showToast('Terputus', 'Akun Google telah dinonaktifkan dari sesi ini.', 'info');
  };

  // 1. Create New Spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    if (!token) {
      showToast('Autentikasi Diperlukan', 'Silakan hubungkan akun Google terlebih dahulu.', 'warning');
      return;
    }

    try {
      setIsExporting(true);
      const result = await createGymSpreadsheet(token, {
        title: spreadsheetTitle,
        transactions: includeTransactions ? transactions : [],
        members: includeMembers ? members : [],
        staffUsers: includeStaff ? staffUsers : [],
        schedules: includeSchedules ? schedules : [],
        expenses: includeExpenses ? expenses : [],
        products: includeProducts ? products : [],
        attendances: includeAttendances ? attendances : [],
        packages: includePackages ? packages : []
      });

      setLastCreatedSheet({ id: result.spreadsheetId, url: result.spreadsheetUrl });
      onSetActiveSpreadsheetId?.(result.spreadsheetId);
      onToggleAutoSync?.(true);
      try {
        localStorage.setItem('gympro_active_spreadsheet_id', result.spreadsheetId);
        localStorage.setItem('gympro_sheets_autosync', 'true');
      } catch {}

      showToast(
        'Spreadsheet Berhasil Dibuat & Auto-Sync Aktif!',
        `Data berhasil diekspor. Setiap data baru atau dihapus kini otomatis tersinkron ke spreadsheet ini.`,
        'success'
      );
      // Reload drive file list
      loadUserDriveFiles(token);
    } catch (err: any) {
      showToast('Gagal Membuat Spreadsheet', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Extract spreadsheet ID from url if provided
  const extractSpreadsheetId = (input: string) => {
    if (!input) return '';
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  // 2. Sync to Existing Spreadsheet
  const handleExecuteSync = async () => {
    setConfirmModalOpen(false);
    const targetId = extractSpreadsheetId(customExistingUrl) || selectedExistingId;

    if (!token || !targetId) {
      showToast('Peringatan', 'Pilih atau masukkan ID Google Spreadsheet tujuan.', 'warning');
      return;
    }

    try {
      setIsSyncingExisting(true);
      if (pendingSyncAction === 'overwrite') {
        const res = await syncAllGymDataToSpreadsheet(token, targetId, {
          members,
          transactions,
          schedules,
          products,
          staffUsers,
          expenses,
          attendances,
          packages
        });

        showToast(
          'Sinkronisasi 8 Modul Berhasil (Overwrite)',
          `Seluruh data sistem (${res.counts.members} Member, ${res.counts.transactions} Transaksi, ${res.counts.staff} Staf, ${res.counts.expenses} Beban, ${res.counts.attendances} Presensi, dll.) telah diperbarui di Google Sheets.`,
          'success'
        );
      } else {
        // Append new transactions
        const newTrxRows = transactions.slice(0, 15).map((t) => [
          t.id,
          t.date,
          t.time,
          t.customer,
          t.type,
          t.desc,
          t.amount,
          t.method,
          t.status
        ]);
        await appendSpreadsheetRows(token, targetId, 'Ringkasan & Transaksi', newTrxRows);

        showToast(
          'Baris Baru Berhasil Ditambahkan',
          `${newTrxRows.length} data transaksi berhasil dimasukkan ke Google Sheets.`,
          'success'
        );
      }
    } catch (err: any) {
      showToast('Gagal Sinkronisasi', err.message || 'Periksa izin spreadsheet.', 'error');
    } finally {
      setIsSyncingExisting(false);
    }
  };

  // 3. Preview & Import Data from Google Sheets
  const handleLoadPreview = async () => {
    const targetId = extractSpreadsheetId(importSheetId);
    if (!token || !targetId) {
      showToast('Peringatan', 'Masukkan Spreadsheet ID atau URL Google Sheets yang valid.', 'warning');
      return;
    }

    try {
      setIsLoadingPreview(true);
      const rows = await readSpreadsheetRange(token, targetId, importRange);
      setPreviewRows(rows);
      if (rows.length === 0) {
        showToast('Info', 'Rentang sheet kosong atau tidak ada data.', 'info');
      } else {
        showToast('Data Dimuat', `Berhasil membaca ${rows.length} baris dari Google Sheets.`, 'success');
      }
    } catch (err: any) {
      showToast('Gagal Membaca Data', err.message, 'error');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleApplyImportMembers = () => {
    if (previewRows.length <= 1) {
      showToast('Peringatan', 'Tidak ada data member untuk diimpor (hanya baris header atau kosong).', 'warning');
      return;
    }

    // Skip header row
    const dataOnly = previewRows.slice(1);
    const newMembers: Member[] = dataOnly
      .filter((r) => r[1]) // has name
      .map((r, idx) => ({
        id: r[0] || `MBR-IMP-${Date.now()}-${idx}`,
        name: r[1],
        phone: r[2] || '0812000000',
        expired: r[5] || APP_TODAY,
        ptQuota: parseInt(r[7] || '0', 10) || 0,
        picId: 'STAFF-001',
        picName: 'Resepsionis',
        followUpStatus: 'Aktif',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        membershipType: 'MEMBER',
        joinDate: r[4] || APP_TODAY,
        status: (r[6] as any) || 'AKTIF',
        idNumber: r[8] || ''
      }));

    if (onImportMembers) {
      onImportMembers(newMembers);
      showToast(
        'Impor Berhasil',
        `${newMembers.length} member baru dari Google Sheets berhasil dimasukkan ke sistem.`,
        'success'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-2xl shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Integrasi Google Sheets & Drive
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Ekspor rekapitulasi keuangan, database member, presensi sesi PT, dan katalog produk langsung ke Google Spreadsheet di Google Drive Anda.
              </p>
            </div>
          </div>

          {/* Auth Connection Status Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
            {googleUser && token ? (
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <div className="flex items-center gap-2.5">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full border border-emerald-500/50"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                      {googleUser.email?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-xs font-bold text-white truncate max-w-[150px]">
                        {googleUser.displayName || 'Akun Google'}
                      </p>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate max-w-[170px]">
                      {googleUser.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                  title="Putuskan sambungan Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isAuthenticating ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Google Sheets Auto-Sync Status Card */}
      <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${
                autoSyncEnabled && activeSpreadsheetId
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${isAutoSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Sinkronisasi Otomatis Google Sheets (Real-Time Auto-Sync)
                </h3>
                {autoSyncEnabled && activeSpreadsheetId ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Aktif & Otomatis Terupdate
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Auto-Sync Nonaktif
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-3xl">
                Setiap penambahan data baru, perubahan, maupun penghapusan (Database Member, Ringkasan Transaksi POS, Jadwal Sesi PT, dan Katalog Produk) akan otomatis diekspor dan tersinkronisasi langsung ke Google Spreadsheet Anda.
              </p>

              {activeSpreadsheetId ? (
                <div className="mt-2.5 flex items-center gap-3 text-xs flex-wrap">
                  <span className="text-zinc-400 font-mono text-[11px] bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                    ID Target: {activeSpreadsheetId}
                  </span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 text-[11px] underline"
                  >
                    Buka Spreadsheet di Google Sheets <ExternalLink className="w-3 h-3" />
                  </a>
                  {lastSyncTime && (
                    <span className="text-[11px] text-zinc-400">
                      • Terakhir sinkron: <strong className="text-white">{lastSyncTime}</strong>
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-amber-400 mt-2 font-medium">
                  ℹ️ Buat spreadsheet baru di bawah atau pilih spreadsheet dari Google Drive Anda untuk menetapkan target sinkronisasi otomatis.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
            {onTriggerInstantSync && activeSpreadsheetId && (
              <button
                type="button"
                onClick={onTriggerInstantSync}
                disabled={isAutoSyncing || !token}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                title="Kirim seluruh data terkini ke Google Sheets sekarang"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                <span>{isAutoSyncing ? 'Menyinkronkan...' : '⚡ Sinkronkan Sekarang'}</span>
              </button>
            )}

            {onToggleAutoSync && (
              <button
                type="button"
                onClick={() => onToggleAutoSync(!autoSyncEnabled)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  autoSyncEnabled
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                }`}
              >
                <span>Auto-Sync: {autoSyncEnabled ? 'AKTIF' : 'NONAKTIF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Data Summary Pills */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">Database Member:</span>
            <strong className="text-white font-mono">{members.length} data</strong>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">Ringkasan Transaksi:</span>
            <strong className="text-white font-mono">{transactions.length} data</strong>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">Staf & Karyawan:</span>
            <strong className="text-white font-mono">{staffUsers.length} data</strong>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">Jadwal Sesi PT:</span>
            <strong className="text-white font-mono">{schedules.length} data</strong>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">Pengeluaran & Beban:</span>
            <strong className="text-white font-mono">{expenses.length} data</strong>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">Katalog Produk:</span>
            <strong className="text-white font-mono">{products.length} data</strong>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">Presensi Masuk:</span>
            <strong className="text-white font-mono">{attendances.length} data</strong>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">Master Paket:</span>
            <strong className="text-white font-mono">{packages.length} data</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 w-fit flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'create'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <CloudUpload className="w-3.5 h-3.5" />
          <span>Buat Spreadsheet Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sync-existing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'sync-existing'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sinkronkan ke File yang Ada</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'import'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Impor Member dari Google Sheets</span>
        </button>
      </div>

      {/* TAB 1: CREATE NEW SPREADSHEET */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-emerald-400" />
                <span>Konfigurasi Ekspor Spreadsheet Baru</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Sistem akan membuat Google Spreadsheet multi-tab di akun Google Drive Anda secara otomatis.
              </p>
            </div>

            {/* Title input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Judul Google Spreadsheet:</label>
              <input
                type="text"
                value={spreadsheetTitle}
                onChange={(e) => setSpreadsheetTitle(e.target.value)}
                placeholder="Contoh: GymPro ERP Database 2026"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Checkbox data components */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-300">Pilih Data yang Akan Diekspor:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Transaksi */}
                <label className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={includeTransactions}
                    onChange={(e) => setIncludeTransactions(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Transaksi & Keuangan</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{transactions.length} record</p>
                  </div>
                </label>

                {/* 2. Database Member */}
                <label className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={includeMembers}
                    onChange={(e) => setIncludeMembers(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>Database Member</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{members.length} member</p>
                  </div>
                </label>

                {/* 3. Staf & Karyawan */}
                <label className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={includeStaff}
                    onChange={(e) => setIncludeStaff(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Staf & Karyawan</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{staffUsers.length} karyawan</p>
                  </div>
                </label>

                {/* 4. Jadwal PT */}
                <label className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={includeSchedules}
                    onChange={(e) => setIncludeSchedules(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
                      <span>Jadwal & Presensi Sesi PT</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{schedules.length} sesi</p>
                  </div>
                </label>

                {/* 5. Pengeluaran & Beban */}
                <label className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={includeExpenses}
                    onChange={(e) => setIncludeExpenses(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-rose-400" />
                      <span>Pengeluaran & Beban</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{expenses.length} beban operasional</p>
                  </div>
                </label>

                {/* 6. Produk */}
                <label className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={includeProducts}
                    onChange={(e) => setIncludeProducts(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-400" />
                      <span>Katalog & Stok Produk</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{products.length} produk</p>
                  </div>
                </label>

                {/* 7. Presensi Kunjungan */}
                <label className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={includeAttendances}
                    onChange={(e) => setIncludeAttendances(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span>Presensi Masuk Gerbang</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{attendances.length} kunjungan</p>
                  </div>
                </label>

                {/* 8. Master Paket */}
                <label className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={includePackages}
                    onChange={(e) => setIncludePackages(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Katalog Master Paket</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{packages.length} paket</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCreateNewSpreadsheet}
                disabled={isExporting || !token}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Membuat Spreadsheet di Google Drive...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Buat & Ekspor ke Google Sheets</span>
                  </>
                )}
              </button>
            </div>

            {/* Success card if created */}
            {lastCreatedSheet && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-200">
                      Spreadsheet Berhasil Dibuat!
                    </span>
                  </div>
                  <a
                    href={lastCreatedSheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <span>Buka Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-[11px] text-zinc-400">
                  ID: <code className="text-emerald-400 font-mono text-[10px]">{lastCreatedSheet.id}</code>
                </p>
              </div>
            )}
          </div>

          {/* Quick Info / Tips Column */}
          <div className="space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Format Tab yang Dihasilkan</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-white">Ringkasan & Transaksi:</strong> Berisi ID struk, tanggal, pelanggan, metode bayar, dan total omzet.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-white">Database Member:</strong> Nama lengkap, nomor WhatsApp, paket aktif, dan sisa sesi PT.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-white">Jadwal Sesi PT:</strong> Jadwal pertemuan, pelatih pendamping, dan status validasi tanda tangan.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-white">Katalog Produk:</strong> Daftar suplemen, minuman mineral, harga jual, dan sisa stok fisik.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-3xl p-5 space-y-2 text-xs">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Akses & Keamanan Data</span>
              </p>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Spreadsheet dibuat langsung di Google Drive Anda sendiri tanpa perantara server pihak ketiga. Token akses Google dikelola aman di memori browser pengguna.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYNC TO EXISTING SPREADSHEET */}
      {activeTab === 'sync-existing' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Sinkronkan ke File Google Spreadsheet yang Sudah Ada</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Pilih spreadsheet dari Google Drive Anda atau masukkan tautan URL spreadsheet yang ingin diperbarui.
            </p>
          </div>

          {/* Drive file list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300">File Spreadsheet di Google Drive Anda:</label>
              {token && (
                <button
                  type="button"
                  onClick={() => loadUserDriveFiles(token)}
                  disabled={isLoadingDriveSheets}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingDriveSheets ? 'animate-spin' : ''}`} />
                  <span>Muat Ulang Drive</span>
                </button>
              )}
            </div>

            {driveSheets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                {driveSheets.map((item) => {
                  const isSelected = selectedExistingId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedExistingId(item.id);
                        setCustomExistingUrl('');
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="font-bold text-xs truncate">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                          ID: {item.id}
                        </p>
                      </div>
                      <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-zinc-500 hover:text-emerald-400 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                {token ? 'Tidak ditemukan file spreadsheet di Google Drive Anda.' : 'Silakan login Google untuk melihat file.'}
              </p>
            )}
          </div>

          {/* Or custom URL */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="text-xs font-bold text-zinc-300">
              Atau Masukkan Tautan / ID Spreadsheet Kustom:
            </label>
            <input
              type="text"
              value={customExistingUrl}
              onChange={(e) => {
                setCustomExistingUrl(e.target.value);
                setSelectedExistingId('');
              }}
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Sync action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Action 1: Append */}
            <button
              type="button"
              disabled={isSyncingExisting || !token || (!selectedExistingId && !customExistingUrl)}
              onClick={() => {
                setPendingSyncAction('append');
                setConfirmModalOpen(true);
              }}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 border border-zinc-700 disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tambahkan Transaksi Baru (Append Rows)</span>
            </button>

            {/* Action 2: Overwrite (Destructive - requires confirmation dialog) */}
            <button
              type="button"
              disabled={isSyncingExisting || !token || (!selectedExistingId && !customExistingUrl)}
              onClick={() => {
                setPendingSyncAction('overwrite');
                setConfirmModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Perbarui Seluruh Data (Overwrite Tabs)</span>
            </button>

            {/* Action 3: Set as Auto-Sync Target */}
            <button
              type="button"
              disabled={!token || (!selectedExistingId && !customExistingUrl)}
              onClick={() => {
                const targetId = extractSpreadsheetId(customExistingUrl) || selectedExistingId;
                if (!targetId) return;
                onSetActiveSpreadsheetId?.(targetId);
                onToggleAutoSync?.(true);
                try {
                  localStorage.setItem('gympro_active_spreadsheet_id', targetId);
                  localStorage.setItem('gympro_sheets_autosync', 'true');
                } catch {}
                showToast(
                  'Target Auto-Sync Ditetapkan',
                  `Spreadsheet ID ${targetId} telah dijadikan target sinkronisasi otomatis. Setiap data yang diinput dan dihapus kini otomatis terupdate ke spreadsheet ini!`,
                  'success'
                );
              }}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-orange-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jadikan Target Auto-Sync Otomatis</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT MEMBERS FROM GOOGLE SHEETS */}
      {activeTab === 'import' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Impor Data Member dari Google Sheets</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Baca daftar member dari Google Sheets dan masukkan ke database lokal GymPro ERP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Spreadsheet ID atau URL:</label>
              <input
                type="text"
                value={importSheetId}
                onChange={(e) => setImportSheetId(e.target.value)}
                placeholder="ID Spreadsheet (misal: 1BxiMVs0XRA5...)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Nama Sheet & Rentang Sel:</label>
              <input
                type="text"
                value={importRange}
                onChange={(e) => setImportRange(e.target.value)}
                placeholder="'Database Member'!A1:I100"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isLoadingPreview || !token || !importSheetId}
              onClick={handleLoadPreview}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 border border-zinc-700 disabled:opacity-50 cursor-pointer"
            >
              {isLoadingPreview ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Membaca dari Google Sheets...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pratinjau Data Sheets</span>
                </>
              )}
            </button>

            {previewRows.length > 1 && (
              <button
                type="button"
                onClick={handleApplyImportMembers}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Impor {previewRows.length - 1} Member ke GymPro</span>
              </button>
            )}
          </div>

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold text-white">
                  Pratinjau Hasil Pembacaan ({previewRows.length} baris):
                </span>
                <span>Baris 1 dianggap sebagai Judul Kolom</span>
              </div>
              <div className="overflow-x-auto max-h-72 border border-zinc-800 rounded-2xl bg-zinc-950">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400">
                    <tr>
                      {previewRows[0]?.map((col: any, idx: number) => (
                        <th key={idx} className="py-2.5 px-3 font-bold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-[11px] text-zinc-300">
                    {previewRows.slice(1, 15).map((row: any[], rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-zinc-900/50">
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="py-2 px-3">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE / OVERWRITE OPERATIONS (Skill Requirement) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Konfirmasi Sinkronisasi</h4>
                <p className="text-xs text-zinc-400">Tindakan ini akan memodifikasi Google Spreadsheet Anda</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-300 space-y-2">
              {pendingSyncAction === 'overwrite' ? (
                <>
                  <p className="font-bold text-rose-400">
                    ⚠️ Peringatan Overwrite Tab:
                  </p>
                  <p className="leading-relaxed">
                    Data pada tab <strong className="text-white">'Database Member'</strong> dan <strong className="text-white">'Ringkasan & Transaksi'</strong> di spreadsheet tujuan akan digantikan dengan data saat ini ({members.length} member & {transactions.length} transaksi).
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-emerald-400">
                    Penambahan Baris Baru (Append):
                  </p>
                  <p className="leading-relaxed">
                    Sistem akan menambahkan baris data transaksi terbaru ke baris terbawah tab 'Ringkasan & Transaksi'.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-md cursor-pointer ${
                  pendingSyncAction === 'overwrite'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Ya, Lanjutkan Sinkronisasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

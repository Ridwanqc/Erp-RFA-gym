import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Menu,
  ShieldAlert,
  LogOut,
  Flame,
  ChevronDown,
  User as UserIcon,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Settings,
  Printer,
  Building2,
  Check,
  Plus,
  X
} from 'lucide-react';
import { User } from '../types';
import { formatDateIndo, APP_TODAY } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

interface HeaderProps {
  currentUser: User | null;
  pageTitle?: string;
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  isStoreClosed?: boolean;
  staffUsers?: User[];
  onSwitchUser?: (userId: string) => void;
  onLogout?: () => void;
  firebaseConnected?: boolean;
  onOpenSettings?: (subTab?: 'printer' | 'roles' | 'profile' | 'branches' | 'finance' | 'templates' | 'backup') => void;
  onOpenAddBranchModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pageTitle = 'GymPro ERP Enterprise',
  onToggleSidebar,
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  isStoreClosed,
  staffUsers = [],
  onSwitchUser,
  onLogout,
  firebaseConnected = true,
  onOpenSettings,
  onOpenAddBranchModal
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const branchMenuRef = useRef<HTMLDivElement | null>(null);
  const { openThemeModal, currentAccent, theme } = useTheme();
  const { branches, activeBranchId, activeBranch, setActiveBranchId } = useSettings();

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsBranchOpen(false);
      }
    };
    if (isProfileOpen || isBranchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen, isBranchOpen]);

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-5 lg:px-6 z-30 shrink-0 bg-[#09090b]/90 backdrop-blur-md sticky top-0 w-full">
      {/* Left: Hamburger Toggles & Brand Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger (< 1024px) */}
        <button
          id="btn-toggle-sidebar-mobile"
          className="lg:hidden text-zinc-300 hover:text-white p-2.5 rounded-xl hover:bg-zinc-800/80 active:scale-95 transition flex items-center justify-center min-w-[44px] min-h-[44px]"
          onClick={onToggleMobileSidebar}
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5 text-orange-400" />
        </button>

        {/* Desktop Collapse / Expand Toggle (>= 1024px) */}
        {onToggleSidebar && (
          <button
            id="btn-toggle-sidebar-desktop"
            className="hidden lg:flex text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition items-center justify-center"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Perluas Sidebar (Desktop)' : 'Ciutkan Sidebar (Desktop)'}
            aria-label="Toggle collapse sidebar desktop"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-orange-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-zinc-400" />
            )}
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base lg:text-lg font-black text-white tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{pageTitle}</span>
            {isStoreClosed && (
              <span className="shrink-0 text-[10px] uppercase font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span className="hidden xs:inline">Toko Ditutup</span>
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Right: Cloud Sync, Date & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Firebase Cloud Status Indicator */}
        <div
          title={firebaseConnected ? 'Terkoneksi ke Cloud Firestore' : 'Mode Offline / Transien'}
          className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2 sm:px-2.5 py-1.5 rounded-xl border border-amber-500/20"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span className="hidden md:inline text-[11px] font-bold text-amber-200">Cloud Sync</span>
        </div>

        {/* Current Date Widget (hidden on mobile, visible on sm) */}
        <div className="hidden sm:flex text-xs font-semibold text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 items-center shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-orange-500 mr-2 shrink-0" />
          <span className="whitespace-nowrap">{formatDateIndo(APP_TODAY)}</span>
        </div>

        {/* PWA Install Button (Android / iOS / Desktop) */}
        <PWAInstallButton variant="compact" />

        {/* Quick Theme Settings Button */}
        <button
          type="button"
          id="btn-header-theme-toggle"
          onClick={openThemeModal}
          className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95 min-h-[44px]"
          title={`Pengaturan Tema (${theme.mode} • Aksen ${currentAccent.name})`}
          aria-label="Buka Pengaturan Tema"
        >
          <Palette className="w-4 h-4 text-orange-400 shrink-0" />
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: currentAccent.hex }}
            title={`Aksen Aktif: ${currentAccent.name}`}
          />
          <span className="hidden xl:inline text-[11px] font-bold">Tema</span>
        </button>

        {/* Quick System Settings Shortcut */}
        {onOpenSettings && (
          <button
            type="button"
            id="btn-header-settings-shortcut"
            onClick={() => onOpenSettings('printer')}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95 min-h-[44px]"
            title="Pengaturan Printer & Sistem"
            aria-label="Buka Pengaturan Printer"
          >
            <Printer className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="hidden xl:inline text-[11px] font-bold">Printer</span>
          </button>
        )}

        {/* Branch Selector Dropdown */}
        <div className="relative" ref={branchMenuRef}>
          <button
            type="button"
            id="btn-header-branch-switcher"
            onClick={() => setIsBranchOpen(!isBranchOpen)}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95 min-h-[44px] cursor-pointer"
            title={`Cabang Aktif: ${activeBranch?.name}`}
            aria-label="Pilih Cabang Aktif"
            aria-expanded={isBranchOpen}
          >
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Cabang</span>
              <span className="text-xs font-bold text-white max-w-[110px] lg:max-w-[140px] truncate">
                {activeBranch?.name || 'Cabang'}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                isBranchOpen ? 'rotate-180 text-emerald-400' : ''
              }`}
            />
          </button>

          {isBranchOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pilih Cabang Aktif</span>
                  </p>
                  <p className="text-[10px] text-zinc-400">Transaksi & kasir terhubung ke cabang ini</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                  {branches.length} Outlet
                </span>
              </div>

              {/* Branch List */}
              <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                {branches.map((b) => {
                  const isCurrent = b.id === activeBranchId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setActiveBranchId(b.id);
                        setIsBranchOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                          : 'hover:bg-zinc-800/80 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{b.name}</span>
                          {b.isMainBranch && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded shrink-0">
                              HQ
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {b.code} • {b.city}
                        </p>
                      </div>
                      {isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-medium shrink-0 hover:text-emerald-400">
                          Pilih
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action shortcuts */}
              <div className="pt-2 border-t border-zinc-800 space-y-1">
                {onOpenAddBranchModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsBranchOpen(false);
                      onOpenAddBranchModal();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Cabang Baru</span>
                  </button>
                )}

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsBranchOpen(false);
                      onOpenSettings('branches');
                    }}
                    className="w-full py-1.5 px-3 rounded-xl text-center text-zinc-400 hover:text-white text-[11px] font-semibold transition cursor-pointer hover:bg-zinc-800/60"
                  >
                    Kelola Semua Outlet Cabang →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger & Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            id="btn-user-profile-menu"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-label="Buka menu pengguna"
            className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 transition active:scale-95 text-left min-h-[44px]"
          >
            <img
              src={
                currentUser?.photo ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
              }
              alt={currentUser?.name || 'User'}
              className="w-8 h-8 rounded-lg object-cover border border-zinc-700 shrink-0"
            />
            <div className="hidden md:block truncate max-w-[120px] lg:max-w-[150px]">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentUser?.name || 'Pengguna'}
              </p>
              <p className="text-[10px] text-orange-400 uppercase font-semibold truncate leading-none mt-0.5">
                {currentUser?.roleName || 'Staf'}
              </p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 hidden sm:block transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180 text-orange-400' : ''
              }`}
            />
          </button>

          {/* Interactive User Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
              role="menu"
            >
              {/* Profile Card Header */}
              <div className="p-4 bg-gradient-to-br from-zinc-800/60 to-zinc-900 border-b border-zinc-800 flex items-center gap-3">
                <img
                  src={
                    currentUser?.photo ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
                  }
                  alt={currentUser?.name || 'User'}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500 shrink-0 shadow-md shadow-orange-500/20"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-white truncate">{currentUser?.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                      {currentUser?.roleName || currentUser?.role}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1 truncate">
                    ID: {currentUser?.id || 'USR-01'}
                  </p>
                </div>
              </div>

              {/* Quick Switch Staff Role (if available) */}
              {staffUsers.length > 0 && onSwitchUser && (
                <div className="p-3 border-b border-zinc-800 bg-zinc-950/40">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Ganti Profil Staf Cepat
                  </label>
                  <select
                    value={currentUser?.id || ''}
                    onChange={(e) => {
                      onSwitchUser(e.target.value);
                      setIsProfileOpen(false);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-200 outline-hidden focus:border-orange-500 cursor-pointer"
                  >
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-zinc-900 text-white">
                        {u.name} — ({u.roleName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Theme Settings Shortcut in Dropdown */}
              <div className="p-3 border-b border-zinc-800 bg-zinc-950/20 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    openThemeModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 transition text-left text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">Setting Tema & Tampilan</span>
                      <span className="text-[10px] text-zinc-400 block">Warna, mode gelap & kepadatan</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-bold">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAccent.hex }} />
                    {theme.mode}
                  </span>
                </button>

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenSettings('printer');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 transition text-left text-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-white">Setting Printer & Struk</span>
                        <span className="text-[10px] text-zinc-400 block">Thermal 58/80mm & cetak struk</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">POS</span>
                  </button>
                )}

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenSettings('roles');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 transition text-left text-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-white">Manajemen Role & Akses</span>
                        <span className="text-[10px] text-zinc-400 block">Hak akses modul sistem (RBAC)</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">RBAC</span>
                  </button>
                )}
              </div>

              {/* Account Quick Info */}
              <div className="p-3 space-y-1 text-xs text-zinc-300">
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <span>Hak Akses Role</span>
                  </div>
                  <span className="font-bold text-white uppercase text-[11px]">
                    {currentUser?.role}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <span>Status Login</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[11px]">Sesi Aktif</span>
                </div>
              </div>

              {/* Logout Button */}
              {onLogout && (
                <div className="p-3 border-t border-zinc-800 bg-zinc-950/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-98 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

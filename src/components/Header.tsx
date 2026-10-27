import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ShieldAlert,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Globe,
  Bell,
  Palette
} from 'lucide-react';
import { User, PTBackofficeNotification } from '../types';
import { RealTimeClock } from './RealTimeClock';
import { useTheme } from '../context/ThemeContext';

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
  onOpenSettings?: (subTab?: 'printer' | 'theme' | 'roles' | 'security' | 'profile' | 'branches' | 'finance' | 'templates' | 'backup' | 'landing') => void;
  onOpenAddBranchModal?: () => void;
  onOpenLandingPage?: () => void;
  ptNotifications?: PTBackofficeNotification[];
  onNavigateTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pageTitle = 'GymPro ERP Enterprise',
  onToggleSidebar,
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  isStoreClosed,
  onLogout,
  onOpenSettings,
  onOpenLandingPage,
  ptNotifications = [],
  onNavigateTab
}) => {
  const { openThemeModal, currentAccent, theme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);

  // Filter notifications relevant to current user
  const relevantNotifications = ptNotifications.filter((n) => {
    if (n.targetRole === 'ALL') return true;
    if (currentUser?.role === 'admin' || currentUser?.role === 'admin_cabang') return true;
    if (currentUser?.role === 'leader_pt') return true;
    if (currentUser?.role === 'pt' && n.trainerId === currentUser.id) return true;
    return false;
  });

  const unreadCount = relevantNotifications.filter((n) => !n.isRead).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-3 sm:px-5 lg:px-6 z-30 shrink-0 bg-zinc-950/90 backdrop-blur-md sticky top-0 w-full transition-all">
      {/* Left: Sidebar Navigation Toggles & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {/* Mobile Hamburger (< 1024px) */}
        <button
          id="btn-toggle-sidebar-mobile"
          type="button"
          className="lg:hidden text-zinc-300 hover:text-white p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 active:scale-95 transition flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer"
          onClick={onToggleMobileSidebar}
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5 text-orange-400" />
        </button>

        {/* Desktop Collapse / Expand Toggle (>= 1024px) */}
        {onToggleSidebar && (
          <button
            id="btn-toggle-sidebar-desktop"
            type="button"
            className="hidden lg:flex text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/80 transition items-center justify-center cursor-pointer"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            aria-label="Toggle collapse sidebar"
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

      {/* Right: RealTime Clock, Landing Page, Notification, & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Real-Time Live DateTime Widget */}
        <RealTimeClock variant="header" />

        {/* Public Landing Page Portal Button */}
        {onOpenLandingPage && (
          <button
            type="button"
            onClick={onOpenLandingPage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-300 transition active:scale-95 text-xs font-bold min-h-[44px] cursor-pointer"
            title="Lihat Landing Page Publik RFA Gym Platform"
            aria-label="Buka Landing Page Publik"
          >
            <Globe className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="hidden xl:inline">Landing Page</span>
          </button>
        )}

        {/* Backoffice PT & System Notifications Bell */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Notifikasi Backoffice & Sistem"
            aria-label="Notifikasi sistem"
          >
            <Bell className="w-4 h-4 text-orange-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px] border border-zinc-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-3 space-y-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 px-1">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-black text-white">Notifikasi Backoffice</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded">
                  {relevantNotifications.length} Pesan
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 p-0.5">
                {relevantNotifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    Belum ada notifikasi baru.
                  </div>
                ) : (
                  relevantNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                        notif.isRead
                          ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                          : 'bg-zinc-900 border-orange-500/30 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-orange-400 text-[11px] truncate">
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                          {notif.createdAt}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-300">{notif.message}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-zinc-400">
                          {notif.bookingDate} ({notif.timeSlot})
                        </span>
                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotifOpen(false);
                              if (currentUser?.role === 'leader_pt') {
                                onNavigateTab('leader-pt');
                              } else if (currentUser?.role === 'pt') {
                                onNavigateTab('trainer-portal');
                              } else {
                                onNavigateTab('jadwal-pt');
                              }
                            }}
                            className="text-[10px] text-orange-400 font-bold hover:underline cursor-pointer"
                          >
                            Buka Jadwal &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill Trigger & Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            id="btn-user-profile-menu"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-label="Buka menu pengguna"
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition active:scale-95 text-left min-h-[44px] cursor-pointer"
          >
            <img
              src={
                currentUser?.photo ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
              }
              alt={currentUser?.name || 'User'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-zinc-700 shrink-0"
            />
            <div className="hidden md:block truncate max-w-[130px] lg:max-w-[160px]">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentUser?.name || 'Pengguna'}
              </p>
              <p className={`text-[10px] uppercase font-bold truncate leading-none mt-0.5 ${
                currentUser?.role === 'admin'
                  ? 'text-rose-400'
                  : currentUser?.role === 'keuangan'
                  ? 'text-emerald-400'
                  : currentUser?.role === 'konten_kreator'
                  ? 'text-fuchsia-400'
                  : currentUser?.role === 'keamanan'
                  ? 'text-indigo-400'
                  : currentUser?.role === 'kebersihan'
                  ? 'text-teal-400'
                  : currentUser?.role === 'teknisi'
                  ? 'text-cyan-400'
                  : currentUser?.role === 'staff_umum'
                  ? 'text-violet-400'
                  : currentUser?.role === 'admin_cabang'
                  ? 'text-teal-400'
                  : 'text-orange-400'
              }`}>
                {currentUser?.role === 'admin'
                  ? 'Super Admin (HQ)'
                  : currentUser?.role === 'keuangan'
                  ? 'Keuangan (HQ)'
                  : currentUser?.role === 'konten_kreator'
                  ? 'Konten Kreator & CMS'
                  : currentUser?.role === 'keamanan'
                  ? 'Keamanan & Security'
                  : currentUser?.role === 'kebersihan'
                  ? 'Kebersihan & Sanitasi'
                  : currentUser?.role === 'teknisi'
                  ? 'Teknisi Maintenance'
                  : currentUser?.role === 'staff_umum'
                  ? 'Staf Operasional'
                  : currentUser?.role === 'admin_cabang'
                  ? 'Admin Cabang'
                  : currentUser?.roleName || 'Staf'}
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

              {/* Settings Shortcut in Dropdown */}
              {onOpenSettings && (
                <div className="p-3 border-b border-zinc-800 bg-zinc-950/20 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 transition text-left text-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-white">Pengaturan Sistem</span>
                        <span className="text-[10px] text-zinc-400 block">Tema, printer, outlet, & konfigurasi</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">Buka →</span>
                  </button>
                </div>
              )}

              {/* Theme Settings Shortcut in Dropdown */}
              <div className="p-3 border-b border-zinc-800 bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    openThemeModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 transition text-left text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-1.5 rounded-lg border"
                      style={{
                        backgroundColor: `rgba(${currentAccent.rgb}, 0.15)`,
                        borderColor: `rgba(${currentAccent.rgb}, 0.35)`,
                        color: currentAccent.hex
                      }}
                    >
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">Tema & Tampilan</span>
                      <span className="text-[10px] text-zinc-400 block">
                        {theme.mode.toUpperCase()} • {currentAccent.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold" style={{ color: currentAccent.hex }}>
                    Kustomisasi →
                  </span>
                </button>
              </div>

              {/* Landing Page Shortcut */}
              {onOpenLandingPage && (
                <div className="p-3 border-b border-zinc-800 bg-zinc-950/20">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenLandingPage();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 transition text-left text-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-white">Buka Landing Page</span>
                        <span className="text-[10px] text-zinc-400 block">Lihat tampilan portal publik gym</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-orange-400 font-mono">Lihat →</span>
                  </button>
                </div>
              )}

              {/* Account Quick Info */}
              <div className="p-3 space-y-1 text-xs text-zinc-300">
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <span>Tipe Wewenang</span>
                  </div>
                  <span className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded ${
                    currentUser?.role === 'admin'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : currentUser?.role === 'keuangan'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : currentUser?.role === 'konten_kreator'
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                      : currentUser?.role === 'keamanan'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : currentUser?.role === 'kebersihan'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : currentUser?.role === 'teknisi'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : currentUser?.role === 'staff_umum'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : currentUser?.role === 'admin_cabang'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {currentUser?.role === 'admin'
                      ? 'Super Admin (HQ)'
                      : currentUser?.role === 'keuangan'
                      ? 'Keuangan & Akuntansi (HQ)'
                      : currentUser?.role === 'konten_kreator'
                      ? 'Konten Kreator & CMS'
                      : currentUser?.role === 'keamanan'
                      ? 'Keamanan & Security'
                      : currentUser?.role === 'kebersihan'
                      ? 'Kebersihan & Sanitasi'
                      : currentUser?.role === 'teknisi'
                      ? 'Teknisi Maintenance'
                      : currentUser?.role === 'staff_umum'
                      ? 'Staf Operasional'
                      : currentUser?.role === 'admin_cabang'
                      ? 'Admin Unit Cabang'
                      : currentUser?.role}
                  </span>
                </div>
                {currentUser?.branchName && (
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-teal-400" />
                      <span>Unit Kerja</span>
                    </div>
                    <span className="text-zinc-200 font-semibold text-[11px] truncate max-w-[150px]">
                      {currentUser?.branchName}
                    </span>
                  </div>
                )}
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

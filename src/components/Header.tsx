import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ShieldAlert,
  LogOut,
  Flame,
  ChevronDown,
  User as UserIcon,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Globe,
  Bell,
  CheckCircle2,
  Clock,
  Dumbbell
} from 'lucide-react';
import { User, PTBackofficeNotification } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { RealTimeClock } from './RealTimeClock';

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
  onOpenSettings?: (subTab?: 'printer' | 'theme' | 'roles' | 'profile' | 'branches' | 'finance' | 'templates' | 'backup') => void;
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
  staffUsers = [],
  onSwitchUser,
  onLogout,
  firebaseConnected = true,
  onOpenSettings,
  onOpenAddBranchModal,
  onOpenLandingPage,
  ptNotifications = [],
  onNavigateTab
}) => {
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

      {/* Right: Cloud Sync, Date, PWA, Landing & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Firebase Cloud Status Indicator */}
        <div
          title={firebaseConnected ? 'Terkoneksi ke Cloud Firestore' : 'Mode Offline / Transien'}
          className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2 sm:px-2.5 py-1.5 rounded-xl border border-amber-500/20"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span className="hidden md:inline text-[11px] font-bold text-amber-200">Cloud Sync</span>
        </div>

        {/* Real-Time Live DateTime Widget */}
        <RealTimeClock variant="header" />

        {/* PWA Install Button (Android / iOS / Desktop) */}
        <PWAInstallButton variant="compact" />

        {/* Public Landing Page Portal Button */}
        {onOpenLandingPage && (
          <button
            type="button"
            onClick={onOpenLandingPage}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-300 transition active:scale-95 text-xs font-bold min-h-[44px]"
            title="Lihat Landing Page Publik RFA Gym Platform"
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
            className="relative p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Notifikasi Booking PT & Sistem"
          >
            <Bell className="w-4 h-4 text-orange-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px] border border-zinc-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-3 space-y-2 z-50 animate-in fade-in slide-in-from-top-2">
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
                            className="text-[10px] text-orange-400 font-bold hover:underline"
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
            <div className="hidden md:block truncate max-w-[140px] lg:max-w-[180px]">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentUser?.name || 'Pengguna'}
              </p>
              <p className={`text-[10px] uppercase font-bold truncate leading-none mt-0.5 ${
                currentUser?.role === 'admin'
                  ? 'text-rose-400'
                  : currentUser?.role === 'admin_cabang'
                  ? 'text-teal-400'
                  : 'text-orange-400'
              }`}>
                {currentUser?.role === 'admin'
                  ? 'Super Admin (HQ)'
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
                      : currentUser?.role === 'admin_cabang'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {currentUser?.role === 'admin'
                      ? 'Super Admin (HQ)'
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

              {/* Quick User Switcher Demo Helper */}
              {onSwitchUser && staffUsers && staffUsers.length > 0 && (
                <div className="p-3 border-t border-zinc-800 bg-zinc-950/40">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Simulasi Ganti Role Staf:</span>
                    <span className="text-orange-400 font-mono">1-Klik</span>
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-1">
                    {staffUsers
                      .filter((u) => u.id !== currentUser?.id)
                      .slice(0, 6)
                      .map((u) => {
                        const isAdm = u.role === 'admin';
                        const isAdmCab = u.role === 'admin_cabang';
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              onSwitchUser(u.id);
                            }}
                            className={`p-1.5 rounded-xl text-left border transition text-[11px] flex items-center gap-1.5 cursor-pointer ${
                              isAdm
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : isAdmCab
                                ? 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border-teal-500/30'
                                : 'bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 border-zinc-700'
                            }`}
                            title={`Beralih ke ${u.name} (${u.roleName})`}
                          >
                            <span className="text-xs">{isAdm ? '👑' : isAdmCab ? '🏢' : '👤'}</span>
                            <div className="truncate min-w-0">
                              <p className="font-bold truncate text-[10px]">{u.name.split(' ')[0]}</p>
                              <p className="text-[9px] text-zinc-400 truncate">
                                {isAdm ? 'Super Admin' : isAdmCab ? 'Admin Cabang' : u.role}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

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


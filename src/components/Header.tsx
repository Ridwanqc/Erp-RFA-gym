import React from 'react';
import { Calendar, Menu, UserCheck, ShieldAlert, Sparkles, LogOut, Flame } from 'lucide-react';
import { User } from '../types';
import { formatDateIndo, APP_TODAY } from '../utils/formatters';

interface HeaderProps {
  currentUser: User | null;
  pageTitle?: string;
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenAIHelper?: () => void;
  isStoreClosed?: boolean;
  staffUsers?: User[];
  onSwitchUser?: (userId: string) => void;
  onLogout?: () => void;
  firebaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pageTitle = 'GymPro ERP Ultimate',
  onToggleSidebar,
  onToggleMobileSidebar,
  isStoreClosed,
  staffUsers = [],
  onSwitchUser,
  onLogout,
  firebaseConnected = true
}) => {
  const toggleAction = onToggleMobileSidebar || onToggleSidebar;

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0 bg-[#09090b]/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          className="lg:hidden text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition"
          onClick={toggleAction}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {pageTitle}
            {isStoreClosed && (
              <span className="text-[10px] uppercase font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Toko Ditutup
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Firebase Cloud Status Indicator */}
        <div
          title="Terkoneksi ke Google Cloud Firestore (oval-post-pcf5x)"
          className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline text-[11px] font-bold text-amber-200">Cloud Sync</span>
        </div>

        <div className="text-xs font-semibold text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 flex items-center shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-orange-500 mr-2" />
          <span>{formatDateIndo(APP_TODAY)}</span>
        </div>

        {staffUsers.length > 0 && onSwitchUser && (
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-200 outline-none cursor-pointer"
            >
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-zinc-900 text-white">
                  {u.name} ({u.roleName})
                </option>
              ))}
            </select>
          </div>
        )}

        {!onSwitchUser && currentUser && (
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-zinc-300">
              {currentUser.name.split(' ')[0]} <span className="text-[10px] text-orange-400 uppercase font-bold">({currentUser.roleName})</span>
            </span>
          </div>
        )}

        {onLogout && (
          <button
            type="button"
            id="btn-header-logout"
            onClick={onLogout}
            title="Keluar dari sesi akun (Logout)"
            className="text-xs font-bold text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};

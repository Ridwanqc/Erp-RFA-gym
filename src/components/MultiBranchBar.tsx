import React from 'react';
import {
  Building2,
  Globe,
  ChevronRight,
  Layers,
  Users,
  CreditCard,
  MapPin,
  CheckCircle2,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { GymBranch, ALL_BRANCHES_ID, User as AppUser } from '../types';
import { useSettings } from '../context/SettingsContext';

interface MultiBranchBarProps {
  memberCount: number;
  transactionCount: number;
  staffCount: number;
  currentUser?: AppUser | null;
  onOpenBranchManager?: () => void;
  onOpenStockTransfer?: () => void;
  className?: string;
}

export const MultiBranchBar: React.FC<MultiBranchBarProps> = ({
  memberCount,
  transactionCount,
  staffCount,
  currentUser,
  onOpenBranchManager,
  onOpenStockTransfer,
  className = ''
}) => {
  const { branches, activeBranchId, activeBranch, isAllBranches, setActiveBranchId, canUserAccessBranch } = useSettings();

  const isSuperUser = !currentUser || currentUser.role === 'admin' || currentUser.role === 'manager';
  const isBranchLocked = !isSuperUser && currentUser?.branchId && (!currentUser.allowedBranchIds || currentUser.allowedBranchIds.length <= 1);

  return (
    <div
      className={`border-b transition-colors duration-200 ${
        isAllBranches
          ? 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-500/30'
          : 'bg-zinc-900/80 border-zinc-800 backdrop-blur-sm'
      } px-3 sm:px-5 lg:px-6 py-2 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Active Branch Identity */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {isAllBranches ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-black text-white tracking-tight">
                  Konsolidasi Pusat (Holding Multi-Outlet)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {branches.length} Cabang Terhubung
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-white truncate">
                  {activeBranch.name}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                  {activeBranch.code}
                </span>
                {activeBranch.isMainBranch && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 hidden sm:inline">
                    Pusat
                  </span>
                )}
                {isBranchLocked && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-0.5">
                    🔒 Unit Kerja
                  </span>
                )}
                <span className="text-[11px] text-zinc-400 hidden xl:inline truncate max-w-xs">
                  • {activeBranch.city}
                </span>
              </div>
            </div>
          )}

          {/* Quick Metrics Badges for Active Scope */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <strong className="text-zinc-200">{memberCount}</strong> Member
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
              <strong className="text-zinc-200">{transactionCount}</strong> Transaksi
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="text-zinc-500 font-bold">Staf:</span>
              <strong className="text-zinc-200">{staffCount}</strong>
            </span>
          </div>
        </div>

        {/* Right: Quick Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none shrink-0">
          {isBranchLocked ? (
            <div className="text-[11px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700 flex items-center gap-1.5">
              <span className="text-zinc-500 text-[10px]">Akses Cabang:</span>
              <span className="font-bold text-emerald-400">{activeBranch.name}</span>
            </div>
          ) : (
            <>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:inline mr-1">
                Pindah Unit:
              </span>

              {/* Switch to Consolidated Holding (Only Admin / Manager) */}
              {isSuperUser && (
                <button
                  type="button"
                  onClick={() => setActiveBranchId(ALL_BRANCHES_ID)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                    isAllBranches
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
                  }`}
                  title="Tampilkan data gabungan seluruh cabang (Konsolidasi Pusat)"
                >
                  <Globe className="w-3 h-3" />
                  <span>Semua (HQ)</span>
                </button>
              )}

              {/* Individual Branch Buttons */}
              {branches.map((b) => {
                const isCurrent = !isAllBranches && b.id === activeBranchId;
                const canAccess = canUserAccessBranch(currentUser || null, b.id);
                if (!canAccess) return null;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setActiveBranchId(b.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black'
                        : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
                    }`}
                    title={`Pindah ke ${b.name} (${b.city})`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{b.code}</span>
                  </button>
                );
              })}

              {isSuperUser && onOpenStockTransfer && (
                <button
                  type="button"
                  onClick={onOpenStockTransfer}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition cursor-pointer ml-1 flex items-center gap-1"
                  title="Transfer / Mutasi Stok Antar Cabang"
                >
                  <ArrowRight className="w-2.5 h-2.5" />
                  <span>Mutasi Stok</span>
                </button>
              )}

              {isSuperUser && onOpenBranchManager && (
                <button
                  type="button"
                  onClick={onOpenBranchManager}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer ml-1"
                  title="Kelola Master Data Cabang & Fasilitas"
                >
                  + Outlet
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

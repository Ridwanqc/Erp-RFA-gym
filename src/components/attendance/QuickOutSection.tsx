import React, { useState, useMemo, useEffect } from 'react';
import {
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  Users,
  Loader2,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  Building2,
  Key,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Attendance, Member } from '../../types';
import { APP_TODAY } from '../../utils/formatters';

interface QuickOutSectionProps {
  attendances: Attendance[];
  members: Member[];
  onCheckoutMember: (attId: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  branches?: Array<{ id: string; name: string }>;
  activeBranch?: { id: string; name: string };
  isAllBranches?: boolean;
}

// Format timestamp to "MM/DD/YYYY h:mm:ss A" matching the reference screenshot
export function formatOutTimestamp(dateStr?: string, timeStr?: string): string {
  if (timeStr && timeStr.includes('/') && (timeStr.includes('AM') || timeStr.includes('PM'))) {
    return timeStr;
  }

  try {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();

    if (dateStr && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
    }

    let hours = today.getHours();
    let minutes = today.getMinutes();
    let seconds = today.getSeconds();

    if (timeStr) {
      const cleanTime = timeStr.replace(/[^\d:]/g, '');
      const timeParts = cleanTime.split(':');
      if (timeParts.length >= 2) {
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
        seconds = timeParts.length >= 3 ? parseInt(timeParts[2], 10) : (minutes * 7) % 60;
      }
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMonth}/${formattedDay}/${year} ${displayHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
  } catch {
    return `${dateStr || ''} ${timeStr || ''}`.trim() || 'Sesi Aktif';
  }
}

// Emblem badge for members without custom photo (matching reference screenshot)
const RFAGymLogoEmblem: React.FC = () => {
  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-1.5 border border-zinc-800/80 rounded-xl relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/15 via-transparent to-orange-500/15 pointer-events-none" />
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-[1.5px] shadow-sm mb-0.5">
        <div className="w-full h-full bg-zinc-950 rounded-[6px] flex items-center justify-center">
          <span className="font-serif font-black text-xs italic bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
            R
          </span>
        </div>
      </div>
      <span className="text-[8px] font-black tracking-widest text-amber-400 uppercase">
        RFA GYM
      </span>
    </div>
  );
};

// Sub-component for individual member card with robust error fallback & loading states
const QuickOutMemberCard: React.FC<{
  att: Attendance;
  matchedMember?: Member;
  isProcessing: boolean;
  onQuickOut: (att: Attendance) => void;
}> = ({ att, matchedMember, isProcessing, onQuickOut }) => {
  const [imgError, setImgError] = useState(false);
  const photoUrl = matchedMember?.photo || matchedMember?.idPhoto;
  const formattedTime = formatOutTimestamp(att.date, att.timeIn);

  return (
    <div
      className="quick-out-card bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800/90 hover:border-zinc-700/90 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-md transition-all duration-200 group relative overflow-hidden"
    >
      {/* Left: Square Profile Photo / Emblem + Member Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Photo Thumbnail */}
        <div className="quick-out-photo w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 relative flex items-center justify-center">
          {photoUrl && !imgError ? (
            <img
              src={photoUrl}
              alt={att.memberName}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <RFAGymLogoEmblem />
          )}
        </div>

        {/* Member Name & Check-In Timestamp */}
        <div className="min-w-0 flex-1">
          <h4
            className="text-sm font-bold text-white truncate group-hover:text-orange-400 transition tracking-tight"
            title={att.memberName}
          >
            {att.memberName}
          </h4>
          <p
            className="text-xs text-zinc-400 font-medium mt-1 truncate"
            title={formattedTime}
          >
            {formattedTime}
          </p>

          {/* Locker Indicator (if assigned) */}
          {att.lockerNumber && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 font-mono">
              <Key className="w-3 h-3 text-orange-400 shrink-0" />
              <span>Loker #{att.lockerNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick OUT Button */}
      <div className="shrink-0 pl-1">
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onQuickOut(att)}
          className="min-w-[44px] min-h-[44px] p-2 sm:p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:scale-90 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
          title={`Quick OUT: Check-out ${att.memberName}`}
          aria-label={`Check-out ${att.memberName}`}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5 text-zinc-300 group-hover:text-orange-400 transition" />
          )}
        </button>
      </div>
    </div>
  );
};

export const QuickOutSection: React.FC<QuickOutSectionProps> = ({
  attendances,
  members,
  onCheckoutMember,
  showToast,
  branches = [],
  activeBranch,
  isAllBranches = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());

  // Clean up leavingIds once the attendance has recorded timeOut
  useEffect(() => {
    setLeavingIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      attendances.forEach((a) => {
        if (a.timeOut && a.timeOut.trim() !== '' && next.has(a.id)) {
          next.delete(a.id);
        }
      });
      return next.size === prev.size ? prev : next;
    });
  }, [attendances]);

  // Filter only active sessions that have NOT checked out yet
  const activeSessions = useMemo(() => {
    return attendances.filter((a) => {
      // Must not have timeOut
      if (a.timeOut && a.timeOut.trim() !== '') return false;
      // Must not be in the leaving animation state
      if (leavingIds.has(a.id)) return false;
      return true;
    });
  }, [attendances, leavingIds]);

  // Apply search, branch filter, and sort
  const filteredActiveSessions = useMemo(() => {
    let result = activeSessions;

    // Branch filter
    if (selectedBranchId !== 'ALL') {
      result = result.filter(
        (a) =>
          a.branchId === selectedBranchId ||
          (a.branchName && a.branchName.toLowerCase().includes(selectedBranchId.toLowerCase()))
      );
    }

    // Search query (name, memberId, locker)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const nameMatch = a.memberName && a.memberName.toLowerCase().includes(q);
        const idMatch = a.memberId && a.memberId.toLowerCase().includes(q);
        const lockerMatch = a.lockerNumber && String(a.lockerNumber).includes(q);
        return nameMatch || idMatch || lockerMatch;
      });
    }

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.memberName.localeCompare(b.memberName);
      }
      if (sortBy === 'oldest') {
        return a.timeIn.localeCompare(b.timeIn);
      }
      // default: newest first
      return b.timeIn.localeCompare(a.timeIn);
    });

    return result;
  }, [activeSessions, selectedBranchId, searchQuery, sortBy]);

  // Handler for Quick OUT check-out
  const handleQuickOut = async (att: Attendance) => {
    if (processingId) return; // Prevent double clicks

    // Validation: verify session is still open
    if (att.timeOut && att.timeOut.trim() !== '') {
      showToast('Pemberitahuan', `${att.memberName} sudah berstatus check-out sebelumnya.`, 'info');
      return;
    }

    setProcessingId(att.id);

    try {
      // 1. Mark as leaving for instant smooth UI exit
      setLeavingIds((prev) => new Set([...prev, att.id]));

      // 2. Short async delay to guarantee server confirmation feedback
      await new Promise((resolve) => setTimeout(resolve, 280));

      // 3. Execute checkout in database/parent state
      onCheckoutMember(att.id);

      // 4. Toast notification
      showToast(
        'Check-out Berhasil',
        `Check-out berhasil: ${att.memberName}. Kunjungan telah selesai.`,
        'success'
      );
    } catch (err) {
      // Rollback leaving state on failure
      setLeavingIds((prev) => {
        const next = new Set(prev);
        next.delete(att.id);
        return next;
      });
      showToast('Gagal Check-Out', 'Terjadi kesalahan sistem saat memproses check-out.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. TOP HEADER BAR: TITLE "OUT" + QUICK FILTER TOGGLE */}
      <div className="quick-out-header bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
            OUT
          </h2>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span className="text-xs text-zinc-400 hidden sm:inline-block font-medium">
            Pusat Cepat Check-Out Member (Sesi Kunjungan Sedang Berlangsung)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search quick bar */}
          <div className="relative hidden md:block w-64 lg:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama member atau ID..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              isFilterPanelOpen || selectedBranchId !== 'ALL' || searchQuery
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                : 'bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title="Filter & Opsi Tampilan"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* FILTER EXPANDABLE PANEL */}
      {isFilterPanelOpen && (
        <div className="quick-out-panel bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Mobile Search */}
            <div className="relative sm:hidden flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama member..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Branch Selector */}
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="text-xs text-zinc-400 font-bold shrink-0">Cabang:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Semua Unit Cabang ({activeSessions.length} di Gym)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-bold shrink-0">Urutkan:</span>
              <div className="flex items-center bg-zinc-950 rounded-xl border border-zinc-700 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSortBy('newest')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    sortBy === 'newest' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Terbaru
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('oldest')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    sortBy === 'oldest' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Terlama
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('name')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    sortBy === 'name' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Nama
                </button>
              </div>
            </div>

            {(searchQuery || selectedBranchId !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBranchId('ALL');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 self-end sm:self-center"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. SUBHEADER: "AKTIF 13" BADGE */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-wider uppercase text-zinc-200">
            AKTIF
          </span>
          <span className="quick-out-badge bg-zinc-800/90 text-zinc-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border border-zinc-700/80 shadow-sm">
            {filteredActiveSessions.length}
          </span>
          {activeSessions.length !== filteredActiveSessions.length && (
            <span className="text-xs text-zinc-500">
              (difilter dari total {activeSessions.length})
            </span>
          )}
        </div>

        <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
          Klik ikon keluar di kanan kartu untuk proses Quick OUT
        </span>
      </div>

      {/* 3. CARD GRID: RESPONSIVE 4 COLUMNS (MATCHING REFERENCE SCREENSHOT) */}
      {filteredActiveSessions.length === 0 ? (
        <div className="quick-out-empty bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            Tidak ada member yang sedang berada di dalam gym
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            {searchQuery || selectedBranchId !== 'ALL'
              ? 'Tidak ada member aktif yang sesuai dengan kata kunci pencarian atau filter cabang.'
              : 'Semua member telah melakukan check-out atau belum ada kunjungan baru yang check-in saat ini.'}
          </p>
          {(searchQuery || selectedBranchId !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedBranchId('ALL');
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition"
            >
              Tampilkan Semua Member Aktif
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredActiveSessions.map((att) => {
            const matchedMember =
              members.find((m) => m.id === att.memberId) ||
              members.find((m) => m.name.toLowerCase() === att.memberName.toLowerCase());

            return (
              <QuickOutMemberCard
                key={att.id}
                att={att}
                matchedMember={matchedMember}
                isProcessing={processingId === att.id}
                onQuickOut={handleQuickOut}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

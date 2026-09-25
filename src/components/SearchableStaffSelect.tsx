import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Check, X, User, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { User as StaffUser, StaffAttendance } from '../types';
import { APP_TODAY } from '../utils/formatters';

interface SearchableStaffSelectProps {
  staffUsers: StaffUser[];
  selectedStaffId: string;
  onSelectStaff: (staffId: string) => void;
  staffAttendances?: StaffAttendance[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  locked?: boolean;
  onToggleLock?: (locked: boolean) => void;
  lockBadgeText?: string;
}

export const SearchableStaffSelect: React.FC<SearchableStaffSelectProps> = ({
  staffUsers,
  selectedStaffId,
  onSelectStaff,
  staffAttendances = [],
  placeholder = 'Pilih atau cari nama / role staf...',
  label = 'Pilih Staf',
  disabled = false,
  locked = false,
  onToggleLock,
  lockBadgeText = 'PIC Terkunci'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedStaff = useMemo(() => {
    return staffUsers.find((s) => s.id === selectedStaffId) || null;
  }, [staffUsers, selectedStaffId]);

  // Set of staff currently clocked IN today
  const activeStaffClockMap = useMemo(() => {
    const map = new Map<string, StaffAttendance>();
    staffAttendances.forEach((s) => {
      if (s.date === APP_TODAY && !s.timeOut) {
        if (s.staffId) map.set(s.staffId, s);
        if (s.staffName) map.set(s.staffName, s);
      }
    });
    return map;
  }, [staffAttendances]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return staffUsers;
    return staffUsers.filter((s) => {
      return (
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        s.roleName.toLowerCase().includes(query) ||
        (s.shift || '').toLowerCase().includes(query)
      );
    });
  }, [staffUsers, searchQuery]);

  const handleSelect = (staff: StaffUser) => {
    onSelectStaff(staff.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectStaff('');
    setSearchQuery('');
  };

  const isClockedIn = (staff: StaffUser) => {
    return activeStaffClockMap.has(staff.id) || activeStaffClockMap.has(staff.name);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5 ml-1">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {label}
          </label>
          <div className="flex items-center gap-1.5">
            {locked && selectedStaff && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Lock className="w-3 h-3 text-amber-400" /> {lockBadgeText}
              </span>
            )}
            {onToggleLock && selectedStaff && (
              <button
                type="button"
                onClick={() => onToggleLock(!locked)}
                className="text-[10px] text-zinc-400 hover:text-amber-400 font-semibold underline transition ml-1"
              >
                {locked ? 'Buka Kunci' : 'Kunci PIC'}
              </button>
            )}
            {!locked && <span className="text-[10px] text-zinc-500 font-medium">Searchable Select</span>}
          </div>
        </div>
      )}

      {/* TRIGGER */}
      <div
        role="button"
        tabIndex={disabled || locked ? -1 : 0}
        onClick={() => !disabled && !locked && setIsOpen((prev) => !prev)}
        className={`w-full bg-zinc-950 border rounded-2xl p-3 sm:p-3.5 transition flex items-center justify-between gap-3 select-none text-left ${
          locked && selectedStaff
            ? 'border-amber-500/40 bg-amber-950/15 cursor-not-allowed'
            : isOpen
            ? 'border-orange-500 ring-2 ring-orange-500/20 bg-zinc-950 cursor-pointer'
            : selectedStaff
            ? 'border-zinc-700 hover:border-zinc-600 bg-zinc-950/90 cursor-pointer'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950 cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {selectedStaff ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img
                src={selectedStaff.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                alt={selectedStaff.name}
                className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
              />
              {isClockedIn(selectedStaff) && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white truncate">{selectedStaff.name}</h4>
                <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                  {selectedStaff.id}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-zinc-400">
                <span className="text-orange-400 font-semibold">{selectedStaff.roleName}</span>
                <span>•</span>
                <span>Shift {selectedStaff.shift}</span>
                {isClockedIn(selectedStaff) ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sedang Bertugas (Clock IN)
                  </span>
                ) : (
                  <span className="text-zinc-500 font-medium">Belum Clock IN</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-zinc-400">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
              <Search className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">{placeholder}</p>
              <p className="text-[11px] text-zinc-500">Buka daftar staf dan cari berdasarkan nama/role</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {!locked && selectedStaff && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              title="Hapus pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="p-1 text-zinc-400">
            {locked ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : isOpen ? (
              <ChevronUp className="w-4 h-4 text-orange-500" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800">
            <div className="relative">
              <Search className="w-4 h-4 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama staf, role, atau shift..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/60 p-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {filteredStaff.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs">
                Tidak ada staf yang cocok dengan "{searchQuery}".
              </div>
            ) : (
              filteredStaff.map((staff) => {
                const isSelected = staff.id === selectedStaffId;
                const activeDuty = isClockedIn(staff);

                return (
                  <div
                    key={staff.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(staff)}
                    className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-left ${
                      isSelected
                        ? 'bg-orange-500/20 border border-orange-500/40 text-white'
                        : 'hover:bg-zinc-800/80 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={staff.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                        alt={staff.name}
                        className="w-9 h-9 rounded-xl object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{staff.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {staff.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                          <span className="text-orange-400 font-semibold">{staff.roleName}</span>
                          <span>•</span>
                          <span>Shift {staff.shift}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeDuty && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Aktif Bertugas
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-zinc-950 flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  Sparkles,
  Flame
} from 'lucide-react';
import { Member, Attendance } from '../types';
import { APP_TODAY, formatDateIndo } from '../utils/formatters';

interface SearchableMemberSelectProps {
  id?: string;
  members: Member[];
  selectedMemberId: string;
  onSelectMember: (memberId: string) => void;
  attendances?: Attendance[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  excludeMemberIds?: string[];
}

export const SearchableMemberSelect: React.FC<SearchableMemberSelectProps> = ({
  id,
  members,
  selectedMemberId,
  onSelectMember,
  attendances = [],
  placeholder = 'Pilih atau cari nama / ID member...',
  label = 'Pilih / Scan Member',
  disabled = false,
  required = false,
  excludeMemberIds = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'inGym' | 'active' | 'freeze' | 'expired'>('all');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected member
  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  // Set of member IDs currently in gym (checked in today and !timeOut)
  const activeInGymMemberIds = useMemo(() => {
    const set = new Set<string>();
    attendances.forEach((a) => {
      if (a.date === APP_TODAY && !a.timeOut) {
        if (a.memberId) set.add(a.memberId);
        if (a.memberName) set.add(a.memberName);
      }
    });
    return set;
  }, [attendances]);

  // Check if a member is currently inside the gym
  const isMemberInGym = (m: Member) => {
    return activeInGymMemberIds.has(m.id) || activeInGymMemberIds.has(m.name);
  };

  // Check expiry
  const isMemberExpired = (m: Member) => {
    return new Date(m.expired + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input on dropdown open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation: Escape closes dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      // 1. Text search match (Name, ID, Phone)
      if (query) {
        const matchName = m.name.toLowerCase().includes(query);
        const matchId = m.id.toLowerCase().includes(query);
        const matchPhone = (m.phone || '').toLowerCase().includes(query);
        if (!matchName && !matchId && !matchPhone) return false;
      }

      // 2. Chip Filter match
      if (filterType === 'inGym') {
        return isMemberInGym(m);
      }
      if (filterType === 'active') {
        return !isMemberExpired(m) && !m.isFrozen && m.status !== 'FREEZE';
      }
      if (filterType === 'freeze') {
        return m.isFrozen || m.status === 'FREEZE';
      }
      if (filterType === 'expired') {
        return isMemberExpired(m);
      }

      return true;
    });
  }, [members, searchQuery, filterType, activeInGymMemberIds]);

  // Handle select item
  const handleSelect = (member: Member) => {
    onSelectMember(member.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectMember('');
    setSearchQuery('');
  };

  const selectedInGym = selectedMember ? isMemberInGym(selectedMember) : false;
  const selectedExpired = selectedMember ? isMemberExpired(selectedMember) : false;

  return (
    <div className={`relative w-full ${isOpen ? 'z-40' : 'z-10'}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <div className="flex items-center justify-between mb-1.5 ml-1">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center">
            {label}
            {required && <span className="text-orange-400 font-bold ml-1">*</span>}
          </label>
          <span className="text-[10px] text-zinc-500 font-medium">
            Searchable Select
          </span>
        </div>
      )}

      {/* DROPDOWN TRIGGER BUTTON */}
      <div
        id={id || 'searchable-member-dropdown-trigger'}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full bg-zinc-950 border rounded-2xl p-3 sm:p-3.5 transition flex items-center justify-between gap-3 cursor-pointer select-none text-left ${
          isOpen
            ? 'border-orange-500 ring-2 ring-orange-500/20 bg-zinc-950'
            : selectedMember
            ? 'border-zinc-700 hover:border-zinc-600 bg-zinc-950/90'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {selectedMember ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img
                src={selectedMember.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                alt={selectedMember.name}
                className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
              />
              {selectedInGym && (
                <span
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse"
                  title="Sedang aktif latihan di gym"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white truncate">{selectedMember.name}</h4>
                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  {selectedMember.id}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
                {/* Expired / Freeze / Active Status */}
                {selectedMember.isFrozen || selectedMember.status === 'FREEZE' ? (
                  <span className="text-sky-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" /> Freeze ({selectedMember.freezeReason || 'Cuti'})
                  </span>
                ) : selectedExpired ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Expired: {selectedMember.expired}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Aktif s.d {formatDateIndo(selectedMember.expired)}
                  </span>
                )}

                {/* Sisa Kuota PT */}
                <span className="text-zinc-400 font-medium">
                  • PT: <strong className="text-white">{selectedMember.ptQuota || 0} Sesi</strong>
                </span>

                {/* Live Gym Status */}
                {selectedMember.isFrozen || selectedMember.status === 'FREEZE' ? (
                  <span className="px-2 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-extrabold">
                    Akses Gate Ditangguhkan
                  </span>
                ) : selectedInGym ? (
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    Sedang di Gym (Auto-Checkout)
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                    Siap Check-In
                  </span>
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
              <p className="text-[11px] text-zinc-500">Klik untuk membuka daftar dan ketik nama/ID</p>
            </div>
          </div>
        )}

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 shrink-0">
          {selectedMember && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              title="Batalkan pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="p-1 text-zinc-400">
            {isOpen ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* DROPDOWN MENU PANEL WITH SEARCH INPUT & LIST */}
      {isOpen && (
        <div
          id="searchable-member-dropdown-menu"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* 1. SEARCH INPUT HEADER */}
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama, ID member (contoh: M001), atau nomor telepon..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  filterType === 'all'
                    ? 'bg-orange-500 text-zinc-950 font-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Semua ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('inGym')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  filterType === 'inGym'
                    ? 'bg-emerald-500 text-zinc-950 font-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-emerald-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Sedang di Gym ({members.filter(isMemberInGym).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('active')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  filterType === 'active'
                    ? 'bg-blue-500 text-zinc-950 font-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-blue-400'
                }`}
              >
                Aktif ({members.filter((m) => !isMemberExpired(m) && !m.isFrozen && m.status !== 'FREEZE').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('freeze')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  filterType === 'freeze'
                    ? 'bg-sky-500 text-zinc-950 font-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-sky-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Freeze ({members.filter((m) => m.isFrozen || m.status === 'FREEZE').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('expired')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  filterType === 'expired'
                    ? 'bg-rose-500 text-zinc-950 font-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-rose-400'
                }`}
              >
                Expired ({members.filter(isMemberExpired).length})
              </button>
            </div>
          </div>

          {/* 2. MEMBER LIST OPTIONS (MAX HEIGHT SCROLLABLE) */}
          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/60 p-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <User className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-xs font-bold text-zinc-300">Tidak ada member yang cocok</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {searchQuery ? `Pencarian "${searchQuery}" tidak menemukan hasil.` : 'Tidak ada member pada kategori ini.'}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = member.id === selectedMemberId;
                const isExcluded = excludeMemberIds.includes(member.id);
                const inGym = isMemberInGym(member);
                const expired = isMemberExpired(member);
                const isFrz = member.isFrozen || member.status === 'FREEZE';

                return (
                  <div
                    key={member.id}
                    id={`member-option-${member.id}`}
                    role="button"
                    tabIndex={isExcluded ? -1 : 0}
                    onClick={() => {
                      if (!isExcluded) handleSelect(member);
                    }}
                    className={`p-2.5 rounded-xl transition flex items-center justify-between gap-3 text-left ${
                      isExcluded
                        ? 'opacity-45 cursor-not-allowed bg-zinc-950/40 border border-transparent'
                        : isSelected
                        ? 'bg-orange-500/20 border border-orange-500/40 text-white cursor-pointer'
                        : 'hover:bg-zinc-800/80 text-zinc-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={member.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                          alt={member.name}
                          className="w-9 h-9 rounded-xl object-cover border border-zinc-700"
                        />
                        {inGym && (
                          <span
                            className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse"
                            title="Sedang di Gym"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{member.name}</span>
                          <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                            {member.id}
                          </span>
                          {isFrz && (
                            <span className="text-[9px] font-bold text-sky-300 bg-sky-500/20 px-1.5 py-0.2 rounded border border-sky-500/30 shrink-0">
                              FREEZE
                            </span>
                          )}
                          {isExcluded && (
                            <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Sudah dipilih di slot lain
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400 flex-wrap">
                          <span>{member.phone}</span>
                          <span>•</span>
                          {isFrz ? (
                            <span className="text-sky-400 font-semibold">Freeze: {member.freezeReason || 'Cuti'}</span>
                          ) : expired ? (
                            <span className="text-rose-400 font-semibold">Expired: {member.expired}</span>
                          ) : (
                            <span className="text-emerald-400">Aktif s.d {formatDateIndo(member.expired)}</span>
                          )}
                          <span>•</span>
                          <span>PT: <strong className="text-zinc-200">{member.ptQuota || 0} Sesi</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right Badges & Checkmark */}
                    <div className="flex items-center gap-2 shrink-0">
                      {inGym && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Di Gym
                        </span>
                      )}
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-zinc-950 flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : isExcluded ? null : (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 3. FOOTER INFO */}
          <div className="p-2.5 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
            <span>
              Menampilkan <strong className="text-white">{filteredMembers.length}</strong> dari {members.length} member
            </span>
            <span className="text-zinc-500">Tekan ESC untuk tutup</span>
          </div>
        </div>
      )}
    </div>
  );
};

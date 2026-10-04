import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Menu,
  X,
  User,
  LogIn,
  Calendar,
  ChevronDown,
  Building2,
  LogOut,
  Sparkles,
  HelpCircle,
  Award,
  Compass,
  Heart
} from 'lucide-react';
import { Member } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface LandingHeaderProps {
  activeSection: string;
  onNavigateSection: (sectionId: string) => void;
  onOpenReservation: (prefilledProgram?: string) => void;
  onOpenMemberArea: () => void;
  onOpenStaffLogin: () => void;
  loggedInMember: Member | null;
  onLogoutMember: () => void;
  isStaffLoggedIn?: boolean;
  onReturnToERP?: () => void;
  activeInGymCount?: number;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  activeSection,
  onNavigateSection,
  onOpenReservation,
  onOpenMemberArea,
  onOpenStaffLogin,
  loggedInMember,
  onLogoutMember,
  isStaffLoggedIn,
  onReturnToERP,
  activeInGymCount = 0
}) => {
  const { settings } = useSettings();
  const gymName = settings?.profile?.gymName || 'RFA GYM';
  const logoUrl = settings?.profile?.logoUrl || '';

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const coreNavItems = [
    { id: 'hero', label: 'Beranda' },
    { id: 'programs', label: 'Program' },
    { id: 'schedule', label: 'Jadwal & Slot' },
    { id: 'bmi-calc', label: 'Kalkulator BMI' },
    { id: 'about-us', label: 'Tentang Kami' },
    { id: 'contact', label: 'Kontak' }
  ];

  const moreNavItems = [
    { id: 'why-us', label: 'Keunggulan RFA', icon: Award, desc: '6 Nilai & Standar Fasilitas' },
    { id: 'visi-misi', label: 'Visi & Misi', icon: Compass, desc: 'Pilar Budaya & Komitmen' },
    { id: 'tips', label: 'Tips Sehat & Nutrisi', icon: Heart, desc: 'Panduan Praktis Olahraga' },
    { id: 'faq', label: 'Tanya Jawab (FAQ)', icon: HelpCircle, desc: 'Informasi Lengkap Member' }
  ];

  const allNavItems = [
    { id: 'hero', label: 'Beranda' },
    { id: 'why-us', label: 'Keunggulan' },
    { id: 'about-us', label: 'Tentang Kami' },
    { id: 'visi-misi', label: 'Visi & Misi' },
    { id: 'programs', label: 'Program' },
    { id: 'schedule', label: 'Jadwal & Slot' },
    { id: 'bmi-calc', label: 'Kalkulator BMI' },
    { id: 'tips', label: 'Tips Sehat' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Kontak' }
  ];

  const handleNavClick = (sectionId: string) => {
    onNavigateSection(sectionId);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  };

  const isMoreActive = moreNavItems.some((item) => item.id === activeSection);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 shadow-xl shadow-black/40 h-16'
            : 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/60 h-16 sm:h-[68px]'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full gap-3 xl:gap-6">
            {/* Zone 1: Brand Wordmark (Single Row, No Wrap) */}
            <div
              onClick={() => handleNavClick('hero')}
              className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
              title={`${gymName} PLATFORM - Beranda`}
            >
              {logoUrl ? (
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/80 p-0.5 flex items-center justify-center shadow-md shadow-orange-500/10 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
                  <img
                    src={logoUrl}
                    alt={gymName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
                  <Flame className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-wider text-white whitespace-nowrap">
                  {gymName.includes(' ') ? (
                    <>
                      {gymName.split(' ')[0]} <span className="text-orange-500">{gymName.split(' ').slice(1).join(' ')}</span>
                    </>
                  ) : (
                    <>
                      {gymName} <span className="text-orange-500">GYM</span>
                    </>
                  )}
                </span>
                <span className="hidden sm:inline-block text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  PLATFORM
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links (Desktop & Laptop Clean Layout) */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 shrink-0">
              {coreNavItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`text-xs xl:text-[13px] font-medium tracking-normal transition-colors relative py-1.5 whitespace-nowrap ${
                      isActive
                        ? 'text-orange-400 font-bold'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                    )}
                  </button>
                );
              })}

              {/* "Lainnya" Dropdown for Secondary Pages */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`text-xs xl:text-[13px] font-medium tracking-normal flex items-center gap-1 transition-colors relative py-1.5 whitespace-nowrap ${
                    isMoreActive || moreDropdownOpen
                      ? 'text-orange-400 font-bold'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <span>Lainnya</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180 text-orange-400' : 'text-zinc-400'}`} />
                  {isMoreActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {moreDropdownOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl bg-zinc-950/98 border border-zinc-800 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl z-50">
                    <div className="space-y-1">
                      {moreNavItems.map((sub) => {
                        const Icon = sub.icon;
                        const isSubActive = activeSection === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleNavClick(sub.id)}
                            className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors ${
                              isSubActive
                                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                                : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold leading-tight truncate">{sub.label}</div>
                              <div className="text-[10px] text-zinc-500 truncate">{sub.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Zone 3: Action Buttons (Right Aligned, Compact & Elegant) */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0">
              {/* Live in-gym member count pulse indicator */}
              <button
                onClick={() => handleNavClick('live-occupancy')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title="Info member aktif latihan di gym saat ini (Klik untuk Join Now & Detail)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-mono tabular-nums font-bold text-white text-xs">{activeInGymCount}</span>
                <span className="text-zinc-300 text-[11px] xl:text-xs">di Gym</span>
              </button>

              {/* If staff is logged in, show quick return button */}
              {isStaffLoggedIn && onReturnToERP && (
                <button
                  onClick={onReturnToERP}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all whitespace-nowrap"
                  title="Kembali ke Ruang Kerja ERP"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Ke ERP Staf</span>
                </button>
              )}

              {/* Join Now CTA - Sembunyikan jika member sudah login */}
              {!loggedInMember && (
                <button
                  onClick={() => onOpenReservation()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-95 whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Join Now</span>
                </button>
              )}

              {/* Member Area Portal */}
              {loggedInMember ? (
                <div className="flex items-center gap-1.5 pl-1">
                  <button
                    onClick={onOpenMemberArea}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-orange-500/50 text-zinc-100 transition-all text-xs font-semibold whitespace-nowrap"
                    title={`Dashboard Member: ${loggedInMember.name}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[9px]">
                      {loggedInMember.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="max-w-[70px] xl:max-w-[90px] truncate">{loggedInMember.name}</span>
                  </button>
                  <button
                    onClick={onLogoutMember}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors"
                    title="Keluar Akun Member"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenMemberArea}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>Member</span>
                </button>
              )}

              {/* Staff ERP Login (if not already logged in) */}
              {!isStaffLoggedIn && (
                <button
                  onClick={onOpenStaffLogin}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all whitespace-nowrap ml-1"
                  title="Akses Portal Staf & Kasir ERP"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Staf</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => handleNavClick('live-occupancy')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono font-bold text-white">{activeInGymCount}</span>
              </button>

              {/* Mobile Join Now Button: Sembunyikan jika member sudah login */}
              {!loggedInMember && (
                <button
                  onClick={() => onOpenReservation()}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center gap-1 shadow-md shadow-orange-500/20 uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Join Now</span>
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-zinc-950/98 border-b border-zinc-800 px-4 pt-4 pb-6 mt-1 animate-in slide-in-from-top-3 duration-200 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {allNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30'
                      : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
              {/* Drawer Join Now Button: Sembunyikan jika member sudah login */}
              {!loggedInMember && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenReservation();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Join Now • Daftar Member Sekarang</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMemberArea();
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2 border border-zinc-800"
              >
                <User className="w-4 h-4 text-orange-400" />
                <span>{loggedInMember ? `Dashboard Member (${loggedInMember.name})` : 'Portal Login Member'}</span>
              </button>

              {!isStaffLoggedIn ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenStaffLogin();
                  }}
                  className="w-full py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white text-center"
                >
                  Portal Login Staf & Kasir ERP →
                </button>
              ) : (
                onReturnToERP && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onReturnToERP();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-500/40"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Kembali ke Ruang Kerja Staf ERP</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

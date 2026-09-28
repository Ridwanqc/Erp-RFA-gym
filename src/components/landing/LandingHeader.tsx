import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Menu,
  X,
  User,
  LogIn,
  Calendar,
  Sparkles,
  Phone,
  Calculator,
  ChevronRight,
  ShieldCheck,
  Building2,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Member } from '../../types';

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
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
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 shadow-xl shadow-black/40 py-2.5'
            : 'bg-zinc-950/70 backdrop-blur-sm border-b border-zinc-900/60 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo - Top Bar Contract */}
            <div
              onClick={() => handleNavClick('hero')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-wider text-white">
                RFA <span className="text-orange-500">GYM</span> PLATFORM
              </span>
            </div>

            {/* Desktop Navigation - Clean typography with subtle active indicator */}
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.slice(0, 7).map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`text-xs font-semibold tracking-wide transition-colors relative py-1 ${
                      isActive
                        ? 'text-orange-400 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Live in-gym member count pulse indicator */}
              <button
                onClick={() => handleNavClick('live-occupancy')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all group"
                title="Lihat status presensi & kepadatan gym saat ini"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-mono tabular-nums font-bold text-white">{activeInGymCount}</span>
                <span className="text-zinc-300 group-hover:text-white transition-colors">Sedang Latihan</span>
              </button>

              {/* If staff is logged in, show quick return button */}
              {isStaffLoggedIn && onReturnToERP && (
                <button
                  onClick={onReturnToERP}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all shadow-sm"
                  title="Kembali ke Ruang Kerja ERP"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Ke ERP Staf</span>
                </button>
              )}

              {/* Online Reservation CTA */}
              <button
                onClick={() => onOpenReservation()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/20 active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reservasi Online</span>
              </button>

              {/* Member Area Portal */}
              {loggedInMember ? (
                <button
                  onClick={onOpenMemberArea}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-orange-500/50 text-zinc-100 transition-all text-xs font-semibold group"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px]">
                    {loggedInMember.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{loggedInMember.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Member
                  </span>
                </button>
              ) : (
                <button
                  onClick={onOpenMemberArea}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>Area Member</span>
                </button>
              )}

              {/* Staff ERP Login (if not already logged in) */}
              {!isStaffLoggedIn && (
                <button
                  onClick={onOpenStaffLogin}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all"
                  title="Akses Portal Staf & Kasir ERP"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Staf ERP</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => onOpenReservation()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 text-white flex items-center gap-1 shadow-md shadow-orange-500/20"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Booking</span>
              </button>

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
          <div className="lg:hidden bg-zinc-950/98 border-b border-zinc-800 px-4 pt-4 pb-6 mt-2 animate-in slide-in-from-top-3 duration-200 shadow-2xl">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {navItems.map((item) => (
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
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMemberArea();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-400" />
                  <span>
                    {loggedInMember ? `Dashboard Member (${loggedInMember.name})` : 'Login / Area Member'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>

              {isStaffLoggedIn && onReturnToERP ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onReturnToERP();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Masuk ke Dashboard ERP Staf</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenStaffLogin();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/60 text-zinc-400 border border-zinc-800 text-xs font-medium hover:text-zinc-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Akses Login Staf & Resepsionis ERP</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

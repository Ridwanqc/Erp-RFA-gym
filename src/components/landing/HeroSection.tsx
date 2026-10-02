import React from 'react';
import {
  Flame,
  ArrowRight,
  Calendar,
  Award,
  Users,
  ShieldCheck,
  Star,
  CheckCircle2,
  Sparkles,
  Play
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import { useSettings } from '../../context/SettingsContext';

interface HeroSectionProps {
  onStartBooking: () => void;
  onExplorePrograms: () => void;
  onOpenVideoTour?: () => void;
  memberCount: number;
  activeInGymCount?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartBooking,
  onExplorePrograms,
  memberCount,
  activeInGymCount = 18
}) => {
  const { settings } = useSettings();
  const gymName = settings?.profile?.gymName || 'RFA GYM';
  const logoUrl = settings?.profile?.logoUrl || '';

  return (
    <section id="hero" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Background Lighting Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-orange-500/5 to-transparent blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Live Occupancy Badge & Optional Company Logo Badge */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              {logoUrl && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-orange-500/30 text-xs font-semibold text-zinc-200 shadow-md backdrop-blur-md">
                  <div className="w-5 h-5 rounded-md overflow-hidden bg-black/50 p-0.5 flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt={gymName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="font-bold text-orange-400">{gymName}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-emerald-500/40 text-xs font-medium text-emerald-300 shadow-inner backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  Live di Gym:{' '}
                  <strong className="text-white font-mono tabular-nums font-bold">
                    {activeInGymCount} Member
                  </strong>{' '}
                  Sedang Latihan • Nyaman & Bersih
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              TRANSFORMASI TUBUH & ENERGI{' '}
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                TANPA BATAS
              </span>{' '}
              DI {gymName.toUpperCase()}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Fasilitas fitness premium standar internasional, bimbingan Personal Trainer bersertifikasi, dan studio class terlengkap di Jakarta & sekitarnya. Wujudkan versi terbaik fisik dan mental Anda bersama komunitas juara.
            </p>

            {/* CTA Ganda */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onStartBooking}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
              >
                <Flame className="w-5 h-5 text-amber-200" />
                <span>Join Now • Mulai Latihan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExplorePrograms}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-sm sm:text-base border border-zinc-700/80 hover:border-zinc-600 flex items-center justify-center gap-2.5 transition-all shadow-sm"
              >
                <span>Lihat Program & Jadwal</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Free Trial & Konsultasi InBody</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Akses 3 Cabang Strategis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tanpa Kontrak Terikat Panjang</span>
              </div>
            </div>
          </div>

          {/* Right Visual & Live Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Glow Border Frame */}
              <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl shadow-orange-500/10 group">
                <SafeImage
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop"
                  alt="RFA Gym Premium Training Arena"
                  fallbackType="gym"
                  fallbackText="RFA Gym Flagship Sudirman"
                  className="w-full h-[430px] sm:h-[480px] group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

                {/* Bottom Overlay Info on Image */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                        Flagship Hub
                      </span>
                      <h4 className="text-sm font-extrabold text-white">Menara Sudirman Lantai 2</h4>
                      <p className="text-xs text-zinc-400">Peralatan Eleiko, Hammer Strength & LifeFitness</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                      Open Now
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Stat Badge 1: Rating */}
              <div className="absolute -top-4 -left-4 sm:-left-6 p-3.5 rounded-2xl bg-zinc-900/95 backdrop-blur-md border border-zinc-800 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-white">4.9 / 5.0</span>
                    <span className="text-[10px] text-zinc-400">(850+ Ulasan)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Gym Favorit Urban Jakarta</p>
                </div>
              </div>

              {/* Floating Stat Badge 2: Live In-Gym Attendance */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 p-3.5 rounded-2xl bg-zinc-900/95 backdrop-blur-md border border-emerald-500/30 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Flame className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-sm font-black text-white font-mono tabular-nums">
                      {activeInGymCount} Member
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Sedang Latihan di Gym Hari Ini</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

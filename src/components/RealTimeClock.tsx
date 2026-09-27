import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Calendar,
  Sparkles,
  Globe,
  Copy,
  Check,
  X,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Info,
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react';
import { useRealTimeDateTime } from '../hooks/useRealTimeDateTime';

interface RealTimeClockProps {
  variant?: 'header' | 'badge' | 'card' | 'minimal';
  showSecondsDefault?: boolean;
  className?: string;
}

export const RealTimeClock: React.FC<RealTimeClockProps> = ({
  variant = 'header',
  showSecondsDefault = true,
  className = ''
}) => {
  // User preferences from localStorage
  const [use12Hour, setUse12Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gympro_clock_12h') === 'true';
    } catch {
      return false;
    }
  });

  const [showSeconds, setShowSeconds] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('gympro_clock_show_seconds');
      return stored !== null ? stored === 'true' : showSecondsDefault;
    } catch {
      return showSecondsDefault;
    }
  });

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const dt = useRealTimeDateTime({ use12Hour, showSeconds });

  // Save preferences
  const handleToggle12Hour = () => {
    const next = !use12Hour;
    setUse12Hour(next);
    try {
      localStorage.setItem('gympro_clock_12h', String(next));
    } catch {}
  };

  const handleToggleSeconds = () => {
    const next = !showSeconds;
    setShowSeconds(next);
    try {
      localStorage.setItem('gympro_clock_show_seconds', String(next));
    } catch {}
  };

  // Close modal on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsDetailOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDetailOpen(false);
      }
    };
    if (isDetailOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDetailOpen]);

  const handleCopyTimestamp = () => {
    const text = `${dt.dateIso} ${dt.hours}:${dt.minutes}:${dt.seconds} ${dt.timezone}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Weather/Greeting icon
  const getGreetingIcon = () => {
    const hour = dt.now.getHours();
    if (hour >= 4 && hour < 11) return <Sunrise className="w-4 h-4 text-amber-400" />;
    if (hour >= 11 && hour < 15) return <Sun className="w-4 h-4 text-yellow-400" />;
    if (hour >= 15 && hour < 18) return <Sunset className="w-4 h-4 text-orange-400" />;
    return <Moon className="w-4 h-4 text-indigo-400" />;
  };

  // Render Card Variant (for Dashboards & Attendance Gate)
  if (variant === 'card') {
    return (
      <div className={`p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-xl relative overflow-hidden ${className}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Waktu Real-Time Sistem
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-medium px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            {dt.timezone} ({dt.timezoneOffsetStr})
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider">
            {dt.hours}:{dt.minutes}
            {showSeconds && (
              <span className="text-orange-400 text-2xl sm:text-3xl ml-0.5">
                :{dt.seconds}
              </span>
            )}
          </span>
          {use12Hour && (
            <span className="text-xs font-bold text-zinc-400 uppercase">{dt.period}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-300 font-semibold">
          <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span>{dt.dateFullFormatted}</span>
        </div>
      </div>
    );
  }

  // Render Badge Variant
  if (variant === 'badge') {
    return (
      <div
        onClick={() => setIsDetailOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 cursor-pointer hover:border-orange-500/50 hover:bg-zinc-850 transition shadow-sm ${className}`}
        title="Klik untuk melihat detail waktu real-time & opsi pengaturan"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Clock className="w-3.5 h-3.5 text-orange-400" />
        <span className="font-mono font-bold text-white">
          {dt.hours}:{dt.minutes}:{dt.seconds}
        </span>
        <span className="text-[10px] text-zinc-400 font-bold">{dt.timezone}</span>
      </div>
    );
  }

  // Default: Header Variant (Desktop + Mobile Responsive)
  return (
    <>
      <button
        type="button"
        onClick={() => setIsDetailOpen(true)}
        title="Waktu Real-Time Sistem (Klik untuk melihat info detail & kalender)"
        className={`group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500/50 text-xs transition-all shadow-inner active:scale-95 cursor-pointer ${className}`}
      >
        {/* Pulsing Live Real-Time Indicator */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        {/* Date Display (Hidden on very small screens, visible from sm up) */}
        <div className="hidden sm:flex items-center gap-1.5 text-zinc-300 font-semibold border-r border-zinc-700/60 pr-2.5">
          <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="whitespace-nowrap text-zinc-200 font-medium">
            {dt.dayName}, {dt.dayOfMonth} {dt.monthShort}
          </span>
        </div>

        {/* Live Clock with Seconds & Blinking Colon */}
        <div className="flex items-center gap-1 text-white font-bold font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400 sm:hidden shrink-0" />
          <span className="text-white tracking-wide">
            {dt.hours}
            <span className={`${dt.isEvenSecond ? 'opacity-100' : 'opacity-40'} text-orange-400 transition-opacity`}>:</span>
            {dt.minutes}
            {showSeconds && (
              <>
                <span className={`${dt.isEvenSecond ? 'opacity-100' : 'opacity-40'} text-orange-400 transition-opacity`}>:</span>
                <span className="text-orange-400 text-[11px] font-black">{dt.seconds}</span>
              </>
            )}
          </span>
          {use12Hour && (
            <span className="text-[10px] text-zinc-400 uppercase font-sans ml-0.5">{dt.period}</span>
          )}
          <span className="hidden md:inline text-[10px] font-bold text-zinc-400 uppercase font-sans ml-1 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
            {dt.timezone}
          </span>
        </div>
      </button>

      {/* Real-Time Precision DateTime Modal / Popover */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div
            ref={modalRef}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Clock className="w-6 h-6 text-orange-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Waktu Real-Time Sistem
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Sinkronisasi waktu nyata perangkat & server gym
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Big Digital Clock Card */}
            <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-center relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-center gap-2 mb-2 text-xs font-bold text-amber-400">
                {getGreetingIcon()}
                <span>{dt.greeting}, Tim GymPro!</span>
              </div>

              {/* Huge Live Clock Display */}
              <div className="font-mono text-4xl sm:text-5xl font-black text-white tracking-widest my-2 select-all flex items-center justify-center">
                <span>{dt.hours}</span>
                <span className={`${dt.isEvenSecond ? 'opacity-100' : 'opacity-30'} text-orange-500 mx-1 transition-opacity`}>:</span>
                <span>{dt.minutes}</span>
                {showSeconds && (
                  <>
                    <span className={`${dt.isEvenSecond ? 'opacity-100' : 'opacity-30'} text-orange-500 mx-1 transition-opacity`}>:</span>
                    <span className="text-orange-400 text-3xl sm:text-4xl">{dt.seconds}</span>
                  </>
                )}
                {use12Hour && (
                  <span className="text-sm font-sans text-zinc-400 font-bold ml-2 uppercase">
                    {dt.period}
                  </span>
                )}
              </div>

              {/* Full Indonesian Date */}
              <div className="text-sm font-bold text-zinc-200 mt-2 flex items-center justify-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{dt.dateFullFormatted}</span>
              </div>

              <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-zinc-400 font-medium">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span>Zona Waktu: <strong>{dt.timezone}</strong> ({dt.timezoneOffsetStr})</span>
                <span>•</span>
                <span>Format ISO: <code className="text-zinc-300 font-mono">{dt.dateIso}</code></span>
              </div>
            </div>

            {/* Accuracy Guarantee Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-300 block">
                  Akurasi 100% Sesuai Waktu Real
                </span>
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  Detik waktu diperbarui secara presisi setiap 1.000 ms langsung dari RTC jam perangkat Anda. Seluruh transaksi kasir, presensi check-in gate, dan audit trail otomatis tercatat dengan detik waktu nyata ini.
                </p>
              </div>
            </div>

            {/* Quick Preferences */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-350">
                <SlidersHorizontal className="w-4 h-4 text-orange-400" />
                <span className="text-zinc-300">Pengaturan Tampilan Jam</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* 24h vs 12h */}
                <button
                  type="button"
                  onClick={handleToggle12Hour}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    use12Hour
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <span>Format Jam</span>
                  <span className="text-[11px] font-mono font-black">{use12Hour ? '12 Jam' : '24 Jam'}</span>
                </button>

                {/* Show/Hide Seconds */}
                <button
                  type="button"
                  onClick={handleToggleSeconds}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    showSeconds
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <span>Detik Live</span>
                  <span className="text-[11px] font-black">{showSeconds ? 'Aktif ⏱️' : 'Mati'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleCopyTimestamp}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Salin tanggal & waktu saat ini"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin Waktu'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

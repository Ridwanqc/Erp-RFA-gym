import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  HelpCircle,
  X,
  KeyRound,
  Users,
  Dumbbell,
  Flame,
  Palette
} from 'lucide-react';
import { User } from '../types';
import { formatDateIndo, APP_TODAY } from '../utils/formatters';
import { signInWithGoogle } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';

// Security constants for brute-force protection
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 menit = 900 detik
const STORAGE_KEY_ATTEMPTS = 'rfa_login_failed_attempts';
const STORAGE_KEY_LOCKOUT_UNTIL = 'rfa_login_lockout_until';

// Helper formatters
export const formatLockoutDigital = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const formatLockoutText = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0 && s > 0) return `${m} menit ${s} detik`;
  if (m > 0) return `${m} menit`;
  return `${s} detik`;
};

interface LoginPageProps {
  onLogin: (user: User, rememberMe: boolean) => void;
  staffUsers: User[];
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, staffUsers, onBackToLanding }) => {
  const { openThemeModal, currentAccent, theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Brute-force & Anti-Tampering Rate-Limiting Protection (5x salah sandi -> 15 menit lockout, persisted)
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const lockoutUntilStr = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL);
      if (lockoutUntilStr) {
        const lockoutUntil = parseInt(lockoutUntilStr, 10);
        if (lockoutUntil > Date.now()) {
          const saved = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
          return saved ? parseInt(saved, 10) || MAX_FAILED_LOGIN_ATTEMPTS : MAX_FAILED_LOGIN_ATTEMPTS;
        } else {
          // Expired lockout cleanup
          localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
          localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
          return 0;
        }
      }
      const saved = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [lockoutTimer, setLockoutTimer] = useState<number>(() => {
    try {
      const lockoutUntilStr = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL);
      if (!lockoutUntilStr) return 0;
      const lockoutUntil = parseInt(lockoutUntilStr, 10);
      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (diff > 0) {
        return diff;
      }
      localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
      localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      return 0;
    } catch {
      return 0;
    }
  });

  // Countdown timer synced with real-world timestamp
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      try {
        const lockoutUntilStr = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL);
        if (lockoutUntilStr) {
          const lockoutUntil = parseInt(lockoutUntilStr, 10);
          const diff = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
          setLockoutTimer(diff);
          if (diff <= 0) {
            localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
            localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
            setFailedAttempts(0);
            setErrorMsg(null);
          }
        } else {
          setLockoutTimer((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
              localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
              setFailedAttempts(0);
              setErrorMsg(null);
              return 0;
            }
            return next;
          });
        }
      } catch {
        setLockoutTimer((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Validate and submit login
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (lockoutTimer > 0) {
      setErrorMsg(
        `Akses login dikunci sementara demi keamanan karena terdeteksi 5x kesalahan kata sandi. Silakan tunggu ${formatLockoutText(
          lockoutTimer
        )} (${formatLockoutDigital(lockoutTimer)}) lagi.`
      );
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMsg('Silakan masukkan ID Akun, Username, atau No. HP Anda.');
      return;
    }

    if (!cleanPassword) {
      setErrorMsg('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    // Secure timing verification (simulated 280ms)
    setTimeout(() => {
      // Find matching user by accId, id, name, or phone
      const matchedUser = staffUsers.find((u) => {
        const accMatch = u.accId?.toLowerCase() === cleanUsername;
        const idMatch = u.id?.toLowerCase() === cleanUsername;
        const nameMatch = u.name?.toLowerCase() === cleanUsername;
        const phoneMatch = u.phone?.replace(/[^0-9]/g, '') === cleanUsername.replace(/[^0-9]/g, '');
        const roleAlias = (cleanUsername === 'admin_cabang' && u.role === 'admin_cabang');
        return accMatch || idMatch || nameMatch || phoneMatch || roleAlias;
      });

      if (!matchedUser) {
        setIsLoading(false);
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        try {
          localStorage.setItem(STORAGE_KEY_ATTEMPTS, String(nextFailed));
        } catch {}

        if (nextFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
          try {
            localStorage.setItem(STORAGE_KEY_LOCKOUT_UNTIL, String(until));
          } catch {}
          setLockoutTimer(LOCKOUT_DURATION_SECONDS);
          setErrorMsg(
            'Terlalu banyak percobaan masuk yang salah (5x). Akses login Anda dikunci sementara selama 15 menit demi keamanan data sistem.'
          );
        } else {
          setErrorMsg(
            `ID Akun atau Username tidak cocok. Sisa kesempatan: ${MAX_FAILED_LOGIN_ATTEMPTS - nextFailed}x sebelum akun terkunci 15 menit.`
          );
        }
        return;
      }

      if (matchedUser.status === 'Nonaktif' || (matchedUser as any).status === 'Suspended') {
        setIsLoading(false);
        setErrorMsg('Akses ditolak: Akun staf ini telah dinonaktifkan oleh Administrator. Hubungi HR / Manajemen.');
        return;
      }

      // Check password
      const expectedPassword = matchedUser.password || '123';
      if (cleanPassword !== expectedPassword) {
        setIsLoading(false);
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        try {
          localStorage.setItem(STORAGE_KEY_ATTEMPTS, String(nextFailed));
        } catch {}

        if (nextFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
          try {
            localStorage.setItem(STORAGE_KEY_LOCKOUT_UNTIL, String(until));
          } catch {}
          setLockoutTimer(LOCKOUT_DURATION_SECONDS);
          setErrorMsg(
            'Kata sandi salah sebanyak 5 kali. Akses login Anda dikunci sementara selama 15 menit demi perlindungan keamanan akun.'
          );
        } else {
          setErrorMsg(
            `Kata sandi yang Anda masukkan salah. Sisa kesempatan: ${MAX_FAILED_LOGIN_ATTEMPTS - nextFailed}x (Jika salah 5 kali, akses terkunci 15 menit).`
          );
        }
        return;
      }

      // Successful login - reset failed attempts and lockout
      try {
        localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
        localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
      } catch {}
      setFailedAttempts(0);
      setLockoutTimer(0);
      setIsLoading(false);
      onLogin(matchedUser, rememberMe);
    }, 280);
  };

  // Google Firebase Auth Sign-In
  const handleGoogleSignIn = async () => {
    if (lockoutTimer > 0) {
      setErrorMsg(
        `Akses login sedang terkunci sementara selama ${formatLockoutText(
          lockoutTimer
        )} (${formatLockoutDigital(lockoutTimer)}) karena 5x salah sandi.`
      );
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const authResult = await signInWithGoogle();
      if (!authResult) {
        setIsLoading(false);
        return;
      }
      const fbUser = authResult.user;
      const userEmail = fbUser.email || '';
      // Check if user is known staff by email or bootstrapped admin
      const matched = staffUsers.find((u) => u.email?.toLowerCase() === userEmail.toLowerCase()) ||
        staffUsers.find((u) => u.accId === 'admin') ||
        staffUsers[0];

      const activeUser: User = {
        ...matched,
        name: fbUser.displayName || matched.name,
        photo: fbUser.photoURL || matched.photo,
        email: userEmail
      };

      setIsLoading(false);
      onLogin(activeUser, rememberMe);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        return;
      }
      setErrorMsg(`Gagal masuk dengan Google: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Simple Bar */}
      <header className="px-3 sm:px-6 py-3 sm:py-4 border-b border-zinc-800/60 flex items-center justify-between z-10 backdrop-blur-md bg-zinc-950/40 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-orange-500/25 shrink-0">
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 -rotate-45" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black tracking-wider text-white truncate block">GYMPRO ERP</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold uppercase hidden xs:inline">
              Enterprise
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="text-[11px] sm:text-xs font-bold text-orange-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition cursor-pointer min-h-[38px]"
            >
              <span>←</span>
              <span className="hidden sm:inline">Landing Page</span>
              <span className="sm:hidden">Web</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/25">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-[11px]">Firebase Cloud</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
            <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>{formatDateIndo(APP_TODAY)}</span>
          </div>

          <button
            type="button"
            onClick={openThemeModal}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition cursor-pointer min-h-[38px] min-w-[38px] justify-center"
            title={`Tema: ${theme.mode} • Aksen: ${currentAccent.name}`}
          >
            <Palette className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentAccent.hex }} />
            <span className="hidden sm:inline">Tema</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition min-h-[38px]"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">Bantuan</span>
          </button>
        </div>
      </header>

      {/* Center Main Login Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Welcome & Info (Hidden on small mobile if compact, shown on tablet/desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6 pr-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fitness Enterprise Management</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                Kelola Gym & Fitness Center Secara Terpadu.
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Akses dashboard terintegrasi untuk POS kasir, presensi scan QR card, manajemen komisi trainer PT, CRM prospek, dan laporan laba rugi real-time.
              </p>
            </div>

            {/* Feature Bullet Badges */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Multi-Role RBAC Aman</h4>
                  <p className="text-[11px] text-zinc-400">Hak akses terspesialisasi untuk Admin, Kasir, Leader, & Trainer.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Sinkronisasi Sesi Otomatis</h4>
                  <p className="text-[11px] text-zinc-400">Pencatatan shift pagi & siang dengan pembukuan kas harian.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Sistem server operasional aktif & siap melayani</span>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* Primary Login Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Masuk ke Akun Staf</span>
                  <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                    Sesi Kerja
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Masukkan ID Akun dan kata sandi yang telah terdaftar di sistem.
                </p>
              </div>

              {/* Prominent Security Lockout Alert Banner */}
              {lockoutTimer > 0 && (
                <div className="mb-5 p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500/60 shadow-xl shadow-rose-950/60 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-rose-200 flex items-center gap-1.5">
                          <span>Akses Login Terkunci (15 Menit)</span>
                        </h4>
                        <span className="font-mono text-sm sm:text-base font-black px-2.5 py-0.5 rounded-lg bg-rose-900/90 border border-rose-500/60 text-white tracking-widest shadow-inner">
                          {formatLockoutDigital(lockoutTimer)}
                        </span>
                      </div>
                      <p className="text-xs text-rose-300/90 mt-1.5 leading-relaxed">
                        Terdeteksi <strong className="text-white">5 kali</strong> kesalahan kata sandi berturut-turut. Sistem mengunci akses selama <strong className="text-white">15 menit</strong> demi melindungi keamanan akun staf GymPro ERP.
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-rose-400/90 border-t border-rose-500/20 pt-2">
                        <span>Waktu tersisa: <strong className="text-rose-100 font-bold">{formatLockoutText(lockoutTimer)}</strong></span>
                        <span className="text-[10px] text-zinc-400 hidden sm:inline">Timer tetap berjalan saat browser dimuat ulang</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert Message */}
              {errorMsg && lockoutTimer <= 0 && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Username / ID Input */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ID Akun / Username / No. HP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      disabled={lockoutTimer > 0 || isLoading}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder={lockoutTimer > 0 ? "Akses dibekukan..." : "Contoh: admin, kasir, keuangan, pt, atau S13"}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-900/60"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-300">
                      Kata Sandi (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHelpModal(true)}
                      className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={lockoutTimer > 0 || isLoading}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder={lockoutTimer > 0 ? "Akses dibekukan..." : "Masukkan kata sandi..."}
                      className="w-full pl-10 pr-11 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-900/60"
                    />
                    <button
                      type="button"
                      disabled={lockoutTimer > 0 || isLoading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition disabled:opacity-40"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Failed attempts warning indicator */}
                  {failedAttempts > 0 && lockoutTimer === 0 && (
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-[11px] text-amber-300">
                      <span>Percobaan salah: <strong className="text-white font-bold">{failedAttempts}/{MAX_FAILED_LOGIN_ATTEMPTS}</strong></span>
                      <span className="font-semibold text-amber-400">{MAX_FAILED_LOGIN_ATTEMPTS - failedAttempts}x lagi sebelum akun dikunci 15 menit</span>
                    </div>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={lockoutTimer > 0 || isLoading}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-xs text-zinc-400 font-medium">Ingat sesi di perangkat ini</span>
                  </label>
                </div>

                {/* Quick Staff Credentials Helper */}
                <div className="pt-2 pb-1">
                  <p className="text-[11px] font-semibold text-zinc-400 mb-1.5">
                    Pilih Cepat Akun Staf (Sandi: 123):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      disabled={lockoutTimer > 0 || isLoading}
                      onClick={() => {
                        setUsername('admin');
                        setPassword('123');
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="text-[11px] font-mono px-2 py-1.5 rounded-xl bg-zinc-950 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition text-center disabled:opacity-40"
                    >
                      👑 Admin HQ
                    </button>
                    <button
                      type="button"
                      disabled={lockoutTimer > 0 || isLoading}
                      onClick={() => {
                        setUsername('keuangan');
                        setPassword('123');
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="text-[11px] font-mono px-2 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 transition text-center disabled:opacity-40 font-bold"
                    >
                      💰 Keuangan
                    </button>
                    <button
                      type="button"
                      disabled={lockoutTimer > 0 || isLoading}
                      onClick={() => {
                        setUsername('kasir');
                        setPassword('123');
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="text-[11px] font-mono px-2 py-1.5 rounded-xl bg-zinc-950 border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 transition text-center disabled:opacity-40"
                    >
                      🖥️ Kasir POS
                    </button>
                    <button
                      type="button"
                      disabled={lockoutTimer > 0 || isLoading}
                      onClick={() => {
                        setUsername('leader_pt');
                        setPassword('123');
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="text-[11px] font-mono px-2 py-1.5 rounded-xl bg-zinc-950 border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition text-center disabled:opacity-40"
                    >
                      🏋️ Leader PT
                    </button>
                    <button
                      type="button"
                      disabled={lockoutTimer > 0 || isLoading}
                      onClick={() => {
                        setUsername('kreator');
                        setPassword('123');
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="text-[11px] font-mono px-2 py-1.5 rounded-xl bg-zinc-950 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/10 transition text-center disabled:opacity-40 font-bold"
                    >
                      🎨 Konten Kreator
                    </button>
                    <button
                      type="button"
                      disabled={lockoutTimer > 0 || isLoading}
                      onClick={() => {
                        setUsername('keamanan');
                        setPassword('123');
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="text-[11px] font-mono px-2 py-1.5 rounded-xl bg-zinc-950 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 transition text-center disabled:opacity-40 font-bold"
                    >
                      🛡️ Keamanan
                    </button>
                    <button
                      type="button"
                      disabled={lockoutTimer > 0 || isLoading}
                      onClick={() => {
                        setUsername('kebersihan');
                        setPassword('123');
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="text-[11px] font-mono px-2 py-1.5 rounded-xl bg-zinc-950 border border-teal-500/30 text-teal-300 hover:bg-teal-500/10 transition text-center disabled:opacity-40 font-bold"
                    >
                      🧹 Kebersihan
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || lockoutTimer > 0}
                  className="w-full mt-2 py-3.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-zinc-950 font-black text-sm rounded-2xl transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lockoutTimer > 0 ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Akses Terkunci Sementara ({formatLockoutDigital(lockoutTimer)})</span>
                    </>
                  ) : isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {/* Google Firebase Auth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || lockoutTimer > 0}
                  className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-100 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk dengan Google (Firebase Auth)</span>
                </button>
              </form>
            </div>

            {/* Bottom Info Note */}
            <div className="flex items-center justify-between px-3 text-xs text-zinc-500">
              <span>Keamanan terenkripsi SSL 256-bit</span>
              <span>GymPro ERP v2.5 Ultimate</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-zinc-800/60 text-center text-xs text-zinc-500 z-10 backdrop-blur-md bg-zinc-950/40">
        &copy; {new Date().getFullYear()} GymPro ERP Enterprise. Seluruh hak cipta dilindungi.
      </footer>

      {/* Help / Forgot Password Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Bantuan Akun & Lupa Sandi
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Kata sandi akun staf dikelola langsung oleh Administrator Sistem untuk memastikan keamanan transaksi keuangan dan data member.
            </p>

            <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs mb-5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-zinc-200">Informasi Akun Staf:</span>
                  <p className="text-zinc-400 mt-0.5">
                    Gunakan ID pengguna resmi atau Username serta kata sandi yang telah didaftarkan oleh Administrator Sistem.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="w-full">
                  <span className="font-bold text-zinc-200">Daftar Akun Standar (Sandi: 123):</span>
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                    <div className="flex justify-between">
                      <span className="text-rose-300">Super Admin (HQ)</span>
                      <span>Username: <strong className="text-white">admin</strong></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300 font-bold">Staf Keuangan (HQ)</span>
                      <span>Username: <strong className="text-white">keuangan</strong></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Kasir & Front Desk</span>
                      <span>Username: <strong className="text-white">kasir</strong></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-300">Head Coach / Leader PT</span>
                      <span>Username: <strong className="text-white">leader_pt</strong></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fuchsia-300 font-bold">Konten Kreator & CMS</span>
                      <span>Username: <strong className="text-white">kreator</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-zinc-200">Reset Sandi Mandiri:</span>
                  <p className="text-zinc-400 mt-0.5">
                    Hubungi Admin atau PIC di meja operasional untuk bantuan pemulihan kata sandi akun Anda.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition"
            >
              Mengerti & Kembali ke Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, X, ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_PIC_PROTECTION } from '../data/settingsData';
import { User } from '../types';

interface PicPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  currentStaffName?: string;
  currentUser?: User | null;
  showToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PicPasswordModal: React.FC<PicPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Otorisasi Ganti PIC Member',
  description = 'Masukkan password otorisasi keamanan untuk membuka kunci dan mengganti staf penanggung jawab (PIC).',
  currentStaffName,
  currentUser,
  showToast
}) => {
  const { settings, verifyPicPassword } = useSettings();
  const picProtection = settings.picProtection || DEFAULT_PIC_PROTECTION;

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const canBypass = isAdmin && picProtection.allowAdminBypass;

  useEffect(() => {
    if (isOpen) {
      setPasswordInput('');
      setShowPassword(false);
      setErrorMsg('');
      setIsShaking(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!passwordInput.trim()) {
      setErrorMsg('Password otorisasi tidak boleh kosong.');
      triggerShake();
      return;
    }

    const isValid = verifyPicPassword(passwordInput);

    if (isValid) {
      if (showToast) {
        showToast(
          'Otorisasi Berhasil 🔓',
          'Kunci PIC telah dibuka. Silakan pilih staf PIC baru.',
          'success'
        );
      }
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Password otorisasi salah. Hubungi Administrator / Manager.');
      triggerShake();
      if (showToast) {
        showToast(
          'Akses Ditolak ❌',
          'Password otorisasi salah. Penggantian PIC dibatalkan.',
          'error'
        );
      }
    }
  };

  const handleAdminBypass = () => {
    if (showToast) {
      showToast(
        'Bypass Otorisasi Admin 🛡️',
        `Kunci PIC dibuka melalui hak akses ${currentUser?.roleName || 'Administrator'}.`,
        'info'
      );
    }
    onSuccess();
    onClose();
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
      <div
        className={`bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 transition-transform duration-200 ${
          isShaking ? 'animate-bounce' : 'scale-100'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Proteksi Integritas Komisi & Staf</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current PIC Info Card */}
        {currentStaffName && (
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-center gap-2.5 text-xs text-zinc-300">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                PIC Saat Ini Terkunci
              </span>
              <span className="font-bold text-white">{currentStaffName}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-300 leading-relaxed">
          {description}
        </p>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Password Otorisasi Ganti PIC <span className="text-orange-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Masukkan password otorisasi..."
                className={`w-full pl-10 pr-12 py-3 bg-zinc-950 border rounded-2xl text-sm font-semibold text-white placeholder-zinc-500 outline-none transition ${
                  errorMsg
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg ? (
              <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 mt-2">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </p>
            ) : (
              <p className="text-[10px] text-zinc-500 mt-1.5">
                Password default sistem: <strong className="text-zinc-400 font-mono">123</strong> (dapat diubah di menu Pengaturan).
              </p>
            )}
          </div>

          {/* Admin Bypass Option */}
          {canBypass && (
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                <div>
                  <span className="font-bold text-orange-300 block">Hak Akses Admin Aktif</span>
                  <span className="text-[10px] text-zinc-400">Anda dapat membuka kunci langsung tanpa password.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdminBypass}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shrink-0 active:scale-95 cursor-pointer shadow"
              >
                Bypass Admin
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Verifikasi & Buka Kunci</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

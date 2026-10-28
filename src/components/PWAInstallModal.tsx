import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Apple,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  Zap,
  HardDrive,
  ShieldCheck
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isIOS, isInstallable, install } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>(
    isIOS ? 'ios' : 'android'
  );
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div
        id="pwa-install-modal-content"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto text-left"
      >
        {/* Header with App Logo & Close */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="RFA GYM"
              className="w-12 h-12 rounded-2xl shadow-md border border-orange-500/30 object-cover bg-zinc-950 p-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  RFA GYM App
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Mobile & Desktop
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Pasang aplikasi di iPhone, iPad, atau ponsel Android Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits banner */}
        <div className="my-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center gap-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-[11px] text-zinc-200">Akses Cepat</span>
            <span className="text-[10px] text-zinc-500">Dari Home Screen</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center gap-1">
            <Smartphone className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-[11px] text-zinc-200">Layar Penuh</span>
            <span className="text-[10px] text-zinc-500">Tanpa Bar Browser</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center gap-1">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-[11px] text-zinc-200">Offline Cache</span>
            <span className="text-[10px] text-zinc-500">Aman & Terenkripsi</span>
          </div>
        </div>

        {/* Platform Toggle Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 mb-4">
          <button
            type="button"
            onClick={() => setActivePlatform('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePlatform === 'android'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android / Chrome</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePlatform === 'ios'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS (iPhone / iPad)</span>
          </button>
        </div>

        {/* Content based on Active Platform */}
        {activePlatform === 'android' ? (
          <div className="space-y-4">
            {/* Direct install button if browser supports beforeinstallprompt */}
            {isInstallable && (
              <div className="p-3.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-2xl">
                <p className="text-xs text-zinc-300 mb-2.5">
                  Perangkat Anda siap memasang RFA GYM secara langsung:
                </p>
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  disabled={installing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{installing ? 'Memproses...' : 'Pasang Aplikasi Sekarang'}</span>
                </button>
              </div>
            )}

            {/* Android Step-by-Step Instructions */}
            <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>Langkah Manual di Android (Google Chrome / Edge):</span>
              </h4>
              <ol className="space-y-2.5 text-zinc-300 list-decimal list-inside pl-1">
                <li className="leading-relaxed">
                  Buka aplikasi di Google Chrome, Edge, atau Samsung Internet.
                </li>
                <li className="leading-relaxed">
                  Tekan ikon menu titik tiga (<strong className="text-white">⋮</strong>) di pojok kanan atas browser.
                </li>
                <li className="leading-relaxed">
                  Pilih menu <strong className="text-orange-400">"Install aplikasi"</strong> atau <strong className="text-orange-400">"Tambahkan ke Layar Utama"</strong> (*Add to Home screen*).
                </li>
                <li className="leading-relaxed">
                  Tekan <strong className="text-white">"Install"</strong>. Aplikasi RFA GYM akan langsung tersedia di menu aplikasi ponsel Anda.
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* iOS Step-by-Step Instructions */}
            <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 space-y-3.5 text-xs">
              <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-zinc-800">
                <Apple className="w-4 h-4 text-orange-400" />
                <span>Petunjuk Pemasangan di iPhone & iPad (Safari)</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="text-zinc-300 text-xs">
                    Buka halaman RFA GYM ini menggunakan browser <strong className="text-white">Safari</strong> di iPhone/iPad Anda.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="text-zinc-300 text-xs">
                    Tekan tombol <strong className="text-white">Bagikan (Share)</strong> di bilah bawah Safari.
                    <div className="mt-1 flex items-center gap-1.5 text-orange-400 font-semibold">
                      <Share2 className="w-4 h-4" />
                      <span>(Ikon kotak dengan tanda panah ke atas)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="text-zinc-300 text-xs">
                    Gulir ke bawah dan pilih opsi:
                    <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      <PlusSquare className="w-4 h-4 shrink-0" />
                      <span>"Tambah ke Layar Utama" (Add to Home Screen)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="text-zinc-300 text-xs">
                    Tekan tombol <strong className="text-white">"Tambah" (Add)</strong> di pojok kanan atas. Selesai! GymPro kini hadir di Homescreen iOS Anda.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security badge & Close Button */}
        <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PWA Terverifikasi Standar Web Standalone</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

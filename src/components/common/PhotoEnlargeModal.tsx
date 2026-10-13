import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  User,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';

export interface PhotoEnlargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  name: string;
  id?: string;
  roleOrType?: string;
  subInfo?: string;
  badgeType?: 'member' | 'staff' | 'document';
}

export const PhotoEnlargeModal: React.FC<PhotoEnlargeModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  name,
  id,
  roleOrType,
  subInfo,
  badgeType = 'member'
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  // Reset zoom and state when opening new photo
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setImgError(false);
    }
  }, [isOpen, imageUrl]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      const sanitizedName = name.replace(/\s+/g, '_');
      link.download = `Foto_${sanitizedName}_${id || 'detail'}.jpg`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const handleOpenNewTab = () => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  const displayBadgeText =
    badgeType === 'staff'
      ? 'Karyawan / Staf'
      : badgeType === 'document'
      ? 'Lampiran Identitas'
      : 'Member Gym';

  const badgeColorClass =
    badgeType === 'staff'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      : badgeType === 'document'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-orange-500/10 text-orange-400 border-orange-500/30';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 relative ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-3xl max-h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              {badgeType === 'document' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white truncate">{name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColorClass}`}
                >
                  {displayBadgeText}
                </span>
                {roleOrType && (
                  <span className="text-[11px] text-zinc-400 font-semibold hidden sm:inline">
                    • {roleOrType}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                {id && <span className="font-mono text-orange-400 font-bold">{id}</span>}
                {subInfo && (
                  <>
                    <span>•</span>
                    <span className="truncate">{subInfo}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
              title="Buka Foto di Tab Baru"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
              title="Unduh Foto Profil"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition hidden sm:inline-flex"
              title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition ml-1"
              title="Tutup (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Canvas */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 p-4 sm:p-8 flex items-center justify-center relative select-none min-h-[300px]">
          {imgError ? (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                <User className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">Gagal memuat gambar foto</p>
              <p className="text-xs text-zinc-500">Tautan gambar mungkin tidak valid atau kadaluarsa.</p>
            </div>
          ) : (
            <div
              className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={imageUrl}
                alt={name}
                onError={() => setImgError(true)}
                className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-2xl border-2 border-zinc-800/80 bg-zinc-950"
              />
            </div>
          )}

          {/* Zoom Level Indicator Float */}
          {zoomLevel !== 1 && (
            <div className="absolute top-4 right-4 bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold text-orange-400 backdrop-blur-sm pointer-events-none shadow-lg">
              {Math.round(zoomLevel * 100)}%
            </div>
          )}
        </div>

        {/* Bottom Toolbar Controls */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 hidden sm:block">
            Gunakan tombol zoom atau shortcut <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[10px] text-zinc-300 border border-zinc-700">+</kbd> / <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[10px] text-zinc-300 border border-zinc-700">-</kbd>
          </div>

          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Perkecil (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" /> Perkecil
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Reset Ukuran (0)"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 100%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3.5}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" /> Perbesar
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

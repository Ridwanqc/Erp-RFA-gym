import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Printer, Share2, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { Member } from '../types';

declare global {
  interface Window {
    QRious?: any;
    html2canvas?: any;
  }
}

interface IDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

// Generate deterministic 8-character hex code for any member
export function getMemberPassCode(memberId: string, memberName?: string): string {
  if (memberName?.toUpperCase().includes('AHMAD TAJUDIN') || memberId === 'M001') {
    return '97B6B347';
  }
  let hash = 0;
  const str = `${memberId}_${memberName || ''}_RFA_GYM`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = (Math.abs(hash) + 0x10000000).toString(16).toUpperCase().padStart(8, '0').slice(-8);
  return hex;
}

export const IDCardModal: React.FC<IDCardModalProps> = ({ isOpen, onClose, member }) => {
  const qrRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // State options
  const [useSampleName, setUseSampleName] = useState(false);
  const [customPassCode, setCustomPassCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const displayName = useSampleName
    ? 'AT AHMAD TAJUDIN'
    : (member?.name.toUpperCase() || 'AT AHMAD TAJUDIN');

  const displayPassCode = customPassCode || (member ? getMemberPassCode(member.id, displayName) : '97B6B347');

  // Render QR code whenever modal opens or passCode / member changes
  useEffect(() => {
    if (!isOpen || !qrRef.current) return;

    const renderQR = () => {
      if (window.QRious && qrRef.current) {
        new window.QRious({
          element: qrRef.current,
          value: `RFA-MEMBER:${member?.id || 'M001'}:${displayPassCode}`,
          size: 76,
          background: '#ffffff',
          foreground: '#000000',
          level: 'H'
        });
      }
    };

    // Slight delay to ensure element is in DOM
    const timer = setTimeout(renderQR, 50);
    return () => clearTimeout(timer);
  }, [isOpen, member, displayPassCode, useSampleName]);

  if (!isOpen || !member) return null;

  const handleDownloadPNG = () => {
    if (!cardRef.current || !window.html2canvas) return;
    setIsGenerating(true);

    window.html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false
    })
      .then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `RFA_MemberPass_${displayPassCode}_${displayName.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsGenerating(false);
      })
      .catch((err: any) => {
        console.error('Error generating card image:', err);
        setIsGenerating(false);
      });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(displayPassCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Halo Kak ${member.name},\nBerikut adalah Digital Member Pass RFA GYM kamu:\n\n*Kode Akses:* ${displayPassCode}\n*Member ID:* ${member.id}\n*Masa Berlaku:* s/d ${member.expired}\n\nTunjukkan kartu digital ini saat scan akses gym & presensi harian. Tetap semangat latihan! 💪🏋️`;
    const phone = member.phone ? member.phone.replace(/^0/, '62').replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl p-4 sm:p-6 my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Digital Member Pass RFA GYM
              </h3>
              <p className="text-[11px] text-zinc-400">
                Kartu akses keanggotaan fitness modern & QR Code presensi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar (Sample Name toggle & Passcode) */}
        <div className="mt-3.5 mb-2 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium text-[11px]">Nama Kartu:</span>
            <button
              onClick={() => setUseSampleName(!useSampleName)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                useSampleName
                  ? 'bg-orange-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {useSampleName ? 'Nama Foto (AT AHMAD TAJUDIN)' : `Member Asli (${member.name})`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium text-[11px]">Pass Code:</span>
            <span className="font-mono font-black text-orange-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-xs">
              {displayPassCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Salin Kode Pass"
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Card Display Area */}
        <div className="flex justify-center items-center py-2 sm:py-3 overflow-x-auto">
          {/* Exact Design Container matching the user's photo */}
          <div
            ref={cardRef}
            id="digital-member-pass-card"
            className="relative w-[300px] h-[550px] rounded-[24px] overflow-hidden shadow-2xl select-none shrink-0"
            style={{
              backgroundColor: '#0a0b0e',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(249, 115, 22, 0.15)'
            }}
          >
            {/* 1. Subtle Hexagonal Mesh Watermark Pattern */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ opacity: 0.16 }}
            >
              <defs>
                <pattern
                  id="rfa-hex-grid"
                  width="30"
                  height="51.96"
                  patternUnits="userSpaceOnUse"
                  patternTransform="scale(0.85)"
                >
                  <path
                    d="M15 0 L30 8.66 L30 25.98 L15 34.64 L0 25.98 L0 8.66 Z M15 51.96 L30 43.3 L30 25.98 L15 34.64 L0 25.98 L0 43.3 Z"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#rfa-hex-grid)" />
            </svg>

            {/* 2. Left Edge Vertical Bright Orange Strip (Top) */}
            <div
              className="absolute top-0 left-0 w-[14px] h-[170px]"
              style={{
                backgroundColor: '#f95700',
                clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)'
              }}
            />

            {/* 3. Right Edge Vertical Bright Orange Strip (Bottom) */}
            <div
              className="absolute bottom-0 right-0 w-[22px] h-[260px]"
              style={{
                backgroundColor: '#f95700'
              }}
            />

            {/* 4. Top-Right Armor Panel with 3 Orange Slash Stripes */}
            <div
              className="absolute top-0 right-0 w-[145px] h-[175px]"
              style={{
                backgroundColor: '#1b1d22',
                clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 80% 100%, 0 35%)',
                borderLeft: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {/* Bevel edge highlight */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)'
                }}
              />
              {/* 3 Diagonal Orange Hazard / Speed Slash Stripes */}
              <div className="absolute top-[38px] right-[18px] flex flex-col gap-2 rotate-[42deg]">
                <div className="w-[32px] h-[6px] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-xs shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <div className="w-[32px] h-[6px] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-xs shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <div className="w-[32px] h-[6px] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-xs shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              </div>
            </div>

            {/* 5. Bottom-Left Armor Panel with 3 Orange Slash Stripes */}
            <div
              className="absolute bottom-0 left-0 w-[130px] h-[225px]"
              style={{
                backgroundColor: '#1b1d22',
                clipPath: 'polygon(0 0, 45% 0, 100% 45%, 100% 100%, 0 100%)',
                borderRight: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {/* Bevel highlight */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.08) 0%, transparent 60%)'
                }}
              />
              {/* 3 Diagonal Orange Slash Stripes */}
              <div className="absolute bottom-[48px] left-[16px] flex flex-col gap-2 rotate-[42deg]">
                <div className="w-[32px] h-[6px] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-xs shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <div className="w-[32px] h-[6px] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-xs shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <div className="w-[32px] h-[6px] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-xs shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              </div>
            </div>

            {/* 6. Header: Brand Logo & Title */}
            <div className="relative pt-6 px-6 z-10 flex items-center gap-3">
              {/* Stylized Dynamic Fiery "R" Logo from Photo */}
              <div className="w-12 h-12 shrink-0 relative flex items-center justify-center filter drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="rfaFlameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffb703" />
                      <stop offset="45%" stopColor="#fb8500" />
                      <stop offset="100%" stopColor="#d90429" />
                    </linearGradient>
                  </defs>
                  {/* Outer Flame Wings */}
                  <path
                    d="M 18,32 C 30,12 70,8 88,14 C 74,22 55,24 45,28 C 65,28 85,38 82,54 C 80,66 65,72 50,72 L 40,72 L 58,92 C 50,92 42,90 32,80 L 22,66 L 26,45 Z"
                    fill="url(#rfaFlameGrad)"
                  />
                  {/* Dynamic Inner Cutout */}
                  <path
                    d="M 38,36 C 45,34 62,35 64,48 C 65,56 55,60 44,60 L 32,60 Z"
                    fill="#0a0b0e"
                  />
                  {/* Aerodynamic Speed Swoosh Feather */}
                  <path
                    d="M 12,32 C 26,18 52,14 76,14 C 54,20 34,26 18,38 Z"
                    fill="#ffb703"
                  />
                </svg>
              </div>

              {/* RFA GYM & FITNESS CENTER Typography */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-white font-black text-xl tracking-wider font-sans">
                    RFA
                  </span>
                  <span className="text-[#f95700] font-black text-xl tracking-wider font-sans">
                    GYM
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[8.5px] font-bold tracking-[0.25em] text-[#ff8800] uppercase">
                  <span className="w-2.5 h-[1px] bg-[#ff8800]/70" />
                  <span>FITNESS CENTER</span>
                  <span className="w-2.5 h-[1px] bg-[#ff8800]/70" />
                </div>
              </div>
            </div>

            {/* 7. QR Code Tab Pill (Protruding from Right Edge) */}
            <div
              className="absolute right-0 top-[195px] z-20 flex items-center pl-3 pr-2.5 py-2.5 rounded-l-[22px] bg-[#e6e7eb] shadow-xl border-t border-l border-b border-white/60"
              style={{
                boxShadow: '-4px 6px 14px rgba(0,0,0,0.5)'
              }}
            >
              <div className="p-1 bg-white rounded-xl shadow-xs">
                <canvas ref={qrRef} className="w-[74px] h-[74px] block" />
              </div>
            </div>

            {/* 8. Center Highlight Bar (Big Pass Code Banner) */}
            <div
              className="absolute left-0 top-[280px] z-20 w-[270px] py-3.5 pl-6 pr-5 rounded-r-[32px] bg-[#e6e7eb] flex items-center shadow-2xl border-t border-r border-b border-white/80"
              style={{
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
              }}
            >
              <span
                className="font-black text-[28px] sm:text-[30px] text-[#0d1322] tracking-[0.08em] font-sans leading-none select-all"
                style={{
                  letterSpacing: '0.06em'
                }}
              >
                {displayPassCode}
              </span>
            </div>

            {/* 9. Bottom Right Identity & Membership Section */}
            <div className="absolute right-[32px] bottom-[34px] z-20 text-right max-w-[200px]">
              {/* Member Name */}
              <h2
                className="font-black text-white text-[19px] sm:text-[20px] uppercase leading-tight font-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{
                  wordBreak: 'break-word'
                }}
              >
                {displayName}
              </h2>

              {/* Membership Label */}
              <p
                className="text-[12px] font-semibold text-[#f0f0f3] tracking-[0.24em] uppercase mt-3.5 font-sans"
              >
                MEMBERSHIP
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-zinc-400" /> Cetak Pass
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> Kirim WhatsApp
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
            >
              Tutup
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Menyiapkan...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Unduh Pass (PNG)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

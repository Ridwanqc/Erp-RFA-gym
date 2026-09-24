import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Printer,
  Sparkles,
  ShieldCheck,
  Clock,
  User,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { Member } from '../types';
import { getMemberStatus } from '../utils/memberStatus';
import { formatDateIndo } from '../utils/formatters';
import { getMemberPassCode } from './IDCardModal';

declare global {
  interface Window {
    QRious?: any;
    html2canvas?: any;
  }
}

interface MemberQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onOpenDigitalPass?: (member: Member) => void;
}

export const MemberQRCodeModal: React.FC<MemberQRCodeModalProps> = ({
  isOpen,
  onClose,
  member,
  onOpenDigitalPass
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrSize, setQrSize] = useState<number>(240);
  const [includeDetails, setIncludeDetails] = useState(true);

  const memberStatus = getMemberStatus(member);
  const passCode = getMemberPassCode(member.id, member.name);
  const qrRawValue = `RFA-MEMBER:${member.id}:${passCode}`;

  // Draw QR code onto canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const renderQR = () => {
      if (window.QRious && canvasRef.current) {
        new window.QRious({
          element: canvasRef.current,
          value: qrRawValue,
          size: qrSize,
          background: '#ffffff',
          foreground: '#09090b',
          level: 'H'
        });
      }
    };

    const timer = setTimeout(renderQR, 50);
    return () => clearTimeout(timer);
  }, [isOpen, qrRawValue, qrSize]);

  if (!isOpen) return null;

  // Copy raw QR value or passcode
  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrRawValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download QR as PNG image
  const handleDownloadQR = () => {
    setIsDownloading(true);

    if (includeDetails && cardRef.current && window.html2canvas) {
      window.html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#09090b',
        logging: false
      })
        .then((canvas: HTMLCanvasElement) => {
          const link = document.createElement('a');
          link.download = `QR_Akses_Gym_${member.id}_${member.name.replace(/\s+/g, '_')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setIsDownloading(false);
        })
        .catch((err: any) => {
          console.error('Error downloading card QR:', err);
          fallbackCanvasDownload();
        });
    } else {
      fallbackCanvasDownload();
    }
  };

  const fallbackCanvasDownload = () => {
    if (!canvasRef.current) {
      setIsDownloading(false);
      return;
    }
    const link = document.createElement('a');
    link.download = `QR_Access_${member.id}_${passCode}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    setIsDownloading(false);
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    const text = `Halo Kak ${member.name},\nBerikut adalah Kode Akses QR Code Masuk Gym kamu:\n\n*Member ID:* ${member.id}\n*Kode Pass:* ${passCode}\n*Status:* ${memberStatus.status}\n*Masa Aktif:* s/d ${formatDateIndo(member.expired)}\n\nTunjukkan QR Code ini langsung di meja resepsionis atau scan pada scanner akses masuk. Selamat berlatih di GymPro! 💪🏋️`;
    const phone = member.phone ? member.phone.replace(/^0/, '62').replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>QR Code Akses Gym</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {member.id}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Pintu masuk & sistem presensi check-in gym
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / QR Visual Card */}
        <div className="p-5 sm:p-6 space-y-5 bg-zinc-900 overflow-y-auto max-h-[75vh]">
          {/* Exportable QR Badge Card */}
          <div
            ref={cardRef}
            className="relative bg-gradient-to-b from-zinc-950 via-zinc-900 to-black border-2 border-zinc-800 rounded-3xl p-6 text-center shadow-xl space-y-4 overflow-hidden"
          >
            {/* Top Brand Tag */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2 text-left">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-zinc-950 font-black text-xs">
                  GP
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    RFA GYM & FITNESS
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono">ACCESS PASS TOKEN</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase border ${memberStatus.badgeBg} ${memberStatus.badgeColor} ${memberStatus.badgeBorder}`}
              >
                {memberStatus.status}
              </span>
            </div>

            {/* Member Quick Summary */}
            <div className="flex items-center justify-center gap-3 py-1">
              <img
                src={member.photo}
                alt={member.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-500/50 shadow-md shrink-0"
              />
              <div className="text-left min-w-0">
                <h4 className="text-base font-black text-white tracking-tight truncate max-w-[200px]">
                  {member.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="font-mono text-orange-400 font-bold">{member.id}</span>
                  <span>•</span>
                  <span>{member.membershipType}</span>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="relative inline-block p-4 bg-white rounded-3xl shadow-2xl shadow-orange-500/10 border-4 border-orange-500/20 my-1">
              <canvas ref={canvasRef} className="block mx-auto rounded-xl" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-zinc-950 flex items-center justify-center shadow-md font-black text-xs border-2 border-white">
                  GP
                </div>
              </div>
            </div>

            {/* Passcode & Validity Tag */}
            <div className="space-y-1.5 pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 uppercase font-mono">PASSCODE:</span>
                <span className="text-sm font-mono font-black text-orange-400 tracking-widest">
                  {passCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Salin Kode Akses"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  Berlaku s/d:{' '}
                  <strong className="text-zinc-200">{formatDateIndo(member.expired)}</strong>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pindai pada scanner meja kasir / turnstile gate</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={isDownloading}
              className="py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Menyimpan...' : 'Unduh QR (PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </button>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {onOpenDigitalPass && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDigitalPass(member);
                }}
                className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buka Digital Member Pass Lengkap</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="text-zinc-400 hover:text-white font-medium flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-500 text-[11px]">Format: RFA-MEMBER Protocol</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

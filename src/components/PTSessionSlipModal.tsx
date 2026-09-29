import React, { useState } from 'react';
import {
  Printer,
  X,
  Receipt,
  FileText,
  Check,
  MessageCircle,
  Clock,
  User,
  ShieldCheck,
  PenTool,
  Sparkles
} from 'lucide-react';
import { Schedule, GymBranch } from '../types';
import { APP_TODAY, formatDateIndo } from '../utils/formatters';
import {
  PrintPaperSize,
  printViaHiddenIframe,
  generatePTSessionSlipHtml
} from '../utils/printEngine';
import { useSettings } from '../context/SettingsContext';

interface PTSessionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  branch?: GymBranch;
}

export const PTSessionSlipModal: React.FC<PTSessionSlipModalProps> = ({
  isOpen,
  onClose,
  schedule,
  branch
}) => {
  const { settings, activeBranch } = useSettings();
  const defaultPrinterSize = settings?.printer?.paperWidth || '80mm';

  const [paperSize, setPaperSize] = useState<PrintPaperSize>(() => {
    if (defaultPrinterSize === '58mm' || defaultPrinterSize === '80mm' || defaultPrinterSize === 'a4') {
      return defaultPrinterSize;
    }
    return '80mm';
  });

  const [showSignatures, setShowSignatures] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !schedule) return null;

  const effectiveBranch = branch || activeBranch;
  const isThermal = paperSize === '58mm' || paperSize === '80mm';

  const handleExecutePrint = async () => {
    setIsPrinting(true);
    try {
      const html = generatePTSessionSlipHtml(schedule, effectiveBranch, paperSize, {
        showNotes,
        showSignatures,
        showBarcode,
        gymName: settings?.profile?.gymName || settings?.printer?.storeName || 'GYMPRO FITNESS & WELLNESS',
        tagline: settings?.profile?.tagline || 'Personal Training & Strength Conditioning'
      });

      await printViaHiddenIframe(html, {
        title: `Slip_PT_${schedule.id}_${paperSize}`,
        paperSize
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareWhatsApp = () => {
    let text = `🏋️ *SLIP BUKTI SESI PERSONAL TRAINER*\n`;
    text += `🏢 *${settings?.profile?.gymName || 'GYMPRO FITNESS'}*\n`;
    text += `📍 Outlet: ${effectiveBranch?.name || 'Cabang Utama'}\n`;
    text += `--------------------------------\n`;
    text += `No. Sesi : *${schedule.id}*\n`;
    text += `Tanggal  : *${schedule.date}* (${formatDateIndo(schedule.date)})\n`;
    text += `Waktu    : *${schedule.time} WIB*\n`;
    text += `Member   : *${schedule.memberName}*\n`;
    text += `Trainer  : *${schedule.trainer}*\n`;
    text += `Status   : ${schedule.status}\n`;
    if (schedule.bundleName) text += `Paket    : ${schedule.bundleName}\n`;
    if (schedule.note) text += `Catatan  : _${schedule.note}_\n`;
    text += `--------------------------------\n`;
    text += `_Harap hadir 10 menit sebelum sesi dimulai. Terima kasih!_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cetak Slip Sesi Personal Trainer</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Struk resmi kehadiran & tanda tangan sesi PT untuk member dan pelatih
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Split Controls & Live Preview */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Paper Size Selector */}
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-orange-400" />
              <span>Target Printer:</span>
            </span>

            <div className="flex items-center gap-1.5">
              {(['58mm', '80mm', 'a4'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPaperSize(size)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    paperSize === size
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {size === '58mm' ? 'Thermal 58mm' : size === '80mm' ? 'Thermal 80mm' : 'Kertas A4'}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="accent-orange-500 rounded"
              />
              <span className="text-zinc-300">Kolom Paraf</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
              <input
                type="checkbox"
                checked={showBarcode}
                onChange={(e) => setShowBarcode(e.target.checked)}
                className="accent-orange-500 rounded"
              />
              <span className="text-zinc-300">Barcode / ID</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
              <input
                type="checkbox"
                checked={showNotes}
                onChange={(e) => setShowNotes(e.target.checked)}
                className="accent-orange-500 rounded"
              />
              <span className="text-zinc-300">Catatan Sesi</span>
            </label>
          </div>

          {/* Realistic Slip Live Preview */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex justify-center max-h-[350px] overflow-y-auto">
            <div
              className={`bg-white text-black p-4 shadow-xl border border-zinc-300 font-mono text-[11px] leading-tight select-none ${
                paperSize === '58mm' ? 'w-[230px]' : paperSize === '80mm' ? 'w-[290px]' : 'w-full max-w-[420px]'
              }`}
              style={{
                borderRadius: '2px',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))'
              }}
            >
              <div className="text-center">
                <div className="font-bold text-sm uppercase">
                  {settings?.profile?.gymName || 'GYMPRO FITNESS'}
                </div>
                <div className="text-[10px] text-zinc-600">{effectiveBranch?.name || 'Cabang Utama'}</div>
                <div className="text-[9px] text-zinc-500">Telp: {effectiveBranch?.phone || '0812-9876-5432'}</div>
              </div>

              <div className="my-2 border-b-2 border-dashed border-black"></div>

              <div className="text-center font-bold text-xs uppercase">
                {isThermal ? 'SLIP SESI PERSONAL TRAINER' : 'VOUCHER RESMI SESI PT'}
              </div>

              <div className="my-1.5 border-b border-dashed border-black"></div>

              <div className="flex justify-between text-[10px] my-0.5">
                <span>No. Sesi:</span>
                <span className="font-bold">{schedule.id}</span>
              </div>
              <div className="flex justify-between text-[10px] my-0.5">
                <span>Tanggal:</span>
                <span className="font-bold">{schedule.date}</span>
              </div>
              <div className="flex justify-between text-[10px] my-0.5">
                <span>Waktu:</span>
                <span className="font-bold">{schedule.time} WIB</span>
              </div>
              <div className="flex justify-between text-[10px] my-0.5">
                <span>Status:</span>
                <span className="font-bold">{schedule.status}</span>
              </div>

              <div className="my-1.5 border-b border-dashed border-black"></div>

              <div className="flex justify-between text-[10px] my-0.5">
                <span>Member:</span>
                <span className="font-bold uppercase">{schedule.memberName}</span>
              </div>
              <div className="flex justify-between text-[10px] my-0.5">
                <span>Trainer:</span>
                <span className="font-bold">{schedule.trainer}</span>
              </div>
              {schedule.bundleName && (
                <div className="flex justify-between text-[10px] my-0.5">
                  <span>Paket:</span>
                  <span>{schedule.bundleName}</span>
                </div>
              )}

              {showNotes && schedule.note && (
                <div className="my-1 text-[9px] bg-zinc-100 p-1.5 rounded italic">
                  Note: "{schedule.note}"
                </div>
              )}

              {showSignatures && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-dotted border-black text-center text-[9px]">
                  <div>
                    <div className="text-zinc-500">Member</div>
                    <div className="mt-6 border-t border-black font-bold">({schedule.memberName})</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Trainer</div>
                    <div className="mt-6 border-t border-black font-bold">({schedule.trainer})</div>
                  </div>
                </div>
              )}

              {showBarcode && (
                <div className="text-center mt-3 pt-1 border-t border-dashed border-black">
                  <div className="tracking-[4px] font-bold text-xs">||| | |||| | |||||| |||</div>
                  <div className="text-[8px] text-zinc-600">*{schedule.id}*</div>
                </div>
              )}

              <div className="my-2 border-b border-dashed border-black"></div>
              <div className="text-center text-[8px] text-zinc-500">
                Dicetak: {new Date().toLocaleTimeString('id-ID')} WIB
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Kirim Slip WA</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              disabled={isPrinting}
              onClick={handleExecutePrint}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isPrinting
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-95'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Mencetak...' : `Cetak Slip (${paperSize.toUpperCase()})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

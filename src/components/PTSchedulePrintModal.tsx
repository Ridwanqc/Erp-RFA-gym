import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  FileText,
  Receipt,
  Check,
  Calendar as CalendarIcon,
  User,
  Filter,
  Layers,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { Schedule, User as UserType, GymBranch } from '../types';
import { APP_TODAY, formatDateIndo } from '../utils/formatters';
import {
  PrintPaperSize,
  printViaHiddenIframe,
  generatePTScheduleRosterHtml
} from '../utils/printEngine';
import { useSettings } from '../context/SettingsContext';

interface PTSchedulePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: Schedule[];
  trainers: UserType[];
  currentTrainerFilter?: string;
  currentPeriodLabel?: string;
  branch?: GymBranch;
}

export const PTSchedulePrintModal: React.FC<PTSchedulePrintModalProps> = ({
  isOpen,
  onClose,
  schedules,
  trainers,
  currentTrainerFilter = 'all',
  currentPeriodLabel = 'Hari Ini',
  branch
}) => {
  const { settings, activeBranch } = useSettings();
  const defaultPrinterSize = settings?.printer?.paperWidth || '80mm';

  // Selected Paper Size (Thermal 58mm, Thermal 80mm, A4, Letter)
  const [paperSize, setPaperSize] = useState<PrintPaperSize>(() => {
    if (defaultPrinterSize === '58mm' || defaultPrinterSize === '80mm' || defaultPrinterSize === 'a4' || defaultPrinterSize === 'letter') {
      return defaultPrinterSize;
    }
    return '80mm';
  });

  // Selected Scope
  const [scope, setScope] = useState<'current_filter' | 'today_only' | 'all_sessions'>('current_filter');
  const [selectedTrainer, setSelectedTrainer] = useState<string>(currentTrainerFilter);
  const [isPrinting, setIsPrinting] = useState(false);
  const [copiedWA, setCopiedWA] = useState(false);

  // Matched branch
  const effectiveBranch = branch || activeBranch;

  // Filtered schedules for printing
  const printSchedules = useMemo(() => {
    let list = [...schedules];

    // Filter by Scope
    if (scope === 'today_only') {
      list = list.filter((s) => s.date === APP_TODAY);
    }

    // Filter by Trainer
    if (selectedTrainer !== 'all') {
      list = list.filter((s) => s.trainer === selectedTrainer || s.trainerId === selectedTrainer);
    }

    // Sort by date, then time
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    return list;
  }, [schedules, scope, selectedTrainer]);

  if (!isOpen) return null;

  const isThermal = paperSize === '58mm' || paperSize === '80mm';
  const filterTrainerName = selectedTrainer === 'all' ? 'Semua Trainer' : selectedTrainer;
  const filterPeriodText =
    scope === 'today_only'
      ? `Hari Ini (${APP_TODAY})`
      : scope === 'all_sessions'
      ? 'Seluruh Jadwal Sistem'
      : currentPeriodLabel;

  const handleExecutePrint = async () => {
    setIsPrinting(true);
    try {
      const html = generatePTScheduleRosterHtml(printSchedules, effectiveBranch, paperSize, {
        title: isThermal ? 'AGENDA HARIAN PERSONAL TRAINER' : 'REKAPITULASI RESMI JADWAL PERSONAL TRAINER',
        filterTrainer: filterTrainerName,
        filterPeriod: filterPeriodText,
        gymName: settings?.profile?.gymName || settings?.printer?.storeName || 'GYMPRO FITNESS & WELLNESS'
      });

      await printViaHiddenIframe(html, {
        title: `Jadwal-PT-${filterTrainerName.replace(/\s+/g, '_')}-${paperSize}`,
        paperSize
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopySummaryText = () => {
    let text = `📋 *AGENDA JADWAL PERSONAL TRAINER*\n`;
    text += `🏢 *${settings?.profile?.gymName || 'GYMPRO FITNESS'}* - ${effectiveBranch?.name || 'Cabang Utama'}\n`;
    text += `👤 Trainer: *${filterTrainerName}*\n`;
    text += `📅 Periode: ${filterPeriodText}\n`;
    text += `--------------------------------\n`;
    text += `Total Sesi: ${printSchedules.length} Sesi Terjadwal\n\n`;

    if (printSchedules.length === 0) {
      text += `_Tidak ada jadwal sesi PT pada periode ini._\n`;
    } else {
      printSchedules.forEach((s, idx) => {
        const st =
          s.status === 'Selesai'
            ? '✅ Selesai'
            : s.valTrainer || s.valStaf
            ? '🔵 Confirmed'
            : '🟡 Pending';
        text += `${idx + 1}. *${s.time}* (${s.date})\n`;
        text += `   Member: *${s.memberName}*\n`;
        text += `   Trainer: ${s.trainer} | ${st}\n`;
        if (s.note) text += `   Note: _${s.note}_\n`;
        text += `\n`;
      });
    }

    text += `--------------------------------\n`;
    text += `_Dicetak via GymPro ERP Sistem Kasir & PT_`;

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Cetak Jadwal Personal Trainer</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Universal Print
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cetak ke printer thermal roll (58mm/80mm) untuk kasir/trainer atau printer standar (A4/Letter/PDF)
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

        {/* Modal Body: Split Controls & Live Realistic Preview */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Print Settings & Filter (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Target Printer / Paper Format */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Target Printer & Kertas:</span>
                </label>
                <span className="text-[10px] font-bold text-orange-400 uppercase">{paperSize}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperSize('58mm')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                    paperSize === '58mm'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300 ring-1 ring-orange-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5" /> Thermal 58mm
                    </span>
                    {paperSize === '58mm' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[9.5px] opacity-75">Mini POS / Bluetooth Roll</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperSize('80mm')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                    paperSize === '80mm'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300 ring-1 ring-orange-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5" /> Thermal 80mm
                    </span>
                    {paperSize === '80mm' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[9.5px] opacity-75">Desktop Kasir Gym (Standar)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperSize('a4')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                    paperSize === 'a4'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Kertas A4
                    </span>
                    {paperSize === 'a4' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[9.5px] opacity-75">Inkjet/Laser Roster Dokumen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperSize('letter')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                    paperSize === 'letter'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> US Letter
                    </span>
                    {paperSize === 'letter' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[9.5px] opacity-75">Printer Standar Kantor</span>
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>Rentang Jadwal (Scope):</span>
              </label>

              <div className="space-y-1.5">
                {[
                  { id: 'current_filter', label: `Sesuai Tampilan Kalender (${currentPeriodLabel})` },
                  { id: 'today_only', label: `Jadwal Hari Ini Saja (${APP_TODAY})` },
                  { id: 'all_sessions', label: `Seluruh Jadwal Sesi PT (${schedules.length} sesi)` }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition text-xs ${
                      scope === item.id
                        ? 'bg-zinc-900 border-orange-500/60 text-white font-bold'
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pt-print-scope"
                      value={item.id}
                      checked={scope === item.id}
                      onChange={() => setScope(item.id as any)}
                      className="accent-orange-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Trainer Filter */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>Filter Personal Trainer:</span>
              </label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">Semua Trainer ({trainers.length} pelatih)</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Metrics of Selected Result */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Total Sesi Akan Dicetak:</span>
              <span className="font-black text-white px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {printSchedules.length} Sesi
              </span>
            </div>
          </div>

          {/* Right Column: Realistic Live Preview (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Pratinjau Hasil Cetak ({paperSize.toUpperCase()})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                  {isThermal ? 'Rol Kertas Thermal' : 'Lembar Dokumen A4'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopySummaryText}
                className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer"
                title="Salin teks agenda untuk WhatsApp"
              >
                {copiedWA ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWA ? 'Tersalin!' : 'Salin Teks WA'}</span>
              </button>
            </div>

            {/* Preview Box Container */}
            <div className="flex-1 overflow-y-auto max-h-[380px] bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 flex justify-center">
              {isThermal ? (
                /* Thermal Roll Realistic Mockup */
                <div
                  className={`bg-white text-black p-4 shadow-xl border border-zinc-300 font-mono text-[11px] leading-tight select-none ${
                    paperSize === '58mm' ? 'w-[230px]' : 'w-[290px]'
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

                  <div className="text-center font-bold text-xs">AGENDA HARIAN PERSONAL TRAINER</div>
                  <div className="text-center text-[10px] text-zinc-700">
                    {filterTrainerName} • {filterPeriodText}
                  </div>

                  <div className="my-1.5 border-b border-dashed border-black"></div>

                  <div className="flex justify-between text-[10px]">
                    <span>Total Sesi: <b>{printSchedules.length}</b></span>
                    <span>Selesai: <b>{printSchedules.filter((s) => s.status === 'Selesai').length}</b></span>
                  </div>

                  <div className="my-1.5 border-b border-dashed border-black"></div>

                  {/* List */}
                  <div className="space-y-2 mt-2">
                    {printSchedules.length === 0 ? (
                      <div className="text-center text-[10px] py-4 text-zinc-500 italic">
                        Tidak ada sesi terdaftar
                      </div>
                    ) : (
                      printSchedules.slice(0, 8).map((s, i) => (
                        <div key={i} className="border-b border-dotted border-zinc-400 pb-1.5 text-[10px]">
                          <div className="flex justify-between font-bold">
                            <span>#{i + 1}. {s.time} WIB</span>
                            <span>{s.status === 'Selesai' ? '[DONE]' : '[PENDING]'}</span>
                          </div>
                          <div>Member: <b>{s.memberName}</b></div>
                          <div>Trainer: {s.trainer}</div>
                          {s.note && <div className="italic text-[9px] text-zinc-600">Note: {s.note}</div>}
                        </div>
                      ))
                    )}
                    {printSchedules.length > 8 && (
                      <div className="text-center text-[9px] text-zinc-600 pt-1">
                        ...dan {printSchedules.length - 8} sesi berikutnya
                      </div>
                    )}
                  </div>

                  <div className="my-2 border-b border-dashed border-black"></div>
                  <div className="text-center text-[9px] text-zinc-600">
                    Dicetak: {new Date().toLocaleTimeString('id-ID')} WIB
                  </div>
                  <div className="text-center text-[8px] text-zinc-400 mt-2">
                    -- [Garis Potong Thermal] --
                  </div>
                </div>
              ) : (
                /* A4 Document Formal Mockup */
                <div className="bg-white text-black p-6 shadow-xl border border-zinc-300 w-full max-w-[500px] text-[11px] leading-normal select-none">
                  {/* Kop */}
                  <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
                    <div>
                      <div className="font-black text-sm uppercase">
                        {settings?.profile?.gymName || 'GYMPRO FITNESS & WELLNESS'}
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        {effectiveBranch?.name || 'Cabang Utama'} • Telp: {effectiveBranch?.phone || '0812-9876-5432'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[11px] uppercase">REKAPITULASI JADWAL PT</div>
                      <div className="text-[9px] text-zinc-500">{new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                  </div>

                  {/* Summary bar */}
                  <div className="bg-zinc-100 p-2 rounded border border-zinc-300 flex justify-between text-[10px] mb-3">
                    <span>Trainer: <b>{filterTrainerName}</b></span>
                    <span>Periode: <b>{filterPeriodText}</b></span>
                    <span>Total: <b>{printSchedules.length} Sesi</b></span>
                  </div>

                  {/* Mini Table */}
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      <tr className="border-t border-b border-black bg-zinc-50">
                        <th className="py-1 px-1 text-left">Waktu</th>
                        <th className="py-1 px-1 text-left">Member</th>
                        <th className="py-1 px-1 text-left">Trainer</th>
                        <th className="py-1 px-1 text-center">Status</th>
                        <th className="py-1 px-1 text-center">Paraf</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printSchedules.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-zinc-500 italic">
                            Tidak ada jadwal sesi PT.
                          </td>
                        </tr>
                      ) : (
                        printSchedules.slice(0, 6).map((s, i) => (
                          <tr key={i} className="border-b border-zinc-200">
                            <td className="py-1 px-1 font-bold">{s.time}</td>
                            <td className="py-1 px-1">{s.memberName}</td>
                            <td className="py-1 px-1 font-medium">{s.trainer}</td>
                            <td className="py-1 px-1 text-center font-bold">
                              <span
                                className={`px-1 py-0.5 rounded text-[8px] ${
                                  s.status === 'Selesai'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="py-1 px-1 text-center text-zinc-400">[ &nbsp; ]</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-2 border-t border-zinc-200 text-center text-[9px]">
                    <div>
                      <div className="text-zinc-500">Resepsionis / Front Desk</div>
                      <div className="mt-8 border-t border-black font-bold">Petugas Kasir</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Koordinator Pelatih</div>
                      <div className="mt-8 border-t border-black font-bold">Head Coach</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Siap mencetak ke printer {isThermal ? 'thermal POS' : 'standar'} ({paperSize})</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isPrinting || printSchedules.length === 0}
              onClick={handleExecutePrint}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isPrinting || printSchedules.length === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-95'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Mencetak...' : `Cetak Sekarang (${paperSize.toUpperCase()})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

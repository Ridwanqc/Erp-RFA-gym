import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Building2,
  ShieldCheck,
  Edit3,
  Save,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { GymBranch } from '../types';
import { APP_TODAY } from '../utils/formatters';

interface BranchWhatsAppVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: GymBranch[];
  onUpdateBranch?: (id: string, updated: Partial<GymBranch>) => void;
  showToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export function validateIndonesianWhatsApp(rawPhone: string): {
  isValid: boolean;
  cleanDigits: string;
  internationalNumber: string;
  displayFormatted: string;
  statusMessage: string;
} {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      isValid: false,
      cleanDigits: '',
      internationalNumber: '',
      displayFormatted: '-',
      statusMessage: 'Nomor WhatsApp belum diisi'
    };
  }

  // Strip all non-digit characters
  const digits = rawPhone.replace(/\D/g, '');

  let international = digits;
  if (digits.startsWith('0')) {
    international = '62' + digits.slice(1);
  } else if (digits.startsWith('62')) {
    international = digits;
  } else if (digits.startsWith('8')) {
    international = '62' + digits;
  }

  // Indonesian mobile numbers usually have 10 to 14 digits in 08xx format (11 to 15 in 628xx format)
  const isValidLength = international.length >= 11 && international.length <= 15;
  const isIndonesianMobile = international.startsWith('628');

  const isValid = isValidLength && isIndonesianMobile;

  let statusMessage = 'Format terverifikasi (Standar Indonesia)';
  if (!isIndonesianMobile) {
    statusMessage = 'Perlu awalan 08 / 628 (Nomor seluler/WhatsApp)';
  } else if (!isValidLength) {
    statusMessage = `Panjang digit tidak standar (${international.length} digit)`;
  }

  // Human readable display: 0812-3456-7890
  let displayFormatted = rawPhone;
  if (international.startsWith('62')) {
    const local = '0' + international.slice(2);
    if (local.length >= 10) {
      displayFormatted = `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`;
    }
  }

  return {
    isValid,
    cleanDigits: digits,
    internationalNumber: international,
    displayFormatted,
    statusMessage
  };
}

export const BranchWhatsAppVerificationModal: React.FC<BranchWhatsAppVerificationModalProps> = ({
  isOpen,
  onClose,
  branches,
  onUpdateBranch,
  showToast
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWaInput, setEditWaInput] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState('');

  if (!isOpen) return null;

  const filteredBranches = branches.filter((b) => {
    const q = filterSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.whatsapp.toLowerCase().includes(q)
    );
  });

  const verifiedCount = branches.filter((b) => validateIndonesianWhatsApp(b.whatsapp).isValid).length;
  const totalCount = branches.length;

  const handleCopySingle = (branch: GymBranch) => {
    const val = validateIndonesianWhatsApp(branch.whatsapp);
    const textToCopy = `+${val.internationalNumber}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(branch.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (showToast) {
      showToast('Tersalin', `Nomor WA ${branch.name} (+${val.internationalNumber}) disalin.`, 'info');
    }
  };

  const handleStartEdit = (branch: GymBranch) => {
    setEditingId(branch.id);
    setEditWaInput(branch.whatsapp);
  };

  const handleSaveEdit = (branchId: string) => {
    if (!editWaInput.trim()) return;
    if (onUpdateBranch) {
      onUpdateBranch(branchId, { whatsapp: editWaInput.trim() });
      if (showToast) {
        showToast('Kontak Diperbarui', 'Nomor WhatsApp resmi cabang berhasil diperbarui.', 'success');
      }
    }
    setEditingId(null);
  };

  const handleTestChat = (branch: GymBranch) => {
    const val = validateIndonesianWhatsApp(branch.whatsapp);
    const msg = encodeURIComponent(
      `Halo Tim Front Desk ${branch.name}, ini adalah pesan uji verifikasi koneksi WhatsApp Resmi dari Pengaturan Kelola Cabang RFA Gym ERP.`
    );
    const waUrl = `https://wa.me/${val.internationalNumber}?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyAllSummary = () => {
    const lines = [
      `*DAFTAR KONTAK WHATSAPP RESMI UNIT CABANG RFA GYM*`,
      `Tanggal Pembaruan: ${APP_TODAY}`,
      `Total Cabang: ${branches.length} Outlet`,
      `--------------------------------------------------`,
      ...branches.map((b, idx) => {
        const val = validateIndonesianWhatsApp(b.whatsapp);
        return (
          `${idx + 1}. *${b.name}* [${b.code}]\n` +
          `   • Status: ${b.status} ${b.isMainBranch ? '(KANTOR PUSAT)' : ''}\n` +
          `   • No. WhatsApp Resmi: ${val.displayFormatted} (+${val.internationalNumber})\n` +
          `   • Link Chat Langsung: https://wa.me/${val.internationalNumber}\n` +
          `   • Telepon Kantor: ${b.phone || '-'}\n` +
          `   • Alamat: ${b.address}, ${b.city}\n` +
          `   • PIC Manager: ${b.managerName || '-'} (${b.managerPhone || '-'})\n` +
          `   • Jam Operasional: ${b.openHoursWeekday || '06:00 - 22:00'}`
        );
      }),
      `--------------------------------------------------`,
      `Nomor WhatsApp di atas terintegrasi langsung dengan landing page reservasi online & pendaftaran calon member.`
    ];

    const fullText = lines.join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);

    if (showToast) {
      showToast(
        'Kontak Disalin',
        'Seluruh daftar kontak WhatsApp cabang berhasil disalin ke clipboard!',
        'success'
      );
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Cabang',
      'Kode Cabang',
      'Nama Cabang',
      'Status Operasional',
      'Kantor Pusat',
      'Nomor WhatsApp Resmi',
      'Format WA Internasional',
      'Link Direct Chat WA',
      'Telepon Kantor',
      'Email Cabang',
      'Manager Cabang',
      'Kontak Manager',
      'Alamat Lengkap',
      'Kota',
      'Jam Buka Weekday',
      'Jam Buka Weekend',
      'Status Validasi WA'
    ];

    const rows = branches.map((b) => {
      const val = validateIndonesianWhatsApp(b.whatsapp);
      return [
        `"${b.id}"`,
        `"${b.code}"`,
        `"${b.name.replace(/"/g, '""')}"`,
        `"${b.status}"`,
        `"${b.isMainBranch ? 'Ya (HQ)' : 'Tidak'}"`,
        `"${b.whatsapp}"`,
        `"+${val.internationalNumber}"`,
        `"https://wa.me/${val.internationalNumber}"`,
        `"${b.phone || ''}"`,
        `"${b.email || ''}"`,
        `"${b.managerName ? b.managerName.replace(/"/g, '""') : ''}"`,
        `"${b.managerPhone || ''}"`,
        `"${b.address.replace(/"/g, '""')}"`,
        `"${b.city.replace(/"/g, '""')}"`,
        `"${b.openHoursWeekday || ''}"`,
        `"${b.openHoursWeekend || ''}"`,
        `"${val.isValid ? 'Terverifikasi' : 'Perlu Koreksi'}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kontak_WhatsApp_Resmi_Cabang_RFA_Gym_${APP_TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) {
      showToast(
        'Export CSV Berhasil',
        `File Kontak_WhatsApp_Resmi_Cabang_RFA_Gym_${APP_TODAY}.csv berhasil diunduh.`,
        'success'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl shadow-emerald-500/10 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Verifikasi & Ekspor Kontak WhatsApp Cabang
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Landing Page Sync
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pastikan seluruh nomor WhatsApp resmi cabang valid dan terintegrasi dengan tombol pendaftaran calon member.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Summary Banner & Actions */}
        <div className="p-4 sm:p-6 bg-zinc-900/50 border-b border-zinc-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 block uppercase">Total Outlet</span>
                <span className="text-xl font-black text-white">{totalCount} Cabang</span>
              </div>
              <Building2 className="w-5 h-5 text-zinc-500" />
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 block uppercase">WA Terverifikasi</span>
                <span className="text-xl font-black text-emerald-300">
                  {verifiedCount} / {totalCount} Cabang
                </span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 block uppercase">Integrasi Web</span>
                <span className="text-xs font-bold text-emerald-400">100% Aktif di Landing Page</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-orange-400" />
            </div>
          </div>

          {/* Export Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Cari cabang, kota, no WA..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopyAllSummary}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition border border-zinc-700 active:scale-95 cursor-pointer"
                title="Salin rekapitulasi kontak seluruh cabang ke clipboard"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-300" />
                    <span>Salin ke Clipboard</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/25 active:scale-95 cursor-pointer"
                title="Unduh data kontak cabang dalam format spreadsheet CSV"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredBranches.map((branch) => {
            const val = validateIndonesianWhatsApp(branch.whatsapp);
            const isEditing = editingId === branch.id;

            return (
              <div
                key={branch.id}
                className={`p-4 rounded-2xl border transition-all ${
                  val.isValid
                    ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                    : 'bg-amber-950/20 border-amber-500/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Branch Info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-white font-mono text-[10px] font-bold border border-zinc-700">
                        {branch.code}
                      </span>
                      <h4 className="text-sm font-black text-white truncate">{branch.name}</h4>
                      {branch.isMainBranch && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          HQ
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          branch.status === 'Aktif'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {branch.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-1">
                      {branch.address} • <strong className="text-zinc-300">{branch.city}</strong>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                      <span>Telp: {branch.phone || '-'}</span>
                      <span>•</span>
                      <span>PIC: {branch.managerName || '-'}</span>
                    </div>
                  </div>

                  {/* Right: WhatsApp Contact & Validation Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                    {/* Phone Display / Edit Mode */}
                    <div className="space-y-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editWaInput}
                            onChange={(e) => setEditWaInput(e.target.value)}
                            placeholder="0812-3456-7890"
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500 text-white font-mono text-xs focus:outline-none w-36"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(branch.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                            title="Simpan"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 cursor-pointer"
                            title="Batal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs sm:text-sm">
                            {val.displayFormatted}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            (+{val.internationalNumber})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(branch)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                            title="Edit nomor WhatsApp cabang ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Validation Status Pill */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {val.isValid ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{val.statusMessage}</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{val.statusMessage}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Copy & Test Chat */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopySingle(branch)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Salin nomor WhatsApp"
                      >
                        {copiedId === branch.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span>{copiedId === branch.id ? 'Tersalin' : 'Salin'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTestChat(branch)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        title="Kirim pesan uji coba via WhatsApp Web / App"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Test WA</span>
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Perubahan nomor WhatsApp di panel ini otomatis terhubung ke formulir pendaftaran landing page.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

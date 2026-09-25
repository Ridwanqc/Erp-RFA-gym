import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle2,
  Check,
  Filter,
  Users,
  UserCheck
} from 'lucide-react';
import { Member, User } from '../types';
import { exportMembers, exportStaff } from '../utils/dataImportExport';
import { APP_TODAY } from '../utils/formatters';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'member' | 'staff';
  allItems: (Member | User)[];
  filteredItems: (Member | User)[];
  filterLabel?: string;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  type,
  allItems,
  filteredItems,
  filterLabel,
  showToast
}) => {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [scope, setScope] = useState<'all' | 'filtered'>(filteredItems.length !== allItems.length ? 'filtered' : 'all');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const targetItems = scope === 'filtered' ? filteredItems : allItems;
  const count = targetItems.length;

  const handleExecuteExport = () => {
    setIsExporting(true);
    try {
      const dateStr = APP_TODAY;
      if (type === 'member') {
        const filename = `Data_Member_${scope === 'filtered' ? 'Filtered_' : 'All_'}${dateStr}.${format}`;
        exportMembers(targetItems as Member[], format, filename);
        showToast('Export Berhasil', `File ${filename} (${count} data member) berhasil diunduh.`, 'success');
      } else {
        const filename = `Data_Karyawan_${scope === 'filtered' ? 'Filtered_' : 'All_'}${dateStr}.${format}`;
        exportStaff(targetItems as User[], format, filename);
        showToast('Export Berhasil', `File ${filename} (${count} data karyawan) berhasil diunduh.`, 'success');
      }
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      showToast('Gagal Export', err.message || 'Terjadi kesalahan saat mengekspor data.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Export Data {type === 'member' ? 'Member Gym' : 'Karyawan & Staf'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Unduh rekapitulasi data lengkap dalam format spreadsheet.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-5 space-y-5 text-xs">
          
          {/* FORMAT CHOICE */}
          <div>
            <label className="font-bold text-white block mb-2">Pilih Format File:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                  format === 'xlsx'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-xs">Microsoft Excel</p>
                  <p className="text-[10px] text-zinc-400">Format .xlsx (Rekomendasi)</p>
                </div>
                {format === 'xlsx' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                  format === 'csv'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-xs">CSV Spreadsheet</p>
                  <p className="text-[10px] text-zinc-400">Format .csv (UTF-8)</p>
                </div>
                {format === 'csv' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* SCOPE CHOICE */}
          <div>
            <label className="font-bold text-white block mb-2">Cakupan Data yang Diekspor:</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                  scope === 'all'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div>
                  <p className="font-bold text-white text-xs">Semua Data {type === 'member' ? 'Member' : 'Karyawan'}</p>
                  <p className="text-[11px] text-zinc-400">Total {allItems.length} baris tanpa filter</p>
                </div>
                <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                  {allItems.length} Baris
                </span>
              </button>

              {filteredItems.length !== allItems.length && (
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                    scope === 'filtered'
                      ? 'bg-orange-500/10 border-orange-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div>
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-orange-400" />
                      Hasil Filter & Pencarian Saat Ini
                    </p>
                    <p className="text-[11px] text-zinc-400">{filterLabel || 'Sesuai status atau kata kunci yang dipilih'}</p>
                  </div>
                  <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-orange-400">
                    {filteredItems.length} Baris
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* COLUMN PREVIEW NOTE */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-400 text-[11px] space-y-1">
            <p className="font-bold text-white">Kolom yang disertakan dalam file:</p>
            {type === 'member' ? (
              <p>ID Member, Nama Lengkap, No WhatsApp, Status, Expired, Sisa Kuota PT, PIC Penanggung Jawab, Jenis Kelamin, Tanggal Gabung, NIK, Alamat, Tanggal Lahir, Kontak Darurat, Catatan.</p>
            ) : (
              <p>ID Karyawan, Username, Nama Lengkap, Role, Jabatan, Shift, Status Kepegawaian, Gaji Pokok, Tunjangan, WhatsApp, Email, Gender, Tanggal Bergabung, Kuota Cuti, Bank & No Rekening, NIK, Alamat, Kontak Darurat.</p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting || count === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Unduh {count} Data ({format.toUpperCase()})
          </button>
        </div>

      </div>
    </div>
  );
};

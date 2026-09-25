import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  RefreshCw,
  Info,
  Users,
  UserCheck,
  Search,
  Filter,
  Check,
  ChevronRight
} from 'lucide-react';
import { Member, User } from '../types';
import {
  parseMemberSpreadsheet,
  parseStaffSpreadsheet,
  downloadMemberTemplate,
  downloadStaffTemplate,
  ParsedImportRow
} from '../utils/dataImportExport';
import { formatRp } from '../utils/formatters';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'member' | 'staff';
  existingMembers: Member[];
  existingStaff: User[];
  onImportComplete: (importedItems: (Member | User)[], mode: 'merge' | 'skip_existing' | 'generate_new') => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  type,
  existingMembers,
  existingStaff,
  onImportComplete,
  showToast
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parsed results
  const [memberRows, setMemberRows] = useState<ParsedImportRow<Member>[]>([]);
  const [staffRows, setStaffRows] = useState<ParsedImportRow<User>[]>([]);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);

  // Strategy: 'merge' (update existing + add new), 'skip_existing' (only add new), 'generate_new' (force new ID for all)
  const [importStrategy, setImportStrategy] = useState<'merge' | 'skip_existing' | 'generate_new'>('merge');
  const [filterPreviewTab, setFilterPreviewTab] = useState<'all' | 'new' | 'update' | 'warnings'>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setMemberRows([]);
    setStaffRows([]);
    setErrorLogs([]);
    setParseError(null);
    setIsParsing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessFile = async (file: File) => {
    const validExts = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setParseError('Format file tidak didukung. Harap unggah file spreadsheet berekstensi .xlsx, .xls, atau .csv');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);

    try {
      if (type === 'member') {
        const res = await parseMemberSpreadsheet(file, existingMembers, existingStaff);
        setMemberRows(res.rows);
        setErrorLogs(res.errorMessages);
        if (res.rows.length === 0) {
          setParseError('Tidak ada data valid yang dapat dibaca dari file ini. Pastikan header tabel sudah sesuai.');
        }
      } else {
        const res = await parseStaffSpreadsheet(file, existingStaff);
        setStaffRows(res.rows);
        setErrorLogs(res.errorMessages);
        if (res.rows.length === 0) {
          setParseError('Tidak ada data valid yang dapat dibaca dari file ini. Pastikan header tabel sudah sesuai.');
        }
      }
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setParseError(err.message || 'Terjadi kesalahan saat memproses file spreadsheet.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Preview filtering
  const activeRows = type === 'member' ? memberRows : staffRows;
  const filteredRows = activeRows.filter((r) => {
    if (filterPreviewTab === 'new' && r.isExisting) return false;
    if (filterPreviewTab === 'update' && !r.isExisting) return false;
    if (filterPreviewTab === 'warnings' && r.warnings.length === 0) return false;

    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      const name = r.data.name.toLowerCase();
      const id = r.data.id.toLowerCase();
      const phone = (r.data.phone || '').toLowerCase();
      return name.includes(q) || id.includes(q) || phone.includes(q);
    }
    return true;
  });

  const totalDetected = activeRows.length;
  const newCount = activeRows.filter((r) => !r.isExisting).length;
  const updateCount = activeRows.filter((r) => r.isExisting).length;
  const warningsCount = activeRows.filter((r) => r.warnings.length > 0).length;

  const countToImport =
    importStrategy === 'skip_existing'
      ? newCount
      : totalDetected;

  const handleExecuteImport = () => {
    if (countToImport === 0) {
      showToast('Peringatan', 'Tidak ada data yang akan diimpor.', 'warning');
      return;
    }

    setIsSubmitting(true);
    let itemsToProcess: (Member | User)[] = [];

    if (type === 'member') {
      let currentMembers = [...existingMembers];
      let maxNum = currentMembers
        .map((m) => parseInt(m.id.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n))
        .reduce((a, b) => Math.max(a, b), 100);

      memberRows.forEach((r) => {
        if (importStrategy === 'skip_existing' && r.isExisting) {
          return;
        }

        let itemData = { ...r.data };
        if (importStrategy === 'generate_new') {
          maxNum++;
          itemData.id = `M${maxNum}`;
        }
        itemsToProcess.push(itemData);
      });
    } else {
      let currentStaff = [...existingStaff];
      let maxNum = currentStaff
        .map((s) => parseInt(s.id.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n))
        .reduce((a, b) => Math.max(a, b), 0);

      staffRows.forEach((r) => {
        if (importStrategy === 'skip_existing' && r.isExisting) {
          return;
        }

        let itemData = { ...r.data };
        if (importStrategy === 'generate_new') {
          maxNum++;
          itemData.id = `S${maxNum < 10 ? '0' + maxNum : maxNum}`;
          itemData.accId = `${itemData.accId}_${maxNum}`;
        }
        itemsToProcess.push(itemData);
      });
    }

    onImportComplete(itemsToProcess, importStrategy);
    setIsSubmitting(false);
    onClose();
    handleReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Import Data {type === 'member' ? 'Member Gym' : 'Karyawan & Staf'}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Excel & CSV
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Unggah spreadsheet file untuk menambahkan atau memperbarui data secara massal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                handleReset();
              }}
              className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* STEP 1: DOWNLOAD TEMPLATE BANNER */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Belum punya template format data?</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Unduh template resmi dengan contoh data agar penulisan kolom sesuai otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (type === 'member') downloadMemberTemplate('xlsx');
                  else downloadStaffTemplate('xlsx');
                  showToast('Template Diunduh', 'File Excel template siap digunakan.', 'success');
                }}
                className="flex-1 sm:flex-initial px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Template Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (type === 'member') downloadMemberTemplate('csv');
                  else downloadStaffTemplate('csv');
                  showToast('Template Diunduh', 'File CSV template siap digunakan.', 'success');
                }}
                className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> CSV (.csv)
              </button>
            </div>
          </div>

          {/* STEP 2: FILE UPLOAD DROPZONE */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragging
                  ? 'border-orange-500 bg-orange-500/5 scale-[1.01]'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/40 hover:bg-zinc-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-orange-400 mb-3 shadow-lg">
                <Upload className="w-8 h-8 animate-pulse" />
              </div>

              <p className="text-sm font-bold text-white mb-1">
                Tarik & letakkan file spreadsheet di sini, atau{' '}
                <span className="text-orange-400 hover:underline">klik untuk memilih</span>
              </p>
              <p className="text-xs text-zinc-400 max-w-sm">
                Mendukung format Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) dan format <strong>.csv</strong>
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-500">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">Maks. 5000 baris</span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">Deteksi Otomatis Kolom</span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">Dukungan NIK & Kontak</span>
              </div>
            </div>
          ) : (
            /* FILE LOADED & PREVIEW STATE */
            <div className="space-y-5">
              
              {/* File Info Bar */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-md">{selectedFile.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {totalDetected} baris terdeteksi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Ganti File
                  </button>
                </div>
              </div>

              {/* Parsing Loader */}
              {isParsing && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-3" />
                  <p className="text-xs font-bold text-white">Sedang memproses data spreadsheet...</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Mencocokkan kolom dan memverifikasi duplikasi</p>
                </div>
              )}

              {/* Error Alert */}
              {parseError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Gagal Memproses File</p>
                    <p className="mt-0.5 text-zinc-300">{parseError}</p>
                  </div>
                </div>
              )}

              {!isParsing && totalDetected > 0 && (
                <>
                  {/* STATS SUMMARY TILES */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl">
                      <p className="text-[11px] font-bold text-zinc-400">Total Baris</p>
                      <p className="text-xl font-black text-white mt-1">{totalDetected}</p>
                    </div>
                    <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-2xl">
                      <p className="text-[11px] font-bold text-emerald-400">Data Baru</p>
                      <p className="text-xl font-black text-emerald-300 mt-1">{newCount}</p>
                    </div>
                    <div className="bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-2xl">
                      <p className="text-[11px] font-bold text-amber-400">Data Sudah Ada</p>
                      <p className="text-xl font-black text-amber-300 mt-1">{updateCount}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl">
                      <p className="text-[11px] font-bold text-zinc-400">Peringatan Input</p>
                      <p className={`text-xl font-black mt-1 ${warningsCount > 0 ? 'text-orange-400' : 'text-zinc-500'}`}>
                        {warningsCount}
                      </p>
                    </div>
                  </div>

                  {/* IMPORT STRATEGY SELECTION */}
                  <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-orange-400" />
                      Kebijakan Penanganan Data Duplikat / Sudah Ada:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setImportStrategy('merge')}
                        className={`p-3 rounded-xl border text-left transition ${
                          importStrategy === 'merge'
                            ? 'bg-orange-500/10 border-orange-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Update & Tambah (Merge)</span>
                          {importStrategy === 'merge' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Perbarui data member/staf yang ID atau No HP-nya sudah ada, dan tambahkan yang baru.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportStrategy('skip_existing')}
                        className={`p-3 rounded-xl border text-left transition ${
                          importStrategy === 'skip_existing'
                            ? 'bg-orange-500/10 border-orange-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Hanya Tambah Baru</span>
                          {importStrategy === 'skip_existing' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Lewati baris yang sudah terdaftar di sistem. Hanya simpan {newCount} data baru.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportStrategy('generate_new')}
                        className={`p-3 rounded-xl border text-left transition ${
                          importStrategy === 'generate_new'
                            ? 'bg-orange-500/10 border-orange-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Generate ID Baru Semua</span>
                          {importStrategy === 'generate_new' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Selalu buatkan ID baru berurutan sehingga data lama di sistem tidak terganggu.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW TABLE CONTAINER */}
                  <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
                    <div className="p-3 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                        <button
                          type="button"
                          onClick={() => setFilterPreviewTab('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                            filterPreviewTab === 'all'
                              ? 'bg-zinc-200 text-black'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Semua ({totalDetected})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterPreviewTab('new')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                            filterPreviewTab === 'new'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-900 text-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          Baru ({newCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterPreviewTab('update')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                            filterPreviewTab === 'update'
                              ? 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-900 text-amber-400 hover:text-amber-300'
                          }`}
                        >
                          Update ({updateCount})
                        </button>
                        {warningsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterPreviewTab('warnings')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                              filterPreviewTab === 'warnings'
                                ? 'bg-rose-500 text-white'
                                : 'bg-zinc-900 text-rose-400 hover:text-rose-300'
                            }`}
                          >
                            Peringatan ({warningsCount})
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={previewSearch}
                          onChange={(e) => setPreviewSearch(e.target.value)}
                          placeholder="Cari nama / ID..."
                          className="bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 outline-none w-full sm:w-44 focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] font-bold sticky top-0">
                          <tr>
                            <th className="px-3 py-2.5">Baris</th>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5">ID</th>
                            <th className="px-3 py-2.5">Nama Lengkap</th>
                            <th className="px-3 py-2.5">WhatsApp / Telepon</th>
                            {type === 'member' ? (
                              <>
                                <th className="px-3 py-2.5">Expired</th>
                                <th className="px-3 py-2.5">PT Quota</th>
                                <th className="px-3 py-2.5">PIC</th>
                              </>
                            ) : (
                              <>
                                <th className="px-3 py-2.5">Role / Jabatan</th>
                                <th className="px-3 py-2.5">Shift</th>
                                <th className="px-3 py-2.5">Gaji Pokok</th>
                              </>
                            )}
                            <th className="px-3 py-2.5">Catatan Validasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-medium">
                          {filteredRows.slice(0, 50).map((r, i) => {
                            const isMember = type === 'member';
                            const mem = r.data as Member;
                            const staff = r.data as User;

                            return (
                              <tr key={i} className="hover:bg-zinc-900/50 transition">
                                <td className="px-3 py-2 text-zinc-500 text-[11px]">{r.rowIndex}</td>
                                <td className="px-3 py-2">
                                  {r.isExisting ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      Sudah Ada (Update)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Baru
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 font-mono text-zinc-300 font-bold">{r.data.id}</td>
                                <td className="px-3 py-2 text-white font-bold">{r.data.name}</td>
                                <td className="px-3 py-2 text-zinc-300">{r.data.phone || '-'}</td>

                                {isMember ? (
                                  <>
                                    <td className="px-3 py-2 text-zinc-300 font-mono text-[11px]">{mem.expired}</td>
                                    <td className="px-3 py-2 text-orange-400 font-bold">{mem.ptQuota || 0} Sesi</td>
                                    <td className="px-3 py-2 text-zinc-300">{mem.picName || mem.picId || '-'}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-3 py-2">
                                      <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 text-[11px]">
                                        {staff.roleName || staff.role}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-zinc-300">{staff.shift}</td>
                                    <td className="px-3 py-2 text-emerald-400 font-mono">{formatRp(staff.baseSalary || 0)}</td>
                                  </>
                                )}

                                <td className="px-3 py-2">
                                  {r.warnings.length > 0 ? (
                                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      {r.warnings.join(', ')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Lengkap
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {filteredRows.length > 50 && (
                      <div className="p-2.5 text-center bg-zinc-900/80 border-t border-zinc-800 text-[11px] text-zinc-400">
                        Menampilkan 50 dari {filteredRows.length} baris pratinjau. Seluruh {countToImport} baris akan diproses saat impor.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10">
          <div className="text-xs text-zinc-400">
            {selectedFile && !isParsing && (
              <span>
                Akan mengimpor <strong className="text-white">{countToImport}</strong> record{' '}
                {type === 'member' ? 'member' : 'karyawan'} ke sistem.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                handleReset();
              }}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition disabled:opacity-50"
            >
              Batal
            </button>

            {selectedFile && !isParsing && totalDetected > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || countToImport === 0}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sedang Menyimpan...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Eksekusi Impor {countToImport} Data Sekarang
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

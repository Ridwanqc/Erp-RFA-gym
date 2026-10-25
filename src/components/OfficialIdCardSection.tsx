import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Upload,
  Trash2,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Calendar,
  MapPin,
  CreditCard,
  PhoneCall,
  Eye,
  X
} from 'lucide-react';
import { performIdCardOcr, ExtractedIdData } from '../utils/idCardOcr';

export interface OfficialIdCardFormData {
  jenisIdentitas: 'KTP' | 'SIM' | 'Paspor' | 'Kartu Pelajar';
  nomorIdentitas: string;
  tanggalLahir: string;
  kontakDarurat: string;
  alamatDomisili: string; // Hanya Kota / Kabupaten
  fotoIdentitas?: string;
}

interface OfficialIdCardSectionProps {
  value: OfficialIdCardFormData;
  onChange: (updated: OfficialIdCardFormData) => void;
  onAutoFillName?: (detectedName: string) => void;
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  disabled?: boolean;
}

export const OfficialIdCardSection: React.FC<OfficialIdCardSectionProps> = ({
  value,
  onChange,
  onAutoFillName,
  showToast,
  disabled = false
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [lastOcrResult, setLastOcrResult] = useState<ExtractedIdData | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file selection & trigger client-side OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = '';

    // Create local preview image (data URL)
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // Update photo state immediately for preview
      onChange({
        ...value,
        fotoIdentitas: dataUrl
      });

      // Start client-side OCR via Tesseract.js
      setIsScanning(true);
      setScanProgress(5);
      setScanStatus('Mempersiapkan pemindai OCR di browser...');

      try {
        const extracted = await performIdCardOcr(
          dataUrl,
          value.jenisIdentitas,
          (percent, statusText) => {
            setScanProgress(percent);
            setScanStatus(statusText);
          }
        );

        setLastOcrResult(extracted);

        // Auto-fill extracted values into form state
        const updatedState: OfficialIdCardFormData = {
          ...value,
          fotoIdentitas: dataUrl,
          jenisIdentitas: extracted.idType || value.jenisIdentitas,
          nomorIdentitas: extracted.idNumber || value.nomorIdentitas,
          tanggalLahir: extracted.birthDate || value.tanggalLahir,
          // Ekstraksi alamat domisili HANYA Kota / Kabupaten saja
          alamatDomisili: extracted.addressCity || value.alamatDomisili
        };

        onChange(updatedState);

        // Optional callback if member name was recognized
        if (extracted.name && onAutoFillName) {
          onAutoFillName(extracted.name);
        }

        // Notify user with feedback
        const detailsFound: string[] = [];
        if (extracted.idNumber) detailsFound.push(`Nomor: ${extracted.idNumber}`);
        if (extracted.addressCity) detailsFound.push(`Kota: ${extracted.addressCity}`);
        if (extracted.birthDate) detailsFound.push(`Tgl Lahir: ${extracted.birthDate}`);

        if (showToast) {
          if (detailsFound.length > 0) {
            showToast(
              'OCR Berhasil Diekstrak',
              `Berhasil membaca ${detailsFound.join(' • ')} dari ${extracted.idType}.`,
              'success'
            );
          } else {
            showToast(
              'OCR Selesai Dipindai',
              'Gambar berhasil dibaca. Pastikan foto kartu identitas tajam dan tidak silau untuk hasil maksimal.',
              'info'
            );
          }
        }
      } catch (err: any) {
        console.error('Error saat menjalankan OCR:', err);
        if (showToast) {
          showToast(
            'Gagal Membaca Dokumen',
            'Terjadi kesalahan saat memproses OCR. Silakan isi form secara manual.',
            'error'
          );
        }
      } finally {
        setIsScanning(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    onChange({
      ...value,
      fotoIdentitas: undefined
    });
    setLastOcrResult(null);
  };

  return (
    <div className="bg-zinc-950/80 border border-orange-500/30 p-4 sm:p-5 rounded-2xl space-y-4 relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              KARTU IDENTITAS RESMI (MEMBER)
            </h4>
            <p className="text-[11px] text-zinc-400">
              Verifikasi dokumen resmi member (KTP / SIM / Paspor)
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Auto OCR Client-Side
        </span>
      </div>

      {/* INPUT FORM GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. JENIS IDENTITAS */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-orange-400" />
            Jenis Identitas
          </label>
          <select
            disabled={disabled || isScanning}
            value={value.jenisIdentitas}
            onChange={(e) =>
              onChange({
                ...value,
                jenisIdentitas: e.target.value as OfficialIdCardFormData['jenisIdentitas']
              })
            }
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition disabled:opacity-50"
          >
            <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
            <option value="SIM">SIM (Surat Izin Mengemudi)</option>
            <option value="Paspor">Paspor Internasional</option>
            <option value="Kartu Pelajar">Kartu Pelajar / Mahasiswa</option>
          </select>
        </div>

        {/* 2. NOMOR IDENTITAS (PASPOR / NIK) */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              Nomor {value.jenisIdentitas === 'Paspor' ? 'Paspor' : 'NIK / Identitas'}
              <span className="text-orange-400 font-bold">*</span>
            </span>
            {value.nomorIdentitas && value.jenisIdentitas === 'KTP' && (
              <span
                className={`text-[10px] font-mono font-bold ${
                  value.nomorIdentitas.length === 16 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {value.nomorIdentitas.length} / 16 Digit
              </span>
            )}
          </label>
          <input
            type="text"
            disabled={disabled || isScanning}
            value={value.nomorIdentitas}
            onChange={(e) => onChange({ ...value, nomorIdentitas: e.target.value })}
            placeholder={
              value.jenisIdentitas === 'KTP'
                ? 'Cth: 3171011504880001 (16 digit NIK otomatis terisi saat scan)...'
                : value.jenisIdentitas === 'Paspor'
                ? 'Cth: A1234567 / B12345678...'
                : 'Cth: 1234-5678-9012 (Nomor Dokumen)...'
            }
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-orange-500 transition disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 3. TANGGAL LAHIR */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-orange-400" />
            Tanggal Lahir (sesuai identitas)
          </label>
          <input
            type="date"
            disabled={disabled || isScanning}
            value={value.tanggalLahir}
            onChange={(e) => onChange({ ...value, tanggalLahir: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition disabled:opacity-50"
          />
        </div>

        {/* 4. KONTAK DARURAT */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-orange-400" />
            Kontak Darurat / Kerabat
          </label>
          <input
            type="text"
            disabled={disabled || isScanning}
            value={value.kontakDarurat}
            onChange={(e) => onChange({ ...value, kontakDarurat: e.target.value })}
            placeholder="Nama & No HP Kerabat (Cth: Budi - 08123456789)..."
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition disabled:opacity-50"
          />
        </div>
      </div>

      {/* 5. ALAMAT DOMISILI SESUAI IDENTITAS (HANYA KOTA / KABUPATEN) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-orange-400" />
            Alamat Domisili Sesuai Identitas (Kota / Kabupaten)
          </label>
          <span className="text-[10px] text-emerald-400 font-semibold">
            Hanya Nama Kota / Kabupaten
          </span>
        </div>
        <input
          type="text"
          disabled={disabled || isScanning}
          value={value.alamatDomisili}
          onChange={(e) => onChange({ ...value, alamatDomisili: e.target.value })}
          placeholder="Cth: KOTA JAKARTA SELATAN / KABUPATEN BOGOR (otomatis diekstrak dari KTP)..."
          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition disabled:opacity-50 font-semibold"
        />
      </div>

      {/* 6. UPLOAD & SCAN TRIGGER SECTION */}
      <div className="pt-2 border-t border-zinc-800/80">
        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
          Upload Foto / Scan Kartu Identitas ({value.jenisIdentitas})
        </label>

        {/* HIDDEN FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          disabled={disabled || isScanning}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* ACTION BUTTONS & STATUS BAR */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={disabled || isScanning}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-zinc-950 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>
              {isScanning
                ? 'Sedang Membaca Dokumen...'
                : value.fotoIdentitas
                ? 'Ganti Berkas / Scan Ulang'
                : 'UPLOAD FOTO / SCAN KARTU IDENTITAS'}
            </span>
          </button>

          {value.fotoIdentitas && !isScanning && (
            <>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-orange-400" /> Lihat Gambar
              </button>

              <button
                type="button"
                onClick={handleClearPhoto}
                className="px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Berkas
              </button>
            </>
          )}
        </div>

        {/* OCR SCANNING PROGRESS BAR & STATUS */}
        {isScanning && (
          <div className="mt-3 p-3.5 bg-zinc-900 border border-orange-500/40 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-orange-400 flex items-center gap-2">
                <ScanLine className="w-4 h-4 animate-pulse" />
                <span>{scanStatus || 'Memindai Teks Identitas...'}</span>
              </span>
              <span className="font-mono font-bold text-white">{scanProgress}%</span>
            </div>

            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400">
              Sistem mengekstraksi NIK, Kota Domisili, dan Tanggal Lahir secara 100% lokal di browser Anda.
            </p>
          </div>
        )}

        {/* OCR EXTRACTION RESULT BADGE */}
        {lastOcrResult && !isScanning && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-white">Hasil Ekstraksi OCR Otomatis:</p>
              <p className="text-[11px] text-zinc-300">
                • Nomor Dokumen:{' '}
                <strong className="text-emerald-400 font-mono">
                  {lastOcrResult.idNumber || '(Belum terdeteksi - silakan ketik manual)'}
                </strong>
                <br />• Kota / Domisili:{' '}
                <strong className="text-emerald-400 font-semibold">
                  {lastOcrResult.addressCity || '(Belum terdeteksi)'}
                </strong>
                {lastOcrResult.birthDate && (
                  <>
                    <br />• Tanggal Lahir:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {lastOcrResult.birthDate}
                    </strong>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* COMPACT IMAGE PREVIEW THUMBNAIL */}
        {value.fotoIdentitas && !isScanning && (
          <div className="mt-3 relative w-full sm:w-72 h-36 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 group shadow-md">
            <img
              src={value.fotoIdentitas}
              alt="Scan Kartu Identitas"
              className="w-full h-full object-cover"
            />
            <div
              onClick={() => setPreviewModalOpen(true)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5 cursor-pointer backdrop-blur-xs"
            >
              <Eye className="w-4 h-4" /> Klik untuk Perbesar
            </div>
          </div>
        )}
      </div>

      {/* MODAL: LARGE IMAGE PREVIEW */}
      {previewModalOpen && value.fotoIdentitas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-3xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-bold text-white">
                  Preview Dokumen {value.jenisIdentitas}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/50 rounded-2xl p-2 border border-zinc-800">
              {value.fotoIdentitas && value.fotoIdentitas.trim() ? (
                <img
                  src={value.fotoIdentitas.trim()}
                  alt="Kartu Identitas"
                  className="max-h-[65vh] w-auto object-contain rounded-xl"
                />
              ) : (
                <div className="py-12 text-center text-xs text-zinc-500 font-medium">
                  Berkas foto identitas tidak tersedia
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <span>Nomor: <strong className="text-white font-mono">{value.nomorIdentitas || '-'}</strong></span>
              <span>Domisili: <strong className="text-white">{value.alamatDomisili || '-'}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

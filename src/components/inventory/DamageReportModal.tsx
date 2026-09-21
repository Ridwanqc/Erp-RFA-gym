import React, { useState } from 'react';
import { X, AlertTriangle, Camera, DollarSign, Calendar, User, CheckCircle, ShieldAlert } from 'lucide-react';
import { DamageReport, GymAsset, DamagePriority, User as UserType } from '../../types';
import { APP_TODAY } from '../../utils/formatters';

interface DamageReportModalProps {
  initialAsset?: GymAsset | null;
  assets: GymAsset[];
  currentUser: UserType | null;
  onSave: (report: DamageReport) => void;
  onClose: () => void;
}

const DAMAGE_TYPES = [
  'Motor Inverter Panas / Eror',
  'Kabel Baja / Sling Terkelupas / Putus',
  'Pulley Wheel Macet / Pecah',
  'Belt Running Slip / Sobek',
  'Baut Penyangga Kaki Longgar',
  'Bantalan Kulit Jok Robek',
  'Layar Monitor / Touchscreen Mati',
  'Pedal Crank Patah / Retak',
  'Sensor Detak Jantung Tidak Terbaca',
  'Lainnya'
];

export const DamageReportModal: React.FC<DamageReportModalProps> = ({
  initialAsset,
  assets,
  currentUser,
  onSave,
  onClose
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState(initialAsset?.id || (assets[0]?.id || ''));
  const currentAsset = assets.find((a) => a.id === selectedAssetId) || initialAsset;

  const [reportDate, setReportDate] = useState(APP_TODAY);
  const [reporter, setReporter] = useState(currentUser?.name || 'Staf Operasional Gym');
  const [reporterRole, setReporterRole] = useState(currentUser?.role ? currentUser.role.toUpperCase() : 'KASIR / STAF');
  const [damageType, setDamageType] = useState(DAMAGE_TYPES[0]);
  const [customDamageType, setCustomDamageType] = useState('');
  const [damageLevel, setDamageLevel] = useState<'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat'>('Rusak Sedang');
  const [priority, setPriority] = useState<DamagePriority>('Tinggi');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(currentAsset?.photo || '');
  const [estimatedCost, setEstimatedCost] = useState(500000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!currentAsset) {
      setErrorMsg('Pilih alat terlebih dahulu!');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Harap deskripsikan kerusakan alat!');
      return;
    }

    const report: DamageReport = {
      id: 'DMG-' + String(new Date().getFullYear()) + '-' + String(Math.floor(100 + Math.random() * 900)),
      reportDate,
      assetId: currentAsset.id,
      assetCode: currentAsset.assetCode,
      assetName: currentAsset.name,
      location: currentAsset.location,
      reporter,
      reporterRole,
      damageType: damageType === 'Lainnya' ? customDamageType || 'Kerusakan Lain' : damageType,
      damageLevel,
      description,
      photo: photo.trim() || undefined,
      estimatedCost: Number(estimatedCost) || 0,
      priority,
      status: 'Dilaporkan'
    };

    onSave(report);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Buat Laporan Kerusakan Alat</h2>
              <p className="text-xs text-zinc-400">
                Segera laporkan kendala operasional agar tim teknisi dapat segera memeriksa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Pilih Alat Gym yang Bermasalah <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                const a = assets.find((x) => x.id === e.target.value);
                if (a?.photo) setPhoto(a.photo);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              required
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.assetCode}] {a.name} — {a.location}
                </option>
              ))}
            </select>
            {currentAsset && (
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Lokasi: <strong className="text-white">{currentAsset.location}</strong> • Status saat ini:{' '}
                <strong className="text-amber-400">{currentAsset.status}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Nama Pelapor
              </label>
              <input
                type="text"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Tanggal Laporan
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Jenis Kerusakan
              </label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {DAMAGE_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
              {damageType === 'Lainnya' && (
                <input
                  type="text"
                  placeholder="Ketik jenis kerusakan spesifik..."
                  value={customDamageType}
                  onChange={(e) => setCustomDamageType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Level Kerusakan
                </label>
                <select
                  value={damageLevel}
                  onChange={(e) => setDamageLevel(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Sedang">Rusak Sedang</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Prioritas
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Normal">Normal</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Darurat">Darurat</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Deskripsi Detail Kerusakan <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kronologi, suara aneh, getaran, indikator lampu, atau keluhan member saat menggunakan alat ini..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Estimasi Biaya Awal (Rp)
              </label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value) || 0)}
                placeholder="500000"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Foto Bukti Kerusakan (URL)
              </label>
              <input
                type="text"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              Kirim Laporan Kerusakan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

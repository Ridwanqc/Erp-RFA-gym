import React, { useState } from 'react';
import { X, ArrowRightLeft, MapPin, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import { GymAsset, AssetMovement } from '../../types';
import { GYM_LOCATIONS } from '../../data/inventoryData';
import { APP_TODAY } from '../../utils/formatters';

interface AssetMovementModalProps {
  asset: GymAsset;
  onSaveMovement: (movement: AssetMovement) => void;
  onClose: () => void;
}

export const AssetMovementModal: React.FC<AssetMovementModalProps> = ({
  asset,
  onSaveMovement,
  onClose
}) => {
  const [newLocation, setNewLocation] = useState(GYM_LOCATIONS[0] === asset.location ? GYM_LOCATIONS[1] : GYM_LOCATIONS[0]);
  const [date, setDate] = useState(APP_TODAY);
  const [pic, setPic] = useState(asset.responsiblePerson || 'Andi Saputra');
  const [reason, setReason] = useState('Optimalisasi tata letak ruang & kenyamanan member');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!newLocation || newLocation === asset.location) {
      setErrorMsg('Pilih lokasi baru yang berbeda dari lokasi saat ini!');
      return;
    }

    const movement: AssetMovement = {
      id: 'MOV-' + String(Math.floor(1000 + Math.random() * 9000)),
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      oldLocation: asset.location,
      newLocation,
      date,
      pic,
      reason,
      notes
    };

    onSaveMovement(movement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Catat Perpindahan Lokasi</h3>
              <p className="text-xs text-zinc-400 font-mono">
                {asset.assetCode} • {asset.name}
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
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 text-xs flex items-center justify-between">
            <div>
              <span className="text-zinc-500 block mb-0.5">Lokasi Saat Ini</span>
              <span className="text-white font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {asset.location}
              </span>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-orange-400 opacity-60" />
            <div>
              <span className="text-zinc-500 block mb-0.5 text-right">Lokasi Baru Tujuan</span>
              <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {newLocation}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Pilih Lokasi Baru <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              list="loc-options"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
            <datalist id="loc-options">
              {GYM_LOCATIONS.filter((l) => l !== asset.location).map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Tanggal Perpindahan
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Penanggung Jawab (PIC)
              </label>
              <input
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Alasan Perpindahan <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Penambahan space latihan beban lantai 1..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Catatan / Kondisi Setelah Dipindah
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kondisi baut kencang, kabel aman, tidak ada baret..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
            />
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Simpan Perpindahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

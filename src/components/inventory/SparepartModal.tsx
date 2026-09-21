import React, { useState } from 'react';
import { X, Package, DollarSign, MapPin, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { Sparepart } from '../../types';
import { formatRp } from '../../utils/formatters';

interface SparepartModalProps {
  sparepartToEdit?: Sparepart | null;
  onSave: (sparepart: Sparepart, isNew: boolean, restockCost?: number) => void;
  onClose: () => void;
}

const SPAREPART_CATEGORIES = [
  'Cardio Belt',
  'Pelumas & Maintenance',
  'Cable & Pulley',
  'Pin & Selector',
  'Bushing & Bearing',
  'Bantalan & Kulit',
  'Elektronik & Inverter',
  'Hardware & Baut',
  'Lainnya'
];

export const SparepartModal: React.FC<SparepartModalProps> = ({
  sparepartToEdit,
  onSave,
  onClose
}) => {
  const isNew = !sparepartToEdit;

  const [formData, setFormData] = useState<Sparepart>({
    id: sparepartToEdit?.id || 'SP-' + String(Math.floor(100 + Math.random() * 900)),
    sparepartCode: sparepartToEdit?.sparepartCode || 'SP-PART-01',
    name: sparepartToEdit?.name || '',
    category: sparepartToEdit?.category || SPAREPART_CATEGORIES[0],
    supplier: sparepartToEdit?.supplier || 'PT Prima Fit Parts',
    stock: sparepartToEdit?.stock ?? 5,
    minimumStock: sparepartToEdit?.minimumStock ?? 3,
    unitPrice: sparepartToEdit?.unitPrice ?? 150000,
    storageLocation: sparepartToEdit?.storageLocation || 'Gudang Alat Lt. 1 - Rak A1',
    status: sparepartToEdit?.status || 'Tersedia'
  });

  const [restockQty, setRestockQty] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.name.trim() || !formData.sparepartCode.trim()) {
      setErrorMsg('Nama dan kode sparepart wajib diisi!');
      return;
    }

    const finalStock = formData.stock + Number(restockQty || 0);
    const updatedStatus =
      finalStock === 0 ? 'Habis' : finalStock <= formData.minimumStock ? 'Low Stock' : 'Tersedia';

    const updatedSparepart: Sparepart = {
      ...formData,
      stock: finalStock,
      status: updatedStatus
    };

    const restockCost = restockQty > 0 ? restockQty * formData.unitPrice : undefined;

    onSave(updatedSparepart, isNew, restockCost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isNew ? 'Tambah Master Sparepart' : `Edit Sparepart: ${formData.name}`}
              </h2>
              <p className="text-xs text-zinc-400">
                Pencatatan suku cadang gym dan pengaturan batas minimum stok
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Kode Sparepart <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.sparepartCode}
                onChange={(e) => setFormData({ ...formData, sparepartCode: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Kategori Suku Cadang
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                {SPAREPART_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Nama Sparepart <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Running Belt Treadmill 2.5mm Commercial"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Supplier Suku Cadang
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Harga Satuan Beli (Rp) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) || 0 })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Stok Saat Ini <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) || 0 })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Batas Minimum Stok (Alert) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) || 0 })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Lokasi Penyimpanan di Gudang
            </label>
            <input
              type="text"
              value={formData.storageLocation}
              onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
              placeholder="Gudang Alat Lt. 1 - Rak B2"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          {!isNew && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                Restock / Tambah Stok Cepat
              </span>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Tambah Unit:</span>
                  <input
                    type="number"
                    min="0"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div className="w-44 text-right">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Biaya Restock:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {formatRp(restockQty * formData.unitPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              {isNew ? 'Simpan Sparepart' : 'Perbarui Sparepart'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

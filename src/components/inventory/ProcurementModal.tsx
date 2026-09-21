import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  DollarSign,
  Calendar,
  Building2,
  MapPin,
  CheckCircle,
  PackageCheck,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { AssetProcurement, AssetCategory, ProcurementStatus, User as UserType } from '../../types';
import { GYM_LOCATIONS } from '../../data/inventoryData';
import { formatRp, APP_TODAY } from '../../utils/formatters';

interface ProcurementModalProps {
  procurementToEdit?: AssetProcurement | null;
  currentUser: UserType | null;
  onSave: (procurement: AssetProcurement, shouldGenerateAssets: boolean) => void;
  onClose: () => void;
}

const PRESET_CATEGORIES: AssetCategory[] = [
  'Cardio',
  'Strength',
  'Free Weight',
  'Machine',
  'Bench',
  'Cable Machine',
  'Functional Training',
  'Equipment',
  'Elektronik',
  'Furniture',
  'Lainnya'
];

export const ProcurementModal: React.FC<ProcurementModalProps> = ({
  procurementToEdit,
  currentUser,
  onSave,
  onClose
}) => {
  const isNew = !procurementToEdit;

  const [date, setDate] = useState(procurementToEdit?.date || APP_TODAY);
  const [assetName, setAssetName] = useState(procurementToEdit?.assetName || '');
  const [category, setCategory] = useState<AssetCategory>(procurementToEdit?.category || 'Cardio');
  const [brand, setBrand] = useState(procurementToEdit?.brand || '');
  const [model, setModel] = useState(procurementToEdit?.model || '');
  const [supplier, setSupplier] = useState(procurementToEdit?.supplier || 'PT Prima Fit Nusantara');
  const [quantity, setQuantity] = useState(procurementToEdit?.quantity || 1);
  const [unitPrice, setUnitPrice] = useState(procurementToEdit?.unitPrice || 25000000);
  const [discount, setDiscount] = useState(procurementToEdit?.discount || 0);
  const [tax, setTax] = useState(procurementToEdit?.tax || 0);
  const [shippingCost, setShippingCost] = useState(procurementToEdit?.shippingCost || 500000);
  const [fundingSource, setFundingSource] = useState<any>(
    procurementToEdit?.fundingSource || 'Rekening Bank Mandiri'
  );
  const [paymentMethod, setPaymentMethod] = useState<any>(procurementToEdit?.paymentMethod || 'Transfer');
  const [targetLocation, setTargetLocation] = useState(procurementToEdit?.targetLocation || GYM_LOCATIONS[0]);
  const [pic, setPic] = useState(procurementToEdit?.pic || currentUser?.name || 'Hendra Setiawan');
  const [status, setStatus] = useState<ProcurementStatus>(procurementToEdit?.status || 'Pengajuan');
  const [notes, setNotes] = useState(procurementToEdit?.notes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate total purchase
  // Rumus: (Harga Satuan * Qty - Diskon) + Pajak + Ongkos Kirim
  const subtotalRaw = Number(unitPrice || 0) * Number(quantity || 1);
  const subtotalAfterDisc = Math.max(0, subtotalRaw - Number(discount || 0));
  const totalPurchase = subtotalAfterDisc + Number(tax || 0) + Number(shippingCost || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!assetName.trim()) {
      setErrorMsg('Nama alat wajib diisi!');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Jumlah unit minimal 1!');
      return;
    }

    // Check if transition to 'Diterima' or 'Selesai' needs to auto-generate assets
    const previouslyCompleted =
      procurementToEdit?.status === 'Diterima' || procurementToEdit?.status === 'Selesai';
    const nowCompleted = status === 'Diterima' || status === 'Selesai';
    const shouldGenerate = nowCompleted && !previouslyCompleted;

    const procurement: AssetProcurement = {
      id: procurementToEdit?.id || 'PRC-' + String(new Date().getFullYear()) + '-' + String(Math.floor(100 + Math.random() * 900)),
      date,
      assetName,
      category,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      supplier,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      shippingCost: Number(shippingCost) || 0,
      totalPurchase,
      fundingSource,
      paymentMethod,
      targetLocation,
      pic,
      status,
      notes,
      generatedAssetIds: procurementToEdit?.generatedAssetIds
    };

    onSave(procurement, shouldGenerate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isNew ? 'Pengadaan / Penambahan Alat Gym Baru' : `Pengadaan: ${procurementToEdit.id}`}
              </h2>
              <p className="text-xs text-zinc-400">
                Alur pengadaan resmi: Pengajuan &rarr; Approval &rarr; Pemesanan &rarr; Diterima (Auto-generate unit asset)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}
          {/* Section 1: Identitas Alat yang Dipesan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Nama Alat yang Diadakan <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Contoh: StairMaster Gauntlet 10G Stepmill Commercial"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Kategori Alat
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Status Alur Pengadaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProcurementStatus)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-purple-500"
              >
                <option value="Draft">Draft</option>
                <option value="Pengajuan">Pengajuan</option>
                <option value="Menunggu Approval">Menunggu Approval</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Dipesan">Dipesan</option>
                <option value="Diterima">Diterima (Auto Create Asset)</option>
                <option value="Selesai">Selesai</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Brand / Merk
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="StairMaster, Technogym..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Model / Tipe
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Gauntlet 10G..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Supplier / Vendor
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="PT Prima Fit Nusantara"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Tanggal Pengajuan
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          {/* Section 2: Kuantitas & Rincian Finansial */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Kuantitas, Harga & Rincian Pembelian
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Jumlah Unit (Qty) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Harga Satuan (Rp) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Potongan Diskon (Rp)
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Pajak / PPN 11% (Rp)
                </label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Biaya Pengiriman & Asuransi (Rp)
                </label>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Sumber Dana Pembelian
                </label>
                <select
                  value={fundingSource}
                  onChange={(e) => setFundingSource(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="Rekening Bank Mandiri">Rekening Bank Mandiri</option>
                  <option value="Rekening Bank Artha Graha">Rekening Bank Artha Graha</option>
                  <option value="Kas Operasional">Kas Operasional Gym</option>
                  <option value="Modal Pemilik / Investor">Modal Pemilik / Investor</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="Transfer">Transfer Bank</option>
                  <option value="Tunai">Tunai</option>
                  <option value="QRIS">QRIS</option>
                  <option value="EDC">EDC</option>
                </select>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 block">Total Nilai Pembelian Pengadaan</span>
                <span className="text-2xl font-black text-emerald-400">{formatRp(totalPurchase)}</span>
                <span className="text-[11px] text-zinc-500 block mt-0.5">
                  Subtotal: {formatRp(subtotalRaw)} - Disc: {formatRp(discount)} + Pajak: {formatRp(tax)} + Ongkir: {formatRp(shippingCost)}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-zinc-400 block font-semibold">Alokasi Qty:</span>
                <span className="text-lg font-bold text-white">{quantity} Unit Baru</span>
              </div>
            </div>
          </div>

          {/* Section 3: Lokasi & PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Target Lokasi Penempatan di Gym
              </label>
              <input
                type="text"
                list="loc-list"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
              <datalist id="loc-list">
                {GYM_LOCATIONS.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Penanggung Jawab (PIC Pengadaan)
              </label>
              <input
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Catatan & Justifikasi Pengadaan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Justifikasi bisnis, target ROI, jadwal kedatangan alat..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          {/* Special Feature Notice */}
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-2.5 text-xs text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Fitur Otomatisasi (Requirement 7):</strong> Ketika status diubah menjadi{' '}
              <strong className="text-white font-bold">&quot;Diterima&quot;</strong> atau{' '}
              <strong className="text-white font-bold">&quot;Selesai&quot;</strong>, sistem otomatis meng-generate{' '}
              <span className="text-purple-300 font-bold">{quantity} data alat baru</span> ke dalam Master Inventaris
              dengan kode unik, serta mencatat pengeluaran ke Keuangan ERP.
            </p>
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              {isNew ? 'Simpan & Ajukan Pengadaan' : 'Perbarui Pengadaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

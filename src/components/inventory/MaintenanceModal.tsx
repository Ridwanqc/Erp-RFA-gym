import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  DollarSign,
  Calendar,
  User,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Upload,
  Camera,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import {
  AssetMaintenance,
  GymAsset,
  Sparepart,
  MaintenanceType,
  UsedSparepartItem,
  ApprovalThresholdConfig,
  User as UserType
} from '../../types';
import { formatRp, APP_TODAY } from '../../utils/formatters';

interface MaintenanceModalProps {
  initialAsset?: GymAsset | null;
  assets: GymAsset[];
  spareparts: Sparepart[];
  approvalConfig: ApprovalThresholdConfig;
  currentUser: UserType | null;
  onSave: (
    maintenance: AssetMaintenance,
    usedSpareparts: UsedSparepartItem[],
    nextMntDate?: string
  ) => void;
  onClose: () => void;
}

const MAINTENANCE_TYPES: MaintenanceType[] = [
  'Preventive Maintenance',
  'Corrective Maintenance',
  'Repair',
  'Inspection',
  'Cleaning',
  'Replacement',
  'Calibration',
  'Service Berkala'
];

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  initialAsset,
  assets,
  spareparts,
  approvalConfig,
  currentUser,
  onSave,
  onClose
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState(initialAsset?.id || (assets[0]?.id || ''));
  const currentAsset = assets.find((a) => a.id === selectedAssetId) || initialAsset;

  const [maintenanceDate, setMaintenanceDate] = useState(APP_TODAY);
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('Preventive Maintenance');
  const [technicianName, setTechnicianName] = useState('Andi Saputra (Lead Tech)');
  const [vendorName, setVendorName] = useState('');
  const [complaint, setComplaint] = useState('Pemeriksaan rutin dan pembersihan berkala');
  const [action, setAction] = useState('Pelumasan belt silikon, pengecekan baut, dan tes kelistrikan');
  const [repairWarranty, setRepairWarranty] = useState('30 Hari');
  const [status, setStatus] = useState<'Scheduled' | 'In Progress' | 'Completed' | 'Pending Approval'>('Completed');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'QRIS' | 'EDC'>('Tunai');
  const [bankDest, setBankDest] = useState<'Mandiri' | 'Artha Graha' | string>('Mandiri');
  const [notes, setNotes] = useState('');

  // Costs
  const [serviceCost, setServiceCost] = useState(250000);
  const [otherCost, setOtherCost] = useState(0);

  // Used Spareparts
  const [usedSpareparts, setUsedSpareparts] = useState<UsedSparepartItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Next Maintenance calculation (default 30 days ahead)
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Calculate sparepart cost
  const sparepartCost = usedSpareparts.reduce((sum, item) => sum + item.total, 0);
  const totalCost = Number(serviceCost || 0) + sparepartCost + Number(otherCost || 0);

  // Check approval needed based on user role and threshold
  const isManagementApprovalRequired = totalCost > approvalConfig.requireManagementAbove;
  const isAdminApprovalRequired = totalCost > approvalConfig.staffMaxAmount;

  const handleAddSparepart = (sparepartId: string) => {
    const sp = spareparts.find((s) => s.id === sparepartId);
    if (!sp) return;

    // Check if already in list
    const existingIndex = usedSpareparts.findIndex((item) => item.sparepartId === sp.id);
    if (existingIndex >= 0) {
      const updated = [...usedSpareparts];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setUsedSpareparts(updated);
    } else {
      setUsedSpareparts([
        ...usedSpareparts,
        {
          sparepartId: sp.id,
          sparepartCode: sp.sparepartCode,
          name: sp.name,
          quantity: 1,
          unitPrice: sp.unitPrice,
          total: sp.unitPrice
        }
      ]);
    }
  };

  const handleUpdateSparepartQty = (index: number, qty: number) => {
    if (qty <= 0) {
      setUsedSpareparts(usedSpareparts.filter((_, i) => i !== index));
      return;
    }
    const updated = [...usedSpareparts];
    updated[index].quantity = qty;
    updated[index].total = qty * updated[index].unitPrice;
    setUsedSpareparts(updated);
  };

  const handleRemoveSparepart = (index: number) => {
    setUsedSpareparts(usedSpareparts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!currentAsset) {
      setErrorMsg('Pilih alat terlebih dahulu!');
      return;
    }

    const maintenance: AssetMaintenance = {
      id: 'MNT-' + String(new Date().getFullYear()) + '-' + String(Math.floor(100 + Math.random() * 900)),
      assetId: currentAsset.id,
      assetCode: currentAsset.assetCode,
      assetName: currentAsset.name,
      maintenanceDate,
      maintenanceType,
      technicianName,
      vendorName: vendorName.trim() || undefined,
      complaint,
      action,
      usedSpareparts,
      serviceCost: Number(serviceCost) || 0,
      sparepartCost,
      otherCost: Number(otherCost) || 0,
      totalCost,
      repairWarranty,
      nextMaintenanceDate,
      status,
      paymentMethod,
      bankDest: paymentMethod === 'Transfer' ? bankDest : undefined,
      notes,
      approvalStatus: isManagementApprovalRequired ? 'Pending' : 'Approved',
      approvedBy: isManagementApprovalRequired ? undefined : currentUser?.name || 'Admin Hendra'
    };

    onSave(maintenance, usedSpareparts, nextMaintenanceDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Catat Pemeliharaan / Perbaikan Alat</h2>
              <p className="text-xs text-zinc-400">
                Pencatatan tindakan teknis, penggunaan sparepart, dan integrasi biaya ke Keuangan ERP
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
          {/* Asset Picker & Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Pilih Alat Gym <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                required
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.assetCode}] {a.name} ({a.category} - {a.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Jenis Pemeliharaan <span className="text-red-400">*</span>
              </label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Tanggal Pemeliharaan
              </label>
              <input
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Teknisi / PIC
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="Nama teknisi internal"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Vendor Luar (Jika ada)
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="PT Prima Fit, CV Fitindo..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Keluhan / Gejala Awal <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={2}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Misal: Belt treadmill slip saat kecepatan tinggi..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Tindakan yang Dilakukan <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={2}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Tindakan korektif, pengencangan baut, pelumasan..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          {/* Penggunaan Sparepart */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                Sparepart yang Digunakan
              </span>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddSparepart(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    + Tambah Sparepart dari Stok...
                  </option>
                  {spareparts.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} (Sisa Stok: {sp.stock} • @ {formatRp(sp.unitPrice)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {usedSpareparts.length === 0 ? (
              <div className="text-center py-3 text-xs text-zinc-500 bg-zinc-950/40 rounded-lg border border-zinc-800/80">
                Tidak ada penggantian sparepart (hanya jasa pemeriksaan/pembersihan).
              </div>
            ) : (
              <div className="space-y-2">
                {usedSpareparts.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800 text-xs"
                  >
                    <div className="flex-1">
                      <span className="font-bold text-white block">{item.name}</span>
                      <span className="text-[11px] text-zinc-400">
                        {item.sparepartCode} • Harga Satuan: {formatRp(item.unitPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400 text-xs">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateSparepartQty(idx, Number(e.target.value))}
                          className="w-14 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono text-center"
                        />
                      </div>
                      <span className="font-extrabold text-emerald-400 w-24 text-right">
                        {formatRp(item.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSparepart(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right text-xs font-bold text-zinc-300 pr-2">
                  Subtotal Sparepart: <span className="text-emerald-400">{formatRp(sparepartCost)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Rincian Biaya & Integrasi Keuangan */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Integrasi Biaya Keuangan ERP
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Biaya Jasa Teknisi (Rp)
                </label>
                <input
                  type="number"
                  value={serviceCost}
                  onChange={(e) => setServiceCost(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Biaya Sparepart (Otomatis)
                </label>
                <input
                  type="text"
                  value={formatRp(sparepartCost)}
                  disabled
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Biaya Lainnya / Transport (Rp)
                </label>
                <input
                  type="number"
                  value={otherCost}
                  onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>

            {/* Total Highlight */}
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-400 block">Total Pengeluaran Pemeliharaan</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{formatRp(totalCost)}</span>
                  {isManagementApprovalRequired && (
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Memerlukan Approval Management (&gt; {formatRp(approvalConfig.requireManagementAbove)})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="Tunai">Kas Operasional (Tunai)</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="QRIS">QRIS Statis/Dinams</option>
                  <option value="EDC">Kartu Debit / EDC</option>
                </select>

                {paymentMethod === 'Transfer' && (
                  <select
                    value={bankDest}
                    onChange={(e) => setBankDest(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="Artha Graha">Bank Artha Graha</option>
                  </select>
                )}
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 italic">
              * Otomatis terintegrasi: Transaksi pengeluaran ini langsung masuk ke Buku Kas/Bank, Buku Besar, Daily Closing, dan Laporan Keuangan ERP tanpa pencatatan ganda.
            </p>
          </div>

          {/* Garansi & Jadwal Berikutnya */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Garansi Hasil Perbaikan
              </label>
              <input
                type="text"
                value={repairWarranty}
                onChange={(e) => setRepairWarranty(e.target.value)}
                placeholder="Misal: 30 Hari Garansi Sparepart"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Jadwal Maintenance Berikutnya
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Status Pemeliharaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Completed">Completed (Selesai)</option>
                <option value="In Progress">In Progress (Sedang Dikerjakan)</option>
                <option value="Scheduled">Scheduled (Dijadwalkan)</option>
                <option value="Pending Approval">Pending Approval</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Catatan Khusus Teknisi
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan inspeksi, rekomendasi penggantian part di masa depan..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Simpan & Catat ke Finance ERP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

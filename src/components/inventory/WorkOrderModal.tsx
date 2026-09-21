import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Wrench,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { WorkOrder, GymAsset, DamageReport, User as UserType } from '../../types';
import { formatRp, APP_TODAY } from '../../utils/formatters';

interface WorkOrderModalProps {
  workOrderToEdit?: WorkOrder | null;
  fromDamageReport?: DamageReport | null;
  assets: GymAsset[];
  currentUser: UserType | null;
  onSave: (wo: WorkOrder) => void;
  onClose: () => void;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  workOrderToEdit,
  fromDamageReport,
  assets,
  currentUser,
  onSave,
  onClose
}) => {
  const isNew = !workOrderToEdit;

  const defaultAsset =
    (fromDamageReport && assets.find((a) => a.id === fromDamageReport.assetId)) ||
    (workOrderToEdit && assets.find((a) => a.id === workOrderToEdit.assetId)) ||
    assets[0];

  const [selectedAssetId, setSelectedAssetId] = useState(defaultAsset?.id || '');
  const currentAsset = assets.find((a) => a.id === selectedAssetId) || defaultAsset;

  const [technician, setTechnician] = useState(workOrderToEdit?.technician || 'Andi Saputra (Lead Tech)');
  const [vendor, setVendor] = useState(workOrderToEdit?.vendor || '');
  const [startDate, setStartDate] = useState(workOrderToEdit?.startDate || APP_TODAY);
  const [targetCompletionDate, setTargetCompletionDate] = useState(
    workOrderToEdit?.targetCompletionDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    })()
  );
  const [completionDate, setCompletionDate] = useState(workOrderToEdit?.completionDate || '');
  const [estimatedCost, setEstimatedCost] = useState(
    workOrderToEdit?.estimatedCost || fromDamageReport?.estimatedCost || 500000
  );
  const [actualCost, setActualCost] = useState(workOrderToEdit?.actualCost || 0);
  const [status, setStatus] = useState<any>(workOrderToEdit?.status || 'In Progress');
  const [sparepartDetails, setSparepartDetails] = useState(
    workOrderToEdit?.sparepartDetails || 'Penggantian part & pelumasan'
  );
  const [serviceDetails, setServiceDetails] = useState(
    workOrderToEdit?.serviceDetails || (fromDamageReport ? `Perbaikan keluhan: ${fromDamageReport.damageType}` : '')
  );
  const [notes, setNotes] = useState(workOrderToEdit?.notes || '');
  const [paymentMethod, setPaymentMethod] = useState<any>(workOrderToEdit?.paymentMethod || 'Transfer');
  const [bankDest, setBankDest] = useState(workOrderToEdit?.bankDest || 'Mandiri');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Difference calculation
  const costDifference = Number(actualCost || 0) - Number(estimatedCost || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!currentAsset) {
      setErrorMsg('Pilih alat terlebih dahulu!');
      return;
    }

    const wo: WorkOrder = {
      id: workOrderToEdit?.id || 'WO-' + String(new Date().getFullYear()) + '-' + String(Math.floor(100 + Math.random() * 900)),
      damageReportId: workOrderToEdit?.damageReportId || fromDamageReport?.id,
      assetId: currentAsset.id,
      assetCode: currentAsset.assetCode,
      assetName: currentAsset.name,
      technician,
      vendor: vendor.trim() || undefined,
      startDate,
      targetCompletionDate,
      completionDate: status === 'Completed' ? completionDate || APP_TODAY : undefined,
      estimatedCost: Number(estimatedCost) || 0,
      actualCost: Number(actualCost) || 0,
      costDifference,
      sparepartDetails,
      serviceDetails,
      notes,
      status,
      paymentMethod,
      bankDest: paymentMethod === 'Transfer' ? bankDest : undefined
    };

    onSave(wo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-blue-500/30 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shadow-lg shadow-blue-500/10">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isNew ? 'Buat Work Order (WO) Perbaikan' : `Kelola Work Order: ${workOrderToEdit.id}`}
              </h2>
              <p className="text-xs text-zinc-400">
                {fromDamageReport
                  ? `Mengacu pada Laporan Kerusakan: ${fromDamageReport.id}`
                  : 'Penugasan teknisi dan kontrol biaya estimasi vs realisasi perbaikan'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Alat yang Dikerjakan <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                disabled={!isNew || !!fromDamageReport}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
                required
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.assetCode}] {a.name} — {a.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Status Work Order <span className="text-red-400">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="Open">Open (Baru Dibuat)</option>
                <option value="Approved">Approved (Disetujui)</option>
                <option value="In Progress">In Progress (Sedang Dikerjakan)</option>
                <option value="Pending">Pending (Menunggu Sparepart)</option>
                <option value="Completed">Completed (Selesai)</option>
                <option value="Cancelled">Cancelled (Dibatalkan)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Teknisi Pelaksana
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Vendor Eksternal (Opsional)
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Misal: PT Prima Fit Service Center"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Target Selesai
              </label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Realisasi Selesai (Jika Selesai)
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Rincian Layanan / Jasa Perbaikan
              </label>
              <textarea
                rows={2}
                value={serviceDetails}
                onChange={(e) => setServiceDetails(e.target.value)}
                placeholder="Penggantian bearing, balancing roll, perbaikan motherboard..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Kebutuhan Sparepart
              </label>
              <textarea
                rows={2}
                value={sparepartDetails}
                onChange={(e) => setSparepartDetails(e.target.value)}
                placeholder="Daftar nama suku cadang yang digunakan..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Section: Perbandingan Estimasi Biaya vs Biaya Aktual (Requirement 5) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              Perbandingan Estimasi Biaya vs Biaya Aktual (Realisasi)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Estimasi Biaya Awal (Rp)
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Biaya Aktual Realisasi (Rp)
                </label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                <span className="text-[11px] text-zinc-400 block mb-0.5">Selisih Biaya (Variance)</span>
                <div className="flex items-center gap-1.5">
                  {costDifference < 0 ? (
                    <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" /> Hemat {formatRp(Math.abs(costDifference))}
                    </span>
                  ) : costDifference > 0 ? (
                    <span className="text-red-400 font-extrabold text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> Over-budget +{formatRp(costDifference)}
                    </span>
                  ) : (
                    <span className="text-zinc-400 font-bold text-sm">Tepat Estimasi (Rp 0)</span>
                  )}
                </div>
              </div>
            </div>

            {status === 'Completed' && (
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-300">
                  Pembayaran Realisasi ({formatRp(actualCost)}):
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="Tunai">Tunai / Kas Operasional</option>
                    <option value="Transfer">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="EDC">EDC</option>
                  </select>
                  {paymentMethod === 'Transfer' && (
                    <select
                      value={bankDest}
                      onChange={(e) => setBankDest(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="Artha Graha">Bank Artha Graha</option>
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Catatan Evaluasi Pekerjaan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kendala, pengujian stabilitas alat, rekomendasi berikutnya..."
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
              {isNew ? 'Simpan & Terbitkan WO' : 'Perbarui Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

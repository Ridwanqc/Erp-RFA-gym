import React, { useState } from 'react';
import {
  X,
  Wrench,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Printer,
  ArrowRightLeft,
  Trash2,
  CheckCircle,
  Activity,
  BarChart3,
  ExternalLink,
  History
} from 'lucide-react';
import {
  GymAsset,
  AssetMaintenance,
  DamageReport,
  AssetMovement,
  User
} from '../../types';
import { formatRp, formatDateIndo, APP_TODAY, getDayDiff } from '../../utils/formatters';

interface AssetDetailModalProps {
  asset: GymAsset | null;
  maintenances: AssetMaintenance[];
  damageReports: DamageReport[];
  movements: AssetMovement[];
  currentUser: User | null;
  onClose: () => void;
  onOpenMaintenance: (asset: GymAsset) => void;
  onOpenDamageReport: (asset: GymAsset) => void;
  onOpenMovement: (asset: GymAsset) => void;
  onOpenDisposal: (asset: GymAsset) => void;
  onEditAsset: (asset: GymAsset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  maintenances,
  damageReports,
  movements,
  currentUser,
  onClose,
  onOpenMaintenance,
  onOpenDamageReport,
  onOpenMovement,
  onOpenDisposal,
  onEditAsset
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ringkasan' | 'maintenance' | 'kerusakan' | 'perpindahan'>('ringkasan');

  if (!asset) return null;

  // Filter records belonging to this asset
  const assetMaintenances = maintenances.filter((m) => m.assetId === asset.id || m.assetCode === asset.assetCode);
  const assetDamageReports = damageReports.filter((d) => d.assetId === asset.id || d.assetCode === asset.assetCode);
  const assetMovements = movements.filter((m) => m.assetId === asset.id || m.assetCode === asset.assetCode);

  // Financial calculations
  const purchasePrice = asset.purchasePrice || 0;
  
  // Total maintenance (service cost + other cost for non-repair / preventive)
  const totalMaintenanceCost = assetMaintenances
    .filter((m) => m.maintenanceType !== 'Repair')
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  // Total repair cost
  const totalRepairCost = assetMaintenances
    .filter((m) => m.maintenanceType === 'Repair')
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  // Total spareparts cost across all maintenances
  const totalSparepartCost = assetMaintenances.reduce((sum, m) => sum + (m.sparepartCost || 0), 0);

  // Total operational maintenance (maintenance + repair)
  const totalOperationalCost = totalMaintenanceCost + totalRepairCost;

  // Total Cost of Ownership (TCO) / Total Investasi Alat
  // Rumus: Total Investasi Alat = Harga Pembelian + Total Maintenance + Total Perbaikan + Total Sparepart
  const totalInvestmentTCO = purchasePrice + totalMaintenanceCost + totalRepairCost + totalSparepartCost;

  // Count metrics
  const maintenanceCount = assetMaintenances.length;
  const damageCount = assetDamageReports.length;

  // Next Maintenance Countdown
  let daysToNextMnt = null;
  let isOverdue = false;
  if (asset.nextMaintenanceDate) {
    const diff = getDayDiff(APP_TODAY, asset.nextMaintenanceDate);
    daysToNextMnt = diff;
    isOverdue = diff < 0;
  }

  // Warranty status
  let isWarrantyActive = false;
  let warrantyDaysRemaining = 0;
  if (asset.warrantyEnd) {
    const diff = getDayDiff(APP_TODAY, asset.warrantyEnd);
    isWarrantyActive = diff >= 0;
    warrantyDaysRemaining = diff;
  }

  // Repair vs Replace analysis
  // Compare cumulative repair costs against purchase price
  const repairPercentage = purchasePrice > 0 ? (totalRepairCost / purchasePrice) * 100 : 0;
  const tcoPercentage = purchasePrice > 0 ? (totalInvestmentTCO / purchasePrice) * 100 : 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">{asset.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs font-semibold border border-zinc-700">
                  {asset.assetCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    asset.status === 'Aktif'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : asset.status === 'Maintenance'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : asset.status === 'Rusak'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-zinc-700/30 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {asset.category} • {asset.brand} ({asset.model}) • SN: {asset.serialNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Cetak Lembar Detail Asset"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Quick Info Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Asset Photo & Core Specs */}
            <div className="md:col-span-1 bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden p-3.5 flex flex-col">
              <div className="w-full h-44 rounded-lg bg-zinc-950 border border-zinc-800/80 overflow-hidden relative mb-3">
                {asset.photo ? (
                  <img
                    src={asset.photo}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                    <Wrench className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-xs">Foto tidak tersedia</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shadow ${
                      asset.condition === 'Baru' || asset.condition === 'Baik'
                        ? 'bg-emerald-600 text-white'
                        : asset.condition === 'Cukup'
                        ? 'bg-amber-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    Kondisi: {asset.condition}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Lokasi:</span>
                  <span className="text-white font-medium text-right flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                    {asset.location}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Tgl Pembelian:</span>
                  <span className="text-white font-medium">{formatDateIndo(asset.purchaseDate)} ({asset.purchaseYear})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Supplier:</span>
                  <span className="text-white font-medium">{asset.supplier}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Garansi:</span>
                  <span className={`font-semibold ${isWarrantyActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {asset.warranty} {isWarrantyActive ? `(Aktif, ${warrantyDaysRemaining} hr)` : '(Kadaluarsa)'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Penanggung Jawab:</span>
                  <span className="text-white font-medium">{asset.responsiblePerson}</span>
                </div>
              </div>
            </div>

            {/* Financial Overview & TCO (Requirement 2 & 11) */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Ringkasan Keuangan & Total Investasi Alat (TCO)
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    TCO: {((totalInvestmentTCO / (purchasePrice || 1)) * 100).toFixed(1)}% Nilai Beli
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Harga Pembelian</span>
                    <span className="text-base font-extrabold text-white">{formatRp(purchasePrice)}</span>
                  </div>

                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Total Maintenance</span>
                    <span className="text-base font-extrabold text-blue-400">{formatRp(totalMaintenanceCost)}</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">{maintenanceCount} kali jadwal</span>
                  </div>

                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Total Biaya Perbaikan</span>
                    <span className="text-base font-extrabold text-amber-400">{formatRp(totalRepairCost)}</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">{damageCount} kali kerusakan</span>
                  </div>

                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Total Sparepart</span>
                    <span className="text-base font-extrabold text-purple-400">{formatRp(totalSparepartCost)}</span>
                  </div>

                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Total Operasional</span>
                    <span className="text-base font-extrabold text-zinc-300">{formatRp(totalOperationalCost)}</span>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/30 rounded-lg p-3">
                    <span className="text-[11px] text-emerald-400 font-bold block mb-0.5">Total Investasi (TCO)</span>
                    <span className="text-lg font-black text-emerald-400">{formatRp(totalInvestmentTCO)}</span>
                  </div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>
                      <strong className="text-white">Maintenance Terakhir:</strong>{' '}
                      {asset.lastMaintenanceDate ? formatDateIndo(asset.lastMaintenanceDate) : 'Belum pernah'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      <strong className="text-white">Maintenance Berikutnya:</strong>{' '}
                      {asset.nextMaintenanceDate ? (
                        <span className={isOverdue ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {formatDateIndo(asset.nextMaintenanceDate)} ({isOverdue ? `OVERDUE ${Math.abs(daysToNextMnt || 0)} hari` : `${daysToNextMnt} hari lagi`})
                        </span>
                      ) : (
                        'Belum dijadwalkan'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirement 12: Analisis Repair vs Replace */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Analisis Indikator: Repair vs Replace
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                      repairPercentage >= 75
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : repairPercentage >= 50
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    Rasio Perbaikan: {repairPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-500 ${
                      repairPercentage >= 75
                        ? 'bg-gradient-to-r from-amber-500 to-red-600'
                        : repairPercentage >= 50
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${Math.min(repairPercentage, 100)}%` }}
                  />
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-xs text-zinc-300">
                  <p className="mb-1">
                    <strong className="text-white">Indikator Keputusan:</strong> Biaya perbaikan kumulatif telah mencapai{' '}
                    <span className="font-extrabold text-amber-400">{repairPercentage.toFixed(1)}%</span> dari harga pembelian asset baru ({formatRp(purchasePrice)}).
                  </p>
                  <p className="text-[11px] text-zinc-400 italic">
                    * Catatan Kebijakan: Sistem tidak mengambil keputusan otomatis mengganti alat, melainkan memberikan indikator kuantitatif agar direksi & manajemen dapat mengevaluasi efisiensi penggantian unit baru.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div className="flex border-b border-zinc-800 gap-2">
            <button
              onClick={() => setActiveSubTab('ringkasan')}
              className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-colors border-b-2 ${
                activeSubTab === 'ringkasan'
                  ? 'border-orange-500 text-orange-400 bg-zinc-900/60'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Catatan & Keterangan
            </button>
            <button
              onClick={() => setActiveSubTab('maintenance')}
              className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                activeSubTab === 'maintenance'
                  ? 'border-orange-500 text-orange-400 bg-zinc-900/60'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Riwayat Pemeliharaan
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-zinc-800 text-zinc-300">
                {assetMaintenances.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('kerusakan')}
              className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                activeSubTab === 'kerusakan'
                  ? 'border-orange-500 text-orange-400 bg-zinc-900/60'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Laporan Kerusakan
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-zinc-800 text-zinc-300">
                {assetDamageReports.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('perpindahan')}
              className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                activeSubTab === 'perpindahan'
                  ? 'border-orange-500 text-orange-400 bg-zinc-900/60'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Histori Perpindahan
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-zinc-800 text-zinc-300">
                {assetMovements.length}
              </span>
            </button>
          </div>

          {/* Sub-tab Contents */}
          {activeSubTab === 'ringkasan' && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase mb-2">Catatan Khusus Operasional</h4>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                  {asset.notes || 'Tidak ada catatan khusus untuk alat ini.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 text-xs">
                  <span className="text-zinc-400 block mb-1 font-semibold">Jadwal Preventive Maintenance</span>
                  <span className="text-white font-bold">{asset.maintenanceSchedule || 'Bulanan'}</span>
                  <p className="text-zinc-500 text-[11px] mt-1">
                    Pemeriksaan berkala baut, sensor elektrik, lubrikasi, dan pembersihan filter.
                  </p>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 text-xs">
                  <span className="text-zinc-400 block mb-1 font-semibold">Status Garansi Pabrik</span>
                  <span className="text-white font-bold">{asset.warranty}</span>
                  <p className="text-zinc-500 text-[11px] mt-1">
                    Periode garansi: {asset.warrantyStart ? formatDateIndo(asset.warrantyStart) : '-'} s/d {asset.warrantyEnd ? formatDateIndo(asset.warrantyEnd) : (asset.warrantyExpiry ? formatDateIndo(asset.warrantyExpiry) : '-')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'maintenance' && (
            <div className="space-y-3">
              {assetMaintenances.length === 0 ? (
                <div className="text-center py-8 bg-zinc-900/30 border border-zinc-800 rounded-xl text-zinc-400 text-xs">
                  Belum ada riwayat pemeliharaan untuk alat ini.
                </div>
              ) : (
                assetMaintenances.map((m) => (
                  <div
                    key={m.id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{m.id}</span>
                        <span className="text-xs text-zinc-400">• {formatDateIndo(m.maintenanceDate)}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {m.maintenanceType}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        <strong className="text-zinc-200">Keluhan:</strong> {m.complaint}
                      </p>
                      <p className="text-xs text-zinc-400">
                        <strong className="text-zinc-300">Tindakan:</strong> {m.action}
                      </p>
                      {m.usedSpareparts && m.usedSpareparts.length > 0 && (
                        <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/80">
                          <strong className="text-zinc-300">Sparepart:</strong>{' '}
                          {m.usedSpareparts.map((sp) => `${sp.name} (${sp.quantity}x @ ${formatRp(sp.unitPrice)})`).join(', ')}
                        </div>
                      )}
                      <div className="text-[11px] text-zinc-500">
                        Teknisi: {m.technicianName} {m.vendorName && `(${m.vendorName})`} • Garansi: {m.repairWarranty || '-'}
                      </div>
                    </div>

                    <div className="md:w-56 shrink-0 bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 text-right flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] text-zinc-400 block">Total Biaya</span>
                        <span className="text-base font-extrabold text-emerald-400">{formatRp(m.totalCost)}</span>
                        <span className="text-[10px] text-zinc-500 block">
                          Jasa: {formatRp(m.serviceCost)} | Part: {formatRp(m.sparepartCost)}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-2 block">
                        Metode: {m.paymentMethod} {m.bankDest && `(${m.bankDest})`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'kerusakan' && (
            <div className="space-y-3">
              {assetDamageReports.length === 0 ? (
                <div className="text-center py-8 bg-zinc-900/30 border border-zinc-800 rounded-xl text-zinc-400 text-xs">
                  Tidak ada laporan kerusakan untuk alat ini. Kondisi berjalan prima!
                </div>
              ) : (
                assetDamageReports.map((d) => (
                  <div
                    key={d.id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{d.id}</span>
                        <span className="text-xs text-zinc-400">• {formatDateIndo(d.reportDate)}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.priority === 'Darurat'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : d.priority === 'Tinggi'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                              : 'bg-zinc-700/30 text-zinc-300'
                          }`}
                        >
                          Prioritas: {d.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {d.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">{d.damageType}</p>
                      <p className="text-xs text-zinc-400">{d.description}</p>
                      <div className="text-[11px] text-zinc-500">
                        Pelapor: {d.reporter} ({d.reporterRole || 'Staf'}) • Lokasi: {d.location}
                      </div>
                    </div>

                    <div className="sm:w-44 shrink-0 bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 text-right flex flex-col justify-center">
                      <span className="text-[11px] text-zinc-400 block">Estimasi Biaya</span>
                      <span className="text-sm font-bold text-amber-400">{formatRp(d.estimatedCost || 0)}</span>
                      {d.workOrderId && (
                        <span className="text-[10px] text-blue-400 mt-1 block">WO: {d.workOrderId}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'perpindahan' && (
            <div className="space-y-3">
              {assetMovements.length === 0 ? (
                <div className="text-center py-8 bg-zinc-900/30 border border-zinc-800 rounded-xl text-zinc-400 text-xs">
                  Alat belum pernah dipindahkan dari lokasi awal ({asset.location}).
                </div>
              ) : (
                assetMovements.map((mov) => (
                  <div
                    key={mov.id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{mov.id}</span>
                        <span className="text-xs text-zinc-400">• {formatDateIndo(mov.date)}</span>
                        <span className="text-xs text-zinc-400">PIC: {mov.pic}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="text-red-400 line-through">{mov.oldLocation}</span>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-emerald-400 font-bold">{mov.newLocation}</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        <strong className="text-zinc-300">Alasan:</strong> {mov.reason}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenMovement(asset)}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              Pindah Lokasi
            </button>

            <button
              onClick={() => onOpenDisposal(asset)}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-red-950/40 text-red-400 font-bold text-xs flex items-center gap-1.5 border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Disposal / Hapus Asset
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDamageReport(asset)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-amber-500/40 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Lapor Kerusakan
            </button>

            <button
              onClick={() => onOpenMaintenance(asset)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
            >
              <Wrench className="w-3.5 h-3.5" />
              Catat Pemeliharaan
            </button>

            <button
              onClick={() => onEditAsset(asset)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
            >
              Edit Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

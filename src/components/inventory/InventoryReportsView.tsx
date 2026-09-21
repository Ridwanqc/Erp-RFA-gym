import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  Wrench,
  AlertTriangle,
  ShoppingCart,
  Layers,
  ChevronRight,
  TrendingUp,
  Search
} from 'lucide-react';
import {
  GymAsset,
  AssetMaintenance,
  DamageReport,
  AssetProcurement,
  Sparepart
} from '../../types';
import { formatRp, formatDateIndo, APP_TODAY } from '../../utils/formatters';

interface InventoryReportsViewProps {
  assets: GymAsset[];
  maintenances: AssetMaintenance[];
  damageReports: DamageReport[];
  procurements: AssetProcurement[];
  spareparts: Sparepart[];
}

type ReportType =
  | 'inventaris'
  | 'maintenance'
  | 'biaya'
  | 'kerusakan'
  | 'pengadaan'
  | 'tco';

export const InventoryReportsView: React.FC<InventoryReportsViewProps> = ({
  assets,
  maintenances,
  damageReports,
  procurements,
  spareparts
}) => {
  const [reportType, setReportType] = useState<ReportType>('inventaris');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Extract unique categories & locations
  const categories = useMemo(() => Array.from(new Set(assets.map((a) => a.category))), [assets]);
  const locations = useMemo(() => Array.from(new Set(assets.map((a) => a.location))), [assets]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `laporan_${reportType}_${APP_TODAY}.csv`;

    if (reportType === 'inventaris') {
      headers = ['ID Inventaris', 'Kode Asset', 'Nama Alat', 'Kategori', 'Brand', 'Model', 'Lokasi', 'Kondisi', 'Status', 'Harga Pembelian', 'Tahun', 'Garansi'];
      rows = filteredAssets.map((a) => [
        a.id,
        a.assetCode,
        `"${a.name}"`,
        a.category,
        a.brand,
        a.model,
        `"${a.location}"`,
        a.condition,
        a.status,
        a.purchasePrice || 0,
        a.purchaseYear || '',
        `"${a.warranty || ''}"`
      ]);
    } else if (reportType === 'maintenance') {
      headers = ['ID Maintenance', 'Tanggal', 'Kode Asset', 'Nama Alat', 'Jenis', 'Teknisi', 'Total Biaya', 'Jasa', 'Sparepart', 'Lainnya', 'Status'];
      rows = filteredMaintenances.map((m) => [
        m.id,
        m.maintenanceDate,
        m.assetCode,
        `"${m.assetName}"`,
        m.maintenanceType,
        `"${m.technicianName}"`,
        m.totalCost || 0,
        m.serviceCost || 0,
        m.sparepartCost || 0,
        m.otherCost || 0,
        m.status
      ]);
    } else if (reportType === 'biaya') {
      headers = ['Kode Asset', 'Nama Alat', 'Kategori', 'Harga Beli', 'Total Mnt', 'Total Repair', 'Total Sparepart', 'Total Biaya Investasi'];
      rows = filteredAssets.map((a) => {
        const aMnt = maintenances.filter((m) => m.assetId === a.id);
        const mntCost = aMnt.filter((m) => m.maintenanceType !== 'Repair').reduce((s, m) => s + (m.totalCost || 0), 0);
        const repCost = aMnt.filter((m) => m.maintenanceType === 'Repair').reduce((s, m) => s + (m.totalCost || 0), 0);
        const spCost = aMnt.reduce((s, m) => s + (m.sparepartCost || 0), 0);
        const tco = (a.purchasePrice || 0) + mntCost + repCost + spCost;
        return [a.assetCode, `"${a.name}"`, a.category, a.purchasePrice || 0, mntCost, repCost, spCost, tco];
      });
    } else if (reportType === 'kerusakan') {
      headers = ['ID Laporan', 'Tanggal', 'Kode Asset', 'Nama Alat', 'Lokasi', 'Pelapor', 'Jenis Kerusakan', 'Level', 'Prioritas', 'Estimasi Biaya', 'Status'];
      rows = filteredDamageReports.map((d) => [
        d.id,
        d.reportDate,
        d.assetCode,
        `"${d.assetName}"`,
        `"${d.location || ''}"`,
        `"${d.reporter || ''}"`,
        `"${d.damageType || ''}"`,
        d.damageLevel || '',
        d.priority,
        d.estimatedCost || 0,
        d.status
      ]);
    } else if (reportType === 'pengadaan') {
      headers = ['ID Pengadaan', 'Tanggal', 'Nama Alat', 'Kategori', 'Supplier', 'Qty', 'Harga Satuan', 'Total Pembelian', 'Sumber Dana', 'Status'];
      rows = filteredProcurements.map((p) => [
        p.id,
        p.date || p.orderDate || '',
        `"${p.assetName || p.title || ''}"`,
        p.category || '',
        `"${p.supplier || p.vendorName || ''}"`,
        p.quantity || 1,
        p.unitPrice || 0,
        p.totalPurchase || p.totalCost || 0,
        p.fundingSource || '',
        p.status
      ]);
    } else if (reportType === 'tco') {
      headers = ['Kode Asset', 'Nama Alat', 'Kategori', 'Tahun', 'Harga Beli', 'Total Mnt', 'Total Repair', 'Total Sparepart', 'TCO', 'Rasio Perbaikan %'];
      rows = filteredAssets.map((a) => {
        const aMnt = maintenances.filter((m) => m.assetId === a.id);
        const mntCost = aMnt.filter((m) => m.maintenanceType !== 'Repair').reduce((s, m) => s + (m.totalCost || 0), 0);
        const repCost = aMnt.filter((m) => m.maintenanceType === 'Repair').reduce((s, m) => s + (m.totalCost || 0), 0);
        const spCost = aMnt.reduce((s, m) => s + (m.sparepartCost || 0), 0);
        const tco = (a.purchasePrice || 0) + mntCost + repCost + spCost;
        const repPct = a.purchasePrice ? ((repCost / a.purchasePrice) * 100).toFixed(1) : '0';
        return [a.assetCode, `"${a.name}"`, a.category, a.purchaseYear || '', a.purchasePrice || 0, mntCost, repCost, spCost, tco, `${repPct}%`];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered datasets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
      if (selectedLocation !== 'ALL' && a.location !== selectedLocation) return false;
      if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.assetCode.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, selectedCategory, selectedLocation, selectedStatus, searchQuery]);

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((m) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.assetName.toLowerCase().includes(q) ||
          m.assetCode.toLowerCase().includes(q) ||
          m.technicianName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [maintenances, searchQuery]);

  const filteredDamageReports = useMemo(() => {
    return damageReports.filter((d) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          d.assetName.toLowerCase().includes(q) ||
          d.assetCode.toLowerCase().includes(q) ||
          (d.damageType || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [damageReports, searchQuery]);

  const filteredProcurements = useMemo(() => {
    return procurements.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (p.assetName || p.title || '').toLowerCase().includes(q) || (p.supplier || p.vendorName || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [procurements, selectedCategory, searchQuery]);

  // Total summary for current report
  const totalAssetValue = filteredAssets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  const totalMntAmount = filteredMaintenances.reduce((sum, m) => sum + (m.totalCost || 0), 0);
  const totalDamageEstimate = filteredDamageReports.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);
  const totalProcurementAmount = filteredProcurements.reduce((sum, p) => sum + (p.totalPurchase || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Report Type Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setReportType('inventaris')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === 'inventaris'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Laporan Inventaris
          </button>

          <button
            onClick={() => setReportType('maintenance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === 'maintenance'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            2. Laporan Maintenance
          </button>

          <button
            onClick={() => setReportType('biaya')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === 'biaya'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            3. Laporan Biaya
          </button>

          <button
            onClick={() => setReportType('kerusakan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === 'kerusakan'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            4. Laporan Kerusakan
          </button>

          <button
            onClick={() => setReportType('pengadaan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === 'pengadaan'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            5. Laporan Pengadaan
          </button>

          <button
            onClick={() => setReportType('tco')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === 'tco'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            6. Laporan TCO
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
        <div>
          <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Cari Spesifik:</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari nama, kode, merk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Filter Kategori:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">Semua Kategori ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Filter Lokasi:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">Semua Lokasi ({locations.length})</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Filter Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Rusak">Rusak</option>
            <option value="Dijual">Dijual</option>
            <option value="Dihapus">Dihapus</option>
          </select>
        </div>
      </div>

      {/* Summary Stat Card for Active Report */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {reportType === 'inventaris' && (
          <>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Total Unit Asset</span>
              <span className="text-2xl font-black text-white">{filteredAssets.length} Unit</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Total Nilai Pembelian</span>
              <span className="text-2xl font-black text-emerald-400">{formatRp(totalAssetValue)}</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Asset Aktif Siap Pakai</span>
              <span className="text-2xl font-black text-blue-400">
                {filteredAssets.filter((a) => a.status === 'Aktif').length} Unit
              </span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Perlu Perhatian (Rusak/Mnt)</span>
              <span className="text-2xl font-black text-amber-400">
                {filteredAssets.filter((a) => a.status === 'Rusak' || a.status === 'Maintenance').length} Unit
              </span>
            </div>
          </>
        )}

        {reportType === 'maintenance' && (
          <>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Jumlah Tindakan Service</span>
              <span className="text-2xl font-black text-white">{filteredMaintenances.length} Tindakan</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Total Biaya Pemeliharaan</span>
              <span className="text-2xl font-black text-emerald-400">{formatRp(totalMntAmount)}</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Biaya Jasa Teknisi</span>
              <span className="text-2xl font-black text-blue-400">
                {formatRp(filteredMaintenances.reduce((s, m) => s + (m.serviceCost || 0), 0))}
              </span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Biaya Penggantian Sparepart</span>
              <span className="text-2xl font-black text-purple-400">
                {formatRp(filteredMaintenances.reduce((s, m) => s + (m.sparepartCost || 0), 0))}
              </span>
            </div>
          </>
        )}

        {reportType === 'tco' && (
          <>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Total Modal Pembelian Awal</span>
              <span className="text-xl font-black text-white">{formatRp(totalAssetValue)}</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <span className="text-xs text-zinc-400 block mb-0.5">Total Biaya Service & Sparepart</span>
              <span className="text-xl font-black text-amber-400">{formatRp(totalMntAmount)}</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:col-span-2 bg-gradient-to-br from-emerald-950/30 to-zinc-900 border-emerald-500/30">
              <span className="text-xs text-emerald-400 font-bold block mb-0.5">
                Total Cost of Ownership (TCO Seluruh Asset)
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {formatRp(totalAssetValue + totalMntAmount)}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Rata-rata rasio pemeliharaan kumulatif: {((totalMntAmount / (totalAssetValue || 1)) * 100).toFixed(1)}% dari nilai pembelian
              </span>
            </div>
          </>
        )}
      </div>

      {/* Report Table View */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            Daftar Data: {reportType.toUpperCase()}
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            Menampilkan data tersaring ({reportType === 'inventaris' || reportType === 'biaya' || reportType === 'tco' ? filteredAssets.length : reportType === 'maintenance' ? filteredMaintenances.length : reportType === 'kerusakan' ? filteredDamageReports.length : filteredProcurements.length} baris)
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'inventaris' && (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3">Kode Asset</th>
                  <th className="p-3">Nama Alat</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Brand & Model</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3 text-center">Kondisi</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Harga Pembelian</th>
                  <th className="p-3">Garansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-orange-400">{a.assetCode}</td>
                    <td className="p-3 font-semibold text-white">{a.name}</td>
                    <td className="p-3">{a.category}</td>
                    <td className="p-3 text-zinc-400">{a.brand} ({a.model})</td>
                    <td className="p-3">{a.location}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-200">
                        {a.condition}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'Aktif'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : a.status === 'Maintenance'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      {formatRp(a.purchasePrice)}
                    </td>
                    <td className="p-3 text-zinc-400">{a.warranty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'maintenance' && (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3">ID Mnt</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Kode & Nama Alat</th>
                  <th className="p-3">Jenis Maintenance</th>
                  <th className="p-3">Teknisi / Vendor</th>
                  <th className="p-3">Tindakan</th>
                  <th className="p-3 text-right">Biaya Jasa</th>
                  <th className="p-3 text-right">Biaya Sparepart</th>
                  <th className="p-3 text-right">Total Biaya</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredMaintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-orange-400">{m.id}</td>
                    <td className="p-3">{formatDateIndo(m.maintenanceDate)}</td>
                    <td className="p-3">
                      <span className="font-bold text-white block">[{m.assetCode}]</span>
                      <span className="text-zinc-400 text-[11px]">{m.assetName}</span>
                    </td>
                    <td className="p-3 font-semibold text-blue-400">{m.maintenanceType}</td>
                    <td className="p-3">{m.technicianName}</td>
                    <td className="p-3 text-zinc-400 max-w-xs truncate">{m.action}</td>
                    <td className="p-3 text-right font-mono">{formatRp(m.serviceCost)}</td>
                    <td className="p-3 text-right font-mono">{formatRp(m.sparepartCost)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatRp(m.totalCost)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'biaya' && (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3">Kode Asset</th>
                  <th className="p-3">Nama Alat</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Harga Beli</th>
                  <th className="p-3 text-right">Biaya Preventive</th>
                  <th className="p-3 text-right">Biaya Perbaikan</th>
                  <th className="p-3 text-right">Biaya Sparepart</th>
                  <th className="p-3 text-right">Total Biaya Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAssets.map((a) => {
                  const aMnt = maintenances.filter((m) => m.assetId === a.id);
                  const mntCost = aMnt.filter((m) => m.maintenanceType !== 'Repair').reduce((s, m) => s + (m.totalCost || 0), 0);
                  const repCost = aMnt.filter((m) => m.maintenanceType === 'Repair').reduce((s, m) => s + (m.totalCost || 0), 0);
                  const spCost = aMnt.reduce((s, m) => s + (m.sparepartCost || 0), 0);
                  const opsTotal = mntCost + repCost;
                  return (
                    <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-orange-400">{a.assetCode}</td>
                      <td className="p-3 font-semibold text-white">{a.name}</td>
                      <td className="p-3">{a.category}</td>
                      <td className="p-3 text-right font-mono text-zinc-300">{formatRp(a.purchasePrice)}</td>
                      <td className="p-3 text-right font-mono text-blue-400">{formatRp(mntCost)}</td>
                      <td className="p-3 text-right font-mono text-amber-400">{formatRp(repCost)}</td>
                      <td className="p-3 text-right font-mono text-purple-400">{formatRp(spCost)}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-emerald-400">
                        {formatRp(opsTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'kerusakan' && (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3">ID Laporan</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Kode & Nama Alat</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Pelapor</th>
                  <th className="p-3">Jenis Kerusakan</th>
                  <th className="p-3 text-center">Level</th>
                  <th className="p-3 text-center">Prioritas</th>
                  <th className="p-3 text-right">Estimasi Biaya</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredDamageReports.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-400">{d.id}</td>
                    <td className="p-3">{formatDateIndo(d.reportDate)}</td>
                    <td className="p-3">
                      <span className="font-bold text-white block">[{d.assetCode}]</span>
                      <span className="text-zinc-400 text-[11px]">{d.assetName}</span>
                    </td>
                    <td className="p-3">{d.location}</td>
                    <td className="p-3">{d.reporter}</td>
                    <td className="p-3 font-semibold text-white">{d.damageType}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-200">
                        {d.damageLevel}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.priority === 'Darurat'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {d.priority}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-400">
                      {formatRp(d.estimatedCost)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'pengadaan' && (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3">ID Pengadaan</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Nama Alat</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Harga Satuan</th>
                  <th className="p-3 text-right">Total Pembelian</th>
                  <th className="p-3">Sumber Dana</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProcurements.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-purple-400">{p.id}</td>
                    <td className="p-3">{formatDateIndo(p.date || p.orderDate || '')}</td>
                    <td className="p-3 font-bold text-white">{p.assetName || p.title || '-'}</td>
                    <td className="p-3">{p.category || '-'}</td>
                    <td className="p-3">{p.supplier || p.vendorName || '-'}</td>
                    <td className="p-3 text-center font-bold text-white">{p.quantity || 1} Unit</td>
                    <td className="p-3 text-right font-mono">{formatRp(p.unitPrice || 0)}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400">
                      {formatRp(p.totalPurchase || p.totalCost || 0)}
                    </td>
                    <td className="p-3 text-zinc-400">{p.fundingSource || '-'}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'tco' && (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3">Kode Asset</th>
                  <th className="p-3">Nama Alat</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Harga Beli</th>
                  <th className="p-3 text-right">Total Maintenance</th>
                  <th className="p-3 text-right">Total Perbaikan</th>
                  <th className="p-3 text-right">Total Sparepart</th>
                  <th className="p-3 text-right">Total Investasi (TCO)</th>
                  <th className="p-3 text-center">Rasio Repair vs Beli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAssets.map((a) => {
                  const aMnt = maintenances.filter((m) => m.assetId === a.id);
                  const mntCost = aMnt.filter((m) => m.maintenanceType !== 'Repair').reduce((s, m) => s + (m.totalCost || 0), 0);
                  const repCost = aMnt.filter((m) => m.maintenanceType === 'Repair').reduce((s, m) => s + (m.totalCost || 0), 0);
                  const spCost = aMnt.reduce((s, m) => s + (m.sparepartCost || 0), 0);
                  const tco = (a.purchasePrice || 0) + mntCost + repCost + spCost;
                  const repRatio = a.purchasePrice ? (repCost / a.purchasePrice) * 100 : 0;
                  return (
                    <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-orange-400">{a.assetCode}</td>
                      <td className="p-3 font-semibold text-white">{a.name}</td>
                      <td className="p-3">{a.category}</td>
                      <td className="p-3 text-right font-mono text-zinc-300">{formatRp(a.purchasePrice)}</td>
                      <td className="p-3 text-right font-mono text-blue-400">{formatRp(mntCost)}</td>
                      <td className="p-3 text-right font-mono text-amber-400">{formatRp(repCost)}</td>
                      <td className="p-3 text-right font-mono text-purple-400">{formatRp(spCost)}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-400">
                        {formatRp(tco)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            repRatio >= 50
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {repRatio.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

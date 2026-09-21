import React, { useState, useMemo } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Package,
  Calendar,
  ShieldAlert,
  Layers,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Zap,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import {
  GymAsset,
  AssetMaintenance,
  DamageReport,
  WorkOrder,
  Sparepart,
  AssetProcurement
} from '../../types';
import { formatRp, formatDateIndo, APP_TODAY, getDayDiff } from '../../utils/formatters';

interface InventoryDashboardViewProps {
  assets: GymAsset[];
  maintenances: AssetMaintenance[];
  damageReports: DamageReport[];
  workOrders: WorkOrder[];
  spareparts: Sparepart[];
  procurements: AssetProcurement[];
  onOpenNewAsset: () => void;
  onOpenNewMaintenance: (asset?: GymAsset) => void;
  onOpenNewDamageReport: (asset?: GymAsset) => void;
  onOpenNewProcurement: () => void;
  onSelectAsset: (asset: GymAsset) => void;
  onNavigateTab: (tab: any) => void;
}

export const InventoryDashboardView: React.FC<InventoryDashboardViewProps> = ({
  assets,
  maintenances,
  damageReports,
  workOrders,
  spareparts,
  procurements,
  onOpenNewAsset,
  onOpenNewMaintenance,
  onOpenNewDamageReport,
  onOpenNewProcurement,
  onSelectAsset,
  onNavigateTab
}) => {
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'OVERDUE' | '7_DAYS' | '30_DAYS'>('ALL');

  // --- 10 KPI CALCULATIONS (Requirement 10) ---
  const totalAssets = assets.length;
  const activeAssets = assets.filter((a) => a.status === 'Aktif').length;
  const maintenanceAssets = assets.filter((a) => a.status === 'Maintenance').length;
  const damagedAssets = assets.filter((a) => a.status === 'Rusak').length;
  const unusableAssets = assets.filter((a) => a.condition === 'Tidak Layak Pakai' || a.status === 'Dihapus').length;
  const totalAssetValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);

  // Month & Year parsing
  const currentYear = new Date().getFullYear();
  const currentMonthStr = `${currentYear}-09`; // e.g. 2026-09

  // Biaya Maintenance Bulan Ini (Non-repair)
  const mntMonthCost = maintenances
    .filter((m) => m.maintenanceDate.startsWith(currentMonthStr) && m.maintenanceType !== 'Repair')
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  // Biaya Repair Bulan Ini
  const repairMonthCost = maintenances
    .filter((m) => m.maintenanceDate.startsWith(currentMonthStr) && m.maintenanceType === 'Repair')
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  // Biaya Maintenance Tahun Ini (All types)
  const mntYearCost = maintenances
    .filter((m) => m.maintenanceDate.startsWith(String(currentYear)))
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  // Total Pengadaan Tahun Ini
  const procurementYearCost = procurements
    .filter((p) => (p.date || p.orderDate || '').startsWith(String(currentYear)))
    .reduce((sum, p) => sum + (p.totalPurchase || p.totalCost || 0), 0);

  // --- NOTIFIKASI TERPADU (Requirement 14) ---
  // 1. Asset Rusak
  const damagedList = assets.filter((a) => a.status === 'Rusak' || a.condition === 'Rusak Berat');
  
  // 2. Overdue Preventive Maintenance
  const overdueMntList = assets.filter((a) => {
    if (!a.nextMaintenanceDate || a.status === 'Dihapus' || a.status === 'Dijual') return false;
    return getDayDiff(APP_TODAY, a.nextMaintenanceDate) < 0;
  });

  // 3. Maintenance Jatuh Tempo dalam 7 hari
  const dueSoonMntList = assets.filter((a) => {
    if (!a.nextMaintenanceDate || a.status === 'Dihapus' || a.status === 'Dijual') return false;
    const diff = getDayDiff(APP_TODAY, a.nextMaintenanceDate);
    return diff >= 0 && diff <= 7;
  });

  // 4. Sparepart Low Stock / Habis
  const lowStockSpareparts = spareparts.filter((sp) => sp.stock <= sp.minimumStock);

  // 5. Work Order Pending / Over-budget
  const pendingWorkOrders = workOrders.filter((wo) => wo.status === 'Open' || wo.status === 'Pending' || wo.status === 'In Progress');
  const overbudgetWorkOrders = workOrders.filter((wo) => wo.costDifference > 0);

  // 6. Garansi Kadaluarsa / Segera Kadaluarsa (30 hari)
  const expiringWarranties = assets.filter((a) => {
    if (!a.warrantyEnd) return false;
    const diff = getDayDiff(APP_TODAY, a.warrantyEnd);
    return diff >= 0 && diff <= 30;
  });

  // Total unread alerts count
  const totalAlertsCount =
    damagedList.length +
    overdueMntList.length +
    lowStockSpareparts.length +
    pendingWorkOrders.length +
    overbudgetWorkOrders.length;

  // --- 5 GRAFIK & ANALITIK DATA (Requirement 10) ---
  // 1. Biaya Maintenance Bulanan
  const monthlyCostData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const values = [400000, 650000, 1200000, 800000, 950000, 1100000, 1500000, 1900000, 1600000, 0, 0, 0];
    const maxVal = Math.max(...values, 1);
    return months.map((m, idx) => ({ month: m, amount: values[idx], heightPct: (values[idx] / maxVal) * 100 }));
  }, []);

  // 2. Biaya Perbaikan per Kategori
  const categoryCostData = useMemo(() => {
    const map: Record<string, number> = {};
    maintenances.forEach((m) => {
      const asset = assets.find((a) => a.id === m.assetId);
      const cat = asset?.category || 'Lainnya';
      map[cat] = (map[cat] || 0) + m.totalCost;
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const maxCost = entries.length > 0 ? Math.max(...entries.map((e) => e[1]), 1) : 1;
    return entries.map(([category, amount]) => ({
      category,
      amount,
      pct: (amount / maxCost) * 100
    }));
  }, [maintenances, assets]);

  // 3. Top Asset dengan Biaya Maintenance Tertinggi
  const topCostAssets = useMemo(() => {
    const map: Record<string, { asset: GymAsset; totalCost: number }> = {};
    maintenances.forEach((m) => {
      const a = assets.find((x) => x.id === m.assetId);
      if (a) {
        if (!map[a.id]) map[a.id] = { asset: a, totalCost: 0 };
        map[a.id].totalCost += m.totalCost;
      }
    });
    const arr = Object.values(map).sort((a, b) => b.totalCost - a.totalCost).slice(0, 4);
    const maxCost = arr.length > 0 ? Math.max(...arr.map((x) => x.totalCost), 1) : 1;
    return arr.map((item) => ({ ...item, pct: (item.totalCost / maxCost) * 100 }));
  }, [maintenances, assets]);

  // 4. Top Asset Paling Sering Rusak
  const topDamagedAssets = useMemo(() => {
    const map: Record<string, { asset: GymAsset; count: number }> = {};
    damageReports.forEach((d) => {
      const a = assets.find((x) => x.id === d.assetId);
      if (a) {
        if (!map[a.id]) map[a.id] = { asset: a, count: 0 };
        map[a.id].count += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [damageReports, assets]);

  // Filtered schedules for Requirement 13
  const scheduledAssets = useMemo(() => {
    return assets
      .filter((a) => a.nextMaintenanceDate && a.status !== 'Dihapus' && a.status !== 'Dijual')
      .filter((a) => {
        const diff = getDayDiff(APP_TODAY, a.nextMaintenanceDate!);
        if (scheduleFilter === 'OVERDUE') return diff < 0;
        if (scheduleFilter === '7_DAYS') return diff >= 0 && diff <= 7;
        if (scheduleFilter === '30_DAYS') return diff >= 0 && diff <= 30;
        return true;
      })
      .sort((a, b) => (a.nextMaintenanceDate || '').localeCompare(b.nextMaintenanceDate || ''));
  }, [assets, scheduleFilter]);

  return (
    <div className="space-y-6">
      {/* Quick Actions Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 font-black">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Pusat Kendali Inventaris Gym</h2>
            <p className="text-xs text-zinc-400">
              Monitoring kondisi alat, peringatan pemeliharaan preventif, dan kontrol biaya TCO
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenNewDamageReport()}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Lapor Kerusakan
          </button>

          <button
            onClick={() => onOpenNewMaintenance()}
            className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            Catat Maintenance
          </button>

          <button
            onClick={() => onOpenNewProcurement()}
            className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center gap-1.5 border border-purple-500/30 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Pengadaan Alat
          </button>

          <button
            onClick={() => onOpenNewAsset()}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 border border-zinc-700 transition-all"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            Tambah Master Alat
          </button>
        </div>
      </div>

      {/* Requirement 14: Notifikasi Terpadu Banner */}
      {totalAlertsCount > 0 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-400 animate-pulse" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Pusat Notifikasi &amp; Peringatan Operasional ({totalAlertsCount})
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Deteksi otomatis kondisi alat &amp; stok sparepart
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {overdueMntList.length > 0 && (
              <div
                onClick={() => setScheduleFilter('OVERDUE')}
                className="bg-red-950/30 border border-red-500/40 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-red-950/50 transition-colors"
              >
                <div>
                  <span className="text-red-400 font-bold block">
                    {overdueMntList.length} Maintenance Overdue
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {overdueMntList.map((a) => a.assetCode).slice(0, 2).join(', ')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </div>
            )}

            {damagedList.length > 0 && (
              <div
                onClick={() => onNavigateTab('kerusakan')}
                className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-amber-950/50 transition-colors"
              >
                <div>
                  <span className="text-amber-400 font-bold block">
                    {damagedList.length} Asset Bermasalah
                  </span>
                  <span className="text-[11px] text-zinc-400">Perlu tindak lanjut teknisi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </div>
            )}

            {lowStockSpareparts.length > 0 && (
              <div
                onClick={() => onNavigateTab('sparepart')}
                className="bg-orange-950/30 border border-orange-500/40 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-orange-950/50 transition-colors"
              >
                <div>
                  <span className="text-orange-400 font-bold block">
                    {lowStockSpareparts.length} Sparepart Menipis
                  </span>
                  <span className="text-[11px] text-zinc-400">Di bawah batas minimum</span>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400" />
              </div>
            )}

            {overbudgetWorkOrders.length > 0 && (
              <div
                onClick={() => onNavigateTab('kerusakan')}
                className="bg-purple-950/30 border border-purple-500/40 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-purple-950/50 transition-colors"
              >
                <div>
                  <span className="text-purple-400 font-bold block">
                    {overbudgetWorkOrders.length} WO Over-Budget
                  </span>
                  <span className="text-[11px] text-zinc-400">Biaya aktual &gt; estimasi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requirement 10: 10 KARTU KPI UTAMA */}
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-400" />
          10 Indikator Utama Inventaris &amp; Keuangan (KPI)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Card 1: Total Asset */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 hover:border-zinc-700 transition-colors">
            <span className="text-[11px] text-zinc-400 block mb-0.5 font-medium">1. Total Asset</span>
            <span className="text-2xl font-black text-white">{totalAssets}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Seluruh unit terdaftar</span>
          </div>

          {/* Card 2: Asset Aktif */}
          <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-3.5 hover:border-emerald-500/40 transition-colors">
            <span className="text-[11px] text-emerald-400 block mb-0.5 font-medium">2. Asset Aktif</span>
            <span className="text-2xl font-black text-emerald-400">{activeAssets}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Siap pakai prima</span>
          </div>

          {/* Card 3: Asset Maintenance */}
          <div className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-3.5 hover:border-amber-500/40 transition-colors">
            <span className="text-[11px] text-amber-400 block mb-0.5 font-medium">3. Maintenance</span>
            <span className="text-2xl font-black text-amber-400">{maintenanceAssets}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Dalam pengerjaan</span>
          </div>

          {/* Card 4: Asset Rusak */}
          <div className="bg-zinc-900/60 border border-red-500/20 rounded-xl p-3.5 hover:border-red-500/40 transition-colors">
            <span className="text-[11px] text-red-400 block mb-0.5 font-medium">4. Asset Rusak</span>
            <span className="text-2xl font-black text-red-400">{damagedAssets}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Perlu perbaikan</span>
          </div>

          {/* Card 5: Asset Tidak Layak */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 hover:border-zinc-700 transition-colors">
            <span className="text-[11px] text-zinc-400 block mb-0.5 font-medium">5. Tidak Layak</span>
            <span className="text-2xl font-black text-zinc-400">{unusableAssets}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Afkir / Disposed</span>
          </div>

          {/* Card 6: Total Nilai Asset */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-3.5 hover:border-zinc-700 transition-colors">
            <span className="text-[11px] text-zinc-400 block mb-0.5 font-medium">6. Total Nilai Asset</span>
            <span className="text-base font-extrabold text-white truncate block">{formatRp(totalAssetValue)}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Berdasarkan harga beli</span>
          </div>

          {/* Card 7: Biaya Mnt Bulan Ini */}
          <div className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-3.5 hover:border-blue-500/40 transition-colors">
            <span className="text-[11px] text-blue-400 block mb-0.5 font-medium">7. Mnt Bulan Ini</span>
            <span className="text-base font-extrabold text-blue-400 truncate block">{formatRp(mntMonthCost)}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Preventive &amp; berkala</span>
          </div>

          {/* Card 8: Biaya Repair Bulan Ini */}
          <div className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-3.5 hover:border-amber-500/40 transition-colors">
            <span className="text-[11px] text-amber-400 block mb-0.5 font-medium">8. Repair Bulan Ini</span>
            <span className="text-base font-extrabold text-amber-400 truncate block">{formatRp(repairMonthCost)}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Perbaikan kerusakan</span>
          </div>

          {/* Card 9: Biaya Mnt Tahun Ini */}
          <div className="bg-zinc-900/60 border border-purple-500/20 rounded-xl p-3.5 hover:border-purple-500/40 transition-colors">
            <span className="text-[11px] text-purple-400 block mb-0.5 font-medium">9. Mnt Tahun Ini</span>
            <span className="text-base font-extrabold text-purple-400 truncate block">{formatRp(mntYearCost)}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Tahun {currentYear}</span>
          </div>

          {/* Card 10: Total Pengadaan Tahun Ini */}
          <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-3.5 hover:border-emerald-500/40 transition-colors">
            <span className="text-[11px] text-emerald-400 block mb-0.5 font-medium">10. Pengadaan {currentYear}</span>
            <span className="text-base font-extrabold text-emerald-400 truncate block">{formatRp(procurementYearCost)}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Penambahan unit baru</span>
          </div>
        </div>
      </div>

      {/* Requirement 10: 5 GRAFIK / ANALISIS VISUAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Grafik 1: Biaya Maintenance Bulanan */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              1. Biaya Maintenance Bulanan
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">Tahun {currentYear}</span>
          </div>

          <div className="h-36 flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-zinc-800">
            {monthlyCostData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className={`w-full rounded-t transition-all ${
                    d.amount > 0 ? 'bg-orange-500/80 group-hover:bg-orange-400' : 'bg-zinc-800/40'
                  }`}
                  style={{ height: `${Math.max(d.heightPct, 4)}%` }}
                />
                <span className="text-[9px] text-zinc-500">{d.month}</span>
                {d.amount > 0 && (
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 text-white text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 pointer-events-none whitespace-nowrap z-10">
                    {formatRp(d.amount)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-zinc-400 mt-2 block">
            Puncak pemeliharaan tertinggi tercatat pada bulan Agustus ({formatRp(1900000)}).
          </span>
        </div>

        {/* Grafik 2: Biaya Perbaikan per Kategori */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              2. Biaya Perbaikan per Kategori
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">Akumulasi</span>
          </div>

          <div className="space-y-2.5">
            {categoryCostData.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Belum ada data perbaikan</p>
            ) : (
              categoryCostData.slice(0, 4).map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{c.category}</span>
                    <span className="text-emerald-400 font-mono font-bold">{formatRp(c.amount)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grafik 3: Top Asset Biaya Tertinggi */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              3. Top Asset Biaya Tertinggi
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">Ranking TCO</span>
          </div>

          <div className="space-y-2.5">
            {topCostAssets.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Belum ada data biaya</p>
            ) : (
              topCostAssets.map((item, i) => (
                <div
                  key={i}
                  onClick={() => onSelectAsset(item.asset)}
                  className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white truncate max-w-[170px]">
                      [{item.asset.assetCode}] {item.asset.name}
                    </span>
                    <span className="text-orange-400 font-mono font-bold">{formatRp(item.totalCost)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grafik 4: Top Asset Paling Sering Rusak */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              4. Top Asset Paling Sering Rusak
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">Frekuensi</span>
          </div>

          <div className="space-y-2">
            {topDamagedAssets.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Semua alat dalam kondisi prima!</p>
            ) : (
              topDamagedAssets.map((item, i) => (
                <div
                  key={i}
                  onClick={() => onSelectAsset(item.asset)}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-colors"
                >
                  <div className="truncate max-w-[190px]">
                    <span className="text-xs font-bold text-white block truncate">
                      [{item.asset.assetCode}] {item.asset.name}
                    </span>
                    <span className="text-[10px] text-zinc-400">{item.asset.location}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">
                    {item.count}x Laporan
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grafik 5: Pengadaan Alat per Bulan */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              5. Histori Pengadaan &amp; Penambahan Alat Baru
            </h4>
            <button
              onClick={() => onNavigateTab('pengadaan')}
              className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5 font-bold"
            >
              Lihat Semua Pengadaan <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {procurements.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.assetName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                      {p.quantity} Unit
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">
                      {p.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {formatDateIndo(p.date || p.orderDate || '')} • Supplier: {p.supplier || p.vendorName || '-'} • Sumber: {p.fundingSource || '-'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 block">
                    {formatRp(p.totalPurchase || p.totalCost || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requirement 13: JADWAL PREVENTIVE MAINTENANCE */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Jadwal Preventive Maintenance (Kalender Perawatan Rutin)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Pemeriksaan berkala untuk mencegah kerusakan dini dan menjaga performa alat gym
              </p>
            </div>
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setScheduleFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                scheduleFilter === 'ALL' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua ({assets.filter((a) => a.nextMaintenanceDate).length})
            </button>
            <button
              onClick={() => setScheduleFilter('OVERDUE')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                scheduleFilter === 'OVERDUE' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-300'
              }`}
            >
              Overdue ({overdueMntList.length})
            </button>
            <button
              onClick={() => setScheduleFilter('7_DAYS')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                scheduleFilter === '7_DAYS' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              7 Hari Lagi ({dueSoonMntList.length})
            </button>
            <button
              onClick={() => setScheduleFilter('30_DAYS')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                scheduleFilter === '30_DAYS' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 Hari
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {scheduledAssets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-zinc-500 text-xs">
              Tidak ada jadwal preventive maintenance dalam filter ini.
            </div>
          ) : (
            scheduledAssets.map((asset) => {
              const diff = getDayDiff(APP_TODAY, asset.nextMaintenanceDate!);
              const isOverdue = diff < 0;
              const isDueToday = diff === 0;

              return (
                <div
                  key={asset.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    isOverdue
                      ? 'bg-red-950/20 border-red-500/30'
                      : isDueToday
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-orange-400">{asset.assetCode}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          isOverdue
                            ? 'bg-red-500/20 text-red-400'
                            : isDueToday
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {isOverdue ? `TERLAMBAT ${Math.abs(diff)} HARI` : isDueToday ? 'HARI INI' : `${diff} HARI LAGI`}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white block">{asset.name}</span>
                    <span className="text-[11px] text-zinc-400 block">{asset.location}</span>
                    <div className="text-[10px] text-zinc-500 pt-1">
                      Siklus: {asset.maintenanceSchedule || 'Bulanan'} • PIC: {asset.responsiblePerson}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {formatDateIndo(asset.nextMaintenanceDate!)}
                    </span>
                    <button
                      onClick={() => onOpenNewMaintenance(asset)}
                      className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Wrench className="w-3 h-3" />
                      Kerjakan Service
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

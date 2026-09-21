import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Layers,
  FileText,
  AlertTriangle,
  Package,
  ShoppingCart,
  ArrowLeftRight,
  Trash2,
  History,
  Plus,
  Search,
  Filter,
  Download,
  QrCode,
  Eye,
  Edit2,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  Settings2,
  Grid,
  List,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  GymAsset,
  AssetMaintenance,
  DamageReport,
  WorkOrder,
  Sparepart,
  AssetProcurement,
  AssetMovement,
  AssetDisposal,
  InventoryAuditLog,
  ApprovalThresholdConfig,
  User as UserType,
  AssetCategory,
  AssetCondition,
  AssetStatus
} from '../types';
import { formatRp, formatDateIndo, APP_TODAY } from '../utils/formatters';
import { GYM_LOCATIONS } from '../data/inventoryData';

// Modals
import { AssetDetailModal } from './inventory/AssetDetailModal';
import { AssetFormModal } from './inventory/AssetFormModal';
import { AssetMovementModal } from './inventory/AssetMovementModal';
import { AssetDisposalModal } from './inventory/AssetDisposalModal';
import { MaintenanceModal } from './inventory/MaintenanceModal';
import { DamageReportModal } from './inventory/DamageReportModal';
import { WorkOrderModal } from './inventory/WorkOrderModal';
import { ProcurementModal } from './inventory/ProcurementModal';
import { SparepartModal } from './inventory/SparepartModal';
import { ApprovalConfigModal } from './inventory/ApprovalConfigModal';
import { InventoryDashboardView } from './inventory/InventoryDashboardView';
import { InventoryReportsView } from './inventory/InventoryReportsView';

interface InventoryViewProps {
  assets: GymAsset[];
  maintenances: AssetMaintenance[];
  damageReports: DamageReport[];
  workOrders: WorkOrder[];
  spareparts: Sparepart[];
  procurements: AssetProcurement[];
  movements: AssetMovement[];
  disposals: AssetDisposal[];
  auditLogs: InventoryAuditLog[];
  approvalConfig: ApprovalThresholdConfig;
  currentUser: UserType | null;

  // Handlers for state updates
  onSaveAsset: (asset: GymAsset, isNew: boolean) => void;
  onSaveMaintenance: (maintenance: AssetMaintenance, isNew: boolean) => void;
  onSaveDamageReport: (report: DamageReport) => void;
  onSaveWorkOrder: (wo: WorkOrder) => void;
  onSaveProcurement: (procurement: AssetProcurement, shouldGenerateAssets: boolean) => void;
  onSaveSparepart: (sparepart: Sparepart, isNew: boolean, restockCost?: number) => void;
  onSaveMovement: (movement: AssetMovement) => void;
  onSaveDisposal: (disposal: AssetDisposal) => void;
  onSaveApprovalConfig: (config: ApprovalThresholdConfig) => void;
}

export type InventoryTab =
  | 'dashboard'
  | 'daftar_alat'
  | 'maintenance'
  | 'kerusakan'
  | 'sparepart'
  | 'pengadaan'
  | 'mutasi'
  | 'disposal'
  | 'audit'
  | 'laporan';

export const InventoryView: React.FC<InventoryViewProps> = ({
  assets,
  maintenances,
  damageReports,
  workOrders,
  spareparts,
  procurements,
  movements,
  disposals,
  auditLogs,
  approvalConfig,
  currentUser,
  onSaveAsset,
  onSaveMaintenance,
  onSaveDamageReport,
  onSaveWorkOrder,
  onSaveProcurement,
  onSaveSparepart,
  onSaveMovement,
  onSaveDisposal,
  onSaveApprovalConfig
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('dashboard');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('table');

  // Master Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal Visibility States
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<GymAsset | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<GymAsset | null>(null);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);

  const [assetForMovement, setAssetForMovement] = useState<GymAsset | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const [assetForDisposal, setAssetForDisposal] = useState<GymAsset | null>(null);
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);

  const [maintenanceAsset, setMaintenanceAsset] = useState<GymAsset | null>(null);
  const [maintenanceToEdit, setMaintenanceToEdit] = useState<AssetMaintenance | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const [damageReportAsset, setDamageReportAsset] = useState<GymAsset | null>(null);
  const [isDamageReportModalOpen, setIsDamageReportModalOpen] = useState(false);

  const [workOrderToEdit, setWorkOrderToEdit] = useState<WorkOrder | null>(null);
  const [woFromDamageReport, setWoFromDamageReport] = useState<DamageReport | null>(null);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);

  const [procurementToEdit, setProcurementToEdit] = useState<AssetProcurement | null>(null);
  const [isProcurementModalOpen, setIsProcurementModalOpen] = useState(false);

  const [sparepartToEdit, setSparepartToEdit] = useState<Sparepart | null>(null);
  const [isSparepartModalOpen, setIsSparepartModalOpen] = useState(false);

  const [isApprovalConfigOpen, setIsApprovalConfigOpen] = useState(false);

  // Sub-tabs in Kerusakan & WO
  const [kerusakanSubTab, setKerusakanSubTab] = useState<'laporan' | 'work_order'>('laporan');

  // Master Categories
  const categories: AssetCategory[] = [
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

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
      if (locationFilter !== 'ALL' && a.location !== locationFilter) return false;
      if (conditionFilter !== 'ALL' && a.condition !== conditionFilter) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.assetCode.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, categoryFilter, locationFilter, conditionFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">
              INVENTARIS &amp; PEMELIHARAAN ALAT GYM
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-600/20 text-orange-400 border border-orange-500/30">
              ULTIMATE EDITION
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manajemen siklus hidup aset gym, riwayat servis, kalkulasi TCO, dan pengadaan terintegrasi Keuangan ERP
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setIsApprovalConfigOpen(true)}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 border border-zinc-700 transition-colors"
              title="Konfigurasi Aturan Approval Biaya Maintenance"
            >
              <Settings2 className="w-3.5 h-3.5 text-orange-400" />
              Aturan Approval
            </button>
          )}

          <button
            onClick={() => {
              setAssetToEdit(null);
              setIsAssetFormOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Alat Gym Baru
          </button>
        </div>
      </div>

      {/* Tab Navigation Menu (10 Sub-Menu Terpadu) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-thin">
        {[
          { id: 'dashboard', label: 'Ringkasan / Dashboard', icon: TrendingUp },
          { id: 'daftar_alat', label: `Daftar Alat Gym (${assets.length})`, icon: Layers },
          { id: 'maintenance', label: `Pemeliharaan & Servis (${maintenances.length})`, icon: Wrench },
          { id: 'kerusakan', label: `Kerusakan & WO (${damageReports.length})`, icon: AlertTriangle },
          { id: 'sparepart', label: `Stok Sparepart (${spareparts.length})`, icon: Package },
          { id: 'pengadaan', label: `Pengadaan Alat (${procurements.length})`, icon: ShoppingCart },
          { id: 'mutasi', label: `Mutasi Lokasi (${movements.length})`, icon: ArrowLeftRight },
          { id: 'disposal', label: `Penghapusan / Disposal (${disposals.length})`, icon: Trash2 },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: History },
          { id: 'laporan', label: 'Laporan & TCO', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InventoryTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD RINGKASAN */}
      {activeTab === 'dashboard' && (
        <InventoryDashboardView
          assets={assets}
          maintenances={maintenances}
          damageReports={damageReports}
          workOrders={workOrders}
          spareparts={spareparts}
          procurements={procurements}
          onOpenNewAsset={() => {
            setAssetToEdit(null);
            setIsAssetFormOpen(true);
          }}
          onOpenNewMaintenance={(a) => {
            setMaintenanceAsset(a || null);
            setMaintenanceToEdit(null);
            setIsMaintenanceModalOpen(true);
          }}
          onOpenNewDamageReport={(a) => {
            setDamageReportAsset(a || null);
            setIsDamageReportModalOpen(true);
          }}
          onOpenNewProcurement={() => {
            setProcurementToEdit(null);
            setIsProcurementModalOpen(true);
          }}
          onSelectAsset={(a) => setSelectedAssetForDetail(a)}
          onNavigateTab={(t) => setActiveTab(t)}
        />
      )}

      {/* TAB 2: DAFTAR ALAT GYM (MASTER INVENTARIS) */}
      {activeTab === 'daftar_alat' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="md:col-span-2 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari kode, nama alat, merk, serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Semua Lokasi</option>
                {GYM_LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Semua Kondisi</option>
                <option value="Baru">Baru</option>
                <option value="Baik">Baik</option>
                <option value="Cukup">Cukup</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Sedang">Rusak Sedang</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Tidak Layak Pakai">Tidak Layak Pakai</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Rusak">Rusak</option>
                <option value="Dijual">Dijual</option>
                <option value="Dihapus">Dihapus</option>
              </select>

              <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0">
                <button
                  onClick={() => setViewLayout('table')}
                  className={`p-1 rounded ${viewLayout === 'table' ? 'bg-orange-600 text-white' : 'text-zinc-400'}`}
                  title="Tampilan Tabel"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1 rounded ${viewLayout === 'grid' ? 'bg-orange-600 text-white' : 'text-zinc-400'}`}
                  title="Tampilan Grid Card"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Asset List Content */}
          {filteredAssets.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
              <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">Tidak ada alat gym yang cocok</h3>
              <p className="text-xs text-zinc-500 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
            </div>
          ) : viewLayout === 'table' ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Kode Asset</th>
                      <th className="p-3">Nama Alat &amp; Kategori</th>
                      <th className="p-3">Brand &amp; Model</th>
                      <th className="p-3">Lokasi</th>
                      <th className="p-3 text-center">Kondisi</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Harga Beli</th>
                      <th className="p-3">Next Service</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-orange-400">
                          {asset.assetCode}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {asset.photo ? (
                              <img
                                src={asset.photo}
                                alt={asset.name}
                                className="w-8 h-8 rounded-lg object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                                <Layers className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-white block">{asset.name}</span>
                              <span className="text-[11px] text-zinc-400">{asset.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-300">
                          <span className="block font-medium">{asset.brand}</span>
                          <span className="text-[11px] text-zinc-500">{asset.model}</span>
                        </td>
                        <td className="p-3 text-zinc-300">{asset.location}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-200">
                            {asset.condition}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              asset.status === 'Aktif'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : asset.status === 'Maintenance'
                                ? 'bg-amber-500/20 text-amber-400'
                                : asset.status === 'Rusak'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {formatRp(asset.purchasePrice)}
                        </td>
                        <td className="p-3 text-zinc-400 font-mono">
                          {asset.nextMaintenanceDate ? formatDateIndo(asset.nextMaintenanceDate) : '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedAssetForDetail(asset)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-400 transition-colors"
                              title="Detail Lengkap, QR & TCO"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAssetToEdit(asset);
                                setIsAssetFormOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition-colors"
                              title="Edit Data Master Alat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAssetForMovement(asset);
                                setIsMovementModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-400 transition-colors"
                              title="Mutasi / Pindah Lokasi"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setMaintenanceAsset(asset);
                                setMaintenanceToEdit(null);
                                setIsMaintenanceModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white transition-colors"
                              title="Catat Maintenance / Servis"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAssetForDisposal(asset);
                                setIsDisposalModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                              title="Penghapusan / Disposal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Grid Cards View
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-40 bg-zinc-950 flex items-center justify-center overflow-hidden">
                    {asset.photo ? (
                      <img
                        src={asset.photo}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-12 h-12 text-zinc-700" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-orange-400 backdrop-blur-sm border border-zinc-700">
                      {asset.assetCode}
                    </span>
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm ${
                        asset.status === 'Aktif'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : asset.status === 'Maintenance'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                          : 'bg-red-950/80 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1">
                    <div>
                      <span className="text-[11px] font-semibold text-orange-400 block uppercase tracking-wider">
                        {asset.category}
                      </span>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{asset.name}</h4>
                      <span className="text-xs text-zinc-400">
                        {asset.brand} • {asset.model}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Lokasi:</span>
                        <span className="text-zinc-300 font-medium truncate max-w-[140px]">{asset.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Kondisi:</span>
                        <span className="text-zinc-300 font-medium">{asset.condition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Harga Beli:</span>
                        <span className="text-emerald-400 font-mono font-bold">{formatRp(asset.purchasePrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedAssetForDetail(asset)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3 text-blue-400" /> Detail
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setAssetToEdit(asset);
                          setIsAssetFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setMaintenanceAsset(asset);
                          setMaintenanceToEdit(null);
                          setIsMaintenanceModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white"
                        title="Service"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PEMELIHARAAN & SERVIS (MAINTENANCE) */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Riwayat &amp; Pelaksanaan Pemeliharaan Alat
              </h3>
              <p className="text-xs text-zinc-400">
                Pencatatan service berkala, repair darurat, sparepart terpakai, dan integrasi pengeluaran ke Finance ERP
              </p>
            </div>

            <button
              onClick={() => {
                setMaintenanceAsset(null);
                setMaintenanceToEdit(null);
                setIsMaintenanceModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Catat Maintenance / Servis Baru
            </button>
          </div>

          {/* Maintenance Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="p-3">ID Log</th>
                    <th className="p-3">Tanggal Servis</th>
                    <th className="p-3">Kode &amp; Nama Alat</th>
                    <th className="p-3">Jenis Servis</th>
                    <th className="p-3">Teknisi / Vendor</th>
                    <th className="p-3">Tindakan Dilakukan</th>
                    <th className="p-3 text-right">Biaya Total</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {maintenances.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-orange-400">{m.id}</td>
                      <td className="p-3 font-mono">{formatDateIndo(m.maintenanceDate)}</td>
                      <td className="p-3">
                        <span className="font-bold text-white block">[{m.assetCode}]</span>
                        <span className="text-zinc-400 text-[11px]">{m.assetName}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.maintenanceType.includes('Preventive')
                              ? 'bg-blue-500/20 text-blue-400'
                              : m.maintenanceType.includes('Corrective')
                              ? 'bg-amber-500/20 text-amber-400'
                              : m.maintenanceType.includes('Repair')
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {m.maintenanceType}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-300">{m.technicianName}</td>
                      <td className="p-3 text-zinc-400 max-w-xs truncate">{m.action}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-400">
                        {formatRp(m.totalCost)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setMaintenanceToEdit(m);
                            setIsMaintenanceModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="Lihat / Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LAPORAN KERUSAKAN & WORK ORDER */}
      {activeTab === 'kerusakan' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setKerusakanSubTab('laporan')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  kerusakanSubTab === 'laporan'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                Laporan Kerusakan Masuk ({damageReports.length})
              </button>
              <button
                onClick={() => setKerusakanSubTab('work_order')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  kerusakanSubTab === 'work_order'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                Work Order Perbaikan ({workOrders.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {kerusakanSubTab === 'laporan' ? (
                <button
                  onClick={() => {
                    setDamageReportAsset(null);
                    setIsDamageReportModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Buat Laporan Kerusakan Baru
                </button>
              ) : (
                <button
                  onClick={() => {
                    setWorkOrderToEdit(null);
                    setWoFromDamageReport(null);
                    setIsWorkOrderModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Buat Work Order Baru
                </button>
              )}
            </div>
          </div>

          {/* Sub-tab 1: Laporan Kerusakan Table */}
          {kerusakanSubTab === 'laporan' && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3">ID Laporan</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Kode &amp; Nama Alat</th>
                      <th className="p-3">Lokasi</th>
                      <th className="p-3">Pelapor</th>
                      <th className="p-3">Gejala Kerusakan</th>
                      <th className="p-3 text-center">Tingkat</th>
                      <th className="p-3 text-center">Prioritas</th>
                      <th className="p-3 text-right">Estimasi Biaya</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {damageReports.map((d) => (
                      <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">{d.id}</td>
                        <td className="p-3 font-mono">{formatDateIndo(d.reportDate)}</td>
                        <td className="p-3">
                          <span className="font-bold text-white block">[{d.assetCode}]</span>
                          <span className="text-zinc-400 text-[11px]">{d.assetName}</span>
                        </td>
                        <td className="p-3 text-zinc-300">{d.location}</td>
                        <td className="p-3">
                          <span className="text-zinc-200 block font-medium">{d.reporter}</span>
                          <span className="text-[10px] text-zinc-500">{d.reporterRole}</span>
                        </td>
                        <td className="p-3 text-white font-medium max-w-xs truncate">{d.damageType}</td>
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
                                : d.priority === 'Tinggi'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-blue-500/20 text-blue-400'
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
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setWoFromDamageReport(d);
                              setWorkOrderToEdit(null);
                              setIsWorkOrderModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors"
                            title="Buat Work Order dari laporan ini"
                          >
                            Proses ke WO
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Work Order Table */}
          {kerusakanSubTab === 'work_order' && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3">No. WO</th>
                      <th className="p-3">Alat</th>
                      <th className="p-3">Teknisi / Vendor</th>
                      <th className="p-3">Target Selesai</th>
                      <th className="p-3 text-right">Estimasi Biaya</th>
                      <th className="p-3 text-right">Biaya Realisasi</th>
                      <th className="p-3 text-right">Selisih Biaya</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {workOrders.map((wo) => (
                      <tr key={wo.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-blue-400">{wo.id}</td>
                        <td className="p-3">
                          <span className="font-bold text-white block">[{wo.assetCode}]</span>
                          <span className="text-zinc-400 text-[11px]">{wo.assetName}</span>
                        </td>
                        <td className="p-3 text-zinc-300">
                          <span className="block font-medium">{wo.technician}</span>
                          {wo.vendor && <span className="text-[10px] text-zinc-500">{wo.vendor}</span>}
                        </td>
                        <td className="p-3 font-mono">{formatDateIndo(wo.targetCompletionDate)}</td>
                        <td className="p-3 text-right font-mono text-zinc-400">{formatRp(wo.estimatedCost)}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {formatRp(wo.actualCost)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold">
                          {wo.costDifference < 0 ? (
                            <span className="text-emerald-400">Hemat {formatRp(Math.abs(wo.costDifference))}</span>
                          ) : wo.costDifference > 0 ? (
                            <span className="text-red-400">+{formatRp(wo.costDifference)}</span>
                          ) : (
                            <span className="text-zinc-500">Rp 0</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              wo.status === 'Completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : wo.status === 'In Progress'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {wo.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setWorkOrderToEdit(wo);
                              setWoFromDamageReport(null);
                              setIsWorkOrderModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            title="Kelola WO"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MANAJEMEN SPAREPART */}
      {activeTab === 'sparepart' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Inventaris Suku Cadang Gym &amp; Peringatan Stok Minimum
              </h3>
              <p className="text-xs text-zinc-400">
                Pencatatan belt, kabel pulley, bearing, selector pin, dan restock terintegrasi buku besar
              </p>
            </div>

            <button
              onClick={() => {
                setSparepartToEdit(null);
                setIsSparepartModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Master Sparepart
            </button>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Kode Part</th>
                    <th className="p-3">Nama Sparepart</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Lokasi Simpan</th>
                    <th className="p-3 text-center">Stok</th>
                    <th className="p-3 text-center">Min. Stok</th>
                    <th className="p-3 text-right">Harga Satuan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {spareparts.map((sp) => {
                    const isLow = sp.stock <= sp.minimumStock;
                    return (
                      <tr key={sp.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-orange-400">{sp.sparepartCode}</td>
                        <td className="p-3 font-bold text-white">{sp.name}</td>
                        <td className="p-3 text-zinc-400">{sp.category}</td>
                        <td className="p-3 text-zinc-300">{sp.supplier}</td>
                        <td className="p-3 text-zinc-400">{sp.storageLocation}</td>
                        <td className="p-3 text-center font-mono font-bold text-sm">
                          <span className={isLow ? 'text-red-400' : 'text-white'}>{sp.stock}</span>
                        </td>
                        <td className="p-3 text-center font-mono text-zinc-500">{sp.minimumStock}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {formatRp(sp.unitPrice)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sp.status === 'Habis'
                                ? 'bg-red-500/20 text-red-400'
                                : sp.status === 'Low Stock'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {sp.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSparepartToEdit(sp);
                              setIsSparepartModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition-colors"
                          >
                            Restock / Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PENGADAAN ALAT BARU */}
      {activeTab === 'pengadaan' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Pengadaan &amp; Pembelian Penambahan Alat Gym
              </h3>
              <p className="text-xs text-zinc-400">
                Otomatisasi pengadaan: ubah status ke &quot;Diterima/Selesai&quot; untuk otomatis membuat unit di Master Inventaris
              </p>
            </div>

            <button
              onClick={() => {
                setProcurementToEdit(null);
                setIsProcurementModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Ajukan Pengadaan Baru
            </button>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="p-3">No. Pengadaan</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Nama Alat</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3 text-center">Jumlah</th>
                    <th className="p-3 text-right">Harga Satuan</th>
                    <th className="p-3 text-right">Total Pembelian</th>
                    <th className="p-3">Sumber Dana</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {procurements.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-400">{p.id}</td>
                      <td className="p-3 font-mono">{formatDateIndo(p.date || p.orderDate || '')}</td>
                      <td className="p-3 font-bold text-white">{p.assetName || p.title || '-'}</td>
                      <td className="p-3 text-zinc-400">{p.category || '-'}</td>
                      <td className="p-3 text-zinc-300">{p.supplier || p.vendorName || '-'}</td>
                      <td className="p-3 text-center font-bold text-white">{p.quantity || 1} Unit</td>
                      <td className="p-3 text-right font-mono">{formatRp(p.unitPrice || 0)}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-400">
                        {formatRp(p.totalPurchase || p.totalCost || 0)}
                      </td>
                      <td className="p-3 text-zinc-400">{p.fundingSource || '-'}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'Selesai' || p.status === 'Diterima'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : p.status === 'Disetujui' || p.status === 'Dipesan'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setProcurementToEdit(p);
                            setIsProcurementModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="Detail / Proses Pengadaan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MUTASI LOKASI */}
      {activeTab === 'mutasi' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Log Riwayat Mutasi &amp; Pemindahan Lokasi Alat
              </h3>
              <p className="text-xs text-zinc-400">
                Pencatatan perpindahan alat antar zona gym, lantai, studio, dan penanggung jawab
              </p>
            </div>

            <button
              onClick={() => {
                setAssetForMovement(assets[0] || null);
                setIsMovementModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Catat Mutasi Lokasi
            </button>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="p-3">ID Mutasi</th>
                    <th className="p-3">Tanggal Mutasi</th>
                    <th className="p-3">Kode &amp; Nama Alat</th>
                    <th className="p-3">Lokasi Asal</th>
                    <th className="p-3">Lokasi Tujuan</th>
                    <th className="p-3">Alasan Pemindahan</th>
                    <th className="p-3">PIC Pemindahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-400">{mov.id}</td>
                      <td className="p-3 font-mono">{formatDateIndo(mov.date)}</td>
                      <td className="p-3">
                        <span className="font-bold text-white block">[{mov.assetCode}]</span>
                        <span className="text-zinc-400 text-[11px]">{mov.assetName}</span>
                      </td>
                      <td className="p-3 text-zinc-400">{mov.oldLocation || mov.originLocation}</td>
                      <td className="p-3 text-emerald-400 font-bold">{mov.newLocation || mov.destinationLocation}</td>
                      <td className="p-3 text-zinc-300 max-w-xs">{mov.reason}</td>
                      <td className="p-3 text-zinc-200 font-medium">{mov.pic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PENGHAPUSAN / DISPOSAL */}
      {activeTab === 'disposal' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Log Penghapusan, Penjualan &amp; Afkir Alat Gym
              </h3>
              <p className="text-xs text-zinc-400">
                Alat yang rusak total, afkir, atau dijual kembali untuk recovery modal
              </p>
            </div>

            <button
              onClick={() => {
                setAssetForDisposal(assets[0] || null);
                setIsDisposalModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Proses Disposal Alat
            </button>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="p-3">ID Disposal</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Kode &amp; Nama Alat</th>
                    <th className="p-3">Metode Penghapusan</th>
                    <th className="p-3">Alasan</th>
                    <th className="p-3 text-right">Nilai Sisa / Jual</th>
                    <th className="p-3">Disetujui Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {disposals.map((disp) => (
                    <tr key={disp.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-red-400">{disp.id}</td>
                      <td className="p-3 font-mono">{formatDateIndo(disp.disposalDate || disp.date || '')}</td>
                      <td className="p-3">
                        <span className="font-bold text-white block">[{disp.assetCode}]</span>
                        <span className="text-zinc-400 text-[11px]">{disp.assetName}</span>
                      </td>
                      <td className="p-3 font-bold text-zinc-200">{disp.method || disp.condition || '-'}</td>
                      <td className="p-3 text-zinc-400 max-w-xs">{disp.reason}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {disp.residualValue || disp.saleValue ? formatRp(disp.residualValue || disp.saleValue) : '-'}
                      </td>
                      <td className="p-3 text-zinc-300 font-medium">{disp.approvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Audit Trail &amp; Log Perubahan Inventaris
            </h3>
            <p className="text-xs text-zinc-400">
              Pencatatan riwayat setiap penambahan data, pengeditan, maintenance, mutasi, dan penghapusan inventaris
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Waktu &amp; Tanggal</th>
                    <th className="p-3">User Pelaksana</th>
                    <th className="p-3">Jenis Tindakan</th>
                    <th className="p-3">Alat Terkait</th>
                    <th className="p-3">Rincian Perubahan Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 font-mono text-zinc-400">{log.timestamp || `${log.date || ''} ${log.time || ''}`}</td>
                      <td className="p-3">
                        <span className="font-bold text-white block">{log.userName}</span>
                        <span className="text-[10px] text-zinc-500 uppercase">{log.userRole}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-500/20 text-blue-400'
                              : log.action === 'MAINTENANCE'
                              ? 'bg-orange-500/20 text-orange-400'
                              : log.action === 'MOVEMENT'
                              ? 'bg-purple-500/20 text-purple-400'
                              : log.action === 'DISPOSAL'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {log.action || log.activity || 'AUDIT'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-zinc-200">{log.assetName || log.assetId || '-'}</td>
                      <td className="p-3 text-zinc-400">{log.details || log.activity || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: LAPORAN & TCO */}
      {activeTab === 'laporan' && (
        <InventoryReportsView
          assets={assets}
          maintenances={maintenances}
          damageReports={damageReports}
          procurements={procurements}
          spareparts={spareparts}
        />
      )}

      {/* --- ALL MODALS INTEGRATED --- */}
      {selectedAssetForDetail && (
        <AssetDetailModal
          asset={selectedAssetForDetail}
          maintenances={maintenances}
          damageReports={damageReports}
          movements={movements}
          currentUser={currentUser}
          onClose={() => setSelectedAssetForDetail(null)}
          onEditAsset={(a: GymAsset) => {
            setSelectedAssetForDetail(null);
            setAssetToEdit(a);
            setIsAssetFormOpen(true);
          }}
          onOpenMaintenance={(a: GymAsset) => {
            setSelectedAssetForDetail(null);
            setMaintenanceAsset(a);
            setMaintenanceToEdit(null);
            setIsMaintenanceModalOpen(true);
          }}
          onOpenDamageReport={(a: GymAsset) => {
            setSelectedAssetForDetail(null);
            setDamageReportAsset(a);
            setIsDamageReportModalOpen(true);
          }}
          onOpenMovement={(a: GymAsset) => {
            setSelectedAssetForDetail(null);
            setAssetForMovement(a);
            setIsMovementModalOpen(true);
          }}
          onOpenDisposal={(a: GymAsset) => {
            setSelectedAssetForDetail(null);
            setAssetForDisposal(a);
            setIsDisposalModalOpen(true);
          }}
        />
      )}

      {isAssetFormOpen && (
        <AssetFormModal
          assetToEdit={assetToEdit}
          onSave={(asset, isNew) => onSaveAsset(asset, isNew)}
          onClose={() => setIsAssetFormOpen(false)}
        />
      )}

      {isMaintenanceModalOpen && (
        <MaintenanceModal
          initialAsset={maintenanceAsset}
          assets={assets}
          spareparts={spareparts}
          approvalConfig={approvalConfig}
          currentUser={currentUser}
          onSave={(mnt) => onSaveMaintenance(mnt, !maintenanceToEdit)}
          onClose={() => setIsMaintenanceModalOpen(false)}
        />
      )}

      {isDamageReportModalOpen && (
        <DamageReportModal
          initialAsset={damageReportAsset}
          assets={assets}
          currentUser={currentUser}
          onSave={(report) => onSaveDamageReport(report)}
          onClose={() => setIsDamageReportModalOpen(false)}
        />
      )}

      {isWorkOrderModalOpen && (
        <WorkOrderModal
          workOrderToEdit={workOrderToEdit}
          fromDamageReport={woFromDamageReport}
          assets={assets}
          currentUser={currentUser}
          onSave={(wo) => onSaveWorkOrder(wo)}
          onClose={() => setIsWorkOrderModalOpen(false)}
        />
      )}

      {isProcurementModalOpen && (
        <ProcurementModal
          procurementToEdit={procurementToEdit}
          currentUser={currentUser}
          onSave={(proc, shouldGenerate) => onSaveProcurement(proc, shouldGenerate)}
          onClose={() => setIsProcurementModalOpen(false)}
        />
      )}

      {isSparepartModalOpen && (
        <SparepartModal
          sparepartToEdit={sparepartToEdit}
          onSave={(sp, isNew, cost) => onSaveSparepart(sp, isNew, cost)}
          onClose={() => setIsSparepartModalOpen(false)}
        />
      )}

      {isMovementModalOpen && assetForMovement && (
        <AssetMovementModal
          asset={assetForMovement}
          onSaveMovement={(mov) => onSaveMovement(mov)}
          onClose={() => setIsMovementModalOpen(false)}
        />
      )}

      {isDisposalModalOpen && assetForDisposal && (
        <AssetDisposalModal
          asset={assetForDisposal}
          onConfirmDisposal={(disp) => onSaveDisposal(disp)}
          onClose={() => setIsDisposalModalOpen(false)}
        />
      )}

      {isApprovalConfigOpen && (
        <ApprovalConfigModal
          config={approvalConfig}
          onSaveConfig={(cfg) => onSaveApprovalConfig(cfg)}
          onClose={() => setIsApprovalConfigOpen(false)}
        />
      )}
    </div>
  );
};

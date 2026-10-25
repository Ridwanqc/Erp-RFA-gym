import React, { useState, useMemo } from 'react';
import {
  Award,
  Users,
  Package,
  Dumbbell,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RotateCcw,
  ChevronRight,
  Printer,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowUpRight,
  Calendar,
  X,
  UserCheck,
  Sparkles,
  Info,
  ShieldCheck,
  Activity,
  FileText,
  Phone,
  AlertCircle,
  Download,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { User, Member, PackageItem, Schedule, PTPurchaseRecord, TrainingSessionDetail } from '../types';
import { formatRp, APP_TODAY, formatDateIndo, getTimestamp } from '../utils/formatters';
import { getSessionsForPurchase } from '../data/initialData';

interface TrainerPackagePerformanceViewProps {
  ptPurchases: PTPurchaseRecord[];
  staffUsers: User[];
  packages: PackageItem[];
  members: Member[];
  schedules: Schedule[];
  currentUser?: User | null;
  onNavigateTab: (tab: any) => void;
}

// Grouped structure for Trainer x Package
interface TrainerPackageGroup {
  trainerId: string;
  trainerName: string;
  packageId: string;
  packageName: string;
  uniqueMemberIds: Set<string>;
  memberCount: number;
  totalPackages: number; // count of purchase records
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  purchases: PTPurchaseRecord[];
}

export const TrainerPackagePerformanceView: React.FC<TrainerPackagePerformanceViewProps> = ({
  ptPurchases,
  staffUsers,
  packages,
  members,
  schedules,
  currentUser,
  onNavigateTab
}) => {
  // --- Active Tab for Views ---
  const [activeViewTab, setActiveViewTab] = useState<'trainer-package' | 'package-summary' | 'charts'>('trainer-package');

  // --- Print Modal States ---
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printReportType, setPrintReportType] = useState<'matrix' | 'detailed'>('matrix');
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

  // --- Filter States ---
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [selectedPackageStatus, setSelectedPackageStatus] = useState<string>('all');
  const [selectedMemberStatus, setSelectedMemberStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Drill Down Modal States ---
  // Level 1: Detail Trainer Modal
  const [selectedTrainerDetail, setSelectedTrainerDetail] = useState<{
    trainerId: string;
    trainerName: string;
  } | null>(null);

  // Level 2: Detail Member List Modal (under a trainer & package)
  const [selectedPackageDetail, setSelectedPackageDetail] = useState<{
    trainerName: string;
    packageName: string;
    purchases: PTPurchaseRecord[];
  } | null>(null);

  // Level 3: Individual Training Sessions Drill-Down Modal
  const [selectedMemberSessions, setSelectedMemberSessions] = useState<{
    purchase: PTPurchaseRecord;
    sessions: TrainingSessionDetail[];
  } | null>(null);

  // Member Quick Map for looking up member details
  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // List of active trainers (staff with role pt or leader_pt)
  const trainerList = useMemo(() => {
    return staffUsers.filter((u) => u.role === 'pt' || u.role === 'leader_pt' || u.id === 'S01');
  }, [staffUsers]);

  // List of PT Packages
  const ptPackagesList = useMemo(() => {
    return packages.filter((p) => p.cat === 'PT');
  }, [packages]);

  // --- Quick Date Filter Presets ---
  const handleSetDatePreset = (preset: 'all' | 'this-month' | 'last-month' | '3-months') => {
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this-month') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'last-month') {
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    } else if (preset === '3-months') {
      setStartDate('2026-07-01');
      setEndDate('2026-09-30');
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedTrainer('all');
    setSelectedPackage('all');
    setSelectedPackageStatus('all');
    setSelectedMemberStatus('all');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(
    startDate ||
    endDate ||
    selectedTrainer !== 'all' ||
    selectedPackage !== 'all' ||
    selectedPackageStatus !== 'all' ||
    selectedMemberStatus !== 'all' ||
    searchQuery
  );

  // --- FILTERED PT PURCHASES ---
  const filteredPurchases = useMemo(() => {
    return ptPurchases.filter((item) => {
      // Date filter
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      // Trainer filter
      if (selectedTrainer !== 'all') {
        if (item.trainerName !== selectedTrainer && item.trainerId !== selectedTrainer) {
          return false;
        }
      }

      // Package filter
      if (selectedPackage !== 'all') {
        if (item.packageName !== selectedPackage && item.packageId !== selectedPackage) {
          return false;
        }
      }

      // Package status filter
      if (selectedPackageStatus !== 'all') {
        if (item.status !== selectedPackageStatus) return false;
      }

      // Member status filter
      if (selectedMemberStatus !== 'all') {
        const mem = memberMap.get(item.memberId);
        if (selectedMemberStatus === 'Active') {
          if (mem && mem.followUpStatus === 'DROPOUT WARNING') return false;
        } else if (selectedMemberStatus === 'Warning') {
          if (!mem || mem.followUpStatus !== 'DROPOUT WARNING') return false;
        }
      }

      // Search query (member name, member id, trainer name, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = item.memberName.toLowerCase();
        const mId = item.memberId.toLowerCase();
        const tName = (item.trainerName || '-').toLowerCase();
        const pName = item.packageName.toLowerCase();
        const notes = (item.notes || '').toLowerCase();
        if (
          !mName.includes(q) &&
          !mId.includes(q) &&
          !tName.includes(q) &&
          !pName.includes(q) &&
          !notes.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    ptPurchases,
    startDate,
    endDate,
    selectedTrainer,
    selectedPackage,
    selectedPackageStatus,
    selectedMemberStatus,
    searchQuery,
    memberMap
  ]);

  // --- TOP 6 CORE KPIS ---
  const kpis = useMemo(() => {
    // Unique Trainers involved
    const trainerSet = new Set<string>();
    // Unique Member IDs involved
    const memberSet = new Set<string>();

    let totalPackages = 0;
    let totalSessions = 0;
    let completedSessions = 0;

    filteredPurchases.forEach((p) => {
      trainerSet.add(p.trainerName || '-');
      memberSet.add(p.memberId);
      totalPackages += 1; // Count PT Purchase ID
      totalSessions += p.totalSessions;
      completedSessions += p.completedSessions;
    });

    const remainingSessions = Math.max(0, totalSessions - completedSessions);
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return {
      totalTrainers: trainerSet.size,
      totalMembers: memberSet.size,
      totalPackages,
      totalSessions,
      completedSessions,
      remainingSessions,
      completionRate
    };
  }, [filteredPurchases]);

  // --- GROUPED DATA: PERFORMANCE TRAINER x PAKET ---
  const trainerPackageGroups = useMemo(() => {
    const map = new Map<string, TrainerPackageGroup>();

    filteredPurchases.forEach((p) => {
      const tName = p.trainerName || '-';
      const key = `${tName}___${p.packageName}`;
      if (!map.has(key)) {
        map.set(key, {
          trainerId: p.trainerId || '',
          trainerName: tName,
          packageId: p.packageId,
          packageName: p.packageName,
          uniqueMemberIds: new Set<string>(),
          memberCount: 0,
          totalPackages: 0,
          totalSessions: 0,
          completedSessions: 0,
          remainingSessions: 0,
          purchases: []
        });
      }

      const group = map.get(key)!;
      group.uniqueMemberIds.add(p.memberId);
      group.totalPackages += 1;
      group.totalSessions += p.totalSessions;
      group.completedSessions += p.completedSessions;
      group.purchases.push(p);
    });

    const result: TrainerPackageGroup[] = Array.from(map.values()).map((g) => ({
      ...g,
      memberCount: g.uniqueMemberIds.size,
      remainingSessions: Math.max(0, g.totalSessions - g.completedSessions)
    }));

    // Sort by trainer name, then package total sessions descending
    result.sort((a, b) => {
      if (a.trainerName < b.trainerName) return -1;
      if (a.trainerName > b.trainerName) return 1;
      return b.totalSessions - a.totalSessions;
    });

    return result;
  }, [filteredPurchases]);

  // --- GROUPED DATA: PERFORMANCE BERDASARKAN PAKET PT (Tab 2) ---
  const packagePerformanceSummary = useMemo(() => {
    interface PkgSummary {
      packageId: string;
      packageName: string;
      trainers: Set<string>;
      uniqueMembers: Set<string>;
      totalPackages: number;
      totalSessions: number;
      completedSessions: number;
      remainingSessions: number;
      purchases: PTPurchaseRecord[];
    }

    const map = new Map<string, PkgSummary>();

    filteredPurchases.forEach((p) => {
      if (!map.has(p.packageName)) {
        map.set(p.packageName, {
          packageId: p.packageId,
          packageName: p.packageName,
          trainers: new Set<string>(),
          uniqueMembers: new Set<string>(),
          totalPackages: 0,
          totalSessions: 0,
          completedSessions: 0,
          remainingSessions: 0,
          purchases: []
        });
      }

      const s = map.get(p.packageName)!;
      s.trainers.add(p.trainerName || '-');
      s.uniqueMembers.add(p.memberId);
      s.totalPackages += 1;
      s.totalSessions += p.totalSessions;
      s.completedSessions += p.completedSessions;
      s.purchases.push(p);
    });

    return Array.from(map.values())
      .map((s) => ({
        packageId: s.packageId,
        packageName: s.packageName,
        trainerCount: s.trainers.size,
        memberCount: s.uniqueMembers.size,
        totalPackages: s.totalPackages,
        totalSessions: s.totalSessions,
        completedSessions: s.completedSessions,
        remainingSessions: Math.max(0, s.totalSessions - s.completedSessions),
        completionRate: s.totalSessions > 0 ? Math.round((s.completedSessions / s.totalSessions) * 100) : 0,
        purchases: s.purchases
      }))
      .sort((a, b) => b.totalPackages - a.totalPackages);
  }, [filteredPurchases]);

  // --- CHART DATA 1: Member per Paket ---
  const chartMemberPerPackage = useMemo(() => {
    return packagePerformanceSummary.map((item) => ({
      name: item.packageName.replace('PT Personal ', 'PT ').replace('Paket PT ', 'PT '),
      memberCount: item.memberCount,
      packageCount: item.totalPackages
    }));
  }, [packagePerformanceSummary]);

  // --- CHART DATA 2: Session per Trainer (Selesai vs Sisa) ---
  const chartSessionPerTrainer = useMemo(() => {
    const map = new Map<string, { trainer: string; selesai: number; sisa: number; total: number }>();

    filteredPurchases.forEach((p) => {
      const tName = p.trainerName || '-';
      if (!map.has(tName)) {
        map.set(tName, { trainer: tName, selesai: 0, sisa: 0, total: 0 });
      }
      const entry = map.get(tName)!;
      entry.selesai += p.completedSessions;
      entry.total += p.totalSessions;
    });

    return Array.from(map.values())
      .map((e) => ({
        ...e,
        sisa: Math.max(0, e.total - e.selesai)
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredPurchases]);

  // --- CHART DATA 3: Trainer x Package (Session distribution) ---
  const chartTrainerPackageBreakdown = useMemo(() => {
    // Unique packages
    const pkgNames = Array.from(new Set(filteredPurchases.map((p) => p.packageName)));
    const trainerNames = Array.from(new Set(filteredPurchases.map((p) => p.trainerName)));

    return trainerNames.map((tName) => {
      const row: any = { trainer: tName };
      pkgNames.forEach((pName) => {
        const matched = filteredPurchases.filter((p) => p.trainerName === tName && p.packageName === pName);
        const total = matched.reduce((acc, curr) => acc + curr.totalSessions, 0);
        row[pName] = total;
      });
      return row;
    });
  }, [filteredPurchases]);

  // --- DRILL DOWN DATA: DETAIL TRAINER BREAKDOWN ---
  const trainerDetailSummary = useMemo(() => {
    if (!selectedTrainerDetail) return null;
    const tName = selectedTrainerDetail.trainerName;
    const trainerPurchases = filteredPurchases.filter((p) => p.trainerName === tName);

    const uniqueMembers = new Set(trainerPurchases.map((p) => p.memberId));
    const totalPackages = trainerPurchases.length;
    const totalSessions = trainerPurchases.reduce((acc, p) => acc + p.totalSessions, 0);
    const completedSessions = trainerPurchases.reduce((acc, p) => acc + p.completedSessions, 0);
    const remainingSessions = Math.max(0, totalSessions - completedSessions);

    // Group by package for this trainer
    const pkgMap = new Map<string, {
      packageName: string;
      memberIds: Set<string>;
      totalPackages: number;
      totalSessions: number;
      completedSessions: number;
      remainingSessions: number;
      purchases: PTPurchaseRecord[];
    }>();

    trainerPurchases.forEach((p) => {
      if (!pkgMap.has(p.packageName)) {
        pkgMap.set(p.packageName, {
          packageName: p.packageName,
          memberIds: new Set(),
          totalPackages: 0,
          totalSessions: 0,
          completedSessions: 0,
          remainingSessions: 0,
          purchases: []
        });
      }
      const entry = pkgMap.get(p.packageName)!;
      entry.memberIds.add(p.memberId);
      entry.totalPackages += 1;
      entry.totalSessions += p.totalSessions;
      entry.completedSessions += p.completedSessions;
      entry.purchases.push(p);
    });

    const breakdown = Array.from(pkgMap.values()).map((e) => ({
      packageName: e.packageName,
      memberCount: e.memberIds.size,
      totalPackages: e.totalPackages,
      totalSessions: e.totalSessions,
      completedSessions: e.completedSessions,
      remainingSessions: Math.max(0, e.totalSessions - e.completedSessions),
      completionRate: e.totalSessions > 0 ? Math.round((e.completedSessions / e.totalSessions) * 100) : 0,
      purchases: e.purchases
    }));

    return {
      trainerName: tName,
      memberCount: uniqueMembers.size,
      totalPackages,
      totalSessions,
      completedSessions,
      remainingSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      breakdown
    };
  }, [selectedTrainerDetail, filteredPurchases]);

  // Print & Export Handlers
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const handlePrintDirect = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Trainer',
      'Paket PT',
      'Member Dibina (Unique ID)',
      'Total Paket Terjual',
      'Total Sesi Terdaftar',
      'Sesi Selesai (Completed)',
      'Sisa Sesi',
      'Tingkat Selesai (%)'
    ];
    const rows = trainerPackageGroups.map((g, idx) => [
      idx + 1,
      `"${g.trainerName}"`,
      `"${g.packageName}"`,
      g.memberCount,
      g.totalPackages,
      g.totalSessions,
      g.completedSessions,
      g.remainingSessions,
      `"${g.totalSessions > 0 ? Math.round((g.completedSessions / g.totalSessions) * 100) : 0}%"`
    ]);

    // Grand total row
    rows.push([
      'TOTAL',
      `"Semua Trainer (${kpis.totalTrainers})"`,
      '"Semua Paket"',
      kpis.totalMembers,
      kpis.totalPackages,
      kpis.totalSessions,
      kpis.completedSessions,
      kpis.remainingSessions,
      `"${kpis.completionRate}%"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Performa_Trainer_Paket_${APP_TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintNewWindow = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ========================================================================= */}
      {/* 1. HEADER & HERO BANNER                                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Laporan RFA GYM ERP
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              Modul Leader PT & Management
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>PERFORMA TRAINER BERDASARKAN PAKET</span>
          </h1>

          <p className="text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Analisis terpadu performa setiap pelatih Personal Trainer: jumlah member unik binaan, paket yang diambil,
            total sesi terdaftar, sesi selesai (<span className="text-emerald-400 font-semibold">COMPLETED</span>), serta sisa kuota sesi berjalan secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-10 flex-wrap">
          <button
            onClick={() => onNavigateTab('leader-pt')}
            className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Activity className="w-4 h-4 text-orange-400" />
            <span>Dashboard Leader PT</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-black transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER BAR (5 SIMULTANEOUS FILTERS)                                     */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-black text-white tracking-wide uppercase">Filter Laporan Multi-Kriteria</h3>
            <span className="text-[11px] text-zinc-400">• Semua filter bekerja secara bersamaan</span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-zinc-500 mr-1">Preset:</span>
            <button
              onClick={() => handleSetDatePreset('this-month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                startDate === '2026-09-01' && endDate === '2026-09-30'
                  ? 'bg-orange-500 text-zinc-950'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Bulan Ini (Sept 2026)
            </button>
            <button
              onClick={() => handleSetDatePreset('last-month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                startDate === '2026-08-01' && endDate === '2026-08-31'
                  ? 'bg-orange-500 text-zinc-950'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Agustus 2026
            </button>
            <button
              onClick={() => handleSetDatePreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                !startDate && !endDate
                  ? 'bg-orange-500 text-zinc-950'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Semua Waktu
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1 ml-1"
                title="Reset semua filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Filter 1: Periode Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1">1. Periode Tanggal (Mulai - Sampai)</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                placeholder="Mulai"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                placeholder="Sampai"
              />
            </div>
          </div>

          {/* Filter 2: Nama Trainer */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1">2. Nama Trainer</label>
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Trainer ({trainerList.length})</option>
              {trainerList.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.roleName})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Paket PT */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1">3. Paket PT</label>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Paket PT</option>
              {ptPackagesList.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.value} Sesi)
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: Status Paket */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1">4. Status Paket</label>
            <select
              value={selectedPackageStatus}
              onChange={(e) => setSelectedPackageStatus(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Status Paket</option>
              <option value="Active">Aktif (Masih Ada Kuota)</option>
              <option value="Completed">Completed (Sesi Habis)</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Filter 5: Status Member */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1">5. Status Member</label>
            <select
              value={selectedMemberStatus}
              onChange={(e) => setSelectedMemberStatus(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Status Member</option>
              <option value="Active">Aktif Latihan</option>
              <option value="Warning">Dropout Warning (&gt; 14 Hari)</option>
            </select>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama member, trainer, catatan..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="text-zinc-400 flex items-center gap-1.5 self-start sm:self-center">
            <Info className="w-3.5 h-3.5 text-orange-400" />
            <span>
              Menampilkan <span className="text-white font-bold">{filteredPurchases.length}</span> transaksi paket PT
              terfilter dari total <span className="text-zinc-300">{ptPurchases.length}</span> data.
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP 6 CORE KPI CARDS                                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* TOTAL TRAINER */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">TOTAL TRAINER</p>
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-1.5 tracking-tight">{kpis.totalTrainers}</h3>
          <p className="text-[10px] text-zinc-400 mt-1">Pelatih PT aktif</p>
        </div>

        {/* TOTAL MEMBER DIBINA */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">MEMBER DIBINA</p>
            <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-orange-400 mt-1.5 tracking-tight">{kpis.totalMembers}</h3>
          <p className="text-[10px] text-orange-400/80 mt-1 font-semibold">Unique Member ID</p>
        </div>

        {/* TOTAL PAKET */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">TOTAL PAKET</p>
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-1.5 tracking-tight">{kpis.totalPackages}</h3>
          <p className="text-[10px] text-zinc-400 mt-1">Transaksi / Pembelian PT</p>
        </div>

        {/* TOTAL SESI */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">TOTAL SESI</p>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Dumbbell className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-1.5 tracking-tight">{kpis.totalSessions}</h3>
          <p className="text-[10px] text-zinc-400 mt-1">Akumulasi seluruh paket</p>
        </div>

        {/* SESI SELESAI */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">SESI SELESAI</p>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-1.5 tracking-tight">{kpis.completedSessions}</h3>
          <p className="text-[10px] text-emerald-400/80 mt-1 font-semibold">{kpis.completionRate}% Tuntas (Completed)</p>
        </div>

        {/* SISA SESI */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">SISA SESI</p>
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-400 mt-1.5 tracking-tight">{kpis.remainingSessions}</h3>
          <p className="text-[10px] text-zinc-400 mt-1">Total Sesi - Selesai</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VIEW SELECTOR TABS                                                      */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveViewTab('trainer-package')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeViewTab === 'trainer-package'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tabel: Trainer × Paket PT ({trainerPackageGroups.length})</span>
        </button>

        <button
          onClick={() => setActiveViewTab('package-summary')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeViewTab === 'package-summary'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Tabel: Performa Paket PT ({packagePerformanceSummary.length})</span>
        </button>

        <button
          onClick={() => setActiveViewTab('charts')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeViewTab === 'charts'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Visualisasi Grafik (3 Tren)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TABEL UTAMA PERFORMANCE TRAINER x PAKET                           */}
      {/* ========================================================================= */}
      {activeViewTab === 'trainer-package' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40">
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>TABEL UTAMA: PERFORMANCE TRAINER × PAKET</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
                  {trainerPackageGroups.length} Kombinasi
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Klik baris Trainer untuk melihat ringkasan lengkap atau klik Paket untuk melihat daftar member & riwayat sesi.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Validasi: <strong>Member Dibina</strong> = Unique Member ID</span>
              </div>
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold transition flex items-center gap-1.5"
                title="Cetak laporan resmi"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Laporan</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Paket PT</th>
                  <th className="py-3 px-4 text-center">Member Dibina (Unique)</th>
                  <th className="py-3 px-4 text-center">Total Paket</th>
                  <th className="py-3 px-4 text-center">Total Sesi</th>
                  <th className="py-3 px-4 text-center">Sesi Selesai</th>
                  <th className="py-3 px-4 text-center">Sisa Sesi</th>
                  <th className="py-3 px-4 text-center">Progres</th>
                  <th className="py-3 px-4 text-right">Aksi Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {trainerPackageGroups.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-zinc-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                      <p className="font-semibold">Tidak ada data yang sesuai dengan kriteria filter.</p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 text-xs text-orange-400 hover:underline font-bold"
                      >
                        Reset semua filter
                      </button>
                    </td>
                  </tr>
                ) : (
                  trainerPackageGroups.map((group, idx) => {
                    const progress = group.totalSessions > 0
                      ? Math.round((group.completedSessions / group.totalSessions) * 100)
                      : 0;

                    return (
                      <tr
                        key={`${group.trainerName}-${group.packageName}-${idx}`}
                        className="hover:bg-zinc-800/40 transition group"
                      >
                        {/* Trainer Name with Clickable Detail */}
                        <td className="py-3 px-4 font-bold text-white">
                          <button
                            onClick={() =>
                              setSelectedTrainerDetail({
                                trainerId: group.trainerId,
                                trainerName: group.trainerName
                              })
                            }
                            className="hover:text-orange-400 transition flex items-center gap-1.5 text-left"
                            title="Klik untuk melihat ringkasan lengkap trainer ini"
                          >
                            <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0">
                              {group.trainerName.charAt(0)}
                            </span>
                            <span>{group.trainerName}</span>
                          </button>
                        </td>

                        {/* Package Name */}
                        <td className="py-3 px-4 font-semibold text-zinc-300">
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/60 font-medium">
                            {group.packageName}
                          </span>
                        </td>

                        {/* Member Dibina (Unique ID) */}
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {group.memberCount} Member
                          </span>
                        </td>

                        {/* Total Paket */}
                        <td className="py-3 px-4 text-center font-bold text-white">
                          {group.totalPackages} Paket
                        </td>

                        {/* Total Sesi */}
                        <td className="py-3 px-4 text-center font-black text-amber-400">
                          {group.totalSessions} Sesi
                        </td>

                        {/* Sesi Selesai (COMPLETED) */}
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {group.completedSessions}
                          </span>
                        </td>

                        {/* Sisa Sesi */}
                        <td className="py-3 px-4 text-center font-black text-rose-400">
                          {group.remainingSessions}
                        </td>

                        {/* Progres Bar */}
                        <td className="py-3 px-4 text-center min-w-[120px]">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-zinc-300">{progress}%</span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                setSelectedPackageDetail({
                                  trainerName: group.trainerName,
                                  packageName: group.packageName,
                                  purchases: group.purchases
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-[11px] transition flex items-center gap-1"
                              title="Buka daftar member yang mengambil paket ini"
                            >
                              <span>Lihat Member</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {trainerPackageGroups.length > 0 && (
                <tfoot>
                  <tr className="bg-zinc-950 font-black text-white border-t-2 border-zinc-700 text-xs">
                    <td className="py-3 px-4 text-orange-400 uppercase tracking-wider" colSpan={2}>
                      Grand Total Keseluruhan
                    </td>
                    <td className="py-3 px-4 text-center text-blue-400">
                      {kpis.totalMembers} Member Unik
                    </td>
                    <td className="py-3 px-4 text-center">{kpis.totalPackages} Paket</td>
                    <td className="py-3 px-4 text-center text-amber-400">{kpis.totalSessions} Sesi</td>
                    <td className="py-3 px-4 text-center text-emerald-400">{kpis.completedSessions} Selesai</td>
                    <td className="py-3 px-4 text-center text-rose-400">{kpis.remainingSessions} Sisa</td>
                    <td className="py-3 px-4 text-center text-zinc-300">{kpis.completionRate}% Rata-rata</td>
                    <td className="py-3 px-4 text-right text-zinc-400">-</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERFORMANCE BERDASARKAN PAKET PT                                  */}
      {/* ========================================================================= */}
      {activeViewTab === 'package-summary' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40">
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>LAPORAN: PERFORMANCE BERDASARKAN PAKET PT</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Perbandingan performa antar paket: mengetahui paket mana yang paling diminati dan beban pembinaan trainer.
              </p>
            </div>
            <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Paket Terlaris: <strong>{packagePerformanceSummary[0]?.packageName || '-'}</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Paket PT</th>
                  <th className="py-3 px-4 text-center">Total Trainer</th>
                  <th className="py-3 px-4 text-center">Total Member (Unique)</th>
                  <th className="py-3 px-4 text-center">Total Paket</th>
                  <th className="py-3 px-4 text-center">Total Sesi</th>
                  <th className="py-3 px-4 text-center">Sesi Selesai</th>
                  <th className="py-3 px-4 text-center">Sisa Sesi</th>
                  <th className="py-3 px-4 text-center">Tingkat Penyelesaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {packagePerformanceSummary.map((pkg, idx) => (
                  <tr key={pkg.packageName + idx} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4 font-black text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                      <span>{pkg.packageName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-zinc-200">
                      {pkg.trainerCount} Trainer
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {pkg.memberCount} Member
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-white">
                      {pkg.totalPackages} Paket
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-amber-400">
                      {pkg.totalSessions} Sesi
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {pkg.completedSessions}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-rose-400">
                      {pkg.remainingSessions}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${pkg.completionRate}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-300">{pkg.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VISUALISASI GRAFIK RECHARTS                                       */}
      {/* ========================================================================= */}
      {activeViewTab === 'charts' && (
        <div className="space-y-6">
          {/* Top Row: 2 Charts Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Member per Paket */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Member per Paket PT</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Jumlah member unik pada setiap paket</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMemberPerPackage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} />
                    <YAxis stroke="#a1a1aa" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f4f4f5'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="memberCount" name="Member Unik" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="packageCount" name="Total Paket Terjual" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Session per Trainer (Selesai vs Sisa) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span>Sesi per Trainer (Selesai vs Sisa)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Beban sesi tuntas vs sisa kuota yang harus dilatih</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartSessionPerTrainer}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="trainer" stroke="#a1a1aa" fontSize={11} />
                    <YAxis stroke="#a1a1aa" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f4f4f5'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="selesai" name="Sesi Selesai (Completed)" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="sisa" name="Sisa Sesi" fill="#f43f5e" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 3: Trainer x Package (Full Width Stacked) */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-400" />
                  <span>Trainer × Package (Distribusi Total Sesi per Paket)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Memetakan volume sesi setiap pelatih berdasarkan variasi paket PT yang dibina
                </p>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTrainerPackageBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="trainer" stroke="#a1a1aa" fontSize={11} />
                  <YAxis stroke="#a1a1aa" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f4f4f5'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="PT Personal 10 Session" name="PT 10 Sesi" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PT Personal 20 Session" name="PT 20 Sesi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PT Personal 30 Session" name="PT 30 Sesi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Paket PT 8 Sesi Intensive" name="PT 8 Sesi" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Paket PT 16 Sesi Transformation" name="PT 16 Sesi" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Paket PT 4 Sesi" name="PT 4 Sesi" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LEVEL 1: DETAIL TRAINER (Contoh: TRAINER ANDI)                     */}
      {/* ========================================================================= */}
      {selectedTrainerDetail && trainerDetailSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
                  DETAIL TRAINER
                </span>
                <h2 className="text-xl font-black text-white tracking-tight mt-1">
                  # TRAINER {trainerDetailSummary.trainerName.toUpperCase()}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Rincian akumulasi pembinaan member dan breakdown per paket PT
                </p>
              </div>
              <button
                onClick={() => setSelectedTrainerDetail(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 KPI Summary Cards for Trainer */}
            <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/60">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Member Dibina</p>
                  <p className="text-lg font-black text-blue-400 mt-0.5">{trainerDetailSummary.memberCount} Member</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Paket</p>
                  <p className="text-lg font-black text-white mt-0.5">{trainerDetailSummary.totalPackages} Paket</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Sesi</p>
                  <p className="text-lg font-black text-amber-400 mt-0.5">{trainerDetailSummary.totalSessions} Sesi</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Sesi Selesai</p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">{trainerDetailSummary.completedSessions} Sesi</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Sisa Sesi</p>
                  <p className="text-lg font-black text-rose-400 mt-0.5">{trainerDetailSummary.remainingSessions} Sesi</p>
                </div>
              </div>
            </div>

            {/* Breakdown Table by Package */}
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wider mb-3">
                Breakdown Berdasarkan Paket PT
              </h3>

              <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 text-[10px] uppercase font-bold border-b border-zinc-800">
                      <th className="py-2.5 px-3">Paket</th>
                      <th className="py-2.5 px-3 text-center">Member</th>
                      <th className="py-2.5 px-3 text-center">Paket</th>
                      <th className="py-2.5 px-3 text-center">Total Sesi</th>
                      <th className="py-2.5 px-3 text-center">Selesai</th>
                      <th className="py-2.5 px-3 text-center">Sisa</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {trainerDetailSummary.breakdown.map((row, idx) => (
                      <tr key={row.packageName + idx} className="hover:bg-zinc-800/30">
                        <td className="py-2.5 px-3 font-bold text-white">{row.packageName}</td>
                        <td className="py-2.5 px-3 text-center text-blue-400 font-bold">{row.memberCount}</td>
                        <td className="py-2.5 px-3 text-center text-white">{row.totalPackages}</td>
                        <td className="py-2.5 px-3 text-center text-amber-400 font-black">{row.totalSessions}</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-black">{row.completedSessions}</td>
                        <td className="py-2.5 px-3 text-center text-rose-400 font-black">{row.remainingSessions}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedPackageDetail({
                                trainerName: trainerDetailSummary.trainerName,
                                packageName: row.packageName,
                                purchases: row.purchases
                              });
                            }}
                            className="text-[11px] font-bold text-orange-400 hover:text-orange-300 hover:underline"
                          >
                            Daftar Member &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
              <button
                onClick={() => setSelectedTrainerDetail(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LEVEL 2: DETAIL MEMBER (Contoh: Andi -> PT Personal 10 Session)      */}
      {/* ========================================================================= */}
      {selectedPackageDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                    DRILL DOWN: DETAIL MEMBER
                  </span>
                  <span className="text-xs text-zinc-400">Trainer: <strong className="text-white">{selectedPackageDetail.trainerName}</strong></span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight mt-1">
                  {selectedPackageDetail.packageName}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Daftar member unik yang menggunakan paket ini beserta progres sesi latihan
                </p>
              </div>
              <button
                onClick={() => setSelectedPackageDetail(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Table: Member List */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 text-[10px] uppercase font-bold border-b border-zinc-800">
                      <th className="py-3 px-4">Member (ID)</th>
                      <th className="py-3 px-4 text-center">Total Sesi</th>
                      <th className="py-3 px-4 text-center">Selesai</th>
                      <th className="py-3 px-4 text-center">Sisa</th>
                      <th className="py-3 px-4 text-center">Last Training</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {selectedPackageDetail.purchases.map((pur) => {
                      const memberObj = memberMap.get(pur.memberId);
                      const remaining = pur.totalSessions - pur.completedSessions;

                      return (
                        <tr key={pur.id} className="hover:bg-zinc-800/30 transition">
                          {/* Member Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{pur.memberName}</span>
                              <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                                {pur.memberId}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{pur.notes || 'Program aktif'}</p>
                          </td>

                          {/* Total Sesi */}
                          <td className="py-3 px-4 text-center font-bold text-white">
                            {pur.totalSessions}
                          </td>

                          {/* Selesai */}
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-extrabold text-xs">
                              {pur.completedSessions}
                            </span>
                          </td>

                          {/* Sisa */}
                          <td className="py-3 px-4 text-center font-black text-rose-400">
                            {remaining}
                          </td>

                          {/* Last Training Date */}
                          <td className="py-3 px-4 text-center text-zinc-300">
                            {formatDateIndo(pur.date)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                pur.status === 'Active'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {pur.status}
                            </span>
                          </td>

                          {/* Aksi Audit Sesi */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                const sessList = getSessionsForPurchase(pur);
                                setSelectedMemberSessions({
                                  purchase: pur,
                                  sessions: sessList
                                });
                              }}
                              className="px-2.5 py-1 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-[11px] transition shadow-sm"
                            >
                              Lihat Sesi 1–{pur.totalSessions} &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center text-xs">
              <span className="text-zinc-400">
                Total Member: <strong className="text-white">{selectedPackageDetail.purchases.length}</strong>
              </span>
              <button
                onClick={() => setSelectedPackageDetail(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LEVEL 3: TRAINING SESSIONS DRILL-DOWN (Session 1, Session 2...)     */}
      {/* ========================================================================= */}
      {selectedMemberSessions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  AUDIT TRAIL: SESI LATIHAN MEMBER
                </span>
                <h2 className="text-xl font-black text-white tracking-tight mt-1">
                  {selectedMemberSessions.purchase.memberName}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Paket: <strong className="text-white">{selectedMemberSessions.purchase.packageName}</strong> • Trainer: <strong className="text-orange-400">{selectedMemberSessions.purchase.trainerName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedMemberSessions(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Progress Stats */}
            <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between text-xs px-6">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-zinc-500">Total Kuota:</span>{' '}
                  <strong className="text-white">{selectedMemberSessions.purchase.totalSessions} Sesi</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Selesai (Completed):</span>{' '}
                  <strong className="text-emerald-400">{selectedMemberSessions.purchase.completedSessions} Sesi</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Sisa Kuota:</span>{' '}
                  <strong className="text-rose-400">
                    {selectedMemberSessions.purchase.totalSessions - selectedMemberSessions.purchase.completedSessions} Sesi
                  </strong>
                </div>
              </div>
            </div>

            {/* Individual Sessions List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
              {selectedMemberSessions.sessions.map((sess) => {
                const isCompleted = sess.status === 'Selesai';

                return (
                  <div
                    key={sess.sessionId}
                    className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-zinc-950/70 border-zinc-800/80'
                        : 'bg-zinc-900/40 border-dashed border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        S#{sess.sessionNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">
                            Sesi ke-{sess.sessionNumber}: {sess.note}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isCompleted
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {sess.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Tanggal: {formatDateIndo(sess.date)} • Jam: {sess.time}
                        </p>
                      </div>
                    </div>

                    {/* Validasi 3 Pihak */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          sess.valStaf ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                        }`}
                        title="Paraf Staf Front Desk"
                      >
                        Staf {sess.valStaf ? '✓' : '-'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          sess.valTrainer ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                        }`}
                        title="Paraf Personal Trainer"
                      >
                        PT {sess.valTrainer ? '✓' : '-'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          sess.valMember ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                        }`}
                        title="Paraf / Tanda Tangan Member"
                      >
                        Member {sess.valMember ? '✓' : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
              <button
                onClick={() => setSelectedMemberSessions(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CETAK LAPORAN RESMI (OFFICIAL PRINT & EXPORT CENTER)                */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div
          id="print-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-zinc-900 border border-zinc-700 text-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header & Options (HIDDEN WHEN PRINTING VIA .no-print) */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Pratinjau & Cetak Laporan Performa Trainer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase font-bold">
                      A4 Official
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Dokumen siap cetak, export PDF, atau download lembar kerja Excel (CSV)
                  </p>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-export-csv"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
                  title="Unduh format spreadsheet untuk Microsoft Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Excel</span>
                </button>

                <button
                  id="btn-print-new-window"
                  onClick={handlePrintNewWindow}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
                  title="Buka dokumen di tab/jendela baru untuk pencetakan mandiri"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Jendela Baru</span>
                </button>

                <button
                  id="btn-print-direct-dialog"
                  onClick={handlePrintDirect}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customization Bar (HIDDEN WHEN PRINTING VIA .no-print) */}
            <div className="px-5 py-3 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs no-print shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-semibold">Tipe Format Laporan:</span>
                <button
                  onClick={() => setPrintReportType('matrix')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    printReportType === 'matrix'
                      ? 'bg-orange-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Matriks Trainer × Paket
                </button>
                <button
                  onClick={() => setPrintReportType('detailed')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    printReportType === 'detailed'
                      ? 'bg-orange-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Rincian Lengkap Member & Sesi
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded border-zinc-700 text-orange-500 focus:ring-0"
                />
                <span>Sertakan Lembar Tanda Tangan 3 Pihak (Audit)</span>
              </label>
            </div>

            {/* Scrollable Document Preview Area */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-zinc-950/60 flex justify-center">
              {/* Printable White Paper Sheet */}
              <div
                id="printable-report-sheet"
                className="bg-white text-zinc-900 w-full max-w-4xl p-8 sm:p-10 rounded-xl shadow-xl border border-zinc-300 font-sans text-xs print:p-0 print:border-none print:shadow-none"
              >
                {/* 1. KOP SURAT RESMI PERUSAHAAN */}
                <div className="border-b-4 border-double border-zinc-900 pb-4 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-md shrink-0">
                      R
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-zinc-950 leading-none">
                        RFA GYM FITNESS ENTERPRISE
                      </h1>
                      <p className="text-[11px] font-bold text-orange-600 tracking-wider uppercase mt-1">
                        DIVISI PERSONAL TRAINING & ATHLETIC DEVELOPMENT
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        Mega Fitness Center Lt. 2-3 • Jl. Boulevard Fitness No. 88, Jakarta • Telp: (021) 7788-9900
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-zinc-600">
                    <p className="font-bold text-zinc-900">FORMULIR KENDALI MUTU</p>
                    <p className="font-mono text-zinc-500">ISO-9001-FIT-PT</p>
                    <p className="mt-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      DOKUMEN RESMI
                    </p>
                  </div>
                </div>

                {/* 2. JUDUL DOKUMEN & METADATA */}
                <div className="text-center my-4">
                  <h2 className="text-lg font-black text-zinc-950 tracking-wide uppercase">
                    LAPORAN PERFORMA TRAINER BERDASARKAN PAKET
                  </h2>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Rekapitulasi Pembinaan Member, Kuota Sesi Latihan, dan Realisasi Sesi Selesai (Completed)
                  </p>
                </div>

                {/* Info Bar */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 my-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">No. Dokumen:</span>
                    <span className="font-mono font-bold text-zinc-900">DOC/RFA-PT/{APP_TODAY.replace(/-/g, '')}/007</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Tanggal Cetak:</span>
                    <span className="font-semibold text-zinc-900">{formatDateIndo(APP_TODAY)} ({getTimestamp()})</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Petugas Pelapor:</span>
                    <span className="font-bold text-zinc-900">{currentUser?.name || 'Citra Lestari'} ({currentUser?.role ? currentUser.role.toUpperCase() : 'LEADER PT'})</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Status Data:</span>
                    <span className="font-bold text-emerald-700">Terverifikasi Real-Time</span>
                  </div>
                </div>

                {/* Filter Parameter Terapan */}
                <div className="mb-4 text-[10px] text-zinc-600 bg-zinc-100/70 p-2.5 rounded border border-zinc-200 flex flex-wrap gap-x-4 gap-y-1">
                  <div><strong>Periode:</strong> {startDate && endDate ? `${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}` : 'Semua Waktu'}</div>
                  <div><strong>Trainer:</strong> {selectedTrainer === 'all' ? 'Semua Pelatih Aktif' : trainerList.find(t => t.id === selectedTrainer)?.name || selectedTrainer}</div>
                  <div><strong>Paket PT:</strong> {selectedPackage === 'all' ? 'Semua Paket PT' : ptPackagesList.find(p => p.id === selectedPackage)?.name || selectedPackage}</div>
                  <div><strong>Status Paket:</strong> {selectedPackageStatus === 'all' ? 'Semua Status' : selectedPackageStatus}</div>
                  <div><strong>Status Member:</strong> {selectedMemberStatus === 'all' ? 'Semua Member' : selectedMemberStatus}</div>
                </div>

                {/* 3. RINGKASAN EKSEKUTIF KPI (6 CARDS) */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  <div className="border border-zinc-300 rounded p-2 text-center bg-zinc-50">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Total Trainer</p>
                    <p className="text-base font-black text-zinc-900 mt-0.5">{kpis.totalTrainers}</p>
                  </div>
                  <div className="border border-zinc-300 rounded p-2 text-center bg-zinc-50">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Member Dibina</p>
                    <p className="text-base font-black text-blue-700 mt-0.5">{kpis.totalMembers}</p>
                    <p className="text-[8px] text-zinc-500">Unique Member ID</p>
                  </div>
                  <div className="border border-zinc-300 rounded p-2 text-center bg-zinc-50">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Total Paket</p>
                    <p className="text-base font-black text-purple-700 mt-0.5">{kpis.totalPackages}</p>
                    <p className="text-[8px] text-zinc-500">Count Purchase ID</p>
                  </div>
                  <div className="border border-zinc-300 rounded p-2 text-center bg-zinc-50">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Total Sesi</p>
                    <p className="text-base font-black text-zinc-900 mt-0.5">{kpis.totalSessions}</p>
                  </div>
                  <div className="border border-zinc-300 rounded p-2 text-center bg-zinc-50">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Sesi Selesai</p>
                    <p className="text-base font-black text-emerald-700 mt-0.5">{kpis.completedSessions}</p>
                    <p className="text-[8px] text-emerald-700">COMPLETED</p>
                  </div>
                  <div className="border border-zinc-300 rounded p-2 text-center bg-zinc-50">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Sisa Sesi</p>
                    <p className="text-base font-black text-amber-700 mt-0.5">{kpis.remainingSessions}</p>
                    <p className="text-[8px] text-zinc-500">{kpis.completionRate}% Selesai</p>
                  </div>
                </div>

                {/* 4. TABEL UTAMA: MATRIKS KOMBINASI TRAINER x PAKET */}
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase text-zinc-900 tracking-wider mb-1.5 flex items-center justify-between">
                    <span>I. MATRIKS KOMBINASI TRAINER × PAKET PERSONAL TRAINER</span>
                    <span className="text-[10px] text-zinc-500 font-normal">({trainerPackageGroups.length} Data Kombinasi)</span>
                  </h3>
                  <table className="w-full border-collapse border border-zinc-300 text-[10px]">
                    <thead>
                      <tr className="bg-zinc-100 font-bold text-zinc-800">
                        <th className="border border-zinc-300 p-2 text-center w-8">No</th>
                        <th className="border border-zinc-300 p-2 text-left">Nama Pelatih (Trainer)</th>
                        <th className="border border-zinc-300 p-2 text-left">Paket Program PT</th>
                        <th className="border border-zinc-300 p-2 text-center">Member Dibina (Unique)</th>
                        <th className="border border-zinc-300 p-2 text-center">Total Paket</th>
                        <th className="border border-zinc-300 p-2 text-center">Total Sesi</th>
                        <th className="border border-zinc-300 p-2 text-center">Sesi Selesai</th>
                        <th className="border border-zinc-300 p-2 text-center">Sisa Sesi</th>
                        <th className="border border-zinc-300 p-2 text-center">Progres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainerPackageGroups.map((g, idx) => {
                        const pct = g.totalSessions > 0 ? Math.round((g.completedSessions / g.totalSessions) * 100) : 0;
                        return (
                          <tr key={`${g.trainerId}-${g.packageId}`} className={idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}>
                            <td className="border border-zinc-300 p-1.5 text-center text-zinc-500 font-mono">{idx + 1}</td>
                            <td className="border border-zinc-300 p-1.5 font-bold text-zinc-900">{g.trainerName}</td>
                            <td className="border border-zinc-300 p-1.5 font-semibold text-zinc-800">{g.packageName}</td>
                            <td className="border border-zinc-300 p-1.5 text-center font-bold text-blue-700">{g.memberCount}</td>
                            <td className="border border-zinc-300 p-1.5 text-center font-bold text-purple-700">{g.totalPackages}</td>
                            <td className="border border-zinc-300 p-1.5 text-center font-bold text-zinc-900">{g.totalSessions}</td>
                            <td className="border border-zinc-300 p-1.5 text-center font-bold text-emerald-700">{g.completedSessions}</td>
                            <td className="border border-zinc-300 p-1.5 text-center font-bold text-amber-700">{g.remainingSessions}</td>
                            <td className="border border-zinc-300 p-1.5 text-center font-bold text-zinc-800">{pct}%</td>
                          </tr>
                        );
                      })}
                      {/* Grand Total Row */}
                      <tr className="bg-zinc-200/80 font-black text-zinc-950 border-t-2 border-zinc-400">
                        <td colSpan={3} className="border border-zinc-300 p-2 text-center uppercase tracking-wider">
                          TOTAL KESELURUHAN
                        </td>
                        <td className="border border-zinc-300 p-2 text-center text-blue-800 font-black text-xs">
                          {kpis.totalMembers}
                        </td>
                        <td className="border border-zinc-300 p-2 text-center text-purple-800 font-black text-xs">
                          {kpis.totalPackages}
                        </td>
                        <td className="border border-zinc-300 p-2 text-center font-black text-xs">
                          {kpis.totalSessions}
                        </td>
                        <td className="border border-zinc-300 p-2 text-center text-emerald-800 font-black text-xs">
                          {kpis.completedSessions}
                        </td>
                        <td className="border border-zinc-300 p-2 text-center text-amber-800 font-black text-xs">
                          {kpis.remainingSessions}
                        </td>
                        <td className="border border-zinc-300 p-2 text-center font-black text-xs">
                          {kpis.completionRate}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. TABEL RINCIAN MEMBER BINAAN (JIKA DIPILIH) */}
                {printReportType === 'detailed' && (
                  <div className="mb-6">
                    <h3 className="text-xs font-black uppercase text-zinc-900 tracking-wider mb-1.5 flex items-center justify-between">
                      <span>II. RINCIAN SELURUH MEMBER BINAAN & STATUS KUOTA SESI</span>
                      <span className="text-[10px] text-zinc-500 font-normal">({filteredPurchases.length} Transaksi Terdaftar)</span>
                    </h3>
                    <table className="w-full border-collapse border border-zinc-300 text-[9.5pt]">
                      <thead>
                        <tr className="bg-zinc-100 font-bold text-zinc-800">
                          <th className="border border-zinc-300 p-1.5 text-center w-8">No</th>
                          <th className="border border-zinc-300 p-1.5 text-center">ID Member</th>
                          <th className="border border-zinc-300 p-1.5 text-left">Nama Member</th>
                          <th className="border border-zinc-300 p-1.5 text-left">Trainer</th>
                          <th className="border border-zinc-300 p-1.5 text-left">Paket PT</th>
                          <th className="border border-zinc-300 p-1.5 text-center">Total</th>
                          <th className="border border-zinc-300 p-1.5 text-center">Selesai</th>
                          <th className="border border-zinc-300 p-1.5 text-center">Sisa</th>
                          <th className="border border-zinc-300 p-1.5 text-center">Status</th>
                          <th className="border border-zinc-300 p-1.5 text-center">Tgl Daftar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPurchases.map((p, idx) => (
                          <tr key={p.id} className={idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}>
                            <td className="border border-zinc-300 p-1 text-center text-zinc-500">{idx + 1}</td>
                            <td className="border border-zinc-300 p-1 text-center font-mono font-bold text-zinc-700">{p.memberId}</td>
                            <td className="border border-zinc-300 p-1 font-bold text-zinc-900">{p.memberName}</td>
                            <td className="border border-zinc-300 p-1 text-zinc-800">{p.trainerName}</td>
                            <td className="border border-zinc-300 p-1 text-zinc-800">{p.packageName}</td>
                            <td className="border border-zinc-300 p-1 text-center font-bold">{p.totalSessions}</td>
                            <td className="border border-zinc-300 p-1 text-center font-bold text-emerald-700">{p.completedSessions}</td>
                            <td className="border border-zinc-300 p-1 text-center font-bold text-amber-700">
                              {Math.max(0, p.totalSessions - p.completedSessions)}
                            </td>
                            <td className="border border-zinc-300 p-1 text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[8.5pt] font-bold ${
                                  p.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'Completed' || p.status === 'COMPLETED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="border border-zinc-300 p-1 text-center text-zinc-600 font-mono text-[8.5pt]">{p.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 6. CATATAN AUDIT */}
                <div className="border border-zinc-200 bg-zinc-50/80 p-3 rounded text-[9.5pt] text-zinc-600 space-y-1 mb-6">
                  <p className="font-bold text-zinc-800">Ketentuan Validasi Data:</p>
                  <p>1. <strong>Member Dibina (Unique Member ID)</strong>: Member yang mengambil lebih dari 1 paket latihan dihitung sebagai 1 entitas member unik binaan.</p>
                  <p>2. <strong>Sesi Selesai (Completed)</strong>: Dihitung secara otomatis dari jadwal latihan tuntas yang telah divalidasi 3 pihak (Staf Front Desk, Personal Trainer, dan Member).</p>
                  <p>3. <strong>Sisa Sesi</strong>: Merupakan kuota hak latihan member yang masih aktif dan dapat dijadwalkan.</p>
                </div>

                {/* 7. LEMBAR TANDA TANGAN & PENGESAHAN 3 PIHAK */}
                {includeSignatures && (
                  <div className="pt-2">
                    <div className="grid grid-cols-3 gap-6 text-center text-[10.5pt]">
                      <div>
                        <p className="text-zinc-500 text-[9.5pt]">Disiapkan Oleh,</p>
                        <p className="font-bold text-zinc-800 mt-0.5">Leader Personal Trainer</p>
                        <div className="mt-14 border-t border-zinc-400 pt-1.5 font-bold text-zinc-950">
                          {currentUser?.name || 'Citra Lestari'}
                        </div>
                        <p className="text-[9pt] text-zinc-500 font-mono">ID: {currentUser?.id || 'S03'}</p>
                      </div>

                      <div>
                        <p className="text-zinc-500 text-[9.5pt]">Diverifikasi Oleh,</p>
                        <p className="font-bold text-zinc-800 mt-0.5">Operational / HR Lead</p>
                        <div className="mt-14 border-t border-zinc-400 pt-1.5 font-bold text-zinc-950">
                          Budi Santoso
                        </div>
                        <p className="text-[9pt] text-zinc-500 font-mono">ID: S02</p>
                      </div>

                      <div>
                        <p className="text-zinc-500 text-[9.5pt]">Mengetahui & Menyetujui,</p>
                        <p className="font-bold text-zinc-800 mt-0.5">General Manager RFA GYM</p>
                        <div className="mt-14 border-t border-zinc-400 pt-1.5 font-bold text-zinc-950">
                          dr. Rian Farhan, Sp.KO
                        </div>
                        <p className="text-[9pt] text-zinc-500 font-mono">NIP: RFA-GM-001</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-wrap justify-between items-center gap-3 no-print shrink-0">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-400" />
                <span>Tekan <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-zinc-300">Ctrl+P</kbd> atau klik tombol <strong>Cetak / PDF</strong> di atas untuk memproses.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
                >
                  Tutup Pratinjau
                </button>
                <button
                  onClick={handlePrintDirect}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs font-black text-zinc-950 transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

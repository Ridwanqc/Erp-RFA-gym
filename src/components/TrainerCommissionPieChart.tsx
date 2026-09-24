import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import {
  Crown,
  Award,
  TrendingUp,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  Sparkles,
  Percent,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { User, TrainerCommissionRecord, Schedule } from '../types';
import { formatRp, APP_TODAY } from '../utils/formatters';

interface TrainerCommissionPieChartProps {
  trainers: User[];
  trainerCommissions: TrainerCommissionRecord[];
  schedules?: Schedule[];
  onSelectTrainer?: (trainerId: string) => void;
  className?: string;
}

// Distinct, vibrant color palette tailored for dark UI theme
const TRAINER_COLORS = [
  '#f97316', // Orange
  '#10b981', // Emerald
  '#3b82f6', // Sky Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink / Rose
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#6366f1'  // Indigo
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const TrainerCommissionPieChart: React.FC<TrainerCommissionPieChartProps> = ({
  trainers,
  trainerCommissions = [],
  schedules = [],
  onSelectTrainer,
  className = ''
}) => {
  // Determine current active month from APP_TODAY (e.g. "2026-09")
  const currentMonthKey = useMemo(() => {
    return (APP_TODAY || new Date().toISOString().split('T')[0]).slice(0, 7);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LUNAS' | 'PENDING'>('ALL');

  // Month navigation options (current month + 5 months prior + 1 month future)
  const availableMonths = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const [yearStr, monthStr] = currentMonthKey.split('-');
    const currentYear = parseInt(yearStr, 10);
    const currentMonth = parseInt(monthStr, 10) - 1; // 0-indexed

    // Past 5 months to next 1 month
    for (let i = -5; i <= 1; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const isCurrent = key === currentMonthKey;
      list.push({
        key,
        label: `${MONTH_NAMES[d.getMonth()]} ${y}${isCurrent ? ' (Bulan Ini)' : ''}`
      });
    }
    return list;
  }, [currentMonthKey]);

  // Handle previous/next month click
  const handleShiftMonth = (offset: number) => {
    const [yStr, mStr] = selectedMonth.split('-');
    const d = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1 + offset, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  // ---------------------------------------------------------------------------
  // COMMISSION AGGREGATION PER TRAINER IN SELECTED MONTH
  // ---------------------------------------------------------------------------
  const {
    chartData,
    totalMonthlyCommission,
    topTrainer,
    averageCommission,
    totalSessionsCompleted,
    hasData
  } = useMemo(() => {
    // 1. Filter raw commission records for selected month
    const monthCommissions = trainerCommissions.filter((c) => {
      const matchesMonth = (c.date || '').startsWith(selectedMonth);
      if (!matchesMonth) return false;
      if (statusFilter === 'LUNAS') {
        return c.paymentStatus === 'LUNAS';
      }
      if (statusFilter === 'PENDING') {
        return c.paymentStatus !== 'LUNAS';
      }
      return true;
    });

    // 2. Aggregate per trainer
    const trainerMap = new Map<
      string,
      {
        id: string;
        name: string;
        photo?: string;
        roleName?: string;
        totalCommission: number;
        transactionCount: number;
        completedSessions: number;
        records: TrainerCommissionRecord[];
      }
    >();

    // Seed all active trainers in the pool
    trainers.forEach((t) => {
      trainerMap.set(t.id, {
        id: t.id,
        name: t.name,
        photo: t.photo,
        roleName: t.roleName || (t.role === 'leader_pt' ? 'Leader PT' : 'Pelatih PT'),
        totalCommission: 0,
        transactionCount: 0,
        completedSessions: 0,
        records: []
      });
    });

    // Accumulate commissions from records
    monthCommissions.forEach((rec) => {
      // Find matching trainer by ID or by Name
      let matchedTrainer = trainers.find((t) => t.id === rec.trainerId || t.name.toLowerCase() === (rec.trainerName || '').toLowerCase());
      const trainerKey = matchedTrainer ? matchedTrainer.id : rec.trainerId || rec.trainerName;

      if (!trainerMap.has(trainerKey)) {
        trainerMap.set(trainerKey, {
          id: rec.trainerId || trainerKey,
          name: rec.trainerName || 'Trainer PT',
          roleName: 'Pelatih PT',
          totalCommission: 0,
          transactionCount: 0,
          completedSessions: 0,
          records: []
        });
      }

      const item = trainerMap.get(trainerKey)!;
      item.totalCommission += (rec.commissionAmount || 0);
      item.transactionCount += 1;
      item.records.push(rec);
    });

    // Also count completed schedules in this month
    const monthSchedules = schedules.filter((s) => (s.date || '').startsWith(selectedMonth) && s.status === 'Selesai');
    monthSchedules.forEach((s) => {
      const matchedTrainer = trainers.find((t) => t.name.toLowerCase() === (s.trainer || '').toLowerCase());
      if (matchedTrainer && trainerMap.has(matchedTrainer.id)) {
        trainerMap.get(matchedTrainer.id)!.completedSessions += 1;
      }
    });

    // Total commission in this period
    let grandTotal = 0;
    trainerMap.forEach((val) => {
      grandTotal += val.totalCommission;
    });

    // If grandTotal is 0 but there are completed schedules in that month, synthesize standard fee (Rp 40.000/sesi)
    if (grandTotal === 0 && monthSchedules.length > 0) {
      monthSchedules.forEach((s) => {
        const matchedTrainer = trainers.find((t) => t.name.toLowerCase() === (s.trainer || '').toLowerCase());
        if (matchedTrainer && trainerMap.has(matchedTrainer.id)) {
          const item = trainerMap.get(matchedTrainer.id)!;
          item.totalCommission += 40000;
          item.transactionCount += 1;
          grandTotal += 40000;
        }
      });
    }

    // Convert map to sorted array (highest commission first)
    const list = Array.from(trainerMap.values())
      .filter((t) => t.totalCommission > 0 || trainers.some((orig) => orig.id === t.id))
      .sort((a, b) => b.totalCommission - a.totalCommission);

    // Prepare chart data items with colors and percentages
    const dataWithColors = list.map((item, index) => {
      const percentage = grandTotal > 0 ? (item.totalCommission / grandTotal) * 100 : 0;
      return {
        ...item,
        value: item.totalCommission,
        percentage: Number(percentage.toFixed(1)),
        color: TRAINER_COLORS[index % TRAINER_COLORS.length]
      };
    });

    const activeTrainersWithCommission = dataWithColors.filter((d) => d.totalCommission > 0);
    const top = activeTrainersWithCommission[0] || null;
    const avg = activeTrainersWithCommission.length > 0
      ? Math.round(grandTotal / activeTrainersWithCommission.length)
      : 0;
    const totalSessions = list.reduce((acc, curr) => acc + curr.completedSessions, 0);

    return {
      chartData: dataWithColors,
      totalMonthlyCommission: grandTotal,
      topTrainer: top,
      averageCommission: avg,
      totalSessionsCompleted: totalSessions,
      hasData: grandTotal > 0
    };
  }, [trainerCommissions, trainers, schedules, selectedMonth, statusFilter]);

  // Format month title label
  const formattedSelectedMonth = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const mIdx = parseInt(mStr, 10) - 1;
    return `${MONTH_NAMES[mIdx]} ${yStr}`;
  }, [selectedMonth]);

  // Active highlighted slice item
  const activeSliceItem = activeHoverIndex !== null ? chartData[activeHoverIndex] : null;

  return (
    <div className={`bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-6 ${className}`}>
      {/* ------------------------------------------------------------------ */}
      {/* HEADER & MONTH PERIOD SELECTOR CONTROLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-400 rounded-xl border border-orange-500/30">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Distribusi Komisi Trainer Bulanan
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 uppercase font-black">
                  Pie Chart
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Perbandingan perolehan total komisi yang dihasilkan tiap personal trainer dalam satu periode bulan.
              </p>
            </div>
          </div>
        </div>

        {/* Period Navigation & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LUNAS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                statusFilter === 'LUNAS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lunas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Month Selector with Prev/Next buttons */}
          <div className="flex items-center bg-zinc-950 rounded-xl border border-zinc-800 p-1">
            <button
              type="button"
              onClick={() => handleShiftMonth(-1)}
              title="Bulan Sebelumnya"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex items-center px-1">
              <Calendar className="w-3.5 h-3.5 text-orange-400 mr-1.5 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-zinc-900 text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleShiftMonth(1)}
              title="Bulan Berikutnya"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI METRIC CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Komisi Bulan Ini */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-orange-500/30 transition">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span className="font-semibold text-zinc-400 flex items-center gap-1.5 text-[11px]">
              <DollarSign className="w-3.5 h-3.5 text-orange-400" /> Total Komisi Tim
            </span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">{formattedSelectedMonth}</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
            {formatRp(totalMonthlyCommission)}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{chartData.filter((d) => d.totalCommission > 0).length} Trainer Produktif</span>
          </div>
        </div>

        {/* Card 2: Top Earner Trainer */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span className="font-semibold text-zinc-400 flex items-center gap-1.5 text-[11px]">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Top Performer
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
              Rank #1
            </span>
          </div>
          <div className="text-sm sm:text-base font-black text-amber-300 truncate mt-1">
            {topTrainer ? topTrainer.name : '-'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>{topTrainer ? formatRp(topTrainer.totalCommission) : 'Rp 0'}</span>
            <span className="font-bold text-amber-400">
              {topTrainer ? `${topTrainer.percentage}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: Rata-rata Komisi */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-sky-500/30 transition">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span className="font-semibold text-zinc-400 flex items-center gap-1.5 text-[11px]">
              <Percent className="w-3.5 h-3.5 text-sky-400" /> Rata-Rata Komisi
            </span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Per Trainer</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-sky-400 tracking-tight mt-1">
            {formatRp(averageCommission)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            Basis {chartData.filter((d) => d.totalCommission > 0).length || trainers.length} pelatih
          </div>
        </div>

        {/* Card 4: Total Sesi Terlaksana */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span className="font-semibold text-zinc-400 flex items-center gap-1.5 text-[11px]">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> Sesi Selesai
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
              Bulan Ini
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight mt-1">
            {totalSessionsCompleted} Sesi
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            Pendampingan member verified
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN VISUALIZATION: PIE CHART + INTERACTIVE LEADERBOARD */}
      {/* ------------------------------------------------------------------ */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Interactive Recharts Pie Chart (7 Cols) */}
          <div className="lg:col-span-6 bg-zinc-950/70 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 relative flex flex-col items-center justify-center min-h-[340px]">
            {/* Chart Subtitle / Badge */}
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Porsi Komisi Tiap Trainer
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Periode: {formattedSelectedMonth}
              </span>
            </div>

            {/* Recharts Pie Graphic */}
            <div className="h-64 sm:h-72 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter((d) => d.totalCommission > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={98}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveHoverIndex(index)}
                    onMouseLeave={() => setActiveHoverIndex(null)}
                    onClick={(data: any) => {
                      const trainerId = data?.payload?.id || data?.id;
                      if (onSelectTrainer && trainerId) {
                        onSelectTrainer(trainerId);
                      }
                    }}
                  >
                    {chartData
                      .filter((d) => d.totalCommission > 0)
                      .map((entry, index) => {
                        const isHovered = activeHoverIndex === index;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={isHovered ? '#ffffff' : '#18181b'}
                            strokeWidth={isHovered ? 2.5 : 1}
                            style={{
                              cursor: 'pointer',
                              filter: isHovered ? 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.4))' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                        );
                      })}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-950/95 border border-zinc-700/80 rounded-xl p-3 shadow-2xl text-xs backdrop-blur-md min-w-[200px] animate-in fade-in-50 zoom-in-95">
                            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: data.color }}
                              />
                              <div className="truncate">
                                <span className="font-bold text-white block text-[13px] leading-tight truncate">
                                  {data.name}
                                </span>
                                <span className="text-[10px] text-zinc-400 block">
                                  {data.roleName || 'Pelatih PT'}
                                </span>
                              </div>
                            </div>
                            <div className="pt-2 space-y-1 text-[11px]">
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Total Komisi:</span>
                                <strong className="text-orange-400 font-black">
                                  {formatRp(data.value)}
                                </strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Porsi Tim:</span>
                                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                  {data.percentage}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Transaksi/Sesi:</span>
                                <span className="text-zinc-300 font-medium">
                                  {data.transactionCount} catatan
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat / Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {activeSliceItem ? (
                  <div className="text-center px-4 animate-in fade-in zoom-in-90 duration-150">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold truncate max-w-[120px]">
                      {activeSliceItem.name}
                    </span>
                    <span className="text-sm sm:text-base font-black text-orange-400 block leading-tight mt-0.5">
                      {formatRp(activeSliceItem.totalCommission)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 block mt-0.5">
                      {activeSliceItem.percentage}% dari total
                    </span>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Total Komisi
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
                      {formatRp(totalMonthlyCommission)}
                    </span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">
                      {chartData.filter((d) => d.totalCommission > 0).length} Trainer
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Helper */}
            <p className="text-[10px] text-zinc-500 text-center mt-1 italic">
              💡 Arahkan kursor atau klik potongan diagram untuk melihat rincian komisi tiap trainer.
            </p>
          </div>

          {/* Right: Detailed Breakdown & Leaderboard Table (5 Cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                Peringkat & Rincian Trainer ({formattedSelectedMonth})
              </h4>
              <span className="text-[10px] text-zinc-500">Urut berdasarkan nominal tertinggi</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {chartData.map((item, idx) => {
                const isHovered = activeHoverIndex === idx;
                const isTop1 = idx === 0 && item.totalCommission > 0;
                const isTop2 = idx === 1 && item.totalCommission > 0;
                const isTop3 = idx === 2 && item.totalCommission > 0;

                return (
                  <div
                    key={item.id || idx}
                    onMouseEnter={() => setActiveHoverIndex(idx)}
                    onMouseLeave={() => setActiveHoverIndex(null)}
                    onClick={() => onSelectTrainer && onSelectTrainer(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-zinc-800/90 border-orange-500/60 shadow-lg scale-[1.01]'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Rank & Avatar & Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-black text-xs">
                          {isTop1 ? (
                            <span title="Juara 1 Komisi" className="text-amber-400 text-sm">🥇</span>
                          ) : isTop2 ? (
                            <span title="Juara 2 Komisi" className="text-zinc-300 text-sm">🥈</span>
                          ) : isTop3 ? (
                            <span title="Juara 3 Komisi" className="text-amber-600 text-sm">🥉</span>
                          ) : (
                            <span className="text-zinc-500 text-[10px] font-bold">#{idx + 1}</span>
                          )}
                        </div>

                        {/* Color swatch dot */}
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        />

                        {/* Photo or Initials */}
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.name}
                            className="w-8 h-8 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {item.name.charAt(0)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block truncate leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {item.roleName}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount & Percentage */}
                      <div className="text-right shrink-0">
                        <span className="font-black text-xs text-orange-400 block leading-tight">
                          {formatRp(item.totalCommission)}
                        </span>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            {item.percentage}%
                          </span>
                          {item.completedSessions > 0 && (
                            <span className="text-[9px] text-zinc-400">
                              ({item.completedSessions} sesi)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Proportion */}
                    <div className="mt-2.5 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-zinc-950/60 border border-dashed border-zinc-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 mx-auto flex items-center justify-center">
            <PieIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Tidak Ada Catatan Komisi di {formattedSelectedMonth}
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Belum ada transaksi paket PT atau sesi yang menghasilkan komisi pelatih pada periode ini dengan filter terpilih.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(currentMonthKey);
              setStatusFilter('ALL');
            }}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Kembali ke Bulan Berjalan (September 2026)
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* INSIGHT & COACHING TIP FOR LEADER PT */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
        <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-zinc-200 block text-[11px]">
            💡 Insight Leader PT untuk Evaluasi Kinerja Tim:
          </span>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {topTrainer ? (
              <>
                <strong className="text-amber-300">{topTrainer.name}</strong> menghasilkan kontribusi tertinggi sebesar{' '}
                <strong className="text-white">{topTrainer.percentage}%</strong> ({formatRp(topTrainer.totalCommission)}) dari total komisi tim bulan ini.
                Gunakan visualisasi ini dalam sesi 1-on-1 mingguan untuk memotivasi trainer lain dan memonitor pemerataan jadwal bimbingan member.
              </>
            ) : (
              'Gunakan data visual diagram pai ini untuk memonitor pembagian komisi dan memastikan beban bimbingan member terdistribusi merata di antara seluruh staf pelatih.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

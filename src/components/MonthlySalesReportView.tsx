import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Printer,
  ShoppingBag,
  Dumbbell,
  Crown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  CheckCircle2,
  RefreshCw,
  PieChart as PieIcon,
  CreditCard,
  FileSpreadsheet,
  Building2,
  Users
} from 'lucide-react';
import { Transaction } from '../types';
import { formatRp, APP_TODAY, formatDateIndo } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';
import { TransactionActions } from './transaction/TransactionActions';

interface MonthlySalesReportViewProps {
  transactions: Transaction[];
  onReprintReceipt?: (trx: Transaction) => void;
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MonthlySalesReportView: React.FC<MonthlySalesReportViewProps> = ({
  transactions,
  onReprintReceipt,
  showToast
}) => {
  // Period filter states
  const currentYear = useMemo(() => {
    return APP_TODAY ? APP_TODAY.split('-')[0] : '2026';
  }, []);

  const currentMonthNum = useMemo(() => {
    return APP_TODAY ? APP_TODAY.split('-')[1] : '09';
  }, []);

  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or '01'..'12'
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Membership' | 'PT' | 'POS' | 'Bundling'>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [chartType, setChartType] = useState<'stacked' | 'grouped'>('stacked');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'transactions'>('overview');

  const monthNames = [
    { num: '01', name: 'Januari', short: 'Jan' },
    { num: '02', name: 'Februari', short: 'Feb' },
    { num: '03', name: 'Maret', short: 'Mar' },
    { num: '04', name: 'April', short: 'Apr' },
    { num: '05', name: 'Mei', short: 'Mei' },
    { num: '06', name: 'Juni', short: 'Jun' },
    { num: '07', name: 'Juli', short: 'Jul' },
    { num: '08', name: 'Agustus', short: 'Agu' },
    { num: '09', name: 'September', short: 'Sep' },
    { num: '10', name: 'Oktober', short: 'Okt' },
    { num: '11', name: 'November', short: 'Nov' },
    { num: '12', name: 'Desember', short: 'Des' }
  ];

  // Helper: Categorize transaction
  const getTrxCategory = (trx: Transaction): 'Membership' | 'PT' | 'POS' | 'Bundling' => {
    if (trx.type === 'Bundling' || (trx.desc && trx.desc.toLowerCase().includes('bundling'))) {
      return 'Bundling';
    }
    if (trx.type === 'Membership' || (trx.desc && (trx.desc.toLowerCase().includes('membership') || trx.desc.toLowerCase().includes('visit')))) {
      return 'Membership';
    }
    if (trx.type === 'PT' || (trx.desc && (trx.desc.toLowerCase().includes('pt') || trx.desc.toLowerCase().includes('personal trainer')))) {
      return 'PT';
    }
    if (trx.type === 'Pelunasan Cicilan') {
      const lower = (trx.desc || '').toLowerCase();
      if (lower.includes('pt')) return 'PT';
      if (lower.includes('pos') || lower.includes('produk')) return 'POS';
      return 'Membership';
    }
    return 'POS';
  };

  // Helper: Inflow amount
  const getTrxInflow = (trx: Transaction): number => {
    if (trx.status === 'VOID') return 0;
    if (trx.initialCashPaid !== undefined && trx.initialCashPaid > 0) {
      return trx.initialCashPaid;
    }
    if (trx.amountPaid !== undefined && trx.amountPaid > 0) {
      return trx.amountPaid;
    }
    return trx.amount || 0;
  };

  // Filter transactions
  const validTransactions = useMemo(() => {
    return transactions.filter((t) => t.status !== 'VOID');
  }, [transactions]);

  // Year filtered transactions
  const yearTransactions = useMemo(() => {
    return validTransactions.filter((t) => t.date && t.date.startsWith(selectedYear));
  }, [validTransactions, selectedYear]);

  // Selected period transactions (filtered by year, month, category, payment method, search)
  const filteredTransactions = useMemo(() => {
    return yearTransactions.filter((t) => {
      // Month filter
      if (selectedMonth !== 'ALL') {
        const tMonth = t.date.split('-')[1];
        if (tMonth !== selectedMonth) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        const cat = getTrxCategory(t);
        if (cat !== categoryFilter) return false;
      }

      // Payment method filter
      if (methodFilter !== 'ALL') {
        if (!t.method || !t.method.toLowerCase().includes(methodFilter.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCust = (t.customer || '').toLowerCase().includes(q);
        const matchId = (t.id || '').toLowerCase().includes(q);
        const matchDesc = (t.desc || '').toLowerCase().includes(q);
        const matchCashier = (t.cashier || '').toLowerCase().includes(q);
        if (!matchCust && !matchId && !matchDesc && !matchCashier) return false;
      }

      return true;
    });
  }, [yearTransactions, selectedMonth, categoryFilter, methodFilter, searchQuery]);

  // 1. KPI Aggregates for the selected period
  const kpiData = useMemo(() => {
    let totalRevenue = 0;
    let membershipRevenue = 0;
    let ptRevenue = 0;
    let posRevenue = 0;
    let bundlingRevenue = 0;
    let totalProfit = 0;
    let totalTrxCount = filteredTransactions.length;

    filteredTransactions.forEach((trx) => {
      const inflow = getTrxInflow(trx);
      const cat = getTrxCategory(trx);

      totalRevenue += inflow;
      if (cat === 'Membership') membershipRevenue += inflow;
      else if (cat === 'PT') ptRevenue += inflow;
      else if (cat === 'POS') posRevenue += inflow;
      else if (cat === 'Bundling') bundlingRevenue += inflow;

      // Profit calculation
      if (trx.profit !== undefined) {
        totalProfit += trx.profit;
      } else if (cat === 'POS') {
        totalProfit += inflow * 0.35; // default 35% margin for POS
      } else {
        totalProfit += inflow * 0.75; // default 75% margin for service
      }
    });

    const averageOrderValue = totalTrxCount > 0 ? Math.round(totalRevenue / totalTrxCount) : 0;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

    return {
      totalRevenue,
      membershipRevenue,
      ptRevenue,
      posRevenue,
      bundlingRevenue,
      totalProfit,
      totalTrxCount,
      averageOrderValue,
      profitMargin
    };
  }, [filteredTransactions]);

  // 2. Monthly Trend Data (12 Months of the selected year) for Recharts Bar Chart
  const monthlyChartData = useMemo(() => {
    return monthNames.map((m) => {
      const monthPrefix = `${selectedYear}-${m.num}`;
      const monthTrx = yearTransactions.filter((t) => t.date && t.date.startsWith(monthPrefix));

      let membership = 0;
      let pt = 0;
      let pos = 0;
      let bundling = 0;
      let total = 0;

      monthTrx.forEach((trx) => {
        const inflow = getTrxInflow(trx);
        const cat = getTrxCategory(trx);

        total += inflow;
        if (cat === 'Membership') membership += inflow;
        else if (cat === 'PT') pt += inflow;
        else if (cat === 'POS') pos += inflow;
        else if (cat === 'Bundling') bundling += inflow;
      });

      return {
        month: m.short,
        fullMonth: m.name,
        monthNum: m.num,
        Membership: membership,
        PT: pt,
        POS: pos,
        Bundling: bundling,
        Total: total,
        trxCount: monthTrx.length
      };
    });
  }, [yearTransactions, selectedYear]);

  // 3. Daily / Weekly Breakdown Data if a specific month is selected
  const detailedPeriodChartData = useMemo(() => {
    if (selectedMonth === 'ALL') return null;

    // Group by days in the month
    const daysInMonth = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
    const dayData: any[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${selectedYear}-${selectedMonth}-${dayStr}`;
      const dayTrx = yearTransactions.filter((t) => t.date === dateKey);

      let membership = 0;
      let pt = 0;
      let pos = 0;
      let bundling = 0;
      let total = 0;

      dayTrx.forEach((trx) => {
        const inflow = getTrxInflow(trx);
        const cat = getTrxCategory(trx);

        total += inflow;
        if (cat === 'Membership') membership += inflow;
        else if (cat === 'PT') pt += inflow;
        else if (cat === 'POS') pos += inflow;
        else if (cat === 'Bundling') bundling += inflow;
      });

      dayData.push({
        day: `Tgl ${day}`,
        date: dateKey,
        Membership: membership,
        PT: pt,
        POS: pos,
        Bundling: bundling,
        Total: total,
        trxCount: dayTrx.length
      });
    }

    return dayData;
  }, [selectedMonth, selectedYear, yearTransactions]);

  // 4. Category Pie Composition Data
  const categoryPieData = useMemo(() => {
    const list = [
      { name: 'Membership', value: kpiData.membershipRevenue, color: '#f97316' }, // Orange
      { name: 'Personal Trainer (PT)', value: kpiData.ptRevenue, color: '#a855f7' }, // Purple
      { name: 'POS & Suplemen', value: kpiData.posRevenue, color: '#10b981' }, // Emerald
      { name: 'Paket Bundling', value: kpiData.bundlingRevenue, color: '#38bdf8' } // Sky
    ];
    return list.filter((item) => item.value > 0);
  }, [kpiData]);

  // 5. Payment Method Breakdown Data
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};

    filteredTransactions.forEach((trx) => {
      const inflow = getTrxInflow(trx);
      let m = trx.method || 'Tunai';
      if (m.toLowerCase().includes('qris')) m = 'QRIS';
      else if (m.toLowerCase().includes('mandiri')) m = 'Transfer Mandiri';
      else if (m.toLowerCase().includes('artha')) m = 'Transfer Artha Graha';
      else if (m.toLowerCase().includes('transfer')) m = 'Transfer Bank';
      else if (m.toLowerCase().includes('edc')) m = 'EDC / Debit';
      else if (m.toLowerCase().includes('tunai') || m.toLowerCase().includes('cash')) m = 'Tunai';

      map[m] = (map[m] || 0) + inflow;
    });

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#64748b'];
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [filteredTransactions]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    const periodLabel = selectedMonth === 'ALL'
      ? `Tahun_${selectedYear}`
      : `Bulan_${selectedMonth}_${selectedYear}`;

    const lines: string[] = [];
    lines.push('--- LAPORAN PENJUALAN BULANAN RFA GYM ---');
    lines.push(`Periode,${selectedMonth === 'ALL' ? 'Januari - Desember ' + selectedYear : monthNames.find(m => m.num === selectedMonth)?.name + ' ' + selectedYear}`);
    lines.push(`Tanggal Export,${APP_TODAY}`);
    lines.push('');

    // Summary Section
    lines.push('--- I. RINGKASAN PENJUALAN ---');
    lines.push('Kategori,Nominal Penjualan (Rp),Persentase');
    lines.push(`Total Omset Penjualan,${kpiData.totalRevenue},100%`);
    lines.push(`Membership,${kpiData.membershipRevenue},${kpiData.totalRevenue > 0 ? ((kpiData.membershipRevenue / kpiData.totalRevenue) * 100).toFixed(1) : 0}%`);
    lines.push(`Personal Trainer (PT),${kpiData.ptRevenue},${kpiData.totalRevenue > 0 ? ((kpiData.ptRevenue / kpiData.totalRevenue) * 100).toFixed(1) : 0}%`);
    lines.push(`POS & Suplemen,${kpiData.posRevenue},${kpiData.totalRevenue > 0 ? ((kpiData.posRevenue / kpiData.totalRevenue) * 100).toFixed(1) : 0}%`);
    lines.push(`Paket Bundling,${kpiData.bundlingRevenue},${kpiData.totalRevenue > 0 ? ((kpiData.bundlingRevenue / kpiData.totalRevenue) * 100).toFixed(1) : 0}%`);
    lines.push(`Estimasi Laba Kotor,${kpiData.totalProfit},Margin ${kpiData.profitMargin}%`);
    lines.push(`Total Transaksi,${kpiData.totalTrxCount},Rata-rata ${kpiData.averageOrderValue}`);
    lines.push('');

    // Monthly Recap
    lines.push('--- II. REKAPITULASI PENJUALAN BULANAN (TAHUN ' + selectedYear + ') ---');
    lines.push('Bulan,Membership (Rp),PT (Rp),POS Produk (Rp),Bundling (Rp),Total Omset (Rp),Jumlah Trx');
    monthlyChartData.forEach((row) => {
      lines.push(`${row.fullMonth},${row.Membership},${row.PT},${row.POS},${row.Bundling},${row.Total},${row.trxCount}`);
    });
    lines.push('');

    // Transaction Details
    lines.push('--- III. DETAIL TRANSAKSI PENJUALAN ---');
    lines.push('ID Transaksi,Tanggal,Pelanggan,Kategori,Deskripsi,Metode Bayar,Nominal (Rp),Status,Kasir');
    filteredTransactions.forEach((trx) => {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      lines.push([
        escape(trx.id),
        escape(trx.date),
        escape(trx.customer),
        escape(getTrxCategory(trx)),
        escape(trx.desc),
        escape(trx.method),
        getTrxInflow(trx),
        escape(trx.status),
        escape(trx.cashier)
      ].join(','));
    });

    const csvString = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Penjualan_${periodLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) {
      showToast('Export Berhasil', `Laporan penjualan ${periodLabel} berhasil diunduh.`, 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Laporan Penjualan Bulanan & Analitik Tren</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    TAHUN {selectedYear}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Visualisasi grafik tren omset Membership, Personal Trainer (PT), Produk POS, dan Komposisi Revenue
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition flex items-center gap-2 cursor-pointer border border-zinc-700"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-5 pt-5 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Year Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Tahun Penjualan</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Bulan (1 Tahun)</option>
              {monthNames.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Lini Bisnis / Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Membership">Membership Gym</option>
              <option value="PT">Personal Trainer (PT)</option>
              <option value="POS">POS Produk & Suplemen</option>
              <option value="Bundling">Paket Bundling</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Metode Bayar</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Metode</option>
              <option value="Tunai">Tunai / Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="Mandiri">Transfer Mandiri</option>
              <option value="Artha">Transfer Artha Graha</option>
              <option value="EDC">EDC / Debit</option>
            </select>
          </div>

          {/* Search box */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Cari Transaksi</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pelanggan, ID, kasir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Omset */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono uppercase font-bold text-[10px] tracking-wider text-orange-400">Total Omset Penjualan</span>
            <DollarSign className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            {formatRp(kpiData.totalRevenue)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
            <span className="font-bold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> {kpiData.totalTrxCount} Trx Sukses
            </span>
            <span>•</span>
            <span className="truncate">Avg {formatRp(kpiData.averageOrderValue)}</span>
          </div>
        </div>

        {/* Membership Revenue */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/20 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono uppercase font-bold text-[10px] tracking-wider text-amber-400">Membership Gym</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 tracking-tight">
            {formatRp(kpiData.membershipRevenue)}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-400">
            <span>Kontribusi</span>
            <span className="font-bold text-amber-300">
              {kpiData.totalRevenue > 0 ? ((kpiData.membershipRevenue / kpiData.totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* PT Revenue */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-purple-500/20 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono uppercase font-bold text-[10px] tracking-wider text-purple-400">Personal Trainer (PT)</span>
            <Dumbbell className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-2 tracking-tight">
            {formatRp(kpiData.ptRevenue)}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-400">
            <span>Kontribusi</span>
            <span className="font-bold text-purple-300">
              {kpiData.totalRevenue > 0 ? ((kpiData.ptRevenue / kpiData.totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* POS Produk Revenue */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/20 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono uppercase font-bold text-[10px] tracking-wider text-emerald-400">POS Produk & Suplemen</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 tracking-tight">
            {formatRp(kpiData.posRevenue)}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-400">
            <span>Kontribusi</span>
            <span className="font-bold text-emerald-300">
              {kpiData.totalRevenue > 0 ? ((kpiData.posRevenue / kpiData.totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Visualizations Section: Bar Chart & Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Monthly Revenue Bar Chart (Recharts) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <span>
                  {selectedMonth === 'ALL'
                    ? `Grafik Batang Tren Penjualan Bulanan (Jan - Des ${selectedYear})`
                    : `Grafik Batang Penjualan Harian Bulan ${monthNames.find((m) => m.num === selectedMonth)?.name} ${selectedYear}`}
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Perbandingan nominal pendapatan Membership, Personal Trainer, dan Penjualan Produk
              </p>
            </div>

            {/* Chart Style Switcher */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartType('stacked')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  chartType === 'stacked'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Bertumpuk (Stacked)
              </button>
              <button
                type="button"
                onClick={() => setChartType('grouped')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  chartType === 'grouped'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Berdampingan (Grouped)
              </button>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={selectedMonth === 'ALL' ? monthlyChartData : detailedPeriodChartData || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey={selectedMonth === 'ALL' ? 'month' : 'day'}
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}Rb`;
                    return val;
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const totalVal = payload.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
                      return (
                        <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[200px]">
                          <div className="font-bold text-white border-b border-zinc-800 pb-1.5 flex justify-between">
                            <span>{label}</span>
                            <span className="font-mono text-orange-400">{formatRp(totalVal)}</span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((entry, index) => (
                              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5 text-zinc-400">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span>{entry.name}:</span>
                                </span>
                                <span className="font-mono font-bold text-zinc-200">
                                  {formatRp(Number(entry.value) || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 12, fontSize: '11px' }}
                />
                <Bar
                  dataKey="Membership"
                  fill="#f97316"
                  stackId={chartType === 'stacked' ? 'a' : undefined}
                  radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar
                  dataKey="PT"
                  name="Personal Trainer"
                  fill="#a855f7"
                  stackId={chartType === 'stacked' ? 'a' : undefined}
                  radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar
                  dataKey="POS"
                  name="Produk & Suplemen"
                  fill="#10b981"
                  stackId={chartType === 'stacked' ? 'a' : undefined}
                  radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Bundling"
                  name="Paket Bundling"
                  fill="#38bdf8"
                  stackId={chartType === 'stacked' ? 'a' : undefined}
                  radius={chartType === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex flex-wrap items-center justify-between gap-2">
            <span>* Data dihitung berdasarkan arus kas masuk aktual (tanpa double count cicilan).</span>
            <span className="font-mono text-zinc-400">Total Periode: {formatRp(kpiData.totalRevenue)}</span>
          </div>
        </div>

        {/* Right Column: Category & Payment Share Charts */}
        <div className="space-y-6">
          {/* Category Composition Donut */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <PieIcon className="w-4 h-4 text-orange-400" />
              <span>Komposisi Penjualan per Kategori</span>
            </h4>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', fontSize: '11px' }}
                    formatter={(value: any) => [formatRp(Number(value) || 0), 'Nominal']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend breakdown list */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-xs">
              {categoryPieData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-zinc-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="truncate text-zinc-400 text-[11px]">{cat.name}</span>
                  </div>
                  <div className="font-mono font-bold text-[11px] text-white">
                    {formatRp(cat.value)}
                    <span className="text-[10px] text-zinc-500 font-normal ml-1">
                      ({kpiData.totalRevenue > 0 ? ((cat.value / kpiData.totalRevenue) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Breakdown Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Metode Pembayaran Penjualan</span>
            </h4>

            <div className="space-y-2 text-xs">
              {paymentMethodData.map((item, idx) => {
                const pct = kpiData.totalRevenue > 0 ? Math.round((item.value / kpiData.totalRevenue) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-300 font-medium">{item.name}</span>
                      <span className="font-mono text-zinc-400">
                        {formatRp(item.value)} <strong className="text-zinc-200">({pct}%)</strong>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation for Details */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Rekap 12 Bulan ({selectedYear})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Daftar Transaksi Terfilter ({filteredTransactions.length})</span>
        </button>
      </div>

      {/* Tab Content 1: 12-Month Table Recap */}
      {activeTab === 'overview' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-white">Tabel Rekapitulasi Penjualan Bulanan {selectedYear}</h4>
              <p className="text-xs text-zinc-400">Rincian pendapatan kotor, lini bisnis, dan volume transaksi per bulan</p>
            </div>
            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-xl">
              Total {formatRp(kpiData.totalRevenue)}
            </span>
          </div>

          {/* Mobile Swipe Cue */}
          <div className="md:hidden bg-zinc-950/80 border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>Geser tabel ke samping untuk melihat seluruh bulan & omset</span>
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">↔ Scroll</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="py-3 px-4">Bulan</th>
                  <th className="py-3 px-4 text-right">Membership</th>
                  <th className="py-3 px-4 text-right">Personal Trainer</th>
                  <th className="py-3 px-4 text-right">POS Produk</th>
                  <th className="py-3 px-4 text-right">Bundling</th>
                  <th className="py-3 px-4 text-right text-orange-400 font-bold">Total Omset</th>
                  <th className="py-3 px-4 text-center">Vol. Trx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {monthlyChartData.map((row) => (
                  <tr
                    key={row.monthNum}
                    className={`hover:bg-zinc-800/40 transition cursor-pointer ${
                      selectedMonth === row.monthNum ? 'bg-orange-500/10' : ''
                    }`}
                    onClick={() => setSelectedMonth(row.monthNum)}
                  >
                    <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>{row.fullMonth}</span>
                      {selectedMonth === row.monthNum && (
                        <span className="text-[10px] bg-orange-500 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                          DIPILIH
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400">{formatRp(row.Membership)}</td>
                    <td className="py-3 px-4 text-right text-purple-400">{formatRp(row.PT)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{formatRp(row.POS)}</td>
                    <td className="py-3 px-4 text-right text-sky-400">{formatRp(row.Bundling)}</td>
                    <td className="py-3 px-4 text-right font-black text-white">{formatRp(row.Total)}</td>
                    <td className="py-3 px-4 text-center font-sans text-zinc-400">{row.trxCount} Trx</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-950 font-black text-white border-t-2 border-zinc-800 font-mono text-xs">
                <tr>
                  <td className="py-3.5 px-4 font-sans uppercase">TOTAL {selectedYear}</td>
                  <td className="py-3.5 px-4 text-right text-amber-400">{formatRp(kpiData.membershipRevenue)}</td>
                  <td className="py-3.5 px-4 text-right text-purple-400">{formatRp(kpiData.ptRevenue)}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-400">{formatRp(kpiData.posRevenue)}</td>
                  <td className="py-3.5 px-4 text-right text-sky-400">{formatRp(kpiData.bundlingRevenue)}</td>
                  <td className="py-3.5 px-4 text-right text-orange-400 text-sm">{formatRp(kpiData.totalRevenue)}</td>
                  <td className="py-3.5 px-4 text-center font-sans">{kpiData.totalTrxCount} Trx</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Filtered Transactions Detail Table */}
      {activeTab === 'transactions' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-white">Daftar Rincian Transaksi Penjualan</h4>
              <p className="text-xs text-zinc-400">
                Menampilkan {filteredTransactions.length} transaksi sesuai filter yang aktif
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </button>
          </div>

          {/* Mobile Swipe Cue */}
          <div className="md:hidden bg-zinc-950/80 border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>Geser tabel ke samping untuk melihat rincian nota & nominal</span>
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">↔ Scroll</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs min-w-[780px]">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[10px] font-mono sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">No Trx / Tgl</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Kategori & Deskripsi</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-right">Nominal Masuk</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4 text-center">Aksi (Cetak/PDF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                      Tidak ada transaksi penjualan yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trx) => {
                    const cat = getTrxCategory(trx);
                    const inflow = getTrxInflow(trx);

                    return (
                      <tr key={trx.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono text-orange-400 font-bold block">{trx.id}</span>
                          <span className="text-[11px] text-zinc-500">{trx.date} {trx.time}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {trx.customer}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                              cat === 'Membership'
                                ? 'bg-amber-500/20 text-amber-300'
                                : cat === 'PT'
                                ? 'bg-purple-500/20 text-purple-300'
                                : cat === 'Bundling'
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {cat}
                          </span>
                          <p className="text-zinc-300 text-xs truncate" title={trx.desc}>
                            {trx.desc || trx.type}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-zinc-300 font-medium">{trx.method}</span>
                          {trx.bankDest && (
                            <span className="block text-[10px] text-zinc-500">({trx.bankDest})</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white text-xs">
                          {formatRp(inflow)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {trx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-xs">
                          {trx.cashier || '-'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <TransactionActions
                            transaction={trx}
                            onView={onReprintReceipt}
                            onPrint={onReprintReceipt}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

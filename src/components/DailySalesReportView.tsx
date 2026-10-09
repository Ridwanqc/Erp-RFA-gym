import React, { useState, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Dumbbell,
  Crown,
  Filter,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Building2,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  FileText,
  BarChart3,
  PieChart as PieIcon,
  Receipt,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';
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
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, User, ALL_BRANCHES_ID } from '../types';
import { formatRp, APP_TODAY, formatDateIndo, getTimestamp } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';

interface DailySalesReportViewProps {
  transactions: Transaction[];
  currentUser?: User | null;
  onReprintReceipt?: (trx: Transaction) => void;
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onNavigateTab?: (tab: any) => void;
}

export const DailySalesReportView: React.FC<DailySalesReportViewProps> = ({
  transactions,
  currentUser,
  onReprintReceipt,
  showToast
}) => {
  const { branches, activeBranchId, activeBranch } = useSettings();
  const isSuperAdmin = currentUser?.role === 'admin';
  const userBranchId = currentUser?.branchId || activeBranchId;

  // Selected date (Default: APP_TODAY)
  const [selectedDate, setSelectedDate] = useState<string>(APP_TODAY);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(isSuperAdmin ? 'ALL' : userBranchId);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Membership' | 'PT' | 'POS' | 'Bundling' | 'Visit' | 'Lainnya'>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [cashierFilter, setCashierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'DP' | 'VOID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'analytics' | 'cashiers'>('table');

  // Modal Thermal Slip
  const [isThermalSlipOpen, setIsThermalSlipOpen] = useState(false);

  // Quick Date Helpers
  const yesterdayStr = useMemo(() => {
    try {
      const d = new Date(APP_TODAY + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return APP_TODAY;
    }
  }, []);

  const twoDaysAgoStr = useMemo(() => {
    try {
      const d = new Date(APP_TODAY + 'T00:00:00');
      d.setDate(d.getDate() - 2);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return APP_TODAY;
    }
  }, []);

  const handlePrevDay = () => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${day}`);
    } catch {}
  };

  const handleNextDay = () => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${day}`);
    } catch {}
  };

  // Helper: Categorize Transaction
  const getTrxCategory = (trx: Transaction): 'Membership' | 'PT' | 'POS' | 'Bundling' | 'Visit' | 'Lainnya' => {
    const desc = (trx.desc || '').toLowerCase();
    const type = trx.type || '';
    if (type === 'Bundling' || desc.includes('bundling')) return 'Bundling';
    if (type === 'PT' || desc.includes('pt ') || desc.includes('personal trainer')) return 'PT';
    if (type === 'POS' || desc.includes('pos') || desc.includes('suplemen') || desc.includes('minuman')) return 'POS';
    if (desc.includes('visit') || desc.includes('harian') || desc.includes('guest')) return 'Visit';
    if (type === 'Membership' || desc.includes('member') || desc.includes('pass')) return 'Membership';
    return 'Lainnya';
  };

  // Filter Transactions for Selected Date
  const rawDateTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.date !== selectedDate) return false;
      // Branch filter
      if (!isSuperAdmin) {
        const brId = t.branchId || 'BR-001';
        if (brId !== userBranchId) return false;
      } else if (selectedBranchFilter !== 'ALL') {
        const brId = t.branchId || 'BR-001';
        if (brId !== selectedBranchFilter) return false;
      }
      return true;
    });
  }, [transactions, selectedDate, isSuperAdmin, userBranchId, selectedBranchFilter]);

  // Unique cashiers on selected date
  const dateCashiers = useMemo(() => {
    const set = new Set<string>();
    rawDateTransactions.forEach((t) => {
      if (t.cashier) set.add(t.cashier);
    });
    return Array.from(set).sort();
  }, [rawDateTransactions]);

  // Filtered transactions by user criteria
  const filteredTransactions = useMemo(() => {
    return rawDateTransactions.filter((trx) => {
      // Category filter
      if (categoryFilter !== 'ALL') {
        const cat = getTrxCategory(trx);
        if (cat !== categoryFilter) return false;
      }

      // Method filter
      if (methodFilter !== 'ALL') {
        if ((trx.method || '').toLowerCase() !== methodFilter.toLowerCase()) return false;
      }

      // Cashier filter
      if (cashierFilter !== 'ALL') {
        if (trx.cashier !== cashierFilter) return false;
      }

      // Status filter
      if (statusFilter === 'VOID') {
        if (trx.status !== 'VOID') return false;
      } else if (statusFilter === 'Paid') {
        if (trx.status !== 'Paid') return false;
      } else if (statusFilter === 'DP') {
        const isDp = trx.status === 'DP 50%' || trx.status === 'BELUM LUNAS' || (trx.amountRemaining && trx.amountRemaining > 0);
        if (!isDp || trx.status === 'VOID') return false;
      } else if (statusFilter === 'ALL') {
        // Exclude VOID from general view unless VOID explicitly chosen
        if (trx.status === 'VOID') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (trx.id || '').toLowerCase().includes(q);
        const matchCust = (trx.customer || '').toLowerCase().includes(q);
        const matchDesc = (trx.desc || '').toLowerCase().includes(q);
        const matchCashier = (trx.cashier || '').toLowerCase().includes(q);
        const matchPic = (trx.picNames || trx.picId || '').toLowerCase().includes(q);
        if (!matchId && !matchCust && !matchDesc && !matchCashier && !matchPic) {
          return false;
        }
      }

      return true;
    });
  }, [rawDateTransactions, categoryFilter, methodFilter, cashierFilter, statusFilter, searchQuery]);

  // KPI Calculations
  const metrics = useMemo(() => {
    // Only non-void transactions for sales total
    const validTrx = rawDateTransactions.filter((t) => t.status !== 'VOID');
    const totalGrossSales = validTrx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalCashInflow = validTrx.reduce((sum, t) => sum + (t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount)), 0);
    const totalPiutang = validTrx.reduce((sum, t) => sum + (t.amountRemaining || 0), 0);
    const trxCount = validTrx.length;
    const avgTicketSize = trxCount > 0 ? Math.round(totalGrossSales / trxCount) : 0;

    // Peak transaction
    let peakTrx: Transaction | null = null;
    let maxVal = 0;
    validTrx.forEach((t) => {
      const val = t.amount || 0;
      if (val > maxVal) {
        maxVal = val;
        peakTrx = t;
      }
    });

    // Void count
    const voidCount = rawDateTransactions.filter((t) => t.status === 'VOID').length;

    return {
      totalGrossSales,
      totalCashInflow,
      totalPiutang,
      trxCount,
      avgTicketSize,
      peakTrx,
      voidCount
    };
  }, [rawDateTransactions]);

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const validTrx = rawDateTransactions.filter((t) => t.status !== 'VOID');
    const map: Record<string, { count: number; totalSales: number; totalPaid: number }> = {
      Membership: { count: 0, totalSales: 0, totalPaid: 0 },
      PT: { count: 0, totalSales: 0, totalPaid: 0 },
      POS: { count: 0, totalSales: 0, totalPaid: 0 },
      Bundling: { count: 0, totalSales: 0, totalPaid: 0 },
      Visit: { count: 0, totalSales: 0, totalPaid: 0 },
      Lainnya: { count: 0, totalSales: 0, totalPaid: 0 }
    };

    validTrx.forEach((t) => {
      const cat = getTrxCategory(t);
      if (!map[cat]) map[cat] = { count: 0, totalSales: 0, totalPaid: 0 };
      map[cat].count += 1;
      map[cat].totalSales += t.amount || 0;
      map[cat].totalPaid += t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount);
    });

    const colors: Record<string, string> = {
      Membership: '#f97316', // orange
      PT: '#3b82f6', // blue
      POS: '#10b981', // emerald
      Bundling: '#8b5cf6', // purple
      Visit: '#06b6d4', // cyan
      Lainnya: '#71717a' // zinc
    };

    return Object.entries(map).map(([key, data]) => ({
      name: key,
      label: key === 'PT' ? 'Personal Trainer' : key,
      count: data.count,
      totalSales: data.totalSales,
      totalPaid: data.totalPaid,
      color: colors[key] || '#f97316'
    })).filter((item) => item.count > 0 || item.totalSales > 0);
  }, [rawDateTransactions]);

  // Breakdown by Payment Method
  const methodBreakdown = useMemo(() => {
    const validTrx = rawDateTransactions.filter((t) => t.status !== 'VOID');
    const map: Record<string, { count: number; totalPaid: number }> = {};

    validTrx.forEach((t) => {
      const method = t.method || 'Tunai';
      if (!map[method]) map[method] = { count: 0, totalPaid: 0 };
      map[method].count += 1;
      map[method].totalPaid += t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount);
    });

    const methodColors: Record<string, string> = {
      Tunai: '#10b981',
      QRIS: '#f59e0b',
      Transfer: '#3b82f6',
      EDC: '#8b5cf6',
      Kasbon: '#ef4444'
    };

    return Object.entries(map).map(([method, data]) => ({
      name: method,
      count: data.count,
      totalPaid: data.totalPaid,
      color: methodColors[method] || '#a1a1aa'
    }));
  }, [rawDateTransactions]);

  // Breakdown by Hourly Distribution
  const hourlyData = useMemo(() => {
    const validTrx = rawDateTransactions.filter((t) => t.status !== 'VOID');
    const hoursSlots = [
      { slot: '06:00 - 09:00', label: 'Pagi Awal', count: 0, sales: 0 },
      { slot: '09:00 - 12:00', label: 'Pagi Siang', count: 0, sales: 0 },
      { slot: '12:00 - 15:00', label: 'Siang', count: 0, sales: 0 },
      { slot: '15:00 - 18:00', label: 'Sore', count: 0, sales: 0 },
      { slot: '18:00 - 21:00', label: 'Malam Peak', count: 0, sales: 0 },
      { slot: '21:00 - 23:00', label: 'Malam Akhir', count: 0, sales: 0 }
    ];

    validTrx.forEach((t) => {
      const timeStr = t.time || '10:00';
      const hour = parseInt(timeStr.split(':')[0] || '10', 10);
      const amount = t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount);

      if (hour >= 6 && hour < 9) {
        hoursSlots[0].count += 1;
        hoursSlots[0].sales += amount;
      } else if (hour >= 9 && hour < 12) {
        hoursSlots[1].count += 1;
        hoursSlots[1].sales += amount;
      } else if (hour >= 12 && hour < 15) {
        hoursSlots[2].count += 1;
        hoursSlots[2].sales += amount;
      } else if (hour >= 15 && hour < 18) {
        hoursSlots[3].count += 1;
        hoursSlots[3].sales += amount;
      } else if (hour >= 18 && hour < 21) {
        hoursSlots[4].count += 1;
        hoursSlots[4].sales += amount;
      } else {
        hoursSlots[5].count += 1;
        hoursSlots[5].sales += amount;
      }
    });

    return hoursSlots;
  }, [rawDateTransactions]);

  // Cashier Performance Summary
  const cashierSummary = useMemo(() => {
    const validTrx = rawDateTransactions.filter((t) => t.status !== 'VOID');
    const map: Record<string, { count: number; totalPaid: number; totalGross: number; methods: Record<string, number> }> = {};

    validTrx.forEach((t) => {
      const c = t.cashier || 'Staf Kasir';
      if (!map[c]) {
        map[c] = { count: 0, totalPaid: 0, totalGross: 0, methods: {} };
      }
      map[c].count += 1;
      map[c].totalGross += t.amount || 0;
      const paid = t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount);
      map[c].totalPaid += paid;
      const m = t.method || 'Tunai';
      map[c].methods[m] = (map[c].methods[m] || 0) + paid;
    });

    return Object.entries(map).map(([cashier, data]) => ({
      cashier,
      ...data
    })).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [rawDateTransactions]);

  // Export to Excel
  const handleExportExcel = () => {
    const branchName = selectedBranchFilter === 'ALL'
      ? 'Semua Cabang (Konsolidasi)'
      : branches.find((b) => b.id === selectedBranchFilter)?.name || activeBranch.name;

    const rows: Record<string, any>[] = filteredTransactions.map((t, idx) => ({
      No: idx + 1,
      'No. Nota': t.id,
      Tanggal: t.date,
      Jam: t.time || '-',
      Cabang: t.branchName || branchName,
      'Nama Pelanggan': t.customer,
      Kategori: getTrxCategory(t),
      'Uraian Transaksi': t.desc,
      Kasir: t.cashier || '-',
      'PIC Sales': t.picNames || t.picId || '-',
      'Metode Bayar': t.method,
      'Bank / Rekening': t.bankDest || '-',
      Status: t.status,
      'Nilai Transaksi (Rp)': t.amount || 0,
      'Uang Diterima (Rp)': t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount),
      'Piutang (Rp)': t.amountRemaining || 0
    }));

    // Summary Row
    rows.push({
      No: '' as any,
      'No. Nota': 'TOTAL REKAPITULASI',
      Tanggal: selectedDate,
      Jam: `${rows.length} Trx`,
      Cabang: branchName,
      'Nama Pelanggan': '',
      Kategori: '',
      'Uraian Transaksi': '',
      Kasir: '',
      'PIC Sales': '',
      'Metode Bayar': '',
      'Bank / Rekening': '',
      Status: '',
      'Nilai Transaksi (Rp)': filteredTransactions.reduce((s, t) => s + (t.amount || 0), 0),
      'Uang Diterima (Rp)': filteredTransactions.reduce((s, t) => s + (t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount)), 0),
      'Piutang (Rp)': filteredTransactions.reduce((s, t) => s + (t.amountRemaining || 0), 0)
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penjualan Harian');

    const fileName = `Laporan_Penjualan_Harian_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    if (showToast) {
      showToast('Export Berhasil', `Laporan Penjualan Harian ${selectedDate} telah diunduh ke Excel.`, 'success');
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    const branchName = selectedBranchFilter === 'ALL'
      ? 'Semua Cabang (Konsolidasi Pusat)'
      : branches.find((b) => b.id === selectedBranchFilter)?.name || activeBranch.name;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Header Kop
    doc.setFillColor(24, 24, 27); // zinc-900
    doc.rect(0, 0, 297, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GYMPRO ENTERPRISE - LAPORAN PENJUALAN HARIAN', 14, 11);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(212, 212, 216);
    doc.text(`Unit: ${branchName} | Tanggal Laporan: ${formatDateIndo(selectedDate)} | Dicetak: ${getTimestamp()}`, 14, 18);

    // Summary Box
    doc.setDrawColor(228, 228, 231);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 30, 269, 18, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Omzet: ${formatRp(metrics.totalGrossSales)}`, 20, 37);
    doc.text(`Kas Masuk (Paid): ${formatRp(metrics.totalCashInflow)}`, 95, 37);
    doc.text(`Piutang / Pending: ${formatRp(metrics.totalPiutang)}`, 175, 37);
    doc.text(`Total Nota: ${metrics.trxCount} Trx`, 245, 37);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Filter Kategori: ${categoryFilter} | Metode: ${methodFilter} | Kasir: ${cashierFilter}`, 20, 44);

    // Table
    const tableBody = filteredTransactions.map((t, idx) => [
      String(idx + 1),
      t.id,
      t.time || '-',
      t.customer,
      getTrxCategory(t),
      (t.desc || '').substring(0, 30),
      t.cashier || '-',
      t.method || 'Tunai',
      t.status || 'Paid',
      formatRp(t.amount || 0),
      formatRp(t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount))
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['No', 'Nota', 'Jam', 'Pelanggan', 'Kategori', 'Uraian', 'Kasir', 'Metode', 'Status', 'Nominal', 'Diterima']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.8 },
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 },
        3: { cellWidth: 32 },
        4: { cellWidth: 22 },
        5: { cellWidth: 55 },
        6: { cellWidth: 25 },
        7: { cellWidth: 18 },
        8: { cellWidth: 18 },
        9: { cellWidth: 28, halign: 'right' },
        10: { cellWidth: 28, halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    // Signatures
    if (finalY < 170) {
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Disiapkan Oleh (Kasir On-Duty):', 30, finalY + 15);
      doc.text('( _________________________ )', 30, finalY + 32);

      doc.text('Diverifikasi Oleh (Admin Unit / Manager):', 200, finalY + 15);
      doc.text('( _________________________ )', 200, finalY + 32);
    }

    doc.save(`Laporan_Penjualan_Harian_${selectedDate}.pdf`);

    if (showToast) {
      showToast('PDF Siap', `Laporan Penjualan Harian ${selectedDate} telah diunduh.`, 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner & Actions */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-orange-400" />
                <span>Daily Sales Report</span>
              </span>
              <span className="text-zinc-500">•</span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {selectedBranchFilter === 'ALL'
                    ? 'Semua Cabang (Konsolidasi Pusat)'
                    : branches.find((b) => b.id === selectedBranchFilter)?.name || activeBranch.name}
                </span>
                {!isSuperAdmin && (
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/40">
                    🔒 Unit Kerja
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight flex items-center gap-2">
              Laporan Penjualan Harian
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Rekapitulasi omzet penjualan real-time, penerimaan kas masuk, rincian transaksi kasir, dan komposisi metode pembayaran harian.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsThermalSlipOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Cetak Slip Rekap Harian Kasir Thermal 80mm/58mm"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Slip Struk Kasir</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Cetak Laporan Penjualan Harian ke format PDF Resmi"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Cetak PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
              title="Download Data Penjualan Harian ke Spreadsheet Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Date Navigation & Quick Selector Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Date Picker with Prev/Next Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-700 px-3 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs sm:text-sm font-extrabold outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-zinc-300 px-2 hidden sm:inline">
              {formatDateIndo(selectedDate)}
            </span>
          </div>

          {/* Quick Date Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedDate(APP_TODAY)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedDate === APP_TODAY
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(twoDaysAgoStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedDate === twoDaysAgoStr
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
              }`}
            >
              H-2
            </button>
          </div>
        </div>

        {/* Filters Row: Branch (Admin Only), Category, Method, Cashier, Status, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-3 border-t border-zinc-800/80 text-xs">
          {/* Branch Filter (Only Super Admin) */}
          {isSuperAdmin ? (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Cabang:
              </label>
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-semibold outline-none focus:border-amber-500"
              >
                <option value="ALL">Semua Cabang ({branches.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Unit Cabang:
              </label>
              <div className="bg-zinc-950 border border-teal-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold truncate">
                {branches.find((b) => b.id === userBranchId)?.code || 'CAB'} - {branches.find((b) => b.id === userBranchId)?.name || activeBranch.name}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Kategori Layanan:
            </label>
            <select
              value={categoryFilter}
              onChange={(e: any) => setCategoryFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Membership">Membership Gym</option>
              <option value="PT">Personal Trainer (PT)</option>
              <option value="POS">Kafe & Suplemen (POS)</option>
              <option value="Bundling">Paket Bundling</option>
              <option value="Visit">Visit Harian / Pass</option>
              <option value="Lainnya">Biaya Lainnya</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Metode Pembayaran:
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Metode</option>
              <option value="Tunai">Tunai (Cash)</option>
              <option value="QRIS">QRIS</option>
              <option value="Transfer">Transfer Bank</option>
              <option value="EDC">EDC Kartu</option>
              <option value="Kasbon">Kasbon / Tempo</option>
            </select>
          </div>

          {/* Cashier Filter */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Kasir Bertugas:
            </label>
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Kasir ({dateCashiers.length})</option>
              {dateCashiers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Status Pembayaran:
            </label>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Valid (Non-Void)</option>
              <option value="Paid">Lunas (Paid)</option>
              <option value="DP">DP / Cicilan (Pending)</option>
              <option value="VOID">Transaksi Void (Batal)</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Pencarian Cepat:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="No nota, member, produk..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omzet Kotor */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
              Omzet Penjualan (Gross)
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-2">
            {formatRp(metrics.totalGrossSales)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span className="text-orange-400 font-bold">{metrics.trxCount} Transaksi</span>
            <span>pada {formatDateIndo(selectedDate)}</span>
          </p>
        </div>

        {/* Total Kas Masuk Diterima */}
        <div className="bg-zinc-900/90 border border-emerald-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">
              Kas Masuk (Real Paid)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">
            {formatRp(metrics.totalCashInflow)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span>Uang riil diterima laci/rekening</span>
          </p>
        </div>

        {/* Total Piutang / Pending */}
        <div className="bg-zinc-900/90 border border-amber-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
              Piutang Baru (Tempo)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-300 mt-2">
            {formatRp(metrics.totalPiutang)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            <span>Sisa pembayaran cicilan member</span>
          </p>
        </div>

        {/* Rata-rata Nilai Transaksi */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
              Rata-rata Nota (Ticket)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-2">
            {formatRp(metrics.avgTicketSize)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 truncate">
            {metrics.peakTrx ? (
              <span>Tertinggi: <strong>{formatRp((metrics.peakTrx as Transaction).amount)}</strong> ({(metrics.peakTrx as Transaction).customer})</span>
            ) : (
              <span>Belum ada transaksi</span>
            )}
          </p>
        </div>
      </div>

      {/* 4. Sub-Tab Switcher (Rincian Transaksi, Visual Analytics, Performa Kasir) */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('table')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'table'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rincian Transaksi ({filteredTransactions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'analytics'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grafik & Komposisi Penjualan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('cashiers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'cashiers'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Rekapitulasi Kasir ({cashierSummary.length})</span>
          </button>
        </div>

        <span className="text-xs text-zinc-500 hidden sm:inline font-mono">
          Total Baris: {filteredTransactions.length}
        </span>
      </div>

      {/* TAB 1: RINCIAN TABEL TRANSAKSI HARIAN */}
      {activeSubTab === 'table' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">Nota & Jam</th>
                  <th className="py-3 px-3">Pelanggan</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-4">Deskripsi Produk / Layanan</th>
                  <th className="py-3 px-3">Kasir & PIC</th>
                  <th className="py-3 px-3">Metode Bayar</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Nilai Trx</th>
                  <th className="py-3 px-4 text-right">Diterima</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-zinc-600" />
                        <p className="text-sm font-bold text-zinc-400">
                          Tidak ada transaksi penjualan pada kriteria ini
                        </p>
                        <p className="text-xs text-zinc-500">
                          Pilih tanggal lain atau reset filter untuk melihat data transaksi.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trx, idx) => {
                    const cat = getTrxCategory(trx);
                    const isVoid = trx.status === 'VOID';
                    const isDp = trx.status === 'DP 50%' || trx.status === 'BELUM LUNAS' || (trx.amountRemaining && trx.amountRemaining > 0);
                    const received = trx.amountPaid !== undefined ? trx.amountPaid : (trx.initialCashPaid ?? trx.amount);

                    return (
                      <tr
                        key={trx.id}
                        className={`hover:bg-zinc-800/40 transition ${
                          isVoid ? 'opacity-50 line-through bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-zinc-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-white block">{trx.id}</span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-zinc-500" /> {trx.time || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{trx.customer}</span>
                          {trx.memberId && (
                            <span className="text-[10px] text-zinc-500 font-mono">{trx.memberId}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                              cat === 'Membership'
                                ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                                : cat === 'PT'
                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                : cat === 'POS'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : cat === 'Bundling'
                                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                : cat === 'Visit'
                                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {cat}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-medium text-zinc-200 truncate">{trx.desc}</p>
                          {trx.branchName && selectedBranchFilter === 'ALL' && (
                            <span className="text-[10px] text-zinc-500 block truncate">
                              📍 {trx.branchName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-zinc-300 block">{trx.cashier || '-'}</span>
                          {trx.picNames && (
                            <span className="text-[10px] text-zinc-500 block truncate">
                              PIC: {trx.picNames}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="font-bold text-white">{trx.method}</span>
                          </div>
                          {trx.bankDest && trx.method !== 'Tunai' && (
                            <span className="text-[10px] text-zinc-500 block font-mono">
                              {trx.bankDest}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {isVoid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              VOID
                            </span>
                          ) : isDp ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              DP / Cicilan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Lunas
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {formatRp(trx.amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400">
                          {formatRp(received)}
                          {trx.amountRemaining ? (
                            <span className="block text-[10px] font-normal text-amber-400">
                              Sisa: {formatRp(trx.amountRemaining)}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {onReprintReceipt && (
                            <button
                              type="button"
                              onClick={() => onReprintReceipt(trx)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500 text-zinc-400 hover:text-white transition cursor-pointer"
                              title="Cetak Ulang Struk Kasir"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer Summary */}
              {filteredTransactions.length > 0 && (
                <tfoot className="bg-zinc-950 font-bold border-t-2 border-zinc-800 text-white text-xs">
                  <tr>
                    <td colSpan={8} className="py-3 px-4 text-right uppercase tracking-wider text-zinc-400">
                      Total Rekap Penjualan:
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                      {formatRp(filteredTransactions.reduce((s, t) => s + (t.amount || 0), 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatRp(filteredTransactions.reduce((s, t) => s + (t.amountPaid !== undefined ? t.amountPaid : (t.initialCashPaid ?? t.amount)), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL ANALYTICS & GRAFIK KOMPOSISI */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafik 1: Komposisi Omzet per Kategori Layanan */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-orange-400" />
                  <span>Komposisi Omzet per Kategori</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Distribusi nilai penjualan berdasarkan jenis paket & produk pada {formatDateIndo(selectedDate)}
                </p>
              </div>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-xs">
                Belum ada data penjualan pada tanggal ini
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="totalSales"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatRp(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category breakdown table summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-zinc-800 text-xs">
              {categoryBreakdown.map((item) => (
                <div key={item.name} className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-zinc-300 truncate">{item.label}</span>
                  </div>
                  <p className="font-mono font-black text-white mt-1">{formatRp(item.totalSales)}</p>
                  <p className="text-[10px] text-zinc-500">{item.count} transaksi</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grafik 2: Penerimaan per Metode Pembayaran */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Penerimaan Kas per Metode Bayar</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Uang masuk riil berdasarkan channel pembayaran kasir (Tunai, QRIS, Transfer, EDC)
                </p>
              </div>
            </div>

            {methodBreakdown.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-xs">
                Belum ada data pembayaran
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={methodBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(value: any) => formatRp(value)} />
                    <Bar dataKey="totalPaid" name="Kas Diterima" radius={[6, 6, 0, 0]}>
                      {methodBreakdown.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Methods list */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-zinc-800 text-xs">
              {methodBreakdown.map((m) => (
                <div key={m.name} className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800">
                  <span className="font-bold text-zinc-400">{m.name}</span>
                  <p className="font-mono font-black text-emerald-400 mt-0.5">{formatRp(m.totalPaid)}</p>
                  <span className="text-[10px] text-zinc-500 font-mono">{m.count} nota</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grafik 3: Hourly Sales Timeline */}
          <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Distribusi Penjualan per Jam Operasional (Hourly Timeline)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Memetakan jam-jam puncak (peak hours) transaksi kasir selama operasional hari ini
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="slot" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(value: any) => formatRp(value)} />
                  <Bar dataKey="sales" name="Omzet Diterima" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REKAPITULASI KASIR BERTUGAS */}
      {activeSubTab === 'cashiers' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Rekapitulasi Penjualan per Kasir On-Duty</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Perolehan kas masuk dan volume transaksi yang diproses oleh masing-masing kasir pada {formatDateIndo(selectedDate)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {cashierSummary.length === 0 ? (
              <div className="col-span-full py-8 text-center text-zinc-500 text-xs">
                Tidak ada data kasir bertransaksi pada tanggal ini
              </div>
            ) : (
              cashierSummary.map((item) => (
                <div
                  key={item.cashier}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black text-xs">
                        {item.cashier.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white truncate">{item.cashier}</h4>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {item.count} Transaksi Diproses
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Total Kas Diterima:</span>
                      <span className="font-mono font-black text-emerald-400">{formatRp(item.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Total Omzet Bruto:</span>
                      <span className="font-mono font-bold text-zinc-200">{formatRp(item.totalGross)}</span>
                    </div>
                  </div>

                  {/* Channel Breakdown */}
                  <div className="pt-2 border-t border-zinc-800/60 text-[11px] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Metode Pembayaran:</span>
                    {Object.entries(item.methods).map(([meth, val]) => (
                      <div key={meth} className="flex justify-between text-zinc-400">
                        <span>{meth}:</span>
                        <span className="font-mono text-zinc-200">{formatRp(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL SLIP STRUK KASIR HARIAN (THERMAL 80mm PREVIEW) */}
      {isThermalSlipOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Pratinjau Slip Rekap Kasir (Thermal)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsThermalSlipOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Ticket Content */}
            <div className="p-5 overflow-y-auto font-mono text-xs bg-white text-black space-y-3">
              <div className="text-center space-y-0.5 border-b border-dashed border-zinc-400 pb-2">
                <h2 className="font-extrabold text-sm uppercase">GYMPRO FITNESS CENTER</h2>
                <p className="text-[11px]">
                  {selectedBranchFilter === 'ALL'
                    ? 'KONSOLIDASI SELURUH CABANG'
                    : branches.find((b) => b.id === selectedBranchFilter)?.name || activeBranch.name}
                </p>
                <p className="text-[10px] text-zinc-600">SLIP REKAP PENJUALAN HARIAN (SHIFT / EOD)</p>
              </div>

              <div className="space-y-0.5 text-[11px] border-b border-dashed border-zinc-400 pb-2">
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="font-bold">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jam Cetak:</span>
                  <span>{getTimestamp(true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir On-Duty:</span>
                  <span>{cashierFilter === 'ALL' ? 'Semua Kasir' : cashierFilter}</span>
                </div>
              </div>

              {/* Ringkasan Omzet */}
              <div className="space-y-1 border-b border-dashed border-zinc-400 pb-2">
                <div className="flex justify-between font-bold">
                  <span>TOTAL OMZET BRUTO:</span>
                  <span>{formatRp(metrics.totalGrossSales)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs">
                  <span>TOTAL KAS DITERIMA:</span>
                  <span>{formatRp(metrics.totalCashInflow)}</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>Total Piutang Baru:</span>
                  <span>{formatRp(metrics.totalPiutang)}</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>Jumlah Transaksi:</span>
                  <span>{metrics.trxCount} Trx</span>
                </div>
              </div>

              {/* Breakdown Metode */}
              <div className="space-y-0.5 border-b border-dashed border-zinc-400 pb-2">
                <span className="font-bold block text-[10px] uppercase">Rincian Pembayaran:</span>
                {methodBreakdown.map((m) => (
                  <div key={m.name} className="flex justify-between">
                    <span>{m.name} ({m.count}):</span>
                    <span>{formatRp(m.totalPaid)}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown Kategori */}
              <div className="space-y-0.5 border-b border-dashed border-zinc-400 pb-2">
                <span className="font-bold block text-[10px] uppercase">Rincian Kategori:</span>
                {categoryBreakdown.map((c) => (
                  <div key={c.name} className="flex justify-between">
                    <span>{c.label} ({c.count}):</span>
                    <span>{formatRp(c.totalSales)}</span>
                  </div>
                ))}
              </div>

              {/* Signatures */}
              <div className="pt-3 flex justify-between text-[10px] text-center">
                <div>
                  <p>Kasir Bertugas</p>
                  <p className="mt-8">( ___________ )</p>
                </div>
                <div>
                  <p>Admin / SPV</p>
                  <p className="mt-8">( ___________ )</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsThermalSlipOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  if (showToast) {
                    showToast('Perintah Cetak Dikirim', 'Slip rekap harian dikirim ke printer thermal.', 'info');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

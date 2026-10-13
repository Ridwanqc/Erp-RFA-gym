import React, { useState, useMemo, useId } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  CreditCard,
  Trash2,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { CompanyExpense, ExpenseCategory, GymBranch, User as UserType } from '../../types';
import { APP_TODAY, formatRp } from '../../utils/formatters';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { ExpensePayModal } from './ExpensePayModal';
import { ExpenseVoucherPrintModal } from './ExpenseVoucherPrintModal';

interface ExpenseHistoryTableProps {
  expenses: CompanyExpense[];
  categories: ExpenseCategory[];
  branches: GymBranch[];
  currentUser: UserType | null;
  activeBranchId: string;
  onSavePayment: (
    expenseId: string,
    paidAmount: number,
    paidAccount: string,
    paymentMethod: CompanyExpense['paymentMethod'],
    refNumber?: string,
    notes?: string
  ) => void;
  onApproveExpense: (expense: CompanyExpense) => void;
  onRejectExpense: (expense: CompanyExpense) => void;
  onCancelExpense: (expenseId: string, reason: string) => void;
  onNavigateToInput?: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ExpenseHistoryTable: React.FC<ExpenseHistoryTableProps> = ({
  expenses,
  categories,
  branches,
  currentUser,
  activeBranchId,
  onSavePayment,
  onApproveExpense,
  onRejectExpense,
  onCancelExpense,
  onNavigateToInput,
  showToast
}) => {
  const tableFilterPrefixId = useId();
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>(activeBranchId || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [accountingTypeFilter, setAccountingTypeFilter] = useState<string>('ALL');

  // Date Filters
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sort State
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'expenseNumber'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<CompanyExpense | null>(null);
  const [selectedExpenseForPay, setSelectedExpenseForPay] = useState<CompanyExpense | null>(null);
  const [selectedExpenseForVoucher, setSelectedExpenseForVoucher] = useState<CompanyExpense | null>(null);

  // Prompt Cancel Modal
  const [cancelingExpenseId, setCancelingExpenseId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const isAdminOrManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager' ||
    (currentUser as any)?.role === 'ADMIN' ||
    (currentUser as any)?.role === 'LEADER';

  // Preset Date Handlers
  const handleDatePreset = (preset: 'ALL' | 'TODAY' | '7DAYS' | 'MONTH') => {
    setDatePreset(preset);
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      setStartDate(APP_TODAY);
      setEndDate(APP_TODAY);
    } else if (preset === '7DAYS') {
      const todayDate = new Date();
      const past = new Date(todayDate);
      past.setDate(todayDate.getDate() - 6);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(APP_TODAY);
    } else if (preset === 'MONTH') {
      const todayDate = new Date();
      const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(APP_TODAY);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setBranchFilter('ALL');
    setCategoryFilter('ALL');
    setApprovalFilter('ALL');
    setPaymentFilter('ALL');
    setMethodFilter('ALL');
    setAccountingTypeFilter('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Filtered & Sorted Data
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNumber = item.expenseNumber.toLowerCase().includes(q);
          const matchName = item.name.toLowerCase().includes(q);
          const matchVendor = item.vendorOrBeneficiary.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchInvoice = item.invoiceRefNumber?.toLowerCase().includes(q);
          const matchPic = item.picStaffName.toLowerCase().includes(q);
          if (!matchNumber && !matchName && !matchVendor && !matchDesc && !matchInvoice && !matchPic) {
            return false;
          }
        }

        // Branch
        if (branchFilter !== 'ALL' && item.branchId !== branchFilter) {
          return false;
        }

        // Category
        if (categoryFilter !== 'ALL' && item.categoryId !== categoryFilter) {
          return false;
        }

        // Approval Status
        if (approvalFilter !== 'ALL' && item.approvalStatus !== approvalFilter) {
          return false;
        }

        // Payment Status
        if (paymentFilter !== 'ALL' && item.paymentStatus !== paymentFilter) {
          return false;
        }

        // Payment Method
        if (methodFilter !== 'ALL' && item.paymentMethod !== methodFilter) {
          return false;
        }

        // Accounting Type
        if (accountingTypeFilter !== 'ALL' && item.accountingType !== accountingTypeFilter) {
          return false;
        }

        // Date Range
        if (startDate && item.date < startDate) return false;
        if (endDate && item.date > endDate) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') {
          diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortBy === 'amount') {
          diff = a.amount - b.amount;
        } else if (sortBy === 'expenseNumber') {
          diff = a.expenseNumber.localeCompare(b.expenseNumber);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [
    expenses,
    searchQuery,
    branchFilter,
    categoryFilter,
    approvalFilter,
    paymentFilter,
    methodFilter,
    accountingTypeFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder
  ]);

  // Aggregation Metrics for Filtered List
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenses]);

  const totalFilteredPaid = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.paidAmount, 0);
  }, [filteredExpenses]);

  const totalFilteredRemaining = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.balanceRemaining, 0);
  }, [filteredExpenses]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(start, start + itemsPerPage);
  }, [filteredExpenses, currentPage]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredExpenses.length === 0) {
      showToast('Data Kosong', 'Tidak ada data pengeluaran yang tersaring untuk diekspor.', 'warning');
      return;
    }

    try {
      const exportRows: any[] = filteredExpenses.map((exp, idx) => ({
        'No': idx + 1,
        'No. Transaksi': exp.expenseNumber,
        'Tanggal': exp.date,
        'Cabang': exp.branchName,
        'Kategori': exp.categoryName,
        'Subkategori': exp.subcategory,
        'Perlakuan Akuntansi': exp.accountingType.replace(/_/g, ' '),
        'Nama Pengeluaran': exp.name,
        'Keterangan': exp.description || '-',
        'Penerima / Vendor': exp.vendorOrBeneficiary,
        'Nominal (Rp)': exp.amount,
        'Sudah Dibayar (Rp)': exp.paidAmount,
        'Sisa Utang (Rp)': exp.balanceRemaining,
        'Metode Bayar': exp.paymentMethod,
        'Sumber Rekening': exp.sourceAccount,
        'Status Approval': exp.approvalStatus,
        'Status Bayar': exp.paymentStatus,
        'PIC / Pengaju': exp.picStaffName,
        'No. Invoice / Referensi': exp.invoiceRefNumber || '-'
      }));

      // Append Total
      exportRows.push({
        'No': '' as any,
        'No. Transaksi': 'TOTAL REKAPITULASI',
        'Tanggal': `${filteredExpenses.length} Transaksi`,
        'Cabang': branchFilter === 'ALL' ? 'Semua Cabang' : branchFilter,
        'Kategori': '',
        'Subkategori': '',
        'Perlakuan Akuntansi': '',
        'Nama Pengeluaran': '',
        'Keterangan': '',
        'Penerima / Vendor': '',
        'Nominal (Rp)': totalFilteredAmount,
        'Sudah Dibayar (Rp)': totalFilteredPaid,
        'Sisa Utang (Rp)': totalFilteredRemaining,
        'Metode Bayar': '',
        'Sumber Rekening': '',
        'Status Approval': '',
        'Status Bayar': '',
        'PIC / Pengaju': '',
        'No. Invoice / Referensi': ''
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Pengeluaran');

      const fileName = `Riwayat_Pengeluaran_RFA_GYM_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      showToast('Export Berhasil', `File Excel ${fileName} berhasil diunduh.`, 'success');
    } catch (err: any) {
      showToast('Gagal Export Excel', err.message, 'error');
    }
  };

  // Export to Native PDF
  const handleExportPdf = () => {
    if (filteredExpenses.length === 0) {
      showToast('Data Kosong', 'Tidak ada data pengeluaran yang tersaring untuk diekspor.', 'warning');
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 12;

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(24, 24, 27);
      pdf.text('RFA GYM & FITNESS CENTER - LAPORAN RIWAYAT PENGELUARAN', margin, 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Waktu Cetak: ${new Date().toLocaleString('id-ID')} WIB | Dicetak Oleh: ${currentUser?.name || 'Administrator'}`,
        margin,
        19
      );

      // Line
      pdf.setDrawColor(249, 115, 22);
      pdf.setLineWidth(0.8);
      pdf.line(margin, 22, pdfWidth - margin, 22);

      // Metadata Summary
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(24, 24, 27);
      pdf.text(
        `Total Transaksi: ${filteredExpenses.length} | Total Pengeluaran: ${formatRp(totalFilteredAmount)} | Total Terbayar: ${formatRp(totalFilteredPaid)} | Sisa Utang: ${formatRp(totalFilteredRemaining)}`,
        margin,
        28
      );

      // Simple Table Render
      let y = 35;
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(24, 24, 27);
      pdf.rect(margin, y - 4, pdfWidth - margin * 2, 6, 'F');

      pdf.text('No.', margin + 2, y);
      pdf.text('No. Transaksi', margin + 10, y);
      pdf.text('Tanggal', margin + 40, y);
      pdf.text('Cabang', margin + 60, y);
      pdf.text('Kategori', margin + 95, y);
      pdf.text('Uraian Pengeluaran', margin + 130, y);
      pdf.text('Vendor', margin + 185, y);
      pdf.text('Nominal (Rp)', margin + 220, y);
      pdf.text('Status', margin + 250, y);

      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(24, 24, 27);

      filteredExpenses.slice(0, 35).forEach((item, i) => {
        if (y > 195) return;
        pdf.text(String(i + 1), margin + 2, y);
        pdf.text(item.expenseNumber, margin + 10, y);
        pdf.text(item.date, margin + 40, y);
        pdf.text(item.branchName.slice(0, 18), margin + 60, y);
        pdf.text(item.categoryName.slice(0, 18), margin + 95, y);
        pdf.text(item.name.slice(0, 28), margin + 130, y);
        pdf.text(item.vendorOrBeneficiary.slice(0, 18), margin + 185, y);
        pdf.text(formatRp(item.amount), margin + 220, y);
        pdf.text(item.approvalStatus, margin + 250, y);
        y += 4.5;
      });

      const fileName = `Laporan_Pengeluaran_RFA_GYM_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      showToast('Export Berhasil', `File PDF ${fileName} berhasil diunduh.`, 'success');
    } catch (err: any) {
      showToast('Gagal Export PDF', err.message, 'error');
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Menunggu Persetujuan':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Draft':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
      case 'Ditolak':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Dibatalkan':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700 line-through';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'Lunas':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Dibayar Sebagian':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Belum Dibayar':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Aggregation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <span className="text-xs text-zinc-400 block font-medium">Total Pengeluaran Tersaring</span>
          <span className="text-xl font-black font-mono text-rose-400 mt-1 block">
            {formatRp(totalFilteredAmount)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">{filteredExpenses.length} transaksi</span>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <span className="text-xs text-zinc-400 block font-medium">Total Sudah Terbayar</span>
          <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
            {formatRp(totalFilteredPaid)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {filteredExpenses.filter((e) => e.paymentStatus === 'Lunas').length} transaksi lunas
          </span>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <span className="text-xs text-zinc-400 block font-medium">Sisa Utang / Belum Lunas</span>
          <span className="text-xl font-black font-mono text-amber-400 mt-1 block">
            {formatRp(totalFilteredRemaining)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">Kewajiban belum diselesaikan</span>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Menunggu Persetujuan</span>
            <span className="text-xl font-black font-mono text-orange-400 mt-1 block">
              {filteredExpenses.filter((e) => e.approvalStatus === 'Menunggu Persetujuan').length}
            </span>
          </div>
          {onNavigateToInput && (
            <button
              onClick={onNavigateToInput}
              className="mt-2 w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Pengeluaran Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        {/* Row 1: Search & Date Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari no. transaksi, uraian, vendor, invoice, atau PIC..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            <button
              onClick={() => handleDatePreset('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                datePreset === 'ALL' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => handleDatePreset('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                datePreset === 'TODAY' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleDatePreset('7DAYS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                datePreset === '7DAYS' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => handleDatePreset('MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                datePreset === 'MONTH' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              Bulan Ini
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Download format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Download format PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Row 2: Detailed Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-zinc-800/60 text-xs">
          {/* Cabang */}
          <div>
            <label htmlFor={`${tableFilterPrefixId}-table-filter-branch`} className="block text-[10px] text-zinc-400 font-bold mb-1">Cabang</label>
            <select
              id={`${tableFilterPrefixId}-table-filter-branch`}
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label htmlFor={`${tableFilterPrefixId}-table-filter-category`} className="block text-[10px] text-zinc-400 font-bold mb-1">Kategori</label>
            <select
              id={`${tableFilterPrefixId}-table-filter-category`}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Approval */}
          <div>
            <label htmlFor={`${tableFilterPrefixId}-table-filter-approval`} className="block text-[10px] text-zinc-400 font-bold mb-1">Persetujuan</label>
            <select
              id={`${tableFilterPrefixId}-table-filter-approval`}
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Persetujuan</option>
              <option value="Menunggu Persetujuan">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Draft">Draft</option>
              <option value="Ditolak">Ditolak</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Pembayaran */}
          <div>
            <label htmlFor={`${tableFilterPrefixId}-table-filter-payment-status`} className="block text-[10px] text-zinc-400 font-bold mb-1">Status Bayar</label>
            <select
              id={`${tableFilterPrefixId}-table-filter-payment-status`}
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Status Bayar</option>
              <option value="Lunas">Lunas</option>
              <option value="Dibayar Sebagian">Sebagian</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
            </select>
          </div>

          {/* Metode Bayar */}
          <div>
            <label htmlFor={`${tableFilterPrefixId}-table-filter-payment-method`} className="block text-[10px] text-zinc-400 font-bold mb-1">Metode Bayar</label>
            <select
              id={`${tableFilterPrefixId}-table-filter-payment-method`}
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Metode</option>
              <option value="Kas">Kas Laci</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
              <option value="Kartu Debit/EDC">Debit / EDC</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => {
                    setSortBy('expenseNumber');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>No. Transaksi</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortBy('date');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Cabang</th>
                <th className="py-3 px-4">Kategori & Akuntansi</th>
                <th className="py-3 px-4">Uraian / Keterangan</th>
                <th className="py-3 px-4">Penerima / Vendor</th>
                <th
                  onClick={() => {
                    setSortBy('amount');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Nominal</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-center">Persetujuan</th>
                <th className="py-3 px-4 text-center">Pembayaran</th>
                <th className="py-3 px-4">PIC</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-zinc-800/40 transition group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-zinc-300 block truncate max-w-[130px]">
                        {exp.branchName}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-zinc-200 block truncate max-w-[150px]">
                        {exp.categoryName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {exp.accountingType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block max-w-xs truncate" title={exp.name}>
                        {exp.name}
                      </span>
                      {exp.invoiceRefNumber && (
                        <span className="text-[10px] text-orange-400/80 font-mono">
                          Ref: {exp.invoiceRefNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-zinc-300 font-medium block truncate max-w-[130px]">
                        {exp.vendorOrBeneficiary}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                      {formatRp(exp.amount)}
                      {exp.balanceRemaining > 0 && exp.paymentStatus !== 'Lunas' && (
                        <span className="block text-[10px] text-amber-400 font-mono">
                          Sisa: {formatRp(exp.balanceRemaining)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-zinc-200 block">{exp.paymentMethod}</span>
                      <span className="text-[10px] text-zinc-500 block truncate max-w-[120px]">
                        {exp.sourceAccount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getApprovalBadge(exp.approvalStatus)}`}>
                        {exp.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPaymentBadge(exp.paymentStatus)}`}>
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-400">
                      {exp.picStaffName}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Detail Modal */}
                        <button
                          onClick={() => setSelectedExpenseForDetail(exp)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                          title="Lihat Detail Transaksi"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Cetak Voucher */}
                        <button
                          onClick={() => setSelectedExpenseForVoucher(exp)}
                          className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 rounded-lg transition"
                          title="Cetak Voucher Kas/Bank"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Bayar action jika disetujui & belum lunas */}
                        {exp.approvalStatus === 'Disetujui' && exp.paymentStatus !== 'Lunas' && (
                          <button
                            onClick={() => setSelectedExpenseForPay(exp)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition"
                            title="Catat Pelunasan / Pembayaran"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Batal / Cancel jika berhak & belum lunas */}
                        {isAdminOrManager && exp.approvalStatus !== 'Dibatalkan' && (
                          <button
                            onClick={() => {
                              setCancelingExpenseId(exp.id);
                              setCancelReason('');
                            }}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
                            title="Batalkan Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-zinc-500">
                    <p className="font-semibold text-sm">Tidak ada transaksi pengeluaran yang sesuai filter.</p>
                    <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 text-xs text-zinc-400">
          <span>
            Menampilkan{' '}
            <strong className="text-zinc-200">
              {filteredExpenses.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </strong>{' '}
            -{' '}
            <strong className="text-zinc-200">
              {Math.min(currentPage * itemsPerPage, filteredExpenses.length)}
            </strong>{' '}
            dari <strong className="text-zinc-200">{filteredExpenses.length}</strong> transaksi
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-zinc-300">
              Hal {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedExpenseForDetail && (
        <ExpenseDetailModal
          expense={selectedExpenseForDetail}
          onClose={() => setSelectedExpenseForDetail(null)}
          onOpenPay={(exp) => setSelectedExpenseForPay(exp)}
          onApprove={onApproveExpense}
          onReject={onRejectExpense}
          canApprove={isAdminOrManager}
        />
      )}

      {/* Pay Modal */}
      {selectedExpenseForPay && (
        <ExpensePayModal
          expense={selectedExpenseForPay}
          onClose={() => setSelectedExpenseForPay(null)}
          onSavePayment={onSavePayment}
        />
      )}

      {/* Print Voucher Modal */}
      {selectedExpenseForVoucher && (
        <ExpenseVoucherPrintModal
          expense={selectedExpenseForVoucher}
          onClose={() => setSelectedExpenseForVoucher(null)}
        />
      )}

      {/* Cancel Expense Confirmation Modal */}
      {cancelingExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Batalkan Transaksi Pengeluaran?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Transaksi yang dibatalkan tidak akan diakui sebagai beban keuangan dan dicatat pada jejak audit pembatalan.
            </p>
            <div>
              <label htmlFor={`${tableFilterPrefixId}-expense-cancel-reason`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Alasan Pembatalan <span className="text-rose-400">*</span>
              </label>
              <textarea
                id={`${tableFilterPrefixId}-expense-cancel-reason`}
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tuliskan alasan pembatalan transaksi..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCancelingExpenseId(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!cancelReason.trim()) {
                    showToast('Alasan Diperlukan', 'Harap isi alasan pembatalan.', 'warning');
                    return;
                  }
                  onCancelExpense(cancelingExpenseId, cancelReason.trim());
                  setCancelingExpenseId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
              >
                Ya, Batalkan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

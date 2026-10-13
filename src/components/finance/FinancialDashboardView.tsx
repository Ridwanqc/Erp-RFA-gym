import React, { useMemo } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import { CompanyExpense, Transaction, DailyClosingRecord, GymBranch, User as UserType } from '../../types';
import { formatRp, APP_TODAY } from '../../utils/formatters';

interface FinancialDashboardViewProps {
  expenses: CompanyExpense[];
  transactions: Transaction[];
  closingRecords: DailyClosingRecord[];
  branches: GymBranch[];
  activeBranchId: string;
  currentUser: UserType | null;
  onNavigateTab: (tab: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const FinancialDashboardView: React.FC<FinancialDashboardViewProps> = ({
  expenses,
  transactions,
  closingRecords,
  branches,
  activeBranchId,
  currentUser,
  onNavigateTab,
  showToast
}) => {
  // Current Month String
  const currentMonthPrefix = APP_TODAY.slice(0, 7); // e.g. "2026-10"

  // Filtered by branch if not ALL
  const branchExpenses = useMemo(() => {
    if (!activeBranchId || activeBranchId === 'ALL' || activeBranchId === 'BR-ALL') {
      return expenses;
    }
    return expenses.filter((e) => e.branchId === activeBranchId);
  }, [expenses, activeBranchId]);

  const branchTransactions = useMemo(() => {
    if (!activeBranchId || activeBranchId === 'ALL' || activeBranchId === 'BR-ALL') {
      return transactions.filter((t) => t.status !== 'VOID');
    }
    return transactions.filter((t) => t.status !== 'VOID' && (!t.branchId || t.branchId === activeBranchId));
  }, [transactions, activeBranchId]);

  // Metrics for Current Month
  const currentMonthRevenue = useMemo(() => {
    return branchTransactions
      .filter((t) => {
        const d = (t.date || '').slice(0, 7);
        return d === currentMonthPrefix;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [branchTransactions, currentMonthPrefix]);

  const currentMonthApprovedExpenses = useMemo(() => {
    return branchExpenses
      .filter((e) => {
        return (
          e.approvalStatus === 'Disetujui' &&
          e.date.startsWith(currentMonthPrefix) &&
          (e.accountingType === 'BEBAN_OPERASIONAL' ||
            e.accountingType === 'BEBAN_SDM' ||
            e.accountingType === 'BEBAN_FASILITAS' ||
            e.accountingType === 'BEBAN_FINANSIAL')
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [branchExpenses, currentMonthPrefix]);

  const currentMonthNetProfit = currentMonthRevenue - currentMonthApprovedExpenses;
  const netMarginPercent =
    currentMonthRevenue > 0
      ? Math.round((currentMonthNetProfit / currentMonthRevenue) * 1000) / 10
      : 0;

  // Pending Approvals
  const pendingApprovalsCount = useMemo(() => {
    return branchExpenses.filter((e) => e.approvalStatus === 'Menunggu Persetujuan').length;
  }, [branchExpenses]);

  // Unpaid Balance
  const unpaidExpensesBalance = useMemo(() => {
    return branchExpenses
      .filter((e) => e.approvalStatus === 'Disetujui' && e.paymentStatus !== 'Lunas')
      .reduce((sum, e) => sum + e.balanceRemaining, 0);
  }, [branchExpenses]);

  // Estimasi Saldo Kas Laci Kasir (Modal Awal + Kas Masuk Tunai - Kas Keluar Tunai yang Lunas)
  const estimatedDrawerCash = useMemo(() => {
    const todayCashSales = branchTransactions
      .filter((t) => {
        const d = (t.date || '').slice(0, 10);
        return d === APP_TODAY && t.method === 'Tunai';
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const todayCashExpenses = branchExpenses
      .filter((e) => {
        return (
          e.date === APP_TODAY &&
          e.approvalStatus === 'Disetujui' &&
          (e.paymentMethod === 'Kas' || e.sourceAccount.includes('Kas Laci')) &&
          e.paymentStatus === 'Lunas'
        );
      })
      .reduce((sum, e) => sum + e.paidAmount, 0);

    const baseFloat = 500000; // Modal awal laci kasir
    return Math.max(0, baseFloat + todayCashSales - todayCashExpenses);
  }, [branchTransactions, branchExpenses]);

  // Estimasi Saldo Rekening Bank Mandiri & BCA
  const bankBalances = useMemo(() => {
    // Mandiri: Omset via Transfer/Mandiri dikurangi pengeluaran dari Bank Mandiri
    const mandiriIn = branchTransactions
      .filter(
        (t) =>
          (t.method || '').toLowerCase().includes('transfer') ||
          (t.bankDest || '').toLowerCase().includes('mandiri')
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const mandiriOut = branchExpenses
      .filter((e) => e.sourceAccount.includes('Mandiri') && e.paidAmount > 0)
      .reduce((sum, e) => sum + e.paidAmount, 0);

    // BCA / Artha Graha: Omset via QRIS / EDC dikurangi pengeluaran dari Bank BCA
    const bcaIn = branchTransactions
      .filter(
        (t) =>
          (t.method || '').toLowerCase().includes('qris') ||
          (t.method || '').toLowerCase().includes('edc') ||
          (t.bankDest || '').toLowerCase().includes('artha') ||
          (t.bankDest || '').toLowerCase().includes('bca')
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const bcaOut = branchExpenses
      .filter((e) => (e.sourceAccount.includes('BCA') || e.sourceAccount.includes('Artha')) && e.paidAmount > 0)
      .reduce((sum, e) => sum + e.paidAmount, 0);

    return {
      mandiri: 45000000 + mandiriIn - mandiriOut,
      bca: 28500000 + bcaIn - bcaOut
    };
  }, [branchTransactions, branchExpenses]);

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Dashboard Keuangan ERP</h3>
              <p className="text-xs text-zinc-400">
                Pusat monitoring pendapatan, pengendalian beban operasional, posisi kas & bank, serta otorisasi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('input-pengeluaran')}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Input Pengeluaran Baru</span>
          </button>
        </div>
      </div>

      {/* Pending Approvals Alert Banner */}
      {pendingApprovalsCount > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-amber-200 block font-bold text-sm">
                Ada {pendingApprovalsCount} Pengajuan Pengeluaran Menunggu Persetujuan
              </strong>
              <span className="text-amber-400/80">
                Periksa dokumen bukti struk dan berikan otorisasi untuk kelancaran operasional.
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('persetujuan-pengeluaran')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition shrink-0"
          >
            Review Sekarang →
          </button>
        </div>
      )}

      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omset Bulan Ini */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Pendapatan Bulan Ini
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-2 block">
            {formatRp(currentMonthRevenue)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Membership, PT & POS Retail
          </span>
        </div>

        {/* Beban Pengeluaran Bulan Ini */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Beban Pengeluaran Bulan Ini
          </span>
          <span className="text-2xl font-black font-mono text-rose-400 mt-2 block">
            {formatRp(currentMonthApprovedExpenses)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Biaya operasional resmi disetujui
          </span>
        </div>

        {/* Laba Bersih Bulan Ini */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Laba Bersih Bulan Ini
          </span>
          <span className={`text-2xl font-black font-mono mt-2 block ${currentMonthNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRp(currentMonthNetProfit)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Margin Bersih: <strong className="text-orange-400">{netMarginPercent}%</strong>
          </span>
        </div>

        {/* Utang Pengeluaran Belum Lunas */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Utang Vendor / Belum Lunas
          </span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-2 block">
            {formatRp(unpaidExpensesBalance)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Tagihan disetujui menunggu pembayaran
          </span>
        </div>
      </div>

      {/* Saldo Kas & Rekening Bank Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Wallet className="w-4 h-4 text-orange-400" />
          <span>Posisi Kas & Rekening Bank Resmi RFA Gym</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kas Laci Kasir */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-semibold">Kas Laci Kasir (Hari Ini)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Fisik Kasir
              </span>
            </div>
            <span className="text-xl font-black font-mono text-white block">
              {formatRp(estimatedDrawerCash)}
            </span>
            <p className="text-[11px] text-zinc-500">
              Sinkron dengan Tutup Kasir Harian & pengeluaran kas tunai.
            </p>
          </div>

          {/* Bank Mandiri Operasional */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-semibold">Bank Mandiri (Operasional)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                Rek. 129009812
              </span>
            </div>
            <span className="text-xl font-black font-mono text-white block">
              {formatRp(bankBalances.mandiri)}
            </span>
            <p className="text-[11px] text-zinc-500">
              Rekening utama operasional, sewa & vendor equipment.
            </p>
          </div>

          {/* Bank BCA / Artha Graha */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-semibold">Bank BCA / Artha Graha</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                Penerimaan POS
              </span>
            </div>
            <span className="text-xl font-black font-mono text-white block">
              {formatRp(bankBalances.bca)}
            </span>
            <p className="text-[11px] text-zinc-500">
              Penampungan pembayaran EDC & settlement QRIS harian.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('laba-rugi')}
          className="p-4 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl text-left transition group"
        >
          <div className="p-2 rounded-xl bg-zinc-950 w-fit text-orange-400 group-hover:scale-110 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm text-white block mt-2">Laba Perusahaan</span>
          <span className="text-[11px] text-zinc-500 block">Laporan P&L terintegrasi</span>
        </button>

        <button
          onClick={() => onNavigateTab('riwayat-pengeluaran')}
          className="p-4 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl text-left transition group"
        >
          <div className="p-2 rounded-xl bg-zinc-950 w-fit text-orange-400 group-hover:scale-110 transition">
            <FileText className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm text-white block mt-2">Riwayat Pengeluaran</span>
          <span className="text-[11px] text-zinc-500 block">Buku kas & voucher belanja</span>
        </button>

        <button
          onClick={() => onNavigateTab('kategori-pengeluaran')}
          className="p-4 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl text-left transition group"
        >
          <div className="p-2 rounded-xl bg-zinc-950 w-fit text-orange-400 group-hover:scale-110 transition">
            <PieIcon className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm text-white block mt-2">Kategori Biaya</span>
          <span className="text-[11px] text-zinc-500 block">Master akun & akuntansi</span>
        </button>

        <button
          onClick={() => onNavigateTab('laporan-pengeluaran')}
          className="p-4 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl text-left transition group"
        >
          <div className="p-2 rounded-xl bg-zinc-950 w-fit text-orange-400 group-hover:scale-110 transition">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm text-white block mt-2">Laporan Analitis</span>
          <span className="text-[11px] text-zinc-500 block">Rekap & export Excel/PDF</span>
        </button>
      </div>

      {/* Recent Expenses List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-white">5 Transaksi Pengeluaran Terbaru</h4>
          <button
            onClick={() => onNavigateTab('riwayat-pengeluaran')}
            className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Lihat Semua Riwayat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {branchExpenses.slice(0, 5).map((exp) => (
            <div
              key={exp.id}
              className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="font-mono font-bold text-orange-400 shrink-0">
                  {exp.expenseNumber}
                </span>
                <div className="overflow-hidden">
                  <span className="font-semibold text-white block truncate">{exp.name}</span>
                  <span className="text-[11px] text-zinc-500">
                    {exp.date} • {exp.categoryName} • {exp.vendorOrBeneficiary}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-rose-400 block">
                  {formatRp(exp.amount)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    exp.approvalStatus === 'Disetujui'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : exp.approvalStatus === 'Menunggu Persetujuan'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {exp.approvalStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

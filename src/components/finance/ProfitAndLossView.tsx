import React, { useState, useMemo, useId } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Info,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { CompanyExpense, Transaction, GymBranch, User as UserType } from '../../types';
import { APP_TODAY, formatRp } from '../../utils/formatters';

interface ProfitAndLossViewProps {
  expenses: CompanyExpense[];
  transactions: Transaction[];
  branches: GymBranch[];
  activeBranchId: string;
  currentUser: UserType | null;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ProfitAndLossView: React.FC<ProfitAndLossViewProps> = ({
  expenses,
  transactions,
  branches,
  activeBranchId,
  currentUser,
  showToast
}) => {
  const pnlFilterPrefixId = useId();
  // Filter States
  const [selectedBranch, setSelectedBranch] = useState<string>(activeBranchId || 'ALL');
  const [periodPreset, setPeriodPreset] = useState<'MONTH' | 'YEAR' | 'ALL' | 'CUSTOM'>('MONTH');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(APP_TODAY);

  // Period Preset Handlers
  const handlePeriodChange = (preset: 'MONTH' | 'YEAR' | 'ALL') => {
    setPeriodPreset(preset);
    const today = new Date();
    if (preset === 'MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(APP_TODAY);
    } else if (preset === 'YEAR') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(APP_TODAY);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered Valid Transactions (Revenues)
  const filteredTrx = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status === 'VOID') return false;
      if (selectedBranch !== 'ALL' && t.branchId && t.branchId !== selectedBranch) return false;
      const tDate = (t.date || '').slice(0, 10);
      if (startDate && tDate && tDate < startDate) return false;
      if (endDate && tDate && tDate > endDate) return false;
      return true;
    });
  }, [transactions, selectedBranch, startDate, endDate]);

  // Filtered Valid Company Expenses (Only Approved / Posted Expenses, NOT Draft, NOT Rejected, NOT Canceled)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Hanya pengeluaran yang sudah disetujui / diposting secara sah
      if (e.approvalStatus !== 'Disetujui') return false;
      if (selectedBranch !== 'ALL' && e.branchId !== selectedBranch) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [expenses, selectedBranch, startDate, endDate]);

  // ==========================================
  // 1. REVENUE (PENDAPATAN KOTOR)
  // ==========================================
  const revenueSummary = useMemo(() => {
    let posRetail = 0;
    let membership = 0;
    let ptPackages = 0;
    let studioClass = 0;
    let otherIncome = 0;
    let cogsEstimated = 0; // HPP barang dagang

    filteredTrx.forEach((trx) => {
      const amount = trx.amount || 0;
      // Periksa jenis transaksi
      const type = (trx.type || trx.desc || (trx as any).items?.[0]?.name || '').toLowerCase();
      if (type.includes('membership') || type.includes('member') || type.includes('paket')) {
        membership += amount;
      } else if (type.includes('pt') || type.includes('personal trainer') || type.includes('trainer')) {
        ptPackages += amount;
      } else if (type.includes('kelas') || type.includes('studio') || type.includes('class')) {
        studioClass += amount;
      } else if (type.includes('retail') || type.includes('produk') || type.includes('pos') || type.includes('suplemen') || type.includes('minuman')) {
        posRetail += amount;
        // Estimasi HPP produk dagang rata-rata 60% dari harga jual retail
        cogsEstimated += amount * 0.6;
      } else {
        // Kategorisasi umum
        if (amount > 500000) {
          membership += amount;
        } else {
          posRetail += amount;
          cogsEstimated += amount * 0.6;
        }
      }
    });

    const totalGrossRevenue = filteredTrx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const grossProfit = totalGrossRevenue - cogsEstimated;

    return {
      posRetail,
      membership,
      ptPackages,
      studioClass,
      otherIncome,
      totalGrossRevenue,
      cogsEstimated,
      grossProfit
    };
  }, [filteredTrx]);

  // ==========================================
  // 2. OPERATING EXPENSES (BEBAN OPERASIONAL)
  // Real Accounting Mapping:
  // - Beban Operasional: mengurangi laba
  // - Beban SDM: mengurangi laba
  // - Beban Fasilitas: mengurangi laba
  // - Beban Finansial: mengurangi laba
  // - ASET_TETAP: Dikecualikan dari laba rugi (masuk Neraca/Aset Tetap)
  // - PERSEDIAAN: Dikecualikan dari laba rugi (masuk Neraca/Persediaan, HPP dihitung saat laku)
  // - PEMBAYARAN_UTANG: Dikecualikan dari laba rugi (mengurangi liabilitas)
  // ==========================================
  const expenseSummary = useMemo(() => {
    let bebanOperasionalRutin = 0;
    let bebanSDM = 0;
    let bebanFasilitas = 0;
    let bebanFinansial = 0;

    // Non-Operating / Balance Sheet (Aset & Utang)
    let asetTetapKapitalisasi = 0;
    let persediaanDibeli = 0;
    let pembayaranUtang = 0;

    const categoryBreakdown: Record<string, number> = {};

    filteredExpenses.forEach((exp) => {
      const amt = exp.amount;

      // Breakdown per kategori nama
      categoryBreakdown[exp.categoryName] = (categoryBreakdown[exp.categoryName] || 0) + amt;

      switch (exp.accountingType) {
        case 'BEBAN_OPERASIONAL':
          bebanOperasionalRutin += amt;
          break;
        case 'BEBAN_SDM':
          bebanSDM += amt;
          break;
        case 'BEBAN_FASILITAS':
          bebanFasilitas += amt;
          break;
        case 'BEBAN_FINANSIAL':
          bebanFinansial += amt;
          break;
        case 'ASET_TETAP':
          asetTetapKapitalisasi += amt;
          break;
        case 'PERSEDIAAN':
          persediaanDibeli += amt;
          break;
        case 'PEMBAYARAN_UTANG':
          pembayaranUtang += amt;
          break;
        default:
          bebanOperasionalRutin += amt;
          break;
      }
    });

    const totalOperatingExpenses =
      bebanOperasionalRutin + bebanSDM + bebanFasilitas + bebanFinansial;

    const totalNonExpenseCashOutflow =
      asetTetapKapitalisasi + persediaanDibeli + pembayaranUtang;

    return {
      bebanOperasionalRutin,
      bebanSDM,
      bebanFasilitas,
      bebanFinansial,
      totalOperatingExpenses,
      asetTetapKapitalisasi,
      persediaanDibeli,
      pembayaranUtang,
      totalNonExpenseCashOutflow,
      categoryBreakdown
    };
  }, [filteredExpenses]);

  // ==========================================
  // 3. NET PROFIT (LABA BERSIH) & MARGIN
  // ==========================================
  const netProfit = revenueSummary.grossProfit - expenseSummary.totalOperatingExpenses;
  const netMarginPercent =
    revenueSummary.totalGrossRevenue > 0
      ? Math.round((netProfit / revenueSummary.totalGrossRevenue) * 1000) / 10
      : 0;

  // Export P&L to Excel
  const handleExportExcel = () => {
    try {
      const pnlData = [
        { 'Komponen Laporan': '1. PENDAPATAN OPERASIONAL (REVENUES)', 'Nominal (Rp)': '' },
        { 'Komponen Laporan': '  - Penjualan Membership Gym', 'Nominal (Rp)': revenueSummary.membership },
        { 'Komponen Laporan': '  - Paket Personal Trainer (PT)', 'Nominal (Rp)': revenueSummary.ptPackages },
        { 'Komponen Laporan': '  - POS Retail (Suplemen, Minuman, Merchandise)', 'Nominal (Rp)': revenueSummary.posRetail },
        { 'Komponen Laporan': '  - Studio Class & Tiket Harian', 'Nominal (Rp)': revenueSummary.studioClass },
        { 'Komponen Laporan': 'TOTAL PENDAPATAN KOTOR (GROSS REVENUE)', 'Nominal (Rp)': revenueSummary.totalGrossRevenue },
        { 'Komponen Laporan': '', 'Nominal (Rp)': '' },
        { 'Komponen Laporan': '2. BEBAN POKOK PENJUALAN (HPP)', 'Nominal (Rp)': '' },
        { 'Komponen Laporan': '  - HPP Produk Dagang POS Retail', 'Nominal (Rp)': -revenueSummary.cogsEstimated },
        { 'Komponen Laporan': 'LABA KOTOR (GROSS PROFIT)', 'Nominal (Rp)': revenueSummary.grossProfit },
        { 'Komponen Laporan': '', 'Nominal (Rp)': '' },
        { 'Komponen Laporan': '3. BEBAN OPERASIONAL (OPERATING EXPENSES)', 'Nominal (Rp)': '' },
        { 'Komponen Laporan': '  - Biaya Operasional Rutin (Listrik, Air, WiFi, Kebersihan)', 'Nominal (Rp)': -expenseSummary.bebanOperasionalRutin },
        { 'Komponen Laporan': '  - Biaya SDM (Gaji Karyawan, Komisi Trainer, Lembur)', 'Nominal (Rp)': -expenseSummary.bebanSDM },
        { 'Komponen Laporan': '  - Biaya Fasilitas & Pemeliharaan (Service Alat Gym, AC)', 'Nominal (Rp)': -expenseSummary.bebanFasilitas },
        { 'Komponen Laporan': '  - Biaya Finansial & Lainnya (Sewa Gedung, Pajak, Adm Bank)', 'Nominal (Rp)': -expenseSummary.bebanFinansial },
        { 'Komponen Laporan': 'TOTAL BEBAN OPERASIONAL', 'Nominal (Rp)': -expenseSummary.totalOperatingExpenses },
        { 'Komponen Laporan': '', 'Nominal (Rp)': '' },
        { 'Komponen Laporan': '4. LABA BERSIH PERUSAHAAN (NET PROFIT)', 'Nominal (Rp)': netProfit },
        { 'Komponen Laporan': 'MARGIN LABA BERSIH (%)', 'Nominal (Rp)': `${netMarginPercent}%` },
        { 'Komponen Laporan': '', 'Nominal (Rp)': '' },
        { 'Komponen Laporan': '5. TRANSAKSI NON-BEBAN (NERACA / ARUS KAS KELUAR)', 'Nominal (Rp)': '' },
        { 'Komponen Laporan': '  - Pembelian Aset Tetap Baru (Mesin Gym, Komputer)', 'Nominal (Rp)': expenseSummary.asetTetapKapitalisasi },
        { 'Komponen Laporan': '  - Pembelian Persediaan Dagang Belum Terjual', 'Nominal (Rp)': expenseSummary.persediaanDibeli },
        { 'Komponen Laporan': '  - Pembayaran Utang Vendor / Pokok Pinjaman', 'Nominal (Rp)': expenseSummary.pembayaranUtang }
      ];

      const ws = XLSX.utils.json_to_sheet(pnlData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laba Perusahaan');

      const fileName = `Laporan_Laba_Rugi_RFA_GYM_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast('Export Berhasil', `File ${fileName} berhasil diunduh.`, 'success');
    } catch (err: any) {
      showToast('Gagal Export', err.message, 'error');
    }
  };

  // Export P&L to PDF
  const handleExportPdf = () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 15;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(24, 24, 27);
      pdf.text('RFA GYM & FITNESS CENTER', margin, 15);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text('LAPORAN LABA RUGI PERUSAHAAN (PROFIT & LOSS STATEMENT)', margin, 20);

      pdf.setFontSize(8);
      pdf.text(
        `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'} | Cabang: ${selectedBranch === 'ALL' ? 'Semua Cabang' : selectedBranch}`,
        margin,
        25
      );

      pdf.setDrawColor(249, 115, 22);
      pdf.setLineWidth(0.8);
      pdf.line(margin, 28, 195, 28);

      let y = 36;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(234, 88, 12);
      pdf.text('1. PENDAPATAN OPERASIONAL', margin, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(24, 24, 27);
      pdf.text('Penjualan Membership:', margin + 4, y);
      pdf.text(formatRp(revenueSummary.membership), 195, y, { align: 'right' });
      y += 5;
      pdf.text('Paket Personal Trainer:', margin + 4, y);
      pdf.text(formatRp(revenueSummary.ptPackages), 195, y, { align: 'right' });
      y += 5;
      pdf.text('POS Retail & Minuman:', margin + 4, y);
      pdf.text(formatRp(revenueSummary.posRetail), 195, y, { align: 'right' });
      y += 5;

      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL PENDAPATAN KOTOR:', margin, y);
      pdf.text(formatRp(revenueSummary.totalGrossRevenue), 195, y, { align: 'right' });
      y += 8;

      pdf.text('2. BEBAN OPERASIONAL RESMI', margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('Beban Operasional Rutin (Listrik, Air, WiFi, dll):', margin + 4, y);
      pdf.text('-' + formatRp(expenseSummary.bebanOperasionalRutin), 195, y, { align: 'right' });
      y += 5;
      pdf.text('Beban SDM & Gaji (Gaji, Komisi Trainer):', margin + 4, y);
      pdf.text('-' + formatRp(expenseSummary.bebanSDM), 195, y, { align: 'right' });
      y += 5;
      pdf.text('Beban Fasilitas & Pemeliharaan (Service Alat):', margin + 4, y);
      pdf.text('-' + formatRp(expenseSummary.bebanFasilitas), 195, y, { align: 'right' });
      y += 5;
      pdf.text('Beban Finansial & Lainnya (Sewa, Pajak):', margin + 4, y);
      pdf.text('-' + formatRp(expenseSummary.bebanFinansial), 195, y, { align: 'right' });
      y += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL BEBAN OPERASIONAL:', margin, y);
      pdf.text('-' + formatRp(expenseSummary.totalOperatingExpenses), 195, y, { align: 'right' });
      y += 10;

      // Net Profit Box
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, y - 5, 180, 14, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor(netProfit >= 0 ? 16 : 220, netProfit >= 0 ? 149 : 38, netProfit >= 0 ? 106 : 38);
      pdf.text(`LABA BERSIH (NET PROFIT): ${formatRp(netProfit)} (Margin: ${netMarginPercent}%)`, margin + 4, y + 4);

      const fileName = `Laporan_Laba_Rugi_RFA_GYM_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      showToast('Export Berhasil', `File PDF ${fileName} berhasil diunduh.`, 'success');
    } catch (err: any) {
      showToast('Gagal Export', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header & Filter Card */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Laporan Laba Perusahaan (Profit & Loss)</h3>
              <p className="text-xs text-zinc-400">
                Integrasi real-time Omset Penjualan, HPP, Beban Operasional resmi, dan Laba Bersih
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => handlePeriodChange('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodPreset === 'MONTH' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handlePeriodChange('YEAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodPreset === 'YEAR' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => handlePeriodChange('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodPreset === 'ALL' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          {/* Cabang Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Konsolidasi Seluruh Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Export Buttons */}
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Export Excel Laba Rugi"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Export PDF Laba Rugi"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Pendapatan Kotor (Omset)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-2 block">
            {formatRp(revenueSummary.totalGrossRevenue)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {filteredTrx.length} transaksi penerimaan kas/bank
          </span>
        </div>

        {/* Total Beban Operasional */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Beban Operasional</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-rose-400 mt-2 block">
            {formatRp(expenseSummary.totalOperatingExpenses)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Pengeluaran terotorisasi & diposting
          </span>
        </div>

        {/* Laba Bersih */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Laba Bersih (Net Profit)</span>
            <div className={`p-2 rounded-xl ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black font-mono mt-2 block ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRp(netProfit)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Omset - HPP - Beban Operasional
          </span>
        </div>

        {/* Net Profit Margin */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Margin Laba Bersih</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-orange-400 mt-2 block">
            {netMarginPercent}%
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Rasio efisiensi laba bersih operasional
          </span>
        </div>
      </div>

      {/* Accounting Clarification Note */}
      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-start gap-3 text-xs text-zinc-400">
        <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-zinc-200 block">Kepatuhan Standar Akuntansi ERP RFA Gym:</strong>
          <p className="leading-relaxed">
            Pengeluaran kas untuk <strong>Pembelian Aset Tetap ({formatRp(expenseSummary.asetTetapKapitalisasi)})</strong>,{' '}
            <strong>Persediaan Barang Dagang ({formatRp(expenseSummary.persediaanDibeli)})</strong>, dan{' '}
            <strong>Pelunasan Utang Vendor ({formatRp(expenseSummary.pembayaranUtang)})</strong> dicatat pada Neraca & Arus Kas,{' '}
            <em>tidak memotong laba rugi berjalan secara langsung</em>. Hanya transaksi bertipe beban yang diakui dalam laporan ini.
          </p>
        </div>
      </div>

      {/* Main Income Statement Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Statement Table */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">Rincian Laporan Laba Rugi</h4>
            <span className="text-xs text-zinc-400">Mata Uang: IDR (Rp)</span>
          </div>

          <div className="p-6 space-y-6 text-xs">
            {/* 1. Pendapatan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-sm text-emerald-400 border-b border-zinc-800 pb-2">
                <span>1. PENDAPATAN OPERASIONAL</span>
                <span className="font-mono">{formatRp(revenueSummary.totalGrossRevenue)}</span>
              </div>
              <div className="space-y-1.5 pl-3 text-zinc-300">
                <div className="flex justify-between">
                  <span>Penjualan Membership Gym</span>
                  <span className="font-mono">{formatRp(revenueSummary.membership)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paket Personal Trainer (PT)</span>
                  <span className="font-mono">{formatRp(revenueSummary.ptPackages)}</span>
                </div>
                <div className="flex justify-between">
                  <span>POS Retail & Suplemen Minuman</span>
                  <span className="font-mono">{formatRp(revenueSummary.posRetail)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Studio Class & Kunjungan Harian</span>
                  <span className="font-mono">{formatRp(revenueSummary.studioClass)}</span>
                </div>
              </div>
            </div>

            {/* 2. HPP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-zinc-300 border-b border-zinc-800 pb-2">
                <span>2. BEBAN POKOK PENJUALAN (HPP)</span>
                <span className="font-mono text-rose-400">-{formatRp(revenueSummary.cogsEstimated)}</span>
              </div>
              <div className="pl-3 text-zinc-400 flex justify-between">
                <span>HPP Produk Retail & Suplemen yang Terjual</span>
                <span className="font-mono">-{formatRp(revenueSummary.cogsEstimated)}</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-200 pt-1">
                <span>LABA KOTOR (GROSS PROFIT)</span>
                <span className="font-mono text-emerald-400">{formatRp(revenueSummary.grossProfit)}</span>
              </div>
            </div>

            {/* 3. Beban Operasional */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-sm text-rose-400 border-b border-zinc-800 pb-2">
                <span>3. BEBAN OPERASIONAL (EXPENSES)</span>
                <span className="font-mono">-{formatRp(expenseSummary.totalOperatingExpenses)}</span>
              </div>
              <div className="space-y-1.5 pl-3 text-zinc-300">
                <div className="flex justify-between">
                  <span>Beban Operasional Rutin (Listrik, Air, WiFi, Kebersihan, ATK)</span>
                  <span className="font-mono text-rose-400">-{formatRp(expenseSummary.bebanOperasionalRutin)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beban SDM & Karyawan (Gaji, Komisi Trainer, Lembur)</span>
                  <span className="font-mono text-rose-400">-{formatRp(expenseSummary.bebanSDM)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beban Fasilitas & Pemeliharaan (Service Alat Gym, AC, Gedung)</span>
                  <span className="font-mono text-rose-400">-{formatRp(expenseSummary.bebanFasilitas)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beban Finansial & Lainnya (Sewa Gedung, Bunga, Pajak, Adm Bank)</span>
                  <span className="font-mono text-rose-400">-{formatRp(expenseSummary.bebanFinansial)}</span>
                </div>
              </div>
            </div>

            {/* 4. Total Laba Bersih */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between font-black text-base">
              <div>
                <span className="text-zinc-200 block">LABA BERSIH BERJALAN (NET PROFIT)</span>
                <span className="text-xs text-zinc-500 font-normal">Margin Bersih: {netMarginPercent}%</span>
              </div>
              <span className={`font-mono text-xl ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatRp(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Breakdown Beban & Non-Expense Capital Outflows */}
        <div className="space-y-6">
          {/* Breakdown per Kategori */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-orange-400" />
              <span>Breakdown Pengeluaran Terbesar</span>
            </h4>

            <div className="space-y-2.5">
              {Object.keys(expenseSummary.categoryBreakdown).length > 0 ? (
                Object.entries(expenseSummary.categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([catName, amt], idx) => {
                    const pct =
                      expenseSummary.totalOperatingExpenses > 0
                        ? Math.round((amt / expenseSummary.totalOperatingExpenses) * 100)
                        : 0;
                    return (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between text-zinc-300">
                          <span className="truncate max-w-[160px] font-medium">{catName}</span>
                          <span className="font-mono font-bold">{formatRp(amt)}</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-orange-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-xs text-zinc-500 italic">Belum ada pengeluaran pada periode ini.</p>
              )}
            </div>
          </div>

          {/* Arus Kas Keluar Non-Beban (Neraca) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl text-xs">
            <h4 className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 text-[11px]">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Arus Kas Keluar Non-Beban (Neraca)</span>
            </h4>
            <div className="space-y-2 divide-y divide-zinc-800 text-zinc-400">
              <div className="pt-1.5 flex justify-between">
                <span>Pembelian Alat Gym Baru (Aset Tetap):</span>
                <span className="font-mono font-bold text-zinc-200">
                  {formatRp(expenseSummary.asetTetapKapitalisasi)}
                </span>
              </div>
              <div className="pt-1.5 flex justify-between">
                <span>Stok Persediaan Suplemen Baru:</span>
                <span className="font-mono font-bold text-zinc-200">
                  {formatRp(expenseSummary.persediaanDibeli)}
                </span>
              </div>
              <div className="pt-1.5 flex justify-between">
                <span>Pembayaran Utang / Cicilan Pokok:</span>
                <span className="font-mono font-bold text-zinc-200">
                  {formatRp(expenseSummary.pembayaranUtang)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 italic pt-1">
              *Tercatat pada neraca aset & mengurangi saldo kas/bank saat dibayar, tidak memotong laba berjalan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

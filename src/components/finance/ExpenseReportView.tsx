import React, { useState, useMemo, useId } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Building2,
  Tag,
  CreditCard,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { CompanyExpense, ExpenseCategory, GymBranch, User as UserType } from '../../types';
import { formatRp, APP_TODAY } from '../../utils/formatters';

interface ExpenseReportViewProps {
  expenses: CompanyExpense[];
  categories: ExpenseCategory[];
  branches: GymBranch[];
  activeBranchId: string;
  currentUser: UserType | null;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ExpenseReportView: React.FC<ExpenseReportViewProps> = ({
  expenses,
  categories,
  branches,
  activeBranchId,
  currentUser,
  showToast
}) => {
  const expenseReportFilterPrefixId = useId();
  const [selectedBranch, setSelectedBranch] = useState<string>(activeBranchId || 'ALL');
  const [reportType, setReportType] = useState<'KATEGORI' | 'CABANG' | 'METODE'>('KATEGORI');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(APP_TODAY);

  // Filtered Approved Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.approvalStatus !== 'Disetujui') return false;
      if (selectedBranch !== 'ALL' && e.branchId !== selectedBranch) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [expenses, selectedBranch, startDate, endDate]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // 1. Group by Category
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; total: number; group: string; accountingType: string }> = {};

    filteredExpenses.forEach((exp) => {
      if (!map[exp.categoryName]) {
        map[exp.categoryName] = {
          count: 0,
          total: 0,
          group: exp.categoryId,
          accountingType: exp.accountingType
        };
      }
      map[exp.categoryName].count += 1;
      map[exp.categoryName].total += exp.amount;
    });

    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [filteredExpenses]);

  // 2. Group by Branch
  const branchStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};

    filteredExpenses.forEach((exp) => {
      const bName = exp.branchName || 'Cabang Utama';
      if (!map[bName]) {
        map[bName] = { count: 0, total: 0 };
      }
      map[bName].count += 1;
      map[bName].total += exp.amount;
    });

    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [filteredExpenses]);

  // 3. Group by Payment Method & Source
  const methodStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};

    filteredExpenses.forEach((exp) => {
      const key = `${exp.paymentMethod} (${exp.sourceAccount})`;
      if (!map[key]) {
        map[key] = { count: 0, total: 0 };
      }
      map[key].count += 1;
      map[key].total += exp.amount;
    });

    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [filteredExpenses]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const rows =
        reportType === 'KATEGORI'
          ? categoryStats.map(([cat, stat], i) => ({
              'No': i + 1,
              'Kategori Pengeluaran': cat,
              'Perlakuan Akuntansi': stat.accountingType.replace(/_/g, ' '),
              'Jumlah Transaksi': stat.count,
              'Total Pengeluaran (Rp)': stat.total,
              'Persentase (%)': totalExpenseAmount > 0 ? `${Math.round((stat.total / totalExpenseAmount) * 100)}%` : '0%'
            }))
          : reportType === 'CABANG'
          ? branchStats.map(([br, stat], i) => ({
              'No': i + 1,
              'Nama Cabang': br,
              'Jumlah Transaksi': stat.count,
              'Total Pengeluaran (Rp)': stat.total,
              'Persentase (%)': totalExpenseAmount > 0 ? `${Math.round((stat.total / totalExpenseAmount) * 100)}%` : '0%'
            }))
          : methodStats.map(([meth, stat], i) => ({
              'No': i + 1,
              'Metode & Sumber Rekening': meth,
              'Jumlah Transaksi': stat.count,
              'Total Pengeluaran (Rp)': stat.total,
              'Persentase (%)': totalExpenseAmount > 0 ? `${Math.round((stat.total / totalExpenseAmount) * 100)}%` : '0%'
            }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Laporan_${reportType}`);

      const fileName = `Laporan_Pengeluaran_RFA_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast('Export Berhasil', `File ${fileName} berhasil diunduh.`, 'success');
    } catch (err: any) {
      showToast('Gagal Export', err.message, 'error');
    }
  };

  // Export to PDF
  const handleExportPdf = () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 15;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(24, 24, 27);
      pdf.text('RFA GYM - LAPORAN ANALITIS PENGELUARAN', margin, 15);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Jenis: Rekap ${reportType} | Periode: ${startDate} s/d ${endDate} | Total: ${formatRp(totalExpenseAmount)}`,
        margin,
        20
      );

      pdf.setDrawColor(249, 115, 22);
      pdf.setLineWidth(0.8);
      pdf.line(margin, 23, 195, 23);

      let y = 32;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(24, 24, 27);

      pdf.text('No.', margin, y);
      pdf.text('Nama Kelompok / Kategori', margin + 10, y);
      pdf.text('Trx', margin + 100, y);
      pdf.text('Total (Rp)', margin + 130, y);
      pdf.text('Porsi', margin + 165, y);

      y += 5;
      pdf.setFont('helvetica', 'normal');

      const dataToPrint =
        reportType === 'KATEGORI' ? categoryStats : reportType === 'CABANG' ? branchStats : methodStats;

      dataToPrint.forEach(([label, stat], idx) => {
        pdf.text(String(idx + 1), margin, y);
        pdf.text(label.slice(0, 40), margin + 10, y);
        pdf.text(String(stat.count), margin + 100, y);
        pdf.text(formatRp(stat.total), margin + 130, y);
        const pct = totalExpenseAmount > 0 ? Math.round((stat.total / totalExpenseAmount) * 100) : 0;
        pdf.text(`${pct}%`, margin + 165, y);
        y += 6;
      });

      const fileName = `Laporan_Analitis_Pengeluaran_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      showToast('Export Berhasil', `File PDF ${fileName} berhasil diunduh.`, 'success');
    } catch (err: any) {
      showToast('Gagal Export', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header Banner */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Laporan Pengeluaran Analitis</h3>
            <p className="text-xs text-zinc-400">
              Rekapitulasi beban operasional per kategori, per cabang, serta analisis sumber rekening pembayaran
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Tab Select */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Toggle Report Type */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setReportType('KATEGORI')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              reportType === 'KATEGORI' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Rekap per Kategori
          </button>
          <button
            onClick={() => setReportType('CABANG')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              reportType === 'CABANG' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Rekap per Cabang
          </button>
          <button
            onClick={() => setReportType('METODE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              reportType === 'METODE' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Rekap per Sumber Dana
          </button>
        </div>

        {/* Date Filter & Branch */}
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label htmlFor={`${expenseReportFilterPrefixId}-filter-branch`} className="sr-only">Filter Cabang</label>
            <select
              id={`${expenseReportFilterPrefixId}-filter-branch`}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="text-zinc-500 text-[11px]">Dari:</span>
            <label htmlFor={`${expenseReportFilterPrefixId}-filter-start-date`} className="sr-only">Tanggal Mulai</label>
            <input
              id={`${expenseReportFilterPrefixId}-filter-start-date`}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none"
            />
            <span className="text-zinc-500 text-[11px] ml-1">S/d:</span>
            <label htmlFor={`${expenseReportFilterPrefixId}-filter-end-date`} className="sr-only">Tanggal Selesai</label>
            <input
              id={`${expenseReportFilterPrefixId}-filter-end-date`}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Big Total Banner */}
      <div className="p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
            Total Pengeluaran Terverifikasi Periode Ini
          </span>
          <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">
            {formatRp(totalExpenseAmount)}
          </span>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <span className="block font-bold text-zinc-200">{filteredExpenses.length} Transaksi</span>
          <span>Hanya transaksi disetujui</span>
        </div>
      </div>

      {/* Table & Visual Bars */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4">
                  {reportType === 'KATEGORI'
                    ? 'Kategori Pengeluaran'
                    : reportType === 'CABANG'
                    ? 'Nama Cabang'
                    : 'Metode & Sumber Rekening'}
                </th>
                <th className="py-3 px-4 text-center w-28">Jumlah Trx</th>
                <th className="py-3 px-4 text-right w-44">Total Biaya (Rp)</th>
                <th className="py-3 px-4 w-60">Porsi Pengeluaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {reportType === 'KATEGORI' &&
                categoryStats.map(([cat, stat], idx) => {
                  const pct =
                    totalExpenseAmount > 0
                      ? Math.round((stat.total / totalExpenseAmount) * 100)
                      : 0;
                  return (
                    <tr key={idx} className="hover:bg-zinc-800/40">
                      <td className="py-3 px-4 text-center text-zinc-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{cat}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {stat.accountingType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{stat.count}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {formatRp(stat.total)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-zinc-400 w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {reportType === 'CABANG' &&
                branchStats.map(([br, stat], idx) => {
                  const pct =
                    totalExpenseAmount > 0
                      ? Math.round((stat.total / totalExpenseAmount) * 100)
                      : 0;
                  return (
                    <tr key={idx} className="hover:bg-zinc-800/40">
                      <td className="py-3 px-4 text-center text-zinc-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-white">{br}</td>
                      <td className="py-3 px-4 text-center font-mono">{stat.count}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {formatRp(stat.total)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-zinc-400 w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {reportType === 'METODE' &&
                methodStats.map(([meth, stat], idx) => {
                  const pct =
                    totalExpenseAmount > 0
                      ? Math.round((stat.total / totalExpenseAmount) * 100)
                      : 0;
                  return (
                    <tr key={idx} className="hover:bg-zinc-800/40">
                      <td className="py-3 px-4 text-center text-zinc-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-white">{meth}</td>
                      <td className="py-3 px-4 text-center font-mono">{stat.count}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {formatRp(stat.total)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-zinc-400 w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    Belum ada data pengeluaran yang disetujui pada periode dan filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

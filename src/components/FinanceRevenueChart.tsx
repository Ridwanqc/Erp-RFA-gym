import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar,
  Percent,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Sparkles,
  Table as TableIcon,
  LineChart as ChartIcon,
  Info
} from 'lucide-react';
import { Transaction } from '../types';
import { formatRp, APP_TODAY, formatDateIndo } from '../utils/formatters';

interface FinanceRevenueChartProps {
  transactions: Transaction[];
}

export const FinanceRevenueChart: React.FC<FinanceRevenueChartProps> = ({ transactions }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [visibleLines, setVisibleLines] = useState<{ total: boolean; installment: boolean }>({
    total: true,
    installment: true
  });

  // Calculate past 7 days series relative to APP_TODAY
  const { chartData, totals, peakDay } = useMemo(() => {
    const dates: { dateStr: string; dayLabel: string; shortDay: string; fullDate: string }[] = [];
    const base = new Date(APP_TODAY + 'T00:00:00');
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = i === 0;
      const shortDay = dayNames[d.getDay()];
      const dayLabel = isToday ? 'Hari Ini' : `${shortDay}, ${dd}/${mm}`;
      const fullDate = `${shortDay}, ${dd} ${d.toLocaleDateString('id-ID', { month: 'short' })} ${yyyy}`;

      dates.push({ dateStr, dayLabel, shortDay, fullDate });
    }

    let sumTotalPayments = 0;
    let sumNewInstallments = 0;
    let sumRegularPayments = 0;
    let sumInstallmentRepayments = 0;
    let maxPayment = -1;
    let peakDayLabel = '-';

    const data = dates.map((day) => {
      const dayTrx = transactions.filter((t) => t.date === day.dateStr && t.status !== 'VOID');

      let totalPayments = 0;
      let newInstallmentIncome = 0;
      let installmentRepayments = 0;
      let regularPayments = 0;
      let newInstallmentCount = 0;

      for (const t of dayTrx) {
        if (t.id.startsWith('PAY-') || t.type === 'Pelunasan Cicilan') {
          // Installment debt repayment collected on this day
          totalPayments += t.amount;
          installmentRepayments += t.amount;
        } else if (
          t.method === 'Cicilan 2x' ||
          t.status === 'DP 50%' ||
          (t.amountRemaining && t.amountRemaining > 0)
        ) {
          // New installment plan / DP initiated on this day
          const dpOrPaid = t.initialCashPaid !== undefined ? t.initialCashPaid : (t.amountPaid || 0);
          totalPayments += dpOrPaid;
          newInstallmentIncome += dpOrPaid;
          newInstallmentCount += 1;
        } else if (t.status === 'Paid') {
          // Full regular payment (POS, full membership, full PT)
          const amt = t.amountPaid || t.amount;
          totalPayments += amt;
          regularPayments += amt;
        } else if (t.amountPaid && t.amountPaid > 0) {
          const amt = t.initialCashPaid !== undefined ? t.initialCashPaid : t.amountPaid;
          totalPayments += amt;
          regularPayments += amt;
        }
      }

      sumTotalPayments += totalPayments;
      sumNewInstallments += newInstallmentIncome;
      sumRegularPayments += regularPayments;
      sumInstallmentRepayments += installmentRepayments;

      if (totalPayments > maxPayment) {
        maxPayment = totalPayments;
        peakDayLabel = day.dayLabel;
      }

      return {
        dateStr: day.dateStr,
        dayLabel: day.dayLabel,
        fullDate: day.fullDate,
        totalPayments,
        newInstallmentIncome,
        regularPayments,
        installmentRepayments,
        transactionCount: dayTrx.length,
        newInstallmentCount
      };
    });

    return {
      chartData: data,
      totals: {
        totalPayments: sumTotalPayments,
        newInstallmentIncome: sumNewInstallments,
        regularPayments: sumRegularPayments,
        installmentRepayments: sumInstallmentRepayments,
        installmentRatio: sumTotalPayments > 0 ? (sumNewInstallments / sumTotalPayments) * 100 : 0
      },
      peakDay: {
        label: peakDayLabel,
        amount: maxPayment > 0 ? maxPayment : 0
      }
    };
  }, [transactions]);

  // Format compact Rupiah for YAxis labels
  const formatYAxis = (val: number) => {
    if (val >= 1000000) {
      const jt = val / 1000000;
      return `${jt % 1 === 0 ? jt : jt.toFixed(1)} jt`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)} rb`;
    }
    return String(val);
  };

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[240px] space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {data.fullDate}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {data.transactionCount} trx
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20"></span>
                <span className="text-zinc-300 font-semibold">Total Payments</span>
              </div>
              <span className="font-black text-emerald-400 font-mono text-sm">
                {formatRp(data.totalPayments)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-500/20"></span>
                <span className="text-zinc-300 font-semibold">New Installment</span>
              </div>
              <span className="font-black text-amber-400 font-mono text-sm">
                {formatRp(data.newInstallmentIncome)}
              </span>
            </div>
          </div>

          {/* Breakdown mini badges */}
          <div className="bg-zinc-900/90 rounded-xl p-2 border border-zinc-800/80 space-y-1 text-[10px]">
            <div className="flex justify-between text-zinc-400">
              <span>Pembayaran Penuh / POS:</span>
              <span className="text-zinc-200 font-medium">{formatRp(data.regularPayments)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>DP Kontrak Cicilan Baru ({data.newInstallmentCount}x):</span>
              <span className="text-amber-300 font-medium">{formatRp(data.newInstallmentIncome)}</span>
            </div>
            {data.installmentRepayments > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Pelunasan Tagihan Cicilan:</span>
                <span className="text-cyan-300 font-medium">{formatRp(data.installmentRepayments)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden transition">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-80 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Tren Pendapatan Harian & Arus Cicilan
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-wide">
                7 Hari Terakhir
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Komparasi penerimaan kas/bank masuk (<span className="text-emerald-400 font-bold">Total Payments</span>) vs uang muka cicilan baru (<span className="text-amber-400 font-bold">New Installment Income</span>).
            </p>
          </div>
        </div>

        {/* View mode toggle & collapse */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'chart'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tampilkan grafik garis Recharts"
            >
              <ChartIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grafik</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tampilkan tabel rincian"
            >
              <TableIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Tabel</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 p-2 rounded-xl transition"
            title={isExpanded ? 'Ciutkan ringkasan tren' : 'Buka ringkasan tren'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-5">
          {/* 4 Quick Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Total Payments (7 Days) */}
            <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-3.5 transition hover:border-emerald-500/30">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Total Payments (7H)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Masuk</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white tracking-tight">
                {formatRp(totals.totalPayments)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                Seluruh penerimaan kas & bank 7 hari
              </p>
            </div>

            {/* 2. New Installment Income */}
            <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-3.5 transition hover:border-amber-500/30">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> New Installment (7H)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">DP Baru</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-amber-400 tracking-tight">
                {formatRp(totals.newInstallmentIncome)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                Pendapatan uang muka paket cicilan baru
              </p>
            </div>

            {/* 3. Installment Share Ratio */}
            <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-3.5 transition hover:border-cyan-500/30">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Rasio Cicilan Baru
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Pangsa</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-cyan-400 tracking-tight">
                {totals.installmentRatio.toFixed(1)}%
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                Kontribusi cicilan terhadap total penerimaan
              </p>
            </div>

            {/* 4. Peak Day */}
            <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-3.5 transition hover:border-orange-500/30">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Puncak Pembayaran
                </span>
                <span className="text-[10px] text-orange-300 font-semibold">{peakDay.label}</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-orange-400 tracking-tight">
                {formatRp(peakDay.amount)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                Volume pembayaran harian tertinggi
              </p>
            </div>
          </div>

          {/* VIEW MODE 1: RECHARTS LINE CHART */}
          {viewMode === 'chart' ? (
            <div className="space-y-3">
              {/* Interactive Legend / Line Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      setVisibleLines((prev) => ({ ...prev, total: !prev.total }))
                    }
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl transition border ${
                      visibleLines.total
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 line-through'
                    }`}
                  >
                    <span
                      className={`w-3 h-1 rounded-full ${
                        visibleLines.total ? 'bg-emerald-400' : 'bg-zinc-600'
                      }`}
                    />
                    <span className="font-bold">Total Payments</span>
                  </button>

                  <button
                    onClick={() =>
                      setVisibleLines((prev) => ({ ...prev, installment: !prev.installment }))
                    }
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl transition border ${
                      visibleLines.installment
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 line-through'
                    }`}
                  >
                    <span
                      className={`w-3 h-1 rounded-full ${
                        visibleLines.installment ? 'bg-amber-400' : 'bg-zinc-600'
                      }`}
                    />
                    <span className="font-bold">New Installment Income</span>
                  </button>
                </div>

                <span className="text-[11px] text-zinc-400 hidden sm:flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-zinc-400" />
                  Arahkan kursor pada titik grafik untuk rincian transaksi harian
                </span>
              </div>

              {/* Recharts Container */}
              <div className="h-[280px] w-full bg-zinc-950/40 border border-zinc-800/80 rounded-2xl pt-4 pr-3 pb-1 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="dayLabel"
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
                      tickFormatter={formatYAxis}
                      width={65}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {visibleLines.total && (
                      <Line
                        type="monotone"
                        dataKey="totalPayments"
                        name="Total Payments"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', stroke: '#09090b', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#34d399', stroke: '#09090b', strokeWidth: 2 }}
                      />
                    )}
                    {visibleLines.installment && (
                      <Line
                        type="monotone"
                        dataKey="newInstallmentIncome"
                        name="New Installment Income"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#f59e0b', stroke: '#09090b', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#fbbf24', stroke: '#09090b', strokeWidth: 2 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: TABULAR AUDIT BREAKDOWN */
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-right">Total Payments</th>
                    <th className="py-3 px-4 text-right">New Installment Income</th>
                    <th className="py-3 px-4 text-right">Pelunasan Cicilan</th>
                    <th className="py-3 px-4 text-right">Reguler / POS</th>
                    <th className="py-3 px-4 text-center">Rasio Cicilan</th>
                    <th className="py-3 px-4 text-center">Jml Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {chartData.map((row) => {
                    const ratio =
                      row.totalPayments > 0
                        ? (row.newInstallmentIncome / row.totalPayments) * 100
                        : 0;
                    return (
                      <tr key={row.dateStr} className="hover:bg-zinc-900/50">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          {row.fullDate}
                          {row.dateStr === APP_TODAY && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 font-sans">
                              Hari Ini
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {formatRp(row.totalPayments)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-400">
                          {formatRp(row.newInstallmentIncome)}
                        </td>
                        <td className="py-3 px-4 text-right text-cyan-300">
                          {formatRp(row.installmentRepayments)}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-300">
                          {formatRp(row.regularPayments)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ratio > 40
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : ratio > 0
                                ? 'bg-zinc-800 text-zinc-300'
                                : 'text-zinc-600'
                            }`}
                          >
                            {ratio.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-zinc-400 font-sans">
                          {row.transactionCount} trx
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-zinc-950 font-bold text-xs border-t border-zinc-800 font-mono">
                  <tr>
                    <td className="py-3 px-4 text-white font-sans">Total 7 Hari</td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      {formatRp(totals.totalPayments)}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400">
                      {formatRp(totals.newInstallmentIncome)}
                    </td>
                    <td className="py-3 px-4 text-right text-cyan-300">
                      {formatRp(totals.installmentRepayments)}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300">
                      {formatRp(totals.regularPayments)}
                    </td>
                    <td className="py-3 px-4 text-center text-zinc-200">
                      {totals.installmentRatio.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center font-sans text-zinc-400">
                      {chartData.reduce((s, r) => s + r.transactionCount, 0)} trx
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

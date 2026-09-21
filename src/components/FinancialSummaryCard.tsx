import React from 'react';
import { PieChart, Landmark } from 'lucide-react';
import { formatRp } from '../utils/formatters';

export interface FinancialSummaryData {
  totalOmset: number;
  totalTrx: number;
  tunaiLaci: number;
  nonTunai: number;
  arthaGrahaTotal: number;
  arthaGrahaQRIS: number;
  arthaGrahaTransfer: number;
  arthaGrahaEDC: number;
  mandiriTotal: number;
  mandiriQRIS: number;
  mandiriTransfer: number;
  mandiriEDC: number;
}

interface FinancialSummaryCardProps {
  data: FinancialSummaryData;
  title?: string;
  subtitle?: string;
  className?: string;
  actionNode?: React.ReactNode;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  data,
  title = 'Ringkasan Transaksi Finansial',
  subtitle,
  className = '',
  actionNode
}) => {
  return (
    <div
      id="financial-summary-section"
      className={`bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
            <PieChart className="w-4 h-4 text-orange-500 fill-orange-500/20" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actionNode && <div className="flex items-center gap-2">{actionNode}</div>}
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* 1. TOTAL OMSET */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[96px]">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            TOTAL OMSET
          </span>
          <span className="text-2xl sm:text-3xl font-black text-orange-500 tracking-tight mt-2">
            {formatRp(data.totalOmset)}
          </span>
        </div>

        {/* 2. TOTAL TRX */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[96px]">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            TOTAL TRX
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            {data.totalTrx}
          </span>
        </div>

        {/* 3. TUNAI LACI KASIR */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[96px]">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            TUNAI LACI KASIR
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mt-2">
            {formatRp(data.tunaiLaci)}
          </span>
        </div>

        {/* 4. NON-TUNAI MASUK */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[96px]">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            NON-TUNAI MASUK
          </span>
          <span className="text-2xl sm:text-3xl font-black text-sky-400 tracking-tight mt-2">
            {formatRp(data.nonTunai)}
          </span>
        </div>
      </div>

      {/* Bottom 2 Bank Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KE BANK ARTHA GRAHA */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-black tracking-wider uppercase">
              <Landmark className="w-4 h-4 shrink-0" />
              <span>KE BANK ARTHA GRAHA</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2.5 mb-4">
              {formatRp(data.arthaGrahaTotal)}
            </div>

            {/* Inner Breakdown Card */}
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-medium">QRIS:</span>
                <span className="font-bold text-white font-mono">{formatRp(data.arthaGrahaQRIS)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Transfer:</span>
                <span className="font-bold text-white font-mono">{formatRp(data.arthaGrahaTransfer)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Debit/EDC:</span>
                <span className="font-bold text-white font-mono">{formatRp(data.arthaGrahaEDC)}</span>
              </div>
            </div>
          </div>

          {/* Translucent Bank Landmark Watermark */}
          <Landmark
            className="w-28 h-28 text-sky-500/[0.08] absolute -bottom-3 -right-3 pointer-events-none stroke-[1.2]"
            aria-hidden="true"
          />
        </div>

        {/* KE BANK MANDIRI */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black tracking-wider uppercase">
              <Landmark className="w-4 h-4 shrink-0" />
              <span>KE BANK MANDIRI</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2.5 mb-4">
              {formatRp(data.mandiriTotal)}
            </div>

            {/* Inner Breakdown Card */}
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-medium">QRIS:</span>
                <span className="font-bold text-white font-mono">{formatRp(data.mandiriQRIS)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Transfer:</span>
                <span className="font-bold text-white font-mono">{formatRp(data.mandiriTransfer)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Debit/EDC:</span>
                <span className="font-bold text-white font-mono">{formatRp(data.mandiriEDC)}</span>
              </div>
            </div>
          </div>

          {/* Translucent Bank Landmark Watermark */}
          <Landmark
            className="w-28 h-28 text-amber-500/[0.08] absolute -bottom-3 -right-3 pointer-events-none stroke-[1.2]"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
};

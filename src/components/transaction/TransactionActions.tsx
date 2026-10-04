import React, { useState } from 'react';
import { Eye, Printer, FileDown, Loader2 } from 'lucide-react';
import { Transaction, GymBranch } from '../../types';
import { generateAndDownloadTransactionPDF } from './TransactionPDF';

export interface TransactionActionsProps {
  transaction: Transaction;
  branch?: GymBranch;
  onView?: (trx: Transaction) => void;
  onPrint?: (trx: Transaction) => void;
  onDownloadPDF?: (trx: Transaction) => void;
  isGeneratingPdf?: boolean;
  size?: 'sm' | 'md';
  showLabels?: boolean;
  className?: string;
}

export const TransactionActions: React.FC<TransactionActionsProps> = ({
  transaction,
  branch,
  onView,
  onPrint,
  onDownloadPDF,
  isGeneratingPdf: externalGeneratingPdf = false,
  size = 'sm',
  showLabels = true,
  className = ''
}) => {
  const [internalGeneratingPdf, setInternalGeneratingPdf] = useState(false);
  const isGeneratingPdf = externalGeneratingPdf || internalGeneratingPdf;

  const handlePdfClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownloadPDF) {
      onDownloadPDF(transaction);
      return;
    }
    // Default self-contained direct PDF download
    setInternalGeneratingPdf(true);
    try {
      await generateAndDownloadTransactionPDF(transaction, branch);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setInternalGeneratingPdf(false);
    }
  };

  const handlePrintClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPrint) {
      onPrint(transaction);
    } else if (onView) {
      onView(transaction);
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(transaction);
    }
  };

  const btnPadding = size === 'sm' ? 'p-1.5 px-2 text-[11px]' : 'p-2 px-3 text-xs';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* 1. DETAIL BUTTON */}
      {onView && (
        <button
          type="button"
          onClick={handleViewClick}
          title="Lihat Rincian Lengkap Transaksi"
          className={`rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 transition flex items-center gap-1 font-semibold active:scale-95 ${btnPadding}`}
        >
          <Eye className={iconSize} />
          {showLabels && <span className="hidden sm:inline">Detail</span>}
        </button>
      )}

      {/* 2. PRINT BUTTON (react-to-print) */}
      {(onPrint || onView) && (
        <button
          type="button"
          onClick={handlePrintClick}
          title="Cetak Struk Thermal / Faktur A4 (react-to-print)"
          className={`rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 border border-zinc-700/80 hover:border-orange-500/40 transition flex items-center gap-1 font-semibold active:scale-95 ${btnPadding}`}
        >
          <Printer className={iconSize} />
          {showLabels && <span className="hidden sm:inline">Cetak</span>}
        </button>
      )}

      {/* 3. PDF BUTTON (jsPDF + html2canvas) */}
      <button
        type="button"
        onClick={handlePdfClick}
        disabled={isGeneratingPdf}
        title="Unduh Bukti Transaksi Format Dokumen PDF"
        className={`rounded-lg bg-zinc-800 hover:bg-purple-500/20 text-zinc-300 hover:text-purple-400 border border-zinc-700/80 hover:border-purple-500/40 transition flex items-center gap-1 font-semibold disabled:opacity-50 active:scale-95 ${btnPadding}`}
      >
        {isGeneratingPdf ? (
          <Loader2 className={`${iconSize} animate-spin text-purple-400`} />
        ) : (
          <FileDown className={iconSize} />
        )}
        {showLabels && <span className="hidden sm:inline">PDF</span>}
      </button>
    </div>
  );
};

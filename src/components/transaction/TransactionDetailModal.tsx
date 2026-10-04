import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  X,
  Printer,
  FileDown,
  Copy,
  Check,
  Receipt,
  FileText,
  Clock,
  User,
  CreditCard,
  Building2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Transaction, GymBranch, User as UserType, TransactionAuditLog } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { TransactionReceipt } from './TransactionReceipt';
import { TransactionInvoice } from './TransactionInvoice';
import { downloadTransactionPDFFromElement } from './TransactionPDF';

export interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  branch?: GymBranch;
  branches?: GymBranch[];
  currentUser?: UserType | null;
  isNewTransaction?: boolean;
  onNewTransaction?: () => void;
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  branch,
  branches = [],
  currentUser,
  isNewTransaction = false,
  onNewTransaction,
  showToast
}) => {
  const [printFormat, setPrintFormat] = useState<'80mm' | '58mm' | 'a4'>('80mm');
  const [activeViewMode, setActiveViewMode] = useState<'preview' | 'breakdown'>('preview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedWA, setCopiedWA] = useState(false);
  const [isReprint, setIsReprint] = useState(false);
  const [reprintTimestamp, setReprintTimestamp] = useState<string>('');

  const printableRef = useRef<HTMLDivElement>(null);

  // Determine if this is a reprint (opened later, not immediately after transaction creation)
  useEffect(() => {
    if (isOpen && transaction) {
      if (isNewTransaction) {
        setIsReprint(false);
        setReprintTimestamp('');
      } else {
        setIsReprint(true);
        setReprintTimestamp(
          new Date().toLocaleDateString('id-ID') +
            ' ' +
            new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
            ' WIB'
        );
      }
      setCopiedWA(false);
    }
  }, [isOpen, transaction, isNewTransaction]);

  // Resolve matching branch
  const resolvedBranch = useMemo(() => {
    if (!transaction) return branch;
    if (transaction.branchId && branches.length > 0) {
      const found = branches.find((b) => b.id === transaction.branchId);
      if (found) return found;
    }
    if (transaction.branchName && branches.length > 0) {
      const found = branches.find((b) => b.name === transaction.branchName);
      if (found) return found;
    }
    return branch || branches[0];
  }, [transaction, branch, branches]);

  // Helper to record audit log
  const recordAuditLog = (action: 'PRINT' | 'REPRINT' | 'DOWNLOAD_PDF') => {
    if (!transaction) return;
    try {
      const existing = localStorage.getItem('rfa_transaction_audit_logs');
      const list: TransactionAuditLog[] = existing ? JSON.parse(existing) : [];
      const newLog: TransactionAuditLog = {
        id: `LOG-${Date.now()}`,
        transactionId: transaction.id,
        action,
        userId: currentUser?.id || 'U01',
        userName: currentUser?.name || 'Kasir',
        timestamp: new Date().toLocaleString('id-ID'),
        branchId: transaction.branchId || resolvedBranch?.id
      };
      localStorage.setItem('rfa_transaction_audit_logs', JSON.stringify([newLog, ...list.slice(0, 100)]));
    } catch {
      // Ignore storage errors
    }
  };

  // Dynamic CSS Page Style for react-to-print
  const reactToPrintPageStyle = useMemo(() => {
    if (printFormat === '58mm') {
      return `@media print {
        @page { size: 58mm auto !important; margin: 0mm !important; }
        body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        .transaction-print {
          width: 58mm !important;
          max-width: 58mm !important;
          padding: 2mm !important;
          margin: 0 auto !important;
          box-shadow: none !important;
          border: none !important;
        }
      }`;
    }
    if (printFormat === '80mm') {
      return `@media print {
        @page { size: 80mm auto !important; margin: 0mm !important; }
        body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        .transaction-print {
          width: 80mm !important;
          max-width: 80mm !important;
          padding: 3mm !important;
          margin: 0 auto !important;
          box-shadow: none !important;
          border: none !important;
        }
      }`;
    }
    return `@media print {
      @page { size: A4 portrait !important; margin: 10mm 15mm !important; }
      body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .transaction-print {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border: none !important;
      }
    }`;
  }, [printFormat]);

  // Hook react-to-print
  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `RFA-GYM-${transaction?.id || 'TRX'}`,
    pageStyle: reactToPrintPageStyle,
    onAfterPrint: () => {
      recordAuditLog(isReprint ? 'REPRINT' : 'PRINT');
      if (showToast) {
        showToast(
          'Struk Dicetak',
          `Transaksi ${transaction?.id} berhasil dikirim ke printer.`,
          'success'
        );
      }
    }
  });

  // Download PDF handler using html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    if (!printableRef.current || !transaction) return;
    setIsGeneratingPdf(true);
    try {
      const fileName = await downloadTransactionPDFFromElement(
        printableRef.current,
        transaction,
        {
          paperFormat: printFormat === 'a4' ? 'a4' : printFormat === '58mm' ? '58mm' : '80mm'
        }
      );
      recordAuditLog('DOWNLOAD_PDF');
      if (showToast) {
        showToast('PDF Berhasil Diunduh', `File ${fileName} tersimpan.`, 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast('Gagal Membuat PDF', 'Silakan coba lagi.', 'error');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Salin ringkasan teks untuk WhatsApp
  const handleCopyWhatsAppText = () => {
    if (!transaction) return;
    const storeName = 'RFA GYM';
    const totalRp = formatRp(transaction.amount);
    const paidRp = formatRp(transaction.amountPaid ?? transaction.amount);
    const remainingRp = formatRp(transaction.amountRemaining ?? 0);
    const statusText =
      transaction.status === 'Paid'
        ? 'LUNAS'
        : transaction.status === 'VOID'
        ? 'VOID'
        : 'BELUM LUNAS';

    const text = `*BUKTI TRANSAKSI ${storeName}*\n` +
      `No. Transaksi: *${transaction.id}*\n` +
      `Tanggal: ${transaction.date} ${transaction.time || ''}\n` +
      `Pelanggan: *${transaction.customer}*\n` +
      `Layanan: ${transaction.desc}\n` +
      `Metode: ${transaction.method}\n` +
      `Total: *${totalRp}*\n` +
      `Dibayar: ${paidRp}\n` +
      (transaction.amountRemaining && transaction.amountRemaining > 0
        ? `Sisa Piutang: *${remainingRp}*\n`
        : '') +
      `Status: *${statusText}*\n\n` +
      `_Terima kasih telah bertransaksi di ${storeName}._\n` +
      `_BUILD YOUR BEST VERSION_`;

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 3000);
    if (showToast) {
      showToast('Teks WA Tersalin', 'Ringkasan struk siap dikirim ke WhatsApp.', 'info');
    }
  };

  // Keyboard shortcut Ctrl+P
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrint, onClose]);

  if (!isOpen || !transaction) return null;

  const isLunas = transaction.status === 'Paid' || (transaction.amountRemaining ?? 0) === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[94vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* SUCCESS BANNER IF JUST CREATED */}
        {isNewTransaction && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
              <div>
                <h4 className="text-xs sm:text-sm font-black tracking-wide uppercase">
                  TRANSAKSI BERHASIL DIPROSES
                </h4>
                <p className="text-[11px] text-emerald-100">
                  {transaction.id} • {transaction.customer} • {formatRp(transaction.amount)} ({transaction.status})
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-xs font-bold">
              {transaction.method}
            </span>
          </div>
        )}

        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Rincian & Bukti Transaksi
                </h3>
                <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                  {transaction.id}
                </span>
                {isReprint && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                    REPRINT
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {transaction.customer} • {transaction.date} {transaction.time || ''} • Kasir: {transaction.cashier}
              </p>
            </div>
          </div>

          {/* PRINT FORMAT & VIEW SWITCHER */}
          <div className="flex items-center gap-2">
            {/* Format Selector */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('80mm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  printFormat === '80mm'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Format Struk Thermal 80mm Kasir"
              >
                Thermal 80mm
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('58mm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  printFormat === '58mm'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Format Struk Mini 58mm Bluetooth"
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  printFormat === 'a4'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Format Faktur Invoice A4 Lengkap"
              >
                Faktur A4
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE PREVIEW) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950/70 flex justify-center items-start">
          <div className="w-full flex justify-center">
            {/* Printable container targeted by react-to-print & html2canvas */}
            <div ref={printableRef} className="w-full flex justify-center">
              {printFormat === 'a4' ? (
                <TransactionInvoice
                  transaction={transaction}
                  branch={resolvedBranch}
                  isReprint={isReprint}
                  reprintTimestamp={reprintTimestamp}
                />
              ) : (
                <TransactionReceipt
                  transaction={transaction}
                  branch={resolvedBranch}
                  paperWidth={printFormat === '58mm' ? '58mm' : '80mm'}
                  isReprint={isReprint}
                  reprintTimestamp={reprintTimestamp}
                />
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION TOOLBAR */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="hidden sm:inline">
              Format Aktif: <strong>{printFormat === 'a4' ? 'Faktur Invoice A4' : `Thermal ${printFormat}`}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* WhatsApp Text Copy */}
            <button
              type="button"
              onClick={handleCopyWhatsAppText}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                copiedWA
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
              title="Salin ringkasan transaksi ke format teks WhatsApp"
            >
              {copiedWA ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Teks WA Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" /> Salin Teks WA
                </>
              )}
            </button>

            {/* DOWNLOAD PDF BUTTON */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download file bukti transaksi dalam format PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" /> Download PDF
                </>
              )}
            </button>

            {/* PRINT BUTTON (react-to-print) */}
            <button
              type="button"
              onClick={() => handlePrint()}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
              title="Cetak struk nota transaksi (react-to-print)"
            >
              <Printer className="w-4 h-4" />
              Cetak Transaksi
            </button>

            {/* NEW TRANSACTION OR CLOSE */}
            {isNewTransaction && onNewTransaction ? (
              <button
                type="button"
                onClick={onNewTransaction}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                Transaksi Baru
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  Printer,
  X,
  CheckCircle2,
  Copy,
  Share2,
  Building2,
  Sparkles,
  QrCode,
  FileText,
  Sliders,
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  Phone,
  Calendar,
  CreditCard,
  Receipt,
  FileDown,
  Download,
  Loader2
} from 'lucide-react';
import { Transaction, DailyClosingRecord, GymBranch } from '../types';
import { formatRp, formatDateIndo, APP_TODAY, getTimestamp } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  closingRecord?: DailyClosingRecord | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  closingRecord
}) => {
  const { settings, branches, activeBranch } = useSettings();
  const printer = settings?.printer;
  const profile = settings?.profile;

  // Print layout preferences
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm' | 'a4'>(() => {
    return (printer?.paperWidth as any) || '80mm';
  });
  const [layoutMode, setLayoutMode] = useState<'thermal' | 'invoice'>('thermal');
  const [showLogo, setShowLogo] = useState<boolean>(printer?.showLogo !== false);
  const [showBarcode, setShowBarcode] = useState<boolean>(printer?.showBarcode !== false);
  const [showQrVerification, setShowQrVerification] = useState<boolean>(true);
  const [showPolicies, setShowPolicies] = useState<boolean>(true);
  const [showCashierDetails, setShowCashierDetails] = useState<boolean>(printer?.showCashierName !== false);
  const [copiedWA, setCopiedWA] = useState(false);
  const [printTimestamp, setPrintTimestamp] = useState(getTimestamp(true));

  // Ref for react-to-print & PDF export
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Dynamic CSS Page Style for react-to-print
  const reactToPrintPageStyle = useMemo(() => {
    if (paperWidth === '58mm') {
      return `@media print {
        @page { size: 58mm auto !important; margin: 0mm !important; }
        body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        #receipt-printable-area {
          width: 58mm !important;
          max-width: 58mm !important;
          padding: 2mm !important;
          margin: 0 auto !important;
          box-shadow: none !important;
          border: none !important;
        }
      }`;
    }
    if (paperWidth === '80mm') {
      return `@media print {
        @page { size: 80mm auto !important; margin: 0mm !important; }
        body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        #receipt-printable-area {
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
      #receipt-printable-area {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border: none !important;
      }
    }`;
  }, [paperWidth]);

  // Hook react-to-print
  const handlePrintWithReactToPrint = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: `Struk-${transaction?.id || closingRecord?.id || 'Transaksi'}`,
    pageStyle: reactToPrintPageStyle
  });

  // Export & Download PDF
  const handleDownloadPDF = async () => {
    if (!receiptPrintRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = receiptPrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const trxId = transaction?.id || closingRecord?.id || 'TRX';
      const safeId = trxId.replace(/[^a-zA-Z0-9_-]/g, '_');

      if (paperWidth === '58mm') {
        const pdfWidth = 58;
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: [pdfWidth, Math.max(pdfHeight, 60)]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Struk-${safeId}-58mm.pdf`);
      } else if (paperWidth === '80mm') {
        const pdfWidth = 80;
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: [pdfWidth, Math.max(pdfHeight, 80)]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Struk-${safeId}-80mm.pdf`);
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
        pdf.save(`Faktur-${safeId}-A4.pdf`);
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Sync default printer settings when opened
  useEffect(() => {
    if (isOpen) {
      if (printer?.paperWidth === '58mm' || printer?.paperWidth === '80mm' || printer?.paperWidth === 'a4') {
        setPaperWidth(printer.paperWidth);
        if (printer.paperWidth === 'a4') {
          setLayoutMode('invoice');
        } else {
          setLayoutMode('thermal');
        }
      }
      setPrintTimestamp(getTimestamp(true));
      setCopiedWA(false);
    }
  }, [isOpen, printer?.paperWidth]);

  // Handle keyboard shortcuts (Esc to close, Ctrl+P / Cmd+P to print)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleExecutePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Resolve matching branch information for standardized branding
  const matchedBranch: GymBranch | undefined = useMemo(() => {
    const targetBranchId = transaction?.branchId || closingRecord?.branchId;
    const targetBranchName = transaction?.branchName || closingRecord?.branchName;

    if (targetBranchId) {
      const found = branches.find((b) => b.id === targetBranchId);
      if (found) return found;
    }
    if (targetBranchName) {
      const found = branches.find((b) => b.name === targetBranchName || b.code === targetBranchName);
      if (found) return found;
    }
    return activeBranch || branches[0];
  }, [transaction, closingRecord, branches, activeBranch]);

  // Determine standardized receipt category title & badge (Called unconditionally before any early returns)
  const receiptTitleInfo = useMemo(() => {
    if (closingRecord) {
      return {
        badge: 'REKAP LAPORAN DAILY CLOSING',
        subtitle: 'Official Cashier Closing Reconciliation',
        code: 'DAILY-CLOSING',
        color: 'text-amber-700 bg-amber-50 border-amber-300'
      };
    }

    if (!transaction) {
      return {
        badge: printer?.headerNote || 'OFFICIAL RECEIPT',
        subtitle: 'GymPro ERP Enterprise System',
        code: 'RECEIPT',
        color: 'text-zinc-700 bg-zinc-100 border-zinc-300'
      };
    }

    if (transaction.desc?.toLowerCase().includes('tiket visit') || transaction.desc?.toLowerCase().includes('guest pass')) {
      return {
        badge: 'STRUK RESMI TIKET VISIT GYM PASS',
        subtitle: 'Guest Walk-In • Akses Fasilitas Gym & Loker Harian',
        code: 'GUEST-PASS',
        color: 'text-amber-700 bg-amber-50 border-amber-300'
      };
    }

    switch (transaction.type) {
      case 'Class':
        return {
          badge: 'STRUK RESMI PAKET KELAS STUDIO',
          subtitle: 'Studio Pass • Zumba / Yoga / Pilates / Aerobik',
          code: 'STUDIO-PASS',
          color: 'text-blue-700 bg-blue-50 border-blue-300'
        };
      case 'Membership':
        return {
          badge: 'STRUK RESMI KEANGGOTAAN GYM',
          subtitle: 'Official Gym Access Membership Pass',
          code: 'MEMBER-PASS',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-300'
        };
      case 'PT':
        return {
          badge: 'STRUK RESMI PERSONAL TRAINER (PT)',
          subtitle: 'One-on-One Dedicated Coaching Sessions',
          code: 'PT-SESSION',
          color: 'text-purple-700 bg-purple-50 border-purple-300'
        };
      case 'Bundling':
        return {
          badge: 'STRUK RESMI PAKET BUNDLING VIP',
          subtitle: 'All-in-One Comprehensive Fitness Bundling',
          code: 'BUNDLE-VIP',
          color: 'text-amber-700 bg-amber-50 border-amber-300'
        };
      case 'Pelunasan Cicilan':
        return {
          badge: 'BUKTI RESMI PELUNASAN CICILAN',
          subtitle: 'Payment Receipt of Outstanding Debt',
          code: 'PAY-CICILAN',
          color: 'text-teal-700 bg-teal-50 border-teal-300'
        };
      case 'POS':
      default:
        return {
          badge: 'STRUK PENJUALAN KAFE & STORE POS',
          subtitle: 'Beverages, Supplements & Fitness Merchandise',
          code: 'POS-STORE',
          color: 'text-orange-700 bg-orange-50 border-orange-300'
        };
    }
  }, [transaction, closingRecord, printer?.headerNote]);

  if (!isOpen || (!transaction && !closingRecord)) return null;

  // Execute clean print with react-to-print or fallback
  const handleExecutePrint = () => {
    if (receiptPrintRef.current) {
      handlePrintWithReactToPrint();
      return;
    }

    // Fallback: Inject dynamic @page rule so thermal printers (58mm/80mm) and A4 printers format accurately
    const pageStyleId = 'dynamic-receipt-print-style';
    let styleEl = document.getElementById(pageStyleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = pageStyleId;
      document.head.appendChild(styleEl);
    }

    if (paperWidth === '58mm') {
      styleEl.textContent = `@media print { @page { size: 58mm auto !important; margin: 0mm !important; } }`;
    } else if (paperWidth === '80mm') {
      styleEl.textContent = `@media print { @page { size: 80mm auto !important; margin: 0mm !important; } }`;
    } else {
      styleEl.textContent = `@media print { @page { size: A4 portrait !important; margin: 10mm 15mm !important; } }`;
    }

    document.body.classList.add('printing-receipt');
    document.body.classList.add(`printing-paper-${paperWidth}`);

    setTimeout(() => {
      window.print();
      // Remove class after print dialog is closed
      const handleAfterPrint = () => {
        document.body.classList.remove('printing-receipt');
        document.body.classList.remove(`printing-paper-${paperWidth}`);
        if (styleEl && styleEl.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
        }
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      // Fallback cleanup
      setTimeout(() => {
        document.body.classList.remove('printing-receipt');
        document.body.classList.remove(`printing-paper-${paperWidth}`);
        if (styleEl && styleEl.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
        }
      }, 3000);
    }, 50);
  };

  // Parse transaction items
  let parsedItems: {
    name: string;
    price: number;
    qty?: number;
    category?: string;
    code?: string;
    sessions?: number;
    validityDays?: number;
    items?: any[];
  }[] = [];

  if (transaction?.itemsJSON) {
    try {
      const parsed = JSON.parse(transaction.itemsJSON);
      if (Array.isArray(parsed)) {
        parsedItems = parsed;
      }
    } catch {
      parsedItems = [];
    }
  }

  // Brand Name, Tagline & Outlet details
  const companyName = profile?.gymName || printer?.storeName || 'GYMPRO FITNESS & WELLNESS';
  const companyTagline = profile?.tagline || printer?.storeTagline || 'Enterprise Fitness & Gym Management';
  const branchNameDisplay = matchedBranch?.name || profile?.branchName || 'Cabang Utama';
  const branchAddressDisplay = matchedBranch?.address || profile?.address || 'Jl. Boulevard Artha Gading Blok A-3 No. 88';
  const branchCityDisplay = matchedBranch?.city || profile?.city || 'Jakarta Utara, DKI Jakarta';
  const branchPhoneDisplay = matchedBranch?.phone || profile?.phone || printer?.storePhone || '0812-9876-5432';
  const branchWaDisplay = matchedBranch?.whatsapp || profile?.whatsapp || branchPhoneDisplay;
  const companyNpwp = profile?.npwp || '01.345.678.9-041.000';
  const companyWebsite = profile?.website || 'https://gympro.id';

  // Generate plain-text receipt for WhatsApp sending
  const handleCopyWhatsAppText = () => {
    let text = `*==============================*\n`;
    text += `*${companyName.toUpperCase()}*\n`;
    text += `${companyTagline}\n`;
    text += `📍 Outlet: ${branchNameDisplay}\n`;
    text += `*==============================*\n`;

    if (transaction) {
      text += `📄 *${receiptTitleInfo.badge}*\n`;
      text += `No. Struk : *${transaction.id}*\n`;
      text += `Waktu     : ${transaction.date} ${transaction.time}\n`;
      text += `Kasir     : ${transaction.cashier}\n`;
      text += `Member    : *${transaction.customer}*\n`;
      if (transaction.branchName) text += `Cabang    : ${transaction.branchName}\n`;
      text += `--------------------------------\n`;
      text += `*RINCIAN TRANSAKSI:*\n`;

      if (parsedItems.length > 0) {
        parsedItems.forEach((item, idx) => {
          const qtyStr = item.qty ? `${item.qty}x ` : '1x ';
          text += `${idx + 1}. ${item.name}\n   ${qtyStr}@ ${formatRp(item.price)} = *${formatRp(item.price * (item.qty || 1))}*\n`;
        });
      } else {
        text += `- ${transaction.desc} = *${formatRp(transaction.amount)}*\n`;
      }

      if (transaction.classSessionsGranted) {
        text += `🧘 Kuota Kelas  : +${transaction.classSessionsGranted} Sesi\n`;
        text += `⏳ Masa Berlaku : ${transaction.classValidityDays || 30} Hari\n`;
      }

      text += `--------------------------------\n`;
      text += `Total Tagihan : ${formatRp(transaction.amount)}\n`;
      text += `Total Dibayar : *${formatRp(transaction.amountPaid || transaction.amount)}*\n`;
      text += `Metode Bayar  : ${transaction.method}\n`;
      text += `Status        : *${transaction.status.toUpperCase()}*\n`;

      if (transaction.amountRemaining > 0) {
        text += `Sisa Tagihan  : *${formatRp(transaction.amountRemaining)}*\n`;
        if (transaction.dueDate) text += `Jatuh Tempo   : ${transaction.dueDate}\n`;
      }
    } else if (closingRecord) {
      text += `📊 *REKAP DAILY CLOSING KASIR*\n`;
      text += `ID Rekap      : *${closingRecord.id}*\n`;
      text += `Waktu Closing : ${closingRecord.date} ${closingRecord.time}\n`;
      text += `Petugas       : ${closingRecord.closedBy}\n`;
      text += `Cabang        : ${closingRecord.branchName || branchNameDisplay}\n`;
      text += `--------------------------------\n`;
      text += `Total Transaksi : ${closingRecord.trxCount} Trx\n`;
      text += `Total Omset     : *${formatRp(closingRecord.revenue)}*\n`;
      if ((closingRecord.openingFloat || closingRecord.modalAwal) !== undefined) {
        text += `Modal Awal Laci : ${formatRp(closingRecord.openingFloat || closingRecord.modalAwal || 0)}\n`;
      }
      text += `Penerimaan Cash : ${formatRp(closingRecord.tunai)}\n`;
      text += `Non-Tunai       : ${formatRp(closingRecord.nonTunai)}\n`;
      text += `Petty Cash Out  : -${formatRp(closingRecord.pettyCash || closingRecord.pettyExpenses || 0)}\n`;
      text += `Kas Seharusnya  : ${formatRp(closingRecord.expectedCash || closingRecord.systemSaldo || 0)}\n`;
      text += `Fisik Kas Laci  : *${formatRp(closingRecord.physicalCash || closingRecord.actualCash || 0)}*\n`;
      text += `Selisih Kas     : *${(closingRecord.variance || closingRecord.difference || 0) === 0 ? 'SESUAI (Rp 0)' : formatRp(closingRecord.variance || closingRecord.difference || 0)}*\n`;
    }

    text += `*==============================*\n`;
    text += `*KETENTUAN:*\n`;
    text += `• Bukti pembayaran resmi GymPro ERP.\n`;
    text += `• Biaya paket non-refundable.\n`;
    text += `• WA CS: ${branchWaDisplay}\n`;
    text += `• Web: ${companyWebsite}\n`;
    text += `_Terima kasih atas kebersamaan Anda!_`;

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 3000);
  };

  // Determine printable wrapper class based on paper selection
  const printableWidthClass =
    paperWidth === '58mm'
      ? 'receipt-width-58mm max-w-[280px] text-[10.5px]'
      : paperWidth === '80mm'
      ? 'receipt-width-80mm max-w-[360px] text-[12px]'
      : 'receipt-width-a4 max-w-2xl text-[13px]';

  return (
    <div
      id="receipt-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="receipt-modal-wrapper"
        className="w-full max-w-3xl my-auto flex flex-col max-h-[96vh] rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden"
      >
        {/* Top Control Bar (Non-Printable Toolbar) */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Layout Cetak Struk Resmi</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {receiptTitleInfo.code}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Format standar printer thermal kasir & faktur resmi GymPro ERP
              </p>
            </div>
          </div>

          {/* Quick Paper & Format Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Paper Width Selector */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 px-2 uppercase">Kertas:</span>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  paperWidth === '58mm'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Thermal 58mm (Mini POS / Bluetooth Portable)"
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  paperWidth === '80mm'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Thermal 80mm (Standard Desktop POS Kasir)"
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('a4')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  paperWidth === 'a4'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="A4 / Kwitansi Resmi Perusahaan (Full Width)"
              >
                A4
              </button>
            </div>

            {/* Layout Mode Selector: Thermal Roll vs Kwitansi Formal */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setLayoutMode('thermal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  layoutMode === 'thermal'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Thermal Roll
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('invoice')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  layoutMode === 'invoice'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Kwitansi
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visibility Toggles Strip (Non-Printable) */}
        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center gap-3 text-xs text-zinc-300 no-print">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Elemen Struk:</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0"
            />
            <span>Logo Brand</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showBarcode}
              onChange={(e) => setShowBarcode(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0"
            />
            <span>Barcode No. Transaksi</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showQrVerification}
              onChange={(e) => setShowQrVerification(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0"
            />
            <span>QR Verifikasi Digital</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showPolicies}
              onChange={(e) => setShowPolicies(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0"
            />
            <span>Kebijakan & Syarat</span>
          </label>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950/60 flex justify-center items-start">
          {/* THE PRINTABLE RECEIPT CONTAINER */}
          <div
            ref={receiptPrintRef}
            id="receipt-printable-area"
            className={`bg-white text-black p-4 sm:p-6 shadow-2xl transition-all duration-200 border border-zinc-300 font-mono ${printableWidthClass} ${
              layoutMode === 'invoice' ? 'rounded-2xl font-sans' : 'rounded-sm'
            }`}
          >
            {/* BRANDING HEADER */}
            <div className="text-center pb-3 receipt-avoid-break">
              {showLogo && (
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  {/* Standardized Vector Emblem */}
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs font-black text-lg">
                    <span>G</span>
                  </div>
                </div>
              )}

              {/* Standardized Gym Company Name */}
              <h2 className="text-sm sm:text-base font-black tracking-tight uppercase leading-tight text-black">
                {companyName}
              </h2>

              {/* Tagline */}
              <p className="text-[10px] text-zinc-600 font-medium tracking-wide mt-0.5">
                {companyTagline}
              </p>

              {/* Standardized Outlet & Branch Info */}
              <div className="text-[9.5px] text-zinc-700 mt-1 leading-tight space-y-0.5">
                <p className="font-bold text-black uppercase">
                  {branchNameDisplay} {matchedBranch?.code ? `[${matchedBranch.code}]` : ''}
                </p>
                <p>{branchAddressDisplay}</p>
                <p>
                  {branchCityDisplay} • Telp/WA: <strong>{branchPhoneDisplay}</strong>
                </p>
                {companyNpwp && (
                  <p className="text-[8.5px] text-zinc-500">NPWP: {companyNpwp}</p>
                )}
              </div>

              {/* Receipt Category Badge */}
              <div className="mt-2.5">
                <div className="inline-block px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider border border-black rounded-md">
                  {receiptTitleInfo.badge}
                </div>
                <p className="text-[8.5px] text-zinc-500 mt-0.5 italic">
                  {receiptTitleInfo.subtitle}
                </p>
              </div>

              {/* Official Status Watermark / Stamp */}
              {transaction && (
                <div className="mt-2 flex justify-center">
                  {transaction.status === 'VOID' ? (
                    <div className="px-3 py-0.5 border-2 border-red-600 text-red-600 font-black text-sm uppercase tracking-widest rounded transform -rotate-2">
                      *** DIBATALKAN / VOID ***
                    </div>
                  ) : transaction.status === 'Paid' ? (
                    <div className="px-3 py-0.5 border border-black font-black text-[10px] uppercase tracking-wider rounded">
                      ★ LUNAS / PAID IN FULL ★
                    </div>
                  ) : transaction.paymentScheme === 'SPLIT_PAYMENT' ? (
                    <div className="px-3 py-0.5 border border-black font-black text-[10px] uppercase tracking-wider rounded">
                      ◆ SPLIT PAYMENT (CASH & NON-CASH) ◆
                    </div>
                  ) : (
                    <div className="px-3 py-0.5 border border-black font-black text-[10px] uppercase tracking-wider rounded">
                      ◆ DP / CICILAN BERTAHAP ◆
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DASHED SEPARATOR */}
            <div className="receipt-divider" />

            {/* TRANSACTION METADATA */}
            {transaction && (
              <div className="py-1 text-[10px] leading-tight space-y-1 receipt-avoid-break">
                <div className="flex justify-between">
                  <span className="text-zinc-600">No. Transaksi</span>
                  <span className="font-bold text-black font-mono">{transaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Waktu & Tgl</span>
                  <span className="font-semibold text-black">
                    {formatDateIndo(transaction.date)} • {transaction.time || '12:00 WIB'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Pelanggan / Member</span>
                  <span className="font-bold text-black truncate max-w-[200px]">
                    {transaction.customer} {transaction.memberId ? `[${transaction.memberId}]` : ''}
                  </span>
                </div>
                {showCashierDetails && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Kasir / Operator</span>
                    <span className="font-medium text-black">{transaction.cashier || 'Staf Kasir'}</span>
                  </div>
                )}
                {transaction.picNames && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">PIC Sales / Trainer</span>
                    <span className="font-medium text-black truncate max-w-[190px]">
                      {transaction.picNames}
                    </span>
                  </div>
                )}
                {transaction.branchName && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Outlet Cabang</span>
                    <span className="font-medium text-black truncate max-w-[190px]">
                      {transaction.branchName}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CLOSING RECORD METADATA */}
            {closingRecord && (
              <div className="py-1 text-[10px] leading-tight space-y-1 receipt-avoid-break">
                <div className="flex justify-between">
                  <span className="text-zinc-600">ID Rekap Closing</span>
                  <span className="font-bold text-black font-mono">{closingRecord.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Tgl & Jam Closing</span>
                  <span className="font-semibold text-black">
                    {formatDateIndo(closingRecord.date)} • {closingRecord.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Ditutup Oleh</span>
                  <span className="font-bold text-black">{closingRecord.closedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Outlet Unit</span>
                  <span className="font-medium text-black">
                    {closingRecord.branchName || branchNameDisplay}
                  </span>
                </div>
              </div>
            )}

            {/* DASHED SEPARATOR */}
            <div className="receipt-divider" />

            {/* ITEMIZATION SECTION */}
            <div className="py-1 receipt-avoid-break">
              {transaction && (
                <div className="space-y-1.5">
                  {/* Table Column Titles for 80mm & A4 */}
                  {paperWidth !== '58mm' && (
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1 mb-1">
                      <span>Item / Deskripsi Layanan</span>
                      <span>Total</span>
                    </div>
                  )}

                  {parsedItems.length > 0 ? (
                    parsedItems.map((item, idx) => (
                      <div key={idx} className="space-y-0.5 text-[10px]">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-black leading-tight flex-1 pr-2">
                            {idx + 1}. {item.name}
                          </span>
                          <span className="font-bold text-black text-right shrink-0">
                            {formatRp(item.price * (item.qty || 1))}
                          </span>
                        </div>
                        {item.qty && item.qty > 1 && (
                          <div className="text-[9px] text-zinc-600 pl-3">
                            {item.qty} pcs x {formatRp(item.price)}
                          </div>
                        )}
                        {item.sessions && (
                          <div className="text-[9px] text-zinc-700 pl-3">
                            ✓ Kuota: {item.sessions} Sesi • Berlaku: {item.validityDays || 30} Hari
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-black leading-tight flex-1 pr-2">
                          {transaction.desc}
                        </span>
                        <span className="font-bold text-black text-right shrink-0">
                          {formatRp(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Special Studio Class Quota Summary */}
                  {transaction.type === 'Class' && transaction.classSessionsGranted && (
                    <div className="mt-1.5 p-1.5 bg-zinc-100 rounded text-[9.5px] border border-zinc-300 space-y-0.5">
                      <div className="font-bold text-black">
                        🧘 Hak Akses Studio Class:
                      </div>
                      <div className="flex justify-between text-zinc-700">
                        <span>• Kuota Sesi Diterima:</span>
                        <span className="font-bold text-black">+{transaction.classSessionsGranted} Sesi</span>
                      </div>
                      <div className="flex justify-between text-zinc-700">
                        <span>• Masa Berlaku:</span>
                        <span className="font-semibold text-black">{transaction.classValidityDays || 30} Hari</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Closing Summary Table */}
              {closingRecord && (
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Total Transaksi</span>
                    <span className="font-bold text-black">{closingRecord.trxCount} Trx</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Total Omset Penjualan</span>
                    <span className="font-black text-black">{formatRp(closingRecord.revenue)}</span>
                  </div>
                  {((closingRecord.openingFloat || closingRecord.modalAwal) !== undefined) && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600">• Modal Awal Laci (Float)</span>
                      <span className="font-semibold text-black">{formatRp(closingRecord.openingFloat || closingRecord.modalAwal || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-600">• Penerimaan Kas Tunai</span>
                    <span className="font-semibold text-black">{formatRp(closingRecord.tunai)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">• Penerimaan Non-Tunai</span>
                    <span className="font-semibold text-black">{formatRp(closingRecord.nonTunai)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">• Pengeluaran Kas Kecil</span>
                    <span className="font-semibold text-red-700">- {formatRp(closingRecord.pettyCash || closingRecord.pettyExpenses || 0)}</span>
                  </div>
                  <div className="receipt-divider" />
                  <div className="flex justify-between font-bold">
                    <span>Kas Seharusnya di Laci</span>
                    <span>{formatRp(closingRecord.expectedCash || closingRecord.systemSaldo || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kas Fisik Aktual di Laci</span>
                    <span>{formatRp(closingRecord.physicalCash || closingRecord.actualCash || 0)}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-0.5">
                    <span>Selisih Rekonsiliasi</span>
                    <span className={(closingRecord.variance || closingRecord.difference || 0) === 0 ? 'text-black' : 'text-red-700'}>
                      {(closingRecord.variance || closingRecord.difference || 0) === 0 ? '✓ SESUAI (Rp 0)' : formatRp(closingRecord.variance || closingRecord.difference || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* DASHED SEPARATOR */}
            <div className="receipt-divider" />

            {/* FINANCIAL SUMMARY & PAYMENT SCHEME BREAKDOWN */}
            {transaction && (
              <div className="py-1 text-[10.5px] leading-tight space-y-1 receipt-avoid-break">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal Bruto</span>
                  <span className="font-medium text-black">{formatRp(transaction.amount)}</span>
                </div>

                <div className="flex justify-between text-xs font-black text-black pt-1">
                  <span>TOTAL TAGIHAN</span>
                  <span className="text-sm">{formatRp(transaction.amount)}</span>
                </div>

                <div className="receipt-divider" />

                {/* Payment Method Details */}
                <div className="flex justify-between">
                  <span className="text-zinc-600">Metode Pembayaran</span>
                  <span className="font-bold text-black uppercase">{transaction.method}</span>
                </div>

                {/* Split Payment Details */}
                {transaction.paymentScheme === 'SPLIT_PAYMENT' && (
                  <div className="pl-2 space-y-0.5 text-[9.5px] text-zinc-700 bg-zinc-50 p-1.5 rounded border border-zinc-200">
                    <div className="flex justify-between">
                      <span>• Tunai (Cash):</span>
                      <span className="font-bold">{formatRp(transaction.splitCashAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Non-Tunai ({transaction.splitNonCashMethod || 'QRIS/EDC'}):</span>
                      <span className="font-bold">{formatRp(transaction.splitNonCashAmount || 0)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between font-bold text-black">
                  <span>TOTAL DIBAYAR</span>
                  <span className="text-xs font-black">
                    {formatRp(transaction.amountPaid || transaction.amount)}
                  </span>
                </div>

                {/* Remaining Amount & Due Date for DP / Installments */}
                {transaction.amountRemaining > 0 && (
                  <div className="mt-1 p-1.5 bg-zinc-100 border border-zinc-300 rounded space-y-0.5">
                    <div className="flex justify-between font-black text-black text-xs">
                      <span>SISA PIUTANG (BELUM LUNAS):</span>
                      <span>{formatRp(transaction.amountRemaining)}</span>
                    </div>
                    {transaction.dueDate && (
                      <div className="flex justify-between text-[9px] text-zinc-700">
                        <span>Batas Waktu Pelunasan:</span>
                        <span className="font-bold">{formatDateIndo(transaction.dueDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECURITY BARCODE & VERIFICATION QR */}
            <div className="pt-2 text-center receipt-avoid-break">
              {showBarcode && (
                <div className="my-1.5">
                  {/* High contrast visual barcode simulation */}
                  <div className="text-[14px] tracking-[3px] font-black leading-none overflow-hidden select-none">
                    ||| | |||| | || ||||| || | ||| || ||||
                  </div>
                  <div className="text-[8.5px] font-mono text-zinc-700 tracking-wider mt-0.5">
                    *{transaction ? transaction.id : (closingRecord?.id || 'RECEIPT')}*
                  </div>
                </div>
              )}

              {showQrVerification && (
                <div className="mt-2 pt-1 border-t border-dotted border-zinc-300 flex items-center justify-center gap-2">
                  <div className="p-1 border border-black bg-white rounded">
                    {/* Compact crisp SVG QR representation */}
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="black">
                      <path d="M2 2h7v7H2V2zm2 2v3h3V4H4zm11-2h7v7h-7V2zm2 2v3h3V4h-3zM2 15h7v7H2v-7zm2 2v3h3v-3H4zm14 0h3v3h-3v-3zm-3-2h2v2h-2v-2zm0 5h2v2h-2v-2zm3-3h2v2h-2v-2zm-8-3h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm5-11h2v2h-2V7zm-2 2h2v2h-2V9zm0 2h2v2h-2v-2zm2-4h2v2h-2V7z"/>
                    </svg>
                  </div>
                  <div className="text-left text-[8px] leading-tight text-zinc-600 max-w-[170px]">
                    <p className="font-black text-black uppercase">VALIDASI DIGITAL RESMI</p>
                    <p>Pindai kode QR untuk cek keabsahan transaksi di database pusat GymPro.</p>
                    <p className="font-mono text-zinc-500 mt-0.5">AUTH: GP-{Math.abs((transaction?.id || closingRecord?.id || '').split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0, 0)).toString(36).toUpperCase()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* FORMAL SIGNATURE BLOCKS (Only in Kwitansi Mode) */}
            {layoutMode === 'invoice' && (
              <div className="mt-4 pt-3 border-t border-black grid grid-cols-2 gap-4 text-center text-[10px] receipt-avoid-break">
                <div>
                  <p className="text-zinc-600">Pelanggan / Member,</p>
                  <div className="h-12 flex items-end justify-center">
                    <span className="border-b border-black w-32 inline-block"></span>
                  </div>
                  <p className="font-bold text-black mt-1">({transaction?.customer || 'Member'})</p>
                </div>
                <div>
                  <p className="text-zinc-600">Kasir / Resepsionis Gym,</p>
                  <div className="h-12 flex items-end justify-center">
                    <span className="border-b border-black w-32 inline-block"></span>
                  </div>
                  <p className="font-bold text-black mt-1">({transaction?.cashier || closingRecord?.closedBy || 'Staf GymPro'})</p>
                </div>
              </div>
            )}

            {/* DASHED SEPARATOR */}
            <div className="receipt-divider" />

            {/* CORPORATE FOOTER & POLICIES */}
            <div className="pt-1 text-center text-[8.5px] text-zinc-600 leading-tight space-y-1 receipt-avoid-break">
              {showPolicies && (
                <div className="text-[8px] text-zinc-500 text-left border border-zinc-200 p-1.5 rounded bg-zinc-50 space-y-0.5">
                  <p className="font-bold text-black uppercase">Ketentuan & Kebijakan Transaksi:</p>
                  <p>1. Struk ini adalah bukti pembayaran sah resmi yang diterbitkan oleh sistem GymPro ERP.</p>
                  <p>2. Biaya membership, PT, dan kelas yang sudah dibayar tidak dapat dikembalikan (Non-Refundable).</p>
                  <p>3. Hak akses member dan jadwal sesi tunduk pada peraturan tata tertib fasilitas gym.</p>
                </div>
              )}

              <p className="font-semibold text-black">
                {printer?.footerNote || 'Terima kasih atas kunjungan Anda. Stay Fit, Stay Strong!'}
              </p>

              <div className="text-[8px] text-zinc-500 pt-0.5">
                <p>Jam Operasional: {profile?.openHoursWeekday || '06.00 - 22.00 WIB'}</p>
                <p>Website: {companyWebsite} • Customer Care: {branchWaDisplay}</p>
                <p className="font-mono text-[7.5px] mt-0.5 text-zinc-400">
                  Printed: {printTimestamp} • Terminal #01 • GymPro ERP v2.4
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (Non-Printable Toolbar) */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="hidden sm:inline">
              Pintasan Keyboard: Tekan <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">Ctrl + P</kbd> untuk mencetak langsung
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Unduh struk nota transaksi sebagai dokumen file PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>

            {/* Copy WhatsApp Plain Text Button */}
            <button
              type="button"
              onClick={handleCopyWhatsAppText}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                copiedWA
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
              }`}
              title="Salin ringkasan struk dalam format teks WhatsApp untuk dikirim ke pelanggan"
            >
              {copiedWA ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Teks WA Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" /> Salin Teks WA
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Tutup
            </button>

            {/* Print Button (react-to-print) */}
            <button
              type="button"
              onClick={handleExecutePrint}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-lg shadow-orange-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
              title="Cetak langsung ke printer thermal / kertas (menggunakan react-to-print)"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" /> Cetak Struk (react-to-print)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

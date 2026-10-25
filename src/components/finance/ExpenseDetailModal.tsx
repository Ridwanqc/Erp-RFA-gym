import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Calendar,
  Building2,
  Tag,
  CreditCard,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { CompanyExpense } from '../../types';
import { formatRp } from '../../utils/formatters';
import { ExpenseVoucherPrintModal } from './ExpenseVoucherPrintModal';

interface ExpenseDetailModalProps {
  expense: CompanyExpense;
  onClose: () => void;
  onOpenPay?: (expense: CompanyExpense) => void;
  onApprove?: (expense: CompanyExpense) => void;
  onReject?: (expense: CompanyExpense) => void;
  canApprove?: boolean;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  onClose,
  onOpenPay,
  onApprove,
  onReject,
  canApprove = false
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Detail Transaksi Pengeluaran</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-orange-400 border border-zinc-700">
                    {expense.expenseNumber}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Rincian Lengkap & Jejak Audit Pengeluaran Perusahaan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition border border-zinc-700"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>Cetak Voucher</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Top Stat Banner */}
            <div className="p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-zinc-400 block font-medium">Nominal Pengeluaran</span>
                <span className="text-2xl font-black font-mono text-rose-400">
                  {formatRp(expense.amount)}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getApprovalBadge(expense.approvalStatus)}`}>
                    Persetujuan: {expense.approvalStatus}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPaymentBadge(expense.paymentStatus)}`}>
                    Pembayaran: {expense.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-zinc-500 block">Sisa Pembayaran / Utang</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  {formatRp(expense.balanceRemaining)}
                </span>
                <span className="text-[11px] text-zinc-400 block mt-1">
                  Sudah Dibayar: <strong className="text-emerald-400 font-mono">{formatRp(expense.paidAmount)}</strong>
                </span>
              </div>
            </div>

            {/* Rejection Alert if rejected */}
            {expense.approvalStatus === 'Ditolak' && expense.rejectionReason && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-rose-200">Pengajuan Pengeluaran Ditolak</strong>
                  <p className="mt-0.5">{expense.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-3">
                <h4 className="font-bold text-zinc-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  <span>Informasi Transaksi & Unit</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Nama Pengeluaran:</span>
                    <span className="font-bold text-zinc-200 text-right max-w-[60%]">{expense.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Tanggal:</span>
                    <span className="font-mono text-zinc-200">{expense.date}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Cabang / Unit:</span>
                    <span className="font-semibold text-zinc-200">{expense.branchName}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Penerima / Vendor:</span>
                    <span className="font-bold text-orange-400">{expense.vendorOrBeneficiary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">PIC / Pengaju:</span>
                    <span className="font-semibold text-zinc-200">{expense.picStaffName}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-3">
                <h4 className="font-bold text-zinc-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-orange-400" />
                  <span>Akuntansi & Sumber Dana</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Kategori:</span>
                    <span className="font-bold text-zinc-200">{expense.categoryName}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Subkategori:</span>
                    <span className="text-zinc-300">{expense.subcategory}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Jenis Perlakuan Akuntansi:</span>
                    <span className="font-semibold px-2 py-0.5 rounded bg-zinc-800 text-orange-300 text-[11px]">
                      {expense.accountingType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Metode Bayar:</span>
                    <span className="font-semibold text-zinc-200">{expense.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Sumber Dana / Rekening:</span>
                    <span className="font-bold text-emerald-400">{expense.sourceAccount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Reference */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-2 text-xs">
              <span className="text-zinc-400 font-bold block">Deskripsi & Keterangan Pengeluaran:</span>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                {expense.description || 'Tidak ada deskripsi detail tambahan.'}
              </p>
              {expense.invoiceRefNumber && (
                <div className="flex items-center gap-2 pt-2 text-zinc-400">
                  <span>No. Referensi / Invoice Nota:</span>
                  <span className="font-mono font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded">
                    {expense.invoiceRefNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Bukti Lampiran / Attachment */}
            {expense.attachmentUrl && expense.attachmentUrl.trim() && (
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-3 text-xs">
                <span className="text-zinc-300 font-bold flex items-center justify-between">
                  <span>Lampiran Bukti Transaksi (Struk / Invoice / Nota)</span>
                  {expense.attachmentFileName && (
                    <span className="text-zinc-500 font-mono text-[11px]">{expense.attachmentFileName}</span>
                  )}
                </span>
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center p-2 max-h-72">
                  <img
                    src={expense.attachmentUrl.trim()}
                    alt="Bukti Lampiran Pengeluaran"
                    className="max-h-64 object-contain rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Audit Trail Log */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-zinc-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Jejak Audit Aktivitas (Audit Trail)</span>
              </h4>
              <div className="space-y-2">
                {expense.auditLogs && expense.auditLogs.length > 0 ? (
                  expense.auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">{log.action}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-400">{log.userName}</span>
                        </div>
                        {log.notes && (
                          <p className="text-zinc-400 text-[11px] mt-0.5">{log.notes}</p>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 italic">Belum ada catatan jejak audit.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition border border-zinc-700"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>Cetak Voucher</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Approver actions if Menunggu Persetujuan */}
              {canApprove && expense.approvalStatus === 'Menunggu Persetujuan' && (
                <>
                  <button
                    onClick={() => {
                      if (onReject) onReject(expense);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onApprove) onApprove(expense);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui Transaksi</span>
                  </button>
                </>
              )}

              {/* Pay action if Approved but not fully paid */}
              {expense.approvalStatus === 'Disetujui' && expense.paymentStatus !== 'Lunas' && onOpenPay && (
                <button
                  onClick={() => {
                    onOpenPay(expense);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Catat Pembayaran ({formatRp(expense.balanceRemaining)})</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPrintModalOpen && (
        <ExpenseVoucherPrintModal
          expense={expense}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </>
  );
};

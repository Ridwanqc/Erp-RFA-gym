import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Transaction, DailyClosingRecord } from '../types';
import { formatRp } from '../utils/formatters';

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
  if (!isOpen || (!transaction && !closingRecord)) return null;

  const handlePrint = () => {
    window.print();
  };

  let parsedItems: { name: string; price: number; qty?: number }[] = [];
  if (transaction?.itemsJSON) {
    try {
      parsedItems = JSON.parse(transaction.itemsJSON);
    } catch {
      parsedItems = [];
    }
  }

  return (
    <div
      id="receipt-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
    >
      <div
        id="receipt-content"
        className="bg-white text-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col font-sans border border-zinc-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="text-center pb-4 border-b border-dashed border-zinc-300 relative">
          <div className="w-10 h-10 bg-orange-600 rounded-xl mx-auto flex items-center justify-center text-white font-black italic text-lg shadow-sm mb-2">
            R
          </div>
          <h2 className="text-lg font-black tracking-tight text-zinc-900 leading-none">RFA GYM ENTERPRISE</h2>
          <p className="text-[10px] uppercase font-bold text-orange-600 tracking-wider mt-1">
            {closingRecord ? 'REKAP LAPORAN DAILY CLOSING' : 'OFFICIAL FITNESS RECEIPT'}
          </p>
          {transaction?.status === 'VOID' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="border-4 border-rose-600 text-rose-600 font-black text-4xl transform -rotate-12 px-4 py-1 rounded-xl opacity-80 tracking-widest">
                VOID
              </span>
            </div>
          )}
        </div>

        {/* Details for Transaction */}
        {transaction && (
          <div className="py-3 space-y-1 text-xs border-b border-dashed border-zinc-300">
            <div className="flex justify-between text-zinc-600">
              <span>Waktu / Tgl:</span>
              <span className="font-semibold text-zinc-900">{transaction.date} {transaction.time}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>No. Transaksi:</span>
              <span className="font-mono font-bold text-zinc-900">{transaction.id}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Pelanggan / Member:</span>
              <span className="font-semibold text-zinc-900 truncate max-w-[170px]">{transaction.customer}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Kasir:</span>
              <span className="font-medium text-zinc-900">{transaction.cashier}</span>
            </div>
          </div>
        )}

        {/* Details for Closing Record */}
        {closingRecord && (
          <div className="py-3 space-y-1 text-xs border-b border-dashed border-zinc-300">
            <div className="flex justify-between text-zinc-600">
              <span>Tanggal Closing:</span>
              <span className="font-semibold text-zinc-900">{closingRecord.date} {closingRecord.time}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Ditutup Oleh:</span>
              <span className="font-semibold text-zinc-900">{closingRecord.closedBy}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>ID Rekap:</span>
              <span className="font-mono font-bold text-zinc-900">{closingRecord.id}</span>
            </div>
          </div>
        )}

        {/* Item List / Summary Table */}
        <div className="py-3 border-b border-dashed border-zinc-300 text-xs">
          {transaction && (
            <div className="space-y-2">
              {parsedItems.length > 0 ? (
                parsedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="font-medium text-zinc-800">
                      {item.qty ? `${item.qty}x ` : ''}{item.name}
                    </span>
                    <span className="font-semibold text-zinc-900 text-right">
                      {formatRp(item.price * (item.qty || 1))}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-start">
                  <span className="font-medium text-zinc-800">{transaction.desc}</span>
                  <span className="font-semibold text-zinc-900">{formatRp(transaction.amount)}</span>
                </div>
              )}
            </div>
          )}

          {closingRecord && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-zinc-700">
                <span>Total Transaksi:</span>
                <span className="font-bold text-zinc-900">{closingRecord.trxCount} Trx</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span>Total Omset Masuk:</span>
                <span className="font-bold text-orange-600">{formatRp(closingRecord.revenue)}</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span>Penerimaan Tunai:</span>
                <span className="font-semibold text-zinc-900">{formatRp(closingRecord.tunai)}</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span>Penerimaan Non-Tunai:</span>
                <span className="font-semibold text-zinc-900">{formatRp(closingRecord.nonTunai)}</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span>Pengeluaran Petty Cash:</span>
                <span className="font-semibold text-rose-600">- {formatRp(closingRecord.pettyCash)}</span>
              </div>
              <div className="border-t border-dashed border-zinc-300 pt-1.5 flex justify-between font-bold">
                <span>Saldo Sistem Laci:</span>
                <span className="text-zinc-900">{formatRp(closingRecord.systemSaldo)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Fisik Kas Laci:</span>
                <span className="text-zinc-900">{formatRp(closingRecord.actualCash)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Selisih Rekonsiliasi:</span>
                <span className={closingRecord.difference === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {closingRecord.difference === 0 ? 'Sesuai (Rp 0)' : formatRp(closingRecord.difference)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Totals for Transaction */}
        {transaction && (
          <div className="py-3 space-y-1 text-xs border-b border-dashed border-zinc-300">
            <div className="flex justify-between text-zinc-600">
              <span>Metode Pembayaran:</span>
              <span className="font-bold text-zinc-900">{transaction.method}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Status Pembayaran:</span>
              <span className="font-bold text-orange-600 uppercase">{transaction.status}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-zinc-900 pt-1">
              <span>Total Dibayar:</span>
              <span className="text-base text-orange-600">{formatRp(transaction.amountPaid || transaction.amount)}</span>
            </div>
            {transaction.amountRemaining > 0 && (
              <div className="flex justify-between text-xs font-bold text-rose-600">
                <span>Sisa Tagihan:</span>
                <span>{formatRp(transaction.amountRemaining)}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 pb-2 text-center text-[10px] text-zinc-500 font-medium">
          <p>Terima kasih atas kunjungan Anda di RFA GYM.</p>
          <p className="mt-0.5">Simpan struk ini sebagai bukti pembayaran yang sah.</p>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="mt-4 flex gap-2 no-print">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" /> Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Transaction, GymBranch } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';

interface TransactionReceiptProps {
  transaction: Transaction;
  branch?: GymBranch;
  paperWidth?: '58mm' | '80mm';
  isReprint?: boolean;
  reprintTimestamp?: string;
  cashGiven?: number;
  changeGiven?: number;
}

export const TransactionReceipt = React.forwardRef<HTMLDivElement, TransactionReceiptProps>(
  (
    {
      transaction,
      branch,
      paperWidth = '80mm',
      isReprint = false,
      reprintTimestamp,
      cashGiven,
      changeGiven
    },
    ref
  ) => {
    // Parse items if available
    let items: Array<{ name: string; qty: number; price: number; total?: number }> = [];
    if (transaction.itemsJSON) {
      try {
        const parsed = JSON.parse(transaction.itemsJSON);
        if (Array.isArray(parsed)) {
          items = parsed.map((i: any) => ({
            name: i.name || i.product?.name || 'Item Produk',
            qty: i.qty || 1,
            price: i.price || i.product?.price || 0,
            total: (i.qty || 1) * (i.price || i.product?.price || 0)
          }));
        }
      } catch {
        items = [];
      }
    }

    if (items.length === 0) {
      items = [
        {
          name: transaction.desc || 'Transaksi Gym',
          qty: 1,
          price: transaction.amount,
          total: transaction.amount
        }
      ];
    }

    const subtotal = transaction.subtotal || transaction.amount;
    const discount = transaction.discount || 0;
    const adminFee = transaction.adminFee || 0;
    const total = transaction.amount;
    const amountPaid = transaction.amountPaid ?? total;
    const remaining = transaction.amountRemaining ?? Math.max(0, total - amountPaid);

    const isVoid = transaction.status === 'VOID';
    const isRefund = transaction.status === 'REFUND';
    const isLunas = transaction.status === 'Paid' || remaining === 0;

    const actualCashGiven = cashGiven ?? (transaction.initialCashPaid || amountPaid);
    const actualChange = changeGiven ?? Math.max(0, actualCashGiven - amountPaid);

    // Default branch details
    const branchName = branch?.name || transaction.branchName || 'CABANG JATISAMPURNA';
    const branchAddress = branch?.address || 'Jl. Wijaya Kusuma No.25–26, Blok AS 48, Jatisampurna';
    const branchCity = branch?.city || 'Kota Bekasi';
    const branchPhone = branch?.phone || '0812-9876-5432';

    // Width classes
    const widthClass = paperWidth === '58mm' ? 'w-[58mm] max-w-[58mm] text-[10px]' : 'w-[80mm] max-w-[80mm] text-xs';

    // Verification code
    const verifyCode = `RFA-GYM|${transaction.id}`;

    return (
      <div
        ref={ref}
        id="transaction-receipt-printable"
        className={`transaction-print bg-white text-black p-3.5 mx-auto font-mono relative leading-tight shadow-md border border-zinc-200 select-none ${widthClass}`}
        style={{ color: '#000000' }}
      >
        {/* WATERMARK VOID / REFUND */}
        {(isVoid || isRefund) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-10">
            <span className="text-5xl font-black tracking-widest text-red-600 border-4 border-red-600 px-4 py-2 -rotate-12 uppercase">
              {isVoid ? 'VOID' : 'REFUND'}
            </span>
          </div>
        )}

        {/* REPRINT BADGE */}
        {isReprint && (
          <div className="text-center pb-1.5 mb-1.5 border-b border-dashed border-zinc-400">
            <span className="font-bold text-[10px] tracking-wider uppercase bg-black text-white px-2 py-0.5 rounded">
              *** REPRINT STRUK ***
            </span>
            {reprintTimestamp && (
              <span className="block text-[8.5px] text-zinc-600 mt-0.5">
                Dicetak: {reprintTimestamp}
              </span>
            )}
          </div>
        )}

        {/* STORE HEADER */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h1 className="text-base font-black tracking-wider uppercase">RFA GYM</h1>
          <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-800">
            BUILD YOUR BEST VERSION
          </p>
          <p className="text-[9px] mt-1 font-semibold uppercase">{branchName}</p>
          <p className="text-[8.5px] text-zinc-700">{branchAddress}</p>
          <p className="text-[8.5px] text-zinc-700">{branchCity} • Telp: {branchPhone}</p>
        </div>

        {/* TRANSACTION METADATA */}
        <div className="py-2 border-b border-dashed border-black text-[9.5px] space-y-0.5">
          <div className="font-bold uppercase tracking-wide text-zinc-800">TRANSAKSI</div>
          <div className="flex justify-between">
            <span className="font-bold">{transaction.id}</span>
            <span>{transaction.type}</span>
          </div>
          {transaction.invoiceNo && (
            <div className="flex justify-between text-zinc-600">
              <span>No. Invoice:</span>
              <span className="font-mono">{transaction.invoiceNo}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tanggal : {transaction.date}</span>
            <span>Jam : {transaction.time || '16:30'}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir   : {transaction.cashier || 'Admin'}</span>
            <span>PIC : {transaction.picNames || transaction.cashier || 'Staff'}</span>
          </div>
        </div>

        {/* MEMBER / CUSTOMER INFO */}
        <div className="py-1.5 border-b border-dashed border-black text-[9.5px] space-y-0.5">
          <div className="font-bold uppercase tracking-wide text-zinc-800">MEMBER / TAMU</div>
          <div className="flex justify-between">
            <span className="font-bold">{transaction.customer}</span>
            <span className="text-[8.5px]">{transaction.memberId ? `ID: ${transaction.memberId}` : 'Walk-in'}</span>
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="font-bold uppercase tracking-wide text-[9.5px] mb-1">ITEM</div>
          <div className="space-y-1.5">
            {items.map((it, idx) => (
              <div key={idx} className="text-[9.5px]">
                <div className="font-bold">{it.name}</div>
                <div className="flex justify-between text-zinc-700">
                  <span>{it.qty} x {formatRp(it.price)}</span>
                  <span className="font-bold text-black">{formatRp(it.total || it.qty * it.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="py-2 border-b border-dashed border-black text-[9.5px] space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRp(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-zinc-700">
              <span>Diskon</span>
              <span>-{formatRp(discount)}</span>
            </div>
          )}
          {adminFee > 0 && (
            <div className="flex justify-between text-zinc-700">
              <span>Biaya Admin</span>
              <span>{formatRp(adminFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-[11px] pt-1 border-t border-dotted border-zinc-400">
            <span>TOTAL</span>
            <span>{formatRp(total)}</span>
          </div>
        </div>

        {/* PAYMENT DETAILS */}
        <div className="py-2 border-b border-dashed border-black text-[9.5px] space-y-0.5">
          <div className="flex justify-between">
            <span>Pembayaran</span>
            <span className="font-bold uppercase">{transaction.method || 'CASH'}</span>
          </div>
          <div className="flex justify-between">
            <span>Dibayar</span>
            <span className="font-bold">{formatRp(amountPaid)}</span>
          </div>

          {transaction.method?.toLowerCase().includes('cash') || transaction.method?.toLowerCase().includes('tunai') ? (
            actualChange > 0 && (
              <div className="flex justify-between">
                <span>Kembalian</span>
                <span>{formatRp(actualChange)}</span>
              </div>
            )
          ) : null}

          {/* Sisa Piutang / Cicilan Breakdown */}
          {remaining > 0 && (
            <div className="mt-1 pt-1 border-t border-dotted border-zinc-400 text-red-600 font-bold">
              <div className="flex justify-between">
                <span>SISA PIUTANG:</span>
                <span>{formatRp(remaining)}</span>
              </div>
              {transaction.dueDate && transaction.dueDate !== '-' && (
                <div className="flex justify-between text-[8.5px] font-normal text-zinc-700">
                  <span>Jatuh Tempo:</span>
                  <span>{formatDateIndo(transaction.dueDate)}</span>
                </div>
              )}
            </div>
          )}

          {/* STATUS BADGE */}
          <div className="pt-2 text-center">
            <span
              className={`inline-block font-black px-2.5 py-0.5 rounded text-[10px] uppercase border ${
                isVoid
                  ? 'border-red-600 text-red-600'
                  : isRefund
                  ? 'border-amber-600 text-amber-600'
                  : isLunas
                  ? 'border-black text-black bg-zinc-100'
                  : 'border-orange-600 text-orange-600'
              }`}
            >
              STATUS : {isVoid ? 'VOID (BATAL)' : isRefund ? 'REFUND' : isLunas ? 'LUNAS' : transaction.status || 'BELUM LUNAS'}
            </span>
          </div>
        </div>

        {/* REFUND DETAIL IF APPLICABLE */}
        {isRefund && (
          <div className="py-1.5 border-b border-dashed border-black text-[8.5px] space-y-0.5 bg-amber-50/50 p-1 rounded my-1">
            <div className="font-bold text-amber-800 uppercase">RINCIAN REFUND:</div>
            {transaction.refundDate && <div>Tgl: {transaction.refundDate}</div>}
            {transaction.refundAmount && <div>Nominal: {formatRp(transaction.refundAmount)}</div>}
            {transaction.refundReason && <div>Alasan: {transaction.refundReason}</div>}
            {transaction.refundApprovedBy && <div>Disetujui: {transaction.refundApprovedBy}</div>}
          </div>
        )}

        {/* VERIFICATION & QR CODE */}
        <div className="py-2.5 text-center flex flex-col items-center justify-center space-y-1">
          {/* Simple stylized matrix barcode simulation / QR box */}
          <div className="p-1 border border-black inline-block rounded bg-white">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(verifyCode)}`}
              alt="QR Verifikasi"
              className="w-16 h-16 mx-auto"
              onError={(e) => {
                // Fallback simulation box if offline
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="text-[8px] font-mono tracking-wider text-zinc-600">
            {verifyCode}
          </span>
        </div>

        {/* FOOTER */}
        <div className="text-center pt-1 border-t border-dashed border-black text-[9px]">
          <p className="font-bold">Terima kasih</p>
          <p className="font-black tracking-wider uppercase">RFA GYM</p>
          <p className="text-[8px] font-bold tracking-widest uppercase text-zinc-700">
            BUILD YOUR BEST VERSION
          </p>
          <p className="text-[7.5px] text-zinc-500 mt-1">
            Simpan struk ini sebagai bukti pembayaran resmi Anda.
          </p>
        </div>
      </div>
    );
  }
);

TransactionReceipt.displayName = 'TransactionReceipt';

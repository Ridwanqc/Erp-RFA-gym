import React from 'react';
import { Transaction, GymBranch } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';

interface TransactionInvoiceProps {
  transaction: Transaction;
  branch?: GymBranch;
  isReprint?: boolean;
  reprintTimestamp?: string;
  memberPhone?: string;
  memberEmail?: string;
  memberAddress?: string;
  approverName?: string;
}

export const TransactionInvoice = React.forwardRef<HTMLDivElement, TransactionInvoiceProps>(
  (
    {
      transaction,
      branch,
      isReprint = false,
      reprintTimestamp,
      memberPhone = '0812-xxxx-xxxx',
      memberEmail,
      memberAddress,
      approverName = 'Supervisor / Manager'
    },
    ref
  ) => {
    // Generate clean invoice number if missing
    const invoiceNumber =
      transaction.invoiceNo ||
      (transaction.id.startsWith('TRX-')
        ? transaction.id.replace('TRX-', 'INV-')
        : `INV-${transaction.id}`);

    // Parse item breakdown
    let items: Array<{ name: string; qty: number; price: number; discount?: number; total?: number }> = [];
    if (transaction.itemsJSON) {
      try {
        const parsed = JSON.parse(transaction.itemsJSON);
        if (Array.isArray(parsed)) {
          items = parsed.map((i: any) => ({
            name: i.name || i.product?.name || 'Paket / Produk Gym',
            qty: i.qty || 1,
            price: i.price || i.product?.price || 0,
            discount: i.discount || 0,
            total: (i.qty || 1) * (i.price || i.product?.price || 0) - (i.discount || 0)
          }));
        }
      } catch {
        items = [];
      }
    }

    if (items.length === 0) {
      items = [
        {
          name: transaction.desc || 'Transaksi Keanggotaan & Layanan Gym',
          qty: 1,
          price: transaction.amount,
          discount: transaction.discount || 0,
          total: transaction.amount
        }
      ];
    }

    const subtotal = transaction.subtotal || transaction.amount;
    const discount = transaction.discount || 0;
    const tax = transaction.tax || 0;
    const adminFee = transaction.adminFee || 0;
    const total = transaction.amount;
    const amountPaid = transaction.amountPaid ?? total;
    const remaining = transaction.amountRemaining ?? Math.max(0, total - amountPaid);

    const isVoid = transaction.status === 'VOID';
    const isRefund = transaction.status === 'REFUND';
    const isLunas = transaction.status === 'Paid' || remaining === 0;

    // Multi-branch branding
    const branchName = branch?.name || transaction.branchName || 'CABANG JATISAMPURNA';
    const branchAddress = branch?.address || 'Jl. Wijaya Kusuma No.25–26, Blok AS 48, Jatisampurna';
    const branchCity = branch?.city || 'Kota Bekasi';
    const branchPhone = branch?.phone || '0812-9876-5432';

    const verifyCode = `RFA-GYM|${transaction.id}|${invoiceNumber}`;

    return (
      <div
        ref={ref}
        id="transaction-invoice-printable"
        className="transaction-print bg-white text-zinc-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 mx-auto font-sans shadow-lg border border-zinc-200 relative flex flex-col justify-between select-none"
        style={{ color: '#18181b', background: '#ffffff' }}
      >
        {/* WATERMARK VOID / REFUND */}
        {(isVoid || isRefund) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 z-10">
            <span className="text-8xl font-black tracking-widest text-red-600 border-8 border-red-600 px-12 py-6 -rotate-12 uppercase">
              {isVoid ? 'VOID' : 'REFUND'}
            </span>
          </div>
        )}

        <div>
          {/* REPRINT BANNER */}
          {isReprint && (
            <div className="mb-4 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-xs text-amber-900 font-bold">
              <span>SALINAN CETAK ULANG (REPRINT INVOICE)</span>
              <span>Dicetak: {reprintTimestamp || new Date().toLocaleString('id-ID')}</span>
            </div>
          )}

          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-zinc-900">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black text-white font-black text-2xl flex items-center justify-center rounded-xl shadow-xs">
                  R
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight uppercase leading-none">RFA GYM</h1>
                  <p className="text-[11px] font-bold tracking-widest uppercase text-orange-600 mt-1">
                    BUILD YOUR BEST VERSION
                  </p>
                </div>
              </div>
              <div className="text-xs text-zinc-600 mt-3 space-y-0.5 max-w-sm">
                <p className="font-bold text-zinc-800 uppercase">{branchName}</p>
                <p>{branchAddress}</p>
                <p>{branchCity} • Telp: {branchPhone}</p>
              </div>
            </div>

            {/* INVOICE BADGE & NUMBERS */}
            <div className="text-left sm:text-right">
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">INVOICE</h2>
              <div className="mt-2 space-y-1 text-xs">
                <div>
                  <span className="text-zinc-500">No. Invoice: </span>
                  <span className="font-mono font-bold text-zinc-900">{invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-500">No. Transaksi: </span>
                  <span className="font-mono font-bold text-zinc-900">{transaction.id}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Tanggal & Jam: </span>
                  <span className="font-semibold text-zinc-800">
                    {transaction.date} • {transaction.time || '16:30 WIB'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Kasir: </span>
                  <span className="font-semibold text-zinc-800">{transaction.cashier || 'Admin Front Desk'}</span>
                </div>
                {transaction.picNames && (
                  <div>
                    <span className="text-zinc-500">Sales/PIC: </span>
                    <span className="font-semibold text-zinc-800">{transaction.picNames}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BILLED TO / CUSTOMER INFORMATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                DITAGIHKAN KEPADA (CUSTOMER):
              </span>
              <p className="text-sm font-bold text-zinc-900">{transaction.customer}</p>
              <p className="text-zinc-600 font-mono mt-0.5">
                ID Member: {transaction.memberId || 'Non-Member / Walk-In'}
              </p>
              {memberPhone && memberPhone !== '-' && (
                <p className="text-zinc-600">Kontak: {memberPhone}</p>
              )}
              {memberEmail && <p className="text-zinc-600">Email: {memberEmail}</p>}
              {memberAddress && <p className="text-zinc-600">Alamat: {memberAddress}</p>}
            </div>

            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                STATUS & METODE PEMBAYARAN:
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600">Metode Bayar:</span>
                  <span className="font-bold uppercase px-2 py-0.5 bg-zinc-200 rounded text-zinc-800">
                    {transaction.method || 'CASH'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600">Status Pembayaran:</span>
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded text-[11px] ${
                      isVoid
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : isRefund
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : isLunas
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-orange-100 text-orange-800 border border-orange-300'
                    }`}
                  >
                    {isVoid ? 'VOID (BATAL)' : isRefund ? 'REFUND' : isLunas ? 'LUNAS' : transaction.status || 'BELUM LUNAS'}
                  </span>
                </div>
                {transaction.dueDate && transaction.dueDate !== '-' && (
                  <div className="text-red-600 font-semibold pt-1">
                    Jatuh Tempo Cicilan: {formatDateIndo(transaction.dueDate)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ITEM BREAKDOWN TABLE */}
          <div className="mb-6 overflow-hidden border border-zinc-300 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-900 text-white font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Produk / Layanan Gym</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-3 w-24 text-right">Diskon</th>
                  <th className="py-2.5 px-3 w-32 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}>
                    <td className="py-3 px-3 text-center text-zinc-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-zinc-900 block">{it.name}</span>
                      <span className="text-[11px] text-zinc-500">{transaction.type}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-zinc-800">{it.qty}</td>
                    <td className="py-3 px-3 text-right text-zinc-700">{formatRp(it.price)}</td>
                    <td className="py-3 px-3 text-right text-zinc-500">
                      {it.discount && it.discount > 0 ? `-${formatRp(it.discount)}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-zinc-900">
                      {formatRp(it.total || it.qty * it.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY & FINANCIAL TOTALS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 items-start">
            {/* Installment / Notes Box */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-2">
              <h4 className="font-bold text-zinc-800 uppercase tracking-wide">
                Catatan & Rincian Pembayaran
              </h4>
              <p className="text-zinc-600 leading-relaxed">
                Pembayaran yang sah telah divalidasi oleh sistem kasir resmi RFA GYM. Simpan lembar faktur invoice ini untuk klaim garansi sesi latihan, akses fasilitas locker, dan verifikasi keanggotaan.
              </p>
              {remaining > 0 && (
                <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-900 space-y-1 font-bold">
                  <div className="flex justify-between">
                    <span>TOTAL TAGIHAN:</span>
                    <span>{formatRp(total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>DIBAYAR HARI INI:</span>
                    <span>{formatRp(amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-red-700 font-black border-t border-red-300 pt-1">
                    <span>SISA PIUTANG:</span>
                    <span>{formatRp(remaining)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Totals Table */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 px-2 text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatRp(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-1 px-2 text-zinc-600">
                  <span>Potongan Diskon:</span>
                  <span className="font-semibold text-emerald-600">-{formatRp(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between py-1 px-2 text-zinc-600">
                  <span>Pajak (PPN):</span>
                  <span className="font-semibold">{formatRp(tax)}</span>
                </div>
              )}
              {adminFee > 0 && (
                <div className="flex justify-between py-1 px-2 text-zinc-600">
                  <span>Biaya Administrasi:</span>
                  <span className="font-semibold">{formatRp(adminFee)}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 px-3 bg-zinc-900 text-white rounded-lg font-black text-sm mt-2">
                <span>TOTAL AKHIR:</span>
                <span>{formatRp(total)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2 text-zinc-800 font-bold border-b border-zinc-200">
                <span>Jumlah Dibayar:</span>
                <span className="text-emerald-700">{formatRp(amountPaid)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2 text-zinc-800 font-bold">
                <span>Sisa Pembayaran / Piutang:</span>
                <span className={remaining > 0 ? 'text-red-600 font-black' : 'text-zinc-600'}>
                  {formatRp(remaining)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: DIGITAL SIGNATURE & QR CODE */}
        <div className="pt-8 border-t-2 border-zinc-200 mt-6">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            {/* Signature: Customer */}
            <div className="flex flex-col justify-between h-28">
              <span className="text-zinc-500 font-medium">Customer / Member</span>
              <div className="border-b border-zinc-400 w-3/4 mx-auto"></div>
              <span className="font-bold text-zinc-900">{transaction.customer}</span>
            </div>

            {/* Signature: Kasir */}
            <div className="flex flex-col justify-between h-28">
              <span className="text-zinc-500 font-medium">Kasir Bertugas</span>
              <div className="border-b border-zinc-400 w-3/4 mx-auto"></div>
              <span className="font-bold text-zinc-900">{transaction.cashier || 'Kasir Front Desk'}</span>
            </div>

            {/* Signature: Approver & QR */}
            <div className="flex flex-col justify-between items-center h-28">
              <span className="text-zinc-500 font-medium">Otorisasi / QR Verifikasi</span>
              <div className="p-1 border border-zinc-300 rounded bg-white">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyCode)}`}
                  alt="QR Verifikasi"
                  className="w-14 h-14"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="font-bold text-zinc-900 text-[11px]">{approverName}</span>
            </div>
          </div>

          {/* FOOTER MESSAGE */}
          <div className="text-center pt-8 text-zinc-500 text-xs border-t border-zinc-100 mt-6 space-y-1">
            <p className="font-bold text-zinc-800">
              Terima kasih telah menjadi bagian dari RFA Gym.
            </p>
            <p className="text-[10px] tracking-widest uppercase font-bold text-zinc-600">
              RFA GYM • BUILD YOUR BEST VERSION
            </p>
            <p className="text-[9px] text-zinc-400 font-mono">
              Faktur ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah jika kode QR terverifikasi.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

TransactionInvoice.displayName = 'TransactionInvoice';

import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, Calendar, CreditCard, Tag } from 'lucide-react';
import { CompanyExpense } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ExpenseVoucherPrintModalProps {
  expense: CompanyExpense;
  onClose: () => void;
  gymBrand?: string;
}

// Helper: Konversi Angka ke Terbilang Rupiah
function angkaKeTerbilang(nilai: number): string {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  const n = Math.floor(Math.abs(nilai));

  if (n < 12) return bilangan[n];
  if (n < 20) return angkaKeTerbilang(n - 10) + ' Belas';
  if (n < 100) return angkaKeTerbilang(Math.floor(n / 10)) + ' Puluh ' + angkaKeTerbilang(n % 10);
  if (n < 200) return 'Seratus ' + angkaKeTerbilang(n - 100);
  if (n < 1000) return angkaKeTerbilang(Math.floor(n / 100)) + ' Ratus ' + angkaKeTerbilang(n % 100);
  if (n < 2000) return 'Seribu ' + angkaKeTerbilang(n - 1000);
  if (n < 1000000) return angkaKeTerbilang(Math.floor(n / 1000)) + ' Ribu ' + angkaKeTerbilang(n % 1000);
  if (n < 1000000000) return angkaKeTerbilang(Math.floor(n / 1000000)) + ' Juta ' + angkaKeTerbilang(n % 1000000);
  if (n < 1000000000000) return angkaKeTerbilang(Math.floor(n / 1000000000)) + ' Miliar ' + angkaKeTerbilang(n % 1000000000);
  return angkaKeTerbilang(Math.floor(n / 1000000000000)) + ' Triliun ' + angkaKeTerbilang(n % 1000000000000);
}

export const ExpenseVoucherPrintModal: React.FC<ExpenseVoucherPrintModalProps> = ({
  expense,
  onClose,
  gymBrand = 'RFA GYM & FITNESS CENTER'
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const terbilangStr = angkaKeTerbilang(expense.amount).trim() + ' Rupiah';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:my-0 text-white print:text-black">
        {/* Modal Controls - Hidden during print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cetak Voucher Pengeluaran</h3>
              <p className="text-xs text-zinc-400">Bukti Pengeluaran Kas & Bank Resmi Perusahaan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printAreaRef} className="p-8 print:p-6 bg-white text-zinc-900 text-sm">
          {/* Header Surat */}
          <div className="border-b-2 border-orange-500 pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-black flex items-center justify-center text-sm">
                    RFA
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-zinc-900 leading-none">{gymBrand}</h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Enterprise Gym & Fitness Center Network</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mt-2 font-medium">
                  {expense.branchName}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-black rounded-lg uppercase tracking-wider border border-orange-200">
                  VOUCHER PENGELUARAN {expense.paymentMethod === 'Kas' ? 'KAS' : 'BANK'}
                </span>
                <p className="text-sm font-mono font-bold text-zinc-900 mt-2">
                  NO: {expense.expenseNumber}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tanggal: {expense.date}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl mb-6 text-xs">
            <div>
              <span className="text-zinc-500 block">Dibayarkan Kepada (Vendor / Penerima):</span>
              <span className="font-bold text-zinc-900 text-sm">{expense.vendorOrBeneficiary}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Sumber Dana / Rekening Pembayaran:</span>
              <span className="font-bold text-zinc-900 text-sm">{expense.sourceAccount}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Metode Pembayaran:</span>
              <span className="font-bold text-zinc-900">{expense.paymentMethod}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">No. Invoice / Referensi Bukti:</span>
              <span className="font-bold text-zinc-900 font-mono">{expense.invoiceRefNumber || '-'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Kategori Akuntansi:</span>
              <span className="font-semibold text-zinc-900">{expense.categoryName} ({expense.subcategory})</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Perlakuan Buku Akuntansi:</span>
              <span className="inline-block font-semibold px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded text-[11px]">
                {expense.accountingType.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Table Uraian */}
          <table className="w-full border-collapse mb-6 text-xs">
            <thead>
              <tr className="bg-zinc-100 border-y border-zinc-300 text-zinc-700">
                <th className="py-2.5 px-3 text-left font-bold w-12">No.</th>
                <th className="py-2.5 px-3 text-left font-bold">Uraian / Keterangan Pengeluaran</th>
                <th className="py-2.5 px-3 text-right font-bold w-44">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-3 px-3 text-zinc-500 align-top">1.</td>
                <td className="py-3 px-3 align-top">
                  <p className="font-bold text-zinc-900 text-sm">{expense.name}</p>
                  {expense.description && (
                    <p className="text-xs text-zinc-600 mt-1 whitespace-pre-line">{expense.description}</p>
                  )}
                  {expense.notes && (
                    <p className="text-[11px] text-zinc-500 italic mt-1">Catatan: {expense.notes}</p>
                  )}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-sm text-zinc-900 align-top">
                  {formatRp(expense.amount)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-b-2 border-zinc-900 bg-zinc-50 font-bold">
                <td colSpan={2} className="py-3 px-3 text-right text-xs uppercase text-zinc-700">
                  Total Pengeluaran Resmi
                </td>
                <td className="py-3 px-3 text-right font-mono text-base text-orange-600 font-black">
                  {formatRp(expense.amount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Terbilang Box */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl mb-8">
            <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
              Terbilang:
            </span>
            <p className="text-xs font-bold text-zinc-800 italic mt-0.5">
              "{terbilangStr}"
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-4 text-xs mb-8 text-zinc-600">
            <div>
              <span>Status Persetujuan: </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {expense.approvalStatus}
              </span>
            </div>
            <div>
              <span>Status Pembayaran: </span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {expense.paymentStatus}
              </span>
            </div>
          </div>

          {/* Kotak Tanda Tangan Resmi */}
          <div className="grid grid-cols-4 gap-4 text-center text-xs mt-6 pt-4 border-t border-zinc-200">
            <div>
              <p className="text-zinc-500 font-medium mb-12">Diajukan Oleh (PIC)</p>
              <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                {expense.picStaffName}
              </div>
              <p className="text-[10px] text-zinc-400">Pengaju Transaksi</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-12">Disetujui Oleh</p>
              <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                {expense.approvedByUserName || 'Manager Cabang'}
              </div>
              <p className="text-[10px] text-zinc-400">Otorisasi / Pimpinan</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-12">Dibayar Oleh</p>
              <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                {expense.paidByUserName || expense.picStaffName}
              </div>
              <p className="text-[10px] text-zinc-400">Kasir / Finance</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-12">Diterima Oleh</p>
              <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                {expense.vendorOrBeneficiary}
              </div>
              <p className="text-[10px] text-zinc-400">Vendor / Penerima Dana</p>
            </div>
          </div>

          {/* Footer Cetak */}
          <div className="mt-8 pt-4 border-t border-dashed border-zinc-300 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Dicetak secara otomatis melalui RFA GYM ERP Enterprise Cloud</span>
            <span>ID Dokumen: {expense.id} • {new Date().toLocaleString('id-ID')} WIB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

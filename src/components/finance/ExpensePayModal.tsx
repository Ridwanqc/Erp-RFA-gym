import React, { useState } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle2, Building2, Wallet } from 'lucide-react';
import { CompanyExpense } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ExpensePayModalProps {
  expense: CompanyExpense;
  onClose: () => void;
  onSavePayment: (
    expenseId: string,
    paidAmount: number,
    paidAccount: string,
    paymentMethod: CompanyExpense['paymentMethod'],
    refNumber?: string,
    notes?: string
  ) => void;
}

export const ExpensePayModal: React.FC<ExpensePayModalProps> = ({
  expense,
  onClose,
  onSavePayment
}) => {
  const [payAmountInput, setPayAmountInput] = useState<string>(String(expense.balanceRemaining || expense.amount));
  const [paidAccount, setPaidAccount] = useState<string>(expense.sourceAccount || 'Bank Mandiri (Operasional)');
  const [paymentMethod, setPaymentMethod] = useState<CompanyExpense['paymentMethod']>(expense.paymentMethod || 'Transfer Bank');
  const [refNumber, setRefNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const payAmountNumber = Number(payAmountInput) || 0;
  const remainingAfterPayment = Math.max(0, expense.balanceRemaining - payAmountNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmountNumber <= 0) {
      setError('Nominal pembayaran harus lebih besar dari 0.');
      return;
    }
    if (payAmountNumber > expense.balanceRemaining) {
      setError(`Nominal pembayaran tidak boleh melebihi sisa tagihan (${formatRp(expense.balanceRemaining)}).`);
      return;
    }

    onSavePayment(
      expense.id,
      payAmountNumber,
      paidAccount,
      paymentMethod,
      refNumber.trim() || undefined,
      notes.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Catat Pembayaran Pengeluaran</h3>
              <p className="text-xs text-zinc-400">{expense.expenseNumber} • {expense.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Tagihan Summary */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Nominal Pengeluaran:</span>
              <span className="font-mono font-bold text-zinc-200">{formatRp(expense.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Sudah Dibayarkan Sebelumnya:</span>
              <span className="font-mono font-semibold text-emerald-400">{formatRp(expense.paidAmount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-800 font-bold">
              <span className="text-zinc-300">Sisa Tagihan yang Harus Dibayar:</span>
              <span className="font-mono text-amber-400 text-sm">{formatRp(expense.balanceRemaining)}</span>
            </div>
          </div>

          {/* Input Nominal Bayar */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Nominal yang Dibayarkan (Rp) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
              <input
                type="number"
                min="1000"
                max={expense.balanceRemaining}
                value={payAmountInput}
                onChange={(e) => {
                  setPayAmountInput(e.target.value);
                  setError('');
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                placeholder="Masukkan nominal bayar..."
                required
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
              <button
                type="button"
                onClick={() => setPayAmountInput(String(expense.balanceRemaining))}
                className="text-orange-400 hover:underline"
              >
                Bayar Lunas Penuh ({formatRp(expense.balanceRemaining)})
              </button>
              <span>
                Sisa Setelah Bayar:{' '}
                <strong className={remainingAfterPayment === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {formatRp(remainingAfterPayment)}
                </strong>
              </span>
            </div>
          </div>

          {/* Metode & Akun Pembayaran */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Metode Pembayaran <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Kas">Kas Laci Kasir</option>
                <option value="QRIS">QRIS</option>
                <option value="Kartu Debit/EDC">Kartu Debit / EDC</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Sumber Dana / Rekening <span className="text-rose-400">*</span>
              </label>
              <select
                value={paidAccount}
                onChange={(e) => setPaidAccount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Kas Laci (Petty Cash)">Kas Laci Kasir (Petty Cash)</option>
                <option value="Bank Mandiri (Operasional)">Bank Mandiri (Operasional)</option>
                <option value="Bank BCA / Artha Graha">Bank BCA / Artha Graha</option>
                <option value="Bank Mandiri (Payroll)">Bank Mandiri (Payroll)</option>
                <option value="Bank Mandiri (Investasi)">Bank Mandiri (Investasi)</option>
              </select>
            </div>
          </div>

          {/* No Referensi & Catatan */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Nomor Referensi Bukti / Mutasi Bank (Opsional)
            </label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              placeholder="Contoh: TRF-MND-981244"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Catatan Pembayaran (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              placeholder="Catatan pelunasan atau keterangan transfer..."
            />
          </div>

          {/* Alert if using Kas Laci */}
          {paidAccount.includes('Kas Laci') && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <Wallet className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Pembayaran via <strong>Kas Laci</strong> akan secara otomatis mengurangi saldo fisik kas dan tercatat pada formulir <strong>Daily Closing Kasir</strong> cabang hari ini.
              </span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi & Simpan Pembayaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

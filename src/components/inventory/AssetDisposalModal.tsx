import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, DollarSign, Calendar, ShieldAlert, CheckCircle } from 'lucide-react';
import { GymAsset, AssetDisposal } from '../../types';
import { formatRp, APP_TODAY } from '../../utils/formatters';

interface AssetDisposalModalProps {
  asset: GymAsset;
  onConfirmDisposal: (disposal: AssetDisposal, disposalType: 'Dijual' | 'Dihapus') => void;
  onClose: () => void;
}

export const AssetDisposalModal: React.FC<AssetDisposalModalProps> = ({
  asset,
  onConfirmDisposal,
  onClose
}) => {
  const [disposalType, setDisposalType] = useState<'Dijual' | 'Dihapus'>('Dijual');
  const [disposalDate, setDisposalDate] = useState(APP_TODAY);
  const [reason, setReason] = useState('Kerusakan parah pada motor dan sparepart sudah discontinue');
  const [condition, setCondition] = useState('Tidak Layak Pakai');
  const [bookValue, setBookValue] = useState(Math.round((asset.purchasePrice || 0) * 0.1));
  const [saleValue, setSaleValue] = useState(Math.round((asset.purchasePrice || 0) * 0.08));
  const [buyer, setBuyer] = useState('CV Rongsok Fitness Mega');
  const [approvedBy, setApprovedBy] = useState('Direksi GymPro ERP');
  const [notes, setNotes] = useState('Penjualan unit afkir untuk menambah kas operasional.');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!reason.trim()) {
      setErrorMsg('Alasan penghapusan/disposal wajib diisi!');
      return;
    }

    const disposal: AssetDisposal = {
      id: 'DSP-' + String(Math.floor(1000 + Math.random() * 9000)),
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      disposalDate,
      reason,
      condition,
      bookValue: Number(bookValue) || 0,
      saleValue: disposalType === 'Dijual' ? Number(saleValue) || 0 : 0,
      buyer: disposalType === 'Dijual' ? buyer : undefined,
      approvedBy,
      notes
    };

    onConfirmDisposal(disposal, disposalType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-red-500/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold shadow-lg shadow-red-500/10">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Disposal / Penghapusan Asset</h3>
              <p className="text-xs text-zinc-400 font-mono">
                {asset.assetCode} • {asset.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <p>
            Asset tidak akan dihapus permanen agar seluruh histori perawatan, biaya, dan perpindahan tetap tersimpan untuk audit. Status asset akan diubah menjadi <strong className="text-white font-bold">{disposalType}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Metode Penghapusan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDisposalType('Dijual')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                  disposalType === 'Dijual'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <span className="block font-bold">Dijual / Lelang</span>
                  <span className="text-[10px] text-zinc-500">Mendapatkan hasil penjualan</span>
                </div>
                {disposalType === 'Dijual' && <CheckCircle className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setDisposalType('Dihapus')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                  disposalType === 'Dihapus'
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <span className="block font-bold">Dihapus / Dimusnahkan</span>
                  <span className="text-[10px] text-zinc-500">Rusak total / hilang / hibah</span>
                </div>
                {disposalType === 'Dihapus' && <CheckCircle className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Tanggal Disposal
              </label>
              <input
                type="date"
                value={disposalDate}
                onChange={(e) => setDisposalDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Kondisi Terakhir
              </label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Alasan Penghapusan <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan detail mengapa alat dihapus/dijual..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          {disposalType === 'Dijual' && (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Detail Transaksi Penjualan Asset
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Harga Jual Hasil Disposal (Rp)
                  </label>
                  <input
                    type="number"
                    value={saleValue}
                    onChange={(e) => setSaleValue(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Pihak Pembeli
                  </label>
                  <input
                    type="text"
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                    placeholder="Nama vendor / pembeli"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400">
                * Hasil penjualan sebesar <strong className="text-emerald-400">{formatRp(saleValue)}</strong> akan otomatis dicatat sebagai pemasukan non-operasional di Keuangan ERP.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Estimasi Nilai Buku Terakhir
              </label>
              <input
                type="number"
                value={bookValue}
                onChange={(e) => setBookValue(Number(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Disetujui Oleh (Approval)
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Catatan Ekstra
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nomor berita acara, tanda terima serah terima fisik..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Konfirmasi Disposal Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

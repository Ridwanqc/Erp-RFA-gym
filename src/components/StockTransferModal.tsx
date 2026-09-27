import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  Package,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { Product, StockTransferRecord, User } from '../types';
import { useSettings } from '../context/SettingsContext';
import { formatRp, getTimestamp, APP_TODAY } from '../utils/formatters';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onTransferSuccess: (transfer: StockTransferRecord, updatedProducts: Product[]) => void;
  currentUser?: User | null;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  products,
  onTransferSuccess,
  currentUser
}) => {
  const { branches, recordStockTransfer } = useSettings();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [fromBranchId, setFromBranchId] = useState<string>(branches[0]?.id || 'BR-001');
  const [toBranchId, setToBranchId] = useState<string>(branches[1]?.id || 'BR-002');
  const [quantity, setQuantity] = useState<string>('5');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Available stock at origin branch
  const originBranchStock = selectedProduct?.branchStocks?.[fromBranchId] ?? selectedProduct?.stock ?? 0;
  const destBranchStock = selectedProduct?.branchStocks?.[toBranchId] ?? 0;

  const handleProcessTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setErrorMsg('Jumlah transfer harus lebih dari 0.');
      return;
    }

    if (fromBranchId === toBranchId) {
      setErrorMsg('Cabang asal dan cabang tujuan tidak boleh sama.');
      return;
    }

    if (qty > originBranchStock) {
      setErrorMsg(`Stok tidak mencukupi di cabang asal. Stok tersedia: ${originBranchStock} unit.`);
      return;
    }

    const fromBranch = branches.find((b) => b.id === fromBranchId);
    const toBranch = branches.find((b) => b.id === toBranchId);

    // Create Transfer Record
    const newRecord = recordStockTransfer({
      date: new Date().toISOString().split('T')[0],
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      fromBranchId,
      fromBranchName: fromBranch?.name || fromBranchId,
      toBranchId,
      toBranchName: toBranch?.name || toBranchId,
      quantity: qty,
      transferredBy: currentUser?.name || 'Admin',
      notes: notes.trim() || 'Mutasi stok reguler antar cabang',
      status: 'COMPLETED'
    });

    // Update products state with new branch stocks
    const updatedProducts = products.map((p) => {
      if (p.id === selectedProduct.id) {
        const curBranchStocks = { ...(p.branchStocks || {}) };
        const curFrom = curBranchStocks[fromBranchId] ?? p.stock;
        const curTo = curBranchStocks[toBranchId] ?? 0;

        curBranchStocks[fromBranchId] = Math.max(0, curFrom - qty);
        curBranchStocks[toBranchId] = curTo + qty;

        return {
          ...p,
          branchStocks: curBranchStocks
        };
      }
      return p;
    });

    onTransferSuccess(newRecord, updatedProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                Transfer Stok Antar Cabang
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Multi-Branch ERP
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Mutasi produk dan stok antar outlet dengan pencatatan audit log
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleProcessTransfer} className="p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Select */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              Pilih Produk yang Ditransfer *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Total: {p.stock} unit - {formatRp(p.price)})
                </option>
              ))}
            </select>
          </div>

          {/* Branches Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Origin Branch */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-2">
                <Building2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Dari Cabang (Sumber)</span>
              </div>
              <select
                value={fromBranchId}
                onChange={(e) => setFromBranchId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.code}] {b.name}
                  </option>
                ))}
              </select>
              <div className="mt-2.5 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Stok tersedia:</span>
                <span className="font-bold text-white font-mono">{originBranchStock} unit</span>
              </div>
            </div>

            {/* Destination Branch */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ke Cabang (Tujuan)</span>
              </div>
              <select
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === fromBranchId}>
                    [{b.code}] {b.name} {b.id === fromBranchId ? '(Sumber)' : ''}
                  </option>
                ))}
              </select>
              <div className="mt-2.5 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Stok saat ini:</span>
                <span className="font-bold text-white font-mono">{destBranchStock} unit</span>
              </div>
            </div>
          </div>

          {/* Quantity & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Jumlah Transfer *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={originBranchStock || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono text-center font-bold"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                  unit
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Catatan / Alasan Mutasi
              </label>
              <input
                type="text"
                placeholder="Contoh: Restock outlet Senopati untuk persiapan weekend"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Summary Preview */}
          <div className="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-xs text-orange-300/90 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">
                Transfer {quantity || 0} unit {selectedProduct?.name}
              </p>
              <p className="text-[11px] text-zinc-400">
                Stok asal akan berkurang menjadi{' '}
                <span className="text-white font-mono font-bold">
                  {Math.max(0, originBranchStock - (parseInt(quantity, 10) || 0))} unit
                </span>
                , dan stok tujuan bertambah menjadi{' '}
                <span className="text-emerald-400 font-mono font-bold">
                  {destBranchStock + (parseInt(quantity, 10) || 0)} unit
                </span>
                .
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs text-zinc-300 font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Proses Mutasi Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

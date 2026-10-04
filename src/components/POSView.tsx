import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Boxes,
  Search,
  CheckCheck,
  CreditCard,
  Banknote,
  QrCode,
  Trash2,
  Minus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Printer,
  History,
  X
} from 'lucide-react';
import { Product, CartItem, Transaction, User } from '../types';
import { formatRp, getTimestamp, APP_TODAY } from '../utils/formatters';
import { TransactionActions } from './transaction/TransactionActions';

interface POSViewProps {
  products: Product[];
  currentUser: User | null;
  onProcessCheckout: (trx: Transaction, updatedProducts: Product[]) => void;
  onAddProduct: (prod: Product) => void;
  onAddStock: (prodId: string, qtyToAdd: number) => void;
  onNavigateTab?: (tab: any) => void;
  isStoreClosed?: boolean;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  transactions?: Transaction[];
  onReprintReceipt?: (trx: Transaction) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  currentUser,
  onProcessCheckout,
  onAddProduct,
  onAddStock,
  onNavigateTab,
  isStoreClosed,
  showToast,
  transactions = [],
  onReprintReceipt
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [isLowStockAlertExpanded, setIsLowStockAlertExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Transfer' | 'EDC' | 'Kasbon'>('Tunai');
  const [kasbonBorrower, setKasbonBorrower] = useState('');

  // Modals
  const [isAddProdOpen, setIsAddProdOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // New product form
  const [npName, setNpName] = useState('');
  const [npCat, setNpCat] = useState<'Mineral' | 'Supplement' | 'Snack'>('Mineral');
  const [npCost, setNpCost] = useState('');
  const [npPrice, setNpPrice] = useState('');
  const [npStock, setNpStock] = useState('');

  // Stock modal form
  const [stockProdId, setStockProdId] = useState('');
  const [stockQty, setStockQty] = useState('');

  // Low Stock Calculations (< 5 items)
  const lowStockProducts = products.filter((p) => p.stock < 5);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);
  const criticalStockProducts = products.filter((p) => p.stock > 0 && p.stock < 5);

  const handleQuickRestock = (prodId: string) => {
    setStockProdId(prodId);
    setIsStockOpen(true);
  };

  // Add item to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast('Stok Habis', `Stok ${product.name} telah habis.`, 'error');
      return;
    }

    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        showToast('Batas Stok', `Maksimum stok ${product.name} yang tersedia adalah ${product.stock}.`, 'warning');
        return;
      }
      setCart(cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (prodId: string, delta: number) => {
    const item = cart.find((i) => i.id === prodId);
    const prod = products.find((p) => p.id === prodId);
    if (!item || !prod) return;

    if (delta > 0 && item.qty + delta > prod.stock) {
      showToast('Batas Stok', `Maksimum stok ${prod.name} yang tersedia adalah ${prod.stock}.`, 'warning');
      return;
    }

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.id !== prodId));
    } else {
      setCart(cart.map((i) => (i.id === prodId ? { ...i, qty: newQty } : i)));
    }
  };

  const removeFromCart = (prodId: string) => {
    setCart(cart.filter((i) => i.id !== prodId));
  };

  const totalCart = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalCogs = cart.reduce((sum, item) => sum + item.cost * item.qty, 0);

  const handleCheckout = () => {
    if (isStoreClosed) {
      showToast('Toko Ditutup', 'Daily closing telah dilakukan hari ini. Transaksi baru dikunci.', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Keranjang Kosong', 'Pilih minimal satu produk untuk checkout.', 'warning');
      return;
    }

    if (paymentMethod === 'Kasbon' && !kasbonBorrower.trim()) {
      showToast('Peringatan', 'Harap masukkan nama peminjam / kasbon.', 'warning');
      return;
    }

    const isKasbon = paymentMethod === 'Kasbon';
    const status = isKasbon ? 'BELUM LUNAS' : 'Paid';
    const customerName = isKasbon ? kasbonBorrower.trim() : 'Walk-in Guest';

    const newTrx: Transaction = {
      id: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
      date: APP_TODAY,
      time: getTimestamp(),
      type: 'POS',
      desc: `POS FnB: ${cart.map((i) => `${i.qty}x ${i.name}`).join(', ')}`,
      customer: customerName,
      billName: isKasbon ? kasbonBorrower.trim() : undefined,
      amount: totalCart,
      amountPaid: isKasbon ? 0 : totalCart,
      amountRemaining: isKasbon ? totalCart : 0,
      dueDate: isKasbon ? '2026-09-25' : '-',
      cogs: totalCogs,
      profit: totalCart - totalCogs,
      method: paymentMethod,
      status: status,
      cashier: currentUser?.name || 'Kasir',
      bankDest: 'Artha Graha',
      itemsJSON: JSON.stringify(cart),
      initialCashPaid: isKasbon ? 0 : totalCart
    };

    // Deduct stock from products
    const updatedProducts = products.map((p) => {
      const inCart = cart.find((i) => i.id === p.id);
      if (inCart) {
        return { ...p, stock: p.stock - inCart.qty };
      }
      return p;
    });

    onProcessCheckout(newTrx, updatedProducts);
    showToast('Transaksi Berhasil', `Transaksi senilai ${formatRp(totalCart)} berhasil diproses.`, 'success');
    setCart([]);
    setKasbonBorrower('');
    setPaymentMethod('Tunai');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!npName || !npCost || !npPrice || !npStock) return;

    const newProduct: Product = {
      id: 'P' + Date.now(),
      name: npName,
      cat: npCat,
      cost: Number(npCost),
      price: Number(npPrice),
      stock: Number(npStock),
      img: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=200&auto=format&fit=crop'
    };

    onAddProduct(newProduct);
    showToast('Produk Ditambah', `Produk ${npName} berhasil disimpan.`, 'success');
    setIsAddProdOpen(false);
    setNpName('');
    setNpCost('');
    setNpPrice('');
    setNpStock('');
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProdId || !stockQty) return;

    onAddStock(stockProdId, Number(stockQty));
    showToast('Stok Ditambahkan', `Stok barang berhasil diperbarui (+${stockQty}).`, 'success');
    setIsStockOpen(false);
    setStockQty('');
  };

  const filteredProducts = products.filter((p) => {
    if (showOnlyLowStock && p.stock >= 5) return false;
    if (selectedCat !== 'all' && p.cat !== selectedCat) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left Column: Product Catalog */}
        <div className="lg:col-span-2 flex flex-col h-full space-y-3.5">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari barang FnB / Suplemen..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-orange-500 transition"
              />
            </div>

            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-xs font-semibold rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition w-full sm:w-1/3"
            >
              <option value="all">Semua Kategori</option>
              <option value="Mineral">Minuman Mineral</option>
              <option value="Supplement">Suplemen & Protein</option>
              <option value="Snack">Snack Bar</option>
            </select>

            <div className="flex gap-2">
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('products')}
                  title="Buka Manajemen Produk & Inventaris"
                  className="bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 font-bold px-3 py-3 rounded-xl transition text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Boxes className="w-4 h-4" /> Kelola Inventaris
                </button>
              )}
              <button
                onClick={() => setIsAddProdOpen(true)}
                title="Tambah Produk Baru"
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-3.5 py-3 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsStockOpen(true)}
                title="Tambah Stok Masuk"
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold px-3.5 py-3 rounded-xl transition text-xs flex items-center gap-1.5"
              >
                <Boxes className="w-4 h-4" /> Stok
              </button>
            </div>
          </div>

          {/* LOW STOCK ALERT BANNER (< 5 ITEM) */}
          {lowStockProducts.length > 0 && (
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-rose-950/30 border border-amber-500/40 rounded-2xl p-3 shadow-lg shrink-0 transition">
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                        Peringatan Stok Rendah (&lt; 5 Item)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {lowStockProducts.length} Produk Butuh Restock
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {outOfStockProducts.length > 0 && (
                        <span className="text-rose-400 font-bold mr-2">{outOfStockProducts.length} produk habis (0)!</span>
                      )}
                      {criticalStockProducts.length > 0 && (
                        <span className="text-amber-300 font-medium">{criticalStockProducts.length} produk tersisa &lt; 5 item.</span>
                      )}
                      <span className="text-zinc-500 ml-1">Klik restock untuk menambah stok.</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                      showOnlyLowStock
                        ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                        : 'bg-zinc-800/80 hover:bg-zinc-750 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {showOnlyLowStock ? 'Tampilkan Semua' : 'Filter Stok Rendah'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLowStockAlertExpanded(!isLowStockAlertExpanded)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition"
                    title={isLowStockAlertExpanded ? 'Tutup daftar cepat' : 'Buka daftar restock cepat'}
                  >
                    {isLowStockAlertExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Restock Strip */}
              {isLowStockAlertExpanded && (
                <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {lowStockProducts.map((lp) => (
                    <div
                      key={`alert-${lp.id}`}
                      className="bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-2 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={lp.img} alt={lp.name} className="w-8 h-8 rounded-lg object-cover bg-zinc-900 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{lp.name}</p>
                          <span
                            className={`inline-block text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                              lp.stock <= 0
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {lp.stock <= 0 ? 'Habis (0)' : `Sisa ${lp.stock}`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickRestock(lp.id)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition shrink-0 flex items-center gap-1"
                      >
                        <Boxes className="w-3 h-3" /> Restock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Grid */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Tidak ada produk ditemukan</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {showOnlyLowStock ? 'Tidak ada produk dengan stok di bawah 5 item.' : 'Coba sesuaikan kata kunci pencarian atau kategori.'}
                  </p>
                </div>
                {showOnlyLowStock && (
                  <button
                    type="button"
                    onClick={() => setShowOnlyLowStock(false)}
                    className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-xl hover:bg-orange-500/20 transition"
                  >
                    Tampilkan Semua Produk
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock < 5;

                  return (
                    <div
                      key={p.id}
                      className={`bg-zinc-950 border rounded-2xl p-3 text-center transition flex flex-col justify-between relative group ${
                        isOutOfStock
                          ? 'border-rose-500/50 bg-rose-950/10'
                          : isLowStock
                          ? 'border-amber-500/50 bg-amber-950/10 hover:border-amber-400'
                          : 'border-zinc-800 hover:border-orange-500/70 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Low Stock Badge on Card */}
                      {isOutOfStock && (
                        <span className="absolute top-2 right-2 bg-rose-500/30 text-rose-300 border border-rose-500/50 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider z-10 animate-pulse">
                          Habis (0)
                        </span>
                      )}
                      {isLowStock && (
                        <span className="absolute top-2 right-2 bg-amber-500/25 text-amber-300 border border-amber-500/50 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 z-10 shadow-sm">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> Sisa {p.stock}
                        </span>
                      )}

                      <div
                        onClick={() => !isOutOfStock && addToCart(p)}
                        className={isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
                      >
                        <div className="w-16 h-16 rounded-xl mx-auto mb-2.5 overflow-hidden bg-zinc-900">
                          <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-bold text-xs text-white line-clamp-2 leading-tight">{p.name}</h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-800/80 space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span
                            className={`font-black text-[10px] ${
                              isOutOfStock
                                ? 'text-rose-400'
                                : isLowStock
                                ? 'text-amber-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            Stok: {p.stock}
                          </span>
                          <span className="text-orange-400 font-black">{formatRp(p.price)}</span>
                        </div>

                        {/* 1-Click Restock Shortcut for Low / Out of Stock Items */}
                        {(isOutOfStock || isLowStock) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickRestock(p.id);
                            }}
                            className="w-full py-1 text-[10px] font-bold rounded-lg bg-zinc-900 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition flex items-center justify-center gap-1"
                          >
                            <Boxes className="w-3 h-3" /> Restock Stok
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Cart & Payment */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl flex flex-col h-full overflow-hidden shadow-sm">
          {/* Cart Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40 shrink-0">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-500" /> Keranjang Kasir
            </h3>
            <span className="bg-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
              {cart.reduce((s, i) => s + i.qty, 0)} Item
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs py-12">
                <ShoppingBag className="w-10 h-10 opacity-20 mb-2" />
                <p>Keranjang masih kosong.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Klik item di katalog untuk menambahkan.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                    <p className="text-[10px] text-zinc-400 font-medium">{formatRp(item.price)}</p>
                  </div>

                  <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-1 gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-5 h-5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-white w-5 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-5 h-5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right w-20 shrink-0">
                    <span className="text-xs font-black text-orange-400">{formatRp(item.price * item.qty)}</span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Bottom Checkout Panel */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 shrink-0 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Metode Pembayaran (Rek. Bank Artha Graha)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
              >
                <option value="Tunai">Tunai / Cash Laci</option>
                <option value="QRIS">QRIS / E-Wallet</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="EDC">Debit / Kartu EDC</option>
                <option value="Kasbon">Bayar Nanti (Kasbon Piutang)</option>
              </select>
            </div>

            {/* Input name for Kasbon */}
            {paymentMethod === 'Kasbon' && (
              <div className="animate-in fade-in">
                <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 ml-1">
                  Nama Peminjam / Kasbon
                </label>
                <input
                  type="text"
                  value={kasbonBorrower}
                  onChange={(e) => setKasbonBorrower(e.target.value)}
                  placeholder="Ketik nama peminjam..."
                  className="w-full bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-2 text-xs font-bold text-rose-300 placeholder:text-rose-400/50 outline-none"
                />
              </div>
            )}

            <div className="flex justify-between items-end pt-1">
              <span className="text-xs font-bold text-zinc-400">Total Tagihan:</span>
              <span className="text-xl font-black text-orange-400">{formatRp(totalCart)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-md transition text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <CheckCheck className="w-4 h-4" /> Proses Bayar & Cetak Nota
            </button>

            {/* Quick Reprint & History */}
            {transactions.filter((t) => t.type === 'POS' || t.desc.includes('POS')).length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                {(() => {
                  const lastPOSTrx = transactions.find((t) => t.type === 'POS' || t.desc.includes('POS'));
                  if (!lastPOSTrx) return null;
                  return (
                    <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Nota Terakhir</span>
                        <span className="text-[11px] font-bold text-zinc-200 font-mono truncate block">{lastPOSTrx.id}</span>
                      </div>
                      <TransactionActions
                        transaction={lastPOSTrx}
                        onView={onReprintReceipt}
                        onPrint={onReprintReceipt}
                        size="sm"
                        showLabels={false}
                      />
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition text-[11px] font-bold flex items-center justify-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Lihat Riwayat & Cetak Nota Kasir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH PRODUK BARU */}
      {isAddProdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Tambah Produk Baru</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={npName}
                  onChange={(e) => setNpName(e.target.value)}
                  required
                  placeholder="Cth: Pocari Sweat 500ml"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={npCat}
                    onChange={(e) => setNpCat(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Mineral">Minuman</option>
                    <option value="Supplement">Suplemen</option>
                    <option value="Snack">Snack Bar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    value={npStock}
                    onChange={(e) => setNpStock(e.target.value)}
                    required
                    min="0"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Harga Modal (Rp)
                  </label>
                  <input
                    type="number"
                    value={npCost}
                    onChange={(e) => setNpCost(e.target.value)}
                    required
                    min="0"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    value={npPrice}
                    onChange={(e) => setNpPrice(e.target.value)}
                    required
                    min="0"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProdOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH STOK MASUK */}
      {isStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Input Stok Barang Masuk</h3>
            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Pilih Produk
                </label>
                <select
                  value={stockProdId}
                  onChange={(e) => setStockProdId(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Barang --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Jumlah Stok Masuk (Qty)
                </label>
                <input
                  type="number"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  required
                  min="1"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStockOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Update Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT TRANSAKSI KASIR POS */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl p-5 my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Riwayat Transaksi Kasir POS & Cetak Nota</h3>
                  <p className="text-xs text-zinc-400">Daftar seluruh penjualan kasir dengan aksi Detail, Cetak, dan Unduh PDF.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="py-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari no. transaksi (TRX-...), nama pembeli, kasir, atau produk..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 border border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold sticky top-0 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">No. Transaksi</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Pelanggan</th>
                    <th className="py-2.5 px-3">Deskripsi Barang</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi (Cetak/PDF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
                  {transactions
                    .filter((t) => t.type === 'POS' || t.desc.toLowerCase().includes('pos'))
                    .filter((t) => {
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return (
                        t.id.toLowerCase().includes(q) ||
                        t.customer.toLowerCase().includes(q) ||
                        (t.cashier && t.cashier.toLowerCase().includes(q)) ||
                        t.desc.toLowerCase().includes(q)
                      );
                    })
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                          {t.id}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                          <div>{t.date}</div>
                          <div className="text-[10px] text-zinc-500">{t.time || ''}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">
                          {t.customer}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300 max-w-xs truncate" title={t.desc}>
                          {t.desc}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700">
                            {t.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono whitespace-nowrap">
                          {formatRp(t.amountPaid || t.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : t.status === 'VOID'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <TransactionActions
                            transaction={t}
                            onView={onReprintReceipt}
                            onPrint={onReprintReceipt}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {transactions.filter((t) => t.type === 'POS' || t.desc.toLowerCase().includes('pos')).length === 0 && (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  Belum ada data transaksi kasir POS yang tersimpan.
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

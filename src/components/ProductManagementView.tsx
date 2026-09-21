import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  Download,
  ArrowUpDown,
  CheckCircle2,
  X,
  Layers,
  Package,
  DollarSign,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  Calendar,
  BarChart3,
  Receipt,
  User as UserIcon,
  Clock,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { Product, Transaction } from '../types';
import { formatRp, formatDateIndo, APP_TODAY } from '../utils/formatters';

interface ProductManagementViewProps {
  products: Product[];
  transactions: Transaction[];
  onSaveProduct: (product: Product, isNew: boolean) => void;
  onDeleteProduct: (productId: string) => void;
  onAddStock: (productId: string, qty: number, note?: string) => void;
  onNavigateTab: (tab: any) => void;
}

// Preset photo options for quick product creation
const PRESET_PRODUCT_IMAGES = [
  { label: 'Air Mineral 600ml', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=300&auto=format&fit=crop' },
  { label: 'Minuman Isotonik', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=300&auto=format&fit=crop' },
  { label: 'Whey Protein Sachet', url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=300&auto=format&fit=crop' },
  { label: 'BCAA Energy Drink', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=300&auto=format&fit=crop' },
  { label: 'Protein Bar Cokelat', url: 'https://images.unsplash.com/photo-1622484212850-cab596d66e74?q=80&w=300&auto=format&fit=crop' },
  { label: 'Oatmeal Energy Cookie', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=300&auto=format&fit=crop' },
  { label: 'Shaker Bottle Gym', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop' },
  { label: 'Gym Hand Grip / Gloves', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop' }
];

interface ParsedSoldItem {
  productId?: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  subtotal: number;
  subtotalCost: number;
  profit: number;
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  products,
  transactions,
  onSaveProduct,
  onDeleteProduct,
  onAddStock,
  onNavigateTab
}) => {
  // Top Level View Switcher
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'sales-report'>('inventory');

  // ==========================================
  // INVENTORY TAB STATE
  // ==========================================
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'safe' | 'low' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc' | 'margin-desc'>('stock-asc');

  // Modal: Add / Edit Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    cat: 'Mineral',
    customCat: '',
    cost: '',
    price: '',
    stock: '',
    img: ''
  });

  // Modal: Restock
  const [restockModal, setRestockModal] = useState<{
    isOpen: boolean;
    product: Product | null;
    qty: string;
    type: 'add' | 'set';
    note: string;
  }>({
    isOpen: false,
    product: null,
    qty: '',
    type: 'add',
    note: 'Restock Pembelian Baru'
  });

  // Modal: Delete Confirmation
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({
    isOpen: false,
    product: null
  });

  // ==========================================
  // SALES REPORT TAB STATE & FILTERS
  // ==========================================
  const [datePreset, setDatePreset] = useState<'today' | '7days' | 'thisMonth' | 'all' | 'custom'>('thisMonth');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>(APP_TODAY);
  const [salesStatusFilter, setSalesStatusFilter] = useState<'all' | 'Paid' | 'BELUM LUNAS'>('all');
  const [salesProductFilter, setSalesProductFilter] = useState<string>('all');
  const [salesSearchQuery, setSalesSearchQuery] = useState<string>('');

  // Handle Date Preset Changes
  const handleDatePresetChange = (preset: 'today' | '7days' | 'thisMonth' | 'all' | 'custom') => {
    setDatePreset(preset);
    const today = new Date(APP_TODAY + 'T00:00:00');

    if (preset === 'today') {
      setStartDate(APP_TODAY);
      setEndDate(APP_TODAY);
    } else if (preset === '7days') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      setStartDate(sevenDaysAgo.toISOString().slice(0, 10));
      setEndDate(APP_TODAY);
    } else if (preset === 'thisMonth') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setStartDate(`${year}-${month}-01`);
      setEndDate(APP_TODAY);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.cat) set.add(p.cat);
    });
    return Array.from(set);
  }, [products]);

  // Inventory Aggregate Metrics
  const invMetrics = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalCostValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.cost || 0), 0);
    const totalPriceValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0);
    const potentialProfit = Math.max(0, totalPriceValue - totalCostValue);
    const profitMarginPct = totalPriceValue > 0 ? (potentialProfit / totalPriceValue) * 100 : 0;

    const outOfStock = products.filter((p) => p.stock <= 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5).length;
    const safeStock = products.filter((p) => p.stock >= 5).length;

    return {
      totalProducts,
      totalUnits,
      totalCostValue,
      totalPriceValue,
      potentialProfit,
      profitMarginPct,
      outOfStock,
      lowStock,
      safeStock
    };
  }, [products]);

  // Filtered Inventory Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (invSearchQuery.trim()) {
          const q = invSearchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCat = p.cat.toLowerCase().includes(q);
          const matchId = p.id.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchId) return false;
        }

        if (selectedCat !== 'all' && p.cat !== selectedCat) {
          return false;
        }

        if (stockStatusFilter === 'safe' && p.stock < 5) return false;
        if (stockStatusFilter === 'low' && (p.stock < 1 || p.stock >= 5)) return false;
        if (stockStatusFilter === 'empty' && p.stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'stock-asc':
            return a.stock - b.stock;
          case 'stock-desc':
            return b.stock - a.stock;
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'margin-desc': {
            const marginA = a.price - a.cost;
            const marginB = b.price - b.cost;
            return marginB - marginA;
          }
          default:
            return 0;
        }
      });
  }, [products, invSearchQuery, selectedCat, stockStatusFilter, sortBy]);

  // =========================================================================
  // PARSING & AGGREGATING SALES REPORT
  // =========================================================================
  // Helper to extract sold items from POS transactions
  const parseTrxItems = (trx: Transaction): ParsedSoldItem[] => {
    // Try itemsJSON first
    if (trx.itemsJSON) {
      try {
        const parsed = JSON.parse(trx.itemsJSON);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => {
            const prod = products.find((p) => p.id === item.id || p.name.toLowerCase() === item.name?.toLowerCase());
            const qty = item.qty || 1;
            const price = item.price || prod?.price || 0;
            const cost = item.cost !== undefined ? item.cost : prod?.cost || 0;
            const subtotal = price * qty;
            const subtotalCost = cost * qty;
            return {
              productId: prod?.id || item.id,
              name: item.name || prod?.name || 'Produk FnB',
              qty,
              price,
              cost,
              subtotal,
              subtotalCost,
              profit: subtotal - subtotalCost
            };
          });
        }
      } catch {
        // Fallback to text parsing
      }
    }

    // Fallback: Parse from desc (e.g. "POS: 2x Air Mineral Prima 600ml, 1x Protein Bar")
    const results: ParsedSoldItem[] = [];
    const descText = trx.desc.replace(/^POS(\s*FnB)?:\s*/i, '');
    const parts = descText.split(',').map((s) => s.trim()).filter(Boolean);

    for (const part of parts) {
      // Check pattern like "2x Air Mineral" or "1x Pocari"
      const match = part.match(/^(\d+)x\s*(.*)$/i);
      const qty = match ? parseInt(match[1], 10) : 1;
      const itemName = match ? match[2].trim() : part;

      const prod = products.find(
        (p) =>
          p.name.toLowerCase() === itemName.toLowerCase() ||
          p.name.toLowerCase().includes(itemName.toLowerCase()) ||
          itemName.toLowerCase().includes(p.name.toLowerCase())
      );

      const price = prod?.price || (parts.length > 0 ? Math.round(trx.amount / parts.length) : trx.amount);
      const cost = prod?.cost || (trx.cogs ? Math.round(trx.cogs / parts.length) : 0);
      const subtotal = price * qty;
      const subtotalCost = cost * qty;

      results.push({
        productId: prod?.id,
        name: prod?.name || itemName,
        qty,
        price,
        cost,
        subtotal,
        subtotalCost,
        profit: subtotal - subtotalCost
      });
    }

    if (results.length === 0) {
      // If nothing parsed, single generic POS entry
      results.push({
        name: trx.desc || 'Penjualan POS',
        qty: 1,
        price: trx.amount,
        cost: trx.cogs || 0,
        subtotal: trx.amount,
        subtotalCost: trx.cogs || 0,
        profit: trx.profit || trx.amount - (trx.cogs || 0)
      });
    }

    return results;
  };

  // Filter POS Transactions based on Date, Status, Search, and Product
  const filteredSalesData = useMemo(() => {
    // 1. Filter all POS transactions
    const posTrxs = transactions.filter((t) => t.type === 'POS' && t.status !== 'VOID');

    // 2. Date filtering
    const dateFiltered = posTrxs.filter((t) => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });

    // 3. Status filtering
    const statusFiltered = dateFiltered.filter((t) => {
      if (salesStatusFilter === 'all') return true;
      if (salesStatusFilter === 'Paid') return t.status === 'Paid';
      if (salesStatusFilter === 'BELUM LUNAS') return t.status === 'BELUM LUNAS' || t.status === 'DP 50%';
      return true;
    });

    // 4. Map transactions with parsed items
    const trxsWithItems = statusFiltered.map((trx) => {
      const items = parseTrxItems(trx);
      const totalUnits = items.reduce((sum, i) => sum + i.qty, 0);
      const calculatedRevenue = trx.amount;
      const calculatedCost = trx.cogs !== undefined ? trx.cogs : items.reduce((sum, i) => sum + i.subtotalCost, 0);
      const calculatedProfit = trx.profit !== undefined ? trx.profit : calculatedRevenue - calculatedCost;

      return {
        ...trx,
        parsedItems: items,
        totalUnits,
        calculatedRevenue,
        calculatedCost,
        calculatedProfit
      };
    });

    // 5. Product & Search filtering
    const finalFiltered = trxsWithItems.filter((item) => {
      // Product filter
      if (salesProductFilter !== 'all') {
        const hasProduct = item.parsedItems.some(
          (p) => p.productId === salesProductFilter || p.name.toLowerCase().includes(salesProductFilter.toLowerCase())
        );
        if (!hasProduct) return false;
      }

      // Search filter (Customer, Cashier, ID, Product name)
      if (salesSearchQuery.trim()) {
        const q = salesSearchQuery.toLowerCase();
        const matchCust = item.customer.toLowerCase().includes(q);
        const matchCashier = item.cashier.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        const matchItem = item.parsedItems.some((i) => i.name.toLowerCase().includes(q));
        if (!matchCust && !matchCashier && !matchId && !matchItem) return false;
      }

      return true;
    });

    // Sort by date & time descending
    finalFiltered.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.time.localeCompare(a.time);
    });

    // Aggregate Product-level Performance
    const productStatsMap = new Map<
      string,
      {
        id: string;
        name: string;
        cat: string;
        img: string;
        unitSold: number;
        revenue: number;
        cost: number;
        profit: number;
        trxCount: number;
      }
    >();

    // Initialize map with known products
    products.forEach((p) => {
      productStatsMap.set(p.id, {
        id: p.id,
        name: p.name,
        cat: p.cat,
        img: p.img,
        unitSold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        trxCount: 0
      });
    });

    let totalRevenueSum = 0;
    let totalCostSum = 0;
    let totalProfitSum = 0;
    let totalUnitsSum = 0;

    finalFiltered.forEach((trx) => {
      totalRevenueSum += trx.calculatedRevenue;
      totalCostSum += trx.calculatedCost;
      totalProfitSum += trx.calculatedProfit;

      trx.parsedItems.forEach((pi) => {
        totalUnitsSum += pi.qty;

        // Match product by ID or name
        const matched =
          (pi.productId && productStatsMap.get(pi.productId)) ||
          Array.from(productStatsMap.values()).find((p) => p.name.toLowerCase() === pi.name.toLowerCase());

        if (matched) {
          matched.unitSold += pi.qty;
          matched.revenue += pi.subtotal;
          matched.cost += pi.subtotalCost;
          matched.profit += pi.profit;
          matched.trxCount += 1;
        } else {
          // If item doesn't exist in product list, create ad-hoc entry
          const key = pi.name;
          const existing = productStatsMap.get(key);
          if (existing) {
            existing.unitSold += pi.qty;
            existing.revenue += pi.subtotal;
            existing.cost += pi.subtotalCost;
            existing.profit += pi.profit;
            existing.trxCount += 1;
          } else {
            productStatsMap.set(key, {
              id: pi.productId || 'EXT',
              name: pi.name,
              cat: 'Lainnya',
              img: PRESET_PRODUCT_IMAGES[0].url,
              unitSold: pi.qty,
              revenue: pi.subtotal,
              cost: pi.subtotalCost,
              profit: pi.profit,
              trxCount: 1
            });
          }
        }
      });
    });

    const productRanking = Array.from(productStatsMap.values())
      .filter((item) => (salesProductFilter === 'all' ? true : item.id === salesProductFilter || item.name.toLowerCase().includes(salesProductFilter.toLowerCase())))
      .sort((a, b) => b.unitSold - a.unitSold || b.revenue - a.revenue);

    const profitMarginPct = totalRevenueSum > 0 ? (totalProfitSum / totalRevenueSum) * 100 : 0;
    const avgBasketSize = finalFiltered.length > 0 ? Math.round(totalRevenueSum / finalFiltered.length) : 0;

    return {
      transactions: finalFiltered,
      productRanking,
      summary: {
        totalRevenue: totalRevenueSum,
        totalCost: totalCostSum,
        totalProfit: totalProfitSum,
        profitMarginPct,
        totalUnits: totalUnitsSum,
        totalTrxCount: finalFiltered.length,
        avgBasketSize
      }
    };
  }, [transactions, products, startDate, endDate, salesStatusFilter, salesProductFilter, salesSearchQuery]);

  // Export Sales Report to CSV
  const handleExportSalesReportCSV = () => {
    const headers = [
      'No. Transaksi',
      'Tanggal',
      'Waktu',
      'Pelanggan',
      'Kasir',
      'Metode Bayar',
      'Status',
      'Rincian Produk',
      'Total Unit',
      'Total Penjualan (Rp)',
      'HPP Modal (Rp)',
      'Laba Bersih (Rp)'
    ];

    const rows = filteredSalesData.transactions.map((t) => {
      const itemsSummary = t.parsedItems.map((i) => `${i.qty}x ${i.name}`).join('; ');
      return [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.time}"`,
        `"${t.customer.replace(/"/g, '""')}"`,
        `"${t.cashier.replace(/"/g, '""')}"`,
        `"${t.method}"`,
        `"${t.status}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        t.totalUnits,
        t.calculatedRevenue,
        t.calculatedCost,
        t.calculatedProfit
      ];
    });

    const periodStr = startDate && endDate ? `${startDate}_sd_${endDate}` : 'Semua_Waktu';
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_Produk_POS_${periodStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Inventory to CSV
  const handleExportInventoryCSV = () => {
    const headers = ['ID Produk', 'Kategori', 'Nama Produk', 'Harga Modal (HPP)', 'Harga Jual', 'Margin (Rp)', 'Stok (Unit)', 'Nilai Aset Modal', 'Nilai Jual Total', 'Status Stok'];
    const rows = filteredProducts.map((p) => {
      const margin = p.price - p.cost;
      const totalCost = p.stock * p.cost;
      const totalPrice = p.stock * p.price;
      const status = p.stock <= 0 ? 'Habis (0)' : p.stock < 5 ? 'Kritis (<5)' : 'Aman';
      return [
        `"${p.id}"`,
        `"${p.cat}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        p.cost,
        p.price,
        margin,
        p.stock,
        totalCost,
        totalPrice,
        `"${status}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventaris_Produk_GymPro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handlers for Add/Edit
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    const existingNums = products
      .map((p) => {
        const match = p.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : products.length + 1;
    const nextId = `P${nextNum < 10 ? '0' : ''}${nextNum}`;

    setFormData({
      id: nextId,
      name: '',
      cat: 'Mineral',
      customCat: '',
      cost: '5000',
      price: '10000',
      stock: '20',
      img: PRESET_PRODUCT_IMAGES[0].url
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setIsEditMode(true);
    const isStandardCat = ['Mineral', 'Supplement', 'Snack', 'Merchandise', 'Apparel'].includes(p.cat);
    setFormData({
      id: p.id,
      name: p.name,
      cat: isStandardCat ? p.cat : 'Lainnya',
      customCat: isStandardCat ? '' : p.cat,
      cost: p.cost.toString(),
      price: p.price.toString(),
      stock: p.stock.toString(),
      img: p.img || PRESET_PRODUCT_IMAGES[0].url
    });
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalCat = formData.cat === 'Lainnya' ? formData.customCat.trim() || 'Lainnya' : formData.cat;

    const newProduct: Product = {
      id: formData.id.trim() || `P${Date.now()}`,
      cat: finalCat,
      name: formData.name.trim(),
      cost: Math.max(0, parseInt(formData.cost, 10) || 0),
      price: Math.max(0, parseInt(formData.price, 10) || 0),
      stock: Math.max(0, parseInt(formData.stock, 10) || 0),
      img: formData.img.trim() || PRESET_PRODUCT_IMAGES[0].url
    };

    onSaveProduct(newProduct, !isEditMode);
    setIsProductModalOpen(false);
  };

  const handleSubmitRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModal.product || !restockModal.qty) return;

    const num = parseInt(restockModal.qty, 10);
    if (isNaN(num)) return;

    if (restockModal.type === 'add') {
      onAddStock(restockModal.product.id, num, restockModal.note);
    } else {
      const delta = num - restockModal.product.stock;
      onAddStock(restockModal.product.id, delta, restockModal.note || 'Koreksi Stok Opname');
    }

    setRestockModal({ isOpen: false, product: null, qty: '', type: 'add', note: '' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" />
            <span>Inventaris & Penjualan Kasir POS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Manajemen Produk & Penjualan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Pusat kendali katalog barang dagangan, stok opname fisik, serta laporan analitik penjualan produk FnB & suplemen.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeSubTab === 'inventory' ? (
            <button
              onClick={handleExportInventoryCSV}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Download file CSV inventaris stok"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>Ekspor Stok CSV</span>
            </button>
          ) : (
            <button
              onClick={handleExportSalesReportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Download laporan penjualan produk CSV"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Laporan Penjualan CSV</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('pos')}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-orange-400 border border-orange-500/30 text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-orange-600/30 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Main Mode Navigation Tabs (Katalog vs Laporan Penjualan) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-md">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'inventory'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog & Stok Fisik</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeSubTab === 'inventory' ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {products.length} SKU
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('sales-report')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'sales-report'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Laporan Penjualan Produk</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeSubTab === 'sales-report' ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {filteredSalesData.transactions.length} Trx
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: INVENTORY & STOK FISIK                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          {/* KPI Overview Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Total Katalog</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{invMetrics.totalProducts}</span>
                  <span className="text-xs text-zinc-400 font-semibold">SKU Produk</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Total fisik: <strong className="text-zinc-300">{invMetrics.totalUnits}</strong> unit barang
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Nilai Aset Modal</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-white">{formatRp(invMetrics.totalCostValue)}</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Potensi omzet jual: <strong className="text-emerald-400">{formatRp(invMetrics.totalPriceValue)}</strong>
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Potensi Profit Kotor</span>
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-orange-400">{formatRp(invMetrics.potentialProfit)}</span>
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-zinc-400">
                  <span className="text-emerald-400 font-bold">~{invMetrics.profitMarginPct.toFixed(1)}%</span>
                  <span>margin keuntungan</span>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden ${
                invMetrics.outOfStock > 0 || invMetrics.lowStock > 0
                  ? 'bg-gradient-to-br from-zinc-900 to-amber-950/20 border-amber-500/40'
                  : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Status Ketersediaan</span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    invMetrics.outOfStock > 0
                      ? 'bg-rose-500/20 text-rose-400'
                      : invMetrics.lowStock > 0
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  {invMetrics.outOfStock > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {invMetrics.outOfStock} Habis (0)
                    </span>
                  ) : null}
                  {invMetrics.lowStock > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {invMetrics.lowStock} Kritis (&lt;5)
                    </span>
                  ) : null}
                  {invMetrics.outOfStock === 0 && invMetrics.lowStock === 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Semua Stok Aman
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  <strong className="text-emerald-400">{invMetrics.safeStock}</strong> produk dengan stok cukup
                </p>
              </div>
            </div>
          </div>

          {/* Filter & Control Bar */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={invSearchQuery}
                  onChange={(e) => setInvSearchQuery(e.target.value)}
                  placeholder="Cari ID barang, nama produk, kategori suplemen..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-orange-500 transition"
                />
                {invSearchQuery && (
                  <button
                    onClick={() => setInvSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative flex items-center bg-zinc-950 border border-zinc-700/80 rounded-2xl px-3 py-2 text-xs text-white">
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent text-white outline-none cursor-pointer pr-2 text-xs font-semibold"
                  >
                    <option value="stock-asc" className="bg-zinc-900 text-white">Stok: Tersedikit dulu</option>
                    <option value="stock-desc" className="bg-zinc-900 text-white">Stok: Terbanyak dulu</option>
                    <option value="name" className="bg-zinc-900 text-white">Nama: A - Z</option>
                    <option value="price-desc" className="bg-zinc-900 text-white">Harga: Tertinggi</option>
                    <option value="price-asc" className="bg-zinc-900 text-white">Harga: Terendah</option>
                    <option value="margin-desc" className="bg-zinc-900 text-white">Margin Laba Tertinggi</option>
                  </select>
                </div>

                <div className="flex items-center bg-zinc-950 border border-zinc-700/80 rounded-2xl p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-xl transition ${
                      viewMode === 'table' ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Tampilan Tabel Rinci"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-xl transition ${
                      viewMode === 'grid' ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Tampilan Kartu Grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                <span className="text-[11px] font-bold text-zinc-500 mr-1 flex items-center gap-1 shrink-0">
                  <Tag className="w-3 h-3" /> Kategori:
                </span>
                <button
                  onClick={() => setSelectedCat('all')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                    selectedCat === 'all'
                      ? 'bg-zinc-200 text-black shadow-sm font-black'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Semua ({products.length})
                </button>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.cat === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                        selectedCat === cat
                          ? 'bg-orange-500 text-white shadow-sm font-black'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                <span className="text-[11px] font-bold text-zinc-500 mr-1 flex items-center gap-1 shrink-0">
                  <Filter className="w-3 h-3" /> Status Stok:
                </span>
                <button
                  onClick={() => setStockStatusFilter('all')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl transition shrink-0 ${
                    stockStatusFilter === 'all'
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStockStatusFilter('safe')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl transition shrink-0 ${
                    stockStatusFilter === 'safe'
                      ? 'bg-emerald-500 text-white'
                      : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
                  }`}
                >
                  Aman (&ge; 5)
                </button>
                <button
                  onClick={() => setStockStatusFilter('low')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl transition shrink-0 ${
                    stockStatusFilter === 'low'
                      ? 'bg-amber-500 text-black'
                      : 'text-amber-400/80 hover:text-amber-300 bg-zinc-950 border border-zinc-800'
                  }`}
                >
                  Kritis (1-4)
                </button>
                <button
                  onClick={() => setStockStatusFilter('empty')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl transition shrink-0 ${
                    stockStatusFilter === 'empty'
                      ? 'bg-rose-500 text-white'
                      : 'text-rose-400/80 hover:text-rose-300 bg-zinc-950 border border-zinc-800'
                  }`}
                >
                  Habis (0)
                </button>
              </div>
            </div>
          </div>

          {/* Table or Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Search className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Tidak ada produk ditemukan</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  Kriteria pencarian atau filter yang Anda pilih tidak cocok dengan produk manapun di inventaris.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setInvSearchQuery('');
                    setSelectedCat('all');
                    setStockStatusFilter('all');
                  }}
                  className="text-xs font-bold px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  Reset Filter
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="text-xs font-bold px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tambah Produk Baru
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                      <th className="py-3.5 px-4">Produk</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4 text-right">Harga Modal (HPP)</th>
                      <th className="py-3.5 px-4 text-right">Harga Jual</th>
                      <th className="py-3.5 px-4 text-right">Margin / Unit</th>
                      <th className="py-3.5 px-4 text-center">Sisa Stok</th>
                      <th className="py-3.5 px-4 text-right">Nilai Aset</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-xs">
                    {filteredProducts.map((p) => {
                      const isZero = p.stock <= 0;
                      const isLow = p.stock > 0 && p.stock < 5;
                      const marginRp = p.price - p.cost;
                      const marginPct = p.price > 0 ? (marginRp / p.price) * 100 : 0;
                      const totalAssetVal = p.stock * p.cost;

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-zinc-800/40 transition group ${
                            isZero ? 'bg-rose-950/10' : isLow ? 'bg-amber-950/5' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.img || PRESET_PRODUCT_IMAGES[0].url}
                                alt={p.name}
                                className="w-10 h-10 rounded-xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-zinc-500 font-bold">{p.id}</span>
                                </div>
                                <p className="font-bold text-white text-xs sm:text-sm line-clamp-1">{p.name}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-950 border border-zinc-800 text-zinc-300">
                              {p.cat}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-medium text-zinc-400">
                            {formatRp(p.cost)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-white">
                            {formatRp(p.price)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-emerald-400">
                              +{formatRp(marginRp)}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-semibold">
                              ({marginPct.toFixed(0)}%)
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                                  isZero
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                    : isLow
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                }`}
                              >
                                {p.stock} Unit
                              </span>
                              <span className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                                {isZero ? 'Habis (0)' : isLow ? 'Stok Rendah' : 'Tersedia'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-semibold text-zinc-300">
                            {formatRp(totalAssetVal)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setRestockModal({
                                    isOpen: true,
                                    product: p,
                                    qty: '',
                                    type: 'add',
                                    note: 'Restock Pembelian Baru'
                                  })
                                }
                                className="p-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition"
                                title="Restock / Tambah Stok"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                                title="Edit Data Produk"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmModal({ isOpen: true, product: p })}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const isZero = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock < 5;
                const marginRp = p.price - p.cost;
                const marginPct = p.price > 0 ? (marginRp / p.price) * 100 : 0;

                return (
                  <div
                    key={p.id}
                    className={`bg-zinc-900/90 border rounded-3xl p-4 flex flex-col justify-between transition shadow-md relative overflow-hidden group ${
                      isZero
                        ? 'border-rose-500/40 bg-rose-950/10'
                        : isLow
                        ? 'border-amber-500/40 bg-amber-950/10 hover:border-amber-400'
                        : 'border-zinc-800 hover:border-orange-500/50 hover:shadow-xl'
                    }`}
                  >
                    {isZero && (
                      <span className="absolute top-3 right-3 bg-rose-500/30 text-rose-300 border border-rose-500/50 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider z-10 animate-pulse">
                        Habis (0)
                      </span>
                    )}
                    {isLow && (
                      <span className="absolute top-3 right-3 bg-amber-500/25 text-amber-300 border border-amber-500/50 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                        <AlertTriangle className="w-2.5 h-2.5" /> Sisa {p.stock}
                      </span>
                    )}

                    <div>
                      <div className="w-full h-36 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 mb-3 relative">
                        <img
                          src={p.img || PRESET_PRODUCT_IMAGES[0].url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute bottom-2 left-2">
                          <span className="text-[10px] font-bold text-zinc-300 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10">
                            {p.cat}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-[10px] text-zinc-500 font-mono">
                        <span>{p.id}</span>
                        <span className="text-emerald-400 font-bold">Margin +{marginPct.toFixed(0)}%</span>
                      </div>

                      <h3 className="font-black text-sm text-white line-clamp-2 mt-1 leading-snug">
                        {p.name}
                      </h3>

                      <div className="mt-3 p-2.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                          <span>Harga Modal (HPP):</span>
                          <span className="font-semibold text-zinc-300">{formatRp(p.cost)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-zinc-300">Harga Jual:</span>
                          <span className="text-orange-400 text-sm">{formatRp(p.price)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] pt-1 border-t border-zinc-800 text-emerald-400">
                          <span>Laba per pcs:</span>
                          <span className="font-black">+{formatRp(marginRp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Sisa Stok:</span>
                        <span
                          className={`text-xs font-black ${
                            isZero ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-white'
                          }`}
                        >
                          {p.stock} Unit
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setRestockModal({
                              isOpen: true,
                              product: p,
                              qty: '',
                              type: 'add',
                              note: 'Restock Pembelian Baru'
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center gap-1"
                          title="Tambah Stok"
                        >
                          <Plus className="w-3.5 h-3.5" /> Restock
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition"
                          title="Edit Produk"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmModal({ isOpen: true, product: p })}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: LAPORAN PENJUALAN PRODUK (SALES REPORT & DATE FILTER)           */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales-report' && (
        <div className="space-y-6">
          {/* Date Filter & Options Bar */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Filter Periode Tanggal Penjualan
                </span>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tentukan rentang tanggal transaksi kasir POS produk yang ingin dianalisis.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleDatePresetChange('today')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    datePreset === 'today'
                      ? 'bg-emerald-500 text-white shadow-sm font-black'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Hari Ini ({formatDateIndo(APP_TODAY)})
                </button>

                <button
                  onClick={() => handleDatePresetChange('7days')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    datePreset === '7days'
                      ? 'bg-emerald-500 text-white shadow-sm font-black'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  7 Hari Terakhir
                </button>

                <button
                  onClick={() => handleDatePresetChange('thisMonth')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    datePreset === 'thisMonth'
                      ? 'bg-emerald-500 text-white shadow-sm font-black'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Bulan Ini (Sep 2026)
                </button>

                <button
                  onClick={() => handleDatePresetChange('all')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    datePreset === 'all'
                      ? 'bg-emerald-500 text-white shadow-sm font-black'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Semua Waktu
                </button>
              </div>
            </div>

            {/* Custom Date Range Picker & Search */}
            <div className="pt-3 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Dari Tanggal:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Sampai Tanggal:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Filter By Product */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Filter Spesifik Produk:
                </label>
                <select
                  value={salesProductFilter}
                  onChange={(e) => setSalesProductFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="all">Semua Produk ({products.length})</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.cat})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Status Pembayaran:
                </label>
                <select
                  value={salesStatusFilter}
                  onChange={(e: any) => setSalesStatusFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="all">Semua Status</option>
                  <option value="Paid">Hanya Lunas (Paid)</option>
                  <option value="BELUM LUNAS">Kasbon / Belum Lunas</option>
                </select>
              </div>
            </div>

            {/* Keyword Search in Sales */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={salesSearchQuery}
                onChange={(e) => setSalesSearchQuery(e.target.value)}
                placeholder="Cari transaksi berdasarkan No. TRX, nama pembeli, nama kasir, atau nama item..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 transition"
              />
              {salesSearchQuery && (
                <button
                  onClick={() => setSalesSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sales KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* KPI 1: Omzet Penjualan */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Total Omzet Penjualan</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {formatRp(filteredSalesData.summary.totalRevenue)}
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Dari <strong className="text-zinc-300">{filteredSalesData.summary.totalTrxCount}</strong> transaksi kasir POS
                </p>
              </div>
            </div>

            {/* KPI 2: Laba Kotor (Gross Profit) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Laba Bersih Produk</span>
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-orange-400">
                  {formatRp(filteredSalesData.summary.totalProfit)}
                </span>
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-zinc-400">
                  <span className="text-emerald-400 font-bold">
                    ~{filteredSalesData.summary.profitMarginPct.toFixed(1)}%
                  </span>
                  <span>margin laba bersih</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Unit Terjual */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Total Unit Terjual</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">
                    {filteredSalesData.summary.totalUnits}
                  </span>
                  <span className="text-xs text-zinc-400 font-semibold">Pcs / Unit</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Total HPP Modal: <strong className="text-zinc-300">{formatRp(filteredSalesData.summary.totalCost)}</strong>
                </p>
              </div>
            </div>

            {/* KPI 4: Rata-rata Belanja (AOV) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Rata-rata Keranjang (AOV)</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-purple-300">
                  {formatRp(filteredSalesData.summary.avgBasketSize)}
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Nilai rata-rata per transaksi belanja
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Ranking & Performa Penjualan per Produk */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Performa & Rangking Penjualan Produk</h3>
                  <p className="text-xs text-zinc-400">
                    Daftar produk dengan kuantitas terjual, omzet pendapatan, dan kontribusi profit pada periode terpilih.
                  </p>
                </div>
              </div>
            </div>

            {filteredSalesData.productRanking.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Belum ada data penjualan produk pada rentang tanggal ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-4">Nama Produk & Kategori</th>
                      <th className="py-3 px-4 text-center">Unit Terjual</th>
                      <th className="py-3 px-4 text-right">Total Omzet</th>
                      <th className="py-3 px-4 text-right">Total Modal HPP</th>
                      <th className="py-3 px-4 text-right">Laba Bersih</th>
                      <th className="py-3 px-4">Kontribusi Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-xs">
                    {filteredSalesData.productRanking.map((item, index) => {
                      const contributionPct =
                        filteredSalesData.summary.totalRevenue > 0
                          ? (item.revenue / filteredSalesData.summary.totalRevenue) * 100
                          : 0;

                      return (
                        <tr key={item.id + index} className="hover:bg-zinc-800/40 transition">
                          <td className="py-3 px-3 text-center font-bold text-zinc-500">
                            {index === 0 && item.unitSold > 0 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center justify-center font-black text-[11px]">
                                1
                              </span>
                            ) : (
                              index + 1
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.img || PRESET_PRODUCT_IMAGES[0].url}
                                alt={item.name}
                                className="w-9 h-9 rounded-xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-white text-xs sm:text-sm">{item.name}</p>
                                <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800/60 inline-block mt-0.5">
                                  {item.cat}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-black text-xs">
                              {item.unitSold} Pcs
                            </span>
                            <span className="block text-[10px] text-zinc-500 mt-0.5">
                              {item.trxCount}x transaksi
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-black text-white text-xs sm:text-sm">
                            {formatRp(item.revenue)}
                          </td>

                          <td className="py-3 px-4 text-right font-medium text-zinc-400">
                            {formatRp(item.cost)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="font-bold text-emerald-400">
                              +{formatRp(item.profit)}
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              ({item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(0) : 0}%)
                            </span>
                          </td>

                          <td className="py-3 px-4 min-w-[140px]">
                            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-1">
                              <span>{contributionPct.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(2, contributionPct))}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Log Rincian Transaksi Kasir POS */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Riwayat Transaksi Penjualan Produk (POS)</h3>
                  <p className="text-xs text-zinc-400">
                    Log setiap struk belanja produk, kasir bertugas, metode pembayaran, dan rincian item.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                Menampilkan {filteredSalesData.transactions.length} Transaksi
              </span>
            </div>

            {filteredSalesData.transactions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Tidak ada riwayat transaksi penjualan yang memenuhi kriteria filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                      <th className="py-3 px-4">Waktu & TRX</th>
                      <th className="py-3 px-4">Pelanggan / Kasir</th>
                      <th className="py-3 px-4">Item Terjual</th>
                      <th className="py-3 px-4 text-center">Metode Bayar</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Total Transaksi</th>
                      <th className="py-3 px-4 text-right">Laba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-xs">
                    {filteredSalesData.transactions.map((trx) => {
                      const isUnpaid = trx.status === 'BELUM LUNAS' || trx.status === 'DP 50%';

                      return (
                        <tr key={trx.id} className="hover:bg-zinc-800/40 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-white block text-xs">{trx.id}</span>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" /> {formatDateIndo(trx.date)}
                            </span>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {trx.time}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                              <UserIcon className="w-3 h-3 text-zinc-500" />
                              <span>{trx.customer}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 block mt-0.5">
                              Kasir: <strong className="text-zinc-400">{trx.cashier}</strong>
                            </span>
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {trx.parsedItems.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 inline-flex items-center gap-1"
                                >
                                  <strong className="text-orange-400">{item.qty}x</strong> {item.name}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-950 border border-zinc-800 text-zinc-300">
                              {trx.method}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                isUnpaid
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {trx.status === 'Paid' ? 'LUNAS' : trx.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-black text-white text-xs sm:text-sm">
                            {formatRp(trx.calculatedRevenue)}
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-emerald-400">
                            +{formatRp(trx.calculatedProfit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT PRODUCT                                              */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    {isEditMode ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {isEditMode ? 'Perbarui informasi dan harga barang dagangan' : 'Daftarkan barang dagangan baru ke katalog kasir'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">ID Produk</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="P08"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Kategori Produk</label>
                  <select
                    value={formData.cat}
                    onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500"
                  >
                    <option value="Mineral">Mineral (Air Mineral & Isotonik)</option>
                    <option value="Supplement">Supplement (Whey, BCAA, Creatine)</option>
                    <option value="Snack">Snack (Protein Bar, Cookies)</option>
                    <option value="Merchandise">Merchandise (Shaker, Handuk)</option>
                    <option value="Apparel">Apparel (Kaos, Straps, Gloves)</option>
                    <option value="Lainnya">Kategori Lainnya (Custom)...</option>
                  </select>
                </div>
              </div>

              {formData.cat === 'Lainnya' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Nama Kategori Baru</label>
                  <input
                    type="text"
                    required
                    value={formData.customCat}
                    onChange={(e) => setFormData({ ...formData, customCat: e.target.value })}
                    placeholder="Misal: Minuman Dingin, Aksesoris, dll."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Nama Produk Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Isolate Whey Chocolate 1 Sachet"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Harga Beli / HPP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="15000"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Harga Jual Kasir (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="25000"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-orange-400 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Jumlah Stok Fisik</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="20"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="col-span-3 pt-2 mt-1 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">Proyeksi Laba Bersih per Item:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-black">
                      +{formatRp(Math.max(0, (Number(formData.price) || 0) - (Number(formData.cost) || 0)))}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      (
                      {Number(formData.price) > 0
                        ? (
                            (Math.max(0, (Number(formData.price) || 0) - (Number(formData.cost) || 0)) /
                              Number(formData.price)) *
                            100
                          ).toFixed(0)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">URL Foto Produk</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.img}
                    onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                  {formData.img && (
                    <img
                      src={formData.img}
                      alt="Preview"
                      className="w-9 h-9 rounded-xl object-cover bg-zinc-950 border border-zinc-700 shrink-0"
                    />
                  )}
                </div>

                <div className="mt-2">
                  <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                    Pilihan Cepat Foto Kebugaran & Suplemen (1-Klik):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PRODUCT_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, img: preset.url })}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition ${
                          formData.img === preset.url
                            ? 'bg-orange-500 text-white border-orange-400 font-bold'
                            : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white transition flex items-center gap-1.5 shadow-lg shadow-orange-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan Produk Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESTOCK / PENYESUAIAN STOK                                      */}
      {/* ========================================================================= */}
      {restockModal.isOpen && restockModal.product && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Restock / Penyesuaian Stok</h3>
                  <p className="text-[11px] text-zinc-400">Update persediaan stok barang gudang</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockModal({ isOpen: false, product: null, qty: '', type: 'add', note: '' })}
                className="text-zinc-500 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
              <img
                src={restockModal.product.img || PRESET_PRODUCT_IMAGES[0].url}
                alt={restockModal.product.name}
                className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-800 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md">
                    {restockModal.product.cat}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      restockModal.product.stock <= 0
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    Stok Saat Ini: {restockModal.product.stock} Unit
                  </span>
                </div>
                <p className="text-xs font-bold text-white mt-1 truncate">{restockModal.product.name}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Modal: <strong className="text-zinc-300">{formatRp(restockModal.product.cost)}</strong> | Jual:{' '}
                  <strong className="text-orange-400">{formatRp(restockModal.product.price)}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRestock} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRestockModal({ ...restockModal, type: 'add' })}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    restockModal.type === 'add'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  + Tambah Barang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setRestockModal({ ...restockModal, type: 'set' })}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    restockModal.type === 'set'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Setel Fisik Opname
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  {restockModal.type === 'add' ? 'Jumlah Unit Masuk (+):' : 'Jumlah Stok Fisik Sekarang:'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={restockModal.qty}
                  onChange={(e) => setRestockModal({ ...restockModal, qty: e.target.value })}
                  placeholder={restockModal.type === 'add' ? 'Contoh: 24' : 'Contoh: 50'}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white font-bold outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Stok akhir setelah update:{' '}
                  <span className="text-emerald-400 font-black">
                    {restockModal.type === 'add'
                      ? restockModal.product.stock + (Number(restockModal.qty) || 0)
                      : Number(restockModal.qty) || 0}{' '}
                    Unit
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Keterangan / Sumber Barang:</label>
                <input
                  type="text"
                  value={restockModal.note}
                  onChange={(e) => setRestockModal({ ...restockModal, note: e.target.value })}
                  placeholder="Misal: Pengiriman Supplier Distributor A, Opname Akhir Pekan, dll."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRestockModal({ isOpen: false, product: null, qty: '', type: 'add', note: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-blue-900/30"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Konfirmasi Simpan Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                                             */}
      {/* ========================================================================= */}
      {deleteConfirmModal.isOpen && deleteConfirmModal.product && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 text-center my-auto max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-base text-white">Hapus Produk Ini?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Apakah Anda yakin ingin menghapus <strong className="text-white">"{deleteConfirmModal.product.name}"</strong> ({deleteConfirmModal.product.id}) dari sistem? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-400 flex justify-between items-center">
              <span>Sisa Stok Fisik:</span>
              <span className="font-bold text-white">{deleteConfirmModal.product.stock} Unit</span>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, product: null })}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmModal.product) {
                    onDeleteProduct(deleteConfirmModal.product.id);
                  }
                  setDeleteConfirmModal({ isOpen: false, product: null });
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-950/30"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

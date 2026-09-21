import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Sparkles, Check, Crown, Dumbbell, ShoppingBag, ShieldCheck, DollarSign } from 'lucide-react';
import { BundlePackage, BundleItem, BundleType, BundleItemType, Product, PackageItem } from '../types';
import { formatRp, APP_TODAY } from '../utils/formatters';

interface BundlingManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundlePackages: BundlePackage[];
  products: Product[];
  packages?: PackageItem[];
  membershipPackages?: PackageItem[];
  ptPackages?: PackageItem[];
  onSaveBundle: (bundle: BundlePackage, isNew?: boolean) => void;
  onDeleteBundle?: (bundleId: string) => void;
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const BundlingManagerModal: React.FC<BundlingManagerModalProps> = ({
  isOpen,
  onClose,
  bundlePackages,
  products,
  packages = [],
  membershipPackages,
  ptPackages,
  onSaveBundle,
  onDeleteBundle,
  showToast
}) => {
  const finalMembershipPkgs = membershipPackages || packages.filter((p) => p.cat === 'Membership');
  const finalPtPkgs = ptPackages || packages.filter((p) => p.cat === 'PT');
  const [editingBundle, setEditingBundle] = useState<BundlePackage | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [bundleCode, setBundleCode] = useState('');
  const [bundleName, setBundleName] = useState('');
  const [description, setDescription] = useState('');
  const [bundleType, setBundleType] = useState<BundleType>('MEMBERSHIP_PLUS_PT');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [participantType, setParticipantType] = useState<'Personal' | 'Couple' | 'Trio'>('Personal');
  const [ptComponentValue, setPtComponentValue] = useState('150000');
  const [commissionRate, setCommissionRate] = useState('20');
  const [allowDpActivation, setAllowDpActivation] = useState(true);

  // Items in current bundle
  const [items, setItems] = useState<BundleItem[]>([
    {
      bundleItemId: 'ITEM-TEMP-1',
      bundleId: '',
      itemType: 'MEMBERSHIP',
      name: 'Membership Gym Reguler',
      quantity: 1,
      duration: 30,
      durationLabel: '1 Bulan',
      unitPrice: 350000,
      isActive: true
    },
    {
      bundleItemId: 'ITEM-TEMP-2',
      bundleId: '',
      itemType: 'PT',
      name: 'Personal Training Sesi',
      quantity: 1,
      sessionCount: 2,
      unitPrice: 150000,
      isActive: true
    }
  ]);

  if (!isOpen) return null;

  const startCreateNew = () => {
    setIsCreatingNew(true);
    setEditingBundle(null);
    setBundleCode('BND-' + Math.floor(100 + Math.random() * 900));
    setBundleName('');
    setDescription('');
    setBundleType('MEMBERSHIP_PLUS_PT');
    setPrice('500000');
    setStatus('ACTIVE');
    setParticipantType('Personal');
    setPtComponentValue('150000');
    setCommissionRate('20');
    setAllowDpActivation(true);
    setItems([
      {
        bundleItemId: 'ITEM-' + Date.now() + '-1',
        bundleId: '',
        itemType: 'MEMBERSHIP',
        name: 'Membership Gym 1 Bulan',
        quantity: 1,
        duration: 30,
        durationLabel: '1 Bulan',
        unitPrice: 350000,
        isActive: true
      },
      {
        bundleItemId: 'ITEM-' + Date.now() + '-2',
        bundleId: '',
        itemType: 'PT',
        name: 'Personal Training 2 Sesi',
        quantity: 1,
        sessionCount: 2,
        unitPrice: 150000,
        isActive: true
      }
    ]);
  };

  const startEdit = (pkg: BundlePackage) => {
    setIsCreatingNew(false);
    setEditingBundle(pkg);
    setBundleCode(pkg.bundleCode);
    setBundleName(pkg.bundleName);
    setDescription(pkg.description);
    setBundleType(pkg.bundleType);
    setPrice(String(pkg.price));
    setStatus(pkg.status);
    setParticipantType(pkg.participantType || 'Personal');
    setPtComponentValue(String(pkg.ptComponentValue || 0));
    setCommissionRate(String(pkg.commissionRate || 20));
    setAllowDpActivation(pkg.allowDpActivation !== false);
    setItems(pkg.items && pkg.items.length > 0 ? pkg.items : []);
  };

  const handleAddItem = (type: BundleItemType) => {
    const newItem: BundleItem = {
      bundleItemId: 'ITEM-' + Date.now(),
      bundleId: editingBundle?.bundleId || '',
      itemType: type,
      name:
        type === 'MEMBERSHIP'
          ? 'Membership 1 Bulan'
          : type === 'PT'
          ? 'PT 2 Sesi'
          : products[0]?.name || 'Air Mineral Prima 600ml',
      quantity: 1,
      duration: type === 'MEMBERSHIP' ? 30 : undefined,
      durationLabel: type === 'MEMBERSHIP' ? '1 Bulan' : undefined,
      sessionCount: type === 'PT' ? 2 : undefined,
      productId: type === 'PRODUCT' ? products[0]?.id : undefined,
      unitPrice: type === 'PRODUCT' ? products[0]?.price || 10000 : 150000,
      isActive: true
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemFieldChange = (index: number, field: keyof BundleItem, value: any) => {
    setItems(
      items.map((it, idx) => {
        if (idx !== index) return it;
        const updated = { ...it, [field]: value };
        if (field === 'duration') {
          const days = Number(value);
          updated.durationLabel = days >= 365 ? '1 Tahun' : days >= 180 ? '6 Bulan' : days >= 90 ? '3 Bulan' : `${Math.round(days / 30)} Bulan`;
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim() || !bundleCode.trim() || !price) {
      showToast?.('Form Tidak Lengkap', 'Nama paket, kode bundling, dan harga wajib diisi.', 'warning');
      return;
    }

    if (items.length === 0) {
      showToast?.('Komponen Kosong', 'Paket bundling harus memiliki minimal 1 komponen.', 'warning');
      return;
    }

    const maxParts = participantType === 'Personal' ? 1 : participantType === 'Couple' ? 2 : 3;
    const finalBundleId = editingBundle ? editingBundle.bundleId : 'BND-' + Date.now();

    const savedItems = items.map((it) => ({
      ...it,
      bundleId: finalBundleId
    }));

    const newBundle: BundlePackage = {
      bundleId: finalBundleId,
      bundleCode: bundleCode.trim().toUpperCase(),
      bundleName: bundleName.trim(),
      description: description.trim() || `Paket ${bundleName}`,
      bundleType,
      price: Number(price),
      status,
      createdDate: editingBundle ? editingBundle.createdDate : APP_TODAY,
      createdBy: editingBundle ? editingBundle.createdBy : 'Admin',
      participantType,
      maxParticipants: maxParts,
      ptComponentValue: Number(ptComponentValue) || 0,
      commissionRate: Number(commissionRate) || 0,
      items: savedItems,
      allowDpActivation
    };

    onSaveBundle(newBundle, !editingBundle);
    if (showToast) {
      showToast('Paket Disimpan', `Paket bundling ${newBundle.bundleName} berhasil ${editingBundle ? 'diperbarui' : 'dibuat'}.`, 'success');
    }
    setEditingBundle(null);
    setIsCreatingNew(false);
  };

  const commVal = (Number(ptComponentValue) * (Number(commissionRate) / 100)) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Master Modul Paket Bundling</h2>
              <p className="text-xs text-zinc-400">Konfigurasi struktur produk bundling (Membership + PT + FnB/Produk)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCreatingNew && !editingBundle && (
              <button
                type="button"
                onClick={startCreateNew}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Bundling Baru</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* If not creating/editing, show existing bundle package cards */}
          {!isCreatingNew && !editingBundle && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-300">Daftar Paket Bundling Aktif ({bundlePackages.length})</h3>
                <span className="text-xs text-zinc-500">Klik 'Edit' untuk menyesuaikan harga, komponen, atau nilai komisi</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundlePackages.map((pkg) => {
                  const estComm = Math.round((pkg.ptComponentValue || 0) * ((pkg.commissionRate || 20) / 100));
                  return (
                    <div
                      key={pkg.bundleId}
                      className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {pkg.bundleCode}
                            </span>
                            <h4 className="text-lg font-black text-white mt-1">{pkg.bundleName}</h4>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              pkg.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {pkg.status}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{pkg.description}</p>

                        <div className="bg-zinc-900/80 rounded-xl p-3 space-y-2 text-xs border border-zinc-800/80">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Komponen Paket:</div>
                          {pkg.items && pkg.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-zinc-300">
                              <span className="flex items-center gap-1.5">
                                {it.itemType === 'MEMBERSHIP' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                                {it.itemType === 'PT' && <Dumbbell className="w-3.5 h-3.5 text-purple-400" />}
                                {it.itemType === 'PRODUCT' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />}
                                <span className="font-medium text-xs">{it.name}</span>
                              </span>
                              <span className="font-mono font-bold text-zinc-400 text-xs">
                                {it.itemType === 'MEMBERSHIP' && (it.durationLabel || `${it.duration} Hari`)}
                                {it.itemType === 'PT' && `${it.sessionCount} Sesi`}
                                {it.itemType === 'PRODUCT' && `${it.quantity} Pcs`}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                          <div>
                            <div className="text-[10px] text-zinc-500">Harga Paket:</div>
                            <div className="text-base font-black text-amber-400">{formatRp(pkg.price)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-zinc-500">Komisi Trainer:</div>
                            <div className="font-bold text-purple-400 text-xs">
                              {formatRp(estComm)} <span className="text-[10px] text-zinc-500">({pkg.commissionRate}%)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => startEdit(pkg)}
                          className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit Paket</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Create or Edit */}
          {(isCreatingNew || editingBundle) && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold font-mono">
                    {editingBundle ? 'MODE EDIT' : 'MODE BIKIN BARU'}
                  </span>
                  <h3 className="text-base font-black text-white">
                    {editingBundle ? `Ubah Detail Paket: ${editingBundle.bundleName}` : 'Rancang Paket Bundling Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingBundle(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Batal
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Kode Bundling (SKU/Code):</label>
                  <input
                    type="text"
                    value={bundleCode}
                    onChange={(e) => setBundleCode(e.target.value)}
                    placeholder="Contoh: VIP-PLUS"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Nama Paket Bundling:</label>
                  <input
                    type="text"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    placeholder="Contoh: VIP PLUS"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Tipe Bundling (Bundle Type):</label>
                  <select
                    value={bundleType}
                    onChange={(e) => setBundleType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="MEMBERSHIP_PLUS_PT">MEMBERSHIP_PLUS_PT (Membership + PT)</option>
                    <option value="MEMBERSHIP_PLUS_PRODUCT">MEMBERSHIP_PLUS_PRODUCT (Membership + Produk)</option>
                    <option value="MEMBERSHIP_ONLY">MEMBERSHIP_ONLY (Hanya Membership)</option>
                    <option value="PT_ONLY">PT_ONLY (Hanya Personal Trainer)</option>
                    <option value="CUSTOM_BUNDLE">CUSTOM_BUNDLE (Kombinasi Bebas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Harga Jual Paket (Rp):</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Contoh: 500000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-extrabold text-sm focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Kategori Peserta:</label>
                  <select
                    value={participantType}
                    onChange={(e) => setParticipantType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Personal">Personal (Maksimal 1 Member)</option>
                    <option value="Couple">Couple (Maksimal 2 Member)</option>
                    <option value="Trio">Trio (Maksimal 3 Member)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">Status Paket:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="ACTIVE">ACTIVE (Tersedia untuk dijual)</option>
                    <option value="INACTIVE">INACTIVE (Nonaktif / Arsip)</option>
                  </select>
                </div>

                {/* PT Commission Configuration */}
                <div className="md:col-span-3 bg-purple-950/20 border border-purple-900/40 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      Konfigurasi Komisi Trainer (PT Component Value)
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      Komisi dihitung dari nilai komponen PT, bukan harga bundle utuh.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">Nilai Komponen PT (Rp):</label>
                      <input
                        type="number"
                        value={ptComponentValue}
                        onChange={(e) => setPtComponentValue(e.target.value)}
                        placeholder="Contoh: 150000"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">Persentase Komisi Trainer (%):</label>
                      <input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        placeholder="Contoh: 20"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>
                    <div className="bg-zinc-900/80 rounded-xl p-2.5 flex flex-col justify-center border border-zinc-800">
                      <span className="text-[10px] text-zinc-400">Estimasi Komisi Trainer:</span>
                      <span className="text-base font-black text-purple-400">{formatRp(commVal)}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-zinc-400 mb-1 font-semibold">Deskripsi Singkat Paket:</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Tuliskan keterangan fasilitas dan benefit yang didapat member..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-3 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="allowDpAct"
                    checked={allowDpActivation}
                    onChange={(e) => setAllowDpActivation(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 bg-zinc-950 border-zinc-700"
                  />
                  <label htmlFor="allowDpAct" className="text-xs text-zinc-300 font-medium cursor-pointer">
                    Aktivasi benefit langsung saat transaksi bayar DP (Cicilan). Jika tidak dicentang, benefit baru aktif setelah pembayaran lunas.
                  </label>
                </div>
              </div>

              {/* BUNDLE ITEMS BUILDER */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-white">Daftar Komponen Paket (Bundle Items)</h4>
                    <p className="text-xs text-zinc-400">Tentukan rincian membership, sesi PT, dan produk tambahan</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem('MEMBERSHIP')}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Membership
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('PT')}
                      className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Sesi PT
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('PRODUCT')}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Produk FnB
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            item.itemType === 'MEMBERSHIP'
                              ? 'bg-amber-500/20 text-amber-400'
                              : item.itemType === 'PT'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {item.itemType === 'MEMBERSHIP' && <Crown className="w-4 h-4" />}
                          {item.itemType === 'PT' && <Dumbbell className="w-4 h-4" />}
                          {item.itemType === 'PRODUCT' && <ShoppingBag className="w-4 h-4" />}
                        </span>
                        <div className="flex-1 md:w-48">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemFieldChange(idx, 'name', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-white font-bold"
                            placeholder="Nama Komponen"
                          />
                          <span className="text-[10px] text-zinc-500 uppercase">{item.itemType}</span>
                        </div>
                      </div>

                      {/* Detail inputs according to itemType */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {item.itemType === 'MEMBERSHIP' && (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Durasi:</span>
                            <select
                              value={item.duration || 30}
                              onChange={(e) => handleItemFieldChange(idx, 'duration', Number(e.target.value))}
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white font-semibold"
                            >
                              <option value={30}>1 Bulan (30 Hari)</option>
                              <option value={60}>2 Bulan (60 Hari)</option>
                              <option value={90}>3 Bulan (90 Hari)</option>
                              <option value={180}>6 Bulan (180 Hari)</option>
                              <option value={365}>1 Tahun (365 Hari)</option>
                            </select>
                          </div>
                        )}

                        {item.itemType === 'PT' && (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Jumlah Sesi:</span>
                            <input
                              type="number"
                              min={1}
                              value={item.sessionCount || 2}
                              onChange={(e) => handleItemFieldChange(idx, 'sessionCount', Number(e.target.value))}
                              className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white font-mono font-bold"
                            />
                            <span className="text-zinc-400">Sesi</span>
                          </div>
                        )}

                        {item.itemType === 'PRODUCT' && (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Produk:</span>
                            <select
                              value={item.productId || products[0]?.id}
                              onChange={(e) => {
                                const p = products.find((x) => x.id === e.target.value);
                                if (p) {
                                  handleItemFieldChange(idx, 'productId', p.id);
                                  handleItemFieldChange(idx, 'name', p.name);
                                  handleItemFieldChange(idx, 'unitPrice', p.price);
                                }
                              }}
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white font-semibold max-w-[180px]"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatRp(p.price)})
                                </option>
                              ))}
                            </select>
                            <span className="text-zinc-400">Qty:</span>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity || 1}
                              onChange={(e) => handleItemFieldChange(idx, 'quantity', Number(e.target.value))}
                              className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white font-mono font-bold"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
                          title="Hapus Komponen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingBundle(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-lg transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBundle ? 'Simpan Perubahan Paket' : 'Terbitkan Paket Bundling'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

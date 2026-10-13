import React, { useState, useId } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Check,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { ExpenseCategory, ExpenseAccountingType, ExpenseCategoryGroup, User as UserType } from '../../types';

interface ExpenseCategoryManagerProps {
  categories: ExpenseCategory[];
  currentUser: UserType | null;
  onSaveCategory: (category: ExpenseCategory, isNew: boolean) => void;
  onToggleCategoryStatus: (categoryId: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ExpenseCategoryManager: React.FC<ExpenseCategoryManagerProps> = ({
  categories,
  currentUser,
  onSaveCategory,
  onToggleCategoryStatus,
  showToast
}) => {
  const categoryFormPrefixId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [group, setGroup] = useState<ExpenseCategoryGroup>('OPERASIONAL');
  const [accountingType, setAccountingType] = useState<ExpenseAccountingType>('BEBAN_OPERASIONAL');
  const [description, setDescription] = useState('');
  const [subcategoriesStr, setSubcategoriesStr] = useState('');
  const [defaultPaymentAccount, setDefaultPaymentAccount] = useState('Kas Laci (Petty Cash)');

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setGroup('OPERASIONAL');
    setAccountingType('BEBAN_OPERASIONAL');
    setDescription('');
    setSubcategoriesStr('');
    setDefaultPaymentAccount('Kas Laci (Petty Cash)');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setGroup(cat.group);
    setAccountingType(cat.accountingType);
    setDescription(cat.description || '');
    setSubcategoriesStr(cat.subcategories.join(', '));
    setDefaultPaymentAccount(cat.defaultPaymentAccount || 'Kas Laci (Petty Cash)');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validasi Gagal', 'Nama kategori wajib diisi.', 'error');
      return;
    }

    const subcats = subcategoriesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const targetCategory: ExpenseCategory = {
      id: editingCategory ? editingCategory.id : `CAT-${Date.now()}`,
      name: name.trim(),
      group,
      accountingType,
      description: description.trim(),
      subcategories: subcats.length > 0 ? subcats : ['Umum'],
      defaultPaymentAccount,
      isActive: editingCategory ? editingCategory.isActive : true,
      createdAt: editingCategory ? editingCategory.createdAt : new Date().toISOString().slice(0, 10)
    };

    onSaveCategory(targetCategory, !editingCategory);
    showToast(
      'Kategori Disimpan',
      `Kategori "${targetCategory.name}" berhasil ${editingCategory ? 'diperbarui' : 'ditambahkan'}.`,
      'success'
    );
    setIsModalOpen(false);
  };

  // Filter Categories
  const filteredCategories = categories.filter((c) => {
    if (selectedGroup !== 'ALL' && c.group !== selectedGroup) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchSub = c.subcategories.some((sub) => sub.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchSub) return false;
    }
    return true;
  });

  const getAccountingBadge = (type: ExpenseAccountingType) => {
    switch (type) {
      case 'BEBAN_OPERASIONAL':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'BEBAN_SDM':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'BEBAN_FASILITAS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'BEBAN_FINANSIAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'ASET_TETAP':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PERSEDIAAN':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'PEMBAYARAN_UTANG':
        return 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-4 text-white">
      {/* Top Header Card */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Master Kategori Pengeluaran</h3>
              <p className="text-xs text-zinc-400">
                Kelola kategori pengeluaran & pemetaan perlakuan akuntansi (Beban Laba Rugi vs Aset Neraca vs Utang)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kategori, subkategori, atau deskripsi..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedGroup === 'ALL' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
            }`}
          >
            Semua ({categories.length})
          </button>
          <button
            onClick={() => setSelectedGroup('OPERASIONAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedGroup === 'OPERASIONAL' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
            }`}
          >
            Biaya Operasional Rutin
          </button>
          <button
            onClick={() => setSelectedGroup('SDM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedGroup === 'SDM' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
            }`}
          >
            Biaya SDM & Gaji
          </button>
          <button
            onClick={() => setSelectedGroup('FASILITAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedGroup === 'FASILITAS' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
            }`}
          >
            Biaya Fasilitas & Pemeliharaan
          </button>
          <button
            onClick={() => setSelectedGroup('KEUANGAN_LAIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedGroup === 'KEUANGAN_LAIN' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
            }`}
          >
            Keuangan & Lain-Lain
          </button>
          <button
            onClick={() => setSelectedGroup('ASET_PERSEDIAAN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedGroup === 'ASET_PERSEDIAAN' ? 'bg-orange-500 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white'
            }`}
          >
            Aset & Persediaan
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between transition ${
              cat.isActive ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-800/40 opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-500 block uppercase tracking-wider">
                    {cat.group.replace(/_/g, ' ')}
                  </span>
                  <h4 className="font-bold text-white text-base mt-0.5">{cat.name}</h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                    title="Edit Kategori"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleCategoryStatus(cat.id)}
                    className={`p-1.5 rounded-lg transition ${
                      cat.isActive
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-zinc-500 hover:bg-zinc-800'
                    }`}
                    title={cat.isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
                  >
                    {cat.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Perlakuan Akuntansi Badge */}
              <div>
                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getAccountingBadge(cat.accountingType)}`}>
                  {cat.accountingType.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {cat.description || 'Tidak ada deskripsi rinci.'}
              </p>

              {/* Subcategories Tags */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                  Subkategori ({cat.subcategories.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {cat.subcategories.map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 bg-zinc-950 border border-zinc-800/80 rounded-md text-[11px] text-zinc-300"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Default Account Footer */}
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Akun Default:</span>
              <span className="font-semibold text-zinc-300">{cat.defaultPaymentAccount || 'Kas Laci'}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500">
          <p className="font-semibold text-sm">Tidak ada kategori yang sesuai pencarian.</p>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
              <h3 className="font-bold text-white text-base">
                {editingCategory ? 'Edit Kategori Pengeluaran' : 'Tambah Kategori Pengeluaran Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label htmlFor={`${categoryFormPrefixId}-cat-name`} className="block font-bold text-zinc-300 mb-1.5">
                  Nama Kategori <span className="text-rose-400">*</span>
                </label>
                <input
                  id={`${categoryFormPrefixId}-cat-name`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Perawatan AC & Ventilasi"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${categoryFormPrefixId}-cat-group`} className="block font-bold text-zinc-300 mb-1.5">
                    Grup Kategori <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id={`${categoryFormPrefixId}-cat-group`}
                    value={group}
                    onChange={(e) => setGroup(e.target.value as ExpenseCategoryGroup)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="OPERASIONAL">Biaya Operasional Rutin</option>
                    <option value="SDM">Biaya SDM & Gaji</option>
                    <option value="FASILITAS">Biaya Fasilitas & Pemeliharaan</option>
                    <option value="KEUANGAN_LAIN">Keuangan & Biaya Lainnya</option>
                    <option value="ASET_PERSEDIAAN">Aset Tetap & Persediaan</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={`${categoryFormPrefixId}-cat-accounting-type`} className="block font-bold text-zinc-300 mb-1.5">
                    Perlakuan Akuntansi <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id={`${categoryFormPrefixId}-cat-accounting-type`}
                    value={accountingType}
                    onChange={(e) => setAccountingType(e.target.value as ExpenseAccountingType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="BEBAN_OPERASIONAL">Beban Operasional (Memotong Laba)</option>
                    <option value="BEBAN_SDM">Beban SDM (Memotong Laba)</option>
                    <option value="BEBAN_FASILITAS">Beban Fasilitas (Memotong Laba)</option>
                    <option value="BEBAN_FINANSIAL">Beban Finansial (Memotong Laba)</option>
                    <option value="ASET_TETAP">Aset Tetap (Kapitalisasi Neraca)</option>
                    <option value="PERSEDIAAN">Persediaan (HPP saat laku)</option>
                    <option value="PEMBAYARAN_UTANG">Pembayaran Utang (Mengurangi Liabilitas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={`${categoryFormPrefixId}-cat-subcategories`} className="block font-bold text-zinc-300 mb-1.5">
                  Subkategori (Pisahkan dengan tanda koma)
                </label>
                <input
                  id={`${categoryFormPrefixId}-cat-subcategories`}
                  type="text"
                  value={subcategoriesStr}
                  onChange={(e) => setSubcategoriesStr(e.target.value)}
                  placeholder="Contoh: Cuci AC Rutin, Isi Freon, Servis Blower"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label htmlFor={`${categoryFormPrefixId}-cat-default-account`} className="block font-bold text-zinc-300 mb-1.5">
                  Akun Pembayaran Default
                </label>
                <select
                  id={`${categoryFormPrefixId}-cat-default-account`}
                  value={defaultPaymentAccount}
                  onChange={(e) => setDefaultPaymentAccount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Kas Laci (Petty Cash)">Kas Laci (Petty Cash)</option>
                  <option value="Bank Mandiri (Operasional)">Bank Mandiri (Operasional)</option>
                  <option value="Bank BCA / Artha Graha">Bank BCA / Artha Graha</option>
                  <option value="Bank Mandiri (Payroll)">Bank Mandiri (Payroll)</option>
                  <option value="Bank Mandiri (Investasi)">Bank Mandiri (Investasi)</option>
                </select>
              </div>

              <div>
                <label htmlFor={`${categoryFormPrefixId}-cat-description`} className="block font-bold text-zinc-300 mb-1.5">
                  Deskripsi / Keterangan Kategori
                </label>
                <textarea
                  id={`${categoryFormPrefixId}-cat-description`}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan transaksi yang masuk ke dalam kategori ini..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

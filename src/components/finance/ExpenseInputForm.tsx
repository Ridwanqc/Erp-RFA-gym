import React, { useState, useEffect, useId } from 'react';
import {
  FileText,
  Calendar,
  Building2,
  Tag,
  CreditCard,
  User,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  CompanyExpense,
  ExpenseCategory,
  GymBranch,
  User as UserType,
  ExpenseApprovalStatus,
  ExpensePaymentStatus,
  ExpensePaymentMethod,
  GymAsset
} from '../../types';
import { APP_TODAY, formatRp } from '../../utils/formatters';

interface ExpenseInputFormProps {
  categories: ExpenseCategory[];
  branches: GymBranch[];
  currentUser: UserType | null;
  activeBranchId: string;
  onSaveExpense: (expense: CompanyExpense, autoCapitalizeAsset?: boolean) => void;
  onCancel?: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ExpenseInputForm: React.FC<ExpenseInputFormProps> = ({
  categories,
  branches,
  currentUser,
  activeBranchId,
  onSaveExpense,
  onCancel,
  showToast
}) => {
  const formElementId = useId();
  // Form submission lock (mencegah double submit)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Nomor transaksi otomatis unik
  const [expenseNumber, setExpenseNumber] = useState('');
  useEffect(() => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    setExpenseNumber(`EXP-${yy}${mm}${dd}-${randomHex}`);
  }, []);

  // 2. Tanggal pengeluaran
  const [date, setDate] = useState<string>(APP_TODAY);

  // 3. Unit atau cabang
  const [branchId, setBranchId] = useState<string>(
    activeBranchId && activeBranchId !== 'ALL' && activeBranchId !== 'BR-ALL'
      ? activeBranchId
      : branches[0]?.id || 'BR-001'
  );

  // 4. Kategori & 5. Subkategori
  const activeCategories = categories.filter((c) => c.isActive);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    activeCategories[0]?.id || ''
  );
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || activeCategories[0];

  const subcategoryList = selectedCategory?.subcategories || [];
  const [subcategory, setSubcategory] = useState<string>(
    subcategoryList[0] || 'Umum'
  );

  // Update subkategori saat kategori berganti
  useEffect(() => {
    if (selectedCategory && selectedCategory.subcategories.length > 0) {
      setSubcategory(selectedCategory.subcategories[0]);
    }
  }, [selectedCategoryId]);

  // 6. Nama pengeluaran & 7. Deskripsi
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // 8. Nominal pengeluaran (Rp)
  const [amountInput, setAmountInput] = useState('');

  // 9. Metode pembayaran & 10. Sumber dana / rekening
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Kas');
  const [sourceAccount, setSourceAccount] = useState<string>('Kas Laci (Petty Cash)');

  // Auto set source account matching method
  const handlePaymentMethodChange = (method: ExpensePaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'Kas') {
      setSourceAccount('Kas Laci (Petty Cash)');
    } else if (method === 'Transfer Bank') {
      setSourceAccount(selectedCategory?.defaultPaymentAccount || 'Bank Mandiri (Operasional)');
    } else if (method === 'QRIS' || method === 'Kartu Debit/EDC') {
      setSourceAccount('Bank BCA / Artha Graha');
    }
  };

  // 11. Vendor / Penerima
  const [vendorOrBeneficiary, setVendorOrBeneficiary] = useState('');

  // 12. PIC / Pengaju
  const [picStaffId, setPicStaffId] = useState<string>(currentUser?.id || 'S01');
  const [picStaffName, setPicStaffName] = useState<string>(currentUser?.name || 'Administrator');

  // 13. Nomor invoice atau referensi bukti
  const [invoiceRefNumber, setInvoiceRefNumber] = useState('');

  // 14. Upload foto struk / nota
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [attachmentFileName, setAttachmentFileName] = useState<string>('');
  const [attachmentError, setAttachmentError] = useState<string>('');

  // 15. Status pembayaran awal
  const [initialPaymentStatus, setInitialPaymentStatus] = useState<ExpensePaymentStatus>('Belum Dibayar');

  // 16. Catatan tambahan
  const [notes, setNotes] = useState('');

  // Opsi kapitalisasi ke Inventaris jika kategori Aset Tetap
  const [autoCapitalizeAsset, setAutoCapitalizeAsset] = useState<boolean>(true);

  // Error validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle File Upload (Max 5MB, format image or pdf)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setAttachmentError('Format file tidak didukung. Harap unggah file foto (JPG, PNG, WEBP) atau PDF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setAttachmentError('Ukuran file melebihi batas 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentUrl(reader.result as string);
      setAttachmentFileName(file.name);
      showToast('Lampiran Terunggah', `File ${file.name} berhasil dimuat.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentUrl('');
    setAttachmentFileName('');
    setAttachmentError('');
  };

  // Validasi formulir
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Nama pengeluaran wajib diisi.';
    if (!date) errors.date = 'Tanggal pengeluaran wajib diisi.';
    if (!branchId) errors.branchId = 'Cabang / Unit wajib dipilih.';
    if (!selectedCategoryId) errors.categoryId = 'Kategori pengeluaran wajib dipilih.';
    if (!vendorOrBeneficiary.trim()) errors.vendorOrBeneficiary = 'Nama penerima atau vendor wajib diisi.';

    const numAmount = Number(amountInput);
    if (!numAmount || numAmount <= 0) {
      errors.amount = 'Nominal pengeluaran harus berupa angka lebih besar dari Rp 0.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Eksekusi Simpan dengan status yang dipilih
  const handleProcessSubmit = (
    approvalAction: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui Langsung'
  ) => {
    if (isSubmitting) return; // Cegah double submit

    if (!validateForm()) {
      showToast('Form Belum Lengkap', 'Mohon periksa kolom wajib yang bertanda bintang.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const numAmount = Number(amountInput);
      const targetBranch = branches.find((b) => b.id === branchId) || branches[0];

      let targetApprovalStatus: ExpenseApprovalStatus = 'Menunggu Persetujuan';
      let targetPaymentStatus: ExpensePaymentStatus = initialPaymentStatus;
      let paidAmt = 0;
      let approvedUser: string | undefined = undefined;
      let approvedAt: string | undefined = undefined;

      if (approvalAction === 'Draft') {
        targetApprovalStatus = 'Draft';
        targetPaymentStatus = 'Belum Dibayar';
      } else if (approvalAction === 'Menunggu Persetujuan') {
        targetApprovalStatus = 'Menunggu Persetujuan';
      } else if (approvalAction === 'Disetujui Langsung') {
        targetApprovalStatus = 'Disetujui';
        approvedUser = currentUser?.name || 'Administrator';
        approvedAt = new Date().toLocaleString('id-ID');
        if (targetPaymentStatus === 'Lunas') {
          paidAmt = numAmount;
        }
      }

      const balanceRemaining = Math.max(0, numAmount - paidAmt);

      const newExpense: CompanyExpense = {
        id: `EXP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        expenseNumber: expenseNumber || `EXP-${Date.now()}`,
        date,
        branchId: targetBranch?.id || 'BR-001',
        branchName: targetBranch?.name || 'Cabang Utama',
        categoryId: selectedCategory?.id || 'CAT-OPR-01',
        categoryName: selectedCategory?.name || 'Biaya Operasional',
        subcategory,
        name: name.trim(),
        description: description.trim(),
        amount: numAmount,
        accountingType: selectedCategory?.accountingType || 'BEBAN_OPERASIONAL',
        paymentMethod,
        sourceAccount,
        vendorOrBeneficiary: vendorOrBeneficiary.trim(),
        picStaffId,
        picStaffName,
        invoiceRefNumber: invoiceRefNumber.trim() || undefined,
        attachmentUrl: attachmentUrl || undefined,
        attachmentFileName: attachmentFileName || undefined,
        approvalStatus: targetApprovalStatus,
        paymentStatus: targetPaymentStatus,
        paidAmount: paidAmt,
        balanceRemaining,
        paidAt: paidAmt > 0 ? new Date().toLocaleString('id-ID') : undefined,
        paidByUserId: paidAmt > 0 ? currentUser?.id : undefined,
        paidByUserName: paidAmt > 0 ? currentUser?.name : undefined,
        paidAccount: paidAmt > 0 ? sourceAccount : undefined,
        approvedByUserId: approvedUser ? currentUser?.id : undefined,
        approvedByUserName: approvedUser,
        approvedAt,
        notes: notes.trim() || undefined,
        auditLogs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toLocaleString('id-ID'),
            userId: currentUser?.id || 'USR-01',
            userName: currentUser?.name || 'Staff',
            action:
              approvalAction === 'Draft'
                ? 'Dibuat (Draft)'
                : approvalAction === 'Disetujui Langsung'
                ? 'Dibuat & Disetujui Langsung'
                : 'Diajukan Persetujuan',
            notes: notes.trim() || 'Pengeluaran baru diinput ke sistem ERP'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSaveExpense(
        newExpense,
        selectedCategory?.accountingType === 'ASET_TETAP' && autoCapitalizeAsset
      );

      showToast(
        'Pengeluaran Disimpan',
        `Transaksi ${newExpense.expenseNumber} berhasil disimpan dengan status ${targetApprovalStatus}.`,
        'success'
      );

      // Reset form
      setName('');
      setDescription('');
      setAmountInput('');
      setVendorOrBeneficiary('');
      setInvoiceRefNumber('');
      setAttachmentUrl('');
      setAttachmentFileName('');
      setNotes('');

      // Generate new number for next entry
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const randomHex = Math.floor(1000 + Math.random() * 9000);
      setExpenseNumber(`EXP-${yy}${mm}${dd}-${randomHex}`);
    } catch (err: any) {
      showToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdminOrManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager' ||
    (currentUser as any)?.role === 'ADMIN' ||
    (currentUser as any)?.role === 'LEADER';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl text-white">
      {/* Header Banner */}
      <div className="px-6 py-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Input Biaya Operasional & Pengeluaran</h3>
            <p className="text-xs text-zinc-400">
              Pencatatan pengeluaran perusahaan dengan pemetaan akuntansi, approval workflow & bukti transaksi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Nomor Transaksi:</span>
          <span className="font-mono font-bold text-xs bg-zinc-800 text-orange-400 px-3 py-1.5 rounded-xl border border-zinc-700">
            {expenseNumber || 'EXP-AUTO'}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Section 1: Informasi Pokok */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>1. Tanggal, Cabang & Identitas Transaksi</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tanggal */}
            <div>
              <label htmlFor={`${formElementId}-expense-date`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Tanggal Pengeluaran <span className="text-rose-400">*</span>
              </label>
              <input
                id={`${formElementId}-expense-date`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full bg-zinc-950 border ${
                  validationErrors.date ? 'border-rose-500' : 'border-zinc-800'
                } rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono`}
                required
              />
              {validationErrors.date && (
                <p className="text-[11px] text-rose-400 mt-1">{validationErrors.date}</p>
              )}
            </div>

            {/* Cabang / Unit */}
            <div>
              <label htmlFor={`${formElementId}-expense-branch`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Unit / Cabang RFA Gym <span className="text-rose-400">*</span>
              </label>
              <select
                id={`${formElementId}-expense-branch`}
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className={`w-full bg-zinc-950 border ${
                  validationErrors.branchId ? 'border-rose-500' : 'border-zinc-800'
                } rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500`}
                required
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {validationErrors.branchId && (
                <p className="text-[11px] text-rose-400 mt-1">{validationErrors.branchId}</p>
              )}
            </div>

            {/* PIC / Pengaju */}
            <div>
              <label htmlFor={`${formElementId}-expense-pic`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                PIC / Pengaju Transaksi <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id={`${formElementId}-expense-pic`}
                  type="text"
                  value={picStaffName}
                  onChange={(e) => setPicStaffName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  placeholder="Nama staf pengaju..."
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Kategori & Perlakuan Akuntansi */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Tag className="w-4 h-4 text-orange-400" />
            <span>2. Kategori Pengeluaran & Perlakuan Akuntansi</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kategori Master */}
            <div>
              <label htmlFor={`${formElementId}-expense-category`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Kategori Pengeluaran <span className="text-rose-400">*</span>
              </label>
              <select
                id={`${formElementId}-expense-category`}
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className={`w-full bg-zinc-950 border ${
                  validationErrors.categoryId ? 'border-rose-500' : 'border-zinc-800'
                } rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500`}
                required
              >
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.group}] {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subkategori */}
            <div>
              <label htmlFor={`${formElementId}-expense-subcategory`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Subkategori Pengeluaran <span className="text-rose-400">*</span>
              </label>
              <select
                id={`${formElementId}-expense-subcategory`}
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                required
              >
                {subcategoryList.map((sub, idx) => (
                  <option key={idx} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Banner Perlakuan Akuntansi Otomatis */}
          {selectedCategory && (
            <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-zinc-200">
                    Perlakuan Akuntansi ERP:{' '}
                    <span className="text-orange-400 uppercase font-mono">
                      {selectedCategory.accountingType.replace(/_/g, ' ')}
                    </span>
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {selectedCategory.description}
                  </p>
                </div>
              </div>

              {/* Special notice for Aset Tetap */}
              {selectedCategory.accountingType === 'ASET_TETAP' && (
                <div className="shrink-0 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                  <input
                    type="checkbox"
                    id="auto-cap"
                    checked={autoCapitalizeAsset}
                    onChange={(e) => setAutoCapitalizeAsset(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-orange-500 focus:ring-0"
                  />
                  <label htmlFor="auto-cap" className="text-[11px] text-blue-300 font-medium cursor-pointer">
                    Kapitalisasi ke Daftar Inventaris Gym
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Detail Pengeluaran & Nominal */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
            <CreditCard className="w-4 h-4 text-orange-400" />
            <span>3. Detail Nominal, Uraian & Penerima</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Pengeluaran */}
            <div>
              <label htmlFor={`${formElementId}-expense-name`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Nama / Judul Pengeluaran <span className="text-rose-400">*</span>
              </label>
              <input
                id={`${formElementId}-expense-name`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-zinc-950 border ${
                  validationErrors.name ? 'border-rose-500' : 'border-zinc-800'
                } rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500`}
                placeholder="Contoh: Tagihan Listrik PLN Bulan Oktober Cabang Cibubur"
                required
              />
              {validationErrors.name && (
                <p className="text-[11px] text-rose-400 mt-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Nominal Pengeluaran (Rp) */}
            <div>
              <label htmlFor={`${formElementId}-expense-amount`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Nominal Pengeluaran (Rp) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                <input
                  id={`${formElementId}-expense-amount`}
                  type="number"
                  min="1"
                  step="1000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className={`w-full bg-zinc-950 border ${
                    validationErrors.amount ? 'border-rose-500' : 'border-zinc-800'
                  } rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono font-bold text-rose-400 focus:outline-none focus:border-orange-500`}
                  placeholder="0"
                  required
                />
              </div>
              {amountInput && Number(amountInput) > 0 && (
                <p className="text-[11px] text-emerald-400 font-medium mt-1">
                  Terbilang: {formatRp(Number(amountInput))}
                </p>
              )}
              {validationErrors.amount && (
                <p className="text-[11px] text-rose-400 mt-1">{validationErrors.amount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Penerima / Vendor */}
            <div>
              <label htmlFor={`${formElementId}-expense-vendor`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Nama Penerima atau Vendor <span className="text-rose-400">*</span>
              </label>
              <input
                id={`${formElementId}-expense-vendor`}
                type="text"
                value={vendorOrBeneficiary}
                onChange={(e) => setVendorOrBeneficiary(e.target.value)}
                className={`w-full bg-zinc-950 border ${
                  validationErrors.vendorOrBeneficiary ? 'border-rose-500' : 'border-zinc-800'
                } rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500`}
                placeholder="Contoh: PT PLN Rayon Cibubur / CV Prima Fit Teknisi"
                required
              />
              {validationErrors.vendorOrBeneficiary && (
                <p className="text-[11px] text-rose-400 mt-1">{validationErrors.vendorOrBeneficiary}</p>
              )}
            </div>

            {/* Nomor Invoice / Bukti */}
            <div>
              <label htmlFor={`${formElementId}-expense-invoice-ref`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Nomor Invoice / Referensi Bukti (Opsional)
              </label>
              <input
                id={`${formElementId}-expense-invoice-ref`}
                type="text"
                value={invoiceRefNumber}
                onChange={(e) => setInvoiceRefNumber(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                placeholder="Contoh: INV-2026/X/0019 atau No Nota Kasir"
              />
            </div>
          </div>

          {/* Deskripsi / Keterangan */}
          <div>
            <label htmlFor={`${formElementId}-expense-description`} className="block text-xs font-bold text-zinc-300 mb-1.5">
              Deskripsi / Keterangan Lengkap
            </label>
            <textarea
              id={`${formElementId}-expense-description`}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              placeholder="Rincian barang/jasa yang dibeli, nomor pelanggan, atau keterangan spesifik..."
            />
          </div>
        </div>

        {/* Section 4: Metode Bayar & Sumber Dana */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>4. Metode Bayar & Sumber Dana Pembayaran</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metode Bayar */}
            <div>
              <label htmlFor={`${formElementId}-expense-payment-method`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Metode Pembayaran <span className="text-rose-400">*</span>
              </label>
              <select
                id={`${formElementId}-expense-payment-method`}
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value as ExpensePaymentMethod)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Kas">Kas Tunai (Kas Laci Kasir)</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="Kartu Debit/EDC">Kartu Debit / Mesin EDC</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Sumber Dana / Rekening */}
            <div>
              <label htmlFor={`${formElementId}-expense-source-account`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Sumber Dana / Rekening Bank <span className="text-rose-400">*</span>
              </label>
              <select
                id={`${formElementId}-expense-source-account`}
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Kas Laci (Petty Cash)">Kas Laci Kasir (Petty Cash)</option>
                <option value="Bank Mandiri (Operasional)">Bank Mandiri (Operasional - No. 129009812)</option>
                <option value="Bank BCA / Artha Graha">Bank BCA / Artha Graha (Penerimaan POS)</option>
                <option value="Bank Mandiri (Payroll)">Bank Mandiri (Payroll Gaji & Bonus)</option>
                <option value="Bank Mandiri (Investasi)">Bank Mandiri (Investasi & Aset Tetap)</option>
              </select>
            </div>

            {/* Status Pembayaran Awal */}
            <div>
              <label htmlFor={`${formElementId}-expense-payment-status`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Status Pembayaran Saat Input
              </label>
              <select
                id={`${formElementId}-expense-payment-status`}
                value={initialPaymentStatus}
                onChange={(e) => setInitialPaymentStatus(e.target.value as ExpensePaymentStatus)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Belum Dibayar">Belum Dibayar (Akan dibayarkan nanti)</option>
                <option value="Lunas">Sudah Dibayar Lunas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Lampiran Bukti Struk & Catatan */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Upload className="w-4 h-4 text-orange-400" />
            <span>5. Lampiran Bukti Transaksi (Struk / Invoice / Nota) & Catatan</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Area */}
            <div>
              <label htmlFor={`${formElementId}-expense-file-upload`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Upload Foto Struk / Nota / Dokumen Pendukung (Max 5MB)
              </label>

              {!attachmentUrl ? (
                <div className="border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-xl p-4 text-center bg-zinc-950/60 transition group cursor-pointer relative">
                  <input
                    id={`${formElementId}-expense-file-upload`}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="p-2 rounded-xl bg-zinc-900 text-zinc-400 group-hover:text-orange-400 transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">
                      Klik atau seret file ke sini untuk mengunggah
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Format: JPG, PNG, WEBP, atau PDF (Maks. 5 MB)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-zinc-800 bg-zinc-950 p-3 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {attachmentUrl.startsWith('data:image') ? (
                      <img
                        src={attachmentUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg border border-zinc-800 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-orange-400">
                        <FileCheck className="w-6 h-6" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-zinc-200 block truncate">
                        {attachmentFileName || 'Dokumen_Lampiran.jpg'}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Berhasil Diunggah
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition"
                    title="Hapus file lampiran"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {attachmentError && (
                <p className="text-[11px] text-rose-400 mt-1">{attachmentError}</p>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label htmlFor={`${formElementId}-expense-notes`} className="block text-xs font-bold text-zinc-300 mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                id={`${formElementId}-expense-notes`}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                placeholder="Catatan persetujuan, instruksi transfer, atau kontak vendor..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Simpan Draft */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleProcessSubmit('Draft')}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition border border-zinc-700 flex items-center gap-1.5"
            >
              <span>Simpan Draft</span>
            </button>

            {/* Ajukan Persetujuan */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleProcessSubmit('Menunggu Persetujuan')}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center gap-1.5"
            >
              <span>Ajukan Persetujuan</span>
            </button>

            {/* Simpan Pengeluaran (Langsung Posting jika Admin / Manager) */}
            {isAdminOrManager && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProcessSubmit('Disetujui Langsung')}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-orange-500/25 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan & Setujui Langsung (Posting)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

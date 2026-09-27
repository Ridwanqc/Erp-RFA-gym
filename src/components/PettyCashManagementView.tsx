import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  Edit2,
  Trash2,
  Printer,
  Check,
  X,
  FileText,
  CreditCard,
  Building,
  Building2,
  UserCheck,
  ChevronRight,
  TrendingDown,
  Wallet,
  Receipt,
  HelpCircle
} from 'lucide-react';
import { PettyCash, PettyCashExpense, PettyCashStatus, User, ALL_BRANCHES_ID } from '../types';
import { formatRp, formatDateIndo, APP_TODAY } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';

interface PettyCashManagementViewProps {
  pettyCashList: PettyCash[];
  onUpdatePettyCashList: (newList: PettyCash[]) => void;
  currentUser: User | null;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const PettyCashManagementView: React.FC<PettyCashManagementViewProps> = ({
  pettyCashList,
  onUpdatePettyCashList,
  currentUser,
  showToast
}) => {
  const { branches, activeBranchId, activeBranch, isAllBranches } = useSettings();
  const defaultBranchId = activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.id || 'BR-001') : activeBranchId;

  // Navigation: null = List View, string = Detail View of a Petty Cash session ID
  const [selectedPettyCashId, setSelectedPettyCashId] = useState<string | null>(
    pettyCashList.length > 0 ? pettyCashList[0].id : null
  );

  // List View Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | PettyCashStatus>('ALL');
  const [branchFilter, setBranchFilter] = useState<'ALL' | string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Orders table search inside Detail View
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  // Modals for Petty Cash Session (Add / Edit)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PettyCash | null>(null);
  const [sessionBranchId, setSessionBranchId] = useState<string>(defaultBranchId);
  const [sessionFormDate, setSessionFormDate] = useState('');
  const [sessionFormInitialAmount, setSessionFormInitialAmount] = useState('');
  const [sessionFormPaymentMethod, setSessionFormPaymentMethod] = useState<'Transfer' | 'Tunai' | 'Bank'>('Transfer');
  const [sessionFormNotes, setSessionFormNotes] = useState('');
  const [sessionFormStatus, setSessionFormStatus] = useState<PettyCashStatus>('Menunggu Persetujuan');

  // Modals for Expense Item (Add / Edit)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PettyCashExpense | null>(null);
  const [expenseItemName, setExpenseItemName] = useState('');
  const [expenseUnitPrice, setExpenseUnitPrice] = useState('');
  const [expenseQuantity, setExpenseQuantity] = useState('1');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseFormError, setExpenseFormError] = useState('');

  // Modal for Viewing Expense Detail
  const [viewingExpense, setViewingExpense] = useState<PettyCashExpense | null>(null);

  // Modal for Delete Confirmation (Session or Expense)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'session' | 'expense';
    sessionId: string;
    expenseId?: string;
    title: string;
    description: string;
  } | null>(null);

  // Modal for Approval / Rejection
  const [approvalModal, setApprovalModal] = useState<{
    sessionId: string;
    action: 'approve' | 'reject';
    notes: string;
  } | null>(null);

  // Modal for Print Receipt / Summary
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = useState(false);

  // Get currently selected session
  const activeSession = useMemo(() => {
    if (!selectedPettyCashId) return null;
    return pettyCashList.find((p) => p.id === selectedPettyCashId) || null;
  }, [pettyCashList, selectedPettyCashId]);

  // Overall KPI statistics
  const kpiStats = useMemo(() => {
    const totalModal = pettyCashList.reduce((acc, p) => acc + (p.initial_amount || 0), 0);
    const totalPengeluaran = pettyCashList.reduce((acc, p) => acc + (p.total_expense || 0), 0);
    const totalSisaSaldo = pettyCashList.reduce((acc, p) => acc + (p.remaining_balance || 0), 0);

    const countDisetujui = pettyCashList.filter((p) => p.status === 'Disetujui').length;
    const countMenunggu = pettyCashList.filter((p) => p.status === 'Menunggu Persetujuan').length;
    const countSelesai = pettyCashList.filter((p) => p.status === 'Selesai').length;

    return {
      totalModal,
      totalPengeluaran,
      totalSisaSaldo,
      countDisetujui,
      countMenunggu,
      countSelesai
    };
  }, [pettyCashList]);

  // Filtered sessions for List View
  const filteredSessions = useMemo(() => {
    return pettyCashList.filter((session) => {
      if (statusFilter !== 'ALL' && session.status !== statusFilter) {
        return false;
      }
      if (branchFilter !== 'ALL') {
        const sBranch = session.branchId || 'BR-001';
        if (sBranch !== branchFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = session.id.toLowerCase().includes(q);
        const matchMethod = (session.payment_method || '').toLowerCase().includes(q);
        const matchCreator = (session.created_by || '').toLowerCase().includes(q);
        const matchNotes = (session.notes || session.desc || '').toLowerCase().includes(q);
        const matchExpenses = (session.expenses || []).some((e) =>
          e.item_name.toLowerCase().includes(q)
        );
        if (!matchId && !matchMethod && !matchCreator && !matchNotes && !matchExpenses) {
          return false;
        }
      }
      if (startDate && session.date < startDate) {
        return false;
      }
      if (endDate && session.date > endDate) {
        return false;
      }
      return true;
    });
  }, [pettyCashList, statusFilter, searchQuery, startDate, endDate]);

  // Filtered expenses for active Detail View
  const filteredExpenses = useMemo(() => {
    if (!activeSession) return [];
    const expenses = activeSession.expenses || [];
    if (!expenseSearchQuery.trim()) return expenses;
    const q = expenseSearchQuery.toLowerCase().trim();
    return expenses.filter(
      (e) =>
        e.item_name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
    );
  }, [activeSession, expenseSearchQuery]);

  // Status Badge Helper
  const renderStatusBadge = (status: PettyCashStatus | string) => {
    switch (status) {
      case 'Disetujui':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case 'Menunggu Persetujuan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Menunggu Persetujuan
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Check className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <FileText className="w-3.5 h-3.5" /> Draft
          </span>
        );
    }
  };

  // Helper to format now as "DD/MM/YYYY HH:mm:ss"
  const getCurrentFormattedDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
  };

  // Open Create Petty Cash Session Modal
  const handleOpenCreateSession = () => {
    setEditingSession(null);
    setSessionBranchId(activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.id || 'BR-001') : activeBranchId);
    setSessionFormDate(getCurrentFormattedDateTime());
    setSessionFormInitialAmount('');
    setSessionFormPaymentMethod('Transfer');
    setSessionFormNotes('');
    setSessionFormStatus('Menunggu Persetujuan');
    setIsSessionModalOpen(true);
  };

  // Open Edit Petty Cash Session Modal
  const handleOpenEditSession = (session: PettyCash) => {
    setEditingSession(session);
    setSessionBranchId(session.branchId || (branches[0]?.id || 'BR-001'));
    setSessionFormDate(session.date);
    setSessionFormInitialAmount(String(session.initial_amount));
    setSessionFormPaymentMethod((session.payment_method as any) || 'Transfer');
    setSessionFormNotes(session.notes || session.desc || '');
    setSessionFormStatus((session.status as PettyCashStatus) || 'Disetujui');
    setIsSessionModalOpen(true);
  };

  // Save Petty Cash Session (Add or Edit)
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    const initialAmt = Number(sessionFormInitialAmount);
    if (!initialAmt || initialAmt <= 0) {
      showToast('Validasi Gagal', 'Modal Petty Cash harus lebih besar dari Rp 0.', 'error');
      return;
    }

    const selectedBranchObj = branches.find((b) => b.id === sessionBranchId) || branches[0];
    const targetBranchId = sessionBranchId || (isAllBranches ? (branches[0]?.id || 'BR-001') : activeBranchId);
    const targetBranchName = selectedBranchObj?.name || (activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.name || 'GymPro Flagship Kelapa Gading') : activeBranch.name);

    if (editingSession) {
      // Validate that new initial_amount is not less than total_expense already spent
      if (initialAmt < (editingSession.total_expense || 0)) {
        showToast(
          'Modal Terlalu Rendah',
          `Modal baru (${formatRp(initialAmt)}) tidak boleh lebih kecil dari pengeluaran yang sudah terjadi (${formatRp(editingSession.total_expense || 0)}).`,
          'error'
        );
        return;
      }

      const updatedRemaining = initialAmt - (editingSession.total_expense || 0);
      const updatedList = pettyCashList.map((item) => {
        if (item.id === editingSession.id) {
          return {
            ...item,
            branchId: targetBranchId,
            branchName: targetBranchName,
            date: sessionFormDate,
            initial_amount: initialAmt,
            payment_method: sessionFormPaymentMethod,
            status: sessionFormStatus,
            notes: sessionFormNotes.trim(),
            remaining_balance: updatedRemaining,
            updated_at: new Date().toISOString()
          };
        }
        return item;
      });

      onUpdatePettyCashList(updatedList);
      showToast('Berhasil Diperbarui', `Informasi Petty Cash ${editingSession.id} telah diperbarui.`, 'success');
    } else {
      // Create new session
      const newId = `PC-${Date.now().toString().slice(-6)}`;
      const nowIso = new Date().toISOString();
      const newSession: PettyCash = {
        id: newId,
        branchId: targetBranchId,
        branchName: targetBranchName,
        date: sessionFormDate,
        initial_amount: initialAmt,
        payment_method: sessionFormPaymentMethod,
        status: sessionFormStatus,
        total_expense: 0,
        remaining_balance: initialAmt,
        created_by: currentUser?.name || 'Admin Kasir',
        approved_by: sessionFormStatus === 'Disetujui' ? currentUser?.name || 'Manager Gym' : undefined,
        approved_at: sessionFormStatus === 'Disetujui' ? getCurrentFormattedDateTime() : undefined,
        created_at: nowIso,
        updated_at: nowIso,
        notes: sessionFormNotes.trim() || 'Pengajuan modal kas kecil operasional',
        expenses: [],
        amount: 0,
        desc: sessionFormNotes.trim() || 'Modal Kas Kecil'
      };

      const updatedList = [newSession, ...pettyCashList];
      onUpdatePettyCashList(updatedList);
      setSelectedPettyCashId(newId);
      showToast('Petty Cash Dibuat', `Sesi Petty Cash baru dengan modal ${formatRp(initialAmt)} (${targetBranchName}) berhasil dibuat.`, 'success');
    }

    setIsSessionModalOpen(false);
  };

  // Open Add Expense Modal
  const handleOpenAddExpense = () => {
    if (!activeSession) return;
    if (activeSession.status === 'Selesai' || activeSession.status === 'Ditolak') {
      showToast('Aksi Tidak Diizinkan', `Tidak dapat menambah pengeluaran pada Petty Cash yang berstatus ${activeSession.status}.`, 'warning');
      return;
    }
    setEditingExpense(null);
    setExpenseItemName('');
    setExpenseUnitPrice('');
    setExpenseQuantity('1');
    setExpenseDescription('');
    setExpenseFormError('');
    setIsExpenseModalOpen(true);
  };

  // Open Edit Expense Modal
  const handleOpenEditExpense = (expense: PettyCashExpense) => {
    if (!activeSession) return;
    if (activeSession.status === 'Selesai' || activeSession.status === 'Ditolak') {
      showToast('Aksi Tidak Diizinkan', `Tidak dapat mengedit pengeluaran pada Petty Cash yang berstatus ${activeSession.status}.`, 'warning');
      return;
    }
    setEditingExpense(expense);
    setExpenseItemName(expense.item_name);
    setExpenseUnitPrice(String(expense.unit_price));
    setExpenseQuantity(String(expense.quantity));
    setExpenseDescription(expense.description || '');
    setExpenseFormError('');
    setIsExpenseModalOpen(true);
  };

  // Save Expense (Add or Edit) with CRITICAL VALIDATION against modal Petty Cash
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    if (!expenseItemName.trim()) {
      setExpenseFormError('Nama item pengeluaran wajib diisi.');
      return;
    }

    const price = Number(expenseUnitPrice);
    const qty = Number(expenseQuantity);

    if (!price || price <= 0) {
      setExpenseFormError('Harga satuan (Unit Price) harus lebih besar dari 0.');
      return;
    }

    if (!qty || qty <= 0) {
      setExpenseFormError('Jumlah kuantitas (Quantity) minimal 1.');
      return;
    }

    const newAmount = price * qty;
    const oldAmount = editingExpense ? editingExpense.amount : 0;
    const additionalAmountNeeded = newAmount - oldAmount;

    // VALIDASI: Total pengeluaran tidak boleh melebihi modal Petty Cash
    if (additionalAmountNeeded > activeSession.remaining_balance) {
      setExpenseFormError(
        `Total pengeluaran (${formatRp(newAmount)}) melebihi sisa saldo Petty Cash yang tersedia (${formatRp(activeSession.remaining_balance + oldAmount)}).`
      );
      return;
    }

    const nowFormatted = getCurrentFormattedDateTime();
    let updatedExpenses: PettyCashExpense[] = [];

    if (editingExpense) {
      updatedExpenses = (activeSession.expenses || []).map((exp) => {
        if (exp.id === editingExpense.id) {
          return {
            ...exp,
            item_name: expenseItemName.trim(),
            unit_price: price,
            quantity: qty,
            amount: newAmount,
            description: expenseDescription.trim(),
            updated_at: nowFormatted
          };
        }
        return exp;
      });
    } else {
      const newExpenseId = `EXP-${Date.now().toString().slice(-4)}`;
      const newExpItem: PettyCashExpense = {
        id: newExpenseId,
        petty_cash_id: activeSession.id,
        item_name: expenseItemName.trim(),
        unit_price: price,
        quantity: qty,
        amount: newAmount,
        description: expenseDescription.trim(),
        created_at: nowFormatted,
        updated_at: nowFormatted
      };
      updatedExpenses = [...(activeSession.expenses || []), newExpItem];
    }

    // Auto-calculate new total expense and remaining balance
    const newTotalExpense = updatedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const newRemainingBalance = activeSession.initial_amount - newTotalExpense;

    const updatedSession: PettyCash = {
      ...activeSession,
      expenses: updatedExpenses,
      total_expense: newTotalExpense,
      remaining_balance: newRemainingBalance,
      amount: newTotalExpense,
      updated_at: new Date().toISOString()
    };

    const updatedList = pettyCashList.map((s) => (s.id === activeSession.id ? updatedSession : s));
    onUpdatePettyCashList(updatedList);

    showToast(
      editingExpense ? 'Pengeluaran Diperbarui' : 'Pengeluaran Ditambahkan',
      `${expenseItemName.trim()} senilai ${formatRp(newAmount)} berhasil dibukukan.`,
      'success'
    );

    setIsExpenseModalOpen(false);
  };

  // Prompt Delete Expense
  const handlePromptDeleteExpense = (expense: PettyCashExpense) => {
    if (!activeSession) return;
    setDeleteConfirm({
      type: 'expense',
      sessionId: activeSession.id,
      expenseId: expense.id,
      title: 'Hapus Transaksi Pengeluaran',
      description: `Apakah Anda yakin ingin menghapus item "${expense.item_name}" (${formatRp(expense.amount)})? Sisa saldo Petty Cash akan otomatis bertambah kembali.`
    });
  };

  // Prompt Delete Session
  const handlePromptDeleteSession = (session: PettyCash) => {
    setDeleteConfirm({
      type: 'session',
      sessionId: session.id,
      title: 'Hapus Batch Petty Cash',
      description: `Apakah Anda yakin ingin menghapus Petty Cash #${session.id} senilai ${formatRp(session.initial_amount)}? Seluruh data riwayat pengeluaran di dalamnya akan dihapus.`
    });
  };

  // Execute Confirmed Delete
  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'expense' && deleteConfirm.expenseId) {
      const session = pettyCashList.find((s) => s.id === deleteConfirm.sessionId);
      if (!session) return;

      const updatedExpenses = (session.expenses || []).filter((e) => e.id !== deleteConfirm.expenseId);
      const newTotalExpense = updatedExpenses.reduce((sum, item) => sum + item.amount, 0);
      const newRemainingBalance = session.initial_amount - newTotalExpense;

      const updatedSession: PettyCash = {
        ...session,
        expenses: updatedExpenses,
        total_expense: newTotalExpense,
        remaining_balance: newRemainingBalance,
        amount: newTotalExpense,
        updated_at: new Date().toISOString()
      };

      const updatedList = pettyCashList.map((s) => (s.id === session.id ? updatedSession : s));
      onUpdatePettyCashList(updatedList);
      showToast('Pengeluaran Dihapus', 'Transaksi pengeluaran berhasil dihapus dan saldo telah dikembalikan.', 'info');
    } else if (deleteConfirm.type === 'session') {
      const updatedList = pettyCashList.filter((s) => s.id !== deleteConfirm.sessionId);
      onUpdatePettyCashList(updatedList);
      if (selectedPettyCashId === deleteConfirm.sessionId) {
        setSelectedPettyCashId(updatedList.length > 0 ? updatedList[0].id : null);
      }
      showToast('Petty Cash Dihapus', `Petty Cash #${deleteConfirm.sessionId} berhasil dihapus.`, 'info');
    }

    setDeleteConfirm(null);
  };

  // Execute Approval or Rejection
  const handleExecuteApproval = () => {
    if (!approvalModal) return;
    const session = pettyCashList.find((s) => s.id === approvalModal.sessionId);
    if (!session) return;

    const isApprove = approvalModal.action === 'approve';
    const nowFormatted = getCurrentFormattedDateTime();
    const updatedStatus: PettyCashStatus = isApprove ? 'Disetujui' : 'Ditolak';

    const updatedSession: PettyCash = {
      ...session,
      status: updatedStatus,
      approved_by: isApprove ? currentUser?.name || 'Manager Gym' : undefined,
      approved_at: isApprove ? nowFormatted : undefined,
      notes: approvalModal.notes.trim()
        ? `${session.notes ? session.notes + ' | ' : ''}Catatan ${isApprove ? 'Approval' : 'Penolakan'}: ${approvalModal.notes.trim()}`
        : session.notes,
      updated_at: new Date().toISOString()
    };

    const updatedList = pettyCashList.map((s) => (s.id === session.id ? updatedSession : s));
    onUpdatePettyCashList(updatedList);

    showToast(
      isApprove ? 'Petty Cash Disetujui' : 'Petty Cash Ditolak',
      `Status Petty Cash #${session.id} telah diubah menjadi ${updatedStatus}.`,
      isApprove ? 'success' : 'warning'
    );

    setApprovalModal(null);
  };

  // Mark session as Selesai
  const handleMarkAsCompleted = (session: PettyCash) => {
    const updatedSession: PettyCash = {
      ...session,
      status: 'Selesai',
      updated_at: new Date().toISOString()
    };
    const updatedList = pettyCashList.map((s) => (s.id === session.id ? updatedSession : s));
    onUpdatePettyCashList(updatedList);
    showToast('Petty Cash Selesai', `Petty Cash #${session.id} telah ditandai Selesai.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-3xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {selectedPettyCashId ? (
            <button
              onClick={() => setSelectedPettyCashId(null)}
              className="p-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
              title="Kembali ke Daftar Petty Cash"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Daftar Petty Cash</span>
            </button>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Wallet className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {selectedPettyCashId && activeSession ? (
                  <>Detail Petty Cash #{activeSession.id}</>
                ) : (
                  <>Petty Cash Management</>
                )}
              </h2>
              {selectedPettyCashId && activeSession && renderStatusBadge(activeSession.status)}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {selectedPettyCashId && activeSession
                ? 'Kelola pengeluaran harian, saldo kas kecil, dan verifikasi persetujuan'
                : 'Pencatatan kas kecil, manajemen modal awal, persetujuan belanja, dan rekonsiliasi'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedPettyCashId && activeSession && (
            <>
              <button
                type="button"
                onClick={() => setIsPrintReceiptOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700/60"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Nota</span>
              </button>

              {activeSession.status === 'Menunggu Persetujuan' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setApprovalModal({
                        sessionId: activeSession.id,
                        action: 'approve',
                        notes: ''
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Setujui</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setApprovalModal({
                        sessionId: activeSession.id,
                        action: 'reject',
                        notes: ''
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-rose-500/30"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>
                </>
              )}

              {activeSession.status === 'Disetujui' && (
                <button
                  type="button"
                  onClick={() => handleMarkAsCompleted(activeSession)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tandai Selesai</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenEditSession(activeSession)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition border border-zinc-700/60"
                title="Edit Informasi Petty Cash"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}

          {!selectedPettyCashId && (
            <button
              onClick={handleOpenCreateSession}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Petty Cash Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: DETAIL PETTY CASH PAGE (Requested by User)
         ========================================================================= */}
      {selectedPettyCashId && activeSession ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* TOP GRID: 1. Informasi Petty Cash & 3. Ringkasan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. INFORMASI PETTY CASH (Card) */}
            <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-orange-400">
                      1. Informasi Petty Cash
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">#{activeSession.id}</span>
                  </div>
                  {renderStatusBadge(activeSession.status)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5">
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" /> Tanggal Petty Cash
                    </span>
                    <p className="text-sm sm:text-base font-bold text-white mt-1 font-mono">
                      {activeSession.date}
                    </p>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Modal Petty Cash
                    </span>
                    <p className="text-xl font-black text-emerald-400 mt-0.5">
                      {formatRp(activeSession.initial_amount)}
                    </p>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> Unit / Cabang
                    </span>
                    <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5 truncate">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded-lg text-xs border border-amber-500/20 font-semibold truncate">
                        {activeSession.branchName || 'Cabang Utama'}
                      </span>
                    </p>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Metode Pembayaran
                    </span>
                    <p className="text-sm font-bold text-white mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs border border-blue-500/20">
                        {activeSession.payment_method}
                      </span>
                    </p>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-400" /> Dibuat Oleh
                    </span>
                    <p className="text-sm font-bold text-white mt-1">
                      {activeSession.created_by}
                    </p>
                  </div>
                </div>

                {/* Approver & Notes Row */}
                <div className="mt-4 pt-4 border-t border-zinc-800/60 flex flex-col sm:flex-row justify-between gap-3 text-xs text-zinc-400">
                  <div>
                    <span className="font-semibold text-zinc-300">Disetujui Oleh:</span>{' '}
                    {activeSession.approved_by ? (
                      <span className="text-emerald-400 font-medium">
                        {activeSession.approved_by} ({activeSession.approved_at || '-'})
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic">Belum disetujui</span>
                    )}
                  </div>
                  {activeSession.notes && (
                    <div className="max-w-md truncate">
                      <span className="font-semibold text-zinc-300">Catatan:</span>{' '}
                      <span className="text-zinc-400">{activeSession.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. RINGKASAN (Card) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-orange-400">
                    3. Ringkasan
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">Rumus: Modal - Pengeluaran</span>
                </div>

                <div className="space-y-4 mt-5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Modal Petty Cash:</span>
                    <span className="font-bold text-white">{formatRp(activeSession.initial_amount)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Total Pengeluaran:</span>
                    <span className="font-black text-rose-400 text-sm">
                      {formatRp(activeSession.total_expense)}
                    </span>
                  </div>

                  <div className="h-px bg-zinc-800/80 my-2" />

                  <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 block">
                      Saldo Akhir
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                      {formatRp(activeSession.remaining_balance)}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      {activeSession.remaining_balance > 0
                        ? `Tersedia sisa ${formatRp(activeSession.remaining_balance)} untuk operasional.`
                        : 'Seluruh modal kas kecil telah terpakai habis.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="mt-5 pt-4 border-t border-zinc-800/60">
                {(() => {
                  const usedPct =
                    activeSession.initial_amount > 0
                      ? Math.min(
                          100,
                          Math.round((activeSession.total_expense / activeSession.initial_amount) * 100)
                        )
                      : 0;
                  return (
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-zinc-400 mb-1.5">
                        <span>Realisasi Belanja</span>
                        <span className={usedPct > 90 ? 'text-amber-400' : 'text-emerald-400'}>
                          {usedPct}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            usedPct > 90
                              ? 'bg-amber-500'
                              : usedPct > 70
                              ? 'bg-orange-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 2. ORDERS / PENGELUARAN (Card & Table) */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            {/* Header & Controls Bar */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider font-extrabold text-orange-400">
                  2. Orders / Pengeluaran
                </span>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs px-2.5 py-0.5 rounded-full font-black">
                  Orders ({activeSession.expenses?.length || 0})
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Search Item Input */}
                <div className="relative min-w-[220px] max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={expenseSearchQuery}
                    onChange={(e) => setExpenseSearchQuery(e.target.value)}
                    placeholder="Search nama item..."
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-200 outline-none focus:border-orange-500 transition placeholder:text-zinc-500"
                  />
                  {expenseSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setExpenseSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Add Expense Button */}
                <button
                  onClick={handleOpenAddExpense}
                  disabled={activeSession.status === 'Selesai' || activeSession.status === 'Ditolak'}
                  className={`font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 ${
                    activeSession.status === 'Selesai' || activeSession.status === 'Ditolak'
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Receipt className="w-8 h-8 text-zinc-600" />
                          <p className="text-sm font-semibold text-zinc-400">
                            Belum ada transaksi pengeluaran pada sesi ini.
                          </p>
                          <p className="text-xs text-zinc-500">
                            Klik tombol "Add" di atas untuk menambahkan catatan pembelian baru.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{exp.item_name}</span>
                            {exp.description && (
                              <span
                                className="text-[10px] text-zinc-500 font-normal truncate max-w-xs"
                                title={exp.description}
                              >
                                ({exp.description})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-zinc-300">
                          {formatRp(exp.unit_price)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-zinc-200">
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-mono">
                            {exp.quantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-emerald-400 text-sm">
                          {formatRp(exp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => setViewingExpense(exp)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold border border-zinc-700/60"
                              title="Lihat Detail Transaksi"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>View</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditExpense(exp)}
                              disabled={
                                activeSession.status === 'Selesai' ||
                                activeSession.status === 'Ditolak'
                              }
                              className="p-1 rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-400 hover:text-orange-400 transition border border-zinc-700/60"
                              title="Edit Transaksi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handlePromptDeleteExpense(exp)}
                              disabled={
                                activeSession.status === 'Selesai' ||
                                activeSession.status === 'Ditolak'
                              }
                              className="p-1 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition border border-zinc-700/60"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Table Footer: Total Orders & Total Expense */}
                {filteredExpenses.length > 0 && (
                  <tfoot className="bg-zinc-950 border-t-2 border-zinc-800 text-xs font-bold text-zinc-300">
                    <tr>
                      <td colSpan={3} className="py-3.5 px-4 text-right">
                        Total Pengeluaran ({filteredExpenses.length} Orders):
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-400 text-sm">
                        {formatRp(activeSession.total_expense)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-400 font-normal text-[11px]">
                        Saldo: <span className="font-bold text-emerald-400">{formatRp(activeSession.remaining_balance)}</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           VIEW MODE 2: LIST VIEW (Daftar Seluruh Batch / Sesi Petty Cash)
           ========================================================================= */
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Total Modal Kas Kecil
              </span>
              <h3 className="text-2xl font-black text-emerald-400 mt-2">
                {formatRp(kpiStats.totalModal)}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Akumulasi modal kas kecil yang dialokasikan</p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" /> Total Realisasi Pengeluaran
              </span>
              <h3 className="text-2xl font-black text-rose-400 mt-2">
                {formatRp(kpiStats.totalPengeluaran)}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Total belanja operasional seluruh batch</p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Sisa Saldo Kas Kecil
              </span>
              <h3 className="text-2xl font-black text-blue-400 mt-2">
                {formatRp(kpiStats.totalSisaSaldo)}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Dana operasional siap pakai yang tersedia</p>
            </div>
          </div>

          {/* List Controls & Filters */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
              {/* Search & Status Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[240px] max-w-sm flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari ID, pembuat, item..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-8 pr-7 py-2 text-xs text-zinc-200 outline-none focus:border-orange-500 transition placeholder:text-zinc-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-700/80 text-xs font-semibold rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Ditolak">Ditolak</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                {/* Multi-Branch Filter */}
                {branches.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-400">Cabang:</span>
                    <select
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className="bg-zinc-950 border border-zinc-700/80 text-xs font-semibold rounded-xl px-3 py-2 text-amber-300 outline-none focus:border-orange-500 font-medium"
                    >
                      <option value="ALL">Semua Cabang ({branches.length})</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-2xl">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-bold text-zinc-400 hidden sm:inline">Tanggal:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-0 text-[11px] text-zinc-200 outline-none"
                  title="Dari Tanggal"
                />
                <span className="text-[10px] text-zinc-500 font-semibold">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-0 text-[11px] text-zinc-200 outline-none"
                  title="Sampai Tanggal"
                />
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="p-1 text-zinc-400 hover:text-rose-400 transition"
                    title="Reset Filter Tanggal"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sessions List Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <table className="w-full text-left whitespace-nowrap min-w-[900px]">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3.5 px-4">ID / Tanggal</th>
                    <th className="py-3.5 px-4">Cabang</th>
                    <th className="py-3.5 px-4">Metode</th>
                    <th className="py-3.5 px-4 text-right">Modal Awal</th>
                    <th className="py-3.5 px-4 text-right">Total Pengeluaran</th>
                    <th className="py-3.5 px-4 text-right">Saldo Akhir</th>
                    <th className="py-3.5 px-4 text-center">Orders</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Wallet className="w-8 h-8 text-zinc-600" />
                          <p className="text-sm font-semibold text-zinc-400">
                            Tidak ada data Petty Cash yang cocok dengan filter.
                          </p>
                          <p className="text-xs text-zinc-500">
                            Klik "Tambah Petty Cash Baru" untuk membuat pengajuan kas kecil baru.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{session.id}</span>
                          </div>
                          <span className="block font-sans font-normal text-[11px] text-zinc-500 mt-0.5">
                            {session.date}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300">
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-900 text-xs font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                            <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate max-w-[120px]">{session.branchName || 'Cabang Utama'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300">
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-700/60">
                            {session.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-emerald-400">
                          {formatRp(session.initial_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-rose-400">
                          {formatRp(session.total_expense)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-blue-400">
                          {formatRp(session.remaining_balance)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold font-mono">
                            {session.expenses?.length || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge(session.status)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPettyCashId(session.id)}
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Detail</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditSession(session)}
                              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition border border-zinc-700/60"
                              title="Edit Informasi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePromptDeleteSession(session)}
                              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition border border-zinc-700/60"
                              title="Hapus Petty Cash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: TAMBAH / EDIT PETTY CASH SESSION
         ========================================================================= */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">
                  {editingSession ? 'Edit Informasi Petty Cash' : 'Tambah Petty Cash Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSessionModalOpen(false)}
                className="text-zinc-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" /> Cabang / Unit Operasional *
                </label>
                <select
                  value={sessionBranchId}
                  onChange={(e) => setSessionBranchId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-semibold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  Tanggal Petty Cash (Format Indonesia)
                </label>
                <input
                  type="text"
                  value={sessionFormDate}
                  onChange={(e) => setSessionFormDate(e.target.value)}
                  placeholder="Contoh: 10/09/2026 19:16:31"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  Modal Petty Cash (Rupiah) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={sessionFormInitialAmount}
                    onChange={(e) => setSessionFormInitialAmount(e.target.value)}
                    placeholder="Contoh: 3600000"
                    required
                    min={1}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-bold outline-none focus:border-orange-500"
                  />
                </div>
                {sessionFormInitialAmount && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                    Terbaca: {formatRp(Number(sessionFormInitialAmount))}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                    Metode Pembayaran
                  </label>
                  <select
                    value={sessionFormPaymentMethod}
                    onChange={(e) => setSessionFormPaymentMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Transfer">Transfer</option>
                    <option value="Tunai">Tunai</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                    Status Awal
                  </label>
                  <select
                    value={sessionFormStatus}
                    onChange={(e) => setSessionFormStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Draft">Draft</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  Catatan / Keterangan Keperluan
                </label>
                <textarea
                  value={sessionFormNotes}
                  onChange={(e) => setSessionFormNotes(e.target.value)}
                  placeholder="Contoh: Pengadaan stok suplemen susu protein dan nutrisi gym"
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition shadow-sm"
                >
                  {editingSession ? 'Simpan Perubahan' : 'Buat Petty Cash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: TAMBAH / EDIT TRANSAKSI PENGELUARAN (ORDERS)
         ========================================================================= */}
      {isExpenseModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">
                  {editingExpense ? 'Edit Transaksi Pengeluaran' : 'Tambah Transaksi Pengeluaran'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-zinc-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
              {/* Balance Warning Banner */}
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 flex justify-between items-center text-xs">
                <span className="text-zinc-400">Sisa Saldo Kas Kecil Tersedia:</span>
                <span className="font-black text-emerald-400 text-sm">
                  {formatRp(
                    activeSession.remaining_balance +
                      (editingExpense ? editingExpense.amount : 0)
                  )}
                </span>
              </div>

              {expenseFormError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{expenseFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={expenseItemName}
                  onChange={(e) => {
                    setExpenseItemName(e.target.value);
                    setExpenseFormError('');
                  }}
                  placeholder="Contoh: Susu Protein"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                    Unit Price (Harga Satuan) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={expenseUnitPrice}
                      onChange={(e) => {
                        setExpenseUnitPrice(e.target.value);
                        setExpenseFormError('');
                      }}
                      placeholder="Contoh: 12000"
                      required
                      min={1}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                    Quantity (Jumlah) *
                  </label>
                  <input
                    type="number"
                    value={expenseQuantity}
                    onChange={(e) => {
                      setExpenseQuantity(e.target.value);
                      setExpenseFormError('');
                    }}
                    placeholder="Contoh: 100"
                    required
                    min={1}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Calculated Amount Box */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                    Calculated Amount
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {formatRp(Number(expenseUnitPrice) || 0)} × {Number(expenseQuantity) || 0}
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  {formatRp((Number(expenseUnitPrice) || 0) * (Number(expenseQuantity) || 0))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  Deskripsi / Keterangan Pembelian
                </label>
                <textarea
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Contoh: Batch 1 rasa cokelat 100 pcs untuk stok POS gym"
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition shadow-sm"
                >
                  {editingExpense ? 'Perbarui Pengeluaran' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: VIEW DETAIL TRANSAKSI PENGELUARAN (VIEW)
         ========================================================================= */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Detail Transaksi Pengeluaran</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="text-zinc-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
                <span className="text-[11px] text-zinc-500 block font-medium">Item Name</span>
                <p className="text-base font-bold text-white mt-1">{viewingExpense.item_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-3">
                  <span className="text-[10px] text-zinc-500 block font-medium">Unit Price</span>
                  <p className="text-sm font-bold text-zinc-200 mt-0.5 font-mono">
                    {formatRp(viewingExpense.unit_price)}
                  </p>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-3">
                  <span className="text-[10px] text-zinc-500 block font-medium">Quantity</span>
                  <p className="text-sm font-bold text-zinc-200 mt-0.5 font-mono">
                    {viewingExpense.quantity} unit
                  </p>
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
                <span className="font-bold text-zinc-400">Total Amount:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {formatRp(viewingExpense.amount)}
                </span>
              </div>

              {viewingExpense.description && (
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-3.5">
                  <span className="text-[10px] text-zinc-500 block font-medium">Deskripsi / Keterangan</span>
                  <p className="text-zinc-300 mt-1">{viewingExpense.description}</p>
                </div>
              )}

              <div className="pt-2 text-[11px] text-zinc-500 flex justify-between">
                <span>Dibuat: {viewingExpense.created_at}</span>
                <span>ID: {viewingExpense.id}</span>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DIALOG KONFIRMASI HAPUS (CONFIRMATION DIALOG)
         ========================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{deleteConfirm.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Konfirmasi penghapusan data</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-2xl leading-relaxed">
              {deleteConfirm.description}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: PERSETUJUAN / PENOLAKAN (APPROVAL MODAL)
         ========================================================================= */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  approvalModal.action === 'approve'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {approvalModal.action === 'approve' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {approvalModal.action === 'approve'
                    ? 'Persetujuan Petty Cash'
                    : 'Penolakan Pengajuan Petty Cash'}
                </h3>
                <p className="text-xs text-zinc-400">Petty Cash #{approvalModal.sessionId}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                Catatan Verifikator / Manager (Opsional)
              </label>
              <textarea
                value={approvalModal.notes}
                onChange={(e) =>
                  setApprovalModal({ ...approvalModal, notes: e.target.value })
                }
                placeholder={
                  approvalModal.action === 'approve'
                    ? 'Contoh: Disetujui untuk kebutuhan operasional gym'
                    : 'Contoh: Ditolak karena alokasi anggaran bulan ini telah mencukupi'
                }
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteApproval}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                  approvalModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {approvalModal.action === 'approve' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: CETAK STRUK / LAPORAN PETTY CASH
         ========================================================================= */}
      {isPrintReceiptOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <span className="text-xs font-bold text-zinc-400">Preview Cetak Laporan Petty Cash</span>
              <button
                onClick={() => setIsPrintReceiptOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-white text-zinc-900 space-y-4 font-mono text-xs">
              <div className="text-center border-b pb-3 border-zinc-300">
                <h4 className="text-base font-black tracking-tight">GYMPRO FITNESS & WELLNESS</h4>
                <p className="text-[11px] text-zinc-600">LAPORAN BUKU KAS KECIL (PETTY CASH)</p>
                <p className="text-[10px] text-zinc-500">ID: {activeSession.id} | Tanggal: {activeSession.date}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] border-b pb-3 border-zinc-300">
                <div>
                  <span className="text-zinc-500 block">Metode Pembayaran:</span>
                  <strong>{activeSession.payment_method}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Status:</span>
                  <strong>{activeSession.status}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Dibuat Oleh:</span>
                  <span>{activeSession.created_by}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Disetujui Oleh:</span>
                  <span>{activeSession.approved_by || '-'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold border-b pb-1 text-[11px]">
                  <span>Item (Qty x Harga)</span>
                  <span>Amount</span>
                </div>
                {(activeSession.expenses || []).map((e) => (
                  <div key={e.id} className="flex justify-between text-[11px] py-1 border-b border-zinc-100">
                    <div>
                      <div className="font-bold">{e.item_name}</div>
                      <div className="text-[10px] text-zinc-500">
                        {e.quantity} x {formatRp(e.unit_price)}
                      </div>
                    </div>
                    <div className="font-bold text-right">{formatRp(e.amount)}</div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t-2 border-zinc-800 pt-3 space-y-1 text-right">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Modal Petty Cash:</span>
                  <span className="font-bold">{formatRp(activeSession.initial_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Total Pengeluaran:</span>
                  <span className="font-bold text-rose-600">-{formatRp(activeSession.total_expense)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t pt-1">
                  <span>Sisa Saldo Akhir:</span>
                  <span className="text-emerald-700">{formatRp(activeSession.remaining_balance)}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-zinc-300 text-[10px] text-zinc-500">
                Dokumen resmi kas kecil gym, diverifikasi oleh sistem akuntansi.
              </div>
            </div>

            <div className="p-4 bg-zinc-950 flex justify-end gap-2">
              <button
                onClick={() => setIsPrintReceiptOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                  setIsPrintReceiptOpen(false);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

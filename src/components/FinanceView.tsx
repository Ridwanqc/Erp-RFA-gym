import React, { useState, useRef, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  BookOpen,
  DollarSign,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Plus,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  History,
  Coins,
  Ban,
  RefreshCw,
  Edit3,
  Search,
  X,
  AlertTriangle,
  PieChart,
  Landmark,
  Download,
  CheckSquare,
  Square,
  ListChecks,
  CheckCheck,
  UserCheck,
  BarChart3,
  Building2,
  FileText,
  FileDown,
  Loader2,
  ChevronDown,
  Calculator,
  ClipboardCheck,
  Wallet,
  Receipt,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  ExternalLink,
  Filter,
  CircleDollarSign,
  Tag
} from 'lucide-react';
import { Transaction, PettyCashItem, DailyClosingRecord, User, ALL_BRANCHES_ID, CompanyExpense, ExpenseCategory, ExpenseApprovalPolicy } from '../types';
import { formatRp, getTimestamp, APP_TODAY, getDayDiff, formatDateIndo } from '../utils/formatters';
import { ReceiptModal } from './ReceiptModal';
import { FinanceRevenueChart } from './FinanceRevenueChart';
import { PettyCashManagementView } from './PettyCashManagementView';
import { FinancialSummaryCard, FinancialSummaryData } from './FinancialSummaryCard';
import { MonthlySalesReportView } from './MonthlySalesReportView';
import { DailySalesReportView } from './DailySalesReportView';
import { TransactionActions } from './transaction/TransactionActions';
import { useSettings } from '../context/SettingsContext';
import { FinancialDashboardView } from './finance/FinancialDashboardView';
import { ProfitAndLossView } from './finance/ProfitAndLossView';
import { ExpenseInputForm } from './finance/ExpenseInputForm';
import { ExpenseHistoryTable } from './finance/ExpenseHistoryTable';
import { ExpenseCategoryManager } from './finance/ExpenseCategoryManager';
import { ExpenseApprovalView } from './finance/ExpenseApprovalView';
import { ExpenseReportView } from './finance/ExpenseReportView';

export type FinanceTab =
  | 'dashboard-keuangan'
  | 'laba-rugi'
  | 'input-pengeluaran'
  | 'riwayat-pengeluaran'
  | 'kategori-pengeluaran'
  | 'persetujuan-pengeluaran'
  | 'laporan-pengeluaran'
  | 'piutang'
  | 'bukubesar'
  | 'petty'
  | 'closing'
  | 'bulanan'
  | 'harian';

interface FinanceViewProps {
  transactions: Transaction[];
  pettyCashList: PettyCashItem[];
  closingRecords: DailyClosingRecord[];
  currentUser: User | null;
  isStoreClosed: boolean;
  initialSubTab?: FinanceTab;
  initialSelectedPiutangId?: string;
  companyExpenses?: CompanyExpense[];
  expenseCategories?: ExpenseCategory[];
  expensePolicy?: ExpenseApprovalPolicy;
  onSaveExpense?: (expense: CompanyExpense, autoCapitalizeAsset?: boolean) => void;
  onSaveExpensePayment?: (
    expenseId: string,
    paidAmount: number,
    paidAccount: string,
    paymentMethod: CompanyExpense['paymentMethod'],
    refNumber?: string,
    notes?: string
  ) => void;
  onApproveExpense?: (expense: CompanyExpense) => void;
  onRejectExpense?: (expense: CompanyExpense, reason: string) => void;
  onCancelExpense?: (expenseId: string, reason: string) => void;
  onSaveExpenseCategory?: (category: ExpenseCategory, isNew: boolean) => void;
  onToggleExpenseCategoryStatus?: (categoryId: string) => void;
  onUpdateExpensePolicy?: (newPolicy: ExpenseApprovalPolicy) => void;
  onPayInstallment: (payTrx: Transaction, originalTrxId: string, paidAmount: number) => void;
  onBatchPayInstallment?: (payments: { payTrx: Transaction; originalTrxId: string; paidAmount: number }[]) => void;
  onAddPettyCash: (pc: PettyCashItem) => void;
  onUpdatePettyCashList?: (list: PettyCashItem[]) => void;
  onExecuteDailyClosing: (closing: DailyClosingRecord) => void;
  onVoidTransaction?: (trxId: string, reason: string) => void;
  onReprintReceipt?: (trx: Transaction) => void;
  onUpdatePaymentMethod?: (
    trxId: string,
    newMethod: 'Tunai' | 'Transfer' | 'QRIS' | 'EDC' | 'Kasbon',
    newBankDest?: string,
    reason?: string
  ) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  pettyCashList,
  closingRecords,
  currentUser,
  isStoreClosed,
  initialSubTab = 'piutang',
  initialSelectedPiutangId,
  companyExpenses = [],
  expenseCategories = [],
  expensePolicy = { requireApprovalAbove: 500000, preventSelfApproval: true },
  onSaveExpense,
  onSaveExpensePayment,
  onApproveExpense,
  onRejectExpense,
  onCancelExpense,
  onSaveExpenseCategory,
  onToggleExpenseCategoryStatus,
  onUpdateExpensePolicy,
  onPayInstallment,
  onBatchPayInstallment,
  onAddPettyCash,
  onUpdatePettyCashList,
  onExecuteDailyClosing,
  onVoidTransaction,
  onReprintReceipt,
  onUpdatePaymentMethod,
  showToast
}) => {
  const { branches, activeBranchId, activeBranch, isAllBranches } = useSettings();
  const handleToast = (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') =>
    showToast(title, message, type || 'info');
  const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'keuangan';
  const userBranchId = currentUser?.branchId || activeBranchId;
  const [bukuBesarBranchFilter, setBukuBesarBranchFilter] = useState<string>(isSuperAdmin ? 'ALL' : userBranchId);
  const [activeTab, setActiveTab] = useState<FinanceTab>(initialSubTab);

  const handleUpdatePettyCash = (newList: PettyCashItem[]) => {
    if (onUpdatePettyCashList) {
      onUpdatePettyCashList(newList);
    } else {
      if (newList.length > pettyCashList.length) {
        onAddPettyCash(newList[0]);
      }
    }
  };

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Installment modal state
  const [selectedPiutang, setSelectedPiutang] = useState<Transaction | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Tunai' | 'Transfer' | 'QRIS' | 'EDC'>('Transfer');

  // Batch Pay & Multi-Select states for Cicilan / Piutang
  const [selectedPiutangIds, setSelectedPiutangIds] = useState<string[]>([]);
  const [isBatchPayModalOpen, setIsBatchPayModalOpen] = useState(false);
  const [batchPayTransactions, setBatchPayTransactions] = useState<Transaction[]>([]);
  const [batchPayAmounts, setBatchPayAmounts] = useState<Record<string, number>>({});
  const [batchPayMethod, setBatchPayMethod] = useState<'Tunai' | 'Transfer' | 'QRIS' | 'EDC'>('Transfer');
  const [batchPayBankDest, setBatchPayBankDest] = useState<'Mandiri' | 'Artha Graha'>('Mandiri');
  const [batchPayNotes, setBatchPayNotes] = useState('');

  React.useEffect(() => {
    if (initialSelectedPiutangId) {
      const found = transactions.find((t) => t.id === initialSelectedPiutangId);
      if (found) {
        setSelectedPiutang(found);
        setPayAmount(String(found.amountRemaining || 0));
        setActiveTab('piutang');
      }
    }
  }, [initialSelectedPiutangId, transactions]);

  // Daily closing states
  const [closingDate, setClosingDate] = useState<string>(APP_TODAY);
  const [openingDrawerCashInput, setOpeningDrawerCashInput] = useState<string>('500000'); // Input Modal Kas Laci Awal
  const [physicalCashInput, setPhysicalCashInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosingPrintOpen, setIsClosingPrintOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [closingAuditTab, setClosingAuditTab] = useState<'ALL' | 'Tunai' | 'Non-Tunai' | 'VOID'>('ALL');
  const closingPrintRef = useRef<HTMLDivElement>(null);

  // Sub-view toggle for closing tab: 'form' (Lembar Tutup Kasir) vs 'laporan' (Laporan Riwayat Closing)
  const [closingSubView, setClosingSubView] = useState<'form' | 'laporan'>('form');

  // Laporan Daily Closing filter states
  const [closingReportSearch, setClosingReportSearch] = useState('');
  const [closingReportBranchFilter, setClosingReportBranchFilter] = useState<string>(isSuperAdmin ? 'ALL' : userBranchId);
  const [closingReportCashierFilter, setClosingReportCashierFilter] = useState<string>('ALL');
  const [closingReportVarianceFilter, setClosingReportVarianceFilter] = useState<'ALL' | 'MATCH' | 'SURPLUS' | 'DEFICIT'>('ALL');
  const [closingReportDatePreset, setClosingReportDatePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | 'MONTH' | 'CUSTOM'>('ALL');
  const [closingReportStartDate, setClosingReportStartDate] = useState('');
  const [closingReportEndDate, setClosingReportEndDate] = useState('');
  const [selectedDetailClosing, setSelectedDetailClosing] = useState<DailyClosingRecord | null>(null);

  // Daily Closing Audit Transaction filters (sinkronisasi dengan Buku Besar)
  const [closingTrxSearch, setClosingTrxSearch] = useState('');
  const [closingTrxMethodFilter, setClosingTrxMethodFilter] = useState<string>('ALL');
  const [closingTrxCategoryFilter, setClosingTrxCategoryFilter] = useState<string>('ALL');
  const [closingTrxStatusFilter, setClosingTrxStatusFilter] = useState<string>('ALL');

  // Piutang filter states (Status, Name, Date)
  const [piutangStatusFilter, setPiutangStatusFilter] = useState<'all' | 'BELUM LUNAS' | 'LUNAS' | 'OVERDUE'>('all');
  const [piutangSearchName, setPiutangSearchName] = useState('');
  const [piutangStartDate, setPiutangStartDate] = useState('');
  const [piutangEndDate, setPiutangEndDate] = useState('');
  const [piutangDatePreset, setPiutangDatePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | 'MONTH' | 'CUSTOM'>('ALL');

  const handleSetPiutangDatePreset = (preset: 'ALL' | 'TODAY' | '7DAYS' | 'MONTH') => {
    setPiutangDatePreset(preset);
    if (preset === 'ALL') {
      setPiutangStartDate('');
      setPiutangEndDate('');
    } else if (preset === 'TODAY') {
      setPiutangStartDate(APP_TODAY);
      setPiutangEndDate(APP_TODAY);
    } else if (preset === '7DAYS') {
      const todayDate = new Date(APP_TODAY + 'T00:00:00');
      const start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 6);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      setPiutangStartDate(`${y}-${m}-${d}`);
      setPiutangEndDate(APP_TODAY);
    } else if (preset === 'MONTH') {
      const [year, month] = APP_TODAY.split('-');
      setPiutangStartDate(`${year}-${month}-01`);
      setPiutangEndDate(APP_TODAY);
    }
  };

  const handlePiutangStartDateChange = (val: string) => {
    setPiutangStartDate(val);
    setPiutangDatePreset('CUSTOM');
  };

  const handlePiutangEndDateChange = (val: string) => {
    setPiutangEndDate(val);
    setPiutangDatePreset('CUSTOM');
  };

  const handleResetPiutangFilters = () => {
    setPiutangStatusFilter('all');
    setPiutangSearchName('');
    setPiutangStartDate('');
    setPiutangEndDate('');
    setPiutangDatePreset('ALL');
  };

  // Buku Besar Search, Filter, & Action modal states
  const [bukubesarSearch, setBukubesarSearch] = useState('');
  const [bukubesarTypeFilter, setBukubesarTypeFilter] = useState<string>('ALL');
  const [bukubesarPaymentMethodFilter, setBukubesarPaymentMethodFilter] = useState<string>('ALL');
  const [bukubesarStatusFilter, setBukubesarStatusFilter] = useState<string>('ALL');
  const [bukubesarPicFilters, setBukubesarPicFilters] = useState<string[]>([]);
  const [isPicDropdownOpen, setIsPicDropdownOpen] = useState(false);
  const [picSearchQuery, setPicSearchQuery] = useState('');
  const picDropdownRef = useRef<HTMLDivElement>(null);
  const [bukubesarStartDate, setBukubesarStartDate] = useState('');
  const [bukubesarEndDate, setBukubesarEndDate] = useState('');
  const [bukubesarDatePreset, setBukubesarDatePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | 'MONTH' | 'CUSTOM'>('ALL');
  const [isBukuBesarPrintModalOpen, setIsBukuBesarPrintModalOpen] = useState(false);
  const [isExportingBukubesarPdf, setIsExportingBukubesarPdf] = useState(false);
  const bukubesarPrintRef = useRef<HTMLDivElement>(null);

  // Click outside listener for PIC multi-select dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (picDropdownRef.current && !picDropdownRef.current.contains(event.target as Node)) {
        setIsPicDropdownOpen(false);
      }
    };
    if (isPicDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPicDropdownOpen]);

  const togglePicFilter = (picName: string) => {
    setBukubesarPicFilters((prev) =>
      prev.includes(picName) ? prev.filter((p) => p !== picName) : [...prev, picName]
    );
  };

  const handleSelectAllPics = (allPicNames: string[]) => {
    setBukubesarPicFilters(allPicNames);
  };

  const handleClearPicFilters = () => {
    setBukubesarPicFilters([]);
  };

  // Extract unique PIC list from transactions
  const uniqueBukuBesarPics = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    transactions.forEach((trx) => {
      if (trx.picNames && trx.picNames.trim()) {
        const names = trx.picNames.split(',').map((s) => s.trim()).filter(Boolean);
        names.forEach((name) => {
          const key = name.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            map.set(key, { id: name, name, count: 1 });
          }
        });
      } else if (trx.picId && trx.picId.trim()) {
        const key = trx.picId.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { id: trx.picId, name: trx.picId, count: 1 });
        }
      }
      if (trx.cashier && trx.cashier.trim()) {
        const key = trx.cashier.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { id: trx.cashier, name: trx.cashier, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [transactions]);

  const handleSetBukubesarDatePreset = (preset: 'ALL' | 'TODAY' | '7DAYS' | 'MONTH') => {
    setBukubesarDatePreset(preset);
    if (preset === 'ALL') {
      setBukubesarStartDate('');
      setBukubesarEndDate('');
    } else if (preset === 'TODAY') {
      setBukubesarStartDate(APP_TODAY);
      setBukubesarEndDate(APP_TODAY);
    } else if (preset === '7DAYS') {
      const todayDate = new Date(APP_TODAY + 'T00:00:00');
      const start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 6);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      setBukubesarStartDate(`${y}-${m}-${d}`);
      setBukubesarEndDate(APP_TODAY);
    } else if (preset === 'MONTH') {
      const [year, month] = APP_TODAY.split('-');
      setBukubesarStartDate(`${year}-${month}-01`);
      setBukubesarEndDate(APP_TODAY);
    }
  };

  const handleStartDateChange = (val: string) => {
    setBukubesarStartDate(val);
    setBukubesarDatePreset('CUSTOM');
  };

  const handleEndDateChange = (val: string) => {
    setBukubesarEndDate(val);
    setBukubesarDatePreset('CUSTOM');
  };

  // Void modal state
  const [voidModalTrx, setVoidModalTrx] = useState<Transaction | null>(null);
  const [voidReasonOption, setVoidReasonOption] = useState('Salah input kasir');
  const [voidReasonNotes, setVoidReasonNotes] = useState('');

  // Change Payment Method modal state
  const [methodModalTrx, setMethodModalTrx] = useState<Transaction | null>(null);
  const [targetNewMethod, setTargetNewMethod] = useState<'Tunai' | 'Transfer' | 'QRIS' | 'EDC' | 'Kasbon'>('Tunai');
  const [targetNewBank, setTargetNewBank] = useState<string>('Mandiri');
  const [methodNotes, setMethodNotes] = useState('');

  // 1. DATA BUKU PIUTANG
  // Transactions that have remaining balance or were created as Kasbon / Cicilan
  const piutangTransactions = transactions.filter((t) => {
    return (
      t.status === 'DP 50%' ||
      t.status === 'BELUM LUNAS' ||
      (t.amountRemaining && t.amountRemaining > 0) ||
      (t.method === 'Kasbon' && t.status !== 'VOID')
    );
  });

  // Calculate Piutang KPIs
  const totalPiutangAktif = transactions
    .filter((t) => t.status === 'DP 50%' || t.status === 'BELUM LUNAS')
    .reduce((sum, t) => sum + (t.amountRemaining || 0), 0);

  const totalPiutangOverdue = transactions
    .filter((t) => {
      if (t.status !== 'DP 50%' && t.status !== 'BELUM LUNAS') return false;
      if (!t.dueDate || t.dueDate === '-') return false;
      return new Date(t.dueDate + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');
    })
    .reduce((sum, t) => sum + (t.amountRemaining || 0), 0);

  const totalPiutangTerbayar = transactions
    .filter((t) => t.id.startsWith('PAY-'))
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtered Piutang List
  const filteredPiutangList = piutangTransactions.filter((t) => {
    const isOverdue = t.dueDate && t.dueDate !== '-' && new Date(t.dueDate + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');
    if (piutangStatusFilter === 'BELUM LUNAS') {
      if ((t.amountRemaining || 0) <= 0) return false;
    } else if (piutangStatusFilter === 'LUNAS') {
      if ((t.amountRemaining || 0) > 0) return false;
    } else if (piutangStatusFilter === 'OVERDUE') {
      if (!((t.amountRemaining || 0) > 0 && isOverdue)) return false;
    }

    // Filter Berdasarkan Nama Member / Peminjam / ID
    if (piutangSearchName.trim()) {
      const q = piutangSearchName.toLowerCase().trim();
      const matchCustomer = (t.customer || '').toLowerCase().includes(q);
      const matchBill = (t.billName || '').toLowerCase().includes(q);
      const matchId = (t.id || '').toLowerCase().includes(q);
      if (!matchCustomer && !matchBill && !matchId) return false;
    }

    // Filter Berdasarkan Tanggal Transaksi
    if (piutangStartDate && t.date < piutangStartDate) {
      return false;
    }
    if (piutangEndDate && t.date > piutangEndDate) {
      return false;
    }

    return true;
  });

  // Calculate filtered Piutang totals
  const filteredTotalKontrak = filteredPiutangList.reduce((sum, t) => sum + (t.amount || 0), 0);
  const filteredTotalTerbayar = filteredPiutangList.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
  const filteredTotalSisa = filteredPiutangList.reduce((sum, t) => sum + (t.amountRemaining || 0), 0);

  // Active eligible unpaid piutang within current filter
  const eligibleUnpaidInFilter = filteredPiutangList.filter(
    (t) => (t.amountRemaining || 0) > 0 && t.status !== 'VOID'
  );
  const isAllEligibleSelected =
    eligibleUnpaidInFilter.length > 0 &&
    eligibleUnpaidInFilter.every((t) => selectedPiutangIds.includes(t.id));

  const handleToggleSelectPiutang = (id: string) => {
    setSelectedPiutangIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllEligible = () => {
    if (isAllEligibleSelected) {
      const eligibleIds = new Set(eligibleUnpaidInFilter.map((t) => t.id));
      setSelectedPiutangIds((prev) => prev.filter((id) => !eligibleIds.has(id)));
    } else {
      const newSelected = new Set(selectedPiutangIds);
      eligibleUnpaidInFilter.forEach((t) => newSelected.add(t.id));
      setSelectedPiutangIds(Array.from(newSelected));
    }
  };

  const handleToggleSelectForList = (trxs: Transaction[]) => {
    const unpaidIds = trxs
      .filter((t) => (t.amountRemaining || 0) > 0 && t.status !== 'VOID')
      .map((t) => t.id);
    if (unpaidIds.length === 0) return;
    const allSelected = unpaidIds.every((id) => selectedPiutangIds.includes(id));
    if (allSelected) {
      const unpaidSet = new Set(unpaidIds);
      setSelectedPiutangIds((prev) => prev.filter((id) => !unpaidSet.has(id)));
    } else {
      const newSelected = new Set(selectedPiutangIds);
      unpaidIds.forEach((id) => newSelected.add(id));
      setSelectedPiutangIds(Array.from(newSelected));
    }
  };

  const handleClearSelection = () => {
    setSelectedPiutangIds([]);
  };

  const selectedPiutangTransactions = transactions.filter(
    (t) => selectedPiutangIds.includes(t.id) && (t.amountRemaining || 0) > 0 && t.status !== 'VOID'
  );
  const selectedTotalSisa = selectedPiutangTransactions.reduce(
    (sum, t) => sum + (t.amountRemaining || 0),
    0
  );

  // 2. DAILY CLOSING MATHEMATICAL CALCULATIONS (BASED ON closingDate)
  const targetClosingTrx = transactions.filter((t) => t.date === closingDate);
  const activeClosingTrx = targetClosingTrx.filter((t) => t.status !== 'VOID');

  // Filtered transactions for Daily Closing audit table (sinkron dengan filter Buku Besar)
  const filteredClosingAuditTrx = useMemo(() => {
    return targetClosingTrx.filter((t) => {
      // 1. Audit Tab: ALL, Tunai, Non-Tunai, VOID
      if (closingAuditTab === 'Tunai' && (t.method !== 'Tunai' || t.status === 'VOID')) return false;
      if (closingAuditTab === 'Non-Tunai' && (t.method === 'Tunai' || t.method === 'Kasbon' || t.status === 'VOID')) return false;
      if (closingAuditTab === 'VOID' && t.status !== 'VOID') return false;

      // 2. Specific Payment Method Filter
      if (closingTrxMethodFilter !== 'ALL') {
        const mStr = (t.method || '').toLowerCase();
        if (!mStr.includes(closingTrxMethodFilter.toLowerCase())) return false;
      }

      // 3. Category / Type Filter
      if (closingTrxCategoryFilter !== 'ALL') {
        if (t.type !== closingTrxCategoryFilter) return false;
      }

      // 4. Status Filter
      if (closingTrxStatusFilter !== 'ALL') {
        if (t.status !== closingTrxStatusFilter) return false;
      }

      // 5. Keyword Search Filter
      if (closingTrxSearch.trim()) {
        const q = closingTrxSearch.toLowerCase();
        const mId = t.id.toLowerCase().includes(q);
        const mCust = (t.customer || '').toLowerCase().includes(q);
        const mDesc = (t.desc || '').toLowerCase().includes(q);
        const mMethod = (t.method || '').toLowerCase().includes(q);
        const mCashier = (t.cashier || t.picNames || '').toLowerCase().includes(q);
        return mId || mCust || mDesc || mMethod || mCashier;
      }

      return true;
    });
  }, [targetClosingTrx, closingAuditTab, closingTrxMethodFilter, closingTrxCategoryFilter, closingTrxStatusFilter, closingTrxSearch]);

  const getTrxInflow = (t: Transaction) => {
    if (t.status === 'VOID') return 0;
    if (t.id.startsWith('PAY-')) return t.amount;
    if (t.initialCashPaid !== undefined) return t.initialCashPaid;
    return t.amountPaid !== undefined ? t.amountPaid : (t.amount || 0);
  };

  const isArthaBank = (t: Transaction) => {
    if (t.bankDest === 'Artha Graha') return true;
    if (t.bankDest && t.bankDest.toLowerCase().includes('artha')) return true;
    if (!t.bankDest && t.type === 'POS') return true;
    return false;
  };

  const isMandiriBank = (t: Transaction) => {
    if (t.bankDest === 'Mandiri') return true;
    if (t.bankDest && t.bankDest.toLowerCase().includes('mandiri')) return true;
    if (!t.bankDest && t.type !== 'POS') return true;
    return false;
  };

  // Helper untuk mendapatkan rincian perbankan non-tunai (Mandiri, Artha Graha, dan channelnya) per sesi Daily Closing
  const getRecordNonCashBreakdown = (cr: DailyClosingRecord) => {
    let mandiri = cr.mandiriSales !== undefined ? cr.mandiriSales : cr.bankMandiri;
    let artha = cr.arthaSales !== undefined ? cr.arthaSales : cr.bankArtha;
    let mandiriQris = cr.mandiriQRIS || 0;
    let mandiriTf = cr.mandiriTF || 0;
    let mandiriEdc = cr.mandiriEDC || 0;
    let arthaQris = cr.arthaQRIS || 0;
    let arthaTf = cr.arthaTF || 0;
    let arthaEdc = cr.arthaEDC || 0;
    const otherBanksMap: Record<string, number> = {};

    // Jika belum tersimpan di record atau nilainya 0 padahal nonTunai > 0, hitung otomatis dari transaksi harian
    if (
      mandiri === undefined ||
      artha === undefined ||
      (mandiri === 0 && artha === 0 && (cr.nonTunai || 0) > 0)
    ) {
      const dayTrx = transactions.filter((t) => {
        const matchDate = t.date === cr.date;
        const matchBranch = !cr.branchId || !t.branchId || t.branchId === cr.branchId;
        const validStatus = t.status !== 'VOID';
        return matchDate && matchBranch && validStatus && t.method !== 'Tunai' && t.method !== 'Kasbon';
      });

      if (dayTrx.length > 0) {
        let calcMandiri = 0;
        let calcArtha = 0;
        let mQ = 0, mT = 0, mE = 0;
        let aQ = 0, aT = 0, aE = 0;

        dayTrx.forEach((t) => {
          const amt = getTrxInflow(t);
          if (isMandiriBank(t)) {
            calcMandiri += amt;
            if (t.method === 'QRIS') mQ += amt;
            else if (t.method === 'Transfer') mT += amt;
            else mE += amt;
          } else if (isArthaBank(t)) {
            calcArtha += amt;
            if (t.method === 'QRIS') aQ += amt;
            else if (t.method === 'Transfer') aT += amt;
            else aE += amt;
          } else {
            const bName = t.bankDest || 'Bank Lainnya';
            otherBanksMap[bName] = (otherBanksMap[bName] || 0) + amt;
          }
        });

        mandiri = calcMandiri;
        artha = calcArtha;
        mandiriQris = mQ;
        mandiriTf = mT;
        mandiriEdc = mE;
        arthaQris = aQ;
        arthaTf = aT;
        arthaEdc = aE;
      }
    }

    const finalMandiri = mandiri || 0;
    const finalArtha = artha || 0;
    const otherBanks = Object.entries(otherBanksMap).map(([name, amount]) => ({ name, amount }));
    const otherTotal = otherBanks.reduce((s, b) => s + b.amount, 0);
    const total = (cr.nonTunai !== undefined && cr.nonTunai > 0) ? cr.nonTunai : (finalMandiri + finalArtha + otherTotal);

    return {
      total,
      mandiri: finalMandiri,
      artha: finalArtha,
      mandiriQris,
      mandiriTf,
      mandiriEdc,
      arthaQris,
      arthaTf,
      arthaEdc,
      otherBanks
    };
  };

  // Cash / Tunai
  const cashTrxToday = activeClosingTrx.filter((t) => t.method === 'Tunai');
  const tunaiLaciKasir = cashTrxToday.reduce((sum, t) => sum + getTrxInflow(t), 0);

  // Non-Cash
  const nonCashTrxToday = activeClosingTrx.filter((t) => t.method !== 'Tunai' && t.method !== 'Kasbon');

  // Artha Graha Breakdown
  const arthaTrx = nonCashTrxToday.filter(isArthaBank);
  const arthaGrahaQRIS = arthaTrx
    .filter((t) => t.method === 'QRIS')
    .reduce((sum, t) => sum + getTrxInflow(t), 0);
  const arthaGrahaTransfer = arthaTrx
    .filter((t) => t.method === 'Transfer')
    .reduce((sum, t) => sum + getTrxInflow(t), 0);
  const arthaGrahaEDC = arthaTrx
    .filter((t) => t.method === 'EDC' || t.method === 'Debit')
    .reduce((sum, t) => sum + getTrxInflow(t), 0);
  const arthaGrahaTotal = arthaGrahaQRIS + arthaGrahaTransfer + arthaGrahaEDC;

  // Mandiri Breakdown
  const mandiriTrx = nonCashTrxToday.filter(isMandiriBank);
  const mandiriQRIS = mandiriTrx
    .filter((t) => t.method === 'QRIS')
    .reduce((sum, t) => sum + getTrxInflow(t), 0);
  const mandiriTransfer = mandiriTrx
    .filter((t) => t.method === 'Transfer')
    .reduce((sum, t) => sum + getTrxInflow(t), 0);
  const mandiriEDC = mandiriTrx
    .filter((t) => t.method === 'EDC' || t.method === 'Debit')
    .reduce((sum, t) => sum + getTrxInflow(t), 0);
  const mandiriTotal = mandiriQRIS + mandiriTransfer + mandiriEDC;

  const nonTunaiMasuk = arthaGrahaTotal + mandiriTotal;
  const totalOmset = tunaiLaciKasir + nonTunaiMasuk;
  const totalTrxCount = activeClosingTrx.length;

  const financialSummaryData: FinancialSummaryData = {
    totalOmset,
    totalTrx: totalTrxCount,
    tunaiLaci: tunaiLaciKasir,
    nonTunai: nonTunaiMasuk,
    arthaGrahaTotal,
    arthaGrahaQRIS,
    arthaGrahaTransfer,
    arthaGrahaEDC,
    mandiriTotal,
    mandiriQRIS,
    mandiriTransfer,
    mandiriEDC
  };

  // Selected Date Company Cash Expenses (Approved Cash Outflows from Drawer)
  const selectedDateCompanyCashExpenses = (companyExpenses || [])
    .filter(
      (e) =>
        e.approvalStatus === 'Disetujui' &&
        (e.date === closingDate || e.date.includes(closingDate)) &&
        (e.paymentMethod === 'Kas' || (e.sourceAccount || '').includes('Kas Laci')) &&
        (isAllBranches || e.branchId === (activeBranchId === ALL_BRANCHES_ID ? branches[0]?.id : activeBranchId))
    )
    .reduce((sum, e) => sum + (e.paidAmount > 0 ? e.paidAmount : e.amount), 0);

  // Selected Date Petty Cash Expense & Approved Company Cash Expenses
  const selectedDatePettyExpenses =
    pettyCashList
      .filter(
        (p) =>
          p.date === closingDate ||
          p.date.includes(closingDate) ||
          (p.created_at && p.created_at.startsWith(closingDate))
      )
      .reduce(
        (sum, p) => sum + (p.total_expense !== undefined ? p.total_expense : p.amount || 0),
        0
      ) + selectedDateCompanyCashExpenses;

  // Initial Drawer Cash (Input Modal Kas Laci / Cash Float)
  const openingDrawerCash = Math.max(0, Number(openingDrawerCashInput) || 0);
  const expectedSystemCash = openingDrawerCash + tunaiLaciKasir - selectedDatePettyExpenses;

  const inputCashNumber = Number(physicalCashInput) || 0;
  const cashVariance = physicalCashInput ? inputCashNumber - expectedSystemCash : 0;

  const isSelectedDateClosed = closingRecords.some((r) => r.date === closingDate) || (closingDate === APP_TODAY && isStoreClosed);

  // Sinkronisasi data form closing saat tanggal berganti
  useEffect(() => {
    const existing = closingRecords.find(
      (r) => r.date === closingDate && (!r.branchId || isAllBranches || r.branchId === activeBranchId)
    );
    if (existing) {
      if (existing.modalAwal !== undefined || existing.openingFloat !== undefined) {
        setOpeningDrawerCashInput(String(existing.modalAwal ?? existing.openingFloat ?? 500000));
      }
      if (existing.physicalCash !== undefined) {
        setPhysicalCashInput(String(existing.physicalCash));
      }
      if (existing.notes) {
        setClosingNotes(existing.notes);
      }
    } else {
      setPhysicalCashInput('');
      setClosingNotes('');
    }
  }, [closingDate, closingRecords, activeBranchId, isAllBranches]);

  // Handle Pay Installment
  const handleOpenPayModal = (trx: Transaction) => {
    setSelectedPiutang(trx);
    setPayAmount(String(trx.amountRemaining || 0));
    setPayMethod(trx.type === 'POS' ? 'Tunai' : 'Transfer');
  };

  // Buku Besar Filtered List
  const filteredBukubesarTrx = transactions.filter((trx) => {
    if (!isSuperAdmin) {
      const trxBranch = trx.branchId || 'BR-001';
      if (trxBranch !== userBranchId) return false;
    } else if (bukuBesarBranchFilter !== 'ALL') {
      const trxBranch = trx.branchId || 'BR-001';
      if (trxBranch !== bukuBesarBranchFilter) return false;
    }

    if (bukubesarTypeFilter === 'VOID') {
      if (trx.status !== 'VOID') return false;
    } else if (bukubesarTypeFilter !== 'ALL') {
      if (trx.type !== bukubesarTypeFilter) return false;
    }

    // Payment Method Filter
    if (bukubesarPaymentMethodFilter !== 'ALL') {
      const methodStr = (trx.method || '').toLowerCase();
      const filterKey = bukubesarPaymentMethodFilter.toLowerCase();
      if (!methodStr.includes(filterKey)) return false;
    }

    // Status Filter
    if (bukubesarStatusFilter !== 'ALL') {
      if (trx.status !== bukubesarStatusFilter) return false;
    }

    if (bukubesarPicFilters.length > 0) {
      const picNames = (trx.picNames || '').toLowerCase();
      const picId = (trx.picId || '').toLowerCase();
      const cashier = (trx.cashier || '').toLowerCase();
      const picIds = (trx.picIds || []).map((id) => id.toLowerCase());

      const match = bukubesarPicFilters.some((selectedPic) => {
        const qPic = selectedPic.toLowerCase();
        return (
          picNames.includes(qPic) ||
          picId === qPic ||
          picIds.includes(qPic) ||
          cashier.includes(qPic)
        );
      });
      if (!match) return false;
    }

    if (bukubesarStartDate && trx.date < bukubesarStartDate) {
      return false;
    }
    if (bukubesarEndDate && trx.date > bukubesarEndDate) {
      return false;
    }

    if (bukubesarSearch.trim()) {
      const q = bukubesarSearch.toLowerCase();
      const matchId = trx.id.toLowerCase().includes(q);
      const matchCust = (trx.customer || '').toLowerCase().includes(q);
      const matchDesc = (trx.desc || '').toLowerCase().includes(q);
      const matchMethod = (trx.method || '').toLowerCase().includes(q);
      const matchPic = (trx.picNames || '').toLowerCase().includes(q) || (trx.cashier || '').toLowerCase().includes(q);
      return matchId || matchCust || matchDesc || matchMethod || matchPic;
    }
    return true;
  });

  // Total Kas Masuk (Debit) dari Buku Besar yang tersaring (exclude VOID)
  const totalDebitFiltered = filteredBukubesarTrx
    .filter((t) => t.status !== 'VOID')
    .reduce((sum, t) => sum + (t.amountPaid || t.amount || 0), 0);

  // Filtered Closing Records List for Laporan Daily Closing
  const filteredClosingRecords = useMemo(() => {
    return closingRecords.filter((cr) => {
      // 1. Branch filter
      if (!isSuperAdmin) {
        const brId = cr.branchId || 'BR-001';
        if (brId !== userBranchId) return false;
      } else if (closingReportBranchFilter !== 'ALL') {
        const brId = cr.branchId || 'BR-001';
        if (brId !== closingReportBranchFilter) return false;
      }

      // 2. Cashier filter
      if (closingReportCashierFilter !== 'ALL') {
        const cName = cr.cashierName || cr.closedBy || '';
        if (cName !== closingReportCashierFilter) return false;
      }

      // 3. Variance / Selisih filter
      if (closingReportVarianceFilter !== 'ALL') {
        const v = cr.variance !== undefined ? cr.variance : (cr.difference || 0);
        if (closingReportVarianceFilter === 'MATCH' && v !== 0) return false;
        if (closingReportVarianceFilter === 'SURPLUS' && v <= 0) return false;
        if (closingReportVarianceFilter === 'DEFICIT' && v >= 0) return false;
      }

      // 4. Date range filter
      if (closingReportStartDate && cr.date < closingReportStartDate) return false;
      if (closingReportEndDate && cr.date > closingReportEndDate) return false;

      // 5. Search
      if (closingReportSearch.trim()) {
        const q = closingReportSearch.toLowerCase();
        const mId = cr.id.toLowerCase().includes(q);
        const mDate = cr.date.includes(q);
        const mCashier = (cr.cashierName || cr.closedBy || '').toLowerCase().includes(q);
        const mBranch = (cr.branchName || '').toLowerCase().includes(q);
        const mNotes = (cr.notes || '').toLowerCase().includes(q);
        return mId || mDate || mCashier || mBranch || mNotes;
      }

      return true;
    });
  }, [closingRecords, closingReportBranchFilter, closingReportCashierFilter, closingReportVarianceFilter, closingReportStartDate, closingReportEndDate, closingReportSearch]);

  // Unique Cashiers in Closing Records
  const uniqueClosingCashiers = useMemo(() => {
    const set = new Set<string>();
    closingRecords.forEach((cr) => {
      const name = cr.cashierName || cr.closedBy;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [closingRecords]);

  // Closing Report Metrics
  const closingReportMetrics = useMemo(() => {
    const totalCount = filteredClosingRecords.length;
    const totalOpeningFloat = filteredClosingRecords.reduce((sum, r) => sum + (r.openingFloat || r.modalAwal || 0), 0);
    const totalRevenue = filteredClosingRecords.reduce((sum, r) => sum + (r.revenue || 0), 0);
    const totalCashIn = filteredClosingRecords.reduce((sum, r) => sum + (r.tunai || r.cashSales || 0), 0);
    const totalNonCashIn = filteredClosingRecords.reduce((sum, r) => sum + (r.nonTunai || 0), 0);
    const totalPettyCash = filteredClosingRecords.reduce((sum, r) => sum + (r.pettyExpenses || r.pettyCash || 0), 0);
    const totalExpectedCash = filteredClosingRecords.reduce((sum, r) => sum + (r.expectedCash || r.systemSaldo || 0), 0);
    const totalPhysicalCash = filteredClosingRecords.reduce((sum, r) => sum + (r.physicalCash || r.actualCash || 0), 0);
    const totalVariance = filteredClosingRecords.reduce((sum, r) => sum + (r.variance !== undefined ? r.variance : (r.difference || 0)), 0);
    const matchCount = filteredClosingRecords.filter((r) => (r.variance !== undefined ? r.variance : (r.difference || 0)) === 0).length;
    const mismatchCount = totalCount - matchCount;

    // Rincian perbankan non-tunai konsolidasi (Mandiri & Artha Graha)
    let totalMandiriIn = 0;
    let totalArthaIn = 0;
    filteredClosingRecords.forEach((r) => {
      const b = getRecordNonCashBreakdown(r);
      totalMandiriIn += b.mandiri;
      totalArthaIn += b.artha;
    });

    return {
      totalCount,
      totalOpeningFloat,
      totalRevenue,
      totalCashIn,
      totalNonCashIn,
      totalMandiriIn,
      totalArthaIn,
      totalPettyCash,
      totalExpectedCash,
      totalPhysicalCash,
      totalVariance,
      matchCount,
      mismatchCount
    };
  }, [filteredClosingRecords, transactions]);

  const handleSetClosingReportDatePreset = (preset: 'ALL' | 'TODAY' | '7DAYS' | 'MONTH') => {
    setClosingReportDatePreset(preset);
    if (preset === 'ALL') {
      setClosingReportStartDate('');
      setClosingReportEndDate('');
    } else if (preset === 'TODAY') {
      setClosingReportStartDate(APP_TODAY);
      setClosingReportEndDate(APP_TODAY);
    } else if (preset === '7DAYS') {
      const todayDate = new Date(APP_TODAY + 'T00:00:00');
      const start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 6);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      setClosingReportStartDate(`${y}-${m}-${d}`);
      setClosingReportEndDate(APP_TODAY);
    } else if (preset === 'MONTH') {
      const [year, month] = APP_TODAY.split('-');
      setClosingReportStartDate(`${year}-${month}-01`);
      setClosingReportEndDate(APP_TODAY);
    }
  };

  const handleResetClosingReportFilters = () => {
    setClosingReportSearch('');
    setClosingReportBranchFilter('ALL');
    setClosingReportCashierFilter('ALL');
    setClosingReportVarianceFilter('ALL');
    setClosingReportDatePreset('ALL');
    setClosingReportStartDate('');
    setClosingReportEndDate('');
  };

  const handleExportClosingReportCSV = () => {
    if (filteredClosingRecords.length === 0) {
      showToast('Tidak Ada Data', 'Tidak ada data closing untuk diekspor.', 'warning');
      return;
    }

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines: string[] = [];
    lines.push('LAPORAN REKAPITULASI DAILY CLOSING KASIR - GYMPRO ERP');
    lines.push(`Tanggal Cetak,${getTimestamp()}`);
    lines.push(`Jumlah Sesi Closing,${filteredClosingRecords.length}`);
    lines.push('');
    lines.push('No,ID Closing,Tanggal,Waktu,Cabang,Kasir,Modal Awal,Tunai Masuk,Non-Tunai Total,Bank Mandiri,Bank Artha Graha,Total Omset,Petty Cash Out,Kas Seharusnya,Fisik Aktual,Selisih Varian,Status,Catatan');

    filteredClosingRecords.forEach((cr, idx) => {
      const variance = cr.variance !== undefined ? cr.variance : (cr.difference || 0);
      const statusStr = variance === 0 ? 'BALANCE' : variance > 0 ? 'LEBIH' : 'KURANG';
      const b = getRecordNonCashBreakdown(cr);
      lines.push([
        idx + 1,
        escapeCsv(cr.id),
        escapeCsv(cr.date),
        escapeCsv(cr.time || cr.closedAt || '-'),
        escapeCsv(cr.branchName || '-'),
        escapeCsv(cr.cashierName || cr.closedBy || '-'),
        cr.openingFloat || cr.modalAwal || 0,
        cr.tunai || cr.cashSales || 0,
        b.total,
        b.mandiri,
        b.artha,
        cr.revenue || 0,
        cr.pettyExpenses || cr.pettyCash || 0,
        cr.expectedCash || cr.systemSaldo || 0,
        cr.physicalCash || cr.actualCash || 0,
        variance,
        statusStr,
        escapeCsv(cr.notes || '-')
      ].join(','));
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Daily_Closing_${APP_TODAY}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download CSV Selesai', `Laporan daily closing (${filteredClosingRecords.length} sesi) berhasil diunduh.`, 'success');
  };

  const handleExportClosingReportExcel = () => {
    if (filteredClosingRecords.length === 0) {
      showToast('Tidak Ada Data', 'Tidak ada data closing untuk diekspor ke Excel.', 'warning');
      return;
    }

    try {
      const rows: Record<string, any>[] = filteredClosingRecords.map((cr, idx) => {
        const variance = cr.variance !== undefined ? cr.variance : (cr.difference || 0);
        const statusStr = variance === 0 ? 'MATCH / BALANCE' : variance > 0 ? 'LEBIH' : 'KURANG';
        const b = getRecordNonCashBreakdown(cr);
        return {
          'No': idx + 1,
          'ID Closing': cr.id,
          'Tanggal': cr.date,
          'Waktu': cr.time || cr.closedAt || '-',
          'Cabang': cr.branchName || '-',
          'Kasir': cr.cashierName || cr.closedBy || '-',
          'Modal Awal (Rp)': cr.openingFloat || cr.modalAwal || 0,
          'Tunai Masuk (Rp)': cr.tunai || cr.cashSales || 0,
          'Non-Tunai Total (Rp)': b.total,
          'Bank Mandiri (Rp)': b.mandiri,
          'Bank Artha Graha (Rp)': b.artha,
          'Kas Diharapkan (Rp)': cr.expectedCash || cr.systemSaldo || 0,
          'Fisik Aktual (Rp)': cr.physicalCash || cr.actualCash || 0,
          'Selisih Varian (Rp)': variance,
          'Status': statusStr,
          'Catatan': cr.notes || '-'
        };
      });

      // Baris Total Rekapitulasi
      rows.push({
        'No': 'TOTAL',
        'ID Closing': '',
        'Tanggal': '',
        'Waktu': '',
        'Cabang': '',
        'Kasir': '',
        'Modal Awal (Rp)': closingReportMetrics.totalOpeningFloat,
        'Tunai Masuk (Rp)': closingReportMetrics.totalCashIn,
        'Non-Tunai Total (Rp)': closingReportMetrics.totalNonCashIn,
        'Bank Mandiri (Rp)': closingReportMetrics.totalMandiriIn,
        'Bank Artha Graha (Rp)': closingReportMetrics.totalArthaIn,
        'Kas Diharapkan (Rp)': closingReportMetrics.totalExpectedCash,
        'Fisik Aktual (Rp)': closingReportMetrics.totalPhysicalCash,
        'Selisih Varian (Rp)': closingReportMetrics.totalVariance,
        'Status': `${closingReportMetrics.matchCount} MATCH, ${closingReportMetrics.mismatchCount} SELISIH`,
        'Catatan': ''
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Daily Closing');
      XLSX.writeFile(workbook, `Laporan_Rekap_Daily_Closing_${APP_TODAY}.xlsx`);
      showToast('Export Excel Berhasil', `Laporan daily closing (${filteredClosingRecords.length} sesi) berhasil diekspor.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal Export', 'Terjadi kesalahan saat mengekspor ke Excel.', 'error');
    }
  };

  const handleClosingReportStartDateChange = (val: string) => {
    setClosingReportStartDate(val);
    setClosingReportDatePreset('CUSTOM');
  };

  const handleClosingReportEndDateChange = (val: string) => {
    setClosingReportEndDate(val);
    setClosingReportDatePreset('CUSTOM');
  };

  // Navigasi & Sinkronisasi Silang: Daily Closing ke Buku Besar
  const handleJumpToBukuBesar = (targetDate: string, method?: string, category?: string) => {
    setActiveTab('bukubesar');
    setBukubesarStartDate(targetDate);
    setBukubesarEndDate(targetDate);
    setBukubesarDatePreset('CUSTOM');
    if (method && method !== 'ALL') {
      setBukubesarPaymentMethodFilter(method);
    } else {
      setBukubesarPaymentMethodFilter('ALL');
    }
    if (category && category !== 'ALL') {
      setBukubesarTypeFilter(category);
    } else {
      setBukubesarTypeFilter('ALL');
    }
    showToast('Sinkronisasi Buku Besar', `Menampilkan transaksi tanggal ${formatDateIndo(targetDate)} di Buku Besar.`, 'info');
  };

  // Navigasi & Sinkronisasi Silang: Buku Besar ke Daily Closing
  const handleJumpToDailyClosing = (targetDate: string) => {
    setClosingDate(targetDate);
    setActiveTab('closing');
    setClosingSubView('form');
    showToast('Buka Daily Closing', `Menampilkan Lembar Tutup Kasir tanggal ${formatDateIndo(targetDate)}.`, 'info');
  };

  // Export Buku Besar to Excel (.xlsx)
  const handleExportBukubesarExcel = () => {
    if (filteredBukubesarTrx.length === 0) {
      showToast('Data Kosong', 'Tidak ada data transaksi buku besar yang tersaring untuk diunduh.', 'warning');
      return;
    }

    try {
      const exportRows: Record<string, any>[] = filteredBukubesarTrx.map((trx, idx) => ({
        'No': idx + 1,
        'No. Transaksi': trx.id,
        'Tanggal': trx.date,
        'Jam': trx.time || '',
        'Cabang': trx.branchName || 'Cabang Utama',
        'Kategori': trx.type,
        'Uraian Transaksi': trx.desc || '',
        'Nama Pelanggan': trx.customer || '',
        'ID Member': trx.memberId || '',
        'PIC (Sales / Trainer)': trx.picNames || trx.picId || trx.cashier || '-',
        'Kasir Bertugas': trx.cashier || '',
        'Metode Bayar': trx.method || '',
        'Bank Tujuan': trx.bankDest || '',
        'Debit Kas Masuk (Rp)': trx.status === 'VOID' ? 0 : (trx.amountPaid || trx.amount || 0),
        'Total Tagihan (Rp)': trx.amount || 0,
        'Sisa Piutang (Rp)': trx.amountRemaining || 0,
        'Status Transaksi': trx.status
      }));

      // Append Total Summary Row
      const totalBilled = filteredBukubesarTrx.reduce((s, t) => s + (t.status === 'VOID' ? 0 : (t.amount || 0)), 0);
      const totalRemaining = filteredBukubesarTrx.reduce((s, t) => s + (t.status === 'VOID' ? 0 : (t.amountRemaining || 0)), 0);
      exportRows.push({
        'No': '' as any,
        'No. Transaksi': 'TOTAL TRANSAKSI',
        'Tanggal': `${filteredBukubesarTrx.length} Trx`,
        'Jam': '',
        'Cabang': bukuBesarBranchFilter === 'ALL' ? 'Semua Cabang' : bukuBesarBranchFilter,
        'Kategori': bukubesarTypeFilter === 'ALL' ? 'Semua Kategori' : bukubesarTypeFilter,
        'Uraian Transaksi': `Total Debit Kas Masuk: ${formatRp(totalDebitFiltered)}`,
        'Nama Pelanggan': '',
        'ID Member': '',
        'PIC (Sales / Trainer)': bukubesarPicFilters.length > 0 ? `Filter PIC (${bukubesarPicFilters.length}): ${bukubesarPicFilters.join(', ')}` : 'Semua PIC',
        'Kasir Bertugas': '',
        'Metode Bayar': '',
        'Bank Tujuan': '',
        'Debit Kas Masuk (Rp)': totalDebitFiltered,
        'Total Tagihan (Rp)': totalBilled,
        'Sisa Piutang (Rp)': totalRemaining,
        'Status Transaksi': `${filteredBukubesarTrx.filter((t) => t.status !== 'VOID').length} Berhasil, ${filteredBukubesarTrx.filter((t) => t.status === 'VOID').length} VOID`
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      worksheet['!cols'] = [
        { wch: 5 },   // No
        { wch: 20 },  // No. Transaksi
        { wch: 13 },  // Tanggal
        { wch: 10 },  // Jam
        { wch: 22 },  // Cabang
        { wch: 16 },  // Kategori
        { wch: 40 },  // Uraian
        { wch: 22 },  // Pelanggan
        { wch: 14 },  // ID Member
        { wch: 24 },  // PIC
        { wch: 16 },  // Kasir
        { wch: 15 },  // Metode
        { wch: 14 },  // Bank
        { wch: 22 },  // Debit
        { wch: 20 },  // Total
        { wch: 18 },  // Sisa
        { wch: 16 }   // Status
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Besar');

      const dateStr = bukubesarStartDate && bukubesarEndDate
        ? `${bukubesarStartDate}_sd_${bukubesarEndDate}`
        : bukubesarStartDate || bukubesarEndDate || APP_TODAY;
      const picSuffix = bukubesarPicFilters.length > 0
        ? `_PIC_${bukubesarPicFilters.map((p) => p.replace(/\s+/g, '_')).join('-')}`
        : '';
      const catSuffix = bukubesarTypeFilter !== 'ALL' ? `_${bukubesarTypeFilter.replace(/\s+/g, '_')}` : '';
      const fileName = `Laporan_Buku_Besar_RFA_GYM_${dateStr}${catSuffix}${picSuffix}.xlsx`;

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Export Excel Berhasil', `File ${fileName} (${filteredBukubesarTrx.length} transaksi) berhasil diunduh.`, 'success');
    } catch (err) {
      console.error('Failed to export Excel:', err);
      showToast('Gagal Export Excel', 'Terjadi kesalahan saat memproses data Excel.', 'error');
    }
  };

  // Export Buku Besar to PDF (.pdf) - 100% Native Vector PDF Document (Not a screen snapshot/image)
  const handleExportBukubesarPdf = () => {
    if (filteredBukubesarTrx.length === 0) {
      showToast('Data Kosong', 'Tidak ada data transaksi buku besar yang tersaring untuk diekspor ke PDF.', 'warning');
      return;
    }

    setIsExportingBukubesarPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const margin = 12;
      const printableWidth = pdfWidth - margin * 2; // 273mm

      const gymBrand = 'RFA GYM & FITNESS CENTER';
      const branchTitle = activeBranch?.name
        ? (activeBranchId === ALL_BRANCHES_ID ? 'Konsolidasi Seluruh Cabang' : activeBranch.name)
        : 'GymPro Flagship Kelapa Gading';

      // 1. DOKUMEN KOP / HEADER RESMI
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(24, 24, 27);
      pdf.text(gymBrand, margin, 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(branchTitle, margin, 18.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(234, 88, 12);
      pdf.text('LAPORAN BUKU BESAR TRANSAKSI (GENERAL LEDGER)', margin, 24);

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Jurnal Lengkap Penerimaan Kas Masuk, Tagihan, Piutang & Performa Transaksi', margin, 28);

      // Status dokumen & waktu cetak di sisi kanan atas
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(24, 24, 27);
      pdf.text('DOKUMEN RESMI AKUNTANSI', pdfWidth - margin, 14, { align: 'right' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      const printDateStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
      pdf.text(`Waktu Cetak: ${printDateStr}`, pdfWidth - margin, 18.5, { align: 'right' });
      pdf.text(`Operator: ${currentUser?.name || 'Administrator Keuangan'}`, pdfWidth - margin, 23, { align: 'right' });

      // Garis aksen pemisah
      pdf.setDrawColor(249, 115, 22);
      pdf.setLineWidth(0.8);
      pdf.line(margin, 30.5, pdfWidth - margin, 30.5);

      // 2. KOTAK METADATA FILTER & REKAPITULASI RINGKASAN
      const boxY = 33;
      const boxH = 17;
      const leftBoxW = 145;
      const rightBoxW = printableWidth - leftBoxW - 4;
      const rightBoxX = margin + leftBoxW + 4;

      // Kotak Kiri: Informasi Kriteria Filter
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, boxY, leftBoxW, boxH, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text('PARAMETER FILTER LAPORAN:', margin + 3, boxY + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105);

      const periodText = bukubesarStartDate && bukubesarEndDate
        ? `${bukubesarStartDate} s/d ${bukubesarEndDate}`
        : (bukubesarStartDate || bukubesarEndDate || 'Semua Periode Transaksi');
      const branchFilterText = bukuBesarBranchFilter === 'ALL' ? 'Semua Cabang' : bukuBesarBranchFilter;
      const categoryFilterText = bukubesarTypeFilter === 'ALL' ? 'Semua Kategori' : bukubesarTypeFilter;
      const picFilterText = bukubesarPicFilters.length > 0
        ? `${bukubesarPicFilters.join(', ')} (${bukubesarPicFilters.length} PIC dipilih)`
        : 'Semua PIC (Sales, Trainer, Kasir)';

      pdf.text(`• Periode: ${periodText}`, margin + 3, boxY + 8.5);
      pdf.text(`• Cabang: ${branchFilterText}`, margin + 3, boxY + 12);
      pdf.text(`• Kategori: ${categoryFilterText}`, margin + 3, boxY + 15.5);

      pdf.text(`• Filter PIC:`, margin + 65, boxY + 8.5);
      const splitPic = pdf.splitTextToSize(picFilterText, 74);
      pdf.text(splitPic, margin + 80, boxY + 8.5);

      // Kotak Kanan: 4 Ringkasan Finansial Utama
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(rightBoxX, boxY, rightBoxW, boxH, 1.5, 1.5, 'FD');

      const colW = rightBoxW / 4;
      // Kolom 1: Total Transaksi
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('TOTAL TRANSAKSI', rightBoxX + 2, boxY + 4.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${filteredBukubesarTrx.length} Trx`, rightBoxX + 2, boxY + 9.5);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${filteredBukubesarTrx.filter((t) => t.status !== 'VOID').length} Sukses, ${filteredBukubesarTrx.filter((t) => t.status === 'VOID').length} VOID`, rightBoxX + 2, boxY + 14);

      // Kolom 2: Kas Masuk Debit
      const c2X = rightBoxX + colW;
      pdf.line(c2X - 1, boxY + 2, c2X - 1, boxY + boxH - 2);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('KAS MASUK (DEBIT)', c2X + 2, boxY + 4.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(16, 185, 129);
      pdf.text(formatRp(totalDebitFiltered), c2X + 2, boxY + 9.5);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('Dana riil masuk kas', c2X + 2, boxY + 14);

      // Kolom 3: Total Nilai Tagihan
      const totalBilled = filteredBukubesarTrx.reduce((s, t) => s + (t.status === 'VOID' ? 0 : (t.amount || 0)), 0);
      const totalRemaining = filteredBukubesarTrx.reduce((s, t) => s + (t.status === 'VOID' ? 0 : (t.amountRemaining || 0)), 0);

      const c3X = rightBoxX + colW * 2;
      pdf.line(c3X - 1, boxY + 2, c3X - 1, boxY + boxH - 2);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('NILAI TAGIHAN', c3X + 2, boxY + 4.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(59, 130, 246);
      pdf.text(formatRp(totalBilled), c3X + 2, boxY + 9.5);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('Bruto penjualan', c3X + 2, boxY + 14);

      // Kolom 4: Sisa Piutang
      const c4X = rightBoxX + colW * 3;
      pdf.line(c4X - 1, boxY + 2, c4X - 1, boxY + boxH - 2);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('SISA PIUTANG', c4X + 2, boxY + 4.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(245, 158, 11);
      pdf.text(formatRp(totalRemaining), c4X + 2, boxY + 9.5);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('Belum dilunasi', c4X + 2, boxY + 14);

      // 3. TABEL VEKTOR AUTOTABLE (Text Asli & Multi-Halaman Otomatis)
      const tableRows = filteredBukubesarTrx.map((trx, idx) => {
        const picDisplay = trx.picNames || trx.picId || trx.cashier || '-';
        const cashierDisplay = trx.cashier || '-';
        const picCombined = (picDisplay !== '-' && cashierDisplay !== '-' && picDisplay !== cashierDisplay)
          ? `${picDisplay} / ${cashierDisplay}`
          : (picDisplay !== '-' ? picDisplay : cashierDisplay);

        const amountDebit = trx.status === 'VOID'
          ? 0
          : (trx.amountPaid ?? trx.amount ?? 0);

        return [
          (idx + 1).toString(),
          `${trx.date || '-'}\n${trx.id}`,
          trx.branchName || 'Cabang',
          trx.type || '-',
          trx.desc || '-',
          `${trx.customer || 'Umum'}${trx.memberId ? '\n[' + trx.memberId + ']' : ''}`,
          picCombined,
          `${trx.method || '-'}${trx.bankDest ? ' (' + trx.bankDest + ')' : ''}`,
          formatRp(amountDebit),
          formatRp(trx.amount || 0),
          formatRp(trx.amountRemaining || 0),
          trx.status === 'VOID' ? 'VOID' : 'SUKSES'
        ];
      });

      autoTable(pdf, {
        startY: 53,
        head: [
          [
            'No',
            'Waktu / ID',
            'Cabang',
            'Kategori',
            'Uraian Transaksi',
            'Pelanggan / Member',
            'PIC / Kasir',
            'Metode / Bank',
            'Kas Masuk (Debit)',
            'Nilai Tagihan',
            'Sisa Piutang',
            'Status'
          ]
        ],
        body: tableRows,
        foot: [
          [
            '',
            'GRAND TOTAL',
            '',
            '',
            `Total Kas Masuk (Debit): ${formatRp(totalDebitFiltered)}`,
            '',
            '',
            '',
            formatRp(totalDebitFiltered),
            formatRp(totalBilled),
            formatRp(totalRemaining),
            `${filteredBukubesarTrx.length} Trx`
          ]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 6.8,
          textColor: [30, 41, 59],
          cellPadding: 1.6,
          valign: 'middle'
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontSize: 7.5,
          fontStyle: 'bold',
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 26 },
          2: { cellWidth: 22 },
          3: { cellWidth: 18 },
          4: { cellWidth: 46 },
          5: { cellWidth: 26 },
          6: { cellWidth: 26 },
          7: { cellWidth: 18 },
          8: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
          9: { cellWidth: 22, halign: 'right' },
          10: { cellWidth: 22, halign: 'right' },
          11: { cellWidth: 14, halign: 'center' }
        },
        margin: { left: margin, right: margin, bottom: 15 },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rawRow = data.row.raw as any;
            const rawStatus = rawRow ? rawRow[11] : '';
            if (rawStatus === 'VOID') {
              if (data.column.index === 11) {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              }
              data.cell.styles.textColor = [156, 163, 175];
            } else if (data.column.index === 8) {
              data.cell.styles.textColor = [16, 185, 129];
            } else if (data.column.index === 11) {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          if (data.section === 'foot') {
            if (data.column.index === 8) {
              data.cell.styles.textColor = [16, 185, 129];
            }
          }
        }
      });

      // 4. BAGIAN TANDA TANGAN PENGESAHAN (Signatures)
      let finalY = (pdf as any).lastAutoTable?.finalY || 100;
      if (finalY + 36 > pdfHeight - 15) {
        pdf.addPage();
        finalY = 20;
      } else {
        finalY += 8;
      }

      const sigBlockW = printableWidth / 3;
      const sigTitles = [
        { role: 'Dibuat Oleh:', label: 'PIC / Kasir Bertugas', name: currentUser?.name || 'Kasir Bertugas' },
        { role: 'Diperiksa Oleh:', label: 'Supervisor Keuangan', name: '( .......................................... )' },
        { role: 'Disetujui Oleh:', label: 'Branch / General Manager', name: '( .......................................... )' }
      ];

      sigTitles.forEach((sig, idx) => {
        const sigX = margin + idx * sigBlockW;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(sig.role, sigX + 4, finalY);

        pdf.setFont('helvetica', 'bold');
        pdf.text(sig.label, sigX + 4, finalY + 4);

        // Garis tanda tangan
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.4);
        pdf.line(sigX + 4, finalY + 22, sigX + sigBlockW - 8, finalY + 22);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(30, 41, 59);
        pdf.text(sig.name, sigX + 4, finalY + 26);
      });

      // 5. RUNNING FOOTER DI SETIAP HALAMAN
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);

        pdf.text(
          `GymPro ERP Enterprise • Laporan Resmi Buku Besar Transaksi (General Ledger) • Halaman ${i} dari ${totalPages}`,
          margin,
          pdfHeight - 6
        );

        pdf.text(
          `Dokumen dicetak sah oleh sistem akuntansi • ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          pdfWidth - margin,
          pdfHeight - 6,
          { align: 'right' }
        );
      }

      // 6. SIMPAN FILE PDF
      const dateStr = bukubesarStartDate && bukubesarEndDate
        ? `${bukubesarStartDate}_sd_${bukubesarEndDate}`
        : bukubesarStartDate || bukubesarEndDate || APP_TODAY;
      const picSuffix = bukubesarPicFilters.length > 0
        ? `_PIC_${bukubesarPicFilters.map((p) => p.replace(/\s+/g, '_')).join('-')}`
        : '';
      const catSuffix = bukubesarTypeFilter !== 'ALL' ? `_${bukubesarTypeFilter.replace(/\s+/g, '_')}` : '';
      const fileName = `Laporan_Buku_Besar_RFA_GYM_${dateStr}${catSuffix}${picSuffix}.pdf`;

      pdf.save(fileName);
      showToast(
        'Export PDF Berhasil',
        `File PDF vektor asli ${fileName} (${filteredBukubesarTrx.length} transaksi) berhasil diunduh tanpa screenshot.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to export Buku Besar vector PDF:', err);
      showToast('Gagal Export PDF', 'Terjadi kesalahan saat memproses dokumen PDF vektor.', 'error');
    } finally {
      setIsExportingBukubesarPdf(false);
    }
  };

  const handleOpenVoidModal = (trx: Transaction) => {
    if (trx.status === 'VOID') {
      showToast('Sudah VOID', 'Transaksi ini sudah dalam status VOID.', 'warning');
      return;
    }
    setVoidModalTrx(trx);
    setVoidReasonOption('Salah input kasir');
    setVoidReasonNotes('');
  };

  const handleConfirmVoid = () => {
    if (!voidModalTrx) return;
    const reasonText = voidReasonNotes.trim()
      ? `${voidReasonOption} - ${voidReasonNotes.trim()}`
      : voidReasonOption;

    if (onVoidTransaction) {
      onVoidTransaction(voidModalTrx.id, reasonText);
    } else {
      showToast('Berhasil', `Transaksi #${voidModalTrx.id} dibatalkan.`, 'info');
    }
    setVoidModalTrx(null);
  };

  const handleOpenMethodModal = (trx: Transaction) => {
    if (trx.status === 'VOID') {
      showToast('Peringatan', 'Tidak dapat mengubah metode pada transaksi yang sudah VOID.', 'warning');
      return;
    }
    setMethodModalTrx(trx);
    const validMethods = ['Tunai', 'Transfer', 'QRIS', 'EDC', 'Kasbon'];
    const currentMethod = validMethods.includes(trx.method)
      ? (trx.method as 'Tunai' | 'Transfer' | 'QRIS' | 'EDC' | 'Kasbon')
      : 'Tunai';
    setTargetNewMethod(currentMethod);
    setTargetNewBank(trx.bankDest || 'Mandiri');
    setMethodNotes('');
  };

  const handleConfirmMethodChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodModalTrx) return;

    if (onUpdatePaymentMethod) {
      onUpdatePaymentMethod(
        methodModalTrx.id,
        targetNewMethod,
        targetNewMethod === 'Transfer' || targetNewMethod === 'QRIS' || targetNewMethod === 'EDC'
          ? targetNewBank
          : undefined,
        methodNotes.trim() || undefined
      );
    }
    setMethodModalTrx(null);
  };

  const handleReprint = (trx: Transaction) => {
    if (onReprintReceipt) {
      onReprintReceipt(trx);
    } else {
      window.print();
    }
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPiutang) return;

    const amountToPay = Number(payAmount);
    if (!amountToPay || amountToPay <= 0) {
      showToast('Nominal Salah', 'Masukkan nominal pembayaran cicilan yang valid.', 'warning');
      return;
    }

    if (amountToPay > (selectedPiutang.amountRemaining || 0)) {
      showToast('Nominal Berlebih', `Nominal bayar melebihi sisa piutang (${formatRp(selectedPiutang.amountRemaining || 0)}).`, 'error');
      return;
    }

    // Determine target bank
    const targetBank = selectedPiutang.type === 'POS' ? 'Artha Graha' : 'Mandiri';

    // Create PAY-* transaction
    const payTrx: Transaction = {
      id: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
      date: APP_TODAY,
      time: getTimestamp(),
      type: 'Pelunasan Cicilan',
      desc: `Pelunasan Cicilan: ${selectedPiutang.desc} (${selectedPiutang.customer})`,
      customer: selectedPiutang.customer,
      amount: amountToPay,
      amountPaid: amountToPay,
      amountRemaining: 0,
      dueDate: '-',
      cogs: 0,
      profit: amountToPay,
      method: payMethod,
      status: 'Paid',
      cashier: currentUser?.name || 'Kasir',
      bankDest: targetBank,
      refTrxId: selectedPiutang.id,
      initialCashPaid: amountToPay
    };

    onPayInstallment(payTrx, selectedPiutang.id, amountToPay);
    showToast(
      'Cicilan Diterima',
      `Pembayaran piutang senilai ${formatRp(amountToPay)} berhasil dibukukan tanpa double counting.`,
      'success'
    );
    setSelectedPiutang(null);
    setPayAmount('');
  };

  // Open batch pay modal for given transactions or current selection
  const handleOpenBatchPay = (targetList?: Transaction[]) => {
    let listToPay: Transaction[] = [];
    if (targetList && targetList.length > 0) {
      listToPay = targetList.filter((t) => (t.amountRemaining || 0) > 0 && t.status !== 'VOID');
    } else {
      listToPay = selectedPiutangTransactions;
    }

    if (listToPay.length === 0) {
      showToast('Peringatan', 'Pilih minimal satu tagihan cicilan yang belum lunas.', 'warning');
      return;
    }

    const initAmounts: Record<string, number> = {};
    listToPay.forEach((t) => {
      initAmounts[t.id] = t.amountRemaining || 0;
    });

    setBatchPayTransactions(listToPay);
    setBatchPayAmounts(initAmounts);
    const hasPos = listToPay.some((t) => t.type === 'POS');
    setBatchPayBankDest(hasPos ? 'Artha Graha' : 'Mandiri');
    setBatchPayMethod('Transfer');
    setBatchPayNotes('');
    setIsBatchPayModalOpen(true);
  };

  const handleBatchAmountChange = (trxId: string, val: number) => {
    const maxVal = transactions.find((t) => t.id === trxId)?.amountRemaining || 0;
    const cleanVal = isNaN(val) ? 0 : Math.min(Math.max(val, 0), maxVal);
    setBatchPayAmounts((prev) => ({
      ...prev,
      [trxId]: cleanVal
    }));
  };

  const handleSetAllFullAmount = () => {
    const fullAmounts: Record<string, number> = {};
    batchPayTransactions.forEach((t) => {
      fullAmounts[t.id] = t.amountRemaining || 0;
    });
    setBatchPayAmounts(fullAmounts);
  };

  const handleRemoveFromBatch = (trxId: string) => {
    const updated = batchPayTransactions.filter((t) => t.id !== trxId);
    if (updated.length === 0) {
      setIsBatchPayModalOpen(false);
      return;
    }
    setBatchPayTransactions(updated);
    setBatchPayAmounts((prev) => {
      const copy = { ...prev };
      delete copy[trxId];
      return copy;
    });
  };

  const handleConfirmBatchPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchPayTransactions.length === 0) return;

    const validPayments = batchPayTransactions
      .map((t, idx) => {
        const amt = batchPayAmounts[t.id] !== undefined ? batchPayAmounts[t.id] : (t.amountRemaining || 0);
        return { t, amt, idx };
      })
      .filter((item) => item.amt > 0);

    if (validPayments.length === 0) {
      showToast('Nominal Kosong', 'Total nominal pembayaran harus lebih besar dari Rp 0.', 'warning');
      return;
    }

    for (const item of validPayments) {
      if (item.amt > (item.t.amountRemaining || 0)) {
        showToast('Nominal Berlebih', `Nominal bayar untuk ${item.t.id} melebihi sisa piutang.`, 'error');
        return;
      }
    }

    const payments = validPayments.map(({ t, amt, idx }) => {
      const targetBank = t.type === 'POS' ? 'Artha Graha' : batchPayBankDest;
      const payTrx: Transaction = {
        id: `PAY-${Math.floor(100000 + Math.random() * 900000)}-${idx + 1}`,
        date: APP_TODAY,
        time: getTimestamp(),
        type: 'Pelunasan Cicilan',
        desc: `Pelunasan Cicilan: ${t.desc} (${t.customer})` + (batchPayNotes.trim() ? ` [${batchPayNotes.trim()}]` : ''),
        customer: t.customer,
        amount: amt,
        amountPaid: amt,
        amountRemaining: 0,
        dueDate: '-',
        cogs: 0,
        profit: amt,
        method: batchPayMethod,
        status: 'Paid',
        cashier: currentUser?.name || 'Kasir',
        bankDest: targetBank,
        refTrxId: t.id,
        initialCashPaid: amt
      };
      return { payTrx, originalTrxId: t.id, paidAmount: amt };
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);

    if (onBatchPayInstallment) {
      onBatchPayInstallment(payments);
    } else {
      payments.forEach((p) => {
        onPayInstallment(p.payTrx, p.originalTrxId, p.paidAmount);
      });
    }

    showToast(
      'Pelunasan Berhasil',
      `Sebanyak ${payments.length} tagihan cicilan senilai ${formatRp(totalPaid)} berhasil dibukukan tanpa double counting.`,
      'success'
    );

    const paidIds = new Set(payments.map((p) => p.originalTrxId));
    setSelectedPiutangIds((prev) => prev.filter((id) => !paidIds.has(id)));
    setIsBatchPayModalOpen(false);
    setBatchPayTransactions([]);
    setBatchPayAmounts({});
    setBatchPayNotes('');
  };

  // Handle Execute Daily Closing
  const handleDailyClosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!physicalCashInput) {
      showToast('Input Fisik Uang', 'Harap hitung dan masukkan jumlah fisik uang tunai di laci kasir.', 'warning');
      return;
    }

    const branchIdToTag = isAllBranches ? (branches[0]?.id || 'BR-001') : activeBranchId;
    const branchNameToTag = activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.name || 'GymPro Flagship Kelapa Gading') : activeBranch.name;

    const record: DailyClosingRecord = {
      id: 'DC-' + closingDate + '-' + branchIdToTag,
      branchId: branchIdToTag,
      branchName: branchNameToTag,
      date: closingDate,
      closedAt: getTimestamp(),
      cashierName: currentUser?.name || 'Kasir',
      openingFloat: openingDrawerCash,
      modalAwal: openingDrawerCash,
      revenue: totalOmset,
      trxCount: totalTrxCount,
      tunai: tunaiLaciKasir,
      nonTunai: nonTunaiMasuk,
      cashSales: tunaiLaciKasir,
      mandiriSales: mandiriTotal,
      arthaSales: arthaGrahaTotal,
      bankMandiri: mandiriTotal,
      bankArtha: arthaGrahaTotal,
      pettyExpenses: selectedDatePettyExpenses,
      expectedCash: expectedSystemCash,
      physicalCash: inputCashNumber,
      variance: cashVariance,
      arthaQRIS: arthaGrahaQRIS,
      arthaTF: arthaGrahaTransfer,
      arthaEDC: arthaGrahaEDC,
      mandiriQRIS: mandiriQRIS,
      mandiriTF: mandiriTransfer,
      mandiriEDC: mandiriEDC,
      notes: closingNotes.trim() || 'Tutup buku harian normal.'
    };

    onExecuteDailyClosing(record);
    showToast(
      'Daily Closing Selesai',
      `Tutup buku harian tanggal ${closingDate} telah dikunci dan diverifikasi.`,
      'success'
    );
  };

  // Handle Clean Print of Daily Closing via standard browser window.print()
  const handlePrintReport = () => {
    setIsClosingPrintOpen(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Handle Clean PDF Generation using jsPDF & autoTable (100% Native Vector PDF Document, No Snapshot)
  const handleGeneratePdfReport = () => {
    setIsGeneratingPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 14;
      const printableWidth = pdfWidth - margin * 2; // 182mm

      const gymBrand = 'RFA GYM & FITNESS CENTER';
      const branchTitle = activeBranch?.name
        ? (activeBranchId === ALL_BRANCHES_ID ? 'Konsolidasi Seluruh Cabang' : activeBranch.name)
        : 'GymPro Flagship Kelapa Gading';

      // 1. KOP & HEADER DOKUMEN
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(24, 24, 27);
      pdf.text(gymBrand, margin, 16);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(branchTitle, margin, 21);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(234, 88, 12);
      pdf.text('BERITA ACARA TUTUP BUKU HARIAN (DAILY CLOSING)', margin, 27);

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Rekonsiliasi Kas Operasional Kasir per Tanggal ${formatDateIndo(closingDate)} (${closingDate})`, margin, 31.5);

      // Status dokumen & metadata waktu di kanan atas
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(24, 24, 27);
      pdf.text('DOKUMEN RESMI KEUANGAN', pdfWidth - margin, 16, { align: 'right' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      const printDateStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
      pdf.text(`Waktu Cetak: ${printDateStr}`, pdfWidth - margin, 21, { align: 'right' });
      pdf.text(`Kasir Bertugas: ${currentUser?.name || 'Kasir'}`, pdfWidth - margin, 26, { align: 'right' });

      // Garis aksen pemisah
      pdf.setDrawColor(249, 115, 22);
      pdf.setLineWidth(0.8);
      pdf.line(margin, 34, pdfWidth - margin, 34);

      // 2. TABEL RINGKASAN REKONSILIASI KAS (autoTable)
      const varianceLabel = cashVariance === 0
        ? 'SESUAI (SEIMBANG)'
        : (cashVariance > 0 ? `LEBIH FISIK (+${formatRp(cashVariance)})` : `KURANG FISIK (${formatRp(cashVariance)})`);

      autoTable(pdf, {
        startY: 37,
        head: [['REKAPITULASI OMSET & KAS OPERASIONAL', 'NILAI BUKUKAN / SISTEM']],
        body: [
          ['Total Omset Penerimaan Hari Ini', formatRp(totalOmset)],
          ['Volume Transaksi Operasional', `${totalTrxCount} Transaksi`],
          ['Penerimaan Tunai di Laci Kasir (Cash)', formatRp(tunaiLaciKasir)],
          ['Penerimaan Non-Tunai (Transfer, QRIS, EDC)', formatRp(nonTunaiMasuk)],
          ['Pengeluaran Kas Kecil (Petty Cash Terverifikasi)', formatRp(selectedDatePettyExpenses)],
          ['Ekspektasi Fisik Kas di Laci Kasir (Sistem)', formatRp(expectedSystemCash)],
          ['Hitungan Fisik Uang Aktual di Laci Kasir', formatRp(inputCashNumber)],
          ['Status Selisih Kas Fisik (Variance)', varianceLabel]
        ],
        theme: 'striped',
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 2.2
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 1.8
        },
        columnStyles: {
          0: { cellWidth: 110, fontStyle: 'bold' },
          1: { cellWidth: 72, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === 7) {
            data.cell.styles.fillColor = cashVariance === 0 ? [240, 253, 244] : [254, 242, 242];
            data.cell.styles.textColor = cashVariance === 0 ? [22, 101, 52] : [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // 3. TABEL RINCIAN CHANNEL PEMBAYARAN (EDC / TRANSFER / QRIS)
      let nextY = (pdf as any).lastAutoTable?.finalY + 4 || 95;
      autoTable(pdf, {
        startY: nextY,
        head: [['CHANNEL PEMBAYARAN PERBANKAN', 'QRIS', 'TRANSFER BANK', 'MESIN EDC', 'TOTAL']],
        body: [
          [
            'Bank Mandiri (Rekening Operasional)',
            formatRp(mandiriQRIS),
            formatRp(mandiriTransfer),
            formatRp(mandiriEDC),
            formatRp(mandiriTotal)
          ],
          [
            'Bank Artha Graha (Rekening Kasir)',
            formatRp(arthaGrahaQRIS),
            formatRp(arthaGrahaTransfer),
            formatRp(arthaGrahaEDC),
            formatRp(arthaGrahaTotal)
          ],
          [
            'TOTAL KONSOLIDASI NON-TUNAI',
            formatRp(mandiriQRIS + arthaGrahaQRIS),
            formatRp(mandiriTransfer + arthaGrahaTransfer),
            formatRp(mandiriEDC + arthaGrahaEDC),
            formatRp(nonTunaiMasuk)
          ]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
          cellPadding: 1.6
        },
        columnStyles: {
          0: { cellWidth: 62, fontStyle: 'bold' },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      // 4. TABEL RINCIAN TRANSAKSI HARIAN
      nextY = (pdf as any).lastAutoTable?.finalY + 4 || 135;
      const closingDayTrx = transactions.filter((t) => t.date === closingDate && t.status !== 'VOID');
      const closingTrxRows = closingDayTrx.map((trx, idx) => [
        (idx + 1).toString(),
        trx.id,
        trx.time || '-',
        trx.type || '-',
        trx.desc || '-',
        trx.customer || 'Umum',
        trx.method || '-',
        formatRp(trx.amount || 0)
      ]);

      if (closingTrxRows.length > 0) {
        autoTable(pdf, {
          startY: nextY,
          head: [['No', 'No. Trx', 'Jam', 'Kategori', 'Uraian Transaksi', 'Pelanggan', 'Metode', 'Jumlah']],
          body: closingTrxRows,
          theme: 'grid',
          headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
            cellPadding: 1.8
          },
          bodyStyles: {
            fontSize: 6.8,
            textColor: [30, 41, 59],
            cellPadding: 1.5
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 24 },
            2: { cellWidth: 12 },
            3: { cellWidth: 20 },
            4: { cellWidth: 46 },
            5: { cellWidth: 26 },
            6: { cellWidth: 22 },
            7: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: margin, right: margin, bottom: 15 }
        });
      }

      // 5. TANDA TANGAN PENGESAHAN
      let finalY = (pdf as any).lastAutoTable?.finalY || 160;
      if (finalY + 36 > pdfHeight - 15) {
        pdf.addPage();
        finalY = 22;
      } else {
        finalY += 8;
      }

      const sigBlockW = printableWidth / 3;
      const sigTitles = [
        { role: 'Dibuat Oleh:', label: 'Kasir Bertugas', name: currentUser?.name || 'Kasir Bertugas' },
        { role: 'Diperiksa Oleh:', label: 'Supervisor Keuangan', name: '( .......................................... )' },
        { role: 'Disetujui Oleh:', label: 'Branch / General Manager', name: '( .......................................... )' }
      ];

      sigTitles.forEach((sig, idx) => {
        const sigX = margin + idx * sigBlockW;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(sig.role, sigX + 2, finalY);

        pdf.setFont('helvetica', 'bold');
        pdf.text(sig.label, sigX + 2, finalY + 4);

        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.4);
        pdf.line(sigX + 2, finalY + 22, sigX + sigBlockW - 6, finalY + 22);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(30, 41, 59);
        pdf.text(sig.name, sigX + 2, finalY + 26);
      });

      // 6. RUNNING FOOTER DI SEMUA HALAMAN
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);

        pdf.text(
          `GymPro ERP Enterprise • Berita Acara Daily Closing (${closingDate}) • Halaman ${i} dari ${totalPages}`,
          margin,
          pdfHeight - 6
        );

        pdf.text(
          `Dokumen dicetak sah oleh sistem akuntansi GymPro ERP`,
          pdfWidth - margin,
          pdfHeight - 6,
          { align: 'right' }
        );
      }

      const fileName = `GymPro_Laporan_Daily_Closing_${closingDate}.pdf`;
      pdf.save(fileName);
      showToast('Export PDF Berhasil', `Laporan Daily Closing vektor ${fileName} berhasil diunduh tanpa screenshot.`, 'success');
    } catch (err) {
      console.error('Failed to generate vector PDF report:', err);
      showToast('Gagal Export PDF', 'Terjadi kesalahan saat memproses dokumen PDF vektor.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Export of Daily Closing to CSV
  const handleDownloadCSV = () => {
    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines: string[] = [];

    // Metadata Header
    lines.push('GYMPRO ERP ENTERPRISE - LAPORAN TUTUP BUKU HARIAN KASIR (DAILY CLOSING)');
    lines.push(`Tanggal Operasional,${escapeCsv(closingDate)},${escapeCsv(formatDateIndo(closingDate))}`);
    lines.push(`Kasir Bertugas,${escapeCsv(currentUser?.name || 'Kasir')}`);
    lines.push(`Waktu Export,${escapeCsv(getTimestamp())}`);
    lines.push(`Status Closing,${escapeCsv(isSelectedDateClosed ? 'TERKUNCI' : 'SHIFT BERJALAN')}`);
    lines.push('');

    // Section I: Ringkasan Transaksi Finansial
    lines.push('--- I. RINGKASAN TRANSAKSI FINANSIAL ---');
    lines.push('Metrik,Nominal / Nilai,Keterangan');
    lines.push(`TOTAL OMSET,${totalOmset},Total uang masuk tunai dan non-tunai`);
    lines.push(`TOTAL TRANSAKSI SUKSES,${totalTrxCount},Jumlah transaksi non-void`);
    lines.push(`TUNAI LACI KASIR,${tunaiLaciKasir},Penerimaan fisik tunai ke laci`);
    lines.push(`NON-TUNAI MASUK,${nonTunaiMasuk},Penerimaan perbankan (Bank Artha Graha + Bank Mandiri)`);
    lines.push('');

    // Section II: Breakdown Penerimaan Bank
    lines.push('--- II. RINCIAN PENERIMAAN NON-TUNAI PER BANK ---');
    lines.push('Bank,Metode,Nominal');
    lines.push(`Bank Artha Graha,TOTAL,${arthaGrahaTotal}`);
    lines.push(`Bank Artha Graha,QRIS,${arthaGrahaQRIS}`);
    lines.push(`Bank Artha Graha,Transfer,${arthaGrahaTransfer}`);
    lines.push(`Bank Artha Graha,EDC / Debit,${arthaGrahaEDC}`);
    lines.push(`Bank Mandiri,TOTAL,${mandiriTotal}`);
    lines.push(`Bank Mandiri,QRIS,${mandiriQRIS}`);
    lines.push(`Bank Mandiri,Transfer,${mandiriTransfer}`);
    lines.push(`Bank Mandiri,EDC / Debit,${mandiriEDC}`);
    lines.push('');

    // Section III: Rekonsiliasi Kas Laci
    lines.push('--- III. REKONSILIASI KAS LACI (CASH DRAWER) ---');
    lines.push('Komponen Rekonsiliasi,Nominal,Keterangan');
    lines.push(`Modal Awal Laci,${openingDrawerCash},Saldo float modal laci awal`);
    lines.push(`Total Penerimaan Tunai,${tunaiLaciKasir},Penjualan tunai + DP cash + pelunasan tunai`);
    lines.push(`Pengeluaran Kas Kecil (Petty Cash),${selectedDatePettyExpenses},Pengeluaran operasional hari ini`);
    lines.push(`Kas Fisik Diharapkan Sistem,${expectedSystemCash},Modal Awal + Tunai Masuk - Kas Kecil`);
    if (physicalCashInput) {
      lines.push(`Kas Fisik Aktual di Laci,${inputCashNumber},Hasil hitung fisik kasir`);
      lines.push(`Selisih Kas (Variance),${cashVariance},${cashVariance === 0 ? 'COCOK (0)' : cashVariance > 0 ? 'LEBIH' : 'KURANG'}`);
    }
    if (closingNotes.trim()) {
      lines.push(`Catatan Closing,${escapeCsv(closingNotes.trim())}`);
    }
    lines.push('');

    // Section IV: Detail Transaksi Harian
    lines.push('--- IV. DETAIL TRANSAKSI HARIAN ---');
    lines.push('No Trx,Jam,Pelanggan,Kategori,Deskripsi,Metode,Bank Tujuan,Nominal Masuk,Status');
    targetClosingTrx.forEach((trx) => {
      lines.push(
        [
          escapeCsv(trx.id),
          escapeCsv(trx.time || '-'),
          escapeCsv(trx.customer),
          escapeCsv(trx.type),
          escapeCsv(trx.desc || trx.type),
          escapeCsv(trx.method),
          escapeCsv(trx.bankDest || '-'),
          getTrxInflow(trx),
          escapeCsv(trx.status)
        ].join(',')
      );
    });
    lines.push('');

    // Section V: Detail Kas Kecil
    const targetPettyList = pettyCashList.filter(
      (p) =>
        p.date === closingDate ||
        p.date.includes(closingDate) ||
        (p.created_at && p.created_at.startsWith(closingDate))
    );
    if (targetPettyList.length > 0) {
      lines.push('--- V. DETAIL PENGELUARAN KAS KECIL (PETTY CASH) ---');
      lines.push('ID,Jam,Kategori,Deskripsi,Nominal,PIC');
      targetPettyList.forEach((pc) => {
        const nominal = pc.total_expense !== undefined ? pc.total_expense : pc.amount || 0;
        lines.push(
          [
            escapeCsv(pc.id),
            escapeCsv(pc.time || pc.created_at || '-'),
            escapeCsv(pc.category || '-'),
            escapeCsv(pc.desc || pc.description || '-'),
            nominal,
            escapeCsv(pc.submitted_by_name || pc.pic || pc.submitted_by || '-')
          ].join(',')
        );
      });
    }

    const csvString = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daily_Closing_${closingDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Download CSV Berhasil', `Laporan Daily Closing ${closingDate} telah berhasil diunduh.`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Main Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" /> Modul Keuangan & Akuntansi Enterprise
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
              isAllBranches
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>{isAllBranches ? 'Konsolidasi Seluruh Cabang' : activeBranch?.name}</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Buku Piutang & Cicilan, Buku Besar Arus Kas, Petty Cash, serta Rekonsiliasi Daily Closing
          </p>
        </div>

        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto max-w-full gap-1">
          <button
            onClick={() => setActiveTab('dashboard-keuangan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dashboard-keuangan' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            <span>Dashboard Keuangan</span>
          </button>
          <button
            onClick={() => setActiveTab('laba-rugi')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'laba-rugi' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Laba Perusahaan</span>
          </button>
          <button
            onClick={() => setActiveTab('input-pengeluaran')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'input-pengeluaran' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Pengeluaran</span>
          </button>
          <button
            onClick={() => setActiveTab('riwayat-pengeluaran')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'riwayat-pengeluaran' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Riwayat Pengeluaran</span>
          </button>
          <button
            onClick={() => setActiveTab('kategori-pengeluaran')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'kategori-pengeluaran' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kategori Pengeluaran</span>
          </button>
          <button
            onClick={() => setActiveTab('persetujuan-pengeluaran')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'persetujuan-pengeluaran' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Persetujuan</span>
            {companyExpenses.filter((e) => e.approvalStatus === 'Menunggu Persetujuan').length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-zinc-950 rounded-full text-[10px] font-black">
                {companyExpenses.filter((e) => e.approvalStatus === 'Menunggu Persetujuan').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('laporan-pengeluaran')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'laporan-pengeluaran' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Laporan Pengeluaran</span>
          </button>
          <button
            onClick={() => setActiveTab('piutang')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'piutang' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Buku Piutang & Cicilan
          </button>
          <button
            onClick={() => setActiveTab('bukubesar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'bukubesar' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Buku Besar Transaksi
          </button>
          <button
            onClick={() => setActiveTab('petty')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'petty' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Petty Cash ({pettyCashList.length})
          </button>
          <button
            onClick={() => setActiveTab('closing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'closing' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daily Closing Kasir
          </button>
          <button
            onClick={() => setActiveTab('harian')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'harian' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Laporan Penjualan Harian</span>
          </button>
          <button
            onClick={() => setActiveTab('bulanan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'bulanan' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Laporan Penjualan Bulanan</span>
          </button>
        </div>
      </div>

      {/* 7-Day Revenue Trends Chart: Total Payments vs New Installment Income (Disembunyikan pada Petty Cash dan Daily Closing) */}
      {(activeTab === 'piutang' || activeTab === 'bukubesar') && (
        <FinanceRevenueChart transactions={transactions} />
      )}

      {/* 0.01 DASHBOARD KEUANGAN */}
      {activeTab === 'dashboard-keuangan' && (
        <FinancialDashboardView
          expenses={companyExpenses}
          transactions={transactions}
          closingRecords={closingRecords}
          branches={branches}
          activeBranchId={activeBranchId}
          currentUser={currentUser}
          onNavigateTab={(tab) => setActiveTab(tab as FinanceTab)}
          showToast={handleToast}
        />
      )}

      {/* 0.02 LABA PERUSAHAAN (P&L) */}
      {activeTab === 'laba-rugi' && (
        <ProfitAndLossView
          expenses={companyExpenses}
          transactions={transactions}
          branches={branches}
          activeBranchId={activeBranchId}
          currentUser={currentUser}
          showToast={handleToast}
        />
      )}

      {/* 0.03 INPUT PENGELUARAN */}
      {activeTab === 'input-pengeluaran' && (
        <ExpenseInputForm
          categories={expenseCategories}
          branches={branches}
          currentUser={currentUser}
          activeBranchId={activeBranchId}
          onSaveExpense={(exp, autoCap) => {
            if (onSaveExpense) onSaveExpense(exp, autoCap);
            setActiveTab('riwayat-pengeluaran');
          }}
          onCancel={() => setActiveTab('riwayat-pengeluaran')}
          showToast={handleToast}
        />
      )}

      {/* 0.04 RIWAYAT PENGELUARAN */}
      {activeTab === 'riwayat-pengeluaran' && (
        <ExpenseHistoryTable
          expenses={companyExpenses}
          categories={expenseCategories}
          branches={branches}
          currentUser={currentUser}
          activeBranchId={activeBranchId}
          onSavePayment={(id, amt, acc, meth, ref, notes) => {
            if (onSaveExpensePayment) onSaveExpensePayment(id, amt, acc, meth, ref, notes);
          }}
          onApproveExpense={(exp) => {
            if (onApproveExpense) onApproveExpense(exp);
          }}
          onRejectExpense={(exp) => {
            if (onRejectExpense) onRejectExpense(exp, 'Ditolak via tabel riwayat');
          }}
          onCancelExpense={(id, reason) => {
            if (onCancelExpense) onCancelExpense(id, reason);
          }}
          onNavigateToInput={() => setActiveTab('input-pengeluaran')}
          showToast={handleToast}
        />
      )}

      {/* 0.05 KATEGORI PENGELUARAN */}
      {activeTab === 'kategori-pengeluaran' && (
        <ExpenseCategoryManager
          categories={expenseCategories}
          currentUser={currentUser}
          onSaveCategory={(cat, isNew) => {
            if (onSaveExpenseCategory) onSaveExpenseCategory(cat, isNew);
          }}
          onToggleCategoryStatus={(id) => {
            if (onToggleExpenseCategoryStatus) onToggleExpenseCategoryStatus(id);
          }}
          showToast={handleToast}
        />
      )}

      {/* 0.06 PERSETUJUAN PENGELUARAN */}
      {activeTab === 'persetujuan-pengeluaran' && (
        <ExpenseApprovalView
          expenses={companyExpenses}
          currentUser={currentUser}
          policy={expensePolicy}
          onUpdatePolicy={(pol) => {
            if (onUpdateExpensePolicy) onUpdateExpensePolicy(pol);
          }}
          onApproveExpense={(exp) => {
            if (onApproveExpense) onApproveExpense(exp);
          }}
          onRejectExpense={(exp, reason) => {
            if (onRejectExpense) onRejectExpense(exp, reason);
          }}
          showToast={handleToast}
        />
      )}

      {/* 0.07 LAPORAN PENGELUARAN */}
      {activeTab === 'laporan-pengeluaran' && (
        <ExpenseReportView
          expenses={companyExpenses}
          categories={expenseCategories}
          branches={branches}
          activeBranchId={activeBranchId}
          currentUser={currentUser}
          showToast={handleToast}
        />
      )}

      {/* 0.0 LAPORAN PENJUALAN HARIAN */}
      {activeTab === 'harian' && (
        <DailySalesReportView
          transactions={transactions}
          currentUser={currentUser}
          onReprintReceipt={handleReprint}
          showToast={showToast}
        />
      )}

      {/* 0. LAPORAN PENJUALAN BULANAN (RECHARTS BAR CHART & ANALYTICS) */}
      {activeTab === 'bulanan' && (
        <MonthlySalesReportView
          transactions={transactions}
          onReprintReceipt={handleReprint}
          showToast={showToast}
        />
      )}

      {/* 1. BUKU PIUTANG & CICILAN */}
      {activeTab === 'piutang' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Total Piutang Aktif</span>
              <h3 className="text-2xl font-black text-amber-400 mt-2">{formatRp(totalPiutangAktif)}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Sisa tagihan cicilan & kasbon berjalan</p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Piutang Jatuh Tempo</span>
              <h3 className="text-2xl font-black text-rose-400 mt-2">{formatRp(totalPiutangOverdue)}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Melebihi batas tempo 40 hari</p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Piutang Terbayar</span>
              <h3 className="text-2xl font-black text-emerald-400 mt-2">{formatRp(totalPiutangTerbayar)}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Total pelunasan cicilan yang telah masuk</p>
            </div>
          </div>

          {/* Table Container with Name & Date Filters */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-zinc-800 space-y-3.5 bg-zinc-950/50">
              {/* Controls Row: Name Search, Status, & Date Filters */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                {/* Left: Search by Name & Filter Status */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search by Name */}
                  <div className="relative min-w-[240px] max-w-xs flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={piutangSearchName}
                      onChange={(e) => setPiutangSearchName(e.target.value)}
                      placeholder="Cari nama member / peminjam..."
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-8 pr-7 py-2 text-xs text-zinc-200 outline-none focus:border-orange-500 transition placeholder:text-zinc-500"
                    />
                    {piutangSearchName && (
                      <button
                        type="button"
                        onClick={() => setPiutangSearchName('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                        title="Hapus filter nama"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-400">Status:</span>
                    <select
                      value={piutangStatusFilter}
                      onChange={(e) => setPiutangStatusFilter(e.target.value as any)}
                      className="bg-zinc-900 border border-zinc-700/80 text-xs font-semibold rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                    >
                      <option value="all">Semua Tagihan</option>
                      <option value="BELUM LUNAS">Belum Lunas (Aktif)</option>
                      <option value="OVERDUE">Jatuh Tempo (Overdue)</option>
                      <option value="LUNAS">Sudah Lunas</option>
                    </select>
                  </div>
                </div>

                {/* Right: Date Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/90 border border-zinc-800/90 p-1.5 rounded-2xl shadow-inner">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 px-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span className="hidden sm:inline">Filter Tanggal:</span>
                    </div>

                    {/* Preset Buttons */}
                    <div className="flex items-center gap-1">
                      {[
                        { label: 'Semua', val: 'ALL' },
                        { label: 'Hari Ini', val: 'TODAY' },
                        { label: '7 Hari', val: '7DAYS' },
                        { label: 'Bulan Ini', val: 'MONTH' }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => handleSetPiutangDatePreset(p.val as any)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                            piutangDatePreset === p.val
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="h-4 w-px bg-zinc-800 mx-0.5" />

                    {/* Date Pickers */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={piutangStartDate}
                        onChange={(e) => handlePiutangStartDateChange(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-2 py-1 text-[11px] text-zinc-200 outline-none focus:border-orange-500 transition"
                        title="Tanggal Mulai Transaksi"
                      />
                      <span className="text-[10px] text-zinc-500 font-semibold">s/d</span>
                      <input
                        type="date"
                        value={piutangEndDate}
                        onChange={(e) => handlePiutangEndDateChange(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-2 py-1 text-[11px] text-zinc-200 outline-none focus:border-orange-500 transition"
                        title="Tanggal Akhir Transaksi"
                      />
                      {(piutangStartDate || piutangEndDate) && (
                        <button
                          type="button"
                          onClick={() => handleSetPiutangDatePreset('ALL')}
                          className="p-1 text-zinc-400 hover:text-rose-400 transition"
                          title="Hapus Filter Tanggal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filter Indicators & Total Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-400">
                    Menampilkan <strong className="text-white">{filteredPiutangList.length}</strong> dari {piutangTransactions.length} transaksi
                  </span>
                  {piutangSearchName && (
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      Nama: "{piutangSearchName}"
                    </span>
                  )}
                  {(piutangStartDate || piutangEndDate) && (
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Periode: {piutangStartDate ? formatDateIndo(piutangStartDate) : 'Awal'} s/d {piutangEndDate ? formatDateIndo(piutangEndDate) : 'Hari ini'}
                    </span>
                  )}
                  {piutangStatusFilter !== 'all' && (
                    <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-lg font-medium">
                      Status: {piutangStatusFilter}
                    </span>
                  )}
                </div>

                {(piutangSearchName || piutangStartDate || piutangEndDate || piutangStatusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={handleResetPiutangFilters}
                    className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 text-[11px] transition"
                  >
                    <X className="w-3.5 h-3.5" /> Reset Semua Filter
                  </button>
                )}
              </div>

              {/* Smart Bulk Actions Banner when searching a name */}
              {piutangSearchName.trim() && (
                <div className="mt-3 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-zinc-900 border border-orange-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30 shadow-inner">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          Pencarian Member / Peminjam: <span className="text-orange-400 font-black">"{piutangSearchName}"</span>
                        </span>
                        {eligibleUnpaidInFilter.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            {eligibleUnpaidInFilter.length} Tagihan Tertunggak ({formatRp(eligibleUnpaidInFilter.reduce((s, b) => s + (b.amountRemaining || 0), 0))})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Semua Tagihan Sudah Lunas
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {eligibleUnpaidInFilter.length > 0
                          ? 'Anda dapat mencentang tagihan yang ingin dibayar, atau klik Bayar Semua untuk melunasi sekaligus.'
                          : 'Tidak ada tagihan tertunggak yang perlu dilunasi untuk nama ini.'}
                      </p>
                    </div>
                  </div>

                  {eligibleUnpaidInFilter.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectForList(eligibleUnpaidInFilter)}
                        className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-zinc-700/60"
                      >
                        {eligibleUnpaidInFilter.every((b) => selectedPiutangIds.includes(b.id)) ? (
                          <>
                            <Square className="w-3.5 h-3.5 text-zinc-400" />
                            Batal Pilih ({eligibleUnpaidInFilter.length})
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-orange-400" />
                            Pilih Semua ({eligibleUnpaidInFilter.length})
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenBatchPay(eligibleUnpaidInFilter)}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition"
                      >
                        <DollarSign className="w-4 h-4" />
                        Bayar Semua ({eligibleUnpaidInFilter.length})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Floating / Sticky Bar when Any Tagihan is Selected */}
              {selectedPiutangIds.length > 0 && (
                <div className="mt-3 bg-zinc-900/95 backdrop-blur-md border border-orange-500/40 rounded-2xl p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 font-black text-xs">
                      {selectedPiutangIds.length}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Tagihan Terpilih untuk Pembayaran</span>
                        <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-300 font-mono rounded-md font-bold border border-orange-500/30">
                          Total Sisa: {formatRp(selectedTotalSisa)}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Pilih satu per satu dengan checkbox atau lunasi sekaligus dalam satu transaksi kasir.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="flex-1 sm:flex-initial px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition"
                    >
                      Batal Pilihan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBatchPay()}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <ListChecks className="w-4 h-4" />
                      Bayar Terpilih ({selectedPiutangIds.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <table className="w-full text-left whitespace-nowrap min-w-[950px]">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={isAllEligibleSelected}
                        onChange={handleToggleSelectAllEligible}
                        disabled={eligibleUnpaidInFilter.length === 0}
                        title={isAllEligibleSelected ? 'Batalkan pilihan semua' : 'Pilih semua tagihan belum lunas'}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-950 cursor-pointer disabled:opacity-30"
                      />
                    </th>
                    <th className="py-3 px-4">No TRX / Tanggal</th>
                    <th className="py-3 px-4">Nama Peminjam / Member</th>
                    <th className="py-3 px-4">Deskripsi / Jenis</th>
                    <th className="py-3 px-4 text-right">Total Kontrak</th>
                    <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                    <th className="py-3 px-4 text-right">Sisa Piutang</th>
                    <th className="py-3 px-4 text-center">Jatuh Tempo</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                  {filteredPiutangList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-zinc-500">
                        Tidak ada catatan piutang pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredPiutangList.map((t) => {
                      const isOverdue =
                        t.dueDate &&
                        t.dueDate !== '-' &&
                        new Date(t.dueDate + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');
                      const isLunas = (t.amountRemaining || 0) <= 0;

                      return (
                        <tr
                          key={t.id}
                          className={`hover:bg-zinc-800/30 transition ${
                            selectedPiutangIds.includes(t.id) ? 'bg-orange-500/5' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center">
                            {!isLunas ? (
                              <input
                                type="checkbox"
                                checked={selectedPiutangIds.includes(t.id)}
                                onChange={() => handleToggleSelectPiutang(t.id)}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-950 cursor-pointer"
                              />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-zinc-600 mx-auto" />
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            {t.id}
                            <span className="block font-sans font-normal text-[10px] text-zinc-500">{t.date}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-zinc-200">{t.billName || t.customer}</td>
                          <td className="py-3.5 px-4 text-zinc-400 text-xs max-w-xs truncate">{t.desc}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-white">{formatRp(t.amount)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                            {formatRp(t.amountPaid || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-orange-400">
                            {formatRp(t.amountRemaining || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isOverdue && !isLunas
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {t.dueDate || '-'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                isLunas
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : isOverdue
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {isLunas ? 'LUNAS' : isOverdue ? 'JATUH TEMPO' : t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isLunas && (
                                <button
                                  onClick={() => handleOpenPayModal(t)}
                                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition"
                                >
                                  Bayar Cicilan
                                </button>
                              )}
                              <TransactionActions
                                transaction={t}
                                onView={(trx) => handleReprint(trx)}
                                onPrint={(trx) => handleReprint(trx)}
                                onDownloadPDF={(trx) => handleReprint(trx)}
                                size="sm"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredPiutangList.length > 0 && (
                  <tfoot className="bg-zinc-950 border-t-2 border-zinc-800 text-xs font-bold text-zinc-300">
                    <tr>
                      <td colSpan={4} className="py-3.5 px-4 text-right font-bold text-zinc-400">
                        Total Tersaring ({filteredPiutangList.length} Data):
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white">
                        {formatRp(filteredTotalKontrak)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        {formatRp(filteredTotalTerbayar)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-orange-400 text-sm">
                        {formatRp(filteredTotalSisa)}
                      </td>
                      <td colSpan={3} className="py-3.5 px-4 text-center text-zinc-500 text-[11px] font-normal">
                        Sisa Piutang Berjalan
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. BUKU BESAR TRANSAKSI (GENERAL LEDGER) */}
      {activeTab === 'bukubesar' && (
        <div className="space-y-4">
          <div className="space-y-4 print:hidden no-print">
            {/* Controls Bar: Search, Category Filters, Date Filter & Print */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-3.5">
            {/* Top Row: Total Buku Besar Info + Date Filter Controls + Print */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-3.5 border-b border-zinc-800/80">
              {/* Left: Total Buku Besar Stats */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center shrink-0 shadow-inner">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-zinc-400">Total Buku Besar:</span>
                    <span className="text-sm font-black text-white">{transactions.length} Records</span>
                    {filteredBukubesarTrx.length !== transactions.length && (
                      <span className="text-xs font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-lg">
                        Tersaring: {filteredBukubesarTrx.length} Trx
                      </span>
                    )}
                    {bukubesarPicFilters.length > 0 && (
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1.5 flex-wrap">
                        <UserCheck className="w-3 h-3 shrink-0" />
                        <span>PIC ({bukubesarPicFilters.length}): {bukubesarPicFilters.join(', ')}</span>
                        <button
                          type="button"
                          onClick={handleClearPicFilters}
                          className="hover:text-rose-300 ml-0.5 p-0.5 transition"
                          title="Hapus Semua Filter PIC"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 flex-wrap">
                    <span>Kas Masuk (Debit):</span>
                    <span className="font-bold text-emerald-400">{formatRp(totalDebitFiltered)}</span>
                    {(bukubesarStartDate || bukubesarEndDate) && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-orange-300 font-semibold flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.2 rounded">
                          <Calendar className="w-3 h-3 text-orange-400" />
                          <span>
                            {bukubesarStartDate ? formatDateIndo(bukubesarStartDate) : 'Awal'} s/d {bukubesarEndDate ? formatDateIndo(bukubesarEndDate) : 'Hari ini'}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Date Filter Inputs & Presets + Export Suite */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Date Filter Box */}
                <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950/90 border border-zinc-800/90 p-1.5 rounded-2xl shadow-inner">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 px-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span className="hidden sm:inline">Filter Tanggal:</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Semua', val: 'ALL' },
                      { label: 'Hari Ini', val: 'TODAY' },
                      { label: '7 Hari', val: '7DAYS' },
                      { label: 'Bulan Ini', val: 'MONTH' }
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => handleSetBukubesarDatePreset(p.val as any)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                          bukubesarDatePreset === p.val
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="h-4 w-px bg-zinc-800 mx-0.5" />

                  {/* Date Pickers */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={bukubesarStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2 py-1 text-[11px] text-zinc-200 outline-none focus:border-orange-500 transition"
                      title="Tanggal Mulai"
                    />
                    <span className="text-[10px] text-zinc-500 font-semibold">s/d</span>
                    <input
                      type="date"
                      value={bukubesarEndDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2 py-1 text-[11px] text-zinc-200 outline-none focus:border-orange-500 transition"
                      title="Tanggal Akhir"
                    />
                    {(bukubesarStartDate || bukubesarEndDate) && (
                      <button
                        type="button"
                        onClick={() => handleSetBukubesarDatePreset('ALL')}
                        className="p-1 text-zinc-400 hover:text-rose-400 transition"
                        title="Hapus Filter Tanggal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Export & Print Suite */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Export Excel Button */}
                  <button
                    type="button"
                    onClick={handleExportBukubesarExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                    title="Export Laporan Buku Besar ke Microsoft Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                    <span className="hidden sm:inline">Export</span> Excel
                  </button>

                  {/* Export PDF Button */}
                  <button
                    type="button"
                    onClick={handleExportBukubesarPdf}
                    disabled={isExportingBukubesarPdf}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                    title="Export Laporan Buku Besar ke Adobe PDF (.pdf)"
                  >
                    {isExportingBukubesarPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Rendering...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5 text-white" />
                        <span className="hidden sm:inline">Export</span> PDF
                      </>
                    )}
                  </button>

                  {/* Cetak / Preview Button */}
                  <button
                    type="button"
                    onClick={() => setIsBukuBesarPrintModalOpen(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700/60 shrink-0 shadow-sm active:scale-95"
                    title="Buka Preview & Cetak Laporan Resmi Buku Besar"
                  >
                    <Printer className="w-3.5 h-3.5 text-orange-400" />
                    <span>Cetak Laporan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter and Search Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-800/80">
              {/* Category Pills & Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'Semua', val: 'ALL' },
                  { label: 'POS Cafe', val: 'POS' },
                  { label: 'Membership', val: 'Membership' },
                  { label: 'Personal Trainer', val: 'PT' },
                  { label: 'Pelunasan Cicilan', val: 'Pelunasan Cicilan' },
                  { label: 'Transaksi VOID', val: 'VOID' }
                ].map((f) => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setBukubesarTypeFilter(f.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      bukubesarTypeFilter === f.val
                        ? f.val === 'VOID'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-orange-500 text-white shadow-sm'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                {/* PIC / Kasir Multi-Select Filter with Popover & Tags */}
                <div className="relative" ref={picDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsPicDropdownOpen(!isPicDropdownOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs ${
                      bukubesarPicFilters.length > 0
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                        : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    }`}
                    title="Pilih satu atau beberapa PIC (contoh: Ella, Puri)"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {bukubesarPicFilters.length === 0
                        ? `Pilih PIC (${uniqueBukuBesarPics.length})`
                        : `${bukubesarPicFilters.length} PIC Dipilih`}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isPicDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Multi-Select PIC Dropdown Panel */}
                  {isPicDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-72 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2.5">
                      {/* Search box inside dropdown */}
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          value={picSearchQuery}
                          onChange={(e) => setPicSearchQuery(e.target.value)}
                          placeholder="Cari PIC (contoh: Ella, Puri)..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-7 pr-6 py-1.5 text-xs text-white outline-none focus:border-cyan-500 transition"
                          autoFocus
                        />
                        {picSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPicSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Select All / Clear All action links */}
                      <div className="flex items-center justify-between text-[11px] pb-1 border-b border-zinc-800">
                        <button
                          type="button"
                          onClick={() => handleSelectAllPics(uniqueBukuBesarPics.map((p) => p.name))}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          Pilih Semua ({uniqueBukuBesarPics.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleClearPicFilters}
                          className="text-rose-400 hover:text-rose-300 font-semibold"
                        >
                          Hapus Pilihan
                        </button>
                      </div>

                      {/* Scrollable list of PIC checkboxes */}
                      <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                        {uniqueBukuBesarPics
                          .filter((p) => p.name.toLowerCase().includes(picSearchQuery.toLowerCase()))
                          .map((pic) => {
                            const isSelected = bukubesarPicFilters.includes(pic.name);
                            return (
                              <button
                                key={pic.id}
                                type="button"
                                onClick={() => togglePicFilter(pic.name)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                                  isSelected
                                    ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30'
                                    : 'text-zinc-300 hover:bg-zinc-800/80 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                                  )}
                                  <span className="font-semibold truncate">{pic.name}</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded ml-2 shrink-0">
                                  {pic.count} trx
                                </span>
                              </button>
                            );
                          })}
                        {uniqueBukuBesarPics.filter((p) => p.name.toLowerCase().includes(picSearchQuery.toLowerCase())).length === 0 && (
                          <p className="text-zinc-500 text-center py-3 text-[11px]">
                            Tidak ada PIC cocok dengan "{picSearchQuery}"
                          </p>
                        )}
                      </div>

                      {/* Bottom close button */}
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400">
                          {bukubesarPicFilters.length} dari {uniqueBukuBesarPics.length} dipilih
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsPicDropdownOpen(false)}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isSuperAdmin ? (
                  branches.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 ml-0.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-bold text-zinc-400">Cabang:</span>
                      <select
                        value={bukuBesarBranchFilter}
                        onChange={(e) => setBukuBesarBranchFilter(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-amber-300 outline-none"
                      >
                        <option value="ALL" className="bg-zinc-900 text-white">Semua Cabang ({branches.length})</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5 bg-teal-950/60 border border-teal-500/30 rounded-xl px-2.5 py-1 ml-0.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Unit:</span>
                    <span className="text-xs font-extrabold text-white">{branches.find((b) => b.id === userBranchId)?.name || activeBranch.name}</span>
                    <span className="text-[9px] text-teal-400 font-mono font-bold bg-teal-500/20 px-1 rounded">Lokal</span>
                  </div>
                )}

                {/* Filter Metode Pembayaran */}
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-400">Metode:</span>
                  <select
                    value={bukubesarPaymentMethodFilter}
                    onChange={(e) => setBukubesarPaymentMethodFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-sky-300 outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-zinc-900 text-white">Semua Metode</option>
                    <option value="Tunai" className="bg-zinc-900 text-white">Tunai (Cash)</option>
                    <option value="QRIS" className="bg-zinc-900 text-white">QRIS</option>
                    <option value="Transfer" className="bg-zinc-900 text-white">Transfer Bank</option>
                    <option value="EDC" className="bg-zinc-900 text-white">EDC / Kartu Debit</option>
                    <option value="Kartu" className="bg-zinc-900 text-white">Kartu Kredit</option>
                    <option value="Kasbon" className="bg-zinc-900 text-white">Kasbon / Cicilan</option>
                  </select>
                </div>

                {/* Filter Status Transaksi */}
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-zinc-400">Status:</span>
                  <select
                    value={bukubesarStatusFilter}
                    onChange={(e) => setBukubesarStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-emerald-300 outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-zinc-900 text-white">Semua Status</option>
                    <option value="Lunas" className="bg-zinc-900 text-white">Lunas</option>
                    <option value="DP 50%" className="bg-zinc-900 text-white">DP 50%</option>
                    <option value="VOID" className="bg-zinc-900 text-white">VOID</option>
                  </select>
                </div>

                {/* Tombol Sinkron ke Daily Closing */}
                <button
                  type="button"
                  onClick={() => handleJumpToDailyClosing(bukubesarStartDate || APP_TODAY)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-amber-300 border border-zinc-800 hover:border-amber-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
                  title="Buka Daily Closing Kasir untuk tanggal ini"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Daily Closing</span>
                  <span>{bukubesarStartDate ? formatDateIndo(bukubesarStartDate) : 'Hari Ini'}</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative min-w-[240px] max-w-sm flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={bukubesarSearch}
                  onChange={(e) => setBukubesarSearch(e.target.value)}
                  placeholder="Cari ID, member, uraian, PIC..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-200 outline-none focus:border-orange-500 transition"
                />
                {bukubesarSearch && (
                  <button
                    onClick={() => setBukubesarSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Active PIC Tags row */}
            {bukubesarPicFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PIC Terpilih ({bukubesarPicFilters.length}):</span>
                </span>
                {bukubesarPicFilters.map((picName) => (
                  <span
                    key={picName}
                    className="inline-flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-bold px-2.5 py-1 rounded-xl shadow-xs"
                  >
                    <span>{picName}</span>
                    <button
                      type="button"
                      onClick={() => togglePicFilter(picName)}
                      className="text-cyan-400 hover:text-rose-400 hover:bg-cyan-900/50 p-0.5 rounded transition"
                      title={`Hapus tag ${picName}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleClearPicFilters}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 transition"
                  title="Hapus semua pilihan PIC"
                >
                  Reset Semua
                </button>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <table className="w-full text-left whitespace-nowrap min-w-[950px]">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Waktu / ID</th>
                    <th className="py-3 px-4">Cabang</th>
                    <th className="py-3 px-4">Kategori / Tipe</th>
                    <th className="py-3 px-4">Uraian Transaksi</th>
                    <th className="py-3 px-4">Pelanggan / Member</th>
                    <th className="py-3 px-4">PIC / Kasir</th>
                    <th className="py-3 px-4">Metode / Rekening</th>
                    <th className="py-3 px-4 text-right">Debit (Kas Masuk)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                  {filteredBukubesarTrx.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-zinc-500">
                        <AlertCircle className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                        <p className="font-bold text-zinc-400">Tidak ada transaksi yang cocok</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">Coba sesuaikan kata kunci pencarian, filter kategori, atau filter PIC Anda</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBukubesarTrx.map((trx) => {
                      const isVoid = trx.status === 'VOID';
                      return (
                        <tr
                          key={trx.id}
                          className={`transition ${
                            isVoid
                              ? 'bg-rose-950/15 text-zinc-500 hover:bg-rose-950/25'
                              : 'hover:bg-zinc-800/30'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono">
                            <span className={`font-bold block ${isVoid ? 'line-through text-zinc-500' : 'text-white'}`}>
                              {trx.id}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {trx.date} {trx.time}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-zinc-900 text-xs font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                              <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate max-w-[110px]">{trx.branchName || 'Cabang Utama'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isVoid
                                  ? 'bg-zinc-800 text-zinc-500 line-through'
                                  : trx.type === 'Membership'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : trx.type === 'PT'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : trx.type === 'POS'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {trx.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate">
                            <span className={isVoid ? 'line-through text-zinc-500' : 'text-zinc-300'}>
                              {trx.desc}
                            </span>
                          </td>
                          <td className={`py-3 px-4 font-medium ${isVoid ? 'text-zinc-500' : 'text-white'}`}>
                            {trx.customer}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-cyan-300 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="truncate max-w-[130px]">
                                  {trx.picNames || trx.picId || trx.cashier || '-'}
                                </span>
                              </span>
                              {trx.cashier && (trx.picNames || trx.picId) && trx.cashier !== (trx.picNames || trx.picId) && (
                                <span className="text-[10px] text-zinc-500 truncate max-w-[130px]">
                                  Kasir: {trx.cashier}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${isVoid ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                              {trx.method}
                            </span>
                            {trx.bankDest && (
                              <span className="text-[10px] text-zinc-500 block">Bank {trx.bankDest}</span>
                            )}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-black ${
                              isVoid ? 'line-through text-zinc-500' : 'text-emerald-400'
                            }`}
                          >
                            {formatRp(trx.amountPaid || trx.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                isVoid
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : trx.status === 'Paid'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : trx.status === 'DP 50%'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {trx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1. Tombol Detail, Cetak, PDF */}
                              <TransactionActions
                                transaction={trx}
                                onView={(t) => handleReprint(t)}
                                onPrint={(t) => handleReprint(t)}
                                onDownloadPDF={(t) => handleReprint(t)}
                                size="sm"
                              />

                              {/* 2. Tombol Koreksi Salah Metode */}
                              <button
                                onClick={() => handleOpenMethodModal(trx)}
                                disabled={isVoid}
                                title={isVoid ? 'Tidak dapat mengubah metode transaksi VOID' : 'Koreksi Salah Metode Pembayaran (Tunai/Transfer/QRIS/EDC/Kasbon)'}
                                className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[11px] ${
                                  isVoid
                                    ? 'opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
                                    : 'bg-zinc-800 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 border-zinc-700/60'
                                }`}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline font-bold">Metode</span>
                              </button>

                              {/* 3. Tombol VOID */}
                              <button
                                onClick={() => handleOpenVoidModal(trx)}
                                disabled={isVoid}
                                title={isVoid ? 'Transaksi sudah dibatalkan' : 'Batalkan Transaksi (VOID)'}
                                className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[11px] ${
                                  isVoid
                                    ? 'opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
                                    : 'bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border-zinc-700/60'
                                }`}
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline font-bold">Void</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredBukubesarTrx.length > 0 && (
                  <tfoot className="bg-zinc-950 border-t-2 border-zinc-800 text-xs font-bold text-zinc-300">
                    <tr>
                      <td colSpan={6} className="py-3.5 px-4 text-right">
                        Total Kas Masuk (Debit Tersaring):
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400 text-sm">
                        {formatRp(totalDebitFiltered)}
                      </td>
                      <td colSpan={3} className="py-3.5 px-4 text-center text-zinc-400 font-normal text-[11px]">
                        {filteredBukubesarTrx.filter((t) => t.status !== 'VOID').length} Trx Berhasil
                        {filteredBukubesarTrx.filter((t) => t.status === 'VOID').length > 0 && (
                          <span className="text-rose-400 font-semibold ml-1.5">
                            ({filteredBukubesarTrx.filter((t) => t.status === 'VOID').length} VOID)
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

          {/* PRINT & PDF PREVIEW MODAL: BUKU BESAR TRANSAKSI */}
          {isBukuBesarPrintModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:static print:inset-auto print:z-auto print:p-0 print:m-0 print:bg-white print:overflow-visible">
              <div
                ref={bukubesarPrintRef}
                id="printable-bukubesar-content"
                className="bg-white text-zinc-900 border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-5xl p-6 my-auto max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:max-w-full print:p-0 print:m-0"
                style={{ backgroundColor: '#ffffff', color: '#18181b' }}
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-200 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm print:bg-black">
                      GP
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                        {activeBranch?.name ? activeBranch.name.toUpperCase() : 'GYMPRO ERP ENTERPRISE'}
                      </h2>
                      <p className="text-xs font-semibold text-zinc-500">
                        LAPORAN BUKU BESAR TRANSAKSI (GENERAL CASH LEDGER)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBukuBesarPrintModalOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 print:hidden cursor-pointer transition"
                    title="Tutup Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter & Metadata Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl text-xs mb-4">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Periode:</span>
                    <span className="font-bold text-zinc-900">
                      {bukubesarStartDate && bukubesarEndDate
                        ? `${formatDateIndo(bukubesarStartDate)} s/d ${formatDateIndo(bukubesarEndDate)}`
                        : bukubesarStartDate
                        ? `Dari ${formatDateIndo(bukubesarStartDate)}`
                        : bukubesarEndDate
                        ? `Sampai ${formatDateIndo(bukubesarEndDate)}`
                        : 'Semua Periode (Seluruh Waktu)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Cabang:</span>
                    <span className="font-bold text-zinc-900">
                      {bukuBesarBranchFilter === 'ALL'
                        ? 'Semua Cabang'
                        : branches.find((b) => b.id === bukuBesarBranchFilter)?.name || bukuBesarBranchFilter}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Filter PIC / Kasir:</span>
                    <span className="font-bold text-cyan-700">
                      {bukubesarPicFilters.length > 0 ? bukubesarPicFilters.join(', ') : 'Semua PIC & Kasir'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Filter Kategori:</span>
                    <span className="font-bold text-zinc-900">
                      {bukubesarTypeFilter === 'ALL' ? 'Semua Kategori' : bukubesarTypeFilter}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Total Transaksi:</span>
                    <span className="font-bold text-zinc-900">
                      {filteredBukubesarTrx.length} Transaksi ({filteredBukubesarTrx.filter((t) => t.status !== 'VOID').length} Sukses, {filteredBukubesarTrx.filter((t) => t.status === 'VOID').length} VOID)
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Waktu Cetak:</span>
                    <span className="font-bold text-zinc-900">{getTimestamp()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Dicetak Oleh:</span>
                    <span className="font-bold text-zinc-900">{currentUser?.name || 'Administrator Keuangan'}</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Kas Masuk (Debit)</span>
                    <span className="text-sm font-black text-emerald-800">{formatRp(totalDebitFiltered)}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase block">Total Nilai Tagihan</span>
                    <span className="text-sm font-black text-zinc-800">
                      {formatRp(filteredBukubesarTrx.filter((t) => t.status !== 'VOID').reduce((s, t) => s + (t.amount || 0), 0))}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Sisa Piutang Berjalan</span>
                    <span className="text-sm font-black text-amber-800">
                      {formatRp(filteredBukubesarTrx.filter((t) => t.status !== 'VOID').reduce((s, t) => s + (t.amountRemaining || 0), 0))}
                    </span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">Transaksi VOID</span>
                    <span className="text-sm font-black text-rose-800">
                      {filteredBukubesarTrx.filter((t) => t.status === 'VOID').length} Trx
                    </span>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden mb-5">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-100 text-zinc-700 border-b border-zinc-200 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-8">No</th>
                        <th className="py-2 px-2.5">Waktu / ID</th>
                        <th className="py-2 px-2.5">Cabang</th>
                        <th className="py-2 px-2.5">Kategori</th>
                        <th className="py-2 px-2.5">Uraian Transaksi</th>
                        <th className="py-2 px-2.5">Pelanggan</th>
                        <th className="py-2 px-2.5">PIC / Kasir</th>
                        <th className="py-2 px-2.5">Metode</th>
                        <th className="py-2 px-2.5 text-right">Debit Kas Masuk</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-[11px]">
                      {filteredBukubesarTrx.map((trx, idx) => {
                        const isVoid = trx.status === 'VOID';
                        return (
                          <tr key={trx.id} className={isVoid ? 'bg-rose-50/50 text-zinc-400' : 'hover:bg-zinc-50'}>
                            <td className="py-1.5 px-2.5 text-center font-mono text-zinc-500">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-mono">
                              <span className={`font-bold block ${isVoid ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                                {trx.id}
                              </span>
                              <span className="text-[10px] text-zinc-500">{trx.date} {trx.time}</span>
                            </td>
                            <td className="py-1.5 px-2.5 font-medium text-zinc-700">{trx.branchName || 'Cabang Utama'}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-zinc-700">{trx.type}</td>
                            <td className="py-1.5 px-2.5 text-zinc-800 max-w-[180px] truncate">{trx.desc}</td>
                            <td className="py-1.5 px-2.5 font-medium text-zinc-900">{trx.customer}</td>
                            <td className="py-1.5 px-2.5">
                              <span className="font-bold text-cyan-800 block">{trx.picNames || trx.picId || trx.cashier || '-'}</span>
                              {trx.cashier && (trx.picNames || trx.picId) && trx.cashier !== (trx.picNames || trx.picId) && (
                                <span className="text-[9px] text-zinc-500 block">Kasir: {trx.cashier}</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 text-zinc-700">
                              {trx.method} {trx.bankDest ? `(${trx.bankDest})` : ''}
                            </td>
                            <td className={`py-1.5 px-2.5 text-right font-black ${isVoid ? 'line-through text-zinc-400' : 'text-emerald-700'}`}>
                              {formatRp(isVoid ? 0 : (trx.amountPaid || trx.amount || 0))}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                isVoid ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {trx.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-zinc-100 font-bold border-t-2 border-zinc-300 text-xs">
                      <tr>
                        <td colSpan={8} className="py-2.5 px-3 text-right text-zinc-700">
                          Total Kas Masuk (Debit Tersaring):
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">
                          {formatRp(totalDebitFiltered)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-600 text-[10px]">
                          {filteredBukubesarTrx.filter((t) => t.status !== 'VOID').length} Trx
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-zinc-200 text-center text-xs mb-6">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Dibuat Oleh (PIC / Kasir)</p>
                    <div className="h-14" />
                    <p className="font-bold text-zinc-900 border-t border-zinc-300 pt-1">
                      {bukubesarPicFilters.length > 0 ? bukubesarPicFilters.join(', ') : currentUser?.name || 'Kasir / Staf'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Diperiksa Oleh (Supervisor)</p>
                    <div className="h-14" />
                    <p className="font-bold text-zinc-900 border-t border-zinc-300 pt-1">Finance & Audit Supervisor</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Disetujui Oleh (Manajemen)</p>
                    <div className="h-14" />
                    <p className="font-bold text-zinc-900 border-t border-zinc-300 pt-1">Branch / General Manager</p>
                  </div>
                </div>

                {/* Action buttons (hidden during print) */}
                <div className="flex flex-wrap justify-end gap-2.5 pt-4 border-t border-zinc-200 print:hidden">
                  <button
                    type="button"
                    onClick={() => setIsBukuBesarPrintModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleExportBukubesarExcel}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                    <span>Download Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportBukubesarPdf}
                    disabled={isExportingBukubesarPdf}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isExportingBukubesarPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Rendering PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5 text-white" />
                        <span>Download PDF (.pdf)</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>Cetak Sekarang (Print)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PETTY CASH MANAGEMENT DASHBOARD */}
      {activeTab === 'petty' && (
        <PettyCashManagementView
          pettyCashList={pettyCashList}
          onUpdatePettyCashList={handleUpdatePettyCash}
          currentUser={currentUser}
          showToast={(title, msg, type = 'info') => showToast(title, msg, type)}
        />
      )}

      {/* 4. DAILY CLOSING & REKONSILIASI KASIR */}
      {activeTab === 'closing' && (
        <div className="space-y-6">
          {/* Sub-View Switcher: Tutup Shift Kasir vs Laporan Rekap Daily Closing */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 p-2 rounded-2xl print:hidden no-print shadow-xs">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setClosingSubView('form')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  closingSubView === 'form'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Rekonsiliasi & Tutup Shift</span>
                {isSelectedDateClosed ? (
                  <span className="bg-rose-900/70 text-rose-300 border border-rose-700/60 text-[10px] px-1.5 py-0.2 rounded font-semibold">Terkunci</span>
                ) : (
                  <span className="bg-emerald-900/70 text-emerald-300 border border-emerald-700/60 text-[10px] px-1.5 py-0.2 rounded font-semibold">Shift Aktif</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setClosingSubView('laporan')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  closingSubView === 'laporan'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Laporan Daily Closing</span>
                <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {filteredClosingRecords.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 px-2">
              <span className="hidden md:inline">Unit Operasional:</span>
              <span className="font-bold text-amber-300 flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-xs">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeBranch?.name || 'Cabang Utama'}</span>
              </span>
            </div>
          </div>

          {closingSubView === 'form' && (
          <div className="space-y-6 print:hidden no-print">
            {/* Top Control Bar: Date Selector & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-zinc-300">Tanggal Operasional Kas:</span>
                </div>
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                />
                {closingDate !== APP_TODAY && (
                  <button
                    type="button"
                    onClick={() => setClosingDate(APP_TODAY)}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
                  >
                    Kembali ke Hari Ini
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-amber-300 shadow-xs">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[160px]">{activeBranch?.name || 'Cabang Utama'}</span>
                </div>

                {isSelectedDateClosed ? (
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Tanggal {closingDate} Telah Ditutup
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Shift Kasir Berjalan
                  </span>
                )}

                <button
                  type="button"
                  id="btn-download-closing-csv"
                  onClick={handleDownloadCSV}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download CSV</span>
                </button>

                <button
                  type="button"
                  id="btn-pdf-closing-report"
                  onClick={handleGeneratePdfReport}
                  disabled={isGeneratingPdf}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  title="Generate Laporan PDF Daily Closing Vektor Asli"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyusun PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Export PDF (Vector)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-print-closing-report"
                  onClick={handlePrintReport}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Cetak Laporan / Simpan PDF via Browser Print"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            {/* THE REQUESTED FINANCIAL SUMMARY COMPONENT */}
            <FinancialSummaryCard
              data={financialSummaryData}
              title="Ringkasan Transaksi Finansial"
              subtitle={`Rekap transaksi operasional per tanggal ${formatDateIndo(closingDate)} (${closingDate})`}
              actionNode={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-card-download-csv"
                    onClick={handleDownloadCSV}
                    className="bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    type="button"
                    id="btn-card-pdf-report"
                    onClick={handleGeneratePdfReport}
                    disabled={isGeneratingPdf}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                    title="Generate Laporan PDF Daily Closing Vektor Asli"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Rendering...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Export PDF (Vector)</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    id="btn-card-print-report"
                    onClick={handlePrintReport}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="Cetak Laporan / Simpan PDF via Browser Print"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                </div>
              }
            />

          {/* Calculation Sheet & Physical Verification Drawer Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calculation Sheet */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Lembar Rekonsiliasi Kas Laci (Drawer)</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Tanggal: {formatDateIndo(closingDate)}</p>
                  </div>
                  {isSelectedDateClosed && (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Buku Terkunci
                    </span>
                  )}
                </div>

                {/* Formula Table */}
                <div className="space-y-3 text-xs">
                  {/* 1. Interactive Modal Awal Laci Input with Presets */}
                  <div className="py-2.5 px-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-zinc-200 font-bold block flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-400" />
                          1. Saldo Modal Awal Laci Kas (Cash Float):
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Modal awal/uang kembalian yang disiapkan di laci kas saat awal shift
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono font-bold">Rp</span>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={openingDrawerCashInput}
                            onChange={(e) => setOpeningDrawerCashInput(e.target.value)}
                            disabled={isSelectedDateClosed}
                            placeholder="500000"
                            className="w-36 bg-zinc-900 border border-zinc-700 focus:border-orange-500 rounded-xl pl-8 pr-2.5 py-1 text-xs font-mono font-bold text-white outline-none disabled:opacity-60 transition"
                          />
                        </div>
                        <span className="text-xs font-black text-amber-400 font-mono hidden sm:inline">
                          = {formatRp(openingDrawerCash)}
                        </span>
                      </div>
                    </div>
                    {!isSelectedDateClosed && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-zinc-800/80">
                        <span className="text-[10px] font-semibold text-zinc-500">Preset Cepat:</span>
                        {[
                          { label: 'Rp 200rb', val: '200000' },
                          { label: 'Rp 300rb', val: '300000' },
                          { label: 'Rp 500rb', val: '500000' },
                          { label: 'Rp 1 Juta', val: '1000000' },
                          { label: 'Rp 2 Juta', val: '2000000' },
                          { label: 'Nol (0)', val: '0' }
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setOpeningDrawerCashInput(preset.val)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              openingDrawerCashInput === preset.val
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                    <div>
                      <span className="text-zinc-400 font-medium block">2. Penerimaan Kas Tunai Hari Ini:</span>
                      <span className="text-[10px] text-zinc-500">
                        (POS Tunai + Pembayaran Membership/PT Cash + Pelunasan Cicilan Tunai)
                      </span>
                    </div>
                    <span className="font-black text-emerald-400 font-mono">+{formatRp(tunaiLaciKasir)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                    <div>
                      <span className="text-zinc-400 font-medium block">3. Pengeluaran Kas Kecil (Petty Cash):</span>
                      <span className="text-[10px] text-zinc-500">Biaya operasional kas kecil pada tanggal ini</span>
                    </div>
                    <span className="font-black text-rose-400 font-mono">-{formatRp(selectedDatePettyExpenses)}</span>
                  </div>

                  <div className="flex justify-between items-center py-3.5 bg-zinc-950/90 rounded-2xl px-4 border border-zinc-800">
                    <div>
                      <span className="text-xs font-bold text-white block">UANG KAS FISIK DIHARAPKAN SISTEM:</span>
                      <span className="text-[10px] text-zinc-500">Modal Awal ({formatRp(openingDrawerCash)}) + Masuk Tunai - Petty Cash</span>
                    </div>
                    <span className="text-xl font-black text-orange-400 font-mono">{formatRp(expectedSystemCash)}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Transactions List on Closing Date */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Detail Transaksi Tanggal {closingDate}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {filteredClosingAuditTrx.length} / {targetClosingTrx.length} Trx
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Rincian transaksi pembentuk ringkasan kas laci dengan filter terintegrasi ke Buku Besar.
                    </p>
                  </div>

                  {/* Action Link: Buka di Buku Besar */}
                  <button
                    type="button"
                    onClick={() => handleJumpToBukuBesar(closingDate, closingTrxMethodFilter !== 'ALL' ? closingTrxMethodFilter : undefined, closingTrxCategoryFilter !== 'ALL' ? closingTrxCategoryFilter : undefined)}
                    className="bg-zinc-950 hover:bg-zinc-800 text-orange-400 hover:text-orange-300 border border-zinc-700/80 hover:border-orange-500/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0 self-start xl:self-center"
                    title="Buka dan sinkronkan transaksi tanggal ini di Buku Besar"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                    <span>Buka di Buku Besar Transaksi</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </button>
                </div>

                {/* Filter Controls Bar (Subtabs, Method, Category, Search) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  {/* Left: Subtabs & Dropdowns */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Subtabs */}
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setClosingAuditTab('ALL')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          closingAuditTab === 'ALL' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Semua ({targetClosingTrx.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setClosingAuditTab('Tunai')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          closingAuditTab === 'Tunai' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Tunai ({cashTrxToday.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setClosingAuditTab('Non-Tunai')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          closingAuditTab === 'Non-Tunai' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Non-Tunai ({nonCashTrxToday.length})
                      </button>
                      {targetClosingTrx.filter((t) => t.status === 'VOID').length > 0 && (
                        <button
                          type="button"
                          onClick={() => setClosingAuditTab('VOID')}
                          className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                            closingAuditTab === 'VOID' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          VOID ({targetClosingTrx.filter((t) => t.status === 'VOID').length})
                        </button>
                      )}
                    </div>

                    {/* Filter Metode Pembayaran */}
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs">
                      <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-zinc-400 font-bold">Metode:</span>
                      <select
                        value={closingTrxMethodFilter}
                        onChange={(e) => setClosingTrxMethodFilter(e.target.value)}
                        className="bg-transparent text-sky-300 font-semibold outline-none cursor-pointer text-xs"
                      >
                        <option value="ALL" className="bg-zinc-900 text-white">Semua Metode</option>
                        <option value="Tunai" className="bg-zinc-900 text-white">Tunai</option>
                        <option value="QRIS" className="bg-zinc-900 text-white">QRIS</option>
                        <option value="Transfer" className="bg-zinc-900 text-white">Transfer</option>
                        <option value="EDC" className="bg-zinc-900 text-white">EDC / Kartu Debit</option>
                        <option value="Kartu" className="bg-zinc-900 text-white">Kartu Kredit</option>
                      </select>
                    </div>

                    {/* Filter Tipe Transaksi */}
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs">
                      <Filter className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-zinc-400 font-bold">Kategori:</span>
                      <select
                        value={closingTrxCategoryFilter}
                        onChange={(e) => setClosingTrxCategoryFilter(e.target.value)}
                        className="bg-transparent text-amber-300 font-semibold outline-none cursor-pointer text-xs"
                      >
                        <option value="ALL" className="bg-zinc-900 text-white">Semua Kategori</option>
                        <option value="POS" className="bg-zinc-900 text-white">POS Cafe / Retail</option>
                        <option value="Membership" className="bg-zinc-900 text-white">Membership</option>
                        <option value="PT" className="bg-zinc-900 text-white">Personal Trainer</option>
                        <option value="Pelunasan Cicilan" className="bg-zinc-900 text-white">Pelunasan Cicilan</option>
                      </select>
                    </div>
                  </div>

                  {/* Right: Search Box */}
                  <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={closingTrxSearch}
                      onChange={(e) => setClosingTrxSearch(e.target.value)}
                      placeholder="Cari ID, member, uraian..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-7 py-1 text-xs text-zinc-200 outline-none focus:border-orange-500 transition"
                    />
                    {closingTrxSearch && (
                      <button
                        onClick={() => setClosingTrxSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">No. Trx</th>
                        <th className="py-2.5 px-3">Jam</th>
                        <th className="py-2.5 px-3">Pelanggan</th>
                        <th className="py-2.5 px-3">Metode & Bank</th>
                        <th className="py-2.5 px-3 text-right">Nilai Transaksi</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Aksi (Cetak/PDF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {filteredClosingAuditTrx.map((trx) => (
                        <tr key={trx.id} className="hover:bg-zinc-800/30 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-white">{trx.id}</td>
                          <td className="py-2.5 px-3 text-zinc-400">{trx.time || '-'}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-white">{trx.customer}</span>
                            <span className="text-[10px] text-zinc-500 block">{trx.desc || trx.type}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-zinc-200">{trx.method}</span>
                            {trx.bankDest && (
                              <span className="text-[10px] text-zinc-400 block flex items-center gap-1">
                                <Landmark className="w-3 h-3 text-zinc-500 inline" /> {trx.bankDest}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {formatRp(getTrxInflow(trx))}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {trx.status === 'VOID' ? (
                              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                VOID
                              </span>
                            ) : trx.status === 'DP 50%' ? (
                              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                DP 50%
                              </span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                {trx.status}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <TransactionActions
                              transaction={trx}
                              onView={handleReprint}
                              onPrint={handleReprint}
                              size="sm"
                            />
                          </td>
                        </tr>
                      ))}
                      {filteredClosingAuditTrx.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-zinc-500">
                            {targetClosingTrx.length === 0
                              ? `Tidak ada transaksi tercatat pada tanggal ${closingDate}.`
                              : 'Tidak ada transaksi yang cocok dengan filter yang dipilih.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Closing Verification Form */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-orange-500" /> Verifikasi Fisik Kasir
                </h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Hitung seluruh lembar dan koin di laci kasir secara riil untuk mencocokkan selisih.
                </p>

                <form onSubmit={handleDailyClosingSubmit} className="space-y-4">
                  {/* Modal Awal & Kas Seharusnya Ringkasan */}
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 text-xs space-y-2">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        Modal Awal Laci:
                      </span>
                      <span className="font-bold text-amber-300 font-mono">{formatRp(openingDrawerCash)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Penerimaan Kas Tunai:</span>
                      <span className="font-bold text-emerald-400 font-mono">+{formatRp(tunaiLaciKasir)}</span>
                    </div>
                    {selectedDatePettyExpenses > 0 && (
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Pengeluaran Petty Cash:</span>
                        <span className="font-bold text-rose-400 font-mono">-{formatRp(selectedDatePettyExpenses)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800 font-bold text-white">
                      <span>Uang Diharapkan Sistem:</span>
                      <span className="text-sm font-black text-orange-400 font-mono">{formatRp(expectedSystemCash)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Jumlah Uang Fisik di Laci (Rp)
                    </label>
                    <input
                      type="number"
                      value={physicalCashInput}
                      onChange={(e) => setPhysicalCashInput(e.target.value)}
                      required
                      placeholder="Masukkan total hitungan fisik..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-3 text-base font-black text-white outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  {physicalCashInput && (
                    <div
                      className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                        cashVariance === 0
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : cashVariance > 0
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span>Varian Selisih Kas:</span>
                        <span className="text-sm font-black font-mono">
                          {cashVariance === 0 ? 'COCOK (0)' : formatRp(cashVariance)}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-80">
                        {cashVariance === 0
                          ? 'Uang fisik sama persis dengan sistem.'
                          : cashVariance > 0
                          ? 'Uang fisik lebih besar dari catatan sistem (Lebih kas).'
                          : 'Uang fisik lebih kecil dari catatan sistem (Kurang kas).'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Catatan Tutup Buku
                    </label>
                    <textarea
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      rows={2}
                      placeholder="Cth: Shift pagi normal, selisih 0..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSelectedDateClosed}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                      isSelectedDateClosed
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-98'
                    }`}
                  >
                    <Lock className="w-4 h-4" /> Kunci Daily Closing Tanggal Ini
                  </button>
                </form>
              </div>

              {/* Previous Closings history */}
              {closingRecords.length > 0 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                    Riwayat Closing Terakhir:
                  </span>
                  <div className="space-y-2">
                    {closingRecords.slice(0, 3).map((cr) => (
                      <div key={cr.id} className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-[11px] flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white">{cr.date}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-900 border border-amber-500/30 text-amber-300 font-semibold">
                              {cr.branchName || 'Cabang Utama'}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 block">Oleh: {cr.cashierName}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-black text-orange-400">{formatRp(cr.physicalCash)}</span>
                          <span className={`text-[10px] block ${cr.variance === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {cr.variance === 0 ? 'Match' : `Var: ${formatRp(cr.variance)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
          )}

          {/* Sub-view: Laporan Rekap Daily Closing */}
          {closingSubView === 'laporan' && (
            <div className="space-y-6 print:hidden no-print">
              {/* Filter & Actions Bar */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
                {/* Row 1: Header + Export CSV + Reset */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Laporan Rekapitulasi Daily Closing Kasir</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          {filteredClosingRecords.length} Data Closing
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Audit dan rekap histori penutupan kasir, modal awal, selisih kas fisik, dan penerimaan omset.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportClosingReportExcel}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title="Download Rekap Closing dalam format Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportClosingReportCSV}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title="Download Rekap Closing dalam format CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetClosingReportFilters}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Reset semua filter"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Filter</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Date Filters & Presets */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span>Periode:</span>
                    </span>
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      {[
                        { label: 'Semua', val: 'ALL' },
                        { label: 'Hari Ini', val: 'TODAY' },
                        { label: '7 Hari', val: '7DAYS' },
                        { label: 'Bulan Ini', val: 'MONTH' }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => handleSetClosingReportDatePreset(p.val as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            closingReportDatePreset === p.val
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800 text-xs">
                      <input
                        type="date"
                        value={closingReportStartDate}
                        onChange={(e) => handleClosingReportStartDateChange(e.target.value)}
                        className="bg-transparent text-white outline-none text-xs font-mono"
                        title="Tanggal Mulai"
                      />
                      <span className="text-zinc-500">s/d</span>
                      <input
                        type="date"
                        value={closingReportEndDate}
                        onChange={(e) => handleClosingReportEndDateChange(e.target.value)}
                        className="bg-transparent text-white outline-none text-xs font-mono"
                        title="Tanggal Akhir"
                      />
                    </div>
                  </div>

                  {/* Search box */}
                  <div className="relative min-w-[220px] max-w-xs flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={closingReportSearch}
                      onChange={(e) => setClosingReportSearch(e.target.value)}
                      placeholder="Cari ID, kasir, cabang, catatan..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white outline-none focus:border-orange-500 transition"
                    />
                    {closingReportSearch && (
                      <button
                        onClick={() => setClosingReportSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 3: Dropdowns (Cabang, Kasir, Status Selisih) */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-zinc-800/80">
                  {isSuperAdmin ? (
                    branches.length > 1 && (
                      <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-zinc-400 font-bold">Cabang:</span>
                        <select
                          value={closingReportBranchFilter}
                          onChange={(e) => setClosingReportBranchFilter(e.target.value)}
                          className="bg-transparent text-amber-300 font-semibold outline-none cursor-pointer"
                        >
                          <option value="ALL" className="bg-zinc-900 text-white">Semua Cabang ({branches.length})</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 bg-teal-950/60 border border-teal-500/30 rounded-xl px-2.5 py-1.5 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-zinc-400 font-bold">Unit:</span>
                      <span className="font-extrabold text-white">{branches.find((b) => b.id === userBranchId)?.name || activeBranch.name}</span>
                      <span className="text-[9px] text-teal-400 font-mono font-bold bg-teal-500/20 px-1 rounded">Lokal</span>
                    </div>
                  )}

                  {uniqueClosingCashiers.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-zinc-400 font-bold">Kasir:</span>
                      <select
                        value={closingReportCashierFilter}
                        onChange={(e) => setClosingReportCashierFilter(e.target.value)}
                        className="bg-transparent text-cyan-300 font-semibold outline-none cursor-pointer"
                      >
                        <option value="ALL" className="bg-zinc-900 text-white">Semua Kasir ({uniqueClosingCashiers.length})</option>
                        {uniqueClosingCashiers.map((cName) => (
                          <option key={cName} value={cName} className="bg-zinc-900 text-white">
                            {cName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-zinc-400 font-bold">Status Selisih:</span>
                    <select
                      value={closingReportVarianceFilter}
                      onChange={(e) => setClosingReportVarianceFilter(e.target.value as any)}
                      className="bg-transparent text-emerald-300 font-semibold outline-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-zinc-900 text-white">Semua Status Selisih</option>
                      <option value="MATCH" className="bg-zinc-900 text-white">Cocok / Balance (Selisih 0)</option>
                      <option value="SURPLUS" className="bg-zinc-900 text-white">Lebih Kas (+)</option>
                      <option value="DEFICIT" className="bg-zinc-900 text-white">Kurang Kas (-)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                    <span>Total Sesi Closing</span>
                    <History className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {closingReportMetrics.totalCount} <span className="text-xs font-normal text-zinc-400">Sesi</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {closingReportMetrics.matchCount} Balance • {closingReportMetrics.mismatchCount} Selisih
                  </p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                    <span>Total Modal Awal (Float)</span>
                    <Coins className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-amber-300 font-mono">
                    {formatRp(closingReportMetrics.totalOpeningFloat)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Disiapkan di laci kasir</p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                    <span>Kas Masuk Tunai</span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {formatRp(closingReportMetrics.totalCashIn)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Penerimaan cash di kasir</p>
                </div>

                {/* KPI Non-Tunai (Mandiri & Artha Graha) */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                    <span>Penerimaan Non-Tunai</span>
                    <Landmark className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-xl font-black text-sky-400 font-mono">
                    {formatRp(closingReportMetrics.totalNonCashIn)}
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5 text-[9px] font-mono">
                    <span className="text-amber-300 truncate">
                      Mandiri: {formatRp(closingReportMetrics.totalMandiriIn)}
                    </span>
                    <span className="text-sky-300 truncate">
                      Artha: {formatRp(closingReportMetrics.totalArthaIn)}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                    <span>Total Fisik Aktual</span>
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {formatRp(closingReportMetrics.totalPhysicalCash)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Uang riil yang disetor</p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                    <span>Net Varian Selisih</span>
                    <Calculator className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className={`text-xl font-black font-mono ${
                    closingReportMetrics.totalVariance === 0
                      ? 'text-emerald-400'
                      : closingReportMetrics.totalVariance > 0
                      ? 'text-blue-400'
                      : 'text-rose-400'
                  }`}>
                    {closingReportMetrics.totalVariance === 0 ? 'Rp 0 (Balance)' : formatRp(closingReportMetrics.totalVariance)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {closingReportMetrics.totalVariance === 0
                      ? 'Seluruh kas klop tanpa selisih'
                      : closingReportMetrics.totalVariance > 0
                      ? 'Akumulasi lebih kas'
                      : 'Akumulasi kurang kas'}
                  </p>
                </div>
              </div>

              {/* Table of Historical Closing Records */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">Rincian Data Sesi Daily Closing</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Klik aksi untuk membuka lembar rekonsiliasi, mencetak struk, atau meninjau transaksi di Buku Besar.
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    Menampilkan {filteredClosingRecords.length} dari {closingRecords.length} data closing
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Tanggal & Sesi</th>
                        <th className="py-3 px-3">Cabang & Kasir</th>
                        <th className="py-3 px-3 text-right">Modal Awal</th>
                        <th className="py-3 px-3 text-right">Tunai Masuk</th>
                        <th className="py-3 px-3 text-right min-w-[210px]">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-sky-400">Non-Tunai (Bank)</span>
                            <span className="text-[9px] text-zinc-400 font-normal normal-case flex items-center gap-1 mt-0.5">
                              <span className="text-amber-400 font-semibold">Mandiri</span>
                              <span>&</span>
                              <span className="text-sky-300 font-semibold">Artha Graha</span>
                            </span>
                          </div>
                        </th>
                        <th className="py-3 px-3 text-right">Diharapkan</th>
                        <th className="py-3 px-3 text-right">Fisik Aktual</th>
                        <th className="py-3 px-3 text-center">Selisih Varian</th>
                        <th className="py-3 px-3">Catatan</th>
                        <th className="py-3 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {filteredClosingRecords.map((cr) => {
                        const variance = cr.variance !== undefined ? cr.variance : (cr.difference || 0);
                        const modal = cr.openingFloat || cr.modalAwal || 0;
                        const cashIn = cr.tunai || cr.cashSales || 0;
                        const expected = cr.expectedCash || cr.systemSaldo || (modal + cashIn - (cr.pettyExpenses || cr.pettyCash || 0));
                        const actual = cr.physicalCash || cr.actualCash || 0;
                        const nonCashBreakdown = getRecordNonCashBreakdown(cr);

                        return (
                          <tr key={cr.id} className="hover:bg-zinc-800/40 transition">
                            <td className="py-3 px-3">
                              <span className="font-bold text-white block">{formatDateIndo(cr.date)}</span>
                              <span className="font-mono text-[10px] text-zinc-500 block">{cr.id}</span>
                              <span className="text-[10px] text-zinc-400">{cr.time || cr.closedAt || '-'}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-amber-300 block">{cr.branchName || 'Cabang Utama'}</span>
                              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                <UserCheck className="w-3 h-3 text-zinc-500" />
                                <span>{cr.cashierName || cr.closedBy || 'Kasir'}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                              {formatRp(modal)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                              +{formatRp(cashIn)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="font-mono font-black text-sky-400 text-xs">
                                  {formatRp(nonCashBreakdown.total)}
                                </span>
                                <div className="w-full min-w-[190px] max-w-[220px] bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 space-y-1.5 text-left shadow-xs">
                                  {/* Bank Mandiri */}
                                  <div className="space-y-0.5">
                                    <div className="flex items-center justify-between gap-1 text-[11px]">
                                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                                        Mandiri
                                      </span>
                                      <span className="font-mono font-bold text-amber-300">
                                        {formatRp(nonCashBreakdown.mandiri)}
                                      </span>
                                    </div>
                                    {(nonCashBreakdown.mandiriQris > 0 || nonCashBreakdown.mandiriTf > 0 || nonCashBreakdown.mandiriEdc > 0) && (
                                      <div className="flex items-center justify-end gap-1.5 text-[9px] text-zinc-500 font-mono">
                                        {nonCashBreakdown.mandiriQris > 0 && <span>Q:{formatRp(nonCashBreakdown.mandiriQris)}</span>}
                                        {nonCashBreakdown.mandiriTf > 0 && <span>TF:{formatRp(nonCashBreakdown.mandiriTf)}</span>}
                                        {nonCashBreakdown.mandiriEdc > 0 && <span>EDC:{formatRp(nonCashBreakdown.mandiriEdc)}</span>}
                                      </div>
                                    )}
                                  </div>

                                  {/* Bank Artha Graha */}
                                  <div className="space-y-0.5 pt-1.5 border-t border-zinc-800/80">
                                    <div className="flex items-center justify-between gap-1 text-[11px]">
                                      <span className="text-[10px] font-bold text-sky-300 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                                        Artha Graha
                                      </span>
                                      <span className="font-mono font-bold text-sky-300">
                                        {formatRp(nonCashBreakdown.artha)}
                                      </span>
                                    </div>
                                    {(nonCashBreakdown.arthaQris > 0 || nonCashBreakdown.arthaTf > 0 || nonCashBreakdown.arthaEdc > 0) && (
                                      <div className="flex items-center justify-end gap-1.5 text-[9px] text-zinc-500 font-mono">
                                        {nonCashBreakdown.arthaQris > 0 && <span>Q:{formatRp(nonCashBreakdown.arthaQris)}</span>}
                                        {nonCashBreakdown.arthaTf > 0 && <span>TF:{formatRp(nonCashBreakdown.arthaTf)}</span>}
                                        {nonCashBreakdown.arthaEdc > 0 && <span>EDC:{formatRp(nonCashBreakdown.arthaEdc)}</span>}
                                      </div>
                                    )}
                                  </div>

                                  {/* Bank Lainnya jika ada */}
                                  {nonCashBreakdown.otherBanks.map((ob) => (
                                    <div key={ob.name} className="flex items-center justify-between gap-1 text-[10px] pt-1 border-t border-zinc-800/60 text-zinc-400">
                                      <span className="truncate">{ob.name}</span>
                                      <span className="font-mono font-semibold text-zinc-300">{formatRp(ob.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-zinc-300">
                              {formatRp(expected)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-black text-white">
                              {formatRp(actual)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {variance === 0 ? (
                                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> MATCH
                                </span>
                              ) : variance > 0 ? (
                                <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                  +{formatRp(variance)} (Lebih)
                                </span>
                              ) : (
                                <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                  {formatRp(variance)} (Kurang)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 max-w-[180px]">
                              <p className="text-[11px] text-zinc-400 truncate" title={cr.notes}>
                                {cr.notes || '-'}
                              </p>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClosingDate(cr.date);
                                    setClosingSubView('form');
                                  }}
                                  className="bg-zinc-800 hover:bg-orange-500 text-zinc-300 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
                                  title="Buka Form Rekonsiliasi Tanggal Ini"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClosingDate(cr.date);
                                    setIsClosingPrintOpen(true);
                                  }}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
                                  title="Cetak Struk Tutup Kasir"
                                >
                                  <Printer className="w-3.5 h-3.5 text-orange-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleJumpToBukuBesar(cr.date)}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
                                  title="Lihat Transaksi di Buku Besar"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredClosingRecords.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-zinc-500">
                            <FileSpreadsheet className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-zinc-400">Tidak ada laporan daily closing yang cocok</p>
                            <p className="text-xs text-zinc-600 mt-1">Coba sesuaikan kata kunci pencarian atau filter rentang tanggal.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {filteredClosingRecords.length > 0 && (
                      <tfoot className="border-t-2 border-zinc-700 font-sans bg-zinc-950/70">
                        <tr className="text-zinc-200 font-bold text-xs">
                          <td colSpan={2} className="py-3.5 px-3 uppercase text-[10px] tracking-wider text-zinc-400">
                            Total Rekapitulasi ({filteredClosingRecords.length} Sesi)
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-amber-400">
                            {formatRp(closingReportMetrics.totalOpeningFloat)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-emerald-400">
                            +{formatRp(closingReportMetrics.totalCashIn)}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono font-black text-sky-400 text-xs">
                                {formatRp(closingReportMetrics.totalNonCashIn)}
                              </span>
                              <div className="w-full min-w-[190px] max-w-[220px] bg-zinc-900 border border-zinc-800 rounded-lg p-2 space-y-1 text-left text-[10px]">
                                <div className="flex items-center justify-between text-amber-300 font-mono">
                                  <span className="font-sans font-bold text-[9px]">Total Mandiri:</span>
                                  <span className="font-bold">{formatRp(closingReportMetrics.totalMandiriIn)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sky-300 font-mono border-t border-zinc-800 pt-1">
                                  <span className="font-sans font-bold text-[9px]">Total Artha Graha:</span>
                                  <span className="font-bold">{formatRp(closingReportMetrics.totalArthaIn)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-zinc-300">
                            {formatRp(closingReportMetrics.totalExpectedCash)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-white font-black">
                            {formatRp(closingReportMetrics.totalPhysicalCash)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              closingReportMetrics.totalVariance === 0
                                ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                                : closingReportMetrics.totalVariance > 0
                                ? 'text-blue-400 bg-blue-500/15 border border-blue-500/30'
                                : 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                            }`}>
                              {closingReportMetrics.totalVariance === 0 ? 'MATCH' : formatRp(closingReportMetrics.totalVariance)}
                            </span>
                          </td>
                          <td colSpan={2} className="py-3.5 px-3 text-center text-[10px] text-zinc-500">
                            {closingReportMetrics.matchCount} balance • {closingReportMetrics.mismatchCount} selisih
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PRINT MODAL: LAPORAN TUTUP BUKU HARIAN KASIR */}
          {isClosingPrintOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:static print:inset-auto print:z-auto print:p-0 print:m-0 print:bg-white print:overflow-visible">
              <div
                ref={closingPrintRef}
                id="printable-report-content"
                className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl p-6 my-auto max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible print:bg-white print:text-black print:border-none print:shadow-none print:max-w-full print:p-0 print:m-0"
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-800 print:border-zinc-300 pb-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xs print:bg-black">
                        GP
                      </div>
                      <div>
                        <h2 className="text-base font-black text-white print:text-black tracking-tight">
                          GYMPRO ERP ENTERPRISE
                        </h2>
                        <p className="text-xs text-zinc-400 print:text-zinc-600">Laporan Tutup Buku Kasir Harian (Daily Closing)</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsClosingPrintOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white print:hidden cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-zinc-950 print:bg-zinc-100 p-3.5 rounded-2xl text-xs mb-5 border border-zinc-800 print:border-zinc-300">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Tanggal:</span>
                    <span className="font-bold text-white print:text-black">{formatDateIndo(closingDate)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Cabang / Unit:</span>
                    <span className="font-bold text-amber-400 print:text-black">{activeBranch?.name || 'Cabang Utama'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Kasir Bertugas:</span>
                    <span className="font-bold text-white print:text-black">{currentUser?.name || 'Kasir Gym'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Status Buku:</span>
                    <span className="font-bold text-orange-400 print:text-black">
                      {isSelectedDateClosed ? 'TERKUNCI' : 'SHIFT AKTIF'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Waktu Cetak:</span>
                    <span className="font-bold text-white print:text-black">{getTimestamp()}</span>
                  </div>
                </div>

                {/* Financial Summary inside print report */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-orange-400 print:text-black uppercase tracking-wider mb-2">
                    I. Ringkasan Transaksi Finansial
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    <div className="p-2.5 bg-zinc-950 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl">
                      <span className="text-[10px] text-zinc-500 block">TOTAL OMSET</span>
                      <span className="text-sm font-black text-orange-500 print:text-black font-mono">{formatRp(totalOmset)}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl">
                      <span className="text-[10px] text-zinc-500 block">TOTAL TRX</span>
                      <span className="text-sm font-black text-white print:text-black font-mono">{totalTrxCount}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl">
                      <span className="text-[10px] text-zinc-500 block">TUNAI LACI</span>
                      <span className="text-sm font-black text-emerald-400 print:text-black font-mono">{formatRp(tunaiLaciKasir)}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl">
                      <span className="text-[10px] text-zinc-500 block">NON-TUNAI</span>
                      <span className="text-sm font-black text-sky-400 print:text-black font-mono">{formatRp(nonTunaiMasuk)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-zinc-950 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl space-y-1.5">
                      <div className="flex justify-between font-bold text-sky-400 print:text-black border-b border-zinc-800 print:border-zinc-200 pb-1">
                        <span>BANK ARTHA GRAHA</span>
                        <span className="font-mono">{formatRp(arthaGrahaTotal)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 print:text-zinc-600">
                        <span>QRIS:</span>
                        <span className="font-mono font-bold text-white print:text-black">{formatRp(arthaGrahaQRIS)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 print:text-zinc-600">
                        <span>Transfer:</span>
                        <span className="font-mono font-bold text-white print:text-black">{formatRp(arthaGrahaTransfer)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 print:text-zinc-600">
                        <span>Debit/EDC:</span>
                        <span className="font-mono font-bold text-white print:text-black">{formatRp(arthaGrahaEDC)}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-950 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl space-y-1.5">
                      <div className="flex justify-between font-bold text-amber-400 print:text-black border-b border-zinc-800 print:border-zinc-200 pb-1">
                        <span>BANK MANDIRI</span>
                        <span className="font-mono">{formatRp(mandiriTotal)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 print:text-zinc-600">
                        <span>QRIS:</span>
                        <span className="font-mono font-bold text-white print:text-black">{formatRp(mandiriQRIS)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 print:text-zinc-600">
                        <span>Transfer:</span>
                        <span className="font-mono font-bold text-white print:text-black">{formatRp(mandiriTransfer)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 print:text-zinc-600">
                        <span>Debit/EDC:</span>
                        <span className="font-mono font-bold text-white print:text-black">{formatRp(mandiriEDC)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rekonsiliasi Kas Laci */}
                <div className="mb-5 text-xs">
                  <h4 className="font-bold text-orange-400 print:text-black uppercase tracking-wider mb-2">
                    II. Rekonsiliasi Laci Kasir (Cash Drawer)
                  </h4>
                  <div className="bg-zinc-950 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 print:text-zinc-600">Modal Awal Laci Kas:</span>
                      <span className="font-bold font-mono text-white print:text-black">{formatRp(openingDrawerCash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 print:text-zinc-600">Total Uang Tunai Masuk:</span>
                      <span className="font-bold font-mono text-emerald-400 print:text-black">+{formatRp(tunaiLaciKasir)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 print:text-zinc-600">Pengeluaran Petty Cash:</span>
                      <span className="font-bold font-mono text-rose-400 print:text-black">-{formatRp(selectedDatePettyExpenses)}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 print:border-zinc-300 pt-2 font-bold">
                      <span className="text-white print:text-black">Uang Fisik Diharapkan Sistem:</span>
                      <span className="font-mono text-orange-400 print:text-black">{formatRp(expectedSystemCash)}</span>
                    </div>
                    {physicalCashInput && (
                      <>
                        <div className="flex justify-between font-bold">
                          <span className="text-white print:text-black">Uang Fisik Aktual di Laci:</span>
                          <span className="font-mono text-white print:text-black">{formatRp(inputCashNumber)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-white print:text-black">Selisih / Variance:</span>
                          <span className={`font-mono ${cashVariance === 0 ? 'text-emerald-400 print:text-black' : 'text-rose-400 print:text-black'}`}>
                            {cashVariance === 0 ? 'COCOK (0)' : formatRp(cashVariance)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* III. Rincian Transaksi Harian Table */}
                <div className="mb-5 text-xs">
                  <h4 className="font-bold text-orange-400 print:text-black uppercase tracking-wider mb-2">
                    III. Rincian Transaksi Harian ({targetClosingTrx.length} Transaksi)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-zinc-800 print:border-zinc-300">
                      <thead>
                        <tr className="bg-zinc-950 print:bg-zinc-100 text-zinc-400 print:text-black">
                          <th className="p-2">No. Trx</th>
                          <th className="p-2">Jam</th>
                          <th className="p-2">Pelanggan</th>
                          <th className="p-2">Kategori / Deskripsi</th>
                          <th className="p-2">Metode / Bank</th>
                          <th className="p-2 text-right">Nominal Masuk</th>
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 print:divide-zinc-200">
                        {targetClosingTrx.map((trx) => (
                          <tr key={trx.id} className="text-zinc-300 print:text-black">
                            <td className="p-2 font-mono font-bold text-white print:text-black">{trx.id}</td>
                            <td className="p-2 text-zinc-400 print:text-black">{trx.time || '-'}</td>
                            <td className="p-2 font-medium text-white print:text-black">{trx.customer}</td>
                            <td className="p-2 text-zinc-400 print:text-zinc-700">{trx.desc || trx.type}</td>
                            <td className="p-2">
                              {trx.method} {trx.bankDest ? `(${trx.bankDest})` : ''}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-white print:text-black">
                              {formatRp(getTrxInflow(trx))}
                            </td>
                            <td className="p-2 text-center font-bold">
                              {trx.status}
                            </td>
                          </tr>
                        ))}
                        {targetClosingTrx.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-3 text-center text-zinc-500">
                              Tidak ada transaksi pada tanggal ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* IV. Rincian Petty Cash (Jika ada) */}
                {selectedDatePettyExpenses > 0 && (
                  <div className="mb-5 text-xs">
                    <h4 className="font-bold text-rose-400 print:text-black uppercase tracking-wider mb-2">
                      IV. Rincian Pengeluaran Kas Kecil (Petty Cash)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-zinc-800 print:border-zinc-300">
                        <thead>
                          <tr className="bg-zinc-950 print:bg-zinc-100 text-zinc-400 print:text-black">
                            <th className="p-2">ID</th>
                            <th className="p-2">Jam/Waktu</th>
                            <th className="p-2">Kategori</th>
                            <th className="p-2">Deskripsi</th>
                            <th className="p-2 text-right">Nominal</th>
                            <th className="p-2">PIC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 print:divide-zinc-200">
                          {pettyCashList
                            .filter(
                              (p) =>
                                p.date === closingDate ||
                                p.date.includes(closingDate) ||
                                (p.created_at && p.created_at.startsWith(closingDate))
                            )
                            .map((pc) => (
                              <tr key={pc.id} className="text-zinc-300 print:text-black">
                                <td className="p-2 font-mono font-bold text-white print:text-black">{pc.id}</td>
                                <td className="p-2 text-zinc-400 print:text-black">{pc.time || pc.created_at || '-'}</td>
                                <td className="p-2">{pc.category || '-'}</td>
                                <td className="p-2">{pc.desc || pc.description || '-'}</td>
                                <td className="p-2 text-right font-mono font-bold text-rose-400 print:text-black">
                                  {formatRp(pc.total_expense !== undefined ? pc.total_expense : pc.amount || 0)}
                                </td>
                                <td className="p-2">{pc.submitted_by_name || pc.pic || pc.submitted_by || '-'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800 print:border-zinc-300 text-center text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px] mb-12 uppercase">Kasir Bertugas</span>
                    <span className="font-bold text-white print:text-black block border-t border-zinc-700 print:border-zinc-400 pt-1">
                      ( {currentUser?.name || 'Kasir'} )
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] mb-12 uppercase">Head Cashier / SPV</span>
                    <span className="font-bold text-white print:text-black block border-t border-zinc-700 print:border-zinc-400 pt-1">
                      ( ........................ )
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] mb-12 uppercase">Finance / Owner</span>
                    <span className="font-bold text-white print:text-black block border-t border-zinc-700 print:border-zinc-400 pt-1">
                      ( ........................ )
                    </span>
                  </div>
                </div>

                {/* Print modal buttons */}
                <div className="mt-6 flex flex-wrap justify-end gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={() => setIsClosingPrintOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePdfReport}
                    disabled={isGeneratingPdf}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyusun PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download PDF (Vector)</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <Printer className="w-4 h-4" /> Cetak Sekarang (window.print)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: BAYAR CICILAN PIUTANG */}
      {selectedPiutang && (() => {
        const memberOtherUnpaidBills = transactions.filter(
          (t) =>
            t.id !== selectedPiutang.id &&
            ((t.customer && t.customer === selectedPiutang.customer) ||
              (t.billName && t.billName === (selectedPiutang.billName || selectedPiutang.customer))) &&
            (t.amountRemaining || 0) > 0 &&
            t.status !== 'VOID'
        );
        const memberOtherTotalSisa = memberOtherUnpaidBills.reduce(
          (sum, t) => sum + (t.amountRemaining || 0),
          0
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <h3 className="text-base font-bold text-white mb-1">Pembayaran Cicilan Piutang</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Nomor: <span className="font-mono text-white">{selectedPiutang.id}</span> ({selectedPiutang.customer})
              </p>

              <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Nilai Tagihan:</span>
                    <span className="font-bold text-white">{formatRp(selectedPiutang.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Telah Dibayar Sebelumnya:</span>
                    <span className="font-bold text-emerald-400">{formatRp(selectedPiutang.amountPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-2">
                    <span className="text-zinc-400">Sisa Tagihan Tertunggak:</span>
                    <span className="font-black text-orange-400">
                      {formatRp(selectedPiutang.amountRemaining || 0)}
                    </span>
                  </div>
                </div>

                {memberOtherUnpaidBills.length > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-orange-200 leading-tight">
                        Member ini memiliki <strong className="text-white font-bold">{memberOtherUnpaidBills.length} tagihan lain</strong> yang belum lunas (Total Lain: <strong className="text-orange-300 font-bold">{formatRp(memberOtherTotalSisa)}</strong>).
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allForMember = [selectedPiutang, ...memberOtherUnpaidBills];
                        setSelectedPiutang(null);
                        handleOpenBatchPay(allForMember);
                      }}
                      className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      Bayar Semua Tagihan Member Sekaligus ({memberOtherUnpaidBills.length + 1})
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Nominal Pembayaran Sekarang (Rp)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    min="1"
                    max={selectedPiutang.amountRemaining || undefined}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-base font-black text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Metode Pembayaran
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                  >
                    <option value="Tunai">Tunai / Cash Laci</option>
                    <option value="Transfer">Transfer Bank (Mandiri / Artha Graha)</option>
                    <option value="QRIS">QRIS</option>
                    <option value="EDC">Debit / EDC</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPiutang(null)}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Simpan Pembayaran
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: BAYAR CICILAN SEKALIGUS / MASSAL */}
      {isBatchPayModalOpen && batchPayTransactions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl p-4 sm:p-6 my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30 shadow-inner">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pelunasan Cicilan Sekaligus (Multi-Tagihan)</h3>
                  <p className="text-xs text-zinc-400">
                    {batchPayTransactions.every((t) => t.customer === batchPayTransactions[0].customer) ? (
                      <>Member: <span className="font-bold text-orange-400">{batchPayTransactions[0].customer}</span> • {batchPayTransactions.length} tagihan dipilih</>
                    ) : (
                      <>{batchPayTransactions.length} tagihan dari {new Set(batchPayTransactions.map((t) => t.customer)).size} member berbeda</>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchPayModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleConfirmBatchPayment} className="space-y-4 pt-4 overflow-y-auto pr-1">
              {/* Table of Bills in Batch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Daftar Tagihan yang Akan Dibayar ({batchPayTransactions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleSetAllFullAmount}
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-bold transition flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Set Semua Lunas Penuh
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-xl divide-y divide-zinc-800/80 bg-zinc-950/60">
                  {batchPayTransactions.map((t) => {
                    const currentAmt = batchPayAmounts[t.id] !== undefined ? batchPayAmounts[t.id] : (t.amountRemaining || 0);
                    const isFull = currentAmt === (t.amountRemaining || 0);

                    return (
                      <div key={t.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-zinc-900/50 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-white text-[11px]">{t.id}</span>
                            <span className="text-[10px] text-zinc-500">({t.date})</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                              {t.customer}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5" title={t.desc}>
                            {t.desc}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Total Kontrak: {formatRp(t.amount)} • Sisa Piutang: <span className="font-bold text-orange-400">{formatRp(t.amountRemaining || 0)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-400 mb-0.5">Nominal Bayar (Rp)</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                max={t.amountRemaining || undefined}
                                value={currentAmt}
                                onChange={(e) => handleBatchAmountChange(t.id, Number(e.target.value))}
                                className="w-28 sm:w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white text-right outline-none focus:border-orange-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleBatchAmountChange(t.id, t.amountRemaining || 0)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  isFull
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                                }`}
                                title="Bayar Lunas Penuh"
                              >
                                {isFull ? 'Lunas' : 'Full'}
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromBatch(t.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                            title="Keluarkan dari daftar bayar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Tagihan Terpilih:</span>
                  <span className="font-bold text-white">{batchPayTransactions.length} Transaksi</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Akumulasi Sisa Piutang:</span>
                  <span className="font-bold text-zinc-300">
                    {formatRp(batchPayTransactions.reduce((sum, t) => sum + (t.amountRemaining || 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-zinc-800 pt-2">
                  <span className="text-xs font-bold text-zinc-200">Total yang Akan Dibayarkan Sekarang:</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatRp(batchPayTransactions.reduce((sum, t) => sum + (batchPayAmounts[t.id] !== undefined ? batchPayAmounts[t.id] : (t.amountRemaining || 0)), 0))}
                  </span>
                </div>
              </div>

              {/* Payment Method & Bank Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Metode Pembayaran
                  </label>
                  <select
                    value={batchPayMethod}
                    onChange={(e) => setBatchPayMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500"
                  >
                    <option value="Tunai">Tunai / Cash Laci</option>
                    <option value="Transfer">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="EDC">Debit / EDC</option>
                  </select>
                </div>

                {batchPayMethod === 'Transfer' && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Bank Tujuan
                    </label>
                    <select
                      value={batchPayBankDest}
                      onChange={(e) => setBatchPayBankDest(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="Mandiri">Bank Mandiri (Gym / Membership)</option>
                      <option value="Artha Graha">Bank Artha Graha (Cafe / POS)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Catatan Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pelunasan multi-cicilan member"
                  value={batchPayNotes}
                  onChange={(e) => setBatchPayNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsBatchPayModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  Konfirmasi & Bayar Semua ({formatRp(batchPayTransactions.reduce((sum, t) => sum + (batchPayAmounts[t.id] !== undefined ? batchPayAmounts[t.id] : (t.amountRemaining || 0)), 0))})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI VOID TRANSAKSI */}
      {voidModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Batalkan Transaksi (VOID)</h3>
                <p className="text-xs text-zinc-400">Pembatalan resmi transaksi pembukuan</p>
              </div>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-300 leading-relaxed">
                <span className="font-bold">Perhatian:</span> Tindakan VOID akan membatalkan transaksi ini dari laporan kas masuk, komisi staf, dan buku besar. Jika transaksi POS Cafe, stok produk akan otomatis dikembalikan.
              </p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Nomor Transaksi:</span>
                <span className="font-mono font-bold text-white">{voidModalTrx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pelanggan / Member:</span>
                <span className="font-bold text-white">{voidModalTrx.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Uraian:</span>
                <span className="text-zinc-300 truncate max-w-[200px]">{voidModalTrx.desc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Metode Bayar:</span>
                <span className="font-bold text-zinc-200">
                  {voidModalTrx.method} {voidModalTrx.bankDest ? `(${voidModalTrx.bankDest})` : ''}
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-2">
                <span className="text-zinc-400">Nilai Transaksi:</span>
                <span className="font-black text-rose-400">
                  {formatRp(voidModalTrx.amountPaid || voidModalTrx.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Alasan VOID Transaksi
                </label>
                <select
                  value={voidReasonOption}
                  onChange={(e) => setVoidReasonOption(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-rose-500"
                >
                  <option value="Salah input kasir">Salah input kasir</option>
                  <option value="Pelanggan membatalkan transaksi">Pelanggan membatalkan transaksi</option>
                  <option value="Transaksi duplikat (Double input)">Transaksi duplikat (Double input)</option>
                  <option value="Salah nominal pembayaran">Salah nominal pembayaran</option>
                  <option value="Salah produk atau paket">Salah produk atau paket</option>
                  <option value="Lainnya">Alasan Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Catatan / Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={voidReasonNotes}
                  onChange={(e) => setVoidReasonNotes(e.target.value)}
                  placeholder="Opsional: masukkan detail kesalahan..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVoidModalTrx(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" /> Konfirmasi VOID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KOREKSI SALAH METODE PEMBAYARAN */}
      {methodModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Koreksi Metode Pembayaran</h3>
                <p className="text-xs text-zinc-400">Perbaiki kesalahan metode input kasir</p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4 flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-300 leading-relaxed">
                Gunakan jika kasir salah memilih metode saat transaksi (misal: terklik Tunai padahal Transfer / QRIS). Saldo kas fisik laci dan rekening bank akan otomatis disesuaikan secara akurat.
              </p>
            </div>

            <form onSubmit={handleConfirmMethodChange} className="space-y-4">
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Nomor Transaksi:</span>
                  <span className="font-mono font-bold text-white">{methodModalTrx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Pelanggan / Member:</span>
                  <span className="font-bold text-white">{methodModalTrx.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Nominal Transaksi:</span>
                  <span className="font-black text-emerald-400">
                    {formatRp(methodModalTrx.amountPaid || methodModalTrx.amount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-2">
                  <span className="text-zinc-400">Metode Saat Ini:</span>
                  <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {methodModalTrx.method} {methodModalTrx.bankDest ? `(${methodModalTrx.bankDest})` : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Pilih Metode Pembayaran Baru
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'Tunai', label: 'Tunai (Laci)' },
                    { val: 'Transfer', label: 'Transfer Bank' },
                    { val: 'QRIS', label: 'QRIS' },
                    { val: 'EDC', label: 'Debit / EDC' },
                    { val: 'Kasbon', label: 'Kasbon (Piutang)' }
                  ].map((m) => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setTargetNewMethod(m.val as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                        targetNewMethod === m.val
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {(targetNewMethod === 'Transfer' || targetNewMethod === 'QRIS' || targetNewMethod === 'EDC') && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Rekening Bank Tujuan
                  </label>
                  <select
                    value={targetNewBank}
                    onChange={(e) => setTargetNewBank(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500"
                  >
                    <option value="Mandiri">Bank Mandiri (123-00-998877-1)</option>
                    <option value="Artha Graha">Bank Artha Graha (880-12-334455-0)</option>
                    <option value="BCA">Bank BCA (800-99-112233-4)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Catatan Koreksi (Opsional)
                </label>
                <input
                  type="text"
                  value={methodNotes}
                  onChange={(e) => setMethodNotes(e.target.value)}
                  placeholder="Cth: Bukti transfer baru diterima kasir"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMethodModalTrx(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

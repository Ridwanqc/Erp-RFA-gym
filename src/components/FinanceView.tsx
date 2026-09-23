import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { Transaction, PettyCashItem, DailyClosingRecord, User } from '../types';
import { formatRp, getTimestamp, APP_TODAY, getDayDiff, formatDateIndo } from '../utils/formatters';
import { FinanceRevenueChart } from './FinanceRevenueChart';
import { PettyCashManagementView } from './PettyCashManagementView';
import { FinancialSummaryCard, FinancialSummaryData } from './FinancialSummaryCard';

interface FinanceViewProps {
  transactions: Transaction[];
  pettyCashList: PettyCashItem[];
  closingRecords: DailyClosingRecord[];
  currentUser: User | null;
  isStoreClosed: boolean;
  initialSubTab?: 'piutang' | 'bukubesar' | 'petty' | 'closing';
  initialSelectedPiutangId?: string;
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
  const [activeTab, setActiveTab] = useState<'piutang' | 'bukubesar' | 'petty' | 'closing'>(initialSubTab);

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
  const [physicalCashInput, setPhysicalCashInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosingPrintOpen, setIsClosingPrintOpen] = useState(false);
  const [closingAuditTab, setClosingAuditTab] = useState<'ALL' | 'Tunai' | 'Non-Tunai' | 'VOID'>('ALL');

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
  const [bukubesarStartDate, setBukubesarStartDate] = useState('');
  const [bukubesarEndDate, setBukubesarEndDate] = useState('');
  const [bukubesarDatePreset, setBukubesarDatePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | 'MONTH' | 'CUSTOM'>('ALL');

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

  // Selected Date Petty Cash Expense
  const selectedDatePettyExpenses = pettyCashList
    .filter(
      (p) =>
        p.date === closingDate ||
        p.date.includes(closingDate) ||
        (p.created_at && p.created_at.startsWith(closingDate))
    )
    .reduce(
      (sum, p) => sum + (p.total_expense !== undefined ? p.total_expense : p.amount || 0),
      0
    );

  // Initial Drawer Cash
  const openingDrawerCash = 500000; // Fixed default operational cash drawer
  const expectedSystemCash = openingDrawerCash + tunaiLaciKasir - selectedDatePettyExpenses;

  const inputCashNumber = Number(physicalCashInput) || 0;
  const cashVariance = physicalCashInput ? inputCashNumber - expectedSystemCash : 0;

  const isSelectedDateClosed = closingRecords.some((r) => r.date === closingDate) || (closingDate === APP_TODAY && isStoreClosed);

  // Handle Pay Installment
  const handleOpenPayModal = (trx: Transaction) => {
    setSelectedPiutang(trx);
    setPayAmount(String(trx.amountRemaining || 0));
    setPayMethod(trx.type === 'POS' ? 'Tunai' : 'Transfer');
  };

  // Buku Besar Filtered List
  const filteredBukubesarTrx = transactions.filter((trx) => {
    if (bukubesarTypeFilter === 'VOID') {
      if (trx.status !== 'VOID') return false;
    } else if (bukubesarTypeFilter !== 'ALL') {
      if (trx.type !== bukubesarTypeFilter) return false;
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
      return matchId || matchCust || matchDesc || matchMethod;
    }
    return true;
  });

  // Total Kas Masuk (Debit) dari Buku Besar yang tersaring (exclude VOID)
  const totalDebitFiltered = filteredBukubesarTrx
    .filter((t) => t.status !== 'VOID')
    .reduce((sum, t) => sum + (t.amountPaid || t.amount || 0), 0);

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

    const record: DailyClosingRecord = {
      id: 'DC-' + closingDate,
      date: closingDate,
      closedAt: getTimestamp(),
      cashierName: currentUser?.name || 'Kasir',
      revenue: totalOmset,
      trxCount: totalTrxCount,
      tunai: tunaiLaciKasir,
      nonTunai: nonTunaiMasuk,
      cashSales: tunaiLaciKasir,
      mandiriSales: mandiriTotal,
      arthaSales: arthaGrahaTotal,
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

  // Handle Clean Print of Daily Closing
  const handlePrintReport = () => {
    setIsClosingPrintOpen(true);
    setTimeout(() => {
      window.print();
    }, 150);
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
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-500" /> Modul Keuangan & Akuntansi Enterprise
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Buku Piutang & Cicilan, Buku Besar Arus Kas, Petty Cash, serta Rekonsiliasi Daily Closing
          </p>
        </div>

        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('piutang')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'piutang' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Buku Piutang & Cicilan
          </button>
          <button
            onClick={() => setActiveTab('bukubesar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'bukubesar' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Buku Besar Transaksi
          </button>
          <button
            onClick={() => setActiveTab('petty')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'petty' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Petty Cash ({pettyCashList.length})
          </button>
          <button
            onClick={() => setActiveTab('closing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'closing' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daily Closing Kasir
          </button>
        </div>
      </div>

      {/* 7-Day Revenue Trends Chart: Total Payments vs New Installment Income */}
      <FinanceRevenueChart transactions={transactions} />

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
                            {!isLunas && (
                              <button
                                onClick={() => handleOpenPayModal(t)}
                                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition"
                              >
                                Bayar Cicilan
                              </button>
                            )}
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

              {/* Right: Date Filter Inputs & Presets + Print */}
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

                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700/60 shrink-0"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Cetak Buku Besar</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-800/80">
              {/* Category Pills */}
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
              </div>

              {/* Search input */}
              <div className="relative min-w-[240px] max-w-sm flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={bukubesarSearch}
                  onChange={(e) => setBukubesarSearch(e.target.value)}
                  placeholder="Cari ID, member, uraian..."
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
          </div>

          {/* Ledger Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <table className="w-full text-left whitespace-nowrap min-w-[950px]">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Waktu / ID</th>
                    <th className="py-3 px-4">Kategori / Tipe</th>
                    <th className="py-3 px-4">Uraian Transaksi</th>
                    <th className="py-3 px-4">Pelanggan / Member</th>
                    <th className="py-3 px-4">Metode / Rekening</th>
                    <th className="py-3 px-4 text-right">Debit (Kas Masuk)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                  {filteredBukubesarTrx.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500">
                        <AlertCircle className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                        <p className="font-bold text-zinc-400">Tidak ada transaksi yang cocok</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter kategori Anda</p>
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
                              {/* 1. Tombol Cetak Ulang */}
                              <button
                                onClick={() => handleReprint(trx)}
                                title="Cetak Ulang Struk / Nota Pembayaran"
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-400 hover:text-orange-400 border border-zinc-700/60 transition flex items-center gap-1 text-[11px]"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline font-bold">Cetak</span>
                              </button>

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
                      <td colSpan={5} className="py-3.5 px-4 text-right">
                        Total Kas Masuk (Debit Tersaring):
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400 text-sm">
                        {formatRp(totalDebitFiltered)}
                      </td>
                      <td colSpan={2} className="py-3.5 px-4 text-center text-zinc-400 font-normal text-[11px]">
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
                  id="btn-print-closing-report"
                  onClick={handlePrintReport}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
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
                    id="btn-card-print-report"
                    onClick={handlePrintReport}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
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
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                    <span className="text-zinc-400 font-medium">1. Saldo Modal Awal Laci Kas:</span>
                    <span className="font-bold text-white font-mono">{formatRp(openingDrawerCash)}</span>
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
                      <span className="text-[10px] text-zinc-500">Modal Awal (Rp 500rb) + Masuk Tunai - Petty Cash</span>
                    </div>
                    <span className="text-xl font-black text-orange-400 font-mono">{formatRp(expectedSystemCash)}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Transactions List on Closing Date */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Detail Transaksi Tanggal {closingDate}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Daftar rincian transaksi yang membentuk ringkasan finansial di atas.
                    </p>
                  </div>

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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {targetClosingTrx
                        .filter((t) => {
                          if (closingAuditTab === 'Tunai') return t.method === 'Tunai' && t.status !== 'VOID';
                          if (closingAuditTab === 'Non-Tunai') return t.method !== 'Tunai' && t.method !== 'Kasbon' && t.status !== 'VOID';
                          if (closingAuditTab === 'VOID') return t.status === 'VOID';
                          return true;
                        })
                        .map((trx) => (
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
                          </tr>
                        ))}
                      {targetClosingTrx.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500">
                            Tidak ada transaksi tercatat pada tanggal {closingDate}.
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
                          <span className="font-bold text-white">{cr.date}</span>
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

          {/* PRINT MODAL: LAPORAN TUTUP BUKU HARIAN KASIR */}
          {isClosingPrintOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:static print:inset-auto print:z-auto print:p-0 print:m-0 print:bg-white print:overflow-visible">
              <div
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 print:bg-zinc-100 p-3.5 rounded-2xl text-xs mb-5 border border-zinc-800 print:border-zinc-300">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Tanggal Operasional:</span>
                    <span className="font-bold text-white print:text-black">{formatDateIndo(closingDate)}</span>
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
                <div className="mt-6 flex justify-end gap-3 print:hidden">
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
                    onClick={() => window.print()}
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" /> Cetak Sekarang (Print)
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

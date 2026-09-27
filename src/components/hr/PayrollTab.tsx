import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Download,
  Printer,
  FileText,
  UserCheck,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Edit3,
  ShieldCheck,
  HeartPulse,
  Save,
  X,
  Plus,
  RotateCcw,
  Percent,
  Sparkles,
  Info,
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  User,
  Schedule,
  Transaction,
  StaffAttendance,
  PackageItem,
  TrainerCommissionRecord,
  SalesCommissionRecord,
  PayrollAdjustment
} from '../../types';
import { formatRp, APP_TODAY, formatDateIndo } from '../../utils/formatters';

interface PayrollTabProps {
  staffUsers: User[];
  schedules: Schedule[];
  transactions: Transaction[];
  staffAttendance: StaffAttendance[];
  packages?: PackageItem[];
  trainerCommissions?: TrainerCommissionRecord[];
  salesCommissions?: SalesCommissionRecord[];
  onSaveStaff?: (user: User, isNew: boolean) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const STORAGE_PAYROLL_ADJUSTMENTS = 'gympro_payroll_adjustments';

export const PayrollTab: React.FC<PayrollTabProps> = ({
  staffUsers,
  schedules,
  transactions,
  staffAttendance,
  packages = [],
  trainerCommissions = [],
  salesCommissions = [],
  onSaveStaff,
  showToast
}) => {
  const currentMonthKey = APP_TODAY.substring(0, 7); // e.g. "2026-09"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<any | null>(null);
  const [editingPayrollItem, setEditingPayrollItem] = useState<any | null>(null);

  // Stored adjustments per staff & month
  const [adjustments, setAdjustments] = useState<Record<string, PayrollAdjustment>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PAYROLL_ADJUSTMENTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveAdjustment = (adj: PayrollAdjustment) => {
    const key = `${adj.month}_${adj.staffId}`;
    const next = { ...adjustments, [key]: adj };
    setAdjustments(next);
    try {
      localStorage.setItem(STORAGE_PAYROLL_ADJUSTMENTS, JSON.stringify(next));
    } catch (e) {
      console.warn('Gagal menyimpan payroll adjustments:', e);
    }
  };

  // Calculate detailed payroll items per staff for selected month
  const payrollList = useMemo(() => {
    return staffUsers.map((staff) => {
      const adjKey = `${selectedMonth}_${staff.id}`;
      const adj = adjustments[adjKey];

      // 1. PT Completed Sessions
      const ptDone = schedules.filter(
        (s) =>
          (s.trainer === staff.name || s.trainer === staff.id) &&
          s.status === 'Selesai' &&
          s.valMember &&
          s.valTrainer &&
          s.valStaf
      );

      // PT Commission from recorded package commissions or session-based rates
      let ptCommissionCalculated = 0;
      const staffPtComms = trainerCommissions.filter(
        (tc) => (tc.trainerId === staff.id || tc.trainerName === staff.name) && tc.status !== 'CANCELLED'
      );
      if (staffPtComms.length > 0) {
        ptCommissionCalculated = staffPtComms.reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);
      } else {
        // Fallback: per-session standard 40.000
        ptCommissionCalculated = ptDone.length * 40000;
      }
      const ptCommission = adj?.ptCommissionAdjustment !== undefined ? adj.ptCommissionAdjustment : ptCommissionCalculated;

      // 2. Sales PIC Bonus
      const sales = transactions.filter((t) => {
        const pids = t.picIds && t.picIds.length > 0 ? t.picIds : (t.picId ? [t.picId] : []);
        return pids.includes(staff.id) && t.status !== 'VOID';
      });
      const totalSalesAmount = sales.reduce((acc, curr) => acc + (curr.amountPaid || curr.amount || 0), 0);

      let salesBonusCalculated = 0;
      const staffSalesRecs = salesCommissions.filter((sc) => sc.staffId === staff.id);
      if (staffSalesRecs.length > 0) {
        salesBonusCalculated = staffSalesRecs.reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);
      } else {
        salesBonusCalculated = sales.reduce((acc, curr) => {
          const matchedPkg = packages.find((p) => curr.desc.includes(p.name));
          const sRate = matchedPkg?.salesCommissionRate ?? (curr.type === 'Membership' ? 4 : 3);
          const pids = curr.picIds && curr.picIds.length > 0 ? curr.picIds : (curr.picId ? [curr.picId] : []);
          const share = pids.length > 0 ? 1 / pids.length : 1;
          const comm = matchedPkg?.salesCommissionNominal
            ? Math.round(matchedPkg.salesCommissionNominal * share)
            : Math.round((curr.amountPaid || curr.amount || 0) * (sRate / 100) * share);
          return acc + comm;
        }, 0);
      }
      const salesBonus = adj?.salesBonusAdjustment !== undefined ? adj.salesBonusAdjustment : salesBonusCalculated;

      // 3. Overtime pay: Rp 25.000 / hour from staff attendance records
      const staffAtt = staffAttendance.filter((a) => a.staffId === staff.id || a.staffName === staff.name);
      const totalOvertimeHours = staffAtt.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
      const overtimePayCalculated = Math.round(totalOvertimeHours * 25000);
      const overtimePay = adj?.overtimePayAdjustment !== undefined ? adj.overtimePayAdjustment : overtimePayCalculated;

      // Additional special bonus / incentive
      const specialBonus = adj?.bonusAdjustment || 0;
      const specialBonusNotes = adj?.bonusNotes || '';

      // 4. Late deductions: Rp 1.000 / min if late minutes > 15
      const totalLateMinutes = staffAtt.reduce((acc, curr) => {
        const m = curr.lateMinutes || 0;
        return m > 15 ? acc + (m - 15) : acc;
      }, 0);
      const lateDeductionCalculated = totalLateMinutes * 1000;
      const lateDeduction = adj?.lateDeductionAdjustment !== undefined ? adj.lateDeductionAdjustment : lateDeductionCalculated;

      // 5. Base Salary & Allowances
      const baseSalary = adj?.baseSalary !== undefined ? adj.baseSalary : (staff.baseSalary || 3000000);
      const allowance = adj?.allowance !== undefined ? adj.allowance : (staff.allowance || 500000);

      // 6. POTONGAN BPJS (BPJS Kesehatan & BPJS Ketenagakerjaan)
      // Standar Regulasi Indonesia:
      // - BPJS Kesehatan: 1% dari Gaji Pokok (atau nominal flat)
      // - BPJS Ketenagakerjaan (JHT/JP): 2% dari Gaji Pokok (atau nominal flat)
      let bpjsKesehatan = 0;
      if (adj?.bpjsKesehatan !== undefined) {
        bpjsKesehatan = adj.bpjsKesehatan;
      } else if (staff.bpjsKesehatan !== undefined) {
        bpjsKesehatan = staff.bpjsKesehatan;
      } else if (staff.bpjsKesehatanActive !== false) {
        bpjsKesehatan = Math.round(baseSalary * 0.01); // 1% default
      }

      let bpjsKetenagakerjaan = 0;
      if (adj?.bpjsKetenagakerjaan !== undefined) {
        bpjsKetenagakerjaan = adj.bpjsKetenagakerjaan;
      } else if (staff.bpjsKetenagakerjaan !== undefined) {
        bpjsKetenagakerjaan = staff.bpjsKetenagakerjaan;
      } else if (staff.bpjsKetenagakerjaanActive !== false) {
        bpjsKetenagakerjaan = Math.round(baseSalary * 0.02); // 2% JHT default
      }

      const totalBpjsDeduction = bpjsKesehatan + bpjsKetenagakerjaan;

      // 7. Other deductions (Tax PPh21, Kasbon, etc)
      const otherDeductions = (adj?.otherDeductions || 0) + (adj?.taxDeduction || staff.taxDeduction || 0) + (staff.loanDeduction || 0);
      const otherDeductionNotes = adj?.otherDeductionNotes || '';

      // 8. Totals & Net Take Home Pay
      const grossIncome = baseSalary + allowance + ptCommission + salesBonus + overtimePay + specialBonus;
      const totalDeductions = totalBpjsDeduction + lateDeduction + otherDeductions;
      const netSalary = Math.max(0, grossIncome - totalDeductions);

      return {
        staff,
        baseSalary,
        allowance,
        ptDoneCount: ptDone.length,
        ptCommission,
        ptCommissionCalculated,
        salesCount: sales.length,
        totalSalesAmount,
        salesBonus,
        salesBonusCalculated,
        totalOvertimeHours,
        overtimePay,
        overtimePayCalculated,
        specialBonus,
        specialBonusNotes,
        totalLateMinutes,
        lateDeduction,
        lateDeductionCalculated,
        // BPJS breakdown
        bpjsKesehatan,
        bpjsKetenagakerjaan,
        totalBpjsDeduction,
        bpjsNumber: staff.bpjsNumber || '',
        otherDeductions,
        otherDeductionNotes,
        grossIncome,
        totalDeductions,
        netSalary,
        hasAdjustment: Boolean(adj)
      };
    });
  }, [
    staffUsers,
    schedules,
    transactions,
    staffAttendance,
    packages,
    trainerCommissions,
    salesCommissions,
    adjustments,
    selectedMonth
  ]);

  // Overall totals
  const totalPayrollBudget = useMemo(() => {
    return payrollList.reduce((acc, curr) => acc + curr.netSalary, 0);
  }, [payrollList]);

  const totalBpjsBudget = useMemo(() => {
    return payrollList.reduce((acc, curr) => acc + curr.totalBpjsDeduction, 0);
  }, [payrollList]);

  // Keep selectedStaffForSlip synchronized if an adjustment was made
  useEffect(() => {
    if (selectedStaffForSlip) {
      const refreshed = payrollList.find((p) => p.staff.id === selectedStaffForSlip.staff.id);
      if (refreshed) {
        setSelectedStaffForSlip(refreshed);
      }
    }
  }, [payrollList]);

  // Export to CSV with full BPJS breakdown
  const handleExportPayrollCSV = () => {
    const headers = [
      'ID Karyawan',
      'Nama Karyawan',
      'Jabatan / Role',
      'Bank',
      'Nomor Rekening',
      'Gaji Pokok',
      'Tunjangan',
      'Sesi PT Selesai',
      'Komisi PT',
      'Bonus Sales',
      'Uang Lembur',
      'Bonus Spesial',
      'Potongan BPJS Kesehatan (1%)',
      'Potongan BPJS Ketenagakerjaan (2%)',
      'Total Potongan BPJS',
      'Potongan Terlambat / Absensi',
      'Potongan Lain / Kasbon',
      'Total Seluruh Potongan',
      'Take Home Pay (Gaji Bersih)'
    ];

    const rows = payrollList.map((p) => [
      `"${p.staff.id}"`,
      `"${p.staff.name}"`,
      `"${p.staff.roleName}"`,
      `"${p.staff.bankName || 'BCA'}"`,
      `"${p.staff.bankAccount || '-'}"`,
      p.baseSalary,
      p.allowance,
      p.ptDoneCount,
      p.ptCommission,
      p.salesBonus,
      p.overtimePay,
      p.specialBonus,
      p.bpjsKesehatan,
      p.bpjsKetenagakerjaan,
      p.totalBpjsDeduction,
      p.lateDeduction,
      p.otherDeductions,
      p.totalDeductions,
      p.netSalary
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Payroll_Karyawan_RFA_Gym_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Berhasil', `Rekap payroll periode ${selectedMonth} berhasil diunduh format CSV.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Total Estimasi Payroll</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-orange-400">{formatRp(totalPayrollBudget)}</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 font-mono">Periode Bulan ({selectedMonth})</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Total Potongan BPJS</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-blue-400">{formatRp(totalBpjsBudget)}</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 font-medium flex items-center gap-1">
            <HeartPulse className="w-3 h-3 text-blue-400" /> BPJS Kesehatan & Ketenagakerjaan
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Total Karyawan Aktif</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-white">{staffUsers.length}</span>
            <span className="text-xs text-zinc-500">Staf Terdaftar</span>
          </div>
          <p className="text-[10px] text-emerald-400/90 mt-2 font-semibold">Semua memiliki akun operasional</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Komisi & Insentif Performa</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              {formatRp(payrollList.reduce((acc, curr) => acc + curr.ptCommission + curr.salesBonus + curr.overtimePay + curr.specialBonus, 0))}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">Komisi PT + Bonus Closing + Lembur</p>
        </div>
      </div>

      {/* 2. ACTION CONTROLS & MONTH SELECTOR */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Tabel Rincian Payroll & Take Home Pay Karyawan
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dilengkapi tombol edit komponen gaji, potongan BPJS (Kes & TK), komisi sesi, dan cetak slip resmi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-700">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleExportPayrollCSV}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Download CSV
          </button>

          <button
            type="button"
            onClick={() => {
              window.print();
              showToast('Cetak Payroll', 'Tabel payroll siap dicetak.', 'info');
            }}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" /> Print
          </button>
        </div>
      </div>

      {/* 3. PAYROLL TABLE WITH EDIT & BPJS COLUMNS */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left whitespace-nowrap min-w-[1100px]">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-3">Gaji Pokok</th>
                <th className="py-3 px-3">Tunjangan</th>
                <th className="py-3 px-3">Komisi PT</th>
                <th className="py-3 px-3">Bonus Sales</th>
                <th className="py-3 px-3">Lembur & Bonus</th>
                <th className="py-3 px-3 text-blue-400">Potongan BPJS</th>
                <th className="py-3 px-3 text-rose-400">Potongan Lain</th>
                <th className="py-3 px-3 font-bold text-white">Take Home Pay</th>
                <th className="py-3 px-4 text-center">Aksi & Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
              {payrollList.map((p) => (
                <tr key={p.staff.id} className="hover:bg-zinc-800/30 transition">
                  {/* Staff Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-white text-xs">{p.staff.name}</p>
                          {p.hasAdjustment && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30" title="Komponen gaji disesuaikan manual bulan ini">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {p.staff.roleName} ({p.staff.id})
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Base Salary */}
                  <td className="py-3 px-3 font-mono text-zinc-300">{formatRp(p.baseSalary)}</td>

                  {/* Allowance */}
                  <td className="py-3 px-3 font-mono text-zinc-400">{formatRp(p.allowance)}</td>

                  {/* PT Commission */}
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    {p.ptCommission > 0 ? (
                      <span>
                        {formatRp(p.ptCommission)}{' '}
                        {p.ptDoneCount > 0 && <span className="text-[10px] text-zinc-500">({p.ptDoneCount} sesi)</span>}
                      </span>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>

                  {/* Sales Bonus */}
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    {p.salesBonus > 0 ? (
                      <span>{formatRp(p.salesBonus)}</span>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>

                  {/* Overtime & Special Bonus */}
                  <td className="py-3 px-3 font-mono text-purple-400">
                    {p.overtimePay > 0 || p.specialBonus > 0 ? (
                      <div>
                        {p.overtimePay > 0 && (
                          <span>
                            {formatRp(p.overtimePay)}{' '}
                            <span className="text-[10px] text-zinc-500">({p.totalOvertimeHours.toFixed(1)}j)</span>
                          </span>
                        )}
                        {p.specialBonus > 0 && (
                          <div className="text-[10px] text-amber-300">
                            +{formatRp(p.specialBonus)} <span className="text-zinc-500">(Bonus)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>

                  {/* BPJS DEDUCTIONS (Kesehatan + Ketenagakerjaan) */}
                  <td className="py-3 px-3 font-mono text-blue-400">
                    {p.totalBpjsDeduction > 0 ? (
                      <div>
                        <span className="font-bold">-{formatRp(p.totalBpjsDeduction)}</span>
                        <div className="text-[9.5px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <span>Kes: {formatRp(p.bpjsKesehatan)}</span>
                          <span>•</span>
                          <span>TK: {formatRp(p.bpjsKetenagakerjaan)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-600 font-sans text-[11px]">Rp 0 (Non-Aktif)</span>
                    )}
                  </td>

                  {/* Other Deductions (Late, Loan, Tax) */}
                  <td className="py-3 px-3 font-mono text-rose-400">
                    {p.lateDeduction > 0 || p.otherDeductions > 0 ? (
                      <div>
                        <span>-{formatRp(p.lateDeduction + p.otherDeductions)}</span>
                        {p.lateDeduction > 0 && (
                          <div className="text-[9.5px] text-zinc-400">
                            Absen: -{formatRp(p.lateDeduction)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600">0</span>
                    )}
                  </td>

                  {/* Take Home Pay */}
                  <td className="py-3 px-3 font-mono font-black text-white text-sm">
                    {formatRp(p.netSalary)}
                  </td>

                  {/* Actions: Edit & Cetak Slip */}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* TOMBOL EDIT GAJI & BPJS */}
                      <button
                        type="button"
                        onClick={() => setEditingPayrollItem(p)}
                        className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer active:scale-95"
                        title="Edit gaji pokok, komisi, dan potongan BPJS"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Gaji
                      </button>

                      {/* TOMBOL CETAK SLIP GAJI */}
                      <button
                        type="button"
                        onClick={() => setSelectedStaffForSlip(p)}
                        className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer active:scale-95"
                        title="Buka & Cetak Slip Gaji Resmi"
                      >
                        <FileText className="w-3 h-3" /> Slip Gaji
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: EDIT KOMPONEN GAJI & POTONGAN BPJS */}
      {editingPayrollItem && (
        <EditPayrollModal
          item={editingPayrollItem}
          month={selectedMonth}
          onClose={() => setEditingPayrollItem(null)}
          onSave={(updatedAdj, saveToStaffMaster) => {
            saveAdjustment(updatedAdj);

            if (saveToStaffMaster && onSaveStaff) {
              const updatedStaff: User = {
                ...editingPayrollItem.staff,
                baseSalary: updatedAdj.baseSalary !== undefined ? updatedAdj.baseSalary : editingPayrollItem.staff.baseSalary,
                allowance: updatedAdj.allowance !== undefined ? updatedAdj.allowance : editingPayrollItem.staff.allowance,
                bpjsKesehatan: updatedAdj.bpjsKesehatan !== undefined ? updatedAdj.bpjsKesehatan : editingPayrollItem.staff.bpjsKesehatan,
                bpjsKetenagakerjaan: updatedAdj.bpjsKetenagakerjaan !== undefined ? updatedAdj.bpjsKetenagakerjaan : editingPayrollItem.staff.bpjsKetenagakerjaan,
                bpjsNumber: updatedAdj.notes?.includes('BPJS:') ? updatedAdj.notes.split('BPJS:')[1].trim() : editingPayrollItem.staff.bpjsNumber
              };
              onSaveStaff(updatedStaff, false);
            }

            showToast(
              'Gaji & BPJS Disimpan',
              `Komponen payroll & potongan BPJS untuk ${editingPayrollItem.staff.name} berhasil disimpan.`,
              'success'
            );
            setEditingPayrollItem(null);
          }}
        />
      )}

      {/* 5. MODAL: SLIP GAJI PRINTABLE DENGAN RINCIAN BPJS */}
      {selectedStaffForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Slip Gaji Karyawan Resmi</h3>
                  <p className="text-[11px] text-zinc-400">GymPro Fitness & Wellness Center</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffForSlip(null)}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Slip Paper Printable Area */}
            <div id="payslip-print" className="mt-4 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs space-y-4">
              {/* Slip Header */}
              <div className="text-center pb-3 border-b border-zinc-800 space-y-1">
                <h2 className="text-base font-black text-white tracking-wider">GYMPRO FITNESS & WELLNESS CENTER</h2>
                <p className="text-[10px] text-zinc-400">Jl. Boulevard Artha Gading Blok A-3 No. 88, Jakarta Utara</p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-[10px] uppercase tracking-wider">
                  SLIP PEMBAYARAN GAJI — BULAN {selectedMonth}
                </div>
              </div>

              {/* Employee Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Nama Karyawan:</span>
                  <span className="font-bold text-white text-xs">{selectedStaffForSlip.staff.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">ID / Jabatan:</span>
                  <span className="font-bold text-white">
                    {selectedStaffForSlip.staff.id} / {selectedStaffForSlip.staff.roleName}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Status / Shift:</span>
                  <span className="text-zinc-300">
                    {selectedStaffForSlip.staff.employmentStatus || 'Tetap'} (Shift {selectedStaffForSlip.staff.shift})
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Rekening Pembayaran:</span>
                  <span className="text-zinc-300 font-mono">
                    {selectedStaffForSlip.staff.bankName || 'BCA'} {selectedStaffForSlip.staff.bankAccount ? `(${selectedStaffForSlip.staff.bankAccount})` : ''}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Kepesertaan BPJS:</span>
                  <span className="font-semibold text-blue-300 flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-blue-400" />
                    BPJS Kesehatan & Ketenagakerjaan (Aktif)
                    {selectedStaffForSlip.bpjsNumber ? ` • ${selectedStaffForSlip.bpjsNumber}` : ''}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="space-y-3">
                {/* 1. Earnings */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>A. Penghasilan (Earnings):</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {formatRp(selectedStaffForSlip.grossIncome)}
                    </span>
                  </p>
                  <div className="space-y-1.5 pl-2 font-mono text-[11px] bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Gaji Pokok:</span>
                      <span className="text-white">{formatRp(selectedStaffForSlip.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Tunjangan Operasional:</span>
                      <span className="text-white">{formatRp(selectedStaffForSlip.allowance)}</span>
                    </div>
                    {selectedStaffForSlip.ptCommission > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>
                          Komisi Personal Trainer ({selectedStaffForSlip.ptDoneCount} sesi):
                        </span>
                        <span>+{formatRp(selectedStaffForSlip.ptCommission)}</span>
                      </div>
                    )}
                    {selectedStaffForSlip.salesBonus > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Bonus Closing PIC Sales:</span>
                        <span>+{formatRp(selectedStaffForSlip.salesBonus)}</span>
                      </div>
                    )}
                    {selectedStaffForSlip.overtimePay > 0 && (
                      <div className="flex justify-between text-purple-400">
                        <span>
                          Uang Lembur ({selectedStaffForSlip.totalOvertimeHours.toFixed(1)} Jam):
                        </span>
                        <span>+{formatRp(selectedStaffForSlip.overtimePay)}</span>
                      </div>
                    )}
                    {selectedStaffForSlip.specialBonus > 0 && (
                      <div className="flex justify-between text-amber-300">
                        <span>Insentif / Bonus Tambahan:</span>
                        <span>+{formatRp(selectedStaffForSlip.specialBonus)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Deductions (BPJS & Others) */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>B. Potongan (Deductions):</span>
                    <span className="text-rose-400 font-mono font-bold">
                      -{formatRp(selectedStaffForSlip.totalDeductions)}
                    </span>
                  </p>
                  <div className="space-y-1.5 pl-2 font-mono text-[11px] bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                    {/* POTONGAN BPJS KESEHATAN */}
                    <div className="flex justify-between text-blue-300">
                      <span>• Potongan BPJS Kesehatan (1%):</span>
                      <span>-{formatRp(selectedStaffForSlip.bpjsKesehatan)}</span>
                    </div>

                    {/* POTONGAN BPJS KETENAGAKERJAAN */}
                    <div className="flex justify-between text-blue-300">
                      <span>• Potongan BPJS Ketenagakerjaan (JHT/JP 2%):</span>
                      <span>-{formatRp(selectedStaffForSlip.bpjsKetenagakerjaan)}</span>
                    </div>

                    {/* Subtotal BPJS */}
                    <div className="flex justify-between text-xs font-bold text-blue-400 border-t border-dashed border-zinc-800 pt-1">
                      <span>Total Iuran BPJS Karyawan:</span>
                      <span>-{formatRp(selectedStaffForSlip.totalBpjsDeduction)}</span>
                    </div>

                    {/* Potongan Lain */}
                    {selectedStaffForSlip.lateDeduction > 0 && (
                      <div className="flex justify-between text-rose-400 pt-1">
                        <span>• Potongan Keterlambatan Absensi:</span>
                        <span>-{formatRp(selectedStaffForSlip.lateDeduction)}</span>
                      </div>
                    )}

                    {selectedStaffForSlip.otherDeductions > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>• Potongan Lain / Kasbon:</span>
                        <span>-{formatRp(selectedStaffForSlip.otherDeductions)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Net Total Take Home Pay */}
                <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex justify-between items-baseline">
                  <div>
                    <span className="font-black text-white text-xs uppercase block">Total Gaji Bersih (Take Home Pay):</span>
                    <span className="text-[10px] text-zinc-400">Gaji Kotor - Total Potongan (BPJS & Absen)</span>
                  </div>
                  <span className="font-mono font-black text-orange-400 text-lg sm:text-xl">
                    {formatRp(selectedStaffForSlip.netSalary)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 text-center text-[10px] text-zinc-400">
                <div>
                  <p>Diterima Oleh,</p>
                  <div className="h-10" />
                  <p className="font-bold text-white uppercase">{selectedStaffForSlip.staff.name}</p>
                  <p>Karyawan</p>
                </div>
                <div>
                  <p>Jakarta, {APP_TODAY}</p>
                  <div className="h-10" />
                  <p className="font-bold text-white uppercase">Manajemen HR & Finance</p>
                  <p>GymPro Enterprise</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-800 mt-4">
              {/* TOMBOL EDIT LANGSUNG DARI SLIP GAJI */}
              <button
                type="button"
                onClick={() => {
                  const staffTarget = selectedStaffForSlip;
                  setSelectedStaffForSlip(null);
                  setEditingPayrollItem(staffTarget);
                }}
                className="px-3 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 border border-blue-500/30 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Komponen Slip
              </button>

              <button
                type="button"
                onClick={() => setSelectedStaffForSlip(null)}
                className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition text-xs cursor-pointer ml-auto"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast('Cetak Slip Gaji', `Slip gaji ${selectedStaffForSlip.staff.name} siap dicetak.`, 'success');
                }}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Slip Resmi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: EDIT PAYROLL MODAL (DENGAN FORM POTONGAN BPJS LENGKAP)
// ---------------------------------------------------------------------------
interface EditPayrollModalProps {
  item: any;
  month: string;
  onClose: () => void;
  onSave: (adj: PayrollAdjustment, saveToMaster: boolean) => void;
}

const EditPayrollModal: React.FC<EditPayrollModalProps> = ({ item, month, onClose, onSave }) => {
  const [baseSalary, setBaseSalary] = useState<number>(item.baseSalary || 3000000);
  const [allowance, setAllowance] = useState<number>(item.allowance || 500000);
  const [ptCommission, setPtCommission] = useState<number>(item.ptCommission || 0);
  const [salesBonus, setSalesBonus] = useState<number>(item.salesBonus || 0);
  const [overtimePay, setOvertimePay] = useState<number>(item.overtimePay || 0);
  const [specialBonus, setSpecialBonus] = useState<number>(item.specialBonus || 0);
  const [specialBonusNotes, setSpecialBonusNotes] = useState<string>(item.specialBonusNotes || '');

  // POTONGAN BPJS
  const [bpjsKesehatan, setBpjsKesehatan] = useState<number>(item.bpjsKesehatan || Math.round((item.baseSalary || 3000000) * 0.01));
  const [bpjsKetenagakerjaan, setBpjsKetenagakerjaan] = useState<number>(item.bpjsKetenagakerjaan || Math.round((item.baseSalary || 3000000) * 0.02));
  const [bpjsNumber, setBpjsNumber] = useState<string>(item.bpjsNumber || '');

  // POTONGAN LAINNYA
  const [lateDeduction, setLateDeduction] = useState<number>(item.lateDeduction || 0);
  const [otherDeductions, setOtherDeductions] = useState<number>(item.otherDeductions || 0);
  const [otherDeductionNotes, setOtherDeductionNotes] = useState<string>(item.otherDeductionNotes || '');

  // SAVE TO PROFILE MASTER OPTION
  const [saveToMaster, setSaveToMaster] = useState<boolean>(true);

  // Quick BPJS Presets
  const applyBpjsPreset = (type: 'standard_1_2' | 'standard_1_3' | 'flat_50_100' | 'free') => {
    if (type === 'standard_1_2') {
      setBpjsKesehatan(Math.round(baseSalary * 0.01)); // 1%
      setBpjsKetenagakerjaan(Math.round(baseSalary * 0.02)); // 2% JHT
    } else if (type === 'standard_1_3') {
      setBpjsKesehatan(Math.round(baseSalary * 0.01)); // 1%
      setBpjsKetenagakerjaan(Math.round(baseSalary * 0.03)); // 3% JHT + JP
    } else if (type === 'flat_50_100') {
      setBpjsKesehatan(50000);
      setBpjsKetenagakerjaan(100000);
    } else if (type === 'free') {
      setBpjsKesehatan(0);
      setBpjsKetenagakerjaan(0);
    }
  };

  // Real-time calculations
  const totalBpjs = Number(bpjsKesehatan) + Number(bpjsKetenagakerjaan);
  const grossTotal = Number(baseSalary) + Number(allowance) + Number(ptCommission) + Number(salesBonus) + Number(overtimePay) + Number(specialBonus);
  const totalDeductions = totalBpjs + Number(lateDeduction) + Number(otherDeductions);
  const takeHomePay = Math.max(0, grossTotal - totalDeductions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const adj: PayrollAdjustment = {
      staffId: item.staff.id,
      month: month,
      baseSalary: Number(baseSalary),
      allowance: Number(allowance),
      ptCommissionAdjustment: Number(ptCommission),
      salesBonusAdjustment: Number(salesBonus),
      overtimePayAdjustment: Number(overtimePay),
      bonusAdjustment: Number(specialBonus),
      bonusNotes: specialBonusNotes,
      bpjsKesehatan: Number(bpjsKesehatan),
      bpjsKetenagakerjaan: Number(bpjsKetenagakerjaan),
      lateDeductionAdjustment: Number(lateDeduction),
      otherDeductions: Number(otherDeductions),
      otherDeductionNotes: otherDeductionNotes,
      notes: bpjsNumber ? `BPJS: ${bpjsNumber}` : '',
      updatedAt: new Date().toISOString()
    };

    onSave(adj, saveToMaster);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        {/* Header Modal */}
        <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-white">Edit Komponen Payroll & Potongan BPJS</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Karyawan: <strong className="text-white">{item.staff.name}</strong> ({item.staff.roleName} • {item.staff.id}) — Periode <strong>{month}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* SECTION 1: GAJI POKOK & TUNJANGAN */}
          <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> 1. Gaji Pokok & Tunjangan Operasional
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Gaji Pokok (Base Salary)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-white focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Tunjangan (Allowance)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={allowance}
                    onChange={(e) => setAllowance(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-white focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: KOMISI & INSENTIF */}
          <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> 2. Komisi, Lembur & Insentif
              </h4>
              <span className="text-[10px] text-zinc-500">Nilai otomatis tersinkron data sesi & transaksi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Komisi PT ({item.ptDoneCount} Sesi)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={ptCommission}
                    onChange={(e) => setPtCommission(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Bonus Sales PIC
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={salesBonus}
                    onChange={(e) => setSalesBonus(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Uang Lembur ({item.totalOvertimeHours.toFixed(1)} Jam)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={overtimePay}
                    onChange={(e) => setOvertimePay(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-purple-400 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Special Bonus / THR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Bonus Insentif Tambahan (THR/Reward)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={specialBonus}
                    onChange={(e) => setSpecialBonus(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-amber-300 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Keterangan Bonus
                </label>
                <input
                  type="text"
                  value={specialBonusNotes}
                  onChange={(e) => setSpecialBonusNotes(e.target.value)}
                  placeholder="Misal: Reward Sales Tertinggi / THR Lebaran"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: POTONGAN BPJS (KESEHATAN & KETENAGAKERJAAN) */}
          <div className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-blue-400" /> 3. Potongan Iuran BPJS Karyawan
              </h4>

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-zinc-400">Preset:</span>
                <button
                  type="button"
                  onClick={() => applyBpjsPreset('standard_1_2')}
                  className="px-2 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer"
                  title="Standar Nasional: 1% BPJS Kesehatan + 2% BPJS Ketenagakerjaan (JHT)"
                >
                  Standar 1% + 2%
                </button>
                <button
                  type="button"
                  onClick={() => applyBpjsPreset('standard_1_3')}
                  className="px-2 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer"
                  title="Standar Lengkap: 1% BPJS Kesehatan + 3% BPJS Ketenagakerjaan (JHT + JP)"
                >
                  Lengkap 1% + 3%
                </button>
                <button
                  type="button"
                  onClick={() => applyBpjsPreset('free')}
                  className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer"
                >
                  Nol (0)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1 flex justify-between">
                  <span>Potongan BPJS Kesehatan</span>
                  <span className="text-zinc-400 font-mono">(1% Gaji: {formatRp(Math.round(baseSalary * 0.01))})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={bpjsKesehatan}
                    onChange={(e) => setBpjsKesehatan(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-blue-500/40 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-blue-300 focus:border-blue-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1 flex justify-between">
                  <span>Potongan BPJS Ketenagakerjaan</span>
                  <span className="text-zinc-400 font-mono">(2% JHT: {formatRp(Math.round(baseSalary * 0.02))})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={bpjsKetenagakerjaan}
                    onChange={(e) => setBpjsKetenagakerjaan(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-blue-500/40 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-blue-300 focus:border-blue-400 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-500/20 items-center">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Nomor Kartu BPJS Karyawan (Opsional)
                </label>
                <input
                  type="text"
                  value={bpjsNumber}
                  onChange={(e) => setBpjsNumber(e.target.value)}
                  placeholder="Misal: 0001234567890"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div className="p-2.5 bg-blue-900/30 rounded-xl border border-blue-500/30 flex justify-between items-center text-xs">
                <span className="font-bold text-blue-200">Total Potongan BPJS:</span>
                <span className="font-mono font-black text-blue-300 text-sm">
                  -{formatRp(totalBpjs)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: POTONGAN LAINNYA (ABSENSI & KASBON) */}
          <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> 4. Potongan Absensi & Lainnya
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Potongan Keterlambatan / Absen
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={lateDeduction}
                    onChange={(e) => setLateDeduction(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-rose-400 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Potongan Lain / Kasbon / Pinjaman
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-rose-400 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={otherDeductionNotes}
                  onChange={(e) => setOtherDeductionNotes(e.target.value)}
                  placeholder="Keterangan potongan lain (misal: Cicilan Kasbon Staf #02)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* REAL-TIME PREVIEW OF TAKE HOME PAY */}
          <div className="p-4 bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 border border-orange-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
                Estimasi Take Home Pay Baru:
              </span>
              <p className="text-xs text-zinc-400">
                Gaji Kotor: <strong className="text-white font-mono">{formatRp(grossTotal)}</strong> • Total Potongan: <strong className="text-rose-400 font-mono">-{formatRp(totalDeductions)}</strong>
              </p>
            </div>
            <div className="font-mono font-black text-xl sm:text-2xl text-orange-400">
              {formatRp(takeHomePay)}
            </div>
          </div>

          {/* OPTION TO PERSIST TO MASTER STAFF RECORD */}
          <label className="flex items-center gap-2 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition">
            <input
              type="checkbox"
              checked={saveToMaster}
              onChange={(e) => setSaveToMaster(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-zinc-300">
              Simpan juga gaji pokok, tunjangan & konfigurasi BPJS ini ke <strong>Profil Master Karyawan</strong> untuk bulan-bulan berikutnya.
            </span>
          </label>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" /> Simpan Perubahan Payroll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

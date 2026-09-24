import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { User, Schedule, Transaction, StaffAttendance, PackageItem, TrainerCommissionRecord, SalesCommissionRecord } from '../../types';
import { formatRp, APP_TODAY } from '../../utils/formatters';

interface PayrollTabProps {
  staffUsers: User[];
  schedules: Schedule[];
  transactions: Transaction[];
  staffAttendance: StaffAttendance[];
  packages?: PackageItem[];
  trainerCommissions?: TrainerCommissionRecord[];
  salesCommissions?: SalesCommissionRecord[];
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({
  staffUsers,
  schedules,
  transactions,
  staffAttendance,
  packages = [],
  trainerCommissions = [],
  salesCommissions = [],
  showToast
}) => {
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<any | null>(null);

  // Calculate detailed payroll items per staff
  const payrollList = useMemo(() => {
    return staffUsers.map((staff) => {
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
      let ptCommission = 0;
      const staffPtComms = trainerCommissions.filter(
        (tc) => (tc.trainerId === staff.id || tc.trainerName === staff.name) && tc.status !== 'CANCELLED'
      );
      if (staffPtComms.length > 0) {
        ptCommission = staffPtComms.reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);
      } else {
        // Fallback: per-session standard 40.000 or average session rate
        ptCommission = ptDone.length * 40000;
      }

      // 2. Sales PIC Bonus (based on package sales commission rates or recorded salesCommissions)
      const sales = transactions.filter((t) => {
        const pids = t.picIds && t.picIds.length > 0 ? t.picIds : (t.picId ? [t.picId] : []);
        return pids.includes(staff.id) && t.status !== 'VOID';
      });
      const totalSalesAmount = sales.reduce((acc, curr) => acc + (curr.amountPaid || curr.amount || 0), 0);

      let salesBonus = 0;
      const staffSalesRecs = salesCommissions.filter((sc) => sc.staffId === staff.id);
      if (staffSalesRecs.length > 0) {
        salesBonus = staffSalesRecs.reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);
      } else {
        // Calculate based on package salesCommissionRate if available
        salesBonus = sales.reduce((acc, curr) => {
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

      // 3. Overtime pay: Rp 25.000 / hour from staff attendance records
      const staffAtt = staffAttendance.filter((a) => a.staffId === staff.id || a.staffName === staff.name);
      const totalOvertimeHours = staffAtt.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
      const overtimePay = Math.round(totalOvertimeHours * 25000);

      // 4. Late deductions: Rp 1.000 / min if late minutes > 15
      const totalLateMinutes = staffAtt.reduce((acc, curr) => {
        const m = curr.lateMinutes || 0;
        return m > 15 ? acc + (m - 15) : acc;
      }, 0);
      const lateDeduction = totalLateMinutes * 1000;

      // 5. Allowances & Base Salary
      const baseSalary = staff.baseSalary || 3000000;
      const allowance = staff.allowance || 500000;

      // 6. Net Take Home Pay
      const grossIncome = baseSalary + allowance + ptCommission + salesBonus + overtimePay;
      const totalDeductions = lateDeduction;
      const netSalary = Math.max(0, grossIncome - totalDeductions);

      return {
        staff,
        baseSalary,
        allowance,
        ptDoneCount: ptDone.length,
        ptCommission,
        salesCount: sales.length,
        totalSalesAmount,
        salesBonus,
        totalOvertimeHours,
        overtimePay,
        totalLateMinutes,
        lateDeduction,
        grossIncome,
        totalDeductions,
        netSalary
      };
    });
  }, [staffUsers, schedules, transactions, staffAttendance, packages, trainerCommissions, salesCommissions]);

  // Overall totals
  const totalPayrollBudget = useMemo(() => {
    return payrollList.reduce((acc, curr) => acc + curr.netSalary, 0);
  }, [payrollList]);

  // Export to CSV
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
      'Bonus Sales (5%)',
      'Jam Lembur',
      'Uang Lembur',
      'Potongan Terlambat',
      'Take Home Pay (Bersih)'
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
      p.totalOvertimeHours.toFixed(1),
      p.overtimePay,
      p.lateDeduction,
      p.netSalary
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Payroll_Karyawan_RFA_Gym_${APP_TODAY.substring(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Berhasil', 'Rekap payroll bulanan berhasil diunduh format CSV siap transfer.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Total Estimasi Payroll</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-orange-400">{formatRp(totalPayrollBudget)}</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 font-mono">Periode Bulan Berjalan ({APP_TODAY.substring(0, 7)})</p>
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
              {formatRp(payrollList.reduce((acc, curr) => acc + curr.ptCommission + curr.salesBonus + curr.overtimePay, 0))}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">Komisi PT + Bonus Closing + Uang Lembur</p>
        </div>
      </div>

      {/* 2. ACTION CONTROLS */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Tabel Rincian Payroll & Take Home Pay Karyawan
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Perhitungan terintegrasi dari data absensi, verifikasi sesi PT, dan closing kasir
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPayrollCSV}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Download Rekap CSV
          </button>
          <button
            onClick={() => {
              window.print();
              showToast('Cetak Payroll', 'Tabel payroll siap dicetak.', 'info');
            }}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" /> Print
          </button>
        </div>
      </div>

      {/* 3. PAYROLL TABLE */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left whitespace-nowrap min-w-[950px]">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Gaji Pokok</th>
                <th className="py-3 px-4">Tunjangan</th>
                <th className="py-3 px-4">Komisi PT</th>
                <th className="py-3 px-4">Bonus Sales</th>
                <th className="py-3 px-4">Uang Lembur</th>
                <th className="py-3 px-4 text-rose-400">Potongan</th>
                <th className="py-3 px-4 font-bold text-white">Take Home Pay</th>
                <th className="py-3 px-4 text-center">Slip Gaji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
              {payrollList.map((p) => (
                <tr key={p.staff.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-xs">{p.staff.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {p.staff.roleName} ({p.staff.id})
                    </p>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-300">{formatRp(p.baseSalary)}</td>
                  <td className="py-3 px-4 font-mono text-zinc-400">{formatRp(p.allowance)}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {p.ptDoneCount > 0 ? (
                      <span>
                        {formatRp(p.ptCommission)}{' '}
                        <span className="text-[10px] text-zinc-500">({p.ptDoneCount} sesi)</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {p.salesBonus > 0 ? (
                      <span>{formatRp(p.salesBonus)}</span>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-purple-400">
                    {p.overtimePay > 0 ? (
                      <span>
                        {formatRp(p.overtimePay)}{' '}
                        <span className="text-[10px] text-zinc-500">({p.totalOvertimeHours.toFixed(1)}j)</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-rose-400">
                    {p.lateDeduction > 0 ? (
                      <span>-{formatRp(p.lateDeduction)}</span>
                    ) : (
                      <span className="text-zinc-500">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-white text-sm">
                    {formatRp(p.netSalary)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedStaffForSlip(p)}
                      className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 mx-auto"
                    >
                      <FileText className="w-3 h-3" /> Cetak Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: SLIP GAJI PRINTABLE */}
      {selectedStaffForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Slip Gaji Karyawan — RFA Gym
              </h3>
              <button
                onClick={() => setSelectedStaffForSlip(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Slip Paper Box */}
            <div id="payslip-print" className="mt-4 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs space-y-4">
              {/* Slip Header */}
              <div className="text-center pb-3 border-b border-zinc-800">
                <h2 className="text-base font-black text-white tracking-wider">RFA GYM & FITNESS CENTER</h2>
                <p className="text-[10px] text-zinc-400">Jl. Brawijaya No. 12, Kebayoran Baru, Jakarta Selatan</p>
                <p className="text-[11px] font-bold text-orange-400 mt-1 uppercase tracking-wider">
                  SLIP PEMBAYARAN GAJI — PERIODE SEPTEMBER 2026
                </p>
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
                  <span className="text-zinc-500 block text-[10px]">Rekening Bank:</span>
                  <span className="text-zinc-300 font-mono">
                    {selectedStaffForSlip.staff.bankName || 'BCA'} {selectedStaffForSlip.staff.bankAccount ? `(${selectedStaffForSlip.staff.bankAccount})` : ''}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Penghasilan (Earnings):</p>
                <div className="space-y-1.5 pl-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Gaji Pokok:</span>
                    <span className="text-white">{formatRp(selectedStaffForSlip.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tunjangan Operasional:</span>
                    <span className="text-white">{formatRp(selectedStaffForSlip.allowance)}</span>
                  </div>
                  {selectedStaffForSlip.ptCommission > 0 && (
                    <div className="flex justify-between">
                      <span className="text-emerald-400">
                        Komisi Sesi PT ({selectedStaffForSlip.ptDoneCount} sesi @ Rp 40.000):
                      </span>
                      <span className="text-emerald-400">+{formatRp(selectedStaffForSlip.ptCommission)}</span>
                    </div>
                  )}
                  {selectedStaffForSlip.salesBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-emerald-400">Bonus Closing PIC Sales (5%):</span>
                      <span className="text-emerald-400">+{formatRp(selectedStaffForSlip.salesBonus)}</span>
                    </div>
                  )}
                  {selectedStaffForSlip.overtimePay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-purple-400">
                        Uang Lembur ({selectedStaffForSlip.totalOvertimeHours.toFixed(1)} Jam):
                      </span>
                      <span className="text-purple-400">+{formatRp(selectedStaffForSlip.overtimePay)}</span>
                    </div>
                  )}
                </div>

                {selectedStaffForSlip.lateDeduction > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pt-2">Potongan (Deductions):</p>
                    <div className="space-y-1.5 pl-2 font-mono text-[11px]">
                      <div className="flex justify-between text-rose-400">
                        <span>Potongan Keterlambatan:</span>
                        <span>-{formatRp(selectedStaffForSlip.lateDeduction)}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Net Total Take Home Pay */}
                <div className="mt-3 pt-3 border-t border-dashed border-zinc-700 flex justify-between items-baseline">
                  <span className="font-bold text-white text-xs uppercase">Total Gaji Bersih (Take Home Pay):</span>
                  <span className="font-mono font-black text-orange-400 text-base">
                    {formatRp(selectedStaffForSlip.netSalary)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-zinc-800 grid grid-cols-2 text-center text-[10px] text-zinc-400">
                <div>
                  <p>Diterima Oleh,</p>
                  <div className="h-12" />
                  <p className="font-bold text-white uppercase">{selectedStaffForSlip.staff.name}</p>
                  <p>Karyawan</p>
                </div>
                <div>
                  <p>Jakarta, {APP_TODAY}</p>
                  <div className="h-12" />
                  <p className="font-bold text-white uppercase">Budi Santoso</p>
                  <p>Manajer Operasional</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-zinc-800 mt-4">
              <button
                type="button"
                onClick={() => setSelectedStaffForSlip(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast('Cetak Slip Gaji', `Slip gaji ${selectedStaffForSlip.staff.name} siap dicetak.`, 'success');
                }}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5"
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

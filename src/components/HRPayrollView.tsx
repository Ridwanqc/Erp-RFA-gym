import React, { useState } from 'react';
import { UserCheck, DollarSign, Printer, Calendar, ShieldCheck, Check, Clock } from 'lucide-react';
import { User, StaffAttendance, Transaction, Schedule } from '../types';
import { formatRp, APP_TODAY } from '../utils/formatters';

interface HRPayrollViewProps {
  staffUsers: User[];
  staffAttendance: StaffAttendance[];
  transactions: Transaction[];
  schedules: Schedule[];
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const HRPayrollView: React.FC<HRPayrollViewProps> = ({
  staffUsers,
  staffAttendance,
  transactions,
  schedules,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'attendance'>('payroll');
  const [selectedStaffSlip, setSelectedStaffSlip] = useState<{
    staff: User;
    base: number;
    ptCommission: number;
    salesBonus: number;
    deductions: number;
    total: number;
  } | null>(null);

  // Compute payroll per staff for current month
  const staffPayrollList = staffUsers.map((staff) => {
    const base = staff.baseSalary || 3500000;

    // PT Commission: completed sessions where this staff was the trainer (Rp 40.000 / session)
    const completedPTSessions = schedules.filter(
      (s) =>
        (s.trainer === staff.name || s.trainer === staff.id) &&
        s.status === 'Selesai' &&
        s.valStaf &&
        s.valTrainer &&
        s.valMember
    ).length;
    const ptCommission = completedPTSessions * 40000;

    // Sales Commission: 5% of membership revenue where this staff was the PIC (split proportionally if multiple PICs)
    let salesBonus = 0;
    transactions.forEach((t) => {
      const pids = t.picIds && t.picIds.length > 0
        ? t.picIds
        : (t.picId ? t.picId.split(',').map((s) => s.trim()).filter(Boolean) : []);
      const isPic = pids.includes(staff.id);
      if (isPic && (t.type === 'Membership' || t.type === 'PT') && t.status !== 'VOID') {
        const splitCount = pids.length || 1;
        salesBonus += Math.round(((t.amountPaid || t.amount) * 0.05) / splitCount);
      }
    });

    // Deductions (Kasbon or late attendance penalty if any)
    const deductions = 0;
    const total = base + ptCommission + salesBonus - deductions;

    return {
      staff,
      base,
      ptCommission,
      salesBonus,
      deductions,
      total,
      ptCount: completedPTSessions
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-orange-500" /> HR, Presensi & Payroll Karyawan
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kalkulator gaji otomatis terintegrasi komisi sesi PT selesai dan komisi closing paket PIC
          </p>
        </div>

        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'payroll' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Slip Gaji & Payroll
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'attendance' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Presensi Staf ({staffAttendance.length})
          </button>
        </div>
      </div>

      {/* 1. PAYROLL TABLE */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <table className="w-full text-left whitespace-nowrap min-w-[850px]">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Nama Staf / Role</th>
                    <th className="py-3 px-4 text-right">Gaji Pokok</th>
                    <th className="py-3 px-4 text-right">Komisi PT Selesai</th>
                    <th className="py-3 px-4 text-right">Bonus PIC Sales</th>
                    <th className="py-3 px-4 text-right">Take Home Pay</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                  {staffPayrollList.map((item) => (
                    <tr key={item.staff.id} className="hover:bg-zinc-800/30">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-sm">{item.staff.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                          <span>{item.staff.roleName}</span>
                          {item.staff.idNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-zinc-400">NIK: {item.staff.idNumber}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">{formatRp(item.base)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-purple-400 font-bold block">{formatRp(item.ptCommission)}</span>
                        <span className="text-[10px] text-zinc-500">{item.ptCount} Sesi Validasi 3 Pihak</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                        {formatRp(item.salesBonus)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-base font-black text-orange-400">
                        {formatRp(item.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedStaffSlip(item)}
                          className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. STAFF ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <table className="w-full text-left whitespace-nowrap min-w-[700px]">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Staf</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                {staffAttendance.map((att) => (
                  <tr key={att.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-4 text-zinc-300 font-mono">{att.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{att.staffName}</td>
                    <td className="py-3 px-4">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {att.shift}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">{att.timeIn}</td>
                    <td className="py-3 px-4 text-orange-400 font-semibold">{att.timeOut || 'Masih Bertugas'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {att.timeOut ? 'Selesai Shift' : 'Aktif Bekerja'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PRINT SLIP GAJI */}
      {selectedStaffSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="border-b border-zinc-800 pb-4 text-center">
              <h3 className="text-base font-black text-white uppercase tracking-wider">RFA GYM & FITNESS</h3>
              <p className="text-[11px] text-zinc-400">Slip Gaji Karyawan — Periode September 2026</p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Nama Karyawan:</span>
                <span className="font-bold text-white">{selectedStaffSlip.staff.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Nomor KTP / NIK:</span>
                <span className="font-mono font-bold text-zinc-300">{selectedStaffSlip.staff.idNumber || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Role / Posisi:</span>
                <span className="font-bold text-orange-400">{selectedStaffSlip.staff.roleName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Gaji Pokok:</span>
                <span className="font-bold text-white">{formatRp(selectedStaffSlip.base)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Komisi Sesi PT Selesai:</span>
                <span className="font-bold text-purple-400">+{formatRp(selectedStaffSlip.ptCommission)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Bonus Penjualan PIC:</span>
                <span className="font-bold text-emerald-400">+{formatRp(selectedStaffSlip.salesBonus)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Potongan Kasbon / Lainnya:</span>
                <span className="font-bold text-rose-400">-{formatRp(selectedStaffSlip.deductions)}</span>
              </div>
              <div className="flex justify-between pt-2 text-sm">
                <span className="font-bold text-white">TOTAL TAKE HOME PAY:</span>
                <span className="font-black text-orange-400">{formatRp(selectedStaffSlip.total)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedStaffSlip(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                  showToast('Cetak Slip', `Slip gaji ${selectedStaffSlip.staff.name} siap dicetak.`, 'info');
                }}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Slip Gaji
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Download,
  Printer,
  Sparkles,
  Crown,
  Dumbbell,
  DollarSign,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { Transaction, Member, Schedule, PTPurchaseRecord, MemberMembershipRecord, TrainerCommissionRecord, BundlePackage } from '../types';
import { formatRp, APP_TODAY } from '../utils/formatters';

interface BundlingReportsViewProps {
  transactions: Transaction[];
  members?: Member[];
  schedules?: Schedule[];
  ptPurchases: PTPurchaseRecord[];
  memberMemberships: MemberMembershipRecord[];
  trainerCommissions: TrainerCommissionRecord[];
  bundlePackages: BundlePackage[];
  staffUsers?: any[];
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onNavigateTab?: (tab: any) => void;
  onOpenBundlingManager?: () => void;
  onUpdateCommissionStatus?: (commissionId: string, newStatus: string) => void;
}

export const BundlingReportsView: React.FC<BundlingReportsViewProps> = ({
  transactions,
  members = [],
  schedules = [],
  ptPurchases,
  memberMemberships,
  trainerCommissions,
  bundlePackages,
  staffUsers = [],
  showToast,
  onNavigateTab,
  onOpenBundlingManager,
  onUpdateCommissionStatus
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'benefits' | 'pt' | 'commissions'>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBundleFilter, setSelectedBundleFilter] = useState('ALL');

  // Filtered transactions for Bundling
  const bundleTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const isBundling = t.type === 'Bundling' || (t.desc && t.desc.toLowerCase().includes('vip plus')) || (t.desc && t.desc.toLowerCase().includes('gold plus')) || (t.desc && t.desc.toLowerCase().includes('silver plus')) || (t.desc && t.desc.toLowerCase().includes('bundling'));
      if (!isBundling) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchCust = t.customer?.toLowerCase().includes(q);
        const matchDesc = t.desc?.toLowerCase().includes(q);
        const matchId = t.id?.toLowerCase().includes(q);
        const matchPic = t.picNames?.toLowerCase().includes(q);
        if (!matchCust && !matchDesc && !matchId && !matchPic) return false;
      }

      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      if (selectedBundleFilter !== 'ALL') {
        if (!t.desc?.toLowerCase().includes(selectedBundleFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, startDate, endDate, selectedBundleFilter]);

  // Report 2: Benefit Bundle Data
  const bundleBenefitsList = useMemo(() => {
    // Combine memberMemberships and ptPurchases (filtered to BUNDLING)
    return memberMemberships.map((mm) => {
      const mem = members.find((m) => m.id === mm.memberId);
      const ptRecord = ptPurchases.find((p) => p.memberId === mm.memberId && p.source === 'BUNDLING');
      const memSchedules = schedules.filter((s) => s.memberId === mm.memberId && (s.bundleId || s.purchaseId));
      const ptCompleted = memSchedules.filter((s) => s.status === 'Selesai').length;
      const ptScheduled = memSchedules.filter((s) => s.status === 'Menunggu' || s.status === 'Reschedule').length;

      const totalSess = ptRecord ? ptRecord.totalSessions : 2;
      const usedSess = ptCompleted;
      const remainingSess = Math.max(totalSess - usedSess, 0);

      return {
        bundleName: mm.packageName || 'VIP PLUS',
        memberId: mm.memberId,
        memberName: mm.memberName,
        membershipStart: mm.startDate,
        membershipEnd: mm.endDate,
        membershipStatus: mm.status,
        ptTotalSession: totalSess,
        ptUsed: usedSess,
        ptRemaining: remainingSess,
        ptCompleted,
        ptScheduled
      };
    }).filter((row) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return row.memberName.toLowerCase().includes(q) || row.bundleName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [memberMemberships, members, ptPurchases, schedules, searchQuery]);

  // Report 3: PT Bundling Lifecycle
  const ptBundlingList = useMemo(() => {
    return ptPurchases
      .filter((p) => p.source === 'BUNDLING' || p.packageName.toLowerCase().includes('vip plus') || p.packageName.toLowerCase().includes('gold plus') || p.packageName.toLowerCase().includes('silver plus') || p.packageName.toLowerCase().includes('bundling'))
      .map((purchase) => {
        const relatedSchedules = schedules.filter((s) => s.memberId === purchase.memberId);
        const completed = relatedSchedules.filter((s) => s.status === 'Selesai').length;
        const rescheduled = relatedSchedules.filter((s) => s.status === 'Reschedule').length;
        const cancelled = relatedSchedules.filter((s) => s.status === 'Batal' || s.status === 'Hangus').length;
        const remaining = Math.max(purchase.totalSessions - completed, 0);

        return {
          purchaseId: purchase.id,
          memberId: purchase.memberId,
          memberName: purchase.memberName,
          bundleName: purchase.packageName,
          trainerName: purchase.trainerName,
          totalSessions: purchase.totalSessions,
          completed,
          remaining,
          rescheduled,
          cancelled,
          status: purchase.status
        };
      })
      .filter((row) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return row.memberName.toLowerCase().includes(q) || row.trainerName.toLowerCase().includes(q) || row.bundleName.toLowerCase().includes(q);
        }
        return true;
      });
  }, [ptPurchases, schedules, searchQuery]);

  // Report 4: Commission List
  const commissionList = useMemo(() => {
    return trainerCommissions.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.trainerName.toLowerCase().includes(q) ||
          c.memberName.toLowerCase().includes(q) ||
          c.bundleName.toLowerCase().includes(q)
        );
      }
      if (startDate && c.date < startDate) return false;
      if (endDate && c.date > endDate) return false;
      return true;
    });
  }, [trainerCommissions, searchQuery, startDate, endDate]);

  // Summary Metrics
  const totalBundlingRevenue = bundleTransactions.reduce((acc, t) => acc + (t.amountPaid || t.amount), 0);
  const totalBundlesSold = bundleTransactions.length;
  const totalCommissionPaid = commissionList.reduce((acc, c) => acc + c.commissionAmount, 0);

  // CSV Export Handler
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeReportTab === 'sales') {
      csvContent += 'ID Transaksi,Tanggal,Nama Bundle,Member,PIC Sales,Kasir,Metode,Total,Status\n';
      bundleTransactions.forEach((t) => {
        csvContent += `"${t.id}","${t.date}","${t.desc}","${t.customer}","${t.picNames || '-'}","${t.cashier}","${t.method}","${t.amount}","${t.status}"\n`;
      });
    } else if (activeReportTab === 'benefits') {
      csvContent += 'Bundle,Member,Mulai Membership,Akhir Membership,PT Total Sesi,PT Digunakan,PT Sisa,PT Selesai,PT Terjadwal\n';
      bundleBenefitsList.forEach((b) => {
        csvContent += `"${b.bundleName}","${b.memberName}","${b.membershipStart}","${b.membershipEnd}","${b.ptTotalSession}","${b.ptUsed}","${b.ptRemaining}","${b.ptCompleted}","${b.ptScheduled}"\n`;
      });
    } else if (activeReportTab === 'pt') {
      csvContent += 'Member,Bundle,Trainer,Total Sesi,Selesai,Sisa,Reschedule,Batal\n';
      ptBundlingList.forEach((p) => {
        csvContent += `"${p.memberName}","${p.bundleName}","${p.trainerName}","${p.totalSessions}","${p.completed}","${p.remaining}","${p.rescheduled}","${p.cancelled}"\n`;
      });
    } else {
      csvContent += 'Tanggal,Trainer,Member,Bundle,Nilai Komponen PT,Rate Komisi %,Nominal Komisi,Status\n';
      commissionList.forEach((c) => {
        csvContent += `"${c.date}","${c.trainerName}","${c.memberName}","${c.bundleName}","${c.ptComponentValue}","${c.commissionRate}%","${c.commissionAmount}","${c.paymentStatus}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Bundling_${activeReportTab}_${APP_TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Ekspor Berhasil', `File CSV laporan ${activeReportTab} berhasil diunduh.`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-zinc-400 text-xs">
            <span>Total Omset Bundling</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{formatRp(totalBundlingRevenue)}</div>
          <div className="text-[11px] text-zinc-500 mt-1">{totalBundlesSold} transaksi paket bundling tercatat</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-zinc-400 text-xs">
            <span>Member Aktif Bundling</span>
            <Crown className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{bundleBenefitsList.length} Member</div>
          <div className="text-[11px] text-zinc-500 mt-1">Menikmati hak akses Gym + Sesi PT</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-zinc-400 text-xs">
            <span>Total Komisi Trainer (PT)</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2">{formatRp(totalCommissionPaid)}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Dihitung murni dari PT Component Value</div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3">
        {/* Navigation Tabs for the 4 Reports */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none border-b border-zinc-800/80 pb-3">
          {[
            { id: 'sales', label: '1. Laporan Penjualan Bundling', icon: FileText, count: bundleTransactions.length },
            { id: 'benefits', label: '2. Laporan Benefit Bundle', icon: Crown, count: bundleBenefitsList.length },
            { id: 'pt', label: '3. Laporan PT Bundling', icon: Dumbbell, count: ptBundlingList.length },
            { id: 'commissions', label: '4. Laporan Komisi Trainer', icon: DollarSign, count: commissionList.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Inputs Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari member, paket, PIC, trainer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                title="Tanggal Mulai"
              />
              <span>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                title="Tanggal Akhir"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* REPORT CONTENT TABLES */}

      {/* 1. LAPORAN PENJUALAN BUNDLING */}
      {activeReportTab === 'sales' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Laporan Penjualan Bundling (Transaction Records)
            </h3>
            <span className="text-xs text-zinc-400">{bundleTransactions.length} Transaksi Ditemukan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Nama Paket Bundling</th>
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Member / Pelanggan</th>
                  <th className="py-3 px-4">PIC Sales</th>
                  <th className="py-3 px-4">Kasir / Staf</th>
                  <th className="py-3 px-4">Tanggal Transaksi</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-right">Total Nilai</th>
                  <th className="py-3 px-4 text-center">Status Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {bundleTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-zinc-500">
                      Tidak ada transaksi penjualan bundling yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  bundleTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.desc}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{t.id}</td>
                      <td className="py-3 px-4 font-semibold text-zinc-200">{t.customer}</td>
                      <td className="py-3 px-4 text-orange-400 font-medium">{t.picNames || '-'}</td>
                      <td className="py-3 px-4 text-zinc-400">{t.cashier}</td>
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{t.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                          {t.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {formatRp(t.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            t.status === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : t.status === 'DP 50%'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LAPORAN BENEFIT BUNDLE */}
      {activeReportTab === 'benefits' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Laporan Benefit Bundle (Hak Akses & Kuota Aktif)
            </h3>
            <span className="text-xs text-zinc-400">{bundleBenefitsList.length} Member Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Paket Bundling</th>
                  <th className="py-3 px-4">Nama Member</th>
                  <th className="py-3 px-4">Mulai Membership</th>
                  <th className="py-3 px-4">Kedaluwarsa</th>
                  <th className="py-3 px-4 text-center">Total Sesi PT</th>
                  <th className="py-3 px-4 text-center">Sesi Terpakai</th>
                  <th className="py-3 px-4 text-center">Sisa Sesi PT</th>
                  <th className="py-3 px-4 text-center">Sesi Selesai (Valid)</th>
                  <th className="py-3 px-4 text-center">Terjadwal</th>
                  <th className="py-3 px-4 text-center">Status Hak Akses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {bundleBenefitsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-zinc-500">
                      Belum ada data hak benefit bundle.
                    </td>
                  </tr>
                ) : (
                  bundleBenefitsList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-4 font-bold text-amber-400">{row.bundleName}</td>
                      <td className="py-3 px-4 font-semibold text-white">
                        <div>{row.memberName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{row.memberId}</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{row.membershipStart}</td>
                      <td className="py-3 px-4 text-zinc-300 font-medium">{row.membershipEnd}</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-400">{row.ptTotalSession} Sesi</td>
                      <td className="py-3 px-4 text-center text-zinc-300">{row.ptUsed}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {row.ptRemaining} Sesi
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-300">{row.ptCompleted}</td>
                      <td className="py-3 px-4 text-center text-zinc-400">{row.ptScheduled}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.membershipStatus === 'AKTIF'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {row.membershipStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. LAPORAN PT BUNDLING */}
      {activeReportTab === 'pt' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Laporan PT Bundling (Siklus Sesi Personal Training)
            </h3>
            <span className="text-xs text-zinc-400">{ptBundlingList.length} Paket PT Bundling</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Nama Member</th>
                  <th className="py-3 px-4">Paket Bundling</th>
                  <th className="py-3 px-4">Trainer Pendamping</th>
                  <th className="py-3 px-4 text-center">Total Kuota Sesi</th>
                  <th className="py-3 px-4 text-center">Sesi Selesai (3 Pihak)</th>
                  <th className="py-3 px-4 text-center">Sisa Kuota</th>
                  <th className="py-3 px-4 text-center">Rescheduled</th>
                  <th className="py-3 px-4 text-center">Dibatalkan</th>
                  <th className="py-3 px-4 text-center">Status Paket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {ptBundlingList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-zinc-500">
                      Belum ada sesi PT dari paket bundling.
                    </td>
                  </tr>
                ) : (
                  ptBundlingList.map((row) => (
                    <tr key={row.purchaseId} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-4 font-bold text-white">{row.memberName}</td>
                      <td className="py-3 px-4 text-amber-400 font-medium">{row.bundleName}</td>
                      <td className="py-3 px-4 text-purple-400 font-semibold">{row.trainerName}</td>
                      <td className="py-3 px-4 text-center font-bold text-white">{row.totalSessions}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{row.completed}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-amber-400">{row.remaining}</td>
                      <td className="py-3 px-4 text-center text-blue-400">{row.rescheduled}</td>
                      <td className="py-3 px-4 text-center text-rose-400">{row.cancelled}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. LAPORAN KOMISI TRAINER */}
      {activeReportTab === 'commissions' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Laporan Komisi Trainer dari Paket Bundling
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Komisi berbasis PT Component Value yang telah ditentukan Admin, bukan dari harga total bundling.
              </p>
            </div>
            <span className="text-xs text-zinc-400">{commissionList.length} Catatan Komisi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Trainer</th>
                  <th className="py-3 px-4">Nama Member</th>
                  <th className="py-3 px-4">Paket Bundling</th>
                  <th className="py-3 px-4 text-center">Sesi Ke</th>
                  <th className="py-3 px-4 text-right">PT Component Value</th>
                  <th className="py-3 px-4 text-center">Rate Komisi</th>
                  <th className="py-3 px-4 text-right">Nominal Komisi</th>
                  <th className="py-3 px-4 text-center">Status Validasi</th>
                  <th className="py-3 px-4 text-center">Status Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {commissionList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-zinc-500">
                      Belum ada catatan komisi bundling.
                    </td>
                  </tr>
                ) : (
                  commissionList.map((comm) => (
                    <tr key={comm.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{comm.date}</td>
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        {comm.trainerName}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-medium">{comm.memberName}</td>
                      <td className="py-3 px-4 text-amber-400 font-semibold">{comm.bundleName}</td>
                      <td className="py-3 px-4 text-center font-mono">#{comm.sessionNumber || 1}</td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-300">
                        {formatRp(comm.ptComponentValue)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-zinc-400">
                        {comm.commissionRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                        {formatRp(comm.commissionAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {comm.validationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            comm.paymentStatus === 'LUNAS'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {comm.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Target,
  Trophy,
  Users,
  Plus,
  Phone,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Package,
  ShoppingBag,
  Eye,
  Search,
  X,
  RotateCcw,
  FileText
} from 'lucide-react';
import { Lead, Member, User, FollowUpLog, Transaction } from '../types';
import { formatRp, getDayDiff, formatDateIndo, APP_TODAY } from '../utils/formatters';

export type DatePreset = 'all' | 'today' | 'last7' | 'this_month' | 'last_month' | 'custom';

export interface ProductSaleDetail {
  name: string;
  category: 'Membership' | 'PT' | 'POS';
  count: number;
  revenue: number;
}

export interface PICTransactionLog {
  id: string;
  date: string;
  time: string;
  customer: string;
  type: 'Membership' | 'PT' | 'POS' | 'Pelunasan Cicilan';
  desc: string;
  amount: number;
  picRevenue: number;
  method: string;
  status: string;
  trxCategory?: string;
}

export interface PICLeaderboardStat {
  id: string;
  name: string;
  roleName: string;
  photo?: string;
  revenue: number;
  newCount: number;
  renewalCount: number;
  membershipCount: number;
  membershipRevenue: number;
  ptCount: number;
  ptRevenue: number;
  posCount: number;
  posRevenue: number;
  products: ProductSaleDetail[];
  transactions: PICTransactionLog[];
}

interface CRMViewProps {
  leads: Lead[];
  members: Member[];
  staffUsers: User[];
  followUps: FollowUpLog[];
  transactions: Transaction[];
  currentUser: User | null;
  onAddLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, nextStatus: Lead['status']) => void;
  onAddFollowUp: (fu: FollowUpLog) => void;
  onConvertLeadToMember: (lead: Lead) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  leads,
  members,
  staffUsers,
  followUps,
  transactions,
  currentUser,
  onAddLead,
  onUpdateLeadStatus,
  onAddFollowUp,
  onConvertLeadToMember,
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'leads' | 'followup'>('dashboard');

  // Date Filter State for Leaderboard
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState(APP_TODAY);

  // Accordion & Detail Modal state for PIC Sales
  const [expandedPicId, setExpandedPicId] = useState<string | null>(null);
  const [selectedModalPic, setSelectedModalPic] = useState<PICLeaderboardStat | null>(null);
  const [modalFilterCat, setModalFilterCat] = useState<'all' | 'Membership' | 'PT' | 'POS' | 'trx'>('all');
  const [modalSearch, setModalSearch] = useState('');

  // Leads state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSource, setLeadSource] = useState<'Instagram' | 'Walk-in' | 'Referral'>('Instagram');

  // Follow up state
  const [filterPic, setFilterPic] = useState('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');

  // Follow up logging modal
  const [selectedMemberForFU, setSelectedMemberForFU] = useState<Member | null>(null);
  const [fuMethod, setFuMethod] = useState<'WhatsApp' | 'Telepon'>('WhatsApp');
  const [fuStatus, setFuStatus] = useState('SUDAH DIHUBUNGI');
  const [fuNotes, setFuNotes] = useState('');

  // History modal
  const [historyMember, setHistoryMember] = useState<Member | null>(null);

  // Date Filter matching helper
  const isDateInRange = (trxDate: string): boolean => {
    if (!trxDate) return false;
    if (datePreset === 'all') return true;
    if (datePreset === 'today') return trxDate === APP_TODAY;
    if (datePreset === 'last7') {
      const diff = getDayDiff(trxDate, APP_TODAY);
      return diff <= 0 && diff >= -7;
    }
    if (datePreset === 'this_month') {
      return trxDate.slice(0, 7) === APP_TODAY.slice(0, 7);
    }
    if (datePreset === 'last_month') {
      const [y, m] = APP_TODAY.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      return trxDate.slice(0, 7) === prevMonthStr;
    }
    if (datePreset === 'custom') {
      if (customStartDate && trxDate < customStartDate) return false;
      if (customEndDate && trxDate > customEndDate) return false;
      return true;
    }
    return true;
  };

  // Helper to categorize product from transaction desc / type
  const detectCategory = (desc: string, type: string): 'Membership' | 'PT' | 'POS' => {
    const lowDesc = desc.toLowerCase();
    if (type === 'PT' || lowDesc.includes('pt ') || lowDesc.includes('sesi') || lowDesc.includes('personal trainer')) {
      return 'PT';
    }
    if (
      type === 'POS' ||
      lowDesc.startsWith('pos:') ||
      lowDesc.includes('protein') ||
      lowDesc.includes('suplemen') ||
      lowDesc.includes('bar') ||
      lowDesc.includes('mineral')
    ) {
      return 'POS';
    }
    return 'Membership';
  };

  const sanitizeItemName = (desc: string, type: string): string => {
    if (type === 'POS' && desc.startsWith('POS: ')) {
      return desc.replace(/^POS:\s*\d*x?\s*/i, '').trim();
    }
    return desc
      .replace(/\s*\(Eligible Cicilan\)/gi, '')
      .replace(/\s*\(Cicilan \d\/\d\)/gi, '')
      .trim();
  };

  // Compute PIC Leaderboard stats with Date Filter
  const { rankedPICs, globalRevenue, globalNewCount, globalRenewalCount, globalMembershipUnits, globalPtUnits, globalPosUnits, filteredTrxCount } = useMemo(() => {
    const picStatsMap: {
      [picId: string]: {
        id: string;
        name: string;
        roleName: string;
        photo?: string;
        revenue: number;
        newCount: number;
        renewalCount: number;
        membershipCount: number;
        membershipRevenue: number;
        ptCount: number;
        ptRevenue: number;
        posCount: number;
        posRevenue: number;
        productsMap: { [productName: string]: ProductSaleDetail };
        transactions: PICTransactionLog[];
      };
    } = {};

    staffUsers.forEach((s) => {
      picStatsMap[s.id] = {
        id: s.id,
        name: s.name,
        roleName: s.roleName,
        photo: s.photo,
        revenue: 0,
        newCount: 0,
        renewalCount: 0,
        membershipCount: 0,
        membershipRevenue: 0,
        ptCount: 0,
        ptRevenue: 0,
        posCount: 0,
        posRevenue: 0,
        productsMap: {},
        transactions: []
      };
    });

    let gRev = 0;
    let gNew = 0;
    let gRenewal = 0;
    let gMemUnits = 0;
    let gPtUnits = 0;
    let gPosUnits = 0;
    let fCount = 0;

    transactions.forEach((t) => {
      if (t.status === 'VOID') return;
      if (!isDateInRange(t.date)) return;

      // Only count revenue transactions
      if (t.status === 'Paid' || t.status === 'DP 50%') {
        fCount++;
        let pids: string[] = [];
        if (t.picIds && t.picIds.length > 0) {
          pids = t.picIds;
        } else if (t.picId) {
          pids = t.picId.split(',').map((s) => s.trim()).filter(Boolean);
        } else if (t.cashier) {
          const matched = staffUsers.find(
            (s) => s.name.toLowerCase() === t.cashier.toLowerCase() || s.accId.toLowerCase() === t.cashier.toLowerCase()
          );
          if (matched) {
            pids = [matched.id];
          }
        }

        if (pids.length === 0) {
          pids = ['S01']; // default fallback
        }

        const amt = t.amountPaid || t.amount;
        const amtPerPic = amt / (pids.length || 1);
        const cat = detectCategory(t.desc, t.type);
        const cleanName = sanitizeItemName(t.desc, t.type);

        pids.forEach((pid) => {
          const stat = picStatsMap[pid];
          if (stat) {
            stat.revenue += amtPerPic;
            if (t.trxCategory === 'RENEWAL') {
              stat.renewalCount += 1 / pids.length;
            } else {
              stat.newCount += 1 / pids.length;
            }

            if (cat === 'Membership') {
              stat.membershipRevenue += amtPerPic;
              stat.membershipCount += 1 / pids.length;
            } else if (cat === 'PT') {
              stat.ptRevenue += amtPerPic;
              stat.ptCount += 1 / pids.length;
            } else {
              stat.posRevenue += amtPerPic;
              stat.posCount += 1 / pids.length;
            }

            if (!stat.productsMap[cleanName]) {
              stat.productsMap[cleanName] = {
                name: cleanName,
                category: cat,
                count: 0,
                revenue: 0
              };
            }
            stat.productsMap[cleanName].count += 1 / pids.length;
            stat.productsMap[cleanName].revenue += amtPerPic;

            stat.transactions.push({
              id: t.id,
              date: t.date,
              time: t.time,
              customer: t.customer,
              type: cat,
              desc: t.desc,
              amount: t.amount,
              picRevenue: amtPerPic,
              method: t.method,
              status: t.status,
              trxCategory: t.trxCategory
            });
          }
        });

        gRev += amt;
        if (t.trxCategory === 'RENEWAL') {
          gRenewal++;
        } else {
          gNew++;
        }

        if (cat === 'Membership') gMemUnits++;
        else if (cat === 'PT') gPtUnits++;
        else gPosUnits++;
      }
    });

    const ranked: PICLeaderboardStat[] = Object.values(picStatsMap)
      .map((item) => ({
        id: item.id,
        name: item.name,
        roleName: item.roleName,
        photo: item.photo,
        revenue: Math.round(item.revenue),
        newCount: Math.round(item.newCount),
        renewalCount: Math.round(item.renewalCount),
        membershipCount: Math.round(item.membershipCount),
        membershipRevenue: Math.round(item.membershipRevenue),
        ptCount: Math.round(item.ptCount),
        ptRevenue: Math.round(item.ptRevenue),
        posCount: Math.round(item.posCount),
        posRevenue: Math.round(item.posRevenue),
        products: Object.values(item.productsMap).sort((a, b) => b.revenue - a.revenue),
        transactions: item.transactions.sort((a, b) => b.date.localeCompare(a.date))
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      rankedPICs: ranked,
      globalRevenue: gRev,
      globalNewCount: gNew,
      globalRenewalCount: gRenewal,
      globalMembershipUnits: gMemUnits,
      globalPtUnits: gPtUnits,
      globalPosUnits: gPosUnits,
      filteredTrxCount: fCount
    };
  }, [transactions, staffUsers, datePreset, customStartDate, customEndDate]);

  // Label for current date filter
  const dateFilterLabel = useMemo(() => {
    switch (datePreset) {
      case 'today':
        return `Hari Ini (${formatDateIndo(APP_TODAY)})`;
      case 'last7':
        return '7 Hari Terakhir';
      case 'this_month':
        return 'Bulan Ini (September 2026)';
      case 'last_month':
        return 'Bulan Lalu (Agustus 2026)';
      case 'custom':
        return `${formatDateIndo(customStartDate)} s/d ${formatDateIndo(customEndDate)}`;
      case 'all':
      default:
        return 'Semua Waktu (Seluruh Riwayat)';
    }
  }, [datePreset, customStartDate, customEndDate]);

  // Follow-up calculations
  const priorityMembers = members.map((m) => {
    const diff = getDayDiff(m.expired, APP_TODAY);
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE' = 'SAFE';
    if (diff < 0) priority = 'HIGH'; // Expired
    else if (diff <= 3) priority = 'HIGH'; // H-3
    else if (diff <= 7) priority = 'MEDIUM'; // H-7
    else if (diff <= 30) priority = 'LOW'; // H-30
    return { ...m, diffDays: diff, priority };
  });

  const filteredFUMembers = priorityMembers.filter((m) => {
    if (m.priority === 'SAFE') return false;
    if (filterPic !== 'all' && m.picId !== filterPic) return false;
    if (filterPriority !== 'all' && m.priority !== filterPriority) return false;
    return true;
  });

  const highCount = priorityMembers.filter((m) => m.priority === 'HIGH').length;
  const mediumCount = priorityMembers.filter((m) => m.priority === 'MEDIUM').length;
  const lowCount = priorityMembers.filter((m) => m.priority === 'LOW').length;

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;

    const newLead: Lead = {
      id: 'L-' + Date.now(),
      date: APP_TODAY,
      name: leadName,
      phone: leadPhone,
      source: leadSource,
      status: 'Baru',
      picId: currentUser?.id || 'S01'
    };

    onAddLead(newLead);
    showToast('Lead Baru Dibuat', `Prospek ${leadName} berhasil dimasukkan ke pipeline Kanban.`, 'success');
    setIsAddLeadOpen(false);
    setLeadName('');
    setLeadPhone('');
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForFU || !fuNotes.trim()) return;

    const newFU: FollowUpLog = {
      id: 'FU-' + Date.now(),
      memberId: selectedMemberForFU.id,
      date: APP_TODAY,
      method: fuMethod,
      status: fuStatus,
      notes: fuNotes.trim()
    };

    onAddFollowUp(newFU);
    showToast('Log Tersimpan', `Catatan follow up untuk ${selectedMemberForFU.name} berhasil direkam.`, 'success');
    setSelectedMemberForFU(null);
    setFuNotes('');
  };

  const generateAIDraft = () => {
    if (!selectedMemberForFU) return;
    setFuNotes(
      `Halo Kak ${selectedMemberForFU.name}! Salam hangat dari RFA GYM. Kami perhatikan membership Kakak akan berakhir pada ${selectedMemberForFU.expired}. Saat ini kami punya promo perpanjangan spesial potongan harga dan fasilitas cicilan 2x. Apakah Kakak berminat kami bantu proses renewal-nya hari ini?`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Sub-tab switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" /> CRM Leads & Performa PIC
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Pipeline prospek member baru, leaderboard penjualan PIC, dan reminder expired</p>
        </div>
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'dashboard' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Dashboard KPI PIC
          </button>
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'leads' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Leads Kanban ({leads.length})
          </button>
          <button
            onClick={() => setActiveSubTab('followup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'followup' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Follow Up Member ({filteredFUMembers.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DASHBOARD & LEADERBOARD PIC */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* DATE FILTER CONTROLS BAR */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Filter Tanggal & Periode Penjualan
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Pilih periode waktu untuk menganalisis omset dan produk paket yang dijual PIC Sales / Front Desk
                  </p>
                </div>
              </div>

              {datePreset !== 'all' && (
                <button
                  onClick={() => setDatePreset('all')}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-xl transition self-start md:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                  <span>Reset ke Semua Waktu</span>
                </button>
              )}
            </div>

            {/* Presets Button Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { id: 'all' as DatePreset, label: 'Semua Waktu' },
                { id: 'today' as DatePreset, label: 'Hari Ini' },
                { id: 'last7' as DatePreset, label: '7 Hari Terakhir' },
                { id: 'this_month' as DatePreset, label: 'Bulan Ini' },
                { id: 'last_month' as DatePreset, label: 'Bulan Lalu' },
                { id: 'custom' as DatePreset, label: 'Rentang Kustom' }
              ].map((p) => {
                const isActive = datePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setDatePreset(p.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {p.id === 'custom' && <Filter className="w-3.5 h-3.5" />}
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Pickers Row */}
            {datePreset === 'custom' && (
              <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-4 bg-zinc-950/60 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">Dari Tanggal:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">Sampai Tanggal:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* Active Filter Info Badge */}
            <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 bg-zinc-950/40 px-3.5 py-2 rounded-xl border border-zinc-800/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  Periode Aktif: <strong className="text-zinc-200">{dateFilterLabel}</strong>
                </span>
                <span className="text-zinc-600">•</span>
                <span>
                  <strong className="text-orange-400">{filteredTrxCount}</strong> transaksi terhitung
                </span>
              </div>
              <div className="font-semibold text-zinc-300">
                Total Omset Terfilter: <span className="text-emerald-400 font-bold">{formatRp(globalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* MAIN LEADERBOARD & SUMMARY GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard Table */}
            <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard Revenue PIC Sales & Front Desk
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Klik baris atau tombol detail untuk melihat paket membership & PT yang dijual
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Peringkat</th>
                      <th className="py-2.5 px-3">Nama PIC</th>
                      <th className="py-2.5 px-3">Paket Membership</th>
                      <th className="py-2.5 px-3">Paket PT</th>
                      <th className="py-2.5 px-3 text-center">New / Renewal</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                      <th className="py-2.5 px-3 text-center">Detail Produk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
                    {rankedPICs.map((pic, idx) => {
                      const isExpanded = expandedPicId === pic.id;
                      const totalPackagesSold = pic.membershipCount + pic.ptCount + pic.posCount;

                      return (
                        <React.Fragment key={pic.id}>
                          <tr
                            onClick={() => setExpandedPicId(isExpanded ? null : pic.id)}
                            className={`cursor-pointer transition ${
                              isExpanded ? 'bg-orange-500/10' : 'hover:bg-zinc-800/40'
                            }`}
                          >
                            <td className="py-3.5 px-3 font-bold text-xs">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-[11px] shrink-0">
                                  {pic.photo ? (
                                    <img src={pic.photo} alt={pic.name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    pic.name.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{pic.name}</span>
                                    {idx === 0 && pic.revenue > 0 && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-black">
                                        TOP SALES
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">{pic.roleName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-indigo-500/15 text-indigo-400 font-bold px-2 py-0.5 rounded-md text-[11px]">
                                  {pic.membershipCount} Paket
                                </span>
                                <span className="text-[10px] text-zinc-400">({formatRp(pic.membershipRevenue)})</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-md text-[11px]">
                                  {pic.ptCount} Sesi/Paket
                                </span>
                                <span className="text-[10px] text-zinc-400">({formatRp(pic.ptRevenue)})</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center font-semibold">
                              <span className="text-emerald-400">{pic.newCount} New</span> /{' '}
                              <span className="text-blue-400">{pic.renewalCount} Rnw</span>
                            </td>
                            <td className="py-3.5 px-3 text-right font-black text-orange-400 text-sm">
                              {formatRp(pic.revenue)}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedPicId(isExpanded ? null : pic.id);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                    isExpanded
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                                  }`}
                                  title="Lihat rincian paket yang dijual"
                                >
                                  <span>{totalPackagesSold} Item</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedModalPic(pic);
                                    setModalFilterCat('all');
                                    setModalSearch('');
                                  }}
                                  className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition"
                                  title="Buka dialog detail lengkap"
                                >
                                  <Eye className="w-3.5 h-3.5 text-orange-400" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE ACCORDION DETAIL ROW */}
                          {isExpanded && (
                            <tr className="bg-zinc-950/90">
                              <td colSpan={7} className="p-4 border-y border-zinc-800/80">
                                <div className="space-y-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4 text-orange-400" />
                                      <span className="font-bold text-xs text-white">
                                        Rincian Produk & Paket Terjual oleh {pic.name} ({dateFilterLabel})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-zinc-400">
                                        Total: <strong className="text-orange-400">{formatRp(pic.revenue)}</strong> ({totalPackagesSold} transaksi produk/paket)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedModalPic(pic);
                                          setModalFilterCat('all');
                                          setModalSearch('');
                                        }}
                                        className="text-[11px] text-orange-400 hover:text-orange-300 font-bold underline flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> Buka Modal Penuh
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Kolom 1: Detail Paket Membership */}
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Users className="w-4 h-4 text-indigo-400" />
                                          <h5 className="font-bold text-xs text-white">Paket Membership Terjual</h5>
                                        </div>
                                        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                                          {pic.membershipCount} Paket • {formatRp(pic.membershipRevenue)}
                                        </span>
                                      </div>

                                      {pic.products.filter((p) => p.category === 'Membership').length === 0 ? (
                                        <p className="text-[11px] text-zinc-500 italic py-2">
                                          Tidak ada penjualan paket membership pada periode ini.
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          {pic.products
                                            .filter((p) => p.category === 'Membership')
                                            .map((prod, pIdx) => {
                                              const pct = pic.revenue > 0 ? Math.round((prod.revenue / pic.revenue) * 100) : 0;
                                              return (
                                                <div
                                                  key={pIdx}
                                                  className="bg-zinc-950/80 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                                                >
                                                  <div className="space-y-0.5 max-w-[65%]">
                                                    <div className="font-bold text-zinc-200 truncate">{prod.name}</div>
                                                    <div className="text-[10px] text-zinc-500">
                                                      Terjual: <strong className="text-zinc-300">{prod.count} unit</strong> ({pct}% dari total omset PIC)
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <div className="font-black text-indigo-400">{formatRp(prod.revenue)}</div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Kolom 2: Detail Paket Personal Trainer (PT) & POS */}
                                    <div className="space-y-4">
                                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Dumbbell className="w-4 h-4 text-emerald-400" />
                                            <h5 className="font-bold text-xs text-white">Paket Personal Trainer (PT) Terjual</h5>
                                          </div>
                                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                                            {pic.ptCount} Sesi/Paket • {formatRp(pic.ptRevenue)}
                                          </span>
                                        </div>

                                        {pic.products.filter((p) => p.category === 'PT').length === 0 ? (
                                          <p className="text-[11px] text-zinc-500 italic py-2">
                                            Tidak ada penjualan paket PT pada periode ini.
                                          </p>
                                        ) : (
                                          <div className="space-y-2">
                                            {pic.products
                                              .filter((p) => p.category === 'PT')
                                              .map((prod, pIdx) => {
                                                const pct = pic.revenue > 0 ? Math.round((prod.revenue / pic.revenue) * 100) : 0;
                                                return (
                                                  <div
                                                    key={pIdx}
                                                    className="bg-zinc-950/80 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                                                  >
                                                    <div className="space-y-0.5 max-w-[65%]">
                                                      <div className="font-bold text-zinc-200 truncate">{prod.name}</div>
                                                      <div className="text-[10px] text-zinc-500">
                                                        Terjual: <strong className="text-zinc-300">{prod.count} sesi/paket</strong> ({pct}% dari total omset)
                                                      </div>
                                                    </div>
                                                    <div className="text-right">
                                                      <div className="font-black text-emerald-400">{formatRp(prod.revenue)}</div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                          </div>
                                        )}
                                      </div>

                                      {/* Produk Retail / POS jika ada */}
                                      {pic.products.some((p) => p.category === 'POS') && (
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <ShoppingBag className="w-4 h-4 text-amber-400" />
                                              <h5 className="font-bold text-xs text-white">Produk Retail / POS Terjual</h5>
                                            </div>
                                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                                              {pic.posCount} Item • {formatRp(pic.posRevenue)}
                                            </span>
                                          </div>
                                          <div className="space-y-2">
                                            {pic.products
                                              .filter((p) => p.category === 'POS')
                                              .map((prod, pIdx) => (
                                                <div
                                                  key={pIdx}
                                                  className="bg-zinc-950/80 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                                                >
                                                  <div className="font-bold text-zinc-200">{prod.name}</div>
                                                  <div className="text-right font-black text-amber-400">
                                                    {formatRp(prod.revenue)} ({prod.count}x)
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Log Transaksi Penjualan Terakhir PIC */}
                                  {pic.transactions.length > 0 && (
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                                      <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
                                        <span className="flex items-center gap-1.5 text-zinc-300">
                                          <FileText className="w-3.5 h-3.5 text-orange-400" />
                                          Daftar Transaksi Ditangani ({pic.transactions.length} transaksi)
                                        </span>
                                        <span className="text-[10px] text-zinc-500">Urut dari terbaru</span>
                                      </div>
                                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                                        {pic.transactions.map((trx) => (
                                          <div
                                            key={trx.id}
                                            className="bg-zinc-950/60 border border-zinc-800/60 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-mono text-zinc-500">{trx.id}</span>
                                              <span className="text-[10px] text-zinc-400">{trx.date}</span>
                                              <span className="font-bold text-white">{trx.customer}</span>
                                              <span
                                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                                  trx.type === 'Membership'
                                                    ? 'bg-indigo-500/20 text-indigo-400'
                                                    : trx.type === 'PT'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-amber-500/20 text-amber-400'
                                                }`}
                                              >
                                                {trx.type}
                                              </span>
                                              <span className="text-zinc-400 text-[11px] truncate max-w-[200px]">
                                                {trx.desc}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="text-[10px] text-zinc-400">{trx.method}</span>
                                              <span className="font-black text-orange-400">{formatRp(trx.picRevenue)}</span>
                                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                                {trx.status}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Global Summary Box */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between text-center shadow-sm space-y-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Total Revenue Periode Terpilih
                </p>
                <h3 className="text-3xl font-black text-orange-400 mt-2">{formatRp(globalRevenue)}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Akumulasi penjualan paket membership & PT ({dateFilterLabel})
                </p>
              </div>

              {/* Top Sales Highlight */}
              {rankedPICs.length > 0 && rankedPICs[0].revenue > 0 && (
                <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[9px] px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
                    Top Performer
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm">
                      🥇
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-400">Peringkat 1 Omset</div>
                      <div className="font-black text-white text-sm">{rankedPICs[0].name}</div>
                      <div className="text-xs font-bold text-orange-400 mt-0.5">
                        {formatRp(rankedPICs[0].revenue)}
                        <span className="text-[10px] text-zinc-500 ml-1 font-normal">
                          ({globalRevenue > 0 ? Math.round((rankedPICs[0].revenue / globalRevenue) * 100) : 0}% omset)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Closing New</p>
                  <h4 className="text-xl font-black text-emerald-400 mt-1">{globalNewCount}</h4>
                  <span className="text-[9px] text-zinc-500">Member baru</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Renewal</p>
                  <h4 className="text-xl font-black text-blue-400 mt-1">{globalRenewalCount}</h4>
                  <span className="text-[9px] text-zinc-500">Perpanjangan</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Paket Membership</p>
                  <h4 className="text-xl font-black text-indigo-400 mt-1">{globalMembershipUnits}</h4>
                  <span className="text-[9px] text-zinc-500">Paket terjual</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Paket PT</p>
                  <h4 className="text-xl font-black text-emerald-400 mt-1">{globalPtUnits}</h4>
                  <span className="text-[9px] text-zinc-500">Sesi/paket</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LEADS KANBAN PIPELINE */}
      {activeSubTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-zinc-400">
              Geser dan update tahapan calon prospek dari tahap awal hingga terdaftar sebagai member.
            </p>
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Lead Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {/* Column 1: Baru */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col min-h-[420px]">
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-zinc-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Lead Baru
                </span>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                  {leads.filter((l) => l.status === 'Baru').length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {leads
                  .filter((l) => l.status === 'Baru')
                  .map((lead) => (
                    <div key={lead.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-bold text-white">{lead.name}</h5>
                        <span className="text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          {lead.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" /> {lead.phone}
                      </p>
                      <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center">
                        <a
                          href={`https://wa.me/${lead.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={() => onUpdateLeadStatus(lead.id, 'Follow Up')}
                          className="text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-orange-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                        >
                          Ke Follow Up <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Follow Up */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col min-h-[420px]">
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-zinc-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Follow Up
                </span>
                <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                  {leads.filter((l) => l.status === 'Follow Up').length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {leads
                  .filter((l) => l.status === 'Follow Up')
                  .map((lead) => (
                    <div key={lead.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-bold text-white">{lead.name}</h5>
                        <span className="text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          {lead.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" /> {lead.phone}
                      </p>
                      <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center">
                        <a
                          href={`https://wa.me/${lead.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={() => onUpdateLeadStatus(lead.id, 'Trial')}
                          className="text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-orange-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                        >
                          Ke Trial <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: Trial / Visit */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col min-h-[420px]">
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-zinc-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Trial / Visit
                </span>
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                  {leads.filter((l) => l.status === 'Trial').length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {leads
                  .filter((l) => l.status === 'Trial')
                  .map((lead) => (
                    <div key={lead.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-bold text-white">{lead.name}</h5>
                        <span className="text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          {lead.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" /> {lead.phone}
                      </p>
                      <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center">
                        <a
                          href={`https://wa.me/${lead.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={() => {
                            onUpdateLeadStatus(lead.id, 'Member');
                            onConvertLeadToMember(lead);
                          }}
                          className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
                        >
                          Jadi Member <CheckCircle2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 4: Win (Member) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col min-h-[420px]">
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-zinc-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Win (Member)
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  {leads.filter((l) => l.status === 'Member').length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {leads
                  .filter((l) => l.status === 'Member')
                  .map((lead) => (
                    <div key={lead.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-bold text-white">{lead.name}</h5>
                        <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                          Closing Win
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{lead.phone}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FOLLOW UP EXPIRY & PIC REMINDERS */}
      {activeSubTab === 'followup' && (
        <div className="space-y-4">
          {/* Top Filter and Priority Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => setFilterPriority(filterPriority === 'HIGH' ? 'all' : 'HIGH')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                filterPriority === 'HIGH' ? 'bg-rose-500/20 border-rose-500' : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase">Prioritas Tinggi (H-3 & Expired)</p>
                <h4 className="text-2xl font-black text-rose-400 mt-1">{highCount} Member</h4>
              </div>
              <AlertTriangle className="w-6 h-6 text-rose-500 opacity-60" />
            </div>

            <div
              onClick={() => setFilterPriority(filterPriority === 'MEDIUM' ? 'all' : 'MEDIUM')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                filterPriority === 'MEDIUM' ? 'bg-amber-500/20 border-amber-500' : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase">Prioritas Sedang (H-7)</p>
                <h4 className="text-2xl font-black text-amber-400 mt-1">{mediumCount} Member</h4>
              </div>
              <Clock className="w-6 h-6 text-amber-500 opacity-60" />
            </div>

            <div
              onClick={() => setFilterPriority(filterPriority === 'LOW' ? 'all' : 'LOW')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                filterPriority === 'LOW' ? 'bg-blue-500/20 border-blue-500' : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase">Prioritas Rendah (H-30)</p>
                <h4 className="text-2xl font-black text-blue-400 mt-1">{lowCount} Member</h4>
              </div>
              <Clock className="w-6 h-6 text-blue-500 opacity-60" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-3 bg-zinc-950/40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-400">Filter PIC:</span>
                <select
                  value={filterPic}
                  onChange={(e) => setFilterPic(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-xs font-semibold rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                >
                  <option value="all">Semua PIC</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {filterPriority !== 'all' && (
                <button
                  onClick={() => setFilterPriority('all')}
                  className="text-xs text-orange-400 hover:underline font-bold"
                >
                  Reset Filter ({filterPriority})
                </button>
              )}
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <table className="w-full text-left whitespace-nowrap min-w-[750px]">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Member Info</th>
                    <th className="py-3 px-4 text-center">Periode Kadaluarsa</th>
                    <th className="py-3 px-4">Status Terakhir & PIC</th>
                    <th className="py-3 px-4 text-right">Aksi Follow Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                  {filteredFUMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500">
                        Tidak ada member dalam status follow-up pada kriteria ini.
                      </td>
                    </tr>
                  ) : (
                    filteredFUMembers.map((mem) => (
                      <tr key={mem.id} className="hover:bg-zinc-800/30">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{mem.name}</p>
                          <p className="text-[11px] text-zinc-400">{mem.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              mem.diffDays < 0
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : mem.diffDays <= 3
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : mem.diffDays <= 7
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {mem.diffDays < 0 ? 'EXPIRED' : `H-${mem.diffDays}`}
                          </span>
                          <p className="text-[10px] text-zinc-500 mt-1">{mem.expired}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-orange-400 block text-xs">{mem.followUpStatus}</span>
                          <span className="text-[10px] text-zinc-500">PIC: {mem.picName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <a
                            href={`https://wa.me/${mem.phone}?text=${encodeURIComponent(
                              `Halo Kak ${mem.name}, ada promo perpanjangan menarik di RFA Gym nih!`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                          >
                            <Phone className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          <button
                            onClick={() => {
                              setSelectedMemberForFU(mem);
                              setFuStatus(mem.followUpStatus);
                              setFuNotes('');
                            }}
                            className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition"
                          >
                            Catat Log
                          </button>
                          <button
                            onClick={() => setHistoryMember(mem)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                          >
                            Riwayat
                          </button>
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

      {/* MODAL: TAMBAH LEAD BARU */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Tambah Prospek Lead Baru</h3>
            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Prospek
                </label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Cth: Denny Chandra"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  No WhatsApp
                </label>
                <input
                  type="text"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="Cth: 08123456789"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Sumber Trafik
                </label>
                <select
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="Instagram">Instagram / Media Sosial</option>
                  <option value="Walk-in">Walk-in Langsung ke Gym</option>
                  <option value="Referral">Rekomendasi Teman (Referral)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATAT LOG FOLLOW UP */}
      {selectedMemberForFU && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">Update Catatan Follow Up</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Member: <strong className="text-white">{selectedMemberForFU.name}</strong> ({selectedMemberForFU.expired})
            </p>

            <form onSubmit={handleSaveFollowUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Metode Hubung
                  </label>
                  <select
                    value={fuMethod}
                    onChange={(e) => setFuMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telepon">Telepon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Status Respon
                  </label>
                  <select
                    value={fuStatus}
                    onChange={(e) => setFuStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="SUDAH DIHUBUNGI">Sudah Dihubungi</option>
                    <option value="RESPON">Respon (Diskusi)</option>
                    <option value="TIDAK RESPON">Tidak Respon</option>
                    <option value="TERTARIK RENEWAL">Tertarik Renewal</option>
                    <option value="AKAN RENEWAL">Akan Renewal</option>
                    <option value="TIDAK TERTARIK">Tidak Tertarik</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Catatan Interaksi
                  </label>
                  <button
                    type="button"
                    onClick={generateAIDraft}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3" /> AI Draft Pesan
                  </button>
                </div>
                <textarea
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  required
                  rows={3}
                  placeholder="Tulis hasil komunikasi atau klik AI Draft Pesan..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForFU(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT FOLLOW UP MEMBER */}
      {historyMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">Riwayat Interaksi Follow Up</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Member: <strong className="text-white">{historyMember.name}</strong>
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {followUps.filter((f) => f.memberId === historyMember.id).length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-6">Belum ada riwayat tercatat.</p>
              ) : (
                followUps
                  .filter((f) => f.memberId === historyMember.id)
                  .map((item, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded uppercase">
                          {item.status}
                        </span>
                        <span className="text-zinc-500">{item.date}</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed italic mt-1">"{item.notes}"</p>
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setHistoryMember(null)}
              className="mt-4 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PRODUK & PAKET PIC SALES LENGKAP */}
      {selectedModalPic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl p-6 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-black text-orange-400 text-base shrink-0">
                  {selectedModalPic.photo ? (
                    <img
                      src={selectedModalPic.photo}
                      alt={selectedModalPic.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    selectedModalPic.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{selectedModalPic.name}</h3>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-bold">
                      {selectedModalPic.roleName}
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                      Peringkat #{rankedPICs.findIndex((p) => p.id === selectedModalPic.id) + 1}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Periode: <strong className="text-zinc-200">{dateFilterLabel}</strong> • Total Omset:{' '}
                    <strong className="text-orange-400">{formatRp(selectedModalPic.revenue)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModalPic(null)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Total Revenue PIC</span>
                <h4 className="text-lg font-black text-orange-400 mt-0.5">{formatRp(selectedModalPic.revenue)}</h4>
                <p className="text-[10px] text-zinc-500">{selectedModalPic.newCount} New • {selectedModalPic.renewalCount} Rnw</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Paket Membership</span>
                <h4 className="text-lg font-black text-indigo-400 mt-0.5">{selectedModalPic.membershipCount} Paket</h4>
                <p className="text-[10px] text-indigo-300/80">{formatRp(selectedModalPic.membershipRevenue)}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Paket Personal Trainer</span>
                <h4 className="text-lg font-black text-emerald-400 mt-0.5">{selectedModalPic.ptCount} Paket/Sesi</h4>
                <p className="text-[10px] text-emerald-300/80">{formatRp(selectedModalPic.ptRevenue)}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Produk Retail / POS</span>
                <h4 className="text-lg font-black text-amber-400 mt-0.5">{selectedModalPic.posCount} Item</h4>
                <p className="text-[10px] text-amber-300/80">{formatRp(selectedModalPic.posRevenue)}</p>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all' as const, label: `Semua Produk (${selectedModalPic.products.length})` },
                  {
                    id: 'Membership' as const,
                    label: `Membership (${selectedModalPic.products.filter((p) => p.category === 'Membership').length})`
                  },
                  {
                    id: 'PT' as const,
                    label: `PT (${selectedModalPic.products.filter((p) => p.category === 'PT').length})`
                  },
                  {
                    id: 'POS' as const,
                    label: `Retail/POS (${selectedModalPic.products.filter((p) => p.category === 'POS').length})`
                  },
                  {
                    id: 'trx' as const,
                    label: `Log Transaksi (${selectedModalPic.transactions.length})`
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setModalFilterCat(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      modalFilterCat === tab.id
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Cari paket / transaksi..."
                  className="bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-orange-500 w-full sm:w-56"
                />
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {modalFilterCat !== 'trx' ? (
                // TABEL PRODUK & PAKET
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Paket / Produk</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3 text-center">Jumlah Terjual</th>
                        <th className="py-2.5 px-3 text-right">Total Revenue PIC</th>
                        <th className="py-2.5 px-3 text-right">Porsi Omset</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
                      {selectedModalPic.products
                        .filter((p) => {
                          if (modalFilterCat !== 'all' && p.category !== modalFilterCat) return false;
                          if (modalSearch && !p.name.toLowerCase().includes(modalSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map((prod, idx) => {
                          const pct =
                            selectedModalPic.revenue > 0
                              ? Math.round((prod.revenue / selectedModalPic.revenue) * 100)
                              : 0;

                          return (
                            <tr key={idx} className="hover:bg-zinc-800/30">
                              <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">{idx + 1}</td>
                              <td className="py-3 px-3 font-bold text-white">
                                <div className="flex items-center gap-2">
                                  {prod.category === 'Membership' ? (
                                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                                  ) : prod.category === 'PT' ? (
                                    <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                                  )}
                                  <span>{prod.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                    prod.category === 'Membership'
                                      ? 'bg-indigo-500/20 text-indigo-400'
                                      : prod.category === 'PT'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                  }`}
                                >
                                  {prod.category === 'Membership'
                                    ? 'Paket Membership'
                                    : prod.category === 'PT'
                                    ? 'Paket PT'
                                    : 'Retail / POS'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-zinc-200">
                                {prod.count} {prod.category === 'PT' ? 'sesi/paket' : 'unit'}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-orange-400">
                                {formatRp(prod.revenue)}
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-zinc-400">
                                <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold text-zinc-300">
                                  {pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                      {selectedModalPic.products.filter((p) => {
                        if (modalFilterCat !== 'all' && p.category !== modalFilterCat) return false;
                        if (modalSearch && !p.name.toLowerCase().includes(modalSearch.toLowerCase())) return false;
                        return true;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500 italic">
                            Tidak ditemukan produk atau paket pada filter ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                // TABEL LOG TRANSAKSI INDIVIDU
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">No. Transaksi</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Member / Customer</th>
                        <th className="py-2.5 px-3">Deskripsi Produk / Paket</th>
                        <th className="py-2.5 px-3">Metode</th>
                        <th className="py-2.5 px-3 text-right">Omset PIC</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
                      {selectedModalPic.transactions
                        .filter((t) => {
                          if (
                            modalSearch &&
                            !t.customer.toLowerCase().includes(modalSearch.toLowerCase()) &&
                            !t.desc.toLowerCase().includes(modalSearch.toLowerCase()) &&
                            !t.id.toLowerCase().includes(modalSearch.toLowerCase())
                          ) {
                            return false;
                          }
                          return true;
                        })
                        .map((trx, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/30">
                            <td className="py-3 px-3 font-mono font-bold text-orange-400 text-[11px]">{trx.id}</td>
                            <td className="py-3 px-3 text-zinc-400 text-[11px]">
                              {trx.date} <span className="text-zinc-600">{trx.time}</span>
                            </td>
                            <td className="py-3 px-3 font-bold text-white">{trx.customer}</td>
                            <td className="py-3 px-3 text-zinc-200">
                              <span className="font-semibold">{trx.desc}</span>
                              {trx.trxCategory && (
                                <span className="ml-2 text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-bold uppercase">
                                  {trx.trxCategory}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-zinc-400">{trx.method}</td>
                            <td className="py-3 px-3 text-right font-black text-orange-400">
                              {formatRp(trx.picRevenue)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  trx.status === 'Paid'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {trx.status}
                              </span>
                            </td>
                          </tr>
                        ))}

                      {selectedModalPic.transactions.filter((t) => {
                        if (
                          modalSearch &&
                          !t.customer.toLowerCase().includes(modalSearch.toLowerCase()) &&
                          !t.desc.toLowerCase().includes(modalSearch.toLowerCase()) &&
                          !t.id.toLowerCase().includes(modalSearch.toLowerCase())
                        ) {
                          return false;
                        }
                        return true;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-zinc-500 italic">
                            Tidak ditemukan log transaksi yang sesuai.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedModalPic(null)}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

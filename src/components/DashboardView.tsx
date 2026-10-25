import React, { useEffect, useRef, useState } from 'react';
import {
  DollarSign,
  UserCheck,
  Dumbbell,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Bell,
  BellRing,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  X,
  ExternalLink,
  CreditCard,
  Phone,
  Users,
  UserX,
  RefreshCw,
  ArrowRight,
  Boxes,
  Plus,
  Snowflake,
  Globe,
  Building2
} from 'lucide-react';
import { Transaction, Attendance, Schedule, Member, Product, ALL_BRANCHES_ID } from '../types';
import { formatRp, APP_TODAY, formatDateIndo, getDayDiff } from '../utils/formatters';
import { getMemberStatus } from '../utils/memberStatus';
import { BusinessHealth } from './BusinessHealth';
import { useSettings } from '../context/SettingsContext';

interface DashboardViewProps {
  transactions: Transaction[];
  attendances: Attendance[];
  schedules: Schedule[];
  members?: Member[];
  products?: Product[];
  currentUser?: any;
  onAddStock?: (prodId: string, qtyToAdd: number) => void;
  onNavigateTab: (tab: any) => void;
  onPayPiutang?: (trxId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  attendances,
  schedules,
  members = [],
  products = [],
  currentUser,
  onAddStock,
  onNavigateTab,
  onPayPiutang
}) => {
  const { activeBranch, isAllBranches } = useSettings();
  const isAdminCabang = currentUser?.role === 'admin_cabang';
  const isSuperAdmin = currentUser?.role === 'admin';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Low stock UI states (< 5 items)
  const [isLowStockSectionOpen, setIsLowStockSectionOpen] = useState(true);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockFilterTab, setStockFilterTab] = useState<'all' | 'habis' | 'kritis'>('all');
  const [restockModal, setRestockModal] = useState<{
    isOpen: boolean;
    product: Product | null;
    qty: string;
  }>({
    isOpen: false,
    product: null,
    qty: ''
  });

  // Notification UI states
  const [isNotificationOpen, setIsNotificationOpen] = useState(true);
  const [dueFilter, setDueFilter] = useState<'all' | 'today' | 'tomorrow' | 'soon' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [waModal, setWaModal] = useState<{
    isOpen: boolean;
    type?: 'piutang' | 'renewal';
    title?: string;
    customer: string;
    phone: string;
    desc: string;
    amount?: number;
    dueDate: string;
    message: string;
    copied: boolean;
  } | null>(null);

  // Member status UI states
  const [memberFilterTab, setMemberFilterTab] = useState<'all' | 'AKTIF' | 'MASA TENGGANG' | 'EXPIRED' | 'FREEZE' | 'VISIT'>('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isMemberSectionOpen, setIsMemberSectionOpen] = useState(true);

  // 1. DATA PERHITUNGAN JATUH TEMPO CICILAN & PIUTANG
  const piutangTransactions = transactions.filter((t) => {
    const hasRemaining = (t.amountRemaining && t.amountRemaining > 0) || t.status === 'DP 50%' || t.status === 'BELUM LUNAS';
    const hasDueDate = Boolean(t.dueDate && t.dueDate !== '-' && t.dueDate.trim() !== '');
    return hasRemaining && hasDueDate && t.status !== 'VOID';
  });

  const piutangWithDetails = piutangTransactions.map((t) => {
    const diff = getDayDiff(t.dueDate!, APP_TODAY);
    const matchedMember = members.find(
      (m) => m.name.toLowerCase() === t.customer.toLowerCase() || m.id === t.customer
    );
    return {
      ...t,
      diffDays: diff,
      member: matchedMember
    };
  });

  // Specifically due in next 3 days: diff >= 0 && diff <= 3
  const dueIn3Days = piutangWithDetails
    .filter((t) => t.diffDays >= 0 && t.diffDays <= 3)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Overdue items: diff < 0
  const overdueItems = piutangWithDetails
    .filter((t) => t.diffDays < 0)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Counts
  const countToday = dueIn3Days.filter((t) => t.diffDays === 0).length;
  const countTomorrow = dueIn3Days.filter((t) => t.diffDays === 1).length;
  const countSoon = dueIn3Days.filter((t) => t.diffDays >= 2 && t.diffDays <= 3).length;
  const countOverdue = overdueItems.length;
  const totalDueNominal = dueIn3Days.reduce((sum, t) => sum + (t.amountRemaining || 0), 0);

  // Filtered displayed list
  const displayedList = piutangWithDetails
    .filter((t) => {
      if (dueFilter === 'today') return t.diffDays === 0;
      if (dueFilter === 'tomorrow') return t.diffDays === 1;
      if (dueFilter === 'soon') return t.diffDays >= 2 && t.diffDays <= 3;
      if (dueFilter === 'overdue') return t.diffDays < 0;
      // 'all' tab shows all within 3-day window by default (or includes overdue if none in 3 days)
      return t.diffDays >= 0 && t.diffDays <= 3;
    })
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchCust = t.customer.toLowerCase().includes(q);
      const matchDesc = t.desc.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      const matchPhone = t.member?.phone.includes(q);
      return matchCust || matchDesc || matchId || matchPhone;
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  // Financial calculations
  // Today's actual receipts:
  // 1. Transactions on today that were Paid in full or DP (only amount actually paid)
  // 2. Installment payments made today (PAY-* transactions)
  const todayTransactions = transactions.filter((t) => t.date === APP_TODAY && t.status !== 'VOID');
  const todayRevenue = todayTransactions.reduce((sum, t) => {
    if (t.status === 'Paid' || t.status === 'DP 50%') {
      return sum + (t.amountPaid || t.amount);
    }
    return sum;
  }, 0);

  // Visit count today
  const todayVisits = attendances.filter((a) => a.date === APP_TODAY).length;

  // Active PT sessions waiting for execution/validation
  const activePTSessions = schedules.filter((s) => s.status === 'Menunggu').length;

  // Total Outstanding Piutang (Debts)
  const totalPiutang = transactions
    .filter((t) => t.status !== 'VOID')
    .reduce((sum, t) => sum + (t.amountRemaining || 0), 0);

  // 2. DATA PERHITUNGAN STATUS SIKLUS MEMBERSHIP (🟢 AKTIF, 🟠 MASA TENGGANG, 🔴 EXPIRED, 🔵 FREEZE, ⚪ VISIT)
  const memberStatusList = members.map((m) => {
    const statusInfo = getMemberStatus(m);
    return {
      ...m,
      diffDays: statusInfo.diffDays,
      statusCategory: statusInfo.status,
      statusBadge: statusInfo
    };
  });

  const countAktif = memberStatusList.filter((m) => m.statusCategory === 'AKTIF').length;
  const countTenggang = memberStatusList.filter((m) => m.statusCategory === 'MASA TENGGANG').length;
  const countExpired = memberStatusList.filter((m) => m.statusCategory === 'EXPIRED').length;
  const countFreeze = memberStatusList.filter((m) => m.statusCategory === 'FREEZE').length;
  const countVisit = memberStatusList.filter((m) => m.statusCategory === 'VISIT').length;
  const totalMembers = members.length;

  const pctAktif = totalMembers > 0 ? Math.round((countAktif / totalMembers) * 100) : 0;
  const pctTenggang = totalMembers > 0 ? Math.round((countTenggang / totalMembers) * 100) : 0;
  const pctExpired = totalMembers > 0 ? Math.round((countExpired / totalMembers) * 100) : 0;
  const pctFreeze = totalMembers > 0 ? Math.round((countFreeze / totalMembers) * 100) : 0;
  const pctVisit = totalMembers > 0 ? Math.round((countVisit / totalMembers) * 100) : 0;

  const displayedMemberList = memberStatusList
    .filter((m) => {
      if (memberFilterTab === 'all') return true;
      return m.statusCategory === memberFilterTab;
    })
    .filter((m) => {
      if (!memberSearchQuery.trim()) return true;
      const q = memberSearchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.picName && m.picName.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  // 3. DATA PERHITUNGAN NOTIFIKASI STOK RENDAH KASIR (< 5 ITEM)
  const lowStockProducts = (products || []).filter((p) => p.stock < 5);
  const outOfStockProducts = lowStockProducts.filter((p) => p.stock <= 0);
  const criticalStockProducts = lowStockProducts.filter((p) => p.stock > 0 && p.stock < 5);

  const displayedStockList = lowStockProducts
    .filter((p) => {
      if (stockFilterTab === 'habis') return p.stock <= 0;
      if (stockFilterTab === 'kritis') return p.stock > 0 && p.stock < 5;
      return true;
    })
    .filter((p) => {
      if (!stockSearchQuery.trim()) return true;
      const q = stockSearchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    });

  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModal.product || !restockModal.qty || Number(restockModal.qty) <= 0) return;
    if (onAddStock) {
      onAddStock(restockModal.product.id, Number(restockModal.qty));
    }
    setRestockModal({ isOpen: false, product: null, qty: '' });
  };

  // Draw smooth weekly chart with responsive ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderChart = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.parentElement?.clientWidth || 600;
      const height = 240;
      canvas.width = width;
      canvas.height = height;

      // Past 7 days data
      const days = ['H-6', 'H-5', 'H-4', 'H-3', 'H-2', 'H-1', 'Hari Ini'];
      const data = [1600000, 2400000, 1850000, 3100000, 2200000, 4200000, todayRevenue];
      const maxVal = Math.max(...data, 5000000);

      ctx.clearRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = height - 40 - (i * (height - 60)) / 4;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(width - 20, y);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#71717a';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText((((maxVal * i) / 4) / 1000000).toFixed(1) + 'M', 35, y + 3);
      }

      // Gradient fill under curve
      const stepX = (width - 70) / (data.length - 1);
      const points = data.map((val, idx) => ({
        x: 45 + idx * stepX,
        y: height - 40 - (val / maxVal) * (height - 70)
      }));

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
      gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
      }
      ctx.lineTo(points[points.length - 1].x, height - 40);
      ctx.lineTo(points[0].x, height - 40);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line stroke
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
      }
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dots and Labels
      points.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, idx === points.length - 1 ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = idx === points.length - 1 ? '#ea580c' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bottom day label
        ctx.fillStyle = idx === points.length - 1 ? '#f97316' : '#a1a1aa';
        ctx.font = idx === points.length - 1 ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(days[idx], pt.x, height - 15);
      });
    };

    renderChart();

    let animationFrameId: number;
    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(renderChart);
    };

    const parent = canvas.parentElement;
    let observer: ResizeObserver | null = null;
    if (parent && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize);
      observer.observe(parent);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [todayRevenue]);

  // Open WhatsApp Modal helper
  const handleOpenWaModal = (item: (typeof piutangWithDetails)[0]) => {
    const cust = item.customer;
    const phone = item.member?.phone || '08xxxxxxxxxx';
    const dueDateStr = formatDateIndo(item.dueDate || '');
    const remainingStr = formatRp(item.amountRemaining);
    const diff = item.diffDays;

    let timeNote = `pada tanggal ${dueDateStr}`;
    if (diff === 0) timeNote = `HARI INI (${dueDateStr})`;
    else if (diff === 1) timeNote = `BESOK (${dueDateStr})`;
    else if (diff > 1) timeNote = `dalam ${diff} hari ke depan (${dueDateStr})`;
    else if (diff < 0) timeNote = `telah melewati jatuh tempo pada ${dueDateStr}`;

    const msg = `Halo Kak ${cust}, salam hangat dari Manajemen GymPro. 🙏\n\nKami menginformasikan pengingat tagihan cicilan Anda:\n📋 Layanan: ${item.desc}\n💰 Sisa Tagihan: ${remainingStr}\n📅 Jatuh Tempo: ${timeNote}\n\nPembayaran dapat dilakukan langsung di kasir Gym kami atau via transfer bank. Mohon kirimkan bukti jika sudah melakukan transfer.\n\nTerima kasih dan salam sehat selalu! 💪`;

    setWaModal({
      isOpen: true,
      type: 'piutang',
      title: 'Pengingat WhatsApp Jatuh Tempo Cicilan',
      customer: cust,
      phone,
      desc: item.desc,
      amount: item.amountRemaining || 0,
      dueDate: item.dueDate || '',
      message: msg,
      copied: false
    });
  };

  // Open WhatsApp Modal helper for Membership Renewal (Masa Tenggang & Expired)
  const handleOpenRenewalWaModal = (mem: (typeof memberStatusList)[0]) => {
    const cust = mem.name;
    const phone = mem.phone || '08xxxxxxxxxx';
    const expDateStr = formatDateIndo(mem.expired);
    const diff = mem.diffDays;

    let timeNote = `pada tanggal ${expDateStr}`;
    let msg = '';
    if (diff < 0) {
      const absDiff = Math.abs(diff);
      timeNote = `telah berakhir sejak ${absDiff} hari lalu (${expDateStr})`;
      msg = `Halo Kak ${cust}, salam hangat dari Manajemen GymPro! 🙏\n\nKami menginformasikan bahwa masa aktif membership Gym Kakak telah berakhir sejak ${expDateStr} (${absDiff} hari yang lalu).\n\nAgar Kakak dapat terus melanjutkan rutinitas olahraga sehat dan menjaga konsistensi latihan, yuk aktifkan kembali membership Kakak hari ini! Kami memiliki penawaran promo re-aktivasi dan kemudahan fasilitas cicilan 2x.\n\nSilakan kunjungi kasir Gym kami saat kedatangan atau balas pesan ini jika Kakak berminat kami bantu. Terima kasih dan salam sehat selalu! 💪`;
    } else if (diff === 0) {
      timeNote = `HARI INI (${expDateStr})`;
      msg = `Halo Kak ${cust}, salam hangat dari Manajemen GymPro! 🙏\n\nKami mengingatkan bahwa masa aktif membership Gym Kakak berakhir HARI INI (${expDateStr}).\n\nAgar tidak terkendala saat check-in esok hari, yuk lakukan perpanjangan (renewal) paket membership Kakak sekarang di resepsionis gym atau via transfer bank.\n\nTerima kasih dan salam sehat selalu! 💪`;
    } else {
      timeNote = `dalam ${diff} hari ke depan (${expDateStr})`;
      msg = `Halo Kak ${cust}, salam hangat dari Manajemen GymPro! 🙏\n\nKami menginformasikan pengingat masa aktif membership Gym Kakak yang akan berakhir dalam ${diff} hari lagi, tepatnya pada ${expDateStr}.\n\nAgar sesi latihan Kakak tetap berjalan lancar tanpa jeda, yuk perpanjang paket membership Kakak lebih awal. Dapatkan juga promo diskon spesial renewal dari kami!\n\nSilakan hubungi kasir/PIC Kakak (${mem.picName || 'Tim GymPro'}) atau balas pesan ini. Terima kasih dan salam sehat selalu! 💪`;
    }

    setWaModal({
      isOpen: true,
      type: 'renewal',
      title: diff < 0 ? 'Pengingat Re-Aktivasi Member Expired' : 'Pengingat Perpanjangan (Renewal) Membership',
      customer: cust,
      phone,
      desc: diff < 0 ? `Membership Expired (${timeNote})` : `Masa Tenggang Membership (${timeNote})`,
      amount: 0,
      dueDate: mem.expired,
      message: msg,
      copied: false
    });
  };

  const handleCopyWaMessage = () => {
    if (!waModal) return;
    navigator.clipboard.writeText(waModal.message);
    setWaModal({ ...waModal, copied: true });
    setTimeout(() => {
      setWaModal((prev) => (prev ? { ...prev, copied: false } : null));
    }, 2500);
  };

  const handleDirectWhatsApp = () => {
    if (!waModal) return;
    const cleanPhone = waModal.phone.replace(/^0/, '62').replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waModal.message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Branch Access Scope Identity Banner */}
      {isAdminCabang ? (
        <div className="bg-gradient-to-r from-teal-950/70 via-zinc-900 to-zinc-900 border border-teal-500/35 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Dashboard Operasional Unit Cabang: {activeBranch.name}
                </h3>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  {activeBranch.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
                Wewenang Anda dikunci khusus untuk mengetahui dan mengatur operasional di unit kerja <strong className="text-white">{activeBranch.name}</strong> ({activeBranch.city}).
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto shrink-0 flex items-center gap-2">
            <span className="text-[11px] text-teal-300 bg-teal-950/90 border border-teal-500/40 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Akses Khusus: Admin Cabang</span>
            </span>
          </div>
        </div>
      ) : isAllBranches ? (
        <div className="bg-gradient-to-r from-amber-950/70 via-zinc-900 to-zinc-900 border border-amber-500/35 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Dashboard Eksekutif Holding Pusat (Konsolidasi Multi-Cabang)
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  HQ PUSAT
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
                Menampilkan performa keuangan dan keanggotaan gabungan seluruh unit outlet dalam jaringan GymPro ERP.
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto shrink-0 flex items-center gap-2">
            <span className="text-[11px] text-amber-300 bg-amber-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Akses Penuh: Super Admin</span>
            </span>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* BUSINESS HEALTH COMPONENT                                                 */}
      {/* Displays key metrics: Total Active Members, Daily Revenue,               */}
      {/* Total Active PT Sessions, and Pending Piutang Count                      */}
      {/* ========================================================================= */}
      <BusinessHealth
        totalActiveMembers={countAktif}
        dailyRevenue={todayRevenue}
        totalActivePTSessions={activePTSessions}
        pendingPiutangCount={piutangTransactions.length}
        totalPendingPiutangAmount={totalPiutang}
        transactions={transactions}
        schedules={schedules}
        members={members}
        attendances={attendances}
        onNavigateTab={onNavigateTab}
      />

      {/* ========================================================================= */}
      {/* NOTIFIKASI OTOMATIS: PERINGATAN STOK RENDAH KASIR POS (< 5 ITEM)          */}
      {/* ========================================================================= */}
      <div
        className={`bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-900/80 border rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition ${
          lowStockProducts.length > 0 ? 'border-amber-500/35 shadow-amber-950/20' : 'border-zinc-800'
        }`}
      >
        {/* Ambient Top Glow */}
        {lowStockProducts.length > 0 && (
          <div className="absolute top-0 right-0 w-96 h-28 bg-amber-500/10 blur-3xl pointer-events-none -mr-16 -mt-10" />
        )}

        {/* Notification Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${
                lowStockProducts.length > 0
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {lowStockProducts.length > 0 ? (
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Notifikasi Stok Rendah Kasir POS
                </h2>
                {lowStockProducts.length > 0 ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wide">
                      Di Bawah 5 Item
                    </span>
                  </>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide">
                    Stok Aman (Semua ≥ 5 Item)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {lowStockProducts.length > 0 ? (
                  <>
                    Terdapat <span className="text-amber-400 font-bold">{lowStockProducts.length} produk</span> dengan
                    sisa stok di bawah 5 item ({outOfStockProducts.length > 0 && <span className="text-rose-400 font-bold">{outOfStockProducts.length} habis (0 item), </span>}
                    {criticalStockProducts.length} kritis). Segera lakukan restock agar stok tidak habis saat kasir melayani member.
                  </>
                ) : (
                  'Seluruh stok barang dan FnB kasir dalam kondisi mencukupi (di atas batas minimal 5 item).'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Kelola Produk & Stok</span>
            </button>
            <button
              onClick={() => onNavigateTab('pos')}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <span>Buka POS</span>
            </button>
            <button
              onClick={() => setIsLowStockSectionOpen(!isLowStockSectionOpen)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/60 p-2 rounded-xl transition"
              title={isLowStockSectionOpen ? 'Sembunyikan daftar stok' : 'Tampilkan daftar stok'}
            >
              {isLowStockSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isLowStockSectionOpen && (
          <div className="mt-5 space-y-4">
            {lowStockProducts.length === 0 ? (
              <div className="p-6 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Persediaan Barang Kasir Prima</h4>
                    <p className="text-xs text-zinc-400">Semua produk FnB dan suplemen memiliki stok aman minimal 5 item.</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('pos')}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/30 px-3.5 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5"
                >
                  <Boxes className="w-3.5 h-3.5" /> Lihat Katalog Produk
                </button>
              </div>
            ) : (
              <>
                {/* Metric Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Total Stok Kritis</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-amber-400">{lowStockProducts.length}</span>
                      <span className="text-xs text-zinc-500 font-semibold">Produk (&lt; 5 Item)</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/70 border border-rose-500/20 rounded-2xl p-3.5 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">Stok Habis (0 Item)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-rose-400">{outOfStockProducts.length}</span>
                      <span className="text-xs text-zinc-500 font-semibold">Produk Kosong</span>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 bg-zinc-950/70 border border-amber-500/20 rounded-2xl p-3.5 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">Stok Menipis (1-4 Item)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-amber-300">{criticalStockProducts.length}</span>
                      <span className="text-xs text-zinc-500 font-semibold">Perlu Restock Segera</span>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setStockFilterTab('all')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                        stockFilterTab === 'all'
                          ? 'bg-amber-500 text-black shadow-sm font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Semua Rendah ({lowStockProducts.length})
                    </button>
                    <button
                      onClick={() => setStockFilterTab('habis')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                        stockFilterTab === 'habis'
                          ? 'bg-rose-500 text-white shadow-sm font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Habis ({outOfStockProducts.length})
                    </button>
                    <button
                      onClick={() => setStockFilterTab('kritis')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                        stockFilterTab === 'kritis'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Kritis 1-4 ({criticalStockProducts.length})
                    </button>
                  </div>

                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      placeholder="Cari nama / kategori barang..."
                      className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedStockList.map((p) => {
                    const isZero = p.stock <= 0;
                    return (
                      <div
                        key={`dash-stock-${p.id}`}
                        className={`bg-zinc-950/85 border rounded-2xl p-3.5 flex flex-col justify-between space-y-3 transition ${
                          isZero
                            ? 'border-rose-500/40 bg-rose-950/10'
                            : 'border-amber-500/30 bg-amber-950/5 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {p.img && p.img.trim() ? (
                            <img
                              src={p.img.trim()}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs shrink-0">
                              PROD
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md">
                                {p.cat}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                  isZero
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                {isZero ? 'Habis (0)' : `Sisa ${p.stock} Item`}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-2 leading-tight">
                              {p.name}
                            </h4>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-zinc-400 block">Harga Jual</span>
                            <span className="text-xs font-black text-orange-400">{formatRp(p.price)}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setRestockModal({ isOpen: true, product: p, qty: '' })}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" /> Restock
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* NOTIFIKASI OTOMATIS: JATUH TEMPO CICILAN & PIUTANG (3 HARI KE DEPAN)      */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-900/80 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-96 h-28 bg-amber-500/10 blur-3xl pointer-events-none -mr-16 -mt-10" />

        {/* Notification Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Notifikasi Jatuh Tempo Cicilan & Piutang
                </h2>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
                  Target 3 Hari ke Depan
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {dueIn3Days.length > 0 ? (
                  <>
                    Terdapat <span className="text-amber-400 font-bold">{dueIn3Days.length} cicilan member</span> yang
                    akan jatuh tempo dalam 3 hari ke depan dengan total sisa tagihan{' '}
                    <span className="text-rose-400 font-bold">{formatRp(totalDueNominal)}</span>.
                  </>
                ) : (
                  'Semua cicilan piutang member dalam status terkontrol. Tidak ada tagihan jatuh tempo dalam 3 hari ke depan.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => onNavigateTab('piutang')}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Buku Piutang</span>
            </button>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/60 p-2 rounded-xl transition"
              title={isNotificationOpen ? 'Sembunyikan daftar' : 'Tampilkan daftar'}
            >
              {isNotificationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isNotificationOpen && (
          <div className="mt-5 space-y-4">
            {/* Quick Metrics & Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <button
                  onClick={() => setDueFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    dueFilter === 'all'
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                  }`}
                >
                  <span>3 Hari ke Depan</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      dueFilter === 'all' ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {dueIn3Days.length}
                  </span>
                </button>

                <button
                  onClick={() => setDueFilter('today')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    dueFilter === 'today'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                  <span>Hari Ini (H-0)</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      dueFilter === 'today' ? 'bg-rose-950 text-rose-300' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {countToday}
                  </span>
                </button>

                <button
                  onClick={() => setDueFilter('tomorrow')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    dueFilter === 'tomorrow'
                      ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                  }`}
                >
                  <span>Besok (H-1)</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      dueFilter === 'tomorrow' ? 'bg-zinc-950 text-orange-400' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {countTomorrow}
                  </span>
                </button>

                <button
                  onClick={() => setDueFilter('soon')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    dueFilter === 'soon'
                      ? 'bg-yellow-500 text-zinc-950 shadow-md shadow-yellow-500/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                  }`}
                >
                  <span>2-3 Hari Lagi</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      dueFilter === 'soon' ? 'bg-zinc-950 text-yellow-400' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {countSoon}
                  </span>
                </button>

                {countOverdue > 0 && (
                  <button
                    onClick={() => setDueFilter('overdue')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                      dueFilter === 'overdue'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-zinc-800/80 text-red-400 hover:text-red-300 border border-red-500/30'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Lewat Tempo</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        dueFilter === 'overdue' ? 'bg-zinc-950 text-red-400' : 'bg-red-500/30 text-red-300'
                      }`}
                    >
                      {countOverdue}
                    </span>
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-64 shrink-0">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari member / faktur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-200 pl-9 pr-3 py-1.5 rounded-xl outline-none focus:border-amber-500/60 transition placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* List Container */}
            {displayedList.length === 0 ? (
              <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Tidak Ada Tagihan Pada Kategori Ini</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan member cicilan dengan kata kunci "${searchQuery}".`
                    : 'Semua cicilan piutang member pada rentang ini sudah lunas atau belum mendekati jatuh tempo.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {displayedList.map((item) => {
                  const diff = item.diffDays;
                  const isToday = diff === 0;
                  const isTomorrow = diff === 1;
                  const isOverdue = diff < 0;

                  return (
                    <div
                      key={item.id}
                      className={`bg-zinc-950/70 border rounded-2xl p-4 transition-all hover:bg-zinc-950 flex flex-col justify-between group relative overflow-hidden ${
                        isToday
                          ? 'border-rose-500/40 shadow-sm shadow-rose-500/5'
                          : isTomorrow
                          ? 'border-orange-500/35'
                          : isOverdue
                          ? 'border-red-600/40 bg-red-950/10'
                          : 'border-zinc-800/90 hover:border-amber-500/30'
                      }`}
                    >
                      {/* Top Row: Customer & Due Status */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.member?.photo ? (
                              <img
                                src={item.member.photo}
                                alt={item.customer}
                                className="w-9 h-9 rounded-xl object-cover border border-zinc-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black text-xs flex items-center justify-center shrink-0">
                                {item.customer.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition">
                                {item.customer}
                              </h4>
                              <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                                <span>{item.member?.phone || 'No. Kontak -'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Urgency Badge */}
                          <div className="shrink-0">
                            {isToday && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                HARI INI
                              </span>
                            )}
                            {isTomorrow && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                BESOK (H-1)
                              </span>
                            )}
                            {!isToday && !isTomorrow && !isOverdue && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {diff} HARI LAGI
                              </span>
                            )}
                            {isOverdue && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-red-600/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                TELAT {Math.abs(diff)} HARI
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description & Invoice */}
                        <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-800/60 mb-3 space-y-1">
                          <p className="text-[11px] font-semibold text-zinc-300 line-clamp-1">{item.desc}</p>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span>Faktur: {item.id}</span>
                            <span className="text-zinc-500">Tgl Tempo: {formatDateIndo(item.dueDate || '')}</span>
                          </div>
                        </div>

                        {/* Amount Information */}
                        <div className="flex items-baseline justify-between mb-3 px-0.5">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sisa Tagihan</p>
                            <p className="text-base font-black text-rose-400 tracking-tight">
                              {formatRp(item.amountRemaining)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-400">Total Transaksi</p>
                            <p className="text-xs font-semibold text-zinc-300">{formatRp(item.amount)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                        <button
                          onClick={() => handleOpenWaModal(item)}
                          className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold py-1.5 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                          title="Kirim pengingat WhatsApp ke member"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ingatkan WA</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onPayPiutang) {
                              onPayPiutang(item.id);
                            } else {
                              onNavigateTab('piutang');
                            }
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-black py-1.5 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20"
                          title="Buka form pelunasan cicilan"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Lunasi</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4 CORE METRIC CARDS                                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Omset Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Omset Masuk Hari Ini</p>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-orange-400 mt-2 tracking-tight truncate">
            {formatRp(todayRevenue)}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mt-2 truncate">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>{todayTransactions.length} Transaksi terproses</span>
          </div>
        </div>

        {/* Visit Member Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Visit Member</p>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-2 tracking-tight truncate">
            {todayVisits} <span className="text-sm font-semibold text-zinc-400">Orang</span>
          </h3>
          <p className="text-[11px] text-zinc-400 mt-2 truncate">Check-in fasilitas gym hari ini</p>
        </div>

        {/* Sesi PT Card */}
        <div
          onClick={() => onNavigateTab('leader-pt')}
          className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Sesi PT Aktif</p>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-2 tracking-tight truncate">
            {activePTSessions} <span className="text-sm font-semibold text-zinc-400">Jadwal</span>
          </h3>
          <p className="text-[11px] text-purple-400 font-semibold mt-2 flex items-center gap-1 truncate">
            <span>Buka Dashboard Leader PT &rarr;</span>
          </p>
        </div>

        {/* Piutang Mengendap Card */}
        <div
          onClick={() => onNavigateTab('piutang')}
          className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Piutang Mengendap</p>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-400 mt-2 tracking-tight truncate">
            {formatRp(totalPiutang)}
          </h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400/90 mt-2 truncate">
            <span>Lihat Buku Piutang &rarr;</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HASIL STATUS SIKLUS MEMBERSHIP: AKTIF, MASA TENGGANG, EXPIRED             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition">
        {/* Background glow subtle */}
        <div className="absolute top-0 left-1/4 w-96 h-28 bg-emerald-500/5 blur-3xl pointer-events-none -mt-10" />

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Status & Siklus Keanggotaan Member
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wide">
                  Retensi & Akses Gym
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Total basis <span className="text-white font-bold">{totalMembers} member terdaftar</span>:{' '}
                <span className="text-emerald-400 font-bold">{countAktif} Aktif</span> (masa aman),{' '}
                <span className="text-amber-400 font-bold">{countTenggang} Masa Tenggang</span> (segera berakhir), dan{' '}
                <span className="text-rose-400 font-bold">{countExpired} Expired</span> (akses gerbang ditolak).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => onNavigateTab('membership')}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Beli / Renewal Paket</span>
            </button>

            <button
              onClick={() => onNavigateTab('crm')}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>CRM & Follow-up</span>
            </button>

            <button
              onClick={() => setIsMemberSectionOpen(!isMemberSectionOpen)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/60 p-2 rounded-xl transition"
              title={isMemberSectionOpen ? 'Sembunyikan rincian member' : 'Tampilkan rincian member'}
            >
              {isMemberSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 5 HIGHLIGHT CARDS: 🟢 AKTIF, 🟠 MASA TENGGANG, 🔴 EXPIRED, 🔵 FREEZE, ⚪ VISIT */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5">
          {/* 1. Member Aktif Card */}
          <div
            onClick={() => setMemberFilterTab(memberFilterTab === 'AKTIF' ? 'all' : 'AKTIF')}
            className={`rounded-2xl p-3.5 cursor-pointer transition relative overflow-hidden border ${
              memberFilterTab === 'AKTIF'
                ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-zinc-950/70 hover:bg-zinc-950 border-zinc-800/90 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                🟢 Aktif
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-emerald-400 tracking-tight">{countAktif}</h3>
              <span className="text-[11px] font-semibold text-zinc-400">({pctAktif}%)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-medium">Masa Aman</span>
              <span className="text-emerald-400 font-bold">Normal</span>
            </div>
          </div>

          {/* 2. Member Masa Tenggang Card */}
          <div
            onClick={() => setMemberFilterTab(memberFilterTab === 'MASA TENGGANG' ? 'all' : 'MASA TENGGANG')}
            className={`rounded-2xl p-3.5 cursor-pointer transition relative overflow-hidden border ${
              memberFilterTab === 'MASA TENGGANG'
                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-zinc-950/70 hover:bg-zinc-950 border-zinc-800/90 hover:border-amber-500/40'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                🟠 Tenggang
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-amber-400 tracking-tight">{countTenggang}</h3>
              <span className="text-[11px] font-semibold text-zinc-400">({pctTenggang}%)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-medium">H-7 s/d H-0</span>
              <span className="text-amber-400 font-bold">Prioritas</span>
            </div>
          </div>

          {/* 3. Member Expired Card */}
          <div
            onClick={() => setMemberFilterTab(memberFilterTab === 'EXPIRED' ? 'all' : 'EXPIRED')}
            className={`rounded-2xl p-3.5 cursor-pointer transition relative overflow-hidden border ${
              memberFilterTab === 'EXPIRED'
                ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/30'
                : 'bg-zinc-950/70 hover:bg-zinc-950 border-zinc-800/90 hover:border-rose-500/40'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                🔴 Expired
              </span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <UserX className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-rose-400 tracking-tight">{countExpired}</h3>
              <span className="text-[11px] font-semibold text-zinc-400">({pctExpired}%)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-medium">Lewat Waktu</span>
              <span className="text-rose-400 font-bold">Ditolak</span>
            </div>
          </div>

          {/* 4. Member Freeze Card */}
          <div
            onClick={() => setMemberFilterTab(memberFilterTab === 'FREEZE' ? 'all' : 'FREEZE')}
            className={`rounded-2xl p-3.5 cursor-pointer transition relative overflow-hidden border ${
              memberFilterTab === 'FREEZE'
                ? 'bg-sky-500/20 border-sky-500 ring-2 ring-sky-500/30'
                : 'bg-zinc-950/70 hover:bg-zinc-950 border-zinc-800/90 hover:border-sky-500/40'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                🔵 Freeze
              </span>
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Snowflake className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-sky-400 tracking-tight">{countFreeze}</h3>
              <span className="text-[11px] font-semibold text-zinc-400">({pctFreeze}%)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-medium">Ditangguhkan</span>
              <span className="text-sky-300 font-bold">Cuti/Sakit</span>
            </div>
          </div>

          {/* 5. Member Visit Harian Card */}
          <div
            onClick={() => setMemberFilterTab(memberFilterTab === 'VISIT' ? 'all' : 'VISIT')}
            className={`rounded-2xl p-3.5 cursor-pointer transition relative overflow-hidden border ${
              memberFilterTab === 'VISIT'
                ? 'bg-zinc-700/30 border-zinc-400 ring-2 ring-zinc-400/30'
                : 'bg-zinc-950/70 hover:bg-zinc-950 border-zinc-800/90 hover:border-zinc-500/40'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                ⚪ Visit
              </span>
              <div className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-zinc-200 tracking-tight">{countVisit}</h3>
              <span className="text-[11px] font-semibold text-zinc-400">({pctVisit}%)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-medium">Akses Harian</span>
              <span className="text-zinc-300 font-bold">Non-Member</span>
            </div>
          </div>
        </div>

        {/* PROPORTIONAL RETENTION PROGRESS BAR */}
        <div className="mt-4 pt-3 border-t border-zinc-800/60">
          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 mb-1.5 flex-wrap gap-2">
            <span>Rasio Distribusi Status Keanggotaan RFA GYM</span>
            <span>
              🟢 {countAktif} Aktif • 🟠 {countTenggang} Tenggang • 🔴 {countExpired} Expired • 🔵 {countFreeze} Freeze • ⚪ {countVisit} Visit
            </span>
          </div>
          <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800 p-0.5 gap-0.5">
            {pctAktif > 0 && (
              <div
                style={{ width: `${pctAktif}%` }}
                className="bg-emerald-500 rounded-l-full h-full transition-all duration-500"
                title={`Member Aktif: ${countAktif} (${pctAktif}%)`}
              />
            )}
            {pctTenggang > 0 && (
              <div
                style={{ width: `${pctTenggang}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`Masa Tenggang: ${countTenggang} (${pctTenggang}%)`}
              />
            )}
            {pctExpired > 0 && (
              <div
                style={{ width: `${pctExpired}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Member Expired: ${countExpired} (${pctExpired}%)`}
              />
            )}
            {pctFreeze > 0 && (
              <div
                style={{ width: `${pctFreeze}%` }}
                className="bg-sky-400 h-full transition-all duration-500"
                title={`Member Freeze: ${countFreeze} (${pctFreeze}%)`}
              />
            )}
            {pctVisit > 0 && (
              <div
                style={{ width: `${pctVisit}%` }}
                className="bg-zinc-400 rounded-r-full h-full transition-all duration-500"
                title={`Member Visit: ${countVisit} (${pctVisit}%)`}
              />
            )}
          </div>
        </div>

        {/* COLLAPSIBLE MEMBER DRILLDOWN LIST */}
        {isMemberSectionOpen && (
          <div className="mt-5 pt-4 border-t border-zinc-800 space-y-4">
            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <button
                  onClick={() => setMemberFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    memberFilterTab === 'all'
                      ? 'bg-zinc-200 text-zinc-950 shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
                  }`}
                >
                  <span>Semua</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-zinc-700 text-zinc-300">
                    {totalMembers}
                  </span>
                </button>

                <button
                  onClick={() => setMemberFilterTab('AKTIF')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    memberFilterTab === 'AKTIF'
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20'
                      : 'bg-zinc-800/80 text-emerald-400 hover:text-emerald-300 border border-zinc-700/60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>🟢 Aktif</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      memberFilterTab === 'AKTIF' ? 'bg-zinc-950 text-emerald-400' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {countAktif}
                  </span>
                </button>

                <button
                  onClick={() => setMemberFilterTab('MASA TENGGANG')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    memberFilterTab === 'MASA TENGGANG'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20'
                      : 'bg-zinc-800/80 text-amber-400 hover:text-amber-300 border border-zinc-700/60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>🟠 Masa Tenggang</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      memberFilterTab === 'MASA TENGGANG' ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {countTenggang}
                  </span>
                </button>

                <button
                  onClick={() => setMemberFilterTab('EXPIRED')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    memberFilterTab === 'EXPIRED'
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                      : 'bg-zinc-800/80 text-rose-400 hover:text-rose-300 border border-zinc-700/60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>🔴 Expired</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      memberFilterTab === 'EXPIRED' ? 'bg-rose-950 text-rose-300' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {countExpired}
                  </span>
                </button>

                <button
                  onClick={() => setMemberFilterTab('FREEZE')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    memberFilterTab === 'FREEZE'
                      ? 'bg-sky-500 text-zinc-950 shadow-sm shadow-sky-500/20'
                      : 'bg-zinc-800/80 text-sky-400 hover:text-sky-300 border border-zinc-700/60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>🔵 Freeze</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      memberFilterTab === 'FREEZE' ? 'bg-zinc-950 text-sky-400' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {countFreeze}
                  </span>
                </button>

                <button
                  onClick={() => setMemberFilterTab('VISIT')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                    memberFilterTab === 'VISIT'
                      ? 'bg-zinc-300 text-zinc-950 shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-300 hover:text-white border border-zinc-700/60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span>⚪ Visit</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      memberFilterTab === 'VISIT' ? 'bg-zinc-950 text-zinc-300' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {countVisit}
                  </span>
                </button>
              </div>

              {/* Search Member */}
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, ID, No. HP, PIC..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-700/70 rounded-xl pl-9 pr-8 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-500"
                />
                {memberSearchQuery && (
                  <button
                    onClick={() => setMemberSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Member Cards Grid */}
            {displayedMemberList.length === 0 ? (
              <div className="text-center py-8 bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800 text-zinc-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Tidak ditemukan member untuk kriteria filter ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {displayedMemberList.map((m) => {
                  const badge = m.statusBadge;
                  const isExp = m.statusCategory === 'EXPIRED';
                  const isGrace = m.statusCategory === 'MASA TENGGANG';
                  const isFrz = m.statusCategory === 'FREEZE';
                  const isVis = m.statusCategory === 'VISIT';

                  return (
                    <div
                      key={m.id}
                      className={`bg-zinc-950/70 border rounded-2xl p-3.5 transition flex flex-col justify-between ${
                        isExp
                          ? 'border-rose-500/30 hover:border-rose-500/60'
                          : isGrace
                          ? 'border-amber-500/30 hover:border-amber-500/60'
                          : isFrz
                          ? 'border-sky-500/35 hover:border-sky-500/70 bg-sky-950/5'
                          : isVis
                          ? 'border-zinc-800 hover:border-zinc-700'
                          : 'border-emerald-500/30 hover:border-emerald-500/60'
                      }`}
                    >
                      <div>
                        {/* Member Header */}
                        <div className="flex items-start gap-3">
                          <img
                            src={
                              m.photo ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
                            }
                            alt={m.name}
                            className={`w-11 h-11 rounded-xl object-cover border-2 shrink-0 ${
                              isExp
                                ? 'border-rose-500/50'
                                : isGrace
                                ? 'border-amber-500/50'
                                : isFrz
                                ? 'border-sky-500/50'
                                : isVis
                                ? 'border-zinc-700'
                                : 'border-emerald-500/50'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-white truncate">{m.name}</h4>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider shrink-0 border ${badge.badgeBg} ${badge.badgeColor} ${badge.badgeBorder}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                                {badge.status}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              {m.id} • {m.phone}
                            </p>
                          </div>
                        </div>

                        {/* Status Details */}
                        <div className="mt-3 bg-zinc-900/80 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-zinc-800/80">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Jatuh Tempo:</span>
                            <span
                              className={`font-bold ${
                                isExp
                                  ? 'text-rose-400'
                                  : isGrace
                                  ? 'text-amber-400'
                                  : isFrz
                                  ? 'text-sky-300'
                                  : 'text-zinc-200'
                              }`}
                            >
                              {formatDateIndo(m.expired)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Status Masa Aktif:</span>
                            <span
                              className={`font-black ${
                                isExp
                                  ? 'text-rose-400'
                                  : isGrace
                                  ? 'text-amber-300'
                                  : isFrz
                                  ? 'text-sky-400'
                                  : isVis
                                  ? 'text-zinc-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {isFrz
                                ? `Dibekukan (${m.freezeReason || 'Cuti'})`
                                : isVis
                                ? 'Kunjungan Harian'
                                : isExp
                                ? `Lewat ${Math.abs(m.diffDays)} hari lalu`
                                : m.diffDays === 0
                                ? 'Berakhir HARI INI'
                                : `${m.diffDays} hari lagi`}
                            </span>
                          </div>
                          {isFrz && m.freezePlannedEndDate && (
                            <div className="flex justify-between items-center text-[10px] text-sky-400/90 pt-1 border-t border-zinc-800">
                              <span>Rencana Selesai:</span>
                              <span className="font-mono font-bold">{formatDateIndo(m.freezePlannedEndDate)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1 border-t border-zinc-800 text-[10px]">
                            <span className="text-zinc-400">PIC Sales:</span>
                            <span className="text-zinc-300 font-semibold truncate max-w-[130px]">
                              {m.picName || '-'}
                            </span>
                          </div>
                          {m.ptQuota > 0 && (
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-zinc-400">Sisa Kuota PT:</span>
                              <span className="text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.2 rounded">
                                {m.ptQuota} Sesi
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center gap-2">
                        {isFrz ? (
                          <button
                            onClick={() => onNavigateTab('freeze')}
                            className="flex-1 bg-sky-500 hover:bg-sky-400 text-zinc-950 text-[11px] font-black py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 shadow-sm shadow-sky-500/20 cursor-pointer"
                            title="Buka menu Freeze & Unfreeze"
                          >
                            <Snowflake className="w-3.5 h-3.5" />
                            <span>Kelola Freeze</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenRenewalWaModal(m)}
                              className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5"
                              title="Kirim pesan WhatsApp pengingat perpanjangan"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Ingatkan WA</span>
                            </button>

                            <button
                              onClick={() => onNavigateTab('membership')}
                              className="flex-1 bg-orange-500 hover:bg-orange-400 text-zinc-950 text-[11px] font-black py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 shadow-sm shadow-orange-500/20"
                              title="Perpanjang paket membership"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Renewal</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Trend Omset Finansial 7 Hari Terakhir
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Pendapatan riil dari kasir POS, penjualan paket, dan cicilan lunas</p>
          </div>
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-xl">
            Aktif Berjalan
          </span>
        </div>

        <div className="h-[240px] w-full relative">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      {/* Quick Access Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('absen')}
          className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition">Absen Member & Staf</h4>
              <p className="text-[10px] text-zinc-400">Scanner Check-in & Clock In Staf</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition" />
        </div>

        <div
          onClick={() => onNavigateTab('membership')}
          className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition">Beli Paket & Cicilan</h4>
              <p className="text-[10px] text-zinc-400">Membership, Solo/Couple/Trio & DP 50%</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition" />
        </div>

        <div
          onClick={() => onNavigateTab('piutang')}
          className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition">Buku Piutang & Cicilan</h4>
              <p className="text-[10px] text-zinc-400">Pelunasan cicilan kasbon tanpa duplikasi</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PREVIEW & KIRIM PENGINGAT WHATSAPP                                   */}
      {/* ========================================================================= */}
      {waModal && waModal.isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {waModal.title || 'Pengingat WhatsApp'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {waModal.type === 'renewal'
                      ? 'Kirim pesan pengingat perpanjangan masa aktif langsung ke WhatsApp member'
                      : 'Kirim pesan reminder penagihan langsung ke member'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWaModal(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Info */}
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Nama Member:</span>
                <span className="font-bold text-white">{waModal.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">No. WhatsApp:</span>
                <span className="font-bold text-emerald-400">{waModal.phone}</span>
              </div>
              {waModal.amount && waModal.amount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Sisa Tagihan:</span>
                  <span className="font-bold text-rose-400">{formatRp(waModal.amount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-zinc-400">
                  {waModal.type === 'renewal' ? 'Tanggal Expired:' : 'Jatuh Tempo:'}
                </span>
                <span className="font-bold text-zinc-200">{formatDateIndo(waModal.dueDate)}</span>
              </div>
            </div>

            {/* Textarea Preview */}
            <div className="space-y-1.5 mb-5">
              <label className="text-xs font-bold text-zinc-300">Draft Pesan Pengingat:</label>
              <textarea
                value={waModal.message}
                onChange={(e) => setWaModal({ ...waModal, message: e.target.value })}
                rows={7}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-200 outline-none focus:border-emerald-500 transition leading-relaxed font-mono"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyWaMessage}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                {waModal.copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{waModal.copied ? 'Tersalin ke Clipboard!' : 'Salin Pesan'}</span>
              </button>

              <button
                type="button"
                onClick={handleDirectWhatsApp}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Kirim via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {restockModal.isOpen && restockModal.product && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Restock Cepat Kasir POS</h3>
                  <p className="text-[11px] text-zinc-400">Tambah persediaan stok barang langsung</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockModal({ isOpen: false, product: null, qty: '' })}
                className="text-zinc-500 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80">
              {restockModal.product.img && restockModal.product.img.trim() ? (
                <img
                  src={restockModal.product.img.trim()}
                  alt={restockModal.product.name}
                  className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs shrink-0">
                  PROD
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md">
                    {restockModal.product.cat}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      restockModal.product.stock <= 0
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    Stok Saat Ini: {restockModal.product.stock} Item
                  </span>
                </div>
                <p className="text-xs font-bold text-white mt-1 truncate">{restockModal.product.name}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Harga Jual: <span className="text-orange-400 font-bold">{formatRp(restockModal.product.price)}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Jumlah Stok Masuk (Item):
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  required
                  value={restockModal.qty}
                  onChange={(e) => setRestockModal({ ...restockModal, qty: e.target.value })}
                  placeholder="Contoh: 24"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 font-bold"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Stok baru setelah restock:{' '}
                  <span className="text-emerald-400 font-bold">
                    {restockModal.product.stock + (Number(restockModal.qty) || 0)} item
                  </span>
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRestockModal({ isOpen: false, product: null, qty: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-blue-900/30"
                >
                  <Boxes className="w-3.5 h-3.5" /> Konfirmasi Restock (+{restockModal.qty || '0'})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


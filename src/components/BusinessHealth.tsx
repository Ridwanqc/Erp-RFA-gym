import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  Activity,
  HeartPulse,
  Users,
  DollarSign,
  Dumbbell,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Zap,
  Target,
  Download,
  Printer,
  FileDown,
  Loader2,
  Eye,
  X,
  Building2,
  Check
} from 'lucide-react';
import { Transaction, Schedule, Member, Attendance } from '../types';
import { formatRp, APP_TODAY, formatDateIndo, getDayDiff, getTimestamp } from '../utils/formatters';

export interface BusinessHealthProps {
  totalActiveMembers?: number;
  dailyRevenue?: number;
  totalActivePTSessions?: number;
  pendingPiutangCount?: number;
  totalPendingPiutangAmount?: number;
  transactions?: Transaction[];
  schedules?: Schedule[];
  members?: Member[];
  attendances?: Attendance[];
  onNavigateTab: (tab: any) => void;
  className?: string;
}

export const BusinessHealth: React.FC<BusinessHealthProps> = ({
  totalActiveMembers: propActiveMembers,
  dailyRevenue: propDailyRevenue,
  totalActivePTSessions: propActivePTSessions,
  pendingPiutangCount: propPendingPiutangCount,
  totalPendingPiutangAmount: propTotalPiutang,
  transactions = [],
  schedules = [],
  members = [],
  attendances = [],
  onNavigateTab,
  className = ''
}) => {
  const [showDiagnosticDetail, setShowDiagnosticDetail] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'members' | 'revenue' | 'pt' | 'piutang'>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const printableReportRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadReport = async () => {
    if (!printableReportRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      // Small pause for rendering stability and fonts
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = printableReportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 840
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      if (printHeight <= pdfHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, printWidth, printHeight);
      } else {
        let heightLeft = printHeight;
        let position = margin;
        pdf.addImage(imgData, 'PNG', margin, position, printWidth, printHeight);
        heightLeft -= (pdfHeight - margin * 2);

        while (heightLeft > 0) {
          position = heightLeft - printHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, printWidth, printHeight);
          heightLeft -= (pdfHeight - margin * 2);
        }
      }

      const fileName = `GymPro_Business_Health_Report_${APP_TODAY}.pdf`;
      pdf.save(fileName);

      setSuccessAlert(`Laporan PDF Business Health berhasil diunduh (${fileName})`);
      setTimeout(() => {
        setSuccessAlert(null);
      }, 6000);
    } catch (err) {
      console.error('Failed to generate PDF with html2canvas:', err);
      setSuccessAlert('Gagal membuat PDF otomatis. Anda dapat menggunakan tombol "Cetak dari Browser / Simpan PDF".');
      setTimeout(() => {
        setSuccessAlert(null);
      }, 6000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintFromBrowser = () => {
    window.print();
  };

  const renderPrintableContent = () => {
    return (
      <div
        className="bg-white text-slate-900 p-8 font-sans"
        style={{ width: '820px', margin: '0 auto', boxSizing: 'border-box' }}
      >
        {/* Document Header */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[11px] font-black uppercase tracking-wider mb-1.5">
              GYMPRO FITNESS & ERP ENTERPRISE
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              LAPORAN KESEHATAN & VITALITAS BISNIS
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Executive Business Health & Daily KPI Performance Audit
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <div className="font-bold text-slate-800">
              Tanggal: <span className="font-mono text-slate-950">{formatDateIndo(APP_TODAY)}</span>
            </div>
            <div className="text-slate-500">
              Waktu Cetak: <span className="font-mono font-semibold text-slate-700">{getTimestamp()}</span>
            </div>
            <div className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              Status Sistem: Real-Time Verified
            </div>
          </div>
        </div>

        {/* Executive Summary & Vitality Index */}
        <div className="my-5 p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Skor Vitalitas Bisnis
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                  healthEvaluation.totalScore >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : healthEvaluation.totalScore >= 65
                    ? 'bg-blue-100 text-blue-800'
                    : healthEvaluation.totalScore >= 50
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {healthEvaluation.badgeText}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {healthEvaluation.statusSummary}
            </p>
          </div>
          <div className="text-right bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="text-[10px] uppercase font-extrabold text-slate-400">Health Index</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {healthEvaluation.totalScore}
              <span className="text-sm font-semibold text-slate-400">/100</span>
            </div>
          </div>
        </div>

        {/* 4 Core Metrics Grid */}
        <div className="mb-6">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
            4 Indikator Vital Utama Operasional
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {/* 1. Total Active Members */}
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Total Active Members</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {memberMetrics.activeRate}% Keaktifan
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-950 font-mono">
                {memberMetrics.active} <span className="text-sm font-semibold text-indigo-800">Member</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-indigo-100">
                <div className="flex justify-between">
                  <span>Masa Aman (&gt; 7 hari):</span>
                  <span className="font-bold text-emerald-700">{memberMetrics.safeActive} org</span>
                </div>
                <div className="flex justify-between">
                  <span>Masa Tenggang (H-7 s/d H-0):</span>
                  <span className="font-bold text-amber-700">{memberMetrics.gracePeriod} org</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Terdaftar di Database:</span>
                  <span className="font-bold text-slate-700">{memberMetrics.total} org</span>
                </div>
              </div>
            </div>

            {/* 2. Daily Revenue */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Daily Revenue</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {revenueMetrics.targetAchievedPct}% Target
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-950 font-mono">
                {formatRp(revenueMetrics.revenue)}
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-emerald-100">
                <div className="flex justify-between">
                  <span>Transaksi Kasir Hari Ini:</span>
                  <span className="font-bold text-slate-800">{revenueMetrics.trxCount} transaksi</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Acuan Harian:</span>
                  <span className="font-bold text-slate-800">{formatRp(revenueMetrics.dailyTarget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Kas:</span>
                  <span className="font-bold text-emerald-700">Penerimaan Riil Kasir</span>
                </div>
              </div>
            </div>

            {/* 3. Total Active PT Sessions */}
            <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900">Total Active PT Sessions</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                  Antrean Aktif
                </span>
              </div>
              <div className="text-2xl font-black text-orange-950 font-mono">
                {ptMetrics.activeSessions} <span className="text-sm font-semibold text-orange-800">Sesi</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-orange-100">
                <div className="flex justify-between">
                  <span>Sesi Terjadwal Hari Ini:</span>
                  <span className="font-bold text-orange-800">{ptMetrics.todaySessions} sesi</span>
                </div>
                <div className="flex justify-between">
                  <span>Sesi Jadwal Mendatang:</span>
                  <span className="font-bold text-slate-700">{ptMetrics.upcomingSessions} sesi</span>
                </div>
                <div className="flex justify-between">
                  <span>Selesai Terlaksana Hari Ini:</span>
                  <span className="font-bold text-emerald-700">{ptMetrics.completedToday} sesi</span>
                </div>
              </div>
            </div>

            {/* 4. Pending Piutang Count */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">Pending Piutang Count</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                    piutangMetrics.overdueCount > 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {piutangMetrics.overdueCount > 0 ? `${piutangMetrics.overdueCount} Overdue` : 'Terkendali'}
                </span>
              </div>
              <div className="text-2xl font-black text-rose-950 font-mono">
                {piutangMetrics.count} <span className="text-sm font-semibold text-rose-800">Tagihan</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-rose-100">
                <div className="flex justify-between">
                  <span>Total Nilai Piutang:</span>
                  <span className="font-bold text-rose-700 font-mono">{formatRp(piutangMetrics.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jatuh Tempo dlm 3 Hari:</span>
                  <span className="font-bold text-amber-700">{piutangMetrics.dueSoonCount} tagihan</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Tertunggak:</span>
                  <span className="font-bold text-rose-700">{piutangMetrics.overdueCount} tagihan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Pillar Score Breakdown */}
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3">
            Rincian Pembobotan Skor Diagnostik
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold">Retensi Member</div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {healthEvaluation.memberScore}<span className="text-xs text-slate-400 font-normal">/30</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold">Arus Kas Harian</div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {healthEvaluation.revScore}<span className="text-xs text-slate-400 font-normal">/30</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold">Utilisasi Sesi PT</div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {healthEvaluation.ptScore}<span className="text-xs text-slate-400 font-normal">/20</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold">Kontrol Piutang</div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {healthEvaluation.debtScore}<span className="text-xs text-slate-400 font-normal">/20</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations & Action Plan */}
        <div className="mb-6">
          <div className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
            Rekomendasi Tindakan & Catatan Operasional
          </div>
          <div className="space-y-2">
            {healthEvaluation.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs space-y-0.5"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>{rec.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 pl-3 leading-relaxed">
                  {rec.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Official Signatures Section */}
        <div className="pt-4 border-t border-slate-300">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-8 text-center">
            Lembar Pengesahan & Tanda Tangan Resmi
          </div>
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="text-slate-600 mb-14">Disusun Oleh (Admin / Kasir)</div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">( ....................................... )</div>
              <div className="text-[10px] text-slate-500">Staff Operasional Kasir</div>
            </div>
            <div>
              <div className="text-slate-600 mb-14">Diverifikasi Oleh (Supervisor / PT)</div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">( ....................................... )</div>
              <div className="text-[10px] text-slate-500">Leader PT / Operations Lead</div>
            </div>
            <div>
              <div className="text-slate-600 mb-14">Disetujui Oleh (Manajemen / Owner)</div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">( ....................................... )</div>
              <div className="text-[10px] text-slate-500">General Manager / Gym Owner</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center">
          Dokumen ini digenerate secara otomatis oleh sistem GymPro ERP Enterprise menggunakan html2canvas. Seluruh hak cipta dilindungi.
        </div>
      </div>
    );
  };

  // =========================================================================
  // METRIC 1: TOTAL ACTIVE MEMBERS
  // =========================================================================
  const memberMetrics = useMemo(() => {
    const total = members.length;
    if (total === 0 && propActiveMembers !== undefined) {
      return {
        total: propActiveMembers,
        active: propActiveMembers,
        safeActive: propActiveMembers,
        gracePeriod: 0,
        expired: 0,
        activeRate: 100
      };
    }

    let activeCount = 0;
    let safeActive = 0;
    let gracePeriod = 0;
    let expired = 0;

    members.forEach((m) => {
      const diff = getDayDiff(m.expired, APP_TODAY);
      if (diff >= 0) {
        activeCount++;
        if (diff > 7) {
          safeActive++;
        } else {
          gracePeriod++;
        }
      } else {
        expired++;
      }
    });

    const finalActive = propActiveMembers !== undefined ? propActiveMembers : activeCount;
    const activeRate = total > 0 ? Math.round((finalActive / total) * 100) : 0;

    return {
      total,
      active: finalActive,
      safeActive,
      gracePeriod,
      expired,
      activeRate
    };
  }, [members, propActiveMembers]);

  // =========================================================================
  // METRIC 2: DAILY REVENUE
  // =========================================================================
  const revenueMetrics = useMemo(() => {
    let computedRevenue = 0;
    let todayTrxCount = 0;

    transactions.forEach((t) => {
      if (t.date === APP_TODAY && t.status !== 'VOID') {
        todayTrxCount++;
        if (t.status === 'Paid' || t.status === 'DP 50%') {
          computedRevenue += t.amountPaid || t.amount;
        } else if (t.type === 'Pelunasan Cicilan') {
          computedRevenue += t.amountPaid || t.amount;
        }
      }
    });

    const finalRevenue = propDailyRevenue !== undefined ? propDailyRevenue : computedRevenue;
    const dailyTarget = 3500000; // Standar target harian gym (Rp 3.5 Jt)
    const targetAchievedPct = Math.min(100, Math.round((finalRevenue / dailyTarget) * 100));

    return {
      revenue: finalRevenue,
      trxCount: todayTrxCount,
      dailyTarget,
      targetAchievedPct
    };
  }, [transactions, propDailyRevenue]);

  // =========================================================================
  // METRIC 3: TOTAL ACTIVE PT SESSIONS
  // =========================================================================
  const ptMetrics = useMemo(() => {
    const activeSchedules = schedules.filter((s) => s.status === 'Menunggu');
    const computedActiveCount = activeSchedules.length;
    const finalActivePT = propActivePTSessions !== undefined ? propActivePTSessions : computedActiveCount;

    const todaySessions = schedules.filter((s) => s.date === APP_TODAY && s.status === 'Menunggu').length;
    const upcomingSessions = schedules.filter((s) => s.date > APP_TODAY && s.status === 'Menunggu').length;
    const completedToday = schedules.filter((s) => s.date === APP_TODAY && s.status === 'Selesai').length;

    return {
      activeSessions: finalActivePT,
      todaySessions,
      upcomingSessions,
      completedToday
    };
  }, [schedules, propActivePTSessions]);

  // =========================================================================
  // METRIC 4: PENDING PIUTANG COUNT & AMOUNT
  // =========================================================================
  const piutangMetrics = useMemo(() => {
    const pendingTransactions = transactions.filter((t) => {
      const hasRemaining =
        (t.amountRemaining && t.amountRemaining > 0) ||
        t.status === 'DP 50%' ||
        t.status === 'BELUM LUNAS';
      return hasRemaining && t.status !== 'VOID';
    });

    const computedCount = pendingTransactions.length;
    const computedTotalAmount = pendingTransactions.reduce(
      (sum, t) => sum + (t.amountRemaining || 0),
      0
    );

    const finalCount = propPendingPiutangCount !== undefined ? propPendingPiutangCount : computedCount;
    const finalAmount = propTotalPiutang !== undefined ? propTotalPiutang : computedTotalAmount;

    // Breakdown urgency
    let overdueCount = 0;
    let dueSoonCount = 0; // <= 3 days
    let normalCount = 0;

    pendingTransactions.forEach((t) => {
      if (t.dueDate) {
        const diff = getDayDiff(t.dueDate, APP_TODAY);
        if (diff < 0) {
          overdueCount++;
        } else if (diff <= 3) {
          dueSoonCount++;
        } else {
          normalCount++;
        }
      } else {
        normalCount++;
      }
    });

    return {
      count: finalCount,
      totalAmount: finalAmount,
      overdueCount,
      dueSoonCount,
      normalCount
    };
  }, [transactions, propPendingPiutangCount, propTotalPiutang]);

  // =========================================================================
  // COMPOSITE BUSINESS HEALTH SCORE & DIAGNOSTIC (0 - 100)
  // =========================================================================
  const healthEvaluation = useMemo(() => {
    // 1. Member Base Health (Max 30 pts)
    const memberScore = Math.min(30, Math.round((memberMetrics.activeRate / 100) * 30));

    // 2. Revenue Health (Max 30 pts)
    const revScore = Math.min(30, Math.round((revenueMetrics.targetAchievedPct / 100) * 30));

    // 3. PT Utilization Health (Max 20 pts)
    // Healthy if >= 4 active sessions scheduled
    const ptScore = Math.min(20, Math.round((Math.min(ptMetrics.activeSessions, 8) / 8) * 20));

    // 4. Debt/Risk Control Health (Max 20 pts)
    // Deduct heavily if overdue accounts exist
    let debtScore = 20;
    if (piutangMetrics.overdueCount > 0) {
      debtScore -= Math.min(15, piutangMetrics.overdueCount * 5);
    }
    if (piutangMetrics.dueSoonCount > 3) {
      debtScore -= 3;
    }
    debtScore = Math.max(5, debtScore);

    const totalScore = Math.min(100, Math.max(0, memberScore + revScore + ptScore + debtScore));

    let tier: 'OPTIMAL' | 'BAIK' | 'PERHATIAN' | 'WASPADA' = 'OPTIMAL';
    let badgeText = 'Sehat Prima';
    let badgeColor = 'emerald';
    let statusSummary = 'Kondisi operasional dan finansial gym dalam status prima dengan arus kas lancar dan retensi tinggi.';

    if (totalScore >= 85) {
      tier = 'OPTIMAL';
      badgeText = 'Sehat Prima';
      badgeColor = 'emerald';
      statusSummary = 'Kinerja finansial hari ini melampaui benchmark dengan rasio keaktifan member yang solid.';
    } else if (totalScore >= 70) {
      tier = 'BAIK';
      badgeText = 'Stabil & Baik';
      badgeColor = 'cyan';
      statusSummary = 'Aktivitas bisnis berjalan stabil. Beberapa piutang dan jadwal PT dapat dioptimalkan lebih lanjut.';
    } else if (totalScore >= 50) {
      tier = 'PERHATIAN';
      badgeText = 'Perlu Perhatian';
      badgeColor = 'amber';
      statusSummary = 'Terdapat piutang menggantung atau potensi penurunan retensi member yang membutuhkan tindak lanjut.';
    } else {
      tier = 'WASPADA';
      badgeText = 'Waspada / Kritis';
      badgeColor = 'rose';
      statusSummary = 'Arus kas dan kepatuhan piutang memerlukan penanganan mendesak oleh manajemen kasir.';
    }

    // Actionable recommendations
    const recommendations: { title: string; desc: string; priority: 'high' | 'medium' | 'info'; tab: string }[] = [];

    if (piutangMetrics.overdueCount > 0) {
      recommendations.push({
        title: `Tagih ${piutangMetrics.overdueCount} Piutang Jatuh Tempo`,
        desc: `Terdapat ${piutangMetrics.overdueCount} invoice cicilan yang telah lewat tanggal jatuh tempo. Kirimkan pengingat WhatsApp dari modul Buku Piutang.`,
        priority: 'high',
        tab: 'piutang'
      });
    } else if (piutangMetrics.dueSoonCount > 0) {
      recommendations.push({
        title: `${piutangMetrics.dueSoonCount} Piutang Jatuh Tempo dalam 3 Hari`,
        desc: `Kirim reminder ramah untuk menjaga kelancaran penerimaan kas harian.`,
        priority: 'medium',
        tab: 'piutang'
      });
    }

    if (memberMetrics.gracePeriod > 0) {
      recommendations.push({
        title: `${memberMetrics.gracePeriod} Member di Masa Tenggang (H-7 s/d H-0)`,
        desc: `Hubungi member sebelum masa aktif kedaluwarsa agar akses turnstile gym tidak terkunci otomatis.`,
        priority: 'medium',
        tab: 'membership'
      });
    }

    if (ptMetrics.activeSessions > 0) {
      recommendations.push({
        title: `${ptMetrics.activeSessions} Sesi PT Menunggu Pelaksanaan`,
        desc: `Pastikan pelatih melakukan check-in pada Trainer Attendance Log dan menyelesaikan sesi sesuai jadwal.`,
        priority: 'info',
        tab: 'trainer-portal'
      });
    }

    if (revenueMetrics.targetAchievedPct < 60) {
      recommendations.push({
        title: `Pencapaian Target Harian ${revenueMetrics.targetAchievedPct}%`,
        desc: `Optimalkan penawaran paket renewal membership, suplemen POS, atau program personal training untuk mencapai target harian.`,
        priority: 'medium',
        tab: 'pos'
      });
    }

    return {
      totalScore,
      memberScore,
      revScore,
      ptScore,
      debtScore,
      tier,
      badgeText,
      badgeColor,
      statusSummary,
      recommendations
    };
  }, [memberMetrics, revenueMetrics, ptMetrics, piutangMetrics]);

  return (
    <div
      id="business-health-widget"
      className={`bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition ${className}`}
    >
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-orange-500/5 blur-3xl pointer-events-none -mt-10" />
      <div className="absolute bottom-0 right-0 w-80 h-32 bg-emerald-500/5 blur-3xl pointer-events-none -mb-10" />

      {/* ========================================================================= */}
      {/* HEADER SECTION: TITLE, LIVE BADGE & OVERALL HEALTH INDEX GAUGE            */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800/90">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 shadow-inner">
            <HeartPulse className="w-6 h-6 animate-pulse text-orange-400" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                Business Health
              </h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border flex items-center gap-1.5 ${
                  healthEvaluation.badgeColor === 'emerald'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : healthEvaluation.badgeColor === 'cyan'
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                    : healthEvaluation.badgeColor === 'amber'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{healthEvaluation.badgeText}</span>
              </span>

              <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline-block">
                • {formatDateIndo(APP_TODAY)}
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Ringkasan indikator vital operasional gym: basis member aktif, arus kas harian, utilisasi sesi Personal Trainer, dan pengendalian risiko piutang.
            </p>
          </div>
        </div>

        {/* Right Header Actions: Download Report Button, Preview Button & Health Score Meter */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {/* Download Report Button (html2canvas) */}
          <button
            id="btn-download-business-health-report"
            onClick={handleDownloadReport}
            disabled={isGeneratingPdf}
            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-orange-500/20 disabled:opacity-60 cursor-pointer"
            title="Download Laporan PDF Business Health menggunakan html2canvas"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-zinc-950" />
                <span>Download Report</span>
              </>
            )}
          </button>

          {/* Quick Preview & Print Button */}
          <button
            id="btn-preview-business-health-report"
            onClick={() => setShowPreviewModal(true)}
            className="px-3 py-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Pratinjau / Cetak Langsung Lembar Laporan"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Overall Health Score Meter */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800 px-3.5 py-2 rounded-2xl shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
                Health Score
              </div>
              <div className="flex items-baseline justify-end gap-1">
                <span
                  className={`text-2xl font-black ${
                    healthEvaluation.totalScore >= 80
                      ? 'text-emerald-400'
                      : healthEvaluation.totalScore >= 65
                      ? 'text-cyan-400'
                      : healthEvaluation.totalScore >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {healthEvaluation.totalScore}
                </span>
                <span className="text-xs text-zinc-400 font-bold">/100</span>
              </div>
            </div>

            {/* Circular Visual Indicator */}
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center p-1">
              <div
                className={`w-full h-full rounded-lg flex items-center justify-center font-black text-xs ${
                  healthEvaluation.totalScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : healthEvaluation.totalScore >= 65
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : healthEvaluation.totalScore >= 50
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <button
              onClick={() => setShowDiagnosticDetail(!showDiagnosticDetail)}
              className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 p-2 rounded-xl transition border border-zinc-700/60"
              title="Lihat rincian diagnostik kesehatan bisnis"
            >
              {showDiagnosticDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successAlert && (
        <div className="mt-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successAlert}</span>
          </div>
          <button
            onClick={() => setSuccessAlert(null)}
            className="text-zinc-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4 CORE METRIC TILES (MANDATORY IN USER SPECIFICATION)                      */}
      {/* 1. Total Active Members                                                   */}
      {/* 2. Daily Revenue                                                          */}
      {/* 3. Total Active PT Sessions                                               */}
      {/* 4. Pending Piutang Count                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* ===================================================================== */}
        {/* METRIC 1: TOTAL ACTIVE MEMBERS                                        */}
        {/* ===================================================================== */}
        <div
          id="metric-card-active-members"
          onClick={() => onNavigateTab('membership')}
          className="bg-zinc-950/70 hover:bg-zinc-950 border border-zinc-800/90 hover:border-indigo-500/50 rounded-2xl p-4 sm:p-4.5 cursor-pointer transition relative overflow-hidden group shadow-sm hover:shadow-indigo-500/10"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-indigo-300 transition">
                Total Active Members
              </span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:text-indigo-200 transition">
              {memberMetrics.active}{' '}
              <span className="text-xs font-semibold text-zinc-400">Member</span>
            </h3>
            <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
              {memberMetrics.activeRate}% Basis
            </span>
          </div>

          {/* Sub-status Progress & Breakdown */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{memberMetrics.safeActive} Aman</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-semibold">{memberMetrics.gracePeriod} Tenggang</span>
            </div>
            <span className="text-zinc-400 font-mono text-[10px]">
              Total: {memberMetrics.total}
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* METRIC 2: DAILY REVENUE                                               */}
        {/* ===================================================================== */}
        <div
          id="metric-card-daily-revenue"
          onClick={() => onNavigateTab('pos')}
          className="bg-zinc-950/70 hover:bg-zinc-950 border border-zinc-800/90 hover:border-orange-500/50 rounded-2xl p-4 sm:p-4.5 cursor-pointer transition relative overflow-hidden group shadow-sm hover:shadow-orange-500/10"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-orange-300 transition">
                Daily Revenue
              </span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-400 transition" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-orange-400 tracking-tight">
              {formatRp(revenueMetrics.revenue)}
            </h3>
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              {revenueMetrics.targetAchievedPct}% Target
            </span>
          </div>

          {/* Sub-status Progress & Breakdown */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>{revenueMetrics.trxCount} Trx Kasir Hari Ini</span>
            </div>
            <span className="text-zinc-400 text-[10px]">
              Tgt: {formatRp(revenueMetrics.dailyTarget)}
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* METRIC 3: TOTAL ACTIVE PT SESSIONS                                    */}
        {/* ===================================================================== */}
        <div
          id="metric-card-active-pt-sessions"
          onClick={() => onNavigateTab('trainer-portal')}
          className="bg-zinc-950/70 hover:bg-zinc-950 border border-zinc-800/90 hover:border-purple-500/50 rounded-2xl p-4 sm:p-4.5 cursor-pointer transition relative overflow-hidden group shadow-sm hover:shadow-purple-500/10"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-purple-300 transition">
                Total Active PT Sessions
              </span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-400 transition" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:text-purple-200 transition">
              {ptMetrics.activeSessions}{' '}
              <span className="text-xs font-semibold text-zinc-400">Sesi</span>
            </h3>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
              {ptMetrics.todaySessions} Hari Ini
            </span>
          </div>

          {/* Sub-status Progress & Breakdown */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3 h-3 text-purple-400" />
              <span>{ptMetrics.upcomingSessions} Mendatang</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400">{ptMetrics.completedToday} Selesai</span>
            </div>
            <span className="text-purple-400 font-semibold text-[10px] group-hover:underline">
              Buka Portal &rarr;
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* METRIC 4: PENDING PIUTANG COUNT                                       */}
        {/* ===================================================================== */}
        <div
          id="metric-card-pending-piutang"
          onClick={() => onNavigateTab('piutang')}
          className="bg-zinc-950/70 hover:bg-zinc-950 border border-zinc-800/90 hover:border-rose-500/50 rounded-2xl p-4 sm:p-4.5 cursor-pointer transition relative overflow-hidden group shadow-sm hover:shadow-rose-500/10"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-rose-300 transition">
                Pending Piutang Count
              </span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-rose-400 transition" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              {piutangMetrics.count}{' '}
              <span className="text-xs font-semibold text-zinc-400">Tagihan</span>
            </h3>
            {piutangMetrics.overdueCount > 0 ? (
              <span className="text-xs font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/40 animate-pulse">
                {piutangMetrics.overdueCount} Overdue
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                Terkontrol
              </span>
            )}
          </div>

          {/* Sub-status Progress & Breakdown */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 truncate">
              Total: <span className="text-rose-400 font-bold">{formatRp(piutangMetrics.totalAmount)}</span>
            </span>
            <span className="text-rose-400/90 font-semibold text-[10px] group-hover:underline shrink-0">
              Buku Piutang &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLLAPSIBLE DIAGNOSTIC DRILL-DOWN & OPERATIONAL RECOMMENDATIONS           */}
      {/* ========================================================================= */}
      {showDiagnosticDetail && (
        <div className="mt-5 pt-5 border-t border-zinc-800/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Diagnostik Vitalitas & Action Items Manajemen
              </h4>
            </div>
            <span className="text-[11px] text-zinc-400">
              Analisis cerdas berdasarkan data riil transaksi & aktivitas sistem
            </span>
          </div>

          {/* 4 Pillars Progress Meters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/70">
            {/* Pillar 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Retensi Member</span>
                <span className="font-mono font-bold text-indigo-400">
                  {healthEvaluation.memberScore}/30
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${(healthEvaluation.memberScore / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Kas Harian</span>
                <span className="font-mono font-bold text-orange-400">
                  {healthEvaluation.revScore}/30
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(healthEvaluation.revScore / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Sesi PT Aktif</span>
                <span className="font-mono font-bold text-purple-400">
                  {healthEvaluation.ptScore}/20
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(healthEvaluation.ptScore / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Kontrol Risiko Piutang</span>
                <span className="font-mono font-bold text-emerald-400">
                  {healthEvaluation.debtScore}/20
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(healthEvaluation.debtScore / 20) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {healthEvaluation.recommendations.map((rec, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateTab(rec.tab)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                  rec.priority === 'high'
                    ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60'
                    : rec.priority === 'medium'
                    ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {rec.priority === 'high' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : rec.priority === 'medium' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    )}
                    <span className="font-bold text-white">{rec.title}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed pl-5.5">
                    {rec.desc}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN PRINTABLE CONTAINER FOR HTML2CANVAS HIGH-RES CAPTURE               */}
      {/* ========================================================================= */}
      <div
        id="business-health-printable-wrapper"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '840px',
          zIndex: -100,
          opacity: 1,
          pointerEvents: 'none'
        }}
      >
        <div ref={printableReportRef}>
          {renderPrintableContent()}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: PRATINJAU DOKUMEN & CETAK LAPORAN (PRINT PREVIEW)                  */}
      {/* ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header Bar */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">
                    Pratinjau Laporan Business Health (Printable A4)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Dokumen resmi siap cetak dan ekspor PDF berbasis html2canvas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-modal-download-pdf"
                  onClick={handleDownloadReport}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                      <span>Membuat PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrintFromBrowser}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-zinc-600/80"
                  title="Cetak menggunakan dialog cetak browser (Ctrl+P)"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="hidden sm:inline">Cetak Browser</span>
                </button>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Document Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950/80 flex justify-center scrollbar-thin scrollbar-thumb-zinc-700">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-300 my-auto">
                {renderPrintableContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

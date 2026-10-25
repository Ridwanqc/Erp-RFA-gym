import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  UserX,
  MessageCircle,
  TrendingDown,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Send,
  Calendar,
  Gift,
  ArrowUpRight
} from 'lucide-react';
import { Member, Attendance, ChurnRiskAnalysis, ChurnRiskLevel } from '../../types';
import { formatIndonesianWhatsAppNumber } from '../../utils/whatsappHelper';

interface SmartChurnPredictionViewProps {
  members: Member[];
  attendances: Attendance[];
  showToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const SmartChurnPredictionView: React.FC<SmartChurnPredictionViewProps> = ({
  members,
  attendances,
  showToast
}) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | ChurnRiskLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [followUpStatuses, setFollowUpStatuses] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('gympro_churn_followup_status');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Calculate Churn Risk for all members
  const churnAnalysisList = useMemo(() => {
    const today = new Date();
    const todayMs = today.getTime();

    return members.map((member): ChurnRiskAnalysis => {
      // Find all attendances for this member
      const memberAtts = attendances.filter(
        (a) => a.memberId === member.id || a.memberName.toLowerCase() === member.name.toLowerCase()
      );

      // Find latest attendance date
      let lastVisitDate = member.joinDate || '2026-09-01';
      let daysSinceLastVisit = 25; // default if no attendances

      if (memberAtts.length > 0) {
        // sort descending
        const sorted = [...memberAtts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        lastVisitDate = sorted[0].date;
        const diffMs = todayMs - new Date(lastVisitDate).getTime();
        daysSinceLastVisit = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      } else if (member.expired) {
        // approximate using expiry if available
        daysSinceLastVisit = 18;
      }

      // Past 30 days visit count
      const thirtyDaysAgoMs = todayMs - 30 * 24 * 60 * 60 * 1000;
      const visitsPast30 = memberAtts.filter((a) => new Date(a.date).getTime() >= thirtyDaysAgoMs).length;

      // Determine Risk Level & Score
      let riskLevel: ChurnRiskLevel = 'LOW';
      let riskScore = 15;
      let primaryRiskReason = 'Kunjungan rutin dan konsisten';
      let winBackVoucher = 'FREE-SHAKE-2026';

      if (daysSinceLastVisit > 21) {
        riskLevel = 'CRITICAL';
        riskScore = Math.min(98, 70 + (daysSinceLastVisit - 21) * 2);
        primaryRiskReason = `Tidak berkunjung selama ${daysSinceLastVisit} hari berturut-turut`;
        winBackVoucher = 'WINBACK-FREE1SESSION';
      } else if (daysSinceLastVisit >= 14) {
        riskLevel = 'HIGH';
        riskScore = Math.min(85, 55 + (daysSinceLastVisit - 14) * 3);
        primaryRiskReason = `Absen 14–21 hari (${daysSinceLastVisit} hari)`;
        winBackVoucher = 'WINBACK-RENEW20';
      } else if (daysSinceLastVisit >= 7) {
        riskLevel = 'MEDIUM';
        riskScore = 35 + (daysSinceLastVisit - 7) * 2;
        primaryRiskReason = `Penurunan frekuensi kunjungan (${daysSinceLastVisit} hari absen)`;
        winBackVoucher = 'MOTIVASI-GYM';
      } else {
        riskLevel = 'LOW';
        riskScore = Math.max(5, 20 - visitsPast30 * 2);
        primaryRiskReason = `Member aktif (${visitsPast30}x latihan bulan ini)`;
      }

      return {
        memberId: member.id,
        memberName: member.name,
        phone: member.phone || '',
        email: member.email,
        photo: member.photo,
        membershipPlan: member.membershipType || 'Paket Bulanan',
        expiryDate: member.expired || 'N/A',
        lastVisitDate,
        daysSinceLastVisit,
        totalVisitsPast30Days: visitsPast30,
        totalVisitsPast60Days: memberAtts.length,
        riskScore,
        riskLevel,
        primaryRiskReason,
        winBackVoucherSuggested: winBackVoucher,
        followUpStatus: (followUpStatuses[member.id] as any) || 'UNCONTACTED'
      };
    });
  }, [members, attendances, followUpStatuses]);

  // Filtered List
  const filteredList = useMemo(() => {
    return churnAnalysisList
      .filter((item) => {
        const matchLevel = filterLevel === 'ALL' || item.riskLevel === filterLevel;
        const matchSearch =
          item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.phone.includes(searchQuery) ||
          item.membershipPlan.toLowerCase().includes(searchQuery.toLowerCase());
        return matchLevel && matchSearch;
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [churnAnalysisList, filterLevel, searchQuery]);

  // Counts
  const criticalCount = churnAnalysisList.filter((c) => c.riskLevel === 'CRITICAL').length;
  const highRiskCount = churnAnalysisList.filter((c) => c.riskLevel === 'HIGH').length;
  const mediumRiskCount = churnAnalysisList.filter((c) => c.riskLevel === 'MEDIUM').length;

  // Send WhatsApp Win-Back Message
  const handleSendWinBackWhatsApp = (item: ChurnRiskAnalysis) => {
    const phone = formatIndonesianWhatsAppNumber(item.phone);
    const text =
      `Halo kak ${item.memberName}! 🙌\n\n` +
      `Kami rindu kehadiranmu di gym! Terakhir kakak latihan sekitar ${item.daysSinceLastVisit} hari yang lalu (${item.lastVisitDate}). Tetap jaga konsistensi target kebugaranmu yuk! 💪🏋️\n\n` +
      `Khusus untuk kakak minggu ini, kami siapkan hadiah spesial:\n` +
      `🎁 *GRATIS 1 Sesi Konsultasi Body Goal & Trial Workout Bareng PT*\n` +
      `🎟️ Kode Voucher: *${item.winBackVoucherSuggested}*\n\n` +
      `Kapan rencana kakak mau latihan lagi? Resepsionis kami siap menyambut kedatangan kakak! ✨`;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    // Update status to CONTACTED
    const updated = { ...followUpStatuses, [item.memberId]: 'CONTACTED' };
    setFollowUpStatuses(updated);
    try {
      localStorage.setItem('gympro_churn_followup_status', JSON.stringify(updated));
    } catch {}

    window.open(waUrl, '_blank');
    showToast?.('WhatsApp Terbuka', `Menghubungi ${item.memberName} untuk win-back offer.`, 'success');
  };

  const getRiskBadge = (level: ChurnRiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          label: 'Kritis (>21 Hari)',
          color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
        };
      case 'HIGH':
        return {
          label: 'Tinggi (14–21 Hari)',
          color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        };
      case 'MEDIUM':
        return {
          label: 'Perhatian (7–14 Hari)',
          color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
        };
      default:
        return {
          label: 'Aktif Normal (<7 Hari)',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & AI Score Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Prediksi Risiko Member Berhenti (AI Churn Risk Alert)
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-700">
                    Retention CRM
                  </span>
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Mendeteksi otomatis member yang tidak hadir selama 14–21 hari terakhir untuk follow-up penawaran win-back sebelum masa aktif hangus.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div
            onClick={() => setFilterLevel('CRITICAL')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterLevel === 'CRITICAL'
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50 dark:bg-rose-950/30'
                : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Kritis (&gt; 21 Hari Absen)
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {criticalCount} Member
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Tingkat risiko berhenti sangat tinggi (churn &gt; 80%)
            </p>
          </div>

          <div
            onClick={() => setFilterLevel('HIGH')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterLevel === 'HIGH'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50 dark:bg-amber-950/30'
                : 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Berisiko Tinggi (14–21 Hari)
              </span>
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {highRiskCount} Member
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Perlu intervensi CRM &amp; ajakan kembali latihan
            </p>
          </div>

          <div
            onClick={() => setFilterLevel('ALL')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterLevel === 'ALL'
                ? 'border-slate-500 ring-2 ring-slate-500/20 bg-slate-50 dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Total Evaluasi
              </span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {members.length} Member
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {Math.round(((criticalCount + highRiskCount) / (members.length || 1)) * 100)}% populasi butuh re-engagement
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari member berisiko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterLevel === lvl
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {lvl === 'ALL'
                ? 'Semua'
                : lvl === 'CRITICAL'
                ? 'Kritis'
                : lvl === 'HIGH'
                ? 'Tinggi (14-21 Hari)'
                : lvl === 'MEDIUM'
                ? 'Sedang'
                : 'Aman'}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Members with Risk */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-5">Member</th>
                <th className="p-3.5">Terakhir Hadir</th>
                <th className="p-3.5 text-center">Lama Absen</th>
                <th className="p-3.5">Risk Score (AI)</th>
                <th className="p-3.5">Alasan Risiko</th>
                <th className="p-3.5">Status Follow-Up</th>
                <th className="p-3.5 pr-5 text-right">Tindakan CRM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.map((item) => {
                const badge = getRiskBadge(item.riskLevel);
                const isContacted = item.followUpStatus === 'CONTACTED';

                return (
                  <tr
                    key={item.memberId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 pl-5">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.memberName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.phone || 'No HP'} • {item.membershipPlan}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono">
                      {item.lastVisitDate}
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold ${
                          item.daysSinceLastVisit > 21
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : item.daysSinceLastVisit >= 14
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.daysSinceLastVisit} Hari
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              item.riskScore > 75
                                ? 'bg-rose-500'
                                : item.riskScore > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.riskScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.riskScore}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {item.primaryRiskReason}
                    </td>

                    <td className="p-3.5">
                      {isContacted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3" />
                          Sudah Dihubungi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          Belum Dihubungi
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => handleSendWinBackWhatsApp(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {isContacted ? 'Follow-Up Ulang' : 'Kirim Win-Back WA'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

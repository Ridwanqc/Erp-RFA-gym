import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  UserCheck,
  Clock,
  Dumbbell,
  Award,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Crown,
  Eye,
  X,
  Flame,
  Layers
} from 'lucide-react';
import { Member, Attendance } from '../types';
import { formatDateIndo, APP_TODAY } from '../utils/formatters';

interface MemberWorkoutAnalyticsSectionProps {
  members: Member[];
  attendances: Attendance[];
  activeBranchFilter?: string;
  onSelectMemberForCheckIn?: (memberId: string) => void;
}

export interface MemberTrainingStats {
  memberId: string;
  memberName: string;
  memberObj?: Member;
  avatar: string;
  membershipType: string;
  status: string;
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  totalHoursFormatted: string;
  averageMinutesPerSession: number;
  ptSessionsCount: number;
  regularSessionsCount: number;
  isCurrentlyTraining: boolean;
  lastSessionDate: string;
  lastSessionTimeIn: string;
  lastSessionTimeOut: string;
  lastSessionBranch: string;
  sessions: Attendance[];
}

// Utility: parse time string (e.g. "06:30 WIB", "08:15", "14:00") into minutes of day
export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

// Calculate session duration in minutes
export function calculateSessionMinutes(timeIn: string, timeOut?: string, sessionDate?: string): number {
  const inMins = parseTimeToMinutes(timeIn);
  if (inMins === null) return 60; // default 1 hour fallback

  if (timeOut && timeOut.trim() !== '') {
    const outMins = parseTimeToMinutes(timeOut);
    if (outMins !== null && outMins > inMins) {
      return outMins - inMins;
    }
    // If crossover past midnight or invalid, cap to reasonable gym session
    return 60;
  }

  // If ongoing today without timeOut, calculate elapsed time
  if (sessionDate === APP_TODAY) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    if (currentMins > inMins && currentMins - inMins <= 240) {
      return Math.max(30, currentMins - inMins);
    }
  }

  return 60; // Standard 60 minutes session estimate
}

// Check if an attendance record is valid, stored, and not cancelled/deleted
export function isValidAttendanceRecord(att: Attendance): boolean {
  if (!att) return false;
  if (!att.date || typeof att.date !== 'string' || att.date.trim() === '') return false;
  if (!att.timeIn || typeof att.timeIn !== 'string' || att.timeIn.trim() === '') return false;
  if (!att.memberId && !att.memberName) return false;

  const raw = att as any;
  if (raw.isCancelled === true || raw.cancelled === true || raw.deleted === true || raw.isDeleted === true) {
    return false;
  }
  if (raw.status) {
    const s = String(raw.status).toLowerCase().trim();
    if (s === 'batal' || s === 'cancelled' || s === 'canceled' || s === 'invalid' || s === 'deleted' || s === 'draft') {
      return false;
    }
  }

  return true;
}

// Normalize date string YYYY-MM-DD
export function normalizeDate(d?: string): string {
  if (!d) return '';
  return d.trim().substring(0, 10);
}

// Shift date by delta days (negative = past, positive = future)
export function shiftDateDays(baseIso: string, daysDelta: number): string {
  const safeBase = normalizeDate(baseIso) || APP_TODAY;
  const parts = safeBase.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return APP_TODAY;
  }
  const dt = new Date(parts[0], parts[1] - 1, parts[2] + daysDelta);
  if (isNaN(dt.getTime())) return APP_TODAY;
  const rY = dt.getFullYear();
  const rM = String(dt.getMonth() + 1).padStart(2, '0');
  const rD = String(dt.getDate()).padStart(2, '0');
  return `${rY}-${rM}-${rD}`;
}

// Generate array of ISO dates from startIso to endIso inclusive
export function generateDateRangeList(startIso: string, endIso: string): string[] {
  const safeStartIso = normalizeDate(startIso) || APP_TODAY;
  const safeEndIso = normalizeDate(endIso) || APP_TODAY;
  const startParts = safeStartIso.split('-').map(Number);
  const endParts = safeEndIso.split('-').map(Number);

  if (startParts.length < 3 || endParts.length < 3 || isNaN(startParts[0]) || isNaN(endParts[0])) {
    return [APP_TODAY];
  }

  let start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  let end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return [APP_TODAY];
  }

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  const result: string[] = [];
  const cur = new Date(start.getTime());
  let count = 0;
  while (cur <= end && count < 180) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    result.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
    count++;
  }
  return result;
}

export interface DailyVisitStat {
  date: string;
  dayName: string;
  shortDay: string;
  formattedDate: string;
  label: string;
  fullLabel: string;
  totalKunjungan: number;
  memberUnik: number;
  ptKunjungan: number;
  regulerKunjungan: number;
  totalJamLatihan: number;
  totalMenitLatihan: number;
  isToday: boolean;
  isPeak?: boolean;
}

export const MemberWorkoutAnalyticsSection: React.FC<MemberWorkoutAnalyticsSectionProps> = ({
  members,
  attendances,
  activeBranchFilter = 'ALL',
  onSelectMemberForCheckIn
}) => {
  // Evaluasi filter waktu: default 7 hari terakhir dihitung mulai hari ini
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '14days' | '30days' | 'month' | 'range' | 'all'>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>(shiftDateDays(APP_TODAY, -6));
  const [customEndDate, setCustomEndDate] = useState<string>(APP_TODAY);

  // Mode tampilan metrik grafik: 'both' (Jam Latihan & Kunjungan), 'hours' (Fokus Jam Latihan), 'visits' (Fokus Kunjungan)
  const [chartMetricMode, setChartMetricMode] = useState<'both' | 'hours' | 'visits'>('both');

  const [typeFilter, setTypeFilter] = useState<'all' | 'PT' | 'Reguler'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'hours' | 'sessions' | 'recent' | 'name'>('hours');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [detailModalStats, setDetailModalStats] = useState<MemberTrainingStats | null>(null);

  // Label for active selected period
  const activeDateLabel = useMemo(() => {
    if (timeFilter === 'today') return `Hari Ini (${formatDateIndo(APP_TODAY)})`;
    if (timeFilter === '7days') return `7 Hari Terakhir (${formatDateIndo(shiftDateDays(APP_TODAY, -6))} s/d ${formatDateIndo(APP_TODAY)})`;
    if (timeFilter === '14days') return `14 Hari Terakhir (${formatDateIndo(shiftDateDays(APP_TODAY, -13))} s/d ${formatDateIndo(APP_TODAY)})`;
    if (timeFilter === '30days') return `30 Hari Terakhir (${formatDateIndo(shiftDateDays(APP_TODAY, -29))} s/d ${formatDateIndo(APP_TODAY)})`;
    if (timeFilter === 'month') return `Bulan Ini (${formatDateIndo(`${APP_TODAY.substring(0, 7)}-01`)} s/d ${formatDateIndo(APP_TODAY)})`;
    if (timeFilter === 'range') return `Rentang Tanggal (${formatDateIndo(customStartDate)} s/d ${formatDateIndo(customEndDate)})`;
    return 'Semua Hari (Riwayat)';
  }, [timeFilter, customStartDate, customEndDate]);

  // 1. Generate Daily Visit Timeline Data dihitung mulai dari Hari Ini (APP_TODAY)
  const dailyVisitStats: DailyVisitStat[] = useMemo(() => {
    const todayIso = normalizeDate(APP_TODAY);
    let datesList: string[] = [];

    if (timeFilter === 'today') {
      datesList = [todayIso];
    } else if (timeFilter === '7days') {
      // 7 hari terakhir: dari H-6 s/d Hari Ini (total 7 hari)
      datesList = generateDateRangeList(shiftDateDays(todayIso, -6), todayIso);
    } else if (timeFilter === '14days') {
      // 14 hari terakhir: dari H-13 s/d Hari Ini (total 14 hari)
      datesList = generateDateRangeList(shiftDateDays(todayIso, -13), todayIso);
    } else if (timeFilter === '30days') {
      // 30 hari terakhir: dari H-29 s/d Hari Ini (total 30 hari)
      datesList = generateDateRangeList(shiftDateDays(todayIso, -29), todayIso);
    } else if (timeFilter === 'month') {
      // Bulan ini: dari tanggal 1 s/d Hari Ini
      const monthStart = `${todayIso.substring(0, 7)}-01`;
      datesList = generateDateRangeList(monthStart, todayIso);
    } else if (timeFilter === 'range') {
      // Rentang tanggal kustom pilihan user
      const startIso = normalizeDate(customStartDate) || shiftDateDays(todayIso, -6);
      const endIso = normalizeDate(customEndDate) || todayIso;
      datesList = generateDateRangeList(startIso, endIso);
    } else if (timeFilter === 'all') {
      const allDatesSet = new Set<string>();
      attendances.forEach((a) => {
        if (isValidAttendanceRecord(a)) {
          allDatesSet.add(normalizeDate(a.date));
        }
      });
      allDatesSet.add(todayIso);
      const sorted = Array.from(allDatesSet).sort();
      if (sorted.length < 7) {
        datesList = generateDateRangeList(shiftDateDays(todayIso, -6), todayIso);
      } else {
        datesList = sorted;
      }
    }

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const attendancesByDate = new Map<string, Attendance[]>();
    attendances.forEach((att) => {
      if (!isValidAttendanceRecord(att)) return;

      if (activeBranchFilter !== 'ALL') {
        const matchesBranch =
          att.branchId === activeBranchFilter ||
          att.branchName?.toLowerCase().includes(activeBranchFilter.toLowerCase());
        if (!matchesBranch) return;
      }

      if (typeFilter !== 'all' && att.type !== typeFilter) return;

      const dIso = normalizeDate(att.date);
      const list = attendancesByDate.get(dIso) || [];
      list.push(att);
      attendancesByDate.set(dIso, list);
    });

    let peakHours = 0;

    const stats: DailyVisitStat[] = datesList.map((iso) => {
      const [y, m, dNum] = iso.split('-').map(Number);
      const dateObj = new Date(y, m - 1, dNum);
      const dayIndex = isNaN(dateObj.getDay()) ? 0 : dateObj.getDay();
      const shortDay = dayNames[dayIndex] || 'Hari';
      const fullDay = fullDayNames[dayIndex] || 'Hari';
      const monthName = monthNames[m - 1] || '';

      const dayAtts = attendancesByDate.get(iso) || [];
      const totalKunjungan = dayAtts.length;

      // Unique member calculation per day (deduped so multiple check-ins on same day count as 1 unique member)
      const uniqueSet = new Set<string>();
      let ptCount = 0;
      let regCount = 0;
      let totalMins = 0;

      dayAtts.forEach((att) => {
        const key = (att.memberId && att.memberId.trim()) ? att.memberId.trim() : att.memberName.toLowerCase().trim();
        uniqueSet.add(key);

        if (att.type === 'PT') ptCount += 1;
        else regCount += 1;

        totalMins += calculateSessionMinutes(att.timeIn, att.timeOut, att.date);
      });

      const totalJam = parseFloat((totalMins / 60).toFixed(1));
      if (totalJam > peakHours) {
        peakHours = totalJam;
      }

      // Compact label for X-Axis when there are many dates
      const displayLabel = datesList.length > 14
        ? `${dNum}/${m}`
        : `${shortDay}, ${dNum}/${m}`;

      return {
        date: iso,
        dayName: fullDay,
        shortDay,
        formattedDate: `${dNum} ${monthName}`,
        label: displayLabel,
        fullLabel: `${fullDay}, ${dNum} ${monthName} ${y}`,
        totalKunjungan,
        memberUnik: uniqueSet.size,
        ptKunjungan: ptCount,
        regulerKunjungan: regCount,
        totalJamLatihan: totalJam,
        totalMenitLatihan: totalMins,
        isToday: iso === todayIso
      };
    });

    stats.forEach((s) => {
      if (s.totalJamLatihan === peakHours && peakHours > 0) {
        s.isPeak = true;
      }
    });

    return stats;
  }, [attendances, activeBranchFilter, typeFilter, timeFilter, customStartDate, customEndDate]);

  // 2. Filter raw attendances for member aggregation within active timeframe
  const filteredAttendances = useMemo(() => {
    const datesSet = new Set(dailyVisitStats.map((d) => d.date));

    return attendances.filter((att) => {
      if (!isValidAttendanceRecord(att)) return false;

      const attIso = normalizeDate(att.date);
      if (!datesSet.has(attIso)) return false;

      if (activeBranchFilter !== 'ALL') {
        const matchesBranch =
          att.branchId === activeBranchFilter ||
          att.branchName?.toLowerCase().includes(activeBranchFilter.toLowerCase());
        if (!matchesBranch) return false;
      }

      if (typeFilter !== 'all' && att.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [attendances, dailyVisitStats, activeBranchFilter, typeFilter]);

  // 3. Aggregate per UNIQUE member for member details and training hours
  const memberStatsList: MemberTrainingStats[] = useMemo(() => {
    const map = new Map<string, {
      memberId: string;
      memberName: string;
      sessions: Attendance[];
      totalMinutes: number;
      ptCount: number;
      regCount: number;
      isCurrentlyTraining: boolean;
      lastAtt: Attendance | null;
    }>();

    filteredAttendances.forEach((att) => {
      const matchedMember = members.find(
        (m) =>
          (att.memberId && m.id === att.memberId) ||
          (att.memberName && m.name.toLowerCase().trim() === att.memberName.toLowerCase().trim())
      );

      const canonicalKey = matchedMember?.id || (att.memberId && att.memberId.trim()) || att.memberName.toLowerCase().trim();

      const existing = map.get(canonicalKey) || {
        memberId: matchedMember?.id || att.memberId || canonicalKey,
        memberName: matchedMember?.name || att.memberName,
        sessions: [],
        totalMinutes: 0,
        ptCount: 0,
        regCount: 0,
        isCurrentlyTraining: false,
        lastAtt: null
      };

      const durationMins = calculateSessionMinutes(att.timeIn, att.timeOut, att.date);
      existing.totalMinutes += durationMins;
      existing.sessions.push(att);
      if (att.type === 'PT') existing.ptCount += 1;
      else existing.regCount += 1;

      if (normalizeDate(att.date) === normalizeDate(APP_TODAY) && (!att.timeOut || att.timeOut.trim() === '')) {
        existing.isCurrentlyTraining = true;
      }

      if (!existing.lastAtt || new Date(att.date + ' ' + (parseTimeToMinutes(att.timeIn) || 0)) > new Date(existing.lastAtt.date + ' ' + (parseTimeToMinutes(existing.lastAtt.timeIn) || 0))) {
        existing.lastAtt = att;
      }

      map.set(canonicalKey, existing);
    });

    const result: MemberTrainingStats[] = [];

    map.forEach((entry) => {
      const matchedMember = members.find(
        (m) => m.id === entry.memberId || m.name.toLowerCase().trim() === entry.memberName.toLowerCase().trim()
      );

      const totalHoursNum = parseFloat((entry.totalMinutes / 60).toFixed(1));
      const hoursInt = Math.floor(entry.totalMinutes / 60);
      const minsRem = entry.totalMinutes % 60;
      const formattedDuration = `${hoursInt} Jam ${minsRem > 0 ? minsRem + ' Mnt' : ''}`.trim();

      const avgMins = entry.sessions.length > 0 ? Math.round(entry.totalMinutes / entry.sessions.length) : 0;

      const sortedSessions = [...entry.sessions].sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        const timeB = parseTimeToMinutes(b.timeIn) ?? 0;
        const timeA = parseTimeToMinutes(a.timeIn) ?? 0;
        return timeB - timeA;
      });

      result.push({
        memberId: matchedMember?.id || entry.memberId,
        memberName: matchedMember?.name || entry.memberName,
        memberObj: matchedMember,
        avatar: matchedMember?.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop`,
        membershipType: matchedMember?.membershipType || 'Reguler Member',
        status: matchedMember?.status || 'AKTIF',
        totalSessions: entry.sessions.length,
        totalMinutes: entry.totalMinutes,
        totalHours: totalHoursNum,
        totalHoursFormatted: formattedDuration || '0 Jam',
        averageMinutesPerSession: avgMins,
        ptSessionsCount: entry.ptCount,
        regularSessionsCount: entry.regCount,
        isCurrentlyTraining: entry.isCurrentlyTraining,
        lastSessionDate: entry.lastAtt?.date || '-',
        lastSessionTimeIn: entry.lastAtt?.timeIn || '-',
        lastSessionTimeOut: entry.lastAtt?.timeOut || '',
        lastSessionBranch: entry.lastAtt?.branchName || 'Cabang Utama',
        sessions: sortedSessions
      });
    });

    return result;
  }, [filteredAttendances, members]);

  // 4. Overall summary metrics across the selected time period
  const summaryMetrics = useMemo(() => {
    const totalWorkoutMinutes = memberStatsList.reduce((sum, m) => sum + m.totalMinutes, 0);
    const totalHoursAgg = parseFloat((totalWorkoutMinutes / 60).toFixed(1));
    const totalSessionsAgg = filteredAttendances.length; // Total kunjungan latihan
    const totalMembersTrained = memberStatsList.length; // Total member unik latihan

    const activeCurrentlyCount = memberStatsList.filter((m) => m.isCurrentlyTraining).length;

    const avgMinutesOverall = totalSessionsAgg > 0 ? Math.round(totalWorkoutMinutes / totalSessionsAgg) : 0;
    const avgVisitsPerDay = dailyVisitStats.length > 0
      ? parseFloat((totalSessionsAgg / dailyVisitStats.length).toFixed(1))
      : 0;
    const avgHoursPerDay = dailyVisitStats.length > 0
      ? parseFloat((totalHoursAgg / dailyVisitStats.length).toFixed(1))
      : 0;

    const topPerformer = [...memberStatsList].sort((a, b) => b.totalMinutes - a.totalMinutes)[0] || null;
    const peakDay = [...dailyVisitStats].sort((a, b) => b.totalJamLatihan - a.totalJamLatihan)[0] || null;

    return {
      totalMembersTrained,
      totalHoursAgg,
      totalWorkoutMinutes,
      totalSessionsAgg,
      activeCurrentlyCount,
      avgMinutesOverall,
      avgVisitsPerDay,
      avgHoursPerDay,
      topPerformer,
      peakDay
    };
  }, [memberStatsList, filteredAttendances, dailyVisitStats]);

  // 5. Search and Sort for Member table
  const processedStatsList = useMemo(() => {
    let list = [...memberStatsList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.memberName.toLowerCase().includes(q) ||
          s.memberId.toLowerCase().includes(q) ||
          s.membershipType.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'hours') return b.totalMinutes - a.totalMinutes;
      if (sortBy === 'sessions') return b.totalSessions - a.totalSessions;
      if (sortBy === 'name') return a.memberName.localeCompare(b.memberName);
      if (sortBy === 'recent') {
        const dateA = a.lastSessionDate || '';
        const dateB = b.lastSessionDate || '';
        const dateCmp = dateB.localeCompare(dateA);
        if (dateCmp !== 0) return dateCmp;
        const timeA = parseTimeToMinutes(a.lastSessionTimeIn) ?? 0;
        const timeB = parseTimeToMinutes(b.lastSessionTimeIn) ?? 0;
        return timeB - timeA;
      }
      return b.totalMinutes - a.totalMinutes;
    });

    return list;
  }, [memberStatsList, searchQuery, sortBy]);

  const maxHours = useMemo(() => {
    if (processedStatsList.length === 0) return 1;
    return Math.max(...processedStatsList.map((m) => m.totalHours), 1);
  }, [processedStatsList]);

  // Custom Daily Workout Tooltip for the chart
  const DailyWorkoutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyVisitStat = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs min-w-[260px] animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <span className="font-black text-white text-sm">{data.fullLabel}</span>
            {data.isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Hari Ini
              </span>
            )}
            {data.isPeak && !data.isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Jam Terbanyak 🔥
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5" /> Total Jam Latihan:
              </span>
              <span className="font-black text-amber-400 text-sm">{data.totalJamLatihan} Jam ({data.totalMenitLatihan} Mnt)</span>
            </div>

            <div className="flex justify-between items-center text-zinc-300">
              <span className="flex items-center gap-1.5 text-orange-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> Total Kunjungan:
              </span>
              <span className="font-bold text-white">{data.totalKunjungan} Kunjungan</span>
            </div>

            <div className="flex justify-between items-center text-zinc-300">
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <UserCheck className="w-3.5 h-3.5" /> Member Unik Latihan:
              </span>
              <span className="font-bold text-sky-300">{data.memberUnik} Orang</span>
            </div>

            <div className="flex justify-between items-center text-zinc-400 text-[11px] pt-1.5 border-t border-zinc-900">
              <span>Jenis Sesi:</span>
              <span className="text-zinc-200 font-semibold">{data.regulerKunjungan} Reguler • {data.ptKunjungan} PT</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP KPI SUMMARY METRICS BANNER                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Jam Latihan Terakumulasi */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400">Total Jam Latihan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{summaryMetrics.totalHoursAgg}</span>
            <span className="text-xs font-bold text-zinc-400">Jam Total</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            <span>Rata-rata: <strong className="text-amber-400 font-bold">{summaryMetrics.avgHoursPerDay}</strong> jam/hari</span>
          </div>
        </div>

        {/* Card 2: Total Kunjungan Member Latihan */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400">Total Kunjungan Latihan</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{summaryMetrics.totalSessionsAgg}</span>
            <span className="text-xs font-bold text-zinc-400">Kunjungan</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            <span>Rata-rata: <strong className="text-orange-400 font-bold">{summaryMetrics.avgVisitsPerDay}</strong> kunjungan/hari</span>
          </div>
        </div>

        {/* Card 3: Total Member Unik Latihan */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400">Total Member Unik Latihan</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{summaryMetrics.totalMembersTrained}</span>
            <span className="text-xs font-bold text-zinc-400">Member Unik</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            {summaryMetrics.activeCurrentlyCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {summaryMetrics.activeCurrentlyCount} Sedang di Gym
              </span>
            ) : (
              <span>Rata-rata durasi: <strong className="text-white">{summaryMetrics.avgMinutesOverall} mnt</strong>/sesi</span>
            )}
          </div>
        </div>

        {/* Card 4: Hari Paling Ramai Jam Latihan */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400">Hari Jam Latihan Tertinggi</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          {summaryMetrics.peakDay && summaryMetrics.peakDay.totalJamLatihan > 0 ? (
            <div>
              <p className="text-base sm:text-lg font-black text-white truncate" title={summaryMetrics.peakDay.fullLabel}>
                {summaryMetrics.peakDay.dayName}, {summaryMetrics.peakDay.formattedDate}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  {summaryMetrics.peakDay.totalJamLatihan} Jam
                </span>
                <span className="text-[11px] text-zinc-400">
                  ({summaryMetrics.peakDay.totalKunjungan} Kunjungan)
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 mt-2">Belum ada data sesi latihan</p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER & CONTROLS TOOLBAR (7, 14, 30 HARI & RENTANG TANGGAL KUSTOM)    */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Preset Buttons (Mulai dari Hari Ini) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-wrap">
            <span className="text-xs font-bold text-zinc-400 mr-1 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-orange-400" /> Filter Hari:
            </span>

            <button
              type="button"
              onClick={() => setTimeFilter('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                timeFilter === '7days'
                  ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              7 Hari Terakhir
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('14days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                timeFilter === '14days'
                  ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              14 Hari Terakhir
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('30days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                timeFilter === '30days'
                  ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              30 Hari Terakhir
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                timeFilter === 'today'
                  ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Hari Ini
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                timeFilter === 'month'
                  ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Bulan Ini
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('range')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                timeFilter === 'range'
                  ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Rentang Tanggal
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Semua Riwayat
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-400 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-zinc-400" /> Jenis Sesi:
            </span>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  typeFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('PT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  typeFilter === 'PT' ? 'bg-purple-500/20 text-purple-300 font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                PT Saja
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('Reguler')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  typeFilter === 'Reguler' ? 'bg-sky-500/20 text-sky-300 font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Reguler
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Date Range Input Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-400 font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              Pilih Rentang Tanggal:
            </span>

            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <label htmlFor="range-start-date" className="text-[11px] text-zinc-400 font-semibold cursor-pointer">
                Dari:
              </label>
              <input
                id="range-start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setTimeFilter('range');
                }}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
                title="Pilih tanggal awal rentang"
              />
            </div>

            <span className="text-zinc-500 font-bold">s/d</span>

            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <label htmlFor="range-end-date" className="text-[11px] text-zinc-400 font-semibold cursor-pointer">
                Sampai:
              </label>
              <input
                id="range-end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setTimeFilter('range');
                }}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
                title="Pilih tanggal akhir rentang"
              />
            </div>

            {timeFilter === 'range' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Mode Rentang Aktif
              </span>
            )}
          </div>

          <div className="text-xs text-zinc-400 self-end sm:self-center">
            Periode: <strong className="text-white">{activeDateLabel}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRAFIK TOTAL JAM LATIHAN & KUNJUNGAN MEMBER (TIMELINE HARIAN)         */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {chartMetricMode === 'hours'
                  ? 'Grafik Total Jam Latihan Member'
                  : chartMetricMode === 'visits'
                  ? 'Grafik Total Kunjungan Member Yang Latihan'
                  : 'Grafik Total Jam Latihan & Kunjungan Member'}
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Visualisasi perbandingan akumulasi jam latihan dan frekuensi kunjungan member di setiap harinya ({activeDateLabel})
            </p>
          </div>

          {/* Metric View Switcher & Quick Summary Pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start sm:self-center">
            {/* View Mode Toggle: Both / Jam Latihan / Kunjungan */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setChartMetricMode('both')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  chartMetricMode === 'both'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Tampilkan Jam Latihan dan Kunjungan sekaligus"
              >
                <Layers className="w-3 h-3 text-orange-400" />
                Semua
              </button>
              <button
                type="button"
                onClick={() => setChartMetricMode('hours')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  chartMetricMode === 'hours'
                    ? 'bg-amber-500/20 text-amber-300 font-black border border-amber-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Hanya grafik Jam Latihan"
              >
                <Clock className="w-3 h-3 text-amber-400" />
                Jam Latihan
              </button>
              <button
                type="button"
                onClick={() => setChartMetricMode('visits')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  chartMetricMode === 'visits'
                    ? 'bg-sky-500/20 text-sky-300 font-black border border-sky-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Hanya grafik Kunjungan Member"
              >
                <TrendingUp className="w-3 h-3 text-sky-400" />
                Kunjungan
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                <Clock className="w-3 h-3" /> {summaryMetrics.totalHoursAgg} Jam
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold">
                <TrendingUp className="w-3 h-3" /> {summaryMetrics.totalSessionsAgg} Sesi
              </span>
            </div>
          </div>
        </div>

        {dailyVisitStats.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-2">
            <UserCheck className="w-10 h-10 opacity-20" />
            <p className="font-bold text-zinc-300 text-sm">Tidak Ada Data Tanggal</p>
            <p className="text-[11px] text-zinc-500 max-w-md leading-relaxed">
              Tidak ada rentang tanggal yang valid untuk ditampilkan pada grafik.
            </p>
          </div>
        ) : (
          <div>
            {dailyVisitStats.every((d) => d.totalJamLatihan === 0 && d.totalKunjungan === 0) && (
              <div className="mb-4 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <UserCheck className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>
                  Grafik menampilkan nilai <strong>0</strong> karena belum ada member yang melakukan latihan pada periode ini ({activeDateLabel}).
                </span>
              </div>
            )}
            <div className="w-full h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyVisitStats}
                  margin={{ top: 20, right: 20, left: 0, bottom: 35 }}
                >
                  <defs>
                    <linearGradient id="gymHoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.65} />
                    </linearGradient>
                    <linearGradient id="gymVisitsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity={0.65} />
                    </linearGradient>
                    <linearGradient id="gymMembersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.65} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={45}
                  />

                  {/* Y Axis Left: Jam Latihan (ketika mode both / hours) atau Kunjungan (ketika mode visits) */}
                  <YAxis
                    yAxisId="left"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    unit={chartMetricMode === 'visits' ? 'x' : 'j'}
                    domain={[0, (dataMax: number) => (dataMax <= 0 ? 5 : 'auto')]}
                    allowDecimals={chartMetricMode !== 'visits'}
                  />

                  {/* Y Axis Right: Kunjungan (ketika mode both) atau Member Unik (ketika mode visits) */}
                  {chartMetricMode !== 'hours' && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 11 }}
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => (dataMax <= 0 ? 5 : 'auto')]}
                      unit={chartMetricMode === 'both' ? 'x' : 'org'}
                    />
                  )}

                <Tooltip content={<DailyWorkoutTooltip />} />

                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(value) => {
                    if (value === 'totalJamLatihan') return <span className="text-xs font-bold text-amber-400">Total Jam Latihan (Jam)</span>;
                    if (value === 'totalKunjungan') return <span className="text-xs font-bold text-orange-400">Total Kunjungan Latihan (Sesi)</span>;
                    if (value === 'memberUnik') return <span className="text-xs font-bold text-sky-400">Member Unik Latihan</span>;
                    return value;
                  }}
                />

                {/* Bar 1: Jam Latihan (Ditampilkan pada mode 'both' dan 'hours') */}
                {(chartMetricMode === 'both' || chartMetricMode === 'hours') && (
                  <Bar
                    yAxisId="left"
                    dataKey="totalJamLatihan"
                    name="totalJamLatihan"
                    fill="url(#gymHoursGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={chartMetricMode === 'hours' ? 45 : 32}
                  >
                    {dailyVisitStats.map((entry, index) => (
                      <Cell
                        key={`cell-hours-${index}`}
                        fill={entry.isToday ? '#22c55e' : entry.isPeak ? '#f59e0b' : '#fb923c'}
                      />
                    ))}
                  </Bar>
                )}

                {/* Bar 2: Total Kunjungan (Ditampilkan pada mode 'both' dan 'visits') */}
                {chartMetricMode === 'both' && (
                  <Bar
                    yAxisId="right"
                    dataKey="totalKunjungan"
                    name="totalKunjungan"
                    fill="url(#gymVisitsGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={28}
                  />
                )}

                {/* Mode 'visits': Menampilkan Total Kunjungan di Left & Member Unik di Right */}
                {chartMetricMode === 'visits' && (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="totalKunjungan"
                      name="totalKunjungan"
                      fill="url(#gymVisitsGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={38}
                    >
                      {dailyVisitStats.map((entry, index) => (
                        <Cell
                          key={`cell-visit-${index}`}
                          fill={entry.isToday ? '#22c55e' : entry.isPeak ? '#f59e0b' : '#f97316'}
                        />
                      ))}
                    </Bar>
                    <Bar
                      yAxisId="right"
                      dataKey="memberUnik"
                      name="memberUnik"
                      fill="url(#gymMembersGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={26}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* 4. KETERANGAN MEMBER DAN TOTAL JAM LATIHAN (TABEL & KARTU RINCIAN)       */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Keterangan Member & Rincian Total Jam Latihan
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Daftar member unik yang telah melakukan latihan pada periode ({activeDateLabel}) beserta total jam latihan, sesi kunjungan, dan status
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari member (nama, ID M001)..."
                className="bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 w-48 sm:w-60 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 text-xs text-white font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer focus:border-orange-500"
              >
                <option value="hours">Jam Latihan Terbanyak</option>
                <option value="sessions">Total Kunjungan Terbanyak</option>
                <option value="recent">Terakhir Kali Latihan</option>
                <option value="name">Nama Member (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {processedStatsList.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            <p className="font-bold text-zinc-400">0 Member Latihan pada {activeDateLabel}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Tidak ada catatan presensi valid pada rentang tanggal tersebut.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {processedStatsList.map((stat, idx) => {
              const isExpanded = expandedMemberId === stat.memberId;
              const hoursRatio = Math.min(100, Math.round((stat.totalHours / maxHours) * 100));

              return (
                <div
                  key={stat.memberId}
                  className="bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-4 transition duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Rank, Avatar & Member Profile */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Indicator */}
                      <div className="shrink-0">
                        {idx === 0 ? (
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-xs shadow-sm">
                            <Crown className="w-4 h-4 text-amber-400" />
                          </div>
                        ) : idx === 1 ? (
                          <div className="w-8 h-8 rounded-xl bg-zinc-400/20 border border-zinc-400/40 text-zinc-200 flex items-center justify-center font-black text-xs">
                            #2
                          </div>
                        ) : idx === 2 ? (
                          <div className="w-8 h-8 rounded-xl bg-amber-700/20 border border-amber-700/40 text-amber-500 flex items-center justify-center font-black text-xs">
                            #3
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center font-bold text-xs">
                            #{idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Photo */}
                      <div className="relative shrink-0">
                        <img
                          src={stat.avatar}
                          alt={stat.memberName}
                          className="w-12 h-12 rounded-2xl object-cover border border-zinc-700 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
                          }}
                        />
                        {stat.isCurrentlyTraining && (
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse"
                            title="Sedang Aktif Latihan di Gym"
                          />
                        )}
                      </div>

                      {/* Name & Package */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className="text-sm font-black text-white hover:text-orange-400 transition truncate cursor-pointer"
                            onClick={() => setDetailModalStats(stat)}
                          >
                            {stat.memberName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                            {stat.memberId}
                          </span>
                          {stat.isCurrentlyTraining && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Sedang di Gym
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 flex-wrap">
                          <span className="text-orange-400 font-semibold">{stat.membershipType}</span>
                          <span>•</span>
                          <span>Terakhir: {formatDateIndo(stat.lastSessionDate)}</span>
                          {stat.lastSessionTimeIn && <span>({stat.lastSessionTimeIn})</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Hours Badge, Metrics, & Action */}
                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-900">
                      {/* Metric 1: Total Jam Latihan */}
                      <div className="bg-amber-500/10 border border-amber-500/25 px-3.5 py-2 rounded-2xl text-right">
                        <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" /> TOTAL JAM LATIHAN
                        </div>
                        <div className="text-base sm:text-lg font-black text-amber-400">
                          {stat.totalHours} Jam
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {stat.totalHoursFormatted}
                        </div>
                      </div>

                      {/* Metric 2: Total Sesi Kunjungan & Breakdown */}
                      <div className="bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-2xl text-left sm:text-right">
                        <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 justify-end">
                          <Dumbbell className="w-3 h-3 text-sky-400" /> TOTAL KUNJUNGAN
                        </div>
                        <div className="text-base sm:text-lg font-black text-white">
                          {stat.totalSessions} Kunjungan
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {stat.ptSessionsCount} PT • {stat.regularSessionsCount} Reguler
                        </div>
                      </div>

                      {/* Metric 3: Rata-rata per Sesi */}
                      <div className="hidden sm:block bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-2xl text-right">
                        <div className="text-[10px] font-bold text-zinc-400">RATA-RATA</div>
                        <div className="text-sm font-bold text-emerald-400">
                          {stat.averageMinutesPerSession} Mnt / Sesi
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Durasi Rata-rata
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailModalStats(stat)}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          title="Lihat Riwayat & Detail Sesi"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="hidden sm:inline">Riwayat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedMemberId(isExpanded ? null : stat.memberId)}
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
                          title="Buka / Tutup Sesi Terkini"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visual Proportion Bar compared to max training hours */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-900 flex items-center gap-3">
                    <div className="text-[10px] font-bold text-zinc-500 shrink-0">
                      Rasio Jam:
                    </div>
                    <div className="flex-1 bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${hoursRatio}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-bold text-amber-400/80 shrink-0">
                      {hoursRatio}% dari Member Teratas
                    </div>
                  </div>

                  {/* Expanded Accordion: Recent Sessions */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2 animate-in fade-in duration-200">
                      <h5 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" /> Riwayat Sesi Terkini ({stat.sessions.length} Kunjungan):
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {stat.sessions.slice(0, 6).map((session) => {
                          const sessMins = calculateSessionMinutes(session.timeIn, session.timeOut, session.date);
                          return (
                            <div
                              key={session.id}
                              className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80 text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{formatDateIndo(session.date)}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  session.type === 'PT' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {session.type}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-zinc-400">
                                <span>{session.timeIn} - {session.timeOut || 'Sedang Latihan'}</span>
                                <span className="text-amber-400 font-bold">{sessMins} menit</span>
                              </div>
                              {session.branchName && (
                                <p className="text-[10px] text-zinc-500 truncate">{session.branchName}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DETAIL RIWAYAT LATIHAN MEMBER                                    */}
      {/* ========================================================================= */}
      {detailModalStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <img
                  src={detailModalStats.avatar}
                  alt={detailModalStats.memberName}
                  className="w-12 h-12 rounded-2xl object-cover border border-orange-500/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
                  }}
                />
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>{detailModalStats.memberName}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {detailModalStats.memberId}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Paket: <strong className="text-zinc-200">{detailModalStats.membershipType}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalStats(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
              {/* Highlight Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 text-center">
                  <span className="text-[11px] font-bold text-zinc-400 block mb-1">TOTAL JAM</span>
                  <span className="text-lg font-black text-amber-400">{detailModalStats.totalHours} Jam</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{detailModalStats.totalHoursFormatted}</span>
                </div>
                <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 text-center">
                  <span className="text-[11px] font-bold text-zinc-400 block mb-1">TOTAL KUNJUNGAN</span>
                  <span className="text-lg font-black text-white">{detailModalStats.totalSessions} Sesi</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{detailModalStats.ptSessionsCount} PT • {detailModalStats.regularSessionsCount} Reguler</span>
                </div>
                <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 text-center">
                  <span className="text-[11px] font-bold text-zinc-400 block mb-1">RATA-RATA</span>
                  <span className="text-lg font-black text-emerald-400">{detailModalStats.averageMinutesPerSession} Mnt</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Durasi per Sesi</span>
                </div>
              </div>

              {/* Sessions Table */}
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" /> Seluruh Riwayat Sesi Presensi ({detailModalStats.sessions.length})
                </h4>
                <div className="border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-850">
                  {detailModalStats.sessions.map((sess, idx) => {
                    const durationM = calculateSessionMinutes(sess.timeIn, sess.timeOut, sess.date);
                    return (
                      <div key={sess.id || idx} className="p-3 bg-zinc-900/50 hover:bg-zinc-900 flex items-center justify-between text-xs transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{formatDateIndo(sess.date)}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              sess.type === 'PT' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {sess.type}
                            </span>
                            {sess.lockerNumber && (
                              <span className="text-[10px] text-zinc-400">Loker #{sess.lockerNumber}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Jam: <strong className="text-zinc-200">{sess.timeIn}</strong> s/d <strong className="text-zinc-200">{sess.timeOut || 'Masih di Gym'}</strong> • {sess.branchName || 'Cabang Utama'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-400 font-bold block">{durationM} Menit</span>
                          <span className="text-[10px] text-zinc-500">{(durationM / 60).toFixed(1)} Jam</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Terdaftar sejak: {detailModalStats.memberObj?.joinDate ? formatDateIndo(detailModalStats.memberObj.joinDate) : '-'}
              </span>
              <button
                type="button"
                onClick={() => setDetailModalStats(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
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

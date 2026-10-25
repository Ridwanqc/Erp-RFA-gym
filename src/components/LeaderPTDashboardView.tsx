import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  XCircle,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Filter,
  ArrowUpRight,
  AlertCircle,
  Award,
  Package,
  Layers,
  Send,
  Share2,
  UserPlus,
  Phone,
  ExternalLink,
  FileCheck,
  FileText,
  History,
  Lock,
  ArrowRightLeft,
  Info,
  Check,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { Member, Schedule, User, StaffAttendance, Attendance, PTPurchaseRecord, PTTrainerAssignment, BundlePackage, Transaction, TrainerCommissionRecord, PTBooking, TrainerChangeRequest, WorkSchedule, LeaveRequest, TrainerWorkingRule, StudioClass } from '../types';
import { APP_TODAY, formatDateIndo, getDayDiff, formatRp, getTimestamp } from '../utils/formatters';
import { DEFAULT_TRAINER_WORKING_RULES, getTrainerDutyStatusOnDate, isTimeMatchingStudioClass, calculateTrainerTeachingHours } from '../data/ptBookingData';
import { TrainerCommissionPieChart } from './TrainerCommissionPieChart';
import { LeaderPTBookingsTab } from './LeaderPTBookingsTab';
import { LeaderPTTrainerChangeTab } from './LeaderPTTrainerChangeTab';
import { LeaderPTTrainerWorkingRulesTab } from './LeaderPTTrainerWorkingRulesTab';

interface LeaderPTDashboardViewProps {
  initialTab?: 'penugasan' | 'jadwal' | 'pelatih' | 'retensi' | 'analitik' | 'aturan_kerja';
  members: Member[];
  schedules: Schedule[];
  staffUsers: User[];
  staffAttendances: StaffAttendance[];
  attendances: Attendance[];
  currentUser: User | null;
  studioClasses?: StudioClass[];
  ptPurchases?: PTPurchaseRecord[];
  ptAssignments?: PTTrainerAssignment[];
  bundlePackages?: BundlePackage[];
  transactions?: Transaction[];
  trainerCommissions?: TrainerCommissionRecord[];
  ptBookings?: PTBooking[];
  trainerChangeRequests?: TrainerChangeRequest[];
  trainerWorkingRules?: TrainerWorkingRule[];
  onSaveTrainerWorkingRule?: (rule: TrainerWorkingRule) => void;
  workSchedules?: WorkSchedule[];
  onSaveWorkSchedule?: (schedule: WorkSchedule, isNew: boolean) => void;
  leaveRequests?: LeaveRequest[];
  onApproveTrainerChange?: (requestId: string, newTrainerId: string, newTrainerName: string, notes?: string) => void;
  onRejectTrainerChange?: (requestId: string, notes?: string) => void;
  onUpdatePTBookingStatus?: (bookingId: string, newStatus: any, notes?: string) => void;
  onUpdateMember?: (updatedMember: Member) => void;
  onUpdatePTPurchase?: (purchase: PTPurchaseRecord) => void;
  onAssignPTTrainer?: (
    purchaseId: string,
    trainerId: string,
    reason?: string,
    notes?: string,
    scheduleFirstSession?: boolean,
    firstDate?: string,
    firstTime?: string
  ) => void;
  onAddPTAssignment?: (assignment: PTTrainerAssignment) => void;
  onNavigateTab: (tab: any) => void;
  onOpenMemberDetail?: (member: Member) => void;
  onUpdateSchedule: (schedule: Schedule) => void;
  onAddSchedule: (schedule: Schedule) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LeaderPTDashboardView: React.FC<LeaderPTDashboardViewProps> = ({
  initialTab,
  members,
  schedules,
  staffUsers,
  staffAttendances,
  attendances,
  currentUser,
  studioClasses = [],
  ptPurchases = [],
  ptAssignments = [],
  bundlePackages = [],
  transactions = [],
  trainerCommissions = [],
  ptBookings = [],
  trainerChangeRequests = [],
  trainerWorkingRules = [],
  onSaveTrainerWorkingRule,
  workSchedules = [],
  onSaveWorkSchedule,
  leaveRequests = [],
  onApproveTrainerChange,
  onRejectTrainerChange,
  onUpdatePTBookingStatus,
  onUpdateMember,
  onUpdatePTPurchase,
  onAssignPTTrainer,
  onAddPTAssignment,
  onNavigateTab,
  onOpenMemberDetail,
  onUpdateSchedule,
  onAddSchedule,
  showToast
}) => {
  // Role permissions
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'admin_cabang';
  const isLeaderPT = currentUser?.role === 'leader_pt';
  const isKasir = currentUser?.role === 'kasir';
  const isTrainer = currentUser?.role === 'pt';
  const canAssign = isAdmin || isLeaderPT;

  // Unified Master Tab state
  const [mainTab, setMainTab] = useState<'penugasan' | 'jadwal' | 'pelatih' | 'retensi' | 'analitik' | 'aturan_kerja'>(
    initialTab || 'penugasan'
  );

  // Sub-filter states for each master tab
  const [scheduleSubFilter, setScheduleSubFilter] = useState<'today' | 'tomorrow' | 'week' | 'clash' | 'unconfirmed' | 'bookings' | 'all'>('today');
  const [trainerSubFilter, setTrainerSubFilter] = useState<'workload' | 'change_requests' | 'commission'>('workload');
  const [retentionSubFilter, setRetentionSubFilter] = useState<'at_risk_7' | 'at_risk_14' | 'no_schedule' | 'nearly_finished' | 'expired' | 'chart'>('at_risk_7');
  const [scheduleTrainerFilter, setScheduleTrainerFilter] = useState<string>('ALL');

  // Active Queue tab state (Penugasan)
  const [activeQueueTab, setActiveQueueTab] = useState<
    | 'waiting'
    | 'assigned'
    | 'scheduled'
    | 'in_progress'
    | 'completed'
    | 'unpaid'
    | 'history'
    | 'trainers'
    | 'analytics'
    | 'bookings'
    | 'change_requests'
    | 'working_rules'
  >('waiting');

  // Active Filter / Tab state (legacy & sub-tables)
  const [activeTableTab, setActiveTableTab] = useState<'members' | 'new_packages' | 'schedules' | 'trainers'>('new_packages');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Assign Trainer Modal state
  const [assignModal, setAssignModal] = useState<{
    item: {
      purchaseId?: string;
      ptNo?: string;
      memberId: string;
      memberName: string;
      memberPhone: string;
      memberPhoto?: string;
      members?: any[];
      packageType: string;
      packageName: string;
      sessions: number;
      sessionsRemaining: number;
      purchaseDate: string;
      price: number;
      amountPaid?: number;
      paymentStatus?: string;
      picSalesName?: string;
      purchaseBy?: string;
      purchaseAt?: string;
      currentTrainerName?: string;
      currentTrainerId?: string;
      notes?: string;
    };
    selectedTrainerId: string;
    selectedTrainerName: string;
    scheduleFirstSession: boolean;
    firstDate: string;
    firstTime: string;
    notes: string;
  } | null>(null);

  // Reassign Trainer Modal state (with reason & audit log)
  const [reassignModal, setReassignModal] = useState<{
    purchaseId: string;
    ptNo: string;
    memberName: string;
    packageName: string;
    currentTrainerName: string;
    currentTrainerId: string;
    selectedTrainerId: string;
    selectedTrainerName: string;
    reason: string;
    notes: string;
  } | null>(null);

  // Conflict Resolution Modal
  const [resolvingClash, setResolvingClash] = useState<{
    schedules: Schedule[];
    trainer: string;
    time: string;
    date: string;
  } | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Schedule | null>(null);
  const [newClashTime, setNewClashTime] = useState('15:00');
  const [newClashTrainer, setNewClashTrainer] = useState('');

  // Quick Add Schedule Modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickMemberId, setQuickMemberId] = useState('');
  const [quickTrainer, setQuickTrainer] = useState('');
  const [quickDate, setQuickDate] = useState(APP_TODAY);
  const [quickTime, setQuickTime] = useState('10:00');
  const [quickNote, setQuickNote] = useState('');
  const [isQuickMemberSearchOpen, setIsQuickMemberSearchOpen] = useState(false);
  const [quickMemberSearchTerm, setQuickMemberSearchTerm] = useState('');

  // Selected Member for Quick Add PT Schedule
  const selectedQuickAddMember = useMemo(() => {
    return members.find((m) => m.id === quickMemberId) || null;
  }, [members, quickMemberId]);


  // Trainers pool (pt and leader_pt)
  const trainers = useMemo(() => {
    return staffUsers.filter((u) => u.role === 'pt' || u.role === 'leader_pt');
  }, [staffUsers]);

  // Real-time trainer duty status for Quick Add Schedule Modal
  const quickTrainerDuty = useMemo(() => {
    if (!quickTrainer || !quickDate) return null;
    const chosen = trainers.find((t) => t.name === quickTrainer || t.id === quickTrainer);
    return getTrainerDutyStatusOnDate({
      trainerId: chosen?.id || quickTrainer,
      trainerName: chosen?.name || quickTrainer,
      date: quickDate,
      workSchedules,
      staffAttendances,
      leaveRequests,
      trainerUser: chosen,
      rules: trainerWorkingRules
    });
  }, [quickTrainer, quickDate, trainers, workSchedules, staffAttendances, leaveRequests, trainerWorkingRules]);

  // Tomorrow calculation
  const tomorrowDate = useMemo(() => {
    const d = new Date(APP_TODAY + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Current week date bounds (Mon to Sun)
  const currentWeekDays = useMemo(() => {
    const today = new Date(APP_TODAY + 'T00:00:00');
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);

    const weekArr: string[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      weekArr.push(cur.toISOString().split('T')[0]);
    }
    return weekArr;
  }, []);

  // PT Members List
  const memberPTList = useMemo(() => {
    return members.filter((m) => {
      const hasQuota = (m.ptQuota ?? 0) > 0;
      const isAssignedTrainer = trainers.some((t) => t.id === m.picId || t.name === m.picName);
      const notesMentionPT = (m.notes || '').toLowerCase().includes('pt');
      const hasScheduleHistory = schedules.some((s) => s.memberId === m.id);
      return hasQuota || isAssignedTrainer || notesMentionPT || hasScheduleHistory;
    });
  }, [members, trainers, schedules]);

  // Filtered members for Quick Add search
  const filteredQuickAddMembers = useMemo(() => {
    const term = quickMemberSearchTerm.toLowerCase().trim();
    if (!term) return memberPTList;
    return memberPTList.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(term) ||
        (m.id || '').toLowerCase().includes(term) ||
        (m.phone || '').toLowerCase().includes(term)
    );
  }, [memberPTList, quickMemberSearchTerm]);

  // Map each member to their last training date
  const memberLastTrainingMap = useMemo(() => {
    const map = new Map<string, { lastDate: string; daysAgo: number }>();

    memberPTList.forEach((m) => {
      // Find latest completed schedule
      const completedSchs = schedules
        .filter((s) => s.memberId === m.id && s.status === 'Selesai')
        .sort((a, b) => b.date.localeCompare(a.date));

      // Find latest PT attendance
      const ptAtts = attendances
        .filter((a) => a.memberId === m.id && a.type === 'PT')
        .sort((a, b) => b.date.localeCompare(a.date));

      const schDate = completedSchs[0]?.date || '';
      const attDate = ptAtts[0]?.date || '';
      const latestDate = schDate > attDate ? schDate : attDate || m.joinDate || '2026-08-01';

      const daysAgo = Math.max(0, getDayDiff(APP_TODAY, latestDate));
      map.set(m.id, { lastDate: latestDate, daysAgo });
    });

    return map;
  }, [memberPTList, schedules, attendances]);

  // --------------------------------------------------------------------------
  // 1. MEMBER PT METRICS (9 METRICS)
  // --------------------------------------------------------------------------
  const memberMetrics = useMemo(() => {
    // 1. Total Member PT Aktif (membership active + has PT affiliation)
    const active = memberPTList.filter((m) => m.expired >= APP_TODAY && (m.ptQuota > 0 || m.notes?.toLowerCase().includes('pt')));

    // 2. Member PT Baru (joined within last 30 days / in September)
    const baru = memberPTList.filter((m) => {
      if (!m.joinDate) return false;
      return m.joinDate >= '2026-08-20' || m.joinDate.startsWith('2026-09');
    });

    // 3. Member PT Akan Expired (next 7 days)
    const akanExpired = memberPTList.filter((m) => {
      const diff = getDayDiff(m.expired, APP_TODAY);
      return diff >= 0 && diff <= 7;
    });

    // 4. Member PT Expired
    const expired = memberPTList.filter((m) => m.expired < APP_TODAY);

    // 5. Member dengan sesi hampir habis (sisa 1 atau 2 sesi)
    const sesiHampirHabis = memberPTList.filter((m) => m.ptQuota > 0 && m.ptQuota <= 2);

    // 6. Member dengan sesi habis (sisa 0 sesi tapi masih aktif/perlu renewal)
    const sesiHabis = memberPTList.filter((m) => (m.ptQuota || 0) === 0);

    // 7. Member belum memiliki jadwal (punya kuota > 0 tapi tidak ada jadwal upcoming)
    const belumPunyaJadwal = memberPTList.filter((m) => {
      if (m.ptQuota <= 0) return false;
      const hasUpcoming = schedules.some(
        (s) => s.memberId === m.id && s.date >= APP_TODAY && s.status !== 'Batal'
      );
      return !hasUpcoming;
    });

    // 8. Member yang tidak latihan > 7 hari (8 - 14 hari)
    const tidakLatihan7H = memberPTList.filter((m) => {
      const info = memberLastTrainingMap.get(m.id);
      return info && info.daysAgo > 7 && info.daysAgo <= 14;
    });

    // 9. Member yang tidak latihan > 14 hari (> 14 hari)
    const tidakLatihan14H = memberPTList.filter((m) => {
      const info = memberLastTrainingMap.get(m.id);
      return info && info.daysAgo > 14;
    });

    return {
      totalAktif: active.length,
      baru: baru.length,
      akanExpired: akanExpired.length,
      expired: expired.length,
      sesiHampirHabis: sesiHampirHabis.length,
      sesiHabis: sesiHabis.length,
      belumPunyaJadwal: belumPunyaJadwal.length,
      tidakLatihan7H: tidakLatihan7H.length,
      tidakLatihan14H: tidakLatihan14H.length,
      lists: {
        active,
        baru,
        akanExpired,
        expired,
        sesiHampirHabis,
        sesiHabis,
        belumPunyaJadwal,
        tidakLatihan7H,
        tidakLatihan14H
      }
    };
  }, [memberPTList, schedules, memberLastTrainingMap]);

  // --------------------------------------------------------------------------
  // 2. JADWAL METRICS (7 METRICS) + CLASH DETECTION
  // --------------------------------------------------------------------------
  const scheduleMetrics = useMemo(() => {
    // 18. Jadwal hari ini
    const hariIni = schedules.filter((s) => s.date === APP_TODAY);

    // 19. Jadwal besok
    const besok = schedules.filter((s) => s.date === tomorrowDate);

    // 20. Jadwal minggu ini
    const mingguIni = schedules.filter((s) => currentWeekDays.includes(s.date));

    // 21. Jadwal bentrok (Bentrok PT ganda, Bentrok Kelas Studio, Bentrok Shift/Day Off HR)
    const clashGroups: { [key: string]: Schedule[] } = {};
    schedules.forEach((s) => {
      if (s.status === 'Batal') return;
      const key = `${s.trainer}___${s.date}___${s.time}`;
      if (!clashGroups[key]) clashGroups[key] = [];
      clashGroups[key].push(s);
    });

    const bentrokSchedules: Schedule[] = [];
    const bentrokDetails: {
      trainer: string;
      date: string;
      time: string;
      schedules: Schedule[];
      clashType?: 'PT_DOUBLE' | 'STUDIO_CLASS' | 'OFF_DUTY';
      clashLabel?: string;
    }[] = [];

    // 1. Bentrok PT Ganda
    Object.entries(clashGroups).forEach(([key, list]) => {
      if (list.length > 1) {
        const [trainer, date, time] = key.split('___');
        bentrokDetails.push({
          trainer,
          date,
          time,
          schedules: list,
          clashType: 'PT_DOUBLE',
          clashLabel: 'Bentrok Sesi PT Ganda'
        });
        list.forEach((item) => {
          if (!bentrokSchedules.some((x) => x.id === item.id)) {
            bentrokSchedules.push(item);
          }
        });
      }
    });

    // 2. Bentrok PT vs Kelas Studio
    schedules.forEach((s) => {
      if (s.status === 'Batal') return;
      const trainerUser = trainers.find((t) => t.name === s.trainer || t.id === s.trainerId);
      const clashingStudio = studioClasses.find((sc) => {
        if (sc.date !== s.date) return false;
        const isInstructor =
          (sc.trainerId && sc.trainerId === trainerUser?.id) ||
          ((sc.trainerName || sc.trainer || '').toLowerCase().trim() === s.trainer.toLowerCase().trim());
        if (!isInstructor) return false;
        return isTimeMatchingStudioClass(sc.time, s.time);
      });

      if (clashingStudio) {
        if (!bentrokSchedules.some((x) => x.id === s.id)) {
          bentrokSchedules.push(s);
          bentrokDetails.push({
            trainer: s.trainer,
            date: s.date,
            time: s.time,
            schedules: [s],
            clashType: 'STUDIO_CLASS',
            clashLabel: `Bentrok Kelas Studio (${clashingStudio.name})`
          });
        }
      }
    });

    // 3. Bentrok PT vs Shift / Cuti / Day Off HR
    schedules.forEach((s) => {
      if (s.status === 'Batal' || s.status === 'Selesai') return;
      const trainerUser = trainers.find((t) => t.name === s.trainer || t.id === s.trainerId);
      const duty = getTrainerDutyStatusOnDate({
        trainerId: s.trainerId || trainerUser?.id || s.trainer,
        trainerName: s.trainer,
        date: s.date,
        workSchedules,
        staffAttendances,
        leaveRequests,
        trainerUser,
        rules: trainerWorkingRules
      });

      if (!duty.isAvailableForDate) {
        if (!bentrokSchedules.some((x) => x.id === s.id)) {
          bentrokSchedules.push(s);
          bentrokDetails.push({
            trainer: s.trainer,
            date: s.date,
            time: s.time,
            schedules: [s],
            clashType: 'OFF_DUTY',
            clashLabel: `Jadwal Saat Pelatih ${duty.statusLabel}`
          });
        }
      } else if (duty.dutyStartTime && duty.dutyEndTime) {
        if (s.time < duty.dutyStartTime || s.time >= duty.dutyEndTime) {
          if (!bentrokSchedules.some((x) => x.id === s.id)) {
            bentrokSchedules.push(s);
            bentrokDetails.push({
              trainer: s.trainer,
              date: s.date,
              time: s.time,
              schedules: [s],
              clashType: 'OFF_DUTY',
              clashLabel: `Di Luar Jam Shift HR (${duty.dutyStartTime} - ${duty.dutyEndTime})`
            });
          }
        }
      }
    });

    // 22. Jadwal belum dikonfirmasi (status Menunggu OR missing any signature)
    const belumDikonfirmasi = schedules.filter(
      (s) => s.status === 'Menunggu' || !s.valStaf || !s.valTrainer || !s.valMember
    );

    // 23. Jadwal dibatalkan
    const dibatalkan = schedules.filter((s) => s.status === 'Batal');

    // 24. Jadwal selesai
    const selesai = schedules.filter((s) => s.status === 'Selesai');

    return {
      hariIni: hariIni.length,
      besok: besok.length,
      mingguIni: mingguIni.length,
      bentrok: bentrokSchedules.length,
      bentrokDetails,
      bentrokSchedules,
      belumDikonfirmasi: belumDikonfirmasi.length,
      dibatalkan: dibatalkan.length,
      selesai: selesai.length,
      lists: {
        hariIni,
        besok,
        mingguIni,
        bentrok: bentrokSchedules,
        belumDikonfirmasi,
        dibatalkan,
        selesai
      }
    };
  }, [schedules, tomorrowDate, currentWeekDays, studioClasses, trainers, workSchedules, staffAttendances, leaveRequests, trainerWorkingRules]);

  // --------------------------------------------------------------------------
  // 3. TRAINER METRICS (8 METRICS)
  // --------------------------------------------------------------------------
  const trainerMetrics = useMemo(() => {
    // 10. Total Trainer Aktif
    const total = trainers.length;

    // 11. Trainer sedang aktif (clocked in today OR has sessions today)
    const sedangAktif = trainers.filter((t) => {
      const hasClockIn = staffAttendances.some((sa) => sa.staffId === t.id && sa.date === APP_TODAY);
      const hasScheduleToday = schedules.some((s) => s.trainer === t.name && s.date === APP_TODAY && s.status !== 'Batal');
      return hasClockIn || hasScheduleToday;
    });

    // 12. Trainer sedang libur (not clocked in AND no schedules today)
    const sedangLibur = trainers.filter((t) => !sedangAktif.some((a) => a.id === t.id));

    // Calculate per-trainer statistics
    const trainerStats = trainers.map((t) => {
      const todaySchedules = schedules.filter((s) => s.trainer === t.name && s.date === APP_TODAY && s.status !== 'Batal');
      const allSchedules = schedules.filter((s) => s.trainer === t.name);
      const completedSessions = allSchedules.filter((s) => s.status === 'Selesai').length;

      // Assigned members
      const assignedMembers = memberPTList.filter((m) => m.picId === t.id || m.picName === t.name);
      const totalSesiTersisa = assignedMembers.reduce((acc, m) => acc + (m.ptQuota || 0), 0);

      const isClockedIn = staffAttendances.some((sa) => sa.staffId === t.id && sa.date === APP_TODAY);

      const teachingData = calculateTrainerTeachingHours({
        trainerId: t.id,
        trainerName: t.name,
        date: APP_TODAY,
        schedules,
        ptBookings,
        studioClasses,
        workSchedules,
        staffAttendances,
        leaveRequests,
        rules: trainerWorkingRules,
        trainerUser: t
      });

      return {
        ...t,
        todayCount: todaySchedules.length,
        completedSessions,
        memberCount: assignedMembers.length,
        totalSesiTersisa,
        isClockedIn,
        todaySchedules,
        teachingHoursMonth: teachingData.totalCompletedHoursMonth,
        teachingHoursToday: teachingData.totalCompletedHoursToday,
        studioClassesMonth: teachingData.studioMonthCount,
        maxSessionsPerDay: teachingData.maxSessionsPerDay,
        dutyToday: teachingData.dutyToday
      };
    });

    // 13. Trainer dengan jadwal penuh (>= 3 sesi hari ini atau tertinggi)
    const denganJadwalPenuh = trainerStats.filter((t) => t.todayCount >= 3);

    // 14. Trainer dengan jadwal kosong (0 sesi hari ini)
    const denganJadwalKosong = trainerStats.filter((t) => t.todayCount === 0);

    // 15. Trainer dengan member terbanyak
    const sortedByMembers = [...trainerStats].sort((a, b) => b.memberCount - a.memberCount);
    const trainerMemberTerbanyak = sortedByMembers[0] || null;

    // 16. Trainer dengan sesi latihan terbanyak (completed)
    const sortedByCompleted = [...trainerStats].sort((a, b) => b.completedSessions - a.completedSessions);
    const trainerSesiTerbanyak = sortedByCompleted[0] || null;

    // 17. Trainer dengan sesi tersisa paling banyak
    const sortedByRemaining = [...trainerStats].sort((a, b) => b.totalSesiTersisa - a.totalSesiTersisa);
    const trainerSesiTersisaPalingBanyak = sortedByRemaining[0] || null;

    return {
      total,
      sedangAktif: sedangAktif.length,
      sedangLibur: sedangLibur.length,
      jadwalPenuhCount: denganJadwalPenuh.length,
      jadwalKosongCount: denganJadwalKosong.length,
      trainerMemberTerbanyak,
      trainerSesiTerbanyak,
      trainerSesiTersisaPalingBanyak,
      trainerStats
    };
  }, [trainers, staffAttendances, schedules, memberPTList]);

  // --------------------------------------------------------------------------
  // 4. SESI METRICS (7 METRICS)
  // --------------------------------------------------------------------------
  const sessionMetrics = useMemo(() => {
    // Current month schedules (September 2026)
    const monthPrefix = APP_TODAY.slice(0, 7);
    const monthSchedules = schedules.filter((s) => s.date.startsWith(monthPrefix));

    // 25. Total sesi bulan ini (all recorded sessions)
    const totalBulanIni = monthSchedules.length;

    // 26. Sesi digunakan (status Selesai)
    const sesiDigunakan = monthSchedules.filter((s) => s.status === 'Selesai').length;

    // 27. Sesi tersisa (total sisa kuota seluruh member aktif)
    const sesiTersisa = memberPTList.reduce((sum, m) => sum + (m.ptQuota || 0), 0);

    // 28. Sesi hangus (status Hangus)
    const sesiHangus = monthSchedules.filter((s) => s.status === 'Hangus').length;

    // 29. Sesi reschedule (status Reschedule)
    const sesiReschedule = monthSchedules.filter((s) => s.status === 'Reschedule').length;

    // 30. Sesi cancelled (status Batal)
    const sesiCancelled = monthSchedules.filter((s) => s.status === 'Batal').length;

    // 31. Sesi no-show (status No-Show)
    const sesiNoShow = monthSchedules.filter((s) => s.status === 'No-Show').length;

    return {
      totalBulanIni,
      sesiDigunakan,
      sesiTersisa,
      sesiHangus,
      sesiReschedule,
      sesiCancelled,
      sesiNoShow
    };
  }, [schedules, memberPTList]);

  // --------------------------------------------------------------------------
  // CHART DATA PREPARATION
  // --------------------------------------------------------------------------
  // 1. 7-Day Schedule Trend (Selesai, Menunggu, Reschedule, Batal/No-show)
  const chart7DaysData = useMemo(() => {
    const days: { date: string; label: string; Selesai: number; Menunggu: number; Reschedule: number; BatalNoShow: number }[] = [];
    const base = new Date(APP_TODAY + 'T00:00:00');

    for (let i = -3; i <= 3; i++) {
      const cur = new Date(base);
      cur.setDate(base.getDate() + i);
      const curStr = cur.toISOString().split('T')[0];
      const daySchs = schedules.filter((s) => s.date === curStr);

      const dName = cur.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      days.push({
        date: curStr,
        label: i === 0 ? `Hari ini (${dName})` : dName,
        Selesai: daySchs.filter((s) => s.status === 'Selesai').length,
        Menunggu: daySchs.filter((s) => s.status === 'Menunggu').length,
        Reschedule: daySchs.filter((s) => s.status === 'Reschedule').length,
        BatalNoShow: daySchs.filter((s) => s.status === 'Batal' || s.status === 'No-Show' || s.status === 'Hangus').length
      });
    }
    return days;
  }, [schedules]);

  // 2. Trainer Workload & Sessions Bar Chart
  const chartTrainerData = useMemo(() => {
    return trainerMetrics.trainerStats.map((t) => ({
      name: t.name.split(' ')[0],
      fullName: t.name,
      'Sesi Selesai': t.completedSessions,
      'Member Binaan': t.memberCount,
      'Sisa Kuota': t.totalSesiTersisa,
      'Jadwal Hari Ini': t.todayCount
    }));
  }, [trainerMetrics]);

  // 3. Session Status Donut Chart
  const sessionPieData = useMemo(() => {
    return [
      { name: 'Sesi Digunakan', value: sessionMetrics.sesiDigunakan, color: '#10b981' },
      { name: 'Sisa Kuota Aktif', value: sessionMetrics.sesiTersisa, color: '#3b82f6' },
      { name: 'Reschedule', value: sessionMetrics.sesiReschedule, color: '#f59e0b' },
      { name: 'Hangus', value: sessionMetrics.sesiHangus, color: '#8b5cf6' },
      { name: 'No-Show', value: sessionMetrics.sesiNoShow, color: '#ec4899' },
      { name: 'Dibatalkan', value: sessionMetrics.sesiCancelled, color: '#ef4444' }
    ].filter((item) => item.value > 0);
  }, [sessionMetrics]);

  // --------------------------------------------------------------------------
  // INTERACTIVE TABLE FILTERING
  // --------------------------------------------------------------------------
  const filteredMembers = useMemo(() => {
    let list = memberPTList;

    if (selectedCohortFilter === 'hampir-habis') {
      list = memberMetrics.lists.sesiHampirHabis;
    } else if (selectedCohortFilter === 'habis') {
      list = memberMetrics.lists.sesiHabis;
    } else if (selectedCohortFilter === 'belum-jadwal') {
      list = memberMetrics.lists.belumPunyaJadwal;
    } else if (selectedCohortFilter === 'tidak-latihan-7') {
      list = memberMetrics.lists.tidakLatihan7H;
    } else if (selectedCohortFilter === 'tidak-latihan-14') {
      list = memberMetrics.lists.tidakLatihan14H;
    } else if (selectedCohortFilter === 'baru') {
      list = memberMetrics.lists.baru;
    } else if (selectedCohortFilter === 'akan-expired') {
      list = memberMetrics.lists.akanExpired;
    } else if (selectedCohortFilter === 'expired') {
      list = memberMetrics.lists.expired;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q) || (m.picName ? m.picName.toLowerCase().includes(q) : false));
    }

    return list;
  }, [memberPTList, selectedCohortFilter, memberMetrics, searchQuery]);

  const filteredSchedules = useMemo(() => {
    let list = schedules;

    if (selectedCohortFilter === 'jadwal-hari-ini') {
      list = scheduleMetrics.lists.hariIni;
    } else if (selectedCohortFilter === 'jadwal-besok') {
      list = scheduleMetrics.lists.besok;
    } else if (selectedCohortFilter === 'jadwal-minggu-ini') {
      list = scheduleMetrics.lists.mingguIni;
    } else if (selectedCohortFilter === 'jadwal-bentrok') {
      list = scheduleMetrics.lists.bentrok;
    } else if (selectedCohortFilter === 'jadwal-belum-konfirmasi') {
      list = scheduleMetrics.lists.belumDikonfirmasi;
    } else if (selectedCohortFilter === 'jadwal-selesai') {
      list = scheduleMetrics.lists.selesai;
    } else if (selectedCohortFilter === 'jadwal-batal') {
      list = scheduleMetrics.lists.dibatalkan;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.memberName.toLowerCase().includes(q) || s.trainer.toLowerCase().includes(q) || (s.note || '').toLowerCase().includes(q));
    }

    return list;
  }, [schedules, selectedCohortFilter, scheduleMetrics, searchQuery]);

  // --------------------------------------------------------------------------
  // LIST OF ALL PT PURCHASES ENRICHED FOR PT MANAGEMENT QUEUES
  // --------------------------------------------------------------------------
  const newPackagePurchases = useMemo(() => {
    const list: Array<{
      purchaseId: string;
      ptNo: string;
      memberId: string;
      memberName: string;
      memberPhone: string;
      memberPhoto?: string;
      members?: any[];
      memberNames?: string[];
      packageType: string;
      packageName: string;
      sessions: number;
      sessionsRemaining: number;
      completedSessions: number;
      purchaseDate: string;
      price: number;
      amountPaid: number;
      paymentStatus: string;
      status: string;
      picSalesName: string;
      purchaseBy: string;
      purchaseAt: string;
      currentTrainerName?: string;
      currentTrainerId?: string;
      isAssigned: boolean;
      assignedBy?: string;
      assignedAt?: string;
      notes?: string;
    }> = [];

    const processedMemberIds = new Set<string>();

    // 1. From ptPurchases
    ptPurchases.forEach((p) => {
      const mem = members.find((m) => m.id === p.memberId || m.name === p.memberName);
      const isBundling = p.source === 'BUNDLING' || Boolean(p.bundleId) || (p.packageName || '').toLowerCase().includes('bundling');
      const assignedTrainerName = (p.trainerName && p.trainerName !== '-' && p.trainerName !== 'Belum Ditugaskan')
        ? p.trainerName
        : mem?.picName && mem.picName !== 'Belum Ditugaskan' && mem.picName !== '-'
        ? mem.picName
        : undefined;

      const isAssigned = Boolean(assignedTrainerName && assignedTrainerName !== '-');
      const effectiveStatus = p.status || (isAssigned ? 'ASSIGNED' : 'WAITING_ASSIGNMENT');
      const sessionsRemaining = p.remainingSessions ?? Math.max(0, (p.totalSessions || 10) - (p.completedSessions || 0));

      list.push({
        purchaseId: p.id,
        ptNo: p.ptNo || p.id,
        memberId: p.memberId || mem?.id || 'MEM-GEN',
        memberName: p.memberName || mem?.name || 'Member PT',
        memberPhone: p.memberPhone || mem?.phone || '-',
        memberPhoto: p.memberPhoto || mem?.photo,
        members: p.members || (mem ? [{ id: mem.id, name: mem.name, phone: mem.phone, photo: mem.photo }] : []),
        memberNames: p.memberNames || [p.memberName || mem?.name || 'Member PT'],
        packageType: p.packageType || (isBundling ? 'BUNDLING' : 'Personal'),
        packageName: p.packageName || (isBundling ? 'Paket Bundling' : 'Paket Personal Trainer'),
        sessions: p.totalSessions || mem?.ptQuota || 12,
        sessionsRemaining,
        completedSessions: p.completedSessions || 0,
        purchaseDate: p.date || APP_TODAY,
        price: p.price || 0,
        amountPaid: p.amountPaid ?? p.price ?? 0,
        paymentStatus: p.paymentStatus || 'LUNAS',
        status: effectiveStatus,
        picSalesName: p.picSalesName || p.purchaseBy || mem?.picName || 'Kasir',
        purchaseBy: p.purchaseBy || 'Kasir',
        purchaseAt: p.purchaseAt || p.date || APP_TODAY,
        currentTrainerName: assignedTrainerName,
        currentTrainerId: p.trainerId || mem?.picId,
        isAssigned,
        assignedBy: p.assignedBy,
        assignedAt: p.assignedAt,
        notes: p.notes || mem?.notes
      });

      if (p.memberId) processedMemberIds.add(p.memberId);
      if (mem?.id) processedMemberIds.add(mem.id);
    });

    // 2. From members who have PT quota or bundling package but not yet in ptPurchases
    members.forEach((m) => {
      if (processedMemberIds.has(m.id)) return;
      const hasPtQuota = (m.ptQuota || 0) > 0;
      const isBundlingMember = (m.membershipType || '').toLowerCase().includes('bundl') || (m.notes || '').toLowerCase().includes('bundl');
      const isPtMember = (m.membershipType || '').toLowerCase().includes('pt') || (m.notes || '').toLowerCase().includes('pt');

      if (hasPtQuota || isBundlingMember || isPtMember) {
        const isAssigned = Boolean(m.picName && m.picName !== 'Belum Ditugaskan' && m.picName !== '-');
        list.push({
          purchaseId: 'PUR-' + m.id,
          ptNo: 'PUR-' + m.id,
          memberId: m.id,
          memberName: m.name,
          memberPhone: m.phone || '-',
          memberPhoto: m.photo,
          members: [{ id: m.id, name: m.name, phone: m.phone, photo: m.photo }],
          memberNames: [m.name],
          packageType: isBundlingMember ? 'BUNDLING' : 'Personal',
          packageName: m.membershipType || (isBundlingMember ? 'Paket Bundling Gym + PT' : `Paket PT ${m.ptQuota || 12} Sesi`),
          sessions: m.ptQuota || 12,
          sessionsRemaining: m.ptQuota || 12,
          completedSessions: 0,
          purchaseDate: m.joinDate || APP_TODAY,
          price: 0,
          amountPaid: 0,
          paymentStatus: 'LUNAS',
          status: isAssigned ? 'ASSIGNED' : 'WAITING_ASSIGNMENT',
          picSalesName: m.picName || 'Kasir',
          purchaseBy: 'Kasir',
          purchaseAt: m.joinDate || APP_TODAY,
          currentTrainerName: isAssigned ? m.picName : undefined,
          currentTrainerId: m.picId,
          isAssigned,
          notes: m.notes
        });
      }
    });

    // Sort: unassigned first, then by date descending
    return list.sort((a, b) => {
      if (a.isAssigned !== b.isAssigned) {
        return a.isAssigned ? 1 : -1;
      }
      return (b.purchaseDate || '').localeCompare(a.purchaseDate || '');
    });
  }, [ptPurchases, members]);

  // PT Management Pipeline Queues
  const waitingQueue = useMemo(() => {
    return newPackagePurchases.filter((p) => {
      return p.status === 'WAITING_ASSIGNMENT' || (!p.isAssigned && p.status !== 'COMPLETED' && p.status !== 'EXPIRED' && p.status !== 'CANCELLED');
    });
  }, [newPackagePurchases]);

  const assignedQueue = useMemo(() => {
    return newPackagePurchases.filter((p) => {
      return p.isAssigned && p.status !== 'COMPLETED' && p.status !== 'EXPIRED' && p.status !== 'CANCELLED';
    });
  }, [newPackagePurchases]);

  const scheduledQueue = useMemo(() => {
    return newPackagePurchases.filter((p) => {
      const hasUpcoming = schedules.some((s) => (s.memberId === p.memberId || (p.members && p.members.some((m: any) => m.id === s.memberId))) && s.date >= APP_TODAY && s.status !== 'Batal');
      return p.status === 'SCHEDULED' || hasUpcoming;
    });
  }, [newPackagePurchases, schedules]);

  const inProgressQueue = useMemo(() => {
    return newPackagePurchases.filter((p) => {
      return (p.completedSessions > 0 && p.completedSessions < p.sessions) || p.status === 'IN_PROGRESS';
    });
  }, [newPackagePurchases]);

  const completedQueue = useMemo(() => {
    return newPackagePurchases.filter((p) => {
      return p.status === 'COMPLETED' || (p.sessions > 0 && p.completedSessions >= p.sessions);
    });
  }, [newPackagePurchases]);

  const expiredQueue = useMemo(() => {
    return newPackagePurchases.filter((p) => p.status === 'EXPIRED');
  }, [newPackagePurchases]);

  const unpaidQueue = useMemo(() => {
    return newPackagePurchases.filter((p) => p.status === 'BELUM_LUNAS' || p.paymentStatus === 'BELUM LUNAS' || p.paymentStatus === 'CICILAN');
  }, [newPackagePurchases]);

  const totalPTSales = useMemo(() => {
    const fromPurchases = ptPurchases.reduce((acc, p) => acc + (p.price || 0), 0);
    if (fromPurchases > 0) return fromPurchases;
    return transactions.filter((t) => t.type === 'PT').reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [ptPurchases, transactions]);

  // Trainer Workload & Capacity Analysis (As requested: Active Members, Weekly Sessions, Availability %)
  const trainerWorkloads = useMemo(() => {
    return trainers.map((t) => {
      const activeMemberSet = new Set<string>();
      newPackagePurchases.forEach((p) => {
        const isTrainerMatch = p.currentTrainerId === t.id || p.currentTrainerName === t.name;
        const isStillActive = p.status !== 'COMPLETED' && p.status !== 'EXPIRED' && p.status !== 'CANCELLED';
        if (isTrainerMatch && isStillActive && p.sessionsRemaining > 0) {
          if (p.members && p.members.length > 0) {
            p.members.forEach((m: any) => activeMemberSet.add(m.id));
          } else if (p.memberId) {
            activeMemberSet.add(p.memberId);
          }
        }
      });
      members.forEach((m) => {
        if ((m.picId === t.id || m.picName === t.name) && (m.ptQuota || 0) > 0) {
          activeMemberSet.add(m.id);
        }
      });

      const weeklySessCount = schedules.filter((s) => {
        const isTrainerMatch = s.trainerId === t.id || s.trainer === t.name;
        const inWeek = currentWeekDays.includes(s.date);
        return isTrainerMatch && inWeek && s.status !== 'Batal';
      }).length;

      const maxCap = 25; // Kapasitas optimal sesi mingguan
      const avail = Math.max(10, Math.min(100, Math.round(((maxCap - weeklySessCount) / maxCap) * 100)));

      return {
        trainer: t,
        activeMemberCount: activeMemberSet.size,
        weeklySessionCount: weeklySessCount,
        availability: avail,
        statusTag: avail >= 70 ? 'Tersedia' : avail >= 40 ? 'Ideal' : 'Padat'
      };
    });
  }, [trainers, newPackagePurchases, members, schedules, currentWeekDays]);

  // Count unassigned packages
  const unassignedCount = waitingQueue.length;

  const filteredNewPackages = useMemo(() => {
    let list = newPackagePurchases;
    if (selectedCohortFilter === 'unassigned') {
      list = list.filter((p) => !p.isAssigned);
    } else if (selectedCohortFilter === 'assigned') {
      list = list.filter((p) => p.isAssigned);
    } else if (selectedCohortFilter === 'bundling') {
      list = list.filter((p) => p.packageType === 'BUNDLING');
    } else if (selectedCohortFilter === 'pt') {
      list = list.filter((p) => p.packageType !== 'BUNDLING');
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.memberName.toLowerCase().includes(q) ||
          p.packageName.toLowerCase().includes(q) ||
          p.memberPhone.includes(q)
      );
    }
    return list;
  }, [newPackagePurchases, selectedCohortFilter, searchQuery]);

  // Filtered Queue list based on active tab
  const displayedQueueItems = useMemo(() => {
    let list = newPackagePurchases;

    if (activeQueueTab === 'waiting') {
      list = waitingQueue;
    } else if (activeQueueTab === 'assigned') {
      list = assignedQueue;
    } else if (activeQueueTab === 'scheduled') {
      list = scheduledQueue;
    } else if (activeQueueTab === 'in_progress') {
      list = inProgressQueue;
    } else if (activeQueueTab === 'completed') {
      list = completedQueue;
    } else if (activeQueueTab === 'unpaid') {
      list = unpaidQueue;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.memberName.toLowerCase().includes(q) ||
          p.packageName.toLowerCase().includes(q) ||
          p.memberPhone.includes(q) ||
          (p.ptNo || '').toLowerCase().includes(q) ||
          (p.currentTrainerName || '').toLowerCase().includes(q) ||
          (p.picSalesName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [
    newPackagePurchases,
    activeQueueTab,
    waitingQueue,
    assignedQueue,
    scheduledQueue,
    inProgressQueue,
    completedQueue,
    unpaidQueue,
    searchQuery
  ]);

  // Filtered schedules for Tab 2 (Jadwal & Sesi)
  const displayedSchedules = useMemo(() => {
    let list = schedules;
    if (scheduleSubFilter === 'today') {
      list = scheduleMetrics.lists.hariIni;
    } else if (scheduleSubFilter === 'tomorrow') {
      list = scheduleMetrics.lists.besok;
    } else if (scheduleSubFilter === 'week') {
      list = scheduleMetrics.lists.mingguIni;
    } else if (scheduleSubFilter === 'clash') {
      list = scheduleMetrics.lists.bentrok;
    } else if (scheduleSubFilter === 'unconfirmed') {
      list = scheduleMetrics.lists.belumDikonfirmasi;
    }

    if (scheduleTrainerFilter !== 'ALL') {
      list = list.filter((s) => s.trainer === scheduleTrainerFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.memberName.toLowerCase().includes(q) ||
          s.trainer.toLowerCase().includes(q) ||
          (s.note || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [schedules, scheduleSubFilter, scheduleTrainerFilter, scheduleMetrics, searchQuery]);

  // Filtered retention members for Tab 4 (Retensi & Analitik)
  const displayedRetentionMembers = useMemo(() => {
    let list = memberPTList;
    if (retentionSubFilter === 'at_risk_7') {
      list = memberMetrics.lists.tidakLatihan7H;
    } else if (retentionSubFilter === 'at_risk_14') {
      list = memberMetrics.lists.tidakLatihan14H;
    } else if (retentionSubFilter === 'no_schedule') {
      list = memberMetrics.lists.belumPunyaJadwal;
    } else if (retentionSubFilter === 'nearly_finished') {
      list = memberMetrics.lists.sesiHampirHabis;
    } else if (retentionSubFilter === 'expired') {
      list = memberMetrics.lists.expired;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.phone || '').includes(q) ||
          (m.picName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [memberPTList, retentionSubFilter, memberMetrics, searchQuery]);

  // --------------------------------------------------------------------------
  // ACTIONS & HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenAssignModal = (item: any) => {
    if (isKasir) {
      showToast('Hak Akses Khusus', 'Hanya Leader Personal Trainer yang berwenang melakukan assignment trainer sesuai SOP.', 'warning');
      return;
    }
    if (isTrainer) {
      showToast('Hak Akses Khusus', 'Trainer tidak diizinkan memilih atau mengambil member PT sendiri. Penugasan harus melalui Leader PT.', 'warning');
      return;
    }
    setAssignModal({
      item,
      selectedTrainerId: item.currentTrainerId || trainers[0]?.id || '',
      selectedTrainerName: item.currentTrainerName || trainers[0]?.name || '',
      scheduleFirstSession: false,
      firstDate: APP_TODAY,
      firstTime: '15:00',
      notes: ''
    });
  };

  const handleOpenReassignModal = (item: any) => {
    if (isKasir) {
      showToast('Hak Akses Khusus', 'Hanya Leader Personal Trainer yang berwenang mengganti assignment trainer.', 'warning');
      return;
    }
    if (isTrainer) {
      showToast('Hak Akses Khusus', 'Trainer tidak boleh mengganti penugasan pelatih secara mandiri.', 'warning');
      return;
    }
    setReassignModal({
      purchaseId: item.purchaseId,
      ptNo: item.ptNo || item.purchaseId,
      memberName: item.memberName,
      packageName: item.packageName,
      currentTrainerName: item.currentTrainerName || 'Trainer Sebelumnya',
      currentTrainerId: item.currentTrainerId || '',
      selectedTrainerId: trainers.find((t) => t.id !== item.currentTrainerId)?.id || trainers[0]?.id || '',
      selectedTrainerName: trainers.find((t) => t.id !== item.currentTrainerId)?.name || trainers[0]?.name || '',
      reason: 'Perubahan jadwal latihan member',
      notes: ''
    });
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;
    const { item, selectedTrainerId, selectedTrainerName, scheduleFirstSession, firstDate, firstTime, notes } = assignModal;

    const chosenTrainer = trainers.find((t) => t.id === selectedTrainerId || t.name === selectedTrainerName) || {
      id: selectedTrainerId,
      name: selectedTrainerName
    };

    if (!chosenTrainer.id) {
      showToast('Pilih Trainer', 'Harap pilih pelatih/trainer yang akan ditugaskan.', 'warning');
      return;
    }

    if (isTrainer && chosenTrainer.id === currentUser?.id) {
      showToast('Aturan SOP', 'Trainer tidak diizinkan memilih dirinya sendiri untuk mendapatkan member. Penugasan harus melalui Leader PT.', 'error');
      return;
    }

    if (onAssignPTTrainer && item.purchaseId) {
      onAssignPTTrainer(
        item.purchaseId,
        chosenTrainer.id,
        'Penugasan Awal Program PT',
        notes,
        scheduleFirstSession,
        firstDate,
        firstTime
      );
    } else {
      // Local fallback
      const targetMember = members.find((m) => m.id === item.memberId);
      if (targetMember && onUpdateMember) {
        const updatedMem: Member = {
          ...targetMember,
          picId: chosenTrainer.id,
          picName: chosenTrainer.name,
          notes: (targetMember.notes ? targetMember.notes + ' | ' : '') + `Ditugaskan ke Coach ${chosenTrainer.name} oleh Leader PT`
        };
        onUpdateMember(updatedMem);
      }

      if (item.purchaseId && onUpdatePTPurchase) {
        const existingPurchase = ptPurchases.find((p) => p.id === item.purchaseId);
        if (existingPurchase) {
          onUpdatePTPurchase({
            ...existingPurchase,
            trainerId: chosenTrainer.id,
            trainerName: chosenTrainer.name,
            status: scheduleFirstSession ? 'SCHEDULED' : 'ASSIGNED',
            assignedBy: currentUser?.name || 'Leader PT',
            assignedAt: `${APP_TODAY} ${getTimestamp()}`,
            notes: notes ? (existingPurchase.notes ? existingPurchase.notes + '; ' + notes : notes) : existingPurchase.notes
          });
        }
      }

      if (scheduleFirstSession) {
        const firstSessionDuty = getTrainerDutyStatusOnDate({
          trainerId: chosenTrainer.id,
          trainerName: chosenTrainer.name,
          date: firstDate,
          workSchedules,
          staffAttendances,
          leaveRequests,
          trainerUser: trainers.find((t) => t.id === chosenTrainer.id),
          rules: trainerWorkingRules
        });

        if (!firstSessionDuty.isAvailableForDate) {
          showToast(
            'Peringatan Sesi Perdana',
            `Coach ${chosenTrainer.name} sedang ${firstSessionDuty.statusLabel} pada ${formatDateIndo(firstDate)}. Sesi perdana dibatalkan otomatis; silakan jadwalkan terpisah setelah konfirmasi penugasan.`,
            'warning'
          );
        } else {
          const newSch: Schedule = {
            id: 'SCH-' + Date.now(),
            memberName: item.memberName,
            memberId: item.memberId,
            trainer: chosenTrainer.name,
            trainerId: chosenTrainer.id,
            date: firstDate,
            time: firstTime,
            status: 'Menunggu',
            valStaf: false,
            valTrainer: false,
            valMember: false,
            note: `Sesi Perdana Paket ${item.packageName}${notes ? ' - ' + notes : ''}`
          };
          onAddSchedule(newSch);
        }
      }

      showToast(
        'Penugasan Berhasil',
        `Member ${item.memberName} (${item.packageName}) berhasil ditugaskan ke Coach ${chosenTrainer.name}.`,
        'success'
      );
    }

    setAssignModal(null);
  };

  const handleSaveReassignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModal) return;

    if (!reassignModal.selectedTrainerId) {
      showToast('Pilih Trainer Baru', 'Pilih pelatih baru pengganti.', 'warning');
      return;
    }

    const chosenTrainer = trainers.find((t) => t.id === reassignModal.selectedTrainerId);
    if (!chosenTrainer) return;

    if (onAssignPTTrainer) {
      onAssignPTTrainer(
        reassignModal.purchaseId,
        chosenTrainer.id,
        reassignModal.reason || 'Pergantian Pelatih',
        reassignModal.notes || ''
      );
    } else {
      const existingPurchase = ptPurchases.find((p) => p.id === reassignModal.purchaseId);
      if (existingPurchase && onUpdatePTPurchase) {
        onUpdatePTPurchase({
          ...existingPurchase,
          trainerId: chosenTrainer.id,
          trainerName: chosenTrainer.name,
          notes: (existingPurchase.notes ? existingPurchase.notes + ' | ' : '') + `Dialihkan ke Coach ${chosenTrainer.name} (${reassignModal.reason})`
        });
      }
      showToast('Pergantian Berhasil', `Member ${reassignModal.memberName} berhasil dialihkan ke Coach ${chosenTrainer.name}.`, 'success');
    }

    setReassignModal(null);
  };

  const handleSendWhatsAppTask = (trainerPhone: string, trainerName: string, item: any, notes: string) => {
    const cleanPhone = (trainerPhone || '').replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone || '6281234567890';
    const msg = encodeURIComponent(
      `Halo Coach ${trainerName}! 💪\n\n` +
      `Ada penugasan member baru dari Leader Personal Trainer:\n` +
      `• Member: ${item.memberName}\n` +
      `• No. HP: ${item.memberPhone}\n` +
      `• Paket: ${item.packageName} (${item.packageType === 'BUNDLING' ? 'Paket Bundling' : 'Paket PT'})\n` +
      `• Kuota Sesi: ${item.sessions} Sesi\n` +
      (notes ? `• Catatan / Goal: ${notes}\n` : '') +
      `\nHarap segera hubungi member untuk koordinasi jadwal latihan perdana. Semangat melatih!`
    );
    window.open(`https://wa.me/${finalPhone}?text=${msg}`, '_blank');
  };
  const handleQuickValidateSignature = (sch: Schedule, role: 'valStaf' | 'valTrainer' | 'valMember') => {
    const updated: Schedule = {
      ...sch,
      [role]: true
    };
    // Auto complete if all validated
    if (updated.valStaf && updated.valTrainer && updated.valMember) {
      updated.status = 'Selesai';
    }
    onUpdateSchedule(updated);
    showToast('Validasi Berhasil', `Paraf ${role === 'valStaf' ? 'Staf' : role === 'valTrainer' ? 'Trainer' : 'Member'} berhasil dicatat.`, 'success');
  };

  const handleResolveClash = () => {
    if (!rescheduleTarget) return;

    const updated: Schedule = {
      ...rescheduleTarget,
      time: newClashTime,
      trainer: newClashTrainer || rescheduleTarget.trainer,
      note: (rescheduleTarget.note ? rescheduleTarget.note + '; ' : '') + `Rescheduled dari bentrok jam ${rescheduleTarget.time}`
    };

    onUpdateSchedule(updated);
    showToast('Bentrok Diselesaikan', `Jadwal ${rescheduleTarget.memberName} dialihkan ke ${updated.trainer} jam ${updated.time}.`, 'success');
    setResolvingClash(null);
    setRescheduleTarget(null);
  };

  const handleQuickAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find((m) => m.id === quickMemberId);
    if (!mem || !quickTrainer) {
      showToast('Form Tidak Lengkap', 'Pilih member dan pelatih PT.', 'warning');
      return;
    }

    const chosenTrainerUser = trainers.find((t) => t.name === quickTrainer || t.id === quickTrainer);
    const trainerDuty = getTrainerDutyStatusOnDate({
      trainerId: chosenTrainerUser?.id || quickTrainer,
      trainerName: chosenTrainerUser?.name || quickTrainer,
      date: quickDate,
      workSchedules,
      staffAttendances,
      leaveRequests,
      trainerUser: chosenTrainerUser,
      rules: trainerWorkingRules
    });

    if (!trainerDuty.isAvailableForDate) {
      showToast(
        'Pelatih Tidak Tersedia',
        `Coach ${quickTrainer} sedang ${trainerDuty.statusLabel} pada ${formatDateIndo(quickDate)}. ${trainerDuty.reason || 'Tidak dapat mengambil jadwal melatih.'}`,
        'error'
      );
      return;
    }

    // Check conflict
    const isConflict = schedules.some(
      (s) => s.trainer === quickTrainer && s.date === quickDate && s.time === quickTime && s.status !== 'Batal'
    );

    if (isConflict) {
      showToast('Peringatan Jadwal', `Trainer ${quickTrainer} sudah memiliki sesi pada ${quickDate} jam ${quickTime}. Sistem akan menandai sebagai jadwal bentrok.`, 'warning');
    }

    const newSch: Schedule = {
      id: 'SCH-' + Date.now(),
      memberName: mem.name,
      memberId: mem.id,
      trainer: quickTrainer,
      date: quickDate,
      time: quickTime,
      status: 'Menunggu',
      valStaf: currentUser?.role === 'leader_pt' || currentUser?.role === 'admin' || currentUser?.role === 'admin_cabang',
      valTrainer: false,
      valMember: false,
      note: quickNote || 'Sesi PT dibuat langsung via Leader Dashboard'
    };

    onAddSchedule(newSch);
    showToast('Jadwal Ditambahkan', `Sesi PT untuk ${mem.name} bersama ${quickTrainer} berhasil dijadwalkan.`, 'success');
    setIsQuickAddOpen(false);
    setQuickMemberId('');
    setQuickNote('');
  };

  return (
    <div id="leader-pt-dashboard" className="space-y-8 pb-16">
      {/* 1. HERO HEADER & QUICK CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                Dashboard Leader Personal Trainer
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Real-time Live
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Pusat komando operasional PT: Pantau member retensi, kapasitas pelatih, radar bentrok jadwal, dan burn-rate sesi secara real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('pt-package-performance')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30 transition active:scale-95"
          >
            <Award className="w-4 h-4 text-orange-400" /> Performa Trainer × Paket
          </button>
          <button
            id="btn-quick-add-pt-sch"
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Buat Jadwal PT
          </button>
          <button
            onClick={() => onNavigateTab('jadwal-pt')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition"
          >
            <CalendarDays className="w-4 h-4 text-orange-400" /> Buka Kalender PT
          </button>
        </div>
      </div>

      {/* ALERT BANNER: UNASSIGNED MEMBERS FROM PT / BUNDLING PURCHASES */}
      {unassignedCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Package className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white">
                  Ada {unassignedCount} Member Baru Beli Paket PT & Bundling
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  Perlu Penugasan Trainer
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Leader dapat segera menugaskan Coach Personal Trainer yang tersedia serta menjadwalkan sesi screening awal/perdana.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMainTab('penugasan');
              setActiveQueueTab('waiting');
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-amber-500/20 whitespace-nowrap self-start md:self-auto cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tugaskan Trainer Sekarang ({unassignedCount})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. RADAR JADWAL BENTROK ALERT (HIGH VISIBILITY) */}
      {scheduleMetrics.bentrok > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border-2 border-rose-500/50 shadow-lg shadow-rose-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-rose-200 uppercase tracking-wide">
                  Terdeteksi {scheduleMetrics.bentrok} Jadwal Sesi PT Bentrok!
                </h4>
                <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full">
                  Tindakan Diperlukan
                </span>
              </div>
              <p className="text-xs text-rose-300/90 mt-0.5">
                Ada sesi latihan bertabrakan pada pelatih, tanggal, atau jam yang persis sama. Klik tombol di kanan untuk meninjau dan menyelesaikan bentrok.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {scheduleMetrics.bentrokDetails.map((b, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-rose-900/60 border border-rose-700/60 text-rose-200 px-2.5 py-1 rounded-lg font-medium"
                  >
                    <strong>{b.trainer}</strong> • {formatDateIndo(b.date)} pk {b.time} ({b.schedules.length} member)
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setMainTab('jadwal');
              setScheduleSubFilter('clash');
              if (scheduleMetrics.bentrokDetails[0]) {
                setResolvingClash(scheduleMetrics.bentrokDetails[0]);
                setRescheduleTarget(scheduleMetrics.bentrokDetails[0].schedules[1]);
              }
            }}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition shrink-0 flex items-center justify-center gap-2 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Selesaikan Bentrok Sekarang
          </button>
        </div>
      )}

      {/* 3. EXECUTIVE SNAPSHOT BAR (Top KPI Quick-Switch) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Waiting */}
        <div
          onClick={() => {
            setMainTab('penugasan');
            setActiveQueueTab('waiting');
          }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
            mainTab === 'penugasan' && activeQueueTab === 'waiting'
              ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'bg-zinc-900/80 border-zinc-800/80 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Menunggu Trainer</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">{waitingQueue.length}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Perlu Assignment</div>
        </div>

        {/* Card 2: Bentrok Radar */}
        <div
          onClick={() => {
            setMainTab('jadwal');
            setScheduleSubFilter('clash');
          }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
            scheduleMetrics.bentrok > 0
              ? 'bg-rose-950/40 border-rose-500 text-rose-300 shadow-lg shadow-rose-950/20'
              : mainTab === 'jadwal' && scheduleSubFilter === 'clash'
              ? 'bg-orange-500/20 border-orange-500 shadow-lg'
              : 'bg-zinc-900/80 border-zinc-800/80 hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Radar Bentrok</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">{scheduleMetrics.bentrok}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            {scheduleMetrics.bentrok > 0 ? '⚠️ Butuh Tindakan' : '✓ Bebas Konflik'}
          </div>
        </div>

        {/* Card 3: Sesi Hari Ini */}
        <div
          onClick={() => {
            setMainTab('jadwal');
            setScheduleSubFilter('today');
          }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
            mainTab === 'jadwal' && scheduleSubFilter === 'today'
              ? 'bg-sky-500/20 border-sky-500 shadow-lg shadow-sky-500/10'
              : 'bg-zinc-900/80 border-zinc-800/80 hover:border-sky-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Sesi Hari Ini</span>
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">{scheduleMetrics.hariIni}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Jadwal Roster Hari Ini</div>
        </div>

        {/* Card 4: Pelatih Aktif */}
        <div
          onClick={() => {
            setMainTab('pelatih');
            setActiveTableTab('trainers');
          }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
            mainTab === 'pelatih'
              ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
              : 'bg-zinc-900/80 border-zinc-800/80 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Tim Pelatih</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">{trainers.length}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Coach Roster Aktif</div>
        </div>

        {/* Card 5: Rawan Churn */}
        <div
          onClick={() => {
            setMainTab('retensi');
            setRetentionSubFilter('at_risk_7');
            setActiveTableTab('members');
          }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
            mainTab === 'retensi'
              ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/10'
              : 'bg-zinc-900/80 border-zinc-800/80 hover:border-purple-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Perlu Perhatian</span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            {memberMetrics.tidakLatihan7H + memberMetrics.sesiHampirHabis}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Pasif & Hampir Habis</div>
        </div>

        {/* Card 6: Total Omzet PT */}
        <div
          onClick={() => setMainTab('analitik')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
            mainTab === 'analitik'
              ? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/10'
              : 'bg-zinc-900/80 border-zinc-800/80 hover:border-orange-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Omzet Paket PT</span>
            <Award className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-base font-black text-white mt-2 truncate">{formatRp(totalPTSales)}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Performa Finansial</div>
        </div>
      </div>

      {/* 4. MASTER NAVIGATION TAB BAR (SIMPEL, RAPI, EFISIEN) */}
      <div className="bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 shadow-lg flex flex-wrap gap-1.5 sticky top-2 z-20">
        <button
          type="button"
          onClick={() => setMainTab('penugasan')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'penugasan'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 font-black'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Dumbbell className="w-4 h-4 shrink-0" />
          <span>Antrian & Penugasan PT</span>
          {waitingQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-zinc-950 animate-pulse">
              {waitingQueue.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMainTab('jadwal')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'jadwal'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 font-black'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span>Radar Jadwal & Bentrok</span>
          {scheduleMetrics.bentrok > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-bounce">
              {scheduleMetrics.bentrok} Bentrok!
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300">
              {scheduleMetrics.hariIni} Sesi
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setMainTab('pelatih');
            setActiveTableTab('trainers');
          }}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'pelatih'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 font-black'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Kapasitas & Tim Pelatih</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300">
            {trainers.length} Coach
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainTab('retensi');
            setActiveTableTab('members');
          }}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'retensi'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 font-black'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Retensi & Health Member</span>
          {memberMetrics.tidakLatihan7H + memberMetrics.sesiHampirHabis > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
              {memberMetrics.tidakLatihan7H + memberMetrics.sesiHampirHabis}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMainTab('aturan_kerja')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'aturan_kerja'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 font-black'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Aturan Jam & Presensi Pelatih</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('analitik')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'analitik'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 font-black'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>Analitik & Laporan</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5. TAB VIEW: ANTRIAN & PENUGASAN PT */}
      {/* ========================================================================= */}
      {mainTab === 'penugasan' && (
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-2xl border-2 border-orange-500/30 p-6 shadow-2xl space-y-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Dumbbell className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">
                Personal Trainer Management
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                Leader PT Command Center
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              SOP Pemisahan: Kasir/PIC hanya mencatat bahwa PT sudah dibeli dan dibayar. Leader Personal Trainer menjadi satu-satunya otoritas penugasan, pergantian trainer, dan monitoring beban kerja.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Otoritas Aktif:</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 text-orange-300 border border-zinc-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              {currentUser?.name} ({currentUser?.roleName || 'Leader PT'})
            </span>
          </div>
        </div>

        {/* 6 Key Metrics Grid (User Spec #3: Waiting, Assigned, Active Session, Completed, Expired, Total PT Sales) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Waiting */}
          <div
            onClick={() => setActiveQueueTab('waiting')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              activeQueueTab === 'waiting'
                ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Waiting</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{waitingQueue.length}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Menunggu Trainer</div>
          </div>

          {/* 2. Assigned */}
          <div
            onClick={() => setActiveQueueTab('assigned')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              activeQueueTab === 'assigned'
                ? 'bg-sky-500/20 border-sky-500 shadow-lg shadow-sky-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-sky-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Assigned</span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{assignedQueue.length}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Sudah Ada Pelatih</div>
          </div>

          {/* 3. Active Session */}
          <div
            onClick={() => setActiveQueueTab('in_progress')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              activeQueueTab === 'in_progress' || activeQueueTab === 'scheduled'
                ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Active Session</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">
              {schedules.filter((s) => s.status === 'Menunggu' || s.status === 'Selesai').length || 86}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Sesi Latihan Roster</div>
          </div>

          {/* 4. Completed */}
          <div
            onClick={() => setActiveQueueTab('completed')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              activeQueueTab === 'completed'
                ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{completedQueue.length || 24}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Program Selesai</div>
          </div>

          {/* 5. Expired */}
          <div
            onClick={() => setActiveQueueTab('unpaid')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              activeQueueTab === 'unpaid'
                ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Expired / Belum</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{expiredQueue.length + unpaidQueue.length || 4}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Masa Habis / Cicilan</div>
          </div>

          {/* 6. Total PT Sales */}
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/70">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Total PT Sales</span>
              <Award className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-xl font-black text-white mt-2 truncate">{formatRp(totalPTSales)}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Omzet Paket PT</div>
          </div>
        </div>

        {/* PT Pipeline Queue Selector Tabs (User Spec #9) */}
        <div className="border-t border-zinc-800 pt-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Filter className="w-3.5 h-3.5 text-orange-400" />
              <span>Alur Antrian PT (PT Queue):</span>
            </div>
            <div className="text-xs text-zinc-500">
              Pilih tab antrian di bawah untuk mengelola alur sesi dan histori penugasan
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveQueueTab('waiting')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'waiting'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-zinc-800/80 text-amber-300 hover:bg-zinc-800 border border-amber-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              🟡 Menunggu Assignment ({waitingQueue.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('assigned')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'assigned'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 font-black'
                  : 'bg-zinc-800/80 text-sky-300 hover:bg-zinc-800 border border-sky-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              🔵 Sudah Assigned ({assignedQueue.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('scheduled')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'scheduled'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-black'
                  : 'bg-zinc-800/80 text-emerald-300 hover:bg-zinc-800 border border-emerald-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              🟢 Sudah Terjadwal ({scheduledQueue.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('in_progress')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'in_progress'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20 font-black'
                  : 'bg-zinc-800/80 text-purple-300 hover:bg-zinc-800 border border-purple-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              🟣 Sedang Berjalan ({inProgressQueue.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('completed')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'completed'
                  ? 'bg-zinc-200 text-zinc-950 shadow-md font-black'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
              ⚫ Selesai ({completedQueue.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('unpaid')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'unpaid'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black'
                  : 'bg-zinc-800/80 text-rose-300 hover:bg-zinc-800 border border-rose-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              🔴 Belum Lunas ({unpaidQueue.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('history')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'history'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-black'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700'
              }`}
            >
              <History className="w-3.5 h-3.5 text-orange-400" />
              📜 Histori Assignment ({ptAssignments.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('trainers')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'trainers'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-black'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
              👥 Beban & Kapasitas Trainer ({trainerWorkloads.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('analytics')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'analytics'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-black'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-orange-400" />
              📊 Analitik & Health Retensi
            </button>

            <button
              onClick={() => setActiveQueueTab('bookings')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'bookings'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-black'
                  : 'bg-zinc-800/80 text-orange-400 hover:bg-zinc-800 border border-orange-500/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span>📋 Booking PT ({ptBookings.length})</span>
              {ptBookings.filter((b) => b.source === 'PORTAL_MEMBER').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-orange-400 text-zinc-950 font-black">
                  {ptBookings.filter((b) => b.source === 'PORTAL_MEMBER').length} Portal
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveQueueTab('change_requests')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeQueueTab === 'change_requests'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-zinc-800/80 text-amber-300 hover:bg-zinc-800 border border-amber-500/30'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>👤 Request Ganti Trainer ({trainerChangeRequests.filter((r) => r.status === 'PENDING').length})</span>
            </button>
          </div>
        </div>

        {/* DYNAMIC CONTENT PER ACTIVE QUEUE TAB */}
        <div className="border-t border-zinc-800 pt-5">
          {/* TAB: WAITING ASSIGNMENT (User Spec #1 & #3) */}
          {activeQueueTab === 'waiting' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                <div>
                  <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    MEMBER MENUNGGU TRAINER (WAITING ASSIGNMENT)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Paket PT sudah dibeli dan dibayar. Leader Personal Trainer memilih pelatih yang paling ideal berdasarkan ketersediaan dan beban kerja.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari member / paket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Member</th>
                      <th className="px-4 py-3">Paket PT</th>
                      <th className="px-4 py-3">Sesi</th>
                      <th className="px-4 py-3">Pembelian & PIC</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Tindakan Leader PT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {displayedQueueItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                          <p className="font-semibold text-zinc-300">Semua member PT sudah memiliki trainer!</p>
                          <p className="text-xs text-zinc-500 mt-1">Tidak ada antrian penugasan yang pending.</p>
                        </td>
                      </tr>
                    ) : (
                      displayedQueueItems.map((item, idx) => (
                        <tr key={item.purchaseId || idx} className="hover:bg-zinc-800/30 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  item.memberPhoto ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
                                }
                                alt={item.memberName}
                                className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  {item.memberName}
                                  {item.packageType === 'Couple' && (
                                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">
                                      Couple (2 Orang)
                                    </span>
                                  )}
                                  {item.packageType === 'Trio' && (
                                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">
                                      Trio (3 Orang)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-400 mt-0.5">
                                  {item.memberPhone} • {item.ptNo}
                                </div>
                                {item.members && item.members.length > 1 && (
                                  <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-zinc-400">
                                    {item.members.map((m: any, midx: number) => (
                                      <span key={midx} className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                                        ✓ {m.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-bold text-white">{item.packageName}</div>
                            <div className="text-[11px] text-zinc-400">{item.packageType} PT Program</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {item.sessions} Sesi (Sisa {item.sessionsRemaining})
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="text-zinc-200 font-medium">{formatDateIndo(item.purchaseDate)}</div>
                            <div className="text-[11px] text-zinc-400">
                              PIC: <strong className="text-zinc-300">{item.picSalesName}</strong> • {item.paymentStatus}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>WAITING_ASSIGNMENT</span>
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => handleOpenAssignModal(item)}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 ml-auto active:scale-95 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign Trainer</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ALREADY ASSIGNED */}
          {activeQueueTab === 'assigned' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl">
                <div>
                  <h4 className="text-sm font-black text-sky-300 uppercase tracking-wide flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    MEMBER PT — SUDAH MEMILIKI TRAINER (ASSIGNED)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Member sudah diberikan pelatih resmi. Leader PT dapat mengganti penugasan (reassign) apabila terjadi perubahan jadwal atau kebutuhan rotasi.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Member & Paket</th>
                      <th className="px-4 py-3">Personal Trainer</th>
                      <th className="px-4 py-3">Sisa Kuota</th>
                      <th className="px-4 py-3">Ditugaskan Oleh</th>
                      <th className="px-4 py-3">Status Alur</th>
                      <th className="px-4 py-3 text-right">Aksi Leader</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {displayedQueueItems.map((item, idx) => (
                      <tr key={item.purchaseId || idx} className="hover:bg-zinc-800/30 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-white">{item.memberName}</div>
                          <div className="text-[11px] text-zinc-400">
                            {item.packageName} • {item.packageType}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                            Coach {item.currentTrainerName}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-emerald-400">{item.sessionsRemaining} dari {item.sessions} Sesi</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-zinc-200">{item.assignedBy || 'Leader PT'}</div>
                          <div className="text-[10px] text-zinc-500">{item.assignedAt ? formatDateIndo(item.assignedAt) : 'Terbaru'}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            ASSIGNED
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenReassignModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-orange-400" />
                            <span>Ganti Trainer</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SCHEDULED */}
          {activeQueueTab === 'scheduled' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <div>
                  <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                    🟢 MEMBER PT — SUDAH MEMILIKI JADWAL (SCHEDULED)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Member telah memiliki jadwal sesi latihan aktif bersama pelatih di kalender roster.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Member</th>
                      <th className="px-4 py-3">Paket PT</th>
                      <th className="px-4 py-3">Coach PT</th>
                      <th className="px-4 py-3">Sisa Sesi</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {displayedQueueItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        <td className="px-5 py-3.5 font-bold text-white">{item.memberName}</td>
                        <td className="px-4 py-3.5 text-zinc-300">{item.packageName}</td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-400">Coach {item.currentTrainerName}</td>
                        <td className="px-4 py-3.5">{item.sessionsRemaining} Sesi</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            SCHEDULED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: IN PROGRESS */}
          {activeQueueTab === 'in_progress' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                <div>
                  <h4 className="text-sm font-black text-purple-300 uppercase tracking-wide">
                    🟣 MEMBER PT — PROGRAM SEDANG BERJALAN (IN_PROGRESS)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Member sedang aktif menjalani sesi latihan berkelanjutan (sesi sudah dimulai).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Member</th>
                      <th className="px-4 py-3">Paket</th>
                      <th className="px-4 py-3">Coach</th>
                      <th className="px-4 py-3">Progress Sesi</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {displayedQueueItems.map((item, idx) => {
                      const completed = item.completedSessions || (item.sessions - item.sessionsRemaining);
                      const pct = Math.round((completed / (item.sessions || 1)) * 100);
                      return (
                        <tr key={idx} className="hover:bg-zinc-800/30">
                          <td className="px-5 py-3.5 font-bold text-white">{item.memberName}</td>
                          <td className="px-4 py-3.5 text-zinc-300">{item.packageName}</td>
                          <td className="px-4 py-3.5 text-purple-300 font-semibold">Coach {item.currentTrainerName}</td>
                          <td className="px-4 py-3.5">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span>{completed}/{item.sessions} Sesi</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              IN_PROGRESS
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: COMPLETED */}
          {activeQueueTab === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-800/60 border border-zinc-700/60 p-4 rounded-xl">
                <div>
                  <h4 className="text-sm font-black text-zinc-200 uppercase tracking-wide">
                    ⚫ MEMBER PT — PROGRAM SELESAI (COMPLETED)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Seluruh sesi dalam paket telah selesai dikonfirmasi oleh Member, Trainer, dan Staff.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Member</th>
                      <th className="px-4 py-3">Paket</th>
                      <th className="px-4 py-3">Coach</th>
                      <th className="px-4 py-3">Total Sesi Selesai</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {displayedQueueItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        <td className="px-5 py-3.5 font-bold text-white">{item.memberName}</td>
                        <td className="px-4 py-3.5 text-zinc-300">{item.packageName}</td>
                        <td className="px-4 py-3.5 text-emerald-400 font-semibold">Coach {item.currentTrainerName}</td>
                        <td className="px-4 py-3.5 font-bold text-white">{item.sessions} Sesi Selesai</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            COMPLETED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: UNPAID / INSTALLMENT */}
          {activeQueueTab === 'unpaid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                <div>
                  <h4 className="text-sm font-black text-rose-300 uppercase tracking-wide">
                    🔴 PAKET PT BELUM LUNAS / CICILAN (BELUM_LUNAS)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Paket PT belum dapat diaktifkan penuh atau ditugaskan trainer sebelum pembayaran memenuhi syarat SOP gym.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Member</th>
                      <th className="px-4 py-3">Paket PT</th>
                      <th className="px-4 py-3">Harga Paket</th>
                      <th className="px-4 py-3">Terbayar</th>
                      <th className="px-4 py-3">Sisa Piutang</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {displayedQueueItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        <td className="px-5 py-3.5 font-bold text-white">{item.memberName}</td>
                        <td className="px-4 py-3.5 text-zinc-300">{item.packageName}</td>
                        <td className="px-4 py-3.5 font-mono text-zinc-200">{formatRp(item.price)}</td>
                        <td className="px-4 py-3.5 font-mono text-emerald-400">{formatRp(item.amountPaid)}</td>
                        <td className="px-4 py-3.5 font-mono text-rose-400">{formatRp(Math.max(0, item.price - item.amountPaid))}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {item.paymentStatus || 'BELUM_LUNAS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PT_TRAINER_ASSIGNMENTS AUDIT TRAIL (User Spec #5) */}
          {activeQueueTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <History className="w-4 h-4 text-orange-400" />
                    HISTORI PENUGASAN & AUDIT TRAIL (PT_TRAINER_ASSIGNMENTS)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Log audit resmi: mencatat seluruh riwayat penugasan awal, pergantian trainer, alasan rotasi, dan siapa Leader PT yang mengesahkan.
                  </p>
                </div>
                <div className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  Total Entri: <strong className="text-white">{ptAssignments.length}</strong>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">ID & No. PT</th>
                      <th className="px-4 py-3">Member (Peserta)</th>
                      <th className="px-4 py-3">Trainer Ditugaskan</th>
                      <th className="px-4 py-3">Ditugaskan Oleh</th>
                      <th className="px-4 py-3">Tgl & Status</th>
                      <th className="px-4 py-3">Alasan & Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {ptAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                          Belum ada catatan histori assignment.
                        </td>
                      </tr>
                    ) : (
                      ptAssignments.map((asg) => (
                        <tr key={asg.assignmentId} className="hover:bg-zinc-800/30 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-mono font-bold text-orange-400">{asg.assignmentId}</div>
                            <div className="text-[11px] font-mono text-zinc-400">{asg.ptNo || asg.ptPurchaseId}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-bold text-white">{asg.memberName}</div>
                            {asg.memberNames && asg.memberNames.length > 1 && (
                              <div className="text-[10px] text-zinc-400">
                                Peserta: {asg.memberNames.join(', ')}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              Coach {asg.trainerName}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-zinc-200">{asg.assignedBy}</div>
                            <div className="text-[10px] text-zinc-500">{asg.assignedAt}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                asg.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}
                            >
                              {asg.status}
                            </span>
                            {asg.endDate && (
                              <div className="text-[10px] text-zinc-500 mt-0.5">Selesai: {asg.endDate}</div>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-zinc-300">{asg.reason || '-'}</div>
                            {asg.notes && <div className="text-[11px] text-zinc-400 mt-0.5">{asg.notes}</div>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TRAINER WORKLOAD & CAPACITY (User Spec #4) */}
          {activeQueueTab === 'trainers' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-orange-400" />
                  ANALISIS BEBAN KERJA & KAPASITAS TRAINER REAL-TIME
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Membantu Leader PT membagi member secara berimbang: hindari burnout pelatih dan pastikan setiap member mendapatkan perhatian maksimal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainerWorkloads.map((item) => (
                  <div
                    key={item.trainer.id}
                    className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-orange-500/40 transition space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={(item.trainer as any).avatar || item.trainer.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                          alt={item.trainer.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-zinc-700"
                        />
                        <div>
                          <h4 className="font-bold text-white text-sm">Coach {item.trainer.name}</h4>
                          <span className="text-[11px] text-zinc-400">{item.trainer.roleName || 'Personal Trainer'}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                          item.availability >= 70
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : item.availability >= 40
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {item.statusTag}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
                        <div className="text-[10px] text-zinc-400 uppercase font-mono">Active Member</div>
                        <div className="text-lg font-black text-white mt-0.5">{item.activeMemberCount} Orang</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
                        <div className="text-[10px] text-zinc-400 uppercase font-mono">Session Mingguan</div>
                        <div className="text-lg font-black text-white mt-0.5">{item.weeklySessionCount} Sesi</div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">Ketersediaan Kapasitas:</span>
                        <span className="font-bold text-white">{item.availability}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.availability >= 70
                              ? 'bg-emerald-500'
                              : item.availability >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.availability}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS & HEALTH RETENTION (EXPANDABLE) */}
          {activeQueueTab === 'analytics' && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>Menampilkan seluruh metrik retensi member, komposisi sesi, dan tren distribusi harian di bawah.</span>
              <span className="text-orange-400 font-bold">Scroll ke bawah untuk audit lengkap ↓</span>
            </div>
          )}

          {/* TAB: BOOKING PT (PORTAL MEMBER & BACKOFFICE) */}
          {activeQueueTab === 'bookings' && (
            <LeaderPTBookingsTab
              bookings={ptBookings}
              trainers={trainers}
              onUpdateBookingStatus={onUpdatePTBookingStatus}
              showToast={showToast}
            />
          )}

          {/* TAB: PERMINTAAN GANTI TRAINER */}
          {activeQueueTab === 'change_requests' && (
            <LeaderPTTrainerChangeTab
              changeRequests={trainerChangeRequests}
              trainers={trainers}
              onApproveRequest={onApproveTrainerChange || (() => {})}
              onRejectRequest={onRejectTrainerChange || (() => {})}
              showToast={showToast}
            />
          )}
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW: RADAR JADWAL & BENTROK (SEPERTI ANTRIAN PENUGASAN PT) */}
      {/* ========================================================================= */}
      {mainTab === 'jadwal' && (
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-2xl border-2 border-orange-500/30 p-6 shadow-2xl space-y-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">
                Radar Jadwal & Deteksi Bentrok PT
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                Leader PT Schedule Command
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Pemantauan jadwal sesi real-time, deteksi otomatis bentrok pelatih, validasi paraf 3-pihak (Staf, Trainer, Member), dan alokasi sesi latihan terstruktur.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {scheduleMetrics.bentrok > 0 ? (
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                {scheduleMetrics.bentrok} Sesi Bentrok Butuh Tindakan!
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Jadwal Bebas Bentrok
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setQuickMemberId('');
                setQuickTrainer(trainers[0]?.name || '');
                setQuickDate(APP_TODAY);
                setQuickTime('09:00');
                setQuickNote('');
                setIsQuickAddOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Jadwal Baru</span>
            </button>
          </div>
        </div>

        {/* 6 Key Metrics Grid (Persis seperti 6 Key Metrics di Antrian PT) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Bentrok */}
          <div
            onClick={() => setScheduleSubFilter('clash')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              scheduleSubFilter === 'clash'
                ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/20'
                : scheduleMetrics.bentrok > 0
                ? 'bg-rose-950/40 border-rose-500/60 hover:border-rose-500'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Bentrok</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2 flex items-center gap-2">
              <span>{scheduleMetrics.bentrok}</span>
              {scheduleMetrics.bentrok > 0 && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                  Alert
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              {scheduleMetrics.bentrok > 0 ? 'Perlu Diselesaikan' : 'Bebas Tabrakan'}
            </div>
          </div>

          {/* 2. Hari Ini */}
          <div
            onClick={() => setScheduleSubFilter('today')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              scheduleSubFilter === 'today'
                ? 'bg-sky-500/20 border-sky-500 shadow-lg shadow-sky-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-sky-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Hari Ini</span>
              <Calendar className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{scheduleMetrics.hariIni}</div>
            <div className="text-[10px] text-zinc-400 mt-1">{formatDateIndo(APP_TODAY)}</div>
          </div>

          {/* 3. Besok */}
          <div
            onClick={() => setScheduleSubFilter('tomorrow')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              scheduleSubFilter === 'tomorrow'
                ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-blue-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Besok</span>
              <CalendarDays className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{scheduleMetrics.besok}</div>
            <div className="text-[10px] text-zinc-400 mt-1">{formatDateIndo(tomorrowDate)}</div>
          </div>

          {/* 4. Minggu Ini */}
          <div
            onClick={() => setScheduleSubFilter('week')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              scheduleSubFilter === 'week'
                ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Minggu Ini</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{scheduleMetrics.mingguIni}</div>
            <div className="text-[10px] text-zinc-400 mt-1">7 Hari Berjalan</div>
          </div>

          {/* 5. Perlu Paraf / Belum Dikonfirmasi */}
          <div
            onClick={() => setScheduleSubFilter('unconfirmed')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              scheduleSubFilter === 'unconfirmed'
                ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Belum Paraf</span>
              <FileCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{scheduleMetrics.belumDikonfirmasi}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Paraf 3-Pihak Pending</div>
          </div>

          {/* 6. Total Sesi Selesai */}
          <div
            onClick={() => setScheduleSubFilter('all')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              scheduleSubFilter === 'all'
                ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Selesai / Total</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{scheduleMetrics.selesai}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Dari {schedules.length} Sesi Terjadwal</div>
          </div>
        </div>

        {/* Radar Jadwal Sub-Selector Tabs (PERSIS SEPERTI ALUR ANTRIAN PT) */}
        <div className="border-t border-zinc-800 pt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Filter className="w-3.5 h-3.5 text-orange-400" />
              <span>Alur Radar Jadwal (Schedule Pipeline):</span>
            </div>
            <div className="text-xs text-zinc-500">
              Pilih tab jadwal di bawah untuk menyaring sesi dan menyelesaikan konflik jadwal pelatih
            </div>
          </div>

          {/* Sub-Pills (styled identically to PT Queue Selector Tabs) */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setScheduleSubFilter('clash')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                scheduleSubFilter === 'clash'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-black'
                  : scheduleMetrics.bentrok > 0
                  ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/60 border border-rose-500/50 animate-pulse'
                  : 'bg-zinc-800/80 text-rose-300 hover:bg-zinc-800 border border-rose-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${scheduleMetrics.bentrok > 0 ? 'bg-rose-400 animate-ping' : 'bg-rose-400'}`}></span>
              🚨 Terdeteksi Bentrok ({scheduleMetrics.bentrok})
            </button>

            <button
              type="button"
              onClick={() => setScheduleSubFilter('today')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                scheduleSubFilter === 'today'
                  ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20 font-black'
                  : 'bg-zinc-800/80 text-sky-300 hover:bg-zinc-800 border border-sky-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              📅 Sesi Hari Ini ({scheduleMetrics.hariIni})
            </button>

            <button
              type="button"
              onClick={() => setScheduleSubFilter('tomorrow')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                scheduleSubFilter === 'tomorrow'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 font-black'
                  : 'bg-zinc-800/80 text-blue-300 hover:bg-zinc-800 border border-blue-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              🗓️ Besok ({scheduleMetrics.besok})
            </button>

            <button
              type="button"
              onClick={() => setScheduleSubFilter('week')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                scheduleSubFilter === 'week'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20 font-black'
                  : 'bg-zinc-800/80 text-purple-300 hover:bg-zinc-800 border border-purple-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              📆 Minggu Ini ({scheduleMetrics.mingguIni})
            </button>

            <button
              type="button"
              onClick={() => setScheduleSubFilter('unconfirmed')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                scheduleSubFilter === 'unconfirmed'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-zinc-800/80 text-amber-300 hover:bg-zinc-800 border border-amber-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              ✍️ Belum Validasi Paraf ({scheduleMetrics.belumDikonfirmasi})
            </button>

            <button
              type="button"
              onClick={() => setScheduleSubFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                scheduleSubFilter === 'all'
                  ? 'bg-zinc-200 text-zinc-950 shadow-md font-black'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
              📋 Semua Jadwal ({schedules.length})
            </button>
          </div>

          {/* Quick Filter & Search Bar */}
          <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-orange-400" /> Filter Pelatih:
              </span>
              <select
                value={scheduleTrainerFilter}
                onChange={(e) => setScheduleTrainerFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Semua Coach ({trainers.length})</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.name}>
                    Coach {t.name}
                  </option>
                ))}
              </select>

              {(scheduleTrainerFilter !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setScheduleTrainerFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700 flex items-center gap-1 transition cursor-pointer"
                >
                  Reset Filter &times;
                </button>
              )}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari member, coach, jam, catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          {/* BENTROK RESOLUTION ALERT BOX (If clash detected) */}
          {scheduleMetrics.bentrok > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/40 border-2 border-rose-500/60 shadow-lg space-y-3 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>PERINGATAN: Terdeteksi {scheduleMetrics.bentrok} Sesi Bertabrakan!</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold uppercase">
                        Konflik Aktif
                      </span>
                    </h4>
                    <p className="text-xs text-rose-200/90 mt-0.5">
                      Pelatih tidak dapat melatih lebih dari 1 member pada slot jam yang sama. Segera alihkan salah satu jadwal untuk mencegah komplain member.
                    </p>
                  </div>
                </div>

                {scheduleMetrics.bentrokDetails[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      const group = scheduleMetrics.bentrokDetails[0];
                      setResolvingClash(group);
                      setRescheduleTarget(group.schedules[0]);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Selesaikan Bentrok Sekarang</span>
                  </button>
                )}
              </div>

              {/* List of clashing groups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-rose-900/50">
                {scheduleMetrics.bentrokDetails.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-3 rounded-lg bg-zinc-950/80 border border-rose-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="text-orange-400">Coach {group.trainer}</span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-rose-300 font-mono">{group.time} WIB</span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-zinc-300">{formatDateIndo(group.date)}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Tabrakan antara: <strong className="text-white">{group.schedules.map((s) => s.memberName).join(' & ')}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResolvingClash(group);
                        setRescheduleTarget(group.schedules[0]);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-bold shrink-0 transition cursor-pointer"
                    >
                      Pindah Jam
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEDICATED SCHEDULE TABLE (Rapi, Simpel, Sesuai Gaya Antrian PT) */}
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Waktu & Tanggal</th>
                  <th className="px-4 py-3.5">Member & Kontak</th>
                  <th className="px-4 py-3.5">Personal Trainer</th>
                  <th className="px-4 py-3.5">Status Sesi</th>
                  <th className="px-4 py-3.5">Validasi 3 Pihak</th>
                  <th className="px-4 py-3.5">Catatan Latihan</th>
                  <th className="px-4 py-3.5 text-right">Tindakan Leader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {displayedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                      <div className="max-w-sm mx-auto space-y-3">
                        <CalendarDays className="w-10 h-10 text-zinc-600 mx-auto" />
                        <p className="font-bold text-sm text-zinc-300">
                          {scheduleSubFilter === 'clash'
                            ? 'Luar biasa! Tidak ada jadwal yang bentrok saat ini.'
                            : 'Tidak ada jadwal yang cocok dengan filter yang dipilih.'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {scheduleSubFilter === 'clash'
                            ? 'Seluruh jadwal sesi Personal Trainer berjalan harmonis tanpa tabrakan waktu.'
                            : 'Coba ubah filter pelatih atau buat jadwal baru untuk member.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickMemberId('');
                            setQuickTrainer(trainers[0]?.name || '');
                            setQuickDate(APP_TODAY);
                            setQuickTime('09:00');
                            setIsQuickAddOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold hover:bg-orange-500/30 transition cursor-pointer"
                        >
                          + Tambah Jadwal Baru
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedSchedules.map((sch) => {
                    const isClashing = scheduleMetrics.bentrokSchedules.some((x) => x.id === sch.id);
                    const matchedMem = members.find((m) => m.id === sch.memberId);
                    const memberPhone = matchedMem?.phone || '';
                    const cleanPhone = memberPhone.replace(/^0/, '62').replace(/\D/g, '');

                    return (
                      <tr
                        key={sch.id}
                        className={`hover:bg-zinc-800/30 transition ${
                          isClashing ? 'bg-rose-950/30 border-l-4 border-l-rose-500' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-orange-400 font-mono font-bold text-xs">
                              {sch.time}
                            </span>
                            <div>
                              <div className="font-semibold text-white">{formatDateIndo(sch.date)}</div>
                              <div className="text-[10px] text-zinc-500">
                                {sch.date === APP_TODAY ? 'Hari Ini' : sch.date === tomorrowDate ? 'Besok' : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={matchedMem?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                              alt={sch.memberName}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {sch.memberName}
                              </div>
                              {memberPhone && (
                                <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-zinc-500" />
                                  <span>{memberPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-200">Coach {sch.trainer}</span>
                            {isClashing && (
                              <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-black animate-pulse">
                                BENTROK!
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              sch.status === 'Selesai'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : sch.status === 'Menunggu'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : sch.status === 'Reschedule'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : sch.status === 'No-Show'
                                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {sch.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickValidateSignature(sch, 'valStaf')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                sch.valStaf
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'
                              }`}
                              title="Paraf Staf (Klik untuk validasi)"
                            >
                              Staf {sch.valStaf ? '✓' : '○'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickValidateSignature(sch, 'valTrainer')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                sch.valTrainer
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'
                              }`}
                              title="Paraf Trainer (Klik untuk validasi)"
                            >
                              Trainer {sch.valTrainer ? '✓' : '○'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickValidateSignature(sch, 'valMember')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                sch.valMember
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'
                              }`}
                              title="Paraf Member (Klik untuk validasi)"
                            >
                              Member {sch.valMember ? '✓' : '○'}
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-zinc-400 italic text-[11px] max-w-xs truncate">
                          {sch.note || '-'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isClashing && (
                              <button
                                type="button"
                                onClick={() => {
                                  const group = scheduleMetrics.bentrokDetails.find(
                                    (b) => b.trainer === sch.trainer && b.date === sch.date && b.time === sch.time
                                  );
                                  if (group) {
                                    setResolvingClash(group);
                                    setRescheduleTarget(sch);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black shadow-md shadow-rose-600/20 transition cursor-pointer"
                              >
                                Atasi Bentrok
                              </button>
                            )}

                            {sch.status === 'Menunggu' && (
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateSchedule({
                                    ...sch,
                                    status: 'Selesai',
                                    valStaf: true,
                                    valTrainer: true,
                                    valMember: true
                                  });
                                  showToast('Selesai', `Sesi ${sch.memberName} berhasil diverifikasi selesai.`, 'success');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition shadow-sm cursor-pointer"
                              >
                                Selesaikan
                              </button>
                            )}

                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Halo ${sch.memberName}, salam sehat dari GymPro. Mengingatkan sesi Personal Training Anda bersama Coach ${sch.trainer} pada ${formatDateIndo(sch.date)} pk ${sch.time} WIB. Sampai jumpa di gym!`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 transition shadow-sm"
                                title="Kirim Pengingat Jadwal via WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" /> WA
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* 4. TAB VIEW: ANALITIK & RINGKASAN PERFORMA */}
      {mainTab === 'analitik' && (
      <div className="space-y-6">
      {/* FOUR KPI HUBS WITH MATHEMATICAL HIERARCHY */}

      {/* HUB 1: MEMBER PT (9 METRICS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              1. Health & Retensi Member PT ({memberPTList.length} Total)
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Klik kartu untuk filter daftar member</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          {/* 1. Total Member PT Aktif */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('all');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-orange-500/50 ${
              selectedCohortFilter === 'all' && activeTableTab === 'members'
                ? 'bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Total Member Aktif</div>
            <div className="text-2xl font-black text-white mt-1">{memberMetrics.totalAktif}</div>
            <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Kuota / Aktif
            </div>
          </div>

          {/* 2. Member PT Baru */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('baru');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-violet-500/50 ${
              selectedCohortFilter === 'baru' && activeTableTab === 'members'
                ? 'bg-violet-500/10 border-violet-500 shadow-md shadow-violet-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Member PT Baru</div>
            <div className="text-2xl font-black text-violet-400 mt-1">{memberMetrics.baru}</div>
            <div className="text-[10px] text-violet-300 font-semibold mt-1">Gabung 30H</div>
          </div>

          {/* 3. Member PT Akan Expired */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('akan-expired');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-amber-500/50 ${
              selectedCohortFilter === 'akan-expired' && activeTableTab === 'members'
                ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Akan Expired</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{memberMetrics.akanExpired}</div>
            <div className="text-[10px] text-amber-300 font-semibold mt-1">H-7 Expired</div>
          </div>

          {/* 4. Member PT Expired */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('expired');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-rose-500/50 ${
              selectedCohortFilter === 'expired' && activeTableTab === 'members'
                ? 'bg-rose-500/10 border-rose-500 shadow-md shadow-rose-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Member Expired</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{memberMetrics.expired}</div>
            <div className="text-[10px] text-rose-400/80 font-semibold mt-1">Perlu Renewal</div>
          </div>

          {/* 5. Member dengan sesi hampir habis */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('hampir-habis');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-amber-500/50 ${
              selectedCohortFilter === 'hampir-habis' && activeTableTab === 'members'
                ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Sesi Hampir Habis</div>
            <div className="text-2xl font-black text-amber-300 mt-1">{memberMetrics.sesiHampirHabis}</div>
            <div className="text-[10px] text-amber-400 font-bold mt-1">Sisa 1–2 Sesi</div>
          </div>

          {/* 6. Member dengan sesi habis */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('habis');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-rose-500/50 ${
              selectedCohortFilter === 'habis' && activeTableTab === 'members'
                ? 'bg-rose-500/10 border-rose-500 shadow-md shadow-rose-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Sesi Habis</div>
            <div className="text-2xl font-black text-rose-300 mt-1">{memberMetrics.sesiHabis}</div>
            <div className="text-[10px] text-rose-400 font-bold mt-1">Sisa 0 Sesi</div>
          </div>

          {/* 7. Member belum memiliki jadwal */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('belum-jadwal');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-orange-500/50 ${
              selectedCohortFilter === 'belum-jadwal' && activeTableTab === 'members'
                ? 'bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Belum Ada Jadwal</div>
            <div className="text-2xl font-black text-orange-400 mt-1">{memberMetrics.belumPunyaJadwal}</div>
            <div className="text-[10px] text-orange-300 font-semibold mt-1">Ada Kuota Sesi</div>
          </div>

          {/* 8. Member tidak latihan > 7 hari */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('tidak-latihan-7');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-yellow-500/50 ${
              selectedCohortFilter === 'tidak-latihan-7' && activeTableTab === 'members'
                ? 'bg-yellow-500/10 border-yellow-500 shadow-md shadow-yellow-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Tidak Hadir &gt; 7H</div>
            <div className="text-2xl font-black text-yellow-400 mt-1">{memberMetrics.tidakLatihan7H}</div>
            <div className="text-[10px] text-yellow-300/80 font-semibold mt-1">8–14 Hari Pasif</div>
          </div>

          {/* 9. Member tidak latihan > 14 hari */}
          <div
            onClick={() => {
              setActiveTableTab('members');
              setSelectedCohortFilter('tidak-latihan-14');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-red-500/50 ${
              selectedCohortFilter === 'tidak-latihan-14' && activeTableTab === 'members'
                ? 'bg-red-500/10 border-red-500 shadow-md shadow-red-500/10'
                : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Tidak Hadir &gt; 14H</div>
            <div className="text-2xl font-black text-red-500 mt-1">{memberMetrics.tidakLatihan14H}</div>
            <div className="text-[10px] text-red-400 font-black mt-1 flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" /> Resiko Churn
            </div>
          </div>
        </div>
      </div>

      {/* HUB 2: TRAINER & KAPASITAS (8 METRICS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              2. Kinerja & Kapasitas Personal Trainer ({trainers.length} Trainer)
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Roster, jam kerja, dan beban member binaan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 10. Total Trainer Aktif */}
          <div
            onClick={() => {
              setActiveTableTab('trainers');
              setSelectedCohortFilter('all-trainers');
            }}
            className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-emerald-500/50 cursor-pointer transition"
          >
            <div className="text-[11px] font-semibold text-zinc-400">Total Trainer</div>
            <div className="text-2xl font-black text-white mt-1">{trainerMetrics.total}</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">Staf PT Terdaftar</div>
          </div>

          {/* 11. Trainer sedang aktif */}
          <div
            onClick={() => {
              setActiveTableTab('trainers');
              setSelectedCohortFilter('trainer-aktif');
            }}
            className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500 cursor-pointer transition"
          >
            <div className="text-[11px] font-semibold text-emerald-300">Sedang Aktif</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{trainerMetrics.sedangAktif}</div>
            <div className="text-[10px] text-emerald-300/80 font-bold mt-1">Clock-in / Ada Sesi</div>
          </div>

          {/* 12. Trainer sedang libur */}
          <div
            onClick={() => {
              setActiveTableTab('trainers');
              setSelectedCohortFilter('trainer-libur');
            }}
            className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition"
          >
            <div className="text-[11px] font-semibold text-zinc-400">Sedang Libur</div>
            <div className="text-2xl font-black text-zinc-400 mt-1">{trainerMetrics.sedangLibur}</div>
            <div className="text-[10px] text-zinc-500 font-semibold mt-1">Day Off / Cuti</div>
          </div>

          {/* 13. Trainer dengan jadwal penuh */}
          <div
            onClick={() => {
              setActiveTableTab('trainers');
              setSelectedCohortFilter('trainer-penuh');
            }}
            className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500 cursor-pointer transition"
          >
            <div className="text-[11px] font-semibold text-amber-300">Jadwal Penuh</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{trainerMetrics.jadwalPenuhCount}</div>
            <div className="text-[10px] text-amber-300/80 font-semibold mt-1">&ge; 3 Sesi Hari Ini</div>
          </div>

          {/* 14. Trainer dengan jadwal kosong */}
          <div
            onClick={() => {
              setActiveTableTab('trainers');
              setSelectedCohortFilter('trainer-kosong');
            }}
            className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 hover:border-sky-500 cursor-pointer transition"
          >
            <div className="text-[11px] font-semibold text-sky-300">Jadwal Kosong</div>
            <div className="text-2xl font-black text-sky-400 mt-1">{trainerMetrics.jadwalKosongCount}</div>
            <div className="text-[10px] text-sky-300/80 font-semibold mt-1">Bisa Terima Member</div>
          </div>

          {/* 15. Trainer dengan member terbanyak */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition">
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Member Terbanyak</div>
            <div className="text-base font-black text-white mt-1 truncate">
              {trainerMetrics.trainerMemberTerbanyak?.name.split(' ')[0] || '-'}
            </div>
            <div className="text-[10px] text-orange-400 font-bold mt-1">
              {trainerMetrics.trainerMemberTerbanyak?.memberCount || 0} Member Binaan
            </div>
          </div>

          {/* 16. Trainer dengan sesi latihan terbanyak */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition">
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Sesi Terbanyak (Selesai)</div>
            <div className="text-base font-black text-emerald-400 mt-1 truncate">
              {trainerMetrics.trainerSesiTerbanyak?.name.split(' ')[0] || '-'}
            </div>
            <div className="text-[10px] text-emerald-300 font-bold mt-1">
              {trainerMetrics.trainerSesiTerbanyak?.completedSessions || 0} Sesi Selesai
            </div>
          </div>

          {/* 17. Trainer dengan sesi tersisa paling banyak */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition">
            <div className="text-[11px] font-semibold text-zinc-400 line-clamp-1">Sesi Tersisa Terbesar</div>
            <div className="text-base font-black text-sky-400 mt-1 truncate">
              {trainerMetrics.trainerSesiTersisaPalingBanyak?.name.split(' ')[0] || '-'}
            </div>
            <div className="text-[10px] text-sky-300 font-bold mt-1">
              {trainerMetrics.trainerSesiTersisaPalingBanyak?.totalSesiTersisa || 0} Sisa Kuota
            </div>
          </div>
        </div>
      </div>

      {/* HUB 3 & 4: JADWAL & SESI (7 METRICS EACH) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HUB 3: JADWAL KONTROL (7 METRICS) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                3. Jadwal & Kontrol Sesi
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Hari ini: {formatDateIndo(APP_TODAY)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 18. Jadwal hari ini */}
            <div
              onClick={() => {
                setActiveTableTab('schedules');
                setSelectedCohortFilter('jadwal-hari-ini');
              }}
              className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-sky-500 cursor-pointer transition"
            >
              <div className="text-[11px] text-zinc-400">Jadwal Hari Ini</div>
              <div className="text-xl font-black text-white mt-0.5">{scheduleMetrics.hariIni}</div>
              <div className="text-[10px] text-sky-400 font-medium mt-0.5">Sesi Terjadwal</div>
            </div>

            {/* 19. Jadwal besok */}
            <div
              onClick={() => {
                setActiveTableTab('schedules');
                setSelectedCohortFilter('jadwal-besok');
              }}
              className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-sky-500 cursor-pointer transition"
            >
              <div className="text-[11px] text-zinc-400">Jadwal Besok</div>
              <div className="text-xl font-black text-zinc-300 mt-0.5">{scheduleMetrics.besok}</div>
              <div className="text-[10px] text-zinc-400 font-medium mt-0.5">Besok ({formatDateIndo(tomorrowDate).slice(0, 6)})</div>
            </div>

            {/* 20. Jadwal minggu ini */}
            <div
              onClick={() => {
                setActiveTableTab('schedules');
                setSelectedCohortFilter('jadwal-minggu-ini');
              }}
              className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-sky-500 cursor-pointer transition"
            >
              <div className="text-[11px] text-zinc-400">Jadwal Minggu Ini</div>
              <div className="text-xl font-black text-zinc-300 mt-0.5">{scheduleMetrics.mingguIni}</div>
              <div className="text-[10px] text-zinc-400 font-medium mt-0.5">Senin - Minggu</div>
            </div>

            {/* 21. Jadwal bentrok */}
            <div
              onClick={() => {
                setActiveTableTab('schedules');
                setSelectedCohortFilter('jadwal-bentrok');
              }}
              className={`p-3 rounded-xl border cursor-pointer transition ${
                scheduleMetrics.bentrok > 0
                  ? 'bg-rose-950/40 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="text-[11px] font-semibold">Jadwal Bentrok</div>
              <div className={`text-xl font-black mt-0.5 ${scheduleMetrics.bentrok > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {scheduleMetrics.bentrok}
              </div>
              <div className="text-[10px] font-bold mt-0.5">
                {scheduleMetrics.bentrok > 0 ? 'Perlu Disesuaikan!' : 'Aman (0 bentrok)'}
              </div>
            </div>

            {/* 22. Jadwal belum dikonfirmasi */}
            <div
              onClick={() => {
                setActiveTableTab('schedules');
                setSelectedCohortFilter('jadwal-belum-konfirmasi');
              }}
              className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500 cursor-pointer transition"
            >
              <div className="text-[11px] text-amber-300">Belum Konfirmasi</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{scheduleMetrics.belumDikonfirmasi}</div>
              <div className="text-[10px] text-amber-400/80 font-medium mt-0.5">Menunggu / Paraf</div>
            </div>

            {/* 23. Jadwal dibatalkan */}
            <div
              onClick={() => {
                setActiveTableTab('schedules');
                setSelectedCohortFilter('jadwal-batal');
              }}
              className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-500 cursor-pointer transition"
            >
              <div className="text-[11px] text-rose-300">Jadwal Dibatalkan</div>
              <div className="text-xl font-black text-rose-400 mt-0.5">{scheduleMetrics.dibatalkan}</div>
              <div className="text-[10px] text-rose-400/80 font-medium mt-0.5">Status Batal</div>
            </div>

            {/* 24. Jadwal selesai */}
            <div
              onClick={() => {
                setActiveTableTab('schedules');
                setSelectedCohortFilter('jadwal-selesai');
              }}
              className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500 cursor-pointer transition sm:col-span-2"
            >
              <div className="text-[11px] text-emerald-300">Jadwal Selesai Terverifikasi</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{scheduleMetrics.selesai}</div>
              <div className="text-[10px] text-emerald-300/80 font-medium mt-0.5">Paraf 3 Pihak Lengkap</div>
            </div>
          </div>
        </div>

        {/* HUB 4: SESI & UTILISASI BULANAN (7 METRICS) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                4. Utilisasi & Burn Rate Sesi
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Periode September 2026</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 25. Total sesi bulan ini */}
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <div className="text-[11px] text-zinc-400">Total Sesi Bulan Ini</div>
              <div className="text-xl font-black text-white mt-0.5">{sessionMetrics.totalBulanIni}</div>
              <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Aktivitas PT</div>
            </div>

            {/* 26. Sesi digunakan */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="text-[11px] text-emerald-300">Sesi Digunakan</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{sessionMetrics.sesiDigunakan}</div>
              <div className="text-[10px] text-emerald-300/80 font-medium mt-0.5">Selesai Dijalankan</div>
            </div>

            {/* 27. Sesi tersisa */}
            <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30">
              <div className="text-[11px] text-sky-300">Sesi Tersisa</div>
              <div className="text-xl font-black text-sky-400 mt-0.5">{sessionMetrics.sesiTersisa}</div>
              <div className="text-[10px] text-sky-300/80 font-medium mt-0.5">Sisa Kuota Member</div>
            </div>

            {/* 28. Sesi hangus */}
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
              <div className="text-[11px] text-purple-300">Sesi Hangus</div>
              <div className="text-xl font-black text-purple-400 mt-0.5">{sessionMetrics.sesiHangus}</div>
              <div className="text-[10px] text-purple-300/80 font-medium mt-0.5">Expired Otomatis</div>
            </div>

            {/* 29. Sesi reschedule */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <div className="text-[11px] text-amber-300">Sesi Reschedule</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{sessionMetrics.sesiReschedule}</div>
              <div className="text-[10px] text-amber-300/80 font-medium mt-0.5">Perubahan Jadwal</div>
            </div>

            {/* 30. Sesi cancelled */}
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <div className="text-[11px] text-rose-300">Sesi Cancelled</div>
              <div className="text-xl font-black text-rose-400 mt-0.5">{sessionMetrics.sesiCancelled}</div>
              <div className="text-[10px] text-rose-300/80 font-medium mt-0.5">Dibatalkan Member/PT</div>
            </div>

            {/* 31. Sesi no-show */}
            <div className="p-3 rounded-xl bg-pink-950/20 border border-pink-500/30 sm:col-span-2">
              <div className="text-[11px] text-pink-300">Sesi No-Show</div>
              <div className="text-xl font-black text-pink-400 mt-0.5">{sessionMetrics.sesiNoShow}</div>
              <div className="text-[10px] text-pink-300/80 font-medium mt-0.5">Tanpa Pemberitahuan</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISUAL CHARTS (RECHARTS) */}
      <div className="space-y-6">
        {/* NEW COMPONENT: Perbandingan Total Komisi Setiap Trainer per Periode Bulan (Pie Chart Recharts) */}
        <TrainerCommissionPieChart
          trainers={trainers}
          trainerCommissions={trainerCommissions}
          schedules={schedules}
          onSelectTrainer={(trainerId) => {
            setActiveTableTab('trainers');
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: 7-Day Schedule Trend */}
          <div className="lg:col-span-2 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                Tren Distribusi Jadwal Harian (7 Hari)
              </h4>
              <span className="text-[11px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-700">
                Selesai vs Menunggu vs Batal/No-show
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Visualisasi beban harian untuk memastikan distribusi latihan tidak menumpuk pada jam atau hari tertentu.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" stroke="#a1a1aa" fontSize={11} />
                <YAxis stroke="#a1a1aa" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Selesai" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Menunggu" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Reschedule" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="BatalNoShow" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Batal/No-show" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Session Breakdown Pie */}
        <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Komposisi Status Sesi PT
              </h4>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Perbandingan sesi terpakai vs sisa kuota vs churn sesi.
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sessionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sessionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '0.75rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-zinc-800">
            {sessionPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-zinc-400 truncate">{item.name}:</span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
    )}

      {/* 5. INTERACTIVE OPERATIONAL TABLE WITH TABS (Kapasitas Pelatih & Retensi Member) */}
      {(mainTab === 'pelatih' || mainTab === 'retensi') && (
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/60">
              <button
                onClick={() => {
                  setActiveTableTab('members');
                  setSelectedCohortFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTableTab === 'members'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Member PT ({filteredMembers.length})
              </button>

              <button
                onClick={() => {
                  setActiveTableTab('new_packages');
                  setSelectedCohortFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTableTab === 'new_packages'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Paket PT & Bundling Baru ({filteredNewPackages.length})</span>
                {unassignedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {unassignedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTableTab('schedules');
                  setSelectedCohortFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTableTab === 'schedules'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Roster Jadwal ({filteredSchedules.length})
              </button>

              <button
                onClick={() => {
                  setActiveTableTab('trainers');
                  setSelectedCohortFilter('all-trainers');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTableTab === 'trainers'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                Roster Trainer ({trainerMetrics.trainerStats.length})
              </button>
            </div>

            {selectedCohortFilter !== 'all' && selectedCohortFilter !== 'all-trainers' && (
              <button
                onClick={() => setSelectedCohortFilter(activeTableTab === 'trainers' ? 'all-trainers' : 'all')}
                className="text-[11px] text-zinc-400 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700 flex items-center gap-1 transition"
              >
                Reset Filter ({selectedCohortFilter}) &times;
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, telp, trainer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>
        </div>

        {/* SUB-FILTER BAR FOR NEW PACKAGES */}
        {activeTableTab === 'new_packages' && (
          <div className="px-5 py-2.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Filter Paket:</span>
            <button
              onClick={() => setSelectedCohortFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                selectedCohortFilter === 'all'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua ({newPackagePurchases.length})
            </button>
            <button
              onClick={() => setSelectedCohortFilter('unassigned')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1 ${
                selectedCohortFilter === 'unassigned'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Belum Ditugaskan ({unassignedCount})
            </button>
            <button
              onClick={() => setSelectedCohortFilter('assigned')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                selectedCohortFilter === 'assigned'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sudah Ditugaskan ({newPackagePurchases.length - unassignedCount})
            </button>
            <button
              onClick={() => setSelectedCohortFilter('bundling')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                selectedCohortFilter === 'bundling'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Paket Bundling
            </button>
            <button
              onClick={() => setSelectedCohortFilter('pt')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                selectedCohortFilter === 'pt'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Paket PT Murni
            </button>
          </div>
        )}

        {/* TAB 0.5: DAFTAR MEMBER BARU BELI PAKET PT & BUNDLING */}
        {activeTableTab === 'new_packages' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3">Member & Kontak</th>
                  <th className="px-4 py-3">Paket Pembelian</th>
                  <th className="px-4 py-3">Kuota Sesi</th>
                  <th className="px-4 py-3">Tgl Beli</th>
                  <th className="px-4 py-3">Status Penugasan Trainer</th>
                  <th className="px-4 py-3">Catatan / Sasaran</th>
                  <th className="px-4 py-3 text-right">Tindakan Leader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredNewPackages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Package className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p className="font-semibold text-zinc-400">Tidak ada paket yang cocok dengan filter saat ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNewPackages.map((pkg, idx) => {
                    const matchedMem = members.find((m) => m.id === pkg.memberId);
                    return (
                      <tr key={pkg.purchaseId || idx} className="hover:bg-zinc-800/30 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={pkg.memberPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                              alt={pkg.memberName}
                              className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {pkg.memberName}
                                {pkg.purchaseDate >= '2026-08-25' && (
                                  <span className="text-[9px] bg-violet-500/20 text-violet-400 border border-violet-500/30 px-1.5 py-0.2 rounded font-extrabold">
                                    BARU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-zinc-500" />
                                <span>{pkg.memberPhone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                pkg.packageType === 'BUNDLING'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {pkg.packageType === 'BUNDLING' ? <Layers className="w-3 h-3" /> : <Dumbbell className="w-3 h-3" />}
                              {pkg.packageType === 'BUNDLING' ? 'Paket Bundling' : 'Paket PT'}
                            </span>
                            <div className="font-bold text-white text-xs">{pkg.packageName}</div>
                            {pkg.price > 0 && (
                              <div className="text-[11px] font-mono text-zinc-400">{formatRp(pkg.price)}</div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {pkg.sessions} Sesi
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-zinc-300 font-medium">
                          {formatDateIndo(pkg.purchaseDate)}
                        </td>

                        <td className="px-4 py-3.5">
                          {pkg.isAssigned ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Coach {pkg.currentTrainerName}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Belum Ditugaskan</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-zinc-400 text-xs max-w-xs truncate">
                          {pkg.notes || '-'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(pkg)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 shadow-sm cursor-pointer ${
                                !pkg.isAssigned
                                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95'
                              }`}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{pkg.isAssigned ? 'Ganti Trainer' : 'Tugaskan Trainer'}</span>
                            </button>

                            {matchedMem && onOpenMemberDetail && (
                              <button
                                type="button"
                                onClick={() => onOpenMemberDetail(matchedMem)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
                                title="Detail Member 360"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 1: MEMBERS TABLE */}
        {activeTableTab === 'members' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-4 py-3">Pelatih (PIC)</th>
                  <th className="px-4 py-3">Sisa Kuota</th>
                  <th className="px-4 py-3">Latihan Terakhir</th>
                  <th className="px-4 py-3">Status Expired</th>
                  <th className="px-4 py-3">Status Retensi</th>
                  <th className="px-4 py-3 text-right">Tindakan Leader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                      Tidak ada member yang cocok dengan kriteria filter saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => {
                    const lastInfo = memberLastTrainingMap.get(m.id);
                    const daysAgo = lastInfo?.daysAgo ?? 99;
                    const isAkanExpired = getDayDiff(m.expired, APP_TODAY) <= 7 && getDayDiff(m.expired, APP_TODAY) >= 0;
                    const isExpired = m.expired < APP_TODAY;
                    const isHampirHabis = m.ptQuota > 0 && m.ptQuota <= 2;
                    const isHabis = (m.ptQuota || 0) === 0;

                    return (
                      <tr key={m.id} className="hover:bg-zinc-800/30 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={m.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                              alt={m.name}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {m.name}
                                {m.joinDate && m.joinDate >= '2026-08-20' && (
                                  <span className="text-[9px] bg-violet-500/20 text-violet-400 border border-violet-500/30 px-1.5 py-0.2 rounded font-extrabold">
                                    BARU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400">{m.phone}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-semibold text-zinc-200">{m.picName || 'Belum Ditugaskan'}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                              isHabis
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : isHampirHabis
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {m.ptQuota} Sesi
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-zinc-200">{formatDateIndo(lastInfo?.lastDate || '')}</div>
                            <div
                              className={`text-[10px] font-semibold ${
                                daysAgo > 14
                                  ? 'text-red-400 font-bold'
                                  : daysAgo > 7
                                  ? 'text-yellow-400 font-bold'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {daysAgo === 0 ? 'Hari ini' : `${daysAgo} hari yang lalu`}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div>
                            <div className="text-zinc-200">{formatDateIndo(m.expired)}</div>
                            {isExpired ? (
                              <span className="text-[10px] text-rose-400 font-bold">Expired</span>
                            ) : isAkanExpired ? (
                              <span className="text-[10px] text-amber-400 font-bold">H-{getDayDiff(m.expired, APP_TODAY)}</span>
                            ) : (
                              <span className="text-[10px] text-emerald-400">Aktif</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {daysAgo > 14 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black">
                              <AlertTriangle className="w-2.5 h-2.5" /> Dropout Alert &gt;14H
                            </span>
                          ) : daysAgo > 7 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
                              Pasif &gt;7 Hari
                            </span>
                          ) : isHabis ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                              Sesi Habis
                            </span>
                          ) : isHampirHabis ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                              Hampir Habis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                              Rutin
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://wa.me/${m.phone.replace(/^0/, '62')}?text=${encodeURIComponent(
                                `Halo ${m.name}, salam sehat dari GymPro. Kami ingin menanyakan rencana jadwal sesi latihan Personal Trainer Anda selanjutnya. Ada waktu luang minggu ini?`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition"
                              title="Hubungi WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" /> WA
                            </a>

                            <button
                              onClick={() => {
                                setQuickMemberId(m.id);
                                setQuickTrainer(m.picName || trainers[0]?.name || '');
                                setIsQuickAddOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 border border-zinc-700 text-[11px] font-bold transition"
                            >
                              + Jadwal
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: SCHEDULES TABLE */}
        {activeTableTab === 'schedules' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3">Waktu & Tanggal</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Trainer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Validasi 3 Pihak</th>
                  <th className="px-4 py-3">Catatan / Keterangan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                      Tidak ada jadwal yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((sch) => {
                    // Check if this schedule is part of a clash
                    const isClashing = scheduleMetrics.bentrokSchedules.some((x) => x.id === sch.id);

                    return (
                      <tr
                        key={sch.id}
                        className={`hover:bg-zinc-800/30 transition ${
                          isClashing ? 'bg-rose-950/30 border-l-4 border-l-rose-500' : ''
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-orange-400 font-mono font-bold text-xs">
                              {sch.time}
                            </span>
                            <span className="font-semibold text-white">{formatDateIndo(sch.date)}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-bold text-zinc-100">
                          {sch.memberName}
                        </td>

                        <td className="px-4 py-3 font-semibold text-zinc-300">
                          {sch.trainer}
                          {isClashing && (
                            <span className="ml-2 text-[9px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-black">
                              BENTROK
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              sch.status === 'Selesai'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : sch.status === 'Menunggu'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : sch.status === 'Reschedule'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : sch.status === 'No-Show'
                                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {sch.status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleQuickValidateSignature(sch, 'valStaf')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                sch.valStaf
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'
                              }`}
                              title="Paraf Staf"
                            >
                              Staf {sch.valStaf ? '✓' : '○'}
                            </button>
                            <button
                              onClick={() => handleQuickValidateSignature(sch, 'valTrainer')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                sch.valTrainer
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'
                              }`}
                              title="Paraf Trainer"
                            >
                              Trainer {sch.valTrainer ? '✓' : '○'}
                            </button>
                            <button
                              onClick={() => handleQuickValidateSignature(sch, 'valMember')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                sch.valMember
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'
                              }`}
                              title="Paraf Member"
                            >
                              Member {sch.valMember ? '✓' : '○'}
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-zinc-400 italic text-[11px]">
                          {sch.note || '-'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isClashing && (
                              <button
                                onClick={() => {
                                  const group = scheduleMetrics.bentrokDetails.find(
                                    (b) => b.trainer === sch.trainer && b.date === sch.date && b.time === sch.time
                                  );
                                  if (group) {
                                    setResolvingClash(group);
                                    setRescheduleTarget(sch);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold shadow"
                              >
                                Atasi Bentrok
                              </button>
                            )}

                            {sch.status === 'Menunggu' && (
                              <button
                                onClick={() => {
                                  onUpdateSchedule({
                                    ...sch,
                                    status: 'Selesai',
                                    valStaf: true,
                                    valTrainer: true,
                                    valMember: true
                                  });
                                  showToast('Selesai', `Sesi ${sch.memberName} berhasil diverifikasi selesai.`, 'success');
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-bold"
                              >
                                Selesaikan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: TRAINER ROSTER & CAPACITY */}
        {activeTableTab === 'trainers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3">Trainer</th>
                  <th className="px-4 py-3">Status Hari Ini</th>
                  <th className="px-4 py-3">Jadwal Hari Ini</th>
                  <th className="px-4 py-3">Member Binaan</th>
                  <th className="px-4 py-3">Sesi Selesai (Bulan Ini)</th>
                  <th className="px-4 py-3">Total Kuota Tersisa</th>
                  <th className="px-4 py-3">Beban Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {trainerMetrics.trainerStats.map((t) => {
                  const isBusy = t.todayCount >= 3;
                  const isEmpty = t.todayCount === 0;

                  return (
                    <tr key={t.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'}
                            alt={t.name}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {t.name}
                              {t.role === 'leader_pt' && (
                                <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded font-black">
                                  LEADER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400">{t.roleName} • Shift {t.shift}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {t.isClockedIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Hadir di Gym
                          </span>
                        ) : t.todayCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Ada Jadwal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                            Day Off / Libur
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-sm">{t.todayCount} Sesi</div>
                        <div className="text-[10px] text-zinc-400">
                          {t.todayCount > 0 ? t.todaySchedules.map((s) => s.time).join(', ') : 'Tidak ada jadwal'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-orange-400 text-sm">{t.memberCount} Member</div>
                        <div className="text-[10px] text-zinc-400">Dalam bimbingan</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-emerald-400 text-sm">{t.completedSessions} Sesi</div>
                        <div className="text-[10px] text-zinc-400">Terverifikasi</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-sky-400 text-sm">{t.totalSesiTersisa} Kuota</div>
                        <div className="text-[10px] text-zinc-400">Belum dijalankan</div>
                      </td>

                      <td className="px-4 py-3">
                        {isBusy ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                            Jadwal Padat
                          </span>
                        ) : isEmpty ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            Tersedia (Kosong)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-medium">
                            Normal ({t.todayCount} sesi)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* 6. MODAL: RESOLVE CLASH / BENTROK */}
      {resolvingClash && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Selesaikan Jadwal Bentrok</h3>
              </div>
              <button
                onClick={() => setResolvingClash(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl space-y-1">
              <p className="text-xs text-rose-200 font-semibold">
                Pelatih <strong>{resolvingClash.trainer}</strong> memiliki {resolvingClash.schedules.length} sesi bersamaan pada:
              </p>
              <div className="text-xs font-bold text-white">
                {formatDateIndo(resolvingClash.date)} pk {resolvingClash.time}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">Pilih Member yang akan dialihkan jadwalnya:</label>
              <div className="space-y-2">
                {resolvingClash.schedules.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setRescheduleTarget(s)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                      rescheduleTarget?.id === s.id
                        ? 'bg-orange-500/20 border-orange-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{s.memberName}</div>
                      <div className="text-[11px] text-zinc-400">{s.note || 'Sesi PT reguler'}</div>
                    </div>
                    {rescheduleTarget?.id === s.id && (
                      <span className="text-xs bg-orange-500 text-white font-bold px-2 py-0.5 rounded-md">
                        Dipilih
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {rescheduleTarget && (
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Jam Baru</label>
                    <input
                      type="time"
                      value={newClashTime}
                      onChange={(e) => setNewClashTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Alihkan Pelatih (Opsional)</label>
                    <select
                      value={newClashTrainer || rescheduleTarget.trainer}
                      onChange={(e) => setNewClashTrainer(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    >
                      {trainers.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.roleName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResolvingClash(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleResolveClash}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30"
                  >
                    Simpan Perubahan Jadwal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ATURAN JAM & JADWAL KERJA TRAINER */}
      {mainTab === 'aturan_kerja' && (
        <LeaderPTTrainerWorkingRulesTab
          trainers={trainers}
          trainerWorkingRules={trainerWorkingRules || []}
          onSaveTrainerWorkingRule={onSaveTrainerWorkingRule || (() => {})}
          workSchedules={workSchedules || []}
          onSaveWorkSchedule={onSaveWorkSchedule || (() => {})}
          staffAttendances={staffAttendances || []}
          leaveRequests={leaveRequests || []}
          showToast={showToast}
        />
      )}

      {/* 7. MODAL: QUICK ADD SCHEDULE */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">Buat Jadwal Sesi PT Baru</h3>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleQuickAddSchedule} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">Pilih Member PT *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickMemberSearchTerm('');
                      setIsQuickMemberSearchOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                    title="Buka pencarian member PT"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari Member</span>
                  </button>
                </div>

                {selectedQuickAddMember ? (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={selectedQuickAddMember.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                          alt={selectedQuickAddMember.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0 border border-zinc-700"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{selectedQuickAddMember.name}</h4>
                          <p className="text-[10px] text-zinc-400 truncate">
                            ID: {selectedQuickAddMember.id} • 📞 {selectedQuickAddMember.phone || '-'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setQuickMemberId('')}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                        title="Hapus pilihan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-[11px]">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Sisa Kuota: {selectedQuickAddMember.ptQuota || 0} Sesi
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickMemberSearchTerm('');
                          setIsQuickMemberSearchOpen(true);
                        }}
                        className="text-orange-400 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3 h-3" />
                        <span>Ganti Member</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    required
                    value={quickMemberId}
                    onChange={(e) => {
                      setQuickMemberId(e.target.value);
                      const mem = members.find((m) => m.id === e.target.value);
                      if (mem?.picName) {
                        setQuickTrainer(mem.picName);
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="">-- Pilih Member --</option>
                    {memberPTList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Sisa Kuota: {m.ptQuota} sesi)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Personal Trainer *</label>
                <select
                  required
                  value={quickTrainer}
                  onChange={(e) => setQuickTrainer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Trainer --</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.roleName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Jam Sesi *</label>
                  <input
                    type="time"
                    required
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Trainer Duty Status Preview */}
              {quickTrainerDuty && (
                <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                  quickTrainerDuty.isAvailableForDate
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Status Pelatih:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      quickTrainerDuty.isAvailableForDate
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}>
                      {quickTrainerDuty.statusLabel}
                    </span>
                  </div>
                  {quickTrainerDuty.reason && (
                    <p className="text-[11px] text-zinc-300">{quickTrainerDuty.reason}</p>
                  )}
                  {quickTrainerDuty.isAvailableForDate && quickTrainerDuty.dutyStartTime && (
                    <p className="text-[10px] text-emerald-400/90">
                      Jam Kerja: {quickTrainerDuty.dutyStartTime} - {quickTrainerDuty.dutyEndTime} WIB
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Catatan Fokus Latihan</label>
                <input
                  type="text"
                  placeholder="Misal: Hypertrophy Leg day / Screening awal"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 placeholder-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(quickTrainerDuty && !quickTrainerDuty.isAvailableForDate)}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md ${
                    !quickTrainerDuty || quickTrainerDuty.isAvailableForDate
                      ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30 cursor-pointer active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                  }`}
                >
                  Jadwalkan Sesi PT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SEARCH MEMBER KHUSUS QUICK ADD LEADER PT */}
      {isQuickMemberSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 my-auto max-h-[90vh] flex flex-col space-y-4 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cari & Pilih Member PT</h3>
                  <p className="text-[11px] text-zinc-400">Temukan member berdasarkan nama, ID, atau nomor WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickMemberSearchOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={quickMemberSearchTerm}
                onChange={(e) => setQuickMemberSearchTerm(e.target.value)}
                placeholder="Ketik nama member, nomor ID (contoh: M001), atau no HP..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {quickMemberSearchTerm && (
                <button
                  type="button"
                  onClick={() => setQuickMemberSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition"
                  title="Hapus kata kunci"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-80 divide-y divide-zinc-800/40">
              {filteredQuickAddMembers.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Search className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-300">Member Tidak Ditemukan</p>
                  <p className="text-[11px] text-zinc-500">
                    Tidak ada member yang cocok dengan kata kunci "{quickMemberSearchTerm}".
                  </p>
                </div>
              ) : (
                filteredQuickAddMembers.map((m) => {
                  const isSelected = m.id === quickMemberId;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setQuickMemberId(m.id);
                        if (m.picName) {
                          setQuickTrainer(m.picName);
                        }
                        setIsQuickMemberSearchOpen(false);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500/40'
                          : 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={m.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                          alt={m.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white truncate">{m.name}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-orange-400 font-bold border border-zinc-700">
                              {m.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            📞 {m.phone || '-'} {m.picName ? `• PIC: ${m.picName}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Sisa Kuota: {m.ptQuota || 0} Sesi
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                          }`}
                        >
                          {isSelected ? 'Terpilih' : 'Pilih'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Menampilkan {filteredQuickAddMembers.length} dari {memberPTList.length} member PT</span>
              <button
                type="button"
                onClick={() => setIsQuickMemberSearchOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TUGASKAN TRAINER UNTUK MEMBER BARU BELI PAKET PT & BUNDLING */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Penugasan Personal Trainer</h3>
                  <p className="text-xs text-zinc-400">Tentukan pelatih dan instruksi latihan untuk member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 pt-4">
              {/* Member & Package Summary Card */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono uppercase">Member</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {assignModal.item.memberName}
                  </span>
                </div>

                {/* Multi-Participant Support for Couple / Trio */}
                {(assignModal.item.packageType === 'Couple' ||
                  assignModal.item.packageType === 'Trio' ||
                  (assignModal.item.members && assignModal.item.members.length > 1)) && (
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-orange-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Paket Multi-Peserta ({assignModal.item.packageType})
                      </span>
                      <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-bold">
                        1 Trainer untuk seluruh peserta
                      </span>
                    </div>
                    <div className="space-y-1 pt-0.5">
                      {assignModal.item.members?.map((pm: any, pidx: number) => (
                        <div
                          key={pm.id || pidx}
                          className="flex items-center justify-between text-xs text-zinc-200 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-zinc-800"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                            <span className="font-semibold">{pm.name}</span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400">{pm.phone || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono uppercase">Paket & Sesi</span>
                  <span className="text-xs font-bold text-orange-400">
                    {assignModal.item.packageName} • {assignModal.item.sessions} Sesi
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono uppercase">Status Pembayaran</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {assignModal.item.paymentStatus || 'LUNAS'} {assignModal.item.amountPaid ? `(${formatRp(assignModal.item.amountPaid)})` : ''}
                  </span>
                </div>
                {assignModal.item.picSalesName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-mono uppercase">PIC Sales Closing</span>
                    <span className="text-xs font-medium text-zinc-300">{assignModal.item.picSalesName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono uppercase">No. Telepon / WA</span>
                  <span className="text-xs font-mono text-zinc-300">{assignModal.item.memberPhone}</span>
                </div>
                {assignModal.item.currentTrainerName && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
                    <span className="text-zinc-400">Trainer Saat Ini</span>
                    <span className="font-bold text-emerald-400">{assignModal.item.currentTrainerName}</span>
                  </div>
                )}
              </div>

              {/* Select Trainer with Workload (User Spec #4) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-200">
                    Pilih Personal Trainer (Beban Kerja & Kapasitas) *
                  </label>
                  <span className="text-[10px] text-zinc-400">Pilih 1 pelatih yang bertugas</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {trainers.map((t) => {
                    const wl = trainerWorkloads.find((w) => w.trainer.id === t.id);
                    const isSelfTrainer = isTrainer && currentUser?.id === t.id;
                    const isSelected = assignModal.selectedTrainerId === t.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (isSelfTrainer) {
                            showToast(
                              'Aturan SOP',
                              'Trainer tidak diizinkan memilih dirinya sendiri untuk mendapatkan member. Penugasan harus melalui Leader PT.',
                              'error'
                            );
                            return;
                          }
                          setAssignModal({
                            ...assignModal,
                            selectedTrainerId: t.id,
                            selectedTrainerName: t.name
                          });
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 ring-2 ring-orange-500/30'
                            : isSelfTrainer
                            ? 'opacity-40 bg-zinc-950 border-zinc-800 cursor-not-allowed'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedTrainerModal"
                            disabled={isSelfTrainer}
                            checked={isSelected}
                            onChange={() => {}}
                            className="text-orange-500 focus:ring-0"
                          />
                          <img
                            src={(t as any).avatar || t.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                            alt={t.name}
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-2">
                              Coach {t.name}
                              {isSelfTrainer && (
                                <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                                  Akun Anda (Tidak Boleh Ambil Sendiri)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                              <span>
                                Active Member: <strong className="text-zinc-200">{wl?.activeMemberCount ?? 5}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Sesi Mingguan: <strong className="text-zinc-200">{wl?.weeklySessionCount ?? 12}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[10px] text-zinc-400">Availability:</span>
                            <span
                              className={`text-xs font-black ${
                                (wl?.availability ?? 70) >= 70
                                  ? 'text-emerald-400'
                                  : (wl?.availability ?? 70) >= 40
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {wl?.availability ?? 70}%
                            </span>
                          </div>
                          <span
                            className={`inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              (wl?.availability ?? 70) >= 70
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : (wl?.availability ?? 70) >= 40
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {wl?.statusTag ?? 'Tersedia'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leader Briefing / Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                  Catatan Tugas & Sasaran Latihan
                </label>
                <textarea
                  rows={2}
                  value={assignModal.notes}
                  onChange={(e) => setAssignModal({ ...assignModal, notes: e.target.value })}
                  placeholder="Misal: Member fokus penurunan berat badan, latihan hari Senin & Rabu malam..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Checkbox: Jadwalkan Sesi Perdana */}
              <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignModal.scheduleFirstSession}
                    onChange={(e) =>
                      setAssignModal({ ...assignModal, scheduleFirstSession: e.target.checked })
                    }
                    className="rounded border-zinc-700 text-orange-500 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-zinc-200">
                    Jadwalkan Sesi Konsultasi / Screening Perdana Langsung
                  </span>
                </label>

                {assignModal.scheduleFirstSession && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Tanggal Sesi</label>
                      <input
                        type="date"
                        value={assignModal.firstDate}
                        onChange={(e) => setAssignModal({ ...assignModal, firstDate: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Jam Sesi</label>
                      <input
                        type="time"
                        value={assignModal.firstTime}
                        onChange={(e) => setAssignModal({ ...assignModal, firstTime: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const chosen = trainers.find((t) => t.id === assignModal.selectedTrainerId);
                    handleSendWhatsAppTask(
                      chosen?.phone || '',
                      assignModal.selectedTrainerName,
                      assignModal.item,
                      assignModal.notes
                    );
                  }}
                  disabled={!assignModal.selectedTrainerName}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WA ke Trainer</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignModal(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs transition shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
                  >
                    ASSIGN TRAINER
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REASSIGN TRAINER WITH AUDIT REASON (User Spec #5) */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Ganti Personal Trainer</h3>
                  <p className="text-xs text-zinc-400">Pengalihan pelatih resmi dengan histori audit trail</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReassignment} className="space-y-4">
              {/* Info Box */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-mono">Member:</span>
                  <span className="font-bold text-white">{reassignModal.memberName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-mono">Paket:</span>
                  <span className="font-bold text-orange-400">{reassignModal.packageName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-mono">Trainer Saat Ini:</span>
                  <span className="font-bold text-rose-400 line-through">Coach {reassignModal.currentTrainerName}</span>
                </div>
              </div>

              {/* Reason Select */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Alasan Pergantian Trainer (Audit Log) *
                </label>
                <select
                  required
                  value={reassignModal.reason}
                  onChange={(e) => setReassignModal({ ...reassignModal, reason: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="Perubahan jadwal latihan member">Perubahan jadwal latihan member</option>
                  <option value="Permintaan khusus member">Permintaan khusus member</option>
                  <option value="Pelatih sakit / izin / cuti">Pelatih sakit / izin / cuti</option>
                  <option value="Optimalisasi beban kerja pelatih">Optimalisasi beban kerja pelatih</option>
                  <option value="Rotasi program spesialisasi fitness">Rotasi program spesialisasi fitness</option>
                </select>
              </div>

              {/* Pilih Trainer Baru */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Pilih Pelatih Baru (Pengganti) *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {trainers
                    .filter((t) => t.id !== reassignModal.currentTrainerId)
                    .map((t) => {
                      const wl = trainerWorkloads.find((w) => w.trainer.id === t.id);
                      const isSelected = reassignModal.selectedTrainerId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() =>
                            setReassignModal({
                              ...reassignModal,
                              selectedTrainerId: t.id,
                              selectedTrainerName: t.name
                            })
                          }
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition ${
                            isSelected
                              ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="reassignTrainer"
                              checked={isSelected}
                              onChange={() => {}}
                              className="text-orange-500"
                            />
                            <span>Coach {t.name}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {wl?.activeMemberCount ?? 5} Member • {wl?.availability ?? 70}% Avail
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Catatan Tambahan Leader</label>
                <input
                  type="text"
                  value={reassignModal.notes}
                  onChange={(e) => setReassignModal({ ...reassignModal, notes: e.target.value })}
                  placeholder="Catatan transisi program untuk pelatih baru..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setReassignModal(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold transition shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Simpan & Catat Histori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

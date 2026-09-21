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
  Award
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
import { Member, Schedule, User, StaffAttendance, Attendance } from '../types';
import { APP_TODAY, formatDateIndo, getDayDiff } from '../utils/formatters';

interface LeaderPTDashboardViewProps {
  members: Member[];
  schedules: Schedule[];
  staffUsers: User[];
  staffAttendances: StaffAttendance[];
  attendances: Attendance[];
  currentUser: User | null;
  onNavigateTab: (tab: any) => void;
  onOpenMemberDetail?: (member: Member) => void;
  onUpdateSchedule: (schedule: Schedule) => void;
  onAddSchedule: (schedule: Schedule) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LeaderPTDashboardView: React.FC<LeaderPTDashboardViewProps> = ({
  members,
  schedules,
  staffUsers,
  staffAttendances,
  attendances,
  currentUser,
  onNavigateTab,
  onOpenMemberDetail,
  onUpdateSchedule,
  onAddSchedule,
  showToast
}) => {
  // Active Filter / Tab state
  const [activeTableTab, setActiveTableTab] = useState<'members' | 'schedules' | 'trainers'>('members');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Trainers pool (pt and leader_pt)
  const trainers = useMemo(() => {
    return staffUsers.filter((u) => u.role === 'pt' || u.role === 'leader_pt');
  }, [staffUsers]);

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

    // 21. Jadwal bentrok (same trainer, same date, same time, status not Batal)
    const clashGroups: { [key: string]: Schedule[] } = {};
    schedules.forEach((s) => {
      if (s.status === 'Batal') return;
      const key = `${s.trainer}___${s.date}___${s.time}`;
      if (!clashGroups[key]) clashGroups[key] = [];
      clashGroups[key].push(s);
    });

    const bentrokSchedules: Schedule[] = [];
    const bentrokDetails: { trainer: string; date: string; time: string; schedules: Schedule[] }[] = [];

    Object.entries(clashGroups).forEach(([key, list]) => {
      if (list.length > 1) {
        const [trainer, date, time] = key.split('___');
        bentrokDetails.push({ trainer, date, time, schedules: list });
        list.forEach((item) => {
          if (!bentrokSchedules.some((x) => x.id === item.id)) {
            bentrokSchedules.push(item);
          }
        });
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
  }, [schedules, tomorrowDate, currentWeekDays]);

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

      return {
        ...t,
        todayCount: todaySchedules.length,
        completedSessions,
        memberCount: assignedMembers.length,
        totalSesiTersisa,
        isClockedIn,
        todaySchedules
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
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.picName.toLowerCase().includes(q));
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
  // ACTIONS & HANDLERS
  // --------------------------------------------------------------------------
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
      valStaf: currentUser?.role === 'leader_pt' || currentUser?.role === 'admin',
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

      {/* 3. FOUR KPI HUBS WITH MATHEMATICAL HIERARCHY */}

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

      {/* 5. INTERACTIVE OPERATIONAL TABLE WITH TABS */}
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
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Pilih Member PT *</label>
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
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30"
                >
                  Jadwalkan Sesi PT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

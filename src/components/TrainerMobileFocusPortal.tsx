import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  FileEdit,
  UserCheck,
  Play,
  Plus,
  Clock,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Phone,
  ChevronRight,
  Sparkles,
  Wallet,
  Award,
  ArrowRight,
  Search,
  Share2,
  RotateCcw,
  Check,
  Flame,
  Target,
  X,
  Activity,
  Timer,
  ChevronDown,
  MessageCircle,
  TrendingUp,
  Sliders,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Schedule, Member, User as UserType, TrainerWorkoutLog, PTPurchaseRecord } from '../types';
import { formatDateIndo, APP_TODAY, getDayNameIndo } from '../utils/formatters';

export interface MobileSessionItem {
  id: string;
  date?: string;
  time: string;
  memberName: string;
  sessionInfo: string;
  packageType: string;
  status: 'Menunggu' | 'Selesai' | 'Sedang Berlangsung';
  avatar?: string;
  phone: string;
  focusArea: string;
  rpe?: number;
  notes?: string;
}

export interface MobileClientItem {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  totalSessions: number;
  completedSessions: number;
  packageTitle: string;
  lastActive: string;
  targetGoal: string;
  healthNote: string;
}

export interface MobileWorkoutLogItem {
  id: string;
  memberName: string;
  date: string;
  time: string;
  sessionNo: number;
  totalSession: number;
  focusMuscle: string;
  rpe: number;
  duration: string;
  formRating: 'Sempurna' | 'Baik' | 'Perlu Perbaikan';
  coachNotes: string;
  nextTarget: string;
}

interface TrainerMobileFocusPortalProps {
  onBackToDesktop?: () => void;
  standalone?: boolean;
  currentUser?: UserType | null;
  schedules?: Schedule[];
  members?: Member[];
  workoutLogs?: TrainerWorkoutLog[];
  ptPurchases?: PTPurchaseRecord[];
  onAddSchedule?: (schedule: Schedule) => void;
  onUpdateSchedule?: (schedule: Schedule) => void;
  onUpdateMember?: (member: Member) => void;
  onSaveWorkoutLog?: (log: TrainerWorkoutLog) => void;
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const TrainerMobileFocusPortal: React.FC<TrainerMobileFocusPortalProps> = ({
  onBackToDesktop,
  standalone = false,
  currentUser,
  schedules,
  members,
  workoutLogs: propWorkoutLogs,
  ptPurchases,
  onAddSchedule,
  onUpdateSchedule,
  onUpdateMember,
  onSaveWorkoutLog,
  showToast
}) => {
  // Navigation Tab State (Jadwal, Klien, Log Latihan, Profil & Fee)
  const [activeTab, setActiveTab] = useState<'jadwal' | 'klien' | 'log' | 'profil'>('jadwal');

  const trainerDisplayName = currentUser?.name || 'Reza Pratama';
  const trainerAvatar = currentUser?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
  const trainerShift = currentUser?.shift || 'Shift Siang';

  // Helper: map a core Schedule into MobileSessionItem
  const mapScheduleToSessionItem = (
    s: Schedule,
    idx: number,
    allSchedules: Schedule[]
  ): MobileSessionItem => {
    const memMatch = members?.find(
      (m) => (s.memberId && m.id === s.memberId) || m.name.toLowerCase() === s.memberName.toLowerCase()
    );
    const ptPur = ptPurchases?.find(
      (p) => (s.memberId && p.memberId === s.memberId) || p.memberName.toLowerCase() === s.memberName.toLowerCase()
    );
    const completedForMember = allSchedules.filter(
      (sch) =>
        ((s.memberId && sch.memberId === s.memberId) ||
          sch.memberName.toLowerCase() === s.memberName.toLowerCase()) &&
        sch.status === 'Selesai'
    ).length;
    const totalSessions = ptPur?.totalSessions || (memMatch?.ptQuota ? memMatch.ptQuota + completedForMember : 12);
    const currentSessionNum = Math.min(totalSessions, completedForMember + (s.status === 'Selesai' ? 0 : 1));

    const status: 'Menunggu' | 'Selesai' | 'Sedang Berlangsung' =
      s.status === 'Selesai' ? 'Selesai' : 'Menunggu';

    return {
      id: s.id,
      date: s.date || APP_TODAY,
      time: s.time || '14:00',
      memberName: s.memberName,
      sessionInfo: `Sesi ${currentSessionNum} / ${totalSessions} (${ptPur?.packageName || 'Personal Training'})`,
      packageType: ptPur?.packageName || (memMatch as any)?.membershipType || 'Personal Training 1-on-1',
      status,
      avatar:
        memMatch?.photo ||
        `https://images.unsplash.com/photo-${1534528741775 + (idx % 10)}?q=80&w=200&auto=format&fit=crop`,
      phone: memMatch?.phone || '081234567890',
      focusArea: s.note || s.workoutFocus || 'Program Sesi Personal Training',
      notes: s.note || 'Form prima & pemanasan optimal'
    };
  };

  // Daily Sessions State (initialized from props if provided, or clean default matching user requirements)
  const [sessions, setSessions] = useState<MobileSessionItem[]>(() => {
    if (schedules && schedules.length > 0) {
      const trainerMatches = schedules.filter(
        (s) =>
          !currentUser ||
          s.trainer.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(s.trainer.toLowerCase())
      );
      const activePool = trainerMatches.length > 0 ? trainerMatches : schedules;
      const sortedPool = [...activePool].sort((a, b) => {
        const dateA = a.date || APP_TODAY;
        const dateB = b.date || APP_TODAY;
        if (dateA !== dateB) {
          if (dateA === APP_TODAY) return -1;
          if (dateB === APP_TODAY) return 1;
          return dateA.localeCompare(dateB);
        }
        return (a.time || '').localeCompare(b.time || '');
      });
      return sortedPool.slice(0, 15).map((s, idx) => mapScheduleToSessionItem(s, idx, sortedPool));
    }

    return [
      {
        id: 'SES-01',
        date: APP_TODAY,
        time: '14:00',
        memberName: 'Budi Santoso',
        sessionInfo: 'Sesi 4 / 12 (Personal Training)',
        packageType: 'Personal Training 1-on-1 (12 Sesi)',
        status: 'Menunggu',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        phone: '081234567890',
        focusArea: 'Chest & Triceps Hypertrophy',
        notes: 'Fokus stabilitas bahu saat bench press'
      },
      {
        id: 'SES-02',
        date: APP_TODAY,
        time: '16:30',
        memberName: 'Siti Aminah',
        sessionInfo: 'Sesi 7 / 16 (Fat Loss & Core)',
        packageType: 'Personal Training Fat Loss (16 Sesi)',
        status: 'Menunggu',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        phone: '081987654321',
        focusArea: 'Lower Body & Glute Activation',
        notes: 'Pemanasan dynamic hip mobility 10 menit'
      },
      {
        id: 'SES-03',
        date: APP_TODAY,
        time: '19:00',
        memberName: 'Hendra Wijaya',
        sessionInfo: 'Sesi 2 / 8 (Strength Foundation)',
        packageType: 'Personal Training Strength (8 Sesi)',
        status: 'Menunggu',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
        phone: '081377889900',
        focusArea: 'Back & Core Stability',
        notes: 'Deadlift tempo 3-1-1'
      }
    ];
  });

  // Keep sessions synchronized whenever schedules, currentUser, members, or ptPurchases change
  useEffect(() => {
    if (schedules && schedules.length > 0) {
      const trainerMatches = schedules.filter(
        (s) =>
          !currentUser ||
          s.trainer.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(s.trainer.toLowerCase())
      );
      const activePool = trainerMatches.length > 0 ? trainerMatches : schedules;
      const sortedPool = [...activePool].sort((a, b) => {
        const dateA = a.date || APP_TODAY;
        const dateB = b.date || APP_TODAY;
        if (dateA !== dateB) {
          if (dateA === APP_TODAY) return -1;
          if (dateB === APP_TODAY) return 1;
          return dateA.localeCompare(dateB);
        }
        return (a.time || '').localeCompare(b.time || '');
      });
      const mapped = sortedPool.map((s, idx) => mapScheduleToSessionItem(s, idx, sortedPool));
      setSessions(mapped);
    }
  }, [schedules, currentUser, members, ptPurchases]);

  // Clients Directory (initialized from real members if available)
  const [clients, setClients] = useState<MobileClientItem[]>(() => {
    if (members && members.length > 0) {
      return members.slice(0, 15).map((m, idx) => {
        const memberSchedules = schedules?.filter(
          (s) => (s.memberId && s.memberId === m.id) || s.memberName.toLowerCase() === m.name.toLowerCase()
        ) || [];
        const completedCount = memberSchedules.filter((s) => s.status === 'Selesai').length;
        const memberPurchases = ptPurchases?.filter(
          (p) => (p.memberId && p.memberId === m.id) || p.memberName.toLowerCase() === m.name.toLowerCase()
        ) || [];
        const purchaseTotal = memberPurchases.reduce((acc, p) => acc + (p.totalSessions || 0), 0);
        const totalSessions = purchaseTotal > 0 ? purchaseTotal : ((m.ptQuota || 0) + completedCount || 12);
        const latestSch = memberSchedules[0];

        return {
          id: m.id,
          name: m.name,
          phone: m.phone || '081234567890',
          avatar:
            m.photo ||
            `https://images.unsplash.com/photo-${1534528741775 + (idx % 10)}?q=80&w=200&auto=format&fit=crop`,
          totalSessions,
          completedSessions: completedCount,
          packageTitle: (m as any).membershipType || memberPurchases[0]?.packageName || 'Personal Training 1-on-1',
          lastActive: latestSch?.date ? formatDateIndo(latestSch.date) : (m.joinDate ? formatDateIndo(m.joinDate) : '10 Okt 2026'),
          targetGoal: (m as any).fitnessGoals || (m as any).notes || 'Kenaikan Massa Otot & Ketahanan Fisik',
          healthNote: (m as any).medicalNotes || m.notes || 'Kondisi fisik prima untuk latihan beban.'
        };
      });
    }

    return [
      {
        id: 'M001',
        name: 'Budi Santoso',
        phone: '081234567890',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        totalSessions: 12,
        completedSessions: 3,
        packageTitle: 'Personal Training 1-on-1 (12 Sesi)',
        lastActive: '10 Okt 2026',
        targetGoal: 'Kenaikan Massa Otot Dada & Lengan (+3kg)',
        healthNote: 'Pernah dislokasi bahu kanan (2023), hindari overhead press berlebih.'
      },
      {
        id: 'M002',
        name: 'Siti Aminah',
        phone: '081987654321',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        totalSessions: 16,
        completedSessions: 6,
        packageTitle: 'Personal Training Fat Loss (16 Sesi)',
        lastActive: '09 Okt 2026',
        targetGoal: 'Body Fat Reduction (Target 22%)',
        healthNote: 'Aman, konsisten dalam pola nutrisi defisit kalori.'
      },
      {
        id: 'M003',
        name: 'Hendra Wijaya',
        phone: '081377889900',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
        totalSessions: 8,
        completedSessions: 1,
        packageTitle: 'Personal Training Strength (8 Sesi)',
        lastActive: '06 Okt 2026',
        targetGoal: 'Powerlifting Squat & Deadlift Form',
        healthNote: 'Perlu penguatan lower back dan fleksibilitas ankle.'
      },
      {
        id: 'M004',
        name: 'Dewi Sartika',
        phone: '082155667788',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
        totalSessions: 20,
        completedSessions: 18,
        packageTitle: 'VIP Personal Training (20 Sesi)',
        lastActive: '08 Okt 2026',
        targetGoal: 'Post-Pregnancy Recovery & Core Tightening',
        healthNote: 'Diastasis recti sudah membaik, siap intensitas menengah.'
      }
    ];
  });

  // Keep clients synchronized with members, schedules, and ptPurchases
  useEffect(() => {
    if (members && members.length > 0) {
      const mappedClients: MobileClientItem[] = members.map((m, idx) => {
        const memberSchedules = schedules?.filter(
          (s) => (s.memberId && s.memberId === m.id) || s.memberName.toLowerCase() === m.name.toLowerCase()
        ) || [];
        const completedCount = memberSchedules.filter((s) => s.status === 'Selesai').length;
        const memberPurchases = ptPurchases?.filter(
          (p) => (p.memberId && p.memberId === m.id) || p.memberName.toLowerCase() === m.name.toLowerCase()
        ) || [];
        const purchaseTotal = memberPurchases.reduce((acc, p) => acc + (p.totalSessions || 0), 0);
        const totalSessions = purchaseTotal > 0 ? purchaseTotal : ((m.ptQuota || 0) + completedCount || 12);
        const latestSch = memberSchedules[0];

        return {
          id: m.id,
          name: m.name,
          phone: m.phone || '081234567890',
          avatar:
            m.photo ||
            `https://images.unsplash.com/photo-${1534528741775 + (idx % 10)}?q=80&w=200&auto=format&fit=crop`,
          totalSessions,
          completedSessions: completedCount,
          packageTitle: (m as any).membershipType || memberPurchases[0]?.packageName || 'Personal Training 1-on-1',
          lastActive: latestSch?.date ? formatDateIndo(latestSch.date) : (m.joinDate ? formatDateIndo(m.joinDate) : '10 Okt 2026'),
          targetGoal: (m as any).fitnessGoals || (m as any).notes || 'Kenaikan Massa Otot & Ketahanan Fisik',
          healthNote: (m as any).medicalNotes || m.notes || 'Kondisi fisik prima untuk latihan beban.'
        };
      });
      setClients(mappedClients);
    }
  }, [members, schedules, ptPurchases]);

  // Workout Logs State (initialized from propWorkoutLogs if available)
  const [workoutLogs, setWorkoutLogs] = useState<MobileWorkoutLogItem[]>(() => {
    if (propWorkoutLogs && propWorkoutLogs.length > 0) {
      return propWorkoutLogs.map((l) => ({
        id: l.id,
        memberName: l.memberName,
        date: formatDateIndo(l.date) || l.date,
        time: l.time || '14:00',
        sessionNo: l.sessionNumber || 1,
        totalSession: 12,
        focusMuscle: l.focusArea || 'Full Body',
        rpe: l.rpeRate || 8,
        duration: `${l.durationMinutes || 60} Menit`,
        formRating: (l.formQuality || 'Baik') as 'Sempurna' | 'Baik' | 'Perlu Perbaikan',
        coachNotes: l.coachNotes || 'Sesi selesai dengan presensi valid & form prima.',
        nextTarget: l.nextSessionGoal || 'Tingkatkan beban compound lift.'
      }));
    }
    return [
      {
        id: 'LOG-001',
        memberName: 'Budi Santoso',
        date: '10 Okt 2026',
        time: '14:00',
        sessionNo: 3,
        totalSession: 12,
        focusMuscle: 'Shoulder & Arm Isolation',
        rpe: 8,
        duration: '60 Menit',
        formRating: 'Baik',
        coachNotes: 'DB Lateral raise 10kg x 12 reps 4 set. Form rapi, tempo terkendali.',
        nextTarget: 'Naikkan beban incline dumbbell press ke 20kg.'
      },
      {
        id: 'LOG-002',
        memberName: 'Siti Aminah',
        date: '09 Okt 2026',
        time: '16:30',
        sessionNo: 6,
        totalSession: 16,
        focusMuscle: 'HIIT Circuit & Kettlebell Swing',
        rpe: 9,
        duration: '55 Menit',
        formRating: 'Sempurna',
        coachNotes: 'Stamina luar biasa meningkat. Heart rate pulih lebih cepat.',
        nextTarget: 'Tambahkan volume Bulgarian split squat.'
      }
    ];
  });

  // Keep workout logs synchronized with propWorkoutLogs
  useEffect(() => {
    if (propWorkoutLogs && propWorkoutLogs.length > 0) {
      const mappedLogs: MobileWorkoutLogItem[] = propWorkoutLogs.map((l) => ({
        id: l.id,
        memberName: l.memberName,
        date: formatDateIndo(l.date) || l.date,
        time: l.time || '14:00',
        sessionNo: l.sessionNumber || 1,
        totalSession: 12,
        focusMuscle: l.focusArea || 'Full Body',
        rpe: l.rpeRate || 8,
        duration: `${l.durationMinutes || 60} Menit`,
        formRating: (l.formQuality || 'Baik') as 'Sempurna' | 'Baik' | 'Perlu Perbaikan',
        coachNotes: l.coachNotes || 'Sesi selesai dengan presensi valid & form prima.',
        nextTarget: l.nextSessionGoal || 'Tingkatkan beban compound lift.'
      }));
      setWorkoutLogs(mappedLogs);
    }
  }, [propWorkoutLogs]);

  // Interactive Live Session Modal State (Hero CTA / Agenda Click)
  const [activeSessionModal, setActiveSessionModal] = useState<MobileSessionItem | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionNotesInput, setSessionNotesInput] = useState('');
  const [rpeRating, setRpeRating] = useState(8);

  // Quick Add / Schedule Modal (FAB)
  const [isFabModalOpen, setIsFabModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('Budi Santoso');
  const [newSessionTime, setNewSessionTime] = useState('11:00');
  const [newFocusArea, setNewFocusArea] = useState('Upper Body Hypertrophy');

  // Client Detail Modal
  const [selectedClientDetail, setSelectedClientDetail] = useState<MobileClientItem | null>(null);

  // Search and Filter States
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [agendaFilter, setAgendaFilter] = useState<'semua' | 'menunggu' | 'selesai'>('semua');
  
  // Agenda Date Filter States ('hari-ini' | 'tanggal' | 'rentang' | 'semua')
  const [agendaDateMode, setAgendaDateMode] = useState<'hari-ini' | 'tanggal' | 'rentang' | 'semua'>('hari-ini');
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<string>(APP_TODAY);
  const [agendaStartDate, setAgendaStartDate] = useState<string>(APP_TODAY);
  const [agendaEndDate, setAgendaEndDate] = useState<string>(APP_TODAY);

  // Rest Interval Countdown Timer for Live Workout
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [isRestRunning, setIsRestRunning] = useState<boolean>(false);
  const [restInitialDuration, setRestInitialDuration] = useState<number>(60);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time live date & clock ticker for accurate Indonesian time display
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Rest Countdown Interval Effect
  useEffect(() => {
    let interval: any = null;
    if (isRestRunning && restSecondsLeft > 0) {
      interval = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRestRunning(false);
            triggerToast('⏰ Waktu istirahat jeda set selesai! Mulai set berikutnya.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestRunning, restSecondsLeft]);

  const handleStartRestTimer = (seconds: number) => {
    setRestInitialDuration(seconds);
    setRestSecondsLeft(seconds);
    setIsRestRunning(true);
    triggerToast(`⏱️ Timer istirahat ${seconds} detik dimulai!`);
  };

  // Stopwatch effect for active training session
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatStopwatch = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculations for Daily Status Cards & Performance
  const todaySessions = useMemo(() => {
    return sessions.filter((s) => (s.date || APP_TODAY) === APP_TODAY);
  }, [sessions]);
  const totalTodaySessions = todaySessions.length;
  const completedCount = todaySessions.filter((s) => s.status === 'Selesai').length;
  // Estimasi fee hari ini: Rp 60.000 per sesi selesai hari ini
  const estimatedFeeValue = completedCount * 60000;
  const formattedFee = `Rp ${estimatedFeeValue.toLocaleString('id-ID')}`;

  // Monthly performance calculations for active trainer from real schedules
  const currentMonthPrefix = APP_TODAY.slice(0, 7);
  const monthlyCompletedCount = useMemo(() => {
    if (!schedules || schedules.length === 0) {
      return sessions.filter((s) => s.status === 'Selesai').length;
    }
    return schedules.filter((s) => {
      const matchTrainer =
        !currentUser ||
        s.trainer.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(s.trainer.toLowerCase());
      const inMonth = (s.date || APP_TODAY).startsWith(currentMonthPrefix);
      return matchTrainer && inMonth && s.status === 'Selesai';
    }).length;
  }, [schedules, currentUser, currentMonthPrefix, sessions]);

  const accumulatedMonthlyFee = (monthlyCompletedCount * 60000).toLocaleString('id-ID');
  const trainerRoleDisplay =
    currentUser?.role === 'leader_pt'
      ? 'Head Coach / Lead Trainer'
      : ((currentUser as any)?.specialization || 'Personal Trainer');
  const trainerIdDisplay = currentUser?.id || 'TRN-004';
  const trainerSpecDisplay = (currentUser as any)?.specialization || 'Strength & Hypertrophy';

  // Current / Next up session (Hero Card Target)
  const heroSession = useMemo(() => {
    if (sessions.length === 0) return null;

    // Prioritas 1: Sesi hari ini
    const todayList = sessions.filter((s) => (s.date || APP_TODAY) === APP_TODAY);
    
    // 1a. Ada sesi sedang berlangsung hari ini
    const ongoingToday = todayList.find((s) => s.status === 'Sedang Berlangsung');
    if (ongoingToday) return ongoingToday;

    // 1b. Sesi menunggu hari ini (paling awal menurut jam)
    const waitingToday = todayList.find((s) => s.status === 'Menunggu');
    if (waitingToday) return waitingToday;

    // 1c. Jika semua hari ini selesai, tampilkan sesi hari ini
    if (todayList.length > 0) return todayList[0];

    // Prioritas 2: Sesi di tanggal lain
    const ongoingAny = sessions.find((s) => s.status === 'Sedang Berlangsung');
    if (ongoingAny) return ongoingAny;

    const waitingAny = sessions.find((s) => s.status === 'Menunggu');
    if (waitingAny) return waitingAny;

    return sessions[0];
  }, [sessions]);

  // Handler: Quick Toggle Session Status directly from card
  const handleToggleSessionStatus = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = sessions.find((s) => s.id === sessionId);
    if (!item) return;

    const newStatus: 'Menunggu' | 'Selesai' = item.status === 'Selesai' ? 'Menunggu' : 'Selesai';
    const msg =
      newStatus === 'Selesai'
        ? `Sesi ${item.memberName} ditandai selesai! (+Rp 60.000) 🎉`
        : `Status ${item.memberName} dikembalikan ke Menunggu.`;
    triggerToast(msg);
    showToast?.('Status Sesi Diperbarui', msg, 'success');

    // 1. Update local session state
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
    );

    // 2. Synchronize Schedule with Core
    if (onUpdateSchedule && schedules) {
      const sch = schedules.find(
        (s) => s.id === sessionId || s.memberName.toLowerCase() === item.memberName.toLowerCase()
      );
      if (sch) {
        onUpdateSchedule({
          ...sch,
          status: newStatus === 'Selesai' ? 'Selesai' : 'Menunggu',
          valTrainer: newStatus === 'Selesai',
          valMember: newStatus === 'Selesai'
        });
      }
    }

    // 3. Synchronize Member Quota
    if (onUpdateMember && members) {
      const targetMember = members.find(
        (m) => (item.id && m.id === item.id) || m.name.toLowerCase() === item.memberName.toLowerCase()
      );
      if (targetMember && targetMember.ptQuota !== undefined) {
        const delta = newStatus === 'Selesai' ? -1 : 1;
        const newQuota = Math.max(0, (targetMember.ptQuota || 0) + delta);
        onUpdateMember({
          ...targetMember,
          ptQuota: newQuota
        });
      }
    }
  };

  // Filtered Sessions for Agenda Tab (Combines Status and Date: Hari Ini / Tanggal / Rentang / Semua)
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Status Filter
      if (agendaFilter === 'menunggu' && !(s.status === 'Menunggu' || s.status === 'Sedang Berlangsung')) {
        return false;
      }
      if (agendaFilter === 'selesai' && s.status !== 'Selesai') {
        return false;
      }

      // 2. Date Filter
      const sDate = s.date || APP_TODAY;
      if (agendaDateMode === 'hari-ini') {
        return sDate === APP_TODAY;
      }
      if (agendaDateMode === 'tanggal') {
        return sDate === selectedAgendaDate;
      }
      if (agendaDateMode === 'rentang') {
        if (agendaStartDate && sDate < agendaStartDate) return false;
        if (agendaEndDate && sDate > agendaEndDate) return false;
        return true;
      }
      // 'semua'
      return true;
    });
  }, [sessions, agendaFilter, agendaDateMode, selectedAgendaDate, agendaStartDate, agendaEndDate]);

  // Filtered Clients for Klien Tab
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return clients;
    const q = clientSearchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.packageTitle.toLowerCase().includes(q) ||
        c.targetGoal.toLowerCase().includes(q)
    );
  }, [clients, clientSearchTerm]);

  // Filtered Workout Logs for Log Latihan Tab
  const filteredWorkoutLogs = useMemo(() => {
    if (!logSearchTerm.trim()) return workoutLogs;
    const q = logSearchTerm.toLowerCase();
    return workoutLogs.filter(
      (l) =>
        l.memberName.toLowerCase().includes(q) ||
        l.focusMuscle.toLowerCase().includes(q) ||
        l.coachNotes.toLowerCase().includes(q)
    );
  }, [workoutLogs, logSearchTerm]);

  // Handler: Open Session & Start Check-In
  const handleOpenStartSession = (session: MobileSessionItem) => {
    setActiveSessionModal(session);
    setSessionNotesInput(session.notes || '');
    setIsTimerRunning(true);
    setSessionTimer(0);
    triggerToast(`Sesi bersama ${session.memberName} siap dimulai!`);
  };

  // Handler: Complete Session
  const handleCompleteActiveSession = () => {
    if (!activeSessionModal) return;

    const sessionDate = activeSessionModal.date || APP_TODAY;

    // 1. Update session status in state
    setSessions((prev) =>
      prev.map((item) =>
        item.id === activeSessionModal.id
          ? { ...item, status: 'Selesai' }
          : item
      )
    );

    // 2. Synchronize Schedule
    if (onUpdateSchedule && schedules) {
      const sch = schedules.find(
        (s) => s.id === activeSessionModal.id || s.memberName.toLowerCase() === activeSessionModal.memberName.toLowerCase()
      );
      if (sch) {
        onUpdateSchedule({
          ...sch,
          status: 'Selesai',
          valTrainer: true,
          valMember: true
        });
      }
    }

    // 3. Find matching member & deduct PT quota
    const matchedMember = members?.find(
      (m) => m.name.toLowerCase() === activeSessionModal.memberName.toLowerCase()
    );
    if (onUpdateMember && matchedMember && matchedMember.ptQuota !== undefined) {
      onUpdateMember({
        ...matchedMember,
        ptQuota: Math.max(0, (matchedMember.ptQuota || 0) - 1)
      });
    }

    // 4. Calculate member's session count from schedules
    const completedForMember = schedules?.filter(
      (s) =>
        ((matchedMember?.id && s.memberId === matchedMember.id) ||
          s.memberName.toLowerCase() === activeSessionModal.memberName.toLowerCase()) &&
        s.status === 'Selesai'
    ).length || 0;
    const sessionNumber = completedForMember + 1;
    const totalSessions = matchedMember?.ptQuota ? matchedMember.ptQuota + sessionNumber : 12;

    // 5. Emit full TrainerWorkoutLog
    const fullLog: TrainerWorkoutLog = {
      id: 'LOG-' + Date.now(),
      scheduleId: activeSessionModal.id,
      trainerId: currentUser?.id || 'S04',
      trainerName: trainerDisplayName,
      memberId: matchedMember?.id || 'M-' + Date.now(),
      memberName: activeSessionModal.memberName,
      date: sessionDate,
      time: activeSessionModal.time,
      durationMinutes: sessionTimer > 0 ? Math.max(1, Math.round(sessionTimer / 60)) : 60,
      sessionNumber,
      focusArea: activeSessionModal.focusArea,
      exercisesSummary: `${activeSessionModal.focusArea} 4x10-12 (Form prima & teknik stabil)`,
      rpeRate: rpeRating,
      condition: 'Prima & Bertenaga',
      formQuality: rpeRating >= 9 ? 'Sempurna' : rpeRating >= 7 ? 'Baik' : 'Perlu Perbaikan Form',
      coachNotes: sessionNotesInput || 'Sesi selesai dengan presensi valid & form prima.',
      nextSessionGoal: 'Tingkatkan progres beban pada compound lift berikutnya.',
      createdAt: `${sessionDate} ${activeSessionModal.time} WIB`
    };

    if (onSaveWorkoutLog) {
      onSaveWorkoutLog(fullLog);
    }

    // 6. Update local mobile workout logs
    const newLogItem: MobileWorkoutLogItem = {
      id: fullLog.id,
      memberName: fullLog.memberName,
      date: formatDateIndo(sessionDate),
      time: fullLog.time || activeSessionModal.time || '14:00',
      sessionNo: fullLog.sessionNumber || sessionNumber,
      totalSession: totalSessions,
      focusMuscle: fullLog.focusArea,
      rpe: fullLog.rpeRate,
      duration: `${fullLog.durationMinutes} Menit`,
      formRating: rpeRating >= 9 ? 'Sempurna' : rpeRating >= 7 ? 'Baik' : 'Perlu Perbaikan',
      coachNotes: fullLog.coachNotes,
      nextTarget: fullLog.nextSessionGoal
    };
    setWorkoutLogs((prev) => [newLogItem, ...prev]);

    setIsTimerRunning(false);
    setActiveSessionModal(null);
    const successMsg = `Presensi & Sesi ${activeSessionModal.memberName} Berhasil Diselesaikan! Fee +Rp 60.000 🎉`;
    triggerToast(successMsg);
    showToast?.('Presensi Berhasil', successMsg, 'success');
  };

  // Handler: Quick Add New Session via FAB
  const handleCreateSessionFromFab = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionDate = selectedAgendaDate || APP_TODAY;
    const newSession: MobileSessionItem = {
      id: 'SES-' + Date.now(),
      date: sessionDate,
      time: newSessionTime,
      memberName: newClientName,
      sessionInfo: 'Sesi Tambahan / Terjadwal',
      packageType: 'Personal Training Regular',
      status: 'Menunggu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      phone: '081234567890',
      focusArea: newFocusArea,
      notes: 'Ditambahkan via Portal Fokus Trainer'
    };
    setSessions((prev) => [...prev, newSession]);

    if (onAddSchedule) {
      const matchedMember = members?.find(
        (m) => m.name.toLowerCase() === newClientName.toLowerCase()
      );
      const realSch: Schedule = {
        id: 'SCH-' + Date.now(),
        date: sessionDate,
        time: newSessionTime,
        memberName: newClientName,
        memberId: matchedMember?.id || 'M-NEW',
        trainer: trainerDisplayName,
        status: 'Menunggu',
        valStaf: true,
        valTrainer: true,
        valMember: false,
        note: newFocusArea
      };
      onAddSchedule(realSch);
    }

    setIsFabModalOpen(false);
    const addedMsg = `Jadwal baru jam ${newSessionTime} bersama ${newClientName} berhasil dibuat! 📅`;
    triggerToast(addedMsg);
    showToast?.('Jadwal Ditambahkan', addedMsg, 'success');
  };

  // Handler: WhatsApp Direct Message
  const handleOpenWhatsApp = (phone: string, name: string, time: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const text = encodeURIComponent(
      `Halo Kak ${name}! 💪\nPengingat sesi Personal Training di GymPro hari ini pukul ${time} WIB bersama Coach ${trainerDisplayName}. Siapkan baju olahraga & tumbler ya! Sampai ketemu di gym.`
    );
    try {
      const a = document.createElement('a');
      a.href = `https://wa.me/${intlPhone}?text=${text}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
    triggerToast(`Membuka WhatsApp untuk ${name} 📲`);
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-[#0b0f17] text-zinc-100 flex items-center justify-center p-0 sm:p-3 select-none font-sans overflow-hidden">
      {/* ========================================================================= */}
      {/* SMARTPHONE DEVICE WRAPPER (max-w-md mx-auto)                                */}
      {/* Aesthetic: Clay 3D Gelap (#111827 / #1f2937, Aksen #f97316)              */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md mx-auto h-[100dvh] max-h-[100dvh] sm:h-[844px] sm:max-h-[92vh] bg-[#111827] sm:rounded-[36px] border-0 sm:border-4 border-zinc-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col relative overflow-hidden">
        {/* ========================================================================= */}
        {/* 2. HEADER KOMPAK                                                         */}
        {/* Nama: "GymPro" + Logo Kecil | Profil Trainer: Avatar, "Reza Pratama",      */}
        {/* Status chip hijau "Aktif Bertugas", Subtitle "Shift Siang"               */}
        {/* ========================================================================= */}
        <header className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-b from-[#182133] to-[#111827] border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center justify-between">
            {/* App Branding */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 p-0.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_4px_12px_rgba(249,115,22,0.35)] flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#111827] rounded-[10px] flex items-center justify-center">
                  <Dumbbell className="w-3.5 h-3.5 text-orange-500 transform -rotate-45" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center">
                    Gym<span className="text-orange-500">Pro</span>
                  </h1>
                  <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider">
                    ERP
                  </span>
                </div>
                <p className="text-[9.5px] text-zinc-400 font-medium">Portal Fokus Trainer</p>
              </div>
            </div>

            {/* Trainer Profile (Right Corner) */}
            <div className="flex items-center gap-2 bg-[#1f2937]/90 px-2.5 py-1 rounded-xl border border-zinc-700/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_10px_rgba(0,0,0,0.25)] min-w-0">
              <div className="text-right min-w-0">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[11px] sm:text-xs font-bold text-white leading-tight truncate max-w-[100px] sm:max-w-none">{trainerDisplayName}</span>
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {/* Status chip hijau "Aktif Bertugas" */}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8.5px] font-bold leading-none shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Aktif
                  </span>
                  {/* Subtitle Shift Siang */}
                  <span className="text-[8.5px] text-zinc-400 font-medium leading-none truncate">
                    • {trainerShift}
                  </span>
                </div>
              </div>

              {/* Avatar bulat */}
              <div className="relative shrink-0">
                {trainerAvatar && trainerAvatar.trim() ? (
                  <img
                    src={trainerAvatar.trim()}
                    alt={trainerDisplayName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-500/70 shadow-md"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 ring-2 ring-orange-500/70 flex items-center justify-center text-xs font-bold text-orange-400">
                    {trainerDisplayName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-zinc-900"></span>
              </div>
            </div>
          </div>
        </header>

        {/* Back to desktop switch button (if mounted within main ERP) */}
        {onBackToDesktop && (
          <div className="bg-zinc-950/90 px-3.5 py-1 flex items-center justify-between text-xs border-b border-zinc-800 text-zinc-400 shrink-0">
            <span className="flex items-center gap-1 text-[10.5px]">
              <Sparkles className="w-3 h-3 text-orange-400" />
              Mode Web Smartphone
            </span>
            <button
              onClick={onBackToDesktop}
              className="text-[10px] text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer flex items-center gap-1"
            >
              Kembali ke Desktop Portal
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN SCROLLABLE CONTENT BODY (With padding-bottom for elevated navbar)      */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] scrollbar-thin scrollbar-thumb-zinc-800/80 overscroll-contain">
          
          {/* TAB 1: JADWAL (Default & Primary Focus View) */}
          {activeTab === 'jadwal' && (
            <div className="space-y-3 animate-fadeIn">
              
              {/* =================================================================== */}
              {/* 3. STATUS RINGKAS HARIAN                                            */}
              {/* Hari/Tanggal: "Senin, 12 Okt"                                       */}
              {/* 2 kartu berdampingan:                                               */}
              {/* - "Sesi Hari Ini: 0 / 4 Selesai"                                    */}
              {/* - "Estimasi Fee: Rp 60.000"                                         */}
              {/* =================================================================== */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1 gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="text-white font-bold capitalize truncate">
                      {currentDateTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-zinc-500 shrink-0">• {currentDateTime.getFullYear()}</span>
                    <span className="text-orange-400 font-mono font-bold text-[11px] bg-zinc-900/90 px-1.5 py-0.5 rounded-md border border-zinc-800 ml-0.5 tabular-nums shrink-0 shadow-xs">
                      {currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50 shrink-0">
                    <Clock className="w-3 h-3 text-orange-400" />
                    <span>Shift 13:00 - 21:00</span>
                  </div>
                </div>

                {/* 2 Kartu Indikator Ringkas Berdampingan */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Kartu 1: Sesi Hari Ini */}
                  <div className="bg-[#1f2937]/90 rounded-2xl p-3 border border-zinc-700/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_16px_rgba(0,0,0,0.35)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                      <span className="font-semibold text-zinc-300">Sesi Hari Ini</span>
                      <Target className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <div className="text-base sm:text-lg font-black text-white tracking-tight">
                      {completedCount} / {totalTodaySessions}{' '}
                      <span className="text-xs font-bold text-orange-400">Selesai</span>
                    </div>
                    {/* Progress Bar Mini */}
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden border border-zinc-700/60">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalTodaySessions === 0 ? 0 : Math.min(100, (completedCount / totalTodaySessions) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Kartu 2: Estimasi Fee */}
                  <div className="bg-[#1f2937]/90 rounded-2xl p-3 border border-zinc-700/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_16px_rgba(0,0,0,0.35)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                      <span className="font-semibold text-zinc-300">Estimasi Fee</span>
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-base sm:text-lg font-black text-emerald-400 tracking-tight">
                      {formattedFee}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Rp 60.000 / sesi valid</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================================== */}
              {/* 4. HERO CARD ("SESI SEKARANG / BERIKUTNYA")                          */}
              {/* Kartu berbingkai aksen oranye, label SESI SEKARANG / BERIKUTNYA,     */}
              {/* Sinkronisasi akurat dengan data jadwal nyata                          */}
              {/* =================================================================== */}
              <section>
                {heroSession ? (
                  <div className="relative rounded-3xl bg-gradient-to-br from-[#1c2436] via-[#161c28] to-[#121722] border-2 border-orange-500/80 p-4 sm:p-5 shadow-[0_12px_28px_rgba(249,115,22,0.18),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden">
                    {/* Subtle Clay Ambient Glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
                    
                    {/* Header Tag / Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap mb-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        heroSession.status === 'Selesai'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : heroSession.status === 'Sedang Berlangsung'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      }`}>
                        <Flame className={`w-3 h-3 ${heroSession.status === 'Selesai' ? 'text-emerald-400' : 'text-orange-400 animate-pulse'}`} />
                        {heroSession.status === 'Selesai'
                          ? 'SESI SELESAI'
                          : heroSession.status === 'Sedang Berlangsung'
                          ? 'SESI SEDANG BERLANGSUNG'
                          : 'SESI SEKARANG / BERIKUTNYA'}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-orange-400 bg-[#111827] px-2.5 py-1 rounded-xl border border-orange-500/30 shrink-0 shadow-inner">
                        <Clock className="w-3 h-3 text-orange-400 shrink-0" />
                        <span>
                          {(() => {
                            const isToday = !heroSession.date || heroSession.date === APP_TODAY;
                            const dayName = getDayNameIndo(heroSession.date || APP_TODAY);
                            return isToday
                              ? `Hari Ini (${dayName}), ${heroSession.time} WIB`
                              : `${dayName}, ${formatDateIndo(heroSession.date || APP_TODAY)}, ${heroSession.time} WIB`;
                          })()}
                        </span>
                      </span>
                    </div>

                    {/* Client Info Info Block */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <div className="relative shrink-0">
                        {heroSession.avatar ? (
                          <img
                            src={heroSession.avatar}
                            alt={heroSession.memberName}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-lg"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-orange-500 flex items-center justify-center text-base font-bold text-orange-400 shadow-lg">
                            {heroSession.memberName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-zinc-950 font-black text-[10px]">
                          PT
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-black text-white tracking-tight leading-tight truncate">
                          {heroSession.memberName}
                        </h2>
                        <p className="text-xs text-orange-400 font-semibold mt-0.5">
                          {heroSession.sessionInfo}
                        </p>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-[11px] text-zinc-400">
                          <span className="inline-flex items-center gap-1 bg-zinc-800/90 text-orange-300 font-medium px-2 py-0.5 rounded-lg border border-zinc-700/50">
                            <Calendar className="w-3 h-3 text-orange-400 shrink-0" />
                            {(() => {
                              const isToday = !heroSession.date || heroSession.date === APP_TODAY;
                              const dayName = getDayNameIndo(heroSession.date || APP_TODAY);
                              return isToday
                                ? `Hari Ini (${dayName}) • ${heroSession.time} WIB`
                                : `${dayName}, ${formatDateIndo(heroSession.date || APP_TODAY)} • ${heroSession.time} WIB`;
                            })()}
                          </span>
                          <span className="truncate max-w-[170px] bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-700/50">
                            🎯 {heroSession.focusArea || 'Program Sesi Personal Training'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Quick Contact */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl mb-3.5 border border-zinc-800">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <UserCheck className={`w-3.5 h-3.5 ${heroSession.status === 'Selesai' ? 'text-emerald-400' : 'text-amber-400'}`} />
                        Status:{' '}
                        <strong className={heroSession.status === 'Selesai' ? 'text-emerald-400' : heroSession.status === 'Sedang Berlangsung' ? 'text-amber-400' : 'text-orange-400'}>
                          {heroSession.status}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(heroSession.phone, heroSession.memberName, heroSession.time)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Phone className="w-3 h-3" />
                        Chat WhatsApp
                      </button>
                    </div>

                    {/* Primary Call To Action Button (Tombol Utama Besar) */}
                    <button
                      type="button"
                      onClick={() => handleOpenStartSession(heroSession)}
                      className={`w-full py-3.5 px-4 rounded-2xl active:scale-[0.98] text-zinc-950 text-sm font-black tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer uppercase ${
                        heroSession.status === 'Selesai'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 shadow-[0_8px_20px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]'
                          : 'bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-[0_8px_20px_rgba(249,115,22,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]'
                      }`}
                    >
                      {heroSession.status === 'Selesai' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 stroke-zinc-950 stroke-[2.5]" />
                          <span>[ ✓ SESI TELAH SELESAI / LIHAT DETAIL ]</span>
                        </>
                      ) : heroSession.status === 'Sedang Berlangsung' ? (
                        <>
                          <Clock className="w-4 h-4 stroke-zinc-950 stroke-[2.5]" />
                          <span>[ ⏱ LANJUTKAN SESI & PRESENSI ]</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-zinc-950 stroke-zinc-950" />
                          <span>[ ▶ MULAI SESI & PRESENSI ]</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-[#1f2937]/70 border border-zinc-800 p-5 text-center">
                    <p className="text-sm font-bold text-zinc-300">Tidak ada sesi jadwal hari ini</p>
                    <p className="text-xs text-zinc-400 mt-1">Gunakan tombol + Jadwal Baru untuk menambahkan sesi.</p>
                  </div>
                )}
              </section>

              {/* =================================================================== */}
              {/* 5. AGENDA SESI HARI INI                                             */}
              {/* Judul: "Agenda Hari Ini"                                             */}
              {/* List Sesi Vertikal Card:                                            */}
              {/* - 14:00 - Budi Santoso (Badge: Menunggu - warna oranye/kuning)      */}
              {/* - 16:30 - Siti Aminah (Badge: Menunggu - warna oranye/kuning)       */}
              {/* - 19:00 - Hendra Wijaya (Badge: Menunggu - warna oranye/kuning)     */}
              {/* =================================================================== */}
              <section className="space-y-2.5">
                {/* Header Section */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-orange-500" />
                      {agendaDateMode === 'hari-ini'
                        ? 'Agenda Hari Ini'
                        : agendaDateMode === 'tanggal'
                        ? `Agenda (${formatDateIndo(selectedAgendaDate)})`
                        : agendaDateMode === 'rentang'
                        ? 'Agenda Rentang Waktu'
                        : 'Semua Agenda Sesi'}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {filteredSessions.length} Sesi
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">Ketuk untuk check-in</span>
                </div>

                {/* 1. FILTER TANGGAL, RENTANG & HARI INI */}
                <div className="bg-[#182133] p-2.5 rounded-2xl border border-zinc-700/70 shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span>Filter Tanggal & Waktu:</span>
                    </span>
                    {agendaDateMode !== 'hari-ini' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAgendaDateMode('hari-ini');
                          setSelectedAgendaDate(APP_TODAY);
                        }}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Kembali ke Hari Ini
                      </button>
                    )}
                  </div>

                  {/* Mode Buttons: Hari Ini, Tanggal, Rentang, Semua */}
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-zinc-950/80 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAgendaDateMode('hari-ini');
                        setSelectedAgendaDate(APP_TODAY);
                      }}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                        agendaDateMode === 'hari-ini'
                          ? 'bg-orange-500 text-zinc-950 font-black shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgendaDateMode('tanggal')}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                        agendaDateMode === 'tanggal'
                          ? 'bg-orange-500 text-zinc-950 font-black shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Tanggal
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgendaDateMode('rentang')}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                        agendaDateMode === 'rentang'
                          ? 'bg-orange-500 text-zinc-950 font-black shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Rentang
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgendaDateMode('semua')}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                        agendaDateMode === 'semua'
                          ? 'bg-orange-500 text-zinc-950 font-black shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Semua
                    </button>
                  </div>

                  {/* Single Date Picker Panel */}
                  {agendaDateMode === 'tanggal' && (
                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                      <div className="flex-1">
                        <label className="text-[9px] text-zinc-400 block mb-0.5 font-medium">Pilih Tanggal Sesi:</label>
                        <input
                          type="date"
                          value={selectedAgendaDate}
                          onChange={(e) => setSelectedAgendaDate(e.target.value)}
                          className="w-full bg-[#111827] border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 scheme-dark font-mono cursor-pointer"
                        />
                      </div>
                      <div className="text-[10px] text-zinc-400 pt-3 text-right">
                        <span className="font-semibold text-orange-400 block">{formatDateIndo(selectedAgendaDate)}</span>
                      </div>
                    </div>
                  )}

                  {/* Date Range Picker Panel */}
                  {agendaDateMode === 'rentang' && (
                    <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-zinc-400 block mb-0.5 font-medium">Mulai Dari:</label>
                          <input
                            type="date"
                            value={agendaStartDate}
                            onChange={(e) => setAgendaStartDate(e.target.value)}
                            className="w-full bg-[#111827] border border-zinc-700/80 rounded-xl px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-orange-500 scheme-dark font-mono cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-400 block mb-0.5 font-medium">Sampai Tanggal:</label>
                          <input
                            type="date"
                            value={agendaEndDate}
                            onChange={(e) => setAgendaEndDate(e.target.value)}
                            className="w-full bg-[#111827] border border-zinc-700/80 rounded-xl px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-orange-500 scheme-dark font-mono cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="text-[9.5px] text-zinc-400 flex items-center justify-between px-0.5">
                        <span>Rentang: <strong className="text-orange-400">{formatDateIndo(agendaStartDate)}</strong> s/d <strong className="text-orange-400">{formatDateIndo(agendaEndDate)}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Hari Ini Active Indicator */}
                  {agendaDateMode === 'hari-ini' && (
                    <div className="flex items-center justify-between text-[9.5px] text-zinc-400 pt-0.5 px-0.5">
                      <span>Jadwal Hari Ini: <strong className="text-orange-400">{formatDateIndo(APP_TODAY)}</strong></span>
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Aktif
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. FILTER STATUS (SEMUA / MENUNGGU / SELESAI) */}
                <div className="flex items-center gap-1.5 px-0.5">
                  <button
                    type="button"
                    onClick={() => setAgendaFilter('semua')}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                      agendaFilter === 'semua'
                        ? 'bg-orange-500 text-zinc-950 font-black shadow-xs shadow-orange-500/20'
                        : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
                    }`}
                  >
                    Semua ({filteredSessions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaFilter('menunggu')}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      agendaFilter === 'menunggu'
                        ? 'bg-amber-500 text-zinc-950 font-black'
                        : 'bg-zinc-800/80 text-amber-400 hover:text-amber-300 border border-zinc-700/60'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Menunggu ({sessions.filter((s) => (s.status === 'Menunggu' || s.status === 'Sedang Berlangsung') && (agendaDateMode === 'hari-ini' ? (s.date || APP_TODAY) === APP_TODAY : true)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaFilter('selesai')}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      agendaFilter === 'selesai'
                        ? 'bg-emerald-500 text-zinc-950 font-black'
                        : 'bg-zinc-800/80 text-emerald-400 hover:text-emerald-300 border border-zinc-700/60'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Selesai ({sessions.filter((s) => s.status === 'Selesai' && (agendaDateMode === 'hari-ini' ? (s.date || APP_TODAY) === APP_TODAY : true)).length})
                  </button>
                </div>

                {/* 3. LIST SESI KARTU (MAKSIMAL ~5 DI TAMPILAN AWAL, DENGAN SCROLL INTERNAL) */}
                {filteredSessions.length === 0 ? (
                  <div className="py-6 text-center space-y-2 bg-[#182133]/60 rounded-2xl border border-dashed border-zinc-700 p-4">
                    <Calendar className="w-7 h-7 text-zinc-500 mx-auto" />
                    <p className="text-xs text-zinc-300 font-semibold">Tidak Ada Sesi Pada Filter Ini</p>
                    <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                      {agendaDateMode === 'hari-ini'
                        ? 'Belum ada agenda sesi yang terjadwal untuk hari ini.'
                        : agendaDateMode === 'tanggal'
                        ? `Tidak ada sesi pada tanggal ${formatDateIndo(selectedAgendaDate)}.`
                        : agendaDateMode === 'rentang'
                        ? `Tidak ada sesi pada rentang ${formatDateIndo(agendaStartDate)} s/d ${formatDateIndo(agendaEndDate)}.`
                        : 'Tidak ada sesi yang sesuai dengan kriteria filter.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAgendaDateMode('hari-ini');
                        setAgendaFilter('semua');
                      }}
                      className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 rounded-xl text-[10px] font-bold cursor-pointer transition active:scale-95"
                    >
                      Tampilkan Sesi Hari Ini
                    </button>
                  </div>
                ) : (
                  <div className="max-h-[385px] sm:max-h-[420px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700/60 overscroll-contain rounded-2xl touch-pan-y">
                    {filteredSessions.map((item) => {
                      const isCompleted = item.status === 'Selesai';
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenStartSession(item)}
                          className={`rounded-2xl p-2.5 sm:p-3 border transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] ${
                            isCompleted
                              ? 'bg-[#141b27]/80 border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]'
                              : 'bg-[#1f2937]/90 hover:bg-[#253245] border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2.5">
                            {/* Time & Client Summary */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Time Pill */}
                              <div className="w-12 text-center shrink-0">
                                <span className="text-[11px] font-mono font-black text-orange-400 bg-[#111827] px-1.5 py-0.5 rounded-lg border border-orange-500/30 block">
                                  {item.time}
                                </span>
                              </div>

                              {/* Client Name & Sub info */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                                    {item.memberName}
                                  </h4>
                                  {agendaDateMode !== 'hari-ini' && item.date && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-orange-400 border border-zinc-700 font-mono shrink-0">
                                      {item.date === APP_TODAY
                                        ? `Hari Ini (${getDayNameIndo(item.date)})`
                                        : `${getDayNameIndo(item.date)}, ${formatDateIndo(item.date)}`}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                  {item.sessionInfo}
                                </p>
                              </div>
                            </div>

                            {/* Badge Status with Quick Toggle */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => handleToggleSessionStatus(item.id, e)}
                                title="Klik untuk ubah cepat status"
                                className="cursor-pointer transition-transform active:scale-95"
                              >
                                {isCompleted ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[9.5px] font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Selesai
                                  </span>
                                ) : (
                                  /* Badge: Menunggu - warna oranye/kuning */
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-[9.5px] font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                    Menunggu
                                  </span>
                                )}
                              </button>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                            </div>
                          </div>

                          {/* Extra Mini Details (Focus & Note) */}
                          <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9.5px] text-zinc-400">
                            <span className="truncate max-w-[190px] text-zinc-300">
                              🎯 {item.focusArea}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenWhatsApp(item.phone, item.memberName, item.time);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <MessageCircle className="w-2.5 h-2.5" />
                              Ingatkan WA
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {filteredSessions.length > 5 && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 pt-0.5">
                    <span>Menampilkan 5 sesi awal dari {filteredSessions.length} total</span>
                    <span className="flex items-center gap-1 text-orange-400/90 font-medium">
                      <span>Gulir daftar untuk sesi lainnya</span>
                      <ChevronDown className="w-3 h-3 animate-bounce" />
                    </span>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: KLIEN BINAAN */}
          {activeTab === 'klien' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-orange-500" />
                    Klien Binaan Coach Reza
                  </h3>
                  <p className="text-[10px] text-zinc-400">Total {clients.length} klien aktif terdaftar</p>
                </div>
                <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 font-bold">
                  Shift Siang
                </span>
              </div>

              {/* Search Bar Klien */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Cari nama klien, paket, atau target..."
                  className="w-full bg-[#111827] border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                {clientSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setClientSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-[460px] sm:max-h-[500px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-700/60 overscroll-contain rounded-2xl touch-pan-y">
                {filteredClients.map((c) => {
                  const quotaLeft = c.totalSessions - c.completedSessions;
                  const isExpiring = quotaLeft <= 2;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientDetail(c)}
                      className="bg-[#1f2937]/90 rounded-2xl p-3 border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)] hover:border-orange-500/50 transition cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-2.5">
                        {c.avatar && c.avatar.trim() ? (
                          <img
                            src={c.avatar.trim()}
                            alt={c.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-orange-400 text-xs shrink-0">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">{c.name}</h4>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                isExpiring
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              Sisa {quotaLeft} Sesi
                            </span>
                          </div>
                          <p className="text-[10px] text-orange-400 font-medium truncate mt-0.5">
                            {c.packageTitle}
                          </p>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                            🎯 {c.targetGoal}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500 text-[9.5px]">Aktif terakhir: {c.lastActive}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWhatsApp(c.phone, c.name, 'Jadwal Reguler');
                            }}
                            className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[9.5px] flex items-center gap-1 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                          >
                            <MessageCircle className="w-2.5 h-2.5" />
                            Chat WA
                          </button>
                          <span className="text-orange-400 text-[10px] font-bold flex items-center gap-0.5">
                            Detail <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredClients.length > 5 && (
                <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 pt-0.5">
                  <span>Menampilkan 5 awal dari {filteredClients.length} klien binaan</span>
                  <span className="flex items-center gap-1 text-orange-400/90 font-medium">
                    <span>Gulir untuk {filteredClients.length - 5} klien lainnya</span>
                    <ChevronDown className="w-3 h-3 animate-bounce" />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LOG LATIHAN */}
          {activeTab === 'log' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <FileEdit className="w-4 h-4 text-orange-500" />
                    Log Latihan & Progres Klien
                  </h3>
                  <p className="text-[10px] text-zinc-400">Catatan beban, repetisi & evaluasi pelatih</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFabModalOpen(true)}
                  className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  Tambah Log
                </button>
              </div>

              {/* Search Bar Log */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  placeholder="Cari log member, gerakan, atau fokus..."
                  className="w-full bg-[#111827] border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                {logSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setLogSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-[500px] sm:max-h-[540px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-700/60 overscroll-contain rounded-2xl touch-pan-y">
                {filteredWorkoutLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#1f2937]/90 rounded-2xl p-3 border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[170px] sm:max-w-none">{log.memberName}</h4>
                          <span className="text-[9.5px] px-1.5 py-0.2 bg-zinc-800 text-orange-400 rounded-md font-mono font-bold shrink-0">
                            Sesi {log.sessionNo}/{log.totalSession}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-zinc-400 mt-0.5">
                          {log.date} • {log.time} WIB ({log.duration})
                        </p>
                      </div>
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                        RPE {log.rpe}/10
                      </span>
                    </div>

                    <div className="bg-[#111827] rounded-xl p-2 border border-zinc-800 text-[10.5px] space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[10px]">
                        <Dumbbell className="w-3 h-3 text-orange-400" />
                        <span>Fokus: {log.focusMuscle}</span>
                      </div>
                      <p className="text-zinc-400 text-[9.5px] pl-4 leading-relaxed">
                        {log.coachNotes}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[9.5px] pt-0.5">
                      <span className="text-amber-400 font-medium truncate max-w-[210px]">🎯 Target: {log.nextTarget}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const client = clients.find((c) => c.name === log.memberName);
                          handleOpenWhatsApp(client?.phone || '081234567890', log.memberName, log.time);
                        }}
                        className="text-zinc-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer shrink-0"
                      >
                        <Share2 className="w-2.5 h-2.5 text-orange-400" />
                        Kirim WA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredWorkoutLogs.length > 5 && (
                <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 pt-0.5">
                  <span>Menampilkan 5 awal dari {filteredWorkoutLogs.length} riwayat log</span>
                  <span className="flex items-center gap-1 text-orange-400/90 font-medium">
                    <span>Gulir untuk melihat semua</span>
                    <ChevronDown className="w-3 h-3 animate-bounce" />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFIL & ESTIMASI FEE */}
          {activeTab === 'profil' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Profile Card */}
              <div className="bg-[#1f2937]/90 rounded-3xl p-4 border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_16px_rgba(0,0,0,0.35)] relative overflow-hidden">
                <div className="flex items-center gap-3.5">
                  <img
                    src={trainerAvatar}
                    alt={trainerDisplayName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shadow-lg"
                  />
                  <div>
                    <h3 className="text-base font-black text-white">{trainerDisplayName}</h3>
                    <p className="text-xs text-orange-400 font-semibold">{trainerRoleDisplay}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        Aktif Bertugas
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                        {trainerShift}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-800 text-xs">
                  <div className="bg-[#111827] p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">ID Pelatih</span>
                    <strong className="text-white font-mono">{trainerIdDisplay}</strong>
                  </div>
                  <div className="bg-[#111827] p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Spesialisasi</span>
                    <strong className="text-white truncate block">{trainerSpecDisplay}</strong>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown & Performance */}
              <div className="bg-[#1f2937]/90 rounded-3xl p-4 border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_16px_rgba(0,0,0,0.35)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    Rincian Fee & Komisi
                  </h4>
                  <span className="text-[10px] text-zinc-400 capitalize">
                    Bulan {currentDateTime.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-[#111827] rounded-xl border border-zinc-800">
                    <span className="text-zinc-300">
                      Estimasi Fee Hari Ini ({currentDateTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                    </span>
                    <strong className="text-emerald-400 font-mono font-bold">{formattedFee}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#111827] rounded-xl border border-zinc-800">
                    <span className="text-zinc-300">Total Sesi Selesai Bulan Ini</span>
                    <strong className="text-white font-mono font-bold">{monthlyCompletedCount} Sesi</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#111827] rounded-xl border border-zinc-800">
                    <span className="text-zinc-300">Akumulasi Fee Pelatih</span>
                    <strong className="text-orange-400 font-mono font-bold">Rp {accumulatedMonthlyFee}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[11px] text-zinc-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>
                    Fee dihitung otomatis sebesar <strong>Rp 60.000 / sesi</strong> saat presensi sesi divalidasi dan diselesaikan di portal.
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* 6. FLOATING ACTION AREA (FAB)                                            */}
        {/* Tombol FAB bulat oranye di kanan bawah dengan jarak ergonomis di atas navbar */}
        {/* ========================================================================= */}
        <div
          style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))' }}
          className="absolute right-3.5 sm:right-4 z-30"
        >
          <button
            type="button"
            onClick={() => setIsFabModalOpen(true)}
            aria-label="Jadwalkan Sesi Baru / Tambah Kegiatan"
            className="group flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-[0_8px_25px_rgba(249,115,22,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center text-orange-400">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="tracking-tight whitespace-nowrap">Jadwalkan Sesi</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 7. BOTTOM NAVIGATION BAR (PROFESSIONAL ELEVATED FLOATING DOCK)            */}
        {/* Ditinggikan di atas tepi bawah (14px + safe area), nyaman untuk satu tangan */}
        {/* ========================================================================= */}
        <nav
          style={{ bottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }}
          className="absolute left-3 right-3 sm:left-4 sm:right-4 h-[58px] bg-[#111827]/96 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl sm:rounded-3xl px-2 sm:px-3 flex items-center justify-around z-30 shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10"
        >
          {/* Tab 1: Jadwal */}
          <button
            type="button"
            onClick={() => setActiveTab('jadwal')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-h-[44px] rounded-xl relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'jadwal'
                ? 'text-orange-400 font-bold bg-orange-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Calendar className={`w-4.5 h-4.5 transition-transform duration-200 ${activeTab === 'jadwal' ? 'text-orange-500 scale-110' : ''}`} />
            <span className="text-[9.5px] tracking-tight leading-none font-medium truncate">Jadwal</span>
            {activeTab === 'jadwal' && (
              <span className="w-3.5 h-0.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] animate-in fade-in"></span>
            )}
          </button>

          {/* Tab 2: Klien */}
          <button
            type="button"
            onClick={() => setActiveTab('klien')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-h-[44px] rounded-xl relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'klien'
                ? 'text-orange-400 font-bold bg-orange-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Users className={`w-4.5 h-4.5 transition-transform duration-200 ${activeTab === 'klien' ? 'text-orange-500 scale-110' : ''}`} />
            <span className="text-[9.5px] tracking-tight leading-none font-medium truncate">Klien</span>
            {activeTab === 'klien' && (
              <span className="w-3.5 h-0.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] animate-in fade-in"></span>
            )}
          </button>

          {/* Tab 3: Log Latihan */}
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-h-[44px] rounded-xl relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'log'
                ? 'text-orange-400 font-bold bg-orange-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <FileEdit className={`w-4.5 h-4.5 transition-transform duration-200 ${activeTab === 'log' ? 'text-orange-500 scale-110' : ''}`} />
            <span className="text-[9.5px] tracking-tight leading-none font-medium truncate">Log</span>
            {activeTab === 'log' && (
              <span className="w-3.5 h-0.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] animate-in fade-in"></span>
            )}
          </button>

          {/* Tab 4: Profil & Fee */}
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-h-[44px] rounded-xl relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'profil'
                ? 'text-orange-400 font-bold bg-orange-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Wallet className={`w-4.5 h-4.5 transition-transform duration-200 ${activeTab === 'profil' ? 'text-orange-500 scale-110' : ''}`} />
            <span className="text-[9.5px] tracking-tight leading-none font-medium truncate">Profil & Fee</span>
            {activeTab === 'profil' && (
              <span className="w-3.5 h-0.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] animate-in fade-in"></span>
            )}
          </button>
        </nav>

        {/* ========================================================================= */}
        {/* INTERACTIVE MODAL: MULAI SESI & PRESENSI DIGITAL                           */}
        {/* ========================================================================= */}
        {activeSessionModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end p-0 animate-fadeIn">
            <div className="bg-[#182133] rounded-t-[32px] border-t-2 border-orange-500 p-5 space-y-4 max-h-[90%] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                  <h3 className="text-base font-black text-white">Presensi & Sesi Latihan</h3>
                </div>
                <button
                  onClick={() => setActiveSessionModal(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Client Info Banner */}
              <div className="flex items-center gap-3 bg-[#111827] p-3 rounded-2xl border border-zinc-800">
                {activeSessionModal.avatar && activeSessionModal.avatar.trim() ? (
                  <img
                    src={activeSessionModal.avatar.trim()}
                    alt={activeSessionModal.memberName}
                    className="w-12 h-12 rounded-xl object-cover border border-orange-500 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-orange-500 flex items-center justify-center font-bold text-orange-400 text-sm shrink-0">
                    {activeSessionModal.memberName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{activeSessionModal.memberName}</h4>
                  <p className="text-xs text-orange-400">{activeSessionModal.sessionInfo}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Jadwal:{' '}
                    {(() => {
                      const isToday = !activeSessionModal.date || activeSessionModal.date === APP_TODAY;
                      const dayName = getDayNameIndo(activeSessionModal.date || APP_TODAY);
                      return isToday
                        ? `Hari Ini (${dayName}), ${activeSessionModal.time} WIB`
                        : `${dayName}, ${formatDateIndo(activeSessionModal.date || APP_TODAY)}, ${activeSessionModal.time} WIB`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Live Stopwatch Indicator */}
              <div className="bg-[#111827] p-4 rounded-2xl border border-zinc-800 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
                  <Timer className="w-4 h-4 text-orange-400" />
                  <span>Durasi Sesi Berjalan</span>
                </div>
                <div className="text-3xl font-mono font-black text-orange-400 tracking-wider">
                  {formatStopwatch(sessionTimer)}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {isTimerRunning ? 'Jeda Stopwatch' : 'Lanjutkan Stopwatch'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionTimer(0)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Rest Interval Countdown Bar */}
              <div className="bg-[#111827] p-3 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Jeda Istirahat Antar Set (Rest Interval)</span>
                  </span>
                  {isRestRunning && (
                    <span className="text-amber-400 font-mono font-black animate-pulse">
                      {restSecondsLeft}s Tersisa
                    </span>
                  )}
                </div>

                {isRestRunning && (
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (restSecondsLeft / (restInitialDuration || 60)) * 100)}%`
                      }}
                    ></div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500">Mulai Jeda:</span>
                  {[30, 45, 60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleStartRestTimer(sec)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        isRestRunning && restInitialDuration === sec
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-800/80 text-zinc-300 hover:text-white border-zinc-700'
                      }`}
                    >
                      {sec}d
                    </button>
                  ))}
                  {isRestRunning && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRestRunning(false);
                        setRestSecondsLeft(0);
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 ml-auto font-bold cursor-pointer"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>

              {/* Intensity RPE Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-semibold">Tingkat Intensitas (RPE Rate)</span>
                  <span className="text-orange-400 font-bold">{rpeRating} / 10</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="10"
                  value={rpeRating}
                  onChange={(e) => setRpeRating(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Coach Evaluation Note */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-300 font-semibold">Catatan Evaluasi Gerakan & Set:</label>
                <textarea
                  rows={2}
                  value={sessionNotesInput}
                  onChange={(e) => setSessionNotesInput(e.target.value)}
                  placeholder="Contoh: Form deadlift bagus, tambahkan 5kg beban sesi depan."
                  className="w-full bg-[#111827] border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCompleteActiveSession}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer uppercase"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validasi & Selesaikan Sesi (+Rp 60.000)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSessionModal(null)}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Tutup / Simpan Sementara
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE MODAL: JADWALKAN SESI BARU (FAB MODAL)                         */}
        {/* ========================================================================= */}
        {isFabModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end p-0 animate-fadeIn">
            <div className="bg-[#182133] rounded-t-[32px] border-t-2 border-orange-500 p-5 space-y-4 max-h-[90%] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-500" />
                  <h3 className="text-base font-black text-white">Jadwalkan Sesi Baru</h3>
                </div>
                <button
                  onClick={() => setIsFabModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSessionFromFab} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Pilih Klien Binaan:</label>
                  <select
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[#111827] border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.packageTitle.slice(0, 24)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">Jam Latihan:</label>
                    <input
                      type="time"
                      value={newSessionTime}
                      onChange={(e) => setNewSessionTime(e.target.value)}
                      className="w-full bg-[#111827] border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">Durasi:</label>
                    <input
                      type="text"
                      disabled
                      value="60 Menit"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Fokus Program Latihan:</label>
                  <input
                    type="text"
                    value={newFocusArea}
                    onChange={(e) => setNewFocusArea(e.target.value)}
                    placeholder="Contoh: Chest & Triceps, Leg Day, dll"
                    className="w-full bg-[#111827] border border-zinc-800 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-black rounded-xl shadow-lg shadow-orange-500/25 active:scale-98 transition cursor-pointer"
                  >
                    Simpan Jadwal Sesi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFabModalOpen(false)}
                    className="w-full py-2 bg-zinc-800 text-zinc-400 rounded-xl font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE MODAL: DETAIL KLIEN                                           */}
        {/* ========================================================================= */}
        {selectedClientDetail && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end p-0 animate-fadeIn">
            <div className="bg-[#182133] rounded-t-[32px] border-t-2 border-orange-500 p-5 space-y-3.5 max-h-[85%] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="text-base font-black text-white">Profil Klien Binaan</h3>
                <button
                  onClick={() => setSelectedClientDetail(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {selectedClientDetail.avatar && selectedClientDetail.avatar.trim() ? (
                  <img
                    src={selectedClientDetail.avatar.trim()}
                    alt={selectedClientDetail.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-orange-500 flex items-center justify-center font-bold text-orange-400 text-base shrink-0">
                    {selectedClientDetail.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-white">{selectedClientDetail.name}</h4>
                  <p className="text-xs text-orange-400">{selectedClientDetail.packageTitle}</p>
                  <p className="text-[10px] text-zinc-400">Telp: {selectedClientDetail.phone}</p>
                </div>
              </div>

              <div className="bg-[#111827] p-3 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Target Utama Klien:</span>
                  <p className="text-zinc-200 font-semibold">{selectedClientDetail.targetGoal}</p>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Catatan Medis / Fisik:</span>
                  <p className="text-amber-400 font-medium">{selectedClientDetail.healthNote}</p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenWhatsApp(selectedClientDetail.phone, selectedClientDetail.name, 'Jadwal Baru');
                    setSelectedClientDetail(null);
                  }}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  Hubungi via WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE TOAST FEEDBACK FLOATING NOTIFICATION                          */}
        {/* ========================================================================= */}
        {toastMessage && (
          <div className="absolute top-14 left-4 right-4 z-50 animate-bounce">
            <div className="bg-gradient-to-r from-zinc-900 via-[#1e2738] to-zinc-900 border border-orange-500/70 p-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs text-white">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="flex-1 font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

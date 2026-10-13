import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageSquare,
  Search,
  Filter,
  Dumbbell,
  TrendingUp,
  Award,
  Sparkles,
  Phone,
  FileText,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  Flame,
  Target,
  ShieldCheck,
  Edit3,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Lightbulb,
  HeartPulse,
  Activity,
  ArrowUpRight,
  ClipboardCheck,
  Lock,
  Shield,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Share2,
  Scale,
  Timer,
  Zap,
  BarChart3,
  ChevronDown,
  CheckCheck,
  Save,
  Smartphone
} from 'lucide-react';
import { Schedule, Member, User as UserType, PTPurchaseRecord, TrainerWorkoutLog, TrainerAttendanceLog } from '../types';
import { formatDateIndo, APP_TODAY } from '../utils/formatters';
import { INITIAL_TRAINER_ATTENDANCE_LOGS } from '../data/trainerAttendanceData';
import { TrainerAttendanceLogView } from './TrainerAttendanceLogView';
import { TrainerMobileFocusPortal } from './TrainerMobileFocusPortal';

interface TrainerPortalViewProps {
  currentUser: UserType | null;
  staffUsers: UserType[];
  onSwitchUser: (userId: string) => void;
  schedules: Schedule[];
  onAddSchedule: (schedule: Schedule) => void;
  onUpdateSchedule: (schedule: Schedule) => void;
  members: Member[];
  onUpdateMember?: (member: Member) => void;
  ptPurchases: PTPurchaseRecord[];
  onOpenSignature: (scheduleId: string, targetRole: 'valStaf' | 'valTrainer' | 'valMember') => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onNavigateTab: (tab: any) => void;
  initialSubTab?: 'jadwal' | 'klien' | 'log' | 'attendance' | 'performa' | 'rekomendasi';
}

import {
  INITIAL_WORKOUT_LOGS,
  loadWorkoutLogsFromStorage,
  saveWorkoutLogsToStorage
} from '../data/workoutLogData';

export const TrainerPortalView: React.FC<TrainerPortalViewProps> = ({
  currentUser,
  staffUsers,
  onSwitchUser,
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  members,
  onUpdateMember,
  ptPurchases,
  onOpenSignature,
  showToast,
  onNavigateTab,
  initialSubTab
}) => {
  // Filter all staff that are trainers or PT leaders
  const trainerAccounts = useMemo(() => {
    return staffUsers.filter((u) => u.role === 'pt' || u.role === 'leader_pt');
  }, [staffUsers]);

  // Determine active trainer context
  // If current user is a trainer, use them; otherwise default to first PT (Reza Pratama or currentUser)
  const activeTrainer = useMemo(() => {
    if (currentUser?.role === 'pt' || currentUser?.role === 'leader_pt') {
      return currentUser;
    }
    const defaultPT = trainerAccounts.find((t) => t.accId === 'pt') || trainerAccounts[0] || currentUser;
    return defaultPT;
  }, [currentUser, trainerAccounts]);

  const activeTrainerName = activeTrainer?.name || 'Reza Pratama';
  const activeTrainerId = activeTrainer?.id || 'S04';

  // Hanya Leader PT (Head Coach), Admin, dan Manager yang memiliki hak akses untuk fitur Akses Cepat 1-Klik Pindah Akun Pelatih
  const isLeaderOrAdmin =
    currentUser?.role === 'leader_pt' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager';

  const handleSwitchTrainer = (trainerId: string) => {
    if (!isLeaderOrAdmin) {
      showToast(
        'Akses Terbatas 🔒',
        'Fitur mode pelatih akses cepat 1-klik hanya dapat diakses oleh Leader PT dan Admin.',
        'warning'
      );
      return;
    }
    onSwitchUser(trainerId);
  };

  // Sub-tabs within Trainer Portal
  const [activeTab, setActiveTab] = useState<'jadwal' | 'klien' | 'log' | 'attendance' | 'performa' | 'rekomendasi'>(initialSubTab || 'jadwal');
  const [isMobileMode, setIsMobileMode] = useState(false);

  // Trainer Attendance Logs State (Persisted in localStorage)
  const [attendanceLogs, setAttendanceLogs] = useState<TrainerAttendanceLog[]>(() => {
    const saved = localStorage.getItem('rfa_trainer_attendance_logs');
    if (!saved) return INITIAL_TRAINER_ATTENDANCE_LOGS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TRAINER_ATTENDANCE_LOGS;
    } catch {
      return INITIAL_TRAINER_ATTENDANCE_LOGS;
    }
  });

  const handleUpdateAttendanceList = (newList: TrainerAttendanceLog[]) => {
    setAttendanceLogs(newList);
    localStorage.setItem('rfa_trainer_attendance_logs', JSON.stringify(newList));
  };

  // Monthly sessions attended by this active trainer in current month
  const currentMonthPrefix = APP_TODAY.slice(0, 7); // '2026-09'
  const monthlyTrainerAttendanceCount = useMemo(() => {
    return attendanceLogs.filter(
      (l) =>
        (l.trainerId === activeTrainerId || l.trainerName === activeTrainerName) &&
        l.date.startsWith(currentMonthPrefix) &&
        l.status === 'Selesai'
    ).length;
  }, [attendanceLogs, activeTrainerId, activeTrainerName, currentMonthPrefix]);

  const activeRunningSessionCount = useMemo(() => {
    return attendanceLogs.filter(
      (l) =>
        (l.trainerId === activeTrainerId || l.trainerName === activeTrainerName) &&
        l.status === 'Checked In'
    ).length;
  }, [attendanceLogs, activeTrainerId, activeTrainerName]);

  // Schedule filtering inside Trainer Portal
  const [scheduleDateFilter, setScheduleDateFilter] = useState<'today' | 'week' | 'all'>('today');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<'all' | 'Menunggu' | 'Selesai'>('all');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Workout Logs State (Persisted in localStorage)
  const [workoutLogs, setWorkoutLogs] = useState<TrainerWorkoutLog[]>(() => {
    return loadWorkoutLogsFromStorage();
  });

  const saveWorkoutLogs = (logs: TrainerWorkoutLog[]) => {
    setWorkoutLogs(logs);
    saveWorkoutLogsToStorage(logs);
  };

  // Modal: Add / Edit Workout Log (Mode Fokus Pelatih)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedScheduleForLog, setSelectedScheduleForLog] = useState<Schedule | null>(null);
  const [selectedClientForLog, setSelectedClientForLog] = useState<{
    memberId: string;
    memberName: string;
    phone: string;
    ptQuota: number;
    photo: string;
    packageName: string;
    totalPurchased: number;
    completedCount: number;
    lastSessionDate?: string;
  } | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Form Fields for Mode Fokus Pelatih
  const [logDate, setLogDate] = useState(APP_TODAY);
  const [logTime, setLogTime] = useState('17:00');
  const [logDuration, setLogDuration] = useState<number>(60);
  const [logSessionNumber, setLogSessionNumber] = useState<number>(1);
  const [logFocusArea, setLogFocusArea] = useState('Chest & Triceps Hypertrophy');
  const [logExercises, setLogExercises] = useState('');
  const [logRPE, setLogRPE] = useState<number>(8);
  const [logCondition, setLogCondition] = useState<string>('Prima & Bertenaga');
  const [logFormQuality, setLogFormQuality] = useState<'Sempurna' | 'Baik' | 'Perlu Perbaikan Form' | 'Kurang Stabil'>('Baik');
  const [logCoachNotes, setLogCoachNotes] = useState('');
  const [logNextGoal, setLogNextGoal] = useState('');
  const [logWeightProgressKg, setLogWeightProgressKg] = useState<string>('');
  const [logAutoValidateSession, setLogAutoValidateSession] = useState<boolean>(false);

  // Focus Mode Live Session Stopwatch & Rest Interval Countdown
  const [isFocusTimerRunning, setIsFocusTimerRunning] = useState(false);
  const [focusSecondsElapsed, setFocusSecondsElapsed] = useState(0);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [activeSetCount, setActiveSetCount] = useState(1);

  // Modal: Client Workout History & Detail Progress
  const [clientHistoryModal, setClientHistoryModal] = useState<{
    memberId: string;
    memberName: string;
    phone: string;
    ptQuota: number;
    photo: string;
    packageName: string;
    totalPurchased: number;
    completedCount: number;
    lastSessionDate?: string;
  } | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFocusFilter, setHistoryFocusFilter] = useState('all');

  // Client List Filter & Search in Tab Klien Binaan
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientFilterStatus, setClientFilterStatus] = useState<'all' | 'renewal' | 'has_logs' | 'no_logs'>('all');

  // Live Timer Interval Effects
  useEffect(() => {
    let interval: any = null;
    if (isFocusTimerRunning) {
      interval = setInterval(() => {
        setFocusSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusTimerRunning]);

  useEffect(() => {
    let interval: any = null;
    if (isRestTimerRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsRestTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestTimerRunning, restTimerSeconds]);

  const formatTimerDigits = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Modal: Quick Add Schedule from Trainer Portal
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [newSchMemberId, setNewSchMemberId] = useState('');
  const [newSchDate, setNewSchDate] = useState(APP_TODAY);
  const [newSchTime, setNewSchTime] = useState('10:00');
  const [newSchNote, setNewSchNote] = useState('');

  // Modal: Reschedule
  const [rescheduleTarget, setRescheduleTarget] = useState<Schedule | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Filter schedules strictly for this active trainer
  const trainerSchedules = useMemo(() => {
    return schedules.filter((s) => s.trainer === activeTrainerName);
  }, [schedules, activeTrainerName]);

  // Today's schedules for this trainer
  const todaySchedules = useMemo(() => {
    return trainerSchedules
      .filter((s) => s.date === APP_TODAY)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [trainerSchedules]);

  // Next up session (first waiting session today, or next scheduled session)
  const upNextSession = useMemo(() => {
    const todayWaiting = todaySchedules.find((s) => s.status === 'Menunggu');
    if (todayWaiting) return todayWaiting;
    const futureWaiting = trainerSchedules
      .filter((s) => s.date >= APP_TODAY && s.status === 'Menunggu')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    return futureWaiting[0] || null;
  }, [todaySchedules, trainerSchedules]);

  // Filtered schedules for Schedule Tab
  const displayedSchedules = useMemo(() => {
    return trainerSchedules
      .filter((s) => {
        // Date filter
        if (scheduleDateFilter === 'today' && s.date !== APP_TODAY) return false;
        if (scheduleDateFilter === 'week') {
          // simple 7 day horizon check
          if (s.date < APP_TODAY) return false;
        }
        // Status filter
        if (scheduleStatusFilter !== 'all' && s.status !== scheduleStatusFilter) return false;
        // Search query
        if (searchMemberQuery.trim()) {
          const q = searchMemberQuery.toLowerCase();
          const matchName = s.memberName.toLowerCase().includes(q);
          const matchNote = (s.note || '').toLowerCase().includes(q);
          if (!matchName && !matchNote) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date); // newest date first
        return a.time.localeCompare(b.time);
      });
  }, [trainerSchedules, scheduleDateFilter, scheduleStatusFilter, searchMemberQuery]);

  // Trainees (Clients) for this active trainer
  const myClients = useMemo(() => {
    // Collect from schedules and ptPurchases
    const clientMap = new Map<string, {
      memberId: string;
      memberName: string;
      phone: string;
      ptQuota: number;
      photo: string;
      lastSessionDate: string;
      totalPurchased: number;
      completedCount: number;
      packageName: string;
    }>();

    // From PT Purchases
    ptPurchases
      .filter((p) => p.trainerName === activeTrainerName || p.trainerId === activeTrainerId)
      .forEach((p) => {
        const mem = members.find((m) => m.id === p.memberId);
        clientMap.set(p.memberId, {
          memberId: p.memberId,
          memberName: p.memberName,
          phone: mem?.phone || '081234567890',
          ptQuota: mem?.ptQuota ?? Math.max(0, p.totalSessions - p.completedSessions),
          photo: mem?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          lastSessionDate: p.date,
          totalPurchased: p.totalSessions,
          completedCount: p.completedSessions,
          packageName: p.packageName
        });
      });

    // Also from schedules
    trainerSchedules.forEach((s) => {
      const existing = clientMap.get(s.memberId);
      const mem = members.find((m) => m.id === s.memberId);
      if (!existing) {
        clientMap.set(s.memberId, {
          memberId: s.memberId,
          memberName: s.memberName,
          phone: mem?.phone || '081234567890',
          ptQuota: mem?.ptQuota || 2,
          photo: mem?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          lastSessionDate: s.date,
          totalPurchased: 10,
          completedCount: s.status === 'Selesai' ? 1 : 0,
          packageName: 'Program Personal Trainer'
        });
      } else {
        if (s.date > existing.lastSessionDate) {
          existing.lastSessionDate = s.date;
        }
      }
    });

    return Array.from(clientMap.values());
  }, [ptPurchases, trainerSchedules, members, activeTrainerName, activeTrainerId]);

  // Trainer KPIs & Earnings Calculator
  const kpis = useMemo(() => {
    const totalSessions = trainerSchedules.length;
    const completedSessions = trainerSchedules.filter((s) => s.status === 'Selesai').length;
    const waitingSessions = trainerSchedules.filter((s) => s.status === 'Menunggu').length;
    const todayTotal = todaySchedules.length;
    const todayDone = todaySchedules.filter((s) => s.status === 'Selesai').length;

    // Commission estimate: Rp 60.000 per completed session
    const feePerSession = 60000;
    const estimatedEarnings = completedSessions * feePerSession;
    const monthlyTarget = 30; // 30 sessions target
    const targetProgress = Math.min(100, Math.round((completedSessions / monthlyTarget) * 100));

    return {
      totalSessions,
      completedSessions,
      waitingSessions,
      todayTotal,
      todayDone,
      estimatedEarnings,
      feePerSession,
      monthlyTarget,
      targetProgress,
      totalClients: myClients.length
    };
  }, [trainerSchedules, todaySchedules, myClients.length]);

  // Filtered workout logs for this trainer
  const trainerLogs = useMemo(() => {
    return workoutLogs
      .filter((l) => l.trainerName === activeTrainerName || l.trainerId === activeTrainerId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [workoutLogs, activeTrainerName, activeTrainerId]);

  // Handler: Fast 1-Click Trainer Validation & Session Completion
  const handleQuickValidateSession = (schedule: Schedule) => {
    const updated: Schedule = {
      ...schedule,
      valTrainer: true
    };

    // If staff and member were already validated, mark completed and deduct member quota
    if (updated.valStaf && updated.valMember) {
      updated.status = 'Selesai';
      if (onUpdateMember) {
        const mem = members.find((m) => m.id === schedule.memberId);
        if (mem && mem.ptQuota > 0) {
          onUpdateMember({ ...mem, ptQuota: mem.ptQuota - 1 });
        }
      }
      showToast(
        'Sesi Selesai & Valid!',
        `Sesi ${schedule.memberName} lengkap tervalidasi 3 pihak. Kuota berkurang 1.`,
        'success'
      );
    } else {
      showToast(
        'Tanda Tangan Trainer Berhasil',
        `Trainer ${activeTrainerName} telah memvalidasi sesi ${schedule.memberName}.`,
        'info'
      );
    }

    onUpdateSchedule(updated);
  };

  // Handler: Open Log Modal for a Specific Client (Mode Fokus Pelatih)
  const handleOpenLogForClient = (
    client: {
      memberId: string;
      memberName: string;
      phone: string;
      ptQuota: number;
      photo: string;
      packageName: string;
      totalPurchased: number;
      completedCount: number;
      lastSessionDate?: string;
    },
    existingLog?: TrainerWorkoutLog
  ) => {
    setSelectedClientForLog(client);
    setSelectedScheduleForLog(null);

    const pastLogs = workoutLogs.filter((l) => l.memberId === client.memberId);

    if (existingLog) {
      setEditingLogId(existingLog.id);
      setLogDate(existingLog.date);
      setLogTime(existingLog.time || '17:00');
      setLogDuration(existingLog.durationMinutes || 60);
      setLogSessionNumber(existingLog.sessionNumber || (pastLogs.length > 0 ? pastLogs.length : 1));
      setLogFocusArea(existingLog.focusArea);
      setLogExercises(existingLog.exercisesSummary);
      setLogRPE(existingLog.rpeRate);
      setLogCondition(existingLog.condition as any);
      setLogFormQuality(existingLog.formQuality || 'Baik');
      setLogCoachNotes(existingLog.coachNotes);
      setLogNextGoal(existingLog.nextSessionGoal);
      setLogWeightProgressKg(existingLog.weightProgressKg ? String(existingLog.weightProgressKg) : '');
      setLogAutoValidateSession(false);
    } else {
      setEditingLogId(null);
      // Check if client has a scheduled session today
      const todaySch = trainerSchedules.find((s) => s.memberId === client.memberId && s.date === APP_TODAY);
      setLogDate(APP_TODAY);
      setLogTime(todaySch ? todaySch.time : '17:00');
      setLogDuration(60);
      setLogSessionNumber(pastLogs.length + 1);
      setLogFocusArea(todaySch?.note || 'Chest & Triceps Hypertrophy');
      setLogExercises('');
      setLogRPE(8);
      setLogCondition('Prima & Bertenaga');
      setLogFormQuality('Baik');
      setLogCoachNotes('');
      setLogNextGoal('');
      setLogWeightProgressKg('');
      setLogAutoValidateSession(todaySch ? todaySch.status === 'Menunggu' : false);
    }

    // Reset and start live session stopwatch
    setFocusSecondsElapsed(0);
    setIsFocusTimerRunning(true);
    setRestTimerSeconds(0);
    setIsRestTimerRunning(false);
    setActiveSetCount(1);

    setIsLogModalOpen(true);
  };

  // Handler: Open Log Modal for a Schedule
  const handleOpenLogForSchedule = (schedule: Schedule) => {
    setSelectedScheduleForLog(schedule);
    const client = myClients.find((c) => c.memberId === schedule.memberId) || {
      memberId: schedule.memberId,
      memberName: schedule.memberName,
      phone: '081234567890',
      ptQuota: 5,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      packageName: 'Program Personal Trainer',
      totalPurchased: 10,
      completedCount: 1,
      lastSessionDate: schedule.date
    };
    setSelectedClientForLog(client);

    const existingLog = workoutLogs.find((l) => l.scheduleId === schedule.id);
    const pastLogs = workoutLogs.filter((l) => l.memberId === schedule.memberId);

    if (existingLog) {
      setEditingLogId(existingLog.id);
      setLogDate(existingLog.date);
      setLogTime(existingLog.time || schedule.time);
      setLogDuration(existingLog.durationMinutes || 60);
      setLogSessionNumber(existingLog.sessionNumber || schedule.sessionNumber || 1);
      setLogFocusArea(existingLog.focusArea);
      setLogExercises(existingLog.exercisesSummary);
      setLogRPE(existingLog.rpeRate);
      setLogCondition(existingLog.condition as any);
      setLogFormQuality(existingLog.formQuality || 'Baik');
      setLogCoachNotes(existingLog.coachNotes);
      setLogNextGoal(existingLog.nextSessionGoal);
      setLogWeightProgressKg(existingLog.weightProgressKg ? String(existingLog.weightProgressKg) : '');
      setLogAutoValidateSession(false);
    } else {
      setEditingLogId(null);
      setLogDate(schedule.date);
      setLogTime(schedule.time);
      setLogDuration(60);
      setLogSessionNumber(schedule.sessionNumber || pastLogs.length + 1);
      setLogFocusArea(schedule.note || 'Chest & Triceps Hypertrophy');
      setLogExercises('');
      setLogRPE(8);
      setLogCondition('Prima & Bertenaga');
      setLogFormQuality('Baik');
      setLogCoachNotes('');
      setLogNextGoal('');
      setLogWeightProgressKg('');
      setLogAutoValidateSession(schedule.status === 'Menunggu');
    }

    setFocusSecondsElapsed(0);
    setIsFocusTimerRunning(true);
    setRestTimerSeconds(0);
    setIsRestTimerRunning(false);
    setActiveSetCount(1);

    setIsLogModalOpen(true);
  };

  // Handler: Save Workout Log
  const handleSaveWorkoutLog = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMemberId = selectedClientForLog?.memberId || selectedScheduleForLog?.memberId;
    const targetMemberName = selectedClientForLog?.memberName || selectedScheduleForLog?.memberName || 'Member';

    if (!targetMemberId) return;

    const existingIndex = editingLogId
      ? workoutLogs.findIndex((l) => l.id === editingLogId)
      : selectedScheduleForLog
      ? workoutLogs.findIndex((l) => l.scheduleId === selectedScheduleForLog.id)
      : -1;

    const newEntry: TrainerWorkoutLog = {
      id: editingLogId || (existingIndex >= 0 ? workoutLogs[existingIndex].id : 'LOG-' + Date.now()),
      scheduleId: selectedScheduleForLog?.id,
      trainerId: activeTrainerId,
      trainerName: activeTrainerName,
      memberId: targetMemberId,
      memberName: targetMemberName,
      date: logDate,
      time: logTime,
      sessionNumber: logSessionNumber,
      durationMinutes: logDuration,
      focusArea: logFocusArea,
      exercisesSummary: logExercises || 'Latihan sesuai program periodisasi harian.',
      rpeRate: logRPE,
      condition: logCondition,
      formQuality: logFormQuality,
      coachNotes: logCoachNotes || 'Sesi berlangsung dengan intensitas terukur dan form solid.',
      nextSessionGoal: logNextGoal || 'Melanjutkan progres beban dan konsistensi diet protein.',
      weightProgressKg: logWeightProgressKg ? Number(logWeightProgressKg) : undefined,
      createdAt: APP_TODAY
    };

    let updatedLogs: TrainerWorkoutLog[];
    if (existingIndex >= 0) {
      updatedLogs = [...workoutLogs];
      updatedLogs[existingIndex] = newEntry;
    } else {
      updatedLogs = [newEntry, ...workoutLogs];
    }

    saveWorkoutLogs(updatedLogs);

    // If auto-validate session is checked:
    if (logAutoValidateSession) {
      const matchSchedule =
        selectedScheduleForLog ||
        trainerSchedules.find((s) => s.memberId === targetMemberId && s.date === logDate);
      if (matchSchedule) {
        onUpdateSchedule({
          ...matchSchedule,
          status: 'Selesai',
          valTrainer: true,
          valStaf: true,
          valMember: true
        });
        if (onUpdateMember) {
          const mem = members.find((m) => m.id === targetMemberId);
          if (mem && mem.ptQuota > 0) {
            onUpdateMember({ ...mem, ptQuota: mem.ptQuota - 1 });
          }
        }
      }
    }

    setIsLogModalOpen(false);
    setIsFocusTimerRunning(false);
    setIsRestTimerRunning(false);

    showToast(
      'Log Latihan Disimpan 🏋️',
      `Catatan sesi (${formatDateIndo(logDate)}) untuk ${targetMemberName} berhasil disimpan.`,
      'success'
    );
  };

  // Handler: Delete Workout Log
  const handleDeleteWorkoutLog = (logId: string) => {
    const updated = workoutLogs.filter((l) => l.id !== logId);
    saveWorkoutLogs(updated);
    showToast('Log Dihapus', 'Catatan latihan telah dihapus dari sistem.', 'info');
  };

  // Handler: Share Workout to WhatsApp
  const handleShareWorkoutToWhatsApp = (log: TrainerWorkoutLog) => {
    const mem = members.find((m) => m.id === log.memberId);
    const phone = mem?.phone ? mem.phone.replace(/[^0-9]/g, '') : '6281234567890';
    const formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;

    const message = encodeURIComponent(
      `Halo Kak ${log.memberName}! 💪\n\nBerikut ringkasan hasil latihan Sesi Personal Trainer kita bersama Coach ${activeTrainerName}:\n\n📅 Tanggal: ${formatDateIndo(log.date)}\n⏰ Pukul: ${log.time || '17:00'} WIB (${log.durationMinutes || 60} Menit)\n🔢 Sesi Ke-: ${log.sessionNumber || '-'}\n🎯 Fokus Otot: ${log.focusArea}\n⚡ Intensitas: RPE ${log.rpeRate}/10 (${log.condition})\n⭐ Kualitas Form: ${log.formQuality || 'Baik'}${log.weightProgressKg ? `\n⚖️ Berat Badan: ${log.weightProgressKg} kg` : ''}\n\n📋 Rincian Gerakan & Beban:\n${log.exercisesSummary}\n\n📝 Evaluasi Pelatih:\n${log.coachNotes || '-'}\n\n🏆 Target Sesi Berikutnya:\n${log.nextSessionGoal || '-'}\n\nTerus jaga konsistensi, hidrasi, dan nutrisi proteinmu! Sampai jumpa di sesi berikutnya! 🚀`
    );

    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    showToast('WhatsApp Dibuka', `Membuka laporan sesi latihan untuk dikirim ke ${log.memberName}.`, 'info');
  };

  // Handler: Send WhatsApp Reminder
  const handleSendWhatsAppReminder = (schedule: Schedule) => {
    const mem = members.find((m) => m.id === schedule.memberId);
    const phone = mem?.phone ? mem.phone.replace(/[^0-9]/g, '') : '6281234567890';
    const formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;

    const message = encodeURIComponent(
      `Halo Kak ${schedule.memberName}! 💪\n\nIni Trainer ${activeTrainerName} dari RFA GYM.\nMengingatkan jadwal sesi Personal Training kita:\n📅 Hari/Tgl: ${formatDateIndo(schedule.date)}\n⏰ Pukul: ${schedule.time} WIB\n🏋️ Fokus: ${schedule.note || 'Latihan Sesi PT'}\n\nJangan lupa bawa pakaian olahraga yang nyaman, handuk, dan botol minum ya. Sampai bertemu di gym!`
    );

    const waUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(waUrl, '_blank');
    showToast('WhatsApp Dibuka', `Membuka pesan pengingat untuk ${schedule.memberName}.`, 'info');
  };

  // Handler: Quick Add Schedule
  const handleCreateQuickSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find((m) => m.id === newSchMemberId);
    if (!mem) {
      showToast('Peringatan', 'Pilih member binaan terlebih dahulu.', 'warning');
      return;
    }

    const newSch: Schedule = {
      id: 'SCH-' + Date.now(),
      memberName: mem.name,
      memberId: mem.id,
      trainer: activeTrainerName,
      date: newSchDate,
      time: newSchTime,
      status: 'Menunggu',
      valStaf: false,
      valTrainer: false,
      valMember: false,
      note: newSchNote || 'Program sesi Personal Training'
    };

    onAddSchedule(newSch);
    setIsAddScheduleModalOpen(false);
    setNewSchMemberId('');
    setNewSchNote('');
    showToast('Jadwal Ditambahkan', `Sesi dengan ${mem.name} pada ${formatDateIndo(newSchDate)} jam ${newSchTime} telah dibuat.`, 'success');
  };

  // Handler: Submit Reschedule
  const handleConfirmReschedule = () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;

    const updated: Schedule = {
      ...rescheduleTarget,
      date: rescheduleDate,
      time: rescheduleTime,
      status: 'Reschedule',
      valStaf: false,
      valTrainer: false,
      valMember: false,
      note: (rescheduleTarget.note || '') + ` (Rescheduled ke ${rescheduleDate} ${rescheduleTime})`
    };

    onUpdateSchedule(updated);
    setRescheduleTarget(null);
    showToast('Reschedule Berhasil', `Jadwal ${rescheduleTarget.memberName} dipindahkan ke ${formatDateIndo(rescheduleDate)} ${rescheduleTime}.`, 'info');
  };

  if (isMobileMode) {
    return (
      <TrainerMobileFocusPortal
        onBackToDesktop={() => setIsMobileMode(false)}
        currentUser={activeTrainer}
        schedules={schedules}
        members={members}
        workoutLogs={workoutLogs}
        ptPurchases={ptPurchases}
        onAddSchedule={onAddSchedule}
        onUpdateSchedule={onUpdateSchedule}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TRAINER FOCUSED HEADER & QUICK TRAINER ACCOUNT SWITCHER                */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950/40 border border-orange-500/20 p-5 sm:p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Trainer Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <img
                src={activeTrainer?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'}
                alt={activeTrainerName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-orange-500 shadow-xl shadow-orange-500/20"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-zinc-950 font-black">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 tracking-wider">
                  Mode Fokus Pelatih (Trainer View)
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Shift {activeTrainer?.shift || 'Pagi'}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Aktif Bertugas
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileMode(true)}
                  className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>📱 Buka Mode Mobile Web Smartphone</span>
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2">
                <span>{activeTrainerName}</span>
                <span className="text-xs font-semibold text-zinc-400 font-mono">({activeTrainerId})</span>
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                {activeTrainer?.roleName || 'Pelatih PT'} • Divisi Pembinaan Atletik & Kebugaran RFA GYM
              </p>
            </div>
          </div>

          {/* Quick Account Switcher for Trainers - Hanya untuk Leader PT & Admin */}
          {isLeaderOrAdmin ? (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-500" />
                  <span>Pindah Akun Pelatih:</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-bold border border-orange-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Akses Cepat 1-Klik (Leader & Admin)
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {trainerAccounts.map((trainer) => {
                  const isSelected = trainer.id === activeTrainerId;
                  return (
                    <button
                      key={trainer.id}
                      onClick={() => handleSwitchTrainer(trainer.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                      }`}
                      title={`Pindah ke akun ${trainer.name} (${trainer.roleName || 'Pelatih PT'})`}
                    >
                      <img
                        src={trainer.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'}
                        alt={trainer.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span>{trainer.name.split(' ')[0]}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-center gap-1.5 shrink-0 max-w-xs">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Akun Pelatih Bertugas:</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-bold border border-zinc-800 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-orange-400" />
                  Sesi Pribadi
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <img
                  src={activeTrainer?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'}
                  alt={activeTrainerName}
                  className="w-6 h-6 rounded-full object-cover border border-orange-500 shrink-0"
                />
                <span className="text-xs font-bold text-white truncate">{activeTrainerName}</span>
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">({activeTrainerId})</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-snug">
                Fitur akses cepat 1-klik hanya diizinkan untuk <strong>Leader PT</strong> & <strong>Admin</strong> demi keamanan sesi latihan.
              </p>
            </div>
          )}
        </div>

        {/* Action Bar inside Banner */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>Hari Ini: <strong className="text-white">{formatDateIndo(APP_TODAY)}</strong></span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Agenda Hari Ini: <strong className="text-white">{todaySchedules.length} Sesi Latihan</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold flex items-center gap-1.5 transition text-xs"
            >
              <ClipboardCheck className="w-4 h-4 text-orange-400" />
              <span>Presensi Sesi ({monthlyTrainerAttendanceCount} Hadir)</span>
              {activeRunningSessionCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setIsAddScheduleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black flex items-center gap-1.5 transition shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Sesi Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY KPI & EARNINGS METRICS                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Today's Sessions */}
        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Sesi Hari Ini</span>
            <CalendarDays className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{kpis.todayDone}</span>
            <span className="text-xs text-zinc-400 font-semibold">/ {kpis.todayTotal} Sesi Selesai</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpis.todayTotal > 0 ? (kpis.todayDone / kpis.todayTotal) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Completed Sessions This Month */}
        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Sesi Tuntas (Bulan Ini)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{kpis.completedSessions}</span>
            <span className="text-xs text-zinc-400 font-semibold">dari target {kpis.monthlyTarget}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>Target Tercapai:</span>
            <strong className="text-emerald-400">{kpis.targetProgress}%</strong>
          </p>
        </div>

        {/* Metric 3: Trainees (Active Clients) */}
        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Klien Binaan Aktif</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-400">{kpis.totalClients}</span>
            <span className="text-xs text-zinc-400 font-semibold">Member PT</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            {myClients.filter((c) => c.ptQuota <= 2).length} member perlu perpanjang paket
          </p>
        </div>

        {/* Metric 4: Estimated Session Fee Earnings */}
        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Estimasi Fee Sesi</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-400">
              Rp {kpis.estimatedEarnings.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            @ Rp {kpis.feePerSession.toLocaleString('id-ID')} / Sesi Selesai (3-Pihak Sah)
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIVE "SESI BERIKUTNYA / UP NEXT" CARD                                  */}
      {/* ========================================================================= */}
      {upNextSession && (
        <div className="bg-gradient-to-r from-orange-950/40 via-zinc-900 to-zinc-900 border border-orange-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                <Flame className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-500 text-zinc-950">
                    Sesi Latihan Berikutnya
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-400">
                    {upNextSession.date === APP_TODAY ? 'Hari Ini' : formatDateIndo(upNextSession.date)} • {upNextSession.time} WIB
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  {upNextSession.memberName}
                  <span className="text-xs font-semibold text-zinc-400 ml-2 font-mono">({upNextSession.memberId})</span>
                </h3>

                <p className="text-xs text-zinc-300 mt-0.5 flex items-center gap-2">
                  <span>🎯 Fokus: <strong>{upNextSession.note || 'Program PT Personal'}</strong></span>
                </p>
              </div>
            </div>

            {/* Action Buttons for Next Session */}
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              <button
                onClick={() => setActiveTab('attendance')}
                className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                title="Buka modul presensi untuk check-in / check-out sesi latihan"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Presensi Latihan</span>
              </button>

              <button
                onClick={() => handleSendWhatsAppReminder(upNextSession)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                title="Kirim pesan konfirmasi jadwal via WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kirim WA Reminder</span>
              </button>

              <button
                onClick={() => handleOpenLogForSchedule(upNextSession)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition"
                title="Catat latihan dan evaluasi kondisi fisik"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                <span>Log Latihan</span>
              </button>

              <button
                onClick={() => handleQuickValidateSession(upNextSession)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 transition shadow-lg shadow-orange-500/20"
                title="Validasi tanda tangan pelatih untuk mengesahkan sesi"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tandai Selesai (Validasi PT)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NAVIGATION TABS DALAM PORTAL                                           */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'jadwal'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Agenda Jadwal Saya ({trainerSchedules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('klien')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'klien'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Klien Binaan ({myClients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'log'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Jurnal & Log Latihan ({trainerLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Trainer Attendance Log</span>
          {activeRunningSessionCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-400 text-zinc-950 animate-pulse">
              Aktif
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 font-mono">
              ({monthlyTrainerAttendanceCount})
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('performa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'performa'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Fee & Target Sesi</span>
        </button>

        <button
          onClick={() => setActiveTab('rekomendasi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'rekomendasi'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Saran Fitur Kebutuhan Pelatih</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AGENDA JADWAL SAYA                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          {/* Controls & Filter */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-400 font-semibold">Periode:</span>
              <button
                onClick={() => setScheduleDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  scheduleDateFilter === 'today'
                    ? 'bg-orange-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Hari Ini ({todaySchedules.length})
              </button>
              <button
                onClick={() => setScheduleDateFilter('week')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  scheduleDateFilter === 'week'
                    ? 'bg-orange-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                7 Hari Kedepan
              </button>
              <button
                onClick={() => setScheduleDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  scheduleDateFilter === 'all'
                    ? 'bg-orange-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Semua Riwayat ({trainerSchedules.length})
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Status:</span>
                <select
                  value={scheduleStatusFilter}
                  onChange={(e: any) => setScheduleStatusFilter(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              {/* Search Member */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama member..."
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none w-44 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Schedule List Cards */}
          {displayedSchedules.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400">
              <CalendarDays className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
              <p className="font-bold text-white text-sm">Tidak ada jadwal sesi pada filter ini</p>
              <p className="text-xs text-zinc-500 mt-1">
                Gunakan tombol "Jadwalkan Sesi Baru" untuk mendaftarkan jadwal latihan dengan member.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedSchedules.map((sch) => {
                const isToday = sch.date === APP_TODAY;
                const isCompleted = sch.status === 'Selesai';
                const hasLog = workoutLogs.some((l) => l.scheduleId === sch.id);

                return (
                  <div
                    key={sch.id}
                    className={`bg-zinc-900/80 border rounded-2xl p-4 transition hover:border-zinc-700 flex flex-col justify-between gap-3 ${
                      isToday ? 'border-orange-500/30' : 'border-zinc-800'
                    }`}
                  >
                    {/* Header Card */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : sch.status === 'Menunggu'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {sch.status}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-zinc-950 text-[9px] font-extrabold uppercase">
                              Hari Ini
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-orange-400" />
                          <span>{sch.time} WIB</span>
                        </div>
                      </div>

                      {/* Member Info */}
                      <div className="mt-3">
                        <h4 className="text-base font-bold text-white flex items-center justify-between">
                          <span>{sch.memberName}</span>
                          <span className="text-xs font-normal text-zinc-400 font-mono">{sch.memberId}</span>
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          📅 {formatDateIndo(sch.date)}
                        </p>
                        {sch.note && (
                          <div className="mt-2 text-xs bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2 text-zinc-300">
                            <strong>Fokus Latihan:</strong> {sch.note}
                          </div>
                        )}
                      </div>

                      {/* 3-Party Validation Status Indicators */}
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div
                          className={`p-1.5 rounded-lg border ${
                            sch.valStaf
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'bg-zinc-800/50 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          Staf: {sch.valStaf ? '✓ Valid' : 'Belum'}
                        </div>
                        <div
                          className={`p-1.5 rounded-lg border ${
                            sch.valTrainer
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'bg-zinc-800/50 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          Trainer: {sch.valTrainer ? '✓ Valid' : 'Belum'}
                        </div>
                        <div
                          className={`p-1.5 rounded-lg border ${
                            sch.valMember
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'bg-zinc-800/50 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          Member: {sch.valMember ? '✓ Valid' : 'Belum'}
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendWhatsAppReminder(sch)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition"
                          title="Kirim pengingat sesi via WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setRescheduleTarget(sch);
                            setRescheduleDate(sch.date);
                            setRescheduleTime(sch.time);
                          }}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700 transition"
                          title="Ubah jam / tanggal sesi (Reschedule)"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenLogForSchedule(sch)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                            hasLog
                              ? 'bg-zinc-800 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{hasLog ? 'Lihat/Edit Log' : '+ Catat Log'}</span>
                        </button>

                        {!sch.valTrainer && (
                          <button
                            onClick={() => handleQuickValidateSession(sch)}
                            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Validasi PT</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KLIEN BINAAN SAYA (ROSTER, QUOTA & DETAIL CATAT HASIL LATIHAN)     */}
      {/* ========================================================================= */}
      {activeTab === 'klien' && (
        <div className="space-y-4">
          {/* Header & Controls Bar */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">Daftar Klien Binaan {activeTrainerName}</h4>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-extrabold text-[10px] border border-orange-500/30">
                  Mode Fokus Pelatih
                </span>
              </div>
              <p className="text-zinc-400 text-xs mt-0.5">
                Pantau sisa kuota, catat rincian hasil latihan per sesi (tanggal, jam, RPE, beban & form), serta evaluasi progres klien.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold">
                Total: {myClients.length} Klien Binaan
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                {workoutLogs.length} Catatan Sesi Tersimpan
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-zinc-400 font-bold">Filter:</span>
              {[
                { id: 'all', label: `Semua Klien (${myClients.length})` },
                { id: 'has_logs', label: 'Sudah Ada Log Latihan' },
                { id: 'no_logs', label: 'Belum Ada Log Latihan' },
                { id: 'renewal', label: 'Perlu Renewal (≤ 2 Sesi)' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setClientFilterStatus(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                    clientFilterStatus === f.id
                      ? 'bg-orange-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama atau ID klien..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none w-full sm:w-56 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Client Cards Grid */}
          {(() => {
            const filteredClients = myClients.filter((client) => {
              if (clientSearchQuery.trim()) {
                const q = clientSearchQuery.toLowerCase();
                const matchName = client.memberName.toLowerCase().includes(q);
                const matchId = client.memberId.toLowerCase().includes(q);
                if (!matchName && !matchId) return false;
              }

              const logs = workoutLogs.filter((l) => l.memberId === client.memberId);
              if (clientFilterStatus === 'has_logs' && logs.length === 0) return false;
              if (clientFilterStatus === 'no_logs' && logs.length > 0) return false;
              if (clientFilterStatus === 'renewal' && client.ptQuota > 2) return false;

              return true;
            });

            if (filteredClients.length === 0) {
              return (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400">
                  <Users className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
                  <p className="font-bold text-white text-sm">Tidak ada klien binaan yang sesuai filter</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Coba ganti kata kunci pencarian atau ubah filter status di atas.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredClients.map((client) => {
                  const isQuotaLow = client.ptQuota <= 2;
                  const clientLogs = workoutLogs
                    .filter((l) => l.memberId === client.memberId)
                    .sort((a, b) => b.date.localeCompare(a.date));
                  const latestLog = clientLogs[0] || null;

                  return (
                    <div
                      key={client.memberId}
                      className={`bg-zinc-900/80 border rounded-3xl p-5 flex flex-col justify-between gap-4 transition hover:border-zinc-700 ${
                        isQuotaLow ? 'border-amber-500/40 bg-amber-950/10' : 'border-zinc-800'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Client Identity Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={client.photo}
                              alt={client.memberName}
                              className="w-13 h-13 rounded-2xl object-cover border-2 border-orange-500/50 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="font-extrabold text-white text-base truncate">{client.memberName}</h5>
                                {clientLogs.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30 shrink-0">
                                    {clientLogs.length} Sesi Tercatat
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                                {client.memberId} • {client.phone}
                              </p>
                              <span className="inline-block mt-1 text-[10px] px-2.5 py-0.5 rounded-lg bg-zinc-800/90 text-orange-300 font-bold border border-zinc-700">
                                🏋️ {client.packageName}
                              </span>
                            </div>
                          </div>

                          {/* Quota Badge */}
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sisa Kuota</span>
                            <div className="flex items-baseline justify-end gap-1 mt-0.5">
                              <span className={`text-xl font-black ${isQuotaLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {client.ptQuota}
                              </span>
                              <span className="text-xs text-zinc-500">/ {client.totalPurchased} Sesi</span>
                            </div>
                            {isQuotaLow && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mt-1">
                                Perlu Renewal
                              </span>
                            )}
                          </div>
                        </div>

                        {/* DETAIL CATATAN HASIL LATIHAN TERAKHIR (MODE FOKUS PELATIH) */}
                        <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
                                <Dumbbell className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-black text-white uppercase tracking-wider">
                                Catatan Hasil Latihan Terakhir
                              </span>
                            </div>

                            {latestLog ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                                  📅 {formatDateIndo(latestLog.date)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-bold">Belum Ada Sesi</span>
                            )}
                          </div>

                          {latestLog ? (
                            <div className="space-y-2.5 text-xs">
                              {/* Session Metadata Badges */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-orange-400" />
                                  <span>{latestLog.time || '17:00'} WIB ({latestLog.durationMinutes || 60} Menit)</span>
                                </span>

                                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-bold">
                                  Sesi ke-{latestLog.sessionNumber || 1}
                                </span>

                                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold">
                                  Intensitas: RPE {latestLog.rpeRate}/10
                                </span>

                                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                                  {latestLog.condition}
                                </span>

                                {latestLog.formQuality && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                                    Form: {latestLog.formQuality}
                                  </span>
                                )}

                                {latestLog.weightProgressKg && (
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 text-[11px] font-mono font-bold">
                                    ⚖️ {latestLog.weightProgressKg} kg
                                  </span>
                                )}
                              </div>

                              {/* Muscle Focus */}
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-400 font-bold">Fokus Otot:</span>
                                <span className="text-orange-400 font-black">{latestLog.focusArea}</span>
                              </div>

                              {/* Exercises & Weights Preview */}
                              <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3 text-zinc-200 font-mono text-[11px] whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                                {latestLog.exercisesSummary}
                              </div>

                              {/* Coach Evaluation & Next Goal */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                                <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800">
                                  <span className="text-zinc-400 font-bold block mb-0.5">📝 Evaluasi Pelatih:</span>
                                  <p className="text-zinc-300 line-clamp-2">{latestLog.coachNotes || '-'}</p>
                                </div>
                                <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800">
                                  <span className="text-orange-400 font-bold block mb-0.5">🏆 Target Sesi Berikutnya:</span>
                                  <p className="text-zinc-300 line-clamp-2">{latestLog.nextSessionGoal || '-'}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 text-center text-zinc-500 text-xs space-y-1">
                              <p className="font-semibold text-zinc-400">Belum ada catatan sesi latihan untuk {client.memberName}.</p>
                              <p className="text-[11px]">
                                Klik tombol <strong>Catat Hasil Latihan</strong> untuk memasukkan tanggal, jam, latihan & beban, serta evaluasi teknik.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Action Buttons */}
                      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleOpenLogForClient(client)}
                            className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95"
                            title="Buka Mode Fokus Pelatih untuk mencatat hasil latihan sesi ini (tanggal, waktu, beban, RPE, evaluasi)"
                          >
                            <Zap className="w-4 h-4 fill-zinc-950" />
                            <span>Catat Hasil Latihan (Mode Fokus)</span>
                          </button>

                          <button
                            onClick={() => setClientHistoryModal(client)}
                            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
                            title="Lihat semua riwayat hasil latihan klien ini"
                          >
                            <FileText className="w-3.5 h-3.5 text-orange-400" />
                            <span>Riwayat ({clientLogs.length})</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setNewSchMemberId(client.memberId);
                              setIsAddScheduleModalOpen(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1"
                            title="Atur jadwal sesi latihan baru"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Jadwal</span>
                          </button>

                          <button
                            onClick={() => {
                              const phone = client.phone.replace(/[^0-9]/g, '');
                              const formatted = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
                              window.open(`https://wa.me/${formatted}`, '_blank');
                            }}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition"
                            title="Hubungi klien via WhatsApp"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: JURNAL & LOG LATIHAN MEMBER                                        */}
      {/* ========================================================================= */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-white text-sm">Jurnal & Catatan Latihan Sesi (Workout Logs)</h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Dokumentasi beban, repetisi, RPE (tingkat kelelahan), evaluasi form teknik, dan target berikutnya.
              </p>
            </div>
          </div>

          {trainerLogs.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400">
              <FileText className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
              <p className="font-bold text-white text-sm">Belum ada catatan log latihan yang tersimpan</p>
              <p className="text-xs text-zinc-500 mt-1">
                Buka tab "Agenda Jadwal Saya" dan klik tombol "+ Catat Log" pada sesi latihan member.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainerLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-zinc-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-black">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{log.memberName}</span>
                          <span className="text-xs font-normal text-zinc-400 font-mono">({log.memberId})</span>
                        </h5>
                        <p className="text-xs text-orange-400 font-semibold">{log.focusArea}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono font-bold">
                        📅 {formatDateIndo(log.date)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        RPE: {log.rpeRate}/10
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        {log.condition}
                      </span>
                    </div>
                  </div>

                  {/* Exercises detail */}
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-200 whitespace-pre-line font-mono">
                    {log.exercisesSummary}
                  </div>

                  {/* Coach notes & Next Goal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50">
                      <span className="text-zinc-400 font-bold block mb-1">📝 Evaluasi & Catatan Pelatih:</span>
                      <p className="text-zinc-300">{log.coachNotes || '-'}</p>
                    </div>

                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50">
                      <span className="text-orange-400 font-bold block mb-1">🎯 Target Sesi Berikutnya:</span>
                      <p className="text-zinc-300">{log.nextSessionGoal || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: TRAINER ATTENDANCE LOG (CHECK-IN / CHECK-OUT & RIWAYAT BULANAN)      */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <TrainerAttendanceLogView
          attendanceList={attendanceLogs}
          onUpdateAttendanceList={handleUpdateAttendanceList}
          activeTrainer={activeTrainer}
          schedules={schedules}
          members={members}
          onUpdateSchedule={onUpdateSchedule}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ESTIMASI FEE SESI & TARGET PERSONAL TRAINER                         */}
      {/* ========================================================================= */}
      {activeTab === 'performa' && (
        <div className="space-y-5">
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
            <h4 className="font-bold text-white text-base">Transparansi Fee & Insentif Sesi Pelatih</h4>
            <p className="text-xs text-zinc-400 mt-1">
              Setiap sesi yang diselesaikan dan disahkan validasi 3 pihak (Staf, Trainer, Member) berhak mendapatkan fee sesi mengajar.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-center">
                <span className="text-xs text-zinc-400 uppercase font-bold">Sesi Selesai (Completed)</span>
                <p className="text-3xl font-black text-emerald-400 mt-1">{kpis.completedSessions}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Sesi latihan tuntas</p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-center">
                <span className="text-xs text-zinc-400 uppercase font-bold">Fee Per Sesi Standar</span>
                <p className="text-2xl font-black text-white mt-1">Rp {kpis.feePerSession.toLocaleString('id-ID')}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Komisi per sesi mengajar</p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-center bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/30">
                <span className="text-xs text-amber-400 uppercase font-black">Estimasi Insentif Sesi</span>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  Rp {kpis.estimatedEarnings.toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] text-amber-300/70 mt-1">Akan dicairkan di modul HR & Payroll</p>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="mt-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-zinc-300 font-bold">Target Bulanan: {kpis.completedSessions} / {kpis.monthlyTarget} Sesi</span>
                <span className="text-orange-400 font-bold">{kpis.targetProgress}% Tercapai</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${kpis.targetProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SARAN & REKOMENDASI FITUR KHUSUS PELATIH (PRO ADVISORY)             */}
      {/* ========================================================================= */}
      {activeTab === 'rekomendasi' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-950/40 via-zinc-900 to-zinc-900 border border-orange-500/30 p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-white text-base">Rekomendasi Fitur Kebutuhan Pelatih (Trainer Needs)</h4>
                <p className="text-xs text-zinc-400">
                  Fitur-fitur esensial yang sangat dibutuhkan Personal Trainer untuk mendongkrak performa, retensi member, dan efisiensi harian.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Fitur 1 */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-orange-400 font-black text-sm">
                <Clock className="w-4 h-4" />
                <span>1. Agenda Harian & Widget "Sesi Berikutnya" (Up Next)</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Pelatih membutuhkan layar utama yang langsung menunjukkan jadwal terdekat tanpa perlu mencari ke menu kalender umum gym. Fitur ini dilengkapi countdown waktu dan tombol cepat untuk persiapan sesi.
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Telah Diimplementasikan di Portal Ini
              </span>
            </div>

            {/* Fitur 2 */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>2. Integrasi Pengingat WhatsApp 1-Klik (No-Show Prevention)</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Masalah terbesar trainer adalah member lupa atau membatalkan sesi mendadak. Dengan template pesan WhatsApp otomatis yang siap dikirim H-2 jam sebelum latihan, tingkat kehadiran member meningkat di atas 90%.
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Telah Diimplementasikan di Portal Ini
              </span>
            </div>

            {/* Fitur 3 */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
                <FileText className="w-4 h-4" />
                <span>3. Jurnal Latihan & Riwayat Beban Klien (Workout Log)</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Pencatatan repetisi, beban angkatan (kg), RPE (tingkat kelelahan), dan evaluasi teknik. Tanpa pencatatan ini, pelatih sering lupa beban latihan klien di sesi sebelumnya dan program menjadi tidak terukur (tidak ada progressive overload).
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Telah Diimplementasikan di Portal Ini
              </span>
            </div>

            {/* Fitur 4 */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>4. Alert Sisa Kuota Klien (Upselling & Renewal Booster)</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Deteksi otomatis member yang kuota latihannya sisa ≤ 2 sesi. Memberikan tanda visual bagi pelatih untuk mulai mengajak diskusi perpanjangan paket (renewal closing) sebelum kuota habis.
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Telah Diimplementasikan di Portal Ini
              </span>
            </div>

            {/* Fitur 5 */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-black text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>5. Validasi Digital 3-Pihak Bebas Kecurangan</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Pemberian tanda tangan / persetujuan oleh Trainer secara mandiri dengan 1 tombol untuk klaim fee sesi yang sah dan terhindar dari sengketa absensi dengan bagian operasional.
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Telah Diimplementasikan di Portal Ini
              </span>
            </div>

            {/* Fitur 6 */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <Award className="w-4 h-4" />
                <span>6. Transparansi Kalkulasi Fee & Komisi Sesi Mengajar</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Kalkulator pendapatan instan yang menghitung jumlah sesi tuntas dikalikan fee per sesi, membuat pelatih bersemangat dan termotivasi mencapai target bulanan mereka.
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Telah Diimplementasikan di Portal Ini
              </span>
            </div>

            {/* Fitur 7 */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                <ClipboardCheck className="w-4 h-4" />
                <span>7. Trainer Attendance Log (Check-In / Out & Riwayat 1 Bulan)</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Pencatatan jam kehadiran mandiri pelatih saat melatih klien, dilengkapi waktu check-in, check-out, kalkulasi durasi aktual sesi, zona latihan, rating intensitas (RPE), serta rekapitulasi presensi bulanan yang siap cetak.
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Telah Diimplementasikan di Modul Khusus 'Trainer Attendance Log'
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MODE FOKUS PELATIH — CATAT RINCIAN HASIL LATIHAN                   */}
      {/* ========================================================================= */}
      {isLogModalOpen && (selectedClientForLog || selectedScheduleForLog) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-700 text-white rounded-3xl shadow-2xl w-full max-w-2xl my-auto p-4 sm:p-6 max-h-[94vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-orange-500/20 shrink-0">
                  <Zap className="w-6 h-6 fill-zinc-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base sm:text-lg">
                      Mode Fokus Pelatih — Catat Hasil Latihan
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30">
                      LIVE COACHING
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Klien: <strong className="text-white">{selectedClientForLog?.memberName || selectedScheduleForLog?.memberName}</strong> ({selectedClientForLog?.memberId || selectedScheduleForLog?.memberId}) • Pelatih: <span className="text-orange-400 font-bold">{activeTrainerName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLogModalOpen(false);
                  setIsFocusTimerRunning(false);
                  setIsRestTimerRunning(false);
                }}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LIVE FOCUS MODE TOOLBAR: STOPWATCH SESI, JEDA ISTIRAHAT & SET COUNTER */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* 1. Live Session Stopwatch */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <Timer className="w-4 h-4 text-orange-400" />
                  <span className="text-zinc-400 text-[11px] font-bold">Stopwatch Sesi:</span>
                  <span className="font-mono font-black text-white text-sm">
                    {formatTimerDigits(focusSecondsElapsed)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFocusTimerRunning(!isFocusTimerRunning)}
                  className={`p-1.5 rounded-lg border transition ${
                    isFocusTimerRunning
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                  title={isFocusTimerRunning ? 'Jeda Stopwatch' : 'Jalankan Stopwatch'}
                >
                  {isFocusTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFocusTimerRunning(false);
                    setFocusSecondsElapsed(0);
                  }}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 2. Rest Interval Timer */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 text-[11px] font-bold">Jeda Set:</span>
                {[60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setRestTimerSeconds(sec);
                      setIsRestTimerRunning(true);
                    }}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                      restTimerSeconds === sec && isRestTimerRunning
                        ? 'bg-orange-500 text-zinc-950 animate-pulse'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}

                {isRestTimerRunning && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono font-black text-xs animate-ping ml-1">
                    {restTimerSeconds}s
                  </span>
                )}
              </div>

              {/* 3. Completed Set Counter */}
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-bold">Set:</span>
                <button
                  type="button"
                  onClick={() => setActiveSetCount(Math.max(1, activeSetCount - 1))}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black flex items-center justify-center text-xs"
                >
                  -
                </button>
                <span className="font-black text-orange-400 text-xs px-1">{activeSetCount}</span>
                <button
                  type="button"
                  onClick={() => setActiveSetCount(activeSetCount + 1)}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black flex items-center justify-center text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* FORM INPUT DETAIL CATATAN LATIHAN */}
            <form onSubmit={handleSaveWorkoutLog} className="space-y-4 text-xs">
              {/* Row 1: Tanggal Latihan, Jam Sesi & Durasi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tanggal Latihan */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-300 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span>Tanggal Latihan</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setLogDate(APP_TODAY)}
                      className="text-[10px] text-orange-400 hover:underline font-bold"
                    >
                      Hari Ini
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                {/* Jam Sesi */}
                <div>
                  <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    <span>Waktu / Jam Sesi</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={logTime}
                    onChange={(e) => setLogTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 font-mono font-bold"
                  />
                </div>

                {/* Durasi Sesi & Sesi Ke- */}
                <div>
                  <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Durasi & Sesi Ke-</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={logDuration}
                      onChange={(e) => setLogDuration(Number(e.target.value))}
                      className="w-1/2 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-white outline-none focus:border-orange-500 font-bold"
                    >
                      <option value={30}>30 Mnt</option>
                      <option value={45}>45 Mnt</option>
                      <option value={60}>60 Mnt</option>
                      <option value={90}>90 Mnt</option>
                      <option value={120}>120 Mnt</option>
                    </select>

                    <div className="w-1/2 flex items-center bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1.5">
                      <span className="text-[10px] text-zinc-400 mr-1">Sesi:</span>
                      <input
                        type="number"
                        min={1}
                        value={logSessionNumber}
                        onChange={(e) => setLogSessionNumber(Number(e.target.value))}
                        className="w-full bg-transparent text-white font-mono font-black text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Fokus Otot & Bagian Tubuh */}
              <div>
                <label className="text-zinc-300 font-bold block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
                    <span>Fokus Otot / Bagian Tubuh</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">Klik pill untuk memilih cepat</span>
                </label>
                <input
                  type="text"
                  required
                  value={logFocusArea}
                  onChange={(e) => setLogFocusArea(e.target.value)}
                  placeholder="Contoh: Chest & Triceps Hypertrophy, Back & Biceps, Leg Day & Core"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-orange-500 font-bold"
                />

                {/* Quick Muscle Group Pills */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {[
                    'Chest & Triceps',
                    'Back & Biceps',
                    'Leg Day & Squat',
                    'Shoulder & Traps',
                    'Full Body Power',
                    'Core & Abs Strength',
                    'Glutes & Hamstrings',
                    'Mobility & Conditioning'
                  ].map((muscle) => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => setLogFocusArea(muscle)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                        logFocusArea === muscle
                          ? 'bg-orange-500 text-zinc-950 border-orange-500'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white border-zinc-700'
                      }`}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Rincian Latihan & Beban (Progressive Overload) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Rincian Latihan & Beban (Gerakan, Set, Reps, Beban Kg)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const template = '\n• Barbell Bench Press 4x8 @ 65kg\n• Incline DB Press 3x10 @ 22kg\n• Cable Pushdown 4x12 @ 25kg';
                      setLogExercises((prev) => (prev ? prev + template : template.trim()));
                    }}
                    className="text-[10px] text-orange-400 hover:underline font-bold"
                  >
                    + Sisipkan Template Format
                  </button>
                </div>

                {/* Quick Exercise Library Buttons */}
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  <span className="text-[10px] text-zinc-500 font-bold mr-1">Gerakan:</span>
                  {[
                    'Bench Press',
                    'Back Squat',
                    'Deadlift',
                    'Incline DB',
                    'Lat Pulldown',
                    'Barbell Row',
                    'Leg Press',
                    'OHP',
                    'Romanian DL',
                    'Hip Thrust'
                  ].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        const line = `\n• ${ex} 4x10 @ kg`;
                        setLogExercises((prev) => (prev ? prev + line : `• ${ex} 4x10 @ kg`));
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white text-[10px] font-mono border border-zinc-700"
                    >
                      +{ex}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  required
                  value={logExercises}
                  onChange={(e) => setLogExercises(e.target.value)}
                  placeholder="Contoh:&#10;1. Barbell Bench Press 4x8 @ 70kg (PR!)&#10;2. Incline DB Press 3x10 @ 24kg&#10;3. Dips Bodyweight 3x12&#10;4. Rope Triceps Pushdown 4x15 @ 25kg"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>

              {/* Row 4: Intensitas RPE, Kondisi Fisik, Kualitas Form & Berat Badan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* RPE 1-10 */}
                <div>
                  <label className="text-zinc-300 font-bold block mb-1.5 flex items-center justify-between">
                    <span>Intensitas (RPE)</span>
                    <span className="text-orange-400 font-black">{logRPE}/10</span>
                  </label>
                  <select
                    value={logRPE}
                    onChange={(e) => setLogRPE(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-white outline-none focus:border-orange-500 font-bold"
                  >
                    {[6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        RPE {num} ({num <= 7 ? 'Sedang' : num === 8 ? 'Intensif' : 'Maksimal / PR'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kondisi Fisik */}
                <div>
                  <label className="text-zinc-300 font-bold block mb-1.5">Kondisi Fisik Klien</label>
                  <select
                    value={logCondition}
                    onChange={(e) => setLogCondition(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-white outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="Prima & Bertenaga">Prima & Bertenaga</option>
                    <option value="Normal">Normal</option>
                    <option value="Lelah / Recovery">Lelah / Recovery</option>
                    <option value="Nyeri Otot Ringan">Nyeri Otot Ringan</option>
                    <option value="Kurang Tidur / Lelah">Kurang Tidur / Lelah</option>
                  </select>
                </div>

                {/* Kualitas Form */}
                <div>
                  <label className="text-zinc-300 font-bold block mb-1.5">Kualitas Form / Teknik</label>
                  <select
                    value={logFormQuality}
                    onChange={(e: any) => setLogFormQuality(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-white outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="Sempurna">⭐ Sempurna & Terkontrol</option>
                    <option value="Baik">👍 Baik</option>
                    <option value="Perlu Perbaikan Form">⚠️ Perlu Koreksi Form</option>
                    <option value="Kurang Stabil">❌ Kurang Stabil</option>
                  </select>
                </div>

                {/* Catatan Berat Badan (Kg) */}
                <div>
                  <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-cyan-400" />
                    <span>Berat Badan (Kg)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Misal: 72.5"
                    value={logWeightProgressKg}
                    onChange={(e) => setLogWeightProgressKg(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-white font-mono text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Row 5: Evaluasi Pelatih & Target Sesi Berikutnya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1.5">📝 Evaluasi Form & Catatan Pelatih</label>
                  <input
                    type="text"
                    value={logCoachNotes}
                    onChange={(e) => setLogCoachNotes(e.target.value)}
                    placeholder="Contoh: Form squat membaik, bracing core kuat, tempo stabil."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-orange-400 font-bold block mb-1.5">🏆 Target Sesi Berikutnya (Progressive Overload)</label>
                  <input
                    type="text"
                    value={logNextGoal}
                    onChange={(e) => setLogNextGoal(e.target.value)}
                    placeholder="Contoh: Naikkan bench press ke 75kg 3x6 atau fokus deadlift 4x8."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Checkbox: Auto Validate Schedule */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="autoValidateCheck"
                  checked={logAutoValidateSession}
                  onChange={(e) => setLogAutoValidateSession(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 bg-zinc-800 border-zinc-700 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="autoValidateCheck" className="text-xs text-zinc-300 cursor-pointer select-none">
                  Tandai sesi jadwal hari ini sebagai <strong>Selesai (Completed)</strong> & sahkan validasi tanda tangan pelatih.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogModalOpen(false);
                    setIsFocusTimerRunning(false);
                    setIsRestTimerRunning(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 active:scale-95 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Hasil Latihan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RIWAYAT LENGKAP HASIL LATIHAN KLIEN                                */}
      {/* ========================================================================= */}
      {clientHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-700 text-white rounded-3xl shadow-2xl w-full max-w-3xl my-auto p-4 sm:p-6 max-h-[94vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4 gap-3">
              <div className="flex items-center gap-3.5">
                <img
                  src={clientHistoryModal.photo}
                  alt={clientHistoryModal.memberName}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-orange-500/50"
                />
                <div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                    <span>Riwayat Hasil Latihan — {clientHistoryModal.memberName}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    ID: {clientHistoryModal.memberId} • Paket: {clientHistoryModal.packageName} • Sisa Kuota: <span className="text-orange-400 font-bold">{clientHistoryModal.ptQuota} Sesi</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClientHistoryModal(null)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics & Action to Record New */}
            {(() => {
              const allClientLogs = workoutLogs
                .filter((l) => l.memberId === clientHistoryModal.memberId)
                .sort((a, b) => b.date.localeCompare(a.date));

              const avgRpe =
                allClientLogs.length > 0
                  ? (allClientLogs.reduce((acc, curr) => acc + curr.rpeRate, 0) / allClientLogs.length).toFixed(1)
                  : 0;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Sesi Dicatat</span>
                      <span className="text-xl font-black text-white mt-0.5 block">{allClientLogs.length} Sesi</span>
                    </div>

                    <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Rata-rata RPE</span>
                      <span className="text-xl font-black text-purple-400 mt-0.5 block">{avgRpe} / 10</span>
                    </div>

                    <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sesi Terakhir</span>
                      <span className="text-xs font-bold text-orange-400 mt-1 block truncate">
                        {allClientLogs[0] ? formatDateIndo(allClientLogs[0].date) : '-'}
                      </span>
                    </div>

                    <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          const client = clientHistoryModal;
                          setClientHistoryModal(null);
                          handleOpenLogForClient(client);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Catat Sesi Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Sessions */}
                  <div className="space-y-3">
                    {allClientLogs.length === 0 ? (
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
                        <Dumbbell className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                        <p className="font-bold text-white text-sm">Belum ada riwayat hasil latihan</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Gunakan tombol "Catat Sesi Baru" untuk memasukkan catatan latihan pertama klien ini.
                        </p>
                      </div>
                    ) : (
                      allClientLogs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3 hover:border-zinc-700 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-400 font-mono font-bold text-xs border border-orange-500/30">
                                📅 {formatDateIndo(log.date)}
                              </span>
                              <span className="text-xs text-zinc-400 font-mono">
                                ⏰ {log.time || '17:00'} WIB ({log.durationMinutes || 60} Menit)
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-bold text-[10px]">
                                Sesi ke-{log.sessionNumber || 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
                                RPE {log.rpeRate}/10
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                                {log.condition}
                              </span>
                              {log.weightProgressKg && (
                                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-cyan-300 font-mono font-bold text-[10px]">
                                  ⚖️ {log.weightProgressKg} kg
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleShareWorkoutToWhatsApp(log)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition"
                                title="Kirim Laporan Sesi via WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const client = clientHistoryModal;
                                  setClientHistoryModal(null);
                                  handleOpenLogForClient(client, log);
                                }}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 border border-zinc-700 transition"
                                title="Edit Catatan Latihan Sesi Ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWorkoutLog(log.id)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-400 border border-zinc-700 transition"
                                title="Hapus Catatan Latihan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 font-bold">Fokus Otot:</span>
                              <span className="text-orange-400 font-black">{log.focusArea}</span>
                              {log.formQuality && (
                                <span className="text-zinc-500 text-[11px] font-medium">• Form: {log.formQuality}</span>
                              )}
                            </div>

                            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-zinc-200 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                              {log.exercisesSummary}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800">
                                <span className="text-zinc-400 font-bold block mb-0.5">📝 Evaluasi Pelatih:</span>
                                <p className="text-zinc-300">{log.coachNotes || '-'}</p>
                              </div>
                              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800">
                                <span className="text-orange-400 font-bold block mb-0.5">🏆 Target Sesi Berikutnya:</span>
                                <p className="text-zinc-300">{log.nextSessionGoal || '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: JADWALKAN SESI BARU (QUICK SCHEDULE MODAL)                         */}
      {/* ========================================================================= */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 text-white rounded-3xl shadow-2xl w-full max-w-md my-auto p-4 sm:p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">Atur Jadwal Latihan</h3>
              </div>
              <button
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickSchedule} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Pelatih Bertugas</label>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-bold text-orange-400 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  <span>{activeTrainerName} ({activeTrainerId})</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Pilih Member Binaan</label>
                <select
                  required
                  value={newSchMemberId}
                  onChange={(e) => setNewSchMemberId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id}) • Sisa Kuota: {m.ptQuota} Sesi
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Tanggal Sesi</label>
                  <input
                    type="date"
                    required
                    value={newSchDate}
                    onChange={(e) => setNewSchDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Waktu Latihan</label>
                  <input
                    type="time"
                    required
                    value={newSchTime}
                    onChange={(e) => setNewSchTime(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Fokus Sesi / Catatan</label>
                <input
                  type="text"
                  value={newSchNote}
                  onChange={(e) => setNewSchNote(e.target.value)}
                  placeholder="Contoh: Chest Day, Pengenalan Alat, Latihan Kaki"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black shadow-lg shadow-orange-500/20"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESCHEDULE SESI                                                    */}
      {/* ========================================================================= */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 text-white rounded-3xl shadow-2xl w-full max-w-sm my-auto p-4 sm:p-5 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-base">Pindahkan Jadwal (Reschedule)</h3>
              </div>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <p className="text-zinc-400">Member:</p>
                <p className="font-bold text-white text-sm">{rescheduleTarget.memberName}</p>
                <p className="text-zinc-400 mt-1">Jadwal Lama: {formatDateIndo(rescheduleTarget.date)} pukul {rescheduleTarget.time} WIB</p>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Tanggal Baru</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Jam Baru</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black shadow-md shadow-blue-500/20"
                >
                  Konfirmasi Pindah Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

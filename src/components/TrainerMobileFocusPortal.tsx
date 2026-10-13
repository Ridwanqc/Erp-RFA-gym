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
import { formatDateIndo, APP_TODAY } from '../utils/formatters';

export interface MobileSessionItem {
  id: string;
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
  showToast
}) => {
  // Navigation Tab State (Jadwal, Klien, Log Latihan, Profil & Fee)
  const [activeTab, setActiveTab] = useState<'jadwal' | 'klien' | 'log' | 'profil'>('jadwal');

  const trainerDisplayName = currentUser?.name || 'Reza Pratama';
  const trainerAvatar = currentUser?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
  const trainerShift = currentUser?.shift || 'Shift Siang';

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
      return activePool.slice(0, 10).map((s, idx) => {
        const memMatch = members?.find(
          (m) => m.name.toLowerCase() === s.memberName.toLowerCase() || m.id === s.memberId
        );
        const status: 'Menunggu' | 'Selesai' | 'Sedang Berlangsung' =
          s.status === 'Selesai' ? 'Selesai' : 'Menunggu';
        return {
          id: s.id,
          time: s.time || '14:00',
          memberName: s.memberName,
          sessionInfo: `Sesi ${idx + 1} / 12 (Personal Training)`,
          packageType: 'Personal Training 1-on-1 (12 Sesi)',
          status,
          avatar:
            memMatch?.photo ||
            `https://images.unsplash.com/photo-${1534528741775 + idx}?q=80&w=200&auto=format&fit=crop`,
          phone: memMatch?.phone || '081234567890',
          focusArea: s.note || s.workoutFocus || 'Chest & Core Stability',
          notes: s.note || 'Form prima & pemanasan optimal'
        };
      });
    }

    return [
      {
        id: 'SES-01',
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

  // Clients Directory (initialized from real members if available)
  const [clients, setClients] = useState<MobileClientItem[]>(() => {
    if (members && members.length > 0) {
      return members.slice(0, 15).map((m, idx) => ({
        id: m.id,
        name: m.name,
        phone: m.phone || '081234567890',
        avatar:
          m.photo ||
          `https://images.unsplash.com/photo-${1534528741775 + idx}?q=80&w=200&auto=format&fit=crop`,
        totalSessions: m.ptQuota ? m.ptQuota + 4 : 12,
        completedSessions: 4,
        packageTitle: m.membershipType || 'Personal Training 1-on-1 (12 Sesi)',
        lastActive: m.joinDate || '10 Okt 2026',
        targetGoal: 'Kenaikan Massa Otot & Ketahanan Fisik',
        healthNote: 'Kondisi fisik prima untuk latihan beban.'
      }));
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

  // Workout Logs State
  const [workoutLogs, setWorkoutLogs] = useState<MobileWorkoutLogItem[]>([
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
  ]);

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

  // Rest Interval Countdown Timer for Live Workout
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [isRestRunning, setIsRestRunning] = useState<boolean>(false);
  const [restInitialDuration, setRestInitialDuration] = useState<number>(60);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Calculations for Daily Status Cards
  const totalTodaySessions = 4; // Target harian trainer Reza Pratama
  const completedCount = sessions.filter((s) => s.status === 'Selesai').length;
  // Estimasi fee: Rp 60.000 per sesi selesai, default estimasi awal Rp 60.000 jika belum selesai, atau Rp 60.000 x max(1, completed)
  const estimatedFeeValue = completedCount === 0 ? 60000 : completedCount * 60000;
  const formattedFee = `Rp ${estimatedFeeValue.toLocaleString('id-ID')}`;

  // Current / Next up session (Hero Card Target)
  const heroSession = useMemo(() => {
    const ongoing = sessions.find((s) => s.status === 'Sedang Berlangsung');
    if (ongoing) return ongoing;
    const waiting = sessions.find((s) => s.status === 'Menunggu');
    if (waiting) return waiting;
    return sessions[0];
  }, [sessions]);

  // Handler: Quick Toggle Session Status directly from card
  const handleToggleSessionStatus = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) =>
      prev.map((item) => {
        if (item.id === sessionId) {
          const newStatus = item.status === 'Selesai' ? 'Menunggu' : 'Selesai';
          const msg =
            newStatus === 'Selesai'
              ? `Sesi ${item.memberName} ditandai selesai! (+Rp 60.000) 🎉`
              : `Status ${item.memberName} dikembalikan ke Menunggu.`;
          triggerToast(msg);
          showToast?.('Status Sesi Diperbarui', msg, 'success');

          if (onUpdateSchedule && schedules) {
            const sch = schedules.find(
              (s) => s.id === sessionId || s.memberName.toLowerCase() === item.memberName.toLowerCase()
            );
            if (sch) {
              onUpdateSchedule({
                ...sch,
                status: newStatus === 'Selesai' ? 'Selesai' : 'Menunggu',
                valTrainer: newStatus === 'Selesai'
              });
            }
          }
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  // Filtered Sessions for Agenda Tab
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (agendaFilter === 'menunggu') return s.status === 'Menunggu' || s.status === 'Sedang Berlangsung';
      if (agendaFilter === 'selesai') return s.status === 'Selesai';
      return true;
    });
  }, [sessions, agendaFilter]);

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

    // Update session status in state
    setSessions((prev) =>
      prev.map((item) =>
        item.id === activeSessionModal.id
          ? { ...item, status: 'Selesai' }
          : item
      )
    );

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

    // Add to workout logs automatically
    const newLog: MobileWorkoutLogItem = {
      id: 'LOG-' + Date.now(),
      memberName: activeSessionModal.memberName,
      date: '12 Okt 2026',
      time: activeSessionModal.time,
      sessionNo: 4,
      totalSession: 12,
      focusMuscle: activeSessionModal.focusArea,
      rpe: rpeRating,
      duration: sessionTimer > 0 ? `${Math.max(1, Math.round(sessionTimer / 60))} Menit` : '60 Menit',
      formRating: 'Sempurna',
      coachNotes: sessionNotesInput || 'Sesi selesai dengan presensi valid & form prima.',
      nextTarget: 'Tingkatkan progres beban pada compound lift berikutnya.'
    };
    setWorkoutLogs((prev) => [newLog, ...prev]);

    setIsTimerRunning(false);
    setActiveSessionModal(null);
    const successMsg = `Presensi & Sesi ${activeSessionModal.memberName} Berhasil Diselesaikan! Fee +Rp 60.000 🎉`;
    triggerToast(successMsg);
    showToast?.('Presensi Berhasil', successMsg, 'success');
  };

  // Handler: Quick Add New Session via FAB
  const handleCreateSessionFromFab = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: MobileSessionItem = {
      id: 'SES-' + Date.now(),
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
        date: APP_TODAY,
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
    <div className="w-full min-h-screen bg-[#0b0f17] text-zinc-100 flex items-center justify-center p-0 sm:p-4 select-none font-sans">
      {/* ========================================================================= */}
      {/* SMARTPHONE DEVICE WRAPPER (max-w-md mx-auto)                                */}
      {/* Aesthetic: Clay 3D Gelap (#111827 / #1f2937, Aksen #f97316)              */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-[844px] bg-[#111827] sm:rounded-[40px] border-0 sm:border-4 border-zinc-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col relative overflow-hidden">
        
        {/* Dynamic Island / Top Phone Accent Bar (Cosmetic native phone top) */}
        <div className="w-full pt-2 pb-1 px-6 flex items-center justify-between text-[11px] text-zinc-400 font-semibold bg-[#111827] shrink-0 border-b border-zinc-800/50">
          <span className="font-mono text-zinc-300">14:02</span>
          <div className="w-20 h-4 bg-zinc-950 rounded-full border border-zinc-800 flex items-center justify-center gap-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">GymPro</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. HEADER KOMPAK                                                         */}
        {/* Nama: "GymPro" + Logo Kecil | Profil Trainer: Avatar, "Reza Pratama",      */}
        {/* Status chip hijau "Aktif Bertugas", Subtitle "Shift Siang"               */}
        {/* ========================================================================= */}
        <header className="px-4 py-3.5 bg-gradient-to-b from-[#182133] to-[#111827] border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center justify-between">
            {/* App Branding */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 p-0.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_4px_12px_rgba(249,115,22,0.35)] flex items-center justify-center">
                <div className="w-full h-full bg-[#111827] rounded-[14px] flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-orange-500 transform -rotate-45" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black tracking-tight text-white flex items-center">
                    Gym<span className="text-orange-500">Pro</span>
                  </h1>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider">
                    ERP
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">Portal Fokus Trainer</p>
              </div>
            </div>

            {/* Trainer Profile (Right Corner) */}
            <div className="flex items-center gap-2.5 bg-[#1f2937]/90 px-2.5 py-1.5 rounded-2xl border border-zinc-700/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_10px_rgba(0,0,0,0.25)]">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-bold text-white leading-tight">{trainerDisplayName}</span>
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {/* Status chip hijau "Aktif Bertugas" */}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Aktif Bertugas
                  </span>
                  {/* Subtitle Shift Siang */}
                  <span className="text-[9px] text-zinc-400 font-medium leading-none">
                    • {trainerShift}
                  </span>
                </div>
              </div>

              {/* Avatar bulat */}
              <div className="relative shrink-0">
                <img
                  src={trainerAvatar}
                  alt={trainerDisplayName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-500/70 shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-zinc-900"></span>
              </div>
            </div>
          </div>
        </header>

        {/* Back to desktop switch button (if mounted within main ERP) */}
        {onBackToDesktop && (
          <div className="bg-zinc-950/90 px-4 py-1.5 flex items-center justify-between text-xs border-b border-zinc-800 text-zinc-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3 h-3 text-orange-400" />
              Tampilan Mobile Web Smartphone
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
        {/* MAIN SCROLLABLE CONTENT BODY (With padding-bottom for fixed bottom bar)     */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 scrollbar-thin scrollbar-thumb-zinc-800">
          
          {/* TAB 1: JADWAL (Default & Primary Focus View) */}
          {activeTab === 'jadwal' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* =================================================================== */}
              {/* 3. STATUS RINGKAS HARIAN                                            */}
              {/* Hari/Tanggal: "Senin, 12 Okt"                                       */}
              {/* 2 kartu berdampingan:                                               */}
              {/* - "Sesi Hari Ini: 0 / 4 Selesai"                                    */}
              {/* - "Estimasi Fee: Rp 60.000"                                         */}
              {/* =================================================================== */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-white font-bold">Senin, 12 Okt</span>
                    <span className="text-zinc-500">• 2026</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50">
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
                        style={{ width: `${(completedCount / totalTodaySessions) * 100}%` }}
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
              {/* Nama: Budi Santoso, Sub: Sesi 4 / 12 (Personal Training),           */}
              {/* Tombol utama besar oranye: "[ ▶ MULAI SESI & PRESENSI ]"            */}
              {/* =================================================================== */}
              <section>
                <div className="relative rounded-3xl bg-gradient-to-br from-[#1c2436] via-[#161c28] to-[#121722] border-2 border-orange-500/80 p-4 sm:p-5 shadow-[0_12px_28px_rgba(249,115,22,0.18),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden">
                  {/* Subtle Clay Ambient Glow */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
                  
                  {/* Header Tag / Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black uppercase tracking-wider">
                      <Flame className="w-3 h-3 text-orange-400 animate-pulse" />
                      SESI SEKARANG / BERIKUTNYA
                    </div>
                    <span className="text-xs font-mono font-bold text-orange-400 bg-[#111827] px-2.5 py-0.5 rounded-xl border border-orange-500/30">
                      {heroSession?.time || '14:00'} WIB
                    </span>
                  </div>

                  {/* Client Info Info Block */}
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={heroSession?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                        alt={heroSession?.memberName || 'Budi Santoso'}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-lg"
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-zinc-950 font-black text-[10px]">
                        PT
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-black text-white tracking-tight leading-tight truncate">
                        {heroSession?.memberName || 'Budi Santoso'}
                      </h2>
                      <p className="text-xs text-orange-400 font-semibold mt-0.5">
                        {heroSession?.sessionInfo || 'Sesi 4 / 12 (Personal Training)'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-400">
                        <span className="truncate max-w-[170px] bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-700/50">
                          🎯 {heroSession?.focusArea || 'Chest & Triceps Hypertrophy'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Quick Contact */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl mb-3.5 border border-zinc-800">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Status:{' '}
                      <strong className={heroSession?.status === 'Selesai' ? 'text-emerald-400' : 'text-amber-400'}>
                        {heroSession?.status || 'Menunggu'}
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

                  {/* Primary Call To Action Button (Tombol Utama Besar Oranye Terang) */}
                  <button
                    type="button"
                    onClick={() => handleOpenStartSession(heroSession)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-[0.98] text-zinc-950 text-sm font-black tracking-wide shadow-[0_8px_20px_rgba(249,115,22,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2.5 cursor-pointer uppercase"
                  >
                    <Play className="w-4 h-4 fill-zinc-950 stroke-zinc-950" />
                    <span>[ ▶ MULAI SESI & PRESENSI ]</span>
                  </button>
                </div>
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
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-orange-500" />
                      Agenda Hari Ini
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {sessions.length} Sesi
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">Ketuk untuk detail / check-in</span>
                </div>

                {/* Filter Chips: Semua, Menunggu, Selesai */}
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
                    Semua ({sessions.length})
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
                    Menunggu ({sessions.filter((s) => s.status === 'Menunggu').length})
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
                    Selesai ({completedCount})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {filteredSessions.map((item) => {
                    const isCompleted = item.status === 'Selesai';
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenStartSession(item)}
                        className={`rounded-2xl p-3.5 border transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] ${
                          isCompleted
                            ? 'bg-[#141b27]/80 border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]'
                            : 'bg-[#1f2937]/90 hover:bg-[#253245] border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Time & Client Summary */}
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Time Pill */}
                            <div className="w-13 text-center shrink-0">
                              <span className="text-xs font-mono font-black text-orange-400 bg-[#111827] px-2 py-1 rounded-xl border border-orange-500/30 block">
                                {item.time}
                              </span>
                            </div>

                            {/* Client Name & Sub info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-bold text-white truncate leading-tight">
                                  {item.memberName}
                                </h4>
                              </div>
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                {item.sessionInfo}
                              </p>
                            </div>
                          </div>

                          {/* Badge Status with Quick Toggle */}
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleToggleSessionStatus(item.id, e)}
                              title="Klik untuk ubah cepat status"
                              className="cursor-pointer transition-transform active:scale-95"
                            >
                              {isCompleted ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Selesai
                                </span>
                              ) : (
                                /* Badge: Menunggu - warna oranye/kuning */
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                  Menunggu
                                </span>
                              )}
                            </button>
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                          </div>
                        </div>

                        {/* Extra Mini Details (Focus & Note) */}
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="truncate max-w-[210px] text-zinc-300">
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
                            <MessageCircle className="w-3 h-3" />
                            Ingatkan WA
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

              <div className="space-y-2.5">
                {filteredClients.map((c) => {
                  const quotaLeft = c.totalSessions - c.completedSessions;
                  const isExpiring = quotaLeft <= 2;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientDetail(c)}
                      className="bg-[#1f2937]/90 rounded-2xl p-3.5 border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)] hover:border-orange-500/50 transition cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-zinc-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-bold text-white truncate">{c.name}</h4>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
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
                          <p className="text-[10px] text-zinc-400 line-clamp-1 mt-1">
                            🎯 {c.targetGoal}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500 text-[10px]">Aktif terakhir: {c.lastActive}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWhatsApp(c.phone, c.name, 'Jadwal Reguler');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" />
                            Chat WA
                          </button>
                          <span className="text-orange-400 text-[11px] font-bold flex items-center gap-0.5">
                            Detail <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

              <div className="space-y-2.5">
                {filteredWorkoutLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#1f2937]/90 rounded-2xl p-3.5 border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{log.memberName}</h4>
                          <span className="text-[10px] px-2 py-0.2 bg-zinc-800 text-orange-400 rounded-md font-mono font-bold">
                            Sesi {log.sessionNo}/{log.totalSession}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {log.date} • {log.time} WIB ({log.duration})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        RPE {log.rpe}/10
                      </span>
                    </div>

                    <div className="bg-[#111827] rounded-xl p-2.5 border border-zinc-800 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                        <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
                        <span>Fokus: {log.focusMuscle}</span>
                      </div>
                      <p className="text-zinc-400 text-[10px] pl-5 leading-relaxed">
                        {log.coachNotes}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-amber-400 font-medium">🎯 Target: {log.nextTarget}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const client = clients.find((c) => c.name === log.memberName);
                          handleOpenWhatsApp(client?.phone || '081234567890', log.memberName, log.time);
                        }}
                        className="text-zinc-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-orange-400" />
                        Kirim WA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROFIL & ESTIMASI FEE */}
          {activeTab === 'profil' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Profile Card */}
              <div className="bg-[#1f2937]/90 rounded-3xl p-4 border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_16px_rgba(0,0,0,0.35)] relative overflow-hidden">
                <div className="flex items-center gap-3.5">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                    alt="Reza Pratama"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shadow-lg"
                  />
                  <div>
                    <h3 className="text-base font-black text-white">Reza Pratama</h3>
                    <p className="text-xs text-orange-400 font-semibold">Senior Personal Trainer</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        Aktif Bertugas
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                        Shift Siang
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-800 text-xs">
                  <div className="bg-[#111827] p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">ID Pelatih</span>
                    <strong className="text-white font-mono">TRN-004</strong>
                  </div>
                  <div className="bg-[#111827] p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Spesialisasi</span>
                    <strong className="text-white">Hypertrophy & Rehab</strong>
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
                  <span className="text-[10px] text-zinc-400">Bulan Oktober 2026</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-[#111827] rounded-xl border border-zinc-800">
                    <span className="text-zinc-300">Estimasi Fee Hari Ini (12 Okt)</span>
                    <strong className="text-emerald-400 font-mono font-bold">{formattedFee}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#111827] rounded-xl border border-zinc-800">
                    <span className="text-zinc-300">Total Sesi Selesai Bulan Ini</span>
                    <strong className="text-white font-mono font-bold">28 Sesi</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#111827] rounded-xl border border-zinc-800">
                    <span className="text-zinc-300">Akumulasi Fee Pelatih</span>
                    <strong className="text-orange-400 font-mono font-bold">Rp 1.680.000</strong>
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
        {/* Tombol FAB bulat oranye di kanan bawah dengan ikon plus (+) berlabel       */}
        {/* "Jadwalkan Sesi Baru / Tambah Kegiatan"                                  */}
        {/* ========================================================================= */}
        <div className="absolute bottom-20 right-4 z-40">
          <button
            type="button"
            onClick={() => setIsFabModalOpen(true)}
            aria-label="Jadwalkan Sesi Baru / Tambah Kegiatan"
            className="group flex items-center gap-2 pl-3.5 pr-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-[0_8px_25px_rgba(249,115,22,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center text-orange-400">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="tracking-tight">Jadwalkan Sesi Baru</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 7. BOTTOM NAVIGATION BAR (FIXED DI BAGIAN BAWAH)                         */}
        {/* 4 tab navigasi dengan ikon dan label:                                     */}
        {/* - Jadwal (Active state: warna teks oranye dengan underline / indikator)  */}
        {/* - Klien                                                                  */}
        {/* - Log Latihan                                                            */}
        {/* - Profil & Fee                                                           */}
        {/* ========================================================================= */}
        <nav className="absolute bottom-0 left-0 right-0 h-18 bg-[#111827]/95 backdrop-blur-md border-t border-zinc-800/90 px-3 flex items-center justify-around z-30 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
          {/* Tab 1: Jadwal */}
          <button
            type="button"
            onClick={() => setActiveTab('jadwal')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 relative transition cursor-pointer ${
              activeTab === 'jadwal' ? 'text-orange-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'jadwal' ? 'text-orange-500 scale-110' : ''}`} />
            <span className="text-[10px] tracking-tight">Jadwal</span>
            {activeTab === 'jadwal' && (
              <span className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
            )}
          </button>

          {/* Tab 2: Klien */}
          <button
            type="button"
            onClick={() => setActiveTab('klien')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 relative transition cursor-pointer ${
              activeTab === 'klien' ? 'text-orange-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'klien' ? 'text-orange-500 scale-110' : ''}`} />
            <span className="text-[10px] tracking-tight">Klien</span>
            {activeTab === 'klien' && (
              <span className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
            )}
          </button>

          {/* Tab 3: Log Latihan */}
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 relative transition cursor-pointer ${
              activeTab === 'log' ? 'text-orange-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileEdit className={`w-5 h-5 ${activeTab === 'log' ? 'text-orange-500 scale-110' : ''}`} />
            <span className="text-[10px] tracking-tight">Log Latihan</span>
            {activeTab === 'log' && (
              <span className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
            )}
          </button>

          {/* Tab 4: Profil & Fee */}
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 relative transition cursor-pointer ${
              activeTab === 'profil' ? 'text-orange-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wallet className={`w-5 h-5 ${activeTab === 'profil' ? 'text-orange-500 scale-110' : ''}`} />
            <span className="text-[10px] tracking-tight">Profil & Fee</span>
            {activeTab === 'profil' && (
              <span className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
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
                <img
                  src={activeSessionModal.avatar}
                  alt={activeSessionModal.memberName}
                  className="w-12 h-12 rounded-xl object-cover border border-orange-500 shrink-0"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{activeSessionModal.memberName}</h4>
                  <p className="text-xs text-orange-400">{activeSessionModal.sessionInfo}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Jadwal: {activeSessionModal.time} WIB</p>
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
                <img
                  src={selectedClientDetail.avatar}
                  alt={selectedClientDetail.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500"
                />
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

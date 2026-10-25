import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Clock,
  QrCode,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Printer,
  Share2,
  Trash2,
  LogOut,
  Sparkles,
  ArrowRight,
  Filter,
  PlusCircle,
  CreditCard,
  Building2,
  Award,
  Activity,
  Scale,
  Flame,
  TrendingDown,
  TrendingUp,
  Heart,
  Droplets,
  Ruler,
  Dumbbell,
  Plus,
  ChevronRight,
  FileText,
  Target,
  Zap,
  DoorOpen,
  Check
} from 'lucide-react';
import {
  Member,
  BodyCompositionRecord,
  PTPurchaseRecord,
  PTBooking,
  Schedule,
  User as UserType,
  TrainerChangeRequest,
  PTBackofficeNotification,
  Attendance,
  TrainerWorkoutLog,
  WorkSchedule,
  StaffAttendance,
  LeaveRequest,
  StudioClass
} from '../../types';
import { OnlineReservation } from '../../types/landingTypes';
import { APP_TODAY, formatDateIndo } from '../../utils/formatters';
import { calculateBMI, getBMICategory, calculateEstimatedBMR } from '../../data/bodyCompositionData';
import { calculateMemberPTSummary, TrainerWorkingRule } from '../../data/ptBookingData';
import { loadWorkoutLogsFromStorage } from '../../data/workoutLogData';
import { MemberPTBookingSection } from './MemberPTBookingSection';

interface MemberPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  loggedInMember: Member | null;
  onLoginMember: (member: Member) => void;
  onLogoutMember: () => void;
  reservations: OnlineReservation[];
  onCancelReservation: (resId: string) => void;
  onOpenNewReservation: () => void;
  bodyCompositionRecords?: BodyCompositionRecord[];
  onSaveBodyCompositionRecord?: (record: BodyCompositionRecord) => void;
  ptPurchases?: PTPurchaseRecord[];
  bookings?: PTBooking[];
  schedules?: Schedule[];
  trainers?: UserType[];
  trainerChangeRequests?: TrainerChangeRequest[];
  onAddBooking?: (booking: PTBooking, notification: PTBackofficeNotification) => void;
  onRescheduleBooking?: (
    bookingId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    notes?: string
  ) => void;
  onCancelBooking?: (bookingId: string, reason?: string) => void;
  onRequestChangeTrainer?: (request: TrainerChangeRequest) => void;
  attendances?: Attendance[];
  workoutLogs?: TrainerWorkoutLog[];
  onSaveWorkoutLog?: (log: TrainerWorkoutLog) => void;
  trainerWorkingRules?: TrainerWorkingRule[];
  workSchedules?: WorkSchedule[];
  staffAttendances?: StaffAttendance[];
  leaveRequests?: LeaveRequest[];
  studioClasses?: StudioClass[];
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MemberPortalModal: React.FC<MemberPortalModalProps> = ({
  isOpen,
  onClose,
  members,
  loggedInMember,
  onLoginMember,
  onLogoutMember,
  reservations,
  onCancelReservation,
  onOpenNewReservation,
  bodyCompositionRecords = [],
  onSaveBodyCompositionRecord,
  ptPurchases = [],
  bookings = [],
  schedules = [],
  trainers = [],
  trainerChangeRequests = [],
  onAddBooking,
  onRescheduleBooking,
  onCancelBooking,
  onRequestChangeTrainer,
  attendances = [],
  workoutLogs = [],
  onSaveWorkoutLog,
  trainerWorkingRules = [],
  workSchedules = [],
  staffAttendances = [],
  leaveRequests = [],
  studioClasses = [],
  showToast
}) => {
  // Real synchronized member record from master members list
  const currentMember = loggedInMember
    ? members.find((m) => m.id === loggedInMember.id) || loggedInMember
    : null;

  // Real PT Summary (computed from actual active purchases & bookings)
  const ptSummary = React.useMemo(() => {
    if (!currentMember) return null;
    return calculateMemberPTSummary(currentMember, ptPurchases, bookings);
  }, [currentMember, ptPurchases, bookings]);

  // Real Workout Logs for this member (recorded from Mode Fokus Pelatih / Klien Binaan)
  const memberWorkoutLogs = React.useMemo(() => {
    if (!currentMember) return [];
    const sourceLogs = workoutLogs && workoutLogs.length > 0 ? workoutLogs : loadWorkoutLogsFromStorage();
    const cleanName = currentMember.name.toLowerCase().trim();
    return sourceLogs
      .filter((l) => {
        if (l.memberId === currentMember.id) return true;
        const lName = (l.memberName || '').toLowerCase().trim();
        return lName === cleanName || (lName && cleanName.includes(lName));
      })
      .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());
  }, [currentMember, workoutLogs]);

  // Real Attendance / Check-In history for this member (Turnstile & Receptionist)
  const memberAttendances = React.useMemo(() => {
    if (!currentMember) return [];
    const cleanName = currentMember.name.toLowerCase().trim();
    return (attendances || [])
      .filter((a) => {
        if (a.memberId === currentMember.id) return true;
        const attName = (a.memberName || (a as any).name || '').toLowerCase().trim();
        return attName === cleanName || (attName && cleanName.includes(attName));
      })
      .sort((a, b) => {
        const timeB = (b.timeIn || '00:00').replace(' WIB', '');
        const timeA = (a.timeIn || '00:00').replace(' WIB', '');
        return new Date(`${b.date}T${timeB}`).getTime() - new Date(`${a.date}T${timeA}`).getTime();
      });
  }, [currentMember, attendances]);

  // Real Total PT Sessions scheduled/active for this member
  const memberPTCount = React.useMemo(() => {
    if (!currentMember) return 0;
    const cleanName = currentMember.name.toLowerCase().trim();
    const direct = bookings.filter(
      (b) => b.memberId === currentMember.id || (b.memberName && b.memberName.toLowerCase().trim() === cleanName)
    );
    const directIds = new Set(direct.map((b) => b.id));
    const erpCount = schedules.filter(
      (s) =>
        (s.memberId === currentMember.id || (s.memberName && s.memberName.toLowerCase().trim() === cleanName)) &&
        !directIds.has(s.id) &&
        (!s.bookingId || !directIds.has(s.bookingId))
    ).length;
    return direct.length + erpCount;
  }, [currentMember, bookings, schedules]);

  // Real expiry and status calculation
  const isMemberExpired = Boolean(currentMember?.expired && currentMember.expired < APP_TODAY);
  const remainingDays = currentMember?.expired
    ? Math.ceil((new Date(currentMember.expired).getTime() - new Date(APP_TODAY).getTime()) / (1000 * 3600 * 24))
    : 0;

  // Login input
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tab in Member Area
  const [activeTab, setActiveTab] = useState<'profile' | 'pt-schedule' | 'workout-logs' | 'attendance' | 'body-comp' | 'active-tickets' | 'history'>('profile');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Selected ticket for enlarged QR view
  const [viewTicketModal, setViewTicketModal] = useState<OnlineReservation | null>(null);
  const passQrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ticketQrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Body Composition state
  const [isAddBodyCompModalOpen, setIsAddBodyCompModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Self-input form fields
  const [selfDate, setSelfDate] = useState(APP_TODAY);
  const [selfWeight, setSelfWeight] = useState('');
  const [selfHeight, setSelfHeight] = useState('170');
  const [selfBodyFat, setSelfBodyFat] = useState('');
  const [selfMuscle, setSelfMuscle] = useState('');
  const [selfVisceral, setSelfVisceral] = useState('');
  const [selfWaist, setSelfWaist] = useState('');
  const [selfChest, setSelfChest] = useState('');
  const [selfHips, setSelfHips] = useState('');
  const [selfArm, setSelfArm] = useState('');
  const [selfThigh, setSelfThigh] = useState('');
  const [selfBP, setSelfBP] = useState('120/80');
  const [selfRHR, setSelfRHR] = useState('72');
  const [selfTargetWeight, setSelfTargetWeight] = useState('');
  const [selfFitnessGoal, setSelfFitnessGoal] = useState<'Weight Loss' | 'Muscle Gain' | 'General Fitness' | 'Endurance'>('Weight Loss');
  const [selfNotes, setSelfNotes] = useState('');

  // Records for currently logged-in member
  const memberBodyRecords = (bodyCompositionRecords || [])
    .filter((r) => currentMember && (r.memberId === currentMember.id || (r.memberName && r.memberName.toLowerCase().trim() === currentMember.name.toLowerCase().trim())))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const memberBodyRecordsDesc = [...memberBodyRecords].reverse();
  const initialBodyRecord = memberBodyRecords.length > 0 ? memberBodyRecords[0] : null;
  const latestBodyRecord = memberBodyRecords.length > 0 ? memberBodyRecords[memberBodyRecords.length - 1] : null;

  const weightDelta = initialBodyRecord && latestBodyRecord
    ? Math.round((latestBodyRecord.weight - initialBodyRecord.weight) * 10) / 10
    : 0;

  const bodyFatDelta = initialBodyRecord?.bodyFatPercentage && latestBodyRecord?.bodyFatPercentage
    ? Math.round((latestBodyRecord.bodyFatPercentage - initialBodyRecord.bodyFatPercentage) * 10) / 10
    : null;

  const muscleDelta = initialBodyRecord?.muscleMass && latestBodyRecord?.muscleMass
    ? Math.round((latestBodyRecord.muscleMass - initialBodyRecord.muscleMass) * 10) / 10
    : null;

  // Live calculation for self-input modal
  const computedSelfBMI = calculateBMI(Number(selfWeight), Number(selfHeight));
  const computedSelfBMICategory = getBMICategory(computedSelfBMI);
  const computedSelfBMR = calculateEstimatedBMR(
    Number(selfWeight) || 70,
    Number(selfHeight) || 170,
    28,
    (loggedInMember?.gender as 'L' | 'P') || 'L'
  );

  const handleOpenSelfInput = () => {
    setSelfDate(APP_TODAY);
    if (latestBodyRecord) {
      setSelfHeight(String(latestBodyRecord.height || 170));
      setSelfWeight(String(latestBodyRecord.weight || ''));
      setSelfTargetWeight(latestBodyRecord.targetWeight ? String(latestBodyRecord.targetWeight) : '');
      setSelfFitnessGoal((latestBodyRecord.fitnessGoal as any) || 'Weight Loss');
    } else {
      setSelfHeight('170');
      setSelfWeight('');
      setSelfTargetWeight('65');
      setSelfFitnessGoal('Weight Loss');
    }
    setSelfBodyFat('');
    setSelfMuscle('');
    setSelfVisceral('');
    setSelfWaist('');
    setSelfChest('');
    setSelfHips('');
    setSelfArm('');
    setSelfThigh('');
    setSelfNotes('');
    setSaveSuccessMsg(null);
    setIsAddBodyCompModalOpen(true);
  };

  const handleSaveSelfInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInMember) return;
    const w = parseFloat(selfWeight);
    const h = parseFloat(selfHeight);
    if (!w || w <= 0 || !h || h <= 0) {
      alert('Berat dan tinggi badan harus diisi dengan angka valid.');
      return;
    }
    const bmiVal = calculateBMI(w, h);
    const bmrVal = calculateEstimatedBMR(
      w,
      h,
      28,
      (loggedInMember.gender as 'L' | 'P') || 'L'
    );

    const newRecord: BodyCompositionRecord = {
      id: 'BC-' + Date.now().toString().slice(-6),
      memberId: loggedInMember.id,
      memberName: loggedInMember.name,
      date: selfDate,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      trainerName: 'Input Mandiri (Member)',
      selfReported: true,
      weight: w,
      height: h,
      bmi: bmiVal,
      bodyFatPercentage: selfBodyFat ? parseFloat(selfBodyFat) : undefined,
      muscleMass: selfMuscle ? parseFloat(selfMuscle) : undefined,
      visceralFat: selfVisceral ? parseInt(selfVisceral, 10) : undefined,
      basalMetabolicRate: bmrVal,
      chest: selfChest ? parseFloat(selfChest) : undefined,
      waist: selfWaist ? parseFloat(selfWaist) : undefined,
      hips: selfHips ? parseFloat(selfHips) : undefined,
      armRight: selfArm ? parseFloat(selfArm) : undefined,
      thighRight: selfThigh ? parseFloat(selfThigh) : undefined,
      bloodPressure: selfBP || undefined,
      restingHeartRate: selfRHR ? parseInt(selfRHR, 10) : undefined,
      targetWeight: selfTargetWeight ? parseFloat(selfTargetWeight) : undefined,
      fitnessGoal: selfFitnessGoal,
      notes: selfNotes || undefined,
      branchId: loggedInMember.branchId,
      branchName: loggedInMember.branchName,
      createdAt: new Date().toISOString()
    };

    if (onSaveBodyCompositionRecord) {
      onSaveBodyCompositionRecord(newRecord);
    }
    setIsAddBodyCompModalOpen(false);
    setSaveSuccessMsg('Pengukuran fisik berhasil disimpan! Pantau terus progres Anda.');
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  const handleShareBodyCompWhatsApp = (record: BodyCompositionRecord) => {
    if (!loggedInMember) return;
    const cat = getBMICategory(record.bmi);
    let msg = `*EVALUASI INBODY & PROGRES RFA GYM*%0A` +
      `Member: *${loggedInMember.name} (${loggedInMember.id})*%0A` +
      `Tanggal: *${formatDateIndo(record.date)}*%0A` +
      `---------------------------------%0A` +
      `• Berat Badan: *${record.weight} kg*%0A` +
      `• Tinggi Badan: *${record.height} cm*%0A` +
      `• BMI: *${record.bmi}* (${cat.label})%0A`;
    if (record.bodyFatPercentage) msg += `• Body Fat: *${record.bodyFatPercentage}%*%0A`;
    if (record.muscleMass) msg += `• Massa Otot: *${record.muscleMass} kg*%0A`;
    if (record.visceralFat) msg += `• Visceral Fat: *Level ${record.visceralFat}*%0A`;
    if (record.basalMetabolicRate) msg += `• BMR: *${record.basalMetabolicRate} kcal*%0A`;
    if (record.waist) msg += `• Lingkar Pinggang: *${record.waist} cm*%0A`;
    if (record.notes) msg += `• Catatan: _${record.notes}_%0A`;
    msg += `---------------------------------%0A` +
      `Semangat latihan & salam bugar dari RFA Gym!`;

    const url = `https://wa.me/?text=${msg}`;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
  };

  const handleShareWorkoutLogWhatsApp = (log: TrainerWorkoutLog) => {
    if (!currentMember) return;
    let msg = `*CATATAN HASIL LATIHAN PT RFA GYM*%0A` +
      `Member: *${currentMember.name} (${currentMember.id})*%0A` +
      `Coach: *${log.trainerName}*%0A` +
      `Tanggal: *${formatDateIndo(log.date)}${log.time ? ' pukul ' + log.time : ''}*%0A` +
      `Sesi: *Ke-${log.sessionNumber || '-'}*%0A` +
      `Fokus: *${log.focusArea}*%0A` +
      `---------------------------------%0A` +
      `*Rincian Gerakan & Beban:*%0A${encodeURIComponent(log.exercisesSummary)}%0A` +
      `---------------------------------%0A` +
      `• Tingkat RPE: *${log.rpeRate}/10*%0A` +
      (log.formQuality ? `• Evaluasi Form: *${log.formQuality}*%0A` : '') +
      (log.condition ? `• Kondisi Fisik: *${log.condition}*%0A` : '') +
      (log.coachNotes ? `• Catatan Pelatih: _${log.coachNotes}_%0A` : '') +
      (log.nextSessionGoal ? `• Target Sesi Berikutnya: *${log.nextSessionGoal}*%0A` : '') +
      `---------------------------------%0A` +
      `Disiplin latihan membawa hasil nyata! Salam bugar dari RFA Gym.`;

    const url = `https://wa.me/?text=${msg}`;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const clean = loginInput.trim().toLowerCase();
    if (!clean) {
      setLoginError('Silakan masukkan No. HP atau ID Member Anda.');
      return;
    }

    const matched = members.find((m) => {
      const matchId = m.id.toLowerCase() === clean;
      const matchPhone = m.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '');
      const matchName = m.name.toLowerCase().includes(clean);
      return matchId || matchPhone || matchName;
    });

    if (matched) {
      onLoginMember(matched);
      setLoginInput('');
    } else {
      setLoginError('Member tidak ditemukan. Periksa kembali ID Member (cth: M001) atau No. HP Anda.');
    }
  };

  // Member reservations
  const memberReservations = reservations.filter((r) => {
    if (!currentMember) return false;
    const matchId = r.memberId === currentMember.id;
    const matchPhone = r.customerPhone.replace(/[^0-9]/g, '') === currentMember.phone.replace(/[^0-9]/g, '');
    const matchName = r.customerName.toLowerCase() === currentMember.name.toLowerCase();
    return matchId || matchPhone || matchName;
  });

  const activeTickets = memberReservations.filter((r) => r.status === 'CONFIRMED');

  const filteredHistory = memberReservations.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  // Render QR Code for Member Pass
  useEffect(() => {
    if (currentMember && passQrCanvasRef.current && (window as any).QRious) {
      try {
        new (window as any).QRious({
          element: passQrCanvasRef.current,
          value: `RFA-MEMBER|${currentMember.id}|${currentMember.name}|${currentMember.status || 'AKTIF'}`,
          size: 140,
          level: 'H'
        });
      } catch (e) {
        console.error('Error drawing member QR', e);
      }
    }
  }, [currentMember, activeTab]);

  // Render QR Code for Ticket Modal
  useEffect(() => {
    if (viewTicketModal && ticketQrCanvasRef.current && (window as any).QRious) {
      try {
        new (window as any).QRious({
          element: ticketQrCanvasRef.current,
          value: viewTicketModal.qrCodeData,
          size: 160,
          level: 'H'
        });
      } catch (e) {
        console.error('Error drawing ticket QR', e);
      }
    }
  }, [viewTicketModal]);

  const handleShareWhatsAppTicket = (ticket: OnlineReservation) => {
    const msg = `*TIKET RESERVASI RFA GYM*%0A` +
      `No. Booking: *${ticket.id}*%0A` +
      `Passcode: *${ticket.ticketPassCode}*%0A` +
      `Program: *${ticket.programName}*%0A` +
      `Waktu: *${ticket.targetDate} (${ticket.timeSlot})*%0A` +
      `Cabang: *${ticket.branchName}*%0A` +
      `Status: *TERKONFIRMASI*`;

    const waUrl = `https://wa.me/?text=${msg}`;
    try {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-landing-page="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {loggedInMember ? `Dashboard Member RFA` : 'Autentikasi & Area Member'}
              </h3>
              <p className="text-xs text-zinc-400">
                {loggedInMember
                  ? `Selamat datang kembali, ${loggedInMember.name}`
                  : 'Masuk dengan No. HP atau ID Member untuk cek tiket & status'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-200">
          {/* STATE 1: MEMBER NOT LOGGED IN -> LOGIN FORM */}
          {!loggedInMember ? (
            <div className="max-w-md mx-auto py-4 space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-white">Login Member RFA Gym</h4>
                <p className="text-xs text-zinc-400">
                  Akses instan tanpa password ribet. Masukkan ID Member atau nomor WhatsApp terdaftar Anda.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Nomor WhatsApp atau ID Member
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: M001 atau 081234567890"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : currentMember && (
            /* STATE 2: MEMBER LOGGED IN -> DASHBOARD MEMBER */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Profile Top Card */}
              <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-center sm:text-left">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 font-black text-xl flex items-center justify-center shrink-0">
                    {currentMember.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h4 className="text-base font-extrabold text-white">{currentMember.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                          currentMember.isFrozen
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : isMemberExpired
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {currentMember.isFrozen ? 'DIBEKUKAN' : isMemberExpired ? 'KADALUARSA' : 'AKTIF PENUH'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ID: <span className="font-mono text-zinc-200">{currentMember.id}</span> • {currentMember.phone}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Cabang: <span className="text-zinc-300">{currentMember.branchName || 'GymPro Flagship Kelapa Gading'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenNewReservation}
                    className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Booking Slot</span>
                  </button>

                  <button
                    onClick={onLogoutMember}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs flex items-center gap-1"
                    title="Logout dari Area Member"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
                {[
                  { id: 'profile', label: 'Profil & Kartu Pass' },
                  {
                    id: 'pt-schedule',
                    label: `Jadwal PT (${memberPTCount})`
                  },
                  {
                    id: 'workout-logs',
                    label: `Hasil Latihan PT (${memberWorkoutLogs.length})`
                  },
                  {
                    id: 'attendance',
                    label: `Presensi Masuk (${memberAttendances.length})`
                  },
                  { id: 'body-comp', label: `InBody & Progres (${memberBodyRecords.length})` },
                  { id: 'active-tickets', label: `Tiket Aktif (${activeTickets.length})` },
                  { id: 'history', label: `Riwayat Reservasi (${memberReservations.length})` }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === t.id
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Success Notification Alert */}
              {saveSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{saveSuccessMsg}</span>
                  </div>
                  <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* TAB 1: Profil & Digital Member Pass */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Membership Alert If Expired or Frozen */}
                  {isMemberExpired && (
                    <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-rose-200">Keanggotaan Anda Telah Kadaluarsa</h5>
                        <p className="mt-0.5 text-[11px] text-rose-300/90 leading-relaxed">
                          Masa aktif membership Anda berakhir pada <strong>{formatDateIndo(currentMember.expired)}</strong>. Pintu gerbang turnstile otomatis dan hak reservasi terkunci sementara. Silakan hubungi kasir atau perpanjang paket keanggotaan Anda.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentMember.isFrozen && (
                    <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-blue-200">Status Keanggotaan Sedang Dibekukan (Freeze)</h5>
                        <p className="mt-0.5 text-[11px] text-blue-300/90 leading-relaxed">
                          Keanggotaan Anda saat ini dalam masa cuti pembekuan (freeze). Akses masuk gym dinonaktifkan sementara hingga periode pembekuan berakhir.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Live Attendance / In-Gym Indicator */}
                  {(() => {
                    const todayActive = memberAttendances.find(
                      (a) => a.date === APP_TODAY && (!a.timeOut || a.timeOut.trim() === '')
                    );
                    if (todayActive) {
                      const branchUnit =
                        todayActive.branchName ||
                        (currentMember.branchId === 'BR-002'
                          ? 'RFA Gym Senopati Lifestyle Hub'
                          : currentMember.branchId === 'BR-003'
                          ? 'RFA Gym Express BSD Green Office'
                          : currentMember.branchName || 'RFA GYM Cibubur, Bekasi (Flagship HQ)');
                      return (
                        <div className="p-4 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs animate-pulse">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            <div>
                              <span className="font-extrabold text-emerald-300 block">
                                STATUS PRESENSI HARI INI: SEDANG LATIHAN DI GYM
                              </span>
                              <span className="text-zinc-200 text-[11px] flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                <span>
                                  Unit Cabang: <strong className="text-white">{branchUnit}</strong> • Masuk Pukul:{' '}
                                  <strong className="text-emerald-400 font-mono">{todayActive.timeIn}</strong>
                                </span>
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('attendance')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition cursor-pointer"
                          >
                            Lihat Presensi &rarr;
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Membership Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Status Member</span>
                      <span
                        className={`text-sm font-extrabold mt-1 block ${
                          currentMember.isFrozen
                            ? 'text-blue-400'
                            : isMemberExpired
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {currentMember.isFrozen ? 'Dibekukan' : isMemberExpired ? 'Kadaluarsa' : 'Aktif Penuh'}
                      </span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">
                        {isMemberExpired
                          ? `${Math.abs(remainingDays)} hari lalu`
                          : `Sisa ${remainingDays} hari`}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Paket Utama</span>
                      <span className="text-xs font-extrabold text-white mt-1 block truncate">
                        {currentMember.classPackageName || currentMember.membershipType || 'Reguler All-Access'}
                      </span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">
                        {currentMember.branchName || 'Cabang Utama'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sisa Kuota PT</span>
                      <span className="text-sm font-extrabold text-orange-400 mt-1 block">
                        {ptSummary ? ptSummary.remainingAvailable : (currentMember.ptQuota ?? 0)} Sesi
                      </span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">
                        {ptSummary ? `${ptSummary.completedSessions} Selesai • ${ptSummary.scheduledSessions} Booking` : 'Sesi Personal Trainer'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('pt-schedule')}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-bold mt-1 underline block text-left"
                      >
                        Buka Jadwal PT &rarr;
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Berlaku Hingga</span>
                      <span className="text-xs font-extrabold text-zinc-200 mt-1 block">
                        {currentMember.expired || '2026-12-31'}
                      </span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">
                        PIC: {currentMember.picName || 'Staf Front Desk'}
                      </span>
                    </div>
                  </div>

                  {/* Secondary Detail Row: Quota Studio, Presensi, Trainer Assigned */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Personal Trainer Ditugaskan</span>
                      <span className="font-extrabold text-white mt-1 block">
                        {ptSummary?.assignedTrainer?.name || currentMember.picName || 'Belum Ditugaskan'}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {memberWorkoutLogs.length} hasil latihan terekam
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sisa Kuota Kelas Studio</span>
                      <span className="font-extrabold text-white mt-1 block">
                        {currentMember.classQuota ?? 0} Sesi Kelas
                      </span>
                      <span className="text-[10px] text-zinc-500">Zumba, Yoga, HIIT & Pilates</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Presensi Kedatangan Gym</span>
                      <span className="font-extrabold text-white mt-1 block">
                        {memberAttendances.length} Kali Check-in
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('attendance')}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-bold underline"
                      >
                        Lihat Riwayat Jam Latihan &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Digital Turnstile Pass Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-orange-500/30 text-center flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">
                      SMART DIGITAL TURNSTILE PASS
                    </span>
                    <h5 className="text-base font-extrabold text-white mb-1">
                      {currentMember.name} • {currentMember.id}
                    </h5>
                    <p className="text-xs text-zinc-400 mb-4 font-mono">
                      No. WhatsApp: {currentMember.phone}
                    </p>

                    <div className="p-3 bg-white rounded-2xl shadow-inner mb-3">
                      <canvas ref={passQrCanvasRef} width={130} height={130} className="w-28 h-28" />
                    </div>

                    <p className="text-[11px] text-zinc-400 max-w-sm">
                      Pindai QR Code ini pada scanner gerbang turnstile otomatis untuk check-in presensi masuk gym tanpa antre.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: Personal Trainer (Booking Jadwal PT Member) */}
              {activeTab === 'pt-schedule' && currentMember && (
                <MemberPTBookingSection
                  loggedInMember={currentMember}
                  ptPurchases={ptPurchases}
                  bookings={bookings}
                  schedules={schedules}
                  trainers={trainers}
                  trainerChangeRequests={trainerChangeRequests}
                  trainerWorkingRules={trainerWorkingRules}
                  workSchedules={workSchedules}
                  staffAttendances={staffAttendances}
                  leaveRequests={leaveRequests}
                  studioClasses={studioClasses}
                  onAddBooking={onAddBooking || (() => {})}
                  onRescheduleBooking={onRescheduleBooking || (() => {})}
                  onCancelBooking={onCancelBooking || (() => {})}
                  onRequestChangeTrainer={onRequestChangeTrainer || (() => {})}
                  showToast={showToast || (() => {})}
                  onOpenNewReservation={onOpenNewReservation}
                />
              )}

              {/* TAB: Hasil Latihan PT & Evaluasi Coach (Mode Fokus Pelatih) */}
              {activeTab === 'workout-logs' && currentMember && (
                <div className="space-y-6">
                  {/* Top Banner */}
                  <div className="p-4 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Catatan Hasil Latihan Personal Trainer</h4>
                        <p className="text-[11px] text-zinc-400">
                          Data hasil latihan riil dari Mode Fokus Pelatih lengkap dengan PR beban, evaluasi form, dan catatan pelatih.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('pt-schedule')}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span>Booking Sesi Berikutnya</span>
                    </button>
                  </div>

                  {/* Quick Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Sesi Tercatat</span>
                      <span className="text-lg font-black text-white mt-1 block">
                        {memberWorkoutLogs.length} Sesi
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sesi Terkini</span>
                      <span className="text-xs font-black text-amber-400 mt-1 block">
                        {memberWorkoutLogs[0]?.date ? formatDateIndo(memberWorkoutLogs[0].date) : '-'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Rata-Rata RPE</span>
                      <span className="text-lg font-black text-rose-400 mt-1 block">
                        {memberWorkoutLogs.length > 0
                          ? (memberWorkoutLogs.reduce((acc, l) => acc + (l.rpeRate || 7), 0) / memberWorkoutLogs.length).toFixed(1)
                          : '-'}{' '}
                        <span className="text-xs text-zinc-500 font-normal">/ 10</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Pelatih Terkini</span>
                      <span className="text-xs font-black text-white mt-1 block truncate">
                        {memberWorkoutLogs[0]?.trainerName || ptSummary?.assignedTrainer?.name || 'Coach RFA'}
                      </span>
                    </div>
                  </div>

                  {/* List of Workout Logs */}
                  {memberWorkoutLogs.length === 0 ? (
                    <div className="p-8 sm:p-10 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
                      <Dumbbell className="w-10 h-10 text-zinc-600 mx-auto" />
                      <h5 className="text-sm font-bold text-zinc-200">Belum Ada Catatan Hasil Latihan</h5>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                        Hasil sesi latihan Anda bersama Personal Trainer akan tercatat di sini secara otomatis setelah pelatih merekam hasil sesi di Mode Fokus Pelatih.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('pt-schedule')}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition"
                      >
                        Buka Jadwal PT & Booking Sesi
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {memberWorkoutLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/40 transition-all space-y-4 shadow-lg shadow-black/40"
                        >
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black">
                                {log.sessionNumber ? `Sesi Ke-${log.sessionNumber}` : 'Sesi PT'}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                <span>{formatDateIndo(log.date)}</span>
                                {log.time && (
                                  <span className="text-zinc-400 font-mono text-[11px]">
                                    ({log.time} WIB)
                                  </span>
                                )}
                              </div>
                              {log.durationMinutes && (
                                <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-lg">
                                  {log.durationMinutes} Menit
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1">
                                <User className="w-3 h-3 text-orange-400" />
                                <span>Coach: {log.trainerName}</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleShareWorkoutLogWhatsApp(log)}
                                className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                                title="Bagikan Hasil Sesi ke WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Bagikan</span>
                              </button>
                            </div>
                          </div>

                          {/* Focus Area */}
                          <div className="flex items-center gap-2 text-white">
                            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                            <h5 className="text-sm font-black tracking-wide">{log.focusArea}</h5>
                          </div>

                          {/* Exercises & Load Details */}
                          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                              Daftar Gerakan, Set, Reps & Beban (PR):
                            </span>
                            <div className="text-xs text-zinc-200 font-mono leading-relaxed whitespace-pre-line">
                              {log.exercisesSummary}
                            </div>
                          </div>

                          {/* Performance & Condition Badges */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
                              <span className="text-[9px] text-zinc-400 uppercase font-bold block">Tingkat RPE</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-sm font-black text-rose-400">{log.rpeRate}/10</span>
                                <span className="text-[10px] text-zinc-400">
                                  {log.rpeRate >= 8 ? 'Tinggi' : log.rpeRate >= 6 ? 'Sedang' : 'Ringan'}
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
                              <span className="text-[9px] text-zinc-400 uppercase font-bold block">Evaluasi Form</span>
                              <div className="flex items-center gap-1 mt-1 text-emerald-400 font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{log.formQuality || 'Baik'}</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
                              <span className="text-[9px] text-zinc-400 uppercase font-bold block">Kondisi Fisik</span>
                              <span className="text-xs font-bold text-zinc-200 mt-1 block truncate">
                                {log.condition || 'Prima'}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
                              <span className="text-[9px] text-zinc-400 uppercase font-bold block">Berat Sesi</span>
                              <span className="text-xs font-bold text-amber-400 mt-1 block">
                                {log.weightProgressKg ? `${log.weightProgressKg} kg` : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Coach Notes */}
                          {log.coachNotes && (
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                              <span className="text-[10px] font-black uppercase text-amber-400 block mb-0.5">
                                Catatan Khusus Pelatih (Coach Notes):
                              </span>
                              <p className="italic leading-relaxed">"{log.coachNotes}"</p>
                            </div>
                          )}

                          {/* Next Session Goal */}
                          {log.nextSessionGoal && (
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-start gap-2">
                              <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] font-black uppercase text-emerald-400 block mb-0.5">
                                  Target Progres Sesi Berikutnya:
                                </span>
                                <p className="leading-relaxed font-semibold">{log.nextSessionGoal}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Presensi Masuk & Riwayat Kunjungan Gym */}
              {activeTab === 'attendance' && currentMember && (
                <div className="space-y-6">
                  {/* Top Banner */}
                  <div className="p-4 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Presensi Masuk & Jam Latihan di Gym</h4>
                        <p className="text-[11px] text-zinc-400">
                          Catatan otomatis pemindaian turnstile gate dan presensi resepsionis RFA Gym.
                        </p>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300">
                      ID: {currentMember.id}
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Kunjungan</span>
                      <span className="text-2xl font-black text-white mt-1 block">
                        {memberAttendances.length} <span className="text-xs text-zinc-500 font-normal">Kali</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Kunjungan Bulan Ini</span>
                      <span className="text-2xl font-black text-emerald-400 mt-1 block">
                        {memberAttendances.filter((a) => a.date.startsWith(APP_TODAY.slice(0, 7))).length}{' '}
                        <span className="text-xs text-zinc-500 font-normal">Sesi</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Status Hari Ini ({APP_TODAY})</span>
                      <div className="mt-1">
                        {(() => {
                          const todayLog = memberAttendances.find((a) => a.date === APP_TODAY);
                          if (todayLog && (!todayLog.timeOut || todayLog.timeOut.trim() === '')) {
                            const activeBranchUnit =
                              todayLog.branchName ||
                              (currentMember.branchId === 'BR-002'
                                ? 'RFA Gym Senopati Lifestyle Hub'
                                : currentMember.branchId === 'BR-003'
                                ? 'RFA Gym Express BSD Green Office'
                                : currentMember.branchName || 'RFA GYM Cibubur, Bekasi (Flagship HQ)');
                            return (
                              <div className="space-y-1">
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30 inline-flex items-center gap-1.5 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  Sedang Latihan ({todayLog.timeIn})
                                </span>
                                <div className="text-[11px] text-zinc-300 font-semibold flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                  <span>Unit Cabang: <strong className="text-white">{activeBranchUnit}</strong></span>
                                </div>
                              </div>
                            );
                          }
                          if (todayLog && todayLog.timeOut) {
                            return (
                              <div className="space-y-0.5">
                                <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold inline-block">
                                  Selesai Latihan ({todayLog.timeIn} - {todayLog.timeOut})
                                </span>
                                <span className="text-[10px] text-zinc-400 block truncate">
                                  Unit: {todayLog.branchName || currentMember.branchName}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <span className="text-xs font-bold text-zinc-500">
                              Belum Check-In Hari Ini
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Table of Attendances */}
                  {memberAttendances.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-2">
                      <QrCode className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h5 className="text-sm font-bold text-zinc-300">Belum Ada Riwayat Check-In</h5>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Gunakan Digital Turnstile Pass pada tab profil Anda untuk check-in saat tiba di gym.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-2">
                        <span>Riwayat Presensi ({memberAttendances.length})</span>
                        <span className="text-[10px] text-zinc-500">Urut Terbaru</span>
                      </div>

                      {memberAttendances.map((att, idx) => (
                        <div
                          key={att.id || idx}
                          className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{formatDateIndo(att.date)}</span>
                              {!att.timeOut ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  SEDANG LATIHAN ({(att as any).branchName || (currentMember.branchId === 'BR-002' ? 'Senopati Hub' : currentMember.branchId === 'BR-003' ? 'BSD Green Office' : currentMember.branchName || 'Cibubur Flagship HQ')})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                                  SELESAI
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                              <span>Masuk: <strong className="text-white font-mono">{att.timeIn || '-'}</strong></span>
                              <span>Keluar: <strong className="text-white font-mono">{att.timeOut || '-'}</strong></span>
                              <span>Pintu: <strong className="text-zinc-300">{(att as any).gate || 'Turnstile #1'}</strong></span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-zinc-200 font-bold block flex items-center justify-end gap-1">
                              <Building2 className="w-3 h-3 text-orange-400 shrink-0" />
                              <span>{(att as any).branchName || (currentMember.branchId === 'BR-002' ? 'RFA Gym Senopati Lifestyle Hub' : currentMember.branchId === 'BR-003' ? 'RFA Gym Express BSD Green Office' : currentMember.branchName || 'RFA GYM Cibubur, Bekasi (Flagship HQ)')}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {(att as any).method || 'QR Scanner'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Tiket Reservasi Aktif */}
              {activeTab === 'active-tickets' && (
                <div className="space-y-4">
                  {activeTickets.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
                      <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h5 className="text-sm font-bold text-zinc-300">Belum Ada Tiket Reservasi Aktif</h5>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Anda belum memiliki jadwal reservasi kelas studio atau sesi latihan yang akan datang.
                      </p>
                      <button
                        onClick={onOpenNewReservation}
                        className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
                      >
                        Pesan Slot Latihan Sekarang
                      </button>
                    </div>
                  ) : (
                    activeTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        <div className="space-y-1 text-center sm:text-left">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <span className="text-xs font-mono font-bold text-orange-400">{t.id}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                              {t.status}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">{t.programName}</h4>
                          <p className="text-xs text-zinc-400">
                            {t.targetDate} ({t.timeSlot}) • {t.branchName}
                          </p>
                          {t.trainerName && (
                            <p className="text-xs text-zinc-400">Coach: {t.trainerName}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setViewTicketModal(t)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5 text-orange-400" />
                            <span>Lihat QR</span>
                          </button>

                          <button
                            onClick={() => handleShareWhatsAppTicket(t)}
                            className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                            title="Kirim ke WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onCancelReservation(t.id)}
                            className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            title="Batalkan Reservasi"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: Evaluasi InBody & Komposisi Tubuh */}
              {activeTab === 'body-comp' && (
                <div className="space-y-6">
                  {/* Tab Top Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Evaluasi & Komposisi Tubuh (InBody)</h4>
                        <p className="text-[11px] text-zinc-400">
                          Pantau perubahan berat badan, massa otot, persentase lemak, dan target kebugaran Anda.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleOpenSelfInput}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Input Pengukuran Mandiri</span>
                      </button>

                      {latestBodyRecord && (
                        <button
                          type="button"
                          onClick={() => handleShareBodyCompWhatsApp(latestBodyRecord)}
                          className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                          title="Kirim Ringkasan InBody ke WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Empty State if No Records */}
                  {memberBodyRecords.length === 0 ? (
                    <div className="p-8 sm:p-10 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
                        <Scale className="w-8 h-8" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <h5 className="text-base font-black text-white">Belum Ada Riwayat Pengukuran Tubuh</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Anda dapat menginput data berat badan, tinggi badan, dan lingkar tubuh Anda secara mandiri di sini kapan saja, atau minta trainer saat sesi evaluasi.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenSelfInput}
                        className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Input Pengukuran Pertama Sekarang</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Top Metric Cards */}
                      {latestBodyRecord && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Weight */}
                          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                              Berat Badan
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-1.5">
                              <span className="text-2xl font-black text-white">{latestBodyRecord.weight}</span>
                              <span className="text-xs text-zinc-400 font-bold">kg</span>
                            </div>
                            {initialBodyRecord && memberBodyRecords.length > 1 && (
                              <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
                                {weightDelta < 0 ? (
                                  <span className="text-emerald-400 flex items-center gap-0.5">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    {Math.abs(weightDelta)} kg turun
                                  </span>
                                ) : weightDelta > 0 ? (
                                  <span className="text-amber-400 flex items-center gap-0.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    +{weightDelta} kg naik
                                  </span>
                                ) : (
                                  <span className="text-zinc-400">Stabil</span>
                                )}
                                <span className="text-[10px] text-zinc-500">vs awal</span>
                              </div>
                            )}
                          </div>

                          {/* BMI */}
                          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                              Indeks BMI
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-1.5">
                              <span className="text-2xl font-black text-amber-400">{latestBodyRecord.bmi}</span>
                            </div>
                            <div className="mt-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                  getBMICategory(latestBodyRecord.bmi).badge
                                }`}
                              >
                                {getBMICategory(latestBodyRecord.bmi).label.split('(')[0].trim()}
                              </span>
                            </div>
                          </div>

                          {/* Body Fat % */}
                          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                              Body Fat %
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-1.5">
                              <span className="text-2xl font-black text-rose-400">
                                {latestBodyRecord.bodyFatPercentage ?? '-'}
                              </span>
                              {latestBodyRecord.bodyFatPercentage && (
                                <span className="text-xs text-zinc-400 font-bold">%</span>
                              )}
                            </div>
                            {bodyFatDelta !== null && memberBodyRecords.length > 1 && (
                              <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
                                {bodyFatDelta < 0 ? (
                                  <span className="text-emerald-400 flex items-center gap-0.5">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    {Math.abs(bodyFatDelta)}% lemak turun
                                  </span>
                                ) : (
                                  <span className="text-rose-400 flex items-center gap-0.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    +{bodyFatDelta}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Muscle Mass */}
                          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                              Massa Otot
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-1.5">
                              <span className="text-2xl font-black text-emerald-400">
                                {latestBodyRecord.muscleMass ?? '-'}
                              </span>
                              {latestBodyRecord.muscleMass && (
                                <span className="text-xs text-zinc-400 font-bold">kg</span>
                              )}
                            </div>
                            {muscleDelta !== null && memberBodyRecords.length > 1 && (
                              <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
                                {muscleDelta > 0 ? (
                                  <span className="text-emerald-400 flex items-center gap-0.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    +{muscleDelta} kg otot gain
                                  </span>
                                ) : (
                                  <span className="text-zinc-400">{muscleDelta} kg</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Secondary Vitals Grid */}
                      {latestBodyRecord && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Visceral Fat</span>
                            <span className="text-xs font-black text-zinc-200 mt-1 block">
                              {latestBodyRecord.visceralFat ? `Tingkat ${latestBodyRecord.visceralFat}` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">BMR (Metabolisme)</span>
                            <span className="text-xs font-black text-zinc-200 mt-1 block">
                              {latestBodyRecord.basalMetabolicRate ? `${latestBodyRecord.basalMetabolicRate} kkal/hari` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Tekanan Darah</span>
                            <span className="text-xs font-black text-zinc-200 mt-1 block">
                              {latestBodyRecord.bloodPressure || '120/80 mmHg'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Denyut Nadi Istirahat</span>
                            <span className="text-xs font-black text-zinc-200 mt-1 block">
                              {latestBodyRecord.restingHeartRate ? `${latestBodyRecord.restingHeartRate} bpm` : '-'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Target Weight & Goal Progress */}
                      {latestBodyRecord?.targetWeight && (
                        <div className="p-4 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/20 border border-amber-500/20 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-300">
                              Target Berat: <strong className="text-amber-400 font-black">{latestBodyRecord.targetWeight} kg</strong> ({latestBodyRecord.fitnessGoal || 'Weight Loss'})
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Sisa selisih: <strong className="text-white">{Math.abs(Math.round((latestBodyRecord.weight - latestBodyRecord.targetWeight) * 10) / 10)} kg</strong>
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    Math.round(
                                      (1 - Math.abs(latestBodyRecord.weight - latestBodyRecord.targetWeight) / 15) * 100
                                    ),
                                    15
                                  ),
                                  100
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Mini SVG Progress Timeline */}
                      {memberBodyRecords.length > 1 && (
                        <div className="p-4 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                              <span>Grafik Progres Berat Badan (kg)</span>
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {memberBodyRecords.length} sesi pengukuran tercatat
                            </span>
                          </div>
                          <div className="h-32 w-full pt-2">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100">
                              {/* Grid lines */}
                              <line x1="0" y1="20" x2="500" y2="20" stroke="#27272a" strokeDasharray="3 3" />
                              <line x1="0" y1="50" x2="500" y2="50" stroke="#27272a" strokeDasharray="3 3" />
                              <line x1="0" y1="80" x2="500" y2="80" stroke="#27272a" strokeDasharray="3 3" />

                              {/* Compute points */}
                              {(() => {
                                const weights = memberBodyRecords.map((r) => r.weight);
                                const minW = Math.min(...weights) - 2;
                                const maxW = Math.max(...weights) + 2;
                                const range = maxW - minW || 1;
                                const stepX = 500 / Math.max(memberBodyRecords.length - 1, 1);

                                const pts = memberBodyRecords.map((r, i) => {
                                  const x = i * stepX;
                                  const y = 85 - ((r.weight - minW) / range) * 70;
                                  return { x, y, r };
                                });

                                const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

                                return (
                                  <>
                                    <path
                                      d={pathD}
                                      fill="none"
                                      stroke="#f97316"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    {pts.map((p, i) => (
                                      <g key={i}>
                                        <circle cx={p.x} cy={p.y} r="5" fill="#f97316" stroke="#18181b" strokeWidth="2" />
                                        <text
                                          x={p.x}
                                          y={p.y - 10}
                                          fill="#ffffff"
                                          fontSize="10"
                                          fontWeight="bold"
                                          textAnchor="middle"
                                        >
                                          {p.r.weight}kg
                                        </text>
                                        <text
                                          x={p.x}
                                          y="96"
                                          fill="#71717a"
                                          fontSize="9"
                                          textAnchor="middle"
                                        >
                                          {p.r.date.slice(5)}
                                        </text>
                                      </g>
                                    ))}
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Circumferences Summary */}
                      {latestBodyRecord && (latestBodyRecord.waist || latestBodyRecord.chest || latestBodyRecord.armRight) && (
                        <div className="p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                          <span className="text-xs font-black text-zinc-300 block">
                            Ukuran Lingkar Tubuh Terkini (cm)
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                              <span className="text-[9px] text-zinc-500 uppercase font-bold block">Dada</span>
                              <span className="text-xs font-black text-white">{latestBodyRecord.chest ?? '-'} cm</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                              <span className="text-[9px] text-zinc-500 uppercase font-bold block">Pinggang</span>
                              <span className="text-xs font-black text-amber-400">{latestBodyRecord.waist ?? '-'} cm</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                              <span className="text-[9px] text-zinc-500 uppercase font-bold block">Pinggul</span>
                              <span className="text-xs font-black text-white">{latestBodyRecord.hips ?? '-'} cm</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                              <span className="text-[9px] text-zinc-500 uppercase font-bold block">Lengan</span>
                              <span className="text-xs font-black text-white">{latestBodyRecord.armRight ?? '-'} cm</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                              <span className="text-[9px] text-zinc-500 uppercase font-bold block">Paha</span>
                              <span className="text-xs font-black text-white">{latestBodyRecord.thighRight ?? '-'} cm</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* History Log Table */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-white uppercase tracking-wider">
                            Riwayat Pengukuran ({memberBodyRecords.length})
                          </h5>
                          <span className="text-[10px] text-zinc-500">Urut terbaru</span>
                        </div>

                        <div className="space-y-2">
                          {memberBodyRecordsDesc.map((rec) => (
                            <div
                              key={rec.id}
                              className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white">{formatDateIndo(rec.date)}</span>
                                  {rec.time && <span className="text-zinc-500 font-mono text-[10px]">{rec.time}</span>}
                                  {rec.selfReported ? (
                                    <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[9px] font-black">
                                      INPUT MANDIRI
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black">
                                      EVALUASI TRAINER
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-zinc-300 flex-wrap">
                                  <span>BB: <strong className="text-white">{rec.weight} kg</strong></span>
                                  <span>BMI: <strong className="text-amber-400">{rec.bmi}</strong></span>
                                  {rec.bodyFatPercentage && <span>Fat: <strong className="text-rose-400">{rec.bodyFatPercentage}%</strong></span>}
                                  {rec.muscleMass && <span>Otot: <strong className="text-emerald-400">{rec.muscleMass} kg</strong></span>}
                                  {rec.waist && <span>Pinggang: <strong>{rec.waist} cm</strong></span>}
                                </div>
                                {rec.notes && (
                                  <p className="text-[11px] text-zinc-400 italic">"{rec.notes}"</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => handleShareBodyCompWhatsApp(rec)}
                                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] flex items-center gap-1"
                                >
                                  <Share2 className="w-3 h-3 text-emerald-400" />
                                  <span>Share WA</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: Riwayat Reservasi (Filter Status) */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {/* Status Filter Buttons */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold overflow-x-auto">
                    {[
                      { id: 'ALL', label: 'Semua' },
                      { id: 'CONFIRMED', label: 'Terkonfirmasi' },
                      { id: 'COMPLETED', label: 'Selesai' },
                      { id: 'CANCELLED', label: 'Dibatalkan' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id as any)}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                          statusFilter === f.id
                            ? 'bg-orange-500 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {filteredHistory.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-500 text-xs">
                      Tidak ada data reservasi untuk filter ini.
                    </div>
                  ) : (
                    filteredHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-400">{h.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                h.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : h.status === 'CANCELLED'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {h.status}
                            </span>
                          </div>
                          <h5 className="font-bold text-white mt-1">{h.programName}</h5>
                          <p className="text-zinc-400">
                            {h.targetDate} ({h.timeSlot}) • {h.branchName}
                          </p>
                        </div>

                        <span className="text-[11px] text-zinc-500 font-mono">
                          {h.bookingDate}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enlarged QR Ticket View Popup */}
        {viewTicketModal && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400">
                  {viewTicketModal.id}
                </span>
                <button
                  onClick={() => setViewTicketModal(null)}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-lg font-black text-white">{viewTicketModal.programName}</h4>
              <p className="text-xs text-zinc-400">{viewTicketModal.timeSlot}</p>

              <div className="p-4 bg-white rounded-2xl inline-block mx-auto">
                <canvas ref={ticketQrCanvasRef} width={150} height={150} className="w-36 h-36" />
              </div>

              <p className="text-xs font-mono font-bold text-zinc-300">
                PASSCODE: {viewTicketModal.ticketPassCode}
              </p>

              <button
                onClick={() => setViewTicketModal(null)}
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs"
              >
                Tutup Tampilan QR
              </button>
            </div>
          </div>
        )}

        {/* Self-Input Modal for Members */}
        {isAddBodyCompModalOpen && (
          <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
              {/* Header */}
              <div className="p-5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">Input Pengukuran Mandiri</h4>
                    <p className="text-xs text-zinc-400">
                      Catat metrik tubuh & komposisi fisik Anda secara berkala
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBodyCompModalOpen(false)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveSelfInput} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Live BMI & Status Indicator Banner */}
                {Number(selfWeight) > 0 && Number(selfHeight) > 0 && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Kalkulasi Otomatis</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-lg font-black text-white">BMI: {computedSelfBMI}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${computedSelfBMICategory.badge}`}>
                          {computedSelfBMICategory.label.split('(')[0].trim()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Estimasi BMR</span>
                      <span className="text-xs font-black text-amber-400">{computedSelfBMR} kkal/hari</span>
                    </div>
                  </div>
                )}

                {/* Primary Vitals: Date, Weight, Height */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Tanggal Ukur *
                    </label>
                    <input
                      type="date"
                      required
                      value={selfDate}
                      onChange={(e) => setSelfDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Berat Badan (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="300"
                      required
                      placeholder="cth: 72.5"
                      value={selfWeight}
                      onChange={(e) => setSelfWeight(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono font-bold focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Tinggi Badan (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="80"
                      max="250"
                      required
                      placeholder="cth: 172"
                      value={selfHeight}
                      onChange={(e) => setSelfHeight(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono font-bold focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* InBody Specifics: Fat %, Muscle Mass, Visceral Fat */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block">
                    Metrik InBody / Smart Scale (Opsional)
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Body Fat (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="cth: 22.5"
                        value={selfBodyFat}
                        onChange={(e) => setSelfBodyFat(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Massa Otot (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="cth: 33.0"
                        value={selfMuscle}
                        onChange={(e) => setSelfMuscle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Visceral Fat (1-20)</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        placeholder="cth: 6"
                        value={selfVisceral}
                        onChange={(e) => setSelfVisceral(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Circumference Measurements (cm) */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                    Ukuran Lingkar Pita Ukur (cm) - Opsional
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[9px] text-zinc-400 mb-1">Pinggang</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="85"
                        value={selfWaist}
                        onChange={(e) => setSelfWaist(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-center font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-400 mb-1">Dada</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="98"
                        value={selfChest}
                        onChange={(e) => setSelfChest(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-center font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-400 mb-1">Pinggul</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="100"
                        value={selfHips}
                        onChange={(e) => setSelfHips(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-center font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-400 mb-1">Lengan</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="34"
                        value={selfArm}
                        onChange={(e) => setSelfArm(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-center font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-400 mb-1">Paha</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="56"
                        value={selfThigh}
                        onChange={(e) => setSelfThigh(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-center font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Weight & Focus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Target Berat Badan (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="cth: 68"
                      value={selfTargetWeight}
                      onChange={(e) => setSelfTargetWeight(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Fokus Kebugaran
                    </label>
                    <select
                      value={selfFitnessGoal}
                      onChange={(e) => setSelfFitnessGoal(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:border-orange-500 outline-none"
                    >
                      <option value="Weight Loss">Weight Loss (Defisit Lemak)</option>
                      <option value="Muscle Gain">Muscle Gain (Pembentukan Otot)</option>
                      <option value="General Fitness">General Fitness & Kebugaran</option>
                      <option value="Endurance">Stamina & Daya Tahan</option>
                    </select>
                  </div>
                </div>

                {/* Member Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Catatan Pribadi Member
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Pengukuran pagi hari sebelum makan, merasa lebih bertenaga setelah konsisten latihan 3 minggu..."
                    value={selfNotes}
                    onChange={(e) => setSelfNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-orange-500 outline-none resize-none"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddBodyCompModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Pengukuran Saya</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

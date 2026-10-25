import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Printer,
  Share2,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertCircle,
  Flame,
  MessageSquare,
  HelpCircle,
  Dumbbell,
  Award,
  Zap,
  MessageCircle
} from 'lucide-react';
import { Member, StudioClass } from '../../types';
import { BRANCH_CONTACTS, getDynamicBranchContacts, RFA_PROGRAMS, TRAINER_PROFILES } from '../../data/landingData';
import { OnlineReservation, LandingProgram, BranchContact } from '../../types/landingTypes';
import { APP_TODAY } from '../../utils/formatters';

export type FlowModalMode = 'registration' | 'inquiry' | 'booking';

interface ReservationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: FlowModalMode;
  prefilledPlan?: string | null;
  prefilledBranchId?: string | null;
  prefilledInquiryTopic?: string | null;
  prefilledProgram?: LandingProgram | null;
  prefilledClass?: StudioClass | null;
  prefilledTrainer?: string | null;
  members: Member[];
  onCompleteReservation: (reservation: OnlineReservation) => void;
  onOpenMemberDashboard: (member: Member) => void;
}

export const MEMBERSHIP_PLANS = [
  {
    id: 'starter',
    name: 'Starter Pass (1 Bulan)',
    price: 'Rp 399.000',
    billing: 'per bulan',
    badge: 'Pemula',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Akses penuh seluruh area gym di 1 cabang pilihan Anda.',
    perks: ['Akses Gym 1 Cabang', 'Loker Digital & Shower', 'Gratis 1x Tes InBody']
  },
  {
    id: 'all-access',
    name: 'All-Access Pro (3 Bulan)',
    price: 'Rp 699.000',
    billing: 'per bulan',
    badge: 'Paling Populer',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    popular: true,
    description: 'Bebas akses seluruh 3 cabang RFA Gym & seluruh kelas studio.',
    perks: [
      'Akses 3 Cabang (Sudirman, Senopati, BSD)',
      'Unlimited Studio Classes',
      '2x Sesi Personal Trainer',
      'Sauna & Luxury Locker'
    ]
  },
  {
    id: 'vip-platinum',
    name: 'VIP Platinum (12 Bulan)',
    price: 'Rp 1.199.000',
    billing: 'per bulan',
    badge: 'VIP All-Inclusive',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Paket keanggotaan tertinggi dengan pendampingan pelatih privat.',
    perks: [
      'Multi-Club All Access 3 Cabang',
      '12 Sesi Personal Trainer Privat',
      'Dedicated Locker & Laundry',
      'Free Gym Merchandise Kit'
    ]
  },
  {
    id: 'daypass',
    name: 'Gym Day Pass Fleksibel (1 Hari)',
    price: 'Rp 125.000',
    billing: 'sekali masuk',
    badge: 'Single Visit',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Akses bebas seharian penuh untuk mencoba fasilitas gym & studio.',
    perks: ['Akses Gym Seharian', 'Ikuti 1 Kelas Studio', 'Loker & Fasilitas Mandi']
  }
];

export const INQUIRY_TOPICS = [
  {
    id: 'trial-pass',
    title: 'Klaim Free 1-Day Trial Pass',
    desc: 'Coba gratis latihan 1 hari & konsultasi InBody'
  },
  {
    id: 'pricing-info',
    title: 'Konsultasi Paket & Promo Member Baru',
    desc: 'Informasi diskon registrasi & skema cicilan'
  },
  {
    id: 'pt-coaching',
    title: 'Tanya Program 1-on-1 Personal Trainer',
    desc: 'Konsultasi target fat loss / muscle hypertrophy'
  },
  {
    id: 'corporate',
    title: 'Paket Keanggotaan Perusahaan / Komunitas',
    desc: 'Penawaran khusus untuk grup dan kantor'
  }
];

export const ReservationFlowModal: React.FC<ReservationFlowModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'registration',
  prefilledPlan,
  prefilledBranchId,
  prefilledInquiryTopic,
  prefilledProgram,
  prefilledClass,
  prefilledTrainer,
  members,
  onCompleteReservation,
  onOpenMemberDashboard
}) => {
  const [activeMode, setActiveMode] = useState<FlowModalMode>(initialMode);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Registration Flow State
  const [selectedPlan, setSelectedPlan] = useState<string>(prefilledPlan || 'All-Access Pro (3 Bulan)');
  const [regBranchId, setRegBranchId] = useState<string>(prefilledBranchId || 'BR-001');
  const [regStartDate, setRegStartDate] = useState<string>(APP_TODAY);
  const [regCustomerName, setRegCustomerName] = useState<string>('');
  const [regCustomerPhone, setRegCustomerPhone] = useState<string>('');
  const [regCustomerEmail, setRegCustomerEmail] = useState<string>('');
  const [regFitnessGoal, setRegFitnessGoal] = useState<string>('Fat Loss & Muscle Tone');
  const [regNotes, setRegNotes] = useState<string>('');

  // Inquiry Flow State
  const [inquiryTopic, setInquiryTopic] = useState<string>(
    prefilledInquiryTopic || 'Klaim Free 1-Day Trial Pass'
  );
  const [inqBranchId, setInqBranchId] = useState<string>(prefilledBranchId || 'BR-001');
  const [inqName, setInqName] = useState<string>('');
  const [inqPhone, setInqPhone] = useState<string>('');
  const [inqEmail, setInqEmail] = useState<string>('');
  const [inqMessage, setInqMessage] = useState<string>('');

  // Booking Flow State (Class / PT)
  const [reservationType, setReservationType] = useState<'class' | 'pt' | 'daypass'>('class');
  const [selectedProgram, setSelectedProgram] = useState<string>('Weight Training & Bodybuilding');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(prefilledBranchId || 'BR-001');
  const [targetDate, setTargetDate] = useState<string>(APP_TODAY);
  const [timeSlot, setTimeSlot] = useState<string>('08:00 - 09:30 WIB');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('Bima Pratama');

  // Customer Form for Booking
  const [isExistingMember, setIsExistingMember] = useState<boolean>(false);
  const [memberSearchId, setMemberSearchId] = useState<string>('');
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [fitnessGoal, setFitnessGoal] = useState<string>('Fat Loss & Muscle Tone');
  const [notes, setNotes] = useState<string>('');

  // Result Ticket
  const [createdReservation, setCreatedReservation] = useState<OnlineReservation | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync mode and prefilled values on change
  useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
      setCurrentStep(1);
    }
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (prefilledPlan) {
      setSelectedPlan(prefilledPlan);
      setActiveMode('registration');
      setCurrentStep(2);
    }
  }, [prefilledPlan]);

  useEffect(() => {
    if (prefilledBranchId) {
      setRegBranchId(prefilledBranchId);
      setInqBranchId(prefilledBranchId);
      setSelectedBranchId(prefilledBranchId);
    }
  }, [prefilledBranchId]);

  useEffect(() => {
    if (prefilledInquiryTopic) {
      setInquiryTopic(prefilledInquiryTopic);
      setActiveMode('inquiry');
      setCurrentStep(1);
    }
  }, [prefilledInquiryTopic]);

  useEffect(() => {
    if (prefilledProgram) {
      setActiveMode('booking');
      if (prefilledProgram.category === 'personal') {
        setReservationType('pt');
      } else {
        setReservationType('class');
      }
      setSelectedProgram(prefilledProgram.name);
      setCurrentStep(2);
    } else if (prefilledClass) {
      setActiveMode('booking');
      setReservationType('class');
      setSelectedProgram(prefilledClass.name);
      setTimeSlot(`${prefilledClass.time} WIB`);
      if (prefilledClass.trainer) {
        setSelectedTrainer(prefilledClass.trainer);
      }
      setCurrentStep(2);
    } else if (prefilledTrainer) {
      setActiveMode('booking');
      setReservationType('pt');
      setSelectedProgram('1-on-1 Personal Trainer Coaching');
      setSelectedTrainer(prefilledTrainer);
      setCurrentStep(2);
    }
  }, [prefilledProgram, prefilledClass, prefilledTrainer]);

  // Lookup member if existing
  const handleMemberLookup = (query: string) => {
    setMemberSearchId(query);
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setFoundMember(null);
      return;
    }
    const matched = members.find(
      (m) =>
        m.id.toLowerCase() === clean ||
        m.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '') ||
        m.name.toLowerCase().includes(clean)
    );
    if (matched) {
      setFoundMember(matched);
      setCustomerName(matched.name);
      setCustomerPhone(matched.phone);
      setCustomerEmail(matched.email || '');
    } else {
      setFoundMember(null);
    }
  };

  // Draw QR code on success step
  useEffect(() => {
    if (
      ((activeMode === 'booking' && currentStep === 4) ||
        (activeMode === 'registration' && currentStep === 3) ||
        (activeMode === 'inquiry' && currentStep === 2)) &&
      createdReservation &&
      qrCanvasRef.current
    ) {
      try {
        if ((window as any).QRious) {
          new (window as any).QRious({
            element: qrCanvasRef.current,
            value: createdReservation.qrCodeData,
            size: 160,
            level: 'H'
          });
        }
      } catch (err) {
        console.error('Error drawing QR code', err);
      }
    }
  }, [currentStep, activeMode, createdReservation]);

  // Helper to get currently targeted branch details (synced with settings)
  const branchContacts = getDynamicBranchContacts();

  const getTargetBranch = (): BranchContact => {
    if (createdReservation) {
      return (
        branchContacts.find((b) => b.id === createdReservation.branchId) ||
        branchContacts.find((b) => b.name === createdReservation.branchName) ||
        branchContacts[0]
      );
    }
    if (activeMode === 'registration') {
      return branchContacts.find((b) => b.id === regBranchId) || branchContacts[0];
    }
    if (activeMode === 'inquiry') {
      return branchContacts.find((b) => b.id === inqBranchId) || branchContacts[0];
    }
    return branchContacts.find((b) => b.id === selectedBranchId) || branchContacts[0];
  };

  // Submission handler for REGISTRATION
  const handleConfirmRegistration = () => {
    const randomTicketNumber = Math.floor(1000 + Math.random() * 9000);
    const regId = `RFA-REG-${new Date().getFullYear()}-${randomTicketNumber}`;
    const passCode = `JOIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetBranch = branchContacts.find((b) => b.id === regBranchId) || branchContacts[0];

    const newRes: OnlineReservation = {
      id: regId,
      bookingDate: APP_TODAY,
      targetDate: regStartDate,
      timeSlot: 'Aktivasi Instan Hari Kerja / Weekend',
      programName: `Keanggotaan: ${selectedPlan}`,
      programCategory: 'Pendaftaran Member Baru',
      branchId: targetBranch.id,
      branchName: targetBranch.name,
      customerName: regCustomerName || 'Calon Member RFA',
      customerPhone: regCustomerPhone || '081234567890',
      customerEmail: regCustomerEmail || 'member@rfagym.com',
      notes: regNotes ? `${regNotes} (Tujuan: ${regFitnessGoal})` : `Tujuan: ${regFitnessGoal}`,
      status: 'CONFIRMED',
      qrCodeData: `RFA-MEMBER-PASS|${regId}|${regCustomerName}|${selectedPlan}|${targetBranch.shortName}|${regStartDate}`,
      ticketPassCode: passCode,
      type: 'membership',
      membershipPlan: selectedPlan
    };

    setCreatedReservation(newRes);
    onCompleteReservation(newRes);
    setCurrentStep(3);
  };

  // Submission handler for INQUIRY
  const handleConfirmInquiry = () => {
    const randomTicketNumber = Math.floor(1000 + Math.random() * 9000);
    const inqId = `RFA-INQ-${new Date().getFullYear()}-${randomTicketNumber}`;
    const passCode = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetBranch = branchContacts.find((b) => b.id === inqBranchId) || branchContacts[0];

    const newRes: OnlineReservation = {
      id: inqId,
      bookingDate: APP_TODAY,
      targetDate: APP_TODAY,
      timeSlot: 'Konsultasi Tim Advisor',
      programName: inquiryTopic,
      programCategory: 'Inquiry & Free Trial',
      branchId: targetBranch.id,
      branchName: targetBranch.name,
      customerName: inqName || 'Calon Member RFA',
      customerPhone: inqPhone || '081234567890',
      customerEmail: inqEmail || 'info@rfagym.com',
      notes: inqMessage || 'Permintaan informasi keanggotaan & fasilitas',
      status: 'CONFIRMED',
      qrCodeData: `RFA-INQUIRY|${inqId}|${inqName}|${inquiryTopic}|${targetBranch.shortName}`,
      ticketPassCode: passCode,
      type: 'inquiry',
      inquiryTopic: inquiryTopic
    };

    setCreatedReservation(newRes);
    onCompleteReservation(newRes);
    setCurrentStep(2);
  };

  // Submission handler for BOOKING
  const handleConfirmReservation = () => {
    const randomTicketNumber = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `RFA-BK-${new Date().getFullYear()}-${randomTicketNumber}`;
    const passCode = `PASS-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetBranch = branchContacts.find((b) => b.id === selectedBranchId) || branchContacts[0];

    const newRes: OnlineReservation = {
      id: bookingId,
      bookingDate: APP_TODAY,
      targetDate,
      timeSlot,
      programName: selectedProgram,
      programCategory:
        reservationType === 'class'
          ? 'Studio Class'
          : reservationType === 'pt'
          ? 'Personal Trainer'
          : 'Gym Day Pass',
      branchId: targetBranch.id,
      branchName: targetBranch.name,
      memberId: foundMember?.id || (isExistingMember ? memberSearchId : undefined),
      customerName: customerName || 'Pengunjung RFA',
      customerPhone: customerPhone || '081234567890',
      customerEmail: customerEmail || 'member@rfagym.com',
      trainerName: reservationType === 'pt' ? selectedTrainer : undefined,
      notes: notes ? `${notes} (Tujuan: ${fitnessGoal})` : `Tujuan: ${fitnessGoal}`,
      status: 'CONFIRMED',
      qrCodeData: `RFA-PASS|${bookingId}|${customerName}|${targetBranch.shortName}|${targetDate}|${timeSlot}`,
      ticketPassCode: passCode,
      type: reservationType
    };

    setCreatedReservation(newRes);
    onCompleteReservation(newRes);
    setCurrentStep(4);
  };

  // CRITICAL REQUIREMENT: Send message directly to the SELECTED branch's official WhatsApp number!
  const handleShareToWhatsApp = () => {
    if (!createdReservation) return;

    // Retrieve the exact branch selected by the customer
    const targetBranch =
      branchContacts.find((b) => b.id === createdReservation.branchId) ||
      branchContacts.find((b) => b.name === createdReservation.branchName) ||
      branchContacts[0];

    // Clean destination WhatsApp number (e.g. 6281234567890, 6281911223344, 6281233445566)
    const targetWaNumber = targetBranch.whatsapp.replace(/[^0-9]/g, '');

    let msg = '';
    if (createdReservation.type === 'membership') {
      msg =
        `*PENDAFTARAN RESMI MEMBER BARU - RFA GYM ${targetBranch.shortName.toUpperCase()}*%0A` +
        `----------------------------------------%0A` +
        `Halo Tim Front Desk & Admin *RFA Gym ${targetBranch.name}*,%0A` +
        `Saya telah melakukan pendaftaran keanggotaan online untuk cabang Anda dengan rincian berikut:%0A%0A` +
        `• *No. Registrasi:* ${createdReservation.id}%0A` +
        `• *Passcode Digital:* ${createdReservation.ticketPassCode}%0A` +
        `• *Nama Calon Member:* ${createdReservation.customerName}%0A` +
        `• *No. WhatsApp Member:* ${createdReservation.customerPhone}%0A` +
        `• *Email:* ${createdReservation.customerEmail || '-'}%0A` +
        `• *Paket Keanggotaan:* ${createdReservation.membershipPlan || createdReservation.programName}%0A` +
        `• *Unit Cabang Dipilih:* ${targetBranch.name}%0A` +
        `• *Rencana Tgl Mulai:* ${createdReservation.targetDate}%0A` +
        `• *Catatan / Target Fitness:* ${createdReservation.notes || '-'}%0A%0A` +
        `Mohon dibantu proses aktivasi Digital Member Card saya serta konfirmasi jadwal penimbangan InBody 770 gratis. Terima kasih! 🙏🏋️`;
    } else if (createdReservation.type === 'inquiry') {
      msg =
        `*INQUIRY & KONSULTASI CALON MEMBER - RFA GYM ${targetBranch.shortName.toUpperCase()}*%0A` +
        `----------------------------------------%0A` +
        `Halo Fitness Advisor & Tim Konsultan *RFA Gym ${targetBranch.name}*,%0A` +
        `Saya tertarik dengan fasilitas kebugaran di cabang Anda dan ingin konsultasi / klaim Free Trial Pass:%0A%0A` +
        `• *No. Tiket Inquiry:* ${createdReservation.id}%0A` +
        `• *Nama Calon Member:* ${createdReservation.customerName}%0A` +
        `• *No. WhatsApp:* ${createdReservation.customerPhone}%0A` +
        `• *Topik Permintaan:* ${createdReservation.inquiryTopic || createdReservation.programName}%0A` +
        `• *Unit Cabang Dituju:* ${targetBranch.name}%0A` +
        `• *Catatan / Pertanyaan:* ${createdReservation.notes || '-'}%0A%0A` +
        `Mohon info ketersediaan slot orientasi dan promo pendaftaran terbaru. Terima kasih!`;
    } else {
      msg =
        `*TIKET RESERVASI RESMI - RFA GYM ${targetBranch.shortName.toUpperCase()}*%0A` +
        `----------------------------------------%0A` +
        `Halo Front Desk *RFA Gym ${targetBranch.name}*,%0A` +
        `Saya telah melakukan booking jadwal latihan:%0A%0A` +
        `• *No. Booking:* ${createdReservation.id}%0A` +
        `• *Passcode:* ${createdReservation.ticketPassCode}%0A` +
        `• *Nama:* ${createdReservation.customerName}%0A` +
        `• *Program:* ${createdReservation.programName}%0A` +
        `• *Cabang:* ${targetBranch.name}%0A` +
        `• *Tanggal:* ${createdReservation.targetDate}%0A` +
        `• *Waktu / Slot:* ${createdReservation.timeSlot}%0A` +
        (createdReservation.trainerName ? `• *Personal Trainer:* ${createdReservation.trainerName}%0A` : '') +
        `• *Status:* TERKONFIRMASI%0A%0A` +
        `Tunjukkan tiket ini saat kedatangan di gym. Terima kasih!`;
    }

    const waUrl = `https://wa.me/${targetWaNumber}?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const currentTargetBranch = getTargetBranch();

  if (!isOpen) return null;

  return (
    <div
      data-landing-page="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-orange-500/10 flex flex-col max-h-[92vh]">
        {/* Header Modal with Flow Switcher */}
        <div className="p-5 sm:p-6 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              {activeMode === 'registration' ? (
                <Flame className="w-5 h-5" />
              ) : activeMode === 'inquiry' ? (
                <MessageSquare className="w-5 h-5" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {activeMode === 'registration'
                  ? 'Pendaftaran Member Baru (Join Now)'
                  : activeMode === 'inquiry'
                  ? 'Inquiry & Konsultasi Calon Member'
                  : 'Reservasi Slot Latihan & Kelas'}
              </h3>
              <p className="text-xs text-zinc-400">
                {activeMode === 'registration'
                  ? 'Pendaftaran langsung terhubung ke WhatsApp resmi kantor cabang yang Anda pilih'
                  : activeMode === 'inquiry'
                  ? 'Klaim Free Trial Pass & tanya langsung ke WhatsApp resmi unit cabang'
                  : 'Pemesanan slot studio class atau 1-on-1 Personal Trainer'}
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

        {/* Mode Selector Tabs (Top Nav) */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-zinc-900/50 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveMode('registration');
              setCurrentStep(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeMode === 'registration'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Join Now (Member Baru)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('inquiry');
              setCurrentStep(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeMode === 'inquiry'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Inquiry & Free Trial</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('booking');
              setCurrentStep(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeMode === 'booking'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Reservasi Kelas / PT</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-200">
          {/* ========================================================================= */}
          {/* FLOW 1: REGISTRATION (JOIN NOW FLOW)                                      */}
          {/* ========================================================================= */}
          {activeMode === 'registration' && (
            <>
              {currentStep < 3 && (
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400 pb-2 border-b border-zinc-800">
                  <span className={currentStep >= 1 ? 'text-orange-400' : ''}>1. Pilih Paket & Cabang Tujuan</span>
                  <span>&rarr;</span>
                  <span className={currentStep >= 2 ? 'text-orange-400' : ''}>2. Data Calon Member</span>
                </div>
              )}

              {/* Step 1: Pilih Paket & Cabang */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2.5">
                      Pilih Paket Membership RFA Gym
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MEMBERSHIP_PLANS.map((plan) => {
                        const isSelected = selectedPlan === plan.name;
                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.name)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                              isSelected
                                ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500'
                                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h4 className="text-sm font-black text-white">{plan.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${plan.badgeColor}`}
                              >
                                {plan.badge}
                              </span>
                            </div>
                            <div className="text-base font-extrabold text-orange-400">
                              {plan.price}{' '}
                              <span className="text-[11px] font-normal text-zinc-400">/{plan.billing}</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{plan.description}</p>
                            <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1">
                              {plan.perks.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span>{p}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cabang Utama Pilihan - Menampilkan Nomor WhatsApp Resmi Unit Cabang */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                        Pilih Unit Cabang yang Dituju (WA Tujuan) *
                      </label>
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Chat Langsung ke Resepsionis Cabang
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {branchContacts.map((b) => {
                        const isChosen = regBranchId === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setRegBranchId(b.id)}
                            className={`p-3 rounded-2xl border text-left transition-all relative ${
                              isChosen
                                ? 'bg-orange-500/15 border-orange-500 text-white font-bold ring-1 ring-orange-500 shadow-md'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{b.shortName}</span>
                              {b.isFlagship && (
                                <span className="text-[9px] px-1 rounded bg-amber-400 text-zinc-950 font-black">
                                  HUB
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{b.address.split('(')[0]}</div>
                            <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                              <MessageCircle className="w-3 h-3 shrink-0" />
                              <span>+{b.whatsapp}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tanggal Mulai */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                      Rencana Tanggal Mulai Aktif
                    </label>
                    <input
                      type="date"
                      value={regStartDate}
                      min={APP_TODAY}
                      onChange={(e) => setRegStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Data Calon Member */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Branch & Plan summary banner */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[11px]">Cabang WhatsApp Tujuan:</span>
                      <strong className="text-white text-xs sm:text-sm font-black flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-400" />
                        {currentTargetBranch.name}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400 block text-[11px]">No. WA Resmi:</span>
                      <span className="text-emerald-400 font-mono font-bold text-xs sm:text-sm">
                        +{currentTargetBranch.whatsapp}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Nama Lengkap Calon Member *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Muhammad Ridwan"
                        value={regCustomerName}
                        onChange={(e) => setRegCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        No. WhatsApp Anda *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0812xxxxxxxx"
                        value={regCustomerPhone}
                        onChange={(e) => setRegCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Alamat Email (Opsional)
                      </label>
                      <input
                        type="email"
                        placeholder="email@domain.com"
                        value={regCustomerEmail}
                        onChange={(e) => setRegCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Target / Gol Kebugaran
                      </label>
                      <select
                        value={regFitnessGoal}
                        onChange={(e) => setRegFitnessGoal(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      >
                        <option value="Fat Loss & Muscle Tone">Fat Loss & Pembentukan Tubuh</option>
                        <option value="Hypertrophy & Bulking">Pembesaran Otot (Hypertrophy)</option>
                        <option value="Stamina & Kardio">Peningkatan Stamina & Daya Tahan</option>
                        <option value="Fleksibilitas & Postur">Perbaikan Postur & Mobilitas</option>
                        <option value="Rehabilitasi & Sehat">Kebugaran Umum & Relaksasi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Catatan / Preferensi Khusus (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: request jadwal penimbangan InBody saat kedatangan pertama..."
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Tiket Konfirmasi Registrasi & Direct WhatsApp Button */}
              {currentStep === 3 && createdReservation && (
                <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-white">PENDAFTARAN MEMBER BARU BERHASIL!</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Kirim data pendaftaran ini langsung ke WhatsApp resmi unit cabang{' '}
                      <strong className="text-white">{currentTargetBranch.shortName}</strong> untuk aktivasi instan.
                    </p>
                  </div>

                  {/* Target Branch WhatsApp Notice Pill */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">WhatsApp Resmi Unit Cabang:</span>
                        <span className="text-zinc-300">{currentTargetBranch.name}</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      +{currentTargetBranch.whatsapp}
                    </span>
                  </div>

                  {/* Digital Pass Ticket Card */}
                  <div
                    id="digital-reservation-ticket"
                    className="max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-orange-500/40 shadow-2xl text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />

                    <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                          RFA NEW MEMBER DIGITAL PASS
                        </span>
                        <h5 className="text-base font-extrabold text-white">
                          {createdReservation.membershipPlan || createdReservation.programName}
                        </h5>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                        REGISTERED
                      </span>
                    </div>

                    <div className="py-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">No. Registrasi:</span>
                        <span className="font-mono font-bold text-white">{createdReservation.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Nama Calon Member:</span>
                        <span className="font-bold text-white">{createdReservation.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Unit Cabang:</span>
                        <span className="font-bold text-orange-300">{createdReservation.branchName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">WA Resmi Cabang:</span>
                        <span className="font-mono font-bold text-emerald-400">+{currentTargetBranch.whatsapp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Tanggal Mulai:</span>
                        <span className="font-bold text-white">{createdReservation.targetDate}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800 flex flex-col items-center justify-center">
                      <div className="p-3 bg-white rounded-2xl shadow-inner">
                        <canvas ref={qrCanvasRef} width={140} height={140} className="w-28 h-28" />
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 font-mono">
                        PASSCODE: <strong className="text-zinc-200">{createdReservation.ticketPassCode}</strong>
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 text-center">
                        Tunjukkan tiket digital ini di resepsionis Front Desk saat kedatangan pertama.
                      </p>
                    </div>
                  </div>

                  {/* Primary Direct WhatsApp Action Button */}
                  <div className="space-y-3">
                    <button
                      onClick={handleShareToWhatsApp}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Chat WhatsApp Resmi Cabang {currentTargetBranch.shortName}</span>
                    </button>
                    <p className="text-[11px] text-zinc-400">
                      Pesan pendaftaran otomatis terkirim langsung ke nomor WhatsApp resmi Front Desk cabang{' '}
                      <strong className="text-emerald-400">+{currentTargetBranch.whatsapp}</strong>.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handlePrintTicket}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak E-Pass</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* FLOW 2: INQUIRY (KONSULTASI & FREE TRIAL)                                 */}
          {/* ========================================================================= */}
          {activeMode === 'inquiry' && (
            <>
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                      Pilih Topik Konsultasi & Pertanyaan
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {INQUIRY_TOPICS.map((topic) => (
                        <div
                          key={topic.id}
                          onClick={() => setInquiryTopic(topic.title)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            inquiryTopic === topic.title
                              ? 'bg-orange-500/15 border-orange-500 text-white font-bold ring-1 ring-orange-500'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-white mb-1">{topic.title}</div>
                          <div className="text-[11px] text-zinc-400">{topic.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Branch selector with WhatsApp badge */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                        Pilih Kantor Cabang yang Ingin Anda Hubungi *
                      </label>
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Chat ke WhatsApp Unit Cabang
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {branchContacts.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setInqBranchId(b.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            inqBranchId === b.id
                              ? 'bg-orange-500/20 border-orange-500 text-white font-bold ring-1 ring-orange-500'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{b.shortName}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{b.hours}</div>
                          <div className="mt-1.5 text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>+{b.whatsapp}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Anda"
                        value={inqName}
                        onChange={(e) => setInqName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        No. WhatsApp Anda *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0812xxxxxxxx"
                        value={inqPhone}
                        onChange={(e) => setInqPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Pertanyaan atau Rencana Kunjungan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: apakah bisa trial pass hari ini jam 17.00 di cabang ini?"
                      value={inqMessage}
                      onChange={(e) => setInqMessage(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && createdReservation && (
                <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <MessageSquare className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-white">INQUIRY ANDA SIAP DIKIRIM!</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Hubungi langsung Fitness Advisor unit cabang{' '}
                      <strong className="text-white">{currentTargetBranch.shortName}</strong> melalui WhatsApp resmi di
                      bawah.
                    </p>
                  </div>

                  <div className="max-w-md mx-auto p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 text-left space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">ID Inquiry:</span>
                      <span className="font-mono font-bold text-white">{createdReservation.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Calon Member:</span>
                      <span className="font-bold text-white">{createdReservation.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Topik Permintaan:</span>
                      <span className="font-bold text-orange-400">{createdReservation.programName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Unit Cabang Tujuan:</span>
                      <span className="font-bold text-zinc-200">{createdReservation.branchName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">No. WhatsApp Resmi:</span>
                      <span className="font-mono font-bold text-emerald-400">+{currentTargetBranch.whatsapp}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleShareToWhatsApp}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Chat WhatsApp Resmi Cabang {currentTargetBranch.shortName}</span>
                    </button>
                    <p className="text-[11px] text-zinc-400">
                      Format pesan otomatis disiapkan dan ditujukan langsung ke WhatsApp resmi unit{' '}
                      <strong className="text-emerald-400">+{currentTargetBranch.whatsapp}</strong>.
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"
                  >
                    Selesai
                  </button>
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* FLOW 3: BOOKING (STUDIO CLASS & PT)                                       */}
          {/* ========================================================================= */}
          {activeMode === 'booking' && (
            <>
              {currentStep < 4 && (
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400 pb-2 border-b border-zinc-800">
                  <span className={currentStep >= 1 ? 'text-orange-400' : ''}>1. Jenis & Program</span>
                  <span>&rarr;</span>
                  <span className={currentStep >= 2 ? 'text-orange-400' : ''}>2. Slot & Cabang</span>
                  <span>&rarr;</span>
                  <span className={currentStep >= 3 ? 'text-orange-400' : ''}>3. Data Pemesan</span>
                </div>
              )}

              {/* STEP 1: Pilih Jenis & Program */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                      Pilih Kategori Reservasi
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'class', label: 'Studio Class', desc: 'Zumba, Yoga, HIIT, Combat' },
                        { id: 'pt', label: '1-on-1 PT', desc: 'Privat Coaching Personal' },
                        { id: 'daypass', label: 'Gym Day Pass', desc: 'Akses Gym Bebas Seharian' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setReservationType(t.id as any)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            reservationType === t.id
                              ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-white mb-1">{t.label}</div>
                          <div className="text-[10px] text-zinc-400 line-clamp-1">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                      Pilih Program Latihan
                    </label>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {RFA_PROGRAMS.map((prog) => (
                        <div
                          key={prog.id}
                          onClick={() => setSelectedProgram(prog.name)}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                            selectedProgram === prog.name
                              ? 'bg-zinc-900 border-orange-500 text-white'
                              : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{prog.name}</div>
                            <div className="text-[11px] text-zinc-400">{prog.tagline}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-orange-400 px-2 py-0.5 rounded bg-zinc-800">
                            {prog.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Pilih Cabang & Jadwal / Jam Slot */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                      Pilih Cabang RFA Gym
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {branchContacts.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBranchId(b.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            selectedBranchId === b.id
                              ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{b.shortName}</div>
                          <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{b.hours}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                        Tanggal Latihan
                      </label>
                      <input
                        type="date"
                        value={targetDate}
                        min={APP_TODAY}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                        Pilihan Slot Waktu
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      >
                        <option value="07:00 - 08:30 WIB">Pagi (07:00 - 08:30 WIB)</option>
                        <option value="08:30 - 10:00 WIB">Pagi (08:30 - 10:00 WIB)</option>
                        <option value="12:00 - 13:30 WIB">Siang (12:00 - 13:30 WIB)</option>
                        <option value="17:00 - 18:30 WIB">Sore (17:00 - 18:30 WIB)</option>
                        <option value="19:00 - 20:30 WIB">Malam (19:00 - 20:30 WIB)</option>
                      </select>
                    </div>
                  </div>

                  {reservationType === 'pt' && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                        Pilih Personal Trainer
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {TRAINER_PROFILES.map((tr) => (
                          <button
                            key={tr.id}
                            type="button"
                            onClick={() => setSelectedTrainer(tr.name)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              selectedTrainer === tr.name
                                ? 'bg-orange-500/20 border-orange-500 text-white font-bold'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className="text-xs font-bold text-white truncate">{tr.name}</div>
                            <div className="text-[10px] text-zinc-500 truncate">{tr.specialty[0]}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Data Pemesan & Member Verification */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-300">
                      Apakah Anda sudah menjadi Member terdaftar di RFA Gym?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsExistingMember(!isExistingMember)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        isExistingMember ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isExistingMember ? 'Ya, Saya Member' : 'Belum (Pengunjung Baru)'}
                    </button>
                  </div>

                  {isExistingMember && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-orange-500/30 space-y-2">
                      <label className="block text-xs font-bold text-orange-400">
                        Masukkan No. HP atau ID Member Anda:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: M001 atau 08123456789"
                        value={memberSearchId}
                        onChange={(e) => handleMemberLookup(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                      {foundMember ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                          <div>
                            <strong>{foundMember.name}</strong> ({foundMember.id}) - Status: {foundMember.status}
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      ) : memberSearchId.trim() ? (
                        <div className="text-[11px] text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Data belum cocok. Silakan lengkapi form manual di bawah.</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Nama Lengkap *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Anda"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">No. WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="0812xxxxxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Alamat Email</label>
                      <input
                        type="email"
                        placeholder="nama@email.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Kebugaran</label>
                      <select
                        value={fitnessGoal}
                        onChange={(e) => setFitnessGoal(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      >
                        <option value="Fat Loss & Muscle Tone">Fat Loss & Pengencangan</option>
                        <option value="Hypertrophy & Bulking">Pembentukan Otot (Hypertrophy)</option>
                        <option value="Kardio & Stamina">Peningkatan Stamina & Daya Tahan</option>
                        <option value="Fleksibilitas & Postur">Perbaikan Postur & Mobilitas</option>
                        <option value="Persiapan Lomba/Event">Persiapan Event / Olahraga Khusus</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Misal: ada riwayat cedera lutut, request posisi baris depan..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Konfirmasi & Tiket Digital Sukses */}
              {currentStep === 4 && createdReservation && (
                <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-white">RESERVASI BERHASIL DIKONFIRMASI!</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Tiket reservasi digital Anda telah terbit. Kirimkan konfirmasi langsung ke WhatsApp resmi unit{' '}
                      <strong className="text-white">{currentTargetBranch.shortName}</strong>.
                    </p>
                  </div>

                  <div
                    id="digital-reservation-ticket"
                    className="max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-orange-500/40 shadow-2xl text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />

                    <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                          RFA GYM DIGITAL PASS
                        </span>
                        <h5 className="text-base font-extrabold text-white">{createdReservation.programName}</h5>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                        CONFIRMED
                      </span>
                    </div>

                    <div className="py-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Kode Booking:</span>
                        <span className="font-mono font-bold text-white">{createdReservation.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Nama Tamu/Member:</span>
                        <span className="font-bold text-white">{createdReservation.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Cabang Latihan:</span>
                        <span className="font-bold text-orange-300">{createdReservation.branchName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">WA Resmi Unit:</span>
                        <span className="font-mono font-bold text-emerald-400">+{currentTargetBranch.whatsapp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Tanggal & Jam:</span>
                        <span className="font-bold text-white">
                          {createdReservation.targetDate} ({createdReservation.timeSlot})
                        </span>
                      </div>
                      {createdReservation.trainerName && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Personal Trainer:</span>
                          <span className="font-bold text-white">{createdReservation.trainerName}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-zinc-800 flex flex-col items-center justify-center">
                      <div className="p-3 bg-white rounded-2xl shadow-inner">
                        <canvas ref={qrCanvasRef} width={140} height={140} className="w-28 h-28" />
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 font-mono">
                        PASSCODE: <strong className="text-zinc-200">{createdReservation.ticketPassCode}</strong>
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Scan pada turnstile atau tunjukkan ke resepsionis Front Desk
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleShareToWhatsApp}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Kirim ke WhatsApp Resmi Cabang {currentTargetBranch.shortName}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handlePrintTicket}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak E-Ticket</span>
                    </button>

                    {foundMember && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenMemberDashboard(foundMember);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        <span>Lihat di Dashboard Member</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          {activeMode === 'registration' && currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Pilih Paket Ulang</span>
            </button>
          )}

          {activeMode === 'booking' && currentStep > 1 && currentStep < 4 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          )}

          <div className="flex-1" />

          {activeMode === 'registration' && currentStep === 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/25 active:scale-95 transition-all"
            >
              <span>Lanjut Isi Data Diri</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {activeMode === 'registration' && currentStep === 2 && (
            <button
              type="button"
              disabled={!regCustomerName.trim() || !regCustomerPhone.trim()}
              onClick={handleConfirmRegistration}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Join Now • Dapatkan E-Pass</span>
            </button>
          )}

          {activeMode === 'inquiry' && currentStep === 1 && (
            <button
              type="button"
              disabled={!inqName.trim() || !inqPhone.trim()}
              onClick={handleConfirmInquiry}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim Permintaan & Tanya Info</span>
            </button>
          )}

          {activeMode === 'booking' && currentStep < 3 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <span>Lanjutkan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {activeMode === 'booking' && currentStep === 3 && (
            <button
              type="button"
              disabled={!customerName.trim() || !customerPhone.trim()}
              onClick={handleConfirmReservation}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi & Terbitkan Tiket</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

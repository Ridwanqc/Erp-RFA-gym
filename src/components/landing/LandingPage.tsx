import React, { useState, useEffect } from 'react';
import {
  Member,
  StudioClass,
  User,
  Attendance,
  BodyCompositionRecord,
  PTPurchaseRecord,
  PTBooking,
  Schedule,
  TrainerChangeRequest,
  PTBackofficeNotification
} from '../../types';
import { LandingProgram, OnlineReservation } from '../../types/landingTypes';
import { INITIAL_ONLINE_RESERVATIONS } from '../../data/landingData';
import { APP_TODAY } from '../../utils/formatters';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { WhyChooseUsSection } from './WhyChooseUsSection';
import { LiveStatisticsSection } from './LiveStatisticsSection';
import { AboutUsSection } from './AboutUsSection';
import { VisiMisiSection } from './VisiMisiSection';
import { ProgramsSection } from './ProgramsSection';
import { ScheduleSection } from './ScheduleSection';
import { BMICalculatorSection } from './BMICalculatorSection';
import { FitnessTipsSection } from './FitnessTipsSection';
import { FAQSection } from './FAQSection';
import { ContactLocationSection } from './ContactLocationSection';
import { ReservationFlowModal, FlowModalMode } from './ReservationFlowModal';
import { MemberPortalModal } from './MemberPortalModal';

interface LandingPageProps {
  members: Member[];
  attendances?: Attendance[];
  studioClasses: StudioClass[];
  staffUsers: User[];
  onOpenStaffLogin: () => void;
  isStaffLoggedIn?: boolean;
  onReturnToERP?: () => void;
  onBookStudioClass?: (classId: string, memberName: string) => void;
  reservations?: OnlineReservation[];
  onCompleteReservation?: (newRes: OnlineReservation) => void;
  onCancelReservation?: (resId: string) => void;
  bodyCompositionRecords?: BodyCompositionRecord[];
  onSaveBodyCompositionRecord?: (record: BodyCompositionRecord) => void;
  ptPurchases?: PTPurchaseRecord[];
  bookings?: PTBooking[];
  schedules?: Schedule[];
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
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  members,
  attendances = [],
  studioClasses,
  staffUsers,
  onOpenStaffLogin,
  isStaffLoggedIn,
  onReturnToERP,
  onBookStudioClass,
  reservations: propReservations,
  onCompleteReservation: propOnCompleteReservation,
  onCancelReservation: propOnCancelReservation,
  bodyCompositionRecords,
  onSaveBodyCompositionRecord,
  ptPurchases = [],
  bookings = [],
  schedules = [],
  trainerChangeRequests = [],
  onAddBooking,
  onRescheduleBooking,
  onCancelBooking,
  onRequestChangeTrainer,
  showToast
}) => {
  const [activeSection, setActiveSection] = useState<string>('hero');

  // Compute live active members in gym
  const todayAttendances = attendances.filter((a) => a.date === APP_TODAY);
  const activeInGymMembers = todayAttendances.filter((a) => !a.timeOut || a.timeOut.trim() === '');
  const activeInGymCount = activeInGymMembers.length;

  // Reservation & Flow Modal State
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<FlowModalMode>('registration');
  const [prefilledPlan, setPrefilledPlan] = useState<string | null>(null);
  const [prefilledBranchId, setPrefilledBranchId] = useState<string | null>(null);
  const [prefilledInquiryTopic, setPrefilledInquiryTopic] = useState<string | null>(null);
  const [prefilledProgram, setPrefilledProgram] = useState<LandingProgram | null>(null);
  const [prefilledClass, setPrefilledClass] = useState<StudioClass | null>(null);
  const [prefilledTrainer, setPrefilledTrainer] = useState<string | null>(null);

  // Member Portal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [loggedInMember, setLoggedInMember] = useState<Member | null>(() => {
    try {
      const savedMemberId = localStorage.getItem('rfa_logged_member_id');
      if (savedMemberId) {
        const found = members.find((m) => m.id === savedMemberId);
        if (found) return found;
      }
    } catch {}
    return null;
  });

  // Local fallback if propReservations is not provided
  const [localReservations, setLocalReservations] = useState<OnlineReservation[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_online_reservations');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_ONLINE_RESERVATIONS;
  });

  const reservations = propReservations || localReservations;

  // Save reservations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rfa_online_reservations', JSON.stringify(reservations));
    } catch {}
  }, [reservations]);

  // Section smooth navigation
  const handleNavigateSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Trigger Join Now (Direct Registration Flow for Prospective Members)
  const handleOpenJoinNow = (plan?: string, branchId?: string) => {
    setModalMode('registration');
    setPrefilledPlan(plan || 'All-Access Pro (3 Bulan)');
    setPrefilledBranchId(branchId || null);
    setPrefilledInquiryTopic(null);
    setPrefilledProgram(null);
    setPrefilledClass(null);
    setPrefilledTrainer(null);
    setIsReservationModalOpen(true);
  };

  // Trigger Inquiry (Direct Inquiry / Free Trial Flow for Prospective Members)
  const handleOpenInquiry = (topic?: string, branchId?: string) => {
    setModalMode('inquiry');
    setPrefilledInquiryTopic(topic || 'Klaim Free 1-Day Trial Pass');
    setPrefilledBranchId(branchId || null);
    setPrefilledPlan(null);
    setPrefilledProgram(null);
    setPrefilledClass(null);
    setPrefilledTrainer(null);
    setIsReservationModalOpen(true);
  };

  // Trigger Online Booking (Studio Class / PT / Day Pass)
  const handleOpenReservation = (program?: LandingProgram, sc?: StudioClass, trainer?: string, branchId?: string) => {
    setModalMode('booking');
    setPrefilledProgram(program || null);
    setPrefilledClass(sc || null);
    setPrefilledTrainer(trainer || null);
    setPrefilledBranchId(branchId || null);
    setPrefilledPlan(null);
    setPrefilledInquiryTopic(null);
    setIsReservationModalOpen(true);
  };

  // Complete Reservation callback
  const handleCompleteReservation = (newRes: OnlineReservation) => {
    if (propOnCompleteReservation) {
      propOnCompleteReservation(newRes);
    } else {
      setLocalReservations((prev) => [newRes, ...prev]);
    }

    // If reservation is for studio class, also call ERP handler if provided
    if (newRes.classId && onBookStudioClass) {
      onBookStudioClass(newRes.classId, newRes.customerName);
    }
  };

  // Cancel reservation
  const handleCancelReservation = (resId: string) => {
    if (propOnCancelReservation) {
      propOnCancelReservation(resId);
    } else {
      setLocalReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, status: 'CANCELLED' } : r))
      );
    }
  };

  // Member Authentication
  const handleLoginMember = (member: Member) => {
    setLoggedInMember(member);
    try {
      localStorage.setItem('rfa_logged_member_id', member.id);
    } catch {}
  };

  const handleLogoutMember = () => {
    setLoggedInMember(null);
    try {
      localStorage.removeItem('rfa_logged_member_id');
    } catch {}
  };

  const trainerCount = staffUsers.filter((u) => u.role === 'pt').length || 4;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500 selection:text-white relative">
      {/* 1. Global Sticky Header & Navigation */}
      <LandingHeader
        activeSection={activeSection}
        onNavigateSection={handleNavigateSection}
        onOpenReservation={() => handleOpenJoinNow()}
        onOpenMemberArea={() => setIsMemberModalOpen(true)}
        onOpenStaffLogin={onOpenStaffLogin}
        loggedInMember={loggedInMember}
        onLogoutMember={handleLogoutMember}
        isStaffLoggedIn={isStaffLoggedIn}
        onReturnToERP={onReturnToERP}
        activeInGymCount={activeInGymCount}
      />

      <main>
        {/* 2. Landing Page (Home) */}
        {/* Hero Section */}
        <HeroSection
          onStartBooking={() => handleOpenJoinNow()}
          onExplorePrograms={() => handleNavigateSection('programs')}
          memberCount={members.length}
          activeInGymCount={activeInGymCount}
          loggedInMember={loggedInMember}
          onOpenMemberArea={() => setIsMemberModalOpen(true)}
        />

        {/* Why Choose Us (6 Nilai Unggulan) */}
        <WhyChooseUsSection onLearnMore={() => handleNavigateSection('about-us')} />

        {/* Prominent "Join Now" Banner & Real-Time Macro Statistics */}
        <LiveStatisticsSection
          memberCount={members.length}
          studioClassCount={studioClasses.length}
          trainerCount={trainerCount}
          branchCount={3}
          attendances={attendances}
          onCtaClick={() => handleOpenJoinNow()}
          onOpenJoinNow={(plan, branchId) => handleOpenJoinNow(plan, branchId)}
          onOpenInquiry={(topic, branchId) => handleOpenInquiry(topic, branchId)}
          loggedInMember={loggedInMember}
          onOpenMemberArea={() => setIsMemberModalOpen(true)}
        />

        {/* 3. About Us (Profil, Sejarah, Galeri Fasilitas & Trainer) */}
        <AboutUsSection
          onSelectTrainerForBooking={(trainerName) =>
            handleOpenReservation(undefined, undefined, trainerName)
          }
        />

        {/* 4. Visi & Misi (Interactive Card Highlight) */}
        <VisiMisiSection />

        {/* 5. Program Latihan (6 Program Utama + CTA Auto-fill Reservasi) */}
        <ProgramsSection
          onSelectProgramForBooking={(program) => handleOpenReservation(program)}
        />

        {/* 6. Jadwal Latihan & Kalender Slot */}
        <ScheduleSection
          studioClasses={studioClasses}
          onBookClassSlot={(sc) => handleOpenReservation(undefined, sc)}
        />

        {/* 8. Fitur Pendukung: BMI Calculator */}
        <BMICalculatorSection
          onSelectRecommendedProgram={(program) => handleOpenReservation(program)}
        />

        {/* 8. Fitur Pendukung: Tips Fitness */}
        <FitnessTipsSection />

        {/* 8. Fitur Pendukung: FAQ */}
        <FAQSection />

        {/* 8. Fitur Pendukung: Contact & Lokasi */}
        <ContactLocationSection
          onOpenStaffLogin={onOpenStaffLogin}
          onOpenMemberArea={() => setIsMemberModalOpen(true)}
          onOpenReservation={(branchId) => handleOpenJoinNow(undefined, branchId)}
          isMemberLoggedIn={!!loggedInMember}
        />
      </main>

      {/* 7. Direct Registration / Inquiry / Reservation Multi-flow Modal */}
      <ReservationFlowModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        initialMode={modalMode}
        prefilledPlan={prefilledPlan}
        prefilledBranchId={prefilledBranchId}
        prefilledInquiryTopic={prefilledInquiryTopic}
        prefilledProgram={prefilledProgram}
        prefilledClass={prefilledClass}
        prefilledTrainer={prefilledTrainer}
        members={members}
        onCompleteReservation={handleCompleteReservation}
        onOpenMemberDashboard={(member) => {
          handleLoginMember(member);
          setIsMemberModalOpen(true);
        }}
      />

      {/* 9. Autentikasi & Member Area Modal */}
      <MemberPortalModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={members}
        loggedInMember={loggedInMember}
        onLoginMember={handleLoginMember}
        onLogoutMember={handleLogoutMember}
        reservations={reservations}
        onCancelReservation={handleCancelReservation}
        onOpenNewReservation={() => {
          setIsMemberModalOpen(false);
          handleOpenReservation();
        }}
        bodyCompositionRecords={bodyCompositionRecords}
        onSaveBodyCompositionRecord={onSaveBodyCompositionRecord}
        ptPurchases={ptPurchases}
        bookings={bookings}
        schedules={schedules}
        trainers={staffUsers.filter((s) => s.role === 'pt' || s.role === 'leader_pt')}
        trainerChangeRequests={trainerChangeRequests}
        onAddBooking={onAddBooking}
        onRescheduleBooking={onRescheduleBooking}
        onCancelBooking={onCancelBooking}
        onRequestChangeTrainer={onRequestChangeTrainer}
        showToast={showToast}
      />
    </div>
  );
};

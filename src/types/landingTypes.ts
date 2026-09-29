import { StudioClass, Member } from '../types';

export interface LandingProgram {
  id: string;
  name: string;
  slug: string;
  category: 'strength' | 'cardio' | 'mindbody' | 'combat' | 'personal';
  tagline: string;
  description: string;
  duration: string;
  intensity: 'Ringan' | 'Sedang' | 'Tinggi' | 'Intensif';
  caloriesBurned: string;
  image: string;
  features: string[];
  trainerName: string;
  popular?: boolean;
}

export interface TrainerProfile {
  id: string;
  name: string;
  role: string;
  specialty: string[];
  experience: string;
  photo: string;
  bio: string;
  certifications: string[];
  branch: string;
}

export interface FacilityGalleryItem {
  id: string;
  title: string;
  category: 'gym' | 'studio' | 'recovery' | 'lounge';
  image: string;
  description: string;
}

export interface MilestoneItem {
  year: string;
  title: string;
  description: string;
  iconName: string;
}

export interface OnlineReservation {
  id: string; // e.g. RFA-BK-2026-9821 or RFA-REG-2026-9821
  bookingDate: string;
  targetDate: string;
  timeSlot: string;
  programName: string;
  programCategory: string;
  branchId: string;
  branchName: string;
  memberId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  trainerName?: string;
  notes?: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  qrCodeData: string;
  ticketPassCode: string;
  type: 'class' | 'pt' | 'daypass' | 'membership' | 'inquiry';
  classId?: string;
  membershipPlan?: string;
  inquiryTopic?: string;
}

export interface FitnessTip {
  id: string;
  title: string;
  category: 'nutrition' | 'workout' | 'recovery' | 'beginner';
  readTime: string;
  summary: string;
  content: string;
  image: string;
  author: string;
  likes: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'membership' | 'booking' | 'facility' | 'pt';
}

export interface BranchContact {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: string;
  mapEmbedUrl?: string;
  facilities: string[];
  isFlagship?: boolean;
}

export interface MemberSessionData {
  member: Member;
  activeReservations: OnlineReservation[];
  pastReservations: OnlineReservation[];
}

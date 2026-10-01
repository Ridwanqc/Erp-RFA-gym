import { Lead } from '../types';
import { OnlineReservation } from '../types/landingTypes';

export interface StageConfig {
  key: Lead['status'];
  label: string;
  subtitle: string;
  dotColor: string;
  borderColor: string;
  accentBg: string;
  textColor: string;
  bgBadge: string;
}

export const STAGE_CONFIGS: StageConfig[] = [
  {
    key: 'Baru',
    label: 'Lead Baru',
    subtitle: 'Prospek masuk & belum dihubungi',
    dotColor: 'bg-blue-500',
    borderColor: 'border-blue-500/40',
    accentBg: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    bgBadge: 'bg-blue-500/20 text-blue-300'
  },
  {
    key: 'Follow Up',
    label: 'Follow Up',
    subtitle: 'Sedang proses chat / penawaran',
    dotColor: 'bg-amber-500',
    borderColor: 'border-amber-500/40',
    accentBg: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    bgBadge: 'bg-amber-500/20 text-amber-300'
  },
  {
    key: 'Trial',
    label: 'Trial / Visit',
    subtitle: 'Janji coba gym & free pass',
    dotColor: 'bg-purple-500',
    borderColor: 'border-purple-500/40',
    accentBg: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    bgBadge: 'bg-purple-500/20 text-purple-300'
  },
  {
    key: 'Member',
    label: 'Win (Member)',
    subtitle: 'Berhasil closing & jadi member',
    dotColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500/40',
    accentBg: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/20 text-emerald-300'
  },
  {
    key: 'Lost',
    label: 'Lost / Batal',
    subtitle: 'Batal gabung / tidak respons',
    dotColor: 'bg-rose-500',
    borderColor: 'border-rose-500/40',
    accentBg: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    bgBadge: 'bg-rose-500/20 text-rose-300'
  }
];

/**
 * Checks whether a lead originates from online registration
 */
export function isOnlineLead(lead: Lead): boolean {
  if (!lead) return false;
  const src = (lead.source || '').toLowerCase();
  const id = (lead.id || '').toLowerCase();
  const notes = (lead.notes || '').toLowerCase();

  return (
    src.includes('online') ||
    src.includes('web') ||
    src.includes('portal') ||
    id.includes('rfa-reg') ||
    id.includes('pass-') ||
    notes.includes('registrasi online') ||
    notes.includes('passcode') ||
    notes.includes('web portal')
  );
}

/**
 * Extracts the online passcode from a lead's notes or ID
 */
export function getOnlinePasscode(lead: Lead): string {
  if (!lead) return '';
  const notes = lead.notes || '';
  const match = notes.match(/PASS-[A-Za-z0-9]+/i);
  if (match) return match[0].toUpperCase();

  const idMatch = (lead.id || '').match(/PASS-[A-Za-z0-9]+/i);
  if (idMatch) return idMatch[0].toUpperCase();

  return '';
}

/**
 * Maps an OnlineReservation into a unified pipeline Lead object
 */
export function mapOnlineReservationToLead(reservation: OnlineReservation): Lead {
  const isTrial =
    reservation.programCategory === 'free_trial' ||
    (reservation.programName || '').toLowerCase().includes('trial') ||
    (reservation.programName || '').toLowerCase().includes('visit');

  const passcode = reservation.ticketPassCode || `PASS-${reservation.id.slice(-4)}`;

  return {
    id: reservation.id,
    date: reservation.bookingDate || new Date().toISOString().split('T')[0],
    name: reservation.customerName,
    phone: reservation.customerPhone,
    source: '🌐 Daftar Online',
    status: isTrial ? 'Trial' : 'Baru',
    priority: 'Tinggi',
    interest: reservation.programName || 'Membership GymPro',
    estimatedValue: isTrial ? 0 : 1450000,
    notes: `Pendaftaran Online Website. Passcode: ${passcode}. Program: ${reservation.programName}. Slot: ${reservation.timeSlot || '-'}. ${reservation.notes || ''}`.trim(),
    branchId: reservation.branchId,
    branchName: reservation.branchName,
    tags: ['Online Registration', 'Web Portal', isTrial ? 'Trial Pass' : 'New Member']
  };
}

/**
 * Unifies offline leads with online reservations, deduplicating by phone and ID
 */
export function unifyPipelineLeads(
  leads: Lead[],
  onlineReservations?: OnlineReservation[]
): Lead[] {
  const unified = [...leads];
  const existingPhones = new Set(leads.map((l) => (l.phone || '').replace(/\D/g, '')));
  const existingIds = new Set(leads.map((l) => l.id));

  if (onlineReservations && onlineReservations.length > 0) {
    for (const res of onlineReservations) {
      const cleanPhone = (res.customerPhone || '').replace(/\D/g, '');
      if (!existingIds.has(res.id) && (!cleanPhone || !existingPhones.has(cleanPhone))) {
        unified.push(mapOnlineReservationToLead(res));
        if (cleanPhone) existingPhones.add(cleanPhone);
        existingIds.add(res.id);
      }
    }
  }

  return unified;
}

export interface PipelineFilterOptions {
  stageStatus?: Lead['status'];
  scope?: 'all' | 'online' | 'my' | 'unassigned' | 'high_priority';
  currentUserId?: string;
  picId?: string;
  source?: string;
  priority?: string;
  search?: string;
}

/**
 * Filters pipeline leads by stage, user scope, assignment, source, priority, and search query
 */
export function filterPipelineLeads(
  leads: Lead[],
  options: PipelineFilterOptions
): Lead[] {
  let result = [...leads];

  // Stage Status
  if (options.stageStatus) {
    result = result.filter((l) => l.status === options.stageStatus);
  }

  // Scope Filter
  if (options.scope === 'online') {
    result = result.filter((l) => isOnlineLead(l));
  } else if (options.scope === 'my' && options.currentUserId) {
    result = result.filter((l) => l.picId === options.currentUserId);
  } else if (options.scope === 'unassigned') {
    result = result.filter((l) => !l.picId);
  } else if (options.scope === 'high_priority') {
    result = result.filter((l) => l.priority === 'Tinggi');
  }

  // PIC Filter
  if (options.picId && options.picId !== 'all') {
    if (options.picId === 'unassigned') {
      result = result.filter((l) => !l.picId);
    } else {
      result = result.filter((l) => l.picId === options.picId);
    }
  }

  // Source Filter
  if (options.source && options.source !== 'all') {
    result = result.filter((l) => (l.source || '').toLowerCase().includes(options.source!.toLowerCase()));
  }

  // Priority Filter
  if (options.priority && options.priority !== 'all') {
    result = result.filter((l) => l.priority === options.priority);
  }

  // Search Filter
  if (options.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    result = result.filter((l) => {
      const name = (l.name || '').toLowerCase();
      const phone = (l.phone || '').toLowerCase();
      const pic = (l.picName || '').toLowerCase();
      const notes = (l.notes || '').toLowerCase();
      const passcode = getOnlinePasscode(l).toLowerCase();
      return name.includes(q) || phone.includes(q) || pic.includes(q) || notes.includes(q) || passcode.includes(q);
    });
  }

  return result;
}

export interface StageMetrics {
  totalLeads: number;
  onlineCount: number;
  unassignedCount: number;
  totalEstimatedValue: number;
  onlinePercentage: number;
}

/**
 * Calculates metrics for a specific pipeline stage
 */
export function calculateStageMetrics(
  leads: Lead[],
  stage: Lead['status']
): StageMetrics {
  const stageLeads = leads.filter((l) => l.status === stage);
  const onlineCount = stageLeads.filter((l) => isOnlineLead(l)).length;
  const unassignedCount = stageLeads.filter((l) => !l.picId).length;
  const totalEstimatedValue = stageLeads.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  const onlinePercentage = stageLeads.length > 0 ? Math.round((onlineCount / stageLeads.length) * 100) : 0;

  return {
    totalLeads: stageLeads.length,
    onlineCount,
    unassignedCount,
    totalEstimatedValue,
    onlinePercentage
  };
}

export interface GlobalCRMMetrics {
  totalLeads: number;
  activeLeadsCount: number;
  activePipelineValue: number;
  onlineLeadsCount: number;
  winCount: number;
  winClosingValue: number;
  lostCount: number;
  closingRate: number;
}

/**
 * Calculates global CRM metrics across all stages
 */
export function calculateGlobalCRMMetrics(leads: Lead[]): GlobalCRMMetrics {
  const totalLeads = leads.length;
  const activeLeads = leads.filter((l) => l.status !== 'Lost' && l.status !== 'Member');
  const activeLeadsCount = activeLeads.length;
  const activePipelineValue = activeLeads.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  const onlineLeadsCount = leads.filter((l) => isOnlineLead(l)).length;

  const winLeads = leads.filter((l) => l.status === 'Member');
  const winCount = winLeads.length;
  const winClosingValue = winLeads.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

  const lostLeads = leads.filter((l) => l.status === 'Lost');
  const lostCount = lostLeads.length;

  const closingRate = totalLeads > 0 ? Math.round((winCount / totalLeads) * 100) : 0;

  return {
    totalLeads,
    activeLeadsCount,
    activePipelineValue,
    onlineLeadsCount,
    winCount,
    winClosingValue,
    lostCount,
    closingRate
  };
}

/**
 * Advances a lead to the next sequential pipeline stage
 */
export function getNextStage(current: Lead['status']): Lead['status'] {
  switch (current) {
    case 'Baru':
      return 'Follow Up';
    case 'Follow Up':
      return 'Trial';
    case 'Trial':
      return 'Member';
    case 'Lost':
      return 'Follow Up'; // Reactivation
    default:
      return current;
  }
}

/**
 * Moves a lead back to the previous sequential pipeline stage
 */
export function getPrevStage(current: Lead['status']): Lead['status'] {
  switch (current) {
    case 'Trial':
      return 'Follow Up';
    case 'Follow Up':
      return 'Baru';
    default:
      return current;
  }
}

/**
 * Validates whether transitioning from one stage to another is allowed
 */
export function canTransitionStage(from: Lead['status'], to: Lead['status']): boolean {
  if (from === to) return true;
  if (from === 'Member' && to !== 'Member') return false; // Win is terminal unless deliberate re-open
  return true;
}

/**
 * Formats customized WhatsApp lead messages based on lead origin and stage
 */
export function formatWhatsAppLeadMessage(lead: Lead, templateType: string): string {
  const name = lead.name;
  const passcode = getOnlinePasscode(lead);
  const program = lead.interest || 'Membership GymPro';

  switch (templateType) {
    case 'online_welcome':
      return `Halo Kak ${name}! Salam hangat dari GymPro Enterprise. Kami telah menerima registrasi online Anda untuk ${program}. Kode verifikasi/passcode Anda adalah *${passcode || 'PASS-ONLINE'}*. Kapan rencana Kak ${name} berkunjung ke front desk kami untuk aktivasi kartu member? Terima kasih!`;
    case 'trial':
      return `Halo Kak ${name}! Jadwal free trial & visit gym Kakak di GymPro sudah kami siapkan. Tim trainer kami siap menemani sesi latihan. Mohon konfirmasi kehadiran Kakak ya!`;
    case 'promo':
      return `Halo Kak ${name}! Kami ada penawaran spesial potongan pendaftaran membership khusus minggu ini di GymPro. Boleh kami jelaskan detail promonya?`;
    case 'greeting':
    default:
      return `Halo Kak ${name}! Terima kasih telah menghubungi GymPro Enterprise. Ada yang bisa kami bantu terkait program kebugaran dan fasilitas gym kami?`;
  }
}

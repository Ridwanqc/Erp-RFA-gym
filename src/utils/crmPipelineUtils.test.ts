import { describe, it, expect } from 'vitest';
import {
  isOnlineLead,
  getOnlinePasscode,
  mapOnlineReservationToLead,
  unifyPipelineLeads,
  filterPipelineLeads,
  calculateStageMetrics,
  calculateGlobalCRMMetrics,
  getNextStage,
  getPrevStage,
  canTransitionStage,
  formatWhatsAppLeadMessage,
  STAGE_CONFIGS
} from './crmPipelineUtils';
import { Lead } from '../types';
import { OnlineReservation } from '../types/landingTypes';

describe('CRM Pipeline & Online Member Registration (TDD Suite)', () => {
  // Mock Data
  const sampleOfflineLead: Lead = {
    id: 'L01',
    name: 'Budi Santoso',
    phone: '081234567890',
    source: 'Walk-in',
    status: 'Baru',
    priority: 'Sedang',
    interest: 'Membership 1 Bulan',
    estimatedValue: 350000,
    picId: 'U002',
    picName: 'Sarah Jenkins',
    date: '2026-10-01'
  };

  const sampleOnlineLead: Lead = {
    id: 'L07',
    name: 'Nadia Paramitha',
    phone: '081299887766',
    source: 'Daftar Online (Website)',
    status: 'Baru',
    priority: 'Tinggi',
    interest: 'Membership 6 Bulan Platinum',
    estimatedValue: 1450000,
    notes: 'Registrasi Online via Website. Passcode: PASS-1042. Paket: Platinum 6 Bulan.',
    date: '2026-10-01'
  };

  const sampleOnlineReservation: OnlineReservation = {
    id: 'RFA-REG-2026-1042',
    bookingDate: '2026-10-01',
    targetDate: '2026-10-02',
    timeSlot: '09:00 - 10:00',
    programName: 'Membership 6 Bulan Platinum',
    programCategory: 'membership',
    branchId: 'BR-001',
    branchName: 'GymPro Sudirman Central',
    customerName: 'Nadia Paramitha',
    customerPhone: '081299887766',
    customerEmail: 'nadia@example.com',
    status: 'CONFIRMED',
    ticketPassCode: 'PASS-1042',
    notes: 'Pendaftaran membership online via website',
    type: 'membership',
    qrCodeData: 'QR-RFA-REG-2026-1042'
  };

  describe('1. Online Lead Identification (isOnlineLead)', () => {
    it('should identify a lead with source "Daftar Online (Website)" as online', () => {
      expect(isOnlineLead(sampleOnlineLead)).toBe(true);
    });

    it('should identify a lead with source "🌐 Daftar Online" as online', () => {
      const lead: Lead = { ...sampleOfflineLead, source: '🌐 Daftar Online' };
      expect(isOnlineLead(lead)).toBe(true);
    });

    it('should identify a lead with "RFA-REG" in ID as online', () => {
      const lead: Lead = { ...sampleOfflineLead, id: 'RFA-REG-2026-9999', source: 'Other' };
      expect(isOnlineLead(lead)).toBe(true);
    });

    it('should identify a lead with "Web Portal" in notes as online', () => {
      const lead: Lead = { ...sampleOfflineLead, notes: 'Pendaftar dari Web Portal GymPro' };
      expect(isOnlineLead(lead)).toBe(true);
    });

    it('should return false for regular offline walk-in or instagram leads', () => {
      expect(isOnlineLead(sampleOfflineLead)).toBe(false);
      expect(isOnlineLead({ ...sampleOfflineLead, source: 'Instagram' })).toBe(false);
      expect(isOnlineLead({ ...sampleOfflineLead, source: 'Referral' })).toBe(false);
    });
  });

  describe('2. Online Passcode Extraction (getOnlinePasscode)', () => {
    it('should extract passcode from "Passcode: PASS-XXXX" notes pattern', () => {
      expect(getOnlinePasscode(sampleOnlineLead)).toBe('PASS-1042');
    });

    it('should extract passcode from "PASS-XXXX" in lead ID', () => {
      const lead: Lead = { ...sampleOfflineLead, id: 'PASS-8842', notes: '' };
      expect(getOnlinePasscode(lead)).toBe('PASS-8842');
    });

    it('should return empty string if no passcode pattern found', () => {
      expect(getOnlinePasscode(sampleOfflineLead)).toBe('');
    });
  });

  describe('3. Mapping Online Reservation to Lead (mapOnlineReservationToLead)', () => {
    it('should map an OnlineReservation to a valid Lead for the pipeline', () => {
      const mapped = mapOnlineReservationToLead(sampleOnlineReservation);
      expect(mapped.id).toBe(sampleOnlineReservation.id);
      expect(mapped.name).toBe('Nadia Paramitha');
      expect(mapped.phone).toBe('081299887766');
      expect(mapped.source).toBe('🌐 Daftar Online');
      expect(mapped.status).toBe('Baru');
      expect(mapped.priority).toBe('Tinggi');
      expect(mapped.interest).toBe('Membership 6 Bulan Platinum');
      expect(mapped.notes).toContain('PASS-1042');
      expect(mapped.branchId).toBe('BR-001');
    });

    it('should map a trial reservation to status "Trial"', () => {
      const trialReservation: OnlineReservation = {
        ...sampleOnlineReservation,
        id: 'RFA-BK-2026-3021',
        programCategory: 'free_trial',
        programName: '1-Day Free Trial Pass',
        ticketPassCode: 'PASS-3021'
      };
      const mapped = mapOnlineReservationToLead(trialReservation);
      expect(mapped.status).toBe('Trial');
      expect(mapped.interest).toContain('Free Trial');
    });
  });

  describe('4. Unifying Pipeline Leads (unifyPipelineLeads)', () => {
    it('should combine existing manual leads and online reservations without duplicates', () => {
      const initialLeads: Lead[] = [sampleOfflineLead, sampleOnlineLead];
      // Reservation with same phone as sampleOnlineLead
      const unified = unifyPipelineLeads(initialLeads, [sampleOnlineReservation]);

      // Should not duplicate Nadia Paramitha
      const nadiaEntries = unified.filter((l) => l.phone === '081299887766');
      expect(nadiaEntries.length).toBe(1);
      expect(unified.length).toBe(2);
    });

    it('should add new online reservations into the pipeline if not previously existing', () => {
      const initialLeads: Lead[] = [sampleOfflineLead];
      const unified = unifyPipelineLeads(initialLeads, [sampleOnlineReservation]);

      expect(unified.length).toBe(2);
      expect(unified.some((l) => l.name === 'Nadia Paramitha')).toBe(true);
      expect(unified.some((l) => isOnlineLead(l))).toBe(true);
    });
  });

  describe('5. Pipeline Filtering (filterPipelineLeads)', () => {
    const mixedLeads: Lead[] = [
      sampleOfflineLead, // Status: Baru, PIC: U002, Priority: Sedang, Offline
      sampleOnlineLead,  // Status: Baru, PIC: undefined, Priority: Tinggi, Online
      { ...sampleOfflineLead, id: 'L02', name: 'Rina Wijaya', status: 'Follow Up', picId: 'U002' },
      { ...sampleOfflineLead, id: 'L03', name: 'Dimas Pratama', status: 'Trial', picId: 'U003' },
      { ...sampleOfflineLead, id: 'L04', name: 'Siti Aminah', status: 'Member', picId: 'U002', estimatedValue: 1200000 },
      { ...sampleOfflineLead, id: 'L05', name: 'Joko Anwar', status: 'Lost', picId: 'U002' }
    ];

    it('should filter by specific stage status', () => {
      const baru = filterPipelineLeads(mixedLeads, { stageStatus: 'Baru' });
      expect(baru.length).toBe(2);
      const trial = filterPipelineLeads(mixedLeads, { stageStatus: 'Trial' });
      expect(trial.length).toBe(1);
      expect(trial[0].name).toBe('Dimas Pratama');
    });

    it('should filter by "online" scope', () => {
      const onlineOnly = filterPipelineLeads(mixedLeads, { scope: 'online' });
      expect(onlineOnly.length).toBe(1);
      expect(onlineOnly[0].name).toBe('Nadia Paramitha');
    });

    it('should filter by "my" scope for current user', () => {
      const myLeads = filterPipelineLeads(mixedLeads, { scope: 'my', currentUserId: 'U002' });
      expect(myLeads.every((l) => l.picId === 'U002')).toBe(true);
      expect(myLeads.length).toBe(4);
    });

    it('should filter by "unassigned" scope (no PIC assigned)', () => {
      const unassigned = filterPipelineLeads(mixedLeads, { scope: 'unassigned' });
      expect(unassigned.length).toBe(1);
      expect(unassigned[0].name).toBe('Nadia Paramitha');
    });

    it('should filter by "high_priority" scope', () => {
      const highPriority = filterPipelineLeads(mixedLeads, { scope: 'high_priority' });
      expect(highPriority.length).toBe(1);
      expect(highPriority[0].priority).toBe('Tinggi');
    });

    it('should filter by search query matching name, phone, or passcode', () => {
      const searchName = filterPipelineLeads(mixedLeads, { search: 'Nadia' });
      expect(searchName.length).toBe(1);
      const searchPhone = filterPipelineLeads(mixedLeads, { search: '081234567890' });
      expect(searchPhone.length).toBe(5);
      const searchPass = filterPipelineLeads(mixedLeads, { search: 'PASS-1042' });
      expect(searchPass.length).toBe(1);
    });
  });

  describe('6. Stage Metrics Calculation (calculateStageMetrics)', () => {
    const stageLeads: Lead[] = [
      sampleOfflineLead, // Est: 350000, PIC: U002
      sampleOnlineLead   // Est: 1450000, PIC: undefined, Online
    ];

    it('should calculate accurate stage counts and financial estimates', () => {
      const metrics = calculateStageMetrics(stageLeads, 'Baru');
      expect(metrics.totalLeads).toBe(2);
      expect(metrics.onlineCount).toBe(1);
      expect(metrics.unassignedCount).toBe(1);
      expect(metrics.totalEstimatedValue).toBe(1800000);
      expect(metrics.onlinePercentage).toBe(50);
    });
  });

  describe('7. Global CRM Pipeline KPI Metrics (calculateGlobalCRMMetrics)', () => {
    const pipelineData: Lead[] = [
      { ...sampleOfflineLead, status: 'Baru', estimatedValue: 500000 },
      { ...sampleOnlineLead, status: 'Follow Up', estimatedValue: 1500000 },
      { ...sampleOfflineLead, id: 'L08', status: 'Trial', estimatedValue: 1000000 },
      { ...sampleOfflineLead, id: 'L09', status: 'Member', estimatedValue: 2000000 }, // Won
      { ...sampleOfflineLead, id: 'L10', status: 'Lost', estimatedValue: 500000 }      // Lost
    ];

    it('should calculate active leads, total pipeline value, online count, and closing rate', () => {
      const kpis = calculateGlobalCRMMetrics(pipelineData);
      expect(kpis.activeLeadsCount).toBe(3); // Baru, Follow Up, Trial
      expect(kpis.activePipelineValue).toBe(3000000); // 500k + 1.5M + 1M
      expect(kpis.onlineLeadsCount).toBe(1);
      expect(kpis.winCount).toBe(1);
      expect(kpis.winClosingValue).toBe(2000000);
      expect(kpis.lostCount).toBe(1);
      expect(kpis.closingRate).toBe(20); // 1 / 5 = 20%
    });
  });

  describe('8. Stage State Machine & Transitions (getNextStage, canTransitionStage)', () => {
    it('should define all 5 core stages correctly in order', () => {
      const keys = STAGE_CONFIGS.map((s) => s.key);
      expect(keys).toEqual(['Baru', 'Follow Up', 'Trial', 'Member', 'Lost']);
    });

    it('should advance stages in sequence: Baru -> Follow Up -> Trial -> Member', () => {
      expect(getNextStage('Baru')).toBe('Follow Up');
      expect(getNextStage('Follow Up')).toBe('Trial');
      expect(getNextStage('Trial')).toBe('Member');
      expect(getNextStage('Member')).toBe('Member'); // Final
    });

    it('should retreat stages in sequence: Trial -> Follow Up -> Baru', () => {
      expect(getPrevStage('Trial')).toBe('Follow Up');
      expect(getPrevStage('Follow Up')).toBe('Baru');
      expect(getPrevStage('Baru')).toBe('Baru');
    });

    it('should reactivate a Lost lead to Follow Up', () => {
      expect(getNextStage('Lost')).toBe('Follow Up');
    });

    it('should validate whether a transition is allowed', () => {
      expect(canTransitionStage('Baru', 'Follow Up')).toBe(true);
      expect(canTransitionStage('Baru', 'Member')).toBe(true);
      expect(canTransitionStage('Trial', 'Member')).toBe(true);
      expect(canTransitionStage('Member', 'Baru')).toBe(false);
    });
  });

  describe('9. WhatsApp Message Generation for Online Registrants (formatWhatsAppLeadMessage)', () => {
    it('should format an online activation message with name, passcode, and plan', () => {
      const msg = formatWhatsAppLeadMessage(sampleOnlineLead, 'online_welcome');
      expect(msg).toContain('Nadia Paramitha');
      expect(msg).toContain('PASS-1042');
      expect(msg).toContain('GymPro');
      expect(msg).toContain('front desk');
    });

    it('should format standard greeting message for offline leads', () => {
      const msg = formatWhatsAppLeadMessage(sampleOfflineLead, 'greeting');
      expect(msg).toContain('Budi Santoso');
      expect(msg).toContain('GymPro');
    });
  });
});

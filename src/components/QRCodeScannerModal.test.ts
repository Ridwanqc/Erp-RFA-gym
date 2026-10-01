import { describe, it, expect } from 'vitest';
import { findMemberFromQR } from './QRCodeScannerModal';
import { Member } from '../types';

const mockMembers: Member[] = [
  {
    id: 'M001',
    name: 'Ahmad Tajudin',
    phone: '081234567890',
    expired: '2026-12-31',
    gender: 'L',
    ptQuota: 5,
    picId: 'S01',
    picName: 'Coach Rian',
    followUpStatus: 'Active',
    photo: '',
    status: 'AKTIF'
  },
  {
    id: 'M002',
    name: 'Siti Rahma',
    phone: '081987654321',
    expired: '2026-06-30',
    gender: 'P',
    ptQuota: 0,
    picId: 'S01',
    picName: 'Coach Rian',
    followUpStatus: 'Active',
    photo: '',
    status: 'AKTIF'
  }
];

describe('QRCodeScannerModal - Attendance Barcode Decoding (Absen)', () => {
  it('should match member by exact username in uppercase from barcode', () => {
    const result = findMemberFromQR('AHMAD TAJUDIN', mockMembers);
    expect(result).toBeDefined();
    expect(result?.id).toBe('M001');
    expect(result?.name).toBe('Ahmad Tajudin');
  });

  it('should match member by username stripped from 1D laser barcode asterisks', () => {
    const result = findMemberFromQR('*AHMAD TAJUDIN*', mockMembers);
    expect(result).toBeDefined();
    expect(result?.id).toBe('M001');
  });

  it('should match member by username with AT prefix', () => {
    const result = findMemberFromQR('AT AHMAD TAJUDIN', mockMembers);
    expect(result).toBeDefined();
    expect(result?.id).toBe('M001');
  });

  it('should match member by Username - ID combined barcode', () => {
    const result = findMemberFromQR('AHMAD TAJUDIN - M001', mockMembers);
    expect(result).toBeDefined();
    expect(result?.id).toBe('M001');
  });

  it('should match member by official RFA protocol', () => {
    const result = findMemberFromQR('RFA-MEMBER:M001:97B6B347', mockMembers);
    expect(result).toBeDefined();
    expect(result?.id).toBe('M001');
  });

  it('should match member by direct member ID', () => {
    const result = findMemberFromQR('M002', mockMembers);
    expect(result).toBeDefined();
    expect(result?.name).toBe('Siti Rahma');
  });

  it('should match member by phone number', () => {
    const result = findMemberFromQR('081234567890', mockMembers);
    expect(result).toBeDefined();
    expect(result?.id).toBe('M001');
  });

  it('should return null for unknown / invalid barcode', () => {
    const result = findMemberFromQR('UNKNOWN_CODE_9999', mockMembers);
    expect(result).toBeNull();
  });
});

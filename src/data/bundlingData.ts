import { BundlePackage, MemberMembershipRecord, TrainerCommissionRecord } from '../types';
import { APP_TODAY } from '../utils/formatters';

export const INITIAL_BUNDLE_PACKAGES: BundlePackage[] = [
  {
    bundleId: 'BND-01',
    bundleCode: 'VIP-PLUS',
    bundleName: 'VIP PLUS',
    description: 'Paket bundling favorit: Akses gym reguler 1 bulan + 2 sesi Personal Trainer 1-on-1 dengan Pelatih Bersertifikasi.',
    bundleType: 'MEMBERSHIP_PLUS_PT',
    price: 500000,
    status: 'ACTIVE',
    createdDate: '2026-09-01',
    createdBy: 'Budi Santoso',
    participantType: 'Personal',
    maxParticipants: 1,
    ptComponentValue: 150000, // Rp 150.000 basis komisi PT
    commissionRate: 20, // 20% komisi trainer (Rp 30.000)
    allowDpActivation: true,
    items: [
      {
        bundleItemId: 'BITEM-01-1',
        bundleId: 'BND-01',
        itemType: 'MEMBERSHIP',
        membershipPackageId: 'PK01',
        name: 'Membership Gym Reguler',
        quantity: 1,
        duration: 30,
        durationLabel: '1 Bulan',
        unitPrice: 350000,
        isActive: true
      },
      {
        bundleItemId: 'BITEM-01-2',
        bundleId: 'BND-01',
        itemType: 'PT',
        ptPackageId: 'PK06',
        name: 'Personal Training 1-on-1',
        quantity: 1,
        sessionCount: 2,
        unitPrice: 150000,
        isActive: true
      }
    ]
  },
  {
    bundleId: 'BND-02',
    bundleCode: 'VIP-PREMIUM',
    bundleName: 'VIP PREMIUM',
    description: 'Program akselerasi kebugaran 3 bulan akses gym + 8 sesi bimbingan Personal Trainer terstruktur.',
    bundleType: 'MEMBERSHIP_PLUS_PT',
    price: 1500000,
    status: 'ACTIVE',
    createdDate: '2026-09-01',
    createdBy: 'Budi Santoso',
    participantType: 'Personal',
    maxParticipants: 1,
    ptComponentValue: 600000, // Basis komisi PT
    commissionRate: 20, // 20% = Rp 120.000
    allowDpActivation: true,
    items: [
      {
        bundleItemId: 'BITEM-02-1',
        bundleId: 'BND-02',
        itemType: 'MEMBERSHIP',
        membershipPackageId: 'PK02',
        name: 'Membership Gym 3 Bulan',
        quantity: 1,
        duration: 90,
        durationLabel: '3 Bulan',
        unitPrice: 900000,
        isActive: true
      },
      {
        bundleItemId: 'BITEM-02-2',
        bundleId: 'BND-02',
        itemType: 'PT',
        ptPackageId: 'PK07',
        name: 'Personal Training Intensive',
        quantity: 1,
        sessionCount: 8,
        unitPrice: 600000,
        isActive: true
      }
    ]
  },
  {
    bundleId: 'BND-03',
    bundleCode: 'GOLD-PLUS',
    bundleName: 'GOLD PLUS',
    description: 'Total Body Transformation 6 bulan akses gym tanpa batas + 16 sesi Personal Trainer intensif.',
    bundleType: 'MEMBERSHIP_PLUS_PT',
    price: 2800000,
    status: 'ACTIVE',
    createdDate: '2026-09-01',
    createdBy: 'Budi Santoso',
    participantType: 'Personal',
    maxParticipants: 1,
    ptComponentValue: 1200000,
    commissionRate: 20, // 20% = Rp 240.000
    allowDpActivation: true,
    items: [
      {
        bundleItemId: 'BITEM-03-1',
        bundleId: 'BND-03',
        itemType: 'MEMBERSHIP',
        membershipPackageId: 'PK02',
        name: 'Membership Gym 6 Bulan',
        quantity: 1,
        duration: 180,
        durationLabel: '6 Bulan',
        unitPrice: 1600000,
        isActive: true
      },
      {
        bundleItemId: 'BITEM-03-2',
        bundleId: 'BND-03',
        itemType: 'PT',
        ptPackageId: 'PK08',
        name: 'Personal Training Transformation',
        quantity: 1,
        sessionCount: 16,
        unitPrice: 1200000,
        isActive: true
      }
    ]
  },
  {
    bundleId: 'BND-04',
    bundleCode: 'SILVER-PLUS-FNB',
    bundleName: 'SILVER PLUS (+ FnB)',
    description: 'Paket lengkap pemula: 1 bulan gym + 4 sesi PT + bonus 2x Air Mineral Prima & 1x Whey Protein Isolate.',
    bundleType: 'MEMBERSHIP_PLUS_PRODUCT',
    price: 750000,
    status: 'ACTIVE',
    createdDate: '2026-09-01',
    createdBy: 'Budi Santoso',
    participantType: 'Personal',
    maxParticipants: 1,
    ptComponentValue: 300000,
    commissionRate: 20, // 20% = Rp 60.000
    allowDpActivation: true,
    items: [
      {
        bundleItemId: 'BITEM-04-1',
        bundleId: 'BND-04',
        itemType: 'MEMBERSHIP',
        membershipPackageId: 'PK01',
        name: 'Membership Gym Reguler',
        quantity: 1,
        duration: 30,
        durationLabel: '1 Bulan',
        unitPrice: 350000,
        isActive: true
      },
      {
        bundleItemId: 'BITEM-04-2',
        bundleId: 'BND-04',
        itemType: 'PT',
        ptPackageId: 'PK06',
        name: 'Personal Training Starter',
        quantity: 1,
        sessionCount: 4,
        unitPrice: 300000,
        isActive: true
      },
      {
        bundleItemId: 'BITEM-04-3',
        bundleId: 'BND-04',
        itemType: 'PRODUCT',
        productId: 'P01',
        name: 'Air Mineral Prima 600ml',
        quantity: 2,
        unitPrice: 8000,
        isActive: true
      },
      {
        bundleItemId: 'BITEM-04-4',
        bundleId: 'BND-04',
        itemType: 'PRODUCT',
        productId: 'P03',
        name: 'Whey Protein Isolate Sachet',
        quantity: 1,
        unitPrice: 30000,
        isActive: true
      }
    ]
  },
  {
    bundleId: 'BND-05',
    bundleCode: 'COUPLE-DUO-PLUS',
    bundleName: 'COUPLE DUO PLUS (2 Orang)',
    description: 'Paket sehat berdua pasangan/rekan kerja: 6 bulan membership untuk 2 orang + 10 sesi PT Duo.',
    bundleType: 'MEMBERSHIP_PLUS_PT',
    price: 2400000,
    status: 'ACTIVE',
    createdDate: '2026-09-01',
    createdBy: 'Budi Santoso',
    participantType: 'Couple',
    maxParticipants: 2,
    ptComponentValue: 800000,
    commissionRate: 20, // 20% = Rp 160.000
    allowDpActivation: true,
    items: [
      {
        bundleItemId: 'BITEM-05-1',
        bundleId: 'BND-05',
        itemType: 'MEMBERSHIP',
        membershipPackageId: 'PK04',
        name: 'Couple Duo Gym Access 6 Bulan',
        quantity: 2,
        duration: 180,
        durationLabel: '6 Bulan',
        unitPrice: 1600000,
        isActive: true
      },
      {
        bundleItemId: 'BITEM-05-2',
        bundleId: 'BND-05',
        itemType: 'PT',
        ptPackageId: 'PK09',
        name: 'PT Duo Partner 10 Sesi',
        quantity: 1,
        sessionCount: 10,
        unitPrice: 800000,
        isActive: true
      }
    ]
  }
];

export const INITIAL_MEMBER_MEMBERSHIPS: MemberMembershipRecord[] = [
  {
    id: 'MEM-001',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    packageName: 'VIP PLUS',
    bundleId: 'BND-01',
    bundleCode: 'VIP-PLUS',
    bundleTrxId: 'TRX-BND-901',
    startDate: '2026-09-18',
    endDate: '2026-10-18',
    durationDays: 30,
    durationLabel: '1 Bulan',
    status: 'AKTIF',
    createdDate: '2026-09-18',
    source: 'BUNDLING'
  },
  {
    id: 'MEM-002',
    memberId: 'M004',
    memberName: 'Maya Indah',
    packageName: 'VIP PREMIUM',
    bundleId: 'BND-02',
    bundleCode: 'VIP-PREMIUM',
    bundleTrxId: 'TRX-BND-882',
    startDate: '2026-07-10',
    endDate: '2026-10-10',
    durationDays: 90,
    durationLabel: '3 Bulan',
    status: 'AKTIF',
    createdDate: '2026-07-10',
    source: 'BUNDLING'
  },
  {
    id: 'MEM-003',
    memberId: 'M006',
    memberName: 'Bella Safira',
    packageName: 'VIP PREMIUM',
    bundleId: 'BND-02',
    bundleCode: 'VIP-PREMIUM',
    bundleTrxId: 'TRX-BND-912',
    startDate: '2026-09-17',
    endDate: '2026-12-17',
    durationDays: 90,
    durationLabel: '3 Bulan',
    status: 'AKTIF',
    createdDate: '2026-09-17',
    source: 'BUNDLING'
  }
];

export const INITIAL_TRAINER_COMMISSIONS: TrainerCommissionRecord[] = [
  {
    id: 'COMM-001',
    date: '2026-09-18',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    bundleId: 'BND-01',
    bundleName: 'VIP PLUS',
    trxId: 'TRX-BND-901',
    sessionNumber: 1,
    ptComponentValue: 150000,
    commissionRate: 20,
    commissionAmount: 30000,
    paymentStatus: 'LUNAS',
    validationStatus: 'COMPLETED'
  },
  {
    id: 'COMM-002',
    date: '2026-09-17',
    trainerId: 'S03',
    trainerName: 'Citra Lestari',
    memberId: 'M006',
    memberName: 'Bella Safira',
    bundleId: 'BND-02',
    bundleName: 'VIP PREMIUM',
    trxId: 'TRX-BND-912',
    sessionNumber: 1,
    ptComponentValue: 600000,
    commissionRate: 20,
    commissionAmount: 120000,
    paymentStatus: 'LUNAS',
    validationStatus: 'COMPLETED'
  },
  {
    id: 'COMM-003',
    date: '2026-09-15',
    trainerId: 'S05',
    trainerName: 'David Chen',
    memberId: 'M004',
    memberName: 'Maya Indah',
    bundleId: 'BND-02',
    bundleName: 'VIP PREMIUM',
    trxId: 'TRX-BND-882',
    sessionNumber: 2,
    ptComponentValue: 600000,
    commissionRate: 20,
    commissionAmount: 120000,
    paymentStatus: 'LUNAS',
    validationStatus: 'COMPLETED'
  }
];

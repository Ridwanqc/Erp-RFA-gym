import {
  PrinterConfig,
  GymBusinessProfile,
  GymBranch,
  RoleDefinition,
  RoleModulePermission,
  PaymentAndTaxConfig,
  WhatsAppTemplateConfig,
  SystemSettings,
  PicProtectionConfig,
  UserRole
} from '../types';

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  paperWidth: '80mm',
  connectionType: 'browser',
  autoPrintOnPayment: false,
  storeName: 'RFA GYM',
  storeTagline: 'Train Hard, Stay Healthy, Live Strong',
  storeAddress: 'Jl. Kranggan Permai, Jl. Wijaya Kusuma Blok AS 48 No. 25–26',
  storeCity: 'Jatisampurna, Bekasi, Jawa Barat 17433',
  storePhone: '0857-7218-5973',
  headerNote: 'STRUK RESMI RFA GYM',
  footerNote: 'Terima kasih telah berlatih bersama RFA GYM. Semangat mencapai target kebugaran Anda!',
  showLogo: true,
  showBarcode: true,
  showCashierName: true,
  fontDensity: 'normal',
  autoCutPaper: true,
  printerIpAddress: '192.168.1.200',
  printerPort: 9100,
  bluetoothDeviceName: 'POS-80-Thermal',
  copiesCount: 1
};

export const DEFAULT_GYM_PROFILE: GymBusinessProfile = {
  gymName: 'RFA GYM',
  tagline: 'Private Gym & Fitness Center • Workout Bareng, Berkembang Bareng',
  branchName: 'RFA GYM Cibubur, Bekasi (Flagship HQ)',
  address: 'Jl. Kranggan Permai, Jl. Wijaya Kusuma Blok AS 48 No. 25–26, Jatisampurna',
  city: 'Bekasi, Jawa Barat 17433',
  phone: '0857-7218-5973',
  whatsapp: '0857-7218-5973',
  email: 'info@rfagym.com',
  instagram: '@rfagym',
  website: 'https://share.google/SILNZrwYoRcIyYjRo',
  googleMapsUrl: 'https://share.google/SILNZrwYoRcIyYjRo',
  npwp: '01.345.678.9-041.000',
  openHoursWeekday: '06:00 - 22:00 WIB',
  openHoursWeekend: '07:00 - 21:00 WIB',
  logoUrl: ''
};

export const DEFAULT_BRANCHES: GymBranch[] = [
  {
    id: 'BR-001',
    name: 'RFA GYM Cibubur, Bekasi (Flagship HQ)',
    code: 'CBR',
    address: 'Jl. Kranggan Permai, Jl. Wijaya Kusuma Blok AS 48 No. 25–26, Jatisampurna',
    city: 'Bekasi, Jawa Barat 17433',
    phone: '0857-7218-5973',
    whatsapp: '0857-7218-5973',
    email: 'cibubur@rfagym.com',
    managerName: 'Coach RFA Head Trainer',
    managerPhone: '0857-7218-5973',
    openHoursWeekday: '06:00 - 22:00 WIB',
    openHoursWeekend: '07:00 - 21:00 WIB',
    status: 'Aktif',
    isMainBranch: true,
    facilities: [
      'Olympic Weight & Free Weight Zone',
      'Resistance & Cable Machine Area',
      'Cardio Deck (Treadmill, Bike, Elliptical)',
      'Private PT & Couple Coaching Studio',
      'Smart Locker & Changing Room',
      'Juice & Protein Shake Bar'
    ],
    capacity: 250,
    totalMembers: 480,
    photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    createdAt: '2024-01-15',
    notes: 'Cabang Pusat (HQ) RFA GYM Cibubur'
  },
  {
    id: 'BR-002',
    name: 'RFA Gym Senopati Lifestyle Hub',
    code: 'SNP',
    address: 'Jl. Senopati Raya No. 45, Selong, Kebayoran Baru',
    city: 'Jakarta Selatan, DKI Jakarta 12190',
    phone: '(021) 7278-9911',
    whatsapp: '0819-1122-3344',
    email: 'senopati@rfagym.com',
    managerName: 'Jessica Anastasia, CPT',
    managerPhone: '0812-3344-5566',
    openHoursWeekday: '06:00 - 22:00 WIB',
    openHoursWeekend: '06:00 - 22:00 WIB',
    status: 'Aktif',
    isMainBranch: false,
    facilities: [
      'Pilates & Yoga Sanctuary',
      'Boxing Ring Corner',
      'VIP Shower & Lockers',
      'Recovery Ice Bath',
      'Lounge Cafe & Valet'
    ],
    capacity: 180,
    totalMembers: 320,
    photo: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
    createdAt: '2025-03-10',
    notes: 'Cabang Premium Lifestyle Jakarta Selatan'
  },
  {
    id: 'BR-003',
    name: 'RFA Gym Express BSD Green Office',
    code: 'BSD',
    address: 'BSD Green Office Park 9, Lantai Dasar Unit B-04, Jl. BSD Grand Boulevard',
    city: 'Tangerang, Banten 15339',
    phone: '(021) 3045-6677',
    whatsapp: '0812-3344-5566',
    email: 'bsd@rfagym.com',
    managerName: 'Bima Pratama, S.Si',
    managerPhone: '0817-6655-4433',
    openHoursWeekday: '06:00 - 21:30 WIB',
    openHoursWeekend: '07:00 - 20:00 WIB',
    status: 'Aktif',
    isMainBranch: false,
    facilities: [
      'CrossFit Rig & Turf Track',
      'Cardio Theater',
      'Smart Locker PIN',
      'Recovery Ice Bath',
      'Outdoor Sprint Track'
    ],
    capacity: 150,
    totalMembers: 210,
    photo: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=80',
    createdAt: '2025-09-01',
    notes: 'Cabang Urban Express Tangerang'
  }
];

export const SYSTEM_MODULES: { id: string; name: string; category: string; desc: string }[] = [
  { id: 'dashboard', name: 'Dashboard Eksekutif', category: 'Overview', desc: 'Melihat ringkasan omset, grafik kehadiran, dan statistik penting' },
  { id: 'absen', name: 'Absensi Staf & Member', category: 'Overview', desc: 'Pencatatan check-in gate member dan presensi kehadiran staf' },
  { id: 'front-desk-portal', name: 'Portal Kasir & Front Desk', category: 'Membership', desc: 'Pusat operasional member terpadu, check-in gate, renewal cepat, dan saran asisten pintar' },
  { id: 'membership', name: 'Keanggotaan & Paket', category: 'Membership', desc: 'Pendaftaran member baru, upgrade paket, dan perpanjangan langganan' },
  { id: 'freeze', name: 'Freeze / Cuti Member', category: 'Membership', desc: 'Pengajuan freeze, unfreeze, dan perpanjangan masa berlaku kartu' },
  { id: 'master-data', name: 'Direktori Member 360', category: 'Membership', desc: 'Akses riwayat 360, detail profil, dan kartu digital member' },
  { id: 'bundling', name: 'Bundling & Komisi', category: 'Membership', desc: 'Pengelolaan paket bundling membership + PT serta hitung komisi' },
  { id: 'crm', name: 'CRM & Pipeline Leads', category: 'Membership', desc: 'Follow-up prospek calon member, status closing, dan pesan WA' },
  { id: 'pt-sessions', name: 'Jadwal & Sesi PT', category: 'Personal Trainer', desc: 'Penjadwalan sesi latihan, booking trainer, dan checklist sesi' },
  { id: 'trainer-portal', name: 'Portal Khusus Trainer', category: 'Personal Trainer', desc: 'Area kerja pelatih untuk memantau klien binaan dan sesi' },
  { id: 'leader-pt', name: 'Dashboard Leader PT', category: 'Personal Trainer', desc: 'Monitoring omset paket PT dan evaluasi kinerja pelatih' },
  { id: 'pos', name: 'Kasir POS & Minuman', category: 'Retail / POS', desc: 'Penjualan minuman berenergi, suplemen, merchandise & sewa loker' },
  { id: 'products', name: 'Katalog & Stok Retail', category: 'Retail / POS', desc: 'Input data barang, harga jual, barcode, dan penyesuaian stok' },
  { id: 'inventaris', name: 'Inventaris & Servis Alat', category: 'Fasilitas & Aset', desc: 'Pencatatan mesin fitness, jadwal servis berkala & perbaikan' },
  { id: 'piutang', name: 'Buku Piutang & Cicilan', category: 'Keuangan', desc: 'Pemantauan cicilan member, jatuh tempo, dan pembayaran bertahap' },
  { id: 'laporan', name: 'Buku Besar & Void Transaksi', category: 'Keuangan', desc: 'Riwayat transaksi keluar-masuk kas, cetak ulang, dan pembatalan void' },
  { id: 'tutup-toko', name: 'Daily Closing Kasir', category: 'Keuangan', desc: 'Rekonsiliasi fisik laci kasir vs sistem dan cetak rekap shift' },
  { id: 'hr-payroll', name: 'HR, Jadwal & Penggajian', category: 'SDM', desc: 'Manajemen karyawan, jadwal shift kerja, dan slip gaji' },
  { id: 'settings', name: 'Pengaturan Sistem & Printer', category: 'Konfigurasi', desc: 'Konfigurasi printer thermal, hak akses role, dan profil cabang' }
];

export const DEFAULT_ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  admin: {
    role: 'admin',
    roleName: 'Super Administrator',
    description: 'Akses penuh tanpa batasan ke seluruh sistem, audit log, keuangan, dan pengaturan.',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      acc[m.id] = { view: true, create: true, edit: true, delete: true, voidRefund: true, export: true };
      return acc;
    }, {} as Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; voidRefund?: boolean; export?: boolean }>)
  },
  manager: {
    role: 'manager',
    roleName: 'Branch / Operational Manager',
    description: 'Pengawasan operasional cabang, evaluasi keuangan, approval cuti, dan manajemen inventaris.',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const isSettings = m.id === 'settings';
      acc[m.id] = {
        view: true,
        create: true,
        edit: true,
        delete: !isSettings,
        voidRefund: true,
        export: true
      };
      return acc;
    }, {} as Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; voidRefund?: boolean; export?: boolean }>)
  },
  kasir: {
    role: 'kasir',
    roleName: 'Front Desk & Kasir POS',
    description: 'Layanan kasir POS, transaksi membership, presensi gate, freeze, dan daily closing kas.',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const allowed = ['absen', 'front-desk-portal', 'membership', 'freeze', 'master-data', 'bundling', 'crm', 'pos', 'products', 'piutang', 'laporan', 'tutup-toko'];
      const canAccess = allowed.includes(m.id);
      acc[m.id] = {
        view: canAccess || m.id === 'inventaris',
        create: canAccess,
        edit: canAccess && m.id !== 'laporan',
        delete: false,
        voidRefund: false,
        export: canAccess
      };
      return acc;
    }, {} as Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; voidRefund?: boolean; export?: boolean }>)
  },
  leader_pt: {
    role: 'leader_pt',
    roleName: 'Head Coach / Leader PT',
    description: 'Manajemen pelatih fitness, pengawasan paket PT, jadwal sesi, dan evaluasi performa pelatih.',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const allowed = ['absen', 'master-data', 'bundling', 'crm', 'pt-sessions', 'trainer-portal', 'leader-pt', 'inventaris'];
      const canAccess = allowed.includes(m.id);
      acc[m.id] = {
        view: canAccess || m.id === 'dashboard',
        create: canAccess,
        edit: canAccess,
        delete: false,
        voidRefund: false,
        export: true
      };
      return acc;
    }, {} as Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; voidRefund?: boolean; export?: boolean }>)
  },
  pt: {
    role: 'pt',
    roleName: 'Personal Trainer',
    description: 'Fokus melatih klien, pencatatan log latihan, penyelesaian sesi PT, dan presensi kerja.',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const allowed = ['absen', 'pt-sessions', 'trainer-portal'];
      const canAccess = allowed.includes(m.id);
      acc[m.id] = {
        view: canAccess,
        create: canAccess,
        edit: canAccess,
        delete: false,
        voidRefund: false,
        export: false
      };
      return acc;
    }, {} as Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; voidRefund?: boolean; export?: boolean }>)
  },
  teknisi: {
    role: 'teknisi',
    roleName: 'Teknisi & Maintenance Alat',
    description: 'Pemeriksaan kondisi mesin fitness, servis berkala, checklist alat, dan log perawatan.',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const canAccess = m.id === 'inventaris' || m.id === 'absen';
      acc[m.id] = {
        view: canAccess,
        create: canAccess,
        edit: canAccess,
        delete: false,
        voidRefund: false,
        export: canAccess
      };
      return acc;
    }, {} as Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; voidRefund?: boolean; export?: boolean }>)
  }
};

export const DEFAULT_PAYMENT_AND_TAX: PaymentAndTaxConfig = {
  taxEnabled: true,
  taxRate: 11,
  taxLabel: 'PPN 11%',
  serviceChargeEnabled: false,
  serviceChargeRate: 0,
  defaultFreezeFee: 50000,
  bankAccounts: [
    {
      id: 'BANK-01',
      bankName: 'Bank Mandiri',
      accountNumber: '120-00-1122334-5',
      accountHolder: 'PT GYMPRO SEJAHTERA',
      isDefault: true,
      notes: 'Rekening Utama Operasional Gym'
    },
    {
      id: 'BANK-02',
      bankName: 'Bank BCA',
      accountNumber: '542-0199-888',
      accountHolder: 'GYMPRO FITNESS INDONESIA',
      isDefault: false,
      notes: 'Rekening Transfer Member & Pelunasan'
    },
    {
      id: 'BANK-03',
      bankName: 'Bank Artha Graha',
      accountNumber: '102-889-777-1',
      accountHolder: 'KASIR CAFE & POS GYMPRO',
      isDefault: false,
      notes: 'Rekening Penampungan Kasir FnB'
    }
  ],
  qrisMerchantName: 'GYMPRO FITNESS & WELLNESS',
  qrisNmid: 'ID1020088991234',
  defaultPaymentDueDays: 14
};

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplateConfig = {
  posReceiptTemplate: `Halo kak *[CUSTOMER_NAME]*, terima kasih telah bertransaksi di *[STORE_NAME]*.
  
Detail Transaksi:
No. Nota: *[INVOICE_NO]*
Waktu: [DATETIME]
Total Bayar: *[AMOUNT]* ([PAYMENT_METHOD])

Struk digital Anda telah terverifikasi. Terima kasih atas kunjungan Anda!
Salam Sehat,
*[STORE_NAME]*`,

  memberWelcomeTemplate: `Selamat bergabung di *[STORE_NAME]*, Kak *[MEMBER_NAME]*! 🎉
  
ID Member Anda: *[MEMBER_ID]*
Paket: *[PACKAGE_NAME]*
Masa Berlaku: s.d. *[EXPIRY_DATE]*

Tunjukkan ID Member ini saat check-in gate. Mari capai target kebugaran Anda bersama kami! 💪`,

  piutangReminderTemplate: `Pengingat Tagihan GymPro Fitness:
Halo Kak *[CUSTOMER_NAME]*,
Ini adalah pengingat pembayaran cicilan transaksi *[INVOICE_NO]*.
Sisa Tagihan: *[REMAINING_AMOUNT]*
Jatuh Tempo: *[DUE_DATE]*

Pembayaran dapat ditransfer ke:
*[BANK_NAME]*: *[ACCOUNT_NUMBER]* (a.n. *[ACCOUNT_HOLDER]*)
Konfirmasi setelah transfer ke nomor WhatsApp ini. Terima kasih!`,

  expiryReminderTemplate: `Halo Kak *[MEMBER_NAME]*,
Masa aktif membership Anda di *[STORE_NAME]* akan berakhir pada *[EXPIRY_DATE]* (tersisa *[DAYS_LEFT]* hari).
Dapatkan promo perpanjangan menarik sebelum masa aktif habis! Hubungi front desk kami untuk informasi paket renewal. 🏋️‍♂️`
};

export const DEFAULT_PIC_PROTECTION: PicProtectionConfig = {
  requirePasswordToChangePic: true,
  picChangePassword: '123',
  allowAdminBypass: true,
  requirePasswordOnTransaction: true,
  requirePasswordOnMemberForm: true,
  requirePasswordOnRenewal: true
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  printer: DEFAULT_PRINTER_CONFIG,
  profile: DEFAULT_GYM_PROFILE,
  paymentAndTax: DEFAULT_PAYMENT_AND_TAX,
  templates: DEFAULT_WHATSAPP_TEMPLATES,
  picProtection: DEFAULT_PIC_PROTECTION,
  updatedAt: new Date().toISOString()
};

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
  LandingPageConfig,
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
  // 1. Overview & Operasional Harian
  { id: 'dashboard', name: 'Dashboard Eksekutif', category: 'Overview', desc: 'Melihat ringkasan omset, grafik kehadiran, dan statistik penting' },
  { id: 'absen', name: 'Absensi Staf & Member', category: 'Overview', desc: 'Pencatatan check-in gate member dan presensi kehadiran staf' },

  // 2. Keanggotaan & Member
  { id: 'front-desk-portal', name: 'Portal Kasir & Front Desk', category: 'Membership', desc: 'Pusat operasional member terpadu, check-in gate, renewal cepat, dan saran asisten pintar' },
  { id: 'guest-pass', name: 'Tiket Visit (Guest Pass)', category: 'Membership', desc: 'Penjualan dan validasi tiket kunjungan harian member tamu' },
  { id: 'membership', name: 'Keanggotaan & Paket', category: 'Membership', desc: 'Pendaftaran member baru, upgrade paket, dan perpanjangan langganan' },
  { id: 'freeze', name: 'Freeze / Cuti Member', category: 'Membership', desc: 'Pengajuan freeze, unfreeze, dan perpanjangan masa berlaku kartu' },
  { id: 'master-data', name: 'Direktori Member 360', category: 'Membership', desc: 'Akses riwayat 360, detail profil, dan kartu digital member' },
  { id: 'bundling', name: 'Bundling & Komisi', category: 'Membership', desc: 'Pengelolaan paket bundling membership + PT serta hitung komisi' },
  { id: 'body-composition', name: 'Komposisi Tubuh & InBody', category: 'Membership', desc: 'Pencatatan & analisis komposisi tubuh, lemak, otot, dan evaluasi fisik member' },
  { id: 'crm', name: 'CRM & Pipeline Leads', category: 'Membership', desc: 'Follow-up prospek calon member, status closing, dan pesan WA' },

  // 3. Personal Trainer & Kelas Studio
  { id: 'leader-pt', name: 'Dashboard Leader PT & Antrian', category: 'Personal Trainer', desc: 'Radar jadwal, antrian penugasan PT, deteksi bentrok, dan evaluasi kinerja pelatih' },
  { id: 'pt-sessions', name: 'Jadwal & Sesi PT', category: 'Personal Trainer', desc: 'Penjadwalan sesi latihan, booking trainer, dan checklist sesi' },
  { id: 'studio-class', name: 'Jadwal & Booking Kelas Studio', category: 'Personal Trainer', desc: 'Manajemen jadwal kelas senam, yoga, spinning, dan kapasitas studio' },
  { id: 'trainer-portal', name: 'Portal Khusus Trainer', category: 'Personal Trainer', desc: 'Area kerja pelatih untuk memantau klien binaan dan sesi' },
  { id: 'pt-package-performance', name: 'Performa Trainer × Paket', category: 'Personal Trainer', desc: 'Analisis produktivitas pelatih dan penjualan paket sesi personal training' },

  // 4. Retail POS & Merchandise
  { id: 'pos', name: 'Kasir POS & Minuman', category: 'Retail / POS', desc: 'Penjualan minuman berenergi, suplemen, merchandise & sewa loker' },
  { id: 'products', name: 'Katalog & Stok Retail', category: 'Retail / POS', desc: 'Input data barang, harga jual, barcode, dan penyesuaian stok' },

  // 5. Fasilitas, Aset & Loker
  { id: 'inventaris', name: 'Inventaris & Servis Alat', category: 'Fasilitas & Aset', desc: 'Pencatatan mesin fitness, jadwal servis berkala & perbaikan' },
  { id: 'lockers', name: 'Manajemen & Sewa Loker', category: 'Fasilitas & Aset', desc: 'Penomoran kunci loker, status sewa member, dan batas waktu peminjaman' },

  // 6. Keuangan & Kas
  { id: 'dashboard-keuangan', name: 'Dashboard Keuangan', category: 'Keuangan', desc: 'Ringkasan performa finansial, arus kas harian, dan ringkasan laba kotor' },
  { id: 'laba-rugi', name: 'Laba Perusahaan (P&L)', category: 'Keuangan', desc: 'Laporan laba rugi komprehensif, pendapatan operasional, dan beban usaha' },
  { id: 'pengeluaran', name: 'Manajemen Biaya & Pengeluaran', category: 'Keuangan', desc: 'Input beban operasional, riwayat pengeluaran, kategori & persetujuan' },
  { id: 'piutang', name: 'Buku Piutang & Cicilan', category: 'Keuangan', desc: 'Pemantauan cicilan member, jatuh tempo, dan pembayaran bertahap' },
  { id: 'laporan', name: 'Buku Besar & Void Transaksi', category: 'Keuangan', desc: 'Riwayat transaksi keluar-masuk kas, cetak ulang, dan pembatalan void' },
  { id: 'laporan-penjualan', name: 'Laporan Penjualan Harian & Bulanan', category: 'Keuangan', desc: 'Rekapitulasi penjualan shift harian, mingguan, dan laporan bulanan' },
  { id: 'tutup-toko', name: 'Daily Closing Kasir', category: 'Keuangan', desc: 'Rekonsiliasi fisik laci kasir vs sistem dan cetak rekap shift' },

  // 7. SDM & Eksternal
  { id: 'hr-payroll', name: 'HR, Jadwal & Penggajian', category: 'SDM', desc: 'Manajemen karyawan, jadwal shift kerja, slip gaji, dan potongan BPJS' },
  { id: 'google-sheets', name: 'Google Sheets & Drive Sync', category: 'Integrasi', desc: 'Sinkronisasi cloud data member & transaksi ke spreadsheet Google Drive' },

  // 8. Konfigurasi Sistem
  { id: 'settings', name: 'Pengaturan Sistem & Printer', category: 'Konfigurasi', desc: 'Konfigurasi printer thermal, matriks hak akses role, outlet cabang, dan profil HQ' }
];

export const DEFAULT_ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  admin: {
    role: 'admin',
    roleName: 'Super Administrator',
    description: 'Akses penuh tanpa batasan ke seluruh sistem, audit log, keuangan, dan pengaturan lintas cabang & holding pusat.',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      acc[m.id] = { view: true, create: true, edit: true, delete: true, voidRefund: true, export: true };
      return acc;
    }, {} as Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; voidRefund?: boolean; export?: boolean }>)
  },
  admin_cabang: {
    role: 'admin_cabang',
    roleName: 'Admin Unit Cabang',
    description: 'Wewenang penuh untuk memantau, mengelola, dan mengatur operasional di unit cabangnya sendiri (Member, Kasir POS, Absensi, Staf Cabang, Loker, Inventaris, Petty Cash & Laporan Keuangan Unit). Tidak memiliki akses ke unit cabang lain atau konsolidasi holding pusat.',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const isGlobalOnly = m.id === 'google-sheets';
      acc[m.id] = {
        view: true,
        create: !isGlobalOnly,
        edit: !isGlobalOnly,
        delete: m.id !== 'settings',
        voidRefund: true,
        export: true
      };
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
    description: 'Layanan kasir POS, transaksi membership, presensi gate, guest pass, freeze, dan daily closing kas.',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const allowed = [
        'absen',
        'front-desk-portal',
        'guest-pass',
        'membership',
        'freeze',
        'master-data',
        'bundling',
        'body-composition',
        'crm',
        'pos',
        'products',
        'lockers',
        'dashboard-keuangan',
        'laba-rugi',
        'pengeluaran',
        'piutang',
        'laporan',
        'laporan-penjualan',
        'tutup-toko'
      ];
      const canAccess = allowed.includes(m.id);
      acc[m.id] = {
        view: canAccess || m.id === 'inventaris' || m.id === 'studio-class',
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
    description: 'Manajemen pelatih fitness, antrian penugasan PT, radar jadwal bentrok, evaluasi kelas dan performa.',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const allowed = [
        'absen',
        'front-desk-portal',
        'guest-pass',
        'master-data',
        'bundling',
        'body-composition',
        'crm',
        'leader-pt',
        'pt-sessions',
        'studio-class',
        'trainer-portal',
        'pt-package-performance',
        'inventaris',
        'lockers',
        'laporan-penjualan',
        'hr-payroll'
      ];
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
    description: 'Fokus melatih klien, pencatatan log latihan, penyelesaian sesi PT, inbody & evaluasi, dan presensi kerja.',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const allowed = [
        'absen',
        'body-composition',
        'pt-sessions',
        'studio-class',
        'trainer-portal'
      ];
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
    description: 'Pemeriksaan kondisi mesin fitness, servis berkala, checklist alat, perbaikan loker, dan log perawatan.',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    isSystemRole: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      const canAccess = m.id === 'inventaris' || m.id === 'lockers' || m.id === 'absen';
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
  requirePasswordOnRenewal: true,
  requirePasswordOnLeadHandover: true
};

export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  hero: {
    headlineStart: 'TRANSFORMASI TUBUH & ENERGI',
    headlineGradient: 'TANPA BATAS',
    headlineEnd: 'DI RFA GYM',
    subheadline: 'Fasilitas fitness premium standar internasional, bimbingan Personal Trainer bersertifikasi, dan studio class terlengkap di Cibubur & sekitarnya. Wujudkan versi terbaik fisik dan mental Anda bersama komunitas juara.',
    badgeText: 'Pusat Kebugaran Premium & Komunitas Atlet',
    heroImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    heroImageAlt: 'RFA Gym Premium Training Arena',
    hubTag: 'Flagship Hub',
    hubTitle: 'Menara Sudirman Lantai 2',
    hubDesc: 'Peralatan Eleiko, Hammer Strength & LifeFitness',
    hubStatus: 'Open Now',
    primaryCtaText: 'Join Now • Mulai Latihan',
    secondaryCtaText: 'Lihat Program & Jadwal',
    ratingScore: '4.9 / 5.0',
    ratingReviews: '(850+ Ulasan)',
    ratingTagline: 'Gym Favorit Urban Jakarta',
    communityCount: '1,500+ Member',
    communityTagline: 'Komunitas Aktif & Berprestasi',
    highlights: [
      'Free Trial & Konsultasi InBody',
      'Akses 3 Cabang Strategis',
      'Tanpa Kontrak Terikat Panjang'
    ]
  },
  announcement: {
    enabled: true,
    text: 'Promo Spesial Bulan Ini: Dapatkan diskon 25% untuk membership tahunan + Free 2 sesi konsultasi Personal Trainer!',
    highlightText: 'FLASH SALE',
    badgeText: 'HOT PROMO',
    ctaText: 'Daftar Sekarang'
  },
  about: {
    badge: 'Tentang RFA Gym',
    title: 'DEDIKASI KAMI UNTUK PERFORMA TERBAIK ANDA',
    description: 'Berawal dari sebuah studio latihan intensif pada 2018, RFA Gym kini berkembang menjadi ekosistem kebugaran urban terpadu dengan standar fasilitas internasional dan pelatih profesional.',
    storyTitle: 'Mengubah Cara Masyarakat Urban Memandang Kebugaran',
    storyP1: 'Di RFA Gym, kami percaya bahwa kebugaran bukan sekadar mengangkat beban atau membakar kalori. Kebugaran adalah fondasi kepercayaan diri, ketahanan mental menghadapi tekanan hidup, dan energi berkelanjutan untuk meraih impian Anda setiap hari.',
    storyP2: 'Dengan memadukan sains biomekanik, bimbingan nutrisi praktis, dan teknologi manajemen modern berbasis cloud, kami memastikan setiap menit yang Anda investasikan di gym berbuah hasil nyata yang tahan lama.',
    stat1Value: '8+ Tahun',
    stat1Label: 'Eksistensi & Pengalaman',
    stat2Value: '98.4%',
    stat2Label: 'Kepuasan Member & Klien'
  },
  social: {
    whatsapp: '0857-7218-5973',
    instagram: '@rfagym',
    tiktok: '@rfagym_official',
    youtube: 'RFA Gym Indonesia',
    email: 'info@rfagym.com',
    operationalWeekday: '06:00 - 22:00 WIB',
    operationalWeekend: '07:00 - 21:00 WIB'
  },
  galleryItems: [
    {
      id: 'fg-1',
      title: 'Free Weight Zone & Power Racks',
      category: 'gym',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
      description: 'Dumbbell set lengkap 2.5kg hingga 50kg, Olympic Barbell, dan 4 Olympic Squat Racks.'
    },
    {
      id: 'fg-2',
      title: 'Cardio Theater & Curved Treadmill',
      category: 'gym',
      image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=800&auto=format&fit=crop',
      description: 'Treadmill layar sentuh interaktif, stair climber, rowing machine, dan assault air-bike.'
    },
    {
      id: 'fg-3',
      title: 'Mirror Studio Aerobik & Yoga',
      category: 'studio',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
      description: 'Studio berlantai vinyl cushion anti-slip dengan acoustic audio surround dan pencahayaan dinamis.'
    },
    {
      id: 'fg-4',
      title: 'Smart Digital Locker & Warm Shower',
      category: 'recovery',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
      description: 'Locker RFID otomatis berkeamanan tinggi, shower air hangat, hairdryer, dan sabun mandi premium.'
    },
    {
      id: 'fg-5',
      title: 'Recovery Finnish Sauna & Steam Bath',
      category: 'recovery',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
      description: 'Ruang sauna kayu pinus asli untuk relaksasi otot setelah latihan keras dan detoksifikasi tubuh.'
    },
    {
      id: 'fg-6',
      title: 'Protein Bar & Member Lounge Cafe',
      category: 'lounge',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop',
      description: 'Whey protein smoothies segar, kopi cold brew, kursi santai, dan colokan Wi-Fi cepat untuk bekerja.'
    }
  ]
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  printer: DEFAULT_PRINTER_CONFIG,
  profile: DEFAULT_GYM_PROFILE,
  paymentAndTax: DEFAULT_PAYMENT_AND_TAX,
  templates: DEFAULT_WHATSAPP_TEMPLATES,
  picProtection: DEFAULT_PIC_PROTECTION,
  landing: DEFAULT_LANDING_CONFIG,
  updatedAt: new Date().toISOString()
};

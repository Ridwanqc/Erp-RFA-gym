import { ActiveTab } from '../components/Sidebar';

// Map ActiveTab to clean URL pathname
export const TAB_TO_PATH: Record<ActiveTab, string> = {
  'dashboard': '/admin/dashboard',
  'absen': '/admin/absen',
  'quick-out': '/admin/quick-out',
  'front-desk-portal': '/admin/front-desk',
  'front-desk-automation': '/admin/front-desk/automation',
  'guest-pass': '/admin/guest-pass',
  'membership': '/admin/membership',
  'freeze': '/admin/freeze',
  'master-data': '/admin/master-data',
  'bundling-reports': '/admin/bundling',
  'body-composition': '/admin/body-composition',
  'crm': '/admin/crm',
  'smart-crm-billing': '/admin/crm/smart-billing',
  'leader-pt': '/admin/leader-pt',
  'leader-pt-rules': '/admin/leader-pt/rules',
  'jadwal-pt': '/admin/jadwal-pt',
  'studio-class': '/admin/studio-class',
  'trainer-portal': '/admin/trainer-portal',
  'pt-package-performance': '/admin/pt-package-performance',
  'pos': '/admin/pos',
  'products': '/admin/products',
  'inventaris': '/admin/inventaris',
  'lockers': '/admin/lockers',
  'dashboard-keuangan': '/admin/finance',
  'laba-rugi': '/admin/finance/pnl',
  'input-pengeluaran': '/admin/finance/input',
  'riwayat-pengeluaran': '/admin/finance/riwayat',
  'kategori-pengeluaran': '/admin/finance/kategori',
  'persetujuan-pengeluaran': '/admin/finance/persetujuan',
  'laporan-pengeluaran': '/admin/finance/laporan-pengeluaran',
  'piutang': '/admin/finance/piutang',
  'laporan': '/admin/finance/buku-besar',
  'laporan-harian': '/admin/finance/laporan-harian',
  'laporan-bulanan': '/admin/finance/laporan-bulanan',
  'tutup-toko': '/admin/finance/tutup-toko',
  'hr-payroll': '/admin/hr-payroll',
  'google-sheets': '/admin/google-sheets',
  'settings': '/admin/settings',
  'settings-printer': '/admin/settings/printer',
  'settings-landing': '/admin/settings/cms',
  'settings-theme': '/admin/settings/theme',
  'settings-roles': '/admin/settings/roles',
  'settings-security': '/admin/settings/security',
  'settings-branches': '/admin/settings/branches',
  'settings-profile': '/admin/settings/profile',
  'settings-finance': '/admin/settings/finance',
  'settings-backup': '/admin/settings/backup'
};

// Aliases for path parsing (supporting various English / Indonesian URL styles)
export const PATH_TO_TAB: Record<string, ActiveTab> = {
  '/admin/dashboard': 'dashboard',
  '/admin': 'dashboard',
  '/dashboard': 'dashboard',

  '/admin/absen': 'absen',
  '/admin/attendance': 'absen',
  '/admin/presensi': 'absen',

  '/admin/quick-out': 'quick-out',
  '/admin/out': 'quick-out',

  '/admin/front-desk': 'front-desk-portal',
  '/admin/front-desk-portal': 'front-desk-portal',
  '/admin/front-desk/automation': 'front-desk-automation',
  '/admin/automation': 'front-desk-automation',
  '/admin/kiosk': 'front-desk-automation',
  '/admin/guest-pass': 'guest-pass',
  '/admin/membership': 'membership',
  '/admin/keanggotaan': 'membership',
  '/admin/freeze': 'freeze',
  '/admin/master-data': 'master-data',
  '/admin/members': 'master-data',
  '/admin/bundling': 'bundling-reports',
  '/admin/bundling-reports': 'bundling-reports',
  '/admin/body-composition': 'body-composition',
  '/admin/inbody': 'body-composition',
  '/admin/crm': 'crm',
  '/admin/leads': 'crm',
  '/admin/crm/smart-billing': 'smart-crm-billing',
  '/admin/churn': 'smart-crm-billing',
  '/admin/recurring': 'smart-crm-billing',

  '/admin/leader-pt': 'leader-pt',
  '/admin/pt-leader': 'leader-pt',
  '/admin/leader-pt/rules': 'leader-pt-rules',
  '/admin/pt-rules': 'leader-pt-rules',
  '/admin/jadwal-pt': 'jadwal-pt',
  '/admin/pt-schedule': 'jadwal-pt',
  '/admin/studio-class': 'studio-class',
  '/admin/studio-classes': 'studio-class',
  '/admin/trainer-portal': 'trainer-portal',
  '/admin/pt-package-performance': 'pt-package-performance',
  '/admin/pt-performance': 'pt-package-performance',

  '/admin/pos': 'pos',
  '/admin/kasir': 'pos',
  '/admin/products': 'products',
  '/admin/inventaris': 'inventaris',
  '/admin/inventory': 'inventaris',
  '/admin/lockers': 'lockers',
  '/admin/loker': 'lockers',

  '/admin/finance': 'dashboard-keuangan',
  '/admin/finance/dashboard': 'dashboard-keuangan',
  '/admin/finance/pnl': 'laba-rugi',
  '/admin/finance/laba-rugi': 'laba-rugi',
  '/admin/finance/input': 'input-pengeluaran',
  '/admin/finance/expense-input': 'input-pengeluaran',
  '/admin/finance/riwayat': 'riwayat-pengeluaran',
  '/admin/finance/expense-history': 'riwayat-pengeluaran',
  '/admin/finance/kategori': 'kategori-pengeluaran',
  '/admin/finance/expense-categories': 'kategori-pengeluaran',
  '/admin/finance/persetujuan': 'persetujuan-pengeluaran',
  '/admin/finance/expense-approval': 'persetujuan-pengeluaran',
  '/admin/finance/laporan-pengeluaran': 'laporan-pengeluaran',
  '/admin/finance/expense-reports': 'laporan-pengeluaran',
  '/admin/finance/piutang': 'piutang',
  '/admin/finance/receivables': 'piutang',
  '/admin/finance/buku-besar': 'laporan',
  '/admin/finance/ledger': 'laporan',
  '/admin/finance/laporan-harian': 'laporan-harian',
  '/admin/finance/daily-sales': 'laporan-harian',
  '/admin/finance/laporan-bulanan': 'laporan-bulanan',
  '/admin/finance/monthly-sales': 'laporan-bulanan',
  '/admin/finance/tutup-toko': 'tutup-toko',
  '/admin/finance/closing': 'tutup-toko',

  '/admin/hr-payroll': 'hr-payroll',
  '/admin/hr': 'hr-payroll',
  '/admin/google-sheets': 'google-sheets',

  '/admin/settings': 'settings',
  '/admin/settings/printer': 'settings-printer',
  '/admin/settings/cms': 'settings-landing',
  '/admin/settings/landing': 'settings-landing',
  '/admin/settings/theme': 'settings-theme',
  '/admin/settings/roles': 'settings-roles',
  '/admin/settings/security': 'settings-security',
  '/admin/settings/branches': 'settings-branches',
  '/admin/settings/profile': 'settings-profile',
  '/admin/settings/finance': 'settings-finance',
  '/admin/settings/backup': 'settings-backup'
};

export const TAB_PAGE_TITLES: Record<ActiveTab, string> = {
  'dashboard': 'Dashboard Admin',
  'absen': 'Absensi & Presensi',
  'quick-out': 'Quick OUT Member',
  'front-desk-portal': 'Portal Kasir & Front Desk',
  'front-desk-automation': 'Otomasi & Kios Front Desk',
  'guest-pass': 'Tiket Visit (Guest Pass)',
  'membership': 'Keanggotaan & Paket Membership',
  'freeze': 'Freeze & Cuti Member',
  'master-data': 'Direktori Member 360',
  'bundling-reports': 'Paket Bundling & Komisi',
  'body-composition': 'Komposisi Tubuh & InBody',
  'crm': 'CRM & Leads Kanban',
  'smart-crm-billing': 'Smart CRM & Recurring Billing',
  'leader-pt': 'PT Management (Antrian Trainer)',
  'leader-pt-rules': 'Aturan Kerja & Jam Jadwal Pelatih',
  'jadwal-pt': 'Jadwal & Sesi Personal Trainer',
  'studio-class': 'Jadwal & Booking Kelas Studio',
  'trainer-portal': 'Portal Fokus Trainer',
  'pt-package-performance': 'Performa Trainer × Paket',
  'pos': 'Kasir POS FnB & Retail',
  'products': 'Katalog Produk & Stok Inventaris',
  'inventaris': 'Inventaris & Servis Alat Gym',
  'lockers': 'Manajemen & Input Loker',
  'dashboard-keuangan': 'Dashboard Keuangan',
  'laba-rugi': 'Laporan Laba Perusahaan (P&L)',
  'input-pengeluaran': 'Input Beban Pengeluaran',
  'riwayat-pengeluaran': 'Riwayat Pengeluaran Operasional',
  'kategori-pengeluaran': 'Kategori Beban Pengeluaran',
  'persetujuan-pengeluaran': 'Persetujuan Approval Pengeluaran',
  'laporan-pengeluaran': 'Laporan Rekapitulasi Pengeluaran',
  'piutang': 'Buku Piutang & Cicilan Member',
  'laporan': 'Buku Besar Transaksi Kas',
  'laporan-harian': 'Laporan Penjualan Harian',
  'laporan-bulanan': 'Laporan Penjualan Bulanan',
  'tutup-toko': 'Daily Closing Kas Toko',
  'hr-payroll': 'HR, Jadwal & Presensi Karyawan',
  'google-sheets': 'Integrasi Google Sheets & Drive',
  'settings': 'Pengaturan Sistem & Konfigurasi',
  'settings-printer': 'Pengaturan Printer & Struk POS',
  'settings-landing': 'Pengaturan Landing Page (CMS)',
  'settings-theme': 'Pengaturan Tema & Tampilan',
  'settings-roles': 'Manajemen Role & Hak Akses (RBAC)',
  'settings-security': 'Keamanan & Password Otorisasi PIC',
  'settings-branches': 'Kelola Unit Cabang & Outlet',
  'settings-profile': 'Profil Usaha & Identitas Bisnis',
  'settings-finance': 'Pajak & Rekening Kas Bank',
  'settings-backup': 'Backup & Pemulihan Database'
};

export function getRouteFromLocation(): {
  viewMode?: 'erp' | 'landing' | 'staff-login';
  tab?: ActiveTab;
} {
  if (typeof window === 'undefined') return { viewMode: 'erp', tab: 'dashboard' };

  const hash = window.location.hash.replace(/^#/, '');
  const pathname = hash.startsWith('/') ? hash : window.location.pathname;

  if (pathname === '/login') {
    return { viewMode: 'staff-login' };
  }
  if (pathname === '/' || pathname === '/landing') {
    return { viewMode: 'landing' };
  }

  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (PATH_TO_TAB[cleanPath]) {
    return { viewMode: 'erp', tab: PATH_TO_TAB[cleanPath] };
  }

  for (const [pathKey, tabVal] of Object.entries(PATH_TO_TAB)) {
    if (cleanPath === pathKey) {
      return { viewMode: 'erp', tab: tabVal };
    }
  }

  // If path starts with /admin, default to dashboard
  if (cleanPath.startsWith('/admin')) {
    return { viewMode: 'erp', tab: 'dashboard' };
  }

  return {};
}

export function navigateToTab(tab: ActiveTab, replace = false) {
  if (typeof window === 'undefined') return;
  const targetPath = TAB_TO_PATH[tab] || '/admin/dashboard';
  const currentPath = window.location.pathname;

  if (currentPath !== targetPath) {
    if (replace) {
      window.history.replaceState({ tab }, '', targetPath);
    } else {
      window.history.pushState({ tab }, '', targetPath);
    }
  }

  const title = TAB_PAGE_TITLES[tab] || 'RFA Gym ERP';
  document.title = `${title} | RFA Gym Enterprise`;
}

export function navigateToPage(view: 'landing' | 'staff-login' | 'erp', tab?: ActiveTab, replace = false) {
  if (typeof window === 'undefined') return;
  let targetPath = '/';
  let title = 'RFA Gym ERP';

  if (view === 'staff-login') {
    targetPath = '/login';
    title = 'Login Staff & Karyawan | RFA Gym';
  } else if (view === 'landing') {
    targetPath = '/';
    title = 'RFA Gym Enterprise Platform';
  } else if (tab) {
    targetPath = TAB_TO_PATH[tab] || '/admin/dashboard';
    title = `${TAB_PAGE_TITLES[tab] || 'Dashboard'} | RFA Gym Enterprise`;
  }

  if (window.location.pathname !== targetPath) {
    if (replace) {
      window.history.replaceState({ view, tab }, '', targetPath);
    } else {
      window.history.pushState({ view, tab }, '', targetPath);
    }
  }

  document.title = title;
}

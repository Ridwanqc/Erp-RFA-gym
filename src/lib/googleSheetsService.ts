/**
 * Google Sheets & Google Drive API Service for GymPro ERP
 * Client-side integration using access token obtained via Firebase Google Auth
 */

import { Member, Transaction, Product, Schedule, User as AppUser, CompanyExpense, Attendance, PackageItem } from '../types';

export interface ExportDataPayload {
  title?: string;
  transactions?: Transaction[];
  members?: Member[];
  products?: Product[];
  schedules?: Schedule[];
  staffUsers?: AppUser[];
  expenses?: CompanyExpense[];
  attendances?: Attendance[];
  packages?: PackageItem[];
}

export interface GoogleSpreadsheetItem {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime?: string;
}

/**
 * Lists user's Google Sheets from Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<GoogleSpreadsheetItem[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,webViewLink,modifiedTime)`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengambil daftar spreadsheet (${response.status})`);
  }

  const data = await response.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
    modifiedTime: f.modifiedTime
  }));
}

export const GYM_REQUIRED_SHEET_TABS = [
  'Ringkasan & Transaksi',
  'Database Member',
  'Staf & Karyawan',
  'Jadwal Sesi PT',
  'Pengeluaran & Beban',
  'Katalog & Stok Produk',
  'Presensi Kunjungan',
  'Katalog Master Paket'
];

/**
 * Creates a brand new multi-tab GymPro ERP Spreadsheet in Google Drive
 */
export async function createGymSpreadsheet(
  accessToken: string,
  payload: ExportDataPayload
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const sheetTitle = payload.title || `GymPro ERP Database - ${dateStr}`;

  // 1. Create spreadsheet with all 8 dedicated system sheets
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const requestBody = {
    properties: {
      title: sheetTitle
    },
    sheets: GYM_REQUIRED_SHEET_TABS.map((title) => ({
      properties: {
        title,
        gridProperties: { frozenRowCount: 1 }
      }
    }))
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat Google Spreadsheet baru (${createRes.status})`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare tabular data for each tab
  // Tab 1: Transaksi POS
  const trxHeader = [
    'ID Transaksi',
    'Tanggal',
    'Waktu',
    'Pelanggan / Member',
    'Tipe Transaksi',
    'Deskripsi Pembelian',
    'Total (Rp)',
    'Metode Pembayaran',
    'Status Pembayaran',
    'Kasir / Staf',
    'Cabang'
  ];
  const trxRows = (payload.transactions || []).map((t) => [
    t.id,
    t.date,
    t.time,
    t.customer,
    t.type,
    t.desc,
    t.amount,
    t.method,
    t.status,
    t.cashier || '-',
    t.branchName || t.branchId || 'Cabang Utama'
  ]);

  // Tab 2: Members
  const memberHeader = [
    'ID Member',
    'Nama Lengkap',
    'No Telepon / WhatsApp',
    'Tipe Membership',
    'Tanggal Bergabung',
    'Tanggal Kadaluarsa',
    'Status',
    'Sisa Kuota Sesi PT',
    'Sisa Kuota Kelas',
    'PIC Penanggung Jawab',
    'No Identitas (KTP/SIM)',
    'Cabang Asal'
  ];
  const memberRows = (payload.members || []).map((m) => [
    m.id,
    m.name,
    m.phone,
    m.membershipType || 'MEMBER',
    m.joinDate || '-',
    m.expired,
    m.status || 'AKTIF',
    m.ptQuota || 0,
    m.classQuota || 0,
    m.picName || '-',
    m.idNumber || '-',
    m.branchName || m.branchId || 'Cabang Utama'
  ]);

  // Tab 3: Staf & Karyawan
  const staffHeader = [
    'ID Staf',
    'Nama Lengkap',
    'ID Login (Akun)',
    'Role Sistem',
    'Nama Jabatan',
    'Divisi',
    'Cabang',
    'Shift Kerja',
    'Gaji Pokok (Rp)',
    'No Telepon',
    'No KTP / Identitas'
  ];
  const staffRows = (payload.staffUsers || []).map((s) => [
    s.id,
    s.name,
    s.accId || '-',
    s.role,
    s.roleName || '-',
    s.division || '-',
    s.branchName || s.branchId || 'Cabang Utama',
    s.shift || '-',
    s.baseSalary || 0,
    s.phone || '-',
    s.idNumber || '-'
  ]);

  // Tab 4: Jadwal Sesi PT
  const schHeader = [
    'ID Sesi',
    'Tanggal Sesi',
    'Waktu Sesi',
    'Nama Member',
    'Personal Trainer',
    'Status Sesi',
    'Validasi Staf',
    'Validasi PT',
    'Validasi Member'
  ];
  const schRows = (payload.schedules || []).map((s) => [
    s.id,
    s.date,
    s.time,
    s.memberName,
    s.trainer,
    s.status,
    s.valStaf ? 'VALID (TTD)' : 'BELUM',
    s.valTrainer ? 'VALID (TTD)' : 'BELUM',
    s.valMember ? 'VALID (TTD)' : 'BELUM'
  ]);

  // Tab 5: Pengeluaran & Beban
  const expHeader = [
    'No. Pengeluaran',
    'Tanggal',
    'Kategori',
    'Subkategori',
    'Nama Pengeluaran',
    'Deskripsi Rinci',
    'Jumlah (Rp)',
    'Metode Bayar',
    'Sumber Rekening',
    'Penerima / Vendor',
    'PIC Pengaju',
    'Status Approval',
    'Status Pembayaran',
    'Cabang'
  ];
  const expRows = (payload.expenses || []).map((e) => [
    e.expenseNumber || e.id,
    e.date,
    e.categoryName,
    e.subcategory,
    e.name,
    e.description,
    e.amount,
    e.paymentMethod,
    e.sourceAccount,
    e.vendorOrBeneficiary,
    e.picStaffName,
    e.approvalStatus,
    e.paymentStatus,
    e.branchName || e.branchId || 'Cabang Utama'
  ]);

  // Tab 6: Produk
  const prodHeader = [
    'ID Produk',
    'Kategori',
    'Nama Produk',
    'Harga Modal (Rp)',
    'Harga Jual (Rp)',
    'Stok Saat Ini'
  ];
  const prodRows = (payload.products || []).map((p) => [
    p.id,
    p.cat,
    p.name,
    p.cost,
    p.price,
    p.stock
  ]);

  // Tab 7: Presensi Kunjungan
  const attHeader = [
    'ID Presensi',
    'Tanggal',
    'Waktu Masuk',
    'ID Member',
    'Nama Member',
    'Status Akses',
    'Nomor Loker',
    'Pinjam Handuk',
    'Staf / Kasir Gerbang'
  ];
  const attRows = (payload.attendances || []).map((a) => [
    a.id,
    a.date,
    a.timeIn,
    a.memberId || '-',
    a.memberName,
    (a as any).isExpired ? 'EXPIRED' : (a.badge || 'AKTIF'),
    a.lockerNumber || '-',
    a.hasTowel ? 'YA' : 'TIDAK',
    (a as any).staffName || a.branchName || '-'
  ]);

  // Tab 8: Katalog Master Paket
  const pkgHeader = [
    'ID Paket',
    'Kategori Paket',
    'Tipe Paket',
    'Nama Paket',
    'Harga (Rp)',
    'Nilai / Durasi',
    'Masa Aktif (Hari)',
    'Komisi Sales Rate/Nominal',
    'Komisi Trainer Rate/Nominal'
  ];
  const pkgRows = (payload.packages || []).map((p) => [
    p.id,
    p.cat,
    p.type,
    p.name,
    p.price,
    p.value,
    p.validityDays,
    p.salesCommissionNominal ? `Rp ${p.salesCommissionNominal}` : `${p.salesCommissionRate || 0}%`,
    p.trainerCommissionNominal ? `Rp ${p.trainerCommissionNominal}` : `${p.trainerCommissionRate || 0}%`
  ]);

  // 3. Batch Update Values to populate each sheet
  const valueData = [
    {
      range: "'Ringkasan & Transaksi'!A1",
      values: [trxHeader, ...trxRows]
    },
    {
      range: "'Database Member'!A1",
      values: [memberHeader, ...memberRows]
    },
    {
      range: "'Staf & Karyawan'!A1",
      values: [staffHeader, ...staffRows]
    },
    {
      range: "'Jadwal Sesi PT'!A1",
      values: [schHeader, ...schRows]
    },
    {
      range: "'Pengeluaran & Beban'!A1",
      values: [expHeader, ...expRows]
    },
    {
      range: "'Katalog & Stok Produk'!A1",
      values: [prodHeader, ...prodRows]
    },
    {
      range: "'Presensi Kunjungan'!A1",
      values: [attHeader, ...attRows]
    },
    {
      range: "'Katalog Master Paket'!A1",
      values: [pkgHeader, ...pkgRows]
    }
  ];

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const updateRes = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueData
    })
  });

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menulis data ke spreadsheet (${updateRes.status})`);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Read specific range from Google Spreadsheet
 */
export async function readSpreadsheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membaca Google Sheets (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Append new rows to an existing sheet tab
 */
export async function appendSpreadsheetRows(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rows: any[][]
): Promise<number> {
  const encodedRange = encodeURIComponent(`'${sheetName}'!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menambah baris ke Google Sheets (${res.status})`);
  }

  const data = await res.json();
  return data.updates?.updatedRows || rows.length;
}

/**
 * Overwrite specific sheet tab with fresh data (requires explicit user confirmation dialog beforehand)
 */
export async function syncOverwriteSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  headerRow: string[],
  dataRows: any[][]
): Promise<void> {
  // Clear sheet first
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A:Z:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  // Write new rows
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1?valueInputOption=USER_ENTERED`;
  const writeRes = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [headerRow, ...dataRows]
    })
  });

  if (!writeRes.ok) {
    const err = await writeRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menyinkronkan data ke sheet (${writeRes.status})`);
  }
}

/**
 * Ensures all required gym tabs exist in the target spreadsheet.
 * If any tab is missing, creates it with a frozen header row.
 */
export async function ensureGymSheetsExist(
  accessToken: string,
  spreadsheetId: string
): Promise<string[]> {
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const getRes = await fetch(getUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!getRes.ok) {
    const err = await getRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal memeriksa tab spreadsheet (${getRes.status})`);
  }

  const meta = await getRes.json();
  const existingSheets = new Set<string>(
    (meta.sheets || []).map((s: any) => s.properties?.title)
  );

  const missingSheets = GYM_REQUIRED_SHEET_TABS.filter((title) => !existingSheets.has(title));

  if (missingSheets.length > 0) {
    const batchRequests = missingSheets.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    }));

    const addUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const addRes = await fetch(addUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests: batchRequests })
    });

    if (!addRes.ok) {
      const err = await addRes.json().catch(() => ({}));
      console.warn('Could not auto-add missing sheet tabs:', err);
    }
  }

  return GYM_REQUIRED_SHEET_TABS;
}

/**
 * Synchronizes all gym data (Members, Transactions, Staff, Schedules, Expenses, Products, Attendance, Packages)
 * to Google Sheets in a single coordinated operation.
 * Clears old rows so deleted records in the app are automatically removed from Google Sheets as well.
 */
export async function syncAllGymDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  payload: ExportDataPayload
): Promise<{
  success: boolean;
  spreadsheetUrl: string;
  counts: {
    members: number;
    transactions: number;
    staff: number;
    schedules: number;
    expenses: number;
    products: number;
    attendances: number;
    packages: number;
  };
  timestamp: string;
}> {
  // 1. Ensure sheet tabs exist
  await ensureGymSheetsExist(accessToken, spreadsheetId);

  // 2. Prepare headers & rows for all 8 modules
  // Tab 1: Ringkasan & Transaksi
  const trxHeader = [
    'ID Transaksi',
    'Tanggal',
    'Waktu',
    'Pelanggan / Member',
    'Tipe Transaksi',
    'Deskripsi Pembelian',
    'Total (Rp)',
    'Metode Pembayaran',
    'Status Pembayaran',
    'Kasir / Staf',
    'Cabang'
  ];
  const trxRows = (payload.transactions || []).map((t) => [
    t.id,
    t.date,
    t.time,
    t.customer,
    t.type,
    t.desc,
    t.amount,
    t.method,
    t.status,
    t.cashier || '-',
    t.branchName || t.branchId || 'Cabang Utama'
  ]);

  // Tab 2: Database Member
  const memberHeader = [
    'ID Member',
    'Nama Lengkap',
    'No Telepon / WhatsApp',
    'Tipe Membership',
    'Tanggal Bergabung',
    'Tanggal Kadaluarsa',
    'Status',
    'Sisa Kuota Sesi PT',
    'Sisa Kuota Kelas',
    'PIC Penanggung Jawab',
    'No Identitas (KTP/SIM)',
    'Cabang Asal'
  ];
  const memberRows = (payload.members || []).map((m) => [
    m.id,
    m.name,
    m.phone,
    m.membershipType || 'MEMBER',
    m.joinDate || '-',
    m.expired,
    m.status || 'AKTIF',
    m.ptQuota || 0,
    m.classQuota || 0,
    m.picName || '-',
    m.idNumber || '-',
    m.branchName || m.branchId || 'Cabang Utama'
  ]);

  // Tab 3: Staf & Karyawan
  const staffHeader = [
    'ID Staf',
    'Nama Lengkap',
    'ID Login (Akun)',
    'Role Sistem',
    'Nama Jabatan',
    'Divisi',
    'Cabang',
    'Shift Kerja',
    'Gaji Pokok (Rp)',
    'No Telepon',
    'No KTP / Identitas'
  ];
  const staffRows = (payload.staffUsers || []).map((s) => [
    s.id,
    s.name,
    s.accId || '-',
    s.role,
    s.roleName || '-',
    s.division || '-',
    s.branchName || s.branchId || 'Cabang Utama',
    s.shift || '-',
    s.baseSalary || 0,
    s.phone || '-',
    s.idNumber || '-'
  ]);

  // Tab 4: Jadwal Sesi PT
  const schHeader = [
    'ID Sesi',
    'Tanggal Sesi',
    'Waktu Sesi',
    'Nama Member',
    'Personal Trainer',
    'Status Sesi',
    'Validasi Staf',
    'Validasi PT',
    'Validasi Member'
  ];
  const schRows = (payload.schedules || []).map((s) => [
    s.id,
    s.date,
    s.time,
    s.memberName,
    s.trainer,
    s.status,
    s.valStaf ? 'VALID (TTD)' : 'BELUM',
    s.valTrainer ? 'VALID (TTD)' : 'BELUM',
    s.valMember ? 'VALID (TTD)' : 'BELUM'
  ]);

  // Tab 5: Pengeluaran & Beban
  const expHeader = [
    'No. Pengeluaran',
    'Tanggal',
    'Kategori',
    'Subkategori',
    'Nama Pengeluaran',
    'Deskripsi Rinci',
    'Jumlah (Rp)',
    'Metode Bayar',
    'Sumber Rekening',
    'Penerima / Vendor',
    'PIC Pengaju',
    'Status Approval',
    'Status Pembayaran',
    'Cabang'
  ];
  const expRows = (payload.expenses || []).map((e) => [
    e.expenseNumber || e.id,
    e.date,
    e.categoryName,
    e.subcategory,
    e.name,
    e.description,
    e.amount,
    e.paymentMethod,
    e.sourceAccount,
    e.vendorOrBeneficiary,
    e.picStaffName,
    e.approvalStatus,
    e.paymentStatus,
    e.branchName || e.branchId || 'Cabang Utama'
  ]);

  // Tab 6: Katalog & Stok Produk
  const prodHeader = [
    'ID Produk',
    'Kategori',
    'Nama Produk',
    'Harga Modal (Rp)',
    'Harga Jual (Rp)',
    'Stok Saat Ini'
  ];
  const prodRows = (payload.products || []).map((p) => [
    p.id,
    p.cat,
    p.name,
    p.cost,
    p.price,
    p.stock
  ]);

  // Tab 7: Presensi Kunjungan
  const attHeader = [
    'ID Presensi',
    'Tanggal',
    'Waktu Masuk',
    'ID Member',
    'Nama Member',
    'Status Akses',
    'Nomor Loker',
    'Pinjam Handuk',
    'Staf / Kasir Gerbang'
  ];
  const attRows = (payload.attendances || []).map((a) => [
    a.id,
    a.date,
    a.timeIn,
    a.memberId || '-',
    a.memberName,
    (a as any).isExpired ? 'EXPIRED' : (a.badge || 'AKTIF'),
    a.lockerNumber || '-',
    a.hasTowel ? 'YA' : 'TIDAK',
    (a as any).staffName || a.branchName || '-'
  ]);

  // Tab 8: Katalog Master Paket
  const pkgHeader = [
    'ID Paket',
    'Kategori Paket',
    'Tipe Paket',
    'Nama Paket',
    'Harga (Rp)',
    'Nilai / Durasi',
    'Masa Aktif (Hari)',
    'Komisi Sales Rate/Nominal',
    'Komisi Trainer Rate/Nominal'
  ];
  const pkgRows = (payload.packages || []).map((p) => [
    p.id,
    p.cat,
    p.type,
    p.name,
    p.price,
    p.value,
    p.validityDays,
    p.salesCommissionNominal ? `Rp ${p.salesCommissionNominal}` : `${p.salesCommissionRate || 0}%`,
    p.trainerCommissionNominal ? `Rp ${p.trainerCommissionNominal}` : `${p.trainerCommissionRate || 0}%`
  ]);

  // 3. Clear existing content on all 8 tabs to maintain clean state
  const clearRanges = GYM_REQUIRED_SHEET_TABS.map((tab) => `'${tab}'!A:Z`);
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`;
  try {
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ranges: clearRanges })
    });
  } catch (clearErr) {
    console.warn('Batch clear warning:', clearErr);
  }

  // 4. Batch update with all latest data
  const valueData = [
    {
      range: "'Ringkasan & Transaksi'!A1",
      values: [trxHeader, ...trxRows]
    },
    {
      range: "'Database Member'!A1",
      values: [memberHeader, ...memberRows]
    },
    {
      range: "'Staf & Karyawan'!A1",
      values: [staffHeader, ...staffRows]
    },
    {
      range: "'Jadwal Sesi PT'!A1",
      values: [schHeader, ...schRows]
    },
    {
      range: "'Pengeluaran & Beban'!A1",
      values: [expHeader, ...expRows]
    },
    {
      range: "'Katalog & Stok Produk'!A1",
      values: [prodHeader, ...prodRows]
    },
    {
      range: "'Presensi Kunjungan'!A1",
      values: [attHeader, ...attRows]
    },
    {
      range: "'Katalog Master Paket'!A1",
      values: [pkgHeader, ...pkgRows]
    }
  ];

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const updateRes = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueData
    })
  });

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menyinkronkan data ke Google Sheets (${updateRes.status})`);
  }

  const timestamp = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return {
    success: true,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    counts: {
      members: memberRows.length,
      transactions: trxRows.length,
      staff: staffRows.length,
      schedules: schRows.length,
      expenses: expRows.length,
      products: prodRows.length,
      attendances: attRows.length,
      packages: pkgRows.length
    },
    timestamp
  };
}

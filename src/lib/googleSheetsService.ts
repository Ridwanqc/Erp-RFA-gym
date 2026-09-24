/**
 * Google Sheets & Google Drive API Service for GymPro ERP
 * Client-side integration using access token obtained via Firebase Google Auth
 */

import { Member, Transaction, Product, Schedule } from '../types';

export interface ExportDataPayload {
  title?: string;
  transactions?: Transaction[];
  members?: Member[];
  products?: Product[];
  schedules?: Schedule[];
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

  // 1. Create spreadsheet with 4 dedicated sheets
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const requestBody = {
    properties: {
      title: sheetTitle
    },
    sheets: [
      { properties: { title: 'Ringkasan & Transaksi', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Database Member', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Jadwal Sesi PT', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Katalog & Stok Produk', gridProperties: { frozenRowCount: 1 } } }
    ]
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
    'Kasir / Staf'
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
    t.cashier || '-'
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
    'No Identitas (KTP/SIM)'
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
    m.idNumber || '-'
  ]);

  // Tab 3: Jadwal Sesi PT
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

  // Tab 4: Produk
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
      range: "'Jadwal Sesi PT'!A1",
      values: [schHeader, ...schRows]
    },
    {
      range: "'Katalog & Stok Produk'!A1",
      values: [prodHeader, ...prodRows]
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
    const updateErr = await updateRes.json().catch(() => ({}));
    console.warn('Batch update values warning:', updateErr);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Reads data from a specific sheet range in Google Sheets
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

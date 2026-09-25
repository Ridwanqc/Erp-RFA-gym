import * as XLSX from 'xlsx';
import { Member, User, UserRole, MembershipStatus } from '../types';
import { APP_TODAY } from './formatters';

// Helper to trigger file download in browser
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

// ==========================================
// EXPORT MEMBERS
// ==========================================
export function exportMembers(members: Member[], format: 'xlsx' | 'csv' = 'xlsx', customFilename?: string) {
  const dateStr = APP_TODAY;
  const filename = customFilename || `Data_Member_GymPro_${dateStr}.${format}`;

  // Format data for export
  const exportRows = members.map((m, idx) => ({
    'No': idx + 1,
    'ID Member': m.id,
    'Nama Lengkap': m.name,
    'No WhatsApp / Telepon': m.phone || '',
    'Status Keanggotaan': m.isFrozen ? 'FREEZE' : m.status || (new Date(m.expired) >= new Date(APP_TODAY) ? 'AKTIF' : 'EXPIRED'),
    'Tanggal Expired': m.expired,
    'Sisa Kuota PT (Sesi)': m.ptQuota || 0,
    'PIC Penanggung Jawab (ID)': m.picId || '',
    'PIC Penanggung Jawab (Nama)': m.picName || '',
    'Tipe Member': m.membershipType || 'MEMBER',
    'Jenis Kelamin': m.gender === 'P' ? 'Perempuan' : 'Laki-laki',
    'Tanggal Bergabung': m.joinDate || '',
    'Jenis Identitas': m.idType || 'KTP',
    'Nomor Identitas (NIK)': m.idNumber || '',
    'Tanggal Lahir': m.birthDate || '',
    'Alamat Domisili': m.address || '',
    'Kontak Darurat': m.emergencyContact || '',
    'Catatan / Notes': m.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Set column widths for readable Excel layout
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // ID Member
    { wch: 24 }, // Nama Lengkap
    { wch: 18 }, // No WhatsApp
    { wch: 16 }, // Status
    { wch: 14 }, // Tanggal Expired
    { wch: 14 }, // Sisa Kuota PT
    { wch: 12 }, // PIC ID
    { wch: 20 }, // PIC Nama
    { wch: 12 }, // Tipe Member
    { wch: 14 }, // Gender
    { wch: 14 }, // Join Date
    { wch: 14 }, // Jenis ID
    { wch: 20 }, // No ID
    { wch: 14 }, // Tanggal Lahir
    { wch: 30 }, // Alamat
    { wch: 20 }, // Kontak Darurat
    { wch: 25 }, // Catatan
  ];

  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Member');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerDownload(blob, filename);
  } else {
    const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  }
}

// ==========================================
// EXPORT STAFF / KARYAWAN
// ==========================================
export function exportStaff(staffList: User[], format: 'xlsx' | 'csv' = 'xlsx', customFilename?: string) {
  const dateStr = APP_TODAY;
  const filename = customFilename || `Data_Karyawan_GymPro_${dateStr}.${format}`;

  const exportRows = staffList.map((s, idx) => ({
    'No': idx + 1,
    'ID Karyawan': s.id,
    'Username Akun': s.accId || '',
    'Nama Karyawan': s.name,
    'Role Sistem': s.role,
    'Nama Jabatan / Posisi': s.roleName,
    'Shift Kerja': s.shift || 'Pagi',
    'Status Kepegawaian': s.employmentStatus || 'Tetap',
    'Gaji Pokok (Rp)': s.baseSalary || 0,
    'Tunjangan (Rp)': s.allowance || 0,
    'No WhatsApp / HP': s.phone || '',
    'Email': s.email || '',
    'Jenis Kelamin': s.gender === 'P' ? 'Perempuan' : 'Laki-laki',
    'Tanggal Bergabung': s.joinDate || '',
    'Sisa Kuota Cuti (Hari)': s.leaveQuota ?? 12,
    'Nama Bank': s.bankName || 'BCA',
    'Nomor Rekening': s.bankAccount || '',
    'Jenis Identitas': s.idType || 'KTP',
    'Nomor Identitas (NIK)': s.idNumber || '',
    'Tanggal Lahir': s.birthDate || '',
    'Alamat': s.address || '',
    'Kontak Darurat': s.emergencyContact || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // ID Karyawan
    { wch: 16 }, // Username
    { wch: 24 }, // Nama Karyawan
    { wch: 14 }, // Role
    { wch: 22 }, // Jabatan
    { wch: 12 }, // Shift
    { wch: 16 }, // Status Kepegawaian
    { wch: 16 }, // Gaji Pokok
    { wch: 14 }, // Tunjangan
    { wch: 18 }, // No HP
    { wch: 22 }, // Email
    { wch: 14 }, // Gender
    { wch: 14 }, // Join Date
    { wch: 14 }, // Kuota Cuti
    { wch: 12 }, // Nama Bank
    { wch: 18 }, // No Rekening
    { wch: 14 }, // Jenis ID
    { wch: 20 }, // No Identitas
    { wch: 14 }, // Tanggal Lahir
    { wch: 30 }, // Alamat
    { wch: 20 }, // Kontak Darurat
  ];

  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Karyawan');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerDownload(blob, filename);
  } else {
    const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  }
}

// ==========================================
// DOWNLOAD TEMPLATES
// ==========================================
export function downloadMemberTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleRows = [
    {
      'ID Member': 'M101',
      'Nama Lengkap': 'Budi Pratama',
      'No WhatsApp / Telepon': '081234567890',
      'Tanggal Expired': '2026-12-31',
      'Sisa Kuota PT': 10,
      'PIC ID': 'S01',
      'PIC Nama': 'Ahmad Fauzi',
      'Status': 'AKTIF',
      'Tipe Member': 'MEMBER',
      'Jenis Kelamin (L/P)': 'L',
      'Tanggal Bergabung': APP_TODAY,
      'Jenis Identitas': 'KTP',
      'Nomor Identitas': '3171012345678901',
      'Tanggal Lahir': '1992-05-14',
      'Alamat': 'Jl. Gatot Subroto No. 45, Jakarta Selatan',
      'Kontak Darurat': '081987654321 (Istri)',
      'Catatan': 'Program muscle build'
    },
    {
      'ID Member': 'M102',
      'Nama Lengkap': 'Siti Anggraeni',
      'No WhatsApp / Telepon': '085712345678',
      'Tanggal Expired': '2026-11-20',
      'Sisa Kuota PT': 0,
      'PIC ID': 'S02',
      'PIC Nama': 'Dewi Lestari',
      'Status': 'AKTIF',
      'Tipe Member': 'MEMBER',
      'Jenis Kelamin (L/P)': 'P',
      'Tanggal Bergabung': APP_TODAY,
      'Jenis Identitas': 'SIM',
      'Nomor Identitas': '920112345678',
      'Tanggal Lahir': '1995-10-22',
      'Alamat': 'Jl. Senopati No. 12, Kebayoran Baru',
      'Kontak Darurat': '081122334455 (Ibu)',
      'Catatan': 'Diet & Cardio'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const filename = `Template_Import_Member_GymPro.${format}`;

  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Member');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerDownload(blob, filename);
  } else {
    const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  }
}

export function downloadStaffTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleRows = [
    {
      'ID Karyawan': 'S05',
      'Username Akun': 'coach_rendy',
      'Nama Karyawan': 'Rendy Aditya',
      'Role': 'pt',
      'Nama Jabatan': 'Personal Trainer',
      'Shift': 'Pagi',
      'Status Kepegawaian': 'Tetap',
      'Gaji Pokok': 3500000,
      'Tunjangan': 500000,
      'No WhatsApp': '081299887766',
      'Email': 'rendy@gympro.com',
      'Jenis Kelamin (L/P)': 'L',
      'Tanggal Bergabung': APP_TODAY,
      'Kuota Cuti': 12,
      'Nama Bank': 'BCA',
      'Nomor Rekening': '541098231',
      'Jenis Identitas': 'KTP',
      'Nomor Identitas': '3171052345678903',
      'Tanggal Lahir': '1996-03-10',
      'Alamat': 'Jl. Tebet Timur Raya No. 8',
      'Kontak Darurat': '081234567899 (Kakak)'
    },
    {
      'ID Karyawan': 'S06',
      'Username Akun': 'kasir_maya',
      'Nama Karyawan': 'Maya Safitri',
      'Role': 'kasir',
      'Nama Jabatan': 'Kasir & Front Desk',
      'Shift': 'Siang',
      'Status Kepegawaian': 'Kontrak',
      'Gaji Pokok': 3500000,
      'Tunjangan': 400000,
      'No WhatsApp': '087811223344',
      'Email': 'maya@gympro.com',
      'Jenis Kelamin (L/P)': 'P',
      'Tanggal Bergabung': APP_TODAY,
      'Kuota Cuti': 12,
      'Nama Bank': 'Mandiri',
      'Nomor Rekening': '13700019283',
      'Jenis Identitas': 'KTP',
      'Nomor Identitas': '3271082345678904',
      'Tanggal Lahir': '1998-07-25',
      'Alamat': 'Jl. Kemang Pratama Blok B2',
      'Kontak Darurat': '081399881122 (Orang Tua)'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const filename = `Template_Import_Karyawan_GymPro.${format}`;

  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Karyawan');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerDownload(blob, filename);
  } else {
    const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  }
}

// ==========================================
// IMPORT PARSERS & NORMALIZERS
// ==========================================

export interface ParsedImportRow<T> {
  rowIndex: number;
  data: T;
  isExisting: boolean;
  warnings: string[];
  raw: Record<string, any>;
}

// Helper: normalize keys from uploaded spreadsheet
function normalizeKeys(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key
      .toLowerCase()
      .trim()
      .replace(/[\(\)\/\._\-]/g, ' ')
      .replace(/\s+/g, ' ');
    normalized[cleanKey] = row[key];
  }
  return normalized;
}

// Helper: pick value based on possible header aliases
function pickField(row: Record<string, any>, aliases: string[]): any {
  for (const alias of aliases) {
    const clean = alias.toLowerCase().trim();
    if (row[clean] !== undefined && row[clean] !== null && String(row[clean]).trim() !== '') {
      return row[clean];
    }
  }
  return undefined;
}

// Helper: parse date to YYYY-MM-DD
function parseDateValue(val: any, fallback: string = APP_TODAY): string {
  if (!val) return fallback;
  if (typeof val === 'number') {
    // Excel numeric date
    try {
      const dateObj = XLSX.SSF.parse_date_code(val);
      if (dateObj) {
        const y = dateObj.y;
        const m = String(dateObj.m).padStart(2, '0');
        const d = String(dateObj.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {}
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = str.split(/[/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      // DD/MM/YYYY
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    return d.toISOString().split('T')[0];
  }
  return fallback;
}

// Helper: generate next sequential ID
export function getNextMemberId(existingMembers: Member[]): string {
  const nums = existingMembers
    .map((m) => parseInt(m.id.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 100;
  return `M${max + 1}`;
}

export function getNextStaffId(existingStaff: User[]): string {
  const nums = existingStaff
    .map((s) => parseInt(s.id.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  const nextNum = max + 1;
  return `S${nextNum < 10 ? '0' + nextNum : nextNum}`;
}

// ==========================================
// PARSE MEMBER FILE
// ==========================================
export async function parseMemberSpreadsheet(
  file: File,
  existingMembers: Member[],
  staffList: User[]
): Promise<{
  rows: ParsedImportRow<Member>[];
  totalParsed: number;
  newCount: number;
  updateCount: number;
  errorMessages: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File tidak memiliki lembar kerja (worksheet) yang dapat dibaca.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawData.length === 0) {
    throw new Error('Lembar kerja kosong atau tidak ada data yang ditemukan.');
  }

  const existingMap = new Map<string, Member>();
  existingMembers.forEach((m) => {
    existingMap.set(m.id.toUpperCase(), m);
    if (m.phone) existingMap.set(m.phone.replace(/\D/g, ''), m);
  });

  const parsedRows: ParsedImportRow<Member>[] = [];
  const errorMessages: string[] = [];
  let generatedCounter = 1;

  for (let i = 0; i < rawData.length; i++) {
    const raw = rawData[i];
    const n = normalizeKeys(raw);

    const name = pickField(n, ['nama lengkap', 'nama member', 'nama', 'member name', 'customer', 'pelanggan']);
    if (!name || String(name).trim() === '') {
      errorMessages.push(`Baris ${i + 2}: Nama member kosong, baris dilewati.`);
      continue;
    }

    const cleanName = String(name).trim();
    let rawPhone = pickField(n, ['no whatsapp telepon', 'no whatsapp', 'no wa', 'no hp', 'nomor telepon', 'phone', 'telepon', 'whatsapp', 'telp']);
    let phoneStr = rawPhone !== undefined ? String(rawPhone).trim() : '';
    // Format phone to readable 08...
    if (phoneStr.startsWith('62')) {
      phoneStr = '0' + phoneStr.slice(2);
    }

    // ID resolution
    let rawId = pickField(n, ['id member', 'id', 'kode member', 'member id']);
    let finalId = rawId ? String(rawId).trim().toUpperCase() : '';
    
    // Check if member already exists
    let existingMatch: Member | undefined = undefined;
    if (finalId && existingMap.has(finalId)) {
      existingMatch = existingMap.get(finalId);
    } else if (phoneStr && existingMap.has(phoneStr.replace(/\D/g, ''))) {
      existingMatch = existingMap.get(phoneStr.replace(/\D/g, ''));
    }

    if (!finalId) {
      if (existingMatch) {
        finalId = existingMatch.id;
      } else {
        const nums = existingMembers
          .map((m) => parseInt(m.id.replace(/\D/g, ''), 10))
          .filter((num) => !isNaN(num));
        const max = nums.length > 0 ? Math.max(...nums) : 100;
        finalId = `M${max + generatedCounter++}`;
      }
    }

    // Expired date
    const rawExpired = pickField(n, ['tanggal expired', 'expired', 'masa berlaku', 'tenggat', 'expiry date', 'berlaku hingga']);
    const defaultExp = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const expiredDate = parseDateValue(rawExpired, existingMatch ? existingMatch.expired : defaultExp);

    // PT Quota
    const rawPt = pickField(n, ['sisa kuota pt sesi', 'sisa kuota pt', 'kuota pt', 'pt quota', 'sesi pt', 'quota pt']);
    const ptQuota = rawPt !== undefined && !isNaN(Number(rawPt)) ? Number(rawPt) : (existingMatch?.ptQuota || 0);

    // PIC
    const rawPicId = pickField(n, ['pic penanggung jawab id', 'pic id', 'picid', 'kode pic', 'staf pic']);
    const rawPicName = pickField(n, ['pic penanggung jawab nama', 'pic nama', 'picname', 'nama pic', 'penanggung jawab', 'pic']);
    let picId = rawPicId ? String(rawPicId).trim() : (existingMatch?.picId || staffList[0]?.id || 'S01');
    let picName = rawPicName ? String(rawPicName).trim() : (existingMatch?.picName || staffList[0]?.name || 'Admin');
    // If PIC ID given, match to staff name
    const matchedStaff = staffList.find((s) => s.id.toLowerCase() === picId.toLowerCase() || s.name.toLowerCase() === picName.toLowerCase());
    if (matchedStaff) {
      picId = matchedStaff.id;
      picName = matchedStaff.name;
    }

    // Gender
    const rawGender = pickField(n, ['jenis kelamin l p', 'jenis kelamin', 'gender', 'jk']);
    let gender: 'L' | 'P' = existingMatch?.gender || 'L';
    if (rawGender) {
      const gStr = String(rawGender).trim().toUpperCase();
      if (gStr.startsWith('P') || gStr === 'WANITA' || gStr === 'PEREMPUAN' || gStr === 'FEMALE') {
        gender = 'P';
      } else {
        gender = 'L';
      }
    }

    // Status
    const rawStatus = pickField(n, ['status keanggotaan', 'status', 'membership status']);
    let status: MembershipStatus = 'AKTIF';
    if (rawStatus) {
      const sUpper = String(rawStatus).trim().toUpperCase();
      if (sUpper.includes('FREEZE')) status = 'FREEZE';
      else if (sUpper.includes('EXP') || sUpper.includes('KADALUARSA')) status = 'EXPIRED';
      else if (sUpper.includes('TENGGANG')) status = 'MASA TENGGANG';
      else if (sUpper.includes('VISIT')) status = 'VISIT';
      else status = 'AKTIF';
    } else {
      status = new Date(expiredDate) >= new Date(APP_TODAY) ? 'AKTIF' : 'EXPIRED';
    }

    // Identity Card info
    const idType = pickField(n, ['jenis identitas', 'tipe id', 'id type']) || existingMatch?.idType || 'KTP';
    const idNumber = pickField(n, ['nomor identitas nik', 'nomor identitas', 'no identitas', 'nik', 'no ktp', 'ktp', 'id number']) || existingMatch?.idNumber || '';
    const birthDate = parseDateValue(pickField(n, ['tanggal lahir', 'tgl lahir', 'birth date', 'dob']), existingMatch?.birthDate || '');
    const address = pickField(n, ['alamat domisili', 'alamat', 'address']) || existingMatch?.address || '';
    const emergencyContact = pickField(n, ['kontak darurat', 'emergency contact', 'no darurat']) || existingMatch?.emergencyContact || '';
    const notes = pickField(n, ['catatan notes', 'catatan', 'notes', 'keterangan']) || existingMatch?.notes || '';
    const joinDate = parseDateValue(pickField(n, ['tanggal bergabung', 'tgl gabung', 'join date', 'tgl join']), existingMatch?.joinDate || APP_TODAY);
    const membershipType = (pickField(n, ['tipe member', 'membership type']) || existingMatch?.membershipType || 'MEMBER').toUpperCase() === 'VISIT' ? 'VISIT' : 'MEMBER';

    const warnings: string[] = [];
    if (!phoneStr) warnings.push('Nomor WhatsApp tidak terisi.');
    if (!idNumber) warnings.push('Nomor identitas (KTP/NIK) kosong.');

    const memberObj: Member = {
      id: finalId,
      name: cleanName,
      phone: phoneStr,
      expired: expiredDate,
      ptQuota,
      picId,
      picName,
      followUpStatus: existingMatch?.followUpStatus || 'AKTIF',
      photo: existingMatch?.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop`,
      gender,
      joinDate,
      status,
      membershipType,
      isFrozen: status === 'FREEZE',
      idType: idType as any,
      idNumber: idNumber ? String(idNumber).trim() : undefined,
      birthDate: birthDate || undefined,
      address: address ? String(address).trim() : undefined,
      emergencyContact: emergencyContact ? String(emergencyContact).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined
    };

    parsedRows.push({
      rowIndex: i + 2,
      data: memberObj,
      isExisting: !!existingMatch,
      warnings,
      raw
    });
  }

  const newCount = parsedRows.filter((r) => !r.isExisting).length;
  const updateCount = parsedRows.filter((r) => r.isExisting).length;

  return {
    rows: parsedRows,
    totalParsed: parsedRows.length,
    newCount,
    updateCount,
    errorMessages
  };
}

// ==========================================
// PARSE STAFF FILE
// ==========================================
export async function parseStaffSpreadsheet(
  file: File,
  existingStaff: User[]
): Promise<{
  rows: ParsedImportRow<User>[];
  totalParsed: number;
  newCount: number;
  updateCount: number;
  errorMessages: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File tidak memiliki lembar kerja (worksheet) yang dapat dibaca.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawData.length === 0) {
    throw new Error('Lembar kerja kosong atau tidak ada data yang ditemukan.');
  }

  const existingMap = new Map<string, User>();
  existingStaff.forEach((s) => {
    existingMap.set(s.id.toUpperCase(), s);
    if (s.accId) existingMap.set(s.accId.toLowerCase(), s);
    if (s.phone) existingMap.set(s.phone.replace(/\D/g, ''), s);
  });

  const parsedRows: ParsedImportRow<User>[] = [];
  const errorMessages: string[] = [];
  let generatedCounter = 1;

  for (let i = 0; i < rawData.length; i++) {
    const raw = rawData[i];
    const n = normalizeKeys(raw);

    const name = pickField(n, ['nama karyawan', 'nama staf', 'nama', 'staff name', 'employee name', 'nama lengkap']);
    if (!name || String(name).trim() === '') {
      errorMessages.push(`Baris ${i + 2}: Nama karyawan kosong, baris dilewati.`);
      continue;
    }

    const cleanName = String(name).trim();
    let rawPhone = pickField(n, ['no whatsapp hp', 'no whatsapp', 'no hp', 'phone', 'telepon', 'whatsapp', 'nomor hp']);
    let phoneStr = rawPhone !== undefined ? String(rawPhone).trim() : '';
    if (phoneStr.startsWith('62')) {
      phoneStr = '0' + phoneStr.slice(2);
    }

    // ID resolution
    let rawId = pickField(n, ['id karyawan', 'id staf', 'id', 'staff id', 'kode staf']);
    let finalId = rawId ? String(rawId).trim().toUpperCase() : '';

    let rawAccId = pickField(n, ['username akun', 'username', 'acc id', 'accid', 'akun']);
    let finalAccId = rawAccId ? String(rawAccId).trim().toLowerCase() : '';

    // Check if staff already exists
    let existingMatch: User | undefined = undefined;
    if (finalId && existingMap.has(finalId)) {
      existingMatch = existingMap.get(finalId);
    } else if (finalAccId && existingMap.has(finalAccId)) {
      existingMatch = existingMap.get(finalAccId);
    } else if (phoneStr && existingMap.has(phoneStr.replace(/\D/g, ''))) {
      existingMatch = existingMap.get(phoneStr.replace(/\D/g, ''));
    }

    if (!finalId) {
      if (existingMatch) {
        finalId = existingMatch.id;
      } else {
        const nums = existingStaff
          .map((s) => parseInt(s.id.replace(/\D/g, ''), 10))
          .filter((num) => !isNaN(num));
        const max = nums.length > 0 ? Math.max(...nums) : 0;
        const next = max + generatedCounter++;
        finalId = `S${next < 10 ? '0' + next : next}`;
      }
    }

    if (!finalAccId) {
      finalAccId = existingMatch?.accId || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    // Role resolution
    const rawRole = pickField(n, ['role sistem', 'role', 'posisi', 'jabatan']);
    let role: UserRole = 'pt';
    let roleName = 'Pelatih PT';

    if (rawRole) {
      const r = String(rawRole).trim().toLowerCase();
      if (r.includes('admin') || r.includes('manager') || r.includes('owner')) {
        role = 'admin';
        roleName = 'System Admin / Manager';
      } else if (r.includes('kasir') || r.includes('front') || r.includes('desk') || r.includes('receptionist')) {
        role = 'kasir';
        roleName = 'Kasir & Front Desk';
      } else if (r.includes('leader') || r.includes('head trainer')) {
        role = 'leader_pt';
        roleName = 'Leader PT';
      } else if (r.includes('teknisi') || r.includes('maintenance')) {
        role = 'teknisi';
        roleName = 'Teknisi Alat';
      } else {
        role = 'pt';
        roleName = 'Pelatih PT';
      }
    } else if (existingMatch) {
      role = existingMatch.role;
      roleName = existingMatch.roleName;
    }

    const customRoleName = pickField(n, ['nama jabatan posisi', 'nama jabatan', 'jabatan']) || roleName;

    // Shift
    const rawShift = pickField(n, ['shift kerja', 'shift', 'jadwal']);
    const shift = rawShift ? String(rawShift).trim() : (existingMatch?.shift || 'Pagi');

    // Salary & allowance
    const rawSalary = pickField(n, ['gaji pokok rp', 'gaji pokok', 'gaji', 'base salary', 'salary']);
    const baseSalary = rawSalary !== undefined && !isNaN(Number(rawSalary))
      ? Number(rawSalary)
      : (existingMatch?.baseSalary || (role === 'admin' ? 5000000 : role === 'leader_pt' ? 4500000 : 3500000));

    const rawAllowance = pickField(n, ['tunjangan rp', 'tunjangan', 'allowance']);
    const allowance = rawAllowance !== undefined && !isNaN(Number(rawAllowance)) ? Number(rawAllowance) : (existingMatch?.allowance || 500000);

    // Employment status
    const rawEmpStatus = pickField(n, ['status kepegawaian', 'status', 'employment status']);
    let empStatus: 'Tetap' | 'Kontrak' | 'Probation' | 'Part-time' = existingMatch?.employmentStatus || 'Tetap';
    if (rawEmpStatus) {
      const es = String(rawEmpStatus).trim().toLowerCase();
      if (es.includes('kontrak')) empStatus = 'Kontrak';
      else if (es.includes('part')) empStatus = 'Part-time';
      else if (es.includes('prob')) empStatus = 'Probation';
      else empStatus = 'Tetap';
    }

    // Gender
    const rawGender = pickField(n, ['jenis kelamin l p', 'jenis kelamin', 'gender', 'jk']);
    let gender: 'L' | 'P' = existingMatch?.gender || 'L';
    if (rawGender) {
      const gStr = String(rawGender).trim().toUpperCase();
      if (gStr.startsWith('P') || gStr === 'WANITA' || gStr === 'PEREMPUAN') {
        gender = 'P';
      } else {
        gender = 'L';
      }
    }

    // Bank & Leave
    const bankName = pickField(n, ['nama bank', 'bank']) || existingMatch?.bankName || 'BCA';
    const bankAccount = pickField(n, ['nomor rekening', 'no rekening', 'rekening', 'bank account']) || existingMatch?.bankAccount || '';
    const rawLeave = pickField(n, ['sisa kuota cuti hari', 'sisa kuota cuti', 'kuota cuti', 'leave quota']);
    const leaveQuota = rawLeave !== undefined && !isNaN(Number(rawLeave)) ? Number(rawLeave) : (existingMatch?.leaveQuota ?? 12);

    // Identity
    const idType = pickField(n, ['jenis identitas', 'tipe id', 'id type']) || existingMatch?.idType || 'KTP';
    const idNumber = pickField(n, ['nomor identitas nik', 'nomor identitas', 'no identitas', 'nik', 'no ktp']) || existingMatch?.idNumber || '';
    const birthDate = parseDateValue(pickField(n, ['tanggal lahir', 'birth date']), existingMatch?.birthDate || '1995-01-01');
    const address = pickField(n, ['alamat', 'address', 'alamat domisili']) || existingMatch?.address || '';
    const emergencyContact = pickField(n, ['kontak darurat', 'emergency contact']) || existingMatch?.emergencyContact || '';
    const email = pickField(n, ['email', 'surel']) || existingMatch?.email || '';
    const joinDate = parseDateValue(pickField(n, ['tanggal bergabung', 'join date']), existingMatch?.joinDate || APP_TODAY);
    const password = pickField(n, ['password', 'sandi']) || existingMatch?.password || '123';

    const warnings: string[] = [];
    if (!phoneStr) warnings.push('No WhatsApp belum terisi.');
    if (!bankAccount) warnings.push('Nomor rekening bank belum diisi.');

    const staffObj: User = {
      id: finalId,
      accId: finalAccId,
      name: cleanName,
      email: email ? String(email).trim() : undefined,
      role,
      roleName: customRoleName,
      shift,
      baseSalary,
      allowance,
      employmentStatus: empStatus,
      password: String(password).trim(),
      photo: existingMatch?.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop`,
      gender,
      phone: phoneStr || undefined,
      joinDate,
      leaveQuota,
      bankName: String(bankName).trim(),
      bankAccount: bankAccount ? String(bankAccount).trim() : undefined,
      idType: idType as any,
      idNumber: idNumber ? String(idNumber).trim() : undefined,
      birthDate: birthDate || undefined,
      address: address ? String(address).trim() : undefined,
      emergencyContact: emergencyContact ? String(emergencyContact).trim() : undefined
    };

    parsedRows.push({
      rowIndex: i + 2,
      data: staffObj,
      isExisting: !!existingMatch,
      warnings,
      raw
    });
  }

  const newCount = parsedRows.filter((r) => !r.isExisting).length;
  const updateCount = parsedRows.filter((r) => r.isExisting).length;

  return {
    rows: parsedRows,
    totalParsed: parsedRows.length,
    newCount,
    updateCount,
    errorMessages
  };
}

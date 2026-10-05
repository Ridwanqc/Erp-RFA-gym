import { createWorker } from 'tesseract.js';

export interface ExtractedIdData {
  rawText: string;
  idType: 'KTP' | 'SIM' | 'Paspor' | 'Kartu Pelajar';
  idNumber: string;
  name?: string;
  birthDate?: string; // YYYY-MM-DD format for HTML date input
  addressCity: string; // Only City / Regency (Kota / Kabupaten)
  confidence: number;
}

/**
 * Normalizes common OCR noise and letter substitutions in numeric fields (KTP/SIM/NIK)
 * e.g., 'O', 'D', 'o' -> 0; 'I', 'l', 'L', '|' -> 1; 'B' -> 8; 'S' -> 5; 'Z' -> 2
 */
export function cleanOcrDigits(raw: string): string {
  return raw
    .replace(/[ODo]/g, '0')
    .replace(/[IlL|!]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[E]/g, '3')
    .replace(/[A]/g, '4')
    .replace(/[Ssb]/g, '5')
    .replace(/[b]/g, '6')
    .replace(/[T]/g, '7')
    .replace(/[B]/g, '8')
    .replace(/[gq]/g, '9')
    .replace(/\D/g, '');
}

/**
 * Extracts 16-digit NIK from Indonesian KTP text with noise resilience
 */
export function extractKtpNik(text: string): string {
  // 1. Direct regex for 16 contiguous digits
  const exactMatch = text.match(/\b([0-9]{16})\b/);
  if (exactMatch) return exactMatch[1];

  // 2. Look for lines containing NIK or N1K or N.I.K
  const lines = text.split('\n');
  for (const line of lines) {
    if (/N[\s.:;!|]*[I1l|][\s.:;!|]*K/i.test(line)) {
      const candidateDigits = cleanOcrDigits(line);
      if (candidateDigits.length >= 16) {
        return candidateDigits.substring(0, 16);
      }
    }
  }

  // 3. Search for grouped digits (e.g. "3171 0115 0488 0001" or "3171-0115-0488-0001")
  const groupedMatch = text.match(/\b([0-9OlILSBZ]{2,6}[\s\-._/]+[0-9OlILSBZ]{2,6}[\s\-._/]+[0-9OlILSBZ]{2,6}[\s\-._/]+[0-9OlILSBZ]{2,6})\b/i);
  if (groupedMatch) {
    const cleaned = cleanOcrDigits(groupedMatch[1]);
    if (cleaned.length === 16) return cleaned;
  }

  // 4. Any line with around 16 digits
  for (const line of lines) {
    const digitsOnly = cleanOcrDigits(line);
    if (digitsOnly.length === 16) {
      return digitsOnly;
    }
  }

  return '';
}

/**
 * Extracts SIM number (typically 12-14 digits)
 */
export function extractSimNumber(text: string): string {
  // Regex for SIM label followed by digits
  const simLabelMatch = text.match(/(?:NO\.?|NOMOR)?\s*SIM\s*[:\s=]*([0-9OlILSBZ\-\s]{10,18})/i);
  if (simLabelMatch) {
    const cleaned = cleanOcrDigits(simLabelMatch[1]);
    if (cleaned.length >= 12 && cleaned.length <= 14) return cleaned;
  }

  // Generic 12 to 14 digit sequence
  const genericSim = text.match(/\b([0-9]{12,14})\b/);
  if (genericSim) return genericSim[1];

  return '';
}

/**
 * Extracts Passport number: 1 letter followed by 7 to 8 digits (e.g., A1234567, B12345678)
 */
export function extractPassportNumber(text: string): string {
  // Passport label match
  const passLabelMatch = text.match(/(?:PASSPORT|PASPOR|NO\.?)\s*(?:NO\.?|NOMOR)?\s*[:\s=]*([A-Z][0-9]{7,8})\b/i);
  if (passLabelMatch) return passLabelMatch[1].toUpperCase();

  // Pattern: 1 letter followed by 7-8 digits
  const generalPass = text.match(/\b([A-PR-WY][0-9]{7,8})\b/i);
  if (generalPass) return generalPass[1].toUpperCase();

  return '';
}

/**
 * Extracts City / Regency (KOTA / KABUPATEN) name ONLY
 * e.g., "KOTA JAKARTA SELATAN", "KABUPATEN BOGOR", "KOTA BEKASI", "KOTA SURABAYA", "KABUPATEN TANGERANG"
 */
export function extractCityRegency(text: string): string {
  const cleanText = text.toUpperCase();

  // List of major cities for direct fuzzy matching
  const knownCities = [
    'JAKARTA PUSAT',
    'JAKARTA SELATAN',
    'JAKARTA BARAT',
    'JAKARTA TIMUR',
    'JAKARTA UTARA',
    'BEKASI',
    'BOGOR',
    'DEPOK',
    'TANGERANG',
    'TANGERANG SELATAN',
    'BANDUNG',
    'BANDUNG BARAT',
    'CIMAHI',
    'CIREBON',
    'SUKABUMI',
    'SEMARANG',
    'SURAKARTA',
    'SOLO',
    'YOGYAKARTA',
    'SLEMAN',
    'BANTUL',
    'SURABAYA',
    'MALANG',
    'SIDOARJO',
    'GRESIK',
    'DENPASAR',
    'BADUNG',
    'MEDAN',
    'PALEMBANG',
    'PEKANBARU',
    'BATAM',
    'PADANG',
    'BANDAR LAMPUNG',
    'MAKASSAR',
    'MANADO',
    'BALIKPAPAN',
    'SAMARINDA',
    'BANJARMASIN',
    'PONTIANAK'
  ];

  // 1. Look for explicit "KOTA [NAMA]" or "KABUPATEN [NAMA]" or "KAB. [NAMA]"
  // e.g. "KOTA ADM. JAKARTA SELATAN", "KOTA SURABAYA", "KABUPATEN BOGOR"
  const cityMatch = cleanText.match(/\b(KOTA(?:\s+ADM\.)?|KABUPATEN|KAB\.)\s+([A-Z\s]{3,30})/);
  if (cityMatch) {
    const prefix = cityMatch[1].startsWith('KAB') ? 'KABUPATEN' : 'KOTA';
    let rawCityName = cityMatch[2];

    // Clean out trailing noise (like RT, RW, KEL, KEC, ALAMAT, PROVINSI, numbers, punctuation)
    rawCityName = rawCityName
      .replace(/\b(PROVINSI|KECAMATAN|KELURAHAN|DESA|RT|RW|ALAMAT|GOL|DARAH|AGAMA|STATUS|PEKERJAAN|WARGA|NEGARA|BERLAKU|HINGGA)\b.*/, '')
      .replace(/[^A-Z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check if the extracted word contains known city
    for (const kc of knownCities) {
      if (rawCityName.includes(kc)) {
        return `${prefix} ${kc}`;
      }
    }

    const words = rawCityName.split(' ').filter((w) => w.length >= 3);
    if (words.length > 0) {
      // Return maximum 2-3 words (e.g. "KOTA JAKARTA SELATAN" or "KABUPATEN BANDUNG BARAT")
      const finalWords = words.slice(0, 3).join(' ');
      return `${prefix} ${finalWords}`;
    }
  }

  // 2. Direct search for known major cities anywhere in the document
  for (const kc of knownCities) {
    const regex = new RegExp(`\\b${kc}\\b`, 'i');
    if (regex.test(cleanText)) {
      const isKab = cleanText.includes(`KABUPATEN ${kc}`) || cleanText.includes(`KAB. ${kc}`);
      return isKab ? `KABUPATEN ${kc}` : `KOTA ${kc}`;
    }
  }

  // 3. Fallback: Check header lines like "PROVINSI DKI JAKARTA"
  if (cleanText.includes('DKI JAKARTA') || cleanText.includes('JAKARTA')) {
    return 'KOTA JAKARTA SELATAN';
  }

  return '';
}

/**
 * Extracts Birth Date (Tanggal Lahir) and converts to YYYY-MM-DD
 */
export function extractBirthDate(text: string, nik?: string): string {
  // 1. Look for Tempat/Tgl Lahir pattern: e.g. "JAKARTA, 15-04-1995" or "15/04/1995"
  const ttlMatch = text.match(/(?:LAHIR|TTL|TGL)[\s.:;=]*[A-Z\s,]+([0-3]?[0-9])[\s\-/.]+([0-1]?[0-9])[\s\-/.]+([1-2][90][0-9]{2})/i);
  if (ttlMatch) {
    const day = ttlMatch[1].padStart(2, '0');
    const month = ttlMatch[2].padStart(2, '0');
    const year = ttlMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 2. Indonesian Month names pattern: e.g. "15 AGUSTUS 1995"
  const monthMap: Record<string, string> = {
    JAN: '01', JANUARI: '01',
    FEB: '02', FEBRUARI: '02',
    MAR: '03', MARET: '03',
    APR: '04', APRIL: '04',
    MEI: '05',
    JUN: '06', JUNI: '06',
    JUL: '07', JULI: '07',
    AGU: '08', AGUSTUS: '08',
    SEP: '09', SEPTEMBER: '09',
    OKT: '10', OKTOBER: '10',
    NOV: '11', NOVEMBER: '11',
    DES: '12', DESEMBER: '12'
  };

  const monthRegex = /(?:LAHIR|TTL|TGL)?[\s.:;=]*[A-Z\s,]*([0-3]?[0-9])[\s\-]+([A-Z]{3,9})[\s\-]+([1-2][90][0-9]{2})/i;
  const monthMatch = text.match(monthRegex);
  if (monthMatch) {
    const day = monthMatch[1].padStart(2, '0');
    const mStr = monthMatch[2].toUpperCase();
    const year = monthMatch[3];
    const monthNum = Object.keys(monthMap).find((k) => mStr.startsWith(k));
    if (monthNum) {
      return `${year}-${monthMap[monthNum]}-${day}`;
    }
  }

  // 3. Infer from NIK if available (Digits 7-12: DD MM YY)
  // For females, day is day + 40 (e.g. 55 = 15)
  if (nik && nik.length === 16) {
    const rawDay = parseInt(nik.substring(6, 8), 10);
    const month = nik.substring(8, 10);
    const rawYear = parseInt(nik.substring(10, 12), 10);

    if (!isNaN(rawDay) && !isNaN(rawYear) && parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12) {
      const realDay = rawDay > 40 ? rawDay - 40 : rawDay;
      const currentYearShort = new Date().getFullYear() % 100;
      const fullYear = rawYear > currentYearShort ? 1900 + rawYear : 2000 + rawYear;
      return `${fullYear}-${month}-${String(realDay).padStart(2, '0')}`;
    }
  }

  return '';
}

/**
 * Extracts Member Full Name from KTP if possible
 */
export function extractKtpName(text: string): string {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\bNAMA\b/i.test(line)) {
      const namePart = line.replace(/.*?\bNAMA\b[\s.:;=]*/i, '').replace(/[^A-Z\s']/gi, '').trim();
      if (namePart.length >= 3) {
        return namePart.toUpperCase();
      }
      // Check next line if name is on separate line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].replace(/[^A-Z\s']/gi, '').trim();
        if (nextLine.length >= 3 && !/TEMPAT|LAHIR|AGAMA|STATUS/i.test(nextLine)) {
          return nextLine.toUpperCase();
        }
      }
    }
  }
  return '';
}

/**
 * Main OCR runner using Tesseract.js (100% Client-Side in browser)
 */
export async function performIdCardOcr(
  imageSource: string | File | Blob,
  currentIdType: 'KTP' | 'SIM' | 'Paspor' | 'Kartu Pelajar' = 'KTP',
  onProgress?: (progressPercent: number, statusText: string) => void
): Promise<ExtractedIdData> {
  let worker: any = null;

  try {
    onProgress?.(10, 'Menginisialisasi OCR engine di browser...');

    // Attempt to load Indonesian language traineddata, with fallback to English
    try {
      worker = await createWorker('ind', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            const pct = Math.min(95, Math.round(20 + m.progress * 75));
            onProgress?.(pct, `Membaca teks identitas (${Math.round(m.progress * 100)}%)...`);
          } else if (m.status) {
            onProgress?.(25, `Status OCR: ${m.status}...`);
          }
        }
      });
    } catch (indErr) {
      console.warn('Gagal memuat model ind, fallback ke eng:', indErr);
      worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            const pct = Math.min(95, Math.round(20 + m.progress * 75));
            onProgress?.(pct, `Membaca teks identitas (${Math.round(m.progress * 100)}%)...`);
          }
        }
      });
    }

    onProgress?.(30, 'Memproses citra dokumen...');

    // Run recognition
    const result = await worker.recognize(imageSource);
    const rawText = result.data.text || '';
    const confidence = result.data.confidence || 0;

    onProgress?.(96, 'Mengekstraksi nomor identitas & kota domisili...');

    // 1. Determine or verify ID type from text
    let detectedIdType = currentIdType;
    if (/KARTU\s+TANDA\s+PENDUDUK|REPUBLIK\s+INDONESIA|NIK\b/i.test(rawText)) {
      detectedIdType = 'KTP';
    } else if (/\bSIM\b|SURAT\s+IZIN\s+MENGEMUDI/i.test(rawText)) {
      detectedIdType = 'SIM';
    } else if (/PASPOR|PASSPORT/i.test(rawText)) {
      detectedIdType = 'Paspor';
    }

    // 2. Extract Document Number based on type
    let extractedNumber = '';
    if (detectedIdType === 'KTP') {
      extractedNumber = extractKtpNik(rawText);
    } else if (detectedIdType === 'SIM') {
      extractedNumber = extractSimNumber(rawText);
    } else if (detectedIdType === 'Paspor') {
      extractedNumber = extractPassportNumber(rawText);
    } else {
      // Fallback
      extractedNumber = extractKtpNik(rawText) || extractPassportNumber(rawText);
    }

    // 3. Extract City / Regency (Kota/Kabupaten) ONLY
    const addressCity = extractCityRegency(rawText);

    // 4. Extract Birth Date
    const birthDate = extractBirthDate(rawText, extractedNumber);

    // 5. Extract Name (optional)
    const name = extractKtpName(rawText);

    onProgress?.(100, 'Ekstraksi identitas selesai!');

    return {
      rawText,
      idType: detectedIdType,
      idNumber: extractedNumber,
      name,
      birthDate,
      addressCity,
      confidence
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termErr) {
        console.warn('Worker terminate error:', termErr);
      }
    }
  }
}

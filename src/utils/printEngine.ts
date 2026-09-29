/**
 * GymPro ERP - Universal Print Engine
 * Mendukung pencetakan presisi tinggi ke:
 * 1. Printer Thermal POS (58mm Mini POS / Bluetooth & 80mm Desktop Kasir)
 * 2. Printer Standar (A4 Inkjet/Laser, Letter Kantor, & Export PDF)
 */

import { Schedule, Member, User as UserType, GymBranch } from '../types';
import { formatDateIndo, formatRp } from './formatters';

export type PrintPaperSize = '58mm' | '80mm' | 'a4' | 'letter';

export interface PrintDocumentOptions {
  title?: string;
  paperSize?: PrintPaperSize;
  autoCut?: boolean;
}

/**
 * Mencetak HTML ke printer via hidden iframe dengan ukuran @page yang tepat.
 * Menghindari bug margin browser dan layout terpotong pada printer thermal.
 */
export function printViaHiddenIframe(htmlContent: string, options: PrintDocumentOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const { title = 'GymPro ERP Print', paperSize = '80mm' } = options;

    let iframe = document.getElementById('silent-print-engine-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'silent-print-engine-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      // Fallback
      window.print();
      resolve(false);
      return;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Pastikan title dokumen sesuai
    if (iframe.contentWindow) {
      iframe.contentWindow.document.title = title;
    }

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve(true);
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
        resolve(false);
      }
    }, 250);
  });
}

/**
 * Generate CSS styles untuk printer thermal (58mm/80mm) maupun printer standar (A4/Letter).
 */
export function getUniversalPrintStyles(paperSize: PrintPaperSize): string {
  const is58 = paperSize === '58mm';
  const is80 = paperSize === '80mm';
  const isThermal = is58 || is80;
  const isLetter = paperSize === 'letter';

  const pageSizeRule = is58
    ? '58mm auto'
    : is80
    ? '80mm auto'
    : isLetter
    ? 'letter portrait'
    : 'A4 portrait';

  const marginRule = isThermal ? '0mm' : '10mm 15mm';
  const bodyWidth = is58 ? '48mm' : is80 ? '72mm' : isLetter ? '7.5in' : '185mm';
  const fontSize = is58 ? '10px' : is80 ? '12px' : '12.5px';
  const fontFamily = isThermal
    ? "'Courier New', Courier, 'Lucida Console', Monaco, monospace"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  return `
    @page {
      size: ${pageSizeRule};
      margin: ${marginRule};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: ${isThermal ? (is58 ? '4px 2px' : '8px 4px') : '0'};
      width: 100%;
      max-width: ${bodyWidth};
      margin-left: auto;
      margin-right: auto;
      font-family: ${fontFamily};
      font-size: ${fontSize};
      line-height: ${isThermal ? '1.3' : '1.45'};
      color: #000000;
      background: #ffffff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .text-xs { font-size: ${is58 ? '9px' : '10px'}; }
    .text-sm { font-size: ${is58 ? '10px' : '11px'}; }
    .text-lg { font-size: ${is58 ? '12px' : is80 ? '14px' : '16px'}; }
    .text-xl { font-size: ${is58 ? '14px' : is80 ? '16px' : '20px'}; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .my-1 { margin-top: 4px; margin-bottom: 4px; }
    .my-2 { margin-top: 8px; margin-bottom: 8px; }
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .p-1 { padding: 4px; }
    .p-2 { padding: 8px; }
    .dashed {
      border-bottom: 1px dashed #000;
      margin: ${isThermal ? '6px 0' : '10px 0'};
    }
    .double {
      border-bottom: 3px double #000;
      margin: ${isThermal ? '6px 0' : '12px 0'};
    }
    .solid {
      border-bottom: 1px solid #000;
      margin: 8px 0;
    }
    .barcode-box {
      text-align: center;
      letter-spacing: ${is58 ? '3px' : '5px'};
      font-size: ${is58 ? '13px' : '16px'};
      font-weight: bold;
      margin: 6px 0 2px 0;
    }
    .qr-placeholder {
      display: inline-block;
      width: ${is58 ? '52px' : '64px'};
      height: ${is58 ? '52px' : '64px'};
      border: 2px solid #000;
      padding: 2px;
      margin: 4px auto;
      text-align: center;
      font-size: 8px;
      line-height: 1.1;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 9px;
      font-weight: bold;
      border: 1px solid #000;
      border-radius: 4px;
    }
    .table-roster {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    .table-roster th {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 6px 4px;
      font-size: 11px;
      font-weight: bold;
      text-align: left;
    }
    .table-roster td {
      border-bottom: 1px dashed #ccc;
      padding: 6px 4px;
      font-size: 10.5px;
      vertical-align: top;
    }
    .page-break-avoid {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .signature-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 8px;
      text-align: center;
    }
    .sig-box {
      flex: 1;
      margin: 0 4px;
    }
    .sig-line {
      margin-top: 40px;
      border-top: 1px solid #000;
      font-size: 10px;
      font-weight: bold;
      padding-top: 2px;
    }
  `;
}

/**
 * Generate HTML Slip Sesi PT Individu (Thermal 58mm/80mm & A4 Voucher).
 */
export function generatePTSessionSlipHtml(
  schedule: Schedule,
  branch?: GymBranch,
  paperSize: PrintPaperSize = '80mm',
  options: {
    showNotes?: boolean;
    showSignatures?: boolean;
    showBarcode?: boolean;
    gymName?: string;
    tagline?: string;
  } = {}
): string {
  const isThermal = paperSize === '58mm' || paperSize === '80mm';
  const {
    showNotes = true,
    showSignatures = true,
    showBarcode = true,
    gymName = 'GYMPRO FITNESS & WELLNESS',
    tagline = 'Personal Training & Strength Conditioning'
  } = options;

  const branchName = branch?.name || 'Cabang Utama Flagship';
  const branchAddress = branch?.address || 'Jl. Boulevard Artha Gading Blok A-3 No. 88';
  const branchCity = branch?.city || 'Jakarta Utara, DKI Jakarta';
  const branchPhone = branch?.whatsapp || branch?.phone || '0812-9876-5432';

  const statusLabel =
    schedule.status === 'Selesai'
      ? 'SELESAI (COMPLETED)'
      : schedule.status === 'Batal'
      ? 'DIBATALKAN (CANCELLED)'
      : schedule.valTrainer || schedule.valStaf
      ? 'TERKONFIRMASI (CONFIRMED)'
      : 'MENUNGGU (PENDING)';

  const styles = getUniversalPrintStyles(paperSize);

  return `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Slip Sesi PT - ${schedule.id}</title>
        <style>${styles}</style>
      </head>
      <body>
        <!-- Header Cabang & Gym -->
        <div class="text-center">
          <div class="font-black text-lg uppercase">${gymName}</div>
          <div class="text-xs">${tagline}</div>
          <div class="text-xs">${branchName}</div>
          <div class="text-xs">${branchAddress}</div>
          <div class="text-xs">Telp/WA: ${branchPhone}</div>
        </div>

        <div class="double"></div>

        <div class="text-center font-bold text-sm uppercase">
          ${isThermal ? 'BUKTI / SLIP SESI PERSONAL TRAINER' : 'VOUCHER RESMI & FORMULIR SESI PERSONAL TRAINER'}
        </div>

        <div class="dashed"></div>

        <!-- Detail Informasi Sesi -->
        <div class="flex justify-between my-1">
          <span>No. Sesi:</span>
          <span class="font-bold">${schedule.id}</span>
        </div>
        <div class="flex justify-between my-1">
          <span>Tanggal:</span>
          <span class="font-bold">${schedule.date} (${formatDateIndo(schedule.date)})</span>
        </div>
        <div class="flex justify-between my-1">
          <span>Waktu Latihan:</span>
          <span class="font-bold">${schedule.time} WIB</span>
        </div>
        <div class="flex justify-between my-1">
          <span>Status Sesi:</span>
          <span class="font-bold">${statusLabel}</span>
        </div>

        <div class="dashed"></div>

        <!-- Data Member & Pelatih -->
        <div class="flex justify-between my-1">
          <span>Nama Member:</span>
          <span class="font-bold text-sm uppercase">${schedule.memberName}</span>
        </div>
        <div class="flex justify-between my-1">
          <span>ID Member:</span>
          <span>${schedule.memberId || '-'}</span>
        </div>
        <div class="flex justify-between my-1">
          <span>Personal Trainer:</span>
          <span class="font-bold">${schedule.trainer}</span>
        </div>
        ${
          schedule.bundleName || schedule.bundleId
            ? `
        <div class="flex justify-between my-1">
          <span>Paket Bundling:</span>
          <span class="font-bold">${schedule.bundleName || 'Paket Bundling VIP'}</span>
        </div>`
            : ''
        }

        ${
          showNotes && schedule.note
            ? `
        <div class="dashed"></div>
        <div class="my-1">
          <div class="font-bold text-xs">Fokus / Catatan Latihan:</div>
          <div class="text-xs" style="font-style: italic; margin-top: 2px;">"${schedule.note}"</div>
        </div>`
            : ''
        }

        <!-- 3-Pihak Validasi Status -->
        <div class="dashed"></div>
        <div class="text-xs font-bold mb-1">Status Validasi Kehadiran:</div>
        <div class="flex justify-between text-xs my-1">
          <span>Validasi Trainer:</span>
          <span>${schedule.valTrainer ? '✓ Tervalidasi Digital' : '[ ] Belum / Paraf manual'}</span>
        </div>
        <div class="flex justify-between text-xs my-1">
          <span>Validasi Resepsionis/Staf:</span>
          <span>${schedule.valStaf ? '✓ Tervalidasi Digital' : '[ ] Belum / Paraf manual'}</span>
        </div>
        <div class="flex justify-between text-xs my-1">
          <span>Validasi Member:</span>
          <span>${schedule.valMember ? '✓ Tervalidasi Digital' : '[ ] Belum / Paraf manual'}</span>
        </div>

        ${
          showSignatures
            ? `
        <div class="signature-grid page-break-avoid">
          <div class="sig-box">
            <div class="sig-line">Member</div>
            <div style="font-size: 8px;">(${schedule.memberName})</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">Personal Trainer</div>
            <div style="font-size: 8px;">(${schedule.trainer})</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">Front Desk / Staf</div>
            <div style="font-size: 8px;">(Petugas Kasir)</div>
          </div>
        </div>`
            : ''
        }

        ${
          showBarcode
            ? `
        <div class="dashed"></div>
        <div class="barcode-box">||| | |||| | |||||| |||</div>
        <div class="text-center text-xs">*${schedule.id}*</div>`
            : ''
        }

        <div class="dashed"></div>
        <div class="text-center text-xs" style="margin-top: 6px;">
          Harap datang 10 menit sebelum jadwal sesi dimulai.<br>
          Pembatalan sesi wajib konfirmasi min. 3 jam sebelumnya.
        </div>

        <div class="text-center text-xs font-bold" style="margin-top: 8px;">
          Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} WIB
        </div>

        ${
          isThermal
            ? '<div style="margin-top: 24px; text-align: center; font-size: 8px; color: #666;">-- [Potong Kertas Disini] --</div>'
            : ''
        }
      </body>
    </html>
  `;
}

/**
 * Generate HTML Rekap Kalender / Jadwal PT Keseluruhan (Thermal Summary & A4 Sheet).
 */
export function generatePTScheduleRosterHtml(
  schedules: Schedule[],
  branch?: GymBranch,
  paperSize: PrintPaperSize = 'a4',
  options: {
    title?: string;
    filterTrainer?: string;
    filterPeriod?: string;
    gymName?: string;
  } = {}
): string {
  const isThermal = paperSize === '58mm' || paperSize === '80mm';
  const {
    title = 'REKAPITULASI JADWAL PERSONAL TRAINER',
    filterTrainer = 'Semua Trainer',
    filterPeriod = 'Hari Ini',
    gymName = 'GYMPRO FITNESS & WELLNESS'
  } = options;

  const branchName = branch?.name || 'Cabang Utama Flagship';
  const branchAddress = branch?.address || 'Jl. Boulevard Artha Gading Blok A-3 No. 88';
  const branchPhone = branch?.whatsapp || branch?.phone || '0812-9876-5432';

  const styles = getUniversalPrintStyles(paperSize);

  // Hitung ringkasan
  const total = schedules.length;
  const completed = schedules.filter((s) => s.status === 'Selesai').length;
  const confirmed = schedules.filter((s) => s.valTrainer || s.valStaf || s.status === 'Reschedule').length;
  const pending = total - completed - confirmed;

  // Render untuk THERMAL PRINTER (58mm/80mm roll ringkas)
  if (isThermal) {
    return `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="text-center">
            <div class="font-black text-lg uppercase">${gymName}</div>
            <div class="text-xs">${branchName}</div>
            <div class="text-xs">Telp: ${branchPhone}</div>
          </div>

          <div class="double"></div>

          <div class="text-center font-bold text-sm uppercase">
            ${title}
          </div>
          <div class="text-center text-xs">
            Filter: ${filterTrainer} | ${filterPeriod}
          </div>

          <div class="dashed"></div>

          <div class="flex justify-between text-xs">
            <span>Total Sesi: <b>${total}</b></span>
            <span>Selesai: <b>${completed}</b></span>
          </div>
          <div class="flex justify-between text-xs">
            <span>Terkonfirmasi: <b>${confirmed}</b></span>
            <span>Pending: <b>${pending}</b></span>
          </div>

          <div class="dashed"></div>

          <!-- List Jadwal Ringkas Thermal -->
          <div class="font-bold text-xs mb-1">DAFTAR SESI (${total}):</div>
          ${
            schedules.length === 0
              ? '<div class="text-center text-xs my-2">Tidak ada jadwal yang terdaftar.</div>'
              : schedules
                  .map((s, idx) => {
                    const st =
                      s.status === 'Selesai'
                        ? '[SELESAI]'
                        : s.valTrainer || s.valStaf
                        ? '[CONFIRM]'
                        : '[PENDING]';
                    return `
                    <div class="page-break-avoid my-1" style="border-bottom: 1px dotted #888; padding-bottom: 4px;">
                      <div class="flex justify-between font-bold text-xs">
                        <span>#${idx + 1}. ${s.time} WIB (${s.date})</span>
                        <span>${st}</span>
                      </div>
                      <div class="text-xs">Member : <b>${s.memberName}</b></div>
                      <div class="text-xs">Trainer: ${s.trainer}</div>
                      ${s.note ? `<div class="text-xs" style="font-style: italic;">Note: ${s.note}</div>` : ''}
                    </div>
                  `;
                  })
                  .join('')
          }

          <div class="dashed"></div>
          <div class="text-center text-xs">
            Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} WIB
          </div>
          <div style="margin-top: 24px; text-align: center; font-size: 8px; color: #666;">-- [Potong Kertas] --</div>
        </body>
      </html>
    `;
  }

  // Render untuk PRINTER STANDAR A4 / LETTER (Tabel Formal & Tanda Tangan)
  return `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>${styles}</style>
      </head>
      <body>
        <!-- Kop Surat Resmi Gym -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 18px; font-weight: 900; text-transform: uppercase;">${gymName}</div>
            <div style="font-size: 11px; color: #333;">PUSAT KEBUGARAN, KELAS STUDIO & PERSONAL TRAINING</div>
            <div style="font-size: 10px; color: #555;">${branchName} • ${branchAddress} • Telp/WA: ${branchPhone}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 13px; font-weight: bold; text-transform: uppercase;">${title}</div>
            <div style="font-size: 10px; color: #444;">Dokumen Resmi Operasional Gym</div>
            <div style="font-size: 10px; color: #444;">Tgl Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} WIB</div>
          </div>
        </div>

        <!-- Filter Info Bar -->
        <div style="background: #f4f4f5; border: 1px solid #d4d4d8; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 11px;">
          <div>
            <span>Trainer: <b>${filterTrainer}</b></span>
            <span style="margin: 0 8px;">|</span>
            <span>Periode: <b>${filterPeriod}</b></span>
          </div>
          <div>
            <span>Total: <b>${total} Sesi</b></span>
            <span style="margin: 0 6px;">•</span>
            <span style="color: #047857;">Selesai: <b>${completed}</b></span>
            <span style="margin: 0 6px;">•</span>
            <span style="color: #1d4ed8;">Terkonfirmasi: <b>${confirmed}</b></span>
            <span style="margin: 0 6px;">•</span>
            <span style="color: #b45309;">Pending: <b>${pending}</b></span>
          </div>
        </div>

        <!-- Tabel Roster Sesi PT Formal -->
        <table class="table-roster">
          <thead>
            <tr style="background: #f4f4f5;">
              <th style="width: 35px; text-align: center;">No</th>
              <th style="width: 80px;">Tanggal</th>
              <th style="width: 65px;">Waktu</th>
              <th style="width: 140px;">Member</th>
              <th style="width: 120px;">Trainer</th>
              <th style="width: 85px; text-align: center;">Status</th>
              <th>Catatan / Program</th>
              <th style="width: 70px; text-align: center;">Paraf PT</th>
              <th style="width: 70px; text-align: center;">Paraf Member</th>
            </tr>
          </thead>
          <tbody>
            ${
              schedules.length === 0
                ? '<tr><td colspan="9" style="text-align: center; padding: 20px;">Tidak ada sesi jadwal PT yang cocok dengan filter.</td></tr>'
                : schedules
                    .map((s, idx) => {
                      const isDone = s.status === 'Selesai';
                      const isConf = s.valTrainer || s.valStaf;
                      const statusBg = isDone ? '#dcfce7' : isConf ? '#dbeafe' : '#fef3c7';
                      const statusColor = isDone ? '#15803d' : isConf ? '#1e40af' : '#b45309';

                      return `
                      <tr class="page-break-avoid">
                        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                        <td>${s.date}</td>
                        <td style="font-weight: bold;">${s.time} WIB</td>
                        <td>
                          <b>${s.memberName}</b>
                          ${s.bundleName ? `<div style="font-size: 9px; color: #d97706;">🎁 ${s.bundleName}</div>` : ''}
                        </td>
                        <td><b>${s.trainer}</b></td>
                        <td style="text-align: center;">
                          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; background: ${statusBg}; color: ${statusColor};">
                            ${s.status}
                          </span>
                        </td>
                        <td style="font-size: 10px; color: #444;">${s.note || '-'}</td>
                        <td style="text-align: center; font-size: 9px;">${s.valTrainer ? '✓ Valid' : '[ &nbsp; &nbsp; ]'}</td>
                        <td style="text-align: center; font-size: 9px;">${s.valMember ? '✓ Valid' : '[ &nbsp; &nbsp; ]'}</td>
                      </tr>
                    `;
                    })
                    .join('')
            }
          </tbody>
        </table>

        <!-- Legalitas & Persetujuan Supervisor -->
        <div class="signature-grid page-break-avoid" style="margin-top: 30px;">
          <div class="sig-box">
            <div style="font-size: 10px; color: #555;">Dibuat Oleh:</div>
            <div class="sig-line">Resepsionis / Front Desk Kasir</div>
            <div style="font-size: 9px; color: #666;">Petugas Operasional</div>
          </div>
          <div class="sig-box">
            <div style="font-size: 10px; color: #555;">Diverifikasi Oleh:</div>
            <div class="sig-line">Head Coach / Lead Trainer</div>
            <div style="font-size: 9px; color: #666;">Koordinator Personal Trainer</div>
          </div>
          <div class="sig-box">
            <div style="font-size: 10px; color: #555;">Mengetahui & Menyetujui:</div>
            <div class="sig-line">Branch / General Manager</div>
            <div style="font-size: 9px; color: #666;">Manajemen GymPro</div>
          </div>
        </div>

        <div style="margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 6px; font-size: 9px; color: #71717a; display: flex; justify-content: space-between;">
          <span>Sistem Manajemen GymPro ERP Enterprise • Modul Jadwal & Kalender Personal Trainer</span>
          <span>Halaman 1 dari 1</span>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML Slip Kunci Loker & Check-in (Thermal & A4).
 */
export function generateLockerSlipHtml(
  data: {
    member: Member;
    lockerNumber?: number | null;
    lockerLabel?: string;
    gender: string;
    timeIn: string;
    type: string;
    hasTowel: boolean;
  },
  branch?: GymBranch,
  paperSize: PrintPaperSize = '80mm',
  options: { gymName?: string } = {}
): string {
  const isThermal = paperSize === '58mm' || paperSize === '80mm';
  const { gymName = 'GYMPRO FITNESS & WELLNESS' } = options;
  const branchName = branch?.name || 'Cabang Utama Flagship';
  const branchPhone = branch?.whatsapp || branch?.phone || '0812-9876-5432';
  const lockerDisplay = data.lockerLabel || (data.lockerNumber ? `#${data.lockerNumber}` : 'Tanpa Loker');

  const styles = getUniversalPrintStyles(paperSize);

  return `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Slip Loker - ${data.member.name}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="text-center">
          <div class="font-black text-lg uppercase">${gymName}</div>
          <div class="text-xs">${branchName}</div>
          <div class="text-xs">Telp/WA: ${branchPhone}</div>
        </div>

        <div class="double"></div>
        <div class="text-center font-bold text-sm uppercase">SLIP CHECK-IN & KUNCI LOKER</div>
        <div class="dashed"></div>

        <div class="text-center my-2">
          <div class="text-xs font-bold uppercase">NOMOR KUNCI LOKER</div>
          <div style="font-size: ${isThermal ? '28px' : '36px'}; font-weight: 900; letter-spacing: 2px;">
            ${lockerDisplay}
          </div>
          <div class="text-xs">Zona Area: <b>Loker ${data.gender}</b></div>
        </div>

        <div class="dashed"></div>

        <div class="flex justify-between my-1">
          <span>Nama Member:</span>
          <span class="font-bold">${data.member.name}</span>
        </div>
        <div class="flex justify-between my-1">
          <span>ID Member:</span>
          <span>${data.member.id}</span>
        </div>
        <div class="flex justify-between my-1">
          <span>Kunjungan:</span>
          <span class="font-bold">${data.type}</span>
        </div>
        <div class="flex justify-between my-1">
          <span>Waktu Check-In:</span>
          <span class="font-bold">${data.timeIn} WIB</span>
        </div>
        <div class="flex justify-between my-1">
          <span>Fasilitas Handuk:</span>
          <span class="font-bold">${data.hasTowel ? '1 Pcs Diberikan ✓' : 'Tidak Ambil'}</span>
        </div>

        <div class="dashed"></div>
        <div class="text-center text-xs">
          <b>PEMBERITAHUAN RESEPSIONIS:</b><br>
          Harap kembalikan kunci loker & handuk ke meja resepsionis saat selesai berlatih.<br>
          Denda kehilangan kunci loker: Rp 50.000.
        </div>

        <div class="dashed"></div>
        <div class="text-center text-xs">
          Selamat Berlatih & Salam Sehat!
        </div>

        ${
          isThermal
            ? '<div style="margin-top: 24px; text-align: center; font-size: 8px; color: #666;">-- [Potong Kertas] --</div>'
            : ''
        }
      </body>
    </html>
  `;
}

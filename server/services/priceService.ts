import { db, PackageEntity } from '../database/db';
import { AuditService } from './auditService';

export interface PriceCalculationItem {
  packageId: string;
  quantity: number;
}

export interface PriceCalculationResult {
  items: {
    packageId: string;
    packageName: string;
    category: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  taxAmount: number;
  total: number;
}

export class PriceService {
  /**
   * Price & Transaction Security:
   * Backend retrieves official price from database.
   * Frontend can NEVER dictate price or total.
   */
  static calculateOfficialTotal(
    items: PriceCalculationItem[],
    discountCode?: string,
    claimedFrontendTotal?: number,
    userId?: string,
    ipAddress?: string | null
  ): PriceCalculationResult {
    let subtotal = 0;
    const processedItems: PriceCalculationResult['items'] = [];

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error('Jumlah pembelian (quantity) harus lebih besar dari nol.');
      }

      const officialPkg = db.packages.get(item.packageId);
      if (!officialPkg || !officialPkg.active) {
        throw new Error(`Paket dengan ID '${item.packageId}' tidak ditemukan atau sedang nonaktif.`);
      }

      const itemSubtotal = officialPkg.price * item.quantity;
      subtotal += itemSubtotal;

      processedItems.push({
        packageId: officialPkg.id,
        packageName: officialPkg.name,
        category: officialPkg.category,
        unitPrice: officialPkg.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    // Apply official server-side discount
    let discountAmount = 0;
    if (discountCode) {
      const cleanCode = discountCode.trim().toUpperCase();
      if (cleanCode === 'FITPRO10') {
        discountAmount = Math.round(subtotal * 0.10); // 10%
      } else if (cleanCode === 'GYMPRO50K') {
        discountAmount = Math.min(50000, subtotal);
      } else {
        throw new Error(`Kode voucher / diskon '${discountCode}' tidak valid atau telah kedaluwarsa.`);
      }
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = 0; // Tax configuration
    const total = taxableAmount + taxAmount;

    // Detect price tampering attempt if frontend sent an altered total
    if (claimedFrontendTotal !== undefined && claimedFrontendTotal !== total) {
      AuditService.recordSecurityEvent({
        eventType: 'PRICE_TAMPER_ATTEMPT',
        severity: 'HIGH',
        ipAddress,
        userId,
        details: `Terdeteksi percobaan manipulasi harga! Frontend mengklaim total: Rp ${claimedFrontendTotal.toLocaleString('id-ID')}, namun kalkulasi resmi backend adalah: Rp ${total.toLocaleString('id-ID')}.`
      });

      // Disallow frontend manipulation
      throw new Error(`Integritas harga gagal: Nilai transaksi tidak sesuai dengan tarif resmi GymPro.`);
    }

    return {
      items: processedItems,
      subtotal,
      discountAmount,
      discountCode: discountAmount > 0 ? discountCode : undefined,
      taxAmount,
      total
    };
  }
}

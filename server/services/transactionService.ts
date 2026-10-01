import { db, TransactionEntity, MemberEntity } from '../database/db';
import { PriceService, PriceCalculationItem } from './priceService';
import { AuditService } from './auditService';

export class TransactionService {
  /**
   * Secure Checkout & Transaction:
   * Uses transactional atomicity (all-or-nothing).
   * Prices calculated strictly on the backend.
   */
  static async checkout(params: {
    memberId?: string;
    items: PriceCalculationItem[];
    paymentMethod: string;
    cashierId: string;
    discountCode?: string;
    claimedTotal?: number;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<TransactionEntity> {
    const cashier = db.users.get(params.cashierId);
    if (!cashier) throw new Error('Kasir tidak terdaftar.');

    // 1. Calculate price strictly from backend DB
    const calculation = PriceService.calculateOfficialTotal(
      params.items,
      params.discountCode,
      params.claimedTotal,
      params.cashierId,
      params.ipAddress
    );

    // 2. Transaction Atomicity Simulation
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTransaction: TransactionEntity = {
      id: 'TRX-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      invoiceNumber,
      memberId: params.memberId || null,
      cashierId: params.cashierId,
      subtotal: calculation.subtotal,
      discount: calculation.discountAmount,
      tax: calculation.taxAmount,
      total: calculation.total,
      status: 'PAID',
      paymentMethod: params.paymentMethod,
      isVoided: false,
      voidReason: null,
      voidedBy: null,
      voidedAt: null,
      closingId: null,
      createdAt: new Date()
    };

    // Save transaction
    db.transactions.set(newTransaction.id, newTransaction);

    // If membership purchased, activate/update member status
    if (params.memberId && db.members.has(params.memberId)) {
      const member = db.members.get(params.memberId)!;
      member.status = 'Aktif';
      member.updatedAt = new Date();
    }

    // Create Audit Log
    AuditService.log({
      userId: params.cashierId,
      action: 'PAYMENT_SUCCESS',
      module: 'TRANSACTION',
      recordId: newTransaction.id,
      newValue: {
        invoiceNumber,
        total: newTransaction.total,
        paymentMethod: newTransaction.paymentMethod,
        itemsCount: calculation.items.length
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });

    return newTransaction;
  }

  /**
   * Secure Void / Refund:
   * Requires authorization (ADMIN or LEADER), reason, cashier id, and produces audit log.
   * Protects daily closing integrity (cannot void transactions from locked daily closing).
   */
  static async voidTransaction(params: {
    transactionId: string;
    reason: string;
    authorizedUserId: string;
    authorizedUserRole: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<TransactionEntity> {
    // 1. Authorization validation: Only ADMIN or LEADER can void
    if (params.authorizedUserRole !== 'ADMIN' && params.authorizedUserRole !== 'LEADER') {
      AuditService.recordSecurityEvent({
        eventType: 'UNAUTHORIZED_VOID_ATTEMPT',
        severity: 'HIGH',
        ipAddress: params.ipAddress,
        userId: params.authorizedUserId,
        details: `User dengan role '${params.authorizedUserRole}' mencoba void transaksi ${params.transactionId} tanpa izin otoritas.`
      });
      throw new Error('Akses ditolak: Pembatalan (Void) memerlukan otorisasi Supervisor / Branch Manager atau Super Admin.');
    }

    // 2. Reason validation
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('Alasan pembatalan (Void) wajib diisi minimal 5 karakter.');
    }

    const trx = db.transactions.get(params.transactionId);
    if (!trx) throw new Error('Transaksi tidak ditemukan.');

    if (trx.isVoided) {
      throw new Error('Transaksi ini sudah berstatus Void sebelumnya.');
    }

    // 3. Daily Closing Integrity Check
    if (trx.closingId) {
      AuditService.recordSecurityEvent({
        eventType: 'VOID_CLOSED_TRANSACTION_ATTEMPT',
        severity: 'HIGH',
        ipAddress: params.ipAddress,
        userId: params.authorizedUserId,
        details: `Percobaan void transaksi '${trx.invoiceNumber}' yang sudah masuk dalam Daily Closing #${trx.closingId}.`
      });
      throw new Error('Transaksi tidak dapat di-void karena sudah masuk dalam pembukuan Daily Closing kasir. Buat transaksi penyesuaian (adjustment) untuk koreksi.');
    }

    const oldValue = { isVoided: trx.isVoided, status: trx.status };

    trx.isVoided = true;
    trx.status = 'VOIDED';
    trx.voidReason = params.reason.trim();
    trx.voidedBy = params.authorizedUserId;
    trx.voidedAt = new Date();

    AuditService.log({
      userId: params.authorizedUserId,
      action: 'VOID_TRANSACTION',
      module: 'TRANSACTION',
      recordId: trx.id,
      oldValue,
      newValue: {
        isVoided: true,
        status: 'VOIDED',
        reason: trx.voidReason,
        voidedBy: trx.voidedBy
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });

    return trx;
  }
}

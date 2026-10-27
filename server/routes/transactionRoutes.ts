import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { sensitiveActionRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validator';
import { PriceService } from '../services/priceService';
import { TransactionService } from '../services/transactionService';

export const transactionRouter = Router();

const checkoutSchema = z.object({
  memberId: z.string().optional(),
  items: z.array(
    z.object({
      packageId: z.string().min(1, 'Package ID wajib diisi.'),
      quantity: z.number().int().positive('Jumlah harus minimal 1.')
    })
  ).min(1, 'Minimal 1 item belanja.'),
  paymentMethod: z.enum(['CASH', 'QRIS', 'TRANSFER', 'DEBIT', 'KREDIT']),
  discountCode: z.string().optional(),
  claimedTotal: z.number().optional()
});

const voidSchema = z.object({
  reason: z.string().min(5, 'Alasan pembatalan (Void) wajib diisi minimal 5 karakter.')
});

// 1. POST /api/transactions/calculate-price (Official Price Calculation)
transactionRouter.post(
  '/calculate-price',
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      const { items, discountCode, claimedTotal } = req.body;
      const result = PriceService.calculateOfficialTotal(
        items || [],
        discountCode,
        claimedTotal,
        req.user?.userId,
        req.ip
      );

      return res.status(200).json({
        success: true,
        calculation: result
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);

// 2. POST /api/transactions/checkout (Transactional Atomicity)
transactionRouter.post(
  '/checkout',
  authMiddleware,
  requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR']),
  validateRequest({ body: checkoutSchema }),
  async (req: Request, res: Response) => {
    try {
      const { memberId, items, paymentMethod, discountCode, claimedTotal } = req.body;
      const cashierId = req.user!.userId;

      const transaction = await TransactionService.checkout({
        memberId,
        items,
        paymentMethod,
        cashierId,
        discountCode,
        claimedTotal,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.status(201).json({
        success: true,
        message: 'Transaksi dan pembayaran berhasil diverifikasi backend.',
        transaction
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);

// 3. POST /api/transactions/:id/void (Protected by ADMIN or LEADER & Rate Limited)
transactionRouter.post(
  '/:id/void',
  authMiddleware,
  sensitiveActionRateLimiter,
  requireRoles(['ADMIN', 'LEADER']),
  validateRequest({ body: voidSchema }),
  async (req: Request, res: Response) => {
    try {
      const transactionId = req.params.id;
      const { reason } = req.body;

      const voidedTrx = await TransactionService.voidTransaction({
        transactionId,
        reason,
        authorizedUserId: req.user!.userId,
        authorizedUserRole: req.user!.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({
        success: true,
        message: `Transaksi '${voidedTrx.invoiceNumber}' berhasil dibatalkan (Void).`,
        transaction: voidedTrx
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);

// 4. GET /api/transactions
transactionRouter.get(
  '/',
  authMiddleware,
  requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR']),
  (req: Request, res: Response) => {
    const list = Array.from(db.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  }
);

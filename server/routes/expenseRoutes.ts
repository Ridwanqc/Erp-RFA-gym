import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, CompanyExpenseEntity, ExpenseCategoryEntity } from '../database/db';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { sensitiveActionRateLimiter } from '../middleware/rateLimiter';
import { AuditService } from '../services/auditService';

export const expenseRouter = Router();

const createExpenseSchema = z.object({
  expenseNumber: z.string().optional(),
  date: z.string().min(8, 'Tanggal wajib diisi.'),
  branchId: z.string().min(1, 'Cabang wajib dipilih.'),
  branchName: z.string().min(1, 'Nama cabang wajib ada.'),
  categoryId: z.string().min(1, 'Kategori pengeluaran wajib dipilih.'),
  categoryName: z.string().min(1, 'Nama kategori wajib ada.'),
  subcategory: z.string().min(1, 'Subkategori wajib dipilih.'),
  name: z.string().min(3, 'Nama pengeluaran minimal 3 karakter.'),
  description: z.string().optional(),
  amount: z.number().positive('Nominal pengeluaran harus lebih besar dari 0.'),
  accountingType: z.enum([
    'BEBAN_OPERASIONAL',
    'BEBAN_SDM',
    'BEBAN_FASILITAS',
    'BEBAN_FINANSIAL',
    'ASET_TETAP',
    'PERSEDIAAN',
    'PEMBAYARAN_UTANG'
  ]),
  paymentMethod: z.enum(['Kas', 'Transfer Bank', 'QRIS', 'Kartu Debit/EDC', 'Lainnya']),
  sourceAccount: z.string().min(1, 'Sumber dana / rekening wajib dipilih.'),
  vendorOrBeneficiary: z.string().min(2, 'Nama penerima atau vendor wajib diisi.'),
  picStaffId: z.string().min(1, 'PIC / Pengaju wajib ada.'),
  picStaffName: z.string().min(1, 'Nama PIC wajib ada.'),
  invoiceRefNumber: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentFileName: z.string().optional(),
  approvalStatus: z.enum(['Draft', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Dibatalkan']).default('Menunggu Persetujuan'),
  notes: z.string().optional()
});

// 1. GET /api/expenses - List all expenses with optional filtering (Staff & Admin only)
expenseRouter.get(
  '/',
  authMiddleware,
  requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR']),
  (req: Request, res: Response) => {
    try {
      const { branchId, status, dateFrom, dateTo } = req.query;
      let list = Array.from(db.companyExpenses.values());

      // Branch isolation: non-admin staff can only view expenses for their assigned branch
      if (req.user?.role !== 'ADMIN' && req.user?.branchId && req.user.branchId !== 'BR-ALL') {
        list = list.filter((e) => e.branchId === req.user?.branchId);
      } else if (branchId && branchId !== 'ALL' && branchId !== 'BR-ALL') {
        list = list.filter((e) => e.branchId === branchId);
      }

      if (status && status !== 'ALL') {
        list = list.filter((e) => e.approvalStatus === status);
      }
      if (dateFrom) {
        list = list.filter((e) => e.date >= String(dateFrom));
      }
      if (dateTo) {
        list = list.filter((e) => e.date <= String(dateTo));
      }

      // Sort descending by date & created
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({
        success: true,
        data: list
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// 2. POST /api/expenses - Create new expense (Staff & Admin only with rate limiting)
expenseRouter.post(
  '/',
  authMiddleware,
  requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR']),
  sensitiveActionRateLimiter,
  (req: Request, res: Response) => {
    try {
      const validated = createExpenseSchema.parse(req.body);

      // Branch enforcement: non-admin staff cannot create expenses for other branches
      if (req.user?.role !== 'ADMIN' && req.user?.branchId && req.user.branchId !== 'BR-ALL') {
        if (validated.branchId !== req.user.branchId) {
          return res.status(403).json({
            success: false,
            message: 'Akses ditolak: Anda hanya berwenang mengajukan pengeluaran untuk cabang kerja Anda sendiri.'
          });
        }
      }

      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedNumber = validated.expenseNumber || `EXP-${dateStr}-${randomSuffix}`;
      const id = `EXP-${Date.now()}-${randomSuffix}`;

      const newExpense: CompanyExpenseEntity = {
        id,
        expenseNumber: generatedNumber,
        date: validated.date,
        branchId: validated.branchId,
        branchName: validated.branchName,
        categoryId: validated.categoryId,
        categoryName: validated.categoryName,
        subcategory: validated.subcategory,
        name: validated.name,
        description: validated.description || '',
      amount: validated.amount,
      accountingType: validated.accountingType,
      paymentMethod: validated.paymentMethod,
      sourceAccount: validated.sourceAccount,
      vendorOrBeneficiary: validated.vendorOrBeneficiary,
      picStaffId: validated.picStaffId,
      picStaffName: validated.picStaffName,
      invoiceRefNumber: validated.invoiceRefNumber,
      attachmentUrl: validated.attachmentUrl,
      attachmentFileName: validated.attachmentFileName,
      approvalStatus: validated.approvalStatus,
      paymentStatus: 'Belum Dibayar',
      paidAmount: 0,
      balanceRemaining: validated.amount,
      notes: validated.notes,
      auditLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          userId: req.user?.userId || 'SYSTEM',
          userName: req.user?.username || 'User',
          action: validated.approvalStatus === 'Draft' ? 'Dibuat (Draft)' : 'Diajukan Persetujuan',
          notes: validated.notes || 'Pengajuan pengeluaran dibuat'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.companyExpenses.set(id, newExpense);

    AuditService.log({
      userId: req.user?.userId || null,
      action: 'CREATE_EXPENSE',
      module: 'FINANCE_EXPENSES',
      recordId: id,
      newValue: { expenseNumber: generatedNumber, amount: validated.amount }
    });

    return res.status(201).json({
      success: true,
      data: newExpense
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// 3. POST /api/expenses/:id/approve - Approve expense (Admin & Manager only)
expenseRouter.post('/:id/approve', authMiddleware, requireRoles(['ADMIN', 'LEADER']), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expense = db.companyExpenses.get(id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Transaksi pengeluaran tidak ditemukan.' });
    }

    if (expense.approvalStatus === 'Disetujui') {
      return res.status(400).json({ success: false, message: 'Transaksi ini sudah disetujui sebelumnya.' });
    }

    expense.approvalStatus = 'Disetujui';
    expense.approvedByUserId = req.user?.userId;
    expense.approvedByUserName = req.user?.username;
    expense.approvedAt = new Date().toISOString();
    expense.updatedAt = new Date().toISOString();

    expense.auditLogs.push({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      userId: req.user?.userId || 'SYSTEM',
      userName: req.user?.username || 'Approver',
      action: 'Disetujui',
      notes: req.body.notes || 'Pengeluaran disetujui'
    });

    db.companyExpenses.set(id, expense);

    AuditService.log({
      userId: req.user?.userId || null,
      action: 'APPROVE_EXPENSE',
      module: 'FINANCE_EXPENSES',
      recordId: id,
      newValue: { status: 'Disetujui', approver: req.user?.username }
    });

    return res.status(200).json({ success: true, data: expense });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST /api/expenses/:id/reject - Reject expense (Admin & Manager only)
expenseRouter.post('/:id/reject', authMiddleware, requireRoles(['ADMIN', 'LEADER']), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi minimal 3 karakter.' });
    }

    const expense = db.companyExpenses.get(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Transaksi pengeluaran tidak ditemukan.' });
    }

    expense.approvalStatus = 'Ditolak';
    expense.rejectionReason = reason;
    expense.updatedAt = new Date().toISOString();

    expense.auditLogs.push({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      userId: req.user?.userId || 'SYSTEM',
      userName: req.user?.username || 'Approver',
      action: 'Ditolak',
      notes: `Alasan: ${reason}`
    });

    db.companyExpenses.set(id, expense);

    return res.status(200).json({ success: true, data: expense });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. POST /api/expenses/:id/pay - Record payment (Admin, Leader, and Cashier only)
expenseRouter.post(
  '/:id/pay',
  authMiddleware,
  requireRoles(['ADMIN', 'LEADER', 'KASIR']),
  sensitiveActionRateLimiter,
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paidAmount, paidAccount, notes } = req.body;

      const expense = db.companyExpenses.get(id);
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
      }

      if (expense.approvalStatus !== 'Disetujui') {
        return res.status(400).json({ success: false, message: 'Hanya transaksi yang telah disetujui yang dapat dibayar.' });
      }

      const payVal = Number(paidAmount);
      if (!payVal || isNaN(payVal) || payVal <= 0) {
        return res.status(400).json({ success: false, message: 'Nominal pembayaran harus berupa angka positif lebih besar dari 0.' });
      }

      // Overpayment prevention
      if (payVal > expense.balanceRemaining) {
        return res.status(400).json({
          success: false,
          message: `Nominal pembayaran (Rp ${payVal.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${expense.balanceRemaining.toLocaleString('id-ID')}).`
        });
      }

      const newPaidTotal = expense.paidAmount + payVal;
      const newRemaining = Math.max(0, expense.amount - newPaidTotal);

      expense.paidAmount = newPaidTotal;
      expense.balanceRemaining = newRemaining;
      expense.paymentStatus = newRemaining === 0 ? 'Lunas' : 'Dibayar Sebagian';
      expense.paidAt = new Date().toISOString();
      expense.paidByUserId = req.user?.userId;
      expense.paidByUserName = req.user?.username;
      expense.paidAccount = paidAccount || expense.sourceAccount;
      expense.updatedAt = new Date().toISOString();

      expense.auditLogs.push({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        userId: req.user?.userId || 'SYSTEM',
        userName: req.user?.username || 'Cashier',
        action: newRemaining === 0 ? 'Pembayaran Lunas Dicatat' : 'Pembayaran Sebagian Dicatat',
        notes: `Dibayar: Rp ${payVal.toLocaleString('id-ID')} via ${expense.paidAccount}. Sisa: Rp ${newRemaining.toLocaleString('id-ID')}`
      });

      db.companyExpenses.set(id, expense);

      AuditService.log({
        userId: req.user?.userId,
        action: 'PAY_EXPENSE',
        module: 'FINANCE_EXPENSES',
        recordId: id,
        newValue: { paidAmount: payVal, balanceRemaining: newRemaining, paymentStatus: expense.paymentStatus },
        ipAddress: req.ip
      });

      return res.status(200).json({ success: true, data: expense });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// 6. GET /api/expenses/categories - Get category list (Staff & Admin only)
expenseRouter.get(
  '/categories',
  authMiddleware,
  requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR']),
  (_req: Request, res: Response) => {
    const categories = Array.from(db.expenseCategories.values());
    return res.status(200).json({ success: true, data: categories });
  }
);

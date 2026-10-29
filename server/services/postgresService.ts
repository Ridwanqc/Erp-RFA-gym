import { pgPool } from '../database/dbConnection';
import { UserEntity } from '../database/db';

export class PostgresService {
  /**
   * Check if PostgreSQL is configured and active
   */
  static isConnected(): boolean {
    return pgPool !== null;
  }

  /**
   * Search user by username or email directly from PostgreSQL
   */
  static async getUserByUsernameOrEmail(identifier: string): Promise<UserEntity | null> {
    if (!pgPool) return null;
    try {
      const clean = identifier.trim().toLowerCase();
      const res = await pgPool.query(
        `SELECT 
          id, username, email, password_hash as "passwordHash", 
          name, role, status, branch_id as "branchId", branch_name as "branchName",
          failed_login_attempts as "failedLoginAttempts", 
          locked_until as "lockedUntil", 
          must_change_password as "mustChangePassword",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users 
        WHERE LOWER(username) = $1 OR LOWER(email) = $1 
        LIMIT 1`,
        [clean]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0] as UserEntity;
    } catch (err: any) {
      console.warn('[PostgresService] getUserByUsernameOrEmail failed:', err.message);
      return null;
    }
  }

  /**
   * Update user successful login timestamp & reset failed attempts in PostgreSQL
   */
  static async recordSuccessfulLogin(userId: string): Promise<void> {
    if (!pgPool) return;
    try {
      await pgPool.query(
        `UPDATE users 
         SET last_login_at = CURRENT_TIMESTAMP, 
             failed_login_attempts = 0, 
             locked_until = NULL,
             status = 'ACTIVE'
         WHERE id = $1`,
        [userId]
      );
    } catch (err: any) {
      console.warn('[PostgresService] recordSuccessfulLogin failed:', err.message);
    }
  }

  /**
   * Record failed login attempts or lockout in PostgreSQL
   */
  static async recordFailedLogin(userId: string, attempts: number, lockedUntil: Date | null): Promise<void> {
    if (!pgPool) return;
    try {
      await pgPool.query(
        `UPDATE users 
         SET failed_login_attempts = $1, 
             locked_until = $2,
             status = CASE WHEN $2 IS NOT NULL THEN 'LOCKED' ELSE status END
         WHERE id = $3`,
        [attempts, lockedUntil, userId]
      );
    } catch (err: any) {
      console.warn('[PostgresService] recordFailedLogin failed:', err.message);
    }
  }

  /**
   * Fetch all members from PostgreSQL
   */
  static async getMembers(branchId?: string): Promise<any[]> {
    if (!pgPool) return [];
    try {
      let query = `
        SELECT 
          id, member_code as "memberCode", name, phone, email, status, gender,
          join_date as "joinDate", expired, pt_quota as "ptQuota",
          assigned_trainer_id as "assignedTrainerId", branch_id as "branchId",
          photo, photo_path as "photoPath", is_frozen as "isFrozen", notes,
          created_at as "createdAt", updated_at as "updatedAt"
        FROM members
      `;
      const params: any[] = [];
      if (branchId && branchId !== 'ALL' && branchId !== 'BR-ALL') {
        query += ` WHERE branch_id = $1`;
        params.push(branchId);
      }
      query += ` ORDER BY created_at DESC`;
      const res = await pgPool.query(query, params);
      return res.rows;
    } catch (err: any) {
      console.warn('[PostgresService] getMembers failed:', err.message);
      return [];
    }
  }

  /**
   * Upsert a member in PostgreSQL
   */
  static async saveMember(member: any): Promise<boolean> {
    if (!pgPool) return false;
    try {
      await pgPool.query(
        `INSERT INTO members (
          id, member_code, name, phone, email, status, gender, join_date, expired,
          pt_quota, assigned_trainer_id, branch_id, photo, photo_path, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          status = EXCLUDED.status,
          pt_quota = EXCLUDED.pt_quota,
          assigned_trainer_id = EXCLUDED.assigned_trainer_id,
          branch_id = EXCLUDED.branch_id,
          photo = COALESCE(EXCLUDED.photo, members.photo),
          photo_path = COALESCE(EXCLUDED.photo_path, members.photo_path),
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP`,
        [
          member.id,
          member.memberCode || member.code || `MEM-${Date.now()}`,
          member.name,
          member.phone,
          member.email || null,
          member.status || 'Aktif',
          member.gender || 'L',
          member.joinDate || new Date(),
          member.expired || null,
          member.ptQuota || 0,
          member.assignedTrainerId || null,
          member.branchId || null,
          member.photo || null,
          member.photoPath || member.photo || null,
          member.notes || null
        ]
      );
      return true;
    } catch (err: any) {
      console.warn('[PostgresService] saveMember failed:', err.message);
      return false;
    }
  }

  /**
   * Fetch all products from PostgreSQL
   */
  static async getProducts(branchId?: string): Promise<any[]> {
    if (!pgPool) return [];
    try {
      let query = `SELECT id, name, cost, price, stock, cat, img, photo_path as "photoPath", branch_id as "branchId", branch_name as "branchName", is_active as "isActive" FROM products`;
      const params: any[] = [];
      if (branchId && branchId !== 'ALL' && branchId !== 'BR-ALL') {
        query += ` WHERE branch_id = $1`;
        params.push(branchId);
      }
      query += ` ORDER BY name ASC`;
      const res = await pgPool.query(query, params);
      return res.rows;
    } catch (err: any) {
      console.warn('[PostgresService] getProducts failed:', err.message);
      return [];
    }
  }

  /**
   * Fetch all packages from PostgreSQL
   */
  static async getPackages(): Promise<any[]> {
    if (!pgPool) return [];
    try {
      const res = await pgPool.query(`SELECT id, name, category, price, duration_days as "durationDays", sessions, active FROM packages WHERE active = true ORDER BY price ASC`);
      return res.rows;
    } catch (err: any) {
      console.warn('[PostgresService] getPackages failed:', err.message);
      return [];
    }
  }

  /**
   * Fetch all expenses from PostgreSQL
   */
  static async getExpenses(branchId?: string): Promise<any[]> {
    if (!pgPool) return [];
    try {
      let query = `
        SELECT 
          id, expense_number as "expenseNumber", expense_date as "date",
          branch_id as "branchId", category_id as "categoryId", category_name as "categoryName",
          subcategory, name, description, amount, accounting_type as "accountingType",
          payment_method as "paymentMethod", source_account as "sourceAccount",
          vendor_or_beneficiary as "vendorOrBeneficiary", pic_staff_id as "picStaffId",
          invoice_ref_number as "invoiceRefNumber", attachment_url as "attachmentUrl",
          photo_path as "photoPath", approval_status as "approvalStatus",
          paid_amount as "paidAmount", balance_remaining as "balanceRemaining",
          paid_at as "paidAt", paid_by_user_id as "paidByUserId",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM company_expenses
      `;
      const params: any[] = [];
      if (branchId && branchId !== 'ALL' && branchId !== 'BR-ALL') {
        query += ` WHERE branch_id = $1`;
        params.push(branchId);
      }
      query += ` ORDER BY expense_date DESC`;
      const res = await pgPool.query(query, params);
      return res.rows;
    } catch (err: any) {
      console.warn('[PostgresService] getExpenses failed:', err.message);
      return [];
    }
  }

  /**
   * Fetch database statistics and row counts
   */
  static async getDatabaseStats(): Promise<any> {
    if (!pgPool) {
      return {
        connected: false,
        mode: 'in_memory',
        message: 'DATABASE_URL belum dikonfigurasi di environment variables.'
      };
    }

    try {
      const [usersCnt, membersCnt, prodCnt, pkgCnt, trxCnt, expCnt] = await Promise.all([
        pgPool.query('SELECT COUNT(*) as count FROM users'),
        pgPool.query('SELECT COUNT(*) as count FROM members'),
        pgPool.query('SELECT COUNT(*) as count FROM products'),
        pgPool.query('SELECT COUNT(*) as count FROM packages'),
        pgPool.query('SELECT COUNT(*) as count FROM transactions'),
        pgPool.query('SELECT COUNT(*) as count FROM company_expenses')
      ]);

      return {
        connected: true,
        mode: 'postgresql_live',
        database: 'database-rfa',
        counts: {
          users: parseInt(usersCnt.rows[0]?.count || '0', 10),
          members: parseInt(membersCnt.rows[0]?.count || '0', 10),
          products: parseInt(prodCnt.rows[0]?.count || '0', 10),
          packages: parseInt(pkgCnt.rows[0]?.count || '0', 10),
          transactions: parseInt(trxCnt.rows[0]?.count || '0', 10),
          expenses: parseInt(expCnt.rows[0]?.count || '0', 10)
        }
      };
    } catch (err: any) {
      return {
        connected: false,
        error: err.message
      };
    }
  }
}

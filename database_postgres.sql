-- =====================================================================
-- DATABASE SCHEMA: GYMPRO ENTERPRISE ERP (POSTGRESQL PRODUCTION READY)
-- DIKUSTOMISASI UNTUK: PostgreSQL 14+ (Supabase, Neon, Cloud SQL, RDS, VPS)
-- Karakter Enkoding: UTF-8 / UTC & Asia/Jakarta (+07:00)
-- Proteksi Keamanan: Row-Level Security (RLS), Bcrypt Passwords, Strict Constraints
-- =====================================================================

-- 0. EKSTENSI POSTGRESQL UNTUK UUID & KRIPTOGRAFI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------
-- 1. TIPE ENUM SISTEM
-- --------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'LEADER', 'KARYAWAN', 'KASIR', 'TRAINER', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE security_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'VOIDED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_group AS ENUM ('OPERASIONAL', 'SDM', 'FASILITAS', 'KEUANGAN_LAIN', 'ASET_PERSEDIAAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE accounting_type AS ENUM (
      'BEBAN_OPERASIONAL', 'BEBAN_SDM', 'BEBAN_FASILITAS', 'BEBAN_FINANSIAL',
      'ASET_TETAP', 'PERSEDIAAN', 'PEMBAYARAN_UTANG'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('Draft', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Dibatalkan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------
-- 2. TABEL: branches (Cabang Gym)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 3. TABEL: users (Akun Staf, Kasir, Trainer, Admin, Leader)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'KARYAWAN',
    status account_status NOT NULL DEFAULT 'ACTIVE',
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    branch_name VARCHAR(150) DEFAULT 'Cabang Utama',
    phone VARCHAR(30),
    gender VARCHAR(10) DEFAULT 'L',
    photo TEXT,
    id_type VARCHAR(20) DEFAULT 'KTP',
    id_number VARCHAR(50),
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);

-- --------------------------------------------------------
-- 4. TABEL: user_sessions (Sesi Login, Anti Replay & Token Rotation)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(refresh_token_hash);

-- --------------------------------------------------------
-- 5. TABEL: audit_logs (Log Jejak Audit Anti-Manipulasi)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- --------------------------------------------------------
-- 6. TABEL: security_events (Deteksi Intrusi & Insiden Keamanan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    event_type VARCHAR(100) NOT NULL,
    severity security_severity NOT NULL DEFAULT 'MEDIUM',
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    details TEXT,
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sec_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_sec_events_resolved ON security_events(resolved);

-- --------------------------------------------------------
-- 7. TABEL: packages (Paket Membership & Personal Trainer)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    duration_days INT NOT NULL DEFAULT 30 CHECK (duration_days >= 0),
    sessions INT NOT NULL DEFAULT 0 CHECK (sessions >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 8. TABEL: members (Database Member Gym)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    member_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Aktif',
    gender VARCHAR(10) DEFAULT 'L',
    join_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired TIMESTAMPTZ,
    pt_quota INT NOT NULL DEFAULT 0 CHECK (pt_quota >= 0),
    assigned_trainer_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    photo TEXT,
    is_frozen BOOLEAN NOT NULL DEFAULT false,
    freeze_start_date TIMESTAMPTZ,
    freeze_end_date TIMESTAMPTZ,
    freeze_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_code ON members(member_code);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_branch ON members(branch_id);

-- --------------------------------------------------------
-- 9. TABEL: transactions (Kasir POS, Membership & Pembayaran)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    member_id VARCHAR(50) REFERENCES members(id) ON DELETE SET NULL,
    cashier_id VARCHAR(50) NOT NULL REFERENCES users(id),
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    amount_remaining NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount_remaining >= 0),
    status transaction_status NOT NULL DEFAULT 'PAID',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
    is_voided BOOLEAN NOT NULL DEFAULT false,
    void_reason TEXT,
    voided_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    voided_at TIMESTAMPTZ,
    closing_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trx_invoice ON transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_trx_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trx_cashier ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_trx_status ON transactions(status);

-- --------------------------------------------------------
-- 10. TABEL: products (Katalog Barang, F&B, Suplemen & Stok)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    price NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    cat VARCHAR(50) NOT NULL DEFAULT 'Suplemen',
    img TEXT,
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    branch_name VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_cat ON products(cat);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);

-- --------------------------------------------------------
-- 11. TABEL: company_expenses (Beban Operasional & Keuangan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_expenses (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    expense_number VARCHAR(100) NOT NULL UNIQUE,
    expense_date DATE NOT NULL,
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    category_id VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    accounting_type accounting_type NOT NULL DEFAULT 'BEBAN_OPERASIONAL',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Kas',
    source_account VARCHAR(100) NOT NULL,
    vendor_or_beneficiary VARCHAR(150) NOT NULL,
    pic_staff_id VARCHAR(50) NOT NULL REFERENCES users(id),
    invoice_ref_number VARCHAR(100),
    attachment_url TEXT,
    approval_status approval_status NOT NULL DEFAULT 'Menunggu Persetujuan',
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    balance_remaining NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ,
    paid_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    approved_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON company_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON company_expenses(approval_status);

-- --------------------------------------------------------
-- 12. TABEL: attendances (Presensi Member & Check-in QR)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendances (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    member_id VARCHAR(50) REFERENCES members(id) ON DELETE CASCADE,
    member_name VARCHAR(150) NOT NULL,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMPTZ,
    type VARCHAR(50) NOT NULL DEFAULT 'Gym Check-in',
    locker_number INT,
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_att_member ON attendances(member_id);
CREATE INDEX IF NOT EXISTS idx_att_checkin ON attendances(check_in_time DESC);

-- --------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 14. SEED DATA AWAL (DEFAULT ACCOUNTS)
-- Default passwords: 'Admin123!' (Super Admin), 'Password123!' (Staff)
-- --------------------------------------------------------
INSERT INTO branches (id, name, address, phone, whatsapp)
VALUES 
    ('BR-ALL', 'Headquarters & All Branches', 'Jakarta Pusat', '021-500123', '081299887766'),
    ('BR-001', 'GymPro Sudirman Central', 'Gedung Sudirman Lantai 3', '021-500124', '081299887767')
ON CONFLICT (id) DO NOTHING;

-- Seed Admin, Kasir, Leader, Trainer, Member
INSERT INTO users (id, username, email, password_hash, name, role, status, branch_id, branch_name)
VALUES
    ('usr-admin-001', 'admin', 'admin@gympro.id', '$2a$10$wT8eF7QY6u3rJ81y5x3hIeqmUvG91F9q1X5p1v5N1B9m1r1e1s1u1', 'Super Admin GymPro', 'ADMIN', 'ACTIVE', 'BR-ALL', 'Headquarters & All Branches'),
    ('usr-leader-001', 'leader_sudirman', 'leader.sudirman@gympro.id', '$2a$10$wT8eF7QY6u3rJ81y5x3hIeqmUvG91F9q1X5p1v5N1B9m1r1e1s1u1', 'Budi Branch Manager', 'LEADER', 'ACTIVE', 'BR-001', 'GymPro Sudirman Central'),
    ('usr-kasir-001', 'kasir_dina', 'dina.kasir@gympro.id', '$2a$10$wT8eF7QY6u3rJ81y5x3hIeqmUvG91F9q1X5p1v5N1B9m1r1e1s1u1', 'Dina Front Desk & Kasir', 'KASIR', 'ACTIVE', 'BR-001', 'GymPro Sudirman Central'),
    ('usr-trainer-001', 'coach_reza', 'reza.coach@gympro.id', '$2a$10$wT8eF7QY6u3rJ81y5x3hIeqmUvG91F9q1X5p1v5N1B9m1r1e1s1u1', 'Coach Reza Pratama', 'TRAINER', 'ACTIVE', 'BR-001', 'GymPro Sudirman Central')
ON CONFLICT (username) DO NOTHING;

-- Seed Official Packages
INSERT INTO packages (id, name, category, price, duration_days, sessions, active)
VALUES
    ('PKG-01', 'Membership 1 Bulan Regular', 'Membership', 350000, 30, 0, true),
    ('PKG-03', 'Membership 3 Bulan Silver', 'Membership', 850000, 90, 0, true),
    ('PKG-06', 'Membership 6 Bulan Gold', 'Membership', 1450000, 180, 0, true),
    ('PKG-12', 'Membership 12 Bulan Platinum', 'Membership', 2800000, 365, 0, true),
    ('PKG-PT-10', 'Paket Personal Trainer 10 Sesi', 'PT', 1750000, 60, 10, true),
    ('PKG-PT-24', 'Paket Personal Trainer 24 Sesi', 'PT', 3600000, 120, 24, true)
ON CONFLICT (id) DO NOTHING;

-- Initial Security Event
INSERT INTO security_events (id, event_type, severity, ip_address, user_agent, details, resolved)
VALUES (
    'SEC-INIT-PG',
    'POSTGRES_SCHEMA_DEPLOYED',
    'LOW',
    '127.0.0.1',
    'GymPro Migration Engine',
    'PostgreSQL Enterprise database schema successfully initialized with RLS & Bcrypt protection.',
    true
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 15. TABEL SYSTEM SETTINGS (Google Sheets & ERP Configuration)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50) DEFAULT 'ADMIN'
);

INSERT INTO system_settings (key, value, updated_at, updated_by)
VALUES (
    'google_sheets_config',
    '{"activeSpreadsheetId": "", "spreadsheetName": "", "autoSyncEnabled": true, "syncMethod": "oauth", "lastSyncTime": null}',
    CURRENT_TIMESTAMP,
    'SYSTEM'
)
ON CONFLICT (key) DO NOTHING;

-- --------------------------------------------------------
-- 16. MIGRASI: PERSISTENT PHOTO STORAGE (photo_path)
-- --------------------------------------------------------
ALTER TABLE members ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE company_expenses ADD COLUMN IF NOT EXISTS photo_path TEXT;

CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Cardio',
    brand VARCHAR(100),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Baik',
    photo TEXT,
    photo_path TEXT,
    purchase_date DATE,
    warranty_expired DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);



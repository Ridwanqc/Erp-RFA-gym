import bcrypt from 'bcryptjs';

export interface UserEntity {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'ADMIN' | 'LEADER' | 'KARYAWAN' | 'KASIR' | 'TRAINER' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
  branchId?: string;
  branchName?: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessionEntity {
  id: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface AuditLogEntity {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  recordId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface SecurityEventEntity {
  id: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  details: string | null;
  resolved: boolean;
  createdAt: Date;
}

export interface PackageEntity {
  id: string;
  name: string;
  category: string;
  price: number;
  durationDays: number;
  sessions: number;
  active: boolean;
}

export interface MemberEntity {
  id: string;
  memberCode: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  branchId: string;
  assignedTrainerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionEntity {
  id: string;
  invoiceNumber: string;
  memberId: string | null;
  cashierId: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'VOIDED' | 'REFUNDED';
  paymentMethod: string;
  isVoided: boolean;
  voidReason?: string | null;
  voidedBy?: string | null;
  voidedAt?: Date | null;
  closingId?: string | null;
  createdAt: Date;
}

export interface BackupRecordEntity {
  id: string;
  filename: string;
  sizeBytes: number;
  checksum: string;
  status: string;
  createdAt: Date;
}

// In-Memory Database Store for Enterprise Security layer
class DatabaseStore {
  public users: Map<string, UserEntity> = new Map();
  public sessions: Map<string, UserSessionEntity> = new Map();
  public auditLogs: AuditLogEntity[] = [];
  public securityEvents: SecurityEventEntity[] = [];
  public packages: Map<string, PackageEntity> = new Map();
  public members: Map<string, MemberEntity> = new Map();
  public transactions: Map<string, TransactionEntity> = new Map();
  public backups: BackupRecordEntity[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed Default Users with bcrypt hashed passwords (salt rounds = 10)
    // Default password for seeded users is 'Admin123!' or 'Password123!'
    const adminHash = bcrypt.hashSync('Admin123!', 10);
    const staffHash = bcrypt.hashSync('Password123!', 10);

    const adminUser: UserEntity = {
      id: 'usr-admin-001',
      username: 'admin',
      email: 'admin@gympro.id',
      passwordHash: adminHash,
      name: 'Super Admin GymPro',
      role: 'ADMIN',
      status: 'ACTIVE',
      branchId: 'BR-ALL',
      branchName: 'Headquarters & All Branches',
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const leaderUser: UserEntity = {
      id: 'usr-leader-001',
      username: 'leader_sudirman',
      email: 'leader.sudirman@gympro.id',
      passwordHash: staffHash,
      name: 'Budi Branch Manager',
      role: 'LEADER',
      status: 'ACTIVE',
      branchId: 'BR-001',
      branchName: 'GymPro Sudirman Central',
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const kasirUser: UserEntity = {
      id: 'usr-kasir-001',
      username: 'kasir_dina',
      email: 'dina.kasir@gympro.id',
      passwordHash: staffHash,
      name: 'Dina Front Desk & Kasir',
      role: 'KASIR',
      status: 'ACTIVE',
      branchId: 'BR-001',
      branchName: 'GymPro Sudirman Central',
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const trainerUser: UserEntity = {
      id: 'usr-trainer-001',
      username: 'coach_reza',
      email: 'reza.coach@gympro.id',
      passwordHash: staffHash,
      name: 'Coach Reza Pratama',
      role: 'TRAINER',
      status: 'ACTIVE',
      branchId: 'BR-001',
      branchName: 'GymPro Sudirman Central',
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const memberUser: UserEntity = {
      id: 'usr-member-001',
      username: 'member_nadia',
      email: 'nadia.paramitha@gmail.com',
      passwordHash: staffHash,
      name: 'Nadia Paramitha',
      role: 'MEMBER',
      status: 'ACTIVE',
      branchId: 'BR-001',
      branchName: 'GymPro Sudirman Central',
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(leaderUser.id, leaderUser);
    this.users.set(kasirUser.id, kasirUser);
    this.users.set(trainerUser.id, trainerUser);
    this.users.set(memberUser.id, memberUser);

    // Seed Official Packages
    const officialPackages: PackageEntity[] = [
      { id: 'PKG-01', name: 'Membership 1 Bulan Regular', category: 'Membership', price: 350000, durationDays: 30, sessions: 0, active: true },
      { id: 'PKG-03', name: 'Membership 3 Bulan Silver', category: 'Membership', price: 850000, durationDays: 90, sessions: 0, active: true },
      { id: 'PKG-06', name: 'Membership 6 Bulan Gold', category: 'Membership', price: 1450000, durationDays: 180, sessions: 0, active: true },
      { id: 'PKG-12', name: 'Membership 12 Bulan Platinum', category: 'Membership', price: 2800000, durationDays: 365, sessions: 0, active: true },
      { id: 'PKG-PT-10', name: 'Paket Personal Trainer 10 Sesi', category: 'PT', price: 1750000, durationDays: 60, sessions: 10, active: true },
      { id: 'PKG-PT-24', name: 'Paket Personal Trainer 24 Sesi', category: 'PT', price: 3600000, durationDays: 120, sessions: 24, active: true },
      { id: 'PKG-TRIAL', name: 'Free Trial Pass & InBody Scan', category: 'Trial', price: 0, durationDays: 1, sessions: 1, active: true }
    ];

    officialPackages.forEach((pkg) => this.packages.set(pkg.id, pkg));

    // Seed Sample Members
    const m1: MemberEntity = {
      id: 'MEM-001',
      memberCode: 'GP-M001',
      name: 'Nadia Paramitha',
      phone: '081299887766',
      email: 'nadia.paramitha@gmail.com',
      status: 'Aktif',
      branchId: 'BR-001',
      assignedTrainerId: 'usr-trainer-001',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const m2: MemberEntity = {
      id: 'MEM-002',
      memberCode: 'GP-M002',
      name: 'Dimas Anggara',
      phone: '081344556677',
      email: 'dimas.anggara@gmail.com',
      status: 'Aktif',
      branchId: 'BR-001',
      assignedTrainerId: 'usr-trainer-001',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.members.set(m1.id, m1);
    this.members.set(m2.id, m2);

    // Initial Security Event
    this.securityEvents.push({
      id: 'SEC-INIT',
      eventType: 'SYSTEM_BOOT',
      severity: 'LOW',
      ipAddress: '127.0.0.1',
      userAgent: 'GymPro Core System',
      userId: 'usr-admin-001',
      details: 'GymPro Enterprise Multi-layer Security System initialized.',
      resolved: true,
      createdAt: new Date()
    });

    // Initial Backup Record
    this.backups.push({
      id: 'BKP-INITIAL',
      filename: `gympro_backup_${new Date().toISOString().slice(0, 10)}.sql`,
      sizeBytes: 1542800,
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3600000 * 24)
    });
  }
}

export const db = new DatabaseStore();

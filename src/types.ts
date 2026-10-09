export type UserRole = 'admin' | 'admin_cabang' | 'kasir' | 'leader_pt' | 'pt' | 'teknisi' | 'manager';

export function isSuperAdmin(roleOrUser?: UserRole | { role?: UserRole } | null): boolean {
  if (!roleOrUser) return false;
  const role = typeof roleOrUser === 'string' ? roleOrUser : roleOrUser.role;
  return role === 'admin';
}

export function isBranchAdmin(roleOrUser?: UserRole | { role?: UserRole } | null): boolean {
  if (!roleOrUser) return false;
  const role = typeof roleOrUser === 'string' ? roleOrUser : roleOrUser.role;
  return role === 'admin_cabang';
}

export function canManageBranchOnly(roleOrUser?: UserRole | { role?: UserRole } | null): boolean {
  if (!roleOrUser) return false;
  const role = typeof roleOrUser === 'string' ? roleOrUser : roleOrUser.role;
  return role === 'admin_cabang';
}

export type DivisionType = 'Kasir & Front Desk' | 'Pelatihan' | 'Manajemen' | 'Manajemen Cabang' | 'Teknisi' | string;

export function getStaffDivision(user?: { role?: string; roleName?: string; division?: string } | null): string {
  if (user?.division) return user.division;
  const role = (user?.role || '').toLowerCase();
  const roleName = (user?.roleName || '').toLowerCase();
  if (role === 'admin_cabang' || roleName.includes('admin cabang') || roleName.includes('admin unit')) {
    return 'Manajemen Cabang';
  }
  if (role === 'kasir' || roleName.includes('kasir') || roleName.includes('front desk') || roleName.includes('cs') || roleName.includes('receptionist')) {
    return 'Kasir & Front Desk';
  }
  if (role === 'pt' || role === 'leader_pt' || roleName.includes('pt') || roleName.includes('pelatih') || roleName.includes('coach') || roleName.includes('instruktur')) {
    return 'Pelatihan';
  }
  if (role === 'teknisi' || roleName.includes('teknisi') || roleName.includes('maintenance')) {
    return 'Teknisi';
  }
  return 'Manajemen';
}

export const ALL_BRANCHES_ID = 'ALL';

export interface User {
  id: string;
  accId: string;
  name: string;
  email?: string;
  role: UserRole;
  roleName: string;
  division?: DivisionType;             // Divisi Resmi Organisasi (misal: 'Kasir & Front Desk', 'Pelatihan', dll)
  shift: 'Pagi' | 'Siang' | 'Malam' | string;
  baseSalary: number;
  password: string;
  photo?: string;
  gender?: 'L' | 'P';
  phone?: string;
  // Multi-Branch Assignment
  branchId?: string;
  branchName?: string;
  allowedBranchIds?: string[]; // If roving or multi-branch manager
  // Kartu Identitas Resmi Karyawan
  idType?: 'KTP' | 'SIM' | 'Paspor' | 'Kartu Pelajar';
  idNumber?: string;
  idPhoto?: string;
  address?: string;
  birthDate?: string;
  emergencyContact?: string;
  // HR & Kepegawaian
  employmentStatus?: 'Tetap' | 'Kontrak' | 'Probation' | 'Part-time';
  joinDate?: string;
  allowance?: number;
  leaveQuota?: number;
  bankName?: string;
  bankAccount?: string;
  // BPJS & Payroll Deductions
  bpjsKesehatan?: number;              // Potongan BPJS Kesehatan (misal 1% atau nominal pasti)
  bpjsKetenagakerjaan?: number;        // Potongan BPJS Ketenagakerjaan / JHT (misal 2-3% atau nominal pasti)
  bpjsKesehatanActive?: boolean;       // Status aktif BPJS Kesehatan
  bpjsKetenagakerjaanActive?: boolean; // Status aktif BPJS TK
  bpjsNumber?: string;                 // Nomor Kartu BPJS Karyawan
  taxDeduction?: number;               // PPh 21 bulanan
  loanDeduction?: number;              // Potongan pinjaman / kasbon staf
}

export interface PayrollAdjustment {
  staffId: string;
  month: string;                       // Format YYYY-MM
  baseSalary?: number;
  allowance?: number;
  ptCommissionAdjustment?: number;
  salesBonusAdjustment?: number;
  overtimePayAdjustment?: number;
  bpjsKesehatan?: number;
  bpjsKetenagakerjaan?: number;
  lateDeductionAdjustment?: number;
  otherDeductions?: number;
  otherDeductionNotes?: string;
  bonusAdjustment?: number;
  bonusNotes?: string;
  taxDeduction?: number;
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type MembershipStatus = 'AKTIF' | 'FREEZE' | 'MASA TENGGANG' | 'EXPIRED' | 'VISIT';

export interface MemberFreezeRecord {
  id: string; // e.g. "FRZ-202609-001"
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  startDate: string; // YYYY-MM-DD
  plannedEndDate: string; // YYYY-MM-DD
  actualEndDate?: string; // YYYY-MM-DD saat di-unfreeze
  plannedDays: number; // Durasi hari rencana freeze
  freezeDays?: number;
  actualDays?: number; // Durasi hari aktual freeze
  previousStatus: MembershipStatus | string; // Status sebelum freeze (e.g. 'AKTIF')
  previousExpiredDate: string; // Tanggal expired sebelum freeze
  newAdjustedExpiredDate: string; // Tanggal expired baru yang telah disesuaikan
  adjustedExpiryDate?: string;
  reason: string; // 'Sakit / Cedera' | 'Tugas Ke Luar Kota' | 'Hamil / Melahirkan' | 'Liburan / Studi' | 'Lainnya'
  notes?: string;
  staffId: string;
  staffName: string;
  unfreezeStaffId?: string;
  unfreezeStaffName?: string;
  unfreezeNotes?: string;
  status: 'FREEZE' | 'SELESAI' | 'DIBATALKAN' | 'AKTIF';
  adminFee?: number; // Biaya administrasi freeze jika ada
  createdAt: string; // Timestamp ISO / format tanggal
  unfrozenAt?: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  expired: string; // YYYY-MM-DD
  ptQuota: number;
  classQuota?: number; // Sisa kuota sesi kelas studio
  classPackageName?: string; // Nama paket kelas studio aktif
  classPackageExpired?: string; // Tanggal kadaluarsa kuota kelas (YYYY-MM-DD)
  classCategoryAllowed?: string; // Kategori kelas yang diizinkan (misal: 'Semua Kelas', 'Zumba', 'Pilates')
  picId: string;
  picName: string;
  isPicLocked?: boolean;
  followUpStatus: string;
  photo: string;
  gender?: 'L' | 'P';
  joinDate?: string;
  notes?: string;
  // Freeze Membership state
  isFrozen?: boolean;
  status?: MembershipStatus;
  activeFreezeId?: string;
  freezeStartDate?: string;
  freezeEndDate?: string;
  freezePlannedEndDate?: string;
  freezeDays?: number;
  previousStatus?: MembershipStatus;
  lastFreezeRecordId?: string;
  freezeReason?: string;
  freezeStaffName?: string;
  freezeNotes?: string;
  membershipType?: 'MEMBER' | 'VISIT';
  // Multi-Branch Home Assignment
  branchId?: string;
  branchName?: string;
  // Kartu Identitas Resmi Member
  idType?: 'KTP' | 'SIM' | 'Paspor' | 'Kartu Pelajar';
  idNumber?: string;
  idPhoto?: string;
  address?: string;
  birthDate?: string;
  emergencyContact?: string;
  originGuestPassId?: string; // Tautan jika member berasal dari konversi Tiket Visit Harian
}

export interface GuestPassVisitRecord {
  id: string; // e.g. "VISIT-12345"
  date: string;
  time: string;
  price: number;
  paymentMethod: 'Cash' | 'QRIS' | 'Transfer' | 'Debit' | string;
  lockerNum?: string;
  hasTowel?: boolean;
  picId?: string;
  picName?: string;
  notes?: string;
}

export interface GuestPassVisitor {
  id: string; // e.g. "GP-001"
  name: string;
  phone: string;
  gender?: 'L' | 'P';
  branchId?: string;
  firstVisitDate: string; // YYYY-MM-DD
  lastVisitDate: string; // YYYY-MM-DD
  totalVisits: number;
  totalSpend: number;
  status: 'Aktif Visit' | 'Terkonversi Member';
  convertedMemberId?: string;
  convertedMemberName?: string;
  convertedAt?: string;
  notes?: string;
  lastPaymentMethod?: 'Cash' | 'QRIS' | 'Transfer' | 'Debit' | string;
  lastPicId?: string;
  lastPicName?: string;
  visitHistory?: GuestPassVisitRecord[];
}

export interface Product {
  id: string;
  cat: 'Mineral' | 'Supplement' | 'Snack' | string;
  name: string;
  cost: number;
  price: number;
  stock: number;
  img: string;
  // Multi-Branch Stock Tracking
  branchId?: string;
  branchName?: string;
  branchStocks?: Record<string, number>; // Specific stock per branch ID (e.g. { "BR-001": 50, "BR-002": 30 })
}

export interface PackageItem {
  id: string;
  cat: 'Membership' | 'PT' | 'Class';
  type: 'Personal' | 'Couple' | 'Trio';
  name: string;
  price: number;
  value: number; // days (Membership) or sessions (PT / Class)
  sessionCount?: number; // Sesi kelas studio jika paket kelas
  validityDays?: number; // Masa berlaku kuota dalam hari (misal 7, 30, 45, 60 hari)
  classCategory?: string; // Kategori kelas (misal: 'Semua Kelas', 'Zumba', 'Yoga', 'Pilates Reformer', dll)
  // Pengaturan Komisi Produk Member, PT & Instruktur Kelas
  commissionType?: 'PERCENT' | 'NOMINAL'; // 'PERCENT' (default) atau 'NOMINAL'
  // 1. Komisi Penjualan untuk Kasir / Sales Consultant yang closing produk member / PT / Kelas
  salesCommissionRate?: number; // Cth: 3% atau 5%
  salesCommissionNominal?: number; // Cth: Rp 25.000
  // 2. Komisi Personal Trainer (Coach / Pelatih) & Instruktur Kelas
  trainerCommissionRate?: number; // Cth: 40% dari harga paket PT/Kelas
  trainerCommissionNominal?: number; // Cth: Rp 360.000 total
  trainerCommissionPerSession?: number; // Cth: Rp 45.000 / sesi latihan atau fee kelas
  // 3. Insentif Tambahan / Bonus Produk
  productBonusNominal?: number;
  // Catatan Kebijakan & Saran
  commissionNotes?: string;
  presetApplied?: string;
}

export type BundleType =
  | 'MEMBERSHIP_ONLY'
  | 'PT_ONLY'
  | 'MEMBERSHIP_PLUS_PT'
  | 'MEMBERSHIP_PLUS_PRODUCT'
  | 'CUSTOM_BUNDLE';

export type BundleItemType = 'MEMBERSHIP' | 'PT' | 'PRODUCT';

export interface BundleItem {
  bundleItemId: string;
  bundleId: string;
  itemType: BundleItemType;
  membershipPackageId?: string;
  ptPackageId?: string;
  productId?: string;
  productName?: string;
  productQty?: number;
  name: string;
  quantity: number;
  duration?: number; // in days, e.g. 30 (1 Bulan), 90 (3 Bulan)
  durationLabel?: string; // e.g. '1 Bulan'
  sessionCount?: number; // e.g. 2, 4, 8, 16
  unitPrice?: number;
  isActive: boolean;
}

export interface BundlePackage {
  bundleId: string;
  bundleCode: string; // e.g. 'BND-VIP-PLUS'
  bundleName: string; // e.g. 'VIP PLUS'
  description: string;
  bundleType: BundleType;
  price: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdDate: string;
  createdBy: string;
  participantType: 'Personal' | 'Couple' | 'Trio';
  maxParticipants: number; // 1, 2, 3
  durationDays?: number;
  ptComponentValue: number; // Configurable PT component valuation for trainer commission
  commissionRate: number; // Commission % for trainer, e.g. 20 (%)
  trainerCommissionRate?: number;
  trainerCommissionPerSession?: number;
  salesCommissionRate?: number; // % Komisi Penjualan Kasir/Sales
  salesCommissionNominal?: number; // Rp Komisi Penjualan Kasir/Sales
  items: BundleItem[];
  allowDpActivation?: boolean; // If true, benefits activate even when paying DP
}

export interface SalesCommissionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  staffId: string;
  staffName: string;
  memberId?: string;
  memberName: string;
  packageId?: string;
  packageName: string;
  packageCat: 'Membership' | 'PT' | 'Bundling' | 'POS' | string;
  packagePrice: number;
  commissionRate?: number;
  commissionAmount: number;
  trxId: string;
  paymentStatus: 'LUNAS' | 'PENDING' | string;
  notes?: string;
}

export interface MemberMembershipRecord {
  id: string;
  membershipRecordId?: string;
  memberId: string;
  memberName: string;
  packageName: string;
  bundleId?: string;
  bundleCode?: string;
  bundleName?: string;
  bundleTrxId?: string;
  transactionId?: string;
  membershipPackageId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  durationLabel: string;
  status: 'AKTIF' | 'ACTIVE' | 'EXPIRED' | 'PENDING_LUNAS' | string;
  createdDate: string;
  source: 'REGULAR' | 'BUNDLING';
}

export interface TrainerCommissionRecord {
  id: string;
  commissionId?: string;
  date: string; // YYYY-MM-DD
  trainerId: string;
  trainerName: string;
  memberId: string;
  memberName: string;
  bundleId?: string;
  bundleCode?: string;
  bundleName: string;
  packageId?: string;
  packageName?: string;
  packageType?: 'Membership' | 'PT' | 'Bundling' | string;
  trxId?: string;
  transactionId?: string;
  sessionId?: string;
  sessionNumber?: number;
  ptComponentValue: number;
  commissionRate: number;
  commissionAmount: number;
  commissionPerSession?: number;
  totalSessions?: number;
  paymentStatus: 'LUNAS' | 'BELUM LUNAS' | 'PENDING' | string;
  validationStatus: 'COMPLETED' | 'WAITING_VALIDATION' | 'PENDING' | string;
  valStatus?: string;
  status?: string;
  notes?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. 14:30 WIB
  type: 'POS' | 'Membership' | 'PT' | 'Pelunasan Cicilan' | 'Bundling' | 'Class';
  desc: string;
  customer: string;
  memberId?: string;
  billName?: string;
  amount: number;            // Total invoice amount
  amountPaid: number;        // Cumulative amount paid
  amountRemaining: number;    // Remaining debt
  dueDate?: string;          // YYYY-MM-DD
  cogs?: number;
  profit?: number;
  method: 'Tunai' | 'QRIS' | 'Transfer' | 'EDC' | 'Kasbon' | 'Cicilan 2x' | 'Split Payment' | string;
  status: 'Paid' | 'DP 50%' | 'BELUM LUNAS' | 'VOID' | 'REFUND';
  cashier: string;
  bankDest?: 'Artha Graha' | 'Mandiri' | string;
  itemsJSON?: string;
  picId?: string;
  picIds?: string[];
  picNames?: string;
  trxCategory?: string;
  refTrxId?: string;         // If this is a PAY-* installment payment
  initialCashPaid?: number;  // Cash or bank inflow that happened specifically on transaction creation date
  bundleId?: string;
  bundleCode?: string;
  invoiceNo?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  adminFee?: number;
  refundDate?: string;
  refundAmount?: number;
  refundReason?: string;
  refundApprovedBy?: string;
  // Class Package fields
  classPackageId?: string;
  classSessionsGranted?: number;
  classValidityDays?: number;
  paymentScheme?: 'LUNAS' | 'DP_CICILAN' | 'SPLIT_PAYMENT';
  splitCashAmount?: number;
  splitNonCashAmount?: number;
  splitNonCashMethod?: string;
  // Multi-Branch Unit Identifier
  branchId?: string;
  branchName?: string;
}

export interface TransactionAuditLog {
  id: string;
  transactionId: string;
  action: 'PRINT' | 'REPRINT' | 'DOWNLOAD_PDF';
  userId: string;
  userName: string;
  timestamp: string;
  branchId?: string;
}

export type PTBookingSource = 'PORTAL_MEMBER' | 'BACKOFFICE' | 'ADMIN' | 'TRAINER' | 'LEADER_PT';

export type PTBookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'EXPIRED';

export interface Schedule {
  id: string;
  memberName: string;
  memberId: string;
  trainer: string;
  trainerId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime?: string; // HH:mm
  status: 'Menunggu' | 'Selesai' | 'Batal' | 'Reschedule' | 'No-Show' | 'Hangus';
  sessionStatus?: 'AVAILABLE' | 'BOOKED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  source?: PTBookingSource;
  bookingId?: string;
  bookingCode?: string;
  valStaf: boolean;
  valTrainer: boolean;
  valMember: boolean;
  note?: string;
  workoutFocus?: string;
  workoutLog?: string;
  bundleId?: string;
  bundleName?: string;
  bundleTrxId?: string;
  purchaseId?: string;
  sessionNumber?: number;
  ptComponentValue?: number;
  commissionAmount?: number;
  branchId?: string;
  branchName?: string;
}

export interface TrainerWorkoutLog {
  id: string;
  scheduleId?: string;
  trainerId: string;
  trainerName: string;
  memberId: string;
  memberName: string;
  date: string;
  focusArea: string;
  exercisesSummary: string;
  rpeRate: number; // 1 - 10
  condition: 'Prima & Bertenaga' | 'Normal' | 'Lelah / Recovery' | 'Nyeri Otot Ringan';
  coachNotes: string;
  nextSessionGoal: string;
}

export interface TrainerAttendanceLog {
  id: string;
  trainerId: string;
  trainerName: string;
  scheduleId?: string;
  memberId: string;
  memberName: string;
  date: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  checkInTime: string; // HH:mm
  checkOutTime?: string; // HH:mm
  durationMinutes?: number;
  status: 'Checked In' | 'Checked Out' | 'Selesai';
  punctuality: 'Tepat Waktu' | 'Terlambat' | 'Lebih Awal';
  trainingFocus: string;
  roomOrArea: string;
  intensityRPE?: number; // 1 - 10
  notes?: string;
  valTrainer?: boolean;
  valMember?: boolean;
  sessionFee?: number;
}

export type PTPurchaseStatus =
  | 'PAID'
  | 'WAITING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'Completed'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'Cancelled'
  | 'REFUND'
  | 'BELUM_LUNAS'
  | 'Active';

export interface PTPurchaseMember {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  gender?: 'L' | 'P';
}

export interface PTTrainerAssignment {
  assignmentId: string;
  ptPurchaseId: string;
  ptNo?: string;
  memberId: string;
  memberName: string;
  memberIds?: string[];
  memberNames?: string[];
  trainerId: string;
  trainerName: string;
  assignedBy: string; // e.g. "Fajar (Leader PT)"
  assignedById?: string;
  assignedAt: string; // YYYY-MM-DD HH:mm or ISO
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (when replaced/ended)
  status: 'ACTIVE' | 'CHANGED' | 'REPLACED' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  notes?: string;
}

export interface PTPurchaseRecord {
  id: string; // PT Purchase ID, e.g. PUR-101 or PT-2026-00045
  ptNo?: string; // e.g. PT-2026-00045
  date: string; // YYYY-MM-DD
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  // Multi-participant for Couple / Trio
  members?: PTPurchaseMember[];
  memberIds?: string[];
  memberNames?: string[];
  trainerId?: string;
  trainerName: string;
  packageId: string;
  packageName: string;
  packageType?: 'Personal' | 'Couple' | 'Trio' | string;
  totalSessions: number;
  completedSessions: number;
  remainingSessions?: number;
  price: number;
  amountPaid?: number;
  amountRemaining?: number;
  paymentStatus?: 'LUNAS' | 'CICILAN' | 'BELUM LUNAS' | 'DP 50%' | string;
  paymentMethod?: string;
  status: PTPurchaseStatus;
  expiryDate?: string;
  notes?: string;
  picSalesId?: string;
  picSalesName?: string;
  purchaseBy?: string; // e.g. Kasir / Staf
  purchaseAt?: string; // e.g. 30/09/2026 14:30
  assignedBy?: string;
  assignedAt?: string;
  history?: PTTrainerAssignment[];
  source?: 'REGULAR' | 'BUNDLING';
  bundleId?: string;
  bundleCode?: string;
  bundleTrxId?: string;
  ptComponentValue?: number;
  commissionRate?: number;
  branchId?: string;
  branchName?: string;
}

export interface TrainingSessionDetail {
  sessionId: string;
  sessionNumber: number;
  date: string;
  time: string;
  status: 'Selesai' | 'Menunggu' | 'Batal' | 'Reschedule' | 'No-Show' | 'Hangus';
  note?: string;
  valStaf?: boolean;
  valTrainer?: boolean;
  valMember?: boolean;
}

export interface PTBookingHistory {
  id: string;
  bookingId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedRole: string;
  source: PTBookingSource;
  createdAt: string;
  notes?: string;
}

export interface PTBooking {
  id: string; // e.g. "PTB-2026-0001"
  bookingCode: string; // e.g. "BK-PT-8941"
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  ptPackageId: string; // references PTPurchaseRecord.id
  packageName: string;
  totalSessions: number;
  sessionNumber: number; // e.g. 5
  trainerId: string;
  trainerName: string;
  branchId?: string;
  branchName?: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "18:00")
  endTime: string; // HH:mm (e.g. "19:00")
  status: PTBookingStatus;
  source: PTBookingSource;
  notes?: string;
  workoutFocus?: string;
  scheduleId?: string; // linked to Schedule.id in ERP calendar
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  history?: PTBookingHistory[];
}

export interface TrainerChangeRequest {
  id: string; // e.g. "TCR-001"
  memberId: string;
  memberName: string;
  memberPhone?: string;
  ptPackageId: string;
  packageName: string;
  currentTrainerId: string;
  currentTrainerName: string;
  preferredTrainerId?: string;
  preferredTrainerName?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  assignedTrainerId?: string;
  assignedTrainerName?: string;
  reviewNotes?: string;
}

export interface PTBackofficeNotification {
  id: string;
  bookingId: string;
  title: string;
  message: string;
  targetRole: 'TRAINER' | 'LEADER_PT' | 'ADMIN' | 'ALL';
  trainerId?: string;
  memberId: string;
  memberName: string;
  bookingDate: string;
  timeSlot: string;
  createdAt: string;
  isRead?: boolean;
}

export interface BodyCompositionRecord {
  id: string; // e.g. "BC-2026-001"
  memberId: string;
  memberName: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm WIB
  trainerId?: string;
  trainerName?: string;
  selfReported?: boolean; // True if input mandiri oleh member sendiri
  // Core Metrics
  weight: number; // kg
  height: number; // cm
  bmi: number; // weight / (height/100)^2
  bodyFatPercentage?: number; // %
  muscleMass?: number; // kg
  visceralFat?: number; // Level 1 - 20
  basalMetabolicRate?: number; // kcal (BMR)
  bodyWaterPercentage?: number; // %
  boneMass?: number; // kg
  // Anthropometric Circumferences (cm)
  chest?: number;
  waist?: number;
  hips?: number;
  armRight?: number;
  armLeft?: number;
  thighRight?: number;
  thighLeft?: number;
  // Health & Targets
  bloodPressure?: string; // e.g. "120/80"
  restingHeartRate?: number; // bpm
  targetWeight?: number; // kg
  fitnessGoal?: 'Weight Loss' | 'Muscle Gain' | 'Endurance' | 'Rehabilitation' | 'General Fitness' | string;
  notes?: string;
  trainerRecommendations?: string;
  branchId?: string;
  branchName?: string;
  createdAt?: string;
}

export interface StudioClass {
  id: string;
  name: string;
  trainer: string;
  trainerId?: string;
  trainerName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  capacity: number;
  booked: string[]; // member names
  bookedMembers?: string[];
  checkedInMembers?: string[]; // Member IDs that have attended
  room?: string;
  category?: 'Zumba & Dance' | 'Yoga & Pilates' | 'Combat & Martial' | 'RPM / Cycling' | 'Strength & Conditioning' | string;
  description?: string;
}

export interface LockerSlot {
  number: number;
  label?: string; // e.g. "L-01", "P-01", "W-05"
  gender: 'Pria' | 'Wanita' | 'Semua';
  isOccupied: boolean;
  memberId?: string;
  memberName?: string;
  timeIn?: string;
  hasTowel?: boolean;
  status?: 'Tersedia' | 'Terpakai' | 'Perbaikan' | 'VIP';
  location?: string;
  notes?: string;
  depositItem?: string;
}

export interface Attendance {
  id: string;
  date: string; // YYYY-MM-DD
  timeIn: string;
  timeOut?: string;
  memberId?: string;
  memberName: string;
  type: 'Reguler' | 'PT' | 'Studio Class';
  badge: string;
  lockerNumber?: number | string;
  lockerGender?: 'Pria' | 'Wanita';
  hasTowel?: boolean;
  lockerReturned?: boolean;
  notes?: string;
  branchId?: string;
  branchName?: string;
}

export type ShiftType = 'Pagi' | 'Siang' | 'Malam' | 'Off';

export interface ShiftDefinition {
  id: ShiftType;
  name: string;
  startTime: string;
  endTime: string;
  badgeColor: string;
  description: string;
}

export interface WorkSchedule {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  startTime: string; // e.g. "06:00"
  endTime: string;   // e.g. "14:00"
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Swapped' | 'Off';
  swappedWith?: string;
}

export interface StaffAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  timeIn: string;
  timeOut?: string;
  staffId?: string;
  staffName: string;
  shift: 'Pagi' | 'Siang' | 'Malam' | string;
  status?: 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Cuti' | 'Alpa' | 'Lembur';
  lateMinutes?: number;
  overtimeHours?: number;
  notes?: string;
  verifiedBy?: string;
  location?: string;
  branchId?: string;
  branchName?: string;
}

export interface LeadFollowUpRecord {
  id: string;
  date: string;
  time?: string;
  picId: string;
  picName: string;
  picRole?: string;
  picDivision?: string;
  method: 'WhatsApp' | 'Telepon' | 'Tatap Muka' | 'Instagram DM' | string;
  result: string;
  notes: string;
}

export interface LeadHandoverRecord {
  id: string;
  date: string;
  time?: string;
  fromPicId: string;
  fromPicName: string;
  fromPicDivision?: string;
  toPicId: string;
  toPicName: string;
  toPicDivision?: string;
  reason: string;
}

export interface Lead {
  id: string;
  date?: string;
  name: string;
  phone: string;
  source: 'Instagram' | 'Walk-in' | 'Referral' | 'Google / Website' | 'TikTok' | 'Event / Expo' | string;
  status: 'Baru' | 'Follow Up' | 'Trial' | 'Member' | 'Lost' | string;
  notes?: string;
  picId?: string;
  picName?: string;
  picRole?: string;
  picDivision?: string;
  picShift?: string;
  assignedAt?: string;
  assignedBy?: string;
  priority?: 'Tinggi' | 'Sedang' | 'Rendah';
  interest?: string;
  estimatedValue?: number;
  lastFollowUpDate?: string;
  nextFollowUpDate?: string;
  followUpHistory?: LeadFollowUpRecord[];
  handoverHistory?: LeadHandoverRecord[];
  lostReason?: string;
  tags?: string[];
  branchId?: string;
  branchName?: string;
}

export interface FollowUpLog {
  id?: string;
  memberId: string;
  date: string;
  status: string;
  notes: string;
  method?: string;
}

export interface DailyGuest {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  firstVisitDate: string;
  lastVisitDate: string;
  lastVisitTime?: string;
  branchId?: string;
  branchName?: string;
  notes?: string;
  lastPaymentMethod?: 'Cash' | 'QRIS' | 'Transfer' | 'Debit' | string;
  lastPricePaid?: number;
  convertedToMember?: boolean;
  memberId?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: 'Cuti Tahunan' | 'Sakit' | 'Izin Pribadi' | 'Lembur' | 'Libur Rutin / Day Off' | string;
  start: string;
  end: string;
  daysCount?: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export type PettyCashStatus = 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak' | 'Selesai';

export interface PettyCashExpense {
  id: string;
  petty_cash_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  amount: number; // unit_price * quantity
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PettyCash {
  id: string;
  date: string;
  initial_amount: number;
  payment_method: 'Transfer' | 'Tunai' | 'Bank' | string;
  status: PettyCashStatus | string;
  total_expense: number;
  remaining_balance: number;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  expenses?: PettyCashExpense[];

  // Legacy / fallback compatibility fields
  time?: string;
  desc?: string;
  description?: string;
  category?: string;
  amount?: number;
  staffName?: string;
  submitted_by?: string;
  submitted_by_name?: string;
  pic?: string;
  cat?: 'Operasional' | 'ATK' | 'Kebersihan' | 'Maintenance' | 'Konsumsi' | string;
  // Multi-Branch Scoping
  branchId?: string;
  branchName?: string;
}

export type PettyCashItem = PettyCash;

export interface StockTransferRecord {
  id: string; // e.g. "TRF-202609-001"
  date: string;
  productId: string;
  productName: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  quantity: number;
  transferredBy: string;
  notes?: string;
  status: 'COMPLETED' | 'IN_TRANSIT' | 'CANCELLED';
  createdAt: string;
}

export interface DailyClosingRecord {
  id: string;
  date: string;
  closedBy?: string;
  closedAt?: string;
  cashierName?: string;
  time?: string;
  revenue?: number;
  trxCount?: number;
  tunai?: number;
  nonTunai?: number;
  pettyCash?: number;
  systemSaldo?: number;
  actualCash?: number;
  physicalCash?: number;
  difference?: number;
  variance?: number;
  bankArtha?: number;
  bankMandiri?: number;
  cashSales?: number;
  mandiriSales?: number;
  arthaSales?: number;
  pettyExpenses?: number;
  expectedCash?: number;
  openingFloat?: number; // Modal Awal / Cash Float Laci Kas
  modalAwal?: number;    // Alias untuk Modal Awal Laci
  arthaQRIS?: number;
  arthaTF?: number;
  arthaEDC?: number;
  mandiriQRIS?: number;
  mandiriTF?: number;
  mandiriEDC?: number;
  notes?: string;
  branchId?: string;
  branchName?: string;
}

// ============================================================================
// MODUL INVENTARIS & PEMELIHARAAN ALAT GYM (GYMPRO ERP)
// ============================================================================

export type AssetCategory =
  | 'Cardio'
  | 'Strength'
  | 'Free Weight'
  | 'Machine'
  | 'Bench'
  | 'Cable Machine'
  | 'Functional Training'
  | 'Equipment'
  | 'Elektronik'
  | 'Furniture'
  | 'Lainnya';

export type AssetCondition =
  | 'Baru'
  | 'Baik'
  | 'Cukup'
  | 'Rusak Ringan'
  | 'Rusak Berat'
  | 'Tidak Layak Pakai'
  | 'BARU'
  | 'BAIK'
  | 'CUKUP'
  | 'RUSAK_RINGAN'
  | 'RUSAK_BERAT'
  | 'AFKIR'
  | 'TIDAK_LAYAK';

export type AssetStatus =
  | 'Aktif'
  | 'Maintenance'
  | 'Rusak'
  | 'Tidak Digunakan'
  | 'Dipindahkan'
  | 'Dijual'
  | 'Dihapus'
  | 'OPERASIONAL'
  | 'DALAM_PERAWATAN'
  | 'RUSAK'
  | 'DISPOSAL'
  | 'NON_AKTIF';

export type MaintenanceScheduleType =
  | 'Harian'
  | 'Mingguan'
  | 'Bulanan'
  | '3 Bulanan'
  | '6 Bulanan'
  | 'Tahunan'
  | 'Custom';

export type MaintenanceType =
  | 'Preventive Maintenance'
  | 'Corrective Maintenance'
  | 'Repair'
  | 'Inspection'
  | 'Cleaning'
  | 'Replacement'
  | 'Calibration'
  | 'Service Berkala'
  | 'Preventive'
  | 'Corrective';

export type DamagePriority = 'Rendah' | 'Normal' | 'Tinggi' | 'Darurat';

export type DamageReportStatus =
  | 'Dilaporkan'
  | 'Menunggu Pemeriksaan'
  | 'Menunggu Persetujuan'
  | 'Dalam Perbaikan'
  | 'Selesai'
  | 'Tidak Dapat Diperbaiki';

export type WorkOrderStatus =
  | 'Open'
  | 'Approved'
  | 'In Progress'
  | 'Pending'
  | 'Completed'
  | 'Cancelled'
  | 'SELESAI';

export type ProcurementStatus =
  | 'Draft'
  | 'Pengajuan'
  | 'Menunggu Approval'
  | 'Disetujui'
  | 'Dipesan'
  | 'Diterima'
  | 'Selesai'
  | 'Ditolak'
  | 'DITERIMA'
  | 'DISETUJUI_OWNER'
  | 'DISETUJUI_MANAGER';

export interface GymAsset {
  id: string;                    // ID Inventaris (e.g. AST-001)
  assetCode: string;             // Kode Asset (e.g. TM-CRD-01)
  code?: string;                 // Alias kode aset
  name: string;                  // Nama Alat
  category: AssetCategory;       // Kategori Alat
  brand: string;                 // Brand/Merk
  model: string;                 // Tipe/Model
  serialNumber: string;          // Serial Number
  purchaseYear?: number;         // Tahun Pembelian
  purchaseDate: string;          // Tanggal Pembelian (YYYY-MM-DD)
  supplier?: string;             // Supplier/Vendor
  vendor?: string;               // Alias Supplier/Vendor
  vendorPhone?: string;          // Nomor Telepon Vendor
  purchasePrice: number;         // Harga Pembelian
  warranty?: string;             // Garansi (e.g. '2 Tahun Resmi')
  warrantyMonths?: number;       // Durasi garansi (bulan)
  warrantyStart?: string;        // Tanggal Mulai Garansi
  warrantyEnd?: string;          // Tanggal Berakhir Garansi
  warrantyExpiry?: string;       // Alias expiry garansi
  location: string;              // Lokasi
  photo?: string;                // Foto Alat URL
  condition: AssetCondition;     // Kondisi
  status: AssetStatus;           // Status
  responsiblePerson?: string;    // Penanggung Jawab
  maintenanceFrequencyMonths?: number;
  depreciationYears?: number;
  salvageValue?: number;
  accumulatedDepreciation?: number;
  currentBookValue?: number;
  specifications?: Record<string, string>;
  notes?: string;                // Keterangan
  maintenanceSchedule?: MaintenanceScheduleType;
  lastMaintenanceDate?: string;
  lastMaintenance?: string;
  nextMaintenanceDate?: string;
  nextMaintenance?: string;
  disposalDetails?: AssetDisposal;
  branchId?: string;
  branchName?: string;
}

export interface UsedSparepartItem {
  sparepartId: string;
  sparepartCode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AssetMaintenance {
  id: string;                    // ID Maintenance (e.g. MNT-2026-001)
  assetId: string;               // ID Asset
  assetCode: string;
  assetName: string;
  title?: string;
  type?: string;
  scheduledDate?: string;
  maintenanceDate: string;       // Tanggal Maintenance
  maintenanceType: MaintenanceType;
  technicianId?: string;
  technicianName: string;        // Teknisi/Vendor
  vendorName?: string;
  complaint?: string;            // Keluhan
  action?: string;               // Tindakan
  usedSpareparts?: UsedSparepartItem[];
  serviceCost?: number;          // Biaya Jasa
  sparepartCost?: number;        // Biaya Sparepart
  otherCost?: number;            // Biaya Lainnya
  cost?: number;                 // Alias total biaya
  totalCost: number;             // Total Biaya (service + sparepart + other)
  repairWarranty?: string;       // Garansi Perbaikan (misal '30 Hari')
  nextScheduledDate?: string;
  nextMaintenanceDate?: string;  // Tanggal Maintenance Berikutnya
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Pending Approval' | 'Cancelled' | 'SELESAI';
  paymentMethod?: 'Tunai' | 'Transfer' | 'QRIS' | 'EDC';
  bankDest?: 'Mandiri' | 'Artha Graha' | string;
  notes?: string;                // Catatan
  photoBefore?: string;          // Foto sebelum
  photoAfter?: string;           // Foto sesudah
  invoiceDoc?: string;           // Bukti/Invoice
  financeTrxId?: string;         // Referensi transaksi Keuangan ERP
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected';
  approvedBy?: string;
}

export interface DamageReport {
  id: string;                    // Nomor Laporan (e.g. DMG-2026-001)
  reportDate: string;            // Tanggal
  assetId: string;               // Asset ID
  assetCode: string;
  assetName: string;
  location?: string;
  reporter?: string;             // Pelapor
  reporterRole?: string;
  damageType?: string;           // Jenis Kerusakan
  severity?: 'RINGAN' | 'SEDANG' | 'BERAT' | 'TOTAL';
  damageLevel?: 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat';
  description?: string;          // Deskripsi Kerusakan
  issueDescription?: string;     // Alias deskripsi
  photo?: string;                // Foto Kerusakan
  estimatedCost: number;         // Estimasi Biaya
  priority: DamagePriority;      // Prioritas
  status: DamageReportStatus | 'SELESAI';    // Status
  workOrderId?: string;
}

export interface WorkOrder {
  id: string;                    // Nomor WO (e.g. WO-2026-001)
  woNumber?: string;             // Alias nomor WO
  damageReportId?: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  technician: string;
  vendor?: string;
  startDate: string;
  targetCompletionDate: string;
  completionDate?: string;
  estimatedCost: number;
  actualCost: number;
  costDifference: number;        // actualCost - estimatedCost
  usedSpareparts?: UsedSparepartItem[];
  sparepartCost?: number;
  serviceCost?: number;
  sparepartDetails?: string;
  serviceDetails?: string;
  notes?: string;
  status: WorkOrderStatus;
  paymentMethod?: 'Tunai' | 'Transfer' | 'QRIS' | 'EDC';
  bankDest?: string;
  financeTrxId?: string;
}

export interface Sparepart {
  id: string;                    // ID Sparepart
  sparepartCode: string;         // Kode Sparepart
  code?: string;                 // Alias Kode
  name: string;                  // Nama Sparepart
  category: string;              // Kategori
  supplier?: string;             // Supplier
  stock: number;                 // Stock
  unit?: string;                 // Satuan (pcs, set, box)
  minimumStock: number;          // Minimum Stock
  unitPrice: number;             // Harga Satuan
  unitCost?: number;             // Biaya Satuan
  storageLocation?: string;      // Lokasi Penyimpanan
  status?: 'Tersedia' | 'Low Stock' | 'Habis';
}

export interface AssetProcurement {
  id: string;                    // Nomor Pengadaan (e.g. PRC-2026-001)
  poNumber?: string;             // Alias PO
  title?: string;
  date?: string;                 // Tanggal
  orderDate?: string;
  assetName?: string;            // Nama Alat
  category?: AssetCategory;      // Kategori
  brand?: string;
  model?: string;
  supplier?: string;             // Supplier
  vendorName?: string;
  vendorPhone?: string;
  quantity?: number;             // Quantity
  unitPrice?: number;            // Harga Satuan
  discount?: number;             // Diskon
  tax?: number;                  // Pajak
  shippingCost?: number;         // Ongkos Kirim
  totalCost?: number;
  totalPurchase?: number;        // Total Pembelian
  fundingSource?: 'Kas Operasional' | 'Rekening Bank Mandiri' | 'Rekening Bank Artha Graha' | 'Modal Pemilik / Investor';
  paymentMethod?: 'Transfer' | 'Tunai' | 'QRIS' | 'EDC';
  targetLocation?: string;       // Lokasi
  pic?: string;                  // PIC
  status: ProcurementStatus;     // Status Pengadaan
  invoiceDoc?: string;           // Invoice
  photo?: string;                // Foto
  notes?: string;                // Catatan
  generatedAssetIds?: string[];
  financeTrxId?: string;
  items?: Array<{
    category: AssetCategory;
    name: string;
    brand: string;
    model?: string;
    serialNumber?: string;
    estimatedPrice: number;
    quantity: number;
  }>;
}

export interface AssetMovement {
  id: string;                    // ID Perpindahan
  assetId: string;
  assetCode: string;
  assetName: string;
  oldLocation: string;
  newLocation: string;
  fromLocation?: string;
  toLocation?: string;
  originLocation?: string;
  destinationLocation?: string;
  date: string;
  pic: string;
  reason: string;
  notes?: string;
}

export interface AssetDisposal {
  id: string;                    // ID Disposal
  assetId: string;
  assetCode: string;
  assetName: string;
  disposalDate: string;
  date?: string;
  reason: string;
  condition: string;
  method?: string;
  bookValue?: number;            // Nilai Buku jika tersedia
  residualValue?: number;
  saleValue?: number;            // Harga Jual jika dijual
  recoveryAmount?: number;
  buyer?: string;                // Pembeli
  proofDoc?: string;             // Bukti
  approvedBy: string;            // Approval
  notes?: string;
}

export interface InventoryAuditLog {
  id: string;
  userName: string;
  userRole: string;
  userId?: string;
  timestamp?: string;
  date?: string;
  time?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  assetId?: string;
  assetCode?: string;
  assetName?: string;
  activity?: string;
  details?: string;
  costImpact?: number;
  beforeData?: string;
  afterData?: string;
}

export interface ApprovalThresholdConfig {
  staffMaxAmount: number;        // e.g. 500,000 (Staff/Kasir)
  adminMaxAmount: number;        // e.g. 2,500,000 (Admin/Manager)
  requireManagementAbove: number;// e.g. 2,500,000 (Level Management)
}

// ==========================================
// SYSTEM SETTINGS & CONFIGURATION INTERFACES
// ==========================================

export type PrinterPaperWidth = '58mm' | '80mm' | 'a4' | 'letter';
export type PrinterConnectionType = 'browser' | 'bluetooth' | 'usb' | 'network';

export interface PrinterConfig {
  paperWidth: PrinterPaperWidth;
  connectionType: PrinterConnectionType;
  autoPrintOnPayment: boolean;
  storeName: string;
  storeTagline: string;
  storeAddress: string;
  storeCity: string;
  storePhone: string;
  headerNote: string;
  footerNote: string;
  showLogo: boolean;
  showBarcode: boolean;
  showCashierName: boolean;
  fontDensity: 'condensed' | 'normal' | 'large';
  autoCutPaper: boolean;
  printerIpAddress?: string;
  printerPort?: number;
  bluetoothDeviceName?: string;
  copiesCount: number;
}

export interface RoleActionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  voidRefund?: boolean;
  export?: boolean;
}

export interface RoleModulePermission {
  moduleId: string;
  moduleName: string;
  category: string;
  description: string;
  actions: RoleActionPermissions;
}

export interface RoleDefinition {
  role: UserRole;
  roleName: string;
  description: string;
  badgeColor: string;
  isSystemRole: boolean;
  permissions: Record<string, RoleActionPermissions>;
}

export interface GymBranch {
  id: string; // e.g. "BR-001"
  name: string; // e.g. "GymPro Flagship Kelapa Gading"
  code: string; // e.g. "KGD"
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  managerName?: string;
  managerPhone?: string;
  openHoursWeekday: string;
  openHoursWeekend: string;
  status: 'Aktif' | 'Nonaktif' | 'Renovasi';
  isMainBranch: boolean;
  facilities: string[];
  capacity?: number;
  totalMembers?: number;
  photo?: string;
  createdAt: string;
  notes?: string;
}

export interface GymBusinessProfile {
  gymName: string;
  tagline: string;
  branchName: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  website: string;
  npwp: string;
  openHoursWeekday: string;
  openHoursWeekend: string;
  googleMapsUrl?: string;
  logoUrl?: string;
}

export interface BankAccountConfig {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
  notes?: string;
}

export interface PaymentAndTaxConfig {
  taxEnabled: boolean;
  taxRate: number; // e.g. 11 (%)
  taxLabel: string; // e.g. "PB1 / PPN"
  serviceChargeEnabled: boolean;
  serviceChargeRate: number; // e.g. 2 (%)
  defaultFreezeFee: number; // e.g. 50000
  bankAccounts: BankAccountConfig[];
  qrisMerchantName: string;
  qrisNmid: string;
  defaultPaymentDueDays: number; // e.g. 14 hari
}

export interface WhatsAppTemplateConfig {
  posReceiptTemplate: string;
  memberWelcomeTemplate: string;
  piutangReminderTemplate: string;
  expiryReminderTemplate: string;
}

export interface PicProtectionConfig {
  requirePasswordToChangePic: boolean;
  picChangePassword: string;
  allowAdminBypass: boolean;
  requirePasswordOnTransaction?: boolean;
  requirePasswordOnMemberForm?: boolean;
  requirePasswordOnRenewal?: boolean;
  requirePasswordOnLeadHandover?: boolean; // Oper Alih Prospek CRM Leads
}

export interface SystemSettings {
  printer: PrinterConfig;
  profile: GymBusinessProfile;
  paymentAndTax: PaymentAndTaxConfig;
  templates: WhatsAppTemplateConfig;
  picProtection?: PicProtectionConfig;
  updatedAt?: string;
}


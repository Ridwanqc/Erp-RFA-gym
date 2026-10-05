-- =====================================================================
-- DATABASE SCHEMA: GYMPRO ENTERPRISE ERP
-- DIKUSTOMISASI UNTUK: MySQL / MariaDB (Niagahoster cPanel / phpMyAdmin)
-- Karakter Enkoding: utf8mb4 (Mendukung emoji, simbol, dan multibyte text)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- --------------------------------------------------------
-- 1. TABEL: users (Akun Karyawan, Kasir, Trainer, Admin)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('ADMIN', 'LEADER', 'KARYAWAN', 'KASIR', 'TRAINER', 'MEMBER') NOT NULL DEFAULT 'KARYAWAN',
  `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
  `branchId` VARCHAR(50) DEFAULT 'BR-001',
  `branchName` VARCHAR(100) DEFAULT 'Cabang Utama',
  `phone` VARCHAR(25) DEFAULT NULL,
  `gender` ENUM('L', 'P') DEFAULT 'L',
  `photo` TEXT DEFAULT NULL,
  `idType` VARCHAR(20) DEFAULT 'KTP',
  `idNumber` VARCHAR(50) DEFAULT NULL,
  `idPhoto` TEXT DEFAULT NULL,
  `birthDate` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `emergencyContact` VARCHAR(100) DEFAULT NULL,
  `failedLoginAttempts` INT NOT NULL DEFAULT 0,
  `lockedUntil` DATETIME DEFAULT NULL,
  `mustChangePassword` TINYINT(1) NOT NULL DEFAULT 0,
  `lastLoginAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_idx` (`role`),
  KEY `users_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. TABEL: user_sessions (Sesi Login & Refresh Token)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` VARCHAR(50) NOT NULL,
  `userId` VARCHAR(50) NOT NULL,
  `refreshTokenHash` VARCHAR(255) NOT NULL,
  `ipAddress` VARCHAR(45) DEFAULT NULL,
  `userAgent` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastUsedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` DATETIME NOT NULL,
  `revokedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_sessions_userId_idx` (`userId`),
  KEY `user_sessions_refreshTokenHash_idx` (`refreshTokenHash`),
  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. TABEL: members (Data Member Gym)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `members` (
  `id` VARCHAR(50) NOT NULL,
  `memberCode` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(25) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `gender` ENUM('L', 'P') DEFAULT 'L',
  `photo` TEXT DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'Aktif',
  `branchId` VARCHAR(50) NOT NULL DEFAULT 'BR-001',
  `branchName` VARCHAR(100) DEFAULT 'Cabang Utama',
  `membershipType` VARCHAR(100) DEFAULT 'Reguler 1 Bulan',
  `expired` DATE DEFAULT NULL,
  `ptQuota` INT DEFAULT 0,
  `isFrozen` TINYINT(1) DEFAULT 0,
  `assignedTrainerId` VARCHAR(50) DEFAULT NULL,
  `picId` VARCHAR(50) DEFAULT 'S01',
  `picName` VARCHAR(100) DEFAULT 'Admin Front Desk',
  `idType` VARCHAR(20) DEFAULT 'KTP',
  `idNumber` VARCHAR(50) DEFAULT NULL,
  `idPhoto` TEXT DEFAULT NULL,
  `birthDate` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `emergencyContact` VARCHAR(100) DEFAULT NULL,
  `joinDate` DATE DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `members_memberCode_unique` (`memberCode`),
  KEY `members_phone_idx` (`phone`),
  KEY `members_branchId_idx` (`branchId`),
  KEY `members_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. TABEL: memberships (Riwayat Paket & Langganan Member)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `memberships` (
  `id` VARCHAR(50) NOT NULL,
  `memberId` VARCHAR(50) NOT NULL,
  `planName` VARCHAR(100) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'Aktif',
  `isFrozen` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `memberships_memberId_idx` (`memberId`),
  CONSTRAINT `fk_memberships_member` FOREIGN KEY (`memberId`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. TABEL: packages (Master Data Paket Membership & PT)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `packages` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'Membership',
  `price` DECIMAL(12, 2) NOT NULL,
  `durationDays` INT NOT NULL DEFAULT 30,
  `sessions` INT DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. TABEL: transactions (Kasir POS & Transaksi Pembayaran)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(50) NOT NULL,
  `invoiceNumber` VARCHAR(50) NOT NULL,
  `memberId` VARCHAR(50) DEFAULT NULL,
  `cashierId` VARCHAR(50) NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('PENDING', 'PAID', 'CANCELLED', 'VOIDED', 'REFUNDED') NOT NULL DEFAULT 'PAID',
  `paymentMethod` VARCHAR(50) NOT NULL,
  `isVoided` TINYINT(1) NOT NULL DEFAULT 0,
  `voidReason` VARCHAR(255) DEFAULT NULL,
  `voidedBy` VARCHAR(100) DEFAULT NULL,
  `voidedAt` DATETIME DEFAULT NULL,
  `closingId` VARCHAR(50) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactions_invoiceNumber_unique` (`invoiceNumber`),
  KEY `transactions_status_idx` (`status`),
  KEY `transactions_createdAt_idx` (`createdAt`),
  KEY `transactions_memberId_idx` (`memberId`),
  KEY `transactions_cashierId_idx` (`cashierId`),
  CONSTRAINT `fk_transactions_member` FOREIGN KEY (`memberId`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transactions_cashier` FOREIGN KEY (`cashierId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. TABEL: payments (Detail Pembayaran Transaksi)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(50) NOT NULL,
  `transactionId` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `paymentMethod` VARCHAR(50) NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
  `verifiedBy` VARCHAR(100) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payments_transactionId_idx` (`transactionId`),
  CONSTRAINT `fk_payments_transaction` FOREIGN KEY (`transactionId`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. TABEL: attendances (Presensi Check-In / Out Member)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendances` (
  `id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `timeIn` VARCHAR(20) NOT NULL,
  `timeOut` VARCHAR(20) DEFAULT NULL,
  `memberId` VARCHAR(50) NOT NULL,
  `memberName` VARCHAR(100) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'Reguler',
  `badge` VARCHAR(50) DEFAULT 'Gym Reguler',
  `lockerNumber` INT DEFAULT NULL,
  `lockerReturned` TINYINT(1) DEFAULT 0,
  `hasTowel` TINYINT(1) DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attendances_date_idx` (`date`),
  KEY `attendances_memberId_idx` (`memberId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. TABEL: daily_closings (Tutup Kasir Harian)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `daily_closings` (
  `id` VARCHAR(50) NOT NULL,
  `closingDate` DATE NOT NULL,
  `branchId` VARCHAR(50) NOT NULL,
  `cashierId` VARCHAR(50) NOT NULL,
  `totalCash` DECIMAL(12, 2) NOT NULL,
  `totalNonCash` DECIMAL(12, 2) NOT NULL,
  `totalAmount` DECIMAL(12, 2) NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'CLOSED',
  `closedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `daily_closings_closingDate_idx` (`closingDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. TABEL: audit_logs (Jejak Aktivitas Audit Trail)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(50) NOT NULL,
  `userId` VARCHAR(50) DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `recordId` VARCHAR(100) DEFAULT NULL,
  `oldValue` TEXT DEFAULT NULL,
  `newValue` TEXT DEFAULT NULL,
  `ipAddress` VARCHAR(45) DEFAULT NULL,
  `userAgent` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_logs_action_idx` (`action`),
  KEY `audit_logs_module_idx` (`module`),
  KEY `audit_logs_createdAt_idx` (`createdAt`),
  KEY `audit_logs_userId_idx` (`userId`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. TABEL: security_events (Log Keamanan Sistem)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `security_events` (
  `id` VARCHAR(50) NOT NULL,
  `eventType` VARCHAR(50) NOT NULL,
  `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `ipAddress` VARCHAR(45) DEFAULT NULL,
  `userAgent` VARCHAR(255) DEFAULT NULL,
  `userId` VARCHAR(50) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `security_events_severity_idx` (`severity`),
  KEY `security_events_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- DATA AWAL (SEED DATA / DEFAULT ACCOUNTS)
-- --------------------------------------------------------

-- Default Admin User (Password: admin123)
-- Hash Bcrypt salt rounds 10
INSERT INTO `users` (`id`, `username`, `email`, `passwordHash`, `name`, `role`, `status`, `branchId`, `branchName`)
VALUES 
('usr-admin-001', 'admin', 'admin@gympro.com', '$2a$10$wOqZp9Z0p4H7L8hRkO4mO.oQ3cK.E1T8aM5wU2kQ7yR9vJ1bS6tWq', 'Super Administrator', 'ADMIN', 'ACTIVE', 'BR-001', 'Cabang Utama'),
('usr-kasir-001', 'kasir1', 'kasir@gympro.com', '$2a$10$wOqZp9Z0p4H7L8hRkO4mO.oQ3cK.E1T8aM5wU2kQ7yR9vJ1bS6tWq', 'Front Desk & Kasir', 'KASIR', 'ACTIVE', 'BR-001', 'Cabang Utama'),
('usr-trainer-001', 'coach_budi', 'budi@gympro.com', '$2a$10$wOqZp9Z0p4H7L8hRkO4mO.oQ3cK.E1T8aM5wU2kQ7yR9vJ1bS6tWq', 'Coach Budi Santoso', 'TRAINER', 'ACTIVE', 'BR-001', 'Cabang Utama')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Default Packages
INSERT INTO `packages` (`id`, `name`, `category`, `price`, `durationDays`, `sessions`, `active`)
VALUES
('PKG-001', 'Paket Member 1 Bulan Reguler', 'Membership', 350000.00, 30, 0, 1),
('PKG-002', 'Paket Member 3 Bulan Hemat', 'Membership', 950000.00, 90, 0, 1),
('PKG-003', 'Paket Member 1 Tahun VIP', 'Membership', 3200000.00, 365, 0, 1),
('PKG-004', 'Personal Trainer 10 Sesi', 'PT', 1500000.00, 45, 10, 1),
('PKG-005', 'Daily Pass / Kunjungan Harian', 'Daily', 50000.00, 1, 0, 1)
ON DUPLICATE KEY UPDATE `price` = VALUES(`price`);

-- Sample Member
INSERT INTO `members` (`id`, `memberCode`, `name`, `phone`, `email`, `gender`, `status`, `branchId`, `branchName`, `membershipType`, `expired`, `ptQuota`, `isFrozen`)
VALUES
('MEM-001', 'GP-M001', 'Nadia Paramitha', '081299887766', 'nadia.paramitha@gmail.com', 'P', 'Aktif', 'BR-001', 'Cabang Utama', 'Paket Member 3 Bulan Hemat', DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), 5, 0),
('MEM-002', 'GP-M002', 'Dimas Anggara', '081344556677', 'dimas.anggara@gmail.com', 'L', 'Aktif', 'BR-001', 'Cabang Utama', 'Paket Member 1 Bulan Reguler', DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 0, 0)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

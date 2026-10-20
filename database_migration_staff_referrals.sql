-- =============================================================================
-- Migration: Admin-Controlled Staff Management & Referral Earnings System
-- Target: MySQL 8.0+ / MariaDB 10.4+ (Hostinger Shared Hosting Compatible)
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- Safe Additive Migration: Does NOT drop or reset any existing tables or production data
-- =============================================================================

SET NAMES utf8mb4;

-- 1. Staff Users Table
-- Stores admin-created staff accounts with unique referral code and security flags
CREATE TABLE IF NOT EXISTS `staff_users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(32) NULL,
  `role` VARCHAR(64) NOT NULL DEFAULT 'recruitment_officer',
  `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  `referral_code` VARCHAR(32) NOT NULL UNIQUE,
  `monthly_target` INT UNSIGNED NOT NULL DEFAULT 15,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login` DATETIME NULL,
  `created_by_admin_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_staff_code` (`referral_code`),
  INDEX `idx_staff_status` (`status`),
  INDEX `idx_staff_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Staff Bonus Tiers Table
-- Configurable tiers for bonus calculations and commission rules
CREATE TABLE IF NOT EXISTS `staff_bonus_tiers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tier_name` VARCHAR(50) NOT NULL UNIQUE,
  `min_verified_referrals` INT UNSIGNED NOT NULL,
  `bonus_amount_pkr` DECIMAL(10,2) NOT NULL,
  `commission_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `description` VARCHAR(255) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Staff Bonus & Earnings Records Table
-- Tracks monthly bonus eligibility, admin authorization, and banking disbursement
CREATE TABLE IF NOT EXISTS `staff_bonus_records` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `staff_id` INT UNSIGNED NOT NULL,
  `period_month` VARCHAR(7) NOT NULL, -- e.g. '2026-10'
  `verified_referrals_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `verified_revenue_pkr` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bonus_amount_pkr` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tier_name` VARCHAR(50) NOT NULL,
  `status` ENUM('Pending Review', 'Approved', 'Disbursed / Paid', 'Rejected') NOT NULL DEFAULT 'Pending Review',
  `approved_by` VARCHAR(150) NULL,
  `approved_at` DATETIME NULL,
  `paid_ref` VARCHAR(100) NULL,
  `paid_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bonus_staff_user` FOREIGN KEY (`staff_id`) REFERENCES `staff_users` (`id`) ON DELETE CASCADE,
  INDEX `idx_bonus_month` (`period_month`),
  INDEX `idx_bonus_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Rate-Limiting Protection Table for Staff & Admin Login
CREATE TABLE IF NOT EXISTS `staff_login_attempts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username_or_email` VARCHAR(100) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `attempt_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_attempt_lookup` (`ip_address`, `username_or_email`, `attempt_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Add Referral Attribution Columns to `applications` table if not already present
-- MariaDB/MySQL compatible procedure to conditionally add columns
SET @dbname = DATABASE();
SET @tablename = 'applications';

-- Add referral_code column
SET @columnname = 'referral_code';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `applications` ADD COLUMN `referral_code` VARCHAR(32) NULL AFTER `job_id`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add referred_by_staff_id column
SET @columnname = 'referred_by_staff_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `applications` ADD COLUMN `referred_by_staff_id` INT UNSIGNED NULL AFTER `referral_code`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 6. Insert Default Configurable Bonus Tiers (if empty)
INSERT INTO `staff_bonus_tiers` (`tier_name`, `min_verified_referrals`, `bonus_amount_pkr`, `commission_percent`, `description`, `is_active`)
VALUES
  ('Bronze Tier', 5, 2500.00, 3.00, 'Entry milestone for active field officers achieving 5 verified submissions', 1),
  ('Silver Tier', 15, 7500.00, 5.00, 'Standard target milestone for 15 verified candidates with fee verified', 1),
  ('Gold Tier', 30, 18000.00, 7.50, 'High achiever milestone for 30 verified candidates', 1),
  ('Platinum Tier', 50, 35000.00, 10.00, 'Regional champion milestone with 10% commission on verified revenue', 1)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

-- 7. Insert Initial Sample Staff Members (Admin created, default temp password: ChangeMe@2026!)
-- Bcrypt hash generated using cost=12 ($2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a)
INSERT INTO `staff_users` (`username`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`, `monthly_target`, `must_change_password`)
VALUES
  ('staff_tariq', 'tariq.mahmood@saudijobsportal.pk', '$2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a', 'Tariq Mahmood', '0301-5582910', 'recruitment_officer', 'active', 'STF-TRQ-9021', 15, 1),
  ('staff_ayesha', 'ayesha.rehman@saudijobsportal.pk', '$2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a', 'Ayesha Rehman', '0321-4829102', 'field_coordinator', 'active', 'STF-AYS-4182', 20, 1),
  ('staff_bilal', 'bilal.shah@saudijobsportal.pk', '$2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a', 'Bilal Shah', '0333-9182746', 'community_ambassador', 'active', 'STF-BIL-7734', 12, 1)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 8. Audit trail entry for schema migration
INSERT INTO `audit_logs` (`actor`, `role`, `action`, `details`, `ip_address`)
VALUES ('System Migration', 'super_admin', 'STAFF_REFERRAL_SYSTEM_INSTALLED', 'Successfully executed additive database migration for staff management, bonus tiers, and referral attribution.', '127.0.0.1');

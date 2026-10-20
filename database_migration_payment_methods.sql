-- =============================================================================
-- Migration: Admin-Managed Payment Methods & Gateways
-- Description: Additive migration for multiple configurable payment methods,
-- QR code validation, snapshot recording, and duplicate reference detection.
-- Preserves all existing tables and records.
-- =============================================================================

SET NAMES utf8mb4;

-- 1. Create payment_methods table if not exists
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` ENUM('bank_transfer', 'easypaisa', 'jazzcash', 'nayapay', 'sadapay', 'raast', 'bank_challan', 'other') NOT NULL DEFAULT 'bank_transfer',
  `account_title` VARCHAR(150) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `iban` VARCHAR(50) NULL,
  `bank_name` VARCHAR(150) NULL,
  `instructions` TEXT NOT NULL,
  `reference_instructions` VARCHAR(255) NULL,
  `qr_code_file_path` VARCHAR(255) NULL,
  `qr_code_image_data` LONGTEXT NULL,
  `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
  `display_order` INT NOT NULL DEFAULT 1,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_paymethod_status` (`status`),
  INDEX `idx_paymethod_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Additive columns for historical snapshots and duplicate tracking in payments table
-- (Using stored procedure for idempotent column addition across MySQL / MariaDB)
DROP PROCEDURE IF EXISTS `AddPaymentMethodSnapshotColumns`;
DELIMITER $$
CREATE PROCEDURE `AddPaymentMethodSnapshotColumns`()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'payment_method_id'
  ) THEN
    ALTER TABLE `payments` ADD COLUMN `payment_method_id` VARCHAR(64) NULL AFTER `payment_method`;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'account_title_snapshot'
  ) THEN
    ALTER TABLE `payments` ADD COLUMN `account_title_snapshot` VARCHAR(150) NULL AFTER `bank_name`;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'account_number_snapshot'
  ) THEN
    ALTER TABLE `payments` ADD COLUMN `account_number_snapshot` VARCHAR(100) NULL AFTER `account_title_snapshot`;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'fee_snapshot_pkr'
  ) THEN
    ALTER TABLE `payments` ADD COLUMN `fee_snapshot_pkr` DECIMAL(10,2) NULL AFTER `amount_pkr`;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'instructions_snapshot'
  ) THEN
    ALTER TABLE `payments` ADD COLUMN `instructions_snapshot` TEXT NULL AFTER `account_number_snapshot`;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'is_duplicate_flagged'
  ) THEN
    ALTER TABLE `payments` ADD COLUMN `is_duplicate_flagged` TINYINT(1) DEFAULT 0 AFTER `status`;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'duplicate_matching_tracking_id'
  ) THEN
    ALTER TABLE `payments` ADD COLUMN `duplicate_matching_tracking_id` VARCHAR(32) NULL AFTER `is_duplicate_flagged`;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'reviewer_id'
  ) THEN
    ALTER TABLE `payments` ADD COLUMN `reviewer_id` INT UNSIGNED NULL AFTER `verified_by`;
  END IF;
END$$
DELIMITER ;

CALL `AddPaymentMethodSnapshotColumns`();
DROP PROCEDURE IF EXISTS `AddPaymentMethodSnapshotColumns`;

-- 3. Seed baseline payment methods if table is empty
INSERT IGNORE INTO `payment_methods` (
  `id`, `name`, `type`, `account_title`, `account_number`, `iban`, `bank_name`,
  `instructions`, `reference_instructions`, `status`, `display_order`, `is_default`
) VALUES
(
  'paymethod-meezan',
  'Meezan Bank Limited (Designated Official Escrow)',
  'bank_transfer',
  'Saudi Jobs Application Processing Escrow',
  '02010108920192',
  'PK36MEZN0002010108920192',
  'Meezan Bank Limited, Blue Area Islamabad Branch',
  'Transfer fee via Meezan Mobile App, 1Link Internet Banking, or over-the-counter deposit at any Meezan Bank branch across Pakistan.',
  'Mandatory: Enter your 14-character Tracking ID (e.g. SAJ-2026-000101) in transfer comments or deposit slip description.',
  'active',
  1,
  1
),
(
  'paymethod-jazzcash',
  'JazzCash Corporate Account / Merchant Wallet',
  'jazzcash',
  'Consular Recruitment Operations Escrow',
  '0300-8920190',
  NULL,
  'Mobilink Microfinance Bank Limited (JazzCash)',
  'Open JazzCash App -> Send Money -> To Mobile Account -> Enter 0300-8920190 -> Enter Amount PKR 4,500. Verify the account title before confirming PIN.',
  'Write your Tracking ID in transfer purpose. Keep transaction ID (TID) screenshot for submission.',
  'active',
  2,
  0
),
(
  'paymethod-easypaisa',
  'EasyPaisa Merchant & Mobile Account',
  'easypaisa',
  'Saudi Recruitment Verification Services',
  '0345-9182374',
  NULL,
  'Telenor Microfinance Bank Limited (EasyPaisa)',
  'Open EasyPaisa App -> Select Send Money -> EasyPaisa Account -> Enter 0345-9182374 -> Enter Amount PKR 4,500. Verify the registered title before confirming.',
  'Include your Tracking ID in message note. Capture screenshot showing EasyPaisa Transaction ID.',
  'active',
  3,
  0
),
(
  'paymethod-raast',
  'State Bank Raast Instant P2M / P2P Gateway',
  'raast',
  'Saudi Jobs Application Processing Escrow',
  'RAAST-ID: 03008920190',
  'PK36MEZN0002010108920192',
  'State Bank of Pakistan Raast Instant Settlement',
  'In any Pakistani banking app, select Raast Payment -> Enter Raast ID 03008920190 or IBAN PK36MEZN0002010108920192 -> Instant Zero-Fee Interbank Transfer.',
  'Add your application Tracking ID in the Raast payment remarks / reference narrative.',
  'active',
  4,
  0
),
(
  'paymethod-challan',
  'Official 3-Part Bank Challan Slip (Over-The-Counter)',
  'bank_challan',
  'Saudi Jobs Application Processing Escrow',
  '02010108920192',
  NULL,
  'Habib Bank Limited (HBL) / Meezan Bank Branches Nationwide',
  'Generate and print the pre-filled 3-part bank deposit challan from this portal. Deposit cash over-the-counter at any bank branch. Collect the stamped Candidate Copy.',
  'Ensure the bank teller stamps and enters the 6-digit bank voucher journal number on your copy.',
  'active',
  5,
  0
);

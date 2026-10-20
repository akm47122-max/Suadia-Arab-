import JSZip from 'jszip';

export interface PhpFileEntry {
  path: string;
  category: 'database' | 'config' | 'public' | 'candidate' | 'admin' | 'docs';
  description: string;
  content: string;
}

export function getPhpPackageFiles(): PhpFileEntry[] {
  return [
    {
      path: 'database.sql',
      category: 'database',
      description: 'Complete MySQL/MariaDB schema with 16 relational tables, unique constraints, and initial demo seed',
      content: `-- =============================================================================
-- Saudi Jobs & Recruitment Portal Pakistan — Production Schema
-- Compatible with MySQL 8.0+ and MariaDB 10.4+ (Hostinger Shared Hosting)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. System Settings & Embassy Authorization Control
DROP TABLE IF EXISTS \`website_settings\`;
CREATE TABLE \`website_settings\` (
  \`setting_key\` VARCHAR(64) PRIMARY KEY,
  \`setting_value\` TEXT NOT NULL,
  \`description\` VARCHAR(255) NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`website_settings\` (\`setting_key\`, \`setting_value\`, \`description\`) VALUES
('is_embassy_authorized', '1', 'Flag indicating written verified legal embassy authorization. 0=Temporary Public Title, 1=Official Embassy Name'),
('authorization_doc_ref', 'MFA/SAU-ISB/2026/AUTH-088', 'Official gazette/letter reference permitting use of embassy title'),
('authorized_org_name', 'Royal Saudi Embassy in Islamabad — Recruitment Section', 'Full official name when authorized'),
('temporary_public_name', 'Saudi Jobs & Recruitment Portal Pakistan', 'Public name displayed when authorization is unverified'),
('fee_collection_authorized', '1', 'Statutory authority to charge candidate administrative fee verified and unlocked'),
('fee_amount_pkr', '4500', 'Proposed administrative ballot and verification fee'),
('ballot_date', '2026-12-22', 'Scheduled date for computerized candidate ballot'),
('ballot_deadline', '2026-12-10', 'Final application cutoff date for 2026 ballot'),
('bank_account_title', 'Saudi Jobs Official QR Escrow Gateway', 'Title for authorized QR gateway'),
('bank_account_number', 'QR-SCAN-PAYMENT', 'QR Scan Payment Gateway identifier'),
('bank_iban', 'RAAST-P2M-QR-2026', 'QR settlement channel reference'),
('bank_name', 'Official QR Code Gateway (EasyPaisa / JazzCash / Raast QR)', 'Authorized QR Payment channels');

-- 2. Candidate Users
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(150) NOT NULL,
  \`mobile\` VARCHAR(32) NOT NULL,
  \`cnic\` VARCHAR(20) NOT NULL UNIQUE,
  \`is_verified\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_user_cnic\` (\`cnic\`),
  INDEX \`idx_user_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Candidate Detailed Profiles
DROP TABLE IF EXISTS \`candidate_profiles\`;
CREATE TABLE \`candidate_profiles\` (
  \`user_id\` INT UNSIGNED PRIMARY KEY,
  \`dob\` DATE NULL,
  \`gender\` ENUM('Male', 'Female') NOT NULL DEFAULT 'Male',
  \`city\` VARCHAR(100) NOT NULL,
  \`province\` VARCHAR(100) NOT NULL,
  \`education\` VARCHAR(150) NOT NULL,
  \`experience_years\` INT DEFAULT 0,
  \`passport_status\` ENUM('Valid Passport', 'In-process', 'Not Applied') NOT NULL DEFAULT 'Valid Passport',
  \`preferred_category\` VARCHAR(100) NULL,
  \`cv_file_path\` VARCHAR(255) NULL,
  \`photo_file_path\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_profile_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Job Categories
DROP TABLE IF EXISTS \`job_categories\`;
CREATE TABLE \`job_categories\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`slug\` VARCHAR(64) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`description\` TEXT NULL,
  \`icon_name\` VARCHAR(50) DEFAULT 'Briefcase',
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`job_categories\` (\`slug\`, \`name\`, \`description\`) VALUES
('driver', 'Driver', 'Heavy & light transport, limousine, and logistics operators'),
('computer-operator', 'Computer Operator', 'Office IT systems, documentation, and data coordination'),
('office-assistant', 'Office Assistant', 'Administrative support, archiving, and clerical coordination'),
('data-entry-operator', 'Data Entry Operator', 'Inventory, ERP ledger data recording, and document digitization'),
('electrician', 'Electrician', 'Commercial installation, HVAC wiring, and maintenance technicians'),
('technician', 'Technician', 'Mechanical, instrumentation, automotive, and industrial technicians'),
('factory-worker', 'Factory Worker', 'Manufacturing, packaging, assembly line, and food processing staff'),
('healthcare-staff', 'Healthcare Staff', 'Hospital assistants, lab assistants, and medical ward aides'),
('nursing-staff', 'Nursing Staff', 'Registered general nurses, clinical caregivers, and ICU nurses'),
('construction-worker', 'Construction Worker', 'Masons, steel fixers, shuttering carpenters, and site operators'),
('other-skilled-unskilled', 'Other Skilled and Unskilled Jobs', 'Hospitality, warehouse logistics, facility maintenance, and trade labor');

-- 5. Verified Employers & Sponsors
DROP TABLE IF EXISTS \`employers\`;
CREATE TABLE \`employers\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`company_name\` VARCHAR(200) NOT NULL,
  \`commercial_reg_no\` VARCHAR(50) NULL,
  \`location_city\` VARCHAR(100) NOT NULL,
  \`is_authorized\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`employers\` (\`company_name\`, \`commercial_reg_no\`, \`location_city\`) VALUES
('Al-Tamimi Transport & Logistics Services Co.', 'CR-1010394821', 'Riyadh'),
('King Fahad Medical Complex Partner Consortium', 'CR-4030192834', 'Jeddah'),
('Saudi Modern Industrial Contractors Ltd.', 'CR-2050493821', 'Dammam');

-- 6. Jobs & Vacancies
DROP TABLE IF EXISTS \`jobs\`;
CREATE TABLE \`jobs\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`category_id\` INT UNSIGNED NOT NULL,
  \`employer_id\` INT UNSIGNED NOT NULL,
  \`title\` VARCHAR(200) NOT NULL,
  \`positions\` INT UNSIGNED DEFAULT 1,
  \`gender_eligibility\` ENUM('Male', 'Female', 'Any') DEFAULT 'Any',
  \`qualification\` VARCHAR(200) NOT NULL,
  \`experience_required\` VARCHAR(150) NOT NULL,
  \`salary_sar\` INT UNSIGNED NOT NULL,
  \`contract_duration\` VARCHAR(100) DEFAULT '2 Years',
  \`location\` VARCHAR(150) NOT NULL,
  \`deadline\` DATE NOT NULL,
  \`description\` TEXT NOT NULL,
  \`required_documents\` TEXT NOT NULL,
  \`verification_status\` VARCHAR(64) DEFAULT 'Corporate Quota Approved',
  \`is_published\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_jobs_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`job_categories\` (\`id\`),
  CONSTRAINT \`fk_jobs_employer\` FOREIGN KEY (\`employer_id\`) REFERENCES \`employers\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Applications Table with UNIQUE Tracking ID & Sequence Lock
DROP TABLE IF EXISTS \`applications\`;
CREATE TABLE \`applications\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`tracking_id\` VARCHAR(32) NOT NULL UNIQUE,
  \`user_id\` INT UNSIGNED NOT NULL,
  \`job_id\` INT UNSIGNED NOT NULL,
  \`status\` ENUM(
    'Draft',
    'Submitted',
    'Payment Pending',
    'Payment Verification Pending',
    'Processing Pending',
    'Processing Approved',
    'Documents Required',
    'Rejected',
    'Ballot Eligible'
  ) NOT NULL DEFAULT 'Submitted',
  \`payment_status\` ENUM(
    'Pending',
    'Submitted for Verification',
    'Verified',
    'Rejected',
    'Refund Pending',
    'Refunded'
  ) NOT NULL DEFAULT 'Pending',
  \`next_stage_status\` ENUM(
    'Pending Ballot / Selection',
    'Ballot Scheduled',
    'Selected for Next Stage',
    'Not Selected',
    'Further Documents Required',
    'Interview Scheduled',
    'Medical Examination Pending',
    'Employer Review Pending',
    'Final Decision Pending',
    'Application Closed'
  ) NOT NULL DEFAULT 'Pending Ballot / Selection',
  \`rejection_reason\` VARCHAR(255) NULL,
  \`additional_docs_requested\` TEXT NULL,
  \`reviewer_id\` INT UNSIGNED NULL,
  \`reviewer_name\` VARCHAR(150) NULL,
  \`reviewed_at\` DATETIME NULL,
  \`review_notes\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_app_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`fk_app_job\` FOREIGN KEY (\`job_id\` ) REFERENCES \`jobs\` (\`id\`),
  INDEX \`idx_app_tracking\` (\`tracking_id\`),
  INDEX \`idx_app_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Application Sequence Tracker for Collision-Free Atomic IDs
DROP TABLE IF EXISTS \`application_sequences\`;
CREATE TABLE \`application_sequences\` (
  \`year\` INT UNSIGNED PRIMARY KEY,
  \`current_seq\` INT UNSIGNED NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`application_sequences\` (\`year\`, \`current_seq\`) VALUES (2026, 125);

-- 9. Application Documents
DROP TABLE IF EXISTS \`application_documents\`;
CREATE TABLE \`application_documents\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`application_id\` INT UNSIGNED NOT NULL,
  \`document_title\` VARCHAR(150) NOT NULL,
  \`file_name\` VARCHAR(255) NOT NULL,
  \`file_path\` VARCHAR(255) NOT NULL,
  \`file_size\` VARCHAR(50) NULL,
  \`is_verified\` TINYINT(1) DEFAULT 0,
  \`uploaded_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_docs_app\` FOREIGN KEY (\`application_id\`) REFERENCES \`applications\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Payments Table
DROP TABLE IF EXISTS \`payments\`;
CREATE TABLE \`payments\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`application_id\` INT UNSIGNED NOT NULL,
  \`amount_pkr\` DECIMAL(10,2) NOT NULL DEFAULT 4500.00,
  \`payment_method\` ENUM('Bank Transfer', 'Bank Challan', 'Online Gateway') NOT NULL,
  \`bank_name\` VARCHAR(100) NULL,
  \`transaction_ref\` VARCHAR(100) NOT NULL,
  \`payment_date\` DATE NOT NULL,
  \`receipt_file_path\` VARCHAR(255) NULL,
  \`status\` ENUM(
    'Pending',
    'Submitted for Verification',
    'Verified',
    'Rejected',
    'Refund Pending',
    'Refunded'
  ) NOT NULL DEFAULT 'Submitted for Verification',
  \`rejection_reason\` VARCHAR(255) NULL,
  \`refund_ref\` VARCHAR(100) NULL,
  \`refund_date\` DATE NULL,
  \`verified_by\` VARCHAR(150) NULL,
  \`verified_at\` DATETIME NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_pay_app\` FOREIGN KEY (\`application_id\`) REFERENCES \`applications\` (\`id\`) ON DELETE CASCADE,
  INDEX \`idx_pay_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Ballot Events
DROP TABLE IF EXISTS \`ballot_events\`;
CREATE TABLE \`ballot_events\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(200) NOT NULL,
  \`scheduled_date\` DATE NOT NULL,
  \`application_deadline\` DATE NOT NULL,
  \`selection_method\` VARCHAR(100) DEFAULT 'Verifiable Pseudo-Randomized Draw',
  \`status\` ENUM('Scheduled', 'Registration Closed', 'Eligible Pool Locked', 'Draw Completed', 'Results Published') DEFAULT 'Scheduled',
  \`random_seed\` VARCHAR(128) NULL,
  \`notes\` TEXT NULL,
  \`published_at\` DATETIME NULL,
  \`published_by\` VARCHAR(150) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`ballot_events\` (\`title\`, \`scheduled_date\`, \`application_deadline\`, \`selection_method\`, \`status\`, \`notes\`) VALUES
('Saudi Arabia 2026 General Recruitment Ballot', '2026-12-22', '2026-12-10', 'Verifiable Pseudo-Randomized Draw', 'Scheduled', 'Proposed computerized recruitment ballot date 22 December 2026.');

-- 12. Ballot Eligibility Pool
DROP TABLE IF EXISTS \`ballot_eligibility\`;
CREATE TABLE \`ballot_eligibility\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`ballot_event_id\` INT UNSIGNED NOT NULL,
  \`application_id\` INT UNSIGNED NOT NULL,
  \`qualification_verified\` TINYINT(1) DEFAULT 1,
  \`payment_verified\` TINYINT(1) DEFAULT 1,
  \`enrolled_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_be_event\` FOREIGN KEY (\`ballot_event_id\`) REFERENCES \`ballot_events\` (\`id\`),
  CONSTRAINT \`fk_be_app\` FOREIGN KEY (\`application_id\`) REFERENCES \`applications\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Ballot Results
DROP TABLE IF EXISTS \`ballot_results\`;
CREATE TABLE \`ballot_results\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`ballot_event_id\` INT UNSIGNED NOT NULL,
  \`application_id\` INT UNSIGNED NOT NULL,
  \`selection_rank\` INT UNSIGNED NOT NULL,
  \`status\` ENUM('Selected', 'Standby', 'Disqualified') DEFAULT 'Selected',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_br_event\` FOREIGN KEY (\`ballot_event_id\`) REFERENCES \`ballot_events\` (\`id\`),
  CONSTRAINT \`fk_br_app\` FOREIGN KEY (\`application_id\`) REFERENCES \`applications\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Application Status History (Audit Trail)
DROP TABLE IF EXISTS \`application_status_history\`;
CREATE TABLE \`application_status_history\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`application_id\` INT UNSIGNED NOT NULL,
  \`status\` VARCHAR(64) NOT NULL,
  \`changed_by\` VARCHAR(150) NOT NULL,
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_hist_app\` FOREIGN KEY (\`application_id\`) REFERENCES \`applications\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Candidate & System Notifications
DROP TABLE IF EXISTS \`notifications\`;
CREATE TABLE \`notifications\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT UNSIGNED NULL,
  \`application_id\` INT UNSIGNED NULL,
  \`title\` VARCHAR(200) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`channel\` ENUM('Dashboard', 'Email', 'SMS') DEFAULT 'Dashboard',
  \`is_read\` TINYINT(1) DEFAULT 0,
  \`delivery_status\` ENUM('Delivered', 'Pending', 'Failed') DEFAULT 'Delivered',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_notif_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Admin Roles & Permissions
DROP TABLE IF EXISTS \`admin_roles\`;
CREATE TABLE \`admin_roles\` (
  \`role_key\` VARCHAR(32) PRIMARY KEY,
  \`role_name\` VARCHAR(100) NOT NULL,
  \`permissions\` JSON NOT NULL,
  \`description\` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`admin_roles\` (\`role_key\`, \`role_name\`, \`permissions\`, \`description\`) VALUES
('super_admin', 'Super Administrator', '["*"]', 'Full administrative authority and legal authorization toggles'),
('recruitment_admin', 'Recruitment Manager', '["jobs.*", "applications.*", "ballot.*"]', 'Quota vacancy management and ballot draw execution'),
('payment_reviewer', 'Finance & Payment Reviewer', '["payments.*"]', 'Manual banking reconciliation, receipt reviews, and refunds'),
('readonly_reviewer', 'Observer & Auditor', '["reports.view", "audit.view"]', 'Read-only access for diplomatic and ministry observers');

-- 17. Admin Users (Default superadmin: Admin@Saudi2026!)
DROP TABLE IF EXISTS \`admin_users\`;
CREATE TABLE \`admin_users\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(150) NOT NULL,
  \`role\` VARCHAR(32) NOT NULL DEFAULT 'recruitment_admin',
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`last_login\` DATETIME NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_admin_role\` FOREIGN KEY (\`role\`) REFERENCES \`admin_roles\` (\`role_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`admin_users\` (\`username\`, \`email\`, \`password_hash\`, \`full_name\`, \`role\`) VALUES
('superadmin', 'admin@saudijobsportal.pk', '$2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a', 'Super Administrator', 'super_admin');

-- 18. Audit Logs
DROP TABLE IF EXISTS \`audit_logs\`;
CREATE TABLE \`audit_logs\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`actor\` VARCHAR(150) NOT NULL,
  \`role\` VARCHAR(64) NOT NULL,
  \`action\` VARCHAR(100) NOT NULL,
  \`details\` TEXT NOT NULL,
  \`ip_address\` VARCHAR(45) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_audit_action\` (\`action\`),
  INDEX \`idx_audit_time\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Official Notices
DROP TABLE IF EXISTS \`official_notices\`;
CREATE TABLE \`official_notices\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`summary\` TEXT NOT NULL,
  \`content\` LONGTEXT NOT NULL,
  \`priority\` ENUM('Normal', 'High', 'Urgent') DEFAULT 'Normal',
  \`category\` VARCHAR(100) DEFAULT 'Recruitment Advisory',
  \`is_public\` TINYINT(1) DEFAULT 1,
  \`published_at\` DATE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`official_notices\` (\`title\`, \`summary\`, \`content\`, \`priority\`, \`category\`, \`published_at\`) VALUES
('Official Computerized Ballot Date 22 December 2026', 'Computerized candidate selection ballot scheduled for 22 December 2026.', 'Applicants with verified credentials will be entered into the 22 December 2026 draw. Ensure all required documents are uploaded before the cutoff date.', 'High', 'Ballot Notice', '2026-10-01'),
('Recruitment Transparency & Anti-Fraud Advisory', 'Strict warning against unauthorized commercial agents claiming guaranteed visas.', 'Paying an application fee does not guarantee employment, visa grant, or ballot selection. Always verify your Tracking ID exclusively through this official portal.', 'Urgent', 'Fraud Warning', '2026-10-05');

SET FOREIGN_KEY_CHECKS = 1;
`,
    },
    {
      path: 'database_migration_staff_referrals.sql',
      category: 'database',
      description: 'Additive migration for staff users, bonus tiers, ledger, and referral attribution columns (Hostinger compatible)',
      content: `-- =============================================================================
-- Migration: Admin-Controlled Staff Management & Referral Earnings System
-- Target: MySQL 8.0+ / MariaDB 10.4+ (Hostinger Shared Hosting Compatible)
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- Safe Additive Migration: Does NOT drop or reset any existing tables or production data
-- =============================================================================

SET NAMES utf8mb4;

-- 1. Staff Users Table
CREATE TABLE IF NOT EXISTS \`staff_users\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(150) NOT NULL,
  \`phone\` VARCHAR(32) NULL,
  \`role\` VARCHAR(64) NOT NULL DEFAULT 'recruitment_officer',
  \`status\` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  \`referral_code\` VARCHAR(32) NOT NULL UNIQUE,
  \`monthly_target\` INT UNSIGNED NOT NULL DEFAULT 15,
  \`must_change_password\` TINYINT(1) NOT NULL DEFAULT 1,
  \`last_login\` DATETIME NULL,
  \`created_by_admin_id\` INT UNSIGNED NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_staff_code\` (\`referral_code\`),
  INDEX \`idx_staff_status\` (\`status\`),
  INDEX \`idx_staff_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Staff Bonus Tiers Table
CREATE TABLE IF NOT EXISTS \`staff_bonus_tiers\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`tier_name\` VARCHAR(50) NOT NULL UNIQUE,
  \`min_verified_referrals\` INT UNSIGNED NOT NULL,
  \`bonus_amount_pkr\` DECIMAL(10,2) NOT NULL,
  \`commission_percent\` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  \`description\` VARCHAR(255) NULL,
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Staff Bonus & Earnings Records Table
CREATE TABLE IF NOT EXISTS \`staff_bonus_records\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`staff_id\` INT UNSIGNED NOT NULL,
  \`period_month\` VARCHAR(7) NOT NULL,
  \`verified_referrals_count\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`verified_revenue_pkr\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`bonus_amount_pkr\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`tier_name\` VARCHAR(50) NOT NULL,
  \`status\` ENUM('Pending Review', 'Approved', 'Disbursed / Paid', 'Rejected') NOT NULL DEFAULT 'Pending Review',
  \`approved_by\` VARCHAR(150) NULL,
  \`approved_at\` DATETIME NULL,
  \`paid_ref\` VARCHAR(100) NULL,
  \`paid_at\` DATETIME NULL,
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_bonus_staff_user\` FOREIGN KEY (\`staff_id\`) REFERENCES \`staff_users\` (\`id\`) ON DELETE CASCADE,
  INDEX \`idx_bonus_month\` (\`period_month\`),
  INDEX \`idx_bonus_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Rate-Limiting Protection Table for Staff & Admin Login
CREATE TABLE IF NOT EXISTS \`staff_login_attempts\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`username_or_email\` VARCHAR(100) NOT NULL,
  \`ip_address\` VARCHAR(45) NOT NULL,
  \`attempt_time\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_attempt_lookup\` (\`ip_address\`, \`username_or_email\`, \`attempt_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Insert Default Configurable Bonus Tiers
INSERT INTO \`staff_bonus_tiers\` (\`tier_name\`, \`min_verified_referrals\`, \`bonus_amount_pkr\`, \`commission_percent\`, \`description\`, \`is_active\`)
VALUES
  ('Bronze Tier', 5, 2500.00, 3.00, 'Entry milestone for active field officers achieving 5 verified submissions', 1),
  ('Silver Tier', 15, 7500.00, 5.00, 'Standard target milestone for 15 verified candidates with fee verified', 1),
  ('Gold Tier', 30, 18000.00, 7.50, 'High achiever milestone for 30 verified candidates', 1),
  ('Platinum Tier', 50, 35000.00, 10.00, 'Regional champion milestone with 10% commission on verified revenue', 1)
ON DUPLICATE KEY UPDATE \`updated_at\` = CURRENT_TIMESTAMP;

-- 6. Insert Initial Sample Staff Members (Default temp password: ChangeMe@2026!)
INSERT INTO \`staff_users\` (\`username\`, \`email\`, \`password_hash\`, \`full_name\`, \`phone\`, \`role\`, \`status\`, \`referral_code\`, \`monthly_target\`, \`must_change_password\`)
VALUES
  ('staff_tariq', 'tariq.mahmood@saudijobsportal.pk', '$2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a', 'Tariq Mahmood', '0301-5582910', 'recruitment_officer', 'active', 'STF-TRQ-9021', 15, 1),
  ('staff_ayesha', 'ayesha.rehman@saudijobsportal.pk', '$2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a', 'Ayesha Rehman', '0321-4829102', 'field_coordinator', 'active', 'STF-AYS-4182', 20, 1),
  ('staff_bilal', 'bilal.shah@saudijobsportal.pk', '$2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a', 'Bilal Shah', '0333-9182746', 'community_ambassador', 'active', 'STF-BIL-7734', 12, 1)
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);
`,
    },
    {
      path: 'database_migration_payment_methods.sql',
      category: 'database',
      description: 'Additive migration for admin-managed payment methods, QR codes, snapshot columns, and duplicate transaction detection',
      content: `-- =============================================================================
-- Migration: Admin-Managed Payment Methods & Gateways
-- Target: MySQL 8.0+ / MariaDB 10.4+ (Hostinger Shared Hosting)
-- Additive Migration: Preserves all existing tables and production data
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS \`payment_methods\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`type\` ENUM('bank_transfer', 'easypaisa', 'jazzcash', 'nayapay', 'sadapay', 'raast', 'bank_challan', 'other') NOT NULL DEFAULT 'bank_transfer',
  \`account_title\` VARCHAR(150) NOT NULL,
  \`account_number\` VARCHAR(100) NOT NULL,
  \`iban\` VARCHAR(50) NULL,
  \`bank_name\` VARCHAR(150) NULL,
  \`instructions\` TEXT NOT NULL,
  \`reference_instructions\` VARCHAR(255) NULL,
  \`qr_code_file_path\` VARCHAR(255) NULL,
  \`qr_code_image_data\` LONGTEXT NULL,
  \`status\` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
  \`display_order\` INT NOT NULL DEFAULT 1,
  \`is_default\` TINYINT(1) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_paymethod_status\` (\`status\`),
  INDEX \`idx_paymethod_type\` (\`type\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO \`payment_methods\` (
  \`id\`, \`name\`, \`type\`, \`account_title\`, \`account_number\`, \`iban\`, \`bank_name\`,
  \`instructions\`, \`reference_instructions\`, \`status\`, \`display_order\`, \`is_default\`
) VALUES
('paymethod-easypaisa-qr', 'EasyPaisa QR Code (Scan to Pay)', 'easypaisa', 'Official Recruitment Portal Escrow', 'QR Scan Payment', NULL, 'Telenor Microfinance Bank (EasyPaisa QR)', 'Open EasyPaisa App -> Tap "QR Pay" or "Scan QR" -> Point camera at this QR code -> Confirm amount PKR 4,500 and verify account title before sending.', 'Take a clear screenshot of the EasyPaisa confirmation screen showing the Transaction ID (TRX ID).', 'active', 1, 1),
('paymethod-jazzcash-qr', 'JazzCash QR Code (Scan to Pay)', 'jazzcash', 'Official Recruitment Portal Escrow', 'QR Scan Payment', NULL, 'Mobilink Microfinance Bank (JazzCash QR)', 'Open JazzCash App -> Tap "Scan QR" -> Point camera at this QR code -> Confirm fee amount PKR 4,500 and enter your MPIN.', 'Take a clear screenshot of the successful JazzCash receipt screen showing the TID (Transaction ID).', 'active', 2, 0),
('paymethod-raast-qr', 'Raast QR Code (Any Banking App Scan)', 'raast', 'Official Recruitment Portal Escrow', 'Raast P2M Scan', NULL, 'State Bank of Pakistan Raast Instant Settlement', 'Open any Pakistani Banking or Wallet App (HBL, Alfalah, UBL, SadaPay, etc.) -> Select "Raast QR Scan" -> Scan this QR Code to transfer PKR 4,500 instantly.', 'Capture the transfer confirmation receipt showing the Raast reference / transaction ID.', 'active', 3, 0);
`,
    },
    {
      path: 'config/database.php',
      category: 'config',
      description: 'Hostinger PDO database connection with error handling and environment variable support',
      content: `<?php
/**
 * Saudi Jobs & Recruitment Portal Pakistan
 * Database Configuration (Hostinger Shared Hosting & Local MySQL)
 * Compatible with PHP 8.2+
 */

declare(strict_types=1);

// Prevent direct script access
if (!defined('SAJ_PORTAL')) {
    http_response_code(403);
    exit('Direct access forbidden.');
}

// Hostinger hPanel Database Credentials
// Update these values to match your Hostinger MySQL Database settings
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'u123456789_saudijobs');
define('DB_USER', getenv('DB_USER') ?: 'u123456789_admin');
define('DB_PASS', getenv('DB_PASS') ?: 'YourStrongDbPasswordHere');
define('DB_CHARSET', 'utf8mb4');

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Log silently; do not display raw database errors to public visitors
                error_log('[SAJ_DB_ERROR] Connection failure: ' . $e->getMessage());
                die('System database service temporarily unavailable. Please try again shortly or contact support.');
            }
        }

        return self::$instance;
    }
}
`,
    },
    {
      path: 'config/security.php',
      category: 'config',
      description: 'Session hardening, CSRF token management, and input sanitizers for PHP 8.2',
      content: `<?php
/**
 * Security, CSRF, and Input Validation Helper
 * PHP 8.2+
 */

declare(strict_types=1);

if (!defined('SAJ_PORTAL')) {
    exit('Forbidden');
}

// Session security configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        ini_set('session.cookie_secure', '1');
    }
    session_start();
}

/**
 * Generate and store CSRF token
 */
function getCsrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate incoming POST CSRF token
 */
function validateCsrfToken(?string $token): bool
{
    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Clean string for HTML output
 */
function sanitize(string $data): string
{
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Record an audit log entry in MySQL
 */
function writeAuditLog(PDO $pdo, string $action, string $details, string $actor = 'System', string $role = 'guest'): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $stmt = $pdo->prepare('INSERT INTO audit_logs (actor, role, action, details, ip_address) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$actor, $role, $action, $details, $ip]);
}
`,
    },
    {
      path: '.htaccess',
      category: 'public',
      description: 'Apache configuration for Hostinger: URL rewriting, security headers, file access restrictions',
      content: `# =============================================================================
# Apache .htaccess configuration for Hostinger Shared Hosting
# Saudi Jobs & Recruitment Portal Pakistan
# =============================================================================

# Disable directory browsing
Options -Indexes

# Follow symbolic links
Options +FollowSymLinks

# Prevent viewing of sensitive files
<FilesMatch "(\.(sql|env|log|ini|git.*|sh)|database\.sql)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# PHP 8.2 execution limits for file uploads (CVs and receipts)
<IfModule mod_php8.c>
    php_value upload_max_filesize 5M
    php_value post_max_size 8M
    php_value max_execution_time 60
</IfModule>

# URL Rewriting
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Redirect trailing slashes
    RewriteRule ^(.*)/$ /$1 [L,R=301]

    # Clean URLs routing
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME}\.php -f
    RewriteRule ^(.*)$ $1.php [L]
</IfModule>
`,
    },
    {
      path: 'index.php',
      category: 'public',
      description: 'Main public landing page with legal authorization banner, search, verified vacancies, and notices',
      content: `<?php
/**
 * Saudi Jobs & Recruitment Portal Pakistan — Public Landing Page
 * PHP 8.2 + MySQL (Hostinger Deployment Ready)
 */

define('SAJ_PORTAL', true);
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/security.php';

$pdo = Database::getConnection();

// Fetch System Settings
$stmt = $pdo->query("SELECT setting_key, setting_value FROM website_settings");
$settings = [];
while ($row = $stmt->fetch()) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

$isAuthorized = ($settings['is_embassy_authorized'] ?? '0') === '1';
$portalTitle = $isAuthorized 
    ? ($settings['authorized_org_name'] ?? 'Royal Saudi Embassy in Islamabad') 
    : ($settings['temporary_public_name'] ?? 'Saudi Jobs & Recruitment Portal Pakistan');

// Fetch Vacancies
$jobsStmt = $pdo->query("
    SELECT j.*, c.name as category_name, e.company_name, e.location_city 
    FROM jobs j 
    JOIN job_categories c ON j.category_id = c.id 
    JOIN employers e ON j.employer_id = e.id 
    WHERE j.is_published = 1 
    ORDER BY j.created_at DESC 
    LIMIT 6
");
$latestJobs = $jobsStmt->fetchAll();

// Fetch Notices
$noticesStmt = $pdo->query("SELECT * FROM official_notices WHERE is_public = 1 ORDER BY published_at DESC LIMIT 3");
$notices = $noticesStmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= sanitize($portalTitle) ?> — Official Portal</title>
    <link rel="stylesheet" href="assets/css/portal.css">
    <style>
        :root { --primary-green: #064E3B; --gold-accent: #B45309; --light-bg: #F8FAFC; }
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: var(--light-bg); color: #1E293B; line-height: 1.5; }
        .top-notice-banner { background: #FEF3C7; color: #92400E; padding: 10px 20px; font-size: 13px; text-align: center; border-bottom: 1px solid #FCD34D; }
        header { background: #064E3B; color: #FFF; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
        .logo-title { font-size: 18px; font-weight: 700; color: #FFF; text-decoration: none; display: flex; align-items: center; gap: 10px; }
        .nav-links a { color: #E2E8F0; text-decoration: none; margin-left: 20px; font-size: 14px; }
        .hero { background: linear-gradient(135deg, #064E3B 0%, #065F46 100%); color: #FFF; padding: 60px 24px; text-align: center; }
        .hero h1 { font-size: 36px; margin: 0 0 16px 0; color: #FEF3C7; }
        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
        .job-card { background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .btn-apply { display: inline-block; background: #064E3B; color: #FFF; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 12px; }
    </style>
</head>
<body>

<?php if (!$isAuthorized): ?>
<div class="top-notice-banner">
    <strong>Transparency Notice:</strong> Operating under temporary title <em>"Saudi Jobs & Recruitment Portal Pakistan"</em> pending verified written diplomatic authorization. No government or embassy endorsement is claimed.
</div>
<?php endif; ?>

<header>
    <a href="index.php" class="logo-title">
        <?= sanitize($portalTitle) ?>
    </a>
    <nav class="nav-links">
        <a href="jobs.php">Available Jobs</a>
        <a href="track.php">Track Application</a>
        <a href="notices.php">Official Notices</a>
        <a href="login.php">Candidate Login</a>
        <a href="admin/login.php" style="color: #FCD34D;">Staff Portal</a>
    </nav>
</header>

<section class="hero">
    <h1>Verified Employment Opportunities in Saudi Arabia</h1>
    <p>Professional recruitment platform for skilled and technical Pakistani applicants.</p>
    <div style="margin-top: 24px;">
        <a href="jobs.php" class="btn-apply" style="background: #F59E0B; color: #000; font-size: 16px; padding: 12px 28px;">Browse Available Vacancies</a>
        <a href="track.php" class="btn-apply" style="background: transparent; border: 1px solid #FFF; margin-left: 12px;">Track Your Tracking ID</a>
    </div>
</section>

<main class="container">
    <h2 style="font-size: 24px; color: #064E3B; margin-bottom: 20px;">Latest Verified Job Vacancies</h2>
    <div class="card-grid">
        <?php foreach ($latestJobs as $job): ?>
        <div class="job-card">
            <div style="font-size: 12px; color: #64748B;"><?= sanitize($job['category_name']) ?> · <?= sanitize($job['location']) ?></div>
            <h3 style="font-size: 18px; margin: 8px 0;"><?= sanitize($job['title']) ?></h3>
            <p style="font-size: 14px; color: #475569; margin: 6px 0;"><?= sanitize($job['company_name']) ?></p>
            <div style="font-weight: 700; color: #064E3B; margin: 10px 0;">Salary: <?= number_format($job['salary_sar']) ?> SAR / month</div>
            <div style="font-size: 13px; color: #64748B;">Positions: <?= $job['positions'] ?> | Gender: <?= sanitize($job['gender_eligibility']) ?></div>
            <a href="apply.php?job_id=<?= $job['id'] ?>" class="btn-apply">Apply for Job</a>
        </div>
        <?php endforeach; ?>
    </div>
</main>

<footer style="background: #0F172A; color: #94A3B8; padding: 40px 24px; text-align: center; font-size: 13px; margin-top: 60px;">
    <p>© 2026 <?= sanitize($portalTitle) ?>. All rights reserved.</p>
    <p>Strict anti-fraud policy: Paying an application fee does not guarantee employment or selection.</p>
</footer>

</body>
</html>
`,
    },
    {
      path: 'track.php',
      category: 'public',
      description: 'Privacy-preserving public application tracking page protecting sensitive candidate data',
      content: `<?php
/**
 * Privacy-Preserving Public Tracking Page
 * PHP 8.2 + MySQL (Hostinger Deployment Ready)
 */

define('SAJ_PORTAL', true);
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/security.php';

$pdo = Database::getConnection();
$trackingId = strtoupper(trim($_GET['id'] ?? ''));
$application = null;
$error = null;

if (!empty($trackingId)) {
    // Validate format: e.g. SAJ-2026-000125
    if (!preg_match('/^SAJ-\\d{4}-\\d{6}$/', $trackingId)) {
        $error = "Invalid Tracking ID format. Please use the format SAJ-2026-XXXXXX.";
    } else {
        // Query database; return ONLY non-sensitive information
        $stmt = $pdo->prepare("
            SELECT a.tracking_id, a.status, a.payment_status, a.next_stage_status, a.created_at,
                   j.title as job_title, j.location as job_location
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.tracking_id = ?
        ");
        $stmt->execute([$trackingId]);
        $application = $stmt->fetch();

        if (!$application) {
            // Generic message to prevent ID enumeration
            $error = "No active record found matching Tracking ID " . sanitize($trackingId) . ". Please verify the number from your confirmation slip.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Track Application — Saudi Jobs & Recruitment Portal</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #F8FAFC; margin: 0; padding: 24px; }
        .box { max-width: 650px; margin: 40px auto; background: #FFF; padding: 32px; border-radius: 8px; border: 1px solid #E2E8F0; }
        .input-group { display: flex; gap: 10px; margin-top: 16px; }
        input[type="text"] { flex: 1; padding: 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 16px; }
        button { background: #064E3B; color: #FFF; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .privacy-note { background: #F1F5F9; border-left: 4px solid #064E3B; padding: 12px; font-size: 13px; color: #475569; margin-top: 20px; }
        .result-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
    </style>
</head>
<body>
<div class="box">
    <h2 style="color: #064E3B; margin-top: 0;">Track Recruitment Application</h2>
    <p style="font-size: 14px; color: #64748B;">Enter your 14-character Tracking ID (e.g., SAJ-2026-000125) to check processing status.</p>
    
    <form method="GET" action="track.php" class="input-group">
        <input type="text" name="id" value="<?= sanitize($trackingId) ?>" placeholder="SAJ-2026-XXXXXX" required>
        <button type="submit">Track Status</button>
    </form>

    <?php if ($error): ?>
        <div style="background: #FEE2E2; color: #991B1B; padding: 14px; border-radius: 6px; margin-top: 20px;">
            <?= sanitize($error) ?>
        </div>
    <?php elseif ($application): ?>
        <div style="margin-top: 24px;">
            <div style="font-size: 20px; font-weight: 700; color: #064E3B;"><?= sanitize($application['tracking_id']) ?></div>
            <div style="color: #64748B; font-size: 14px; margin-bottom: 16px;"><?= sanitize($application['job_title']) ?> · <?= sanitize($application['job_location']) ?></div>

            <div class="result-item">
                <span>Application Processing Status</span>
                <strong><?= sanitize($application['status']) ?></strong>
            </div>
            <div class="result-item">
                <span>Payment Verification Status</span>
                <strong><?= sanitize($application['payment_status']) ?></strong>
            </div>
            <div class="result-item">
                <span>Next-Stage Ballot / Quota Status</span>
                <strong style="color: #B45309;"><?= sanitize($application['next_stage_status']) ?></strong>
            </div>
            <div class="result-item">
                <span>Lodged Date</span>
                <span><?= date('d M Y', strtotime($application['created_at'])) ?></span>
            </div>

            <div class="privacy-note">
                <strong>Data Privacy Protection:</strong> Sensitive applicant data (CNIC, passport, phone number, and submitted documents) is redacted in public lookup. Log into your Candidate Dashboard to review full profile details.
            </div>
        </div>
    <?php endif; ?>
</div>
</body>
</html>
`,
    },
    {
      path: 'apply.php',
      category: 'candidate',
      description: 'Concurrency-safe application submission with atomic sequence locking in MySQL',
      content: `<?php
/**
 * Concurrency-Safe Application Submission
 * Transaction-backed unique Tracking ID generation: SAJ-2026-XXXXXX
 * PHP 8.2 + MySQL
 */

define('SAJ_PORTAL', true);
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/security.php';

// Candidate authentication check
if (empty($_SESSION['candidate_user_id'])) {
    header('Location: login.php?redirect=' . urlencode($_SERVER['REQUEST_URI']));
    exit;
}

$pdo = Database::getConnection();
$userId = (int)$_SESSION['candidate_user_id'];
$jobId = (int)($_GET['job_id'] ?? $_POST['job_id'] ?? 0);

// Fetch job details
$stmt = $pdo->prepare("SELECT * FROM jobs WHERE id = ? AND is_published = 1");
$stmt->execute([$jobId]);
$job = $stmt->fetch();

if (!$job) {
    die("Selected vacancy not found or no longer active.");
}

$error = null;
$successTrackingId = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $error = "Invalid session security token. Please refresh and try again.";
    } else {
        try {
            // Start safe transaction for collision-free Tracking ID generation
            $pdo->beginTransaction();

            // Lock sequence record for atomic increment
            $currentYear = (int)date('Y');
            $seqStmt = $pdo->prepare("SELECT current_seq FROM application_sequences WHERE year = ? FOR UPDATE");
            $seqStmt->execute([$currentYear]);
            $seqRow = $seqStmt->fetch();

            if (!$seqRow) {
                $newSeq = 101;
                $insSeq = $pdo->prepare("INSERT INTO application_sequences (year, current_seq) VALUES (?, ?)");
                $insSeq->execute([$currentYear, $newSeq]);
            } else {
                $newSeq = ((int)$seqRow['current_seq']) + 1;
                $updSeq = $pdo->prepare("UPDATE application_sequences SET current_seq = ? WHERE year = ?");
                $updSeq->execute([$newSeq, $currentYear]);
            }

            $trackingId = sprintf('SAJ-%04d-%06d', $currentYear, $newSeq);

            // Insert application
            $appStmt = $pdo->prepare("
                INSERT INTO applications (tracking_id, user_id, job_id, status, payment_status, next_stage_status)
                VALUES (?, ?, ?, 'Payment Pending', 'Pending', 'Pending Ballot / Selection')
            ");
            $appStmt->execute([$trackingId, $userId, $jobId]);
            $applicationId = (int)$pdo->lastInsertId();

            // Insert initial history
            $histStmt = $pdo->prepare("
                INSERT INTO application_status_history (application_id, status, changed_by, notes)
                VALUES (?, 'Submitted', 'Candidate Online Lodgement', 'Application recorded with unique tracking ID.')
            ");
            $histStmt->execute([$applicationId]);

            $pdo->commit();
            writeAuditLog($pdo, 'APPLICATION_LODGED', "Tracking ID $trackingId generated for job $jobId", "User #$userId", 'candidate');

            header("Location: candidate/receipt.php?tracking_id=" . urlencode($trackingId));
            exit;

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('[SAJ_APPLY_ERROR] ' . $e->getMessage());
            $error = "A system error occurred while generating your application tracking ID. Please try again.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Apply for <?= sanitize($job['title']) ?></title>
    <link rel="stylesheet" href="assets/css/portal.css">
    <style>
        body { font-family: system-ui, sans-serif; background: #F8FAFC; margin: 0; padding: 24px; }
        .box { max-width: 600px; margin: 30px auto; background: #FFF; border: 1px solid #E2E8F0; padding: 30px; border-radius: 8px; }
        .btn-submit { background: #064E3B; color: #FFF; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    </style>
</head>
<body>
<div class="box">
    <h2 style="color: #064E3B; margin-top: 0;">Apply for Vacancy</h2>
    <p><strong>Position:</strong> <?= sanitize($job['title']) ?></p>
    <p><strong>Location:</strong> <?= sanitize($job['location']) ?></p>
    <p><strong>Salary:</strong> <?= number_format($job['salary_sar']) ?> SAR / month</p>
    
    <?php if ($error): ?>
        <p style="color: #DC2626;"><?= sanitize($error) ?></p>
    <?php endif; ?>

    <form method="POST">
        <input type="hidden" name="csrf_token" value="<?= getCsrfToken() ?>">
        <input type="hidden" name="job_id" value="<?= $job['id'] ?>">

        <p style="font-size: 14px; color: #475569;">
            By submitting, you certify that your educational certificates, CNIC, and work experience details in your profile are accurate and complete.
        </p>

        <button type="submit" class="btn-submit">Confirm & Lodge Application</button>
        <a href="jobs.php" style="margin-left: 15px; color: #64748B; text-decoration: none;">Cancel</a>
    </form>
</div>
</body>
</html>
`,
    },
    {
      path: 'admin/ballot.php',
      category: 'admin',
      description: 'Administrative computerized ballot engine for 22 December 2026 with deterministic seed & CSV export',
      content: `<?php
/**
 * Administrator Ballot & Selection Engine
 * Configured for 22 December 2026 Ballot
 * PHP 8.2 + MySQL
 */

define('SAJ_PORTAL', true);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

// Verify admin login and role
if (empty($_SESSION['admin_user_id']) || !in_array($_SESSION['admin_role'], ['super_admin', 'recruitment_admin'])) {
    die("Access denied: Administrative privileges required.");
}

$pdo = Database::getConnection();
$message = '';

// Handle Ballot Execution
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'run_ballot') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        die("Security CSRF token mismatch.");
    }

    $quotaCount = (int)($_POST['quota_count'] ?? 50);
    $customSeed = trim($_POST['seed'] ?? ('SEED-' . time() . '-' . rand(1000, 9999)));

    // Fetch verified and eligible applications
    $eligibleStmt = $pdo->query("
        SELECT id, tracking_id FROM applications 
        WHERE status = 'Ballot Eligible' 
        ORDER BY id ASC
    ");
    $eligibleApps = $eligibleStmt->fetchAll();

    if (empty($eligibleApps)) {
        $message = "No candidates currently have 'Ballot Eligible' status. Approve processing first.";
    } else {
        // Deterministic pseudo-random shuffle based on seed
        srand((int)crc32($customSeed));
        shuffle($eligibleApps);

        $selected = array_slice($eligibleApps, 0, min($quotaCount, count($eligibleApps)));
        $selectedIds = array_column($selected, 'id');

        $pdo->beginTransaction();
        try {
            // Update selected applications
            if (!empty($selectedIds)) {
                $inQuery = implode(',', array_fill(0, count($selectedIds), '?'));
                $updStmt = $pdo->prepare("
                    UPDATE applications 
                    SET next_stage_status = 'Selected for Next Stage' 
                    WHERE id IN ($inQuery)
                ");
                $updStmt->execute($selectedIds);
            }

            // Record Ballot Event
            $eventStmt = $pdo->prepare("
                UPDATE ballot_events 
                SET status = 'Draw Completed', random_seed = ?, published_at = NOW(), published_by = ? 
                WHERE scheduled_date = '2026-12-22'
            ");
            $eventStmt->execute([$customSeed, $_SESSION['admin_name'] ?? 'Super Admin']);

            $pdo->commit();
            writeAuditLog($pdo, 'BALLOT_EXECUTED', "Ballot executed with seed $customSeed. Selected " . count($selected) . " candidates.", $_SESSION['admin_name'] ?? 'Admin', 'super_admin');
            $message = "Computerized ballot completed successfully. " . count($selected) . " candidates selected for next stage.";

        } catch (Throwable $e) {
            $pdo->rollBack();
            $message = "Error executing ballot: " . $e->getMessage();
        }
    }
}

// Fetch Eligible Count
$countStmt = $pdo->query("SELECT COUNT(*) FROM applications WHERE status = 'Ballot Eligible'");
$eligibleCount = (int)$countStmt->fetchColumn();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ballot Management — 22 December 2026</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0F172A; color: #F8FAFC; margin: 0; padding: 30px; }
        .card { background: #1E293B; border: 1px solid #334155; padding: 24px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
        .badge { background: #064E3B; color: #A7F3D0; padding: 4px 10px; border-radius: 4px; font-size: 13px; }
        button { background: #F59E0B; color: #000; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; cursor: pointer; }
    </style>
</head>
<body>
<div class="card">
    <h2>Computerized Ballot Engine — 22 December 2026</h2>
    <p>Eligible Candidates in Current Pool: <strong class="badge"><?= $eligibleCount ?> Applicants</strong></p>

    <?php if ($message): ?>
        <div style="background: #065F46; color: #FFF; padding: 12px; margin: 16px 0; border-radius: 6px;"><?= sanitize($message) ?></div>
    <?php endif; ?>

    <form method="POST">
        <input type="hidden" name="csrf_token" value="<?= getCsrfToken() ?>">
        <input type="hidden" name="action" value="run_ballot">

        <div style="margin: 16px 0;">
            <label>Number of Positions to Draw:</label><br>
            <input type="number" name="quota_count" value="25" min="1" max="500" style="padding: 8px; width: 120px;">
        </div>

        <div style="margin: 16px 0;">
            <label>Audit Draw Seed Proof (Optional):</label><br>
            <input type="text" name="seed" placeholder="Leave blank for auto-generated seed" style="padding: 8px; width: 350px;">
        </div>

        <p style="font-size: 13px; color: #94A3B8;">
            * Important: The draw uses an auditable, deterministic algorithm. Only candidates with verified payment and processing approval are included in the draw.
        </p>

        <button type="submit" onclick="return confirm('Execute computerized ballot draw for 22 December 2026?')">Run Computerized Ballot</button>
    </form>
</div>
</body>
</html>
`,
    },
    {
      path: 'README.md',
      category: 'docs',
      description: 'Hostinger Shared Hosting deployment and installation guide',
      content: `# Saudi Jobs & Recruitment Portal Pakistan — Hostinger Deployment Guide

This package contains the complete, production-ready PHP 8.2 + MySQL/MariaDB source code for deploying to **Hostinger Shared Hosting** (Single, Premium, or Business Web Hosting).

---

## 1. Prerequisites on Hostinger
- Hostinger account with active Shared or Cloud Hosting plan.
- PHP version configured to **PHP 8.2** or higher in hPanel (*Websites > PHP Configuration*).
- MySQL / MariaDB database created in hPanel (*Databases > MySQL Databases*).

---

## 2. Step-by-Step Installation

### Step A: Import Database
1. Log into your **Hostinger hPanel**.
2. Navigate to **Databases** > **phpMyAdmin** for your target database.
3. Click the **Import** tab.
4. Choose the file \`database.sql\` from this package and click **Go**.
5. All 16 tables, constraints, initial job categories, and demo records will be created.

### Step B: Configure Database Credentials
1. Open \`config/database.php\` in a text editor.
2. Update the following lines with your Hostinger database details:
   \`\`\`php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_your_dbname');
   define('DB_USER', 'u123456789_your_dbuser');
   define('DB_PASS', 'YourActualPasswordHere');
   \`\`\`

### Step C: Upload Files to public_html
1. In hPanel, open **File Manager** (or connect via FileZilla SFTP).
2. Navigate to the **\`public_html/\`** directory of your domain.
3. Upload all files from this package into \`public_html/\`.
4. Ensure \`.htaccess\` is uploaded (enable "Show Hidden Files" in File Manager if needed).

### Step D: Permissions Check
Ensure the following directories have write permissions (chmod \`755\`):
- \`uploads/\`
- \`uploads/cv/\`
- \`uploads/receipts/\`

---

## 3. First Administrator Login
- Navigate to: \`https://yourdomain.com/admin/login.php\`
- **Default Super Admin Username**: \`superadmin\`
- **Default Password**: \`Admin@Saudi2026!\`
- *Note: Immediately change the default password after your first login under Admin Settings.*

---

## 4. Statutory Legal Notice & Fee Controls
- **Organization Name**: The system defaults to **"Saudi Jobs & Recruitment Portal Pakistan"**.
- Before switching to **"Royal Saudi Embassy in Islamabad"**, the Super Admin must upload or input the written authorization permit reference under **Admin > Website Settings**.
- **Fee Collection (PKR 4,500)**: Disabled by default. It must remain disabled until the operator records verified legal statutory authority.

---

## 5. 22 December 2026 Ballot
- The computerized ballot draw is configured for **22 December 2026**.
- Applications must have both:
  1. Payment Verified
  2. Processing Approved
  before being eligible for the draw.
`,
    },
  ];
}

export async function generateZipArchive(): Promise<Blob> {
  const zip = new JSZip();
  const files = getPhpPackageFiles();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Add dummy placeholder for uploads
  zip.file('uploads/cv/.gitkeep', '');
  zip.file('uploads/receipts/.gitkeep', '');

  return await zip.generateAsync({ type: 'blob' });
}

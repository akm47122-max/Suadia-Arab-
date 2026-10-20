-- =============================================================================
-- Saudi Jobs & Recruitment Portal Pakistan — Production Schema
-- Compatible with MySQL 8.0+ and MariaDB 10.4+ (Hostinger Shared Hosting)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. System Settings & Embassy Authorization Control
DROP TABLE IF EXISTS `website_settings`;
CREATE TABLE `website_settings` (
  `setting_key` VARCHAR(64) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `website_settings` (`setting_key`, `setting_value`, `description`) VALUES
('is_embassy_authorized', '0', 'Flag indicating written verified legal embassy authorization. 0=Temporary Public Title, 1=Official Embassy Name'),
('authorization_doc_ref', '', 'Official gazette/letter reference permitting use of embassy title'),
('authorized_org_name', 'Royal Saudi Embassy in Islamabad — Recruitment Section', 'Full official name when authorized'),
('temporary_public_name', 'Saudi Jobs & Recruitment Portal Pakistan', 'Public name displayed when authorization is unverified'),
('fee_collection_authorized', '0', 'CRITICAL: Must remain 0 (disabled) until operator has verified statutory authority to charge fee'),
('fee_amount_pkr', '4500', 'Proposed administrative ballot and verification fee'),
('ballot_date', '2026-12-22', 'Scheduled date for computerized candidate ballot'),
('ballot_deadline', '2026-12-10', 'Final application cutoff date for 2026 ballot'),
('bank_account_title', 'Saudi Jobs Recruitment Escrow Account', 'Title for authorized bank transfer'),
('bank_account_number', '02010108920192', 'Meezan Bank account number'),
('bank_iban', 'PK36MEZN0002010108920192', 'IBAN for domestic interbank transfer'),
('bank_name', 'Meezan Bank Limited, Blue Area Islamabad', 'Designated bank branch');

-- 2. Candidate Users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(32) NOT NULL,
  `cnic` VARCHAR(20) NOT NULL UNIQUE,
  `is_verified` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_cnic` (`cnic`),
  INDEX `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Candidate Detailed Profiles
DROP TABLE IF EXISTS `candidate_profiles`;
CREATE TABLE `candidate_profiles` (
  `user_id` INT UNSIGNED PRIMARY KEY,
  `dob` DATE NULL,
  `gender` ENUM('Male', 'Female') NOT NULL DEFAULT 'Male',
  `city` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `education` VARCHAR(150) NOT NULL,
  `experience_years` INT DEFAULT 0,
  `passport_status` ENUM('Valid Passport', 'In-process', 'Not Applied') NOT NULL DEFAULT 'Valid Passport',
  `preferred_category` VARCHAR(100) NULL,
  `cv_file_path` VARCHAR(255) NULL,
  `photo_file_path` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Job Categories
DROP TABLE IF EXISTS `job_categories`;
CREATE TABLE `job_categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon_name` VARCHAR(50) DEFAULT 'Briefcase',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `job_categories` (`slug`, `name`, `description`) VALUES
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
DROP TABLE IF EXISTS `employers`;
CREATE TABLE `employers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(200) NOT NULL,
  `commercial_reg_no` VARCHAR(50) NULL,
  `location_city` VARCHAR(100) NOT NULL,
  `is_authorized` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `employers` (`company_name`, `commercial_reg_no`, `location_city`) VALUES
('Al-Tamimi Transport & Logistics Services Co.', 'CR-1010394821', 'Riyadh'),
('King Fahad Medical Complex Partner Consortium', 'CR-4030192834', 'Jeddah'),
('Saudi Modern Industrial Contractors Ltd.', 'CR-2050493821', 'Dammam');

-- 6. Jobs & Vacancies
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `employer_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `positions` INT UNSIGNED DEFAULT 1,
  `gender_eligibility` ENUM('Male', 'Female', 'Any') DEFAULT 'Any',
  `qualification` VARCHAR(200) NOT NULL,
  `experience_required` VARCHAR(150) NOT NULL,
  `salary_sar` INT UNSIGNED NOT NULL,
  `contract_duration` VARCHAR(100) DEFAULT '2 Years',
  `location` VARCHAR(150) NOT NULL,
  `deadline` DATE NOT NULL,
  `description` TEXT NOT NULL,
  `required_documents` TEXT NOT NULL,
  `verification_status` VARCHAR(64) DEFAULT 'Corporate Quota Approved',
  `is_published` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_jobs_category` FOREIGN KEY (`category_id`) REFERENCES `job_categories` (`id`),
  CONSTRAINT `fk_jobs_employer` FOREIGN KEY (`employer_id`) REFERENCES `employers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Applications Table with UNIQUE Tracking ID & Sequence Lock
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tracking_id` VARCHAR(32) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `job_id` INT UNSIGNED NOT NULL,
  `status` ENUM(
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
  `payment_status` ENUM(
    'Pending',
    'Submitted for Verification',
    'Verified',
    'Rejected',
    'Refund Pending',
    'Refunded'
  ) NOT NULL DEFAULT 'Pending',
  `next_stage_status` ENUM(
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
  `rejection_reason` VARCHAR(255) NULL,
  `additional_docs_requested` TEXT NULL,
  `reviewer_id` INT UNSIGNED NULL,
  `reviewer_name` VARCHAR(150) NULL,
  `reviewed_at` DATETIME NULL,
  `review_notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_app_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_app_job` FOREIGN KEY (`job_id` ) REFERENCES `jobs` (`id`),
  INDEX `idx_app_tracking` (`tracking_id`),
  INDEX `idx_app_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Application Sequence Tracker for Collision-Free Atomic IDs
DROP TABLE IF EXISTS `application_sequences`;
CREATE TABLE `application_sequences` (
  `year` INT UNSIGNED PRIMARY KEY,
  `current_seq` INT UNSIGNED NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `application_sequences` (`year`, `current_seq`) VALUES (2026, 125);

-- 9. Application Documents Table
DROP TABLE IF EXISTS `application_documents`;
CREATE TABLE `application_documents` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT UNSIGNED NOT NULL,
  `document_title` VARCHAR(150) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_size` VARCHAR(50) NULL,
  `is_verified` TINYINT(1) DEFAULT 0,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_docs_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Payments Table
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT UNSIGNED NOT NULL,
  `amount_pkr` DECIMAL(10,2) NOT NULL DEFAULT 4500.00,
  `payment_method` ENUM('Bank Transfer', 'Bank Challan', 'Online Gateway') NOT NULL,
  `bank_name` VARCHAR(100) NULL,
  `transaction_ref` VARCHAR(100) NOT NULL,
  `payment_date` DATE NOT NULL,
  `receipt_file_path` VARCHAR(255) NULL,
  `status` ENUM(
    'Pending',
    'Submitted for Verification',
    'Verified',
    'Rejected',
    'Refund Pending',
    'Refunded'
  ) NOT NULL DEFAULT 'Submitted for Verification',
  `rejection_reason` VARCHAR(255) NULL,
  `refund_ref` VARCHAR(100) NULL,
  `refund_date` DATE NULL,
  `verified_by` VARCHAR(150) NULL,
  `verified_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pay_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  INDEX `idx_pay_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Ballot Events
DROP TABLE IF EXISTS `ballot_events`;
CREATE TABLE `ballot_events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `scheduled_date` DATE NOT NULL,
  `application_deadline` DATE NOT NULL,
  `selection_method` VARCHAR(100) DEFAULT 'Verifiable Pseudo-Randomized Draw',
  `status` ENUM('Scheduled', 'Registration Closed', 'Eligible Pool Locked', 'Draw Completed', 'Results Published') DEFAULT 'Scheduled',
  `random_seed` VARCHAR(128) NULL,
  `notes` TEXT NULL,
  `published_at` DATETIME NULL,
  `published_by` VARCHAR(150) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ballot_events` (`title`, `scheduled_date`, `application_deadline`, `selection_method`, `status`, `notes`) VALUES
('Saudi Arabia 2026 General Recruitment Ballot', '2026-12-22', '2026-12-10', 'Verifiable Pseudo-Randomized Draw', 'Scheduled', 'Proposed computerized recruitment ballot date 22 December 2026.');

-- 12. Ballot Eligibility Pool
DROP TABLE IF EXISTS `ballot_eligibility`;
CREATE TABLE `ballot_eligibility` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ballot_event_id` INT UNSIGNED NOT NULL,
  `application_id` INT UNSIGNED NOT NULL,
  `qualification_verified` TINYINT(1) DEFAULT 1,
  `payment_verified` TINYINT(1) DEFAULT 1,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_be_event` FOREIGN KEY (`ballot_event_id`) REFERENCES `ballot_events` (`id`),
  CONSTRAINT `fk_be_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Ballot Results
DROP TABLE IF EXISTS `ballot_results`;
CREATE TABLE `ballot_results` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ballot_event_id` INT UNSIGNED NOT NULL,
  `application_id` INT UNSIGNED NOT NULL,
  `selection_rank` INT UNSIGNED NOT NULL,
  `status` ENUM('Selected', 'Standby', 'Disqualified') DEFAULT 'Selected',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_br_event` FOREIGN KEY (`ballot_event_id`) REFERENCES `ballot_events` (`id`),
  CONSTRAINT `fk_br_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Application Status History (Audit Trail)
DROP TABLE IF EXISTS `application_status_history`;
CREATE TABLE `application_status_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT UNSIGNED NOT NULL,
  `status` VARCHAR(64) NOT NULL,
  `changed_by` VARCHAR(150) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_hist_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Candidate & System Notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `application_id` INT UNSIGNED NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `channel` ENUM('Dashboard', 'Email', 'SMS') DEFAULT 'Dashboard',
  `is_read` TINYINT(1) DEFAULT 0,
  `delivery_status` ENUM('Delivered', 'Pending', 'Failed') DEFAULT 'Delivered',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Admin Roles & Permissions
DROP TABLE IF EXISTS `admin_roles`;
CREATE TABLE `admin_roles` (
  `role_key` VARCHAR(32) PRIMARY KEY,
  `role_name` VARCHAR(100) NOT NULL,
  `permissions` JSON NOT NULL,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admin_roles` (`role_key`, `role_name`, `permissions`, `description`) VALUES
('super_admin', 'Super Administrator', '["*"]', 'Full administrative authority and legal authorization toggles'),
('recruitment_admin', 'Recruitment Manager', '["jobs.*", "applications.*", "ballot.*"]', 'Quota vacancy management and ballot draw execution'),
('payment_reviewer', 'Finance & Payment Reviewer', '["payments.*"]', 'Manual banking reconciliation, receipt reviews, and refunds'),
('readonly_reviewer', 'Observer & Auditor', '["reports.view", "audit.view"]', 'Read-only access for diplomatic and ministry observers');

-- 17. Admin Users (Default superadmin: Admin@Saudi2026!)
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'recruitment_admin',
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_admin_role` FOREIGN KEY (`role`) REFERENCES `admin_roles` (`role_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admin_users` (`username`, `email`, `password_hash`, `full_name`, `role`) VALUES
('superadmin', 'admin@saudijobsportal.pk', '$2y$12$e8Y6lA5m.0/KkV3.ZqD7fe6VbQ2s.H9xO71yU6b0tB/765k0W/v8a', 'Super Administrator', 'super_admin');

-- 18. Audit Logs
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `actor` VARCHAR(150) NOT NULL,
  `role` VARCHAR(64) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

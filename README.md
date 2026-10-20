# Saudi Jobs & Recruitment Portal Pakistan — Complete PHP 8.2 + MySQL Architecture

This repository contains the complete production-ready source code for **Hostinger Shared Hosting** (Single, Premium, Business, or Cloud Hosting) and local development.

---

## 1. Directory Structure

```text
├── .htaccess                     # Apache rules, security headers, upload limits
├── config/
│   ├── config.php                # Core application settings, session security, JSON helpers
│   ├── database.php              # PDO MySQL connection with prepared statements
├── includes/
│   ├── auth.php                  # Password hashing (bcrypt), RBAC, sanitizers, audit logs
│   ├── csrf.php                  # CSRF protection tokens and request validation
├── api/
│   ├── auth/
│   │   ├── register.php          # Candidate registration API
│   │   ├── login.php             # Unified candidate & staff login API
│   │   └── logout.php            # Session termination & audit log API
│   ├── jobs/
│   │   └── list.php              # Verified vacancies & categories listing API
│   ├── applications/
│   │   ├── submit.php            # Concurrency-safe atomic Tracking ID generation API
│   │   └── track.php             # Privacy-preserving public tracking with 2FA unlock
│   ├── payments/
│   │   └── submit.php            # Bank transaction & receipt screenshot upload API
│   └── admin/
│       ├── dashboard.php         # Protected admin overview & dossier inspection API
│       ├── verify-payment.php    # Payment reconciliation & refund tracking API
│       ├── approve-application.php# Application queue approval & rejection API
│       ├── ballot.php            # Computerized ballot engine (22 Dec 2026) API
│       └── update-status.php     # Next-stage status & legal settings updater API
├── database.sql                  # Full 18-table MySQL/MariaDB schema with initial seed
├── uploads/
│   ├── receipts/                 # Candidate payment receipt screenshots (admin viewable)
│   └── cv/                       # Candidate resume documents
├── src/                          # React + TypeScript frontend connected to /api/*
```

---

## 2. Hostinger Shared Hosting Deployment Instructions

### Step 1: Database Setup in Hostinger hPanel
1. Log into your **Hostinger hPanel**.
2. Navigate to **Databases** > **MySQL Databases**.
3. Create a new database:
   - **Database Name:** e.g., `u123456789_saudijobs`
   - **Username:** e.g., `u123456789_admin`
   - **Password:** Generate a strong password.
4. Click **Enter phpMyAdmin**.
5. Select your new database and click the **Import** tab.
6. Choose the file `database.sql` and click **Go**.
   - All 18 relational tables, foreign keys, sequence trackers, and default admin accounts will be created.

### Step 2: Database Credentials Configuration
1. In Hostinger hPanel, open **File Manager** (or connect via FileZilla SFTP).
2. Open `config/database.php` and set your credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_saudijobs');
   define('DB_USER', 'u123456789_admin');
   define('DB_PASS', 'YourActualHostingerDbPassword');
   ```

### Step 3: File Upload to `public_html/`
1. Build the frontend (`npm run build`).
2. Upload the compiled `dist/` contents, along with the `api/`, `config/`, `includes/`, and `.htaccess` files into your Hostinger domain's **`public_html/`** folder.
3. Ensure directory permissions:
   - `chmod 755 uploads/`
   - `chmod 755 uploads/receipts/`
   - `chmod 755 uploads/cv/`

---

## 3. Administrative Credentials

- **Super Administrator:**
  - Username: `superadmin`
  - Password: `Admin@Saudi2026!`
- **Recruitment Manager:**
  - Username: `recruiter`
  - Password: `Admin@Saudi2026!`
- **Payment Reviewer:**
  - Username: `finance`
  - Password: `Admin@Saudi2026!`

*Change default passwords immediately after initial login via Admin Settings.*

---

## 4. Key Workflows & Features

1. **Unique Collision-Resistant Tracking IDs**: Generated atomically on the database using MySQL `SELECT ... FOR UPDATE` (e.g. `SAJ-2026-000101`).
2. **PKR 4,500 Fee Verification**: Manual verification workflow. Never verified automatically.
3. **Payment Receipt Screenshot Preview**: Admin can view the actual uploaded receipt screenshot directly in the Payment Verification module.
4. **Computerized Ballot Engine**: Configured for **22 December 2026** using a verifiable cryptographic seed proof across verified eligible applicants.

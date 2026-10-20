# Saudi Jobs & Recruitment Portal Pakistan — Hostinger Shared Hosting Deployment Guide

This package contains the complete PHP 8.2 + MySQL / MariaDB source code for deploying to **Hostinger Shared Hosting** (Single, Premium, or Business Web Hosting).

---

## 1. Prerequisites on Hostinger
- Active Hostinger account with hPanel access.
- PHP version configured to **PHP 8.2** or higher in hPanel (*Websites > PHP Configuration*).
- MySQL / MariaDB database created in hPanel (*Databases > MySQL Databases*). Note down:
  - Database Name (e.g. `u123456789_saudijobs`)
  - Database Username (e.g. `u123456789_admin`)
  - Database Password

---

## 2. Installation Instructions

### Step 1: Database Setup
1. Log into your **Hostinger hPanel**.
2. Go to **Databases** > **phpMyAdmin** for your new database.
3. Click the **Import** tab.
4. Select `database.sql` and click **Go**.
5. All 16 tables, unique constraints, and demo records will be initialized.

### Step 2: Database Configuration
1. Open `config/database.php` in Hostinger File Manager or code editor.
2. Update the credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_saudijobs');
   define('DB_USER', 'u123456789_admin');
   define('DB_PASS', 'YourActualHostingerDbPassword');
   ```

### Step 3: File Upload
1. In Hostinger hPanel, open **File Manager** (or connect via SFTP/FileZilla).
2. Go to `public_html/`.
3. Upload all PHP files and `.htaccess` into `public_html/`.
4. Ensure `.htaccess` is uploaded (enable "Show Hidden Files" in File Manager settings).

### Step 4: Folder Permissions
Set write permissions (`chmod 755`) for the upload folders:
- `uploads/cv/`
- `uploads/receipts/`

---

## 3. Administrative Access
- Navigate to: `https://yourdomain.com/admin/login.php`
- **Default Username:** `superadmin`
- **Default Password:** `Admin@Saudi2026!`
- *Change the default password immediately after login.*

---

## 4. Statutory Legal Notice & Fee Controls
- **Organization Name**: The system defaults to **"Saudi Jobs & Recruitment Portal Pakistan"**.
- Before displaying **"Royal Saudi Embassy in Islamabad"**, the Super Admin must upload or input the written authorization permit reference under **Admin > Website Settings**.
- **Fee Collection (PKR 4,500)**: Disabled by default. It must remain disabled until statutory legal authorization is verified.
- **Ballot Draw**: Scheduled for **22 December 2026** with deterministic cryptographic seed proof.

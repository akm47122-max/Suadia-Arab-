<?php
/**
 * Authentication, RBAC, and Validation Helpers
 * PHP 8.2+
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/config.php';
require_once dirname(__DIR__) . '/config/database.php';

class Auth
{
    /**
     * Hash password with bcrypt
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify password against hash
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Sanitize general input strings
     */
    public static function sanitize(string $input): string
    {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Validate Pakistani CNIC (13 digits: xxxxx-xxxxxxx-x or 13 consecutive digits)
     */
    public static function validateCnic(string $cnic): ?string
    {
        $clean = preg_replace('/\\D/', '', $cnic);
        if (strlen($clean) !== 13) {
            return null;
        }
        return substr($clean, 0, 5) . '-' . substr($clean, 5, 7) . '-' . substr($clean, 12, 1);
    }

    /**
     * Validate Pakistani Mobile (11 digits starting with 03)
     */
    public static function validateMobile(string $mobile): ?string
    {
        $clean = preg_replace('/\\D/', '', $mobile);
        if (strlen($clean) !== 11 || !str_starts_with($clean, '03')) {
            return null;
        }
        return substr($clean, 0, 4) . '-' . substr($clean, 4);
    }

    /**
     * Get logged-in candidate user
     */
    public static function getCurrentCandidate(PDO $pdo): ?array
    {
        if (empty($_SESSION['candidate_user_id'])) {
            return null;
        }

        $stmt = $pdo->prepare("
            SELECT u.id, u.email, u.full_name, u.mobile, u.cnic, u.created_at,
                   cp.dob, cp.gender, cp.city, cp.province, cp.education,
                   cp.experience_years, cp.passport_status, cp.preferred_category,
                   cp.cv_file_path, cp.photo_file_path
            FROM users u
            LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
            WHERE u.id = ?
        ");
        $stmt->execute([(int)$_SESSION['candidate_user_id']]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Require Candidate Login
     */
    public static function requireCandidate(PDO $pdo): array
    {
        $user = self::getCurrentCandidate($pdo);
        if (!$user) {
            jsonError('Candidate authentication required. Please sign in.', 401);
        }
        return $user;
    }

    /**
     * Get logged-in admin user
     */
    public static function getCurrentAdmin(PDO $pdo): ?array
    {
        if (empty($_SESSION['admin_user_id'])) {
            return null;
        }

        $stmt = $pdo->prepare("
            SELECT id, username, email, full_name, role, is_active, last_login
            FROM admin_users
            WHERE id = ? AND is_active = 1
        ");
        $stmt->execute([(int)$_SESSION['admin_user_id']]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Require Admin Login and check permitted roles
     */
    public static function requireAdminRole(PDO $pdo, array $allowedRoles = ['super_admin']): array
    {
        $admin = self::getCurrentAdmin($pdo);
        if (!$admin) {
            jsonError('Staff administrative authentication required.', 401);
        }

        if (!in_array($admin['role'], $allowedRoles, true) && $admin['role'] !== 'super_admin') {
            jsonError('Access denied: You do not have permission to execute this administrative action.', 403);
        }

        return $admin;
    }

    /**
     * Get logged-in staff user
     */
    public static function getCurrentStaff(PDO $pdo): ?array
    {
        if (empty($_SESSION['staff_user_id'])) {
            return null;
        }

        $stmt = $pdo->prepare("
            SELECT id, username, email, full_name, phone, role, status, referral_code,
                   monthly_target, must_change_password, last_login, created_at
            FROM staff_users
            WHERE id = ? AND status = 'active'
        ");
        $stmt->execute([(int)$_SESSION['staff_user_id']]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Require Staff Login (only active staff accounts)
     */
    public static function requireStaff(PDO $pdo): array
    {
        $staff = self::getCurrentStaff($pdo);
        if (!$staff) {
            jsonError('Staff authentication required. Account may be suspended or session expired.', 401);
        }
        return $staff;
    }

    /**
     * Rate limiting check for authentication attempts (max 5 attempts per 15 minutes)
     */
    public static function checkStaffRateLimit(PDO $pdo, string $identifier, int $maxAttempts = 5, int $windowMinutes = 15): bool
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM staff_login_attempts
            WHERE (ip_address = ? OR username_or_email = ?)
              AND attempt_time >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ");
        $stmt->execute([$ip, $identifier, $windowMinutes]);
        $count = (int)$stmt->fetchColumn();

        return $count < $maxAttempts;
    }

    /**
     * Record a failed login attempt
     */
    public static function recordStaffLoginAttempt(PDO $pdo, string $identifier): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("
            INSERT INTO staff_login_attempts (username_or_email, ip_address)
            VALUES (?, ?)
        ");
        $stmt->execute([$identifier, $ip]);
    }

    /**
     * Clear login attempts on successful authentication
     */
    public static function clearStaffLoginAttempts(PDO $pdo, string $identifier): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("
            DELETE FROM staff_login_attempts
            WHERE ip_address = ? OR username_or_email = ?
        ");
        $stmt->execute([$ip, $identifier]);
    }

    /**
     * Generate unique collision-resistant staff referral code
     */
    public static function generateSecureReferralCode(string $name, string $role): string
    {
        $cleanName = strtoupper(preg_replace('/[^A-Za-z]/', '', $name));
        $prefix = substr($cleanName, 0, 3) ?: 'STF';
        $randNum = random_int(1000, 9999);
        return 'STF-' . $prefix . '-' . $randNum;
    }

    /**
     * Generate strong random temporary password
     */
    public static function generateSecureTempPassword(int $length = 12): string
    {
        $upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $lower = 'abcdefghjkmnpqrstuvwxyz';
        $digits = '23456789';
        $symbols = '!@#$%^&*';

        $pw = $upper[random_int(0, strlen($upper) - 1)] .
              $lower[random_int(0, strlen($lower) - 1)] .
              $digits[random_int(0, strlen($digits) - 1)] .
              $symbols[random_int(0, strlen($symbols) - 1)];

        $all = $upper . $lower . $digits . $symbols;
        for ($i = 4; $i < $length; $i++) {
            $pw .= $all[random_int(0, strlen($all) - 1)];
        }

        return str_shuffle($pw);
    }

    /**
     * Record an audit log entry
     */
    public static function logAudit(PDO $pdo, string $action, string $details, string $actor = 'System', string $role = 'guest'): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare('INSERT INTO audit_logs (actor, role, action, details, ip_address) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$actor, $role, $action, $details, $ip]);
    }
}


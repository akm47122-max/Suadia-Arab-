<?php
/**
 * Staff Authentication Login API
 * PHP 8.2+
 * Secure Sessions, Rate Limiting & Audit Logging
 */

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/config.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$usernameOrEmail = trim($input['username'] ?? $input['email'] ?? '');
$password = (string)($input['password'] ?? '');

if (empty($usernameOrEmail) || empty($password)) {
    jsonError('Please provide both username/email and password.');
}

$pdo = Database::getConnection();

// Check Rate Limit (5 attempts per 15 minutes)
if (!Auth::checkStaffRateLimit($pdo, $usernameOrEmail, 5, 15)) {
    Auth::logAudit($pdo, 'STAFF_LOGIN_BLOCKED', "Rate limit reached for identifier: {$usernameOrEmail}", $usernameOrEmail, 'staff');
    jsonError('Too many failed login attempts. Please wait 15 minutes before retrying.', 429);
}

// Query staff user by username or email
$stmt = $pdo->prepare("
    SELECT id, username, email, password_hash, full_name, phone, role, status,
           referral_code, monthly_target, must_change_password
    FROM staff_users
    WHERE username = ? OR email = ?
    LIMIT 1
");
$stmt->execute([$usernameOrEmail, $usernameOrEmail]);
$staff = $stmt->fetch();

if (!$staff || !Auth::verifyPassword($password, $staff['password_hash'])) {
    Auth::recordStaffLoginAttempt($pdo, $usernameOrEmail);
    Auth::logAudit($pdo, 'STAFF_LOGIN_FAILED', "Failed login attempt for: {$usernameOrEmail}", $usernameOrEmail, 'guest');
    jsonError('Invalid staff username, email, or password.', 401);
}

// Check suspension
if ($staff['status'] === 'suspended') {
    Auth::logAudit($pdo, 'STAFF_SUSPENDED_LOGIN_ATTEMPT', "Suspended staff attempted login: {$staff['username']}", $staff['username'], 'staff');
    jsonError('This staff account is currently suspended. Please contact your administrative supervisor.', 403);
}

// Clear failed rate limit attempts on success
Auth::clearStaffLoginAttempts($pdo, $usernameOrEmail);

// Regenerate session ID for fixation protection
session_regenerate_id(true);
$_SESSION['staff_user_id'] = (int)$staff['id'];
$_SESSION['staff_username'] = $staff['username'];
$_SESSION['staff_role'] = $staff['role'];

// Update last login timestamp
$updateStmt = $pdo->prepare("UPDATE staff_users SET last_login = NOW() WHERE id = ?");
$updateStmt->execute([(int)$staff['id']]);

Auth::logAudit($pdo, 'STAFF_LOGIN_SUCCESS', "Staff member {$staff['full_name']} logged in", $staff['username'], 'staff');

// Strip sensitive fields
unset($staff['password_hash']);

jsonSuccess([
    'staff' => [
        'id' => (string)$staff['id'],
        'fullName' => $staff['full_name'],
        'username' => $staff['username'],
        'email' => $staff['email'],
        'phone' => $staff['phone'] ?? '',
        'role' => $staff['role'],
        'status' => $staff['status'],
        'referralCode' => $staff['referral_code'],
        'monthlyTarget' => (int)$staff['monthly_target'],
        'mustChangePassword' => (bool)$staff['must_change_password'],
    ],
    'message' => 'Staff authentication successful.'
]);

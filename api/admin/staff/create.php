<?php
/**
 * Admin Create Staff Member API
 * PHP 8.2+
 * Admin-only; no public staff registration
 * No hardcoded count limits
 */

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/config/config.php';
require_once dirname(__DIR__, 3) . '/config/database.php';
require_once dirname(__DIR__, 3) . '/includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$pdo = Database::getConnection();
$admin = Auth::requireAdminRole($pdo, ['super_admin', 'recruitment_admin']);

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$fullName = trim($input['fullName'] ?? $input['full_name'] ?? '');
$username = strtolower(trim($input['username'] ?? ''));
$email = strtolower(trim($input['email'] ?? ''));
$phone = trim($input['phone'] ?? '');
$role = trim($input['role'] ?? 'recruitment_officer');
$monthlyTarget = (int)($input['monthlyTarget'] ?? $input['monthly_target'] ?? 15);

// Validation
if (empty($fullName) || empty($username) || empty($email)) {
    jsonError('Full name, username, and email are mandatory fields.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email format provided.');
}

if (!preg_match('/^[a-z0-9_]{3,30}$/', $username)) {
    jsonError('Username must be 3-30 characters long and contain only lowercase letters, numbers, and underscores.');
}

// Check duplicates in staff_users
$checkStmt = $pdo->prepare("SELECT id FROM staff_users WHERE username = ? OR email = ? LIMIT 1");
$checkStmt->execute([$username, $email]);
if ($checkStmt->fetch()) {
    jsonError('A staff member with this username or email already exists.');
}

// Generate unique referral code
$baseCode = Auth::generateSecureReferralCode($fullName, $role);
$referralCode = $baseCode;
$seq = 1;
while (true) {
    $refCheck = $pdo->prepare("SELECT id FROM staff_users WHERE referral_code = ? LIMIT 1");
    $refCheck->execute([$referralCode]);
    if (!$refCheck->fetch()) {
        break;
    }
    $referralCode = $baseCode . '-' . $seq++;
}

// Generate secure temporary password
$tempPassword = Auth::generateSecureTempPassword(12);
$passwordHash = Auth::hashPassword($tempPassword);

$insertStmt = $pdo->prepare("
    INSERT INTO staff_users (username, email, password_hash, full_name, phone, role, status,
                             referral_code, monthly_target, must_change_password, created_by_admin_id)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, 1, ?)
");
$insertStmt->execute([
    $username,
    $email,
    $passwordHash,
    $fullName,
    $phone,
    $role,
    $referralCode,
    $monthlyTarget,
    (int)$admin['id']
]);

$newStaffId = (int)$pdo->lastInsertId();

Auth::logAudit($pdo, 'STAFF_CREATED', "Admin {$admin['name']} created staff member {$username} (ID: {$newStaffId}) with referral code {$referralCode}.", $admin['name'], $admin['role']);

// Return temporary credentials ONCE for secure handoff
jsonSuccess([
    'staff' => [
        'id' => (string)$newStaffId,
        'fullName' => $fullName,
        'username' => $username,
        'email' => $email,
        'phone' => $phone,
        'role' => $role,
        'status' => 'active',
        'referralCode' => $referralCode,
        'monthlyTarget' => $monthlyTarget,
        'mustChangePassword' => true,
        'createdAt' => date('Y-m-d H:i:s'),
    ],
    'temporaryCredentials' => [
        'username' => $username,
        'temporaryPassword' => $tempPassword,
        'referralCode' => $referralCode,
        'notice' => 'Copy this temporary password now. It will never be stored or shown in plaintext again.'
    ],
    'message' => "Staff account for {$fullName} created successfully."
], 'Staff member registered.');

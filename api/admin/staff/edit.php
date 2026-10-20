<?php
/**
 * Admin Edit Staff Member API
 * PHP 8.2+
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
$staffId = (int)($input['id'] ?? $input['staffId'] ?? 0);
$fullName = trim($input['fullName'] ?? $input['full_name'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$phone = trim($input['phone'] ?? '');
$role = trim($input['role'] ?? '');
$monthlyTarget = (int)($input['monthlyTarget'] ?? $input['monthly_target'] ?? 15);

if ($staffId <= 0 || empty($fullName) || empty($email)) {
    jsonError('Invalid staff ID or missing required name/email fields.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email format provided.');
}

// Check email uniqueness among other staff
$checkStmt = $pdo->prepare("SELECT id FROM staff_users WHERE email = ? AND id != ? LIMIT 1");
$checkStmt->execute([$email, $staffId]);
if ($checkStmt->fetch()) {
    jsonError('Another staff account is already using this email address.');
}

$updateStmt = $pdo->prepare("
    UPDATE staff_users
    SET full_name = ?, email = ?, phone = ?, role = ?, monthly_target = ?, updated_at = NOW()
    WHERE id = ?
");
$updateStmt->execute([$fullName, $email, $phone, $role, $monthlyTarget, $staffId]);

Auth::logAudit($pdo, 'STAFF_UPDATED', "Admin {$admin['name']} updated staff member ID {$staffId} ({$fullName}).", $admin['name'], $admin['role']);

jsonSuccess([], 'Staff member details updated successfully.');

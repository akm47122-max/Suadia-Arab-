<?php
/**
 * Staff Mandatory / Self Password Change API
 * PHP 8.2+
 */

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/config.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$pdo = Database::getConnection();
$staff = Auth::requireStaff($pdo);

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$newPassword = (string)($input['newPassword'] ?? $input['new_password'] ?? '');
$confirmPassword = (string)($input['confirmPassword'] ?? $input['confirm_password'] ?? '');

if (strlen($newPassword) < 8) {
    jsonError('New password must be at least 8 characters in length.');
}

if (!empty($confirmPassword) && $newPassword !== $confirmPassword) {
    jsonError('New password and confirmation do not match.');
}

// Strong complexity check: must contain letters and numbers
if (!preg_match('/[A-Za-z]/', $newPassword) || !preg_match('/[0-9]/', $newPassword)) {
    jsonError('Password must contain both letters and numeric characters for security.');
}

$hashed = Auth::hashPassword($newPassword);

$stmt = $pdo->prepare("
    UPDATE staff_users
    SET password_hash = ?, must_change_password = 0, updated_at = NOW()
    WHERE id = ?
");
$stmt->execute([$hashed, (int)$staff['id']]);

Auth::logAudit($pdo, 'STAFF_PASSWORD_CHANGED', "Staff member {$staff['username']} updated their password.", $staff['username'], 'staff');

jsonSuccess([
    'mustChangePassword' => false
], 'Password updated successfully. Account is fully verified.');

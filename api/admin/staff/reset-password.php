<?php
/**
 * Admin Reset Staff Password & Credentials API
 * PHP 8.2+
 * Generates secure temporary password, enforces password change on next login
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

if ($staffId <= 0) {
    jsonError('Valid staff ID required.');
}

$stmt = $pdo->prepare("SELECT id, username, full_name, email, referral_code FROM staff_users WHERE id = ?");
$stmt->execute([$staffId]);
$staff = $stmt->fetch();

if (!$staff) {
    jsonError('Staff member record not found.', 404);
}

// Generate new random temporary password
$tempPassword = Auth::generateSecureTempPassword(12);
$newHash = Auth::hashPassword($tempPassword);

$updateStmt = $pdo->prepare("
    UPDATE staff_users
    SET password_hash = ?, must_change_password = 1, updated_at = NOW()
    WHERE id = ?
");
$updateStmt->execute([$newHash, $staffId]);

Auth::logAudit(
    $pdo,
    'STAFF_CREDENTIALS_RESET',
    "Admin {$admin['name']} issued credentials reset for staff {$staff['username']}.",
    $admin['name'],
    $admin['role']
);

jsonSuccess([
    'staffId' => (string)$staffId,
    'username' => $staff['username'],
    'fullName' => $staff['full_name'],
    'temporaryPassword' => $tempPassword,
    'mustChangePassword' => true,
    'message' => "Temporary credentials generated for {$staff['full_name']}. The staff member will be required to choose a new password upon login."
]);

<?php
/**
 * Admin Safe Deactivate / Delete Staff Member API
 * PHP 8.2+
 * Strict Guard: Prevent deleting the last active super-admin
 */

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/config/config.php';
require_once dirname(__DIR__, 3) . '/config/database.php';
require_once dirname(__DIR__, 3) . '/includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$pdo = Database::getConnection();
$admin = Auth::requireAdminRole($pdo, ['super_admin']);

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$staffId = (int)($input['id'] ?? $input['staffId'] ?? 0);
$isPermanent = !empty($input['permanent']);

if ($staffId <= 0) {
    jsonError('Valid staff ID required.');
}

// 1. Guard check: Check if trying to delete an admin_user, prevent deleting last super-admin
$superAdminCountStmt = $pdo->query("SELECT COUNT(*) FROM admin_users WHERE role = 'super_admin' AND is_active = 1");
$superAdminCount = (int)$superAdminCountStmt->fetchColumn();

if ($superAdminCount <= 1 && (int)$admin['id'] === $staffId) {
    jsonError('Safety lock: Cannot delete or deactivate the last active Super Administrator.');
}

// 2. Fetch staff record
$stmt = $pdo->prepare("SELECT id, username, full_name, role FROM staff_users WHERE id = ?");
$stmt->execute([$staffId]);
$staff = $stmt->fetch();

if (!$staff) {
    jsonError('Staff member record not found.', 404);
}

// Check if staff has referrals attached
$appCountStmt = $pdo->prepare("SELECT COUNT(*) FROM applications WHERE referred_by_staff_id = ?");
$appCountStmt->execute([$staffId]);
$appCount = (int)$appCountStmt->fetchColumn();

if ($appCount > 0 && !$isPermanent) {
    // Safely suspend account to preserve referral history and audit integrity
    $suspendStmt = $pdo->prepare("UPDATE staff_users SET status = 'suspended', updated_at = NOW() WHERE id = ?");
    $suspendStmt->execute([$staffId]);

    Auth::logAudit($pdo, 'STAFF_SAFELY_SUSPENDED', "Staff member {$staff['username']} has {$appCount} attached referrals and was suspended to preserve ledger history.", $admin['name'], $admin['role']);

    jsonSuccess([
        'action' => 'suspended',
        'message' => "Staff member {$staff['full_name']} has {$appCount} registered candidate referrals. The account has been suspended to protect audit and earnings records."
    ]);
} else {
    // Delete bonus records then staff record
    $delBonus = $pdo->prepare("DELETE FROM staff_bonus_records WHERE staff_id = ?");
    $delBonus->execute([$staffId]);

    // Unlink applications instead of cascading delete candidate dossiers
    $unlinkStmt = $pdo->prepare("UPDATE applications SET referred_by_staff_id = NULL WHERE referred_by_staff_id = ?");
    $unlinkStmt->execute([$staffId]);

    $delStaff = $pdo->prepare("DELETE FROM staff_users WHERE id = ?");
    $delStaff->execute([$staffId]);

    Auth::logAudit($pdo, 'STAFF_DELETED', "Staff member {$staff['username']} deleted by Admin {$admin['name']}.", $admin['name'], $admin['role']);

    jsonSuccess([
        'action' => 'deleted',
        'message' => "Staff member {$staff['full_name']} removed successfully."
    ]);
}

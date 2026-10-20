<?php
/**
 * Admin Toggle Staff Status (Activate / Suspend) API
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
$status = trim($input['status'] ?? '');

if ($staffId <= 0 || !in_array($status, ['active', 'suspended'], true)) {
    jsonError('Valid staff ID and status (active or suspended) are required.');
}

$stmt = $pdo->prepare("SELECT id, username, full_name, status FROM staff_users WHERE id = ?");
$stmt->execute([$staffId]);
$staff = $stmt->fetch();

if (!$staff) {
    jsonError('Staff member record not found.', 404);
}

$updateStmt = $pdo->prepare("UPDATE staff_users SET status = ?, updated_at = NOW() WHERE id = ?");
$updateStmt->execute([$status, $staffId]);

Auth::logAudit(
    $pdo,
    'STAFF_STATUS_CHANGED',
    "Admin {$admin['name']} changed status of staff {$staff['username']} to {$status}.",
    $admin['name'],
    $admin['role']
);

jsonSuccess([
    'staffId' => (string)$staffId,
    'status' => $status,
    'message' => "Staff account for {$staff['full_name']} is now {$status}."
]);

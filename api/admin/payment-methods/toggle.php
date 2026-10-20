<?php
/**
 * Toggle Payment Method Status & Archive API
 * POST /api/admin/payment-methods/toggle.php
 * Requires authorized admin session and confirms if pending applications exist
 */

declare(strict_types=1);

require_once dirname(dirname(dirname(__DIR__))) . '/config/config.php';
require_once dirname(dirname(dirname(__DIR__))) . '/config/database.php';
require_once dirname(dirname(dirname(__DIR__))) . '/includes/auth.php';
require_once dirname(dirname(dirname(__DIR__))) . '/includes/csrf.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method Not Allowed', 405);
}

try {
    $pdo = Database::getConnection();
    $admin = Auth::requireAdminRole($pdo, ['super_admin', 'consular_officer', 'finance_officer']);

    $input = getJsonInput();
    $id = Auth::sanitize((string)($input['id'] ?? ''));
    $targetStatus = (string)($input['status'] ?? 'inactive');
    $confirmOverride = (bool)($input['confirmOverride'] ?? $input['confirm_override'] ?? false);

    if (empty($id)) {
        jsonError('Payment method ID is required.');
    }

    $validStatuses = ['active', 'inactive', 'archived'];
    if (!in_array($targetStatus, $validStatuses, true)) {
        jsonError('Invalid status specified.');
    }

    // Fetch existing method
    $stmt = $pdo->prepare('SELECT * FROM payment_methods WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $method = $stmt->fetch();

    if (!$method) {
        jsonError('Payment method not found.', 404);
    }

    // Check usage by pending applications
    $usageStmt = $pdo->prepare('
        SELECT COUNT(*) FROM payments 
        WHERE (payment_method_id = ? OR payment_method = ?)
          AND status IN ("Pending", "Submitted for Verification")
    ');
    $usageStmt->execute([$id, $method['name']]);
    $pendingCount = (int)$usageStmt->fetchColumn();

    if (($targetStatus === 'inactive' || $targetStatus === 'archived') && $pendingCount > 0 && !$confirmOverride) {
        jsonResponse([
            'success' => false,
            'requiresConfirmation' => true,
            'pendingApplicationsCount' => $pendingCount,
            'message' => "Warning: There are {$pendingCount} pending application(s) awaiting payment verification using this method. Please confirm override to proceed.",
        ], 409);
    }

    // Perform status update
    $upd = $pdo->prepare('UPDATE payment_methods SET status = ? WHERE id = ?');
    $upd->execute([$targetStatus, $id]);

    Auth::logAudit(
        $pdo,
        'PAYMENT_METHOD_STATUS_CHANGED',
        "Admin {$admin['username']} changed payment method '{$method['name']}' status from {$method['status']} to $targetStatus (Pending apps: $pendingCount)",
        $admin['full_name'],
        'admin'
    );

    jsonResponse([
        'success' => true,
        'message' => "Payment method '{$method['name']}' is now $targetStatus.",
        'id' => $id,
        'status' => $targetStatus,
    ]);
} catch (PDOException $e) {
    error_log('[PAYMENT_METHOD_TOGGLE_ERROR] ' . $e->getMessage());
    jsonError('Failed to update payment method status.', 500);
}

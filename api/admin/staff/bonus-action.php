<?php
/**
 * Admin Bonus Approval & Disbursement API
 * PHP 8.2+
 * Multi-Stage Verification: Approvals & Banking Reference Records
 */

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/config/config.php';
require_once dirname(__DIR__, 3) . '/config/database.php';
require_once dirname(__DIR__, 3) . '/includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$pdo = Database::getConnection();
$admin = Auth::requireAdminRole($pdo, ['super_admin', 'payment_reviewer']);

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$bonusId = (int)($input['bonusId'] ?? $input['id'] ?? 0);
$action = trim($input['action'] ?? 'approve'); // 'approve', 'pay', 'reject', 'create_award'
$notes = trim($input['notes'] ?? '');
$paidRef = trim($input['paidRef'] ?? $input['paid_ref'] ?? '');

if ($action === 'create_award') {
    // Admin creates an ad-hoc bonus award for performance
    $staffId = (int)($input['staffId'] ?? 0);
    $amount = (float)($input['amountPKR'] ?? 0);
    $periodMonth = trim($input['periodMonth'] ?? date('Y-m'));
    $tierName = trim($input['tierName'] ?? 'Performance Incentive');

    if ($staffId <= 0 || $amount <= 0) {
        jsonError('Valid staff ID and bonus amount greater than zero are required.');
    }

    $staffCheck = $pdo->prepare("SELECT id, full_name, username FROM staff_users WHERE id = ?");
    $staffCheck->execute([$staffId]);
    $stf = $staffCheck->fetch();
    if (!$stf) {
        jsonError('Staff member not found.', 404);
    }

    $insertBonus = $pdo->prepare("
        INSERT INTO staff_bonus_records (staff_id, period_month, bonus_amount_pkr, tier_name, status,
                                         approved_by, approved_at, notes)
        VALUES (?, ?, ?, ?, 'Approved', ?, NOW(), ?)
    ");
    $insertBonus->execute([$staffId, $periodMonth, $amount, $tierName, $admin['name'], $notes]);

    Auth::logAudit($pdo, 'BONUS_AWARD_CREATED', "Admin {$admin['name']} awarded PKR {$amount} bonus to staff {$stf['username']}.", $admin['name'], $admin['role']);

    jsonSuccess(['message' => "Performance bonus of PKR {$amount} awarded to {$stf['full_name']}."]);
}

if ($bonusId <= 0) {
    jsonError('Valid bonus ID is required.');
}

$bonusStmt = $pdo->prepare("
    SELECT b.*, s.username, s.full_name
    FROM staff_bonus_records b
    JOIN staff_users s ON b.staff_id = s.id
    WHERE b.id = ?
");
$bonusStmt->execute([$bonusId]);
$bonus = $bonusStmt->fetch();

if (!$bonus) {
    jsonError('Bonus ledger record not found.', 404);
}

if ($action === 'approve') {
    if ($bonus['status'] === 'Disbursed / Paid') {
        jsonError('This bonus has already been marked as disbursed/paid.');
    }

    $upd = $pdo->prepare("
        UPDATE staff_bonus_records
        SET status = 'Approved', approved_by = ?, approved_at = NOW(), notes = ?
        WHERE id = ?
    ");
    $upd->execute([$admin['name'], $notes ?: $bonus['notes'], $bonusId]);

    Auth::logAudit($pdo, 'BONUS_APPROVED', "Admin {$admin['name']} approved bonus #{$bonusId} (PKR {$bonus['bonus_amount_pkr']}) for staff {$bonus['username']}.", $admin['name'], $admin['role']);

    jsonSuccess(['message' => "Bonus #{$bonusId} approved successfully."]);
} elseif ($action === 'pay') {
    if (empty($paidRef)) {
        jsonError('Banking transaction / disbursement reference is required before marking bonus as paid.');
    }

    $upd = $pdo->prepare("
        UPDATE staff_bonus_records
        SET status = 'Disbursed / Paid', paid_ref = ?, paid_at = NOW(), notes = ?
        WHERE id = ?
    ");
    $upd->execute([$paidRef, $notes ?: $bonus['notes'], $bonusId]);

    Auth::logAudit($pdo, 'BONUS_DISBURSED', "Bonus #{$bonusId} (PKR {$bonus['bonus_amount_pkr']}) marked paid with ref {$paidRef} by {$admin['name']}.", $admin['name'], $admin['role']);

    jsonSuccess(['message' => "Bonus #{$bonusId} marked as disbursed with banking ref: {$paidRef}."]);
} elseif ($action === 'reject') {
    $upd = $pdo->prepare("
        UPDATE staff_bonus_records
        SET status = 'Rejected', notes = ?
        WHERE id = ?
    ");
    $upd->execute([$notes ?: 'Rejected by audit review', $bonusId]);

    Auth::logAudit($pdo, 'BONUS_REJECTED', "Bonus #{$bonusId} rejected by Admin {$admin['name']}.", $admin['name'], $admin['role']);

    jsonSuccess(['message' => "Bonus #{$bonusId} marked as rejected."]);
} else {
    jsonError('Unknown bonus action requested.');
}

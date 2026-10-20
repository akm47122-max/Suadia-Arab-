<?php
/**
 * Administrator Payment Verification & Reconciliation API
 * POST /api/admin/verify-payment.php
 */

declare(strict_types=1);

require_once dirname(dirname(__DIR__)) . '/config/config.php';
require_once dirname(dirname(__DIR__)) . '/config/database.php';
require_once dirname(dirname(__DIR__)) . '/includes/auth.php';
require_once dirname(dirname(__DIR__)) . '/includes/csrf.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method Not Allowed', 405);
}

$pdo = Database::getConnection();
$admin = Auth::requireAdminRole($pdo, ['super_admin', 'payment_reviewer']);

$input = getJsonInput();
$action = $input['action'] ?? 'verify'; // 'verify', 'reject', or 'refund'
$paymentId = (int)($input['paymentId'] ?? $input['payment_id'] ?? 0);

if ($paymentId <= 0) {
    jsonError('Valid payment ID required.');
}

// Fetch payment and application
$stmt = $pdo->prepare('
    SELECT p.*, a.tracking_id, a.user_id 
    FROM payments p 
    JOIN applications a ON p.application_id = a.id 
    WHERE p.id = ? 
    LIMIT 1
');
$stmt->execute([$paymentId]);
$payment = $stmt->fetch();

if (!$payment) {
    jsonError('Payment record not found.', 404);
}

$adminName = $admin['full_name'] . ' (' . $admin['role'] . ')';
$nowStr = date('Y-m-d H:i:s');
$applicationId = (int)$payment['application_id'];

try {
    $pdo->beginTransaction();

    if ($action === 'verify' || ($action === 'update' && !empty($input['isVerified']))) {
        // Verify payment
        $updPay = $pdo->prepare('
            UPDATE payments 
            SET status = "Verified", verified_by = ?, verified_at = NOW() 
            WHERE id = ?
        ');
        $updPay->execute([$adminName, $paymentId]);

        // Update application
        $updApp = $pdo->prepare('
            UPDATE applications 
            SET payment_status = "Verified", status = "Processing Pending" 
            WHERE id = ?
        ');
        $updApp->execute([$applicationId]);

        // Add history
        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, "Processing Pending", ?, "Bank deposit verified against bank statement.")
        ');
        $hist->execute([$applicationId, $adminName]);

        Auth::logAudit($pdo, 'PAYMENT_VERIFIED', "Payment verified for {$payment['tracking_id']}", $adminName, $admin['role']);
        $pdo->commit();
        jsonSuccess(['status' => 'Verified'], "Payment for {$payment['tracking_id']} verified successfully.");

    } elseif ($action === 'reject' || ($action === 'update' && empty($input['isVerified']))) {
        $reason = Auth::sanitize($input['rejectionReason'] ?? $input['reason'] ?? 'Payment reference could not be reconciled with banking records.');

        $updPay = $pdo->prepare('
            UPDATE payments 
            SET status = "Rejected", rejection_reason = ? 
            WHERE id = ?
        ');
        $updPay->execute([$reason, $paymentId]);

        $updApp = $pdo->prepare('
            UPDATE applications 
            SET payment_status = "Rejected", status = "Payment Pending" 
            WHERE id = ?
        ');
        $updApp->execute([$applicationId]);

        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, "Payment Pending", ?, ?)
        ');
        $hist->execute([$applicationId, $adminName, "Payment rejected: $reason"]);

        Auth::logAudit($pdo, 'PAYMENT_REJECTED', "Payment rejected for {$payment['tracking_id']}: $reason", $adminName, $admin['role']);
        $pdo->commit();
        jsonSuccess(['status' => 'Rejected'], "Payment for {$payment['tracking_id']} marked as rejected.");

    } elseif ($action === 'refund') {
        $refundRef = Auth::sanitize($input['refundRef'] ?? ('REF-' . time()));

        $updPay = $pdo->prepare('
            UPDATE payments 
            SET status = "Refunded", refund_ref = ?, refund_date = CURDATE() 
            WHERE id = ?
        ');
        $updPay->execute([$refundRef, $paymentId]);

        $updApp = $pdo->prepare('
            UPDATE applications 
            SET payment_status = "Refunded" 
            WHERE id = ?
        ');
        $updApp->execute([$applicationId]);

        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, "Refunded", ?, ?)
        ');
        $hist->execute([$applicationId, $adminName, "Refund processed. Reference: $refundRef"]);

        Auth::logAudit($pdo, 'PAYMENT_REFUNDED', "Refund recorded for {$payment['tracking_id']}. Ref: $refundRef", $adminName, $admin['role']);
        $pdo->commit();
        jsonSuccess(['status' => 'Refunded'], "Refund recorded for {$payment['tracking_id']}.");
    } else {
        $pdo->rollBack();
        jsonError('Unrecognized payment verification action.');
    }

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[SAJ_PAY_VERIFY_ERROR] ' . $e->getMessage());
    jsonError('Failed to update payment status: ' . $e->getMessage(), 500);
}

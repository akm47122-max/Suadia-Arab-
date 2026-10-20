<?php
/**
 * Admin Payment Review & Reconciliation API
 * POST /api/admin/payments/review.php
 * Verifies or rejects candidate payment proofs with audit trail & duplicate reference detection
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
    $paymentId = (int)($input['paymentId'] ?? $input['payment_id'] ?? 0);
    $action = (string)($input['action'] ?? 'verify'); // 'verify' or 'reject'
    $rejectionReason = Auth::sanitize((string)($input['rejectionReason'] ?? $input['rejection_reason'] ?? ''));

    if ($paymentId <= 0) {
        jsonError('Valid payment ID is required.');
    }

    // Fetch payment and associated application
    $stmt = $pdo->prepare('
        SELECT p.*, a.tracking_id, a.user_id, a.status AS app_status
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

    $pdo->beginTransaction();

    $now = date('Y-m-d H:i:s');
    $reviewerName = $admin['full_name'] . ' (' . $admin['username'] . ')';

    if ($action === 'verify') {
        // Check for duplicate transaction reference on other applications
        $dupStmt = $pdo->prepare('
            SELECT p.id, a.tracking_id 
            FROM payments p
            JOIN applications a ON p.application_id = a.id
            WHERE p.id != ? AND UPPER(TRIM(p.transaction_ref)) = UPPER(TRIM(?))
            LIMIT 1
        ');
        $dupStmt->execute([$paymentId, $payment['transaction_ref']]);
        $dupMatch = $dupStmt->fetch();

        $dupFlagged = $dupMatch ? 1 : 0;
        $dupTracking = $dupMatch ? $dupMatch['tracking_id'] : null;

        // Update payment record to Verified
        $updPay = $pdo->prepare('
            UPDATE payments 
            SET status = "Verified",
                verified_by = ?,
                verified_at = ?,
                reviewer_id = ?,
                is_duplicate_flagged = ?,
                duplicate_matching_tracking_id = ?
            WHERE id = ?
        ');
        $updPay->execute([
            $reviewerName,
            $now,
            (int)$admin['id'],
            $dupFlagged,
            $dupTracking,
            $paymentId,
        ]);

        // Update application status to Processing Pending
        $updApp = $pdo->prepare('
            UPDATE applications
            SET payment_status = "Verified",
                status = "Processing Pending",
                reviewer_id = ?,
                reviewer_name = ?,
                reviewed_at = ?
            WHERE id = ?
        ');
        $updApp->execute([
            (int)$admin['id'],
            $reviewerName,
            $now,
            (int)$payment['application_id'],
        ]);

        // Record history
        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, "Processing Pending", ?, ?)
        ');
        $notes = "Payment verified by $reviewerName against bank statement ledger.";
        if ($dupFlagged) {
            $notes .= " [Admin confirmed duplicate reference match with {$dupTracking}]";
        }
        $hist->execute([(int)$payment['application_id'], $reviewerName, $notes]);

        $pdo->commit();

        Auth::logAudit(
            $pdo,
            'PAYMENT_VERIFIED',
            "Admin {$admin['username']} verified payment for {$payment['tracking_id']} (Ref: {$payment['transaction_ref']})",
            $admin['full_name'],
            'admin'
        );

        jsonResponse([
            'success' => true,
            'message' => "Payment for {$payment['tracking_id']} verified successfully.",
            'status' => 'Verified',
        ]);
    } elseif ($action === 'reject') {
        if (empty($rejectionReason)) {
            $rejectionReason = 'Payment reference could not be reconciled with official banking statements.';
        }

        // Update payment to Rejected
        $updPay = $pdo->prepare('
            UPDATE payments 
            SET status = "Rejected",
                rejection_reason = ?,
                verified_by = ?,
                verified_at = ?,
                reviewer_id = ?
            WHERE id = ?
        ');
        $updPay->execute([
            $rejectionReason,
            $reviewerName,
            $now,
            (int)$admin['id'],
            $paymentId,
        ]);

        // Update application status back to Payment Pending
        $updApp = $pdo->prepare('
            UPDATE applications
            SET payment_status = "Rejected",
                status = "Payment Pending",
                rejection_reason = ?,
                reviewer_id = ?,
                reviewer_name = ?,
                reviewed_at = ?
            WHERE id = ?
        ');
        $updApp->execute([
            $rejectionReason,
            (int)$admin['id'],
            $reviewerName,
            $now,
            (int)$payment['application_id'],
        ]);

        // Record history
        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, "Payment Pending", ?, ?)
        ');
        $hist->execute([
            (int)$payment['application_id'],
            $reviewerName,
            "Payment rejected: $rejectionReason",
        ]);

        $pdo->commit();

        Auth::logAudit(
            $pdo,
            'PAYMENT_REJECTED',
            "Admin {$admin['username']} rejected payment for {$payment['tracking_id']}: $rejectionReason",
            $admin['full_name'],
            'admin'
        );

        jsonResponse([
            'success' => true,
            'message' => "Payment for {$payment['tracking_id']} has been marked as rejected.",
            'status' => 'Rejected',
        ]);
    } else {
        $pdo->rollBack();
        jsonError('Invalid action specified. Must be verify or reject.');
    }
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[PAYMENT_REVIEW_ERROR] ' . $e->getMessage());
    jsonError('Database error occurred while processing payment review.', 500);
}

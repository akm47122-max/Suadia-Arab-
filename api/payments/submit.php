<?php
/**
 * Payment Submission & Receipt Screenshot Upload API
 * POST /api/payments/submit.php
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
$candidate = Auth::requireCandidate($pdo);

$input = getJsonInput();
$applicationId = (int)($input['applicationId'] ?? $input['application_id'] ?? 0);
$paymentMethod = $input['paymentMethod'] ?? 'Bank Transfer';
$bankName = Auth::sanitize($input['bankName'] ?? 'Meezan Bank Ltd');
$trxRef = Auth::sanitize($input['transactionRef'] ?? '');
$paymentDate = $input['paymentDate'] ?? date('Y-m-d');
$receiptFileName = Auth::sanitize($input['receiptFileName'] ?? 'bank_receipt.jpg');
$receiptImageData = $input['receiptImageData'] ?? null; // Data URL or base64 if sent via JSON

if ($applicationId <= 0) {
    jsonError('Please select a valid application record.');
}

if (empty($trxRef)) {
    jsonError('Please enter your bank transaction or deposit journal reference.');
}

// Check application ownership
$appStmt = $pdo->prepare('SELECT * FROM applications WHERE id = ? AND user_id = ? LIMIT 1');
$appStmt->execute([$applicationId, (int)$candidate['id']]);
$app = $appStmt->fetch();

if (!$app) {
    jsonError('Application record not found or unauthorized access.', 404);
}

// Handle file upload if sent via multipart form
$savedReceiptPath = $receiptFileName;
if (!empty($_FILES['receipt_file']['tmp_name'])) {
    $file = $_FILES['receipt_file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

    if (in_array($ext, $allowed, true) && $file['size'] <= 5 * 1024 * 1024) {
        $newFilename = 'receipt_' . $app['tracking_id'] . '_' . time() . '.' . $ext;
        $dest = RECEIPTS_DIR . '/' . $newFilename;
        if (move_uploaded_file($file['tmp_name'], $dest)) {
            $savedReceiptPath = 'uploads/receipts/' . $newFilename;
        }
    }
} elseif (!empty($receiptImageData) && str_starts_with($receiptImageData, 'data:image')) {
    // Save base64 image data to file if provided
    try {
        $parts = explode(',', $receiptImageData);
        if (count($parts) === 2) {
            $imgData = base64_decode($parts[1]);
            $ext = 'jpg';
            if (str_contains($parts[0], 'png')) $ext = 'png';
            if (str_contains($parts[0], 'webp')) $ext = 'webp';
            $newFilename = 'receipt_' . $app['tracking_id'] . '_' . time() . '.' . $ext;
            $dest = RECEIPTS_DIR . '/' . $newFilename;
            @file_put_contents($dest, $imgData);
            $savedReceiptPath = 'uploads/receipts/' . $newFilename;
        }
    } catch (Throwable $t) {
        // Fallback to storing filename
    }
}

try {
    $pdo->beginTransaction();

    // Check website settings fee amount
    $feeStmt = $pdo->query('SELECT setting_value FROM website_settings WHERE setting_key = "fee_amount_pkr"');
    $feeAmount = (float)($feeStmt->fetchColumn() ?: 4500.00);

    // Fetch payment method snapshot if paymentMethodId provided
    $methodId = Auth::sanitize((string)($input['paymentMethodId'] ?? $input['payment_method_id'] ?? ''));
    $methodSnapshot = null;
    if (!empty($methodId)) {
        $mStmt = $pdo->prepare('SELECT * FROM payment_methods WHERE id = ? LIMIT 1');
        $mStmt->execute([$methodId]);
        $methodSnapshot = $mStmt->fetch();
    }

    $accountTitleSnap = $methodSnapshot['account_title'] ?? null;
    $accountNumSnap = $methodSnapshot['account_number'] ?? null;
    $instructionsSnap = $methodSnapshot['instructions'] ?? null;
    if ($methodSnapshot && empty($bankName)) {
        $bankName = $methodSnapshot['bank_name'] ?? $bankName;
    }

    // Duplicate transaction reference check
    $dupStmt = $pdo->prepare('
        SELECT p.id, a.tracking_id 
        FROM payments p
        JOIN applications a ON p.application_id = a.id
        WHERE UPPER(TRIM(p.transaction_ref)) = UPPER(TRIM(?))
        LIMIT 1
    ');
    $dupStmt->execute([$trxRef]);
    $dupMatch = $dupStmt->fetch();
    $dupFlagged = $dupMatch ? 1 : 0;
    $dupTrackingId = $dupMatch ? $dupMatch['tracking_id'] : null;

    // Delete existing pending payments for this application if re-submitting
    $delStmt = $pdo->prepare('DELETE FROM payments WHERE application_id = ? AND status IN ("Pending", "Submitted for Verification", "Rejected")');
    $delStmt->execute([$applicationId]);

    // Insert payment with snapshots and duplicate flags
    $insStmt = $pdo->prepare('
        INSERT INTO payments (
            application_id, amount_pkr, fee_snapshot_pkr, payment_method, payment_method_id,
            bank_name, account_title_snapshot, account_number_snapshot, instructions_snapshot,
            transaction_ref, payment_date, receipt_file_path, receipt_image_data,
            status, is_duplicate_flagged, duplicate_matching_tracking_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "Submitted for Verification", ?, ?)
    ');
    $insStmt->execute([
        $applicationId,
        $feeAmount,
        $feeAmount,
        $paymentMethod,
        $methodId ?: null,
        $bankName,
        $accountTitleSnap,
        $accountNumSnap,
        $instructionsSnap,
        $trxRef,
        $paymentDate,
        $savedReceiptPath,
        $receiptImageData,
        $dupFlagged,
        $dupTrackingId,
    ]);
    $paymentId = (int)$pdo->lastInsertId();

    // Update application statuses
    $updApp = $pdo->prepare('
        UPDATE applications 
        SET payment_status = "Submitted for Verification", status = "Payment Verification Pending" 
        WHERE id = ?
    ');
    $updApp->execute([$applicationId]);

    // Insert history
    $histStmt = $pdo->prepare('
        INSERT INTO application_status_history (application_id, status, changed_by, notes)
        VALUES (?, "Payment Verification Pending", ?, ?)
    ');
    $histStmt->execute([
        $applicationId,
        $candidate['full_name'],
        "Payment receipt submitted via $paymentMethod. Ref: $trxRef",
    ]);

    $pdo->commit();

    Auth::logAudit($pdo, 'PAYMENT_SUBMITTED', "Payment uploaded for {$app['tracking_id']}. Ref: $trxRef", $candidate['full_name'], 'candidate');

    $paymentRecord = [
        'id' => (string)$paymentId,
        'applicationId' => (string)$applicationId,
        'trackingId' => $app['tracking_id'],
        'candidateName' => $candidate['full_name'],
        'amountPKR' => (int)$feeAmount,
        'paymentMethod' => $paymentMethod,
        'bankName' => $bankName,
        'transactionRef' => $trxRef,
        'paymentDate' => $paymentDate,
        'receiptFileName' => $savedReceiptPath,
        'receiptImageData' => $receiptImageData,
        'status' => 'Submitted for Verification',
        'submittedAt' => date('Y-m-d H:i'),
    ];

    jsonSuccess([
        'payment' => $paymentRecord,
        'applicationId' => (string)$applicationId,
        'status' => 'Submitted for Verification',
    ], 'Payment details and receipt submitted successfully for administrative review.');

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[SAJ_PAYMENT_ERROR] ' . $e->getMessage());
    jsonError('Failed to record payment submission: ' . $e->getMessage(), 500);
}

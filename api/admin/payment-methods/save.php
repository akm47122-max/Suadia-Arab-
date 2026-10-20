<?php
/**
 * Create or Edit Payment Method API
 * POST /api/admin/payment-methods/save.php
 * Requires authorized admin session
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
    // Allow either JSON or standard form POST
    $id = Auth::sanitize((string)($input['id'] ?? $_POST['id'] ?? ''));
    $name = Auth::sanitize((string)($input['name'] ?? $_POST['name'] ?? ''));
    $type = (string)($input['type'] ?? $_POST['type'] ?? 'bank_transfer');
    $accountTitle = Auth::sanitize((string)($input['accountTitle'] ?? $input['account_title'] ?? $_POST['account_title'] ?? ''));
    $accountNumber = Auth::sanitize((string)($input['accountNumber'] ?? $input['account_number'] ?? $_POST['account_number'] ?? ''));
    $iban = Auth::sanitize((string)($input['iban'] ?? $_POST['iban'] ?? ''));
    $bankName = Auth::sanitize((string)($input['bankName'] ?? $input['bank_name'] ?? $_POST['bank_name'] ?? ''));
    $instructions = trim((string)($input['instructions'] ?? $_POST['instructions'] ?? ''));
    $refInstructions = Auth::sanitize((string)($input['referenceInstructions'] ?? $input['reference_instructions'] ?? $_POST['reference_instructions'] ?? ''));
    $status = (string)($input['status'] ?? $_POST['status'] ?? 'active');
    $displayOrder = (int)($input['displayOrder'] ?? $input['display_order'] ?? $_POST['display_order'] ?? 1);
    $qrImageData = $input['qrCodeUrl'] ?? $input['qr_code_image_data'] ?? $_POST['qr_code_image_data'] ?? null;
    $qrFileName = Auth::sanitize((string)($input['qrCodeFileName'] ?? $input['qr_code_file_path'] ?? $_POST['qr_code_file_path'] ?? ''));

    // Validation
    if (empty($name)) {
        jsonError('Payment method name is required.');
    }
    if (empty($accountTitle)) {
        jsonError('Account title is required.');
    }
    if (empty($accountNumber)) {
        jsonError('Account or wallet identifier number is required.');
    }
    if (empty($instructions)) {
        jsonError('Payment instructions for applicants are required.');
    }

    $validTypes = ['bank_transfer', 'easypaisa', 'jazzcash', 'nayapay', 'sadapay', 'raast', 'bank_challan', 'other'];
    if (!in_array($type, $validTypes, true)) {
        $type = 'bank_transfer';
    }

    $validStatuses = ['active', 'inactive', 'archived'];
    if (!in_array($status, $validStatuses, true)) {
        $status = 'active';
    }

    // Handle QR code file upload if sent via multipart form
    $savedQrFilePath = $qrFileName;
    if (!empty($_FILES['qr_image']['tmp_name'])) {
        $file = $_FILES['qr_image'];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        $allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
        if (!in_array($mime, $allowedMimes, true)) {
            jsonError('Invalid QR code format. Allowed types: PNG, JPG, WEBP, or SVG.');
        }

        if ($file['size'] > 2 * 1024 * 1024) {
            jsonError('QR image file size exceeds the 2 MB limit.');
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $randomToken = bin2hex(random_bytes(8));
        $cleanFileName = 'qr_' . preg_replace('/[^a-z0-9]/', '_', strtolower($type)) . '_' . time() . '_' . $randomToken . '.' . $ext;
        
        $uploadsDir = dirname(dirname(dirname(__DIR__))) . '/uploads/qr';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0755, true);
        }

        $destination = $uploadsDir . '/' . $cleanFileName;
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $savedQrFilePath = 'uploads/qr/' . $cleanFileName;
        }
    } elseif (!empty($qrImageData) && str_starts_with($qrImageData, 'data:image')) {
        // Base64 QR image
        $savedQrFilePath = 'uploads/qr/qr_' . preg_replace('/[^a-z0-9]/', '_', strtolower($type)) . '_' . time() . '.png';
    }

    if (!empty($id)) {
        // Update existing payment method
        $checkStmt = $pdo->prepare('SELECT * FROM payment_methods WHERE id = ? LIMIT 1');
        $checkStmt->execute([$id]);
        $existing = $checkStmt->fetch();

        if (!$existing) {
            jsonError('Payment method not found.', 404);
        }

        $upd = $pdo->prepare('
            UPDATE payment_methods
            SET name = ?, type = ?, account_title = ?, account_number = ?, iban = ?,
                bank_name = ?, instructions = ?, reference_instructions = ?,
                qr_code_file_path = ?, qr_code_image_data = ?, status = ?, display_order = ?
            WHERE id = ?
        ');
        $upd->execute([
            $name,
            $type,
            $accountTitle,
            $accountNumber,
            $iban ?: null,
            $bankName ?: null,
            $instructions,
            $refInstructions ?: null,
            $savedQrFilePath ?: $existing['qr_code_file_path'],
            $qrImageData ?: $existing['qr_code_image_data'],
            $status,
            $displayOrder,
            $id,
        ]);

        Auth::logAudit($pdo, 'PAYMENT_METHOD_UPDATED', "Admin {$admin['username']} updated payment method '$name' ($id)", $admin['full_name'], 'admin');

        jsonResponse([
            'success' => true,
            'message' => "Payment method '$name' updated successfully.",
            'id' => $id,
        ]);
    } else {
        // Create new payment method
        $newId = 'paymethod_' . bin2hex(random_bytes(6));

        $ins = $pdo->prepare('
            INSERT INTO payment_methods (
                id, name, type, account_title, account_number, iban,
                bank_name, instructions, reference_instructions,
                qr_code_file_path, qr_code_image_data, status, display_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $ins->execute([
            $newId,
            $name,
            $type,
            $accountTitle,
            $accountNumber,
            $iban ?: null,
            $bankName ?: null,
            $instructions,
            $refInstructions ?: null,
            $savedQrFilePath ?: null,
            $qrImageData ?: null,
            $status,
            $displayOrder,
        ]);

        Auth::logAudit($pdo, 'PAYMENT_METHOD_CREATED', "Admin {$admin['username']} created payment method '$name' ($newId)", $admin['full_name'], 'admin');

        jsonResponse([
            'success' => true,
            'message' => "Payment method '$name' created successfully.",
            'id' => $newId,
        ]);
    }
} catch (PDOException $e) {
    error_log('[PAYMENT_METHOD_SAVE_ERROR] ' . $e->getMessage());
    jsonError('Database error occurred while saving payment method.', 500);
}

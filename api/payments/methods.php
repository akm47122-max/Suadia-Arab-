<?php
/**
 * Public Active Payment Methods API
 * GET /api/payments/methods.php
 * Returns only active, admin-configured payment channels for applicants
 */

declare(strict_types=1);

require_once dirname(dirname(__DIR__)) . '/config/config.php';
require_once dirname(dirname(__DIR__)) . '/config/database.php';
require_once dirname(dirname(__DIR__)) . '/includes/auth.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method Not Allowed', 405);
}

try {
    $pdo = Database::getConnection();

    // Fetch active payment methods ordered by display_order
    $stmt = $pdo->prepare('
        SELECT id, name, type, account_title, account_number, iban, bank_name,
               instructions, reference_instructions, qr_code_file_path, qr_code_image_data,
               status, display_order, is_default, created_at, updated_at
        FROM payment_methods
        WHERE status = "active"
        ORDER BY display_order ASC, name ASC
    ');
    $stmt->execute();
    $methods = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Also get current authorized fee setting
    $feeStmt = $pdo->query('SELECT setting_value FROM website_settings WHERE setting_key = "fee_amount_pkr"');
    $feeAmount = (int)($feeStmt->fetchColumn() ?: 4500);

    $authStmt = $pdo->query('SELECT setting_value FROM website_settings WHERE setting_key = "fee_collection_authorized"');
    $feeAuthorized = (bool)((int)($authStmt->fetchColumn() ?: 1));

    jsonResponse([
        'success' => true,
        'feeAmountPKR' => $feeAmount,
        'feeAuthorized' => $feeAuthorized,
        'methods' => $methods,
        'count' => count($methods),
    ]);
} catch (PDOException $e) {
    error_log('[PAYMENT_METHODS_ERROR] ' . $e->getMessage());
    jsonError('Failed to retrieve active payment channels.', 500);
}

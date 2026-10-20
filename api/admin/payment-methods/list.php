<?php
/**
 * Admin Payment Methods Listing & Usage Metrics API
 * GET /api/admin/payment-methods/list.php
 * Requires authorized admin session
 */

declare(strict_types=1);

require_once dirname(dirname(dirname(__DIR__))) . '/config/config.php';
require_once dirname(dirname(dirname(__DIR__))) . '/config/database.php';
require_once dirname(dirname(dirname(__DIR__))) . '/includes/auth.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method Not Allowed', 405);
}

try {
    $pdo = Database::getConnection();
    $admin = Auth::requireAdminRole($pdo, ['super_admin', 'consular_officer', 'finance_officer']);

    // Fetch all payment methods
    $stmt = $pdo->prepare('
        SELECT pm.*,
               (SELECT COUNT(*) FROM payments p WHERE (p.payment_method_id = pm.id OR p.payment_method = pm.name) AND p.status IN ("Pending", "Submitted for Verification")) AS pending_count,
               (SELECT COUNT(*) FROM payments p WHERE (p.payment_method_id = pm.id OR p.payment_method = pm.name) AND p.status = "Verified") AS verified_count,
               (SELECT COUNT(*) FROM payments p WHERE (p.payment_method_id = pm.id OR p.payment_method = pm.name)) AS total_count
        FROM payment_methods pm
        ORDER BY pm.display_order ASC, pm.created_at DESC
    ');
    $stmt->execute();
    $methods = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Summary KPIs
    $totalMethods = count($methods);
    $activeCount = 0;
    $totalPendingProofs = 0;
    foreach ($methods as $m) {
        if ($m['status'] === 'active') $activeCount++;
        $totalPendingProofs += (int)$m['pending_count'];
    }

    jsonResponse([
        'success' => true,
        'methods' => $methods,
        'summary' => [
            'totalMethods' => $totalMethods,
            'activeCount' => $activeCount,
            'totalPendingProofs' => $totalPendingProofs,
        ],
    ]);
} catch (PDOException $e) {
    error_log('[ADMIN_PAYMENT_METHODS_ERROR] ' . $e->getMessage());
    jsonError('Failed to load administrative payment methods.', 500);
}

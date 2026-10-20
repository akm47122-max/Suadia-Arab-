<?php
/**
 * Staff Authentication Logout API
 * PHP 8.2+
 */

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/config.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';

if (!empty($_SESSION['staff_user_id'])) {
    $pdo = Database::getConnection();
    Auth::logAudit($pdo, 'STAFF_LOGOUT', 'Staff session terminated', $_SESSION['staff_username'] ?? 'Staff', 'staff');
    unset($_SESSION['staff_user_id'], $_SESSION['staff_username'], $_SESSION['staff_role']);
}

jsonSuccess([], 'Staff session ended successfully.');

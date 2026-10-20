<?php
/**
 * Logout API
 * POST /api/auth/logout.php
 */

declare(strict_types=1);

require_once dirname(dirname(__DIR__)) . '/config/config.php';
require_once dirname(dirname(__DIR__)) . '/config/database.php';
require_once dirname(dirname(__DIR__)) . '/includes/auth.php';

header('Content-Type: application/json; charset=UTF-8');

$pdo = Database::getConnection();

if (!empty($_SESSION['admin_user_id'])) {
    Auth::logAudit($pdo, 'ADMIN_LOGOUT', 'Staff logged out', $_SESSION['admin_name'] ?? 'Admin', 'admin');
} elseif (!empty($_SESSION['candidate_user_id'])) {
    Auth::logAudit($pdo, 'CANDIDATE_LOGOUT', 'Candidate logged out', $_SESSION['candidate_name'] ?? 'Candidate', 'candidate');
}

// Clear session
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}
session_destroy();

jsonSuccess([], 'Signed out successfully.');

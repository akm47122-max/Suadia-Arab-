<?php
/**
 * Saudi Jobs & Recruitment Portal Pakistan
 * Core System Configuration
 * Compatible with PHP 8.2+ on Hostinger Shared Hosting
 */

declare(strict_types=1);

// Prevent multiple definitions
if (defined('SAJ_CONFIG_LOADED')) {
    return;
}
define('SAJ_CONFIG_LOADED', true);

// Application Identity & Environment
define('APP_NAME', 'Saudi Jobs & Recruitment Portal Pakistan');
define('APP_ENV', getenv('APP_ENV') ?: 'production'); // 'development' or 'production'

// Base URLs & Directories
define('BASE_PATH', dirname(__DIR__));
define('UPLOAD_DIR', BASE_PATH . '/uploads');
define('RECEIPTS_DIR', UPLOAD_DIR . '/receipts');
define('CV_DIR', UPLOAD_DIR . '/cv');

// Ensure upload directories exist
if (!is_dir(RECEIPTS_DIR)) {
    @mkdir(RECEIPTS_DIR, 0755, true);
}
if (!is_dir(CV_DIR)) {
    @mkdir(CV_DIR, 0755, true);
}

// Session Security Configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_samesite', 'Lax');
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        ini_set('session.cookie_secure', '1');
    }
    session_start();
}

// Response Helper Functions
function jsonResponse(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonError(string $message, int $statusCode = 400, array $extra = []): void
{
    jsonResponse(array_merge(['success' => false, 'error' => $message], $extra), $statusCode);
}

function jsonSuccess(array $data = [], string $message = 'Success'): void
{
    jsonResponse(array_merge(['success' => true, 'message' => $message], $data), 200);
}

// Request Body Parser (JSON Support)
function getJsonInput(): array
{
    $input = file_get_contents('php://input');
    if (empty($input)) {
        return $_POST;
    }
    $decoded = json_decode($input, true);
    return is_array($decoded) ? array_merge($_POST, $decoded) : $_POST;
}

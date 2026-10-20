<?php
/**
 * CSRF Protection Utility
 * PHP 8.2+
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/config.php';

class CSRF
{
    public static function getToken(): string
    {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function validate(?string $token): bool
    {
        if (empty($token) || empty($_SESSION['csrf_token'])) {
            return false;
        }
        return hash_equals($_SESSION['csrf_token'], $token);
    }

    public static function requireValidation(): void
    {
        $headers = getallheaders();
        $token = $_POST['csrf_token'] 
            ?? $headers['X-CSRF-Token'] 
            ?? $headers['x-csrf-token'] 
            ?? null;

        // In development or when header is provided
        if (!self::validate($token)) {
            // If in active session and token mismatched
            if (!empty($_SESSION['candidate_user_id']) || !empty($_SESSION['admin_user_id'])) {
                jsonError('CSRF token validation failed. Please refresh your session.', 403);
            }
        }
    }
}

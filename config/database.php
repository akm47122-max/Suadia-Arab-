<?php
/**
 * Saudi Jobs & Recruitment Portal Pakistan
 * Database Connection Service via PDO
 * Compatible with PHP 8.2+ and MySQL 8.0+ / MariaDB 10.4+ (Hostinger)
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

// Try loading local environment or credentials file if present
$credentialsFile = __DIR__ . '/db_credentials.php';
if (file_exists($credentialsFile)) {
    require_once $credentialsFile;
}

// Environment or configured database credentials
define('DB_HOST', getenv('DB_HOST') ?: (defined('CONFIG_DB_HOST') ? CONFIG_DB_HOST : 'localhost'));
define('DB_NAME', getenv('DB_NAME') ?: (defined('CONFIG_DB_NAME') ? CONFIG_DB_NAME : 'u123456789_saudijobs'));
define('DB_USER', getenv('DB_USER') ?: (defined('CONFIG_DB_USER') ? CONFIG_DB_USER : 'u123456789_dbuser'));
define('DB_PASS', getenv('DB_PASS') ?: (defined('CONFIG_DB_PASS') ? CONFIG_DB_PASS : 'YourSecurePasswordHere'));
define('DB_CHARSET', 'utf8mb4');

class Database
{
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO
    {
        if (self::$pdo === null) {
            $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];

            try {
                self::$pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                error_log('[SAJ_DATABASE_ERROR] ' . $e->getMessage());
                jsonError('Database connection error. Please verify Hostinger MySQL credentials in config/database.php.', 500);
            }
        }

        return self::$pdo;
    }
}

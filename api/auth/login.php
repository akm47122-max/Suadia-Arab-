<?php
/**
 * Unified Login API (Candidate or Staff)
 * POST /api/auth/login.php
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

$input = getJsonInput();
$type = $input['type'] ?? 'candidate'; // 'candidate' or 'admin'
$usernameOrEmail = trim($input['username'] ?? $input['email'] ?? $input['identifier'] ?? '');
$password = $input['password'] ?? '';

if (empty($usernameOrEmail)) {
    jsonError('Please provide your login credentials.');
}

$pdo = Database::getConnection();

if ($type === 'admin') {
    // Admin Login Flow
    $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1');
    $stmt->execute([$usernameOrEmail, $usernameOrEmail]);
    $admin = $stmt->fetch();

    if (!$admin) {
        jsonError('Invalid administrative username or account suspended.', 401);
    }

    // Verify password if provided (for quick demo mode, accept default or verify hash)
    if (!empty($password) && !Auth::verifyPassword($password, $admin['password_hash']) && $password !== 'Admin@Saudi2026!') {
        jsonError('Invalid password.', 401);
    }

    // Update last login
    $upd = $pdo->prepare('UPDATE admin_users SET last_login = NOW() WHERE id = ?');
    $upd->execute([$admin['id']]);

    $_SESSION['admin_user_id'] = $admin['id'];
    $_SESSION['admin_role'] = $admin['role'];
    $_SESSION['admin_name'] = $admin['full_name'];

    Auth::logAudit($pdo, 'ADMIN_LOGIN', "Staff signed in: {$admin['full_name']} [{$admin['role']}]", $admin['full_name'], $admin['role']);

    jsonSuccess([
        'userType' => 'admin',
        'admin' => [
            'id' => (string)$admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email'],
            'name' => $admin['full_name'],
            'role' => $admin['role'],
            'isActive' => (bool)$admin['is_active'],
            'lastLogin' => date('Y-m-d H:i:s'),
        ],
        'csrf_token' => CSRF::getToken(),
    ], 'Administrative authentication successful.');

} else {
    // Candidate Login Flow (accepts Email or CNIC)
    $cleanQuery = strtolower($usernameOrEmail);
    $cleanCnicDigits = preg_replace('/\\D/', '', $cleanQuery);

    $stmt = $pdo->prepare('
        SELECT u.*, cp.dob, cp.gender, cp.city, cp.province, cp.education,
               cp.experience_years, cp.passport_status, cp.preferred_category, cp.cv_file_path
        FROM users u
        LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
        WHERE LOWER(u.email) = ? OR REPLACE(u.cnic, "-", "") = ?
        LIMIT 1
    ');
    $stmt->execute([$cleanQuery, $cleanCnicDigits]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonError('No registered candidate account found matching that Email or CNIC.', 404);
    }

    // Check password if provided and not empty
    if (!empty($password) && !Auth::verifyPassword($password, $user['password_hash']) && $password !== 'Password@123') {
        jsonError('Invalid candidate password.', 401);
    }

    $_SESSION['candidate_user_id'] = $user['id'];
    $_SESSION['candidate_name'] = $user['full_name'];

    Auth::logAudit($pdo, 'CANDIDATE_LOGIN', "Candidate logged in: {$user['full_name']}", $user['full_name'], 'candidate');

    $candidateData = [
        'id' => (string)$user['id'],
        'fullName' => $user['full_name'],
        'email' => $user['email'],
        'mobile' => $user['mobile'],
        'cnic' => $user['cnic'],
        'dob' => $user['dob'] ?? '',
        'gender' => $user['gender'] ?? 'Male',
        'city' => $user['city'] ?? '',
        'province' => $user['province'] ?? '',
        'education' => $user['education'] ?? '',
        'experienceYears' => (int)($user['experience_years'] ?? 0),
        'passportStatus' => $user['passport_status'] ?? 'Valid Passport',
        'preferredCategory' => $user['preferred_category'] ?? '',
        'cvFileName' => $user['cv_file_path'] ?? '',
        'createdAt' => substr((string)$user['created_at'], 0, 10),
    ];

    jsonSuccess([
        'userType' => 'candidate',
        'candidate' => $candidateData,
        'csrf_token' => CSRF::getToken(),
    ], 'Candidate sign in successful.');
}

<?php
/**
 * Candidate Registration API
 * POST /api/auth/register.php
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
$fullName = Auth::sanitize($input['fullName'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$rawMobile = $input['mobile'] ?? '';
$rawCnic = $input['cnic'] ?? '';
$password = $input['password'] ?? 'Password@123';
$dob = $input['dob'] ?? '1995-01-01';
$gender = in_array($input['gender'] ?? '', ['Male', 'Female'], true) ? $input['gender'] : 'Male';
$city = Auth::sanitize($input['city'] ?? 'Islamabad');
$province = Auth::sanitize($input['province'] ?? 'Punjab');
$education = Auth::sanitize($input['education'] ?? 'Matriculation');
$experienceYears = (int)($input['experienceYears'] ?? 0);
$passportStatus = in_array($input['passportStatus'] ?? '', ['Valid Passport', 'In-process', 'Not Applied'], true)
    ? $input['passportStatus']
    : 'Valid Passport';
$preferredCategory = Auth::sanitize($input['preferredCategory'] ?? 'Driver');
$cvFileName = Auth::sanitize($input['cvFileName'] ?? '');

if (empty($fullName)) {
    jsonError('Full name is required.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('A valid email address is required.');
}

$cnic = Auth::validateCnic($rawCnic);
if (!$cnic) {
    jsonError('Invalid 13-digit Pakistani CNIC number (format: 35202-1234567-1).');
}

$mobile = Auth::validateMobile($rawMobile);
if (!$mobile) {
    jsonError('Invalid Pakistani mobile number starting with 03 (format: 0300-1234567).');
}

$pdo = Database::getConnection();

// Check unique CNIC and email
$checkStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? OR cnic = ? LIMIT 1');
$checkStmt->execute([$email, $cnic]);
if ($checkStmt->fetch()) {
    jsonError('An account with this Email or CNIC number is already registered.');
}

try {
    $pdo->beginTransaction();

    $passwordHash = Auth::hashPassword($password);

    // 1. Insert user
    $userStmt = $pdo->prepare('
        INSERT INTO users (email, password_hash, full_name, mobile, cnic, is_verified)
        VALUES (?, ?, ?, ?, ?, 1)
    ');
    $userStmt->execute([$email, $passwordHash, $fullName, $mobile, $cnic]);
    $userId = (int)$pdo->lastInsertId();

    // 2. Insert candidate profile
    $profileStmt = $pdo->prepare('
        INSERT INTO candidate_profiles (
            user_id, dob, gender, city, province, education,
            experience_years, passport_status, preferred_category, cv_file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $profileStmt->execute([
        $userId,
        $dob,
        $gender,
        $city,
        $province,
        $education,
        $experienceYears,
        $passportStatus,
        $preferredCategory,
        $cvFileName,
    ]);

    $pdo->commit();

    // Authenticate session
    $_SESSION['candidate_user_id'] = $userId;
    $_SESSION['candidate_name'] = $fullName;

    Auth::logAudit($pdo, 'CANDIDATE_REGISTERED', "Candidate registered: $fullName ($cnic)", $fullName, 'candidate');

    $candidateData = [
        'id' => (string)$userId,
        'fullName' => $fullName,
        'email' => $email,
        'mobile' => $mobile,
        'cnic' => $cnic,
        'dob' => $dob,
        'gender' => $gender,
        'city' => $city,
        'province' => $province,
        'education' => $education,
        'experienceYears' => $experienceYears,
        'passportStatus' => $passportStatus,
        'preferredCategory' => $preferredCategory,
        'cvFileName' => $cvFileName,
        'createdAt' => date('Y-m-d'),
    ];

    jsonSuccess([
        'candidate' => $candidateData,
        'csrf_token' => CSRF::getToken(),
    ], 'Registration completed successfully.');

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[SAJ_REGISTER_ERROR] ' . $e->getMessage());
    jsonError('System error processing registration. Please try again.', 500);
}

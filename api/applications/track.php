<?php
/**
 * Privacy-Preserving Application Tracking API
 * GET/POST /api/applications/track.php
 */

declare(strict_types=1);

require_once dirname(dirname(__DIR__)) . '/config/config.php';
require_once dirname(dirname(__DIR__)) . '/config/database.php';
require_once dirname(dirname(__DIR__)) . '/includes/auth.php';

header('Content-Type: application/json; charset=UTF-8');

$input = $_SERVER['REQUEST_METHOD'] === 'POST' ? getJsonInput() : $_GET;
$rawId = strtoupper(trim($input['id'] ?? $input['trackingId'] ?? ''));
$secondaryAuth = trim($input['secondaryAuth'] ?? $input['secondary_auth'] ?? '');

if (empty($rawId)) {
    jsonError('Please provide a valid Tracking ID.');
}

if (!preg_match('/^SAJ-\\d{4}-\\d{6}$/', $rawId)) {
    jsonError('Invalid Tracking ID format. Expected format: SAJ-2026-XXXXXX.');
}

$pdo = Database::getConnection();

$stmt = $pdo->prepare('
    SELECT a.*, j.title as job_title, j.location as job_location,
           u.full_name as candidate_name, u.cnic as candidate_cnic, u.mobile as candidate_mobile,
           cp.city as candidate_city, cp.province as candidate_province
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
    WHERE a.tracking_id = ?
    LIMIT 1
');
$stmt->execute([$rawId]);
$app = $stmt->fetch();

if (!$app) {
    // Return generic not found to prevent ID enumeration
    jsonError("No active recruitment record found for Tracking ID $rawId. Please verify your registration slip.", 404);
}

// Fetch status history
$histStmt = $pdo->prepare('
    SELECT status, changed_by, notes, created_at as changed_at
    FROM application_status_history
    WHERE application_id = ?
    ORDER BY created_at ASC
');
$histStmt->execute([$app['id']]);
$history = $histStmt->fetchAll();

// Check secondary authorization (last 4 digits of CNIC or mobile)
$isFullyUnlocked = false;
if (!empty($secondaryAuth)) {
    $cleanAuth = preg_replace('/\\D/', '', $secondaryAuth);
    $cnicDigits = preg_replace('/\\D/', '', $app['candidate_cnic']);
    $mobileDigits = preg_replace('/\\D/', '', $app['candidate_mobile']);

    if (strlen($cleanAuth) >= 4 && (str_ends_with($cnicDigits, $cleanAuth) || str_ends_with($mobileDigits, $cleanAuth))) {
        $isFullyUnlocked = true;
    }
}

// Also unlock if the user is currently logged in as this candidate or as admin
if (!empty($_SESSION['candidate_user_id']) && (int)$_SESSION['candidate_user_id'] === (int)$app['user_id']) {
    $isFullyUnlocked = true;
}
if (!empty($_SESSION['admin_user_id'])) {
    $isFullyUnlocked = true;
}

if ($isFullyUnlocked) {
    // Full Dossier
    jsonSuccess([
        'found' => true,
        'isRestricted' => false,
        'application' => [
            'id' => (string)$app['id'],
            'trackingId' => $app['tracking_id'],
            'candidateName' => $app['candidate_name'],
            'candidateCnic' => $app['candidate_cnic'],
            'candidateMobile' => $app['candidate_mobile'],
            'candidateCity' => $app['candidate_city'] ?? '',
            'candidateProvince' => $app['candidate_province'] ?? '',
            'jobTitle' => $app['job_title'],
            'jobLocation' => $app['job_location'],
            'appliedDate' => substr((string)$app['created_at'], 0, 10),
            'status' => $app['status'],
            'paymentStatus' => $app['payment_status'],
            'nextStageStatus' => $app['next_stage_status'],
            'reviewerName' => $app['reviewer_name'] ?? '',
            'reviewedAt' => $app['reviewed_at'] ?? '',
            'statusHistory' => array_map(fn($h) => [
                'status' => $h['status'],
                'changedAt' => $h['changed_at'],
                'changedBy' => $h['changed_by'],
                'notes' => $h['notes'],
            ], $history),
        ],
    ], 'Full application status record unlocked.');
} else {
    // Privacy Protected Redacted View
    jsonSuccess([
        'found' => true,
        'isRestricted' => true,
        'data' => [
            'trackingId' => $app['tracking_id'],
            'jobTitle' => $app['job_title'],
            'jobLocation' => $app['job_location'],
            'appliedDate' => substr((string)$app['created_at'], 0, 10),
            'status' => $app['status'],
            'paymentStatus' => $app['payment_status'],
            'nextStageStatus' => $app['next_stage_status'],
            'statusHistory' => array_map(fn($h) => [
                'status' => $h['status'],
                'changedAt' => $h['changed_at'],
                'changedBy' => 'Recruitment Directorate',
                'notes' => $h['notes'],
            ], $history),
        ],
    ], 'Application status milestone retrieved.');
}

<?php
/**
 * Concurrency-Safe Application Submission API
 * POST /api/applications/submit.php
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

$pdo = Database::getConnection();
$candidate = Auth::requireCandidate($pdo);

$input = getJsonInput();
$jobId = (int)($input['jobId'] ?? $input['job_id'] ?? 0);
$documents = $input['documents'] ?? [];

if ($jobId <= 0) {
    jsonError('Valid job vacancy selection required.');
}

// Fetch job
$jobStmt = $pdo->prepare('
    SELECT j.*, c.name as category_name, e.company_name
    FROM jobs j
    JOIN job_categories c ON j.category_id = c.id
    JOIN employers e ON j.employer_id = e.id
    WHERE j.id = ? AND j.is_published = 1
');
$jobStmt->execute([$jobId]);
$job = $jobStmt->fetch();

if (!$job) {
    jsonError('Job vacancy not found or no longer active.', 404);
}

// Check if candidate already applied
$dupStmt = $pdo->prepare('
    SELECT id, tracking_id FROM applications 
    WHERE user_id = ? AND job_id = ? AND status != "Rejected" 
    LIMIT 1
');
$dupStmt->execute([(int)$candidate['id'], $jobId]);
$existing = $dupStmt->fetch();
if ($existing) {
    jsonError("You have already applied for this vacancy with Tracking ID: {$existing['tracking_id']}.");
}

try {
    $pdo->beginTransaction();

    // Concurrency-safe atomic Tracking ID generation
    $year = (int)date('Y');
    $seqStmt = $pdo->prepare('SELECT current_seq FROM application_sequences WHERE year = ? FOR UPDATE');
    $seqStmt->execute([$year]);
    $seqRow = $seqStmt->fetch();

    if (!$seqRow) {
        $newSeq = 101;
        $insSeq = $pdo->prepare('INSERT INTO application_sequences (year, current_seq) VALUES (?, ?)');
        $insSeq->execute([$year, $newSeq]);
    } else {
        $newSeq = ((int)$seqRow['current_seq']) + 1;
        $updSeq = $pdo->prepare('UPDATE application_sequences SET current_seq = ? WHERE year = ?');
        $updSeq->execute([$newSeq, $year]);
    }

    $trackingId = sprintf('SAJ-%04d-%06d', $year, $newSeq);
    $nowStr = date('Y-m-d H:i:s');
    $dateOnly = date('Y-m-d');

    // Attribution check for staff referral code
    $referralCode = trim($input['referralCode'] ?? $input['referral_code'] ?? '');
    $staffId = null;
    if (!empty($referralCode)) {
        $staffStmt = $pdo->prepare("SELECT id FROM staff_users WHERE referral_code = ? AND status = 'active' LIMIT 1");
        $staffStmt->execute([$referralCode]);
        $stf = $staffStmt->fetch();
        if ($stf) {
            $staffId = (int)$stf['id'];
        }
    }

    // Insert Application
    $appStmt = $pdo->prepare('
        INSERT INTO applications (
            tracking_id, user_id, job_id, referral_code, referred_by_staff_id, status, payment_status, next_stage_status
        ) VALUES (?, ?, ?, ?, ?, "Processing Pending", "Pending", "Pending Ballot / Selection")
    ');
    $appStmt->execute([$trackingId, (int)$candidate['id'], $jobId, $referralCode ?: null, $staffId]);
    $applicationId = (int)$pdo->lastInsertId();

    // Insert Attached Documents
    if (!empty($documents) && is_array($documents)) {
        $docStmt = $pdo->prepare('
            INSERT INTO application_documents (application_id, document_title, file_name, file_path, file_size)
            VALUES (?, ?, ?, ?, ?)
        ');
        foreach ($documents as $doc) {
            $title = Auth::sanitize($doc['title'] ?? 'Dossier Document');
            $fileName = Auth::sanitize($doc['fileName'] ?? 'document.pdf');
            $fileSize = Auth::sanitize($doc['fileSize'] ?? '1.0 MB');
            $docStmt->execute([$applicationId, $title, $fileName, $fileName, $fileSize]);
        }
    }

    // Insert Status History
    $histStmt = $pdo->prepare('
        INSERT INTO application_status_history (application_id, status, changed_by, notes)
        VALUES (?, "Submitted", ?, "Application lodged through recruitment portal.")
    ');
    $histStmt->execute([$applicationId, $candidate['full_name']]);

    $pdo->commit();

    Auth::logAudit($pdo, 'APPLICATION_LODGED', "Tracking ID $trackingId generated for {$job['title']}", $candidate['full_name'], 'candidate');

    $responseApp = [
        'id' => (string)$applicationId,
        'trackingId' => $trackingId,
        'candidateId' => (string)$candidate['id'],
        'candidateName' => $candidate['full_name'],
        'candidateCnic' => $candidate['cnic'],
        'candidateMobile' => $candidate['mobile'],
        'candidateEmail' => $candidate['email'],
        'candidateCity' => $candidate['city'] ?? '',
        'candidateProvince' => $candidate['province'] ?? '',
        'jobId' => (string)$jobId,
        'jobTitle' => $job['title'],
        'jobLocation' => $job['location'],
        'appliedDate' => $dateOnly,
        'status' => 'Processing Pending',
        'paymentStatus' => 'Pending',
        'nextStageStatus' => 'Pending Ballot / Selection',
        'documents' => array_map(fn($d, $i) => [
            'id' => "doc-$i",
            'title' => $d['title'] ?? 'Dossier Document',
            'fileName' => $d['fileName'] ?? 'document.pdf',
            'fileSize' => $d['fileSize'] ?? '1.0 MB',
            'uploadedAt' => $dateOnly,
            'verified' => false,
        ], $documents, array_keys($documents)),
        'statusHistory' => [
            [
                'status' => 'Submitted',
                'changedAt' => $nowStr,
                'changedBy' => $candidate['full_name'],
                'notes' => 'Application lodged through recruitment portal.',
            ],
        ],
    ];

    jsonSuccess([
        'application' => $responseApp,
        'trackingId' => $trackingId,
    ], 'Application lodged successfully.');

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[SAJ_APPLY_ERROR] ' . $e->getMessage());
    jsonError('Failed to process application. Please try again.', 500);
}

<?php
/**
 * Administrator Console Data API
 * GET /api/admin/dashboard.php
 */

declare(strict_types=1);

require_once dirname(dirname(__DIR__)) . '/config/config.php';
require_once dirname(dirname(__DIR__)) . '/config/database.php';
require_once dirname(dirname(__DIR__)) . '/includes/auth.php';

header('Content-Type: application/json; charset=UTF-8');

$pdo = Database::getConnection();
$admin = Auth::requireAdminRole($pdo, ['super_admin', 'recruitment_admin', 'payment_reviewer', 'readonly_reviewer']);

// 1. Fetch website settings
$settingsStmt = $pdo->query('SELECT setting_key, setting_value FROM website_settings');
$settings = [];
while ($row = $settingsStmt->fetch()) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

// 2. Fetch all applications
$appsStmt = $pdo->query('
    SELECT a.*, j.title as job_title, j.location as job_location,
           u.full_name as candidate_name, u.cnic as candidate_cnic, u.mobile as candidate_mobile, u.email as candidate_email,
           cp.city as candidate_city, cp.province as candidate_province,
           p.id as payment_id, p.transaction_ref, p.bank_name, p.payment_method, p.payment_date, p.receipt_file_path, p.status as payment_rec_status
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
    LEFT JOIN payments p ON p.application_id = a.id
    ORDER BY a.created_at DESC
');
$applications = [];
while ($row = $appsStmt->fetch()) {
    // Fetch documents
    $docStmt = $pdo->prepare('SELECT id, document_title, file_name, file_size, uploaded_at, is_verified FROM application_documents WHERE application_id = ?');
    $docStmt->execute([$row['id']]);
    $docs = $docStmt->fetchAll();

    // Fetch history
    $histStmt = $pdo->prepare('SELECT status, changed_by, notes, created_at as changed_at FROM application_status_history WHERE application_id = ? ORDER BY created_at ASC');
    $histStmt->execute([$row['id']]);
    $history = $histStmt->fetchAll();

    $applications[] = [
        'id' => (string)$row['id'],
        'trackingId' => $row['tracking_id'],
        'candidateId' => (string)$row['user_id'],
        'candidateName' => $row['candidate_name'],
        'candidateCnic' => $row['candidate_cnic'],
        'candidateMobile' => $row['candidate_mobile'],
        'candidateEmail' => $row['candidate_email'],
        'candidateCity' => $row['candidate_city'] ?? '',
        'candidateProvince' => $row['candidate_province'] ?? '',
        'jobId' => (string)$row['job_id'],
        'jobTitle' => $row['job_title'],
        'jobLocation' => $row['job_location'],
        'appliedDate' => substr((string)$row['created_at'], 0, 10),
        'status' => $row['status'],
        'paymentStatus' => $row['payment_status'],
        'nextStageStatus' => $row['next_stage_status'],
        'reviewerId' => $row['reviewer_id'] ? (string)$row['reviewer_id'] : null,
        'reviewerName' => $row['reviewer_name'] ?? null,
        'reviewedAt' => $row['reviewed_at'] ?? null,
        'reviewNotes' => $row['review_notes'] ?? null,
        'rejectionReason' => $row['rejection_reason'] ?? null,
        'additionalDocumentsRequested' => $row['additional_docs_requested'] ?? null,
        'paymentRecord' => $row['payment_id'] ? [
            'id' => (string)$row['payment_id'],
            'transactionRef' => $row['transaction_ref'],
            'bankName' => $row['bank_name'],
            'paymentMethod' => $row['payment_method'],
            'paymentDate' => $row['payment_date'],
            'receiptFileName' => $row['receipt_file_path'],
            'status' => $row['payment_rec_status'],
        ] : null,
        'documents' => array_map(fn($d) => [
            'id' => (string)$d['id'],
            'title' => $d['document_title'],
            'fileName' => $d['file_name'],
            'fileSize' => $d['file_size'] ?? '1.2 MB',
            'uploadedAt' => substr((string)$d['uploaded_at'], 0, 10),
            'verified' => (bool)$d['is_verified'],
        ], $docs),
        'statusHistory' => array_map(fn($h) => [
            'status' => $h['status'],
            'changedAt' => $h['changed_at'],
            'changedBy' => $h['changed_by'],
            'notes' => $h['notes'],
        ], $history),
    ];
}

// 3. Fetch Payments
$payStmt = $pdo->query('
    SELECT p.*, a.tracking_id, u.full_name as candidate_name
    FROM payments p
    JOIN applications a ON p.application_id = a.id
    JOIN users u ON a.user_id = u.id
    ORDER BY p.created_at DESC
');
$payments = [];
while ($p = $payStmt->fetch()) {
    $payments[] = [
        'id' => (string)$p['id'],
        'applicationId' => (string)$p['application_id'],
        'trackingId' => $p['tracking_id'],
        'candidateName' => $p['candidate_name'],
        'amountPKR' => (int)$p['amount_pkr'],
        'paymentMethod' => $p['payment_method'],
        'bankName' => $p['bank_name'],
        'transactionRef' => $p['transaction_ref'],
        'paymentDate' => $p['payment_date'],
        'receiptFileName' => $p['receipt_file_path'],
        'receiptImageData' => $p['receipt_image_data'] ?? null,
        'status' => $p['status'],
        'rejectionReason' => $p['rejection_reason'],
        'refundRef' => $p['refund_ref'],
        'refundDate' => $p['refund_date'],
        'verifiedBy' => $p['verified_by'],
        'verifiedAt' => $p['verified_at'],
        'submittedAt' => substr((string)$p['created_at'], 0, 16),
    ];
}

// 4. Fetch Candidates
$candStmt = $pdo->query('
    SELECT u.*, cp.dob, cp.gender, cp.city, cp.province, cp.education, cp.experience_years, cp.passport_status, cp.preferred_category, cp.cv_file_path
    FROM users u
    LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
    ORDER BY u.created_at DESC
');
$candidates = [];
while ($c = $candStmt->fetch()) {
    $candidates[] = [
        'id' => (string)$c['id'],
        'fullName' => $c['full_name'],
        'email' => $c['email'],
        'mobile' => $c['mobile'],
        'cnic' => $c['cnic'],
        'dob' => $c['dob'] ?? '',
        'gender' => $c['gender'] ?? 'Male',
        'city' => $c['city'] ?? '',
        'province' => $c['province'] ?? '',
        'education' => $c['education'] ?? '',
        'experienceYears' => (int)($c['experience_years'] ?? 0),
        'passportStatus' => $c['passport_status'] ?? 'Valid Passport',
        'preferredCategory' => $c['preferred_category'] ?? '',
        'cvFileName' => $c['cv_file_path'] ?? '',
        'createdAt' => substr((string)$c['created_at'], 0, 10),
    ];
}

// 5. Fetch Ballot Event
$ballotStmt = $pdo->query('SELECT * FROM ballot_events WHERE scheduled_date = "2026-12-22" LIMIT 1');
$ballot = $ballotStmt->fetch();

$eligibleAppsStmt = $pdo->query('SELECT id FROM applications WHERE status = "Ballot Eligible"');
$eligibleIds = $eligibleAppsStmt->fetchAll(PDO::FETCH_COLUMN);

$selectedAppsStmt = $pdo->query('SELECT id FROM applications WHERE next_stage_status = "Selected for Next Stage"');
$selectedIds = $selectedAppsStmt->fetchAll(PDO::FETCH_COLUMN);

// 6. Fetch Audit Logs
$auditStmt = $pdo->query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
$auditLogs = [];
while ($l = $auditStmt->fetch()) {
    $auditLogs[] = [
        'id' => (string)$l['id'],
        'timestamp' => substr((string)$l['created_at'], 0, 19),
        'actor' => $l['actor'],
        'role' => $l['role'],
        'action' => $l['action'],
        'details' => $l['details'],
        'ipAddress' => $l['ip_address'],
    ];
}

// 7. Fetch Admin users
$adminStmt = $pdo->query('SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM admin_users');
$admins = [];
while ($a = $adminStmt->fetch()) {
    $admins[] = [
        'id' => (string)$a['id'],
        'username' => $a['username'],
        'name' => $a['full_name'],
        'email' => $a['email'],
        'role' => $a['role'],
        'isActive' => (bool)$a['is_active'],
        'lastLogin' => $a['last_login'],
        'createdAt' => substr((string)$a['created_at'], 0, 10),
    ];
}

jsonSuccess([
    'admin' => [
        'id' => (string)$admin['id'],
        'username' => $admin['username'],
        'name' => $admin['full_name'],
        'email' => $admin['email'],
        'role' => $admin['role'],
    ],
    'applications' => $applications,
    'payments' => $payments,
    'candidates' => $candidates,
    'ballot' => [
        'id' => (string)($ballot['id'] ?? 1),
        'title' => $ballot['title'] ?? 'Official Saudi Arabia 2026 General Recruitment Ballot',
        'scheduledDate' => $ballot['scheduled_date'] ?? '2026-12-22',
        'applicationDeadline' => $ballot['application_deadline'] ?? '2026-12-10',
        'selectionMethod' => $ballot['selection_method'] ?? 'Verifiable Pseudo-Randomized Draw',
        'status' => $ballot['status'] ?? 'Scheduled',
        'seedOrProof' => $ballot['random_seed'] ?? null,
        'publishedAt' => $ballot['published_at'] ?? null,
        'publishedBy' => $ballot['published_by'] ?? null,
        'eligibleApplicationIds' => array_map('strval', $eligibleIds),
        'selectedApplicationIds' => array_map('strval', $selectedIds),
        'notes' => $ballot['notes'] ?? '',
    ],
    'auditLogs' => $auditLogs,
    'admins' => $admins,
    'settings' => [
        'isEmbassyAuthorized' => ($settings['is_embassy_authorized'] ?? '0') === '1',
        'authorizationDocumentRef' => $settings['authorization_doc_ref'] ?? '',
        'authorizedOrganizationName' => $settings['authorized_org_name'] ?? 'Royal Saudi Embassy in Islamabad — Recruitment Section',
        'temporaryPublicName' => $settings['temporary_public_name'] ?? 'Saudi Jobs & Recruitment Portal Pakistan',
        'activePublicName' => (($settings['is_embassy_authorized'] ?? '0') === '1')
            ? ($settings['authorized_org_name'] ?? 'Royal Saudi Embassy in Islamabad — Recruitment Section')
            : ($settings['temporary_public_name'] ?? 'Saudi Jobs & Recruitment Portal Pakistan'),
        'feeCollectionAuthorized' => ($settings['fee_collection_authorized'] ?? '0') === '1',
        'feeAmountPKR' => (int)($settings['fee_amount_pkr'] ?? 4500),
        'bankAccountTitle' => $settings['bank_account_title'] ?? 'Saudi Jobs Recruitment Escrow',
        'bankAccountNumber' => $settings['bank_account_number'] ?? '02010108920192',
        'bankIBAN' => $settings['bank_iban'] ?? 'PK36MEZN0002010108920192',
        'bankName' => $settings['bank_name'] ?? 'Meezan Bank Limited, Blue Area Islamabad',
        'contactHelpline' => '+92 (51) 892-0190',
        'contactEmail' => 'support@saudijobsportal.pk',
        'contactAddress' => 'G-5/2 Diplomatic Enclave Access Corridor, Islamabad, Pakistan',
        'ballotDate' => $settings['ballot_date'] ?? '2026-12-22',
    ],
], 'Admin dashboard data loaded.');

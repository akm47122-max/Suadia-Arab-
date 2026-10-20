<?php
/**
 * Jobs & Vacancies Directory API
 * GET /api/jobs/list.php
 */

declare(strict_types=1);

require_once dirname(dirname(__DIR__)) . '/config/config.php';
require_once dirname(dirname(__DIR__)) . '/config/database.php';
require_once dirname(dirname(__DIR__)) . '/includes/auth.php';

header('Content-Type: application/json; charset=UTF-8');

$pdo = Database::getConnection();

// Fetch settings
$settingsStmt = $pdo->query('SELECT setting_key, setting_value FROM website_settings');
$settings = [];
while ($row = $settingsStmt->fetch()) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

// Fetch categories
$catStmt = $pdo->query('SELECT * FROM job_categories WHERE is_active = 1 ORDER BY name ASC');
$categories = $catStmt->fetchAll();

// Fetch published jobs
$jobsStmt = $pdo->query('
    SELECT j.*, c.name as category_name, e.company_name, e.location_city
    FROM jobs j
    JOIN job_categories c ON j.category_id = c.id
    JOIN employers e ON j.employer_id = e.id
    WHERE j.is_published = 1
    ORDER BY j.created_at DESC
');
$jobs = [];
while ($row = $jobsStmt->fetch()) {
    $reqDocs = json_decode($row['required_documents'], true);
    if (!is_array($reqDocs)) {
        $reqDocs = array_filter(array_map('trim', explode(',', $row['required_documents'])));
    }

    $jobs[] = [
        'id' => (string)$row['id'],
        'title' => $row['title'],
        'category' => $row['category_name'],
        'employer' => $row['company_name'],
        'location' => $row['location'],
        'positions' => (int)$row['positions'],
        'genderEligibility' => $row['gender_eligibility'],
        'qualification' => $row['qualification'],
        'experienceRequired' => $row['experience_required'],
        'salarySAR' => (int)$row['salary_sar'],
        'contractDuration' => $row['contract_duration'],
        'deadline' => $row['deadline'],
        'description' => $row['description'],
        'requiredDocuments' => $reqDocs,
        'verificationStatus' => $row['verification_status'],
        'isPublished' => (bool)$row['is_published'],
        'createdAt' => substr((string)$row['created_at'], 0, 10),
    ];
}

// Fetch official notices
$noticesStmt = $pdo->query('SELECT * FROM official_notices WHERE is_public = 1 ORDER BY published_at DESC LIMIT 10');
$notices = [];
while ($n = $noticesStmt->fetch()) {
    $notices[] = [
        'id' => (string)$n['id'],
        'title' => $n['title'],
        'summary' => $n['summary'],
        'content' => $n['content'],
        'priority' => $n['priority'],
        'category' => $n['category'],
        'isPublic' => (bool)$n['is_public'],
        'publishDate' => $n['published_at'],
    ];
}

jsonSuccess([
    'jobs' => $jobs,
    'categories' => array_map(fn($c) => [
        'id' => (string)$c['id'],
        'name' => $c['name'],
        'description' => $c['description'] ?? '',
        'iconName' => $c['icon_name'] ?? 'Briefcase',
        'isActive' => (bool)$c['is_active'],
    ], $categories),
    'notices' => $notices,
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
], 'Jobs list retrieved.');

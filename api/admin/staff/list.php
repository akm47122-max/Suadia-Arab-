<?php
/**
 * Admin Staff List & Performance Overview API
 * PHP 8.2+
 * Role-authorized: Admin Console Only
 */

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/config/config.php';
require_once dirname(__DIR__, 3) . '/config/database.php';
require_once dirname(__DIR__, 3) . '/includes/auth.php';

$pdo = Database::getConnection();
$admin = Auth::requireAdminRole($pdo, ['super_admin', 'recruitment_admin', 'readonly_reviewer']);

$search = trim($_GET['search'] ?? '');
$roleFilter = trim($_GET['role'] ?? '');
$statusFilter = trim($_GET['status'] ?? '');

// Build query with optional filters
$query = "
    SELECT id, username, email, full_name, phone, role, status, referral_code,
           monthly_target, must_change_password, last_login, created_at
    FROM staff_users
    WHERE 1=1
";
$params = [];

if (!empty($search)) {
    $query .= " AND (full_name LIKE ? OR username LIKE ? OR email LIKE ? OR referral_code LIKE ?)";
    $like = '%' . $search . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}

if (!empty($roleFilter) && $roleFilter !== 'all') {
    $query .= " AND role = ?";
    $params[] = $roleFilter;
}

if (!empty($statusFilter) && $statusFilter !== 'all') {
    $query .= " AND status = ?";
    $params[] = $statusFilter;
}

$query .= " ORDER BY id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$staffList = $stmt->fetchAll();

// Calculate staff performance metrics
$staffData = [];
$totalVerifiedRevenueAll = 0.0;
$totalVerifiedReferralsAll = 0;
$totalReferralsAll = 0;

foreach ($staffList as $stf) {
    $sId = (int)$stf['id'];
    $refCode = $stf['referral_code'];

    // Referrals query for this staff member
    $refStmt = $pdo->prepare("
        SELECT COUNT(*) AS total_count,
               SUM(CASE WHEN a.status != 'Draft' AND a.status != 'Rejected' THEN 1 ELSE 0 END) AS valid_count,
               SUM(CASE WHEN a.payment_status = 'Verified' OR p.status = 'Verified' THEN 1 ELSE 0 END) AS verified_paid_count,
               SUM(CASE WHEN a.payment_status = 'Verified' OR p.status = 'Verified' THEN COALESCE(p.amount_pkr, 4500.00) ELSE 0 END) AS verified_revenue
        FROM applications a
        LEFT JOIN payments p ON p.application_id = a.id
        WHERE a.referred_by_staff_id = ? OR a.referral_code = ?
    ");
    $refStmt->execute([$sId, $refCode]);
    $stats = $refStmt->fetch();

    $tot = (int)($stats['total_count'] ?? 0);
    $val = (int)($stats['valid_count'] ?? 0);
    $vPaid = (int)($stats['verified_paid_count'] ?? 0);
    $vRev = (float)($stats['verified_revenue'] ?? 0.0);

    $totalReferralsAll += $tot;
    $totalVerifiedReferralsAll += $vPaid;
    $totalVerifiedRevenueAll += $vRev;

    $target = (int)$stf['monthly_target'] > 0 ? (int)$stf['monthly_target'] : 15;
    $progress = min(100.0, round(($vPaid / $target) * 100.0, 1));

    $staffData[] = [
        'id' => (string)$stf['id'],
        'fullName' => $stf['full_name'],
        'username' => $stf['username'],
        'email' => $stf['email'],
        'phone' => $stf['phone'] ?? '',
        'role' => $stf['role'],
        'status' => $stf['status'],
        'referralCode' => $stf['referral_code'],
        'monthlyTarget' => $target,
        'mustChangePassword' => (bool)$stf['must_change_password'],
        'lastLogin' => $stf['last_login'] ?? '',
        'createdAt' => $stf['created_at'],
        'performance' => [
            'totalReferrals' => $tot,
            'validReferrals' => $val,
            'verifiedPaidReferrals' => $vPaid,
            'verifiedRevenuePKR' => $vRev,
            'targetProgressPercent' => $progress,
        ]
    ];
}

// Fetch aggregate bonus statistics
$bonusSummaryStmt = $pdo->query("
    SELECT
      SUM(CASE WHEN status = 'Pending Review' THEN bonus_amount_pkr ELSE 0 END) AS pending_total,
      SUM(CASE WHEN status = 'Approved' THEN bonus_amount_pkr ELSE 0 END) AS approved_total,
      SUM(CASE WHEN status = 'Disbursed / Paid' THEN bonus_amount_pkr ELSE 0 END) AS paid_total
    FROM staff_bonus_records
");
$bonusSummary = $bonusSummaryStmt->fetch() ?: [];

// Fetch configurable tiers
$tiersStmt = $pdo->query("SELECT * FROM staff_bonus_tiers ORDER BY min_verified_referrals ASC");
$tiers = $tiersStmt->fetchAll();

jsonSuccess([
    'staff' => $staffData,
    'metrics' => [
        'totalStaff' => count($staffList),
        'activeStaff' => count(array_filter($staffList, fn($s) => $s['status'] === 'active')),
        'suspendedStaff' => count(array_filter($staffList, fn($s) => $s['status'] === 'suspended')),
        'totalReferrals' => $totalReferralsAll,
        'verifiedReferrals' => $totalVerifiedReferralsAll,
        'verifiedRevenuePKR' => $totalVerifiedRevenueAll,
        'pendingBonusesPKR' => (float)($bonusSummary['pending_total'] ?? 0),
        'approvedBonusesPKR' => (float)($bonusSummary['approved_total'] ?? 0),
        'paidBonusesPKR' => (float)($bonusSummary['paid_total'] ?? 0),
    ],
    'bonusTiers' => $tiers,
], 'Staff records and performance metrics retrieved.');

<?php
/**
 * Admin Staff & Referral CSV Export API
 * PHP 8.2+
 * Strict role authorization: Only records the user is authorized to view
 */

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/config/config.php';
require_once dirname(__DIR__, 3) . '/config/database.php';
require_once dirname(__DIR__, 3) . '/includes/auth.php';

$pdo = Database::getConnection();
$admin = Auth::requireAdminRole($pdo, ['super_admin', 'recruitment_admin', 'readonly_reviewer']);

$type = trim($_GET['type'] ?? 'staff'); // 'staff' or 'referrals'
$staffId = (int)($_GET['staffId'] ?? 0);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=staff_recruitment_report_' . date('Ymd_His') . '.csv');
header('Pragma: no-cache');
header('Expires: 0');

$output = fopen('php://output', 'w');

// UTF-8 BOM for Excel compatibility
fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

if ($type === 'referrals') {
    fputcsv($output, [
        'Tracking ID', 'Candidate Name', 'Job Designation', 'Staff Referral Code',
        'Staff Member', 'Applied Date', 'Application Status', 'Payment Status', 'Verified Amount PKR'
    ]);

    $query = "
        SELECT a.tracking_id, u.full_name AS candidate_name, j.title AS job_title,
               a.referral_code, s.full_name AS staff_name, a.created_at,
               a.status AS app_status, a.payment_status,
               CASE WHEN a.payment_status = 'Verified' OR p.status = 'Verified' THEN COALESCE(p.amount_pkr, 4500.00) ELSE 0 END AS verified_amount
        FROM applications a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN staff_users s ON a.referred_by_staff_id = s.id OR a.referral_code = s.referral_code
        LEFT JOIN payments p ON p.application_id = a.id
        WHERE a.referral_code IS NOT NULL AND a.referral_code != ''
    ";
    $params = [];
    if ($staffId > 0) {
        $query .= " AND (a.referred_by_staff_id = ? OR s.id = ?)";
        $params[] = $staffId;
        $params[] = $staffId;
    }
    $query .= " ORDER BY a.created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['tracking_id'],
            $row['candidate_name'],
            $row['job_title'] ?? 'General Quota',
            $row['referral_code'],
            $row['staff_name'] ?? 'Unassigned',
            $row['created_at'],
            $row['app_status'],
            $row['payment_status'],
            $row['verified_amount']
        ]);
    }

    Auth::logAudit($pdo, 'CSV_EXPORT_REFERRALS', "Admin {$admin['name']} exported referral report to CSV.", $admin['name'], $admin['role']);
} else {
    fputcsv($output, [
        'Staff ID', 'Full Name', 'Username', 'Email', 'Role', 'Status',
        'Referral Code', 'Monthly Target', 'Total Referrals', 'Verified Referrals',
        'Verified Revenue (PKR)', 'Target Progress %', 'Created Date', 'Last Login'
    ]);

    $stmt = $pdo->query("SELECT * FROM staff_users ORDER BY id DESC");
    while ($stf = $stmt->fetch()) {
        $sId = (int)$stf['id'];
        $refCode = $stf['referral_code'];

        $refStmt = $pdo->prepare("
            SELECT COUNT(*) AS total_count,
                   SUM(CASE WHEN a.payment_status = 'Verified' OR p.status = 'Verified' THEN 1 ELSE 0 END) AS verified_count,
                   SUM(CASE WHEN a.payment_status = 'Verified' OR p.status = 'Verified' THEN COALESCE(p.amount_pkr, 4500.00) ELSE 0 END) AS verified_revenue
            FROM applications a
            LEFT JOIN payments p ON p.application_id = a.id
            WHERE a.referred_by_staff_id = ? OR a.referral_code = ?
        ");
        $refStmt->execute([$sId, $refCode]);
        $stats = $refStmt->fetch();

        $tot = (int)($stats['total_count'] ?? 0);
        $vCount = (int)($stats['verified_count'] ?? 0);
        $vRev = (float)($stats['verified_revenue'] ?? 0.0);
        $target = (int)$stf['monthly_target'] > 0 ? (int)$stf['monthly_target'] : 15;
        $progress = min(100.0, round(($vCount / $target) * 100.0, 1));

        fputcsv($output, [
            $stf['id'],
            $stf['full_name'],
            $stf['username'],
            $stf['email'],
            $stf['role'],
            $stf['status'],
            $stf['referral_code'],
            $target,
            $tot,
            $vCount,
            $vRev,
            $progress . '%',
            $stf['created_at'],
            $stf['last_login'] ?? 'Never'
        ]);
    }

    Auth::logAudit($pdo, 'CSV_EXPORT_STAFF', "Admin {$admin['name']} exported staff roster to CSV.", $admin['name'], $admin['role']);
}

fclose($output);
exit;

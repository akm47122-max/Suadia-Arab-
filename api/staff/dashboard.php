<?php
/**
 * Staff Personal Dashboard & Referral Earnings API
 * PHP 8.2+
 * Strictly role-authorized: Staff can ONLY access their own records
 */

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/config.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';

$pdo = Database::getConnection();
$staff = Auth::requireStaff($pdo);

$staffId = (int)$staff['id'];
$referralCode = $staff['referral_code'];

// 1. Fetch all referrals tied to this staff's referral code or ID
$stmt = $pdo->prepare("
    SELECT a.id, a.tracking_id, a.job_id, j.title AS job_title, j.location AS job_location,
           u.full_name AS candidate_name, u.email AS candidate_email,
           CONCAT(LEFT(u.cnic, 5), '-*****-', RIGHT(u.cnic, 1)) AS masked_cnic,
           CONCAT(LEFT(u.mobile, 4), '***', RIGHT(u.mobile, 4)) AS masked_mobile,
           a.status AS application_status, a.payment_status,
           a.created_at AS applied_date,
           p.amount_pkr, p.status AS verified_payment_status, p.payment_date, p.payment_method
    FROM applications a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN payments p ON p.application_id = a.id
    WHERE a.referred_by_staff_id = ? OR a.referral_code = ?
    ORDER BY a.created_at DESC
");
$stmt->execute([$staffId, $referralCode]);
$referrals = $stmt->fetchAll();

// 2. Compute performance metrics
$totalReferrals = count($referrals);
$validReferrals = 0;
$verifiedPaidCount = 0;
$verifiedRevenuePKR = 0.0;

foreach ($referrals as $ref) {
    if ($ref['application_status'] !== 'Draft' && $ref['application_status'] !== 'Rejected') {
        $validReferrals++;
    }
    // Genuinely verified payments only
    if ($ref['payment_status'] === 'Verified' || $ref['verified_payment_status'] === 'Verified') {
        $verifiedPaidCount++;
        $verifiedRevenuePKR += (float)($ref['amount_pkr'] ?? 4500.00);
    }
}

// 3. Fetch Active Bonus Tiers
$tierStmt = $pdo->query("
    SELECT id, tier_name, min_verified_referrals, bonus_amount_pkr, commission_percent, description
    FROM staff_bonus_tiers
    WHERE is_active = 1
    ORDER BY min_verified_referrals ASC
");
$tiers = $tierStmt->fetchAll();

// Determine current achieved tier and next tier
$currentTierName = 'Standard Base';
$currentTierBonus = 0.0;
$nextTier = null;

foreach ($tiers as $tier) {
    if ($verifiedPaidCount >= (int)$tier['min_verified_referrals']) {
        $currentTierName = $tier['tier_name'];
        $currentTierBonus = (float)$tier['bonus_amount_pkr'] + ($verifiedRevenuePKR * ((float)$tier['commission_percent'] / 100.0));
    } else if ($nextTier === null) {
        $nextTier = [
            'tierName' => $tier['tier_name'],
            'neededReferrals' => (int)$tier['min_verified_referrals'] - $verifiedPaidCount,
            'potentialBonusPKR' => (float)$tier['bonus_amount_pkr']
        ];
    }
}

// 4. Fetch Bonus Records for this staff member
$bonusStmt = $pdo->prepare("
    SELECT id, period_month, verified_referrals_count, verified_revenue_pkr, bonus_amount_pkr,
           tier_name, status, approved_by, approved_at, paid_ref, paid_at, notes, created_at
    FROM staff_bonus_records
    WHERE staff_id = ?
    ORDER BY period_month DESC, id DESC
");
$bonusStmt->execute([$staffId]);
$bonusRecords = $bonusStmt->fetchAll();

$approvedBonusTotal = 0.0;
$paidBonusTotal = 0.0;
$pendingBonusTotal = 0.0;

foreach ($bonusRecords as $br) {
    if ($br['status'] === 'Approved') {
        $approvedBonusTotal += (float)$br['bonus_amount_pkr'];
    } elseif ($br['status'] === 'Disbursed / Paid') {
        $paidBonusTotal += (float)$br['bonus_amount_pkr'];
    } elseif ($br['status'] === 'Pending Review') {
        $pendingBonusTotal += (float)$br['bonus_amount_pkr'];
    }
}

// Target calculation
$monthlyTarget = (int)$staff['monthly_target'] > 0 ? (int)$staff['monthly_target'] : 15;
$targetPercent = min(100.0, round(($verifiedPaidCount / $monthlyTarget) * 100.0, 1));

jsonSuccess([
    'staff' => [
        'id' => (string)$staff['id'],
        'fullName' => $staff['full_name'],
        'username' => $staff['username'],
        'email' => $staff['email'],
        'phone' => $staff['phone'] ?? '',
        'role' => $staff['role'],
        'status' => $staff['status'],
        'referralCode' => $staff['referral_code'],
        'monthlyTarget' => $monthlyTarget,
        'mustChangePassword' => (bool)$staff['must_change_password'],
        'lastLogin' => $staff['last_login'] ?? '',
        'createdAt' => $staff['created_at'],
    ],
    'performance' => [
        'totalReferrals' => $totalReferrals,
        'validReferrals' => $validReferrals,
        'verifiedPaidReferrals' => $verifiedPaidCount,
        'verifiedRevenuePKR' => $verifiedRevenuePKR,
        'monthlyTarget' => $monthlyTarget,
        'targetProgressPercent' => $targetPercent,
        'eligibleBonusPKR' => $currentTierBonus,
        'approvedBonusPKR' => $approvedBonusTotal,
        'paidBonusPKR' => $paidBonusTotal,
        'pendingBonusPKR' => $pendingBonusTotal,
        'currentTierName' => $currentTierName,
        'nextTier' => $nextTier,
    ],
    'bonusTiers' => $tiers,
    'bonusRecords' => $bonusRecords,
    'referrals' => $referrals,
], 'Staff dashboard metrics loaded.');

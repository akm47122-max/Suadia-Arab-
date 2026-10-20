<?php
/**
 * Admin Configurable Bonus Tiers API
 * PHP 8.2+
 * Audit trail for all tier and target modifications
 */

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/config/config.php';
require_once dirname(__DIR__, 3) . '/config/database.php';
require_once dirname(__DIR__, 3) . '/includes/auth.php';

$pdo = Database::getConnection();
$admin = Auth::requireAdminRole($pdo, ['super_admin']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT * FROM staff_bonus_tiers ORDER BY min_verified_referrals ASC");
    $tiers = $stmt->fetchAll();
    jsonSuccess(['bonusTiers' => $tiers]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $tiers = $input['tiers'] ?? [];

    if (!is_array($tiers) || empty($tiers)) {
        jsonError('Tiers array cannot be empty.');
    }

    $pdo->beginTransaction();
    try {
        foreach ($tiers as $tier) {
            $id = (int)($tier['id'] ?? 0);
            $tierName = trim($tier['tierName'] ?? $tier['tier_name'] ?? '');
            $minReferrals = (int)($tier['minVerifiedReferrals'] ?? $tier['min_verified_referrals'] ?? 0);
            $bonusAmount = (float)($tier['bonusAmountPKR'] ?? $tier['bonus_amount_pkr'] ?? 0);
            $commission = (float)($tier['commissionPercent'] ?? $tier['commission_percent'] ?? 0);
            $desc = trim($tier['description'] ?? '');
            $isActive = isset($tier['isActive']) ? ($tier['isActive'] ? 1 : 0) : 1;

            if ($id > 0) {
                $upd = $pdo->prepare("
                    UPDATE staff_bonus_tiers
                    SET tier_name = ?, min_verified_referrals = ?, bonus_amount_pkr = ?,
                        commission_percent = ?, description = ?, is_active = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                $upd->execute([$tierName, $minReferrals, $bonusAmount, $commission, $desc, $isActive, $id]);
            } else {
                $ins = $pdo->prepare("
                    INSERT INTO staff_bonus_tiers (tier_name, min_verified_referrals, bonus_amount_pkr, commission_percent, description, is_active)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $ins->execute([$tierName, $minReferrals, $bonusAmount, $commission, $desc, $isActive]);
            }
        }

        Auth::logAudit($pdo, 'BONUS_TIERS_CONFIGURED', "Admin {$admin['name']} updated bonus tier matrix.", $admin['name'], $admin['role']);
        $pdo->commit();

        $stmt = $pdo->query("SELECT * FROM staff_bonus_tiers ORDER BY min_verified_referrals ASC");
        $updatedTiers = $stmt->fetchAll();

        jsonSuccess(['bonusTiers' => $updatedTiers], 'Bonus tier structure updated and audited successfully.');
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Failed to save bonus tier configuration: ' . $e->getMessage(), 500);
    }
}

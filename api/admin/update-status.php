<?php
/**
 * Administrator Status & Settings Update API
 * POST /api/admin/update-status.php
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
$input = getJsonInput();
$type = $input['type'] ?? 'application_next_stage'; // 'application_next_stage' or 'settings'

$admin = Auth::requireAdminRole($pdo, $type === 'settings' ? ['super_admin'] : ['super_admin', 'recruitment_admin']);
$adminName = $admin['full_name'] . ' (' . $admin['role'] . ')';

try {
    if ($type === 'settings') {
        // Update website settings
        $permitRef = Auth::sanitize($input['authorizationDocumentRef'] ?? '');
        $isAuthorized = !empty($permitRef) ? '1' : ($input['isEmbassyAuthorized'] ? '1' : '0');
        $feeAuth = !empty($input['feeCollectionAuthorized']) ? '1' : '0';
        $feeAmount = (string)(int)($input['feeAmountPKR'] ?? 4500);
        $ballotDate = $input['ballotDate'] ?? '2026-12-22';

        $pdo->beginTransaction();

        $stmt = $pdo->prepare('UPDATE website_settings SET setting_value = ? WHERE setting_key = ?');
        $stmt->execute([$isAuthorized, 'is_embassy_authorized']);
        $stmt->execute([$permitRef, 'authorization_doc_ref']);
        $stmt->execute([$feeAuth, 'fee_collection_authorized']);
        $stmt->execute([$feeAmount, 'fee_amount_pkr']);
        $stmt->execute([$ballotDate, 'ballot_date']);

        $pdo->commit();

        Auth::logAudit($pdo, 'SETTINGS_UPDATED', "System settings updated. Embassy authorized: $isAuthorized, Fee collection: $feeAuth", $adminName, $admin['role']);
        jsonSuccess([], 'Website governance settings updated successfully.');

    } else {
        // Update Next-Stage Status on an Application
        $applicationId = (int)($input['applicationId'] ?? $input['application_id'] ?? 0);
        $newStatus = Auth::sanitize($input['nextStageStatus'] ?? $input['status'] ?? '');
        $notes = Auth::sanitize($input['notes'] ?? "Status updated to $newStatus");

        if ($applicationId <= 0 || empty($newStatus)) {
            jsonError('Application ID and next-stage status are required.');
        }

        $appStmt = $pdo->prepare('SELECT tracking_id, next_stage_status FROM applications WHERE id = ? LIMIT 1');
        $appStmt->execute([$applicationId]);
        $app = $appStmt->fetch();

        if (!$app) {
            jsonError('Application not found.', 404);
        }

        $pdo->beginTransaction();

        $upd = $pdo->prepare('
            UPDATE applications 
            SET next_stage_status = ? 
            WHERE id = ?
        ');
        $upd->execute([$newStatus, $applicationId]);

        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, ?, ?, ?)
        ');
        $hist->execute([$applicationId, $newStatus, $adminName, $notes]);

        $pdo->commit();

        Auth::logAudit(
            $pdo,
            'NEXT_STAGE_UPDATE',
            "Application {$app['tracking_id']} status updated to '$newStatus'",
            $adminName,
            $admin['role']
        );

        jsonSuccess([
            'applicationId' => (string)$applicationId,
            'nextStageStatus' => $newStatus,
        ], "Application {$app['tracking_id']} status updated to '$newStatus'.");
    }

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[SAJ_UPDATE_STATUS_ERROR] ' . $e->getMessage());
    jsonError('Failed to update status: ' . $e->getMessage(), 500);
}

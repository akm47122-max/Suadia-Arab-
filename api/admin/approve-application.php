<?php
/**
 * Application Processing & Dossier Approval API
 * POST /api/admin/approve-application.php
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
$admin = Auth::requireAdminRole($pdo, ['super_admin', 'recruitment_admin']);

$input = getJsonInput();
$applicationId = (int)($input['applicationId'] ?? $input['application_id'] ?? 0);
$action = $input['action'] ?? 'approve'; // 'approve', 'reject', or 'request_docs'
$notes = Auth::sanitize($input['notes'] ?? 'All credentials and CNIC authenticated.');
$rejectionReason = Auth::sanitize($input['rejectionReason'] ?? $input['reason'] ?? 'Incomplete educational documents.');
$additionalDocs = Auth::sanitize($input['additionalDocs'] ?? $input['documentsRequested'] ?? 'Police character clearance certificate');

if ($applicationId <= 0) {
    jsonError('Valid application ID required.');
}

$appStmt = $pdo->prepare('SELECT * FROM applications WHERE id = ? LIMIT 1');
$appStmt->execute([$applicationId]);
$app = $appStmt->fetch();

if (!$app) {
    jsonError('Application not found.', 404);
}

$adminName = $admin['full_name'] . ' (' . $admin['role'] . ')';

try {
    $pdo->beginTransaction();

    if ($action === 'approve') {
        $upd = $pdo->prepare('
            UPDATE applications 
            SET status = "Ballot Eligible", next_stage_status = "Ballot Scheduled",
                reviewer_id = ?, reviewer_name = ?, reviewed_at = NOW(), review_notes = ?
            WHERE id = ?
        ');
        $upd->execute([$admin['id'], $adminName, $notes, $applicationId]);

        // Insert into ballot_eligibility
        $eventStmt = $pdo->query('SELECT id FROM ballot_events WHERE scheduled_date = "2026-12-22" LIMIT 1');
        $eventId = (int)($eventStmt->fetchColumn() ?: 1);

        $elStmt = $pdo->prepare('
            INSERT IGNORE INTO ballot_eligibility (ballot_event_id, application_id, qualification_verified, payment_verified)
            VALUES (?, ?, 1, 1)
        ');
        $elStmt->execute([$eventId, $applicationId]);

        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, "Ballot Eligible", ?, ?)
        ');
        $hist->execute([$applicationId, $adminName, $notes]);

        Auth::logAudit($pdo, 'APPLICATION_APPROVED', "Application {$app['tracking_id']} approved as Ballot Eligible", $adminName, $admin['role']);
        $pdo->commit();
        jsonSuccess(['status' => 'Ballot Eligible'], "Application {$app['tracking_id']} approved and added to ballot eligible pool.");

    } elseif ($action === 'reject') {
        $upd = $pdo->prepare('
            UPDATE applications 
            SET status = "Rejected", next_stage_status = "Application Closed",
                reviewer_id = ?, reviewer_name = ?, reviewed_at = NOW(), rejection_reason = ?
            WHERE id = ?
        ');
        $upd->execute([$admin['id'], $adminName, $rejectionReason, $applicationId]);

        // Remove from eligibility
        $delEl = $pdo->prepare('DELETE FROM ballot_eligibility WHERE application_id = ?');
        $delEl->execute([$applicationId]);

        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, "Rejected", ?, ?)
        ');
        $hist->execute([$applicationId, $adminName, "Rejected: $rejectionReason"]);

        Auth::logAudit($pdo, 'APPLICATION_REJECTED', "Application {$app['tracking_id']} rejected: $rejectionReason", $adminName, $admin['role']);
        $pdo->commit();
        jsonSuccess(['status' => 'Rejected'], "Application {$app['tracking_id']} rejected.");

    } elseif ($action === 'request_docs') {
        $upd = $pdo->prepare('
            UPDATE applications 
            SET status = "Documents Required", additional_docs_requested = ?
            WHERE id = ?
        ');
        $upd->execute([$additionalDocs, $applicationId]);

        $hist = $pdo->prepare('
            INSERT INTO application_status_history (application_id, status, changed_by, notes)
            VALUES (?, "Documents Required", ?, ?)
        ');
        $hist->execute([$applicationId, $adminName, "Requested additional documents: $additionalDocs"]);

        Auth::logAudit($pdo, 'DOCUMENTS_REQUESTED', "Requested documents for {$app['tracking_id']}: $additionalDocs", $adminName, $admin['role']);
        $pdo->commit();
        jsonSuccess(['status' => 'Documents Required'], "Additional documents requested for {$app['tracking_id']}.");
    } else {
        $pdo->rollBack();
        jsonError('Unrecognized application processing action.');
    }

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[SAJ_APP_APPROVE_ERROR] ' . $e->getMessage());
    jsonError('Failed to update application processing status: ' . $e->getMessage(), 500);
}

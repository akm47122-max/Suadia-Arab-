<?php
/**
 * Computerized Ballot Management & Selection Engine API
 * POST /api/admin/ballot.php
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
$action = $input['action'] ?? 'run_draw'; // 'run_draw' or 'update_date'
$adminName = $admin['full_name'] . ' (' . $admin['role'] . ')';

if ($action === 'update_date') {
    $newDate = $input['ballotDate'] ?? '2026-12-22';
    $newDeadline = $input['deadline'] ?? '2026-12-10';

    $upd = $pdo->prepare('
        UPDATE ballot_events 
        SET scheduled_date = ?, application_deadline = ? 
        WHERE id = 1 OR scheduled_date = "2026-12-22"
    ');
    $upd->execute([$newDate, $newDeadline]);

    $updSetting = $pdo->prepare('UPDATE website_settings SET setting_value = ? WHERE setting_key = "ballot_date"');
    $updSetting->execute([$newDate]);

    Auth::logAudit($pdo, 'BALLOT_DATE_UPDATED', "Ballot scheduled date updated to $newDate", $adminName, $admin['role']);
    jsonSuccess(['ballotDate' => $newDate], 'Ballot schedule updated successfully.');
}

// Execute verifiable computerized draw
$quotaCount = max(1, (int)($input['quotaCount'] ?? $input['selection_count'] ?? 25));
$customSeed = trim($input['seed'] ?? ('SEED-SAJ-' . time() . '-' . rand(1000, 9999)));

// Fetch only Ballot Eligible candidates
$eligibleStmt = $pdo->query('
    SELECT id, tracking_id, user_id 
    FROM applications 
    WHERE status = "Ballot Eligible" 
    ORDER BY id ASC
');
$eligible = $eligibleStmt->fetchAll();

if (empty($eligible)) {
    jsonError('No candidates currently have "Ballot Eligible" status. Approve processing first.');
}

try {
    $pdo->beginTransaction();

    // Deterministic pseudo-random shuffle based on seed
    srand((int)crc32($customSeed));
    shuffle($eligible);

    $selected = array_slice($eligible, 0, min($quotaCount, count($eligible)));
    $selectedIds = array_column($selected, 'id');
    $selectedCount = count($selected);

    // Fetch ballot event id
    $eventStmt = $pdo->query('SELECT id FROM ballot_events WHERE scheduled_date = "2026-12-22" LIMIT 1');
    $eventId = (int)($eventStmt->fetchColumn() ?: 1);

    // Clean previous draw results for this event if re-running
    $delBr = $pdo->prepare('DELETE FROM ballot_results WHERE ballot_event_id = ?');
    $delBr->execute([$eventId]);

    // Update selected applications
    $inQuery = implode(',', array_fill(0, count($selectedIds), '?'));
    $updSelected = $pdo->prepare("
        UPDATE applications 
        SET next_stage_status = 'Selected for Next Stage' 
        WHERE id IN ($inQuery)
    ");
    $updSelected->execute($selectedIds);

    // Insert into ballot_results table
    $insBr = $pdo->prepare('
        INSERT INTO ballot_results (ballot_event_id, application_id, selection_rank, status)
        VALUES (?, ?, ?, "Selected")
    ');
    foreach ($selectedIds as $rank => $appId) {
        $insBr->execute([$eventId, $appId, $rank + 1]);
    }

    // Update ballot event
    $updEvent = $pdo->prepare('
        UPDATE ballot_events 
        SET status = "Draw Completed", random_seed = ?, published_at = NOW(), published_by = ? 
        WHERE id = ?
    ');
    $updEvent->execute([$customSeed, $adminName, $eventId]);

    // Record status history for selected candidates
    $histStmt = $pdo->prepare('
        INSERT INTO application_status_history (application_id, status, changed_by, notes)
        VALUES (?, "Selected for Next Stage", "Computerized Ballot Draw Engine", ?)
    ');
    $proofNote = "Selected in official computerized draw. Audit Seed Proof: $customSeed";
    foreach ($selectedIds as $appId) {
        $histStmt->execute([$appId, $proofNote]);
    }

    $pdo->commit();

    Auth::logAudit(
        $pdo,
        'BALLOT_DRAW_EXECUTED',
        "Ballot draw executed with seed $customSeed. Selected $selectedCount of " . count($eligible) . " candidates.",
        $adminName,
        $admin['role']
    );

    jsonSuccess([
        'selectedCount' => $selectedCount,
        'seed' => $customSeed,
        'selectedApplicationIds' => array_map('strval', $selectedIds),
    ], "Computerized ballot completed. $selectedCount candidates selected with verified seed proof.");

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[SAJ_BALLOT_ERROR] ' . $e->getMessage());
    jsonError('Failed to execute ballot draw: ' . $e->getMessage(), 500);
}

<?php
/**
 * System Audit Script - Pillars to Home
 * Run via Cron: php audit.php
 */
require_once 'includes/db.php';
require_once 'includes/functions.php';

echo "Starting System Audit...\n";

$issues = [];

// 1. Check Database Connection
try {
    $pdo->query("SELECT 1");
    echo "✔ Database connection: OK\n";
} catch (PDOException $e) {
    $issues[] = "Database connection failed: " . $e->getMessage();
}

// 2. Check Lead Capture
$stmt = $pdo->query("SELECT COUNT(*) FROM leads WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
$recent_leads = $stmt->fetchColumn();
if ($recent_leads == 0) {
    // This might not be an error if there's no traffic, but good to log as a warning
    logSystem('warning', "No leads captured in the last hour. Verify form functionality.");
    echo "⚠ No leads in last hour (Warning)\n";
} else {
    echo "✔ Recent leads captured: $recent_leads\n";
}

// 3. Check System Logs for Errors
$stmt = $pdo->query("SELECT COUNT(*) FROM system_logs WHERE log_level = 'error' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)");
$recent_errors = $stmt->fetchColumn();
if ($recent_errors > 0) {
    $issues[] = "$recent_errors system errors logged in the last 24 hours.";
    echo "✘ $recent_errors errors found in system logs\n";
} else {
    echo "✔ No system errors in last 24 hours\n";
}

// 4. Check API Health
$api_url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]/api/save_lead.php";
// In a real CLI environment, we'd use curl, but for this script we'll just check file existence
if (!file_exists(__DIR__ . '/api/save_lead.php')) {
    $issues[] = "API file save_lead.php is missing.";
}
if (!file_exists(__DIR__ . '/api/track_event.php')) {
    $issues[] = "API file track_event.php is missing.";
}

// Log results
if (empty($issues)) {
    logSystem('info', "System Audit Passed successfully.");
    echo "Audit Complete: All systems operational.\n";
} else {
    foreach ($issues as $issue) {
        logSystem('error', "Audit Issue: $issue");
        echo "ERROR: $issue\n";
    }
}
?>

<?php
require_once 'db.php';
check_login();

$battalion = current_battalion();

// 1. Count Total Active Cadets in logged-in battalion
$stmtCadets = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM cadets WHERE status = 'Active' AND wing = ?");
mysqli_stmt_bind_param($stmtCadets, "s", $battalion);
mysqli_stmt_execute($stmtCadets);
$totalCadets = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtCadets))['total'];

// Year-wise counts
$yearCounts = ['1st Year' => 0, '2nd Year' => 0, '3rd Year' => 0];
$stmtYears = mysqli_prepare($conn, "SELECT year_of_study, COUNT(*) AS cnt FROM cadets WHERE status = 'Active' AND wing = ? GROUP BY year_of_study");
mysqli_stmt_bind_param($stmtYears, "s", $battalion);
mysqli_stmt_execute($stmtYears);
$resYears = mysqli_stmt_get_result($stmtYears);
while ($yr = mysqli_fetch_assoc($resYears)) {
    if (isset($yearCounts[$yr['year_of_study']])) {
        $yearCounts[$yr['year_of_study']] = (int)$yr['cnt'];
    }
}

// 2. Count Present Cadets on the latest recorded attendance date for this battalion
$stmtLatest = mysqli_prepare(
    $conn,
    "SELECT MAX(a.attendance_date) AS latest_date
     FROM attendance a
     JOIN cadets c ON a.cadet_id = c.id
     WHERE c.wing = ?"
);
mysqli_stmt_bind_param($stmtLatest, "s", $battalion);
mysqli_stmt_execute($stmtLatest);
$latestDate = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtLatest))['latest_date'];

$presentCount = 0;
$absentCount = 0;
if ($latestDate) {
    $stmtAtt = mysqli_prepare(
        $conn,
        "SELECT
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_cnt,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_cnt
         FROM attendance a
         JOIN cadets c ON a.cadet_id = c.id
         WHERE a.attendance_date = ? AND c.wing = ?"
    );
    mysqli_stmt_bind_param($stmtAtt, "ss", $latestDate, $battalion);
    mysqli_stmt_execute($stmtAtt);
    $attRow = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtAtt));
    $presentCount = (int)($attRow['present_cnt'] ?? 0);
    $absentCount = (int)($attRow['absent_cnt'] ?? 0);
}

// 3. Count Upcoming Events for this battalion
$stmtEvCount = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM events WHERE wing = ? AND status IN ('Upcoming', 'Ongoing')");
mysqli_stmt_bind_param($stmtEvCount, "s", $battalion);
mysqli_stmt_execute($stmtEvCount);
$upcomingEventsCount = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtEvCount))['total'];

// 4. Count Total Achievements for this battalion
$stmtAchCount = mysqli_prepare(
    $conn,
    "SELECT COUNT(*) AS total FROM achievements a JOIN cadets c ON a.cadet_id = c.id WHERE c.wing = ?"
);
mysqli_stmt_bind_param($stmtAchCount, "s", $battalion);
mysqli_stmt_execute($stmtAchCount);
$totalAchievements = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtAchCount))['total'];

// Fetch Upcoming Events list
$stmtEvList = mysqli_prepare($conn, "SELECT * FROM events WHERE wing = ? AND status IN ('Upcoming', 'Ongoing') ORDER BY event_date ASC LIMIT 5");
mysqli_stmt_bind_param($stmtEvList, "s", $battalion);
mysqli_stmt_execute($stmtEvList);
$upcomingEvents = mysqli_stmt_get_result($stmtEvList);

// Fetch Recent Achievements joined with Cadet name
$stmtAchList = mysqli_prepare(
    $conn,
    "SELECT a.*, c.full_name, c.rank_title, c.regimental_no
     FROM achievements a
     JOIN cadets c ON a.cadet_id = c.id
     WHERE c.wing = ?
     ORDER BY a.achieved_date DESC LIMIT 5"
);
mysqli_stmt_bind_param($stmtAchList, "s", $battalion);
mysqli_stmt_execute($stmtAchList);
$recentAchievements = mysqli_stmt_get_result($stmtAchList);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - NCC Cadet Management Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="layout">
    <?php include 'sidebar.php'; ?>

    <div class="main-content">
        <header class="topbar">
            <div class="topbar-left">
                <button type="button" class="menu-btn" onclick="toggleSidebar()">Menu</button>
                <h1>Dashboard</h1>
            </div>
            <div class="topbar-right">
                <span>Welcome, <strong><?php echo clean($_SESSION['admin_name']); ?> (<?php echo clean($battalion); ?>)</strong></span>
                <a href="logout.php" class="btn btn-outline btn-sm">Logout</a>
            </div>
        </header>

        <main class="page-body">
            <!-- Summary Metric Cards -->
            <div class="cards-row">
                <div class="stat-card">
                    <div class="stat-label">Total Cadets</div>
                    <div class="stat-number"><?php echo $totalCadets; ?></div>
                    <div class="stat-note"><?php echo clean($battalion); ?> Bn NCC</div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">Present Cadets</div>
                    <div class="stat-number"><?php echo $presentCount; ?></div>
                    <div class="stat-note">
                        <?php echo $latestDate ? "Parade on " . date('d M Y', strtotime($latestDate)) . " ($absentCount absent)" : "No attendance marked"; ?>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">Upcoming Events</div>
                    <div class="stat-number"><?php echo $upcomingEventsCount; ?></div>
                    <div class="stat-note">Camps &amp; parades</div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">Achievements</div>
                    <div class="stat-number"><?php echo $totalAchievements; ?></div>
                    <div class="stat-note">Certificates &amp; awards</div>
                </div>
            </div>

            <!-- Active Battalion ANO & Year Breakdown -->
            <div class="cards-row">
                <div class="stat-card">
                    <div class="stat-label"><?php echo clean($battalion); ?> Battalion ANO</div>
                    <div style="font-size: 16px; font-weight: bold; color: #2f3613; margin-top: 6px;"><?php echo clean($_SESSION['admin_name']); ?></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">1st Year (Batch 2026-27)</div>
                    <div class="stat-number"><?php echo $yearCounts['1st Year']; ?></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">2nd Year (Batch 2025-26)</div>
                    <div class="stat-number"><?php echo $yearCounts['2nd Year']; ?></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">3rd Year (Batch 2024-25)</div>
                    <div class="stat-number"><?php echo $yearCounts['3rd Year']; ?></div>
                </div>
            </div>

            <!-- Quick Links -->
            <div class="btn-bar">
                <a href="cadets.php" class="btn btn-primary">+ Manage Cadets</a>
                <a href="attendance.php" class="btn btn-outline">Mark Attendance</a>
                <a href="events.php" class="btn btn-outline">+ Add Event</a>
                <a href="achievements.php" class="btn btn-outline">+ Record Achievement</a>
            </div>

            <!-- Two-column Dashboard Tables -->
            <div class="two-col">
                <section class="panel">
                    <div class="panel-header">
                        <h2>Upcoming Camps &amp; Events</h2>
                        <a href="events.php">View All</a>
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                            <?php if (mysqli_num_rows($upcomingEvents) === 0): ?>
                                <tr><td colspan="4">No upcoming events found.</td></tr>
                            <?php else: ?>
                                <?php while ($ev = mysqli_fetch_assoc($upcomingEvents)): ?>
                                    <tr>
                                        <td>
                                            <strong><?php echo clean($ev['title']); ?></strong>
                                            <div class="subtext"><?php echo clean($ev['location']); ?></div>
                                        </td>
                                        <td><?php echo clean($ev['event_type']); ?></td>
                                        <td><?php echo date('d M Y', strtotime($ev['event_date'])); ?></td>
                                        <td><span class="badge badge-green"><?php echo clean($ev['status']); ?></span></td>
                                    </tr>
                                <?php endwhile; ?>
                            <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section class="panel">
                    <div class="panel-header">
                        <h2>Recent Cadet Achievements</h2>
                        <a href="achievements.php">View All</a>
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Cadet</th>
                                    <th>Achievement</th>
                                    <th>Category</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                            <?php if (mysqli_num_rows($recentAchievements) === 0): ?>
                                <tr><td colspan="4">No achievements recorded yet.</td></tr>
                            <?php else: ?>
                                <?php while ($ach = mysqli_fetch_assoc($recentAchievements)): ?>
                                    <tr>
                                        <td>
                                            <strong><?php echo clean($ach['rank_title'] . ' ' . $ach['full_name']); ?></strong>
                                            <div class="subtext"><?php echo clean($ach['regimental_no']); ?></div>
                                        </td>
                                        <td>
                                            <?php echo clean($ach['title']); ?>
                                            <div class="subtext"><?php echo clean($ach['level']); ?> Level</div>
                                        </td>
                                        <td><span class="badge badge-olive"><?php echo clean($ach['category']); ?></span></td>
                                        <td><?php echo date('d M Y', strtotime($ach['achieved_date'])); ?></td>
                                    </tr>
                                <?php endwhile; ?>
                            <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    </div>
</div>
<script src="script.js"></script>
</body>
</html>

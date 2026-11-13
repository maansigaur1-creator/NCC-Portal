<?php
require_once 'db.php';
check_login();

$battalion = current_battalion();
$markYear = trim($_GET['mark_year'] ?? ($_POST['mark_year'] ?? ''));
$message = "";

// Handle Attendance Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $postDate = $_POST['attendance_date'] ?? date('Y-m-d');
    $topic    = trim($_POST['parade_topic'] ?? '2 Raj Parade / Class');
    $statuses = $_POST['status'] ?? [];
    $remarks  = $_POST['remarks'] ?? [];

    // Save or update attendance for each cadet
    $stmt = mysqli_prepare(
        $conn,
        "INSERT INTO attendance (cadet_id, attendance_date, parade_topic, status, remarks)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE parade_topic = VALUES(parade_topic), status = VALUES(status), remarks = VALUES(remarks)"
    );

    foreach ($statuses as $cadetId => $attStatus) {
        $cid = (int)$cadetId;
        $cleanStatus = ($attStatus === 'Absent') ? 'Absent' : 'Present';
        $rem = trim($remarks[$cadetId] ?? '');
        mysqli_stmt_bind_param($stmt, "issss", $cid, $postDate, $topic, $cleanStatus, $rem);
        mysqli_stmt_execute($stmt);
    }

    $selectedDate = $postDate;
    $message = "Attendance saved for " . date('d M Y', strtotime($postDate)) . ".";
}

// Fetch all recorded parade dates for this battalion
$recordedDates = [];
$stmtDates = mysqli_prepare(
    $conn,
    "SELECT a.attendance_date,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count
     FROM attendance a
     JOIN cadets c ON a.cadet_id = c.id
     WHERE c.wing = ?
     GROUP BY a.attendance_date
     ORDER BY a.attendance_date DESC"
);
mysqli_stmt_bind_param($stmtDates, "s", $battalion);
mysqli_stmt_execute($stmtDates);
$datesRes = mysqli_stmt_get_result($stmtDates);
while ($d = mysqli_fetch_assoc($datesRes)) {
    $recordedDates[] = $d;
}

if (!isset($selectedDate)) {
    $selectedDate = $_GET['date'] ?? ($recordedDates[0]['attendance_date'] ?? date('Y-m-d'));
}

// Fetch active cadets in current battalion (optionally filtered by year) with attendance for $selectedDate
$sqlCadets = "SELECT c.id, c.regimental_no, c.full_name, c.rank_title, c.wing, c.year_of_study, c.college_branch,
                     a.status AS att_status, a.remarks AS att_remarks, a.parade_topic
              FROM cadets c
              LEFT JOIN attendance a ON c.id = a.cadet_id AND a.attendance_date = ?
              WHERE c.status = 'Active' AND c.wing = ?";
if ($markYear !== '') {
    $sqlCadets .= " AND c.year_of_study = ?";
}
$sqlCadets .= " ORDER BY c.year_of_study ASC, c.regimental_no ASC";

$stmtCadets = mysqli_prepare($conn, $sqlCadets);
if ($markYear !== '') {
    mysqli_stmt_bind_param($stmtCadets, "sss", $selectedDate, $battalion, $markYear);
} else {
    mysqli_stmt_bind_param($stmtCadets, "ss", $selectedDate, $battalion);
}
mysqli_stmt_execute($stmtCadets);
$cadetsList = mysqli_stmt_get_result($stmtCadets);

// Detect existing parade topic if already marked for this date
$rows = [];
$currentTopic = ($selectedDate === '2026-08-15') ? "Independence Day Parade" : "$battalion Parade / Class";
while ($r = mysqli_fetch_assoc($cadetsList)) {
    if (!empty($r['parade_topic'])) {
        $currentTopic = $r['parade_topic'];
    }
    $rows[] = $r;
}

// Fetch cadets in battalion for history filter dropdown
$allCadets = [];
$stmtDropdown = mysqli_prepare($conn, "SELECT id, regimental_no, full_name FROM cadets WHERE wing = ? ORDER BY regimental_no ASC");
mysqli_stmt_bind_param($stmtDropdown, "s", $battalion);
mysqli_stmt_execute($stmtDropdown);
$cadetsDropdownRes = mysqli_stmt_get_result($stmtDropdown);
while ($cd = mysqli_fetch_assoc($cadetsDropdownRes)) {
    $allCadets[] = $cd;
}

// Fetch Attendance History Records (filtered by battalion + optional year, date, or cadet)
$historyYear  = trim($_GET['history_year'] ?? '');
$historyDate  = trim($_GET['history_date'] ?? '');
$historyCadet = (int)($_GET['cadet_id'] ?? 0);
$showAll      = isset($_GET['show']) && $_GET['show'] === 'all';

$whereClauses = ["c.wing = ?"];
$types = "s";
$params = [$battalion];

if ($historyYear !== '') {
    $whereClauses[] = "c.year_of_study = ?";
    $types .= "s";
    $params[] = $historyYear;
}
if ($historyDate !== '') {
    $whereClauses[] = "a.attendance_date = ?";
    $types .= "s";
    $params[] = $historyDate;
}
if ($historyCadet > 0) {
    $whereClauses[] = "a.cadet_id = ?";
    $types .= "i";
    $params[] = $historyCadet;
}

$sqlHist = "SELECT a.*, c.regimental_no, c.full_name, c.rank_title, c.year_of_study
            FROM attendance a
            JOIN cadets c ON a.cadet_id = c.id
            WHERE " . implode(" AND ", $whereClauses) . "
            ORDER BY a.attendance_date DESC, c.regimental_no ASC";
if (count($whereClauses) === 1 && !$showAll) {
    $sqlHist .= " LIMIT 50";
}

$stmtHist = mysqli_prepare($conn, $sqlHist);
mysqli_stmt_bind_param($stmtHist, $types, ...$params);
mysqli_stmt_execute($stmtHist);
$historyResult = mysqli_stmt_get_result($stmtHist);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance - NCC Cadet Management Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="layout">
    <?php include 'sidebar.php'; ?>

    <div class="main-content">
        <header class="topbar">
            <div class="topbar-left">
                <button type="button" class="menu-btn" onclick="toggleSidebar()">Menu</button>
                <h1><?php echo clean($battalion); ?> Attendance</h1>
            </div>
            <div class="topbar-right">
                <span><?php echo clean($_SESSION['admin_name']); ?> (<?php echo clean($battalion); ?>)</span>
                <a href="logout.php" class="btn btn-outline btn-sm">Logout</a>
            </div>
        </header>

        <main class="page-body">
            <?php if ($message !== ''): ?>
                <div class="alert alert-success"><?php echo clean($message); ?></div>
            <?php endif; ?>

            <!-- Mark Attendance Panel -->
            <section class="panel">
                <div class="panel-header">
                    <h2>Mark Attendance</h2>
                    <form method="GET" action="attendance.php" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                        <select name="mark_year" onchange="this.form.submit()" style="width:auto;">
                            <option value="">All Years</option>
                            <?php foreach (['2nd Year', '3rd Year', '4th Year'] as $yr): ?>
                                <option value="<?php echo $yr; ?>" <?php if ($markYear === $yr) echo 'selected'; ?>><?php echo $yr; ?></option>
                            <?php endforeach; ?>
                        </select>
                        <?php if (!empty($recordedDates)): ?>
                            <select onchange="if(this.value) window.location='attendance.php?date='+this.value+'&mark_year=<?php echo urlencode($markYear); ?>';" style="width:auto;">
                                <option value="">Recorded parade dates...</option>
                                <?php foreach ($recordedDates as $rd): ?>
                                    <option value="<?php echo clean($rd['attendance_date']); ?>" <?php if ($selectedDate === $rd['attendance_date']) echo 'selected'; ?>>
                                        <?php echo date('d M Y', strtotime($rd['attendance_date'])) . " ({$rd['present_count']}P / {$rd['absent_count']}A)"; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        <?php endif; ?>
                        <label for="datePicker"><strong>Date:</strong></label>
                        <input type="date" id="datePicker" name="date" value="<?php echo clean($selectedDate); ?>" style="width:auto;">
                        <button type="submit" class="btn btn-outline btn-sm">Load</button>
                    </form>
                </div>

                <form method="POST" action="attendance.php?date=<?php echo clean($selectedDate); ?>&mark_year=<?php echo urlencode($markYear); ?>">
                    <input type="hidden" name="attendance_date" value="<?php echo clean($selectedDate); ?>">
                    <input type="hidden" name="mark_year" value="<?php echo clean($markYear); ?>">

                    <div class="filter-row" style="align-items:flex-end;">
                        <div class="form-group" style="flex:1; min-width:220px;">
                            <label>Parade / Training Topic</label>
                            <input type="text" name="parade_topic" value="<?php echo clean($currentTopic); ?>" required>
                        </div>
                        <button type="button" class="btn btn-outline btn-sm" onclick="markAll('Present')">Mark All Present</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="markAll('Absent')">Mark All Absent</button>
                    </div>

                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Regimental No.</th>
                                    <th>Cadet Name</th>
                                    <th>Year / Batch</th>
                                    <th>Status</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                            <?php if (empty($rows)): ?>
                                <tr><td colspan="5">No active cadets found for <?php echo clean($battalion); ?> Bn NCC.</td></tr>
                            <?php else: ?>
                                <?php foreach ($rows as $c):
                                    $checked = $c['att_status'] ?? 'Present';
                                ?>
                                    <tr>
                                        <td><?php echo clean($c['regimental_no']); ?></td>
                                        <td><strong><?php echo clean($c['rank_title'] . ' ' . $c['full_name']); ?></strong></td>
                                        <td><?php echo clean($c['year_of_study'] . ' · ' . $c['college_branch']); ?></td>
                                        <td style="white-space:nowrap;">
                                            <label style="margin-right:10px;">
                                                <input type="radio" name="status[<?php echo (int)$c['id']; ?>]" value="Present" <?php if ($checked === 'Present') echo 'checked'; ?>> Present
                                            </label>
                                            <label>
                                                <input type="radio" name="status[<?php echo (int)$c['id']; ?>]" value="Absent" <?php if ($checked === 'Absent') echo 'checked'; ?>> Absent
                                            </label>
                                        </td>
                                        <td>
                                            <input type="text" name="remarks[<?php echo (int)$c['id']; ?>]" value="<?php echo clean($c['att_remarks'] ?? ''); ?>" placeholder="Optional remark">
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                            </tbody>
                        </table>
                    </div>

                    <?php if (!empty($rows)): ?>
                        <div style="margin-top: 15px;">
                            <button type="submit" class="btn btn-primary">Save Attendance</button>
                        </div>
                    <?php endif; ?>
                </form>
            </section>

            <!-- Attendance History Records -->
            <section class="panel">
                <div class="panel-header">
                    <h2>Attendance Records</h2>
                    <form method="GET" action="attendance.php" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                        <input type="hidden" name="date" value="<?php echo clean($selectedDate); ?>">
                        <input type="hidden" name="mark_year" value="<?php echo clean($markYear); ?>">
                        <select name="history_year" style="width:auto;">
                            <option value="">All Years</option>
                            <?php foreach (['2nd Year', '3rd Year', '4th Year'] as $yr): ?>
                                <option value="<?php echo $yr; ?>" <?php if ($historyYear === $yr) echo 'selected'; ?>><?php echo $yr; ?></option>
                            <?php endforeach; ?>
                        </select>
                        <select name="history_date" style="width:auto;">
                            <option value="">All Parade Dates</option>
                            <?php foreach ($recordedDates as $rd): ?>
                                <option value="<?php echo clean($rd['attendance_date']); ?>" <?php if ($historyDate === $rd['attendance_date']) echo 'selected'; ?>>
                                    <?php echo date('d M Y', strtotime($rd['attendance_date'])) . " ({$rd['present_count']}P / {$rd['absent_count']}A)"; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <select name="cadet_id" style="width:auto;">
                            <option value="">All Cadets</option>
                            <?php foreach ($allCadets as $cd): ?>
                                <option value="<?php echo (int)$cd['id']; ?>" <?php if ($historyCadet === (int)$cd['id']) echo 'selected'; ?>>
                                    <?php echo clean($cd['full_name'] . ' (' . $cd['regimental_no'] . ')'); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <button type="submit" class="btn btn-outline btn-sm">Filter</button>
                        <?php if ($historyYear !== '' || $historyDate !== '' || $historyCadet > 0 || $showAll): ?>
                            <a href="attendance.php?date=<?php echo clean($selectedDate); ?>&mark_year=<?php echo urlencode($markYear); ?>" class="btn btn-outline btn-sm">Clear</a>
                        <?php else: ?>
                            <a href="attendance.php?date=<?php echo clean($selectedDate); ?>&mark_year=<?php echo urlencode($markYear); ?>&show=all" class="btn btn-outline btn-sm">Show All</a>
                        <?php endif; ?>
                    </form>
                </div>

                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Regimental No.</th>
                                <th>Cadet</th>
                                <th>Year</th>
                                <th>Parade Topic</th>
                                <th>Status</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php if (mysqli_num_rows($historyResult) === 0): ?>
                            <tr><td colspan="7">No attendance records found.</td></tr>
                        <?php else: ?>
                            <?php while ($h = mysqli_fetch_assoc($historyResult)): ?>
                                <tr>
                                    <td><?php echo date('d M Y', strtotime($h['attendance_date'])); ?></td>
                                    <td><?php echo clean($h['regimental_no']); ?></td>
                                    <td><?php echo clean($h['rank_title'] . ' ' . $h['full_name']); ?></td>
                                    <td><?php echo clean($h['year_of_study']); ?></td>
                                    <td><?php echo clean($h['parade_topic']); ?></td>
                                    <td>
                                        <span class="badge <?php echo $h['status'] === 'Present' ? 'badge-green' : 'badge-red'; ?>">
                                            <?php echo clean($h['status']); ?>
                                        </span>
                                    </td>
                                    <td><?php echo clean($h['remarks'] ?: '—'); ?></td>
                                </tr>
                            <?php endwhile; ?>
                        <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>
</div>
<script src="script.js"></script>
</body>
</html>

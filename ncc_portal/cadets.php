<?php
require_once 'db.php';
check_login();

$battalion = current_battalion();
$defaultUnit = ($battalion === '10 Raj') ? '10 Raj Bn NCC' : '2 Raj Bn NCC';
$anoName = ($battalion === '10 Raj') ? 'Lt. DS Chouhan' : 'Lt. Praveen Singh Jhala';

$message = "";
$error = "";

// 1. Handle Delete Request (?delete=ID) scoped to logged-in battalion
if (isset($_GET['delete'])) {
    $delId = (int)$_GET['delete'];
    $stmt = mysqli_prepare($conn, "DELETE FROM cadets WHERE id = ? AND wing = ?");
    mysqli_stmt_bind_param($stmt, "is", $delId, $battalion);
    if (mysqli_stmt_execute($stmt)) {
        $message = "Cadet deleted successfully.";
    }
}

// 2. Handle Add / Update Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $editId         = (int)($_POST['edit_id'] ?? 0);
    $regimentalNo   = strtoupper(trim($_POST['regimental_no'] ?? ''));
    $fullName       = trim($_POST['full_name'] ?? '');
    $rankTitle      = trim($_POST['rank_title'] ?? 'Cadet');
    $wing           = $battalion;
    $unitName       = trim($_POST['unit_name'] ?? $defaultUnit);
    $collegeBranch  = trim($_POST['college_branch'] ?? 'Batch 2026-27');
    $yearOfStudy    = trim($_POST['year_of_study'] ?? '1st Year');
    $phone          = trim($_POST['phone'] ?? '');
    $email          = trim($_POST['email'] ?? '');
    $bloodGroup     = trim($_POST['blood_group'] ?? '');
    $enrollmentDate = trim($_POST['enrollment_date'] ?? date('Y-m-d'));
    $status         = trim($_POST['status'] ?? 'Active');

    if ($regimentalNo === '' || $fullName === '') {
        $error = "Regimental number and full name are required.";
    } elseif ($editId > 0) {
        // Update existing cadet in current battalion
        $stmt = mysqli_prepare(
            $conn,
            "UPDATE cadets SET regimental_no=?, full_name=?, rank_title=?, wing=?, unit_name=?, college_branch=?, year_of_study=?, phone=?, email=?, blood_group=?, enrollment_date=?, status=? WHERE id=? AND wing=?"
        );
        mysqli_stmt_bind_param(
            $stmt,
            "ssssssssssssis",
            $regimentalNo, $fullName, $rankTitle, $wing, $unitName, $collegeBranch,
            $yearOfStudy, $phone, $email, $bloodGroup, $enrollmentDate, $status, $editId, $battalion
        );
        if (mysqli_stmt_execute($stmt)) {
            $message = "Cadet details updated successfully.";
        } else {
            $error = "Error updating cadet (Regimental No. might already exist).";
        }
    } else {
        // Insert new cadet under current battalion
        $stmt = mysqli_prepare(
            $conn,
            "INSERT INTO cadets (regimental_no, full_name, rank_title, wing, unit_name, college_branch, year_of_study, phone, email, blood_group, enrollment_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        mysqli_stmt_bind_param(
            $stmt,
            "ssssssssssss",
            $regimentalNo, $fullName, $rankTitle, $wing, $unitName, $collegeBranch,
            $yearOfStudy, $phone, $email, $bloodGroup, $enrollmentDate, $status
        );
        if (mysqli_stmt_execute($stmt)) {
            $message = "New cadet added successfully.";
        } else {
            $error = "Error adding cadet (Regimental No. might already exist).";
        }
    }
}

// 3. Check if Editing a Cadet (?edit=ID)
$editCadet = null;
if (isset($_GET['edit'])) {
    $eid = (int)$_GET['edit'];
    $stmt = mysqli_prepare($conn, "SELECT * FROM cadets WHERE id = ? AND wing = ?");
    mysqli_stmt_bind_param($stmt, "is", $eid, $battalion);
    mysqli_stmt_execute($stmt);
    $editCadet = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
}

// 4. Check if Viewing Full Cadet Details (?view=ID)
$viewCadet = null;
if (isset($_GET['view'])) {
    $vid = (int)$_GET['view'];
    $stmt = mysqli_prepare($conn, "SELECT * FROM cadets WHERE id = ? AND wing = ?");
    mysqli_stmt_bind_param($stmt, "is", $vid, $battalion);
    mysqli_stmt_execute($stmt);
    $viewCadet = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
}

// 5. Fetch Cadets for logged-in battalion (with optional year filter)
$yearFilter = $_GET['year'] ?? '';
if ($yearFilter !== '') {
    $stmt = mysqli_prepare($conn, "SELECT * FROM cadets WHERE wing = ? AND year_of_study = ? ORDER BY id ASC");
    mysqli_stmt_bind_param($stmt, "ss", $battalion, $yearFilter);
} else {
    $stmt = mysqli_prepare($conn, "SELECT * FROM cadets WHERE wing = ? ORDER BY id ASC");
    mysqli_stmt_bind_param($stmt, "s", $battalion);
}
mysqli_stmt_execute($stmt);
$cadetsResult = mysqli_stmt_get_result($stmt);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadets - NCC Cadet Management Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="layout">
    <?php include 'sidebar.php'; ?>

    <div class="main-content">
        <header class="topbar">
            <div class="topbar-left">
                <button type="button" class="menu-btn" onclick="toggleSidebar()">Menu</button>
                <h1><?php echo clean($battalion); ?> Cadets</h1>
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
            <?php if ($error !== ''): ?>
                <div class="alert alert-error"><?php echo clean($error); ?></div>
            <?php endif; ?>

            <!-- View Full Cadet Profile Box (when ?view=ID is clicked) -->
            <?php if ($viewCadet): ?>
                <section class="panel">
                    <div class="panel-header">
                        <h2>Cadet Profile: <?php echo clean($viewCadet['rank_title'] . ' ' . $viewCadet['full_name']); ?></h2>
                        <a href="cadets.php" class="btn btn-outline btn-sm">Close Profile</a>
                    </div>
                    <div class="details-grid">
                        <div class="detail-card"><small>Regimental No.</small><strong><?php echo clean($viewCadet['regimental_no']); ?></strong></div>
                        <div class="detail-card"><small>Battalion &amp; ANO</small><strong><?php echo clean($viewCadet['wing'] . ' · ' . $anoName); ?></strong></div>
                        <div class="detail-card"><small>Batch &amp; Year</small><strong><?php echo clean($viewCadet['college_branch'] . ' (' . $viewCadet['year_of_study'] . ')'); ?></strong></div>
                        <div class="detail-card"><small>Blood Group</small><strong><?php echo clean($viewCadet['blood_group'] !== '' ? $viewCadet['blood_group'] : '—'); ?></strong></div>
                        <div class="detail-card"><small>Phone</small><strong><?php echo clean($viewCadet['phone'] !== '' ? $viewCadet['phone'] : '—'); ?></strong></div>
                        <div class="detail-card"><small>Email</small><strong><?php echo clean($viewCadet['email'] !== '' ? $viewCadet['email'] : '—'); ?></strong></div>
                        <div class="detail-card"><small>Enrollment Date</small><strong><?php echo date('d M Y', strtotime($viewCadet['enrollment_date'])); ?></strong></div>
                    </div>
                </section>
            <?php endif; ?>

            <!-- Add / Edit Cadet Form -->
            <section class="panel">
                <div class="panel-header">
                    <h2><?php echo $editCadet ? "Edit Cadet Details" : "Add New " . clean($battalion) . " Cadet"; ?></h2>
                    <?php if ($editCadet): ?>
                        <a href="cadets.php" class="btn btn-outline btn-sm">Cancel Edit</a>
                    <?php endif; ?>
                </div>

                <form method="POST" action="cadets.php" class="form-grid">
                    <input type="hidden" name="edit_id" value="<?php echo $editCadet ? (int)$editCadet['id'] : 0; ?>">

                    <div class="form-group">
                        <label>Regimental Number *</label>
                        <input type="text" name="regimental_no" value="<?php echo clean($editCadet['regimental_no'] ?? ''); ?>" placeholder="e.g. RJ2026SDRV6520001" required>
                    </div>

                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="full_name" value="<?php echo clean($editCadet['full_name'] ?? ''); ?>" placeholder="Enter cadet full name" required>
                    </div>

                    <div class="form-group">
                        <label>NCC Rank</label>
                        <select name="rank_title">
                            <?php
                            $ranks = ['Cadet', 'L/Cpl', 'Cpl', 'Sgt', 'CQMS', 'CSM', 'JUO', 'SUO'];
                            $curRank = $editCadet['rank_title'] ?? 'Cadet';
                            foreach ($ranks as $r) {
                                $sel = ($curRank === $r) ? 'selected' : '';
                                echo "<option value='$r' $sel>$r</option>";
                            }
                            ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>NCC Battalion (ANO)</label>
                        <input type="text" value="<?php echo clean($battalion . ' · ' . $anoName); ?>" readonly style="background:#f7f9f3; color:#5c6352;">
                    </div>

                    <div class="form-group">
                        <label>Unit / Battalion Details *</label>
                        <input type="text" name="unit_name" value="<?php echo clean($editCadet['unit_name'] ?? $defaultUnit); ?>" required>
                    </div>

                    <div class="form-group">
                        <label>Batch / Branch *</label>
                        <input type="text" name="college_branch" value="<?php echo clean($editCadet['college_branch'] ?? 'Batch 2026-27'); ?>" required>
                    </div>

                    <div class="form-group">
                        <label>Year of Study</label>
                        <select name="year_of_study">
                            <?php
                            $curYear = $editCadet['year_of_study'] ?? '1st Year';
                            foreach (['1st Year', '2nd Year', '3rd Year', '4th Year'] as $y) {
                                $sel = ($curYear === $y) ? 'selected' : '';
                                echo "<option value='$y' $sel>$y</option>";
                            }
                            ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Blood Group</label>
                        <select name="blood_group">
                            <?php
                            $curBg = $editCadet['blood_group'] ?? '';
                            $selEmpty = ($curBg === '') ? 'selected' : '';
                            echo "<option value='' $selEmpty>Not Specified</option>";
                            foreach (['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as $bg) {
                                $sel = ($curBg === $bg) ? 'selected' : '';
                                echo "<option value='$bg' $sel>$bg</option>";
                            }
                            ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" name="phone" value="<?php echo clean($editCadet['phone'] ?? ''); ?>" placeholder="Optional 10-digit mobile number">
                    </div>

                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" name="email" value="<?php echo clean($editCadet['email'] ?? ''); ?>" placeholder="Optional email address">
                    </div>

                    <div class="form-group">
                        <label>Enrollment Date *</label>
                        <input type="date" name="enrollment_date" value="<?php echo clean($editCadet['enrollment_date'] ?? date('Y-m-d')); ?>" required>
                    </div>

                    <div class="full-width">
                        <button type="submit" class="btn btn-primary">
                            <?php echo $editCadet ? "Update Cadet" : "Add Cadet"; ?>
                        </button>
                    </div>
                </form>
            </section>

            <!-- Cadets List Table -->
            <section class="panel">
                <div class="panel-header">
                    <h2><?php echo clean($battalion); ?> Bn NCC Cadets List (<?php echo mysqli_num_rows($cadetsResult); ?>)</h2>
                </div>

                <form method="GET" action="cadets.php" class="filter-row">
                    <input type="text" id="searchInput" onkeyup="filterCadetsTable()" placeholder="Search cadets by name, regimental no, or batch...">
                    <select name="year" onchange="this.form.submit()">
                        <option value="">All Years</option>
                        <option value="1st Year" <?php if ($yearFilter === '1st Year') echo 'selected'; ?>>1st Year (Batch 2026-27)</option>
                        <option value="2nd Year" <?php if ($yearFilter === '2nd Year') echo 'selected'; ?>>2nd Year (Batch 2025-26)</option>
                        <option value="3rd Year" <?php if ($yearFilter === '3rd Year') echo 'selected'; ?>>3rd Year (Batch 2024-25)</option>
                        <option value="4th Year" <?php if ($yearFilter === '4th Year') echo 'selected'; ?>>4th Year</option>
                    </select>
                    <?php if ($yearFilter !== ''): ?>
                        <a href="cadets.php" class="btn btn-outline btn-sm">Reset</a>
                    <?php endif; ?>
                </form>

                <div class="table-wrap">
                    <table id="cadetsTable">
                        <thead>
                            <tr>
                                <th>Regimental No.</th>
                                <th>Name</th>
                                <th>Rank &amp; Battalion</th>
                                <th>Batch &amp; Year</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php if (mysqli_num_rows($cadetsResult) === 0): ?>
                            <tr><td colspan="6">No cadet records found for <?php echo clean($battalion); ?> Bn NCC.</td></tr>
                        <?php else: ?>
                            <?php while ($c = mysqli_fetch_assoc($cadetsResult)): ?>
                                <tr>
                                    <td><?php echo clean($c['regimental_no']); ?></td>
                                    <td>
                                        <strong><?php echo clean($c['full_name']); ?></strong>
                                        <div class="subtext"><?php echo clean($c['unit_name']); ?></div>
                                    </td>
                                    <td>
                                        <?php echo clean($c['rank_title'] . ' · ' . $c['wing']); ?>
                                        <div class="subtext"><?php echo clean($anoName); ?></div>
                                    </td>
                                    <td><?php echo clean($c['college_branch'] . ' (' . $c['year_of_study'] . ')'); ?></td>
                                    <td><?php echo clean($c['phone'] !== '' ? $c['phone'] : '—'); ?></td>
                                    <td style="white-space: nowrap;">
                                        <a href="cadets.php?view=<?php echo (int)$c['id']; ?>" class="btn btn-outline btn-sm">View</a>
                                        <a href="cadets.php?edit=<?php echo (int)$c['id']; ?>" class="btn btn-outline btn-sm">Edit</a>
                                        <a href="cadets.php?delete=<?php echo (int)$c['id']; ?>" class="btn btn-danger btn-sm" onclick="return confirmDelete();">Delete</a>
                                    </td>
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

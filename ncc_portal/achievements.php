<?php
require_once 'db.php';
check_login();

$battalion = current_battalion();
$message = "";
$error = "";

// 1. Handle Delete Request (?delete=ID) scoped to logged-in battalion
if (isset($_GET['delete'])) {
    $delId = (int)$_GET['delete'];
    $stmt = mysqli_prepare(
        $conn,
        "DELETE a FROM achievements a JOIN cadets c ON a.cadet_id = c.id WHERE a.id = ? AND c.wing = ?"
    );
    mysqli_stmt_bind_param($stmt, "is", $delId, $battalion);
    if (mysqli_stmt_execute($stmt)) {
        $message = "Achievement deleted successfully.";
    }
}

// 2. Handle Add / Edit Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $editId       = (int)($_POST['edit_id'] ?? 0);
    $cadetId      = (int)($_POST['cadet_id'] ?? 0);
    $title        = trim($_POST['title'] ?? '');
    $category     = trim($_POST['category'] ?? 'Certificate');
    $level        = trim($_POST['level'] ?? 'Unit');
    $achievedDate = trim($_POST['achieved_date'] ?? date('Y-m-d'));
    $remarks      = trim($_POST['remarks'] ?? '');

    if ($cadetId <= 0 || $title === '' || $achievedDate === '') {
        $error = "Please select a cadet, enter title, and choose a date.";
    } elseif ($editId > 0) {
        $stmt = mysqli_prepare(
            $conn,
            "UPDATE achievements SET cadet_id=?, title=?, category=?, level=?, achieved_date=?, remarks=? WHERE id=?"
        );
        mysqli_stmt_bind_param($stmt, "isssssi", $cadetId, $title, $category, $level, $achievedDate, $remarks, $editId);
        if (mysqli_stmt_execute($stmt)) {
            $message = "Achievement updated successfully.";
        }
    } else {
        $stmt = mysqli_prepare(
            $conn,
            "INSERT INTO achievements (cadet_id, title, category, level, achieved_date, remarks) VALUES (?, ?, ?, ?, ?, ?)"
        );
        mysqli_stmt_bind_param($stmt, "isssss", $cadetId, $title, $category, $level, $achievedDate, $remarks);
        if (mysqli_stmt_execute($stmt)) {
            $message = "Achievement recorded successfully.";
        }
    }
}

// 3. Check if Editing an Achievement (?edit=ID)
$editAch = null;
if (isset($_GET['edit'])) {
    $eid = (int)$_GET['edit'];
    $stmt = mysqli_prepare(
        $conn,
        "SELECT a.* FROM achievements a JOIN cadets c ON a.cadet_id = c.id WHERE a.id = ? AND c.wing = ?"
    );
    mysqli_stmt_bind_param($stmt, "is", $eid, $battalion);
    mysqli_stmt_execute($stmt);
    $editAch = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
}

// Fetch Cadets in current battalion for dropdown menu
$stmtDropdown = mysqli_prepare($conn, "SELECT id, regimental_no, full_name, rank_title FROM cadets WHERE wing = ? ORDER BY full_name ASC");
mysqli_stmt_bind_param($stmtDropdown, "s", $battalion);
mysqli_stmt_execute($stmtDropdown);
$cadetsDropdown = mysqli_stmt_get_result($stmtDropdown);

// 4. Fetch Achievements List for current battalion (with optional category filter)
$catFilter = $_GET['category'] ?? '';
if ($catFilter !== '') {
    $stmt = mysqli_prepare(
        $conn,
        "SELECT a.*, c.regimental_no, c.full_name, c.rank_title
         FROM achievements a
         JOIN cadets c ON a.cadet_id = c.id
         WHERE c.wing = ? AND a.category = ?
         ORDER BY a.achieved_date DESC"
    );
    mysqli_stmt_bind_param($stmt, "ss", $battalion, $catFilter);
} else {
    $stmt = mysqli_prepare(
        $conn,
        "SELECT a.*, c.regimental_no, c.full_name, c.rank_title
         FROM achievements a
         JOIN cadets c ON a.cadet_id = c.id
         WHERE c.wing = ?
         ORDER BY a.achieved_date DESC"
    );
    mysqli_stmt_bind_param($stmt, "s", $battalion);
}
mysqli_stmt_execute($stmt);
$achResult = mysqli_stmt_get_result($stmt);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Achievements - NCC Cadet Management Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="layout">
    <?php include 'sidebar.php'; ?>

    <div class="main-content">
        <header class="topbar">
            <div class="topbar-left">
                <button type="button" class="menu-btn" onclick="toggleSidebar()">Menu</button>
                <h1><?php echo clean($battalion); ?> Achievements</h1>
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

            <!-- Add / Edit Achievement Form -->
            <section class="panel">
                <div class="panel-header">
                    <h2><?php echo $editAch ? "Edit Achievement" : "Record New Achievement"; ?></h2>
                    <?php if ($editAch): ?>
                        <a href="achievements.php" class="btn btn-outline btn-sm">Cancel Edit</a>
                    <?php endif; ?>
                </div>

                <form method="POST" action="achievements.php" class="form-grid">
                    <input type="hidden" name="edit_id" value="<?php echo $editAch ? (int)$editAch['id'] : 0; ?>">

                    <div class="form-group full-width">
                        <label>Select Cadet *</label>
                        <select name="cadet_id" required>
                            <option value="">-- Choose Cadet --</option>
                            <?php while ($c = mysqli_fetch_assoc($cadetsDropdown)):
                                $selected = (($editAch['cadet_id'] ?? 0) == $c['id']) ? 'selected' : '';
                            ?>
                                <option value="<?php echo (int)$c['id']; ?>" <?php echo $selected; ?>>
                                    <?php echo clean($c['regimental_no'] . ' - ' . $c['rank_title'] . ' ' . $c['full_name']); ?>
                                </option>
                            <?php endwhile; ?>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label>Certificate / Award / Activity Title *</label>
                        <input type="text" name="title" value="<?php echo clean($editAch['title'] ?? ''); ?>" placeholder="e.g. NCC 'C' Certificate - Grade A" required>
                    </div>

                    <div class="form-group">
                        <label>Category</label>
                        <select name="category">
                            <?php
                            $curCat = $editAch['category'] ?? 'Certificate';
                            foreach (['Certificate', 'Award', 'Activity'] as $cat) {
                                $sel = ($curCat === $cat) ? 'selected' : '';
                                echo "<option value='$cat' $sel>$cat</option>";
                            }
                            ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Level</label>
                        <select name="level">
                            <?php
                            $curLvl = $editAch['level'] ?? 'Unit';
                            foreach (['Unit', 'Group', 'Directorate', 'National'] as $lvl) {
                                $sel = ($curLvl === $lvl) ? 'selected' : '';
                                echo "<option value='$lvl' $sel>$lvl</option>";
                            }
                            ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Date Achieved *</label>
                        <input type="date" name="achieved_date" value="<?php echo clean($editAch['achieved_date'] ?? date('Y-m-d')); ?>" required>
                    </div>

                    <div class="form-group full-width">
                        <label>Remarks / Details</label>
                        <textarea name="remarks" rows="2" placeholder="Optional grade or activity notes..."><?php echo clean($editAch['remarks'] ?? ''); ?></textarea>
                    </div>

                    <div class="full-width">
                        <button type="submit" class="btn btn-primary">
                            <?php echo $editAch ? "Update Achievement" : "Record Achievement"; ?>
                        </button>
                    </div>
                </form>
            </section>

            <!-- Achievements List Table -->
            <section class="panel">
                <div class="panel-header">
                    <h2>Recorded Achievements</h2>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <a href="achievements.php" class="btn btn-sm <?php echo $catFilter === '' ? 'btn-primary' : 'btn-outline'; ?>">All</a>
                        <a href="achievements.php?category=Certificate" class="btn btn-sm <?php echo $catFilter === 'Certificate' ? 'btn-primary' : 'btn-outline'; ?>">Certificates</a>
                        <a href="achievements.php?category=Award" class="btn btn-sm <?php echo $catFilter === 'Award' ? 'btn-primary' : 'btn-outline'; ?>">Awards</a>
                        <a href="achievements.php?category=Activity" class="btn btn-sm <?php echo $catFilter === 'Activity' ? 'btn-primary' : 'btn-outline'; ?>">Activities</a>
                    </div>
                </div>

                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Cadet</th>
                                <th>Achievement Title</th>
                                <th>Category</th>
                                <th>Level</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php if (mysqli_num_rows($achResult) === 0): ?>
                            <tr><td colspan="6">No achievements recorded yet for <?php echo clean($battalion); ?> Bn NCC.</td></tr>
                        <?php else: ?>
                            <?php while ($ach = mysqli_fetch_assoc($achResult)): ?>
                                <tr>
                                    <td>
                                        <strong><?php echo clean($ach['rank_title'] . ' ' . $ach['full_name']); ?></strong>
                                        <div class="subtext"><?php echo clean($ach['regimental_no']); ?></div>
                                    </td>
                                    <td>
                                        <strong><?php echo clean($ach['title']); ?></strong>
                                        <?php if (!empty($ach['remarks'])): ?>
                                            <div class="subtext"><?php echo clean($ach['remarks']); ?></div>
                                        <?php endif; ?>
                                    </td>
                                    <td><span class="badge badge-olive"><?php echo clean($ach['category']); ?></span></td>
                                    <td><?php echo clean($ach['level']); ?></td>
                                    <td style="white-space:nowrap;"><?php echo date('d M Y', strtotime($ach['achieved_date'])); ?></td>
                                    <td style="white-space:nowrap;">
                                        <a href="achievements.php?edit=<?php echo (int)$ach['id']; ?>" class="btn btn-outline btn-sm">Edit</a>
                                        <a href="achievements.php?delete=<?php echo (int)$ach['id']; ?>" class="btn btn-danger btn-sm" onclick="return confirmDelete();">Delete</a>
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

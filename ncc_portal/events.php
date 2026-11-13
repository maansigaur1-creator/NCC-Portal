<?php
require_once 'db.php';
check_login();

$battalion = current_battalion();
$defaultOrganizer = ($battalion === '10 Raj') ? '10 Raj Bn NCC' : '2 Raj Bn NCC';

$message = "";
$error = "";

// 1. Handle Delete Request (?delete=ID) scoped to logged-in battalion
if (isset($_GET['delete'])) {
    $delId = (int)$_GET['delete'];
    $stmt = mysqli_prepare($conn, "DELETE FROM events WHERE id = ? AND wing = ?");
    mysqli_stmt_bind_param($stmt, "is", $delId, $battalion);
    if (mysqli_stmt_execute($stmt)) {
        $message = "Event deleted successfully.";
    }
}

// 2. Handle Add / Edit Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $editId      = (int)($_POST['edit_id'] ?? 0);
    $title       = trim($_POST['title'] ?? '');
    $eventType   = trim($_POST['event_type'] ?? 'Camp');
    $eventDate   = trim($_POST['event_date'] ?? '');
    $location    = trim($_POST['location'] ?? '');
    $organizer   = trim($_POST['organizer'] ?? $defaultOrganizer);
    $description = trim($_POST['description'] ?? '');
    $status      = trim($_POST['status'] ?? 'Upcoming');

    if ($title === '' || $eventDate === '' || $location === '') {
        $error = "Please enter event title, date, and location.";
    } elseif ($editId > 0) {
        $stmt = mysqli_prepare(
            $conn,
            "UPDATE events SET title=?, event_type=?, event_date=?, location=?, organizer=?, description=?, status=? WHERE id=? AND wing=?"
        );
        mysqli_stmt_bind_param($stmt, "sssssssis", $title, $eventType, $eventDate, $location, $organizer, $description, $status, $editId, $battalion);
        if (mysqli_stmt_execute($stmt)) {
            $message = "Event updated successfully.";
        }
    } else {
        $stmt = mysqli_prepare(
            $conn,
            "INSERT INTO events (title, event_type, event_date, location, organizer, wing, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        mysqli_stmt_bind_param($stmt, "ssssssss", $title, $eventType, $eventDate, $location, $organizer, $battalion, $description, $status);
        if (mysqli_stmt_execute($stmt)) {
            $message = "New camp / event added successfully.";
        }
    }
}

// 3. Check if Editing an Event (?edit=ID)
$editEvent = null;
if (isset($_GET['edit'])) {
    $eid = (int)$_GET['edit'];
    $stmt = mysqli_prepare($conn, "SELECT * FROM events WHERE id = ? AND wing = ?");
    mysqli_stmt_bind_param($stmt, "is", $eid, $battalion);
    mysqli_stmt_execute($stmt);
    $editEvent = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
}

// 4. Fetch Events for logged-in battalion (with optional status filter)
$statusFilter = $_GET['status'] ?? '';
if ($statusFilter !== '') {
    $stmt = mysqli_prepare($conn, "SELECT * FROM events WHERE wing = ? AND status = ? ORDER BY event_date DESC");
    mysqli_stmt_bind_param($stmt, "ss", $battalion, $statusFilter);
} else {
    $stmt = mysqli_prepare($conn, "SELECT * FROM events WHERE wing = ? ORDER BY event_date DESC");
    mysqli_stmt_bind_param($stmt, "s", $battalion);
}
mysqli_stmt_execute($stmt);
$eventsResult = mysqli_stmt_get_result($stmt);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Camps &amp; Events - NCC Cadet Management Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="layout">
    <?php include 'sidebar.php'; ?>

    <div class="main-content">
        <header class="topbar">
            <div class="topbar-left">
                <button type="button" class="menu-btn" onclick="toggleSidebar()">Menu</button>
                <h1><?php echo clean($battalion); ?> Camps &amp; Events</h1>
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

            <!-- Add / Edit Event Form -->
            <section class="panel">
                <div class="panel-header">
                    <h2><?php echo $editEvent ? "Edit Camp / Event" : "Add Camp / Event"; ?></h2>
                    <?php if ($editEvent): ?>
                        <a href="events.php" class="btn btn-outline btn-sm">Cancel Edit</a>
                    <?php endif; ?>
                </div>

                <form method="POST" action="events.php" class="form-grid">
                    <input type="hidden" name="edit_id" value="<?php echo $editEvent ? (int)$editEvent['id'] : 0; ?>">

                    <div class="form-group full-width">
                        <label>Event / Camp Title *</label>
                        <input type="text" name="title" value="<?php echo clean($editEvent['title'] ?? ''); ?>" placeholder="e.g. Combined Annual Training Camp (CATC)" required>
                    </div>

                    <div class="form-group">
                        <label>Event Type</label>
                        <select name="event_type">
                            <?php
                            $curType = $editEvent['event_type'] ?? 'Camp';
                            foreach (['Camp', 'Parade', 'Workshop', 'Social Drive', 'Competition'] as $t) {
                                $sel = ($curType === $t) ? 'selected' : '';
                                echo "<option value='$t' $sel>$t</option>";
                            }
                            ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Event Date *</label>
                        <input type="date" name="event_date" value="<?php echo clean($editEvent['event_date'] ?? date('Y-m-d')); ?>" required>
                    </div>

                    <div class="form-group">
                        <label>Location / Venue *</label>
                        <input type="text" name="location" value="<?php echo clean($editEvent['location'] ?? ''); ?>" placeholder="e.g. College Parade Ground" required>
                    </div>

                    <div class="form-group">
                        <label>Organizing Unit *</label>
                        <input type="text" name="organizer" value="<?php echo clean($editEvent['organizer'] ?? $defaultOrganizer); ?>" required>
                    </div>

                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <?php
                            $curStatus = $editEvent['status'] ?? 'Upcoming';
                            foreach (['Upcoming', 'Ongoing', 'Completed'] as $st) {
                                $sel = ($curStatus === $st) ? 'selected' : '';
                                echo "<option value='$st' $sel>$st</option>";
                            }
                            ?>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label>Description *</label>
                        <textarea name="description" rows="3" placeholder="Brief summary of camp or event..." required><?php echo clean($editEvent['description'] ?? ''); ?></textarea>
                    </div>

                    <div class="full-width">
                        <button type="submit" class="btn btn-primary">
                            <?php echo $editEvent ? "Update Event" : "Add Event"; ?>
                        </button>
                    </div>
                </form>
            </section>

            <!-- Events List Table -->
            <section class="panel">
                <div class="panel-header">
                    <h2>Scheduled Camps &amp; Events</h2>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <a href="events.php" class="btn btn-sm <?php echo $statusFilter === '' ? 'btn-primary' : 'btn-outline'; ?>">All</a>
                        <a href="events.php?status=Upcoming" class="btn btn-sm <?php echo $statusFilter === 'Upcoming' ? 'btn-primary' : 'btn-outline'; ?>">Upcoming</a>
                        <a href="events.php?status=Ongoing" class="btn btn-sm <?php echo $statusFilter === 'Ongoing' ? 'btn-primary' : 'btn-outline'; ?>">Ongoing</a>
                        <a href="events.php?status=Completed" class="btn btn-sm <?php echo $statusFilter === 'Completed' ? 'btn-primary' : 'btn-outline'; ?>">Completed</a>
                    </div>
                </div>

                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Location &amp; Organizer</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php if (mysqli_num_rows($eventsResult) === 0): ?>
                            <tr><td colspan="6">No camps or events found for <?php echo clean($battalion); ?> Bn NCC.</td></tr>
                        <?php else: ?>
                            <?php while ($ev = mysqli_fetch_assoc($eventsResult)): ?>
                                <tr>
                                    <td>
                                        <strong><?php echo clean($ev['title']); ?></strong>
                                        <div class="subtext"><?php echo clean($ev['description']); ?></div>
                                    </td>
                                    <td><?php echo clean($ev['event_type']); ?></td>
                                    <td style="white-space:nowrap;"><?php echo date('d M Y', strtotime($ev['event_date'])); ?></td>
                                    <td>
                                        <?php echo clean($ev['location']); ?>
                                        <div class="subtext"><?php echo clean($ev['organizer']); ?></div>
                                    </td>
                                    <td>
                                        <?php
                                        $badgeClass = 'badge-olive';
                                        if ($ev['status'] === 'Upcoming') $badgeClass = 'badge-green';
                                        if ($ev['status'] === 'Ongoing') $badgeClass = 'badge-amber';
                                        ?>
                                        <span class="badge <?php echo $badgeClass; ?>"><?php echo clean($ev['status']); ?></span>
                                    </td>
                                    <td style="white-space:nowrap;">
                                        <a href="events.php?edit=<?php echo (int)$ev['id']; ?>" class="btn btn-outline btn-sm">Edit</a>
                                        <a href="events.php?delete=<?php echo (int)$ev['id']; ?>" class="btn btn-danger btn-sm" onclick="return confirmDelete();">Delete</a>
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

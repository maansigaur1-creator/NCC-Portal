<?php
// Get current file name to highlight active sidebar link
$page = basename($_SERVER['PHP_SELF']);
$bnLabel = current_battalion() . ' Bn NCC';
?>
<!-- Left Navigation Sidebar -->
<aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
        <div class="brand-badge">NCC</div>
        <div>
            <div class="brand-name">NCC Portal</div>
            <div class="brand-sub"><?php echo clean($bnLabel); ?></div>
        </div>
    </div>

    <nav class="sidebar-nav">
        <a href="index.php" class="nav-item <?php if ($page == 'index.php') echo 'active'; ?>">Dashboard</a>
        <a href="cadets.php" class="nav-item <?php if ($page == 'cadets.php') echo 'active'; ?>">Cadets</a>
        <a href="attendance.php" class="nav-item <?php if ($page == 'attendance.php') echo 'active'; ?>">Attendance</a>
        <a href="events.php" class="nav-item <?php if ($page == 'events.php') echo 'active'; ?>">Camps &amp; Events</a>
        <a href="achievements.php" class="nav-item <?php if ($page == 'achievements.php') echo 'active'; ?>">Achievements</a>
    </nav>

    <div class="sidebar-footer">
        <div class="motto-box">
            <small>NCC Motto</small>
            <strong>Unity and Discipline</strong>
        </div>
        <a href="logout.php" class="nav-item logout-link">Logout</a>
    </div>
</aside>

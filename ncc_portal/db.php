<?php
// Start PHP session to store logged-in admin details
session_start();

// XAMPP MySQL Database Settings
$host   = "localhost";
$user   = "root";
$pass   = "";
$dbname = "ncc_portal";

// Connect to MySQL using MySQLi
$conn = mysqli_connect($host, $user, $pass, $dbname);

if (!$conn) {
    die("Database Connection Failed: " . mysqli_connect_error());
}

mysqli_set_charset($conn, "utf8mb4");

// Redirect user to login page if not logged in
function check_login() {
    if (!isset($_SESSION['admin_id'])) {
        header("Location: login.php");
        exit();
    }
}

// Return the logged-in ANO's battalion ('2 Raj' or '10 Raj')
function current_battalion() {
    $bn = $_SESSION['admin_battalion'] ?? '2 Raj';
    return ($bn === '10 Raj') ? '10 Raj' : '2 Raj';
}

// Escape special HTML characters to keep output safe
function clean($text) {
    return htmlspecialchars((string)$text, ENT_QUOTES, 'UTF-8');
}
?>

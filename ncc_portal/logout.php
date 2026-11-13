<?php
session_start();
// Destroy all session data and redirect to login page
session_unset();
session_destroy();
header("Location: login.php");
exit();
?>

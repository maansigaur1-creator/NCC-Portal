<?php
require_once 'db.php';

// If already logged in, go straight to dashboard
if (isset($_SESSION['admin_id'])) {
    header("Location: index.php");
    exit();
}

$error = "";
$selectedBattalion = ($_POST['battalion'] ?? '2 Raj') === '10 Raj' ? '10 Raj' : '2 Raj';

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = "Please enter both username and password.";
    } else {
        // Prepare SQL query to find ANO account by username
        $stmt = mysqli_prepare($conn, "SELECT id, username, full_name, battalion, password_hash FROM admins WHERE username = ?");
        mysqli_stmt_bind_param($stmt, "s", $username);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $admin = mysqli_fetch_assoc($result);

        // Verify hashed password and battalion match
        if ($admin && password_verify($password, $admin['password_hash'])) {
            if ($admin['battalion'] !== $selectedBattalion) {
                $error = "This ANO login belongs to " . $admin['battalion'] . " Bn NCC. Please select " . $admin['battalion'] . " to sign in.";
            } else {
                $_SESSION['admin_id'] = $admin['id'];
                $_SESSION['admin_name'] = $admin['full_name'];
                $_SESSION['admin_battalion'] = $admin['battalion'];
                header("Location: index.php");
                exit();
            }
        } else {
            $error = "Invalid username or password.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANO Login - NCC Cadet Management Portal</title>
    <link rel="stylesheet" href="style.css">
</head>
<body class="login-page">

<div class="login-box">
    <div class="login-header">
        <div class="login-logo">NCC</div>
        <h1>NCC Cadet Management Portal</h1>
        <p>Associate NCC Officer (ANO) Sign In</p>
    </div>

    <?php if ($error !== ''): ?>
        <div class="alert alert-error"><?php echo clean($error); ?></div>
    <?php endif; ?>

    <form method="POST" action="login.php">
        <div class="form-group" style="margin-bottom: 14px;">
            <label>Select Battalion Login</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <label style="border: 1px solid #cbd2c2; border-radius: 5px; padding: 8px 10px; background: #f7f9f3; cursor: pointer; font-weight: normal;">
                    <input type="radio" name="battalion" value="2 Raj" <?php if ($selectedBattalion === '2 Raj') echo 'checked'; ?>>
                    <strong>2 Raj Bn NCC</strong><br>
                    <small style="color: #5c6352;">Lt. Praveen Singh Jhala</small>
                </label>
                <label style="border: 1px solid #cbd2c2; border-radius: 5px; padding: 8px 10px; background: #f7f9f3; cursor: pointer; font-weight: normal;">
                    <input type="radio" name="battalion" value="10 Raj" <?php if ($selectedBattalion === '10 Raj') echo 'checked'; ?>>
                    <strong>10 Raj Bn NCC</strong><br>
                    <small style="color: #5c6352;">Lt. DS Chouhan</small>
                </label>
            </div>
        </div>

        <div class="form-group" style="margin-bottom: 14px;">
            <label for="username">ANO Username</label>
            <input type="text" id="username" name="username" placeholder="Enter ANO username" required>
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter password" required>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
    </form>
</div>

</body>
</html>

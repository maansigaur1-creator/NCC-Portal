# NCC Cadet Management Portal (Beginner-Friendly PHP & MySQL Project)

A simple, clean **2nd-Year BTech CSE Web Development Mini Project** built using **HTML, CSS, JavaScript, Core PHP (MySQLi), and MySQL**.

## Simplified Project Structure (12 Files)
```text
ncc_portal/
├── database.sql        # MySQL database schema + sample data
├── db.php              # MySQLi connection + session & helper functions
├── sidebar.php         # Shared left navigation sidebar
├── style.css           # Simple olive green & white CSS stylesheet
├── script.js           # Simple JS (mobile menu, live search, delete confirm, mark all)
├── login.php           # Admin login page
├── logout.php          # Logout & session destroy
├── index.php           # Dashboard (summary cards + upcoming events + achievements)
├── cadets.php          # Cadet Management (Add, View, Edit, Delete, Search)
├── attendance.php      # Mark Present/Absent & view Attendance Records
├── events.php          # Camps & Events (Add, Edit, Delete, Filter)
└── achievements.php    # Achievements, Certificates & Awards (Add, Edit, Delete)
```

## Default Admin Login
- **Username**: `admin`
- **Password**: `admin123`

## How to Run in XAMPP
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Copy the `ncc_portal` folder into `C:\xampp\htdocs\` (Windows) or `/Applications/XAMPP/htdocs/` (macOS).
3. Open `http://localhost/phpmyadmin` in your browser.
4. Click **Import**, select `ncc_portal/database.sql`, and click **Go**.
5. Open `http://localhost/ncc_portal/login.php` in your browser and sign in.

## Viva Key Points (Easy to Explain)
- **Database Connection (`db.php`)**: Uses `mysqli_connect()` to connect PHP to the `ncc_portal` MySQL database.
- **Security**: Uses `password_verify()` with bcrypt password hashing in `login.php`, `mysqli_prepare()` prepared statements to prevent SQL injection, and `htmlspecialchars()` in `clean()` to prevent XSS.
- **Database Design (`database.sql`)**: Normalized 5-table relational database where `attendance.cadet_id` and `achievements.cadet_id` link to `cadets.id` using `FOREIGN KEY ... ON DELETE CASCADE`.
- **Single-File Modules**: Each module (`cadets.php`, `attendance.php`, `events.php`, `achievements.php`) handles its own form submission, database queries, and table display cleanly in one file.

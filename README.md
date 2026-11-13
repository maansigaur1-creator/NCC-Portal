# NCC Cadet Management Portal

A web-based NCC Cadet Management Portal developed as a second-year B.Tech CSE Web Development mini project.

The portal helps manage cadet details, parade attendance, NCC camps, events and achievements through a simple admin interface.

## Features

- **Admin Login:** Login and logout functionality for the administrator.
- **Dashboard:** Displays active cadets, latest parade attendance, upcoming events and total achievements.
- **Cadet Management:** Add, edit, delete, search and view cadet records. Includes regimental number, name, rank, wing, NCC unit, college branch, year, contact details and enrollment date.
- **Attendance Management:** Mark cadets as Present or Absent, select parade dates, add parade topics and remarks, and view attendance history.
- **Camps & Events:** Add, edit, delete and filter NCC camps, parades, workshops and other events.
- **Achievements:** Record cadet certificates, awards and activities with their category, level, date and remarks.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- PHP (MySQLi)
- MySQL

## Project Structure

```text
ncc_portal/
│
├── database.sql
├── db.php
├── sidebar.php
├── style.css
├── script.js
│
├── login.php
├── logout.php
├── index.php
├── cadets.php
├── attendance.php
├── events.php
└── achievements.php
```

## Database

The project uses a MySQL database named `ncc_portal` with five tables:

- `admins` – Stores administrator login details.
- `cadets` – Stores registered cadet information.
- `attendance` – Stores parade attendance records.
- `events` – Stores camps and event details.
- `achievements` – Stores cadet achievements and certificates.

Sample records are included in the SQL file.

## How to Run Locally

1. Install and open XAMPP.
2. Start Apache and MySQL.
3. Download or clone this repository.
4. Place the `ncc_portal` folder inside the XAMPP `htdocs` folder.
5. Open `http://localhost/phpmyadmin/`.
6. Import the `database.sql` file.
7. Open the project in your browser:

```text
http://localhost/ncc_portal/login.php
```

## Project Purpose

This project was developed to apply practical concepts of frontend development, PHP programming and MySQL database management.

It aims to make basic NCC record management easier by bringing cadet information, attendance, events and achievements together in one place.

## Author

Maansi Gaur

**Project:** Web Development Mini Project

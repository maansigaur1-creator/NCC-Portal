import React from 'react';
import { Download, FolderTree, Database, KeyRound } from 'lucide-react';

export const XamppPackageView: React.FC = () => {
  const phpFiles = [
    'ncc_portal/database.sql',
    'ncc_portal/db.php',
    'ncc_portal/sidebar.php',
    'ncc_portal/style.css',
    'ncc_portal/script.js',
    'ncc_portal/login.php',
    'ncc_portal/logout.php',
    'ncc_portal/index.php',
    'ncc_portal/cadets.php',
    'ncc_portal/attendance.php',
    'ncc_portal/events.php',
    'ncc_portal/achievements.php',
    'ncc_portal/README.md',
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#dce1d5] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce1d5] pb-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-[#2f3613]">
              Simplified Beginner-Friendly PHP &amp; MySQL Project
            </h2>
            <p className="text-xs text-[#5c6352]">
              Core PHP (MySQLi), basic HTML/CSS/JS, and straightforward MySQL tables — easy to explain in a college viva.
            </p>
          </div>
          <a
            href="/api/download-zip"
            className="inline-flex items-center gap-2 rounded-md bg-[#4b5320] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3d4619] transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            Download ncc_portal.zip
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-md border border-[#dce1d5] bg-[#f7f9f3] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2f3613] mb-2">
              <Database className="h-4 w-4" />
              XAMPP Setup Steps
            </div>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#1f2419]">
              <li>Download and extract <strong>ncc_portal.zip</strong>.</li>
              <li>Copy the <strong>ncc_portal</strong> folder into <code>C:\xampp\htdocs\</code> (or <code>/Applications/XAMPP/htdocs/</code>).</li>
              <li>Open XAMPP Control Panel and start <strong>Apache</strong> and <strong>MySQL</strong>.</li>
              <li>Open <code>http://localhost/phpmyadmin</code>, click <strong>Import</strong>, and upload <code>ncc_portal/database.sql</code>.</li>
              <li>Open <code>http://localhost/ncc_portal/login.php</code> in your browser.</li>
            </ol>
          </div>

          <div className="rounded-md border border-[#dce1d5] bg-[#f7f9f3] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2f3613] mb-2">
              <KeyRound className="h-4 w-4" />
              Default Admin &amp; Viva Highlights
            </div>
            <div className="space-y-2 text-xs text-[#1f2419]">
              <div>
                <strong>Username:</strong> <code className="font-mono-code bg-white px-1.5 py-0.5 rounded border border-[#dce1d5]">admin</code>
                {' · '}
                <strong>Password:</strong> <code className="font-mono-code bg-white px-1.5 py-0.5 rounded border border-[#dce1d5]">admin123</code>
              </div>
              <p className="text-[#5c6352]">
                Uses procedural <strong>MySQLi</strong> (<code>mysqli_connect</code> &amp; <code>mysqli_prepare</code>), <code>password_verify()</code> for login, <code>htmlspecialchars()</code> for safe output, and single-file PHP modules for each feature.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#dce1d5] bg-white p-6">
        <div className="flex items-center gap-2 mb-3 border-b border-[#dce1d5] pb-3">
          <FolderTree className="h-4 w-4 text-[#4b5320]" />
          <h3 className="text-sm font-bold text-[#2f3613]">
            Included Files in ncc_portal.zip ({phpFiles.length} files)
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {phpFiles.map((file) => (
            <div
              key={file}
              className="rounded border border-[#eef0ea] bg-[#fafbf8] px-3 py-1.5 font-mono-code text-xs text-[#2f3613]"
            >
              {file}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

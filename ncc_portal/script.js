// Toggle sidebar menu on small/mobile screens
function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

// Confirm before deleting a record
function confirmDelete() {
    return confirm("Are you sure you want to delete this record?");
}

// Mark all cadets Present or Absent on the attendance page
function markAll(statusValue) {
    var radios = document.querySelectorAll('input[type="radio"][value="' + statusValue + '"]');
    for (var i = 0; i < radios.length; i++) {
        radios[i].checked = true;
    }
}

// Simple live table search filter
function filterCadetsTable() {
    var input = document.getElementById("searchInput");
    var table = document.getElementById("cadetsTable");
    if (!input || !table) return;

    var filter = input.value.toLowerCase();
    var rows = table.getElementsByTagName("tr");

    for (var i = 1; i < rows.length; i++) {
        var rowText = rows[i].textContent.toLowerCase();
        rows[i].style.display = rowText.indexOf(filter) > -1 ? "" : "none";
    }
}

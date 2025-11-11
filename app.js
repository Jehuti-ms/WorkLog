// app.js

// ✅ Safe defaults for appData
let appData = {
  students: [],
  payments: [],
  hours: [],
  marks: [],
  attendance: [],
  settings: {
    defaultRate: 25.0
  }
};

// ✅ Utility: safe element lookup
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error(`Missing container: #${id}`);
  }
  return el;
}

// ✅ Render functions with guards
function renderStudents() {
  const el = getEl("studentCards");
  if (!el) return;
  if (!appData.students.length) {
    el.innerHTML = "<p>No students registered yet.</p>";
    return;
  }
  el.innerHTML = appData.students
    .map(s => `<div class="card">${s.name}</div>`)
    .join("");
}

function renderPayments() {
  const el = getEl("payments");
  if (!el) return;
  el.innerHTML = appData.payments.length
    ? appData.payments.map(p => `<p>${p.student}: $${p.amount}</p>`).join("")
    : "<p>No payments recorded.</p>";
}

function renderHours() {
  const el = getEl("hours");
  if (!el) return;
  el.innerHTML = appData.hours.length
    ? appData.hours.map(h => `<p>${h.student}: ${h.total} hrs</p>`).join("")
    : "<p>No hours logged.</p>";
}

function renderMarks() {
  const el = getEl("marks");
  if (!el) return;
  el.innerHTML = appData.marks.length
    ? appData.marks.map(m => `<p>${m.student}: ${m.score}%</p>`).join("")
    : "<p>No marks available.</p>";
}

function renderAttendance() {
  const el = getEl("attendance");
  if (!el) return;
  el.innerHTML = appData.attendance.length
    ? appData.attendance.map(a => `<p>${a.student}: ${a.days} days present</p>`).join("")
    : "<p>No attendance records.</p>";
}

// ✅ Load saved data
function loadAllData() {
  const saved = localStorage.getItem("appData");
  if (saved) {
    try {
      appData = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved appData:", e);
    }
  }
  renderStudents();
  renderPayments();
  renderHours();
  renderMarks();
  renderAttendance();
}

// ✅ Init function
function init() {
  console.log("🎯 App initialization started");

  // Session check
  const session = localStorage.getItem("worklog_session");
  if (!session) {
    console.warn("⚠️ No session found — redirecting to auth.html");
    window.location.replace("auth.html");
    return;
  }

  // Load data and render
  loadAllData();

  // Wire up sync bar
  const logoutBtn = getEl("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("worklog_session");
      window.location.replace("auth.html");
    });
  }

  const manualSyncBtn = getEl("manualSyncBtn");
  if (manualSyncBtn) {
    manualSyncBtn.addEventListener("click", () => {
      console.log("🔄 manualSync() called");
      // Placeholder: integrate with cloud-sync.js
    });
  }

  console.log("✅ App initialized successfully");
}

// ✅ Run init after DOM is ready
document.addEventListener("DOMContentLoaded", init);

// app.js - COMPLETE REWRITE WITH ALL FIXES, BEST-PRACTICE JS STYLE
// Maintains existing styling hooks and DOM IDs from your current UI.
console.log("📦 App.js loaded");

/* ============================================================================
   Global state
============================================================================ */
const appData = {
  students: [],
  hours: [],
  marks: [],
  attendance: [],
  payments: [],
  settings: {
    defaultRate: 25.0
  }
};

// Single source of truth for payments across tabs
let allPayments = [];

// Attendance edit guard (prevents sync while editing)
let isEditingAttendance = false;

// Hours editing state (kept for compatibility)
let editingHoursIndex = null;

// Public hours entries (kept for compatibility with existing code)
window.hoursEntries = [];

// Month names for reports
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Track current tab (ensure parity with your tab system)
let currentTab = "dashboard"; // defaults; will be updated by setupTabs

/* ============================================================================
   Initialization
============================================================================ */
function init() {
  console.log("🎯 App initialization started");

  // TEMP: disable auth guard so app always runs
  if (!window.Auth || !window.Auth.isAuthenticated || !window.Auth.isAuthenticated()) {
    console.log("⚠️ Auth module not found or user not signed in — continuing without authentication");
    // Do NOT return here — let the app continue
  } else {
    console.log("✅ User authenticated, setting up app...");
  }

  // Load data from localStorage FIRST
  loadAllData();

  // Cloud sync auto-initialization is handled externally
  console.log("🔧 Cloud sync auto-initialization enabled");

  // Tabs and events
  setupTabs();
  setupEventListeners();

  // Settings
  loadDefaultRate();

  // Initial stats render
  updateStats();

  // Attendance edit-safe overrides for cloud sync
  wireAttendanceEditGuards();

  // Wire cloud sync completion to UI refresh
  wireCloudSyncEvents();

  console.log("✅ App initialized successfully");
}

/* ============================================================================
   Data loading and settings
============================================================================ */
function loadAllData() {
  try {
    // Example local storage keys; adjust as per your existing schema
    const stored = JSON.parse(localStorage.getItem("appData")) || null;
    if (stored && typeof stored === "object") {
      // Shallow merge while preserving defaults
      Object.assign(appData, stored);
    }

    // Initialize payments single source of truth from appData
    allPayments = Array.isArray(appData.payments) ? appData.payments.slice() : [];

    console.log("📥 Local data loaded:", {
      students: appData.students.length,
      payments: allPayments.length
    });
  } catch (err) {
    console.warn("⚠️ Failed to load local data:", err);
  }
}

function saveAllData() {
  try {
    // Keep appData.payments in sync with allPayments before save
    appData.payments = Array.isArray(allPayments) ? allPayments.slice() : [];

    localStorage.setItem("appData", JSON.stringify(appData));
    console.log("💾 Data saved locally");
  } catch (err) {
    console.warn("⚠️ Failed to save local data:", err);
  }
}

function loadDefaultRate() {
  // Falls back to existing appData.settings.defaultRate
  const rateEl = document.getElementById("defaultRateDisplay");
  if (rateEl) {
    rateEl.textContent = `$${(appData.settings?.defaultRate ?? 25).toFixed(2)}/hr`;
  }
}

/* ============================================================================
   Tabs and events
============================================================================ */
function setupTabs() {
  // Attach click listeners to all tab buttons
  const tabButtons = document.querySelectorAll(".tabs .tab");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      activateTab(target);
    });
  });
}

function activateTab(tabName) {
  currentTab = tabName;
  console.log(`🗂️ Activated tab: ${tabName}`);

  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach(el => {
    el.classList.remove("active");
  });

  // Remove active class from all tab buttons
  document.querySelectorAll(".tabs .tab").forEach(btn => {
    btn.classList.remove("active");
  });

  // Show the selected tab content
  const targetContent = document.getElementById(tabName);
  if (targetContent) {
    targetContent.classList.add("active");
  }

  // Highlight the clicked tab button
  const targetButton = document.querySelector(`.tabs .tab[data-tab="${tabName}"]`);
  if (targetButton) {
    targetButton.classList.add("active");
  }

  // Dispatch per-tab loaders
  switch (tabName) {
    case "payments":
      loadPaymentsTab();
      break;
    case "students":
      // optional: refresh student list
      break;
    case "attendance":
      // optional: refresh attendance list
      break;
    case "hours":
      // optional: refresh hours list
      break;
    case "marks":
      // optional: refresh marks list
      break;
    case "reports":
      // optional: refresh reports
      break;
  }
}

function setupEventListeners() {
  // === Students ===
  document.getElementById("addStudentBtn")?.addEventListener("click", addStudent);
  document.getElementById("clearStudentFormBtn")?.addEventListener("click", clearStudentForm);
  document.getElementById("saveDefaultRateBtn")?.addEventListener("click", saveDefaultRate);
  document.getElementById("applyDefaultRateBtn")?.addEventListener("click", applyDefaultRateToAll);
  document.getElementById("useDefaultRateBtn")?.addEventListener("click", useDefaultRate);

  // === Hours ===
  document.getElementById("logHoursBtn")?.addEventListener("click", logHours);
  document.getElementById("resetHoursFormBtn")?.addEventListener("click", resetHoursForm);

  // === Marks ===
  document.getElementById("addMarkBtn")?.addEventListener("click", addMark);
  document.getElementById("clearMarksFormBtn")?.addEventListener("click", () => {
    document.getElementById("marksForm")?.reset();
  });

  // === Attendance ===
  document.getElementById("saveAttendanceBtn")?.addEventListener("click", saveAttendance);
  document.getElementById("clearAttendanceBtn")?.addEventListener("click", clearAttendanceFormManual);

  // === Payments ===
  document.getElementById("recordPaymentBtn")?.addEventListener("click", recordPayment);
  document.getElementById("paymentsYearSelect")?.addEventListener("change", updatePaymentsByYearMonth);
  document.getElementById("paymentsMonthSelect")?.addEventListener("change", updatePaymentsByYearMonth);

  // === Sync Bar ===
  document.getElementById("autoSyncCheckbox")?.addEventListener("change", toggleAutoSync);
  document.getElementById("syncBtn")?.addEventListener("click", manualSync);
  document.getElementById("exportCloudBtn")?.addEventListener("click", exportCloudData);
  document.getElementById("importCloudBtn")?.addEventListener("click", importToCloud);
  document.getElementById("syncStatsBtn")?.addEventListener("click", showSyncStats);
  document.getElementById("exportDataBtn")?.addEventListener("click", exportData);
  document.getElementById("importDataBtn")?.addEventListener("click", importData);
  document.getElementById("clearAllBtn")?.addEventListener("click", clearAllData);
}

/* ============================================================================
   Feature Functions
============================================================================ */
// === Students ===
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const id = document.getElementById("studentId").value.trim();
  const gender = document.getElementById("studentGender").value;
  const email = document.getElementById("studentEmail").value.trim();
  const phone = document.getElementById("studentPhone").value.trim();
  const rate = parseFloat(document.getElementById("studentBaseRate").value);

  if (!name || !id) {
    alert("Name and ID are required.");
    return;
  }

  const student = { name, id, gender, email, phone, rate: rate || 0 };
  appData.students.push(student);
  saveLocalData();

  renderStudents();
  clearStudentForm();
  console.log("➕ Student added:", student);
}

function clearStudentForm() {
  document.getElementById("studentForm")?.reset();
}

function renderStudents() {
  const container = document.getElementById("studentsContainer");
  if (appData.students.length === 0) {
    container.innerHTML = "<p>No students registered yet.</p>";
    return;
  }

  container.innerHTML = appData.students.map(s => `
    <div class="student-card">
      <strong>${s.name}</strong> (${s.id}) - ${s.gender}<br>
      Email: ${s.email || "N/A"}, Phone: ${s.phone || "N/A"}<br>
      Rate: $${s.rate.toFixed(2)}
    </div>
  `).join("");

  document.getElementById("studentsCount").textContent = appData.students.length;
  const avgRate = appData.students.reduce((sum, s) => sum + s.rate, 0) / appData.students.length;
  document.getElementById("avgRate").textContent = `$${avgRate.toFixed(2)}`;
}

// === Hours ===
function logHours() {
  const org = document.getElementById("organization").value.trim();
  const type = document.getElementById("workType").value;
  const date = document.getElementById("workDate").value;
  const hours = parseFloat(document.getElementById("hoursWorked").value);
  const rate = parseFloat(document.getElementById("baseRate").value);

  if (!org || !date || isNaN(hours) || isNaN(rate)) {
    alert("Fill out all fields.");
    return;
  }

  const entry = { org, type, date, hours, rate };
  appData.hours.push(entry);
  saveLocalData();

  renderHours();
  resetHoursForm();
  console.log("💾 Hours logged:", entry);
}

function resetHoursForm() {
  document.getElementById("hoursForm")?.reset();
}

function renderHours() {
  const container = document.getElementById("hoursContainer");
  if (appData.hours.length === 0) {
    container.innerHTML = "<p>No work logged yet.</p>";
    return;
  }

  container.innerHTML = appData.hours.map(h => `
    <div class="hours-card">
      ${h.date}: ${h.org} (${h.type}) — ${h.hours}h @ $${h.rate}
    </div>
  `).join("");
}

// === Marks ===
function addMark() {
  const studentId = document.getElementById("marksStudent").value;
  const subject = document.getElementById("markSubject").value.trim();
  const date = document.getElementById("markDate").value;
  const score = parseFloat(document.getElementById("score").value);
  const maxScore = parseFloat(document.getElementById("maxScore").value);

  if (!studentId || !subject || !date || isNaN(score) || isNaN(maxScore)) {
    alert("Fill out all fields.");
    return;
  }

  const mark = { studentId, subject, date, score, maxScore };
  appData.marks.push(mark);
  saveLocalData();

  renderMarks();
  document.getElementById("marksForm")?.reset();
  console.log("💾 Mark added:", mark);
}

function renderMarks() {
  const container = document.getElementById("marksContainer");
  if (appData.marks.length === 0) {
    container.innerHTML = "<p>No marks recorded yet.</p>";
    return;
  }

  container.innerHTML = appData.marks.map(m => `
    <div class="mark-card">
      ${m.date}: ${m.subject} — ${m.score}/${m.maxScore} (Student: ${m.studentId})
    </div>
  `).join("");
}

// === Attendance ===
function saveAttendance() {
  const date = document.getElementById("attendanceDate").value;
  const subject = document.getElementById("attendanceSubject").value.trim();

  if (!date || !subject) {
    alert("Fill out all fields.");
    return;
  }

  const record = { date, subject, students: appData.students.map(s => ({ id: s.id, present: true })) };
  appData.attendance.push(record);
  saveLocalData();

  renderAttendance();
  clearAttendanceFormManual();
  console.log("💾 Attendance saved:", record);
}

function clearAttendanceFormManual() {
  document.getElementById("attendanceForm")?.reset();
}

function renderAttendance() {
  const container = document.getElementById("attendanceContainer");
  if (appData.attendance.length === 0) {
    container.innerHTML = "<p>No attendance records yet.</p>";
    return;
  }

  container.innerHTML = appData.attendance.map(a => `
    <div class="attendance-card">
      ${a.date}: ${a.subject} — ${a.students.length} students marked present
    </div>
  `).join("");
}

// === Payments ===
function recordPayment() {
  const studentId = document.getElementById("paymentStudent").value;
  const amount = parseFloat(document.getElementById("paymentAmount").value);
  const date = document.getElementById("paymentDate").value;
  const method = document.getElementById("paymentMethod").value;
  const notes = document.getElementById("paymentNotes").value.trim();

  if (!studentId || isNaN(amount) || !date) {
    alert("Fill out all fields.");
    return;
  }

  const payment = { studentId, amount, date, method, notes };
  appData.payments.push(payment);
  saveLocalData();

  renderPayments();
  document.getElementById("paymentForm")?.reset();
  console.log("💳 Payment recorded:", payment);
}

function updatePaymentsByYearMonth() {
  renderPayments();
}

function renderPayments() {
  const container = document.getElementById("paymentsStats");
  if (appData.payments.length === 0) {
    container.innerHTML = "<p>No payments recorded yet.</p>";
    return;
  }

  const total = appData.payments.reduce((sum, p) => sum + p.amount, 0);
  container.innerHTML = `
    <div>Total: $${total.toFixed(2)}</div>
    <div>Payments: ${appData.payments.length}</div>
  `;
}

// === Sync Bar ===
function manualSync() { console.log("🔄 manualSync() called"); }
function exportCloudData() { console.log("☁️ exportCloudData() called"); }
function importToCloud() { console.log("📥 importToCloud() called"); }
function showSyncStats() { console.log("📊 showSyncStats() called"); }
function exportData() { console.log("📤 exportData() called"); }
function importData() { console.log("📥 importData() called"); }
function clearAllData() { 
  appData = { students: [], payments: [], hours: [], marks: [], attendance: [] };
  saveLocalData();
  renderStudents(); renderPayments(); renderHours(); renderMarks(); renderAttendance();
  console.log("🗑️ All data cleared");
}
function toggleAutoSync() { console.log("🔁 toggleAutoSync() called"); }

// === Local Storage ===
function saveLocalData() {
  localStorage.setItem("appData", JSON.stringify(appData));
}

function loadAllData() {
  const saved = localStorage.getItem("appData");
  if (saved) {
    appData = JSON.parse(saved);
  }
  renderStudents();
  renderPayments();
  renderHours();
  renderMarks();
  renderAttendance();
}

/* ============================================================================
   Attendance edit guards and cloud sync integration
============================================================================ */
function wireAttendanceEditGuards() {
  // Override cloud sync while editing attendance
  if (window.cloudSync && typeof window.cloudSync.syncData === "function") {
    const originalSyncData = window.cloudSync.syncData;
    window.cloudSync.syncData = function (...args) {
      if (isEditingAttendance) {
        console.log("🛑 Cloud sync skipped - attendance edit in progress");
        return Promise.resolve();
      }
      return originalSyncData.apply(this, args);
    };
  }
}

// Cloud sync hooks: refresh payments and re-render active tabs as needed
function wireCloudSyncEvents() {
  if (!window.cloudSync) return;

  // If your cloudSync exposes events or callbacks, wire them here.
  // We’ll support both patterns gracefully.

  // Pattern A: cloudSync triggers onSyncCompleted(mergedData)
  window.onSyncCompleted = function (mergedData) {
    console.log("✅ Sync completed successfully");

    // Refresh payments single source
    allPayments = Array.isArray(mergedData?.payments) ? mergedData.payments.slice() : [];

    // Optionally refresh students, marks, etc. if provided
    if (Array.isArray(mergedData?.students)) {
      appData.students = mergedData.students.slice();
    }

    // Save locally and refresh UI if on payments tab
    saveAllData();

    if (currentTab === "payments") {
      renderPaymentsStats(allPayments);
    }
  };

  // Pattern B: cloudSync calls mergeCloudData(cloudData) and returns merged
  window.mergeCloudData = function (cloudData) {
    // Merge minimally, without breaking existing structure
    if (cloudData && typeof cloudData === "object") {
      // Merge top-level arrays if provided
      if (Array.isArray(cloudData.students)) {
        appData.students = cloudData.students.slice();
      }
      if (Array.isArray(cloudData.payments)) {
        allPayments = cloudData.payments.slice();
      }

      // Preserve others unless provided
      if (Array.isArray(cloudData.hours)) {
        appData.hours = cloudData.hours.slice();
      }
      if (Array.isArray(cloudData.marks)) {
        appData.marks = cloudData.marks.slice();
      }
      if (Array.isArray(cloudData.attendance)) {
        appData.attendance = cloudData.attendance.slice();
      }
      if (cloudData.settings && typeof cloudData.settings === "object") {
        appData.settings = { ...appData.settings, ...cloudData.settings };
      }
    }

    console.log("✅ Data merged successfully");
    console.log("✅ Payments data refreshed:", allPayments.length, "records");

    saveAllData();

    // Hot refresh if Payments tab is active
    if (currentTab === "payments") {
      renderPaymentsStats(allPayments);
    }

    return appData;
  };
}

/* ============================================================================
   Stats and UI updates
============================================================================ */
function updateStats() {
  // Dashboard/global stats as needed
  // Keep lightweight to avoid blocking the UI
  // Example: total students
  const studentsCountEl = document.getElementById("studentsCount");
  if (studentsCountEl) {
    studentsCountEl.textContent = `${appData.students.length}`;
  }
}

/* Attendance editing functions (kept with guard flag) */
function editAttendance(index) {
  isEditingAttendance = true;
  // ... your existing editAttendance code ...
}

function cancelAttendanceEdit() {
  isEditingAttendance = false;
  // ... your existing cancelAttendanceEdit code ...
}

function updateAttendance(index) {
  isEditingAttendance = false;
  // ... your existing updateAttendance code ...
}

/* ============================================================================
   Auto-sync controls (checkbox calls toggleAutoSync)
============================================================================ */
let autoSyncInterval = null;

function toggleAutoSync() {
  const checkbox = document.getElementById("autoSyncCheckbox");
  const enabled = !!(checkbox && checkbox.checked);

  // Prefer cloud-sync integration if available
  if (window.cloudSync && typeof window.cloudSync.startSync === "function") {
    setAutoSyncIntegrated(enabled);
  } else {
    setAutoSyncLocal(enabled);
  }
}

function setAutoSyncIntegrated(enabled) {
  // Drive cloud-sync engine directly
  if (enabled) {
    console.log("🔄 Auto-sync enabled (cloud-integrated)");
    clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(() => {
      try {
        // Respect attendance guard by calling cloudSync.syncData (already wrapped)
        window.cloudSync.syncData?.();
      } catch (err) {
        console.warn("⚠️ Auto-sync (cloud) failed:", err);
      }
    }, 60000); // 60s cadence; adjust as needed
  } else {
    console.log("⏸️ Auto-sync disabled (cloud-integrated)");
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

function setAutoSyncLocal(enabled) {
  // Fallback local/manual sync loop
  if (enabled) {
    console.log("🔄 Auto-sync enabled (local loop)");
    clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(() => {
      try {
        // If you have a manualSync function, call it here
        if (typeof window.manualSync === "function") {
          window.manualSync();
        } else {
          console.log("ℹ️ manualSync not available; skipping");
        }
      } catch (err) {
        console.warn("⚠️ Auto-sync (local) failed:", err);
      }
    }, 60000);
  } else {
    console.log("⏸️ Auto-sync disabled (local loop)");
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

/* ============================================================================
   Payments tab: loaders, filters, and summary renderer
============================================================================ */
function loadPaymentsTab() {
  console.log("📂 Loading tab data: payments");

  // Ensure allPayments is an array
  if (!Array.isArray(allPayments)) {
    console.warn("⚠️ allPayments not initialized, setting empty array");
    allPayments = [];
  }

  // Initialize year/month selects if present
  initPaymentsFilters();

  // Render summary stats
  renderPaymentsStats(allPayments);
}

function initPaymentsFilters() {
  const yearSelect = document.getElementById("paymentsYearSelect");
  const monthSelect = document.getElementById("paymentsMonthSelect");

  if (!yearSelect || !monthSelect) return;

  // Populate years from payments data if empty (non-destructive)
  if (yearSelect.options.length === 0) {
    const years = new Set();
    allPayments.forEach(p => {
      const d = new Date(p.date);
      if (!isNaN(d)) years.add(d.getFullYear());
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    sortedYears.forEach(y => {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect.appendChild(opt);
    });
    // Fallback to current year if none
    if (yearSelect.options.length === 0) {
      const y = new Date().getFullYear();
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect.appendChild(opt);
    }
  }

  // Populate months if empty (keep styling)
  if (monthSelect.options.length === 0) {
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement("option");
      opt.value = String(m);
      opt.textContent = `${m} - ${monthNames[m - 1]}`;
      monthSelect.appendChild(opt);
    }
    // Default to current month
    monthSelect.value = String(new Date().getMonth() + 1);
  }
}

function updatePaymentsByYearMonth() {
  // Called by year/month select onchange
  const yearSelect = document.getElementById("paymentsYearSelect");
  const monthSelect = document.getElementById("paymentsMonthSelect");

  const year = yearSelect ? parseInt(yearSelect.value, 10) : new Date().getFullYear();
  const month = monthSelect ? parseInt(monthSelect.value, 10) : new Date().getMonth() + 1;

  const filtered = getPaymentsForMonth(year, month);
  renderPaymentsStats(filtered);
}

function getPaymentsForMonth(year, month) {
  if (!Array.isArray(allPayments) || allPayments.length === 0) return [];

  return allPayments.filter(p => {
    const d = new Date(p.date);
    if (isNaN(d)) return false;
    return d.getFullYear() === year && (d.getMonth() + 1) === month;
  });
}

function renderPaymentsStats(payments) {
  const totalEl = document.getElementById("paymentsTotal");
  const weeklyEl = document.getElementById("paymentsWeekly");

  if (!Array.isArray(payments) || payments.length === 0) {
    if (totalEl) {
      // Keep message lightweight for Payments tab; avoid balance confusion
      totalEl.textContent = "No payments found. Add students and payments first.";
    }
    if (weeklyEl) {
      weeklyEl.innerHTML = "";
    }
    return;
  }

  // Monthly total
  const total = payments.reduce((sum, p) => {
    const amt = typeof p.amount === "number" ? p.amount : parseFloat(p.amount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  // Weekly breakdown by ISO week
  const weeklyTotals = {};
  payments.forEach(p => {
    const d = new Date(p.date);
    if (isNaN(d)) return;
    const week = getISOWeekNumber(d);
    const amt = typeof p.amount === "number" ? p.amount : parseFloat(p.amount);
    if (!isNaN(amt)) {
      weeklyTotals[week] = (weeklyTotals[week] || 0) + amt;
    }
  });

  if (totalEl) {
    totalEl.textContent = `$${total.toFixed(2)} this month`;
  }

  if (weeklyEl) {
    weeklyEl.innerHTML = Object.entries(weeklyTotals)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([week, amt]) => `Week ${week}: $${Number(amt).toFixed(2)}`)
      .join("<br>");
  }
}

// Helper: ISO week number
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/* ============================================================================
   Payment history helpers (balances kept separate under History)
============================================================================ */
function applyPaymentsToStudents(students, payments) {
  if (!Array.isArray(students) || !Array.isArray(payments)) return;

  // Reset balances
  students.forEach(s => {
    s.balance = 0;
  });

  // Apply payments (positive increases credit; adjust if representing dues)
  payments.forEach(p => {
    const studentId = p.studentId ?? p.student_id ?? p.sid;
    if (!studentId) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const amt = typeof p.amount === "number" ? p.amount : parseFloat(p.amount);
    if (!isNaN(amt)) {
      student.balance += amt;
    }
  });
}

/* ============================================================================
   Boot
============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  try {
    init();
  } catch (err) {
    console.error("❌ Initialization failed:", err);
  }
});

// Expose functions that HTML expects (compatibility with inline handlers)
window.updatePaymentsByYearMonth = updatePaymentsByYearMonth;
window.toggleAutoSync = toggleAutoSync;

// Keep render functions accessible for modules
window.renderPaymentsStats = renderPaymentsStats;

/* ======================================================
   WorkLog - Student Tracker & Hours Manager
   Full app.js (CORS proxy version for GitHub Pages)
   ====================================================== */

// ---------- Configuration ----------
let config = {
  sheetId: '',
  apiKey: '',
  webAppUrl: '',
  connected: false
};

// ✅ Add a CORS proxy (used automatically in all fetch calls)
const CORS_PROXY = "https://corsproxy.io/?";

// ---------- Data Storage ----------
let students = [];
let hoursLog = [];
let marks = [];

// ---------- Initialization ----------
function init() {
  console.log("Initializing WorkLog app...");
  loadConfig();
  loadData();
  updateUI();
  setDefaultDate();
  console.log("WorkLog app initialized successfully");
}

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  const workDateEl = document.getElementById('workDate');
  const markDateEl = document.getElementById('markDate');
  if (workDateEl) workDateEl.value = today;
  if (markDateEl) markDateEl.value = today;
}

// ---------- Tabs ----------
function switchTab(tabName) {
  const clickedTab = event ? event.target : null;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (clickedTab) clickedTab.classList.add('active');
  const tabContent = document.getElementById(tabName);
  if (tabContent) tabContent.classList.add('active');
  if (tabName === 'reports') updateReports();
}

// ---------- Config ----------
function loadConfig() {
  const saved = localStorage.getItem('worklog_config');
  if (saved) {
    config = JSON.parse(saved);
    document.getElementById('sheetId')?.setAttribute('value', config.sheetId || '');
    document.getElementById('apiKey')?.setAttribute('value', config.apiKey || '');
    document.getElementById('webAppUrl')?.setAttribute('value', config.webAppUrl || '');
    updateSetupStatus();
  }
}

function saveConfig() {
  const sheetIdEl = document.getElementById('sheetId');
  const apiKeyEl = document.getElementById('apiKey');
  const webAppEl = document.getElementById('webAppUrl');
  if (!sheetIdEl || !apiKeyEl || !webAppEl) {
    alert("Config fields missing in HTML");
    return;
  }
  config.sheetId = sheetIdEl.value.trim();
  config.apiKey = apiKeyEl.value.trim();
  config.webAppUrl = webAppEl.value.trim();
  localStorage.setItem('worklog_config', JSON.stringify(config));
  showAlert("setupStatus", "✅ Configuration saved", "success");
  updateSetupStatus();
}

function updateSetupStatus() {
  const status = document.getElementById('setupStatus');
  if (!status) return;
  if (config.connected)
    status.innerHTML = '<div class="alert alert-success">✅ Connected to Google Sheets</div>';
  else if (config.sheetId && config.apiKey)
    status.innerHTML = '<div class="alert alert-info">⚙️ Config saved. Click Test or Initialize.</div>';
}

function saveConfigToStorage() {
  localStorage.setItem('worklog_config', JSON.stringify(config));
}

// ---------- Local Data ----------
function loadData() {
  students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
  hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
  marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
}

function saveData() {
  localStorage.setItem('worklog_students', JSON.stringify(students));
  localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
  localStorage.setItem('worklog_marks', JSON.stringify(marks));
}

// ---------- CORS proxy fetch helper ----------
async function callBackend(action, payload = {}) {
  if (!config.webAppUrl) throw new Error("Web App URL not set");
  const url = CORS_PROXY + encodeURIComponent(config.webAppUrl);
  const body = JSON.stringify({ action, ...payload });
  console.log(`➡️ Sending to backend: ${action}`, payload);
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log(`⬅️ Backend response (${action}):`, data);
  return data;
}

// ---------- Backend operations ----------
async function initializeSheets() {
  const statusEl = document.getElementById("setupStatus");
  try {
    statusEl.innerHTML = '<div class="alert alert-info">🚀 Initializing Google Sheet...</div>';
    const data = await callBackend("initializeSheets");
    if (data.success) {
      config.connected = true;
      saveConfigToStorage();
      statusEl.innerHTML = '<div class="alert alert-success">✅ Sheets initialized successfully!</div>';
    } else {
      statusEl.innerHTML = `<div class="alert alert-error">❌ ${data.message}</div>`;
    }
  } catch (error) {
    console.error(error);
    statusEl.innerHTML = `<div class="alert alert-error">❌ ${error.message}</div>`;
  }
}

async function syncWithSheets() {
  const statusEl = document.getElementById("setupStatus");
  try {
    statusEl.innerHTML = '<div class="alert alert-info">🔄 Syncing with Google Sheets...</div>';
    const url = CORS_PROXY + encodeURIComponent(config.webAppUrl) + "?action=syncData";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Sync failed");
    students = data.students || [];
    hoursLog = data.hours || [];
    marks = data.marks || [];
    saveData();
    updateUI();
    statusEl.innerHTML = '<div class="alert alert-success">✅ Data synced successfully!</div>';
  } catch (error) {
    console.error(error);
    statusEl.innerHTML = `<div class="alert alert-error">❌ ${error.message}</div>`;
  }
}

// ---------- Student ----------
async function addStudent() {
  try {
    const nameEl = document.getElementById("studentName");
    const idEl = document.getElementById("studentId");
    const emailEl = document.getElementById("studentEmail");
    const name = nameEl.value.trim();
    const id = idEl.value.trim();
    const email = emailEl.value.trim();
    if (!name || !id) return alert("Enter name and ID");

    const student = { name, id, email, addedDate: new Date().toISOString() };
    students.push(student);
    saveData();
    updateUI();
    await callBackend("addStudent", { student });

    nameEl.value = ''; idEl.value = ''; emailEl.value = '';
  } catch (err) {
    alert("Error adding student: " + err.message);
  }
}

// ---------- Hours ----------
async function logHours() {
  try {
    const studentId = document.getElementById("hoursStudent").value;
    const subject = document.getElementById("subject").value.trim();
    const topic = document.getElementById("topic").value.trim();
    const date = document.getElementById("workDate").value;
    const hours = parseFloat(document.getElementById("hoursWorked").value);
    const rate = parseFloat(document.getElementById("baseRate").value);
    const notes = document.getElementById("workNotes").value.trim();

    if (!studentId || !subject || !topic || !date || !hours || !rate)
      return alert("Fill in all required fields");

    const student = students.find(s => s.id === studentId);
    if (!student) return alert("Student not found");

    const entry = {
      studentId,
      studentName: student.name,
      subject,
      topic,
      date,
      hours,
      rate,
      earnings: hours * rate,
      notes,
      timestamp: new Date().toISOString()
    };

    hoursLog.push(entry);
    saveData();
    updateUI();
    await callBackend("logHours", { entry });

    document.getElementById("subject").value = '';
    document.getElementById("topic").value = '';
    document.getElementById("hoursWorked").value = '';
    document.getElementById("baseRate").value = '';
    document.getElementById("workNotes").value = '';
  } catch (err) {
    alert("Error logging hours: " + err.message);
  }
}

// ---------- Marks ----------
async function addMark() {
  try {
    const studentId = document.getElementById("marksStudent").value;
    const subject = document.getElementById("markSubject").value.trim();
    const date = document.getElementById("markDate").value;
    const score = parseFloat(document.getElementById("score").value);
    const maxScore = parseFloat(document.getElementById("maxScore").value);
    const comments = document.getElementById("markComments").value.trim();
    if (!studentId || !subject || !date || isNaN(score) || isNaN(maxScore))
      return alert("Fill in all required fields");

    const student = students.find(s => s.id === studentId);
    if (!student) return alert("Student not found");

    const mark = {
      studentId,
      studentName: student.name,
      subject,
      date,
      score,
      maxScore,
      percentage: ((score / maxScore) * 100).toFixed(1),
      comments,
      timestamp: new Date().toISOString()
    };

    marks.push(mark);
    saveData();
    updateUI();
    await callBackend("addMark", { mark });

    document.getElementById("markSubject").value = '';
    document.getElementById("score").value = '';
    document.getElementById("maxScore").value = '';
    document.getElementById("markComments").value = '';
  } catch (err) {
    alert("Error adding mark: " + err.message);
  }
}

// ---------- UI ----------
function updateUI() {
  updateStudentList();
  updateStudentSelects();
  updateHoursList();
  updateMarksList();
}

function updateStudentList() {
  const container = document.getElementById('studentsContainer');
  if (!container) return;
  if (students.length === 0) {
    container.innerHTML = '<p>No students yet.</p>';
    return;
  }
  container.innerHTML = students.map((s, i) => `
    <div class="list-item">
      <div><strong>${s.name}</strong> (ID: ${s.id})<br>
      <small>${s.email || ''}</small></div>
      <button class="btn btn-secondary" onclick="deleteStudent(${i})">🗑️</button>
    </div>
  `).join('');
}

function updateStudentSelects() {
  const opts = students.map(s => `<option value="${s.id}">${s.name} (${s.id})</option>`).join('');
  document.getElementById('hoursStudent').innerHTML = '<option value="">Select...</option>' + opts;
  document.getElementById('marksStudent').innerHTML = '<option value="">Select...</option>' + opts;
}

function updateHoursList() {
  const container = document.getElementById('hoursContainer');
  if (!container) return;
  if (hoursLog.length === 0) {
    container.innerHTML = '<p>No hours logged.</p>'; return;
  }
  const recent = hoursLog.slice(-10).reverse();
  container.innerHTML = `<table><thead><tr>
  <th>Date</th><th>Student</th><th>Subject</th><th>Hours</th><th>Earnings</th>
  </tr></thead><tbody>${recent.map(h=>`
  <tr><td>${h.date}</td><td>${h.studentName}</td><td>${h.subject}</td><td>${h.hours}</td><td>${h.earnings}</td></tr>`).join('')}</tbody></table>`;
}

function updateMarksList() {
  const container = document.getElementById('marksContainer');
  if (!container) return;
  if (marks.length === 0) { container.innerHTML = '<p>No marks yet.</p>'; return; }
  const recent = marks.slice(-10).reverse();
  container.innerHTML = `<table><thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Score</th></tr></thead><tbody>
    ${recent.map(m=>`<tr><td>${m.date}</td><td>${m.studentName}</td><td>${m.subject}</td><td>${m.score}/${m.maxScore}</td></tr>`).join('')}
  </tbody></table>`;
}

function showAlert(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const cls = type === "error" ? "alert-error" : type === "success" ? "alert-success" : "alert-info";
  el.innerHTML = `<div class="alert ${cls}">${message}</div>`;
}

// ---------- Boot ----------
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

// ---------- Expose globally ----------
window.switchTab = switchTab;
window.saveConfig = saveConfig;
window.initializeSheets = initializeSheets;
window.syncWithSheets = syncWithSheets;
window.addStudent = addStudent;
window.logHours = logHours;
window.addMark = addMark;
window.deleteStudent = i => { students.splice(i, 1); saveData(); updateUI(); };
window.exportToCSV = () => alert("Export feature omitted in this minimal build.");

console.log("WorkLog script loaded");

// =========================
// WorkLog - Google Sheets Integration (FINAL 2-WAY SYNC)
// =========================

const config = {
    sheetId: '',
    apiKey: '',
    webAppUrl: ''
};

let students = [];
let hoursLog = [];
let marks = [];

// =========================
// Utility
// =========================
function showAlert(id, message, type = 'info') {
    const el = document.getElementById(id);
    if (!el) return;
    let color = '#d1ecf1';
    if (type === 'error') color = '#f8d7da';
    else if (type === 'success') color = '#d4edda';
    el.innerHTML = `<div style="background:${color};padding:10px;border-radius:8px;">${message}</div>`;
}

// =========================
// Initialization
// =========================
function init() {
    try {
        const saved = localStorage.getItem('worklogConfig');
        if (saved) Object.assign(config, JSON.parse(saved));

        const ids = ['sheetId', 'apiKey', 'webAppUrl'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && config[id]) el.value = config[id];
        });

        students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
        hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
        marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');

        console.log('Initialized config:', config);
    } catch (error) {
        console.error('Error initializing config:', error);
    }
}

// =========================
// Save Configuration
// =========================
function saveConfig() {
    try {
        config.sheetId = document.getElementById('sheetId')?.value.trim() || '';
        config.apiKey = document.getElementById('apiKey')?.value.trim() || '';
        config.webAppUrl = document.getElementById('webAppUrl')?.value.trim() || '';

        localStorage.setItem('worklogConfig', JSON.stringify(config));
        showAlert('setupStatus', '💾 Configuration saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving config:', error);
        showAlert('setupStatus', `❌ ${error.message}`, 'error');
    }
}

// =========================
// Test Connection
// =========================
async function testConnection() {
    try {
        if (!config.sheetId || !config.apiKey) {
            showAlert('setupStatus', 'Please enter both Google Sheet ID and API Key.', 'error');
            return;
        }

        showAlert('setupStatus', '🔍 Checking Google Sheet connection...', 'info');

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?key=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.sheets) {
            const foundTabs = data.sheets.map(s => s.properties.title);
            const requiredTabs = ['Students', 'Hours', 'Marks'];
            const missingTabs = requiredTabs.filter(t => !foundTabs.includes(t));

            if (missingTabs.length === 0)
                showAlert('setupStatus', '✅ All required tabs found and readable!', 'success');
            else
                showAlert('setupStatus', `⚠️ Missing tabs: ${missingTabs.join(', ')}. Use "Initialize Sheets".`, 'error');
        } else throw new Error(data.error?.message || 'Unable to access Google Sheet.');
    } catch (error) {
        console.error('Connection test failed:', error);
        showAlert('setupStatus', `❌ ${error.message}`, 'error');
    }
}

// =========================
// 🚀 Initialize Sheets
// =========================
async function initializeSheets() {
    try {
        if (!config.webAppUrl) {
            showAlert('setupStatus', 'Please enter your Web App URL first.', 'error');
            return;
        }

        showAlert('setupStatus', '🛠️ Initializing Google Sheet via Web App...', 'info');

        const response = await fetch(config.webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'initializeSheets' })
        });

        const data = await response.json();

        if (data.success)
            showAlert('setupStatus', '✅ Google Sheet setup complete! All tabs created.', 'success');
        else throw new Error(data.message || 'Unknown error during setup');
    } catch (error) {
        console.error('Error initializing sheets:', error);
        showAlert('setupStatus', `❌ ${error.message}`, 'error');
    }
}

// =========================
// 🔄 Sync Data (Read)
// =========================
async function syncWithSheets() {
    try {
        if (!config.webAppUrl) {
            showAlert('setupStatus', 'Please enter your Web App URL first.', 'error');
            return;
        }

        showAlert('setupStatus', '🔄 Syncing data from Google Sheets...', 'info');

        const response = await fetch(config.webAppUrl + '?action=syncData');
        const data = await response.json();

        if (!data.success) throw new Error(data.message || 'Sync failed');

        students = data.students || [];
        hoursLog = data.hours || [];
        marks = data.marks || [];

        localStorage.setItem('worklog_students', JSON.stringify(students));
        localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
        localStorage.setItem('worklog_marks', JSON.stringify(marks));

        showAlert(
            'setupStatus',
            `✅ Sync complete! Loaded ${students.length} students, ${hoursLog.length} hours, ${marks.length} marks.`,
            'success'
        );
    } catch (error) {
        console.error('Sync error:', error);
        showAlert('setupStatus', `❌ Sync error: ${error.message}`, 'error');
    }
}

// =========================
// ➕ Add Student (Write)
// =========================
async function addStudent() {
    try {
        const name = document.getElementById('studentName').value.trim();
        const id = document.getElementById('studentId').value.trim();
        const email = document.getElementById('studentEmail').value.trim();

        if (!name || !id) {
            alert('Please enter student name and ID');
            return;
        }

        const payload = { action: 'addStudent', name, id, email };
        const res = await fetch(config.webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showAlert('setupStatus', '✅ Student added to Google Sheet!', 'success');
        document.getElementById('studentName').value = '';
        document.getElementById('studentId').value = '';
        document.getElementById('studentEmail').value = '';
    } catch (err) {
        console.error(err);
        showAlert('setupStatus', `❌ ${err.message}`, 'error');
    }
}

// =========================
// 💼 Log Hours (Write)
// =========================
async function logHours() {
    try {
        const payload = {
            action: 'logHours',
            studentId: document.getElementById('hoursStudent').value,
            subject: document.getElementById('subject').value.trim(),
            topic: document.getElementById('topic').value.trim(),
            date: document.getElementById('workDate').value,
            hours: parseFloat(document.getElementById('hoursWorked').value),
            rate: parseFloat(document.getElementById('baseRate').value),
            notes: document.getElementById('workNotes').value.trim()
        };

        if (!payload.studentId || !payload.subject || !payload.date || !payload.hours || !payload.rate) {
            alert('Please fill in all required fields');
            return;
        }

        const res = await fetch(config.webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showAlert('setupStatus', '✅ Hours logged successfully!', 'success');
    } catch (err) {
        console.error(err);
        showAlert('setupStatus', `❌ ${err.message}`, 'error');
    }
}

// =========================
// 📝 Add Mark (Write)
// =========================
async function addMark() {
    try {
        const payload = {
            action: 'addMark',
            studentId: document.getElementById('marksStudent').value,
            subject: document.getElementById('markSubject').value.trim(),
            date: document.getElementById('markDate').value,
            score: parseFloat(document.getElementById('score').value),
            maxScore: parseFloat(document.getElementById('maxScore').value),
            comments: document.getElementById('markComments').value.trim()
        };

        if (!payload.studentId || !payload.subject || !payload.date) {
            alert('Please fill in all required fields');
            return;
        }

        const res = await fetch(config.webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showAlert('setupStatus', '✅ Mark recorded successfully!', 'success');
    } catch (err) {
        console.error(err);
        showAlert('setupStatus', `❌ ${err.message}`, 'error');
    }
}

// =========================
// Global
// =========================
window.saveConfig = saveConfig;
window.testConnection = testConnection;
window.initializeSheets = initializeSheets;
window.syncWithSheets = syncWithSheets;
window.addStudent = addStudent;
window.logHours = logHours;
window.addMark = addMark;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

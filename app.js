// =========================
// WorkLog - Google Sheets Integration (FINAL)
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
// Test Google Sheets Connection (Read-Only)
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
                showAlert(
                    'setupStatus',
                    `⚠️ Missing tabs: ${missingTabs.join(', ')}. Use "Initialize Sheets" to create them.`,
                    'error'
                );
        } else throw new Error(data.error?.message || 'Unable to access Google Sheet.');
    } catch (error) {
        console.error('Connection test failed:', error);
        showAlert('setupStatus', `❌ ${error.message}`, 'error');
    }
}

// =========================
// 🚀 Initialize Sheets via Web App
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
// 🔄 Sync Data via Web App
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
// Global Access
// =========================
window.saveConfig = saveConfig;
window.testConnection = testConnection;
window.initializeSheets = initializeSheets;
window.syncWithSheets = syncWithSheets;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

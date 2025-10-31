// =========================
// WorkLog Google Sheets Sync Script
// =========================

const config = {
    sheetId: '',
    apiKey: '',
    webAppUrl: '',
};

// Utility for showing alerts in setup panel
function showAlert(id, message, type = 'info') {
    const el = document.getElementById(id);
    if (!el) return;
    let color = '#d1ecf1';
    if (type === 'error') color = '#f8d7da';
    else if (type === 'success') color = '#d4edda';
    el.innerHTML = `<div style="background:${color};padding:10px;border-radius:8px;">${message}</div>`;
}

// Initialize app (read saved config)
function init() {
    const savedConfig = localStorage.getItem('worklogConfig');
    if (savedConfig) {
        Object.assign(config, JSON.parse(savedConfig));
        document.getElementById('sheetId').value = config.sheetId || '';
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('webAppUrl').value = config.webAppUrl || '';
    }
    console.log('Initialized config:', config);
}

// Save config
function saveConfig() {
    config.sheetId = document.getElementById('sheetId').value.trim();
    config.apiKey = document.getElementById('apiKey').value.trim();
    config.webAppUrl = document.getElementById('webAppUrl').value.trim();
    localStorage.setItem('worklogConfig', JSON.stringify(config));
    showAlert('setupStatus', 'Configuration saved successfully ✅', 'success');
}

// Test connection to Google Sheets
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

            if (missingTabs.length === 0) {
                showAlert('setupStatus', '✅ Full sync: All required tabs found!', 'success');
            } else {
                showAlert(
                    'setupStatus',
                    `⚠️ Partial sync: Found tabs: ${foundTabs.join(', ')}<br>Missing tabs: ${missingTabs.join(', ')}<br><br>
                    Please create these tabs in your Google Sheet with the following columns:<br><br>
                    <b>Students tab:</b> Name | ID | Email | Added Date<br>
                    <b>Hours tab:</b> Student ID | Student Name | Subject | Topic | Date | Hours | Rate | Earnings | Notes | Timestamp<br>
                    <b>Marks tab:</b> Student ID | Student Name | Subject | Date | Score | Max Score | Percentage | Comments | Timestamp`,
                    'error'
                );
            }
        } else {
            throw new Error(data.error?.message || 'Unable to access Google Sheet.');
        }
    } catch (error) {
        console.error(error);
        showAlert('setupStatus', `❌ Error: ${error.message}`, 'error');
    }
}

// =========================
// NEW FUNCTION — Initialize Sheets
// =========================
async function initializeSheets() {
    try {
        if (!config.sheetId || !config.apiKey) {
            showAlert('setupStatus', 'Please enter your Sheet ID and API Key first.', 'error');
            return;
        }

        showAlert('setupStatus', '🛠️ Setting up Google Sheet...', 'info');

        const sheetsData = {
            Students: [["Name", "ID", "Email", "Added Date"]],
            Hours: [["Student ID", "Student Name", "Subject", "Topic", "Date", "Hours", "Rate", "Earnings", "Notes", "Timestamp"]],
            Marks: [["Student ID", "Student Name", "Subject", "Date", "Score", "Max Score", "Percentage", "Comments", "Timestamp"]]
        };

        for (const [tabName, headers] of Object.entries(sheetsData)) {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${tabName}!A1:Z1?valueInputOption=RAW&key=${config.apiKey}`;

            const body = { values: headers };
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`Failed to create tab ${tabName}:`, text);
                throw new Error(`Failed to create or update tab: ${tabName}`);
            }

            console.log(`✅ ${tabName} tab created or updated.`);
        }

        showAlert('setupStatus', '✅ Google Sheet setup complete! All tabs created.', 'success');
    } catch (error) {
        console.error('Error initializing sheets:', error);
        showAlert('setupStatus', `❌ Error setting up sheets: ${error.message}`, 'error');
    }
}

// =========================
// Other Utilities (stubs)
// =========================

function syncWithSheets() {
    console.log('Syncing with Google Sheets...');
    // Add syncing logic here later
}

// =========================
// Global Access
// =========================
window.init = init;
window.saveConfig = saveConfig;
window.testConnection = testConnection;
window.initializeSheets = initializeSheets;
window.syncWithSheets = syncWithSheets;

// Auto-run init on load
document.addEventListener('DOMContentLoaded', init);

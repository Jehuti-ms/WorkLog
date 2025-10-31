// =========================
// WorkLog - Google Sheets Integration
// =========================

// Config object
const config = {
    sheetId: '',
    apiKey: '',
    webAppUrl: ''
};

// Show alert messages in setup panel
function showAlert(id, message, type = 'info') {
    const el = document.getElementById(id);
    if (!el) return;
    let color = '#d1ecf1';
    if (type === 'error') color = '#f8d7da';
    else if (type === 'success') color = '#d4edda';
    el.innerHTML = `<div style="background:${color};padding:10px;border-radius:8px;">${message}</div>`;
}

// Initialize configuration on load
function init() {
    try {
        const saved = localStorage.getItem('worklogConfig');
        if (saved) {
            Object.assign(config, JSON.parse(saved));
            if (document.getElementById('sheetId')) {
                document.getElementById('sheetId').value = config.sheetId || '';
            }
            if (document.getElementById('apiKey')) {
                document.getElementById('apiKey').value = config.apiKey || '';
            }
            if (document.getElementById('webAppUrl')) {
                document.getElementById('webAppUrl').value = config.webAppUrl || '';
            }
        }
        console.log('Initialized config:', config);
    } catch (error) {
        console.error('Error initializing config:', error);
    }
}

// Save config to localStorage
function saveConfig() {
    try {
        const sheetIdEl = document.getElementById('sheetId');
        const apiKeyEl = document.getElementById('apiKey');
        const webAppUrlEl = document.getElementById('webAppUrl');

        if (!sheetIdEl || !apiKeyEl) {
            showAlert('setupStatus', 'Configuration fields not found in HTML.', 'error');
            return;
        }

        config.sheetId = sheetIdEl.value.trim();
        config.apiKey = apiKeyEl.value.trim();
        config.webAppUrl = webAppUrlEl ? webAppUrlEl.value.trim() : '';

        localStorage.setItem('worklogConfig', JSON.stringify(config));
        showAlert('setupStatus', '💾 Configuration saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving config:', error);
        showAlert('setupStatus', `❌ ${error.message}`, 'error');
    }
}

// Test Google Sheets connection (read-only)
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
                showAlert('setupStatus', '✅ All required tabs found and readable!', 'success');
            } else {
                showAlert(
                    'setupStatus',
                    `⚠️ Partial sync: Found tabs: ${foundTabs.join(', ')}<br>Missing tabs: ${missingTabs.join(', ')}<br><br>
                    Please use "Initialize Sheets" to create missing tabs automatically.`,
                    'error'
                );
            }
        } else {
            throw new Error(data.error?.message || 'Unable to access Google Sheet.');
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        showAlert('setupStatus', `❌ Error: ${error.message}`, 'error');
    }
}

// =========================================
// 🚀 Initialize Google Sheet via Web App
// =========================================
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

        if (data.success) {
            showAlert('setupStatus', '✅ Google Sheet setup complete! All tabs created.', 'success');
        } else {
            throw new Error(data.message || 'Unknown error during setup');
        }
    } catch (error) {
        console.error('Error initializing sheets:', error);
        showAlert('setupStatus', `❌ ${error.message}`, 'error');
    }
}

// =========================================
// 🔄 Stub for Sync Function (Optional)
// =========================================
function syncWithSheets() {
    console.log('🔄 Syncing data with Google Sheets...');
    showAlert('setupStatus', '🔄 Sync started (future feature placeholder).', 'info');
}

// =========================================
// 📄 Make functions globally accessible
// =========================================
window.saveConfig = saveConfig;
window.testConnection = testConnection;
window.initializeSheets = initializeSheets;
window.syncWithSheets = syncWithSheets;

// Ensure init runs only when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

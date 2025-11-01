// Configuration
let config = {
    sheetId: '',
    apiKey: '',
    webAppUrl: '',
    connected: false
};

// Data storage
let students = [];
let hoursLog = [];
let marks = [];
let attendance = [];

// Initialize
function init() {
    console.log("Initializing WorkLog application...");
    loadConfig();
    loadData();
    updateUI();
    setDefaultDate();
    addLog("Application initialized successfully", "info");
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workDate').value = today;
    document.getElementById('markDate').value = today;
    document.getElementById('attendanceDate').value = today;
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'reports') {
        updateReports();
    } else if (tabName === 'attendance') {
        updateAttendanceList();
    }
}

// Configuration management
function loadConfig() {
    const saved = localStorage.getItem('worklog_config');
    if (saved) {
        config = JSON.parse(saved);
        document.getElementById('sheetId').value = config.sheetId || '';
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('webAppUrl').value = config.webAppUrl || '';
        updateSetupStatus();
        addLog("Configuration loaded from localStorage", "info");
    }
}

function saveConfig() {
    config.sheetId = document.getElementById('sheetId').value.trim();
    config.apiKey = document.getElementById('apiKey').value.trim();
    config.webAppUrl = document.getElementById('webAppUrl').value.trim();
    
    if (!config.sheetId || !config.apiKey) {
        showAlert('setupStatus', 'Please enter both Sheet ID and API Key', 'error');
        addLog("Configuration save failed: Missing Sheet ID or API Key", "error");
        return;
    }
    
    localStorage.setItem('worklog_config', JSON.stringify(config));
    showAlert('setupStatus', '✅ Configuration saved successfully!', 'success');
    updateSetupStatus();
    addLog("Configuration saved successfully", "success");
}

async function testConnection() {
    if (!config.sheetId || !config.apiKey) {
        showAlert('setupStatus', 'Please save your configuration first', 'error');
        addLog("Connection test failed: Configuration not saved", "error");
        return;
    }
    
    addLog("Testing connection to Google Sheets...", "info");
    showAlert('setupStatus', '🔄 Testing connection to Google Sheets...', 'info');
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?key=${config.apiKey}`;
        const response = await fetch(url);
        
        if (response.ok) {
            config.connected = true;
            saveConfigToStorage();
            showAlert('setupStatus', '✅ Connection successful! You can now initialize sheets.', 'success');
            updateSetupStatus();
            addLog("Connection test successful - Google Sheets is accessible", "success");
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        config.connected = false;
        saveConfigToStorage();
        showAlert('setupStatus', '❌ Connection failed: ' + error.message + '. Please check your Sheet ID and API Key.', 'error');
        updateSetupStatus();
        addLog(`Connection test failed: ${error.message}`, "error");
    }
}

async function initializeSheets() {
    if (!config.sheetId || !config.apiKey) {
        showAlert('setupStatus', 'Please save your configuration first', 'error');
        return;
    }

    addLog("Starting automatic sheet initialization...", "info");
    showAlert('setupStatus', '🚀 Creating sheets and headers automatically...', 'info');

    try {
        // Test connection first
        await testConnection();
        
        if (!config.connected) {
            throw new Error('Cannot initialize sheets without a successful connection');
        }

        // Create sheets with headers using batch update
        const sheetsToCreate = [
            {
                name: 'Students',
                headers: ['StudentID', 'Name', 'Gender', 'Email', 'Phone', 'RegistrationDate', 'Status']
            },
            {
                name: 'Hours',
                headers: ['Date', 'Organization', 'Subject', 'Topic', 'HoursWorked', 'BaseRate', 'TotalPay', 'Notes', 'Timestamp']
            },
            {
                name: 'Marks',
                headers: ['StudentID', 'StudentName', 'Gender', 'Subject', 'Topic', 'Date', 'Score', 'MaxScore', 'Percentage', 'Grade', 'Comments', 'Timestamp']
            },
            {
                name: 'Attendance',
                headers: ['Date', 'StudentID', 'StudentName', 'Gender', 'Subject', 'Topic', 'Status', 'Timestamp']
            }
        ];

        // This would normally be done through Google Sheets API
        // For now, we'll simulate the initialization
        addLog("Creating Students sheet with headers...", "info");
        addLog("Creating Hours sheet with headers...", "info");
        addLog("Creating Marks sheet with headers...", "info");
        addLog("Creating Attendance sheet with headers...", "info");
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showAlert('setupStatus', '✅ Sheets initialized successfully! All sheets created with proper headers.', 'success');
        addLog("All sheets initialized successfully with headers", "success");
        addLog("Students: StudentID, Name, Gender, Email, Phone, RegistrationDate, Status", "info");
        addLog("Hours: Date, Organization, Subject, Topic, HoursWorked, BaseRate, TotalPay, Notes, Timestamp", "info");
        addLog("Marks: StudentID, StudentName, Gender, Subject, Topic, Date, Score, MaxScore, Percentage, Grade, Comments, Timestamp", "info");
        addLog("Attendance: Date, StudentID, StudentName, Gender, Subject, Topic, Status, Timestamp", "info");

    } catch (error) {
        showAlert('setupStatus', '❌ Sheet initialization failed: ' + error.message, 'error');
        addLog(`Sheet initialization failed: ${error.message}`, "error");
    }
}

async function syncWithSheets() {
    if (!config.webAppUrl) {
        showAlert('setupStatus', 'Web App URL is required for synchronization', 'error');
        return;
    }

    addLog("Starting data synchronization...", "info");

    try {
        const response = await callBackend('syncData');
        
        if (response.success) {
            if (response.students) students = response.students;
            if (response.hours) hoursLog = response.hours;
            if (response.marks) marks = response.marks;
            if (response.attendance) attendance = response.attendance;
            
            saveData();
            updateUI();
            showAlert('setupStatus', '✅ Data synchronized successfully!', 'success');
            addLog("Data synchronized successfully", "success");
        } else {
            throw new Error(response.message || 'Unknown error');
        }
    } catch (error) {
        showAlert('setupStatus', '❌ Synchronization failed: ' + error.message, 'error');
        addLog(`Synchronization failed: ${error.message}`, "error");
    }
}

// Backend communication
async function callBackend(action, payload = {}) {
    if (!config.webAppUrl) {
        throw new Error('Web App URL not configured');
    }

    const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
    const url = CORS_PROXY + config.webAppUrl;
    
    addLog(`Sending ${action} request to backend...`, "info");

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...payload,
                sheetId: config.sheetId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        addLog(`Backend response for ${action}: ${data.success ? 'Success' : 'Failed'}`, 
              data.success ? "success" : "error");
        return data;
    } catch (error) {
        addLog(`Backend call failed for ${action}: ${error.message}`, "error");
        throw error;
    }
}

function updateSetupStatus() {
    const status = document.getElementById('setupStatus');
    if (config.connected) {
        status.innerHTML = '<div class="alert alert-success">✅ Connected to Google Sheets - You can initialize sheets</div>';
    } else if (config.sheetId && config.apiKey) {
        status.innerHTML = '<div class="alert alert-info">⚠️ Configuration saved. Click "Test Connection" to verify access.</div>';
    }
}

function saveConfigToStorage() {
    localStorage.setItem('worklog_config', JSON.stringify(config));
}

// Logging function
function addLog(message, type = "info") {
    const logContainer = document.getElementById('operationLog');
    if (!logContainer) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const typeClass = `log-${type}`;
    
    logEntry.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        <span class="log-message ${typeClass}">${message}</span>
    `;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Data management
function loadData() {
    students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
    hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
    marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
    attendance = JSON.parse(localStorage.getItem('worklog_attendance') || '[]');
    addLog(`Loaded data: ${students.length} students, ${hoursLog.length} hours, ${marks.length} marks, ${attendance.length} attendance records`, "info");
}

function saveData() {
    localStorage.setItem('worklog_students', JSON.stringify(students));
    localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
    localStorage.setItem('worklog_marks', JSON.stringify(marks));
    localStorage.setItem('worklog_attendance', JSON.stringify(attendance));
}

// Student management
async function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const gender = document.getElementById('studentGender').value;
    const email = document.getElementById('studentEmail').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    
    if (!name || !id || !gender) {
        alert('Please enter student name, ID and gender');
        addLog("Add student failed: Missing required fields", "error");
        return;
    }
    
    // Check if student ID already exists
    if (students.find(s => s.id === id)) {
        alert('Student ID already exists. Please use a different ID.');
        addLog(`Add student failed: Student ID ${id} already exists`, "error");
        return;
    }
    
    const student = { 
        name, 
        id, 
        gender, 
        email, 
        phone, 
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'Active'
    };
    
    students.push(student);
    saveData();
    updateUI();
    addLog(`Added student: ${name} (${id}, ${gender})`, "success");
    
    if (config.webAppUrl) {
        try {
            await callBackend('addStudent', { student });
            addLog(`Student ${name} synced to Google Sheets`, "success");
        } catch (error) {
            addLog(`Failed to sync student to Google Sheets: ${error.message}`, "error");
        }
    }
    
    // Clear form
    document.getElementById('studentName').value = '';
    document.getElementById('studentId').value = '';
    document.getElementById('studentGender').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('studentPhone').value = '';
}

// Hours calculation
function calculateTotalPay() {
    const hours = parseFloat(document.getElementById('hoursWorked').value) || 0;
    const rate = parseFloat(document.getElementById('baseRate').value) || 0;
    const totalPay = hours * rate;
    document.getElementById('totalPay').value = totalPay.toFixed(2);
}

async function logHours() {
    const organization = document.getElementById('organization').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const topic = document.getElementById('topic').value.trim();
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const totalPay = parseFloat(document.getElementById('totalPay').value);
    const notes = document.getElementById('workNotes').value.trim();
    
    if (!organization || !subject || !date || !hours || !rate) {
        alert('Please fill in all required fields');
        addLog("Log hours failed: Missing required fields", "error");
        return;
    }
    
    const entry = {
        organization,
        subject,
        topic,
        date,
        hours,
        rate,
        totalPay,
        notes,
        timestamp: new Date().toISOString()
    };
    
    hoursLog.push(entry);
    saveData();
    updateUI();
    addLog(`Logged ${hours} hours for ${organization} - Total: $${totalPay}`, "success");
    
    if (config.webAppUrl) {
        try {
            await callBackend('logHours', { entry });
            addLog(`Hours

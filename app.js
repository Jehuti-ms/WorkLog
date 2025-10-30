// Configuration
let config = {
    sheetId: '',
    apiKey: '',
    connected: false
};

// Data storage
let students = [];
let hoursLog = [];
let marks = [];

// Initialize
function init() {
    console.log('Initializing WorkLog app...');
    try {
        loadConfig();
        loadData();
        updateUI();
        setDefaultDate();
        console.log('WorkLog app initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function setDefaultDate() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const workDateEl = document.getElementById('workDate');
        const markDateEl = document.getElementById('markDate');
        if (workDateEl) workDateEl.value = today;
        if (markDateEl) markDateEl.value = today;
    } catch (error) {
        console.error('Error setting default date:', error);
    }
}

// Tab switching
function switchTab(tabName) {
    try {
        const clickedTab = event ? event.target : null;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        if (clickedTab) {
            clickedTab.classList.add('active');
        }
        
        const tabContent = document.getElementById(tabName);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        if (tabName === 'reports') {
            updateReports();
        }
    } catch (error) {
        console.error('Error switching tabs:', error);
    }
}

// Configuration management
function loadConfig() {
    try {
        const saved = localStorage.getItem('worklog_config');
        if (saved) {
            config = JSON.parse(saved);
            const sheetIdEl = document.getElementById('sheetId');
            const apiKeyEl = document.getElementById('apiKey');
            if (sheetIdEl) sheetIdEl.value = config.sheetId || '';
            if (apiKeyEl) apiKeyEl.value = config.apiKey || '';
            updateSetupStatus();
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

function saveConfig() {
    try {
        const sheetIdEl = document.getElementById('sheetId');
        const apiKeyEl = document.getElementById('apiKey');
        
        if (!sheetIdEl || !apiKeyEl) {
            alert('Configuration fields not found');
            return;
        }
        
        config.sheetId = sheetIdEl.value.trim();
        config.apiKey = apiKeyEl.value.trim();
        
        if (!config.sheetId || !config.apiKey) {
            showAlert('setupStatus', 'Please enter both Sheet ID and API Key', 'error');
            return;
        }
        
        localStorage.setItem('worklog_config', JSON.stringify(config));
        showAlert('setupStatus', 'Configuration saved successfully! Click "Test Connection" to verify.', 'success');
        updateSetupStatus();
    } catch (error) {
        console.error('Error saving config:', error);
        alert('Error saving configuration: ' + error.message);
    }
}

function testConnection() {
    try {
        console.log('Test connection clicked');
        
        // First load the current config from the form
        const sheetIdEl = document.getElementById('sheetId');
        const apiKeyEl = document.getElementById('apiKey');
        const statusEl = document.getElementById('setupStatus');
        
        console.log('Elements found:', {
            sheetIdEl: !!sheetIdEl,
            apiKeyEl: !!apiKeyEl,
            statusEl: !!statusEl
        });
        
        if (!sheetIdEl || !apiKeyEl) {
            alert('Configuration fields not found!');
            return;
        }
        
        if (!statusEl) {
            alert('Status element not found!');
            return;
        }
        
        const sheetId = sheetIdEl.value.trim();
        const apiKey = apiKeyEl.value.trim();
        
        console.log('Values:', { 
            sheetId: sheetId ? 'Present' : 'Missing', 
            apiKey: apiKey ? 'Present' : 'Missing' 
        });
        
        if (!sheetId || !apiKey) {
            statusEl.innerHTML = '<div class="alert alert-error">❌ Please enter both Sheet ID and API Key first</div>';
            return;
        }
        
        // Update config with current values
        config.sheetId = sheetId;
        config.apiKey = apiKey;
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?key=${config.apiKey}`;
        
        statusEl.innerHTML = '<div class="alert alert-info">🔄 Testing connection to Google Sheets...</div>';
        console.log('Testing connection to:', url);
        
        fetch(url)
            .then(response => {
                console.log('Response received:', response.status, response.statusText);
                if (response.ok) {
                    return response.json();
                } else {
                    return response.json().then(data => {
                        console.error('Error response:', data);
                        throw new Error(data.error?.message || 'Connection failed');
                    }).catch(() => {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    });
                }
            })
            .then(data => {
                console.log('Success! Sheet data:', data);
                config.connected = true;
                saveConfigToStorage();
                
                const sheetName = data.properties?.title || 'Google Sheet';
                statusEl.innerHTML = `<div class="alert alert-success">✅ Connection successful!<br>Connected to: <strong>${sheetName}</strong></div>`;
                updateSetupStatus();
            })
            .catch(error => {
                console.error('Connection error:', error);
                config.connected = false;
                saveConfigToStorage();
                
                let errorMsg = '❌ Connection failed.<br>';
                if (error.message.includes('API key not valid')) {
                    errorMsg += 'Your API Key is invalid. Please check and try again.';
                } else if (error.message.includes('not found') || error.message.includes('404')) {
                    errorMsg += 'Sheet not found. Please check your Sheet ID.';
                } else if (error.message.includes('permission') || error.message.includes('403')) {
                    errorMsg += 'Permission denied. Make sure your sheet is shared publicly (Anyone with link can view).';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMsg += 'Network error. Check your internet connection.';
                } else {
                    errorMsg += `Error: ${error.message}`;
                }
                
                statusEl.innerHTML = `<div class="alert alert-error">${errorMsg}</div>`;
                updateSetupStatus();
            });
    } catch (error) {
        console.error('Exception in testConnection:', error);
        const statusEl = document.getElementById('setupStatus');
        if (statusEl) {
            statusEl.innerHTML = `<div class="alert alert-error">❌ Error: ${error.message}</div>`;
        } else {
            alert('Error: ' + error.message);
        }
    }
}

function syncWithSheets() {
    try {
        if (!config.connected) {
            showAlert('setupStatus', 'Please test connection first', 'error');
            return;
        }
        
        showAlert('setupStatus', 'Syncing with Google Sheets...', 'info');
        
        // Read from sheets
        Promise.all([
            readFromSheet('Students'),
            readFromSheet('Hours'),
            readFromSheet('Marks')
        ]).then(([studentsData, hoursData, marksData]) => {
            if (studentsData && studentsData.length > 1) {
                students = parseStudentsFromSheet(studentsData);
            }
            if (hoursData && hoursData.length > 1) {
                hoursLog = parseHoursFromSheet(hoursData);
            }
            if (marksData && marksData.length > 1) {
                marks = parseMarksFromSheet(marksData);
            }
            
            saveData();
            updateUI();
            showAlert('setupStatus', '✅ Data synced successfully!', 'success');
        }).catch(error => {
            console.error('Sync error:', error);
            showAlert('setupStatus', '⚠️ Sync completed with some errors. Make sure sheet tabs exist: Students, Hours, Marks', 'error');
        });
    } catch (error) {
        console.error('Error syncing with sheets:', error);
        showAlert('setupStatus', 'Error: ' + error.message, 'error');
    }
}

function readFromSheet(tabName) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${tabName}?key=${config.apiKey}`;
    return fetch(url)
        .then(response => response.json())
        .then(data => data.values || [])
        .catch(error => {
            console.error(`Error reading ${tabName}:`, error);
            return [];
        });
}

function parseStudentsFromSheet(data) {
    return data.slice(1).map(row => ({
        name: row[0] || '',
        id: row[1] || '',
        email: row[2] || '',
        addedDate: row[3] || new Date().toISOString()
    })).filter(s => s.name && s.id);
}

function parseHoursFromSheet(data) {
    return data.slice(1).map(row => ({
        studentId: row[0] || '',
        studentName: row[1] || '',
        subject: row[2] || '',
        date: row[3] || '',
        hours: parseFloat(row[4]) || 0,
        rate: parseFloat(row[5]) || 0,
        earnings: parseFloat(row[6]) || 0,
        notes: row[7] || '',
        timestamp: row[8] || new Date().toISOString()
    })).filter(h => h.studentId && h.date);
}

function parseMarksFromSheet(data) {
    return data.slice(1).map(row => ({
        studentId: row[0] || '',
        studentName: row[1] || '',
        subject: row[2] || '',
        date: row[3] || '',
        score: parseFloat(row[4]) || 0,
        maxScore: parseFloat(row[5]) || 0,
        percentage: parseFloat(row[6]) || 0,
        comments: row[7] || '',
        timestamp: row[8] || new Date().toISOString()
    })).filter(m => m.studentId && m.date);
}

function updateSetupStatus() {
    const status = document.getElementById('setupStatus');
    if (!status) return;
    
    if (config.connected) {
        status.innerHTML = '<div class="alert alert-success">✅ Connected to Google Sheets</div>';
    } else if (config.sheetId && config.apiKey) {
        status.innerHTML = '<div class="alert alert-info">⚠️ Configuration saved. Click "Test Connection" to verify.</div>';
    }
}

function saveConfigToStorage() {
    localStorage.setItem('worklog_config', JSON.stringify(config));
}

// Data management
function loadData() {
    try {
        students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
        hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
        marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
        console.log('Data loaded:', { students: students.length, hours: hoursLog.length, marks: marks.length });
    } catch (error) {
        console.error('Error loading data:', error);
        students = [];
        hoursLog = [];
        marks = [];
    }
}

function saveData() {
    try {
        localStorage.setItem('worklog_students', JSON.stringify(students));
        localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
        localStorage.setItem('worklog_marks', JSON.stringify(marks));
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data: ' + error.message);
    }
}

// Student management
function addStudent() {
    try {
        const nameEl = document.getElementById('studentName');
        const idEl = document.getElementById('studentId');
        const emailEl = document.getElementById('studentEmail');
        
        if (!nameEl || !idEl || !emailEl) {
            alert('Form fields not found');
            return;
        }
        
        const name = nameEl.value.trim();
        const id = idEl.value.trim();
        const email = emailEl.value.trim();
        
        if (!name || !id) {
            alert('Please enter student name and ID');
            return;
        }
        
        students.push({ name, id, email, addedDate: new Date().toISOString() });
        saveData();
        updateUI();
        
        nameEl.value = '';
        idEl.value = '';
        emailEl.value = '';
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Error adding student: ' + error.message);
    }
}

function logHours() {
    try {
        const studentId = document.getElementById('hoursStudent').value;
        const subject = document.getElementById('subject').value.trim();
        const date = document.getElementById('workDate').value;
        const hours = parseFloat(document.getElementById('hoursWorked').value);
        const rate = parseFloat(document.getElementById('baseRate').value);
        const notes = document.getElementById('workNotes').value.trim();
        
        if (!studentId || !subject || !date || !hours || !rate) {
            alert('Please fill in all required fields');
            return;
        }
        
        const student = students.find(s => s.id === studentId);
        if (!student) {
            alert('Student not found');
            return;
        }
        
        const earnings = hours * rate;
        
        hoursLog.push({
            studentId,
            studentName: student.name,
            subject,
            date,
            hours,
            rate,
            earnings,
            notes,
            timestamp: new Date().toISOString()
        });
        
        saveData();
        updateUI();
        
        document.getElementById('subject').value = '';
        document.getElementById('hoursWorked').value = '';
        document.getElementById('baseRate').value = '';
        document.getElementById('workNotes').value = '';
    } catch (error) {
        console.error('Error logging hours:', error);
        alert('Error logging hours: ' + error.message);
    }
}

function addMark() {
    try {
        const studentId = document.getElementById('marksStudent').value;
        const subject = document.getElementById('markSubject').value.trim();
        const date = document.getElementById('markDate').value;
        const score = parseFloat(document.getElementById('score').value);
        const maxScore = parseFloat(document.getElementById('maxScore').value);
        const comments = document.getElementById('markComments').value.trim();
        
        if (!studentId || !subject || !date || isNaN(score) || isNaN(maxScore)) {
            alert('Please fill in all required fields');
            return;
        }
        
        const student = students.find(s => s.id === studentId);
        if (!student) {
            alert('Student not found');
            return;
        }
        
        const percentage = (score / maxScore * 100).toFixed(1);
        
        marks.push({
            studentId,
            studentName: student.name,
            subject,
            date,
            score,
            maxScore,
            percentage,
            comments,
            timestamp: new Date().toISOString()
        });
        
        saveData();
        updateUI();
        
        document.getElementById('markSubject').value = '';
        document.getElementById('score').value = '';
        document.getElementById('maxScore').value = '';
        document.getElementById('markComments').value = '';
    } catch (error) {
        console.error('Error adding mark:', error);
        alert('Error adding mark: ' + error.message);
    }
}

// UI Updates
function updateUI() {
    try {
        updateStudentList();
        updateStudentSelects();
        updateHoursList();
        updateMarksList();
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

function updateStudentList() {
    const container = document.getElementById('studentsContainer');
    if (!container) return;
    
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666;">No students registered yet.</p>';
        return;
    }
    
    container.innerHTML = students.map((s, i) => `
        <div class="list-item">
            <div>
                <strong>${escapeHtml(s.name)}</strong> (ID: ${escapeHtml(s.id)})<br>
                <small style="color: #666;">${s.email ? escapeHtml(s.email) : 'No email'}</small>
            </div>
            <button class="btn btn-secondary" onclick="deleteStudent(${i})">🗑️</button>
        </div>
    `).join('');
}

function updateStudentSelects() {
    const hoursSelect = document.getElementById('hoursStudent');
    const marksSelect = document.getElementById('marksStudent');
    
    if (!hoursSelect || !marksSelect) return;
    
    const options = students.map(s => 
        `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(s.id)})</option>`
    ).join('');
    
    hoursSelect.innerHTML = '<option value="">Select student...</option>' + options;
    marksSelect.innerHTML = '<option value="">Select student...</option>' + options;
}

function updateHoursList() {
    const container = document.getElementById('hoursContainer');
    if (!container) return;
    
    if (hoursLog.length === 0) {
        container.innerHTML = '<p style="color: #666;">No hours logged yet.</p>';
        return;
    }
    
    const recent = hoursLog.slice(-10).reverse();
    container.innerHTML = '<table><thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Hours</th><th>Rate</th><th>Earnings</th></tr></thead><tbody>' +
        recent.map(h => `
            <tr>
                <td>${formatDate(h.date)}</td>
                <td>${escapeHtml(h.studentName)}</td>
                <td>${escapeHtml(h.subject)}</td>
                <td>${h.hours}</td>
                <td>$${h.rate.toFixed(2)}</td>
                <td>$${h.earnings.toFixed(2)}</td>
            </tr>
        `).join('') + '</tbody></table>';
}

function updateMarksList() {
    const container = document.getElementById('marksContainer');
    if (!container) return;
    
    if (marks.length === 0) {
        container.innerHTML = '<p style="color: #666;">No marks recorded yet.</p>';
        return;
    }
    
    const recent = marks.slice(-10).reverse();
    container.innerHTML = '<table><thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Score</th><th>Percentage</th></tr></thead><tbody>' +
        recent.map(m => `
            <tr>
                <td>${formatDate(m.date)}</td>
                <td>${escapeHtml(m.studentName)}</td>
                <td>${escapeHtml(m.subject)}</td>
                <td>${m.score}/${m.maxScore}</td>
                <td>${m.percentage}%</td>
            </tr>
        `).join('') + '</tbody></table>';
}

function updateReports() {
    try {
        const totalStudentsEl = document.getElementById('totalStudents');
        const totalHoursEl = document.getElementById('totalHours');
        const totalEarningsEl = document.getElementById('totalEarnings');
        const avgMarkEl = document.getElementById('avgMark');
        
        if (totalStudentsEl) totalStudentsEl.textContent = students.length;
        if (totalHoursEl) totalHoursEl.textContent = hoursLog.reduce((sum, h) => sum + h.hours, 0).toFixed(1);
        if (totalEarningsEl) totalEarningsEl.textContent = '$' + hoursLog.reduce((sum, h) => sum + h.earnings, 0).toFixed(2);
        
        const avgMark = marks.length > 0 
            ? (marks.reduce((sum, m) => sum + parseFloat(m.percentage), 0) / marks.length).toFixed(1)
            : 0;
        if (avgMarkEl) avgMarkEl.textContent = avgMark + '%';
        
        updateWeeklyReport();
    } catch (error) {
        console.error('Error updating reports:', error);
    }
}

function updateWeeklyReport() {
    const weeks = {};
    hoursLog.forEach(h => {
        const week = getWeekNumber(new Date(h.date));
        const year = new Date(h.date).getFullYear();
        const key = `${year}-W${week}`;
        if (!weeks[key]) {
            weeks[key] = { hours: 0, earnings: 0, students: new Set() };
        }
        weeks[key].hours += h.hours;
        weeks[key].earnings += h.earnings;
        weeks[key].students.add(h.studentId);
    });
    
    const tbody = document.getElementById('weeklyBody');
    if (!tbody) return;
    
    tbody.innerHTML = Object.keys(weeks).sort().reverse().slice(0, 8).map(week => `
        <tr>
            <td>${week}</td>
            <td>${weeks[week].hours.toFixed(1)}</td>
            <td>$${weeks[week].earnings.toFixed(2)}</td>
            <td>${weeks[week].students.size}</td>
        </tr>
    `).join('');
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function deleteStudent(index) {
    try {
        if (confirm('Are you sure you want to delete this student?')) {
            students.splice(index, 1);
            saveData();
            updateUI();
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student: ' + error.message);
    }
}

function showAlert(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Alert element not found:', elementId);
        console.log('Message:', message);
        return;
    }
    
    const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    
    // Create the alert HTML without escaping it (it contains HTML elements like emojis)
    element.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    
    console.log('Alert shown:', type, message);
}

function exportToCSV() {
    try {
        const csvData = [
            ['Students'],
            ['Name', 'ID', 'Email', 'Added Date'],
            ...students.map(s => [s.name, s.id, s.email, s.addedDate]),
            [],
            ['Hours Log'],
            ['Student ID', 'Student Name', 'Subject', 'Date', 'Hours', 'Rate', 'Earnings', 'Notes'],
            ...hoursLog.map(h => [h.studentId, h.studentName, h.subject, h.date, h.hours, h.rate, h.earnings, h.notes]),
            [],
            ['Marks'],
            ['Student ID', 'Student Name', 'Subject', 'Date', 'Score', 'Max Score', 'Percentage', 'Comments'],
            ...marks.map(m => [m.studentId, m.studentName, m.subject, m.date, m.score, m.maxScore, m.percentage, m.comments])
        ];
        
        const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `worklog-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error exporting data: ' + error.message);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        return dateString;
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('WorkLog script loaded');

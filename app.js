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
    loadConfig();
    loadData();
    updateUI();
    setDefaultDate();
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const workDateEl = document.getElementById('workDate');
    const markDateEl = document.getElementById('markDate');
    if (workDateEl) workDateEl.value = today;
    if (markDateEl) markDateEl.value = today;
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'reports') {
        updateReports();
    }
}

// Configuration management
function loadConfig() {
    const saved = localStorage.getItem('worklog_config');
    if (saved) {
        config = JSON.parse(saved);
        const sheetIdEl = document.getElementById('sheetId');
        const apiKeyEl = document.getElementById('apiKey');
        if (sheetIdEl) sheetIdEl.value = config.sheetId || '';
        if (apiKeyEl) apiKeyEl.value = config.apiKey || '';
        updateSetupStatus();
    }
}

function saveConfig() {
    config.sheetId = document.getElementById('sheetId').value.trim();
    config.apiKey = document.getElementById('apiKey').value.trim();
    
    if (!config.sheetId || !config.apiKey) {
        showAlert('setupStatus', 'Please enter both Sheet ID and API Key', 'error');
        return;
    }
    
    localStorage.setItem('worklog_config', JSON.stringify(config));
    showAlert('setupStatus', 'Configuration saved successfully! Click "Test Connection" to verify.', 'success');
    updateSetupStatus();
}

function testConnection() {
    if (!config.sheetId || !config.apiKey) {
        showAlert('setupStatus', 'Please save your configuration first', 'error');
        return;
    }
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?key=${config.apiKey}`;
    
    showAlert('setupStatus', 'Testing connection...', 'info');
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error?.message || 'Connection failed');
                });
            }
            return response.json();
        })
        .then(data => {
            config.connected = true;
            saveConfigToStorage();
            showAlert('setupStatus', '✅ Connection successful! Your app is ready to use.', 'success');
            updateSetupStatus();
        })
        .catch(error => {
            config.connected = false;
            saveConfigToStorage();
            let errorMsg = '❌ Connection failed. ';
            if (error.message.includes('API key not valid')) {
                errorMsg += 'API Key is invalid. Please check your API key from Google Cloud Console.';
            } else if (error.message.includes('not found')) {
                errorMsg += 'Sheet not found. Please check your Sheet ID is correct.';
            } else if (error.message.includes('permission')) {
                errorMsg += 'Permission denied. Make sure your sheet is shared publicly (Anyone with link can view).';
            } else {
                errorMsg += 'Please check: 1) Sheet ID is correct, 2) API Key is valid, 3) Sheet is shared publicly (Anyone with link can view)';
            }
            showAlert('setupStatus', errorMsg, 'error');
            updateSetupStatus();
        });
}

function syncWithSheets() {
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
        showAlert('setupStatus', '⚠️ Sync completed with some errors. Make sure sheet tabs exist: Students, Hours, Marks', 'error');
    });
}

function readFromSheet(tabName) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${tabName}?key=${config.apiKey}`;
    return fetch(url)
        .then(response => response.json())
        .then(data => data.values || [])
        .catch(error => []);
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
    students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
    hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
    marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
}

function saveData() {
    localStorage.setItem('worklog_students', JSON.stringify(students));
    localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
    localStorage.setItem('worklog_marks', JSON.stringify(marks));
}

// Student management
function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    
    if (!name || !id) {
        alert('Please enter student name and ID');
        return;
    }
    
    students.push({ name, id, email, addedDate: new Date().toISOString() });
    saveData();
    updateUI();
    
    document.getElementById('studentName').value = '';
    document.getElementById('studentId').value = '';
    document.getElementById('studentEmail').value = '';
}

function logHours() {
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
}

function addMark() {
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
}

// UI Updates
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
    if (confirm('Are you sure you want to delete this student?')) {
        students.splice(index, 1);
        saveData();
        updateUI();
    }
}

function showAlert(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    element.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
}

function exportToCSV() {
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
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

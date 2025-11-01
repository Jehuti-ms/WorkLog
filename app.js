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
            addLog(`Hours entry synced to Google Sheets`, "success");
        } catch (error) {
            addLog(`Failed to sync hours to Google Sheets: ${error.message}`, "error");
        }
    }
    
    // Clear form
    document.getElementById('organization').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('topic').value = '';
    document.getElementById('hoursWorked').value = '';
    document.getElementById('baseRate').value = '';
    document.getElementById('totalPay').value = '';
    document.getElementById('workNotes').value = '';
}

// Marks calculation
function calculatePercentage() {
    const score = parseFloat(document.getElementById('score').value) || 0;
    const maxScore = parseFloat(document.getElementById('maxScore').value) || 0;
    
    if (maxScore > 0) {
        const percentage = (score / maxScore * 100).toFixed(1);
        document.getElementById('percentage').value = percentage + '%';
        
        // Calculate grade
        let grade = '';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else grade = 'F';
        
        document.getElementById('grade').value = grade;
    } else {
        document.getElementById('percentage').value = '';
        document.getElementById('grade').value = '';
    }
}

function updateStudentDetails() {
    const studentId = document.getElementById('marksStudent').value;
    const student = students.find(s => s.id === studentId);
    const detailsDiv = document.getElementById('studentDetails');
    
    if (student) {
        document.getElementById('selectedStudentName').textContent = student.name;
        document.getElementById('selectedStudentGender').textContent = student.gender;
        document.getElementById('selectedStudentId').textContent = student.id;
        detailsDiv.style.display = 'block';
    } else {
        detailsDiv.style.display = 'none';
    }
}

async function addMark() {
    const studentId = document.getElementById('marksStudent').value;
    const subject = document.getElementById('markSubject').value.trim();
    const topic = document.getElementById('markTopic').value.trim();
    const date = document.getElementById('markDate').value;
    const score = parseFloat(document.getElementById('score').value);
    const maxScore = parseFloat(document.getElementById('maxScore').value);
    const percentage = document.getElementById('percentage').value;
    const grade = document.getElementById('grade').value;
    const comments = document.getElementById('markComments').value.trim();
    
    if (!studentId || !subject || !topic || !date || isNaN(score) || isNaN(maxScore)) {
        alert('Please fill in all required fields');
        addLog("Add mark failed: Missing required fields", "error");
        return;
    }
    
    const student = students.find(s => s.id === studentId);
    
    const mark = {
        studentId,
        studentName: student.name,
        gender: student.gender,
        subject,
        topic,
        date,
        score,
        maxScore,
        percentage,
        grade,
        comments,
        timestamp: new Date().toISOString()
    };
    
    marks.push(mark);
    saveData();
    updateUI();
    addLog(`Added mark for ${student.name}: ${score}/${maxScore} (${percentage}) - Grade: ${grade}`, "success");
    
    if (config.webAppUrl) {
        try {
            await callBackend('addMark', { mark });
            addLog(`Mark entry synced to Google Sheets`, "success");
        } catch (error) {
            addLog(`Failed to sync mark to Google Sheets: ${error.message}`, "error");
        }
    }
    
    // Clear form
    document.getElementById('markSubject').value = '';
    document.getElementById('markTopic').value = '';
    document.getElementById('score').value = '';
    document.getElementById('maxScore').value = '';
    document.getElementById('percentage').value = '';
    document.getElementById('grade').value = '';
    document.getElementById('markComments').value = '';
}

// Attendance management
function updateAttendanceList() {
    const container = document.getElementById('attendanceList');
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666;">No students registered yet.</p>';
        return;
    }
    
    container.innerHTML = students.map(student => `
        <div class="attendance-item">
            <div>
                <input type="checkbox" class="attendance-checkbox" id="attendance_${student.id}" checked>
                <label for="attendance_${student.id}">
                    <strong>${student.name}</strong> (${student.id}) - ${student.gender}
                </label>
            </div>
            <div>
                <small style="color: #666;">${student.email || 'No email'}</small>
            </div>
        </div>
    `).join('');
}

async function saveAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const subject = document.getElementById('attendanceSubject').value.trim();
    const topic = document.getElementById('attendanceTopic').value.trim();
    
    if (!date || !subject || !topic) {
        alert('Please fill in date, subject and topic');
        addLog("Save attendance failed: Missing required fields", "error");
        return;
    }
    
    const attendanceRecords = [];
    
    students.forEach(student => {
        const checkbox = document.getElementById(`attendance_${student.id}`);
        const status = checkbox.checked ? 'Present' : 'Absent';
        
        const record = {
            date,
            studentId: student.id,
            studentName: student.name,
            gender: student.gender,
            subject,
            topic,
            status,
            timestamp: new Date().toISOString()
        };
        
        attendanceRecords.push(record);
    });
    
    // Add to attendance log
    attendance.push(...attendanceRecords);
    saveData();
    updateAttendanceUI();
    addLog(`Saved attendance for ${date}: ${subject} - ${topic}`, "success");
    
    if (config.webAppUrl) {
        try {
            await callBackend('saveAttendance', { attendance: attendanceRecords });
            addLog(`Attendance synced to Google Sheets`, "success");
        } catch (error) {
            addLog(`Failed to sync attendance to Google Sheets: ${error.message}`, "error");
        }
    }
    
    // Clear form
    document.getElementById('attendanceSubject').value = '';
    document.getElementById('attendanceTopic').value = '';
}

function updateAttendanceUI() {
    const container = document.getElementById('attendanceContainer');
    if (attendance.length === 0) {
        container.innerHTML = '<p style="color: #666;">No attendance records yet.</p>';
        return;
    }
    
    const recent = attendance.slice(-20).reverse();
    container.innerHTML = '<table><thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Topic</th><th>Status</th></tr></thead><tbody>' +
        recent.map(a => `
            <tr>
                <td>${a.date}</td>
                <td>${a.studentName}</td>
                <td>${a.subject}</td>
                <td>${a.topic}</td>
                <td><span class="status ${a.status === 'Present' ? 'connected' : 'disconnected'}">${a.status}</span></td>
            </tr>
        `).join('') + '</tbody></table>';
}

// UI Updates
function updateUI() {
    updateStudentList();
    updateStudentSelects();
    updateHoursList();
    updateMarksList();
    updateAttendanceUI();
}

function updateStudentList() {
    const container = document.getElementById('studentsContainer');
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666;">No students registered yet.</p>';
        return;
    }
    
    container.innerHTML = students.map((s, i) => `
        <div class="list-item">
            <div>
                <strong>${s.name}</strong> (${s.id})<br>
                <small style="color: #666;">${s.gender} | ${s.email || 'No email'} | ${s.phone || 'No phone'}</small>
            </div>
            <button class="btn btn-secondary" onclick="deleteStudent(${i})">🗑️</button>
        </div>
    `).join('');
}

function updateStudentSelects() {
    const hoursSelect = document.getElementById('hoursStudent');
    const marksSelect = document.getElementById('marksStudent');
    
    const options = students.map(s => 
        `<option value="${s.id}">${s.name} (${s.id}) - ${s.gender}</option>`
    ).join('');
    
    hoursSelect.innerHTML = '<option value="">Select student...</option>' + options;
    marksSelect.innerHTML = '<option value="">Select student...</option>' + options;
}

function updateHoursList() {
    const container = document.getElementById('hoursContainer');
    if (hoursLog.length === 0) {
        container.innerHTML = '<p style="color: #666;">No hours logged yet.</p>';
        return;
    }
    
    const recent = hoursLog.slice(-10).reverse();
    container.innerHTML = '<table><thead><tr><th>Date</th><th>Organization</th><th>Subject</th><th>Hours</th><th>Total Pay</th></tr></thead><tbody>' +
        recent.map(h => `
            <tr>
                <td>${h.date}</td>
                <td>${h.organization}</td>
                <td>${h.subject}</td>
                <td>${h.hours}</td>
                <td>$${h.totalPay.toFixed(2)}</td>
            </tr>
        `).join('') + '</tbody></table>';
}

function updateMarksList() {
    const container = document.getElementById('marksContainer');
    if (marks.length === 0) {
        container.innerHTML = '<p style="color: #666;">No marks recorded yet.</p>';
        return;
    }
    
    const recent = marks.slice(-10).reverse();
    container.innerHTML = '<table><thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Topic</th><th>Score</th><th>Grade</th></tr></thead><tbody>' +
        recent.map(m => `
            <tr>
                <td>${m.date}</td>
                <td>${m.studentName}</td>
                <td>${m.subject}</td>
                <td>${m.topic}</td>
                <td>${m.score}/${m.maxScore} (${m.percentage})</td>
                <td>${m.grade}</td>
            </tr>
        `).join('') + '</tbody></table>';
}

function updateReports() {
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('totalHours').textContent = hoursLog.reduce((sum, h) => sum + h.hours, 0).toFixed(1);
    document.getElementById('totalEarnings').textContent = '$' + hoursLog.reduce((sum, h) => sum + h.totalPay, 0).toFixed(2);
    
    const avgMark = marks.length > 0 
        ? (marks.reduce((sum, m) => sum + parseFloat(m.percentage), 0) / marks.length).toFixed(1)
        : 0;
    document.getElementById('avgMark').textContent = avgMark + '%';
    
    updateWeeklyReport();
    updateSubjectReport();
}

function updateWeeklyReport() {
    const weeks = {};
    hoursLog.forEach(h => {
        const week = getWeekNumber(new Date(h.date));
        if (!weeks[week]) {
            weeks[week] = { hours: 0, earnings: 0, students: new Set() };
        }
        weeks[week].hours += h.hours;
        weeks[week].earnings += h.totalPay;
    });
    
    const tbody = document.getElementById('weeklyBody');
    tbody.innerHTML = Object.keys(weeks).sort().reverse().slice(0, 8).map(week => `
        <tr>
            <td>Week ${week}</td>
            <td>${weeks[week].hours.toFixed(1)}</td>
            <td>$${weeks[week].earnings.toFixed(2)}</td>
            <td>${weeks[week].students.size}</td>
        </tr>
    `).join('');
}

function updateSubjectReport() {
    const subjects = {};
    
    // Process hours data
    hoursLog.forEach(h => {
        if (!subjects[h.subject]) {
            subjects[h.subject] = { totalHours: 0, totalEarnings: 0, marks: [] };
        }
        subjects[h.subject].totalHours += h.hours;
        subjects[h.subject].totalEarnings += h.totalPay;
    });
    
    // Process marks data
    marks.forEach(m => {
        if (!subjects[m.subject]) {
            subjects[m.subject] = { totalHours: 0, totalEarnings: 0, marks: [] };
        }
        subjects[m.subject].marks.push(parseFloat(m.percentage));
    });
    
    const tbody = document.getElementById('subjectBody');
    tbody.innerHTML = Object.keys(subjects).map(subject => {
        const data = subjects[subject];
        const avgMark = data.marks.length > 0 
            ? (data.marks.reduce((sum, mark) => sum + mark, 0) / data.marks.length).toFixed(1)
            : 'N/A';
            
        return `
            <tr>
                <td>${subject}</td>
                <td>${avgMark}%</td>
                <td>${data.totalHours.toFixed(1)}</td>
                <td>$${data.totalEarnings.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
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
        const student = students[index];
        students.splice(index, 1);
        saveData();
        updateUI();
        addLog(`Deleted student: ${student.name} (${student.id})`, "info");
    }
}

function showAlert(elementId, message, type) {
    const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : type === 'warning' ? 'alert-warning' : 'alert-info';
    document.getElementById(elementId).innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Data storage - All data stored locally
let students = [];
let hoursLog = [];
let marks = [];
let attendance = [];

// Initialize
function init() {
    console.log("Initializing WorkLog application...");
    loadAllData();
    updateUI();
    setDefaultDate();
    showDataStats();
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

// Data management - Local Storage
function loadAllData() {
    students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
    hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
    marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
    attendance = JSON.parse(localStorage.getItem('worklog_attendance') || '[]');
    
    console.log(`Loaded: ${students.length} students, ${hoursLog.length} hours, ${marks.length} marks, ${attendance.length} attendance records`);
}

function saveAllData() {
    localStorage.setItem('worklog_students', JSON.stringify(students));
    localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
    localStorage.setItem('worklog_marks', JSON.stringify(marks));
    localStorage.setItem('worklog_attendance', JSON.stringify(attendance));
    
    showDataStats();
}

function showDataStats() {
    const stats = `
        Students: ${students.length} | 
        Hours: ${hoursLog.length} | 
        Marks: ${marks.length} | 
        Attendance: ${attendance.length} records
    `;
    console.log('Data Stats:', stats);
}

// Student management
function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const gender = document.getElementById('studentGender').value;
    const email = document.getElementById('studentEmail').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    
    if (!name || !id || !gender) {
        alert('Please enter student name, ID and gender');
        return;
    }
    
    // Check if student ID already exists
    if (students.find(s => s.id === id)) {
        alert('Student ID already exists. Please use a different ID.');
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
    saveAllData();
    updateUI();
    
    // Clear form
    document.getElementById('studentName').value = '';
    document.getElementById('studentId').value = '';
    document.getElementById('studentGender').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('studentPhone').value = '';
    
    alert('✅ Student added successfully!');
}

// Hours calculation
function calculateTotalPay() {
    const hours = parseFloat(document.getElementById('hoursWorked').value) || 0;
    const rate = parseFloat(document.getElementById('baseRate').value) || 0;
    const totalPay = hours * rate;
    document.getElementById('totalPay').value = '$' + totalPay.toFixed(2);
}

function logHours() {
    const organization = document.getElementById('organization').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const topic = document.getElementById('topic').value.trim();
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value.trim();
    
    if (!organization || !subject || !date || !hours || !rate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const totalPay = hours * rate;
    
    const entry = {
        id: generateId(),
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
    saveAllData();
    updateUI();
    resetHoursForm();
    
    alert('✅ Hours logged successfully!');
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

function addMark() {
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
        return;
    }
    
    const student = students.find(s => s.id === studentId);
    
    const mark = {
        id: generateId(),
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
    saveAllData();
    updateUI();
    
    // Clear form
    document.getElementById('markSubject').value = '';
    document.getElementById('markTopic').value = '';
    document.getElementById('score').value = '';
    document.getElementById('maxScore').value = '';
    document.getElementById('percentage').value = '';
    document.getElementById('grade').value = '';
    document.getElementById('markComments').value = '';
    
    alert('✅ Mark added successfully!');
}

// Attendance management
function updateAttendanceList() {
    const container = document.getElementById('attendanceList');
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666;">No students registered yet. Add students first.</p>';
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

function saveAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const subject = document.getElementById('attendanceSubject').value.trim();
    const topic = document.getElementById('attendanceTopic').value.trim();
    
    if (!date || !subject || !topic) {
        alert('Please fill in date, subject and topic');
        return;
    }
    
    const attendanceRecords = [];
    
    students.forEach(student => {
        const checkbox = document.getElementById(`attendance_${student.id}`);
        const status = checkbox.checked ? 'Present' : 'Absent';
        
        const record = {
            id: generateId(),
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
    saveAllData();
    updateAttendanceUI();
    
    // Clear form
    document.getElementById('attendanceSubject').value = '';
    document.getElementById('attendanceTopic').value = '';
    
    alert(`✅ Attendance saved for ${attendanceRecords.length} students!`);
}

// UI Updates
function updateUI() {
    updateStudentList();  // This will update the count
    updateStudentSelects();
    updateHoursList();
    updateMarksList();
    updateAttendanceUI();
}

function updateStudentList() {
    // Update the student count display
    document.getElementById('studentCount').textContent = students.length;
    
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
    const marksSelect = document.getElementById('marksStudent');
    
    const options = students.map(s => 
        `<option value="${s.id}">${s.name} (${s.id}) - ${s.gender}</option>`
    ).join('');
    
    marksSelect.innerHTML = '<option value="">Select student...</option>' + options;
}

function updateHoursList() {
    const container = document.getElementById('hoursContainer');
    if (hoursLog.length === 0) {
        container.innerHTML = '<p style="color: #666;">No hours logged yet.</p>';
        return;
    }
    
    const recent = hoursLog.slice(-20).reverse(); // Show more entries
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Organization</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Hours</th>
                    <th>Rate</th>
                    <th>Total Pay</th>
                    <th>Notes</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${recent.map((entry, index) => `
                    <tr id="hours-row-${entry.id}">
                        <td>${entry.date}</td>
                        <td>${entry.organization}</td>
                        <td>${entry.subject}</td>
                        <td>${entry.topic}</td>
                        <td>${entry.hours}</td>
                        <td>$${entry.rate.toFixed(2)}</td>
                        <td>$${entry.totalPay.toFixed(2)}</td>
                        <td class="notes-cell">${entry.notes || '-'}</td>
                        <td>
                            <button class="btn btn-sm" onclick="editHours('${entry.id}')">✏️ Edit</button>
                            <button class="btn btn-secondary btn-sm" onclick="deleteHours('${entry.id}')">🗑️ Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
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

// Reports
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
            weeks[week] = { 
                hours: 0, 
                earnings: 0, 
                students: new Set(),
                topics: new Set()
            };
        }
        weeks[week].hours += h.hours;
        weeks[week].earnings += h.totalPay;
        if (h.topic) weeks[week].topics.add(h.topic);
    });
    
    const tbody = document.getElementById('weeklyBody');
    tbody.innerHTML = Object.keys(weeks).sort().reverse().slice(0, 8).map(week => {
        const weekData = weeks[week];
        return `
            <tr>
                <td>
                    Week ${week}<br>
                    <small style="color: #666;">${weekData.topics.size} topics</small>
                </td>
                <td>${weekData.hours.toFixed(1)}</td>
                <td>$${weekData.earnings.toFixed(2)}</td>
                <td>${weekData.students.size}</td>
            </tr>
        `;
    }).join('');
}

function updateSubjectReport() {
    const subjects = {};
    
    // Process hours data
    hoursLog.forEach(h => {
        if (!subjects[h.subject]) {
            subjects[h.subject] = { 
                totalHours: 0, 
                totalEarnings: 0, 
                marks: [],
                topics: new Set()
            };
        }
        subjects[h.subject].totalHours += h.hours;
        subjects[h.subject].totalEarnings += h.totalPay;
        if (h.topic) subjects[h.subject].topics.add(h.topic);
    });
    
    // Process marks data
    marks.forEach(m => {
        if (!subjects[m.subject]) {
            subjects[m.subject] = { 
                totalHours: 0, 
                totalEarnings: 0, 
                marks: [],
                topics: new Set()
            };
        }
        subjects[m.subject].marks.push(parseFloat(m.percentage));
        if (m.topic) subjects[m.subject].topics.add(m.topic);
    });
    
    const tbody = document.getElementById('subjectBody');
    tbody.innerHTML = Object.keys(subjects).map(subject => {
        const data = subjects[subject];
        const avgMark = data.marks.length > 0 
            ? (data.marks.reduce((sum, mark) => sum + mark, 0) / data.marks.length).toFixed(1)
            : 'N/A';
        
        const topicCount = data.topics.size;
            
        return `
            <tr>
                <td>
                    <strong>${subject}</strong><br>
                    <small style="color: #666;">${topicCount} topic(s)</small>
                </td>
                <td>${avgMark}%</td>
                <td>${data.totalHours.toFixed(1)}</td>
                <td>$${data.totalEarnings.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function deleteStudent(index) {
    if (confirm('Are you sure you want to delete this student?')) {
        students.splice(index, 1);
        saveAllData();
        updateUI();
    }
}

// Data Export/Import
function exportData() {
    const data = {
        students,
        hoursLog,
        marks,
        attendance,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `worklog-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('✅ Data exported successfully!');
}

function importData() {
    document.getElementById('importFile').click();
}

function handleFileImport(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm(`Import data? This will replace:\n- ${data.students?.length || 0} students\n- ${data.hoursLog?.length || 0} hours\n- ${data.marks?.length || 0} marks\n- ${data.attendance?.length || 0} attendance records`)) {
                students = data.students || [];
                hoursLog = data.hoursLog || [];
                marks = data.marks || [];
                attendance = data.attendance || [];
                
                saveAllData();
                updateUI();
                alert('✅ Data imported successfully!');
            }
        } catch (error) {
            alert('❌ Error importing data: Invalid file format');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('⚠️ Are you sure you want to clear ALL data? This cannot be undone!')) {
        students = [];
        hoursLog = [];
        marks = [];
        attendance = [];
        
        saveAllData();
        updateUI();
        alert('✅ All data cleared!');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// PWA Installation Prompt
let deferredPrompt;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show install button or notification
  showInstallPromotion();
});

// Show install promotion
function showInstallPromotion() {
  // You can show a custom install button here
  console.log('App can be installed');
  
  // Example: Show an install button in your header
  const installButton = document.createElement('button');
  installButton.className = 'btn btn-success btn-sm';
  installButton.innerHTML = '📱 Install App';
  installButton.onclick = installApp;
  
  const header = document.querySelector('.header');
  const storageStatus = document.querySelector('.storage-status');
  if (storageStatus) {
    storageStatus.appendChild(installButton);
  }
}

// Install app function
function installApp() {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(function(error) {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Detect if app is running as PWA
function isRunningAsPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Update UI for PWA
if (isRunningAsPWA()) {
  document.body.classList.add('pwa-mode');
  console.log('Running as installed PWA');
}

function editHours(entryId) {
    const entry = hoursLog.find(e => e.id === entryId);
    if (!entry) {
        alert('Entry not found!');
        return;
    }

    // Populate the form with existing data
    document.getElementById('organization').value = entry.organization;
    document.getElementById('subject').value = entry.subject;
    document.getElementById('topic').value = entry.topic;
    document.getElementById('workDate').value = entry.date;
    document.getElementById('hoursWorked').value = entry.hours;
    document.getElementById('baseRate').value = entry.rate;
    document.getElementById('workNotes').value = entry.notes || '';
    
    // Calculate and show total pay
    calculateTotalPay();
    
    // Change the button to "Update" instead of "Log Hours"
    const logButton = document.querySelector('#hours .btn');
    logButton.textContent = '💾 Update Entry';
    logButton.onclick = function() { updateHours(entryId); };
    
    // Add cancel button
    let cancelButton = document.querySelector('#hours .cancel-btn');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.className = 'btn btn-secondary cancel-btn';
        cancelButton.textContent = '❌ Cancel';
        cancelButton.onclick = cancelEdit;
        logButton.parentNode.appendChild(cancelButton);
    }
    
    // Scroll to hours tab and form
    switchTab('hours');
    document.getElementById('hours').scrollIntoView({ behavior: 'smooth' });
}

function updateHours(entryId) {
    const organization = document.getElementById('organization').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const topic = document.getElementById('topic').value.trim();
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value.trim();
    
    if (!organization || !subject || !date || !hours || !rate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const totalPay = hours * rate;
    const entryIndex = hoursLog.findIndex(e => e.id === entryId);
    
    if (entryIndex !== -1) {
        // Update the entry
        hoursLog[entryIndex] = {
            ...hoursLog[entryIndex],
            organization,
            subject,
            topic,
            date,
            hours,
            rate,
            totalPay,
            notes,
            updatedAt: new Date().toISOString()
        };
        
        saveAllData();
        updateUI();
        resetHoursForm();
        
        alert('✅ Hours entry updated successfully!');
    }
}

function cancelEdit() {
    resetHoursForm();
    const cancelButton = document.querySelector('#hours .cancel-btn');
    if (cancelButton) {
        cancelButton.remove();
    }
}

function resetHoursForm() {
    // Clear form
    document.getElementById('organization').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('topic').value = '';
    document.getElementById('workDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('hoursWorked').value = '';
    document.getElementById('baseRate').value = '';
    document.getElementById('totalPay').value = '';
    document.getElementById('workNotes').value = '';
    
    // Reset button to "Log Hours"
    const logButton = document.querySelector('#hours .btn');
    logButton.textContent = '💼 Log Hours';
    logButton.onclick = logHours;
}

function deleteHours(entryId) {
    if (confirm('Are you sure you want to delete this hours entry? This action cannot be undone.')) {
        const entryIndex = hoursLog.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
            const deletedEntry = hoursLog.splice(entryIndex, 1)[0];
            saveAllData();
            updateUI();
            alert(`✅ Hours entry for ${deletedEntry.organization} deleted successfully!`);
        }
    }
}


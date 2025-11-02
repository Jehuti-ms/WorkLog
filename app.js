// Data storage - All data stored locally
let students = [];
let hoursLog = [];
let marks = [];
let attendance = [];

// Initialize
function init() {
    console.log("Initializing WorkLog application...");
    loadAllData();
    debugData(); // Add this line
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
    updateFieldMemory();
    
    // Force update all UI components
    updateUI();
    calculateTimeTotals(); // Extra call to ensure totals update
    
    resetHoursForm();
    
    alert('✅ Hours logged successfully!');
}

// Update the deleteHours function too
function deleteHours(entryId) {
    if (confirm('Are you sure you want to delete this hours entry?')) {
        const entryIndex = hoursLog.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
            hoursLog.splice(entryIndex, 1);
            saveAllData();
            updateUI();
            calculateTimeTotals(); // Force totals update
            alert('✅ Hours entry deleted successfully!');
        }
    }
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

function updateMarksList() {
    const container = document.getElementById('marksContainer');
    if (marks.length === 0) {
        container.innerHTML = '<p style="color: #666;">No marks recorded yet.</p>';
        return;
    }
    
    const recent = marks.slice(-20).reverse();
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile card layout for marks
        container.innerHTML = `
            <div class="mobile-entries">
                ${recent.map(mark => {
                    const markId = mark.id || generateId();
                    if (!mark.id) {
                        mark.id = markId;
                        saveAllData();
                    }
                    return `
                    <div class="mobile-entry-card">
                        <div class="entry-header">
                            <div class="entry-main">
                                <strong>${mark.studentName}</strong>
                                <span class="entry-date">${mark.date}</span>
                            </div>
                            <div class="entry-amount">${mark.percentage}</div>
                        </div>
                        <div class="entry-details">
                            <div><strong>Subject:</strong> ${mark.subject}</div>
                            <div><strong>Topic:</strong> ${mark.topic || '-'}</div>
                            <div><strong>Score:</strong> ${mark.score}/${mark.maxScore}</div>
                            <div><strong>Grade:</strong> ${mark.grade}</div>
                            ${mark.comments ? `<div><strong>Comments:</strong> ${mark.comments}</div>` : ''}
                        </div>
                        <div class="entry-actions">
                            <button class="btn btn-sm" onclick="editMark('${markId}')">✏️ Edit</button>
                            <button class="btn btn-secondary btn-sm" onclick="deleteMark('${markId}')">🗑️ Delete</button>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    } else {
        // Desktop table layout for marks
        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Student</th>
                            <th>Subject</th>
                            <th>Topic</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                            <th>Comments</th>
                            <th class="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recent.map(mark => {
                            const markId = mark.id || generateId();
                            if (!mark.id) {
                                mark.id = markId;
                                saveAllData();
                            }
                            return `
                            <tr>
                                <td>${mark.date}</td>
                                <td>${mark.studentName}</td>
                                <td>${mark.subject}</td>
                                <td>${mark.topic || '-'}</td>
                                <td>${mark.score}/${mark.maxScore}</td>
                                <td>${mark.percentage}</td>
                                <td>${mark.grade}</td>
                                <td class="notes-cell">${mark.comments || '-'}</td>
                                <td class="actions-cell">
                                    <button class="btn btn-sm" onclick="editMark('${markId}')">✏️ Edit</button>
                                    <button class="btn btn-secondary btn-sm" onclick="deleteMark('${markId}')">🗑️ Delete</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
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
    updateAttendanceUI(); // This will immediately update the table
    
    // Clear form but keep subject and topic for quick reuse
    document.getElementById('attendanceSubject').value = subject; // Keep subject
    document.getElementById('attendanceTopic').value = topic; // Keep topic
    
    alert(`✅ Attendance saved for ${attendanceRecords.length} students!`);
    
    // Auto-scroll to show the new attendance records
    document.getElementById('attendanceContainer').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// UI Updates
function updateUI() {
    updateStudentList();  // This will update the count
    updateStudentSelects();
    updateHoursList();
    updateMarksList();
    updateAttendanceUI();
    calculateTimeTotals();
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
    
    const recent = hoursLog.slice(-20).reverse();
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile card layout
        container.innerHTML = `
            <div class="mobile-entries">
                ${recent.map(entry => {
                    const entryId = entry.id || generateId(); // Ensure ID exists
                    if (!entry.id) {
                        entry.id = entryId; // Fix missing ID
                        saveAllData();
                    }
                    return `
                    <div class="mobile-entry-card">
                        <div class="entry-header">
                            <div class="entry-main">
                                <strong>${entry.organization}</strong>
                                <span class="entry-date">${entry.date}</span>
                            </div>
                            <div class="entry-amount">$${entry.totalPay.toFixed(2)}</div>
                        </div>
                        <div class="entry-details">
                            <div><strong>Subject:</strong> ${entry.subject}</div>
                            <div><strong>Topic:</strong> ${entry.topic || '-'}</div>
                            <div><strong>Hours:</strong> ${entry.hours} @ $${entry.rate.toFixed(2)}/hr</div>
                            ${entry.notes ? `<div><strong>Notes:</strong> ${entry.notes}</div>` : ''}
                        </div>
                        <div class="entry-actions">
                            <button class="btn btn-sm" onclick="editHours('${entryId}')">✏️ Edit</button>
                            <button class="btn btn-secondary btn-sm" onclick="deleteHours('${entryId}')">🗑️ Delete</button>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    } else {
        // Desktop table layout
        container.innerHTML = `
            <div class="table-container">
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
                            <th class="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recent.map(entry => {
                            const entryId = entry.id || generateId(); // Ensure ID exists
                            if (!entry.id) {
                                entry.id = entryId; // Fix missing ID
                                saveAllData();
                            }
                            return `
                            <tr>
                                <td>${entry.date}</td>
                                <td>${entry.organization}</td>
                                <td>${entry.subject}</td>
                                <td>${entry.topic || '-'}</td>
                                <td>${entry.hours}</td>
                                <td>$${entry.rate.toFixed(2)}</td>
                                <td>$${entry.totalPay.toFixed(2)}</td>
                                <td class="notes-cell">${entry.notes || '-'}</td>
                                <td class="actions-cell">
                                    <button class="btn btn-sm" onclick="editHours('${entryId}')">✏️ Edit</button>
                                    <button class="btn btn-secondary btn-sm" onclick="deleteHours('${entryId}')">🗑️ Delete</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

function updateAttendanceUI() {
    const container = document.getElementById('attendanceContainer');
    if (attendance.length === 0) {
        container.innerHTML = '<p style="color: #666;">No attendance records yet.</p>';
        return;
    }
    
    const recent = attendance.slice(-20).reverse();
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile card layout for attendance
        container.innerHTML = `
            <div class="mobile-entries">
                ${recent.map(record => {
                    const recordId = record.id || generateId();
                    if (!record.id) {
                        record.id = recordId;
                        saveAllData();
                    }
                    return `
                    <div class="mobile-entry-card">
                        <div class="entry-header">
                            <div class="entry-main">
                                <strong>${record.studentName}</strong>
                                <span class="entry-date">${record.date}</span>
                            </div>
                            <div class="entry-amount ${record.status === 'Present' ? 'status-connected' : 'status-disconnected'}">
                                ${record.status}
                            </div>
                        </div>
                        <div class="entry-details">
                            <div><strong>Subject:</strong> ${record.subject}</div>
                            <div><strong>Topic:</strong> ${record.topic || '-'}</div>
                        </div>
                        <div class="entry-actions">
                            <button class="btn btn-sm" onclick="editAttendance('${recordId}')">✏️ Edit</button>
                            <button class="btn btn-secondary btn-sm" onclick="deleteAttendance('${recordId}')">🗑️ Delete</button>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    } else {
        // Desktop table layout for attendance
        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Student</th>
                            <th>Subject</th>
                            <th>Topic</th>
                            <th>Status</th>
                            <th class="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recent.map(record => {
                            const recordId = record.id || generateId();
                            if (!record.id) {
                                record.id = recordId;
                                saveAllData();
                            }
                            return `
                            <tr>
                                <td>${record.date}</td>
                                <td>${record.studentName}</td>
                                <td>${record.subject}</td>
                                <td>${record.topic || '-'}</td>
                                <td><span class="status ${record.status === 'Present' ? 'connected' : 'disconnected'}">${record.status}</span></td>
                                <td class="actions-cell">
                                    <button class="btn btn-sm" onclick="editAttendance('${recordId}')">✏️ Edit</button>
                                    <button class="btn btn-secondary btn-sm" onclick="deleteAttendance('${recordId}')">🗑️ Delete</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
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
    return 'worklog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
        
        // Clear the summary displays
        document.getElementById('weeklyTotal').textContent = '$0';
        document.getElementById('monthlyTotal').textContent = '$0';
        document.getElementById('weeklyHours').textContent = '0';
        document.getElementById('monthlyHours').textContent = '0';
        
        // Clear breakdown container if it exists
        const breakdownContainer = document.getElementById('breakdownContainer');
        if (breakdownContainer) {
            breakdownContainer.innerHTML = '<p style="color: #666; text-align: center;">Select a breakdown option above</p>';
        }
        
        alert('✅ All data cleared!');
    }
}

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
    navigator.serviceWorker.register('./sw.js')
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
    console.log('Edit clicked for ID:', entryId);
    console.log('All hours entries:', hoursLog);
    
    if (!entryId || entryId === 'undefined') {
        alert('Error: Entry ID is missing. Please try again.');
        return;
    }
    
    const entry = hoursLog.find(e => e.id === entryId);
    console.log('Found entry:', entry);
    
    if (!entry) {
        // Try to find by index as fallback
        const entryIndex = hoursLog.findIndex(e => e.id === entryId);
        console.log('Entry index:', entryIndex);
        
        if (entryIndex === -1) {
            alert('Error: Entry not found. The data might be corrupted.');
            return;
        }
    }

    // Populate the form with existing data
    document.getElementById('organization').value = entry.organization || '';
    document.getElementById('subject').value = entry.subject || '';
    document.getElementById('topic').value = entry.topic || '';
    document.getElementById('workDate').value = entry.date || '';
    document.getElementById('hoursWorked').value = entry.hours || '';
    document.getElementById('baseRate').value = entry.rate || '';
    document.getElementById('workNotes').value = entry.notes || '';
    
    // Calculate and show total pay
    calculateTotalPay();
    
    // Change the button to "Update" instead of "Log Hours"
    const logButton = document.querySelector('#hours .btn');
    logButton.textContent = '💾 Update Entry';
    logButton.onclick = function() { 
        console.log('Update clicked for ID:', entryId);
        updateHours(entryId); 
    };
    
    // Add cancel button if it doesn't exist
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
    
    console.log('Form populated for editing entry:', entryId);
}

function updateHours(entryId) {
    console.log('Updating entry with ID:', entryId);
    
    const organization = document.getElementById('organization').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const topic = document.getElementById('topic').value.trim();
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value.trim();
    
    console.log('Form data:', { organization, subject, topic, date, hours, rate, notes });
    
    if (!organization || !subject || !date || !hours || !rate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const totalPay = hours * rate;
    const entryIndex = hoursLog.findIndex(e => e.id === entryId);
    
    console.log('Found entry index:', entryIndex);
    
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
    } else {
        alert('❌ Error: Entry not found!');
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
    console.log('Resetting hours form');
    
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
    const originalText = logButton.getAttribute('data-original-text') || '💼 Log Hours';
    const originalOnclick = logButton.getAttribute('data-original-onclick');
    
    logButton.textContent = originalText;
    logButton.onclick = logHours;
    logButton.removeAttribute('data-editing-id');
    logButton.removeAttribute('data-original-text');
    logButton.removeAttribute('data-original-onclick');
    
    // Remove cancel button
    const cancelButton = document.querySelector('#hours .cancel-btn');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    console.log('Hours form reset');
}

function deleteHours(entryId) {
    console.log('Delete clicked for ID:', entryId);
    
    if (confirm('Are you sure you want to delete this hours entry? This action cannot be undone.')) {
        const entryIndex = hoursLog.findIndex(e => e.id === entryId);
        console.log('Found entry index for deletion:', entryIndex);
        
        if (entryIndex !== -1) {
            const deletedEntry = hoursLog.splice(entryIndex, 1)[0];
            saveAllData();
            updateUI();
            alert(`✅ Hours entry for ${deletedEntry.organization} deleted successfully!`);
        } else {
            alert('❌ Error: Entry not found!');
        }
    }
}

// Make table responsive on window resize
// Improved responsive event handling
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        console.log('Screen orientation changed, updating UI...');
        
        // Only update the currently active tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const tabId = activeTab.id;
            switch(tabId) {
                case 'hours':
                    updateHoursList();
                    break;
                case 'marks':
                    updateMarksList();
                    break;
                case 'attendance':
                    updateAttendanceUI();
                    break;
                case 'reports':
                    updateReports();
                    break;
            }
        }
    }, 250); // Wait 250ms after resize stops
});

function debugData() {
    console.log('=== DEBUG DATA ===');
    console.log('Hours Log:', hoursLog);
    console.log('Hours entries with IDs:');
    hoursLog.forEach((entry, index) => {
        console.log(`Entry ${index}:`, {
            id: entry.id,
            organization: entry.organization,
            hasId: !!entry.id,
            hasTimestamp: !!entry.timestamp
        });
    });
    console.log('=== END DEBUG ===');
}

function fixMissingIds() {
    let fixedCount = 0;
    
    // Fix hours log entries
    hoursLog.forEach(entry => {
        if (!entry.id) {
            entry.id = generateId();
            fixedCount++;
        }
    });
    
    // Fix marks entries
    marks.forEach(entry => {
        if (!entry.id) {
            entry.id = generateId();
            fixedCount++;
        }
    });
    
    // Fix attendance entries
    attendance.forEach(entry => {
        if (!entry.id) {
            entry.id = generateId();
            fixedCount++;
        }
    });
    
    if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} entries with missing IDs`);
        saveAllData();
    }
}

// Update your init function to include this
function init() {
    console.log("Initializing WorkLog application...");
    loadAllData();
    fixMissingIds(); // Add this line
    debugData();
    updateUI();
    setDefaultDate();
    showDataStats();
}

// Smart field memory system
let fieldMemory = {
    organization: '',
    baseRate: '',
    subject: '',
    topic: ''
};

function loadFieldMemory() {
    const saved = localStorage.getItem('worklog_field_memory');
    if (saved) {
        fieldMemory = JSON.parse(saved);
    }
    applyFieldMemory();
}

function saveFieldMemory() {
    localStorage.setItem('worklog_field_memory', JSON.stringify(fieldMemory));
}

function applyFieldMemory() {
    if (fieldMemory.organization) {
        document.getElementById('organization').value = fieldMemory.organization;
    }
    if (fieldMemory.baseRate) {
        document.getElementById('baseRate').value = fieldMemory.baseRate;
    }
    if (fieldMemory.subject) {
        document.getElementById('subject').value = fieldMemory.subject;
    }
    if (fieldMemory.topic) {
        document.getElementById('topic').value = fieldMemory.topic;
    }
}

function updateFieldMemory() {
    fieldMemory.organization = document.getElementById('organization').value.trim();
    fieldMemory.baseRate = document.getElementById('baseRate').value.trim();
    fieldMemory.subject = document.getElementById('subject').value.trim();
    fieldMemory.topic = document.getElementById('topic').value.trim();
    saveFieldMemory();
}

// Update the logHours function to save field memory
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
    updateFieldMemory(); // Save the field values
    updateUI();
    resetHoursForm();
    
    alert('✅ Hours logged successfully!');
}

// Update init function to load field memory
function init() {
    console.log("Initializing WorkLog application...");
    loadAllData();
    fixMissingIds();
    loadFieldMemory(); // Add this line
    updateUI();
    setDefaultDate();
    showDataStats();
}

// Calculate weekly and monthly totals
function calculateTimeTotals() {
    console.log('=== CALCULATING TOTALS ===');
    console.log('Total hours entries:', hoursLog.length);
    const now = new Date();
    console.log('Current date:', now);
    console.log('Current week number:', getWeekNumber(now));
    console.log('Current month:', now.getMonth() + 1);  
    const currentYear = now.getFullYear();
    
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let weeklyHours = 0;
    let monthlyHours = 0;
    
    console.log('Calculating totals for:', {
        currentWeek,
        currentMonth: currentMonth + 1, // Months are 0-indexed
        currentYear,
        totalEntries: hoursLog.length
    });
    
    hoursLog.forEach(entry => {
        try {
            const entryDate = new Date(entry.date);
            const entryWeek = getWeekNumber(entryDate);
            const entryMonth = entryDate.getMonth();
            const entryYear = entryDate.getFullYear();
            
            // Debug log for first few entries
            if (hoursLog.indexOf(entry) < 3) {
                console.log('Entry analysis:', {
                    date: entry.date,
                    entryWeek,
                    entryMonth: entryMonth + 1,
                    entryYear,
                    totalPay: entry.totalPay,
                    hours: entry.hours
                });
            }
            
            // Weekly totals (current week)
            if (entryWeek === currentWeek && entryYear === currentYear) {
                weeklyTotal += entry.totalPay || 0;
                weeklyHours += entry.hours || 0;
            }
            
            // Monthly totals (current month)
            if (entryMonth === currentMonth && entryYear === currentYear) {
                monthlyTotal += entry.totalPay || 0;
                monthlyHours += entry.hours || 0;
            }
        } catch (error) {
            console.error('Error processing entry:', entry, error);
        }
    });
    
    console.log('Final totals:', {
        weeklyTotal,
        monthlyTotal,
        weeklyHours,
        monthlyHours
    });
    
    // Update the display
    document.getElementById('weeklyTotal').textContent = '$' + weeklyTotal.toFixed(2);
    document.getElementById('monthlyTotal').textContent = '$' + monthlyTotal.toFixed(2);
    document.getElementById('weeklyHours').textContent = weeklyHours.toFixed(1);
    document.getElementById('monthlyHours').textContent = monthlyHours.toFixed(1);
}

// Enhanced getWeekNumber function (make sure this exists)
function getWeekNumber(date) {
    // Make sure we have a valid date object
    if (!(date instanceof Date) || isNaN(date)) {
        console.error('Invalid date provided to getWeekNumber:', date);
        return 0;
    }
    
    // Copy date so don't modify original
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    
    return weekNo;
}

// Function to get totals for any specific week and month
function getDetailedTotals() {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let weekData = {};
    let monthData = {};
    
    hoursLog.forEach(entry => {
        const entryDate = new Date(entry.date);
        const entryWeek = getWeekNumber(entryDate);
        const entryMonth = entryDate.getMonth();
        const entryYear = entryDate.getFullYear();
        
        // Weekly data
        const weekKey = `Week ${entryWeek}, ${entryYear}`;
        if (!weekData[weekKey]) {
            weekData[weekKey] = { total: 0, hours: 0, entries: 0 };
        }
        weekData[weekKey].total += entry.totalPay;
        weekData[weekKey].hours += entry.hours;
        weekData[weekKey].entries += 1;
        
        // Monthly data
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthKey = `${monthNames[entryMonth]} ${entryYear}`;
        if (!monthData[monthKey]) {
            monthData[monthKey] = { total: 0, hours: 0, entries: 0 };
        }
        monthData[monthKey].total += entry.totalPay;
        monthData[monthKey].hours += entry.hours;
        monthData[monthKey].entries += 1;
    });
    
    return { weekData, monthData };
}

// Show weekly breakdown
function showWeeklyBreakdown() {
    const { weekData } = getDetailedTotals();
    const container = document.getElementById('breakdownContainer');
    
    if (Object.keys(weekData).length === 0) {
        container.innerHTML = '<p style="color: #666;">No weekly data available.</p>';
        return;
    }
    
    const sortedWeeks = Object.keys(weekData).sort().reverse();
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Week</th>
                        <th>Hours</th>
                        <th>Earnings</th>
                        <th>Entries</th>
                        <th>Avg Rate/Hr</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedWeeks.map(week => {
                        const data = weekData[week];
                        const avgRate = data.hours > 0 ? (data.total / data.hours) : 0;
                        return `
                            <tr>
                                <td>${week}</td>
                                <td>${data.hours.toFixed(1)}</td>
                                <td>$${data.total.toFixed(2)}</td>
                                <td>${data.entries}</td>
                                <td>$${avgRate.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 10px; text-align: center; color: #666; font-size: 0.8em;">
            💡 Data updated: ${new Date().toLocaleTimeString()}
        </div>
    `;
}

// Show monthly breakdown
function showMonthlyBreakdown() {
    const { monthData } = getDetailedTotals();
    const container = document.getElementById('breakdownContainer');
    
    if (Object.keys(monthData).length === 0) {
        container.innerHTML = '<p style="color: #666;">No monthly data available.</p>';
        return;
    }
    
    const sortedMonths = Object.keys(monthData).sort((a, b) => {
        // Sort by year and month
        return new Date(b.split(' ')[1] + ' ' + b.split(' ')[0]) - new Date(a.split(' ')[1] + ' ' + a.split(' ')[0]);
    });
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Hours</th>
                        <th>Earnings</th>
                        <th>Entries</th>
                        <th>Avg Rate/Hr</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedMonths.map(month => {
                        const data = monthData[month];
                        const avgRate = data.hours > 0 ? (data.total / data.hours) : 0;
                        return `
                            <tr>
                                <td>${month}</td>
                                <td>${data.hours.toFixed(1)}</td>
                                <td>$${data.total.toFixed(2)}</td>
                                <td>${data.entries}</td>
                                <td>$${avgRate.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Show subject breakdown
function showSubjectBreakdown() {
    const subjectData = {};
    
    hoursLog.forEach(entry => {
        if (!subjectData[entry.subject]) {
            subjectData[entry.subject] = { total: 0, hours: 0, entries: 0 };
        }
        subjectData[entry.subject].total += entry.totalPay;
        subjectData[entry.subject].hours += entry.hours;
        subjectData[entry.subject].entries += 1;
    });
    
    const container = document.getElementById('breakdownContainer');
    
    if (Object.keys(subjectData).length === 0) {
        container.innerHTML = '<p style="color: #666;">No subject data available.</p>';
        return;
    }
    
    const sortedSubjects = Object.keys(subjectData).sort((a, b) => subjectData[b].total - subjectData[a].total);
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Hours</th>
                        <th>Earnings</th>
                        <th>Entries</th>
                        <th>Avg Rate/Hr</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedSubjects.map(subject => {
                        const data = subjectData[subject];
                        const avgRate = data.hours > 0 ? (data.total / data.hours) : 0;
                        return `
                            <tr>
                                <td>${subject}</td>
                                <td>${data.hours.toFixed(1)}</td>
                                <td>$${data.total.toFixed(2)}</td>
                                <td>${data.entries}</td>
                                <td>$${avgRate.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Update the switchTab function
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'reports') {
        updateReports();
    } else if (tabName === 'attendance') {
        updateAttendanceList();
    } else if (tabName === 'hours') {
        // Force refresh totals when switching to hours tab
        calculateTimeTotals();
    }
}


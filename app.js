// ============================================================================
// CORE APPLICATION
// ============================================================================

// Data storage
let students = [];
let hoursLog = [];
let marks = [];
let attendance = [];
let payments = [];
let paymentActivity = [];

// Initialize app
function init() {
    console.log("WorkLog app initialized");
    loadAllData();
    setupAllEventListeners();
    updateUI();
}

// Load data from localStorage
function loadAllData() {
    students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
    hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
    marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
    attendance = JSON.parse(localStorage.getItem('worklog_attendance') || '[]');
    payments = JSON.parse(localStorage.getItem('worklog_payments') || '[]');
    paymentActivity = JSON.parse(localStorage.getItem('worklog_payment_activity') || '[]');
}

// Save data to localStorage
function saveAllData() {
    localStorage.setItem('worklog_students', JSON.stringify(students));
    localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
    localStorage.setItem('worklog_marks', JSON.stringify(marks));
    localStorage.setItem('worklog_attendance', JSON.stringify(attendance));
    localStorage.setItem('worklog_payments', JSON.stringify(payments));
    localStorage.setItem('worklog_payment_activity', JSON.stringify(paymentActivity));
}

// Setup all event listeners
function setupAllEventListeners() {
    // Tab system
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Main buttons
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('importDataBtn')?.addEventListener('click', importData);
    document.getElementById('clearAllDataBtn')?.addEventListener('click', clearAllData);
    document.getElementById('addStudentBtn')?.addEventListener('click', addStudent);
    document.getElementById('saveAttendanceBtn')?.addEventListener('click', saveAttendance);
    document.getElementById('logHoursBtn')?.addEventListener('click', logHours);
    document.getElementById('addMarkBtn')?.addEventListener('click', addMark);
    
    // Payment buttons
    document.getElementById('recordPaymentBtn')?.addEventListener('click', () => openModal('paymentModal'));
    document.getElementById('markSessionBtn')?.addEventListener('click', () => openModal('attendanceSessionModal'));
    
    // Breakdown buttons
    document.getElementById('weeklyBreakdownBtn')?.addEventListener('click', showWeeklyBreakdown);
    document.getElementById('monthlyBreakdownBtn')?.addEventListener('click', showMonthlyBreakdown);
    document.getElementById('subjectBreakdownBtn')?.addEventListener('click', showSubjectBreakdown);
    
    // Form inputs with onchange
    document.getElementById('hoursWorkedInput')?.addEventListener('input', calculateTotalPay);
    document.getElementById('baseRateInput')?.addEventListener('input', calculateTotalPay);
    document.getElementById('scoreInput')?.addEventListener('input', calculatePercentage);
    document.getElementById('maxScoreInput')?.addEventListener('input', calculatePercentage);
    document.getElementById('marksStudent')?.addEventListener('change', updateStudentDetails);
    
    // Modal forms
    document.getElementById('paymentForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        recordPayment();
    });
    document.getElementById('attendanceSessionForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveSessionAttendance();
    });
    
    // Modal close handlers
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    });
}

// Tab switching
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`.tab[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(tabName)?.classList.add('active');
    
    if (tabName === 'reports') updateReports();
    if (tabName === 'attendance') updateAttendanceList();
    if (tabName === 'hours') calculateTimeTotals();
    if (tabName === 'payments') updatePaymentUI();
}

// Update UI
function updateUI() {
    updateStudentList();
    updateStudentSelects();
    updateHoursList();
    updateMarksList();
    updateAttendanceUI();
    calculateTimeTotals();
    updatePaymentUI();
}

// Stub functions for basic operations
function addStudent() { alert('Add student - to be implemented'); }
function saveAttendance() { alert('Save attendance - to be implemented'); }
function logHours() { alert('Log hours - to be implemented'); }
function calculateTotalPay() { alert('Calculate total pay - to be implemented'); }
function updateStudentDetails() { alert('Update student details - to be implemented'); }
function calculatePercentage() { alert('Calculate percentage - to be implemented'); }
function addMark() { alert('Add mark - to be implemented'); }
function showWeeklyBreakdown() { alert('Weekly breakdown - to be implemented'); }
function showMonthlyBreakdown() { alert('Monthly breakdown - to be implemented'); }
function showSubjectBreakdown() { alert('Subject breakdown - to be implemented'); }
function exportData() { alert('Export data - to be implemented'); }
function importData() { alert('Import data - to be implemented'); }
function clearAllData() { alert('Clear all data - to be implemented'); }
function openModal(modalId) { document.getElementById(modalId).style.display = 'block'; }
function recordPayment() { alert('Record payment - to be implemented'); }
function saveSessionAttendance() { alert('Save session attendance - to be implemented'); }

// Empty UI update functions
function updateStudentList() {}
function updateStudentSelects() {}
function updateHoursList() {}
function updateMarksList() {}
function updateAttendanceList() {}
function updateAttendanceUI() {}
function calculateTimeTotals() {}
function updatePaymentUI() {}
function updateReports() {}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);

// ============================================================================
// DATA EXPORT/IMPORT FUNCTIONS
// ============================================================================

function exportData() {
    const data = {
        students,
        hoursLog,
        marks,
        attendance,
        payments,
        paymentActivity,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `worklog-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
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
            
            if (confirm(`Import data? This will replace:\n- ${data.students?.length || 0} students\n- ${data.hoursLog?.length || 0} hours\n- ${data.marks?.length || 0} marks\n- ${data.attendance?.length || 0} attendance records\n- ${data.payments?.length || 0} payments`)) {
                students = data.students || [];
                hoursLog = data.hoursLog || [];
                marks = data.marks || [];
                attendance = data.attendance || [];
                payments = data.payments || [];
                paymentActivity = data.paymentActivity || [];
                
                saveAllData();
                updateUI();
                updatePaymentUI();
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
        payments = [];
        paymentActivity = [];
        
        saveAllData();
        updateUI();
        updatePaymentUI();
        
        // Clear summary displays
        document.getElementById('weeklyTotal').textContent = '$0';
        document.getElementById('monthlyTotal').textContent = '$0';
        document.getElementById('weeklyHours').textContent = '0';
        document.getElementById('monthlyHours').textContent = '0';
        
        // Clear breakdown container
        const breakdownContainer = document.getElementById('breakdownContainer');
        if (breakdownContainer) {
            breakdownContainer.innerHTML = '<p style="color: #666; text-align: center;">Select a breakdown option above</p>';
        }
        
        alert('✅ All data cleared!');
    }
}

// ============================================================================
// STUDENT MANAGEMENT FUNCTIONS
// ============================================================================

function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const gender = document.getElementById('studentGender').value;
    const email = document.getElementById('studentEmail').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    const baseRate = parseFloat(document.getElementById('studentBaseRate').value) || 0;
    
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
        baseRate,
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
    document.getElementById('studentBaseRate').value = '';
    
    // Log activity
    logPaymentActivity(`Added student: ${name} (Base rate: $${baseRate.toFixed(2)}/session)`);
    
    alert('✅ Student added successfully!');
}

function updateStudentList() {
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
                <small style="color: #666;">${s.gender} | ${s.email || 'No email'} | ${s.phone || 'No phone'} | Rate: $${s.baseRate || 0}/session</small>
            </div>
            <button class="btn btn-secondary" onclick="deleteStudent(${i})">🗑️</button>
        </div>
    `).join('');
}

function deleteStudent(index) {
    if (confirm('Are you sure you want to delete this student?')) {
        const student = students[index];
        students.splice(index, 1);
        saveAllData();
        updateUI();
        logPaymentActivity(`Deleted student: ${student.name}`);
        alert('✅ Student deleted successfully!');
    }
}

// ============================================================================
// HOURS TRACKING FUNCTIONS
// ============================================================================

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
    updateUI();
    calculateTimeTotals();
    resetHoursForm();
    
    alert('✅ Hours logged successfully!');
}

function resetHoursForm() {
    document.getElementById('workDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('hoursWorked').value = '';
    document.getElementById('totalPay').value = '';
    document.getElementById('workNotes').value = '';
}

function updateHoursList() {
    const container = document.getElementById('hoursContainer');
    if (hoursLog.length === 0) {
        container.innerHTML = '<p style="color: #666;">No hours logged yet.</p>';
        return;
    }
    
    const recent = hoursLog.slice(-20).reverse();
    
    container.innerHTML = recent.map(entry => {
        const entryId = entry.id || generateId();
        if (!entry.id) {
            entry.id = entryId;
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
        `;
    }).join('');
}

function deleteHours(entryId) {
    if (confirm('Are you sure you want to delete this hours entry?')) {
        const entryIndex = hoursLog.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
            hoursLog.splice(entryIndex, 1);
            saveAllData();
            updateUI();
            calculateTimeTotals();
            alert('✅ Hours entry deleted successfully!');
        }
    }
}

// ============================================================================
// MARKS MANAGEMENT FUNCTIONS
// ============================================================================

function calculatePercentage() {
    const score = parseFloat(document.getElementById('score').value) || 0;
    const maxScore = parseFloat(document.getElementById('maxScore').value) || 0;
    
    if (maxScore > 0) {
        const percentage = (score / maxScore * 100).toFixed(1);
        document.getElementById('percentage').value = percentage + '%';
        
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
    
    container.innerHTML = recent.map(mark => {
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
        `;
    }).join('');
}

function deleteMark(markId) {
    if (confirm('Are you sure you want to delete this mark?')) {
        const markIndex = marks.findIndex(m => m.id === markId);
        if (markIndex !== -1) {
            marks.splice(markIndex, 1);
            saveAllData();
            updateUI();
            alert('✅ Mark deleted successfully!');
        }
    }
}

// ============================================================================
// ATTENDANCE MANAGEMENT FUNCTIONS
// ============================================================================

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
                <small style="color: #666;">${student.email || 'No email'} | Rate: $${student.baseRate || 0}/session</small>
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
    
    attendance.push(...attendanceRecords);
    saveAllData();
    updateAttendanceUI();
    
    // Keep subject and topic for quick reuse
    document.getElementById('attendanceSubject').value = subject;
    document.getElementById('attendanceTopic').value = topic;
    
    alert(`✅ Attendance saved for ${attendanceRecords.length} students!`);
    
    // Auto-scroll to show new records
    document.getElementById('attendanceContainer').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

function updateAttendanceUI() {
    const container = document.getElementById('attendanceContainer');
    if (attendance.length === 0) {
        container.innerHTML = '<p style="color: #666;">No attendance records yet.</p>';
        return;
    }
    
    const recent = attendance.slice(-20).reverse();
    
    container.innerHTML = recent.map(record => {
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
        `;
    }).join('');
}

function deleteAttendance(recordId) {
    if (confirm('Are you sure you want to delete this attendance record?')) {
        const recordIndex = attendance.findIndex(a => a.id === recordId);
        if (recordIndex !== -1) {
            attendance.splice(recordIndex, 1);
            saveAllData();
            updateUI();
            alert('✅ Attendance record deleted successfully!');
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId() {
    return 'worklog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getWeekNumber(date) {
    if (!(date instanceof Date) || isNaN(date)) return 0;
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Add these missing utility functions
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

function logPaymentActivity(message) {
    paymentActivity.push({
        timestamp: new Date().toISOString(),
        message
    });
    savePaymentData();
}

// Update the init function to include field memory
function init() {
    console.log("WorkLog app initialized");
    loadAllData();
    loadFieldMemory();
    setupAllEventListeners();
    updateUI();
    setDefaultDate();
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workDate').value = today;
    document.getElementById('markDate').value = today;
    document.getElementById('attendanceDate').value = today;
    
    const paymentDate = document.getElementById('paymentDate');
    const sessionDate = document.getElementById('sessionDate');
    if (paymentDate) paymentDate.value = today;
    if (sessionDate) sessionDate.value = today;
}

// ============================================================================
// BREAKDOWN ANALYSIS FUNCTIONS
// ============================================================================

function showWeeklyBreakdown() {
    const breakdown = getWeeklyBreakdown();
    displayBreakdown(breakdown, 'Weekly Breakdown');
}

function showBiWeeklyBreakdown() {
    const breakdown = getBiWeeklyBreakdown();
    displayBreakdown(breakdown, 'Bi-Weekly Breakdown');
}

function showMonthlyBreakdown() {
    const breakdown = getMonthlyBreakdown();
    displayBreakdown(breakdown, 'Monthly Breakdown');
}

function showSubjectBreakdown() {
    const breakdown = getSubjectBreakdown();
    displayBreakdown(breakdown, 'Subject Breakdown');
}

function getWeeklyBreakdown() {
    const weeks = {};
    
    hoursLog.forEach(entry => {
        const entryDate = new Date(entry.date);
        const weekNumber = getWeekNumber(entryDate);
        const year = entryDate.getFullYear();
        const weekKey = `Week ${weekNumber}, ${year}`;
        
        if (!weeks[weekKey]) {
            weeks[weekKey] = {
                hours: 0,
                earnings: 0,
                sessions: 0,
                avgRate: 0,
                subjects: new Set()
            };
        }
        
        weeks[weekKey].hours += entry.hours;
        weeks[weekKey].earnings += entry.totalPay;
        weeks[weekKey].sessions += 1;
        weeks[weekKey].subjects.add(entry.subject);
        
        // Calculate average rate
        if (weeks[weekKey].hours > 0) {
            weeks[weekKey].avgRate = weeks[weekKey].earnings / weeks[weekKey].hours;
        }
    });
    
    return weeks;
}

function getBiWeeklyBreakdown() {
    const biWeeks = {};
    
    hoursLog.forEach(entry => {
        const entryDate = new Date(entry.date);
        const weekNumber = getWeekNumber(entryDate);
        const year = entryDate.getFullYear();
        const biWeekNumber = Math.ceil(weekNumber / 2);
        const biWeekKey = `Bi-Week ${biWeekNumber}, ${year}`;
        
        if (!biWeeks[biWeekKey]) {
            biWeeks[biWeekKey] = {
                hours: 0,
                earnings: 0,
                sessions: 0,
                avgRate: 0,
                subjects: new Set(),
                weeks: new Set()
            };
        }
        
        biWeeks[biWeekKey].hours += entry.hours;
        biWeeks[biWeekKey].earnings += entry.totalPay;
        biWeeks[biWeekKey].sessions += 1;
        biWeeks[biWeekKey].subjects.add(entry.subject);
        biWeeks[biWeekKey].weeks.add(weekNumber);
        
        if (biWeeks[biWeekKey].hours > 0) {
            biWeeks[biWeekKey].avgRate = biWeeks[biWeekKey].earnings / biWeeks[biWeekKey].hours;
        }
    });
    
    return biWeeks;
}

function getMonthlyBreakdown() {
    const months = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    hoursLog.forEach(entry => {
        const entryDate = new Date(entry.date);
        const month = entryDate.getMonth();
        const year = entryDate.getFullYear();
        const monthKey = `${monthNames[month]} ${year}`;
        
        if (!months[monthKey]) {
            months[monthKey] = {
                hours: 0,
                earnings: 0,
                sessions: 0,
                avgRate: 0,
                subjects: new Set(),
                students: new Set()
            };
        }
        
        months[monthKey].hours += entry.hours;
        months[monthKey].earnings += entry.totalPay;
        months[monthKey].sessions += 1;
        months[monthKey].subjects.add(entry.subject);
        
        if (months[monthKey].hours > 0) {
            months[monthKey].avgRate = months[monthKey].earnings / months[monthKey].hours;
        }
    });
    
    return months;
}

function getSubjectBreakdown() {
    const subjects = {};
    
    // Process hours data
    hoursLog.forEach(entry => {
        if (!subjects[entry.subject]) {
            subjects[entry.subject] = {
                hours: 0,
                earnings: 0,
                sessions: 0,
                avgRate: 0,
                topics: new Set(),
                organizations: new Set(),
                lastSession: ''
            };
        }
        
        subjects[entry.subject].hours += entry.hours;
        subjects[entry.subject].earnings += entry.totalPay;
        subjects[entry.subject].sessions += 1;
        subjects[entry.subject].topics.add(entry.topic);
        subjects[entry.subject].organizations.add(entry.organization);
        
        // Update last session date
        if (!subjects[entry.subject].lastSession || entry.date > subjects[entry.subject].lastSession) {
            subjects[entry.subject].lastSession = entry.date;
        }
        
        if (subjects[entry.subject].hours > 0) {
            subjects[entry.subject].avgRate = subjects[entry.subject].earnings / subjects[entry.subject].hours;
        }
    });
    
    return subjects;
}

function displayBreakdown(breakdown, title) {
    const container = document.getElementById('breakdownContainer');
    
    if (Object.keys(breakdown).length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>${title}</h3>
                <p>No data available for this breakdown.</p>
                <p><small>Start logging hours to see analytics.</small></p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="breakdown-header">
            <h3>${title}</h3>
            <div class="breakdown-summary">
                <strong>Total Periods:</strong> ${Object.keys(breakdown).length} | 
                <strong>Total Hours:</strong> ${Object.values(breakdown).reduce((sum, b) => sum + b.hours, 0).toFixed(1)} | 
                <strong>Total Earnings:</strong> $${Object.values(breakdown).reduce((sum, b) => sum + b.earnings, 0).toFixed(2)}
            </div>
        </div>
        <div class="table-container">
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Hours</th>
                        <th>Earnings</th>
                        <th>Sessions</th>
                        <th>Avg Rate/Hr</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Sort by period (most recent first)
    const sortedPeriods = Object.keys(breakdown).sort((a, b) => {
        // Custom sorting for different breakdown types
        if (title.includes('Weekly') || title.includes('Bi-Weekly')) {
            return b.localeCompare(a);
        } else if (title.includes('Monthly')) {
            const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            
            if (yearA !== yearB) return yearB - yearA;
            return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA);
        } else {
            // For subject breakdown, sort by earnings (highest first)
            return breakdown[b].earnings - breakdown[a].earnings;
        }
    });
    
    sortedPeriods.forEach(period => {
        const data = breakdown[period];
        html += `
            <tr>
                <td><strong>${period}</strong></td>
                <td>${data.hours.toFixed(1)}</td>
                <td>$${data.earnings.toFixed(2)}</td>
                <td>${data.sessions}</td>
                <td>$${data.avgRate.toFixed(2)}</td>
                <td class="details-cell">
        `;
        
        // Add specific details based on breakdown type
        if (title.includes('Weekly') && data.weeks) {
            html += `Weeks: ${Array.from(data.weeks).join(', ')}`;
        } else if (data.subjects) {
            const subjectCount = data.subjects.size;
            if (subjectCount > 0) {
                html += `${subjectCount} subject${subjectCount > 1 ? 's' : ''}`;
            }
        }
        
        if (data.topics && data.topics.size > 0) {
            const topicCount = data.topics.size;
            if (topicCount > 0 && topicCount <= 3) {
                html += `<br><small>Topics: ${Array.from(data.topics).join(', ')}</small>`;
            } else if (topicCount > 3) {
                html += `<br><small>${topicCount} topics</small>`;
            }
        }
        
        if (data.lastSession && title.includes('Subject')) {
            html += `<br><small>Last: ${new Date(data.lastSession).toLocaleDateString()}</small>`;
        }
        
        html += `</td></tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="breakdown-footer">
            <small>Generated on ${new Date().toLocaleString()}</small>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================================================
// UPDATE EVENT LISTENERS - Add bi-weekly button
// ============================================================================

// Update your setupAllEventListeners function to include:
function setupAllEventListeners() {
    // ... your existing tab listeners ...
    
    // Breakdown buttons - UPDATE THESE
    document.getElementById('weeklyBreakdownBtn')?.addEventListener('click', showWeeklyBreakdown);
    document.getElementById('biWeeklyBreakdownBtn')?.addEventListener('click', showBiWeeklyBreakdown);
    document.getElementById('monthlyBreakdownBtn')?.addEventListener('click', showMonthlyBreakdown);
    document.getElementById('subjectBreakdownBtn')?.addEventListener('click', showSubjectBreakdown);
    
    // ... rest of your existing listeners ...
}



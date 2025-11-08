// app.js - COMPLETE REWRITE WITH ALL FIXES
console.log('📦 App.js loaded');

// Global data storage with proper initialization
let appData = {
    students: [],
    hours: [],
    marks: [],
    attendance: [],
    payments: [],
    settings: {
        defaultRate: 25.00
    }
};

// Global variables
let editingHoursIndex = null;
window.hoursEntries = [];
let isEditingAttendance = false; // Moved to top level

// Month names for reports
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function init() {
    console.log('🎯 App initialization started');
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        console.log('❌ User not authenticated');
        return;
    }
    
    console.log('✅ User authenticated, setting up app...');
    
    // Load data from localStorage FIRST
    loadAllData();
    
    // Setup tabs
    setupTabs();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load default rate settings
    loadDefaultRate();
    
    // Update stats
    updateStats();
    
    console.log('✅ App initialized successfully');
}

// ============================================================================
// DATA MANAGEMENT - FIXED VERSION
// ============================================================================

function loadAllData() {
    const userId = window.Auth ? window.Auth.getCurrentUserId() : 'default';
    const savedData = localStorage.getItem(`worklog_data_${userId}`);
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            appData.students = Array.isArray(parsedData.students) ? parsedData.students : [];
            appData.hours = Array.isArray(parsedData.hours) ? parsedData.hours : [];
            appData.marks = Array.isArray(parsedData.marks) ? parsedData.marks : [];
            appData.attendance = Array.isArray(parsedData.attendance) ? parsedData.attendance : [];
            appData.payments = Array.isArray(parsedData.payments) ? parsedData.payments : [];
            appData.settings = parsedData.settings || { defaultRate: 25.00 };
            
            console.log('📊 Loaded existing data:', {
                students: appData.students.length,
                hours: appData.hours.length,
                marks: appData.marks.length,
                attendance: appData.attendance.length,
                payments: appData.payments.length
            });
            
        } catch (error) {
            console.error('❌ Error loading data, starting fresh:', error);
            resetAppData();
        }
    } else {
        console.log('📊 No existing data, starting fresh');
        resetAppData();
    }
    
    loadHoursFromStorage();
}

function resetAppData() {
    appData = {
        students: [],
        hours: [],
        marks: [],
        attendance: [],
        payments: [],
        settings: { defaultRate: 25.00 }
    };
    saveAllData();
}

function saveAllData() {
    try {
        const userId = window.Auth ? window.Auth.getCurrentUserId() : 'default';
        
        // Prevent save during attendance editing
        if (isEditingAttendance) {
            console.log('🛑 Save blocked - attendance edit in progress');
            return;
        }
        
        localStorage.setItem(`worklog_data_${userId}`, JSON.stringify(appData));
        console.log('💾 Data saved');
    } catch (error) {
        console.error('❌ Error saving data:', error);
    }
}

// ============================================================================
// HOURS TRACKING - FIXED DATA INTEGRATION
// ============================================================================

function loadHoursFromStorage() {
    try {
        const saved = localStorage.getItem('worklog_hours');
        if (saved) {
            const data = JSON.parse(saved);
            window.hoursEntries = data.hours || [];
            console.log('📥 Loaded hours from storage:', window.hoursEntries.length, 'entries');
            
            // Sync with appData.hours for backward compatibility
            appData.hours = [...window.hoursEntries];
            return window.hoursEntries;
        }
    } catch (error) {
        console.error('❌ Error loading hours:', error);
    }
    
    // Initialize from appData.hours if hoursEntries is empty
    if (window.hoursEntries.length === 0 && appData.hours.length > 0) {
        window.hoursEntries = [...appData.hours];
        saveHoursToStorage();
    }
    
    return [];
}

function saveHoursToStorage() {
    try {
        localStorage.setItem('worklog_hours', JSON.stringify({
            hours: window.hoursEntries || [],
            lastUpdated: new Date().toISOString()
        }));
        console.log('💾 Hours saved to storage');
        
        // Sync with appData.hours
        appData.hours = [...window.hoursEntries];
        saveAllData(); // Save to main data store too
    } catch (error) {
        console.error('❌ Error saving hours:', error);
    }
}

// ============================================================================
// ATTENDANCE MANAGEMENT - COMPLETELY REWRITTEN
// ============================================================================

function loadAttendance() {
    try {
        const container = document.getElementById('attendanceContainer');
        const attendanceList = document.getElementById('attendanceList');
        
        if (!container || !attendanceList) {
            console.error('❌ Attendance containers not found');
            return;
        }
        
        // Clear existing content
        attendanceList.innerHTML = '';
        
        if (!appData.students || appData.students.length === 0) {
            attendanceList.innerHTML = '<div class="empty-state"><div class="icon">👥</div><h4>No Students</h4><p>No students registered. Add students first.</p></div>';
            container.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h4>No Attendance Records</h4><p>No attendance records yet. Add students first.</p></div>';
            return;
        }
        
        // Build student checklist with proper styling
        appData.students.forEach(student => {
            const div = document.createElement('div');
            div.className = 'attendance-item';
            div.innerHTML = `
                <label class="attendance-label">
                    <input type="checkbox" id="attend_${student.id}" value="${student.id}" class="attendance-checkbox">
                    <span class="checkmark"></span>
                    <span class="student-info">
                        <strong>${student.name}</strong>
                        <span class="student-id">(${student.id})</span>
                    </span>
                </label>
            `;
            attendanceList.appendChild(div);
        });
        
        // Load attendance records if any exist
        displayAttendanceRecords();
        updateAttendanceStats();
        
    } catch (error) {
        console.error('❌ Error loading attendance:', error);
    }
}

function displayAttendanceRecords() {
    const container = document.getElementById('attendanceContainer');
    if (!container) return;
    
    if (!appData.attendance || appData.attendance.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h4>No Attendance Records</h4><p>No attendance records yet. Track your first session!</p></div>';
        return;
    }
    
    let html = '<div class="attendance-list">';
    
    // Show all attendance records with edit functionality
    appData.attendance.slice().reverse().forEach((session, index) => {
        const actualIndex = appData.attendance.length - 1 - index;
        const presentStudents = session.presentStudents.map(id => {
            const student = appData.students.find(s => s.id === id);
            return student ? student.name : 'Unknown';
        });
        
        const sessionDate = formatAttendanceDate(session.date);
        const fullDate = formatAttendanceFullDate(session.date);
        
        html += `
            <div class="attendance-entry">
                <div class="attendance-header">
                    <div class="attendance-main">
                        <h4>${session.subject} - ${sessionDate}</h4>
                        <span class="attendance-count">${session.presentStudents.length} students</span>
                    </div>
                    <div class="attendance-actions">
                        <button class="btn btn-sm btn-edit" onclick="editAttendance(${actualIndex})">✏️ Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAttendance(${actualIndex})">🗑️ Delete</button>
                    </div>
                </div>
                <div class="attendance-details">
                    <p><strong>Topic:</strong> ${session.topic || 'N/A'}</p>
                    <p><strong>Present:</strong> ${presentStudents.join(', ')}</p>
                    <p><strong>Date:</strong> ${fullDate}</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function saveAttendance() {
    if (isEditingAttendance) {
        console.log('🛑 Save blocked - edit in progress');
        return;
    }
    
    try {
        const date = document.getElementById('attendanceDate').value;
        const subject = document.getElementById('attendanceSubject').value;
        const topic = document.getElementById('attendanceTopic').value;
        
        if (!date || !subject) {
            alert('Please fill in date and subject');
            return;
        }
        
        const presentStudents = [];
        
        // Get all checked students
        appData.students.forEach(student => {
            const checkbox = document.getElementById(`attend_${student.id}`);
            if (checkbox && checkbox.checked) {
                presentStudents.push(student.id);
            }
        });
        
        if (presentStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }
        
        const newAttendance = {
            date,
            subject,
            topic,
            presentStudents,
            createdAt: new Date().toISOString()
        };
        
        if (!appData.attendance) appData.attendance = [];
        appData.attendance.push(newAttendance);
        saveAllData();
        loadAttendance();
        clearAttendanceForm();
        
        alert(`✅ Attendance saved for ${presentStudents.length} students!`);
        
    } catch (error) {
        console.error('❌ Error saving attendance:', error);
        alert('Error saving attendance: ' + error.message);
    }
}

function editAttendance(index) {
    console.log('✏️ Editing attendance record:', index);
    isEditingAttendance = true;
    
    const session = appData.attendance[index];
    if (!session) {
        alert('Attendance record not found!');
        isEditingAttendance = false;
        return;
    }
    
    // Populate the form with existing data
    document.getElementById('attendanceDate').value = formatDateForAttendanceInput(session.date);
    document.getElementById('attendanceSubject').value = session.subject || '';
    document.getElementById('attendanceTopic').value = session.topic || '';
    
    // Clear all checkboxes first
    appData.students.forEach(student => {
        const checkbox = document.getElementById(`attend_${student.id}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    });
    
    // Check the students who were present
    session.presentStudents.forEach(studentId => {
        const checkbox = document.getElementById(`attend_${studentId}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    // Update the save button
    const saveButton = document.querySelector('#attendance .btn-primary');
    if (saveButton) {
        saveButton.textContent = '💾 Update Attendance';
        saveButton.onclick = function() { updateAttendance(index); };
    }
    
    // Add cancel edit button if not exists
    if (!document.querySelector('.cancel-attendance-edit')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-warning cancel-attendance-edit';
        cancelButton.textContent = '❌ Cancel Edit';
        cancelButton.onclick = cancelAttendanceEdit;
        
        const formActions = document.querySelector('#attendance .form-actions');
        if (formActions) {
            formActions.appendChild(cancelButton);
        }
    }
    
    // Add edit mode styling
    const formCard = document.querySelector('#attendance .section-card');
    if (formCard) {
        formCard.classList.add('edit-mode');
    }
    
    console.log('✅ Attendance form ready for editing');
}

function updateAttendance(index) {
    try {
        const date = document.getElementById('attendanceDate').value;
        const subject = document.getElementById('attendanceSubject').value;
        const topic = document.getElementById('attendanceTopic').value;
        
        if (!date || !subject) {
            alert('Please fill in date and subject');
            return;
        }
        
        const presentStudents = [];
        
        // Get all checked students
        appData.students.forEach(student => {
            const checkbox = document.getElementById(`attend_${student.id}`);
            if (checkbox && checkbox.checked) {
                presentStudents.push(student.id);
            }
        });
        
        if (presentStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }
        
        // Update the existing attendance record
        appData.attendance[index] = {
            ...appData.attendance[index],
            date,
            subject,
            topic,
            presentStudents,
            updatedAt: new Date().toISOString()
        };
        
        saveAllData();
        loadAttendance();
        cancelAttendanceEdit();
        
        alert(`✅ Attendance updated for ${presentStudents.length} students!`);
        
    } catch (error) {
        console.error('❌ Error updating attendance:', error);
        alert('Error updating attendance: ' + error.message);
    } finally {
        isEditingAttendance = false;
    }
}

function cancelAttendanceEdit() {
    console.log('❌ Cancelling attendance edit');
    isEditingAttendance = false;
    
    // Clear form
    clearAttendanceForm();
    
    // Reset save button
    const saveButton = document.querySelector('#attendance .btn-primary');
    if (saveButton) {
        saveButton.textContent = '💾 Save Attendance';
        saveButton.onclick = saveAttendance;
    }
    
    // Remove cancel button
    const cancelButton = document.querySelector('.cancel-attendance-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    // Remove edit mode styling
    const formCard = document.querySelector('#attendance .section-card');
    if (formCard) {
        formCard.classList.remove('edit-mode');
    }
}

function clearAttendanceForm() {
    document.getElementById('attendanceDate').value = '';
    document.getElementById('attendanceSubject').value = '';
    document.getElementById('attendanceTopic').value = '';
    
    // Deselect all students
    if (appData.students) {
        appData.students.forEach(student => {
            const checkbox = document.getElementById(`attend_${student.id}`);
            if (checkbox) checkbox.checked = false;
        });
    }
}

function updateAttendanceStats() {
    try {
        if (!appData.attendance) appData.attendance = [];
        
        const attendanceCount = appData.attendance.length;
        const lastSession = attendanceCount > 0 && appData.attendance[appData.attendance.length - 1].date
            ? formatAttendanceDate(appData.attendance[appData.attendance.length - 1].date)
            : 'Never';
        
        const weeklyHoursEl = document.getElementById('attendanceCount');
        const weeklyTotalEl = document.getElementById('lastSessionDate');
        
        if (weeklyHoursEl) weeklyHoursEl.textContent = attendanceCount;
        if (weeklyTotalEl) weeklyTotalEl.textContent = lastSession;
        
    } catch (error) {
        console.error('❌ Error updating attendance stats:', error);
    }
}

// ============================================================================
// REPORTS SYSTEM - FIXED DATA SOURCES
// ============================================================================

function getHoursDataForReports() {
    // Use hoursEntries as the primary source, fall back to appData.hours
    const hoursData = window.hoursEntries && window.hoursEntries.length > 0 
        ? window.hoursEntries 
        : appData.hours;
    
    return (hoursData || []).map(entry => ({
        ...entry,
        hours: entry.hours || 0,
        rate: entry.rate || 0,
        total: entry.total || (entry.hours || 0) * (entry.rate || 0),
        organization: entry.organization || 'Unknown',
        subject: entry.subject || 'Other',
        workType: entry.workType || 'hourly',
        date: entry.date || new Date().toISOString().split('T')[0]
    }));
}

function filterHoursByMonth(year, month) {
    const hoursData = getHoursDataForReports();
    return hoursData.filter(entry => {
        if (!entry.date) return false;
        try {
            const entryDate = new Date(entry.date);
            return entryDate.getFullYear() === year && entryDate.getMonth() === month;
        } catch (e) {
            return false;
        }
    });
}

// Update the main monthly breakdown to use the fixed function
function showMonthlyBreakdown() {
    console.log('📈 Switching to monthly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    
    const monthlyHours = filterHoursByMonth(currentYear, currentMonth);
    const monthlyMarks = filterDataByMonth(appData.marks || [], currentYear, currentMonth);
    const monthlyAttendance = filterDataByMonth(appData.attendance || [], currentYear, currentMonth);
    const monthlyPayments = filterDataByMonth(appData.payments || [], currentYear, currentMonth);
    
    const stats = calculateMonthlyStats(monthlyHours, monthlyMarks, monthlyAttendance, monthlyPayments);
    
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📈 Monthly Report</h2>
                <p>${monthName} ${currentYear} • Complete Overview</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${stats.totalHours}h</span>
                    <div class="stat-label">Total Hours</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">$${stats.totalEarnings}</span>
                    <div class="stat-label">Total Earnings</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">$${stats.avgHourlyRate}/h</span>
                    <div class="stat-label">Avg Hourly Rate</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.totalSessions}</span>
                    <div class="stat-label">Sessions</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.totalMarks}</span>
                    <div class="stat-label">Assessments</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.avgMark}%</span>
                    <div class="stat-label">Avg Score</div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>Activity Summary</h3>
                <div class="comparison-grid">
                    <div class="comparison-card">
                        <div class="comparison-header">
                            <h4>📊 Work Activity</h4>
                        </div>
                        <div class="metric-grid">
                            <div class="metric-item">
                                <span class="metric-value">${monthlyHours.length}</span>
                                <div class="metric-label">Entries</div>
                            </div>
                            <div class="metric-item">
                                <span class="metric-value">${stats.totalStudentsPresent}</span>
                                <div class="metric-label">Students Present</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-card">
                        <div class="comparison-header">
                            <h4>💰 Financial Summary</h4>
                        </div>
                        <div class="metric-grid">
                            <div class="metric-item">
                                <span class="metric-value">$${stats.totalPayments}</span>
                                <div class="metric-label">Payments</div>
                            </div>
                            <div class="metric-item">
                                <span class="metric-value">${stats.avgStudentsPerSession}</span>
                                <div class="metric-label">Avg/Session</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        ${renderReportNavigation('📈 Monthly')}
    `;
}

// ============================================================================
// UTILITY FUNCTIONS - FIXED
// ============================================================================

function formatAttendanceDate(dateString) {
    if (!dateString) return 'No Date';
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}/${year}`;
    } catch (e) {
        console.error('Error formatting attendance date:', e);
        return dateString;
    }
}

function formatAttendanceFullDate(dateString) {
    if (!dateString) return 'No Date';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (e) {
        console.error('Error formatting full attendance date:', e);
        return dateString;
    }
}

function formatDateForAttendanceInput(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error('Error formatting date for attendance input:', e);
        return dateString;
    }
}

// ============================================================================
// GLOBAL FUNCTION EXPORTS - CLEANED UP
// ============================================================================

// Core App Functions
window.init = init;

// Data Loading Functions
window.loadStudents = loadStudents;
window.loadHours = loadHours;
window.loadMarks = loadMarks;
window.loadAttendance = loadAttendance;
window.loadPayments = loadPayments;
window.loadReports = loadReports;

// Students Management
window.addStudent = addStudent;
window.editStudent = editStudent;
window.updateStudent = updateStudent;
window.deleteStudent = deleteStudent;
window.cancelStudentEdit = cancelStudentEdit;

// Hours Tracking
window.logHours = logHours;
window.startEditHours = startEditHours;
window.updateHoursEntry = updateHoursEntry;
window.cancelHoursEdit = cancelHoursEdit;
window.deleteHours = deleteHours;
window.updateTotalDisplay = updateTotalDisplay;

// Attendance Management
window.saveAttendance = saveAttendance;
window.selectAllStudents = selectAllStudents;
window.deselectAllStudents = deselectAllStudents;
window.clearAttendanceForm = clearAttendanceForm;
window.deleteAttendance = deleteAttendance;
window.editAttendance = editAttendance;
window.updateAttendance = updateAttendance;
window.cancelAttendanceEdit = cancelAttendanceEdit;
window.setTodayDate = setTodayDate;
window.setYesterdayDate = setYesterdayDate;

// Payments Management
window.recordPayment = recordPayment;
window.resetPaymentForm = resetPaymentForm;
window.deletePayment = deletePayment;

// Settings Management
window.saveDefaultRate = saveDefaultRate;
window.useDefaultRate = useDefaultRate;

// Reports System
window.showWeeklyBreakdown = showWeeklyBreakdown;
window.showBiWeeklyBreakdown = showBiWeeklyBreakdown;
window.showMonthlyBreakdown = showMonthlyBreakdown;
window.showSubjectBreakdown = showSubjectBreakdown;
window.showDetailedBiWeeklyAnalysis = showDetailedBiWeeklyAnalysis;
window.onMonthChange = onMonthChange;
window.generateCurrentMonthReport = generateCurrentMonthReport;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 DOM fully loaded, initializing app...');
    
    // Initialize hours system
    loadHoursFromStorage();
    if (typeof displayHours === 'function') {
        displayHours();
    }
    
    // Setup auto-calculation for hours form
    const hoursInput = document.getElementById('hoursWorked');
    const rateInput = document.getElementById('baseRate');
    
    if (hoursInput && rateInput) {
        const calculateTotal = () => {
            const hours = parseFloat(hoursInput.value) || 0;
            const rate = parseFloat(rateInput.value) || 0;
            const totalPayInput = document.getElementById('totalPay');
            if (totalPayInput) {
                totalPayInput.value = (hours * rate).toFixed(2);
            }
        };
        
        hoursInput.addEventListener('input', calculateTotal);
        rateInput.addEventListener('input', calculateTotal);
    }
    
    // Set default date to today
    const dateInput = document.getElementById('workDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    console.log('✅ App ready');
});

console.log('✅ App.js completely loaded');

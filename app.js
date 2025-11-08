// app.js - CLEAN START WITH ATTENDANCE FIX
console.log('📦 App.js loaded');

// Global data storage
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

function init() {
    console.log('🎯 App initialization started');
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        console.log('❌ User not authenticated');
        return;
    }
    
    console.log('✅ User authenticated, setting up app...');
    
    // Load data from localStorage
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
// DATA MANAGEMENT
// ============================================================================

function loadAllData() {
    const userId = window.Auth.getCurrentUserId();
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
        const userId = window.Auth.getCurrentUserId();
        localStorage.setItem(`worklog_data_${userId}`, JSON.stringify(appData));
        console.log('💾 Data saved');
    } catch (error) {
        console.error('❌ Error saving data:', error);
    }
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

function setupTabs() {
    console.log('🔧 Setting up tabs...');
    
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Hide all tab contents first
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            console.log('📱 Switching to tab:', tabName);
            
            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // Activate clicked tab
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Show corresponding content
            const content = document.getElementById(tabName);
            if (content) {
                content.style.display = 'block';
                content.classList.add('active');
                loadTabData(tabName);
                console.log('✅ Tab activated:', tabName);
            } else {
                console.error('❌ Tab content not found:', tabName);
            }
        });
    });
    
    // Activate first tab by default
    if (tabs.length > 0) {
        const firstTab = tabs[0];
        const firstTabName = firstTab.getAttribute('data-tab');
        firstTab.classList.add('active');
        firstTab.setAttribute('aria-selected', 'true');
        
        const firstContent = document.getElementById(firstTabName);
        if (firstContent) {
            firstContent.style.display = 'block';
            firstContent.classList.add('active');
            loadTabData(firstTabName);
        }
    }
    
    console.log('✅ Tabs setup complete');
}

function loadTabData(tabName) {
    console.log('📂 Loading tab data:', tabName);
    
    try {
        switch(tabName) {
            case 'students':
                loadStudents();
                break;
            case 'hours':
                loadHours();
                break;
            case 'marks':
                loadMarks();
                break;
            case 'attendance':
                loadAttendance();
                break;
            case 'payments':
                loadPayments();
                break;
            case 'reports':
                loadReports();
                break;
            default:
                console.log('⚠️ Unknown tab:', tabName);
        }
    } catch (error) {
        console.error(`❌ Error loading tab ${tabName}:`, error);
    }
}

// ============================================================================
// ATTENDANCE MANAGEMENT - SIMPLIFIED AND WORKING
// ============================================================================

function loadAttendance() {
    console.log('📅 Loading attendance...');
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
            
            if (container) {
                container.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h4>No Attendance Records</h4><p>No attendance records yet. Add students first.</p></div>';
            }
            return;
        }
        
        // Build student checklist
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
        
        // Load attendance records
        if (!appData.attendance || appData.attendance.length === 0) {
            if (container) {
                container.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h4>No Attendance Records</h4><p>No attendance records yet. Track your first session!</p></div>';
            }
            return;
        }
        
        let html = '<div class="attendance-list">';
        
        // Show all attendance records
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
        
        updateAttendanceStats();
        
    } catch (error) {
        console.error('❌ Error loading attendance:', error);
    }
}

function saveAttendance() {
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
        
        // Clear form
        document.getElementById('attendanceDate').value = '';
        document.getElementById('attendanceSubject').value = '';
        document.getElementById('attendanceTopic').value = '';
        
        // Uncheck all checkboxes
        appData.students.forEach(student => {
            const checkbox = document.getElementById(`attend_${student.id}`);
            if (checkbox) checkbox.checked = false;
        });
        
        alert(`✅ Attendance saved for ${presentStudents.length} students!`);
        
    } catch (error) {
        console.error('❌ Error saving attendance:', error);
        alert('Error saving attendance: ' + error.message);
    }
}

function editAttendance(index) {
    try {
        const session = appData.attendance[index];
        if (!session) {
            alert('Attendance record not found!');
            return;
        }

        // Fill form with existing data
        document.getElementById('attendanceDate').value = session.date || '';
        document.getElementById('attendanceSubject').value = session.subject || '';
        document.getElementById('attendanceTopic').value = session.topic || '';
        
        // Check the students who were present
        appData.students.forEach(student => {
            const checkbox = document.getElementById(`attend_${student.id}`);
            if (checkbox) {
                checkbox.checked = session.presentStudents.includes(student.id);
            }
        });

        // Change save button to update
        const saveButton = document.querySelector('#attendance .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '💾 Update Attendance';
            saveButton.onclick = function() { updateAttendance(index); };
        }

        // Add cancel button
        let cancelButton = document.querySelector('.cancel-attendance-edit');
        if (!cancelButton) {
            cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'btn btn-warning cancel-attendance-edit';
            cancelButton.innerHTML = '❌ Cancel Edit';
            cancelButton.onclick = cancelAttendanceEdit;
            
            const formActions = document.querySelector('.form-actions');
            if (formActions) {
                formActions.appendChild(cancelButton);
            }
        }

    } catch (error) {
        console.error('❌ Error editing attendance:', error);
        alert('Error editing attendance: ' + error.message);
    }
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
    }
}

function cancelAttendanceEdit() {
    console.log('❌ Cancelling attendance edit');
    
    // Clear form
    document.getElementById('attendanceDate').value = '';
    document.getElementById('attendanceSubject').value = '';
    document.getElementById('attendanceTopic').value = '';
    
    // Clear all checkboxes
    appData.students.forEach(student => {
        const checkbox = document.getElementById(`attend_${student.id}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    });
    
    // Reset save button
    const saveButton = document.querySelector('#attendance .btn-primary');
    if (saveButton) {
        saveButton.innerHTML = '💾 Save Attendance';
        saveButton.onclick = saveAttendance;
    }
    
    // Remove cancel button
    const cancelButton = document.querySelector('.cancel-attendance-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
}

function deleteAttendance(index) {
    if (confirm('Are you sure you want to delete this attendance record?')) {
        appData.attendance.splice(index, 1);
        saveAllData();
        loadAttendance();
        alert('✅ Attendance record deleted successfully!');
    }
}

function selectAllStudents() {
    appData.students.forEach(student => {
        const checkbox = document.getElementById(`attend_${student.id}`);
        if (checkbox) checkbox.checked = true;
    });
}

function deselectAllStudents() {
    appData.students.forEach(student => {
        const checkbox = document.getElementById(`attend_${student.id}`);
        if (checkbox) checkbox.checked = false;
    });
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
            ? new Date(appData.attendance[appData.attendance.length - 1].date).toLocaleDateString()
            : 'Never';
        
        document.getElementById('attendanceCount').textContent = attendanceCount;
        document.getElementById('lastSessionDate').textContent = lastSession;
        
    } catch (error) {
        console.error('❌ Error updating attendance stats:', error);
    }
}

// ============================================================================
// ATTENDANCE DATE FORMATTING
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

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Auto-calculate total pay for hours
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
    
    // Set default date to today for attendance
    const attendanceDateInput = document.getElementById('attendanceDate');
    if (attendanceDateInput && !attendanceDateInput.value) {
        attendanceDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Set default date to today for hours
    const workDateInput = document.getElementById('workDate');
    if (workDateInput && !workDateInput.value) {
        workDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    console.log('✅ Event listeners setup complete');
}

// ============================================================================
// DEFAULT RATE MANAGEMENT
// ============================================================================

function loadDefaultRate() {
    const defaultRate = appData.settings.defaultRate || 25.00;
    
    document.getElementById('defaultBaseRate').value = defaultRate;
    document.getElementById('currentDefaultRate').textContent = defaultRate.toFixed(2);
    
    const studentRateInput = document.getElementById('studentBaseRate');
    if (studentRateInput && !studentRateInput.value) {
        studentRateInput.value = defaultRate;
    }
    
    const hoursRateInput = document.getElementById('baseRate');
    if (hoursRateInput && !hoursRateInput.value) {
        hoursRateInput.value = defaultRate;
    }
}

function saveDefaultRate() {
    const defaultRate = parseFloat(document.getElementById('defaultBaseRate').value);
    
    if (!defaultRate || defaultRate <= 0) {
        alert('Please enter a valid default rate');
        return;
    }
    
    appData.settings.defaultRate = defaultRate;
    saveAllData();
    loadDefaultRate();
    
    alert('✅ Default rate saved successfully!');
}

function useDefaultRate() {
    const defaultRate = appData.settings.defaultRate || 25.00;
    const studentRateInput = document.getElementById('studentBaseRate');
    
    if (studentRateInput) {
        studentRateInput.value = defaultRate;
        studentRateInput.focus();
    }
    
    alert(`📝 Default rate ($${defaultRate}) filled in the form!`);
}

// ============================================================================
// STATS MANAGEMENT
// ============================================================================

function updateStats() {
    console.log('📈 Updating stats...');
    
    try {
        if (!appData.students) appData.students = [];
        if (!appData.hours) appData.hours = [];
        if (!appData.attendance) appData.attendance = [];
        
        const totalStudents = appData.students.length;
        const totalHours = appData.hours.reduce((sum, entry) => sum + (entry.hours || 0), 0).toFixed(1);
        const totalSessions = appData.hours.length + appData.attendance.length;
        
        document.getElementById('dataStatus').textContent = `📊 Data: ${totalStudents} Students, ${totalSessions} Sessions`;
        
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

// ============================================================================
// GLOBAL FUNCTION EXPORTS
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
window.clearStudentForm = clearStudentForm;
window.cancelStudentEdit = cancelStudentEdit;

// Hours Tracking
window.logHours = logHours;
window.startEditHours = startEditHours;
window.updateHoursEntry = updateHoursEntry;
window.cancelHoursEdit = cancelHoursEdit;
window.deleteHours = deleteHours;
window.updateTotalDisplay = updateTotalDisplay;

// Marks Management
window.addMark = addMark;

// Attendance Management
window.saveAttendance = saveAttendance;
window.selectAllStudents = selectAllStudents;
window.deselectAllStudents = deselectAllStudents;
window.clearAttendanceForm = clearAttendanceForm;
window.deleteAttendance = deleteAttendance;
window.editAttendance = editAttendance;
window.updateAttendance = updateAttendance;
window.cancelAttendanceEdit = cancelAttendanceEdit;

// Payments Management
window.recordPayment = recordPayment;
window.resetPaymentForm = resetPaymentForm;
window.deletePayment = deletePayment;

// Settings Management
window.saveDefaultRate = saveDefaultRate;
window.useDefaultRate = useDefaultRate;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 DOM fully loaded, initializing app...');
    
    // Initialize hours system
    loadHoursFromStorage();
    displayHours();
    
    console.log('✅ App ready');
});

console.log('✅ App.js completely loaded');

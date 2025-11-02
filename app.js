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

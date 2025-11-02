// ============================================================================
// EVENT LISTENER SETUP - Run immediately when script loads
// ============================================================================

// Set up tab system immediately
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Tab system
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Storage buttons
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    const clearBtn = document.getElementById('clearAllDataBtn');
    
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (importBtn) importBtn.addEventListener('click', importData);
    if (clearBtn) clearBtn.addEventListener('click', clearAllData);
    
    // Payment modal buttons
    const recordPaymentBtn = document.getElementById('recordPaymentBtn');
    const markSessionBtn = document.getElementById('markSessionBtn');
    
    if (recordPaymentBtn) recordPaymentBtn.addEventListener('click', function() {
        openModal('paymentModal');
    });
    if (markSessionBtn) markSessionBtn.addEventListener('click', function() {
        openModal('attendanceSessionModal');
    });

    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

// ============================================================================
// CORE FUNCTIONS - Define these next
// ============================================================================

// Tab switching function
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    const activeTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    const activeContent = document.getElementById(tabName);
    if (activeContent) {
        activeContent.classList.add('active');
    }
    
    // Update specific tab content if needed
    if (tabName === 'reports') {
        updateReports();
    } else if (tabName === 'attendance') {
        updateAttendanceList();
    } else if (tabName === 'hours') {
        calculateTimeTotals();
    } else if (tabName === 'payments') {
        updatePaymentUI();
    }
}

// Generate ID function
function generateId() {
    return 'worklog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Week number calculation
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

// Set default date function
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workDate').value = today;
    document.getElementById('markDate').value = today;
    document.getElementById('attendanceDate').value = today;
    
    // Also set payment and session dates
    const paymentDate = document.getElementById('paymentDate');
    const sessionDate = document.getElementById('sessionDate');
    if (paymentDate) paymentDate.value = today;
    if (sessionDate) sessionDate.value = today;
}

// Global variables for current week/month calculations
const now = new Date();
const currentWeek = getWeekNumber(now);
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

// ============================================================================
// DATA STORAGE - All data stored locally
// ============================================================================

let students = [];
let hoursLog = [];
let marks = [];
let attendance = [];
let payments = [];
let paymentActivity = [];

// ============================================================================
// DATA MANAGEMENT FUNCTIONS
// ============================================================================

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

    // Fix payment entries
    payments.forEach(entry => {
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

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    console.log("Initializing WorkLog application...");
    loadAllData();
    fixMissingIds();
    loadFieldMemory();
    initPaymentSystem();
    updateUI();
    setDefaultDate();
    showDataStats();
}

// ============================================================================
// PAYMENT TRACKING SYSTEM
// ============================================================================

// Initialize payment system
function initPaymentSystem() {
    loadPaymentData();
    updatePaymentUI();
}

// Load payment data from localStorage
function loadPaymentData() {
    payments = JSON.parse(localStorage.getItem('worklog_payments') || '[]');
    paymentActivity = JSON.parse(localStorage.getItem('worklog_payment_activity') || '[]');
    console.log(`Loaded: ${payments.length} payments, ${paymentActivity.length} activities`);
}

// Save payment data to localStorage
function savePaymentData() {
    localStorage.setItem('worklog_payments', JSON.stringify(payments));
    localStorage.setItem('worklog_payment_activity', JSON.stringify(paymentActivity));
}

// Update all payment-related UI components
function updatePaymentUI() {
    updateStudentBalances();
    updatePaymentActivity();
    updatePaymentStats();
    updatePaymentStudentSelects();
}

// Calculate student balance
function calculateStudentBalance(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return 0;
    
    // Count attendance sessions for this student
    const sessionCount = attendance.filter(a => 
        a.studentId === studentId && a.status === 'Present'
    ).length;
    
    // Get base rate (use student's base rate or default)
    const baseRate = student.baseRate || 0;
    
    // Calculate total owed
    const totalOwed = sessionCount * baseRate;
    
    // Calculate total paid
    const totalPaid = payments
        .filter(p => p.studentId === studentId)
        .reduce((sum, payment) => sum + payment.amount, 0);
    
    return totalOwed - totalPaid;
}

// Update student balances display
function updateStudentBalances() {
    const container = document.getElementById('studentBalancesContainer');
    
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666;">No students registered yet.</p>';
        return;
    }
    
    container.innerHTML = students.map(student => {
        const balance = calculateStudentBalance(student.id);
        const sessionCount = attendance.filter(a => 
            a.studentId === student.id && a.status === 'Present'
        ).length;
        const baseRate = student.baseRate || 0;
        const totalPaid = payments
            .filter(p => p.studentId === student.id)
            .reduce((sum, payment) => sum + payment.amount, 0);
        
        return `
            <div class="student-balance-item">
                <div class="student-balance-info">
                    <div class="student-balance-name">
                        <strong>${student.name}</strong> (${student.id})
                    </div>
                    <div class="student-balance-details">
                        Sessions: ${sessionCount} × $${baseRate.toFixed(2)} = $${(sessionCount * baseRate).toFixed(2)} 
                        | Paid: $${totalPaid.toFixed(2)}
                    </div>
                </div>
                <div class="student-balance-amount ${balance === 0 ? 'balance-zero' : balance > 0 ? 'balance-positive' : 'balance-negative'}">
                    $${balance.toFixed(2)}
                </div>
                <div class="student-balance-actions">
                    <button class="btn btn-sm" onclick="recordPaymentForStudent('${student.id}')">💰 Pay</button>
                    <button class="btn btn-secondary btn-sm" onclick="viewStudentHistory('${student.id}')">📊 History</button>
                </div>
            </div>
        `;
    }).join('');
}

// Update payment activity log
function updatePaymentActivity() {
    const container = document.getElementById('paymentActivityLog');
    const recentActivity = paymentActivity.slice(-10).reverse();
    
    if (recentActivity.length === 0) {
        container.innerHTML = '<p style="color: #666;">No recent activity.</p>';
        return;
    }
    
    container.innerHTML = recentActivity.map(activity => `
        <div class="activity-item">
            <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
            <div class="activity-message">${activity.message}</div>
        </div>
    `).join('');
}

// Update payment statistics
function updatePaymentStats() {
    const totalStudents = students.length;
    const totalOwed = students.reduce((sum, student) => sum + calculateStudentBalance(student.id), 0);
    const monthlyPayments = payments
        .filter(p => {
            const paymentDate = new Date(p.date);
            const now = new Date();
            return paymentDate.getMonth() === now.getMonth() && 
                   paymentDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, payment) => sum + payment.amount, 0);
    
    document.getElementById('totalStudentsCount').textContent = totalStudents;
    document.getElementById('totalOwed').textContent = `$${totalOwed.toFixed(2)}`;
    document.getElementById('monthlyPayments').textContent = `$${monthlyPayments.toFixed(2)}`;
}

// Update student selects in payment forms
function updatePaymentStudentSelects() {
    const paymentSelect = document.getElementById('paymentStudent');
    
    const options = students.map(student => 
        `<option value="${student.id}">${student.name} (${student.id})</option>`
    ).join('');
    
    if (paymentSelect) {
        paymentSelect.innerHTML = '<option value="">Select Student</option>' + options;
    }
}

// Modal functions for payments
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    if (modalId === 'paymentModal') {
        updatePaymentStudentSelects();
    } else if (modalId === 'attendanceSessionModal') {
        updateSessionAttendanceList();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Reset forms
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
}

// Record payment for a specific student
function recordPaymentForStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        openModal('paymentModal');
        document.getElementById('paymentStudent').value = studentId;
        // Auto-fill suggested payment amount (current balance)
        const balance = calculateStudentBalance(studentId);
        if (balance > 0) {
            document.getElementById('paymentAmount').value = balance.toFixed(2);
        }
    }
}

function recordPayment() {
    const studentId = document.getElementById('paymentStudent').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    const method = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('paymentNotes').value.trim();
    
    if (!studentId || !amount || !date) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (amount <= 0) {
        alert('Payment amount must be greater than 0');
        return;
    }
    
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('Student not found');
        return;
    }
    
    const payment = {
        id: generateId(),
        studentId,
        studentName: student.name,
        amount,
        date,
        method,
        notes,
        timestamp: new Date().toISOString()
    };
    
    payments.push(payment);
    savePaymentData();
    
    // Log activity
    logPaymentActivity(`Recorded $${amount.toFixed(2)} payment from ${student.name} (${method})`);
    
    updatePaymentUI();
    closeModal('paymentModal');
    
    alert(`✅ Payment of $${amount.toFixed(2)} recorded for ${student.name}!`);
}

function updateSessionAttendanceList() {
    const container = document.getElementById('sessionAttendanceList');
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666;">No students registered yet.</p>';
        return;
    }
    
    container.innerHTML = students.map(student => `
        <div class="attendance-item">
            <div>
                <input type="checkbox" class="attendance-checkbox" id="session_attendance_${student.id}" checked>
                <label for="session_attendance_${student.id}">
                    <strong>${student.name}</strong> (${student.id})
                </label>
            </div>
            <div class="student-rate">
                Rate: $${(student.baseRate || 0).toFixed(2)}/session
            </div>
        </div>
    `).join('');
}

function saveSessionAttendance() {
    const date = document.getElementById('sessionDate').value;
    const subject = document.getElementById('sessionSubject').value.trim();
    const topic = document.getElementById('sessionTopic').value.trim();
    
    if (!date || !subject) {
        alert('Please fill in date and subject');
        return;
    }
    
    const attendanceRecords = [];
    let presentCount = 0;
    
    students.forEach(student => {
        const checkbox = document.getElementById(`session_attendance_${student.id}`);
        const status = checkbox.checked ? 'Present' : 'Absent';
        
        if (status === 'Present') {
            presentCount++;
        }
        
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
    
    // Log activity
    logPaymentActivity(`Marked attendance for ${presentCount} students in ${subject}${topic ? ` - ${topic}` : ''}`);
    
    updatePaymentUI();
    updateAttendanceUI();
    closeModal('attendanceSessionModal');
    
    alert(`✅ Attendance saved for ${presentCount} students!`);
}

// View student payment history
function viewStudentHistory(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const studentPayments = payments.filter(p => p.studentId === studentId);
    const studentAttendance = attendance.filter(a => a.studentId === studentId && a.status === 'Present');
    const balance = calculateStudentBalance(studentId);
    
    let historyHTML = `
        <h3>Payment History: ${student.name}</h3>
        <div class="student-summary">
            <p><strong>Current Balance:</strong> $${balance.toFixed(2)}</p>
            <p><strong>Total Sessions:</strong> ${studentAttendance.length}</p>
            <p><strong>Total Paid:</strong> $${studentPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
        </div>
    `;
    
    if (studentPayments.length > 0) {
        historyHTML += `
            <h4>Payment Records</h4>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentPayments.map(payment => `
                            <tr>
                                <td>${payment.date}</td>
                                <td>$${payment.amount.toFixed(2)}</td>
                                <td>${payment.method}</td>
                                <td>${payment.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    if (studentAttendance.length > 0) {
        historyHTML += `
            <h4>Recent Sessions</h4>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Subject</th>
                            <th>Topic</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentAttendance.slice(-10).reverse().map(session => `
                            <tr>
                                <td>${session.date}</td>
                                <td>${session.subject}</td>
                                <td>${session.topic || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Show in a modal or alert (simplified version)
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            ${historyHTML}
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Log payment activity
function logPaymentActivity(message) {
    paymentActivity.push({
        timestamp: new Date().toISOString(),
        message
    });
    savePaymentData();
}

// ============================================================================
// EXISTING WORKLOG FUNCTIONALITY
// ============================================================================

// Data management - Local Storage
function loadAllData() {
    students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
    hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
    marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
    attendance = JSON.parse(localStorage.getItem('worklog_attendance') || '[]');
    loadPaymentData(); // Load payment data too
    
    console.log(`Loaded: ${students.length} students, ${hoursLog.length} hours, ${marks.length} marks, ${attendance.length} attendance records, ${payments.length} payments`);
}

function saveAllData() {
    localStorage.setItem('worklog_students', JSON.stringify(students));
    localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
    localStorage.setItem('worklog_marks', JSON.stringify(marks));
    localStorage.setItem('worklog_attendance', JSON.stringify(attendance));
    savePaymentData(); // Save payment data too
    
    showDataStats();
}

function showDataStats() {
    const stats = `
        Students: ${students.length} | 
        Hours: ${hoursLog.length} | 
        Marks: ${marks.length} | 
        Attendance: ${attendance.length} records |
        Payments: ${payments.length}
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

function resetHoursForm() {
    console.log('Resetting hours form');
    
    // Clear form but keep remembered fields
    document.getElementById('workDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('hoursWorked').value = '';
    document.getElementById('totalPay').value = '';
    document.getElementById('workNotes').value = '';
    
    // Reset button to "Log Hours"
    const logButton = document.querySelector('#hours .btn');
    logButton.textContent = '💼 Log Hours';
    logButton.onclick = logHours;
    
    // Remove cancel button if it exists
    const cancelButton = document.querySelector('#hours .cancel-btn');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    console.log('Hours form reset');
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

// Stub functions for edit/delete marks (you can implement these)
function editMark(markId) {
    alert('Edit mark functionality to be implemented');
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
    updatePaymentUI(); // Add this line
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

// Stub functions for edit hours (you can implement these)
function editHours(entryId) {
    alert('Edit hours functionality to be implemented');
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
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

// Stub functions for edit/delete attendance (you can implement these)
function editAttendance(recordId) {
    alert('Edit attendance functionality to be implemented');
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

function deleteStudent(index) {
    if (confirm('Are you sure you want to delete this student?')) {
        students.splice(index, 1);
        saveAllData();
        updateUI();
    }
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
    const weeklyTotalEl = document.getElementById('weeklyTotal');
    const monthlyTotalEl = document.getElementById('monthlyTotal');
    const weeklyHoursEl = document.getElementById('weeklyHours');
    const monthlyHoursEl = document.getElementById('monthlyHours');
    
    if (weeklyTotalEl) weeklyTotalEl.textContent = '$' + weeklyTotal.toFixed(2);
    if (monthlyTotalEl) monthlyTotalEl.textContent = '$' + monthlyTotal.toFixed(2);
    if (weeklyHoursEl) weeklyHoursEl.textContent = weeklyHours.toFixed(1);
    if (monthlyHoursEl) monthlyHoursEl.textContent = monthlyHours.toFixed(1);
}

// Reports
function updateReports() {
    document.getElementById('totalStudentsReport').textContent = students.length;
    document.getElementById('totalHoursReport').textContent = hoursLog.reduce((sum, h) => sum + h.hours, 0).toFixed(1);
    document.getElementById('totalEarningsReport').textContent = '$' + hoursLog.reduce((sum, h) => sum + h.totalPay, 0).toFixed(2);
    
    const avgMark = marks.length > 0 
        ? (marks.reduce((sum, m) => sum + parseFloat(m.percentage), 0) / marks.length).toFixed(1)
        : 0;
    document.getElementById('avgMarkReport').textContent = avgMark + '%';
    
    // Payment reports
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = students.reduce((sum, student) => sum + calculateStudentBalance(student.id), 0);
    
    document.getElementById('totalPaymentsReport').textContent = '$' + totalPayments.toFixed(2);
    document.getElementById('outstandingBalance').textContent = '$' + outstandingBalance.toFixed(2);
    
    updateWeeklyReport();
    updateSubjectReport();
}

function updateWeeklyReport() {
    const weeks = {};
    
    // Process hours data
    hoursLog.forEach(h => {
        const week = getWeekNumber(new Date(h.date));
        if (!weeks[week]) {
            weeks[week] = { 
                hours: 0, 
                earnings: 0, 
                students: new Set(),
                topics: new Set(),
                payments: 0
            };
        }
        weeks[week].hours += h.hours;
        weeks[week].earnings += h.totalPay;
        if (h.topic) weeks[week].topics.add(h.topic);
    });
    
    // Process payment data
    payments.forEach(p => {
        const week = getWeekNumber(new Date(p.date));
        if (weeks[week]) {
            weeks[week].payments += p.amount;
        }
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
                <td>$${weekData.payments.toFixed(2)}</td>
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
                topics: new Set(),
                sessions: 0
            };
        }
        subjects[h.subject].totalHours += h.hours;
        subjects[h.subject].totalEarnings += h.totalPay;
        if (h.topic) subjects[h.subject].topics.add(h.topic);
    });
    
    // Process attendance data for sessions
    attendance.forEach(a => {
        if (a.status === 'Present') {
            if (!subjects[a.subject]) {
                subjects[a.subject] = { 
                    totalHours: 0, 
                    totalEarnings: 0, 
                    marks: [],
                    topics: new Set(),
                    sessions: 0
                };
            }
            subjects[a.subject].sessions += 1;
            if (a.topic) subjects[a.subject].topics.add(a.topic);
        }
    });
    
    // Process marks data
    marks.forEach(m => {
        if (!subjects[m.subject]) {
            subjects[m.subject] = { 
                totalHours: 0, 
                totalEarnings: 0, 
                marks: [],
                topics: new Set(),
                sessions: 0
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
                <td>${data.sessions}</td>
            </tr>
        `;
    }).join('');
}

// Data Export/Import
function exportData() {
    const data = {
        students,
        hoursLog,
        marks,
        attendance,
        payments,
        paymentActivity,
        exportDate: new Date().toISOString(),
        version: '2.0' // Update version to include payments
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

// ============================================================================
// INITIALIZE THE APPLICATION
// ============================================================================

// Call init when the page loads
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Make sure the app initializes even if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

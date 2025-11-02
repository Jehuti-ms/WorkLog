// ============================================================================
// CORE FUNCTIONS - Define these first to prevent reference errors
// ============================================================================

// Tab switching - Define this FIRST
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    // Update specific tab content if needed
    if (tabName === 'reports') {
        updateReports();
    } else if (tabName === 'attendance') {
        updateAttendanceList();
    } else if (tabName === 'hours') {
        // Force refresh totals when switching to hours tab
        calculateTimeTotals();
    } else if (tabName === 'payments') {
        updatePaymentUI();
    }
}

// Generate ID function - Define this early too
function generateId() {
    return 'worklog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Week number calculation - Define this early
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
// END OF CORE FUNCTIONS - Now continue with the rest of your existing code
// ============================================================================

// Data storage - All data stored locally
let students = [];
let hoursLog = [];
let marks = [];
let attendance = [];
let payments = []; // Add payments array
let paymentActivity = []; // Add payment activity array

// Initialize
function init() {
    console.log("Initializing WorkLog application...");
    loadAllData();
    fixMissingIds();
    loadFieldMemory();
    initPaymentSystem();
    updateUI();
    setDefaultDate();
    showDataStats();
    
    // Add event listeners for payment forms
    setupPaymentEventListeners();
}

// Setup payment form event listeners
function setupPaymentEventListeners() {
    const paymentForm = document.getElementById('paymentForm');
    const attendanceSessionForm = document.getElementById('attendanceSessionForm');
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            recordPayment();
        });
    }
    
    if (attendanceSessionForm) {
        attendanceSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSessionAttendance();
        });
    }
}

// ============================================================================
// PAYMENT TRACKING SYSTEM
// ============================================================================

// Payment data storage
let payments = [];
let paymentActivity = [];

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
    const baseRate = student.baseRate || parseFloat(document.getElementById('studentBaseRate')?.value) || 0;
    
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
    const sessionSelect = document.getElementById('sessionStudent');
    
    const options = students.map(student => 
        `<option value="${student.id}">${student.name} (${student.id})</option>`
    ).join('');
    
    if (paymentSelect) {
        paymentSelect.innerHTML = '<option value="">Select Student</option>' + options;
    }
    if (sessionSelect) {
        sessionSelect.innerHTML = '<option value="">Select Student</option>' + options;
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

// Handle payment form submission
document.getElementById('paymentForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    recordPayment();
});

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

// Handle session attendance form submission
document.getElementById('attendanceSessionForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    saveSessionAttendance();
});

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

// Update student management to include base rate
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
    updatePaymentUI();
    
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

// Update reports to include payment data
function updateReports() {
    // Existing reports
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

// Update weekly report to include payments
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

// Update subject report to include sessions
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

// Update data management functions to include payments
function saveAllData() {
    localStorage.setItem('worklog_students', JSON.stringify(students));
    localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
    localStorage.setItem('worklog_marks', JSON.stringify(marks));
    localStorage.setItem('worklog_attendance', JSON.stringify(attendance));
    savePaymentData(); // Save payment data too
    
    showDataStats();
}

function loadAllData() {
    students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
    hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
    marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
    attendance = JSON.parse(localStorage.getItem('worklog_attendance') || '[]');
    loadPaymentData(); // Load payment data too
    
    console.log(`Loaded: ${students.length} students, ${hoursLog.length} hours, ${marks.length} marks, ${attendance.length} attendance records, ${payments.length} payments`);
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

// Update UI function to include payment UI
function updateUI() {
    updateStudentList();
    updateStudentSelects();
    updateHoursList();
    updateMarksList();
    updateAttendanceUI();
    calculateTimeTotals();
    updatePaymentUI(); // Add this line
}

// Initialize payment system when app starts
function init() {
    console.log("Initializing WorkLog application...");
    loadAllData();
    fixMissingIds();
    loadFieldMemory();
    initPaymentSystem(); // Add this line
    updateUI();
    setDefaultDate();
    showDataStats();
}


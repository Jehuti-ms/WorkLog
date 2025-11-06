// app.js - COMPLETE WORKING VERSION
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
    
    // Update stats
    updateStats();
    
    console.log('✅ App initialized successfully');
}

function loadAllData() {
    const userId = window.Auth.getCurrentUserId();
    const savedData = localStorage.getItem(`worklog_data_${userId}`);
    
    if (savedData) {
        appData = JSON.parse(savedData);
        console.log('📊 Loaded existing data');
    } else {
        console.log('📊 No existing data, starting fresh');
    }
}

function saveAllData() {
    const userId = window.Auth.getCurrentUserId();
    localStorage.setItem(`worklog_data_${userId}`, JSON.stringify(appData));
    console.log('💾 Data saved');
}

function setupTabs() {
    console.log('🔧 Setting up tabs...');
    
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            console.log('📱 Switching to tab:', tabName);
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activate clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const content = document.getElementById(tabName);
            if (content) {
                content.classList.add('active');
                loadTabData(tabName);
                console.log('✅ Tab activated:', tabName);
            }
        });
    });
    
    console.log('✅ Tabs setup complete');
}

function loadTabData(tabName) {
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
    }
}

// ============================================================================
// STUDENTS MANAGEMENT
// ============================================================================

function loadStudents() {
    const container = document.getElementById('studentsContainer');
    if (!container) return;
    
    if (appData.students.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No students registered yet.</p>';
        return;
    }
    
    let html = '<div class="students-grid">';
    
    appData.students.forEach((student, index) => {
        html += `
            <div class="student-card">
                <div class="student-header">
                    <h4>${student.name}</h4>
                    <span class="student-rate">$${student.rate}/session</span>
                </div>
                <div class="student-details">
                    <p><strong>ID:</strong> ${student.id}</p>
                    <p><strong>Gender:</strong> ${student.gender}</p>
                    ${student.email ? `<p><strong>Email:</strong> ${student.email}</p>` : ''}
                    ${student.phone ? `<p><strong>Phone:</strong> ${student.phone}</p>` : ''}
                </div>
                <div class="student-actions">
                    <button class="btn btn-sm" onclick="editStudent(${index})">✏️ Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent(${index})">🗑️ Delete</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Update student count
    document.getElementById('studentCount').textContent = appData.students.length;
    
    // Calculate average rate
    const avgRate = appData.students.length > 0 
        ? (appData.students.reduce((sum, student) => sum + parseFloat(student.rate), 0) / appData.students.length).toFixed(2)
        : '0.00';
    document.getElementById('averageRate').textContent = avgRate;
}

function addStudent() {
    const name = document.getElementById('studentName').value;
    const id = document.getElementById('studentId').value;
    const gender = document.getElementById('studentGender').value;
    const email = document.getElementById('studentEmail').value;
    const phone = document.getElementById('studentPhone').value;
    const rate = document.getElementById('studentBaseRate').value || appData.settings.defaultRate;
    
    if (!name || !id || !gender) {
        alert('Please fill in required fields: Name, ID, and Gender');
        return;
    }
    
    const newStudent = {
        name,
        id,
        gender,
        email,
        phone,
        rate: parseFloat(rate),
        createdAt: new Date().toISOString()
    };
    
    appData.students.push(newStudent);
    saveAllData();
    loadStudents();
    clearStudentForm();
    
    alert('✅ Student added successfully!');
}

function clearStudentForm() {
    document.getElementById('studentName').value = '';
    document.getElementById('studentId').value = '';
    document.getElementById('studentGender').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('studentPhone').value = '';
    document.getElementById('studentBaseRate').value = '';
}

function deleteStudent(index) {
    if (confirm('Are you sure you want to delete this student?')) {
        appData.students.splice(index, 1);
        saveAllData();
        loadStudents();
        alert('✅ Student deleted successfully!');
    }
}

// ============================================================================
// HOURS TRACKING
// ============================================================================

function loadHours() {
    const container = document.getElementById('hoursContainer');
    if (!container) return;
    
    if (appData.hours.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No hours logged yet.</p>';
        return;
    }
    
    let html = '<div class="hours-list">';
    
    // Show last 10 entries
    appData.hours.slice(-10).reverse().forEach((entry, index) => {
        const totalPay = (entry.hours * entry.rate).toFixed(2);
        html += `
            <div class="hours-entry">
                <div class="hours-header">
                    <h4>${entry.subject} - ${entry.organization}</h4>
                    <span class="hours-amount">$${totalPay}</span>
                </div>
                <div class="hours-details">
                    <p><strong>Date:</strong> ${new Date(entry.date).toLocaleDateString()}</p>
                    <p><strong>Hours:</strong> ${entry.hours}</p>
                    <p><strong>Rate:</strong> $${entry.rate}/hour</p>
                    ${entry.topic ? `<p><strong>Topic:</strong> ${entry.topic}</p>` : ''}
                    ${entry.notes ? `<p><strong>Notes:</strong> ${entry.notes}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    updateHoursStats();
}

function logHours() {
    const organization = document.getElementById('organization').value;
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value;
    
    if (!organization || !subject || !date || !hours || !rate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newEntry = {
        organization,
        subject,
        topic,
        date,
        hours,
        rate,
        notes,
        createdAt: new Date().toISOString(),
        total: hours * rate
    };
    
    appData.hours.push(newEntry);
    saveAllData();
    loadHours();
    resetHoursForm();
    
    alert('✅ Hours logged successfully!');
}

function resetHoursForm() {
    document.getElementById('organization').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('topic').value = '';
    document.getElementById('workDate').value = '';
    document.getElementById('hoursWorked').value = '';
    document.getElementById('baseRate').value = '';
    document.getElementById('workNotes').value = '';
    document.getElementById('totalPay').value = '';
}

function updateHoursStats() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const weeklyHours = appData.hours
        .filter(entry => new Date(entry.date) >= startOfWeek)
        .reduce((sum, entry) => sum + entry.hours, 0);
    
    const weeklyTotal = appData.hours
        .filter(entry => new Date(entry.date) >= startOfWeek)
        .reduce((sum, entry) => sum + entry.total, 0);
    
    const monthlyHours = appData.hours
        .filter(entry => new Date(entry.date) >= startOfMonth)
        .reduce((sum, entry) => sum + entry.hours, 0);
    
    const monthlyTotal = appData.hours
        .filter(entry => new Date(entry.date) >= startOfMonth)
        .reduce((sum, entry) => sum + entry.total, 0);
    
    document.getElementById('weeklyHours').textContent = weeklyHours.toFixed(1);
    document.getElementById('weeklyTotal').textContent = weeklyTotal.toFixed(2);
    document.getElementById('monthlyHours').textContent = monthlyHours.toFixed(1);
    document.getElementById('monthlyTotal').textContent = monthlyTotal.toFixed(2);
}

// ============================================================================
// MARKS MANAGEMENT
// ============================================================================

function loadMarks() {
    const container = document.getElementById('marksContainer');
    if (!container) return;
    
    // Populate student dropdown
    const studentSelect = document.getElementById('marksStudent');
    studentSelect.innerHTML = '<option value="">Select student...</option>';
    appData.students.forEach(student => {
        studentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
    });
    
    if (appData.marks.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No marks recorded yet.</p>';
        return;
    }
    
    let html = '<div class="marks-list">';
    
    appData.marks.slice(-10).reverse().forEach((mark, index) => {
        const student = appData.students.find(s => s.id === mark.studentId);
        const percentage = ((mark.score / mark.maxScore) * 100).toFixed(1);
        const grade = getGrade(percentage);
        
        html += `
            <div class="mark-entry">
                <div class="mark-header">
                    <h4>${student ? student.name : 'Unknown Student'} - ${mark.subject}</h4>
                    <span class="mark-percentage ${grade.toLowerCase()}">${percentage}%</span>
                </div>
                <div class="mark-details">
                    <p><strong>Topic:</strong> ${mark.topic}</p>
                    <p><strong>Score:</strong> ${mark.score}/${mark.maxScore}</p>
                    <p><strong>Grade:</strong> ${grade}</p>
                    <p><strong>Date:</strong> ${new Date(mark.date).toLocaleDateString()}</p>
                    ${mark.comments ? `<p><strong>Comments:</strong> ${mark.comments}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    updateMarksStats();
}

function addMark() {
    const studentId = document.getElementById('marksStudent').value;
    const subject = document.getElementById('markSubject').value;
    const topic = document.getElementById('markTopic').value;
    const date = document.getElementById('markDate').value;
    const score = parseFloat(document.getElementById('score').value);
    const maxScore = parseFloat(document.getElementById('maxScore').value);
    const comments = document.getElementById('markComments').value;
    
    if (!studentId || !subject || !topic || !date || !score || !maxScore) {
        alert('Please fill in all required fields');
        return;
    }
    
    const percentage = (score / maxScore) * 100;
    const grade = getGrade(percentage);
    
    const newMark = {
        studentId,
        subject,
        topic,
        date,
        score,
        maxScore,
        percentage,
        grade,
        comments,
        createdAt: new Date().toISOString()
    };
    
    appData.marks.push(newMark);
    saveAllData();
    loadMarks();
    document.getElementById('marksForm').reset();
    
    alert('✅ Mark added successfully!');
}

function getGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

function updateMarksStats() {
    const marksCount = appData.marks.length;
    const avgPercentage = marksCount > 0 
        ? (appData.marks.reduce((sum, mark) => sum + mark.percentage, 0) / marksCount).toFixed(1)
        : '0';
    
    document.getElementById('marksCount').textContent = marksCount;
    document.getElementById('avgMarks').textContent = avgPercentage;
}

// ============================================================================
// ATTENDANCE TRACKING
// ============================================================================

function loadAttendance() {
    const container = document.getElementById('attendanceContainer');
    if (!container) return;
    
    // Populate attendance list
    const attendanceList = document.getElementById('attendanceList');
    attendanceList.innerHTML = '';
    
    if (appData.students.length === 0) {
        attendanceList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No students registered.</p>';
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No attendance records yet.</p>';
        return;
    }
    
    // Build student checklist
    appData.students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'attendance-item';
        div.innerHTML = `
            <label>
                <input type="checkbox" id="attend_${student.id}" value="${student.id}">
                ${student.name} (${student.id})
            </label>
        `;
        attendanceList.appendChild(div);
    });
    
    if (appData.attendance.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No attendance records yet.</p>';
        return;
    }
    
    let html = '<div class="attendance-list">';
    
    appData.attendance.slice(-10).reverse().forEach((session, index) => {
        const presentStudents = session.presentStudents.map(id => {
            const student = appData.students.find(s => s.id === id);
            return student ? student.name : 'Unknown';
        });
        
        html += `
            <div class="attendance-entry">
                <div class="attendance-header">
                    <h4>${session.subject} - ${new Date(session.date).toLocaleDateString()}</h4>
                    <span class="attendance-count">${session.presentStudents.length} students</span>
                </div>
                <div class="attendance-details">
                    <p><strong>Topic:</strong> ${session.topic || 'N/A'}</p>
                    <p><strong>Present:</strong> ${presentStudents.join(', ')}</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    updateAttendanceStats();
}

function saveAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const subject = document.getElementById('attendanceSubject').value;
    const topic = document.getElementById('attendanceTopic').value;
    
    if (!date || !subject) {
        alert('Please fill in date and subject');
        return;
    }
    
    const presentStudents = [];
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
    
    alert('✅ Attendance saved successfully!');
}

function updateAttendanceStats() {
    const attendanceCount = appData.attendance.length;
    const lastSession = attendanceCount > 0 
        ? new Date(appData.attendance[appData.attendance.length - 1].date).toLocaleDateString()
        : 'Never';
    
    document.getElementById('attendanceCount').textContent = attendanceCount;
    document.getElementById('lastSessionDate').textContent = lastSession;
}

// ============================================================================
// PAYMENTS MANAGEMENT
// ============================================================================

function loadPayments() {
    const container = document.getElementById('paymentActivityLog');
    const balancesContainer = document.getElementById('studentBalancesContainer');
    
    if (!container) return;
    
    // Populate student dropdown
    const studentSelect = document.getElementById('paymentStudent');
    studentSelect.innerHTML = '<option value="">Select Student</option>';
    appData.students.forEach(student => {
        studentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
    });
    
    if (appData.payments.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No recent payment activity.</p>';
        balancesContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No students with balances.</p>';
        return;
    }
    
    // Payment activity
    let html = '<div class="payment-list">';
    
    appData.payments.slice(-10).reverse().forEach((payment, index) => {
        const student = appData.students.find(s => s.id === payment.studentId);
        html += `
            <div class="payment-entry">
                <div class="payment-header">
                    <h4>${student ? student.name : 'Unknown Student'}</h4>
                    <span class="payment-amount">$${payment.amount}</span>
                </div>
                <div class="payment-details">
                    <p><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString()}</p>
                    <p><strong>Method:</strong> ${payment.method}</p>
                    ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Student balances
    loadStudentBalances();
    updatePaymentStats();
}

function loadStudentBalances() {
    const container = document.getElementById('studentBalancesContainer');
    if (!container) return;
    
    let html = '<div class="balances-grid">';
    
    appData.students.forEach(student => {
        const studentPayments = appData.payments.filter(p => p.studentId === student.id);
        const totalPaid = studentPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        
        // Calculate owed amount (simplified - in real app you'd track sessions and rates)
        const studentHours = appData.hours.filter(h => {
            // This would need to be linked to students in a real implementation
            return true; // Placeholder
        });
        
        const totalOwed = studentHours.length * student.rate;
        const balance = totalOwed - totalPaid;
        
        html += `
            <div class="balance-card">
                <div class="balance-header">
                    <h4>${student.name}</h4>
                    <span class="balance-amount ${balance > 0 ? 'owed' : 'paid'}">
                        $${Math.abs(balance).toFixed(2)} ${balance > 0 ? 'owed' : 'overpaid'}
                    </span>
                </div>
                <div class="balance-details">
                    <p>Paid: $${totalPaid.toFixed(2)}</p>
                    <p>Owed: $${totalOwed.toFixed(2)}</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function recordPayment() {
    const studentId = document.getElementById('paymentStudent').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    const method = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('paymentNotes').value;
    
    if (!studentId || !amount || !date) {
        alert('Please fill in required fields: Student, Amount, and Date');
        return;
    }
    
    const newPayment = {
        studentId,
        amount,
        date,
        method,
        notes,
        createdAt: new Date().toISOString()
    };
    
    appData.payments.push(newPayment);
    saveAllData();
    loadPayments();
    resetPaymentForm();
    
    alert('✅ Payment recorded successfully!');
}

function resetPaymentForm() {
    document.getElementById('paymentStudent').value = '';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentDate').value = '';
    document.getElementById('paymentMethod').value = 'Cash';
    document.getElementById('paymentNotes').value = '';
}

function updatePaymentStats() {
    const totalStudents = appData.students.length;
    const monthlyPayments = appData.payments
        .filter(p => {
            const paymentDate = new Date(p.date);
            const now = new Date();
            return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, payment) => sum + payment.amount, 0);
    
    document.getElementById('totalStudentsCount').textContent = totalStudents;
    document.getElementById('monthlyPayments').textContent = monthlyPayments.toFixed(2);
}

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

function loadReports() {
    updateReportStats();
    showWeeklyBreakdown();
}

function updateReportStats() {
    const totalStudents = appData.students.length;
    const totalHours = appData.hours.reduce((sum, entry) => sum + entry.hours, 0);
    const totalEarnings = appData.hours.reduce((sum, entry) => sum + entry.total, 0);
    const totalPayments = appData.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const avgMark = appData.marks.length > 0 
        ? (appData.marks.reduce((sum, mark) => sum + mark.percentage, 0) / appData.marks.length).toFixed(1)
        : '0';
    
    document.getElementById('totalStudentsReport').textContent = totalStudents;
    document.getElementById('totalHoursReport').textContent = totalHours.toFixed(1);
    document.getElementById('totalEarningsReport').textContent = totalEarnings.toFixed(2);
    document.getElementById('avgMarkReport').textContent = avgMark + '%';
    document.getElementById('totalPaymentsReport').textContent = totalPayments.toFixed(2);
}

function showWeeklyBreakdown() {
    const container = document.getElementById('breakdownContainer');
    const weeklyBody = document.getElementById('weeklyBody');
    
    // Group hours by week
    const weeklyData = {};
    appData.hours.forEach(entry => {
        const date = new Date(entry.date);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
                hours: 0,
                earnings: 0,
                subjects: new Set()
            };
        }
        
        weeklyData[weekKey].hours += entry.hours;
        weeklyData[weekKey].earnings += entry.total;
        weeklyData[weekKey].subjects.add(entry.subject);
    });
    
    let html = '';
    Object.entries(weeklyData).forEach(([week, data]) => {
        const netEarnings = data.earnings * 0.8; // 80% net
        html += `
            <tr>
                <td>${new Date(week).toLocaleDateString()}</td>
                <td>${data.hours.toFixed(1)}h</td>
                <td>$${data.earnings.toFixed(2)}</td>
                <td>${Array.from(data.subjects).join(', ')}</td>
                <td>$${netEarnings.toFixed(2)}</td>
            </tr>
        `;
    });
    
    weeklyBody.innerHTML = html || '<tr><td colspan="5" style="text-align: center; color: #666;">No weekly data available</td></tr>';
    container.innerHTML = '<h4>📅 Weekly Breakdown</h4><p>Showing earnings and hours by week</p>';
}

function showSubjectBreakdown() {
    const container = document.getElementById('breakdownContainer');
    const subjectBody = document.getElementById('subjectBody');
    
    // Group by subject
    const subjectData = {};
    appData.hours.forEach(entry => {
        if (!subjectData[entry.subject]) {
            subjectData[entry.subject] = {
                hours: 0,
                earnings: 0,
                sessions: 0
            };
        }
        
        subjectData[entry.subject].hours += entry.hours;
        subjectData[entry.subject].earnings += entry.total;
        subjectData[entry.subject].sessions += 1;
    });
    
    // Calculate average marks per subject
    const subjectMarks = {};
    appData.marks.forEach(mark => {
        if (!subjectMarks[mark.subject]) {
            subjectMarks[mark.subject] = {
                total: 0,
                count: 0
            };
        }
        
        subjectMarks[mark.subject].total += mark.percentage;
        subjectMarks[mark.subject].count += 1;
    });
    
    let html = '';
    Object.entries(subjectData).forEach(([subject, data]) => {
        const avgMark = subjectMarks[subject] 
            ? (subjectMarks[subject].total / subjectMarks[subject].count).toFixed(1)
            : 'N/A';
            
        html += `
            <tr>
                <td>${subject}</td>
                <td>${avgMark}%</td>
                <td>${data.hours.toFixed(1)}h</td>
                <td>$${data.earnings.toFixed(2)}</td>
                <td>${data.sessions}</td>
            </tr>
        `;
    });
    
    subjectBody.innerHTML = html || '<tr><td colspan="5" style="text-align: center; color: #666;">No subject data available</td></tr>';
    container.innerHTML = '<h4>📚 Subject Breakdown</h4><p>Showing performance and earnings by subject</p>';
}

function showMonthlyBreakdown() {
    const container = document.getElementById('breakdownContainer');
    container.innerHTML = `
        <h4>📈 Monthly Breakdown</h4>
        <p>Monthly analytics would show trends over time with charts and comparisons.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <p>📊 Chart: Monthly Earnings Trend</p>
            <p>📊 Chart: Student Progress Over Time</p>
            <p>📊 Chart: Subject Distribution</p>
        </div>
    `;
}

function showBiWeeklyBreakdown() {
    const container = document.getElementById('breakdownContainer');
    container.innerHTML = `
        <h4>📆 Bi-Weekly Breakdown</h4>
        <p>Bi-weekly reports would show data in two-week intervals for better pacing analysis.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p>• Pay period summaries</p>
            <p>• Student attendance patterns</p>
            <p>• Revenue forecasting</p>
        </div>
    `;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Auto-calculate total pay
    const hoursInput = document.getElementById('hoursWorked');
    const rateInput = document.getElementById('baseRate');
    const totalPayInput = document.getElementById('totalPay');
    
    if (hoursInput && rateInput && totalPayInput) {
        const calculateTotal = () => {
            const hours = parseFloat(hoursInput.value) || 0;
            const rate = parseFloat(rateInput.value) || 0;
            totalPayInput.value = (hours * rate).toFixed(2);
        };
        
        hoursInput.addEventListener('input', calculateTotal);
        rateInput.addEventListener('input', calculateTotal);
    }
    
    // Auto-calculate percentage
    const scoreInput = document.getElementById('score');
    const maxScoreInput = document.getElementById('maxScore');
    const percentageInput = document.getElementById('percentage');
    const gradeInput = document.getElementById('grade');
    
    if (scoreInput && maxScoreInput && percentageInput && gradeInput) {
        const calculatePercentage = () => {
            const score = parseFloat(scoreInput.value) || 0;
            const maxScore = parseFloat(maxScoreInput.value) || 1;
            const percentage = (score / maxScore) * 100;
            percentageInput.value = percentage.toFixed(1) + '%';
            gradeInput.value = getGrade(percentage);
        };
        
        scoreInput.addEventListener('input', calculatePercentage);
        maxScoreInput.addEventListener('input', calculatePercentage);
    }
    
    // Student selection in marks
    const marksStudentSelect = document.getElementById('marksStudent');
    const studentDetails = document.getElementById('studentDetails');
    
    if (marksStudentSelect && studentDetails) {
        marksStudentSelect.addEventListener('change', function() {
            const studentId = this.value;
            const student = appData.students.find(s => s.id === studentId);
            
            if (student) {
                document.getElementById('selectedStudentName').textContent = student.name;
                document.getElementById('selectedStudentGender').textContent = student.gender;
                document.getElementById('selectedStudentId').textContent = student.id;
                studentDetails.style.display = 'block';
            } else {
                studentDetails.style.display = 'none';
            }
        });
    }
}

function updateStats() {
    console.log('📈 Updating stats...');
    
    const totalStudents = appData.students.length;
    const totalHours = appData.hours.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1);
    const totalSessions = appData.hours.length + appData.attendance.length;
    
    document.getElementById('dataStatus').textContent = `📊 Data: ${totalStudents} Students, ${totalSessions} Sessions`;
    
    // Update all tab-specific stats
    if (typeof loadStudents === 'function') loadStudents();
    if (typeof loadHours === 'function') loadHours();
    if (typeof loadMarks === 'function') loadMarks();
    if (typeof loadAttendance === 'function') loadAttendance();
    if (typeof loadPayments === 'function') loadPayments();
}

// Export/Import functions
function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `worklog_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Data exported successfully!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const importedData = JSON.parse(event.target.result);
                appData = importedData;
                saveAllData();
                location.reload();
                alert('✅ Data imported successfully!');
            } catch (error) {
                alert('❌ Error importing data: Invalid file format');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    if (confirm('⚠️ Are you sure you want to clear ALL data? This cannot be undone!')) {
        appData = {
            students: [],
            hours: [],
            marks: [],
            attendance: [],
            payments: [],
            settings: {
                defaultRate: 25.00
            }
        };
        saveAllData();
        location.reload();
        alert('✅ All data cleared!');
    }
}

// Make functions globally available
window.loadStudents = loadStudents;
window.loadHours = loadHours;
window.loadMarks = loadMarks;
window.loadAttendance = loadAttendance;
window.loadPayments = loadPayments;
window.loadReports = loadReports;
window.addStudent = addStudent;
window.clearStudentForm = clearStudentForm;
window.deleteStudent = deleteStudent;
window.logHours = logHours;
window.resetHoursForm = resetHoursForm;
window.addMark = addMark;
window.saveAttendance = saveAttendance;
window.recordPayment = recordPayment;
window.resetPaymentForm = resetPaymentForm;
window.showWeeklyBreakdown = showWeeklyBreakdown;
window.showMonthlyBreakdown = showMonthlyBreakdown;
window.showBiWeeklyBreakdown = showBiWeeklyBreakdown;
window.showSubjectBreakdown = showSubjectBreakdown;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;

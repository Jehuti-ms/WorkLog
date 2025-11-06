// app.js - FIXED VERSION WITH PROPER DATA INITIALIZATION
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

function init() {
    console.log('🎯 App initialization started');
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        console.log('❌ User not authenticated');
        return;
    }
    
    console.log('✅ User authenticated, setting up app...');
    
    // Load data from localStorage with error handling
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
        try {
            const parsedData = JSON.parse(savedData);
            
            // Ensure all arrays exist and are arrays
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
            // Reset to empty data
            resetAppData();
        }
    } else {
        console.log('📊 No existing data, starting fresh');
        resetAppData();
    }
}

function resetAppData() {
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
        }
    } catch (error) {
        console.error(`❌ Error loading tab ${tabName}:`, error);
    }
}

// ============================================================================
// STUDENTS MANAGEMENT
// ============================================================================

function loadStudents() {
    try {
        const container = document.getElementById('studentsContainer');
        if (!container) return;
        
        if (!appData.students || appData.students.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No students registered yet.</p>';
            return;
        }
        
        let html = '<div class="students-grid">';
        
        appData.students.forEach((student, index) => {
            html += `
                <div class="student-card">
                    <div class="student-header">
                        <h4>${student.name}</h4>
                        <span class="student-rate">$${student.rate || '0.00'}/session</span>
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
            ? (appData.students.reduce((sum, student) => sum + parseFloat(student.rate || 0), 0) / appData.students.length).toFixed(2)
            : '0.00';
        document.getElementById('averageRate').textContent = avgRate;
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
    }
}

function addStudent() {
    try {
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
            rate: parseFloat(rate) || 0,
            createdAt: new Date().toISOString()
        };
        
        // Ensure students array exists
        if (!appData.students) appData.students = [];
        
        appData.students.push(newStudent);
        saveAllData();
        loadStudents();
        clearStudentForm();
        
        alert('✅ Student added successfully!');
        
    } catch (error) {
        console.error('❌ Error adding student:', error);
        alert('Error adding student: ' + error.message);
    }
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
    try {
        const container = document.getElementById('hoursContainer');
        if (!container) return;
        
        if (!appData.hours || appData.hours.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No hours logged yet.</p>';
            return;
        }
        
        let html = '<div class="hours-list">';
        
        // Show last 10 entries
        const recentHours = appData.hours.slice(-10).reverse();
        recentHours.forEach((entry, index) => {
            const totalPay = ((entry.hours || 0) * (entry.rate || 0)).toFixed(2);
            html += `
                <div class="hours-entry">
                    <div class="hours-header">
                        <h4>${entry.subject || 'No Subject'} - ${entry.organization || 'No Organization'}</h4>
                        <span class="hours-amount">$${totalPay}</span>
                    </div>
                    <div class="hours-details">
                        <p><strong>Date:</strong> ${entry.date ? new Date(entry.date).toLocaleDateString() : 'No Date'}</p>
                        <p><strong>Hours:</strong> ${entry.hours || 0}</p>
                        <p><strong>Rate:</strong> $${entry.rate || '0.00'}/hour</p>
                        ${entry.topic ? `<p><strong>Topic:</strong> ${entry.topic}</p>` : ''}
                        ${entry.notes ? `<p><strong>Notes:</strong> ${entry.notes}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        updateHoursStats();
        
    } catch (error) {
        console.error('❌ Error loading hours:', error);
        const container = document.getElementById('hoursContainer');
        if (container) {
            container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 40px;">Error loading hours data.</p>';
        }
    }
}

function logHours() {
    try {
        const organization = document.getElementById('organization').value;
        const subject = document.getElementById('subject').value;
        const topic = document.getElementById('topic').value;
        const date = document.getElementById('workDate').value;
        const hours = parseFloat(document.getElementById('hoursWorked').value) || 0;
        const rate = parseFloat(document.getElementById('baseRate').value) || 0;
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
        
        // Ensure hours array exists
        if (!appData.hours) appData.hours = [];
        
        appData.hours.push(newEntry);
        saveAllData();
        loadHours();
        resetHoursForm();
        
        alert('✅ Hours logged successfully!');
        
    } catch (error) {
        console.error('❌ Error logging hours:', error);
        alert('Error logging hours: ' + error.message);
    }
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
    try {
        if (!appData.hours) appData.hours = [];
        
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const weeklyHours = appData.hours
            .filter(entry => entry.date && new Date(entry.date) >= startOfWeek)
            .reduce((sum, entry) => sum + (entry.hours || 0), 0);
        
        const weeklyTotal = appData.hours
            .filter(entry => entry.date && new Date(entry.date) >= startOfWeek)
            .reduce((sum, entry) => sum + (entry.total || 0), 0);
        
        const monthlyHours = appData.hours
            .filter(entry => entry.date && new Date(entry.date) >= startOfMonth)
            .reduce((sum, entry) => sum + (entry.hours || 0), 0);
        
        const monthlyTotal = appData.hours
            .filter(entry => entry.date && new Date(entry.date) >= startOfMonth)
            .reduce((sum, entry) => sum + (entry.total || 0), 0);
        
        document.getElementById('weeklyHours').textContent = weeklyHours.toFixed(1);
        document.getElementById('weeklyTotal').textContent = weeklyTotal.toFixed(2);
        document.getElementById('monthlyHours').textContent = monthlyHours.toFixed(1);
        document.getElementById('monthlyTotal').textContent = monthlyTotal.toFixed(2);
        
    } catch (error) {
        console.error('❌ Error updating hours stats:', error);
    }
}

// ============================================================================
// MARKS MANAGEMENT
// ============================================================================

function loadMarks() {
    try {
        const container = document.getElementById('marksContainer');
        if (!container) return;
        
        // Populate student dropdown
        const studentSelect = document.getElementById('marksStudent');
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">Select student...</option>';
            if (appData.students) {
                appData.students.forEach(student => {
                    studentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
                });
            }
        }
        
        if (!appData.marks || appData.marks.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No marks recorded yet.</p>';
            return;
        }
        
        let html = '<div class="marks-list">';
        
        const recentMarks = appData.marks.slice(-10).reverse();
        recentMarks.forEach((mark, index) => {
            const student = appData.students ? appData.students.find(s => s.id === mark.studentId) : null;
            const percentage = mark.percentage || ((mark.score / mark.maxScore) * 100).toFixed(1);
            const grade = getGrade(percentage);
            
            html += `
                <div class="mark-entry">
                    <div class="mark-header">
                        <h4>${student ? student.name : 'Unknown Student'} - ${mark.subject || 'No Subject'}</h4>
                        <span class="mark-percentage ${grade.toLowerCase()}">${percentage}%</span>
                    </div>
                    <div class="mark-details">
                        <p><strong>Topic:</strong> ${mark.topic || 'No Topic'}</p>
                        <p><strong>Score:</strong> ${mark.score || 0}/${mark.maxScore || 0}</p>
                        <p><strong>Grade:</strong> ${grade}</p>
                        <p><strong>Date:</strong> ${mark.date ? new Date(mark.date).toLocaleDateString() : 'No Date'}</p>
                        ${mark.comments ? `<p><strong>Comments:</strong> ${mark.comments}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        updateMarksStats();
        
    } catch (error) {
        console.error('❌ Error loading marks:', error);
    }
}

function addMark() {
    try {
        const studentId = document.getElementById('marksStudent').value;
        const subject = document.getElementById('markSubject').value;
        const topic = document.getElementById('markTopic').value;
        const date = document.getElementById('markDate').value;
        const score = parseFloat(document.getElementById('score').value) || 0;
        const maxScore = parseFloat(document.getElementById('maxScore').value) || 1;
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
        
        // Ensure marks array exists
        if (!appData.marks) appData.marks = [];
        
        appData.marks.push(newMark);
        saveAllData();
        loadMarks();
        document.getElementById('marksForm').reset();
        
        alert('✅ Mark added successfully!');
        
    } catch (error) {
        console.error('❌ Error adding mark:', error);
        alert('Error adding mark: ' + error.message);
    }
}

function getGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

function updateMarksStats() {
    try {
        if (!appData.marks) appData.marks = [];
        
        const marksCount = appData.marks.length;
        const avgPercentage = marksCount > 0 
            ? (appData.marks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / marksCount).toFixed(1)
            : '0';
        
        document.getElementById('marksCount').textContent = marksCount;
        document.getElementById('avgMarks').textContent = avgPercentage;
        
    } catch (error) {
        console.error('❌ Error updating marks stats:', error);
    }
}

// ============================================================================
// ATTENDANCE TRACKING (Simplified for now)
// ============================================================================

function loadAttendance() {
    try {
        const container = document.getElementById('attendanceContainer');
        if (!container) return;
        
        if (!appData.attendance || appData.attendance.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No attendance records yet.</p>';
            return;
        }
        
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Attendance data loaded. Use the form to add new records.</p>';
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
        if (appData.students) {
            appData.students.forEach(student => {
                const checkbox = document.getElementById(`attend_${student.id}`);
                if (checkbox && checkbox.checked) {
                    presentStudents.push(student.id);
                }
            });
        }
        
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
        
        // Ensure attendance array exists
        if (!appData.attendance) appData.attendance = [];
        
        appData.attendance.push(newAttendance);
        saveAllData();
        loadAttendance();
        
        // Clear form
        document.getElementById('attendanceDate').value = '';
        document.getElementById('attendanceSubject').value = '';
        document.getElementById('attendanceTopic').value = '';
        
        alert('✅ Attendance saved successfully!');
        
    } catch (error) {
        console.error('❌ Error saving attendance:', error);
        alert('Error saving attendance: ' + error.message);
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
// PAYMENTS MANAGEMENT (Simplified for now)
// ============================================================================

function loadPayments() {
    try {
        const container = document.getElementById('paymentActivityLog');
        if (!container) return;
        
        if (!appData.payments || appData.payments.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No recent payment activity.</p>';
            return;
        }
        
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Payment data loaded. Use the form to add new payments.</p>';
        updatePaymentStats();
        
    } catch (error) {
        console.error('❌ Error loading payments:', error);
    }
}

function recordPayment() {
    try {
        const studentId = document.getElementById('paymentStudent').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
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
        
        // Ensure payments array exists
        if (!appData.payments) appData.payments = [];
        
        appData.payments.push(newPayment);
        saveAllData();
        loadPayments();
        resetPaymentForm();
        
        alert('✅ Payment recorded successfully!');
        
    } catch (error) {
        console.error('❌ Error recording payment:', error);
        alert('Error recording payment: ' + error.message);
    }
}

function resetPaymentForm() {
    document.getElementById('paymentStudent').value = '';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentDate').value = '';
    document.getElementById('paymentMethod').value = 'Cash';
    document.getElementById('paymentNotes').value = '';
}

function updatePaymentStats() {
    try {
        if (!appData.payments) appData.payments = [];
        if (!appData.students) appData.students = [];
        
        const totalStudents = appData.students.length;
        const monthlyPayments = appData.payments
            .filter(p => {
                if (!p.date) return false;
                const paymentDate = new Date(p.date);
                const now = new Date();
                return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        document.getElementById('totalStudentsCount').textContent = totalStudents;
        document.getElementById('monthlyPayments').textContent = monthlyPayments.toFixed(2);
        
    } catch (error) {
        console.error('❌ Error updating payment stats:', error);
    }
}

// ============================================================================
// REPORTS & ANALYTICS (Simplified for now)
// ============================================================================

function loadReports() {
    try {
        updateReportStats();
        showWeeklyBreakdown();
    } catch (error) {
        console.error('❌ Error loading reports:', error);
    }
}

function updateReportStats() {
    try {
        if (!appData.students) appData.students = [];
        if (!appData.hours) appData.hours = [];
        if (!appData.marks) appData.marks = [];
        if (!appData.payments) appData.payments = [];
        
        const totalStudents = appData.students.length;
        const totalHours = appData.hours.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const totalEarnings = appData.hours.reduce((sum, entry) => sum + (entry.total || 0), 0);
        const totalPayments = appData.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        const avgMark = appData.marks.length > 0 
            ? (appData.marks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / appData.marks.length).toFixed(1)
            : '0';
        
        document.getElementById('totalStudentsReport').textContent = totalStudents;
        document.getElementById('totalHoursReport').textContent = totalHours.toFixed(1);
        document.getElementById('totalEarningsReport').textContent = totalEarnings.toFixed(2);
        document.getElementById('avgMarkReport').textContent = avgMark + '%';
        document.getElementById('totalPaymentsReport').textContent = totalPayments.toFixed(2);
        
    } catch (error) {
        console.error('❌ Error updating report stats:', error);
    }
}

function showWeeklyBreakdown() {
    try {
        const container = document.getElementById('breakdownContainer');
        container.innerHTML = `
            <h4>📅 Weekly Breakdown</h4>
            <p>Weekly analytics will appear here as you add more data.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <p>Add hours and payments to see detailed breakdowns</p>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error showing weekly breakdown:', error);
    }
}

function showSubjectBreakdown() {
    try {
        const container = document.getElementById('breakdownContainer');
        container.innerHTML = `
            <h4>📚 Subject Breakdown</h4>
            <p>Subject analytics will appear here as you add more data.</p>
        `;
    } catch (error) {
        console.error('❌ Error showing subject breakdown:', error);
    }
}

function showMonthlyBreakdown() {
    try {
        const container = document.getElementById('breakdownContainer');
        container.innerHTML = `
            <h4>📈 Monthly Breakdown</h4>
            <p>Monthly analytics will appear here as you add more data.</p>
        `;
    } catch (error) {
        console.error('❌ Error showing monthly breakdown:', error);
    }
}

function showBiWeeklyBreakdown() {
    try {
        const container = document.getElementById('breakdownContainer');
        container.innerHTML = `
            <h4>📆 Bi-Weekly Breakdown</h4>
            <p>Bi-weekly reports will appear here as you add more data.</p>
        `;
    } catch (error) {
        console.error('❌ Error showing bi-weekly breakdown:', error);
    }
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
}

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
        
        // Update all tab-specific stats
        loadStudents();
        loadHours();
        loadMarks();
        loadAttendance();
        loadPayments();
        
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

// Export/Import functions
function exportData() {
    try {
        const dataStr = JSON.stringify(appData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `worklog_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        alert('✅ Data exported successfully!');
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    }
}

function importData() {
    try {
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
    } catch (error) {
        console.error('❌ Error importing data:', error);
        alert('Error importing data: ' + error.message);
    }
}

function clearAllData() {
    if (confirm('⚠️ Are you sure you want to clear ALL data? This cannot be undone!')) {
        resetAppData();
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

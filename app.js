// app.js - FIXED VERSION WITH WORKING BI-WEEKLY REPORTS
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
    
    // Initialize cloud sync
    if (window.cloudSync && !window.cloudSync.initialized) {
        window.cloudSync.init();
    }
    
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
            resetAppData();
        }
    } else {
        console.log('📊 No existing data, starting fresh');
        resetAppData();
    }
    
    // Load hours separately
    loadHoursFromStorage();
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

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

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
                        <h4 class="student-name">${student.name}</h4>
                        <span class="student-rate">$${student.rate || '0.00'}/session</span>
                    </div>
                    <div class="student-details">
                        <p><strong>ID:</strong> ${student.id}</p>
                        <p><strong>Gender:</strong> ${student.gender}</p>
                        ${student.email ? `<p><strong>Email:</strong> ${student.email}</p>` : ''}
                        ${student.phone ? `<p><strong>Phone:</strong> ${student.phone}</p>` : ''}
                        ${student.createdAt ? `<p><small>Added: ${new Date(student.createdAt).toLocaleDateString()}</small></p>` : ''}
                    </div>
                    <div class="student-actions">
                        <button class="btn btn-sm btn-edit" onclick="editStudent(${index})">✏️ Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent(${index})">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
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
        const rateInput = document.getElementById('studentBaseRate').value;
        
        const rate = rateInput ? parseFloat(rateInput) : (appData.settings.defaultRate || 25.00);
        
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
            rate: rate,
            createdAt: new Date().toISOString()
        };
        
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

function editStudent(index) {
    try {
        const student = appData.students[index];
        if (!student) {
            alert('Student not found!');
            return;
        }

        document.getElementById('studentName').value = student.name || '';
        document.getElementById('studentId').value = student.id || '';
        document.getElementById('studentGender').value = student.gender || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentBaseRate').value = student.rate || appData.settings.defaultRate || 25.00;

        const addButton = document.querySelector('.form-actions .btn-primary');
        if (addButton) {
            addButton.innerHTML = '💾 Update Student';
            addButton.onclick = function() { updateStudent(index); };
        }

        let cancelButton = document.querySelector('.btn-cancel-edit');
        if (!cancelButton) {
            cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'btn btn-warning btn-cancel-edit';
            cancelButton.innerHTML = '❌ Cancel Edit';
            cancelButton.onclick = cancelStudentEdit;
            
            const formActions = document.querySelector('.form-actions');
            if (formActions) {
                formActions.appendChild(cancelButton);
            }
        }

    } catch (error) {
        console.error('❌ Error editing student:', error);
        alert('Error editing student: ' + error.message);
    }
}

function updateStudent(index) {
    try {
        const name = document.getElementById('studentName').value;
        const id = document.getElementById('studentId').value;
        const gender = document.getElementById('studentGender').value;
        const email = document.getElementById('studentEmail').value;
        const phone = document.getElementById('studentPhone').value;
        const rateInput = document.getElementById('studentBaseRate').value;
        
        const rate = rateInput ? parseFloat(rateInput) : (appData.settings.defaultRate || 25.00);
        
        if (!name || !id || !gender) {
            alert('Please fill in required fields: Name, ID, and Gender');
            return;
        }

        appData.students[index] = {
            ...appData.students[index],
            name,
            id,
            gender,
            email,
            phone,
            rate: rate,
            updatedAt: new Date().toISOString()
        };

        saveAllData();
        loadStudents();
        cancelStudentEdit();
        
        alert('✅ Student updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating student:', error);
        alert('Error updating student: ' + error.message);
    }
}

function cancelStudentEdit() {
    clearStudentForm();
    
    const addButton = document.querySelector('.form-actions .btn-primary');
    if (addButton) {
        addButton.innerHTML = '➕ Add Student';
        addButton.onclick = addStudent;
    }
    
    const cancelButton = document.querySelector('.btn-cancel-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    console.log('❌ Student edit cancelled');
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
        console.log('⏱️ Loading hours...');
        loadHoursFromStorage();
        displayHours();
        updateHoursStats();
    } catch (error) {
        console.error('❌ Error loading hours:', error);
    }
}

function updateHoursStats() {
    try {
        const entries = window.hoursEntries || [];
        
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const weeklyHours = entries
            .filter(entry => {
                if (!entry.date) return false;
                const entryDate = new Date(entry.date);
                return entryDate >= oneWeekAgo;
            })
            .reduce((sum, entry) => sum + (entry.hours || 0), 0);
            
        const weeklyTotal = entries
            .filter(entry => {
                if (!entry.date) return false;
                const entryDate = new Date(entry.date);
                return entryDate >= oneWeekAgo;
            })
            .reduce((sum, entry) => sum + (entry.total || 0), 0);
            
        const monthlyHours = entries
            .filter(entry => {
                if (!entry.date) return false;
                const entryDate = new Date(entry.date);
                return entryDate >= startOfMonth;
            })
            .reduce((sum, entry) => sum + (entry.hours || 0), 0);
            
        const monthlyTotal = entries
            .filter(entry => {
                if (!entry.date) return false;
                const entryDate = new Date(entry.date);
                return entryDate >= startOfMonth;
            })
            .reduce((sum, entry) => sum + (entry.total || 0), 0);
        
        const weeklyHoursEl = document.getElementById('weeklyHours');
        const weeklyTotalEl = document.getElementById('weeklyTotal');
        const monthlyHoursEl = document.getElementById('monthlyHours');
        const monthlyTotalEl = document.getElementById('monthlyTotal');
        
        if (weeklyHoursEl) weeklyHoursEl.textContent = weeklyHours.toFixed(1);
        if (weeklyTotalEl) weeklyTotalEl.textContent = weeklyTotal.toFixed(2);
        if (monthlyHoursEl) monthlyHoursEl.textContent = monthlyHours.toFixed(1);
        if (monthlyTotalEl) monthlyTotalEl.textContent = monthlyTotal.toFixed(2);
        
    } catch (error) {
        console.error('❌ Error updating hours stats:', error);
    }
}

function displayHours() {
    const container = document.getElementById('hoursContainer');
    if (!container) return;
    
    const entries = window.hoursEntries || [];
    
    if (entries.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No work logged yet. Start tracking your earnings!</p>';
        return;
    }
    
    const sortedEntries = [...entries].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    container.innerHTML = sortedEntries.map((entry, index) => `
        <div class="mobile-entry-card">
            <div class="entry-header">
                <div class="entry-main">
                    <strong>${entry.organization}</strong>
                    <div class="entry-date">${formatDisplayDate(entry.date)} • ${entry.hours}h • $${entry.rate}/h</div>
                </div>
                <div class="entry-amount">$${(entry.hours * entry.rate).toFixed(2)}</div>
            </div>
            <div class="entry-details">
                <div><strong>Subject:</strong> ${entry.subject || 'N/A'}</div>
                <div><strong>Topic:</strong> ${entry.topic || 'N/A'}</div>
                <div><strong>Work Type:</strong> ${entry.workType || 'hourly'}</div>
                ${entry.notes ? `<div><strong>Notes:</strong> ${entry.notes}</div>` : ''}
            </div>
            <div class="entry-actions">
                <button class="btn btn-sm btn-edit" onclick="startEditHours(${entries.indexOf(entry)})">✏️ Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteHours(${entries.indexOf(entry)})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function formatDisplayDate(dateString) {
    if (!dateString) return 'No Date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function startEditHours(index) {
    console.log('Starting edit for index:', index);
    
    const entry = window.hoursEntries[index];
    if (!entry) {
        alert('Entry not found');
        return;
    }
    
    document.getElementById('organization').value = entry.organization || '';
    document.getElementById('workType').value = entry.workType || 'hourly';
    document.getElementById('subject').value = entry.subject || '';
    document.getElementById('topic').value = entry.topic || '';
    document.getElementById('workDate').value = entry.date || '';
    document.getElementById('hoursWorked').value = entry.hours || '';
    document.getElementById('baseRate').value = entry.rate || '';
    document.getElementById('workNotes').value = entry.notes || '';
    
    updateTotalDisplay();
    editingHoursIndex = index;
    
    const saveButton = document.querySelector('#hours .btn-primary');
    if (saveButton) {
        saveButton.textContent = '💾 Update Entry';
        saveButton.onclick = updateHoursEntry;
    }
    
    if (!document.querySelector('.cancel-edit-btn')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary cancel-edit-btn';
        cancelButton.textContent = '❌ Cancel';
        cancelButton.onclick = cancelHoursEdit;
        document.querySelector('.form-actions').appendChild(cancelButton);
    }
}

function updateHoursEntry() {
    if (editingHoursIndex === null) {
        alert('No entry selected for editing');
        return;
    }
    
    const organization = document.getElementById('organization').value;
    const workType = document.getElementById('workType').value;
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value;
    
    if (!organization || !date || isNaN(hours) || isNaN(rate)) {
        alert('Please fill in all required fields');
        return;
    }
    
    window.hoursEntries[editingHoursIndex] = {
        organization,
        workType,
        subject,
        topic,
        date,
        hours,
        rate,
        notes,
        total: hours * rate
    };
    
    saveHoursToStorage();
    displayHours();
    cancelHoursEdit();
    
    alert('✅ Entry updated successfully!');
}

function logHours() {
    if (editingHoursIndex !== null) {
        updateHoursEntry();
        return;
    }
    
    const organization = document.getElementById('organization').value;
    const workType = document.getElementById('workType').value;
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value;
    
    if (!organization || !date || isNaN(hours) || isNaN(rate)) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newEntry = {
        organization,
        workType,
        subject,
        topic,
        date,
        hours,
        rate,
        notes,
        total: hours * rate,
        timestamp: new Date().toISOString()
    };
    
    if (!window.hoursEntries) window.hoursEntries = [];
    window.hoursEntries.push(newEntry);
    
    saveHoursToStorage();
    displayHours();
    cancelHoursEdit();
    
    alert('✅ Entry added successfully!');
}

function cancelHoursEdit() {
    document.getElementById('organization').value = '';
    document.getElementById('workType').value = 'hourly';
    document.getElementById('subject').value = '';
    document.getElementById('topic').value = '';
    document.getElementById('workDate').value = '';
    document.getElementById('hoursWorked').value = '';
    document.getElementById('baseRate').value = '';
    document.getElementById('workNotes').value = '';
    document.getElementById('totalPay').value = '';
    
    const saveButton = document.querySelector('#hours .btn-primary');
    if (saveButton) {
        saveButton.textContent = '💾 Log Work & Earnings';
        saveButton.onclick = logHours;
    }
    
    const cancelButton = document.querySelector('.cancel-edit-btn');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    editingHoursIndex = null;
    
    const dateInput = document.getElementById('workDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function deleteHours(index) {
    if (confirm('Are you sure you want to delete this entry?')) {
        window.hoursEntries.splice(index, 1);
        saveHoursToStorage();
        displayHours();
        alert('✅ Entry deleted successfully!');
    }
}

function updateTotalDisplay() {
    const hours = parseFloat(document.getElementById('hoursWorked').value) || 0;
    const rate = parseFloat(document.getElementById('baseRate').value) || 0;
    document.getElementById('totalPay').value = (hours * rate).toFixed(2);
}

function saveHoursToStorage() {
    try {
        localStorage.setItem('worklog_hours', JSON.stringify({
            hours: window.hoursEntries || [],
            lastUpdated: new Date().toISOString()
        }));
        console.log('💾 Hours saved to storage');
    } catch (error) {
        console.error('❌ Error saving hours:', error);
    }
}

function loadHoursFromStorage() {
    try {
        const saved = localStorage.getItem('worklog_hours');
        if (saved) {
            const data = JSON.parse(saved);
            window.hoursEntries = data.hours || [];
            console.log('📥 Loaded hours from storage:', window.hoursEntries.length, 'entries');
            return window.hoursEntries;
        }
    } catch (error) {
        console.error('❌ Error loading hours:', error);
    }
    return [];
}

// ============================================================================
// REPORTS SYSTEM - FIXED BI-WEEKLY
// ============================================================================

function loadReports() {
    console.log('📈 Loading reports...');
    try {
        updateReportStats();
        initializeMonthlyReport();
        console.log('✅ Reports loaded successfully');
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

function initializeMonthlyReport() {
    console.log('📊 Initializing monthly report...');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    console.log('📅 Default month:', currentMonth, 'Year:', currentYear);
    
    updateMonthSelector(currentYear, currentMonth);
    generateMonthlyReport(currentYear, currentMonth);
}

function updateMonthSelector(year, month) {
    console.log('🔄 Updating month selector for:', year, month);
    
    // Create month selection options
    let monthOptions = '';
    monthNames.forEach((monthName, index) => {
        const selected = index === month ? 'selected' : '';
        monthOptions += `<option value="${index}" ${selected}>${monthName}</option>`;
    });
    
    // Create year selection options
    let yearOptions = '';
    for (let i = year - 2; i <= year + 1; i++) {
        const selected = i === year ? 'selected' : '';
        yearOptions += `<option value="${i}" ${selected}>${i}</option>`;
    }
    
    // Remove existing month selector if it exists
    const existingSelector = document.getElementById('monthSelector');
    if (existingSelector) {
        existingSelector.remove();
    }
    
    // Add month selector to reports section
    const breakdownCard = document.querySelector('#breakdownContainer')?.closest('.section-card');
    if (breakdownCard) {
        console.log('🎯 Adding month selector to breakdown section');
        const monthSelectorHTML = `
            <div class="month-selector" id="monthSelector" style="margin-bottom: 20px;">
                <label for="reportMonth" style="margin-right: 10px; font-weight: 500;">Select Month:</label>
                <select id="reportMonth" onchange="onMonthChange()" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
                    ${monthOptions}
                </select>
                <select id="reportYear" onchange="onMonthChange()" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;">
                    ${yearOptions}
                </select>
                <button class="btn btn-sm" onclick="generateCurrentMonthReport()" style="margin-left: 10px;">
                    📅 Current Month
                </button>
            </div>
        `;
        
        breakdownCard.insertAdjacentHTML('afterbegin', monthSelectorHTML);
        console.log('✅ Month selector added successfully');
    } else {
        console.log('❌ Breakdown card not found');
    }
}

function onMonthChange() {
    const selectedMonth = parseInt(document.getElementById('reportMonth').value);
    const selectedYear = parseInt(document.getElementById('reportYear').value);
    console.log('🔄 Month changed to:', selectedYear, selectedMonth);
    
    generateMonthlyReport(selectedYear, selectedMonth);
}

function generateCurrentMonthReport() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    console.log('📅 Switching to current month:', currentYear, currentMonth);
    
    document.getElementById('reportMonth').value = currentMonth;
    document.getElementById('reportYear').value = currentYear;
    
    generateMonthlyReport(currentYear, currentMonth);
}

function generateMonthlyReport(year, month) {
    console.log(`📊 Generating report for ${year}-${month + 1}`);
    
    const monthName = monthNames[month];
    
    // Filter data for the selected month
    const monthlyHours = filterDataByMonth(appData.hours || [], year, month);
    const monthlyMarks = filterDataByMonth(appData.marks || [], year, month);
    const monthlyAttendance = filterDataByMonth(appData.attendance || [], year, month);
    const monthlyPayments = filterDataByMonth(appData.payments || [], year, month);
    
    console.log('📈 Filtered data:', {
        hours: monthlyHours.length,
        marks: monthlyMarks.length,
        attendance: monthlyAttendance.length,
        payments: monthlyPayments.length
    });
    
    // Calculate statistics
    const stats = calculateMonthlyStats(monthlyHours, monthlyMarks, monthlyAttendance, monthlyPayments);
    
    // Update the breakdown container with monthly report
    const container = document.getElementById('breakdownContainer');
    if (container) {
        container.innerHTML = generateMonthlyReportHTML(monthName, year, stats, monthlyHours, monthlyMarks);
        console.log('✅ Monthly report generated successfully');
    } else {
        console.log('❌ Breakdown container not found!');
    }
}

function filterDataByMonth(data, year, month) {
    return data.filter(item => {
        if (!item.date) return false;
        
        try {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === year && itemDate.getMonth() === month;
        } catch (e) {
            console.log('❌ Error parsing date:', item.date, e);
            return false;
        }
    });
}

function calculateMonthlyStats(hours, marks, attendance, payments) {
    const totalHours = hours.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    const totalEarnings = hours.reduce((sum, entry) => sum + (entry.total || 0), 0);
    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
    
    const totalMarks = marks.length;
    const avgMark = totalMarks > 0 
        ? (marks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / totalMarks)
        : 0;
    
    const totalSessions = attendance.length;
    const totalStudentsPresent = attendance.reduce((sum, session) => 
        sum + (session.presentStudents ? session.presentStudents.length : 0), 0
    );
    const avgStudentsPerSession = totalSessions > 0 ? totalStudentsPresent / totalSessions : 0;
    
    const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    return {
        totalHours: totalHours.toFixed(1),
        totalEarnings: totalEarnings.toFixed(2),
        avgHourlyRate: avgHourlyRate.toFixed(2),
        totalMarks,
        avgMark: avgMark.toFixed(1),
        totalSessions,
        totalStudentsPresent,
        avgStudentsPerSession: avgStudentsPerSession.toFixed(1),
        totalPayments: totalPayments.toFixed(2)
    };
}

function generateMonthlyReportHTML(monthName, year, stats, hours, marks) {
    const monthIndex = monthNames.indexOf(monthName);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    return `
        <div class="monthly-report">
            <div class="report-header">
                <h3>📈 ${monthName} ${year} - Monthly Report</h3>
                <div class="report-period">Period: ${monthName} 1 - ${monthName} ${daysInMonth}, ${year}</div>
            </div>
            
            <div class="stats-grid monthly-stats">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalHours}h</div>
                    <div class="stat-label">Total Hours</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${stats.totalEarnings}</div>
                    <div class="stat-label">Total Earnings</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${stats.avgHourlyRate}/h</div>
                    <div class="stat-label">Avg Hourly Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalSessions}</div>
                    <div class="stat-label">Sessions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalMarks}</div>
                    <div class="stat-label">Assessments</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.avgMark}%</div>
                    <div class="stat-label">Avg Score</div>
                </div>
            </div>
            
            <div class="report-details">
                <div class="detail-section">
                    <h4>📊 Activity Summary</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Work Entries:</span>
                            <span class="detail-value">${hours.length}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Total Students Present:</span>
                            <span class="detail-value">${stats.totalStudentsPresent}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Avg Students/Session:</span>
                            <span class="detail-value">${stats.avgStudentsPerSession}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Total Payments:</span>
                            <span class="detail-value">$${stats.totalPayments}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>📋 Recent Activity</h4>
                    <div class="recent-activities">
                        ${generateRecentActivities(hours, marks)}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Report Type Selector -->
        <div class="button-group" style="margin-top: 30px; text-align: center;">
            <button class="btn btn-secondary" onclick="showWeeklyBreakdown()">📅 Weekly</button>
            <button class="btn btn-primary" onclick="showBiWeeklyBreakdown()">📆 Bi-Weekly</button>
            <button class="btn btn-secondary" onclick="showMonthlyBreakdown()">📈 Monthly</button>
            <button class="btn btn-secondary" onclick="showSubjectBreakdown()">📚 Subject</button>
        </div>
    `;
}

function generateRecentActivities(hours, marks) {
    const recentHours = hours.slice(-5).reverse();
    const recentMarks = marks.slice(-5).reverse();
    
    let html = '';
    
    if (recentHours.length > 0) {
        html += '<div class="activity-group"><strong>Recent Work:</strong><ul>';
        recentHours.forEach(entry => {
            html += `<li>${entry.organization} - ${entry.hours}h - $${(entry.total || 0).toFixed(2)}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (recentMarks.length > 0) {
        html += '<div class="activity-group"><strong>Recent Assessments:</strong><ul>';
        recentMarks.forEach(mark => {
            const student = appData.students?.find(s => s.id === mark.studentId);
            html += `<li>${student?.name || 'Unknown'}: ${mark.score}/${mark.maxScore} (${mark.percentage}%)</li>`;
        });
        html += '</ul></div>';
    }
    
    if (!html) {
        html = '<p style="color: #666; text-align: center;">No recent activity for this month.</p>';
    }
    
    return html;
}

// ============================================================================
// BI-WEEKLY REPORT - SINGLE WORKING VERSION
// ============================================================================

function showBiWeeklyBreakdown() {
    console.log('🎯 BI-WEEKLY REPORT EXECUTING');
    
    const container = document.getElementById('breakdownContainer');
    if (!container) {
        console.error('❌ Container not found');
        return;
    }
    
    // Get current month/year from selectors or use defaults
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');
    const currentMonth = monthSelect ? parseInt(monthSelect.value) : new Date().getMonth();
    const currentYear = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();
    const monthName = monthNames[currentMonth];
    
    // Show immediate visible content
    container.innerHTML = `
        <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 50px; border-radius: 15px; text-align: center; margin-bottom: 30px; box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);">
            <h1 style="margin: 0 0 20px 0; font-size: 3em;">📊</h1>
            <h2 style="margin: 0 0 15px 0; font-size: 2.2em;">BI-WEEKLY BREAKDOWN</h2>
            <p style="margin: 0; font-size: 1.4em; opacity: 0.9;">
                ${monthName} ${currentYear}
            </p>
        </div>
        
        <!-- Quick Stats -->
        <div style="background: #007bff; color: white; padding: 35px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
            <h3 style="margin: 0 0 25px 0; font-size: 1.8em;">📈 Your Data Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                <div>
                    <div style="font-size: 2.5em; font-weight: bold; margin-bottom: 8px;">${(appData.hours || []).length}</div>
                    <div style="font-size: 0.9em;">Hours Entries</div>
                </div>
                <div>
                    <div style="font-size: 2.5em; font-weight: bold; margin-bottom: 8px;">${(appData.students || []).length}</div>
                    <div style="font-size: 0.9em;">Students</div>
                </div>
                <div>
                    <div style="font-size: 2.5em; font-weight: bold; margin-bottom: 8px;">${(appData.marks || []).length}</div>
                    <div style="font-size: 0.9em;">Assessments</div>
                </div>
                <div>
                    <div style="font-size: 2.5em; font-weight: bold; margin-bottom: 8px;">${(appData.attendance || []).length}</div>
                    <div style="font-size: 0.9em;">Sessions</div>
                </div>
            </div>
        </div>
        
        <!-- Bi-Weekly Analysis -->
        <div style="background: #6f42c1; color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; font-size: 1.8em;">📅 Bi-Weekly Analysis</h3>
            <p style="margin: 0 0 25px 0; font-size: 1.2em; line-height: 1.5;">
                Your data is being analyzed across two periods:<br>
                <strong>First Half (1st-15th)</strong> and <strong>Second Half (16th-${new Date(currentYear, currentMonth + 1, 0).getDate()}th)</strong>
            </p>
            <button class="btn" onclick="showDetailedBiWeeklyAnalysis()" style="background: white; color: #6f42c1; border: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 1.1em; cursor: pointer;">
                🔍 Show Detailed Analysis
            </button>
        </div>
        
        <!-- Report Navigation -->
        <div class="button-group" style="margin-top: 30px; text-align: center;">
            <button class="btn btn-secondary" onclick="showWeeklyBreakdown()">📅 Weekly</button>
            <button class="btn btn-primary" onclick="showBiWeeklyBreakdown()">📆 Bi-Weekly</button>
            <button class="btn btn-secondary" onclick="showMonthlyBreakdown()">📈 Monthly</button>
            <button class="btn btn-secondary" onclick="showSubjectBreakdown()">📚 Subject</button>
        </div>
    `;
    
    console.log('✅ Clean bi-weekly content displayed successfully');
}

function showDetailedBiWeeklyAnalysis() {
    console.log('🔍 Showing detailed bi-weekly analysis...');
    
    const container = document.getElementById('breakdownContainer');
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');
    const currentMonth = monthSelect ? parseInt(monthSelect.value) : new Date().getMonth();
    const currentYear = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();
    const monthName = monthNames[currentMonth];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Get and analyze data
    const monthlyHours = (appData.hours || []).filter(entry => {
        if (!entry.date) return false;
        try {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        } catch (e) {
            return false;
        }
    });
    
    // Split into bi-weekly periods
    const firstHalf = monthlyHours.filter(entry => {
        if (!entry.date) return false;
        const day = new Date(entry.date).getDate();
        return day <= 15;
    });
    
    const secondHalf = monthlyHours.filter(entry => {
        if (!entry.date) return false;
        const day = new Date(entry.date).getDate();
        return day > 15;
    });
    
    // Calculate statistics
    const firstHalfStats = calculateBiWeeklyStats(firstHalf);
    const secondHalfStats = calculateBiWeeklyStats(secondHalf);
    
    container.innerHTML = `
        <div style="background: #343a40; color: white; padding: 35px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 2.2em;">📆 ${monthName} ${currentYear}</h2>
            <p style="margin: 0; font-size: 1.2em; opacity: 0.9;">Detailed Bi-Weekly Analysis</p>
        </div>
        
        <!-- Period Comparison -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <!-- First Half -->
            <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 1.6em;">📅 First Half</h3>
                    <div style="opacity: 0.9; font-size: 1.1em;">1st - 15th ${monthName}</div>
                </div>
                
                ${renderBiWeeklyPeriod(firstHalfStats, firstHalf)}
            </div>
            
            <!-- Second Half -->
            <div style="background: linear-gradient(135deg, #28a745, #1e7e34); color: white; padding: 30px; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 1.6em;">📅 Second Half</h3>
                    <div style="opacity: 0.9; font-size: 1.1em;">16th - ${daysInMonth}th ${monthName}</div>
                </div>
                
                ${renderBiWeeklyPeriod(secondHalfStats, secondHalf)}
            </div>
        </div>
        
        <!-- Summary -->
        <div style="background: linear-gradient(135deg, #ffc107, #e0a800); color: #856404; padding: 30px; border-radius: 12px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; text-align: center; font-size: 1.6em;">📈 Monthly Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
                <div>
                    <div style="font-size: 2.2em; font-weight: bold;">${monthlyHours.length}</div>
                    <div style="font-size: 0.9em;">Total Entries</div>
                </div>
                <div>
                    <div style="font-size: 2.2em; font-weight: bold;">${(firstHalfStats.totalHours + secondHalfStats.totalHours).toFixed(1)}h</div>
                    <div style="font-size: 0.9em;">Total Hours</div>
                </div>
                <div>
                    <div style="font-size: 2.2em; font-weight: bold;">$${(firstHalfStats.totalEarnings + secondHalfStats.totalEarnings).toFixed(2)}</div>
                    <div style="font-size: 0.9em;">Total Earnings</div>
                </div>
            </div>
        </div>
        
        <!-- Navigation -->
        <div style="text-align: center;">
            <button class="btn" onclick="showBiWeeklyBreakdown()" style="background: #6c757d; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 1em; cursor: pointer; margin-right: 10px;">
                ← Back to Simple View
            </button>
            <button class="btn" onclick="showMonthlyBreakdown()" style="background: #17a2b8; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 1em; cursor: pointer;">
                📈 Monthly Report
            </button>
        </div>
    `;
}

function calculateBiWeeklyStats(periodData) {
    const totalHours = periodData.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    const totalEarnings = periodData.reduce((sum, entry) => sum + (entry.total || 0), 0);
    const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0;
    
    const subjects = [...new Set(periodData.map(entry => entry.subject).filter(Boolean))];
    const organizations = [...new Set(periodData.map(entry => entry.organization).filter(Boolean))];
    
    return {
        totalHours,
        totalEarnings,
        avgRate,
        entryCount: periodData.length,
        subjects,
        organizations,
        recentEntries: periodData.slice(-3).reverse()
    };
}

function renderBiWeeklyPeriod(stats, data) {
    return `
        <!-- Key Metrics -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.8em; font-weight: bold;">${stats.entryCount}</div>
                <div style="font-size: 0.8em; opacity: 0.9;">Entries</div>
            </div>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.8em; font-weight: bold;">${stats.totalHours.toFixed(1)}h</div>
                <div style="font-size: 0.8em; opacity: 0.9;">Hours</div>
            </div>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.8em; font-weight: bold;">$${stats.totalEarnings.toFixed(2)}</div>
                <div style="font-size: 0.8em; opacity: 0.9;">Earnings</div>
            </div>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.8em; font-weight: bold;">$${stats.avgRate.toFixed(2)}</div>
                <div style="font-size: 0.8em; opacity: 0.9;">Avg Rate</div>
            </div>
        </div>
        
        <!-- Details -->
        <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; text-align: center; font-size: 1.1em;">📋 Activity Details</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <strong>Subjects:</strong><br>
                    <span style="opacity: 0.9;">${stats.subjects.length} unique</span>
                </div>
                <div>
                    <strong>Organizations:</strong><br>
                    <span style="opacity: 0.9;">${stats.organizations.length} unique</span>
                </div>
            </div>
            
            ${stats.subjects.length > 0 ? `
            <div style="margin-bottom: 15px;">
                <strong>Top Subjects:</strong>
                <div style="margin-top: 8px;">
                    ${stats.subjects.slice(0, 3).map(subj => 
                        `<span style="background: rgba(255,255,255,0.3); padding: 4px 10px; border-radius: 15px; font-size: 0.8em; margin: 3px; display: inline-block;">${subj}</span>`
                    ).join('')}
                </div>
            </div>
            ` : ''}
            
            ${data.length > 0 ? `
            <div>
                <strong>Recent Activity:</strong>
                <div style="max-height: 120px; overflow-y: auto; margin-top: 8px;">
                    ${stats.recentEntries.map(entry => 
                        `<div style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.9em;">
                            • ${entry.organization}: ${entry.hours}h ($${entry.total})
                        </div>`
                    ).join('')}
                </div>
            </div>
            ` : '<div style="text-align: center; opacity: 0.7; padding: 15px;">No activity this period</div>'}
        </div>
    `;
}

// ============================================================================
// OTHER REPORT TYPES
// ============================================================================

function showWeeklyBreakdown() {
    console.log('📅 Switching to weekly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (container) {
        container.innerHTML = `
            <div style="background: #007bff; color: white; padding: 40px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; font-size: 2.5em;">📅</h2>
                <h3 style="margin: 0; font-size: 1.8em;">Weekly Breakdown</h3>
                <p style="margin: 15px 0 0 0; font-size: 1.2em; opacity: 0.9;">
                    Viewing weekly data for ${monthNames[currentMonth]} ${currentYear}
                </p>
            </div>
            
            <div style="text-align: center;">
                <button class="btn" onclick="showBiWeeklyBreakdown()" style="background: #28a745; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 1em; cursor: pointer;">
                    📆 Switch to Bi-Weekly
                </button>
            </div>
        `;
    }
}

function showMonthlyBreakdown() {
    console.log('📈 Switching to monthly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    generateMonthlyReport(currentYear, currentMonth);
}

function showSubjectBreakdown() {
    console.log('📚 Switching to subject breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (container) {
        container.innerHTML = `
            <div style="background: #17a2b8; color: white; padding: 40px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; font-size: 2.5em;">📚</h2>
                <h3 style="margin: 0; font-size: 1.8em;">Subject Breakdown</h3>
                <p style="margin: 15px 0 0 0; font-size: 1.2em; opacity: 0.9;">
                    Subject analysis for ${monthNames[currentMonth]} ${currentYear}
                </p>
            </div>
            
            <div style="text-align: center;">
                <button class="btn" onclick="showBiWeeklyBreakdown()" style="background: #6f42c1; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 1em; cursor: pointer;">
                    📆 Switch to Bi-Weekly
                </button>
            </div>
        `;
    }
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
// UTILITY FUNCTIONS
// ============================================================================

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Auto-calculate total pay
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
        
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

// ============================================================================
// GLOBAL FUNCTION EXPORTS
// ============================================================================

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
window.addMark = addMark;
window.saveAttendance = saveAttendance;
window.recordPayment = recordPayment;
window.showWeeklyBreakdown = showWeeklyBreakdown;
window.showMonthlyBreakdown = showMonthlyBreakdown;
window.showBiWeeklyBreakdown = showBiWeeklyBreakdown;
window.showSubjectBreakdown = showSubjectBreakdown;
window.saveDefaultRate = saveDefaultRate;
window.useDefaultRate = useDefaultRate;
window.initializeMonthlyReport = initializeMonthlyReport;
window.onMonthChange = onMonthChange;
window.generateCurrentMonthReport = generateCurrentMonthReport;
window.generateMonthlyReport = generateMonthlyReport;
window.showDetailedBiWeeklyAnalysis = showDetailedBiWeeklyAnalysis;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('⏱️ Initializing hours system...');
    
    loadHoursFromStorage();
    displayHours();
    
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
    
    const dateInput = document.getElementById('workDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    console.log('✅ Hours system initialized');
});

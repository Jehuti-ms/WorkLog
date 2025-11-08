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
let isEditingAttendance = false;

// Month names for reports
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// ============================================================================
// CORE APP FUNCTIONS - MOVED TO TOP
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

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Auto-calculate total pay for hours tracking
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
        
        const dataStatusEl = document.getElementById('dataStatus');
        if (dataStatusEl) {
            dataStatusEl.textContent = `📊 Data: ${totalStudents} Students, ${totalSessions} Sessions`;
        }
        
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

// ============================================================================
// INIT FUNCTION
// ============================================================================

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
// DATA MANAGEMENT
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
// STUDENTS MANAGEMENT
// ============================================================================

function loadStudents() {
    try {
        const container = document.getElementById('studentsContainer');
        if (!container) {
            console.error('❌ Students container not found');
            return;
        }
        
        if (!appData.students || appData.students.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="icon">👨‍🎓</div><h4>No Students</h4><p>No students registered yet.</p></div>';
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
        const container = document.getElementById('studentsContainer');
        if (container) {
            container.innerHTML = '<div class="error-state">Error loading students</div>';
        }
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

        const addButton = document.querySelector('#students .btn-primary');
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
    
    const addButton = document.querySelector('#students .btn-primary');
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
    if (!container) {
        console.error('❌ Hours container not found');
        return;
    }
    
    const entries = window.hoursEntries || [];
    
    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">⏱️</div><h4>No Hours Logged</h4><p>Start tracking your work and earnings!</p></div>';
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
            day: 'numeric',
            timeZone: 'UTC'
        });
    } catch (e) {
        console.error('Error formatting date:', e, 'Date string:', dateString);
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
    
    let displayDate = entry.date || '';
    if (displayDate) {
        const dateObj = new Date(displayDate);
        displayDate = dateObj.toISOString().split('T')[0];
    }
    
    document.getElementById('workDate').value = displayDate;
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
    const totalPayInput = document.getElementById('totalPay');
    if (totalPayInput) {
        totalPayInput.value = (hours * rate).toFixed(2);
    }
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
        saveAllData();
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

// ============================================================================
// DEFAULT RATE MANAGEMENT
// ============================================================================

function loadDefaultRate() {
    const defaultRate = appData.settings.defaultRate || 25.00;
    
    const defaultRateInput = document.getElementById('defaultBaseRate');
    const currentRateDisplay = document.getElementById('currentDefaultRate');
    
    if (defaultRateInput) defaultRateInput.value = defaultRate;
    if (currentRateDisplay) currentRateDisplay.textContent = defaultRate.toFixed(2);
    
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
// GLOBAL FUNCTION EXPORTS
// ============================================================================

// Core App Functions
window.init = init;
window.setupTabs = setupTabs;
window.loadTabData = loadTabData;

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

// Settings Management
window.saveDefaultRate = saveDefaultRate;
window.useDefaultRate = useDefaultRate;

console.log('✅ App.js completely loaded');

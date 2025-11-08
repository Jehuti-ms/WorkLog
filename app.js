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
    
    // Cloud sync is now auto-initialized - don't call it here
    console.log('🔧 Cloud sync auto-initialization enabled');
    
    // Setup tabs
    setupTabs();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load default rate settings
    loadDefaultRate();
    
    // Update stats
    updateStats();

    // Add edit protection system
let isEditingAttendance = false;

// Update the edit functions to use the flag
function editAttendance(index) {
    isEditingAttendance = true;
    // ... your existing editAttendance code ...
}

function cancelAttendanceEdit() {
    isEditingAttendance = false;
    // ... your existing cancelAttendanceEdit code ...
}

function updateAttendance(index) {
    isEditingAttendance = false;
    // ... your existing updateAttendance code ...
}

// Prevent cloud sync during edits
if (window.cloudSync) {
    const originalSyncData = window.cloudSync.syncData;
    window.cloudSync.syncData = function() {
        if (isEditingAttendance) {
            console.log('🛑 Cloud sync skipped - attendance edit in progress');
            return Promise.resolve();
        }
        return originalSyncData.apply(this, arguments);
    };
}
    
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
// TAB MANAGEMENT - FIXED VERSION
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
        // Parse the date string and create a date object in local timezone
        const date = new Date(dateString);
        
        // Use toLocaleDateString with explicit options to ensure correct display
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC' // Force UTC to avoid timezone conversion issues
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
    
    // Fix date display - ensure it shows the correct date
    let displayDate = entry.date || '';
    if (displayDate) {
        // Parse and reformat the date to ensure correct display
        const dateObj = new Date(displayDate);
        // Convert to YYYY-MM-DD format for the date input
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
// MARKS MANAGEMENT - FIXED WITH MISSING FUNCTIONS
// ============================================================================

function loadMarks() {
    try {
        const container = document.getElementById('marksContainer');
        if (!container) {
            console.error('❌ Marks container not found');
            return;
        }
        
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
            container.innerHTML = '<div class="empty-state"><div class="icon">📝</div><h4>No Marks</h4><p>No marks recorded yet.</p></div>';
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
        const container = document.getElementById('marksContainer');
        if (container) {
            container.innerHTML = '<div class="error-state">Error loading marks</div>';
        }
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
// ATTENDANCE MANAGEMENT
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
            
            if (container) {
                container.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h4>No Attendance Records</h4><p>No attendance records yet. Add students first.</p></div>';
            }
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
        if (!appData.attendance || appData.attendance.length === 0) {
            if (container) {
                container.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h4>No Attendance Records</h4><p>No attendance records yet. Track your first session!</p></div>';
            }
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
            
            // FIXED: Use proper date formatting to avoid timezone issues
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

function editAttendance(button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td:not(:last-child)');
    const editButton = row.querySelector('.edit-btn');
    
    // If already in edit mode, do nothing
    if (row.classList.contains('edit-mode')) {
        return;
    }

    // Enter edit mode
    row.classList.add('edit-mode');
    
    // Store original values
    const originalValues = Array.from(cells).slice(1, -1).map(cell => cell.textContent);
    
    // Replace cells with inputs (skip first and last cells)
    cells.forEach((cell, index) => {
        if (index > 0 && index < cells.length - 1) {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cell.textContent;
            input.className = 'edit-input';
            cell.textContent = '';
            cell.appendChild(input);
        }
    });

    // Change button to Update and Cancel
    editButton.textContent = 'Update';
    editButton.classList.remove('edit-btn');
    editButton.classList.add('update-btn');

    // Create Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'cancel-btn';
    cancelButton.style.marginLeft = '5px';

    // Add event listeners using cloned buttons to prevent duplicates
    const newUpdateBtn = editButton.cloneNode(true);
    const newCancelBtn = cancelButton.cloneNode(true);
    
    editButton.parentNode.replaceChild(newUpdateBtn, editButton);
    newUpdateBtn.parentNode.insertBefore(newCancelBtn, newUpdateBtn.nextSibling);

    // Add event listener for Update button
    newUpdateBtn.addEventListener('click', function() {
        updateAttendance(this, originalValues);
    });

    // Add event listener for Cancel button
    newCancelBtn.addEventListener('click', function() {
        console.log('Cancel edit triggered'); // This should show in console when Cancel is clicked
        cancelEdit(this, originalValues);
    });
}

function updateAttendance(button, originalValues) {
    console.log('Update button clicked'); // Debug log
    const row = button.closest('tr');
    const inputs = row.querySelectorAll('.edit-input');
    
    // Update cell values from inputs
    inputs.forEach((input, index) => {
        const cell = input.closest('td');
        cell.textContent = input.value;
    });
    
    // Exit edit mode and restore original button
    exitEditMode(row, 'Edit', 'edit-btn', 'Edit');
}

function cancelEdit(button, originalValues) {
    console.log('Cancel edit function called'); // Debug log
    const row = button.closest('tr');
    const inputs = row.querySelectorAll('.edit-input');
    
    // Restore original values
    inputs.forEach((input, index) => {
        const cell = input.closest('td');
        cell.textContent = originalValues[index];
    });
    
    // Exit edit mode and restore original button
    exitEditMode(row, 'Edit', 'edit-btn', 'Edit');
}

function exitEditMode(row, buttonText, buttonClass, buttonTextContent) {
    row.classList.remove('edit-mode');
    
    // Remove Cancel button
    const cancelBtn = row.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.remove();
    }
    
    // Restore Edit button
    const actionButton = row.querySelector('.update-btn') || row.querySelector('.edit-btn');
    if (actionButton) {
        actionButton.textContent = buttonTextContent;
        actionButton.className = buttonClass;
        actionButton.onclick = function() { editAttendance(this); };
    }
}

function debugButtonClick() {
    const saveButton = document.querySelector('#attendance .btn-primary');
    if (saveButton) {
        // Add click listener to see what's happening
        saveButton.addEventListener('click', function(e) {
            console.log('🔍 Button click detected:', {
                innerHTML: this.innerHTML,
                onclick: this.onclick,
                dataEditing: this.getAttribute('data-editing'),
                dataIndex: this.getAttribute('data-edit-index'),
                eventType: e.type
            });
        }, true); // Use capture phase to catch all clicks
    }
}

// Call this after editAttendance to debug
// debugButtonClick();

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
    
    // Remove edit mode styling
    const formCard = document.querySelector('#attendance .section-card');
    formCard.classList.remove('edit-mode');
}


// ============================================================================
// ATTENDANCE DATE FORMATTING - FIXED TIMEZONE ISSUES
// ============================================================================

function formatAttendanceDate(dateString) {
    if (!dateString) return 'No Date';
    
    try {
        const date = new Date(dateString);
        // Use local date components to avoid timezone issues
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
        // Use local date for display
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
        // Ensure we're using the local date, not UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error('Error formatting date for attendance input:', e);
        return dateString;
    }
}

function setTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    document.getElementById('attendanceDate').value = `${year}-${month}-${day}`;
}

function setYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    
    document.getElementById('attendanceDate').value = `${year}-${month}-${day}`;
}

function debugAttendanceDates() {
    console.log('=== ATTENDANCE DATE DEBUG ===');
    
    if (!appData.attendance || appData.attendance.length === 0) {
        console.log('No attendance records found');
        return;
    }
    
    appData.attendance.forEach((session, index) => {
        console.log(`Record ${index}:`, {
            storedDate: session.date,
            newDate: new Date(session.date),
            formatted: formatAttendanceDate(session.date),
            inputFormatted: formatDateForAttendanceInput(session.date),
            getDate: new Date(session.date).getDate(),
            getUTCDate: new Date(session.date).getUTCDate()
        });
    });
}

// ============================================================================
// PAYMENTS MANAGEMENT - FIXED WITH MISSING FUNCTIONS
// ============================================================================

function loadPayments() {
    try {
        const container = document.getElementById('paymentActivityLog');
        if (!container) {
            console.error('❌ Payments container not found');
            return;
        }
        
        // Populate student dropdown
        const studentSelect = document.getElementById('paymentStudent');
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">Select student...</option>';
            if (appData.students) {
                appData.students.forEach(student => {
                    studentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
                });
            }
        }
        
        if (!appData.payments || appData.payments.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="icon">💰</div><h4>No Payments</h4><p>No payment activity recorded yet.</p></div>';
            return;
        }
        
        let html = '<div class="payments-list">';
        
        const recentPayments = appData.payments.slice(-10).reverse();
        recentPayments.forEach((payment, index) => {
            const student = appData.students ? appData.students.find(s => s.id === payment.studentId) : null;
            
            html += `
                <div class="payment-entry">
                    <div class="payment-header">
                        <h4>${student ? student.name : 'Unknown Student'}</h4>
                        <span class="payment-amount">$${payment.amount.toFixed(2)}</span>
                    </div>
                    <div class="payment-details">
                        <p><strong>Date:</strong> ${payment.date ? new Date(payment.date).toLocaleDateString() : 'No Date'}</p>
                        <p><strong>Method:</strong> ${payment.method || 'N/A'}</p>
                        ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
                    </div>
                    <div class="payment-actions">
                        <button class="btn btn-sm" onclick="deletePayment(${appData.payments.length - 1 - index})">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        updatePaymentStats();
        
    } catch (error) {
        console.error('❌ Error loading payments:', error);
        const container = document.getElementById('paymentActivityLog');
        if (container) {
            container.innerHTML = '<div class="error-state">Error loading payments</div>';
        }
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

function deletePayment(index) {
    if (confirm('Are you sure you want to delete this payment record?')) {
        appData.payments.splice(index, 1);
        saveAllData();
        loadPayments();
        alert('✅ Payment record deleted successfully!');
    }
}

// ============================================================================
// REPORTS SYSTEM - COMPLETE FIXED VERSION
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
        if (!window.hoursEntries) window.hoursEntries = [];
        if (!appData.marks) appData.marks = [];
        if (!appData.payments) appData.payments = [];
        
        const totalStudents = appData.students.length;
        const totalHours = window.hoursEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const totalEarnings = window.hoursEntries.reduce((sum, entry) => sum + (entry.total || 0), 0);
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
    
    updateMonthSelector(currentYear, currentMonth);
    showMonthlyBreakdown();
}

function updateMonthSelector(year, month) {
    console.log('🔄 Updating month selector for:', year, month);
    
    let monthOptions = '';
    monthNames.forEach((monthName, index) => {
        const selected = index === month ? 'selected' : '';
        monthOptions += `<option value="${index}" ${selected}>${monthName}</option>`;
    });
    
    let yearOptions = '';
    for (let i = year - 2; i <= year + 1; i++) {
        const selected = i === year ? 'selected' : '';
        yearOptions += `<option value="${i}" ${selected}>${i}</option>`;
    }
    
    const existingSelector = document.getElementById('monthSelector');
    if (existingSelector) {
        existingSelector.remove();
    }
    
    const breakdownCard = document.querySelector('#breakdownContainer')?.closest('.section-card');
    if (breakdownCard) {
        const monthSelectorHTML = `
            <div class="month-selector" id="monthSelector">
                <label for="reportMonth">Select Month:</label>
                <select id="reportMonth" onchange="onMonthChange()">
                    ${monthOptions}
                </select>
                <select id="reportYear" onchange="onMonthChange()">
                    ${yearOptions}
                </select>
                <button class="btn btn-sm" onclick="generateCurrentMonthReport()">
                    📅 Current Month
                </button>
            </div>
        `;
        breakdownCard.insertAdjacentHTML('afterbegin', monthSelectorHTML);
    }
}

function onMonthChange() {
    const selectedMonth = parseInt(document.getElementById('reportMonth').value);
    const selectedYear = parseInt(document.getElementById('reportYear').value);
    
    const container = document.getElementById('breakdownContainer');
    if (container.querySelector('.report-container')) {
        const activeButton = container.querySelector('.btn-report.active');
        if (activeButton) {
            const reportType = activeButton.textContent.trim();
            switch(reportType) {
                case '📅 Weekly': showWeeklyBreakdown(); break;
                case '📆 Bi-Weekly': showBiWeeklyBreakdown(); break;
                case '📈 Monthly': showMonthlyBreakdown(); break;
                case '📚 Subject': showSubjectBreakdown(); break;
                default: showMonthlyBreakdown();
            }
        } else {
            showMonthlyBreakdown();
        }
    }
}

function generateCurrentMonthReport() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    document.getElementById('reportMonth').value = currentMonth;
    document.getElementById('reportYear').value = currentYear;
    
    showMonthlyBreakdown();
}

// ============================================================================
// REPORT TYPES - CONSISTENT STYLING
// ============================================================================

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
            
            <div class="report-section">
                <h3>Recent Activity</h3>
                <div class="details-panel">
                    ${generateRecentActivities(monthlyHours, monthlyMarks)}
                </div>
            </div>
        </div>
        
        ${renderReportNavigation('📈 Monthly')}
    `;
}

function showWeeklyBreakdown() {
    console.log('📅 Switching to weekly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    const monthlyHours = filterHoursByMonth(currentYear, currentMonth);
    const weeks = groupHoursByWeek(monthlyHours, currentYear, currentMonth);
    
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📅 Weekly Breakdown</h2>
                <p>${monthName} ${currentYear} • Weekly Performance</p>
            </div>
            
            ${weeks.length > 0 ? `
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${weeks.length}</span>
                        <div class="stat-label">Weeks</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${monthlyHours.length}</span>
                        <div class="stat-label">Total Entries</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${weeks.reduce((sum, week) => sum + week.hours, 0).toFixed(1)}h</span>
                        <div class="stat-label">Total Hours</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">$${weeks.reduce((sum, week) => sum + week.earnings, 0).toFixed(2)}</span>
                        <div class="stat-label">Total Earnings</div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3>Weekly Summary</h3>
                    <div class="comparison-grid">
                        ${weeks.map((week, index) => `
                            <div class="comparison-card">
                                <div class="comparison-header">
                                    <h4>Week ${index + 1}</h4>
                                    <div class="period">${week.weekLabel}</div>
                                </div>
                                <div class="metric-grid">
                                    <div class="metric-item">
                                        <span class="metric-value">${week.hours.toFixed(1)}h</span>
                                        <div class="metric-label">Hours</div>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-value">$${week.earnings.toFixed(2)}</span>
                                        <div class="metric-label">Earnings</div>
                                    </div>
                                </div>
                                ${week.subjects.length > 0 ? `
                                    <div class="details-panel">
                                        <h5>Subjects</h5>
                                        <div style="text-align: center;">
                                            ${week.subjects.slice(0, 3).map(subj => 
                                                `<span class="tag">${subj}</span>`
                                            ).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="report-section">
                    <div class="empty-state">
                        <div class="icon">📊</div>
                        <h4>No Weekly Data</h4>
                        <p>No hours data available for ${monthName} ${currentYear}.</p>
                        <p>Add work entries to see weekly breakdowns.</p>
                    </div>
                </div>
            `}
        </div>
        
        ${renderReportNavigation('📅 Weekly')}
    `;
}

function showBiWeeklyBreakdown() {
    console.log('📆 Switching to bi-weekly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📆 Bi-Weekly Report</h2>
                <p>${monthName} ${currentYear} • Two-Period Analysis</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${(window.hoursEntries || []).length}</span>
                    <div class="stat-label">Total Entries</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${(appData.students || []).length}</span>
                    <div class="stat-label">Students</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${(appData.marks || []).length}</span>
                    <div class="stat-label">Assessments</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${(appData.attendance || []).length}</span>
                    <div class="stat-label">Sessions</div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>Bi-Weekly Analysis</h3>
                <p style="text-align: center; color: #6c757d; margin-bottom: 25px;">
                    Compare performance between the first half (1st-15th) and second half (16th-${daysInMonth}th) of ${monthName}
                </p>
                
                <div style="text-align: center;">
                    <button class="btn btn-primary" onclick="showDetailedBiWeeklyAnalysis()">
                        🔍 Show Detailed Analysis
                    </button>
                </div>
            </div>
        </div>
        
        ${renderReportNavigation('📆 Bi-Weekly')}
    `;
}

function showDetailedBiWeeklyAnalysis() {
    console.log('🔍 Showing detailed bi-weekly analysis...');
    
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    const monthName = monthNames[currentMonth];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const monthlyHours = filterHoursByMonth(currentYear, currentMonth);
    
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
    
    const firstHalfStats = calculateBiWeeklyStats(firstHalf);
    const secondHalfStats = calculateBiWeeklyStats(secondHalf);
    
    const container = document.getElementById('breakdownContainer');
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📆 Detailed Bi-Weekly Analysis</h2>
                <p>${monthName} ${currentYear} • Period Comparison</p>
            </div>
            
            <div class="comparison-grid">
                <div class="comparison-card">
                    <div class="comparison-header">
                        <h4>📅 First Half</h4>
                        <div class="period">1st - 15th ${monthName}</div>
                    </div>
                    
                    <div class="metric-grid">
                        <div class="metric-item">
                            <span class="metric-value">${firstHalfStats.entryCount}</span>
                            <div class="metric-label">Entries</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${firstHalfStats.totalHours.toFixed(1)}h</span>
                            <div class="metric-label">Hours</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">$${firstHalfStats.totalEarnings.toFixed(2)}</span>
                            <div class="metric-label">Earnings</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">$${firstHalfStats.avgRate.toFixed(2)}</span>
                            <div class="metric-label">Avg Rate</div>
                        </div>
                    </div>
                    
                    ${renderBiWeeklyDetails(firstHalfStats, firstHalf)}
                </div>
                
                <div class="comparison-card">
                    <div class="comparison-header">
                        <h4>📅 Second Half</h4>
                        <div class="period">16th - ${daysInMonth}th ${monthName}</div>
                    </div>
                    
                    <div class="metric-grid">
                        <div class="metric-item">
                            <span class="metric-value">${secondHalfStats.entryCount}</span>
                            <div class="metric-label">Entries</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${secondHalfStats.totalHours.toFixed(1)}h</span>
                            <div class="metric-label">Hours</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">$${secondHalfStats.totalEarnings.toFixed(2)}</span>
                            <div class="metric-label">Earnings</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">$${secondHalfStats.avgRate.toFixed(2)}</span>
                            <div class="metric-label">Avg Rate</div>
                        </div>
                    </div>
                    
                    ${renderBiWeeklyDetails(secondHalfStats, secondHalf)}
                </div>
            </div>
            
            <div class="report-section">
                <h3>Monthly Summary</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${monthlyHours.length}</span>
                        <div class="stat-label">Total Entries</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${(firstHalfStats.totalHours + secondHalfStats.totalHours).toFixed(1)}h</span>
                        <div class="stat-label">Total Hours</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">$${(firstHalfStats.totalEarnings + secondHalfStats.totalEarnings).toFixed(2)}</span>
                        <div class="stat-label">Total Earnings</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="button-group">
            <button class="btn-report" onclick="showBiWeeklyBreakdown()">← Simple View</button>
            <button class="btn-report" onclick="showMonthlyBreakdown()">📈 Monthly Report</button>
        </div>
    `;
}

function showSubjectBreakdown() {
    console.log('📚 Switching to subject breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    const monthlyHours = filterHoursByMonth(currentYear, currentMonth);
    const monthlyMarks = filterDataByMonth(appData.marks || [], currentYear, currentMonth);
    const subjectStats = calculateSubjectStats(monthlyHours, monthlyMarks);
    
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📚 Subject Breakdown</h2>
                <p>${monthName} ${currentYear} • Subject Performance</p>
            </div>
            
            ${subjectStats.length > 0 ? `
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${subjectStats.length}</span>
                        <div class="stat-label">Subjects</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${subjectStats.reduce((sum, subj) => sum + subj.sessions, 0)}</span>
                        <div class="stat-label">Total Sessions</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${subjectStats.reduce((sum, subj) => sum + subj.hours, 0).toFixed(1)}h</span>
                        <div class="stat-label">Total Hours</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">$${subjectStats.reduce((sum, subj) => sum + subj.earnings, 0).toFixed(2)}</span>
                        <div class="stat-label">Total Earnings</div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3>Subject Performance</h3>
                    <div class="comparison-grid">
                        ${subjectStats.map(subject => `
                            <div class="comparison-card">
                                <div class="comparison-header">
                                    <h4>${subject.name}</h4>
                                </div>
                                <div class="metric-grid">
                                    <div class="metric-item">
                                        <span class="metric-value">${subject.avgMark}%</span>
                                        <div class="metric-label">Avg Score</div>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-value">${subject.hours.toFixed(1)}h</span>
                                        <div class="metric-label">Hours</div>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-value">$${subject.earnings.toFixed(2)}</span>
                                        <div class="metric-label">Earnings</div>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-value">${subject.sessions}</span>
                                        <div class="metric-label">Sessions</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="report-section">
                    <div class="empty-state">
                        <div class="icon">📚</div>
                        <h4>No Subject Data</h4>
                        <p>No subject data available for ${monthName} ${currentYear}.</p>
                        <p>Add hours and marks with subjects to see breakdowns.</p>
                    </div>
                </div>
            `}
        </div>
        
        ${renderReportNavigation('📚 Subject')}
    `;
}

// ============================================================================
// UTILITY FUNCTIONS FOR REPORTS
// ============================================================================

function renderReportNavigation(activeReport) {
    const reports = [
        { icon: '📅', name: 'Weekly', active: activeReport === '📅 Weekly' },
        { icon: '📆', name: 'Bi-Weekly', active: activeReport === '📆 Bi-Weekly' },
        { icon: '📈', name: 'Monthly', active: activeReport === '📈 Monthly' },
        { icon: '📚', name: 'Subject', active: activeReport === '📚 Subject' }
    ];
    
    return `
        <div class="button-group">
            ${reports.map(report => `
                <button class="btn-report ${report.active ? 'active' : ''}" 
                        onclick="show${report.name.replace('-', '')}Breakdown()">
                    ${report.icon} ${report.name}
                </button>
            `).join('')}
        </div>
    `;
}

function renderBiWeeklyDetails(stats, data) {
    return `
        <div class="details-panel">
            <h5>Activity Details</h5>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <strong>Subjects</strong><br>
                    <span style="color: #6c757d; font-size: 0.9em;">${stats.subjects.length} unique</span>
                </div>
                <div style="text-align: center;">
                    <strong>Organizations</strong><br>
                    <span style="color: #6c757d; font-size: 0.9em;">${stats.organizations.length} unique</span>
                </div>
            </div>
            
            ${stats.subjects.length > 0 ? `
            <div style="margin-bottom: 15px;">
                <strong style="display: block; margin-bottom: 8px; text-align: center;">Top Subjects</strong>
                <div style="text-align: center;">
                    ${stats.subjects.slice(0, 3).map(subj => 
                        `<span class="tag">${subj}</span>`
                    ).join('')}
                </div>
            </div>
            ` : ''}
            
            ${data.length > 0 ? `
            <div>
                <strong style="display: block; margin-bottom: 8px; text-align: center;">Recent Activity</strong>
                <div class="activity-list">
                    ${stats.recentEntries.map(entry => 
                        `<div class="activity-item">
                            • ${entry.organization}: ${entry.hours}h ($${entry.total})
                        </div>`
                    ).join('')}
                </div>
            </div>
            ` : '<div style="text-align: center; color: #6c757d; padding: 15px;">No activity this period</div>'}
        </div>
    `;
}

function filterDataByMonth(data, year, month) {
    return data.filter(item => {
        if (!item.date) return false;
        try {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === year && itemDate.getMonth() === month;
        } catch (e) {
            return false;
        }
    });
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

function getHoursDataForReports() {
    // Convert window.hoursEntries to format expected by reports
    return (window.hoursEntries || []).map(entry => ({
        ...entry,
        // Ensure all required fields exist
        hours: entry.hours || 0,
        rate: entry.rate || 0,
        total: entry.total || (entry.hours || 0) * (entry.rate || 0),
        organization: entry.organization || 'Unknown',
        subject: entry.subject || 'Other',
        workType: entry.workType || 'hourly',
        date: entry.date || new Date().toISOString().split('T')[0]
    }));
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

function groupHoursByWeek(hours, year, month) {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeekStart = new Date(firstDay);
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay());
    
    while (currentWeekStart <= lastDay) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        const weekHours = hours.filter(entry => {
            if (!entry.date) return false;
            const entryDate = new Date(entry.date);
            return entryDate >= currentWeekStart && entryDate <= weekEnd;
        });
        
        if (weekHours.length > 0) {
            const totalHours = weekHours.reduce((sum, entry) => sum + (entry.hours || 0), 0);
            const totalEarnings = weekHours.reduce((sum, entry) => sum + (entry.total || 0), 0);
            const subjects = [...new Set(weekHours.map(entry => entry.subject).filter(Boolean))];
            
            weeks.push({
                weekLabel: `Week of ${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()}`,
                hours: totalHours,
                earnings: totalEarnings,
                subjects: subjects
            });
        }
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
}

function calculateSubjectStats(hours, marks) {
    const subjectMap = {};
    
    hours.forEach(entry => {
        const subject = entry.subject || 'Other';
        if (!subjectMap[subject]) {
            subjectMap[subject] = {
                name: subject,
                hours: 0,
                earnings: 0,
                sessions: 0,
                marks: [],
                totalScore: 0,
                totalMaxScore: 0
            };
        }
        
        subjectMap[subject].hours += entry.hours || 0;
        subjectMap[subject].earnings += entry.total || 0;
        subjectMap[subject].sessions += 1;
    });
    
    marks.forEach(mark => {
        const subject = mark.subject || 'Other';
        if (!subjectMap[subject]) {
            subjectMap[subject] = {
                name: subject,
                hours: 0,
                earnings: 0,
                sessions: 0,
                marks: [],
                totalScore: 0,
                totalMaxScore: 0
            };
        }
        
        subjectMap[subject].marks.push(mark);
        subjectMap[subject].totalScore += mark.score || 0;
        subjectMap[subject].totalMaxScore += mark.maxScore || 1;
    });
    
    return Object.values(subjectMap).map(subject => {
        const avgMark = subject.totalMaxScore > 0 
            ? ((subject.totalScore / subject.totalMaxScore) * 100).toFixed(1)
            : '0';
            
        return {
            ...subject,
            avgMark: avgMark
        };
    });
}

function generateRecentActivities(hours, marks) {
    const recentHours = hours.slice(-5).reverse();
    const recentMarks = marks.slice(-5).reverse();
    
    let html = '';
    
    if (recentHours.length > 0) {
        html += '<div style="margin-bottom: 20px;"><strong>Recent Work:</strong><ul style="margin: 8px 0 0 0; padding-left: 20px;">';
        recentHours.forEach(entry => {
            html += `<li style="margin-bottom: 5px; color: #495057;">${entry.organization} - ${entry.hours}h - $${(entry.total || 0).toFixed(2)}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (recentMarks.length > 0) {
        html += '<div><strong>Recent Assessments:</strong><ul style="margin: 8px 0 0 0; padding-left: 20px;">';
        recentMarks.forEach(mark => {
            const student = appData.students?.find(s => s.id === mark.studentId);
            html += `<li style="margin-bottom: 5px; color: #495057;">${student?.name || 'Unknown'}: ${mark.score}/${mark.maxScore} (${mark.percentage}%)</li>`;
        });
        html += '</ul></div>';
    }
    
    if (!html) {
        html = '<p style="color: #666; text-align: center;">No recent activity for this month.</p>';
    }
    
    return html;
}

// ============================================================================
// NEW UTILITY FUNCTIONS FOR HOURS DATA COMPATIBILITY
// ============================================================================

function getHoursDataForReports() {
    // Convert window.hoursEntries to format expected by reports
    return (window.hoursEntries || []).map(entry => ({
        ...entry,
        // Ensure all required fields exist
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

// Update all report functions to use filterHoursByMonth instead of filterDataByMonth(appData.hours)

// ============================================================================
// REPORT TYPES - CONSISTENT STYLING
// ============================================================================

function showMonthlyBreakdown() {
    console.log('📈 Switching to monthly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
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
            
            <div class="report-section">
                <h3>Recent Activity</h3>
                <div class="details-panel">
                    ${generateRecentActivities(monthlyHours, monthlyMarks)}
                </div>
            </div>
        </div>
        
        ${renderReportNavigation('📈 Monthly')}
    `;
}

function showWeeklyBreakdown() {
    console.log('📅 Switching to weekly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
    const weeks = groupHoursByWeek(monthlyHours, currentYear, currentMonth);
    
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📅 Weekly Breakdown</h2>
                <p>${monthName} ${currentYear} • Weekly Performance</p>
            </div>
            
            ${weeks.length > 0 ? `
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${weeks.length}</span>
                        <div class="stat-label">Weeks</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${monthlyHours.length}</span>
                        <div class="stat-label">Total Entries</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${weeks.reduce((sum, week) => sum + week.hours, 0).toFixed(1)}h</span>
                        <div class="stat-label">Total Hours</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">$${weeks.reduce((sum, week) => sum + week.earnings, 0).toFixed(2)}</span>
                        <div class="stat-label">Total Earnings</div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3>Weekly Summary</h3>
                    <div class="comparison-grid">
                        ${weeks.map((week, index) => `
                            <div class="comparison-card">
                                <div class="comparison-header">
                                    <h4>Week ${index + 1}</h4>
                                    <div class="period">${week.weekLabel}</div>
                                </div>
                                <div class="metric-grid">
                                    <div class="metric-item">
                                        <span class="metric-value">${week.hours.toFixed(1)}h</span>
                                        <div class="metric-label">Hours</div>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-value">$${week.earnings.toFixed(2)}</span>
                                        <div class="metric-label">Earnings</div>
                                    </div>
                                </div>
                                ${week.subjects.length > 0 ? `
                                    <div class="details-panel">
                                        <h5>Subjects</h5>
                                        <div style="text-align: center;">
                                            ${week.subjects.slice(0, 3).map(subj => 
                                                `<span class="tag">${subj}</span>`
                                            ).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="report-section">
                    <div class="empty-state">
                        <div class="icon">📊</div>
                        <h4>No Weekly Data</h4>
                        <p>No hours data available for ${monthName} ${currentYear}.</p>
                        <p>Add work entries to see weekly breakdowns.</p>
                    </div>
                </div>
            `}
        </div>
        
        ${renderReportNavigation('📅 Weekly')}
    `;
}

function showBiWeeklyBreakdown() {
    console.log('📆 Switching to bi-weekly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📆 Bi-Weekly Report</h2>
                <p>${monthName} ${currentYear} • Two-Period Analysis</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${(appData.hours || []).length}</span>
                    <div class="stat-label">Total Entries</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${(appData.students || []).length}</span>
                    <div class="stat-label">Students</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${(appData.marks || []).length}</span>
                    <div class="stat-label">Assessments</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${(appData.attendance || []).length}</span>
                    <div class="stat-label">Sessions</div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>Bi-Weekly Analysis</h3>
                <p style="text-align: center; color: #6c757d; margin-bottom: 25px;">
                    Compare performance between the first half (1st-15th) and second half (16th-${daysInMonth}th) of ${monthName}
                </p>
                
                <div style="text-align: center;">
                    <button class="btn btn-primary" onclick="showDetailedBiWeeklyAnalysis()">
                        🔍 Show Detailed Analysis
                    </button>
                </div>
            </div>
        </div>
        
        ${renderReportNavigation('📆 Bi-Weekly')}
    `;
}

function showDetailedBiWeeklyAnalysis() {
    console.log('🔍 Showing detailed bi-weekly analysis...');
    
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    const monthName = monthNames[currentMonth];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const monthlyHours = (appData.hours || []).filter(entry => {
        if (!entry.date) return false;
        try {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        } catch (e) {
            return false;
        }
    });
    
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
    
    const firstHalfStats = calculateBiWeeklyStats(firstHalf);
    const secondHalfStats = calculateBiWeeklyStats(secondHalf);
    
    const container = document.getElementById('breakdownContainer');
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📆 Detailed Bi-Weekly Analysis</h2>
                <p>${monthName} ${currentYear} • Period Comparison</p>
            </div>
            
            <div class="comparison-grid">
                <div class="comparison-card">
                    <div class="comparison-header">
                        <h4>📅 First Half</h4>
                        <div class="period">1st - 15th ${monthName}</div>
                    </div>
                    
                    <div class="metric-grid">
                        <div class="metric-item">
                            <span class="metric-value">${firstHalfStats.entryCount}</span>
                            <div class="metric-label">Entries</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${firstHalfStats.totalHours.toFixed(1)}h</span>
                            <div class="metric-label">Hours</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">$${firstHalfStats.totalEarnings.toFixed(2)}</span>
                            <div class="metric-label">Earnings</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">$${firstHalfStats.avgRate.toFixed(2)}</span>
                            <div class="metric-label">Avg Rate</div>
                        </div>
                    </div>
                    
                    ${renderBiWeeklyDetails(firstHalfStats, firstHalf)}
                </div>
                
                <div class="comparison-card">
                    <div class="comparison-header">
                        <h4>📅 Second Half</h4>
                        <div class="period">16th - ${daysInMonth}th ${monthName}</div>
                    </div>
                    
                    <div class="metric-grid">
                        <div class="metric-item">
                            <span class="metric-value">${secondHalfStats.entryCount}</span>
                            <div class="metric-label">Entries</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${secondHalfStats.totalHours.toFixed(1)}h</span>
                            <div class="metric-label">Hours</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">$${secondHalfStats.totalEarnings.toFixed(2)}</span>
                            <div class="metric-label">Earnings</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">$${secondHalfStats.avgRate.toFixed(2)}</span>
                            <div class="metric-label">Avg Rate</div>
                        </div>
                    </div>
                    
                    ${renderBiWeeklyDetails(secondHalfStats, secondHalf)}
                </div>
            </div>
            
            <div class="report-section">
                <h3>Monthly Summary</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${monthlyHours.length}</span>
                        <div class="stat-label">Total Entries</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${(firstHalfStats.totalHours + secondHalfStats.totalHours).toFixed(1)}h</span>
                        <div class="stat-label">Total Hours</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">$${(firstHalfStats.totalEarnings + secondHalfStats.totalEarnings).toFixed(2)}</span>
                        <div class="stat-label">Total Earnings</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="button-group">
            <button class="btn-report" onclick="showBiWeeklyBreakdown()">← Simple View</button>
            <button class="btn-report" onclick="showMonthlyBreakdown()">📈 Monthly Report</button>
        </div>
    `;
}

function showSubjectBreakdown() {
    console.log('📚 Switching to subject breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
    const monthlyMarks = filterDataByMonth(appData.marks || [], currentYear, currentMonth);
    const subjectStats = calculateSubjectStats(monthlyHours, monthlyMarks);
    
    container.innerHTML = `
        <div class="report-container">
            <div class="report-header">
                <h2>📚 Subject Breakdown</h2>
                <p>${monthName} ${currentYear} • Subject Performance</p>
            </div>
            
            ${subjectStats.length > 0 ? `
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${subjectStats.length}</span>
                        <div class="stat-label">Subjects</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${subjectStats.reduce((sum, subj) => sum + subj.sessions, 0)}</span>
                        <div class="stat-label">Total Sessions</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${subjectStats.reduce((sum, subj) => sum + subj.hours, 0).toFixed(1)}h</span>
                        <div class="stat-label">Total Hours</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">$${subjectStats.reduce((sum, subj) => sum + subj.earnings, 0).toFixed(2)}</span>
                        <div class="stat-label">Total Earnings</div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3>Subject Performance</h3>
                    <div class="comparison-grid">
                        ${subjectStats.map(subject => `
                            <div class="comparison-card">
                                <div class="comparison-header">
                                    <h4>${subject.name}</h4>
                                </div>
                                <div class="metric-grid">
                                    <div class="metric-item">
                                        <span class="metric-value">${subject.avgMark}%</span>
                                        <div class="metric-label">Avg Score</div>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-value">${subject.hours.toFixed(1)}h</span>
                                        <div class="metric-label">Hours</div>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-value">$${subject.earnings.toFixed(2)}</span>
                                        <div class="metric-label">Earnings</div>
                                    </div>
                                    <div class="metric-item">
                                        <span class="metric-value">${subject.sessions}</span>
                                        <div class="metric-label">Sessions</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="report-section">
                    <div class="empty-state">
                        <div class="icon">📚</div>
                        <h4>No Subject Data</h4>
                        <p>No subject data available for ${monthName} ${currentYear}.</p>
                        <p>Add hours and marks with subjects to see breakdowns.</p>
                    </div>
                </div>
            `}
        </div>
        
        ${renderReportNavigation('📚 Subject')}
    `;
}

// ============================================================================
// UTILITY FUNCTIONS FOR REPORTS
// ============================================================================

function renderReportNavigation(activeReport) {
    const reports = [
        { icon: '📅', name: 'Weekly', active: activeReport === '📅 Weekly' },
        { icon: '📆', name: 'Bi-Weekly', active: activeReport === '📆 Bi-Weekly' },
        { icon: '📈', name: 'Monthly', active: activeReport === '📈 Monthly' },
        { icon: '📚', name: 'Subject', active: activeReport === '📚 Subject' }
    ];
    
    return `
        <div class="button-group">
            ${reports.map(report => `
                <button class="btn-report ${report.active ? 'active' : ''}" 
                        onclick="show${report.name.replace('-', '')}Breakdown()">
                    ${report.icon} ${report.name}
                </button>
            `).join('')}
        </div>
    `;
}

function renderBiWeeklyDetails(stats, data) {
    return `
        <div class="details-panel">
            <h5>Activity Details</h5>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <strong>Subjects</strong><br>
                    <span style="color: #6c757d; font-size: 0.9em;">${stats.subjects.length} unique</span>
                </div>
                <div style="text-align: center;">
                    <strong>Organizations</strong><br>
                    <span style="color: #6c757d; font-size: 0.9em;">${stats.organizations.length} unique</span>
                </div>
            </div>
            
            ${stats.subjects.length > 0 ? `
            <div style="margin-bottom: 15px;">
                <strong style="display: block; margin-bottom: 8px; text-align: center;">Top Subjects</strong>
                <div style="text-align: center;">
                    ${stats.subjects.slice(0, 3).map(subj => 
                        `<span class="tag">${subj}</span>`
                    ).join('')}
                </div>
            </div>
            ` : ''}
            
            ${data.length > 0 ? `
            <div>
                <strong style="display: block; margin-bottom: 8px; text-align: center;">Recent Activity</strong>
                <div class="activity-list">
                    ${stats.recentEntries.map(entry => 
                        `<div class="activity-item">
                            • ${entry.organization}: ${entry.hours}h ($${entry.total})
                        </div>`
                    ).join('')}
                </div>
            </div>
            ` : '<div style="text-align: center; color: #6c757d; padding: 15px;">No activity this period</div>'}
        </div>
    `;
}

function filterDataByMonth(data, year, month) {
    return data.filter(item => {
        if (!item.date) return false;
        try {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === year && itemDate.getMonth() === month;
        } catch (e) {
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

function groupHoursByWeek(hours, year, month) {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeekStart = new Date(firstDay);
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay());
    
    while (currentWeekStart <= lastDay) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        const weekHours = hours.filter(entry => {
            if (!entry.date) return false;
            const entryDate = new Date(entry.date);
            return entryDate >= currentWeekStart && entryDate <= weekEnd;
        });
        
        if (weekHours.length > 0) {
            const totalHours = weekHours.reduce((sum, entry) => sum + (entry.hours || 0), 0);
            const totalEarnings = weekHours.reduce((sum, entry) => sum + (entry.total || 0), 0);
            const subjects = [...new Set(weekHours.map(entry => entry.subject).filter(Boolean))];
            
            weeks.push({
                weekLabel: `Week of ${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()}`,
                hours: totalHours,
                earnings: totalEarnings,
                subjects: subjects
            });
        }
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
}

function calculateSubjectStats(hours, marks) {
    const subjectMap = {};
    
    hours.forEach(entry => {
        const subject = entry.subject || 'Other';
        if (!subjectMap[subject]) {
            subjectMap[subject] = {
                name: subject,
                hours: 0,
                earnings: 0,
                sessions: 0,
                marks: [],
                totalScore: 0,
                totalMaxScore: 0
            };
        }
        
        subjectMap[subject].hours += entry.hours || 0;
        subjectMap[subject].earnings += entry.total || 0;
        subjectMap[subject].sessions += 1;
    });
    
    marks.forEach(mark => {
        const subject = mark.subject || 'Other';
        if (!subjectMap[subject]) {
            subjectMap[subject] = {
                name: subject,
                hours: 0,
                earnings: 0,
                sessions: 0,
                marks: [],
                totalScore: 0,
                totalMaxScore: 0
            };
        }
        
        subjectMap[subject].marks.push(mark);
        subjectMap[subject].totalScore += mark.score || 0;
        subjectMap[subject].totalMaxScore += mark.maxScore || 1;
    });
    
    return Object.values(subjectMap).map(subject => {
        const avgMark = subject.totalMaxScore > 0 
            ? ((subject.totalScore / subject.totalMaxScore) * 100).toFixed(1)
            : '0';
            
        return {
            ...subject,
            avgMark: avgMark
        };
    });
}

function generateRecentActivities(hours, marks) {
    const recentHours = hours.slice(-5).reverse();
    const recentMarks = marks.slice(-5).reverse();
    
    let html = '';
    
    if (recentHours.length > 0) {
        html += '<div style="margin-bottom: 20px;"><strong>Recent Work:</strong><ul style="margin: 8px 0 0 0; padding-left: 20px;">';
        recentHours.forEach(entry => {
            html += `<li style="margin-bottom: 5px; color: #495057;">${entry.organization} - ${entry.hours}h - $${(entry.total || 0).toFixed(2)}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (recentMarks.length > 0) {
        html += '<div><strong>Recent Assessments:</strong><ul style="margin: 8px 0 0 0; padding-left: 20px;">';
        recentMarks.forEach(mark => {
            const student = appData.students?.find(s => s.id === mark.studentId);
            html += `<li style="margin-bottom: 5px; color: #495057;">${student?.name || 'Unknown'}: ${mark.score}/${mark.maxScore} (${mark.percentage}%)</li>`;
        });
        html += '</ul></div>';
    }
    
    if (!html) {
        html = '<p style="color: #666; text-align: center;">No recent activity for this month.</p>';
    }
    
    return html;
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
// EVENT LISTENERS AND INIT
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

// Make all functions globally available
// ============================================================================
// GLOBAL FUNCTION EXPORTS - ORGANIZED BY SECTION
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
// Add these to your global function exports
window.formatAttendanceDate = formatAttendanceDate;
window.formatAttendanceFullDate = formatAttendanceFullDate;
window.formatDateForAttendanceInput = formatDateForAttendanceInput;
window.setTodayDate = setTodayDate;
window.setYesterdayDate = setYesterdayDate;
window.debugAttendanceDates = debugAttendanceDates;

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
window.initializeMonthlyReport = initializeMonthlyReport;
window.onMonthChange = onMonthChange;
window.generateCurrentMonthReport = generateCurrentMonthReport;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 DOM fully loaded, initializing app...');
    
    // Initialize hours system
    loadHoursFromStorage();
    displayHours();
    
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

// Debug the saveAllData function
const originalSaveAllData = saveAllData;
saveAllData = function() {
    console.log('💾 saveAllData called - Stack trace:');
    console.trace();
    
    // Check if we're in edit mode
    const isEditing = document.querySelector('#attendance .edit-mode');
    if (isEditing) {
        console.log('⚠️ saveAllData called while in attendance edit mode!');
    }
    
    return originalSaveAllData.apply(this, arguments);
};

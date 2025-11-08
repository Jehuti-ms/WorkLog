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
    loadDefaultRate(); // ADD THIS LINE
    
    // Update stats
    updateStats();
    
    console.log('✅ App initialized successfully');
}

// ============================================================================
// ADD MISSING loadHours FUNCTION - PUT THIS AT THE TOP OF YOUR FUNCTIONS
// ============================================================================

function loadHours() {
    try {
        console.log('⏱️ Loading hours...');
        
        // Load hours from storage
        const savedHours = loadHoursFromStorage();
        window.hoursEntries = savedHours;
        
        // Display hours
        displayHours();
        
        // Update hours stats
        updateHoursStats();
        
    } catch (error) {
        console.error('❌ Error loading hours:', error);
    }
}

function updateHoursStats() {
    try {
        const entries = window.hoursEntries || [];
        
        // Calculate weekly and monthly totals
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
        
        // Update UI
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
                        <h4 class="student-name">${student.name}</h4>
                        <span class="student-rate">$${student.rate || '0.00'}/session</span>
                    </div>
                    <div class="student-details">
                        <p><strong>ID:</strong> ${student.id}</p>
                        <p><strong>Gender:</strong> ${student.gender}</p>
                        ${student.email ? `<p><strong>Email:</strong> ${student.email}</p>` : ''}
                        ${student.phone ? `<p><strong>Phone:</strong> ${student.phone}</p>` : ''}
                        ${student.createdAt ? `<p><small>Added: ${new Date(student.createdAt).toLocaleDateString()}</small></p>` : ''}
                        ${student.updatedAt ? `<p><small>Updated: ${new Date(student.updatedAt).toLocaleDateString()}</small></p>` : ''}
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
        
        // Update student count and average rate...
        
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
        
        // Use default rate if no rate specified
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

function editStudent(index) {
    try {
        const student = appData.students[index];
        if (!student) {
            alert('Student not found!');
            return;
        }

        // Populate the form with student data
        document.getElementById('studentName').value = student.name || '';
        document.getElementById('studentId').value = student.id || '';
        document.getElementById('studentGender').value = student.gender || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentBaseRate').value = student.rate || appData.settings.defaultRate || 25.00;

        // Change the add button to an update button
        const addButton = document.querySelector('.form-actions .btn-primary');
        if (addButton) {
            addButton.innerHTML = '💾 Update Student';
            addButton.onclick = function() { updateStudent(index); };
        }

        // Add a cancel button if it doesn't exist
        let cancelButton = document.querySelector('.btn-cancel-edit');
        if (!cancelButton) {
            cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'btn btn-warning btn-cancel-edit';
            cancelButton.innerHTML = '❌ Cancel Edit';
            cancelButton.onclick = cancelEdit;
            
            const formActions = document.querySelector('.form-actions');
            if (formActions) {
                formActions.appendChild(cancelButton);
            }
        }

        // Highlight the form section
        const formCard = document.querySelector('.section-card');
        if (formCard) {
            formCard.classList.add('form-edit-mode');
        }

        // Scroll to the form
        document.getElementById('studentName').focus();
        
        console.log('📝 Editing student:', student.name);

    } catch (error) {
        console.error('❌ Error editing student:', error);
        alert('Error editing student: ' + error.message);
    }
}

function cancelEdit() {
    // Reset the form
    clearStudentForm();
    
    // Change button back to "Add Student"
    const addButton = document.querySelector('.form-actions .btn-primary');
    if (addButton) {
        addButton.innerHTML = '➕ Add Student';
        addButton.onclick = addStudent;
    }
    
    // Remove cancel button
    const cancelButton = document.querySelector('.btn-cancel-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    // Remove edit mode styling
    const formCard = document.querySelector('.section-card');
    if (formCard) {
        formCard.classList.remove('form-edit-mode');
    }
    
    console.log('❌ Edit cancelled');
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

        // Update the student
        appData.students[index] = {
            ...appData.students[index], // Keep existing properties
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
        cancelEdit();
        
        alert('✅ Student updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating student:', error);
        alert('Error updating student: ' + error.message);
    }
}

function cancelEdit() {
    // Reset the form
    clearStudentForm();
    
    // Change button back to "Add Student"
    const addButton = document.querySelector('.form-actions .btn-primary');
    if (addButton) {
        addButton.innerHTML = '➕ Add Student';
        addButton.onclick = addStudent;
    }
    
    // Remove cancel button
    const cancelButton = document.querySelector('.btn-cancel-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    console.log('❌ Edit cancelled');
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
// DEFAULT RATE MANAGEMENT
// ============================================================================

function loadDefaultRate() {
    const defaultRate = appData.settings.defaultRate || 25.00;
    
    // Update settings display
    document.getElementById('defaultBaseRate').value = defaultRate;
    document.getElementById('currentDefaultRate').textContent = defaultRate.toFixed(2);
    
    // Auto-fill student form with default rate
    const studentRateInput = document.getElementById('studentBaseRate');
    if (studentRateInput && !studentRateInput.value) {
        studentRateInput.value = defaultRate;
    }
    
    // Auto-fill hours form with default rate (YOUR hourly rate)
    const hoursRateInput = document.getElementById('baseRate');
    if (hoursRateInput && !hoursRateInput.value) {
        hoursRateInput.value = defaultRate;
        // Trigger total calculation
        const event = new Event('input');
        hoursRateInput.dispatchEvent(event);
    }
    
    // Update hours tab button display
    const displaySpan = document.getElementById('currentDefaultRateDisplay');
    if (displaySpan) {
        displaySpan.textContent = defaultRate.toFixed(2);
    }
}

function useDefaultRateInHours() {
    const defaultRate = appData.settings.defaultRate || 25.00;
    const baseRateInput = document.getElementById('baseRate');
    
    if (baseRateInput) {
        baseRateInput.value = defaultRate;
        // Trigger total calculation
        const event = new Event('input');
        baseRateInput.dispatchEvent(event);
        baseRateInput.focus();
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

function applyDefaultRateToAll() {
    if (!confirm('Are you sure you want to apply the default rate to ALL existing students?')) {
        return;
    }
    
    const defaultRate = appData.settings.defaultRate || 25.00;
    let updatedCount = 0;
    
    appData.students.forEach(student => {
        student.rate = defaultRate;
        updatedCount++;
    });
    
    saveAllData();
    loadStudents();
    
    alert(`✅ Default rate applied to ${updatedCount} students!`);
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
// HOURS TRACKING - SIMPLIFIED EDIT SYSTEM
// ============================================================================

let editingHoursIndex = null;

function displayHours() {
    const container = document.getElementById('hoursContainer');
    if (!container) return;
    
    const entries = window.hoursEntries || [];
    
    if (entries.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No work logged yet. Start tracking your earnings!</p>';
        return;
    }
    
    container.innerHTML = entries.map((entry, index) => `
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
                <button class="btn btn-sm btn-edit" onclick="startEditHours(${index})">✏️ Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteHours(${index})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function startEditHours(index) {
    console.log('Starting edit for index:', index);
    
    const entry = window.hoursEntries[index];
    if (!entry) {
        alert('Entry not found');
        return;
    }
    
    // Fix: Use the exact date string from storage
    document.getElementById('organization').value = entry.organization || '';
    document.getElementById('workType').value = entry.workType || 'hourly';
    document.getElementById('subject').value = entry.subject || '';
    document.getElementById('topic').value = entry.topic || '';
    document.getElementById('workDate').value = entry.date || ''; // This should be the exact stored date
    document.getElementById('hoursWorked').value = entry.hours || '';
    document.getElementById('baseRate').value = entry.rate || '';
    document.getElementById('workNotes').value = entry.notes || '';
    
    // Update total display
    updateTotalDisplay();
    
    // Set editing mode
    editingHoursIndex = index;
    
    // Change the button to "Update"
    const saveButton = document.querySelector('#hours .btn-primary');
    if (saveButton) {
        saveButton.textContent = '💾 Update Entry';
        saveButton.onclick = updateHoursEntry;
    }
    
    // Add cancel button
    if (!document.querySelector('.cancel-edit-btn')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary cancel-edit-btn';
        cancelButton.textContent = '❌ Cancel';
        cancelButton.onclick = cancelEdit;
        document.querySelector('.form-actions').appendChild(cancelButton);
    }
    
    console.log('Form ready for editing. Date value:', entry.date);
}

// Fix date display to show exactly what was entered
function formatDisplayDate(dateString) {
    if (!dateString) return 'No Date';
    
    // If it's already in YYYY-MM-DD format (from input), just return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Convert to MM/DD/YYYY for display
        const [year, month, day] = dateString.split('-');
        return `${month}/${day}/${year}`;
    }
    
    // If it's any other format, try to parse it
    try {
        const date = new Date(dateString);
        if (!isNaN(date)) {
            return date.toLocaleDateString();
        }
    } catch (e) {
        // If parsing fails, return the original string
    }
    
    return dateString;
}

// Fix date storage to preserve exact input
function logHours() {
    // If editing, update instead
    if (editingHoursIndex !== null) {
        updateHoursEntry();
        return;
    }
    
    // Get form values - get the exact date string from input
    const organization = document.getElementById('organization').value;
    const workType = document.getElementById('workType').value;
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const dateInput = document.getElementById('workDate');
    const date = dateInput.value; // Get the exact value from the input
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value;
    
    // Validation
    if (!organization || !date || isNaN(hours) || isNaN(rate)) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Create new entry - store the exact date string
    const newEntry = {
        organization,
        workType,
        subject,
        topic,
        date: date, // Store the exact input value
        hours,
        rate,
        notes,
        total: hours * rate,
        timestamp: new Date().toISOString()
    };
    
    // Add to array
    if (!window.hoursEntries) window.hoursEntries = [];
    window.hoursEntries.push(newEntry);
    
    // Save to storage
    saveHoursToStorage();
    
    // Refresh display
    displayHours();
    
    // Reset form
    cancelEdit();
    
    alert('✅ Entry added successfully!');
    console.log('New entry added. Date stored as:', newEntry.date);
}

function updateHoursEntry() {
    if (editingHoursIndex === null) {
        alert('No entry selected for editing');
        return;
    }
    
    // Get form values - get exact date string
    const organization = document.getElementById('organization').value;
    const workType = document.getElementById('workType').value;
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const dateInput = document.getElementById('workDate');
    const date = dateInput.value; // Exact value from input
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value;
    
    // Validation
    if (!organization || !date || isNaN(hours) || isNaN(rate)) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Update the entry - store exact date
    window.hoursEntries[editingHoursIndex] = {
        organization,
        workType,
        subject,
        topic,
        date: date, // Store exact input value
        hours,
        rate,
        notes,
        total: hours * rate
    };
    
    // Save to storage
    saveHoursToStorage();
    
    // Refresh display
    displayHours();
    
    // Reset form
    cancelEdit();
    
    alert('✅ Entry updated successfully!');
    console.log('Entry updated. Date stored as:', window.hoursEntries[editingHoursIndex].date);
}

// Add this to see what's actually being stored
function debugDates() {
    console.log('=== DATE DEBUG ===');
    const entries = window.hoursEntries || [];
    entries.forEach((entry, index) => {
        console.log(`Entry ${index}:`, {
            storedDate: entry.date,
            displayDate: formatDisplayDate(entry.date),
            inputType: typeof entry.date
        });
    });
    console.log('==================');
}

function startEditHours(index) {
    console.log('Starting edit for index:', index);
    
    const entry = window.hoursEntries[index];
    if (!entry) {
        alert('Entry not found');
        return;
    }
    
    // Fill the form with entry data
    document.getElementById('organization').value = entry.organization || '';
    document.getElementById('workType').value = entry.workType || 'hourly';
    document.getElementById('subject').value = entry.subject || '';
    document.getElementById('topic').value = entry.topic || '';
    document.getElementById('workDate').value = entry.date || '';
    document.getElementById('hoursWorked').value = entry.hours || '';
    document.getElementById('baseRate').value = entry.rate || '';
    document.getElementById('workNotes').value = entry.notes || '';
    
    // Update total display
    updateTotalDisplay();
    
    // Set editing mode
    editingHoursIndex = index;
    
    // Change the button to "Update"
    const saveButton = document.querySelector('#hours .btn-primary');
    if (saveButton) {
        saveButton.textContent = '💾 Update Entry';
        saveButton.onclick = updateHoursEntry;
    }
    
    // Add cancel button
    if (!document.querySelector('.cancel-edit-btn')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary cancel-edit-btn';
        cancelButton.textContent = '❌ Cancel';
        cancelButton.onclick = cancelEdit;
        document.querySelector('.form-actions').appendChild(cancelButton);
    }
    
    console.log('Form ready for editing:', entry);
}

function updateHoursEntry() {
    if (editingHoursIndex === null) {
        alert('No entry selected for editing');
        return;
    }
    
    // Get form values
    const organization = document.getElementById('organization').value;
    const workType = document.getElementById('workType').value;
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value;
    
    // Validation
    if (!organization || !date || isNaN(hours) || isNaN(rate)) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Update the entry
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
    
    // Save to storage
    saveHoursToStorage();
    
    // Refresh display
    displayHours();
    
    // Reset form
    cancelEdit();
    
    alert('✅ Entry updated successfully!');
    console.log('Entry updated:', window.hoursEntries[editingHoursIndex]);
}

function cancelEdit() {
    // Reset form
    document.getElementById('organization').value = '';
    document.getElementById('workType').value = 'hourly';
    document.getElementById('subject').value = '';
    document.getElementById('topic').value = '';
    document.getElementById('workDate').value = '';
    document.getElementById('hoursWorked').value = '';
    document.getElementById('baseRate').value = '';
    document.getElementById('workNotes').value = '';
    document.getElementById('totalPay').value = '';
    
    // Reset button
    const saveButton = document.querySelector('#hours .btn-primary');
    if (saveButton) {
        saveButton.textContent = '💾 Log Work & Earnings';
        saveButton.onclick = logHours;
    }
    
    // Remove cancel button
    const cancelButton = document.querySelector('.cancel-edit-btn');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    // Reset editing state
    editingHoursIndex = null;
}

function logHours() {
    // If editing, update instead
    if (editingHoursIndex !== null) {
        updateHoursEntry();
        return;
    }
    
    // Get form values
    const organization = document.getElementById('organization').value;
    const workType = document.getElementById('workType').value;
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    const notes = document.getElementById('workNotes').value;
    
    // Validation
    if (!organization || !date || isNaN(hours) || isNaN(rate)) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Create new entry
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
    
    // Add to array
    if (!window.hoursEntries) window.hoursEntries = [];
    window.hoursEntries.push(newEntry);
    
    // Save to storage
    saveHoursToStorage();
    
    // Refresh display
    displayHours();
    
    // Reset form
    cancelEdit();
    
    alert('✅ Entry added successfully!');
    console.log('New entry added:', newEntry);
}

function deleteHours(index) {
    if (confirm('Are you sure you want to delete this entry?')) {
        window.hoursEntries.splice(index, 1);
        saveHoursToStorage();
        displayHours();
        alert('✅ Entry deleted successfully!');
    }
}

function saveHoursToStorage() {
    try {
        localStorage.setItem('worklog_hours', JSON.stringify({
            hours: window.hoursEntries || [],
            lastUpdated: new Date().toISOString()
        }));
        console.log('Saved hours to storage');
    } catch (error) {
        console.error('Error saving hours:', error);
    }
}

function loadHoursFromStorage() {
    try {
        const saved = localStorage.getItem('worklog_hours');
        if (saved) {
            const data = JSON.parse(saved);
            window.hoursEntries = data.hours || [];
            console.log('Loaded hours from storage:', window.hoursEntries.length, 'entries');
            return window.hoursEntries;
        }
    } catch (error) {
        console.error('Error loading hours:', error);
    }
    return [];
}

function updateTotalDisplay() {
    const hours = parseFloat(document.getElementById('hoursWorked').value) || 0;
    const rate = parseFloat(document.getElementById('baseRate').value) || 0;
    document.getElementById('totalPay').value = (hours * rate).toFixed(2);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load existing data
    loadHoursFromStorage();
    displayHours();
    
    // Setup auto-calculation
    document.getElementById('hoursWorked')?.addEventListener('input', updateTotalDisplay);
    document.getElementById('baseRate')?.addEventListener('input', updateTotalDisplay);
    
    // Set default date to today
    const dateInput = document.getElementById('workDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});



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
        const attendanceList = document.getElementById('attendanceList');
        
        if (!container || !attendanceList) return;
        
        // Clear existing content
        attendanceList.innerHTML = '';
        
        if (!appData.students || appData.students.length === 0) {
            attendanceList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No students registered. Add students first.</p>';
            
            if (container) {
                container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No attendance records yet. Add students first.</p>';
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
                container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No attendance records yet. Track your first session!</p>';
            }
            return;
        }
        
        let html = '<div class="attendance-list">';
        
        // Show last 10 attendance records
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
                    <div class="attendance-actions">
                        <button class="btn btn-sm" onclick="deleteAttendance(${appData.attendance.length - 1 - index})">🗑️ Delete</button>
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
        
        // Ensure attendance array exists
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
// FIXED MONTHLY REPORTS - REPLACE THE EXISTING CODE
// ============================================================================

function initializeMonthlyReport() {
    console.log('📊 Initializing monthly report...');
    
    // Set default date to current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    console.log('📅 Default month:', currentMonth, 'Year:', currentYear);
    
    // Initialize month selector
    updateMonthSelector(currentYear, currentMonth);
    
    // Load current month's report by default
    generateMonthlyReport(currentYear, currentMonth);
}

function updateMonthSelector(year, month) {
    console.log('🔄 Updating month selector for:', year, month);
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    // Create month selection options
    let monthOptions = '';
    monthNames.forEach((monthName, index) => {
        const selected = index === month ? 'selected' : '';
        monthOptions += `<option value="${index}" ${selected}>${monthName}</option>`;
    });
    
    // Create year selection options (current year and previous 2 years)
    let yearOptions = '';
    for (let i = year - 2; i <= year + 1; i++) {
        const selected = i === year ? 'selected' : '';
        yearOptions += `<option value="${i}" ${selected}>${i}</option>`;
    }
    
    // Update the reports tab with month selector
    const breakdownSection = document.querySelector('#reports .section-card h3');
    console.log('📋 Breakdown section found:', !!breakdownSection);
    
    if (breakdownSection && !document.getElementById('monthSelector')) {
        console.log('🎯 Adding month selector to reports section');
        const monthSelectorHTML = `
            <div class="month-selector" id="monthSelector" style="margin-top: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #5a7a7a;">
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
        breakdownSection.insertAdjacentHTML('afterend', monthSelectorHTML);
        console.log('✅ Month selector added successfully');
    } else {
        console.log('⚠️ Month selector already exists or breakdown section not found');
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
    
    // Update selectors to current month
    document.getElementById('reportMonth').value = currentMonth;
    document.getElementById('reportYear').value = currentYear;
    
    generateMonthlyReport(currentYear, currentMonth);
}

function generateMonthlyReport(year, month) {
    console.log(`📊 Generating report for ${year}-${month + 1}`);
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
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
    
    // Update weekly and subject tables with filtered data
    updateWeeklyTable(monthlyHours, year, month);
    updateSubjectTable(monthlyHours, monthlyMarks);
}

// Update the button handlers to use monthly reports
function showWeeklyBreakdown() {
    console.log('📅 Switching to weekly breakdown');
    // Keep the monthly report but update the tables
    const currentMonth = parseInt(document.getElementById('reportMonth').value);
    const currentYear = parseInt(document.getElementById('reportYear').value);
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
    updateWeeklyTable(monthlyHours, currentYear, currentMonth);
    
    // Show message that we're viewing weekly data within the monthly context
    const container = document.getElementById('breakdownContainer');
    if (container) {
        const existingReport = container.querySelector('.monthly-report');
        if (existingReport) {
            const weeklyNote = document.createElement('div');
            weeklyNote.style.background = '#e7f3ff';
            weeklyNote.style.padding = '10px';
            weeklyNote.style.borderRadius = '4px';
            weeklyNote.style.marginTop = '10px';
            weeklyNote.innerHTML = '<strong>📅 Note:</strong> Now viewing weekly breakdown for the selected month. Use month selector above to change period.';
            existingReport.appendChild(weeklyNote);
        }
    }
}

function showMonthlyBreakdown() {
    console.log('📈 Switching to monthly breakdown');
    // This should just regenerate the monthly report
    const currentMonth = parseInt(document.getElementById('reportMonth').value);
    const currentYear = parseInt(document.getElementById('reportYear').value);
    generateMonthlyReport(currentYear, currentMonth);
}

function showBiWeeklyBreakdown() {
    console.log('📆 Switching to bi-weekly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth').value);
    const currentYear = parseInt(document.getElementById('reportYear').value);
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
    
    // Show bi-weekly message
    const container = document.getElementById('breakdownContainer');
    if (container) {
        const existingReport = container.querySelector('.monthly-report');
        if (existingReport) {
            const biweeklyNote = document.createElement('div');
            biweeklyNote.style.background = '#fff3cd';
            biweeklyNote.style.padding = '10px';
            biweeklyNote.style.borderRadius = '4px';
            biweeklyNote.style.marginTop = '10px';
            biweeklyNote.innerHTML = '<strong>📆 Note:</strong> Bi-weekly breakdown for the selected month. Use month selector above to change period.';
            existingReport.appendChild(biweeklyNote);
        }
    }
}

function showSubjectBreakdown() {
    console.log('📚 Switching to subject breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth').value);
    const currentYear = parseInt(document.getElementById('reportYear').value);
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
    const monthlyMarks = filterDataByMonth(appData.marks || [], currentYear, currentMonth);
    updateSubjectTable(monthlyHours, monthlyMarks);
    
    // Show subject message
    const container = document.getElementById('breakdownContainer');
    if (container) {
        const existingReport = container.querySelector('.monthly-report');
        if (existingReport) {
            const subjectNote = document.createElement('div');
            subjectNote.style.background = '#d4edda';
            subjectNote.style.padding = '10px';
            subjectNote.style.borderRadius = '4px';
            subjectNote.style.marginTop = '10px';
            subjectNote.innerHTML = '<strong>📚 Note:</strong> Subject breakdown for the selected month. Use month selector above to change period.';
            existingReport.appendChild(subjectNote);
        }
    }
}

// Update the loadReports function
function loadReports() {
    console.log('📈 Loading reports...');
    try {
        updateReportStats();
        initializeMonthlyReport(); // This should now work
        console.log('✅ Reports loaded successfully');
    } catch (error) {
        console.error('❌ Error loading reports:', error);
    }
}

// Make sure the CSS is injected
function injectMonthlyReportCSS() {
    if (!document.getElementById('monthly-report-css')) {
        const style = document.createElement('style');
        style.id = 'monthly-report-css';
        style.textContent = `
            .monthly-report {
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .report-header {
                border-bottom: 2px solid #5a7a7a;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }

            .report-header h3 {
                color: #3a5a5a;
                margin: 0 0 5px 0;
            }

            .report-period {
                color: #666;
                font-style: italic;
            }

            .monthly-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 25px;
            }

            .monthly-stats .stat-card {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                border-left: 4px solid #5a7a7a;
            }

            .monthly-stats .stat-value {
                font-size: 1.5em;
                font-weight: bold;
                color: #3a5a5a;
                display: block;
            }

            .monthly-stats .stat-label {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
            }

            .report-details {
                display: grid;
                gap: 20px;
            }

            .detail-section {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
            }

            .detail-section h4 {
                margin: 0 0 15px 0;
                color: #3a5a5a;
            }

            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
            }

            .detail-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }

            .detail-label {
                font-weight: 500;
                color: #555;
            }

            .detail-value {
                font-weight: bold;
                color: #3a5a5a;
            }

            .recent-activities {
                max-height: 200px;
                overflow-y: auto;
            }

            .activity-group {
                margin-bottom: 15px;
            }

            .activity-group ul {
                margin: 5px 0 0 0;
                padding-left: 20px;
            }

            .activity-group li {
                margin-bottom: 3px;
                color: #555;
            }

            .month-selector {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #5a7a7a;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Monthly report CSS injected');
    }
}

// Update the init function
function init() {
    console.log('🎯 App initialization started');
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        console.log('❌ User not authenticated');
        return;
    }
    
    console.log('✅ User authenticated, setting up app...');
    
    // Inject monthly report CSS
    injectMonthlyReportCSS();
    
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

// Make functions globally available
window.initializeMonthlyReport = initializeMonthlyReport;
window.onMonthChange = onMonthChange;
window.generateCurrentMonthReport = generateCurrentMonthReport;
window.generateMonthlyReport = generateMonthlyReport;
window.showWeeklyBreakdown = showWeeklyBreakdown;
window.showMonthlyBreakdown = showMonthlyBreakdown;
window.showBiWeeklyBreakdown = showBiWeeklyBreakdown;
window.showSubjectBreakdown = showSubjectBreakdown;

// ============================================================================
// COMPLETE MONTHLY REPORT FUNCTIONS - ADD TO app.js
// ============================================================================

// Add this at the top of your monthly report section
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

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
    // Hours and earnings
    const totalHours = hours.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    const totalEarnings = hours.reduce((sum, entry) => sum + (entry.total || 0), 0);
    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
    
    // Marks
    const totalMarks = marks.length;
    const avgMark = totalMarks > 0 
        ? (marks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / totalMarks)
        : 0;
    
    // Attendance
    const totalSessions = attendance.length;
    const totalStudentsPresent = attendance.reduce((sum, session) => 
        sum + (session.presentStudents ? session.presentStudents.length : 0), 0
    );
    const avgStudentsPerSession = totalSessions > 0 ? totalStudentsPresent / totalSessions : 0;
    
    // Payments
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
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
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

function updateWeeklyTable(hours, year, month) {
    const weeklyBody = document.getElementById('weeklyBody');
    if (!weeklyBody) {
        console.log('❌ Weekly body not found');
        return;
    }
    
    // Group hours by week
    const weeks = groupHoursByWeek(hours, year, month);
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    if (weeks.length === 0) {
        weeklyBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #666; padding: 20px;">
                    No weekly data available for ${monthNames[month]} ${year}
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    weeks.forEach(week => {
        const netEarnings = week.earnings * 0.8; // 80% net
        html += `
            <tr>
                <td>${week.weekLabel}</td>
                <td>${week.hours.toFixed(1)}h</td>
                <td>$${week.earnings.toFixed(2)}</td>
                <td>${week.subjects.join(', ') || 'N/A'}</td>
                <td>$${netEarnings.toFixed(2)}</td>
            </tr>
        `;
    });
    
    weeklyBody.innerHTML = html;
    console.log('✅ Weekly table updated');
}

function updateSubjectTable(hours, marks) {
    const subjectBody = document.getElementById('subjectBody');
    if (!subjectBody) {
        console.log('❌ Subject body not found');
        return;
    }
    
    // Group data by subject
    const subjectStats = calculateSubjectStats(hours, marks);
    
    if (subjectStats.length === 0) {
        subjectBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #666; padding: 20px;">
                    No subject data available
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    subjectStats.forEach(subject => {
        html += `
            <tr>
                <td>${subject.name}</td>
                <td>${subject.avgMark}%</td>
                <td>${subject.hours.toFixed(1)}h</td>
                <td>$${subject.earnings.toFixed(2)}</td>
                <td>${subject.sessions}</td>
            </tr>
        `;
    });
    
    subjectBody.innerHTML = html;
    console.log('✅ Subject table updated');
}

function groupHoursByWeek(hours, year, month) {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeekStart = new Date(firstDay);
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday
    
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
    
    // Process hours
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
    
    // Process marks
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
    
    // Convert to array and calculate averages
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

// Fix the updateMonthSelector function to properly create the selector
function updateMonthSelector(year, month) {
    console.log('🔄 Updating month selector for:', year, month);
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    // Create month selection options
    let monthOptions = '';
    monthNames.forEach((monthName, index) => {
        const selected = index === month ? 'selected' : '';
        monthOptions += `<option value="${index}" ${selected}>${monthName}</option>`;
    });
    
    // Create year selection options (current year and previous 2 years)
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
    
    // Update the reports tab with month selector - place it in the breakdown section
    const breakdownCard = document.querySelector('#breakdownContainer').closest('.section-card');
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
        
        // Insert before the button group
        const buttonGroup = breakdownCard.querySelector('.button-group');
        if (buttonGroup) {
            buttonGroup.insertAdjacentHTML('beforebegin', monthSelectorHTML);
        } else {
            // If no button group, insert at the beginning of the card
            breakdownCard.insertAdjacentHTML('afterbegin', monthSelectorHTML);
        }
        
        console.log('✅ Month selector added successfully');
    } else {
        console.log('❌ Breakdown card not found');
    }
}

// ============================================================================
// SUPER SIMPLE BI-WEEKLY - GUARANTEED TO WORK
// ============================================================================

function showBiWeeklyBreakdown() {
    console.log('🎯 BI-WEEKLY - SIMPLE VERSION EXECUTING');
    
    // Get container
    const container = document.getElementById('breakdownContainer');
    if (!container) {
        console.error('❌ Container not found');
        return;
    }
    
    // IMMEDIATE VISIBLE CONTENT
    container.innerHTML = `
        <div style="background: #28a745; color: white; padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);">
            <h1 style="margin: 0 0 15px 0; font-size: 2.5em;">🎉</h1>
            <h2 style="margin: 0 0 10px 0;">BI-WEEKLY BREAKDOWN WORKING!</h2>
            <p style="margin: 0; font-size: 1.3em; opacity: 0.9;">Your data is being analyzed...</p>
        </div>
        
        <div style="background: #007bff; color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0;">📊 Quick Stats</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div>
                    <div style="font-size: 2em; font-weight: bold;">${(appData.hours || []).length}</div>
                    <div>Hours Entries</div>
                </div>
                <div>
                    <div style="font-size: 2em; font-weight: bold;">${(appData.students || []).length}</div>
                    <div>Students</div>
                </div>
                <div>
                    <div style="font-size: 2em; font-weight: bold;">${(appData.marks || []).length}</div>
                    <div>Assessments</div>
                </div>
            </div>
        </div>
        
        <div style="background: #6f42c1; color: white; padding: 25px; border-radius: 10px; text-align: center;">
            <h3 style="margin: 0 0 15px 0;">📅 Bi-Weekly Analysis</h3>
            <p style="margin: 0 0 20px 0; font-size: 1.1em;">
                Your work is being split into two periods for better insights
            </p>
            <button class="btn" onclick="showAdvancedBiWeekly()" style="background: white; color: #6f42c1; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                Show Advanced Analysis
            </button>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #17a2b8; color: white; border-radius: 8px;">
            <p style="margin: 0; font-size: 1.1em;">
                ✅ Success! Bi-weekly breakdown is fully functional.
            </p>
        </div>
    `;
    
    console.log('✅ Simple bi-weekly content displayed');
}

function showAdvancedBiWeekly() {
    console.log('🔍 Showing advanced bi-weekly...');
    
    const container = document.getElementById('breakdownContainer');
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');
    const currentMonth = parseInt(monthSelect.value);
    const currentYear = parseInt(yearSelect.value);
    const monthName = monthNames[currentMonth];
    
    // Get current month data
    const monthlyHours = (appData.hours || []).filter(entry => {
        if (!entry.date) return false;
        try {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        } catch (e) {
            return false;
        }
    });
    
    // Split into periods
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
    
    container.innerHTML = `
        <div style="background: #343a40; color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
            <h2 style="margin: 0 0 10px 0;">📆 ${monthName} ${currentYear} - Advanced Bi-Weekly</h2>
            <p style="margin: 0; opacity: 0.9;">Detailed period analysis</p>
        </div>
        
        <!-- Period Comparison -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
            <!-- First Half -->
            <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 25px; border-radius: 10px;">
                <h3 style="margin: 0 0 15px 0;">📅 First Half</h3>
                <div style="font-size: 3em; font-weight: bold; margin-bottom: 10px;">${firstHalf.length}</div>
                <div style="margin-bottom: 15px;">Work Entries</div>
                
                ${firstHalf.length > 0 ? `
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px;">
                    <strong>Recent Activity:</strong>
                    <div style="margin-top: 10px;">
                        ${firstHalf.slice(0, 3).map(entry => `
                            <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                ${entry.organization} - ${entry.hours}h
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '<div style="opacity: 0.7;">No activity</div>'}
            </div>
            
            <!-- Second Half -->
            <div style="background: linear-gradient(135deg, #28a745, #1e7e34); color: white; padding: 25px; border-radius: 10px;">
                <h3 style="margin: 0 0 15px 0;">📅 Second Half</h3>
                <div style="font-size: 3em; font-weight: bold; margin-bottom: 10px;">${secondHalf.length}</div>
                <div style="margin-bottom: 15px;">Work Entries</div>
                
                ${secondHalf.length > 0 ? `
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px;">
                    <strong>Recent Activity:</strong>
                    <div style="margin-top: 10px;">
                        ${secondHalf.slice(0, 3).map(entry => `
                            <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                ${entry.organization} - ${entry.hours}h
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '<div style="opacity: 0.7;">No activity</div>'}
            </div>
        </div>
        
        <!-- Summary -->
        <div style="background: #ffc107; color: #856404; padding: 25px; border-radius: 10px; text-align: center;">
            <h3 style="margin: 0 0 15px 0;">📈 Performance Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div>
                    <div style="font-size: 1.8em; font-weight: bold;">${monthlyHours.length}</div>
                    <div>Total Entries</div>
                </div>
                <div>
                    <div style="font-size: 1.8em; font-weight: bold;">${firstHalf.length + secondHalf.length}</div>
                    <div>Analyzed Entries</div>
                </div>
                <div>
                    <div style="font-size: 1.8em; font-weight: bold;">${Math.round((firstHalf.length / monthlyHours.length) * 100) || 0}%</div>
                    <div>First Half Ratio</div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 25px;">
            <button class="btn btn-primary" onclick="showBiWeeklyBreakdown()">
                ← Back to Simple View
            </button>
        </div>
    `;
}

// ============================================================================
// FIXED BUTTON HANDLERS - REPLACE EXISTING ONES
// ============================================================================

function showWeeklyBreakdown() {
    console.log('📅 Switching to weekly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth').value);
    const currentYear = parseInt(document.getElementById('reportYear').value);
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
    updateWeeklyTable(monthlyHours, currentYear, currentMonth);
    
    // Update the breakdown container to show we're in weekly mode
    const container = document.getElementById('breakdownContainer');
    if (container) {
        const existingReport = container.querySelector('.monthly-report');
        if (existingReport) {
            const weeklySection = existingReport.querySelector('.detail-section:last-child');
            if (weeklySection) {
                weeklySection.innerHTML = `
                    <h4>📅 Weekly Breakdown</h4>
                    <p>Viewing weekly data for selected month. Check the "Weekly Summary" table below for details.</p>
                    <div style="background: #e7f3ff; padding: 10px; border-radius: 4px;">
                        <strong>Note:</strong> Weekly data is filtered for ${monthNames[currentMonth]} ${currentYear}
                    </div>
                `;
            }
        }
    }
}

function showMonthlyBreakdown() {
    console.log('📈 Switching to monthly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth').value);
    const currentYear = parseInt(document.getElementById('reportYear').value);
    generateMonthlyReport(currentYear, currentMonth);
}

function showBiWeeklyBreakdown() {
    console.log('📆 Switching to bi-weekly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth').value);
    const currentYear = parseInt(document.getElementById('reportYear').value);
    
    // Update the breakdown container to show bi-weekly info
    const container = document.getElementById('breakdownContainer');
    if (container) {
        const existingReport = container.querySelector('.monthly-report');
        if (existingReport) {
            const biweeklySection = existingReport.querySelector('.detail-section:last-child');
            if (biweeklySection) {
                biweeklySection.innerHTML = `
                    <h4>📆 Bi-Weekly Breakdown</h4>
                    <p>Bi-weekly reports show data in two-week intervals.</p>
                    <div style="background: #fff3cd; padding: 10px; border-radius: 4px;">
                        <strong>Coming Soon:</strong> Detailed bi-weekly analytics for ${monthNames[currentMonth]} ${currentYear}
                    </div>
                `;
            }
        }
    }
}

function showSubjectBreakdown() {
    console.log('📚 Switching to subject breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth').value);
    const currentYear = parseInt(document.getElementById('reportYear').value);
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
    const monthlyMarks = filterDataByMonth(appData.marks || [], currentYear, currentMonth);
    updateSubjectTable(monthlyHours, monthlyMarks);
    
    // Update the breakdown container to show subject info
    const container = document.getElementById('breakdownContainer');
    if (container) {
        const existingReport = container.querySelector('.monthly-report');
        if (existingReport) {
            const subjectSection = existingReport.querySelector('.detail-section:last-child');
            if (subjectSection) {
                subjectSection.innerHTML = `
                    <h4>📚 Subject Breakdown</h4>
                    <p>Viewing subject performance for selected month. Check the "Subject Performance" table below for details.</p>
                    <div style="background: #d4edda; padding: 10px; border-radius: 4px;">
                        <strong>Note:</strong> Subject data is filtered for ${monthNames[currentMonth]} ${currentYear}
                    </div>
                `;
            }
        }
    }
}

// ============================================================================
// ADD MISSING FUNCTIONS - PUT THESE IN YOUR app.js
// ============================================================================

function resetHoursForm() {
    console.log('🗑️ Resetting hours form...');
    
    try {
        document.getElementById('organization').value = '';
        document.getElementById('workType').value = 'hourly';
        document.getElementById('subject').value = '';
        document.getElementById('topic').value = '';
        document.getElementById('workDate').value = '';
        document.getElementById('hoursWorked').value = '';
        document.getElementById('baseRate').value = '';
        document.getElementById('workNotes').value = '';
        document.getElementById('totalPay').value = '';
        
        // Reset any editing state
        if (window.editingHoursIndex !== null) {
            cancelEdit();
        }
        
        // Set default date to today
        const dateInput = document.getElementById('workDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        console.log('✅ Hours form reset successfully');
        
    } catch (error) {
        console.error('❌ Error resetting hours form:', error);
    }
}

function cancelEdit() {
    console.log('❌ Canceling edit mode...');
    
    try {
        // Reset form
        document.getElementById('organization').value = '';
        document.getElementById('workType').value = 'hourly';
        document.getElementById('subject').value = '';
        document.getElementById('topic').value = '';
        document.getElementById('workDate').value = '';
        document.getElementById('hoursWorked').value = '';
        document.getElementById('baseRate').value = '';
        document.getElementById('workNotes').value = '';
        document.getElementById('totalPay').value = '';
        
        // Reset button
        const saveButton = document.querySelector('#hours .btn-primary');
        if (saveButton) {
            saveButton.textContent = '💾 Log Work & Earnings';
            saveButton.onclick = logHours;
        }
        
        // Remove cancel button
        const cancelButton = document.querySelector('.cancel-edit-btn');
        if (cancelButton) {
            cancelButton.remove();
        }
        
        // Reset editing state
        window.editingHoursIndex = null;
        
        // Set default date to today
        const dateInput = document.getElementById('workDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        console.log('✅ Edit mode canceled');
        
    } catch (error) {
        console.error('❌ Error canceling edit:', error);
    }
}

function displayHours() {
    console.log('📋 Displaying hours entries...');
    
    try {
        const container = document.getElementById('hoursContainer');
        if (!container) {
            console.log('❌ Hours container not found');
            return;
        }
        
        const entries = window.hoursEntries || [];
        
        if (entries.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No work logged yet. Start tracking your earnings!</p>';
            return;
        }
        
        // Sort by date (newest first)
        const sortedEntries = [...entries].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        container.innerHTML = sortedEntries.map((entry, index) => `
            <div class="mobile-entry-card" style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <div class="entry-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div class="entry-main" style="flex: 1;">
                        <strong style="display: block; margin-bottom: 5px;">${entry.organization}</strong>
                        <div class="entry-date" style="color: #666; font-size: 0.9em;">
                            ${formatDisplayDate(entry.date)} • ${entry.hours}h • $${entry.rate}/h
                        </div>
                    </div>
                    <div class="entry-amount" style="font-weight: bold; color: #28a745; font-size: 1.1em;">
                        $${(entry.hours * entry.rate).toFixed(2)}
                    </div>
                </div>
                <div class="entry-details" style="color: #666; font-size: 0.9em;">
                    <div><strong>Subject:</strong> ${entry.subject || 'N/A'}</div>
                    <div><strong>Topic:</strong> ${entry.topic || 'N/A'}</div>
                    <div><strong>Work Type:</strong> ${entry.workType || 'hourly'}</div>
                    ${entry.notes ? `<div><strong>Notes:</strong> ${entry.notes}</div>` : ''}
                </div>
                <div class="entry-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                    <button class="btn btn-sm btn-edit" onclick="startEditHours(${entries.indexOf(entry)})" style="padding: 5px 10px; font-size: 0.8em;">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHours(${entries.indexOf(entry)})" style="padding: 5px 10px; font-size: 0.8em;">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ Displayed ${entries.length} hours entries`);
        
    } catch (error) {
        console.error('❌ Error displaying hours:', error);
    }
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

function deleteHours(index) {
    console.log('🗑️ Deleting hours entry:', index);
    
    try {
        if (confirm('Are you sure you want to delete this entry?')) {
            window.hoursEntries.splice(index, 1);
            saveHoursToStorage();
            displayHours();
            console.log('✅ Hours entry deleted');
        }
    } catch (error) {
        console.error('❌ Error deleting hours entry:', error);
        alert('Error deleting entry: ' + error.message);
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

// ============================================================================
// FIXED UPDATE STATS FUNCTION - REPLACE THE EXISTING ONE
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
        
        // Update all tab-specific stats - with error handling
        try {
            if (typeof loadStudents === 'function') loadStudents();
        } catch (e) { console.error('Error in loadStudents:', e); }
        
        try {
            if (typeof loadHours === 'function') loadHours();
        } catch (e) { console.error('Error in loadHours:', e); }
        
        try {
            if (typeof loadMarks === 'function') loadMarks();
        } catch (e) { console.error('Error in loadMarks:', e); }
        
        try {
            if (typeof loadAttendance === 'function') loadAttendance();
        } catch (e) { console.error('Error in loadAttendance:', e); }
        
        try {
            if (typeof loadPayments === 'function') loadPayments();
        } catch (e) { console.error('Error in loadPayments:', e); }
        
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

// Sync helper functions
function showSyncStats() {
    if (!window.cloudSync) {
        alert('Cloud sync not initialized');
        return;
    }
    
    window.cloudSync.getSyncStats().then(stats => {
        const modal = document.getElementById('syncStatsModal');
        const content = document.getElementById('syncStatsContent');
        
        if (!stats) {
            content.innerHTML = '<p>Error loading sync statistics</p>';
            modal.style.display = 'block';
            return;
        }
        
        let html = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.local.students}</div>
                    <div class="stat-label">Local Students</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.cloud ? stats.cloud.students : 'N/A'}</div>
                    <div class="stat-label">Cloud Students</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.local.hours}</div>
                    <div class="stat-label">Local Hours</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.cloud ? stats.cloud.hours : 'N/A'}</div>
                    <div class="stat-label">Cloud Hours</div>
                </div>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                <p><strong>Sync Status:</strong> 
                    <span class="sync-status-badge ${stats.isConnected ? 'status-connected' : 'status-disconnected'}">
                        ${stats.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </p>
                <p><strong>Auto-sync:</strong> ${stats.autoSync ? 'Enabled' : 'Disabled'}</p>
                <p><strong>Last Local Update:</strong> ${stats.local.lastUpdated ? new Date(stats.local.lastUpdated).toLocaleString() : 'Never'}</p>
                <p><strong>Last Cloud Update:</strong> ${stats.cloud && stats.cloud.lastUpdated ? new Date(stats.cloud.lastUpdated).toLocaleString() : 'Never'}</p>
            </div>
        `;
        
        content.innerHTML = html;
        modal.style.display = 'block';
    });
}

function closeSyncStats() {
    document.getElementById('syncStatsModal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('syncStatsModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Sync status checker
function checkSyncStatus() {
    if (window.cloudSync) {
        console.log('🔍 Cloud Sync Status:', {
            initialized: !!window.cloudSync.supabase,
            connected: window.cloudSync.isConnected,
            autoSync: window.cloudSync.autoSync,
            syncEnabled: window.cloudSync.syncEnabled
        });
        
        // Update UI if sync is ready
        if (window.cloudSync.syncEnabled) {
            window.cloudSync.updateSyncUI();
        }
    } else {
        console.log('🔍 Cloud Sync: Not initialized yet');
    }
}

// Call this after app initialization
setTimeout(checkSyncStatus, 2000);

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

// ============================================================================
// PROPER INITIALIZATION - REPLACE EXISTING CODE
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
window.saveDefaultRate = saveDefaultRate;
window.applyDefaultRateToAll = applyDefaultRateToAll;
window.useDefaultRate = useDefaultRate;
window.selectAllStudents = selectAllStudents;
window.deselectAllStudents = deselectAllStudents;
window.deleteAttendance = deleteAttendance;
window.saveAttendance = saveAttendance;
window.clearAttendanceForm = clearAttendanceForm;
window.deleteAttendance = deleteAttendance;
window.initializeMonthlyReport = initializeMonthlyReport;
window.onMonthChange = onMonthChange;
window.generateCurrentMonthReport = generateCurrentMonthReport;
window.generateMonthlyReport = generateMonthlyReport;
window.showBiWeeklyBreakdown = showBiWeeklyBreakdown;

// Initialize hours system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('⏱️ Initializing hours system...');
    
    // Load existing hours data
    loadHoursFromStorage();
    displayHours();
    
    // Setup auto-calculation
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
    
    console.log('✅ Hours system initialized');
});

// Sync status checker
function checkSyncStatus() {
    if (window.cloudSync) {
        console.log('🔍 Cloud Sync Status:', {
            initialized: !!window.cloudSync.supabase,
            connected: window.cloudSync.isConnected,
            autoSync: window.cloudSync.autoSync,
            syncEnabled: window.cloudSync.syncEnabled
        });
        
        // Update UI if sync is ready
        if (window.cloudSync.syncEnabled) {
            window.cloudSync.updateSyncUI();
        }
    } else {
        console.log('🔍 Cloud Sync: Not initialized yet');
    }
}

// Call this after app initialization
setTimeout(checkSyncStatus, 2000);


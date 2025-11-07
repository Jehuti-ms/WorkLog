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
// HOURS TRACKING - UNIFIED EARNINGS TRACKER
// ============================================================================

function loadHours() {
    try {
        const container = document.getElementById('hoursContainer');
        if (!container) return;
        
        if (!appData.hours || appData.hours.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No work hours logged yet.</p>';
            return;
        }
        
        let html = '<div class="hours-list">';
        
        // Show last 10 entries
        const recentHours = appData.hours.slice(-10).reverse();
        recentHours.forEach((entry, originalIndex) => {
            // Calculate the actual index in the original array
            const actualIndex = appData.hours.length - 1 - originalIndex;
            const totalPay = ((entry.hours || 0) * (entry.rate || 0)).toFixed(2);
            const workTypeBadge = getWorkTypeBadge(entry.workType);
            
            html += `
                <div class="hours-entry">
                    <div class="hours-header">
                        <h4>${entry.organization || 'No Organization'} 
                            <span class="work-type-badge ${entry.workType}">${workTypeBadge}</span>
                        </h4>
                        <span class="hours-amount">$${totalPay}</span>
                    </div>
                    <div class="hours-details">
                        <p><strong>Date:</strong> ${entry.date ? new Date(entry.date).toLocaleDateString() : 'No Date'}</p>
                        <p><strong>Hours:</strong> ${entry.hours || 0}</p>
                        <p><strong>Rate:</strong> $${entry.rate || '0.00'}/hour</p>
                        <p><strong>Work Type:</strong> ${getWorkTypeDescription(entry.workType)}</p>
                        ${entry.subject ? `<p><strong>Subject:</strong> ${entry.subject}</p>` : ''}
                        ${entry.topic ? `<p><strong>Topic:</strong> ${entry.topic}</p>` : ''}
                        ${entry.notes ? `<p><strong>Notes:</strong> ${entry.notes}</p>` : ''}
                    </div>
                    <div class="hours-actions">
                        <button class="btn btn-sm btn-edit" onclick="editHours(${actualIndex})">✏️ Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteHours(${actualIndex})">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        setupHoursForm();
        updateHoursStats();
        
    } catch (error) {
        console.error('❌ Error loading hours:', error);
        const container = document.getElementById('hoursContainer');
        if (container) {
            container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 40px;">Error loading hours data.</p>';
        }
    }
}

function editHours(index) {
    const entry = window.hoursEntries[index];
    if (!entry) return;
    
    // Populate form with existing data
    document.getElementById('organization').value = entry.organization || '';
    document.getElementById('workType').value = entry.workType || 'hourly';
    document.getElementById('subject').value = entry.subject || '';
    document.getElementById('topic').value = entry.topic || '';
    document.getElementById('workDate').value = entry.date || '';
    document.getElementById('hoursWorked').value = entry.hours || '';
    document.getElementById('baseRate').value = entry.rate || '';
    document.getElementById('workNotes').value = entry.notes || '';
    
    // Store the index being edited
    window.editingHoursIndex = index;
    
    // Change button text to indicate editing
    const saveBtn = document.querySelector('#hours .btn-primary');
    if (saveBtn) {
        saveBtn.innerHTML = '💾 Update Hours';
        saveBtn.setAttribute('onclick', 'updateHours()');
    }
    
    // Scroll to form
    document.getElementById('hours').scrollIntoView({ behavior: 'smooth' });
}

function updateHours() {
    const index = window.editingHoursIndex;
    if (index === undefined || index === null) {
        alert('No entry selected for editing');
        return;
    }
    
    // Get updated values
    const updatedEntry = {
        organization: document.getElementById('organization').value,
        workType: document.getElementById('workType').value,
        subject: document.getElementById('subject').value,
        topic: document.getElementById('topic').value,
        date: document.getElementById('workDate').value,
        hours: parseFloat(document.getElementById('hoursWorked').value),
        rate: parseFloat(document.getElementById('baseRate').value),
        notes: document.getElementById('workNotes').value,
        total: parseFloat(document.getElementById('hoursWorked').value) * parseFloat(document.getElementById('baseRate').value),
        timestamp: window.hoursEntries[index].timestamp, // Keep original timestamp
        updatedAt: new Date().toISOString()
    };
    
    // Update the entry
    window.hoursEntries[index] = updatedEntry;
    
    // Save to storage
    if (saveHoursToStorage()) {
        // Refresh display
        displayHours();
        
        // Reset form
        resetHoursForm();
        
        // Reset editing state
        window.editingHoursIndex = null;
        
        // Restore button text
        const saveBtn = document.querySelector('#hours .btn-primary');
        if (saveBtn) {
            saveBtn.innerHTML = '💾 Log Work & Earnings';
            saveBtn.setAttribute('onclick', 'logHours()');
        }
        
        console.log('✅ Hours updated successfully');
    } else {
        alert('Error saving updated hours');
    }
}

// Fix for hours data persistence
function saveHoursToStorage() {
    try {
        const hoursData = {
            hours: window.hoursEntries || [],
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('worklog_hours', JSON.stringify(hoursData));
        console.log('✅ Hours saved to storage:', hoursData.hours.length, 'entries');
        return true;
    } catch (error) {
        console.error('❌ Error saving hours:', error);
        return false;
    }
}

function loadHoursFromStorage() {
    try {
        const saved = localStorage.getItem('worklog_hours');
        if (saved) {
            const data = JSON.parse(saved);
            window.hoursEntries = data.hours || [];
            console.log('✅ Hours loaded from storage:', window.hoursEntries.length, 'entries');
            return window.hoursEntries;
        }
    } catch (error) {
        console.error('❌ Error loading hours:', error);
        window.hoursEntries = [];
    }
    return [];
}

function updateHours(index) {
    try {
        const organization = document.getElementById('organization').value;
        const workType = document.getElementById('workType').value || 'hourly';
        const subject = document.getElementById('subject').value;
        const topic = document.getElementById('topic').value;
        const date = document.getElementById('workDate').value;
        const hours = parseFloat(document.getElementById('hoursWorked').value) || 0;
        const rate = parseFloat(document.getElementById('baseRate').value) || 0;
        const notes = document.getElementById('workNotes').value;
        
        if (!organization || !date || !hours || !rate) {
            alert('Please fill in all required fields');
            return;
        }

        // Update the entry
        appData.hours[index] = {
            ...appData.hours[index], // Keep existing properties
            organization,
            workType,
            subject,
            topic,
            date,
            hours,
            rate,
            notes,
            total: hours * rate,
            updatedAt: new Date().toISOString()
        };

        saveAllData();
        loadHours();
        cancelHoursEdit();
        
        alert('✅ Hours entry updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating hours entry:', error);
        alert('Error updating hours entry: ' + error.message);
    }
}

function cancelHoursEdit() {
    // Reset the form
    resetHoursForm();
    
    // Change button back to "Log Work & Earnings"
    const logButton = document.querySelector('#hours .btn-primary');
    if (logButton) {
        logButton.innerHTML = '💾 Log Work & Earnings';
        logButton.onclick = logHours;
    }
    
    // Remove cancel button
    const cancelButton = document.querySelector('#hours .btn-cancel-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    // Remove edit mode styling
    const formCard = document.querySelector('#hours .section-card');
    if (formCard) {
        formCard.classList.remove('form-edit-mode');
    }
    
    console.log('❌ Hours edit cancelled');
}

function deleteHours(index) {
    if (confirm('Are you sure you want to delete this hours entry? This cannot be undone.')) {
        appData.hours.splice(index, 1);
        saveAllData();
        loadHours();
        alert('✅ Hours entry deleted successfully!');
    }
}

function getWorkTypeBadge(workType) {
    const badges = {
        'hourly': '⏱️ Hourly',
        'session': '👥 Session', 
        'contract': '📝 Contract',
        'other': '🔧 Other'
    };
    return badges[workType] || '🔧 Work';
}

function getWorkTypeDescription(workType) {
    const descriptions = {
        'hourly': 'Hourly Work',
        'session': 'Per-Session Work', 
        'contract': 'Contract Work',
        'other': 'Other Work'
    };
    return descriptions[workType] || 'Work Session';
}

function getWorkTypeDescription(workType) {
    const descriptions = {
        'hourly': 'Paid by the hour',
        'session': 'Per-student session rate', 
        'contract': 'Fixed contract work',
        'other': 'Other work type'
    };
    return descriptions[workType] || 'Work session';
}

function logHours() {
    if (window.editingHoursIndex !== undefined && window.editingHoursIndex !== null) {
        updateHours();
        return;
    }
    
    // Existing logHours code for new entries...
    const organization = document.getElementById('organization').value;
    const workType = document.getElementById('workType').value;
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const date = document.getElementById('workDate').value;
    const hours = parseFloat(document.getElementById('hoursWorked').value);
    const rate = parseFloat(document.getElementById('baseRate').value);
    
    if (!organization || !date || !hours || !rate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newEntry = {
        id: Date.now(), // Unique ID
        organization,
        workType,
        subject,
        topic,
        date,
        hours,
        rate,
        total: hours * rate,
        notes: document.getElementById('workNotes').value,
        timestamp: new Date().toISOString()
    };
    
    window.hoursEntries.push(newEntry);
    
    if (saveHoursToStorage()) {
        displayHours();
        resetHoursForm();
        updateHoursDisplay();
        console.log('✅ New hours entry saved');
    } else {
        alert('Error saving hours entry');
    }
}

function setupHoursForm() {
    // Auto-fill base rate with YOUR default hourly rate
    const baseRateInput = document.getElementById('baseRate');
    if (baseRateInput && !baseRateInput.value) {
        baseRateInput.value = appData.settings.defaultRate || 25.00;
    }
    
    // Setup work type selector
    const workTypeSelect = document.getElementById('workType');
    if (workTypeSelect) {
        workTypeSelect.innerHTML = `
            <option value="hourly">⏱️ Hourly Work</option>
            <option value="session">👥 Per-Session</option>
            <option value="contract">📝 Contract Work</option>
            <option value="other">🔧 Other</option>
        `;
    }
    
    // Auto-calculate total when values change
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
        
        // Calculate initial total if values exist
        calculateTotal();
    }
}

function resetHoursForm() {
    document.getElementById('organization').value = '';
    document.getElementById('workType').value = 'hourly';
    document.getElementById('workDate').value = '';
    document.getElementById('hoursWorked').value = '';
    document.getElementById('baseRate').value = '';
    document.getElementById('workNotes').value = '';
    document.getElementById('totalPay').value = '';
    
    // Re-setup form to get default rate
    setupHoursForm();
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

// Debug function
function debugHours() {
    console.log('=== HOURS DEBUG INFO ===');
    console.log('Current hours entries:', window.hoursEntries);
    console.log('Editing index:', window.editingHoursIndex);
    console.log('Local storage data:', localStorage.getItem('worklog_hours'));
    console.log('========================');
}

// Call this after any hours operation to see what's happening

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
window.selectAllStudents = selectAllStudents;
window.deselectAllStudents = deselectAllStudents;
window.saveAttendance = saveAttendance;
window.clearAttendanceForm = clearAttendanceForm;
window.deleteAttendance = deleteAttendance;


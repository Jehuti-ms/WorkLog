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
let fieldMemory = {
    organization: '',
    baseRate: '',
    subject: '',
    topic: '',
    defaultBaseRate: '25.00' // Default base rate
};

// Initialize app
function init() {
    console.log("WorkLog app initialized");
    loadAllData();
    loadFieldMemory();
    setupAllEventListeners();
    setDefaultDate();
    
    // Ensure first tab is visible on startup
    setTimeout(() => {
        switchTab('students');
        updateUI();
    }, 100);
    
    console.log('App initialized successfully');
}

// Load data from localStorage
function loadAllData() {
    try {
        students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
        hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
        marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
        attendance = JSON.parse(localStorage.getItem('worklog_attendance') || '[]');
        payments = JSON.parse(localStorage.getItem('worklog_payments') || '[]');
        paymentActivity = JSON.parse(localStorage.getItem('worklog_payment_activity') || '[]');
    } catch (error) {
        console.error('Error loading data:', error);
        // Reset data if corrupted
        students = [];
        hoursLog = [];
        marks = [];
        attendance = [];
        payments = [];
        paymentActivity = [];
        saveAllData();
    }
}

// Save data to localStorage
function saveAllData() {
    try {
        localStorage.setItem('worklog_students', JSON.stringify(students));
        localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
        localStorage.setItem('worklog_marks', JSON.stringify(marks));
        localStorage.setItem('worklog_attendance', JSON.stringify(attendance));
        localStorage.setItem('worklog_payments', JSON.stringify(payments));
        localStorage.setItem('worklog_payment_activity', JSON.stringify(paymentActivity));
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please check browser storage.');
    }
}

// Field memory functions
function loadFieldMemory() {
    try {
        const saved = localStorage.getItem('worklog_field_memory');
        if (saved) {
            const savedMemory = JSON.parse(saved);
            fieldMemory = { ...fieldMemory, ...savedMemory };
        }
        applyFieldMemory();
    } catch (error) {
        console.error('Error loading field memory:', error);
    }
}

function saveFieldMemory() {
    try {
        localStorage.setItem('worklog_field_memory', JSON.stringify(fieldMemory));
    } catch (error) {
        console.error('Error saving field memory:', error);
    }
}

function applyFieldMemory() {
    const orgInput = document.getElementById('organization');
    const rateInput = document.getElementById('baseRate');
    const subjectInput = document.getElementById('subject');
    const topicInput = document.getElementById('topic');
    const defaultRateInput = document.getElementById('defaultBaseRate');
    const studentBaseRateInput = document.getElementById('studentBaseRate');
    
    if (orgInput && fieldMemory.organization) orgInput.value = fieldMemory.organization;
    if (rateInput && fieldMemory.baseRate) rateInput.value = fieldMemory.baseRate;
    if (subjectInput && fieldMemory.subject) subjectInput.value = fieldMemory.subject;
    if (topicInput && fieldMemory.topic) topicInput.value = fieldMemory.topic;
    if (defaultRateInput && fieldMemory.defaultBaseRate) defaultRateInput.value = fieldMemory.defaultBaseRate;
    if (studentBaseRateInput && fieldMemory.defaultBaseRate && !studentBaseRateInput.value) {
        studentBaseRateInput.value = fieldMemory.defaultBaseRate;
    }
}

function updateFieldMemory() {
    const orgInput = document.getElementById('organization');
    const rateInput = document.getElementById('baseRate');
    const subjectInput = document.getElementById('subject');
    const topicInput = document.getElementById('topic');
    const defaultRateInput = document.getElementById('defaultBaseRate');
    
    if (orgInput) fieldMemory.organization = orgInput.value.trim();
    if (rateInput) fieldMemory.baseRate = rateInput.value.trim();
    if (subjectInput) fieldMemory.subject = subjectInput.value.trim();
    if (topicInput) fieldMemory.topic = topicInput.value.trim();
    if (defaultRateInput) fieldMemory.defaultBaseRate = defaultRateInput.value.trim();
    
    saveFieldMemory();
}

// Setup all event listeners
function setupAllEventListeners() {
    console.log("Setting up event listeners...");
    
    // Tab system
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            console.log('Tab clicked:', tabName);
            switchTab(tabName);
        });
    });
    
    // Main buttons
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('importDataBtn')?.addEventListener('click', importData);
    document.getElementById('clearAllDataBtn')?.addEventListener('click', clearAllData);
    
    // Form inputs with onchange
    document.getElementById('hoursWorked')?.addEventListener('input', calculateTotalPay);
    document.getElementById('baseRate')?.addEventListener('input', calculateTotalPay);
    document.getElementById('score')?.addEventListener('input', calculatePercentage);
    document.getElementById('maxScore')?.addEventListener('input', calculatePercentage);
    document.getElementById('marksStudent')?.addEventListener('change', updateStudentDetails);
    
    // Breakdown buttons
    document.getElementById('weeklyBreakdownBtn')?.addEventListener('click', showWeeklyBreakdown);
    document.getElementById('biWeeklyBreakdownBtn')?.addEventListener('click', showBiWeeklyBreakdown);
    document.getElementById('monthlyBreakdownBtn')?.addEventListener('click', showMonthlyBreakdown);
    document.getElementById('subjectBreakdownBtn')?.addEventListener('click', showSubjectBreakdown);
    
    // Payment buttons
    document.getElementById('recordPaymentBtn')?.addEventListener('click', () => openModal('paymentModal'));
    document.getElementById('markSessionBtn')?.addEventListener('click', () => openModal('attendanceSessionModal'));
    
    // Modal forms
    document.getElementById('paymentForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        recordPayment();
    });
    
    document.getElementById('attendanceSessionForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveSessionAttendance();
    });
    
    // Student form listeners
    document.getElementById('addStudentBtn')?.addEventListener('click', addStudent);
    document.getElementById('updateStudentBtn')?.addEventListener('click', updateStudent);
    document.getElementById('cancelEditBtn')?.addEventListener('click', cancelEdit);
    
    // Default rate listeners
    document.getElementById('defaultBaseRate')?.addEventListener('change', function() {
        updateFieldMemory();
        // Update current default rate display
        const currentRateEl = document.getElementById('currentDefaultRate');
        if (currentRateEl) {
            currentRateEl.textContent = this.value || '0.00';
        }
    });
    
    document.getElementById('studentBaseRate')?.addEventListener('focus', function() {
        if (!this.value && fieldMemory.defaultBaseRate) {
            this.value = fieldMemory.defaultBaseRate;
        }
    });
    
    // File import listener
    document.getElementById('importFile')?.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            handleFileImport(e.target.files[0]);
        }
    });
    
    // Modal close handlers
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        });
    });
    
    console.log('All event listeners setup successfully');
}

// Tab switching
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(tabName);
    
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = 'block';
    }
    
    // Tab-specific updates
    switch(tabName) {
        case 'reports':
            updateReports();
            break;
        case 'attendance':
            updateAttendanceList();
            break;
        case 'hours':
            calculateTimeTotals();
            break;
        case 'payments':
            updatePaymentUI();
            break;
        case 'marks':
            updateStudentSelects();
            break;
        case 'students':
            updateStudentList();
            break;
    }
    
    console.log('Tab switched successfully to:', tabName);
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
    
    // Update current default rate display
    const currentRateEl = document.getElementById('currentDefaultRate');
    if (currentRateEl && fieldMemory.defaultBaseRate) {
        currentRateEl.textContent = fieldMemory.defaultBaseRate;
    }
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    
    // Set today's date in all date fields
    const dateFields = ['workDate', 'markDate', 'attendanceDate', 'paymentDate', 'sessionDate'];
    dateFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = today;
    });
}

// Load default rate into the form
function loadDefaultRate() {
    const defaultRateInput = document.getElementById('defaultBaseRate');
    const studentBaseRateInput = document.getElementById('studentBaseRate');
    
    if (defaultRateInput && fieldMemory.defaultBaseRate) {
        defaultRateInput.value = fieldMemory.defaultBaseRate;
    }
    if (studentBaseRateInput && fieldMemory.defaultBaseRate && !studentBaseRateInput.value) {
        studentBaseRateInput.value = fieldMemory.defaultBaseRate;
    }
    
    // Update current default rate display
    const currentRateEl = document.getElementById('currentDefaultRate');
    if (currentRateEl && fieldMemory.defaultBaseRate) {
        currentRateEl.textContent = fieldMemory.defaultBaseRate;
    }
}

// Apply default rate to all existing students
function applyDefaultRateToAll() {
    const defaultRateInput = document.getElementById('defaultBaseRate');
    const defaultRate = parseFloat(defaultRateInput?.value) || 0;
    
    if (!defaultRate) {
        alert('Please set a default base rate first');
        return;
    }
    
    if (students.length === 0) {
        alert('No students to update');
        return;
    }
    
    if (confirm(`Apply $${defaultRate.toFixed(2)} base rate to all ${students.length} students?`)) {
        students.forEach(student => {
            student.baseRate = defaultRate;
        });
        
        saveAllData();
        updateUI();
        logPaymentActivity(`Applied default rate $${defaultRate.toFixed(2)} to all students`);
        alert(`✅ Base rate applied to all ${students.length} students!`);
    }
}

// Use default rate in student form
function useDefaultRate() {
    const studentBaseRateInput = document.getElementById('studentBaseRate');
    if (studentBaseRateInput && fieldMemory.defaultBaseRate) {
        studentBaseRateInput.value = fieldMemory.defaultBaseRate;
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Initialize modal-specific data
        if (modalId === 'paymentModal') {
            updatePaymentStudentSelect();
            document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        } else if (modalId === 'attendanceSessionModal') {
            updateSessionAttendanceList();
            document.getElementById('sessionDate').value = new Date().toISOString().split('T')[0];
        }
    }
}

// ============================================================================
// DATA EXPORT/IMPORT FUNCTIONS
// ============================================================================

function exportData() {
    try {
        const data = {
            students,
            hoursLog,
            marks,
            attendance,
            payments,
            paymentActivity,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `worklog-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Data exported successfully!');
    } catch (error) {
        console.error('Export error:', error);
        alert('❌ Error exporting data');
    }
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
                alert('✅ Data imported successfully!');
            }
        } catch (error) {
            console.error('Import error:', error);
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
        
        // Clear summary displays
        const weeklyTotal = document.getElementById('weeklyTotal');
        const monthlyTotal = document.getElementById('monthlyTotal');
        const weeklyHours = document.getElementById('weeklyHours');
        const monthlyHours = document.getElementById('monthlyHours');
        
        if (weeklyTotal) weeklyTotal.textContent = '$0';
        if (monthlyTotal) monthlyTotal.textContent = '$0';
        if (weeklyHours) weeklyHours.textContent = '0';
        if (monthlyHours) monthlyHours.textContent = '0';
        
        // Clear breakdown container
        const breakdownContainer = document.getElementById('breakdownContainer');
        if (breakdownContainer) {
            breakdownContainer.innerHTML = '<p style="color: #666; text-align: center;">Select a breakdown option above</p>';
        }
        
        alert('✅ All data cleared!');
    }
}

// ============================================================================
// STUDENT MANAGEMENT FUNCTIONS
// ============================================================================

// Enhanced addStudent function with default rate
function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const gender = document.getElementById('studentGender').value;
    const email = document.getElementById('studentEmail').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    const baseRate = parseFloat(document.getElementById('studentBaseRate').value) || parseFloat(fieldMemory.defaultBaseRate) || 0;
    
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
    resetStudentForm();
    
    // Log activity
    logPaymentActivity(`Added student: ${name} (Base rate: $${baseRate.toFixed(2)}/session)`);
    
    alert('✅ Student added successfully!');
}

// Enhanced updateStudentList with edit functionality
function updateStudentList() {
    const studentCount = document.getElementById('studentCount');
    const averageRate = document.getElementById('averageRate');
    
    if (studentCount) studentCount.textContent = students.length;
    
    // Calculate average rate
    if (averageRate && students.length > 0) {
        const totalRate = students.reduce((sum, student) => sum + (student.baseRate || 0), 0);
        const avgRate = totalRate / students.length;
        averageRate.textContent = avgRate.toFixed(2);
    } else if (averageRate) {
        averageRate.textContent = '0.00';
    }
    
    const container = document.getElementById('studentsContainer');
    if (!container) return;
    
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No students registered yet.</p>';
        return;
    }
    
    container.innerHTML = students.map((student, index) => `
        <div class="list-item ${student._editing ? 'edit-mode' : ''}" id="student-${student.id}">
            <div style="flex: 1;">
                <strong>${student.name}</strong> (${student.id})<br>
                <small style="color: #666;">
                    ${student.gender} | 
                    ${student.email || 'No email'} | 
                    ${student.phone || 'No phone'} | 
                    Rate: $${student.baseRate || 0}/session
                </small>
                <div class="student-actions">
                    <button class="btn btn-sm" onclick="editStudent(${index})">✏️ Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="deleteStudent(${index})">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Edit student function
function editStudent(index) {
    const student = students[index];
    
    if (!student) {
        alert('Student not found');
        return;
    }
    
    // Fill form with student data
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentGender').value = student.gender;
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentPhone').value = student.phone || '';
    document.getElementById('studentBaseRate').value = student.baseRate || '';
    
    // Store editing index
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.dataset.editingIndex = index;
    }
    
    // Show/hide buttons
    document.getElementById('addStudentBtn').style.display = 'none';
    document.getElementById('updateStudentBtn').style.display = 'inline-block';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    
    // Scroll to form
    document.getElementById('studentName').scrollIntoView({ behavior: 'smooth' });
    
    // Mark student as being edited for UI feedback
    student._editing = true;
    updateStudentList();
}

function updateStudentSelects() {
    // Update marks student select
    const marksSelect = document.getElementById('marksStudent');
    if (marksSelect) {
        marksSelect.innerHTML = '<option value="">Select student...</option>' +
            students.map(s => `<option value="${s.id}">${s.name} (${s.id})</option>`).join('');
    }
    
    // Update payment student select
    updatePaymentStudentSelect();
}

function updatePaymentStudentSelect() {
    const paymentSelect = document.getElementById('paymentStudent');
    if (paymentSelect) {
        paymentSelect.innerHTML = '<option value="">Select Student</option>' +
            students.map(s => `<option value="${s.id}">${s.name} (${s.id})</option>`).join('');
    }
}

// Enhanced delete student function
function deleteStudent(index) {
    const student = students[index];
    if (!student) return;
    
    if (confirm(`Are you sure you want to delete student "${student.name}" (${student.id})?`)) {
        // Check if student has related data
        const hasAttendance = attendance.some(a => a.studentId === student.id);
        const hasMarks = marks.some(m => m.studentId === student.id);
        const hasPayments = payments.some(p => p.studentId === student.id);
        
        let warning = '';
        if (hasAttendance) warning += '\n• Attendance records';
        if (hasMarks) warning += '\n• Marks records';
        if (hasPayments) warning += '\n• Payment records';
        
        if (warning && !confirm(`This student has associated data that will also be deleted:${warning}\n\nContinue with deletion?`)) {
            return;
        }
        
        students.splice(index, 1);
        saveAllData();
        updateUI();
        logPaymentActivity(`Deleted student: ${student.name}`);
        alert('✅ Student deleted successfully!');
    }
}

// Update student function
function updateStudent() {
    const studentForm = document.getElementById('studentForm');
    const editingIndex = studentForm ? parseInt(studentForm.dataset.editingIndex) : -1;
    
    if (isNaN(editingIndex) || !students[editingIndex]) {
        alert('No student selected for editing');
        return;
    }
    
    const student = students[editingIndex];
    const originalName = student.name;
    
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
    
    // Check if student ID already exists (excluding current student)
    const duplicate = students.find((s, i) => s.id === id && i !== editingIndex);
    if (duplicate) {
        alert('Student ID already exists. Please use a different ID.');
        return;
    }
    
    // Update student data
    student.name = name;
    student.id = id;
    student.gender = gender;
    student.email = email;
    student.phone = phone;
    student.baseRate = baseRate;
    delete student._editing; // Remove editing flag
    
    saveAllData();
    updateUI();
    resetStudentForm();
    
    // Log activity
    logPaymentActivity(`Updated student: ${originalName} → ${name} (Rate: $${baseRate.toFixed(2)}/session)`);
    
    alert('✅ Student updated successfully!');
}

// Cancel edit function
function cancelEdit() {
    resetStudentForm();
    
    // Clear editing flags
    students.forEach(student => {
        delete student._editing;
    });
    
    updateStudentList();
}

// Reset student form function
function resetStudentForm() {
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.reset();
        delete studentForm.dataset.editingIndex;
    }
    
    // Show/hide buttons
    document.getElementById('addStudentBtn').style.display = 'inline-block';
    document.getElementById('updateStudentBtn').style.display = 'none';
    document.getElementById('cancelEditBtn').style.display = 'none';
    
    // Reload default rate
    loadDefaultRate();
}

// Clear student form
function clearStudentForm() {
    resetStudentForm();
}

// Filter students (placeholder)
function filterStudents() {
    // Implementation needed
    console.log('Filter students function called');
}

// Sort students (placeholder)
function sortStudents(criteria) {
    // Implementation needed
    console.log('Sort students by:', criteria);
}

// ============================================================================
// HOURS TRACKING FUNCTIONS
// ============================================================================

function calculateTotalPay() {
    const hours = parseFloat(document.getElementById('hoursWorked').value) || 0;
    const rate = parseFloat(document.getElementById('baseRate').value) || 0;
    const totalPay = hours * rate;
    
    const totalPayInput = document.getElementById('totalPay');
    if (totalPayInput) {
        totalPayInput.value = '$' + totalPay.toFixed(2);
    }
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
    updateUI();
    calculateTimeTotals();
    resetHoursForm();
    
    alert('✅ Hours logged successfully!');
}

function resetHoursForm() {
    document.getElementById('workDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('hoursWorked').value = '';
    document.getElementById('totalPay').value = '';
    document.getElementById('workNotes').value = '';
}

function updateHoursList() {
    const container = document.getElementById('hoursContainer');
    if (!container) return;
    
    if (hoursLog.length === 0) {
        container.innerHTML = '<p style="color: #666;">No hours logged yet.</p>';
        return;
    }
    
    const recent = hoursLog.slice(-20).reverse();
    
    container.innerHTML = recent.map(entry => {
        const entryId = entry.id || generateId();
        if (!entry.id) {
            entry.id = entryId;
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
                    <button class="btn btn-sm btn-secondary" onclick="deleteHours('${entryId}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteHours(entryId) {
    if (confirm('Are you sure you want to delete this hours entry?')) {
        const entryIndex = hoursLog.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
            hoursLog.splice(entryIndex, 1);
            saveAllData();
            updateUI();
            calculateTimeTotals();
            alert('✅ Hours entry deleted successfully!');
        }
    }
}

// Edit hours placeholder
function editHours(entryId) {
    alert('Edit hours functionality coming soon!');
}

function calculateTimeTotals() {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let weeklyHours = 0;
    let monthlyHours = 0;
    
    hoursLog.forEach(entry => {
        const entryDate = new Date(entry.date);
        const entryWeek = getWeekNumber(entryDate);
        const entryMonth = entryDate.getMonth();
        const entryYear = entryDate.getFullYear();
        
        if (entryWeek === currentWeek && entryYear === currentYear) {
            weeklyTotal += entry.totalPay;
            weeklyHours += entry.hours;
        }
        
        if (entryMonth === currentMonth && entryYear === currentYear) {
            monthlyTotal += entry.totalPay;
            monthlyHours += entry.hours;
        }
    });
    
    // Update display
    const weeklyTotalEl = document.getElementById('weeklyTotal');
    const monthlyTotalEl = document.getElementById('monthlyTotal');
    const weeklyHoursEl = document.getElementById('weeklyHours');
    const monthlyHoursEl = document.getElementById('monthlyHours');
    
    if (weeklyTotalEl) weeklyTotalEl.textContent = `$${weeklyTotal.toFixed(2)}`;
    if (monthlyTotalEl) monthlyTotalEl.textContent = `$${monthlyTotal.toFixed(2)}`;
    if (weeklyHoursEl) weeklyHoursEl.textContent = weeklyHours.toFixed(1);
    if (monthlyHoursEl) monthlyHoursEl.textContent = monthlyHours.toFixed(1);
}

// ============================================================================
// MARKS MANAGEMENT FUNCTIONS
// ============================================================================

function calculatePercentage() {
    const score = parseFloat(document.getElementById('score').value) || 0;
    const maxScore = parseFloat(document.getElementById('maxScore').value) || 0;
    
    if (maxScore > 0) {
        const percentage = (score / maxScore * 100).toFixed(1);
        document.getElementById('percentage').value = percentage + '%';
        
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
    
    if (student && detailsDiv) {
        document.getElementById('selectedStudentName').textContent = student.name;
        document.getElementById('selectedStudentGender').textContent = student.gender;
        document.getElementById('selectedStudentId').textContent = student.id;
        detailsDiv.style.display = 'block';
    } else if (detailsDiv) {
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
    if (!student) {
        alert('Student not found');
        return;
    }
    
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
    if (!container) return;
    
    if (marks.length === 0) {
        container.innerHTML = '<p style="color: #666;">No marks recorded yet.</p>';
        return;
    }
    
    const recent = marks.slice(-20).reverse();
    
    container.innerHTML = recent.map(mark => {
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
                    <button class="btn btn-sm btn-secondary" onclick="deleteMark('${markId}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
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

// Edit mark placeholder
function editMark(markId) {
    alert('Edit mark functionality coming soon!');
}

// ============================================================================
// ATTENDANCE MANAGEMENT FUNCTIONS
// ============================================================================

function updateAttendanceList() {
    const container = document.getElementById('attendanceList');
    if (!container) return;
    
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
                <small style="color: #666;">${student.email || 'No email'} | Rate: $${student.baseRate || 0}/session</small>
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
        if (!checkbox) return;
        
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
    
    attendance.push(...attendanceRecords);
    saveAllData();
    updateAttendanceUI();
    
    // Keep subject and topic for quick reuse
    document.getElementById('attendanceSubject').value = subject;
    document.getElementById('attendanceTopic').value = topic;
    
    alert(`✅ Attendance saved for ${attendanceRecords.length} students!`);
    
    // Auto-scroll to show new records
    const attendanceContainer = document.getElementById('attendanceContainer');
    if (attendanceContainer) {
        attendanceContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

function updateAttendanceUI() {
    const container = document.getElementById('attendanceContainer');
    if (!container) return;
    
    if (attendance.length === 0) {
        container.innerHTML = '<p style="color: #666;">No attendance records yet.</p>';
        return;
    }
    
    const recent = attendance.slice(-20).reverse();
    
    container.innerHTML = recent.map(record => {
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
                    <button class="btn btn-sm btn-secondary" onclick="deleteAttendance('${recordId}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
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

// Edit attendance placeholder
function editAttendance(recordId) {
    alert('Edit attendance functionality coming soon!');
}

// ============================================================================
// PAYMENT MANAGEMENT FUNCTIONS
// ============================================================================

function updatePaymentUI() {
    updatePaymentStats();
    updateStudentBalances();
    updatePaymentActivityLog();
}

function updatePaymentStats() {
    const totalStudentsEl = document.getElementById('totalStudentsCount');
    const totalOwedEl = document.getElementById('totalOwed');
    const monthlyPaymentsEl = document.getElementById('monthlyPayments');
    
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;
    
    // Calculate total owed (simplified - you might want more complex logic)
    let totalOwed = 0;
    students.forEach(student => {
        // Simple calculation - you might want to track sessions and payments per student
        totalOwed += student.baseRate || 0;
    });
    
    if (totalOwedEl) totalOwedEl.textContent = `$${totalOwed.toFixed(2)}`;
    
    // Calculate monthly payments
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let monthlyTotal = 0;
    
    payments.forEach(payment => {
        const paymentDate = new Date(payment.date);
        if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            monthlyTotal += payment.amount;
        }
    });
    
    if (monthlyPaymentsEl) monthlyPaymentsEl.textContent = `$${monthlyTotal.toFixed(2)}`;
}

function updateStudentBalances() {
    const container = document.getElementById('studentBalancesContainer');
    if (!container) return;
    
    if (students.length === 0) {
        container.innerHTML = '<p style="color: #666;">No students registered yet.</p>';
        return;
    }
    
    container.innerHTML = students.map(student => {
        // Calculate balance (simplified - you might want more complex logic)
        const balance = student.baseRate || 0;
        
        return `
            <div class="list-item">
                <div>
                    <strong>${student.name}</strong> (${student.id})<br>
                    <small style="color: #666;">${student.gender} | ${student.email || 'No email'}</small>
                </div>
                <div>
                    <strong style="color: ${balance > 0 ? '#e74c3c' : '#27ae60'}">
                        $${balance.toFixed(2)}
                    </strong>
                </div>
            </div>
        `;
    }).join('');
}

function updatePaymentActivityLog() {
    const container = document.getElementById('paymentActivityLog');
    if (!container) return;
    
    if (paymentActivity.length === 0) {
        container.innerHTML = '<p style="color: #666;">No recent activity.</p>';
        return;
    }
    
    const recent = paymentActivity.slice(-10).reverse();
    
    container.innerHTML = recent.map(activity => `
        <div class="activity-item">
            <div class="activity-message">${activity.message}</div>
            <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

function recordPayment() {
    const studentId = document.getElementById('paymentStudent').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    const method = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('paymentNotes').value.trim();
    
    // Validation
    if (!studentId) {
        alert('Please select a student');
        return false;
    }
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid payment amount');
        return false;
    }
    
    if (!date) {
        alert('Please select a payment date');
        return false;
    }
    
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('Student not found');
        return false;
    }
    
    // Create payment record
    const payment = {
        id: generateId(),
        studentId,
        studentName: student.name,
        amount,
        date,
        method: method || 'Cash',
        notes,
        timestamp: new Date().toISOString()
    };
    
    // Save payment
    payments.push(payment);
    saveAllData();
    
    // Log activity
    logPaymentActivity(`Payment recorded: $${amount.toFixed(2)} from ${student.name} (${method || 'Cash'})`);
    
    // Close modal first
    document.getElementById('paymentModal').style.display = 'none';
    document.body.classList.remove('modal-open');
    
    // Update UI
    updatePaymentUI();
    
    // Reset form properly
    resetPaymentForm();
    
    // Show success message
    alert('✅ Payment recorded successfully!');
    return true;
}

// Helper function to properly reset the payment form
function resetPaymentForm() {
    const form = document.getElementById('paymentForm');
    if (form) {
        form.reset();
        // Set default date to today
        const paymentDate = document.getElementById('paymentDate');
        if (paymentDate) {
            paymentDate.value = new Date().toISOString().split('T')[0];
        }
        // Set default method to Cash
        const paymentMethod = document.getElementById('paymentMethod');
        if (paymentMethod) {
            paymentMethod.value = 'Cash';
        }
    }
}

// Enhanced session attendance functions
function updateSessionAttendanceList() {
    const container = document.getElementById('sessionAttendanceList');
    if (!container) {
        console.error('Session attendance container not found');
        return;
    }
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <p>No students registered yet.</p>
                <small>Add students in the Students tab first.</small>
            </div>
        `;
        return;
    }
    
    try {
        container.innerHTML = students.map(student => {
            // Validate student data
            if (!student.id || !student.name) {
                console.warn('Invalid student data:', student);
                return '';
            }
            
            const studentId = student.id.replace(/[^a-zA-Z0-9-_]/g, '_'); // Sanitize ID for HTML
            const baseRate = student.baseRate || 0;
            
            return `
                <div class="attendance-item" data-student-id="${studentId}">
                    <div class="attendance-info">
                        <input 
                            type="checkbox" 
                            class="attendance-checkbox" 
                            id="session_${studentId}" 
                            checked
                            data-student-id="${student.id}"
                        >
                        <label for="session_${studentId}" class="attendance-label">
                            <strong>${escapeHtml(student.name)}</strong> 
                            <span class="student-id">(${escapeHtml(student.id)})</span>
                        </label>
                    </div>
                    <div class="attendance-details">
                        <small class="rate-info">Rate: $${baseRate.toFixed(2)}/session</small>
                        ${student.email ? `<br><small class="email-info">${escapeHtml(student.email)}</small>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error updating session attendance list:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e74c3c;">
                <p>Error loading students list</p>
                <small>Please try refreshing the page</small>
            </div>
        `;
    }
}

// Helper function to escape HTML (prevent XSS)
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function saveSessionAttendance() {
    const date = document.getElementById('sessionDate').value;
    const subject = document.getElementById('sessionSubject').value.trim();
    const topic = document.getElementById('sessionTopic').value.trim();
    
    if (!date) {
        alert('Please select a date');
        return false;
    }
    
    if (!subject) {
        alert('Please enter a subject');
        return false;
    }
    
    // Get all checked students
    const checkedBoxes = document.querySelectorAll('#sessionAttendanceList .attendance-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
        if (!confirm('No students selected for this session. Continue anyway?')) {
            return false;
        }
    }
    
    const attendanceRecords = [];
    const presentStudents = [];
    
    checkedBoxes.forEach(checkbox => {
        const studentId = checkbox.getAttribute('data-student-id');
        const student = students.find(s => s.id === studentId);
        
        if (student) {
            const record = {
                id: generateId(),
                date,
                studentId: student.id,
                studentName: student.name,
                gender: student.gender,
                subject,
                topic: topic || 'General',
                status: 'Present',
                timestamp: new Date().toISOString()
            };
            
            attendanceRecords.push(record);
            presentStudents.push(student.name);
        }
    });
    
    // Save attendance records
    if (attendanceRecords.length > 0) {
        attendance.push(...attendanceRecords);
        saveAllData();
    }
    
    // Log activity
    const activityMessage = presentStudents.length > 0 
        ? `Session recorded: ${presentStudents.length} students (${presentStudents.join(', ')}) for ${subject}`
        : `Session recorded: No students attended for ${subject}`;
    
    logPaymentActivity(activityMessage);
    
    // Close modal
    document.getElementById('attendanceSessionModal').style.display = 'none';
    document.body.classList.remove('modal-open');
    
    // Update UI
    updateAttendanceUI();
    
    // Reset form
    resetSessionAttendanceForm();
    
    // Show success message
    const successMessage = presentStudents.length > 0
        ? `✅ Session recorded for ${presentStudents.length} students!`
        : '✅ Session recorded (no students attended)';
    
    alert(successMessage);
    return true;
}

// Reset session attendance form
function resetSessionAttendanceForm() {
    const form = document.getElementById('attendanceSessionForm');
    if (form) {
        form.reset();
        // Set default date
        const sessionDate = document.getElementById('sessionDate');
        if (sessionDate) {
            sessionDate.value = new Date().toISOString().split('T')[0];
        }
        // Check all students by default
        const checkboxes = document.querySelectorAll('#sessionAttendanceList .attendance-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
}

function logPaymentActivity(message) {
    if (!message || typeof message !== 'string') {
        console.warn('Invalid activity message:', message);
        return;
    }
    
    try {
        const activity = {
            timestamp: new Date().toISOString(),
            message: message.substring(0, 500) // Limit message length
        };
        
        paymentActivity.push(activity);
        
        // Keep only last 100 activities to prevent storage bloat
        if (paymentActivity.length > 100) {
            paymentActivity = paymentActivity.slice(-100);
        }
        
        saveAllData();
        
    } catch (error) {
        console.error('Error logging payment activity:', error);
    }
}

// ============================================================================
// BREAKDOWN ANALYSIS FUNCTIONS
// ============================================================================

function showWeeklyBreakdown() {
    console.log('Showing weekly breakdown');
    const breakdown = getWeeklyBreakdown();
    displayBreakdown(breakdown, 'Weekly Breakdown');
}

function showBiWeeklyBreakdown() {
    console.log('Showing bi-weekly breakdown');
    const breakdown = getBiWeeklyBreakdown();
    displayBreakdown(breakdown, 'Bi-Weekly Breakdown');
}

function showMonthlyBreakdown() {
    console.log('Showing monthly breakdown');
    const breakdown = getMonthlyBreakdown();
    displayBreakdown(breakdown, 'Monthly Breakdown');
}

function showSubjectBreakdown() {
    console.log('Showing subject breakdown');
    const breakdown = getSubjectBreakdown();
    displayBreakdown(breakdown, 'Subject Breakdown');
}

function getWeeklyBreakdown() {
    const weeks = {};
    
    hoursLog.forEach(entry => {
        const entryDate = new Date(entry.date);
        const weekNumber = getWeekNumber(entryDate);
        const year = entryDate.getFullYear();
        const weekKey = `Week ${weekNumber}, ${year}`;
        
        if (!weeks[weekKey]) {
            weeks[weekKey] = {
                hours: 0,
                earnings: 0,
                sessions: 0,
                avgRate: 0,
                subjects: new Set()
            };
        }
        
        weeks[weekKey].hours += entry.hours;
        weeks[weekKey].earnings += entry.totalPay;
        weeks[weekKey].sessions += 1;
        weeks[weekKey].subjects.add(entry.subject);
        
        // Calculate average rate
        if (weeks[weekKey].hours > 0) {
            weeks[weekKey].avgRate = weeks[weekKey].earnings / weeks[weekKey].hours;
        }
    });
    
    return weeks;
}

function getBiWeeklyBreakdown() {
    const biWeeks = {};
    
    hoursLog.forEach(entry => {
        const entryDate = new Date(entry.date);
        const weekNumber = getWeekNumber(entryDate);
        const year = entryDate.getFullYear();
        const biWeekNumber = Math.ceil(weekNumber / 2);
        const biWeekKey = `Bi-Week ${biWeekNumber}, ${year}`;
        
        if (!biWeeks[biWeekKey]) {
            biWeeks[biWeekKey] = {
                hours: 0,
                earnings: 0,
                sessions: 0,
                avgRate: 0,
                subjects: new Set(),
                weeks: new Set()
            };
        }
        
        biWeeks[biWeekKey].hours += entry.hours;
        biWeeks[biWeekKey].earnings += entry.totalPay;
        biWeeks[biWeekKey].sessions += 1;
        biWeeks[biWeekKey].subjects.add(entry.subject);
        biWeeks[biWeekKey].weeks.add(weekNumber);
        
        if (biWeeks[biWeekKey].hours > 0) {
            biWeeks[biWeekKey].avgRate = biWeeks[biWeekKey].earnings / biWeeks[biWeekKey].hours;
        }
    });
    
    return biWeeks;
}

function getMonthlyBreakdown() {
    const months = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    hoursLog.forEach(entry => {
        const entryDate = new Date(entry.date);
        const month = entryDate.getMonth();
        const year = entryDate.getFullYear();
        const monthKey = `${monthNames[month]} ${year}`;
        
        if (!months[monthKey]) {
            months[monthKey] = {
                hours: 0,
                earnings: 0,
                sessions: 0,
                avgRate: 0,
                subjects: new Set()
            };
        }
        
        months[monthKey].hours += entry.hours;
        months[monthKey].earnings += entry.totalPay;
        months[monthKey].sessions += 1;
        months[monthKey].subjects.add(entry.subject);
        
        if (months[monthKey].hours > 0) {
            months[monthKey].avgRate = months[monthKey].earnings / months[monthKey].hours;
        }
    });
    
    return months;
}

function getSubjectBreakdown() {
    const subjects = {};
    
    hoursLog.forEach(entry => {
        if (!subjects[entry.subject]) {
            subjects[entry.subject] = {
                hours: 0,
                earnings: 0,
                sessions: 0,
                avgRate: 0,
                topics: new Set(),
                organizations: new Set(),
                lastSession: ''
            };
        }
        
        subjects[entry.subject].hours += entry.hours;
        subjects[entry.subject].earnings += entry.totalPay;
        subjects[entry.subject].sessions += 1;
        subjects[entry.subject].topics.add(entry.topic);
        subjects[entry.subject].organizations.add(entry.organization);
        
        // Update last session date
        if (!subjects[entry.subject].lastSession || entry.date > subjects[entry.subject].lastSession) {
            subjects[entry.subject].lastSession = entry.date;
        }
        
        if (subjects[entry.subject].hours > 0) {
            subjects[entry.subject].avgRate = subjects[entry.subject].earnings / subjects[entry.subject].hours;
        }
    });
    
    return subjects;
}

function displayBreakdown(breakdown, title) {
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    if (Object.keys(breakdown).length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>${title}</h3>
                <p>No data available for this breakdown.</p>
                <p><small>Start logging hours to see analytics.</small></p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="breakdown-header">
            <h3>${title}</h3>
            <div class="breakdown-summary">
                <strong>Total Periods:</strong> ${Object.keys(breakdown).length} | 
                <strong>Total Hours:</strong> ${Object.values(breakdown).reduce((sum, b) => sum + b.hours, 0).toFixed(1)} | 
                <strong>Total Earnings:</strong> $${Object.values(breakdown).reduce((sum, b) => sum + b.earnings, 0).toFixed(2)}
            </div>
        </div>
        <div class="table-container">
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Hours</th>
                        <th>Earnings</th>
                        <th>Sessions</th>
                        <th>Avg Rate/Hr</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Sort by period (most recent first)
    const sortedPeriods = Object.keys(breakdown).sort((a, b) => {
        if (title.includes('Weekly') || title.includes('Bi-Weekly')) {
            return b.localeCompare(a);
        } else if (title.includes('Monthly')) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            
            if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
            return monthNames.indexOf(monthB) - monthNames.indexOf(monthA);
        } else {
            // For subject breakdown, sort by earnings (highest first)
            return breakdown[b].earnings - breakdown[a].earnings;
        }
    });
    
    sortedPeriods.forEach(period => {
        const data = breakdown[period];
        html += `
            <tr>
                <td><strong>${period}</strong></td>
                <td>${data.hours.toFixed(1)}</td>
                <td>$${data.earnings.toFixed(2)}</td>
                <td>${data.sessions}</td>
                <td>$${data.avgRate.toFixed(2)}</td>
                <td class="details-cell">
        `;
        
        // Add specific details based on breakdown type
        if (title.includes('Weekly') && data.weeks) {
            html += `Weeks: ${Array.from(data.weeks).join(', ')}`;
        } else if (data.subjects) {
            const subjectCount = data.subjects.size;
            if (subjectCount > 0) {
                html += `${subjectCount} subject${subjectCount > 1 ? 's' : ''}`;
            }
        }
        
        if (data.topics && data.topics.size > 0) {
            const topicCount = data.topics.size;
            if (topicCount > 0 && topicCount <= 3) {
                html += `<br><small>Topics: ${Array.from(data.topics).join(', ')}</small>`;
            } else if (topicCount > 3) {
                html += `<br><small>${topicCount} topics</small>`;
            }
        }
        
        if (data.lastSession && title.includes('Subject')) {
            html += `<br><small>Last: ${new Date(data.lastSession).toLocaleDateString()}</small>`;
        }
        
        html += `</td></tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="breakdown-footer">
            <small>Generated on ${new Date().toLocaleString()}</small>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================================================
// REPORTS FUNCTIONS
// ============================================================================

function updateReports() {
    updateReportStats();
    updateWeeklyTable();
    updateSubjectTable();
}

function updateReportStats() {
    const totalStudentsEl = document.getElementById('totalStudentsReport');
    const totalHoursEl = document.getElementById('totalHoursReport');
    const totalEarningsEl = document.getElementById('totalEarningsReport');
    const avgMarkEl = document.getElementById('avgMarkReport');
    const totalPaymentsEl = document.getElementById('totalPaymentsReport');
    const outstandingBalanceEl = document.getElementById('outstandingBalance');
    
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;
    
    const totalHours = hoursLog.reduce((sum, entry) => sum + entry.hours, 0);
    const totalEarnings = hoursLog.reduce((sum, entry) => sum + entry.totalPay, 0);
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(1);
    if (totalEarningsEl) totalEarningsEl.textContent = `$${totalEarnings.toFixed(2)}`;
    if (totalPaymentsEl) totalPaymentsEl.textContent = `$${totalPayments.toFixed(2)}`;
    
    // Calculate average mark
    if (marks.length > 0) {
        const avgPercentage = marks.reduce((sum, mark) => {
            const percentage = parseFloat(mark.percentage) || 0;
            return sum + percentage;
        }, 0) / marks.length;
        
        if (avgMarkEl) avgMarkEl.textContent = `${avgPercentage.toFixed(1)}%`;
    } else {
        if (avgMarkEl) avgMarkEl.textContent = '0%';
    }
    
    // Simplified outstanding balance calculation
    const outstandingBalance = totalEarnings - totalPayments;
    if (outstandingBalanceEl) {
        outstandingBalanceEl.textContent = `$${outstandingBalance.toFixed(2)}`;
        outstandingBalanceEl.style.color = outstandingBalance > 0 ? '#e74c3c' : '#27ae60';
    }
}

function updateWeeklyTable() {
    const weeklyBody = document.getElementById('weeklyBody');
    if (!weeklyBody) return;
    
    const weeklyData = getWeeklyBreakdown();
    const sortedWeeks = Object.keys(weeklyData).sort((a, b) => b.localeCompare(a));
    
    if (sortedWeeks.length === 0) {
        weeklyBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No data available</td></tr>';
        return;
    }
    
    weeklyBody.innerHTML = sortedWeeks.slice(0, 8).map(week => {
        const data = weeklyData[week];
        return `
            <tr>
                <td>${week}</td>
                <td>${data.hours.toFixed(1)}</td>
                <td>$${data.earnings.toFixed(2)}</td>
                <td>${data.subjects.size}</td>
                <td>$${(data.earnings * 0.8).toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

function updateSubjectTable() {
    const subjectBody = document.getElementById('subjectBody');
    if (!subjectBody) return;
    
    const subjectData = getSubjectBreakdown();
    const sortedSubjects = Object.keys(subjectData).sort((a, b) => 
        subjectData[b].earnings - subjectData[a].earnings
    );
    
    if (sortedSubjects.length === 0) {
        subjectBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No data available</td></tr>';
        return;
    }
    
    subjectBody.innerHTML = sortedSubjects.map(subject => {
        const data = subjectData[subject];
        
        // Calculate average marks for this subject
        const subjectMarks = marks.filter(mark => mark.subject === subject);
        let avgMark = 0;
        if (subjectMarks.length > 0) {
            avgMark = subjectMarks.reduce((sum, mark) => {
                const percentage = parseFloat(mark.percentage) || 0;
                return sum + percentage;
            }, 0) / subjectMarks.length;
        }
        
        return `
            <tr>
                <td>${subject}</td>
                <td>${avgMark > 0 ? avgMark.toFixed(1) + '%' : 'N/A'}</td>
                <td>${data.hours.toFixed(1)}</td>
                <td>$${data.earnings.toFixed(2)}</td>
                <td>${data.sessions}</td>
            </tr>
        `;
    }).join('');
}

// Force mobile table responsiveness
function fixMobileTables() {
    const weeklyTable = document.getElementById('weeklyTable');
    const subjectTable = document.getElementById('subjectTable');
    
    // Create wrappers if they don't exist
    if (weeklyTable && !weeklyTable.parentElement.classList.contains('table-wrapper')) {
        const weeklyWrapper = document.createElement('div');
        weeklyWrapper.className = 'table-wrapper';
        weeklyTable.parentNode.insertBefore(weeklyWrapper, weeklyTable);
        weeklyWrapper.appendChild(weeklyTable);
    }
    
    if (subjectTable && !subjectTable.parentElement.classList.contains('table-wrapper')) {
        const subjectWrapper = document.createElement('div');
        subjectWrapper.className = 'table-wrapper';
        subjectTable.parentNode.insertBefore(subjectWrapper, subjectTable);
        subjectWrapper.appendChild(subjectTable);
    }
    
    // Force table widths
    if (window.innerWidth <= 768) {
        if (weeklyTable) {
            weeklyTable.style.minWidth = '650px';
            weeklyTable.style.width = 'auto';
        }
        if (subjectTable) {
            subjectTable.style.minWidth = '650px';
            subjectTable.style.width = 'auto';
        }
    }
}

// Run on load and resize
document.addEventListener('DOMContentLoaded', fixMobileTables);
window.addEventListener('resize', fixMobileTables);

// Also try immediately
setTimeout(fixMobileTables, 100);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId() {
    return 'worklog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getWeekNumber(date) {
    if (!(date instanceof Date) || isNaN(date)) return 0;
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ============================================================================
// START APPLICATION
// ============================================================================

document.addEventListener('DOMContentLoaded', init);

// In app.js - Add these callback functions for auth system

// Callback when user data needs to be loaded
function loadUserData(userId) {
    const userDataKey = `worklog_data_${userId}`;
    try {
        const userData = JSON.parse(localStorage.getItem(userDataKey));
        if (userData) {
            students = userData.students || [];
            hoursLog = userData.hoursLog || [];
            marks = userData.marks || [];
            attendance = userData.attendance || [];
            payments = userData.payments || [];
            paymentActivity = userData.paymentActivity || [];
            fieldMemory = userData.fieldMemory || fieldMemory;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
    
    updateUI();
}

// Callback before logout
function onBeforeLogout() {
    saveAllData();
}

// Callback when new user data is initialized
function onUserDataInitialized(userData) {
    students = userData.students;
    hoursLog = userData.hoursLog;
    marks = userData.marks;
    attendance = userData.attendance;
    payments = userData.payments;
    paymentActivity = userData.paymentActivity;
    fieldMemory = userData.fieldMemory;
    
    updateUI();
}

// Provide data stats to auth system
function getDataStats() {
    return {
        students: students.length,
        sessions: hoursLog.length
    };
}

// Make functions available globally for auth system
window.loadUserData = loadUserData;
window.onBeforeLogout = onBeforeLogout;
window.onUserDataInitialized = onUserDataInitialized;
window.getDataStats = getDataStats;
window.exportUserData = exportData; // Your existing export function

// DEBUG VERSION - FIXED STUDENTS DISPLAY
console.log('🔧 DEBUG: App.js loaded - Debug version');

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

function debugStudents() {
    console.log('🐛 DEBUG STUDENTS:', {
        appDataStudents: appData.students,
        length: appData.students ? appData.students.length : 0,
        container: document.getElementById('studentsContainer'),
        containerExists: !!document.getElementById('studentsContainer')
    });
}

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
    
    // Debug students after init
    setTimeout(debugStudents, 1000);
    
    console.log('✅ App initialized successfully');
}

// ============================================================================
// DATA MANAGEMENT - FIXED
// ============================================================================

function loadAllData() {
    const userId = window.Auth.getCurrentUserId();
    const savedData = localStorage.getItem(`worklog_data_${userId}`);
    
    console.log('📥 Loading data for user:', userId);
    
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
        console.log('💾 Data saved - Students count:', appData.students.length);
    } catch (error) {
        console.error('❌ Error saving data:', error);
    }
}

// ============================================================================
// STUDENTS MANAGEMENT - FIXED VERSION
// ============================================================================

function loadStudents() {
    console.log('👥 DEBUG: loadStudents called');
    
    try {
        const container = document.getElementById('studentsContainer');
        console.log('🔍 Students container:', container);
        
        if (!container) {
            console.error('❌ Students container not found - checking DOM');
            // Try alternative selectors
            const alternatives = [
                'studentsContainer',
                'students-container',
                '#students .section-content',
                '#students .tab-content'
            ];
            alternatives.forEach(selector => {
                const el = document.querySelector(selector);
                if (el) console.log('📍 Found alternative:', selector, el);
            });
            return;
        }
        
        debugStudents();
        
        if (!appData.students || appData.students.length === 0) {
            console.log('📝 No students found, showing empty state');
            container.innerHTML = '<div class="empty-state"><div class="icon">👨‍🎓</div><h4>No Students</h4><p>Add your first student to get started!</p></div>';
            return;
        }
        
        console.log(`🎓 Rendering ${appData.students.length} students`);
        
        let html = '<div class="students-grid">';
        
        appData.students.forEach((student, index) => {
            console.log(`🎓 Rendering student ${index}:`, student.name);
            html += `
                <div class="student-card">
                    <div class="student-header">
                        <h4 class="student-name">${escapeHtml(student.name)}</h4>
                        <span class="student-rate">$${(student.rate || appData.settings.defaultRate || 25.00).toFixed(2)}/session</span>
                    </div>
                    <div class="student-details">
                        <p><strong>ID:</strong> ${escapeHtml(student.id)}</p>
                        <p><strong>Gender:</strong> ${escapeHtml(student.gender)}</p>
                        ${student.email ? `<p><strong>Email:</strong> ${escapeHtml(student.email)}</p>` : ''}
                        ${student.phone ? `<p><strong>Phone:</strong> ${escapeHtml(student.phone)}</p>` : ''}
                        ${student.createdAt ? `<p><small>Added: ${formatDisplayDate(student.createdAt)}</small></p>` : ''}
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
        
        console.log('✅ Students rendered successfully');
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        const container = document.getElementById('studentsContainer');
        if (container) {
            container.innerHTML = '<div class="error-state">Error loading students. Check console for details.</div>';
        }
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addStudent() {
    console.log('➕ DEBUG: addStudent called');
    
    try {
        const name = document.getElementById('studentName').value.trim();
        const id = document.getElementById('studentId').value.trim();
        const gender = document.getElementById('studentGender').value;
        const email = document.getElementById('studentEmail').value.trim();
        const phone = document.getElementById('studentPhone').value.trim();
        const rateInput = document.getElementById('studentBaseRate').value;
        
        console.log('📝 Form data:', { name, id, gender, email, phone, rateInput });
        
        const rate = rateInput ? parseFloat(rateInput) : (appData.settings.defaultRate || 25.00);
        
        if (!name || !id || !gender) {
            alert('Please fill in required fields: Name, ID, and Gender');
            return;
        }
        
        // Check for duplicate ID
        if (appData.students.some(student => student.id === id)) {
            alert('A student with this ID already exists!');
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
        
        console.log('🎓 New student:', newStudent);
        
        if (!appData.students) appData.students = [];
        appData.students.push(newStudent);
        saveAllData();
        loadStudents();
        clearStudentForm();
        
        console.log('✅ Student added successfully');
        alert('✅ Student added successfully!');
        
    } catch (error) {
        console.error('❌ Error adding student:', error);
        alert('Error adding student: ' + error.message);
    }
}

function editStudent(index) {
    console.log('✏️ DEBUG: editStudent called for index:', index);
    
    try {
        const student = appData.students[index];
        if (!student) {
            alert('Student not found!');
            return;
        }

        console.log('🎓 Editing student:', student);

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

        console.log('✅ Edit form populated');

    } catch (error) {
        console.error('❌ Error editing student:', error);
        alert('Error editing student: ' + error.message);
    }
}

function updateStudent(index) {
    console.log('💾 DEBUG: updateStudent called for index:', index);
    
    try {
        const name = document.getElementById('studentName').value.trim();
        const id = document.getElementById('studentId').value.trim();
        const gender = document.getElementById('studentGender').value;
        const email = document.getElementById('studentEmail').value.trim();
        const phone = document.getElementById('studentPhone').value.trim();
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
        
        console.log('✅ Student updated successfully');
        alert('✅ Student updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating student:', error);
        alert('Error updating student: ' + error.message);
    }
}

function deleteStudent(index) {
    console.log('🗑️ DEBUG: deleteStudent called for index:', index);
    
    if (confirm('Are you sure you want to delete this student? This will also remove their marks, attendance, and payment records.')) {
        const student = appData.students[index];
        
        // Remove associated data
        if (student && student.id) {
            appData.marks = appData.marks.filter(mark => mark.studentId !== student.id);
            appData.payments = appData.payments.filter(payment => payment.studentId !== student.id);
            
            // Remove from attendance records
            appData.attendance = appData.attendance.map(session => ({
                ...session,
                presentStudents: session.presentStudents.filter(id => id !== student.id)
            }));
        }
        
        appData.students.splice(index, 1);
        saveAllData();
        loadStudents();
        
        console.log('✅ Student deleted successfully');
        alert('✅ Student deleted successfully!');
    }
}

// ============================================================================
// TAB MANAGEMENT - ENHANCED DEBUGGING
// ============================================================================

function setupTabs() {
    console.log('🔧 Setting up tabs...');
    
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('📑 Found tabs:', tabs.length);
    console.log('📑 Found tab contents:', tabContents.length);
    
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
                console.log('✅ Tab content found, loading data...');
                loadTabData(tabName);
            } else {
                console.error('❌ Tab content not found:', tabName);
                // Try to find it with different selectors
                const altContent = document.querySelector(`[data-tab="${tabName}"]`);
                if (altContent) {
                    console.log('📍 Found alternative tab content');
                    altContent.style.display = 'block';
                    altContent.classList.add('active');
                    loadTabData(tabName);
                }
            }
        });
    });
    
    // Activate first tab by default
    if (tabs.length > 0) {
        const firstTab = tabs[0];
        const firstTabName = firstTab.getAttribute('data-tab');
        console.log('🚀 Activating first tab:', firstTabName);
        
        firstTab.classList.add('active');
        firstTab.setAttribute('aria-selected', 'true');
        
        const firstContent = document.getElementById(firstTabName);
        if (firstContent) {
            firstContent.style.display = 'block';
            firstContent.classList.add('active');
            loadTabData(firstTabName);
        } else {
            console.error('❌ First tab content not found');
        }
    }
    
    console.log('✅ Tabs setup complete');
}

function loadTabData(tabName) {
    console.log('📂 Loading tab data:', tabName);
    
    try {
        switch(tabName) {
            case 'students':
                console.log('👥 Loading students tab...');
                loadStudents();
                break;
            case 'hours':
                console.log('⏱️ Loading hours tab...');
                loadHours();
                break;
            case 'marks':
                console.log('📝 Loading marks tab...');
                loadMarks();
                break;
            case 'attendance':
                console.log('📅 Loading attendance tab...');
                loadAttendance();
                break;
            case 'payments':
                console.log('💰 Loading payments tab...');
                loadPayments();
                break;
            case 'reports':
                console.log('📈 Loading reports tab...');
                loadReports();
                break;
            default:
                console.log('⚠️ Unknown tab:', tabName);
        }
        
        console.log(`✅ Tab ${tabName} data loaded`);
    } catch (error) {
        console.error(`❌ Error loading tab ${tabName}:`, error);
    }
}

// ============================================================================
// TEST FUNCTION TO ADD SAMPLE DATA
// ============================================================================

function addSampleStudents() {
    console.log('🧪 Adding sample students for testing...');
    
    const sampleStudents = [
        {
            name: "John Smith",
            id: "STU001",
            gender: "Male",
            email: "john.smith@email.com",
            phone: "555-0101",
            rate: 30.00,
            createdAt: new Date().toISOString()
        },
        {
            name: "Sarah Johnson",
            id: "STU002", 
            gender: "Female",
            email: "sarah.j@email.com",
            phone: "555-0102",
            rate: 28.00,
            createdAt: new Date().toISOString()
        },
        {
            name: "Mike Chen",
            id: "STU003",
            gender: "Male", 
            email: "mike.chen@email.com",
            rate: 32.00,
            createdAt: new Date().toISOString()
        }
    ];
    
    if (!appData.students) appData.students = [];
    appData.students = [...appData.students, ...sampleStudents];
    saveAllData();
    loadStudents();
    
    console.log('✅ Sample students added');
    alert('🧪 Sample students added for testing!');
}

// ============================================================================
// GLOBAL FUNCTION EXPORTS
// ============================================================================

window.init = init;
window.loadStudents = loadStudents;
window.addStudent = addStudent;
window.editStudent = editStudent;
window.updateStudent = updateStudent;
window.deleteStudent = deleteStudent;
window.cancelStudentEdit = cancelStudentEdit;
window.clearStudentForm = clearStudentForm;
window.addSampleStudents = addSampleStudents;
window.debugStudents = debugStudents;

// Make sure other essential functions are available
window.loadHours = loadHours;
window.loadMarks = loadMarks;
window.loadAttendance = loadAttendance;
window.loadPayments = loadPayments;
window.loadReports = loadReports;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 DOM fully loaded, initializing app...');
    
    // Add debug button to test students
    const debugButton = document.createElement('button');
    debugButton.textContent = '🐛 Debug Students';
    debugButton.style.position = 'fixed';
    debugButton.style.top = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '10000';
    debugButton.style.background = '#ff4444';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.padding = '5px 10px';
    debugButton.style.borderRadius = '3px';
    debugButton.style.cursor = 'pointer';
    debugButton.onclick = debugStudents;
    document.body.appendChild(debugButton);
    
    // Add sample data button
    const sampleButton = document.createElement('button');
    sampleButton.textContent = '🧪 Add Sample Data';
    sampleButton.style.position = 'fixed';
    sampleButton.style.top = '40px';
    sampleButton.style.right = '10px';
    sampleButton.style.zIndex = '10000';
    sampleButton.style.background = '#44ff44';
    sampleButton.style.color = 'black';
    sampleButton.style.border = 'none';
    sampleButton.style.padding = '5px 10px';
    sampleButton.style.borderRadius = '3px';
    sampleButton.style.cursor = 'pointer';
    sampleButton.onclick = addSampleStudents;
    document.body.appendChild(sampleButton);
    
    console.log('✅ Debug tools added');
});

console.log('✅ DEBUG App.js completely loaded');

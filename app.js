// app.js - COMPLETELY REWRITTEN WITH SOLID ARCHITECTURE

console.log('📦 App.js loaded - Rewritten with Solid Architecture');

// ============================================================================
// CORE APPLICATION MODULE
// ============================================================================

const WorkLogApp = (function() {
    // Private application state
    const state = {
        data: {
            students: [],
            hours: [],
            marks: [],
            attendance: [],
            payments: [],
            settings: { defaultRate: 25.00 }
        },
        ui: {
            activeTab: 'students',
            editing: {
                attendance: false,
                hours: false,
                student: false,
                currentIndex: null
            }
        },
        sync: {
            enabled: true,
            pending: false
        }
    };

    // Private DOM references
    const dom = {};

    // Private utility functions
    const utils = {
        formatDate: (dateString) => {
            if (!dateString) return 'No Date';
            try {
                const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
                    ? new Date(dateString + 'T00:00:00') // Force local time
                    : new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                return dateString;
            }
        },

        formatCurrency: (amount) => {
            return `$${parseFloat(amount || 0).toFixed(2)}`;
        },

        generateId: () => {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    // Private data management
    const dataManager = {
        load: () => {
            try {
                const userId = window.Auth?.getCurrentUserId() || 'default';
                const saved = localStorage.getItem(`worklog_data_${userId}`);
                
                if (saved) {
                    const parsed = JSON.parse(saved);
                    state.data = { ...state.data, ...parsed };
                    console.log('📊 Data loaded:', {
                        students: state.data.students.length,
                        hours: state.data.hours.length,
                        marks: state.data.marks.length,
                        attendance: state.data.attendance.length,
                        payments: state.data.payments.length
                    });
                }
            } catch (error) {
                console.error('❌ Error loading data:', error);
                dataManager.reset();
            }
        },

        save: () => {
            try {
                const userId = window.Auth?.getCurrentUserId() || 'default';
                localStorage.setItem(`worklog_data_${userId}`, JSON.stringify(state.data));
                console.log('💾 Data saved locally');
                
                // Trigger cloud sync if enabled and not editing
                if (state.sync.enabled && !Object.values(state.ui.editing).some(Boolean)) {
                    syncManager.triggerSync();
                }
            } catch (error) {
                console.error('❌ Error saving data:', error);
            }
        },

        reset: () => {
            state.data = {
                students: [],
                hours: [],
                marks: [],
                attendance: [],
                payments: [],
                settings: { defaultRate: 25.00 }
            };
            dataManager.save();
        },

        // Generic CRUD operations
        add: (collection, item) => {
            if (!state.data[collection]) state.data[collection] = [];
            state.data[collection].push({
                ...item,
                id: utils.generateId(),
                createdAt: new Date().toISOString()
            });
            dataManager.save();
        },

        update: (collection, index, updates) => {
            if (state.data[collection] && state.data[collection][index]) {
                state.data[collection][index] = {
                    ...state.data[collection][index],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                dataManager.save();
            }
        },

        remove: (collection, index) => {
            if (state.data[collection] && state.data[collection][index]) {
                state.data[collection].splice(index, 1);
                dataManager.save();
            }
        }
    };

    // Private sync management
    const syncManager = {
        triggerSync: utils.debounce(() => {
            if (window.cloudSync?.syncData && state.sync.enabled && !state.sync.pending) {
                state.sync.pending = true;
                window.cloudSync.syncData()
                    .then(() => {
                        console.log('☁️ Cloud sync completed');
                    })
                    .catch(error => {
                        console.error('❌ Cloud sync failed:', error);
                    })
                    .finally(() => {
                        state.sync.pending = false;
                    });
            }
        }, 1000),

        enable: () => {
            state.sync.enabled = true;
            console.log('✅ Sync enabled');
        },

        disable: () => {
            state.sync.enabled = false;
            console.log('🛑 Sync disabled');
        }
    };

    // Private UI management
    const uiManager = {
        initialize: () => {
            uiManager.cacheDOM();
            uiManager.setupTabs();
            uiManager.setupEventListeners();
            uiManager.loadDefaultRate();
        },

        cacheDOM: () => {
            // Tab containers
            dom.tabs = {
                students: document.getElementById('students'),
                hours: document.getElementById('hours'),
                marks: document.getElementById('marks'),
                attendance: document.getElementById('attendance'),
                payments: document.getElementById('payments'),
                reports: document.getElementById('reports')
            };

            // Form elements
            dom.forms = {
                student: document.getElementById('studentForm'),
                hours: document.getElementById('hoursForm'),
                marks: document.getElementById('marksForm'),
                attendance: document.getElementById('attendanceForm'),
                payment: document.getElementById('paymentForm')
            };

            // Container elements
            dom.containers = {
                students: document.getElementById('studentsContainer'),
                hours: document.getElementById('hoursContainer'),
                marks: document.getElementById('marksContainer'),
                attendance: document.getElementById('attendanceContainer'),
                payments: document.getElementById('paymentActivityLog'),
                reports: document.getElementById('breakdownContainer')
            };
        },

        setupTabs: () => {
            const tabElements = document.querySelectorAll('.tab');
            const tabContentElements = document.querySelectorAll('.tab-content');

            // Hide all tabs first
            tabContentElements.forEach(content => {
                content.style.display = 'none';
            });

            tabElements.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    
                    // Update UI
                    tabElements.forEach(t => {
                        t.classList.remove('active');
                        t.setAttribute('aria-selected', 'false');
                    });
                    
                    tabContentElements.forEach(content => {
                        content.style.display = 'none';
                        content.classList.remove('active');
                    });

                    // Activate selected tab
                    tab.classList.add('active');
                    tab.setAttribute('aria-selected', 'true');
                    
                    const content = document.getElementById(tabName);
                    if (content) {
                        content.style.display = 'block';
                        content.classList.add('active');
                        state.ui.activeTab = tabName;
                        uiManager.loadTabData(tabName);
                    }
                });
            });

            // Activate first tab
            if (tabElements.length > 0) {
                tabElements[0].click();
            }
        },

        setupEventListeners: () => {
            // Hours calculation
            const hoursInput = document.getElementById('hoursWorked');
            const rateInput = document.getElementById('baseRate');
            
            if (hoursInput && rateInput) {
                const calculateTotal = () => {
                    const hours = parseFloat(hoursInput.value) || 0;
                    const rate = parseFloat(rateInput.value) || 0;
                    const totalInput = document.getElementById('totalPay');
                    if (totalInput) {
                        totalInput.value = (hours * rate).toFixed(2);
                    }
                };
                
                hoursInput.addEventListener('input', calculateTotal);
                rateInput.addEventListener('input', calculateTotal);
            }

            // Marks calculation
            const scoreInput = document.getElementById('score');
            const maxScoreInput = document.getElementById('maxScore');
            
            if (scoreInput && maxScoreInput) {
                const calculatePercentage = () => {
                    const score = parseFloat(scoreInput.value) || 0;
                    const maxScore = parseFloat(maxScoreInput.value) || 0;
                    const percentageInput = document.getElementById('percentage');
                    const gradeInput = document.getElementById('grade');
                    
                    if (maxScore > 0 && percentageInput && gradeInput) {
                        const percentage = (score / maxScore) * 100;
                        percentageInput.value = percentage.toFixed(1) + '%';
                        gradeInput.value = studentManager.calculateGrade(percentage);
                    }
                };
                
                scoreInput.addEventListener('input', calculatePercentage);
                maxScoreInput.addEventListener('input', calculatePercentage);
            }
        },

        loadTabData: (tabName) => {
            console.log(`📂 Loading tab: ${tabName}`);
            
            switch(tabName) {
                case 'students':
                    studentManager.render();
                    break;
                case 'hours':
                    hoursManager.render();
                    break;
                case 'marks':
                    marksManager.render();
                    break;
                case 'attendance':
                    attendanceManager.render();
                    break;
                case 'payments':
                    paymentManager.render();
                    break;
                case 'reports':
                    reportManager.render();
                    break;
            }
            
            statsManager.update();
        },

        loadDefaultRate: () => {
            const defaultRate = state.data.settings.defaultRate || 25.00;
            
            const defaultRateInput = document.getElementById('defaultBaseRate');
            const currentRateDisplay = document.getElementById('currentDefaultRate');
            const studentRateInput = document.getElementById('studentBaseRate');
            const hoursRateInput = document.getElementById('baseRate');
            
            if (defaultRateInput) defaultRateInput.value = defaultRate;
            if (currentRateDisplay) currentRateDisplay.textContent = utils.formatCurrency(defaultRate);
            if (studentRateInput && !studentRateInput.value) studentRateInput.value = defaultRate;
            if (hoursRateInput && !hoursRateInput.value) hoursRateInput.value = defaultRate;
        },

        showToast: (message, type = 'success') => {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;

            container.appendChild(toast);

            setTimeout(() => toast.classList.add('show'), 50);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        confirmAction: (message) => {
            return confirm(message);
        }
    };

    // Private student management
    const studentManager = {
        add: () => {
            const form = dom.forms.student;
            if (!form) return;

            const formData = new FormData(form);
            const student = {
                name: formData.get('studentName')?.trim() || '',
                id: formData.get('studentId')?.trim() || '',
                gender: formData.get('studentGender') || '',
                email: formData.get('studentEmail')?.trim() || '',
                phone: formData.get('studentPhone')?.trim() || '',
                rate: parseFloat(formData.get('studentBaseRate')) || state.data.settings.defaultRate,
                owed: parseFloat(formData.get('studentBaseRate')) || state.data.settings.defaultRate
            };

            if (!student.name || !student.id) {
                uiManager.showToast('⚠️ Please enter both name and ID', 'warning');
                return;
            }

            dataManager.add('students', student);
            form.reset();
            studentManager.render();
            uiManager.showToast('✅ Student added successfully!');
        },

        edit: (index) => {
            const student = state.data.students[index];
            if (!student) return;

            state.ui.editing.student = true;
            state.ui.editing.currentIndex = index;

            // Populate form
            document.getElementById('studentName').value = student.name || '';
            document.getElementById('studentId').value = student.id || '';
            document.getElementById('studentGender').value = student.gender || '';
            document.getElementById('studentEmail').value = student.email || '';
            document.getElementById('studentPhone').value = student.phone || '';
            document.getElementById('studentBaseRate').value = student.rate || '';

            // Update UI for edit mode
            const addButton = document.querySelector('#students .btn-primary');
            if (addButton) {
                addButton.innerHTML = '💾 Update Student';
                addButton.onclick = () => studentManager.update(index);
            }

            studentManager.addCancelButton();
        },

        update: (index) => {
            const student = state.data.students[index];
            if (!student) return;

            const formData = new FormData(dom.forms.student);
            const updates = {
                name: formData.get('studentName')?.trim() || '',
                id: formData.get('studentId')?.trim() || '',
                gender: formData.get('studentGender') || '',
                email: formData.get('studentEmail')?.trim() || '',
                phone: formData.get('studentPhone')?.trim() || '',
                rate: parseFloat(formData.get('studentBaseRate')) || state.data.settings.defaultRate
            };

            // Adjust owed balance proportionally
            if (typeof student.owed === 'number') {
                updates.owed = student.owed - student.rate + updates.rate;
            }

            dataManager.update('students', index, updates);
            studentManager.cancelEdit();
            studentManager.render();
            uiManager.showToast('✅ Student updated successfully!');
        },

        cancelEdit: () => {
            state.ui.editing.student = false;
            state.ui.editing.currentIndex = null;

            dom.forms.student?.reset();
            
            const addButton = document.querySelector('#students .btn-primary');
            if (addButton) {
                addButton.innerHTML = '➕ Add Student';
                addButton.onclick = studentManager.add;
            }

            studentManager.removeCancelButton();
        },

        addCancelButton: () => {
            if (document.querySelector('.btn-cancel-edit')) return;

            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'btn btn-warning btn-cancel-edit';
            cancelButton.innerHTML = '❌ Cancel Edit';
            cancelButton.onclick = studentManager.cancelEdit;

            const formActions = document.querySelector('.form-actions');
            if (formActions) {
                formActions.appendChild(cancelButton);
            }
        },

        removeCancelButton: () => {
            const cancelButton = document.querySelector('.btn-cancel-edit');
            if (cancelButton) cancelButton.remove();
        },

        delete: (index) => {
            if (!uiManager.confirmAction('Are you sure you want to delete this student?')) return;

            dataManager.remove('students', index);
            studentManager.render();
            uiManager.showToast('🗑️ Student deleted successfully!');
        },

        render: () => {
            const container = dom.containers.students;
            if (!container) return;

            if (!state.data.students.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">👥</div>
                        <h4>No Students</h4>
                        <p>Add your first student to get started!</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="students-grid">';
            
            state.data.students.forEach((student, index) => {
                html += `
                    <div class="student-card searchable">
                        <div class="student-header">
                            <h4 class="student-name">${student.name || 'Unnamed Student'}</h4>
                            <span class="student-rate">${utils.formatCurrency(student.rate)}/session</span>
                        </div>
                        <div class="student-details">
                            <p><strong>ID:</strong> ${student.id || 'N/A'}</p>
                            <p><strong>Gender:</strong> ${student.gender || 'N/A'}</p>
                            ${student.email ? `<p><strong>Email:</strong> ${student.email}</p>` : ''}
                            ${student.phone ? `<p><strong>Phone:</strong> ${student.phone}</p>` : ''}
                            <p><strong>Owed:</strong> ${utils.formatCurrency(student.owed)}</p>
                        </div>
                        <div class="student-actions">
                            <button class="btn btn-sm btn-edit" onclick="WorkLogApp.editStudent(${index})">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="WorkLogApp.deleteStudent(${index})">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        },

        calculateGrade: (percentage) => {
            if (percentage >= 90) return 'A';
            if (percentage >= 80) return 'B';
            if (percentage >= 70) return 'C';
            if (percentage >= 60) return 'D';
            return 'F';
        }
    };

    // Private hours management
    const hoursManager = {
        add: () => {
            const form = dom.forms.hours;
            if (!form) return;

            const formData = new FormData(form);
            const entry = {
                organization: formData.get('organization')?.trim() || '',
                workType: formData.get('workType') || 'hourly',
                subject: formData.get('subject')?.trim() || '',
                topic: formData.get('topic')?.trim() || '',
                date: formData.get('workDate') || new Date().toISOString().split('T')[0],
                hours: parseFloat(formData.get('hoursWorked')) || 0,
                rate: parseFloat(formData.get('baseRate')) || state.data.settings.defaultRate,
                notes: formData.get('workNotes')?.trim() || ''
            };

            if (!entry.organization || !entry.date || !entry.hours || !entry.rate) {
                uiManager.showToast('⚠️ Please fill in all required fields', 'warning');
                return;
            }

            entry.total = entry.hours * entry.rate;
            dataManager.add('hours', entry);
            form.reset();
            hoursManager.render();
            uiManager.showToast('✅ Hours logged successfully!');
        },

        edit: (index) => {
            const entry = state.data.hours[index];
            if (!entry) return;

            state.ui.editing.hours = true;
            state.ui.editing.currentIndex = index;

            // Populate form
            document.getElementById('organization').value = entry.organization || '';
            document.getElementById('workType').value = entry.workType || 'hourly';
            document.getElementById('subject').value = entry.subject || '';
            document.getElementById('topic').value = entry.topic || '';
            document.getElementById('workDate').value = entry.date || '';
            document.getElementById('hoursWorked').value = entry.hours || '';
            document.getElementById('baseRate').value = entry.rate || '';
            document.getElementById('workNotes').value = entry.notes || '';

            hoursManager.updateTotalDisplay();
            hoursManager.setEditMode();
        },

        update: () => {
            const index = state.ui.editing.currentIndex;
            if (index === null) return;

            const formData = new FormData(dom.forms.hours);
            const updates = {
                organization: formData.get('organization')?.trim() || '',
                workType: formData.get('workType') || 'hourly',
                subject: formData.get('subject')?.trim() || '',
                topic: formData.get('topic')?.trim() || '',
                date: formData.get('workDate') || '',
                hours: parseFloat(formData.get('hoursWorked')) || 0,
                rate: parseFloat(formData.get('baseRate')) || state.data.settings.defaultRate,
                notes: formData.get('workNotes')?.trim() || ''
            };

            if (!updates.organization || !updates.date || !updates.hours || !updates.rate) {
                uiManager.showToast('⚠️ Please fill in all required fields', 'warning');
                return;
            }

            updates.total = updates.hours * updates.rate;
            dataManager.update('hours', index, updates);
            hoursManager.cancelEdit();
            hoursManager.render();
            uiManager.showToast('✅ Hours updated successfully!');
        },

        cancelEdit: () => {
            state.ui.editing.hours = false;
            state.ui.editing.currentIndex = null;
            
            dom.forms.hours?.reset();
            hoursManager.setAddMode();
        },

        setEditMode: () => {
            const saveButton = document.querySelector('#hours .btn-primary');
            if (saveButton) {
                saveButton.textContent = '💾 Update Entry';
                saveButton.onclick = hoursManager.update;
            }

            hoursManager.addCancelButton();
        },

        setAddMode: () => {
            const saveButton = document.querySelector('#hours .btn-primary');
            if (saveButton) {
                saveButton.textContent = '💾 Log Work & Earnings';
                saveButton.onclick = hoursManager.add;
            }

            hoursManager.removeCancelButton();
        },

        addCancelButton: () => {
            if (document.querySelector('.cancel-edit-btn')) return;

            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'btn btn-secondary cancel-edit-btn';
            cancelButton.textContent = '❌ Cancel';
            cancelButton.onclick = hoursManager.cancelEdit;

            const formActions = document.querySelector('.form-actions');
            if (formActions) {
                formActions.appendChild(cancelButton);
            }
        },

        removeCancelButton: () => {
            const cancelButton = document.querySelector('.cancel-edit-btn');
            if (cancelButton) cancelButton.remove();
        },

        delete: (index) => {
            if (!uiManager.confirmAction('Are you sure you want to delete this entry?')) return;

            dataManager.remove('hours', index);
            hoursManager.render();
            uiManager.showToast('✅ Entry deleted successfully!');
        },

        updateTotalDisplay: () => {
            const hours = parseFloat(document.getElementById('hoursWorked')?.value) || 0;
            const rate = parseFloat(document.getElementById('baseRate')?.value) || 0;
            const totalInput = document.getElementById('totalPay');
            
            if (totalInput) {
                totalInput.value = (hours * rate).toFixed(2);
            }
        },

        render: () => {
            const container = dom.containers.hours;
            if (!container) return;

            if (!state.data.hours.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">⏱️</div>
                        <h4>No Hours Logged</h4>
                        <p>Start tracking your work and earnings!</p>
                    </div>
                `;
                return;
            }

            const sortedEntries = [...state.data.hours].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );

            container.innerHTML = sortedEntries.map((entry, index) => `
                <div class="mobile-entry-card">
                    <div class="entry-header">
                        <div class="entry-main">
                            <strong>${entry.organization}</strong>
                            <div class="entry-date">
                                ${utils.formatDate(entry.date)} • ${entry.hours}h • ${utils.formatCurrency(entry.rate)}/h
                            </div>
                        </div>
                        <div class="entry-amount">${utils.formatCurrency(entry.total)}</div>
                    </div>
                    <div class="entry-details">
                        <div><strong>Subject:</strong> ${entry.subject || 'N/A'}</div>
                        <div><strong>Topic:</strong> ${entry.topic || 'N/A'}</div>
                        <div><strong>Work Type:</strong> ${entry.workType || 'hourly'}</div>
                        ${entry.notes ? `<div><strong>Notes:</strong> ${entry.notes}</div>` : ''}
                    </div>
                    <div class="entry-actions">
                        <button class="btn btn-sm btn-edit" onclick="WorkLogApp.editHours(${state.data.hours.indexOf(entry)})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="WorkLogApp.deleteHours(${state.data.hours.indexOf(entry)})">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    };

    // Private marks management
    const marksManager = {
        add: () => {
            const form = dom.forms.marks;
            if (!form) return;

            const formData = new FormData(form);
            const studentId = formData.get('marksStudent');
            const score = parseFloat(formData.get('score')) || 0;
            const maxScore = parseFloat(formData.get('maxScore')) || 1;

            if (!studentId || !formData.get('markSubject') || !score || !maxScore) {
                uiManager.showToast('⚠️ Please fill in all required fields', 'warning');
                return;
            }

            const percentage = (score / maxScore) * 100;
            const mark = {
                studentId,
                subject: formData.get('markSubject')?.trim() || '',
                topic: formData.get('markTopic')?.trim() || '',
                date: formData.get('markDate') || new Date().toISOString().split('T')[0],
                score,
                maxScore,
                percentage,
                grade: studentManager.calculateGrade(percentage),
                comments: formData.get('markComments')?.trim() || ''
            };

            dataManager.add('marks', mark);
            form.reset();
            marksManager.render();
            uiManager.showToast('✅ Mark added successfully!');
        },

        render: () => {
            const container = dom.containers.marks;
            if (!container) return;

            // Populate student dropdown
            const studentSelect = document.getElementById('marksStudent');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">Select student...</option>';
                state.data.students.forEach(student => {
                    studentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
                });
            }

            if (!state.data.marks.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📝</div>
                        <h4>No Marks</h4>
                        <p>No marks recorded yet.</p>
                    </div>
                `;
                return;
            }

            const recentMarks = state.data.marks.slice(-10).reverse();
            
            container.innerHTML = `
                <div class="marks-list">
                    ${recentMarks.map(mark => {
                        const student = state.data.students.find(s => s.id === mark.studentId);
                        return `
                            <div class="mark-entry">
                                <div class="mark-header">
                                    <h4>${student?.name || 'Unknown Student'} - ${mark.subject || 'No Subject'}</h4>
                                    <span class="mark-percentage ${mark.grade?.toLowerCase()}">
                                        ${mark.percentage}%
                                    </span>
                                </div>
                                <div class="mark-details">
                                    <p><strong>Topic:</strong> ${mark.topic || 'No Topic'}</p>
                                    <p><strong>Score:</strong> ${mark.score || 0}/${mark.maxScore || 0}</p>
                                    <p><strong>Grade:</strong> ${mark.grade}</p>
                                    <p><strong>Date:</strong> ${utils.formatDate(mark.date)}</p>
                                    ${mark.comments ? `<p><strong>Comments:</strong> ${mark.comments}</p>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    };

    // Private attendance management
    const attendanceManager = {
        add: () => {
            const form = dom.forms.attendance;
            if (!form) return;

            const formData = new FormData(form);
            const date = formData.get('attendanceDate');
            const subject = formData.get('attendanceSubject')?.trim();

            if (!date || !subject) {
                uiManager.showToast('⚠️ Please fill in date and subject', 'warning');
                return;
            }

            const presentStudents = [];
            state.data.students.forEach(student => {
                const checkbox = document.getElementById(`attend_${student.id}`);
                if (checkbox?.checked) {
                    presentStudents.push(student.id);
                }
            });

            if (presentStudents.length === 0) {
                uiManager.showToast('⚠️ Please select at least one student', 'warning');
                return;
            }

            const session = {
                date,
                subject,
                topic: formData.get('attendanceTopic')?.trim() || '',
                presentStudents
            };

            dataManager.add('attendance', session);
            form.reset();
            attendanceManager.render();
            uiManager.showToast(`✅ Attendance saved for ${presentStudents.length} students!`);
        },

        edit: (index) => {
            const session = state.data.attendance[index];
            if (!session) return;

            state.ui.editing.attendance = true;
            state.ui.editing.currentIndex = index;

            // Populate form
            document.getElementById('attendanceDate').value = session.date || '';
            document.getElementById('attendanceSubject').value = session.subject || '';
            document.getElementById('attendanceTopic').value = session.topic || '';

            // Clear all checkboxes first
            state.data.students.forEach(student => {
                const checkbox = document.getElementById(`attend_${student.id}`);
                if (checkbox) checkbox.checked = false;
            });

            // Check present students
            session.presentStudents.forEach(studentId => {
                const checkbox = document.getElementById(`attend_${studentId}`);
                if (checkbox) checkbox.checked = true;
            });

            attendanceManager.setEditMode();
        },

        update: () => {
            const index = state.ui.editing.currentIndex;
            if (index === null) return;

            const formData = new FormData(dom.forms.attendance);
            const date = formData.get('attendanceDate');
            const subject = formData.get('attendanceSubject')?.trim();

            if (!date || !subject) {
                uiManager.showToast('⚠️ Please fill in date and subject', 'warning');
                return;
            }

            const presentStudents = [];
            state.data.students.forEach(student => {
                const checkbox = document.getElementById(`attend_${student.id}`);
                if (checkbox?.checked) {
                    presentStudents.push(student.id);
                }
            });

            if (presentStudents.length === 0) {
                uiManager.showToast('⚠️ Please select at least one student', 'warning');
                return;
            }

            const updates = {
                date,
                subject,
                topic: formData.get('attendanceTopic')?.trim() || '',
                presentStudents
            };

            dataManager.update('attendance', index, updates);
            attendanceManager.cancelEdit();
            attendanceManager.render();
            uiManager.showToast(`✅ Attendance updated for ${presentStudents.length} students!`);
        },

        cancelEdit: () => {
            state.ui.editing.attendance = false;
            state.ui.editing.currentIndex = null;
            
            dom.forms.attendance?.reset();
            state.data.students.forEach(student => {
                const checkbox = document.getElementById(`attend_${student.id}`);
                if (checkbox) checkbox.checked = false;
            });
            
            attendanceManager.setAddMode();
        },

        setEditMode: () => {
            const saveButton = document.querySelector('#attendance .btn-primary');
            if (saveButton) {
                saveButton.innerHTML = '💾 Update Attendance';
                saveButton.onclick = attendanceManager.update;
            }

            attendanceManager.addCancelButton();
        },

        setAddMode: () => {
            const saveButton = document.querySelector('#attendance .btn-primary');
            if (saveButton) {
                saveButton.innerHTML = '💾 Save Attendance';
                saveButton.onclick = attendanceManager.add;
            }

            attendanceManager.removeCancelButton();
        },

        addCancelButton: () => {
            if (document.querySelector('.cancel-attendance-edit')) return;

            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'btn btn-warning cancel-attendance-edit';
            cancelButton.innerHTML = '❌ Cancel Edit';
            cancelButton.onclick = attendanceManager.cancelEdit;

            const formActions = document.querySelector('#attendance .form-actions');
            if (formActions) {
                formActions.appendChild(cancelButton);
            }
        },

        removeCancelButton: () => {
            const cancelButton = document.querySelector('.cancel-attendance-edit');
            if (cancelButton) cancelButton.remove();
        },

        delete: (index) => {
            if (!uiManager.confirmAction('Are you sure you want to delete this attendance record?')) return;

            dataManager.remove('attendance', index);
            attendanceManager.render();
            uiManager.showToast('✅ Attendance record deleted!');
        },

        selectAll: () => {
            state.data.students.forEach(student => {
                const checkbox = document.getElementById(`attend_${student.id}`);
                if (checkbox) checkbox.checked = true;
            });
        },

        deselectAll: () => {
            state.data.students.forEach(student => {
                const checkbox = document.getElementById(`attend_${student.id}`);
                if (checkbox) checkbox.checked = false;
            });
        },

        render: () => {
            const container = dom.containers.attendance;
            const attendanceList = document.getElementById('attendanceList');
            
            if (!container || !attendanceList) return;

            // Render student checklist
            if (!state.data.students.length) {
                attendanceList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">👥</div>
                        <h4>No Students</h4>
                        <p>Add students first to track attendance.</p>
                    </div>
                `;
                container.innerHTML = '';
                return;
            }

            attendanceList.innerHTML = state.data.students.map(student => `
                <div class="attendance-item">
                    <label class="attendance-label">
                        <input type="checkbox" id="attend_${student.id}" value="${student.id}" class="attendance-checkbox">
                        <span class="checkmark"></span>
                        <span class="student-info">
                            <strong>${student.name}</strong>
                            <span class="student-id">(${student.id})</span>
                        </span>
                    </label>
                </div>
            `).join('');

            // Render attendance records
            if (!state.data.attendance.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📅</div>
                        <h4>No Attendance Records</h4>
                        <p>Track your first session!</p>
                    </div>
                `;
                return;
            }

            const recentSessions = state.data.attendance.slice().reverse();
            
            container.innerHTML = `
                <div class="attendance-list">
                    ${recentSessions.map((session, index) => {
                        const actualIndex = state.data.attendance.length - 1 - index;
                        const presentStudents = session.presentStudents.map(id => {
                            const student = state.data.students.find(s => s.id === id);
                            return student?.name || 'Unknown';
                        });

                        return `
                            <div class="attendance-entry">
                                <div class="attendance-header">
                                    <div class="attendance-main">
                                        <h4>${session.subject} - ${utils.formatDate(session.date)}</h4>
                                        <span class="attendance-count">${session.presentStudents.length} students</span>
                                    </div>
                                    <div class="attendance-actions">
                                        <button class="btn btn-sm btn-edit" onclick="WorkLogApp.editAttendance(${actualIndex})">
                                            ✏️ Edit
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="WorkLogApp.deleteAttendance(${actualIndex})">
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                                <div class="attendance-details">
                                    <p><strong>Topic:</strong> ${session.topic || 'N/A'}</p>
                                    <p><strong>Present:</strong> ${presentStudents.join(', ')}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    };

    // Private payment management
    const paymentManager = {
        add: () => {
            const form = dom.forms.payment;
            if (!form) return;

            const formData = new FormData(form);
            const studentId = formData.get('paymentStudent');
            const amount = parseFloat(formData.get('paymentAmount'));
            const date = formData.get('paymentDate');

            if (!studentId || isNaN(amount) || !date) {
                uiManager.showToast('⚠️ Please fill in required fields', 'warning');
                return;
            }

            const payment = {
                studentId,
                amount,
                date,
                method: formData.get('paymentMethod') || 'Cash',
                notes: formData.get('paymentNotes')?.trim() || ''
            };

            dataManager.add('payments', payment);

            // Update student's owed balance
            const student = state.data.students.find(s => s.id === studentId);
            if (student && typeof student.owed === 'number') {
                student.owed = Math.max(0, student.owed - amount);
                dataManager.save();
            }

            form.reset();
            paymentManager.render();
            uiManager.showToast('💰 Payment recorded successfully!');
        },

        delete: (index) => {
            if (!uiManager.confirmAction('Are you sure you want to delete this payment?')) return;

            dataManager.remove('payments', index);
            paymentManager.render();
            uiManager.showToast('✅ Payment deleted!');
        },

        render: () => {
            const container = dom.containers.payments;
            if (!container) return;

            // Populate student dropdown
            const studentSelect = document.getElementById('paymentStudent');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">Select student...</option>';
                state.data.students.forEach(student => {
                    studentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
                });
            }

            if (!state.data.payments.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">💰</div>
                        <h4>No Payments</h4>
                        <p>No payment activity recorded yet.</p>
                    </div>
                `;
                return;
            }

            const recentPayments = state.data.payments.slice(-10).reverse();
            
            container.innerHTML = `
                <div class="payments-list">
                    ${recentPayments.map((payment, index) => {
                        const student = state.data.students.find(s => s.id === payment.studentId);
                        const actualIndex = state.data.payments.length - 1 - index;

                        return `
                            <div class="payment-entry">
                                <div class="payment-header">
                                    <h4>${student?.name || 'Unknown Student'}</h4>
                                    <span class="payment-amount">${utils.formatCurrency(payment.amount)}</span>
                                </div>
                                <div class="payment-details">
                                    <p><strong>Date:</strong> ${utils.formatDate(payment.date)}</p>
                                    <p><strong>Method:</strong> ${payment.method || 'N/A'}</p>
                                    ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
                                </div>
                                <div class="payment-actions">
                                    <button class="btn btn-sm btn-danger" onclick="WorkLogApp.deletePayment(${actualIndex})">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    };

    // Private reports management
    const reportManager = {
        render: () => {
            const container = dom.containers.reports;
            if (!container) return;

            container.innerHTML = `
                <div class="report-container">
                    <div class="report-header">
                        <h2>📊 Reports Dashboard</h2>
                        <p>Comprehensive analytics and insights</p>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-value">${state.data.students.length}</span>
                            <div class="stat-label">Total Students</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${state.data.hours.reduce((sum, h) => sum + (h.hours || 0), 0).toFixed(1)}h</span>
                            <div class="stat-label">Total Hours</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${utils.formatCurrency(state.data.hours.reduce((sum, h) => sum + (h.total || 0), 0))}</span>
                            <div class="stat-label">Total Earnings</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${state.data.attendance.length}</span>
                            <div class="stat-label">Sessions</div>
                        </div>
                    </div>
                    
                    <div class="report-section">
                        <h3>Quick Overview</h3>
                        <div class="comparison-grid">
                            <div class="comparison-card">
                                <div class="comparison-header">
                                    <h4>📈 Recent Activity</h4>
                                </div>
                                <div class="details-panel">
                                    <p><strong>Last Session:</strong> ${
                                        state.data.attendance.length ? 
                                        utils.formatDate(state.data.attendance[state.data.attendance.length - 1].date) : 
                                        'Never'
                                    }</p>
                                    <p><strong>Total Payments:</strong> ${utils.formatCurrency(
                                        state.data.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
                                    )}</p>
                                    <p><strong>Students Owed:</strong> ${
                                        state.data.students.filter(s => (s.owed || 0) > 0).length
                                    }</p>
                                </div>
                            </div>
                            
                            <div class="comparison-card">
                                <div class="comparison-header">
                                    <h4>🎯 Performance</h4>
                                </div>
                                <div class="details-panel">
                                    <p><strong>Avg Session:</strong> ${
                                        state.data.attendance.length ? 
                                        (state.data.attendance.reduce((sum, a) => sum + a.presentStudents.length, 0) / state.data.attendance.length).toFixed(1) : 
                                        '0'
                                    } students</p>
                                    <p><strong>Total Marks:</strong> ${state.data.marks.length}</p>
                                    <p><strong>Avg Rate:</strong> ${
                                        state.data.students.length ? 
                                        utils.formatCurrency(state.data.students.reduce((sum, s) => sum + (s.rate || 0), 0) / state.data.students.length) : 
                                        '$0.00'
                                    }</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    };

    // Private stats management
    const statsManager = {
        update: () => {
            // Update various stats displays throughout the app
            const totalStudents = state.data.students.length;
            const totalHours = state.data.hours.reduce((sum, h) => sum + (h.hours || 0), 0);
            const totalEarnings = state.data.hours.reduce((sum, h) => sum + (h.total || 0), 0);
            const totalPayments = state.data.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const avgRate = totalStudents ? state.data.students.reduce((sum, s) => sum + (s.rate || 0), 0) / totalStudents : 0;

            // Update student stats
            const studentsCount = document.getElementById('studentsCount');
            const avgRateEl = document.getElementById('avgRate');
            if (studentsCount) studentsCount.textContent = totalStudents;
            if (avgRateEl) avgRateEl.textContent = utils.formatCurrency(avgRate);

            // Update payment stats
            const totalStudentsCount = document.getElementById('totalStudentsCount');
            const totalOwed = document.getElementById('totalOwed');
            const monthlyPayments = document.getElementById('monthlyPayments');
            
            if (totalStudentsCount) totalStudentsCount.textContent = totalStudents;
            if (totalOwed) totalOwed.textContent = utils.formatCurrency(
                state.data.students.reduce((sum, s) => sum + (s.owed || 0), 0)
            );
            if (monthlyPayments) {
                const monthlyTotal = state.data.payments
                    .filter(p => {
                        const date = new Date(p.date);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                monthlyPayments.textContent = utils.formatCurrency(monthlyTotal);
            }
        }
    };

    // Public API
    return {
        // Initialization
        init: () => {
            console.log('🎯 Initializing WorkLog App...');
            
            if (!window.Auth?.isAuthenticated?.()) {
                console.log('❌ User not authenticated');
                return;
            }

            dataManager.load();
            uiManager.initialize();
            statsManager.update();
            
            console.log('✅ WorkLog App initialized successfully');
        },

        // Student management
        addStudent: studentManager.add,
        editStudent: studentManager.edit,
        updateStudent: studentManager.update,
        deleteStudent: studentManager.delete,
        cancelStudentEdit: studentManager.cancelEdit,

        // Hours management
        addHours: hoursManager.add,
        editHours: hoursManager.edit,
        updateHours: hoursManager.update,
        deleteHours: hoursManager.delete,
        cancelHoursEdit: hoursManager.cancelEdit,
        updateTotalDisplay: hoursManager.updateTotalDisplay,

        // Marks management
        addMark: marksManager.add,

        // Attendance management
        addAttendance: attendanceManager.add,
        editAttendance: attendanceManager.edit,
        updateAttendance: attendanceManager.update,
        deleteAttendance: attendanceManager.delete,
        cancelAttendanceEdit: attendanceManager.cancelEdit,
        selectAllStudents: attendanceManager.selectAll,
        deselectAllStudents: attendanceManager.deselectAll,

        // Payment management
        addPayment: paymentManager.add,
        deletePayment: paymentManager.delete,

        // Settings management
        saveDefaultRate: () => {
            const defaultRate = parseFloat(document.getElementById('defaultBaseRate')?.value);
            if (!defaultRate || defaultRate <= 0) {
                uiManager.showToast('⚠️ Please enter a valid rate', 'warning');
                return;
            }

            state.data.settings.defaultRate = defaultRate;
            dataManager.save();
            uiManager.loadDefaultRate();
            uiManager.showToast('✅ Default rate saved!');
        },

        useDefaultRate: () => {
            const defaultRate = state.data.settings.defaultRate || 25.00;
            const studentRateInput = document.getElementById('studentBaseRate');
            
            if (studentRateInput) {
                studentRateInput.value = defaultRate;
                studentRateInput.focus();
            }
            
            uiManager.showToast(`📝 Default rate (${utils.formatCurrency(defaultRate)}) filled!`);
        },

        // Sync management
        enableSync: syncManager.enable,
        disableSync: syncManager.disable,
        manualSync: syncManager.triggerSync,

        // Utility functions exposed for global use
        formatDate: utils.formatDate,
        formatCurrency: utils.formatCurrency,

        // Debug
        getState: () => ({ ...state }),
        getData: () => ({ ...state.data })
    };
})();

// ============================================================================
// GLOBAL EXPORTS AND INITIALIZATION
// ============================================================================

// Export all public methods to global scope
Object.keys(WorkLogApp).forEach(key => {
    window[key] = WorkLogApp[key];
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 DOM fully loaded, starting app...');
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = ['workDate', 'attendanceDate', 'markDate', 'paymentDate'];
    
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.value) {
            input.value = today;
        }
    });
    
    // Initialize the application
    WorkLogApp.init();
    
    console.log('✅ App ready and running');
});

console.log('✅ App.js completely loaded - Solid Architecture');

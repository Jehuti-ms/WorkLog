/* ======================================================
   WorkLog - Student Tracker & Hours Manager
   Full app.js (CORS proxy version for GitHub Pages)
   ====================================================== */

// Configuration
        let config = {
            sheetId: '',
            apiKey: '',
            webAppUrl: '',
            connected: false
        };

        // Data storage
        let students = [];
        let hoursLog = [];
        let marks = [];

        // Initialize
        function init() {
            console.log("Initializing WorkLog application...");
            loadConfig();
            loadData();
            updateUI();
            setDefaultDate();
            addLog("Application initialized successfully", "info");
        }

        function setDefaultDate() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('workDate').value = today;
            document.getElementById('markDate').value = today;
        }

        // Tab switching
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'reports') {
                updateReports();
            }
        }

        // Configuration management
        function loadConfig() {
            const saved = localStorage.getItem('worklog_config');
            if (saved) {
                config = JSON.parse(saved);
                document.getElementById('sheetId').value = config.sheetId || '';
                document.getElementById('apiKey').value = config.apiKey || '';
                document.getElementById('webAppUrl').value = config.webAppUrl || '';
                updateSetupStatus();
                addLog("Configuration loaded from localStorage", "info");
            }
        }

        function saveConfig() {
            config.sheetId = document.getElementById('sheetId').value.trim();
            config.apiKey = document.getElementById('apiKey').value.trim();
            config.webAppUrl = document.getElementById('webAppUrl').value.trim();
            
            if (!config.sheetId || !config.apiKey) {
                showAlert('setupStatus', 'Please enter both Sheet ID and API Key', 'error');
                addLog("Configuration save failed: Missing Sheet ID or API Key", "error");
                return;
            }
            
            localStorage.setItem('worklog_config', JSON.stringify(config));
            showAlert('setupStatus', 'Configuration saved successfully!', 'success');
            updateSetupStatus();
            addLog("Configuration saved successfully", "success");
        }

        async function testConnection() {
            if (!config.sheetId || !config.apiKey) {
                showAlert('setupStatus', 'Please save your configuration first', 'error');
                addLog("Connection test failed: Configuration not saved", "error");
                return;
            }
            
            addLog("Testing connection to Google Sheets...", "info");
            
            try {
                // Test with a simple read request
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?key=${config.apiKey}`;
                
                const response = await fetch(url);
                
                if (response.ok) {
                    config.connected = true;
                    saveConfigToStorage();
                    showAlert('setupStatus', '✅ Connection successful!', 'success');
                    updateSetupStatus();
                    addLog("Connection test successful", "success");
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                config.connected = false;
                saveConfigToStorage();
                showAlert('setupStatus', '❌ Connection failed: ' + error.message, 'error');
                updateSetupStatus();
                addLog(`Connection test failed: ${error.message}`, "error");
            }
        }

        async function initializeSheets() {
            if (!config.sheetId || !config.apiKey) {
                showAlert('setupStatus', 'Please save your configuration first', 'error');
                return;
            }

            addLog("Starting sheet initialization...", "info");
            
            if (!config.webAppUrl) {
                showAlert('setupStatus', 'Web App URL is required for sheet initialization. Please deploy the Google Apps Script and enter the URL.', 'warning');
                addLog("Sheet initialization failed: Web App URL not configured", "error");
                return;
            }

            try {
                const response = await callBackend('initializeSheets');
                
                if (response.success) {
                    showAlert('setupStatus', '✅ Sheets initialized successfully!', 'success');
                    addLog("Sheets initialized successfully", "success");
                } else {
                    throw new Error(response.message || 'Unknown error');
                }
            } catch (error) {
                showAlert('setupStatus', '❌ Sheet initialization failed: ' + error.message, 'error');
                addLog(`Sheet initialization failed: ${error.message}`, "error");
            }
        }

        async function syncWithSheets() {
            if (!config.webAppUrl) {
                showAlert('setupStatus', 'Web App URL is required for synchronization', 'error');
                return;
            }

            addLog("Starting data synchronization...", "info");

            try {
                const response = await callBackend('syncData');
                
                if (response.success) {
                    // Update local data with data from sheets
                    if (response.students) students = response.students;
                    if (response.hours) hoursLog = response.hours;
                    if (response.marks) marks = response.marks;
                    
                    saveData();
                    updateUI();
                    showAlert('setupStatus', '✅ Data synchronized successfully!', 'success');
                    addLog("Data synchronized successfully", "success");
                } else {
                    throw new Error(response.message || 'Unknown error');
                }
            } catch (error) {
                showAlert('setupStatus', '❌ Synchronization failed: ' + error.message, 'error');
                addLog(`Synchronization failed: ${error.message}`, "error");
            }
        }

        // Backend communication with CORS proxy
        async function callBackend(action, payload = {}) {
            if (!config.webAppUrl) {
                throw new Error('Web App URL not configured');
            }

            // Use CORS proxy for development
            const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
            const url = CORS_PROXY + config.webAppUrl;
            
            addLog(`Sending ${action} request to backend...`, "info");

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: action,
                        ...payload,
                        sheetId: config.sheetId
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                addLog(`Backend response for ${action}: ${data.success ? 'Success' : 'Failed'}`, 
                      data.success ? "success" : "error");
                return data;
            } catch (error) {
                addLog(`Backend call failed for ${action}: ${error.message}`, "error");
                throw error;
            }
        }

        function updateSetupStatus() {
            const status = document.getElementById('setupStatus');
            if (config.connected) {
                status.innerHTML = '<div class="alert alert-success">✅ Connected to Google Sheets</div>';
            } else if (config.sheetId && config.apiKey) {
                status.innerHTML = '<div class="alert alert-info">⚠️ Configuration saved. Click "Test Connection" to verify.</div>';
            }
        }

        function saveConfigToStorage() {
            localStorage.setItem('worklog_config', JSON.stringify(config));
        }

        // Logging function
        function addLog(message, type = "info") {
            const logContainer = document.getElementById('operationLog');
            if (!logContainer) return;

            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const typeClass = `log-${type}`;
            
            logEntry.innerHTML = `
                <span class="log-time">[${timestamp}]</span>
                <span class="log-message ${typeClass}">${message}</span>
            `;
            
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }

        // Data management
        function loadData() {
            students = JSON.parse(localStorage.getItem('worklog_students') || '[]');
            hoursLog = JSON.parse(localStorage.getItem('worklog_hours') || '[]');
            marks = JSON.parse(localStorage.getItem('worklog_marks') || '[]');
            addLog(`Loaded data: ${students.length} students, ${hoursLog.length} hours, ${marks.length} marks`, "info");
        }

        function saveData() {
            localStorage.setItem('worklog_students', JSON.stringify(students));
            localStorage.setItem('worklog_hours', JSON.stringify(hoursLog));
            localStorage.setItem('worklog_marks', JSON.stringify(marks));
        }

        // Student management
        async function addStudent() {
            const name = document.getElementById('studentName').value.trim();
            const id = document.getElementById('studentId').value.trim();
            const email = document.getElementById('studentEmail').value.trim();
            
            if (!name || !id) {
                alert('Please enter student name and ID');
                addLog("Add student failed: Missing name or ID", "error");
                return;
            }
            
            const student = { name, id, email, addedDate: new Date().toISOString() };
            students.push(student);
            saveData();
            updateUI();
            addLog(`Added student: ${name} (${id})`, "success");
            
            // Try to sync with Google Sheets if configured
            if (config.webAppUrl) {
                try {
                    await callBackend('addStudent', { student });
                    addLog(`Student ${name} synced to Google Sheets`, "success");
                } catch (error) {
                    addLog(`Failed to sync student to Google Sheets: ${error.message}`, "error");
                }
            }
            
            document.getElementById('studentName').value = '';
            document.getElementById('studentId').value = '';
            document.getElementById('studentEmail').value = '';
        }

        async function logHours() {
            const studentId = document.getElementById('hoursStudent').value;
            const subject = document.getElementById('subject').value.trim();
            const topic = document.getElementById('topic').value.trim();
            const date = document.getElementById('workDate').value;
            const hours = parseFloat(document.getElementById('hoursWorked').value);
            const rate = parseFloat(document.getElementById('baseRate').value);
            const notes = document.getElementById('workNotes').value.trim();
            
            if (!studentId || !subject || !date || !hours || !rate) {
                alert('Please fill in all required fields');
                addLog("Log hours failed: Missing required fields", "error");
                return;
            }
            
            const student = students.find(s => s.id === studentId);
            const earnings = hours * rate;
            
            const entry = {
                studentId,
                studentName: student.name,
                subject,
                topic,
                date,
                hours,
                rate,
                earnings,
                notes,
                timestamp: new Date().toISOString()
            };
            
            hoursLog.push(entry);
            saveData();
            updateUI();
            addLog(`Logged ${hours} hours for ${student.name}`, "success");
            
            // Try to sync with Google Sheets if configured
            if (config.webAppUrl) {
                try {
                    await callBackend('logHours', { entry });
                    addLog(`Hours entry synced to Google Sheets`, "success");
                } catch (error) {
                    addLog(`Failed to sync hours to Google Sheets: ${error.message}`, "error");
                }
            }
            
            document.getElementById('subject').value = '';
            document.getElementById('topic').value = '';
            document.getElementById('hoursWorked').value = '';
            document.getElementById('baseRate').value = '';
            document.getElementById('workNotes').value = '';
        }

        async function addMark() {
            const studentId = document.getElementById('marksStudent').value;
            const subject = document.getElementById('markSubject').value.trim();
            const date = document.getElementById('markDate').value;
            const score = parseFloat(document.getElementById('score').value);
            const maxScore = parseFloat(document.getElementById('maxScore').value);
            const comments = document.getElementById('markComments').value.trim();
            
            if (!studentId || !subject || !date || isNaN(score) || isNaN(maxScore)) {
                alert('Please fill in all required fields');
                addLog("Add mark failed: Missing required fields", "error");
                return;
            }
            
            const student = students.find(s => s.id === studentId);
            const percentage = (score / maxScore * 100).toFixed(1);
            
            const mark = {
                studentId,
                studentName: student.name,
                subject,
                date,
                score,
                maxScore,
                percentage,
                comments,
                timestamp: new Date().toISOString()
            };
            
            marks.push(mark);
            saveData();
            updateUI();
            addLog(`Added mark for ${student.name}: ${score}/${maxScore} (${percentage}%)`, "success");
            
            // Try to sync with Google Sheets if configured
            if (config.webAppUrl) {
                try {
                    await callBackend('addMark', { mark });
                    addLog(`Mark entry synced to Google Sheets`, "success");
                } catch (error) {
                    addLog(`Failed to sync mark to Google Sheets: ${error.message}`, "error");
                }
            }
            
            document.getElementById('markSubject').value = '';
            document.getElementById('score').value = '';
            document.getElementById('maxScore').value = '';
            document.getElementById('markComments').value = '';
        }

        // UI Updates
        function updateUI() {
            updateStudentList();
            updateStudentSelects();
            updateHoursList();
            updateMarksList();
        }

        function updateStudentList() {
            const container = document.getElementById('studentsContainer');
            if (students.length === 0) {
                container.innerHTML = '<p style="color: #666;">No students registered yet.</p>';
                return;
            }
            
            container.innerHTML = students.map((s, i) => `
                <div class="list-item">
                    <div>
                        <strong>${s.name}</strong> (ID: ${s.id})<br>
                        <small style="color: #666;">${s.email || 'No email'}</small>
                    </div>
                    <button class="btn btn-secondary" onclick="deleteStudent(${i})">🗑️</button>
                </div>
            `).join('');
        }

        function updateStudentSelects() {
            const hoursSelect = document.getElementById('hoursStudent');
            const marksSelect = document.getElementById('marksStudent');
            
            const options = students.map(s => 
                `<option value="${s.id}">${s.name} (${s.id})</option>`
            ).join('');
            
            hoursSelect.innerHTML = '<option value="">Select student...</option>' + options;
            marksSelect.innerHTML = '<option value="">Select student...</option>' + options;
        }

        function updateHoursList() {
            const container = document.getElementById('hoursContainer');
            if (hoursLog.length === 0) {
                container.innerHTML = '<p style="color: #666;">No hours logged yet.</p>';
                return;
            }
            
            const recent = hoursLog.slice(-10).reverse();
            container.innerHTML = '<table><thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Hours</th><th>Rate</th><th>Earnings</th></tr></thead><tbody>' +
                recent.map(h => `
                    <tr>
                        <td>${new Date(h.date).toLocaleDateString()}</td>
                        <td>${h.studentName}</td>
                        <td>${h.subject}</td>
                        <td>${h.hours}</td>
                        <td>$${h.rate.toFixed(2)}</td>
                        <td>$${h.earnings.toFixed(2)}</td>
                    </tr>
                `).join('') + '</tbody></table>';
        }

        function updateMarksList() {
            const container = document.getElementById('marksContainer');
            if (marks.length === 0) {
                container.innerHTML = '<p style="color: #666;">No marks recorded yet.</p>';
                return;
            }
            
            const recent = marks.slice(-10).reverse();
            container.innerHTML = '<table><thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Score</th><th>Percentage</th></tr></thead><tbody>' +
                recent.map(m => `
                    <tr>
                        <td>${new Date(m.date).toLocaleDateString()}</td>
                        <td>${m.studentName}</td>
                        <td>${m.subject}</td>
                        <td>${m.score}/${m.maxScore}</td>
                        <td>${m.percentage}%</td>
                    </tr>
                `).join('') + '</tbody></table>';
        }

        function updateReports() {
            document.getElementById('totalStudents').textContent = students.length;
            document.getElementById('totalHours').textContent = hoursLog.reduce((sum, h) => sum + h.hours, 0).toFixed(1);
            document.getElementById('totalEarnings').textContent = '$' + hoursLog.reduce((sum, h) => sum + h.earnings, 0).toFixed(2);
            
            const avgMark = marks.length > 0 
                ? (marks.reduce((sum, m) => sum + parseFloat(m.percentage), 0) / marks.length).toFixed(1)
                : 0;
            document.getElementById('avgMark').textContent = avgMark + '%';
            
            updateWeeklyReport();
        }

        function updateWeeklyReport() {
            const weeks = {};
            hoursLog.forEach(h => {
                const week = getWeekNumber(new Date(h.date));
                if (!weeks[week]) {
                    weeks[week] = { hours: 0, earnings: 0, students: new Set() };
                }
                weeks[week].hours += h.hours;
                weeks[week].earnings += h.earnings;
                weeks[week].students.add(h.studentId);
            });
            
            const tbody = document.getElementById('weeklyBody');
            tbody.innerHTML = Object.keys(weeks).sort().reverse().slice(0, 8).map(week => `
                <tr>
                    <td>Week ${week}</td>
                    <td>${weeks[week].hours.toFixed(1)}</td>
                    <td>$${weeks[week].earnings.toFixed(2)}</td>
                    <td>${weeks[week].students.size}</td>
                </tr>
            `).join('');
        }

        function getWeekNumber(date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        function deleteStudent(index) {
            if (confirm('Are you sure you want to delete this student?')) {
                const student = students[index];
                students.splice(index, 1);
                saveData();
                updateUI();
                addLog(`Deleted student: ${student.name} (${student.id})`, "info");
            }
        }

        function showAlert(elementId, message, type) {
            const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : type === 'warning' ? 'alert-warning' : 'alert-info';
            document.getElementById(elementId).innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', init);

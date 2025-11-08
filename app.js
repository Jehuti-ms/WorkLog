// app.js - COMPLETE REWRITE WITH CONSISTENT REPORTS
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
// DATA MANAGEMENT (Keep existing functions)
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
            
            console.log('📊 Loaded existing data');
            
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
// TAB MANAGEMENT (Keep existing functions)
// ============================================================================

function setupTabs() {
    console.log('🔧 Setting up tabs...');
    
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            console.log('📱 Switching to tab:', tabName);
            
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            this.classList.add('active');
            const content = document.getElementById(tabName);
            if (content) {
                content.classList.add('active');
                loadTabData(tabName);
            }
        });
    });
    
    console.log('✅ Tabs setup complete');
}

function loadTabData(tabName) {
    try {
        switch(tabName) {
            case 'students': loadStudents(); break;
            case 'hours': loadHours(); break;
            case 'marks': loadMarks(); break;
            case 'attendance': loadAttendance(); break;
            case 'payments': loadPayments(); break;
            case 'reports': loadReports(); break;
        }
    } catch (error) {
        console.error(`❌ Error loading tab ${tabName}:`, error);
    }
}

// ============================================================================
// REPORTS SYSTEM - COMPLETELY CONSISTENT
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

// ============================================================================
// CONSISTENT REPORT COMPONENTS
// ============================================================================

function initializeMonthlyReport() {
    console.log('📊 Initializing monthly report...');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    updateMonthSelector(currentYear, currentMonth);
    showMonthlyBreakdown(); // Start with monthly view by default
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
    console.log('🔄 Month changed to:', selectedYear, selectedMonth);
    
    // Refresh current view with new month
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
// MONTHLY BREAKDOWN - CONSISTENT STYLING
// ============================================================================

function showMonthlyBreakdown() {
    console.log('📈 Switching to monthly breakdown');
    const currentMonth = parseInt(document.getElementById('reportMonth')?.value || new Date().getMonth());
    const currentYear = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    
    const container = document.getElementById('breakdownContainer');
    if (!container) return;
    
    const monthName = monthNames[currentMonth];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Filter data for the selected month
    const monthlyHours = filterDataByMonth(appData.hours || [], currentYear, currentMonth);
    const monthlyMarks = filterDataByMonth(appData.marks || [], currentYear, currentMonth);
    const monthlyAttendance = filterDataByMonth(appData.attendance || [], currentYear, currentMonth);
    const monthlyPayments = filterDataByMonth(appData.payments || [], currentYear, currentMonth);
    
    // Calculate statistics
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

// ============================================================================
// WEEKLY BREAKDOWN - CONSISTENT STYLING
// ============================================================================

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

// ============================================================================
// BI-WEEKLY BREAKDOWN - CONSISTENT STYLING
// ============================================================================

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

// ============================================================================
// SUBJECT BREAKDOWN - CONSISTENT STYLING
// ============================================================================

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

// ============================================================================
// DATA PROCESSING FUNCTIONS (Keep existing)
// ============================================================================

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
// GLOBAL FUNCTION EXPORTS
// ============================================================================

// Make all report functions globally available
window.loadReports = loadReports;
window.showWeeklyBreakdown = showWeeklyBreakdown;
window.showBiWeeklyBreakdown = showBiWeeklyBreakdown;
window.showMonthlyBreakdown = showMonthlyBreakdown;
window.showSubjectBreakdown = showSubjectBreakdown;
window.showDetailedBiWeeklyAnalysis = showDetailedBiWeeklyAnalysis;
window.initializeMonthlyReport = initializeMonthlyReport;
window.onMonthChange = onMonthChange;
window.generateCurrentMonthReport = generateCurrentMonthReport;
window.loadStudents = loadStudents;
window.loadHours = loadHours;
window.loadMarks = loadMarks;
window.loadAttendance = loadAttendance;
window.loadPayments = loadPayments;
window.addStudent = addStudent;
window.clearStudentForm = clearStudentForm;
window.deleteStudent = deleteStudent;
window.logHours = logHours;
window.addMark = addMark;
window.saveAttendance = saveAttendance;
window.recordPayment = recordPayment;
window.saveDefaultRate = saveDefaultRate;
window.useDefaultRate = useDefaultRate;
window.onMonthChange = onMonthChange;
window.generateMonthlyReport = generateMonthlyReport;


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
    console.log('✅ Reports system loaded with consistent styling');
});




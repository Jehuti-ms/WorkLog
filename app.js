// app.js - SIMPLE WORKING VERSION
console.log('📦 App.js loaded');

function init() {
    console.log('🎯 App initialization started');
    
    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        console.log('❌ User not authenticated');
        return;
    }
    
    console.log('✅ User authenticated, setting up app...');
    
    // Setup tabs
    setupTabs();
    
    // Load initial data
    loadInitialData();
    
    console.log('✅ App initialized successfully');
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
                console.log('✅ Tab activated:', tabName);
            } else {
                console.log('❌ Tab content not found:', tabName);
            }
        });
    });
    
    console.log('✅ Tabs setup complete');
}

function loadInitialData() {
    console.log('📊 Loading initial data...');
    // This will be filled with your actual data loading logic
}

// Basic placeholder functions
function loadStudents() {
    console.log('📚 Loading students...');
}

function loadHours() {
    console.log('⏱️ Loading hours...');
}

function loadMarks() {
    console.log('📊 Loading marks...');
}

function loadAttendance() {
    console.log('✅ Loading attendance...');
}

function loadPayments() {
    console.log('💰 Loading payments...');
}

function loadReports() {
    console.log('📈 Loading reports...');
}

function updateStats() {
    console.log('📈 Updating stats...');
}

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
}

// Export functions for other modules
function exportData() {
    console.log('📤 Exporting data...');
    alert('Export functionality would go here');
}

function importData() {
    console.log('📥 Importing data...');
    alert('Import functionality would go here');
}

function clearAllData() {
    console.log('🗑️ Clearing all data...');
    if (confirm('Are you sure you want to clear all data?')) {
        alert('All data cleared (this is a demo)');
    }
}

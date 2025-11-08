// auth.js - COMPLETE AUTH SYSTEM WITH PROFILE MODAL
const AUTH_CONFIG = {
    storageKey: 'worklog_auth_v2',
    sessionTimeout: 7 * 24 * 60 * 60 * 1000 // 7 days
};

let authState = {
    isAuthenticated: false,
    currentUser: null,
    users: []
};

// ============================================================================
// CORE AUTH FUNCTIONS
// ============================================================================

function initAuth() {
    console.log('🔐 Initializing auth system...');
    loadAuthData();
    checkExistingSession();
    
    if (window.location.pathname.includes('auth.html')) {
        setupAuthEventListeners();
        if (authState.isAuthenticated) {
            console.log('Already logged in, redirecting to app...');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    } else {
        setupMainAppAuthUI();
        if (!authState.isAuthenticated) {
            console.log('Not logged in, redirecting to auth page...');
            setTimeout(() => window.location.href = 'auth.html', 1000);
        }
    }
}

function loadAuthData() {
    try {
        const savedData = localStorage.getItem(AUTH_CONFIG.storageKey);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            authState.users = parsedData.users || [];
            console.log('Loaded users:', authState.users.length);
        } else {
            console.log('No existing auth data found');
        }
    } catch (error) {
        console.error('Error loading auth data:', error);
        authState.users = [];
    }
}

function saveAuthData() {
    try {
        const dataToSave = {
            users: authState.users,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(dataToSave));
        console.log('Auth data saved');
    } catch (error) {
        console.error('Error saving auth data:', error);
    }
}

function checkExistingSession() {
    const sessionId = localStorage.getItem('worklog_session');
    console.log('Checking session:', sessionId);
    
    if (sessionId) {
        const user = authState.users.find(u => u.id === sessionId);
        if (user) {
            authState.isAuthenticated = true;
            authState.currentUser = user;
            console.log('✅ Session restored for:', user.name);
            return true;
        } else {
            console.log('❌ Session exists but user not found');
            localStorage.removeItem('worklog_session');
        }
    }
    return false;
}

// ============================================================================
// AUTH OPERATIONS
// ============================================================================

async function registerUser(name, email, password) {
    console.log('Registering user:', email);
    
    try {
        if (!name || !email || !password) {
            throw new Error('Please fill in all fields');
        }

        const existingUser = authState.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase()
        );
        
        if (existingUser) {
            console.log('User already exists:', existingUser);
            throw new Error('An account with this email already exists');
        }

        const user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        console.log('Creating new user:', user);

        authState.users.push(user);
        authState.isAuthenticated = true;
        authState.currentUser = user;

        saveAuthData();
        localStorage.setItem('worklog_session', user.id);

        showNotification('🎉 Account created successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

        return user;
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

async function loginUser(email, password) {
    console.log('Login attempt:', email);
    
    try {
        if (!email || !password) {
            throw new Error('Please fill in all fields');
        }

        const user = authState.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase()
        );

        console.log('Found user:', user);

        if (!user) {
            throw new Error('No account found with this email');
        }

        if (user.password !== password) {
            throw new Error('Invalid password');
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        
        authState.isAuthenticated = true;
        authState.currentUser = user;

        saveAuthData();
        localStorage.setItem('worklog_session', user.id);

        showNotification(`👋 Welcome back, ${user.name}!`, 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

        return user;
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

function logoutUser() {
    console.log('Logging out user');
    authState.isAuthenticated = false;
    authState.currentUser = null;
    localStorage.removeItem('worklog_session');
    window.location.href = 'auth.html';
}

function getCurrentUser() {
    return authState.currentUser;
}

function getCurrentUserId() {
    return authState.currentUser ? authState.currentUser.id : null;
}

// ============================================================================
// UI MANAGEMENT
// ============================================================================

function setupAuthEventListeners() {
    console.log('Setting up auth event listeners');
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                await loginUser(email, password);
            } catch (error) {
                // Error already handled in loginUser
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Register form submitted');
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            try {
                await registerUser(name, email, password);
            } catch (error) {
                // Error already handled in registerUser
            }
        });
    }

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
}

function setupMainAppAuthUI() {
    console.log('Setting up main app auth UI');
    
    const authButton = document.getElementById('authButton');
    const userMenu = document.getElementById('userMenu');
    
    if (!authButton) {
        console.log('No auth button found!');
        return;
    }

    console.log('Auth state:', authState);

    if (authState.isAuthenticated && authState.currentUser) {
        authButton.innerHTML = `👤 ${authState.currentUser.name}`;
        authButton.onclick = function() {
            if (userMenu) {
                userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
            }
        };
        
        if (userMenu) {
            const userName = userMenu.querySelector('#userName');
            if (userName) {
                userName.textContent = authState.currentUser.name;
            }
        }
        
        document.addEventListener('click', function(event) {
            if (userMenu && !authButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.style.display = 'none';
            }
        });
    } else {
        authButton.innerHTML = '🔐 Login';
        authButton.onclick = function() {
            window.location.href = 'auth.html';
        };
        if (userMenu) {
            userMenu.style.display = 'none';
        }
    }
}

function switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.auth-tab[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.auth-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    document.getElementById(tabName).classList.add('active');
    document.getElementById(tabName).style.display = 'block';
}

function showNotification(message, type = 'info') {
    alert(`${type.toUpperCase()}: ${message}`);
}

// ============================================================================
// PROFILE MODAL SYSTEM
// ============================================================================

function showProfileModal() {
    console.log('👤 Opening profile modal...');
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in to view profile');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="profileModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👤 User Profile</h3>
                    <button class="modal-close" onclick="closeProfileModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="profile-info">
                        <div class="profile-field">
                            <label>Name:</label>
                            <span>${currentUser.name || 'N/A'}</span>
                        </div>
                        <div class="profile-field">
                            <label>Email:</label>
                            <span>${currentUser.email || 'N/A'}</span>
                        </div>
                        <div class="profile-field">
                            <label>User ID:</label>
                            <span class="user-id">${currentUser.id}</span>
                        </div>
                        <div class="profile-field">
                            <label>Account Created:</label>
                            <span>${currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <div class="profile-field">
                            <label>Last Login:</label>
                            <span>${currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                    </div>
                    
                    <div class="profile-stats">
                        <h4>📊 Data Summary</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number">${window.appData?.students?.length || 0}</span>
                                <span class="stat-label">Students</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${window.hoursEntries?.length || 0}</span>
                                <span class="stat-label">Hours Logged</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${window.appData?.marks?.length || 0}</span>
                                <span class="stat-label">Assessments</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeProfileModal()">Close</button>
                    <button class="btn btn-warning" onclick="showResetDataConfirm()">Reset Data</button>
                    <button class="btn btn-danger" onclick="showLogoutConfirm()">Logout</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.addEventListener('keydown', handleProfileModalEscape);
}

function closeProfileModal() {
    console.log('👤 Closing profile modal...');
    
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
    
    document.removeEventListener('keydown', handleProfileModalEscape);
}

function handleProfileModalEscape(event) {
    if (event.key === 'Escape') {
        closeProfileModal();
    }
}

function showResetDataConfirm() {
    if (confirm('⚠️ ARE YOU SURE?\n\nThis will delete ALL your local data including:\n• Students\n• Hours entries\n• Marks & assessments\n• Attendance records\n• Payment history\n\nThis action cannot be undone!')) {
        resetAllData();
        closeProfileModal();
    }
}

function resetAllData() {
    console.log('🗑️ Resetting all data...');
    
    if (window.appData && window.resetAppData) {
        window.resetAppData();
    }
    
    if (window.hoursEntries) {
        window.hoursEntries = [];
    }
    
    const userId = getCurrentUserId();
    localStorage.removeItem(`worklog_data_${userId}`);
    localStorage.removeItem('worklog_hours');
    
    if (window.saveAllData) {
        window.saveAllData();
    }
    
    alert('✅ All data has been reset! The page will reload.');
    window.location.reload();
}

function showLogoutConfirm() {
    if (confirm('Are you sure you want to logout?')) {
        logoutUser();
        closeProfileModal();
    }
}

function exportUserData() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('No user data to export', 'error');
        return;
    }
    
    try {
        const userId = currentUser.id;
        const userData = {
            profile: currentUser,
            appData: JSON.parse(localStorage.getItem(`worklog_data_${userId}`) || '{}'),
            hoursData: window.hoursEntries || [],
            exportDate: new Date().toISOString(),
            exportVersion: '1.0'
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `worklog_backup_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        showNotification('📤 User data exported successfully!', 'success');
        closeProfileModal();
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting data', 'error');
    }
}

// ============================================================================
// SOCIAL AUTH PLACEHOLDERS
// ============================================================================

function signInWithGoogle() {
    showNotification('🔐 Google authentication would be implemented here', 'info');
}

function signInWithGitHub() {
    showNotification('💻 GitHub authentication would be implemented here', 'info'); 
}

// ============================================================================
// DEBUG AND UTILITY FUNCTIONS
// ============================================================================

function resetAuthData() {
    if (confirm('Are you sure you want to reset all authentication data? This will log you out and clear all user accounts.')) {
        localStorage.removeItem(AUTH_CONFIG.storageKey);
        localStorage.removeItem('worklog_session');
        authState = {
            isAuthenticated: false,
            currentUser: null,
            users: []
        };
        showNotification('Auth data reset successfully', 'success');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
    }
}

function debugAuth() {
    console.log('=== AUTH DEBUG INFO ===');
    console.log('Auth state:', authState);
    console.log('Session in localStorage:', localStorage.getItem('worklog_session'));
    console.log('All users:', authState.users);
    console.log('Current user:', authState.currentUser);
    
    const debugInfo = `
Auth State:
- Authenticated: ${authState.isAuthenticated}
- Current User: ${authState.currentUser ? authState.currentUser.name : 'None'}
- Total Users: ${authState.users.length}
- Session: ${localStorage.getItem('worklog_session') ? 'Exists' : 'None'}
    `.trim();
    
    alert(debugInfo);
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.Auth = {
    isAuthenticated: () => authState.isAuthenticated,
    getCurrentUser: getCurrentUser,
    getCurrentUserId: getCurrentUserId,
    logoutUser: logoutUser,
    showAuthModal: () => window.location.href = 'auth.html',
    showProfileModal: showProfileModal,
    resetAuthData: resetAuthData,
    debugAuth: debugAuth
};

window.signInWithGoogle = signInWithGoogle;
window.signInWithGitHub = signInWithGitHub;
window.showProfileModal = showProfileModal;
window.closeProfileModal = closeProfileModal;
window.exportUserData = exportUserData;

// ============================================================================
// INITIALIZATION
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
// Add click outside to close functionality
document.addEventListener('click', function(event) {
    const modal = document.getElementById('profileModal');
    if (modal && event.target === modal) {
        closeProfileModal();
    }
});

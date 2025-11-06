// auth.js - FIXED AUTH SYSTEM
const AUTH_CONFIG = {
    storageKey: 'worklog_auth_v2', // Changed to avoid conflicts with old data
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
        // If already logged in, redirect to app
        if (authState.isAuthenticated) {
            console.log('Already logged in, redirecting to app...');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    } else {
        setupMainAppAuthUI();
        // If not logged in, redirect to auth page
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
            localStorage.removeItem('worklog_session'); // Clean up invalid session
        }
    }
    return false;
}

// ============================================================================
// AUTH OPERATIONS - FIXED VERSION
// ============================================================================

async function registerUser(name, email, password) {
    console.log('Registering user:', email);
    
    try {
        if (!name || !email || !password) {
            throw new Error('Please fill in all fields');
        }

        // Check if user already exists (case insensitive)
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
            password: password, // Store plain text for demo (NOT for production!)
            createdAt: new Date().toISOString()
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

        // Find user (case insensitive)
        const user = authState.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase()
        );

        console.log('Found user:', user);
        console.log('All users:', authState.users);

        if (!user) {
            throw new Error('No account found with this email');
        }

        // Check password (plain text comparison for demo)
        if (user.password !== password) {
            console.log('Password mismatch. Expected:', user.password, 'Got:', password);
            throw new Error('Invalid password');
        }

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

// ============================================================================
// UI MANAGEMENT
// ============================================================================

function setupAuthEventListeners() {
    console.log('Setting up auth event listeners');
    
    // Login form
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

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Register form submitted');
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            // Check if passwords match
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

    // Tab switching
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
    console.log('Current user:', authState.currentUser);

    if (authState.isAuthenticated && authState.currentUser) {
        // User is logged in
        console.log('User is logged in, setting up user menu');
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
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (userMenu && !authButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.style.display = 'none';
            }
        });
    } else {
        // User is not logged in
        console.log('User is not logged in, showing login button');
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
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.auth-tab[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.auth-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    document.getElementById(tabName).classList.add('active');
    document.getElementById(tabName).style.display = 'block';
}

function showNotification(message, type = 'info') {
    // Simple alert for now
    alert(`${type.toUpperCase()}: ${message}`);
}

// Add this to your auth.js in the UTILITY FUNCTIONS section
function signInWithGoogle() {
    showNotification('🔐 Google authentication would be implemented here', 'info');
    // In real app, integrate with Google OAuth
}

function signInWithGitHub() {
    showNotification('💻 GitHub authentication would be implemented here', 'info'); 
    // In real app, integrate with GitHub OAuth
}

// Make them available globally
window.signInWithGoogle = signInWithGoogle;
window.signInWithGitHub = signInWithGitHub;

// ============================================================================
// PROFILE MODAL FUNCTION
// ============================================================================

function showProfileModal() {
    if (!authState.isAuthenticated || !authState.currentUser) {
        showNotification('Please sign in to view your profile', 'error');
        return;
    }

    const user = authState.currentUser;
    
    // Create profile modal HTML
    const modalHTML = `
        <div id="profileModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close" onclick="closeProfileModal()">&times;</span>
                <h2>👤 User Profile</h2>
                
                <div class="profile-info" style="margin: 20px 0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="width: 80px; height: 80px; background: #667eea; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="profile-details">
                        <div class="profile-field">
                            <label>Name:</label>
                            <span>${user.name}</span>
                        </div>
                        <div class="profile-field">
                            <label>Email:</label>
                            <span>${user.email}</span>
                        </div>
                        <div class="profile-field">
                            <label>Account Created:</label>
                            <span>${new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="profile-field">
                            <label>User ID:</label>
                            <span style="font-size: 12px; color: #666;">${user.id}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-actions" style="border-top: 1px solid #eee; padding-top: 20px;">
                    <button class="btn btn-secondary" onclick="closeProfileModal()" style="margin-right: 10px;">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="showNotification('Profile editing would be implemented here', 'info')">
                        ✏️ Edit Profile
                    </button>
                    <button class="btn" onclick="exportUserData()" style="margin-left: 10px;">
                        📤 Export My Data
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('profileModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add CSS for modal if not already present
    addModalStyles();
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
}

function addModalStyles() {
    // Check if styles already added
    if (document.getElementById('profileModalStyles')) {
        return;
    }
    
    const styles = `
        <style id="profileModalStyles">
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }
            
            .modal-content {
                background-color: white;
                margin: 5% auto;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                line-height: 1;
            }
            
            .close:hover {
                color: #000;
            }
            
            .profile-field {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .profile-field label {
                font-weight: 600;
                color: #333;
                min-width: 120px;
            }
            
            .profile-field span {
                color: #666;
                text-align: right;
            }
            
            .profile-actions {
                display: flex;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 10px;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

function exportUserData() {
    if (!authState.currentUser) {
        showNotification('No user data to export', 'error');
        return;
    }
    
    try {
        const userId = authState.currentUser.id;
        const userData = {
            profile: authState.currentUser,
            appData: JSON.parse(localStorage.getItem(`worklog_data_${userId}`) || '{}'),
            exportDate: new Date().toISOString(),
            exportVersion: '1.0'
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `worklog_backup_${authState.currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
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
// DEBUG AND RESET FUNCTIONS
// ============================================================================

function resetAuthData() {
    localStorage.removeItem(AUTH_CONFIG.storageKey);
    localStorage.removeItem('worklog_session');
    authState = {
        isAuthenticated: false,
        currentUser: null,
        users: []
    };
    console.log('✅ Auth data reset complete');
    showNotification('Auth data reset complete', 'success');
}

function debugAuth() {
    console.log('=== AUTH DEBUG INFO ===');
    console.log('Storage key:', AUTH_CONFIG.storageKey);
    console.log('Auth state:', authState);
    console.log('Session in localStorage:', localStorage.getItem('worklog_session'));
    console.log('All users:', authState.users);
}

// ============================================================================
// GLOBAL ACCESS - COMPLETE VERSION
// ============================================================================

// Make sure all functions are defined before adding to window.Auth
window.Auth = {
    isAuthenticated: () => authState.isAuthenticated,
    getCurrentUser: () => authState.currentUser,
    getCurrentUserId: () => authState.currentUser ? authState.currentUser.id : null,
    logoutUser: logoutUser,
    showAuthModal: () => window.location.href = 'auth.html',
    showProfileModal: showProfileModal,
    resetAuthData: resetAuthData,
    debugAuth: debugAuth
};

// Also make the functions available directly on window for backup
window.showProfileModal = showProfileModal;
window.closeProfileModal = closeProfileModal;
window.exportUserData = exportUserData;

// Initialize auth when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

window.Auth = {
    isAuthenticated: () => authState.isAuthenticated,
    getCurrentUser: () => authState.currentUser,
    getCurrentUserId: () => authState.currentUser ? authState.currentUser.id : null, // ADD THIS LINE
    logoutUser: logoutUser,
    showAuthModal: () => window.location.href = 'auth.html',
    resetAuthData: resetAuthData,
    debugAuth: debugAuth
};

// Add to your auth.js initialization or event listeners
document.addEventListener('click', function(event) {
    const modal = document.getElementById('profileModal');
    if (modal && event.target === modal) {
        closeProfileModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeProfileModal();
    }
});

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
    
    // Show in alert for easy viewing
    const debugInfo = `
Auth State:
- Authenticated: ${authState.isAuthenticated}
- Current User: ${authState.currentUser ? authState.currentUser.name : 'None'}
- Total Users: ${authState.users.length}
- Session: ${localStorage.getItem('worklog_session') ? 'Exists' : 'None'}
    `.trim();
    
    alert(debugInfo);
}



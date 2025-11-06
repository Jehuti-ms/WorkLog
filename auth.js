// auth.js - Complete Authentication System

// ============================================================================
// AUTHENTICATION STATE AND CONFIGURATION
// ============================================================================

const AUTH_CONFIG = {
    // Use localStorage for demo - replace with real backend in production
    storageKey: 'worklog_auth',
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    minPasswordLength: 8
};

let authState = {
    isAuthenticated: false,
    currentUser: null,
    users: [],
    sessions: []
};

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize authentication system
function initAuth() {
    console.log('Initializing auth system...');
    loadAuthData();
    checkExistingSession();
    setupAuthEventListeners();
    
    // Update auth button if we're on the main app
    if (typeof setupAuthUI === 'function') {
        setupAuthUI();
    }
    
    console.log('Auth system initialized');
}

// Remove the DOMContentLoaded event listener from auth.js and replace with:
// Make functions available globally
window.Auth = {
    isAuthenticated: function() {
        return authState.isAuthenticated;
    },
    getCurrentUser: function() {
        return authState.currentUser;
    },
    getCurrentUserId: function() {
        return authState.currentUser ? authState.currentUser.id : null;
    },
    showAuthModal: function() {
        window.location.href = 'auth.html';
    },
    showProfileModal: function() {
        alert('👤 User Profile\n\nThis would show user profile and settings in the main app.');
    },
    logoutUser: logoutUser
};

// For auth.html page
if (window.location.pathname.includes('auth.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        initAuth();
    });
}

// ============================================================================
// AUTHENTICATION CORE FUNCTIONS
// ============================================================================

// Register new user
async function registerUser(name, email, password) {
    showLoading(true);
    
    try {
        // Validate inputs
        if (!name || !email || !password) {
            throw new Error('Please fill in all fields');
        }
        
        if (password.length < AUTH_CONFIG.minPasswordLength) {
            throw new Error(`Password must be at least ${AUTH_CONFIG.minPasswordLength} characters`);
        }
        
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // Check if user already exists
        if (authState.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('An account with this email already exists');
        }
        
        // Create new user
        const user = {
            id: generateUserId(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashPassword(password), // In real app, use proper hashing
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true,
            profile: {
                avatar: generateAvatar(name),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        
        // Add user to database
        authState.users.push(user);
        
        // Create session
        const session = createSession(user.id);
        
        // Update auth state
        authState.isAuthenticated = true;
        authState.currentUser = user;
        
        // Save data
        saveAuthData();
        localStorage.setItem('worklog_session', session.id);
        
        showNotification('🎉 Account created successfully!', 'success');
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
        return { user, session };
        
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// Login user
async function loginUser(email, password, rememberMe = false) {
    showLoading(true);
    
    try {
        // Validate inputs
        if (!email || !password) {
            throw new Error('Please fill in all fields');
        }
        
        // Find user
        const user = authState.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.isActive
        );
        
        if (!user) {
            throw new Error('No account found with this email');
        }
        
        // Verify password (in real app, use proper password verification)
        if (user.password !== hashPassword(password)) {
            throw new Error('Invalid password');
        }
        
        // Update user last login
        user.lastLogin = new Date().toISOString();
        
        // Create session
        const session = createSession(user.id);
        if (rememberMe) {
            session.expires = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        }
        
        // Update auth state
        authState.isAuthenticated = true;
        authState.currentUser = user;
        
        // Save data
        saveAuthData();
        localStorage.setItem('worklog_session', session.id);
        
        showNotification(`👋 Welcome back, ${user.name.split(' ')[0]}!`, 'success');
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
        return { user, session };
        
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// Logout user
function logoutUser() {
    const sessionId = localStorage.getItem('worklog_session');
    if (sessionId) {
        // Remove session
        authState.sessions = authState.sessions.filter(s => s.id !== sessionId);
        saveAuthData();
        localStorage.removeItem('worklog_session');
    }
    
    authState.isAuthenticated = false;
    authState.currentUser = null;
    
    // Redirect to auth page
    window.location.href = 'auth.html';
}

// Forgot password
async function forgotPassword(email) {
    showLoading(true);
    
    try {
        if (!email) {
            throw new Error('Please enter your email address');
        }
        
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        const user = authState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            throw new Error('No account found with this email');
        }
        
        // In a real app, send email with reset link
        // For demo, we'll just show a success message
        showNotification('📧 Password reset link sent to your email!', 'success');
        
        // Simulate email send
        setTimeout(() => {
            showLogin();
            showNotification('💡 Demo: In a real app, you would receive an email with reset instructions.', 'info');
        }, 2000);
        
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// ============================================================================
// DATA PERSISTENCE FUNCTIONS
// ============================================================================

// Load authentication data from localStorage
function loadAuthData() {
    try {
        const savedData = localStorage.getItem(AUTH_CONFIG.storageKey);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            authState.users = parsedData.users || [];
            authState.sessions = parsedData.sessions || [];
            console.log('Auth data loaded from storage');
        } else {
            // Initialize with demo user for testing
            initializeDemoData();
        }
    } catch (error) {
        console.error('Error loading auth data:', error);
        // Initialize with empty state
        authState.users = [];
        authState.sessions = [];
    }
}

// Save authentication data to localStorage
function saveAuthData() {
    try {
        const dataToSave = {
            users: authState.users,
            sessions: authState.sessions,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(dataToSave));
        console.log('Auth data saved to storage');
    } catch (error) {
        console.error('Error saving auth data:', error);
    }
}

// Check existing session on page load
function checkExistingSession() {
    const sessionId = localStorage.getItem('worklog_session');
    if (sessionId) {
        const session = validateSession(sessionId);
        if (session) {
            const user = authState.users.find(u => u.id === session.userId);
            if (user && user.isActive) {
                authState.isAuthenticated = true;
                authState.currentUser = user;
                console.log('Existing session restored for user:', user.name);
                
                // If we're on auth page but already logged in, redirect to main app
                if (window.location.pathname.includes('auth.html') && authState.isAuthenticated) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
                return true;
            }
        } else {
            // Invalid session, clean up
            localStorage.removeItem('worklog_session');
        }
    }
    return false;
}

// Initialize demo data for testing
function initializeDemoData() {
    // Only initialize if no users exist
    if (authState.users.length === 0) {
        const demoUser = {
            id: 'demo_user_123',
            name: 'Demo User',
            email: 'demo@example.com',
            password: hashPassword('demopassword123'),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true,
            profile: {
                avatar: generateAvatar('Demo User'),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        authState.users.push(demoUser);
        console.log('Demo user initialized');
    }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

// Create new session
function createSession(userId) {
    const session = {
        id: generateSessionId(),
        userId: userId,
        created: new Date().toISOString(),
        expires: new Date(Date.now() + AUTH_CONFIG.sessionTimeout),
        userAgent: navigator.userAgent,
        ip: 'local' // In real app, get from server
    };
    
    authState.sessions.push(session);
    return session;
}

// Validate session
function validateSession(sessionId) {
    const session = authState.sessions.find(s => s.id === sessionId);
    if (!session || new Date(session.expires) <= new Date()) {
        return null;
    }
    
    return session;
}

// ============================================================================
// UI MANAGEMENT FUNCTIONS
// ============================================================================

// Setup authentication event listeners
function setupAuthEventListeners() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
    
    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Password strength indicator
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', updatePasswordStrength);
        }
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Enter key support
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const activeForm = document.querySelector('.auth-tab-content.active form');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }
    });
}

// Switch between auth tabs
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
    
    // Clear forms
    clearFormErrors();
}

// Show forgot password form
function showForgotPassword() {
    document.querySelectorAll('.auth-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    document.getElementById('forgotPassword').style.display = 'block';
    document.getElementById('forgotPassword').classList.add('active');
}

// Show login form
function showLogin() {
    switchAuthTab('login');
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    try {
        await loginUser(email, password, rememberMe);
    } catch (error) {
        // Error already handled in loginUser
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    // Validate form
    if (!acceptTerms) {
        showNotification('Please accept the Terms of Service and Privacy Policy', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        await registerUser(name, email, password);
    } catch (error) {
        // Error already handled in registerUser
    }
}

// Handle forgot password form submission
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    try {
        await forgotPassword(email);
    } catch (error) {
        // Error already handled in forgotPassword
    }
}

// Update password strength indicator
function updatePasswordStrength() {
    const password = document.getElementById('registerPassword').value;
    const strengthBar = document.getElementById('passwordStrength');
    
    if (!strengthBar) return;
    
    const strength = calculatePasswordStrength(password);
    
    strengthBar.className = 'strength-fill';
    strengthBar.classList.add(`strength-${strength.level}`);
    
    // Update color based on strength
    if (strength.score < 3) {
        strengthBar.style.background = '#e74c3c';
    } else if (strength.score < 5) {
        strengthBar.style.background = '#f39c12';
    } else {
        strengthBar.style.background = '#27ae60';
    }
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    let level = 'weak';
    if (score >= 5) level = 'strong';
    else if (score >= 3) level = 'medium';
    
    return { score, level };
}

// ============================================================================
// SOCIAL AUTHENTICATION (DEMO)
// ============================================================================

// Sign in with Google (demo)
async function signInWithGoogle() {
    showNotification('🔍 Google authentication would be implemented here', 'info');
    // In real app, integrate with Google OAuth
}

// Sign in with GitHub (demo)
async function signInWithGitHub() {
    showNotification('💻 GitHub authentication would be implemented here', 'info');
    // In real app, integrate with GitHub OAuth
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Generate unique user ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Simple password hashing (in real app, use proper hashing like bcrypt)
function hashPassword(password) {
    // This is a simple demo hash - NEVER use this in production!
    return btoa(unescape(encodeURIComponent(password))) + '_demo_hash';
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate avatar from name
function generateAvatar(name) {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f'];
    const color = colors[name.length % colors.length];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color.replace('#', '')}&color=fff&size=128`;
}

// Show loading state
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    const buttons = document.querySelectorAll('.btn-primary');
    
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
    
    buttons.forEach(btn => {
        const text = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.btn-loading');
        
        if (text && loading) {
            text.style.display = show ? 'none' : 'inline';
            loading.style.display = show ? 'inline' : 'none';
        }
        
        btn.disabled = show;
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.auth-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = '#28a745';
            break;
        case 'error':
            notification.style.background = '#dc3545';
            break;
        case 'warning':
            notification.style.background = '#ffc107';
            notification.style.color = '#212529';
            break;
        default:
            notification.style.background = '#17a2b8';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Clear form errors
function clearFormErrors() {
    const inputs = document.querySelectorAll('.auth-tab-content.active input');
    inputs.forEach(input => input.classList.remove('error'));
}

// Demo terms and privacy modals
function showTerms() {
    alert('📜 Terms of Service\n\nThis is a demo application. In a real app, you would show proper terms of service here.');
}

function showPrivacy() {
    alert('🔒 Privacy Policy\n\nThis is a demo application. In a real app, you would show a proper privacy policy here.');
}

// Clear all auth data (for debugging)
function clearAuthData() {
    localStorage.removeItem(AUTH_CONFIG.storageKey);
    localStorage.removeItem('worklog_session');
    authState = {
        isAuthenticated: false,
        currentUser: null,
        users: [],
        sessions: []
    };
    console.log('Auth data cleared');
}

// ============================================================================
// PUBLIC API
// ============================================================================

// Check if user is authenticated
function isAuthenticated() {
    return authState.isAuthenticated;
}

// Get current user
function getCurrentUser() {
    return authState.currentUser;
}

// Get current user ID
function getCurrentUserId() {
    return authState.currentUser ? authState.currentUser.id : null;
}

// Show auth modal (for main app)
function showAuthModal() {
    window.location.href = 'auth.html';
}

// Show profile modal (for main app)
function showProfileModal() {
    alert('👤 User Profile\n\nThis would show user profile and settings in the main app.');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// Make functions available globally
window.Auth = {
    isAuthenticated,
    getCurrentUser,
    getCurrentUserId,
    showAuthModal,
    showProfileModal,
    logoutUser,
    registerUser,
    loginUser
};

window.showForgotPassword = showForgotPassword;
window.showLogin = showLogin;
window.signInWithGoogle = signInWithGoogle;
window.signInWithGitHub = signInWithGitHub;
window.showTerms = showTerms;
window.showPrivacy = showPrivacy;

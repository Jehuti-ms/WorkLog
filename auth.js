// auth.js - SIMPLIFIED AUTH SYSTEM
const AUTH_CONFIG = {
    storageKey: 'worklog_auth',
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
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    } else {
        setupMainAppAuthUI();
        // If not logged in, redirect to auth page
        if (!authState.isAuthenticated) {
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
    } catch (error) {
        console.error('Error saving auth data:', error);
    }
}

function checkExistingSession() {
    const sessionId = localStorage.getItem('worklog_session');
    if (sessionId) {
        const user = authState.users.find(u => u.id === sessionId);
        if (user) {
            authState.isAuthenticated = true;
            authState.currentUser = user;
            console.log('✅ Session restored for:', user.name);
            return true;
        }
    }
    return false;
}

// ============================================================================
// AUTH OPERATIONS
// ============================================================================

async function registerUser(name, email, password) {
    try {
        if (!name || !email || !password) {
            throw new Error('Please fill in all fields');
        }

        if (authState.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('An account with this email already exists');
        }

        const user = {
            id: 'user_' + Date.now(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password, // In real app, hash this!
            createdAt: new Date().toISOString()
        };

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
        showNotification(error.message, 'error');
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Please fill in all fields');
        }

        const user = authState.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password // In real app, verify hashed password
        );

        if (!user) {
            throw new Error('Invalid email or password');
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
        showNotification(error.message, 'error');
        throw error;
    }
}

function logoutUser() {
    authState.isAuthenticated = false;
    authState.currentUser = null;
    localStorage.removeItem('worklog_session');
    window.location.href = 'auth.html';
}

// ============================================================================
// UI MANAGEMENT
// ============================================================================

function setupAuthEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await loginUser(email, password);
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            await registerUser(name, email, password);
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
    const authButton = document.getElementById('authButton');
    const userMenu = document.getElementById('userMenu');
    
    if (!authButton) return;

    if (authState.isAuthenticated && authState.currentUser) {
        // User is logged in
        authButton.innerHTML = `👤 ${authState.currentUser.name}`;
        authButton.onclick = function() {
            if (userMenu) {
                userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
            }
        };
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (userMenu && !authButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.style.display = 'none';
            }
        });
    } else {
        // User is not logged in
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
    alert(`${type.toUpperCase()}: ${message}`); // Simple alert for now
}

// ============================================================================
// GLOBAL ACCESS
// ============================================================================

window.Auth = {
    isAuthenticated: () => authState.isAuthenticated,
    getCurrentUser: () => authState.currentUser,
    logoutUser: logoutUser,
    showAuthModal: () => window.location.href = 'auth.html'
};

// Initialize auth when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

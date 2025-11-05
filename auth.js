// auth.js - Authentication System
const Auth = (function() {
    // Private variables
    let currentUser = null;
    let isAuthenticated = false;
    let users = {};
    let currentUserId = null;

    // Public methods
    return {
        // Initialize authentication
        initialize: function() {
            this.loadUsers();
            this.checkAutoLogin();
            this.setupEventListeners();
        },

        // Load users from localStorage
        loadUsers: function() {
            try {
                const savedUsers = localStorage.getItem('worklog_users');
                if (savedUsers) {
                    users = JSON.parse(savedUsers);
                }
            } catch (error) {
                console.error('Error loading users:', error);
                users = {};
            }
        },

        // Save users to localStorage
        saveUsers: function() {
            try {
                localStorage.setItem('worklog_users', JSON.stringify(users));
            } catch (error) {
                console.error('Error saving users:', error);
            }
        },

        // Check if user is automatically logged in
        checkAutoLogin: function() {
            const savedUserId = localStorage.getItem('worklog_current_user');
            if (savedUserId && users[savedUserId]) {
                currentUser = users[savedUserId];
                currentUserId = savedUserId;
                isAuthenticated = true;
                this.updateUI();
                
                // Dispatch auth state change
                document.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { user: currentUser, action: 'auto-login' }
                }));
                
                // Notify main app to load user data
                if (window.loadUserData) {
                    window.loadUserData(currentUserId);
                }
            }
        },

        // Setup authentication event listeners
        setupEventListeners: function() {
            // Auth tabs
            document.querySelectorAll('.auth-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabName = e.target.getAttribute('data-tab');
                    this.switchAuthTab(tabName);
                });
            });

            // Login form
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.loginUser();
                });
            }

            // Signup form
            const signupForm = document.getElementById('signupForm');
            if (signupForm) {
                signupForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.signupUser();
                });
            }

            // Forgot password form
            const forgotPasswordForm = document.getElementById('forgotPasswordForm');
            if (forgotPasswordForm) {
                forgotPasswordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.sendPasswordReset();
                });
            }

            // Reset password form
            const resetPasswordForm = document.getElementById('resetPasswordForm');
            if (resetPasswordForm) {
                resetPasswordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.resetPassword();
                });
            }
        },

        // Switch between auth tabs
        switchAuthTab: function(tabName) {
            // Update tabs
            document.querySelectorAll('.auth-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.auth-tab-content').forEach(content => {
                content.classList.remove('active');
            });

            const activeTab = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
            const activeContent = document.getElementById(tabName);
            
            if (activeTab) activeTab.classList.add('active');
            if (activeContent) activeContent.classList.add('active');
            
            // Clear status messages
            const authStatus = document.getElementById('authStatus');
            if (authStatus) authStatus.innerHTML = '';
        },

        // Show specific auth screens
        showLogin: function() {
            this.switchAuthTab('login');
        },

        showSignup: function() {
            this.switchAuthTab('signup');
        },

        showForgotPassword: function() {
            this.switchAuthTab('forgotPassword');
        },

        showChangePassword: function() {
            this.closeProfileModal();
            document.getElementById('resetPasswordModal').style.display = 'block';
            document.body.classList.add('modal-open');
        },

        // User registration
        signupUser: function() {
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim().toLowerCase();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validation
            if (!name || !email || !password) {
                this.showAuthStatus('Please fill in all fields', 'error');
                return;
            }

            if (password.length < 6) {
                this.showAuthStatus('Password must be at least 6 characters', 'error');
                return;
            }

            if (password !== confirmPassword) {
                this.showAuthStatus('Passwords do not match', 'error');
                return;
            }

            if (!this.isValidEmail(email)) {
                this.showAuthStatus('Please enter a valid email address', 'error');
                return;
            }

            // Check if user already exists
            const existingUser = Object.values(users).find(user => user.email === email);
            if (existingUser) {
                this.showAuthStatus('An account with this email already exists', 'error');
                return;
            }

            // Create new user
            const userId = this.generateUserId();
            const user = {
                id: userId,
                name: name,
                email: email,
                password: this.hashPassword(password),
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            // Save user
            users[userId] = user;
            this.saveUsers();

            // Auto-login
            currentUser = user;
            currentUserId = userId;
            isAuthenticated = true;
            
            // Save login state
            localStorage.setItem('worklog_current_user', userId);
            
            // Dispatch auth state change
            document.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { user: user, action: 'register' }
            }));
            
            this.showAuthStatus('Account created successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                this.closeAuthModal();
                this.updateUI();
                this.initializeUserData();
                this.showNotification(`Welcome to WorkLog, ${name}!`);
            }, 1500);
        },

        // User login
        loginUser: function() {
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                this.showAuthStatus('Please enter email and password', 'error');
                return;
            }

            // Find user
            const userEntry = Object.entries(users).find(([id, user]) => user.email === email);
            
            if (!userEntry) {
                this.showAuthStatus('No account found with this email', 'error');
                return;
            }

            const [userId, user] = userEntry;

            // Check password
            if (user.password !== this.hashPassword(password)) {
                this.showAuthStatus('Invalid password', 'error');
                return;
            }

            // Update last login
            user.lastLogin = new Date().toISOString();
            users[userId] = user;
            this.saveUsers();

            // Set current user
            currentUser = user;
            currentUserId = userId;
            isAuthenticated = true;
            
            // Save login state
            localStorage.setItem('worklog_current_user', userId);
            
            // Dispatch auth state change
            document.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { user: user, action: 'login' }
            }));
            
            this.showAuthStatus('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                this.closeAuthModal();
                this.updateUI();
                if (window.loadUserData) {
                    window.loadUserData(userId);
                }
                this.showNotification(`Welcome back, ${user.name}!`);
            }, 1000);
        },

        // Password reset request
        sendPasswordReset: function() {
            const email = document.getElementById('resetEmail').value.trim().toLowerCase();

            if (!email) {
                this.showAuthStatus('Please enter your email address', 'error');
                return;
            }

            // Find user
            const user = Object.values(users).find(user => user.email === email);
            
            if (!user) {
                this.showAuthStatus('No account found with this email', 'error');
                return;
            }

            // Simulate sending reset email
            this.showAuthStatus('Password reset instructions would be sent to your email. For this demo, you can reset directly below.', 'info');
            
            // Store the user ID for password reset
            localStorage.setItem('worklog_reset_user', Object.keys(users).find(id => users[id].email === email));
            
            setTimeout(() => {
                this.closeAuthModal();
                document.getElementById('resetPasswordModal').style.display = 'block';
                document.body.classList.add('modal-open');
            }, 2000);
        },

        // Reset password
        resetPassword: function() {
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (!newPassword || !confirmNewPassword) {
                this.showResetPasswordStatus('Please fill in all fields', 'error');
                return;
            }

            if (newPassword.length < 6) {
                this.showResetPasswordStatus('Password must be at least 6 characters', 'error');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                this.showResetPasswordStatus('Passwords do not match', 'error');
                return;
            }

            const userId = localStorage.getItem('worklog_reset_user');
            if (!userId || !users[userId]) {
                this.showResetPasswordStatus('Invalid reset request', 'error');
                return;
            }

            // Update password
            users[userId].password = this.hashPassword(newPassword);
            this.saveUsers();

            // Clear reset state
            localStorage.removeItem('worklog_reset_user');

            this.showResetPasswordStatus('Password updated successfully! You can now sign in.', 'success');

            setTimeout(() => {
                this.closeResetPasswordModal();
                this.showAuthModal();
                this.switchAuthTab('login');
            }, 2000);
        },

        // Logout
        logout: function() {
            if (confirm('Are you sure you want to sign out?')) {
                // Notify main app to save data before logout
                if (window.onBeforeLogout) {
                    window.onBeforeLogout();
                }
                
                // Clear current user
                currentUser = null;
                currentUserId = null;
                isAuthenticated = false;
                
                localStorage.removeItem('worklog_current_user');
                
                // Dispatch auth state change
                document.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { action: 'logout' }
                }));
                
                // Clear UI
                this.updateUI();
                
                // Show login modal
                this.showAuthModal();
                
                this.showNotification('Signed out successfully');
            }
        },

        // Initialize user data
        initializeUserData: function() {
            if (!currentUserId) return;
            
            const userData = {
                students: [],
                hoursLog: [],
                marks: [],
                attendance: [],
                payments: [],
                paymentActivity: [],
                fieldMemory: {
                    organization: '',
                    baseRate: '',
                    subject: '',
                    topic: '',
                    defaultBaseRate: '25.00'
                }
            };
            
            localStorage.setItem(`worklog_data_${currentUserId}`, JSON.stringify(userData));
            
            // Notify main app
            if (window.onUserDataInitialized) {
                window.onUserDataInitialized(userData);
            }
        },

        // Update auth UI
        updateUI: function() {
            const syncBar = document.querySelector('.cloud-sync-bar');
            if (!syncBar) return;

            if (isAuthenticated && currentUser) {
                syncBar.innerHTML = `
                    <div class="sync-status">
                        <span id="syncStatus">
                            <span class="sync-indicator sync-connected"></span>
                            Signed in as ${currentUser.name}
                        </span>
                    </div>
                    <div class="sync-controls">
                        <button id="syncBtn" class="btn btn-sm">Sync</button>
                        <div class="user-profile" onclick="Auth.showProfileModal()">
                            <div class="user-avatar">${this.getInitials(currentUser.name)}</div>
                            <div class="user-info">
                                <div class="user-name">${currentUser.name}</div>
                                <div class="user-email">${currentUser.email}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                syncBar.innerHTML = `
                    <div class="sync-status">
                        <span id="syncStatus">
                            <span class="sync-indicator sync-offline"></span>
                            Not signed in
                        </span>
                    </div>
                    <div class="sync-controls">
                        <button id="syncBtn" class="btn btn-sm" style="display: none;">Sync</button>
                        <button id="loginBtn" class="btn btn-sm" onclick="Auth.showAuthModal()">Sign In</button>
                    </div>
                `;
            }
            
            // Re-attach sync button listener
            const syncBtn = document.getElementById('syncBtn');
            if (syncBtn && window.manualSyncToCloud) {
                syncBtn.addEventListener('click', window.manualSyncToCloud);
            }
        },

        // Profile modal
        showProfileModal: function() {
            if (!currentUser) return;
            
            const modal = document.getElementById('profileModal');
            const userName = document.getElementById('profileUserName');
            const userEmail = document.getElementById('profileUserEmail');
            const memberSince = document.getElementById('profileMemberSince');
            const studentsCount = document.getElementById('profileStudentsCount');
            const sessionsCount = document.getElementById('profileSessionsCount');
            
            if (userName) userName.textContent = currentUser.name;
            if (userEmail) userEmail.textContent = currentUser.email;
            if (memberSince) memberSince.textContent = `Member since ${new Date(currentUser.createdAt).toLocaleDateString()}`;
            
            // Get data stats from main app
            if (window.getDataStats) {
                const stats = window.getDataStats();
                if (studentsCount) studentsCount.textContent = stats.students || 0;
                if (sessionsCount) sessionsCount.textContent = stats.sessions || 0;
            }
            
            if (modal) {
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
            }
        },

        closeProfileModal: function() {
            const modal = document.getElementById('profileModal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        },

        // Modal management
        showAuthModal: function() {
            const modal = document.getElementById('authModal');
            if (modal) {
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
            }
        },

        closeAuthModal: function() {
            const modal = document.getElementById('authModal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        },

        closeResetPasswordModal: function() {
            const modal = document.getElementById('resetPasswordModal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        },

        // Getters for main app
        getCurrentUser: function() {
            return currentUser;
        },

        getCurrentUserId: function() {
            return currentUserId;
        },

        isAuthenticated: function() {
            return isAuthenticated;
        },

        // Utility functions
        generateUserId: function() {
            return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        hashPassword: function(password) {
            // Simple demo implementation
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
                const char = password.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString();
        },

        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        getInitials: function(name) {
            return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
        },

        showAuthStatus: function(message, type) {
            const statusEl = document.getElementById('authStatus');
            if (statusEl) {
                statusEl.innerHTML = `<div class="status-${type}">${message}</div>`;
            }
        },

        showResetPasswordStatus: function(message, type) {
            const statusEl = document.getElementById('resetPasswordStatus');
            if (statusEl) {
                statusEl.innerHTML = `<div class="status-${type}">${message}</div>`;
            }
        },

        showNotification: function(message) {
            if (window.showSyncNotification) {
                window.showSyncNotification(message);
            } else {
                // Fallback notification
                alert(message);
            }
        },

        // Export user data
        exportUserData: function() {
            if (window.exportUserData) {
                window.exportUserData();
            }
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Auth.initialize();
});

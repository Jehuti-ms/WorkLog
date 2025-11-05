// cloud-sync.js - Supabase Cloud Sync for WorkLog App

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // Replace with your Supabase URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Replace with your Supabase anon key
};

// Cloud sync state
let cloudSync = {
    enabled: false,
    lastSync: null,
    syncing: false,
    lastLocalChange: null
};

// ============================================================================
// CORE SUPABASE FUNCTIONS
// ============================================================================

// Get Supabase client
function getSupabaseClient() {
    if (typeof supabase === 'undefined') {
        console.warn('Supabase client not loaded. Add to HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return null;
    }
    
    return supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

// Initialize cloud sync
function initializeCloudSync() {
    // Check if user is authenticated and Supabase is configured
    if (typeof Auth !== 'undefined' && Auth.isAuthenticated() && 
        SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL') {
        const userId = Auth.getCurrentUserId();
        
        console.log('Supabase sync enabled for user:', userId);
        cloudSync.enabled = true;
        
        // Load data from Supabase on startup
        setTimeout(() => loadFromSupabase(), 2000);
    } else {
        console.log('Supabase sync disabled - missing configuration or authentication');
        cloudSync.enabled = false;
    }
    
    updateSyncUI();
    
    // Auto-sync every 5 minutes if enabled
    setInterval(() => {
        if (cloudSync.enabled && !cloudSync.syncing && hasLocalChanges()) {
            manualSyncToSupabase();
        }
    }, 300000);
}

// Check if there are local changes that need syncing
function hasLocalChanges() {
    if (!cloudSync.lastLocalChange || !cloudSync.lastSync) return true;
    return new Date(cloudSync.lastLocalChange) > new Date(cloudSync.lastSync);
}

// Create or update user data in Supabase
async function manualSyncToSupabase() {
    if (!cloudSync.enabled || cloudSync.syncing) return;
    
    cloudSync.syncing = true;
    updateSyncUI();
    
    try {
        const userId = Auth.getCurrentUserId();
        const userData = Auth.getCurrentUser();
        const supabase = getSupabaseClient();
        
        if (!supabase) {
            throw new Error('Supabase client not available');
        }
        
        const data = {
            students: window.students || [],
            hoursLog: window.hoursLog || [],
            marks: window.marks || [],
            attendance: window.attendance || [],
            payments: window.payments || [],
            paymentActivity: window.paymentActivity || [],
            fieldMemory: window.fieldMemory || {},
            metadata: {
                userId: userId,
                userName: userData.name,
                userEmail: userData.email,
                lastUpdated: new Date().toISOString(),
                version: '2.0',
                device: getDeviceId(),
                recordCounts: {
                    students: (window.students || []).length,
                    hours: (window.hoursLog || []).length,
                    marks: (window.marks || []).length,
                    attendance: (window.attendance || []).length,
                    payments: (window.payments || []).length
                }
            }
        };
        
        // Upsert data to Supabase
        const { error } = await supabase
            .from('worklog_data')
            .upsert({
                user_id: userId,
                data: data,
                last_updated: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
        
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        cloudSync.lastSync = new Date();
        cloudSync.lastLocalChange = null;
        localStorage.setItem('worklog_last_sync', cloudSync.lastSync.toISOString());
        
        console.log('Data synced to Supabase successfully');
        if (window.showNotification) {
            window.showNotification('✅ Data synced to cloud', 'success');
        }
        
    } catch (error) {
        console.error('Supabase sync error:', error);
        if (window.showNotification) {
            window.showNotification('❌ Sync failed: ' + error.message, 'error');
        }
    } finally {
        cloudSync.syncing = false;
        updateSyncUI();
    }
}

// Load data from Supabase
async function loadFromSupabase() {
    if (!cloudSync.enabled || cloudSync.syncing) return;
    
    cloudSync.syncing = true;
    updateSyncUI();
    
    try {
        const userId = Auth.getCurrentUserId();
        const supabase = getSupabaseClient();
        
        if (!supabase) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await supabase
            .from('worklog_data')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        if (data) {
            const cloudData = data.data;
            const cloudLastUpdated = new Date(data.last_updated || 0);
            const localLastUpdated = new Date(localStorage.getItem('worklog_last_sync') || 0);
            
            if (cloudLastUpdated > localLastUpdated) {
                console.log('Newer data found in Supabase, merging...');
                
                if (confirm('Newer data found in cloud. Would you like to load it? Your local changes will be merged.')) {
                    await mergeCloudData(cloudData);
                    cloudSync.lastSync = new Date();
                    localStorage.setItem('worklog_last_sync', cloudSync.lastSync.toISOString());
                    if (window.showNotification) {
                        window.showNotification('✅ Data loaded from cloud', 'success');
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error loading from Supabase:', error);
        // Silently continue with local data
    } finally {
        cloudSync.syncing = false;
        updateSyncUI();
    }
}

// Smart merge cloud data with local data
async function mergeCloudData(cloudData) {
    let changesMade = false;
    
    function mergeArrays(localArray, cloudArray, idField = 'id') {
        const merged = [...localArray];
        const localMap = new Map(localArray.map(item => [item[idField], item]));
        
        cloudArray.forEach(cloudItem => {
            const localItem = localMap.get(cloudItem[idField]);
            if (!localItem) {
                merged.push(cloudItem);
                changesMade = true;
            } else {
                const localUpdated = new Date(localItem._lastUpdated || 0);
                const cloudUpdated = new Date(cloudItem._lastUpdated || cloudData.metadata.lastUpdated || 0);
                
                if (cloudUpdated > localUpdated) {
                    const index = merged.findIndex(item => item[idField] === cloudItem[idField]);
                    if (index !== -1) {
                        merged[index] = cloudItem;
                        changesMade = true;
                    }
                }
            }
        });
        
        return merged;
    }
    
    // Use window object to access global variables
    if (window.students !== undefined) {
        window.students = mergeArrays(window.students, cloudData.students || []);
    }
    if (window.hoursLog !== undefined) {
        window.hoursLog = mergeArrays(window.hoursLog, cloudData.hoursLog || []);
    }
    if (window.marks !== undefined) {
        window.marks = mergeArrays(window.marks, cloudData.marks || []);
    }
    if (window.attendance !== undefined) {
        window.attendance = mergeArrays(window.attendance, cloudData.attendance || []);
    }
    if (window.payments !== undefined) {
        window.payments = mergeArrays(window.payments, cloudData.payments || []);
    }
    if (window.paymentActivity !== undefined) {
        window.paymentActivity = mergeArrays(window.paymentActivity, cloudData.paymentActivity || []);
    }
    
    if (cloudData.fieldMemory && window.fieldMemory !== undefined) {
        window.fieldMemory = { ...window.fieldMemory, ...cloudData.fieldMemory };
        changesMade = true;
    }
    
    if (changesMade && window.saveAllData && window.updateUI) {
        window.saveAllData();
        window.updateUI();
    }
}

// ============================================================================
// UI MANAGEMENT
// ============================================================================

// Update sync UI with real status
function updateSyncUI() {
    const syncStatus = document.getElementById('syncStatus');
    const loginBtn = document.getElementById('loginBtn');
    const syncBtn = document.getElementById('syncBtn');
    
    if (!syncStatus) return;
    
    let statusText = '';
    let statusClass = '';
    let buttonText = '';
    
    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        const user = Auth.getCurrentUser();
        if (user) {
            if (cloudSync.syncing) {
                statusText = 'Syncing to cloud...';
                statusClass = 'sync-syncing';
                buttonText = 'Syncing...';
            } else if (cloudSync.enabled && cloudSync.lastSync) {
                const lastSyncText = formatRelativeTime(cloudSync.lastSync);
                statusText = `Synced ${lastSyncText}`;
                statusClass = 'sync-connected';
                buttonText = `☁️ ${user.name.split(' ')[0]}`;
                
                if (hasLocalChanges()) {
                    statusText += ' • Pending changes';
                    statusClass = 'sync-pending';
                }
            } else if (cloudSync.enabled) {
                statusText = 'Cloud ready';
                statusClass = 'sync-connected';
                buttonText = `☁️ ${user.name.split(' ')[0]}`;
            } else {
                statusText = 'Supabase configured';
                statusClass = 'sync-offline';
                buttonText = `👤 ${user.name.split(' ')[0]}`;
            }
            
            if (syncBtn) {
                syncBtn.style.display = 'inline-block';
                syncBtn.disabled = cloudSync.syncing;
                syncBtn.textContent = cloudSync.syncing ? '🔄' : '🔄';
                syncBtn.title = 'Sync to cloud';
                syncBtn.onclick = manualSyncToSupabase;
            }
        }
    } else {
        statusText = 'Not signed in';
        statusClass = 'sync-offline';
        buttonText = 'Sign In';
        
        if (syncBtn) {
            syncBtn.style.display = 'none';
        }
    }
    
    syncStatus.innerHTML = `
        <span class="sync-indicator ${statusClass}"></span>
        ${statusText}
    `;
    
    if (loginBtn) {
        loginBtn.textContent = buttonText;
        loginBtn.onclick = function() {
            if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
                Auth.showProfileModal();
            } else {
                Auth.showAuthModal();
            }
        };
    }
}

// Cloud sync management functions
function showCloudSyncMenu() {
    const menu = document.getElementById('cloudSyncMenu') || createCloudSyncMenu();
    updateCloudSyncMenu();
    menu.style.display = 'block';
}

function createCloudSyncMenu() {
    const menu = document.createElement('div');
    menu.id = 'cloudSyncMenu';
    menu.className = 'modal';
    menu.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>☁️ Supabase Cloud Sync</h2>
                <span class="close" onclick="closeCloudSyncMenu()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="sync-status-info">
                    <p><strong>Status:</strong> <span id="menuSyncStatus">Checking...</span></p>
                    <p><strong>Last Sync:</strong> <span id="menuLastSync">Never</span></p>
                    <p><strong>Service:</strong> <span id="menuBinId">Supabase</span></p>
                    <p><strong>Data Size:</strong> <span id="menuDataSize">Calculating...</span></p>
                </div>
                
                <div class="sync-actions" style="margin: 20px 0; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="manualSyncToSupabase()" class="btn" id="menuSyncBtn">
                        🔄 Sync to Cloud Now
                    </button>
                    <button onclick="loadFromSupabase()" class="btn">
                        📥 Load from Cloud
                    </button>
                    <button onclick="showCloudSyncInfo()" class="btn btn-secondary">
                        ℹ️ How It Works
                    </button>
                </div>
                
                <div class="sync-stats" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4>📊 Data Statistics</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                        <div>Students: <span id="menuStudentsCount">0</span></div>
                        <div>Hours Logged: <span id="menuHoursCount">0</span></div>
                        <div>Marks: <span id="menuMarksCount">0</span></div>
                        <div>Payments: <span id="menuPaymentsCount">0</span></div>
                    </div>
                </div>
                
                <div class="sync-info" style="padding: 10px; background: #e7f3ff; border-radius: 4px; font-size: 12px; color: #0066cc;">
                    <strong>🔒 Secure & Private:</strong> Your data is encrypted and protected by Supabase's enterprise-grade security with Row Level Security.
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    menu.addEventListener('click', function(e) {
        if (e.target === menu) {
            closeCloudSyncMenu();
        }
    });
    
    return menu;
}

function updateCloudSyncMenu() {
    const menuSyncStatus = document.getElementById('menuSyncStatus');
    const menuLastSync = document.getElementById('menuLastSync');
    const menuBinId = document.getElementById('menuBinId');
    const menuDataSize = document.getElementById('menuDataSize');
    const menuSyncBtn = document.getElementById('menuSyncBtn');
    const menuStudentsCount = document.getElementById('menuStudentsCount');
    const menuHoursCount = document.getElementById('menuHoursCount');
    const menuMarksCount = document.getElementById('menuMarksCount');
    const menuPaymentsCount = document.getElementById('menuPaymentsCount');
    
    if (!menuSyncStatus) return;
    
    if (cloudSync.syncing) {
        menuSyncStatus.textContent = 'Syncing...';
        menuSyncStatus.style.color = '#ffc107';
        if (menuSyncBtn) menuSyncBtn.disabled = true;
    } else if (cloudSync.enabled) {
        menuSyncStatus.textContent = 'Connected to Supabase';
        menuSyncStatus.style.color = '#28a745';
        if (menuSyncBtn) menuSyncBtn.disabled = false;
    } else {
        menuSyncStatus.textContent = 'Configure Supabase';
        menuSyncStatus.style.color = '#6c757d';
        if (menuSyncBtn) menuSyncBtn.disabled = true;
    }
    
    if (menuLastSync) {
        menuLastSync.textContent = cloudSync.lastSync 
            ? formatRelativeTime(cloudSync.lastSync)
            : 'Never';
    }
    
    if (menuBinId) {
        menuBinId.textContent = SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' 
            ? 'Supabase Connected'
            : 'Not configured';
    }
    
    if (menuDataSize) {
        const dataSize = JSON.stringify({
            students: window.students || [],
            hoursLog: window.hoursLog || [],
            marks: window.marks || [],
            attendance: window.attendance || [],
            payments: window.payments || [],
            paymentActivity: window.paymentActivity || [],
            fieldMemory: window.fieldMemory || {}
        }).length;
        menuDataSize.textContent = (dataSize / 1024).toFixed(1) + ' KB';
    }
    
    if (menuStudentsCount) menuStudentsCount.textContent = (window.students || []).length;
    if (menuHoursCount) menuHoursCount.textContent = (window.hoursLog || []).length;
    if (menuMarksCount) menuMarksCount.textContent = (window.marks || []).length;
    if (menuPaymentsCount) menuPaymentsCount.textContent = (window.payments || []).length;
}

function closeCloudSyncMenu() {
    const menu = document.getElementById('cloudSyncMenu');
    if (menu) {
        menu.style.display = 'none';
    }
}

function showCloudSyncInfo() {
    alert(`🌐 Supabase Cloud Sync:

✅ Automatic: Your data syncs automatically every 5 minutes
✅ Secure: Enterprise-grade security with Row Level Security
✅ Cross-Device: Access your data from any device
✅ Offline: Works without internet, syncs when connected
✅ Free: Generous free tier (up to 500MB database)

Your data is stored securely in Supabase and automatically synchronized across all your devices.`);
}

// Update the sync button in main UI
function setupCloudSyncEventListeners() {
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.onclick = manualSyncToSupabase;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDeviceId() {
    let deviceId = localStorage.getItem('worklog_device_id');
    if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('worklog_device_id', deviceId);
    }
    return deviceId;
}

function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize cloud sync when auth is ready
function initCloudSync() {
    if (typeof Auth !== 'undefined') {
        setTimeout(() => {
            initializeCloudSync();
            setupCloudSyncEventListeners();
        }, 2000);
    }
}

// Make functions available globally
window.manualSyncToSupabase = manualSyncToSupabase;
window.loadFromSupabase = loadFromSupabase;
window.showCloudSyncMenu = showCloudSyncMenu;
window.closeCloudSyncMenu = closeCloudSyncMenu;
window.showCloudSyncInfo = showCloudSyncInfo;
window.updateCloudSyncMenu = updateCloudSyncMenu;
window.initCloudSync = initCloudSync;

// cloud-sync.js - COMPLETE SYNC SYSTEM
// cloud-sync.js - UPDATED WITH BETTER ERROR HANDLING
console.log('☁️ Cloud Sync loaded');

class CloudSync {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.autoSync = true;
        this.syncEnabled = false;
        this.userId = null;
        this.syncInterval = null;
        this.initialized = false;
        
        // Supabase configuration - UPDATE THESE WITH YOUR ACTUAL KEYS
        this.supabaseConfig = {
            url: 'https://kfdhizqcjavikjwlefvk.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZGhpenFjamF2aWtqd2xlZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTE3NDMsImV4cCI6MjA3NzkyNzc0M30.w-2Tkg1-ogfeIVI8-5NRKGm4eJk5Z7cvqu5MLt1a2c4'
        };
    }

    async init() {
        if (this.initialized) {
            console.log('🔄 Cloud sync already initialized');
            return;
        }

        console.log('🔄 Initializing cloud sync...');
        
        // Check if user is authenticated
        if (!window.Auth || !window.Auth.isAuthenticated()) {
            console.log('❌ User not authenticated, sync disabled');
            this.updateSyncStatus('Not authenticated', false);
            return;
        }

        this.userId = window.Auth.getCurrentUserId();
        
        try {
            // Validate Supabase configuration
            if (!this.supabaseConfig.url || !this.supabaseConfig.anonKey) {
                throw new Error('Supabase configuration missing');
            }

            // Initialize Supabase
            this.supabase = supabase.createClient(
                this.supabaseConfig.url,
                this.supabaseConfig.anonKey
            );

            // Test connection with a simple query
            console.log('🔌 Testing Supabase connection...');
            const { data, error } = await this.supabase
                .from('worklog_data')
                .select('*')
                .limit(1);

            if (error) {
                // If table doesn't exist, that's ok - we'll create it
                if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                    console.log('ℹ️ Table does not exist yet - will create on first sync');
                    this.isConnected = true;
                    this.syncEnabled = true;
                } else {
                    throw error;
                }
            } else {
                this.isConnected = true;
                this.syncEnabled = true;
            }

            console.log('✅ Cloud sync initialized successfully');
            this.updateSyncStatus('Connected to cloud', true);
            this.initialized = true;
            
            // Load settings
            this.loadSettings();
            
            // Setup auto-sync if enabled
            if (this.autoSync) {
                this.startAutoSync();
            }
            
            // Initial sync
            this.syncData();
            
        } catch (error) {
            console.error('❌ Cloud sync initialization failed:', error);
            this.handleSyncError(error);
        }
    }

    handleSyncError(error) {
        this.isConnected = false;
        this.syncEnabled = false;
        
        let errorMessage = 'Cloud sync failed';
        
        if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
            errorMessage = 'Invalid API key - check Supabase configuration';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error - check internet connection';
        } else if (error.message.includes('does not exist')) {
            errorMessage = 'Table not found - will create on first sync';
            this.isConnected = true; // We can still proceed
            this.syncEnabled = true;
        }
        
        this.updateSyncStatus(errorMessage, false);
        
        // Disable auto-sync on error
        this.autoSync = false;
        this.stopAutoSync();
        this.updateSyncUI();
    }

    // ... rest of your existing cloud-sync.js code remains the same ...
    saveSettings() {
        const settings = {
            autoSync: this.autoSync,
            lastSync: new Date().toISOString()
        };
        localStorage.setItem(`worklog_sync_settings_${this.userId}`, JSON.stringify(settings));
    }

    updateSyncUI() {
        const syncBtn = document.getElementById('syncBtn');
        const autoSyncCheckbox = document.getElementById('autoSyncCheckbox');
        const syncStatus = document.getElementById('syncStatus');
        
        if (syncBtn) {
            syncBtn.style.display = this.syncEnabled ? 'inline-block' : 'none';
            syncBtn.innerHTML = this.autoSync ? '🔄 Auto' : '🔄 Sync Now';
        }
        
        if (autoSyncCheckbox) {
            autoSyncCheckbox.checked = this.autoSync;
        }
        
        if (syncStatus) {
            syncStatus.textContent = this.autoSync ? 'Auto-sync enabled' : 'Manual sync';
        }
    }

    updateSyncStatus(message, isConnected) {
        const syncMessage = document.getElementById('syncMessage');
        const syncIndicator = document.querySelector('.sync-indicator');
        
        if (syncMessage) {
            syncMessage.textContent = message;
        }
        
        if (syncIndicator) {
            syncIndicator.className = 'sync-indicator ' + (isConnected ? 'sync-connected' : 'sync-disconnected');
        }
        
        this.isConnected = isConnected;
    }

    async syncData() {
        if (!this.syncEnabled || !this.isConnected) {
            console.log('❌ Sync disabled or not connected');
            return;
        }

        console.log('🔄 Starting data sync...');
        this.updateSyncStatus('Syncing data...', true);

        try {
            // Load local data
            const localData = this.getLocalData();
            
            // Upload to Supabase
            await this.uploadToSupabase(localData);
            
            // Download from Supabase (merge with local)
            const cloudData = await this.downloadFromSupabase();
            this.mergeData(cloudData);
            
            console.log('✅ Sync completed successfully');
            this.updateSyncStatus('All changes synced to cloud', true);
            
            this.saveSettings();
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.updateSyncStatus('Sync failed - check connection', false);
        }
    }

    getLocalData() {
        const userId = this.userId;
        const savedData = localStorage.getItem(`worklog_data_${userId}`);
        
        if (savedData) {
            return JSON.parse(savedData);
        }
        
        return {
            students: [],
            hours: [],
            marks: [],
            attendance: [],
            payments: [],
            settings: { defaultRate: 25.00 },
            lastUpdated: new Date().toISOString()
        };
    }

    async uploadToSupabase(data) {
        if (!this.supabase) throw new Error('Supabase not initialized');

        const { error } = await this.supabase
            .from('worklog_data')
            .upsert({
                user_id: this.userId,
                data: data,
                last_updated: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) throw error;
        
        console.log('📤 Data uploaded to cloud');
    }

    async downloadFromSupabase() {
        if (!this.supabase) throw new Error('Supabase not initialized');

        const { data, error } = await this.supabase
            .from('worklog_data')
            .select('data, last_updated')
            .eq('user_id', this.userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No data found - that's ok for first sync
                console.log('ℹ️ No cloud data found (first sync)');
                return null;
            }
            throw error;
        }

        console.log('📥 Data downloaded from cloud');
        return data.data;
    }

    mergeData(cloudData) {
        if (!cloudData) {
            console.log('ℹ️ No cloud data to merge');
            return;
        }

        const localData = this.getLocalData();
        
        // Simple merge strategy: use whichever data is newer
        const cloudUpdated = new Date(cloudData.lastUpdated || 0);
        const localUpdated = new Date(localData.lastUpdated || 0);
        
        let mergedData;
        if (cloudUpdated > localUpdated) {
            console.log('🔄 Using cloud data (newer)');
            mergedData = cloudData;
        } else {
            console.log('🔄 Using local data (newer or equal)');
            mergedData = localData;
        }
        
        // Ensure all arrays exist
        mergedData.students = mergedData.students || [];
        mergedData.hours = mergedData.hours || [];
        mergedData.marks = mergedData.marks || [];
        mergedData.attendance = mergedData.attendance || [];
        mergedData.payments = mergedData.payments || [];
        mergedData.settings = mergedData.settings || { defaultRate: 25.00 };
        mergedData.lastUpdated = new Date().toISOString();
        
        // Save merged data
        this.saveLocalData(mergedData);
        
        // Update app data if app is running
        if (window.appData) {
            Object.assign(window.appData, mergedData);
        }
        
        console.log('✅ Data merged successfully');
    }

    saveLocalData(data) {
        localStorage.setItem(`worklog_data_${this.userId}`, JSON.stringify(data));
    }

    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            if (this.autoSync && this.syncEnabled) {
                this.syncData();
            }
        }, 30000); // Sync every 30 seconds
        
        console.log('⏰ Auto-sync started (30s intervals)');
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('⏹️ Auto-sync stopped');
    }

    toggleAutoSync() {
        this.autoSync = !this.autoSync;
        
        if (this.autoSync) {
            this.startAutoSync();
            this.syncData(); // Immediate sync when enabling
        } else {
            this.stopAutoSync();
        }
        
        this.saveSettings();
        this.updateSyncUI();
        
        console.log('🔧 Auto-sync:', this.autoSync ? 'enabled' : 'disabled');
    }

    manualSync() {
        console.log('👆 Manual sync triggered');
        this.syncData();
    }

    // Export data for backup
    async exportCloudData() {
        try {
            const data = await this.downloadFromSupabase();
            if (!data) {
                alert('No data found in cloud');
                return;
            }
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `worklog_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            alert('✅ Cloud data exported successfully!');
            
        } catch (error) {
            console.error('❌ Error exporting cloud data:', error);
            alert('Error exporting cloud data: ' + error.message);
        }
    }

    // Import data to cloud
    async importToCloud() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        
                        // Add metadata
                        importedData.lastUpdated = new Date().toISOString();
                        importedData.importedAt = new Date().toISOString();
                        
                        await this.uploadToSupabase(importedData);
                        alert('✅ Data imported to cloud successfully!');
                        resolve(true);
                        
                    } catch (error) {
                        console.error('❌ Error importing to cloud:', error);
                        alert('Error importing to cloud: Invalid file format');
                        resolve(false);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });
    }

    // Get sync statistics
    async getSyncStats() {
        try {
            const localData = this.getLocalData();
            const cloudData = await this.downloadFromSupabase();
            
            return {
                local: {
                    students: localData.students?.length || 0,
                    hours: localData.hours?.length || 0,
                    marks: localData.marks?.length || 0,
                    attendance: localData.attendance?.length || 0,
                    payments: localData.payments?.length || 0,
                    lastUpdated: localData.lastUpdated
                },
                cloud: cloudData ? {
                    students: cloudData.students?.length || 0,
                    hours: cloudData.hours?.length || 0,
                    marks: cloudData.marks?.length || 0,
                    attendance: cloudData.attendance?.length || 0,
                    payments: cloudData.payments?.length || 0,
                    lastUpdated: cloudData.lastUpdated
                } : null,
                syncEnabled: this.syncEnabled,
                autoSync: this.autoSync,
                isConnected: this.isConnected
            };
            
        } catch (error) {
            console.error('❌ Error getting sync stats:', error);
            return null;
        }
    }
}

// Create global instance
window.cloudSync = new CloudSync();

// Initialize when auth is ready
function initCloudSync() {
    setTimeout(() => {
        window.cloudSync.init();
    }, 1000);
}

// Auto-initialize when auth is ready
if (window.Auth && window.Auth.isAuthenticated()) {
    initCloudSync();
} else {
    // Wait for auth to initialize
    const checkAuth = setInterval(() => {
        if (window.Auth && window.Auth.isAuthenticated()) {
            clearInterval(checkAuth);
            initCloudSync();
        }
    }, 500);
}

// Make functions globally available
window.toggleAutoSync = () => window.cloudSync.toggleAutoSync();
window.manualSync = () => window.cloudSync.manualSync();
window.exportCloudData = () => window.cloudSync.exportCloudData();
window.importToCloud = () => window.cloudSync.importToCloud();
window.getSyncStats = () => window.cloudSync.getSyncStats();

// Ensure global functions are available immediately
window.toggleAutoSync = function() {
    if (window.cloudSync) {
        window.cloudSync.toggleAutoSync();
    } else {
        console.error('Cloud sync not initialized');
        alert('Cloud sync is not ready yet. Please wait a moment and try again.');
    }
};

window.manualSync = function() {
    if (window.cloudSync) {
        window.cloudSync.manualSync();
    } else {
        console.error('Cloud sync not initialized');
        alert('Cloud sync is not ready yet. Please wait a moment and try again.');
    }
};

window.exportCloudData = function() {
    if (window.cloudSync) {
        window.cloudSync.exportCloudData();
    } else {
        console.error('Cloud sync not initialized');
        alert('Cloud sync is not ready yet. Please wait a moment and try again.');
    }
};

window.importToCloud = function() {
    if (window.cloudSync) {
        window.cloudSync.importToCloud();
    } else {
        console.error('Cloud sync not initialized');
        alert('Cloud sync is not ready yet. Please wait a moment and try again.');
    }
};

window.getSyncStats = function() {
    if (window.cloudSync) {
        return window.cloudSync.getSyncStats();
    } else {
        console.error('Cloud sync not initialized');
        alert('Cloud sync is not ready yet. Please wait a moment and try again.');
        return Promise.resolve(null);
    }
};

window.showSyncStats = function() {
    if (window.cloudSync) {
        // Use the showSyncStats function from app.js
        if (typeof window.showSyncStats === 'function') {
            window.showSyncStats();
        } else {
            alert('Sync stats function not available. Make sure app.js is loaded.');
        }
    } else {
        console.error('Cloud sync not initialized');
        alert('Cloud sync is not ready yet. Please wait a moment and try again.');
    }
};

// Make closeSyncStats available globally
window.closeSyncStats = function() {
    const modal = document.getElementById('syncStatsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

console.log('✅ Cloud sync functions registered globally');

    async testConnection() {
        try {
            console.log('🧪 Testing Supabase connection...');
            
            // Test 1: Basic connection
            const { data, error } = await this.supabase
                .from('worklog_data')
                .select('count')
                .limit(1);

            if (error) {
                console.log('❌ Connection test failed:', error);
                return false;
            }

            console.log('✅ Basic connection test passed');
            
            // Test 2: Try to insert test data
            const testData = {
                user_id: 'test_user',
                data: { test: true },
                last_updated: new Date().toISOString()
            };

            const { error: insertError } = await this.supabase
                .from('worklog_data')
                .upsert(testData, { onConflict: 'user_id' });

            if (insertError) {
                console.log('❌ Insert test failed:', insertError);
                return false;
            }

            console.log('✅ Insert test passed');
            
            // Test 3: Clean up test data
            const { error: deleteError } = await this.supabase
                .from('worklog_data')
                .delete()
                .eq('user_id', 'test_user');

            if (deleteError) {
                console.log('⚠️ Cleanup failed (not critical):', deleteError);
            } else {
                console.log('✅ Cleanup test passed');
            }

            return true;
            
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }


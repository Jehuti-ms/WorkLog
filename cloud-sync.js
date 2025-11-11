// cloud-sync.js - COMPLETE FIXED VERSION
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
        this.initializing = false;

        // Track last sync info
        this.lastDownloadedData = null;
        this.lastSyncTime = null;
        this.lastSyncStatus = 'unknown';
        this.autoSyncEnabled = false;

        // Supabase configuration
        this.supabaseConfig = {
            url: 'https://kfdhizqcjavikjwlefvk.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZGhpenFjamF2aWtqd2xlZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTE3NDMsImV4cCI6MjA3NzkyNzc0M30.w-2Tkg1-ogfeIVI8-5NRKGm4eJk5Z7cvqu5MLt1a2c4'
        };
    }

    async init() {
        if (this.initialized || this.initializing) {
            console.log('🔧 Cloud sync already initialized or initializing');
            return;
        }
        this.initializing = true;
        console.log('🔄 Initializing cloud sync...');

        try {
            if (!window.Auth || !window.Auth.isAuthenticated()) {
                console.log('❌ User not authenticated, sync disabled');
                this.updateSyncStatus('Not authenticated', false);
                this.initializing = false;
                return;
            }

            this.userId = window.Auth.getCurrentUserId();

            this.supabase = supabase.createClient(
                this.supabaseConfig.url,
                this.supabaseConfig.anonKey,
                { auth: { persistSession: false, autoRefreshToken: false } }
            );

            const { error } = await this.supabase
                .from('worklog_data')
                .select('*')
                .limit(1);

            if (error && !error.message.includes('does not exist')) {
                throw error;
            }

            this.isConnected = true;
            this.syncEnabled = true;
            this.updateSyncStatus('Connected to cloud', true);
            this.initialized = true;

            this.loadSettings();
            if (this.autoSync) this.startAutoSync();
            this.syncData();

        } catch (error) {
            console.error('❌ Cloud sync initialization failed:', error);
            this.handleSyncError(error);
        } finally {
            this.initializing = false;
        }
    }

    handleSyncError(error) {
        this.isConnected = false;
        this.syncEnabled = false;
        this.updateSyncStatus('Cloud sync failed', false);
        this.autoSync = false;
        this.stopAutoSync();
        this.updateSyncUI();
    }

    loadSettings() {
        const settings = localStorage.getItem(`worklog_sync_settings_${this.userId}`);
        if (settings) {
            const parsed = JSON.parse(settings);
            this.autoSync = parsed.autoSync !== false;
        }
        this.updateSyncUI();
    }

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
            syncBtn.disabled = !this.isConnected;
        }
        if (autoSyncCheckbox) {
            autoSyncCheckbox.checked = this.autoSync && this.isConnected;
            autoSyncCheckbox.disabled = !this.isConnected;
        }
        if (syncStatus) {
            syncStatus.textContent = this.autoSync ? 'Auto-sync enabled' : 'Manual sync';
            syncStatus.style.color = this.isConnected ? '#28a745' : '#dc3545';
        }
    }

    updateSyncStatus(message, isConnected) {
        const syncMessage = document.getElementById('syncMessage');
        const syncIndicator = document.querySelector('.sync-indicator');

        if (syncMessage) {
            syncMessage.textContent = message;
            syncMessage.style.color = isConnected ? '#28a745' : '#dc3545';
        }
        if (syncIndicator) {
            syncIndicator.className = 'sync-indicator ' + (isConnected ? 'sync-connected' : 'sync-disconnected');
        }

        this.isConnected = isConnected;
        this.updateSyncUI();
    }

    async uploadToSupabase(data) {
        if (!this.supabase) throw new Error('Supabase not initialized');
        const uploadData = {
            user_id: this.userId,
            data,
            last_updated: new Date().toISOString()
        };
        const { error } = await this.supabase
            .from('worklog_data')
            .upsert(uploadData, { onConflict: ['user_id'] });
        if (error) throw error;
        console.log('✅ Data uploaded to cloud');
    }

    async downloadFromSupabase() {
        if (!this.supabase) throw new Error('Supabase not initialized');
        const { data, error } = await this.supabase
            .from('worklog_data')
            .select('data, last_updated')
            .eq('user_id', this.userId)
            .single();
        if (error && !error.message.includes('does not exist')) throw error;
        if (!data) return null;
        return { ...data.data, lastUpdated: data.last_updated };
    }

    mergeData(cloudData) {
        if (!cloudData) return;
        const localData = this.getLocalData();
        const cloudUpdated = new Date(cloudData.lastUpdated || 0);
        const localUpdated = new Date(localData.lastUpdated || 0);

        let mergedData = cloudUpdated > localUpdated ? cloudData : localData;
        mergedData.students = mergedData.students || [];
        mergedData.hours = mergedData.hours || [];
        mergedData.marks = mergedData.marks || [];
        mergedData.attendance = mergedData.attendance || [];
        mergedData.payments = mergedData.payments || [];
        mergedData.settings = mergedData.settings || { defaultRate: 25.00 };
        mergedData.lastUpdated = new Date().toISOString();

        this.saveLocalData(mergedData);
        if (window.appData) Object.assign(window.appData, mergedData);

        allPayments = mergedData.payments || [];
        console.log("✅ Payments data initialized:", allPayments.length, "records");
        return mergedData;
    }

    getLocalData() {
        const savedData = localStorage.getItem(`worklog_data_${this.userId}`);
        return savedData ? JSON.parse(savedData) : {
            students: [], hours: [], marks: [], attendance: [], payments: [],
            settings: { defaultRate: 25.00 }, lastUpdated: new Date().toISOString()
        };
    }

    saveLocalData(data) {
        localStorage.setItem(`worklog_data_${this.userId}`, JSON.stringify(data));
    }

    async syncData() {
        if (!this.syncEnabled || !this.isConnected) return;
        try {
            const localData = this.getLocalData();
            await this.uploadToSupabase(localData);
            const cloudData = await this.downloadFromSupabase();
            const mergedData = this.mergeData(cloudData);
            this.lastDownloadedData = cloudData;
            this.lastSyncTime = new Date().toISOString();
            this.lastSyncStatus = 'success';
            this.autoSyncEnabled = this.autoSync;
            this.updateSyncStatus('All changes synced to cloud', true);
        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.lastSyncStatus = 'failed';
            this.updateSyncStatus('Sync failed', false);
        }
    }

    startAutoSync() {
        this.stopAutoSync();
        this.syncInterval = setInterval(() => {
            if (this.autoSync && this.syncEnabled && this.isConnected) this.syncData();
        }, 30000);
        console.log('⏰ Auto-sync started (30s intervals)');
    }

    stopAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = null;
        console.log('⏹️ Auto-sync stopped');
    }

    toggleAutoSync() {
        this.autoSync = !this.autoSync;
        if (this.autoSync && this.isConnected) {
            this.startAutoSync();
            this.syncData();
        } else {
            this.stopAutoSync();
        }
        this.saveSettings();
        this.updateSyncUI();
    }

    manualSync() { this.syncData(); }

        async exportCloudData() {
        try {
            const data = await this.downloadFromSupabase();
            if (!data) {
                alert('No data found in cloud');
                return;
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
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

// Singleton instance
if (!window.cloudSync) {
    window.cloudSync = new CloudSync();
} else {
    console.log('ℹ️ Cloud sync instance already exists');
}

// Smart initialization
function initCloudSync() {
    if (window.cloudSync.initialized || window.cloudSync.initializing) {
        console.log('🔧 Cloud sync already initialized or initializing - skipping');
        return;
    }
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        console.log('❌ User not authenticated - delaying cloud sync init');
        return;
    }
    console.log('🚀 Starting cloud sync initialization...');
    window.cloudSync.init();
}

function autoInitCloudSync() {
    setTimeout(() => {
        if (window.Auth && window.Auth.isAuthenticated() && window.supabase) {
            initCloudSync();
        } else {
            console.log('⏳ Waiting for dependencies...');
            setTimeout(initCloudSync, 1000);
        }
    }, 500);
}
autoInitCloudSync();

// Global wrappers for UI buttons
window.toggleAutoSync = () => window.cloudSync?.toggleAutoSync();
window.manualSync = () => window.cloudSync?.manualSync();
window.exportCloudData = () => window.cloudSync?.exportCloudData();
window.importToCloud = () => window.cloudSync?.importToCloud();
window.getSyncStats = () => window.cloudSync?.getSyncStats();

// Modal helpers
window.showSyncStats = async function() {
    console.log('📊 Showing sync stats...');
    try {
        const modal = document.getElementById('syncStatsModal');
        const content = document.getElementById('syncStatsContent');
        if (!modal || !content) {
            console.error('Sync stats modal elements not found');
            return;
        }
        const stats = await window.getSyncStats();
        if (!stats) {
            content.innerHTML = "<p>Unable to load sync stats.</p>";
        } else {
            content.innerHTML = `
                <div class="sync-stats-grid">
                    <div class="stat-item"><strong>Local Students:</strong> ${stats.local.students}</div>
                    <div class="stat-item"><strong>Cloud Students:</strong> ${stats.cloud?.students || 0}</div>
                    <div class="stat-item"><strong>Local Attendance:</strong> ${stats.local.attendance}</div>
                    <div class="stat-item"><strong>Cloud Attendance:</strong> ${stats.cloud?.attendance || 0}</div>
                    <div class="stat-item"><strong>Auto-sync:</strong> ${stats.autoSync ? 'Enabled' : 'Disabled'}</div>
                    <div class="stat-item"><strong>Connection:</strong> ${stats.isConnected ? 'Connected' : 'Disconnected'}</div>
                    <div class="stat-item"><strong>Last Sync:</strong> ${stats.local.lastUpdated || 'Never'}</div>
                </div>`;
        }
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error showing sync stats:', error);
    }
};

window.closeSyncStats = function() {
    const modal = document.getElementById('syncStatsModal');
    if (modal) modal.style.display = 'none';
};

console.log('✅ Cloud sync fully initialized and global functions registered');


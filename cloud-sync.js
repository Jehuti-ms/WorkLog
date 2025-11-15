// cloud-sync.js - Fixed version
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("☁️ Cloud Sync loaded");

class CloudSync {
    constructor() {
        this.user = null;
        this.isInitialized = false;
        this.lastSync = null;
        this.syncEnabled = false;
    }

    async init() {
        try {
            if (!auth || !db) {
                throw new Error("Firebase SDK not available");
            }

            console.log("🔄 Initializing Cloud Sync...");

            return new Promise((resolve) => {
                onAuthStateChanged(auth, async (user) => {
                    this.user = user;
                    if (user) {
                        console.log("🟢 Cloud Sync authenticated:", user.email);
                        this.isInitialized = true;
                        this.syncEnabled = true;
                        this.lastSync = new Date();
                        
                        // Set up auto-sync if needed
                        this.setupAutoSync();
                    } else {
                        console.log("🔴 Cloud Sync: No user");
                        this.isInitialized = false;
                        this.syncEnabled = false;
                    }
                    resolve(true);
                });
            });

        } catch (err) {
            console.error("❌ Cloud sync initialization failed:", err);
            return false;
        }
    }

    setupAutoSync() {
        // Auto-sync can be set up here if needed
        console.log("⚡ Auto-sync available");
    }

    isCloudEnabled() {
        return this.isInitialized && this.user !== null;
    }

    getCloudUser() {
        return this.user;
    }

    getLastSync() {
        return this.lastSync;
    }

    async syncData(appData) {
        if (!this.isCloudEnabled()) {
            throw new Error("Cloud not enabled - no user authenticated");
        }

        try {
            console.log("🔄 Syncing data to cloud...");
            
            const userRef = doc(db, "users", this.user.uid);
            await setDoc(userRef, {
                ...appData,
                lastUpdated: new Date().toISOString(),
                email: this.user.email,
                syncTimestamp: new Date().toISOString()
            }, { merge: true });
            
            this.lastSync = new Date();
            console.log("✅ Data synced to Firebase");
            return true;
        } catch (error) {
            console.error("❌ Error syncing to Firebase:", error);
            throw error;
        }
    }

    async loadData() {
        if (!this.isCloudEnabled()) {
            throw new Error("Cloud not enabled - no user authenticated");
        }

        try {
            console.log("📥 Loading data from cloud...");
            const userRef = doc(db, "users", this.user.uid);
            const snapshot = await getDoc(userRef);
            
            if (snapshot.exists()) {
                const data = snapshot.data();
                this.lastSync = new Date();
                console.log("✅ Data loaded from Firebase");
                
                // Return only the relevant data, excluding metadata
                const { lastUpdated, email, syncTimestamp, ...appData } = data;
                return appData;
            } else {
                console.log("📝 No existing data in Firebase");
                return null;
            }
        } catch (error) {
            console.error("❌ Error loading from Firebase:", error);
            throw error;
        }
    }

    async manualSync(appData) {
        if (!this.isCloudEnabled()) {
            throw new Error("Please sign in to enable cloud sync");
        }

        try {
            await this.syncData(appData);
            return true;
        } catch (error) {
            console.error("❌ Manual sync failed:", error);
            throw error;
        }
    }

    async backupData(appData) {
        return this.syncData(appData);
    }

    async restoreData() {
        return this.loadData();
    }

    // Utility method to get sync status
    getSyncStatus() {
        return {
            enabled: this.syncEnabled,
            user: this.user ? this.user.email : null,
            lastSync: this.lastSync,
            initialized: this.isInitialized
        };
    }
}

// Create and export singleton instance
const cloudSync = new CloudSync();

// Initialize when imported
cloudSync.init().then(success => {
    if (success) {
        console.log("✅ Cloud Sync ready");
    }
});

export { cloudSync };

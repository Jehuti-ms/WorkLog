// cloud-sync.js

console.log("☁️ Cloud Sync loaded");

// ✅ State
let syncState = {
  lastSync: null,
  autoSyncEnabled: true,
  dependenciesReady: false
};

// ✅ Utility: safe log
function logSync(msg) {
  console.log(`🔄 ${msg}`);
}

// ✅ Check authentication
function isAuthenticated() {
  const session = localStorage.getItem("worklog_session");
  return !!session;
}

// ✅ Save data to localStorage (simulated cloud)
function saveToCloud() {
  try {
    localStorage.setItem("appData", JSON.stringify(appData));
    syncState.lastSync = new Date().toISOString();
    logSync(`Data saved locally at ${syncState.lastSync}`);
  } catch (e) {
    console.error("❌ Failed to save data:", e);
  }
}

// ✅ Load data from localStorage (simulated cloud)
function loadFromCloud() {
  try {
    const saved = localStorage.getItem("appData");
    if (saved) {
      appData = JSON.parse(saved);
      logSync("Data loaded from local storage");
    } else {
      logSync("No saved data found");
    }
  } catch (e) {
    console.error("❌ Failed to load data:", e);
  }
}

// ✅ Manual sync
function manualSync() {
  if (!isAuthenticated()) {
    console.warn("❌ User not authenticated - cannot sync");
    return;
  }
  logSync("manualSync() called");
  saveToCloud();
}

// ✅ Auto sync loop
function startAutoSync() {
  if (!syncState.autoSyncEnabled) return;
  setInterval(() => {
    if (isAuthenticated()) {
      saveToCloud();
    } else {
      console.warn("❌ User not authenticated - delaying auto sync");
    }
  }, 30000); // every 30s
  logSync("Auto-sync enabled (local loop)");
}

// ✅ Dependency check
function initCloudSync() {
  if (!isAuthenticated()) {
    console.warn("❌ User not authenticated - delaying cloud sync init");
    return;
  }
  syncState.dependenciesReady = true;
  logSync("✅ Cloud sync fully initialized and global functions registered");
  startAutoSync();
}

// ✅ Expose globals
window.manualSync = manualSync;
window.loadFromCloud = loadFromCloud;
window.saveToCloud = saveToCloud;
window.initCloudSync = initCloudSync;

// ✅ Boot
document.addEventListener("DOMContentLoaded", () => {
  logSync("⏳ Waiting for dependencies...");
  initCloudSync();
});

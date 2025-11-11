// cloud-sync.js
console.log("☁️ Cloud Sync loaded");

let syncState = { lastSync: null, autoSyncEnabled: true };

function isAuthenticated() {
  return !!localStorage.getItem("worklog_session");
}

function saveToCloud() {
  try {
    localStorage.setItem("appData", JSON.stringify(appData));
    syncState.lastSync = new Date().toISOString();
    console.log(`✅ Data saved at ${syncState.lastSync}`);
  } catch (e) { console.error("❌ Save failed:", e); }
}

function loadFromCloud() {
  try {
    const saved = localStorage.getItem("appData");
    if (saved) {
      appData = JSON.parse(saved);
      console.log("✅ Data loaded from local storage");
    }
  } catch (e) { console.error("❌ Load failed:", e); }
}

function manualSync() {
  if (!isAuthenticated()) {
    console.warn("❌ Not authenticated — cannot sync");
    return;
  }
  console.log("🔄 manualSync() called");
  saveToCloud();
}

function startAutoSync() {
  if (!syncState.autoSyncEnabled) return;
  setInterval(() => {
    if (isAuthenticated()) saveToCloud();
    else console.warn("❌ Not authenticated — delaying auto sync");
  }, 30000);
  console.log("🔄 Auto-sync enabled");
}

function initCloudSync() {
  if (!isAuthenticated()) {
    console.warn("❌ User not authenticated — delaying cloud sync init");
    return;
  }
  console.log("✅ Cloud sync initialized");
  startAutoSync();
}

window.manualSync = manualSync;
window.loadFromCloud = loadFromCloud;
window.saveToCloud = saveToCloud;
window.initCloudSync = initCloudSync;

document.addEventListener("DOMContentLoaded", () => {
  console.log("⏳ Waiting for dependencies...");
  initCloudSync();
});

// auth.js — Unified authentication and utilities for WorkLog
console.log("🔑 Auth.js loaded");

// ============================================================================
// CONFIG & STATE
// ============================================================================
const AUTH_CONFIG = {
  storageKey: "worklog_users",
  googleClientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" // TODO: replace
};

let authState = {
  isAuthenticated: false,
  currentUser: null,
  users: []
};

// Restore session if present
(function loadSession() {
  const saved = localStorage.getItem("worklog_session");
  if (saved) {
    try {
      authState.currentUser = JSON.parse(saved);
      authState.isAuthenticated = !!authState.currentUser;
      console.log("✅ Session restored:", authState.currentUser);
    } catch {
      localStorage.removeItem("worklog_session");
    }
  }

  // Restore users list
  const savedUsers = localStorage.getItem(AUTH_CONFIG.storageKey);
  if (savedUsers) {
    try {
      authState.users = JSON.parse(savedUsers) || [];
    } catch {
      authState.users = [];
    }
  }
})();

function saveAuthData() {
  localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(authState.users));
  if (authState.currentUser) {
    localStorage.setItem("worklog_session", JSON.stringify(authState.currentUser));
  }
}

// ============================================================================
/* CORE AUTH API */
function getCurrentUser() {
  return authState.currentUser;
}
function getCurrentUserId() {
  return authState.currentUser?.id || null;
}
function logoutUser() {
  authState.isAuthenticated = false;
  authState.currentUser = null;
  localStorage.removeItem("worklog_session");
  showNotification("Logged out successfully", "success");
  window.location.href = "auth.html";
}

// ============================================================================
// FORM HANDLERS (Login / Register / Forgot)
// ============================================================================
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  // Simple local auth (replace with real provider later)
  let user = authState.users.find(u => u.email === email);
  if (!user) {
    user = { id: email, name: email, email };
    authState.users.push(user);
  }

  authState.currentUser = user;
  authState.isAuthenticated = true;
  user.lastLogin = new Date().toISOString();
  saveAuthData();

  showNotification("✅ Signed in as " + email, "success");
  window.location.href = "index.html";
});

document.getElementById("registerForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  let user = authState.users.find(u => u.email === email);
  if (user) {
    showNotification("Account already exists. Please sign in.", "info");
  } else {
    user = { id: email, name, email, createdAt: new Date().toISOString() };
    authState.users.push(user);
  }

  authState.currentUser = user;
  authState.isAuthenticated = true;
  saveAuthData();

  showNotification("✅ Account created for " + name, "success");
  window.location.href = "index.html";
});

document.getElementById("forgotPasswordForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value;
  showNotification("📧 Password reset link sent to " + email, "info");
});

// ============================================================================
// GOOGLE AUTH (GSI)
// ============================================================================
function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts?.id) {
      initializeGoogleAuth();
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("✅ Google OAuth library loaded");
      try {
        initializeGoogleAuth();
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () => reject(new Error("Failed to load Google OAuth"));
    document.head.appendChild(script);
  });
}

function initializeGoogleAuth() {
  google.accounts.id.initialize({
    client_id: AUTH_CONFIG.googleClientId,
    callback: handleGoogleCredentialResponse,
    ux_mode: "popup",
    auto_select: false
  });
  console.log("✅ Google OAuth initialized");

  // Render buttons in both containers if present
  renderGoogleSignInButton("googleSignInButton");
  renderGoogleSignInButton("googleSignInButtonRegister");
  google.accounts.id.prompt();
}

function handleGoogleCredentialResponse(response) {
  try {
    const credential = parseJwt(response.credential);
    handleGoogleUser(credential);
  } catch (error) {
    console.error("❌ Error handling Google credential:", error);
    showNotification("Error signing in with Google", "error");
  }
}

function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
  return JSON.parse(jsonPayload);
}

async function handleGoogleUser(googleUser) {
  let user = authState.users.find(u => u.email === googleUser.email);
  if (!user) {
    user = {
      id: "google_" + googleUser.sub,
      googleId: googleUser.sub,
      name: googleUser.name,
      email: googleUser.email.toLowerCase(),
      avatar: googleUser.picture,
      authProvider: "google",
      createdAt: new Date().toISOString()
    };
    authState.users.push(user);
  }
  user.lastLogin = new Date().toISOString();

  authState.isAuthenticated = true;
  authState.currentUser = user;

  saveAuthData();
  showNotification(`👋 Welcome, ${user.name}!`, "success");
  setTimeout(() => window.location.href = "index.html", 1000);
}

function renderGoogleSignInButton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      logo_alignment: "left"
    });
  } catch (error) {
    console.log("Google button render failed; showing fallback", error);
    const fallbackId = containerId === "googleSignInButton" ? "fallbackGoogleButton" : "fallbackGoogleButtonRegister";
    const fallbackBtn = document.getElementById(fallbackId);
    if (fallbackBtn) fallbackBtn.style.display = "flex";
  }
}

async function signInWithGoogle() {
  try {
    console.log("🔐 Starting Google sign-in...");
    await initGoogleAuth();
    // If the GSI button didn't render automatically, re-render now
    renderGoogleSignInButton("googleSignInButton");
    renderGoogleSignInButton("googleSignInButtonRegister");
  } catch (error) {
    console.error("❌ Google sign-in error:", error);
    showNotification("Google sign-in is currently unavailable", "error");
  }
}

function manualGoogleSignIn() {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${AUTH_CONFIG.googleClientId}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=code&scope=profile%20email&state=google_auth`;
  window.location.href = googleAuthUrl;
}

// ============================================================================
// GITHUB PLACEHOLDER
// ============================================================================
function signInWithGitHub() {
  showNotification("💻 GitHub authentication would be implemented here", "info");
}

// ============================================================================
// UTILITIES (Reset, Export, Debug, Profile Modal)
// ============================================================================
function resetAllData() {
  console.log("🗑️ Resetting all data...");
  try {
    if (window.appData && window.resetAppData) window.resetAppData();
    window.hoursEntries = [];
    const userId = getCurrentUserId();
    if (userId) localStorage.removeItem(`worklog_data_${userId}`);
    localStorage.removeItem("worklog_hours");
    if (window.saveAllData) window.saveAllData();
    alert("✅ All data has been reset! The page will reload.");
    window.location.reload();
  } catch (err) {
    console.error("Reset error:", err);
    showNotification("Error resetting data", "error");
  }
}

function showLogoutConfirm() {
  if (confirm("Are you sure you want to logout?")) {
    logoutUser();
    closeProfileModal();
  }
}

function exportUserData() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showNotification("No user data to export", "error");
    return;
  }
  try {
    const userId = currentUser.id;
    const userData = {
      profile: currentUser,
      appData: JSON.parse(localStorage.getItem(`worklog_data_${userId}`) || "{}"),
      hoursData: window.hoursEntries || [],
      exportDate: new Date().toISOString(),
      exportVersion: "1.0"
    };
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (currentUser.name || currentUser.email || "user").replace(/\s+/g, "_");
    link.download = `worklog_backup_${safeName}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification("📤 User data exported successfully!", "success");
    closeProfileModal();
  } catch (error) {
    console.error("Export error:", error);
    showNotification("Error exporting data", "error");
  }
}

function resetAuthData() {
  if (!confirm("Reset all authentication data? This will clear users and session.")) return;
  localStorage.removeItem(AUTH_CONFIG.storageKey);
  localStorage.removeItem("worklog_session");
  authState = { isAuthenticated: false, currentUser: null, users: [] };
  showNotification("Auth data reset successfully", "success");
  setTimeout(() => window.location.href = "auth.html", 500);
}

function debugAuth() {
  console.log("=== AUTH DEBUG INFO ===");
  console.log("Auth state:", authState);
  console.log("Session in localStorage:", localStorage.getItem("worklog_session"));
  console.log("All users:", authState.users);
  console.log("Current user:", authState.currentUser);

  const debugInfo = `
Auth State:
- Authenticated: ${authState.isAuthenticated}
- Current User: ${authState.currentUser ? (authState.currentUser.name || authState.currentUser.email) : "None"}
- Total Users: ${authState.users.length}
- Session: ${localStorage.getItem("worklog_session") ? "Exists" : "None"}
  `.trim();
  alert(debugInfo);
}

// Profile modal helpers (no-op placeholders; wire to your UI if needed)
function showProfileModal() {
  const modal = document.getElementById("profileModal");
  if (modal) modal.style.display = "block";
}
function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  if (modal) modal.style.display = "none";
}

// Close profile modal when clicking outside
document.addEventListener("click", function(event) {
  const modal = document.getElementById("profileModal");
  if (modal && event.target === modal) {
    closeProfileModal();
  }
});

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================
window.Auth = {
  isAuthenticated: () => authState.isAuthenticated,
  getCurrentUser: getCurrentUser,
  getCurrentUserId: getCurrentUserId,
  logoutUser: logoutUser,
  resetAuthData: resetAuthData,
  debugAuth: debugAuth,
  showAuthModal: () => (window.location.href = "auth.html"),
  showProfileModal: showProfileModal,
  resetAllData: resetAllData,
  exportUserData: exportUserData
};

window.signInWithGoogle = signInWithGoogle;
window.signInWithGitHub = signInWithGitHub;
window.manualGoogleSignIn = manualGoogleSignIn;
window.showProfileModal = showProfileModal;
window.closeProfileModal = closeProfileModal;

// Initialize Google Auth after DOM ready (and render buttons)
document.addEventListener("DOMContentLoaded", () => {
  // Render fallback if GSI fails
  setTimeout(async () => {
    try {
      await initGoogleAuth();
    } catch {
      console.log("Google Auth not available, showing fallback buttons");
      ["fallbackGoogleButton", "fallbackGoogleButtonRegister"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = "flex";
      });
    }
  }, 500);
});

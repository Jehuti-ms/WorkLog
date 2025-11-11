// auth.js

console.log("🔑 Auth.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = document.querySelectorAll(".auth-tab");

  // ✅ Tab switching
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".auth-tab-content").forEach(c => c.style.display = "none");
      document.getElementById(tab.dataset.tab).style.display = "block";
    });
  });

  // ✅ Login
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    // Simulate login
    localStorage.setItem("worklog_session", email);
    console.log(`✅ Signed in as ${email}`);
    window.location.replace("index.html");
  });

  // ✅ Register
  registerForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    // Simulate account creation
    localStorage.setItem("worklog_session", email);
    console.log(`✅ Account created for ${email}`);
    alert("Account created! You are now signed in.");
    window.location.replace("index.html");
  });
});

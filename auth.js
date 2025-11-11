// auth.js
console.log("🔑 Auth.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = document.querySelectorAll(".auth-tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".auth-tab-content").forEach(c => c.style.display = "none");
      document.getElementById(tab.dataset.tab).style.display = "block";
    });
  });

  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password

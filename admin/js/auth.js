const AdminAuth = (() => {
  const SESSION_KEY = "wedding_admin_v1_session";
  // Development-only credentials. Replace with secure server authentication for production.
  const credentials = { username: "admin", password: "ubah-admin-123" };
  const isLoggedIn = () => localStorage.getItem(SESSION_KEY) === "active";
  const requireAuth = () => { if (!isLoggedIn() && !location.pathname.endsWith("login.html")) location.replace("login.html"); };
  const logout = () => { localStorage.removeItem(SESSION_KEY); location.replace("login.html"); };
  if (!location.pathname.endsWith("login.html")) requireAuth();
  document.addEventListener("DOMContentLoaded", () => { const form = document.querySelector("#login-form"); if (!form) return; if (isLoggedIn()) location.replace("index.html"); form.addEventListener("submit", (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(form)); if (values.username === credentials.username && values.password === credentials.password) { localStorage.setItem(SESSION_KEY, "active"); location.replace("index.html"); } else document.querySelector("#login-error").textContent = "Username atau password tidak sesuai."; }); });
  return { logout, isLoggedIn };
})();

const AUTH_KEY = "mtechbenin_admin_auth";
const ACCESS_TOKEN_KEY = "mtechbenin_admin_access_token";

function isSecure() {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:";
}

function cookieOptions(maxAge) {
  const base = `path=/; max-age=${maxAge}; SameSite=Lax`;
  return isSecure() ? `${base}; Secure` : base;
}

export function getAdminAccessToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAdminSession(accessToken) {
  if (typeof window === "undefined" || !accessToken) return;
  const maxAge = 60 * 60 * 24 * 7; // 7 jours
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  document.cookie = "admin-token=; path=/; max-age=0";
  document.cookie = `${AUTH_KEY}=true; ${cookieOptions(maxAge)}`;
  try {
    const raw = window.localStorage.getItem("mtechbenin-settings");
    if (raw) {
      const persisted = JSON.parse(raw);
      if (persisted?.state && Object.prototype.hasOwnProperty.call(persisted.state, "adminPassword")) {
        delete persisted.state.adminPassword;
        window.localStorage.setItem("mtechbenin-settings", JSON.stringify(persisted));
      }
    }
  } catch {}
}

export function logoutAdmin() {
  document.cookie = `${AUTH_KEY}=; path=/; max-age=0`;
  document.cookie = "admin-token=; path=/; max-age=0";
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function isAdminAuthenticated() {
  if (typeof window === "undefined") return false;
  return document.cookie.includes(`${AUTH_KEY}=true`);
}

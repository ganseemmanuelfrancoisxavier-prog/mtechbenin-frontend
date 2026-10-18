const AUTH_KEY = "mtechbenin_admin_auth";
const ADMIN_KEY = "admin-token";

function isSecure() {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:";
}

function cookieOptions(maxAge) {
  const base = `path=/; max-age=${maxAge}; SameSite=Lax`;
  return isSecure() ? `${base}; Secure` : base;
}

// Utilisé uniquement pour la vérification locale du formulaire "Mot de passe actuel"
export function getStoredPassword() {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("mtechbenin-settings");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.state?.adminPassword || "";
  } catch {
    return "";
  }
}

export function setStoredPassword(pwd) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("mtechbenin-settings");
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state.adminPassword = pwd;
    localStorage.setItem("mtechbenin-settings", JSON.stringify(parsed));
  } catch {}
}

// Appelé après une vérification backend réussie
export function setAdminSession(password) {
  const maxAge = 60 * 60 * 24 * 7; // 7 jours
  document.cookie = `${AUTH_KEY}=true; ${cookieOptions(maxAge)}`;
  document.cookie = `${ADMIN_KEY}=${encodeURIComponent(password)}; ${cookieOptions(maxAge)}`;
  setStoredPassword(password);
}

export function logoutAdmin() {
  document.cookie = `${AUTH_KEY}=; path=/; max-age=0`;
  document.cookie = `${ADMIN_KEY}=; path=/; max-age=0`;
}

export function isAdminAuthenticated() {
  if (typeof window === "undefined") return false;
  return document.cookie.includes(`${AUTH_KEY}=true`);
}

export function updateAdminCookie(newPassword) {
  if (typeof window === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${ADMIN_KEY}=${encodeURIComponent(newPassword)}; ${cookieOptions(maxAge)}`;
}

const API_URL = process.env.NODE_ENV === "development"
  ? process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || "https://mtechbenin-backend-xp3i.onrender.com"
  : "";
const ACCESS_TOKEN_KEY = "mtechbenin_client_access_token";

function getToken() {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function refresh() {
  const response = await fetch(\`\${API_URL}/api/client-account/refresh\`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    setToken(null);
    return false;
  }
  const data = await response.json();
  setToken(data.accessToken);
  return true;
}

async function request(path, options = {}, retry = true) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = \`Bearer \${token}\`;
  const response = await fetch(\`\${API_URL}/api/client-account\${path}\`, {
    ...options,
    credentials: "include",
    headers,
  });
  if (response.status === 401 && retry && await refresh()) {
    return request(path, options, false);
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "Une erreur est survenue.");
    error.status = response.status;
    throw error;
  }
  if (data.accessToken) setToken(data.accessToken);
  return data;
}

const post = (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }, false);

export const clientAccountApi = {
  requestCode: (data) => post("/request-code", data),
  verifyCode: (data) => post("/verify-code", data),
  me: () => request("/me"),
  orders: () => request("/orders"),
  logout: async () => {
    try { await post("/logout", {}); } finally { setToken(null); }
  },
};

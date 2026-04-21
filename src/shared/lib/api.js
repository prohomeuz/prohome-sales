/**
 * DATA layer: single API client.
 * All fetch calls go through this for consistent base URL and auth.
 */

const BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_BASE_URL || "");

/** @returns {string|null} */
function getToken() {
  return localStorage.getItem("token");
}

/** Token muddati tugasa — foydalanuvchini tizimdan chiqaradi */
function handleUnauthorized() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.setItem("theme", "light");
  document.documentElement.classList.remove("dark");
  window.location.replace("/login");
}

/** Full URL for static assets (e.g. company logo). */
export function apiUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BASE}/api/v1/${path}`;
}

/**
 * @param {string} path - e.g. "/api/v1/user/all/admin"
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function apiRequest(path, options = {}) {
  const token = getToken();
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const isJsonBody = typeof options.body === "string";
  const headers = {
    ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 && !path.includes("/auth/")) {
      handleUnauthorized();
    }
    return res;
  } catch (err) {
    console.error(`API Request failed [${path}]:`, err);
    throw err;
  }
}

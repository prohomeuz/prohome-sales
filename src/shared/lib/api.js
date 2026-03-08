/**
 * DATA layer: single API client.
 * All fetch calls go through this for consistent base URL and auth.
 */

const BASE = import.meta.env.VITE_BASE_URL;

export function getToken() {
  return localStorage.getItem("token");
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
  const headers = {
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  return res;
}

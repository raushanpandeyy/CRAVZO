import { API_BASE_URL } from "../constants/apiEndpoints.js";

const getStoredToken = () => localStorage.getItem("dodagoAuthToken");

// In-memory dedup cache only — localStorage cache was removed because it
// conflicted with React Query's server-state cache (dual-cache staleness
// up to 10 min). React Query is the single source of truth now.

const _dedupCache = new Map();
const DEDUP_WINDOW_MS = 30000;

const getDedupCached = (key) => {
  const entry = _dedupCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > DEDUP_WINDOW_MS) {
    _dedupCache.delete(key);
    return null;
  }
  return entry.promise;
};

const setDedupCache = (key, promise) => {
  _dedupCache.set(key, { promise, ts: Date.now() });
  setTimeout(() => _dedupCache.delete(key), DEDUP_WINDOW_MS + 100);
};

export const invalidateCache = (pathPrefix) => {
  const dedupPrefixes = [
    pathPrefix,
    pathPrefix.replace("/api/", "/api/v1/"),
    pathPrefix.replace("/api/v1/", "/api/"),
  ];
  for (const key of _dedupCache.keys()) {
    if (dedupPrefixes.some((p) => key.startsWith(p))) _dedupCache.delete(key);
  }
};

async function apiRequest(path, options = {}) {
  const { skipAuth = false, skipCache = false, ...fetchOptions } = options;
  const isGet = !fetchOptions.method || fetchOptions.method.toUpperCase() === "GET";
  const cacheKey = path;

  if (isGet && !skipCache) {
    const deduped = getDedupCached(cacheKey);
    if (deduped) return deduped;
  }

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (!skipAuth && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const fetchPromise = fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
    signal: controller.signal,
  })
    .then(async (response) => {
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(data?.message || "Request failed");
        error.status = response.status;
        error.data = data;
        _dedupCache.delete(cacheKey);
        throw error;
      }
      return data;
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      _dedupCache.delete(cacheKey);
      if (!navigator.onLine) throw new Error("No internet connection");
      if (error.name === "AbortError") throw new Error("Request timeout. Please try again.");
      throw new Error(error.message || "Network error");
    });

  if (isGet && !skipCache) {
    setDedupCache(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

export { apiRequest };

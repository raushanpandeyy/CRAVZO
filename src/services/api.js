import { API_BASE_URL } from "../constants/apiEndpoints.js";

const getStoredToken = () => localStorage.getItem("cravzoAuthToken");

// ── In-memory GET cache ────────────────────────────────────────────────────────
// Prevents duplicate GET calls fired within the same JS tick or within a
// short dedup window (e.g. React StrictMode double-invocations, multiple
// components mounting simultaneously and calling the same endpoint).
//
// Cache entries expire after DEDUP_WINDOW_MS — real data is always fetched
// on the next request after expiry.
const _cache = new Map();
const DEDUP_WINDOW_MS = 3000; // 3 seconds — enough to collapse same-tick duplicates

const getCached = (key) => {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > DEDUP_WINDOW_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.promise; // Return the in-flight or resolved promise
};

const setCached = (key, promise) => {
  _cache.set(key, { promise, ts: Date.now() });
  // Auto-clean after window expires
  setTimeout(() => _cache.delete(key), DEDUP_WINDOW_MS + 100);
};

// Invalidate cache for a path prefix (call after mutations)
export const invalidateCache = (pathPrefix) => {
  for (const key of _cache.keys()) {
    if (key.startsWith(pathPrefix)) _cache.delete(key);
  }
};

// ── Core request function ──────────────────────────────────────────────────────
async function apiRequest(path, options = {}) {
  const { skipAuth = false, skipCache = false, ...fetchOptions } = options;
  const isGet = !fetchOptions.method || fetchOptions.method.toUpperCase() === "GET";
  const cacheKey = path; // GET path is the cache key

  // Return cached GET promise for dedup window
  if (isGet && !skipCache) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
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
        // Remove from cache on error so next call retries
        _cache.delete(cacheKey);
        throw error;
      }
      return data;
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      _cache.delete(cacheKey);
      if (!navigator.onLine) throw new Error("No internet connection");
      if (error.name === "AbortError") throw new Error("Request timeout. Please try again.");
      throw new Error(error.message || "Network error");
    });

  // Store promise immediately so concurrent callers share it
  if (isGet && !skipCache) {
    setCached(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

export { apiRequest };

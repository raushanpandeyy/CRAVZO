import { API_BASE_URL } from "../constants/apiEndpoints.js";

const getStoredToken = () => localStorage.getItem("cravzoAuthToken");

const CACHE_PREFIX = "cravzo_cache_";
const CACHE_TTL_MS = 5 * 60 * 1000;

const getCacheKey = (path) => `${CACHE_PREFIX}${path}`;

const getPersistentCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
};

const setPersistentCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full
  }
};

const deletePersistentCache = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // silently fail
  }
};

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
  const fullPrefix = `${CACHE_PREFIX}${pathPrefix}`;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(fullPrefix)) {
      localStorage.removeItem(k);
    }
  }
  for (const key of _dedupCache.keys()) {
    if (key.startsWith(pathPrefix)) _dedupCache.delete(key);
  }
};

async function apiRequest(path, options = {}) {
  const { skipAuth = false, skipCache = false, ...fetchOptions } = options;
  const isGet = !fetchOptions.method || fetchOptions.method.toUpperCase() === "GET";
  const cacheKey = path;
  const persistentKey = getCacheKey(path);

  if (isGet && !skipCache) {
    const deduped = getDedupCached(cacheKey);
    if (deduped) return deduped;

    const cached = getPersistentCache(persistentKey);
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
        _dedupCache.delete(cacheKey);
        deletePersistentCache(persistentKey);
        throw error;
      }
      if (isGet && !skipCache) {
        setPersistentCache(persistentKey, data);
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

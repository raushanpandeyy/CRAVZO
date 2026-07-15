import { env } from "../config/env.js";

const MAX_ENTRIES = env.MEMORY_CACHE_MAX_ENTRIES;
const DEFAULT_TTL_MS = 300000;

const cache = new Map();
const keyOrder = [];

const touchKey = (key) => {
  const idx = keyOrder.indexOf(key);
  if (idx > -1) {
    keyOrder.splice(idx, 1);
  }
  keyOrder.push(key);
};

const evictLRU = () => {
  while (keyOrder.length > MAX_ENTRIES) {
    const oldest = keyOrder.shift();
    cache.delete(oldest);
  }
};

const memoryCache = {
  get(key) {
    const entry = cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      cache.delete(key);
      return undefined;
    }
    touchKey(key);
    return entry.value;
  },

  set(key, value, ttlMs = DEFAULT_TTL_MS) {
    cache.set(key, { value, expiry: Date.now() + ttlMs });
    touchKey(key);
    evictLRU();
  },

  del(key) {
    cache.delete(key);
    const idx = keyOrder.indexOf(key);
    if (idx > -1) keyOrder.splice(idx, 1);
  },

  flush() {
    cache.clear();
    keyOrder.length = 0;
  },

  size() {
    return cache.size;
  },
};

export { memoryCache };
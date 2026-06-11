const store = new Map();
const timers = new Map();

const DEFAULT_TTL_MS = 30000;

const memoryCache = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  },

  set(key, value, ttlMs = DEFAULT_TTL_MS) {
    if (timers.has(key)) {
      clearTimeout(timers.get(key));
    }
    store.set(key, { value, expiry: Date.now() + ttlMs });
    timers.set(key, setTimeout(() => {
      store.delete(key);
      timers.delete(key);
    }, ttlMs));
    timers.get(key).unref();
  },

  del(key) {
    store.delete(key);
    if (timers.has(key)) {
      clearTimeout(timers.get(key));
      timers.delete(key);
    }
  },

  flush() {
    store.clear();
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
  },
};

export { memoryCache };

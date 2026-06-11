import { connectRedis } from "../config/redis.js";
import { memoryCache } from "./memoryCache.js";

const L1_TTL_RATIO = 0.3;

const getCacheClient = async () => {
  try {
    return await connectRedis();
  } catch (error) {
    console.error("Redis cache unavailable:", error.message);
    return null;
  }
};

const getCache = async (key) => {
  if (!key) return null;
  const fromMem = memoryCache.get(key);
  if (fromMem !== undefined) return fromMem;

  const client = await getCacheClient();

  if (!client?.isOpen) {
    return null;
  }

  try {
    const cached = await client.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      memoryCache.set(key, parsed);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Redis cache read failed:", error.message);
    return null;
  }
};

const mgetCache = async (keys) => {
  const result = {};
  const missing = [];

  for (const key of keys) {
    if (!key) continue;
    const fromMem = memoryCache.get(key);
    if (fromMem !== undefined) {
      result[key] = fromMem;
    } else {
      missing.push(key);
    }
  }

  if (missing.length === 0) return result;

  const client = await getCacheClient();
  if (!client?.isOpen) return result;

  try {
    const values = await client.mGet(missing);
    for (let i = 0; i < missing.length; i++) {
      if (values[i]) {
        const parsed = JSON.parse(values[i]);
        result[missing[i]] = parsed;
        memoryCache.set(missing[i], parsed);
      }
    }
  } catch (error) {
    console.error("Redis multi-get failed:", error.message);
  }

  return result;
};

const setCache = async (key, value, ttlSeconds) => {
  const l1Ttl = Math.max(Math.round(ttlSeconds * L1_TTL_RATIO) * 1000, 5000);
  memoryCache.set(key, value, l1Ttl);

  const client = await getCacheClient();

  if (!client?.isOpen) {
    return;
  }

  try {
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  } catch (error) {
    console.error("Redis cache write failed:", error.message);
  }
};

const deleteCache = async (...keys) => {
  keys.forEach((k) => memoryCache.del(k));

  const client = await getCacheClient();
  const cacheKeys = keys.filter(Boolean);

  if (!client?.isOpen || cacheKeys.length === 0) {
    return;
  }

  try {
    await client.del(cacheKeys);
  } catch (error) {
    console.error("Redis cache delete failed:", error.message);
  }
};

const deleteCacheByPattern = async (pattern) => {
  const client = await getCacheClient();

  if (!client?.isOpen) {
    return;
  }

  try {
    let cursor = "0";

    do {
      const [nextCursor, keys] = await client.sendCommand([
        "SCAN",
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        "100",
      ]);

      cursor = nextCursor;

      if (keys.length > 0) {
        await client.del(keys);
        keys.forEach((k) => memoryCache.del(k));
      }
    } while (cursor !== "0");
  } catch (error) {
    console.error("Redis cache pattern delete failed:", error.message);
  }
};

const normalizeCachePart = (value) =>
  encodeURIComponent(String(value ?? "").trim().toLowerCase());

const buildCacheKey = (prefix, parts = {}) => {
  const query = Object.entries(parts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${normalizeCachePart(key)}=${normalizeCachePart(value)}`)
    .join(":");

  return query ? `${prefix}:${query}` : prefix;
};

export { buildCacheKey, deleteCache, deleteCacheByPattern, getCache, mgetCache, setCache };

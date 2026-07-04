import { connectRedis } from "../config/redis.js";
import { memoryCache } from "./memoryCache.js";

const L1_TTL_RATIO = 0.3;
let cacheClient = null;

const getCacheClient = async () => {
  if (cacheClient?.isOpen) return cacheClient;
  try {
    cacheClient = await connectRedis();
    return cacheClient;
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

const INDEXED_PREFIXES = ["restaurants:list", "restaurants:nearby"];

const getIndexKey = (key) => {
  for (const prefix of INDEXED_PREFIXES) {
    if (key.startsWith(prefix)) return `cache:ix:${prefix}`;
  }
  return null;
};

const indexCacheKey = async (client, key) => {
  const indexKey = getIndexKey(key);
  if (indexKey) {
    await client.sAdd(indexKey, key);
  }
};

const deindexCacheKey = async (client, key) => {
  const indexKey = getIndexKey(key);
  if (indexKey) {
    await client.sRem(indexKey, key);
  }
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
    await indexCacheKey(client, key);
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
    for (const key of cacheKeys) {
      await deindexCacheKey(client, key);
    }
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
    // Prefer index-based deletion for known prefixes
    if (INDEXED_PREFIXES.some((prefix) => pattern.includes(prefix))) {
      const match = pattern.replace(/:?\*$/, "");
      const idx = INDEXED_PREFIXES.indexOf(match);
      const indexKey = idx !== -1 ? `cache:ix:${INDEXED_PREFIXES[idx]}` : null;

      if (indexKey) {
        const members = await client.sMembers(indexKey);
        if (members.length > 0) {
          await client.del([indexKey, ...members]);
          members.forEach((k) => memoryCache.del(k));
        }
        return;
      }
    }

    // Fallback: batch SCAN with UNLINK (non-blocking) instead of DEL
    const UNLINK_BATCH_SIZE = 50;
    let cursor = "0";
    let batch = [];
    do {
      const [nextCursor, keys] = await client.sendCommand([
        "SCAN",
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        UNLINK_BATCH_SIZE,
      ]);

      cursor = nextCursor;

      if (keys.length > 0) {
        batch.push(...keys);
        if (batch.length >= UNLINK_BATCH_SIZE) {
          await client.unlink(batch);
          batch.forEach((k) => memoryCache.del(k));
          batch = [];
        }
      }
    } while (cursor !== "0");

    if (batch.length > 0) {
      await client.unlink(batch);
      batch.forEach((k) => memoryCache.del(k));
    }
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

import { connectRedis } from "../config/redis.js";

const getCacheClient = async () => {
  try {
    return await connectRedis();
  } catch (error) {
    console.error("Redis cache unavailable:", error.message);
    return null;
  }
};

const getCache = async (key) => {
  const client = await getCacheClient();

  if (!client?.isOpen) {
    return null;
  }

  try {
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Redis cache read failed:", error.message);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds) => {
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

export { buildCacheKey, deleteCache, deleteCacheByPattern, getCache, setCache };

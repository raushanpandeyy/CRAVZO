import { createHash } from "crypto";
import { connectRedis } from "../config/redis.js";

const GEOCODE_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days — locations rarely change

const getCachedCoords = async (address) => {
  try {
    const client = await connectRedis();
    if (!client?.isOpen) return null;
    const hash = createHash("md5").update(address.toLowerCase()).digest("hex");
    const cached = await client.get(`geocode:${hash}`);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
};

const setCachedCoords = async (address, coords) => {
  try {
    const client = await connectRedis();
    if (!client?.isOpen) return;
    const hash = createHash("md5").update(address.toLowerCase()).digest("hex");
    await client.set(`geocode:${hash}`, JSON.stringify(coords), { EX: GEOCODE_CACHE_TTL });
  } catch {}
};

export const getLatLngFromAddress = async (address) => {
  const cached = await getCachedCoords(address);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "dodago-app",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    const data = await res.json();

    if (!data || data.length === 0) {
      console.log("Geocode failed for:", address);
      return { lat: null, lng: null };
    }

    const coords = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };

    await setCachedCoords(address, coords);
    return coords;

  } catch (err) {
    console.log("Geocode error:", err.message);
    return { lat: null, lng: null };
  }
};

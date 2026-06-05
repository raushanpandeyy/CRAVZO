import { deleteCache, deleteCacheByPattern } from "./cache.js";

// Fix 5: Increased TTLs — 60s was causing expensive DB queries 60x/hour per unique key.
// Cache invalidation on create/update handles freshness so longer TTLs are safe.
const RESTAURANT_LIST_CACHE_TTL_SECONDS = 300;    // 5 min (was 60s)
const RESTAURANT_DETAIL_CACHE_TTL_SECONDS = 300;  // 5 min (was 120s)
const NEARBY_RESTAURANTS_CACHE_TTL_SECONDS = 180; // 3 min (was 60s)
const MENU_ITEMS_CACHE_TTL_SECONDS = 300;         // 5 min (was 120s)

// Fix 8: Round coordinates to 2 decimal places (~1.1km grid) before building
// nearby cache key. Raw GPS coordinates (e.g. 12.97163 vs 12.97164) produced
// different keys for the same area → cache hit rate was effectively 0%.
// At 2dp precision, users within ~1km share the same cached response.
const roundCoord = (val) => Math.round(parseFloat(val) * 100) / 100;

const buildNearbyCacheKey = (lat, lng, radius) =>
  `restaurants:nearby:lat=${roundCoord(lat)}:lng=${roundCoord(lng)}:r=${radius}`;

const invalidatePublicRestaurantCache = async (restaurantId = null) => {
  await Promise.all([
    restaurantId ? deleteCache(`restaurants:detail:${restaurantId}`, `menu-items:restaurant:${restaurantId}`) : null,
    deleteCacheByPattern("restaurants:list:*"),
    deleteCacheByPattern("restaurants:nearby:*"),
  ]);
};

export {
  MENU_ITEMS_CACHE_TTL_SECONDS,
  NEARBY_RESTAURANTS_CACHE_TTL_SECONDS,
  RESTAURANT_DETAIL_CACHE_TTL_SECONDS,
  RESTAURANT_LIST_CACHE_TTL_SECONDS,
  buildNearbyCacheKey,
  invalidatePublicRestaurantCache,
};

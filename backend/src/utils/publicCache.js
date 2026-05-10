import { deleteCache, deleteCacheByPattern } from "./cache.js";

const RESTAURANT_LIST_CACHE_TTL_SECONDS = 60;
const RESTAURANT_DETAIL_CACHE_TTL_SECONDS = 120;
const NEARBY_RESTAURANTS_CACHE_TTL_SECONDS = 60;
const MENU_ITEMS_CACHE_TTL_SECONDS = 120;

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
  invalidatePublicRestaurantCache,
};

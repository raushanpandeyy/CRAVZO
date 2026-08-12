import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

const unwrapList = (response, keys = []) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    const value = payload?.[key] ?? payload?.data?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
};

const normalizeRestaurant = (restaurant = {}) => ({
  ...restaurant,
  id: restaurant.id || restaurant._id || restaurant.restaurantId,
  imageUrl: restaurant.imageUrl || restaurant.image || restaurant.logoUrl,
  location: restaurant.location || restaurant.address || restaurant.city || "",
  cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : restaurant.cuisine,
});

const normalizeFavorite = (fav = {}) => {
  const restaurant = normalizeRestaurant(fav.restaurant || fav);
  return {
    ...fav,
    id: fav.id || fav._id || fav.restaurantId || restaurant.id,
    restaurantId: fav.restaurantId || restaurant.id,
    restaurant,
  };
};

export const getFavorites = async () => {
  try {
    const response = await apiRequest(API_ENDPOINTS.favorites.list);
    return unwrapList(response, ["favorites", "items", "results"]).map(normalizeFavorite);
  } catch (error) {
    if (error.response?.status >= 500) return [];
    throw error;
  }
};

export const addFavorite = async (restaurantId) => {
  if (!restaurantId) throw new Error("Restaurant id is missing");
  const response = await apiRequest(API_ENDPOINTS.favorites.create, {
    method: "POST",
    data: { restaurantId },
  });
  return response.data || response;
};

export const removeFavorite = async (id) => {
  if (!id) throw new Error("Restaurant id is missing");
  await apiRequest(API_ENDPOINTS.favorites.remove(id), { method: "DELETE" });
};

export const isFavorite = async (restaurantId) => {
  if (!restaurantId) return false;
  try {
    const response = await apiRequest(API_ENDPOINTS.favorites.check(restaurantId));
    const payload = response.data || response;
    return !!payload?.isFavorite;
  } catch {
    return false;
  }
};

export const checkIsFavorite = async (restaurantId) => {
  if (!restaurantId) return { isFavorite: false, id: null };
  try {
    const response = await apiRequest(API_ENDPOINTS.favorites.check(restaurantId));
    const payload = response.data || response;
    return { isFavorite: !!payload?.isFavorite, id: payload?.id || null };
  } catch {
    return { isFavorite: false, id: null };
  }
};

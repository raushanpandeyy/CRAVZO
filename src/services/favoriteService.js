import { apiRequest } from "./api.js";
import { API_ENDPOINTS } from "../constants/apiEndpoints.js";

const getFavorites = async () => {
  const response = await apiRequest(API_ENDPOINTS.favorites.list);
  return response.data || [];
};

// Fix 4: Single boolean check instead of fetching entire favorites list
// Saves ~2KB per restaurant page open (50 favorites → 1 boolean)
const checkIsFavorite = async (restaurantId) => {
  const response = await apiRequest(`/api/favorites/check?restaurantId=${restaurantId}`);
  return response.data?.isFavorite ?? false;
};

const addFavorite = async (restaurantId) => {
  const response = await apiRequest(API_ENDPOINTS.favorites.create, {
    method: "POST",
    body: JSON.stringify({ restaurantId }),
  });
  return response.data;
};

const removeFavorite = async (restaurantId) => {
  const response = await apiRequest(API_ENDPOINTS.favorites.remove(restaurantId), {
    method: "DELETE",
  });
  return response.data;
};

export { addFavorite, checkIsFavorite, getFavorites, removeFavorite };

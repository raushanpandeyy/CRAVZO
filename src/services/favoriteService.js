import { API_ENDPOINTS } from "../../src/constants/apiEndpoints.js";
import { apiRequest } from "./api.js";

const getFavorites = async () => {
  const response = await apiRequest(API_ENDPOINTS.favorites.list);
  return response.data || [];
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

export { addFavorite, getFavorites, removeFavorite };

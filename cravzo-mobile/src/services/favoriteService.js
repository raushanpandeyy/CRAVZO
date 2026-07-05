import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getFavorites = async () => {
  const response = await apiRequest(API_ENDPOINTS.favorites.list);
  return response.data || [];
};

export const addFavorite = async (restaurantId) => {
  const response = await apiRequest(API_ENDPOINTS.favorites.create, {
    method: "POST",
    data: { restaurantId },
  });
  return response.data;
};

export const removeFavorite = async (id) => {
  await apiRequest(API_ENDPOINTS.favorites.remove(id), { method: "DELETE" });
};

export const isFavorite = async (restaurantId) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.favorites.check(restaurantId));
    return !!response.data?.isFavorite;
  } catch {
    return false;
  }
};

export const checkIsFavorite = async (restaurantId) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.favorites.check(restaurantId));
    return response.data || { isFavorite: false, id: null };
  } catch {
    return { isFavorite: false, id: null };
  }
};

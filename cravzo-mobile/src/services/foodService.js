import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const listRestaurants = async (params = {}) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const path = query ? `${API_ENDPOINTS.restaurant.list}?${query}` : API_ENDPOINTS.restaurant.list;
  const response = await apiRequest(path);
  return response.data || [];
};

export const getRestaurantById = async (id) => {
  const response = await apiRequest(API_ENDPOINTS.restaurant.byId(id));
  return response.data || response;
};

export const getNearbyRestaurants = async (lat, lng, radiusKm = 5) => {
  const response = await apiRequest(API_ENDPOINTS.restaurant.nearby(lat, lng));
  return response.data || [];
};

export const listMenuItems = async (restaurantId) => {
  const response = await apiRequest(API_ENDPOINTS.restaurant.menuItems(restaurantId));
  return response.items || response.data?.items || response || [];
};

export const searchRestaurantsAndDishes = async (query, options = {}) => {
  const params = new URLSearchParams({ q: query });
  if (options.lat) params.append("lat", options.lat);
  if (options.lng) params.append("lng", options.lng);
  if (options.radius) params.append("radius", options.radius);
  const response = await apiRequest(`${API_ENDPOINTS.restaurant.list}/search?${params}`);
  return response.data || { restaurants: [], dishes: [] };
};

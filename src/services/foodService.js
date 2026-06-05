import { apiRequest } from "./api.js";

const listRestaurants = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  const path = query ? `/api/restaurants?${query}` : "/api/restaurants";
  const response = await apiRequest(path);
  return response.data || [];
};

const getRestaurantById = async (restaurantId) => {
  const response = await apiRequest(`/api/restaurants/${restaurantId}`);
  return response.data;
};

const listMenuItems = async (restaurantId) => {
  const response = await apiRequest(`/api/menu-items/restaurant/${restaurantId}`);
  return response.data?.items || [];
};

const getNearbyRestaurants = async (lat, lng, radiusKm = 3) => {
  const response = await apiRequest(
    `/api/restaurants/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
  );
  return response.data || [];
};

// Unified search — replaces listRestaurants + N×listMenuItems in SearchBar
// Returns { restaurants: [...], dishes: [...] } in one call
const searchRestaurantsAndDishes = async (query, { lat, lng, radius = 3 } = {}) => {
  const params = new URLSearchParams({ q: query });
  if (lat) params.set("lat", lat);
  if (lng) params.set("lng", lng);
  if (radius) params.set("radius", radius);
  const response = await apiRequest(`/api/restaurants/search?${params.toString()}`);
  return response.data || { restaurants: [], dishes: [] };
};

export {
  getRestaurantById,
  getNearbyRestaurants,
  listMenuItems,
  listRestaurants,
  searchRestaurantsAndDishes,
};

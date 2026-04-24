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

const getNearbyRestaurants = async (lat, lng) => {
  const response = await apiRequest(
    `/api/restaurants/nearby?lat=${lat}&lng=${lng}`
  );
  return response.data || [];
};

export {
  getRestaurantById,
  listMenuItems,
  listRestaurants,
  getNearbyRestaurants,
};
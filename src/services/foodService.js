<<<<<<< HEAD
import { apiRequest } from "./api.js";

const listRestaurants = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();

  const path = query ? `/api/restaurants?${query}` : "/api/restaurants";
=======
import { apiRequest } from "./api";

const listRestaurants = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ).toString();

  const path = query ? `/restaurants?${query}` : "/restaurants";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const response = await apiRequest(path);
  return response.data || [];
};

const getRestaurantById = async (restaurantId) => {
<<<<<<< HEAD
  const response = await apiRequest(`/api/restaurants/${restaurantId}`);
=======
  const response = await apiRequest(`/restaurants/${restaurantId}`);
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  return response.data;
};

const listMenuItems = async (restaurantId) => {
<<<<<<< HEAD
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
=======
  const response = await apiRequest(`/menu-items/restaurant/${restaurantId}`);
  return response.data?.items || [];
};

export { getRestaurantById, listMenuItems, listRestaurants };
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

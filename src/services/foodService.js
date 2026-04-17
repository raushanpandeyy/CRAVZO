import { apiRequest } from "./api";

const listRestaurants = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ).toString();

  const path = query ? `/restaurants?${query}` : "/restaurants";
  const response = await apiRequest(path);
  return response.data || [];
};

const getRestaurantById = async (restaurantId) => {
  const response = await apiRequest(`/restaurants/${restaurantId}`);
  return response.data;
};

const listMenuItems = async (restaurantId) => {
  const response = await apiRequest(`/menu-items/restaurant/${restaurantId}`);
  return response.data?.items || [];
};

export { getRestaurantById, listMenuItems, listRestaurants };

import { apiRequest, invalidateCache } from "./api";

const BASE = "/api";

const getMyRestaurants = async () => {
  const response = await apiRequest(`${BASE}/restaurants/mine`, { skipCache: true });
  const data = response.data;
  return Array.isArray(data) ? data : data ? [data] : [];
};

const getMyRestaurant = async (index = 0) => {
  const restaurants = await getMyRestaurants();
  return restaurants[index] || restaurants[0] || null;
};

const saveVendorRestaurant = async (payload, restaurantId = null) => {
  const path = restaurantId
    ? `${BASE}/restaurants/${restaurantId}`
    : `${BASE}/restaurants`;

  const method = restaurantId ? "PUT" : "POST";

  const response = await apiRequest(path, {
    method,
    body: JSON.stringify(payload),
  });

  invalidateCache("/api/restaurants");
  return response.data;
};

const updateRestaurantAvailability = async (restaurantId, isOpen) => {
  const response = await apiRequest(`${BASE}/restaurants/${restaurantId}`, {
    method: "PUT",
    body: JSON.stringify({ isOpen }),
  });

  invalidateCache("/api/restaurants");
  return response.data;
};


const updateRestaurantHours = async (restaurantId, payload) => {
  const response = await apiRequest(`${BASE}/restaurants/${restaurantId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  invalidateCache("/api/restaurants");
  return response.data;
};
const createVendorMenuItem = async (payload) => {
  const response = await apiRequest(`${BASE}/menu-items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  invalidateCache("/api/menu-items");
  return response.data;
};

const updateVendorMenuItem = async (menuItemId, payload) => {
  const response = await apiRequest(`${BASE}/menu-items/${menuItemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  invalidateCache("/api/menu-items");
  return response.data;
};

const deleteVendorMenuItem = async (menuItemId) => {
  const response = await apiRequest(`${BASE}/menu-items/${menuItemId}`, {
    method: "DELETE",
  });

  invalidateCache("/api/menu-items");
  return response.data;
};

export {
  createVendorMenuItem,
  deleteVendorMenuItem,
  getMyRestaurant,
  getMyRestaurants,
  saveVendorRestaurant,
  updateRestaurantAvailability,
  updateRestaurantHours,
  updateVendorMenuItem,
};



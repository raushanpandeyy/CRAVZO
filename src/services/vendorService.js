import { apiRequest, invalidateCache } from "./api";

const BASE = "/api";

const getMyRestaurant = async (index = 0) => {
  const response = await apiRequest(`${BASE}/restaurants/mine`);
  const data = response.data;
  if (Array.isArray(data)) {
    return data[index] || data[0] || null;
  }
  return data;
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
  saveVendorRestaurant,
  updateRestaurantAvailability,
  updateVendorMenuItem,
};

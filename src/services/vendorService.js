import { apiRequest } from "./api";

const BASE = "/api";

const getMyRestaurant = async () => {
  const response = await apiRequest(`${BASE}/restaurants/mine`);
  return response.data;
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

  return response.data;
};

const createVendorMenuItem = async (payload) => {
  const response = await apiRequest(`${BASE}/menu-items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const updateVendorMenuItem = async (menuItemId, payload) => {
  const response = await apiRequest(`${BASE}/menu-items/${menuItemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const deleteVendorMenuItem = async (menuItemId) => {
  const response = await apiRequest(`${BASE}/menu-items/${menuItemId}`, {
    method: "DELETE",
  });

  return response.data;
};

export {
  createVendorMenuItem,
  deleteVendorMenuItem,
  getMyRestaurant,
  saveVendorRestaurant,
  updateVendorMenuItem,
};

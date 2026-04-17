import { apiRequest } from "./api";

const getMyRestaurant = async () => {
  const response = await apiRequest("/restaurants/mine");
  return response.data;
};

const saveVendorRestaurant = async (payload, restaurantId = null) => {
  const path = restaurantId ? `/restaurants/${restaurantId}` : "/restaurants";
  const method = restaurantId ? "PUT" : "POST";
  const response = await apiRequest(path, {
    method,
    body: JSON.stringify(payload),
  });

  return response.data;
};

const createVendorMenuItem = async (payload) => {
  const response = await apiRequest("/menu-items", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const updateVendorMenuItem = async (menuItemId, payload) => {
  const response = await apiRequest(`/menu-items/${menuItemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const deleteVendorMenuItem = async (menuItemId) => {
  const response = await apiRequest(`/menu-items/${menuItemId}`, {
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

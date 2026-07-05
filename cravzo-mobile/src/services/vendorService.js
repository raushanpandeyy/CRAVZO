import { apiRequest } from "./api";

export const getMyRestaurant = async () => {
  const res = await apiRequest("/api/restaurants/mine");
  return res.data || res.restaurant || res;
};

export const createRestaurant = async (data) => {
  const res = await apiRequest("/api/restaurants", { method: "POST", data });
  return res.data || res.restaurant || res;
};

export const updateRestaurant = async (id, data) => {
  const res = await apiRequest(`/api/restaurants/${id}`, { method: "PUT", data });
  return res.data || res.restaurant || res;
};

export const toggleRestaurantStatus = async (id, isOpen) => {
  const res = await apiRequest(`/api/restaurants/${id}`, {
    method: "PUT",
    data: { isOpen },
  });
  return res.data || res.restaurant || res;
};

export const getVendorOrders = async ({ cursor, status } = {}) => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (status) params.set("status", status);
  const qs = params.toString();
  const res = await apiRequest(`/api/orders/vendor${qs ? `?${qs}` : ""}`);
  if (Array.isArray(res.data)) {
    return { orders: res.data, nextCursor: null, hasMore: false };
  }
  return {
    orders: res.data?.data ?? [],
    nextCursor: res.data?.meta?.nextCursor ?? null,
    hasMore: res.data?.meta?.hasMore ?? false,
  };
};

export const updateOrderStatus = async (orderId, status) => {
  return apiRequest(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    data: { status },
  });
};

export const getMenuItems = async (restaurantId) => {
  const res = await apiRequest(`/api/menu-items/restaurant/${restaurantId}`);
  return res.data?.items || res.data || [];
};

export const createMenuItem = async (data) => {
  return apiRequest("/api/menu-items", { method: "POST", data });
};

export const updateMenuItem = async (id, data) => {
  return apiRequest(`/api/menu-items/${id}`, { method: "PUT", data });
};

export const deleteMenuItem = async (id) => {
  return apiRequest(`/api/menu-items/${id}`, { method: "DELETE" });
};

export const uploadImage = async (formData) => {
  return apiRequest("/api/users/uploads/image", {
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

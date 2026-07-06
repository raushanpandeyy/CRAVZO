import { apiRequest } from "./api";

export const getMyRestaurant = async (index = 0) => {
  const res = await apiRequest("/api/restaurants/mine");
  const data = res.data || res.restaurant || res;
  if (Array.isArray(data)) {
    return data[index] || data[0] || null;
  }
  return data;
};

export const getMyRestaurants = async () => {
  const res = await apiRequest("/api/restaurants/mine");
  const data = res.data || res.restaurant || res;
  return Array.isArray(data) ? data : (data ? [data] : []);
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

export const getVendorAnalytics = async () => {
  const res = await apiRequest("/api/analytics/vendor");
  return res.data;
};

export const getCoupons = async () => {
  const res = await apiRequest("/api/coupons");
  return res.data || [];
};

export const createCoupon = async (data) => {
  const res = await apiRequest("/api/coupons", { method: "POST", data });
  return res.data;
};

export const updateCoupon = async (id, data) => {
  const res = await apiRequest(`/api/coupons/${id}`, { method: "PUT", data });
  return res.data;
};

export const deleteCoupon = async (id) => {
  const res = await apiRequest(`/api/coupons/${id}`, { method: "DELETE" });
  return res.data;
};

export const getRestaurantReviews = async (restaurantId) => {
  const res = await apiRequest(`/api/reviews/restaurant/${restaurantId}`);
  return res.data || [];
};

export const replyToReview = async (reviewId, reply) => {
  const res = await apiRequest(`/api/reviews/${reviewId}/reply`, {
    method: "POST",
    data: { reply },
  });
  return res.data;
};

export const bulkImportMenuItems = async (items) => {
  const res = await apiRequest("/api/menu-items/bulk-import", {
    method: "POST",
    data: { items },
  });
  return res.data;
};

export const getLowStockItems = async (threshold = 10) => {
  const res = await apiRequest(`/api/menu-items/low-stock?threshold=${threshold}`);
  return res.data || [];
};

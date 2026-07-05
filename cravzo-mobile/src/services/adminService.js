import { apiRequest } from "./api";

export const getDashboardOverview = async () => {
  const res = await apiRequest("/api/admin/overview");
  return res.data || res;
};

export const getUsers = async (params = {}) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const path = query ? `/api/admin/users?${query}` : "/api/admin/users";
  const res = await apiRequest(path);
  return res.data || [];
};

export const getUserDetails = async (userId) => {
  const res = await apiRequest(`/api/admin/users/${userId}`);
  return res.data || res;
};

export const updateUserStatus = async (userId, status) => {
  return apiRequest(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    data: { status },
  });
};

export const getUserOrders = async (userId) => {
  const res = await apiRequest(`/api/admin/users/${userId}/orders`);
  return res.data || [];
};

export const getRestaurants = async (params = {}) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const path = query ? `/api/admin/restaurants?${query}` : "/api/admin/restaurants";
  const res = await apiRequest(path);
  return res.data || [];
};

export const updateRestaurantStatus = async (restaurantId, status) => {
  return apiRequest(`/api/admin/restaurants/${restaurantId}/status`, {
    method: "PATCH",
    data: { status },
  });
};

export const getPendingVendors = async () => {
  const res = await apiRequest("/api/admin/vendors/pending");
  return res.data || [];
};

export const approveVendor = async (vendorId) => {
  return apiRequest(`/api/admin/vendors/${vendorId}/approve`, {
    method: "PATCH",
  });
};

export const getPendingRiders = async () => {
  const res = await apiRequest("/api/admin/riders/pending");
  return res.data || [];
};

export const approveRider = async (riderId) => {
  return apiRequest(`/api/admin/riders/${riderId}/approve`, {
    method: "PATCH",
  });
};

export const getAllOrders = async (params = {}) => {
  return getDashboardOverview(params);
};

import { apiRequest } from "./api";

export const getRiderOrders = async ({ cursor } = {}) => {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await apiRequest(`/api/orders/rider${params}`);
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

export const updateRiderStatus = async (isOnline) => {
  return apiRequest("/api/rider/status", {
    method: "PATCH",
    data: { isOnline },
  });
};

export const updateRiderLocation = async (latitude, longitude) => {
  return apiRequest("/api/rider/location", {
    method: "PATCH",
    data: { latitude, longitude },
  });
};

export const getMyProfile = async () => {
  const res = await apiRequest("/api/users/profile");
  return res.data || res.user || res;
};

export const getOrderTracking = async (orderId) => {
  const response = await apiRequest(`/api/orders/${orderId}/tracking`);
  return response.data;
};

export const verifyDeliveryOtp = async (orderId, otp) => {
  const response = await apiRequest(`/api/orders/${orderId}/verify-delivery-otp`, { method: "POST", data: { otp } });
  return response.data;
};

export const getRiderEarnings = async () => {
  const res = await apiRequest("/api/rider/earnings");
  return res.data;
};

export const getRiderStats = async () => {
  const res = await apiRequest("/api/rider/stats");
  return res.data;
};
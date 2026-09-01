import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getRiderOrders = async () => {
  const response = await apiRequest(`${API_ENDPOINTS.orders.rider}?today=true`);
  return response.data || [];
};

export const getRiderOrderHistory = async ({ range = "week", cursor = null } = {}) => {
  const params = new URLSearchParams({ range });
  if (cursor) params.set("cursor", cursor);
  const response = await apiRequest(`${API_ENDPOINTS.orders.riderHistory}?${params.toString()}`);
  return response;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await apiRequest(API_ENDPOINTS.orders.status(orderId), {
    method: "PATCH",
    data: { status },
  });
  return response.data;
};

export const verifyDeliveryOtp = async (orderId, otp) => {
  const response = await apiRequest(API_ENDPOINTS.orders.verifyDeliveryOtp(orderId), {
    method: "POST",
    data: { otp },
  });
  return response.data;
};

export const getOrderTracking = async (orderId) => {
  const response = await apiRequest(API_ENDPOINTS.orders.tracking(orderId));
  return response.data;
};

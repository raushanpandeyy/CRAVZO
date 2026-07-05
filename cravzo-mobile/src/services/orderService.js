import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getMyOrders = async ({ cursor } = {}) => {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const response = await apiRequest(`/api/orders/my${params}`);
  if (Array.isArray(response.data)) {
    return { orders: response.data, nextCursor: null, hasMore: false };
  }
  return {
    orders: response.data?.data ?? [],
    nextCursor: response.data?.meta?.nextCursor ?? null,
    hasMore: response.data?.meta?.hasMore ?? false,
  };
};

export const createOrder = async (payload) => {
  const response = await apiRequest("/api/orders", {
    method: "POST",
    data: payload,
  });
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await apiRequest(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    data: { status },
  });
  return response.data;
};

export const cancelOrder = async (orderId) => updateOrderStatus(orderId, "CANCELLED");

import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getVendorOrders = async () => {
  const res = await apiRequest(`${API_ENDPOINTS.orders.vendor}?today=true`);
  if (Array.isArray(res.data)) return res.data;
  return res.data?.data ?? [];
};

export const getVendorOrderHistory = async ({ range = "week", cursor = null } = {}) => {
  const params = new URLSearchParams({ range });
  if (cursor) params.set("cursor", cursor);
  const response = await apiRequest(`${API_ENDPOINTS.orders.vendorHistory}?${params.toString()}`);
  return response;
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await apiRequest(API_ENDPOINTS.orders.updateStatus(orderId), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return res.data;
};

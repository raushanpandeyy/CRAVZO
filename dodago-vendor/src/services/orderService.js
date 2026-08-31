import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getVendorOrders = async () => {
  const res = await apiRequest(API_ENDPOINTS.orders.vendor);
  if (Array.isArray(res.data)) return res.data;
  return res.data?.data ?? [];
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await apiRequest(API_ENDPOINTS.orders.updateStatus(orderId), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return res.data;
};

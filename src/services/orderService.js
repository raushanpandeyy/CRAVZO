import { apiRequest } from "./api";

const createOrder = async (payload) => {
  const response = await apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const getMyOrders = async () => {
  const response = await apiRequest("/orders/my");
  return response.data || [];
};

const getVendorOrders = async () => {
  const response = await apiRequest("/orders/vendor");
  return response.data || [];
};

const getRiderOrders = async () => {
  const response = await apiRequest("/orders/rider");
  return response.data || [];
};

const updateOrderStatus = async (orderId, status) => {
  const response = await apiRequest(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return response.data;
};

export { createOrder, getMyOrders, getRiderOrders, getVendorOrders, updateOrderStatus };

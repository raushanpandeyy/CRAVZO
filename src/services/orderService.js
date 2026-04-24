<<<<<<< HEAD
import { apiRequest } from "./api.js";

const createOrder = async (payload) => {
  const response = await apiRequest("/api/orders", {
=======
import { apiRequest } from "./api";

const createOrder = async (payload) => {
  const response = await apiRequest("/orders", {
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const getMyOrders = async () => {
<<<<<<< HEAD
  const response = await apiRequest("/api/orders/my");
=======
  const response = await apiRequest("/orders/my");
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  return response.data || [];
};

const getVendorOrders = async () => {
<<<<<<< HEAD
  const response = await apiRequest("/api/orders/vendor");
=======
  const response = await apiRequest("/orders/vendor");
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  return response.data || [];
};

const getRiderOrders = async () => {
<<<<<<< HEAD
  const response = await apiRequest("/api/orders/rider");
=======
  const response = await apiRequest("/orders/rider");
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  return response.data || [];
};

const updateOrderStatus = async (orderId, status) => {
<<<<<<< HEAD
  const response = await apiRequest(`/api/orders/${orderId}/status`, {
=======
  const response = await apiRequest(`/orders/${orderId}/status`, {
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return response.data;
};

<<<<<<< HEAD
const cancelOrder = async (orderId) => updateOrderStatus(orderId, "CANCELLED");

export { cancelOrder, createOrder, getMyOrders, getRiderOrders, getVendorOrders, updateOrderStatus };
=======
export { createOrder, getMyOrders, getRiderOrders, getVendorOrders, updateOrderStatus };
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

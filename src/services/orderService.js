import { apiRequest, invalidateCache } from "./api.js";

const createOrder = async (payload) => {
  const response = await apiRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  invalidateCache("/api/orders");
  return response.data;
};

// Fix 13: Support cursor-based pagination. Backend already sends meta.nextCursor
// but getMyOrders was ignoring it and always fetching page 1.
// Now returns { orders, nextCursor, hasMore } so Orders.jsx can load more.
const getMyOrders = async ({ cursor = null } = {}) => {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const response = await apiRequest(`/api/orders/my${params}`);
  // Backwards compat: if response.data is a plain array (old shape) treat it as first page
  if (Array.isArray(response.data)) {
    return { orders: response.data, nextCursor: null, hasMore: false };
  }
  return {
    orders: response.data?.data ?? [],
    nextCursor: response.data?.meta?.nextCursor ?? null,
    hasMore: response.data?.meta?.hasMore ?? false,
  };
};

const getVendorOrders = async ({ cursor = null } = {}) => {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const response = await apiRequest(`/api/orders/vendor${params}`);
  if (Array.isArray(response.data)) {
    return { orders: response.data, nextCursor: null, hasMore: false };
  }
  return {
    orders: response.data?.data ?? [],
    nextCursor: response.data?.meta?.nextCursor ?? null,
    hasMore: response.data?.meta?.hasMore ?? false,
  };
};

const getRiderOrders = async () => {
  const response = await apiRequest("/api/orders/rider");
  return response.data || [];
};

const updateOrderStatus = async (orderId, status) => {
  const response = await apiRequest(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  invalidateCache("/api/orders");
  return response.data;
};

const cancelOrder = async (orderId) => updateOrderStatus(orderId, "CANCELLED");

export { cancelOrder, createOrder, getMyOrders, getRiderOrders, getVendorOrders, updateOrderStatus };

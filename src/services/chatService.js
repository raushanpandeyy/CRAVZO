import { apiRequest } from "./api.js";

const getSupportChatRoom = async () => {
  const response = await apiRequest("/api/chats/support");
  return response.data;
};

const getOrderChatRoom = async (orderId) => {
  const response = await apiRequest(`/api/chats/orders/${orderId}`);
  return response.data;
};

const getVendorOrderChatRoom = async (orderId) => {
  const response = await apiRequest(`/api/chats/orders/${orderId}/vendor`);
  return response.data;
};

const getChatMessages = async (roomId, { after = "", limit = 30 } = {}) => {
  const params = new URLSearchParams();
  if (after) params.set("after", after);
  if (limit) params.set("limit", String(limit));

  const response = await apiRequest(`/api/chats/rooms/${roomId}/messages${params.toString() ? `?${params.toString()}` : ""}`);
  return response.data || [];
};

const sendChatMessage = async (roomId, payload) => {
  const response = await apiRequest(`/api/chats/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const uploadChatImage = async (roomId, dataUrl) => {
  const response = await apiRequest(`/api/chats/rooms/${roomId}/images`, {
    method: "POST",
    body: JSON.stringify({ dataUrl }),
  });

  return response.data;
};

const getAdminChatRooms = async (type = "SUPPORT") => {
  const response = await apiRequest(`/api/chats/admin/rooms?type=${encodeURIComponent(type)}`);
  return response.data || [];
};

const getCustomerSupportRoom = async (customerId) => {
  const response = await apiRequest(`/api/chats/admin/rooms/${encodeURIComponent(customerId)}`);
  return response.data;
};

export { getAdminChatRooms, getChatMessages, getCustomerSupportRoom, getOrderChatRoom, getSupportChatRoom, getVendorOrderChatRoom, sendChatMessage, uploadChatImage };

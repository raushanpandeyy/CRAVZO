import { apiRequest } from "./api";

export const getSupportChatRoom = async () => {
  const response = await apiRequest("/api/v1/chats/support");
  return response.data;
};

export const getOrderChatRoom = async (orderId) => {
  const response = await apiRequest(`/api/v1/chats/orders/${orderId}`);
  return response.data;
};

export const getChatMessages = async (roomId, { after = "", limit = 40 } = {}) => {
  const params = {};
  if (after) params.after = after;
  if (limit) params.limit = limit;
  const response = await apiRequest(`/api/v1/chats/rooms/${roomId}/messages`, { params });
  return response.data || [];
};

export const sendChatMessage = async (roomId, text) => {
  const response = await apiRequest(`/api/v1/chats/rooms/${roomId}/messages`, {
    method: "POST",
    data: { text },
  });
  return response.data;
};

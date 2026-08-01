import { apiRequest } from "./api";

export const getOrderChatRoom = async (orderId) => {
  const response = await apiRequest(`/api/chats/orders/${orderId}`);
  return response.data;
};

export const getChatMessages = async (roomId, { after = "", limit = 40 } = {}) => {
  const params = {};
  if (after) params.after = after;
  if (limit) params.limit = limit;
  const response = await apiRequest(`/api/chats/rooms/${roomId}/messages`, { params });
  return response.data || [];
};

export const sendChatMessage = async (roomId, text) => {
  const response = await apiRequest(`/api/chats/rooms/${roomId}/messages`, {
    method: "POST",
    data: { text },
  });
  return response.data;
};

import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants/apiEndpoints";
import { storage } from "./storage";

let socket = null;

export const getChatSocket = () => {
  if (socket?.connected) return socket;

  const token = storage.getString("authToken");

  socket = io(`${API_BASE_URL}`, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: false,
  });

  return socket;
};

export const connectSocket = () => {
  const s = getChatSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};

export const joinChatRoom = (roomId) => {
  socket?.emit("chat:join", { roomId });
};

export const leaveChatRoom = (roomId) => {
  socket?.emit("chat:leave", { roomId });
};

export const sendSocketMessage = (payload) => {
  socket?.emit("chat:message", payload);
};

export const onSocketMessage = (handler) => {
  socket?.on("chat:message", handler);
  return () => socket?.off("chat:message", handler);
};

export const onChatNotification = (handler) => {
  socket?.on("chat:notification", handler);
  return () => socket?.off("chat:notification", handler);
};

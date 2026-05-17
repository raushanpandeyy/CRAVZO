import { io } from "socket.io-client";

import { API_BASE_URL } from "../constants/apiEndpoints.js";

let socket = null;

const getStoredToken = () => localStorage.getItem("cravzoAuthToken");

const getChatSocket = () => {
  const token = getStoredToken();

  if (!socket) {
    socket = io(API_BASE_URL || window.location.origin, {
      autoConnect: false,
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

const emitWithAck = (eventName, payload, timeout = 8000) =>
  new Promise((resolve, reject) => {
    const activeSocket = getChatSocket();

    activeSocket.timeout(timeout).emit(eventName, payload, (error, response) => {
      if (error) {
        reject(new Error("Socket request timed out"));
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.message || "Socket request failed"));
        return;
      }

      resolve(response);
    });
  });

const joinChatRoom = (roomId) => emitWithAck("chat:join", { roomId });

const leaveChatRoom = (roomId) => {
  if (socket?.connected && roomId) {
    socket.emit("chat:leave", { roomId });
  }
};

const sendSocketMessage = (payload) => emitWithAck("chat:send", payload);

const onSocketMessage = (handler) => {
  const activeSocket = getChatSocket();
  activeSocket.on("chat:message", handler);

  return () => activeSocket.off("chat:message", handler);
};

const onChatNotification = (handler) => {
  const activeSocket = getChatSocket();
  activeSocket.on("chat:notification", handler);

  return () => activeSocket.off("chat:notification", handler);
};

export { getChatSocket, joinChatRoom, leaveChatRoom, onChatNotification, onSocketMessage, sendSocketMessage };

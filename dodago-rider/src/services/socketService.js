import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants/apiEndpoints";
import { getStoredToken } from "./api";

let socket = null;
let socketPromise = null;

export const getSocket = async () => {
  if (socketPromise) return socketPromise;
  socketPromise = (async () => {
    const token = await getStoredToken();
    if (!socket) {
      socket = io(API_BASE_URL, {
        autoConnect: false,
        auth: { token },
        transports: ["websocket", "polling"],
      });
    }
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  })();
  socketPromise.catch(() => { socketPromise = null; });
  return socketPromise;
};

const subscribe = (eventName, handler) => {
  let active = true;
  let cleanup = null;
  getSocket().then((s) => {
    if (!active) return;
    s.on(eventName, handler);
    cleanup = () => s.off(eventName, handler);
  }).catch(() => {});
  return () => {
    active = false;
    cleanup?.();
  };
};

export const onNewOrder = (handler) => subscribe("order:new", handler);
export const onOrderStatusUpdate = (handler) => subscribe("order:status-updated", handler);
export const onSocketMessage = (handler) => subscribe("chat:message", handler);
export const sendSocketMessage = async (payload, callback) => {
  const s = await getSocket();
  if (!s.connected) s.connect();
  s.emit("chat:send", payload, callback);
  return true;
};

export const joinChatRoom = async (roomId) => {
  const s = await getSocket();
  s.emit("chat:join", { roomId });
};

export const leaveChatRoom = async (roomId) => {
  const s = await getSocket();
  s.emit("chat:leave", { roomId });
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  socketPromise = null;
};

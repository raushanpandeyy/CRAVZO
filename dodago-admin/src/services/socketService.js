import { io } from "socket.io-client";
import { SOCKET_URL } from "../constants/config.js";
import { Storage, TOKEN_KEY } from "./storage.js";

let socket = null;
const listeners = new Map(); // event → Set<callback>

const emit = (event, data) => {
  listeners.get(event)?.forEach((cb) => {
    try { cb(data); } catch (e) { console.warn("Socket listener error:", e); }
  });
};

export const connectSocket = () => {
  if (socket?.connected) return;

  const token = Storage.get(TOKEN_KEY);
  if (!token) return;

  socket = io(SOCKET_URL, {
    auth:       { token },
    transports: ["websocket"],
    reconnection:        true,
    reconnectionDelay:   2000,
    reconnectionAttempts: 20,
  });

  socket.on("connect",            ()    => emit("_connected",       {}));
  socket.on("disconnect",         (r)   => emit("_disconnected",    { reason: r }));
  socket.on("connect_error",      (e)   => emit("_error",           { message: e.message }));
  socket.on("admin:order-alert",  (d)   => emit("admin:order-alert", d));
  socket.on("order:rider-location",(d)  => emit("order:rider-location", d));
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const isConnected = () => socket?.connected ?? false;

// Subscribe to a socket event. Returns unsubscribe function.
export const onSocketEvent = (event, callback) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  return () => listeners.get(event)?.delete(callback);
};

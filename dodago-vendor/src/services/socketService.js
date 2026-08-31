import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants/apiEndpoints";
import { getToken } from "./storage";

let socket = null;
let socketPromise = null;

export const getSocket = async () => {
  if (socketPromise) return socketPromise;
  socketPromise = (async () => {
    const token = await getToken();
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

export const onNewOrder         = (h) => subscribe("order:new", h);
export const onOrderStatusUpdate= (h) => subscribe("order:status-updated", h);

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  socketPromise = null;
};

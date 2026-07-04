// socket.io-client was a static import — this pulled the entire ~45KB chunk
// into the initial bundle for every page, even for guests who never use chat.
// Now it's a dynamic import: the chunk only loads when an authenticated user
// first calls getChatSocket(). Guests see zero socket overhead.
//
// IMPORTANT: All public-facing subscription functions (onSocketMessage,
// onChatNotification, onAdminOrderAlert) keep a SYNCHRONOUS return signature
// — they return a cleanup function immediately — so callers (Chat.jsx,
// AdminRoutes, AdminOrders) don't need to be changed to async.
// The async socket init is handled internally.

import { API_BASE_URL } from "../constants/apiEndpoints.js";

let socket = null;
let socketPromise = null;

const getStoredToken = () => localStorage.getItem("dodagoAuthToken");

const getChatSocket = () => {
  if (socketPromise) return socketPromise;

  socketPromise = (async () => {
    const token = getStoredToken();

    if (!socket) {
      const { io } = await import("socket.io-client");
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
  })();

  // Reset promise on connection error so next call retries
  socketPromise.catch(() => { socketPromise = null; });

  return socketPromise;
};

const emitWithAck = (eventName, payload, timeout = 8000) =>
  new Promise((resolve, reject) => {
    getChatSocket().then((activeSocket) => {
      activeSocket.timeout(timeout).emit(eventName, payload, (error, response) => {
        if (error) { reject(new Error("Socket request timed out")); return; }
        if (!response?.ok) { reject(new Error(response?.message || "Socket request failed")); return; }
        resolve(response);
      });
    }).catch(reject);
  });

const joinChatRoom = (roomId) => emitWithAck("chat:join", { roomId });

const leaveChatRoom = (roomId) => {
  if (!roomId) return;
  if (socket?.connected) {
    socket.emit("chat:leave", { roomId });
  } else {
    getChatSocket().then((s) => {
      if (s?.connected) s.emit("chat:leave", { roomId });
    }).catch(() => {});
  }
};

const sendSocketMessage = (payload) => emitWithAck("chat:send", payload);

// Returns a synchronous unsubscribe function.
// The socket is initialised async internally; the handler is registered once
// the socket is ready. If cleanup fires before the socket resolves, the
// pending flag prevents double-registration.
const onSocketMessage = (handler) => {
  let pending = true;
  let off = null;

  getChatSocket().then((s) => {
    if (!pending) return;
    s.on("chat:message", handler);
    off = () => s.off("chat:message", handler);
  }).catch(() => {});

  return () => {
    pending = false;
    off?.();
  };
};

const onChatNotification = (handler) => {
  let pending = true;
  let off = null;

  getChatSocket().then((s) => {
    if (!pending) return;
    s.on("chat:notification", handler);
    off = () => s.off("chat:notification", handler);
  }).catch(() => {});

  return () => {
    pending = false;
    off?.();
  };
};

const onAdminOrderAlert = (handler) => {
  let pending = true;
  let off = null;

  getChatSocket().then((s) => {
    if (!pending) return;
    s.on("admin:order-alert", handler);
    off = () => s.off("admin:order-alert", handler);
  }).catch(() => {});

  return () => {
    pending = false;
    off?.();
  };
};

const onOrderStatusUpdate = (handler) => {
  let pending = true;
  let off = null;

  getChatSocket().then((s) => {
    if (!pending) return;
    s.on("order:status-updated", handler);
    off = () => s.off("order:status-updated", handler);
  }).catch(() => {});

  return () => {
    pending = false;
    off?.();
  };
};

const onNewOrder = (handler) => {
  let pending = true;
  let off = null;

  getChatSocket().then((s) => {
    if (!pending) return;
    s.on("order:new", handler);
    off = () => s.off("order:new", handler);
  }).catch(() => {});

  return () => {
    pending = false;
    off?.();
  };
};

const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
  socketPromise = null;
};

export {
  getChatSocket,
  joinChatRoom,
  leaveChatRoom,
  onAdminOrderAlert,
  onChatNotification,
  onNewOrder,
  onOrderStatusUpdate,
  onSocketMessage,
  sendSocketMessage,
  disconnectSocket,
};

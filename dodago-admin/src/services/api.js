import { API_BASE_URL } from "../constants/config.js";
import { Storage, TOKEN_KEY } from "./storage.js";

const getToken = () => Storage.get(TOKEN_KEY);

export const apiRequest = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.message || json?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return json;
};

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role: "ADMIN" }),
  });

// ─── Orders ───────────────────────────────────────────────────────────────────
export const fetchOrders = ({ page = 1, limit = 20, status = "", from = "", to = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set("status", status);
  if (from)   params.set("from", from);
  if (to)     params.set("to", to);
  return apiRequest(`/api/admin/overview?${params}`);
};

export const fetchOrderDetail = (orderId) =>
  apiRequest(`/api/admin/overview?orderId=${orderId}&limit=1`);

// ─── Notifications ────────────────────────────────────────────────────────────
export const registerFcmToken = (token, platform = "ANDROID") =>
  apiRequest("/api/notifications/fcm-token", {
    method: "POST",
    body: JSON.stringify({ token, platform, deviceId: "admin-app" }),
  });

export const deregisterFcmToken = (token) =>
  apiRequest("/api/notifications/fcm-token", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });

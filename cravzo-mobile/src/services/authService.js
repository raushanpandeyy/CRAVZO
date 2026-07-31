import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { storage } from "./storage";

export const login = async (payload) => {
  const res = await apiRequest(API_ENDPOINTS.auth.login, {
    method: "POST",
    data: payload,
  });
  const result = res.data || res;
  ensureCustomerAccount(result.user || result);
  persistSession(result);
  return result;
};

export const signup = async (payload) => {
  const res = await apiRequest(API_ENDPOINTS.auth.signup, {
    method: "POST",
    data: payload,
  });
  return res.data || res;
};

export const sendOtp = async (payload) => {
  return apiRequest(API_ENDPOINTS.auth.sendOtp, {
    method: "POST",
    data: payload,
  });
};

export const verifyOtp = async (payload) => {
  const res = await apiRequest(API_ENDPOINTS.auth.verifyOtp, {
    method: "POST",
    data: payload,
  });
  const result = res.data || res;
  ensureCustomerAccount(result.user || result);
  persistSession(result);
  return result;
};

export const requestPasswordReset = async (payload) => {
  return apiRequest(API_ENDPOINTS.auth.forgotPassword, {
    method: "POST",
    data: payload,
  });
};

export const resetPassword = async (payload) => {
  return apiRequest(API_ENDPOINTS.auth.resetPassword, {
    method: "POST",
    data: payload,
  });
};

export const logout = async () => {
  try {
    await apiRequest(API_ENDPOINTS.auth.logout, { method: "POST" });
  } catch {}
  try {
    const { unregisterPushNotifications } = await import("./notificationService");
    await unregisterPushNotifications();
  } catch {}
  clearSession();
};

export const loadCurrentUser = async () => {
  const token = storage.getString("authToken");
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    if (payload.exp * 1000 < Date.now() + 10 * 60 * 1000) {
      const res = await apiRequest(API_ENDPOINTS.auth.me);
      const result = res.data || res;
      const user = result.user || result;
      persistSession({ user, token });
      return normalizeUser(user);
    }
    const cached = storage.getString("user");
    if (!cached) return null;
    const cachedUser = JSON.parse(cached);
    ensureCustomerAccount(cachedUser);
    return normalizeUser(cachedUser);
  } catch {
    clearSession();
    return null;
  }
};

export const persistSession = ({ user, token }) => {
  if (token) storage.set("authToken", token);
  if (user) storage.set("user", JSON.stringify(normalizeUser(user)));
};

export const clearSession = () => {
  storage.delete("authToken");
  storage.delete("user");
};

const getStoredUser = () => {
  const raw = storage.getString("user");
  return raw ? JSON.parse(raw) : null;
};

const ensureCustomerAccount = (user) => {
  const accountType = (user?.accountType || user?.role || "customer").toLowerCase();
  if (accountType !== "customer") {
    throw new Error("This app is only for customer accounts.");
  }
};

export const normalizeUser = (user = {}) => {
  const raw = user?.data?.user || user?.user || user?.data || user || {};
  return {
    ...raw,
    id: raw.id || raw._id,
    name: raw.name || raw.fullName || "",
    email: raw.email || "",
    phone: raw.phone || "",
    avatarUrl: raw.avatarUrl || raw.imageUrl || raw.photoUrl || "",
    role: raw.role || raw.accountType || "CUSTOMER",
    accountType: (raw.accountType || raw.role || "customer").toLowerCase(),
    isLoggedIn: true,
  };
};

const decodeBase64Url = (value = "") => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  if (typeof globalThis.atob === "function") return globalThis.atob(base64);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of base64.replace(/=+$/, "")) {
    const index = chars.indexOf(char);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
};

const jwtDecode = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return {};
  }
};

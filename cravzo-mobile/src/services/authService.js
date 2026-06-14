import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { storage } from "./storage";

export const login = async (payload) => {
  const data = await apiRequest(API_ENDPOINTS.auth.login, {
    method: "POST",
    data: payload,
  });
  persistSession(data);
  return data;
};

export const signup = async (payload) => {
  const data = await apiRequest(API_ENDPOINTS.auth.signup, {
    method: "POST",
    data: payload,
  });
  return data;
};

export const sendOtp = async (payload) => {
  return apiRequest(API_ENDPOINTS.auth.sendOtp, {
    method: "POST",
    data: payload,
  });
};

export const verifyOtp = async (payload) => {
  const data = await apiRequest(API_ENDPOINTS.auth.verifyOtp, {
    method: "POST",
    data: payload,
  });
  persistSession(data);
  return data;
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
      const data = await apiRequest(API_ENDPOINTS.auth.me);
      persistSession(data);
      return normalizeUser(data.user || data);
    }
    const cached = storage.getString("user");
    return cached ? normalizeUser(JSON.parse(cached)) : null;
  } catch {
    const cached = storage.getString("user");
    return cached ? normalizeUser(JSON.parse(cached)) : null;
  }
};

const persistSession = ({ user, token }) => {
  if (token) storage.set("authToken", token);
  if (user) storage.set("user", JSON.stringify(normalizeUser(user)));
};

const clearSession = () => {
  storage.delete("authToken");
  storage.delete("user");
};

const normalizeUser = (user) => ({
  ...user,
  accountType: user.accountType || user.role?.toLowerCase() || "customer",
  isLoggedIn: true,
});

const getStoredUser = () => {
  const raw = storage.getString("user");
  return raw ? JSON.parse(raw) : null;
};

const jwtDecode = (token) => {
  try {
    const parts = token.split(".");
    return JSON.parse(atob(parts[1]));
  } catch {
    return {};
  }
};

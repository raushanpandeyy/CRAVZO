import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { storage } from "./storage";

export const login = async (payload) => {
  const res = await apiRequest(API_ENDPOINTS.auth.login, {
    method: "POST",
    data: payload,
  });
  const result = res.data || res;
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
    return cached ? normalizeUser(JSON.parse(cached)) : null;
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

export const normalizeUser = (user) => ({
  ...user,
  accountType: user.accountType || user.role?.toLowerCase() || "customer",
  isLoggedIn: true,
});

const jwtDecode = (token) => {
  try {
    const parts = token.split(".");
    return JSON.parse(atob(parts[1]));
  } catch {
    return {};
  }
};

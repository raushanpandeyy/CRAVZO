import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { clearSession, setToken, setUser } from "./storage";

const persistSession = async ({ user, token }) => {
  if (token) await setToken(token);
  if (user)  await setUser(user);
  return user;
};

export const login = async ({ email, password }) => {
  const res = await apiRequest(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return persistSession(res.data);
};

export const signup = async ({ name, email, phone, password }) => {
  const res = await apiRequest(API_ENDPOINTS.auth.signup, {
    method: "POST",
    body: JSON.stringify({ name, email, phone, password, role: "VENDOR" }),
  });
  // Returns { email, role } — OTP will be sent to email
  return res.data;
};

export const sendOtp = async (email) => {
  const res = await apiRequest(API_ENDPOINTS.auth.sendOtp, {
    method: "POST",
    body: JSON.stringify({ email, role: "VENDOR" }),
  });
  return res.data;
};

export const verifyOtp = async ({ email, otp }) => {
  const res = await apiRequest(API_ENDPOINTS.auth.verifyOtp, {
    method: "POST",
    body: JSON.stringify({ email, otp, role: "VENDOR" }),
  });
  return persistSession(res.data);
};

export const forgotPassword = async (email) => {
  const res = await apiRequest(API_ENDPOINTS.auth.forgotPassword, {
    method: "POST",
    body: JSON.stringify({ email, role: "VENDOR" }),
  });
  return res.data;
};

export const resetPassword = async ({ email, otp, password }) => {
  const res = await apiRequest(API_ENDPOINTS.auth.resetPassword, {
    method: "POST",
    body: JSON.stringify({ email, otp, password, role: "VENDOR" }),
  });
  return res.data;
};

export const logout = async () => {
  try {
    await apiRequest(API_ENDPOINTS.auth.logout, { method: "POST" });
  } catch {
    // ignore network errors on logout
  } finally {
    await clearSession();
  }
};

export const getMe = async () => {
  const res = await apiRequest(API_ENDPOINTS.auth.me);
  return res.data?.user || res.data;
};

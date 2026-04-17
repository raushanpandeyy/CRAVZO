import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { roleToAccountType } from "../constants/roles";
import { apiRequest } from "./api";

const AUTH_STORAGE_KEY = "cravzoCurrentUser";
const TOKEN_STORAGE_KEY = "cravzoAuthToken";
const OTP_EMAIL_STORAGE_KEY = "otpEmail";
const OTP_ROLE_STORAGE_KEY = "otpRole";

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    accountType: roleToAccountType(user.role),
    isLoggedIn: true,
  };
};

const dispatchUserChange = () => {
  window.dispatchEvent(new Event("userChange"));
};

const persistSession = ({ user, token }) => {
  const normalizedUser = normalizeUser(user);

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  if (normalizedUser) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
  }

  dispatchUserChange();
  return normalizedUser;
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  dispatchUserChange();
};

const getStoredUser = () => {
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    clearSession();
    return null;
  }
};

const login = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return persistSession(response.data);
};

const signup = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.auth.signup, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.data?.email) {
    localStorage.setItem(OTP_EMAIL_STORAGE_KEY, response.data.email);
  }

  if (response.data?.role) {
    localStorage.setItem(OTP_ROLE_STORAGE_KEY, response.data.role);
  }

  return response.data;
};

const sendOtp = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.auth.sendOtp, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.data?.email) {
    localStorage.setItem(OTP_EMAIL_STORAGE_KEY, response.data.email);
  }

  if (response.data?.role) {
    localStorage.setItem(OTP_ROLE_STORAGE_KEY, response.data.role);
  }

  return response.data;
};

const verifyOtp = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.auth.verifyOtp, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  localStorage.removeItem(OTP_EMAIL_STORAGE_KEY);
  localStorage.removeItem(OTP_ROLE_STORAGE_KEY);

  return persistSession(response.data);
};

const logout = async () => {
  try {
    await apiRequest(API_ENDPOINTS.auth.logout, {
      method: "POST",
    });
  } finally {
    clearSession();
  }
};

const loadCurrentUser = async () => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    return null;
  }

  try {
    const response = await apiRequest(API_ENDPOINTS.auth.me);
    return persistSession({ user: response.data.user, token });
  } catch {
    clearSession();
    return null;
  }
};

export {
  clearSession,
  getStoredUser,
  loadCurrentUser,
  login,
  logout,
  persistSession,
  sendOtp,
  signup,
  verifyOtp,
};

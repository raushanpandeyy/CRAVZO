import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { roleToAccountType } from "../constants/roles.js";
import { unregisterFcmToken } from "../firebase/notificationService.js";
import { apiRequest } from "./api.js";

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

const requestPasswordReset = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.auth.forgotPassword, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const resetPassword = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.auth.resetPassword, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const logout = async () => {
  try {
    await unregisterFcmToken();
    await apiRequest(API_ENDPOINTS.auth.logout, {
      method: "POST",
    });
  } finally {
    clearSession();
  }
};

const loadCurrentUser = async () => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  // No token — clear and return null without hitting the network
  if (!token) {
    clearSession();
    return null;
  }

  // Check if stored user is fresh enough (token is a JWT — decode expiry)
  // to skip the /me call on app load when session is clearly still valid
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresAt = payload.exp * 1000;
    const storedUser = getStoredUser();

    // If token expires in more than 10 minutes AND we have stored user → skip /me
    if (storedUser && expiresAt - Date.now() > 10 * 60 * 1000) {
      return storedUser;
    }
  } catch {
    // JWT decode failed — proceed with /me call
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
  requestPasswordReset,
  resetPassword,
  sendOtp,
  signup,
  verifyOtp,
};

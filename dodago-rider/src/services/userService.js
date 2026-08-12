import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { normalizeUser, persistSession } from "./authService";

export const getProfile = async () => {
  const response = await apiRequest(API_ENDPOINTS.user.profile);
  const result = response.data || response;
  return normalizeUser(result.user || result);
};

export const updateProfile = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.user.profile, { method: "PUT", data: payload });
  const result = response.data || response;
  const user = normalizeUser(result.user || result);
  await persistSession({ user });
  return user;
};

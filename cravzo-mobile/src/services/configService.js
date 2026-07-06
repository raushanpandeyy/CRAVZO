import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { apiRequest } from "./api";

let cachedConfig = null;

export const getAppConfig = async () => {
  if (cachedConfig) return cachedConfig;

  const response = await apiRequest(API_ENDPOINTS.public.config, { skipAuth: true });
  cachedConfig = response.data || response;
  return cachedConfig;
};

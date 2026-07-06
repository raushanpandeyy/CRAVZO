import axios from "axios";
import { API_BASE_URL } from "../constants/apiEndpoints";
import { storage } from "./storage";

let unauthorizedHandler = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = storage.getString("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.delete("authToken");
      storage.delete("user");
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export const apiRequest = async (path, options = {}) => {
  const { method = "GET", data, params, skipAuth } = options;

  const config = { method, url: path, data, params };
  if (skipAuth) {
    config.headers = { ...config.headers, Authorization: undefined };
  }

  const response = await api(config);
  return response.data;
};

export const invalidateCache = (pathPrefix) => {};

export const getStoredToken = () => storage.getString("authToken") || null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};



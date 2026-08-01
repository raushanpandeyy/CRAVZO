import axios from "axios";
import { API_BASE_URL } from "../constants/apiEndpoints";
import { storage } from "./storage";

let unauthorizedHandler = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.get("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.multiRemove(["authToken", "user"]);
      unauthorizedHandler?.();
    }
    const serverMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data?.details?.message;
    if (serverMessage) error.message = serverMessage;
    return Promise.reject(error);
  }
);

export const apiRequest = async (path, options = {}) => {
  const response = await api({
    method: options.method || "GET",
    url: path,
    data: options.data,
    params: options.params,
    headers: options.headers,
  });
  return response.data;
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const getStoredToken = () => storage.get("authToken");

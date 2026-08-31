import { API_BASE_URL } from "../constants/apiEndpoints";
import { getToken } from "./storage";

export const apiRequest = async (endpoint, options = {}) => {
  const token = await getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  return data;
};

// Multipart upload (for images)
export const uploadRequest = async (endpoint, formData) => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  let data;
  try { data = await response.json(); } catch { throw new Error("Invalid server response"); }
  if (!response.ok) throw new Error(data?.message || `Upload failed (${response.status})`);
  return data;
};

import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

const unwrapUser = (response) => response?.data?.user || response?.user || response?.data || response || null;

export const getProfile = async () => {
  const res = await apiRequest(API_ENDPOINTS.user.profile);
  return unwrapUser(res);
};

export const updateProfile = async (data) => {
  const res = await apiRequest(API_ENDPOINTS.user.profile, {
    method: "PUT",
    data,
  });
  return unwrapUser(res);
};

export const uploadImage = async (formData) => {
  return apiRequest(API_ENDPOINTS.user.uploadImage, {
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteAccount = async () => {
  return apiRequest(API_ENDPOINTS.user.account, {
    method: "DELETE",
    data: { confirmation: "DELETE" },
  });
};

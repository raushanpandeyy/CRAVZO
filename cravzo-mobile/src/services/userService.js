import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getProfile = async () => {
  const res = await apiRequest(API_ENDPOINTS.user.profile);
  return res.data || res.user || res;
};

export const updateProfile = async (data) => {
  const res = await apiRequest(API_ENDPOINTS.user.profile, {
    method: "PUT",
    data,
  });
  return res.data || res.user || res;
};

export const uploadImage = async (formData) => {
  return apiRequest(API_ENDPOINTS.user.uploadImage, {
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

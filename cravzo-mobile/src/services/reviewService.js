import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { apiRequest } from "./api";

const unwrapList = (response, keys = []) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    const value = payload?.[key] ?? payload?.data?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
};

export const getMyReviews = async () => {
  try {
    const response = await apiRequest(API_ENDPOINTS.reviews.mine);
    return unwrapList(response, ["reviews", "items", "results"]);
  } catch (error) {
    if (error.response?.status >= 500) return [];
    throw error;
  }
};

export const getRestaurantReviews = async (restaurantId) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.reviews.byRestaurant(restaurantId));
    return unwrapList(response, ["reviews", "items", "results"]);
  } catch (error) {
    if (error.response?.status >= 500) return [];
    throw error;
  }
};

export const saveReview = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.save, {
    method: "POST",
    data: payload,
  });
  return response.data || response;
};

export const deleteReview = async (id) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.remove(id), { method: "DELETE" });
  return response.data || response;
};

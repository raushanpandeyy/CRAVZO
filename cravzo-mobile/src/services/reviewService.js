import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { apiRequest } from "./api";

export const getMyReviews = async () => {
  const response = await apiRequest(API_ENDPOINTS.reviews.mine);
  return response.data || response.reviews || response || [];
};

export const getRestaurantReviews = async (restaurantId) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.byRestaurant(restaurantId));
  return response.data || [];
};

export const saveReview = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.save, {
    method: "POST",
    data: payload,
  });
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.remove(id), { method: "DELETE" });
  return response.data || response;
};

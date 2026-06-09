import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { apiRequest, invalidateCache } from "./api.js";

const getMyReviews = async () => {
  const response = await apiRequest(API_ENDPOINTS.reviews.mine);
  return response.data || [];
};

const getRestaurantReviews = async (restaurantId) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.byRestaurant(restaurantId));
  return response.data || [];
};

const saveReview = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.save, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  invalidateCache("/api/reviews");
  if (payload.restaurantId) invalidateCache(`/api/reviews/restaurant/${payload.restaurantId}`);
  return response.data;
};

const deleteReview = async (reviewId, restaurantId) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.remove(reviewId), {
    method: "DELETE",
  });

  invalidateCache("/api/reviews");
  if (restaurantId) invalidateCache(`/api/reviews/restaurant/${restaurantId}`);
  return response.data;
};

export { deleteReview, getMyReviews, getRestaurantReviews, saveReview };

<<<<<<< HEAD
import { API_ENDPOINTS } from "../../src/constants/apiEndpoints.js";
import { apiRequest } from "./api.js";
=======
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { apiRequest } from "./api";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

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

  return response.data;
};

const deleteReview = async (reviewId) => {
  const response = await apiRequest(API_ENDPOINTS.reviews.remove(reviewId), {
    method: "DELETE",
  });

  return response.data;
};

export { deleteReview, getMyReviews, getRestaurantReviews, saveReview };

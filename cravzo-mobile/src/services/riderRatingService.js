import { apiRequest } from "./api";

export const saveRiderRating = async ({ orderId, riderId, rating, comment }) => {
  const response = await apiRequest("/api/rider-ratings", {
    method: "POST",
    data: { orderId, riderId, rating, comment: comment || null },
  });
  return response.data;
};
export const getRiderRatings = async (riderId) => {
  const response = await apiRequest(`/api/rider-ratings/rider/${riderId}`);
  return response.data || { averageRating: null, totalRatings: 0, ratings: [] };
};
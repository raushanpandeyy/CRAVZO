import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const updateRiderStatus = async (isOnline) => {
  const response = await apiRequest(API_ENDPOINTS.rider.status, {
    method: "PATCH",
    data: { isOnline: Boolean(isOnline) },
  });
  return response.data;
};

export const updateRiderLocation = async (latitude, longitude, metadata = {}) => {
  const response = await apiRequest(API_ENDPOINTS.rider.location, {
    method: "PATCH",
    data: {
      latitude,
      longitude,
      accuracy:  metadata.accuracy,
      heading:   metadata.heading,
      speed:     metadata.speed,
      timestamp: metadata.timestamp,
    },
  });
  return response.data;
};

export const getRiderEarnings = async () => {
  const response = await apiRequest(API_ENDPOINTS.rider.earnings);
  return response.data;
};

export const getRiderStats = async () => {
  const response = await apiRequest(API_ENDPOINTS.rider.stats);
  return response.data;
};

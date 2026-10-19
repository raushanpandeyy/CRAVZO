import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const GIG_TIERS = [
  { orders: 10, bonus: 140 },
  { orders: 20, bonus: 300 },
  { orders: 24, bonus: 340 },
];

export const MIN_GIG_HOURS = 2;

export const bookGig = async (durationHours) => {
  const response = await apiRequest(API_ENDPOINTS.gig.book, {
    method: "POST",
    data: { durationHours },
  });
  return response.data;
};

export const endGig = async () => {
  const response = await apiRequest(API_ENDPOINTS.gig.end, {
    method: "POST",
  });
  return response.data;
};

export const getActiveGig = async () => {
  const response = await apiRequest(API_ENDPOINTS.gig.active);
  return response.data;
};

export const getGigStats = async () => {
  const response = await apiRequest(API_ENDPOINTS.gig.stats);
  return response.data;
};

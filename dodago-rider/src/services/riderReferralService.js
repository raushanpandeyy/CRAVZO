import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const RIDER_REFERRAL_STAGES = [
  { stage: 1, ordersRequired: 35, payout: 300 },
  { stage: 2, ordersRequired: 50, payout: 300 },
  { stage: 3, ordersRequired: 75, payout: 400 },
];

export const RIDER_REFERRAL_TOTAL = 1000;

export const getRiderReferralStats = async () => {
  const response = await apiRequest(API_ENDPOINTS.rider.referral);
  return response.data;
};

import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getMyReferralStats = async () => {
  const response = await apiRequest(API_ENDPOINTS.referrals.me);
  return (
    response.data || {
      referralCode: "",
      friendsReferred: 0,
      creditEarned: 0,
      walletBalance: 0,
    }
  );
};

export const applyReferralCode = async (referralCode) => {
  const response = await apiRequest(API_ENDPOINTS.referrals.apply, {
    method: "POST",
    data: { referralCode },
  });
  return response.data;
};
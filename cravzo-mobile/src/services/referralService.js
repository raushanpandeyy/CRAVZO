import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

const unwrapReferral = (response) => response?.data ?? response ?? {};

export const getMyReferralStats = async () => {
  const response = await apiRequest(API_ENDPOINTS.referrals.me);
  return {
    referralCode: "",
    verifiedReferrals: 0,
    qualifiedReferrals: 0,
    suspectReferrals: 0,
    vouchers: [],
    milestonesConfig: [],
    ...unwrapReferral(response),
  };
};

export const applyReferralCode = async (referralCode) => {
  const response = await apiRequest(API_ENDPOINTS.referrals.apply, {
    method: "POST",
    data: { referralCode },
  });
  return unwrapReferral(response);
};

export const buildReferralLink = (referralCode) => `https://dodago.shop/refer/${encodeURIComponent(referralCode || "")}`;

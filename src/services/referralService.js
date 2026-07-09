import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { apiRequest } from "./api.js";

const getMyReferral = async () => {
  const response = await apiRequest(API_ENDPOINTS.referrals.me);
  return response.data || null;
};

const buildReferralLink = (code) => {
  if (!code) return "";
  const origin = window.location.origin;
  return `${origin}/signin?ref=${encodeURIComponent(code)}`;
};

const copyReferralLink = async (code) => {
  const link = buildReferralLink(code);
  await navigator.clipboard.writeText(link);
  return link;
};

export { buildReferralLink, copyReferralLink, getMyReferral };

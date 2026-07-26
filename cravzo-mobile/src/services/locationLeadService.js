import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { apiRequest } from "./api";

export const submitLocationLead = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.public.locationLeads, {
    method: "POST",
    data: payload,
  });
  return response?.data || response;
};

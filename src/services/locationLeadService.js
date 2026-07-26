import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { apiRequest } from "./api.js";

const submitLocationLead = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.public.locationLeads, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data || response;
};

export { submitLocationLead };

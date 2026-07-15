import { apiRequest } from "./api.js";

const getVendorReports = async (range = "daily") => {
  const params = new URLSearchParams({ range });
  const response = await apiRequest(`/api/analytics/vendor/reports?${params.toString()}`, { skipCache: true });
  return response.data;
};

export { getVendorReports };

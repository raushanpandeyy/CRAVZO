import { apiRequest } from "./api.js";

export const updateRiderStatus = async (isOnline) => {
  const response = await apiRequest("/api/rider/status", {
    method: "PATCH",
    body: JSON.stringify({ isOnline }),
  });

  return response.data;
};

export const updateRiderLocation = async (latitude, longitude) => {
  const response = await apiRequest("/api/rider/location", {
    method: "PATCH",
    body: JSON.stringify({ latitude, longitude }),
  });

  return response.data;
};

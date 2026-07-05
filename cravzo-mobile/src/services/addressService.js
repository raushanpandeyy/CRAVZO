import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getAddresses = async () => {
  const response = await apiRequest(API_ENDPOINTS.user.addresses);
  return response.data || [];
};

export const addAddress = async (address) => {
  const response = await apiRequest(API_ENDPOINTS.user.addresses, {
    method: "POST",
    data: address,
  });
  return response.data;
};

export const updateAddress = async (id, address) => {
  const response = await apiRequest(API_ENDPOINTS.user.addressById(id), {
    method: "PUT",
    data: address,
  });
  return response.data;
};

export const deleteAddress = async (id) => {
  await apiRequest(API_ENDPOINTS.user.addressById(id), { method: "DELETE" });
};

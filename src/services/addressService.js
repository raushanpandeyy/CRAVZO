import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { apiRequest } from "./api.js";

const dispatchAddressesChange = () => {
  window.dispatchEvent(new Event("addressesChange"));
};

const getAddresses = async () => {
  const response = await apiRequest(API_ENDPOINTS.user.addresses);
  return response.data || [];
};

const createAddress = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.user.addresses, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  dispatchAddressesChange();
  return response.data;
};

const updateAddress = async (addressId, payload) => {
  const response = await apiRequest(API_ENDPOINTS.user.addressById(addressId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  dispatchAddressesChange();
  return response.data;
};

const deleteAddress = async (addressId) => {
  const response = await apiRequest(API_ENDPOINTS.user.addressById(addressId), {
    method: "DELETE",
  });

  dispatchAddressesChange();
  return response.data;
};

export { createAddress, deleteAddress, dispatchAddressesChange, getAddresses, updateAddress };

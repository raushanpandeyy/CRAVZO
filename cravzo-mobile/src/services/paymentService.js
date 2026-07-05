import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

let RazorpayCheckout = null;

export const loadRazorpayCheckout = async () => {
  if (RazorpayCheckout) return RazorpayCheckout;
  try {
    const module = await import("react-native-razorpay");
    RazorpayCheckout = module.default || module;
    return RazorpayCheckout;
  } catch {
    throw new Error("Razorpay SDK not available");
  }
};

export const getRazorpayConfig = () =>
  apiRequest(API_ENDPOINTS.payments.razorpayConfig);

export const createRazorpayCheckoutOrder = (payload) =>
  apiRequest(API_ENDPOINTS.payments.razorpayOrder, {
    method: "POST",
    data: payload,
  });

export const verifyRazorpayPaymentAndCreateOrder = (payload) =>
  apiRequest(API_ENDPOINTS.payments.razorpayVerify, {
    method: "POST",
    data: payload,
  });

export const createCODOrder = (payload) =>
  apiRequest(API_ENDPOINTS.payments.codOrder, {
    method: "POST",
    data: payload,
  });

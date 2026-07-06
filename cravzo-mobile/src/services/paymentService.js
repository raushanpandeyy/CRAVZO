import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

let RazorpayCheckout = null;
const unwrapData = (response) => response?.data ?? response;

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

export const getRazorpayConfig = async () =>
  unwrapData(await apiRequest(API_ENDPOINTS.payments.razorpayConfig));

export const createRazorpayCheckoutOrder = async (payload) =>
  unwrapData(await apiRequest(API_ENDPOINTS.payments.razorpayOrder, {
    method: "POST",
    data: payload,
  }));

export const verifyRazorpayPaymentAndCreateOrder = async (payload) =>
  unwrapData(await apiRequest(API_ENDPOINTS.payments.razorpayVerify, {
    method: "POST",
    data: payload,
  }));

export const createCODOrder = async (payload) =>
  unwrapData(await apiRequest(API_ENDPOINTS.payments.codOrder, {
    method: "POST",
    data: payload,
  }));

export const validateCoupon = async (code, restaurantId, subtotal) => {
  const result = unwrapData(await apiRequest(API_ENDPOINTS.coupons.validate, {
    method: "POST",
    data: { code, restaurantId, subtotal },
  }));
  if (!result?.valid) throw new Error(result?.message || "Invalid coupon code");
  return result.coupon;
};

import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { getPrice } from "./../utils/cloudinary";

let RazorpayCheckout = null;

const loadRazorpay = async () => {
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

export const openRazorpayCheckout = async ({
  keyId,
  amount,
  currency,
  name,
  description,
  orderId,
  prefill,
  themeColor,
}) => {
  const Razorpay = await loadRazorpay();
  const options = {
    key: keyId,
    amount: Math.floor(amount * 100),
    currency: currency || "INR",
    name: name || "CRAVZO",
    description: description || "Food order payment",
    order_id: orderId,
    prefill: {
      name: prefill?.name || "",
      email: prefill?.email || "",
      contact: prefill?.phone || "",
    },
    theme: { color: themeColor || "#1e1b4b" },
  };

  return new Promise((resolve, reject) => {
    Razorpay.RazorpayCheckout.open(options)
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
};

import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { apiRequest, invalidateCache } from "./api.js";

let checkoutScriptPromise = null;

const loadRazorpayCheckout = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (!checkoutScriptPromise) {
    checkoutScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
      document.body.appendChild(script);
    });
  }

  return checkoutScriptPromise;
};

const getRazorpayConfig = async () => {
  const response = await apiRequest(API_ENDPOINTS.payments.razorpayConfig);
  return response.data;
};

const createRazorpayCheckoutOrder = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.payments.razorpayOrder, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

const verifyRazorpayPaymentAndCreateOrder = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.payments.razorpayVerify, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  invalidateCache("/api/orders");
  return response.data;
};

const createCODOrder = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.payments.codOrder, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  invalidateCache("/api/orders");
  return response.data;
};

export {
  createCODOrder,
  createRazorpayCheckoutOrder,
  getRazorpayConfig,
  loadRazorpayCheckout,
  verifyRazorpayPaymentAndCreateOrder,
};

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

const razorpayBaseUrl = "https://api.razorpay.com/v1";

const assertRazorpayConfig = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(500, "Razorpay keys are not configured");
  }
};

const buildRefundIdempotencyKey = (orderId) => `cravzo_refund_${orderId}`;

const initiateRazorpayRefund = async ({ paymentId, amount, orderId, customerId, fetchImpl = fetch }) => {
  assertRazorpayConfig();
  if (!paymentId) throw new ApiError(409, "Paid order is missing its Razorpay payment ID");

  const amountInPaise = Math.round(Number(amount) * 100);
  if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
    throw new ApiError(400, "Refund amount must be greater than zero");
  }

  const response = await fetchImpl(`${razorpayBaseUrl}/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
      "X-Refund-Idempotency": buildRefundIdempotencyKey(orderId),
    },
    body: JSON.stringify({
      amount: amountInPaise,
      speed: "normal",
      receipt: `refund_${orderId}`,
      notes: { orderId, customerId },
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(502, data?.error?.description || "Razorpay could not initiate the refund");
  }
  if (!data?.id || Number(data.amount) !== amountInPaise) {
    throw new ApiError(502, "Razorpay returned an invalid refund response");
  }
  return data;
};

const fetchRazorpayRefund = async ({ refundId, fetchImpl = fetch }) => {
  assertRazorpayConfig();
  if (!refundId) throw new ApiError(400, "Refund ID is required");

  const response = await fetchImpl(`${razorpayBaseUrl}/refunds/${encodeURIComponent(refundId)}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(502, data?.error?.description || "Could not fetch Razorpay refund status");
  }
  if (!data?.id || data.id !== refundId) {
    throw new ApiError(502, "Razorpay returned an invalid refund status response");
  }
  return data;
};

export { buildRefundIdempotencyKey, fetchRazorpayRefund, initiateRazorpayRefund };
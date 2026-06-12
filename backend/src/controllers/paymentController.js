import crypto from "crypto";

import { env } from "../config/env.js";
import { createPersistedOrder, prepareOrderDraft, serializeOrder } from "../services/orderCheckoutService.js";
import { notifyAdminOrderCreated } from "../services/adminOrderAlertService.js";
import { notifyRiderNewOrder, notifyVendorNewOrder } from "../services/notificationService.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";
import { createCheckoutOrderSchema, createOrderSchema, verifyPaymentOrderSchema } from "../validators/orderValidators.js";

const runNotificationTask = (task, context) => {
  task.catch((err) => {
    logger.error("Notification task failed", { error: err.message, context });
  });
};

const razorpayBaseUrl = "https://api.razorpay.com/v1";

const assertRazorpayConfig = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(500, "Razorpay keys are not configured");
  }
};

const createRazorpayOrder = async ({ amount, receipt, notes }) => {
  assertRazorpayConfig();

  const response = await fetch(`${razorpayBaseUrl}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt,
      notes,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(502, data?.error?.description || "Failed to create Razorpay order");
  }

  return data;
};

const getRazorpayConfig = async (_req, res) => {
  assertRazorpayConfig();

  res.status(200).json(
    apiResponse({
      message: "Razorpay config fetched successfully",
      data: {
        keyId: env.RAZORPAY_KEY_ID,
      },
    }),
  );
};


const createCODOrder = async (req, res) => {
  const { restaurantId, items, address = null, addressId = null, notes = null } = createOrderSchema.parse({
    ...req.body,
    paymentMethod: "COD",
  });

  const order = await createPersistedOrder({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod: "COD",
    paymentStatus: "PENDING", // 🔥 COD = unpaid
    notes,
  });

  runNotificationTask(notifyVendorNewOrder(order), "notifyVendorNewOrder");
  runNotificationTask(notifyRiderNewOrder(order), "notifyRiderNewOrder");
  notifyAdminOrderCreated(order);

  res.status(201).json({
    success: true,
    message: "COD Order placed successfully",
    data: order,
  });
};


const createCheckoutOrder = async (req, res) => {
  const { restaurantId, items, address = null, addressId = null, paymentMethod, notes = null } =
    createCheckoutOrderSchema.parse(req.body);
  const draft = await prepareOrderDraft({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod,
    notes,
  });

  const razorpayOrder = await createRazorpayOrder({
    amount: Math.round(Number(draft.totalAmount) * 100),
    receipt: `cravzo_${Date.now()}`,
    notes: {
      customerId: req.user.sub,
      restaurantId,
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Checkout order created successfully",
      data: {
        razorpayOrder,
        amount: draft.totalAmount,
        currency: "INR",
      },
    }),
  );
};

const verifyAndCreatePaidOrder = async (req, res) => {
  assertRazorpayConfig();

  const {
    restaurantId,
    items,
    address = null,
    addressId = null,
    notes = null,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = verifyPaymentOrderSchema.parse(req.body);

  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    throw new ApiError(400, "Invalid Razorpay payment signature");
  }

  const order = await createPersistedOrder({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod: "UPI",
    paymentStatus: "PAID",
    notes,
    gatewayProvider: "RAZORPAY",
    gatewayOrderId: razorpayOrderId,
    gatewayPaymentId: razorpayPaymentId,
    gatewaySignature: razorpaySignature,
  });

  runNotificationTask(notifyVendorNewOrder(order), "notifyVendorNewOrder");
  runNotificationTask(notifyRiderNewOrder(order), "notifyRiderNewOrder");
  notifyAdminOrderCreated(order);

  res.status(201).json(
    apiResponse({
      message: "Payment verified and order created successfully",
      data: serializeOrder(order),
    }),
  );
};

export { createCheckoutOrder, getRazorpayConfig, verifyAndCreatePaidOrder,createCODOrder };

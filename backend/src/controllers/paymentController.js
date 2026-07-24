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
    throw new ApiError(400, "Online payments are not configured. Add Razorpay keys or use Cash on Delivery.");
  }
};

const createRazorpayOrder = async ({ amount, receipt, notes }) => {
  assertRazorpayConfig();

  let response;
  try {
    response = await fetch(`${razorpayBaseUrl}/orders`, {
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
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new ApiError(400, "Could not connect to Razorpay. Check internet/server access and try again.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(400, data?.error?.description || "Failed to create Razorpay order");
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
  const { restaurantId, items, address = null, addressId = null, notes = null, restaurantInstructions = null, deliveryInstructions = null, tipAmount = 0, couponCode = null, referralVoucherCode = null } = createOrderSchema.parse({
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
    paymentStatus: "PENDING", // Ã°Å¸â€Â¥ COD = unpaid
    notes,
    restaurantInstructions,
    deliveryInstructions,
    tipAmount,
    couponCode,
    referralVoucherCode,
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
  const { restaurantId, items, address = null, addressId = null, paymentMethod, notes = null, restaurantInstructions = null, deliveryInstructions = null, tipAmount = 0, couponCode = null, referralVoucherCode = null } =
    createCheckoutOrderSchema.parse(req.body);
  const draft = await prepareOrderDraft({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod,
    notes,
    restaurantInstructions,
    deliveryInstructions,
    tipAmount,
    couponCode,
    referralVoucherCode,
    persistAddress: false,
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
    restaurantInstructions = null,
    deliveryInstructions = null,
    tipAmount = 0,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentMethod,
    couponCode = null,
    referralVoucherCode = null,
  } = verifyPaymentOrderSchema.parse(req.body);

  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    throw new ApiError(400, "Invalid Razorpay payment signature");
  }

  let razorpayOrderRes;
  try {
    razorpayOrderRes = await fetch(`${razorpayBaseUrl}/orders/${razorpayOrderId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new ApiError(400, "Could not verify payment with Razorpay. Check internet/server access and try again.");
  }

  const razorpayOrder = await razorpayOrderRes.json().catch(() => null);

  if (!razorpayOrderRes.ok) {
    throw new ApiError(400, razorpayOrder?.error?.description || "Failed to verify Razorpay order");
  }
  const draft = await prepareOrderDraft({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod,
    notes,
    restaurantInstructions,
    deliveryInstructions,
    tipAmount,
    couponCode,
    referralVoucherCode,
  });

  const expectedAmount = Math.round(Number(draft.totalAmount) * 100);
  const belongsToCustomer = razorpayOrder.notes?.customerId === req.user.sub;
  const belongsToRestaurant = razorpayOrder.notes?.restaurantId === restaurantId;
  if (!belongsToCustomer || !belongsToRestaurant || razorpayOrder.status !== "paid") {
    throw new ApiError(400, "Razorpay order does not match this checkout");
  }
  if (Number(razorpayOrder.amount_paid) !== expectedAmount) {
    throw new ApiError(400, "Payment amount does not match order total");
  }

  const order = await createPersistedOrder({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod,
    paymentStatus: "PAID",
    notes,
    restaurantInstructions,
    deliveryInstructions,
    tipAmount,
    couponCode,
    referralVoucherCode,
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




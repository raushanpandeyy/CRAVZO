import { Router } from "express";

import {
  createDeliveryOtp,
  createOrder,
  getMyOrders,
  getOrderTracking,
  getRiderOrderHistory,
  getRiderOrderSuggestions,
  getRiderOrders,
  getVendorOrderHistory,
  getVendorOrders,
  getVendorPayouts,
  quoteOrder,
  reorderOrder,
  requestVendorPayout,
  updateOrderStatus,
  verifyDeliveryOtp,
} from "../controllers/orderController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { orderLimiter } from "../middleware/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.post("/", authorize("CUSTOMER"), orderLimiter, asyncHandler(createOrder));
orderRouter.post("/quote", authorize("CUSTOMER"), asyncHandler(quoteOrder));
orderRouter.get("/my", authorize("CUSTOMER"), asyncHandler(getMyOrders));
orderRouter.get("/vendor", authorize("VENDOR", "ADMIN"), asyncHandler(getVendorOrders));
orderRouter.get("/vendor/history", authorize("VENDOR", "ADMIN"), asyncHandler(getVendorOrderHistory));
orderRouter.get("/vendor/payouts", authorize("VENDOR", "ADMIN"), asyncHandler(getVendorPayouts));
orderRouter.post("/vendor/payouts", authorize("VENDOR", "ADMIN"), asyncHandler(requestVendorPayout));
orderRouter.get("/rider", authorize("RIDER", "ADMIN"), asyncHandler(getRiderOrders));
orderRouter.get("/rider/history", authorize("RIDER", "ADMIN"), asyncHandler(getRiderOrderHistory));
orderRouter.get("/rider/suggestions", authorize("RIDER", "ADMIN"), asyncHandler(getRiderOrderSuggestions));
orderRouter.get("/:orderId/reorder", authorize("CUSTOMER"), asyncHandler(reorderOrder));
orderRouter.get("/:orderId/tracking", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(getOrderTracking));
orderRouter.post("/:orderId/delivery-otp", authorize("CUSTOMER"), asyncHandler(createDeliveryOtp));
orderRouter.post("/:orderId/verify-delivery-otp", authorize("RIDER"), asyncHandler(verifyDeliveryOtp));
orderRouter.patch("/:orderId/status", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(updateOrderStatus));

export { orderRouter };

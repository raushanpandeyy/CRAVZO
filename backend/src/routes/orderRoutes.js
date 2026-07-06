import { Router } from "express";

import {
  createDeliveryOtp,
  createOrder,
  getMyOrders,
  getOrderTracking,
  getRiderOrderSuggestions,
  getRiderOrders,
  getVendorOrders,
  getVendorPayouts,
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
// Fix #11: Rate limit order creation per authenticated user
orderRouter.post("/", authorize("CUSTOMER"), orderLimiter, asyncHandler(createOrder));
orderRouter.get("/my", authorize("CUSTOMER"), asyncHandler(getMyOrders));
orderRouter.get("/vendor", authorize("VENDOR", "ADMIN"), asyncHandler(getVendorOrders));
orderRouter.get("/vendor/payouts", authorize("VENDOR", "ADMIN"), asyncHandler(getVendorPayouts));
orderRouter.post("/vendor/payouts", authorize("VENDOR", "ADMIN"), asyncHandler(requestVendorPayout));
orderRouter.get("/:orderId/reorder", authorize("CUSTOMER"), asyncHandler(reorderOrder));
orderRouter.get("/:orderId/tracking", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(getOrderTracking));
orderRouter.post("/:orderId/delivery-otp", authorize("CUSTOMER"), asyncHandler(createDeliveryOtp));
orderRouter.post("/:orderId/verify-delivery-otp", authorize("RIDER"), asyncHandler(verifyDeliveryOtp));
orderRouter.get("/rider", authorize("RIDER", "ADMIN"), asyncHandler(getRiderOrders));
// Fix #2: Nearest-rider suggestion computation moved to dedicated endpoint
// so the main /rider polling loop stays fast (no haversine in hot path)
orderRouter.get("/rider/suggestions", authorize("RIDER", "ADMIN"), asyncHandler(getRiderOrderSuggestions));
orderRouter.patch("/:orderId/status", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(updateOrderStatus));

export { orderRouter };

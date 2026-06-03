import { Router } from "express";

import {
  createOrder,
  getMyOrders,
  getRiderOrderSuggestions,
  getRiderOrders,
  getVendorOrders,
  updateOrderStatus,
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
orderRouter.get("/rider", authorize("RIDER", "ADMIN"), asyncHandler(getRiderOrders));
// Fix #2: Nearest-rider suggestion computation moved to dedicated endpoint
// so the main /rider polling loop stays fast (no haversine in hot path)
orderRouter.get("/rider/suggestions", authorize("RIDER", "ADMIN"), asyncHandler(getRiderOrderSuggestions));
orderRouter.patch("/:orderId/status", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(updateOrderStatus));

export { orderRouter };

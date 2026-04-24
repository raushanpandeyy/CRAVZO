import { Router } from "express";

import {
  createOrder,
  getMyOrders,
  getRiderOrders,
  getVendorOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.post("/", authorize("CUSTOMER"), asyncHandler(createOrder));
orderRouter.get("/my", authorize("CUSTOMER"), asyncHandler(getMyOrders));
orderRouter.get("/vendor", authorize("VENDOR", "ADMIN"), asyncHandler(getVendorOrders));
orderRouter.get("/rider", authorize("RIDER", "ADMIN"), asyncHandler(getRiderOrders));
orderRouter.patch("/:orderId/status", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(updateOrderStatus));

export { orderRouter };

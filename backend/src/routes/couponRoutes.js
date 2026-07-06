import { Router } from "express";

import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  validateCoupon,
} from "../controllers/couponController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const couponRouter = Router();

couponRouter.post("/validate", asyncHandler(validateCoupon));

couponRouter.use(authenticate);

couponRouter.post("/", authorize("VENDOR", "ADMIN"), asyncHandler(createCoupon));
couponRouter.get("/", authorize("VENDOR", "ADMIN"), asyncHandler(listCoupons));
couponRouter.put("/:couponId", authorize("VENDOR", "ADMIN"), asyncHandler(updateCoupon));
couponRouter.delete("/:couponId", authorize("VENDOR", "ADMIN"), asyncHandler(deleteCoupon));

export { couponRouter };

import { Router } from "express";

import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem,
} from "../controllers/menuController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { publicLimiter } from "../middleware/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cachePublic = (_req, res, next) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
  next();
};

const menuRouter = Router();

menuRouter.get("/restaurant/:restaurantId", publicLimiter, cachePublic, asyncHandler(listMenuItems));
menuRouter.post("/", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(createMenuItem));
menuRouter.put("/:menuItemId", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(updateMenuItem));
menuRouter.delete(
  "/:menuItemId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  asyncHandler(deleteMenuItem),
);

export { menuRouter };

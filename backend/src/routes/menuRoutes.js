import { Router } from "express";

import {
  bulkImportMenuItems,
  createMenuItem,
  deleteMenuItem,
  getLowStockItems,
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
menuRouter.post("/bulk-import", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(bulkImportMenuItems));
menuRouter.get("/low-stock", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(getLowStockItems));
menuRouter.put("/:menuItemId", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(updateMenuItem));
menuRouter.delete(
  "/:menuItemId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  asyncHandler(deleteMenuItem),
);

export { menuRouter };

import { Router } from "express";

import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem,
} from "../controllers/menuController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const menuRouter = Router();

menuRouter.get("/restaurant/:restaurantId", asyncHandler(listMenuItems));
menuRouter.post("/", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(createMenuItem));
menuRouter.put("/:menuItemId", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(updateMenuItem));
menuRouter.delete(
  "/:menuItemId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  asyncHandler(deleteMenuItem),
);

export { menuRouter };

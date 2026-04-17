import { Router } from "express";

import {
  createRestaurant,
  getMyRestaurant,
  getRestaurantById,
  listRestaurants,
  updateRestaurant,
} from "../controllers/restaurantController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const restaurantRouter = Router();

restaurantRouter.get("/", asyncHandler(listRestaurants));
restaurantRouter.get("/mine", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(getMyRestaurant));
restaurantRouter.get("/:restaurantId", asyncHandler(getRestaurantById));
restaurantRouter.post("/", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(createRestaurant));
restaurantRouter.put(
  "/:restaurantId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  asyncHandler(updateRestaurant),
);

export { restaurantRouter };

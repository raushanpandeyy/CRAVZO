import { Router } from "express";

import {
  createRestaurant,
  getMyRestaurant,
  getRestaurantById,
  listRestaurants,
  updateRestaurant,
  getNearbyRestaurants,
  searchRestaurantsAndDishes,
} from "../controllers/restaurantController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const restaurantRouter = Router();

restaurantRouter.get("/", asyncHandler(listRestaurants));
restaurantRouter.get("/nearby", asyncHandler(getNearbyRestaurants));
// Unified search: GET /api/restaurants/search?q=biryani&lat=28.6&lng=77.2&radius=3
restaurantRouter.get("/search", asyncHandler(searchRestaurantsAndDishes));
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

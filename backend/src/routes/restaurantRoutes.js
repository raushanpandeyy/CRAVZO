import { Router } from "express";

import {
  createRestaurant,
  getMyRestaurant,
  getRestaurantById,
  listRestaurants,
  updateRestaurant,
  deleteRestaurant,
  getNearbyRestaurants,
  searchRestaurantsAndDishes,
} from "../controllers/restaurantController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { publicLimiter } from "../middleware/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cachePublic = (_req, res, next) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
  next();
};

const restaurantRouter = Router();

restaurantRouter.get("/", publicLimiter, cachePublic, asyncHandler(listRestaurants));
restaurantRouter.get("/nearby", publicLimiter, cachePublic, asyncHandler(getNearbyRestaurants));
// Unified search: GET /api/restaurants/search?q=biryani&lat=28.6&lng=77.2&radius=3
restaurantRouter.get("/search", publicLimiter, cachePublic, asyncHandler(searchRestaurantsAndDishes));
restaurantRouter.get("/mine", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(getMyRestaurant));
restaurantRouter.get("/:restaurantId", cachePublic, asyncHandler(getRestaurantById));

restaurantRouter.post("/", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(createRestaurant));
restaurantRouter.put(
  "/:restaurantId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  asyncHandler(updateRestaurant),
);
restaurantRouter.delete(
  "/:restaurantId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  asyncHandler(deleteRestaurant),
);

export { restaurantRouter };

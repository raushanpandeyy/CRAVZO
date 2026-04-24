import { Router } from "express";

import {
  createRestaurant,
  getMyRestaurant,
  getRestaurantById,
  listRestaurants,
  updateRestaurant,
<<<<<<< HEAD
  getNearbyRestaurants
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
} from "../controllers/restaurantController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const restaurantRouter = Router();

restaurantRouter.get("/", asyncHandler(listRestaurants));
<<<<<<< HEAD
restaurantRouter.get("/nearby", asyncHandler(getNearbyRestaurants));
restaurantRouter.get("/mine", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(getMyRestaurant));
restaurantRouter.get("/:restaurantId", asyncHandler(getRestaurantById));

=======
restaurantRouter.get("/mine", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(getMyRestaurant));
restaurantRouter.get("/:restaurantId", asyncHandler(getRestaurantById));
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
restaurantRouter.post("/", authenticate, authorize("VENDOR", "ADMIN"), asyncHandler(createRestaurant));
restaurantRouter.put(
  "/:restaurantId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  asyncHandler(updateRestaurant),
);

export { restaurantRouter };

import { Router } from "express";

import {
  getFeaturedRestaurants,
  getAds,
  addFeaturedRestaurant,
  removeFeaturedRestaurant,
  updateFeaturedRestaurantsOrder,
  addAd,
  removeAd,
  updateAdsOrder,
} from "../controllers/publicController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const publicRouter = Router();

publicRouter.get("/featured-restaurants", asyncHandler(getFeaturedRestaurants));
publicRouter.get("/ads", asyncHandler(getAds));

publicRouter.use(authenticate, authorize("ADMIN"));
publicRouter.post("/featured-restaurants", asyncHandler(addFeaturedRestaurant));
publicRouter.delete("/featured-restaurants/:id", asyncHandler(removeFeaturedRestaurant));
publicRouter.put("/featured-restaurants/order", asyncHandler(updateFeaturedRestaurantsOrder));
publicRouter.post("/ads", asyncHandler(addAd));
publicRouter.delete("/ads/:id", asyncHandler(removeAd));
publicRouter.put("/ads/order", asyncHandler(updateAdsOrder));

export { publicRouter };
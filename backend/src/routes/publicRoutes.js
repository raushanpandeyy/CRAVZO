import { Router } from "express";

import {
  getFeaturedRestaurants,
  getAds,
  getHomeData,
  getAppConfig,
  addFeaturedRestaurant,
  removeFeaturedRestaurant,
  updateFeaturedRestaurantsOrder,
  addAd,
  removeAd,
  updateAdsOrder,
  createLocationLead,
} from "../controllers/publicController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { publicLimiter } from "../middleware/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const publicRouter = Router();

publicRouter.use(publicLimiter);
publicRouter.get("/config", asyncHandler(getAppConfig));
publicRouter.get("/home", asyncHandler(getHomeData));
publicRouter.get("/featured-restaurants", asyncHandler(getFeaturedRestaurants));
publicRouter.get("/ads", asyncHandler(getAds));
publicRouter.post("/location-leads", asyncHandler(createLocationLead));

publicRouter.use(authenticate, authorize("ADMIN"));
publicRouter.post("/featured-restaurants", asyncHandler(addFeaturedRestaurant));
publicRouter.delete("/featured-restaurants/:id", asyncHandler(removeFeaturedRestaurant));
publicRouter.put("/featured-restaurants/order", asyncHandler(updateFeaturedRestaurantsOrder));
publicRouter.post("/ads", asyncHandler(addAd));
publicRouter.delete("/ads/:id", asyncHandler(removeAd));
publicRouter.put("/ads/order", asyncHandler(updateAdsOrder));

export { publicRouter };



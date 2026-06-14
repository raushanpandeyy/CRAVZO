import { Router } from "express";

import { deleteReview, listMyReviews, listRestaurantReviews, upsertReview } from "../controllers/reviewController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cachePublic = (_req, res, next) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
  next();
};

const reviewRouter = Router();

reviewRouter.get("/restaurant/:restaurantId", cachePublic, asyncHandler(listRestaurantReviews));
reviewRouter.use(authenticate);
reviewRouter.get("/my", asyncHandler(listMyReviews));
reviewRouter.post("/", asyncHandler(upsertReview));
reviewRouter.delete("/:reviewId", asyncHandler(deleteReview));

export { reviewRouter };

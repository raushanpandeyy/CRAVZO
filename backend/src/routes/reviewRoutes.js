import { Router } from "express";

import { deleteReview, listMyReviews, listRestaurantReviews, replyToReview, upsertReview } from "../controllers/reviewController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { publicLimiter } from "../middleware/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cachePublic = (_req, res, next) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
  next();
};

const reviewRouter = Router();

reviewRouter.get("/restaurant/:restaurantId", publicLimiter, cachePublic, asyncHandler(listRestaurantReviews));
reviewRouter.use(authenticate);
reviewRouter.get("/my", asyncHandler(listMyReviews));
reviewRouter.post("/", authorize("CUSTOMER"), asyncHandler(upsertReview));
reviewRouter.post("/:reviewId/reply", authorize("VENDOR"), asyncHandler(replyToReview));
reviewRouter.delete("/:reviewId", asyncHandler(deleteReview));

export { reviewRouter };

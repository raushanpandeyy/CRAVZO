import { Router } from "express";

import { deleteReview, listMyReviews, listRestaurantReviews, upsertReview } from "../controllers/reviewController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const reviewRouter = Router();

reviewRouter.get("/restaurant/:restaurantId", asyncHandler(listRestaurantReviews));
reviewRouter.use(authenticate);
reviewRouter.get("/my", asyncHandler(listMyReviews));
reviewRouter.post("/", asyncHandler(upsertReview));
reviewRouter.delete("/:reviewId", asyncHandler(deleteReview));

export { reviewRouter };

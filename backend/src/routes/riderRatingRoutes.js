import { Router } from "express";

import { createRiderRating, getMyRatings, getRiderRatings } from "../controllers/riderRatingController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const riderRatingRouter = Router();

riderRatingRouter.use(authenticate);
riderRatingRouter.post("/", authorize("CUSTOMER"), asyncHandler(createRiderRating));
riderRatingRouter.get("/my", asyncHandler(getMyRatings));
riderRatingRouter.get("/rider/:riderId", asyncHandler(getRiderRatings));

export { riderRatingRouter };

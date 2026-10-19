import { Router } from "express";

import {
  bookGigController,
  endGigController,
  getActiveGigController,
  getGigStatsController,
  getGigTiersController,
} from "../controllers/gigController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const gigRouter = Router();

gigRouter.use(authenticate);
gigRouter.use(authorize("RIDER", "ADMIN"));

gigRouter.post("/book",   asyncHandler(bookGigController));
gigRouter.post("/end",    asyncHandler(endGigController));
gigRouter.get("/active",  asyncHandler(getActiveGigController));
gigRouter.get("/stats",   asyncHandler(getGigStatsController));
gigRouter.get("/tiers",   asyncHandler(getGigTiersController));

export { gigRouter };

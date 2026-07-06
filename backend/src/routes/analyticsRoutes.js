import { Router } from "express";

import { getVendorAnalytics } from "../controllers/analyticsController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get("/vendor", authorize("VENDOR", "ADMIN"), asyncHandler(getVendorAnalytics));

export { analyticsRouter };

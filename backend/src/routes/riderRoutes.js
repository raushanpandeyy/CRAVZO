import { Router } from "express";

import { updateRiderLocation, updateRiderStatus } from "../controllers/riderController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const riderRouter = Router();

riderRouter.use(authenticate);
riderRouter.patch("/status", authorize("RIDER", "ADMIN"), asyncHandler(updateRiderStatus));
riderRouter.patch("/location", authorize("RIDER", "ADMIN"), asyncHandler(updateRiderLocation));

export default riderRouter;

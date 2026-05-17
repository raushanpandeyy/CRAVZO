import { Router } from "express";

import { removeSavedFcmToken, saveFcmToken, updateFcmToken } from "../controllers/notificationController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.post("/fcm-token", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(saveFcmToken));
notificationRouter.put("/fcm-token", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(updateFcmToken));
notificationRouter.delete("/fcm-token", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(removeSavedFcmToken));

export { notificationRouter };

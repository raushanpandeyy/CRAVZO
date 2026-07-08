import { Router } from "express";

import { applyReferral, getMyReferral } from "../controllers/referralController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const referralRouter = Router();

referralRouter.use(authenticate);
referralRouter.get("/me", asyncHandler(getMyReferral));
referralRouter.post("/apply", asyncHandler(applyReferral));

export { referralRouter };
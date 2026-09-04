import { Router } from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllMarkups, upsertMarkup, deleteMarkup } from "../controllers/platformMarkupController.js";

const platformMarkupRouter = Router();

platformMarkupRouter.use(authenticate);

// Public to vendor too — so vendor app can fetch markups for projected price preview
platformMarkupRouter.get("/", authorize("ADMIN", "VENDOR"), asyncHandler(getAllMarkups));

// Admin only — set/delete markups
platformMarkupRouter.put("/:category", authorize("ADMIN"), asyncHandler(upsertMarkup));
platformMarkupRouter.delete("/:category", authorize("ADMIN"), asyncHandler(deleteMarkup));

export { platformMarkupRouter };

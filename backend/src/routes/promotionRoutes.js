import { Router } from "express";

import {
  getActivePromotions,
  listPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  updatePromotionsOrder,
} from "../controllers/promotionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const promotionRouter = Router();

promotionRouter.get("/", asyncHandler(getActivePromotions));

promotionRouter.use(authenticate, authorize("ADMIN"));
promotionRouter.get("/all", asyncHandler(listPromotions));
promotionRouter.post("/", asyncHandler(createPromotion));
promotionRouter.patch("/:id", asyncHandler(updatePromotion));
promotionRouter.delete("/:id", asyncHandler(deletePromotion));
promotionRouter.put("/order", asyncHandler(updatePromotionsOrder));

export { promotionRouter };

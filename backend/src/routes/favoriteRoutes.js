import { Router } from "express";

import { checkFavorite, createFavorite, deleteFavorite, listFavorites } from "../controllers/favoriteController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const favoriteRouter = Router();

favoriteRouter.use(authenticate);
favoriteRouter.get("/", asyncHandler(listFavorites));
// Fix 4: Lightweight check endpoint — { isFavorite: boolean } instead of full list
favoriteRouter.get("/check", asyncHandler(checkFavorite));
favoriteRouter.post("/", asyncHandler(createFavorite));
favoriteRouter.delete("/:restaurantId", asyncHandler(deleteFavorite));

export { favoriteRouter };

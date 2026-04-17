import { Router } from "express";

import { createFavorite, deleteFavorite, listFavorites } from "../controllers/favoriteController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const favoriteRouter = Router();

favoriteRouter.use(authenticate);
favoriteRouter.get("/", asyncHandler(listFavorites));
favoriteRouter.post("/", asyncHandler(createFavorite));
favoriteRouter.delete("/:restaurantId", asyncHandler(deleteFavorite));

export { favoriteRouter };

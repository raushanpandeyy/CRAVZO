import { Router } from "express";

import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from "../controllers/addressController.js";
import { getProfile, updateProfile, uploadImage } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const userRouter = Router();

userRouter.use(authenticate);
userRouter.get("/profile", asyncHandler(getProfile));
userRouter.put("/profile", asyncHandler(updateProfile));
userRouter.post("/uploads/image", asyncHandler(uploadImage));
userRouter.get("/addresses", asyncHandler(listAddresses));
userRouter.post("/addresses", asyncHandler(createAddress));
userRouter.put("/addresses/:addressId", asyncHandler(updateAddress));
userRouter.delete("/addresses/:addressId", asyncHandler(deleteAddress));

export { userRouter };

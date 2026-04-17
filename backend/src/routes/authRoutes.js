import { Router } from "express";

import {
  login,
  logout,
  me,
  sendOtpController,
  signUp,
  verifyOtpController,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authRouter = Router();

authRouter.post("/signup", asyncHandler(signUp));
authRouter.post("/login", asyncHandler(login));
authRouter.get("/me", authenticate, asyncHandler(me));
authRouter.post("/logout", authenticate, asyncHandler(logout));
authRouter.post("/send-otp", asyncHandler(sendOtpController));
authRouter.post("/verify-otp", asyncHandler(verifyOtpController));

export { authRouter };

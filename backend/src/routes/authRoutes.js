import { Router } from "express";

import {
  login,
  logout,
  me,
<<<<<<< HEAD
  requestPasswordReset,
  resetPassword,
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
authRouter.post("/forgot-password", asyncHandler(requestPasswordReset));
authRouter.post("/reset-password", asyncHandler(resetPassword));
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

export { authRouter };

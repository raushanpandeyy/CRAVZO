import { Router } from "express";

import {
  firebaseAuth,
} from "../controllers/firebaseAuthController.js";
import {
  login,
  logout,
  me,
  phoneSignup,
  requestPasswordReset,
  resetPassword,
  sendOtpController,
  signUp,
  verifyOtpController,
  verifyPhoneOtp,
} from "../controllers/authController.js";
import {
  firebaseAuthLimiter,
  loginLimiter,
  otpLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimiters.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authRouter = Router();

authRouter.post("/firebase", firebaseAuthLimiter, asyncHandler(firebaseAuth));
authRouter.post("/signup", otpLimiter, asyncHandler(signUp));
authRouter.post("/phone-signup", otpLimiter, asyncHandler(phoneSignup));
authRouter.post("/verify-phone-otp", otpVerifyLimiter, asyncHandler(verifyPhoneOtp));
authRouter.post("/login", loginLimiter, asyncHandler(login));
authRouter.get("/me", authenticate, asyncHandler(me));
authRouter.post("/logout", authenticate, asyncHandler(logout));
authRouter.post("/send-otp", otpLimiter, asyncHandler(sendOtpController));
authRouter.post("/verify-otp", otpVerifyLimiter, asyncHandler(verifyOtpController));
authRouter.post("/forgot-password", passwordResetLimiter, asyncHandler(requestPasswordReset));
authRouter.post("/reset-password", passwordResetLimiter, asyncHandler(resetPassword));

export { authRouter };

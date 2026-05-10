import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(10).max(15).optional(),
  password: z.string().min(8),
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).default("CUSTOMER"),
  onboardingData: z.record(z.string(), z.unknown()).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const sendOtpSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).default("CUSTOMER"),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6),
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).default("CUSTOMER"),
});

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6),
  password: z.string().min(8),
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).optional(),
});

export {
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  sendOtpSchema,
  signUpSchema,
  verifyOtpSchema,
};

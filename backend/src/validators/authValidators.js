import { z } from "zod";

const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const signUpSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(10).max(15).optional(),
  password: passwordPolicy,
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).default("CUSTOMER"),
  onboardingData: z.record(z.string(), z.unknown()).optional(),
});

const phoneSignupSchema = z.object({
  phone: z.string().trim().min(10).max(15),
  role: z.enum(["CUSTOMER", "RIDER"]).default("CUSTOMER"),
  name: z.string().trim().min(1).max(50).optional(),
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

const verifyPhoneOtpSchema = z.object({
  phone: z.string().trim().min(10).max(15),
  otp: z.string().trim().length(6),
  role: z.enum(["CUSTOMER", "RIDER"]).default("CUSTOMER"),
});

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6),
  password: passwordPolicy,
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).optional(),
});

export {
  loginSchema,
  phoneSignupSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  sendOtpSchema,
  signUpSchema,
  verifyOtpSchema,
  verifyPhoneOtpSchema,
};

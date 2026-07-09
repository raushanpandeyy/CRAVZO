import { z } from "zod";

const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const fingerprintHashSchema = z
  .string()
  .trim()
  .min(8, "Invalid fingerprint hash")
  .max(128, "Invalid fingerprint hash")
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid fingerprint hash")
  .optional();

const referralCodeSchema = z
  .string()
  .trim()
  .min(4, "Referral code is too short")
  .max(32, "Referral code is too long")
  .regex(/^[A-Za-z0-9]+$/, "Referral code can only contain letters and numbers")
  .optional();

const signUpSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(10).max(15).optional(),
  password: passwordPolicy,
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER"]).default("CUSTOMER"),
  onboardingData: z.record(z.string(), z.unknown()).optional(),
  referralCode: referralCodeSchema,
  fingerprintHash: fingerprintHashSchema,
});

const phoneSignupSchema = z.object({
  phone: z.string().trim().min(10).max(15),
  role: z.enum(["CUSTOMER", "RIDER"]).default("CUSTOMER"),
  name: z.string().trim().min(1).max(50).optional(),
  referralCode: referralCodeSchema,
  fingerprintHash: fingerprintHashSchema,
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
  fingerprintHash: fingerprintHashSchema,
});

const verifyPhoneOtpSchema = z.object({
  phone: z.string().trim().min(10).max(15),
  otp: z.string().trim().length(6),
  role: z.enum(["CUSTOMER", "RIDER"]).default("CUSTOMER"),
  fingerprintHash: fingerprintHashSchema,
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

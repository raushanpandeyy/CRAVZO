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

export { loginSchema, signUpSchema };

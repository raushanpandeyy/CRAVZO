import { z } from "zod";

const applyReferralSchema = z.object({
  referralCode: z
    .string()
    .trim()
    .min(4, "Referral code is too short")
    .max(32, "Referral code is too long")
    .regex(/^[A-Za-z0-9]+$/, "Referral code can only contain letters and numbers"),
});

export { applyReferralSchema };
import { z } from "zod";

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(10).max(15).nullable().optional(),
    avatarUrl: z.string().trim().url().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field is required",
  });

export { updateProfileSchema };

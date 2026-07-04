import { z } from "zod";

const baseAddressSchema = z.object({
  label: z.string().trim().min(2).max(40).optional().nullable(),
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(10).max(15),
  line1: z.string().trim().min(3),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  postalCode: z.string().trim().min(4).max(12),
  isDefault: z.boolean().optional(),
});

const createAddressSchema = baseAddressSchema;

const updateAddressSchema = baseAddressSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one address field is required",
});

export { createAddressSchema, updateAddressSchema };

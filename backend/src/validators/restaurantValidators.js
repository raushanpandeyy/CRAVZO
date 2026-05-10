import { z } from "zod";

const restaurantStatusSchema = z.enum(["DRAFT", "PENDING_APPROVAL", "ACTIVE", "INACTIVE", "REJECTED"]);

const restaurantPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  cuisine: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().min(10).max(15).optional().nullable(),
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(4).max(12).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  status: restaurantStatusSchema.optional(),
  isOpen: z.boolean().optional(),
  openingTime: z.string().trim().max(20).optional().nullable(),
  closingTime: z.string().trim().max(20).optional().nullable(),
  openDays: z.array(z.string().trim().min(1).max(20)).optional(),
  bankDetails: z.record(z.string(), z.unknown()).optional().nullable(),
});

const createRestaurantSchema = restaurantPayloadSchema;

const updateRestaurantSchema = restaurantPayloadSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one restaurant field is required",
});

export { createRestaurantSchema, updateRestaurantSchema };

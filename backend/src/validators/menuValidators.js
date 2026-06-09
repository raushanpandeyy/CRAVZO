import { z } from "zod";

const menuItemStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const menuItemPayloadSchema = z.object({
  restaurantId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  category: z.string().trim().min(2).max(80),
  imageUrl: z.string().trim().url().optional().nullable(),
  price: z.coerce.number().positive().max(100000),
  sizes: z
    .array(
      z.object({
        size: z.enum(["S", "M", "L"]),
        price: z.coerce.number().positive().max(100000),
      }),
    )
    .max(3)
    .optional()
    .nullable(),
  sideDishes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        price: z.coerce.number().positive().max(100000),
      }),
    )
    .max(20)
    .optional()
    .nullable(),
  isVeg: z.boolean().optional(),
  status: menuItemStatusSchema.optional(),
});

const createMenuItemSchema = menuItemPayloadSchema;

const updateMenuItemSchema = menuItemPayloadSchema
  .omit({ restaurantId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one menu item field is required",
  });

export { createMenuItemSchema, updateMenuItemSchema };

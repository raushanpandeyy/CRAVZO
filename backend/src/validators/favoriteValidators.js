import { z } from "zod";

const createFavoriteSchema = z.object({
  restaurantId: z.string().trim().min(1),
  menuItemId: z.string().trim().min(1).optional(),
});

export { createFavoriteSchema };

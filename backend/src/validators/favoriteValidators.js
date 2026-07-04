import { z } from "zod";

const createFavoriteSchema = z.object({
  restaurantId: z.string().trim().min(1),
});

export { createFavoriteSchema };

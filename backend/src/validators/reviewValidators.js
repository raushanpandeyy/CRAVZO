import { z } from "zod";

const upsertReviewSchema = z.object({
  restaurantId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export { upsertReviewSchema };

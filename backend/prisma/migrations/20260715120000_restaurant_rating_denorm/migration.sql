ALTER TABLE "Restaurant"
  ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Restaurant" r
SET
  "averageRating" = COALESCE(src.avg_rating, 0),
  "reviewCount" = COALESCE(src.review_count, 0)
FROM (
  SELECT
    "restaurantId",
    ROUND(AVG(rating)::numeric, 1)::double precision AS avg_rating,
    COUNT(*)::integer AS review_count
  FROM "Review"
  GROUP BY "restaurantId"
) src
WHERE r.id = src."restaurantId";

CREATE INDEX IF NOT EXISTS "Restaurant_status_isOpen_averageRating_idx"
  ON "Restaurant"("status", "isOpen", "averageRating");
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_restaurant_address_trgm
  ON "Restaurant" USING gin ("addressLine1" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_restaurant_search_fts
  ON "Restaurant" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine, '') || ' ' || coalesce(city, '')));

CREATE INDEX IF NOT EXISTS idx_menuitem_search_fts
  ON "MenuItem" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(description, '')));
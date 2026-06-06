-- Run this ONCE against your PostgreSQL database
-- These indexes enable fast ILIKE / `contains` text search via pg_trgm
-- Without them, every text search triggers a sequential scan

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Restaurant search (used in listRestaurants, searchRestaurantsAndDishes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_name_trgm ON "Restaurant" USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_cuisine_trgm ON "Restaurant" USING gin (cuisine gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_city_trgm ON "Restaurant" USING gin (city gin_trgm_ops);

-- MenuItem search (used in searchRestaurantsAndDishes, menu listing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menuitem_name_trgm ON "MenuItem" USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menuitem_category_trgm ON "MenuItem" USING gin (category gin_trgm_ops);

-- User search (used in admin listUsers)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_name_trgm ON "User" USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email_trgm ON "User" USING gin (email gin_trgm_ops);

import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

let indexesEnsured = false;

const ensureIndexes = async () => {
  if (indexesEnsured) return;
  indexesEnsured = true;

  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    logger.info("pg_trgm extension ready");

    const indexes = [
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_name_trgm ON "Restaurant" USING gin (name gin_trgm_ops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_cuisine_trgm ON "Restaurant" USING gin (cuisine gin_trgm_ops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_city_trgm ON "Restaurant" USING gin (city gin_trgm_ops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_address_trgm ON "Restaurant" USING gin ("addressLine1" gin_trgm_ops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menuitem_name_trgm ON "MenuItem" USING gin (name gin_trgm_ops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menuitem_category_trgm ON "MenuItem" USING gin (category gin_trgm_ops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_name_trgm ON "User" USING gin (name gin_trgm_ops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email_trgm ON "User" USING gin (email gin_trgm_ops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_rejected_rider_ids ON "Order" USING gin ("rejectedRiderIds")`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_unassigned_active ON "Order" ("riderId") WHERE "riderId" IS NULL AND status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY')`,
    ];

    for (const sql of indexes) {
      await prisma.$executeRawUnsafe(sql);
    }
    logger.info("pg_trgm indexes ready");

    const ftIndexes = [
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_name_fts ON "Restaurant" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine, '')))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_search_fts ON "Restaurant" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine, '') || ' ' || coalesce(city, '')))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menuitem_name_fts ON "MenuItem" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(category, '')))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menuitem_search_fts ON "MenuItem" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(description, '')))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_description_fts ON "Restaurant" USING gin (to_tsvector('english', coalesce(description, '')))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menuitem_description_fts ON "MenuItem" USING gin (to_tsvector('english', coalesce(description, '')))`,
    ];
    for (const sql of ftIndexes) {
      await prisma.$executeRawUnsafe(sql);
    }
    logger.info("full-text search indexes ready");
  } catch (error) {
    logger.warn("Index creation skipped (non-critical):", { error: error.message });
  }
};

export { ensureIndexes };

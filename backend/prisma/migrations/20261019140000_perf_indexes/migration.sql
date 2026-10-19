-- Performance indexes added after audit
-- Using CONCURRENTLY so production table is not locked during creation

-- RiderGig: composite index for getActiveGig + autoExpireGigs queries
-- Query pattern: WHERE riderId = ? AND status = 'ACTIVE' AND endsAt <= now()
CREATE INDEX CONCURRENTLY IF NOT EXISTS "RiderGig_riderId_status_endsAt_idx"
  ON "RiderGig"("riderId", "status", "endsAt");

-- Order: composite index for getRiderEarnings aggregate queries
-- Query pattern: WHERE riderId = ? AND status = 'DELIVERED' AND deliveredAt >= ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_riderId_status_deliveredAt_idx"
  ON "Order"("riderId", "status", "deliveredAt");

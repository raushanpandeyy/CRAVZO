-- Add basePriceAtOrder to OrderItem — snapshot of MenuItem.basePrice at order time
-- This is used for vendor payout calculation (payout = basePriceAtOrder × quantity)
ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "basePriceAtOrder" DECIMAL(10,2);

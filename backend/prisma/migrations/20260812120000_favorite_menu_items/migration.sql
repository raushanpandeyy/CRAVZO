ALTER TABLE "Favorite" ADD COLUMN IF NOT EXISTS "menuItemId" TEXT;

DROP INDEX IF EXISTS "Favorite_userId_restaurantId_key";
DROP INDEX IF EXISTS "Favorite_userId_restaurantId_menuItemId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_restaurantId_restaurant_only_key"
ON "Favorite"("userId", "restaurantId")
WHERE "menuItemId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_restaurantId_menuItemId_key"
ON "Favorite"("userId", "restaurantId", "menuItemId")
WHERE "menuItemId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Favorite_menuItemId_idx" ON "Favorite"("menuItemId");
CREATE INDEX IF NOT EXISTS "Favorite_userId_menuItemId_idx" ON "Favorite"("userId", "menuItemId");

ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_menuItemId_fkey";
ALTER TABLE "Favorite"
ADD CONSTRAINT "Favorite_menuItemId_fkey"
FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

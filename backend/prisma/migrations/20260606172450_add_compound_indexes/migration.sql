-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_status_category_price_idx" ON "MenuItem"("restaurantId", "status", "category", "price");

-- CreateIndex
CREATE INDEX "Order_restaurantId_status_createdAt_idx" ON "Order"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_customerId_status_createdAt_idx" ON "Order"("customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Restaurant_city_status_isOpen_idx" ON "Restaurant"("city", "status", "isOpen");

-- CreateIndex
CREATE INDEX "Restaurant_latitude_longitude_idx" ON "Restaurant"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "User_role_status_createdAt_id_idx" ON "User"("role", "status", "createdAt", "id");

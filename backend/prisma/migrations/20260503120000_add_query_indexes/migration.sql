-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_status_createdAt_idx" ON "User"("role", "status", "createdAt");

-- CreateIndex
CREATE INDEX "User_role_status_isOnline_idx" ON "User"("role", "status", "isOnline");

-- CreateIndex
CREATE INDEX "Address_userId_isDefault_updatedAt_idx" ON "Address"("userId", "isDefault", "updatedAt");

-- CreateIndex
CREATE INDEX "Address_userId_updatedAt_idx" ON "Address"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Restaurant_vendorId_createdAt_idx" ON "Restaurant"("vendorId", "createdAt");

-- CreateIndex
CREATE INDEX "Restaurant_status_isOpen_createdAt_idx" ON "Restaurant"("status", "isOpen", "createdAt");

-- CreateIndex
CREATE INDEX "Restaurant_status_isOpen_city_idx" ON "Restaurant"("status", "isOpen", "city");

-- CreateIndex
CREATE INDEX "Restaurant_city_idx" ON "Restaurant"("city");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_status_createdAt_idx" ON "MenuItem"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_status_category_idx" ON "MenuItem"("restaurantId", "status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Order_gatewayOrderId_key" ON "Order"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_gatewayPaymentId_key" ON "Order"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_restaurantId_createdAt_idx" ON "Order"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_riderId_status_createdAt_idx" ON "Order"("riderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentMethod_createdAt_idx" ON "Order"("paymentMethod", "createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_restaurantId_key" ON "Review"("userId", "restaurantId");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_restaurantId_createdAt_idx" ON "Review"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Favorite_restaurantId_createdAt_idx" ON "Favorite"("restaurantId", "createdAt");

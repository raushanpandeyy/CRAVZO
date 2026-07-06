ALTER TABLE "Order"
ADD COLUMN "restaurantInstructions" TEXT,
ADD COLUMN "deliveryInstructions" TEXT,
ADD COLUMN "tipAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
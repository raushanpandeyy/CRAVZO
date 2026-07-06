import { describe, it, expect } from "vitest";

describe("Order schema validation", () => {
  it("should reject empty order payload", async () => {
    const { createOrderSchema } = await import("../validators/orderValidators.js");
    const result = createOrderSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject missing items", async () => {
    const { createOrderSchema } = await import("../validators/orderValidators.js");
    const result = createOrderSchema.safeParse({
      restaurantId: "test-123",
      paymentMethod: "COD",
    });
    expect(result.success).toBe(false);
  });

  it("should require at least one item", async () => {
    const { createOrderSchema } = await import("../validators/orderValidators.js");
    const result = createOrderSchema.safeParse({
      restaurantId: "test-123",
      items: [],
      paymentMethod: "COD",
    });
    expect(result.success).toBe(false);
  });

  it("accepts coupon codes but strips client-provided side-dish prices", async () => {
    const { createOrderSchema } = await import("../validators/orderValidators.js");
    const result = createOrderSchema.parse({
      restaurantId: "restaurant-1",
      paymentMethod: "COD",
      couponCode: " save10 ",
      address: {
        fullName: "Test User",
        phone: "9876543210",
        line1: "123 Test Street",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
      },
      items: [{
        menuItemId: "item-1",
        quantity: 1,
        selectedSideDishes: [{ name: "Extra Cheese", price: 0.01 }],
      }],
    });

    expect(result.couponCode).toBe("SAVE10");
    expect(result.items[0].selectedSideDishes[0]).toEqual({ name: "Extra Cheese" });
  });
  it("accepts separate instructions and a bounded rider tip", async () => {
    const { createOrderSchema } = await import("../validators/orderValidators.js");
    const result = createOrderSchema.parse({
      restaurantId: "restaurant-1",
      paymentMethod: "COD",
      addressId: "address-1",
      restaurantInstructions: "Less spicy",
      deliveryInstructions: "Do not ring the bell; Dog at the gate",
      tipAmount: 50,
      items: [{ menuItemId: "item-1", quantity: 1 }],
    });
    expect(result.restaurantInstructions).toBe("Less spicy");
    expect(result.deliveryInstructions).toContain("Do not ring");
    expect(result.tipAmount).toBe(50);
    expect(createOrderSchema.safeParse({ ...result, tipAmount: 5001 }).success).toBe(false);
  });
  it("enforces the vendor order state machine", async () => {
    const { assertVendorStatusTransition } = await import("../controllers/orderController.js");
    expect(() => assertVendorStatusTransition("PENDING", "ACCEPTED")).not.toThrow();
    expect(() => assertVendorStatusTransition("ACCEPTED", "PREPARING")).not.toThrow();
    expect(() => assertVendorStatusTransition("PREPARING", "READY_FOR_PICKUP")).not.toThrow();
    expect(() => assertVendorStatusTransition("PENDING", "DELIVERED")).toThrow();
    expect(() => assertVendorStatusTransition("READY_FOR_PICKUP", "PREPARING")).toThrow();
  });

  it("builds a stable Razorpay refund idempotency key", async () => {
    const { buildRefundIdempotencyKey } = await import("../services/razorpayRefundService.js");
    expect(buildRefundIdempotencyKey("order-123")).toBe("cravzo_refund_order-123");
    expect(buildRefundIdempotencyKey("order-123")).toBe("cravzo_refund_order-123");
  });
});

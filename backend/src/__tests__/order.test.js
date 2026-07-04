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
});

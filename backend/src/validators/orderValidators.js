import { z } from "zod";

const paymentMethodSchema = z.enum(["COD", "CARD", "UPI"]);

const orderAddressSchema = z.object({
  label: z.string().trim().min(2).max(40).optional().nullable(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(15),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(4).max(12),
});

const orderItemSchema = z.object({
  menuItemId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
  size: z.string().trim().max(10).optional().nullable(),
});

const requireDeliveryAddress = (schema) =>
  schema.refine((value) => Boolean(value.addressId || value.address), {
    message: "A saved address or delivery address is required",
    path: ["address"],
  });

const orderPayloadSchema = z.object({
  restaurantId: z.string().trim().min(1),
  items: z.array(orderItemSchema).min(1).max(50),
  address: orderAddressSchema.optional().nullable(),
  addressId: z.string().trim().min(1).optional().nullable(),
  paymentMethod: paymentMethodSchema.default("UPI"),
  notes: z.string().trim().max(500).optional().nullable(),
});

const createOrderSchema = requireDeliveryAddress(orderPayloadSchema);

const createCheckoutOrderSchema = requireDeliveryAddress(
  orderPayloadSchema.extend({
    paymentMethod: z.enum(["CARD", "UPI"]).default("UPI"),
  }),
);

const verifyPaymentOrderSchema = requireDeliveryAddress(
  orderPayloadSchema
    .extend({
      paymentMethod: z.enum(["CARD", "UPI"]).default("UPI"),
      razorpayOrderId: z.string().trim().min(1),
      razorpayPaymentId: z.string().trim().min(1),
      razorpaySignature: z.string().trim().min(1),
    }),
);

export { createCheckoutOrderSchema, createOrderSchema, verifyPaymentOrderSchema };

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
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

const sideDishSelectionSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

const orderItemSchema = z.object({
  menuItemId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
  size: z.string().trim().max(10).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  selectedSideDishes: z.array(sideDishSelectionSchema).max(20).optional().nullable(),
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
  restaurantInstructions: z.string().trim().max(500).optional().nullable(),
  deliveryInstructions: z.string().trim().max(500).optional().nullable(),
  tipAmount: z.coerce.number().min(0).max(5000).default(0),
  couponCode: z.string().trim().min(1).max(50).transform((value) => value.toUpperCase()).optional().nullable(),
  referralVoucherCode: z
    .string()
    .trim()
    .min(4)
    .max(48)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid referral voucher code")
    .optional()
    .nullable(),
});

const createOrderSchema = requireDeliveryAddress(orderPayloadSchema);
const quoteOrderSchema = requireDeliveryAddress(orderPayloadSchema);

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

export { createCheckoutOrderSchema, createOrderSchema, quoteOrderSchema, verifyPaymentOrderSchema };


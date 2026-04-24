import { z } from "zod";

<<<<<<< HEAD
const bankDetailsSchema = z.object({
  accountHolderName: z.string().trim().min(2),
  bankName: z.string().trim().min(2),
  accountNumber: z.string().trim().min(6),
  ifsc: z.string().trim().min(4),
}).nullable();

const vehicleDetailsSchema = z.object({
  type: z.enum(["BICYCLE", "BIKE"]),
  registrationNumber: z.string().trim().min(4).nullable().optional(),
}).nullable();

const paymentMethodsSchema = z.object({
  upiIds: z.array(z.string().trim().min(3)).default([]),
}).nullable();

=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(10).max(15).nullable().optional(),
    avatarUrl: z.string().trim().url().nullable().optional(),
<<<<<<< HEAD
    bankDetails: bankDetailsSchema.optional(),
    vehicleDetails: vehicleDetailsSchema.optional(),
    paymentMethods: paymentMethodsSchema.optional(),
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field is required",
  });

export { updateProfileSchema };

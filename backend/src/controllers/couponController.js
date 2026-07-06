import { z } from "zod";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const createCouponSchema = z.object({
  code: z.string().trim().min(1).max(50).transform((v) => v.toUpperCase()),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.coerce.number().positive().max(100000),
  minOrderValue: z.coerce.number().positive().max(1000000).optional().nullable(),
  maxDiscount: z.coerce.number().positive().max(1000000).optional().nullable(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

const updateCouponSchema = z.object({
  discountType: z.enum(["PERCENTAGE", "FLAT"]).optional(),
  discountValue: z.coerce.number().positive().max(100000).optional(),
  minOrderValue: z.coerce.number().positive().max(1000000).optional().nullable(),
  maxDiscount: z.coerce.number().positive().max(1000000).optional().nullable(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

const serializeCoupon = (coupon) => ({
  id: coupon.id,
  code: coupon.code,
  discountType: coupon.discountType,
  discountValue: Number(coupon.discountValue),
  minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
  maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
  maxUses: coupon.maxUses,
  currentUses: coupon.currentUses,
  isActive: coupon.isActive,
  restaurantId: coupon.restaurantId,
  expiresAt: coupon.expiresAt,
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
});

const createCoupon = async (req, res) => {
  const payload = createCouponSchema.parse(req.body);
  const role = req.user.role;
  const isVendor = role === "VENDOR";
  const isAdmin = role === "ADMIN";

  let restaurantId = null;

  if (isVendor) {
    const restaurant = await prisma.restaurant.findFirst({
      where: { vendorId: req.user.sub },
    });
    if (!restaurant) {
      throw new ApiError(404, "No restaurant found for this vendor");
    }
    restaurantId = restaurant.id;
  }

  if (!isAdmin && !isVendor) {
    throw new ApiError(403, "Only vendors and admins can create coupons");
  }

  const existing = await prisma.coupon.findUnique({
    where: { code: payload.code },
  });
  if (existing) {
    throw new ApiError(409, "A coupon with this code already exists");
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: payload.code,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      minOrderValue: payload.minOrderValue ?? null,
      maxDiscount: payload.maxDiscount ?? null,
      maxUses: payload.maxUses ?? null,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      restaurantId,
    },
  });

  res.status(201).json(
    apiResponse({
      message: "Coupon created successfully",
      data: serializeCoupon(coupon),
    }),
  );
};

const listCoupons = async (req, res) => {
  const role = req.user.role;
  const where = {};

  if (role === "VENDOR") {
    const restaurant = await prisma.restaurant.findFirst({
      where: { vendorId: req.user.sub },
    });
    if (!restaurant) {
      return res.status(200).json(
        apiResponse({ message: "Coupons fetched successfully", data: [] }),
      );
    }
    where.restaurantId = restaurant.id;
  }

  const coupons = await prisma.coupon.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(
    apiResponse({
      message: "Coupons fetched successfully",
      data: coupons.map(serializeCoupon),
    }),
  );
};

const updateCoupon = async (req, res) => {
  const payload = updateCouponSchema.parse(req.body);
  const { couponId } = req.params;

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  if (req.user.role === "VENDOR") {
    const restaurant = await prisma.restaurant.findFirst({
      where: { vendorId: req.user.sub },
    });
    if (!restaurant || coupon.restaurantId !== restaurant.id) {
      throw new ApiError(403, "You do not have permission to update this coupon");
    }
  }

  const couponData = {
    ...(payload.discountType !== undefined && { discountType: payload.discountType }),
    ...(payload.discountValue !== undefined && { discountValue: payload.discountValue }),
    ...(payload.minOrderValue !== undefined && { minOrderValue: payload.minOrderValue }),
    ...(payload.maxDiscount !== undefined && { maxDiscount: payload.maxDiscount }),
    ...(payload.maxUses !== undefined && { maxUses: payload.maxUses }),
    ...(payload.isActive !== undefined && { isActive: payload.isActive }),
    ...(payload.expiresAt !== undefined && { expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null }),
  };

  const updated = await prisma.coupon.update({
    where: { id: couponId },
    data: couponData,
  });

  res.status(200).json(
    apiResponse({
      message: "Coupon updated successfully",
      data: serializeCoupon(updated),
    }),
  );
};

const deleteCoupon = async (req, res) => {
  const { couponId } = req.params;

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  if (req.user.role === "VENDOR") {
    const restaurant = await prisma.restaurant.findFirst({
      where: { vendorId: req.user.sub },
    });
    if (!restaurant || coupon.restaurantId !== restaurant.id) {
      throw new ApiError(403, "You do not have permission to delete this coupon");
    }
  }

  await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: false },
  });

  res.status(200).json(
    apiResponse({
      message: "Coupon deleted successfully",
      data: { couponId },
    }),
  );
};

const validateCoupon = async (req, res) => {
  const { code, subtotal, restaurantId } = req.body;

  if (!code) {
    throw new ApiError(400, "Coupon code is required");
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon) {
    return res.status(200).json(
      apiResponse({
        message: "Invalid coupon code",
        data: { valid: false, message: "Invalid coupon code" },
      }),
    );
  }

  if (!coupon.isActive) {
    return res.status(200).json(
      apiResponse({
        message: "This coupon is no longer active",
        data: { valid: false, message: "This coupon is no longer active" },
      }),
    );
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.status(200).json(
      apiResponse({
        message: "This coupon has expired",
        data: { valid: false, message: "This coupon has expired" },
      }),
    );
  }

  if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
    return res.status(200).json(
      apiResponse({
        message: "This coupon has reached its usage limit",
        data: { valid: false, message: "This coupon has reached its usage limit" },
      }),
    );
  }

  if (coupon.minOrderValue !== null && Number(subtotal) < Number(coupon.minOrderValue)) {
    return res.status(200).json(
      apiResponse({
        message: `Minimum order value of Rs ${Number(coupon.minOrderValue).toFixed(2)} required`,
        data: { valid: false, message: `Minimum order value of Rs ${Number(coupon.minOrderValue).toFixed(2)} required` },
      }),
    );
  }

  if (coupon.restaurantId && restaurantId && coupon.restaurantId !== restaurantId) {
    return res.status(200).json(
      apiResponse({
        message: "This coupon is not valid for this restaurant",
        data: { valid: false, message: "This coupon is not valid for this restaurant" },
      }),
    );
  }

  const serializedCoupon = {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
    maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
  };

  return res.status(200).json(
    apiResponse({
      message: "Coupon is valid",
      data: { valid: true, coupon: serializedCoupon },
    }),
  );
};

export { createCoupon, deleteCoupon, listCoupons, updateCoupon, validateCoupon };

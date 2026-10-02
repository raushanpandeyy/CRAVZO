import { z } from "zod";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// ── Validators ────────────────────────────────────────────────────────────────
const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/i, "Code can only contain letters, numbers, hyphens, underscores")
    .transform((v) => v.toUpperCase()),
  label:         z.string().trim().min(1).max(120),
  discountType:  z.enum(["FLAT", "FREE_DELIVERY", "PERCENTAGE"]),
  discountValue: z.coerce.number().positive().max(100000),
  minOrderValue: z.coerce.number().positive().max(1000000).optional().nullable(),
  maxDiscount:   z.coerce.number().positive().max(1000000).optional().nullable(),
  maxUses:       z.coerce.number().int().positive().optional().nullable(),
  perUserLimit:  z.coerce.number().int().min(1).max(100).default(1),
  startsAt:      z.string().datetime().optional().nullable(),
  expiresAt:     z.string().datetime().optional().nullable(),
});

const updateSchema = z.object({
  label:         z.string().trim().min(1).max(120).optional(),
  discountType:  z.enum(["FLAT", "FREE_DELIVERY", "PERCENTAGE"]).optional(),
  discountValue: z.coerce.number().positive().max(100000).optional(),
  minOrderValue: z.coerce.number().positive().max(1000000).optional().nullable(),
  maxDiscount:   z.coerce.number().positive().max(1000000).optional().nullable(),
  maxUses:       z.coerce.number().int().positive().optional().nullable(),
  perUserLimit:  z.coerce.number().int().min(1).max(100).optional(),
  isActive:      z.boolean().optional(),
  startsAt:      z.string().datetime().optional().nullable(),
  expiresAt:     z.string().datetime().optional().nullable(),
});

// ── Serializer ────────────────────────────────────────────────────────────────
const serialize = (p) => ({
  id:            p.id,
  code:          p.code,
  label:         p.label,
  discountType:  p.discountType,
  discountValue: Number(p.discountValue),
  minOrderValue: p.minOrderValue  ? Number(p.minOrderValue)  : null,
  maxDiscount:   p.maxDiscount    ? Number(p.maxDiscount)    : null,
  maxUses:       p.maxUses,
  currentUses:   p.currentUses,
  perUserLimit:  p.perUserLimit,
  isActive:      p.isActive,
  startsAt:      p.startsAt  ?? null,
  expiresAt:     p.expiresAt ?? null,
  createdAt:     p.createdAt,
  updatedAt:     p.updatedAt,
});

// ── GET /admin/promo-codes ─────────────────────────────────────────────────────
export const listPromoCodes = async (req, res) => {
  const { status, page = "1", limit = "50" } = req.query;

  const now = new Date();
  let where = {};

  if (status === "active") {
    where = {
      isActive:  true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
  } else if (status === "expired") {
    where = { expiresAt: { lte: now } };
  } else if (status === "inactive") {
    where = { isActive: false };
  }

  const take = Math.min(Number(limit) || 50, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [codes, total] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.promoCode.count({ where }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Promo codes fetched",
      data: {
        codes:  codes.map(serialize),
        total,
        page:   Number(page),
        limit:  take,
        pages:  Math.ceil(total / take),
      },
    })
  );
};

// ── GET /admin/promo-codes/:id ─────────────────────────────────────────────────
export const getPromoCode = async (req, res) => {
  const { id } = req.params;

  const promo = await prisma.promoCode.findUnique({
    where: { id },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

  if (!promo) throw new ApiError(404, "Promo code not found");

  // Recent redemptions for the detail view
  const recent = await prisma.promoCodeRedemption.findMany({
    where:   { promoCodeId: id },
    orderBy: { redeemedAt: "desc" },
    take:    20,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Promo code fetched",
      data: {
        ...serialize(promo),
        totalRedemptions: promo._count.redemptions,
        recentRedemptions: recent.map((r) => ({
          id:         r.id,
          redeemedAt: r.redeemedAt,
          orderId:    r.orderId,
          user: {
            id:    r.user.id,
            name:  r.user.name,
            email: r.user.email,
            phone: r.user.phone,
          },
        })),
      },
    })
  );
};

// ── POST /admin/promo-codes ────────────────────────────────────────────────────
export const createPromoCode = async (req, res) => {
  const payload = createSchema.parse(req.body);

  // Validate: PERCENTAGE must have a maxDiscount cap to prevent runaway discounts
  if (payload.discountType === "PERCENTAGE" && !payload.maxDiscount) {
    throw new ApiError(400, "Percentage discount requires a maxDiscount cap");
  }

  const existing = await prisma.promoCode.findUnique({
    where: { code: payload.code },
  });
  if (existing) throw new ApiError(409, `Code "${payload.code}" already exists`);

  const promo = await prisma.promoCode.create({
    data: {
      code:          payload.code,
      label:         payload.label,
      discountType:  payload.discountType,
      discountValue: payload.discountValue,
      minOrderValue: payload.minOrderValue ?? null,
      maxDiscount:   payload.maxDiscount   ?? null,
      maxUses:       payload.maxUses       ?? null,
      perUserLimit:  payload.perUserLimit  ?? 1,
      startsAt:      payload.startsAt  ? new Date(payload.startsAt)  : null,
      expiresAt:     payload.expiresAt ? new Date(payload.expiresAt) : null,
      createdBy:     req.user.sub,
    },
  });

  res.status(201).json(
    apiResponse({ message: "Promo code created", data: serialize(promo) })
  );
};

// ── PATCH /admin/promo-codes/:id ───────────────────────────────────────────────
export const updatePromoCode = async (req, res) => {
  const { id } = req.params;
  const payload = updateSchema.parse(req.body);

  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Promo code not found");

  const newType = payload.discountType ?? existing.discountType;
  const newMaxDiscount = payload.maxDiscount !== undefined
    ? payload.maxDiscount
    : existing.maxDiscount;

  if (newType === "PERCENTAGE" && !newMaxDiscount) {
    throw new ApiError(400, "Percentage discount requires a maxDiscount cap");
  }

  const updated = await prisma.promoCode.update({
    where: { id },
    data: {
      ...payload,
      startsAt:  payload.startsAt  !== undefined
        ? (payload.startsAt  ? new Date(payload.startsAt)  : null)
        : undefined,
      expiresAt: payload.expiresAt !== undefined
        ? (payload.expiresAt ? new Date(payload.expiresAt) : null)
        : undefined,
      updatedAt: new Date(),
    },
  });

  res.status(200).json(
    apiResponse({ message: "Promo code updated", data: serialize(updated) })
  );
};

// ── DELETE /admin/promo-codes/:id ──────────────────────────────────────────────
export const deletePromoCode = async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Promo code not found");

  // Soft-delete: just deactivate if it has redemptions (preserve history)
  if (existing.currentUses > 0) {
    await prisma.promoCode.update({
      where: { id },
      data:  { isActive: false, updatedAt: new Date() },
    });
    return res.status(200).json(
      apiResponse({ message: "Promo code deactivated (has redemptions, not deleted)", data: null })
    );
  }

  await prisma.promoCode.delete({ where: { id } });
  res.status(200).json(apiResponse({ message: "Promo code deleted", data: null }));
};

// ── GET /admin/promo-codes/stats ───────────────────────────────────────────────
export const getPromoCodeStats = async (req, res) => {
  const now = new Date();

  const [total, active, expired, totalRedemptions] = await Promise.all([
    prisma.promoCode.count(),
    prisma.promoCode.count({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.promoCode.count({ where: { expiresAt: { lte: now } } }),
    prisma.promoCodeRedemption.count(),
  ]);

  // Top 5 most used
  const topCodes = await prisma.promoCode.findMany({
    where:   { currentUses: { gt: 0 } },
    orderBy: { currentUses: "desc" },
    take:    5,
    select:  { code: true, label: true, currentUses: true, discountType: true, discountValue: true },
  });

  res.status(200).json(
    apiResponse({
      message: "Promo code stats fetched",
      data: {
        total,
        active,
        expired,
        inactive: total - active - expired,
        totalRedemptions,
        topCodes: topCodes.map((c) => ({
          ...c,
          discountValue: Number(c.discountValue),
        })),
      },
    })
  );
};

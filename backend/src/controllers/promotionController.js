import { z } from "zod";

import { prisma } from "../config/database.js";
import { apiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { getCache, setCache, deleteCache } from "../utils/cache.js";
import { parsePagination } from "../utils/adminHelpers.js";

const CACHE_TTL = 120;
const CACHE_KEY = "public:dish-promotions";

const createSchema = z.object({
  referenceType: z.enum(["dish", "free_delivery"]),
  referenceId: z.string().trim().min(1),
});

const updateSchema = createSchema.partial();

export async function resolvePromotionRecord(promo) {
  if (promo.referenceType === "dish") {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: promo.referenceId },
      include: { restaurant: { select: { name: true } } },
    });
    if (!menuItem) return null;
    return {
      id: promo.id,
      imageUrl: menuItem.imageUrl || "",
      title: menuItem.name,
      subtitle: menuItem.restaurant.name,
      linkType: "dish",
      linkValue: menuItem.name,
      position: promo.position,
      isActive: promo.isActive,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
    };
  }

    if (promo.referenceType === "free_delivery") {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: promo.referenceId },
      select: { name: true, imageUrl: true, city: true, id: true },
    });
    if (!restaurant) return null;
    return {
      id: promo.id,
      imageUrl: restaurant.imageUrl || "",
      title: restaurant.name,
      subtitle: "Free Delivery",
      linkType: "restaurant",
      linkValue: restaurant.id,
      position: promo.position,
      isActive: promo.isActive,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
    };
  }

  return null;
}

export const getActivePromotions = async (req, res) => {
  const cached = await getCache(CACHE_KEY);
  if (cached) {
    return res.status(200).json(apiResponse({ data: cached, message: "Promotions fetched" }));
  }

  const promotions = await prisma.dishPromotion.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });

  const resolved = (await Promise.all(promotions.map(resolvePromotionRecord))).filter(Boolean);

  await setCache(CACHE_KEY, resolved, CACHE_TTL);

  return res.status(200).json(apiResponse({ data: resolved, message: "Promotions fetched" }));
};

export const listPromotions = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [promotions, total] = await Promise.all([
    prisma.dishPromotion.findMany({
      orderBy: { position: "asc" },
      skip,
      take: limit,
    }),
    prisma.dishPromotion.count(),
  ]);

  const resolved = (await Promise.all(promotions.map(resolvePromotionRecord))).filter(Boolean);

  return res.status(200).json(
    apiResponse({
      data: resolved,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }),
  );
};

export const createPromotion = async (req, res) => {
  const data = createSchema.parse(req.body);

  if (data.referenceType === "dish") {
    const item = await prisma.menuItem.findUnique({ where: { id: data.referenceId }, select: { id: true } });
    if (!item) throw new ApiError(404, "MenuItem not found");
  } else {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: data.referenceId }, select: { id: true } });
    if (!restaurant) throw new ApiError(404, "Restaurant not found");
  }

  const maxPosition = await prisma.dishPromotion.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const promotion = await prisma.dishPromotion.create({
    data: {
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      position: (maxPosition?.position ?? -1) + 1,
    },
  });

  await deleteCache(CACHE_KEY);

  return res.status(201).json(apiResponse({ data: promotion, message: "Promotion created" }));
};

export const updatePromotion = async (req, res) => {
  const { id } = req.params;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.dishPromotion.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Promotion not found");

  if (data.referenceType === "dish" && data.referenceId) {
    const item = await prisma.menuItem.findUnique({ where: { id: data.referenceId }, select: { id: true } });
    if (!item) throw new ApiError(404, "MenuItem not found");
  } else if (data.referenceType === "free_delivery" && data.referenceId) {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: data.referenceId }, select: { id: true } });
    if (!restaurant) throw new ApiError(404, "Restaurant not found");
  }

  const promotion = await prisma.dishPromotion.update({
    where: { id },
    data: {
      ...(data.referenceType !== undefined && { referenceType: data.referenceType }),
      ...(data.referenceId !== undefined && { referenceId: data.referenceId }),
    },
  });

  await deleteCache(CACHE_KEY);

  return res.status(200).json(apiResponse({ data: promotion, message: "Promotion updated" }));
};

export const deletePromotion = async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.dishPromotion.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Promotion not found");

  await prisma.dishPromotion.delete({ where: { id } });

  await deleteCache(CACHE_KEY);

  return res.status(200).json(apiResponse({ message: "Promotion deleted" }));
};

export const updatePromotionsOrder = async (req, res) => {
  const { order } = req.body;

  if (!Array.isArray(order)) {
    throw new ApiError(400, "Order must be an array of { id, position }");
  }

  await prisma.$transaction(
    order.map((item) =>
      prisma.dishPromotion.update({
        where: { id: item.id },
        data: { position: item.position },
      }),
    ),
  );

  await deleteCache(CACHE_KEY);

  return res.status(200).json(apiResponse({ message: "Promotions order updated" }));
};

import { prisma } from "../config/database.js";
import { apiResponse } from "../utils/apiResponse.js";
import { getCache, setCache, deleteCache, mgetCache } from "../utils/cache.js";
import { resolvePromotionsBatch } from "./promotionController.js";
import { PROMOTIONS_CACHE_TTL_SECONDS } from "../utils/publicCache.js";

// Fix 2: Removed duplicate `new PrismaClient()` — was creating a second connection
// pool (+20 DB connections) on top of the singleton in config/database.js

const CACHE_TTL = 300;

const CACHE_KEYS = {
  FEATURED: "public:featured-restaurants",
  ADS: "public:ads",
  PROMOTIONS: "public:dish-promotions",
};

const invalidateFeaturedCache = async () => {
  await deleteCache(CACHE_KEYS.FEATURED);
};

const invalidateAdsCache = async () => {
  await deleteCache(CACHE_KEYS.ADS);
};

export const getHomeData = async (req, res) => {
  const keys = [CACHE_KEYS.PROMOTIONS];
  const cached = await mgetCache(keys);
  let promotions = cached[CACHE_KEYS.PROMOTIONS];

  if (!promotions) {
    const promos = await prisma.dishPromotion.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    });
    promotions = await resolvePromotionsBatch(promos);
    await setCache(CACHE_KEYS.PROMOTIONS, promotions, PROMOTIONS_CACHE_TTL_SECONDS);
  }

  return res.status(200).json(
    apiResponse({ data: { promotions }, message: "Home data fetched successfully" })
  );
};

export const getFeaturedRestaurants = async (req, res) => {
  const cacheKey = CACHE_KEYS.FEATURED;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res
      .status(200)
      .json(apiResponse({ data: cached, message: "Featured restaurants fetched successfully" }));
  }

  const featured = await prisma.featuredRestaurant.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: {
      id: true,
      restaurantId: true,
      name: true,
      imageUrl: true,
      position: true,
    },
  });

  const result = featured;

  await setCache(cacheKey, result, CACHE_TTL);

  return res
    .status(200)
    .json(apiResponse({ data: result, message: "Featured restaurants fetched successfully" }));
};

export const getAds = async (req, res) => {
  const cacheKey = CACHE_KEYS.ADS;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json(apiResponse({ data: cached, message: "Ads fetched successfully" }));
  }

  const ads = await prisma.ad.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: {
      id: true,
      imageUrl: true,
      link: true,
      position: true,
    },
  });

  await setCache(cacheKey, ads, CACHE_TTL);

  return res.status(200).json(apiResponse({ data: ads, message: "Ads fetched successfully" }));
};

export const addFeaturedRestaurant = async (req, res) => {
  const { restaurantId, name } = req.body;

  if (!restaurantId || !name) {
    return res.status(400).json(apiResponse({ message: "Restaurant ID and name are required" }));
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { imageUrl: true },
  });

  const maxPosition = await prisma.featuredRestaurant.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const featured = await prisma.featuredRestaurant.create({
    data: {
      restaurantId,
      name,
      imageUrl: restaurant?.imageUrl || null,
      position: (maxPosition?.position ?? -1) + 1,
    },
  });

  await invalidateFeaturedCache();

  return res
    .status(201)
    .json(apiResponse({ data: featured, message: "Restaurant added to featured successfully" }));
};

export const removeFeaturedRestaurant = async (req, res) => {
  const { id } = req.params;

  await prisma.featuredRestaurant.delete({
    where: { id },
  });

  await invalidateFeaturedCache();

  return res.status(200).json(apiResponse({ message: "Restaurant removed from featured" }));
};

export const updateFeaturedRestaurantsOrder = async (req, res) => {
  const { order } = req.body;

  if (!Array.isArray(order)) {
    return res.status(400).json(apiResponse({ message: "Order must be an array" }));
  }

  if (order.length > 0) {
    const entries = order.map(({ id }, index) => ({ id, position: index }));
    const placeholders = entries.map((_, i) => `$${i * 2 + 1}::text, $${i * 2 + 2}::int`);
    await prisma.$executeRawUnsafe(
      `UPDATE "FeaturedRestaurant"
       SET position = v.position
       FROM (VALUES ${placeholders.join(", ")}) AS v(id, position)
       WHERE "FeaturedRestaurant".id = v.id`,
      ...entries.flatMap((e) => [e.id, e.position]),
    );
  }

  await invalidateFeaturedCache();

  return res
    .status(200)
    .json(apiResponse({ message: "Featured restaurants order updated" }));
};

export const addAd = async (req, res) => {
  const { imageUrl, link } = req.body;

  if (!imageUrl) {
    return res.status(400).json(apiResponse({ message: "Image URL is required" }));
  }

  const maxPosition = await prisma.ad.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const ad = await prisma.ad.create({
    data: {
      imageUrl,
      link: link || "",
      position: (maxPosition?.position ?? -1) + 1,
    },
  });

  await invalidateAdsCache();

  return res.status(201).json(apiResponse({ data: ad, message: "Ad added successfully" }));
};

export const removeAd = async (req, res) => {
  const { id } = req.params;

  await prisma.ad.delete({
    where: { id },
  });

  await invalidateAdsCache();

  return res.status(200).json(apiResponse({ message: "Ad removed successfully" }));
};

export const updateAdsOrder = async (req, res) => {
  const { order } = req.body;

  if (!Array.isArray(order)) {
    return res.status(400).json(apiResponse({ message: "Order must be an array" }));
  }

  if (order.length > 0) {
    const entries = order.map(({ id }, index) => ({ id, position: index }));
    const placeholders = entries.map((_, i) => `$${i * 2 + 1}::text, $${i * 2 + 2}::int`);
    await prisma.$executeRawUnsafe(
      `UPDATE "Ad"
       SET position = v.position
       FROM (VALUES ${placeholders.join(", ")}) AS v(id, position)
       WHERE "Ad".id = v.id`,
      ...entries.flatMap((e) => [e.id, e.position]),
    );
  }

  await invalidateAdsCache();

  return res.status(200).json(apiResponse({ message: "Ads order updated" }));
};
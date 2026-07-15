import { prisma } from "../config/database.js";
import { connectRedis } from "../config/redis.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { emitRiderLocationUpdate } from "../services/orderSocketService.js";

const RIDER_GEO_KEY = "rider:geo";

const updateRiderGeo = async (riderId, lat, lng) => {
  try {
    const client = await connectRedis();
    if (client?.isOpen || client?.isReady) {
      await client.geoAdd(RIDER_GEO_KEY, { longitude: lng, latitude: lat, member: riderId });
    }
  } catch {
    // non-critical
  }
};

const toOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const updateRiderStatus = async (req, res) => {
  if (typeof req.body.isOnline !== "boolean") {
    throw new ApiError(400, "isOnline must be true or false");
  }

  const isOnline = req.body.isOnline;

  const [rider] = await Promise.all([
    prisma.user.update({
      where: { id: req.user.sub },
      data: { isOnline },
    }),
    isOnline
      ? Promise.resolve()
      : (async () => {
          try {
            const client = await connectRedis();
            if (client?.isOpen) {
              await client.zRem(RIDER_GEO_KEY, req.user.sub);
            }
          } catch {
            // non-critical
          }
        })(),
  ]);

  res.status(200).json(
    apiResponse({
      message: `Rider is now ${rider.isOnline ? "online" : "offline"}`,
      data: {
        id: rider.id,
        isOnline: rider.isOnline,
      },
    }),
  );
};

export const updateRiderLocation = async (req, res) => {
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  const accuracy = toOptionalNumber(req.body.accuracy);
  const heading = toOptionalNumber(req.body.heading);
  const speed = toOptionalNumber(req.body.speed);
  const timestamp = toOptionalNumber(req.body.timestamp);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError(400, "latitude and longitude are required");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new ApiError(400, "latitude or longitude is outside the valid range");
  }

  const updatedAt = new Date();

  const [rider, activeOrder] = await Promise.all([
    prisma.user.update({
      where: { id: req.user.sub },
      data: { latitude, longitude },
    }),
    prisma.order.findFirst({
      where: {
        riderId: req.user.sub,
        status: { in: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
      },
      include: { restaurant: { select: { vendorId: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    updateRiderGeo(req.user.sub, latitude, longitude),
  ]);

  if (activeOrder) {
    emitRiderLocationUpdate(activeOrder, { latitude, longitude, accuracy, heading, speed, timestamp, updatedAt });
  }

  res.status(200).json(
    apiResponse({
      message: "Rider location updated",
      data: {
        id: rider.id,
        latitude: rider.latitude,
        longitude: rider.longitude,
        accuracy,
        heading,
        speed,
        timestamp,
        updatedAt: rider.updatedAt,
      },
    }),
  );
};
export const getRiderEarnings = async (req, res) => {
  const riderId = req.user.sub;

  const orders = await prisma.order.findMany({
    where: { riderId, status: "DELIVERED" },
    select: {
      id: true,
      deliveryFee: true,
      tipAmount: true,
      createdAt: true,
      deliveredAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const orderEarning = (order) => Number(order.deliveryFee || 0) + Number(order.tipAmount || 0);
  const totalTips = orders.reduce((sum, order) => sum + Number(order.tipAmount || 0), 0);
  const totalEarnings = orders.reduce((sum, order) => sum + orderEarning(order), 0);
  const todayEarnings = orders
    .filter((o) => new Date(o.createdAt) >= today)
    .reduce((sum, order) => sum + orderEarning(order), 0);
  const weekEarnings = orders
    .filter((o) => new Date(o.createdAt) >= weekStart)
    .reduce((sum, order) => sum + orderEarning(order), 0);
  const monthEarnings = orders
    .filter((o) => new Date(o.createdAt) >= monthStart)
    .reduce((sum, order) => sum + orderEarning(order), 0);

  const totalDeliveries = orders.length;
  const todayDeliveries = orders.filter((o) => new Date(o.createdAt) >= today).length;

  res.status(200).json(
    apiResponse({
      data: {
        totalEarnings,
        totalTips,
        todayEarnings,
        weekEarnings,
        monthEarnings,
        totalDeliveries,
        todayDeliveries,
        recentOrders: orders.slice(0, 20),
      },
    }),
  );
};

export const getRiderStats = async (req, res) => {
  const riderId = req.user.sub;

  const [totalOrders, activeDeliveries, ratings] = await Promise.all([
    prisma.order.count({ where: { riderId } }),
    prisma.order.count({
      where: {
        riderId,
        status: { in: ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
      },
    }),
    prisma.riderRating.aggregate({
      where: { riderId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  res.status(200).json(
    apiResponse({
      data: {
        totalOrders,
        activeDeliveries,
        averageRating: ratings._avg.rating || 0,
        totalRatings: ratings._count || 0,
      },
    }),
  );
};

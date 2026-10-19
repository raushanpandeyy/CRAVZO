import { prisma } from "../config/database.js";
import { connectRedis } from "../config/redis.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { emitRiderLocationUpdate } from "../services/orderSocketService.js";
import { endGig } from "../services/gigService.js";

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

  // If rider is going offline, auto-end any active gig (marked as ended early)
  if (!isOnline) {
    await endGig(req.user.sub, { endedEarly: true });
  }

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Run all aggregates in parallel — let DB compute sums, not JS
  const [
    totalEarningsAgg,
    totalTipsAgg,
    todayEarningsAgg,
    weekEarningsAgg,
    monthEarningsAgg,
    totalDeliveries,
    todayDeliveries,
    compensatedCancellations,
    recentOrders,
  ] = await Promise.all([
    // Total delivered earnings (deliveryFee + tip)
    prisma.order.aggregate({
      where: { riderId, status: "DELIVERED" },
      _sum: { deliveryFee: true, tipAmount: true },
    }),
    // Total tips only
    prisma.order.aggregate({
      where: { riderId, status: "DELIVERED" },
      _sum: { tipAmount: true },
    }),
    // Today earnings (delivered)
    prisma.order.aggregate({
      where: { riderId, status: "DELIVERED", deliveredAt: { gte: today } },
      _sum: { deliveryFee: true, tipAmount: true },
    }),
    // Week earnings
    prisma.order.aggregate({
      where: { riderId, status: "DELIVERED", deliveredAt: { gte: weekStart } },
      _sum: { deliveryFee: true, tipAmount: true },
    }),
    // Month earnings
    prisma.order.aggregate({
      where: { riderId, status: "DELIVERED", deliveredAt: { gte: monthStart } },
      _sum: { deliveryFee: true, tipAmount: true },
    }),
    // Total deliveries count
    prisma.order.count({ where: { riderId, status: "DELIVERED" } }),
    // Today deliveries count
    prisma.order.count({ where: { riderId, status: "DELIVERED", deliveredAt: { gte: today } } }),
    // Compensated cancellations
    prisma.order.count({
      where: { cancelledRiderId: riderId, status: "CANCELLED", riderCancellationEarning: { gt: 0 } },
    }),
    // Last 30 orders for history display
    prisma.order.findMany({
      where: {
        OR: [
          { riderId, status: "DELIVERED" },
          { cancelledRiderId: riderId, status: "CANCELLED", riderCancellationEarning: { gt: 0 } },
        ],
      },
      select: {
        id: true,
        status: true,
        deliveryFee: true,
        tipAmount: true,
        riderCancellationEarning: true,
        createdAt: true,
        deliveredAt: true,
        cancelledAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const sum = (agg) =>
    Number(agg._sum.deliveryFee || 0) + Number(agg._sum.tipAmount || 0);

  const orderEarning = (order) =>
    order.status === "CANCELLED"
      ? Number(order.riderCancellationEarning || 0)
      : Number(order.deliveryFee || 0) + Number(order.tipAmount || 0);

  res.status(200).json(
    apiResponse({
      data: {
        totalEarnings:            sum(totalEarningsAgg),
        totalTips:                Number(totalTipsAgg._sum.tipAmount || 0),
        todayEarnings:            sum(todayEarningsAgg),
        weekEarnings:             sum(weekEarningsAgg),
        monthEarnings:            sum(monthEarningsAgg),
        totalDeliveries,
        todayDeliveries,
        compensatedCancellations,
        recentOrders:             recentOrders.map((o) => ({ ...o, earning: orderEarning(o) })),
      },
    }),
  );
      },
    }),
  );
};
export const getRiderStats = async (req, res) => {
  const riderId = req.user.sub;

  const [totalOrders, activeDeliveries, ratings] = await Promise.all([
    prisma.order.count({ where: { OR: [{ riderId }, { cancelledRiderId: riderId }] } }),
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

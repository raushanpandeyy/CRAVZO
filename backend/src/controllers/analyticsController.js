import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const getVendorAnalytics = async (req, res) => {
  const restaurant = await prisma.restaurant.findFirst({
    where: { vendorId: req.user.sub },
  });

  if (!restaurant) {
    throw new ApiError(404, "No restaurant found for this vendor");
  }

  const restaurantId = restaurant.id;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [deliveredOrders, allOrders, orderItems, hourlyOrders, statusCounts, revenueAgg] = await Promise.all([
    prisma.order.findMany({
      where: {
        restaurantId,
        status: "DELIVERED",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { id: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    prisma.order.findMany({
      where: { restaurantId },
      select: { id: true, totalAmount: true, status: true, createdAt: true },
    }),

    prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          status: "DELIVERED",
        },
      },
      include: {
        menuItem: { select: { id: true, name: true } },
        order: { select: { createdAt: true } },
      },
    }),

    prisma.$queryRaw`
      SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*)::int AS count
      FROM "Order"
      WHERE "restaurantId" = ${restaurantId}
        AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY hour
      ORDER BY hour
    `,

    prisma.order.groupBy({
      by: ["status"],
      where: { restaurantId },
      _count: { id: true },
    }),

    prisma.order.aggregate({
      where: { restaurantId, status: "DELIVERED" },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
  ]);

  const dailyRevenueMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailyRevenueMap[key] = { date: key, revenue: 0, orders: 0 };
  }
  for (const order of deliveredOrders) {
    const key = order.createdAt.toISOString().split("T")[0];
    if (dailyRevenueMap[key]) {
      dailyRevenueMap[key].revenue += Number(order.totalAmount);
      dailyRevenueMap[key].orders += 1;
    }
  }
  const dailyRevenue = Object.values(dailyRevenueMap);

  const weeklyRevenueMap = {};
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().split("T")[0];
    weeklyRevenueMap[key] = { weekStart: key, revenue: 0, orders: 0 };
  }
  for (const order of allOrders) {
    if (order.status !== "DELIVERED") continue;
    const d = new Date(order.createdAt);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().split("T")[0];
    if (weeklyRevenueMap[key]) {
      weeklyRevenueMap[key].revenue += Number(order.totalAmount);
      weeklyRevenueMap[key].orders += 1;
    }
  }
  const weeklyRevenue = Object.values(weeklyRevenueMap);

  const menuItemCounts = {};
  for (const oi of orderItems) {
    const id = oi.menuItemId;
    if (!menuItemCounts[id]) {
      menuItemCounts[id] = {
        menuItemId: id,
        name: oi.menuItem.name,
        count: 0,
        revenue: 0,
      };
    }
    menuItemCounts[id].count += oi.quantity;
    menuItemCounts[id].revenue += Number(oi.totalPrice);
  }
  const topDishes = Object.values(menuItemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const peakHours = (hourlyOrders || []).map((row) => ({
    hour: row.hour,
    count: Number(row.count),
  }));

  const statusBreakdown = {
    PENDING: 0,
    ACCEPTED: 0,
    PREPARING: 0,
    READY_FOR_PICKUP: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    REJECTED: 0,
  };
  for (const s of statusCounts) {
    statusBreakdown[s.status] = s._count.id;
  }

  const totalOrders = allOrders.length;
  const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);
  const totalDelivered = revenueAgg._count.id;
  const averageOrderValue = totalDelivered > 0 ? totalRevenue / totalDelivered : 0;

  res.status(200).json(
    apiResponse({
      message: "Vendor analytics fetched successfully",
      data: {
        dailyRevenue,
        weeklyRevenue,
        topDishes,
        peakHours,
        orderStatusBreakdown: statusBreakdown,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalDelivered,
      },
    }),
  );
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const resolveReportWindow = (range = "daily") => {
  const now = new Date();
  const endDate = addDays(startOfDay(now), 1);

  if (range === "total") {
    // All time — use a very early start date
    return { startDate: new Date("2020-01-01T00:00:00.000Z"), endDate, bucket: "month" };
  }

  if (range === "monthly") {
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 12);
    return { startDate, endDate, bucket: "month" };
  }

  if (range === "weekly") {
    return { startDate: addDays(endDate, -84), endDate, bucket: "week" };
  }

  return { startDate: addDays(endDate, -30), endDate, bucket: "day" };
};

const bucketKeyForDate = (date, bucket) => {
  const value = new Date(date);

  if (bucket === "month") {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }

  if (bucket === "week") {
    const day = value.getDay();
    const weekStart = startOfDay(value);
    weekStart.setDate(value.getDate() - day);
    return weekStart.toISOString().slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
};

const buildEmptyBuckets = (startDate, endDate, bucket) => {
  const buckets = [];
  const cursor = new Date(startDate);

  while (cursor < endDate) {
    const key = bucketKeyForDate(cursor, bucket);
    if (!buckets.some((entry) => entry.key === key)) {
      buckets.push({ key, label: key, sales: 0, orders: 0, cancelled: 0, rejected: 0 });
    }

    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
};

const getVendorReports = async (req, res) => {
  const restaurant = await prisma.restaurant.findFirst({
    where: { vendorId: req.user.sub },
    select: { id: true, name: true },
  });

  if (!restaurant) {
    throw new ApiError(404, "No restaurant found for this vendor");
  }

  const range = ["daily", "weekly", "monthly", "total"].includes(req.query.range)
    ? req.query.range
    : "daily";
  const { startDate, endDate, bucket } = resolveReportWindow(range);

  const where = {
    restaurantId: restaurant.id,
    createdAt: { gte: startDate, lt: endDate },
  };
  const deliveredWhere = { ...where, status: "DELIVERED" };

  const [orders, summary, statusCounts, itemRows, payoutAgg, totalPayoutAgg] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        subtotal: true,
        packagingFee: true,
        deliveryFee: true,
        platformFee: true,
        gatewayFee: true,
        codCharge: true,
        discount: true,
        totalTax: true,
        tipAmount: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.aggregate({
      where: deliveredWhere,
      _sum: {
        subtotal: true,
        packagingFee: true,
        deliveryFee: true,
        platformFee: true,
        gatewayFee: true,
        codCharge: true,
        discount: true,
        totalTax: true,
        tipAmount: true,
        totalAmount: true,
      },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
    prisma.orderItem.findMany({
      where: { order: deliveredWhere },
      select: {
        menuItemId: true,
        quantity: true,
        totalPrice: true,
        basePriceAtOrder: true,
        menuItem: {
          select: { id: true, name: true, category: true, imageUrl: true },
        },
      },
    }),
    // Payout for this range — sum of basePriceAtOrder × quantity
    prisma.orderItem.findMany({
      where: { order: deliveredWhere },
      select: { quantity: true, basePriceAtOrder: true, unitPrice: true },
    }),
    // Total all-time payout — always since beginning regardless of range
    prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId: restaurant.id,
          status: "DELIVERED",
        },
      },
      select: { quantity: true, basePriceAtOrder: true, unitPrice: true },
    }),
  ]);

  const bucketMap = new Map(
    buildEmptyBuckets(startDate, endDate, bucket).map((entry) => [entry.key, entry]),
  );

  for (const order of orders) {
    const key = bucketKeyForDate(order.createdAt, bucket);
    const entry = bucketMap.get(key);
    if (!entry) continue;

    if (order.status === "DELIVERED") {
      entry.sales += Number(order.totalAmount || 0);
      entry.orders += 1;
    } else if (order.status === "CANCELLED") {
      entry.cancelled += 1;
    } else if (order.status === "REJECTED") {
      entry.rejected += 1;
    }
  }

  const popularityMap = new Map();
  for (const row of itemRows) {
    const key = row.menuItemId;
    const current = popularityMap.get(key) || {
      menuItemId: key,
      name: row.menuItem?.name || "Menu item",
      category: row.menuItem?.category || "",
      imageUrl: row.menuItem?.imageUrl || null,
      unitsSold: 0,
      revenue: 0,
      payout: 0,
      orderLines: 0,
    };
    current.unitsSold += Number(row.quantity || 0);
    current.revenue += Number(row.totalPrice || 0);
    const bpao = row.basePriceAtOrder != null ? Number(row.basePriceAtOrder) : Number(row.unitPrice || 0);
    current.payout += bpao * Number(row.quantity || 0);
    current.orderLines += 1;
    popularityMap.set(key, current);
  }

  const menuPopularity = [...popularityMap.values()]
    .map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
      payout:  Math.round(item.payout  * 100) / 100,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);

  const rangePayout = payoutAgg.reduce((sum, row) => {
    const base = row.basePriceAtOrder != null ? Number(row.basePriceAtOrder) : Number(row.unitPrice || 0);
    return sum + base * Number(row.quantity || 0);
  }, 0);

  const totalAllTimePayout = totalPayoutAgg.reduce((sum, row) => {
    const base = row.basePriceAtOrder != null ? Number(row.basePriceAtOrder) : Number(row.unitPrice || 0);
    return sum + base * Number(row.quantity || 0);
  }, 0);

  const statusBreakdown = Object.fromEntries(
    statusCounts.map((entry) => [entry.status, entry._count.id]),
  );
  const deliveredCount = summary._count.id;
  const totalSales = Number(summary._sum.totalAmount || 0);

  res.status(200).json(
    apiResponse({
      message: "Vendor reports fetched successfully",
      data: {
        restaurant,
        range,
        bucket,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        summary: {
          totalSales: Math.round(totalSales * 100) / 100,
          deliveredOrders: deliveredCount,
          totalOrders: orders.length,
          averageOrderValue: deliveredCount ? Math.round((totalSales / deliveredCount) * 100) / 100 : 0,
          subtotal:    Number(summary._sum.subtotal    || 0),
          packagingFee:Number(summary._sum.packagingFee|| 0),
          deliveryFee: Number(summary._sum.deliveryFee || 0),
          platformFee: Number(summary._sum.platformFee || 0),
          gatewayFee:  Number(summary._sum.gatewayFee  || 0),
          codCharge:   Number(summary._sum.codCharge   || 0),
          discount:    Number(summary._sum.discount    || 0),
          tax:         Number(summary._sum.totalTax    || 0),
          tips:        Number(summary._sum.tipAmount   || 0),
          // Payout = what restaurant earns (basePriceAtOrder based)
          rangePayout:          Math.round(rangePayout          * 100) / 100,
          totalAllTimePayout:   Math.round(totalAllTimePayout   * 100) / 100,
        },
        salesTrend: [...bucketMap.values()].map((entry) => ({
          ...entry,
          sales: Math.round(entry.sales * 100) / 100,
        })),
        statusBreakdown,
        menuPopularity,
      },
    }),
  );
};

export { getVendorAnalytics, getVendorReports };




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
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

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

export { getVendorAnalytics };

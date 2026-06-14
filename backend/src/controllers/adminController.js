import { prisma } from "../config/database.js";
import { ROLES } from "../constants/roles.js";
import { apiResponse } from "../utils/apiResponse.js";
import { getCache, setCache } from "../utils/cache.js";
import { parsePagination, buildOrderFilters } from "../utils/adminHelpers.js";

const ADMIN_OVERVIEW_CACHE_KEY = "admin:overview";
import { ADMIN_OVERVIEW_CACHE_TTL_SECONDS } from "../utils/publicCache.js";

const ADMIN_OVERVIEW_CACHE_TTL = ADMIN_OVERVIEW_CACHE_TTL_SECONDS;

const getAdminOverview = async (req, res) => {
  const cached = await getCache(ADMIN_OVERVIEW_CACHE_KEY);
  if (cached) {
    return res.status(200).json(cached);
  }
  const { page, limit, skip } = parsePagination(req.query);
  const recentOrdersWhere = buildOrderFilters(req.query);

  const [
    totalUsers,
    activeUsers,
    totalCustomers,
    totalVendors,
    totalRiders,
    totalRestaurants,
    totalOrders,
    completedOrders,
    liveOrders,
    pendingVendors,
    pendingRiders,
    recentOrdersCount,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: ROLES.CUSTOMER } }),
    prisma.user.count({ where: { role: ROLES.VENDOR } }),
    prisma.user.count({ where: { role: ROLES.RIDER } }),
    prisma.restaurant.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({
      where: {
        status: {
          in: ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
        },
      },
    }),
    prisma.user.count({ where: { role: ROLES.VENDOR, status: "PENDING" } }),
    prisma.user.count({ where: { role: ROLES.RIDER, status: "PENDING" } }),
    prisma.order.count({
      where: recentOrdersWhere,
    }),
    prisma.order.findMany({
      where: recentOrdersWhere,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            vendor: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        address: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
  ]);

  const response = apiResponse({
    message: "Admin overview fetched successfully",
    data: {
      totals: {
        totalUsers,
        activeUsers,
        totalCustomers,
        totalVendors,
        totalRiders,
        totalRestaurants,
        totalOrders,
        completedOrders,
        liveOrders,
        pendingVendors,
        pendingRiders,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        deliveryFeeBase: Number(order.deliveryFeeBase),
        deliveryTax: Number(order.deliveryTax),
        packagingFee: Number(order.packagingFee),
        packagingFeeBase: Number(order.packagingFeeBase),
        packagingTax: Number(order.packagingTax),
        platformFee: Number(order.platformFee),
        platformFeeBase: Number(order.platformFeeBase),
        platformTax: Number(order.platformTax),
        gatewayFee: Number(order.gatewayFee),
        codCharge: Number(order.codCharge),
        discount: Number(order.discount),
        couponCode: order.couponCode,
        totalTax: Number(order.totalTax),
        totalAmount: Number(order.totalAmount),
        deliveryDistance: order.deliveryDistance ? Number(order.deliveryDistance) : null,
        createdAt: order.createdAt,
        customer: order.customer,
        restaurant: order.restaurant,
        rider: order.rider,
        items: order.items,
        address: order.address,
      })),
    },
    meta: {
      recentOrders: {
        page,
        limit,
        total: recentOrdersCount,
        totalPages: Math.ceil(recentOrdersCount / limit) || 1,
        from: req.query.from || null,
        to: req.query.to || null,
        status: req.query.status || null,
        paymentMethod: req.query.paymentMethod || null,
        paymentStatus: req.query.paymentStatus || null,
      },
    },
  });

  await setCache(ADMIN_OVERVIEW_CACHE_KEY, response, ADMIN_OVERVIEW_CACHE_TTL);
  res.status(200).json(response);
};

export { getAdminOverview };

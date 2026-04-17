import { prisma } from "../config/database.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { sanitizeUser } from "../utils/userResponse.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 25;

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const parseDateRange = (query) => {
  const createdAt = {};

  if (query.from) {
    const from = new Date(query.from);
    if (!Number.isNaN(from.getTime())) {
      createdAt.gte = from;
    }
  }

  if (query.to) {
    const to = new Date(query.to);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      createdAt.lte = to;
    }
  }

  return Object.keys(createdAt).length ? createdAt : undefined;
};

const buildOrderFilters = (query) => {
  const createdAt = parseDateRange(query);
  const where = {
    ...(createdAt ? { createdAt } : {}),
  };

  if (query.status?.trim()) {
    where.status = query.status.trim();
  }

  if (query.paymentMethod?.trim()) {
    where.paymentMethod = query.paymentMethod.trim();
  }

  if (query.paymentStatus?.trim()) {
    where.paymentStatus = query.paymentStatus.trim();
  }

  return Object.keys(where).length ? where : undefined;
};

const serializeSupportOrder = (order) => ({
  id: order.id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  totalAmount: Number(order.totalAmount),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  restaurant: order.restaurant
    ? {
        id: order.restaurant.id,
        name: order.restaurant.name,
        city: order.restaurant.city,
        vendor: order.restaurant.vendor
          ? {
              id: order.restaurant.vendor.id,
              name: order.restaurant.vendor.name,
              email: order.restaurant.vendor.email,
              phone: order.restaurant.vendor.phone,
            }
          : null,
      }
    : null,
  rider: order.rider
    ? {
        id: order.rider.id,
        name: order.rider.name,
        email: order.rider.email,
        phone: order.rider.phone,
      }
    : null,
  customer: order.customer
    ? {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      }
    : null,
  address: order.address,
  items: order.items?.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
    menuItem: item.menuItem
      ? {
          id: item.menuItem.id,
          name: item.menuItem.name,
        }
      : null,
  })),
});

const getPendingVendors = async (_req, res) => {
  const vendors = await prisma.user.findMany({
    where: {
      role: ROLES.VENDOR,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Pending vendors fetched successfully",
      data: vendors.map(sanitizeUser),
    }),
  );
};

const listUsers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = req.query.query?.trim();
  const role = req.query.role?.trim();
  const status = req.query.status?.trim();

  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Users fetched successfully",
      data: users.map(sanitizeUser),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }),
  );
};

const listRestaurants = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = req.query.query?.trim();
  const status = req.query.status?.trim();

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { state: { contains: search, mode: "insensitive" } },
            { vendor: { is: { name: { contains: search, mode: "insensitive" } } } },
            { vendor: { is: { email: { contains: search, mode: "insensitive" } } } },
            { vendor: { is: { phone: { contains: search } } } },
          ],
        }
      : {}),
  };

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.restaurant.count({ where }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Restaurants fetched successfully",
      data: restaurants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }),
  );
};

const updateRestaurantStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["ACTIVE", "INACTIVE", "REJECTED", "PENDING_APPROVAL", "DRAFT"];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid restaurant status");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: req.params.restaurantId,
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: {
      id: req.params.restaurantId,
    },
    data: {
      status,
      isOpen: status === "ACTIVE" ? restaurant.isOpen : false,
    },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  res.status(200).json(
    apiResponse({
      message: `Restaurant marked as ${status.toLowerCase()} successfully`,
      data: updatedRestaurant,
    }),
  );
};

const approveVendor = async (req, res) => {
  const vendor = await prisma.user.findFirst({
    where: {
      id: req.params.vendorId,
      role: ROLES.VENDOR,
    },
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  const updatedVendor = await prisma.user.update({
    where: { id: vendor.id },
    data: { status: "ACTIVE" },
  });

  res.status(200).json(
    apiResponse({
      message: "Vendor approved successfully",
      data: sanitizeUser(updatedVendor),
    }),
  );
};

const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["ACTIVE", "BLOCKED"];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.params.userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === ROLES.ADMIN) {
    throw new ApiError(403, "Admin accounts cannot be modified from this action");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: req.params.userId,
    },
    data: {
      status,
    },
  });

  res.status(200).json(
    apiResponse({
      message: `User marked as ${status.toLowerCase()} successfully`,
      data: sanitizeUser(updatedUser),
    }),
  );
};

const getPendingRiders = async (_req, res) => {
  const riders = await prisma.user.findMany({
    where: {
      role: ROLES.RIDER,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Pending riders fetched successfully",
      data: riders.map(sanitizeUser),
    }),
  );
};

const approveRider = async (req, res) => {
  const rider = await prisma.user.findFirst({
    where: {
      id: req.params.riderId,
      role: ROLES.RIDER,
    },
  });

  if (!rider) {
    throw new ApiError(404, "Rider not found");
  }

  const updatedRider = await prisma.user.update({
    where: { id: rider.id },
    data: { status: "ACTIVE" },
  });

  res.status(200).json(
    apiResponse({
      message: "Rider approved successfully",
      data: sanitizeUser(updatedRider),
    }),
  );
};

const getAdminOverview = async (req, res) => {
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
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
  ]);

  res.status(200).json(
    apiResponse({
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
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
          customer: order.customer,
          restaurant: order.restaurant,
          rider: order.rider,
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
    }),
  );
};

const searchUserSupportDetails = async (req, res) => {
  const query = req.query.query?.trim();

  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: query },
        { email: { equals: query, mode: "insensitive" } },
      ],
    },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      },
      restaurants: {
        orderBy: { createdAt: "desc" },
      },
      customerOrders: {
        include: {
          address: true,
          rider: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          restaurant: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      riderOrders: {
        include: {
          address: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          restaurant: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "No user found for that phone or email");
  }

  res.status(200).json(
    apiResponse({
      message: "User support details fetched successfully",
      data: {
        user: sanitizeUser(user),
        addresses: user.addresses,
        restaurants: user.restaurants,
        customerOrders: user.customerOrders.map(serializeSupportOrder),
        riderOrders: user.riderOrders.map(serializeSupportOrder),
      },
    }),
  );
};

export {
  approveRider,
  approveVendor,
  getAdminOverview,
  getPendingRiders,
  getPendingVendors,
  listRestaurants,
  listUsers,
  searchUserSupportDetails,
  updateRestaurantStatus,
  updateUserStatus,
};

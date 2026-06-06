import { prisma } from "../config/database.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { sanitizeUser } from "../utils/userResponse.js";
import { parsePagination, serializeSupportOrder } from "../utils/adminHelpers.js";

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

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
    };

    if (user.role === "VENDOR") {
      try {
        const restaurant = await prisma.restaurant.findFirst({
          where: { vendorId: user.id },
        });
        if (restaurant) {
          response.restaurant = {
            id: restaurant.id,
            name: restaurant.name,
            cuisine: restaurant.cuisine,
            phone: restaurant.phone,
            addressLine1: restaurant.addressLine1,
            city: restaurant.city,
            state: restaurant.state,
            status: restaurant.status,
            openDays: restaurant.openDays,
            openingTime: restaurant.openingTime,
            closingTime: restaurant.closingTime,
            fssaiNumber: restaurant.fssaiNumber,
            isOpen: restaurant.isOpen,
          };
        }
      } catch (err) {
        console.error("Restaurant fetch error:", err);
      }
    }

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("getUserDetails error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal error",
    });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    let orders = [];

    if (user.role === "CUSTOMER") {
      orders = await prisma.order.findMany({
        where: { customerId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          restaurant: { select: { id: true, name: true, phone: true } },
          rider: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: { select: { name: true } } } },
        },
      });
    } else if (user.role === "VENDOR") {
      const restaurantIds = await prisma.restaurant.findMany({
        where: { vendorId: userId },
        select: { id: true },
      });
      const rIds = restaurantIds.map(r => r.id);

      orders = await prisma.order.findMany({
        where: { restaurantId: { in: rIds } },
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          restaurant: { select: { id: true, name: true, phone: true } },
          rider: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: { select: { name: true } } } },
        },
      });
    } else if (user.role === "RIDER") {
      orders = await prisma.order.findMany({
        where: { riderId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          restaurant: { select: { id: true, name: true, phone: true } },
          rider: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: { select: { name: true } } } },
        },
      });
    }

    const serializedOrders = orders.map((order) => ({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      platformFee: order.platformFee,
      packagingFee: order.packagingFee,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryDistance: order.deliveryDistance,
      customer: order.customer,
      restaurant: order.restaurant,
      rider: order.rider,
      items: order.items.map((item) => ({
        quantity: item.quantity,
        price: item.price,
        menuItem: item.menuItem,
      })),
      vendorEarnings: order.vendorEarnings,
      riderEarnings: order.riderEarnings,
    }));

    res.status(200).json(apiResponse({ data: serializedOrders }));
  } catch (error) {
    console.error("getUserOrders error:", error);
    throw error;
  }
};

export {
  approveRider,
  approveVendor,
  getPendingRiders,
  getPendingVendors,
  getUserDetails,
  getUserOrders,
  listUsers,
  searchUserSupportDetails,
  updateUserStatus,
};

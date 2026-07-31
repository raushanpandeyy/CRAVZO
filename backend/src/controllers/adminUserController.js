import { prisma } from "../config/database.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { sanitizeUser } from "../utils/userResponse.js";
import { parsePagination, serializeSupportOrder } from "../utils/adminHelpers.js";


const userReferralSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  referralCode: true,
  createdAt: true,
};

const mapStatusCounts = (groups) =>
  groups.reduce(
    (acc, group) => ({ ...acc, [group.status.toLowerCase()]: group._count._all }),
    { pending: 0, otp_verified: 0, completed: 0, suspect: 0, cancelled: 0 },
  );

const serializeReferral = (referral) =>
  referral
    ? {
        id: referral.id,
        status: referral.status,
        bonusAmount: Number(referral.bonusAmount || 0),
        suspectFlag: referral.suspectFlag,
        suspectReason: referral.suspectReason,
        paidOrderId: referral.paidOrderId,
        createdAt: referral.createdAt,
        completedAt: referral.completedAt,
        referrer: referral.referrer || null,
        referred: referral.referred || null,
      }
    : null;

const serializeMilestone = (milestone) => ({
  id: milestone.id,
  tier: milestone.tier,
  rewardType: milestone.rewardType,
  rewardValue: Number(milestone.rewardValue || 0),
  voucherCode: milestone.voucherCode,
  status: milestone.status,
  expiresAt: milestone.expiresAt,
  issuedAt: milestone.issuedAt,
  redeemedAt: milestone.redeemedAt,
  redeemedOrderId: milestone.redeemedOrderId,
});

const getReferralAuditForUser = async (userId) => {
  const [received, made, madeCounts, milestones] = await Promise.all([
    prisma.referral.findUnique({
      where: { referredId: userId },
      include: { referrer: { select: userReferralSelect } },
    }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { referred: { select: userReferralSelect } },
    }),
    prisma.referral.groupBy({
      by: ["status"],
      where: { referrerId: userId },
      _count: { _all: true },
    }),
    prisma.referralMilestone.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      take: 25,
    }),
  ]);

  const counts = mapStatusCounts(madeCounts);

  return {
    received: serializeReferral(received),
    madeSummary: {
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      verified: counts.otp_verified + counts.completed,
      qualified: counts.completed,
      pending: counts.pending + counts.otp_verified,
      suspect: counts.suspect,
      cancelled: counts.cancelled,
    },
    made: made.map(serializeReferral),
    milestones: milestones.map(serializeMilestone),
  };
};

const getReferralListMetaForUsers = async (userIds) => {
  if (userIds.length === 0) return new Map();

  const [received, madeCounts] = await Promise.all([
    prisma.referral.findMany({
      where: { referredId: { in: userIds } },
      include: { referrer: { select: { id: true, name: true, email: true, phone: true } } },
    }),
    prisma.referral.groupBy({
      by: ["referrerId", "status"],
      where: { referrerId: { in: userIds } },
      _count: { _all: true },
    }),
  ]);

  const meta = new Map(userIds.map((id) => [id, {
    received: null,
    madeSummary: { total: 0, verified: 0, qualified: 0, suspect: 0 },
  }]));

  for (const referral of received) {
    meta.set(referral.referredId, {
      ...(meta.get(referral.referredId) || {}),
      received: serializeReferral(referral),
    });
  }

  for (const group of madeCounts) {
    const current = meta.get(group.referrerId) || { received: null, madeSummary: { total: 0, verified: 0, qualified: 0, suspect: 0 } };
    const count = group._count._all;
    current.madeSummary.total += count;
    if (["OTP_VERIFIED", "COMPLETED"].includes(group.status)) current.madeSummary.verified += count;
    if (group.status === "COMPLETED") current.madeSummary.qualified += count;
    if (group.status === "SUSPECT") current.madeSummary.suspect += count;
    meta.set(group.referrerId, current);
  }

  return meta;
};

const getPendingVendors = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [vendors, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: ROLES.VENDOR,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: { role: ROLES.VENDOR, status: "PENDING" },
    }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Pending vendors fetched successfully",
      data: vendors.map(sanitizeUser),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
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

  const referralMeta = await getReferralListMetaForUsers(users.map((user) => user.id));

  res.status(200).json(
    apiResponse({
      message: "Users fetched successfully",
      data: users.map((user) => ({
        ...sanitizeUser(user),
        referral: referralMeta.get(user.id) || {
          received: null,
          madeSummary: { total: 0, verified: 0, qualified: 0, suspect: 0 },
        },
      })),
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

const getPendingRiders = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [riders, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: ROLES.RIDER,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: { role: ROLES.RIDER, status: "PENDING" },
    }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Pending riders fetched successfully",
      data: riders.map(sanitizeUser),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
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

  const { page, limit } = parsePagination(req.query);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: query },
        { email: { equals: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      isOnline: true,
      createdAt: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "No user found for that phone or email");
  }

  const [addresses, restaurants, customerOrders, riderOrders] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.restaurant.findMany({
      where: { vendorId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        address: true,
        rider: { select: { id: true, name: true, email: true, phone: true } },
        restaurant: { include: { vendor: { select: { id: true, name: true, email: true, phone: true } } } },
        items: { include: { menuItem: true } },
      },
    }),
    prisma.order.findMany({
      where: { riderId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        address: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        restaurant: { include: { vendor: { select: { id: true, name: true, email: true, phone: true } } } },
        items: { include: { menuItem: true } },
      },
    }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "User support details fetched successfully",
      data: {
        user: sanitizeUser(user),
        addresses,
        restaurants,
        customerOrders: customerOrders.map(serializeSupportOrder),
        riderOrders: riderOrders.map(serializeSupportOrder),
      },
      meta: { page, limit },
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

    const referral = await getReferralAuditForUser(user.id);

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isOnline: user.isOnline,
      referralCode: user.referralCode,
      walletBalance: user.walletBalance,
      createdAt: user.createdAt,
      referral,
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
  const { userId } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let orders = [];
  let total = 0;

  if (user.role === "CUSTOMER") {
    [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          restaurant: { select: { id: true, name: true, phone: true } },
          rider: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: { select: { name: true } } } },
        },
      }),
      prisma.order.count({ where: { customerId: userId } }),
    ]);
  } else if (user.role === "VENDOR") {
    const restaurantIds = await prisma.restaurant.findMany({
      where: { vendorId: userId },
      select: { id: true },
    });
    const rIds = restaurantIds.map(r => r.id);

    [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { restaurantId: { in: rIds } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          restaurant: { select: { id: true, name: true, phone: true } },
          rider: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: { select: { name: true } } } },
        },
      }),
      prisma.order.count({ where: { restaurantId: { in: rIds } } }),
    ]);
  } else if (user.role === "RIDER") {
    [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { riderId: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          restaurant: { select: { id: true, name: true, phone: true } },
          rider: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: { select: { name: true } } } },
        },
      }),
      prisma.order.count({ where: { riderId: userId } }),
    ]);
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

  res.status(200).json(
    apiResponse({
      data: serializedOrders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }),
  );
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

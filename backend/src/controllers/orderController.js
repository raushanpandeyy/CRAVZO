import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { createPersistedOrder, serializeOrder } from "../services/orderCheckoutService.js";
import { notifyOrderCreated, notifyOrderStatusChanged, notifyRiderNewOrder, notifyVendorNewOrder } from "../services/notificationService.js";
import { logger } from "../utils/logger.js";
import { createOrderSchema } from "../validators/orderValidators.js";

const ACTIVE_DELIVERY_STATUSES = ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceKm = (startLat, startLng, endLat, endLng) => {
  const earthRadius = 6371;
  const deltaLat = toRadians(endLat - startLat);
  const deltaLng = toRadians(endLng - startLng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(startLat)) *
      Math.cos(toRadians(endLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeCity = (value) => value?.trim().toLowerCase() || "";

const runNotificationTask = (task) => {
  task.catch((error) => {
    logger.warn("Push notification task failed", { error });
  });
};

const createOrder = async (req, res) => {
  const { restaurantId, items, address = null, addressId = null, paymentMethod, notes = null } = createOrderSchema.parse(req.body);
  const order = await createPersistedOrder({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
    notes,
  });

  runNotificationTask(notifyOrderCreated(order));
  runNotificationTask(notifyVendorNewOrder(order));

  res.status(201).json(
    apiResponse({
      message: "Order created successfully",
      data: serializeOrder(order),
    }),
  );
};

const getMyOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      customerId: req.user?.sub,
    },
    include: {
      restaurant: true,
      address: true,
      rider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
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
  });

  res.status(200).json(
    apiResponse({
      message: "Customer orders fetched successfully",
      data: orders.map(serializeOrder),
    }),
  );
};

const getVendorOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      restaurant: {
        vendorId: req.user.sub,
      },
    },
    include: {
      restaurant: true,
      address: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      rider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
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
  });

  res.status(200).json(
    apiResponse({
      message: "Vendor orders fetched successfully",
      data: orders.map((order) => ({
        ...serializeOrder(order),
        customer: order.customer,
      })),
    }),
  );
};

const getRiderOrders = async (req, res) => {
  const rider = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: {
      id: true,
      isOnline: true,
      riderOnboarding: true,
    },
  });

  if (!rider) {
    throw new ApiError(404, "Rider not found");
  }

  const riderCity = rider.riderOnboarding?.city?.trim();
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { riderId: req.user.sub },
        {
          riderId: null,
          status: {
            in: ACTIVE_DELIVERY_STATUSES.filter((status) => status !== "OUT_FOR_DELIVERY"),
          },
          ...(riderCity
            ? {
                restaurant: {
                  city: {
                    equals: riderCity,
                    mode: "insensitive",
                  },
                },
              }
            : {}),
        },
      ],
    },
    include: {
      restaurant: true,
      address: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      rider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
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
  });

  const engagedRiderIds = new Set(
    (
      await prisma.order.findMany({
        where: {
          riderId: { not: null },
          status: { in: ACTIVE_DELIVERY_STATUSES },
        },
        select: { riderId: true },
      })
    )
      .map((entry) => entry.riderId)
      .filter(Boolean),
  );

  const candidateRiders = (await prisma.user.findMany({
    where: {
      role: "RIDER",
      status: "ACTIVE",
      isOnline: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      riderOnboarding: true,
    },
  })).filter((candidate) => {
    if (engagedRiderIds.has(candidate.id)) {
      return false;
    }

    if (!riderCity) {
      return true;
    }

    return normalizeCity(candidate.riderOnboarding?.city) === normalizeCity(riderCity);
  });

  const nearestRiderByOrderId = new Map();

  orders.forEach((order) => {
    if (order.riderId || !ACTIVE_DELIVERY_STATUSES.includes(order.status) || order.status === "OUT_FOR_DELIVERY") {
      return;
    }

    const restaurantLat = order.restaurant?.latitude;
    const restaurantLng = order.restaurant?.longitude;
    const orderCity = normalizeCity(order.restaurant?.city);
    const cityMatchedRiders = candidateRiders.filter((candidate) => {
      if (order.rejectedRiderIds?.includes(candidate.id)) {
        return false;
      }

      return orderCity ? normalizeCity(candidate.riderOnboarding?.city) === orderCity : true;
    });

    if (!cityMatchedRiders.length) {
      return;
    }

    if (typeof restaurantLat !== "number" || typeof restaurantLng !== "number") {
      nearestRiderByOrderId.set(order.id, cityMatchedRiders[0].id);
      return;
    }

    const nearest = cityMatchedRiders.reduce((bestMatch, candidate) => {
      const candidateDistance = getDistanceKm(restaurantLat, restaurantLng, candidate.latitude, candidate.longitude);

      if (!bestMatch || candidateDistance < bestMatch.distance) {
        return { id: candidate.id, distance: candidateDistance };
      }

      return bestMatch;
    }, null);

    if (nearest) {
      nearestRiderByOrderId.set(order.id, nearest.id);
    }
  });

  res.status(200).json(
    apiResponse({
      message: "Rider orders fetched successfully",
      data: orders.map((order) => ({
        ...serializeOrder(order),
        customer: order.customer,
        isAvailable:
          rider.isOnline &&
          !order.riderId &&
          ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status) &&
          !(order.rejectedRiderIds || []).includes(rider.id) &&
          (!nearestRiderByOrderId.has(order.id) || nearestRiderByOrderId.get(order.id) === rider.id),
        suggestedRiderId: nearestRiderByOrderId.get(order.id) || null,
      })),
    }),
  );
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = [
    "ACCEPTED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REJECTED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: {
      restaurant: true,
      address: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (req.user.role === "VENDOR" && order.restaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to update this order");
  }

  if (req.user.role === "CUSTOMER") {
    if (order.customerId !== req.user.sub) {
      throw new ApiError(403, "You do not have permission to update this order");
    }

    if (status !== "CANCELLED") {
      throw new ApiError(400, "Customer can only cancel orders");
    }

    if (!["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status)) {
      throw new ApiError(400, "This order can no longer be cancelled");
    }
  }

  if (req.user.role === "RIDER") {
    if (status === "REJECTED") {
      if (order.riderId === req.user.sub) {
        throw new ApiError(400, "Assigned rider cannot reject this order now");
      }

      if (!["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status)) {
        throw new ApiError(400, "This order is no longer available to reject");
      }

      const updatedOrder = await prisma.order.update({
        where: { id: req.params.orderId },
        data: {
          rejectedRiderIds: {
            push: req.user.sub,
          },
        },
        include: {
          restaurant: true,
          address: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          rider: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      res.status(200).json(
        apiResponse({
          message: "Order rejected successfully",
          data: {
            ...serializeOrder(updatedOrder),
            customer: updatedOrder.customer,
          },
        }),
      );
      runNotificationTask(
        notifyOrderStatusChanged({
          order: updatedOrder,
          actorRole: req.user.role,
        }),
      );
      return;
    }

    const canClaimOrder =
      !order.riderId &&
      ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status) &&
      status === order.status;
    const ownsOrder = order.riderId === req.user.sub;
    const hasAnotherActiveOrder =
      !ownsOrder &&
      (
        await prisma.order.count({
          where: {
            riderId: req.user.sub,
            id: { not: order.id },
            status: {
              in: ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
            },
          },
        })
      ) > 0;

    if (!req.user.isOnline) {
      throw new ApiError(403, "Go online before accepting orders");
    }

    if (hasAnotherActiveOrder) {
      throw new ApiError(409, "Complete your current delivery before taking another order");
    }

    if (!canClaimOrder && !ownsOrder) {
      throw new ApiError(403, "You do not have permission to update this order");
    }

    if (!canClaimOrder && !["OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
      throw new ApiError(400, "Rider can only accept, pick up, or deliver orders");
    }

    if (status === "OUT_FOR_DELIVERY" && order.status !== "READY_FOR_PICKUP") {
      throw new ApiError(400, "Pickup is available only after the restaurant marks the order ready");
    }

    if (status === "DELIVERED" && order.status !== "OUT_FOR_DELIVERY") {
      throw new ApiError(400, "Deliver the order only after pickup");
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id: req.params.orderId },
    data: {
      status,
      ...(req.user.role === "RIDER" && (status === order.status || status === "OUT_FOR_DELIVERY")
        ? { riderId: req.user.sub }
        : {}),
      ...(req.user.role === "RIDER" && status === order.status
        ? { rejectedRiderIds: [] }
        : {}),
      ...(status === "DELIVERED" ? { paymentStatus: "PAID" } : {}),
    },
    include: {
      restaurant: true,
      address: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      rider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  runNotificationTask(
    notifyOrderStatusChanged({
      order: updatedOrder,
      actorRole: req.user.role,
    }),
  );

  if (req.user.role === "RIDER" && (status === updatedOrder.status)) {
    runNotificationTask(
      notifyRiderNewOrder(updatedOrder),
    );
  }

  res.status(200).json(
    apiResponse({
      message: "Order status updated successfully",
      data: {
        ...serializeOrder(updatedOrder),
        customer: updatedOrder.customer,
      },
    }),
  );
};

export { createOrder, getMyOrders, getRiderOrders, getVendorOrders, updateOrderStatus };

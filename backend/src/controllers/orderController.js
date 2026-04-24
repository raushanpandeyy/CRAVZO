import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
<<<<<<< HEAD
import { createPersistedOrder, serializeOrder } from "../services/orderCheckoutService.js";

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

const createOrder = async (req, res) => {
  const { restaurantId, items = [], address = null, addressId = null, paymentMethod = "UPI", notes = null } = req.body;
  const order = await createPersistedOrder({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
    notes,
=======

const serializeOrder = (order) => ({
  id: order.id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  subtotal: Number(order.subtotal),
  deliveryFee: Number(order.deliveryFee),
  packagingFee: Number(order.packagingFee),
  taxAmount: Number(order.taxAmount),
  totalAmount: Number(order.totalAmount),
  notes: order.notes,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  restaurant: order.restaurant
    ? {
        id: order.restaurant.id,
        name: order.restaurant.name,
        imageUrl: order.restaurant.imageUrl,
        city: order.restaurant.city,
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
          imageUrl: item.menuItem.imageUrl,
        }
      : null,
  })),
});

const createOrder = async (req, res) => {
  const { restaurantId, items = [], address = null, addressId = null, paymentMethod = "COD", notes = null } = req.body;

  if (!restaurantId || items.length === 0) {
    throw new ApiError(400, "Restaurant and at least one item are required");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, status: "ACTIVE" },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((item) => item.menuItemId) },
      restaurantId,
      status: "ACTIVE",
    },
  });

  if (menuItems.length !== items.length) {
    throw new ApiError(400, "Some cart items are no longer available");
  }

  const subtotal = items.reduce((sum, item) => {
    const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
    return sum + Number(menuItem.price) * item.quantity;
  }, 0);

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const packagingFee = Number((subtotal * 0.03).toFixed(2));
  const taxAmount = Number((subtotal * 0.18).toFixed(2));
  const totalAmount = subtotal + deliveryFee + packagingFee + taxAmount;

  let resolvedAddressId = null;

  if (addressId) {
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: req.user.sub,
      },
    });

    if (!existingAddress) {
      throw new ApiError(404, "Saved address not found");
    }

    resolvedAddressId = existingAddress.id;
  } else if (address && address.fullName && address.phone && address.line1 && address.city && address.state && address.postalCode) {
    const createdAddress = await prisma.address.create({
      data: {
        userId: req.user.sub,
        label: address.label || "Delivery Address",
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 || null,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        isDefault: false,
      },
    });

    resolvedAddressId = createdAddress.id;
  }

  const order = await prisma.order.create({
    data: {
      customerId: req.user.sub,
      restaurantId,
      addressId: resolvedAddressId,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
      subtotal,
      deliveryFee,
      packagingFee,
      taxAmount,
      totalAmount,
      notes,
      items: {
        create: items.map((item) => {
          const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: Number(menuItem.price) * item.quantity,
          };
        }),
      },
    },
    include: {
      restaurant: true,
      address: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  });

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
<<<<<<< HEAD
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
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { riderId: req.user.sub },
<<<<<<< HEAD
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
=======
        { riderId: null, status: "READY_FOR_PICKUP" },
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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

<<<<<<< HEAD
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

=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  res.status(200).json(
    apiResponse({
      message: "Rider orders fetched successfully",
      data: orders.map((order) => ({
        ...serializeOrder(order),
        customer: order.customer,
<<<<<<< HEAD
        isAvailable:
          rider.isOnline &&
          !order.riderId &&
          ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status) &&
          !(order.rejectedRiderIds || []).includes(rider.id) &&
          (!nearestRiderByOrderId.has(order.id) || nearestRiderByOrderId.get(order.id) === rider.id),
        suggestedRiderId: nearestRiderByOrderId.get(order.id) || null,
=======
        isAvailable: !order.riderId && order.status === "READY_FOR_PICKUP",
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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

<<<<<<< HEAD
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
=======
  if (req.user.role === "RIDER") {
    const canClaimReadyOrder = !order.riderId && status === "OUT_FOR_DELIVERY" && order.status === "READY_FOR_PICKUP";
    const ownsOrder = order.riderId === req.user.sub;

    if (!canClaimReadyOrder && !ownsOrder) {
      throw new ApiError(403, "You do not have permission to update this order");
    }
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  }

  const updatedOrder = await prisma.order.update({
    where: { id: req.params.orderId },
    data: {
      status,
<<<<<<< HEAD
      ...(req.user.role === "RIDER" && (status === order.status || status === "OUT_FOR_DELIVERY")
        ? { riderId: req.user.sub }
        : {}),
      ...(req.user.role === "RIDER" && status === order.status
        ? { rejectedRiderIds: [] }
        : {}),
=======
      ...(req.user.role === "RIDER" && status === "OUT_FOR_DELIVERY" ? { riderId: req.user.sub } : {}),
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

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

import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { createPersistedOrder, serializeOrder } from "../services/orderCheckoutService.js";
import { queueNotification } from "../services/notificationQueue.js";
import { createOrderSchema } from "../validators/orderValidators.js";

const ACTIVE_DELIVERY_STATUSES = ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];

const sanitizeCustomerForNonAdmin = (customer, userRole) => {
  if (userRole === "ADMIN") {
    return customer;
  }
  if (!customer) return null;
  const { phone, ...rest } = customer;
  return rest;
};

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
  const {
    restaurantId,
    items,
    address = null,
    addressId = null,
    paymentMethod,
    notes = null,
  } = createOrderSchema.parse(req.body);

  // Fix #3: Pre-geocode address before transaction opens
  let preGeocodedAddress = null;
  if (address && !addressId) {
    const { getLatLngFromAddress } = await import("../utils/geocode.js");
    const fullAddress = [address.line1, address.line2, address.city, address.state, address.postalCode, "India"]
      .filter(Boolean)
      .join(", ");
    const coords = await getLatLngFromAddress(fullAddress);
    preGeocodedAddress = { ...address, preGeocodedLat: coords.lat, preGeocodedLng: coords.lng };
  }

  const order = await createPersistedOrder({
    customerId: req.user.sub,
    restaurantId,
    items,
    address: preGeocodedAddress || address,
    addressId,
    paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
    notes,
  });

  // Queue notifications after order is persisted — background worker handles FCM
  // This removes ~500ms of FCM send time from the request lifecycle
  queueNotification("vendor-new-order", { order });
  queueNotification("rider-new-order", { order });

  res.status(201).json(
    apiResponse({
      message: "Order created successfully",
      data: serializeOrder(order),
    }),
  );
};

const getMyOrders = async (req, res) => {
  // Fix #7: No pagination on getMyOrders — previously returned ALL orders ever.
  // A user with 200 orders = 200 restaurants + 600 items + 200 riders fetched
  // in one shot. 100 such users simultaneously = 100K+ DB rows per second.
  //
  // Strategy: cursor-based pagination (better than offset for large datasets).
  // Default page size = 20. Client sends ?cursor=<lastOrderId> for next page.
  // Falls back to offset (?page=N) for clients that need it.
  const PAGE_SIZE = 20;
  const cursor = req.query.cursor?.trim() || null;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

  const paginationArgs = cursor
    ? { take: PAGE_SIZE, skip: 1, cursor: { id: cursor } }
    : { take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: req.user?.sub },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            city: true,
            addressLine1: true,
            addressLine2: true,
            state: true,
            postalCode: true,
            latitude: true,
            longitude: true,
          },
        },
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
            menuItem: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs,
    }),
    // Total count only on first page (cursor mode) or always in offset mode
    cursor
      ? Promise.resolve(null)
      : prisma.order.count({ where: { customerId: req.user?.sub } }),
  ]);

  const nextCursor = orders.length === PAGE_SIZE ? orders[orders.length - 1].id : null;

  res.status(200).json(
    apiResponse({
      message: "Customer orders fetched successfully",
      data: orders.map(serializeOrder),
      meta: {
        nextCursor,
        hasMore: nextCursor !== null,
        // Only present in offset mode
        ...(cursor ? {} : { page, pageSize: PAGE_SIZE, total }),
      },
    }),
  );
};

const getVendorOrders = async (req, res) => {
  // Fix 7: Pagination added — a vendor with 1000+ orders was fetching everything
  // in one shot. Using cursor-based pagination (same pattern as getMyOrders).
  // Default page size = 50 for vendor dashboard (vendors need more context than customers).
  const VENDOR_PAGE_SIZE = 50;
  const cursor = req.query.cursor?.trim() || null;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

  const paginationArgs = cursor
    ? { take: VENDOR_PAGE_SIZE, skip: 1, cursor: { id: cursor } }
    : { take: VENDOR_PAGE_SIZE, skip: (page - 1) * VENDOR_PAGE_SIZE };

  const where = { restaurant: { vendorId: req.user.sub } };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
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
      ...paginationArgs,
    }),
    cursor
      ? Promise.resolve(null)
      : prisma.order.count({ where }),
  ]);

  const nextCursor = orders.length === VENDOR_PAGE_SIZE ? orders[orders.length - 1].id : null;

  res.status(200).json(
    apiResponse({
      message: "Vendor orders fetched successfully",
      data: orders.map((order) => ({
        ...serializeOrder(order),
        customer: sanitizeCustomerForNonAdmin(order.customer, req.user.role),
      })),
      meta: {
        nextCursor,
        hasMore: nextCursor !== null,
        ...(cursor ? {} : { page, pageSize: VENDOR_PAGE_SIZE, total }),
      },
    }),
  );
};

const getRiderOrders = async (req, res) => {
  // Fix #2: Previously fired 4 sequential DB queries + O(orders × riders)
  // haversine loop synchronously in Node's event loop.
  // With 50 riders × 200 active orders = 10,000 distance calculations per request,
  // and 100 concurrent riders = 1,000,000 CPU ops blocking the event loop.
  //
  // New approach:
  //   1. Two parallel queries instead of 4 sequential ones.
  //   2. The expensive nearest-rider calculation is moved to a separate
  //      dedicated endpoint (GET /api/orders/rider/suggestions) that is
  //      called far less frequently than the main polling loop.
  //   3. `isAvailable` is computed with a simple Set lookup — O(1) per order.
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

  // Run both queries in parallel — saves ~50% of latency vs sequential
  const [orders, engagedRiderRows] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { riderId: req.user.sub },
          {
            riderId: null,
            status: {
              in: ACTIVE_DELIVERY_STATUSES.filter((s) => s !== "OUT_FOR_DELIVERY"),
            },
            ...(riderCity
              ? { restaurant: { city: { equals: riderCity, mode: "insensitive" } } }
              : {}),
          },
        ],
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            city: true,
            addressLine1: true,
            latitude: true,
            longitude: true,
          },
        },
        address: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        rider: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
        items: {
          include: { menuItem: { select: { id: true, name: true, imageUrl: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Only fetch the IDs we need — no heavy includes
    prisma.order.findMany({
      where: {
        riderId: { not: null },
        status: { in: ACTIVE_DELIVERY_STATUSES },
      },
      select: { riderId: true },
    }),
  ]);

  // Build engaged-rider set in O(n) — used for O(1) lookup below
  const engagedRiderIds = new Set(
    engagedRiderRows.map((row) => row.riderId).filter(Boolean),
  );

  res.status(200).json(
    apiResponse({
      message: "Rider orders fetched successfully",
      data: orders.map((order) => ({
        ...serializeOrder(order),
        customer: sanitizeCustomerForNonAdmin(order.customer, req.user.role),
        // isAvailable: O(1) Set lookup — no haversine here
        isAvailable:
          rider.isOnline &&
          !order.riderId &&
          ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status) &&
          !(order.rejectedRiderIds || []).includes(rider.id) &&
          !engagedRiderIds.has(rider.id),
        // suggestedRiderId removed from hot path — use /rider/suggestions endpoint
        suggestedRiderId: null,
      })),
    }),
  );
};

// Fix #2 (cont.): Nearest-rider suggestions moved to a dedicated endpoint.
// This is called by the vendor/admin dashboard — far less frequently than
// the per-rider polling loop. Keeps the main getRiderOrders fast.
const getRiderOrderSuggestions = async (req, res) => {
  const rider = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { id: true, isOnline: true, riderOnboarding: true },
  });

  if (!rider) throw new ApiError(404, "Rider not found");

  const riderCity = rider.riderOnboarding?.city?.trim();

  const [activeOrders, engagedRiderRows] = await Promise.all([
    prisma.order.findMany({
      where: {
        riderId: null,
        status: { in: ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"] },
        ...(riderCity
          ? { restaurant: { city: { equals: riderCity, mode: "insensitive" } } }
          : {}),
      },
      select: {
        id: true,
        status: true,
        rejectedRiderIds: true,
        restaurant: { select: { latitude: true, longitude: true, city: true } },
      },
    }),
    prisma.order.findMany({
      where: { riderId: { not: null }, status: { in: ACTIVE_DELIVERY_STATUSES } },
      select: { riderId: true },
    }),
  ]);

  // Fix 2: Compute bounding box from restaurant locations to pre-filter riders at DB level.
  // Without this, ALL online riders with lat/lng are fetched (~hundreds),
  // and the JS loop does O(activeOrders × candidateRiders) haversine calculations.
  // With bounding box, only riders near any active order restaurant are returned.
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
  const restaurantCoords = activeOrders
    .map((o) => o.restaurant)
    .filter((r) => typeof r.latitude === "number" && typeof r.longitude === "number");
  if (restaurantCoords.length > 0) {
    const margin = 0.1; // ~11km margin
    latMin = Math.min(...restaurantCoords.map((r) => r.latitude)) - margin;
    latMax = Math.max(...restaurantCoords.map((r) => r.latitude)) + margin;
    lngMin = Math.min(...restaurantCoords.map((r) => r.longitude)) - margin;
    lngMax = Math.max(...restaurantCoords.map((r) => r.longitude)) + margin;
  }

  const candidateRiders = await prisma.user.findMany({
    where: {
      role: "RIDER",
      status: "ACTIVE",
      isOnline: true,
      latitude: { not: null },
      longitude: { not: null },
      // Bounding box filter — eliminates riders far from any active order
      latitude: { gte: latMin, lte: latMax },
      longitude: { gte: lngMin, lte: lngMax },
    },
    select: { id: true, latitude: true, longitude: true, riderOnboarding: true },
  });

  const engagedSet = new Set(engagedRiderRows.map((r) => r.riderId).filter(Boolean));
  const freeRiders = candidateRiders.filter(
    (r) =>
      !engagedSet.has(r.id) &&
      (!riderCity ||
        normalizeCity(r.riderOnboarding?.city) === normalizeCity(riderCity)),
  );

  const suggestions = {};
  for (const order of activeOrders) {
    const rLat = order.restaurant?.latitude;
    const rLng = order.restaurant?.longitude;
    const orderCity = normalizeCity(order.restaurant?.city);

    const eligible = freeRiders.filter(
      (r) =>
        !(order.rejectedRiderIds || []).includes(r.id) &&
        (!orderCity || normalizeCity(r.riderOnboarding?.city) === orderCity),
    );
    if (!eligible.length) continue;

    if (typeof rLat !== "number" || typeof rLng !== "number") {
      suggestions[order.id] = eligible[0].id;
      continue;
    }

    let best = null;
    let bestDist = Infinity;
    for (const r of eligible) {
      const d = getDistanceKm(rLat, rLng, r.latitude, r.longitude);
      if (d < bestDist) { bestDist = d; best = r.id; }
    }
    if (best) suggestions[order.id] = best;
  }

  res.status(200).json(
    apiResponse({ message: "Rider suggestions computed", data: suggestions }),
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
            customer: sanitizeCustomerForNonAdmin(updatedOrder.customer, req.user.role),
          },
        }),
      );
      queueNotification("rider-rejected-order", { order: updatedOrder, actorRole: req.user.role });
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

    // Fix #6: Rider claim race condition (TOCTOU).
    //
    // Old flow:  read riderId=null → check → write riderId=me
    //            Two riders can both read null and both write — last write wins,
    //            resulting in ghost assignment (two riders think they own one order).
    //
    // New flow for "claim" (canClaimOrder):
    //   Use updateMany with WHERE riderId IS NULL as an atomic conditional update.
    //   If another rider claimed between our read and our write, count=0 → 409.
    if (canClaimOrder) {
      const claimed = await prisma.order.updateMany({
        where: {
          id: req.params.orderId,
          riderId: null,          // atomic guard: only succeeds if still unclaimed
          status: order.status,   // guard against status changing concurrently
        },
        data: {
          riderId: req.user.sub,
          rejectedRiderIds: [],
        },
      });

      if (claimed.count === 0) {
        throw new ApiError(409, "This order was just claimed by another rider. Please try a different order.");
      }

      // Fix 5: Avoid duplicate full fetch — the initial fetch already has
      // restaurant, address, customer, items. Just fetch rider data.
      const riderData = await prisma.order.findUnique({
        where: { id: req.params.orderId },
        select: {
          rider: {
            select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
          },
        },
      });

      const claimedOrder = { ...order, rider: riderData?.rider || null };

      queueNotification("order-status-changed", { order: claimedOrder, actorRole: req.user.role });

      return res.status(200).json(
        apiResponse({
          message: "Order claimed successfully",
          data: {
            ...serializeOrder(claimedOrder),
            customer: sanitizeCustomerForNonAdmin(claimedOrder.customer, req.user.role),
          },
        }),
      );
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

  // Queue notification — background worker handles FCM send
  queueNotification("order-status-changed", { order: updatedOrder, actorRole: req.user.role });

  // NOTE: notifyRiderNewOrder is NOT called here.
  // New order alerts to riders are sent only when an order is first created
  // (createOrder) or when a rider claims an order (the canClaimOrder block above).
  // Calling it here on every status update was a bug — it was blasting all
  // online riders with notifications for every DELIVERED / CANCELLED etc.

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

export { createOrder, getMyOrders, getRiderOrderSuggestions, getRiderOrders, getVendorOrders, updateOrderStatus };

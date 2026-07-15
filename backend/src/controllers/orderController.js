import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { connectRedis } from "../config/redis.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { createPersistedOrder, prepareOrderDraft, serializeOrder } from "../services/orderCheckoutService.js";
import { markReferredQualifiedAndIssueMilestones } from "../services/referralService.js";
import { queueNotification } from "../services/notificationQueue.js";
import { emitOrderStatusUpdate, emitNewOrderToVendor } from "../services/orderSocketService.js";
import { initiateRazorpayRefund } from "../services/razorpayRefundService.js";
import { createOrderSchema, quoteOrderSchema } from "../validators/orderValidators.js";
import { getGoogleRouteSummary } from "../utils/googleMaps.js";

const RIDER_GEO_KEY = "rider:geo";

const ACTIVE_DELIVERY_STATUSES = ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];
const VENDOR_STATUS_TRANSITIONS = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PREPARING"],
  PREPARING: ["READY_FOR_PICKUP"],
};

const assertVendorStatusTransition = (currentStatus, nextStatus) => {
  const allowed = VENDOR_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Restaurant cannot move an order from ${currentStatus} to ${nextStatus}`);
  }
};

const sanitizeCustomerForNonAdmin = (customer, userRole) => {
  if (userRole === "ADMIN") {
    return customer;
  }
  if (!customer) return null;
  const rest = { ...customer };
  delete rest.phone;
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
    restaurantInstructions = null,
    deliveryInstructions = null,
    tipAmount = 0,
    couponCode = null,
    referralVoucherCode = null,
  } = createOrderSchema.parse(req.body);

  // Fix #3: Pre-geocode address before transaction opens
  let preGeocodedAddress = null;
  if (address && !addressId && (address.latitude === null || address.latitude === undefined || address.longitude === null || address.longitude === undefined)) {
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
    restaurantInstructions,
    deliveryInstructions,
    tipAmount,
    couponCode,
    referralVoucherCode,
  });

  // Queue notifications after order is persisted; background worker handles FCM.
  // This removes ~500ms of FCM send time from the request lifecycle
  queueNotification("vendor-new-order", { order });
  queueNotification("rider-new-order", { order });

  // Real-time socket push replaces frontend polling for new orders.
  emitNewOrderToVendor(order);

  res.status(201).json(
    apiResponse({
      message: "Order created successfully",
      data: serializeOrder(order),
    }),
  );
};

const quoteOrder = async (req, res) => {
  const {
    restaurantId,
    items,
    address = null,
    addressId = null,
    paymentMethod,
    notes = null,
    restaurantInstructions = null,
    deliveryInstructions = null,
    tipAmount = 0,
    couponCode = null,
    referralVoucherCode = null,
  } = quoteOrderSchema.parse(req.body);

  const draft = await prepareOrderDraft({
    customerId: req.user.sub,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod,
    notes,
    restaurantInstructions,
    deliveryInstructions,
    tipAmount,
    couponCode,
    referralVoucherCode,
    persistAddress: false,
  });

  res.status(200).json(
    apiResponse({
      message: "Order quote calculated successfully",
      data: {
        subtotal: Number(draft.subtotal.toFixed(2)),
        deliveryFee: Number(draft.deliveryFee.toFixed(2)),
        deliveryFeeBase: Number(draft.deliveryFeeBase.toFixed(2)),
        deliveryTax: Number(draft.deliveryTax.toFixed(2)),
        rainCharge: Number((draft.rainCharge || 0).toFixed(2)),
        packagingFee: Number(draft.packagingFee.toFixed(2)),
        packagingFeeBase: Number(draft.packagingFeeBase.toFixed(2)),
        packagingTax: Number(draft.packagingTax.toFixed(2)),
        platformFee: Number(draft.platformFee.toFixed(2)),
        platformFeeBase: Number(draft.platformFeeBase.toFixed(2)),
        platformTax: Number(draft.platformTax.toFixed(2)),
        gatewayFee: Number(draft.gatewayFee.toFixed(2)),
        codCharge: Number(draft.codCharge.toFixed(2)),
        discount: Number(draft.discount.toFixed(2)),
        referralVoucherDiscount: Number((draft.referralVoucherDiscount || 0).toFixed(2)),
        totalTax: Number(draft.totalTax.toFixed(2)),
        totalAmount: Number(draft.totalAmount.toFixed(2)),
        deliveryDistance: draft.deliveryDistance,
        tipAmount: Number(draft.tipAmount || 0),
        couponCode: draft.couponCode,
        referralVoucherCode: draft.referralVoucherCode,
      },
    }),
  );
};
const getMyOrders = async (req, res) => {
  // Fix #7: No pagination on getMyOrders; previously returned ALL orders ever.
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
  // Fix 7: Pagination added; a vendor with 1000+ orders was fetching everything.
  // in one shot. Using cursor-based pagination (same pattern as getMyOrders).
  // Default page size = 50 for vendor dashboard (vendors need more context than customers).
  const VENDOR_PAGE_SIZE = 50;
  const cursor = req.query.cursor?.trim() || null;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

  const paginationArgs = cursor
    ? { take: VENDOR_PAGE_SIZE, skip: 1, cursor: { id: cursor } }
    : { take: VENDOR_PAGE_SIZE, skip: (page - 1) * VENDOR_PAGE_SIZE };

  const where = { restaurant: { vendorId: req.user.sub } };

  if (req.query.restaurantId) {
    where.restaurantId = req.query.restaurantId;
  }

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
  // Fix #2: Previously fired 4 sequential DB queries plus O(orders x riders)
  // haversine loop synchronously in Node's event loop.
  // With 50 riders x 200 active orders = 10,000 distance calculations per request,
  // and 100 concurrent riders = 1,000,000 CPU ops blocking the event loop.
  //
  // New approach:
  //   1. Two parallel queries instead of 4 sequential ones.
  //   2. The expensive nearest-rider calculation is moved to a separate
  //      dedicated endpoint (GET /api/orders/rider/suggestions) that is
  //      called far less frequently than the main polling loop.
  //   3. `isAvailable` is computed with a simple Set lookup: O(1) per order.
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

  // Run both queries in parallel; saves ~50% of latency vs sequential.
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
    // Only fetch the IDs we need; no heavy includes.
    prisma.order.findMany({
      where: {
        riderId: { not: null },
        status: { in: ACTIVE_DELIVERY_STATUSES },
      },
      select: { riderId: true },
    }),
  ]);

  // Build engaged-rider set in O(n); used for O(1) lookup below.
  const engagedRiderIds = new Set(
    engagedRiderRows.map((row) => row.riderId).filter(Boolean),
  );

  const ownsOrder = (order) => order.riderId === req.user.sub;

  res.status(200).json(
    apiResponse({
      message: "Rider orders fetched successfully",
      data: orders.map((order) => ({
        ...serializeOrder(order),
        customer: ownsOrder(order)
          ? order.customer
          : order.customer
            ? { id: order.customer.id, name: order.customer.name }
            : null,
        // isAvailable: O(1) Set lookup; no haversine here.
        isAvailable:
          rider.isOnline &&
          !order.riderId &&
          ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status) &&
          !(order.rejectedRiderIds || []).includes(rider.id) &&
          !engagedRiderIds.has(rider.id),
        // suggestedRiderId removed from hot path; use /rider/suggestions endpoint.
        suggestedRiderId: null,
      })),
    }),
  );
};

// Fix #2 (cont.): Nearest-rider suggestions moved to a dedicated endpoint.
// This is called by the vendor/admin dashboard far less frequently than
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

  const engagedSet = new Set(engagedRiderRows.map((r) => r.riderId).filter(Boolean));
  const suggestions = {};
  const redisClient = await connectRedis();
  const useGeo = redisClient?.isOpen;

  for (const order of activeOrders) {
    const rLat = order.restaurant?.latitude;
    const rLng = order.restaurant?.longitude;
    const orderCity = normalizeCity(order.restaurant?.city);
    const rejected = order.rejectedRiderIds || [];

    let nearestRiderId = null;

    if (useGeo && typeof rLat === "number" && typeof rLng === "number") {
      const nearby = await redisClient.geoSearch(
        RIDER_GEO_KEY,
        { longitude: rLng, latitude: rLat },
        { radius: 10, unit: "km" },
        { COUNT: 5, order: "ASC" },
      );
      for (const member of nearby) {
        if (rejected.includes(member)) continue;
        if (engagedSet.has(member)) continue;
        nearestRiderId = member;
        break;
      }
    }

    if (!nearestRiderId) {
      const candidateRiders = await prisma.user.findMany({
        where: {
          role: "RIDER",
          status: "ACTIVE",
          isOnline: true,
          latitude: { not: null },
          longitude: { not: null },
          ...(
            orderCity
              ? { riderOnboarding: { path: ["city"], string_contains: orderCity } }
              : {}
          ),
        },
        select: { id: true, latitude: true, longitude: true },
      });

      const eligible = candidateRiders.filter(
        (r) =>
          !engagedSet.has(r.id) &&
          !rejected.includes(r.id),
      );
      if (!eligible.length) continue;

      if (typeof rLat !== "number" || typeof rLng !== "number") {
        nearestRiderId = eligible[0].id;
      } else {
        let bestDist = Infinity;
        for (const r of eligible) {
          const d = getDistanceKm(rLat, rLng, r.latitude, r.longitude);
          if (d < bestDist) { bestDist = d; nearestRiderId = r.id; }
        }
      }
    }

    if (nearestRiderId) suggestions[order.id] = nearestRiderId;
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

  if (req.user.role === "VENDOR") {
    assertVendorStatusTransition(order.status, status);
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
  emitOrderStatusUpdate(updatedOrder, req.user.role);
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

    if (status === "DELIVERED") {
      throw new ApiError(400, "Verify the customer delivery OTP to complete this order");
    }

    if (status === "DELIVERED" && order.status !== "OUT_FOR_DELIVERY") {
      throw new ApiError(400, "Deliver the order only after pickup");
    }

    // Fix #6: Rider claim race condition (TOCTOU).
    // Old flow read riderId=null, checked permissions, then wrote riderId=me.
    // New flow uses updateMany with riderId=null as an atomic guard.
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

      // Fix 5: Avoid duplicate full fetch; the initial fetch already has
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

      emitOrderStatusUpdate(claimedOrder, req.user.role);
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

  const cancelFeePercent = (() => {
    if (status !== "CANCELLED") return 0;
    if (["PENDING", "ACCEPTED"].includes(order.status)) return 0;
    if (order.status === "PREPARING" && order.preparingAt) {
      const mins = (Date.now() - order.preparingAt.getTime()) / 60000;
      if (mins < 2) return 0;
      if (mins >= 10) return 20;
      return 15;
    }
    return 20;
  })();

  const totalAmountNum = Number(order.totalAmount);
  const cancellationFeeBase = Math.max(0, totalAmountNum - Number(order.tipAmount || 0));
  const cancelFee = Math.round((cancellationFeeBase * cancelFeePercent) / 100 * 100) / 100;
  const refundAmount = totalAmountNum - cancelFee;
  const gatewayRefund =
    status === "CANCELLED" && order.paymentStatus === "PAID"
      ? await initiateRazorpayRefund({
          paymentId: order.gatewayPaymentId,
          amount: refundAmount,
          orderId: order.id,
          customerId: order.customerId,
        })
      : null;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      await Promise.all(
        order.items
          .filter((item) => item.menuItem?.trackInventory)
          .map((item) => tx.menuItem.update({
            where: { id: item.menuItemId },
            data: { stockQuantity: { increment: item.quantity } },
          })),
      );
    }
    return tx.order.update({
    where: { id: req.params.orderId },
    data: {
      status,
      ...(status === "PREPARING" ? { preparingAt: new Date() } : {}),
      ...(req.user.role === "RIDER" && (status === order.status || status === "OUT_FOR_DELIVERY")
        ? { riderId: req.user.sub }
        : {}),
      ...(req.user.role === "RIDER" && status === order.status
        ? { rejectedRiderIds: [] }
        : {}),
      ...(status === "OUT_FOR_DELIVERY" ? { pickedUpAt: new Date() } : {}),
      ...(status === "DELIVERED" ? { paymentStatus: "PAID", deliveredAt: new Date() } : {}),
      ...(gatewayRefund
        ? {
            paymentStatus: gatewayRefund.status === "processed" ? "REFUNDED" : "REFUND_PENDING",
            refundId: gatewayRefund.id,
            refundStatus: gatewayRefund.status,
            refundAmount,
            refundInitiatedAt: new Date(),
          }
        : {}),
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
  });
  // Real-time socket push eliminates frontend polling for this update.
  emitOrderStatusUpdate(updatedOrder, req.user.role);

  // Queue notification; background worker handles FCM send.
  queueNotification("order-status-changed", { order: updatedOrder, actorRole: req.user.role });

  // NOTE: notifyRiderNewOrder is NOT called here.
  // New order alerts to riders are sent only when an order is first created
  // (createOrder) or when a rider claims an order (the canClaimOrder block above).
  // Calling it here on every status update was a bug; it was blasting all
  // online riders with notifications for every DELIVERED / CANCELLED etc.

  res.status(200).json(
    apiResponse({
      message: status === "CANCELLED" && cancelFee > 0
        ? `Order cancelled. ${cancelFeePercent}% fee deducted (Rs ${cancelFee}).`
        : "Order status updated successfully",
      data: {
        ...serializeOrder(updatedOrder),
        customer: updatedOrder.customer,
        ...(status === "CANCELLED" ? {
          cancelFeePercent,
          cancelFee,
          refundAmount,
        } : {}),
      },
    }),
  );
};

const getOrderTracking = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: {
      address: true,
      restaurant: true,
      rider: { select: { id: true, name: true, phone: true, avatarUrl: true, latitude: true, longitude: true, updatedAt: true } },
    },
  });
  if (!order) throw new ApiError(404, "Order not found");
  const allowed = req.user.role === "ADMIN" ||
    (req.user.role === "CUSTOMER" && order.customerId === req.user.sub) ||
    (req.user.role === "RIDER" && order.riderId === req.user.sub) ||
    (req.user.role === "VENDOR" && order.restaurant.vendorId === req.user.sub);
  if (!allowed) throw new ApiError(403, "You do not have permission to track this order");

  const riderLocation = Number.isFinite(order.rider?.latitude) && Number.isFinite(order.rider?.longitude)
    ? { lat: order.rider.latitude, lng: order.rider.longitude }
    : null;
  const restaurantLocation = Number.isFinite(order.restaurant?.latitude) && Number.isFinite(order.restaurant?.longitude)
    ? { lat: order.restaurant.latitude, lng: order.restaurant.longitude }
    : null;
  const destinationLocation = Number.isFinite(order.address?.latitude) && Number.isFinite(order.address?.longitude)
    ? { lat: order.address.latitude, lng: order.address.longitude }
    : null;
  const routeOrigin = riderLocation || restaurantLocation;
  const route = routeOrigin && destinationLocation
    ? await getGoogleRouteSummary({ origin: routeOrigin, destination: destinationLocation })
    : null;

  res.status(200).json(apiResponse({ message: "Order tracking fetched", data: {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveryInstructions: order.deliveryInstructions,
    restaurantInstructions: order.restaurantInstructions,
    tipAmount: Number(order.tipAmount || 0),
    deliveryDistance: order.deliveryDistance ? Number(order.deliveryDistance) : null,
    pickedUpAt: order.pickedUpAt,
    deliveredAt: order.deliveredAt,
    route: route ? {
      source: riderLocation ? "RIDER_TO_CUSTOMER" : "RESTAURANT_TO_CUSTOMER",
      distanceKm: route.distanceKm,
      durationSeconds: route.durationSeconds,
      encodedPolyline: route.encodedPolyline,
    } : null,
    rider: order.rider,
    restaurant: { id: order.restaurant.id, name: order.restaurant.name, phone: order.restaurant.phone, latitude: order.restaurant.latitude, longitude: order.restaurant.longitude },
    destination: order.address ? { fullName: order.address.fullName, phone: order.address.phone, line1: order.address.line1, line2: order.address.line2, city: order.address.city, latitude: order.address.latitude, longitude: order.address.longitude } : null,
  }}));
};
const createDeliveryOtp = async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.customerId !== req.user.sub) throw new ApiError(403, "You can only request OTP for your own order");
  if (!["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(order.status) || !order.riderId) {
    throw new ApiError(400, "Delivery OTP is available after a rider is assigned");
  }
  const otp = String(randomInt(1000, 10000));
  await prisma.order.update({ where: { id: order.id }, data: {
    deliveryOtpHash: await bcrypt.hash(otp, 10),
    deliveryOtpExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
  }});
  res.status(200).json(apiResponse({ message: "Delivery OTP generated", data: { otp, expiresInMinutes: 30 } }));
};

const verifyDeliveryOtp = async (req, res) => {
  const otp = String(req.body.otp || "").trim();
  if (!/^\d{4}$/.test(otp)) throw new ApiError(400, "Enter a valid 4-digit OTP");
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.riderId !== req.user.sub) throw new ApiError(403, "This delivery is not assigned to you");
  if (order.status !== "OUT_FOR_DELIVERY") throw new ApiError(400, "Order must be out for delivery");
  if (!order.deliveryOtpHash || !order.deliveryOtpExpiresAt || order.deliveryOtpExpiresAt < new Date()) {
    throw new ApiError(400, "Delivery OTP has expired. Ask the customer to generate a new OTP");
  }
  if (!(await bcrypt.compare(otp, order.deliveryOtpHash))) throw new ApiError(400, "Incorrect delivery OTP");
  const updated = await prisma.order.update({ where: { id: order.id }, data: {
    status: "DELIVERED", paymentStatus: "PAID", deliveredAt: new Date(), deliveryOtpHash: null, deliveryOtpExpiresAt: null,
  }, include: { restaurant: true, address: true, customer: true, rider: true, items: { include: { menuItem: true } } } });
  await markReferredQualifiedAndIssueMilestones({
    customerId: updated.customerId,
    orderId: updated.id,
    paymentStatus: updated.paymentStatus,
  });
  emitOrderStatusUpdate(updated, req.user.role);
  queueNotification("order-status-changed", { order: updated, actorRole: req.user.role });
  res.status(200).json(apiResponse({ message: "Delivery completed successfully", data: serializeOrder(updated) }));
};
const getVendorPayouts = async (req, res) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { vendorId: req.user.sub } });
  if (!restaurant) throw new ApiError(404, "Restaurant not found");
  const [earnings, reserved, payouts] = await Promise.all([
    prisma.order.aggregate({ where: { restaurantId: restaurant.id, status: "DELIVERED" }, _sum: { subtotal: true } }),
    prisma.vendorPayout.aggregate({ where: { vendorId: req.user.sub, status: { in: ["REQUESTED", "PROCESSING", "PAID"] } }, _sum: { amount: true } }),
    prisma.vendorPayout.findMany({ where: { vendorId: req.user.sub }, orderBy: { requestedAt: "desc" }, take: 50 }),
  ]);
  const grossEarnings = Number(earnings._sum.subtotal || 0);
  const reservedAmount = Number(reserved._sum.amount || 0);
  res.status(200).json(apiResponse({ message: "Payout summary fetched", data: {
    grossEarnings, reservedAmount, availableAmount: Math.max(0, grossEarnings - reservedAmount),
    payouts: payouts.map((p) => ({ ...p, amount: Number(p.amount) })),
  }}));
};

const requestVendorPayout = async (req, res) => {
  const requestedAmount = Number(req.body.amount);
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) throw new ApiError(400, "Enter a valid payout amount");
  const payout = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.findFirst({ where: { vendorId: req.user.sub } });
    if (!restaurant) throw new ApiError(404, "Restaurant not found");
    const [earnings, reserved] = await Promise.all([
      tx.order.aggregate({ where: { restaurantId: restaurant.id, status: "DELIVERED" }, _sum: { subtotal: true } }),
      tx.vendorPayout.aggregate({ where: { vendorId: req.user.sub, status: { in: ["REQUESTED", "PROCESSING", "PAID"] } }, _sum: { amount: true } }),
    ]);
    const available = Number(earnings._sum.subtotal || 0) - Number(reserved._sum.amount || 0);
    if (requestedAmount > available) throw new ApiError(400, `Only Rs ${Math.max(0, available).toFixed(2)} is available for payout`);
    return tx.vendorPayout.create({ data: { vendorId: req.user.sub, restaurantId: restaurant.id, amount: requestedAmount } });
  });
  res.status(201).json(apiResponse({ message: "Payout request submitted", data: { ...payout, amount: Number(payout.amount) } }));
};
const reorderOrder = async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          menuItem: {
            select: { id: true, name: true, price: true, imageUrl: true },
          },
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.customerId !== req.user.sub) {
    throw new ApiError(403, "You can only reorder your own orders");
  }

  const items = order.items.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.menuItem.name,
    price: Number(item.menuItem.price),
    quantity: item.quantity,
    size: item.size,
    selectedSideDishes: item.selectedSideDishes,
    notes: item.notes,
    imageUrl: item.menuItem.imageUrl,
  }));

  res.status(200).json(
    apiResponse({
      message: "Reorder data fetched successfully",
      data: { items },
    }),
  );
};

export { assertVendorStatusTransition, createDeliveryOtp, createOrder, getMyOrders, getOrderTracking, getRiderOrderSuggestions, getRiderOrders, getVendorOrders, getVendorPayouts, quoteOrder, reorderOrder, requestVendorPayout, updateOrderStatus, verifyDeliveryOtp };

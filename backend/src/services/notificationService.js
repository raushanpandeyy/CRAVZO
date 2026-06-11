import { prisma } from "../config/database.js";
import { admin, isFirebaseAdminReady } from "../config/firebaseAdmin.js";
import { fcmTokenBloomFilter } from "../utils/bloomFilter.js";
import { logger } from "../utils/logger.js";

const INVALID_FCM_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);
const FCM_BATCH_SIZE = 500;

const buildOrderClickUrl = ({ role, orderId }) => {
  if (role === "RIDER") return `/rider-dashboard?orderId=${orderId}`;
  if (role === "VENDOR") return `/vendor-dashboard/orders?orderId=${orderId}`;
  return `/account/orders?orderId=${orderId}`;
};

const getOrderStatusCopy = ({ status, restaurantName }) => {
  const name = restaurantName || "Restaurant";
  const copyByStatus = {
    PENDING: ["Order placed", `${name} received your order.`],
    ACCEPTED: ["Order accepted", `${name} accepted the order.`],
    PREPARING: ["Food is being prepared", `${name} is preparing the order.`],
    READY_FOR_PICKUP: ["Order ready for pickup", "Delivery partner can pick up the order."],
    OUT_FOR_DELIVERY: ["Order out for delivery", "Your order is on the way."],
    DELIVERED: ["Order delivered", "The order has been marked delivered."],
    CANCELLED: ["Order cancelled", "The order has been cancelled."],
    REJECTED: ["Order rejected", "The order has been rejected."],
  };

  return copyByStatus[status] || ["Order update", `Order status changed to ${status}.`];
};

const upsertFcmToken = async ({ userId, token, deviceId = null, platform = "WEB", userAgent = null }) => {
  // Bloom filter Use Case 2: skip DB upsert if token is already known
  // Saves a DB round-trip on every app load for existing devices.
  // BUT if Redis is down, mightExist() returns true (fail-open) which would
  // skip the DB upsert and lose the token — so confirm with a lightweight check.
  const alreadyKnown = await fcmTokenBloomFilter.mightExist(token);
  if (alreadyKnown) {
    const existing = await prisma.fcmToken.findUnique({ where: { token }, select: { id: true, isActive: true } });
    if (existing) {
      return existing;
    }
  }

  const result = await prisma.fcmToken.upsert({
    where: { token },
    create: {
      userId,
      token,
      deviceId,
      platform,
      userAgent,
      isActive: true,
      lastUsedAt: new Date(),
    },
    update: {
      userId,
      deviceId,
      platform,
      userAgent,
      isActive: true,
      lastUsedAt: new Date(),
    },
  });

  // Add to bloom filter after successful DB save
  fcmTokenBloomFilter.add(token);
  return result;
};

const removeFcmToken = async ({ userId, token }) =>
  prisma.fcmToken.updateMany({
    where: { userId, token },
    data: { isActive: false },
  });

const deactivateTokens = async (tokens) => {
  if (!tokens.length) return;

  await prisma.fcmToken.updateMany({
    where: { token: { in: tokens } },
    data: { isActive: false },
  });
};

const sendNotificationToUsers = async ({ userIds = [], title, body, data = {} }) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueUserIds.length || !title || !body) return { successCount: 0, failureCount: 0 };

  if (!isFirebaseAdminReady()) {
    logger.warn("FCM skipped because Firebase Admin is not configured", { userIds: uniqueUserIds, title });
    return { successCount: 0, failureCount: 0, skipped: true };
  }

  const tokenRows = await prisma.fcmToken.findMany({
    where: {
      userId: { in: uniqueUserIds },
      isActive: true,
    },
    select: { token: true },
  });

  const tokens = [...new Set(tokenRows.map((entry) => entry.token).filter(Boolean))];
  if (!tokens.length) return { successCount: 0, failureCount: 0 };

  // Keep payloads small: notification is for display, data is for routing.
  const payload = {
    tokens,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === undefined || value === null ? "" : String(value)]),
    ),
    webpush: {
      fcmOptions: {
        link: data.clickUrl || "/",
      },
      notification: {
        icon: "/cravzologo.png",
        badge: "/cravzologo.png",
        requireInteraction: false,
      },
    },
  };

  const batchResponses = await Promise.all(
    Array.from({ length: Math.ceil(tokens.length / FCM_BATCH_SIZE) }, (_, batchIndex) => {
      const batchTokens = tokens.slice(batchIndex * FCM_BATCH_SIZE, (batchIndex + 1) * FCM_BATCH_SIZE);
      return admin.messaging().sendEachForMulticast({
        ...payload,
        tokens: batchTokens,
      });
    }),
  );

  const invalidTokens = batchResponses.flatMap((response, batchIndex) => {
    const batchTokens = tokens.slice(batchIndex * FCM_BATCH_SIZE, (batchIndex + 1) * FCM_BATCH_SIZE);
    return response.responses
      .map((result, index) => (result.error && INVALID_FCM_ERROR_CODES.has(result.error.code) ? batchTokens[index] : null))
      .filter(Boolean);
  });

  await deactivateTokens(invalidTokens);

  return {
    successCount: batchResponses.reduce((total, response) => total + response.successCount, 0),
    failureCount: batchResponses.reduce((total, response) => total + response.failureCount, 0),
    invalidTokens: invalidTokens.length,
  };
};

const notifyOrderCreated = async (order) => {
  const [title, body] = getOrderStatusCopy({
    status: "PENDING",
    restaurantName: order.restaurant?.name,
  });

  await sendNotificationToUsers({
    userIds: [order.restaurant?.vendorId],
    title,
    body,
    data: {
      type: "ORDER_CREATED",
      orderId: order.id,
      status: order.status,
      clickUrl: buildOrderClickUrl({ role: "VENDOR", orderId: order.id }),
    },
  });
};

const notifyOrderStatusChanged = async ({ order, actorRole }) => {
  const [title, body] = getOrderStatusCopy({
    status: order.status,
    restaurantName: order.restaurant?.name,
  });

  const recipients = [];

  // CUSTOMER always gets notified about their own order (except when they are the actor)
  if (actorRole !== "CUSTOMER") {
    recipients.push({ userId: order.customerId, role: "CUSTOMER" });
  }

  // VENDOR gets notified when status changes (they are the actor or order involves their restaurant)
  if (actorRole !== "VENDOR" && order.restaurant?.vendorId) {
    recipients.push({ userId: order.restaurant.vendorId, role: "VENDOR" });
  }

  // RIDER only gets notified if they are assigned to this specific order
  if (order.riderId && actorRole !== "RIDER") {
    recipients.push({ userId: order.riderId, role: "RIDER" });
  }

  // Remove duplicates (in case customer is also vendor or other edge case)
  const uniqueRecipients = recipients.filter(
    (recipient, index, self) => index === self.findIndex((r) => r.userId === recipient.userId)
  );

  await Promise.all(
    uniqueRecipients.map((recipient) =>
      sendNotificationToUsers({
        userIds: [recipient.userId],
        title,
        body,
        data: {
          type: "ORDER_STATUS",
          orderId: order.id,
          status: order.status,
          clickUrl: buildOrderClickUrl({ role: recipient.role, orderId: order.id }),
        },
      }),
    ),
  );
};

const notifyChatMessage = async ({ room, sender, messageText, imageUrl }) => {
  const senderName = sender?.name || "Someone";
  const title = "New message";
  const body = messageText || (imageUrl ? "Sent a photo" : "Sent a message");

  let recipientIds = [];
  let clickUrl = "/";

  if (room?.type === "ORDER_RIDER") {
    recipientIds = [room.order?.customerId, room.order?.riderId].filter(Boolean);
    if (room.orderId) {
      clickUrl = `/account/orders?orderId=${room.orderId}`;
    }
  } else if (room?.type === "SUPPORT") {
    if (sender.role === "ADMIN") {
      recipientIds = [room.supportUserId].filter(Boolean);
    } else {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      recipientIds = admins.map((a) => a.id);
    }
    clickUrl = "/admin";
  }

  await sendNotificationToUsers({
    userIds: recipientIds.filter((id) => id !== sender.sub),
    title: `${senderName}: ${title}`,
    body,
    data: {
      type: "CHAT_MESSAGE",
      roomId: room?.id || "",
      senderId: sender?.sub || "",
      senderName: senderName,
      clickUrl,
    },
  });
};

const notifyRiderNewOrder = async (order) => {
  const vendorName = order.restaurant?.name || "Restaurant";
  const title = "New Delivery Request!";
  const body = `Pickup from ${vendorName} - Earn ₹${Math.floor(order.deliveryFee || 33)}`;

  // Only notify riders who are:
  // 1. Online and active
  // 2. NOT already assigned to another active order (avoid spamming busy riders)
  // 3. In the same city as the restaurant (if city info is available)
  const restaurantCity = order.restaurant?.city?.trim().toLowerCase();

  const busyRiderIds = (
    await prisma.order.findMany({
      where: {
        riderId: { not: null },
        status: { in: ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
        id: { not: order.id },
      },
      select: { riderId: true },
    })
  ).map((o) => o.riderId).filter(Boolean);

  const availableRiders = await prisma.user.findMany({
    where: {
      role: "RIDER",
      status: "ACTIVE",
      isOnline: true,
      id: { notIn: busyRiderIds.length ? busyRiderIds : ["__none__"] },
    },
    select: { id: true, riderOnboarding: true },
  });

  // Filter by city if restaurant city is known
  const targetRiders = restaurantCity
    ? availableRiders.filter((r) => {
        const riderCity = r.riderOnboarding?.city?.trim().toLowerCase();
        return !riderCity || riderCity === restaurantCity;
      })
    : availableRiders;

  if (!targetRiders.length) return;

  await sendNotificationToUsers({
    userIds: targetRiders.map((r) => r.id),
    title,
    body,
    data: {
      type: "RIDER_NEW_ORDER",
      orderId: order.id,
      restaurantName: vendorName,
      deliveryFee: String(order.deliveryFee || 0),
      deliveryDistance: order.deliveryDistance ? String(order.deliveryDistance) : "",
      clickUrl: "/rider-dashboard",
    },
  });
};

const notifyVendorNewOrder = async (order) => {
  const customerName = order.customer?.name || "Customer";
  const title = "New Order Received!";
  const body = `Order #${order.id?.slice(-6)} from ${customerName} - ₹${Math.floor(order.totalAmount || 0)}`;

  if (order.restaurant?.vendorId) {
    await sendNotificationToUsers({
      userIds: [order.restaurant.vendorId],
      title,
      body,
      data: {
        type: "VENDOR_NEW_ORDER",
        orderId: order.id,
        customerName,
        totalAmount: String(order.totalAmount || 0),
        itemsCount: String(order.items?.length || 0),
        clickUrl: "/vendor-dashboard",
      },
    });
  }
};

export { notifyChatMessage, notifyOrderCreated, notifyOrderStatusChanged, notifyRiderNewOrder, notifyVendorNewOrder, removeFcmToken, sendNotificationToUsers, upsertFcmToken };

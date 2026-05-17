import { prisma } from "../config/database.js";
import { admin, isFirebaseAdminReady } from "../config/firebaseAdmin.js";
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

const upsertFcmToken = async ({ userId, token, deviceId = null, platform = "WEB", userAgent = null }) =>
  prisma.fcmToken.upsert({
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

  if (actorRole !== "CUSTOMER") recipients.push({ userId: order.customerId, role: "CUSTOMER" });
  if (actorRole !== "VENDOR") recipients.push({ userId: order.restaurant?.vendorId, role: "VENDOR" });
  if (order.riderId && actorRole !== "RIDER") recipients.push({ userId: order.riderId, role: "RIDER" });

  await Promise.all(
    recipients.map((recipient) =>
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

export { notifyOrderCreated, notifyOrderStatusChanged, removeFcmToken, sendNotificationToUsers, upsertFcmToken };

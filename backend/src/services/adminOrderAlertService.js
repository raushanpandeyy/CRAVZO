import { prisma } from "../config/database.js";
import { emitAdminOrderEvent } from "../socket/chatSocket.js";

const ACCEPT_TIMEOUT_MS = Number(process.env.ADMIN_ORDER_ACCEPT_TIMEOUT_MS || 2 * 60 * 1000);
const pendingAlerts = new Map();

const buildOrderPayload = (order) => ({
  id: order.id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  totalAmount: Number(order.totalAmount || 0),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  restaurant: order.restaurant
    ? {
        id: order.restaurant.id,
        name: order.restaurant.name,
        vendorId: order.restaurant.vendorId,
      }
    : null,
  customer: order.customer
    ? {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
      }
    : null,
  rider: order.rider
    ? {
        id: order.rider.id,
        name: order.rider.name,
      }
    : null,
});

const emitAdminOrderCreated = async (order) => {
  emitAdminOrderEvent({
    type: "ORDER_CREATED",
    severity: "info",
    title: "New live order",
    message: `${order.restaurant?.name || "Restaurant"} received order #${order.id.slice(-6)}.`,
    order: buildOrderPayload(order),
  });
};

const emitAdminOrderStatusChanged = async ({ order, actorRole }) => {
  emitAdminOrderEvent({
    type: "ORDER_STATUS_CHANGED",
    severity: order.status === "REJECTED" || order.status === "CANCELLED" ? "danger" : "info",
    title: "Order status updated",
    message: `Order #${order.id.slice(-6)} is now ${order.status.replaceAll("_", " ")}.`,
    actorRole,
    order: buildOrderPayload(order),
  });
};

const scheduleAdminUnacceptedOrderAlert = (orderId) => {
  if (pendingAlerts.has(orderId)) {
    clearTimeout(pendingAlerts.get(orderId));
  }

  const timeoutId = setTimeout(async () => {
    pendingAlerts.delete(orderId);
    const order = await prisma.order.findFirst({
      where: { id: orderId, status: "PENDING" },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
        restaurant: { select: { id: true, name: true, vendorId: true } },
        customer: { select: { id: true, name: true, phone: true } },
        rider: { select: { id: true, name: true } },
      },
    });

    if (!order) return;

    emitAdminOrderEvent({
      type: "ORDER_NOT_ACCEPTED",
      severity: "danger",
      title: "Restaurant has not accepted",
      message: `${order.restaurant?.name || "Restaurant"} has not accepted order #${order.id.slice(-6)} yet.`,
      order: buildOrderPayload(order),
    });
  }, ACCEPT_TIMEOUT_MS);

  pendingAlerts.set(orderId, timeoutId);
};

const notifyAdminOrderCreated = (order) => {
  emitAdminOrderCreated(order);
  scheduleAdminUnacceptedOrderAlert(order.id);
};

const notifyAdminOrderStatusChanged = ({ order, actorRole }) => {
  if (order.status !== "PENDING" && pendingAlerts.has(order.id)) {
    clearTimeout(pendingAlerts.get(order.id));
    pendingAlerts.delete(order.id);
  }
  emitAdminOrderStatusChanged({ order, actorRole });
};

export { notifyAdminOrderCreated, notifyAdminOrderStatusChanged };

import { getRestaurantNotificationVendorIds } from "../utils/restaurantAccess.js";

let ioInstance = null;

export const setOrderSocketInstance = (io) => {
  ioInstance = io;
};

const emitToUsers = (userIds, event, data) => {
  if (!ioInstance || !userIds?.length) return;

  try {
    const rooms = userIds.map((id) => `user:${id}`);
    ioInstance.to(rooms).emit(event, data);
  } catch (error) {
    console.error("Socket emit failed:", error.message);
  }
};

export const emitOrderStatusUpdate = async (order, actorRole) => {
  if (!ioInstance) return;

  const recipientIds = [order.customerId];
  if (order.riderId) recipientIds.push(order.riderId);
  if (order.cancelledRiderId) recipientIds.push(order.cancelledRiderId);
  recipientIds.push(...(await getRestaurantNotificationVendorIds(order.restaurant)));

  emitToUsers(recipientIds, "order:status-updated", {
    orderId: order.id,
    status: order.status,
    updatedAt: new Date().toISOString(),
    actorRole,
  });
};

export const emitNewOrderToVendor = async (order) => {
  if (!ioInstance) return;

  try {
    const vendorIds = await getRestaurantNotificationVendorIds(order.restaurant);
    if (vendorIds.length) {
      emitToUsers(vendorIds, "order:new", {
        orderId: order.id,
        status: order.status,
        customerName: order.customer?.name,
        totalAmount: order.totalAmount,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("New order socket emit failed:", error.message);
  }
};

export const emitNewOrderToRiders = (order, onlineRiderIds) => {
  if (!ioInstance || !onlineRiderIds?.length) return;

  emitToUsers(onlineRiderIds, "order:new", {
    orderId: order.id,
    restaurantName: order.restaurant?.name,
    city: order.restaurant?.city,
    totalAmount: order.totalAmount,
    deliveryFee: order.deliveryFee,
    createdAt: new Date().toISOString(),
  });
};
export const emitRiderLocationUpdate = async (order, location) => {
  if (!ioInstance || !order?.customerId) return;

  const recipientIds = [order.customerId];
  recipientIds.push(...(await getRestaurantNotificationVendorIds(order.restaurant)));

  emitToUsers(recipientIds, "order:rider-location", {
    orderId: order.id,
    riderId: order.riderId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    heading: location.heading,
    speed: location.speed,
    timestamp: location.timestamp,
    updatedAt: location.updatedAt ? new Date(location.updatedAt).toISOString() : new Date().toISOString(),
  });
};


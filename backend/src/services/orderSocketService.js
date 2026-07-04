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

export const emitOrderStatusUpdate = (order, actorRole) => {
  if (!ioInstance) return;

  const recipientIds = [order.customerId];
  if (order.riderId) recipientIds.push(order.riderId);
  if (order.restaurant?.vendorId) recipientIds.push(order.restaurant.vendorId);

  emitToUsers(recipientIds, "order:status-updated", {
    orderId: order.id,
    status: order.status,
    updatedAt: new Date().toISOString(),
    actorRole,
  });
};

export const emitNewOrderToVendor = (order) => {
  if (!ioInstance) return;

  if (order.restaurant?.vendorId) {
    emitToUsers([order.restaurant.vendorId], "order:new", {
      orderId: order.id,
      status: order.status,
      customerName: order.customer?.name,
      totalAmount: order.totalAmount,
      createdAt: new Date().toISOString(),
    });
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

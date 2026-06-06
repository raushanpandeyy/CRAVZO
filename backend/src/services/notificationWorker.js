import { getNotificationQueue } from "./notificationQueue.js";
import {
  notifyOrderStatusChanged as sendOrderStatusNotification,
  notifyVendorNewOrder as sendVendorNotification,
  notifyRiderNewOrder as sendRiderNotification,
} from "./notificationService.js";
import { notifyAdminOrderCreated, notifyAdminOrderStatusChanged } from "./adminOrderAlertService.js";
import { logger } from "../utils/logger.js";

const startNotificationWorker = async () => {
  const queue = getNotificationQueue();

  // Process vendor new-order notifications
  queue.process("vendor-new-order", async (job) => {
    const { order } = job.data;
    await sendVendorNotification(order);
    notifyAdminOrderCreated(order);
  });

  // Process rider new-order notifications
  queue.process("rider-new-order", async (job) => {
    const { order } = job.data;
    await sendRiderNotification(order);
  });

  // Process order status change notifications
  queue.process("order-status-changed", async (job) => {
    const { order, actorRole } = job.data;
    await sendOrderStatusNotification({ order, actorRole });
    notifyAdminOrderStatusChanged({ order, actorRole });
  });

  // Process reject notification (rider rejected an order)
  queue.process("rider-rejected-order", async (job) => {
    const { order, actorRole } = job.data;
    await sendOrderStatusNotification({ order, actorRole });
    notifyAdminOrderStatusChanged({ order, actorRole });
  });

  queue.on("completed", (job) => {
    logger.info(`Notification job ${job.id} (${job.name}) completed`);
  });

  queue.on("failed", (job, error) => {
    logger.warn(`Notification job ${job.id} (${job.name}) failed:`, { error: error.message });
  });

  logger.info("Notification worker started");
};

export { startNotificationWorker };

import { getOrderQueue } from "./orderQueue.js";
import { createPersistedOrder } from "./orderCheckoutService.js";
import { queueNotification } from "./notificationQueue.js";
import { emitNewOrderToVendor } from "./orderSocketService.js";
import { logger } from "../utils/logger.js";

const CONCURRENCY = 5;

const startOrderWorker = async () => {
  const queue = getOrderQueue();

  queue.process("create-order", CONCURRENCY, async (job) => {
    const { customerId, restaurantId, items, address, addressId, paymentMethod, paymentStatus, notes } = job.data;

    logger.info(`Processing order job ${job.id}`, { customerId, restaurantId });

    const order = await createPersistedOrder({
      customerId,
      restaurantId,
      items,
      address,
      addressId,
      paymentMethod,
      paymentStatus,
      notes,
    });

    queueNotification("vendor-new-order", { order });
    queueNotification("rider-new-order", { order });

    emitNewOrderToVendor(order);

    logger.info(`Order ${order.id} created and notifications queued`);
    return order;
  });

  queue.on("completed", (job) => {
    logger.info(`Order job ${job.id} completed`);
  });

  queue.on("failed", (job, error) => {
    logger.warn(`Order job ${job.id} failed:`, { error: error.message });
  });

  queue.on("stalled", (job) => {
    logger.warn(`Order job ${job.id} stalled`);
  });

  queue.on("waiting", (jobId) => {
    logger.debug(`Order job ${jobId} is waiting`);
  });

  logger.info("Order worker started");
};

export { startOrderWorker };

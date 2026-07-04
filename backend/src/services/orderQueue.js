import Queue from "bull";
import { env } from "../config/env.js";

let orderQueue = null;

const getOrderQueue = () => {
  if (orderQueue) return orderQueue;

  const isUpstash = env.REDIS_URL?.startsWith("rediss://");
  const redisOpts = isUpstash ? { tls: {}, keepAlive: 10000, noDelay: true } : { keepAlive: 10000, noDelay: true };

  orderQueue = new Queue("orders", env.REDIS_URL, {
    redis: redisOpts,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
    },
  });

  orderQueue.on("error", (error) => {
    console.error("Order queue error:", error.message);
  });

  return orderQueue;
};

const enqueueOrder = async (orderData) => {
  try {
    const queue = getOrderQueue();
    const job = await queue.add("create-order", orderData);
    return job.id;
  } catch (error) {
    console.error("Failed to enqueue order:", error.message);
    return null;
  }
};

export { getOrderQueue, enqueueOrder };

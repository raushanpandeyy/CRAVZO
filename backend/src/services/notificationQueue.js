import Queue from "bull";
import { env } from "../config/env.js";

// Lazy queue creation — only connects to Redis when first job is added
let notificationQueue = null;

const getNotificationQueue = () => {
  if (notificationQueue) return notificationQueue;

  // Upstash Redis needs TLS for ioredis (Bull's internal driver)
  const isUpstash = env.REDIS_URL?.startsWith("rediss://");
  const redisOpts = isUpstash ? { tls: {}, keepAlive: 10000, noDelay: true } : { keepAlive: 10000, noDelay: true };

  notificationQueue = new Queue("notifications", env.REDIS_URL, {
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

  notificationQueue.on("error", (error) => {
    console.error("Notification queue error:", error.message);
  });

  return notificationQueue;
};

const queueNotification = async (jobName, data) => {
  try {
    const queue = getNotificationQueue();
    await queue.add(jobName, data);
    return true;
  } catch (error) {
    console.error("Failed to queue notification:", error.message);
    return false;
  }
};

export { getNotificationQueue, queueNotification };

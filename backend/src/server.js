import "dotenv/config";
import http from "http";

import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { connectRedis, redisClient } from "./config/redis.js";
import { attachChatSocket } from "./socket/chatSocket.js";
import { ensureIndexes } from "./scripts/ensureIndexes.js";
import { getNotificationQueue } from "./services/notificationQueue.js";
import { getOrderQueue } from "./services/orderQueue.js";
import { markShuttingDown } from "./utils/runtimeState.js";
import { logger } from "./utils/logger.js";

const PORT = env.PORT || process.env.PORT || 8080;

await connectRedis();
ensureIndexes();

const { app } = await import("./app.js");
const server = http.createServer(app);
server.keepAliveTimeout = env.HTTP_KEEP_ALIVE_TIMEOUT_MS;
server.headersTimeout = env.HTTP_HEADERS_TIMEOUT_MS;
server.requestTimeout = env.HTTP_REQUEST_TIMEOUT_MS;

await attachChatSocket(server);

const { startNotificationWorker } = await import("./services/notificationWorker.js");
startNotificationWorker().catch((error) => {
  logger.error("Failed to start notification worker", { error });
});

const { setOrderSocketInstance } = await import("./services/orderSocketService.js");
const { ioInstance } = await import("./socket/chatSocket.js");
if (ioInstance) {
  setOrderSocketInstance(ioInstance);
}

const { startOrderWorker } = await import("./services/orderWorker.js");
startOrderWorker().catch((error) => {
  logger.error("Failed to start order worker", { error });
});

server.listen(PORT, () => {
  logger.info("DODAGO backend running", { port: PORT });
});

const shutdown = async (signal) => {
  logger.warn("Shutdown signal received", { signal });
  markShuttingDown();

  const forceExit = setTimeout(() => {
    logger.error("Graceful shutdown timed out; forcing exit", { signal });
    process.exit(1);
  }, env.SERVER_SHUTDOWN_GRACE_MS);
  forceExit.unref?.();

  await new Promise((resolve) => server.close(resolve));

  const closeTasks = [
    ioInstance ? new Promise((resolve) => ioInstance.close(resolve)) : Promise.resolve(),
    getOrderQueue().close().catch((error) => logger.warn("Order queue close failed", { error })),
    getNotificationQueue().close().catch((error) => logger.warn("Notification queue close failed", { error })),
    redisClient?.isOpen ? redisClient.quit().catch((error) => logger.warn("Redis quit failed", { error })) : Promise.resolve(),
    prisma.$disconnect().catch((error) => logger.warn("Prisma disconnect failed", { error })),
  ];

  await Promise.allSettled(closeTasks);
  clearTimeout(forceExit);
  logger.info("Graceful shutdown complete", { signal });
  process.exit(0);
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

if (env.NODE_ENV === "production" && env.RENDER_EXTERNAL_URL) {
  const PING_INTERVAL_MS = 14 * 60 * 1000;
  setInterval(async () => {
    try {
      await fetch(`${env.RENDER_EXTERNAL_URL}/health`);
      logger.info("Keep-alive ping sent");
    } catch {
      // Ignore ping errors
    }
  }, PING_INTERVAL_MS);
}
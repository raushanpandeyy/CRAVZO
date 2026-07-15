import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { redisClient } from "../config/redis.js";
import { getNotificationQueue } from "../services/notificationQueue.js";
import { getOrderQueue } from "../services/orderQueue.js";
import { getRuntimeState, isShuttingDown } from "../utils/runtimeState.js";

const bytesToMb = (value) => Math.round((value / 1024 / 1024) * 100) / 100;

const getMemorySnapshot = () => {
  const usage = process.memoryUsage();
  return {
    rssMb: bytesToMb(usage.rss),
    heapUsedMb: bytesToMb(usage.heapUsed),
    heapTotalMb: bytesToMb(usage.heapTotal),
    externalMb: bytesToMb(usage.external),
  };
};

const checkDatabase = async () => {
  const startedAt = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true, latencyMs: Date.now() - startedAt };
};

const checkRedis = async () => {
  if (!env.REDIS_URL) return { ok: true, configured: false };
  if (!redisClient?.isReady) return { ok: false, configured: true, reason: "not_ready" };

  const startedAt = Date.now();
  await redisClient.ping();
  return { ok: true, configured: true, latencyMs: Date.now() - startedAt };
};

const getQueueSnapshot = async (queue) => {
  const [waiting, active, delayed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getDelayedCount(),
    queue.getFailedCount(),
  ]);
  return { waiting, active, delayed, failed };
};

const getHealth = (_req, res) => {
  res.status(isShuttingDown() ? 503 : 200).json({
    success: true,
    status: isShuttingDown() ? "shutting_down" : "ok",
    environment: env.NODE_ENV,
    runtime: getRuntimeState(),
  });
};

const getReadiness = async (_req, res) => {
  if (isShuttingDown()) {
    return res.status(503).json({ success: false, status: "shutting_down" });
  }

  const checks = await Promise.allSettled([checkDatabase(), checkRedis()]);
  const database = checks[0].status === "fulfilled" ? checks[0].value : { ok: false, reason: checks[0].reason?.message || "failed" };
  const redis = checks[1].status === "fulfilled" ? checks[1].value : { ok: false, reason: checks[1].reason?.message || "failed" };
  const ok = database.ok && redis.ok;

  return res.status(ok ? 200 : 503).json({
    success: ok,
    status: ok ? "ready" : "not_ready",
    checks: { database, redis },
    runtime: getRuntimeState(),
  });
};

const getMetrics = async (req, res) => {
  if (env.NODE_ENV === "production" && !env.METRICS_TOKEN) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  if (env.METRICS_TOKEN) {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice("Bearer ".length)
      : req.query.token;
    if (token !== env.METRICS_TOKEN) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  }

  const [orderQueue, notificationQueue] = await Promise.allSettled([
    getQueueSnapshot(getOrderQueue()),
    getQueueSnapshot(getNotificationQueue()),
  ]);

  res.status(200).json({
    success: true,
    runtime: getRuntimeState(),
    memory: getMemorySnapshot(),
    eventLoop: {
      activeHandles: process._getActiveHandles?.().length ?? null,
      activeRequests: process._getActiveRequests?.().length ?? null,
    },
    redis: {
      configured: Boolean(env.REDIS_URL),
      ready: Boolean(redisClient?.isReady),
      open: Boolean(redisClient?.isOpen),
    },
    queues: {
      orders: orderQueue.status === "fulfilled" ? orderQueue.value : { error: orderQueue.reason?.message || "unavailable" },
      notifications: notificationQueue.status === "fulfilled" ? notificationQueue.value : { error: notificationQueue.reason?.message || "unavailable" },
    },
  });
};

export { getHealth, getMetrics, getReadiness };
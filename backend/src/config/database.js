import "./env.js";
import { PrismaClient } from "@prisma/client";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

// Fix #4: Configure connection pool explicitly.
// Default Prisma pool = cpuCount connections (typically 3-5).
// With 1000 concurrent requests that is nowhere near enough.
// connection_limit=20 handles concurrent load on a single instance.
// pool_timeout=20 ensures requests fail fast instead of queuing forever.
const getDatabaseUrl = () => {
  const base = env.DATABASE_URL || "";
  if (!base) return base;
  try {
    const url = new URL(base);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", String(env.DATABASE_CONNECTION_LIMIT));
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", String(env.DATABASE_POOL_TIMEOUT_SECONDS));
    }
    return url.toString();
  } catch {
    // If URL parsing fails, return original and let Prisma handle it
    return base;
  }
};

const globalForPrisma = globalThis;
const prismaLogLevels =
  env.NODE_ENV === "development"
    ? [
        { emit: "event", level: "query" },
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ]
    : [
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ];

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: prismaLogLevels,
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    transactionOptions: {
      isolationLevel: "RepeatableRead",
      maxWait: env.DATABASE_TRANSACTION_MAX_WAIT_MS,
      timeout: env.DATABASE_TRANSACTION_TIMEOUT_MS,
    },
  });

if (!globalForPrisma.prismaLogEventsAttached) {
  if (env.NODE_ENV === "development") {
    prisma.$on("query", (event) => {
      logger.info("Database query", {
        durationMs: event.duration,
        query: event.query,
        params: event.params,
        target: event.target,
      });
    });
  }

  prisma.$on("warn", (event) => {
    logger.warn("Database warning", {
      message: event.message,
      target: event.target,
    });
  });

  prisma.$on("error", (event) => {
    logger.error("Database error", {
      message: event.message,
      target: event.target,
    });
  });

  globalForPrisma.prismaLogEventsAttached = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
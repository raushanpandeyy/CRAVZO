import "./env.js";
import { PrismaClient } from "@prisma/client";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

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

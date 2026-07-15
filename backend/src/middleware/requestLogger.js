import { randomUUID } from "crypto";

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const shouldLogSuccessfulRequest = () =>
  env.NODE_ENV !== "production" || Math.random() < env.REQUEST_LOG_SAMPLE_RATE;

const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  const requestId = req.headers["x-request-id"] || randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const logData = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userId: req.user?.sub || null,
    };

    if (durationMs > env.SLOW_REQUEST_THRESHOLD_MS) {
      logger.warn("Slow request", logData);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn("Request failed", logData);
      return;
    }

    if (shouldLogSuccessfulRequest()) {
      logger.info("Request completed", logData);
    }
  });

  next();
};

export { requestLogger };
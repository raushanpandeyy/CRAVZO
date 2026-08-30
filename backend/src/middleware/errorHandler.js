import { ZodError } from "zod";

import { logger } from "../utils/logger.js";

const getErrorCode = (statusCode) => {
  if (statusCode === 400) return "BAD_REQUEST";
  if (statusCode === 401) return "UNAUTHORIZED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 409) return "CONFLICT";
  return statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED";
};

const errorHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    logger.warn("Request validation failed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      errors: error.flatten(),
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_FAILED",
      errors: error.flatten(),
      requestId: req.requestId,
    });
  }

  // Handle Prisma known errors with user-friendly messages
  if (error?.name === "PrismaClientKnownRequestError" || error?.code?.startsWith?.("P")) {
    const prismaCode = error.code;
    logger.error("Prisma error", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      prismaCode,
      error,
    });

    if (prismaCode === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A record with this data already exists.",
        code: "CONFLICT",
        requestId: req.requestId,
      });
    }
    if (prismaCode === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
        code: "NOT_FOUND",
        requestId: req.requestId,
      });
    }
    if (prismaCode === "P2034" || error?.message?.includes("Transaction already closed") || error?.message?.includes("timed out")) {
      return res.status(503).json({
        success: false,
        message: "The server is busy. Please try again in a moment.",
        code: "SERVICE_UNAVAILABLE",
        requestId: req.requestId,
      });
    }

    return res.status(500).json({
      success: false,
      message: "A database error occurred. Please try again.",
      code: "DATABASE_ERROR",
      requestId: req.requestId,
    });
  }

  const statusCode = error.statusCode || error.status || 500;
  const isServerError = statusCode >= 500;
  const exposeMessage = !isServerError || error.expose === true;

  logger[isServerError ? "error" : "warn"]("Request failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error,
    details: error.details || null,
  });

  return res.status(statusCode).json({
    success: false,
    message: exposeMessage ? error.message || "Request failed" : "Internal server error",
    code: error.code || getErrorCode(statusCode),
    details: isServerError ? null : error.details || null,
    requestId: req.requestId,
  });
};

export { errorHandler };

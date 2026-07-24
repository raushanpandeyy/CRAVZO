import { ZodError } from "zod";

import { logger } from "../utils/logger.js";

const getErrorCode = (statusCode) => {
  if (statusCode === 400) {
    return "BAD_REQUEST";
  }

  if (statusCode === 401) {
    return "UNAUTHORIZED";
  }

  if (statusCode === 403) {
    return "FORBIDDEN";
  }

  if (statusCode === 404) {
    return "NOT_FOUND";
  }

  if (statusCode === 409) {
    return "CONFLICT";
  }

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

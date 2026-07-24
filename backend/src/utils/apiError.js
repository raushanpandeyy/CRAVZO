class ApiError extends Error {
  constructor(statusCode, message, details = null, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.expose = options.expose ?? statusCode < 500;
  }
}

export { ApiError };

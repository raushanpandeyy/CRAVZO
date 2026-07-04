const notFoundHandler = (req, res) => {
  const sanitizedUrl = req.originalUrl.replace(/[<>]/g, "");
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${sanitizedUrl}`,
    code: "NOT_FOUND",
    requestId: req.requestId,
  });
};

export { notFoundHandler };

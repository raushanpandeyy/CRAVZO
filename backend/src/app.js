import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

// Fix 1: Gzip compression — 80% bandwidth saving on all JSON responses
// 15KB restaurant list → ~3KB, 45KB restaurant detail → ~9KB
app.use(compression({
  // Only compress responses larger than 1KB (small responses cost more CPU than they save)
  threshold: 1024,
  // Compression level 6 = good balance of speed vs size (default is 6)
  level: 6,
  // Don't compress already-compressed image/media types
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

app.use(
  cors({
    origin: [
      "https://www.cravzo.shop",
      "https://cravzo.shop",
      "http://localhost:5173",
      "https://localhost:5173",
      "http://localhost:5174",
      "https://localhost:5174",
      "http://localhost:4173",
      "https://localhost:4173",
      "https://cravzo-nine.vercel.app",
      "https://cravzo-mj3bnhl8p-raushan-pandeys-projects.vercel.app",
      "https://cravzo-backend.onrender.com",
    ],
    credentials: true,
  })
);

app.use(helmet());
app.use(requestLogger);
// Larger body limit for image upload endpoints — must come BEFORE the global
// limit so requests to /api/users/uploads/* and /api/chat/rooms/* don't get
// rejected by the 100kb default
app.use("/api/users/uploads", express.json({ limit: "10mb" }));
app.use("/api/chat/rooms", express.json({ limit: "10mb" }));

// Max order payload is ~2KB — keep a tight global limit for everything else
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CRAVZO backend is healthy",
    environment: env.NODE_ENV,
  });
});

// Fix 6: HTTP Cache-Control headers for public endpoints
// Browser CDN caches for 5min fresh + 30min stale-while-revalidate — zero round-trips on revisit
app.use("/api/public", (_req, res, next) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
  next();
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };

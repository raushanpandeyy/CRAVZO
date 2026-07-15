import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { getHealth, getMetrics, getReadiness } from "./controllers/healthController.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

// Fix 1: Gzip compression â€” 80% bandwidth saving on all JSON responses
// 15KB restaurant list â†’ ~3KB, 45KB restaurant detail â†’ ~9KB
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
      "https://www.dodago.shop",
      "https://dodago.shop",
      "http://localhost:5173",
      "https://localhost:5173",
      "http://localhost:5174",
      "https://localhost:5174",
      "http://localhost:4173",
      "https://localhost:4173",
      "http://localhost:8081",
      "https://localhost:8081",
      "http://localhost:8082",
      "https://localhost:8082",
      "https://dodago-backend.onrender.com",
    ],
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://www.gstatic.com", "https://www.googletagmanager.com"],
        frameSrc: ["'self'", "https://checkout.razorpay.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.githubusercontent.com"],
        connectSrc: ["'self'", "https://api.razorpay.com", "https://nominatim.openstreetmap.org"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
    hsts: { maxAge: 365 * 24 * 60 * 60, preload: true },
  }),
);
app.use(requestLogger);
// Larger body limit for image upload endpoints â€” must come BEFORE the global
// limit so requests to /api/users/uploads/* and /api/chat/rooms/* don't get
// rejected by the 100kb default
app.use("/api/users/uploads", express.json({ limit: "10mb" }));
app.use(["/api/chats/rooms", "/api/v1/chats/rooms"], express.json({ limit: "10mb" }));

// Max order payload is ~2KB â€” keep a tight global limit for everything else
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

app.get("/health", getHealth);
app.get("/ready", getReadiness);
app.get("/metrics", getMetrics);

// Fix 6: HTTP Cache-Control headers for public endpoints
// Browser CDN caches for 5min fresh + 30min stale-while-revalidate â€” zero round-trips on revisit
app.use("/api/public", (_req, res, next) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
  next();
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };

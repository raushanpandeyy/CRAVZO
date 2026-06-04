import cookieParser from "cookie-parser";
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

app.use(
  cors({
   origin: [
      "https://www.cravzo.shop",
      "https://cravzo.shop",
       "http://localhost:5173",
       "https://localhost:5173",
       "http://localhost:5174",
       "https://localhost:5174",
       // vite preview (npm run preview) uses port 4173
       "http://localhost:4173",
       "https://localhost:4173",
      "https://cravzo-nine.vercel.app",
      "https://cravzo-mj3bnhl8p-raushan-pandeys-projects.vercel.app",
    ],
   credentials: true,
 })
);

app.use(helmet());
app.use(requestLogger);
// Fix #10: 8mb body limit is a DoS vector. Max order payload is ~2KB.
// Keep a tight global limit and only allow larger bodies on upload routes.
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// Larger body limit only for image upload endpoints
app.use("/api/users/uploads", express.json({ limit: "5mb" }));
app.use("/api/chat/rooms", express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CRAVZO backend is healthy",
    environment: env.NODE_ENV,
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };

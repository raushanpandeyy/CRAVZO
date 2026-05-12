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

app.use(
  cors({
   origin: [
  "http://localhost:5173",
  "http://www.cravzo.shop",
  "http://localhost:4173",
  "http://cravzo.shop",
  "http://cravzo-nine.vercel.app"
],
    credentials: true,
  })
);

app.use(helmet());
app.use(requestLogger);
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(cookieParser());

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

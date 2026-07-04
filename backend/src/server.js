import 'dotenv/config';
import http from "http";

import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import { attachChatSocket } from "./socket/chatSocket.js";
import { ensureIndexes } from "./scripts/ensureIndexes.js";

const PORT = env.PORT || process.env.PORT || 8080;

await connectRedis();
ensureIndexes();

const { app } = await import("./app.js");
const server = http.createServer(app);

// Fix #5: attachChatSocket is now async (sets up Redis pub/sub adapter)
await attachChatSocket(server);

// Start background notification worker (Fix 1: Bull queue)
const { startNotificationWorker } = await import("./services/notificationWorker.js");
startNotificationWorker().catch((error) => {
  console.error("Failed to start notification worker:", error.message);
});

// Wire Socket.IO instance to order socket service for real-time order push
const { setOrderSocketInstance } = await import("./services/orderSocketService.js");
const { ioInstance } = await import("./socket/chatSocket.js");
if (ioInstance) {
  setOrderSocketInstance(ioInstance);
}

// Start background order worker (Bull queue for order creation)
const { startOrderWorker } = await import("./services/orderWorker.js");
startOrderWorker().catch((error) => {
  console.error("Failed to start order worker:", error.message);
});

server.listen(PORT, () => {
  console.log(`DODAGO backend running on port ${PORT}`);
});

// Keep-alive ping for Render free tier
// Render spins down after 15min inactivity — self-ping every 14 min prevents cold starts
if (env.NODE_ENV === "production" && env.RENDER_EXTERNAL_URL) {
  const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
  setInterval(async () => {
    try {
      await fetch(`${env.RENDER_EXTERNAL_URL}/health`);
      console.log("Keep-alive ping sent");
    } catch {
      // Ignore ping errors
    }
  }, PING_INTERVAL_MS);
}

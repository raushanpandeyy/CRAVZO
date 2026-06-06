import { createClient } from "redis";

import { env } from "./env.js";

const redisClient = env.REDIS_URL
  ? createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            console.error("Redis: max reconnect attempts reached");
            return new Error("Redis max reconnect attempts");
          }
          // Exponential backoff: 500ms, 1s, 2s, 4s, 8s... max 30s
          const delay = Math.min(Math.pow(2, retries) * 500, 30000);
          console.warn(`Redis: reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
    })
  : null;

let redisConnectionPromise = null;

const connectRedis = async () => {
  if (!redisClient) {
    return null;
  }

  if (redisClient.isOpen) {
    return redisClient;
  }

  if (redisConnectionPromise) {
    return redisConnectionPromise;
  }

  redisClient.on("error", (error) => {
    if (error.code === "ECONNREFUSED" || error.code === "NR_CLOSED") return;
    console.error("Redis connection error:", error.message);
  });

  redisConnectionPromise = redisClient
    .connect()
    .then(() => {
      console.log("Redis connected");
      return redisClient;
    })
    .catch((error) => {
      redisConnectionPromise = null;
      console.error("Redis connection failed:", error.message);
      return null;
    });

  return redisConnectionPromise;
};

const sendRedisCommand = async (args) => {
  const client = await connectRedis();

  if (!client) {
    throw new Error("Redis client is not available");
  }

  return client.sendCommand(args);
};

export { connectRedis, redisClient, sendRedisCommand };

import { createClient } from "redis";

import { env } from "./env.js";

const redisClient = env.REDIS_URL
  ? createClient({
      url: env.REDIS_URL,
      commandsQueueMaxLength: 1000,
      disableOfflineQueue: true,
      socket: {
        connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
        reconnectStrategy: (retries) => {
          if (retries > env.REDIS_MAX_RECONNECT_RETRIES) {
            console.error("Redis: max reconnect attempts reached");
            return new Error("Redis max reconnect attempts");
          }
          const delay = Math.min(Math.pow(2, retries) * 200, 5000);
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

  if (!redisClient.__errorHandlerAttached) {
    redisClient.on("error", (error) => {
      if (error.code === "ECONNREFUSED" || error.code === "NR_CLOSED") return;
      console.error("Redis connection error:", error.message);
    });
    redisClient.__errorHandlerAttached = true;
  }

  redisConnectionPromise = Promise.race([
    redisClient.connect(),
    new Promise((resolve) => setTimeout(() => resolve(null), env.REDIS_CONNECT_TIMEOUT_MS)),
  ])
    .then((client) => {
      if (!client) {
        redisConnectionPromise = null;
        console.error("Redis connection timed out");
        return null;
      }
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

  return Promise.race([
    client.sendCommand(args),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis command timed out")), env.REDIS_COMMAND_TIMEOUT_MS),
    ),
  ]);
};

export { connectRedis, redisClient, sendRedisCommand };
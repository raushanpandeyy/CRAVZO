import { createClient } from "redis";

import { env } from "./env.js";

const redisClient = env.REDIS_URL
  ? createClient({
      url: env.REDIS_URL,
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

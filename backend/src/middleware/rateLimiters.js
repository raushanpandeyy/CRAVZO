import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import { connectRedis, redisClient, sendRedisCommand } from "../config/redis.js";
import { env } from "../config/env.js";

const createRateLimitMessage = (message) => ({
  success: false,
  message,
});

let redisConnected = false;

const ensureRedisConnected = async () => {
  if (redisConnected && redisClient?.isReady) return;
  try {
    await connectRedis();
    redisConnected = Boolean(redisClient?.isReady);
  } catch {
    redisConnected = false;
  }
};

const createStore = (prefix) => {
  if (!redisClient || env.NODE_ENV === "test") {
    return undefined;
  }

  return new RedisStore({
    prefix,
    sendCommand: async (...args) => {
      if (!redisConnected || !redisClient.isReady) {
        await ensureRedisConnected();
        if (!redisClient?.isReady) {
          throw new Error("Redis unavailable");
        }
      }
      return sendRedisCommand(args);
    },
  });
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore("rl:login:"),
  message: createRateLimitMessage("Too many login attempts. Please try again after 15 minutes."),
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 4,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase?.();
    return email ? `email:${email}` : ipKeyGenerator(req);
  },
  store: createStore("rl:otp:"),
  message: createRateLimitMessage("Too many OTP requests. Please try again after 10 minutes."),
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase?.();
    return email ? `email:${email}` : ipKeyGenerator(req);
  },
  store: createStore("rl:otp-verify:"),
  message: createRateLimitMessage("Too many OTP verification attempts. Please try again after 10 minutes."),
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore("rl:password-reset:"),
  message: createRateLimitMessage("Too many password reset attempts. Please try again after 15 minutes."),
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore("rl:payment:"),
  message: createRateLimitMessage("Too many payment requests. Please try again later."),
});

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  keyGenerator: (req) => req.user?.sub,
  store: createStore("rl:order:"),
  message: createRateLimitMessage("Too many orders placed. Please wait a minute before trying again."),
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore("rl:public:"),
  message: createRateLimitMessage("Too many requests. Please slow down."),
});

const firebaseAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore("rl:firebase-auth:"),
  message: createRateLimitMessage("Too many authentication attempts. Please try again after 15 minutes."),
});

export {
  firebaseAuthLimiter,
  loginLimiter,
  orderLimiter,
  otpLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
  paymentLimiter,
  publicLimiter,
};

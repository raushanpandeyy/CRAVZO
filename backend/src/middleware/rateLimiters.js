import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import { redisClient, sendRedisCommand } from "../config/redis.js";

const createRateLimitMessage = (message) => ({
  success: false,
  message,
});

const createStore = (prefix) => {
  if (!redisClient?.isOpen) {
    // Fallback to memory store when Redis is down — rate limits never silently disable
    return undefined;
  }

  return new RedisStore({
    prefix,
    sendCommand: (...args) => sendRedisCommand(args),
  });
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:login:"),
  message: createRateLimitMessage("Too many login attempts. Please try again after 15 minutes."),
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 4,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:otp:"),
  message: createRateLimitMessage("Too many OTP requests. Please try again after 10 minutes."),
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:otp-verify:"),
  message: createRateLimitMessage("Too many OTP verification attempts. Please try again after 10 minutes."),
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:password-reset:"),
  message: createRateLimitMessage("Too many password reset attempts. Please try again after 15 minutes."),
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:payment:"),
  message: createRateLimitMessage("Too many payment requests. Please try again later."),
});

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub,
  store: createStore("rl:order:"),
  message: createRateLimitMessage("Too many orders placed. Please wait a minute before trying again."),
});

export {
  loginLimiter,
  orderLimiter,
  otpLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
  paymentLimiter,
};

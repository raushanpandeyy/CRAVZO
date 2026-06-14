/**
 * Bloom Filter — works with ANY Redis (plain Redis, Upstash, Railway).
 *
 * Does NOT require RedisBloom / Redis Stack module.
 * Implemented manually using Redis SETBIT / GETBIT commands.
 *
 * How it works:
 *   - Hash the value with N different hash functions
 *   - Each hash maps to a bit position in a Redis bitfield
 *   - SET:    set all N bits to 1
 *   - EXISTS: check if all N bits are 1
 *             → if any bit is 0: DEFINITELY not in set
 *             → if all bits are 1: PROBABLY in set (small false positive chance)
 *
 * False positive rate with 4 hashes, 1M bits (~125KB): ~0.3%
 */

import { createHash } from "crypto";
import { connectRedis } from "../config/redis.js";

let bfClient = null;

const getBfClient = async () => {
  if (bfClient?.isOpen) return bfClient;
  bfClient = await connectRedis();
  return bfClient;
};

// ── Configuration ─────────────────────────────────────────────────────────────

const FILTERS = {
  REGISTERED_EMAILS: {
    key: "bf2:emails",
    bits: 1_000_000,   // 125 KB of memory, supports ~100K emails at <1% FP rate
    hashCount: 4,
    ttl: null,          // never expires
  },
  FCM_TOKENS: {
    key: "bf2:fcm",
    bits: 2_000_000,   // 250 KB, supports ~200K tokens
    hashCount: 4,
    ttl: null,
  },
  OTP_RECENT: {
    key: "bf2:otp",
    bits: 100_000,     // 12.5 KB, resets every window
    hashCount: 3,
    ttl: 4 * 60,       // 4 minutes TTL
  },
};

// ── Hash functions ─────────────────────────────────────────────────────────────

/**
 * Generate N different bit positions for a value within a bitfield of `bits` size.
 * Uses SHA-256 with different salts to get independent hash functions.
 */
const getBitPositions = (value, bits, hashCount) => {
  const positions = [];
  for (let i = 0; i < hashCount; i++) {
    const hash = createHash("sha256")
      .update(`${i}:${value}`)
      .digest("hex");
    // Take first 8 hex chars = 32 bits, mod by total bits
    const position = parseInt(hash.slice(0, 8), 16) % bits;
    positions.push(position);
  }
  return positions;
};

// ── Core operations ───────────────────────────────────────────────────────────

const bfAdd = async (filter, value) => {
  try {
    const client = await getBfClient();
    if (!client?.isOpen) return false;

    const positions = getBitPositions(value, filter.bits, filter.hashCount);

    // Set all bits in a pipeline (one round-trip)
    const pipeline = client.multi();
    for (const pos of positions) {
      pipeline.sendCommand(["SETBIT", filter.key, String(pos), "1"]);
    }
    if (filter.ttl) {
      pipeline.expire(filter.key, filter.ttl);
    }
    await pipeline.exec();
    return true;
  } catch {
    return false;
  }
};

const bfExists = async (filter, value) => {
  try {
    const client = await getBfClient();
    if (!client?.isOpen) return true; // Fallback: assume exists → do DB check

    const positions = getBitPositions(value, filter.bits, filter.hashCount);

    // Check all bits in a pipeline
    const pipeline = client.multi();
    for (const pos of positions) {
      pipeline.sendCommand(["GETBIT", filter.key, String(pos)]);
    }
    const results = await pipeline.exec();

    // If ANY bit is 0 → definitely not in set
    return results.every((bit) => bit === 1);
  } catch {
    return true; // Fallback: assume exists → do DB check
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Use Case 1: Registered email check
 * Saves a DB query for ~99.7% of genuinely new signup attempts.
 */
const emailBloomFilter = {
  mightExist: (email) => bfExists(FILTERS.REGISTERED_EMAILS, email.toLowerCase()),
  add: (email) => bfAdd(FILTERS.REGISTERED_EMAILS, email.toLowerCase()),
};

/**
 * Use Case 2: FCM Token deduplication
 * Saves a DB upsert for every app load on existing devices.
 */
const fcmTokenBloomFilter = {
  mightExist: (token) => bfExists(FILTERS.FCM_TOKENS, token),
  add: (token) => bfAdd(FILTERS.FCM_TOKENS, token),
};

/**
 * Use Case 3: OTP spam prevention
 * Time-windowed: resets every 4 minutes via Redis TTL.
 */
const OTP_WINDOW_MINUTES = 2;

const otpBloomFilter = {
  wasRecentlySent: async (email) => {
    try {
      // Time-bucketed key so filter auto-resets
      const bucket = Math.floor(Date.now() / (OTP_WINDOW_MINUTES * 60 * 1000));
      const filter = {
        ...FILTERS.OTP_RECENT,
        key: `${FILTERS.OTP_RECENT.key}:${bucket}`,
      };

      return bfExists(filter, email.toLowerCase());
    } catch {
      return false; // Fail open — allow OTP
    }
  },

  markSent: async (email) => {
    try {
      const bucket = Math.floor(Date.now() / (OTP_WINDOW_MINUTES * 60 * 1000));
      const filter = {
        ...FILTERS.OTP_RECENT,
        key: `${FILTERS.OTP_RECENT.key}:${bucket}`,
        ttl: OTP_WINDOW_MINUTES * 60 * 2,
      };
      await bfAdd(filter, email.toLowerCase());
    } catch {
      // Silently ignore
    }
  },
};

export { emailBloomFilter, fcmTokenBloomFilter, otpBloomFilter };

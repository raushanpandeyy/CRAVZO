import crypto from "node:crypto";

// Static salt so the same IP always produces the same hash on this server.
// Rotating this salt invalidates prior hashes (acceptable — they're for
// fraud correlation, not lifelong identity).
const SALT = process.env.FINGERPRINT_SALT || "cravzo-dpdp-salt-v1";

// SHA-256 of (rawIp + salt). Raw IP is NEVER persisted to DB — only the hash.
// This keeps the value useful for correlation while protecting privacy under
// DPDP Act storage-limitation principles.
const hashIp = (rawIp) => {
  if (!rawIp || typeof rawIp !== "string") return null;
  return crypto.createHash("sha256").update(`${SALT}:${rawIp}`).digest("hex");
};

// Normalise Express `req.ip` (already strips IPv6 ::ffff: prefix on most setups
// via `trust proxy`, but be defensive in case).
const deriveIpFromRequest = (req) => {
  const direct = req?.ip || req?.socket?.remoteAddress || null;
  if (!direct) return null;
  return direct.replace(/^::ffff:/, "");
};

// Detect likely same-device (fraud) signal for a new signup with the given
// fingerprint hash. Returns one of:
//   - { suspect: false }                      → fresh / unique enough
//   - { suspect: true, reason }               → 2+ prior users on this fingerprint
//   - { block: true, reason }                 → >= 25 prior users (definitely abuse)
const evaluateFingerprint = async (prismaClient, fingerprintHash, ipHash) => {
  if (!fingerprintHash) return { suspect: false };

  // Count other users already mapped to this fingerprint hash
  const fpUsers = await prismaClient.deviceFingerprint.count({
    where: { fingerprintHash },
  });

  if (fpUsers >= 25) {
    return {
      block: true,
      reason: "Too many accounts share this device. Please contact support.",
    };
  }

  if (fpUsers >= 2) {
    return {
      suspect: true,
      reason: "Device fingerprint already associated with existing accounts",
    };
  }

  // Also weaken trust when the same IP hash is seen on many accounts. VPNs may
  // cause legitimate collisions so this is a soft signal only (no hard block).
  if (ipHash) {
    const ipCount = await prismaClient.deviceFingerprint.count({
      where: { ipHash },
    });
    if (ipCount >= 8) {
      return {
        suspect: true,
        reason: "Network address shared across many prior signups",
      };
    }
  }

  return { suspect: false };
};

export { deriveIpFromRequest, evaluateFingerprint, hashIp };
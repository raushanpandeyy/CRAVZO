import { randomBytes } from "node:crypto";

import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

// ==================== CONFIG ====================
// Milestone tiers. Threshold rules differ by tier: Tier 1 needs verified signups plus at least one paid-qualified referral; Tier 2 needs paid-qualified referrals. rewardType drives how the reward is applied
// to the next paid order.
//
//  - FREE_DELIVERY: covers up to rewardValue of delivery fee on next order.
//  - FLAT_DISCOUNT: flat discount up to rewardValue, gated by minOrderValue.
//
// Voucher validity (expiresAt) is set on issue; see issueMilestone.
const MILESTONES = [
  {
    tier: 1,
    threshold: 3,
    minQualifiedReferrals: 1,
    qualificationMode: "VERIFIED_WITH_ONE_PAID",
    rewardType: "FREE_DELIVERY",
    rewardValue: 60, // ₹60 covers base delivery for most slabs
    validityDays: 30,
  },
  {
    tier: 2,
    threshold: 5,
    minQualifiedReferrals: 5,
    qualificationMode: "ALL_PAID",
    rewardType: "FLAT_DISCOUNT",
    rewardValue: 200,
    minOrderValue: 250,
    validityDays: 30,
  },
];

// Existing single-sided ₹100 wallet bonus is removed. Only milestone vouchers
// are issued to the referrer now. Referee is incentivised by their own signup
// flow later (out of scope for this version).
const LEGACY_REFERRAL_BONUS = 100; // retained only for legacy stats display

// ==================== CODE GENERATION ====================
// Deterministic, opaque referral code derived from the user id.
// Avoids collisions because cuid ids are unique.
const generateReferralCode = (userId) => {
  const suffix = userId.replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase();
  return `CRAVZO${suffix}`;
};

// Lazily create the user's referral code on first lookup.
const ensureReferralCode = async (tx, userId) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user?.referralCode) return user.referralCode;

  const code = generateReferralCode(userId);

  try {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { referralCode: code },
      select: { referralCode: true },
    });
    return updated.referralCode;
  } catch (err) {
    // Race condition: another concurrent request set the code first.
    if (err?.code === "P2002") {
      const refreshed = await tx.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });
      return refreshed?.referralCode || code;
    }
    throw err;
  }
};

// Unique voucher code for a milestone reward (idempotent-safe via unique index).
const generateVoucherCode = (userId, tier) => {
  const uidToken = (userId || "").slice(-4).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `CRAV-${uidToken}-T${tier}-${rand}`;
};

// ==================== SIGNUP-TIME REFERRAL CREATION ====================
// Called from authController at OTP verification, when the new user signed up
// using a ref=CODE. Creates a Referral record with status PENDING and stores
// device fingerprint + ip hash on it for later anti-fraud evaluation.
//
// `suspectHint` triggers an immediate SUSPECT status instead of the normal
// PENDING→OTP_VERIFIED→COMPLETED flow. SUSPECT referrals are visibly flagged
// for admin review and never count toward milestone issuance automatically.
const createReferralAtSignup = async ({ referredUserId, referralCode, fingerprintHash, ipHash, suspectHint, suspectReason }) => {
  if (!referralCode) return null;

  const code = String(referralCode).trim().toUpperCase();

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, status: true },
  });

  if (!referrer) {
    logger.warn("Referral signup with unknown code", { code });
    return null;
  }

  if (referrer.id === referredUserId) {
    // Self-referral attempt — silently ignore.
    logger.warn("Self-referral attempt blocked", { userId: referredUserId });
    return null;
  }

  // Already-applied guard (1:M relation from User.referralReceived is unique).
  const existing = await prisma.referral.findUnique({
    where: { referredId: referredUserId },
    select: { id: true },
  });
  if (existing) return existing;

  // Circular referral guard — block if the referrer was previously referred
  // BY this new user (edge case: A referred B during onboarding, now B is
  // signing up using A's code to refer A back).
  const circularCheck = await prisma.referral.findFirst({
    where: { referrerId: referredUserId, referredId: referrer.id },
    select: { id: true },
  });
  if (circularCheck) {
    logger.warn("Circular referral attempt blocked at signup", {
      referredUserId,
      referrerId: referrer.id,
    });
    return null;
  }

  const status = suspectHint ? "SUSPECT" : "OTP_VERIFIED";

  const created = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: referredUserId,
      status,
      referredFingerprintHash: fingerprintHash || null,
      referredIpHash: ipHash || null,
      suspectFlag: Boolean(suspectHint),
      suspectReason: suspectHint ? suspectReason : null,
    },
  });

  await issueMilestonesForUser(referrer.id);
  return created;
};

// ==================== POST-QUALIFICATION HOOK ====================
// Called from orderCheckoutService after a successfully-persisted order.
//
//  - Marks the referred user's pending Referral as COMPLETED with paidOrderId,
//    only if the order's paymentStatus was PAID (COD is intentionally excluded
//    since it can be refused at delivery).
//  - Then verifies milestone thresholds for the referrer and issues vouchers
//    for any newly-earned tier that isn't already issued.
//
// Idempotency:
//  - Referral.status COMPLETED is guarded by updateMany WHERE status IN
//    ('OTP_VERIFIED','PENDING') so re-runs no-op.
//  - Milestone issuance checks existing ReferralMilestone owned by user+tier
//    before inserting.
const markReferredQualifiedAndIssueMilestones = async ({ customerId, orderId, paymentStatus }) => {
  if (paymentStatus !== "PAID") return;

  const referral = await prisma.referral.findUnique({
    where: { referredId: customerId },
    select: { id: true, referrerId: true, status: true },
  });

  if (!referral) return;
  if (referral.status === "COMPLETED") return; // already qualified once
  if (referral.status === "SUSPECT") return; // pending admin review

  const updated = await prisma.referral.updateMany({
    where: { id: referral.id, status: { in: ["OTP_VERIFIED", "PENDING"] } },
    data: { status: "COMPLETED", paidOrderId: orderId, completedAt: new Date() },
  });

  if (updated.count === 0) return;

  await issueMilestonesForUser(referral.referrerId);
};

// ==================== MILESTONE ISSUANCE ====================
// For each configured tier, if the user meets that tier's rule and no voucher exists, issue a fresh voucher.
const issueMilestonesForUser = async (referrerId) => {
  const [verifiedCount, completedCount] = await Promise.all([
    prisma.referral.count({
      where: { referrerId, status: { in: ["OTP_VERIFIED", "COMPLETED"] } },
    }),
    prisma.referral.count({
      where: { referrerId, status: "COMPLETED" },
    }),
  ]);

  // Fetch all already-issued tiers in ONE query instead of per-tier inside loop
  const issuedTiers = await prisma.referralMilestone.findMany({
    where: { userId: referrerId },
    select: { tier: true },
  });
  const issuedTierSet = new Set(issuedTiers.map((m) => m.tier));

  for (const tier of MILESTONES) {
    const hasEnoughVerified = verifiedCount >= tier.threshold;
    const hasEnoughQualified = completedCount >= (tier.minQualifiedReferrals || tier.threshold);
    if (!hasEnoughVerified || !hasEnoughQualified) continue;

    // Skip tiers the user has already earned (any status = ISSUED/REDEEMED/EXPIRED)
    if (issuedTierSet.has(tier.tier)) continue;

    const expiresAt = new Date(Date.now() + tier.validityDays * 24 * 60 * 60 * 1000);

    try {
      const milestone = await prisma.referralMilestone.create({
        data: {
          userId: referrerId,
          tier: tier.tier,
          rewardType: tier.rewardType,
          rewardValue: tier.rewardValue,
          voucherCode: generateVoucherCode(referrerId, tier.tier),
          status: "ISSUED",
          expiresAt,
        },
      });
      logger.info("Referral milestone issued", {
        referrerId,
        tier: tier.tier,
        voucher: milestone.voucherCode,
      });
    } catch (err) {
      // Voucher code collision — retry once with a fresh token.
      if (err?.code === "P2002") {
        await prisma.referralMilestone.create({
          data: {
            userId: referrerId,
            tier: tier.tier,
            rewardType: tier.rewardType,
            rewardValue: tier.rewardValue,
            voucherCode: generateVoucherCode(referrerId, tier.tier) + "R",
            status: "ISSUED",
            expiresAt,
          },
        });
      } else {
        throw err;
      }
    }
  }
};

// ==================== ADMIN-LEVEL RETRO-ACTIVATION ====================
// Called once after migration to grant good-will Tier 1 vouchers to existing
// referrers who already had COMPLETED referrals before the milestone system
// shipped. Safe to call multiple times — idempotent via `issueMilestonesForUser`.
const retroactivelyIssueMilestonesForAllReferrers = async () => {
  const referrers = await prisma.referral.groupBy({
    by: ["referrerId"],
    where: { status: "COMPLETED" },
    _count: { _all: true },
  });
  for (const r of referrers) {
    await issueMilestonesForUser(r.referrerId);
  }
  return referrers.length;
};

// ==================== VOUCHER REDEMPTION ====================
// Validates a voucher for a customer pre-checkout and returns the computed
// discount amount + the budget bucket it consumes. The actual REDEEMED status
// flip happens inside orderCheckoutService's $transaction (so the order
// creation + voucher redemption are atomic).
//
// Returns null when invalid / expired / not owned.
const previewVoucher = async ({ customerId, voucherCode, draftSubtotal, draftDeliveryFee }) => {
  if (!voucherCode) return null;
  const code = String(voucherCode).trim().toUpperCase();

  const voucher = await prisma.referralMilestone.findUnique({
    where: { voucherCode: code },
  });

  if (!voucher) return null;
  if (voucher.userId !== customerId) return null;
  if (voucher.status !== "ISSUED") return null;
  if (voucher.expiresAt < new Date()) return null;

  const tierConfig = MILESTONES.find((m) => m.tier === voucher.tier);
  const minOrderValue = tierConfig?.minOrderValue || 0;
  if (draftSubtotal < minOrderValue) return null;

  let discount = 0;
  if (voucher.rewardType === "FREE_DELIVERY") {
    const cap = Number(voucher.rewardValue);
    discount = Math.min(cap, Number(draftDeliveryFee || 0));
  } else if (voucher.rewardType === "FLAT_DISCOUNT") {
    const cap = Number(voucher.rewardValue);
    discount = Math.min(cap, Number(draftSubtotal || 0));
  }

  return {
    voucherId: voucher.id,
    voucherCode: voucher.voucherCode,
    rewardType: voucher.rewardType,
    rewardValue: Number(voucher.rewardValue),
    discount: Number(discount.toFixed(2)),
    minOrderValue,
  };
};

// Flip a voucher to REDEEMED inside the order creation transaction. Called
// by orderCheckoutService with the tx client so it commits atomically with
// the order row. Returns nothing useful — failure should abort the order.
const redeemVoucherInTx = async (tx, { voucherCode, orderId }) => {
  if (!voucherCode) return null;
  const code = String(voucherCode).trim().toUpperCase();

  // Atomic guard: only REDEEM if currently ISSUED (prevents double-spend).
  const result = await tx.referralMilestone.updateMany({
    where: { voucherCode: code, status: "ISSUED" },
    data: {
      status: "REDEEMED",
      redeemedAt: new Date(),
      redeemedOrderId: orderId,
    },
  });

  if (result.count === 0) {
    throw new Error("Referral voucher could not be redeemed (expired/used/invalid)");
  }
  return result;
};

// ==================== STATS ====================
// Expanded for the new model. Web frontend consumes this for the Refer & Earn
// dashboard.
const getMyReferralStats = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, walletBalance: true },
  });

  const referralCode = user?.referralCode || (await ensureReferralCode(prisma, userId));

  const [pendingCount, verifiedCount, suspectCount, completedCount, vouchers] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId, status: { in: ["PENDING", "OTP_VERIFIED"] } } }),
    prisma.referral.count({ where: { referrerId: userId, status: { in: ["OTP_VERIFIED", "COMPLETED"] } } }),
    prisma.referral.count({ where: { referrerId: userId, status: "SUSPECT" } }),
    prisma.referral.count({ where: { referrerId: userId, status: "COMPLETED" } }),
    prisma.referralMilestone.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      take: 50,
    }),
  ]);

  const hasEarnedTier = (tier) =>
    verifiedCount >= tier.threshold && completedCount >= (tier.minQualifiedReferrals || tier.threshold);
  const nextMilestone = MILESTONES.find((m) => !hasEarnedTier(m)) || null;

  return {
    referralCode,
    verifiedReferrals: verifiedCount,
    qualifiedReferrals: completedCount,
    pendingReferrals: pendingCount,
    suspectReferrals: suspectCount,
    nextMilestone: nextMilestone
      ? {
          tier: nextMilestone.tier,
          threshold: nextMilestone.threshold,
          rewardType: nextMilestone.rewardType,
          rewardValue: nextMilestone.rewardValue,
          qualificationMode: nextMilestone.qualificationMode,
          minQualifiedReferrals: nextMilestone.minQualifiedReferrals || nextMilestone.threshold,
          verifiedProgress: Math.min(verifiedCount, nextMilestone.threshold),
          qualifiedProgress: Math.min(completedCount, nextMilestone.minQualifiedReferrals || nextMilestone.threshold),
          remainingVerified: Math.max(0, nextMilestone.threshold - verifiedCount),
          remainingQualified: Math.max(0, (nextMilestone.minQualifiedReferrals || nextMilestone.threshold) - completedCount),
        }
      : null,
    milestonesConfig: MILESTONES.map((m) => ({
      tier: m.tier,
      threshold: m.threshold,
      rewardType: m.rewardType,
      rewardValue: m.rewardValue,
      minOrderValue: m.minOrderValue || null,
      qualificationMode: m.qualificationMode,
      minQualifiedReferrals: m.minQualifiedReferrals || m.threshold,
    })),
    vouchers: vouchers.map((v) => ({
      id: v.id,
      tier: v.tier,
      rewardType: v.rewardType,
      rewardValue: Number(v.rewardValue),
      voucherCode: v.voucherCode,
      status: v.status,
      expiresAt: v.expiresAt,
      issuedAt: v.issuedAt,
      redeemedAt: v.redeemedAt,
    })),
    walletBalance: Number(user?.walletBalance || 0),
  };
};

// ==================== LEGACY POST-SIGNUP APPLY ====================
// Some historical flows let users apply a referral code AFTER signup. The new
// signup-immediate capture path (createReferralAtSignup) is preferred, but we
// keep this around so legacy API callers (mobile app) don't error. Returns a
// legacy-ish payload describing the result.
//
// FRAUD GUARDS (applied strictly):
//  1. referredId @unique  — one referral per user, ever (DB + app level).
//  2. CUSTOMER-only       — riders/vendors cannot earn referral rewards.
//  3. No prior orders     — user must not have placed any order yet; prevents
//                           existing active customers from farming rewards.
//  4. Account age gate    — account must be < REFERRAL_APPLY_WINDOW_DAYS old;
//                           stops long-dormant accounts from retroactively
//                           applying codes.
//  5. Self-referral block — cannot use own code.
//  6. Circular referral   — if the referrer was themselves referred by the
//                           current user (A→B, now B wants to use A's code),
//                           block it explicitly.
const REFERRAL_APPLY_WINDOW_DAYS = 7; // must apply within 7 days of account creation

const applyReferralCode = async (userId, rawCode) => {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) throw new Error("Referral code is required");

  // ── Guard 1 & 2: fetch the calling user's role, creation date ──────────
  const callingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, createdAt: true },
  });
  if (!callingUser) throw new Error("User not found");

  // Guard 2 — CUSTOMER only
  if (callingUser.role !== "CUSTOMER") {
    throw new Error("Referral rewards are only available for customer accounts");
  }

  // Guard 4 — account age
  const accountAgeDays = (Date.now() - new Date(callingUser.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (accountAgeDays > REFERRAL_APPLY_WINDOW_DAYS) {
    throw new Error(
      `Referral codes can only be applied within ${REFERRAL_APPLY_WINDOW_DAYS} days of account creation`,
    );
  }

  // Guard 3 — no prior orders placed
  const orderCount = await prisma.order.count({
    where: { customerId: userId },
  });
  if (orderCount > 0) {
    throw new Error("Referral codes cannot be applied once you have already placed an order");
  }

  // ── Guard 1: already has a referral record ──────────────────────────────
  const existing = await prisma.referral.findUnique({
    where: { referredId: userId },
    select: { id: true, status: true, referrerId: true },
  });
  if (existing) {
    return {
      alreadyApplied: true,
      status: existing.status,
      bonusAmount: 0,
      referrerId: existing.referrerId,
    };
  }

  // ── Resolve referrer ────────────────────────────────────────────────────
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, status: true },
  });
  if (!referrer) throw new Error("Invalid referral code");

  // Guard 5 — self-referral
  if (referrer.id === userId) throw new Error("You cannot use your own referral code");

  // Guard 6 — circular referral: check if the referrer was previously referred
  // BY the current user (A referred B, now B is trying to refer A back).
  const circularCheck = await prisma.referral.findFirst({
    where: { referrerId: userId, referredId: referrer.id },
    select: { id: true },
  });
  if (circularCheck) {
    throw new Error("Referral not allowed: circular referral detected");
  }

  // ── All guards passed — create the referral ─────────────────────────────
  const created = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: userId,
      status: "OTP_VERIFIED",
      bonusAmount: 0,
    },
  });

  // Check if this new referral pushes the referrer past a milestone threshold.
  await issueMilestonesForUser(referrer.id);

  return {
    alreadyApplied: false,
    status: created.status,
    bonusAmount: 0,
    referrerId: created.referrerId,
  };
};

export {
  LEGACY_REFERRAL_BONUS,
  MILESTONES,
  applyReferralCode,
  createReferralAtSignup,
  ensureReferralCode,
  generateReferralCode,
  getMyReferralStats,
  issueMilestonesForUser,
  markReferredQualifiedAndIssueMilestones,
  previewVoucher,
  redeemVoucherInTx,
  retroactivelyIssueMilestonesForAllReferrers,
};

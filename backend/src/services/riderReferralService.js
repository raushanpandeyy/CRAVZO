import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

// ==================== STAGE CONFIG ====================
// Stages are CUMULATIVE order counts by the referred rider.
// Payouts are ADDITIVE — each stage pays on top of the previous.
export const RIDER_REFERRAL_STAGES = [
  { stage: 1, ordersRequired: 35, payout: 300 },
  { stage: 2, ordersRequired: 50, payout: 300 },
  { stage: 3, ordersRequired: 75, payout: 400 },
];

export const RIDER_REFERRAL_TOTAL = RIDER_REFERRAL_STAGES.reduce((s, t) => s + t.payout, 0); // 1000

// ── helpers ──────────────────────────────────────────────────────────────────

const serializeRiderReferral = (rr) => {
  const stages = RIDER_REFERRAL_STAGES.map((s) => {
    const paidAtKey = `stage${s.stage}PaidAt`;
    return {
      stage: s.stage,
      ordersRequired: s.ordersRequired,
      payout: s.payout,
      unlocked: Boolean(rr[paidAtKey]),
      unlockedAt: rr[paidAtKey] || null,
    };
  });
  return {
    id: rr.id,
    referrerId: rr.referrerId,
    referredId: rr.referredId,
    referredOrderCount: rr.referredOrderCount,
    totalPaid: rr.totalPaid,
    createdAt: rr.createdAt,
    stages,
    // progress toward next unpaid stage
    nextStage: stages.find((s) => !s.unlocked) || null,
    referrer: rr.referrer
      ? { id: rr.referrer.id, name: rr.referrer.name, phone: rr.referrer.phone }
      : undefined,
    referred: rr.referred
      ? { id: rr.referred.id, name: rr.referred.name, phone: rr.referred.phone, status: rr.referred.status }
      : undefined,
  };
};

// ==================== CREATE AT SIGNUP ====================
// Called from authController.captureSignupDevice when a new RIDER signs up
// with an existing rider's referral code.
export const createRiderReferralAtSignup = async ({ referredUserId, referralCode }) => {
  if (!referralCode) return null;
  const code = String(referralCode).trim().toUpperCase();

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, role: true, status: true },
  });

  if (!referrer) {
    logger.warn("Rider referral signup with unknown code", { code });
    return null;
  }

  // Only RIDER referrers count for this program
  if (referrer.role !== "RIDER") {
    logger.warn("Rider referral code belongs to a non-rider — skipping", { code, role: referrer.role });
    return null;
  }

  if (referrer.id === referredUserId) {
    logger.warn("Rider self-referral blocked", { userId: referredUserId });
    return null;
  }

  // Idempotency — a rider can only be referred once
  const existing = await prisma.riderReferral.findUnique({
    where: { referredId: referredUserId },
    select: { id: true },
  });
  if (existing) return existing;

  // Circular guard — referred rider previously referred the referrer
  const circular = await prisma.riderReferral.findFirst({
    where: { referrerId: referredUserId, referredId: referrer.id },
    select: { id: true },
  });
  if (circular) {
    logger.warn("Circular rider referral blocked", { referredUserId, referrerId: referrer.id });
    return null;
  }

  const created = await prisma.riderReferral.create({
    data: { referrerId: referrer.id, referredId: referredUserId },
  });

  logger.info("Rider referral created at signup", {
    referrerId: referrer.id,
    referredId: referredUserId,
  });
  return created;
};

// ==================== INCREMENT + STAGE CHECK ====================
// Called every time a referred rider delivers an order.
// Increments referredOrderCount and issues payouts for any newly-crossed stage.
// Idempotent: each stage's paidAt is only set once (null → timestamp).
export const incrementRiderReferralOrderCount = async (riderId) => {
  if (!riderId) return;

  // Find if this rider was referred by someone
  const rr = await prisma.riderReferral.findUnique({
    where: { referredId: riderId },
    select: {
      id: true,
      referrerId: true,
      referredOrderCount: true,
      stage1PaidAt: true,
      stage2PaidAt: true,
      stage3PaidAt: true,
      totalPaid: true,
    },
  });
  if (!rr) return; // not a referred rider

  const newCount = rr.referredOrderCount + 1;

  // Determine which stages just crossed
  const newPayouts = [];
  const updateData = { referredOrderCount: newCount };

  for (const stage of RIDER_REFERRAL_STAGES) {
    const paidAtKey = `stage${stage.stage}PaidAt`;
    const alreadyPaid = Boolean(rr[paidAtKey]);
    if (!alreadyPaid && newCount >= stage.ordersRequired) {
      updateData[paidAtKey] = new Date();
      newPayouts.push(stage);
    }
  }

  const additionalPayout = newPayouts.reduce((s, t) => s + t.payout, 0);
  if (additionalPayout > 0) {
    updateData.totalPaid = rr.totalPaid + additionalPayout;
  }

  await prisma.riderReferral.update({
    where: { id: rr.id },
    data: updateData,
  });

  if (newPayouts.length > 0) {
    logger.info("Rider referral stage(s) unlocked", {
      referrerId: rr.referrerId,
      referredId: riderId,
      newCount,
      stages: newPayouts.map((s) => s.stage),
      totalNewPayout: additionalPayout,
    });
  }
};

// ==================== STATS FOR A RIDER ========================
export const getRiderReferralStats = async (riderId) => {
  // Ensure referral code exists
  const user = await prisma.user.findUnique({
    where: { id: riderId },
    select: { referralCode: true },
  });

  let referralCode = user?.referralCode;
  if (!referralCode) {
    // Lazy-create using the same deterministic pattern as the customer system
    const suffix = riderId.replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase();
    referralCode = `CRAVZO${suffix}`;
    await prisma.user.update({
      where: { id: riderId },
      data: { referralCode },
    });
  }

  // All referrals made by this rider
  const referrals = await prisma.riderReferral.findMany({
    where: { referrerId: riderId },
    include: {
      referred: { select: { id: true, name: true, phone: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarned = referrals.reduce((s, r) => s + Number(r.totalPaid || 0), 0);
  const activeReferrals = referrals.filter((r) => !r.stage3PaidAt).length;

  return {
    referralCode,
    totalReferrals: referrals.length,
    activeReferrals,
    totalEarned,
    stages: RIDER_REFERRAL_STAGES,
    totalPossible: RIDER_REFERRAL_TOTAL,
    referrals: referrals.map(serializeRiderReferral),
  };
};

// ==================== ADMIN: LIST ALL ==========================
export const adminListRiderReferrals = async ({ page = 1, limit = 30, search = "" } = {}) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { referrer: { name: { contains: search, mode: "insensitive" } } },
          { referred: { name: { contains: search, mode: "insensitive" } } },
          { referrer: { phone: { contains: search } } },
          { referred: { phone: { contains: search } } },
        ],
      }
    : {};

  const [referrals, total] = await Promise.all([
    prisma.riderReferral.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        referrer: { select: { id: true, name: true, phone: true, status: true } },
        referred: { select: { id: true, name: true, phone: true, status: true } },
      },
    }),
    prisma.riderReferral.count({ where }),
  ]);

  // Platform summary
  const [totalPaidAgg, totalReferrals, fullyCompleted] = await Promise.all([
    prisma.riderReferral.aggregate({ _sum: { totalPaid: true } }),
    prisma.riderReferral.count(),
    prisma.riderReferral.count({ where: { stage3PaidAt: { not: null } } }),
  ]);

  return {
    referrals: referrals.map(serializeRiderReferral),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    summary: {
      totalReferrals,
      fullyCompleted,
      totalPaidOut: Number(totalPaidAgg._sum.totalPaid || 0),
    },
  };
};

// ==================== ADMIN: SINGLE DETAIL ======================
export const adminGetRiderReferral = async (id) => {
  const rr = await prisma.riderReferral.findUnique({
    where: { id },
    include: {
      referrer: { select: { id: true, name: true, phone: true, status: true, createdAt: true } },
      referred: { select: { id: true, name: true, phone: true, status: true, createdAt: true } },
    },
  });
  if (!rr) return null;
  return serializeRiderReferral(rr);
};

import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

// ==================== GIG INCENTIVE CONFIG ====================
// Tiers are NOT cumulative — rider earns the bonus for the highest
// tier they reach. E.g. 20 orders → ₹300 (not ₹140 + ₹300).
export const GIG_TIERS = [
  { orders: 10, bonus: 140 },
  { orders: 20, bonus: 300 },
  { orders: 24, bonus: 340 },
];

export const MIN_GIG_HOURS = 2;

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the bonus amount for a given completed order count.
 * Returns 0 if no tier reached.
 */
export const calcBonus = (ordersCompleted) => {
  let bonus = 0;
  for (const tier of GIG_TIERS) {
    if (ordersCompleted >= tier.orders) bonus = tier.bonus;
  }
  return bonus;
};

/**
 * Returns the next incentive tier the rider hasn't reached yet,
 * or null if all tiers are completed.
 */
export const nextTier = (ordersCompleted) =>
  GIG_TIERS.find((t) => t.orders > ordersCompleted) || null;

/**
 * Serialize a RiderGig row into a safe API payload.
 */
const serializeGig = (gig) => ({
  id: gig.id,
  riderId: gig.riderId,
  durationHours: gig.durationHours,
  startedAt: gig.startedAt,
  endsAt: gig.endsAt,
  status: gig.status,
  ordersCompleted: gig.ordersCompleted,
  bonusEarned: gig.bonusEarned,
  endedEarly: gig.endedEarly,
  endedAt: gig.endedAt,
  // derived helpers for the app UI
  currentBonus: calcBonus(gig.ordersCompleted),
  nextTier: nextTier(gig.ordersCompleted),
  tiers: GIG_TIERS,
});

// ==================== BOOK GIG ====================
export const bookGig = async (riderId, durationHours) => {
  const hours = Number(durationHours);
  if (!Number.isFinite(hours) || hours < MIN_GIG_HOURS) {
    throw new Error(`Minimum gig duration is ${MIN_GIG_HOURS} hours`);
  }

  // Only one active gig allowed at a time
  const existingActive = await prisma.riderGig.findFirst({
    where: { riderId, status: "ACTIVE" },
    select: { id: true, endsAt: true },
  });
  if (existingActive) {
    throw new Error("You already have an active gig. End it before booking a new one.");
  }

  // Rider must be online to start a gig
  const rider = await prisma.user.findUnique({
    where: { id: riderId },
    select: { isOnline: true, status: true },
  });
  if (!rider) throw new Error("Rider not found");
  if (rider.status !== "ACTIVE") throw new Error("Your account is not active");
  if (!rider.isOnline) throw new Error("You must be online to book a gig");

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + hours * 60 * 60 * 1000);

  const gig = await prisma.riderGig.create({
    data: {
      riderId,
      durationHours: hours,
      startedAt,
      endsAt,
      status: "ACTIVE",
    },
  });

  logger.info("Rider gig booked", { riderId, gigId: gig.id, durationHours: hours, endsAt });
  return serializeGig(gig);
};

// ==================== END GIG ====================
// endedEarly = true when rider goes offline before endsAt.
// Bonus is calculated at end time based on ordersCompleted.
export const endGig = async (riderId, { endedEarly = false } = {}) => {
  const gig = await prisma.riderGig.findFirst({
    where: { riderId, status: "ACTIVE" },
  });
  if (!gig) return null; // no active gig — no-op

  const now = new Date();
  const bonus = calcBonus(gig.ordersCompleted);
  const naturallyCompleted = now >= gig.endsAt;

  const finalStatus = endedEarly && !naturallyCompleted ? "ENDED_EARLY" : "COMPLETED";

  const updated = await prisma.riderGig.update({
    where: { id: gig.id },
    data: {
      status: finalStatus,
      bonusEarned: bonus,
      endedEarly: endedEarly && !naturallyCompleted,
      endedAt: now,
    },
  });

  logger.info("Rider gig ended", {
    riderId,
    gigId: gig.id,
    status: finalStatus,
    ordersCompleted: gig.ordersCompleted,
    bonus,
  });

  return serializeGig(updated);
};

// ==================== INCREMENT ORDER COUNT ====================
// Called from orderController when a rider delivers an order.
// Increments ordersCompleted on any active gig for that rider.
export const incrementGigOrderCount = async (riderId) => {
  if (!riderId) return;
  try {
    await prisma.riderGig.updateMany({
      where: { riderId, status: "ACTIVE" },
      data: { ordersCompleted: { increment: 1 } },
    });
  } catch (err) {
    // Non-critical — log and continue
    logger.error("Failed to increment gig order count", { riderId, err: err.message });
  }
};

// ==================== AUTO-EXPIRE GIGS ====================
// Called lazily from getActiveGig — only expires THIS rider's gig.
// Platform-wide expiry should run as a background cron, not on every API call.
export const autoExpireGigs = async (riderId) => {
  const now = new Date();
  // Single indexed update for this rider only
  await prisma.riderGig.updateMany({
    where: { riderId, status: "ACTIVE", endsAt: { lte: now } },
    data: { status: "COMPLETED", endedAt: now },
  });
};

// ==================== GET ACTIVE GIG ====================
export const getActiveGig = async (riderId) => {
  // Lazily expire only this rider's gig — not a platform-wide scan
  await autoExpireGigs(riderId);

  const gig = await prisma.riderGig.findFirst({
    where: { riderId, status: "ACTIVE" },
  });
  if (!gig) return null;
  return serializeGig(gig);
};

// ==================== GET GIG HISTORY / STATS ====================
export const getGigStats = async (riderId) => {
  const [gigs, totalGigs, completedGigs] = await Promise.all([
    prisma.riderGig.findMany({
      where: { riderId },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    prisma.riderGig.count({ where: { riderId } }),
    prisma.riderGig.count({ where: { riderId, status: "COMPLETED" } }),
  ]);

  const totalBonus = gigs.reduce((sum, g) => sum + Number(g.bonusEarned || 0), 0);

  return {
    totalGigs,
    completedGigs,
    totalBonusEarned: totalBonus,
    tiers: GIG_TIERS,
    recentGigs: gigs.map(serializeGig),
  };
};

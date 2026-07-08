import { prisma } from "../config/database.js";

const REFERRAL_BONUS = 100;

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
    // Handle rare race condition: another request set the code concurrently.
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

const getMyReferralStats = async (userId) => {
  const [user, referralsMade, totalCredit] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, walletBalance: true },
    }),
    prisma.referral.count({ where: { referrerId: userId, status: "COMPLETED" } }),
    prisma.referral.aggregate({
      where: { referrerId: userId, status: "COMPLETED" },
      _sum: { bonusAmount: true },
    }),
  ]);

  const referralCode = user?.referralCode || (await ensureReferralCode(prisma, userId));

  return {
    referralCode,
    friendsReferred: referralsMade,
    creditEarned: totalCredit._sum.bonusAmount || 0,
    walletBalance: user?.walletBalance || 0,
  };
};

const applyReferralCode = async (userId, rawCode) => {
  const code = String(rawCode || "").trim().toUpperCase();

  if (!code) {
    throw new Error("Referral code is required");
  }

  // Prevent self-referral and double-application atomically.
  const result = await prisma.$transaction(async (tx) => {
    const applicant = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true, referralReceived: true, status: true },
    });

    if (!applicant) {
      throw new Error("User not found");
    }

    if (applicant.referralReceived) {
      throw new Error("You have already applied a referral code");
    }

    const referrer = await tx.user.findUnique({
      where: { referralCode: code },
      select: { id: true, walletBalance: true, status: true },
    });

    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    if (referrer.id === userId) {
      throw new Error("You cannot use your own referral code");
    }

    await tx.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        status: "COMPLETED",
        bonusAmount: REFERRAL_BONUS,
        completedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: referrer.id },
      data: { walletBalance: { increment: REFERRAL_BONUS } },
    });

    await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: REFERRAL_BONUS } },
    });

    return {
      referrerId: referrer.id,
      bonusAmount: REFERRAL_BONUS,
    };
  });

  return result;
};

export { applyReferralCode, ensureReferralCode, generateReferralCode, getMyReferralStats, REFERRAL_BONUS };
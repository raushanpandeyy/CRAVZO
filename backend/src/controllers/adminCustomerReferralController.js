import { prisma } from "../config/database.js";
import { apiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { MILESTONES } from "../services/referralService.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const serializeReferral = (r) => ({
  id: r.id,
  status: r.status,
  bonusAmount: Number(r.bonusAmount || 0),
  suspectFlag: r.suspectFlag,
  suspectReason: r.suspectReason,
  createdAt: r.createdAt,
  completedAt: r.completedAt,
  referrer: r.referrer
    ? { id: r.referrer.id, name: r.referrer.name, phone: r.referrer.phone, email: r.referrer.email }
    : null,
  referred: r.referred
    ? { id: r.referred.id, name: r.referred.name, phone: r.referred.phone, email: r.referred.email }
    : null,
});

const serializeMilestone = (m) => ({
  id: m.id,
  tier: m.tier,
  rewardType: m.rewardType,
  rewardValue: Number(m.rewardValue),
  voucherCode: m.voucherCode,
  status: m.status,
  expiresAt: m.expiresAt,
  issuedAt: m.issuedAt,
  redeemedAt: m.redeemedAt,
  user: m.user
    ? { id: m.user.id, name: m.user.name, phone: m.user.phone }
    : null,
});

// ── GET /api/admin/customer-referrals ─────────────────────────────────────────
// List all customer referrals with filters: status, suspectFlag, search
export const listCustomerReferrals = async (req, res) => {
  const page   = Math.max(1, Number(req.query.page  || 1));
  const limit  = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
  const search = (req.query.search  || "").trim();
  const status = (req.query.status  || "").trim();
  const suspect = req.query.suspect === "true";
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),
    ...(suspect ? { suspectFlag: true } : {}),
    ...(search
      ? {
          OR: [
            { referrer: { name:  { contains: search, mode: "insensitive" } } },
            { referrer: { phone: { contains: search } } },
            { referrer: { email: { contains: search, mode: "insensitive" } } },
            { referred: { name:  { contains: search, mode: "insensitive" } } },
            { referred: { phone: { contains: search } } },
            { referred: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        referrer: { select: { id: true, name: true, phone: true, email: true } },
        referred: { select: { id: true, name: true, phone: true, email: true } },
      },
    }),
    prisma.referral.count({ where }),
  ]);

  // Platform-wide summary
  const [totalCount, pendingCount, completedCount, suspectCount, milestoneAgg] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.count({ where: { status: { in: ["PENDING", "OTP_VERIFIED"] } } }),
    prisma.referral.count({ where: { status: "COMPLETED" } }),
    prisma.referral.count({ where: { suspectFlag: true } }),
    prisma.referralMilestone.aggregate({ _count: { _all: true }, where: { status: "REDEEMED" } }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Customer referrals fetched",
      data: {
        referrals: referrals.map(serializeReferral),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: {
          totalReferrals: totalCount,
          pendingReferrals: pendingCount,
          completedReferrals: completedCount,
          suspectReferrals: suspectCount,
          redeemedMilestones: milestoneAgg._count._all,
        },
        milestonesConfig: MILESTONES,
      },
    }),
  );
};

// ── GET /api/admin/customer-referrals/milestones ──────────────────────────────
// List all issued referral milestone vouchers (paginated, filterable by status)
export const listReferralMilestones = async (req, res) => {
  const page   = Math.max(1, Number(req.query.page  || 1));
  const limit  = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
  const status = (req.query.status || "").trim(); // ISSUED | REDEEMED | EXPIRED
  const skip   = (page - 1) * limit;

  const where = status ? { status } : {};

  const [milestones, total] = await Promise.all([
    prisma.referralMilestone.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issuedAt: "desc" },
      include: { user: { select: { id: true, name: true, phone: true } } },
    }),
    prisma.referralMilestone.count({ where }),
  ]);

  // Summary counts
  const [issued, redeemed, expired] = await Promise.all([
    prisma.referralMilestone.count({ where: { status: "ISSUED" } }),
    prisma.referralMilestone.count({ where: { status: "REDEEMED" } }),
    prisma.referralMilestone.count({ where: { status: "EXPIRED" } }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Referral milestones fetched",
      data: {
        milestones: milestones.map(serializeMilestone),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: { issued, redeemed, expired },
      },
    }),
  );
};

// ── GET /api/admin/customer-referrals/:id ─────────────────────────────────────
export const getCustomerReferralDetail = async (req, res) => {
  const referral = await prisma.referral.findUnique({
    where: { id: req.params.id },
    include: {
      referrer: { select: { id: true, name: true, phone: true, email: true } },
      referred: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
  if (!referral) throw new ApiError(404, "Referral not found");

  // Also fetch all milestones earned by the referrer
  const milestones = await prisma.referralMilestone.findMany({
    where: { userId: referral.referrerId },
    orderBy: { issuedAt: "desc" },
  });

  res.status(200).json(
    apiResponse({
      message: "Referral detail fetched",
      data: {
        referral: serializeReferral(referral),
        referrerMilestones: milestones.map(serializeMilestone),
      },
    }),
  );
};

// ── PATCH /api/admin/customer-referrals/:id/flag ──────────────────────────────
// Admin can mark/unmark a referral as suspect
export const flagReferral = async (req, res) => {
  const { suspectFlag, suspectReason } = req.body;
  if (typeof suspectFlag !== "boolean") throw new ApiError(400, "suspectFlag must be boolean");

  const updated = await prisma.referral.update({
    where: { id: req.params.id },
    data: {
      suspectFlag,
      suspectReason: suspectFlag ? (suspectReason || "Flagged by admin") : null,
      status: suspectFlag ? "SUSPECT" : "OTP_VERIFIED",
    },
  });

  res.status(200).json(
    apiResponse({ message: "Referral flag updated", data: serializeReferral(updated) }),
  );
};

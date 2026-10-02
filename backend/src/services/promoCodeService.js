import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

// ── Validate + preview a promo code (no DB write) ────────────────────────────
// Returns { promoCodeId, code, discountType, discount, rewardType } or throws.
// Called from prepareOrderDraft (checkout preview) and quote endpoint.
export const previewPromoCode = async ({
  customerId,
  code,
  draftSubtotal,
  draftDeliveryFee,
}) => {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();

  const promo = await prisma.promoCode.findUnique({
    where: { code: normalized },
  });

  const now = new Date();

  if (!promo)                                                   return null;
  if (!promo.isActive)                                          return null;
  if (promo.startsAt  && promo.startsAt  > now)                 return null;
  if (promo.expiresAt && promo.expiresAt < now)                 return null;
  if (promo.maxUses   !== null && promo.currentUses >= promo.maxUses) return null;

  // Min order check
  if (promo.minOrderValue !== null && draftSubtotal < Number(promo.minOrderValue)) {
    return null;
  }

  // Per-user limit check
  const userUses = await prisma.promoCodeRedemption.count({
    where: { promoCodeId: promo.id, userId: customerId },
  });
  if (userUses >= promo.perUserLimit) return null;

  // Compute discount
  let discount = 0;
  const value = Number(promo.discountValue);

  if (promo.discountType === "FLAT") {
    discount = value;
  } else if (promo.discountType === "FREE_DELIVERY") {
    discount = Math.min(value, Number(draftDeliveryFee || 0));
  } else if (promo.discountType === "PERCENTAGE") {
    discount = draftSubtotal * (value / 100);
    if (promo.maxDiscount !== null) {
      discount = Math.min(discount, Number(promo.maxDiscount));
    }
  }

  // Cap: can't discount more than subtotal
  discount = Math.min(Number(discount.toFixed(2)), draftSubtotal);

  return {
    promoCodeId:  promo.id,
    code:         promo.code,
    discountType: promo.discountType,
    discount,
    label:        promo.label,
    minOrderValue: promo.minOrderValue ? Number(promo.minOrderValue) : null,
  };
};

// ── Redeem inside a Prisma $transaction ──────────────────────────────────────
// Called from createPersistedOrder. tx = transaction client.
// Creates PromoCodeRedemption + increments currentUses atomically.
export const redeemPromoCodeInTx = async (tx, { promoCodeId, userId, orderId }) => {
  if (!promoCodeId) return;

  // Guard: only FLAT / FREE_DELIVERY / PERCENTAGE — already validated at preview
  // Double-spend guard: atomic increment + unique index on (promoCodeId, userId)
  // when perUserLimit=1 prevents two concurrent checkouts from both redeeming.
  await tx.promoCode.update({
    where: { id: promoCodeId },
    data:  { currentUses: { increment: 1 }, updatedAt: new Date() },
  });

  await tx.promoCodeRedemption.create({
    data: { promoCodeId, userId, orderId },
  });

  logger.info("PromoCode redeemed", { promoCodeId, userId, orderId });
};

// ── Public validate endpoint helper (used by /api/promo-codes/validate) ──────
export const validatePromoCodeForCustomer = async ({
  customerId,
  code,
  subtotal,
  deliveryFee,
}) => {
  const preview = await previewPromoCode({
    customerId,
    code,
    draftSubtotal: subtotal,
    draftDeliveryFee: deliveryFee,
  });

  if (!preview) {
    throw new ApiError(400, "Promo code is invalid, expired, or not applicable to this order");
  }
  return preview;
};

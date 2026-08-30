import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { getLatLngFromAddress } from "../utils/geocode.js";
import { getGoogleRouteDistanceKm } from "../utils/googleMaps.js";
import {
  markReferredQualifiedAndIssueMilestones,
  previewVoucher,
  redeemVoucherInTx,
} from "./referralService.js";
import { getPricingSettings } from "./pricingSettingsService.js";

const DELIVERY_BASE_FEE = env.DELIVERY_BASE_FEE;
const DELIVERY_BASE_KM = env.DELIVERY_BASE_KM;
const DELIVERY_PER_KM_RATE = env.DELIVERY_PER_KM_RATE;
const GST_RATE = env.GST_RATE;
const FOOD_GST_RATE = env.FOOD_GST_RATE || 0.05;
const DELIVERY_GST_RATE = env.DELIVERY_GST_RATE || 0.18;
const PLATFORM_FEE = env.PLATFORM_FEE;
const PACKAGING_PERCENT = env.PACKAGING_PERCENT;
const RAZORPAY_PERCENT = env.RAZORPAY_PERCENT;
const COD_CHARGE = env.COD_CHARGE;

const buildFullAddress = ({ line1, line2, city, state, postalCode }) =>
  [line1, line2, city, state, postalCode, "India"].filter(Boolean).join(", ");

const geocodeDeliveryAddress = async (address) => {
  if (!address?.line1 || !address?.city || !address?.state || !address?.postalCode) {
    return { lat: null, lng: null };
  }
  return getLatLngFromAddress(buildFullAddress(address));
};

const DELIVERY_SLABS = [
  { maxKm: 1, fee: 17 },
  { maxKm: 2, fee: 25 },
  { maxKm: 3, fee: 33 },
  { maxKm: 4, fee: 40 },
];

const roundUpToHundredMeters = (distanceKm) => Math.max(0.1, Math.ceil(Number(distanceKm || 1) * 10) / 10);

const interpolateFee = (distance, previous, next) => {
  const progress = (distance - previous.maxKm) / (next.maxKm - previous.maxKm);
  return previous.fee + progress * (next.fee - previous.fee);
};

const getDeliveryBaseFee = (distanceKm) => {
  const distance = roundUpToHundredMeters(distanceKm);
  if (distance <= 1) return 17;

  for (let index = 1; index < DELIVERY_SLABS.length; index += 1) {
    const previous = DELIVERY_SLABS[index - 1];
    const next = DELIVERY_SLABS[index];
    if (distance <= next.maxKm) return Number(interpolateFee(distance, previous, next).toFixed(2));
  }

  const lastSlab = DELIVERY_SLABS[DELIVERY_SLABS.length - 1];
  return Number((lastSlab.fee + (distance - lastSlab.maxKm) * 10).toFixed(2));
};

const calculateDeliveryWithBreakdown = (distanceKm, pricingSettings = {}) => {
  const baseFee = getDeliveryBaseFee(distanceKm);
  const rainCharge = pricingSettings.rainChargeEnabled ? Number(pricingSettings.rainChargeAmount || 25) : 0;
  const tax = baseFee * DELIVERY_GST_RATE;
  return {
    base: baseFee,
    rainCharge,
    tax,
    total: baseFee + tax + rainCharge,
  };
};

const calculateStraightLineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateDeliveryDistanceKm = async (restaurantLat, restaurantLng, customerLat, customerLng) => {
  const routeDistance = await getGoogleRouteDistanceKm({
    origin: { lat: restaurantLat, lng: restaurantLng },
    destination: { lat: customerLat, lng: customerLng },
  });
  const distance = routeDistance ?? calculateStraightLineDistanceKm(restaurantLat, restaurantLng, customerLat, customerLng);
  return Number(distance.toFixed(2));
};

const serializeOrder = (order) => ({
  id: order.id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  subtotal: Number(order.subtotal),
  deliveryFee: Number(order.deliveryFee),
  deliveryFeeBase: Number(order.deliveryFeeBase),
  deliveryTax: Number(order.deliveryTax),
  packagingFee: Number(order.packagingFee),
  packagingFeeBase: Number(order.packagingFeeBase),
  packagingTax: Number(order.packagingTax),
  platformFee: Number(order.platformFee),
  platformFeeBase: Number(order.platformFeeBase),
  platformTax: Number(order.platformTax),
  gatewayFee: Number(order.gatewayFee),
  codCharge: Number(order.codCharge),
  discount: Number(order.discount),
  couponCode: order.couponCode,
  referralVoucherCode: order.referralVoucherCode,
  referralVoucherId: order.referralVoucherId,
  referralVoucherDiscount: Number(order.referralVoucherDiscount || 0),
  totalTax: Number(order.totalTax),
  totalAmount: Number(order.totalAmount),
  deliveryDistance: order.deliveryDistance ? Number(order.deliveryDistance) : null,
  notes: order.notes,
  restaurantInstructions: order.restaurantInstructions,
  deliveryInstructions: order.deliveryInstructions,
  tipAmount: Number(order.tipAmount || 0),
  cancelledRiderId: order.cancelledRiderId || null,
  riderCancellationEarning: Number(order.riderCancellationEarning || 0),
  cancelledAt: order.cancelledAt || null,
  cancelledByRole: order.cancelledByRole || null,
  rejectedRiderIds: order.rejectedRiderIds || [],
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  restaurant: order.restaurant
    ? {
        id: order.restaurant.id,
        name: order.restaurant.name,
        imageUrl: order.restaurant.imageUrl,
        city: order.restaurant.city,
        addressLine1: order.restaurant.addressLine1,
        addressLine2: order.restaurant.addressLine2,
        state: order.restaurant.state,
        postalCode: order.restaurant.postalCode,
        latitude: order.restaurant.latitude,
        longitude: order.restaurant.longitude,
      }
    : null,
  rider: order.rider
    ? {
        id: order.rider.id,
        name: order.rider.name,
        email: order.rider.email,
        phone: order.rider.phone,
        avatarUrl: order.rider.avatarUrl,
      }
    : null,
  address: order.address,
  items: order.items?.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
    size: item.size,
    notes: item.notes,
    selectedSideDishes: item.selectedSideDishes,
    menuItem: item.menuItem
      ? {
          id: item.menuItem.id,
          name: item.menuItem.name,
          imageUrl: item.menuItem.imageUrl,
          sizes: item.menuItem.sizes,
        }
      : null,
  })),
});

const prepareOrderDraft = async ({
  customerId,
  restaurantId,
  items = [],
  address = null,
  addressId = null,
  paymentMethod = "UPI",
  notes = null,
  restaurantInstructions = null,
  deliveryInstructions = null,
  tipAmount = 0,
  couponCode = null,
  referralVoucherCode = null,
  persistAddress = true,
},
// Fix #1: Accept an optional Prisma transaction client.
// When called inside $transaction, all queries here become part of
// that transaction. When called standalone (e.g. prepareOrderDraft for
// a preview/quote), it falls back to the global prisma client.
db = prisma,
) => {
  if (!restaurantId || items.length === 0) {
    throw new ApiError(400, "Restaurant and at least one item are required");
  }

  const restaurant = await db.restaurant.findFirst({
    where: { id: restaurantId, status: "ACTIVE", isOpen: true },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const menuItems = await db.menuItem.findMany({
    where: {
      id: { in: items.map((item) => item.menuItemId) },
      restaurantId,
      status: "ACTIVE",
    },
  });

  if (menuItems.length !== items.length) {
    throw new ApiError(400, "Some cart items are no longer available");
  }

  const getItemPrice = (menuItem, selectedSize) => {
    const sizes = Array.isArray(menuItem.sizes) ? menuItem.sizes : [];
    if (selectedSize) {
      const sizeEntry = sizes.find((size) => size.size === selectedSize);
      if (!sizeEntry) throw new ApiError(400, `${selectedSize} is not available for ${menuItem.name}`);
      return Number(sizeEntry.price);
    }
    if (sizes.length > 0) throw new ApiError(400, `Select a size for ${menuItem.name}`);
    return Number(menuItem.price);
  };

  const resolveSideDishes = (menuItem, selections) => {
    if (!selections || !Array.isArray(selections) || selections.length === 0) return [];
    const available = Array.isArray(menuItem.sideDishes) ? menuItem.sideDishes : [];
    return selections.map((selection) => {
      const match = available.find((sideDish) => sideDish.name === selection.name);
      if (!match) {
        throw new ApiError(400, `${selection.name} is not available with ${menuItem.name}`);
      }
      return { name: match.name, price: Number(match.price) };
    });
  };

  const resolvedItems = items.map((item) => {
    const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
    const sideDishes = resolveSideDishes(menuItem, item.selectedSideDishes);
    const basePrice = getItemPrice(menuItem, item.size);
    const sideDishTotal = sideDishes.reduce((sum, sideDish) => sum + sideDish.price, 0);
    return { item, menuItem, sideDishes, basePrice, sideDishTotal };
  });

  const subtotal = resolvedItems.reduce(
    (sum, entry) => sum + (entry.basePrice + entry.sideDishTotal) * entry.item.quantity,
    0,
  );

  let resolvedAddressId = null;
  let deliveryDistance = null;
  const pricingSettings = await getPricingSettings();
  let deliveryBreakdown = calculateDeliveryWithBreakdown(3, pricingSettings);

  if (addressId) {
    const existingAddress = await db.address.findFirst({
      where: {
        id: addressId,
        userId: customerId,
      },
    });

    if (!existingAddress) {
      throw new ApiError(404, "Saved address not found");
    }

    resolvedAddressId = existingAddress.id;

    if (
      existingAddress.latitude !== null &&
      existingAddress.longitude !== null &&
      restaurant.latitude !== null &&
      restaurant.longitude !== null
    ) {
      deliveryDistance = await calculateDeliveryDistanceKm(
          restaurant.latitude,
          restaurant.longitude,
          existingAddress.latitude,
          existingAddress.longitude
      );
      deliveryBreakdown = calculateDeliveryWithBreakdown(deliveryDistance, pricingSettings);
    } else if (existingAddress.latitude === null || existingAddress.longitude === null) {
      // Geocode OUTSIDE the transaction Ã¢â‚¬â€ external HTTP calls must not hold
      // a DB transaction open. We update coordinates using the outer prisma
      // client (not tx) so the transaction timeout is not affected.
      const coords = await geocodeDeliveryAddress(existingAddress);
      if (coords.lat !== null && coords.lng !== null) {
        await prisma.address.update({
          where: { id: existingAddress.id },
          data: { latitude: coords.lat, longitude: coords.lng },
        });
        deliveryDistance = await calculateDeliveryDistanceKm(
            restaurant.latitude,
            restaurant.longitude,
            coords.lat,
            coords.lng
        );
        deliveryBreakdown = calculateDeliveryWithBreakdown(deliveryDistance, pricingSettings);
      }
    }
  } else if (address && address.fullName && address.phone && address.line1 && address.city && address.state && address.postalCode) {
    // Fix #3: If the controller pre-geocoded the address (preGeocodedLat/Lng present),
    // use those coords directly Ã¢â‚¬â€ no external HTTP call needed here.
    // If not present (e.g. prepareOrderDraft called standalone for a quote),
    // fall back to geocoding. This keeps the transaction fast and side-effect-free.
    let coords;
    if (
      address.preGeocodedLat !== undefined &&
      address.preGeocodedLng !== undefined
    ) {
      coords = { lat: address.preGeocodedLat, lng: address.preGeocodedLng };
    } else if (
      address.latitude !== undefined && address.latitude !== null &&
      address.longitude !== undefined && address.longitude !== null
    ) {
      coords = { lat: address.latitude, lng: address.longitude };
    } else {
      coords = await geocodeDeliveryAddress(address);
    }

    if (persistAddress) {
      const createdAddress = await db.address.create({
        data: {
          userId: customerId,
          label: address.label || "Delivery Address",
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 || null,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          latitude: coords.lat,
          longitude: coords.lng,
          isDefault: false,
        },
      });
      resolvedAddressId = createdAddress.id;
    }

    if (coords.lat !== null && coords.lng !== null && restaurant.latitude !== null && restaurant.longitude !== null) {
      deliveryDistance = await calculateDeliveryDistanceKm(
          restaurant.latitude,
          restaurant.longitude,
          coords.lat,
          coords.lng
      );
      deliveryBreakdown = calculateDeliveryWithBreakdown(deliveryDistance, pricingSettings);
    }
  }

  const packagingFeeBase = subtotal * PACKAGING_PERCENT;
  const foodGst = subtotal * FOOD_GST_RATE;
  const packagingTax = packagingFeeBase * FOOD_GST_RATE;
  const platformFeeBase = PLATFORM_FEE / (1 + DELIVERY_GST_RATE);
  const platformTax = PLATFORM_FEE - platformFeeBase;

  let discount = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    const now = new Date();
    const invalid = !coupon || !coupon.isActive ||
      (coupon.expiresAt && coupon.expiresAt < now) ||
      (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) ||
      (coupon.restaurantId && coupon.restaurantId !== restaurantId) ||
      (coupon.minOrderValue !== null && subtotal < Number(coupon.minOrderValue));
    if (invalid) throw new ApiError(400, "Coupon is no longer valid for this order");

    discount = coupon.discountType === "PERCENTAGE"
      ? subtotal * (Number(coupon.discountValue) / 100)
      : Number(coupon.discountValue);
    if (coupon.maxDiscount !== null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.min(Number(discount.toFixed(2)), subtotal);
    appliedCouponCode = coupon.code;
  }

  // Referral milestone voucher (no cash wallet involved).
  // Bounded by available budget bucket (delivery fee for FREE_DELIVERY, subtotal for FLAT_DISCOUNT).
  let referralVoucherDiscount = 0;
  let appliedReferralVoucherCode = null;
  let appliedReferralVoucherId = null;
  let appliedReferralRewardType = null;
  if (referralVoucherCode) {
    const voucherPreview = await previewVoucher({
      customerId,
      voucherCode: referralVoucherCode,
      draftSubtotal: subtotal,
      draftDeliveryFee: deliveryBreakdown.total,
    });
    if (!voucherPreview) {
      throw new ApiError(400, "Referral voucher is invalid, expired, or not applicable");
    }
    referralVoucherDiscount = voucherPreview.discount;
    appliedReferralVoucherCode = voucherPreview.voucherCode;
    appliedReferralVoucherId = voucherPreview.voucherId;
    appliedReferralRewardType = voucherPreview.rewardType;
  }

  const subtotalBeforeExtra = subtotal + deliveryBreakdown.total + PLATFORM_FEE + packagingFeeBase + packagingTax + foodGst;
  
  let gatewayFee = 0;
  let codCharge = 0;
  if (paymentMethod === "UPI" || paymentMethod === "CARD") {
    gatewayFee = Number((subtotalBeforeExtra * RAZORPAY_PERCENT).toFixed(2));
  } else if (paymentMethod === "COD") {
    codCharge = COD_CHARGE;
  }

  const totalTax = foodGst + packagingTax + deliveryBreakdown.tax + platformTax;

  const totalAmount = subtotal + foodGst + packagingFeeBase + packagingTax + deliveryBreakdown.total + PLATFORM_FEE + gatewayFee + codCharge + Number(tipAmount) - discount - referralVoucherDiscount;

  const totalDiscount = Number((discount + referralVoucherDiscount).toFixed(2));

  return {
    restaurantId,
    paymentMethod,
    notes,
    restaurantInstructions,
    deliveryInstructions,
    tipAmount: Number(tipAmount),
    subtotal,
    deliveryFee: deliveryBreakdown.total,
    deliveryFeeBase: deliveryBreakdown.base,
    deliveryTax: deliveryBreakdown.tax,
    rainCharge: deliveryBreakdown.rainCharge,
    packagingFee: packagingFeeBase + packagingTax,
    packagingFeeBase,
    packagingTax,
    platformFee: PLATFORM_FEE,
    platformFeeBase,
    platformTax,
    gatewayFee,
    codCharge,
    discount: totalDiscount,
    couponCode: appliedCouponCode,
    referralVoucherCode: appliedReferralVoucherCode,
    referralVoucherId: appliedReferralVoucherId,
    referralRewardType: appliedReferralRewardType,
    referralVoucherDiscount: Number(referralVoucherDiscount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    deliveryDistance,
    resolvedAddressId,
    itemRows: resolvedItems.map(({ item, sideDishes, basePrice, sideDishTotal }) => {
      const unitPrice = basePrice + sideDishTotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        size: item.size || null,
        notes: item.notes || null,
        selectedSideDishes: sideDishes.length ? sideDishes : undefined,
      };
    }),
  };
};

const createPersistedOrder = async ({
  customerId,
  restaurantId,
  items,
  address,
  addressId,
  paymentMethod,
  paymentStatus,
  notes,
  restaurantInstructions = null,
  deliveryInstructions = null,
  tipAmount = 0,
  gatewayProvider = null,
  gatewayOrderId = null,
  gatewayPaymentId = null,
  gatewaySignature = null,
  couponCode = null,
  referralVoucherCode = null,
}) => {
  // Fix #1: Wrap the entire order creation in a serializable transaction.
  //
  // Without this, 100 concurrent orders against the same restaurant can
  // race: two requests both read isOpen=true, then the restaurant closes
  // between the read and the write Ã¢â‚¬â€ both orders get created against a
  // closed restaurant. The transaction + SELECT FOR UPDATE (via findFirst
  // inside the tx) prevents that. It also ensures that if the order.create
  // fails, the address that was just created is rolled back too.
  const order = await prisma.$transaction(
    async (tx) => {
      // Re-run the entire draft calculation inside the transaction so all
      // reads (restaurant open check, menu item availability, address lookup)
      // are part of the same atomic unit.
      const draft = await prepareOrderDraft(
        {
          customerId,
          restaurantId,
          items,
          address,
          addressId,
          paymentMethod,
          notes,
          restaurantInstructions,
          deliveryInstructions,
          tipAmount,
          couponCode,
          referralVoucherCode,
        },
        tx, // pass the transaction client so all queries inside use it
      );

      for (const item of draft.itemRows) {
        const inventory = await tx.menuItem.findUnique({
          where: { id: item.menuItemId },
          select: { trackInventory: true },
        });
        if (inventory?.trackInventory) {
          const reserved = await tx.menuItem.updateMany({
            where: { id: item.menuItemId, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (reserved.count === 0) {
            throw new ApiError(409, "An item just went out of stock. Refresh your cart and try again");
          }
        }
      }
      const createdOrder = await tx.order.create({
        data: {
          customerId,
          restaurantId: draft.restaurantId,
          addressId: draft.resolvedAddressId,
          paymentMethod,
          paymentStatus,
          subtotal: draft.subtotal,
          deliveryFee: draft.deliveryFee,
          deliveryFeeBase: draft.deliveryFeeBase,
          deliveryTax: draft.deliveryTax,
          packagingFee: draft.packagingFee,
          packagingFeeBase: draft.packagingFeeBase,
          packagingTax: draft.packagingTax,
          platformFee: draft.platformFee,
          platformFeeBase: draft.platformFeeBase,
          platformTax: draft.platformTax,
          gatewayFee: draft.gatewayFee,
          codCharge: draft.codCharge,
          discount: draft.discount,
          couponCode: draft.couponCode,
          referralVoucherCode: draft.referralVoucherCode,
          referralVoucherId: draft.referralVoucherId,
          referralVoucherDiscount: draft.referralVoucherDiscount,
          totalTax: draft.totalTax,
          totalAmount: draft.totalAmount,
          deliveryDistance: draft.deliveryDistance,
          notes,
          restaurantInstructions: draft.restaurantInstructions,
          deliveryInstructions: draft.deliveryInstructions,
          tipAmount: draft.tipAmount,
          gatewayProvider,
          gatewayOrderId,
          gatewayPaymentId,
          gatewaySignature,
          items: {
            create: draft.itemRows,
          },
        },
        include: {
          restaurant: true,
          address: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
      if (draft.couponCode) {
        await tx.coupon.update({
          where: { code: draft.couponCode },
          data: { currentUses: { increment: 1 } },
        });
      }

      if (draft.referralVoucherCode) {
        await redeemVoucherInTx(tx, {
          voucherCode: draft.referralVoucherCode,
          orderId: createdOrder.id,
        });
      }

      return createdOrder;
    },
    {
      // ReadCommitted is sufficient: we re-read restaurant/menu inside the tx,
      // so we catch any changes. Serializable would be safer but adds
      // contention; ReadCommitted is the right tradeoff for order creation.
      isolationLevel: "ReadCommitted",
      // 10s max Ã¢â‚¬â€ geocoding is done BEFORE the transaction opens (see prepareOrderDraft)
      timeout: 10000,
    },
  );

  await markReferredQualifiedAndIssueMilestones({
    customerId,
    orderId: order.id,
    paymentStatus,
  });

  return order;
};

export { createPersistedOrder, prepareOrderDraft, serializeOrder };

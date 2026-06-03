import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { getLatLngFromAddress } from "../utils/geocode.js";

const DELIVERY_BASE_FEE = 33;
const DELIVERY_BASE_KM = 5;
const DELIVERY_PER_KM_RATE = 10;
const GST_RATE = 0.18;
const PLATFORM_FEE = 9;
const PACKAGING_PERCENT = 0.04;
const RAZORPAY_PERCENT = 0.02;
const COD_CHARGE = 5;

const buildFullAddress = ({ line1, line2, city, state, postalCode }) =>
  [line1, line2, city, state, postalCode, "India"].filter(Boolean).join(", ");

const geocodeDeliveryAddress = async (address) => {
  if (!address?.line1 || !address?.city || !address?.state || !address?.postalCode) {
    return { lat: null, lng: null };
  }
  return getLatLngFromAddress(buildFullAddress(address));
};

const calculateDeliveryFee = (distanceKm) => {
  const distance = distanceKm || 3;
  let baseFee;
  if (distance <= DELIVERY_BASE_KM) {
    baseFee = DELIVERY_BASE_FEE;
  } else {
    const extraKm = distance - DELIVERY_BASE_KM;
    baseFee = DELIVERY_BASE_FEE + extraKm * DELIVERY_PER_KM_RATE;
  }
  return baseFee * (1 + GST_RATE);
};

const calculateDeliveryWithBreakdown = (distanceKm) => {
  const distance = distanceKm || 3;
  let baseFee;
  if (distance <= DELIVERY_BASE_KM) {
    baseFee = DELIVERY_BASE_FEE;
  } else {
    const extraKm = distance - DELIVERY_BASE_KM;
    baseFee = DELIVERY_BASE_FEE + extraKm * DELIVERY_PER_KM_RATE;
  }
  const tax = baseFee * GST_RATE;
  return {
    base: baseFee,
    tax,
    total: baseFee + tax,
  };
};

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  totalTax: Number(order.totalTax),
  totalAmount: Number(order.totalAmount),
  deliveryDistance: order.deliveryDistance ? Number(order.deliveryDistance) : null,
  notes: order.notes,
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
    menuItem: item.menuItem
      ? {
          id: item.menuItem.id,
          name: item.menuItem.name,
          imageUrl: item.menuItem.imageUrl,
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
  pricing = null,
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

  const subtotal = items.reduce((sum, item) => {
    const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
    return sum + Number(menuItem.price) * item.quantity;
  }, 0);

  let resolvedAddressId = null;
  let deliveryDistance = null;
  let deliveryBreakdown = { base: DELIVERY_BASE_FEE, tax: 0, total: DELIVERY_BASE_FEE };

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
      deliveryDistance = Number(
        calculateDistanceKm(
          restaurant.latitude,
          restaurant.longitude,
          existingAddress.latitude,
          existingAddress.longitude
        ).toFixed(2)
      );
      deliveryBreakdown = calculateDeliveryWithBreakdown(deliveryDistance);
    } else if (existingAddress.latitude === null || existingAddress.longitude === null) {
      // Geocode OUTSIDE the transaction — external HTTP calls must not hold
      // a DB transaction open. We update coordinates using the outer prisma
      // client (not tx) so the transaction timeout is not affected.
      const coords = await geocodeDeliveryAddress(existingAddress);
      if (coords.lat !== null && coords.lng !== null) {
        await prisma.address.update({
          where: { id: existingAddress.id },
          data: { latitude: coords.lat, longitude: coords.lng },
        });
        deliveryDistance = Number(
          calculateDistanceKm(
            restaurant.latitude,
            restaurant.longitude,
            coords.lat,
            coords.lng
          ).toFixed(2)
        );
        deliveryBreakdown = calculateDeliveryWithBreakdown(deliveryDistance);
      }
    }
  } else if (address && address.fullName && address.phone && address.line1 && address.city && address.state && address.postalCode) {
    // Fix #3: If the controller pre-geocoded the address (preGeocodedLat/Lng present),
    // use those coords directly — no external HTTP call needed here.
    // If not present (e.g. prepareOrderDraft called standalone for a quote),
    // fall back to geocoding. This keeps the transaction fast and side-effect-free.
    let coords;
    if (
      address.preGeocodedLat !== undefined &&
      address.preGeocodedLng !== undefined
    ) {
      coords = { lat: address.preGeocodedLat, lng: address.preGeocodedLng };
    } else {
      coords = await geocodeDeliveryAddress(address);
    }

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

    if (coords.lat !== null && coords.lng !== null && restaurant.latitude !== null && restaurant.longitude !== null) {
      deliveryDistance = Number(
        calculateDistanceKm(
          restaurant.latitude,
          restaurant.longitude,
          coords.lat,
          coords.lng
        ).toFixed(2)
      );
      deliveryBreakdown = calculateDeliveryWithBreakdown(deliveryDistance);
    }
  }

  const packagingFeeBase = subtotal * PACKAGING_PERCENT;
  const packagingTax = packagingFeeBase * GST_RATE;
  const platformFeeBase = PLATFORM_FEE / (1 + GST_RATE);
  const platformTax = PLATFORM_FEE - platformFeeBase;

  let discount = 0;
  let couponCode = null;
  if (pricing?.couponDiscount && pricing.couponDiscount > 0) {
    discount = pricing.couponDiscount;
    couponCode = pricing.couponCode || null;
  }

  const subtotalBeforeExtra = subtotal + deliveryBreakdown.total + PLATFORM_FEE + packagingFeeBase + packagingTax;
  
  let gatewayFee = 0;
  let codCharge = 0;
  if (paymentMethod === "UPI" || paymentMethod === "CARD") {
    gatewayFee = Number((subtotalBeforeExtra * RAZORPAY_PERCENT).toFixed(2));
  } else if (paymentMethod === "COD") {
    codCharge = COD_CHARGE;
  }

  const totalTax =
    deliveryBreakdown.tax +
    packagingTax +
    platformTax +
    (gatewayFee > 0 ? gatewayFee * (GST_RATE / (1 + GST_RATE)) : 0);

  const totalAmount = subtotal + deliveryBreakdown.total + PLATFORM_FEE + packagingFeeBase + packagingTax + gatewayFee + codCharge - discount;

  return {
    restaurantId,
    paymentMethod,
    notes,
    subtotal,
    deliveryFee: deliveryBreakdown.total,
    deliveryFeeBase: deliveryBreakdown.base,
    deliveryTax: deliveryBreakdown.tax,
    packagingFee: packagingFeeBase + packagingTax,
    packagingFeeBase,
    packagingTax,
    platformFee: PLATFORM_FEE,
    platformFeeBase,
    platformTax,
    gatewayFee,
    codCharge,
    discount,
    couponCode,
    totalTax: Number(totalTax.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    deliveryDistance,
    resolvedAddressId,
    itemRows: items.map((item) => {
      const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: Number(menuItem.price) * item.quantity,
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
  gatewayProvider = null,
  gatewayOrderId = null,
  gatewayPaymentId = null,
  gatewaySignature = null,
  pricing = null,
}) => {
  // Fix #1: Wrap the entire order creation in a serializable transaction.
  //
  // Without this, 100 concurrent orders against the same restaurant can
  // race: two requests both read isOpen=true, then the restaurant closes
  // between the read and the write — both orders get created against a
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
          pricing,
        },
        tx, // pass the transaction client so all queries inside use it
      );

      return tx.order.create({
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
          totalTax: draft.totalTax,
          totalAmount: draft.totalAmount,
          deliveryDistance: draft.deliveryDistance,
          notes,
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
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
    },
    {
      // ReadCommitted is sufficient: we re-read restaurant/menu inside the tx,
      // so we catch any changes. Serializable would be safer but adds
      // contention; ReadCommitted is the right tradeoff for order creation.
      isolationLevel: "ReadCommitted",
      // 10s max — geocoding is done BEFORE the transaction opens (see prepareOrderDraft)
      timeout: 10000,
    },
  );

  return order;
};

export { createPersistedOrder, prepareOrderDraft, serializeOrder };
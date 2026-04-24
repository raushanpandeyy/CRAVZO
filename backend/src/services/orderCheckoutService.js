import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { getLatLngFromAddress } from "../utils/geocode.js";

const buildFullAddress = ({ line1, line2, city, state, postalCode }) =>
  [line1, line2, city, state, postalCode, "India"].filter(Boolean).join(", ");

const geocodeDeliveryAddress = async (address) => {
  if (!address?.line1 || !address?.city || !address?.state || !address?.postalCode) {
    return { lat: null, lng: null };
  }

  return getLatLngFromAddress(buildFullAddress(address));
};

const serializeOrder = (order) => ({
  id: order.id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  subtotal: Number(order.subtotal),
  deliveryFee: Number(order.deliveryFee),
  packagingFee: Number(order.packagingFee),
  taxAmount: Number(order.taxAmount),
  totalAmount: Number(order.totalAmount),
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

const prepareOrderDraft = async ({ customerId, restaurantId, items = [], address = null, addressId = null, paymentMethod = "UPI", notes = null }) => {
  if (!restaurantId || items.length === 0) {
    throw new ApiError(400, "Restaurant and at least one item are required");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, status: "ACTIVE", isOpen: true },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const menuItems = await prisma.menuItem.findMany({
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

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const packagingFee = Number((subtotal * 0.03).toFixed(2));
  const taxAmount = Number((subtotal * 0.18).toFixed(2));
  const totalAmount = subtotal + deliveryFee + packagingFee + taxAmount;

  let resolvedAddressId = null;

  if (addressId) {
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: customerId,
      },
    });

    if (!existingAddress) {
      throw new ApiError(404, "Saved address not found");
    }

    resolvedAddressId = existingAddress.id;

    if (existingAddress.latitude === null || existingAddress.longitude === null) {
      const coords = await geocodeDeliveryAddress(existingAddress);

      if (coords.lat !== null && coords.lng !== null) {
        await prisma.address.update({
          where: { id: existingAddress.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng,
          },
        });
      }
    }
  } else if (address && address.fullName && address.phone && address.line1 && address.city && address.state && address.postalCode) {
    const coords = await geocodeDeliveryAddress(address);
    const createdAddress = await prisma.address.create({
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

  return {
    restaurantId,
    paymentMethod,
    notes,
    subtotal,
    deliveryFee,
    packagingFee,
    taxAmount,
    totalAmount,
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
}) => {
  const draft = await prepareOrderDraft({
    customerId,
    restaurantId,
    items,
    address,
    addressId,
    paymentMethod,
    notes,
  });

  const order = await prisma.order.create({
    data: {
      customerId,
      restaurantId: draft.restaurantId,
      addressId: draft.resolvedAddressId,
      paymentMethod,
      paymentStatus,
      subtotal: draft.subtotal,
      deliveryFee: draft.deliveryFee,
      packagingFee: draft.packagingFee,
      taxAmount: draft.taxAmount,
      totalAmount: draft.totalAmount,
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

  return order;
};

export { createPersistedOrder, prepareOrderDraft, serializeOrder };

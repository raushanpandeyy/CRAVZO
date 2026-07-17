import { prisma } from "../config/database.js";

const buildVendorRestaurantAccessWhere = (vendorId) => ({
  OR: [
    { vendorId },
    { operatorAccesses: { some: { vendorId } } },
  ],
});

const buildVendorOrderAccessWhere = (vendorId) => ({
  restaurant: buildVendorRestaurantAccessWhere(vendorId),
});

const getVendorManagedRestaurantIds = async (vendorId, db = prisma) => {
  const restaurants = await db.restaurant.findMany({
    where: buildVendorRestaurantAccessWhere(vendorId),
    select: { id: true },
  });

  return restaurants.map((restaurant) => restaurant.id);
};

const canVendorManageRestaurant = (restaurant, vendorId) => {
  if (!restaurant || !vendorId) return false;
  if (restaurant.vendorId === vendorId) return true;
  return Boolean(restaurant.operatorAccesses?.some((access) => access.vendorId === vendorId));
};

const assertVendorCanManageRestaurant = async (restaurantId, vendorId, db = prisma) => {
  const restaurant = await db.restaurant.findFirst({
    where: {
      id: restaurantId,
      ...buildVendorRestaurantAccessWhere(vendorId),
    },
  });

  return restaurant;
};

const getRestaurantNotificationVendorIds = async (restaurant, db = prisma) => {
  if (!restaurant?.id) return restaurant?.vendorId ? [restaurant.vendorId] : [];

  const accessRows = await db.restaurantOperatorAccess.findMany({
    where: { restaurantId: restaurant.id },
    select: { vendorId: true },
  });

  return [...new Set([restaurant.vendorId, ...accessRows.map((row) => row.vendorId)].filter(Boolean))];
};

export {
  assertVendorCanManageRestaurant,
  buildVendorOrderAccessWhere,
  buildVendorRestaurantAccessWhere,
  canVendorManageRestaurant,
  getRestaurantNotificationVendorIds,
  getVendorManagedRestaurantIds,
};


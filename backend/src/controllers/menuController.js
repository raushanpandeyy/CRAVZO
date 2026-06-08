import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { getCache, setCache } from "../utils/cache.js";
import { MENU_ITEMS_CACHE_TTL_SECONDS, invalidatePublicRestaurantCache } from "../utils/publicCache.js";
import { createMenuItemSchema, updateMenuItemSchema } from "../validators/menuValidators.js";

const serializeMenuItem = (item) => ({
  id: item.id,
  restaurantId: item.restaurantId,
  name: item.name,
  description: item.description,
  category: item.category,
  imageUrl: item.imageUrl,
  price: Number(item.price),
  sizes: item.sizes,
  isVeg: item.isVeg,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const listMenuItems = async (req, res) => {
  const cacheKey = `menu-items:restaurant:${req.params.restaurantId}`;
  const cachedResponse = await getCache(cacheKey);

  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId: req.params.restaurantId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      restaurantId: true,
      name: true,
      description: true,
      category: true,
      imageUrl: true,
      price: true,
      sizes: true,
      isVeg: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const response = apiResponse({
    message: "Menu items fetched successfully",
    data: {
      restaurantId: req.params.restaurantId ?? null,
      items: items.map(serializeMenuItem),
    },
  });

  await setCache(cacheKey, response, MENU_ITEMS_CACHE_TTL_SECONDS);

  return res.status(200).json(response);
};

const createMenuItem = async (req, res) => {
  const payload = createMenuItemSchema.parse(req.body);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: payload.restaurantId },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (req.user.role === "VENDOR" && restaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to manage this restaurant menu");
  }

  const item = await prisma.menuItem.create({
    data: {
      restaurantId: payload.restaurantId,
      name: payload.name,
      description: payload.description || null,
      category: payload.category,
      imageUrl: payload.imageUrl || null,
      price: payload.price,
      sizes: payload.sizes || undefined,
      isVeg: Boolean(payload.isVeg),
      status: payload.status || "ACTIVE",
    },
  });
  await invalidatePublicRestaurantCache(item.restaurantId);

  res.status(201).json(
    apiResponse({
      message: "Menu item created successfully",
      data: serializeMenuItem(item),
    }),
  );
};

const updateMenuItem = async (req, res) => {
  const payload = updateMenuItemSchema.parse(req.body);

  const existingItem = await prisma.menuItem.findUnique({
    where: { id: req.params.menuItemId },
    include: {
      restaurant: true,
    },
  });

  if (!existingItem) {
    throw new ApiError(404, "Menu item not found");
  }

  if (req.user.role === "VENDOR" && existingItem.restaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to update this menu item");
  }

  const item = await prisma.menuItem.update({
    where: { id: req.params.menuItemId },
    data: {
      name: payload.name ?? existingItem.name,
      description: payload.description ?? existingItem.description,
      category: payload.category ?? existingItem.category,
      imageUrl: payload.imageUrl ?? existingItem.imageUrl,
      price: payload.price ?? existingItem.price,
      sizes: payload.sizes !== undefined ? payload.sizes : existingItem.sizes,
      isVeg: typeof payload.isVeg === "boolean" ? payload.isVeg : existingItem.isVeg,
      status: payload.status ?? existingItem.status,
    },
  });
  await invalidatePublicRestaurantCache(item.restaurantId);

  res.status(200).json(
    apiResponse({
      message: "Menu item updated successfully",
      data: serializeMenuItem(item),
    }),
  );
};

const deleteMenuItem = async (req, res) => {
  const existingItem = await prisma.menuItem.findUnique({
    where: { id: req.params.menuItemId },
    include: {
      restaurant: true,
    },
  });

  if (!existingItem) {
    throw new ApiError(404, "Menu item not found");
  }

  if (req.user.role === "VENDOR" && existingItem.restaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to delete this menu item");
  }

  await prisma.menuItem.delete({
    where: { id: req.params.menuItemId },
  });
  await invalidatePublicRestaurantCache(existingItem.restaurantId);

  res.status(200).json(
    apiResponse({
      message: "Menu item deleted successfully",
      data: {
        menuItemId: req.params.menuItemId,
      },
    }),
  );
};

export { createMenuItem, deleteMenuItem, listMenuItems, updateMenuItem };

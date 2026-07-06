import { z } from "zod";

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
  sideDishes: item.sideDishes,
  isVeg: item.isVeg,
  trackInventory: item.trackInventory,
  stockQuantity: item.stockQuantity,
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
      sideDishes: true,
      isVeg: true,
      trackInventory: true,
      stockQuantity: true,
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
      sideDishes: payload.sideDishes || undefined,
      isVeg: Boolean(payload.isVeg),
      trackInventory: Boolean(payload.trackInventory),
      stockQuantity: payload.stockQuantity ?? null,
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
      sideDishes: payload.sideDishes !== undefined ? payload.sideDishes : existingItem.sideDishes,
      isVeg: typeof payload.isVeg === "boolean" ? payload.isVeg : existingItem.isVeg,
      trackInventory: typeof payload.trackInventory === "boolean" ? payload.trackInventory : existingItem.trackInventory,
      stockQuantity: payload.stockQuantity !== undefined ? payload.stockQuantity : existingItem.stockQuantity,
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

const bulkImportMenuItems = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Items array is required with at least one item");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { vendorId: req.user.sub },
  });
  if (!restaurant) {
    throw new ApiError(404, "No restaurant found for this vendor");
  }

  const restaurantId = restaurant.id;

  const bulkItemSchema = z.object({
    name: z.string().trim().min(2).max(120),
    price: z.coerce.number().positive().max(100000),
    category: z.string().trim().min(2).max(80),
    description: z.string().trim().max(1000).optional().nullable(),
    imageUrl: z.string().trim().url().optional().nullable(),
    isVeg: z.coerce.boolean().optional(),
    sizes: z.array(z.object({
      size: z.enum(["S", "M", "L"]),
      price: z.coerce.number().positive().max(100000),
    })).max(3).optional().nullable(),
    sideDishes: z.array(z.object({
      name: z.string().trim().min(1).max(100),
      price: z.coerce.number().positive().max(100000),
    })).max(20).optional().nullable(),
    trackInventory: z.coerce.boolean().optional(),
    stockQuantity: z.coerce.number().int().min(0).max(1000000).optional().nullable(),
  });

  const validItems = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const result = bulkItemSchema.safeParse(items[i]);
    if (result.success) {
      validItems.push(result.data);
    } else {
      errors.push({
        index: i,
        item: items[i],
        errors: result.error.issues.map((iss) => iss.message),
      });
    }
  }

  const createdItems = await prisma.$transaction(
    validItems.map((data) =>
      prisma.menuItem.create({
        data: {
          restaurantId,
          name: data.name,
          price: data.price,
          category: data.category,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          isVeg: Boolean(data.isVeg),
          sizes: data.sizes || undefined,
          sideDishes: data.sideDishes || undefined,
          trackInventory: Boolean(data.trackInventory),
          stockQuantity: data.stockQuantity ?? null,
          status: "ACTIVE",
        },
      }),
    ),
  );

  res.status(201).json(
    apiResponse({
      message: `${createdItems.length} menu items imported successfully`,
      data: {
        created: createdItems.map(serializeMenuItem),
        errors: errors.length > 0 ? errors : undefined,
        totalProcessed: items.length,
        successCount: createdItems.length,
        errorCount: errors.length,
      },
    }),
  );
};

const getLowStockItems = async (req, res) => {
  const threshold = Math.max(1, Number.parseInt(req.query.threshold, 10) || 10);

  const restaurant = await prisma.restaurant.findFirst({
    where: { vendorId: req.user.sub },
  });
  if (!restaurant) {
    throw new ApiError(404, "No restaurant found for this vendor");
  }

  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId: restaurant.id,
      trackInventory: true,
      stockQuantity: { lt: threshold },
      status: "ACTIVE",
    },
    orderBy: { stockQuantity: "asc" },
  });

  res.status(200).json(
    apiResponse({
      message: "Low stock items fetched successfully",
      data: items.map((item) => ({
        ...serializeMenuItem(item),
        stockQuantity: item.stockQuantity,
      })),
    }),
  );
};

export {
  bulkImportMenuItems,
  createMenuItem,
  deleteMenuItem,
  getLowStockItems,
  listMenuItems,
  updateMenuItem,
};

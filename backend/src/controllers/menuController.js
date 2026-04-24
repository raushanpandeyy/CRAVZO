import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const serializeMenuItem = (item) => ({
  id: item.id,
  restaurantId: item.restaurantId,
  name: item.name,
  description: item.description,
  category: item.category,
  imageUrl: item.imageUrl,
  price: Number(item.price),
  isVeg: item.isVeg,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const listMenuItems = async (req, res) => {
  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId: req.params.restaurantId,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
  });

  res.status(200).json(
    apiResponse({
      message: "Menu items fetched successfully",
      data: {
        restaurantId: req.params.restaurantId ?? null,
        items: items.map(serializeMenuItem),
      },
    }),
  );
};

const createMenuItem = async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.body.restaurantId },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (req.user.role === "VENDOR" && restaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to manage this restaurant menu");
  }

  const item = await prisma.menuItem.create({
    data: {
      restaurantId: req.body.restaurantId,
      name: req.body.name,
      description: req.body.description || null,
      category: req.body.category,
      imageUrl: req.body.imageUrl || null,
      price: req.body.price,
      isVeg: Boolean(req.body.isVeg),
      status: req.body.status || "ACTIVE",
    },
  });

  res.status(201).json(
    apiResponse({
      message: "Menu item created successfully",
      data: serializeMenuItem(item),
    }),
  );
};

const updateMenuItem = async (req, res) => {
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
      name: req.body.name ?? existingItem.name,
      description: req.body.description ?? existingItem.description,
      category: req.body.category ?? existingItem.category,
      imageUrl: req.body.imageUrl ?? existingItem.imageUrl,
      price: req.body.price ?? existingItem.price,
      isVeg: typeof req.body.isVeg === "boolean" ? req.body.isVeg : existingItem.isVeg,
      status: req.body.status ?? existingItem.status,
    },
  });

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

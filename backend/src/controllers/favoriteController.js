import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { createFavoriteSchema } from "../validators/favoriteValidators.js";

const serializeFavorite = (favorite) => {
  const restaurant = favorite.restaurant;
  return {
    id: favorite.id,
    restaurantId: favorite.restaurantId || restaurant?.id || null,
    createdAt: favorite.createdAt,
    restaurant: restaurant
      ? {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
          cuisine: restaurant.cuisine,
          location: [restaurant.addressLine1, restaurant.city].filter(Boolean).join(", "),
          city: restaurant.city,
          imageUrl: restaurant.imageUrl,
          isOpen: restaurant.isOpen,
          status: restaurant.status,
        }
      : null,
  };
};

const listFavorites = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: req.user.sub },
      include: { restaurant: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.favorite.count({ where: { userId: req.user.sub } }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Favorites fetched successfully",
      data: favorites.map(serializeFavorite),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }),
  );
};

const createFavorite = async (req, res) => {
  const { restaurantId, menuItemId } = createFavoriteSchema.parse(req.body);

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      status: "ACTIVE",
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (menuItemId) {
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurantId, status: "ACTIVE" },
    });
    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }
  }

  const include = {
    restaurant: true,
    menuItem: menuItemId
      ? { select: { id: true, name: true, price: true, imageUrl: true } }
      : false,
  };

  const existingFavorite = await prisma.favorite.findFirst({
    where: {
      userId: req.user.sub,
      restaurantId,
      menuItemId: menuItemId ?? null,
    },
    include,
  });

  const favorite = existingFavorite || await prisma.favorite.create({
    data: {
      userId: req.user.sub,
      restaurantId,
      menuItemId: menuItemId ?? null,
    },
    include,
  });

  const data = menuItemId
    ? {
        id: favorite.id,
        restaurantId: favorite.restaurantId,
        menuItemId: favorite.menuItemId,
        createdAt: favorite.createdAt,
        restaurant: { id: favorite.restaurant.id, name: favorite.restaurant.name, imageUrl: favorite.restaurant.imageUrl },
        menuItem: favorite.menuItem,
      }
    : serializeFavorite(favorite);

  res.status(201).json(
    apiResponse({
      message: menuItemId ? "Dish added to favorites" : "Restaurant added to favorites",
      data,
    }),
  );
};

const deleteFavorite = async (req, res) => {
  const favorite = await prisma.favorite.findFirst({
    where: {
      userId: req.user.sub,
      restaurantId: req.params.restaurantId,
    },
  });

  if (!favorite) {
    throw new ApiError(404, "Favorite not found");
  }

  await prisma.favorite.delete({
    where: {
      id: favorite.id,
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Restaurant removed from favorites",
      data: {
        restaurantId: req.params.restaurantId,
      },
    }),
  );
};

// Lightweight check: returns single boolean instead of entire favorites list
// GET /api/favorites/check?restaurantId=xxx&menuItemId=xxx -> { isFavorite: true/false }
const checkFavorite = async (req, res) => {
  const { restaurantId, menuItemId } = req.query;
  if (!restaurantId) {
    return res.status(200).json(apiResponse({ message: "ok", data: { isFavorite: false } }));
  }

  const where = { userId: req.user.sub, restaurantId };
  if (menuItemId) {
    where.menuItemId = menuItemId;
  }

  const favorite = await prisma.favorite.findFirst({
    where,
    select: { id: true },
  });

  res.status(200).json(
    apiResponse({ message: "ok", data: { isFavorite: Boolean(favorite) } }),
  );
};

const getDishFavorites = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: req.user.sub, menuItemId: { not: null } },
      include: {
        menuItem: {
          select: { id: true, name: true, price: true, imageUrl: true, isVeg: true, category: true },
        },
        restaurant: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.favorite.count({ where: { userId: req.user.sub, menuItemId: { not: null } } }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Dish favorites fetched successfully",
      data: favorites.map((f) => ({
        id: f.id,
        restaurantId: f.restaurantId,
        menuItemId: f.menuItemId,
        menuItem: f.menuItem,
        restaurant: f.restaurant,
        createdAt: f.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }),
  );
};

const removeDishFavorite = async (req, res) => {
  const { menuItemId } = req.params;

  const favorite = await prisma.favorite.findFirst({
    where: { userId: req.user.sub, menuItemId },
  });

  if (!favorite) {
    throw new ApiError(404, "Dish favorite not found");
  }

  await prisma.favorite.delete({ where: { id: favorite.id } });

  res.status(200).json(
    apiResponse({
      message: "Dish removed from favorites",
      data: { menuItemId },
    }),
  );
};

export { checkFavorite, createFavorite, deleteFavorite, getDishFavorites, listFavorites, removeDishFavorite };


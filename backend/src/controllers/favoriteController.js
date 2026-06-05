import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const serializeFavorite = (favorite) => ({
  id: favorite.id,
  restaurantId: favorite.restaurant.id,
  createdAt: favorite.createdAt,
  restaurant: {
    id: favorite.restaurant.id,
    name: favorite.restaurant.name,
    slug: favorite.restaurant.slug,
    description: favorite.restaurant.description,
    cuisine: favorite.restaurant.cuisine,
    location: [favorite.restaurant.addressLine1, favorite.restaurant.city].filter(Boolean).join(", "),
    city: favorite.restaurant.city,
    imageUrl: favorite.restaurant.imageUrl,
    isOpen: favorite.restaurant.isOpen,
    status: favorite.restaurant.status,
  },
});

const listFavorites = async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId: req.user.sub,
    },
    include: {
      restaurant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Favorites fetched successfully",
      data: favorites.map(serializeFavorite),
    }),
  );
};

const createFavorite = async (req, res) => {
  const { restaurantId } = req.body;

  if (!restaurantId) {
    throw new ApiError(400, "Restaurant is required");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      status: "ACTIVE",
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_restaurantId: {
        userId: req.user.sub,
        restaurantId,
      },
    },
    update: {},
    create: {
      userId: req.user.sub,
      restaurantId,
    },
    include: {
      restaurant: true,
    },
  });

  res.status(201).json(
    apiResponse({
      message: "Restaurant added to favorites",
      data: serializeFavorite(favorite),
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

// Fix 4: Lightweight check — returns single boolean instead of entire favorites list
// GET /api/favorites/check?restaurantId=xxx → { isFavorite: true/false }
const checkFavorite = async (req, res) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(200).json(apiResponse({ message: "ok", data: { isFavorite: false } }));
  }

  const favorite = await prisma.favorite.findFirst({
    where: { userId: req.user.sub, restaurantId },
    select: { id: true },
  });

  res.status(200).json(
    apiResponse({ message: "ok", data: { isFavorite: Boolean(favorite) } }),
  );
};

export { createFavorite, deleteFavorite, listFavorites, checkFavorite };

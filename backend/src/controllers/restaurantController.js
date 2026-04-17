import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const serializeRestaurant = (restaurant) => ({
  id: restaurant.id,
  vendorId: restaurant.vendorId,
  name: restaurant.name,
  slug: restaurant.slug,
  description: restaurant.description,
  cuisine: restaurant.cuisine,
  phone: restaurant.phone,
  location: [restaurant.addressLine1, restaurant.city].filter(Boolean).join(", "),
  addressLine1: restaurant.addressLine1,
  addressLine2: restaurant.addressLine2,
  city: restaurant.city,
  state: restaurant.state,
  postalCode: restaurant.postalCode,
  imageUrl: restaurant.imageUrl,
  status: restaurant.status,
  isOpen: restaurant.isOpen,
  createdAt: restaurant.createdAt,
  updatedAt: restaurant.updatedAt,
  menuPreview: restaurant.menuItems?.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    imageUrl: item.imageUrl,
  })),
});

const listRestaurants = async (req, res) => {
  const search = req.query.search?.trim();
  const city = req.query.city?.trim();
  const dish = req.query.dish?.trim();

  const restaurants = await prisma.restaurant.findMany({
    where: {
      status: "ACTIVE",
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(search || dish
        ? {
            OR: [
              ...(search
                ? [
                    { name: { contains: search, mode: "insensitive" } },
                    { cuisine: { contains: search, mode: "insensitive" } },
                    { city: { contains: search, mode: "insensitive" } },
                  ]
                : []),
              ...(dish
                ? [{ menuItems: { some: { name: { contains: dish, mode: "insensitive" }, status: "ACTIVE" } } }]
                : []),
            ],
          }
        : {}),
    },
    include: {
      menuItems: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        take: 4,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(
    apiResponse({
      message: "Restaurants fetched successfully",
      data: restaurants.map(serializeRestaurant),
    }),
  );
};

const getRestaurantById = async (req, res) => {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: req.params.restaurantId,
      status: "ACTIVE",
    },
    include: {
      menuItems: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  res.status(200).json(
    apiResponse({
      message: "Restaurant fetched successfully",
      data: {
        ...serializeRestaurant(restaurant),
        menuItems: restaurant.menuItems.map((item) => ({
          id: item.id,
          restaurantId: item.restaurantId,
          name: item.name,
          description: item.description,
          category: item.category,
          imageUrl: item.imageUrl,
          price: Number(item.price),
          isVeg: item.isVeg,
          status: item.status,
        })),
      },
    }),
  );
};

const getMyRestaurant = async (req, res) => {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      vendorId: req.user.sub,
    },
    include: {
      menuItems: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Vendor restaurant fetched successfully",
      data: restaurant
        ? {
            ...serializeRestaurant(restaurant),
            menuItems: restaurant.menuItems.map((item) => ({
              id: item.id,
              restaurantId: item.restaurantId,
              name: item.name,
              description: item.description,
              category: item.category,
              imageUrl: item.imageUrl,
              price: Number(item.price),
              isVeg: item.isVeg,
              status: item.status,
            })),
          }
        : null,
    }),
  );
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createRestaurant = async (req, res) => {
  if (req.user.role === "VENDOR") {
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        vendorId: req.user.sub,
      },
    });

    if (existingRestaurant) {
      throw new ApiError(409, "You already have a restaurant profile. Update it instead.");
    }
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      vendorId: req.user.sub,
      name: req.body.name,
      slug: req.body.slug || slugify(req.body.name),
      description: req.body.description || null,
      cuisine: req.body.cuisine || null,
      phone: req.body.phone || null,
      addressLine1: req.body.addressLine1 || null,
      addressLine2: req.body.addressLine2 || null,
      city: req.body.city || null,
      state: req.body.state || null,
      postalCode: req.body.postalCode || null,
      imageUrl: req.body.imageUrl || null,
      status: req.body.status || "DRAFT",
      isOpen: Boolean(req.body.isOpen),
    },
  });

  res.status(201).json(
    apiResponse({
      message: "Restaurant created successfully",
      data: serializeRestaurant(restaurant),
    }),
  );
};

const updateRestaurant = async (req, res) => {
  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.restaurantId },
  });

  if (!existingRestaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (req.user.role === "VENDOR" && existingRestaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to update this restaurant");
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: { id: req.params.restaurantId },
    data: {
      name: req.body.name ?? existingRestaurant.name,
      slug: req.body.slug ?? existingRestaurant.slug,
      description: req.body.description ?? existingRestaurant.description,
      cuisine: req.body.cuisine ?? existingRestaurant.cuisine,
      phone: req.body.phone ?? existingRestaurant.phone,
      addressLine1: req.body.addressLine1 ?? existingRestaurant.addressLine1,
      addressLine2: req.body.addressLine2 ?? existingRestaurant.addressLine2,
      city: req.body.city ?? existingRestaurant.city,
      state: req.body.state ?? existingRestaurant.state,
      postalCode: req.body.postalCode ?? existingRestaurant.postalCode,
      imageUrl: req.body.imageUrl ?? existingRestaurant.imageUrl,
      status: req.body.status ?? existingRestaurant.status,
      isOpen: typeof req.body.isOpen === "boolean" ? req.body.isOpen : existingRestaurant.isOpen,
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Restaurant updated successfully",
      data: serializeRestaurant(updatedRestaurant),
    }),
  );
};

export { createRestaurant, getMyRestaurant, getRestaurantById, listRestaurants, updateRestaurant };

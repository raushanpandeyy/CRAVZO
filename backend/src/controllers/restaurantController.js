import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
<<<<<<< HEAD
import { getLatLngFromAddress } from "../utils/geocode.js";
import { getNearbyRestaurantsService } from "../../../src/services/locationService.js";


// ================= SERIALIZER =================
=======

>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
  openingTime: restaurant.openingTime,
  closingTime: restaurant.closingTime,
  openDays: Array.isArray(restaurant.openDays) ? restaurant.openDays : [],
  bankDetails: restaurant.bankDetails,
  latitude: restaurant.latitude,
longitude: restaurant.longitude,
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  createdAt: restaurant.createdAt,
  updatedAt: restaurant.updatedAt,
  menuPreview: restaurant.menuItems?.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    imageUrl: item.imageUrl,
  })),
});

<<<<<<< HEAD
// ================= LIST =================
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
const listRestaurants = async (req, res) => {
  const search = req.query.search?.trim();
  const city = req.query.city?.trim();
  const dish = req.query.dish?.trim();

  const restaurants = await prisma.restaurant.findMany({
    where: {
      status: "ACTIVE",
<<<<<<< HEAD
      isOpen: true,
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
    })
  );
};

// ================= GET BY ID =================
=======
    }),
  );
};

>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
const getRestaurantById = async (req, res) => {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: req.params.restaurantId,
      status: "ACTIVE",
<<<<<<< HEAD
      isOpen: true,
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
    })
  );
};

// ================= MY RESTAURANT =================
=======
    }),
  );
};

>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
    })
  );
};


const getNearbyRestaurants = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    throw new ApiError(400, "User location required");
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const restaurants = await prisma.restaurant.findMany({
    where: {
      status: "ACTIVE",
      isOpen: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      menuItems: {
        where: { status: "ACTIVE" },
        take: 4,
      },
    },
  });

  const nearby = getNearbyRestaurantsService(
    restaurants.map(serializeRestaurant),
    userLat,
    userLng
  );

  res.status(200).json(
    apiResponse({
      message: "Nearby restaurants fetched",
      data: nearby,
    })
  );
};

// ================= SLUG =================
=======
    }),
  );
};

>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

<<<<<<< HEAD
// ================= CREATE =================
const createRestaurant = async (req, res) => {
  if (req.user.role === "VENDOR") {
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { vendorId: req.user.sub },
=======
const createRestaurant = async (req, res) => {
  if (req.user.role === "VENDOR") {
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        vendorId: req.user.sub,
      },
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    });

    if (existingRestaurant) {
      throw new ApiError(409, "You already have a restaurant profile. Update it instead.");
    }
  }

<<<<<<< HEAD
  const { addressLine1, addressLine2, city, state, postalCode } = req.body;

  if (!addressLine1 || !city || !state) {
    throw new ApiError(400, "Complete address is required");
  }

  const fullAddress = `${addressLine1}, ${city}, ${state}, ${postalCode || ""}, India`;

  const { lat, lng } = await getLatLngFromAddress(fullAddress);

=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const restaurant = await prisma.restaurant.create({
    data: {
      vendorId: req.user.sub,
      name: req.body.name,
      slug: req.body.slug || slugify(req.body.name),
      description: req.body.description || null,
      cuisine: req.body.cuisine || null,
      phone: req.body.phone || null,
<<<<<<< HEAD
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      postalCode,
      latitude: lat || null,
      longitude: lng || null,
      imageUrl: req.body.imageUrl || null,
      status: req.body.status || "DRAFT",
      isOpen: Boolean(req.body.isOpen),
      openingTime: req.body.openingTime || null,
      closingTime: req.body.closingTime || null,
      openDays: Array.isArray(req.body.openDays) ? req.body.openDays : [],
      bankDetails: req.body.bankDetails || null,
=======
      addressLine1: req.body.addressLine1 || null,
      addressLine2: req.body.addressLine2 || null,
      city: req.body.city || null,
      state: req.body.state || null,
      postalCode: req.body.postalCode || null,
      imageUrl: req.body.imageUrl || null,
      status: req.body.status || "DRAFT",
      isOpen: Boolean(req.body.isOpen),
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    },
  });

  res.status(201).json(
    apiResponse({
      message: "Restaurant created successfully",
      data: serializeRestaurant(restaurant),
<<<<<<< HEAD
    })
  );
};

// ================= UPDATE =================
=======
    }),
  );
};

>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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

<<<<<<< HEAD
  const newAddressLine1 = req.body.addressLine1 ?? existingRestaurant.addressLine1;
  const newAddressLine2 = req.body.addressLine2 ?? existingRestaurant.addressLine2;
  const newCity = req.body.city ?? existingRestaurant.city;
  const newState = req.body.state ?? existingRestaurant.state;
  const newPostalCode = req.body.postalCode ?? existingRestaurant.postalCode;

  const addressChanged =
    newAddressLine1 !== existingRestaurant.addressLine1 ||
    newAddressLine2 !== existingRestaurant.addressLine2 ||
    newCity !== existingRestaurant.city ||
    newState !== existingRestaurant.state ||
    newPostalCode !== existingRestaurant.postalCode;

  let lat = existingRestaurant.latitude;
  let lng = existingRestaurant.longitude;

  if (addressChanged) {
    const fullAddress = `${newAddressLine1}, ${newCity}, ${newState}, ${newPostalCode || ""}, India`;
    const coords = await getLatLngFromAddress(fullAddress);
    lat = coords.lat;
    lng = coords.lng;
  }

=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const updatedRestaurant = await prisma.restaurant.update({
    where: { id: req.params.restaurantId },
    data: {
      name: req.body.name ?? existingRestaurant.name,
      slug: req.body.slug ?? existingRestaurant.slug,
      description: req.body.description ?? existingRestaurant.description,
      cuisine: req.body.cuisine ?? existingRestaurant.cuisine,
      phone: req.body.phone ?? existingRestaurant.phone,
<<<<<<< HEAD
      addressLine1: newAddressLine1,
      addressLine2: newAddressLine2,
      city: newCity,
      state: newState,
      postalCode: newPostalCode,
      latitude: lat || null,
      longitude: lng || null,
      imageUrl: req.body.imageUrl ?? existingRestaurant.imageUrl,
      status: req.body.status ?? existingRestaurant.status,
      isOpen:
        typeof req.body.isOpen === "boolean"
          ? req.body.isOpen
          : existingRestaurant.isOpen,
      openingTime: req.body.openingTime ?? existingRestaurant.openingTime,
      closingTime: req.body.closingTime ?? existingRestaurant.closingTime,
      openDays: Array.isArray(req.body.openDays) ? req.body.openDays : existingRestaurant.openDays,
      bankDetails: req.body.bankDetails !== undefined ? req.body.bankDetails : existingRestaurant.bankDetails,
=======
      addressLine1: req.body.addressLine1 ?? existingRestaurant.addressLine1,
      addressLine2: req.body.addressLine2 ?? existingRestaurant.addressLine2,
      city: req.body.city ?? existingRestaurant.city,
      state: req.body.state ?? existingRestaurant.state,
      postalCode: req.body.postalCode ?? existingRestaurant.postalCode,
      imageUrl: req.body.imageUrl ?? existingRestaurant.imageUrl,
      status: req.body.status ?? existingRestaurant.status,
      isOpen: typeof req.body.isOpen === "boolean" ? req.body.isOpen : existingRestaurant.isOpen,
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Restaurant updated successfully",
      data: serializeRestaurant(updatedRestaurant),
<<<<<<< HEAD
    })
  );
};

export {
  createRestaurant,
  updateRestaurant,
  getRestaurantById,
  getMyRestaurant,
  listRestaurants,
  getNearbyRestaurants,
};
=======
    }),
  );
};

export { createRestaurant, getMyRestaurant, getRestaurantById, listRestaurants, updateRestaurant };
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

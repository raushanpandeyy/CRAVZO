import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { buildCacheKey, getCache, setCache } from "../utils/cache.js";
import { getLatLngFromAddress } from "../utils/geocode.js";
import {
  NEARBY_RESTAURANTS_CACHE_TTL_SECONDS,
  RESTAURANT_DETAIL_CACHE_TTL_SECONDS,
  RESTAURANT_LIST_CACHE_TTL_SECONDS,
  SEARCH_CACHE_TTL_SECONDS,
  buildNearbyCacheKey,
  invalidatePublicRestaurantCache,
} from "../utils/publicCache.js";
import { createRestaurantSchema, updateRestaurantSchema } from "../validators/restaurantValidators.js";
import { getNearbyRestaurantsService } from "../services/locationService.js";

const DEFAULT_RESTAURANT_PAGE = 1;
const DEFAULT_RESTAURANT_LIMIT = 12;
const MAX_RESTAURANT_LIMIT = 25;
const DEFAULT_MENU_PREVIEW_LIMIT = 4;
const DISH_MENU_PREVIEW_LIMIT = 8;

const parseRestaurantPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || DEFAULT_RESTAURANT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || DEFAULT_RESTAURANT_LIMIT, 1),
    MAX_RESTAURANT_LIMIT,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// ================= SERIALIZER =================
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
  openingTime: restaurant.openingTime,
  closingTime: restaurant.closingTime,
  openDays: Array.isArray(restaurant.openDays) ? restaurant.openDays : [],
  bankDetails: restaurant.bankDetails,
  latitude: restaurant.latitude,
longitude: restaurant.longitude,
  createdAt: restaurant.createdAt,
  updatedAt: restaurant.updatedAt,
  menuPreview: restaurant.menuItems?.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    sizes: item.sizes,
  })),
});

// ================= LIST =================
const listRestaurants = async (req, res) => {
  const { page, limit, skip } = parseRestaurantPagination(req.query);
  const search = req.query.search?.trim();
  const city = req.query.city?.trim();
  const dish = req.query.dish?.trim();
  const cacheKey = buildCacheKey("restaurants:list", {
    city,
    dish,
    limit,
    page,
    search,
  });
  const cachedResponse = await getCache(cacheKey);

  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  const menuItemMatch = dish
    ? {
        OR: [
          { name: { contains: dish, mode: "insensitive" } },
          { category: { contains: dish, mode: "insensitive" } },
          { description: { contains: dish, mode: "insensitive" } },
        ],
      }
    : null;

  const where = {
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
              ? [
                  { cuisine: { contains: dish, mode: "insensitive" } },
                  { menuItems: { some: { status: "ACTIVE", ...menuItemMatch } } },
                ]
              : []),
          ],
        }
      : {}),
  };

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        vendorId: true,
        name: true,
        slug: true,
        description: true,
        cuisine: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        imageUrl: true,
        status: true,
        isOpen: true,
        openingTime: true,
        closingTime: true,
        openDays: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        menuItems: {
          where: {
            status: "ACTIVE",
            ...(menuItemMatch || {}),
          },
          orderBy: { createdAt: "asc" },
          take: dish ? DISH_MENU_PREVIEW_LIMIT : DEFAULT_MENU_PREVIEW_LIMIT,
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.restaurant.count({ where }),
  ]);

  const response = apiResponse({
    message: "Restaurants fetched successfully",
    data: restaurants.map(serializeRestaurant),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });

  await setCache(cacheKey, response, RESTAURANT_LIST_CACHE_TTL_SECONDS);

  return res.status(200).json(response);
};

// ================= GET BY ID =================
const getRestaurantById = async (req, res) => {
  const cacheKey = `restaurants:detail:${req.params.restaurantId}`;
  const cachedResponse = await getCache(cacheKey);

  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: req.params.restaurantId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      vendorId: true,
      name: true,
      slug: true,
      description: true,
      cuisine: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      imageUrl: true,
      status: true,
      isOpen: true,
      openingTime: true,
      closingTime: true,
      openDays: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      menuItems: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "asc",
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
        },
      },
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const response = apiResponse({
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
        sizes: item.sizes,
        isVeg: item.isVeg,
        status: item.status,
      })),
    },
  });

  await setCache(cacheKey, response, RESTAURANT_DETAIL_CACHE_TTL_SECONDS);

  return res.status(200).json(response);
};

// ================= MY RESTAURANT =================
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
              sizes: item.sizes,
              isVeg: item.isVeg,
              status: item.status,
            })),
          }
        : null,
    })
  );
};


const getNearbyRestaurants = async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    throw new ApiError(400, "User location required");
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const radiusKm = Math.min(parseFloat(radius) || 3, 10);

  const cacheKey = buildNearbyCacheKey(lat, lng, radiusKm);
  const cachedResponse = await getCache(cacheKey);
  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  const nearbyRows = await prisma.$queryRaw`
    SELECT id, (
      6371 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${userLat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${userLng})) +
          sin(radians(${userLat})) * sin(radians(latitude))
        ))
      )
    ) AS distance
    FROM "Restaurant"
    WHERE status = 'ACTIVE'
      AND is_open = true
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND (
        6371 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(${userLat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${userLng})) +
            sin(radians(${userLat})) * sin(radians(latitude))
          ))
        )
      ) <= ${radiusKm}
    ORDER BY distance
    LIMIT 50
  `;

  if (nearbyRows.length === 0) {
    const emptyResponse = apiResponse({ message: "No nearby restaurants found", data: [] });
    await setCache(cacheKey, emptyResponse, NEARBY_RESTAURANTS_CACHE_TTL_SECONDS);
    return res.status(200).json(emptyResponse);
  }

  const distanceMap = {};
  const ids = nearbyRows.map((r) => {
    distanceMap[r.id] = Number(Number(r.distance).toFixed(2));
    return r.id;
  });

  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      vendorId: true,
      name: true,
      slug: true,
      description: true,
      cuisine: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      imageUrl: true,
      status: true,
      isOpen: true,
      openingTime: true,
      closingTime: true,
      openDays: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      menuItems: {
        where: { status: "ACTIVE" },
        take: 4,
        select: { id: true, name: true, price: true, imageUrl: true },
      },
    },
  });

  const nearby = restaurants.reduce((acc, r) => {
    const item = { ...serializeRestaurant(r), distance: distanceMap[r.id] };
    const insertAt = acc.findIndex((e) => e.distance > item.distance);
    if (insertAt === -1) acc.push(item);
    else acc.splice(insertAt, 0, item);
    return acc;
  }, []);

  const response = apiResponse({
    message: "Nearby restaurants fetched",
    data: nearby,
  });

  await setCache(cacheKey, response, NEARBY_RESTAURANTS_CACHE_TTL_SECONDS);
  return res.status(200).json(response);
};

// ================= SLUG =================
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ================= FULL-TEXT SEARCH =================
// Uses PostgreSQL to_tsvector / plainto_tsquery with GIN indexes.
// Previously used ILIKE '%query%' which did sequential scans even with
// pg_trgm indexes. tsvector provides stemming, ranking, and index-only scans.
const searchRestaurantsAndDishes = async (req, res) => {
  const query = req.query.q?.trim();
  const lat = parseFloat(req.query.lat) || null;
  const lng = parseFloat(req.query.lng) || null;
  const radiusKm = Math.min(parseFloat(req.query.radius) || 3, 10);

  if (!query || query.length < 2) {
    return res.status(200).json(
      apiResponse({ message: "Search results", data: { restaurants: [], dishes: [] } })
    );
  }

  const shouldCache = query.length >= 3;
  const cacheKey = buildCacheKey("search", { q: query.toLowerCase(), lat, lng, radius: radiusKm });

  if (shouldCache) {
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);
  }

  const tsQuery = query.replace(/[^\w\s]/g, "").trim();

  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const distanceExpr = hasCoords
    ? prisma.$queryRaw`(6371 * 2 * asin(sqrt(
        power(sin(radians(${lat} - latitude) / 2), 2) +
        cos(radians(${lat})) * cos(radians(latitude)) *
        power(sin(radians(${lng} - longitude) / 2), 2)
      )))`
    : prisma.$queryRaw`NULL`;

  const [restaurants, dishes] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, name, cuisine, city, image_url AS "imageUrl",
             address_line1 AS "addressLine1", latitude, longitude,
             ${distanceExpr} AS distance
      FROM "Restaurant"
      WHERE status = 'ACTIVE' AND is_open = true
        AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine, '') || ' ' || coalesce(city, ''))
            @@ plainto_tsquery('english', ${tsQuery})
        ${hasCoords ? prisma.$queryRaw`AND (${distanceExpr}) <= ${radiusKm}` : prisma.$queryRaw``}
      ORDER BY ${hasCoords ? prisma.$queryRaw`distance ASC,` : prisma.$queryRaw``}
        ts_rank(
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine, '') || ' ' || coalesce(city, '')),
          plainto_tsquery('english', ${tsQuery})
        ) DESC
      LIMIT 8
    `,
    prisma.$queryRaw`
      SELECT mi.id, mi.name, mi.category, mi.price::float8 AS price,
             mi.image_url AS "imageUrl",
             r.id AS "restaurantId", r.name AS "restaurantName",
             r.city, r.latitude, r.longitude,
             ${distanceExpr} AS distance
      FROM "MenuItem" mi
      JOIN "Restaurant" r ON r.id = mi.restaurant_id
      WHERE mi.status = 'ACTIVE' AND r.status = 'ACTIVE' AND r.is_open = true
        AND to_tsvector('english', coalesce(mi.name, '') || ' ' || coalesce(mi.category, ''))
            @@ plainto_tsquery('english', ${tsQuery})
        ${hasCoords ? prisma.$queryRaw`AND (${distanceExpr}) <= ${radiusKm}` : prisma.$queryRaw``}
      ORDER BY ${hasCoords ? prisma.$queryRaw`distance ASC,` : prisma.$queryRaw``}
        ts_rank(
          to_tsvector('english', coalesce(mi.name, '') || ' ' || coalesce(mi.category, '')),
          plainto_tsquery('english', ${tsQuery})
        ) DESC
      LIMIT 8
    `,
  ]);

  const restaurantsOut = (restaurants || []).map((r) => ({
    id: r.id, name: r.name, cuisine: r.cuisine, city: r.city,
    imageUrl: r.imageUrl, location: [r.addressLine1, r.city].filter(Boolean).join(", "),
    distance: r.distance ? Number(Number(r.distance).toFixed(2)) : null, matchingDishes: [],
  }));

  const dishesOut = (dishes || []).map((d) => ({
    id: d.id, name: d.name, category: d.category,
    price: Number(d.price), imageUrl: d.imageUrl,
    restaurantId: d.restaurantId, restaurantName: d.restaurantName,
    distance: d.distance ? Number(Number(d.distance).toFixed(2)) : null,
  }));

  const response = apiResponse({
    message: "Search results",
    data: { restaurants: restaurantsOut, dishes: dishesOut },
  });

  const searchTtl = query.length >= 3 ? SEARCH_CACHE_TTL_SECONDS : 15;
  if (shouldCache) {
    await setCache(cacheKey, response, searchTtl);
  }
  return res.status(200).json(response);
};

// ================= CREATE =================
const createRestaurant = async (req, res) => {
  const payload = createRestaurantSchema.parse(req.body);

  if (req.user.role === "VENDOR") {
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { vendorId: req.user.sub },
    });

    if (existingRestaurant) {
      throw new ApiError(409, "You already have a restaurant profile. Update it instead.");
    }
  }

  const { addressLine1, addressLine2, city, state, postalCode } = payload;

  const fullAddress = `${addressLine1}, ${city}, ${state}, ${postalCode || ""}, India`;

  const { lat, lng } = await getLatLngFromAddress(fullAddress);

  const restaurant = await prisma.restaurant.create({
    data: {
      vendorId: req.user.sub,
      name: payload.name,
      slug: payload.slug || slugify(payload.name),
      description: payload.description || null,
      cuisine: payload.cuisine || null,
      phone: payload.phone || null,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      postalCode,
      latitude: lat || null,
      longitude: lng || null,
      imageUrl: payload.imageUrl || null,
      status: payload.status || "DRAFT",
      isOpen: Boolean(payload.isOpen),
      openingTime: payload.openingTime || null,
      closingTime: payload.closingTime || null,
      openDays: payload.openDays || [],
      bankDetails: payload.bankDetails || null,
    },
  });
  await invalidatePublicRestaurantCache(restaurant.id);

  res.status(201).json(
    apiResponse({
      message: "Restaurant created successfully",
      data: serializeRestaurant(restaurant),
    })
  );
};

// ================= UPDATE =================
const updateRestaurant = async (req, res) => {
  const payload = updateRestaurantSchema.parse(req.body);

  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.restaurantId },
  });

  if (!existingRestaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (req.user.role === "VENDOR" && existingRestaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to update this restaurant");
  }

  const newAddressLine1 = payload.addressLine1 ?? existingRestaurant.addressLine1;
  const newAddressLine2 = payload.addressLine2 ?? existingRestaurant.addressLine2;
  const newCity = payload.city ?? existingRestaurant.city;
  const newState = payload.state ?? existingRestaurant.state;
  const newPostalCode = payload.postalCode ?? existingRestaurant.postalCode;

  const addressChanged =
    newAddressLine1 !== existingRestaurant.addressLine1 ||
    newAddressLine2 !== existingRestaurant.addressLine2 ||
    newCity !== existingRestaurant.city ||
    newState !== existingRestaurant.state ||
    newPostalCode !== existingRestaurant.postalCode;

  let lat = existingRestaurant.latitude;
  let lng = existingRestaurant.longitude;

  // If vendor explicitly passed GPS coords (from "Use GPS" button), use those
  if (typeof payload.latitude === "number" && typeof payload.longitude === "number") {
    lat = payload.latitude;
    lng = payload.longitude;
  } else if (addressChanged) {
    const fullAddress = `${newAddressLine1}, ${newCity}, ${newState}, ${newPostalCode || ""}, India`;
    const coords = await getLatLngFromAddress(fullAddress);
    lat = coords.lat;
    lng = coords.lng;
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: { id: req.params.restaurantId },
    data: {
      name: payload.name ?? existingRestaurant.name,
      slug: payload.slug ?? existingRestaurant.slug,
      description: payload.description ?? existingRestaurant.description,
      cuisine: payload.cuisine ?? existingRestaurant.cuisine,
      phone: payload.phone ?? existingRestaurant.phone,
      addressLine1: newAddressLine1,
      addressLine2: newAddressLine2,
      city: newCity,
      state: newState,
      postalCode: newPostalCode,
      latitude: lat || null,
      longitude: lng || null,
      imageUrl: payload.imageUrl ?? existingRestaurant.imageUrl,
      status: payload.status ?? existingRestaurant.status,
      isOpen:
        typeof payload.isOpen === "boolean"
          ? payload.isOpen
          : existingRestaurant.isOpen,
      openingTime: payload.openingTime ?? existingRestaurant.openingTime,
      closingTime: payload.closingTime ?? existingRestaurant.closingTime,
      openDays: payload.openDays ?? existingRestaurant.openDays,
      bankDetails: payload.bankDetails !== undefined ? payload.bankDetails : existingRestaurant.bankDetails,
    },
  });
  await invalidatePublicRestaurantCache(updatedRestaurant.id);

  res.status(200).json(
    apiResponse({
      message: "Restaurant updated successfully",
      data: serializeRestaurant(updatedRestaurant),
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
  searchRestaurantsAndDishes,
};

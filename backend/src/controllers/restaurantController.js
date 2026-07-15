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
  deliveryTime: restaurant.deliveryTime,
  minimumOrder: restaurant.minimumOrder ? Number(restaurant.minimumOrder) : null,
  averageRating: Number(restaurant.reviewCount || 0) > 0 ? Number(Number(restaurant.averageRating || 0).toFixed(1)) : null,
  reviewCount: restaurant.reviewCount ?? 0,
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

const enrichRestaurantsWithRatings = async (restaurants) => restaurants.map((restaurant) => ({
  ...restaurant,
  averageRating: Number(restaurant.reviewCount || 0) > 0 ? Number(Number(restaurant.averageRating || 0).toFixed(1)) : null,
  reviewCount: restaurant.reviewCount ?? 0,
}));

// ================= LIST =================
const listRestaurants = async (req, res) => {
  const { page, limit, skip } = parseRestaurantPagination(req.query);
  const search = req.query.search?.trim();
  const city = req.query.city?.trim();
  const dish = req.query.dish?.trim();
  const cuisine = req.query.cuisine?.trim();
  const isVeg = req.query.isVeg;
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
  const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
  const sort = req.query.sort?.trim();

  const cacheKey = buildCacheKey("restaurants:list", {
    city,
    cuisine,
    dish,
    isVeg,
    limit,
    maxPrice,
    minPrice,
    minRating,
    page,
    search,
    sort,
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

  const andConditions = [{ status: "ACTIVE" }];

  if (city) {
    andConditions.push({ city: { contains: city, mode: "insensitive" } });
  }

  if (search || dish) {
    const orConditions = [];
    if (search) {
      orConditions.push(
        { name: { contains: search, mode: "insensitive" } },
        { cuisine: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      );
    }
    if (dish) {
      orConditions.push(
        { cuisine: { contains: dish, mode: "insensitive" } },
        { menuItems: { some: { status: "ACTIVE", ...menuItemMatch } } },
      );
    }
    andConditions.push({ OR: orConditions });
  }

  if (cuisine) {
    const cuisineList = cuisine.split(",").map((c) => c.trim());
    andConditions.push({ cuisine: { in: cuisineList } });
  }

  if (isVeg === "true") {
    andConditions.push({
      AND: [
        { menuItems: { some: { isVeg: true, status: "ACTIVE" } } },
        { menuItems: { none: { isVeg: false, status: "ACTIVE" } } },
      ],
    });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter = { status: "ACTIVE" };
    if (minPrice !== undefined) priceFilter.price = { gte: minPrice };
    if (maxPrice !== undefined) priceFilter.price = { ...priceFilter.price, lte: maxPrice };
    andConditions.push({ menuItems: { some: priceFilter } });
  }

  if (minRating) {
    andConditions.push({ reviewCount: { gt: 0 }, averageRating: { gte: minRating } });
  }

  const where = { AND: andConditions };

  const orderBy =
    sort === "deliveryTime"
      ? { deliveryTime: { sort: "asc", nulls: "last" } }
      : sort === "minOrder"
        ? { minimumOrder: { sort: "asc", nulls: "last" } }
        : sort === "rating"
          ? [{ averageRating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }]
          : { createdAt: "desc" };

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
        deliveryTime: true,
        minimumOrder: true,
        averageRating: true,
        reviewCount: true,
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
      orderBy: orderBy ?? undefined,
      skip,
      take: limit,
    }),
    prisma.restaurant.count({ where }),
  ]);


  const enriched = await enrichRestaurantsWithRatings(restaurants);

  const response = apiResponse({
    message: "Restaurants fetched successfully",
    data: enriched.map(serializeRestaurant),
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
      deliveryTime: true,
      minimumOrder: true,
      averageRating: true,
      reviewCount: true,
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

  const enriched = (await enrichRestaurantsWithRatings([restaurant]))[0];

  const response = apiResponse({
    message: "Restaurant fetched successfully",
    data: {
      ...serializeRestaurant(enriched),
      menuItems: enriched.menuItems.map((item) => ({
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
  const restaurants = await prisma.restaurant.findMany({
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

  const enriched = await enrichRestaurantsWithRatings(restaurants);

  res.status(200).json(
    apiResponse({
      message: "Vendor restaurants fetched successfully",
      data: enriched.map((r) => ({
        ...serializeRestaurant(r),
        menuItems: r.menuItems.map((item) => ({
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
      })),
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
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos(userLat * Math.PI / 180), 0.1));
  const minLat = userLat - latDelta;
  const maxLat = userLat + latDelta;
  const minLng = userLng - lngDelta;
  const maxLng = userLng + lngDelta;

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
    WHERE "status" = 'ACTIVE'::"RestaurantStatus"
      AND "isOpen" = true
      AND "latitude" IS NOT NULL
      AND "longitude" IS NOT NULL
      AND "latitude" BETWEEN ${minLat} AND ${maxLat}
      AND "longitude" BETWEEN ${minLng} AND ${maxLng}
      AND (
        6371 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(${userLat})) * cos(radians("latitude")) *
            cos(radians("longitude") - radians(${userLng})) +
            sin(radians(${userLat})) * sin(radians("latitude"))
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
      deliveryTime: true,
      minimumOrder: true,
      averageRating: true,
      reviewCount: true,
      createdAt: true,
      updatedAt: true,
      menuItems: {
        where: { status: "ACTIVE" },
        take: 4,
        select: { id: true, name: true, price: true, imageUrl: true },
      },
    },
  });

  const enriched = await enrichRestaurantsWithRatings(restaurants);

  const nearby = enriched.reduce((acc, r) => {
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
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((value) => value === null || value === undefined || Number.isNaN(Number(value)))) {
    return null;
  }

  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const radiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return Number((radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

const sortByDistanceThenName = (items) => items.sort((a, b) => {
  const aDistance = a.distance ?? Number.POSITIVE_INFINITY;
  const bDistance = b.distance ?? Number.POSITIVE_INFINITY;
  if (aDistance !== bDistance) return aDistance - bDistance;
  return String(a.name || "").localeCompare(String(b.name || ""));
});

const searchRestaurantsAndDishes = async (req, res) => {
  const query = req.query.q?.trim();
  const lat = Number.parseFloat(req.query.lat);
  const lng = Number.parseFloat(req.query.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  if (!query || query.length < 2) {
    return res.status(200).json(
      apiResponse({ message: "Search results", data: { restaurants: [], dishes: [] } })
    );
  }

  const normalizedQuery = query.toLowerCase();
  const shouldCache = query.length >= 3;
  const cacheKey = buildCacheKey("search", {
    q: normalizedQuery,
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
  });

  if (shouldCache) {
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);
  }

  const [restaurantRows, dishRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        id,
        name,
        cuisine,
        city,
        "addressLine1",
        "imageUrl",
        latitude,
        longitude,
        ts_rank(
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine, '') || ' ' || coalesce(city, '')),
          plainto_tsquery('english', ${query})
        ) + GREATEST(similarity(coalesce(name, ''), ${query}), similarity(coalesce(cuisine, ''), ${query})) AS rank
      FROM "Restaurant"
      WHERE "status" = 'ACTIVE'::"RestaurantStatus"
        AND "isOpen" = true
        AND (
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine, '') || ' ' || coalesce(city, '')) @@ plainto_tsquery('english', ${query})
          OR name % ${query}
          OR cuisine % ${query}
          OR city % ${query}
          OR "addressLine1" % ${query}
        )
      ORDER BY rank DESC, "createdAt" DESC
      LIMIT 25
    `,
    prisma.$queryRaw`
      SELECT
        mi.id,
        mi.name,
        mi.category,
        mi.price,
        mi."imageUrl",
        r.id AS "restaurantId",
        r.name AS "restaurantName",
        r.cuisine AS "restaurantCuisine",
        r.city AS "restaurantCity",
        r."addressLine1" AS "restaurantAddressLine1",
        r."imageUrl" AS "restaurantImageUrl",
        r.latitude AS "restaurantLatitude",
        r.longitude AS "restaurantLongitude",
        ts_rank(
          to_tsvector('english', coalesce(mi.name, '') || ' ' || coalesce(mi.category, '') || ' ' || coalesce(mi.description, '')),
          plainto_tsquery('english', ${query})
        ) + GREATEST(similarity(coalesce(mi.name, ''), ${query}), similarity(coalesce(mi.category, ''), ${query})) AS rank
      FROM "MenuItem" mi
      JOIN "Restaurant" r ON r.id = mi."restaurantId"
      WHERE mi.status = 'ACTIVE'::"MenuItemStatus"
        AND r.status = 'ACTIVE'::"RestaurantStatus"
        AND r."isOpen" = true
        AND (
          to_tsvector('english', coalesce(mi.name, '') || ' ' || coalesce(mi.category, '') || ' ' || coalesce(mi.description, '')) @@ plainto_tsquery('english', ${query})
          OR mi.name % ${query}
          OR mi.category % ${query}
          OR mi.description % ${query}
        )
      ORDER BY rank DESC, mi."createdAt" DESC
      LIMIT 25
    `,
  ]);

  const restaurants = restaurantRows.map((row) => ({
    id: row.id,
    name: row.name,
    cuisine: row.cuisine,
    city: row.city,
    addressLine1: row.addressLine1,
    imageUrl: row.imageUrl,
    latitude: row.latitude,
    longitude: row.longitude,
  }));

  const dishes = dishRows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    imageUrl: row.imageUrl,
    restaurant: {
      id: row.restaurantId,
      name: row.restaurantName,
      cuisine: row.restaurantCuisine,
      city: row.restaurantCity,
      addressLine1: row.restaurantAddressLine1,
      imageUrl: row.restaurantImageUrl,
      latitude: row.restaurantLatitude,
      longitude: row.restaurantLongitude,
    },
  }));
  const restaurantMap = new Map();

  const addRestaurant = (restaurant, matchingDish = null) => {
    if (!restaurant?.id) return;
    const distance = hasCoords
      ? getDistanceKm(lat, lng, restaurant.latitude, restaurant.longitude)
      : null;
    const existing = restaurantMap.get(restaurant.id);
    const matchingDishes = existing?.matchingDishes || [];

    if (matchingDish && !matchingDishes.some((dish) => dish.id === matchingDish.id)) {
      matchingDishes.push(matchingDish);
    }

    restaurantMap.set(restaurant.id, {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      city: restaurant.city,
      imageUrl: restaurant.imageUrl,
      location: [restaurant.addressLine1, restaurant.city].filter(Boolean).join(", "),
      distance,
      matchingDishes,
    });
  };

  restaurants.forEach((restaurant) => addRestaurant(restaurant));

  const dishesOut = dishes.map((dish) => {
    const distance = hasCoords
      ? getDistanceKm(lat, lng, dish.restaurant?.latitude, dish.restaurant?.longitude)
      : null;
    const dishOut = {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      price: Number(dish.price),
      imageUrl: dish.imageUrl,
      restaurantId: dish.restaurant?.id,
      restaurantName: dish.restaurant?.name,
      distance,
    };

    addRestaurant(dish.restaurant, {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      price: Number(dish.price),
      imageUrl: dish.imageUrl,
    });

    return dishOut;
  });

  const response = apiResponse({
    message: "Search results",
    data: {
      restaurants: sortByDistanceThenName(Array.from(restaurantMap.values())).slice(0, 8),
      dishes: sortByDistanceThenName(dishesOut).slice(0, 8),
    },
  });

  if (shouldCache) {
    await setCache(cacheKey, response, SEARCH_CACHE_TTL_SECONDS);
  }

  return res.status(200).json(response);
};

// ================= CREATE =================
const createRestaurant = async (req, res) => {
  const payload = createRestaurantSchema.parse(req.body);

  // Multi-outlet support: vendors can have multiple restaurants

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

const deleteRestaurant = async (req, res) => {
  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.restaurantId },
  });

  if (!existingRestaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (req.user.role === "VENDOR" && existingRestaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to delete this restaurant");
  }

  await prisma.restaurant.update({
    where: { id: req.params.restaurantId },
    data: { status: "INACTIVE" },
  });
  await invalidatePublicRestaurantCache(existingRestaurant.id);

  res.status(200).json(
    apiResponse({
      message: "Restaurant deactivated successfully",
      data: { restaurantId: req.params.restaurantId },
    })
  );
};

export {
  createRestaurant,
  deleteRestaurant,
  updateRestaurant,
  getRestaurantById,
  getMyRestaurant,
  listRestaurants,
  getNearbyRestaurants,
  searchRestaurantsAndDishes,
};

import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { invalidatePublicRestaurantCache } from "../utils/publicCache.js";
import { sanitizeUser } from "../utils/userResponse.js";
import { parsePagination, buildUniqueRestaurantSlug } from "../utils/adminHelpers.js";

const adminMenuItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  category: z.string().trim().min(2).max(80),
  imageUrl: z.string().trim().url().optional().nullable(),
  price: z.coerce.number().positive().max(100000),
  isVeg: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const adminCreateRestaurantSchema = z.object({
  owner: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(10).max(15),
    password: z.string().min(6).max(100),
  }),
  restaurant: z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional().nullable(),
    cuisine: z.string().trim().max(80).optional().nullable(),
    phone: z.string().trim().min(10).max(15).optional().nullable(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    addressLine1: z.string().trim().min(3).max(200),
    addressLine2: z.string().trim().max(200).optional().nullable(),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().min(4).max(12).optional().nullable(),
    imageUrl: z.string().trim().url().optional().nullable(),
    status: z.enum(["DRAFT", "PENDING_APPROVAL", "ACTIVE", "INACTIVE", "REJECTED"]).optional(),
    isOpen: z.boolean().optional(),
    openingTime: z.string().trim().max(20).optional().nullable(),
    closingTime: z.string().trim().max(20).optional().nullable(),
    openDays: z.array(z.string().trim().min(1).max(20)).optional(),
    bankDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  }),
  menuItems: z.array(adminMenuItemSchema).max(100).optional(),
});

const listRestaurants = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = req.query.query?.trim();
  const status = req.query.status?.trim();

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { state: { contains: search, mode: "insensitive" } },
            { vendor: { is: { name: { contains: search, mode: "insensitive" } } } },
            { vendor: { is: { email: { contains: search, mode: "insensitive" } } } },
            { vendor: { is: { phone: { contains: search } } } },
          ],
        }
      : {}),
  };

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.restaurant.count({ where }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Restaurants fetched successfully",
      data: restaurants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }),
  );
};

const createRestaurantForVendor = async (req, res) => {
  const payload = adminCreateRestaurantSchema.parse(req.body);
  const email = payload.owner.email.toLowerCase();
  const ownerPhone = payload.owner.phone?.trim() || null;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(ownerPhone ? [{ phone: ownerPhone }] : [])],
    },
  });

  if (existingUser) {
    throw new ApiError(409, "A user already exists with this email or phone");
  }

  const passwordHash = await bcrypt.hash(payload.owner.password, 12);
  const slug = await buildUniqueRestaurantSlug(prisma, payload.restaurant.name);

  const result = await prisma.$transaction(async (tx) => {
    const vendor = await tx.user.create({
      data: {
        name: payload.owner.name.trim(),
        email,
        phone: ownerPhone,
        passwordHash,
        role: ROLES.VENDOR,
        status: "ACTIVE",
        onboardingSubmittedAt: new Date(),
        vendorOnboarding: {
          createdByAdminId: req.user.sub,
          createdByAdmin: true,
        },
      },
    });

    const restaurant = await tx.restaurant.create({
      data: {
        vendorId: vendor.id,
        name: payload.restaurant.name,
        slug,
        description: payload.restaurant.description || null,
        cuisine: payload.restaurant.cuisine || null,
        phone: payload.restaurant.phone || ownerPhone,
        addressLine1: payload.restaurant.addressLine1,
        addressLine2: payload.restaurant.addressLine2 || null,
        city: payload.restaurant.city,
        state: payload.restaurant.state,
        postalCode: payload.restaurant.postalCode || null,
        imageUrl: payload.restaurant.imageUrl || null,
        latitude: payload.restaurant.latitude ?? null,
        longitude: payload.restaurant.longitude ?? null,
        status: payload.restaurant.status || "ACTIVE",
        isOpen: payload.restaurant.isOpen ?? true,
        openingTime: payload.restaurant.openingTime || null,
        closingTime: payload.restaurant.closingTime || null,
        openDays: payload.restaurant.openDays || [],
        bankDetails: payload.restaurant.bankDetails || null,
      },
    });

    const createdMenuItems = payload.menuItems?.length
      ? await Promise.all(
          payload.menuItems.map((item) =>
            tx.menuItem.create({
              data: {
                restaurantId: restaurant.id,
                name: item.name,
                description: item.description || null,
                category: item.category,
                imageUrl: item.imageUrl || null,
                price: item.price,
                isVeg: Boolean(item.isVeg),
                status: item.status || "ACTIVE",
              },
            }),
          ),
        )
      : [];

    return {
      vendor,
      restaurant,
      menuItems: createdMenuItems,
    };
  });

  await invalidatePublicRestaurantCache(result.restaurant.id);

  res.status(201).json(
    apiResponse({
      message: "Restaurant account created successfully",
      data: {
        vendor: sanitizeUser(result.vendor),
        restaurant: {
          ...result.restaurant,
          menuItems: result.menuItems.map((item) => ({
            ...item,
            price: Number(item.price),
          })),
        },
      },
    }),
  );
};

const updateRestaurantStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["ACTIVE", "INACTIVE", "REJECTED", "PENDING_APPROVAL", "DRAFT"];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid restaurant status");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: req.params.restaurantId,
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: {
      id: req.params.restaurantId,
    },
    data: {
      status,
      isOpen: status === "ACTIVE" ? restaurant.isOpen : false,
    },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  res.status(200).json(
    apiResponse({
      message: `Restaurant marked as ${status.toLowerCase()} successfully`,
      data: updatedRestaurant,
    }),
  );
};

export {
  createRestaurantForVendor,
  listRestaurants,
  updateRestaurantStatus,
};

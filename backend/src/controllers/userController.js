import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";
import { sanitizeUser } from "../utils/userResponse.js";
import { updateProfileSchema } from "../validators/userValidators.js";
import { deleteCache } from "../utils/cache.js";

const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(
    apiResponse({
      message: "Profile fetched successfully",
      data: {
        user: sanitizeUser(user),
      },
    }),
  );
};

const updateProfile = async (req, res) => {
  const payload = updateProfileSchema.parse(req.body);
  const email = payload.email?.toLowerCase();
  const phone =
    payload.phone === null ? null : payload.phone?.trim() || undefined;

  const uniqueConditions = [
    ...(email ? [{ email }] : []),
    ...(phone ? [{ phone }] : []),
  ];

  if (uniqueConditions.length > 0) {
    const conflicts = await prisma.user.findFirst({
      where: {
        id: { not: req.user.sub },
        OR: uniqueConditions,
      },
    });

    if (conflicts) {
      throw new ApiError(409, "Email or phone is already being used by another account");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.sub },
    data: {
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(email ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
      ...(payload.bankDetails !== undefined ? { bankDetails: payload.bankDetails } : {}),
      ...(payload.vehicleDetails !== undefined ? { vehicleDetails: payload.vehicleDetails } : {}),
      ...(payload.paymentMethods !== undefined ? { paymentMethods: payload.paymentMethods } : {}),
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Profile updated successfully",
      data: {
        user: sanitizeUser(updatedUser),
      },
    }),
  );
};

const deleteAccount = async (req, res) => {
  if (req.body?.confirmation !== "DELETE") {
    throw new ApiError(400, "Type DELETE to confirm account deletion");
  }

  const activeStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];
  const activeOrders = await prisma.order.count({
    where: {
      status: { in: activeStatuses },
      OR: [
        { customerId: req.user.sub },
        { riderId: req.user.sub },
        { restaurant: { vendorId: req.user.sub } },
      ],
    },
  });
  if (activeOrders > 0) {
    throw new ApiError(409, "Complete or cancel active orders before deleting your account");
  }

  await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.fcmToken.deleteMany({ where: { userId: req.user.sub } }),
      tx.favorite.deleteMany({ where: { userId: req.user.sub } }),
      tx.review.deleteMany({ where: { userId: req.user.sub } }),
      tx.riderRating.deleteMany({ where: { OR: [{ userId: req.user.sub }, { riderId: req.user.sub }] } }),
      tx.chatMessage.updateMany({
        where: { senderId: req.user.sub },
        data: { text: "[deleted]", imageUrl: null, kind: "TEXT" },
      }),
      tx.address.updateMany({
        where: { userId: req.user.sub },
        data: {
          label: "Deleted address",
          fullName: "Deleted user",
          phone: "0000000000",
          line1: "Deleted",
          line2: null,
          city: "Deleted",
          state: "Deleted",
          postalCode: "000000",
          latitude: null,
          longitude: null,
          isDefault: false,
        },
      }),
      tx.restaurant.updateMany({
        where: { vendorId: req.user.sub },
        data: { isOpen: false, status: "INACTIVE", phone: null, bankDetails: null },
      }),
    ]);

    await tx.user.update({
      where: { id: req.user.sub },
      data: {
        name: "Deleted user",
        email: `deleted-${req.user.sub}@deleted.invalid`,
        phone: null,
        avatarUrl: null,
        status: "BLOCKED",
        isOnline: false,
        latitude: null,
        longitude: null,
        vendorOnboarding: null,
        riderOnboarding: null,
        bankDetails: null,
        vehicleDetails: null,
        paymentMethods: null,
      },
    });
  });

  await deleteCache(`auth:user:${req.user.sub}`);
  return res.status(200).json(apiResponse({ message: "Account and personal data deleted successfully" }));
};
const uploadImage = async (req, res) => {
  const dataUrl = req.body.dataUrl?.trim();
  const folder = req.body.folder?.trim();
  const maxDataUrlLength = 7 * 1024 * 1024;

  if (!dataUrl) {
    throw new ApiError(400, "Image data is required");
  }

  const allowedMimePrefixes = ["data:image/jpeg", "data:image/png", "data:image/webp", "data:image/avif"];
  if (!allowedMimePrefixes.some((prefix) => dataUrl.startsWith(prefix))) {
    throw new ApiError(400, "Only JPEG, PNG, WebP, and AVIF images are supported");
  }

  if (dataUrl.length > maxDataUrlLength) {
    throw new ApiError(413, "Image is too large. Please upload an image under 5MB.");
  }

  const uploadedAsset = await uploadImageToCloudinary({ dataUrl, folder });

  res.status(200).json(
    apiResponse({
      message: "Image uploaded successfully",
      data: uploadedAsset,
    }),
  );
};

export { deleteAccount, getProfile, updateProfile, uploadImage };


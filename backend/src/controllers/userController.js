import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";
import { sanitizeUser } from "../utils/userResponse.js";
import { updateProfileSchema } from "../validators/userValidators.js";

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
<<<<<<< HEAD
      ...(payload.bankDetails !== undefined ? { bankDetails: payload.bankDetails } : {}),
      ...(payload.vehicleDetails !== undefined ? { vehicleDetails: payload.vehicleDetails } : {}),
      ...(payload.paymentMethods !== undefined ? { paymentMethods: payload.paymentMethods } : {}),
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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

const uploadImage = async (req, res) => {
  const dataUrl = req.body.dataUrl?.trim();
  const folder = req.body.folder?.trim();
  const maxDataUrlLength = 7 * 1024 * 1024;

  if (!dataUrl) {
    throw new ApiError(400, "Image data is required");
  }

  if (!dataUrl.startsWith("data:image/")) {
    throw new ApiError(400, "Only image uploads are supported");
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

export { getProfile, updateProfile, uploadImage };

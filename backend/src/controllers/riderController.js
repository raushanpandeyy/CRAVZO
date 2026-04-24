import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

export const updateRiderStatus = async (req, res) => {
  if (typeof req.body.isOnline !== "boolean") {
    throw new ApiError(400, "isOnline must be true or false");
  }

  const rider = await prisma.user.update({
    where: { id: req.user.sub },
    data: { isOnline: req.body.isOnline },
  });

  res.status(200).json(
    apiResponse({
      message: `Rider is now ${rider.isOnline ? "online" : "offline"}`,
      data: {
        id: rider.id,
        isOnline: rider.isOnline,
      },
    }),
  );
};

export const updateRiderLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new ApiError(400, "latitude and longitude are required");
  }

  const rider = await prisma.user.update({
    where: { id: req.user.sub },
    data: { latitude, longitude },
  });

  res.status(200).json(
    apiResponse({
      message: "Rider location updated",
      data: {
        id: rider.id,
        latitude: rider.latitude,
        longitude: rider.longitude,
      },
    }),
  );
};

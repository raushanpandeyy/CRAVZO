import { prisma } from "../config/database.js";
import { connectRedis } from "../config/redis.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const RIDER_GEO_KEY = "rider:geo";

const updateRiderGeo = async (riderId, lat, lng) => {
  try {
    const client = await connectRedis();
    if (client?.isOpen) {
      await client.geoAdd(RIDER_GEO_KEY, { longitude: lng, latitude: lat, member: riderId });
    }
  } catch {
    // non-critical
  }
};

export const updateRiderStatus = async (req, res) => {
  if (typeof req.body.isOnline !== "boolean") {
    throw new ApiError(400, "isOnline must be true or false");
  }

  const isOnline = req.body.isOnline;

  const [rider] = await Promise.all([
    prisma.user.update({
      where: { id: req.user.sub },
      data: { isOnline },
    }),
    isOnline
      ? Promise.resolve()
      : (async () => {
          try {
            const client = await connectRedis();
            if (client?.isOpen) {
              await client.zRem(RIDER_GEO_KEY, req.user.sub);
            }
          } catch {}
        })(),
  ]);

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

  const [rider] = await Promise.all([
    prisma.user.update({
      where: { id: req.user.sub },
      data: { latitude, longitude },
    }),
    updateRiderGeo(req.user.sub, latitude, longitude),
  ]);

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

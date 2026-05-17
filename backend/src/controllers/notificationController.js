import { z } from "zod";

import { apiResponse } from "../utils/apiResponse.js";
import { removeFcmToken, upsertFcmToken } from "../services/notificationService.js";

const fcmTokenSchema = z.object({
  token: z.string().min(20),
  deviceId: z.string().max(120).optional().nullable(),
  platform: z.string().max(30).default("WEB"),
});

const saveFcmToken = async (req, res) => {
  const payload = fcmTokenSchema.parse(req.body);

  const token = await upsertFcmToken({
    userId: req.user.sub,
    token: payload.token,
    deviceId: payload.deviceId || null,
    platform: payload.platform || "WEB",
    userAgent: req.get("user-agent") || null,
  });

  res.status(200).json(
    apiResponse({
      message: "Notification token saved",
      data: {
        id: token.id,
        platform: token.platform,
        isActive: token.isActive,
      },
    }),
  );
};

const updateFcmToken = saveFcmToken;

const removeSavedFcmToken = async (req, res) => {
  const payload = fcmTokenSchema.pick({ token: true }).parse(req.body);
  await removeFcmToken({
    userId: req.user.sub,
    token: payload.token,
  });

  res.status(200).json(
    apiResponse({
      message: "Notification token removed",
    }),
  );
};

export { removeSavedFcmToken, saveFcmToken, updateFcmToken };

import crypto from "crypto";

import { env } from "../config/env.js";

const hasCloudinaryConfig = () =>
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

const buildSignature = (params) => {
  const serializedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${serializedParams}${env.CLOUDINARY_API_SECRET}`).digest("hex");
};

const uploadImageToCloudinary = async ({ dataUrl, folder }) => {
  if (!hasCloudinaryConfig()) {
    throw new Error("Cloudinary environment variables are missing");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const finalFolder = folder || env.CLOUDINARY_FOLDER;
  const signature = buildSignature({
    folder: finalFolder,
    timestamp,
  });

  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("api_key", env.CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("folder", finalFolder);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || "Cloudinary upload failed");
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    width: payload.width,
    height: payload.height,
    format: payload.format,
  };
};

export { hasCloudinaryConfig, uploadImageToCloudinary };

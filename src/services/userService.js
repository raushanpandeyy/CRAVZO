import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { persistSession } from "./authService";
import { apiRequest } from "./api";

const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const TARGET_OUTPUT_BYTES = 850 * 1024;
const MIN_IMAGE_QUALITY = 0.55;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const getProfile = async () => {
  const response = await apiRequest(API_ENDPOINTS.user.profile);
  return response.data?.user || null;
};

const updateProfile = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.user.profile, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const user = response.data?.user || null;

  if (user) {
    persistSession({ user });
  }

  return user;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result?.toString() || "");
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to process image"));
    image.src = src;
  });

const canvasToBlob = (canvas, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress image"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result?.toString() || "");
    reader.onerror = () => reject(new Error("Failed to prepare compressed image"));
    reader.readAsDataURL(blob);
  });

const compressImage = async (file) => {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WEBP image");
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    throw new Error("Image must be under 5MB");
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const largestSide = Math.max(image.width, image.height);
  const scale = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image compression is not supported in this browser");
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = 0.86;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > TARGET_OUTPUT_BYTES && quality > MIN_IMAGE_QUALITY) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  return blobToDataUrl(blob);
};

const uploadImage = async (file, folder = "cravzo") => {
  const dataUrl = await compressImage(file);
  const response = await apiRequest(API_ENDPOINTS.user.uploadImage, {
    method: "POST",
    body: JSON.stringify({
      dataUrl,
      folder,
    }),
  });

  return response.data;
};

export { getProfile, updateProfile, uploadImage };

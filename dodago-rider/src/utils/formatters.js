import { Linking, Platform } from "react-native";

const addressText = (parts = []) => parts.filter(Boolean).join(", ");

export const formatCurrency = (amount) => `Rs ${Math.floor(Number(amount || 0))}`;

export const formatDistance = (distance) => {
  const value = Number(distance || 0);
  if (!Number.isFinite(value) || value <= 0) return "N/A";
  return `${value.toFixed(value < 10 ? 1 : 0)} km`;
};

export const formatRestaurantAddress = (restaurant) =>
  addressText([restaurant?.addressLine1, restaurant?.addressLine2, restaurant?.city, restaurant?.state, restaurant?.postalCode, "India"]) ||
  "Restaurant address pending";

export const formatCustomerAddress = (address) =>
  addressText([address?.line1, address?.line2, address?.city, address?.state, address?.postalCode, "India"]) ||
  "Customer address pending";

export const openNavigation = async (target, fallbackAddress = "") => {
  const lat = target?.lat ?? target?.latitude;
  const lng = target?.lng ?? target?.longitude;
  const destination = lat && lng ? `${lat},${lng}` : fallbackAddress;
  if (!destination) return false;
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${encodeURIComponent(destination)}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
  });
  await Linking.openURL(url);
  return true;
};

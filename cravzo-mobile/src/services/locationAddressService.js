import * as Location from "expo-location";

const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

export const parseLocationAddress = (data = {}) => {
  const addr = data.address || {};
  const roadParts = [addr.house_number, addr.road, addr.suburb].filter(Boolean);
  return {
    displayName: data.display_name || "",
    line1: roadParts.length > 0 ? roadParts.join(", ") : (data.display_name || "").split(",")[0]?.trim() || "",
    line2: addr.neighbourhood || addr.village || addr.town || addr.city_district || "",
    city: addr.city || addr.town || addr.village || addr.county || addr.state_district || "",
    state: addr.state || "",
    postalCode: addr.postcode || "",
  };
};

export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  const res = await fetch(
    `${NOMINATIM_REVERSE}?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
    { headers: { "User-Agent": "DodagoMobile/1.0" } }
  );
  const data = await res.json();
  if (!data?.display_name) {
    return {
      displayName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
    };
  }
  return parseLocationAddress(data);
};

export const getCurrentAddress = async () => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Location permission denied. You can pick the address on map or type it manually.");
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = position.coords;
  const address = await reverseGeocodeCoordinates(latitude, longitude);

  return {
    ...address,
    latitude,
    longitude,
  };
};

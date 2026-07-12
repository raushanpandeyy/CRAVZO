import { env } from "../config/env.js";

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

const hasGoogleMapsKey = () => Boolean(env.GOOGLE_MAPS_API_KEY);

export const getGoogleLatLngFromAddress = async (address) => {
  if (!hasGoogleMapsKey()) return { lat: null, lng: null };

  const url = new URL(GOOGLE_GEOCODE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("region", "in");
  url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await response.json().catch(() => null);
    const location = data?.results?.[0]?.geometry?.location;
    if (!response.ok || data?.status !== "OK" || !location) {
      return { lat: null, lng: null };
    }
    return { lat: Number(location.lat), lng: Number(location.lng) };
  } catch {
    return { lat: null, lng: null };
  }
};

export const getGoogleRouteSummary = async ({ origin, destination }) => {
  if (!hasGoogleMapsKey()) return null;
  if (![origin?.lat, origin?.lng, destination?.lat, destination?.lng].every(Number.isFinite)) return null;

  try {
    const response = await fetch(GOOGLE_ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: "TWO_WHEELER",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        languageCode: "en-IN",
        units: "METRIC",
      }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json().catch(() => null);
    const route = data?.routes?.[0];
    const distanceMeters = route?.distanceMeters;
    if (!response.ok || !Number.isFinite(distanceMeters)) return null;

    const durationSeconds = Number.parseInt(String(route.duration || "").replace("s", ""), 10);
    return {
      distanceKm: Number((distanceMeters / 1000).toFixed(2)),
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
      encodedPolyline: route.polyline?.encodedPolyline || null,
    };
  } catch {
    return null;
  }
};

export const getGoogleRouteDistanceKm = async ({ origin, destination }) => {
  const route = await getGoogleRouteSummary({ origin, destination });
  return route?.distanceKm ?? null;
};

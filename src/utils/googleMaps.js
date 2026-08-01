const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js";
const GOOGLE_MAPS_LIBRARIES = "places,geocoding";

let googleMapsPromise = null;

const getGoogleMapsKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const ensureGoogleMapsLibraries = async () => {
  const google = window.google;
  if (!google?.maps) {
    throw new Error("Google Maps failed to initialize");
  }

  if (typeof google.maps.importLibrary === "function") {
    await Promise.all([
      google.maps.importLibrary("maps"),
      google.maps.importLibrary("places"),
      google.maps.importLibrary("geocoding"),
    ]);
  }

  if (!google.maps.Map || !google.maps.places?.Autocomplete || !google.maps.Geocoder) {
    throw new Error("Google Maps libraries are not available yet");
  }

  return google;
};

export const loadGoogleMaps = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is only available in the browser"));
  }

  if (window.google?.maps?.Map && window.google?.maps?.places?.Autocomplete && window.google?.maps?.Geocoder) {
    return ensureGoogleMapsLibraries();
  }

  const apiKey = getGoogleMapsKey();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps key is missing"));
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existing) {
      const finish = () => ensureGoogleMapsLibraries().then(resolve).catch(reject);
      if (window.google?.maps) {
        finish();
        return;
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=${GOOGLE_MAPS_LIBRARIES}&loading=async`;
    script.onload = () => ensureGoogleMapsLibraries().then(resolve).catch(reject);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  googleMapsPromise.catch(() => {
    googleMapsPromise = null;
  });

  return googleMapsPromise;
};

export const isGoogleMapsConfigured = () => Boolean(getGoogleMapsKey());

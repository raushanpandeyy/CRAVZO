const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js";
const GOOGLE_MAPS_LIBRARIES = "places";

let googleMapsPromise = null;

const getGoogleMapsKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const loadGoogleMaps = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is only available in the browser"));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  const apiKey = getGoogleMapsKey();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps key is missing"));
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=${GOOGLE_MAPS_LIBRARIES}`;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const isGoogleMapsConfigured = () => Boolean(getGoogleMapsKey());

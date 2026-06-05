/**
 * useUserLocation — fetches GPS once, persists in sessionStorage.
 *
 * Problem it solves:
 *   Home, SearchBar, and RestaurantListingPage all independently request
 *   GPS and make separate API calls. This hook is called once at app level
 *   and the result is shared via a simple module-level singleton so every
 *   consumer reads from cache, not GPS again.
 *
 * Returns: { lat, lng, ready }
 *   ready=false → still resolving
 *   lat/lng=null → denied or unavailable
 */

import { useEffect, useState } from "react";

// Module-level singleton — shared across all hook instances
let _cached = null;
let _listeners = [];
let _fetching = false;

const SESSION_KEY = "cravzo_user_location";

const notifyListeners = (loc) => {
  _cached = loc;
  _listeners.forEach((fn) => fn(loc));
};

const fetchLocation = () => {
  if (_fetching) return;
  _fetching = true;

  // Check sessionStorage first (survives re-renders, not page reloads)
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.lat && parsed?.lng) {
        notifyListeners(parsed);
        _fetching = false;
        return;
      }
    }
  } catch {}

  if (!navigator.geolocation) {
    notifyListeners({ lat: null, lng: null });
    _fetching = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(loc)); } catch {}
      notifyListeners(loc);
      _fetching = false;
    },
    () => {
      notifyListeners({ lat: null, lng: null });
      _fetching = false;
    },
    { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 },
  );
};

export const useUserLocation = () => {
  const [location, setLocation] = useState(_cached || { lat: null, lng: null });
  const [ready, setReady] = useState(_cached !== null);

  useEffect(() => {
    if (_cached !== null) {
      setLocation(_cached);
      setReady(true);
      return;
    }

    const listener = (loc) => {
      setLocation(loc);
      setReady(true);
    };

    _listeners.push(listener);
    fetchLocation();

    return () => {
      _listeners = _listeners.filter((fn) => fn !== listener);
    };
  }, []);

  return { ...location, ready };
};

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

import { isGoogleMapsConfigured, loadGoogleMaps } from "../utils/googleMaps.js";

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const getComponent = (components, type) =>
  components.find((component) => component.types.includes(type))?.long_name || "";

const parsePlace = (place) => {
  const components = place.address_components || [];
  const streetNumber = getComponent(components, "street_number");
  const route = getComponent(components, "route");
  const locality = getComponent(components, "locality") || getComponent(components, "postal_town");
  const city = locality || getComponent(components, "administrative_area_level_3") || getComponent(components, "administrative_area_level_2");
  const state = getComponent(components, "administrative_area_level_1");
  const postalCode = getComponent(components, "postal_code");
  const sublocality = getComponent(components, "sublocality_level_1") || getComponent(components, "sublocality");
  const lat = place.geometry?.location?.lat();
  const lng = place.geometry?.location?.lng();

  return {
    line1: [streetNumber, route].filter(Boolean).join(" ") || place.name || "",
    line2: sublocality,
    city,
    state,
    postalCode,
    latitude: typeof lat === "number" ? lat : null,
    longitude: typeof lng === "number" ? lng : null,
  };
};

const normalizePosition = (value) => {
  const lat = Number(value?.latitude ?? value?.lat);
  const lng = Number(value?.longitude ?? value?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return DEFAULT_CENTER;
};

const GoogleAddressPicker = ({ value, onChange, className = "" }) => {
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const [status, setStatus] = useState(isGoogleMapsConfigured() ? "Loading map..." : "Add VITE_GOOGLE_MAPS_API_KEY to enable Google address picker.");

  const currentPosition = useMemo(() => normalizePosition(value), [value]);

  useEffect(() => {
    if (!isGoogleMapsConfigured()) return undefined;

    let autocomplete;
    let map;
    let marker;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current || !mapRef.current) return;

        geocoderRef.current = new google.maps.Geocoder();
        map = new google.maps.Map(mapRef.current, {
          center: currentPosition,
          zoom: currentPosition === DEFAULT_CENTER ? 12 : 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        marker = new google.maps.Marker({
          map,
          position: currentPosition,
          draggable: true,
        });
        markerRef.current = marker;

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["address_components", "geometry", "name", "formatted_address"],
          types: ["geocode", "establishment"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;
          const next = parsePlace(place);
          const position = { lat: next.latitude, lng: next.longitude };
          map.setCenter(position);
          map.setZoom(18);
          marker.setPosition(position);
          onChange(next);
          setStatus("Location selected from Google Maps.");
        });

        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          const lat = position.lat();
          const lng = position.lng();
          reverseGeocode(lat, lng);
        });

        map.addListener("click", (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          marker.setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        });

        setStatus("Search an address or move the pin.");
      })
      .catch((error) => setStatus(error.message));

    return () => {
      cancelled = true;
      if (autocomplete) window.google?.maps?.event?.clearInstanceListeners(autocomplete);
      if (marker) window.google?.maps?.event?.clearInstanceListeners(marker);
      if (map) window.google?.maps?.event?.clearInstanceListeners(map);
    };
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.setPosition(currentPosition);
  }, [currentPosition.lat, currentPosition.lng]);

  const reverseGeocode = (lat, lng) => {
    const geocoder = geocoderRef.current;
    if (!geocoder) {
      onChange({ latitude: lat, longitude: lng });
      return;
    }

    geocoder.geocode({ location: { lat, lng } }, (results, geocodeStatus) => {
      if (geocodeStatus === "OK" && results?.[0]) {
        onChange({ ...parsePlace(results[0]), latitude: lat, longitude: lng });
        setStatus("Pin location resolved from Google Maps.");
        return;
      }
      onChange({ latitude: lat, longitude: lng });
      setStatus("Pin moved. Address text can be edited below.");
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        markerRef.current?.setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      },
      () => setStatus("Location permission denied."),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search address on Google Maps"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition active:scale-95 hover:bg-indigo-700"
        >
          <LocateFixed className="h-4 w-4" />
          Current
        </button>
      </div>
      <div ref={mapRef} className="mt-3 h-64 overflow-hidden rounded-xl bg-slate-200" />
      <p className="mt-2 text-xs font-medium text-slate-500">{status}</p>
    </div>
  );
};

export default GoogleAddressPicker;


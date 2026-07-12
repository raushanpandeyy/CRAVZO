import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bike, MapPin, Store } from "lucide-react";

import { isGoogleMapsConfigured, loadGoogleMaps } from "../utils/googleMaps.js";

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const asLatLng = (point) => {
  const lat = Number(point?.latitude ?? point?.lat);
  const lng = Number(point?.longitude ?? point?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const decodePolyline = (encoded) => {
  if (!encoded) return [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const path = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return path;
};

const createMarkerIcon = (google, color, label) => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: color,
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 4,
  scale: label === "R" ? 10 : 8,
});

const GoogleTrackingMap = ({ rider, restaurant, destination, encodedPolyline }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);
  const [status, setStatus] = useState(isGoogleMapsConfigured() ? "Loading live map..." : "Add VITE_GOOGLE_MAPS_API_KEY to enable live map.");
  const [mapReady, setMapReady] = useState(false);

  const points = useMemo(() => ({
    rider: asLatLng(rider),
    restaurant: asLatLng(restaurant),
    destination: asLatLng(destination),
  }), [rider, restaurant, destination]);

  useEffect(() => {
    if (!isGoogleMapsConfigured()) return undefined;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        const center = points.rider || points.destination || points.restaurant || DEFAULT_CENTER;
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        setStatus("Live map ready.");
        setMapReady(true);
      })
      .catch((error) => setStatus(error.message));

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const google = window.google;
    if (!map || !google?.maps) return;

    const ensureMarker = (key, position, color, title) => {
      if (!position) {
        markersRef.current[key]?.setMap(null);
        delete markersRef.current[key];
        return;
      }
      if (!markersRef.current[key]) {
        markersRef.current[key] = new google.maps.Marker({
          map,
          position,
          title,
          icon: createMarkerIcon(google, color, key[0].toUpperCase()),
        });
      } else {
        markersRef.current[key].setPosition(position);
      }
    };

    ensureMarker("rider", points.rider, "#4f46e5", "Rider");
    ensureMarker("restaurant", points.restaurant, "#f59e0b", "Restaurant");
    ensureMarker("destination", points.destination, "#059669", "Delivery address");

    const routePath = decodePolyline(encodedPolyline);
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (routePath.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#4f46e5",
        strokeOpacity: 0.92,
        strokeWeight: 5,
        map,
      });
    } else {
      const fallbackPath = [points.rider || points.restaurant, points.destination].filter(Boolean);
      if (fallbackPath.length > 1) {
        polylineRef.current = new google.maps.Polyline({
          path: fallbackPath,
          geodesic: true,
          strokeColor: "#94a3b8",
          strokeOpacity: 0.9,
          strokeWeight: 4,
          map,
        });
      }
    }

    const bounds = new google.maps.LatLngBounds();
    const boundsPoints = routePath.length ? routePath : Object.values(points).filter(Boolean);
    boundsPoints.forEach((point) => bounds.extend(point));
    if (!bounds.isEmpty()) map.fitBounds(bounds, 72);
  }, [mapReady, points, encodedPolyline]);

  return (
    <div className="relative h-full min-h-80 overflow-hidden rounded-3xl bg-slate-100">
      <div ref={mapRef} className="h-full min-h-80 w-full" />
      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-indigo-950 shadow-sm">
          <Bike className="h-3.5 w-3.5 text-indigo-600" /> Rider
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-amber-700 shadow-sm">
          <Store className="h-3.5 w-3.5" /> Restaurant
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-emerald-700 shadow-sm">
          <MapPin className="h-3.5 w-3.5" /> You
        </span>
      </div>
      {status !== "Live map ready." ? (
        <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          {status}
        </div>
      ) : null}
    </div>
  );
};

export default GoogleTrackingMap;

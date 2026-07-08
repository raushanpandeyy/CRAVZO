import React, { useEffect, useRef } from "react";
import { Platform, Text, View } from "react-native";
import { Bike, MapPin, Store } from "lucide-react-native";

let MapLibreMap = null;
let Camera = null;
let Marker = null;
if (Platform.OS !== "web") {
  try {
    const MapLibre = require("@maplibre/maplibre-react-native");
    MapLibreMap = MapLibre.Map;
    Camera = MapLibre.Camera;
    Marker = MapLibre.Marker;
  } catch {
    MapLibreMap = null;
  }
}

const MAP_STYLE = process.env.EXPO_PUBLIC_MAPLIBRE_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";
const toLngLat = (point) => [Number(point.longitude), Number(point.latitude)];

export default function LightweightTrackingMap({ rider, restaurant, destination }) {
  const cameraRef = useRef(null);
  const points = [rider, restaurant, destination].filter((point) => point?.latitude != null && point?.longitude != null);

  useEffect(() => {
    if (!cameraRef.current || points.length === 0) return;
    if (points.length === 1) {
      cameraRef.current.easeTo({ center: toLngLat(points[0]), zoom: 15, duration: 700 });
      return;
    }
    const lngs = points.map((point) => Number(point.longitude));
    const lats = points.map((point) => Number(point.latitude));
    cameraRef.current.fitBounds(
      [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      { padding: { top: 55, right: 55, bottom: 55, left: 55 }, duration: 700 },
    );
  }, [rider?.latitude, rider?.longitude, restaurant?.latitude, restaurant?.longitude, destination?.latitude, destination?.longitude]);

  if (!MapLibreMap || !Camera || !Marker) {
    return (
      <View className="flex-1 items-center justify-center bg-indigo-50 px-6">
        <Bike size={34} color="#4f46e5" />
        <Text className="mt-3 text-center font-bold text-indigo-950">Rider live location is updating</Text>
        <Text className="mt-1 text-center text-xs text-indigo-700">Open the Android release build to view the lightweight live map.</Text>
      </View>
    );
  }

  const initialPoint = rider || destination || restaurant;
  return (
    <MapLibreMap mapStyle={MAP_STYLE} style={{ flex: 1 }} attributionEnabled={false} logoEnabled={false} compassEnabled={false}>
      <Camera ref={cameraRef} initialViewState={{ center: initialPoint ? toLngLat(initialPoint) : [77.2, 28.6], zoom: 13 }} />
      {rider?.latitude != null ? (
        <Marker id="rider" lngLat={toLngLat(rider)} anchor="center">
          <View className="h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-indigo-600 shadow-lg"><Bike size={20} color="#fff" /></View>
        </Marker>
      ) : null}
      {restaurant?.latitude != null ? (
        <Marker id="restaurant" lngLat={toLngLat(restaurant)} anchor="center">
          <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-amber-500"><Store size={17} color="#fff" /></View>
        </Marker>
      ) : null}
      {destination?.latitude != null ? (
        <Marker id="destination" lngLat={toLngLat(destination)} anchor="bottom">
          <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600"><MapPin size={17} color="#fff" /></View>
        </Marker>
      ) : null}
    </MapLibreMap>
  );
}
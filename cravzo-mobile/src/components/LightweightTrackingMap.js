import React, { useEffect, useMemo, useRef } from "react";
import { Platform, Text, View } from "react-native";
import { Bike, MapPin, Store } from "lucide-react-native";

let MapView = null;
let Marker = null;
let Polyline = null;
if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch {
    MapView = null;
  }
}

const DEFAULT_REGION = { latitude: 28.6, longitude: 77.2, latitudeDelta: 0.06, longitudeDelta: 0.06 };
const toCoordinate = (point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude) });

const getInitialRegion = (points) => {
  if (!points.length) return DEFAULT_REGION;
  if (points.length === 1) return { ...toCoordinate(points[0]), latitudeDelta: 0.02, longitudeDelta: 0.02 };

  const lats = points.map((point) => Number(point.latitude));
  const lngs = points.map((point) => Number(point.longitude));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.02),
  };
};

export default function LightweightTrackingMap({ rider, restaurant, destination }) {
  const mapRef = useRef(null);
  const points = useMemo(
    () => [rider, restaurant, destination].filter((point) => point?.latitude != null && point?.longitude != null),
    [rider, restaurant, destination],
  );
  const routeCoordinates = useMemo(() => points.map(toCoordinate), [points]);
  const initialRegion = useMemo(() => getInitialRegion(points), [points]);

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;
    if (points.length === 1) {
      mapRef.current.animateToRegion({ ...toCoordinate(points[0]), latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
      return;
    }
    mapRef.current.fitToCoordinates(routeCoordinates, {
      edgePadding: { top: 55, right: 55, bottom: 55, left: 55 },
      animated: true,
    });
  }, [points, routeCoordinates]);

  if (!MapView || !Marker) {
    return (
      <View className="flex-1 items-center justify-center bg-indigo-50 px-6">
        <Bike size={34} color="#4f46e5" />
        <Text className="mt-3 text-center font-bold text-indigo-950">Rider live location is updating</Text>
        <Text className="mt-1 text-center text-xs text-indigo-700">Open the Android release build to view the live map.</Text>
      </View>
    );
  }

  return (
    <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={initialRegion} showsUserLocation={false} toolbarEnabled={false}>
      {Polyline && routeCoordinates.length > 1 ? (
        <Polyline coordinates={routeCoordinates} strokeColor="#4f46e5" strokeWidth={4} lineDashPattern={[1]} />
      ) : null}
      {rider?.latitude != null ? (
        <Marker coordinate={toCoordinate(rider)} anchor={{ x: 0.5, y: 0.5 }}>
          <View className="h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-indigo-600 shadow-lg"><Bike size={20} color="#fff" /></View>
        </Marker>
      ) : null}
      {restaurant?.latitude != null ? (
        <Marker coordinate={toCoordinate(restaurant)} anchor={{ x: 0.5, y: 0.5 }}>
          <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-amber-500"><Store size={17} color="#fff" /></View>
        </Marker>
      ) : null}
      {destination?.latitude != null ? (
        <Marker coordinate={toCoordinate(destination)} anchor={{ x: 0.5, y: 1 }}>
          <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600"><MapPin size={17} color="#fff" /></View>
        </Marker>
      ) : null}
    </MapView>
  );
}

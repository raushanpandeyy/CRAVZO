import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert,
} from "react-native";
import { MapPin, ChevronLeft, Navigation, Info, Pencil } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getMyRestaurant, updateRestaurant } from "../../services/vendorService";

let MapView, Marker, Circle;
try {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
} catch {}

export default function DeliveryAreaScreen({ navigation }) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getMyRestaurant();
      setRestaurant(data);
      if (data?.latitude && data?.longitude) {
        setRegion({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (err) {
      console.error("Delivery area load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLocationChange = async ({ latitude, longitude }) => {
    if (!restaurant?.id) return;
    const previous = restaurant;
    setRestaurant((current) => ({ ...current, latitude, longitude }));
    setRegion((current) => ({ ...current, latitude, longitude }));
    try {
      await updateRestaurant(restaurant.id, { latitude, longitude });
    } catch (err) {
      setRestaurant(previous);
      Alert.alert("Update failed", err.message || "Could not update the restaurant location.");
    }
  };
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  const hasLocation = Boolean(restaurant?.latitude && restaurant?.longitude);
  const screenWidth = Dimensions.get("window").width;

  return (
    <View className="flex-1">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Delivery Area</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-12 w-12 rounded-2xl bg-indigo-50 items-center justify-center">
              <MapPin size={24} color={colors.brand[600]} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-slate-900">Delivery Zone</Text>
              <Text className="text-sm text-slate-500">Where customers can order from</Text>
            </View>
          </View>

          {hasLocation && MapView ? (
            <View className="space-y-3">
              <View className="h-64 rounded-2xl overflow-hidden">
                <MapView
                  style={{ width: screenWidth - 48, height: 256 }}
                  initialRegion={region}
                  onRegionChangeComplete={setRegion}
                >
                  <Marker
                    coordinate={{ latitude: restaurant.latitude, longitude: restaurant.longitude }}
                    title={restaurant.name}
                    description="Drag to update location"
                    draggable
                    onDragEnd={(event) => handleLocationChange(event.nativeEvent.coordinate)}
                  />
                  <Circle
                    center={{ latitude: restaurant.latitude, longitude: restaurant.longitude }}
                    radius={3000}
                    strokeWidth={2}
                    strokeColor="#6366f1"
                    fillColor="rgba(99, 102, 241, 0.1)"
                  />
                </MapView>
              </View>
              <View className="bg-indigo-50 rounded-2xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Navigation size={16} color={colors.brand[600]} />
                  <Text className="text-sm font-bold text-indigo-900">Restaurant Location</Text>
                </View>
                <Text className="text-xs text-indigo-700">
                  Lat: {restaurant.latitude.toFixed(6)}, Lng: {restaurant.longitude.toFixed(6)}
                </Text>
                <Text className="text-xs text-indigo-600 mt-1">
                  {restaurant.addressLine1}, {restaurant.city}, {restaurant.state} {restaurant.postalCode}
                </Text>
              </View>
              <View className="bg-slate-50 rounded-2xl p-4">
                <View className="flex-row items-center gap-2">
                  <Info size={16} color={colors.slate[500]} />
                  <Text className="text-sm font-medium text-slate-700">Delivery radius: 3 km</Text>
                </View>
                <Text className="text-xs text-slate-500 mt-1">
                  Customers within 3 km of your location can discover and order from your restaurant.
                </Text>
              </View>
            </View>
          ) : hasLocation ? (
            <View className="space-y-3">
              <View className="bg-indigo-50 rounded-2xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Navigation size={16} color={colors.brand[600]} />
                  <Text className="text-sm font-bold text-indigo-900">Restaurant Location</Text>
                </View>
                <Text className="text-xs text-indigo-700">
                  Lat: {restaurant.latitude.toFixed(6)}, Lng: {restaurant.longitude.toFixed(6)}
                </Text>
                <Text className="text-xs text-indigo-600 mt-1">
                  {restaurant.addressLine1}, {restaurant.city}, {restaurant.state} {restaurant.postalCode}
                </Text>
              </View>
              <View className="bg-slate-50 rounded-2xl p-4">
                <View className="flex-row items-center gap-2">
                  <Info size={16} color={colors.slate[500]} />
                  <Text className="text-sm font-medium text-slate-700">Delivery radius: 3 km</Text>
                </View>
                <Text className="text-xs text-slate-500 mt-1">
                  Customers within 3 km of your location can discover and order from your restaurant.
                </Text>
              </View>
            </View>
          ) : (
            <View className="items-center py-8">
              <Navigation size={48} color="#94a3b8" />
              <Text className="text-base font-bold text-slate-500 mt-4">Location not set</Text>
              <Text className="text-sm text-slate-400 mt-1 text-center">
                Set your restaurant location from the Profile page to define your delivery area.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mt-4 bg-indigo-600 rounded-xl px-6 py-3"
              >
                <Text className="text-sm font-extrabold text-white">Go to Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}



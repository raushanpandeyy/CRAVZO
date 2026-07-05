import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { MapPin, ChevronLeft, Navigation, Info } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getMyRestaurant } from "../../services/vendorService";

export default function DeliveryAreaScreen({ navigation }) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getMyRestaurant();
      setRestaurant(data);
    } catch (err) {
      console.error("Delivery area load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  const hasLocation = Boolean(restaurant?.latitude && restaurant?.longitude);

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

          {hasLocation ? (
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
                  <Text className="text-sm font-medium text-slate-700">Default delivery radius: 3 km</Text>
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

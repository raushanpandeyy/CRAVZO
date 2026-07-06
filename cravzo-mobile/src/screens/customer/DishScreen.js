import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image,
} from "react-native";
import { Star, Clock3, ChevronLeft } from "lucide-react-native";
import { colors } from "../../constants/colors";
import OptimizedImage from "../../components/OptimizedImage";
import { listRestaurants } from "../../services/foodService";
import { getShareUrl, getShareText } from "../../utils/share";
import ShareButton from "../../components/ShareButton";

export default function DishScreen({ route, navigation }) {
  const { dishName } = route.params || {};
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listRestaurants({ dish: dishName });
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Dish fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [dishName]);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4 flex-1">
            <TouchableOpacity onPress={() => navigation.goBack()}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <ChevronLeft size={20} color={colors.slate[900]} />
            </TouchableOpacity>
            <View>
              <Text className="text-xs font-bold text-indigo-700">Showing results for</Text>
              <Text className="text-xl font-extrabold text-slate-900 capitalize">{dishName}</Text>
            </View>
          </View>
          <ShareButton
            url={getShareUrl.dish(dishName)}
            text={getShareText.dish(dishName)}
            iconSize={20}
            className="h-10 w-10 bg-slate-100"
          />
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        {loading ? (
          <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 40 }} />
        ) : restaurants.length === 0 ? (
          <View className="items-center py-20">
            <Text className="text-lg font-bold text-slate-500">No restaurants found</Text>
            <Text className="text-sm text-slate-400 mt-1">Try a different dish</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {restaurants.map((r, index) => (
              <TouchableOpacity key={r.id}
                onPress={() => navigation.navigate("RestaurantMenu", { restaurantId: r.id, restaurantName: r.name })}
                activeOpacity={0.9}
                className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-md"
              >
                <View className="relative h-44 w-full bg-slate-100">
                  {r.imageUrl ? (
                    <OptimizedImage source={{ uri: r.imageUrl }} className="h-full w-full object-cover" />
                  ) : (
                    <View className="h-full w-full items-center justify-center bg-indigo-100">
                      <Text className="text-4xl font-black text-indigo-600">{r.name?.[0]}</Text>
                    </View>
                  )}
                  <View className="absolute inset-x-0 bottom-0 h-20 bg-black/50" />
                  <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 shadow-sm">
                    <Text className="text-xs font-black text-indigo-950">Open now</Text>
                  </View>
                  <View className="absolute bottom-3 left-3 flex-row items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1">
                    <Star size={14} color="#fff" fill="#fff" />
                    <Text className="text-xs font-black text-white">{r.rating || ""}</Text>
                  </View>
                </View>
                <View className="p-4">
                  <Text className="text-lg font-black text-slate-950" numberOfLines={1}>{r.name}</Text>
                  <Text className="mt-1 text-sm font-semibold text-slate-500" numberOfLines={1}>
                    {r.cuisine || ""} • {r.location || r.city || ""}
                  </Text>
                  <View className="mt-3 flex-row flex-wrap items-center gap-x-4 gap-y-2">
                    <View className="flex-row items-center gap-1">
                      <Clock3 size={16} color={colors.brand[700]} />
                      <Text className="text-xs font-extrabold text-slate-700">{r.deliveryTime || ""}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

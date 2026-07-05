import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Heart, Star, Clock3, ChevronLeft } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getFavorites, removeFavorite } from "../../services/favoriteService";

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getFavorites();
        setFavorites(Array.isArray(data) ? data : []);
      } catch (e) {
        Alert.alert("Error", "Failed to load favourites: " + (e.message || "Network error"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRemove = async (fav) => {
    try {
      await removeFavorite(fav.id || fav.restaurantId);
      setFavorites((prev) => prev.filter((f) => f.id !== fav.id && f.restaurantId !== fav.restaurantId));
    } catch {
      Alert.alert("Error", "Failed to remove from favourites");
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">My Favourites</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        {loading ? (
          <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 40 }} />
        ) : favorites.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Heart size={48} color="#94a3b8" />
            <Text className="text-lg font-bold text-slate-900 mt-4">No favourites yet</Text>
            <Text className="text-sm text-slate-500 mt-1">Save your favourite restaurants and dishes here</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {favorites.map((fav) => {
              const isDishFav = fav.type === "dish" || fav.dish;
              if (isDishFav) {
                const dish = fav.dish || fav;
                return (
                  <TouchableOpacity key={fav.id || dish.id}
                    onPress={() => navigation.navigate("DishScreen", { dishName: dish.name || dish.dishName })}
                    activeOpacity={0.9}
                    className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-md"
                  >
                    <View className="relative h-36 w-full bg-slate-100">
                      {dish.imageUrl ? (
                        <Image source={{ uri: dish.imageUrl }} className="h-full w-full" resizeMode="cover" />
                      ) : (
                        <View className="h-full w-full items-center justify-center bg-indigo-100">
                          <Text className="text-4xl font-black text-indigo-600">{dish.name?.[0] || dish.dishName?.[0]}</Text>
                        </View>
                      )}
                      <View className="absolute inset-x-0 bottom-0 h-16 bg-black/50" />
                      <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 shadow-sm">
                        <Text className="text-xs font-black text-indigo-950">Dish</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemove(fav)}
                        className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
                      >
                        <Heart size={16} color={colors.rose[500]} fill={colors.rose[500]} />
                      </TouchableOpacity>
                    </View>
                    <View className="p-4">
                      <Text className="text-lg font-black text-slate-950" numberOfLines={1}>{dish.name || dish.dishName}</Text>
                      <Text className="mt-1 text-sm font-semibold text-slate-500" numberOfLines={1}>
                        {dish.cuisine || dish.category || "Popular dish"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }
              const restaurant = fav.restaurant || fav;
              return (
                <TouchableOpacity key={fav.id || restaurant.id}
                  onPress={() => navigation.navigate("RestaurantMenu", { restaurantId: restaurant.id, restaurantName: restaurant.name })}
                  activeOpacity={0.9}
                  className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-md"
                >
                  <View className="relative h-44 w-full bg-slate-100">
                    {restaurant.imageUrl ? (
                      <Image source={{ uri: restaurant.imageUrl }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center bg-indigo-100">
                        <Text className="text-4xl font-black text-indigo-600">{restaurant.name?.[0]}</Text>
                      </View>
                    )}
                    <View className="absolute inset-x-0 bottom-0 h-20 bg-black/50" />
                    <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 shadow-sm">
                      <Text className="text-xs font-black text-indigo-950">Open now</Text>
                    </View>
                    <View className="absolute bottom-3 left-3 flex-row items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1">
                      <Star size={14} color="#fff" fill="#fff" />
                      <Text className="text-xs font-black text-white">{restaurant.rating || "4.2"}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemove(fav)}
                      className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
                    >
                      <Heart size={16} color={colors.rose[500]} fill={colors.rose[500]} />
                    </TouchableOpacity>
                  </View>
                  <View className="p-4">
                    <Text className="text-lg font-black text-slate-950" numberOfLines={1}>{restaurant.name}</Text>
                    <Text className="mt-1 text-sm font-semibold text-slate-500" numberOfLines={1}>
                      {restaurant.cuisine || "Fresh meals"} • {restaurant.location || restaurant.city || "Near you"}
                    </Text>
                    <View className="mt-3 flex-row flex-wrap items-center gap-x-4 gap-y-2">
                      <View className="flex-row items-center gap-1">
                        <Clock3 size={16} color={colors.brand[700]} />
                        <Text className="text-xs font-extrabold text-slate-700">{restaurant.deliveryTime || "30-40 min"}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Search, Star, Clock3, X, MapPin, Utensils, Navigation } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { searchRestaurantsAndDishes, listRestaurants, getNearbyRestaurants } from "../../services/foodService";
import useDebounce from "../../hooks/useDebounce";

const SUGGESTED_DISHES = [
  "Biryani", "Burger", "Pizza", "Dosa", "Momos",
  "Noodles", "Paratha", "Rolls", "Chaat", "Ice Cream",
];

const RestaurantCard = ({ restaurant, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-md mb-3"
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
        {restaurant.distance ? (
          <Text className="text-xs font-extrabold text-slate-500">{restaurant.distance}</Text>
        ) : null}
      </View>
    </View>
  </TouchableOpacity>
);

const DishCard = ({ dish, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="flex-row items-center gap-3 rounded-2xl bg-white border border-slate-100 px-3 py-3 mb-2"
  >
    <View className="h-12 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
      {dish.imageUrl ? (
        <Image source={{ uri: dish.imageUrl }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Utensils size={20} color={colors.slate[500]} />
      )}
    </View>
    <View className="flex-1">
      <Text className="text-sm font-extrabold text-slate-900">{dish.name}</Text>
      <Text className="text-xs font-medium text-slate-500">
        {dish.restaurantName}
        {dish.price > 0 && <Text className="ml-2 font-bold text-indigo-600">  ₹{Math.floor(dish.price)}</Text>}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function RestaurantListScreen({ navigation, route }) {
  const initialCategory = route?.params?.category || "";
  const initialQuery = route?.params?.query || "";
  const [query, setQuery] = useState(initialQuery || initialCategory);
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState({ restaurants: [], dishes: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const inputRef = useRef(null);

  const fetchResults = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults({ restaurants: [], dishes: [] });
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const opts = {};
      if (nearbyMode && userLocation) {
        opts.lat = userLocation.lat;
        opts.lng = userLocation.lng;
        opts.radius = 5;
      }
      const data = await searchRestaurantsAndDishes(q, opts);
      setResults(data);
      setSuggestions(data.dishes?.slice(0, 5) || []);
    } catch {
      setResults({ restaurants: [], dishes: [] });
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [nearbyMode, userLocation]);

  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery);
    } else if (initialCategory) {
      fetchCategoryResults(initialCategory);
    }
  }, [debouncedQuery, initialCategory]);

  const fetchCategoryResults = async (category) => {
    setLoading(true);
    try {
      const data = await searchRestaurantsAndDishes(category);
      setResults(data);
    } catch {
      setResults({ restaurants: [], dishes: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults({ restaurants: [], dishes: [] });
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleChipTap = (chip) => {
    setQuery(chip);
  };

  const handleDishPress = (dish) => {
    navigation.navigate("DishScreen", { dishId: dish.id, dishName: dish.name, restaurantId: dish.restaurantId });
  };

  const handleRestaurantPress = (restaurant) => {
    navigation.navigate("RestaurantMenu", { restaurantId: restaurant.id, restaurantName: restaurant.name });
  };

  const toggleNearby = () => {
    setNearbyMode((prev) => !prev);
    if (!userLocation) {
    }
  };

  const hasResults = results.restaurants?.length > 0 || results.dishes?.length > 0;

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="px-4 pt-16 pb-2 bg-white shadow-sm">
        <View className="flex-row items-center bg-white rounded-xl border-2 border-[#ff6b5f] px-4 h-12 shadow-sm">
          {loading ? (
            <ActivityIndicator size="small" color="#ff6b5f" />
          ) : (
            <Search size={18} color="#ff6b5f" />
          )}
          <TextInput
            ref={inputRef}
            className="flex-1 ml-3 text-sm font-semibold text-slate-900"
            placeholder="Search for dishes or restaurants..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <TouchableOpacity onPress={handleClear} className="p-1">
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {SUGGESTED_DISHES.map((dish) => (
              <TouchableOpacity
                key={dish}
                onPress={() => handleChipTap(dish)}
                className={`rounded-full px-3 py-1.5 border ${query === dish ? "bg-[#ff6b5f] border-[#ff6b5f]" : "bg-slate-50 border-slate-200"}`}
              >
                <Text className={`text-xs font-bold ${query === dish ? "text-white" : "text-slate-700"}`}>{dish}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={toggleNearby}
            className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ml-2 ${nearbyMode ? "bg-indigo-600" : "bg-slate-100"}`}
          >
            <Navigation size={12} color={nearbyMode ? "#fff" : colors.slate[500]} />
            <Text className={`text-[10px] font-extrabold ${nearbyMode ? "text-white" : "text-slate-600"}`}>Nearby</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {loading && !hasResults ? (
          <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 40 }} />
        ) : !query && !initialCategory ? (
          <View className="items-center justify-center py-20">
            <Search size={40} color="#94a3b8" />
            <Text className="mt-3 text-sm font-semibold text-slate-500">Search for restaurants and dishes</Text>
          </View>
        ) : !hasResults ? (
          <View className="items-center justify-center py-20">
            <Search size={40} color="#94a3b8" />
            <Text className="mt-3 text-sm font-semibold text-slate-500">No results found</Text>
          </View>
        ) : (
          <>
            {results.dishes?.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="h-5 w-5 items-center justify-center rounded-md bg-indigo-100">
                    <Utensils size={12} color={colors.brand[700]} />
                  </View>
                  <Text className="text-xs font-black uppercase tracking-wider text-indigo-700">Dishes</Text>
                </View>
                {results.dishes.map((dish) => (
                  <DishCard key={`d-${dish.id}`} dish={dish} onPress={() => handleDishPress(dish)} />
                ))}
              </View>
            )}

            {results.restaurants?.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="h-5 w-5 items-center justify-center rounded-md bg-amber-100">
                    <MapPin size={12} color="#d97706" />
                  </View>
                  <Text className="text-xs font-black uppercase tracking-wider text-amber-700">Restaurants</Text>
                </View>
                {results.restaurants.map((restaurant) => (
                  <RestaurantCard key={`r-${restaurant.id}`} restaurant={restaurant} onPress={() => handleRestaurantPress(restaurant)} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

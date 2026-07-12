import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert,
} from "react-native";
import * as Location from "expo-location";
import OptimizedImage from "../../components/OptimizedImage";
import { Search, Star, Clock3, X, MapPin, Utensils, Navigation } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { searchRestaurantsAndDishes } from "../../services/foodService";
import useDebounce from "../../hooks/useDebounce";

const SUGGESTED_DISHES = [
  "Biryani", "Burger", "Pizza", "Dosa", "Momos", "Noodles", "Paratha", "Rolls", "Chaat", "Ice Cream",
];

const RestaurantCard = ({ restaurant, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-md mb-3">
    <View className="relative h-44 w-full bg-slate-100">
      {restaurant.imageUrl ? (
        <OptimizedImage source={{ uri: restaurant.imageUrl }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <View className="h-full w-full items-center justify-center bg-indigo-100"><Text className="text-4xl font-black text-indigo-600">{restaurant.name?.[0]}</Text></View>
      )}
      <View className="absolute inset-x-0 bottom-0 h-20 bg-black/50" />
      <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 shadow-sm"><Text className="text-xs font-black text-indigo-950">Open now</Text></View>
      {restaurant.rating != null ? (
        <View className="absolute bottom-3 left-3 flex-row items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1">
          <Star size={14} color="#fff" fill="#fff" /><Text className="text-xs font-black text-white">{restaurant.rating}</Text>
        </View>
      ) : null}
    </View>
    <View className="p-4">
      <Text className="text-lg font-black text-slate-950" numberOfLines={1}>{restaurant.name}</Text>
      {(restaurant.cuisine || restaurant.location || restaurant.city) ? (
        <Text className="mt-1 text-sm font-semibold text-slate-500" numberOfLines={1}>
          {[restaurant.cuisine, restaurant.location || restaurant.city].filter(Boolean).join(" • ")}
        </Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap items-center gap-x-4 gap-y-2">
        {restaurant.deliveryTime ? <View className="flex-row items-center gap-1"><Clock3 size={16} color={colors.brand[700]} /><Text className="text-xs font-extrabold text-slate-700">{restaurant.deliveryTime}</Text></View> : null}
        {restaurant.distance ? <Text className="text-xs font-extrabold text-slate-500">{restaurant.distance}</Text> : null}
      </View>
    </View>
  </TouchableOpacity>
);

const DishCard = ({ dish, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-row items-center gap-3 rounded-2xl bg-white border border-slate-100 px-3 py-3 mb-2">
    <View className="h-12 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
      {dish.imageUrl ? <OptimizedImage source={{ uri: dish.imageUrl }} className="h-full w-full" resizeMode="cover" /> : <Utensils size={20} color={colors.slate[500]} />}
    </View>
    <View className="flex-1"><Text className="text-sm font-extrabold text-slate-900">{dish.name}</Text><Text className="text-xs font-medium text-slate-500">{dish.restaurantName}{dish.price > 0 ? <Text className="font-bold text-indigo-600">  {"\u20b9"}{Math.floor(dish.price)}</Text> : null}</Text></View>
  </TouchableOpacity>
);

export default function RestaurantListScreen({ navigation, route }) {
  const initialCategory = route?.params?.category || "";
  const [query, setQuery] = useState(route?.params?.query || initialCategory);
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState({ restaurants: [], dishes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const inputRef = useRef(null);

  const fetchResults = useCallback(async (searchQuery, nearby = nearbyMode, location = userLocation) => {
    if (!searchQuery || searchQuery.length < 2) { setResults({ restaurants: [], dishes: [] }); return; }
    setLoading(true); setError("");
    try {
      const options = nearby && location ? { lat: location.latitude, lng: location.longitude, radius: 5 } : {};
      setResults(await searchRestaurantsAndDishes(searchQuery, options));
    } catch (err) {
      setResults({ restaurants: [], dishes: [] });
      setError(err.message || "Could not load search results. Please try again.");
    } finally { setLoading(false); }
  }, [nearbyMode, userLocation]);

  useEffect(() => { fetchResults(debouncedQuery); }, [debouncedQuery, nearbyMode, userLocation, fetchResults]);

  const toggleNearby = async () => {
    if (nearbyMode) { setNearbyMode(false); return; }
    setLoading(true); setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Location permission needed", "Allow location access in Settings to show nearby restaurants.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setNearbyMode(true);
    } catch (err) {
      setError(err.message || "Could not get your location. Check GPS and try again.");
      Alert.alert("Location unavailable", "Could not get your current location. Check GPS and try again.");
    } finally { setLoading(false); }
  };

  const data = useMemo(() => [
    ...(results.dishes || []).map((item) => ({ type: "dish", item })),
    ...(results.restaurants || []).map((item) => ({ type: "restaurant", item })),
  ], [results]);

  const header = (
    <>
      {error ? <View className="mb-4 rounded-xl bg-red-50 px-4 py-3"><Text className="text-sm text-red-700">{error}</Text></View> : null}
      {loading && data.length === 0 ? <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 40 }} /> : null}
    </>
  );

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="px-4 pt-16 pb-2 bg-white shadow-sm">
        <View className="flex-row items-center bg-white rounded-xl border-2 border-[#ff6b5f] px-4 h-12 shadow-sm">
          {loading ? <ActivityIndicator size="small" color="#ff6b5f" /> : <Search size={18} color="#ff6b5f" />}
          <TextInput ref={inputRef} className="flex-1 ml-3 text-sm font-semibold text-slate-900" placeholder="Search for dishes or restaurants..." placeholderTextColor="#94a3b8" value={query} onChangeText={setQuery} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />
          {query ? <TouchableOpacity onPress={() => { setQuery(""); setResults({ restaurants: [], dishes: [] }); inputRef.current?.focus(); }} className="p-1"><X size={16} color="#94a3b8" /></TouchableOpacity> : null}
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <FlatList horizontal data={SUGGESTED_DISHES} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setQuery(item)} className={`rounded-full px-3 py-1.5 border ${query === item ? "bg-[#ff6b5f] border-[#ff6b5f]" : "bg-slate-50 border-slate-200"}`}><Text className={`text-xs font-bold ${query === item ? "text-white" : "text-slate-700"}`}>{item}</Text></TouchableOpacity>
          )} />
          <TouchableOpacity onPress={toggleNearby} disabled={loading} className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ml-2 ${nearbyMode ? "bg-indigo-600" : "bg-slate-100"}`}>
            <Navigation size={12} color={nearbyMode ? "#fff" : colors.slate[500]} /><Text className={`text-[10px] font-extrabold ${nearbyMode ? "text-white" : "text-slate-600"}`}>Nearby</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={data}
        keyExtractor={({ type, item }) => `${type}-${item.id}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        ListHeaderComponent={header}
        ListEmptyComponent={!loading ? <View className="flex-1 items-center justify-center py-20"><Search size={40} color="#94a3b8" /><Text className="mt-3 text-sm font-semibold text-slate-500">{query ? "No results found" : "Search for restaurants and dishes"}</Text></View> : null}
        renderItem={({ item: row, index }) => {
          const previousType = data[index - 1]?.type;
          return <View>{previousType !== row.type ? <View className="flex-row items-center gap-2 mb-2 mt-2">{row.type === "dish" ? <Utensils size={14} color={colors.brand[700]} /> : <MapPin size={14} color="#d97706" />}<Text className="text-xs font-black uppercase tracking-wider text-slate-700">{row.type === "dish" ? "Dishes" : "Restaurants"}</Text></View> : null}{row.type === "dish" ? <DishCard dish={row.item} onPress={() => navigation.navigate("DishScreen", { dishId: row.item.id, dishName: row.item.name, restaurantId: row.item.restaurantId })} /> : <RestaurantCard restaurant={row.item} onPress={() => navigation.navigate("RestaurantMenu", { restaurantId: row.item.id, restaurantName: row.item.name })} />}</View>;
        }}
      />
    </View>
  );
}

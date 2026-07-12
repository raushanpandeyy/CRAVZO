import { selectUserState, selectCurrentUser, selectIsLoggedIn } from "../../store/selectors";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Star, Clock3, Search, MapPin, ShoppingCart, User, MessageCircle, Utensils, X, Leaf } from "lucide-react-native";
import DishPromoCarousel from "../../components/DishPromoCarousel";
import OptimizedImage from "../../components/OptimizedImage";
import { colors } from "../../constants/colors";
import { listRestaurants, searchRestaurantsAndDishes } from "../../services/foodService";
import { selectCartItemCount } from "../../store/slices/cartSlice";
import useDebounce from "../../hooks/useDebounce";
import {
  burger,
  dosa,
  biryaniplate,
  momos,
  cake,
  chinese,
  indianthali,
  rolls,
  parathe,
  Chaat,
  icecream,
  Snacks,
  southindian,
  salad,
  northindian,
  dodagologo,
} from "../../constants/images";

const categories = [
  { name: "Burger", image: burger },
  { name: "Dosa", image: dosa },
  { name: "Biryani", image: biryaniplate },
  { name: "Momos", image: momos },
  { name: "Desserts", image: cake },
  { name: "Chinese", image: chinese },
  { name: "Thali", image: indianthali },
  { name: "Rolls", image: rolls },
  { name: "Paratha", image: parathe },
  { name: "Chaat", image: Chaat },
  { name: "Ice Cream", image: icecream },
  { name: "Snacks", image: Snacks },
  { name: "South Indian", image: southindian },
  { name: "Salad", image: salad },
  { name: "North Indian", image: northindian },
];

const MobileNearbyMiniCard = ({ restaurant, index, navigation }) => {
  const dish = restaurant.dish || restaurant.menuPreview?.[0];
  const [imgFailed, setImgFailed] = useState(false);
  const dishImage = !imgFailed && (dish?.imageUrl || restaurant.imageUrl);
  const deliveryTime = restaurant.deliveryTime || "";
  const dishName = dish?.name || restaurant.name;

  const labels = [dishName, deliveryTime].filter(Boolean);
  const [labelIndex, setLabelIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLabelIndex((i) => (i + 1) % labels.length), 2000);
    return () => clearInterval(timer);
  }, [labels.length]);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("RestaurantMenu", { restaurantId: restaurant.id, restaurantName: restaurant.name })}
      activeOpacity={0.7}
      style={{ width: 76 }}
    >
      <View style={{ width: 76, height: 76 }} className="overflow-hidden rounded-2xl bg-indigo-100 shadow-sm">
        {dishImage ? (
          <OptimizedImage source={{ uri: dishImage }} style={{ width: 76, height: 76 }} resizeMode="cover" onError={() => setImgFailed(true)} />
        ) : (
          <View style={{ width: 76, height: 76 }} className="items-center justify-center">
            <Text className="text-lg font-black text-indigo-400">{dishName?.[0]}</Text>
          </View>
        )}
      </View>
      <Text
        style={{ width: 76 }}
        className="mt-1 text-[10px] font-extrabold text-indigo-700 text-center truncate leading-tight"
        numberOfLines={1}
      >
        {labels[labelIndex]}
      </Text>
    </TouchableOpacity>
  );
};

const PopularDishesSection = ({ restaurants, navigation }) => {
  const items = restaurants
    .flatMap((restaurant) =>
      (restaurant.menuPreview?.length ? restaurant.menuPreview : [null]).map((dish) => ({
        ...restaurant,
        dish,
      }))
    )
    .slice(0, 20);
  const row1 = items.slice(0, 10);
  const row2 = items.slice(10, 20);

  return (
    <View className="py-3 border-b border-indigo-100">
      <View className="px-4 mb-2">
        <Text className="text-base font-bold text-indigo-700">Popular Dishes Nearby</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4" contentContainerStyle={{ gap: 12 }}>
        {row1.map((restaurant, index) => (
          <MobileNearbyMiniCard key={`${restaurant.id}-${restaurant.dish?.id || "r"}-r1`} restaurant={restaurant} index={index} navigation={navigation} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mt-3" contentContainerStyle={{ gap: 12 }}>
        {row2.map((restaurant, index) => (
          <MobileNearbyMiniCard key={`${restaurant.id}-${restaurant.dish?.id || "r"}-r2`} restaurant={restaurant} index={index + 10} navigation={navigation} />
        ))}
      </ScrollView>
    </View>
  );
};

const PROMO_HEIGHT = 240;
const NAVBAR_HEIGHT = 56;
const SCROLL_THRESHOLD = PROMO_HEIGHT - NAVBAR_HEIGHT;

const SkeletonBlock = ({ height, className }) => (
  <View className={`rounded-2xl bg-slate-200 ${className}`} style={{ height }} />
);

const RestaurantSkeleton = () => (
  <View className="overflow-hidden rounded-3xl border-2 border-slate-100 bg-white shadow-sm">
    <SkeletonBlock height={176} className="w-full" />
    <View className="p-4 space-y-2">
      <SkeletonBlock height={20} className="w-2/3" />
      <SkeletonBlock height={14} className="w-1/2" />
      <SkeletonBlock height={14} className="w-1/3" />
    </View>
  </View>
);

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [stickyQuery, setStickyQuery] = useState("");
  const [showSticky, setShowSticky] = useState(false);
  const [searchResults, setSearchResults] = useState({ restaurants: [], dishes: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [dietaryFilter, setDietaryFilter] = useState(null);
  const cartCount = useSelector(selectCartItemCount);
  const { data: user } = useSelector(selectUserState);
  const debouncedQuery = useDebounce(query, 400);
  const dropdownRef = useRef(null);
  const topBarPadding = Math.max(insets.top + 8, 34);

  const loadRestaurants = useCallback(async (extraParams = {}) => {
    try {
      const params = { limit: 10, ...extraParams };
      const data = await listRestaurants(params);
      setRestaurants(data);
      setLoadError("");
    } catch {
      setLoadError("Could not load restaurants. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = { limit: 10 };
      if (vegOnly) params.vegOnly = "true";
      if (dietaryFilter) params.dietary = dietaryFilter;
      const data = await listRestaurants(params);
      setRestaurants(data);
    } catch {
      // silent on refresh
    } finally {
      setRefreshing(false);
    }
  }, [vegOnly, dietaryFilter]);


  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults({ restaurants: [], dishes: [] });
      setShowDropdown(false);
      return;
    }
    (async () => {
      setSearchLoading(true);
      try {
        const data = await searchRestaurantsAndDishes(debouncedQuery);
        setSearchResults(data);
        setShowDropdown(true);
      } catch {
        setSearchResults({ restaurants: [], dishes: [] });
      } finally {
        setSearchLoading(false);
      }
    })();
  }, [debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setSearchResults({ restaurants: [], dishes: [] });
    setShowDropdown(false);
  }, []);

  const handleDishPress = useCallback((dish) => {
    navigation.navigate("DishScreen", { dishId: dish.id, dishName: dish.name, restaurantId: dish.restaurantId });
    clearSearch();
  }, [navigation, clearSearch]);

  const handleRestaurantPress = useCallback((restaurant) => {
    navigation.navigate("RestaurantMenu", { restaurantId: restaurant.id, restaurantName: restaurant.name });
    clearSearch();
  }, [navigation, clearSearch]);

  const handleScroll = useCallback((e) => {
    const y = e.nativeEvent.contentOffset.y;
    setShowSticky(y > SCROLL_THRESHOLD);
    if (y > 10) setShowDropdown(false);
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const hasDropdownResults = searchResults.restaurants?.length > 0 || searchResults.dishes?.length > 0;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" colors={["#4f46e5"]} />
        }
      >
      <View>
        <DishPromoCarousel navigation={navigation} />

      <View className="px-4 pt-3 pb-1 z-50">
        <View ref={dropdownRef} className="relative">
          <View className="flex-row items-center bg-white rounded-xl border-2 border-[#ff6b5f] px-4 h-14">
            {searchLoading ? (
              <ActivityIndicator size="small" color="#ff6b5f" />
            ) : (
              <Search size={20} color="#ff6b5f" />
            )}
            <TextInput
              className="flex-1 ml-3 text-[15px] font-semibold text-slate-900"
              placeholder="Search"
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={(t) => { setQuery(t); setShowDropdown(true); }}
              onFocus={() => { if (hasDropdownResults) setShowDropdown(true); }}
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity onPress={clearSearch} className="p-1">
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {showDropdown && hasDropdownResults && (
            <View className="absolute left-0 right-0 top-full mt-1 rounded-2xl bg-white border border-slate-100 shadow-2xl shadow-indigo-950/20 max-h-80 z-[100]">
              <ScrollView className="max-h-80" keyboardShouldPersistTaps="handled">
                {searchResults.dishes?.length > 0 && (
                  <View>
                    <View className="border-b border-slate-100 bg-indigo-50 px-4 py-2">
                      <Text className="text-xs font-bold uppercase tracking-wider text-indigo-600">Dishes</Text>
                    </View>
                    {searchResults.dishes.map((dish) => (
                      <TouchableOpacity
                        key={`d-${dish.id}`}
                        onPress={() => handleDishPress(dish)}
                        className="flex-row items-center gap-3 border-b border-slate-50 px-4 py-3"
                      >
                        <View className="h-12 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                          {dish.imageUrl ? (
                            <OptimizedImage source={{ uri: dish.imageUrl }} className="h-full w-full" resizeMode="cover" />
                          ) : (
                            <Utensils size={16} color={colors.slate[500]} />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-extrabold text-slate-900" numberOfLines={1}>{dish.name}</Text>
                          <Text className="text-xs font-medium text-slate-500">
                            {dish.restaurantName}
                            {dish.price > 0 && <Text className="ml-2 font-bold text-indigo-600">  {"\u20b9"}{Math.floor(dish.price)}</Text>}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {searchResults.restaurants?.length > 0 && (
                  <View className={searchResults.dishes?.length > 0 ? "border-t border-slate-100" : ""}>
                    <View className="border-b border-slate-100 bg-slate-50 px-4 py-2">
                      <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Restaurants</Text>
                    </View>
                    {searchResults.restaurants.map((r) => (
                      <TouchableOpacity
                        key={`r-${r.id}`}
                        onPress={() => handleRestaurantPress(r)}
                        className="flex-row items-center gap-3 border-b border-slate-50 px-4 py-3"
                      >
                        <View className="h-12 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                          {r.imageUrl ? (
                    <OptimizedImage source={{ uri: r.imageUrl }} className="h-full w-full" resizeMode="cover" />
                          ) : (
                            <MapPin size={16} color={colors.slate[500]} />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-extrabold text-slate-900" numberOfLines={1}>{r.name}</Text>
                          <Text className="text-xs font-medium text-slate-500">
                            {[r.cuisine, r.city].filter(Boolean).join(" - ")}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

<TouchableOpacity
        onPress={() => navigation.navigate("Citywise")}
        activeOpacity={0.9}
        className="mx-4 mt-3 flex-row items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3 shadow-lg shadow-indigo-200">
        <View className="flex-row items-center gap-2">
          <MapPin size={18} color="#fff" />
          <View>
            <Text className="text-sm font-extrabold text-white">We Deliver Here</Text>
            <Text className="text-[10px] font-semibold text-indigo-100">Tap to browse by city</Text>
          </View>
        </View>
        <Text className="text-xs font-bold text-white">View Cities -></Text>
      </TouchableOpacity>

      <View className="py-3 border-b border-indigo-100">
        <View className="px-4 mb-2">
          <Text className="text-base font-bold text-indigo-700">
            Eat what you love
          </Text>
          <Text className="text-xs font-semibold text-indigo-400">
            Categories
          </Text>
        </View>
<ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4"
          contentContainerStyle={{ gap: 12 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              onPress={() => navigation.navigate("DishScreen", { dishName: cat.name })}
              className="items-center min-w-[65px]">
              <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 shadow-md">
                <OptimizedImage
                  source={{ uri: cat.image }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="mt-1 text-[9px] font-bold text-indigo-700">
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => navigation.navigate("DishesListing")}
            className="items-center min-w-[65px]">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-indigo-200 shadow-md">
              <Text className="text-[10px] font-black text-indigo-900 text-center">See All</Text>
            </View>
            <Text className="mt-1 text-[9px] font-bold text-indigo-700">All Dishes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {restaurants.length > 0 && <PopularDishesSection restaurants={restaurants} navigation={navigation} />}

      {/* Dietary Filters */}
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-indigo-100">
        <TouchableOpacity
          onPress={() => {
            setVegOnly(!vegOnly);
            loadRestaurants({ limit: 10, vegOnly: !vegOnly ? "true" : undefined, dietary: !vegOnly ? dietaryFilter : undefined });
          }}
          className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border-2 ${
            vegOnly ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white"
          }`}
        >
          {vegOnly ? <Leaf size={14} color="#059669" /> : <Leaf size={14} color={colors.slate[400]} />}
          <Text className={`text-xs font-bold ${vegOnly ? "text-emerald-700" : "text-slate-500"}`}>
            Veg Only
          </Text>
        </TouchableOpacity>

        {["Vegetarian", "Vegan", "Gluten-Free"].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => {
              const next = dietaryFilter === d ? null : d;
              setDietaryFilter(next);
              loadRestaurants({ limit: 10, vegOnly: vegOnly ? "true" : undefined, dietary: next || undefined });
            }}
            className={`rounded-full px-3 py-1.5 border-2 ${
              dietaryFilter === d ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"
            }`}
          >
            <Text className={`text-xs font-bold ${dietaryFilter === d ? "text-indigo-700" : "text-slate-500"}`}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="py-4">
        <View className="px-4 mb-3">
          <Text className="text-base font-bold text-indigo-700">
            Nearby Restaurants
          </Text>
          <Text className="text-xs font-semibold text-indigo-400">
            Fast delivery
          </Text>
        </View>
        <View className="space-y-3 px-4">
          {loadError ? (
            <View className="mx-4 mb-3 bg-rose-50 rounded-2xl px-4 py-3 border-l-4 border-rose-400">
              <Text className="text-sm text-rose-700">{loadError}</Text>
            </View>
          ) : null}
          {loading ? (
            <View className="space-y-3">
              <RestaurantSkeleton />
              <RestaurantSkeleton />
              <RestaurantSkeleton />
            </View>
          ) : restaurants.length === 0 ? (
            <View className="rounded-xl bg-slate-100 p-4">
              <Text className="text-sm text-slate-500">
                No nearby restaurants
              </Text>
            </View>
          ) : (
            restaurants.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => navigation.navigate("RestaurantMenu", { restaurantId: r.id, restaurantName: r.name })}
                activeOpacity={0.9}
                className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-md"
              >
                <View className="relative h-44 w-full bg-slate-100">
                  {r.imageUrl ? (
                            <OptimizedImage source={{ uri: r.imageUrl }} className="h-full w-full" resizeMode="cover" />
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
                    {[r.cuisine, r.location || r.city].filter(Boolean).join(" - ")}
                  </Text>
                  <View className="mt-3 flex-row flex-wrap items-center gap-x-4 gap-y-2">
                    <View className="flex-row items-center gap-1">
                      <Clock3 size={16} color={colors.brand[700]} />
                      <Text className="text-xs font-extrabold text-slate-700">{r.deliveryTime || ""}</Text>
                    </View>
                    {r.distance ? (
                      <Text className="text-xs font-extrabold text-slate-500">{r.distance}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </View>
    </ScrollView>

      {!showSticky ? (
      <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-4 pb-1" style={{ paddingTop: topBarPadding }}>
        <View className="flex-row items-center gap-2 shrink">
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} className="shrink-0">
              <OptimizedImage source={{ uri: dodagologo }} className="h-8 w-8 rounded-xl" resizeMode="cover" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 flex-row items-center gap-2 rounded-2xl bg-white/90 px-3 py-1.5">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-indigo-100">
            <MapPin size={12} color={colors.brand[800]} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Deliver to</Text>
            <Text className="text-xs font-extrabold text-slate-950 truncate">
              {user?.address || "Home"}
            </Text>
          </View>
        </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-1.5">
        <TouchableOpacity onPress={() => navigation.navigate("CustomerChat")} className="h-10 w-10 items-center justify-center rounded-2xl bg-indigo-950/80">
          <MessageCircle size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Cart")} className="relative h-10 w-10 items-center justify-center rounded-2xl bg-indigo-950/80">
          <ShoppingCart size={20} color="#fff" />
          {cartCount > 0 ? (
            <View className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5">
              <Text className="text-[10px] font-black text-white text-center">{cartCount > 99 ? "99+" : cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Profile")} className="h-10 w-10 items-center justify-center rounded-2xl bg-indigo-950/80">
          <User size={20} color="#fff" />
        </TouchableOpacity>
        </View>
      </View>
      ) : (
      <View className="absolute top-0 left-0 right-0 flex-row items-center gap-2 px-4 pb-1 bg-white border-b border-slate-200" style={{ paddingTop: topBarPadding }}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} className="shrink-0">
          <OptimizedImage source={{ uri: dodagologo }} className="h-8 w-8 rounded-xl" resizeMode="cover" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center bg-white rounded-xl border-2 border-[#ff6b5f] px-3 h-10">
          <Search size={16} color="#ff6b5f" />
          <TextInput
            className="flex-1 ml-2 text-[13px] font-semibold text-slate-900"
            placeholder="Search"
            placeholderTextColor="#94a3b8"
            value={stickyQuery}
            onChangeText={setStickyQuery}
            onSubmitEditing={() => navigation.navigate("Search", { query: stickyQuery })}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Cart")} className="h-9 w-9 items-center justify-center rounded-full bg-[#ff6b5f]">
          <ShoppingCart size={16} color="#fff" />
          {cartCount > 0 ? (
            <View className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5">
              <Text className="text-[10px] font-black text-white text-center">{cartCount > 99 ? "99+" : cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
      )}
    </View>
  );
}

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Star, Clock3, IndianRupee, MapPin, ChevronLeft, Plus, Minus, Heart } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../../constants/colors";
import { getRestaurantById, listMenuItems } from "../../services/foodService";
import { addItem, updateQuantity } from "../../store/slices/cartSlice";
import { addFavorite, removeFavorite, checkIsFavorite } from "../../services/favoriteService";
import { getShareUrl, getShareText } from "../../utils/share";
import ShareButton from "../../components/ShareButton";

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;

export default function RestaurantMenuScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { restaurantId, restaurantName } = route.params || {};
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});
  const cartItems = useSelector((state) => state.cart.items);
  const [message, setMessage] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const restData = await getRestaurantById(restaurantId);
        setRestaurant(restData);
      } catch {
        setMessage("Could not load restaurant details");
      }
      try {
        const items = await listMenuItems(restaurantId);
        setMenuItems(items);
      } catch {
        setMessage("Could not load menu items");
      }
      setLoading(false);
    })();
  }, [restaurantId]);

  useEffect(() => {
    (async () => {
      const data = await checkIsFavorite(restaurantId);
      setIsFavorited(!!data.isFavorite);
      if (data.id) setFavoriteId(data.id);
    })();
  }, [restaurantId]);

  const toggleFavorite = async () => {
    if (isFavorited) {
      if (favoriteId) await removeFavorite(favoriteId);
      setIsFavorited(false);
      setFavoriteId(null);
    } else {
      const result = await addFavorite(restaurantId);
      setIsFavorited(true);
      if (result?.id) setFavoriteId(result.id);
    }
  };

  const cartMap = {};
  cartItems.forEach((item) => {
    cartMap[item.menuItemId] = item;
  });

  const getCartQuantity = (itemId) => cartMap[itemId]?.quantity || 0;

  const handleAdd = (item) => {
    dispatch(addItem({
      menuItemId: item.id,
      restaurantId,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
    }));
  };

  const handleUpdateQty = (item, quantity) => {
    if (quantity <= 0) {
      dispatch(updateQuantity({ menuItemId: item.id, restaurantId, quantity: 0 }));
    } else {
      dispatch(addItem({ menuItemId: item.id, restaurantId, quantity }));
    }
  };

  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const restaurantOpen = restaurant?.isOpen !== false;

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {message ? (
          <View className="mx-4 mt-14 rounded-xl bg-emerald-50 px-4 py-3">
            <Text className="text-sm text-emerald-700">{message}</Text>
          </View>
        ) : null}

        {/* Hero Image */}
        <View className="relative h-56 w-full">
          {restaurant?.imageUrl ? (
            <Image source={{ uri: restaurant.imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-indigo-100">
              <Text className="text-6xl font-black text-indigo-600">{restaurant?.name?.[0] || "R"}</Text>
            </View>
          )}
          <View className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </View>

        {/* Restaurant Info Card */}
        <View className="relative z-10 mx-4 -mt-10 rounded-3xl bg-white p-5 shadow-xl">
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-black tracking-tight text-slate-950">{restaurant?.name || restaurantName}</Text>
              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                <Text className="text-sm font-bold text-slate-700">{restaurant?.cuisine || "Fresh meals"}</Text>
                <View className="h-1 w-1 rounded-full bg-slate-300" />
                <View className="flex-row items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1">
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text className="text-xs font-black text-amber-700">{restaurant?.rating || "4.4"}</Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <TouchableOpacity
                onPress={toggleFavorite}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
              >
                <Heart
                  size={20}
                  color={isFavorited ? colors.rose[500] : colors.slate[500]}
                  fill={isFavorited ? colors.rose[500] : "transparent"}
                />
              </TouchableOpacity>
              <ShareButton
                url={getShareUrl.restaurant(restaurantId)}
                text={getShareText.restaurant(restaurant?.name || restaurantName)}
                iconSize={20}
                className="h-10 w-10 bg-slate-100"
              />
            </View>
          </View>

          <View className="mt-3 flex-row items-start gap-2">
            <MapPin size={16} color={colors.slate[400]} style={{ marginTop: 2 }} />
            <Text className="text-sm font-medium text-slate-500 flex-1">
              {restaurant?.location || restaurant?.city || "Near you"}
            </Text>
          </View>

          <View className="mt-4 flex-row flex-wrap items-center gap-3">
            <View className={`rounded-full px-3 py-1.5 ${restaurantOpen ? "bg-emerald-100" : "bg-slate-100"}`}>
              <Text className={`text-xs font-black ${restaurantOpen ? "text-emerald-700" : "text-slate-600"}`}>
                {restaurantOpen ? "Open" : "Closed"}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock3 size={16} color={colors.brand[700]} />
              <Text className="text-xs font-extrabold text-slate-500">
                {restaurant?.openingTime || "25"} - {restaurant?.closingTime || "35 min"}
              </Text>
            </View>
          </View>

          {restaurant?.description ? (
            <Text className="mt-4 text-sm leading-6 text-slate-600">{restaurant.description}</Text>
          ) : null}
        </View>

        {/* Menu Section Header */}
        <View className="mt-7 px-4">
          <Text className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#ff6b5f]">Menu</Text>
          <Text className="mt-1 text-2xl font-black text-slate-950">Recommended for you</Text>
        </View>

        {/* Menu Items */}
        <View className="mt-4 px-4 pb-24 space-y-4">
          {menuItems.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-sm text-slate-500">No menu items available</Text>
            </View>
          ) : (
            menuItems.map((item) => {
              const qty = getCartQuantity(item.id);
              const hasSizes = item.sizes && item.sizes.length > 0;
              const selectedSize = hasSizes ? (selectedSizes[item.id] || item.sizes[0].size) : null;
              const displayPrice = hasSizes && selectedSize
                ? Number(item.sizes.find((s) => s.size === selectedSize)?.price || item.price)
                : Number(item.price);

              return (
                <View key={item.id} className="flex-row gap-4 rounded-3xl bg-white p-4 shadow-sm">
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <View className={`h-2.5 w-2.5 rounded-sm ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                      <Text className="text-base font-black text-slate-950" numberOfLines={1}>{item.name}</Text>
                    </View>
                    <Text className="mt-1 text-sm font-extrabold text-slate-900">{formatCurrency(displayPrice)}</Text>
                    <View className="mt-1 flex-row items-center gap-2">
                      {hasSizes ? (
                        <View className="flex-row gap-1">
                          {item.sizes.map((s) => (
                            <TouchableOpacity
                              key={s.size}
                              onPress={() => setSelectedSizes((prev) => ({ ...prev, [item.id]: s.size }))}
                              className={`rounded-full px-2 py-0.5 border ${
                                selectedSize === s.size
                                  ? "bg-indigo-600 border-indigo-600"
                                  : "bg-white border-indigo-200"
                              }`}
                            >
                              <Text className={`text-[10px] font-bold ${selectedSize === s.size ? "text-white" : "text-indigo-600"}`}>
                                {s.size}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}
                      <Text className="text-xs font-bold uppercase tracking-wide text-indigo-700">{item.category || "Special"}</Text>
                    </View>
                    <Text className="mt-2 text-sm leading-6 text-slate-500" numberOfLines={2}>
                      {item.description || "Freshly prepared and packed with care."}
                    </Text>
                  </View>

                  <View className="relative h-28 w-28 shrink-0">
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} className="h-full w-full rounded-2xl" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full rounded-2xl bg-indigo-100 items-center justify-center">
                        <Text className="text-2xl font-black text-indigo-600">{item.name?.[0]}</Text>
                      </View>
                    )}
                    {!qty ? (
                      <TouchableOpacity
                        onPress={() => handleAdd(item)}
                        className="absolute -bottom-3 self-center rounded-full bg-white px-5 py-2 shadow-lg"
                      >
                        <Text className="text-xs font-black text-indigo-700">Add</Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="absolute -bottom-3 self-center flex-row items-center gap-2 rounded-full bg-indigo-700 px-2 py-1.5 shadow-lg">
                        <TouchableOpacity
                          onPress={() => handleUpdateQty(item, qty - 1)}
                          className="rounded-full p-0.5"
                        >
                          <Minus size={16} color="#fff" />
                        </TouchableOpacity>
                        <Text className="min-w-5 text-center text-sm font-black text-white">{qty}</Text>
                        <TouchableOpacity
                          onPress={() => handleUpdateQty(item, qty + 1)}
                          className="rounded-full p-0.5"
                        >
                          <Plus size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Cart Summary Bar */}
      {cartItemCount > 0 ? (
        <View className="absolute bottom-0 left-0 right-0 mx-4 mb-4 rounded-t-3xl rounded-b-2xl bg-white p-4 shadow-xl">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold text-slate-500">Cart total</Text>
              <Text className="text-xl font-black text-slate-950">{formatCurrency(cartTotal)}</Text>
            </View>
            <Text className="text-sm font-bold text-slate-500">{cartItemCount} items</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Cart")}
            className="w-full rounded-2xl bg-indigo-700 py-3"
          >
            <Text className="text-center text-sm font-black text-white">Checkout</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

import { selectUserState, selectCurrentUser, selectIsLoggedIn } from "../../store/selectors";
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from "react-native";
import OptimizedImage from "../../components/OptimizedImage";
import PremiumSkeleton from "../../components/PremiumSkeleton";
import {
  Star, Clock3, IndianRupee, MapPin, ChevronLeft, Plus, Minus, Heart, ShoppingBag,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { ACTION_BAR_BOTTOM_PADDING, MIN_DEVICE_NAV_GAP } from "../../constants/layout";
import { getRestaurantById, listMenuItems } from "../../services/foodService";
import { getRestaurantReviews, saveReview } from "../../services/reviewService";
import { getAppConfig } from "../../services/configService";
import { addItem, updateQuantity, removeItem } from "../../store/slices/cartSlice";
import { addFavorite, removeFavorite, checkIsFavorite } from "../../services/favoriteService";
import { getShareUrl, getShareText } from "../../utils/share";
import ShareButton from "../../components/ShareButton";
import { getRestaurantHoursStatus } from "../../utils/restaurantHours";

const formatCurrency = (value) => `\u20B9${Number(value || 0).toFixed(0)}`;

function Skeleton({ className }) {
  return (
    <PremiumSkeleton className={`rounded-2xl bg-slate-200 ${className || ""}`} />
  );
}

function SkeletonRow() {
  return (
    <View className="flex-row gap-4">
      <View className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </View>
      <Skeleton className="h-28 w-28" />
    </View>
  );
}

function Stars({ rating, onSelect }) {
  return (
    <View className="flex-row items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < rating;
        return (
          <TouchableOpacity
            key={index}
            onPress={onSelect ? () => onSelect(index + 1) : undefined}
            disabled={!onSelect}
          >
            <Star
              size={16}
              color="#f59e0b"
              fill={filled ? "#f59e0b" : "transparent"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function RestaurantMenuScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const cartBarBottom = Math.max(insets.bottom + MIN_DEVICE_NAV_GAP, 28);
  const dispatch = useDispatch();
  const { restaurantId, restaurantName } = route.params || {};
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedSideDishes, setSelectedSideDishes] = useState({});
  const cartItems = useSelector((state) => state.cart.items);
  const currentUser = useSelector(selectCurrentUser);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [savingReview, setSavingReview] = useState(false);
  const [pricing, setPricing] = useState(null);
  const hoursStatus = getRestaurantHoursStatus(restaurant);
  const restaurantOpen = restaurant?.isOpen !== false;
  const customerCanOrder = Boolean(restaurant) && restaurantOpen && hoursStatus.isWithinHours !== false;

  useEffect(() => {
    (async () => {
      if (!restaurantId) {
        setError("Restaurant not found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      const [restaurantResult, menuResult, reviewsResult, configResult] = await Promise.allSettled([
        getRestaurantById(restaurantId),
        listMenuItems(restaurantId),
        getRestaurantReviews(restaurantId),
        getAppConfig(),
      ]);

      if (restaurantResult.status === "fulfilled") {
        setRestaurant(restaurantResult.value);
        if (Array.isArray(restaurantResult.value?.menuItems) && restaurantResult.value.menuItems.length) {
          setMenuItems(restaurantResult.value.menuItems);
        }
      }
      if (menuResult.status === "fulfilled" && menuResult.value.length) {
        setMenuItems(menuResult.value);
      }
      if (reviewsResult.status === "fulfilled") {
        const reviewData = Array.isArray(reviewsResult.value) ? reviewsResult.value : [];
        setReviews(reviewData);
        const myReview = reviewData.find((r) => r.user?.id === currentUser?.id);
        if (myReview) {
          setReviewForm({ rating: myReview.rating, comment: myReview.comment || "" });
        }
      }
      if (configResult.status === "fulfilled") {
        setPricing(configResult.value?.pricing || null);
      }
      if (restaurantResult.status === "rejected" && menuResult.status === "rejected") {
        setError("Could not load restaurant details");
      }
      setLoading(false);
    })();
  }, [restaurantId, currentUser?.id]);

  useEffect(() => {
    (async () => {
      try {
        const data = await checkIsFavorite(restaurantId);
        setIsFavorited(!!data.isFavorite);
      } catch (err) {
        setError(err.message || "Could not load favorite status");
      }
    })();
  }, [restaurantId]);

  const toggleFavorite = async () => {
    setError("");
    try {
      if (isFavorited) {
        await removeFavorite(restaurantId);
        setIsFavorited(false);
      } else {
        const result = await addFavorite(restaurantId);
        setIsFavorited(true);
      }
    } catch (err) {
      setError(err.message || "Could not update favorite. Please try again.");
    }
  };

  const makeCartKey = (item) => {
    const size = item.sizes?.length > 0 ? (selectedSizes[item.id] || item.sizes[0].size) : null;
    const sides = selectedSideDishes[item.id] || [];
    const sideDishKey = sides.map((s) => s.name).sort().join(",");
    return `${item.id}|${restaurantId}|${size || ""}|${sideDishKey}`;
  };

  const cartMap = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      if (item.itemKey) map[item.itemKey] = item;
    });
    return map;
  }, [cartItems]);

  const getCartQuantity = (item) => cartMap[makeCartKey(item)]?.quantity || 0;

  const handleAdd = (item) => {
    if (!customerCanOrder) {
      setError("Restaurant is not accepting orders right now.");
      return;
    }
    const size = item.sizes?.length > 0 ? (selectedSizes[item.id] || item.sizes[0].size) : null;
    const basePrice = size
      ? Number(item.sizes.find((s) => s.size === size)?.price || item.price)
      : Number(item.price);
    const sides = selectedSideDishes[item.id] || [];
    dispatch(addItem({
      menuItemId: item.id,
      restaurantId,
      name: item.name,
      price: basePrice,
      quantity: 1,
      imageUrl: item.imageUrl,
      size,
      selectedSideDishes: sides,
      notes: "",
    }));
  };

  const handleUpdateQty = (item, delta) => {
    if (!customerCanOrder && delta > 0) {
      setError("Restaurant is not accepting orders right now.");
      return;
    }
    const itemKey = makeCartKey(item);
    const existing = cartItems.find((ci) => ci.itemKey === itemKey);
    if (!existing && delta > 0) {
      handleAdd(item);
      return;
    }
    const newQty = (existing?.quantity || 0) + delta;
    if (newQty <= 0) {
      dispatch(removeItem({ itemKey: existing.itemKey }));
    } else {
      dispatch(updateQuantity({ itemKey: existing.itemKey, quantity: newQty }));
    }
  };

  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => {
    const sideTotal = (i.selectedSideDishes || []).reduce((s, sd) => s + Number(sd.price), 0);
    return sum + (i.price + sideTotal) * i.quantity;
  }, 0);
  const foodTax = cartTotal * Number(pricing?.foodGstRate || 0);
  const packagingFeeBase = cartTotal * Number(pricing?.packagingPercent || 0);
  const packagingTax = packagingFeeBase * Number(pricing?.foodGstRate || 0);
  const platformFee = Number(pricing?.platformFee || 0);
  const taxes = foodTax + packagingTax;
  const cartPreviewTotal = cartTotal + packagingFeeBase + packagingTax + platformFee + foodTax;
  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: cartItemCount > 0 ? ACTION_BAR_BOTTOM_PADDING : 32 }}>
          <Skeleton className="h-56 w-full rounded-none" />
          <View className="mx-4 -mt-10 rounded-3xl bg-white p-5 shadow-xl">
            <Skeleton className="h-8 w-2/3" />
            <View className="mt-3 flex-row gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </View>
            <Skeleton className="mt-4 h-4 w-1/2" />
          </View>
          <View className="mt-7 px-4">
            <Skeleton className="mb-4 h-5 w-32" />
            <View className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: cartItemCount > 0 ? ACTION_BAR_BOTTOM_PADDING : 32 }}>
        {message ? (
          <View className="mx-4 mt-14 rounded-xl bg-emerald-50 px-4 py-3">
            <Text className="text-sm text-emerald-700">{message}</Text>
          </View>
        ) : null}
        {error ? (
          <View className="mx-4 mt-14 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {/* Hero Image */}
        <View className="relative h-56 w-full">
          {restaurant?.imageUrl ? (
            <OptimizedImage source={{ uri: restaurant.imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-indigo-100">
              <Text className="text-6xl font-black text-indigo-600">{restaurant?.name?.[0] || "R"}</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />
        </View>

        {/* Restaurant Info Card */}
        <View className="relative z-10 mx-4 -mt-10 rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-slate-300/60">
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-black tracking-tight text-slate-950">{restaurant?.name || restaurantName}</Text>
              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                <Text className="text-sm font-bold text-slate-700">{restaurant?.cuisine || ""}</Text>
                <View className="h-1 w-1 rounded-full bg-slate-300" />
                <View className="flex-row items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1">
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text className="text-xs font-black text-amber-700">{averageRating || restaurant?.rating || ""}</Text>
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
              {restaurant?.location || restaurant?.city || ""}
            </Text>
          </View>

          <View className="mt-4 flex-row flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <View className={`rounded-full px-3 py-1.5 ${restaurantOpen ? "bg-emerald-100" : "bg-slate-100"}`}>
              <Text className={`text-xs font-black ${restaurantOpen ? "text-emerald-700" : "text-slate-600"}`}>
                {restaurantOpen ? "Open" : "Closed"}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock3 size={16} color={colors.brand[700]} />
              <Text className="text-xs font-extrabold text-slate-500">
                {restaurant?.openingTime && restaurant?.closingTime
                  ? `${restaurant.openingTime} - ${restaurant.closingTime}`
                  : restaurant?.deliveryTime || ""}
              </Text>
            </View>
            {hoursStatus.closingSoon ? (
              <View className="rounded-full bg-amber-100 px-3 py-1.5">
                <Text className="text-xs font-black text-amber-700">Closing soon: {hoursStatus.minutesUntilClose} min left</Text>
              </View>
            ) : null}
            {!customerCanOrder && hoursStatus.hasHours ? (
              <View className="rounded-full bg-rose-50 px-3 py-1.5">
                <Text className="text-xs font-black text-rose-700">Not accepting orders now</Text>
              </View>
            ) : null}
            {reviews.length ? (
              <Text className="text-xs font-bold text-slate-500">{reviews.length} reviews</Text>
            ) : null}
          </View>

          {hoursStatus.closingSoon ? (
            <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Text className="text-sm font-bold text-amber-800">This restaurant is closing soon. Please place your order quickly.</Text>
            </View>
          ) : null}

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
        <View className="mt-4 px-4 pb-4 space-y-4">
          {menuItems.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-sm text-slate-500">No menu items available</Text>
            </View>
          ) : (
            menuItems.map((item) => {
              const qty = getCartQuantity(item);
              const hasSizes = item.sizes && item.sizes.length > 0;
              const selectedSize = hasSizes ? (selectedSizes[item.id] || item.sizes[0].size) : null;
              const displayPrice = hasSizes && selectedSize
                ? Number(item.sizes.find((s) => s.size === selectedSize)?.price || item.price)
                : Number(item.price);

              return (
                <View key={item.id} className="flex-row gap-4 rounded-3xl border border-white bg-white p-4 shadow-lg shadow-slate-200/70">
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
                      {item.description || ""}
                    </Text>

                    {item.sideDishes && item.sideDishes.length > 0 ? (
                      <View className="mt-2 flex-row flex-wrap gap-1.5">
                        {item.sideDishes.map((sd) => {
                          const isSelected = (selectedSideDishes[item.id] || []).some((s) => s.name === sd.name);
                          return (
                            <TouchableOpacity
                              key={sd.name}
                              onPress={() => {
                                const current = selectedSideDishes[item.id] || [];
                                const updated = isSelected
                                  ? current.filter((s) => s.name !== sd.name)
                                  : [...current, sd];
                                setSelectedSideDishes((prev) => ({ ...prev, [item.id]: updated }));
                              }}
                              className={`rounded-full px-2 py-0.5 border ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-600"
                                  : "bg-white border-amber-300"
                              }`}
                            >
                              <Text className={`text-[10px] font-bold ${isSelected ? "text-white" : "text-amber-700"}`}>
                                {sd.name} +{formatCurrency(sd.price)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>

                  <View className="relative h-28 w-28 shrink-0">
                    {item.imageUrl ? (
                      <OptimizedImage source={{ uri: item.imageUrl }} className="h-full w-full rounded-2xl" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full rounded-2xl bg-indigo-100 items-center justify-center">
                        <Text className="text-2xl font-black text-indigo-600">{item.name?.[0]}</Text>
                      </View>
                    )}
                    {!qty ? (
                      <TouchableOpacity
                        onPress={() => handleAdd(item)}
                        disabled={!customerCanOrder}
                        className="absolute -bottom-3 self-center rounded-full border border-indigo-100 bg-white px-5 py-2 shadow-xl shadow-indigo-200/60"
                      >
                        <Text className={`text-xs font-black ${customerCanOrder ? "text-indigo-700" : "text-slate-400"}`}>{customerCanOrder ? "Add" : "Closed"}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="absolute -bottom-3 self-center flex-row items-center gap-2 rounded-full bg-indigo-700 px-2 py-1.5 shadow-xl shadow-indigo-300/60">
                        <TouchableOpacity
                          onPress={() => handleUpdateQty(item, -1)}
                          className="rounded-full p-0.5"
                        >
                          <Minus size={16} color="#fff" />
                        </TouchableOpacity>
                        <Text className="min-w-5 text-center text-sm font-black text-white">{qty}</Text>
                        <TouchableOpacity
                          onPress={() => handleUpdateQty(item, 1)}
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

        {/* Reviews Section */}
        <View className="mx-4 mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-black text-slate-900">Reviews</Text>
              <Text className="mt-1 text-sm text-slate-500">See what customers are saying and leave your own feedback.</Text>
            </View>
            <View className="rounded-2xl bg-amber-50 px-4 py-2">
              <Text className="text-sm font-black text-amber-700">
                {averageRating || "New"} {averageRating ? "/ 5" : "reviews"}
              </Text>
            </View>
          </View>

          <View className="mt-6 rounded-3xl bg-slate-50 p-4">
            <Text className="font-bold text-slate-900">Your review</Text>
            <View className="mt-3">
              <Stars rating={reviewForm.rating} onSelect={(rating) => setReviewForm((prev) => ({ ...prev, rating }))} />
            </View>
            <TextInput
              value={reviewForm.comment}
              onChangeText={(text) => setReviewForm((prev) => ({ ...prev, comment: text }))}
              multiline
              numberOfLines={4}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              placeholder="Share your experience with this restaurant"
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={async () => {
                setSavingReview(true);
                try {
                  const saved = await saveReview({
                    restaurantId,
                    rating: reviewForm.rating,
                    comment: reviewForm.comment,
                  });
                  setReviews((prev) => {
                    const filtered = prev.filter((r) => r.user?.id !== "self");
                    return [...filtered, saved].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                  });
                  setMessage("Review saved successfully.");
                } catch (err) {
                  setError(err.response?.data?.message || err.message || "Failed to save review");
                } finally {
                  setSavingReview(false);
                }
              }}
              disabled={savingReview}
              className="mt-4 w-full rounded-2xl bg-indigo-700 py-3"
            >
              <Text className="text-center text-sm font-black text-white">
                {savingReview ? "Saving..." : "Save Review"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6 space-y-4">
            {reviews.length ? (
              reviews.map((review) => (
                <View key={review.id} className="rounded-3xl border border-slate-100 bg-white p-4">
                  <View className="flex-row items-start justify-between">
                    <View>
                      <Text className="font-black text-slate-900">{review.user?.name || "Customer"}</Text>
                      <Text className="mt-1 text-xs text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    <Stars rating={review.rating} />
                  </View>
                  <Text className="mt-3 text-sm leading-7 text-slate-700">
                    {review.comment || "No written comment added."}
                  </Text>
                  {review.reply ? (
                    <View className="mt-3 rounded-2xl border-l-4 border-indigo-500 bg-indigo-50 p-3">
                      <Text className="text-xs font-black uppercase text-indigo-700">Restaurant response</Text>
                      <Text className="mt-1 text-sm leading-6 text-slate-700">{review.reply}</Text>
                      {review.replyDate ? (
                        <Text className="mt-1 text-[11px] text-slate-500">
                          {new Date(review.replyDate).toLocaleDateString("en-IN")}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <View className="items-center rounded-2xl border border-dashed border-slate-300 px-6 py-10">
                <Text className="text-sm text-slate-500">No reviews yet. Be the first to review this restaurant.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Cart Summary Bar */}
      {cartItemCount > 0 ? (
        <View className="absolute left-0 right-0 mx-4 rounded-3xl border border-white bg-white p-4 shadow-2xl shadow-slate-400/40" style={{ bottom: cartBarBottom }}>
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold text-slate-500">Subtotal before delivery</Text>
              <Text className="text-xl font-black text-slate-950">{formatCurrency(cartPreviewTotal)}</Text>
            </View>
            <Text className="text-sm font-bold text-slate-500">{cartItemCount} items</Text>
          </View>
          <View className="mb-3 flex-row gap-2">
            <Text className="text-[11px] font-bold text-slate-500 flex-1">
              Items {formatCurrency(cartTotal)}
            </Text>
            <Text className="text-[11px] font-bold text-slate-500 flex-1">
              Delivery at checkout
            </Text>
            <Text className="text-[11px] font-bold text-slate-500 flex-1">
              Taxes {formatCurrency(taxes)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Cart")}
            className="w-full rounded-2xl bg-indigo-950 py-3.5 shadow-lg shadow-indigo-300/40"
          >
            <Text className="text-center text-sm font-black text-white">Checkout</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.38)",
  },
});







import { selectUserState, selectCurrentUser, selectIsLoggedIn } from "../../store/selectors";
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  Minus, Plus, Trash2, ChevronLeft,
  ChevronDown, ChevronUp, ShoppingCart,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { updateQuantity, removeItem, updateItemNotes, clearCart } from "../../store/slices/cartSlice";
import { setShowAuthModal, setPendingNavigationRoute } from "../../store/slices/userSlice";
import CouponInput from "../../components/CouponInput";
import { apiRequest } from "../../services/api";
import { getAppConfig } from "../../services/configService";

const formatCurrency = (amount) => `\u20B9${Math.floor(amount)}`;
const getPrice = (price) => (typeof price === "number" ? price : parseInt(String(price).replace(/[^0-9]/g, ""), 10) || 0);

const calculateDeliveryBase = (distanceKm, pricing) => {
  const d = distanceKm || 1;
  const slabs = pricing?.deliverySlabs || [];
  for (const slab of slabs) { if (d <= slab.maxKm) return slab.fee; }
  const last = slabs[slabs.length - 1];
  if (last) return last.fee + Math.ceil(d - last.maxKm) * Number(pricing.deliveryPerKmRate || 0);
  return Number(pricing?.deliveryBaseFee || 0);
};
const toRadians = (v) => (v * Math.PI) / 180;
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const cart = useSelector((state) => state.cart.items);
  const [showTax, setShowTax] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [msg, setMsg] = useState("");
  const [distanceKm, setDistanceKm] = useState(3);
  const [pricingConfig, setPricingConfig] = useState(null);

  useEffect(() => {
    getAppConfig()
      .then((config) => setPricingConfig(config.pricing))
      .catch((err) => Alert.alert("Pricing unavailable", err.message || "Could not load current fees and taxes."));
  }, []);
  useEffect(() => {
    (async () => {
      if (cart.length === 0) return;
      const restaurantId = cart[0]?.restaurantId || cart[0]?.itemKey?.split("|")[1];
      if (!restaurantId) return;
      try {
        const res = await apiRequest(`/api/restaurants/${restaurantId}`);
        const rest = res.data || res.restaurant || res;
        if (rest?.latitude && rest?.longitude) {
          const addrRes = await apiRequest("/api/users/profile");
          const profile = addrRes.data || addrRes.user || addrRes;
          const addr = profile?.defaultAddress || profile?.addresses?.[0];
          if (addr?.latitude && addr?.longitude) {
            const dist = getDistanceKm(addr.latitude, addr.longitude, rest.latitude, rest.longitude);
            setDistanceKm(Math.round(dist * 10) / 10);
          }
        }
      } catch (err) {
        setMsg(err.message || "Could not calculate delivery distance.");
      }
    })();
  }, [cart]);

  const handleApplyCoupon = async (code) => {
    const subtotal = cart.reduce((acc, item) => {
      const baseTotal = getPrice(item.price) * item.quantity;
      const sideTotal = (item.selectedSideDishes || []).reduce((s, sd) => s + Number(sd.price), 0) * item.quantity;
      return acc + baseTotal + sideTotal;
    }, 0);
    const res = await apiRequest("/api/coupons/validate", {
      method: "POST",
      data: {
        code: code.toUpperCase(),
        restaurantId: cart[0]?.restaurantId,
        subtotal,
      },
    });
    const result = res.data || res;
    if (!result.valid) {
      throw new Error(result.message || "Invalid coupon code");
    }
    const coupon = result.coupon;
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = Math.floor((coupon.discountValue / 100) * subtotal);
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else {
      discount = Number(coupon.discountValue);
    }
    setCouponDiscount(discount);
    setMsg(`Coupon applied! You saved ${formatCurrency(discount)}`);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
  };

  const increase = (item) => {
    dispatch(updateQuantity({
      itemKey: item.itemKey,
      quantity: item.quantity + 1,
    }));
  };

  const decrease = (item) => {
    if (item.quantity <= 1) {
      dispatch(removeItem({ itemKey: item.itemKey }));
    } else {
      dispatch(updateQuantity({
        itemKey: item.itemKey,
        quantity: item.quantity - 1,
      }));
    }
  };

  const handleRemoveItem = (item) => {
    dispatch(removeItem({ itemKey: item.itemKey }));
  };

  const pricing = useMemo(() => {
    const itemTotal = cart.reduce((acc, item) => {
      const baseTotal = getPrice(item.price) * item.quantity;
      const sideTotal =
        (item.selectedSideDishes || []).reduce((s, sd) => s + Number(sd.price), 0) * item.quantity;
      return acc + baseTotal + sideTotal;
    }, 0);
    const deliveryBase = calculateDeliveryBase(distanceKm, pricingConfig);
    const deliveryGst = deliveryBase * Number(pricingConfig?.deliveryGstRate || 0);
    const deliveryTotal = deliveryBase + deliveryGst;
    const packagingFeeBase = Math.floor(itemTotal * Number(pricingConfig?.packagingPercent || 0));
    const foodGst = itemTotal * Number(pricingConfig?.foodGstRate || 0);
    const packagingTax = packagingFeeBase * Number(pricingConfig?.foodGstRate || 0);
    const totalTax = foodGst + packagingTax + deliveryGst;
    const grandTotal = itemTotal + foodGst + packagingFeeBase + packagingTax + deliveryTotal + Number(pricingConfig?.platformFee || 0);
    const coupon = Math.min(couponDiscount, grandTotal);
    const finalTotal = grandTotal - coupon;
    return { itemTotal, deliveryBase, deliveryGst, deliveryTotal, packagingFeeBase, packagingTax, foodGst, totalTax, grandTotal, cgst: totalTax / 2, sgst: totalTax / 2, coupon, finalTotal };
  }, [cart, distanceKm, couponDiscount, pricingConfig]);

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center p-4">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-indigo-100"><ShoppingCart size={38} color={colors.brand[600]} /></View>
        <Text className="text-2xl font-bold text-slate-900">Your cart is empty</Text>
        <Text className="mt-2 text-slate-500">Add some delicious items to get started!</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}
          className="mt-6 rounded-2xl bg-indigo-600 px-8 py-3.5">
          <Text className="font-extrabold text-white">Browse Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white shadow-sm pt-14 pb-4">
        <View className="flex-row items-center gap-4 px-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900">Your Cart</Text>
            <Text className="text-sm text-slate-500">{cart.length} items</Text>
          </View>
          <TouchableOpacity onPress={() => dispatch(clearCart())} className="ml-auto h-10 w-10 items-center justify-center rounded-full bg-rose-50">
            <Trash2 size={18} color={colors.red[600]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6 pb-6">
        <View className="space-y-4">
          {cart.map((item) => {
            const sides = item.selectedSideDishes || [];
            const sideTotal = sides.reduce((s, sd) => s + Number(sd.price), 0);
            return (
            <View key={item.itemKey} className="bg-white rounded-3xl p-5 shadow-sm">
              <View className="flex-row items-start gap-3">
                <View className="flex-1 min-w-0">
                  <Text className="font-bold text-slate-900" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-sm text-slate-500">{formatCurrency(getPrice(item.price))} each</Text>
                  {item.size ? (
                    <Text className="text-xs text-indigo-600 font-bold mt-0.5">{item.size}</Text>
                  ) : null}
                  {sides.length > 0 ? (
                    <Text className="text-xs text-amber-700 mt-0.5">
                      + {sides.map((s) => s.name).join(", ")} ({formatCurrency(sideTotal)})
                    </Text>
                  ) : null}
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={() => decrease(item)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <Minus size={16} color={colors.slate[500]} />
                  </TouchableOpacity>
                  <Text className="w-8 text-center font-bold text-slate-900">{item.quantity}</Text>
                  <TouchableOpacity onPress={() => increase(item)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <Plus size={16} color={colors.brand[600]} />
                  </TouchableOpacity>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-slate-900">{formatCurrency((getPrice(item.price) + sideTotal) * item.quantity)}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item)} className="mt-2">
                    <Trash2 size={14} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                placeholder="Add note for restaurant (extra spicy, no onion, etc.)"
                placeholderTextColor="#94a3b8"
                value={item.notes || ""}
                onChangeText={(text) => dispatch(updateItemNotes({ itemKey: item.itemKey, notes: text }))}
                className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </View>
          );
          })}
        </View>

        <View className="bg-white rounded-3xl p-5 shadow-sm mt-4">
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-600">Item Total</Text>
              <Text className="text-sm font-medium">{formatCurrency(pricing.itemTotal)}</Text>
            </View>
            {pricing.packagingFeeBase > 0 ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-600">Packaging Fee</Text>
                <Text className="text-sm font-medium">{formatCurrency(pricing.packagingFeeBase)}</Text>
              </View>
            ) : null}
            <View className="bg-slate-50 rounded-xl">
              <TouchableOpacity onPress={() => setShowTax(!showTax)}
                className="flex-row items-center justify-between p-3">
                <Text className="text-sm font-bold text-slate-800">Delivery & Tax</Text>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm">{formatCurrency(pricing.deliveryTotal + pricing.foodGst + pricing.packagingTax)}</Text>
                  {showTax ? <ChevronUp size={16} color={colors.slate[900]} /> : <ChevronDown size={16} color={colors.slate[900]} />}
                </View>
              </TouchableOpacity>
              {showTax ? (
                <View className="px-3 pb-3 border-t border-slate-200 pt-2.5 space-y-1.5">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Delivery ({distanceKm.toFixed(1)} km)</Text>
                    <Text className="text-xs">{formatCurrency(pricing.deliveryBase)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Food GST (5%)</Text>
                    <Text className="text-xs">{formatCurrency(pricing.foodGst + pricing.packagingTax)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Delivery GST (18%)</Text>
                    <Text className="text-xs">{formatCurrency(pricing.deliveryGst)}</Text>
                  </View>
                  <View className="border-t border-slate-200 pt-1.5 mt-1.5 flex-row justify-between">
                    <Text className="text-xs font-medium text-slate-600">CGST (50%)</Text>
                    <Text className="text-xs font-medium text-slate-600">{formatCurrency(pricing.cgst)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-medium text-slate-600">SGST (50%)</Text>
                    <Text className="text-xs font-medium text-slate-600">{formatCurrency(pricing.sgst)}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            <CouponInput onApply={handleApplyCoupon} currentDiscount={pricing.coupon} onRemove={handleRemoveCoupon} />

            {pricing.coupon > 0 ? (
              <View className="flex-row justify-between pt-2">
                <Text className="text-sm text-emerald-600">Coupon Discount</Text>
                <Text className="text-sm font-medium text-emerald-600">-{formatCurrency(pricing.coupon)}</Text>
              </View>
            ) : null}

            <View className="border-t-2 border-indigo-600 pt-3">
              <View className="flex-row justify-between">
                <Text className="text-base font-bold text-slate-900">Grand Total</Text>
                <Text className="text-lg font-extrabold text-indigo-700">{formatCurrency(pricing.finalTotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        {msg ? (
          <View className="rounded-xl bg-emerald-50 p-3 mt-4">
            <Text className="text-sm font-medium text-emerald-700 text-center">{msg}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="border-t border-slate-200 bg-white px-4 pt-4 pb-8">
        <TouchableOpacity onPress={() => {
          if (!isLoggedIn) {
            dispatch(setPendingNavigationRoute("Checkout"));
            dispatch(setShowAuthModal(true));
            return;
          }
          navigation.navigate("Checkout");
        }}
          className="rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200"
        >
          <Text className="text-base font-extrabold text-white text-center">
            Proceed to Checkout - {formatCurrency(pricing.finalTotal)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}



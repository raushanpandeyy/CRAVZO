import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  Minus, Plus, Trash2, ChevronLeft,
  ChevronDown, ChevronUp, Tag,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { updateQuantity, removeItem, clearCart } from "../../store/slices/cartSlice";
import CouponInput from "../../components/CouponInput";

const FOOD_GST_RATE = 0.05;
const DELIVERY_GST_RATE = 0.18;
const PLATFORM_FEE = 0;
const PACKAGING_PERCENT = 0.01;

const DELIVERY_SLABS = [
  { maxKm: 1, fee: 17 },
  { maxKm: 2, fee: 23 },
  { maxKm: 3, fee: 30 },
  { maxKm: 4, fee: 35 },
];

const VALID_COUPONS = { DODAGO10: 10, SAVE20: 20, FIRST50: 50 };

const formatCurrency = (amount) => `\u20B9${Math.floor(amount)}`;
const getPrice = (price) => (typeof price === "number" ? price : parseInt(String(price).replace(/[^0-9]/g, ""), 10) || 0);

const calculateDeliveryBase = (distanceKm) => {
  const d = distanceKm || 1;
  for (const slab of DELIVERY_SLABS) { if (d <= slab.maxKm) return slab.fee; }
  const last = DELIVERY_SLABS[DELIVERY_SLABS.length - 1];
  return last.fee + Math.ceil(d - last.maxKm) * 10;
};

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);
  const [showTax, setShowTax] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [msg, setMsg] = useState("");
  const distanceKm = 3;

  const handleApplyCoupon = async (code) => {
    if (VALID_COUPONS[code]) {
      setCouponDiscount(VALID_COUPONS[code]);
      setMsg("Coupon applied!");
      setTimeout(() => setMsg(""), 3000);
    } else {
      throw new Error("Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
  };

  const increase = (item) => {
    dispatch(updateQuantity({
      menuItemId: item.menuItemId,
      restaurantId: item.restaurantId,
      quantity: item.quantity + 1,
    }));
  };

  const decrease = (item) => {
    if (item.quantity <= 1) {
      dispatch(removeItem({ menuItemId: item.menuItemId, restaurantId: item.restaurantId }));
    } else {
      dispatch(updateQuantity({
        menuItemId: item.menuItemId,
        restaurantId: item.restaurantId,
        quantity: item.quantity - 1,
      }));
    }
  };

  const handleRemoveItem = (item) => {
    dispatch(removeItem({ menuItemId: item.menuItemId, restaurantId: item.restaurantId }));
  };

  const pricing = useMemo(() => {
    const itemTotal = cart.reduce((acc, item) => acc + getPrice(item.price) * item.quantity, 0);
    const deliveryBase = calculateDeliveryBase(distanceKm);
    const deliveryGst = deliveryBase * DELIVERY_GST_RATE;
    const deliveryTotal = deliveryBase + deliveryGst;
    const packagingFeeBase = Math.floor(itemTotal * PACKAGING_PERCENT);
    const foodGst = itemTotal * FOOD_GST_RATE;
    const packagingTax = packagingFeeBase * FOOD_GST_RATE;
    const totalTax = foodGst + packagingTax + deliveryGst;
    const grandTotal = itemTotal + foodGst + packagingFeeBase + packagingTax + deliveryTotal + PLATFORM_FEE;
    const coupon = Math.min(couponDiscount, grandTotal);
    const finalTotal = grandTotal - coupon;
    return { itemTotal, deliveryBase, deliveryGst, deliveryTotal, packagingFeeBase, packagingTax, foodGst, totalTax, grandTotal, cgst: totalTax / 2, sgst: totalTax / 2, coupon, finalTotal };
  }, [cart, distanceKm, couponDiscount]);

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center p-4">
        <Text className="text-5xl mb-6">🛒</Text>
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
            <Trash2 size={18} color={colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6 pb-6">
        <View className="space-y-4">
          {cart.map((item) => (
            <View key={`${item.menuItemId}-${item.restaurantId}`} className="bg-white rounded-3xl p-5 shadow-sm">
              <View className="flex-row items-start gap-3">
                <View className="flex-1 min-w-0">
                  <Text className="font-bold text-slate-900" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-sm text-slate-500">{formatCurrency(getPrice(item.price))} each</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={() => decrease(item)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <Minus size={16} color={colors.slate[600]} />
                  </TouchableOpacity>
                  <Text className="w-8 text-center font-bold text-slate-900">{item.quantity}</Text>
                  <TouchableOpacity onPress={() => increase(item)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <Plus size={16} color={colors.brand[600]} />
                  </TouchableOpacity>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-slate-900">{formatCurrency(getPrice(item.price) * item.quantity)}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item)} className="mt-2">
                    <Trash2 size={14} color={colors.red[400]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
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
                  {showTax ? <ChevronUp size={16} color={colors.slate[800]} /> : <ChevronDown size={16} color={colors.slate[800]} />}
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
        <TouchableOpacity onPress={() => navigation.navigate("Checkout")}
          className="rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200"
        >
          <Text className="text-base font-extrabold text-white text-center">
            Proceed to Checkout — {formatCurrency(pricing.finalTotal)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

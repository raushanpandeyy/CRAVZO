import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import {
  Minus, Plus, Trash2, Receipt, ChevronLeft,
  ChevronDown, ChevronUp,
} from "lucide-react-native";
import { colors } from "../../constants/colors";

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

const formatCurrency = (amount) => `₹${Math.floor(amount)}`;
const getPrice = (price) => (typeof price === "number" ? price : parseInt(String(price).replace(/[^0-9]/g, ""), 10) || 0);

const calculateDeliveryBase = (distanceKm) => {
  const d = distanceKm || 1;
  for (const slab of DELIVERY_SLABS) {
    if (d <= slab.maxKm) return slab.fee;
  }
  const last = DELIVERY_SLABS[DELIVERY_SLABS.length - 1];
  return last.fee + Math.ceil(d - last.maxKm) * 10;
};

const sampleCart = [
  { id: "1", name: "Butter Chicken", price: 299, quantity: 2, imageUrl: null, notes: "", size: "Full", selectedSideDishes: [] },
  { id: "2", name: "Naan", price: 45, quantity: 4, imageUrl: null, notes: "Extra butter", selectedSideDishes: [] },
];

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState(sampleCart);
  const [showTax, setShowTax] = useState(false);
  const distanceKm = 3;

  const updateCart = (newCart) => {
    setCart(newCart);
  };

  const increase = (id) => {
    updateCart(cart.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)));
  };
  const decrease = (id) => {
    updateCart(
      cart.map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item)).filter((i) => i.quantity > 0)
    );
  };
  const removeItem = (id) => {
    updateCart(cart.filter((item) => item.id !== id));
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
    return { itemTotal, deliveryBase, deliveryGst, deliveryTotal, packagingFeeBase, packagingTax, foodGst, totalTax, grandTotal, cgst: totalTax / 2, sgst: totalTax / 2 };
  }, [cart, distanceKm]);

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center p-4">
        <Text className="text-5xl mb-6">🛒</Text>
        <Text className="text-2xl font-bold text-slate-900">Your cart is empty</Text>
        <Text className="mt-2 text-slate-500">Add some delicious items to get started!</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}
          className="mt-6 rounded-2xl bg-indigo-600 px-8 py-3 shadow-lg shadow-indigo-200">
          <Text className="font-bold text-white">Browse Restaurants</Text>
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
            <Text className="text-sm text-slate-500">Restaurant Name</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6 pb-32">
        <View className="space-y-4">
          {cart.map((item) => (
            <View key={item.id} className="bg-white rounded-3xl p-5 shadow-sm">
              <View className="flex-row items-start gap-3">
                <View className="flex-1 min-w-0">
                  <Text className="font-bold text-slate-900" numberOfLines={1}>
                    {item.name}{item.size ? <Text className="text-indigo-600"> ({item.size})</Text> : null}
                  </Text>
                  <Text className="text-sm text-slate-500">{formatCurrency(getPrice(item.price))} each</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={() => decrease(item.id)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <Minus size={16} color={colors.slate[600]} />
                  </TouchableOpacity>
                  <Text className="w-8 text-center font-bold text-slate-900">{item.quantity}</Text>
                  <TouchableOpacity onPress={() => increase(item.id)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <Plus size={16} color={colors.brand[600]} />
                  </TouchableOpacity>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-slate-900">{formatCurrency(getPrice(item.price) * item.quantity)}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                  <Trash2 size={16} color={colors.rose[500]} />
                </TouchableOpacity>
              </View>
              <View className="mt-3 border-t border-slate-100 pt-3">
                <View className="relative">
                  <TextInput placeholder="Add note for restaurant (extra spicy, no onion, etc.)" defaultValue={item.notes}
                    className="w-full rounded-xl border-2 border-indigo-200 bg-indigo-50/30 px-4 py-2.5 pr-10 text-sm text-slate-700"
                    placeholderTextColor="#94a3b8" />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-6 bg-white rounded-3xl p-6 shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <Receipt size={20} color={colors.brand[600]} />
            <Text className="text-lg font-bold text-slate-900">Price Breakdown</Text>
          </View>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-600">Item Total</Text>
              <Text className="text-sm font-medium">{formatCurrency(pricing.itemTotal)}</Text>
            </View>
            {pricing.packagingFeeBase > 0 ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-600">Packaging</Text>
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
            <View className="border-t-2 border-indigo-600 pt-3">
              <View className="flex-row justify-between">
                <Text className="text-base font-bold text-slate-900">Grand Total</Text>
                <Text className="text-base font-bold">{formatCurrency(pricing.grandTotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("Checkout")}
          className="mt-6 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200">
          <Text className="text-base font-extrabold text-white text-center">
            Proceed to Checkout — {formatCurrency(pricing.grandTotal)}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  MapPin, Plus, CreditCard, Check, X, Tag,
  ChevronDown, ChevronUp, Trash2, ChevronLeft,
} from "lucide-react-native";
import { colors } from "../../constants/colors";

const FOOD_GST_RATE = 0.05;
const DELIVERY_GST_RATE = 0.18;
const PLATFORM_FEE = 0;
const PACKAGING_PERCENT = 0.01;
const DELIVERY_SLABS = [
  { maxKm: 1, fee: 17 }, { maxKm: 2, fee: 23 },
  { maxKm: 3, fee: 30 }, { maxKm: 4, fee: 35 },
];

const formatCurrency = (amount) => `₹${Math.floor(amount)}`;
const getPrice = (price) => (typeof price === "number" ? price : parseInt(String(price).replace(/[^0-9]/g, ""), 10) || 0);

const calculateDeliveryBase = (distanceKm) => {
  const d = distanceKm || 1;
  for (const slab of DELIVERY_SLABS) { if (d <= slab.maxKm) return slab.fee; }
  const last = DELIVERY_SLABS[DELIVERY_SLABS.length - 1];
  return last.fee + Math.ceil(d - last.maxKm) * 10;
};

const sampleCart = [
  { id: "1", name: "Butter Chicken", price: 299, quantity: 2, notes: "", selectedSideDishes: [] },
  { id: "2", name: "Naan", price: 45, quantity: 4, notes: "", selectedSideDishes: [] },
];

const AddressCard = ({ address, isSelected, onSelect }) => {
  const addrText = [address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean).join(", ");
  return (
    <TouchableOpacity onPress={() => onSelect(address.id)}
      className={`w-full rounded-2xl border-2 p-4 ${isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-200"}`}>
      <View className="flex-row items-start gap-4">
        <View className={`h-10 w-10 items-center justify-center rounded-full ${isSelected ? "bg-indigo-600" : "bg-slate-100"}`}>
          <MapPin size={20} color={isSelected ? "#fff" : colors.slate[600]} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-slate-900">{address.label || "Address"}</Text>
            {isSelected ? <View className="h-6 w-6 items-center justify-center rounded-full bg-indigo-600"><Check size={16} color="#fff" /></View> : null}
          </View>
          <Text className="mt-1 text-sm text-slate-600" numberOfLines={2}>{addrText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PaymentOption = ({ icon: Icon, title, subtitle, isSelected, onSelect, badge }) => (
  <TouchableOpacity onPress={onSelect}
    className={`flex-row items-center gap-4 rounded-2xl border-2 p-4 ${isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-200"}`}>
    <View className={`h-12 w-12 items-center justify-center rounded-xl ${isSelected ? "bg-indigo-600" : "bg-slate-100"}`}>
      <Icon size={24} color={isSelected ? "#fff" : colors.slate[600]} />
    </View>
    <View className="flex-1">
      <View className="flex-row items-center gap-2">
        <Text className="font-bold text-slate-900">{title}</Text>
        {badge ? <View className="rounded-full bg-amber-100 px-2 py-0.5"><Text className="text-xs font-bold text-amber-700">{badge}</Text></View> : null}
      </View>
      <Text className="text-sm text-slate-500">{subtitle}</Text>
    </View>
    <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
      {isSelected ? <Check size={12} color="#fff" /> : null}
    </View>
  </TouchableOpacity>
);

export default function CheckoutScreen({ navigation }) {
  const [cart] = useState(sampleCart);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [showTax, setShowTax] = useState(false);
  const distanceKm = 3;

  const savedAddresses = [
    { id: "1", label: "Home", line1: "123, Main Street", line2: "Apt 4B", city: "Noida", state: "UP", postalCode: "201301" },
  ];

  const itemTotal = useMemo(() => cart.reduce((acc, item) => acc + getPrice(item.price) * item.quantity, 0), [cart]);

  const { deliveryBase, deliveryGst, deliveryTotal, packagingFeeBase, foodGst, packagingTax, deliveryAndTax, grandTotal } = useMemo(() => {
    const dB = calculateDeliveryBase(distanceKm);
    const dG = dB * DELIVERY_GST_RATE;
    const dT = dB + dG;
    const pkg = Math.floor(itemTotal * PACKAGING_PERCENT);
    const fG = itemTotal * FOOD_GST_RATE;
    const pT = pkg * FOOD_GST_RATE;
    return {
      deliveryBase: dB, deliveryGst: dG, deliveryTotal: dT,
      packagingFeeBase: pkg, foodGst: fG, packagingTax: pT,
      deliveryAndTax: Math.floor(dT + fG + pT + PLATFORM_FEE),
      grandTotal: Math.floor(itemTotal + pkg + dT + fG + pT + PLATFORM_FEE),
    };
  }, [itemTotal, distanceKm]);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white shadow-sm pt-14 pb-4">
        <View className="flex-row items-center gap-4 px-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Checkout</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6 pb-32">
        <View className="rounded-3xl bg-white p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
              <MapPin size={16} color={colors.brand[600]} />
            </View>
            <Text className="text-lg font-bold text-slate-900">Delivery Address</Text>
          </View>
          {savedAddresses.length > 0 ? (
            <View className="space-y-3">
              {savedAddresses.map((addr) => (
                <AddressCard key={addr.id} address={addr} isSelected={selectedAddressId === addr.id} onSelect={setSelectedAddressId} />
              ))}
              <TouchableOpacity onPress={() => { setShowNewAddress(!showNewAddress); setSelectedAddressId(""); }}
                className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4">
                <Plus size={20} color={colors.slate[500]} />
                <Text className="font-medium text-slate-500">Add New Address</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {showNewAddress ? (
            <View className="mt-4 space-y-4 rounded-2xl border-2 border-slate-200 p-4">
              <TextInput placeholder="Full Name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholderTextColor="#94a3b8" />
              <TextInput placeholder="Phone Number" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholderTextColor="#94a3b8" keyboardType="phone-pad" />
              <TextInput placeholder="House/Flat/Building" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholderTextColor="#94a3b8" />
              <TextInput placeholder="Landmark (optional)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholderTextColor="#94a3b8" />
              <View className="flex-row gap-3">
                <TextInput placeholder="City" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholderTextColor="#94a3b8" />
                <TextInput placeholder="Pincode" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholderTextColor="#94a3b8" keyboardType="number-pad" />
              </View>
            </View>
          ) : null}
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
              <CreditCard size={16} color={colors.brand[600]} />
            </View>
            <Text className="text-lg font-bold text-slate-900">Payment Method</Text>
          </View>
          <View className="space-y-3">
            <PaymentOption icon={CreditCard} title="UPI / Cards" subtitle="Pay via UPI, Credit/Debit Card, Net Banking"
              isSelected={paymentMethod === "UPI"} onSelect={() => setPaymentMethod("UPI")} />
            <PaymentOption icon={CreditCard} title="Cash on Delivery" subtitle="Pay when your food arrives"
              isSelected={paymentMethod === "COD"} onSelect={() => setPaymentMethod("COD")} badge="COD" />
          </View>
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <Tag size={20} color={colors.brand[600]} />
            <Text className="text-lg font-bold text-slate-900">Coupon</Text>
          </View>
          <View className="flex-row gap-2">
            <TextInput placeholder="Enter coupon code"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
              placeholderTextColor="#94a3b8" autoCapitalize="characters" />
            <TouchableOpacity className="rounded-xl bg-indigo-600 px-6 py-3">
              <Text className="font-bold text-white">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm mt-4">
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-600">Item Total</Text>
              <Text className="text-sm font-medium">{formatCurrency(itemTotal)}</Text>
            </View>
            {packagingFeeBase > 0 ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-600">Packaging</Text>
                <Text className="text-sm font-medium">{formatCurrency(packagingFeeBase)}</Text>
              </View>
            ) : null}
            <View className="bg-slate-50 rounded-xl">
              <TouchableOpacity onPress={() => setShowTax(!showTax)}
                className="flex-row items-center justify-between p-3">
                <Text className="text-sm font-bold text-slate-800">Delivery & Tax</Text>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm">{formatCurrency(deliveryAndTax)}</Text>
                  {showTax ? <ChevronUp size={16} color={colors.slate[800]} /> : <ChevronDown size={16} color={colors.slate[800]} />}
                </View>
              </TouchableOpacity>
              {showTax ? (
                <View className="px-3 pb-3 border-t border-slate-200 pt-2.5 space-y-1.5">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Delivery ({distanceKm.toFixed(1)} km)</Text>
                    <Text className="text-xs">{formatCurrency(deliveryBase)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Food GST (5%)</Text>
                    <Text className="text-xs">{formatCurrency(foodGst + packagingTax)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Delivery GST (18%)</Text>
                    <Text className="text-xs">{formatCurrency(deliveryGst)}</Text>
                  </View>
                </View>
              ) : null}
            </View>
            <View className="border-t-2 border-indigo-600 pt-3">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-slate-900">Total</Text>
                <Text className="text-xl font-extrabold text-indigo-700">{formatCurrency(grandTotal)}</Text>
              </View>
            </View>
            <Text className="text-xs text-slate-400">All prices inclusive of taxes.</Text>
          </View>
        </View>

        <TouchableOpacity className="mt-6 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200">
          <Text className="text-base font-extrabold text-white text-center">
            Place Order — {formatCurrency(grandTotal)}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

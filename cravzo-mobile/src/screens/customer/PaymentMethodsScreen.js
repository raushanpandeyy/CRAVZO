import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ChevronLeft, Wallet, CreditCard, Smartphone, Building2, CheckCircle } from "lucide-react-native";
import { colors } from "../../constants/colors";

const paymentOptions = [
  { id: "cod", name: "Cash on Delivery", description: "Pay when your order arrives", icon: Wallet, color: "#059669", bg: "bg-emerald-50" },
  { id: "razorpay", name: "Credit / Debit Card", description: "Visa, Mastercard, Rupay", icon: CreditCard, color: "#6366f1", bg: "bg-indigo-50" },
  { id: "razorpay_upi", name: "UPI", description: "Google Pay, PhonePe, Paytm", icon: Smartphone, color: "#8b5cf6", bg: "bg-violet-50" },
  { id: "razorpay_netbanking", name: "Net Banking", description: "All major banks supported", icon: Building2, color: "#f59e0b", bg: "bg-amber-50" },
];

export default function PaymentMethodsScreen({ navigation }) {
  const [selected, setSelected] = useState("cod");

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color="#020617" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Payment Methods</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <Text className="text-sm font-bold text-slate-700 mb-3">Choose your preferred payment method</Text>
        <View className="space-y-3">
          {paymentOptions.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <TouchableOpacity key={opt.id} onPress={() => setSelected(opt.id)}
                className={`flex-row items-center gap-4 rounded-3xl bg-white p-5 shadow-sm border-2 ${isSelected ? "border-indigo-500" : "border-transparent"}`}>
                <View className={`h-14 w-14 items-center justify-center rounded-2xl ${opt.bg}`}>
                  <opt.icon size={26} color={opt.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-extrabold text-slate-900">{opt.name}</Text>
                  <Text className="text-sm text-slate-500 mt-0.5">{opt.description}</Text>
                </View>
                {isSelected ? <CheckCircle size={22} color="#6366f1" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
        <View className="mt-6 rounded-3xl bg-indigo-50 p-5">
          <Text className="text-sm font-bold text-indigo-900">Secure Payments</Text>
          <Text className="text-xs text-indigo-700 mt-1 leading-5">
            Your payment information is encrypted and secure. We use Razorpay for card, UPI, and net banking transactions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

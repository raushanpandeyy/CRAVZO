import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, Wallet } from "lucide-react-native";

export default function PaymentMethodsScreen({ navigation }) {
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
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Wallet size={32} color="#059669" />
          </View>
          <Text className="text-lg font-black text-slate-900">Cash on Delivery</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
            All orders are currently processed with Cash on Delivery. Pay when your order arrives at your doorstep.
          </Text>
        </View>
      </View>
    </View>
  );
}

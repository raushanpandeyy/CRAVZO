import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
} from "react-native";
import {
  User, Bike, Star, IndianRupee, MessageCircle,
  ChevronRight, LogOut,
} from "lucide-react-native";
import { colors } from "../../constants/colors";

const menuItems = [
  { icon: Star, label: "Reviews", color: "#f59e0b" },
  { icon: IndianRupee, label: "Earnings", color: "#10b981" },
  { icon: MessageCircle, label: "Support Chat", color: "#8b5cf6" },
  { icon: Bike, label: "Delivery History", color: "#6366f1" },
];

export default function RiderProfileScreen({ navigation }) {
  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]">
      <View className="bg-indigo-950 pt-16 pb-8 px-4 rounded-b-[28px]">
        <View className="items-center">
          <View className="h-20 w-20 rounded-full bg-amber-500 items-center justify-center mb-3 border-2 border-amber-300">
            <Bike size={36} color="#fff" />
          </View>
          <Text className="text-xl font-extrabold text-white">Raushan Kumar</Text>
          <Text className="text-sm text-indigo-200 mt-1">raushan@example.com</Text>
          <View className="flex-row items-center gap-1 mt-2 bg-amber-500/20 rounded-full px-3 py-1">
            <Bike size={12} color="#fbbf24" />
            <Text className="text-xs font-bold text-amber-300">Rider</Text>
          </View>
        </View>
        <View className="flex-row gap-4 mt-6">
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-extrabold text-white">4.8</Text>
            <Text className="text-xs text-indigo-200">Rating</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-extrabold text-white">156</Text>
            <Text className="text-xs text-indigo-200">Deliveries</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-extrabold text-white">₹12.5k</Text>
            <Text className="text-xs text-indigo-200">Earned</Text>
          </View>
        </View>
      </View>
      <View className="px-4 -mt-4">
        <View className="bg-white rounded-3xl p-2 shadow-sm">
          {menuItems.map((item, i) => (
            <TouchableOpacity key={item.label}
              className={`flex-row items-center gap-4 px-4 py-4 ${i < menuItems.length - 1 ? "border-b border-slate-100" : ""}`}>
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text className="flex-1 font-bold text-slate-900">{item.label}</Text>
              <ChevronRight size={18} color={colors.slate[400]} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity className="flex-row items-center gap-4 bg-white rounded-3xl p-4 shadow-sm mt-4 mb-8">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
            <LogOut size={20} color={colors.red[600]} />
          </View>
          <Text className="font-extrabold text-rose-600">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

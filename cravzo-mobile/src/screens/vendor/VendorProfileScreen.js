import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch,
} from "react-native";
import {
  Store, Clock3, IndianRupee, Star, MessageCircle,
  ChevronRight, LogOut, MapPin,
} from "lucide-react-native";
import { colors } from "../../constants/colors";

const menuItems = [
  { icon: Clock3, label: "Business Hours", color: "#f59e0b" },
  { icon: IndianRupee, label: "Earnings & Reports", color: "#10b981" },
  { icon: Star, label: "Reviews", color: "#6366f1" },
  { icon: MessageCircle, label: "Support Chat", color: "#8b5cf6" },
  { icon: MapPin, label: "Delivery Area", color: "#ef4444" },
];

export default function VendorProfileScreen({ navigation }) {
  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]">
      <View className="bg-indigo-950 pt-16 pb-8 px-4 rounded-b-[28px]">
        <View className="items-center">
          <View className="h-20 w-20 rounded-2xl bg-indigo-600 items-center justify-center mb-3 border-2 border-indigo-400">
            <Store size={36} color="#fff" />
          </View>
          <Text className="text-xl font-extrabold text-white">Punjab Grill</Text>
          <Text className="text-sm text-indigo-200 mt-1">raushan@example.com</Text>
          <View className="flex-row items-center gap-1 mt-2 bg-white/10 rounded-full px-3 py-1">
            <Store size={12} color="#a5b4fc" />
            <Text className="text-xs font-bold text-indigo-200">Vendor</Text>
          </View>
        </View>
        <View className="flex-row gap-4 mt-6">
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-extrabold text-white">4.5</Text>
            <Text className="text-xs text-indigo-200">Rating</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-extrabold text-white">342</Text>
            <Text className="text-xs text-indigo-200">Orders</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-xs font-extrabold text-white">OPEN</Text>
            <Text className="text-xs text-indigo-200">Status</Text>
          </View>
        </View>
      </View>
      <View className="px-4 -mt-4">
        <View className="bg-white rounded-3xl p-2 shadow-sm">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100">
            <Text className="font-bold text-slate-900">Restaurant Name</Text>
            <Text className="text-sm text-slate-500">Punjab Grill</Text>
          </View>
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100">
            <Text className="font-bold text-slate-900">Phone</Text>
            <Text className="text-sm text-slate-500">9876543210</Text>
          </View>
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100">
            <Text className="font-bold text-slate-900">Cuisine</Text>
            <Text className="text-sm text-slate-500">North Indian, Punjabi</Text>
          </View>
          <View className="flex-row items-center justify-between px-4 py-4">
            <Text className="font-bold text-slate-900">Open</Text>
            <Switch value={true} trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }} thumbColor="#22c55e" />
          </View>
        </View>

        <View className="bg-white rounded-3xl p-2 shadow-sm mt-4">
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

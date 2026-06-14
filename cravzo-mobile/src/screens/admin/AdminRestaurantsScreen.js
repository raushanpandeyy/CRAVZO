import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
} from "react-native";
import { Search, Store, Star, Clock3, MapPin, ChevronRight, X } from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleRestaurants = [
  { id: "1", name: "Punjab Grill", cuisine: "North Indian", rating: "4.5", orders: 342, status: "Active", city: "Noida" },
  { id: "2", name: "Sagar Ratna", cuisine: "South Indian", rating: "4.3", orders: 256, status: "Active", city: "Delhi" },
  { id: "3", name: "Domino's Pizza", cuisine: "Italian, Fast Food", rating: "4.1", orders: 512, status: "Active", city: "Noida" },
  { id: "4", name: "New Restaurant", cuisine: "Multi Cuisine", rating: "0", orders: 0, status: "Pending", city: "Gurugram" },
];

export default function AdminRestaurantsScreen({ navigation }) {
  const [query, setQuery] = useState("");

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <Text className="text-xl font-extrabold text-slate-900">Restaurant Management</Text>
        <View className="flex-row items-center bg-slate-50 rounded-xl px-4 h-11 mt-3 border border-slate-200">
          <Search size={16} color="#94a3b8" />
          <TextInput className="flex-1 ml-2 text-sm text-slate-900" placeholder="Search restaurants..." placeholderTextColor="#94a3b8"
            value={query} onChangeText={setQuery} />
          {query ? <TouchableOpacity><X size={16} color="#94a3b8" /></TouchableOpacity> : null}
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4 space-y-3 pb-8">
        {sampleRestaurants.map((r) => (
          <TouchableOpacity key={r.id} className="bg-white rounded-3xl p-4 shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 rounded-2xl bg-amber-50 items-center justify-center">
                <Store size={26} color="#d97706" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-slate-900">{r.name}</Text>
                  <View className={`rounded-full px-2 py-0.5 ${r.status === "Active" ? "bg-emerald-50" : "bg-amber-50"}`}>
                    <Text className={`text-[9px] font-extrabold ${r.status === "Active" ? "text-emerald-600" : "text-amber-600"}`}>
                      {r.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mt-0.5">{r.cuisine}</Text>
                <View className="flex-row items-center gap-3 mt-1">
                  <View className="flex-row items-center gap-1">
                    <Star size={10} color="#f59e0b" fill="#f59e0b" />
                    <Text className="text-xs font-bold text-slate-700">{r.rating}</Text>
                  </View>
                  <Text className="text-xs text-slate-400">{r.orders} orders</Text>
                  <View className="flex-row items-center gap-1">
                    <MapPin size={10} color={colors.slate[400]} />
                    <Text className="text-xs text-slate-400">{r.city}</Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={18} color={colors.slate[400]} />
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200">
          <Text className="font-extrabold text-white">+ Add Restaurant</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

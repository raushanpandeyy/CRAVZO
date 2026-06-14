import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
} from "react-native";
import { ShoppingBag, Store, User, Clock3, ChevronRight } from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleOrders = [
  { id: "O1001", customer: "Rahul S.", restaurant: "Punjab Grill", items: "Butter Chicken, Naan x2", amount: 543, status: "Delivered", time: "Today, 7:30 PM" },
  { id: "O1002", customer: "Priya M.", restaurant: "Sagar Ratna", items: "Masala Dosa, Idli x2", amount: 320, status: "Preparing", time: "Today, 7:15 PM" },
  { id: "O1003", customer: "Amit K.", restaurant: "Domino's", items: "Peppy Paneer Large", amount: 499, status: "Pending", time: "Today, 7:00 PM" },
  { id: "O1004", customer: "Neha S.", restaurant: "Bikaner Sweets", items: "Samosa x6, Jalebi x4", amount: 280, status: "Cancelled", time: "Today, 6:45 PM" },
];

const statusFilters = ["All", "Pending", "Preparing", "Delivered", "Cancelled"];

export default function AdminOrdersScreen({ navigation }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? sampleOrders : sampleOrders.filter((o) => o.status === filter);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <Text className="text-xl font-extrabold text-slate-900">Order Management</Text>
      </View>
      <ScrollView className="flex-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3" contentContainerStyle={{ gap: 8 }}>
          {statusFilters.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              className={`rounded-full px-5 py-2 ${filter === f ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
              <Text className={`text-xs font-extrabold ${filter === f ? "text-white" : "text-slate-700"}`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View className="px-4 space-y-3 pb-8">
          {filtered.map((order) => (
            <TouchableOpacity key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <View className="flex-row items-start gap-3">
                <View className={`h-12 w-12 rounded-xl items-center justify-center ${
                  order.status === "Delivered" ? "bg-emerald-50" :
                  order.status === "Preparing" ? "bg-amber-50" :
                  order.status === "Cancelled" ? "bg-rose-50" : "bg-slate-100"
                }`}>
                  <ShoppingBag size={22} color={
                    order.status === "Delivered" ? "#059669" :
                    order.status === "Preparing" ? "#d97706" :
                    order.status === "Cancelled" ? "#e11d48" : "#64748b"
                  } />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-slate-900">#{order.id}</Text>
                    <View className={`rounded-full px-2.5 py-0.5 ${
                      order.status === "Delivered" ? "bg-emerald-50" :
                      order.status === "Preparing" ? "bg-amber-50" :
                      order.status === "Cancelled" ? "bg-rose-50" : "bg-slate-100"
                    }`}>
                      <Text className={`text-[10px] font-extrabold ${
                        order.status === "Delivered" ? "text-emerald-600" :
                        order.status === "Preparing" ? "text-amber-600" :
                        order.status === "Cancelled" ? "text-rose-600" : "text-slate-500"
                      }`}>{order.status}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2 mt-1">
                    <User size={12} color={colors.slate[400]} />
                    <Text className="text-xs text-slate-600">{order.customer}</Text>
                  </View>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Store size={12} color={colors.slate[400]} />
                    <Text className="text-xs text-slate-600">{order.restaurant}</Text>
                  </View>
                  <Text className="text-xs text-slate-500 mt-1">{order.items}</Text>
                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <Text className="text-lg font-extrabold text-slate-900">₹{order.amount}</Text>
                    <View className="flex-row items-center gap-1">
                      <Clock3 size={12} color={colors.slate[400]} />
                      <Text className="text-xs text-slate-400">{order.time}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

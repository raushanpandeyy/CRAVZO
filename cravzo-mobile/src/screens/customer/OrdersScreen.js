import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Clock3, IndianRupee, Star, MapPin, ChevronRight,
} from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleOrders = [
  { id: "1", restaurant: "Punjab Grill", items: "Butter Chicken, Naan x2", total: 543, status: "Delivered", date: "Today, 7:30 PM", rating: 4 },
  { id: "2", restaurant: "Sagar Ratna", items: "Masala Dosa, Idli x3", total: 320, status: "Delivered", date: "Yesterday, 1:15 PM", rating: 5 },
  { id: "3", restaurant: "Domino's", items: "Peppy Paneer Large", total: 499, status: "Cancelled", date: "2 days ago", rating: null },
];

const statusColors = {
  Delivered: "text-emerald-600 bg-emerald-50",
  Cancelled: "text-rose-600 bg-rose-50",
  Preparing: "text-amber-600 bg-amber-50",
  "On the way": "text-blue-600 bg-blue-50",
};

export default function OrdersScreen() {
  const [orders] = useState(sampleOrders);

  return (
    <ScrollView className="flex-1 bg-[#F5F5F5] pt-16 px-4">
      <Text className="text-xl font-extrabold text-slate-900 mb-4">Your Orders</Text>
      {orders.length === 0 ? (
        <View className="items-center justify-center py-20">
          <Text className="text-5xl mb-4">📋</Text>
          <Text className="text-lg font-bold text-slate-900">No orders yet</Text>
          <Text className="text-sm text-slate-500 mt-1">Your orders will appear here</Text>
        </View>
      ) : (
        <View className="space-y-4">
          {orders.map((order) => (
            <TouchableOpacity key={order.id}
              className="bg-white rounded-3xl p-4 shadow-sm">
              <View className="flex-row items-start gap-3">
                <View className="h-14 w-14 rounded-2xl bg-indigo-100 items-center justify-center">
                  <Text className="text-xl font-black text-indigo-600">{(order.restaurant[0])}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-slate-900" numberOfLines={1}>{order.restaurant}</Text>
                    <View className={`rounded-full px-2.5 py-0.5 ${statusColors[order.status] || "bg-slate-100"}`}>
                      <Text className="text-[10px] font-extrabold">{order.status}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>{order.items}</Text>
                  <View className="flex-row items-center gap-3 mt-2">
                    <View className="flex-row items-center gap-1">
                      <IndianRupee size={12} color={colors.slate[500]} />
                      <Text className="text-xs font-bold text-slate-700">{order.total}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Clock3 size={12} color={colors.slate[500]} />
                      <Text className="text-xs text-slate-500">{order.date}</Text>
                    </View>
                  </View>
                  {order.rating ? (
                    <View className="flex-row items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} color={star <= order.rating ? "#f59e0b" : "#e2e8f0"}
                          fill={star <= order.rating ? "#f59e0b" : "none"} />
                      ))}
                    </View>
                  ) : null}
                </View>
                <ChevronRight size={20} color={colors.slate[400]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

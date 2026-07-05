import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ChevronLeft, Star, Bike, IndianRupee } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getRiderOrders } from "../../services/riderService";

export default function RiderMyReviewsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRiderOrders();
        setOrders(res.orders || []);
      } catch (err) {
        console.error("Reviews load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">My Reviews</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        {deliveredOrders.length === 0 ? (
          <View className="items-center pt-16">
            <Star size={48} color={colors.slate[300]} />
            <Text className="text-lg font-bold text-slate-400 mt-4">No reviews yet</Text>
            <Text className="text-sm text-slate-400 mt-1 text-center">
              Complete deliveries to leave reviews
            </Text>
          </View>
        ) : (
          deliveredOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => navigation.navigate("RiderReview", { orderId: order.id })}
              className="bg-white rounded-3xl p-4 shadow-sm mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <Star size={16} color="#f59e0b" />
                  </View>
                  <Text className="font-bold text-slate-900">
                    #{order.orderNumber || order.id.slice(0, 8)}
                  </Text>
                </View>
                <Text className="text-xs text-slate-400">{formatDate(order.updatedAt)}</Text>
              </View>
              <View className="border-t border-slate-100 pt-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <Bike size={14} color={colors.slate[400]} />
                    <Text className="text-sm text-slate-500">
                      {order.restaurant?.name || "Delivery"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <IndianRupee size={14} color={colors.slate[400]} />
                    <Text className="text-sm font-bold text-slate-700">{order.deliveryFee || 0}</Text>
                  </View>
                </View>
              </View>
              <View className="mt-2">
                <Text className="text-xs font-bold text-indigo-600">Tap to leave a review →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

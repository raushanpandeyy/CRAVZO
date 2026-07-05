import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ChevronLeft, Bike, Clock, CheckCircle, XCircle, IndianRupee } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getRiderOrders } from "../../services/riderService";

const statusConfig = {
  DELIVERED: { icon: CheckCircle, color: "#059669", label: "Delivered" },
  CANCELLED: { icon: XCircle, color: "#dc2626", label: "Cancelled" },
  PICKED_UP: { icon: Bike, color: "#8b5cf6", label: "Picked Up" },
  ASSIGNED: { icon: Clock, color: "#f59e0b", label: "Assigned" },
};

export default function DeliveryHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRiderOrders();
        setOrders(res.orders || []);
      } catch (err) {
        console.error("Delivery history load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
          <Text className="text-xl font-extrabold text-slate-900">Delivery History</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        {orders.length === 0 ? (
          <View className="items-center pt-16">
            <Bike size={48} color={colors.slate[300]} />
            <Text className="text-lg font-bold text-slate-400 mt-4">No deliveries yet</Text>
            <Text className="text-sm text-slate-400 mt-1">Your completed orders will appear here</Text>
          </View>
        ) : (
          orders.map((order) => {
            const cfg = statusConfig[order.status] || { icon: Clock, color: colors.slate[500], label: order.status };
            const Icon = cfg.icon;
            return (
              <View key={order.id} className="bg-white rounded-3xl p-4 shadow-sm mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${cfg.color}15` }}>
                      <Icon size={16} color={cfg.color} />
                    </View>
                    <Text className="font-bold text-slate-900">#{order.orderNumber || order.id.slice(0, 8)}</Text>
                  </View>
                  <Text className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
                </View>
                <View className="border-t border-slate-100 pt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-slate-500">{formatDate(order.updatedAt || order.createdAt)}</Text>
                    <View className="flex-row items-center gap-1">
                      <IndianRupee size={14} color={colors.slate[900]} />
                      <Text className="font-extrabold text-slate-900">{order.deliveryFee || 0}</Text>
                    </View>
                  </View>
                  {order.restaurant?.name && (
                    <Text className="text-xs text-slate-400 mt-1">{order.restaurant.name}</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

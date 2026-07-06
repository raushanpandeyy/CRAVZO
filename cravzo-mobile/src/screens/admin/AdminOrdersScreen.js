import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { ShoppingBag, Store, User, Clock3 } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getDashboardOverview } from "../../services/adminService";

const statusFilters = ["All", "PENDING", "PREPARING", "DELIVERED", "CANCELLED"];

export default function AdminOrdersScreen({ navigation }) {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "All" ? { status: filter, limit: 100 } : { limit: 100 };
      const data = await getDashboardOverview(params);
      setOrders(data.recentOrders || []);
    } catch (err) {
      console.error("Admin orders load error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const statusStyle = (status) => {
    switch (status) {
      case "DELIVERED": return { bg: "bg-emerald-50", text: "text-emerald-600", icon: "#059669" };
      case "PREPARING":
      case "ACCEPTED":
      case "READY_FOR_PICKUP":
      case "OUT_FOR_DELIVERY": return { bg: "bg-amber-50", text: "text-amber-600", icon: "#d97706" };
      case "CANCELLED":
      case "REJECTED": return { bg: "bg-rose-50", text: "text-rose-600", icon: "#e11d48" };
      default: return { bg: "bg-slate-100", text: "text-slate-500", icon: "#64748b" };
    }
  };

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
          {loading ? (
            <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 40 }} />
          ) : orders.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-sm text-slate-500">No orders found</Text>
            </View>
          ) : (
            orders.map((order) => {
              const s = statusStyle(order.status);
              return (
                <TouchableOpacity key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
                  <View className="flex-row items-start gap-3">
                    <View className={`h-12 w-12 rounded-xl items-center justify-center ${s.bg}`}>
                      <ShoppingBag size={22} color={s.icon} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-bold text-slate-900">#{order.id.slice(-6)}</Text>
                        <View className={`rounded-full px-2.5 py-0.5 ${s.bg}`}>
                          <Text className={`text-[10px] font-extrabold ${s.text}`}>{order.status}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2 mt-1">
                        <User size={12} color={colors.slate[400]} />
                        <Text className="text-xs text-slate-600">{order.customer?.name || "Unknown"}</Text>
                      </View>
                      <View className="flex-row items-center gap-2 mt-0.5">
                        <Store size={12} color={colors.slate[400]} />
                        <Text className="text-xs text-slate-600">{order.restaurant?.name || ""}</Text>
                      </View>
                      <Text className="text-xs text-slate-500 mt-1">
                        {order.items?.map?.((i) => i.menuItem?.name).filter(Boolean).join(", ") || `${order.items?.length || 0} items`}
                      </Text>
                      {Number(order.tipAmount || 0) > 0 ? <Text className="mt-2 text-xs font-bold text-emerald-700">Rider tip: ₹{Number(order.tipAmount).toFixed(0)}</Text> : null}
                      {order.restaurantInstructions ? <Text className="mt-1 text-xs text-amber-700">Restaurant: {order.restaurantInstructions}</Text> : null}
                      {order.deliveryInstructions ? <Text className="mt-1 text-xs text-blue-700">Rider: {order.deliveryInstructions}</Text> : null}                      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <Text className="text-lg font-extrabold text-slate-900">â‚¹{order.totalAmount || 0}</Text>
                        <View className="flex-row items-center gap-1">
                          <Clock3 size={12} color={colors.slate[400]} />
                          <Text className="text-xs text-slate-400">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

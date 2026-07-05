import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import {
  Users, Store, IndianRupee, ShoppingBag,
  TrendingUp, TrendingDown, ChevronRight,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getDashboardOverview } from "../../services/adminService";

export default function AdminDashboardScreen({ navigation }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardOverview();
        setOverview(data.data || data);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  const totals = overview?.totals || {};
  const recentOrders = overview?.recentOrders || [];

  const stats = [
    { icon: Users, label: "Total Users", value: String(totals.totalUsers || 0), change: `${totals.activeUsers || 0} active`, up: true, color: "#6366f1" },
    { icon: Store, label: "Restaurants", value: String(totals.totalRestaurants || 0), change: `${totals.pendingVendors || 0} pending`, up: true, color: "#f59e0b" },
    { icon: ShoppingBag, label: "Total Orders", value: String(totals.totalOrders || 0), change: `${totals.liveOrders || 0} live`, up: true, color: "#10b981" },
    { icon: IndianRupee, label: "Completed", value: String(totals.completedOrders || 0), change: `${((totals.completedOrders / (totals.totalOrders || 1)) * 100).toFixed(0)}%`, up: true, color: "#ef4444" },
  ];

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView className="flex-1">
        <View className="bg-indigo-950 pt-16 pb-6 px-4 rounded-b-[28px]">
          <Text className="text-2xl font-extrabold text-white">Admin Dashboard</Text>
          <Text className="text-sm text-indigo-200 mt-1">Platform Overview</Text>
        </View>

        <View className="px-4 -mt-4">
          <View className="flex-row flex-wrap gap-3">
            {stats.map((stat) => (
              <View key={stat.label} className="w-[48%] bg-white rounded-3xl p-4 shadow-sm">
                <View className="h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <Text className="text-2xl font-extrabold text-slate-900">{stat.value}</Text>
                <Text className="text-xs text-slate-500 mt-1">{stat.label}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  {stat.up ? <TrendingUp size={12} color="#059669" /> : <TrendingDown size={12} color="#dc2626" />}
                  <Text className={`text-xs font-bold ${stat.up ? "text-emerald-600" : "text-red-600"}`}>
                    {stat.change}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-extrabold text-slate-900">Recent Orders</Text>
              <TouchableOpacity className="flex-row items-center gap-1" onPress={() => navigation.navigate("Orders")}>
                <Text className="text-xs font-bold text-indigo-600">View All</Text>
                <ChevronRight size={14} color={colors.brand[600]} />
              </TouchableOpacity>
            </View>
            <View className="bg-white rounded-3xl overflow-hidden shadow-sm">
              {recentOrders.slice(0, 5).map((order, i) => (
                <TouchableOpacity key={order.id}
                  className={`flex-row items-center gap-4 px-4 py-4 ${i < Math.min(recentOrders.length, 5) - 1 ? "border-b border-slate-100" : ""}`}>
                  <View className="h-10 w-10 rounded-xl bg-indigo-50 items-center justify-center">
                    <ShoppingBag size={18} color={colors.brand[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900">{order.customer?.name || "Customer"}</Text>
                    <Text className="text-xs text-slate-500">{order.restaurant?.name || ""}</Text>
                  </View>
                  <Text className="font-bold text-slate-900">₹{order.totalAmount || 0}</Text>
                  <View className={`rounded-full px-2.5 py-0.5 ${
                    order.status === "DELIVERED" ? "bg-emerald-50" :
                    ["ACCEPTED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY"].includes(order.status) ? "bg-amber-50" : "bg-slate-100"
                  }`}>
                    <Text className={`text-[10px] font-extrabold ${
                      order.status === "DELIVERED" ? "text-emerald-600" :
                      ["ACCEPTED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY"].includes(order.status) ? "text-amber-600" : "text-slate-500"
                    }`}>{order.status}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {recentOrders.length === 0 && (
                <View className="py-8 items-center">
                  <Text className="text-sm text-slate-400">No recent orders</Text>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row gap-3 mt-6 mb-8">
            <TouchableOpacity className="flex-1 bg-white rounded-3xl p-4 shadow-sm items-center" onPress={() => navigation.navigate("Users")}>
              <Users size={24} color={colors.brand[600]} />
              <Text className="font-extrabold text-slate-900 mt-2">Users</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white rounded-3xl p-4 shadow-sm items-center" onPress={() => navigation.navigate("Restaurants")}>
              <Store size={24} color="#f59e0b" />
              <Text className="font-extrabold text-slate-900 mt-2">Restaurants</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white rounded-3xl p-4 shadow-sm items-center" onPress={() => navigation.navigate("Orders")}>
              <ShoppingBag size={24} color="#10b981" />
              <Text className="font-extrabold text-slate-900 mt-2">Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

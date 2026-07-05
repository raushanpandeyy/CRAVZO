import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import {
  Users, Store, Bike, ShoppingBag, IndianRupee, TrendingUp, ChevronLeft,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getDashboardOverview } from "../../services/adminService";

export default function AdminAnalyticsScreen({ navigation }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardOverview();
        setOverview(data);
      } catch (err) {
        console.error("Analytics load error:", err);
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

  const t = overview?.totals || {};

  const metrics = [
    { icon: Users, label: "Total Users", value: String(t.totalUsers || 0), color: "#6366f1" },
    { icon: Users, label: "Active Users", value: String(t.activeUsers || 0), color: "#10b981" },
    { icon: Users, label: "Customers", value: String(t.totalCustomers || 0), color: "#6366f1" },
    { icon: Store, label: "Vendors", value: String(t.totalVendors || 0), color: "#f59e0b" },
    { icon: Bike, label: "Riders", value: String(t.totalRiders || 0), color: "#10b981" },
    { icon: Store, label: "Restaurants", value: String(t.totalRestaurants || 0), color: "#f59e0b" },
    { icon: ShoppingBag, label: "Total Orders", value: String(t.totalOrders || 0), color: "#6366f1" },
    { icon: ShoppingBag, label: "Delivered", value: String(t.completedOrders || 0), color: "#059669" },
    { icon: ShoppingBag, label: "Live Orders", value: String(t.liveOrders || 0), color: "#d97706" },
    { icon: Users, label: "Pending Vendors", value: String(t.pendingVendors || 0), color: "#ef4444" },
    { icon: Bike, label: "Pending Riders", value: String(t.pendingRiders || 0), color: "#ef4444" },
  ];

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Analytics</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row flex-wrap gap-3">
          {metrics.map((m) => (
            <View key={m.label} className="w-[47%] bg-white rounded-3xl p-4 shadow-sm">
              <View className="h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: `${m.color}15` }}>
                <m.icon size={20} color={m.color} />
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">{m.value}</Text>
              <Text className="text-xs text-slate-500 mt-1">{m.label}</Text>
            </View>
          ))}
        </View>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

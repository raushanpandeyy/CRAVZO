import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { IndianRupee, TrendingUp, ChevronLeft, Bike, Star } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getRiderOrders } from "../../services/riderService";

export default function RiderAnalyticsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    (async () => {
      try {
        const res = await getRiderOrders({ limit: 200 });
        setOrders(res.orders || []);
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const now = new Date();
  const periodOrders = delivered.filter((o) => {
    if (!o.updatedAt) return false;
    const d = new Date(o.updatedAt);
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return period === "week" ? diff <= 7 : diff <= 30;
  });
  const periodEarnings = periodOrders.reduce((s, o) => s + (o.deliveryFee || 0), 0);
  const totalEarnings = delivered.reduce((s, o) => s + (o.deliveryFee || 0), 0);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayBuckets = Array(7).fill(0);
  periodOrders.forEach((o) => {
    const day = new Date(o.updatedAt).getDay();
    dayBuckets[day] += o.deliveryFee || 0;
  });
  const maxAmount = Math.max(...dayBuckets, 1);

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
          <Text className="text-xl font-extrabold text-slate-900">Analytics</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row gap-2 mb-4">
          {["week", "month"].map((p) => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)}
              className={`rounded-full px-6 py-2 ${period === p ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
              <Text className={`text-xs font-extrabold ${period === p ? "text-white" : "text-slate-700"}`}>
                {p === "week" ? "This Week" : "This Month"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
            <View className="h-10 w-10 rounded-xl bg-emerald-50 items-center justify-center mb-2">
              <IndianRupee size={20} color="#059669" />
            </View>
            <Text className="text-2xl font-extrabold text-slate-900">₹{periodEarnings}</Text>
            <Text className="text-xs text-slate-500">Earnings ({period})</Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
            <View className="h-10 w-10 rounded-xl bg-indigo-50 items-center justify-center mb-2">
              <Bike size={20} color={colors.brand[600]} />
            </View>
            <Text className="text-2xl font-extrabold text-slate-900">{periodOrders.length}</Text>
            <Text className="text-xs text-slate-500">Deliveries</Text>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-bold text-slate-900">Earnings Chart</Text>
            <Text className="text-xs text-slate-500">₹{periodEarnings} total</Text>
          </View>
          <View className="flex-row items-end justify-between h-32 px-2">
            {dayBuckets.map((amt, i) => {
              const h = (amt / maxAmount) * 100;
              return (
                <View key={dayLabels[i]} className="items-center gap-1">
                  <Text className="text-[10px] font-bold text-slate-700">₹{amt}</Text>
                  <View className="w-8 rounded-t-lg bg-indigo-500" style={{ height: Math.max(h, 8) }} />
                  <Text className="text-[10px] text-slate-500">{dayLabels[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <Text className="font-bold text-slate-900 mb-4">Summary</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between pb-3 border-b border-slate-100">
              <Text className="text-sm text-slate-600">Total Deliveries (All Time)</Text>
              <Text className="font-bold text-slate-900">{delivered.length}</Text>
            </View>
            <View className="flex-row justify-between pb-3 border-b border-slate-100">
              <Text className="text-sm text-slate-600">Total Earnings</Text>
              <Text className="font-bold text-emerald-600">₹{totalEarnings}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-600">Avg per Delivery</Text>
              <Text className="font-bold text-slate-900">
                ₹{delivered.length > 0 ? Math.round(totalEarnings / delivered.length) : 0}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ChevronLeft, TrendingUp, DollarSign, Clock, Utensils, ShoppingBag } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getVendorAnalytics } from "../../services/vendorService";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SalesAnalyticsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("revenue");

  useEffect(() => {
    (async () => {
      try {
        const result = await getVendorAnalytics();
        setData(result);
      } catch (err) {
        console.error("Analytics error:", err);
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

  const daily = data?.dailyRevenue || [];
  const weekly = data?.weeklyRevenue || [];
  const topDishes = data?.topDishes || [];
  const peakHours = data?.peakHours || [];
  const breakdown = data?.orderStatusBreakdown || {};

  const maxDailyRev = Math.max(...daily.map((d) => Number(d.revenue)), 1);
  const maxPeak = Math.max(...peakHours.map((p) => p.count), 1);
  const maxDish = Math.max(...topDishes.map((d) => d.count), 1);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Analytics</Text>
        </View>
      </View>

      <View className="flex-row gap-2 px-4 pt-4">
        {["revenue", "dishes", "hours"].map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            className={`rounded-full px-5 py-2 ${tab === t ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
            <Text className={`text-xs font-extrabold ${tab === t ? "text-white" : "text-slate-700"}`}>
              {t === "revenue" ? "Revenue" : t === "dishes" ? "Top Dishes" : "Peak Hours"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 px-4 pt-4 pb-8">
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
            <DollarSign size={20} color="#059669" />
            <Text className="text-2xl font-extrabold text-slate-900 mt-1">₹{Number(data?.totalRevenue || 0).toLocaleString()}</Text>
            <Text className="text-xs text-slate-500">Total Revenue</Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
            <ShoppingBag size={20} color={colors.brand[600]} />
            <Text className="text-2xl font-extrabold text-slate-900 mt-1">{data?.totalOrders || 0}</Text>
            <Text className="text-xs text-slate-500">Total Orders</Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
            <TrendingUp size={20} color="#d97706" />
            <Text className="text-2xl font-extrabold text-slate-900 mt-1">₹{Number(data?.averageOrderValue || 0).toLocaleString()}</Text>
            <Text className="text-xs text-slate-500">Avg Order</Text>
          </View>
        </View>

        {tab === "revenue" && (
          <>
            <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
              <Text className="font-bold text-slate-900 mb-4">Daily Revenue (7 days)</Text>
              <View className="flex-row items-end justify-between h-32 px-2">
                {daily.map((d, i) => {
                  const h = (Number(d.revenue) / maxDailyRev) * 100;
                  return (
                    <View key={i} className="items-center gap-1">
                      <Text className="text-[10px] font-bold text-emerald-600">₹{Number(d.revenue)}</Text>
                      <View className="w-7 rounded-t-lg bg-emerald-500" style={{ height: Math.max(h, 8) }} />
                      <Text className="text-[10px] text-slate-500">{new Date(d.date).getDate()}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
              <Text className="font-bold text-slate-900 mb-4">Weekly Revenue (4 weeks)</Text>
              {weekly.map((w, i) => (
                <View key={i} className="flex-row items-center justify-between py-3 border-b border-slate-100">
                  <Text className="text-sm text-slate-600">Week of {new Date(w.weekStart).toLocaleDateString()}</Text>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-xs text-slate-400">{w.orders} orders</Text>
                    <Text className="font-bold text-emerald-600">₹{Number(w.revenue)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
              <Text className="font-bold text-slate-900 mb-4">Order Status</Text>
              <View className="space-y-2">
                {Object.entries(breakdown).map(([key, val]) => (
                  <View key={key} className="flex-row items-center justify-between">
                    <Text className="text-sm text-slate-600 capitalize">{key.replace(/_/g, " ")}</Text>
                    <Text className="font-bold text-slate-900">{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {tab === "dishes" && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
            <Text className="font-bold text-slate-900 mb-4">Top Dishes</Text>
            {topDishes.length === 0 ? (
              <Text className="text-sm text-slate-400">No data yet</Text>
            ) : (
              topDishes.map((dish, i) => {
                const barW = (dish.count / maxDish) * 100;
                return (
                  <View key={dish.menuItemId || i} className="mb-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-medium text-slate-700 flex-1" numberOfLines={1}>
                        {i + 1}. {dish.name}
                      </Text>
                      <Text className="text-xs font-bold text-slate-500">{dish.count}x • ₹{dish.revenue}</Text>
                    </View>
                    <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <View className="h-full rounded-full bg-indigo-500" style={{ width: `${barW}%` }} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === "hours" && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
            <Text className="font-bold text-slate-900 mb-4">Orders by Hour</Text>
            <View className="flex-row items-end justify-between h-40 px-2">
              {peakHours.map((p, i) => {
                const h = (p.count / maxPeak) * 100;
                return (
                  <View key={i} className="items-center gap-1">
                    <Text className="text-[10px] font-bold text-slate-700">{p.count}</Text>
                    <View className="w-6 rounded-t-lg bg-amber-500" style={{ height: Math.max(h, 8) }} />
                    <Text className="text-[10px] text-slate-500">{p.hour}:00</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <Text className="font-bold text-slate-900 mb-2">Delivered Orders</Text>
          <Text className="text-3xl font-extrabold text-emerald-600">{data?.totalDelivered || 0}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

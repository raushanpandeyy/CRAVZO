import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { IndianRupee, TrendingUp, Calendar, ChevronLeft, BarChart3 } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getRiderOrders, getRiderEarnings } from "../../services/riderService";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RiderEarningsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [earn, orderRes] = await Promise.all([
          getRiderEarnings(),
          getRiderOrders(),
        ]);
        setEarningsData(earn);
        setOrders(orderRes.orders || []);
      } catch (err) {
        console.error("Earnings load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const totalEarnings = earningsData?.totalEarnings || deliveredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const totalTips = earningsData?.totalTips || 0;
  const todayEarnings = earningsData?.todayEarnings || 0;
  const weekEarnings = earningsData?.weekEarnings || 0;
  const monthEarnings = earningsData?.monthEarnings || 0;
  const weekCount = earningsData?.weekDeliveries || 0;

  const thisWeekOrders = deliveredOrders.filter((o) => {
    if (!o.updatedAt) return false;
    const d = new Date(o.updatedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const dayBuckets = Array(7).fill(0);
  thisWeekOrders.forEach((o) => {
    const day = new Date(o.updatedAt).getDay();
    dayBuckets[day] += Number(o.deliveryFee || 0) + Number(o.tipAmount || 0);
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
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Earnings</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
            <Text className="text-xs text-slate-500">Today</Text>
            <Text className="text-2xl font-extrabold text-emerald-600">Ã¢â€šÂ¹{todayEarnings}</Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
            <Text className="text-xs text-slate-500">This Week</Text>
            <Text className="text-2xl font-extrabold text-indigo-600">Ã¢â€šÂ¹{weekEarnings}</Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
            <Text className="text-xs text-slate-500">This Month</Text>
            <Text className="text-2xl font-extrabold text-slate-900">Ã¢â€šÂ¹{monthEarnings}</Text>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Calendar size={20} color={colors.brand[600]} />
            <Text className="font-bold text-slate-900">Weekly Breakdown</Text>
          </View>
          <View className="flex-row items-end justify-between h-32 px-2">
            {dayBuckets.map((amount, i) => {
              const height = (amount / maxAmount) * 100;
              return (
                <View key={dayLabels[i]} className="items-center gap-1">
                  <Text className="text-[10px] font-bold text-slate-700">Ã¢â€šÂ¹{amount}</Text>
                  <View
                    className="w-8 rounded-t-lg bg-indigo-500"
                    style={{ height: Math.max(height, 8) }}
                  />
                  <Text className="text-[10px] text-slate-500">{dayLabels[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <Text className="font-bold text-slate-900 mb-4">Earnings Breakdown</Text>
          <View className="space-y-4">
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <TrendingUp size={20} color="#059669" />
                </View>
                <View>
                  <Text className="font-bold text-slate-900">Total Earnings</Text>
                  <Text className="text-xs text-slate-500">All time</Text>
                </View>
              </View>
              <Text className="text-xl font-extrabold text-emerald-600">Ã¢â€šÂ¹{totalEarnings}</Text>
            </View>
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-4">
              <View><Text className="font-bold text-slate-900">Customer Tips</Text><Text className="text-xs text-slate-500">Included in total earnings</Text></View>
              <Text className="text-xl font-extrabold text-emerald-600">â‚¹{totalTips}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <IndianRupee size={20} color={colors.brand[600]} />
                </View>
                <View>
                  <Text className="font-bold text-slate-900">This Week</Text>
                  <Text className="text-xs text-slate-500">7 days</Text>
                </View>
              </View>
              <Text className="text-xl font-extrabold text-indigo-600">Ã¢â€šÂ¹{weekEarnings}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("RiderAnalytics")}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-950 py-4 mb-8 shadow-lg shadow-indigo-950/20"
        >
          <BarChart3 size={20} color="#fff" />
          <Text className="font-extrabold text-white">View Full Analytics</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

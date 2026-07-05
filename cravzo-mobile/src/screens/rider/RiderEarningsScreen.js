import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { IndianRupee, TrendingUp, Calendar, ChevronLeft } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getRiderOrders } from "../../services/riderService";
import { getMyProfile } from "../../services/riderService";

export default function RiderEarningsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prof, orderRes] = await Promise.all([
          getMyProfile(),
          getRiderOrders(),
        ]);
        setProfile(prof);
        setOrders(orderRes.orders || []);
      } catch (err) {
        console.error("Earnings load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const totalEarnings = deliveredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const thisWeekOrders = deliveredOrders.filter((o) => {
    if (!o.updatedAt) return false;
    const d = new Date(o.updatedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });
  const weekEarnings = thisWeekOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayBuckets = Array(7).fill(0);
  thisWeekOrders.forEach((o) => {
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
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Earnings</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Calendar size={20} color={colors.brand[600]} />
            <Text className="font-bold text-slate-900">This Week</Text>
          </View>
          <View className="flex-row items-end justify-between h-32 px-2">
            {dayBuckets.map((amount, i) => {
              const height = (amount / maxAmount) * 100;
              return (
                <View key={dayLabels[i]} className="items-center gap-1">
                  <Text className="text-[10px] font-bold text-slate-700">₹{amount}</Text>
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

        <View className="bg-white rounded-3xl p-6 shadow-sm">
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
              <Text className="text-xl font-extrabold text-emerald-600">₹{totalEarnings}</Text>
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
              <Text className="text-xl font-extrabold text-indigo-600">₹{weekEarnings}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

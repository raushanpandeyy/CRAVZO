import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Share, Alert,
} from "react-native";
import { IndianRupee, ShoppingBag, ChefHat, ChevronLeft, TrendingUp, Calendar } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getVendorOrders } from "../../services/vendorService";

const formatCurrency = (amount) => `Rs ${Math.floor(Number(amount || 0))}`;
const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function EarningsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getVendorOrders();
      setOrders(res.orders || []);
    } catch (err) {
      console.error("Earnings load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const shareReport = async () => {
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const lines = ["DODAGO Earnings Report", `Generated: ${new Date().toLocaleString("en-IN")}`, `Delivered orders: ${delivered.length}`, `Gross revenue: ${formatCurrency(totalRevenue)}`, "", ...delivered.map((o) => `#${o.id?.slice(-6)} | ${formatDate(o.createdAt)} | ${formatCurrency(o.totalAmount || o.total)}`)];
    await Share.share({ title: "DODAGO Earnings Report", message: lines.join("\n") });
  };
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const { totalRevenue, deliveredCount, totalOrders, cancelledCount } = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    return {
      totalRevenue: delivered.reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0),
      deliveredCount: delivered.length,
      totalOrders: orders.length,
      cancelledCount: orders.filter((o) => ["CANCELLED", "REJECTED"].includes(o.status)).length,
    };
  }, [orders]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Earnings & Reports</Text>
        </View>
      </View>
      <ScrollView className="flex-1" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="px-4 pt-4 space-y-4 pb-8">
          <View className="bg-indigo-950 rounded-3xl p-6">
            <View className="flex-row items-center gap-2 mb-1">
              <IndianRupee size={18} color="#a5b4fc" />
              <Text className="text-sm text-indigo-200">Total Revenue</Text>
            </View>
            <Text className="text-4xl font-extrabold text-white">{formatCurrency(totalRevenue)}</Text>
            <Text className="text-xs text-indigo-300 mt-1">{deliveredCount} delivered orders</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="bg-emerald-50 p-2 rounded-xl">
                  <ShoppingBag size={18} color="#059669" />
                </View>
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">{totalOrders}</Text>
              <Text className="text-xs text-slate-500">Total Orders</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="bg-emerald-50 p-2 rounded-xl">
                  <TrendingUp size={18} color="#059669" />
                </View>
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">{deliveredCount}</Text>
              <Text className="text-xs text-slate-500">Delivered</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="bg-rose-50 p-2 rounded-xl">
                  <ShoppingBag size={18} color="#e11d48" />
                </View>
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">{cancelledCount}</Text>
              <Text className="text-xs text-slate-500">Cancelled</Text>
            </View>
          </View>

          <View className="rounded-3xl bg-white p-5 shadow-sm">
            <Text className="text-lg font-extrabold text-slate-900">Payout & settlement</Text>
            <Text className="mt-1 text-sm text-slate-500">Estimated payable revenue from delivered orders</Text>
            <Text className="mt-3 text-2xl font-extrabold text-emerald-600">{formatCurrency(totalRevenue)}</Text>
            <View className="mt-4 flex-row gap-3"><TouchableOpacity onPress={shareReport} className="flex-1 rounded-2xl bg-indigo-600 py-3 items-center"><Text className="font-extrabold text-white">Share report</Text></TouchableOpacity><TouchableOpacity onPress={() => Alert.alert("Payout request", "Bank verification and automated settlement processing will be enabled by DODAGO operations.")} className="flex-1 rounded-2xl bg-emerald-600 py-3 items-center"><Text className="font-extrabold text-white">Request payout</Text></TouchableOpacity></View>
          </View>
          <Text className="text-lg font-extrabold text-slate-900 mt-2">Recent Deliveries</Text>
          {orders.filter((o) => o.status === "DELIVERED").slice(0, 20).map((order) => (
            <View key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-xl bg-emerald-50 items-center justify-center">
                    <ShoppingBag size={20} color="#059669" />
                  </View>
                  <View>
                    <Text className="font-extrabold text-slate-900">#{order.id?.slice(-6)}</Text>
                    <Text className="text-xs text-slate-500">{order.user?.name || order.customer?.name || "Customer"}</Text>
                    <Text className="text-[10px] text-slate-400">
                      <Calendar size={10} color={colors.slate[400]} /> {formatDate(order.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text className="font-extrabold text-emerald-600">{formatCurrency(order.total || order.totalAmount || 0)}</Text>
              </View>
            </View>
          ))}
          {orders.filter((o) => o.status === "DELIVERED").length === 0 ? (
            <View className="items-center py-12">
              <ChefHat size={48} color="#94a3b8" />
              <Text className="text-base font-bold text-slate-500 mt-4">No deliveries yet</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

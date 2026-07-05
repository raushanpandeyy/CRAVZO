import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import {
  Bike, Clock3, IndianRupee, Star, MapPin,
  ChevronRight, CheckCircle,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getRiderOrders, updateOrderStatus, updateRiderStatus, getMyProfile } from "../../services/riderService";
import { connectSocket, disconnectSocket } from "../../services/chatSocket";

export default function RiderDashboardScreen() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [prof, orderRes] = await Promise.all([
        getMyProfile(),
        getRiderOrders(),
      ]);
      setProfile(prof);
      setOrders(orderRes.orders || []);
    } catch (err) {
      console.error("Rider load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const socket = connectSocket();

    const handleNewOrder = (order) => {
      if (order.status === "READY_FOR_PICKUP" || order.status === "OUT_FOR_DELIVERY") {
        setOrders((prev) => [order, ...prev]);
      }
    };
    const handleStatusUpdate = ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    };
    const handleOrderClaimed = ({ orderId, riderId }) => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:status-updated", handleStatusUpdate);
    socket.on("order:claimed", handleOrderClaimed);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:status-updated", handleStatusUpdate);
      socket.off("order:claimed", handleOrderClaimed);
      disconnectSocket();
    };
  }, [loadData]);

  const handleToggleOnline = async () => {
    const next = !isOnline;
    try {
      await updateRiderStatus(next);
      setIsOnline(next);
      if (next) loadData();
    } catch {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await updateOrderStatus(orderId, "CLAIM");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      Alert.alert("Error", "Failed to accept delivery");
    } finally {
      setAcceptingId(null);
    }
  };

  const available = orders.filter((o) =>
    ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status)
  );
  const todayEarnings = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const todayDeliveries = orders.filter((o) => o.status === "DELIVERED").length;

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView className="flex-1">
        <View className="bg-indigo-950 pt-16 pb-6 px-4 rounded-b-[28px]">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 rounded-full bg-indigo-600 items-center justify-center border-2 border-indigo-400">
                <Bike size={28} color="#fff" />
              </View>
              <View>
                <Text className="text-lg font-extrabold text-white">Rider Dashboard</Text>
                <Text className="text-sm text-indigo-200">{profile?.name || "Rider"}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleToggleOnline}
              className={`rounded-full px-4 py-2 ${isOnline ? "bg-emerald-500" : "bg-slate-500"}`}
            >
              <Text className="text-xs font-extrabold text-white">{isOnline ? "ONLINE" : "OFFLINE"}</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-2xl font-extrabold text-white">₹{todayEarnings}</Text>
              <Text className="text-xs text-indigo-200">Today's Earnings</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-2xl font-extrabold text-white">{todayDeliveries}</Text>
              <Text className="text-xs text-indigo-200">Deliveries</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-6">
          <Text className="text-lg font-extrabold text-slate-900 mb-4">
            {isOnline ? "Available Orders" : "Go Online to see orders"}
          </Text>

          {isOnline && available.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Bike size={48} color="#94a3b8" />
              <Text className="text-base font-bold text-slate-500 mt-4">No orders available</Text>
              <Text className="text-sm text-slate-400 mt-1">New orders will appear here</Text>
            </View>
          ) : isOnline ? (
            <View className="space-y-4">
              {available.map((order) => (
                <TouchableOpacity key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
                  <View className="flex-row items-start gap-3">
                    <View className="h-12 w-12 rounded-2xl bg-amber-50 items-center justify-center">
                      <Bike size={24} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-extrabold text-slate-900">{order.restaurant?.name || order.restaurantName || "Restaurant"}</Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {order.user?.name || order.customerName || "Customer"} • {order.distance ? `${order.distance} km` : ""}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-2">
                        <View className="flex-row items-center gap-1">
                          <MapPin size={12} color={colors.slate[400]} />
                          <Text className="text-xs text-slate-400" numberOfLines={1}>
                            {order.deliveryAddress?.address || order.address || ""}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-3 mt-2">
                        <View className="flex-row items-center gap-1 bg-emerald-50 rounded-full px-2 py-0.5">
                          <IndianRupee size={10} color="#059669" />
                          <Text className="text-xs font-extrabold text-emerald-700">{order.deliveryFee || order.total || 0}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Clock3 size={10} color={colors.slate[400]} />
                          <Text className="text-xs text-slate-500">{order.estimatedTime || "30 min"}</Text>
                        </View>
                      </View>
                    </View>
                    <View className="gap-2">
                      <TouchableOpacity
                        disabled={acceptingId === order.id}
                        onPress={() => handleAccept(order.id)}
                        className="h-9 w-20 items-center justify-center rounded-xl bg-emerald-500"
                      >
                        <Text className="text-xs font-extrabold text-white">
                          {acceptingId === order.id ? "..." : "Accept"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Bike size={64} color="#cbd5e1" />
              <Text className="text-lg font-bold text-slate-400 mt-4">You're Offline</Text>
              <Text className="text-sm text-slate-300 mt-1 text-center px-8">
                Tap "ONLINE" to start receiving nearby delivery orders
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

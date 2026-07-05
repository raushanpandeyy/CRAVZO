import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ImageBackground,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  Store, Clock3, IndianRupee, Users, ChefHat,
  CheckCircle, XCircle, RefreshCw, CheckCircle as CheckCircleSolid,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getVendorOrders, updateOrderStatus, getMyRestaurant } from "../../services/vendorService";
import { connectSocket, disconnectSocket } from "../../services/chatSocket";

const STATUS_MAP = {
  PENDING: { label: "New", color: "text-rose-600 bg-rose-50", icon: Clock3, iconColor: "#e11d48" },
  ACCEPTED: { label: "Accepted", color: "text-indigo-600 bg-indigo-50", icon: RefreshCw, iconColor: "#6366f1" },
  PREPARING: { label: "Preparing", color: "text-amber-600 bg-amber-50", icon: RefreshCw, iconColor: "#d97706" },
  READY_FOR_PICKUP: { label: "Ready", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle, iconColor: "#059669" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-blue-600 bg-blue-50", icon: RefreshCw, iconColor: "#2563eb" },
  DELIVERED: { label: "Delivered", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle, iconColor: "#059669" },
  CANCELLED: { label: "Cancelled", color: "text-slate-600 bg-slate-50", icon: XCircle, iconColor: "#64748b" },
  REJECTED: { label: "Rejected", color: "text-rose-600 bg-rose-50", icon: XCircle, iconColor: "#e11d48" },
};

export default function VendorDashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [rest, orderRes] = await Promise.all([
        getMyRestaurant(),
        getVendorOrders(),
      ]);
      setRestaurant(rest);
      setOrders(orderRes.orders || []);
    } catch (err) {
      console.error("Vendor load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const socket = connectSocket();

    const handleNewOrder = (order) => {
      if (order.restaurantId === restaurant?.id) {
        setOrders((prev) => [order, ...prev]);
      }
    };
    const handleStatusUpdate = ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:status-updated", handleStatusUpdate);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:status-updated", handleStatusUpdate);
      disconnectSocket();
    };
  }, [loadData, restaurant?.id]);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      Alert.alert("Error", "Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  const newOrders = orders.filter((o) => o.status === "PENDING");
  const activeOrders = orders.filter((o) =>
    ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status)
  );
  const todayRevenue = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1">
        <ImageBackground
          source={restaurant?.imageUrl ? { uri: restaurant.imageUrl } : undefined}
          className="pt-16 pb-6 px-4 rounded-b-[28px] overflow-hidden"
        >
          <View className="absolute inset-0 bg-indigo-950/75 rounded-b-[28px]" />
          <View className="relative">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center border border-white/30">
                  <Store size={28} color="#fff" />
                </View>
                <View>
                  <Text className="text-xl font-extrabold text-white drop-shadow-lg">{restaurant?.name || "Vendor Dashboard"}</Text>
                  <Text className="text-sm text-indigo-200">Vendor Dashboard</Text>
                </View>
              </View>
              <View className={`rounded-full px-3 py-1.5 ${restaurant?.isOpen ? "bg-emerald-500" : "bg-slate-500"}`}>
                <Text className="text-xs font-extrabold text-white">{restaurant?.isOpen ? "OPEN" : "CLOSED"}</Text>
              </View>
            </View>
            <View className="flex-row gap-3 mt-5">
              <BlurView intensity={35} tint="dark" className="flex-1 rounded-2xl p-3 overflow-hidden border border-white/10">
                <Text className="text-2xl font-extrabold text-white">{newOrders.length}</Text>
                <Text className="text-xs font-bold text-indigo-200">New Orders</Text>
              </BlurView>
              <BlurView intensity={35} tint="dark" className="flex-1 rounded-2xl p-3 overflow-hidden border border-white/10">
                <Text className="text-2xl font-extrabold text-white">{restaurant?.menuItems?.length || 0}</Text>
                <Text className="text-xs font-bold text-indigo-200">Menu Items</Text>
              </BlurView>
              <BlurView intensity={35} tint="dark" className="flex-1 rounded-2xl p-3 overflow-hidden border border-white/10">
                <Text className="text-2xl font-extrabold text-white">₹{todayRevenue}</Text>
                <Text className="text-xs font-bold text-indigo-200">Revenue</Text>
              </BlurView>
            </View>
          </View>
        </ImageBackground>

        {/* Verified badge & profile progress */}
        {restaurant ? (
          <View className="px-4 mt-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                {restaurant.name && restaurant.cuisine && restaurant.phone && restaurant.addressLine1 && restaurant.city ? (
                  <>
                    <CheckCircle size={16} color="#059669" />
                    <Text className="text-sm font-extrabold text-emerald-700">Verified Partner</Text>
                  </>
                ) : (
                  <>
                    <Store size={16} color="#d97706" />
                    <Text className="text-sm font-extrabold text-amber-700">Profile Incomplete</Text>
                  </>
                )}
              </View>
              {(() => {
                const fields = [restaurant.name, restaurant.cuisine, restaurant.phone, restaurant.imageUrl, restaurant.addressLine1, restaurant.city, restaurant.state, restaurant.postalCode];
                const filled = fields.filter(Boolean).length;
                const pct = Math.round((filled / fields.length) * 100);
                return (
                  <>
                    <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <View className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                    </View>
                    <Text className="text-xs text-slate-500 mt-1">{pct}% complete ({filled}/{fields.length})</Text>
                  </>
                );
              })()}
            </View>
          </View>
        ) : null}

        <View className="px-4 pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-extrabold text-slate-900">Today's Orders</Text>
            <TouchableOpacity className="flex-row items-center gap-1" onPress={loadData}>
              <RefreshCw size={14} color={colors.brand[600]} />
              <Text className="text-xs font-bold text-indigo-600">Refresh</Text>
            </TouchableOpacity>
          </View>

          {orders.length === 0 ? (
            <View className="items-center justify-center py-16">
              <ChefHat size={48} color="#94a3b8" />
              <Text className="text-base font-bold text-slate-500 mt-4">No orders yet</Text>
              <Text className="text-sm text-slate-400 mt-1">New orders will appear here</Text>
            </View>
          ) : (
            <View className="space-y-4">
              {orders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                const StatusIcon = statusInfo.icon;
                return (
                  <View key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="h-10 w-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${statusInfo.iconColor}15` }}>
                          <StatusIcon size={20} color={statusInfo.iconColor} />
                        </View>
                        <View>
                          <Text className="font-extrabold text-slate-900">{order.user?.name || order.customerName || "Customer"}</Text>
                          <Text className="text-xs text-slate-500">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                          </Text>
                        </View>
                      </View>
                      <View className={`rounded-full px-3 py-1 ${statusInfo.color.split(" ")[1]}`}>
                        <Text className={`text-xs font-extrabold ${statusInfo.color.split(" ")[0]}`}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-slate-700 mt-3">
                      {order.items?.map?.((i) => `${i.name} x${i.quantity}`).join(", ") || `${order.itemCount || 0} items`}
                    </Text>
                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <Text className="text-lg font-extrabold text-slate-900">₹{order.total}</Text>
                      <View className="flex-row gap-2">
                        {order.status === "PENDING" && (
                          <>
                            <TouchableOpacity
                              disabled={updating === order.id}
                              onPress={() => handleStatusChange(order.id, "REJECTED")}
                              className="flex-row items-center gap-1 h-9 px-4 rounded-xl bg-rose-500"
                            >
                              <XCircle size={14} color="#fff" />
                              <Text className="text-xs font-extrabold text-white">
                                {updating === order.id ? "..." : "Reject"}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              disabled={updating === order.id}
                              onPress={() => handleStatusChange(order.id, "ACCEPTED")}
                              className="flex-row items-center gap-1 h-9 px-4 rounded-xl bg-emerald-500"
                            >
                              <CheckCircle size={14} color="#fff" />
                              <Text className="text-xs font-extrabold text-white">
                                {updating === order.id ? "..." : "Accept"}
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                        {order.status === "ACCEPTED" && (
                          <TouchableOpacity
                            disabled={updating === order.id}
                            onPress={() => handleStatusChange(order.id, "PREPARING")}
                            className="flex-row items-center gap-1 h-9 px-4 rounded-xl bg-amber-500"
                          >
                            <CheckCircle size={14} color="#fff" />
                            <Text className="text-xs font-extrabold text-white">
                              {updating === order.id ? "..." : "Start Preparing"}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {order.status === "PREPARING" && (
                          <TouchableOpacity
                            disabled={updating === order.id}
                            onPress={() => handleStatusChange(order.id, "READY_FOR_PICKUP")}
                            className="flex-row items-center gap-1 h-9 px-4 rounded-xl bg-indigo-500"
                          >
                            <CheckCircle size={14} color="#fff" />
                            <Text className="text-xs font-extrabold text-white">
                              {updating === order.id ? "..." : "Mark Ready"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
